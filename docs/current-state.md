# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-19T12:32:39-07:00*
*Last #sweep: 2026-03-18*
*Last #align: 2026-03-18*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **Day 5 DC working (Thu March 19).** Status lifecycle migration (ADR-018), sendEmail retry, follow-up cron, approval parser improvement, final stabilization (WebSocket heartbeat).
- **ADR-018 finalized.** Gold stays (Evryn's prediction). Match = confirmed (gatekeeper validated). Status lifecycle redesigned: delivered→matched/passed/no_gk_response. Lifecycle metadata with timestamptz for auditability. Approval gate as architectural invariant.
- **triage.md trimmed + conversation.md approved** (AC1). Identity/runtime dedup principle applied.
- **Remaining blocker: gatekeeper-onboarding.md** (AC1 next). Blocks full-chain integration test.
- **Remaining identity files:** gatekeeper-onboarding.md (integration test blocker), onboarding.md rewrite, new-contact.md, regular-user.md.
- **Legal: Terms & Privacy Policy** — Fenwick draft received, extensive changes sent back (2026-03-18). Likely 3+ more days. Go-live blocked on legal completion — pushed to next week.
- **Go-live timing relaxed.** Mark is in no hurry. Quality over speed — "right over fast" principle added to sprint doc.

## Active Projects

- **_evryn-meta** — OC + QC repos created. Seattle launch research complete. Strategic reframe: "concentrate effort, open aperture." Trusted Partner Briefing v1.7 drafted (Justin reviewing).
- **evryn-backend** — Day 4 DC complete. Hardened pipeline. Operator guide current. Waiting on gatekeeper-onboarding.md for integration test.
- **evryn-ops** — Created. OC CLAUDE.md ready.
- **evryn-quality** — Created. QC CLAUDE.md ready.
- **evryn-team-agents** — PAUSED. Slack channel architecture documented.
- **evryn-dev-workspace** — DC's home repo.
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Slack: "Evryn" app — Socket Mode, bot token via `@slack/bolt`. "Dev Alerts" app with webhook. Channels: `#evryn-approvals`, `#dev-alerts`, `#emergency-alerts` (not wired).
- Railway: `evryn-backend` project created, CLI installed and linked.
- Supabase: "Evryn Product" project. Schema migrated Day 2. Free plan — no automated backups.
- evryn@evryn.ai, review@evryn.ai, systemtest@evryn.ai — see operator guide for roles.

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
