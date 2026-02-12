# Changelog — _evryn-meta

**How to use this file:** Brief one-liners per change. Detail lives in git log. Most recent changes at top.

---

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
