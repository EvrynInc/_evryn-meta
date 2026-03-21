# v0.3 Design Proposal: Memory Scaling

> **Type:** Research proposal (AC2)
> **Status:** Draft for AC0/Justin review
> **Date:** 2026-03-20
> **Depends on:** ARCHITECTURE.md (Memory Architecture, Embedding Strategy, Story Model, Conversation Compaction), ADR-016 (curated 4-tier memory), memory-systems research, metacognition-and-self-reflection research
> **Affects:** profile_jsonb structure, pgvector usage, reflection module, matching engine, token budgets

---

## The Problem

v0.2 stores everything about a user in `profile_jsonb` — story, pending_notes, gatekeeper_criteria, verification status. This works at Mark's volume. It will not work when:

1. **Stories grow.** Each conversation appends to `story`. After 100 conversations, the story could be 10,000+ tokens. Loading the full story into every `query()` call eats the context window.
2. **Story history accumulates.** `story_history` preserves every previous version. This is valuable for reflection but becomes massive quickly.
3. **Matching needs embeddings.** Profile-to-intent matching requires vector representations. ARCHITECTURE.md identifies this as a separate and essential need.
4. **Pending notes pile up.** Between reflection cycles, `pending_notes` can grow unbounded.
5. **Multiple users × multiple contexts.** When Evryn needs to reason about a match between two users, she needs both profiles in context simultaneously — doubling the memory pressure.

---

## ADR-016: The Four-Tier Memory Architecture

ADR-016 established curated memory over brute-force history. The four tiers:

| Tier | What | Where | Lifecycle |
|------|------|-------|-----------|
| **Core Memory** | Always-loaded identity context | Identity files (core.md + modules) | Stable, cacheable |
| **Working Memory** | Current conversation + recent observations | SDK context window + pending_notes | Per-session, ephemeral |
| **Long-Term Memory** | Synthesized user understanding | profile_jsonb.story | Updated after conversations, grows over time |
| **Consolidated Memory** | Global patterns, cross-user insights | evryn_knowledge | Updated by reflection module |

This proposal addresses the scaling challenges of tiers 2-4.

---

## Proposal: Tiered Story Architecture

### The Problem with Flat Stories

Currently, `story` is a single text field that grows monotonically. ADR-016 says curated, not brute-force — but the current append-only format with date stamps is effectively brute-force narrative.

### Proposed: Structured Story Decomposition

Replace the flat `story` string with a structured `story` object in `profile_jsonb`:

```jsonc
{
  "story": {
    // The "hot" summary — always loaded, token-budgeted
    "current_synthesis": {
      "who_they_are": "Sarah Chen is a documentary DP with 10 years of Pacific Northwest experience...",
      "what_they_want": "Looking to connect with directors working on environmental docs...",
      "how_they_show_up": "Direct communicator, follows through, values craft over networking...",
      "open_arcs": ["Exploring a move to Portland", "Interested in non-film creative work"],
      "trust_standing": "positive — consistent, honest, responsive",
      "last_synthesized": "2026-04-15T10:00:00-07:00"
    },

    // Stable traits vs. transient states (different decay rates)
    "stable_traits": {
      "personality": "Introverted but passionate when engaged",
      "values": "Craft, authenticity, environmental stewardship",
      "communication_style": "Direct, appreciates specificity",
      "last_updated": "2026-04-10"
    },
    "transient_state": {
      "current_mood": "Optimistic — just wrapped a project she's proud of",
      "bandwidth": "Available — between projects",
      "season_of_life": "Career transition, exploring new directions",
      "last_updated": "2026-04-14"
    },

    // Detailed chronological entries (the "archive" — loaded on demand, not every query)
    "entries": [
      {
        "date": "2026-03-18",
        "source": "triage",
        "content": "First encountered through Mark's inbox. Emailed Mark about...",
        "signals": ["professional", "pacific_northwest", "documentary"]
      },
      {
        "date": "2026-04-02",
        "source": "conversation",
        "content": "First direct conversation with Evryn. Shared that she's been...",
        "signals": ["career_transition", "portland_interest"]
      }
    ]
  },

  // Pending notes — pre-synthesis observations
  "pending_notes": ["2026-04-14: Mentioned she's been reading about permaculture..."],

  // Story history — previous syntheses (for reflection module error-correction)
  "story_history": [
    { "as_of": "2026-04-01", "synthesis": "..." },
    { "as_of": "2026-04-15", "synthesis": "..." }
  ]
}
```

