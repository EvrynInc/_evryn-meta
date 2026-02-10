# ADR-004: Lucas Owns evryn-team-agents; AC/DC Becomes Fallback

**Date:** 2026-02-06
**Status:** Accepted
**Absorbed from:** Session decisions 17, 22, 23 (2026-02-06)

## Context

Two conflicts needed resolution:

1. **CLAUDE.md ownership:** `evryn-team-agents/CLAUDE.md` served as DC's build context, but the SDK also uses CLAUDE.md as Lucas's always-loaded system context. These are different things with different audiences.

2. **AC/DC role evolution:** The manual relay pattern between Architect Claude (in `_evryn-meta`) and Developer Claude (in repos) works but is slow and difficult. Justin relays messages between instances by hand. Once Lucas/Alex is running, they should handle most of what AC/DC does now.

## Decision

1. **Lucas gets `evryn-team-agents`.** The repo's CLAUDE.md becomes Lucas's system context. DC gets a separate home repo (e.g., `evryn-dev-workspace`). DC can read/write files in Lucas's repo for building, but DC's own system context comes from its home repo.

2. **AC/DC becomes the fallback, not the primary.** Once Lucas/Alex is running, they handle day-to-day operations and builds. But AC/DC stays permanently — it's Justin's manual-mode escape hatch for when Lucas/Alex is malfunctioning, down, or when Justin needs direct architectural control. The mailbox pattern (`ac-to-dc.md` / `dc-to-ac.md`) persists as infrastructure.

## Consequences

- Need to create DC's home repo before executing archive removal plan
- DC's CLAUDE.md must be migrated before Lucas's CLAUDE.md is written
- AC (in `_evryn-meta`) remains as Justin's direct interface for architecture permanently
- AC/DC protocol docs stay maintained even after Lucas is running
