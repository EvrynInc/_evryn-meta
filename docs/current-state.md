# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-10T15:27:36-08:00*

---

## Architecture Transition

LangGraph multi-agent system → single Lucas agent on Claude Agent SDK. Pivot decided 2026-02-06. LangGraph code archived to `evryn-langgraph-archive` repo (standalone, under `Code/`). Archive cleanup complete.

**Build spec (DRAFT):** `evryn-team-agents/docs/BUILD-LUCAS-SDK.md` — NOT ready for DC yet.

**Before DC can build:**
- AC must decompose Lucas's system instructions into SDK locations (first build task)
- Open architecture questions (permission model, memory, dashboarding, audit trails)
- Justin must review team perspective profiles before they become subagent files

## Active Projects

- **evryn-team-agents** — SDK transition cleanup complete. LangGraph artifacts archived, handoff files restructured into modules/, ARCHITECTURE.md rewritten, BUILD-LUCAS-SDK.md cleaned up. Waiting on AC to do prompt decomposition (first build task).
- **evryn-dev-workspace** — Created 2026-02-10. DC's home repo. CLAUDE.md, lock protocol, .gitignore. Pushed to GitHub.
- **evryn-langgraph-archive** — Created 2026-02-10. Read-only archive of LangGraph-era code, agent defs (with original unedited notes), and build docs. Pushed to GitHub.
- **evryn-website** — Live at evryn.ai. Justin has pending updates.
- **_evryn-meta** — Context hygiene complete. ADR structure created. AC CLAUDE.md needs stale ref updates (Thea, repo locations, archive status).

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase database live (agent tables from LangGraph era).
- Dashboard at evryn-dashboard.vercel.app (pulls from Supabase).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
