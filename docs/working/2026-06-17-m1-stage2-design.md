# M1 Stage 2 — Silent-Death Detection: Design (AC5, 2026-06-17)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** The canonical design for M1 Stage 2 (silent-death detection) for the 2026-06-17 v0.2-hardening wave. **AC5 owns M1**; this is the artifact a real Soren vets, a real DC builds from, and AC0 converges from. Read it under the shared spin-up preamble in `docs/sessions/2026-06-17-parallel-lanes-brief.md` (full-cascade load, AC-in-charge judgment, design-call surfacing, build-to-QC-GO-on-branch). Sprint Step 4. Grounded in the runtime (`evryn-backend/src/`, read on `main` 2026-06-17).
>
> **This rewrite (AC5, 2026-06-17T17:59-07:00) SUPERSEDES AC0's original two-tier-with-phone-call draft.** Justin simplified the whole design in conversation 2026-06-17 (see "Justin's decisions" below): no phone calls in v0.2, one DND-respecting alert channel, one circuit-breaker. AC0's two-tier/Twilio framing is preserved only as the **v0.3 note** at the bottom (the phone-pierce belongs to a future dedicated responder). Where this doc and AC0's original diverge, **this doc is current.**

---

## What M1 is, and where Stage 2 sits

M1 = **silent-death detection** — the one go-live blocker the approval gate can't backstop. The gate catches what Evryn *says* wrong; it cannot catch the system going **dark** (crashed / wedged / can't log in) or **runaway** (a stuck loop burning Anthropic money). **Stage 1 shipped** (2026-06-16): the `#emergency-alerts` Slack channel + `notifyEmergency()` (`src/notify/emergency.ts`). **Stage 2 (this doc) = the detectors + the halt mechanism.**

---

## Justin's decisions (2026-06-17 — these are firm; design follows them)

Justin settled the shape directly. These are *his* calls, not open questions:

1. **No phone calls / no 2am wake in v0.2.** "Fuck calling me in the middle of the night." Going dark for a few hours overnight is **acceptable at this stage** — until there's a dedicated responder (ideally an *agent*, not a person), nothing here is worth waking him. The Twilio phone-pierce design moves to the v0.3 note.
2. **One alert channel for everything: immediate + DND-respecting.** Every emergency posts to Slack the *moment* it fires. If Justin's asleep with DND on, his phone holds it till morning; if he's up late, he sees it now. His DND does the time-gating — no scheduled-morning logic in our code. (Justin has **un-VIP'd `#emergency-alerts` on his phone**, reversing the Stage-1 pierce — confirmed done 2026-06-17.)
3. **Runaway cost is the ONLY condition that also ACTS** (halt-then-alert). Everything else is alert-only.
4. **Auto-halt via a circuit-breaker — hard-must.** Justin's framing: "cut power at the breaker, not unplug the device." Detect → cut the actual spend path → alert. This is what lets him **stop the unsustainable daily-credit-reload chore** (see "Why the breaker matters").
5. **Hard-halt on first trip** for v0.2; auto-reset-then-retry deferred to v0.3 (risk: a reset walks straight back into a deterministic loop and burns a second window before re-tripping — not worth it while "stop the bleeding" is the priority and overnight-dark is acceptable).

---

## The design — one alert channel + one circuit-breaker

The whole thing collapses to two pieces:

- **One alert channel:** `notifyEmergency()` → `#emergency-alerts`, immediate, DND-respecting (already exists from Stage 1; no piercing).
- **One circuit-breaker:** a kill-switch at the single Anthropic spend door that cuts *all* spend when tripped.

Runaway cost trips the breaker *and* alerts. Every other condition alerts only.

### Why the breaker matters (and why it has to be robust)

Justin's interim safety net today is manual and unsustainable: he loads **one day of Anthropic credit at a time** so the worst case is bounded to a day. He can't auto-reload (Anthropic only supports fully-manual credit top-ups), and as Mark's volume comes online with very differently-sized days, the daily chore breaks down. **The auto-halt is what replaces that chore** — so it must be the *real* safety net, robust enough that he can top up weekly/as-needed instead. We do **not** lean on the daily cap as a backstop (he's retiring it); the layered breaker below is the backstop.

### The circuit-breaker mechanism (the load-bearing piece — Soren vetting)

Every dollar of Anthropic spend flows through **one function: `runEvrynQuery`** in `src/triage/classify.ts` (the single `query()` call site; every pathway — `processForward`, `processDirect`, `handleOperatorMessage`, `checkProactiveOutreach`, `checkFollowUps`, `handleRevisionNotes` — routes through it; the `llm-usage.ts` header already calls it "the single Anthropic choke point").

