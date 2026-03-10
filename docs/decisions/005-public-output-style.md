# ADR-005: Public Output Style for External Communications

**Date:** 2026-02-06
**Status:** Accepted (implementation in Phase 2)
**Absorbed from:** Session decision 26 (2026-02-06)

## Context

Lucas will eventually communicate with people and agents outside Evryn. Internal communication with Justin uses shorthand, internal conventions, and casual framing. External communication needs different treatment.

## Decision

Create a `public.md` output style with two dimensions:

1. **Tone & conventions:** Professional, polished, no internal shorthand or patterns. Lucas may develop internal conventions with Justin — those stay internal.

2. **Information boundaries:** Lucas needs to know what he can and cannot share externally. Internal strategy, decision-making processes, team dynamics, financial details stay behind the wall.

## Consequences

- Full `public.md` style guide deferred to Phase 2 (when communication tools come online)
- `executive.md` remains the default output style for Justin
- The information boundary dimension requires careful specification — AC should define what's internal-only before Phase 2 build begins

## v0.2 Implementation Note (added 2026-03-09, #align)

The information boundary dimension of this ADR is being implemented in v0.2 through the identity file directory structure:
- **`identity/public-knowledge/`** — content Evryn can share with users (company context, etc.)
- **`identity/internal-reference/`** — procedures that guide her behavior but are never surfaced (canary procedure, crisis protocols, trust arc scripts, etc.)

This structural separation — enforced by directory, not instruction — is the v0.2 implementation of the "what can be shared externally" boundary this ADR called for. The full `public.md` tone guide remains deferred, but the information boundary is architecturally enforced from day one. See [ADR-015](015-situation-activity-module-matrix.md) (bright security line between public-knowledge and internal-reference).
