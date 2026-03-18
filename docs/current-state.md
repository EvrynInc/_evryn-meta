# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-17T14:10:32-07:00*
*Last #sweep: 2026-03-09*
*Last #align: 2026-03-09*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **Day 3 (Tue March 17) — DC work complete, AC work in progress.** DC: approval flow end-to-end, conversation pathway wired, Slack restructured (three channels). AC: conversation.md done; gatekeeper-onboarding.md not started (blocks Day 4 integration test). AC1 doing triage/identity dedup, then gatekeeper-onboarding.
- **Day 4 (Wed March 18) blockers:** gatekeeper-onboarding.md (AC1 writing). DC tasks: error handling + hardening, bug fixes, emergency channel alerting. Full-chain integration test. Identity/runtime dedup review.
- **Deferred non-blocking:** OC repo creation, QC repo creation, v0.3 design — all NOT STARTED, none on critical path.
- **Remaining identity files:** gatekeeper-onboarding.md (Day 4 blocker), onboarding.md rewrite, new-contact.md, regular-user.md.
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

## Active Projects

- **_evryn-meta** — OC repo created (evryn-ops), QC repo created (evryn-quality). Operator guide created in evryn-backend.
- **evryn-backend** — Day 3 DC work complete. Approval flow + conversation pathway + Slack restructure. AC1 doing identity dedup then gatekeeper-onboarding.md.
- **evryn-team-agents** — PAUSED. Slack channel architecture decided (three channels + emergency DND override).
- **evryn-dev-workspace** — DC's home repo.
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Slack: "Evryn" app (renamed from "Evryn Notifications") — Socket Mode, bot token via `@slack/bolt`. Separate "Dev Alerts" app with webhook.
- Slack channels: `#evryn-approvals` (Evryn), `#dev-alerts` (agents), `#emergency-alerts` (DND override — not yet wired in code).
- Railway: `evryn-backend` project created, CLI installed and linked.
- Supabase: "Evryn Product" project (maruxkjwlfltlmureqkt). Schema migrated Day 2. Free plan — no automated backups.
- evryn@evryn.ai, review@evryn.ai, systemtest@evryn.ai — see operator guide for roles.

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
