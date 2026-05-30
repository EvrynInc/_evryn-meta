# ADR-034: Force-Load Dossier Composition (v0.2)

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

**Status:** Accepted
**Date:** 2026-05-29
**Authors:** AC0 (architecture), DC1 (implementation)
**Related:** [ADR-012 — Trigger-Composed Identity](012-trigger-composed-identity.md) (amended by this ADR), [ADR-017 — Situation-Per-Context](017-situation-per-context-not-per-person.md), [ADR-030 — Slack Threads as Operator Scope](030-slack-threads-as-operator-scope.md)

---

## Context

ADR-012 (2026-01) established trigger-composed identity with selective loading: the trigger script loads core.md + person context; Evryn determines her situation and activity from the conversation and loads additional modules on demand via the `read_identity_module` tool. The reasoning was token economy — keep the prompt lean, load only what's needed.

Two pressures broke that reasoning during the 2026-05-28 → 2026-05-29 integration test:

**1. Empirical fragility of selective loading.** Multiple failure modes surfaced when Evryn was operating under degraded load:

- **Introspection gap.** Evryn cited modules in her reasoning field that she may not have actually loaded; the reasoning field's audit-trail shape can carry fabricated citations because the agent has no reliable introspective access to its own context window from inside the turn.
- **Performing forward motion.** When asked about her loading state, Evryn submitted a draft instead of answering — the urge to produce artifacts when reflection was called for.
- **"Should also cover" reading-as-soft-suggestion.** Module-level instructions explicitly framed as load-bearing (`gatekeeper-onboarding.md` "Should also cover" list) were read as optional; load-bearing beats got dropped from drafts.
- **Slick phrasing as substance substitute.** Where modules weren't loaded, Evryn pattern-matched plausible-sounding language ("no tool, no call") to fill gaps; unpacked, the language meant nothing.
- **Hyper-brevity collapsing into minimalism.** Drafts cut beats to feel light but read as boggy because they lacked the concreteness only proper module loads could provide.

Justin issued a standing-instruction mid-test: *"Before every volley, load these via `read_identity_module`: [full list]. Lead every response with a header naming what's loaded."* The empirical observation: **when Evryn loaded the modules, the failure modes went away.** The failures were load-discipline artifacts, not identity bugs.

**Force-loading the modules at the runtime level eliminates the load-discipline failure mode at the architecture rather than relying on Evryn's discipline to fire correctly every turn.**

**2. Prompt caching inverts the token economy.** Justin's 2026-05-29 API-log review surfaced that ~90% of Evryn's queries are already cached at Mark scale. With Anthropic prompt caching, **stability of the prefix matters more than size of the prefix** — cache reads cost ~10% of base; cache writes cost 25% more (paid once, amortized across hits).

A force-loaded identity prefix that's byte-identical across every query and every user becomes cheaper at scale than a per-task selective load that breaks the cache. At v0.2 single-user scale the per-call token cost goes up slightly; cache reads make the increase trivial. At v0.3+ multi-user scale, the math is even more favorable — every user's queries reinforce the same cache.

ADR-012 was written before caching was a primary cost lever; the original reasoning is no longer the dominant factor.

---

## Decision

The trigger composes a **four-layer dossier** rather than a per-pathway selective load. The composition is structured for prompt-cache hit-rate optimization.

### The four layers

**Layer 1 — Cached common prefix (byte-identical across every pathway + every user):**
- `core.md` (full)
- All activity modules (`activities/onboarding.md`, `activities/gatekeeper-onboarding.md`, `activities/triage.md`, + any future activity modules)
- All situation modules EXCEPT `operator.md` (currently just `situations/gatekeeper.md`, + any future user-audience situations)
- All internal-reference modules (`internal-reference/feedback-guidance.md`, `internal-reference/trust-arc-scripts.md`, + any future)
- All public-knowledge modules (none today; future-proof)

**Layer 2 — Conditional Operator suffix (Operator-audience pathways ONLY):**
- `situations/operator.md` (full)
- Operator's `profile_jsonb`
- Operator's `_meta.discipline_notice`

**Layer 3 — Conditional user suffix (pathways with a scoped user):**
- Scoped user's `profile_jsonb`
- Operator-Evryn-about-user messages (the Bug B v0.2 auto-load — folds into the user suffix; structural, no longer per-pathway duplicated)

**Layer 4 — Conversation history (always last, always per-turn variable; lives in `prompt`, not `systemPrompt`):**
- Recent messages for this conversation/thread

### Composition primitives

- `loadCommonPrefix()` — returns the byte-identical common prefix string. Cached at module-level (memoized).
- `loadOperatorSuffix()` — async; returns operator.md + Operator's profile + _meta.discipline_notice. Called only in Operator-audience pathways.
- `loadUserSuffix(user_id)` — async; returns user's profile + Operator-Evryn-about-user messages. Called only when there's a scoped user.
- `composeSystemPrompt({ includeOperator, scopedUser })` — async orchestrator.

### Pathway-by-pathway composition

| Pathway | Composition |
|---|---|
| `processForward(user_id)` | common + user(user_id) + history |
| `processDirect(user_id)` | common + user(user_id) + history |
| `handleOperatorMessage(thread)` no scope | common + operator + history |
| `handleOperatorMessage(thread)` scoped | common + operator + user(thread.scope) + history |
| `checkProactiveOutreach(user_id)` | common + operator + user(user_id) + history |
| `checkFollowUps(user_id)` | common + operator + user(user_id) + history |
| `handleRevisionNotes(emailmgr_item)` | common + operator + user(emailmgr.user_id) + history |

### `operator.md` stays gated

`operator.md` is **explicitly excluded from the common prefix** and loaded only in Operator-audience pathways. Two reasons:

