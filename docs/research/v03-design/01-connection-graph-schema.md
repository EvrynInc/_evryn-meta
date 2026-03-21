# v0.3 Design Proposal: Connection & Relationship Graph Schema

> **Type:** Research proposal (AC2)
> **Status:** Draft for AC0/Justin review
> **Date:** 2026-03-20
> **Depends on:** ADR-018 (bilateral matching, status lifecycle), ARCHITECTURE.md (Data Model, open design questions)
> **Affects:** Matching engine, trust architecture, monetization, proactive behavior, multi-gatekeeper

---

## The Problem

ARCHITECTURE.md flags the graph/connection schema as an *open design question* with four unresolved sub-questions:

1. One table or two? (Graph edges vs. connection events overlap but serve different purposes)
2. How to model multi-dimensional, bidirectional matching?
3. How granular on relationship types and trust levels from day one?
4. Does "discovered" create a graph edge, or only "accepted"?

This proposal answers all four.

---

## Design Principles (from the docs)

- **Triage details stay on emailmgr_items; the graph is general** (ADR-018)
- **Connection events are the billable unit** (ARCHITECTURE.md)
- **Graph edges can exist without connection events** (known relationships, vouching)
- **A connection event always creates/strengthens a graph edge** (ARCHITECTURE.md)
- **Profile-to-intent matching, not person-to-person** (technical-vision spoke)
- **Build for one, structure for many** — second gatekeeper = config change, not rewrite
- **User isolation is absolute** — the graph is Evryn's internal intelligence, never exposed raw to users

---

## Proposal: Two Tables

**Answer to Q1: Two tables.** They serve fundamentally different purposes and have different lifecycles. Collapsing them would conflate intelligence (what Evryn knows about relationships) with commerce (what Evryn brokered and got paid for).

### Table 1: `relationships` — Evryn's Relationship Intelligence

This is the graph. Evryn's map of how people are connected — whether she brokered it or not.

```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The two people (unordered — use CHECK to enforce user_a_id < user_b_id for dedup)
  user_a_id UUID NOT NULL REFERENCES users(id),
  user_b_id UUID NOT NULL REFERENCES users(id),

  -- How Evryn knows about this relationship
  source TEXT NOT NULL CHECK (source IN (
    'brokered',        -- Evryn introduced them (linked to a connection_event)
    'declared',        -- Someone told Evryn ("I know Sarah")
    'inferred',        -- Evryn figured it out from context
    'vouched',         -- One user vouched for the other
    'gatekeeper_triage' -- Discovered through triage (sender → gatekeeper)
  )),

  -- Evryn's understanding of this relationship (narrative, not numeric)
  relationship_context JSONB NOT NULL DEFAULT '{}',
  -- Example:
  -- {
  --   "type_labels": ["professional", "film_industry"],
  --   "strength": "strong",           -- weak/moderate/strong/deep (Evryn's assessment)
  --   "direction": "bidirectional",   -- or "a_to_b" / "b_to_a" for asymmetric
  --   "evryn_notes": "Mark mentored Alex on his first documentary. Close relationship.",
  --   "trust_signal": "positive",     -- positive/neutral/cautionary/negative
  --   "active": true                  -- relationship is current, not historical
  -- }

  -- Provenance
  source_user_id UUID REFERENCES users(id),  -- Who told Evryn? (null if inferred)
  source_connection_event_id UUID REFERENCES connection_events(id),  -- If brokered

  -- Timestamps
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Dedup constraint
  CONSTRAINT unique_relationship UNIQUE (user_a_id, user_b_id),
  CONSTRAINT ordered_users CHECK (user_a_id < user_b_id)
);

-- Indexes for graph traversal
CREATE INDEX idx_relationships_user_a ON relationships(user_a_id);
CREATE INDEX idx_relationships_user_b ON relationships(user_b_id);
CREATE INDEX idx_relationships_source ON relationships(source);
```

**Why `user_a_id < user_b_id`:** Prevents duplicate edges (A→B and B→A). Direction is captured in `relationship_context.direction` when asymmetric.

**Answer to Q4: "discovered" creates a graph edge immediately.** When triage identifies a gold contact for a gatekeeper, a `gatekeeper_triage` edge is created. This edge exists even if the gatekeeper never acts on it — it's Evryn's intelligence about a relationship she observed. If the gatekeeper confirms (matched), the edge strengthens. If the gold contact later becomes a full user matched with someone else entirely, the edge still provides context (redundancy filtering, contextual color).

