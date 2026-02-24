# Orchestration Frameworks Research

*Last updated: 2026-01-30*

---

## Context

Our `invoke_agent` architecture has a timing flaw — response commits before actions run, so Thea can't synthesize Taylor/Alex responses into her reply. We evaluated frameworks and designed a replacement architecture.

---

## Framework Comparison

| Framework | Best For | Cost | Our Verdict |
|-----------|----------|------|-------------|
| **LangGraph** | Complex stateful workflows, synchronous agent invocation | Free (open source), LangSmith optional | **CHOSEN** — solves timing problem, enables event-driven architecture |
| **CrewAI** | Role-based teams, simpler workflows | Free (open source) | Good but less control over orchestration |
| **AutoGen** | Conversation-based, human-in-loop | Free (Microsoft open source) | No built-in persistent memory |

These are open-source libraries we import, not platforms we pay for.

**LangChain vs LangGraph:** LangChain is a general LLM toolkit (prompt templates, document loaders, output parsers). LangGraph is a workflow/agent orchestration engine built by the same team, specifically for stateful multi-step agent workflows. We use LangGraph for orchestration and pull in LangChain utilities (like the Anthropic integration) where useful.

---

## Why LangGraph

- Synchronous `.invoke()` — one agent calls another and waits for response
- State flows through graph — Thea can get Taylor/Alex responses before generating her reply
- Built-in checkpointing (graph state saved after every step — survives crashes)
- Subgraph support (a single task can be a multi-step, multi-model workflow)
- TypeScript support via LangGraph.js
- ~2 years old, battle-tested (Klarna, Uber, LinkedIn, Replit)

---

## LangGraph + Claude Agent SDK (Hybrid Architecture)

**Decision: MADE.** These are complementary layers:
- **LangGraph** = orchestration (routing, state, graphs, conditionals, checkpointing)
- **Claude Agent SDK** = execution (agent loop, tool calling, context management, session persistence)

LangGraph is the persistent "brain" that manages workflows and never drops a ball. Agent SDK sessions are short-lived "thoughts" — wake up, do a task, shut down. See [claude-agent-sdk.md](claude-agent-sdk.md) for SDK details.

---

## Graph Architecture

*Summary in `docs/ARCHITECTURE.md` under "Target Architecture: Event-Driven Graph". Full detail below.*

### Overview

Event-driven architecture. Agents sleep between tasks. Four triggers wake them:
1. **Message arrives** (any source — email today, Slack/voice later)
2. **Scheduled task fires** (briefings, reflections, consolidation)
3. **Task queue has work** (unfinished tasks need attention)
4. **Agent-to-agent call** (from within the graph, synchronous)

### The Graph

```
TRIGGER → INTAKE → ROUTER → AGENT → OUTPUT
                     ↑         |
                     +----←----+
                   (agent invokes agent)
```

### Node Details

**TRIGGER (entry points — not a graph node, these are how work enters)**
- Gmail push notification (or fallback poll every 5-10 min for missed messages)
- Scheduler fires (pg_cron: briefings, reflections, consolidation naps)
  These are queued as high-priority tasks, not forced mid-thought.
  Agent finishes current task, then picks up the reflection/briefing.
- Task queue poll (agent has unfinished work)
- Internal: agent-to-agent invocation loops back through ROUTER

**INTAKE (zero LLM tokens — pure code)**
- Write message to task queue (task queue is source of truth, not inbox)
- Archive message from inbox
- Normalize format: any source → common shape with metadata preserved
  `{ source: "email", from: "justin@evryn.ai", channel_id: "thread-abc", timestamp, body, raw }`
- Message-source agnostic: the graph doesn't care where it came from,
  but metadata is preserved so the agent knows and responds appropriately
- Fallback safety: poll checks for unread+unarchived messages that slipped
  through push, captures them to queue, archives. Bulletproof intake.

**ROUTER (Haiku LLM call — cheap, fast)**
- Spam filter: Haiku classifies — spam gets archived, not processed
- Which agent handles this?
- What priority? (urgent interrupts, normal queues)
- Pre-fetch memory context from Layers 1-3 for the target agent
- Model selection: Haiku for acknowledgments, Sonnet for standard work,
  Opus for deep strategic thinking
