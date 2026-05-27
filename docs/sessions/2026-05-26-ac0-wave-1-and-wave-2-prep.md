# AC0 Session — 2026-05-26 — Wave 1 dispatch + Wave 2 prep

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that, reload or read in sections until you confirm the complete file.

**Author:** AC0
**Date:** 2026-05-26
**Status:** In-flight. Wave 1 deployed to Railway; runtime smoke test in progress; Wave 2 plate being assembled for dispatch after smoke clean.

**Predecessor session doc:**
- [`2026-05-25-machine-switch-handoff.md`](2026-05-25-machine-switch-handoff.md) — yesterday's dispatch doc. Today's dispatch sequence executed against it (steps 1–5 all complete). **Still has live value** until the Phase 2 integration test runs: the "Targeted reading list for integration test execution" at lines 94-133 names the line ranges into `ARCHITECTURE.md`, `BUILD-EVRYN-MVP.md`, and `SPRINT-MARK-LIVE.md` for surgical loading at test time. **Archive to `docs/sessions/historical/` AFTER the integration test passes, not before** — that reading list is still needed.

---

## TL;DR

Today executed the 5-step dispatch sequence from the 5/25 handoff (AC1, Mira, Soren, AC0-merge-Mira, DC). Five clean dispatches; one strategic split decision (Wave-1/Wave-2); one new ADR Accepted (ADR-033); Wave 1 deployed.

Wave 2 dispatch is next, gating on the Wave 1 runtime smoke test passing.

---

## What landed today

### Wave 1 — DEPLOYED

- **Mira's PR #1** (`mira/2026-05-22-bundle`) — 6 original items + 3 follow-up commits + bonus new file (`docs/identity-writing-bible.md` Judgment-Anchoring principle). Rebase-merged; her commits live on master as `1f24ff7`, `f6a729b`, `0f8d5b5`, `263e4b5`.
- **DC's runtime trip** — Item 1 (`checkProactiveOutreach` + `checkFollowUps` load full Operator-discipline per ADR-030 amendment) + Item 2 (`trust-arc-scripts.md` loaded into every Evryn prompt). Commits `2d94f21` + `a0a4ae5`. Manual `railway up`; Railway deploy live.

### Architectural work landed

