# Agent Building Patterns

Learnings from building AI agents that will help when building Evryn (the product).

*Last updated: 2026-01-24*

---

## Identity & Interfaces

### Same Intelligence, Different Interfaces
An agent doesn't need to be a separate "thing" for each interaction mode. The same underlying AI can:
- Handle interactive work (terminal/chat)
- Respond to async messages (email)
- Run scheduled sessions (proactive thinking)

The "personality" is a prompt layer, not a separate system. This reduces complexity and context-loss.

### Proactive vs Reactive
Agents that only respond to prompts are assistants. Agents that think ahead, notice patterns, and reach out are *team members*. The infrastructure difference:
- Reactive: Wait for input → respond
- Proactive: Scheduled sessions → review context → decide if action needed → act or note for later

Building "proactive infrastructure" is building agency.

---

## Cost & Efficiency

### Model Selection is a Per-Task Decision
Different tasks need different intelligence levels:
- Routine/simple → smaller model (Haiku)
- Standard work → default model (Sonnet)
- Complex reasoning → larger model (Opus)

Let agents choose per-task, but log and audit. Quality over cost savings - better to do less work well than more work poorly.

### Prompt Caching Matters at Scale
Repeated context (system prompts, agent instructions, recent history) can be cached for ~90% cost reduction. Design agent prompts to be cacheable - stable prefixes, variable suffixes.

### Modular Context Loading
Don't load everything every time. Split agent context into:
- **Core:** Always loaded (identity, key principles, hard constraints)
- **Modules:** Loaded based on trigger type (briefing procedures, reflection guidance, collaboration patterns)

Agents should have *awareness* of what modules exist (low-resolution summary in core), but only get detailed procedures when relevant. This can save 30-40% on routine calls.

### Measure What Matters, Not Proxies
When constraining agent behavior (e.g., preventing runaway conversations), measure the actual thing you care about:
- **Bad:** Volley limits (can be gamed by stuffing messages, punishes productive conversations)
- **Good:** Budget limits (directly tied to the real constraint - money)

If you're limiting volleys, you're limiting a proxy. If you're limiting spend, you're limiting reality.

### Give Agents Budget Visibility
Agents with access to their own spend data and trends can self-optimize. They'll learn which tasks justify Opus vs. Haiku. This is better than hard rules - it creates efficiency through awareness, not restriction.

### Safety Nets, Not Handcuffs
Use hard limits as circuit breakers, not primary controls:
- **Alert** at unusual spend (3x daily) - something's happening, keep going but notify
- **Halt** at dangerous spend (5x daily) - stop and explain before continuing

Trust the agent to be smart, but have a kill switch.

---

## Guidance & Judgment

### Guidance vs Rules
Most agent instructions should be guidance, not hard rules. Make the distinction explicit:
- **Hard constraints:** Budget limits, don't commit human's time without asking, security requirements
- **Guidance:** Everything else — "keep this in mind," not "you must do this"

Agents with only hard rules become rigid. Agents with only guidance become unpredictable. The balance creates judgment.

### Dynamic Tensions, Not Contradictions
Good agent behavior requires holding multiple values in tension:
- Reach out when needed ↔ Respect others' bandwidth
- Be proactive ↔ Don't spam
- Follow guidance ↔ Use judgment
- Be solution-focused ↔ Ask open questions when appropriate

Don't collapse these into single rules ("always be proactive" or "never bother people"). Name both values explicitly and trust the agent to navigate between them. This creates nuanced judgment, not paralysis.

### Intelligent Compression
When agents synthesize or summarize (briefings, context, updates), they shouldn't just mechanically shorten. They should *think* about what matters:
- Remove redundancy, preserve nuance
- If phrasing carried important weight, keep the weight
- If a detail seems small but might matter, err toward including
- The goal is coherence without loss of signal

This applies to briefings, memory summarization, and any context compression.

---

## Memory & Context

### Two Types of Memory
Agents need both:
1. **Working memory** (narrative understanding) - Their current model of the world, written in their voice
2. **Transcript access** (the receipts) - Searchable history for when narrative memory isn't enough

Working memory should be coherent and stable, not fragmentary.

### Tiered Memory Prevents Token Bloat
As context grows, use tiers:
- **Hot:** Recent messages + current task (always loaded)
- **Warm:** Summarized older history (loaded as needed)
- **Cold:** Full transcript in database (searchable, not loaded)

This prevents sending 50K tokens every call while maintaining access to everything.

