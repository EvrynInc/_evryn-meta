# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-11T18:58:56-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Blockers before DC can build Evryn:**
- Justin must provide Evryn v0.1 system prompt (ready — needs to share with AC)
- n8n prototype exported and analyzed (DONE)

**Key business model insight:** Evryn is a broker, not a SaaS. Everyone is a "user" — both sides of a connection pay per-connection. No clients vs contacts distinction. One `users` table, everyone equal.

## What's In Flight

AC Session 1 complete. Prototype Supabase schema analyzed — MORE mature than build doc's proposed schema. Three background docs (Master Plan, two requirements drafts) in `evryn-backend/docs/` ready for AC to read and integrate. **Full handoff context: `evryn-backend/docs/session-handoff-2026-02-11.md`** — a fresh AC instance should read that before touching the build doc.

## Active Projects

- **evryn-backend** — Evryn product MVP. Background docs + schema analysis committed. Build spec rewrite pending background doc review.
- **evryn-team-agents** — PAUSED. Clean pause state.
- **evryn-dev-workspace** — DC's home repo. Clean.
- **evryn-langgraph-archive** — Read-only archive. Sealed.
- **evryn-website** — Live at evryn.ai. Justin has pending updates.
- **_evryn-meta** — AC's home. CLAUDE.md updated with Justin's technical level.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn n8n Prototype project.
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
