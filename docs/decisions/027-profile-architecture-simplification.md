# ADR-027: Profile Architecture Simplification

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**Status:** Accepted
**Date:** 2026-04-20
**Deciders:** Justin, Soren

**Partially supersedes:** ADR-019 (matching cadence — weekly batch → event-based). ADR-019's pipeline mechanics (sensitivity dial, profile evaluation, re-matching logic) survive intact; what changes is *when* the pipeline fires.

**Supersedes:** Memory-scaling proposal (`evryn-team-workspace/shared/projects/product/research/v03-design/2026.03.20 05-memory-scaling.md`) on story structure — `entries` archive dropped, tiered decomposition (`stable_traits` / `transient_state`) dropped. The `story_versions` table and token budgeting survive.

---

## Context

The `profile_jsonb` structure in ARCHITECTURE.md contains several parallel systems that create maintenance overhead, schema complexity, and conceptual confusion:

1. **`gatekeeper_criteria`** — a separate field holding what a gatekeeper is "looking for." But these are just intents. Every user will have intents in v0.3. Maintaining a separate field for gatekeepers means a migration later.

2. **Tiered story decomposition** (`current_synthesis`, `stable_traits`, `transient_state`) — proposed by the memory-scaling research for different decay rates. In practice, the distinction between "transient state" and "current synthesis" is ~80% overlap, and what counts as "stable" is itself a judgment call. The schema shouldn't impose structure on a fundamentally narrative judgment.

3. **Cross-user notes in `profile_jsonb.notes`** — currently tagged with `shareable_with_user: false` as an instruction-level gate. But the raw text loads in every query via `buildPersonContext()`. If Evryn is one confused volley away from leaking "uuid-12345 said he had a small dick," that's not firewalling — it's hoping the model follows instructions.

4. **Weekly batch reflection cadence** (ADR-019) — reflection runs weekly, then profile evaluation, then re-matching Fridays. This was designed for cost efficiency at scale. But it misses the crucial insight: the Evryn instance that just had the conversation is uniquely positioned to evaluate whether something is matching-relevant. A batch process later would have to reconstruct that context.

---

## Decisions

### Decision 1: Collapse `gatekeeper_criteria` into the story — there are only intents

**What:** `gatekeeper_criteria` as a separate field in `profile_jsonb` is eliminated. What we called "gatekeeper criteria" are just the gatekeeper's intents — what they're looking for. Every user has intents. Mark's happen to be served by his inbound email right now, but the moment v0.3 goes live, those same intents pull matches from the entire network.

**Why this matters:** Removing the *notion* of gatekeeper criteria hooks the gatekeeper directly into the main matching circuit from day one. The same intents that surface gold in Mark's inbox will match him with people from other sources in v0.3. No migration, no "gatekeeper criteria → regular intents" conversion — because they were always intents.

**For v0.2 triage:** Evryn reads the gatekeeper's full story (which contains their intents naturally) on every forwarded email and exercises direct judgment. No structured intents needed — at one gatekeeper and ~200 emails/day, the cost of loading the full story every time is negligible (~$2-3/month in extra tokens), and the quality of full-context judgment far exceeds what structured pre-filtering could achieve. The magic IS Evryn reading the whole story and catching surprising connections that structured intents would miss.

**For v0.3+ matching:** Intents become embedded structured artifacts for *retrieval* (narrowing the candidate pool before expensive Opus evaluation). They follow the same pattern as match profiles — narrative understanding is the source of truth; structured derivatives serve specific operational purposes. The story is always authoritative; derived artifacts are views optimized for a specific use. See "Matching cadence" (Decision 4) for when intents get derived and re-derived.

