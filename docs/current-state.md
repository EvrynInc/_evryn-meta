# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-23T10:22:44-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from Mark's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection. Connections tracked as such from day one.

## What's Next

- **Spoke integration pass — IN PROGRESS.** 11 of ~35 gaps integrated so far (long-term-vision: 3, trust-and-safety: 5, BizOps: 3). All 7 high-priority gaps done. Remaining: business-model (7), gtm-and-growth (8), user-experience (10), technical-vision (13). Gap doc: `docs/working/mp-gap-analysis.md`.
- **Fenwick email addendum drafted** — 3 items not in questionnaire (self-assessment sharing, abuse prevention practices, AI authenticity monitoring). Justin holding to add anything else that surfaces during spoke integration.
- **Set up Google Drive MCP server for AC** — after spoke integration pass. Enables AC to read/write Sheets (sensitivity analysis, financial model) and other Drive files directly. Scoped credentials TBD.
- **Pre-Work #10: Build doc rewrite** — ARCHITECTURE.md complete (v4). Next: rewrite BUILD-EVRYN-MVP.md — absorb sources, fix terminology, update schema. Absorption notes at `evryn-backend/docs/historical/build-doc-absorption-notes.md`.
- **Pre-Work #6: Write Evryn's triage system prompt** — After #10. v0.1 patterns captured in `evryn-backend/docs/ARCHITECTURE.md` (Onboarding Patterns section). Also creates Evryn's company context module.
- **Pre-Work #9: Update DC's CLAUDE.md** — Testing mandate, build principles. After #10.
- **Legal: Privacy & Terms questionnaire** — Sent to Fenwick. They'll start next week.
- **Legal clarifications doc — ABSORBED AND DELETED.** All items routed to absorption notes checklist (`evryn-backend/docs/historical/build-doc-absorption-notes.md`). Flow-through resolves during Pre-Work #10 and #6. Two open decisions remain: gatekeeper final rules, safety imprint mechanism.

## Active Projects

- **_evryn-meta** — Spoke integration pass in progress (11/35 gaps done, all high-priority complete). Fenwick email addendum drafted. Legal questionnaire sent. BizOps legal content centralized to questionnaire (spoke links to it).
- **evryn-backend** — ARCHITECTURE.md created (v4). BUILD-EVRYN-MVP.md updated. Build doc rewrite is next.
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
