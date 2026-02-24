# Claude Agent SDK — Research Report

*Last updated: 2026-01-30*

Full deep dive on Anthropic's Agent SDK as a potential execution engine for the 8-agent system.

---

## What Is It?

A **library** (not a platform/framework). The same agent harness powering Claude Code, extracted as an npm package (`@anthropic-ai/claude-agent-sdk`, v0.2.22). Core API is one function: `query()`.

**What it gives you:**

| Capability | Description |
|-----------|-------------|
| Agent loop | Automatic gather-context → take-action → verify → repeat |
| Built-in tools | Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, AskUserQuestion |
| Context management | Automatic compaction when context window fills |
| Session persistence | Auto-saved to disk, resume by session ID |
| Subagent spawning | Specialized agents via `Task` tool |
| MCP integration | Connect to external services via Model Context Protocol |
| Hooks system | PreToolUse, PostToolUse, SessionStart, SessionEnd, SubagentStart |
| Streaming | All responses stream via async iterators |

**What it is NOT:**
- Not a hosted service — runs locally or on your servers
- Not a multi-model orchestrator — Claude only
- Not a workflow engine — no graph/DAG execution, no state machines
- No built-in memory, scheduler, or inter-agent communication

---

## Architecture

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.py",
  options: {
    allowedTools: ["Read", "Edit", "Bash"],
    permissionMode: "acceptEdits",
    model: "claude-sonnet-4-5",
    systemPrompt: "You are a security specialist...",
    agents: { /* subagent definitions */ },
    mcpServers: { /* MCP server configs */ },
    hooks: { /* lifecycle hooks */ },
    resume: "session-id",
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

**Subagents:** Separate Claude instances spawned via `Task` tool. Own isolated context, tools, system prompt, optional model override. **Critical limitation: one level deep only — no nesting.**

---

## MCP (Model Context Protocol)

"USB for AI" — standardized tool integration. Three transports: stdio (local process), SSE/HTTP (remote), in-process (custom tools).

**Relevant MCP servers:**

| Service | Status | Notes |
|---------|--------|-------|
| Gmail | Production | Could replace our custom `src/email/` client |
| Google Calendar | Production | Scheduling, events |
| Supabase | Production | "Only for dev/testing" per Supabase |
| Slack | Production | For future Slack channel |
| GitHub | Production | Issue management |

---

## Sessions and Memory

- Sessions auto-save to `~/.claude/projects/`, resume with session ID
- **No built-in long-term memory** — no semantic/vector memory, no cross-agent shared memory
- Context compaction is automatic and uncontrollable
- Long sessions degrade after 3-4 days (community reports)
- Memory is BYOM (bring your own memory)

---

## Multi-Agent Orchestration

**This is the critical section for our `invoke_agent` timing problem.**

Subagent `Task` tool calls are **synchronous from parent's perspective** — parent waits for subagent to fully complete. This directly solves our timing bug.

**But there's an architectural mismatch:**

| Feature | What We Need | What SDK Provides |
|---------|-------------|-------------------|
| Agent calls agent, waits | YES | YES |
| Parallel subagents | YES | YES |
| Subagent spawns subagent | MAYBE | NO — one level only |
| 8 persistent agents with state | YES | NO — subagents are ephemeral |
| Email-triggered activation | YES | NOT BUILT-IN |
| Scheduled tasks | YES | NOT BUILT-IN |
| Cross-agent shared state | YES | NOT BUILT-IN |

Our system has 8 **persistent, always-running agents**. The SDK models agents as **ephemeral subagents** spawned for a task and discarded.

---

## Comparison to LangGraph

| Dimension | Agent SDK | LangGraph |
|-----------|----------|-----------|
| Type | Agent harness | Agent runtime (graph-based) |
| Model support | Claude only | Any model |
| State management | Session persistence | Explicit state through graph |
| Orchestration | Parent → child (one level) | Arbitrary graph topology |
| Memory | Session-based only | Built-in checkpointing |
| Maturity | v0.2.x, ~4 months | ~2 years, used by Klarna/Uber/LinkedIn |

**Bottom line:** LangGraph is better for orchestration. Agent SDK is better for execution. They're complementary.

---

## Recommendation for Evryn

**Do NOT adopt as wholesale replacement.** DO consider for:
1. Replacing the inner agent execution loop (built-in tools + context management)
2. Fixing invoke_agent timing (subagent Task calls are synchronous)
3. Individual agent capabilities

**Hybrid approach:** LangGraph for orchestration + Agent SDK (or raw API) for execution.

**Immediate next step — fix invoke_agent timing:**
- (a) Switch to SDK subagents — medium effort, gets us on SDK
- (b) Fix custom await — low effort, keeps current arch (pragmatic choice)
- (c) Adopt LangGraph — high effort, biggest long-term payoff

---

## Update: 2026-01-30 — SDK Docs Refresh

SDK has been **renamed from Claude Code SDK to Claude Agent SDK**. Package is now `@anthropic-ai/claude-agent-sdk`. Key updates from current docs:

**New capabilities since our initial research:**
- **Multi-provider support:** Bedrock (`CLAUDE_CODE_USE_BEDROCK=1`), Vertex AI (`CLAUDE_CODE_USE_VERTEX=1`), Azure Foundry (`CLAUDE_CODE_USE_FOUNDRY=1`). No longer Claude-only infrastructure — can run through AWS, Google, or Microsoft.
- **Hooks system matured:** `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `SubagentStart`. Callback-based, can validate/log/block/transform.
- **Plugins:** Extend with custom commands, agents, and MCP servers programmatically.
- **Skills:** Specialized capabilities defined in Markdown (`.claude/skills/SKILL.md`).
- **Session forking:** Resume sessions AND fork them to explore different approaches.

**What hasn't changed (still limitations for us):**
- Subagents still one level deep — no nesting
- No built-in scheduler, inter-agent communication, or cross-agent shared state
- No workflow engine, no graph/DAG, no state machines
- Memory is still BYOM (bring your own memory)

**Assessment unchanged:** SDK is excellent for execution (replacing our custom `runAgent` loop with `query()`). LangGraph remains necessary for orchestration. The hybrid architecture holds.

---

## Production Readiness

- Renamed to Claude Agent SDK (was Claude Code SDK)
- Pre-1.0, breaking changes possible
- Production-ready for single-agent tasks, NOT for multi-agent orchestration at scale
- ~12 second latency per query
- Windows: subagent prompts >8191 chars fail (command line length limit)

---

## Sources

- [GitHub](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Docs: Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Docs: Subagents](https://platform.claude.com/docs/en/agent-sdk/subagents)
- [Docs: Sessions](https://platform.claude.com/docs/en/agent-sdk/sessions)
- [Docs: MCP](https://platform.claude.com/docs/en/agent-sdk/mcp)
- [Blog: Building Agents](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)
- [Blog: Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [npm](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
- [HN: Production usage](https://news.ycombinator.com/item?id=46679473)
