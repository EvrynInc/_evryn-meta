# AC0 Packout — 2026-05-29 (Day 2 of integration test, mid-Phase 2→3)

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**From:** AC0 (the instance that ran integration test Day 1 + Day 2, surfaced load-discipline empirical material, absorbed Justin's caching insight, and locked at ~70% to compaction so Soren + Mira could review the thread in this same session)
**To:** Fresh AC0 picking up Day 3
**Date:** 2026-05-29 afternoon

> **Backup reference (don't load by default):** the previous packout is at `docs/sessions/historical/2026-05-27-ac0-packout-mid-integration-test.md`. That packout's framing has been fully absorbed into this one + the live session doc.

---

## TL;DR

You're picking up **mid-test**, mid-Phase 2 → Phase 3 transition. Justin will play Mark next; you're observer + diagnostic helper. The big DC list grew through Day 1 + Day 2 and has been re-prioritized; the headline is **force-load all identity modules + `handleGeneralMessage` rename + dossier refactor**, which subsumes the prior Slack-Operator cross-thread scope-loading item.

**The live session doc is the source of truth for everything you need:** [docs/sessions/2026-05-28-integration-test.md](2026-05-28-integration-test.md). Read it FIRST after your auto-loads — it carries the current DC list (7 items), Mira pile (4 items), v0.3 deferred questions (3 items including Justin's caching insight), the rolling status, and the pointers to the two Slack threads that carry the empirical material.

---

## In-flight state (what's *not* yet in the session doc or current-state)

- **The second-volley response to Mark has NOT been submitted** — Justin's iterating with Evryn in Slack thread `1780009886.535399` (NULL-scoped, the standing-instruction thread). Better re-draft sits in chat. Justin's call next session: send the Slack-iterated draft via `submit_draft`, or have Evryn re-do with everything loaded.
- **Soren came in post-AC0-lock and produced:** (a) **working doc** at `evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.29 09-force-load-and-caching-architecture-soren.md` — full architectural thinking on Justin's caching insight, prefix-size budget, audience carve-out structure, sidebar question list, file-load list, cross-turn introspection sharpening; (b) **memory entry** at the end of his MEMORY.md; (c) **EVR-109** in Linear (Needs Authorization; R: soren, A: justin, C: mira) — sidebar conversation post-Mark to decide ADR-012 amendment for force-load + caching as v0.3+ standing identity architecture. **Read the working doc before the v0.3 architecture pass opens.**
- **Mira came in after Soren and produced:** (a) **memory entry** refined with Justin's load-discipline framing (see below); (b) **current-state appendage** (2026-05-29T15:30) in `evryn-team-workspace/shared/current-state/current-state.md`; (c) **three new Structural Principles in the identity-writing-bible** at `evryn-backend/docs/identity-writing-bible.md` — Score and Direction Across Boundaries, Presence vs Performance Register Check, Clear-Over-Pretty Applied to Evryn's Output. **All three are marked "developmental — pending force-load verification."** Don't treat them as settled craft until we re-run the integration test post-force-load.
- **The load-discipline reframe Justin landed at end-of-Mira (LOAD-BEARING for how to read the Mira pile and the empirical failure modes).** *Most of the failure modes that surfaced this session — introspection gap, performing forward motion, slick phrasing, "Should also cover" reading-as-suggestion, hyper-brevity-as-minimalism — happened under degraded load conditions. When Evryn loaded the right modules, the problems went away.* DC list item 4 (force-load) addresses the load-discipline failure mode structurally. **Don't go mucking about in the identity files trying to fix problems that weren't in the docs — they were from not-loading-the-docs.** Identity-file fixes for those failure modes are speculative until we re-run the integration test post-force-load. The exception is Mira-pile #4 (tighten gatekeeper-onboarding) where the tightening is wanted regardless of load discipline — but even there, the *scripting question* waits on empirical post-force-load data. Mira-pile #1 + #2 are real identity-file work regardless. Mira-pile #3 is mostly subsumed by force-load.
- **Pestering overnight from 17:10 PT 5/28 through 07:43 PT 5/29.** Evryn pinged Justin every 15 min, saved by Slack DND. Justin marked them complete to stop the cascade. Added as DC item 7 (quiet hours + reminder cadence) — read the full item in session doc.

---

## Startup load

All required, in order. If particular lines are listed, *only* read those lines. Some of these docs are *very* long, and will completely blow up your context if you read top-to-bottom.

1. `_evryn-meta/CLAUDE.md` — auto. **Gained the "Stop and recall the craft" pause discipline in Architectural Mandate 2026-05-28**; read fully.
2. `_evryn-meta/docs/current-state.md` — auto. Reflects #lock end-of-day 5/29.
3. `_evryn-meta/CHANGELOG.md` — read today's full entry (2026-05-29 AC0); carries the day's narrative arc.
4. `_evryn-meta/docs/hub/roadmap.md` — orients in the company. Has not changed since prior packout.
5. **This packout** — you're reading it.
6. **`_evryn-meta/docs/sessions/2026-05-28-integration-test.md`** — *the live session doc.* All running lists live here.
7. `_evryn-meta/docs/hub/technical-vision.md` (391 lines).
8. `evryn-backend/docs/ARCHITECTURE.md` — ranges per prior packout (114-200, 632-780, 999-1006, 502-575, 918-925) — *unchanged this session*. Same ranges apply.
9. `evryn-backend/docs/BUILD-EVRYN-MVP.md` — 68-99, 114-165, 379-417.
10. `evryn-backend/docs/SPRINT-MARK-LIVE.md` — 66-110, 466-487, 530-559 (last range extended for the cron-heartbeat backlog entry shipped 2026-05-28).
11. `evryn-backend/tests/integration-test-v02.md` — the protocol.
12. `evryn-backend/tests/fixtures/test-gatekeeper-profile.md` — Mark character + answer key.
13. `evryn-backend/tests/fixtures/integration-test-script.md` — Justin's scripted lines.

**Trigger-load** (only if X):

- Anything off-pattern → load `_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md` (full + Amendment 2026-05-22) + `031-late-scope-recovery.md`.
- Identity-file-related craft question → load `evryn-backend/identity/core.md` + the relevant activity / situation file.
- Tool/SDK behavior surprises → `_evryn-meta/AGENT_PATTERNS.md` §"SDK Integration & Tool Wiring" lines 406-448.
- **Specifically for picking up Day 3:** read **both** Slack threads end-to-end before drafting any guidance for Justin. Thread `1779997809.975439` (Mark-scoped, Day 1 verify-and-lock + research + first email) and thread `1780009886.535399` (NULL-scoped, standing-instruction + better re-draft + most of Day 2's empirical material). Query in session doc.

---

## Two key Slack threads to read directly

The thread material carries texture that no summary captures. Per session doc:

```sql
SELECT created_at, sender_id, source, message_body
FROM messages
WHERE thread_id IN ('1779997809.975439', '1780009886.535399')
   OR (created_at::date >= '2026-05-28' AND source = 'email')
ORDER BY created_at;
```

Pull all messages from both, read in order. The activity-module-load failure modes, the introspection gap, the "performing forward motion" self-diagnosis, the hallucination-and-correction discipline, the load-discipline empirical material — all of it lives in those threads.

---

## What to watch when Day 3 picks up

- **First decision Justin will face:** ship the existing Slack-iterated draft as the next outbound to Mark, or have Evryn re-do with everything explicitly loaded? Either way, finishing Phase 2 unblocks Phase 3.
- **Phase 3 multi-turn email pipeline** — never exercised before this test. Watch `processDirect` on Mark's reply, `getRecentMessages` loading prior email volleys, `append_pending_note` accumulating real-conversation observations, the cron NOT firing inappropriately (it's hour-gated to 7am PT; should be cleanly idle during the test).
- **Per the hybrid plan:** run 1-2 Phase 3 volleys, then STOP and ship DC fixes. Don't try to push to fixture re-run; the data is already coaching-corrupted for that comparison anyway.

---

## DC list, Mira pile, v0.3 questions

**All in the session doc.** Do not re-print here — that would invite drift between the two surfaces. The session doc is the source of truth; this packout is the pointer.

---

## Operator-guide updates pending (no changes this session — flag for when fixes ship)

No operator-facing behavior changed in code this session, so `evryn-backend/docs/operator-guide.md` was not updated. But several DC list items will require operator-guide updates *when they ship*:

- **DC item 5 (markdown → HTML email rendering)** — cosmetic-only; recipients now see actual formatting. Minor note to operator guide if anywhere references "send as plain text only."
- **DC item 6 (`submit_draft` notification scope-logging)** — internal fix; no operator-visible change. Skip.
- **DC item 7 (quiet hours + reminder cadence)** — *direct operator-impact.* When this ships: add a row to the operator guide's Automated Alerts table naming the quiet-hours window (last ping 5pm PT, silent 6pm–8am PT, first ping 8am PT) and the new hourly reminder cadence. Crucial because once `#emergency-alerts` ships, operator Slack DND posture changes (he sets it to allow emergency channel through DND), so the operator needs to know which non-emergency channels still respect quiet hours.
- **DC item 4 (force-load + dossier refactor)** — internal architecture; no operator-visible change. Skip.

Day 3 AC0: when DC dispatches and ships any of the above, update operator-guide in the same lock as the DC commit. Don't let it drift.

---

## Humility note

This AC0 has NOT read the trust-and-safety spoke, user-experience spoke, vision-and-ethos spoke, long-term-vision spoke, business-model spoke, GTM spoke, or bizops-and-tooling spoke this session. Most of `evryn-backend/src/` is unread except `index.ts`, `poll.ts` sections, `classify.ts` line 89 + a few greps. Most of `evryn-backend/identity/` is unread except `operator.md` + greps in core.md, trust-arc-scripts.md.

**Specific gotchas surfaced this session worth carrying forward:**

- **Justin's commit-discipline rule fires reliably.** Workflow instructions ("write it all and I'll diff in SC") are not commit authorizations. Each commit needs an explicit "commit," "push," "go ahead and commit," etc. in the immediately preceding turn. AC0 violated this once early in this session (the Railway-additions batch) and Justin called it out; the rule held cleanly the rest of the session. Re-violation will erode trust.

- **Cadence rule installed mid-session 2026-05-29:** Pitch ideas to Justin in chat, get his go-ahead (or notes), THEN write to files. Saves the write-and-fix-and-write churn when he tweaks the idea. Doc edits happen in the same turn as the chat pitch's approval; commit waits for explicit commit go-ahead.

- **Persistence discipline installed mid-session 2026-05-29 — with three refinements landed 2026-05-29 afternoon:**
  - (1) **DC/Mira/v0.3 lists update in the session doc only after Justin says "good to add."** AC will often pitch a change in chat, then talk through it with Justin until the wording shifts. Don't bog the process by writing and rewriting and rewriting — wait for the explicit "good to add."
  - (2) **The in-flight section (rolling status snapshot) updates much less frequently.** It's not a chat log; don't re-write it every turn.
  - (3) **Respond + ping FIRST, then go write.** Don't make Justin sit waiting while AC composes a file edit. If AC has a response, the sequence is: chat reply → Slack ping → THEN write whatever has been authorized, while Justin is reading the chat. (Mechanically: chat text + tool calls go in the same turn since text renders first, but the intent is that file edits never *delay* the response.)

---

## Coordination notes

- **Ping Justin every response on `#team-alerts`.** Standing discipline this session — Justin runs multiple instances in parallel and won't switch back to AC0 without a notification.
- **Division of labor during live tests (installed 2026-05-29 afternoon):** Justin has eyes on Slack + email; AC0 has eyes on *everything else* (DB state, Railway logs, tool calls, lifecycle, scope, audit trails). Justin can do in tens of minutes what AC0 can do in milliseconds — so if visibility into backend behavior matters, AC0 owns the look. The pattern is: Justin posts/approves/replies → AC0 immediately checks backend → AC0 reports back with the all-clear or the flags. This is how the test moves fast without blowing context.
- **Justin's CLAUDE.md cadence rules** (commit discipline, slack pings, full lists with letters/numerals) all hold. The new ones from this session (cadence rule + persistence discipline) live above in Humility note.
- **DC and Mira are stood down post-test.** Don't dispatch until Justin says — the dispatch will be batched after the Phase 3 volleys + the hybrid-path decision lands.

---

— AC0, 2026-05-29 afternoon (Day 2 mid-test packout)

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
