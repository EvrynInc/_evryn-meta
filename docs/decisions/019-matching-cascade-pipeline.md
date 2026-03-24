# ADR-019: Matching Cascade Pipeline

**Status:** Accepted
**Date:** 2026-03-24
**Deciders:** Justin, AC2

## Context

When Evryn's matching pipeline launches (v0.3), a new user being onboarded triggers vector searches against all existing intents. That's the straightforward case. The harder question: what happens when an *existing* user's profile changes?

A was onboarded last week but didn't get a match. B onboards today, and A comes up as a possibility — but Evryn needs to ask A a question first. A answers, and it makes her a match for B. Great. But now A's profile has changed, which changes her embedding. With this new info, A might be a better match for someone she wasn't matched with before. And people who should have matched with A might have been missed because of the information gap.

The naive solution — re-run everyone against everyone on every profile change — is O(N) Opus evaluations per update. At 100 million users with thousands of daily updates, that's ruinous.

The question: how do we catch matches that new information unlocks, without re-evaluating the entire database every time someone's story changes?

## Decision

### The Reflection → Re-matching Pipeline

The full chain from "new information arrives" to "new matches discovered" has three stages: reflection, profile evaluation, and re-matching. Each stage gates the next — downstream work only fires when the upstream stage produced meaningful change.

**Stage 1: Reflection (weekly batch, 50% cost via Anthropic batch API)**

During the week, Evryn converses with users and captures insights in `pending_notes`. Conversations, incoming third-party info, and other interactions are tracked in normal DB tables (messages, etc.). No reflection runs during the week — insights accumulate.

Weekly, a batch job queries the DB for all users with any activity since their last reflection. For each user, one Opus call: old story + pending_notes + recent interactions → new story. This single pass does everything — folds in new information AND re-examines old conclusions in light of new context. These are not two separate operations; when Evryn reads the old story alongside new info, she naturally does both.

**Why weekly, not per-interaction:** Opus can read story + accumulated pending_notes just fine without a story rewrite after every conversation. Weekly rewrites save a huge number of Opus calls. The story doesn't need to be "current" between rewrites — Evryn loads both story and pending_notes during conversations and interprets them together.

**Why "any activity" as the trigger:** Even seemingly minor activity can be meaningful in aggregate or in context. A DB query for "any activity since last reflection" is cheap. Writing filtering logic to distinguish "meaningful" from "not meaningful" activity is complex, fragile, and risks missing things. Let Opus make that judgment during reflection — that's what it's good at. If the new activity was trivial, reflection produces a story that barely changed, and downstream gates catch it.

**What pending_notes are:** Insights Evryn noticed during conversations — things she thinks are worth remembering. NOT an activity log. The trigger for reflection is "any activity" (DB query), not `pending_notes.length > 0`. A user could have activity (received a proactive outreach, had a brief exchange) with no pending_notes. Reflection still runs — Evryn might see patterns in the raw interactions that in-conversation Evryn missed. That's the whole point of stepping back.

**What pending_notes are NOT:** An entry for every interaction. "Conversation ID XYZ, no new insights" should never be a pending_note. That's just noise that costs output tokens to write and input tokens to read. The database already tracks activity.

**Cadence:** Weekly until cost-prohibitive. More often if optimizations make it cheaper. At true scale (500M users, 20M active), batch processing time scales linearly — that's a scale-engineering problem (priority queuing, parallelism, sharding by urgency), not an architectural one.

**Stage 2: Profile evaluation (chained batch after reflection completes)**

Each user has multiple match profiles: 1 global (holistic "grab bag" for cross-domain surprise matches) + N intent-curated profiles (one per active intent). These are separate artifacts derived from the story, written for embedding — distinct from `profile_jsonb.story` itself.

After reflection rewrites stories, Evryn evaluates each existing match profile against the new story. The gate is Evryn's judgment, not an embedding comparison. For each profile, she reads the new story + old profile and decides: "does this need updating?" If no — minimal output tokens, move on. If yes — she rewrites the profile and it gets re-embedded.

