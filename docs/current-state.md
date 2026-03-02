# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-02T12:26-08:00*
*Last #sweep: 2026-03-02*
*Last #align: 2026-03-02*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **5-day sprint: Mark live.** Sprint week March 2–6. Sprint plan at `evryn-backend/docs/SPRINT-MARK-LIVE.md`. Target: ready for Mark by Fri March 6.
- **Pre-Work #6 (sprint Monday):** Evryn identity architecture. All loose ends from Sessions 1-3 tied off. Vertex AI breadcrumbed into ARCHITECTURE.md. Python/TS decision deferred to Phase 1 start (TypeScript default, re-check SDK maturity then). Beautiful Language file committed. Visual identity breadcrumbed to GTM spoke. Ready for identity content writing. See `docs/sessions/2026-02-24-pre-work-6-session-1.md`.
- **Build phases finalized:** v0.2 "Gatekeeper's Inbox" (Mark live ~March 10) → v0.3 "The Broker" (web app + matching + payments, first revenue late April) → v0.4 "Scale" (second gatekeeper, publisher, agents, June/July). SIFF (mid-May) is a target for presence.
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

## Active Projects

- **_evryn-meta** — #align completed (2026-03-02): behavioral filtering language fixed (access vs. matching distinction), OC/QC entities added to CLAUDE.md with sprint timing, #sweep/#align weekly cadence enforced, trust-and-safety spoke updated, session doc expanded with canary principle and crisis protocols. Pre-Work #6 loose ends tied off: GTM spoke visual identity breadcrumb, session doc Python/TS status clarified.
- **evryn-backend** — **Sprint week March 2–6.** Sprint plan: `docs/SPRINT-MARK-LIVE.md`. #align completed: gatekeeper-as-channel, no-open-messaging, witness-not-mirror breadcrumbs added to ARCHITECTURE.md. v0.3 design breadcrumbs planted (15 items from 4 spokes). QC/OC creation steps added to sprint plan. Vertex AI breadcrumb added to ARCHITECTURE.md. Beautiful Language v0.9 committed to historical dir.
- **evryn-team-agents** — PAUSED. #align flag added to ARCHITECTURE.md (do #align before resuming Lucas build). Reusable code being adapted for evryn-backend.
- **evryn-dev-workspace** — DC's home repo. OC/QC entities added to CLAUDE.md.
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project.
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
