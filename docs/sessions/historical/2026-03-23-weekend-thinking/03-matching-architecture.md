# Task: Document the Matching Architecture — Subconscious and Conscious Layers

## Context

Evryn's matching system has two layers, referred to as her "subconscious" and "conscious."

- **Subconscious:** Vector similarity search over embeddings. Fast, cheap, runs at scale. Surfaces candidates.
- **Conscious:** Opus reads the stories of both people and reasons about fit. Slow, expensive per-call but inexpensive in absolute terms. Makes the actual matching decision.

This document captures the architectural decisions and principles for how these layers interact.

## Embeddings and Vector Search (The Subconscious)

### What Gets Embedded

Each person has multiple embeddings:

- **Whole-person embedding:** The full narrative story. This captures who someone is across all dimensions. It's where Evryn's most *surprising* matches may come from — connections people didn't know to ask for.
- **Intent-specific profile embeddings:** Curated versions of the story focused on a specific matching context. If someone is looking for a soulmate, Evryn writes a profile that distills the story down to the dimensions relevant to romantic matching — emotional texture, values, relational style, what they bring out in others. If the same person also needs a cinematographer, that's a different curated profile emphasizing aesthetic sensibility, working style, creative influences, collaboration patterns.

Intent-specific profiles should be written by **Opus**, not Sonnet. This is the core of what Evryn does — the quality of the profile directly determines the quality of the embedding, which determines who surfaces as a candidate. Cost per profile variant is approximately $0.03 with Opus. This is not the place to economize.

### What Embeddings Are Good At

Semantic resonance — finding things that are *the same kind of thing* even when they use different words. A person inspired by Roger Deakins will likely have embedding proximity to an intent mentioning Hoyte van Hoytema, because the underlying aesthetic sensibility is similar. This is where embeddings shine.

### What Embeddings Are Bad At

- **Structured, objective criteria.** Geography, age, specific certifications, binary qualifications. "Seattle" and "Bellevue" may not be close in embedding space even though they're 15 minutes apart. "Portland" might be closer to "Seattle" than "Bellevue" is, because they co-occur more in text. Embeddings capture semantic association, not objective proximity.
- **Complementary matches.** Embeddings find similarity. But someone who needs a mentor isn't best matched with someone who also needs a mentor — they need someone who loves teaching. Those stories might use very different language and sit far apart in embedding space despite being a perfect fit.

### Implications for Architecture

- **Use structured pre-filters for objective criteria.** Location radius, profession, hard constraints — these should be traditional database filters that run *before* the vector search. Cut the pool to "cinematographers within 50 miles," then let embeddings find resonance within that subset.
- **Keep structured, filterable data as actual database fields**, not buried in the story. Location, profession, skills, hard constraints live as fields. The story carries the texture, the why, the personality.
- **Pre-filters should be generous on soft dimensions.** If someone says "Seattle," the geo-filter should pull a wide radius, not city limits. Especially for high-stakes matching like soulmates, where the right person in a nearby city is infinitely more valuable than no one in the right zip code.

### A/B Testing Profile Formulations

For each intent, Evryn can write **multiple versions** of the curated profile — different framings, different emphases — and run vector search on all of them. This surfaces different candidate pools per variant. Cost is approximately $0.03 per additional variant. Over time, Evryn's reflection module can compare how different formulations performed and develop intuitions about what works for different kinds of matching. This is preferable to formal ML optimization at this stage, because the metric that matters most (did this connection actually enrich someone's life?) is slow to materialize and hard to quantify.

## Opus Evaluation (The Conscious Layer)

### When It Fires

The conscious layer only engages when the vector search surfaces candidates above a similarity threshold. For most people in the database most of the time, no candidates cross the threshold and no Opus calls are made. This is what keeps idle cost near zero.

### What It Does

Opus reads both people's full stories side by side and reasons about whether there's genuine resonance — not just semantic similarity, but the kind of fit that would make this introduction meaningful for both people. It identifies:

- **Obvious matches** — clear mutual fit, surface immediately.
- **Surprising matches** — unexpected resonance that neither person would have predicted. These are often Evryn's most valuable connections.
- **Duds** — vector search surfaced them but the conscious read says no. This is the filter that prevents bad matches from getting through.

### The Mutual Fit Question

A match requires that the connection serves both people. When Evryn finds a strong candidate for person A, she asks: "Does this person's story suggest they would welcome *this particular connection* right now?" Not "is A in their top 20" — but would this introduction serve them too? Evryn can answer this because she knows both people.

This is not a batch-matching algorithm like Gale-Shapley. Evryn is making individual matchmaking decisions, and matching is not zero-sum — a person can be matched for multiple things with multiple people. She can also be patient: introduce the obvious mutual wins now and hold asymmetric possibilities for later, revisiting as new people enter the system and stories evolve.

### Cost

Approximately $0.035 per candidate evaluation with Opus. Evaluating 15 candidates costs roughly $0.53. A full multi-variant match search (5 profile variants, embeddings, vector search, 15 candidates evaluated) comes in under $1.

**Use Opus for both profile writing and conscious evaluation.** Use Sonnet for the conversational layer, day-to-day chat, and routine triage. The cost difference is pennies. The quality difference is the brand.

## Trigger Model

The system does not re-run searches for every person on a schedule. Instead:

- **New person enters the system** → they get onboarded and embedded → their embedding gets checked against all existing intents (vector search, essentially free) → simultaneously, all their intents get checked against all existing people → conscious layer engages only where threshold is crossed.
- **Existing person's story is rewritten** (weekly or monthly reflection) → re-embed → same check.

This means idle cost for the database is near zero regardless of size. A million people can sit in the system and the only cost is storage plus the vector queries triggered by new entrants or story rewrites.

## Investigative Matching

Sometimes Evryn's standard search — structured filters plus vector search plus conscious evaluation — won't find the right match. This is especially true when someone's stated constraints don't fully capture what they need.

Example: A woman says she wants a soulmate in Seattle and won't move. But Evryn knows from other conversations that she loves San Francisco and the Seattle attachment is partly about defiance toward an ex-husband. If the geo-filter cuts strictly at Seattle, a perfect match in San Francisco never enters the candidate pool.

In these cases, Evryn should enter **investigative mode** — consciously constructing her searches based on what she knows about the whole person, not just their stated intent. Running it once with Seattle, evaluating the results, and then thinking: "Nothing here feels like the real thing. I know something about her relationship to San Francisco. Let me run it wider and see."

This is more expensive because it involves multiple search passes and more Opus evaluations. It should be triggered when:

- The standard search returns nothing that feels right.
- Evryn knows something about this person that makes her suspect their stated constraints are softer than they appear.

When investigative matching surfaces a boundary-crossing candidate, Evryn doesn't override the person's stated preference. She goes back to them and explores — asking questions that let the person discover their own flexibility, rather than presenting a fait accompli that contradicts what they said they wanted.

A flag should exist in the person's story (not as a structured field) noting stated constraints that may be softer than they appear, and *why* Evryn thinks so. The reasoning matters — it's not just "location: flexible," it's the full context.
