# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-14T20:32-07:00*
*Last #sweep: 2026-03-09*
*Last #align: 2026-03-09*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **Pre-Work #6 (identity writing IN PROGRESS):** core.md v7 complete (Justin reviewed). operator.md and gatekeeper.md reviewed and approved. triage.md reviewed — gaps identified (schema questions + doc clarity, see session doc). **Next:** resolve triage schema questions, rewrite triage.md, write conversation.md (DC Day 3 blocker) and gatekeeper-onboarding.md (Day 4 blocker). Session doc: `_evryn-meta/docs/sessions/2026-03-09-identity-writing-s3.md`.
- **Sprint shifted ~2 days** — snow/power outage March 12-13. Day 1 extended through Sun March 15. Day 2 now Mon March 16. Go-live target ~March 19-20. Sprint doc dates not yet updated.
- **Status lifecycle documented** — `emailmgr_items` status flow (new→processing→pending_approval→done, escalated, error) with lifecycle table in BUILD doc. Startup recovery + stale item check added to Day 4 hardening.
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

## Active Projects

- **_evryn-meta** — S3b session doc updated for machine transition (Justin switching machines tomorrow).
- **evryn-backend** — DC Day 1 scaffolding complete. All DC Day 2 credentials ready. Identity writing in progress. Email address roles clarified (justin@ for drafts, systemtest@ for test recipient). Go-live checklist updated with env flip items.
- **evryn-team-agents** — PAUSED.
- **evryn-dev-workspace** — DC's home repo.
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Slack: "Evryn Notifications" app configured for Socket Mode (tokens in evryn-backend/.env). Legacy webhook retained until Socket Mode code is live.
- Railway: `evryn-backend` project created, CLI installed and linked. DC deploys with `railway up`.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project.
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
