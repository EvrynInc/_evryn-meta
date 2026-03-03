# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-03T13:52-08:00*
*Last #sweep: 2026-03-02*
*Last #align: 2026-03-02*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **5-day sprint: Mark live.** Sprint week March 2–6. Sprint plan at `evryn-backend/docs/SPRINT-MARK-LIVE.md`. Target: ready for Mark by Fri March 6.
- **Pre-Work #6 (architecture complete, identity writing brief ready):** All architectural decisions placed — ADRs 012-016. ARCHITECTURE.md Identity Composition section + BUILD doc updates done. Session doc fully absorbed, archived to `docs/historical/2026-02-24-mvp-build-work-s1-4.md`. Identity writing brief extracted to `evryn-backend/docs/identity-writing-brief.md` (file structure, structural principles, content specs per file, 14 source materials in reading order). Cookbook implementation notes added to BUILD doc. **Remaining:** Write identity content files (core.md + situation/activity modules) + Pre-Work #9 (DC CLAUDE.md update).
- **Build phases finalized:** v0.2 "Gatekeeper's Inbox" (Mark live ~March 10) → v0.3 "The Broker" (web app + matching + payments, first revenue late April) → v0.4 "Scale" (second gatekeeper, publisher, agents, June/July). SIFF (mid-May) is a target for presence.
- **Legal: Privacy & Terms questionnaire** — Under active consideration with Fenwick.

## Active Projects

- **_evryn-meta** — ADRs 012-016 written. Session doc absorbed into permanent docs, archived, and renamed. Identity writing brief extracted. All cookbook findings placed. Archive verified clean (reference-only). Three learning research docs created (`docs/research/`: learning-levels-and-instrumentation, metacognition-and-self-reflection, ml-transition-and-personalization). Breadcrumbs placed in technical-vision spoke.
- **evryn-backend** — **Sprint week March 2–6.** Sprint plan: `docs/SPRINT-MARK-LIVE.md`. ARCHITECTURE.md updated with Identity Composition section + 3 learning breadcrumbs (reasoning traces, self-reflection, approval gate as training interface). BUILD doc updated (trigger-composed systemPrompt, memory table, cookbook implementation notes, reasoning trace + approval outcome requirements on Phase 1 steps 1c/1d). Identity writing brief at `docs/identity-writing-brief.md`. DC1 scaffolding in progress (package.json, src/ created). DC2 synthetic fixtures delivered (18 emails).
- **evryn-team-agents** — PAUSED. #align flag added to ARCHITECTURE.md (do #align before resuming Lucas build). Reusable code being adapted for evryn-backend.
- **evryn-dev-workspace** — DC's home repo. OC/QC entities added to CLAUDE.md.
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase: TWO projects (keeping separate). Agent dashboard project + Evryn product project.
- Dashboard at evryn-dashboard.vercel.app (pulls from agent dashboard Supabase).
- evryn@evryn.ai — Evryn's own Google account (separate from agents@evryn.ai).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
