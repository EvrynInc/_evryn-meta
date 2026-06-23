# M1 Stage 2 — Silent-Death Detection: BUILD SPEC (real-Soren-vetted, 2026-06-22)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

> **How to use this file:** This is **what DC builds M1 Stage 2 to** — the concrete, real-Soren-vetted build spec, self-contained. It supersedes the round-1 "Soren vet — final build spec" + "Build scope" sections of `_evryn-meta/docs/working/2026-06-17-m1-stage2-design.md` (that vet was a lobotomized subagent — SUPERSEDED, do not build from it). The *design rationale and history* (why one channel + one breaker, Justin's firm decisions, the corruption addendum, the v0.3 deferral) live in that design doc + `_evryn-meta/docs/decisions/041-m1-silent-death-detection.md` (ADR-041); read those for the *why*. This doc is the *what to build*. Sprint tie-back: `evryn-backend/docs/SPRINT-V0.2-HARDENING.md` Step 4 (+ audit-derived Step 67b).
>
> **Provenance:** AC5a assembled this from a clean, fully-loaded **real Soren** re-vet (2026-06-22; receipts + code-level catches verified by AC5a) plus Justin's 2026-06-22 reframe. The round-1 vet was lobotomized; this replaces it.

---

## The frame (Justin's reframe — the design's center of gravity)

The **keystone is a clean, lossless, cleanly-resumable halt.** Justin's logic: *if* a circuit-breaker trip just pauses the system with nothing lost and we can pick right back up on restart, *then* the trip threshold can sit at an aggressive-but-sensible sweet spot, because a false halt costs only a restart. Two things make this safer still: (a) Mark's whole day drains in ONE supervised **~30-minute clustered batch around 10am PT** (sprint Step 58, decided) — so runaway exposure is concentrated into a bounded window Justin can *watch and catch*, not "looming all day and night"; (b) Justin wants a **sweet spot**, not a paranoid-low threshold that halts constantly.

**Hard requirement (Justin):** the circuit-break must be the **ONLY** kind of halt in the system, and **no halt — for any reason — may break things or lose data.**

**Lane interlock (Justin, 2026-06-22):** Lane A (Step 21 — durable Gmail cursor) lands in the **same AC0 convergence deploy** as M1. So M1's restart-recovery is backed by a durable cursor, **not** the latest-10 fallback. There is no "before Lane A." Coordinate the poll-loop seam with AC1a at convergence (both lanes touch `src/email/poll.ts`).

---

## Verdict (real Soren): spine SOUND. GO-WITH-CHANGES on all three design questions.

Re-confirmed against the runtime: `runEvrynQuery` (`src/triage/classify.ts`, the `query()` call site ~line 1179) is the **sole** Anthropic spend door — every pathway (`processForward`, `processDirect`, `handleOperatorMessage`, `checkProactiveOutreach`, `checkFollowUps`, `handleRevisionNotes`) funnels through it, so a kill-switch at its top cuts ALL machine spend regardless of trigger. `sendEmail` (`src/email/client.ts`) does NOT route through it, so the operator's `approve <id>` still works after a trip (correct + desired — the breaker freezes *machine* spend, not the operator's deliberate action).

