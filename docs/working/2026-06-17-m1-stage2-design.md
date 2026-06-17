# M1 Stage 2 — Silent-Death Detection: Design (AC0 → AC5, 2026-06-17)

> **How to use this file:** AC0's design for M1 Stage 2. This is **AC5's brief** (the dedicated M1 AC) — read it under the shared spin-up preamble in `docs/sessions/2026-06-17-parallel-lanes-brief.md` (full-cascade load, AC-in-charge judgment, design-call surfacing, build-to-QC-GO-on-branch). Run it: independent **Soren** vet → **DC** build → **QC** → coordinate Justin's phone smoke-test → hand the QC-GO branch + a high-res working-doc back to AC0 for convergence. Sprint Step 4. Grounded in the runtime (`evryn-backend/src/`, loaded 2026-06-17).

## What M1 is, and where Stage 2 sits

M1 = **silent-death detection** — the one go-live blocker the approval gate can't backstop (the gate catches what Evryn *says* wrong; it cannot catch the system going *dark* or *runaway*). **Stage 1 shipped:** the `#emergency-alerts` VIP'd Slack bot + `notifyEmergency()` (`src/notify/emergency.ts`), smoke-confirmed 2026-06-16. **Stage 2 (this) = the detectors + the right alert routing per Justin's philosophy below.**

## Justin's two-tier emergency philosophy (2026-06-17 — THE framing; design follows this)

Justin defined exactly two kinds of emergency and how loud each should be. **This is the spine — route every detector to one of these tiers.**

