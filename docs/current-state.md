# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-10T18:12-07:00*
*Last #sweep: 2026-03-09*
*Last #align: 2026-03-09*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **Pre-Work #6 (identity writing IN PROGRESS):** core.md v5 complete. On disk: operator.md, gatekeeper.md (lifecycle fix done), triage.md (complete), onboarding.md (first draft, needs rewrite). **Still need:** conversation.md (DC Day 3 blocker), gatekeeper-onboarding.md (before Mark go-live), onboarding.md rewrite, core.md updates (available modules hub). v0.3-only: new-contact.md, regular-user.md. Architecture fully resolved (ADRs 012-017). Session doc: `_evryn-meta/docs/sessions/2026-03-09-identity-writing-s3.md`.
- **Build phases finalized:** v0.2 "Gatekeeper's Inbox" (Mark live ~March 18-19) → v0.3 "The Broker" (web app + matching + payments, first revenue late April) → v0.4 "Scale" (second gatekeeper, publisher, agents, June/July). SIFF (mid-May) is a target for presence.
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

## Active Projects

- **_evryn-meta** — Cross-doc consistency pass complete. Architecture trim executed and archived. Claude Code permissions configured. S3 session doc has sprint-aligned priority ordering and credential checklist for Justin.
- **evryn-backend** — DC Day 1 scaffolding complete (`src/` has email poller, Supabase client, Slack notifier, config). `.env` configured (Gmail OAuth, Supabase, Slack webhook, Anthropic API key). Synthetic test fixtures done (18 emails). Identity writing in progress (see Pre-Work #6 above). ARCHITECTURE.md trimmed. BUILD + SPRINT docs current. Pre-Work #9 (DC CLAUDE.md update) still pending.
- **evryn-team-agents** — PAUSED.
- **evryn-dev-workspace** — DC's home repo. DC #lock protocol updated (build progress step, merged AC handoff step, mailbox check with multi-instance note). DC CLAUDE.md updated (build progress tracking rule, session start mailbox check, multi-instance note, permanent infrastructure framing).
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project.
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