The clean spine carries forward unchanged: **one DND-respecting alert channel** (`notifyEmergency` → `#emergency-alerts`, immediate, no phone calls in v0.2) + **one circuit-breaker at `runEvrynQuery`** (kill-switch) + **`stopPolling()`** + an **external Anthropic monthly ceiling** (Justin's console action). **Runaway cost is the ONLY condition that hard-halts; everything else alerts only.** The auto-halt must be robust enough to *retire Justin's manual daily-credit-reload chore* (load-bearing).

---

## Architecture (how to structure the build)

- **All new logic in NEW `src/safety/` modules + minimal, well-commented call-site hooks.** This keeps M1's cross-lane merge surface tiny — its hooks touch `poll.ts` / `classify.ts` / `process.ts` / `index.ts`, which other lanes own.
- **Prefer dependency-injection over direct imports** at the hooks (e.g. pass `stopPolling` in) to avoid the `classify → safety → poll → classify` import cycle the round-1 build hit.
- **Pure predicates per the codebase `shouldRun*` pattern** — `shouldTripOnLoopSignature(...)` + `shouldTripOnVelocity(...)`: zero-I/O, unit-testable, with a thin impure shell.
- **Tests are part of "done."** The trip → park → restart → re-process path (below) is the load-bearing one to test end-to-end.

---

## 1. Clean in-flight pause on a trip (Q1) — the keystone

**The trap (confirmed in the runtime):** when the breaker fires mid-query, `runEvrynQuery` returns to `processForward`/`processDirect` with the item still in `processing` (stamped `process.ts` ~L192/L271). Then `ensureItemTransitioned` (`process.ts` ~L38) sees `status === "processing"` and stamps it **`error` + `notifyDev`**. So a naive breaker converts every cost-halt into an error-pile + alert-storm — exactly what we must avoid.

**Build it as a clean PAUSE, not an error:**

1. **Short-circuit shape = empty-return (`""`), NOT throw.** A throw lands in the `processForward`/`processDirect` catch blocks → the same error-stamp + per-item `notifyDev` storm by another door.
2. **Before returning, transition the in-flight item `processing → "new"`** via `updateEmailmgrItem` (the lifecycle-appending path, note e.g. `"breaker-halt — parked for retry"`). The item id is available in `runEvrynQuery`'s `toolLogContext.emailmgrItemId`. This makes `ensureItemTransitioned` a clean no-op (`status !== "processing"`) → **no error stamp, no per-item alert.**
3. **Hold the Gmail cursor.** Propagate a breaker-halt signal up so `handleNewEmail` returns a **NEW `HandleOutcome` value, `"halted"`**, that `planPollBatch` treats like `"transient"` (don't mark processed, hold the cursor). Belt-and-suspenders with the parked `"new"` row.
4. **⚠️ THE LOAD-BEARING SUBTLETY — the dedup-resume rule (AC5a flag, confirmed against `process.ts` ~L91 + `src/db/items.ts`).** The `external_id` dedup (`findItemByExternalId`) currently **skips** any existing row. On restart, the held cursor re-fetches the halted email → `processEmail` finds the parked `"new"` row → it would **skip** → the item is **never re-processed** (and nothing else drains `"new"` — `resetStuckItems` only handles stuck `"processing"`, stamping it `error`). So the dedup must be made coherent: **an existing item in a parked/resumable state (`"new"`) is RE-PROCESSED, not skipped; the skip stays only for terminal / genuinely-in-flight states.** v0.2 is single-replica (singleton confirmed) so there is no concurrent-worker concern. **Build this coherently and TEST the full trip → park-to-`new` → restart → re-process path** — this is the single most important thing to get exactly right; it's what makes the halt lossless and resumable.

**Net:** one emergency alert (the breaker's), zero error-stamps, zero alert-storm, zero dropped mail. A restart is a clean resume.

---

## 2. Restart / resume + reset model (Q2)

- **Kill-switch flag: in-memory, default-OFF, cleared on restart.** Manual reset = restart; a persisting cause re-trips immediately on the first query (correct + observable). This is the right reset model.
- **`stopPolling()` default-ON for a cost-trip** (full freeze — stops ingestion, protects the cursor). `stopPolling()` is currently **dead code** (`poll.ts` ~L153, never called) — M1 is its first caller; test the trip → loop-exit → restart path (never exercised).
- **Restart-recovery is backed by Lane A's durable cursor** (lands same deploy). Invariant to preserve: *no email is ever both (a) past the advanced cursor AND (b) not durably persisted as an `emailmgr_items` row.* Q1's park-to-`"new"` + `"halted"`-outcome enforces it for the in-flight item; Lane A enforces it for the restart boundary.

---

## 3. The "only halt" audit (Q3) — make the breaker the ONLY halt

Soren enumerated every stop/exit/freeze path. **One requires a change; the rest are non-destructive and fine for v0.2.**

**REQUIRED CHANGE — fold the persistent Anthropic-billing path into the same clean halt.** Today (`classify.ts` ~L1258): a billing error throws → each email stamped `error` (`process.ts` ~L228/L310) → poll loop keeps spinning → per-email billing-alert spam → stranded `error` on reload. This is the **most-likely-to-fire** halt (it's exactly why Justin reloads credit daily) and it's structurally the same event as a runaway cost-halt (Anthropic spend unavailable). Fix: in the `runEvrynQuery` catch, when `isBillingError(error)` is true, **trip the kill-switch** (the same flag the velocity detector trips) before re-throwing — or treat a persistent billing error as a trip condition. Once tripped: the in-flight item parks to `"new"` (per Q1), the breaker fires **one** `notifyEmergency`, `stopPolling()` freezes ingestion, subsequent emails short-circuit at the top of `runEvrynQuery` with zero spend and zero per-item error-stamps. Keep the existing `isBillingError` `#dev-alerts` log as a *secondary*, but the operator-waking signal is the single `notifyEmergency`, and the per-email repetition stops the moment the flag trips. **This is core M1 scope — it's the proof the breaker is genuinely the only halt.**

**Acceptable as-is (non-destructive, document where noted):** startup `process.exit(1)` on Supabase-connect failure (`index.ts` — pre-work, nothing in-flight); `maxTurns: 20` exhaustion → `error` stamp (a genuine per-item failure, stale-checker backstops); `uncaughtException`/`unhandledRejection` (`index.ts` — alert + keep running, the external heartbeat backstops a wedged-but-alive process); `SIGINT`/`SIGTERM` → `process.exit(0)` (a deploy mid-query strands one item `error` via `resetStuckItems` on reboot — accepted; **note it in the operator-guide**).

---

## Detectors (re-derived clean)

- **In-process attempts counter at the top of `runEvrynQuery`** — count **attempts** (queries entered), **NOT** `llm_usage`. `recordLlmUsage` is post-completion + best-effort/swallowing + **explicitly skips mid-stream throws** (`classify.ts` ~L1239–1257, the NB1 comment) — the exact runaway shape — so it is disqualified as a safety sensor.
- **Loop-signature detector (primary):** trip on **high repetition of a single `(pathway, scopeUserId, emailmgrItemId)` signature** in a rolling window — clustering-robust by construction (a legit 200-email cluster = 200 *distinct* signatures, low repetition; a runaway = high repetition on a bounded set). All three fields are available at the boundary via `toolLogContext` (`classify.ts` ~L656–667). Set the repetition threshold low (the same item reprocessed >~5–10× in a window is never legit).
  - **⚠️ Real false-trip bug to handle (confirmed via `toolLogContext` population):** `handleOperatorMessage` and `checkProactiveOutreach` pass **no `emailmgrItemId`** → a heavy operator Slack session repeats signature `(handleOperatorMessage, scopeUserId, null)` and would false-trip the loop-signature halt. **Exclude operator-pathway activity from the loop-signature detector** (human-paced, human-gated — not a machine runaway); still count it toward the velocity backstop.
- **Velocity ceiling (dumb backstop):** absolute attempts/hr. **SHIP CONSERVATIVE** — do NOT guess an aggressive number pre-Mark (no real cluster-volume data yet). **Post-Mark: ratchet to ~1.5× the measured clustered-morning peak** once `llm_usage` post-cleanup data exists (Step 43). The clean halt licenses the aggression; the supervised ~30-min window bounds the exposure. **No dedicated short-window rate gate** — one calibrated ceiling is simpler and more in the spirit of the reframe; the ~$1,400 worst-case burn-gap (a runaway faking a new item-id each cycle) is handled by the calibrated-tight ceiling + the watched window, not a second mechanism.

**On trip (any detector):** set the kill-switch flag → `stopPolling()` → `notifyEmergency`. Hard-halt, no auto-reset (v0.2; ADR-007 deviation, named in ADR-041).

---

## Tier-B conditions (alert-only, immediate, non-piercing)

- **External heartbeat (process-death / loop-wedge):** a **Healthchecks.io dead-man's-switch pinged from INSIDE the poll loop**, in the `try` block **after `consecutiveErrors = 0`** (`poll.ts` ~L90) — so it proves the *core ingest succeeded*, not merely that the loop spun. **NOT a `/health` poll** — `/health` (`index.ts` ~L50–53) always returns 200 even if the loop is wedged (confirmed; audit Step 67b). Don't gate the ping on the checkers (`checkStaleItems` etc. — they have their own `alertCheckerFailure` path). Outbound ping fully swallowed + short timeout (the monitor must never wedge the patient). Healthchecks grace ~15 min (above the 5-min max backoff). `HEALTHCHECK_URL` in `.env`, degrade gracefully if unset.
- **Hard auth (persistent 401/403):** `isAuthError` mirroring `isBillingError`, in the `runEvrynQuery` catch + the poll path. **Distinguish Anthropic-auth (Evryn brain-dead) from Gmail-auth (can think, can't see/send)** — the alert must name WHICH subsystem. Require persistence, not a single transient blip.
- **Polling-dead:** escalate `consecutiveErrors` past a sustained **wall-clock** threshold (~15–30 min) from `notifyDev` to `notifyEmergency`, **reusing the existing `alertCheckerFailure` cooldown rate-limiter** (`poll.ts` ~L45–66) — don't invent a second.

---

## Watch-the-watchman (KEEP — needs a status-reporting variant)

`notifyEmergency` (`src/notify/emergency.ts` ~L81–89) **swallows on final failure by design** (confirmed: 3 retries, then `console.error` + return, never throws). So a misconfigured webhook / un-VIP'd app / rotated token means every detector fires into a void — the deepest silent-death. Build:
- **`notifyEmergencyWithStatus(): Promise<boolean>`** — a variant that reports post success (the current function returns `void`).
- **A daily positive affirmation** ("M1 alive — emergency channel OK") posted via the emergency path that ALSO pings an independent **Healthchecks.io "daily-affirmation" check, GATED on the emergency post returning ok** → a broken channel → no affirmation ping → independent alarm. **Core scope, not polish** — without it the whole alert layer can fail silently, defeating M1.

---

## Send-bypass (tier-5 structural assertion, ~5 lines)

`sendEmail`'s only callers are `executeApproval` (post `pending_approval` status-gate) + `submitDraftForApproval`→review@ (confirmed; neither routes through `runEvrynQuery`). So the approval gate is structurally the only outbound exit. Add a guard at the `sendEmail`/`executeApproval` boundary that fires `notifyEmergency` + refuses the send if the `pending_approval` + operator-provenance invariant is ever violated. No watching infrastructure — it's an assertion (the bulkhead's watertight door).

---

## Cron move

`PROACTIVE_CHECK_HOUR_PT` env 8 → 10 (so an overnight death → morning restart still leaves the day's check-in to fire). **Do NOT move the morning sweep's `QUIET_END_HOUR_PT` in the same change** — different gate; one env must not move both.

---

## Operator-guide + ADR (AC5a's job, not DC's)

- AC5a rewrites the `evryn-backend/docs/operator-guide.md` M1/DND section (DND-respecting model, the auto-halt behavior, how to read why it tripped + restart after a halt, the SIGTERM-strands-one-item note, setting the Anthropic monthly ceiling).
- AC5a updates ADR-041's suspect refinement details to match this real-Soren spec (the spine in ADR-041 already stands).

---

## Env vars introduced

`HEALTHCHECK_URL`, `HEALTHCHECK_AFFIRM_URL` (the daily-affirmation check), `PROACTIVE_CHECK_HOUR_PT=10`. Plus any threshold tunables (loop-signature repetition count, velocity ceiling) — env-configurable so the post-Mark ratchet needs no code change.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
