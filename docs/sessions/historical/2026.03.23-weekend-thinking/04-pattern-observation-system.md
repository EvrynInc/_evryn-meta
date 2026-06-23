# Task: Design the Pattern Observation System (Meta-Learning)

## Context

As Evryn interacts with more people, she'll notice things that might be generalizable — patterns that aren't about any one person but about how people work, what kinds of profile formulations produce better matches, how different types of intents behave in vector search, etc. These observations are valuable, but they need a home that doesn't bloat her conversation context or get tangled up with the reflection module.

The key distinction: the **reflection module** looks backward over everything to deepen understanding of *this person*. The **pattern observation system** is forward-looking and real-time — Evryn notices something in the moment, jots it down, and moves on.

## Architecture

### Real-Time Capture

During normal operation — conversations, matching, triage — Evryn occasionally notices something that feels like it might be generalizable. When she does, she writes a single lightweight record to a Supabase table. This should cost almost nothing in terms of tokens or time — it's a side-effect, not a process.

**Table structure (suggested):**

- `id` — primary key
- `observation` — short natural language description of what she noticed (e.g., "Third person this month who described what they want in a collaborator entirely in terms of what they *don't* want. Negative-frame intents might need different embedding treatment.")
- `category` — optional tag for loose grouping (e.g., "embedding_strategy", "onboarding_pattern", "matching_signal", "communication_style")
- `created_at` — timestamp
- `source_context` — minimal reference to what prompted the observation (e.g., user ID or conversation type, not full conversation content)

That's it. No prose, no narrative. A structured signal.

### Aggregation (Separate Process)

A separate process — periodic, or triggered after N observations accumulate — queries the table and looks for clusters. When multiple observations point at the same pattern, it surfaces a short summary: "here's what's emerging."

This could be:

- A scheduled job that runs weekly or monthly
- A lightweight subagent whose only job is to read the observations table and produce a brief "emerging patterns" summary
- Triggered when a category accumulates more than a threshold number of entries

The output is a concise summary document or record that can be loaded when relevant — during matching, during profile writing, during reflection. It stays completely out of Evryn's main conversation context until it's actually useful.

### How Evryn Uses Patterns

Patterns are informational, not prescriptive. If the aggregation surfaces "people who frame intents negatively tend to get weaker vector search results," that's something Evryn can consider when writing curated profiles — maybe she writes an additional variant that reframes a negative intent positively. It doesn't become a rule. It becomes a tool in her judgment.

## What This Is NOT

- **Not part of the reflection module.** Reflection re-interprets the past for a specific person. This observes the present across all people. Running this as part of monthly reflection would produce redundant observations every time and would be the wrong cadence.
- **Not ML or gradient descent.** There's no optimization function, no loss metric, no automated parameter tuning. This is Evryn developing professional intuitions through accumulated experience — more like a therapist who's been practicing for 20 years than a neural network being trained.
- **Not needed for launch.** This is a design-it-now, build-it-when-volume-justifies-it feature. Evryn won't have enough interactions to see real patterns until well after the Mark pilot is underway. But the Supabase table could be created now so that the capture mechanism is ready when the time comes.

## Guiding Principle

This is Evryn's epistemology applied to herself. She learns about people through stories and then notices patterns across stories. This is the same process, one level up: she notices things in real-time, accumulates observations, and periodically steps back to ask "what am I seeing across all of these?" Stories over structures for understanding individuals. Structured signals for understanding her own practice.