**Answer to Q3: Start with narrative, not granular types.** `relationship_context` is a JSONB blob with `type_labels` (array of free-text tags) and `strength` (constrained enum). This avoids the trap of pre-defining a taxonomy that doesn't match reality. Evryn writes what she knows; the structure emerges from real data. The constrained fields (`source`, `strength`, `trust_signal`) give us queryable dimensions without forcing premature categorization.

### Table 2: `connection_events` — What Evryn Brokered

This is the commerce layer. Every time Evryn actively introduces two people, that's a connection event — the billable unit.

```sql
CREATE TABLE connection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The two people being connected
  seeker_id UUID NOT NULL REFERENCES users(id),     -- Person who needs something
  provider_id UUID NOT NULL REFERENCES users(id),    -- Person who can provide it

  -- What kind of connection (intent-based, not person-based)
  intent_context JSONB NOT NULL DEFAULT '{}',
  -- Example:
  -- {
  --   "seeker_intent": "Looking for a documentary DP in Seattle",
  --   "provider_fit": "Experienced DP, worked with Mark on two projects",
  --   "match_rationale": "Evryn's narrative explaining why this match matters",
  --   "match_dimensions": ["professional", "creative_collaboration", "geographic"],
  --   "confidence": "high"
  -- }

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN (
    'discovered',       -- Evryn identified a potential match
    'proposed_seeker',  -- Evryn proposed to the seeker (teaser)
    'proposed_provider',-- Evryn proposed to the provider (teaser)
    'both_interested',  -- Both sides opted in to learn more
    'sharing',          -- Progressive information exchange in progress
    'pending_payment',  -- Both agreed, awaiting payment
    'connected',        -- Introduction made, payment complete
    'completed',        -- After-care done, feedback collected
    'declined_seeker',  -- Seeker said no
    'declined_provider',-- Provider said no
    'withdrawn'         -- Evryn withdrew the match (safety, changed assessment)
  )),

  -- Payment (v0.3)
  seeker_payment_cents INTEGER,          -- What the seeker paid
  provider_payment_cents INTEGER,        -- What the provider paid
  payment_status TEXT CHECK (payment_status IN (
    'not_applicable', 'pending', 'completed', 'refunded', 'partial_refund'
  )),

  -- Provenance — how was this match discovered?
  discovery_source TEXT NOT NULL CHECK (discovery_source IN (
    'triage',           -- Originated from gatekeeper triage
    'matching_engine',  -- Evryn's matching algorithm found it
    'user_request',     -- User asked to be connected to someone specific
    'proactive',        -- Evryn noticed an opportunity and proposed it
    'reframed'          -- Existing connection, new context (friend → hire)
  )),
  source_emailmgr_item_id UUID REFERENCES emailmgr_items(id),  -- If from triage

  -- Audit trail (same pattern as ADR-018 lifecycle metadata)
  lifecycle JSONB NOT NULL DEFAULT '[]',
  -- Each entry: { "status": "...", "at": "timestamptz", "note": "..." }

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_connection_events_seeker ON connection_events(seeker_id);
CREATE INDEX idx_connection_events_provider ON connection_events(provider_id);
CREATE INDEX idx_connection_events_status ON connection_events(status);
CREATE INDEX idx_connection_events_discovery ON connection_events(discovery_source);
```

**Why seeker/provider instead of user_a/user_b:** Connection events are directional by nature — someone needs something, someone can provide it. The relationship table is undirected (it's a general graph); the connection event is directed (it's a transaction). This also supports the profile-to-intent matching model: the seeker's *intent* is matched against the provider's *profile*, and vice versa.

