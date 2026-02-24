# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-24T12:52:20-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from Mark's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection. Connections tracked as such from day one.

## What's Next

- **Pre-Work #10 — DONE.** All sources absorbed into ARCHITECTURE.md and BUILD doc. Legal flow-through landed. Historical artifacts deleted. Status markers updated.
- **Pre-Work #6: Write Evryn's triage system prompt** — Next up. v0.1 patterns in ARCHITECTURE.md (Onboarding Patterns). Also creates Evryn's company context module. *Research prep done:* OpenClaw research report placed in `_evryn-meta/docs/research/`, breadcrumbs placed in all 4 build/architecture docs.
- **Pre-Work #9: Update DC's CLAUDE.md** — Testing mandate, build principles. After #6.
- **Legal: Privacy & Terms questionnaire** — Sent to Fenwick. Email addendum sent (5 items). They'll start next week.
- **Sheets work goes through Claude.ai** — AC gets read-only CSV snapshots locally for context.

## Active Projects

- **_evryn-meta** — Research centralized in `docs/research/` (7 reports). Research routing convention established across all CLAUDE.md files. LEARNINGS.md hygiene protocol added. Fenwick questionnaire + email addendum sent.
- **evryn-backend** — Pre-Work #10 DONE. ARCHITECTURE.md current (v4 + legal flow-through). BUILD doc aligned. Next: Pre-Work #6 (system prompt).
- **evryn-team-agents** — PAUSED. Clean pause state. CLAUDE.md updated (hard stop + runtime context).
- **evryn-dev-workspace** — DC's home repo. Identity updated (reading order, Diataxis, auto-memory hygiene, edit-approval).
- **evryn-website** — Live at evryn.ai. CLAUDE.md is hard stop, build context in docs/ARCHITECTURE.md.
- **evryn-langgraph-archive** — Read-only archive. Sealed.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project (was "n8n Prototype" — to be renamed).
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
