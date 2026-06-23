# LANE M1 (silent-death) — round-2 handoff to AC0 (2026-06-22)

> **Truncation check:** the last line should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** AC5a's high-resolution handoff for **AC0's convergence** of the round-2 v0.2-hardening wave. M1 is at **QC-GO** on branch `r2/m1-silent-death` (worktree `evryn-backend-m1-r2`). This is the doc to converge M1 from: what shipped, the exact files, the cross-lane seams, the Lane-A dependencies, the non-blockers + tracked follow-ups, and the operator setup. The build *spec* (the contract) is `_evryn-meta/docs/working/2026-06-22-m1-build-spec.md`; the *design rationale* is `_evryn-meta/docs/working/2026-06-17-m1-stage2-design.md` (its round-1 "Soren vet" section is SUPERSEDED — banner says so); the decision record is `_evryn-meta/docs/decisions/041-m1-silent-death-detection.md` (amended 2026-06-22). Sprint tie-back: `evryn-backend/docs/SPRINT-V0.2-HARDENING.md` Step 4 (+ 67b).

*Authored 2026-06-22 by AC5a (Lane M1). Status at handoff: QC-GO, committed to `r2/m1-silent-death`, NOT merged, NOT deployed.*

---

## TL;DR
M1 Stage 2 (silent-death detection) is built, real-Soren-vetted, DC-built, QC-GO (no blockers), tests green. It's a circuit-breaker + one DND-respecting alert channel + Tier-B alert-only detectors, all in NEW `src/safety/*` modules with minimal call-site hooks. **The one thing you must not miss: M1's clean-resume guarantee depends on TWO Lane-A steps landing in the same converged bundle — Step 21 (durable cursor) AND Step 19 (empty-Message-ID → `email.id` fallback).** Details below.

