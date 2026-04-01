# Memory Systems Research

*Last updated: 2026-01-30*

---

## Agent Memory State of the Art

Key papers/systems:
- **Mem0** - Graph + embeddings + LLM extraction. 26% better than baseline.
- **A-MEM** - Zettelkasten-style linked notes. Agent creates knowledge networks.
- **AgeMem** - Memory as tool actions. Agent decides what to store/retrieve/discard.

Industry moving from "dump N messages" → embeddings/RAG → **agentic memory** (agent manages its own memory).

---

## 8 Systems Evaluated

| System | Architecture | LoCoMo F1 | Production Ready? | Our Stack Compatible? |
|--------|-------------|-----------|-------------------|----------------------|
| **SimpleMem** | Semantic compression → multi-view indexing → adaptive retrieval | 43.24% | Early (academic) | Python only; MCP server available |
| **Mem0** | LLM extraction → embeddings, user/session/agent scoping | 34.20% | **Yes** (46k stars, YC S24, npm package) | Yes (npm + REST API) |
| **A-MEM** | Zettelkasten-style linked notes, graph + vector | 32.58% | No (academic) | Python only |
| **AgeMem** | Memory as RL-trained tool actions | N/A | No (paper only) | No |
| **Letta (MemGPT)** | Core blocks (always in context) + archival (searchable) | N/A | **Yes** (37k stars, $10M seed) | REST API, but full framework lock-in |
| **EverMemOS** | Brain-inspired episodic → semantic consolidation | **92.3%** | Moderate (v1.2.0) | Requires Milvus + ES + MongoDB + Redis |
| **MAGMA** | 4 orthogonal graphs (semantic, temporal, causal, entity) | N/A | No (paper only) | No |
| **Cognee** | Knowledge graph + vector, MCP integration | N/A | Moderate (v0.3) | **Yes** — native Claude Agent SDK via MCP |

---

## Recommendation: Build Custom on Supabase + pgvector

**Why not adopt an existing system:**
- Mem0 is production-proven but doesn't give cross-channel time-unification or privacy isolation
- Letta has the best architecture but requires their entire runtime (conflicts with Claude Agent SDK)
- SimpleMem has the best benchmarks but is Python/LanceDB with no multi-tenant story
- EverMemOS has insane benchmarks (92.3%) but needs 4 additional infrastructure services
- Cognee is the most Claude-compatible but is pre-v1.0

**Why custom on Supabase:**
- No new infrastructure (already have Supabase)
- ACID transactions for memory writes
- RLS for privacy isolation (critical for Evryn product)
- pgvector handles sub-50ms queries at 100K+ documents
- TypeScript native via Supabase JS client
- Same tables, same RLS, same tools transfer directly to the product

---

## What to Steal from Each System

*At build time, study these repos for the specific patterns we want to adopt. Don't adopt the systems wholesale — extract the ideas that fit our architecture.*

| System | Key Insight to Adopt |
|--------|---------------------|
| **SimpleMem** | Write-time compression into atomic facts with coreference resolution and absolute timestamps |
| **Letta** | Two-tier always-in-context core blocks + searchable archival. Agent actively edits its own core memory |
| **Anthropic** | File-based simplicity for core memory. Just-in-time retrieval. Context editing for auto-cleanup |
| **A-MEM** | Memory evolution — new facts update existing memories, not just append |
| **EverMemOS** | Consolidation phase — periodic background process that organizes and clusters |

---

## Proposed 4-Layer Architecture

**Status:** NOT YET IMPLEMENTED. Direction agreed at high altitude, details TBD at build time. See EVR-14.

```
LAYER 1: CORE MEMORY (Always in context)
  - Small curated index, NOT a filing cabinet. Think business card.
  - Agent identity, current priorities (3-5 bullets), key relationships
  - Links to deeper context (Layer 3 searches), not inline detail
  - Agent can edit via tool calls, BUT strict size limits enforced
  - Stored: Markdown in Supabase, loaded into system prompt
  - CRITICAL: No growing changelogs, no stale snapshots. If a fact
    can go stale (runway, priorities, dates), it must either be
    dynamically fetched or carry a "current as of [date]" tag with
    hygiene rules for refresh. We already learned this with notes.md bloat.

LAYER 2: WORKING MEMORY (Today's context)
  - Everything from today — the agent's "short-term recall"
  - Includes recent message summaries AND the last several raw messages
    (agents should sharply remember recent volleys, like a person does)
  - Consolidates to long-term when the agent "sleeps" (end of day)
  - Raw logs always preserved in Supabase — working memory is a
    summary ON TOP OF originals, never a replacement
  - Agent can always "check the tape" — go back to raw logs when
    it needs exact wording or lacks confidence in a summary
  - Pruning must fail gracefully — never lose important details in
    the handoff from working to long-term. When in doubt, keep it.
  - Quality bar: atomic facts should be specific and contextual, e.g.
    "Justin flagged Q1 engineering budget overrun ($42K over plan),
    wants Taylor to propose reallocation by Friday. Ties to hiring
    freeze discussion from 1/15." NOT "Justin asked Taylor about budget."

LAYER 3: LONG-TERM MEMORY (Searchable archive)
  - Atomic facts with resolved coreferences + absolute timestamps
  - pgvector embeddings + structured metadata in Supabase
  - Hybrid retrieval: semantic + temporal + entity filter, k=3-5
  - Privacy: RLS scopes all queries by entity_id
  - Evolution: new facts can supersede old facts (A-MEM pattern)
  - This is what makes the agent feel like it "knows you" over months

LAYER 4: CONSOLIDATION (Background process)
  - Multiple "naps" per day, not just one overnight sleep:
    * Before morning briefing (consolidate overnight work)
    * Before evening briefing (consolidate the day)
    * Optionally overnight if agents are running tasks
  - Naps must be PROACTIVE — agent sees working memory growing
    and decides to consolidate, not a dumb cron that fires mid-thought
  - Weekly deep pass: identify patterns, update entity profiles,
    cluster themes (Friday reflection schedule)
  - Detect and resolve contradictions across memories
  - The WAY we do this matters enormously — bad consolidation
    loses nuance, good consolidation creates understanding

CRITICAL ARCHITECTURAL NOTE:
  Agent continuity lives in OUR memory layers, NOT in the SDK's
  context window. Each task is a discrete, short-lived SDK session:
  wake up → load context from memory layers → do the task → write
  results back to memory → shut down. LangGraph is the persistent
  "brain" that decides what to do next. SDK sessions are individual
  "thoughts" — short, focused, disposable. This prevents involuntary
  context compaction from the SDK, which we cannot control.
```

