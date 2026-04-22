# ADR-028: Volley Reasoning Persistence

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**Status:** Accepted
**Date:** 2026-04-22
**Deciders:** Justin, Soren
**Target:** v0.3 (web app). Not needed for v0.2 email-only.

**Relates to:** ADR-027 (profile architecture — story, pending_notes, cross_user_notes). This ADR adds a fourth persistence layer that feeds into the same Reflection pipeline.

---

## Context

Evryn's runtime creates a fresh SDK `query()` call for every volley (`persistSession: false` in classify.ts). Each volley gets a fresh `composeSystemPrompt()` — Core.md + person context from Supabase. Conversation history is loaded from the `messages` table into the prompt, giving Evryn continuity on what was *said*.

What's lost between volleys: Evryn's reasoning process. Which modules she loaded, what she noticed about tone or hesitation, what she was weighing, why she chose this response over another, what she observed but decided wasn't worth a pending_note yet. Within a single `query()` call, this reasoning is live — Evryn can make up to 20 tool calls, read modules, write notes, and reason across all of it. But when the call ends, that reasoning is gone. The next volley's Evryn is a fresh instance reading her own notes and past messages.

For v0.2 (email-only), this gap is small. Hours between messages give Evryn time to write rich pending_notes — the gap between "what she noted" and "what she was thinking" is narrow when she has time to be thorough.

For v0.3 (web chat), this becomes a real problem. Fast exchanges — 10 messages in 5 minutes — mean Evryn can't write comprehensive pending_notes after every message without breaking conversational flow. The next volley, 30 seconds later, sees only the surface messages and whatever notes she managed to write. The reasoning texture that makes her responses feel continuous and attuned is lost.

Two things are true simultaneously:

1. **Evryn needs to capture curated learning signals** — what she's learning about this person, patterns she's noticing, observations worth carrying forward. These are pending_notes. They consolidate into the story at Reflection.

2. **Evryn needs to preserve reasoning context between volleys** — why she said what she said, what she noticed in the moment, what she was weighing. This isn't about the person — it's about the conversation. It helps the next volley feel continuous rather than cold-starting.

These are different things with different lifespans. Conflating them — forcing all reasoning into pending_notes — would either slow the conversation (too many writes) or degrade the notes (rushing them to keep up with chat pacing).

---

## Decision

**Add an `internal_context` column to the `messages` table** (JSONB or text, nullable). Each time Evryn produces a response, she also writes a brief reasoning breadcrumb alongside it: what she noticed, why she chose this response, what modules she loaded, what she's holding in mind for next time.

This is not a full reasoning dump. It's a curated snapshot — the key observations that informed this particular response. Think of it as the margin notes on a letter: the letter is what the person reads; the margin notes are what Evryn reads when she picks up the conversation later.

When future volleys load conversation history, they load both the surface messages and the internal_context for each. Evryn sees not just what she said but *why*.

### Three-tier persistence model

| Layer | What it captures | Lifespan | Written by |
|-------|-----------------|----------|------------|
| **messages.internal_context** | Reasoning per volley — what she noticed, why she chose this response, what she's tracking | Archived after Reflection (insights captured in story) | Evryn, each volley |
| **pending_notes** | Learning signals about the person — patterns, preferences, observations | Consolidated into story at Reflection | Evryn, when she has something worth noting |
| **story** | Synthesized understanding — who this person is | Permanent (grows over time) | Reflection |

Each tier feeds the next. internal_context captures the raw moment. pending_notes capture what matters about the person. Reflection reads both and synthesizes into story. After Reflection, old internal_context can be archived with the messages — its insights are in the story now.

### What internal_context is NOT

- **Not a full thinking trace.** It's curated, not comprehensive. Evryn writes what the next volley needs, not everything she thought.
- **Not a substitute for pending_notes.** If something is a real learning signal about the person, it goes in pending_notes. internal_context is about *this conversation*, not *this person*.
- **Not permanent.** Unlike story, internal_context has no reason to survive indefinitely. Post-Reflection, it can be archived or discarded.

### How Reflection uses it

When the Reflection Module synthesizes pending_notes into story, it also reads recent internal_context entries. These provide texture that pending_notes alone might miss — the reasoning behind observations, the nuance of moments, the things Evryn noticed but didn't promote to a note. Reflection can draw on this texture when writing the story, then the internal_context has served its purpose.

---

## Consequences

**Positive:**
- Conversational continuity in fast web chat without requiring persistent sessions
- Preserves the fresh-query-per-volley architecture (system prompt can evolve, modules can change, no stale session state)
- Maintains decomposability — everything consolidates into story, old data archives cleanly
- Reflection gets richer input without requiring Evryn to write exhaustive pending_notes during fast exchanges
- Timestamps on messages + internal_context + pending_notes create a rich, cross-referenceable timeline

**Negative:**
- Additional write per volley (token cost for generating internal_context + DB write)
- Additional tokens loaded per volley (reading previous internal_context alongside messages)
- Identity file design needed to instruct Evryn to write internal_context naturally, not mechanically — this is a craft challenge (Mira's domain)
- Reflection Module complexity increases slightly (one more input to read)

**Tradeoffs accepted:**
- The token cost of writing and loading internal_context is real but bounded — it only covers recent messages (since last Reflection), and the entries are brief by design. At v0.3 volumes, this is negligible compared to the cost of Evryn sounding like she forgot what just happened.
- The identity file instruction to write internal_context needs to feel natural. "Write a brief note about what you noticed and why you responded this way" is the spirit — not "fill out the internal_context field." Mira's craft here matters.

---

## Implementation notes

**Schema:** `ALTER TABLE messages ADD COLUMN internal_context JSONB DEFAULT NULL;` Or text, depending on whether structured fields are useful. Start with text — Evryn writes a brief narrative, same as pending_notes. Structured fields can come later if patterns emerge.

**v0.2:** No changes. Email pacing makes this unnecessary. pending_notes are sufficient.

**v0.3:** Implement alongside the web app conversation infrastructure. The conversation history loading (already a Day 6 task for v0.2) expands to include internal_context. Evryn's identity files gain guidance on writing internal_context — probably a few lines in core.md's note-writing section.

**Reflection Module:** When synthesizing, read `messages.internal_context` for the period since last Reflection alongside pending_notes. After synthesis, internal_context entries older than the Reflection boundary can be archived.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED