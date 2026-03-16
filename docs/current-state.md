# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-15T17:25:11-07:00*
*Last #sweep: 2026-03-09*
*Last #align: 2026-03-09*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **Day 2 (Mon March 16) UNBLOCKED.** DC has everything: schema migration specs (DC0), identity files (core.md v7, operator.md, gatekeeper.md, triage.md v3), synthetic test fixtures, all credentials ready.
- **Remaining identity files:** conversation.md (DC Day 3 blocker, Tue March 17), gatekeeper-onboarding.md (Day 4, Wed March 18), onboarding.md rewrite (14 feedback items), new-contact.md and regular-user.md. Session doc: `_evryn-meta/docs/sessions/2026-03-15-identity-writing-s4.md`.
- **Schema decisions resolved (S4):** sender_type (lead/ignore/bad_actor), triage_result (gold/pass/edge), triage_reasoning, profile_jsonb.story (append-only), _meta hygiene key. Schema reference doc created at `evryn-backend/docs/schema-reference.md`.
- **Identity writing brief evolved** — now a lasting guide with Activity Module Patterns section (9 principles from triage.md).
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

## Active Projects

- **_evryn-meta** — S4 session doc current. Sweep protocol updated (schema & backup check).
- **evryn-backend** — DC Day 1 scaffolding complete. Day 2 unblocked. Schema reference doc created. ARCHITECTURE.md updated (message recording, identity resolution, evryn_knowledge breadcrumbs). Sprint doc has DC0 schema migration task.
- **evryn-team-agents** — PAUSED.
- **evryn-dev-workspace** — DC's home repo.
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Slack: "Evryn Notifications" app configured for Socket Mode (tokens in evryn-backend/.env). Legacy webhook retained until Socket Mode code is live.
- Railway: `evryn-backend` project created, CLI installed and linked. DC deploys with `railway up`.
- Supabase: "Evryn Product" project (maruxkjwlfltlmureqkt, renamed from "n8n Prototype"). Free plan — no automated backups. Manual dumps planned.
- Dashboard at evryn-dashboard.vercel.app (pulls from separate agent dashboard Supabase project).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
