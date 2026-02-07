# Session Decisions — 2026-02-06

Decisions made during the AC/Justin session that produced the Lucas SDK build spec. These need to be absorbed into DECISIONS.md (fresh start) and persistent docs during #lock.

---

## Major Architectural Decisions

### 1. Drop LangGraph, adopt Claude Agent SDK as sole runtime
- LangGraph's 5-node graph (TRIGGER → INTAKE → ROUTER → AGENT → OUTPUT) is fully replaced
- Claude Agent SDK's `query()` replaces both LangGraph orchestration AND the raw Anthropic SDK execution layer
- Reason: The infrastructure was dictating agent behavior. We need an intelligence that wakes up and decides, not a pipeline that executes blindly.

### 2. One agent (Lucas), not eight
- Lucas Everhart is the single Chief of Staff agent
- Old team members (Alex, Taylor, Dana, Jordan, Nathan, Dominic, Thea) become perspective lenses
- Perspectives are spawned as ephemeral subagents via SDK Task tool
- Thea's EA functions are absorbed into Lucas's always-on EA discipline
- "The old team is a team we once worked with. Lucas and Justin still have their perspectives within us."

### 3. Alex is a subagent, not a skill
- Engineering needs its own independent advocate in deliberation
- Lucas should not play conductor AND instruments simultaneously
- BUT: Lucas may ALSO hold an Architect skill for direct CTO-level thinking when he doesn't need an independent voice
- Subagents are one level deep (SDK limitation). "Alex manages 5 devs" = Lucas spawns 5 dev subagents directly, with Alex's perspective guiding.

### 4. Slack primary, email for external only
- Internal communication moves to Slack
- Email remains for external correspondence
- Gmail: pub/sub for push notifications (primary), 10-minute poll fallback

### 5. Simple cron + supervisor for reliability
- No complex trigger infrastructure
- Cron jobs wake Lucas at scheduled times
- Supervisor script: timeout → retry once → Twilio text to Justin
- Canary pattern for crash detection

### 6. Build phases
- Phase 1: Lucas core (wake, think, act — no communication yet)
- Phase 2: Communication (Slack + Gmail)
- Phase 3: Alex module (CTO perspective + Claude Code integration)
- Phase 4: Remaining perspectives (after Justin reviews and rebuilds each)

### 7. Team perspectives need review before baking in
- All profiles were built ~1 year ago. Evryn has evolved significantly.
- Jordan needs a complete rebuild (too conventional for trust-based network model)
- All perspectives need Justin's review and sign-off before becoming .claude/agents/ files
- "Once you build around a scaffolding, sometimes it can be hard to change the undergirding."

### 8. Multilingual framework is sacred text
- The 9-language thinking framework (2026.02.05 evryn_multilingual_framework.md) MUST be preserved verbatim
- Cannot be rewritten, paraphrased, or smoothed
- Load-bearing conceptual infrastructure for Evryn
- Provides conceptual territory English cannot access

### 9. DECISIONS.md fresh start
- Start a new DECISIONS.md for the SDK era
- Reference the old doc (in archive) for historical context
- Prevents fresh instances from being dragged through obsolete LangGraph decisions

### 10. Archive = REMOVE from repo
- Don't just move to archive folder — remove entirely
- Justin keeps files at hand if needed
- Prevents any future instance from accidentally reading old context and getting confused

---

## SDK Findings (Key Takeaways)

### What the SDK provides natively
- `query()` — core agent loop with streaming
- Built-in tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
- Subagents via Task tool (one level deep, parallel spawning)
- Skills (markdown files loaded on demand)
- Slash commands (custom shortcuts)
- Output styles (audience-specific formatting)
- Hooks (PreToolUse, PostToolUse, SessionStart, etc.)
- MCP integration (Slack, Gmail, Supabase, etc.)
- Session persistence and forking
- Memory tool (file-based, persists across sessions)
- Context compaction (automatic token management)
- Programmatic Tool Calling (85% token reduction for batch operations)
- Multi-provider support (Bedrock, Vertex AI, Azure)

### What we build around the SDK
- Cron scheduling (bash/Task Scheduler)
- Supervisor reliability (timeout, retry, Twilio alert)
- Supabase integration (budget tracking, message history)
- Memory file structure (state, learnings, workstreams)
- Custom MCP server configs

### Key cookbook reference
- "Chief of Staff Agent" cookbook — almost identical architecture to what we're building
- Memory & Context Management cookbook — persistent memory patterns for cron-triggered agents
- Context Compaction cookbook — token management for long sessions
- PTC cookbook — efficient batch data processing

---

## Handoff Artifacts (What Must Be Preserved)

These files from the `2026.02.06 Handoff/` folder are source material for the build:

1. `2026.02.05 evryn_multilingual_framework.md` — VERBATIM. Sacred text. Goes to `modules/multilingual-framework.md`
2. `2026.02.06 Lucas_System_Instructions - 2.33pm.md` — Source for CLAUDE.md extraction. Rich content, needs lean distillation for always-loaded context.
3. `2026.02.06 Evryn Virtual Founding Team Profiles.md` — Source for subagent configs. Needs Justin's review before building.
4. `2026.02.06 Working_Session_Tracker.md` — Open items: languages framework integration, team perspective modules, various architecture questions.

