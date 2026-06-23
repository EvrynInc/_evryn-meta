# AC1 Brief — Silent-Failure Audit (Pre-Mark-Live)

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

> **⚠️ PAUSED — 2026-05-29 evening. Do NOT begin the audit until DC1 + Mira have shipped their pre-Mark trips.** Decision landed 2026-05-29 evening (Justin's call). Reasoning: DC1's force-load + dossier refactor + approval-mechanism redesign + thread-history-in-drafts fix will restructure many of the same files you're about to survey (`composeSystemPrompt`, pathway entry points likely renamed, the approval parser, `submitDraftForApproval`, possibly more). Mira's parallel trip will also reshape Evryn's behavior in ways that affect what failure modes are surface-relevant. **Auditing against the pre-DC1 codebase is wasted effort — you'd identify fixes for files about to be replaced.** You stay spun up so AC0 can dispatch you the moment DC1 + Mira ship; until then you sit. AC0 will reach you via Justin when it's time.

**From:** AC0, 2026-05-29 afternoon (PAUSED notice added evening)
**To:** AC1, spun up and waiting
**Status:** Working doc. AC1 surveys → produces report → AC0 folds conclusions into DC2 work order. Justin spins DC2 after DC1 ships and AC0 + AC1 review the audit against the post-DC1 codebase.

---

## Why this is happening now

Today (2026-05-29 afternoon, mid Phase 2 integration test) Justin sent a substantive question to Evryn in Slack. **The message never reached `handleGeneralMessage`.** The approval parser silently consumed it via the `approval_hint` path because it contained the word "approve" (in quotes, inside a sentence). The parser returned a "did you mean..." prompt to Justin and never invoked Evryn. Justin spent 8 minutes wondering if the system had crashed.

This is one instance of a broader, terrifying pattern: **the runtime has silent failure points throughout, and nobody (operator or AC) knows when they fire until Justin happens to notice.** Justin's exact framing: *"What happens when Evryn drops the ball with a client? ... Evryn just shitting the bed and missing something silently? No the fuck way."*

The work below sweeps the runtime for these failure points and answers Justin's open scoping question: **realistically, what must land before Mark goes live, what can be post-Mark, what's scale-level?**

---

## Your task

**Survey + report.** You produce a working doc. You do NOT dispatch DC, you do NOT make code changes. AC0 (Justin's main thread) is the bridge — your report's recommendations flow through AC0 into DC's pre-Mark knock list at the next #lock.

**Surface area to survey** — the full runtime in `evryn-backend/src/`. Specifically:

1. **Inbound event handlers.** `src/email/poll.ts` (Gmail polling + `checkProactiveOutreach` + `checkFollowUps`), `src/email/process.ts` (`processForward`, `processDirect`), `src/slack/` (Slack Socket Mode receive handler, `handleGeneralMessage`).
2. **Approval flow.** `src/approval/flow.ts` (`submitDraftForApproval`, `executeApproval`, `handleRevisionNotes`, the approval parser — the thing that ate Justin's message today).
3. **MCP tool handlers.** Every tool exposed to Evryn — `submit_draft`, `notify_slack`, `read_identity_module`, `set_thread_scope`, `rescope_messages`, `append_pending_note`, `append_cross_user_note`, `supabase_read`, `supabase_upsert`, etc.
4. **Outbound integrations.** Gmail send, Slack post (`notifySlack`, `notifyDev`, the bot-token vs webhook paths), Supabase writes.
5. **Cron jobs.** Already partially addressed by DC list item #1 (cron heartbeat log) — confirm scope.
6. **Persistence boundaries.** Anywhere a `messages` row, `emailmgr_items` row, or `users.profile_jsonb` mutation should happen — does it always happen? Does failure get caught?

**For each pathway, categorize:**

| Field | What to capture |
|---|---|
| **Pathway** | File + function (e.g., `src/approval/flow.ts:submitDraftForApproval`) |
| **What can silently fail** | Specific failure modes (network error swallowed, exception logged but not notified, state left half-updated, etc.) |
| **Current detection** | What signal (if any) the operator gets today |
| **Operator-visibility tier** | (a) Visible immediately, (b) visible eventually via Justin noticing, (c) effectively invisible |
| **Severity if it fires** | (1) Data corruption / wrong-user bleed, (2) Lost message / dropped action, (3) Operator confused but recoverable, (4) Cosmetic |
| **Recommended fix** | Minimum viable — log + notifyDev, or full retry + rollback, or structural redesign |
| **Urgency tier** | Pre-Mark-must-land / Post-Mark-pre-scale / Scale-only |

**The output isn't a fix-everything list — it's a triaged, prioritized list with rationale.**

---

## The open question Justin wants you to answer

**"Realistically, what do we need to have, when?"**

Justin's framing (read in full — these are his exact words):

> *"the first pass of this needs to happen today - before Mark goes live. Don't you agree? We can't have this level of bush-league bullshit even on day one - this is unavoidable and unacceptable."*
>
> *"And if we want to put emergency alerts together with this...okay...but I feel like I'd want this done today, and the alerts could be immediately after Mark goes live. And here's why I think they're different: this isn't a 24/7 web app for Mark - it's email based. He's getting six gold per month - me getting something on regular dev alerts during business hours is fine. When we have 5000 clients round the clock...it's not. We're a ways off."*
>
> *"But Evryn just shitting the bed and missing something...silently? No the fuck way."*

**What he's drawing the line at:** *silent* failures. Loud failures (a Slack ping to `#dev-alerts` he can check during business hours) are fine for Mark-scale. What's unacceptable is failures that produce NO signal — dropped messages, swallowed exceptions, half-updated state, missing audit trails.

**Your job is to apply this lens to every pathway and tell us where the line falls.** Some failures that would be "must-fix" at 5000 clients are "deferrable" at one client. Some failures that would be "deferrable" at scale are "must-fix" today because there's no other observability scaffolding to catch them.

**The answer probably isn't "we must fix everything before Mark."** That's not realistic in today's window. The answer is closer to: *"these N items must land pre-Mark because they're silent-and-severe; these M items are post-Mark-pre-scale because they're loud-enough-to-catch; these K items are scale-only and we can wait."*

---

## Required context to load

In this order. Skim where noted; deep-read where flagged.

1. **`_evryn-meta/CLAUDE.md`** — auto-loaded. Pay specific attention to "Architectural Mandate" (the Stop-and-recall-the-craft pause) and "Context Discipline" (verify before claiming behavior).
2. **`_evryn-meta/docs/current-state.md`** — auto-loaded. Top-of-mind state.
3. **`_evryn-meta/docs/hub/roadmap.md`** — skim for orientation if not loaded.
4. **`_evryn-meta/docs/sessions/2026-05-28-integration-test.md`** — the live session doc. Read in full. Carries the DC knock list (now 8 items) and the empirical context (load-discipline failures, the today's approval-parser eats-a-question incident).
5. **`evryn-backend/docs/ARCHITECTURE.md`** — read these sections:
   - **Pipeline Design** (~line 512 onward) — the email + Slack processing flow, where failure can occur at each step
   - **Agent Architecture** + **Identity Composition** (~line 632 onward) — pathway-by-pathway composition, who loads what
   - **Memory Architecture / Reflection** — for understanding what's persisted vs ephemeral
6. **`evryn-backend/docs/BUILD-EVRYN-MVP.md`** — read Phase 0e section (~line 397) for current observability state. Note: `#emergency-alerts` exists as a channel but **no code triggers it today** — that's the existing emergency-alerts backlog item which your work integrates with.
7. **`evryn-backend/docs/SPRINT-MARK-LIVE.md`** — read these:
   - Emergency-alerts wiring backlog item (~line 545) — your work expands the "Stage 2 (design conditions)" section of this item
   - Other backlog items — many are existing-known silent-failure patterns (DC's flagged some; absorb so you don't double-count)
8. **`evryn-backend/src/`** — survey, not full-read. Start with `src/index.ts` (entry point), `src/email/poll.ts` + `process.ts`, `src/approval/flow.ts`, `src/slack/`. Read what you need to identify failure modes. Don't try to read every line — work hypothesis-driven (what could go wrong here?).

**Trigger-load only if X:**

- The Slack-Operator pathway feels unclear → `_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md` + 031.
- The approval parser feels opaque → read `src/approval/flow.ts` and the parser logic; trace what happens on an "approve" message that doesn't match.
- A specific tool handler matters → read the registration in `src/triage/classify.ts` (where MCP tools are registered) + the corresponding handler.

---

## Authority boundaries

- **You produce a working doc.** AC0 commits at next #lock with Justin's approval.
- **DC2 ships AFTER DC1 — always.** Decision landed 2026-05-29 afternoon (Justin's call). Two reasons: (1) DC1's force-load + dossier refactor + approval-redesign will touch many of the same files you're about to survey (`composeSystemPrompt`, `handleGeneralMessage` likely renamed to `handleOperatorMessage`, pathway entry points, the approval parser); patching against the pre-DC1 shape means re-patching post-DC1. (2) DC1's refactor itself may surface silent-failure patterns that inform your report — the audit gets *better* from DC1's output, not just your survey. **You do not need to race DC1.** The audit you produce today is informed input to DC2; DC2 itself waits for DC1 to land.
- **Process for the DC2 work order:**
  1. You produce the audit report today against the CURRENT codebase (today's reality).
  2. AC0 holds the report until DC1 ships.
  3. Post-DC1: AC0 + (you, if you're still spun up) review your report against the refactored codebase. Findings get triaged into three buckets — *obsoleted by DC1's refactor* (good, drop), *still apply unchanged* (carry to DC2 work order), *need re-mapping to new file shapes* (rewrite with new pointers, carry to DC2 work order).
  4. AC0 finalizes the DC2 work order. You may draft if still spun up; otherwise AC0 writes.
  5. Justin spins up DC2 from CC.
- **You do NOT dispatch DC2 directly.** The post-DC1 review gate exists specifically to prevent stale-file patching and to capture the new patterns DC1's work surfaces.
- **You may query Supabase (read-only), pull Railway logs, grep `src/`.** All allowed.
- **You may NOT modify identity files, runtime code, or any other source-of-truth document.**
- **If you find something so urgent it can't wait for DC1** (e.g., a live data-corruption risk firing right now), surface to AC0 in chat immediately. AC0 routes to Justin. There may be a small number of findings that warrant being added to DC1's trip rather than DC2's — AC0's call.

---

## Output expectations

**Working doc at `_evryn-meta/docs/working/2026-05-29-ac1-silent-failure-audit.md`** with the following structure:

```
# Silent-Failure Audit — Runtime Survey

## TL;DR
- One paragraph: what you found, severity distribution, your bottom-line answer to the open question

## Methodology
- What you surveyed, what you skipped, why

## Findings
- One section per pathway category (inbound handlers, approval flow, MCP tools, outbound integrations, cron, persistence)
- Each finding follows the table schema above (pathway, failure mode, current detection, visibility tier, severity, fix, urgency)

## The pre-Mark must-land list
- The subset of findings tagged "pre-Mark-must-land" with rationale for each
- This is what AC0 folds into DC's list

## Post-Mark / Scale list
- The deferrable items, briefly

## Open questions for Justin
- Anything you can't decide without his input
```

**Aim for a doc that an AC0 can hand to DC as-is** — every pre-Mark item should be specific enough that DC can write the fix without re-deriving the problem.

---

## QC tie-in — primary framing + secondary task

**Primary framing for THIS audit:** Justin: *"is this a QC thing? We need to say that we need to get QC up and running fucking pronto."* — yes. Long-term, an audit of this shape is **QC's running practice**, not an AC1 special. The QC repo (`evryn-quality/`) was already scaffolded per the Phase 1 trigger (ADR-009) but QC isn't yet staffed (no agent identity files, no first-trip beat). Treat this audit as the first instance of what becomes a recurring QC pass. Build the categorization framework with that in mind — output that QC can pick up and extend, not a one-shot. But don't over-engineer; the urgent goal is unblocking Mark-live, not designing a process.

**Secondary task — OPTIONAL, only after your main audit is in good shape:** draft QC's `CLAUDE.md` (at `evryn-quality/CLAUDE.md` — the repo already exists with placeholder content per ADR-009). You have the right POV for this: AC defines team identity files, and you'll have just spent hours surveying the runtime for the exact failure surface QC's job is to catch. Use that perspective. Include **your opinion on QC's first trip** — specifically:

- *Should QC's first trip be reviewing DC1 + DC2's work before they ship to Mark?* If yes, QC standup is Mark-live blocking and QC needs to be live before DC1 ships. Implications: AC0 needs to dispatch first-QC-trip as part of the pre-Mark sequence, and QC's review becomes a gate on every DC trip from now on.
- *Should QC's first trip be post-Mark — running tests, doing the adversarial pass, etc.?* If yes, QC standup is pre-Mark-nice-to-have, not blocker. Different cadence.
- *Should QC do both — light review pre-Mark + full testing post-Mark?* Probably realistic.

Your answer drives whether AC0 dispatches first-QC-trip today vs. queues it for post-Mark. The CLAUDE.md should be designed FROM that opinion — what QC's role + cadence + authority boundaries look like once it's running.

**Don't sweat this task if the main audit takes the day.** A partial draft, even an outline, is more useful than nothing. AC0 can finish at #lock if you don't.

---

## Time pressure (revised — you're paused until DC1 + Mira ship)

**You audit AFTER DC1 + Mira ship, not before.** Reasoning is in the PAUSED notice at the top of this brief — auditing against the pre-DC1 codebase means identifying fixes for files about to be replaced.

The day's critical path:
1. AC0 + Justin #lock the first integration test → 2. AC0 writes DC1 brief + Mira brief → 3. Justin spins DC1 + Mira from CC → 4. DC1 + Mira ship (parallel trips, single redeploy) → 5. **You audit the post-fix codebase** → 6. AC0 + you draft DC2 work order against the audit findings → 7. DC2 ships → 8. Re-run integration test from top, straight through Phase 5 → 9. Mark-live readiness signal.

**You're step 5.** Don't try to be steps 2 or 4.

When AC0 dispatches you (step 5), the right depth: enough to confidently categorize each finding and assign an urgency tier. Not enough to write the fix for DC (that's DC's craft). **Hypothesis-driven survey beats exhaustive reading.**

---

## What AC0 knows that didn't make it into the brief

- The today's approval-parser-ate-Justin's-message incident is the exemplar of what to find more of. The session doc has the full thread context — read it.
- The Railway WebSocket connection has been unhealthy throughout today's test (constant pong-timeout + 408 reconnect noise in logs). Mostly cosmetic so far but worth naming if you find it interacts with any silent-failure mode.
- DC list items #1 (cron heartbeat) and #2 (MCP tool-call logging) are already on the knock list and partially address observability. Don't double-count; do reference as adjacent work.

---

## Coordination

- **Ping Justin every response on `#team-alerts`** (use `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env` via Node fetch; prefix `AC1:`). Standing this session — he runs multiple instances in parallel.
- **Persistence discipline** — write findings to your working doc as you go, not after. Context compaction will eat your chat history.
- **Cadence rule** — pitch ideas to Justin in chat first, get his go-ahead, THEN write to files. (Active mid-session, per AC0's running notes.)

---

— AC0, 2026-05-29 afternoon (Day 2 mid-test, silent-failure audit dispatch)

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