1. **Safety.** `operator.md` carries the operator-mode register (peer voice, recovery-pattern reasoning, references to "the Operator"). It contains no hard PII, but the *register* could bleed into user-pathway output if force-loaded everywhere — Evryn might shift to operator-mode warmth, reference the operational structure to a user, or over-share recovery-pattern reasoning if confused mid-conversation. The risk is real but not catastrophic; the conservative call is to keep it gated.

2. **Cache discipline.** The common prefix is byte-identical across every pathway. If operator.md were force-loaded, the prefix would vary by pathway (with/without operator content), breaking the cache for non-Operator pathways. Gating preserves the byte-identical common prefix → maximum cache hit rate.

### Rename: `handleGeneralMessage` → `handleOperatorMessage`

The Slack-Operator pathway function was previously named `handleGeneralMessage`. The function is Operator-only; the "general" naming misleads readers about scope. Renamed throughout code, tests, comments, and ARCHITECTURE.md as part of the same trip.

---

## Consequences

### Load-discipline failures resolve structurally

Module-load failures (introspection gap, performing forward motion, "Should also cover" reading-as-soft-suggestion, etc.) no longer depend on Evryn's discipline to fire correctly. Every pathway gets every module she might need. Failures that surfaced during the integration test require post-fix empirical re-validation; identity-file fixes for those failure modes are speculative until we re-run the test against the force-load shape.

### Token cost per query goes up; prompt caching makes the increase trivial

At v0.2 Mark-only scale, the per-call token count for the systemPrompt increases (from ~17.6K to ~40K with full force-load, est.). Cache reads at ~10% of base cost mean the actual cost per cached query is negligible. Uncached queries (first call after cache TTL expiry, typically 5 min) pay full cost — at Mark's volume, this is rare. At v0.3+ multi-user scale, the byte-identical prefix is shared across users → every user's queries reinforce the same cache → cost asymptote approaches the cached-read price.

### Identity-file changes require Railway redeploy

`loadCommonPrefix` is cached in-process. Mira's identity-file edits (or any future identity changes) are picked up only at Railway restart. Per DC1's flag in his Wave 3 reply (`dc-to-ac.md`), an `invalidateCommonPrefixCache()` function is a 2-line addition if runtime hot-swap becomes needed. Not blocking; flagged for future.

### `read_identity_module` tool becomes rarely needed at v0.2

With force-load, Evryn shouldn't need to call `read_identity_module` for v0.2 modules — they're already loaded. The tool is kept (per DC item #2 reasoning) for empirical observability and for the case where Evryn introspects what she has loaded. Tool description updated to note force-load makes the tool rarely needed for v0.2 modules.

### Pathway-by-pathway consolidation eliminates Wave 1/2 duplication

The Wave 1 cron-pathway Operator-discipline loads, the Wave 2 Bug B per-pathway operator-about-user loads, and the Wave 2 `handleRevisionNotes` Operator-profile load all fold into the dossier primitives. Single source of truth for composition; no per-pathway duplication. **This subsumes and supersedes the prior DC list item #3** (Slack-Operator cross-thread scope-loading) — the dossier refactor closes that gap structurally rather than per-pathway.

### `operator.md` register-leak risk closed structurally

User pathways (`processForward`, `processDirect`) cannot load operator.md by design — `composeSystemPrompt({ includeOperator: false, ... })` omits the Operator suffix. No accidental leak from refactor mistakes; the boundary is in the orchestrator, not in caller discipline.

### v0.3+ direction is open

This ADR is the v0.2 commitment. **Whether force-load is also the right v0.3+ architecture is genuinely open.** Justin's caching insight suggests yes — the cache economy gets MORE favorable at scale because the byte-identical common prefix is shared across all users. But the cognitive-load question (does Evryn over-apply rules when everything's loaded?) needs more empirical validation under force-load than the 2026-05-28-29 test produced (n=1 in a coaching context per Mira's standing concern).

**EVR-109 tracks the v0.3 architecture sidebar with Soren** (R: soren, A: justin, C: mira). The sidebar opens post-Mark to decide whether ADR-012 gets formally amended (force-load becomes the standing identity architecture, ADR-012's selective-load framing supersedes) or whether selective-load returns at v0.3+ with caching-aware framing (e.g., precomputed cache anchors per pathway). The v0.3 decision will reference this ADR and either supersede it or extend it.

### ARCHITECTURE.md is the live spec

The Identity Composition section of `evryn-backend/docs/ARCHITECTURE.md` was rewritten as part of DC1's Wave 3 ship to reflect the four-layer dossier + compose-primitive names + pathway-by-pathway table. This ADR is the *decision record*; ARCHITECTURE.md is the *current state spec*. They should agree.

---

## Empirical case

Surfacing material that drove the decision, for future readers:

- **Integration test 2026-05-28 → 29.** Session doc: `_evryn-meta/docs/sessions/2026-05-28-integration-test.md`. The "Mira pile" section + the "Status (rolling)" section carry the empirical failure modes.
- **Two Slack threads** with the in-the-wild material: thread `1779997809.975439` (Mark-scoped, Day 1) and thread `1780009886.535399` (Day 2 standing-instruction + better re-draft).
- **Justin's caching insight** captured in v0.3 deferred question #3 of the session doc.
- **Soren's working doc** on force-load + caching architecture: `evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.29 09-force-load-and-caching-architecture-soren.md`.

---

## Implementation

DC1's Wave 3 ship, commit `05bd1ff`, Railway deploy `4e79b834` (2026-05-29T17:22 PT). Reply in `evryn-backend/docs/dc-to-ac.md`. ARCHITECTURE.md rewrite in the same commit.

DC3 independent review trip dispatched 2026-05-29 evening to verify implementation against this spec (top priority: `loadCommonPrefix` glob filter discipline).

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
