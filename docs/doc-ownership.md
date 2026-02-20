# Document Ownership

**How to use this file:** Reference table for who owns what document across Evryn repos. Check this before creating or modifying documents to ensure you're writing to the right place.

**Rule:** Every document must have a "how to use this" header explaining what belongs in it and what doesn't. This prevents scope creep and sprawl.

**Note:** Once Lucas/Alex is running, many of these docs will be jointly owned by AC and Lucas. AC retains authority for architectural decisions; Lucas maintains operational state. Ownership table will be updated at that transition.

---

| Document | Owner | Purpose |
|----------|-------|---------|
| `_evryn-meta/CLAUDE.md` | AC | Operating manual (AC's identity and methodology) |
| `_evryn-meta/SYSTEM_OVERVIEW.md` | AC | Technical architecture, repos, services |
| `_evryn-meta/LEARNINGS.md` | AC | Cross-project patterns and insights |
| `_evryn-meta/RESEARCH.md` | AC | Cross-project research index, pointers to repo `docs/research/` folders |
| `_evryn-meta/AGENT_PATTERNS.md` | AC | Agent-building learnings for Evryn product |
| `evryn-team-agents/CLAUDE.md` | AC | Currently DC's build context. Will become Lucas's system context after DC migrates. |
| `evryn-team-agents/docs/BUILD-LUCAS-SDK.md` | AC | SDK build spec (DRAFT) |
| `evryn-team-agents/docs/ARCHITECTURE.md` | AC | System architecture (needs rewrite for SDK) |
| `evryn-team-agents/.claude/agents/*.md` | AC | Subagent definitions (future — Justin reviews each) |
| `evryn-team-agents/.claude/skills/*.md` | AC | Skills for Lucas (future) |
| `evryn-team-agents/modules/*` | AC | Rich context loaded on demand (future) |
| Linear (EVR workspace) | AC | Backlog — small items to not forget |

**Sync responsibility:** When company-level changes happen (team structure, mission, strategy), update the Hub (`_evryn-meta/docs/hub/roadmap.md`) — it's the single source of company truth. `SYSTEM_OVERVIEW.md` is a technical spoke and should stay consistent with the Hub.
