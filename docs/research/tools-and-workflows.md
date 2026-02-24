# Tools & Workflows Research

*Last updated: 2026-01-28*

Covers Anthropic Skills, MCP servers, observability, testing, and prompt management tools.

---

## Anthropic Agent Skills

**What they are:** Folders with `SKILL.md` + scripts. Teach Claude repeatable workflows. Progressive disclosure — metadata loaded at startup, full content on demand.

**Timeline:** Oct 2025 launch → Dec 2025 open standard (agentskills.io) → Jan 2026 hot reload in Claude Code 2.1.0

**SDK integration:** `.claude/skills/` directory, `/v1/skills` API endpoint, distributable via plugins.

**Our assessment:** Functionally similar to what we already do with per-agent `instructions.md` + `capabilities.md`. Skills add hot reload and progressive disclosure, but our system needs fixes (invoke_agent timing) more than a new instruction format. **WATCH — revisit during runtime restructuring.**

---

## MCP Servers

| MCP Server | What It Does | Adopt Now? |
|------------|--------------|------------|
| **Google Workspace MCP** | Gmail, Calendar, Drive via OAuth | YES — could replace custom `src/email/` client |
| **Slack MCP** | Channels, messages, search | WATCH — when we add Slack |
| **Linear MCP** | Issues, projects, cycles | WATCH — could let agents manage their own boards |
| **Composio** | 100+ pre-built integrations | EVALUATE — bundled approach |
| **Pipedream MCP** | 2,500+ APIs | WATCH — long-tail integrations |
| **Zapier MCP** | Zapier automations | WATCH — bridge to non-MCP tools |

---

## Observability & Monitoring

We currently have **zero observability** into agent behavior beyond logs.

| Tool | What It Does | Adopt Now? |
|------|--------------|------------|
| **Helicone** | Lightweight LLM proxy — cost tracking, logging, rate limiting. One-line change (proxy URL) | EVALUATE — lowest effort win |
| **Langfuse** | Open-source tracing, session tracking, prompt versioning | YES — top recommendation if we want depth |
| **Braintrust** | Eval + observability combined | EVALUATE |
| **LangSmith** | LangChain's platform | ONLY IF we adopt LangGraph |

---

## Agent Testing

We have **no automated testing** for agent behavior. Prompt changes could break personality/decisions silently.

| Tool | What It Does | Adopt Now? |
|------|--------------|------------|
| **Promptfoo** | CLI for testing prompts/agents, red teaming, YAML configs. 15k+ stars | YES — catch regressions before deploy |
| **Braintrust Evals** | Online + offline evaluation | EVALUATE |

---

## Prompt Management

| Tool | What It Does | Adopt Now? |
|------|--------------|------------|
| **Agenta** | Git-like prompt versioning, A/B testing, non-dev collaboration | WATCH — for when Justin wants to tweak agent personalities without code |
| **Langfuse** | Prompt versioning + observability in one | See observability section |

---

## Recommendations Summary

**Adopt now:** Helicone (one-line proxy), Promptfoo (agent testing)
**Evaluate soon:** Langfuse (observability + prompts), Google Workspace MCP (replace Gmail client)
**Watch:** Skills format, Slack/Linear MCP, Mem0, Agenta

---

## Sources

- [Anthropic: Introducing Agent Skills](https://www.anthropic.com/news/skills)
- [Agent Skills Open Standard](https://agentskills.io/home)
- [Promptfoo GitHub](https://github.com/promptfoo/promptfoo)
- [Builder.io: Best MCP Servers 2026](https://www.builder.io/blog/best-mcp-servers-2026)
- [LangChain: State of Agent Engineering](https://www.langchain.com/state-of-agent-engineering)
