# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-05T14:07-08:00*
*Last #sweep: 2026-03-02*
*Last #align: 2026-03-02*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **Pre-Work #6 (identity writing IN PROGRESS):** core.md v5 complete. Situation modules written. Triage complete. **3 of 5 open questions resolved this session:** trigger mechanism, SDK Skills alignment (ADR-012 addendum), dynamic loading + sessions + activity determination (activity modules shift to on-demand, no SDK sessions, memory-managed context). **2 remaining:** module shape/format, core.md updates (now includes "available activities" hub section). Persistent docs (ARCHITECTURE.md trigger diagram, ADR-012/015) need updating to reflect activity module shift. Session doc: `_evryn-meta/docs/sessions/2026-03-04-identity-writing-s2.md`.
- **Build phases finalized:** v0.2 "Gatekeeper's Inbox" (Mark live ~March 10) → v0.3 "The Broker" (web app + matching + payments, first revenue late April) → v0.4 "Scale" (second gatekeeper, publisher, agents, June/July). SIFF (mid-May) is a target for presence.
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

## Active Projects

- **_evryn-meta** — S2 session doc tracks all decisions. 3 of 5 questions resolved (trigger, SDK Skills, dynamic loading/sessions/activity). ADR-012 addendum written. Remaining: module shape/format, core.md updates. Persistent docs need updating for activity module shift.
- **evryn-backend** — Identity files on disk: core.md (v5), situations/operator.md, situations/gatekeeper.md (needs lifecycle fix), activities/triage.md (complete), activities/onboarding.md (first draft, needs rework). BUILD doc updated (steps 4, 7-10, approval gate, v0.2/v0.3 framing). Pre-Work #9 (DC CLAUDE.md update) still pending.
- **evryn-team-agents** — PAUSED.
- **evryn-dev-workspace** — DC's home repo. OC/QC entities added to CLAUDE.md.
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project.
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