- **ADR-033** ([`_evryn-meta/docs/decisions/033-permission-compulsion-spectrum.md`](../decisions/033-permission-compulsion-spectrum.md)) — Status: **Accepted** as of 2026-05-26. Replaces the binary safety-vs-permission framing with a five-tier spectrum (light → strong → extremely-strong suggestion → mandatory → safety-boundary). Three axes total:
  - **Instruction strength** (the five tiers).
  - **Lifecycle** (transitional vs. permanent — added by AC1).
  - **Plus key consequences:** three runtime surfaces distinction; Publisher-as-backstop pattern (reframed per Justin's pushback — Publisher is backstop NOT replacement; identity stays primary at tier 5; design bias is to keep the Publisher catch list small); scope-and-conflict-resolution clarifications.
- **Companion ARCH/BUILD edits folded to permanent text** by Soren (commit `051e018` in evryn-backend). Includes Bug A + Bug B architectural commitments as permanent doc — **but the runtime for those is NOT yet shipped**; they're queued for Wave 2.
- **Publisher description in ARCH** reconciled to match the corrected Publisher-as-backstop framing (commit `0a835e7`).
- **Capability/Constraint roadmap (Proposal 08)** ([`evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26 08-capability-vs-constraint.md`](../../../evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26%2008-capability-vs-constraint.md)) — AC1's v0.3+ design doc; five open questions at the bottom for Justin.
- **AC1's cron/cross-loading working doc** ([`_evryn-meta/docs/working/cron-architecture-and-cross-loading.md`](../working/cron-architecture-and-cross-loading.md)) — captures Justin's 5/26 architectural calls on Bug A + Bug B + the v0.3 Reflection-into-story direction.

### Dispatch / coordination docs

- [Soren Wave 2 review brief](2026-05-26-soren-brief-wave-2-review.md) + [Soren's response](2026-05-26-soren-wave-2-review-response.md). Both reviewers signed off ADR-033.
- [Mira 5/22 brief](2026-05-22-mira-brief-bundle.md) — original 6-item brief + 3-item follow-up dispatch + Wave 2 appendage with two paired identity beats for Bug A + Bug B.
- [DC brief at `evryn-backend/docs/ac-to-dc.md`](../../../evryn-backend/docs/ac-to-dc.md) — 5/22 brief + 5/26 update covering merge state + Wave 2 heads-up.
- [DC's reply at `evryn-backend/docs/dc-to-ac.md`](../../../evryn-backend/docs/dc-to-ac.md) — Wave 1 ship report + bug investigation findings (pending mailbox clear).

---

## Wave 2 plate (assembled today, awaiting dispatch)

Six items in total to bundle into one DC trip + one Mira pass + one Railway redeploy:

**DC runtime work (four items):**

1. **Bug A — `notify_slack` ghost-message fix.** Add optional `about_user_id` UUID param to the tool; tool handler captures the Slack `ts` and writes a `messages` row with `scope_user_id`. Architectural commitment already permanent in `evryn-backend/docs/ARCHITECTURE.md` (Pipeline Design § "All Evryn-Operator outbound logs to `messages` with proper scope"). Full spec in [`_evryn-meta/docs/working/cron-architecture-and-cross-loading.md`](../working/cron-architecture-and-cross-loading.md) §"Spec 1."

2. **Bug B — Cross-loading auto-load.** Add `getOperatorScopedMessages(userId, limit=50)` to `src/db/messages.ts`; augment `composeSystemPrompt` in user pathways (`processForward`, `processDirect`, cron) to load it in a clearly-labeled section after person context, before user conversation history. Architectural commitment in ARCH Identity Composition § "User pathways auto-load Operator-about-user scoped messages (v0.2, transitional)". Spec in the same working doc §"Spec 2." Sequencing constraint: ship Spec 1 *before* Spec 2 (otherwise the loading has nothing new to surface).

3. **NEW (from DC's 5/26 reply): `handleRevisionNotes` Operator-audience normalization.** `src/approval/flow.ts:279` currently calls `composeSystemPrompt(personContext, true)` — loads `operator.md` but not the Operator profile or `_meta.discipline_notice`. Same partial-Operator-discipline shape the cron pathways had pre-amendment. Audience-over-trigger framing says this pathway (Justin gives revision notes → Evryn revises) is Operator-audience and should load full discipline. DC didn't touch it in his Wave 1 trip — flagged for follow-up. Trivially small change: `composeSystemPrompt(personContext, true, operatorProfile)` like the cron pathways now use.

4. **NEW (from DC's 5/26 reply): `submitDraftForApproval` retry+rollback fragility fix.** Status updates before review-email send; if `sendEmail` ultimately fails after its 3-retry-with-backoff, no rollback + no `notifyDev` → item silently stuck in `pending_approval`. Consistent with (but not proof of) the 5/4 + 5/11 missing-review-email symptom. **Per Justin's 5/26 retry-altitude framing:** orchestrator-level catch on the ultimate-failure case + `notifyDev` minimum + decide between rollback to `error` status vs. keep `pending_approval` with explicit alert. DC suggested option (b) — keep `pending_approval` but `notifyDev` immediately (plus a Slack-webhook fallback that doesn't depend on the same Gmail send path). This pairs with the retry-policy proposed addition to DC's CLAUDE.md (see "Pending decisions" below).

**Mira identity work (two items, queued in her 5/22 brief Wave 2 appendage):**

5. **`operator.md`: `about_user_id` scoping cue beat.** Instructs Evryn — when calling `notify_slack` about a specific user, pass `about_user_id` so the log scopes correctly.

6. **`core.md` or `operator.md` (Mira's craft call): "Operator conversations about a user are judgment context, not transcripts for echo."** Hardens the discretion floor on the Bug B auto-loaded section.

**Dispatch shape:** When ready, write a fresh `evryn-backend/docs/ac-to-dc.md` brief consolidating DC items 1–4 above (with the working doc as the depth reference). Mira's items are already in her brief Wave 2 appendage — just dispatch her.

---

## Pending decisions / awaiting Justin

- **Wave 1 runtime smoke test** — Justin sending a casual Slack message to Evryn to exercise the approval flow + voice anchor end-to-end on the post-deploy state. AC0 watching Railway logs in real-time. Result pending.
- **DC CLAUDE.md retry-policy proposed edit** — landed today at [`evryn-dev-workspace/CLAUDE.md`](../../../evryn-dev-workspace/CLAUDE.md) as a PROPOSED EDIT block in Build Mandate. Pending DC's review and Justin's sign-off before flipping live.
- **`dc-to-ac.md` mailbox clear** — `evryn-backend/docs/dc-to-ac.md` to be cleared to `READ — absorbed` once the smoke-test resolves and the Wave 2 plate above is confirmed captured.

---

## Today's key events (chronological)

1. **AC1 produced two architectural deliverables.** Capability/Constraint roadmap (Proposal 08) + cron-architecture working doc with Bug A + Bug B specs + the v0.3 Reflection-into-story direction. Justin's architectural calls were made in his session with AC1.
2. **ADR-033 drafted (AC0) + AC1 added the lifecycle axis directly (per Justin) + Soren and Mira reviewed + Mira's two required additions landed + Status → Accepted.** Same-day end-to-end.
3. **Soren's three remaining "I'd want" refinements landed afterward.** Three-runtime-surfaces distinction (as drafted); Publisher-as-backstop pattern (reframed per Justin's pushback — Publisher is backstop NOT replacement); scope-and-conflict-resolution clarifications. Companion ARCH Publisher-description reconciliation landed alongside.
4. **Wave-1/Wave-2 split decision** — Justin's call (2026-05-26) — Mira's PR + DC's current scope ship today (Wave 1); AC1's Bug A + Bug B + Mira's paired beats ship after Wave 1 smoke clean (Wave 2). Decision driver: smaller blast radius per redeploy + cleaner causal isolation if smoke fails.
5. **Mira pushed her 3-item follow-up + bonus.** AC0 delta-reviewed clean; rebase-merged to master.
6. **DC shipped Wave 1.** Two bisect-clean commits + 22-assertion pure-logic smoke test + typecheck clean. Manual `railway up` deployed (auto-deploy is off post-Image-Registry-incident).
7. **Smoke test in progress** at session-doc-write time.

---

## Cross-references

**Today's commits — `_evryn-meta`:**
- `71e5089` ADR-033 (Proposed, by AC0)
- `f5f0e1b` Mira 5/22 brief Wave 2 appendage
- `9d67fd4` Mira 5/22 brief Wave 2 sequencing correction
- `b897fc7` Soren Wave 2 review brief
- `d533331` Soren response + Mira brief appendage (by Soren)
- `5804222` ADR-033 Status → Accepted with Mira sign-off requirements (by Soren)
- `8b2c542` ADR-033 three refinements landed (Publisher-as-backstop reframed per Justin)
- (this session doc commit pending)

**Today's commits — `evryn-backend`:**
- `badc27f` proposed-edit blocks (AC0 + AC1, before Soren's fold)
- `051e018` Soren Wave 2 ARCH + BUILD fold-ins
- `0a835e7` ARCH Publisher description reconciliation (AC0)
- `1f24ff7` + `f6a729b` + `0f8d5b5` + `263e4b5` Mira's PR rebased to master
- `06deb5a` ac-to-dc 5/26 update for fresh-DC pickup
- `2d94f21` + `a0a4ae5` DC Wave 1 runtime shipment

---

## When this session absorbs

At #lock or end of day, the still-relevant content from this doc absorbs into:

- **`docs/current-state.md`** — Wave 1 deployed status; Wave 2 dispatch pending smoke; updated phase status.
- **`_evryn-meta/CHANGELOG.md`** — today's entry covering ADR-033 + Wave 1 + Wave 2 prep.
- **The Wave 2 dispatch brief** (when written) — pulls the Wave 2 plate above into a concrete `ac-to-dc.md` for DC.

After absorption, this doc moves to `docs/sessions/historical/`.

---

— AC0, 2026-05-26

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
