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

3. **`profile_jsonb.notes` array (current design)** — the existing architecture has a `notes` array inside `profile_jsonb` for operator introductions and cross-user feedback. Because `profile_jsonb` loads in total via `buildPersonContext()`, everything in this array is in Evryn's conversational context — including cross-user feedback tagged `shareable_with_user: false`. If Evryn is one confused volley away from leaking "uuid-12345 said he was bad in bed," that's not firewalling — it's hoping the model follows instructions. Additionally, maintaining a separate notes array alongside the story creates a parallel system that drifts — everything should flow through the same path (pending_notes → story).

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

**v0.3 migration is zero** — we're writing intents into the story from day one. When matching launches, the story is already the source of truth; derived artifacts are additive.

### Decision 2: Story + pending_notes — the only two fields

**What:** The `profile_jsonb` story model is: `story` (narrative text) + `pending_notes` (array of unprocessed observations). That's it. No separate `stable_traits`, no `transient_state`, no `entries` archive, no `current_synthesis` as a distinct field, and no separate `notes` array.

**Everything flows through pending_notes → story.** If Justin tells Evryn something about Mark during introduction, that becomes a pending_note: "Justin introduced Mark as a documentary filmmaker who runs August Island Pictures. [shareable_with_user]." The `shareable_with_user` tag tells Evryn she can freely reference this in conversation with Mark ("Justin told me you're a documentary filmmaker"). During reflection, it folds into the story.

The story is a narrative. If Evryn wants to organize it with headings, sections, or any internal structure, she can — per-user, as the story naturally warrants. If one user's story wants a "career arc" section and another's wants "relationship patterns," Evryn decides that during reflection. The schema doesn't impose one-size-fits-all structure on the fundamentally narrative judgment of "how do I represent this human being?"

**Why:**
- `transient_state` vs. `current_synthesis` is ~80% overlap. The narrative itself conveys decay rates through framing ("Mark has been a documentary filmmaker for 20 years" vs. "Mark is currently overwhelmed with a deadline"). Separate fields force an awkward judgment call on every write ("is this transient or current?") without adding information the narrative doesn't already carry.
- `entries` archive is redundant with the messages table, which already IS the chronological record of interactions. Loading messages on demand (during reflection) gives the same value without duplicating data.
- `stable_traits` as a separate field presumes we can define "stable" — but what's stable changes, and the boundary is itself a judgment call. If matching ever needs a structured view of stable traits, it can be a *derived* artifact (same pattern as match profiles) rather than a schema-level field.
- A separate `notes` array with provenance tracking is a parallel system to the story. Notes should flow through the same path as everything else: pending_note → reflection → story. The `shareable_with_user` tag can live inline in the pending_note or in the story itself.

**What survives from the memory-scaling proposal:**
- `story_versions` table for archiving stories — reflection never destroys history
- Token budgeting approach (~500-800 tokens for a typical story)
- The *concept* of different decay rates and loading characteristics — these just live inside the narrative structure rather than as separate fields

**v0.2 operations:** Schema has both `story` and `pending_notes` fields from the start (no migration when Reflection arrives), but `story` stays empty — conversational Evryn is not in the business of writing stories. Everything goes to pending_notes: Justin's introduction, onboarding observations, triage observations, all of it. Evryn appends; that's all she does in conversation. Story only gets written when Reflection exists (v0.3). Until then, every query loads the (empty) story + all pending_notes, and Evryn works from the notes directly.

### Decision 3: Cross-user notes — structural firewalling via separate column

**What:** Cross-user feedback (notes from one user about another) lives in a separate `cross_user_notes` JSONB column on the `users` table — outside `profile_jsonb` entirely. `buildPersonContext()` never loads this column. The raw cross-user feedback is structurally absent from Evryn's normal conversational context with the subject.

**Format:**

```jsonc
// users.cross_user_notes (separate column, NOT inside profile_jsonb)
[
  {
    "from_user_id": "uuid-12345",       // NEVER store reporter's name — UUID only
    "context": "interpersonal_feedback", // what kind of assessment
    "content": "reported that subject was dismissive during their meeting",
    "created_at": "2026-05-15T...",
    "reporter_story_datestamp": "2026-05-15T...",  // datestamp for finding reporter's story-at-time
    "processed": false                   // has reflection evaluated this?
  }
]
```

**Four layers of defense:**
1. **Structural separation** — separate column, excluded from `buildPersonContext()`. The raw text is never in conversational context.
2. **UUID-only** — reporter identified only by user ID, never by name. Even if something leaks, Evryn would say "uuid-12345 reported X," not "Suzy said X."
3. **Blind write** — when Evryn writes a cross-user note (e.g., Mark gives feedback about a contact), the tool is append-only: it takes a target user_id and content, writes to `cross_user_notes`, and returns confirmation. **Evryn never loads the target user's profile during this operation.** User isolation is absolute — the Evryn instance in Mark's context never sees the contact's profile, story, or existing notes. This is critical: we never want an Evryn session loaded into two users' contexts simultaneously. That WILL break.
4. **Reflection-mediated interpretation** — during reflection (single-user scoped on the *subject*), Evryn loads the note + the reporter's story and exercises full judgment about what, if anything, to persist into the subject's story as a sanitized insight.