- Single agent or multi-step? Router can dispatch a subgraph if the task
  needs multiple models or multiple agents working in sequence

**AGENT (Claude Agent SDK session — this is where thinking happens)**
- Short-lived: load context → think → act → write results to memory → done
- Each SDK session is disposable — agent continuity lives in our memory
  layers, not in the SDK's context window (prevents involuntary compaction)
- Tools available via MCP (plug-in interface, add tools without changing graph):
  send_email, update_task, invoke_agent, memory tools, calendar, Linear,
  web search, role-specific tools — fill in over time
- invoke_agent loops back to ROUTER synchronously (LangGraph waits for
  the called agent to complete — this fixes the timing bug)
- Subgraph support: a single task can be a multi-model workflow:
  e.g., Haiku pulls data → Opus analyzes → Sonnet drafts response
  LangGraph orchestrates the sequence, each step is its own SDK session

**OUTPUT (zero LLM tokens — pure code)**
- Agent returns structured actions, OUTPUT executes them mechanically:
  ```json
  {
    "actions": [
      { "type": "send_email", "to": "...", "subject": "...", "body": "..." },
      { "type": "update_task", "id": "task-123", "status": "done" },
      { "type": "memory_store", "facts": [...] },
      { "type": "invoke_agent", "target": "taylor", "message": "..." }
    ]
  }
  ```
- Send emails (Gmail API)
- Update task queue (mark done, create new tasks)
- Write to Supabase (logs, spend tracking, memory facts)
- Trigger consolidation if working memory is getting large — but after
  consolidation, the last several raw messages/thoughts stay un-consolidated
  (like how you can summarize your morning but remember the last 20 min in detail)
- invoke_agent actions loop back through ROUTER (synchronous)

### State Schema (flows through graph)

```typescript
interface GraphState {
  agent_id: string;              // Who's handling this
  task: Task;                    // What needs doing
  memory_context: {              // Pre-fetched by ROUTER
    core: string;                // Layer 1: agent identity, priorities
    working: WorkingMemory;      // Layer 2: today's context
    retrieved: Fact[];           // Layer 3: relevant long-term facts
  };
  actions: Action[];             // What the agent decided to do
  cost: { tokens: number; usd: number; }; // Running spend
  source: MessageSource;         // Where the trigger came from
}
```

### LangGraph Guarantees

- **No dropped balls:** Graph state is checkpointed after every node.
  If the process crashes, LangGraph resumes from the last checkpoint.
  Tasks don't die silently.
