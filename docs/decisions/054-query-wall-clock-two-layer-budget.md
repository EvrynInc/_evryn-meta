# ADR-054: A Two-Layer Wall-Clock Budget on `runEvrynQuery` (Silence Watchdog + Absolute Ceiling)

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

**Status:** Accepted — built, reviewed (two independent QC passes), live-path exercised; merge/deploy Justin-gated
⚠️ **Precision on "live-path exercised":** the two budget layers were exercised live end-to-end (see *Evidence*). The **nested note-turn liveness relay** — the last piece added, and the only structurally novel one — is covered separately; see *The nested-query interaction* below for exactly what was proven and when.
**Date:** 2026-08-04
**Author:** AC2 (cost/hardening lane)
**Reviewers:** DC (build), QC (independent fresh-eyes review — GO/conditional, three findings), Justin (design steer: he pushed back on the original flat cap and asked for a per-turn watchdog to be evaluated instead)
**Related:** [ADR-041](041-m1-silent-death-detection.md) (M1 silent-death detection + the circuit-breaker halt this deliberately does NOT touch), [ADR-043](043-lean-reflection-v0.2.md) (LEAN Reflection — the caller that gets a per-call ceiling override), [ADR-047](047-v0.2-security-bulkheads.md) (the WebFetch/WebSearch egress deny-hook, which can allow/deny but structurally cannot time-bound a tool), [ADR-049](049-daily-clustering-pipeline.md) (Clustering — the note-turn pathway that nests a query inside a query). Build spec + prior review: `_evryn-meta/docs/working/2026.07.16-ac2-dc-webfetch-timeout-brief.md`. Sprint handle: **Step 94**.

---

## Context

`runEvrynQuery` (`evryn-backend/src/triage/classify.ts`) is the single door through which Evryn thinks. It drives every triage via `for await (const message of query({...}))`, with `maxTurns: 20` as its only bound — and `maxTurns` caps **turns, not time**.

Evryn web-researches essentially every real sender at triage. The built-in `WebFetch`/`WebSearch` tools are gated only by the shape-based `web-guard` `PreToolUse` hook (ADR-047), which can allow or deny a call but **cannot time-bound one**. So a fetch to a host that accepts the connection and then never responds blocks that `for await` loop **forever**.

Because the poll pipeline is single-threaded and fully awaited — `startPolling → pollOnce → planPollBatch → handleNewEmail → processEmail → runForwardTriage → runEvrynQuery` — **one hung fetch wedges the entire mail loop.** No mail is processed at all.

**The reason this is dangerous rather than merely annoying: none of our existing guards can see it.** Every M1 layer watches for *errors*, and a hang produces none:

- The **polling-dead escalation** (`src/safety/polling-dead.ts`) keys on `consecutiveErrors`. A hang throws nothing, so the counter never increments and the escalation never fires.
- The **Healthchecks heartbeat** (`src/safety/heartbeat.ts`) is pinged only *after a successful poll*. A wedged loop simply stops pinging, so the signal is silence — detected by an external alarm ~15 minutes later, with a **manual Railway restart** as the only recovery.
- The **B2c backstop** (`ensureItemTransitioned`, `src/email/process.ts`) runs only *after* `runEvrynQuery` returns. A hang never returns, so it structurally cannot fire.

Observed live: a Gate-A test fixture hung `runEvrynQuery` for ~27 minutes before AC2 killed it by hand. That item (`a12`) was still frozen at `processing` on the DEV database weeks later — the hang preserved in amber.

**The culprit was never proven, and that matters for the shape of the fix.** `a12`'s own recorded reasoning shows its domain fetch failed *fast* (`ECONNREFUSED`), so the hang was some later call we never identified. A whole-query-level cap is robust to not knowing which call hung; a narrower per-call fix would not be. Do not let a future instance argue we should pin the exact culprit before fixing this — that reasoning is backwards.

**Once Mark forwards, one dead website in one forwarded email stops everything until a human notices and restarts her.**

---

## Decision

Bound `runEvrynQuery` with **two layers that sense different things**, rather than one flat wall-clock cap.

### Layer 1 (primary) — an inter-message **silence** watchdog

`EVRYN_QUERY_SILENCE_TIMEOUT_MS`, default **120000 (2 min)**. Every message the query stream yields refreshes a `lastMessageAt` timestamp; a bounded tick consults a pure predicate (`shouldFireSilenceWatchdog`, `src/safety/query-watchdog.ts`) and aborts only when **nothing at all** has arrived for the whole budget.

This is the layer that distinguishes *stuck* from *working hard*.

### Layer 2 (backstop) — an absolute whole-query **ceiling**

`EVRYN_QUERY_TIMEOUT_MS`, default **600000 (10 min)**, per-call overridable via `timeoutMsOverride`. `maxTurns: 20` bounds turns but not time, so a "progressing but endlessly slow" query could still occupy the single-threaded poll loop for a long while. This ceiling is deliberately generous — it is the last resort, **not** the working limit.

