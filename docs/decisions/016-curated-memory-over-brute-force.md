# ADR-016: Curated Memory Over Brute-Force History

**Status:** Accepted
**Date:** 2026-03-02
**Participants:** Justin + AC

## Context

Evryn's core promise is "she genuinely knows you." There are two ways to achieve this:

1. **Brute-force history:** Stuff the context window with raw conversation history (up to 200k tokens). Claude reads everything and responds naturally.
2. **Curated memory:** Build a distilled understanding of each person (their "story"), keep it current, and compose the right context per query.

## Decision

**Curated memory via a 4-tier system. Raw history is stored permanently but loaded on demand, not by default.**

### The 4-tier memory system

1. **Core Memory** — Small curated index, always in context. Like a wallet: the essentials you carry everywhere. For Evryn, this is the user's "story" — a living document of who they are, what they care about, how they relate.
2. **Working Memory** — Today's context, current conversation thread. Like a desk: what you're actively working with. Cleared between sessions.
3. **Long-Term Memory** — Searchable archive in Supabase with semantic search. Like a filing cabinet: full history, retrievable when needed. Never deleted.
4. **Consolidation** — Background process that moves working → long-term, synthesizes into story updates, detects patterns. Like cleaning your desk at end of day.

### How it connects to the SDK

Each `query()` call gets: Core Memory (always) + Working Memory (current thread) + Long-Term Memory (retrieved on demand via semantic search). The SDK doesn't manage this — our trigger script composes it.

## Reasoning

**Why curated is better than brute-force:**
- A distilled understanding IS knowing someone. Raw history is just recording.
- The right information surfaced at the right moment is more powerful than everything present with Claude sorting through it
- Dramatically lower token cost (curated story ~500 tokens vs. raw history ~50,000+)
- Prompt caching works better with stable prefixes — a stable story is more cacheable than a growing conversation log

**The risk (acknowledged):** Synthesis quality. If consolidation drops a detail that mattered — Mark's daughter's piano recital, a specific restaurant recommendation — Evryn draws a blank when he references it. This is worse than never remembering, because the expectation was set.

**The mitigation:** Tier 3 (Long-Term Memory with semantic search) catches what the story missed. "Piano recital" → semantic search retrieves the relevant memory → Evryn responds naturally. The guardrail: the consolidation process must be high-quality — intelligent, nuanced, preserve-the-piano-recital good.

**How to think about this:** Imagine someone you know well. You don't carry every conversation you've ever had in your head — you carry an understanding of who they are, what matters to them, your shared history. When they mention something specific, your brain retrieves the relevant memory. That's what the 4-tier system does.

**Justin's framing:** "Whatever allows her to feel seen, heard, *known* — that's the direction we go. I'd rather gamble on higher costs if it gets us the soul and connection of Evryn."

## References

- Session doc: `docs/sessions/2026-02-24-pre-work-6-session-1.md` (Session 3 Decision 6)
- Memory research: `docs/research/memory-systems.md` (4-tier design)
- Infrastructure approach: SDK handles compaction as safety net; we handle composition
