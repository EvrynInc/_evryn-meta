# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-28T19:42:32-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,700 cash + $15K available ($5K founder + $10K angel contingent on traction). Revenue target: late April / early May.

## What's Next

- **5-day sprint: Mark live.** Sprint plan at `evryn-backend/docs/SPRINT-MARK-LIVE.md`. Target: ready for Mark by Fri March 7.
- **Pre-Sprint blocker (Sat March 1):** Pre-Work #6 SDK question — does `systemPrompt` supplement or replace CLAUDE.md? Must resolve before Monday. See `docs/sessions/2026-02-24-pre-work-6-session-1.md`.
- **Build phases finalized:** v0.2 "Gatekeeper's Inbox" (Mark live ~March 10) → v0.3 "The Broker" (web app + matching + payments, first revenue late April) → v0.4 "Scale" (second gatekeeper, publisher, agents, June/July). SIFF (mid-May) is a target for presence.
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

## Active Projects

- **_evryn-meta** — Business model spoke fully revised (2026-02-28), absorbing session revision notes. Fenwick questionnaire: third addendum added (service agreement disclaimer). BizOps spoke cleanup pending. Hub updated with phases + financial reality. AC designing v0.3 architecture (graph schema, web app) in background during sprint week.
- **evryn-backend** — **Sprint week March 3–7.** Sprint plan: `docs/SPRINT-MARK-LIVE.md`. Pre-Work #6 identity is sprint Monday.
- **evryn-team-agents** — PAUSED. Reusable code (email polling, Gmail client, Supabase client) being adapted for evryn-backend.
- **evryn-dev-workspace** — DC's home repo.
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project.
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
