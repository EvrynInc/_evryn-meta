# ADR-021: Cowork Replaces SDK Agent Build (For Now)

**Date:** 2026-03-27
**Status:** Accepted
**Decision maker:** Justin

## Context

Evryn's virtual founding team (Lucas + 7 team members) was designed to be built as custom agents using the Claude Agent SDK, with the build spec in `evryn-team-agents/docs/BUILD-LUCAS-SDK.md`. That build was paused while the Evryn product MVP (v0.2) took priority.

Meanwhile, Claude Cowork launched — a multi-agent collaboration feature that handles persona-based conversations, subagent dispatch, and shared context natively, with zero build or maintenance cost.

## Decision

Use Cowork to play the founding team roles instead of building custom SDK agents. The team workspace lives in a new repo (`evryn-team-workspace`) with agent definitions in `.claude/agents/`. `evryn-team-agents` is frozen as insurance — not archived, not deleted.

## Rationale

- Cowork handles ~85% of the team agent functionality (multi-persona conversations, context loading, independent work dispatch) with zero build cost
- Upgrades come free from Anthropic — no maintenance burden
- The actual value is the collision of domain-specific perspectives in real-time conversation, which Cowork provides natively
- Custom SDK build only becomes necessary if true 24/7 autonomy is needed or Cowork proves insufficient
- Keeping `evryn-team-agents` frozen means the SDK build can resume if needed — no bridges burned

## Consequences

- New repo `evryn-team-workspace` created under EvrynInc org
- Agent identity files (`.claude/agents/*.md`) are the single source of agent behavior — verbatim transfers from founding team profiles
- Team coordination (priorities, current-state, decisions, projects) lives in `shared/`
- `evryn-team-agents` stays frozen — references in other docs remain valid, rename deferred until Cowork is proven
- Hub repo table needs updating to include `evryn-team-workspace`