### The enabler — `includePartialMessages: true`

Passed to `query()`. Without it the watchdog is not merely less effective, it is **actively wrong** (see the evidence below).

### Both layers abort via `AbortController`, never `Promise.race`

`abort()` terminates the underlying Claude Code subprocess and any hung fetch inside it. `Promise.race` (the pattern `src/triage/haiku-screen.ts` uses) merely *ignores* the still-pending query, which for a 20-turn tool-calling query would leave a **subprocess zombie per timeout**. That divergence from the Haiku screen is deliberate: the screen is `maxTurns: 1` with no tools and finishes fast, so a race is fine there and not here.

---

## The evidence this rests on (measured, not reasoned)

The design question — flat cap vs. silence watchdog — turned on two empirical facts about the SDK's message stream. AC2 probed the pinned SDK directly (source reading plus four live runs) on 2026-08-04, **before** specifying the design.

| Question | Finding | Consequence |
|---|---|---|
| Does a **running tool** emit anything that would reset a silence watchdog? | **No.** A `WebFetch` against a 10-second-delay endpoint produced a **13.8s gap with zero messages**, ending exactly at the `user` message carrying the tool result. Confirmed at source: `tool_progress` is the only message type that could fire mid-tool, it is hardcoded `tool_name:"Bash"`, and it is gated behind `CLAUDE_CODE_REMOTE`/`CLAUDE_CODE_CONTAINER_ID` — neither of which this runtime sets. | A hung tool produces **unbounded silence**. The watchdog fires on it correctly. This was the fact that could have killed the whole design, and it came out favorably. |
| With `includePartialMessages` **off** (the SDK default, and what this runtime used), is a long generation also silent? | **Yes.** A 1200-word generation produced a single **19.9s gap** with zero messages. | A naive silence watchdog would abort exactly the long-but-productive work it exists to protect. **This is why `includePartialMessages: true` is load-bearing and not cosmetic.** |
| With partials **on**? | The same prompt streamed **101 messages, largest gap 4.2s**. | Silence stops meaning "busy" and starts meaning "stuck" — the premise layer 1 depends on. |

**A fourth data point, learned by getting it wrong:** an early live test set the silence budget to 5s and watched it abort a perfectly healthy streaming generation at 11.5s. That empirically confirms the ~4.2s measured gap is close to a real floor, and it is why the default is 120s (roughly 30× headroom) rather than something tighter. The code documents this practical floor but deliberately does **not** enforce it, so a test can still choose a fast-firing budget on purpose.

### Live-path evidence (real model, breaker clear, on DEV)

The two budget layers were exercised against the real system, not stubs — the protocol's standing rule is that a new interactive pathway is not GO-eligible on stubbed coverage alone, because stubs prove the plumbing and not the behavior.

- **The silence watchdog fires on real silence.** Against a genuinely silent real `WebFetch` tool window with a 5s budget: aborted at 14.2s, threw, and the throw reached the caller.
- **The ceiling fires independently.** With the silence budget at 60s and a per-call ceiling override of 8s, it aborted at 8.3s — unambiguously the ceiling, since the run was shorter than the silence budget.
- **Legitimate long work survives** — the behavior change the whole redesign exists for. A streaming generation ran past a 5s silence budget untouched, where the superseded flat cap could not have told it from a hang.
- **The end-to-end chain holds.** Driven through the real `processEmail`: an aborted triage returned `"completed"` (it did not wedge, and did not throw out to the poll loop), the item landed **`error`** rather than stuck at `processing`, and the next email processed normally.
- **At the shipping defaults**, a normal forward triaged cleanly in **91.5s** to `pending_approval` and the watchdog never touched it. This is simultaneously the false-positive check *and* the measurement that shows how thin the nested-note-turn margin was.
- **No zombie subprocess**, and **0 EPIPEs across 3 aborts** — the alert-noise concern raised in review (that routine aborts would train the operator to skim past "UNCAUGHT EXCEPTION") did not materialize. The abort-adjacent labelling added in `index.ts` is therefore precautionary, and suppresses nothing.

---

## Why not the alternatives

**A flat whole-query cap (the original build, superseded here).** It cannot tell stuck from busy, so it necessarily cuts off legitimate long work. That is not hypothetical: `src/reflection/consolidate.ts` calls `runEvrynQuery` and inherited the cap, while `evryn-backend/identity/activities/reflection.md` promises, verbatim — *"Soft length — never a hard cap … let it be as long as it needs, and never truncate a real one to hit a number … it never cuts it."* An identity instruction programs behavior as surely as a line of code, so a cap that silently contradicts one is a real defect.