### The Loading Strategy

**Every query:** Load `current_synthesis` + `stable_traits` + `transient_state` + `pending_notes`. This is the "hot" context — token-budgeted to stay under ~1,500 tokens per user.

**On demand:** Load `entries` when Evryn needs to reason about the full history (during reflection, when something contradicts the synthesis, when the user references a past conversation).

**Never in query context:** `story_history` is loaded only by the reflection module for error-correction.

### Token Budget

| Component | Estimated Tokens | Loaded When |
|-----------|-----------------|-------------|
| Core.md | ~1,500 | Every query (cached) |
| current_synthesis | ~500-800 | Every query |
| stable_traits + transient_state | ~200-400 | Every query |
| pending_notes | ~100-300 | Every query |
| Situation/activity modules | ~500-800 | On demand |
| **Total per-query baseline** | **~2,800-3,800** | — |
| Full entries archive | ~2,000-10,000+ | On demand |

At ~3,500 tokens baseline per query, Evryn has ample room for the actual conversation within Claude's context window. When matching (loading two users), that's ~7,000 tokens for both profiles — still very manageable.

---

## pgvector Timeline

### Current State

`evryn_knowledge` has a vector(1536) column for semantic search of Evryn's own knowledge. It's empty — not yet used.

### When pgvector Becomes Necessary

**v0.3 (optional but valuable):** User profile embeddings for matching. At 100-500 users, brute-force comparison (load all profiles, LLM reasons about fit) is feasible but expensive. Embeddings make matching computationally tractable.

**v0.4 (likely necessary):** At 500+ users with multi-intent matching, the combinatorial explosion makes brute-force impossible. Embeddings are required.

### Proposed: `user_embeddings` Table

```sql
CREATE TABLE user_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- What this embedding represents
  embedding_type TEXT NOT NULL CHECK (embedding_type IN (
    'holistic',           -- Full profile — the "grab bag" of who they are
    'intent_professional',-- Professional connection seeking
    'intent_romantic',    -- Romantic connection seeking
    'intent_creative',    -- Creative collaboration seeking
    'intent_practical',   -- Practical needs (plumber, tutor, etc.)
    'intent_custom'       -- User-defined intent category
  )),

  -- The vector
  embedding vector(1536) NOT NULL,

  -- What text was used to generate this embedding
  source_text TEXT NOT NULL,
  -- Important: store the source so we can regenerate if the model changes

  -- Metadata
  generated_from TEXT NOT NULL,  -- 'current_synthesis', 'user_stated_intent', etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  custom_intent_label TEXT,     -- Only for intent_custom type

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_active_embedding UNIQUE (user_id, embedding_type, is_active)
    -- Only one active embedding per user per type at a time
);

-- For similarity search
CREATE INDEX idx_user_embeddings_vector ON user_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_user_embeddings_type ON user_embeddings(embedding_type) WHERE is_active = true;
```

### Multiple Vectors Per User

From ARCHITECTURE.md: "Each user needs both a holistic embedding (the full 'grab bag') and intent-shaped projection embeddings."

The `embedding_type` field supports this. When Evryn matches:
1. Query the seeker's intent embedding against all active provider holistic embeddings (broad search)
2. Query the seeker's intent embedding against provider intent embeddings of the same type (focused search)
3. Union and rank the results
4. Pass top candidates to the analytical layer (LLM judgment on top of vector results)

### Embedding Generation Pipeline

**When to generate/update embeddings:**
- After each story synthesis (reflection cycle updates the synthesis → regenerate embeddings)
- When a user explicitly states a new intent ("I'm looking for a creative collaborator")
- When Evryn identifies a new intent from conversation (implicit signal)

**How:**
- Generate text descriptions from the structured story (current_synthesis for holistic, stated intents for intent-specific)
- Call the embedding API (Anthropic or OpenAI — build decision)
- Store in user_embeddings, mark previous version as `is_active = false`

