# Changelog — _evryn-meta

**How to use this file:** Brief one-liners per change. Detail lives in git log. Most recent changes at top.

---

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
