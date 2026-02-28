# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-27T17:36-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection. Connections tracked as such from day one.

**Doc zoom-stack:** technical-vision.md (north star) → ARCHITECTURE.md (v0.2–v1.0) → BUILD doc (current phase). Each level anchors into the next — no orphaned ideas.

## What's Next

- **5-day sprint: Mark live.** Sprint plan at `evryn-backend/docs/SPRINT-MARK-LIVE.md`. Target: ready for Mark by Fri March 7. Mon–Fri, parallel AC/DC streams.
- **Pre-Work #6: Evryn identity** — Reframed: building Evryn's full identity, not a classifier. v0.1 scripts are the foundation (adaptation, not creation). Sprint Monday AC work. Prior session: `_evryn-meta/docs/sessions/2026-02-24-pre-work-6-session-1.md`.
- **Pre-Work #9: Update DC's CLAUDE.md** — Testing mandate, build principles. Sprint Monday.
- **Build phases restructured.** Old v0.3/v0.4/v1.0 collapsed. Full reasoning: `_evryn-meta/docs/sessions/2026-02-27-gtm-spoke-update-plan.md`. BUILD-EVRYN-MVP.md + Hub GTM paragraph need revision (not yet done).
- **Legal: Privacy & Terms questionnaire** — Sent to Fenwick. Meeting 2/26 to discuss.

## Active Projects

- **_evryn-meta** — GTM spoke update paused: research done, edits blocked on phase label finalization. Session doc: `docs/sessions/2026-02-27-gtm-spoke-update-plan.md`. AC designing Build 2 (graph schema, web app) in background during sprint week.
- **evryn-backend** — **Sprint week March 3–7.** Sprint plan: `docs/SPRINT-MARK-LIVE.md`. Pre-Work #6 identity is sprint Monday.
- **evryn-team-agents** — PAUSED. Reusable code (email polling, Gmail client, Supabase client) being adapted for evryn-backend.
- **evryn-dev-workspace** — DC's home repo.
- **evryn-website** — Live at evryn.ai.
- **evryn-langgraph-archive** — Read-only archive. Sealed.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project.
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