**How cross-user feedback flows into the story:**

The raw note is source material. What actually enters the subject's story is a **sanitized insight** — Evryn's judgment about what the note means, stripped of source identification and raw language.

The story never says "uuid-1234 said X." It says something like:
- "Interpersonal feedback suggests this person can come across as brusque in formal settings."
- "Multiple sources have reported a pattern of late arrivals — this appears confirmed."
- "Some reports of dismissive behavior, though context suggests this may reflect style differences rather than character."

This sanitized insight is safe for conversational context — it carries the signal (affects how Evryn talks to them and matches them) without the source (who said it, what exactly they said). The raw notes are the source material; the story carries the product of having processed them.

**How reflection processes cross-user notes:**

The Reflection instance loads, for each unprocessed note:
1. The raw note (what was said)
2. The reporter's story at the time they said it (datestamp → query for closest story version or current story if no history exists yet)
3. The reporter's current story (has anything changed that would recontextualize?)

With all three, Evryn exercises judgment: Is this reporter's assessment reliable in this context? Does their own background or perspective create a bias? What sanitized insight, if any, belongs in the subject's story?

Example: "Mark (who had just left the military when he wrote this, with notably high punctuality standards) reported that subject is 'always late.' Knowing Mark's frame of reference at the time, and that his current story shows he's significantly relaxed those standards after five years in Hawaii — this likely reflects a style difference rather than chronic unreliability. Story note: 'Some reports of tardiness, though context suggests cultural/style mismatch rather than unreliability.'"

Once processed, the sanitized insight lives in the story. The raw note gets marked `processed: true`. The note is now a historical artifact — its value has been folded in.

**Settled judgments:** When multiple reporters + the subject themselves confirm something ("this person ghosts"), it becomes settled understanding in the subject's story. Original notes are `processed: true`, their value folded in. Deep Reflection can revisit source material if the story ever seems inconsistent, but day-to-day it's settled.

**Cross-user notes also trigger matching re-evaluation:** When Evryn writes a cross-user note via blind write, this counts as new information on the target user. The matching cadence (Decision 4) picks this up — if the note is processed during reflection and the sanitized insight changes matching surfaces, re-matching fires for that user.

**Trust assessment at scale (open question, v0.4+):** At v0.3 scale (few users, few cross-user notes), the Reflection instance loads the full reporter story for every unprocessed note. Maximum nuance, manageable cost. At v0.4+ scale (thousands of users, popular users with many notes), this becomes expensive. Potential optimization: trust dimensions as a fast-path shortcut (high-trust reporter + clear note → fold in without full story load; low-trust or ambiguous → load reporter's full story). But trust dimensions can't capture frame-of-reference effects (the military-punctuality problem). The full-story approach remains the gold standard for genuinely ambiguous cases. This is a scale optimization to design when scale demands it, not before.

**Before Reflection exists (v0.2):** Everything is a pending_note. Cross-user feedback (Mark's feedback about contacts) gets tagged inline: `[cross-user, not shareable_with_user]`. This is acceptable risk for ~3 weeks with a single gatekeeper — no contacts are talking to Evryn yet. **v0.3 launch checklist item:** Before Evryn has her first conversation with any contact who has cross-user notes from the v0.2 period, run Reflection on their profile to process those notes into sanitized story insights. Don't let Evryn talk to someone whose pending_notes contain raw cross-user feedback.

### Decision 4: Matching cadence — event-based, not weekly batch

**What:** Matching re-evaluation is triggered by meaningful change, not by a weekly schedule. The trigger is evaluated by Evryn at the moment she has the richest context — right after she writes a pending_note.

**Partially supersedes ADR-019:** The pipeline mechanics survive (sensitivity dial, profile evaluation gates, re-matching logic, structured pre-filter diffs). What changes is *when* the pipeline fires — from weekly batch to event-triggered.

**The trigger — a non-skippable step when writing pending_notes:**

When Evryn writes a pending_note, she evaluates: "Does this change any matching surfaces?" This means: would consolidating this (and any other pending notes) into the story change this user's match profiles or intents in a way that could affect any match outcome?

If no → note accumulates, reflection waits for token threshold (routine housekeeping).
If yes → Evryn captures everything she thinks is relevant to the matching-surface change, then **triggers a fresh Reflection instance**. The conversational Evryn does NOT do the reflection herself — she's biased by whatever just happened. She's the *detector*; reflection is a clean, purpose-built process with its own guardrails and instructions. The wrong Evryn doing reflection is too important to risk.

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

Both are candidate strategies within the experimentation framework. The embedding table already supports multiple vectors per user per intent, tagged by schema strategy. These strategies can be tested as soon as synthetic test profiles exist during v0.3 development — and we should run constant experiments (A/B/C/D/E testing multiple approaches simultaneously) to discover empirically what produces the best matches, rather than committing theoretically.

The core question remains open: **what's the right granularity for embedding, and do inferred needs add enough retrieval quality to justify the cost?** This is empirical — we test and measure, not decide theoretically.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
