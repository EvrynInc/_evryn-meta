# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-13T07:08:02-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key business model insight:** Evryn is a broker, not a SaaS. Everyone is a "user" — both sides of a connection pay per-connection. No clients vs contacts distinction. One `users` table, everyone equal.

## What's Next

- **BUILD-EVRYN-MVP.md rewrite (Pre-Work #10)** — The critical path item. AC reads each source, absorbs into build doc so DC gets a self-contained spec. Sources identified, pre-work checklist updated.
- **Write Evryn's triage system prompt (Pre-Work #6)** — The creative/strategic work. After source absorption.
- **Update DC's CLAUDE.md (Pre-Work #9)** — Testing mandate, build principles. After source absorption.

## Active Projects

- **_evryn-meta** — Hub enriched (problem statement, Why Now, Trust & Fit, GTM synthesis). SYSTEM_OVERVIEW tightened (swim lanes, Hub duplicates stripped). company-context retired. Doc architecture clean.
- **evryn-backend** — Evryn product MVP. All blockers cleared. Sources to Absorb documented. Build spec rewrite (Pre-Work #10) is next.
- **evryn-team-agents** — PAUSED. company-context deleted (absorbed into Hub). Clean pause state.
- **evryn-dev-workspace** — DC's home repo. Company context pointer updated to Hub.
- **evryn-website** — Live at evryn.ai. Justin has pending updates — see `evryn-website/2026.02.12_Website_Changes_Spec`.
- **evryn-langgraph-archive** — Read-only archive. Sealed.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn n8n Prototype project.
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
