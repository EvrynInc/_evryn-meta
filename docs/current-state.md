# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-25T13:08-08:00*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Mark's Inbox") for Mark (pilot user) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from Mark's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection. Connections tracked as such from day one.

## What's Next

- **Pre-Work #10 — DONE.** All sources absorbed into ARCHITECTURE.md and BUILD doc. Legal flow-through landed. Historical artifacts deleted. Status markers updated.
- **Pre-Work #6: Evryn identity architecture + content** — IN PROGRESS. Session 1 designed composable identity (core + modules). Session 2 verified SDK research + AGENT_PATTERNS integration, read Anthropic cookbooks, surfaced SDK-native alternative to raw systemPrompt composition. **Blocking question:** verify TypeScript SDK behavior (`systemPrompt` + `setting_sources` — supplement or replace?). Session doc: `_evryn-meta/docs/sessions/2026-02-24-pre-work-6-session-1.md`. Justin's Vertex AI workshop notes pending → research doc.
- **Pre-Work #9: Update DC's CLAUDE.md** — Testing mandate, build principles. After #6.
- **Legal: Privacy & Terms questionnaire** — Sent to Fenwick. Email addendum sent (5 items). They'll start next week.
- **Sheets work goes through Claude.ai** — AC gets read-only CSV snapshots locally for context.

## Active Projects

- **_evryn-meta** — Hub final pass complete. Spoke readthrough in progress (Hub done, spokes next). SYSTEM_OVERVIEW retired (absorbed into spokes), doc-ownership retired. `#sweep` protocol created (weekly hygiene). `#lock` updated with Hub/spokes consistency step. Cross-repo S_O references updated in all 4 repos. Research: 8 reports, all breadcrumbed. LEARNINGS fully promoted. Pre-Work #6 session doc has full context (2 sessions).
- **evryn-backend** — Pre-Work #10 DONE. ARCHITECTURE.md current (v4 + legal flow-through). BUILD doc aligned. Next: Pre-Work #6 identity content (blocked on SDK behavior verification + architectural approach decision).
- **evryn-team-agents** — PAUSED. Clean pause state. CLAUDE.md updated (hard stop + runtime context).
- **evryn-dev-workspace** — DC's home repo. Identity updated (writing discipline, lock protocol auto-memory step).
- **evryn-website** — Live at evryn.ai. CLAUDE.md is hard stop, build context in docs/ARCHITECTURE.md.
- **evryn-langgraph-archive** — Read-only archive. Sealed.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project (was "n8n Prototype" — to be renamed).
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
