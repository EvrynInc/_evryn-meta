# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-11T16:07:13-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Blockers before DC can build Evryn:**
- Justin must provide Evryn v0.1 system prompt (ready — needs to share with AC)
- Justin must export n8n prototype workflow (next up — AC will also review attached Supabase tables)

**Architecture decisions locked this session:** Claude Agent SDK as framework, 4-layer memory architecture, MCP-based tool kit, synthetic test fixtures (6 archetypes), Railway for deployment. Build doc rewritten with full SDK architecture, query() examples, and self-contained DC instructions.

## Active Projects

- **evryn-backend** — Evryn product MVP. Build spec rewritten (2026-02-11): technology stack, SDK architecture, memory design, testing strategy, build order. Glossary added. Ready for DC once blockers clear.
- **evryn-team-agents** — PAUSED. Clean pause state. Ready to resume after MVP.
- **evryn-dev-workspace** — DC's home repo. Clean.
- **evryn-langgraph-archive** — Read-only archive. Sealed.
- **evryn-website** — Live at evryn.ai. Justin has pending updates.
- **_evryn-meta** — AC's home. CLAUDE.md updated with Justin's technical level and "build for one, structure for many" principle.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase database live (agent tables from LangGraph era + n8n prototype tables).
- Dashboard at evryn-dashboard.vercel.app (pulls from Supabase). Will add Evryn product agent.
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
