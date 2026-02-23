# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-23T13:37:08-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from Mark's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection. Connections tracked as such from day one.

## What's Next

- **Spoke integration pass — COMPLETE.** All ~35 MP v2.3 gaps integrated across 7 spokes + ARCHITECTURE.md (34 integrated, 1 dropped). Gap analysis file deleted (recoverable from git history).
- **Fenwick email addendum** — 5 delta items not in questionnaire. Justin has captured these into email draft.
- **Set up Google Drive MCP server for AC** — next strategic task. Enables AC to read/write Sheets (sensitivity analysis, financial model) and other Drive files directly. Scoped credentials TBD.
- **Pre-Work #10: Build doc rewrite** — ARCHITECTURE.md complete (v4, now with Design Drivers + Matching Calibration sections). Next: rewrite BUILD-EVRYN-MVP.md — absorb sources, fix terminology, update schema. Absorption notes at `evryn-backend/docs/historical/build-doc-absorption-notes.md`.
- **Pre-Work #6: Write Evryn's triage system prompt** — After #10. v0.1 patterns captured in `evryn-backend/docs/ARCHITECTURE.md` (Onboarding Patterns section). Also creates Evryn's company context module.
- **Pre-Work #9: Update DC's CLAUDE.md** — Testing mandate, build principles. After #10.
- **Legal: Privacy & Terms questionnaire** — Sent to Fenwick. They'll start next week.
- **Open design decisions:** (1) Gatekeeper agreement terms — "channel not ownership" framing resolved in GTM spoke, but formal contractual rules needed before onboarding Mark. (2) Safety imprint technical mechanism — the non-reversible hash that lets Evryn recognize banned users after account deletion. Concept defined in Fenwick privacy questionnaire (`docs/legal/privacy-and-terms-questionnaire.md`) and trust-and-safety spoke; implementation design (hashing approach, iDenfy integration, what signals feed it) TBD for `evryn-backend/docs/ARCHITECTURE.md`.

## Active Projects

- **_evryn-meta** — Spoke integration pass COMPLETE. All 7 spokes enriched from MP v2.3. Fenwick email addendum at 5 items. Legal questionnaire sent.
- **evryn-backend** — ARCHITECTURE.md updated (Design Drivers, Matching Calibration). BUILD-EVRYN-MVP.md rewrite is next.
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
