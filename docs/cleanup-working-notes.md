# Cleanup Working Notes — 2026-02-12

**How to use this file:** AC's working doc for the memory/doc cleanup batch. Pick up where the previous instance left off. Delete when done.

*Written: 2026-02-12*

---

## What's Done

- Hub built (`docs/roadmap.md`)
- MPR + MP v2.3 moved to historical/ with frozen headers
- CLAUDE.md updated: Hub pointer, reference-cleanup principle
- current-state.md refreshed
- session-notes-2026-02-12.md absorbed and deleted
- All stale references fixed across repos

## What's In Progress

### CLAUDE.md Edits (3 additions from MEMORY.md)

1. **"Who You Are" section:** Add that AC/DC is permanent infrastructure (ADR-004). One sentence after line 17.
2. **"Communication Rules" section:** Add "prefer full file writes" and "commit and push before follow-up edits" after line 90.
3. **"AC/DC Communication Protocol" section:** Add "build docs are DC's self-contained source of truth" principle. Justin corrected: this goes in the AC/DC section, NOT "When You Hand Off Build Work."

### Lock Protocol Edit

Add CHANGELOG.md to the `docs/lock-protocol.md` checklist (it's in CLAUDE.md's routing table but not the lock checklist).

### CHANGELOG.md

Write an entry for Hub-and-Spoke architecture decision (2026-02-12). Check if CHANGELOG.md exists first.

### BUILD-EVRYN-MVP.md — Sources to Absorb

Add a "Sources to Absorb" section to `evryn-backend/docs/BUILD-EVRYN-MVP.md` with this checklist:
- v0.1 system prompt decomposition: script-as-skill approach, onboarding flow, "Dream with me" pattern, Smart Curiosity layer. Files: `_evryn-meta/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/`
- Prototype schema analysis: `evryn-backend/docs/prototype-schema-analysis.md`
- Session 1 handoff: `evryn-backend/docs/session-handoff-2026-02-11.md`
- Hub architectural insights: trust is a story, dual-track processing, security firewall, script-as-skill
- Build-specific details from current conversation:
  - evryn@evryn.ai has her own Google account (NOT an alias on agents@)
  - Approval gate via EMAIL not Slack (Justin catches formatting issues)
  - Haiku for quick acks, Sonnet for standard work, Opus for edge cases
  - Cast-offs deferred to Phase 2 — Gmail is the capture mechanism
  - n8n prototype has prior art (deterministic logic, Supabase tables)
  - Polling is fine for email (no need for pub/sub)
  - Classification scoring IS in MVP (gold/pass/edge case with confidence)
  - Dashboard: add Evryn to existing agent dashboard

### MEMORY.md Cleanup

**Keep (operational/behavioral):**
- "Memory notes without context are dangerous"
- "Justin's correction patterns"
- "AC/DC is permanent infrastructure" — MOVE to CLAUDE.md, then remove from memory
- "Don't clean code without full context"
- Tool connections note (all CLI, no MCP)
- VS Code/GitLens note

**Remove (stale/completed/moved elsewhere):**
- "AC session-start check" — already in CLAUDE.md
- "Full file writes" + "commit before edits" — moving to CLAUDE.md
- "Thea is a SUBAGENT" — already correct in Hub and all docs
- Hub-and-Spoke section (lines 18-28) — Hub exists, CLAUDE.md points to it
- Key Architectural Insights (lines 30-38) — all in Hub
- Strategic Pivot section (lines 40-61) — in current-state.md and Hub. BUT: move build details (lines 53-61) to BUILD-EVRYN-MVP.md FIRST
- MPR section (lines 63-73) — done, frozen
- Multi-Repo Sweep (lines 75-83) — done
- Build naming convention (line 16) — already in Hub

### company-context.md Retirement

1. Read `evryn-team-agents/modules/company-context.md` line by line against Hub
2. Pull "Why Now" framing into Hub (brief, ~3-4 lines in "What Evryn Is" or new section)
3. Verify nothing else unique
4. Delete file, fix all references (grep for `company-context`)
5. Update Hub spokes list (remove company-context pointer)

### SYSTEM_OVERVIEW.md Tightening

Strip sections that duplicate the Hub:
- "What is Evryn?" → remove (in Hub)
- "Core Philosophy" → remove (in Hub)
- "Current Priorities" → remove (in Hub "Current Strategy")
- "The Evryn Brains" → remove (in Hub "Technical Architecture")
- "Key Contacts" → remove (in Hub "Team")
- "Repositories" table → remove (in Hub)
- "Open Questions" → remove (all resolved)

Keep (unique detail):
- System Architecture diagram (ASCII)
- Components Explained (detailed per-repo info)
- Data Flow diagram
- External Services table
- Supabase table details
- Revision History

Add header: "For company-level truth, see the Hub (`docs/roadmap.md`). This doc is a technical reference spoke with detailed component and infrastructure information."

### ADR-001 Thea Note

Add inline note to line 21 of `_evryn-meta/docs/decisions/001-sdk-single-agent-architecture.md`: "*(Reversed — Thea is now a subagent. See BUILD-LUCAS-SDK.md.)*"
