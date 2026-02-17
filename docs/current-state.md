# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-16T16:55:07-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from Mark's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection. Connections tracked as such from day one.

## What's Next

- **Pre-Work #10 (in progress): Build doc rewrite** — ARCHITECTURE.md complete (v4, committed). Next: rewrite BUILD-EVRYN-MVP.md — absorb sources, fix terminology ("clients" → "users"), trim architecture sections (point to ARCHITECTURE.md), update schema section. Session handoff doc (`_evryn-meta/docs/session-handoff-2026-02-13.md`) still has content for the build doc rewrite — delete after full absorption.
- **Pre-Work #6: Write Evryn's triage system prompt** — After #10. v0.1 system prompt patterns identified (Dream with me, Smart Curiosity, dual-track processing).
- **Pre-Work #9: Update DC's CLAUDE.md** — Testing mandate, build principles. After #10.
- **Legal: Privacy & Terms questionnaire** — Fourth draft at `docs/legal/privacy-and-terms-questionnaire.md`. Decisions made: age=18, verification=pass-through (Evryn never holds ID data), safety identifier generalized (mechanism TBD). Remaining open: gatekeeper first-right-of-refusal (substantial discussion, not yet resolved). Next: fresh-instance verification pass against all system docs.
- **Legal clarifications → system docs** — `docs/legal/clarifications-for-system-docs.md` has resolved items that need to be written into ARCHITECTURE.md, BUILD docs, and system prompts. Needs a dedicated pass to flow all decisions into the right places.

## Active Projects

- **_evryn-meta** — Legal questionnaire in progress. Hub updated (Master Plan spokes clarified). Clarifications tracker created for items that need to flow to system/arch docs.
- **evryn-backend** — ARCHITECTURE.md created (v4). BUILD-EVRYN-MVP.md rewrite is next. Session handoff doc still needed for build doc rewrite.
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