Worse, on that path a flat cap **ratchets** rather than degrading: a timeout writes *nothing* (both the validation guard and the persist sit after the query), so the pending notes are preserved and keep growing, so the next hourly attempt is longer and likelier to time out — burning a full Opus call every hour, forever, and never healing.

**A per-`WebFetch` timeout.** Not achievable. The built-in tool exposes no timeout through the SDK, and a `PreToolUse` hook can only allow or deny a call, never time-bound it. This is the direct answer to the question of what was actually reachable.

**Raising the global ceiling to suit Reflection.** Rejected. That would weaken the wedge protection on the actual poll loop — the entire point of the change — to serve one caller. Reflection gets a **per-call override** (`REFLECTION_QUERY_TIMEOUT_MS`, 900000 / 15 min) instead. The silence watchdog is *not* overridable and still protects that path: a genuinely stuck consolidation is caught in ~2 minutes regardless.

---

## M1 independence (a hard invariant of this change)

**A hang is a slow external dependency, not a runaway.** Neither layer may be allowed to look like a cost event:

- Neither layer calls `haltForBreaker`, calls `parkInFlightItemForHalt`, or returns `BREAKER_HALT_SIGNAL`.
- Both timers are created **after** the two M1 breaker gates, so a breaker-halted query never arms a timer.
- The timeout branch is gated on `action === "rethrow"`, so `classifyQueryError` runs first and **wins**: a genuine billing error trips the breaker even if a timer fired in the same instant. A missed cost-halt is far worse than a missed timeout alert.
- Both timers are cleared on **every** exit path, including the billing-halt `return` inside the `catch`.

The abort is detected by a **local flag**, never an error sniff: the SDK's abort rejection has `.name === "Error"` (not `"AbortError"`), a minified constructor, and no `status`, so the obvious sniff would silently never fire.

---

## Consequences

**What improves.** A hung external call is now caught in ~2 minutes instead of never, the item follows the normal error path, and the poll loop keeps moving. This is strictly better than the flat cap on *both* axes: it catches a real hang **faster** (2 min vs 3) *and* it stops cutting off legitimate long work entirely.

**What this costs.** `includePartialMessages: true` means the stream carries ~100× more messages per generation. These are inert to every consumer (`SDKPartialAssistantMessage` has no `result` key, so the `if ("result" in message)` branch never matches them; usage capture and `llm_usage` are untouched) and add no API cost — they are streaming deltas of the same request. The per-message cost is one timestamp assignment.

**Accepted residual — the Reflection ceiling is still a ceiling.** A 15-minute backstop does not *literally* satisfy `reflection.md`'s "never a hard cap." We accept this deliberately: that promise is about not truncating a rich story to hit a length target, and a wall-clock backstop does not do that. Removing the ceiling entirely on that path would restore unbounded occupancy for a caller that shares the poll loop's process. With ~10–15× headroom over a realistic consolidation and a non-overridable watchdog underneath, the promise is honored in practice. **Recorded here so nobody re-derives it as a fresh defect.**

