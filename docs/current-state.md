# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-27T14:06-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection. Connections tracked as such from day one.

**Doc zoom-stack:** technical-vision.md (north star) → ARCHITECTURE.md (v0.2–v1.0) → BUILD doc (current phase). Each level anchors into the next — no orphaned ideas.

## What's Next

- **Pre-Work #10 — DONE.** All sources absorbed into ARCHITECTURE.md and BUILD doc.
- **Pre-Work #6: Evryn identity architecture + content** — IN PROGRESS. Session 1 designed composable identity (core + modules). Session 2 verified SDK research + AGENT_PATTERNS integration, read Anthropic cookbooks. **Blocking question:** verify TypeScript SDK behavior (`systemPrompt` + `setting_sources` — supplement or replace?). Session doc: `_evryn-meta/docs/sessions/2026-02-24-pre-work-6-session-1.md`.
- **Pre-Work #9: Update DC's CLAUDE.md** — Testing mandate, build principles. After #6.
- **Legal: Privacy & Terms questionnaire** — Sent to Fenwick. Meeting 2/26 to discuss.
- **Sheets work goes through Claude.ai** — AC gets read-only CSV snapshots locally for context.

## Active Projects

- **_evryn-meta** — ADR-010 (canary principle revised): opaque matching replaces absolute prohibition from ADR-008. Circulated through Hub, trust-and-safety spoke, UX spoke, active session doc. Creation/history footers stripped from all hub/spoke docs. Tech-vision final pass DONE. Foundation architecture extracted to `hub/detail/`. MP v2.3 gap analysis DONE. v0.1 prompt review DONE. Coherence pass DONE. Remaining spoke readthroughs: business-model, gtm-and-growth, bizops-and-tooling. Research: 9 reports, all breadcrumbed.
- **evryn-backend** — ARCHITECTURE.md updated this session: social graph functions, insight routing pipeline. Pre-Work #6 identity content next (blocked on SDK behavior verification).
- **evryn-team-agents** — PAUSED. Clean pause state.
- **evryn-dev-workspace** — DC's home repo.
- **evryn-website** — Live at evryn.ai.
- **evryn-langgraph-archive** — Read-only archive. Sealed.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project (was "n8n Prototype" — to be renamed).
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
