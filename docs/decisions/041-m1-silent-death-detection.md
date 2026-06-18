# ADR-041 — M1 Silent-Death Detection: Circuit-Breaker + Single Alert Channel

**Status:** Accepted (2026-06-17)
**Deciders:** Justin (philosophy + the firm calls), AC5 (design), Soren (independent architectural vet — GO-WITH-CHANGES)
**Supersedes within M1:** an earlier AC0 two-tier-with-phone-call draft (2026-06-17), now reframed — its phone-pierce design is deferred to v0.3 (see "Deferred").

> **Truncation check:** the last line should read `FULL FILE LOADED`.

---

## Context

M1 = **silent-death detection** — the one Mark-go-live blocker the approval gate cannot backstop. The approval gate catches what Evryn *says* wrong (every outbound is operator-gated); it cannot catch the system going **dark** (crashed / poll-loop wedged / can't authenticate) or **runaway** (a stuck loop burning Anthropic API money). **Stage 1 shipped** (2026-06-16): the `#emergency-alerts` Slack channel + `notifyEmergency()` (`evryn-backend/src/notify/emergency.ts`). This ADR records the **Stage 2** design: the detectors + the halt mechanism.

Two facts shaped the design:
- **Single spend choke point.** `runEvrynQuery` (`src/triage/classify.ts`) is the *sole* `query()` / Anthropic call site — every pathway (processForward, processDirect, handleOperatorMessage, checkProactiveOutreach, checkFollowUps, handleRevisionNotes) funnels through it. Verified by grep, not assumption (Soren vet, 2026-06-17).
- **Justin's capital reality.** Anthropic credit is loaded one day at a time, fully manually (no auto-reload), as a manual circuit-breaker bounding worst-case loss to a day. That is unsustainable as Mark's volume comes online and days vary in size — so the auto-halt must be robust enough to *replace* the daily-reload chore, not merely supplement it.

## Decision

**One DND-respecting alert channel for everything; one circuit-breaker. Runaway cost is the only condition that also acts (halts).**

1. **Single alert channel.** Every emergency posts immediately to `#emergency-alerts` via `notifyEmergency()`, **DND-respecting** (Justin un-VIP'd the channel on his phone). He sees it immediately if awake; his phone DND holds it till morning if asleep. **No phone calls in v0.2.**

2. **Circuit-breaker (the load-bearing safety piece).** A kill-switch checked at the **top of `runEvrynQuery`**: when tripped, every spend attempt short-circuits with zero spend, **regardless of trigger** (poll, Slack, cron, anything future) — "cut power at the breaker, not unplug the device" (Justin). Flag is **default-OFF, in-memory, cleared on restart** (manual reset = restart; if the cause persists it re-trips immediately — correct and observable). Belt-and-suspenders: also `stopPolling()`. External final backstop, code-independent (Justin's action): an **Anthropic-console monthly spend ceiling**. Three independent layers → no single failure burns the month; Justin can drop the daily-reload chore.

3. **Runaway detectors → trip the breaker.** An in-process rolling counter at the choke point counts **attempts** (queries entered), *not* recorded cost (we do **not** read `llm_usage` back — see Alternatives). Two pure predicates (`shouldTripOnLoopSignature`, `shouldTripOnVelocity`, codebase `shouldRun*` pattern):
   - **Loop-signature (primary):** repetition relative to distinct work — attempts per distinct `(pathway, scopeUserId, emailmgrItemId)` in a rolling window. **Clustering-robust by construction:** a legit daily cluster is many *distinct* signatures with low repetition; a runaway is high repetition on a bounded set.
   - **Velocity ceiling (dumb backstop):** absolute attempts/hr above a hard line set generously above a full clustered daily burst; calibrated against `llm_usage` post-wipe (sprint Step 43).
   - On trip: set the flag, `stopPolling()`, `notifyEmergency()`. **Hard-halt, no auto-reset.**

4. **Tier-B conditions (alert-only, immediate, non-piercing):**
   - **Process-death / loop-wedge:** an **external heartbeat dead-man's-switch** (Healthchecks.io) pinged from *inside* the poll loop after a successful `pollOnce()` (not a `/health` poll — `/health` returns 200 while the loop is wedged).
   - **Hard auth (persistent 401/403):** `isAuthError` mirroring `isBillingError`, distinguishing Anthropic-auth (Evryn brain-dead) from Gmail-auth (can think, can't see/send).
   - **Polling-dead:** escalate `consecutiveErrors` past a sustained wall-clock threshold from `notifyDev` to `notifyEmergency`, reusing the existing `alertCheckerFailure` rate-limiter.

5. **Send-bypass = tier-5 structural assertion, not a detector.** The approval gate is structurally the only outbound exit; a guard at the `sendEmail`/`executeApproval` boundary fires `notifyEmergency` + refuses the send if that invariant is ever violated.

6. **Watch-the-watchman.** The emergency channel is itself a silent-death surface (`notifyEmergency` swallows on failure by design). A **daily positive affirmation** posts via the emergency path *and* pings a separate Healthchecks.io check **gated on the emergency post succeeding** — so a broken channel → no affirmation ping → independent alarm. (Seam left for a future "cluster ran: N/M/K" signal.)

7. **Cron-timing move.** Morning crons → ~10am PT so an overnight death → morning restart still leaves the day's work to fire cleanly (`PROACTIVE_CHECK_HOUR_PT` 8→10).

## Consequences

- **M1 v0.2 = next-waking-hours notification, NOT real-time paging.** This is the explicit semantic. Going dark a few hours overnight is acceptable at this stage (Justin's call; Seattle-only, pre-revenue, no dedicated overnight responder yet). A future instance must not read "silent-death detector" as real-time paging.
- **Deliberate ADR-007 deviation:** [ADR-007](007-budget-based-limits.md) frames budget limits as alert-then-pause (two-tier). For the velocity lever, v0.2 uses **hard-halt on first trip** (no auto-reset) — over-halt beats under-halt pre-Mark, and a false-halt degrades to acceptable overnight-dark. Named here so it's a decision, not a drift.
- **Clustering interaction (sprint Step 58, decided/before-Mark):** the velocity detector is clustering-robust by construction; the heartbeat's daily affirmation grows a "cluster ran" signal when clustering lands (a silent cluster failure = a whole missed day, which loop-liveness alone wouldn't catch).
- **Operator ergonomics:** hard-halt + manual reset means the operator-guide must document how to read why it tripped and how to reset (restart). After a cost-trip, `stopPolling()` also stops ingestion (full freeze — appropriate for runaway); `resetStuckItems()` recovers anything caught mid-`processing` on restart.
- **Operator `approve <id>` still sends after a trip** — `executeApproval → sendEmail` bypasses `runEvrynQuery` by design; the breaker freezes *machine* spend, not the operator's deliberate human-in-the-loop actions.

## Alternatives considered (and why not)

- **2am phone calls / one loud channel for all** — rejected: Justin will not be woken at v0.2; nothing here is worth it until a dedicated (ideally *agent*) responder exists.
- **Turnkey paging service (PagerDuty etc.) for a DND-piercing call** — rejected for v0.2 (no call at all), and noted for v0.3: such services call from **rotating** caller-IDs ("subject to change," per their docs), which fail Android's starred-contact DND pierce. The v0.3 pierce path is **Twilio from an owned number** (the only stable, whitelistable caller-ID).
- **Detector reading `llm_usage` back** — rejected: best-effort/swallowing, written after completion, misses mid-stream throws (the exact runaway shape). A safety sensor cannot sit on a lossy store.
- **`stopPolling()` alone as the halt** — rejected: it stops the poll loop but not Slack-triggered spend; the `runEvrynQuery` breaker covers all paths.
- **`/health` poll for death detection** — rejected: returns 200 while the poll loop is wedged (the worst silent shape).
- **Send-bypass as a live detector** — rejected as security theater; it's a structural invariant, enforced as a tier-5 assertion.
- **Auto-reset-then-retry in v0.2** — deferred to v0.3: a reset can walk straight back into a deterministic loop and double-burn before re-tripping; safe once an agent supervises the reset in real time.

## Deferred to v0.3

- **Twilio-owned-number phone-pierce** + an **agent-first responder** (an always-awake agent — OC candidate — gets the alert and fixes/resets in ms; the phone call becomes human-escalation-of-last-resort only if the agent is down). Captured for the BUILD doc v0.3 section.
- **Auto-reset-then-retry** circuit-breaker behavior.
- The daily affirmation's full **"cluster ran: N/M/K"** payload (lands with clustering, Step 58).

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
