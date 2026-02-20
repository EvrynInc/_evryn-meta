# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-20T14:05:44-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from Mark's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection. Connections tracked as such from day one.

## What's Next

- **Hub restructuring (IN PROGRESS, ~85%)** — Spokes, Hub expansion, Hub header rewrite, link convention, and roadmap.md references all done. evryn-website restructured (CLAUDE.md → hard stop, build context → docs/ARCHITECTURE.md). CLAUDE.md audience separation decided (each repo's CLAUDE.md serves the runtime agent, not developers; DC builds from evryn-dev-workspace). Remaining: DC redirects in evryn-backend + evryn-team-agents CLAUDE.md, DC identity update (reading order, auto-memory hygiene), AC CLAUDE.md update (DC ownership, edit-approval rule, auto-memory hygiene), edit-approval disclaimers on ~20 docs, freeze MPR. Working notes: `docs/session-hub-build-2026-02-20.md`.
- **Pre-Work #10: Build doc rewrite** — ARCHITECTURE.md complete (v4). Next: rewrite BUILD-EVRYN-MVP.md — absorb sources, fix terminology, update schema. Absorption notes at `evryn-backend/docs/historical/build-doc-absorption-notes.md`.
- **Pre-Work #6: Write Evryn's triage system prompt** — After #10. v0.1 patterns captured in `evryn-backend/docs/ARCHITECTURE.md` (Onboarding Patterns section). Also creates Evryn's company context module.
- **Pre-Work #9: Update DC's CLAUDE.md** — Testing mandate, build principles. After #10.
- **Legal: Privacy & Terms questionnaire** — Sent to Fenwick. They'll start next week.
- **Legal clarifications → system docs** — `docs/legal/clarifications-for-system-docs.md` has 16 items. Many will be resolved during Hub restructuring; remainder needs a dedicated pass.

## Active Projects

- **_evryn-meta** — Hub restructuring ~85%. All content work done (spokes, Hub, header, links, references). Remaining: DC redirects, identity updates, edit-approval disclaimers, freeze MPR. ADR-008 written. Legal questionnaire sent to Fenwick.
- **evryn-backend** — ARCHITECTURE.md created (v4). BUILD-EVRYN-MVP.md updated (Evryn company context module added). Build doc rewrite is next after Hub.
- **evryn-team-agents** — PAUSED. Clean pause state.
- **evryn-dev-workspace** — DC's home repo. Identity update pending (reading order, auto-memory hygiene).
- **evryn-website** — Live at evryn.ai. Restructured: CLAUDE.md is now a hard stop (use DC), build context in docs/ARCHITECTURE.md.
- **evryn-langgraph-archive** — Read-only archive. Sealed.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project (was "n8n Prototype" — to be renamed).
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