**Why Evryn's judgment instead of embedding comparison:** An embedding-comparison gate requires embedding the new story (cheap), comparing against a baseline (trivial math), then maybe rewriting anyway. But the global story embedding can barely change while one specific intent profile needs a major update — the comparison is at the wrong level of granularity. Evryn reading new story + old profile and deciding is the same input cost, catches nuance that embedding distance misses, and Opus is excellent at this kind of judgment call. Output tokens are the expensive part — "no change needed" is nearly free.

**Important: compare against baseline, not previous version.** If we tracked cumulative drift (2% + 1% + 3% + 1% = 7%), we'd need to compare each profile against the last version that actually triggered a rewrite. But since the gate is Evryn's judgment rather than a numeric threshold, this is handled naturally — she's comparing against the extant profile, which IS the baseline.

**Stage 3: Re-matching (batch after all profile evaluation completes)**

For all users whose profile embeddings changed, run the re-matching pipeline. Don't trigger per-user during reflection — wait until all reflection and profile evaluation finishes for the cycle, then batch.

### Two-phase re-evaluation with structured filter diffs and cosine sensitivity dial

The matching pipeline has two phases that operate on different data and fail in different ways. The re-matching strategy leverages this:

**Phase 1: Structured pre-filters (location, profession, hard constraints)**

Structured data changes affect which *candidate pools* a person appears in. If A was in the Seattle pool and moves to NYC, she doesn't appear as a "returning candidate" for NYC searches — she appears as a **new candidate**. The diff between old top-K and new top-K catches this automatically. She gets a fresh Opus evaluation as if she'd never been seen before.

This handles the dealbreaker-flip case. If the previous analytical score was 20/100 because of one structural dealbreaker (wrong city, wrong industry), and that structured field just changed, the pool shift surfaces her as new. No threshold tuning needed, no old reasoning to read.

**Phase 2: Vector similarity (personality, values, communication style, resonance)**

Embedding changes affect a person's *ranking within pools they were already in*. For returning candidates (still in the top-K after re-search), the question is: did the pairwise vector similarity improve enough to justify re-evaluation?

A dot product comparison between the old and new pairwise similarity scores is trivially cheap and deterministic. This replaces any token-expensive approach like reading old analytical reasoning.

**The sensitivity dial: previous analytical score modulates the threshold.**

Not all returning candidates deserve the same trigger sensitivity:

- **Near-misses (previous score ~80-90+):** Hair trigger. Even a small cosine improvement is worth re-evaluating — they were almost there, and a nudge might push them over.
- **Mid-range (previous score ~50-70):** Moderate threshold. Needs a meaningful shift to justify re-evaluation.
- **Far-misses (previous score below ~40):** High threshold. Needs a large shift. If the pairwise similarity barely moved and the previous analysis found deep incompatibility, one new piece of info isn't going to flip that.

Exact thresholds are tuning parameters, not architectural decisions — they'll be calibrated empirically once real matching data exists.

### What runs per profile update

1. Vector search — A's updated profile embeddings against all intents, and all profiles against A's updated intent embeddings. Only A's searches, not everyone's. Milliseconds each, even at 100M users.
2. Diff against cached top-K per intent. New candidates get fresh Opus evaluation. Dropped candidates need no action.
3. For returning candidates: pairwise cosine comparison (free) filtered through the sensitivity dial (previous analytical score). Re-evaluate only where the composite signal justifies it.
4. Total Opus calls per profile update: single digits.

### First matches are always real-time

When a new user onboards, the full pipeline runs synchronously at full price: profile writing, embedding, vector search, Opus evaluation. This is customer capture — the user is waiting, the experience matters, and the cost of one real-time pipeline is negligible. The batch pipeline described above is for background re-matching of existing users whose profiles evolved.

### What we miss (and why it's acceptable)

The narrow case that could slip through: a dealbreaker that lives in the *story text* (not structured fields) and is poorly represented in the embedding, such that the cosine barely moves when it resolves. Example: "A mentioned she has a restraining order against B's business partner" — analytical, not structural, and too specific for embedding geometry.

This is acceptable because:
- It's extremely rare (most dealbreakers are structural or personality-level)
- The next reflection cycle accumulates more info, the embedding shifts further, and we catch it
- Missing a match by one reflection cycle is low cost; re-evaluating thousands of candidates per update is high cost
- At true scale, this edge case can be addressed with a periodic full-rescan at low priority (weekly, off-peak) that catches anything the event-driven pipeline missed

