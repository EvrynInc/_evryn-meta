# Archive Removal Plan — LangGraph → SDK Pivot

**Created:** 2026-02-06T18:47:00-08:00
**Purpose:** Clean the `evryn-team-agents` repo so a fresh DC instance can start building without old LangGraph context dragging it down. "Archive" = REMOVE from repo. Justin keeps local copies.

**When to execute:** After Justin confirms this plan. Before creating the fresh DC instance.

---

## ⚠️ CRITICAL PRE-FLIGHT CHECK — DO NOT SKIP

**Before touching CLAUDE.md in evryn-team-agents:**

The current `evryn-team-agents/CLAUDE.md` is DC's brain — it contains months of accumulated build context, operating instructions, the AC/DC protocol from DC's side, and hard-won patterns. **This file MUST be migrated to DC's new home repo BEFORE it gets overwritten with Lucas's system context.**

Checklist:
- [ ] DC's new home repo has been created (e.g., `evryn-dev-workspace`)
- [ ] Current `evryn-team-agents/CLAUDE.md` has been COPIED (not moved) to DC's new repo as its CLAUDE.md
- [ ] DC's new CLAUDE.md has been reviewed and adjusted for the new repo context (paths, references)
- [ ] Justin has confirmed DC's new CLAUDE.md is working
- [ ] ONLY THEN: overwrite `evryn-team-agents/CLAUDE.md` with Lucas's system context

**If this step is skipped, we lose all the work that went into making DC who it is today.**

---

## What Gets REMOVED

### LangGraph code (the core of what's being replaced)
- `src/graph/` — entire directory (index.ts, state.ts, test.ts, nodes/*, triggers/*)
- `src/graph-index.ts` — entry point for the graph
- `dist/` — entire compiled output directory (rebuild after cleanup)

### Old agent definitions (replaced by SDK subagent/skill structure)
- `agents/` — entire directory. The old agent definitions (instructions.md, capabilities.md) were built for LangGraph. New subagent definitions will be built from the handoff profiles as `.claude/agents/*.md` files. The `_global/` framework files are also LangGraph-specific (framework.md, framework-core.md, response_schema.json, modules/*).
- **Exception:** `agents/_global/company-context.md` — this is referenced by _evryn-meta docs. Copy to `modules/company-context.md` (per SDK file structure) BEFORE removing.

### Old build docs
- `docs/BUILD-LANGGRAPH.md` — completed LangGraph build spec, fully superseded
- `docs/BUILD_LOG.md` — historical build log, no longer relevant

### Old handoff folder
- `2026.01.24 handoff/` — pre-LangGraph handoff, fully absorbed

### Old DECISIONS.md (fresh start per Decision 9)
- `docs/DECISIONS.md` — start fresh for the SDK era. Justin keeps the old one for reference.

### Agent notes (bloated from zombie processes)
- `agents/*/notes.md` — these were going to be cleaned up with Justin, but since the entire agents/ folder is being removed, they go with it. Any valuable content should be reviewed by Justin first.

---

## What STAYS

### Active development infrastructure
- `docs/ac-to-dc.md` — active mailbox (until Lucas/Alex replaces AC/DC)
- `docs/dc-to-ac.md` — active mailbox
- `docs/ARCHITECTURE.md` — AC-owned, will be rewritten for SDK architecture
- `docs/dc-architecture-notes.md` — active pipeline

### New build artifacts
- `docs/BUILD-LUCAS-SDK.md` — the new build spec (DRAFT)

### Research (still valuable)
- `docs/research/` — all files. SDK research, memory systems, orchestration frameworks research all inform the new build.
- `docs/RESEARCH.md` — index
- `docs/LEARNINGS.md` — cross-build learnings

### Current handoff (source material for new build)
- `2026.02.06 Handoff/` — all files. These are actively needed during the build. Clean up AFTER Phase 1 is complete.

### Infrastructure that may survive
- `src/email/` — email client code may be reusable for Gmail MCP
- `src/scheduler/` — scheduler code may inform cron setup
- `src/tools/` — tool implementations may be reusable
- `src/config.ts`, `src/db.ts` — Supabase/config may carry forward
- `src/agents/` — loader/runtime/types, may inform SDK integration
- `sql/` — schema and migrations for Supabase
- `scripts/` — utility scripts

**Note on src/:** DC should assess which source files are reusable in the SDK architecture vs. which are LangGraph-coupled. The graph/ directory is definitively removed, but other modules might have reusable parts. DC can remove additional files during the build if they turn out to be dead code.

### Config and setup
- `CLAUDE.md` — **see critical pre-flight check above.** Becomes Lucas's system context ONLY AFTER DC's content is safely migrated.
- `.env`, `.env.example` — environment config
- `package.json`, `tsconfig.json` — project config (SDK package will be added)
- `docs/SETUP.md` — setup instructions (will need updates)
- `docs/OVERNIGHT-NOTES.md` — working doc

### SDK file structure (to be created during build)
- `.claude/agents/` — new subagent definitions
- `.claude/skills/` — new skills
- `.claude/commands/` — new slash commands
- `.claude/output-styles/` — output formatting
- `.claude/hooks/` — hook scripts
- `memories/` — persistent memory
- `modules/` — rich context files

---

## Execution Order

1. **Create DC's new home repo** and migrate DC's CLAUDE.md there (see pre-flight check)
2. **Justin reviews agent notes** — scan `agents/*/notes.md` for anything worth preserving before removal. Quick pass, not a deep read.
3. **Copy `agents/_global/company-context.md`** → `modules/company-context.md` (create modules/ dir)
4. **Remove** all items in the "REMOVED" section above
5. **Clean dist/** — remove entirely, will be regenerated
6. **Verify** — `git status` to confirm only intended files are staged for removal
7. **Commit** — "Remove LangGraph architecture files — preparing for SDK rebuild"
8. **Push** — get clean state to remote

---

## After Removal

- ARCHITECTURE.md gets rewritten by AC for SDK architecture
- CLAUDE.md gets rewritten as Lucas's system context (AC does prompt decomposition)
- Fresh DECISIONS.md started
- Fresh DC instance created in its new home repo
- DC reads BUILD-LUCAS-SDK.md and builds

---

*This plan is disposable — execute it, then delete this file.*
