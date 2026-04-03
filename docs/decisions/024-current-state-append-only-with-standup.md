# ADR-024: Current-State Append-Only with Standup Synthesis

**Date:** 2026-04-01
**Status:** Accepted (protocol untested — expect iteration)
**Decision makers:** Justin + AC

## Context

Current-state snapshots (`shared/current-state/`) were being fully rewritten during #lock by whoever happened to be active. This created two problems: (1) agents in the heat of a session would overwrite things they thought were stale but weren't, and (2) the document reflected one agent's perspective rather than a synthesized team picture.

Separately, we designed a "daily brief" protocol for Lucas — but realized it overlapped with current-state updates. The brief was trying to produce the same artifact through a different process.

## Decision

**Current-state is append-only between standups. Only Lucas can rebuild it, and only during #standup.**

Between standups, any team member can append to current-state during #lock — signed and timestamped, never rewriting the synthesized sections. Lucas rebuilds the whole document from scratch during `#standup`, which is the team's consolidation ritual (paralleling personal #consolidate for memory).

**#standup has two modes:**
- **Standard** — Daily course alignment. Everyone loaded in one session. Each team member reports from their perspective. Lucas synthesizes and rebuilds current-state.
- **Deep** — Weekly course adjustment. Each team member spun up as a subagent with isolated context for deep thinking (reflection questions, flywheel thinking). Includes backlog review, done pile appreciation, and priority realignment.

**Current-state structure after synthesis:**
- Runway (always first)
- Top Priorities
- Team member reports (each person, blocked inline and bolded, coming up in their domain)
- Lucas's report (last — cross-domain synthesis, recommendations, wrap-up)

**The daily brief protocol is replaced by #standup.** One trigger, one protocol, one output location.

## Rationale

- Append-only prevents overwrite accidents — the most dangerous moment is when you're deep in work and sure something doesn't matter anymore
- Lucas as sole synthesizer ensures the team picture is cross-domain, not single-perspective
- The standup/consolidation parallel keeps the mental model consistent: personal consolidation for memory, team consolidation for current-state
- Standard/deep modes let Justin choose the investment level — most days a quick alignment, weekly a deeper realignment
- Deep standup subagents prevent context bleed between perspectives

## Consequences

- New `shared/protocols/standup-protocol.md` created
- `daily-brief-template.md` removed (replaced by standup protocol)
- CLAUDE.md updated with #standup reference and append-only rule
- #lock protocol updated with appendage format instructions
- Lucas's agent definition updated with #standup pointer
- Current-state snapshot naming updated to dots + timezone (`2026.04.01T19.03-07.00.md`)
- Deep dive reports stored in `.claude/agent-memory/<name>/deep-dives/`
