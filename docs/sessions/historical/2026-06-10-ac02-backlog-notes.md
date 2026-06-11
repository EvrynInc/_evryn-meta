# AC02 Backlog Notes — 2026-06-10 (from AC0)

> **Working note.** Two non-blocking observations AC0 surfaced from live Railway logs during the Phase 6 live-fire (2026-06-10 morning). Both are for **AC02** to triage into the proper place in the v0.2→v0.3 resilience/hardening backlog (`evryn-backend/docs/BUILD-EVRYN-MVP.md`, "v0.2 → v0.3 Resilience / Hardening / Polish Backlog"). **Neither blocks Mark-live.** Disposable — fold into the backlog and delete (or archive at #sweep).

---

## 1. Proactive-cron heartbeat logs every poll cycle through the target hour (log-noise + a singleton question)

**Where:** `evryn-backend/src/email/poll.ts` — `checkProactiveOutreach()`, the `[cron:proactive] woke at ${ptHour}PT — ${activeUsers.length} active users to consider` heartbeat (~line 682).

**What I saw (evidence):** During the 8am PT hour on 2026-06-10, that heartbeat printed on **every poll cycle for the full hour** — a few hundred near-identical lines (`woke at 8PT — 2 active users to consider`), ~10–20s apart, 15:51→15:59 UTC. The N7 comment above it says "one heartbeat per target-hour evaluation," but the implementation logs once per *poll cycle* whenever `getPacificHour(now) === PROACTIVE_CHECK_HOUR_PT` — i.e. every ~`POLL_INTERVAL_MS` for the whole hour (currently `POLL_INTERVAL_MS=10000`, so ~360 lines/hour).

**Why it's functionally harmless right now:** the "2 active users" are the **Evryn system actor + the Operator** (the only two `status='active'` rows; Mark is `status='lead'`). The per-user loop skips `role IN (system, admin)`, so zero actual outreach fires. And the per-user 23h gate (`shouldRunProactiveCheck`) means even a real active user only gets one actual check regardless of heartbeat count. Pure log noise, not duplicated work.

**Two things worth doing:**
- **(a) Log hygiene (low-pri):** make the heartbeat fire once per target-hour-entry (as the comment claims) rather than once per poll cycle — e.g. gate it on a `lastProactiveHeartbeat` date/hour guard so it logs once when the hour is first entered. At 10s polling, ~360 redundant lines/hour buries real signal in Railway logs (30-day retention).
- **(b) Singleton sanity check (the part actually worth confirming):** in the raw logs each heartbeat appeared **doubled** — two near-identical emissions ~0.5s apart per cycle. That is *probably* a Railway log-viewer artifact, **but** it could mean two backend replicas are running. Two replicas = both poll Gmail + both fire crons = duplicate `emailmgr_items` / drafts / sends. Singleton is an operational requirement. **Confirm Railway is running exactly one replica** of the `evryn-backend` service. If it's two, that's a real bug (promote out of this backlog); if it's one, the doubling is just the viewer and only (a) applies.

---

## 2. Slack socket-mode pong-timeout warnings (misleading error-level; verify the sustained-disconnect alert fires)

**Where:** `evryn-backend/src/notify/slack.ts` — socket-mode connection handling (`attachConnectionMonitor`, `RECONNECT_GRACE_MS`).

**What I saw:** a burst of `[WARN] socket-mode:SlackWebSocket A pong wasn't received from the server before the timeout of 5000ms!` at 16:33 UTC on 2026-06-10. Bolt keepalive blips; the client auto-reconnects in <1s and no sustained-disconnect alert fired, so it self-healed. Not a fire.

**What AC0 already knows from the code (so you're not starting cold):**
- There **is** a sustained-disconnect alert: `attachConnectionMonitor` arms a `RECONNECT_GRACE_MS` (60s) timer on `disconnected` and `notifyDev`s `#dev-alerts` if the socket doesn't reconnect within the grace window. On `connected` it clears the timer and fires `catchUpOnReconnect` (replays anything missed during the gap). So a *brief* drop loses nothing; a *sustained* one alerts + replays.
- The transient pong-warns are emitted by Bolt at WARN but surface in Railway at **`level: "error"`** (the record is literally `[WARN] ...` inside an error-level entry) — misleading when scanning logs for real errors.

**For AC02 to decide (Justin's call — AC0 is not hunting this further):**
- Is there anything actionable here, or is it expected network jitter? (Likely the latter.)
- Worth (i) verifying the 60s sustained-disconnect `notifyDev` actually fires (a quick induced-disconnect test), and (ii) downgrading/suppressing the transient pong-warns so they don't read as `error` in logs.
- Place it in the backlog at whatever priority you judge after looking — or drop it if it's nothing.

— AC0, 2026-06-10