## Alternatives Considered

### Uncertainty breadcrumbs (rejected)

The analytical layer captures what it was uncertain about ("I'd match these two if I knew whether A is open to relocating"), and re-evaluates when new info touches an open uncertainty.

**Rejected because:** If Evryn already knew what she was uncertain about, she would have surfaced it during the match attempt. This only catches known unknowns. The real value of re-matching is in unknown unknowns — new info that changes the picture in ways Evryn didn't anticipate. Additionally, reading old reasoning and comparing against new info is token-expensive at scale and still misses surprises.

### Embedding comparison as profile-rewrite gate (rejected)

Embed the new story, compare against baseline embedding, only rewrite profiles if the distance exceeds a threshold.

**Rejected because:** The global story embedding can barely change while one specific intent profile needs a major update — the comparison is at the wrong level of granularity. And comparing at the individual profile level requires rewriting first (to have something to embed and compare), which defeats the purpose of the gate. Evryn's judgment ("does this profile need updating given the new story?") is the same input cost, catches nuance that distance metrics miss, and produces minimal output tokens when the answer is "no."

### Per-interaction reflection (rejected)

Run reflection after every conversation or every new piece of information.

**Rejected because:** Opus can interpret story + accumulated pending_notes together without a story rewrite after every interaction. Weekly batch reflection saves a huge number of Opus calls, runs at 50% cost via the batch API, and produces the same quality output — Evryn sees the full picture either way. The week's delay before story rewrite is invisible to users (Evryn loads pending_notes alongside the story during conversations).

### Threshold-triggered reflection (pending_notes > N items)

Only run reflection when accumulated pending_notes exceed a count threshold.

**Rejected because:** One pending note could be massively important. And the absence of pending notes doesn't mean nothing happened — it means in-conversation Evryn didn't notice anything noteworthy. But stepping back during reflection, she might see a pattern across interactions that she missed in the moment. That's the whole point of reflection. The trigger should be "any activity" (cheap DB query), not a note count.

### Fixed cosine threshold without sensitivity dial (simpler, but worse)

Re-evaluate all returning candidates whose pairwise similarity improved by more than a fixed threshold X.

**Rejected because:** A fixed threshold either misses near-misses (threshold too high) or wastes tokens on far-misses (threshold too low). The previous analytical score is a cheap signal that dramatically improves targeting. A near-miss with a small cosine improvement is more worth re-evaluating than a far-miss with a moderate improvement.

### Re-run everything on a schedule (brute force)

Weekly or daily full re-match of all users against all intents.

**Rejected because:** At scale, this is O(N^2) vector searches plus O(K*N) Opus evaluations, where K is the average number of candidates per search. The event-driven approach with diffs reduces this to O(delta) per update. The schedule approach could serve as a low-priority safety net (catching the narrow edge cases above), but not as the primary mechanism.

## Consequences

- **Matching costs scale with meaningful change, not with database size.** A million idle users cost nothing. Opus only fires when there's a genuine possibility worth evaluating.
- **The cached top-K and previous analytical scores must be stored.** This adds a `match_candidates` or similar table that records: user pair, intent, similarity score, analytical score, timestamp. This is the cache that enables diffs.
- **Structured pre-filter changes and embedding updates are distinct triggers.** The pipeline must track both. A location change that doesn't affect the embedding still triggers pool re-evaluation via the structured diff path.
- **Threshold tuning is a v0.3+ empirical task.** The sensitivity dial's exact breakpoints need real matching data to calibrate. Start conservative (re-evaluate more) and tighten as data accumulates.
- **A periodic full-rescan (low priority, off-peak) is a reasonable safety net** for catching edge cases the event-driven pipeline misses. Not part of v0.3 MVP, but designed so it can be added without restructuring.
- **Model tiers: Opus for everything in v0.2.** Conversation is the product. Triage is matching. Neither tolerates a lighter model. For v0.3+, model tier optimization needs dedicated analysis — the answer may still be "Opus for everything" once someone does the math. Don't assume any operation can use a lesser model without proving it first.
