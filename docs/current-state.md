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

- **Day 4 DC work complete (Tue March 17).** All hardening done: retry with backoff, crash recovery, stale item re-pings, graceful shutdown, edge cases, dedup verified, conversation fixture test passed. DC ahead of schedule (finished Day 3+4 in one calendar day).
- **triage.md trimmed + conversation.md approved** (AC1). Identity/runtime dedup principle applied: identity docs carry judgment, runtime carries mechanics. Gatekeeper privacy safeguard added to story writing.
- **Open design threads:** full profile_jsonb structure (v0.3), cross-user feedback routing (feedback-guidance.md), testing character framework (v0.3).
- **Remaining blocker: gatekeeper-onboarding.md** (AC1 next). Blocks full-chain integration test.
- **Day 5 (Thu March 19):** Integration test (once gatekeeper-onboarding.md lands), final stabilization, go/no-go.
- **Remaining identity files:** gatekeeper-onboarding.md (integration test blocker), onboarding.md rewrite, new-contact.md, regular-user.md.
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

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
