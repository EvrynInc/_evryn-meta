# #lock Protocol

**How to use this file:** Step-by-step checklist for when Justin says `#lock` or it's time for a checkpoint. Follow the steps in order.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

When Justin says `#lock` or it's time for a checkpoint:

1. **`docs/current-state.md`** — Refresh to reflect current reality. Clean snapshot, not a log.
2. **Build progress** — If build work was completed this session, update the BUILD doc's phase checklist in the relevant repo (status column). If a sprint doc exists, mark completed tasks. If the BUILD doc has an "Active session" pointer and session content has been absorbed into persistent docs, clear the pointer.
3. **Session decisions** — If decisions were made this session, ensure they're captured in a session decisions doc (`_evryn-meta/docs/sessions/`) or absorbed into persistent docs. Session decisions docs are disposable — absorb and delete. **ADR check:** If any decisions this session are architectural (change how the system works, not just craft/process choices), write them as ADRs now — decisions captured only in session docs often get lost in the shuffle over time.
4. **`ARCHITECTURE.md`** — Update the appropriate repo's ARCHITECTURE.md if anything architectural changed (schema, pipelines, user model, security patterns).
5. **Hub & spokes** — If anything this session changes company-level truth (Hub) or domain depth (spokes), update them. Also check: if a spoke was modified, does the Hub's corresponding section still set the right expectation?
6. **`LEARNINGS.md`** — Add appropriate cross-project patterns or insights.
7. **`AGENT_PATTERNS.md`** — Add appropriate agent-building learnings.
8. **`CHANGELOG.md`** — Add brief one-liners for anything built or changed this session.
9. **Linear** — Create tickets for small backlog items that aren't part of a current build. Don't duplicate what's in build docs or ARCHITECTURE.md.
10. **Bitwarden reminder** — If `.env` was modified, remind Justin: "Hey, we updated .env — remember to re-upload to Bitwarden." (Files in `.gitignore` exist only on the local machine — git won't save them. Most credentials can be regenerated from service dashboards, but it's time-consuming. Prevention beats cure.)
11. **Mailbox check** — Peek at `dc-to-ac.md` and `dc-architecture-notes-for-ac.md` in any repo you touched this session. If there's content you haven't absorbed, absorb it now.
12. **Operator guide** — If anything built or changed this session affects how Justin operates Evryn, update the relevant repo's `docs/operator-guide.md`. DC flags operator-relevant changes in dc-to-ac.md; AC updates the guide.
13. **Auto-memory hygiene** — Check `.claude/projects/*/memory/MEMORY.md`. AC does not use auto-memory (see CLAUDE.md Auto-Memory Hygiene). If anything landed there accidentally, promote it to persistent docs or clear it. The file should contain only the "DO NOT WRITE HERE" notice.
14. **Commit and push** — Get everything to remote immediately.

---

## Transitional Items (remove after SDK migration)

- **`docs/agent-notes-archive/alex-notes.md`** (in `evryn-team-agents`) — For now, update with anything relevant to Alex's working context. This content will be integrated into the new agent structure during SDK migration.
- **`evryn-team-agents/docs/DECISIONS.md`** — Old monolithic file from LangGraph era. Being replaced by ADR format (`docs/decisions/NNN-title.md`). New decisions go in ADRs or session docs until the old file is reviewed for still-living decisions and archived.
