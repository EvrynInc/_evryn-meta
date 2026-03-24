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

The full chain from "new information arrives" to "new matches discovered" has three stages: reflection, profile evaluation, and re-matching. Each stage gates the next — downstream work only fires when the upstream stage produced meaningful change. The only operation that runs outside the weekly batch is first-match for new users (see below).

**Stage 1: Reflection (weekly batch, 50% cost via Anthropic batch API)**

During the week, Evryn converses with users and captures insights in `pending_notes`. Conversations, incoming third-party info, and other interactions are tracked in normal DB tables (messages, etc.). No reflection runs during the week — insights accumulate.

Weekly, a batch job queries the DB for all users with any activity since their last reflection. For each user, one Opus call with the full picture: old story + pending_notes + ALL raw interactions from the messages table + any other info appended to the user's record (Evryn's notes over time, third-party observations, etc.) — all read in **chronological order** so Evryn can see patterns and trends across the full history. This single pass folds in new information and re-examines old conclusions in light of new context simultaneously; when Evryn reads the full chronological record alongside the current story, she naturally does both.

**Why the full history, not just recent interactions:** Evryn's value is in seeing patterns across time. A user's third mention of loneliness over six months is qualitatively different from any single mention. Reading the full record in order makes these patterns visible. Per-user volume is manageable — most users have onboarding plus a few interactions per month. Even after a year, the full input for a typical user is well within a single Opus call.

**If per-user volume grows:** Split into "light reflection" (weekly, recent interactions only, fast synthesis) and "deep reflection" (monthly, full history, pattern-finding). This is a future optimization — unnecessary until interaction volume per user becomes meaningfully large.

**Why weekly, not per-interaction:** Opus can read story + accumulated pending_notes just fine without a story rewrite after every conversation. Weekly rewrites save a huge number of Opus calls. The story doesn't need to be "current" between rewrites — Evryn loads both story and pending_notes during conversations and interprets them together.

**Why "any activity" as the trigger:** Even seemingly minor activity can be meaningful in aggregate or in context. A DB query for "any activity since last reflection" is cheap. Writing filtering logic to distinguish "meaningful" from "not meaningful" activity is complex, fragile, and risks missing things. Let Opus make that judgment during reflection — that's what it's good at. If the new activity was trivial, reflection produces a story that barely changed, and downstream gates catch it.

**Noise is largely self-filtering:** For instance, the Care Module reaches out to users proactively, which creates activity entries. This means reflection runs for users who only had "nothing yet" / "okay, thanks Evryn" exchanges. That's fine — reflection is mostly an input process. Evryn reads the full picture, sees nothing meaningful changed, and her output is minimal (near-zero output tokens). The downstream profile-evaluation gate catches it: Evryn looks at the barely-changed story and says "no profile rewrites needed." Cost is one cheap reflection call with minimal output. This pattern generalizes — any low-signal activity triggers reflection, but the pipeline's gates prevent it from cascading into expensive downstream work. The alternative — building rules to pre-filter noise sources — is more complexity than it saves.

**What pending_notes are:** Insights Evryn noticed during conversations — things she thinks are worth remembering. NOT an activity log. The trigger for reflection is "any activity" (DB query), not `pending_notes.length > 0`. A user could have activity (received a proactive outreach, had a brief exchange) with no pending_notes. Reflection still runs — Evryn might see patterns in the raw interactions that in-conversation Evryn missed. That's the whole point of stepping back.

**What pending_notes are NOT:** An entry for every interaction. "Conversation ID XYZ, no new insights" should never be a pending_note. That's just noise that costs output tokens to write and input tokens to read. The database already tracks activity.

**Cadence:** Weekly until cost-prohibitive. More often if optimizations make it cheaper. **At scale,** if batch volume delays processing, stagger reflections across the week on a rolling schedule (UUIDs A-D on Monday, E-H on Tuesday, etc.) so no user goes more than a week without a check. This is a scale optimization, not the default — at lower volume, a single weekly batch is simpler operationally. If scale outstrips even a rolling schedule, the solution is more parallelism (same architecture, more compute), and at that volume, Anthropic would likely be open to custom arrangements.

**Stage 2: Profile evaluation (chained batch after reflection completes)**

Each user has multiple match profiles: 1 global (holistic "grab bag" for cross-domain surprise matches) + N intent-curated profiles (one per active intent). These are separate artifacts derived from the story, written for embedding — distinct from `profile_jsonb.story` itself.

After reflection rewrites stories, Evryn evaluates each existing match profile against the new story. The gate is Evryn's judgment, not an embedding comparison. For each profile, she reads the new story + old profile and decides: "does this need updating?" If no — minimal output tokens, move on. If yes — she rewrites the profile and it gets re-embedded.

