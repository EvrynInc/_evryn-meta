# Miscellaneous Research

*Last updated: 2026-01-28*

---

## Google Antigravity Evaluation (2026-01-26)

**Context:** Justin heard good things about Google Antigravity. Asked if it's better than Claude Code.

**Finding:** Antigravity is an **IDE** (like Claude Code, Cursor), not a framework. It's Google's AI coding assistant, not something we'd import into our code.

**Justin's decision:** Staying with Claude Code. Antigravity has stability issues in Jan 2026 (performance decline, login problems, aggressive refactoring without asking). Claude Code is more reliable for our complex reasoning work.

---

## Token/Context Analysis (2026-01-26)

Current system loads 20 recent messages with FULL BODIES into every prompt. This is wasteful:
- ~$0.10/call average for Thea
- No Anthropic caching being used (now fixed — prompt caching merged #23)
- Quoted email content duplicated in message history

See Issues #6-9 for optimization work.

---

## Anthropic Workshop: Multi-layered Memory Architectures (2026-01-29)

**Event:** "Building with Advanced Agent Capabilities for Claude on Vertex AI" — Anthropic + Google Cloud webinar.

**Covers:** Multi-layered memory architectures that persist and learn across sessions, advanced reasoning patterns, custom tool integrations.

**Access:** Registration at [anthropic.com/webinars/claude-on-vertex-ai](https://www.anthropic.com/webinars/claude-on-vertex-ai). Recording may be available after the event. Justin prefers to watch at 3x or have Alex summarize the transcript.

**Action:** Check for recording/transcript after Jan 29 and distill key findings into memory-systems.md. Update: Justin is registered, will get video and can either watch at 3x or process for extraction. Ask Justin if he needs Claude to do this.
