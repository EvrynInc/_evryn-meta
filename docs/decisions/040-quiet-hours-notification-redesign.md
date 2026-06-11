# ADR-040: Quiet-Hours Notification Redesign — Immediate-Post + DND, Retire the Replay Queue

**Date:** 2026-06-11
**Status:** Accepted — built + QC-verified GO (evryn-backend `dc/quiet-hours-redesign`, commit `91cc963`). Code deploy + the `notify_queue` table-drop migration are **pending** (Justin-gated; no-rush per 2026-06-11 — daytime testing is unaffected by the old behavior, see Context). The deployed SHA gets stamped here on deploy.
**Related:** BUILD item 9f (the spec); **supersedes** Wave 3 Item 6 (quiet-hours ping suppression, 2026-05-29) and the 2026-06-01 "ADDITIONAL FIX" (enqueue-instead-of-silent-drop); ADR-037 (dev-first migrations — the table-drop method); informs M1 (the `#emergency-alerts` silent-death detector — simplified by this).

## Context

The prior model (Wave 3 Item 6 + the 2026-06-01 fix): during quiet hours (default 18:00–08:00 PT), `notifySlack` **suppressed** pings — enqueuing them to a `notify_queue` table and replaying them FIFO at window-close. It was built to stop overnight pestering (a stuck draft re-pinging every 15 min through the night) without *silently dropping* pings — Slack DND was, at the time, deemed unreliable as the night-silence floor (partly with an eye toward the future `#emergency-alerts` DND-break-through need).

The cost of that model:
- **It blocked the operator's evening work.** On 2026-06-10 Justin hit quiet hours mid-Phase-6 test; his approval pings queued until ~8am, so he could not work with Evryn in the evening to finish the test.
- **It was real machinery** — a queue table, enqueue/drain/dedup logic, a poll-loop drain, per-row drain-failure meta-alerts — and itself a recurring source of edge-case bugs and hardening-backlog items.
- **It complicated M1** — the emergency path carried a placeholder `bypassQuietHours` runtime escape hatch.

The reframe that drove this ADR: the thing actually piling up overnight was the **stale re-checker's hourly reminders**, not the original pings. And **Slack DND is the right layer for operator night-silence** — it is operator-owned, per-channel, and (contrary to the old assumption) does **not drop** messages: a ping posted under DND still lands in the channel, just silenced; the operator sees it when DND lifts. Runtime suppression was solving a problem DND already owns. Critically for the no-rush call: the old code only suppresses *during* quiet hours — in daytime it already posts immediately, so daytime testing is identical under old and new code.

## Decision

- **Pings post immediately, always.** `notifySlack` no longer gates on quiet hours — every real-time ping (new-draft-ready, escalation, error, the `notify_slack` MCP tool, the startup ping) posts the moment it fires, any hour. The operator handles night-silence with Slack DND.
- **Only the stale re-checker is time-gated.** `checkStaleItems` (`src/email/poll.ts`) — the hourly "still-pending" reminder, the actual overnight pile-up source — runs only during waking hours (`!isQuietHour`). The gate sits *before* the `lastStaleCheck` interval bump, so the timer isn't consumed overnight and the **first poll cycle after the window opens naturally sweeps anything still pending** (a morning sweep falls out for free).
- **`isQuietHour` is kept but repurposed** — its sole remaining job is to gate the stale re-checker. Window math + the `QUIET_START_HOUR_PT` / `QUIET_END_HOUR_PT` env vars are unchanged.
- **The `notify_queue` runtime machinery is retired:** `notifySlack`'s enqueue branch, `drainNotifyQueue` + the poll-loop drain, the `bypassQuietHours` and `dedupeKey` options, the per-row drain-failure meta-alert state, and `src/db/notify-queue.ts` (+ `tests/test-notify-queue.ts`) are all deleted. The `audit`-payload type relocates to a local `SlackAudit` in `slack.ts`.
- **The `notify_queue` table is dropped** (Justin, 2026-06-11): recreation is trivial (the CREATE migration already exists — minutes to re-run) and nothing of value is lost (a standalone leaf table, no foreign keys in or out; its only rows were transient quiet-hours deferrals, since handled). **Sequencing: deploy-then-drop.** The drop is a dev-first migration (pg_dump pre/post, ADR-037 method) applied **after** the code deploy — the currently-live *old* code `SELECT`s the table on every waking-hours poll cycle, so dropping it before the code deploy would spam caught-but-noisy drain errors + spurious `#dev-alerts`.
- **A predictable morning sweep** (Justin, 2026-06-11) is added as a small fast-follow, **bundled with the next deploy**: a once-per-morning "N drafts awaiting approval" digest at window-open (silent when zero). The bare waking-hours-gated stale-checker only reminds on 4h+-overdue items; the sweep gives the operator a reliable clean morning queue regardless of age — the "clean ping at a predictable time" the operator wanted.

## Consequences

- The operator can work with Evryn at any hour; evening testing is unblocked. Night-silence is a DND toggle the operator owns, not a runtime behavior.
- **M1 is simpler.** The emergency `#emergency-alerts` silent-death path needs only a DND-override *notification layer* (a VIP'd emergency bot/webhook), not a runtime quiet-hours bypass. `bypassQuietHours` is gone and unmissed.
- **Net deletion** (−565/+107). Removing the machinery also makes the "drain-failure cooldown never clears" hardening item (BUILD resilience backlog #5) **moot**.
- Dropping `notify_queue` clears two v0.3 security obligations tied to it: the explicit-RLS-policy item (BUILD v0.3 Security Hardening §3) and one table from the blanket-grant retro-fix (§4, the systemic issue surfaced by ADR-038).
- **Trade-off accepted:** the queue's incidental retry-on-next-drain (for quiet-hours-deferred pings only) is gone. This was never a delivery *guarantee* — daytime pings were already best-effort single-post — so immediate-post is strictly *more* delivery, not less, and symmetric with the already-accepted daytime behavior.
- **Doc absorptions** (at #lock): ARCHITECTURE.md + schema-reference.md (state-description docs) drop the retired-machinery descriptions; BUILD + SPRINT (work-records) mark the items shipped/resolved in place; operator-guide.md + current-state.md update to current behavior. One stale dev-facing comment in the `notify_slack` tool (`src/triage/classify.ts`) is cleaned up in the morning-sweep follow-up trip.
- **Review:** AC architected; DC built in an isolated worktree (branch `dc/quiet-hours-redesign`); QC independently verified **GO** (no silent-ping-loss, sound morning-sweep gate, no re-ping storm, `bypassQuietHours` strands nothing, table preserved, typecheck + quiet-hours test green); AC reviewed the diff. Code deploy + table-drop are Justin-gated.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