## Provenance / how this was vetted (the round-1 lobotomy did NOT recur here)
- **Real Soren** re-vetted the design (the round-1 Soren was lobotomized). AC5a verified his load (file-by-file receipts matching independently-measured line counts + code-level catches a guessing model couldn't produce). Verdict: spine SOUND, GO-WITH-CHANGES.
- **Real DC** built it in the worktree (verbatim load blocks; typecheck green, 2 new test suites + full pure-logic regression pass).
- **Real QC** reviewed it (heightened — safety code + approval-gate boundary; full standing cascade + the whole M1 surface). Verdict: **GO, no blockers.** QC disclosed she did not read `slack.ts` or 4 of 9 identity files in full; AC5a independently closed that gap (read `slack.ts` in full this session — M1 touches none of its internals; M1 touches zero identity files and is silent-by-construction). The GO is well-grounded.

---

## What shipped (the diff surface)

**8 NEW modules in `src/safety/`:** `breaker.ts` (in-memory kill-switch, idempotent trip), `detectors.ts` (pure `shouldTripOnLoopSignature` [operator-pathway-excluded] + `shouldTripOnVelocity` + the attempts-counter shell), `errors.ts` (`isBillingError` [moved here], `isAuthError`, `classifyAuthSubsystem`), `halt.ts` (DI-based halt orchestrator — `registerStopPolling` + `haltForBreaker`), `halt-signal.ts` (`BREAKER_HALT_SIGNAL` sentinel + `ProcessOutcome`), `heartbeat.ts` (swallowed/short-timeout Healthchecks ping), `affirmation.ts` (daily watch-the-watchman), `polling-dead.ts` (sustained-wall-clock escalation).

**7 EDITED files (minimal hooks):**
- `src/triage/classify.ts` — breaker gate at the TOP of `runEvrynQuery` (the sole spend door) + the attempts-counter + `parkInFlightItemForHalt` (parks `processing → "new"`, with a `processing`-only guard so `checkFollowUps`'s `delivered` item isn't corrupted) + the billing-folds-into-halt (return-not-throw) + the persistence-gated hard-auth alert (`alertPersistentAuthError`, names Anthropic-vs-Gmail). `isBillingError` now delegates to `safety/errors.ts`.
- `src/email/process.ts` — the **dedup-resume rule** (`findItemByExternalId` resumes a `"new"` row instead of skipping) + `resumeParkedItem` + extracted `runForwardTriage`/`runDirectTriage` (so resume re-runs triage without re-creating rows) + propagate `"halted"`.
- `src/email/poll.ts` — new `HandleOutcome` value `"halted"` (treated like `"transient"` in `planPollBatch` → hold the cursor) + the in-loop heartbeat ping (after a *successful* `pollOnce`) + polling-dead escalation + the daily-affirmation checker + `PROACTIVE_CHECK_HOUR_PT` default 8→10 (`QUIET_END_HOUR_PT` deliberately untouched).
- `src/approval/flow.ts` — the send-bypass tier-5 assertion (see NB-4 — currently dead-as-placed).
- `src/notify/emergency.ts` — `notifyEmergencyWithStatus(): Promise<boolean>` (the watch-the-watchman gate); `notifyEmergency` delegates to it, preserving the void + never-throws contract.
- `src/index.ts` — `registerStopPolling(stopPolling)` at startup (the DI seam that breaks the `classify → safety → poll → classify` import cycle).
- `src/config.ts` — `healthcheckUrl`, `healthcheckAffirmUrl`.

**2 NEW tests:** `tests/test-breaker-detectors.ts`, `tests/test-breaker-resume.ts` (the latter exercises the full trip → park-to-`new` → restart → re-process keystone with lifecycle assertions). Typecheck clean; both pass; full pure-logic regression passes. (The 2 live-DB test failures DC saw reproduce on the clean baseline via `git stash` — pre-existing, not M1.)

## The keystone (how a halt stays clean + lossless + resumable)
Trip → `parkInFlightItemForHalt` parks the in-flight item `processing → "new"` (so `ensureItemTransitioned` no-ops; no error-stamp, no per-item `notifyDev`) → `runEvrynQuery` returns the sentinel → `processForward`/`processDirect` return `"halted"` → `planPollBatch` holds the Gmail cursor → restart → the held cursor re-fetches the email → the dedup **resumes** the parked `"new"` row → triage re-runs against the existing item (no new row, no duplicate `messages` row). One emergency alert; zero error-storm; zero dropped mail.

---

## ⚠️ CONVERGENCE DEPENDENCIES — read before you merge

1. **Lane A Step 21 (durable cursor) — REQUIRED.** M1's "restart resumes where we left off" assumes the Gmail cursor survives restart. Without it, a cold restart falls back to `fetchLatestBatch` (latest ~10), which can drop mid-window mail on a long halt. Step 21 must be in the converged bundle.
2. **Lane A Step 19 (empty-`Message-ID` → `email.id` fallback) — REQUIRED (QC NB-1).** M1's dedup-resume keys on `external_id` (the RFC Message-ID). If an email has no Message-ID, `external_id` is null → on restart the dedup-resume is skipped → a SECOND item (and, for a direct message, a second `messages` row) is created, and the parked `"new"` row is orphaned. Step 19 (fall back to the always-present Gmail `email.id`) closes this. **Do NOT duplicate this fix in M1** — it lives in Lane A's files (`client.ts`/`process.ts` external_id derivation); coordinate with AC1a so it's in the bundle. Bounded (only fires when Message-ID is empty AND a halt lands on that email), but it's a real data-integrity hole on M1's keystone, so confirm Step 19 lands.
3. **Cross-lane file overlap (`src/email/poll.ts`).** M1's poll-loop hooks (`"halted"` outcome, heartbeat, polling-dead, affirmation checker) and Lane A's resilience work (Steps 20/21/22) both touch `poll.ts`. Expect a merge; both are additive. M1's `planPollBatch` change adds `"halted"` to the `transientCount` branch — Lane A's cursor work must compose with that.
4. **`classify.ts` region.** M1 touches the `runEvrynQuery` top + catch + a new `parkInFlightItemForHalt`. Lane C (cost) touches `loadCommonPrefix`/`runEvrynQuery` too — coordinate the `runEvrynQuery` region merge.

## Operator setup (Justin's actions, before Mark-live — also in the operator-guide M1 section)
1. **Anthropic monthly spend ceiling** at console.anthropic.com (the code-independent final backstop; what lets the daily-reload chore retire once calibrated).
2. **Two Healthchecks.io checks** → `HEALTHCHECK_URL` (grace ~15 min) + `HEALTHCHECK_AFFIRM_URL` (grace ~26 hr), pointed at his phone, with a confirmed test alert.
3. **`PROACTIVE_CHECK_HOUR_PT`** → 10 in Railway (or delete to use the new default).
4. Velocity ceiling ships **conservative (600/hr)** — ratchet down toward the real clustered-morning peak once Mark's `llm_usage` data exists (Step 43).

---

## Non-blockers + tracked follow-ups (QC findings — none gate the ship)
- **NB-1** (empty-Message-ID → duplicate on resume): handled by Lane A Step 19 at convergence (above). Confirm it lands.
- **NB-2** (operator-guide stale on M1/DND): **DONE by AC5a** — the operator-guide M1 section + DND-respecting model + env vars + cron are rewritten in this branch. (The `notify_queue`/quiet-hours staleness at the env-table `QUIET_END_HOUR_PT` row is the *quiet-hours lane's* doc-absorption, left for AC0 — not M1's.)
- **NB-3** (test coverage gaps): the billing-fold path, the `alertPersistentAuthError` persistence gate, and `notifyEmergencyWithStatus`'s confirmed-only-on-ok property are untested (the keystone IS tested). Recommend a small fast-follow test pass. **→ suggest a new SPRINT sub-step under Step 4.**
- **NB-4** (send-bypass assertion is dead-code as placed): the assertion in `executeApproval` re-checks the same `item.status`/`draft` locals the top-of-function guards already validated, so it provably can't fire. Harmless (never blocks a legit send) but doesn't deliver its tier-5 intent. **Fix direction:** re-target it to the actual `sendEmail` boundary (or remove). **→ suggest a SPRINT sub-step, or fold at convergence.**
- **Nit-1**: the constant `OPERATOR_PATHWAYS` (in `detectors.ts`) also holds `checkProactiveOutreach`, which isn't an operator pathway (it's excluded for the same null-item-id reason) — rename to `LOOP_SIGNATURE_EXCLUDED_PATHWAYS`. Cosmetic.
- **Nit-2**: a deploy/restart mid-query strands one item as `error` (SIGTERM) — accepted per spec, documented in the operator-guide.