**Accepted residual — a timed-out item does not auto-retry.** Nothing drains `status: "error"`; the 4-hour stale-error check re-pings it and it needs manual handling or a re-forward. (`ARCHITECTURE.md`'s lifecycle diagram shows `error → (retried back to processing)`, but no code implements that.) The operator alert states this plainly rather than implying a retry that does not exist.

### The nested-query interaction the watchdog cannot see on its own

Clustering's note-turn (ADR-049) runs a *full inner* `runEvrynQuery` inside an MCP tool handler of an *outer* one. Because a running tool emits nothing, the outer stream goes silent for the inner triage's entire duration. **This margin is thinner than it sounds: a real end-to-end triage was measured at 91.5 seconds against the 120s silence budget.** Left unhandled, the watchdog would abort a perfectly healthy note-turn and then report the forward as "safely queued" when the inner call had already moved it out of `queued`.

**This was caught by QC's independent review, not by the build** — the build's own author had read `process.ts` in full and still did not connect the note-turn to the invariant he was creating.

**The fix** propagates liveness from the inner query's stream to the outer watchdog (`onActivity` → `NoteTurnContext.keepAlive`), so the outer is extended **only while the inner is genuinely producing messages**. Three properties make that safe, and all three are verified in code: a hung inner relays nothing, so the outer's own budget still expires; the **absolute ceiling is never extended**, so poll-loop occupancy stays bounded regardless of nesting; and the relay chains automatically, so it composes to arbitrary depth rather than one level.

**On the ordering when an inner query genuinely hangs:** the *outer* watchdog typically fires first, not the inner's. Both budgets are 120s, but the outer's clock was last refreshed at the `tool_use` message a second or two *before* the inner's clock is seeded. So the expected sequence is: the outer aborts, the inner keeps running detached until its own watchdog fires, and the operator sees two alerts. The end state is still correct — the item lands `error`, the forward is not lost, the loop is not wedged — but the detached-handler case is the **normal** path here, not an exotic race.

**A standing constraint this creates, which is not obvious from any single file:** any MCP tool handler that does more than the silence budget of work will trip the outer watchdog. Every handler registered in `buildEvrynMcpServer` was enumerated and checked — 16 of them, of which only `resolve_noted_forward` nests a query; the heaviest non-nesting handler (`submit_draft`) is seconds-scale. The one shape worth remembering: `notifyDev` performs an un-timeout-ed `fetch` with retries, so a hung Slack webhook inside a guarded handler would be unbounded — it degrades correctly (the watchdog catches it, which is the intent), but it is the concrete edge of this constraint. **Anyone adding a tool handler that could run long must account for this.**

**What is proven, and what is not.** The two budget layers are live-exercised end-to-end (below). The relay is unit-tested in both directions, and that test is *discriminating* — it was mutation-checked by disabling the relay line and confirming the suite goes red. But the test **simulates** the relay against the pure predicate, so it would stay green even if the runtime plumbing (`keepAlive` → `onActivity` across the three hops) were deleted. A `keepAlive` that never gets populated degrades **silently** back to pre-fix behavior via optional-call — so the simulation cannot be the last word.

**⚠️ The live relay exercise was ATTEMPTED and is NOT yet complete — do not read this ADR as saying it passed.** Two runs on DEV (real model, breaker clear, `CLUSTERING_MODE=manual`, a real hand-forward with a personal note) both came back **inconclusive for the same characterized reason**, verified from `llm_usage` rather than inferred: in each run **no inner query ever started**, so the relay was never exercised. The runs are still informative — see the finding below.

**⇒ The definitive exercise is gated to the `CLUSTERING_MODE` flip**, which is already a supervised pre-Mark step on the Go-Live Checklist and is the natural venue: a real note-turn at the production budget, observed. Until that flip the whole note-turn pathway is **structurally unreachable** (`runForwardNoteTurn` sits inside `processForward`'s `if (clustered)` branch, and `CLUSTERING_MODE` is unset in prod), so nothing here can fire — or misfire — in production.

### 🔎 A finding from the attempts, worth more than the attempts themselves

**The note-turn's own research can occupy a single unbroken silent tool call of more than 60 seconds** — before it ever resolves the forward. That is why both shrunk-budget runs aborted: the outer query tripped its own reduced budget during its *own* web research, never reaching `resolve_noted_forward`.

Two consequences worth carrying:

1. **The note-turn pathway runs closer to the silence budget than ordinary triage does.** An ordinary forward triages in ~91s *total* with no single gap anywhere near the budget; the note-turn produced a *single gap* over 60s. At the 120s production default that is still inside budget, but the headroom is under 2× rather than the ~30× the streaming measurements suggested. **Watch this at the clustering flip** — if a single research call ever crosses 120s, a note-turn will abort on its own with no nesting involved. The failure is safe (the item stays `queued` and rides the next batch) but the operator would see an abort alert with no obvious cause.
2. **The discriminating window for testing the relay at a shrunk budget is narrow** — it must sit above the outer's own research time and below the inner triage's duration, and both endpoints vary per run. That is why forcing it at a small budget was the wrong instrument, and why the supervised flip is the right one.

**The general lesson, worth carrying beyond this change:** a watchdog that infers "stuck" from the *absence* of a signal is only as good as its assumption that a healthy system always emits. Enumerate every handler the watched stream can block on, and ask whether any of them can re-enter the same subsystem. Where one can, feed the watchdog direct liveness from inside the nested call — do not simply widen the budget.

---

## Operator surface

Three new env knobs, all bounded at **both** ends and fail-safe to their defaults on unset, garbage, or out-of-range input:

| Var | Default | What it does |
|---|---|---|
| `EVRYN_QUERY_SILENCE_TIMEOUT_MS` | `120000` | The primary layer. Abort when the query stream has been completely silent this long. |
| `EVRYN_QUERY_TIMEOUT_MS` | `600000` | The backstop ceiling on total query wall-clock. Raised from the superseded flat cap's `180000`. |
| `REFLECTION_QUERY_TIMEOUT_MS` | `900000` | The Reflection pathway's larger ceiling override only. |

**The both-ends bound is not incidental.** Node coerces a `setTimeout` delay above 2147483647 to **1 ms** — it neither clamps nor throws. So an operator entering a huge number to mean *"effectively no cap"* would have inverted their intent into *"abort every query instantly,"* taking down triage, Reflection, follow-ups, proactive outreach, and operator chat at once, while the alerts flooded with self-contradictory "aborted after 2147483648ms" lines that misdirect the diagnosis. `Infinity` already failed safe; a finite out-of-range integer did not. A single shared bounded parser now backs all three knobs so they cannot drift apart.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