- **Primary breaker:** a global kill-switch flag checked at the **top of `runEvrynQuery`**. When tripped, every spend attempt short-circuits and spends nothing — **regardless of trigger** (email poll, Slack operator message, any cron, anything we build later). This is the "main breaker": it doesn't matter what we *thought* we were stopping; the actual spend path is cut. This is strictly more robust than `stopPolling()` alone, which only stops the email-poll loop (and the crons riding inside it) — a Slack-triggered runaway would bypass `stopPolling` but still hits the `runEvrynQuery` door.
- **Belt-and-suspenders:** also call `stopPolling()` so the loop stops spinning uselessly.
- **External final backstop (Justin's own action, outside our code):** an Anthropic-console **monthly spend ceiling**. Even if our entire process misbehaves, Anthropic stops serving at the cap. This is the "if our halt itself fails" layer — code-independent.

Three independent layers → no single failure burns the month, and Justin can drop the daily-reload chore.

### Runaway detectors (two triggers feeding the breaker)

Per Justin's "trigger on malformed shape, not just a total":

1. **Loop-signature (the smart, volume-robust one):** the same item / sender / subject reprocessed repeatedly, or query-rate wildly past the bounded normal. Keys on **repetition / unboundedness**, so it stays valid as Mark's volume grows and days vary in size (a heavy-but-legit day = many *different* bounded jobs; a runaway = the same thing forever). Needs **no recalibration** as volume scales.
2. **Spend-velocity ceiling (the dumb backstop):** $/hr (or query-count/hr) past a hard line set well above a heavy legit day. Catches a *novel* runaway shape the loop-detector didn't anticipate. Calibrated against the live `llm_usage` capture (ADR-038) once Mark's volume is real; conservative-safe default pre-Mark.

Both feed the same breaker. Open seam for Soren: spend-velocity off an **in-process rolling counter** at the choke point (robust — doesn't depend on the best-effort `llm_usage` DB write) vs. reading `llm_usage` back each cycle. AC5 lean: in-process counter.

### Tier-B conditions (alert-only, immediate, non-piercing)

- **Process-death / poll-loop-wedge → EXTERNAL heartbeat dead-man's-switch.** A dead process can't alert itself. Plan: the poll loop pings an external service (**Healthchecks.io** — purpose-built dead-man's-switch, cheap, Slack/SMS integrations) every cycle; if pings stop for N minutes, the service alerts (Slack/text, immediate, non-piercing). **Heartbeat-from-inside-the-loop, NOT a `/health` poll** — the current `/health` (`src/index.ts`) returns 200 even if the poll loop is wedged (the worst silent shape). Seam for Soren: where in the loop the ping fires so a wedge is actually caught.
- **Hard auth fail (401/403) → in-process.** Classified in the poll path + the `runEvrynQuery` catch (mirrors how `isBillingError` already special-cases Anthropic 402). Immediate Slack alert.
- **Polling-dead after retries → in-process.** `startPolling`'s `consecutiveErrors` is already counted; escalate past a hard threshold to an immediate Slack alert.
- **Send-bypass → code-invariant, not a live detector.** `sendEmail` is reached only via `executeApproval` after the approval-status check, so the approval gate is structurally the only exit. Treat as an assertion/guard, not a whole detector. (Confirming with Soren this is the right treatment.)

### Cron-timing move

Shift the morning crons to **~10am PT** (Justin: "10am, just for safety") so an overnight death → morning restart still leaves the day's check-in to fire cleanly. Specifics:
- `checkProactiveOutreach` — `PROACTIVE_CHECK_HOUR_PT` env 8 → 10 (the money/action cron — the one that matters most).
- `checkMorningSweep` — gated via `isQuietHour`/`QUIET_END_HOUR_PT`. **Minor seam (AC5 call, Soren sanity-check):** moving the sweep to 10 by bumping `QUIET_END_HOUR_PT` also delays the stale-checker's waking-hours gate — likely fine, but consider decoupling the sweep's target hour from `QUIET_END_HOUR_PT` so the two aren't yoked. The sweep is just a digest to Justin (low stakes); the proactive cron is the load-bearing move.

### Operator-guide M1-DND section

Rewrite `evryn-backend/docs/operator-guide.md`'s M1/DND section: the current section carries the old "add Slack as an Android DND exception / pierce" theory. The v0.2 reality is **DND-respecting** (Justin un-VIP'd the channel); the guide should describe the simplified model (immediate post, DND holds till morning, he sees it on waking) + the runaway auto-halt behavior + how to restart after an overnight halt + setting the Anthropic monthly spend ceiling.

---

## v0.3 note (to be absorbed into the BUILD doc — auth-gated, applied via AC0/Justin)

> Not yet written into `BUILD-EVRYN-MVP.md` (source-of-truth → needs Justin's auth + AC0 owns doc-absorption at convergence). Captured here so it's durable; route into BUILD's v0.3 section at convergence.

**Phone-pierce + dedicated responder (v0.3).** When a dedicated responder exists, M1 gets a true wake-channel:
- **The pierce mechanism is Twilio from an *owned* number.** Research (AC5, 2026-06-17): turnkey paging services (PagerDuty etc.) call from **rotating** caller-IDs ("subject to change," per their own docs) → they **fail** Android's starred-contact DND pierce, which needs one fixed, saved, starred number. A Twilio-owned number is the only clean guarantee of a stable, whitelistable caller-ID. The live (runaway) process places the call directly via the Voice API.
- **Justin's strong preference: the responder is an *agent*, not a person.** An always-awake agent (OC is the top candidate) never sleeps through an alert and fixes-and-resets in milliseconds. That **inverts the phone-call's role:** in steady state the agent gets the Slack/webhook alert and acts ("fixed it overnight, boss"); the Twilio phone call becomes the **last-resort human escalation** only if the agent itself is down and doesn't acknowledge within N minutes (who-watches-the-watcher). So the v0.3 design is agent-first responder + human phone-call as final fallback, not phone-call-as-primary.
- **Auto-reset-then-retry** (Justin's "reset, and if it loops again, then halt") also belongs here — safe once an agent supervises the reset in real time.

**ADR.** The simplified single-channel + circuit-breaker-at-the-choke-point philosophy, the external-heartbeat dependency, and the in-process-vs-external split warrant an ADR (money-is-the-limit, ADR-007, is the principle frame).

---

## Open items / status

- **Soren vet — DONE (2026-06-17): GO-WITH-CHANGES.** Verified by grep that `runEvrynQuery` is the sole `query()` call site (the breaker belongs exactly there). Four shape-level changes + refinements folded into the new "Soren vet — final build spec" section below.
- **Justin's external action:** set an Anthropic-console monthly spend ceiling (the code-independent backstop layer).
- **Product-model flag (raised to Justin, acknowledged):** the runtime triages **per-forward in real-time** today, not as a "morning batch"; the once-a-day cluster delivery is decided-not-built (sprint 6b/48a) and is "next" per Justin. M1's morning-timing is forward-compatible either way. When clustering lands, the Tier-B heartbeat should grow a **positive daily "cluster ran: screened N, escalated M, drafted K"** signal (build the heartbeat so that slots in).

## Soren vet (2026-06-17) — verdict + final build spec (this is what DC builds to)

**Verdict: GO-WITH-CHANGES.** Soren (CTO) independently vetted the safety mechanism (read-only). He **verified by grep** that `runEvrynQuery` (`classify.ts:1179`) is the *sole* `query()` / Anthropic call site — all six pathways funnel through it — so a kill-switch at the top of `runEvrynQuery` provably cuts ALL spend regardless of trigger. Core design sound; breaker belongs exactly there.

**Shape-level changes (folded in):**

1. **Watch-the-watchman — the emergency channel can itself fail silently.** `notifyEmergency` swallows on failure by design, so a misconfigured webhook / un-VIP'd app / rotated token means every detector fires into a void — the deepest silent-death. Fix: a **daily positive affirmation** ("M1 alive — emergency channel OK", posted via the emergency path) that ALSO pings a dedicated **Healthchecks.io "daily-affirmation" check, gated on the emergency post returning ok** — so a broken emergency channel → no affirmation ping → Healthchecks (independent path) alarms. Requires a `notifyEmergency` variant that reports post success. Merges with the clustering signal (below): when clustering lands, the same daily affirmation carries "screened N, escalated M, drafted K".

2. **Detectors = pure predicates over an in-process attempts-counter — NOT reading `llm_usage` back.** `llm_usage` is best-effort/swallowing, written *after* completion, and misses mid-stream throws (the exact runaway shape) — disqualifying as a safety sensor. Build an in-process rolling-counter incremented at the **top of `runEvrynQuery`**, counting **attempts** (queries entered), not just recorded cost. Expose pure predicates `shouldTripOnLoopSignature(...)` + `shouldTripOnVelocity(...)` per the codebase `shouldRun*` pattern (unit-testable, zero I/O) with a thin impure shell.

3. **Velocity detector must be clustering-robust by construction — the single biggest false-positive risk.** Clustering (sprint Step 58, decided, before-Mark) makes a legit morning a ~200-item back-to-back burst; a naive $/hr ceiling would trip every normal day. So the **primary signal is repetition relative to distinct work**: attempts per distinct `(pathway, scopeUserId, emailmgrItemId)` in a rolling window (legit cluster = many *distinct* items, low repetition; runaway = high repetition on a bounded set). Volume- AND clustering-robust by construction (Justin's "malformed shape," sharpened). The absolute attempts/hr ceiling stays a dumb backstop, set generously above the full clustered daily burst, calibrated vs. `llm_usage` post-wipe (Step 43).

4. **Write the explicit semantic + the M1 ADR.** M1 v0.2 = **next-waking-hours notification, not real-time paging** (DND-respecting by Justin's choice; the deferred Twilio pierce is what would make it real-time). Capture in operator-guide + a dedicated **M1 ADR**: circuit-breaker-at-the-choke-point; the deliberate **ADR-007 deviation** (hard-halt-first instead of two-tier-then-pause); the DND-as-morning-report semantic; the clustering interaction; deferred Twilio.

**Refinements (DC absorbs, with these seams):**
- **Halt = kill-switch (primary) + `stopPolling()` (default-on for a cost-trip).** Kill-switch alone keeps *ingesting* (items queue, no spend — no data loss); `stopPolling()` also stops ingestion (full freeze — right for a runaway-cost event). Ingestion resumes only on restart; `resetStuckItems()` surfaces anything caught mid-`processing` as `error` (existing net). Document the restart requirement.
- **`stopPolling()` is currently DEAD CODE** (defined `poll.ts:153`, never called — M1 is its first caller). Test the trip → loop-exit → restart → `resetStuckItems` recovery path.
- **Kill-switch flag: default OFF, in-memory, cleared on restart.** Manual reset = restart; if the cause persists it re-trips immediately (correct + observable). Explicit ADR decision.
- **Operator `approve <id>` still sends after a trip** — `executeApproval → sendEmail` does NOT route through `runEvrynQuery` (AC5 verified `client.ts`: sendEmail's only callers are `executeApproval` + `submitDraftForApproval`→review@; no third caller, no re-entrant retry beyond the executeApproval loop). Correct & desired — the breaker freezes *machine* spend, not the operator's deliberate actions. Named property; document.
- **Hard-auth: `isAuthError` mirroring `isBillingError`** in the `runEvrynQuery` catch + poll path. **Distinguish Anthropic-401 (Evryn brain-dead) from Gmail-401 (can think, can't see/send)** — the operator message must say WHICH. Require persistence, not a single transient blip.
- **Polling-dead → emergency escalation** past a hard threshold keyed on **wall-clock (~15–30 min sustained)**, not raw count; **reuse the existing `alertCheckerFailure` cooldown rate-limiter** (poll.ts:45–66) — don't invent a second.
- **Heartbeat fires after a *successful* `pollOnce()`** (inside the try, after `consecutiveErrors = 0`) so it proves the core ingest did its job, not just spun; don't gate on the checkers. Outbound ping fully swallowed + short timeout (the monitor must never wedge the patient). Healthchecks grace ~15 min (above the 5-min max backoff). `HEALTHCHECK_URL` in `.env`, degrade gracefully if unset.
- **Send-bypass = tier-5 structural assertion**, not a detector: a guard at the `sendEmail`/`executeApproval` boundary that fires `notifyEmergency` + refuses the send if the `pending_approval`+operator-provenance invariant is ever violated (~5 lines). No watching infrastructure.
- **WebFetch/WebSearch** run inside the agentic loop → already neutralized by the upstream kill-switch; add a one-line comment so a future editor doesn't read them as a second spend path.
- **Cron move: explicit per-cron env.** `PROACTIVE_CHECK_HOUR_PT=10` (fires only during the 10:00–10:59 PT hour — if down that whole hour, missed till next day per the 23h guard; existing behavior, narrower cover than assumed). Decide the morning sweep (`QUIET_END_HOUR_PT`) separately — different gate; one env does not move both.

---

## Build scope (after Soren vet)

- **In-process (DC, unit-testable — extract pure predicates per the codebase `shouldRun*` pattern):** the kill-switch flag + its guard at `runEvrynQuery`; the runaway loop-signature + spend-velocity detectors (in-process rolling state); hard-auth classification; polling-dead escalation; the send-bypass invariant guard; the cron-hour move.
- **External heartbeat (DC + Justin):** the poll-loop heartbeat ping + the Healthchecks.io account/config; Justin confirms the alert reaches him.
- **Doc (AC5):** rewrite the operator-guide M1/DND section; the v0.3 note → BUILD via AC0/Justin; an ADR.
- **Tests are part of "done."**

## Sequence

1. **Justin nodded** the simplified design (2026-06-17 — "yes to everything"). ✓
2. **Soren vets** (in progress). Fold feedback.
3. **AC5 creates the M1 worktree** + briefs a real DC (in-process detectors + breaker + heartbeat + cron move).
4. **Justin** sets the Anthropic monthly ceiling + confirms the alert path.
5. **Real QC** reviews (heightened — this is a safety mechanism) → AC5 hands the QC-GO branch + a high-res handoff doc to AC0 for convergence. **No merge to main, no deploy** — that's AC0 + Justin.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