**The lifecycle mirrors the Evryn Dance** (user-experience spoke): discovered → proposed (teaser) → both interested → sharing (progressive disclosure) → payment → connected → completed (after-care). Each step through the approval gate. Each step recorded in `lifecycle` JSONB (same pattern as ADR-018's emailmgr_items).

---

## How Triage Feeds the Graph (v0.2 → v0.3 Bridge)

ADR-018 established that triage details stay on `emailmgr_items`. The graph is general. Here's how they connect:

1. **During v0.2 triage:** When Evryn classifies a sender as gold for Mark, she creates:
   - A `relationships` edge (source: `gatekeeper_triage`, strength: depends on classification)
   - The `emailmgr_items` record tracks the triage-specific lifecycle (ADR-018)

2. **When the gatekeeper confirms (matched):** The relationship edge strengthens. If this was a brokered introduction, a `connection_events` record is created (discovery_source: `triage`), linked back to the emailmgr_item.

3. **In v0.3:** When Evryn does outreach to cast-offs, the same pattern applies — she may discover that a cast-off is a great match for *someone else*, creating a new connection_event with discovery_source: `matching_engine`.

**The emailmgr_items → connection_events link** (`source_emailmgr_item_id`) creates full provenance: this match exists because of an email forwarded by Mark on March 15.

---

## Answer to Q2: Multi-Dimensional Bidirectional Matching

The schema supports profile-to-intent matching through the `intent_context` JSONB on connection_events. But the *computational* matching happens in a separate embedding layer (see the Memory Scaling proposal for pgvector timeline).

The key insight: the graph schema doesn't *do* the matching — it *records* the matching. The matching engine queries:
1. User embeddings (profile vectors, intent vectors) from a future `user_embeddings` table
2. The relationship graph (for redundancy/safety filtering and contextual color)
3. Constraint filters (geography, hard stops)

And produces connection_event candidates. The graph schema proposed here is designed to be the *output* of that matching engine, not the engine itself.

---

## Four Primary Functions of the Graph

From ARCHITECTURE.md — how the `relationships` table serves each:

1. **Redundancy filtering:** Before proposing a match, query `relationships` for existing edges between the two users. If they already know each other (source: declared, inferred), skip unless the connection is being reframed.

2. **Safety filtering:** Query `relationships` + `relationship_context.trust_signal` to prevent problematic matches (e.g., don't introduce someone to their current employer for romance). The `trust_signal` field on edges complements the per-user trust assessment.

3. **Trust calibration:** Vouching creates a `vouched` edge. When evaluating a new user's initial trust standing, traverse the graph to find vouching paths from highly-trusted users. Proximity in the graph is a trust signal.

4. **Contextual color:** During or after introductions, query `relationships` for shared connections. "You both know Jamie from the fellowship" adds warmth and context.

---

## Migration Path

**For v0.2 (now):** Create both tables but only populate `relationships` during triage (gatekeeper_triage edges). `connection_events` stays empty until v0.3 matching goes live.

**For v0.3 (build):** Wire the matching engine to create connection_events. Wire the Evryn Dance lifecycle. Wire payment integration (Stripe).

**For v0.4 (scale):** Add graph traversal queries for trust calibration and redundancy filtering at scale. Consider materialized views or graph-specific indexing if traversal becomes a bottleneck.

---

## Open Questions for Justin/AC0

1. **Should `relationships` edges ever be deleted?** Proposed: no. They can be marked `active: false` but never removed — Evryn's memory of connections is permanent (trust imprint principle). Even after account deletion, the pseudonymized hash could anchor a ghost edge.

2. **Do we need a separate `vouches` table?** Proposed: no. Vouching is a relationship source (`source: 'vouched'`) with metadata in `relationship_context`. A separate table adds complexity without clear benefit at this scale.

3. **Connection event status granularity:** The lifecycle above maps to the Evryn Dance. Is `sharing` (progressive information exchange) one status, or should it be `sharing_round_1`, `sharing_round_2`, etc.? Proposed: one status, with the rounds tracked in `lifecycle` JSONB entries. Simpler schema, same auditability.

4. **Free vs. paid connections:** The business model spoke defines which connections are free (gatekeeper↔gold contact) vs. paid (matching-created). Should `connection_events` distinguish these? Proposed: yes, via a `pricing_model` field (free_gatekeeper, free_first_recruited, paid_match). This lets us query revenue metrics cleanly.

---

## What This Proposal Does NOT Cover

- **Embedding schema** (user_embeddings table) — covered in the Memory Scaling proposal
- **Matching algorithm** — that's the engine; this is the data model it reads from and writes to
- **Trust graph as a separate concern** — covered in the Trust Architecture at Scale proposal
- **Payment integration** — Stripe Connect wiring is a build concern, not a schema concern
