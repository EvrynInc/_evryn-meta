# #lock Protocol

**How to use this file:** Step-by-step checklist for when Justin says `#lock` or it's time for a checkpoint. Follow the steps in order.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

When Justin says `#lock` or it's time for a checkpoint:

1. **`docs/current-state.md`** — Refresh to reflect current reality. Clean snapshot, not a log.
2. **Session decisions** — If decisions were made this session, ensure they're captured in a session decisions doc (`_evryn-meta/docs/`) or absorbed into persistent docs. Session decisions docs are disposable — absorb and delete.
3. **`ARCHITECTURE.md`** — Update the appropriate repo's ARCHITECTURE.md if anything architectural changed (schema, pipelines, user model, security patterns).
4. **`LEARNINGS.md`** — Add appropriate cross-project patterns or insights.
5. **`AGENT_PATTERNS.md`** — Add appropriate agent-building learnings.
6. **`CHANGELOG.md`** — Add brief one-liners for anything built or changed this session.
7. **Linear** — Create tickets for small backlog items that aren't part of a current build. Don't duplicate what's in build docs or ARCHITECTURE.md.
8. **Bitwarden reminder** — If `.env` was modified, remind Justin: "Hey, we updated .env — remember to re-upload to Bitwarden." (Files in `.gitignore` exist only on the local machine — git won't save them. Most credentials can be regenerated from service dashboards, but it's time-consuming. Prevention beats cure.)
9. **Auto-memory hygiene** — Check `.claude/projects/*/memory/MEMORY.md`. Promote anything that belongs in persistent docs (LEARNINGS.md, CLAUDE.md, etc.), then remove it from memory. Keep memory under ~20 lines — it's a scratchpad, not a second documentation system.
11. **Commit and push** — Get everything to remote immediately.

---

## Transitional Items (remove after SDK migration)

- **`docs/agent-notes-archive/alex-notes.md`** (in `evryn-team-agents`) — For now, update with anything relevant to Alex's working context. This content will be integrated into the new agent structure during SDK migration.
- **`evryn-team-agents/docs/DECISIONS.md`** — Old monolithic file from LangGraph era. Being replaced by ADR format (`docs/decisions/NNN-title.md`). New decisions go in ADRs or session docs until the old file is reviewed for still-living decisions and archived.
