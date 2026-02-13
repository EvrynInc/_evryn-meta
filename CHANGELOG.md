# Changelog — _evryn-meta

**How to use this file:** Brief one-liners per change. Detail lives in git log. Most recent changes at top.

---

## 2026-02-13

- Hub enriched: problem statement, Why Now, renamed Trust Architecture → Trust & Fit, GTM synthesis (gatekeeper + wave), Fenwick & West, flywheel in business model
- Retired `company-context.md` — unique content absorbed into Hub, all references updated across 4 repos, file deleted
- SYSTEM_OVERVIEW tightened: stripped Hub-duplicate sections, added swim lane status (Done/Next) per component, slimmed Current Priorities to Product Roadmap Sequence
- Created `evryn-backend/docs/historical/` — moved background docs, prototype, n8n, session handoff, v0.1 system prompt
- Moved v0.1 system prompt files from `_evryn-meta` to `evryn-backend/docs/historical/`
- Sources to Absorb section written in BUILD-EVRYN-MVP.md (pre-work checklist updated)
- Success criteria added to BUILD-EVRYN-MVP.md workflow section
- ADR-001: added Thea subagent reversal note
- MEMORY.md cleaned (removed ~70 lines of stale/completed content)
- Deleted cleanup-working-notes.md (all tasks complete)

## 2026-02-12

- Established hub-and-spoke document architecture: Hub (`docs/roadmap.md`) as single living source of company truth
- Master Plan Reference verified against full Master Plan v2.3 (side-by-side read, breadcrumbs, substantive additions, BizOps tools expanded)
- Moved Master Plan Reference + Master Plan v2.3 to `docs/historical/` with frozen headers
- CLAUDE.md: Hub pointer, reference-cleanup principle, communication rules, self-contained build doc principle
- AC/DC protocol: permanent infrastructure note
- Lock protocol: added CHANGELOG to checklist
- Cleaned stale references across repos (evryn-backend session handoff)

## 2026-02-11

- Created master-plan-reference.md (611 lines, comprehensive condensation of 3,205-line Master Plan)
- Moved Master Plan v2.3 from evryn-backend to _evryn-meta (company-level doc)
- Multi-repo sweep across all 6 repos (cleaned orphaned files, fixed timestamps, clarified protocols)
- Added "organize early" principle to CLAUDE.md Architectural Mandate
- Added v0.1 system prompt to `docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/`

## 2026-02-09

- Created ADR structure (`docs/decisions/`) with 7 initial ADRs (001-007)
- Restructured CLAUDE.md with Diátaxis + progressive depth approach
- Extracted AC/DC protocol to `docs/ac-dc-protocol.md`
- Extracted #lock protocol to `docs/lock-protocol.md`
- Extracted doc ownership table to `docs/doc-ownership.md`
- Created cross-project state file `docs/current-state.md`
- Absorbed and deleted session decisions doc (2026-02-06)
- Deleted vestigial mailbox files from `docs/` (moved to repo-level per protocol)
- Added DC CLAUDE.md cleanup items to archive removal plan

## 2026-02-06

- SDK architecture pivot: LangGraph → Claude Agent SDK (ADR-001)
- Created build spec DRAFT (`evryn-team-agents/docs/BUILD-LUCAS-SDK.md`)
- Created archive removal plan (`docs/archive-removal-plan.md`)
