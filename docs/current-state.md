# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-16T16:50:53-07:00*
*Last #sweep: 2026-03-09*
*Last #align: 2026-03-09*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **Day 2 (Mon March 16) COMPLETE.** Schema migration done (sender_type, triage_result, triage_reasoning, CHECK constraints on all classification fields). Full triage pipeline running — SDK query() wired with trigger-composed identity, MCP tools for Supabase/email/Slack/identity modules, Slack Socket Mode two-way, forward detection, user record creation. 16/18 synthetic fixtures correct (2 non-deterministic but defensible). Evryn's voice and judgment are strong.
- **Day 3 (Tue March 17) blockers:** conversation.md identity file needed for conversation pathway. AC writing it in parallel session.
- **Remaining identity files:** conversation.md (Day 3), gatekeeper-onboarding.md (Day 4), onboarding.md rewrite (14 feedback items), new-contact.md and regular-user.md. Session doc: `_evryn-meta/docs/sessions/2026-03-15-identity-writing-s4.md`.
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

## Active Projects

- **_evryn-meta** — S4 session doc current. ARCHITECTURE.md updated (CHECK constraint principle).
- **evryn-backend** — Day 2 complete. Triage pipeline end-to-end. triage.md updated ("no note means triage" fix). DC pushing Day 2 code.
- **evryn-team-agents** — PAUSED.
- **evryn-dev-workspace** — DC's home repo.
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Slack: "Evryn Notifications" app — Socket Mode live in code (two-way). Catch-up-on-reconnect implemented.
- Railway: `evryn-backend` project created, CLI installed and linked. DC deploys with `railway up`.
- Supabase: "Evryn Product" project (maruxkjwlfltlmureqkt). Schema migrated Day 2 (new classification fields, CHECK constraints). Manual backup taken pre-migration. Free plan — no automated backups.
- Dashboard at evryn-dashboard.vercel.app (pulls from separate agent dashboard Supabase project).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).
- review@evryn.ai — alias for draft review / approval workflow.

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