### Tier A — RUNAWAY COST (the ONLY wake-Justin-at-2am alert)
A stuck loop burning Anthropic API money overnight. Justin: *"I will absolutely get up at 2am and kill the process — I don't mind that call at all."* Bankruptcy-prevention is worth waking for.
- **Detectable + alertable in-process** — the process is *alive* (just misbehaving), so it can both detect (spend-rate / volume / loop-rate anomaly) and alert itself.
- **Channel: a phone CALL** (Slack sounds — Justin tested them — he'd sleep through). 
- **HARD CONSTRAINT (Justin):** *phone calls only pierce his DND from **whitelisted numbers**.* So the alerting service MUST call from a **dedicated, consistent caller-ID number** that Justin saves as a contact + whitelists/stars (Android "calls from starred contacts pierce DND"). A service with rotating/anonymous numbers will NOT pierce. **This gates service selection.**
- **AUTO-HALT — HARD MUST [DECIDED — Justin, 2026-06-17].** Not optional. Justin's words: *"we HAVE to have this right away… I have such a tight capital situation… if a process burns my whole month overnight, that's a fucking disaster — might be company-ending."* So M1 ships an **auto-halt circuit-breaker**: on detected runaway, **stop polling/processing AND fire the Tier-A call**. Don't make bankruptcy-prevention depend on Justin being reachable (ADR-007 — money is the limit). 
  - **Interim safety net (already in place):** Justin contains the risk today by **loading only ONE day of API spend at a time and reloading daily** — so the absolute worst case is bounded to a day's credit (then Anthropic stops → Evryn goes dark → Tier B morning-handled). That's his manual circuit-breaker; the auto-halt makes it sustainable (he can stop the daily-reload chore without exposing the month).
  - **THE design challenge (Justin handed this to us — AC5 + Soren own it):** distinguish a *runaway* from a *legit-but-heavy* day so we don't false-kill real work. Anchor on the volume reality (`evryn-cost-analysis` / cost-levers §10): a legit day is **bounded** — ~200 forwards, each a bounded query (`maxTurns:20`). A runaway is **unbounded** — the same item/sender/subject cycling, or volume far past the legit ceiling, or spend-velocity past a per-hour threshold well above legit-max. So the breaker keys on *unboundedness* (loop-signature + a spend/volume-velocity ceiling set comfortably above a heavy legit day), not on raw volume — and errs toward halt+call (a false-halt degrades to Tier B, which Justin accepts; a false-negative is the company-ender). Use the live `llm_usage` capture for spend-velocity. **Design it carefully, surface the threshold logic to Justin (3-part form) before shipping.**

### Tier B — SILENT-DARK / PROCESS-DEATH (a MORNING notification, NOT a 2am pierce)
The process stopped; nothing critical happens until the morning batch would run. Justin: *"I don't want to be woken at 2am for something I really could just deal with in the morning… if someone gets a message that she's offline at 2am and waits until 7am, I'm okay with that"* (Seattle-only; 24/7 uptime waits for the revenue that funds a 2am responder).
- **Channel/timing: a ≤7am-weekday notification, NON-piercing** (Slack ping he sees on waking, ± a gentle text). Explicitly NOT a 2am call.
- **Pair with a cron-timing move (cheap, high-value):** shift the morning crons **later** so a 7am death-notice gives a fix-window before they fire. Today `PROACTIVE_CHECK_HOUR_PT=8` and the morning sweep fires at quiet-window-open (8am). **Move both to ~9–10am PT** (env change for the proactive cron; `checkMorningSweep`/`QUIET_END_HOUR_PT` for the sweep — verify the sweep's trigger when building). Then: overnight death → 7am notice → Justin restarts → 9–10am batch fires clean.

### Tier routing of the five conditions
| Condition | Tier | Why |
|---|---|---|
| Runaway loop / volume / spend-rate anomaly | **A (2am call)** | the money case |
| Process-crash / poll-loop-wedge | **B (morning)** | dark ≠ critical-overnight |
| Hard auth fail (401/403) | **B (morning)** | Evryn can't work = dark; no spend |
| Polling-dead after retries | **B (morning)** | dark; no spend |
| Send bypassing `SEND_ENABLED`/approval gate | **B (immediate, non-piercing)** | trust-critical but already happened (can't un-send) — surface ASAP, don't wake |

## The detectors, grounded in the runtime

| # | Condition | Seam | In-process / external |
|---|-----------|------|----------------------|
| 1 | Runaway (Tier A) | `pollOnce`/`handleNewEmail` rate + an estimated-spend-rate read off the `llm_usage` capture (ADR-038, already live) | In-process detector + (proposed) auto-halt |
| 2 | Process-crash / loop-wedge (Tier B) | — | **EXTERNAL heartbeat** (below) |
| 3 | Hard auth (Tier B) | poll-loop + `runEvrynQuery` catch blocks (`isBillingError` already special-cases Anthropic 402) | In-process |
| 4 | Polling-dead (Tier B) | `startPolling`'s `consecutiveErrors` (already counted) → escalate past a hard threshold | In-process |
| 5 | Send-bypass (Tier B immediate) | invariant guard at `executeApproval`/`sendEmail` | In-process |

## External watchdog (condition 2) — still required, now Tier-B-routed
A dead process can't alert itself → an external **heartbeat dead-man's-switch**: the poll loop pings an external service every cycle; if pings stop for N min, the service fires. **Pick the heartbeat shape** (process pings out) over a `/health` poll, because `/health` can return 200 while the poll loop is wedged (the worst silent shape). **But route its alert to Tier B (morning), not a 2am call** — process-death is a morning problem per Justin. (So the external service needs schedulable/severity-tiered alerting, or we keep it simple: it texts/Slacks, doesn't call.)

> **Design note vs. my first draft:** I originally had the external watchdog as the *pierce* channel. Justin's philosophy inverts that — **the pierce (2am call) belongs to Tier A (cost), which is in-process; the external watchdog serves Tier B (death), which is morning-only.** The call-capable service is for Tier A.

## THE MAJOR DESIGN CALL — surfaced for Justin (updated to the two-tier model)
> **1. The call:** How does each emergency tier reach Justin at the right loudness?
>
> **2. What I chose:** **Tier A (runaway cost)** → an **in-process detector** (loop/volume + spend-rate off `llm_usage`) that fires a **phone CALL from a dedicated whitelisted number** (a paging/monitoring service whose caller-ID Justin can star/whitelist) + a `#emergency-alerts` post; **plus a conservative auto-halt** (recommended — see sub-call). **Tier B (silent-dark / death)** → in-process detectors (polling-dead, hard-auth, send-bypass) + an **external heartbeat dead-man's-switch** (for true process-death), all routed to a **≤7am non-piercing morning notice**; **and move the morning crons to ~9–10am** for a fix-window.
>
> **3. Top alternatives + why not:**
> - *One loud channel for all emergencies:* rejected — it would wake Justin at 2am for a benign overnight death, the exact thing he doesn't want.
> - *Slack-only (no call):* rejected for Tier A — he'd sleep through Slack sounds; the money case needs the call.
> - *External watchdog as the pierce (my v1):* rejected — death is morning, not 2am; the pierce belongs to the cost case.
>
> **Sub-calls — RESOLVED [Justin, 2026-06-17]:** (a) **auto-halt: YES, hard must** (see Tier A above); (b) **batch/cron hour: 10am PT** (Justin: "10am, just for safety" — the wider fix-window); (c) **paging service: AC5 chooses** — Justin: *"you choose, but think carefully and DO RESEARCH."* **AC5: research paging/alerting services, pick one that supports a stable, whitelistable dedicated caller-ID** (a number Justin can save as a contact + star so the call pierces Android DND — verify against *his* phone/carrier in the smoke test). Better Uptime / PagerDuty / Cronitor are starting candidates, not the answer — do the research, justify the pick, surface it.

**Two forward-design notes (don't bake in today, but design so they're cheap later):**
- **Configurable alert recipient.** Justin is making the ops team autonomous next week (Railway SDK agents); **OC is a top candidate to take the middle-of-the-night calls** and fix-before-morning (*"wake up to a 'fixed this overnight, boss' message"*). So design M1's alert routing so the **recipient is configurable** (Justin now → OC later) rather than hard-wiring Justin's number/handle.
- **Clustering heartbeat (forward dependency).** The decided daily-cluster model (cost-levers §6b — see AC0's note to Justin) means a silent *cluster* failure = a whole missed day. When clustering lands, M1's Tier-B heartbeat should include a **positive daily "cluster ran: screened N, escalated M, drafted K"** signal, not just error alerts. Clustering isn't in this wave yet — but build the heartbeat so that signal can slot in.

## ALIGNMENT FLAG for Justin (operating-model — worth catching now)
Your framing assumes a **"morning batch of Mark stuff."** The runtime today does **not** batch: forwards are triaged **in real-time per forward** (`processForward`), drafts → your approval throughout the day. The only *morning-fire* things are `checkProactiveOutreach` (8am daily check-in) + `checkMorningSweep` (8am pending-approval digest *to you*). The **once-a-day cluster delivery** (one morning package to Mark) is **DECIDED-but-NOT-built** (sprint Step 6b / 48a). So: M1's morning-timing work = moving those 8am crons later — but **is the daily-cluster delivery something we need built before Mark**, since your mental model assumes it? Flagging so we're aligned on how Mark actually experiences it. *(Not an M1 blocker — but a real product-model question.)*

## Build scope (after Justin's nods + Soren vet)
- **In-process (DC, unit-testable — extract predicates per the codebase `shouldRun*` pattern):** runaway detector (+ auto-halt if approved), hard-auth classification, polling-dead escalation, send-bypass invariant guard; the cron-hour move.
- **External heartbeat (DC + Justin):** the poll-loop heartbeat ping + the service account/config; Justin saves+whitelists the caller-ID and does the pierce smoke-test (the Stage-1 analog).
- **Doc:** rewrite the operator-guide M1-DND section correctly (current section carries the old imperfect "add Slack as Android exception" theory).
- **ADR:** the external-paging dependency + the two-tier philosophy warrant an ADR.

## Sequence
1. **Justin nods** the two-tier design + the open sub-calls (auto-halt / batch-hour / service). *(Pending.)*
2. **AC5 spins a real Soren** to vet (conditions, seams, tier routing, the dependency + auto-halt).
3. **AC5 creates the M1 worktree** + briefs DC (in-process detectors + heartbeat + cron move).
4. **Justin** stands up the paging service + confirms the call pierces his DND.
5. QC → AC5 hands the QC-GO branch + a high-res working-doc to AC0 for convergence.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
