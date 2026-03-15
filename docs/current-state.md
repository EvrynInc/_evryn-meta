# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-14T19:54-07:00*
*Last #sweep: 2026-03-09*
*Last #align: 2026-03-09*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **Pre-Work #6 (identity writing IN PROGRESS):** core.md v5 complete. On disk: operator.md, gatekeeper.md (lifecycle fix done), triage.md (complete), onboarding.md (first draft, needs rewrite). S3a prep work done. **Next up:** finish remaining identity files (conversation.md, gatekeeper-onboarding.md, core.md updates, internal-reference files, company-context.md). Session doc: `_evryn-meta/docs/sessions/2026-03-09-identity-writing-s3.md`.
- **Testing approach updated:** Fictional test gatekeeper (not Mark's real criteria). Two-phase: hand-seeded criteria for engine validation (Day 2), then wipe-and-reonboard integration test (Day 4) where Justin plays the fictional gatekeeper via `systemtest@evryn.ai`. Mark's real criteria learned through his own onboarding conversation. See BUILD doc and sprint doc.
- **Build phases finalized:** v0.2 "Gatekeeper's Inbox" (Mark live target shifting due to snow/power outage delays — behind ~2 days) → v0.3 "The Broker" (web app + matching + payments, first revenue late April) → v0.4 "Scale" (second gatekeeper, publisher, agents, June/July).
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

## Active Projects

- **_evryn-meta** — S3 session doc updated for clean handoff. Claude Code permissions configured across all repos (portable settings.json with ~/ paths, gitignore hygiene, CLAUDE.md notes).
- **evryn-backend** — DC Day 1 scaffolding complete. All DC Day 2 credentials ready (Slack Socket Mode + Railway linked). Identity writing in progress (see Pre-Work #6 above).
- **evryn-team-agents** — PAUSED. Settings.local.json cleaned (had Linear API key in plaintext).
- **evryn-dev-workspace** — DC's home repo. CLAUDE.md updated with permissions hygiene note.
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