**Cost:** Embedding generation is cheap (~$0.0001 per call). The expensive part is the matching queries (vector similarity search). At Supabase free tier, pgvector is available but may have performance limits above ~10K vectors.

---

## Reflection Module Design

### What It Does

From ARCHITECTURE.md: "Evryn's error-correction layer. Periodically re-examines previous stories against raw conversation data, catching errors compounded through successive compactions."

### Two Scopes (from metacognition research)

1. **User reflection:** Re-examine a specific user's story. Is it accurate? Has something changed? Are there contradictions between the synthesis and recent entries?

2. **Self-reflection:** Re-examine Evryn's own patterns. Am I consistently wrong about certain types of people? Are my confidence scores calibrated? What patterns am I missing?

### Proposed Implementation (v0.3)

**User reflection** runs as a care_queue item:
- After every 5th conversation with a user, schedule a reflection
- Load the full entries archive + current_synthesis + pending_notes
- Evryn re-reads the raw material and produces a new current_synthesis
- Compare old and new synthesis — flag significant changes
- Archive old synthesis to story_history

**Self-reflection** runs weekly (v0.4):
- Query reasoning_traces with outcomes
- Analyze calibration: confidence vs. actual outcomes
- Identify systematic biases or blind spots
- Write findings to evryn_knowledge (consolidated memory tier)

### The Compaction-of-Compactions Problem

ARCHITECTURE.md flags this: "Over time, stories are built from stories, not from raw messages. This can compound errors."

**Mitigation:** The entries archive preserves the raw observations. Reflection periodically re-reads *entries*, not just the previous synthesis. This prevents error compounding — the reflection module always has access to the source material, not just the compressed version.

**When entries themselves get too long:** At some point (hundreds of entries), even the archive becomes unwieldy. Proposed: entries older than 6 months get consolidated into a "historical summary" entry, with the raw entries moved to cold storage (a separate table or exported). The most recent 6 months always stay as raw entries.

---

## profile_jsonb Pressure Relief

### The Core Concern

Everything in `profile_jsonb` is loaded as a single JSONB column. At scale:
- The column gets physically large (affecting query performance)
- Partial loading requires JSONB path queries (ugly, brittle)
- RLS applies to the row, not to JSONB subfields

### Proposed Migration Path

**v0.3:** Keep everything in `profile_jsonb` but adopt the structured story decomposition above. The "hot" fields (current_synthesis, stable_traits, transient_state) are what the trigger loads for person context. The rest stays in the same column but isn't extracted per-query.

**v0.4 (if needed):** Break `profile_jsonb` into separate columns or even a separate `user_profiles` table:
- `story_synthesis` (TEXT — the hot context)
- `story_entries` (JSONB — the archive)
- `story_history` (JSONB — previous syntheses)
- `gatekeeper_criteria` (JSONB — separate concern)
- `communication_preferences` (JSONB — separate concern)

This is a straightforward migration — the data is already structured in JSONB subkeys. The columns just make partial loading native.

**v0.5+ (if needed):** Move story entries to a separate `user_story_entries` table with proper indexing. This would be necessary if entries per user routinely exceed hundreds.

---

## Open Questions for Justin/AC0

1. **Story synthesis frequency:** Proposed: after every conversation (synthesize pending_notes into current_synthesis). But this means an extra Anthropic API call per conversation. At Sonnet pricing, that's ~$0.01 per synthesis. Worth it for story freshness? Or batch to end-of-day?

2. **Embedding model choice:** Anthropic doesn't have a public embedding API (as of March 2026). Options: OpenAI's `text-embedding-3-small` (1536 dimensions, cheap, proven), or Voyage AI (Anthropic-recommended). ADR-006 (intentional dependency selection) applies — evaluate on merits, not brand loyalty.

3. **Reflection module priority:** The BUILD doc says "v0.3 or earlier if feasible." Is this in scope for the v0.3 build, or is it a stretch goal? The structured story decomposition can be built without the reflection module — manual synthesis (Evryn updates the story during conversations) works for a while.

4. **story_history retention:** How many historical syntheses to keep? Proposed: last 10 syntheses. Older ones are valuable for understanding how Evryn's view of someone evolved, but the marginal value drops fast.
