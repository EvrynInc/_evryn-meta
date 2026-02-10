# ADR-003: Archive Means Remove from Repo

**Date:** 2026-02-06
**Status:** Accepted
**Absorbed from:** Session decision 10 (2026-02-06)

## Context

After the SDK pivot (ADR-001), all LangGraph code and docs need to be archived. The question was whether "archive" means moving to an archive folder within the repo or removing from the repo entirely.

## Decision

Archive = REMOVE from the repository. Don't just move to an archive folder. Justin keeps files at hand locally if needed, but they must not be in the repo where a future Claude instance could accidentally read old context and get confused.

## Consequences

- Archive removal plan at `_evryn-meta/docs/archive-removal-plan.md` specifies what gets removed
- Critical pre-flight: DC's CLAUDE.md must be migrated to a new home repo before overwriting with Lucas's CLAUDE.md
- Any future archival should follow this same principle — remove, don't relocate within the repo
