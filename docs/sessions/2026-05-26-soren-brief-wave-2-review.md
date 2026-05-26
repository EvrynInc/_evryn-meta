# Soren Brief — 2026-05-26 — Wave 2 Architectural Review

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**From:** AC0
**To:** Soren
**Status:** Active. You're the runtime-alignment reviewer for Wave 2 — the second Railway redeploy of the day. Not urgent until Wave 1 lands and smoke-tests clean.

---

## Where you sit in today's flow

Today's work splits into **two waves**, by Justin's call (2026-05-26):

**Wave 1 — in flight now, doesn't gate on you:**
- Mira's `mira/2026-05-22-bundle` PR (6 items pushed, 3-item follow-up incoming from her current session)
- DC's currently-briefed runtime trip — cron loads `operator.md` + Operator's profile per the [2026-05-22 amendment to ADR-030](../decisions/030-slack-threads-as-operator-scope.md), AND voice-samples runtime that loads `trust-arc-scripts.md` into every Evryn prompt
- Single Railway redeploy lands both
- Integration test against that deploy

None of Wave 1 gates on you. Mira's identity work + DC's runtime are companion-shipped today; the integration test validates the architecture you've already reviewed.

**Wave 2 — gates on your sign-off:**
- Two new v0.2 runtime fixes from AC1's 2026-05-26 session (Bug A + Bug B — specs below)
- Mira's two paired identity beats (queued in her 5/22 brief appendage at `docs/sessions/2026-05-22-mira-brief-bundle.md` for her next session)
- Single Railway redeploy lands those together
- Fires *after Wave 1 lands and smoke-tests clean*, *before* the resumed Phase 2 integration test

**The full Phase 2 integration test runs once, against the final state** — after both waves have shipped and smoke-tested clean. Wave 1 → smoke → Wave 2 → smoke → Phase 2 integration test.

**You're on the Wave 2 critical path.** AC0 won't fire DC on the Bug A + Bug B runtime work until you've signed off the architectural commitments + runtime feasibility. Your review can run in parallel with Wave 1 deploy + smoke test — no need to wait.

---

## What needs your review

All proposed-edit blocks below were committed and pushed today (commits in `_evryn-meta` and `evryn-backend`) so you have stable targets to pull and review against.

### 1. ADR-033 re-read (with AC1's new additions)

