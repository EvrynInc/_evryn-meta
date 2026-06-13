# Dashboard Side-AC Brief — 2026-06-12 — Product vitals / liveness tab

> **Truncation check:** the last line should read `FULL FILE LOADED`.

**From:** AC0 — running the v0.2 go-live bundle. This is a **side thrust** so it doesn't slow the main one.
**To:** AC2 — own this **end to end**: assess → build (spin your own DC) → review → report back. Use your judgment; don't bog down the main thrust.

**You are AC2.** Sign pings `AC2:`. Ping `#team-alerts` via Node `fetch` (`SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env`, ASCII-only).

## What we're after

Justin needs a **real-time, phone-checkable signal that Evryn is alive and working** — even when she's correctly *quiet*. A correct silent pass (she passed on 200 emails, surfaced nothing) looks *identical* to an outage from his side; his only current option is raw Railway logs (noisy, unaggregated, not phone-friendly). The goal: a clean **product "vitals" view** he can glance at from his phone and *immediately* see (a) the system is chugging, (b) what it's done today, (c) if something's wrong. This is the **M1 liveness feed** (the positive "she's alive" half of the silent-death story) and, later, the **daily-cluster heartbeat** surface.

## The approach (confirm it's easy before committing)

There's an existing dashboard at **evryn-dashboard.vercel.app**, source in **`_evryn-meta/dashboard/`**, which **live-deploys on push** and currently shows the agent tables. The cheap path: **add a "Product / Evryn" tab** reading the **product Supabase** (prod project — `emailmgr_items`, `llm_usage`, `messages`).

**FIRST: assess by reading `_evryn-meta/dashboard/`.** Confirm this is genuinely *reasonably easy* (it should be — a read-only tab over the product DB; DC builds these fast). **If it turns out hard, or the dashboard is a mess, STOP and report back** — Justin's fallback is a simple once-a-day digest, so don't sink a day into a hard build.

## Vitals to show

- **Liveness:** last successful poll time, process-up indicator, recent error count.
- **Today's activity:** items processed · passed · gold/edge surfaced · pending approval (the counts that prove she's working even when quiet).
- **Cost:** today / month spend from `llm_usage` (rough is fine; it's already captured).
- **Cluster heartbeat (placeholder):** leave a clean spot for "daily cluster ran at HH:MM — screened N, escalated M, drafted K." That lands when the daily-cluster work ships (a separate cost-levers thrust). Wire it if trivial; otherwise stub it.
- **Other useful vitals tabs if cheap** — Justin's open to tabs for "various things." Don't gold-plate; the liveness tab is the point.

## Hard constraints

- **PII — aggregates and status ONLY; no raw user data on the dashboard.** It's web-hosted. Counts, statuses, costs, timestamps — yes. Raw names / emails / message bodies — **NO**. If you show "recent items," show subject + status, not sender PII, and confirm the dashboard's access control before exposing anything.
- **Product-DB connection:** the dashboard needs creds for the product Supabase (likely a Vercel env var). That setup may be **Justin's** — flag it; never hardcode keys.
- **Push = deploy:** pushing `_evryn-meta` redeploys the dashboard on Vercel. Work on a branch; **coordinate the merge/push (= the deploy) with Justin** — don't auto-deploy.

## Mechanics

- Worktree/branch discipline if you edit code; spin your own DC, briefing him properly (his cascade + the six-part shape — `_evryn-meta/docs/protocols/ac-orchestration-protocol.md`).
- **Report back to Justin** when done (or sooner if it's harder than expected). Don't block the main go-live thrust.

— AC0, 2026-06-12

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
