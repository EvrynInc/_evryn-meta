# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-11T09:16:00-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP for Mark (pilot user) first. Simpler, real user feedback loop, everything transfers back to agent build. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Blockers before DC can build Evryn:**
- Justin must provide Evryn v0.1 system prompt
- Justin must provide/point to n8n prototype workflow (prior art)

**Agent build (Lucas) is in a clean pause state** — all repos cleaned, archived, documented. Ready to resume anytime.

## Active Projects

- **evryn-backend** — NEW (created 2026-02-10). Evryn product MVP. Build spec at `docs/BUILD-EVRYN-MVP.md`. CLAUDE.md written for DC orientation.
- **evryn-team-agents** — PAUSED. SDK transition cleanup complete. LangGraph archived. Waiting on Evryn product MVP to finish, then resume Lucas build.
- **evryn-dev-workspace** — DC's home repo. CLAUDE.md, lock protocol. Clean.
- **evryn-langgraph-archive** — Read-only archive. Sealed.
- **evryn-website** — Live at evryn.ai. Orphaned assets cleaned (2026-02-11). Justin has pending updates.
- **_evryn-meta** — AC's home. Multi-repo sweep complete (2026-02-11). All docs current.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase database live (agent tables from LangGraph era + n8n prototype tables).
- Dashboard at evryn-dashboard.vercel.app (pulls from Supabase). Will add Evryn product agent.
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