**Key insight:** Time is the unifier, not channel. If Justin discusses budget across email, Slack, and voice in 5 minutes, that's ONE conversation.

**Session boundary:** Working memory resets at midnight local time. Consolidation naps happen multiple times per day (before briefings, overnight if active). Agents should be proactive about consolidating — they see their working memory growing and choose to nap, rather than being forced by a timer or by hitting context limits.

---

## Implementation Phases

**Phase 1 — Foundation (~3-5 build sessions):**
- Supabase schema: `memory_facts` table with pgvector column, core memory table
- Write-time compression: extract atomic facts via Haiku prompt
- Core memory blocks as agent-editable Markdown in DB (with size limits + hygiene rules)
- 3 tools: `memory_store`, `memory_search`, `memory_update_profile`
- Basic end-of-day consolidation (scheduled, simple summary)
- Wire into orchestration layer (memory context in → results out per task)

**Phase 2 — Proving ground (~2-4 weeks of iteration, runs alongside normal agent use):**
- Hybrid retrieval (semantic + BM25 + temporal)
- Memory evolution (new facts supersede old, A-MEM pattern)
- Proactive consolidation (agent-initiated naps before briefings, not just cron)
- Cross-agent memory sharing with scoping
- Tuning: how much context to load, fact quality thresholds, retrieval accuracy
- This phase is iterative — we ship Phase 1, observe how agents use it, and refine

**Phase 3 — Product port (~1-2 weeks once Phase 2 is dialed in):**
The memory system design transfers directly to Evryn — same Supabase, same
pgvector, same 4-layer model. The porting work is adding the scale/trust layer:
- RLS policies scoped per user (so User A's memories never leak to User B)
- Prompt caching at scale (90% cost reduction on repeated per-user context)
- Multi-channel normalization (email + web + voice unified by time)
- Audit trail for compliance (cold transcript layer — verbatim history, never loaded into context, always searchable)
- Aggregation layer for cross-user insights (anonymized, feeds Evryn's matching intelligence)
- The core memory/working/long-term/consolidation logic stays the same — it was
  designed for this transfer. What changes is isolation, concurrency, and compliance.

---

## Watch List

- **EverMemOS** — If 92.3% LoCoMo holds up and they add Postgres backend, reconsider
- **Cognee** — When it hits v1.0, could replace custom memory_search via MCP
- **Anthropic workshop (Jan 29, 2026)** — "Multi-layered memory architectures for Claude on Vertex AI." Justin has the video. Process for key findings when we start memory implementation.
- **Anthropic multi-agent article (Jan 30, 2026)** — Validates our memory approach. Their production system uses "long-horizon conversation management": spawn fresh subagents with clean contexts, summarize completed phases, hand off via persistent state. Exactly our Phase 2 design (short SDK sessions, continuity in memory layers). Also: token usage explains 80% of performance variance — memory retrieval quality directly impacts agent effectiveness. Source: https://www.anthropic.com/engineering/multi-agent-research-system

---

## Sources

- [SimpleMem GitHub](https://github.com/aiming-lab/SimpleMem) | [Paper](https://arxiv.org/abs/2601.02553)
- [Mem0 GitHub](https://github.com/mem0ai/mem0)
- [A-MEM Paper](https://arxiv.org/abs/2502.12110)
- [Letta/MemGPT GitHub](https://github.com/letta-ai/letta)
- [EverMemOS GitHub](https://github.com/EverMind-AI/EverMemOS)
- [MAGMA Paper](https://arxiv.org/abs/2601.03236)
- [Cognee — Claude SDK Integration](https://www.cognee.ai/blog/integrations/claude-agent-sdk-persistent-memory-with-cognee-integration)