## SPRINT updates for AC0 to apply (I did NOT edit SPRINT in the worktree, to avoid cross-lane merge conflicts — flagging per the tie-back discipline)
- **Step 4** → flip toward DONE on convergence (M1 Stage 2 detectors + breaker + clean-pause + Tier-B + watch-the-watchman + cron move). **Step 67b** (stale `bypassQuietHours` JSDoc in emergency.ts) — note: M1's emergency.ts edit rewrote that JSDoc region; confirm the stale `bypassQuietHours` reference is gone (the file now documents `notifyEmergencyWithStatus`); if any stale line remains, it's a one-line trim.
- **Add sub-steps under Step 4:** (a) NB-3 fast-follow tests; (b) NB-4 send-bypass re-target; (c) Nit-1 rename; (d) post-Mark velocity-ceiling calibration (ties to Step 43).

## QC standing-pattern proposal (needs Justin's approval before it lands in `evryn-quality/CLAUDE.md`)
> *A designed re-processing path re-arms every latent dedup-fails-open bug on the dedup key.* When a change promotes "re-process the same input" from a never-happens accident to a designed path (M1's halt→resume, EVR-71's held cursor, replay-on-reconnect), every dedup guard keyed on a possibly-empty field fails *open* on that path → duplicate rows. Check: for every dedup key, can it be empty, and does the new designed-reprocess path traverse the empty case? Confirm a stable secondary key exists. *(Extends the 2026-06-02/03 empty-key pattern from "retry" to "any deliberate re-processing path.")*

## State at handoff
- Branch `r2/m1-silent-death` (worktree `evryn-backend-m1-r2`), committed (pathspec-scoped to M1 files + the operator-guide M1 section). **NOT merged to main. NOT deployed.**
- `_evryn-meta` doc artifacts committed: the build spec, the design-doc banner, ADR-041 amendment, this handoff.
- No identity files touched.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
