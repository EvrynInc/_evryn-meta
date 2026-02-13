# ADR-001: LangGraph → Claude Agent SDK with Single-Agent Architecture

**Date:** 2026-02-06
**Status:** Accepted
**Absorbed from:** Session decisions 1, 2, 3, 11 (2026-02-06)

## Context

The previous system had 8 separate persistent agents orchestrated by LangGraph (5-node graph: TRIGGER → INTAKE → ROUTER → AGENT → OUTPUT). The problem: the infrastructure dictated what agents did and when. Agents executed blindly rather than intelligently assessing context and choosing their own actions. We had a bureaucracy when we needed a smart person.

Additionally, the LangGraph dependency added complexity, opacity, and debugging pain — exactly the kind of framework overhead we'd identified as problematic in earlier decisions (see ADR-006).

## Decision

1. **Drop LangGraph entirely.** Claude Agent SDK's `query()` replaces both LangGraph orchestration AND the raw Anthropic SDK execution layer.

2. **One agent (Lucas Everhart, Chief of Staff), not eight.** Old team members (Alex, Taylor, Dana, Jordan, Nathan, Dominic, Thea) become perspective lenses — ephemeral subagents spawned via SDK Task tool.

3. **Alex is a subagent, not just a skill.** Engineering needs its own independent advocate in deliberation. Lucas should not play conductor AND instruments simultaneously. But Lucas may also hold an Architect skill for direct CTO-level thinking when he doesn't need an independent voice.

4. **Thea becomes a Skill, not a subagent.** EA operational discipline doesn't have unique domain perspectives. Thea's functions (tracking commitments, following up, preventing drops) are skills Lucas employs. If things start dropping, reconsider making Thea a subagent with independent voice. *(Reversed 2026-02-10 — Thea is now a subagent. Resource allocation: don't burn Lucas's full context on EA work. Lucas carries the discipline, Thea does the work. See BUILD-LUCAS-SDK.md.)*

5. **Subagents are one level deep** (SDK limitation). "Alex manages 5 devs" = Lucas spawns 5 dev subagents directly, with Alex's perspective guiding.

## Consequences

- All LangGraph code to be archived and removed from repo (see `docs/archive-removal-plan.md`)
- Build spec created at `evryn-team-agents/docs/BUILD-LUCAS-SDK.md`
- Team profiles need Justin's review before becoming subagent files — profiles were built ~1 year ago and Evryn has evolved significantly
- Jordan needs a complete rebuild (too conventional for trust-based network model)