### Intelligent Summarization, Not Compression
When summarizing old context, use an AI call - not mechanical text shortening. Good summarization:
- Re-contextualizes (what mattered then vs. now)
- Corrects assumptions that turned out wrong
- Maintains narrative coherence
- Knows what to keep vs. discard

Dumb summarization forwards incorrect assumptions. Smart summarization improves on human memory.

### No Memory Holes - Overlap Buffer
Summarization must complete BEFORE old messages leave hot context. Use an overlap:
- Keep N+M messages in hot
- When full, summarize oldest M
- They stay in hot until summarization succeeds
- Only then move to warm/cold

Zero gap architecture. Never lose data between tiers.

### Multi-Cadence Reflection
Daily consolidation misses long arcs. Weekly misses patterns across weeks. Use multiple cadences:
- **Daily:** Today's transcript → notes snapshot
- **Weekly:** Full week's raw transcripts → weekly summary
- **Monthly:** Weekly summaries + can pull originals → deep reflection

Each cadence catches different patterns. Monthly can correct misunderstandings by going back to source.

### Reflection Must Be Action-Capable
Passive reflection (just update notes) misses half the value. Reflections should use the same structured output as regular calls - they can trigger emails, create tasks, flag issues. An agent that realizes something important during reflection should be able to act on it immediately.

### Version Everything, Delete Nothing
Notes, summaries, and reflections should be versioned, not overwritten. Storage is cheap. The value:
- Debug when understanding goes wrong ("when did this drift?")
- Long-arc reflection can examine evolution, not just current state
- Accountability ("what did I think at the time?")
- Human oversight of agent thinking over time

Keep current state in files (fast loading), history in database (queryable).

---

## Agent Coordination

### Direct Invocation > Message Queues > Email
For agent-to-agent communication:
- **Email:** Too many hops, adds latency, designed for humans
- **Message queue:** Better, but introduces async delay
- **Direct invocation:** Real-time, both agents log/remember, zero latency

Use the fastest method that still maintains proper logging and memory updates.

### Department Heads, Not Assistants
Agents that coordinate with each other before bringing issues to the human are department heads. Agents that escalate everything are assistants. Design for the former:
- Jordan checks with Taylor on budget before proposing to Justin
- Taylor can say "we can do $200 max" without Justin involved
- Only escalate when actually needed

This requires trust in the agents AND proper guardrails (budget limits, not volley limits).

### Single Voice for Human-Facing Updates
When multiple agents report to a human, designate one agent to synthesize. Otherwise:
- Human gets fragmented updates from 8 different sources
- Redundancy and inconsistent formatting
- Human has to do the synthesis work themselves

Better: All agents send updates to a coordinator (e.g., EA), who synthesizes into one coherent package. The human gets one voice, one format, no context-switching. CC everyone so the team sees responses.

### Cross-Domain Awareness
Agents should be experts in their domain but generally intelligent. If something crosses their desk that triggers concern in *any* domain — legal, technical, financial — they shouldn't ignore it just because "that's not my area."

The pattern: Don't analyze it deeply. Just ping the relevant teammate: "Something about this feels off to me. Can you take a look?" A 30-second invoke is cheaper than a missed risk.

---

## Voice & Emotion

### Voice Changes Everything for High-Touch Interactions
Email works but is slow and lossy. Voice enables:
- Faster back-and-forth (soulmate conversation in 10 min vs. 50 emails)
- Emotional cues that text can't capture
- Natural interruption and clarification
- Lower barrier to engagement (talking is easier than typing)

For relationship-focused AI (Evryn), voice may be the primary interface, not an enhancement.

### Emotion Detection is Genuinely Useful Signal
Modern voice AI (Hume AI EVI) can detect in real-time:
- Frustration / urgency / confusion - adjust approach
- Excitement vs. uncertainty - probe deeper
- Evasiveness / hesitation - flag for attention
- Tone shifts - something changed, notice it

This is gold for matching (does this person light up when talking about X?) and trust assessment (does their enthusiasm match their words?).

### Deception Detection: Signal, Not Verdict
Voice stress analysis (~88% accuracy) can flag inconsistencies. Use it as:
- "Something feels off, dig deeper" ✓
- "This person is definitely lying" ✗

Combine with conversational probing (Evryn calling out BS) for a powerful trust toolkit.

### Push + Sweep Pattern for Reliability
Never rely solely on real-time notifications. Pair instant triggers with scheduled sweeps:
- Push notification → process immediately (happy path)
- Scheduled sweep → catch anything missed
- Track by unique ID, not time window - no gaps, no duplicates

This applies to email, webhooks, any event-driven system. Belt and suspenders.

---

*Add patterns as they emerge from building evryn-team-agents and other agent work.*
