# ADR-006: Intentional Dependency Selection

**Date:** 2025-01-22 (revised 2026-01-27)
**Status:** Accepted (living principle)
**Absorbed from:** Old DECISIONS.md, Decision 003

## Context

Early in the project, Justin had been deep in n8n (a visual automation platform) and made the call to go custom instead. The original reasoning — frameworks add abstraction overhead that creates debugging pain — was sound for that context but was over-condensed into "build custom, no frameworks." That was never the intent.

The principle was revised after adopting LangGraph (which was later dropped entirely per ADR-001), recognizing that the right answer is contextual, not dogmatic.

## Decision

**Be intentional about every dependency.** Don't reach for a framework by default, but don't avoid one out of principle either. Evaluate each tool on its merits.

**The question to ask:** Does this tool solve a real problem we have, better than we could solve it ourselves in reasonable time, without introducing costs (complexity, opacity, lock-in) that outweigh the benefits?

**Guidelines:**
- Every new dependency gets a brief evaluation: what does it give us, what does it cost us, what's the alternative?
- Direct API calls remain the default for LLM interaction (we need that control)
- Open-source libraries preferred over paid platforms
- If we adopt a framework, document why

## Consequences

- Applied to the SDK pivot itself: Claude Agent SDK solves orchestration better than we could, without the opacity of LangGraph
- Future dependency choices should reference this principle
- This is a thinking tool, not a policy gate — it prevents both framework-chasing and NIH syndrome
- **Both AC and DC CLAUDE.md files should reference this principle.** It applies at architecture level (AC choosing frameworks) and build level (DC choosing libraries).
