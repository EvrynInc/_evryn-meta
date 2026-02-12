# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-11T18:02:24-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Blockers before DC can build Evryn:**
- Justin must provide Evryn v0.1 system prompt (ready — needs to share with AC)
- n8n prototype exported and analyzed (DONE — JSON in `evryn-backend/docs/n8n-prototype/`, Supabase schema queried)

**Architecture decisions locked:** Claude Agent SDK, 4-layer memory, MCP tools, Railway deployment, synthetic test fixtures. Prototype Supabase schema (users/messages/emailmgr_items/evryn_knowledge) is MORE mature than build doc — build doc schema section needs rewrite to adopt it.

**Key business model insight:** Evryn is a broker, not a SaaS. Everyone is a "user" — both sides of a connection pay per-connection. No clients vs contacts distinction. One `users` table, everyone equal.

## Active Projects

- **evryn-backend** — Evryn product MVP. Build spec needs schema rewrite to adopt prototype tables. n8n JSON + .env.example committed. Two Supabase projects: agent dashboard (separate) + n8n prototype (product data).
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