### In-progress work from the tracker
- Team perspective modules (Alex started, 5 more to go) — each needs "is this exactly the right person for Evryn?" review
- Languages framework — full version needs integration into Modules doc
- Jordan rebuild — current profile too conventional for Evryn's trust-based model
- Placeholder name renaming — Alex, Dana, Taylor, Jordan names to be reconsidered for intentional quality

---

## Additional Decisions from Justin's Review (Mid-Session)

### 11. Thea becomes a Skill, not a subagent
- EA operational discipline doesn't have unique domain perspectives
- Thea's functions (tracking commitments, following up, preventing drops) are Skills Lucas employs
- If things start dropping, reconsider making Thea a subagent with independent voice
- Start simple

### 12. Lucas prompt decomposition is AC work, not DC
- Breaking the carefully crafted Lucas system instructions into CLAUDE.md / skills / subagents / modules is architectural content work
- DC should not make these decisions — risk of "over-concisioning" into uselessness
- AC must do this decomposition before the build doc is ready for DC

### 13. Supabase is Phase 1, not Phase 2
- Budget tracking needs the database from day one
- MCP server for Supabase should be configured in Phase 1

### 14. Alert on failure: Twilio AND Slack
- Second failure alerts Justin via BOTH text message AND Slack notification
- Single channel isn't reliable enough

### 15. Cron times are delivery DEADLINES, not start times
- Morning briefing must ARRIVE by 6am PT. Cron starts earlier.
- Same for all other scheduled briefings

### 16. No scheduled email polling cron
- Don't wake Lucas every 10 minutes to check email
- Gmail pub/sub pushes wake him on email arrival
- 10-minute poll ONLY catches missed pub/sub deliveries
- Between triggers, let Lucas sleep

### 17. CLAUDE.md ownership needs resolution
- evryn-team-agents/CLAUDE.md currently = DC's build context
- Lucas also needs a CLAUDE.md for SDK system context
- These cannot be the same file — different audiences, different purposes
- AC must decide: subdirectory? .claude/CLAUDE.md? rename DC's file?

### 18. Opus upgrade criteria expanded
- Not just "hard problems" — also "nuanced or multilingual thinking"
- Multilingual framework is core to Evryn; needs Opus-tier reasoning

### 19. Permission model needs explicit discussion
- bypassPermissions may be right for Phase 1 (just memory files)
- Needs reassessment when communication tools arrive in Phase 2
- Two layers: SDK permissions (tool-level) vs. instructional autonomy (action-level)

### 20. Dashboarding architecture needed
- Lucas should dashboard whenever possible (visual state, metrics)
- Needs Supabase feeds (write data) + hooks (capture actions)
- Current dashboard at evryn-dashboard.vercel.app
- Stub architecture in Phase 1 so we don't paint ourselves into a corner

### 21. Claude Code integration model
- SDK subagents with Write/Edit/Bash ARE coding agents (for automated tasks)
- Interactive human-directed dev sessions remain separate CC instances (AC/DC pattern)
- Lucas is a third thing: autonomous operations
- Phase 3: start Alex with read-only tools, add write tools after permission model is solid

### 22. CLAUDE.md resolution: Lucas gets his own repo
- DC should work from a separate home repo (e.g., `evryn-dev-workspace` or subdirectory of `_evryn-meta`)
- `evryn-team-agents` CLAUDE.md becomes Lucas's system context
- DC accesses Lucas's repo files for building but has its own build-context CLAUDE.md
- This future-proofs for when AC/DC is replaced by Lucas/Alex

### 23. AC/DC is explicitly temporary
- The manual relay pattern between Architect Claude and Developer Claude is slow and difficult
- Goal: replace with Lucas/Alex (Lucas as autonomous operator, Alex as his CTO subagent)
- Keep AC/DC only until Lucas is capable enough to replace it

### 24. Budget tracking: SDK-first, not Supabase-first
- Don't assume Supabase is needed for budget tracking — the SDK or Anthropic API may already provide cost/token tracking
- Build custom tracking only for gaps, not from scratch

### 25. Linear as dashboarding
- Linear ticket state, backlog health, and workstream progress are a form of dashboarding
- Lucas should have read/write access to Linear (MCP or API)

### 26. Public output style: tone + information boundaries
- `public.md` output style for communications to anyone outside Evryn (humans or agents)
- Two dimensions: (1) professional tone, no internal shorthand/conventions; (2) information boundaries — what can and cannot be shared externally
- Phase 2 implementation (when communication tools come online)

---

## Open Questions

1. Where should persistent state notes live? (Local files via memory tool? Supabase? Both?)
2. Can CASDK subagents run at different model tiers dynamically? (Believed yes — verify)
3. Slack integration setup: MCP server, bot/app configuration
4. Gmail pub/sub: current state, cutover plan from polling
5. Windows scheduling: Task Scheduler vs. WSL cron vs. node-cron
6. Memory tool beta flags: still required or graduated?
7. Session persistence vs. memory-file persistence for cross-cron continuity
8. Budget tracking: existing Supabase tables vs. hook-based tracking

---

*This document is disposable — absorb into persistent docs during #lock, then delete.*
