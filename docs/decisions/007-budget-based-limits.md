# ADR-007: Budget-Based Limits, Not Activity Limits

**Date:** 2025-01-22
**Status:** Accepted (living principle)
**Absorbed from:** Old DECISIONS.md, Decision 006

## Context

We needed to prevent runaway agent costs without being too restrictive. The question was whether to limit by number of messages (volleys), API calls, or by actual cost.

## Decision

Money is the constraint, so make money the limit. Use tiered thresholds (alert, then halt) rather than hard caps on activity counts.

| Level | Action |
|-------|--------|
| Alert threshold | Notify Justin, agent continues |
| Halt threshold | Notify Justin, agent pauses until override |

**Why not activity limits:**
- Volley limits can be gamed (stuff more into each message)
- Volley limits punish productive long conversations
- Budget limits are self-regulating and tied to actual risk
- Agents watching their own spend naturally become efficient

## Consequences

- Budget tracking is a Phase 1 requirement in the SDK build (first check what SDK/API provides natively before building custom)
- Specific dollar thresholds are configurable and will be tuned during testing
- This principle applies to both the single-agent (Lucas) architecture and any future multi-agent patterns
- "Measure what matters, not proxies that get gamed"