**What this affects:**
- `profile_jsonb` schema — remove `gatekeeper_criteria` field entirely
- `gatekeeper.md` — remove references to gatekeeper_criteria as a separate field
- `gatekeeper-onboarding.md` — write intents into story, not separate criteria
- `triage.md` — classify against the story (Evryn reads the full context and exercises judgment), not a separate criteria field
- `feedback-guidance.md` — design from scratch with this model (hasn't been written yet)
- `buildPersonContext()` in runtime code — remove any separate criteria loading line
- Mark's existing Supabase data — fold any existing `gatekeeper_criteria` content into his story
- Architecture doc `profile_jsonb` section — update the schema spec
- `profile_jsonb` initialization template — drop gatekeeper_criteria object from gatekeeper template

### Decision 2: Story + pending_notes only — no tiered decomposition at the schema level

**What:** The `profile_jsonb` story model is: `story` (narrative text) + `pending_notes` (array of unprocessed observations). That's it. No separate `stable_traits`, no `transient_state`, no `entries` archive, no `current_synthesis` as a distinct field.

The story is a narrative. If Evryn wants to organize it with headings, sections, or any internal structure, she can — per-user, as the story naturally warrants. If one user's story wants a "career arc" section and another's wants "relationship patterns," Evryn decides that during reflection. The schema doesn't impose one-size-fits-all structure on the fundamentally narrative judgment of "how do I represent this human being?"

**Why:** 
- `transient_state` vs. `current_synthesis` is ~80% overlap. The narrative itself conveys decay rates through framing ("Mark has been a documentary filmmaker for 20 years" vs. "Mark is currently overwhelmed with a deadline"). Separate fields force an awkward judgment call on every write ("is this transient or current?") without adding information the narrative doesn't already carry.
- `entries` archive is redundant with the messages table, which already IS the chronological record of interactions. Loading messages on demand (during reflection) gives the same value without duplicating data.
- `stable_traits` as a separate field presumes we can define "stable" — but what's stable changes, and the boundary is itself a judgment call. If matching ever needs a structured view of stable traits, it can be a *derived* artifact (same pattern as match profiles) rather than a schema-level field.

**What survives from the memory-scaling proposal:**
- `story_versions` table for archiving stories — reflection never destroys history
- Token budgeting approach (~500-800 tokens for a typical story)
- The *concept* of different decay rates and loading characteristics — these just live inside the narrative structure rather than as separate fields

**v0.2 operations:** Story gets written during Mark's onboarding conversation. Pending_notes accumulate from subsequent interactions. No consolidation/reflection during v0.2 (~3 weeks). Notes just pile up. When v0.3 launches, the reflection pipeline processes the backlog.

### Decision 3: Cross-user notes — structural firewalling via separate column

**What:** Cross-user feedback (notes from one user about another) moves out of `profile_jsonb.notes` into a separate `cross_user_notes` JSONB column on the `users` table. `buildPersonContext()` never loads this column. The raw cross-user feedback is structurally absent from Evryn's normal conversational context with the subject.

**Format:**

```jsonc
// users.cross_user_notes (separate column, NOT inside profile_jsonb)
[
  {
    "from_user_id": "uuid-12345",       // NEVER store reporter's name
    "context": "interpersonal_feedback", // what kind of assessment
    "content": "reported that subject was dismissive during their meeting",
    "created_at": "2026-05-15T...",
    "reporter_story_datestamp": "2026-05-15T...",  // when was the reporter's story last reflected at time of this note
    "processed": false                   // has reflection evaluated this?
  }
]
```

**Three layers of defense:**
1. **Structural separation** — separate column, excluded from `buildPersonContext()`. The raw text is never in conversational context.
2. **UUID-only** — reporter identified only by user ID, never by name. Even if something leaks, Evryn would say "uuid-12345 reported X," not "Suzy said X."
3. **Reflection-mediated interpretation** — during reflection, Evryn loads the note + the reporter's story (at the time of the note AND current) and exercises full judgment about what (if anything) to persist into the subject's story as a weighted, contextualized insight.

**How reflection processes cross-user notes:**

The Reflection instance loads, for each unprocessed note:
1. The raw note (what was said)
2. The reporter's story at the time they said it (via datestamp → query `story_versions` or current story if no history)
3. The reporter's current story (has anything changed that would recontextualize?)

With all three, Evryn exercises judgment: Is this reporter's assessment reliable in this context? Does their own background or perspective create a bias that should be factored in? What, if anything, belongs in the subject's story?

Example: "Mark (who had just left the military when he wrote this, with notably high punctuality standards) reported that subject is 'always late.' Knowing Mark's frame of reference at the time, and that his current story shows he's significantly relaxed those standards after five years in Hawaii — this likely reflects a style difference rather than chronic unreliability."

Once processed, the insight (if any) lives in the subject's story. The raw note gets marked `processed: true`.

**Settled judgments:** When multiple reporters + the subject themselves confirm something ("this person ghosts"), it becomes settled understanding in the subject's story. Original notes are historical artifacts — `processed: true`, their value has been folded in. Deep Reflection can revisit source material if the story ever seems inconsistent, but day-to-day it's settled.

**`profile_jsonb.notes` still exists** — but only for first-party notes (from operators/introducers, with `shareable_with_user` protocol). Notes FROM other users ABOUT this person move to `cross_user_notes`. The distinction: first-party notes are "here's what Justin told Evryn about Mark when introducing him" (operator context). Cross-user notes are "here's what another user reported about this person after interacting with them" (third-party assessment).

### Decision 4: Matching cadence — event-based, not weekly batch

**What:** Matching re-evaluation is triggered by meaningful change, not by a weekly schedule. The trigger is evaluated by Evryn at the moment she has the richest context — right after she writes a pending_note.

**Partially supersedes ADR-019:** The pipeline mechanics survive (sensitivity dial, profile evaluation gates, re-matching logic, structured pre-filter diffs). What changes is *when* the pipeline fires — from weekly batch to event-triggered.

**The trigger — a non-skippable step when writing pending_notes:**

When Evryn writes a pending_note, she evaluates: "Does this change any matching surfaces?" This means: would consolidating this (and any other pending notes) into the story change this user's match profiles or intents in a way that could affect any match outcome?

If no → note accumulates, reflection waits for token threshold (routine housekeeping).
If yes → Evryn captures everything she thinks is relevant to the matching-surface change, then **triggers a fresh Reflection instance**. The conversational Evryn does NOT do the reflection herself — she's biased by whatever just happened. She's the *detector*; reflection is a clean, purpose-built process with its own guardrails.

**Why event-based beats weekly batch:**
- The conversational Evryn has full context loaded RIGHT NOW — she just had the interaction that produced this insight. No batch process later could evaluate matching relevance better than she can in this moment.
- Event-based means matching surfaces are always fresh. A weekly batch means up to 7 days of stale match profiles.
- Event-based means no wasted work. Weekly batch reflects everyone with any activity — even if 80% of that activity is routine and doesn't affect matching. Event-based only triggers reflection when something matching-relevant actually happened.

**Why re-matching only from the changed user's perspective is sufficient:**

When User B's profile changes and we re-match from B's perspective:
1. B's new profile is searched against all intents → finds people who are now looking for someone like B
2. B's intents are searched against all profiles → finds people B would now want to meet

This catches matches in BOTH directions. We don't need to re-run from User A's perspective, because if A hasn't changed and A's intents match B's new profile, that shows up in search #1 above. The only variable that changed is B — so we only need to search from B's end.

**Light reflection (token-threshold triggered):** When pending_notes accumulate past a token threshold without triggering matching-relevant reflection, routine consolidation fires — fold notes into story, no re-matching. This is housekeeping, not matching.

**Deep Reflection (v0.4+):** Periodic full-history review for drift detection, pattern-finding across time, and error correction. Triggered by message count or time elapsed (not weekly — less frequent, more thorough). The two-pass design (blind read of messages, then compare against story_versions) is a promising approach that needs design work. Deep Reflection is an open design question, not a v0.3 deliverable.

**ADR-019 mechanics that survive unchanged:**
- Sensitivity dial (near-misses have hair trigger, far-misses need large shift)
- Profile evaluation gate (Evryn judges whether match profiles need rewriting, not embedding comparison)
- Structured pre-filter diffs (location/pool changes surface candidates as "new")
- `match_candidates` cache for computing diffs
- First matches for new users are always real-time

---

## Open Design Questions (v0.3+)

### Matching retrieval optimization — facet decomposition and derived intents

The matching-algorithm-design research (`evryn-team-workspace/shared/projects/product/research/2026.03.29 matching-algorithm-design.md`, §"Match Profile Schema Experimentation") establishes that we will test multiple editorial strategies for writing match profiles rather than committing to one approach. Two additional candidate strategies emerged from this session:

1. **Facet decomposition** — instead of one holistic match profile, decompose a user into multiple facet-embeddings (one per significant trait/interest/offering). Matches can surface from any facet, catching connections that a single holistic embedding might bury.

2. **Derived intents** — Evryn infers what people *need* based on reading their full story, beyond what they've explicitly stated. "Based on everything I know about Mark, I think he'd be energized by someone working at the intersection of indigenous rights and media." These get embedded alongside stated intents, surfacing candidates the user would never think to ask for.

Both are candidate strategies within the experimentation framework. The embedding table already supports multiple vectors per user per intent, tagged by schema strategy. These strategies can be tested as soon as synthetic test profiles exist during v0.3 development.

The core question remains open: **what's the right granularity for embedding, and do inferred needs add enough retrieval quality to justify the cost?** This is empirical — we test and measure, not decide theoretically.

### Cross-user trust assessment at scale

At v0.3 scale (few users, few cross-user notes), the Reflection instance loads the full reporter story for every unprocessed note. Maximum nuance, manageable cost.

At v0.4+ scale (thousands of users, popular users with many notes), this becomes expensive. Potential optimization: trust dimensions as a fast-path shortcut (high-trust reporter + clear note → fold in without full story load; low-trust or ambiguous → load reporter's full story for nuanced evaluation). But trust dimensions can't capture frame-of-reference effects (the military-punctuality problem). The full-story approach remains the gold standard for genuinely ambiguous cases.

This is a scale optimization to design when scale demands it, not before.

---

## Consequences

- **v0.2 is cleaner.** Story + pending_notes, full story loaded every triage, no structured intents, no tiered decomposition. Simple, effective, no debt.
- **v0.3 schema migration is smaller.** Instead of migrating from `gatekeeper_criteria` to intents later, we just start writing intents into the story from day one. When matching launches, the story is already the source of truth — derived artifacts are additive.
- **Cross-user privacy is structural, not instructional.** The raw text of third-party feedback never enters normal conversational context. Even multiple simultaneous failures (prompt injection, model confusion, guardrail bypass) can't leak what was never loaded.
- **Matching freshness improves.** Event-based triggers mean match profiles are always current — no 7-day window of stale embeddings.
- **Reflection is clean.** The conversational Evryn detects matching-relevant changes; a fresh Reflection instance does the actual work. Separation of concerns prevents context contamination.
- **The experimentation framework is preserved.** Nothing in this ADR precludes testing multiple match profile strategies. Intents-in-story, facet decomposition, and derived intents are all compatible with the schema experimentation design.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
