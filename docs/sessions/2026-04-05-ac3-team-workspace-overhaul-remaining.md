# Session: Team Workspace Overhaul — Remaining Work

**Date:** 2026-04-01 through 2026-04-05
**Participants:** Justin + AC (multi-day session, AC3 designation)
**Status:** Most work complete. Four items remaining.

---

## What this session was

A comprehensive overhaul of `evryn-team-workspace` — how agents remember, coordinate, track tasks, and organize their work. Also cleaned up stale references across all repos, established the _evryn-meta vs team-workspace demarcation, moved research files, and began bringing DC under AC as a subagent.

## What's done (context for the remaining items)

All of this is committed and pushed:

- **Agent memory redesigned** as narrative GPS (ADR-023). Story + Recent Notes, first person, no instructions in the file. Writing guidance lives in #lock protocol, consolidation in #consolidate protocol.
- **Three protocols created:** #lock (expanded), #consolidate (new), #standup (new — standard daily + deep weekly, current-state is append-only between standups, only Lucas rebuilds).
- **Task management:** Linear labels remapped to current team, task authority protocol (ADR-025 — only Justin's tasks are commands), Linear protocol written.
- **Project folder structure:** helm/, product/, ops/, legal/, growth/ — documented in CLAUDE.md.
- **Research migrated** from `_evryn-meta/docs/research/` to `evryn-team-workspace/shared/projects/<dept>/research/`. DC executed, AC verified. All active references updated.
- **Demarcation rule:** _evryn-meta = source of truth + AC ops. Team workspace = active work, research, drafts. Written into both CLAUDE.md files.
- **Legal file split:** Working docs moved to team-workspace `legal/terms-and-privacy/`. Finals stay in `_evryn-meta/docs/legal/`.
- **AC protocols** moved to `docs/protocols/` folder. References updated.
- **Developer agent definition** (`_evryn-meta/.claude/agents/developer.md`) created as verbatim copy of DC CLAUDE.md. NOT YET ADAPTED — see remaining item #1.
- **Agent integration tests** passed: Lucas (#lock, #standup, Linear), Nathan (memory, current-state, file placement), Mira (demarcation, research), Soren (task authority). One gap found and fixed (project subfolder structure wasn't documented).
- **All 8 agent definitions** updated with #standup pointer and #lock reinforcement.
- **Hub, spokes, ARCHITECTURE.md, CHANGELOG, LEARNINGS, AGENT_PATTERNS** all updated.
- **.gitignore** fixed — was blocking `.claude/agents/`, now only blocks `settings.local.json`.
- **Stale SDK references** cleaned across CLAUDE.md, Hub, evryn-team-agents ARCHITECTURE.md.
- **ADRs written:** 023 (memory as GPS), 024 (current-state append-only + standup), 025 (task authority).

## Remaining work

### 1. Adapt developer.md for subagent/teammate use

**File:** `_evryn-meta/.claude/agents/developer.md`
**Status:** Verbatim copy of DC CLAUDE.md is committed. Needs adaptation.
**What to do:**
- Remove: SESSION STARTUP, mailbox protocol section, auto-memory hygiene, autonomous work protocol, #lock protocol reference (DC commits, AC locks)
- Remove: "operating from evryn-dev-workspace" framing (operates wherever AC points it)
- Add: "You are being run by AC as a subagent or teammate" framing
- Change: "commit and push" → "commit, do not push — AC reviews first"
- Change: "Flag things up to Justin AND AC" → "Flag things to AC" (AC is right there)
- Update: research routing (still points to `_evryn-meta/docs/research/` which no longer exists)
- Update: stale references to "Lucas or Alex" → current names
- Keep: everything about identity, build mandate, how to orient, writing discipline, working with Justin, Slack channels

### 2. Agent Teams test

**What:** Try running DC as a Claude Code Agent Teams teammate (not subagent) to test two-way communication. This would let AC and DC talk during a task, unlike subagents which are fire-and-forget.
**Requires:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` env flag. Item #1 must be done first.
**Why it matters:** If this works, the mailbox pattern becomes obsolete and AC can coordinate build work in real time.

### 3. Real standup test

**What:** Go to `evryn-team-workspace` and run `#standup` with the team. This is the first real test of the standup protocol — everything so far has been dry runs and integration tests.
**Note:** This should be done in the team-workspace repo, not from _evryn-meta. Justin drives it.

### 4. DC dev-workspace CLAUDE.md — stale research routing

**File:** `evryn-dev-workspace/CLAUDE.md`, Documentation Approach section (~lines 143-154)
**What:** Research routing still points to `_evryn-meta/docs/research/` (deleted) and `evryn-dev-workspace/docs/research/` (for build methodology). Needs updating to match current routing: strategic → `evryn-team-workspace/shared/projects/product/research/`, growth → `growth/research/`, ops → `ops/research/`, build methodology → stays in dev-workspace if that pattern continues.
**Note:** Lower priority if we're moving DC to be a subagent anyway. But the file is stale and would confuse a standalone DC session.