- **Synchronous agent-to-agent with timeout/retry/escalation:**
  When Taylor invokes Alex, the graph waits for Alex to complete.
  But not forever — timeout after X minutes → retry once → if still
  no response, escalate (notify Justin: "Alex appears unresponsive,
  I'm blocked on [task]") and move on to other work. No agent falls
  asleep waiting at another agent's door. Balls don't get dropped.
- **Parallel fan-out:** Thea can invoke Taylor, Alex, and Jordan in
  parallel, wait for all three, then synthesize. Built-in.

### Token Cost Model

| Node | LLM Cost | Notes |
|------|----------|-------|
| TRIGGER | $0 | Event detection, no LLM |
| INTAKE | $0 | Queue write, normalize — all code |
| ROUTER | ~$0.001 | Haiku classification (spam filter + agent routing + model selection) |
| AGENT | $0.01-0.50 | Varies by model and task complexity |
| OUTPUT | $0 | Mechanical execution of agent's decisions |

Goal: minimize AGENT calls (the expensive part) by having ROUTER gate
intelligently. Simple acknowledgments ("Got it, thanks") use Haiku in
the AGENT node. Only complex work escalates to Sonnet/Opus.

Anthropic API returns detailed token breakdown per response (input, output,
cache read, cache creation). We already log to `agent_api_calls` in Supabase.
Enrich with model name + cache status for accurate cost tracking.

---

## Migration Path

The graph replaces `invoke_agent` and the email polling loop in `src/`.
Agent instructions, capabilities, and notes stay exactly the same — only
the runtime changes. Migration is structural (how agents are invoked and
coordinated), not behavioral (what agents do or how they think).

**What changes:**
- `src/agents/runtime.ts` → LangGraph graph definition
- `src/email/poll.ts` → TRIGGER (push + fallback poll)
- `src/agents/loader.ts` → ROUTER (agent selection + context loading)
- `invoke_agent` function → graph edge back to ROUTER
- `src/scheduler/` → TRIGGER events feeding into the graph

**What stays the same:**
- `agents/*/instructions.md` — agent personalities and guidance
- `agents/*/capabilities.md` — what each agent can do
- `agents/*/notes.md` — working memory (migrates to Layer 1/2 later)
- `agents/_global/` — shared framework
- `src/email/client.ts` — Gmail API (used by OUTPUT node)
- Supabase schema (extended, not replaced)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-28 | LangGraph for orchestration | Solves invoke_agent timing, enables event-driven, has checkpointing |
| 2026-01-28 | Claude Agent SDK for execution | Agent loop, tool calling, context management within each graph node |
| 2026-01-28 | Event-driven architecture | Agents sleep between tasks. 4 triggers: message, schedule, task queue, agent-to-agent |
| 2026-01-28 | Short SDK sessions | Agent continuity in our memory layers, not SDK context. Prevents involuntary compaction |
| 2026-01-28 | Haiku for routing + admin | Minimize token cost. Only AGENT node burns real tokens, and only at the model level the task requires |
| 2026-01-28 | Task queue as source of truth | Messages written to queue on arrival, archived from inbox. Fallback poll catches missed pushes |

---

## Anthropic's Multi-Agent Research System (2026-01-30)

Anthropic published [how they built their internal multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system). Key findings relevant to our architecture:

### Architecture Validation
Their orchestrator-worker pattern matches ours: lead agent (Thea) coordinates, spawns specialized subagents (child agents), synthesizes results. Our LangGraph graph is the orchestrator; `invoke_agent` spawns workers.

### Where They Go Further (Future Optimization Candidates)

**Parallel subagent execution.** They spawn 3-5 agents simultaneously. We drain `invoke_agent` sequentially. Their data: parallel tool calling reduced research time by up to 90%. Future briefing optimization — Thea could invoke all 7 children in parallel instead of one-at-a-time.

**Distributed output storage.** Subagent results stored externally with lightweight references passed to lead, avoiding token overhead of copying large outputs through conversation history. We currently flow all child responses back through Thea. Our pattern is deliberate (Thea synthesizes with her understanding of Justin), but for data-heavy briefings, storing child outputs in Supabase and passing references could reduce tokens.

**Effort scaling guidelines.** Explicit rules embedded in prompts: simple queries (1 agent, 3-10 tool calls), direct comparisons (2-4 subagents), complex research (10+ subagents). We could scale briefing complexity — simple email responses don't need the full 8-agent cascade.

### Production Engineering Patterns

**Stateful error compounding.** Minor failures cascade across many tool calls. Build resumption, not restart. Leverage model intelligence to adapt when tools fail. — Validates our LangGraph checkpointing approach.

**Rainbow deployments.** Gradual traffic shifts to avoid disrupting running agents mid-task. Relevant when we move to cloud (EVR-8).

**End-state evaluation.** For agents mutating state across turns, evaluate final outcomes not intermediate steps. "Agents may find alternative paths to the same goal." — Validates our notes integrity approach (check end state, not process).

**Long-horizon conversation management.** Spawn fresh subagents with clean contexts, use memory summaries for continuity. — Validates our Phase 2 memory design: short SDK sessions, continuity in our memory layers.

**Self-improvement loop.** An agent rewrote MCP tool descriptions → 40% decrease in task completion time for future agents. — Connects to Alex's coding tools thread (EVR open item). If Alex can modify agent instructions, that's self-improvement.

### Key Quote
"When building AI agents, the last mile often becomes most of the journey." Reinforces stabilizing Phase 1 before adding Phase 2 complexity.

### Performance Data
- Multi-agent Opus 4 (with Sonnet 4 subagents) outperformed single-agent Opus 4 by 90.2%
- Token usage explains 80% of performance variance
- Research tasks consume ~15× more tokens than chat interactions

---

## Sources

- [LangGraph.js docs](https://langchain-ai.github.io/langgraphjs/)
- [LangGraph concepts](https://langchain-ai.github.io/langgraph/concepts/)
- [CrewAI docs](https://docs.crewai.com/)
- [AutoGen docs](https://microsoft.github.io/autogen/)
- [Anthropic: Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