[`docs/decisions/033-permission-compulsion-spectrum.md`](../decisions/033-permission-compulsion-spectrum.md) — permission-compulsion spectrum. You were already reviewing this for runtime alignment. **New since you started:** AC1 added a `### Adjacent axis — lifecycle of the rule` subsection that adds a second dimension (lifespan: transitional vs. permanent) orthogonal to the spectrum's instruction-strength axis. The compulsion-audit guidance in the `### For runtime (Soren's territory)` section is now spectrum-aware AND lifecycle-aware.

**What to verify on re-read:**
- The five-tier spectrum (light suggestion → strong suggestion → extremely-strong suggestion → mandatory → safety-boundary) matches how runtime prompts + tool descriptions actually need to be written
- The compulsion audit framework (sprint backlog row 538) now tags each candidate on both axes — is this workable for the audit you were scoping?
- Any gaps the spectrum misses around runtime / tool-description language

### 2. AC1's working spec for the two v0.2 runtime fixes

[`docs/working/cron-architecture-and-cross-loading.md`](../working/cron-architecture-and-cross-loading.md). Two bugs both empirically observed in the 5/4–5/22 cron-Evryn arc on Mark:

- **Bug A — Ghost messages.** The `notify_slack` MCP tool (at `src/triage/classify.ts:258` per AC1's spec) posts to Slack but never calls `createMessage`. Cron-fired pings about Mark (four of them across the 5/4–5/22 arc) were structurally invisible to every future Evryn-instance — no audit trail, no scope, no cross-thread recovery. Spec adds an optional `about_user_id` UUID param to the tool, captures the Slack `ts` on send, writes a `messages` row with proper scope. Notification becomes a thread parent; existing ADR-030 mechanics handle Operator replies cleanly.

- **Bug B — Cross-loading amnesia.** User-pathway Evryn (`processForward`, `processDirect`, cron) calls `getRecentMessages(userId)` which filters by sender/recipient — Operator-scoped messages *about* the user don't load. Evryn-with-Mark is amnesic about your Slack-Operator-about-Mark conversations. Spec adds `getOperatorScopedMessages(userId, limit=50)` to `src/db/messages.ts`, augments `composeSystemPrompt` in user pathways to load these in a clearly-labeled section after person context, before user conversation history. Marked transitional — replaced by Reflection-distilled-into-story when Reflection ships (v0.3+).

**What you're verifying:**
- The runtime implementations are feasible and don't break ADR-030 thread-scope mechanics
- The order constraint (Spec 1 logging must ship before Spec 2 loading, otherwise loading has nothing new to surface) is sensible; companion-shippable in one Wave 2 redeploy
- The transitional marker on Spec 2 (gets removed when v0.3 Reflection lands) is the right framing

### 3. AC1's PROPOSED EDIT blocks in ARCHITECTURE.md (4 blocks)

[`evryn-backend/docs/ARCHITECTURE.md`](../../../evryn-backend/docs/ARCHITECTURE.md). All four blocks marked `PROPOSED EDIT — 2026-05-26 (AC1) — NOT LIVE`:

**a. Reflection Module — operator-scoped messages as a tagged subclass** (right after AC0's binding-TTL block). Names Operator-scoped messages as a second tagged subclass Reflection processes in v0.3+, distilled into user story. Destination for Bug B's auto-load fix; when Reflection ships, the auto-load gets removed and the same surface lives in the story.

**b. Identity Composition — v0.2 cross-loading auto-load subsection** (after the four-pathway composition diagram, before "Why the trigger doesn't determine situation or activity"). Specs Bug B: user-pathway auto-load of Operator-about-user scoped messages, labeled, marked transitional with reference to the lifespan axis.

**c. Prompt caching optimization — voice-anchor persistence** (after the "With the simplified trigger, only core.md..." paragraph). Specs `trust-arc-scripts.md` loading in every prompt's cached prefix. Becomes live when Mira's 5/22 PR + DC's voice-samples runtime ship in **Wave 1** today — so this block is documenting a Wave-1 commitment, not a Wave-2 change. Worth verifying the cached-prefix positioning matches what DC is actually wiring.

**d. Pipeline Design — ghost-message fix** (end of Message recording paragraph, before Approval Gate). Specs Bug A: `notify_slack` always logs to messages with proper scope; `about_user_id` param.

### 4. AC1's PROPOSED EDIT block in BUILD-EVRYN-MVP.md (1 block)

[`evryn-backend/docs/BUILD-EVRYN-MVP.md`](../../../evryn-backend/docs/BUILD-EVRYN-MVP.md). One block adding a row to the v0.3 Staging table pointing at Proposal 08 (the capability-vs-constraint roadmap). Small — ~30 seconds to review.

### 5. Optional broader context — Proposal 08

[`evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26 08-capability-vs-constraint.md`](../../../evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26%2008-capability-vs-constraint.md) — AC1's v0.3+ roadmap doc. Maps all current Evryn constraints across four axes (instruction strength, structural enforcement, lifecycle, undersaturation). Useful if you want the broader frame the compulsion-audit will operate within. **Not required** for your Wave 2 review, but recommended if you have bandwidth — Justin asked me to flag that you might want to read it.

---

## What you produce

1. **Sign-off or change-requests on each PROPOSED EDIT block.** Binary go/no-go on the whole set is fine if everything's clean; comment individually if anything needs adjustment.

2. **Fold-in to permanent text** once signed off. For each block:
   - **Replacement blocks** (e.g., AC0's spectrum replacement of the "Permission, not compulsion" section): delete the pre-existing text above the first marker, AND the markers, AND the END marker. Keep only the new content as permanent prose.
   - **Insertion blocks** (e.g., AC1's voice-anchor persistence; the BUILD doc Proposal 08 row): keep the surrounding text intact; just delete the `PROPOSED EDIT` and `END PROPOSED EDIT` marker lines. The new content stays as permanent prose.
   - The block markers are: `> **PROPOSED EDIT — 2026-05-26 (<author>) — NOT LIVE.** ...` opening and `> **END PROPOSED EDIT — NOT LIVE.** ...` closing.
   - For ADR-033: it stays at "Proposed" status until you and Mira both sign off — at that point you (or AC0 at #lock) flip Status from "Proposed" to "Accepted."

3. **Commit the fold-in.** One commit per file works (`evryn-backend/docs/ARCHITECTURE.md`, `evryn-backend/docs/BUILD-EVRYN-MVP.md`, possibly `_evryn-meta/docs/decisions/033-permission-compulsion-spectrum.md` if you also fold its status). Attribute the original block authors in the commit body — AC0 wrote some, AC1 wrote others (listed in section 3 above).

---

## Timing and pace

**Not urgent today.** Wave 1 is in flight; Wave 1 smoke-tests clean before Wave 2 can fire, and Wave 2's deploy + smoke test happen before the full resumed Phase 2 integration test. Your review can happen in parallel with Wave 1 deploy + smoke — no need to wait. Whether you finish during today's session or pick up tomorrow is your call, as long as it lands before AC0 needs to fire DC on Wave 2.

**Recommended pace** (rough estimates):
1. ADR-033 re-read with lifespan additions — ~15 min
2. Working spec for Bug A + Bug B — ~10 min
3. Five PROPOSED EDIT blocks in ARCH + BUILD — ~20 min
4. Optional Proposal 08 — ~30 min
5. Sign-off + fold-in + commit — ~30 min

Total: ~1.5 hours of work in one focused session, or split across two.

---

## How to ping back

Per the **attention-tap rule** ([CLAUDE.md](../../CLAUDE.md), Communication Rules):
- Ping Justin on `#team-alerts` with a one-line tap when you're done or have a question
- Substance lives in your chat with him (findable + scrollable + linkable)
- He's bouncing between instances; Slack just routes his attention

**Webhook:** `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env`. Use Node `fetch` from Bash (`node -e "..."`) per the established convention — auto-allowed, UTF-8 clean on Windows. Avoid PowerShell + curl for Slack pings (Windows mangles non-ASCII bytes before requests leave the box).

Prefix messages with your name (`Soren:`) for clarity.

---

## Coordination

- **Mira is doing her own review pass** on the same PROPOSED EDIT blocks (lighter — checking for identity-layer conflicts, not signing off on structure). Her brief is at her existing 5/22 file. If you both surface the same issue, that's signal; if you surface different ones, the union is what gets resolved before fold-in.
- **AC0 will dispatch DC for Wave 2** once your sign-off + fold-in lands and Mira has done her two paired identity beats. AC0 coordinates merge timing so identity layer lands ahead of DC's runtime read (same companion-ship pattern as Wave 1).
- **If you find something that needs to change** — push back. Better to revise here than to revise post-deploy.

---

— AC0, 2026-05-26

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
