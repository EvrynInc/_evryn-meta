# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-13T15:02:11-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from Mark's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection. Connections tracked as such from day one.

## What's Next

- **Pre-Work #10: Build doc rewrite + ARCHITECTURE.md creation** — The critical path item. AC has read all source documents. Next step: split architecture sections out of BUILD-EVRYN-MVP.md into `evryn-backend/docs/ARCHITECTURE.md`, then absorb sources into both docs. Key insights to incorporate: connections table is v0.2 scope, user isolation model, Justin-as-publisher, proactive behavior, `profile_jsonb` structure from Dec 2 historical doc.
- **Pre-Work #6: Write Evryn's triage system prompt** — After source absorption. v0.1 system prompt patterns identified (Dream with me, Smart Curiosity, dual-track processing).
- **Pre-Work #9: Update DC's CLAUDE.md** — Testing mandate, build principles. After source absorption.

## Active Projects

- **_evryn-meta** — Hub reframed (connections not classification, hub hygiene guidance, user isolation, agent council stubs). SYSTEM_OVERVIEW reframed (connection brokering data flow, Evryn architecture principles).
- **evryn-backend** — All sources read. Build doc rewrite (#10) is next. Will produce ARCHITECTURE.md (new) + revised BUILD-EVRYN-MVP.md.
- **evryn-team-agents** — PAUSED. Clean pause state.
- **evryn-dev-workspace** — DC's home repo.
- **evryn-website** — Live at evryn.ai. Justin has pending updates — see `evryn-website/2026.02.12_Website_Changes_Spec`.
- **evryn-langgraph-archive** — Read-only archive. Sealed.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project (was "n8n Prototype" — to be renamed).
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
