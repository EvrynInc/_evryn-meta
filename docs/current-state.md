# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-02-09T15:38:43-08:00*

---

## Architecture Transition

LangGraph multi-agent system → single Lucas agent on Claude Agent SDK. Pivot decided 2026-02-06. LangGraph code still in repo pending archive removal (`_evryn-meta/docs/archive-removal-plan.md`).

**Build spec (DRAFT):** `evryn-team-agents/docs/BUILD-LUCAS-SDK.md` — NOT ready for DC yet.

**Before DC can build:**
- AC must decompose Lucas's system instructions into SDK locations
- DC needs a new home repo so Lucas can have `evryn-team-agents/CLAUDE.md`
- Open architecture questions (permission model, memory, dashboarding, audit trails)
- Justin must review team perspective profiles before they become subagent files
- Archive removal plan must be executed
- Session decisions (26 items from pivot session) pending absorption into ADR format

**Source material:** `evryn-team-agents/2026.02.06 Handoff/` — temporary, will be cleaned up after build Phase 1.

## Active Projects

- **evryn-team-agents** — SDK build phase. Waiting on AC to finish spec work.
- **evryn-website** — Live at evryn.ai. Justin has pending updates (content tweaks in a Claude conversation and email thread — details to be routed to evryn-website repo context).
- **_evryn-meta** — Context hygiene in progress (2026-02-09). AC's CLAUDE.md being restructured for Diátaxis + progressive depth approach.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Supabase database live (agent tables from LangGraph era).
- Dashboard at evryn-dashboard.vercel.app (pulls from Supabase).

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