**Why Evryn's judgment instead of embedding comparison:** An embedding-comparison gate requires embedding the new story (cheap), comparing against a baseline (trivial math), then maybe rewriting anyway. But the global story embedding can barely change while one specific intent profile needs a major update — the comparison is at the wrong level of granularity. Evryn reading new story + old profile and deciding is the same input cost, catches nuance that embedding distance misses, and Opus is excellent at this kind of judgment call. Output tokens are the expensive part — "no change needed" is nearly free.

**Important: compare against baseline, not previous version.** If we tracked cumulative drift (2% + 1% + 3% + 1% = 7%), we'd need to compare each profile against the last version that actually triggered a rewrite. Since the gate is Evryn's judgment rather than a numeric threshold, this is handled naturally — she's comparing against the extant profile, which IS the baseline.

**Stage 3: Re-matching (Fridays, after the week's reflection and profile evaluation batch completes)**

Re-matching runs after all reflection and profile evaluation has completed for the cycle, ensuring every user in the system is freshly reflected before any cross-user searching happens. Re-matching is a cross-user operation — it searches one user against all others — so it needs the complete, fresh picture.

**Why Fridays:** New matches surface over the weekend (great for personal connections — soulmates, therapists, tutors) or greet you Monday morning (great for professional connections — collaborators, hires, mentors). At scale with a rolling reflection schedule, the fixed re-matching day ensures everyone has been freshly reflected before the cross-user search runs.

For all users whose profile embeddings changed during the cycle, the re-matching pipeline runs as described below.

### Two-phase re-evaluation: structured filter diffs + cosine sensitivity dial

The matching pipeline has two phases that operate on different data and fail in different ways. The re-matching strategy leverages this:

**Phase 1: Structured pre-filters (location, profession, hard constraints)**

Structured data changes affect which *candidate pools* a person appears in. If A was in the Seattle pool and moves to NYC, she doesn't appear as a "returning candidate" for NYC searches — she appears as a **new candidate** for that pool. The diff between old top-K and new top-K catches this automatically. She gets a fresh Opus evaluation as if she'd never been seen for this intent before.

This handles the dealbreaker-flip case. If the previous analytical score was 20/100 because of one structural dealbreaker (wrong city, wrong industry), and that structured field just changed, the pool shift surfaces her as new. No threshold tuning needed, no old reasoning to read.

**Phase 2: Vector similarity (personality, values, communication style, resonance)**

Embedding changes affect a person's *ranking within pools they were already in*. For returning candidates (still in the top-K after re-search), the question is: did the pairwise vector similarity improve enough to justify re-evaluation?

A dot product comparison between the old and new pairwise similarity scores is trivially cheap and deterministic — the dot product tells you whether the relationship improved enough to re-evaluate, without spending tokens to re-read why it previously didn't work.

**The sensitivity dial: previous analytical score modulates the threshold.**

Not all returning candidates deserve the same trigger sensitivity:

- **Near-misses (previous score ~80-90+):** Hair trigger. Even a small cosine improvement is worth re-evaluating — they were almost there, and a nudge might push them over.
- **Mid-range (previous score ~50-70):** Moderate threshold. Needs a meaningful shift to justify re-evaluation.
- **Far-misses (previous score below ~40):** High threshold. Needs a large shift. If the pairwise similarity barely moved and the previous analysis found deep incompatibility, one new piece of info isn't going to flip that.

Exact thresholds are tuning parameters, not architectural decisions — they'll be calibrated empirically once real matching data exists.

### What runs for each user during the re-matching batch

For each user whose profile embeddings changed this cycle:

1. Vector search — A's updated profile embeddings against all intents, and all profiles against A's updated intent embeddings. Only A's searches, not everyone's. Milliseconds each, even at 100M users.
2. Diff against cached top-K per intent. New candidates get fresh Opus evaluation. Dropped candidates need no action.
3. For returning candidates: pairwise cosine comparison (free) filtered through the sensitivity dial (previous analytical score). Re-evaluate only where the composite signal justifies it.
4. Total Opus calls per user: single digits.

### First matches are always real-time

When a new user onboards, the full pipeline runs synchronously at full price: profile writing, embedding, vector search, Opus evaluation. This is customer capture — the user is waiting, the experience matters, and the cost of one real-time pipeline is negligible. If the first-match attempt doesn't find anyone, the user enters the weekly batch cycle — a few days' delay before the next check is fine ("I'm still searching for you" is an acceptable and honest response).

### What we miss (and why it's acceptable)

The narrow case that could slip through one cycle: a dealbreaker that was *resolved* in the story text but isn't well-captured in the embedding shift. Example: "A previously told Evryn she'd never date a smoker. B is a smoker. Previous analytical score was low because the analytical layer correctly caught this dealbreaker. A's story gets updated after some therapy — she's rethinking her hard stances. The embedding shifts slightly, but 'removed a specific dealbreaker about smoking' isn't well-captured in embedding geometry. B doesn't resurface as a candidate because the cosine improvement is below threshold for a far-miss."

Note: the *creation* of a dealbreaker is always caught — the analytical layer reads both stories and sees it. The problem is specifically with dealbreaker *resolution* where the embedding shift is too subtle to trigger re-evaluation for a previously low-scoring pair.

This is acceptable because:
- It's extremely rare (most dealbreaker resolutions produce meaningful embedding shifts, and most resolved dealbreakers are structural — handled by the structured pre-filter diff in Phase 1)
- The next reflection cycle accumulates more context, the embedding shifts further, and we catch it
- Missing a match by one weekly cycle is low cost; re-evaluating thousands of candidates per user is high cost

## Alternatives Considered

### Uncertainty breadcrumbs (rejected)

The analytical layer captures what it was uncertain about ("I'd match these two if I knew whether A is open to relocating"), and re-evaluates when new info touches an open uncertainty.

**Rejected because:** If Evryn already knew what she was uncertain about, she would have surfaced it during the match attempt. This only catches known unknowns. The real value of re-matching is in unknown unknowns — new info that changes the picture in ways Evryn didn't anticipate. Additionally, reading old reasoning and comparing against new info is token-expensive at scale and still misses surprises.

### Embedding comparison as profile-rewrite gate (rejected)

Embed the new story, compare against baseline embedding, only rewrite profiles if the distance exceeds a threshold.

**Rejected because:** The global story embedding can barely change while one specific intent profile needs a major update — the comparison is at the wrong level of granularity. And comparing at the individual profile level requires rewriting first (to have something to embed and compare), which defeats the purpose of the gate. Evryn's judgment ("does this profile need updating given the new story?") is the same input cost, catches nuance that embedding distance misses, and produces minimal output tokens when the answer is "no."

### Per-interaction reflection (rejected)

Run reflection after every conversation or every new piece of information.

**Rejected because:** Opus can interpret story + accumulated pending_notes together without a story rewrite after every interaction. Weekly batch reflection saves a huge number of Opus calls, runs at 50% cost via the batch API, and produces the same quality output — Evryn sees the full picture either way. The week's delay before story rewrite is invisible to users (Evryn loads pending_notes alongside the story during conversations).

### Threshold-triggered reflection (pending_notes > N items) (rejected)

Only run reflection when accumulated pending_notes exceed a count threshold.

**Rejected because:** One pending note could be massively important. And the absence of pending notes doesn't mean nothing happened — it means in-conversation Evryn didn't notice anything noteworthy. But stepping back during reflection, she might see a pattern across interactions that she missed in the moment. That's the whole point of reflection. The trigger should be "any activity" (cheap DB query), not a note count.

### Fixed cosine threshold without sensitivity dial (rejected)

Re-evaluate all returning candidates whose pairwise similarity improved by more than a fixed threshold X.

**Rejected because:** A fixed threshold either misses near-misses (threshold too high) or wastes tokens on far-misses (threshold too low). The previous analytical score is a cheap signal that dramatically improves targeting. A near-miss with a small cosine improvement is more worth re-evaluating than a far-miss with a moderate improvement.

### Re-run everything on a schedule (rejected)

Weekly or daily full re-match of all users against all intents.

**Rejected because:** At scale, this is O(N^2) vector searches plus O(K*N) Opus evaluations, where K is the average number of candidates per search. The diff-based approach reduces this to O(delta) per cycle — only users whose profiles changed, and only candidates whose scores improved meaningfully.

## Consequences

- **Matching costs scale with meaningful change, not with database size.** A million idle users cost nothing. Opus only fires when there's a genuine possibility worth evaluating.
- **The cached top-K and previous analytical scores need storage.** A `match_candidates` or similar table records: user pair, intent, similarity score, analytical score, timestamp. This is operational cache for computing diffs — separate from the relationship graph. The relationship graph stores persistent truth (actual connections, confirmed matches, vouching). match_candidates stores temporary algorithmic state (search results, scores) that gets overwritten each cycle. Mixing them would pollute the graph with transient data and complicate graph queries. When a match IS confirmed, it creates a graph edge; before that, match_candidates is just a scratchpad.
- **Structured pre-filter changes and embedding updates are distinct triggers within the re-matching logic.** A location change that doesn't affect the embedding still triggers pool re-evaluation via the structured diff path.
- **Threshold tuning is a v0.3+ empirical task.** The sensitivity dial's exact breakpoints need real matching data to calibrate. Start conservative (re-evaluate more) and tighten as data accumulates.
- **Model tier selection is a separate decision.** See [ADR-020](020-model-tier-selection.md) for the full reasoning. Summary: Opus for everything in v0.2; v0.3+ needs dedicated analysis before assuming any operation can tolerate a lighter model.
