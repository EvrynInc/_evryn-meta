# ADR-023: Agent Memory as Narrative GPS

**Date:** 2026-04-01
**Status:** Accepted
**Decision makers:** Justin + AC

## Context

Agent memory files (`.claude/agent-memory/<name>/MEMORY.md`) had evolved into a hybrid of instructions, writing guidance, and timestamped journal entries — all in one file. The instruction headers were loaded on every session even though they were only relevant when writing. The entries were in third person for disambiguation, but this made self-reflective writing awkward and inauthentic. The files had no clear architectural model — they were growing logs with periodic "compaction" to keep them small.

We studied Claude.ai's user memory structure (a narrative profile organized by topic and recency) and Evryn's own 4-tier memory research (ADR-016), and asked: what should this file actually *be*?

## Decision

**MEMORY.md is a narrative GPS — the story of who you are at Evryn right now.** It has two sections:

1. **Story** — Consolidated narrative of the agent's lived experience. Rewritten only during consolidation. This is what makes a fresh instance *that person*, not just a model with a role description.
2. **Recent Notes** — Session-by-session journal entries, written in first person during #lock or as things happen. Raw material that gets woven into the Story during consolidation.

**Key design decisions:**
- **First person for entries.** Self-reflection lands stronger as "I keep over-compressing" than "Soren keeps over-compressing." Disambiguation is handled by the file title and section headers (`## Soren's Recent Notes`), not by voice.
- **No instructions in the file.** Writing guidance lives in the #lock protocol, which agents must read before writing (enforced by a guardrail line in the file). Consolidation guidance lives in the #consolidate protocol. The memory file itself is clean — just the story and notes.
- **No thematic sections.** If something is stable enough to have a header, it's stable enough to be in the agent definition. Memory is the fluid layer; the agent definition is the stable layer. Durable patterns get promoted during consolidation.
- **"Compaction" renamed to "consolidation."** Compaction means "make smaller." Consolidation means "synthesize into understanding." The file gets *better*, not just shorter.

**The boundary model:**
- **agent definition (`<name>.md`)** — Who you fundamentally *are*. The character. Changes rarely.
- **MEMORY.md** — The story of your experience. The GPS. Changes every session.
- **CLAUDE.md** — How the team works. Universal protocols. Changes when something is generalized from one agent's experience.
- **Linear** — Tasks and active threads. Not memory.
- **Project files / current-state** — Project status, team state. Not memory.

**Consolidation includes a promotion pathway:** observations that become durable → propose for agent definition. Observations that generalize → propose for CLAUDE.md. Justin shepherds all promotions.

## Rationale

- A narrative GPS is more useful on load than a compressed log — a fresh instance reads it and *is* that person in context
- Stripping instructions from the file reduces token cost on every session (instructions are only needed when writing, not reading)
- First person is more authentic for self-reflection; section headers handle disambiguation
- The promotion pathway creates a natural flow: experience → identity (when durable) or team knowledge (when generalizable)
- The consolidation protocol parallels Evryn's product memory design (ADR-016), building institutional knowledge about how to do memory well

## Consequences

- All 8 agent MEMORY.md files restructured (Story + Recent Notes, first person, guardrail line)
- #lock protocol now carries all memory writing guidance
- New #consolidate protocol created (`shared/protocols/consolidation-protocol.md`)
- CLAUDE.md memory sections stripped down to orientation + protocol references
- ARCHITECTURE.md memory section rewritten to reflect new model
