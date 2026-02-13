# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-12T13:39:26-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key business model insight:** Evryn is a broker, not a SaaS. Everyone is a "user" — both sides of a connection pay per-connection. No clients vs contacts distinction. One `users` table, everyone equal.

## What's Next

- **BUILD-EVRYN-MVP.md rewrite** — DC's self-contained source of truth. Absorb prototype analysis, schema docs, all decisions in-doc. No "go read this other thing."
- **BUILD-LUCAS-SDK.md note** — Hub replaces scattered system-level refs. Internal/external firewalling architecture needed for Lucas.
- **Cross-repo cleanup** — company-context.md retired (content absorbed into Hub). SYSTEM_OVERVIEW.md tightening in progress.

## Active Projects

- **_evryn-meta** — Hub created (`docs/roadmap.md`). Hub-and-spoke document architecture established. Historical vault populated. CLAUDE.md updated.
- **evryn-backend** — Evryn product MVP. All blockers cleared (v0.1 prompt analyzed, prototype schema analyzed). Build spec rewrite is next.
- **evryn-team-agents** — PAUSED. Clean pause state.
- **evryn-dev-workspace** — DC's home repo. Clean.
- **evryn-website** — Live at evryn.ai. Justin has pending updates.
- **evryn-langgraph-archive** — Read-only archive. Sealed.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn n8n Prototype project.
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
