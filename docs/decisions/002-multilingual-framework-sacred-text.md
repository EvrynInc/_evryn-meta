# ADR-002: Multilingual Framework Is Sacred Text

**Date:** 2026-02-06
**Status:** Accepted
**Absorbed from:** Session decision 8 (2026-02-06)

## Context

Justin and a previous Claude instance spent a full week crafting a 9-language thinking framework (`2026.02.05 evryn_multilingual_framework.md`). It provides conceptual territory that English cannot access — load-bearing conceptual infrastructure for how Evryn thinks about relationships, trust, and connection.

## Decision

The multilingual framework MUST be preserved verbatim. It cannot be rewritten, paraphrased, summarized, or "smoothed." Every word was chosen with extreme care. It goes to `modules/multilingual-framework.md` in the agent repo, copied exactly from the handoff file.

## Consequences

- Any instance that encounters this file must treat it as read-only
- Future decomposition of Lucas's system instructions must route this file intact — no compression
- This is one of very few artifacts in the system with a "do not touch" mandate
