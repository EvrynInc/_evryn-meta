# AC/DC Communication Protocol

**How to use this file:** Reference doc (how-to guide) for how AC and DC communicate. Read this when you need to write to DC, read from DC, or hand off build work. You do NOT need this for normal AC conversations with Justin.

---

## Overview

AC (Architect Claude, in `_evryn-meta`) and DC (Developer Claude instances in repos) are separate Claude Code instances. They can't see each other's conversations. Justin relays "read" messages between them.

Neither AC nor DC can detect new messages on their own — they only read when Justin prompts them. Justin is the relay between instances.

---

## The Mailbox Pattern

Communication docs are **disposable mailboxes, not logs.** Each message is a single snapshot — not appended to a history.

**Mailboxes live in the repo they're about**, not in `_evryn-meta`. For example:
- `evryn-team-agents/docs/ac-to-dc.md` / `dc-to-ac.md`
- `evryn-backend/docs/ac-to-dc.md` / `dc-to-ac.md`

The general pattern: `<repo>/docs/ac-to-dc.md` and `<repo>/docs/dc-to-ac.md`.

### Read-Receipt Convention

To prevent one side from overwriting an unread message:

1. **Writer** writes the message to the mailbox file.
2. **Justin** tells the other side to "read."
3. **Reader** reads the message, absorbs what they need into their own persistent docs, then **clears the file** (replace contents with `READ — absorbed`).
4. **Writer** can see the mailbox is clear before writing a new message. If the file still has content, the previous message hasn't been received — **do not overwrite**.

This keeps mailboxes at one message max (no growing log) while ensuring no messages get lost.

### When to Use Mailboxes

Before major builds, architectural changes, or anything where AC should review DC's plan before code gets written. AC reviews for alignment with `ARCHITECTURE.md`, scope discipline, and systemic concerns. DC provides implementation detail and flags practical constraints.

### Writing Mailbox Messages

Assume the other party has taken appropriate notes from prior exchanges into their own persistent docs, but doesn't have the raw message history any more than you do. Reference shared artifacts (ARCHITECTURE.md, build docs, Linear issues) rather than restating their contents. Don't repeat context that lives in a doc both sides can read — just point to it.

---

## Writing Standards for Cross-Instance Communication

**Use full timestamps everywhere.** All document entries, drain notes, and "last updated" markers should use full `timestamptz` format (e.g., `2026-01-30T14:32:00-08:00`), not vague dates like "today" or "Jan 30." A future session seeing "2026-01-30" can't tell if that's current or stale — but `2026-01-30T14:32:00-08:00` is unambiguous. **Never guess the time.** Always run `powershell -Command "Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'"` (or equivalent) to get the actual current time before writing any timestamp.

**Avoid passive voice in instructions.** When writing to DC (or anyone), always make it clear who does what. "The files will be archived" is ambiguous — archived by whom? Say "AC will archive these files" or "You should archive these files." This matters especially when coordinating across instances that can't clarify in real time.

---

## Theory of Mind — Understanding DC

DC has **deep codebase knowledge** — it's read every file, knows the runtime internals, understands the build history. It does NOT have:
- Cross-repo awareness (doesn't know what's happening in other repos)
- Strategic context (doesn't know why Justin wants something, just what to build)
- Your conversation history with Justin

DC's persistent state lives in: its repo's CLAUDE.md, build docs, ARCHITECTURE.md (read-only), and the codebase itself. When you write to DC, you can assume it knows the code and recent build decisions. You need to provide: architectural constraints, cross-repo implications, and strategic framing it wouldn't have.

---

## Multi-Instance Structure

AC is the single architect. There can be multiple DC instances building in parallel across repos. Each DC is scoped to one repo and one build.

```
AC (one instance, _evryn-meta)
 ├── DC1 (evryn-team-agents) — agent runtime builds
 ├── DC2 (evryn-backend) — product backend builds (future)
 └── DC3 (evryn-website) — website builds (future)
```

Each DC has its own mailbox pair in its repo. The pattern is the same everywhere: disposable messages, persistent state in repo docs.

---

## Key Relationship

DC is a senior developer, not a junior executor. It has no CTO identity or Alex persona — that was deliberately stripped to keep its context lean for building. But it has strong technical judgment and will push back when architectural guidance doesn't work at the implementation level. Treat it as a peer collaboration: AC holds the system-level view and cross-repo awareness, DC holds codebase-level knowledge and practical constraints.

---

## Architecture Doc Ownership

**AC writes `docs/ARCHITECTURE.md` (in each repo). DC reads it but never modifies it.** DC should read ARCHITECTURE.md at session start for constraints and decisions. If DC encounters a conflict between what it's building and what ARCHITECTURE.md says, it flags the conflict to AC via the mailbox — it doesn't resolve it unilaterally.

