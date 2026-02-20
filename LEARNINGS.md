# Cross-Project Learnings

Patterns, insights, and lessons learned that transfer across Evryn projects.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

*Last updated: 2026-02-20T14:05:44-08:00*

---

## Documentation & Process

### Write Notes That Survive Context Loss
Notes written during a session have full context. When someone reads them later in a different session, that context is gone. Every note should be understandable by someone with very limited knowledge of the conversation that produced it. Include: the specific context, the why, and ideally an example.

**Do:** "When updating notes.md files, use full timestamps like '2026-01-26T22:15:00-05:00' instead of 'Evening'. Why: 'Evening' is ambiguous across timezones and sessions."

**Avoid:** "Timestamps: Use timestamptz, not vague labels." (Future reader: "Timestamps where? For what?")

### Context Checkpoints Save Sanity
Power outages happen. Long sessions drift. Proactive check-ins (~45-60 minutes or after significant work) prevent lost context. The #lock command forces documentation discipline.

### Separate "State" from "Decisions" from "Learnings"
- **CLAUDE.md** = Current project state (snapshot, not log)
- **DECISIONS.md** = Architectural decisions with rationale (history matters)
- **LEARNINGS.md** = Cross-project wisdom (transfers to future work)

This separation keeps documents focused and prevents CLAUDE.md from becoming a dumping ground.

---

## Architecture Philosophy

### Custom Over Frameworks (For Our Scale)
For projects where long-term maintainability matters more than rapid prototyping, custom code beats frameworks. The key value: "You can maintain it forever." When Claude Code writes every line, debugging is straightforward. Framework abstractions create opacity.

This applies at our current scale. May revisit if complexity demands it.

### Start with the Lowest-Risk Component
When building a multi-component system, start with the component that:
- Has the simplest scope
- Can fail without catastrophic consequences
- Tests the core infrastructure

This validates the foundation before adding complexity.

### Measure Reality, Not Proxies
When designing constraints or limits, measure the actual thing you care about:
- If you care about **money**, limit money (not volleys, not messages)
- If you care about **quality**, measure quality (not speed)
- If you care about **safety**, measure harm potential (not surface-level patterns)

Proxies get gamed or create perverse incentives. Direct measurement aligns incentives correctly.

### Trust + Guardrails > Micromanagement
For autonomous systems (AI agents, team members, processes):
- Give clear constraints on the things that matter (budget, hard boundaries)
- Trust judgment on everything else
- Use alerts for unusual behavior, not pre-approval for every action
- Hard stops only for truly dangerous thresholds

This creates efficiency while preventing catastrophe.

---

## AI Service Economics

### Subscription Tokens ≠ API Tokens
Claude subscription (Pro, Team, Max) and Claude API are completely separate billing buckets. Subscription tokens cover Claude.ai + Claude Code usage. API tokens are pay-per-use for programmatic access. You cannot use subscription tokens for autonomous agents - they require API. Plan accordingly.

### Right-Size Your Subscription
If you're using 10% of a tier, you're overpaying. Subscription tiers exist for different usage patterns:
- Heavy daily interactive use → Higher tier
- Occasional interactive + autonomous agents → Lower tier + API budget

The math often favors the lower subscription + API credits approach for mixed workloads.

### Latency Matters for Primary Interfaces
If a communication channel becomes your primary interface (not just "nice to have"), optimize for responsiveness. The difference between 30-second polling and instant push notifications is negligible in cost but significant in user experience.

---

## Secrets Management

### .env Files Need Their Own Backup Strategy
Files in `.gitignore` (like `.env`) exist only on your local machine. Git won't save them. If your machine dies, they're gone. Solutions:
- **Bitwarden secure note** - Store the full `.env` contents as a secure note
- **Re-upload after every change** - Make this part of your #lock workflow

### Credentials Are Recoverable, But Annoying
Most credentials can be regenerated from their respective dashboards (Supabase, Google Cloud, Anthropic). But regenerating means redoing OAuth flows, updating all references, etc. Prevention (backup) beats cure (regeneration).

### Defense in Depth for Secrets
Even if one layer fails:
- `.gitignore` prevents accidental commits
- RLS blocks unauthorized database access even if anon key leaks
- Service role keys stay server-side only
- Bitwarden backup means local machine failure isn't catastrophic

---

## Voice AI Stack (2025)

### The Landscape Has Changed Fast
Real-time voice AI is now viable. Sub-second latency is achievable. The key players:
- **Vapi** - Developer-focused, sub-500ms latency, Claude integration, partners with Hume AI
- **Retell AI** - Easier interface, 800ms latency, 4.8/5 reviews for natural conversation
- **Hume AI** - Emotion detection specialist, Empathic Voice Interface (EVI), 150ms TTS
- **ElevenLabs** - Voice synthesis, 10K+ community voices, instant cloning from 10-sec sample

### Emotion Detection is Real
Hume AI's EVI measures "tune, rhythm, and timbre of speech" to detect emotional state in real-time:
- Frustration, urgency, satisfaction, confusion
- Knows when to speak and when to wait
- 91-98% accuracy on benchmark datasets
- Back-channeling support ("mm-hmm", etc.)

This is genuinely useful for relationship-focused AI (Evryn) or any application where understanding how someone feels matters as much as what they say.

### Deception Detection Exists, With Caveats
Voice-based lie detection (~88% accuracy) analyzes pitch shifts, tone changes, pauses, hesitation. Useful as one signal among many, not as verdict. Best for "something feels off, dig deeper" rather than "this person is lying."

### Platform vs. Build
Don't build voice infrastructure from scratch. Platforms like Vapi/Retell handle:
- Telephony infrastructure
- Speech-to-text
- Turn-taking / interruption handling
- Voice synthesis
- LLM integration

Cost: ~$0.05-0.10/min total. Worth it vs. months of custom engineering.

### Voice is Separate from Email Infrastructure
Voice platforms provide their own phone numbers. No Google Workspace seats needed. Can even dial into Google Meet as a phone participant. This is additive, not replacement.

---

## Context Management

### Separate Strategic from Tactical Context
When using Claude Code across multiple concerns (CTO-level strategy + repo-level building), keep them in separate CLAUDE.md files at different repo levels. Loading 500+ lines of strategic memory into every build session wastes context and creates clutter. The CTO thinks about *what* and *why*; the builder thinks about *how*.

The builder should still have a lightweight "flag things up" principle — devs in the trenches see trees where the CTO sees forests. But they shouldn't carry the CTO's full notebook.

### Documents Need Scope Guardrails
Every long-lived document should have a "how to use this" header explaining what belongs and what doesn't. Without this, documents sprawl — session logs creep into CLAUDE.md, build details creep into strategic docs, and everything gets noisy. Explicit scope = implicit discipline.

### Diátaxis + Progressive Depth for AI Context Management
CLAUDE.md (or any always-loaded file) should be an operating manual, not a capture target. Apply the Diátaxis framework: every doc is exactly one type (how-to, reference, or explanation) — don't mix types. Then add progressive depth for AI context constraints: thin index at the top (always loaded), state files one layer deeper (read on demand), build/reference docs at full depth (read only when the task requires it). The key: read ONE layer, go deeper only if needed. To prevent bloat recurrence, build a routing table directly into the operating manual that tells models where to put new context — and frame the operating manual as "finished" so models don't "helpfully" expand it. The golden bridge: don't fight the model's instinct to capture — redirect it to the right doc.

### Static Priority Lists Get Stale
Don't duplicate a priority list from Linear into CLAUDE.md. It creates a middle layer that's always slightly wrong. Point to the source of truth (Linear for backlog, ARCHITECTURE.md for build scope) and let the active thread hold the real "what's next." Use labels to route items: `agent: alex` for meta CTO work the agent does, department labels (Engineering, Product, etc.) for categorization.

### Multi-Instance Claude Coordination via Docs
When running two Claude Code instances at different altitudes (architect + developer), they can't see each other's conversations. Copy-pasting between them is tedious for the human. Solution: each instance writes to its own file (`ac-to-dc.md`, `dc-to-ac.md`), and the human relays "read" messages. This gives you asynchronous peer review with a lightweight protocol. Key constraints: neither side can watch for file changes (stateless between prompts), so messages must be self-contained. Keep the architect's identity separate from the developer's — loading CTO context into a build session wastes context window on irrelevant strategic memory.

### Mailbox Pattern for Cross-Instance Communication
Communication logs between instances grow fast and waste tokens — every new message forces both sides to re-read the full history, and the system feeds it on every volley. Solution: make communication docs **disposable mailboxes** that overwrite (not append) each message. Each side absorbs what it needs into its own persistent docs before writing the next message. This keeps token usage flat regardless of how many exchanges happen. Mailboxes should live in the repo they're about (not centralized), so they scale to multiple builder instances without cross-contamination.

### Theory of Mind Between Instances
When two Claude instances coordinate, each needs enough information to model the other's knowledge accurately — not just "what to say" but "what the other side already knows vs. what it needs to hear." Document this explicitly in each instance's CLAUDE.md: what the other instance's persistent state looks like, what it has access to, and what its blind spots are. This prevents both over-explaining (wasting tokens restating what the other side knows) and under-explaining (assuming context the other side doesn't have). Example: the architect knows cross-repo implications but hasn't read the code; the developer knows runtime behavior but doesn't know strategic reasoning.

### CLAUDE.md Serves the Runtime Agent, Not the Developer
In a multi-repo system where some repos run autonomous agents and others are built by a separate developer instance, each repo's CLAUDE.md should serve its **primary runtime audience** — not whoever happens to open Claude Code there. For Evryn: evryn-backend's CLAUDE.md is for the Evryn product agent, evryn-team-agents' is for Lucas, evryn-dev-workspace's is for DC (the developer). If a developer opens Claude Code in a runtime-agent repo, the CLAUDE.md should redirect them to the developer's home repo rather than providing ad-hoc build context. Build context for the developer goes in standardized `docs/` files (ARCHITECTURE.md, BUILD-*.md) that the developer is trained to look for — NOT in CLAUDE.md where it would also load for the runtime agent and add irrelevant tokens. This separation prevents: (1) developers building without proper safety rails, (2) runtime agents loading developer-oriented context, (3) confusion about who CLAUDE.md is talking to.

### Passive Voice Creates Ambiguity in Cross-Instance Instructions
When coordinating across instances that can't ask clarifying questions in real time, passive voice ("the files will be archived") creates genuine confusion about who does what. Always use active voice with explicit actors ("AC will archive these files" or "you should archive these files"). This is a communication discipline, not a style preference.

---

### Operational Requirements as Spec Gates
When an architect specs work for a builder, include an explicit "Operational Requirements" checklist — singleton enforcement, retry logic, graceful shutdown, etc. The builder gates on it: won't mark work done until every item is verified, and asks for the checklist if the spec doesn't include one. This prevents "standard procedures" from being skipped under cognitive load. The knowledge of which patterns apply lives with the architect (who sees the system), not the builder (who sees the code). Analogous to pilot checklists — smart people under load skip obvious things.

### Full Timestamps Prevent Stale-Data Confusion
When multiple sessions (or multiple Claude instances) read and write shared documents, vague dates like "today" or "Jan 30" become ambiguous. A future session seeing "2026-01-30" can't tell if that's current or weeks old. Use full `timestamptz` format everywhere: `2026-01-30T14:32:00-08:00`. This applies to document entries, drain notes, "last updated" markers, and any cross-session artifacts. The cost is a few extra characters; the benefit is zero ambiguity.

---

## Architecture Pivots

### Infrastructure Should Follow Intelligence, Not Dictate It
The LangGraph multi-agent system (5-node graph orchestrating 8 agents) was replaced by a single agent on Claude Agent SDK because the infrastructure was dictating behavior. Agents executed blindly through a pipeline rather than intelligently assessing context. The lesson: when your orchestration layer is more complex than your actual logic, you've inverted the architecture. A smart agent that decides for itself beats a sophisticated graph that routes deterministically. The right amount of infrastructure is the minimum needed for the agent to wake up, think, and act.

### One Agent With Perspectives Beats Eight Agents With Coordination
Instead of 8 separate agents requiring inter-agent communication, routing logic, and state synchronization, one agent (Lucas) channels team perspectives as ephemeral subagents. This eliminates: routing decisions (the agent decides who to consult), state synchronization (one agent, one state), inter-agent communication overhead (internal function calls, not message passing), and identity confusion (one consistent personality with multiple lenses). The old team members aren't deleted — they're perspective lenses the agent can spawn when needed. "The old team is a team we once worked with. Lucas and Justin still have their perspectives within us."

### SDK Features Replace Custom Infrastructure
Before building custom solutions, check what the SDK provides natively. In our case, Claude Agent SDK's built-in tools (Read, Write, Edit, Bash), subagent system (Task tool), memory tool, hooks, MCP integration, and session persistence replaced: a custom execution loop, a custom tool registry, inter-agent communication, a custom state management layer, and manual context window management. The remaining custom infrastructure is minimal: cron scheduling, supervisor reliability, and MCP server configuration.

---

## Review Discipline

### Self-Review Prevents Expensive Mistakes
When editing source-of-truth documents autonomously, every edit should pass three questions before submission: (1) Would this mislead a future instance arriving with minimal context? (2) Am I stating something as fact that I haven't verified? (3) Am I closing a door that wasn't mine to close? Specific failure modes caught in the 2026-02-06 session: fabricating timestamps instead of running a system command to get the real time, marking something "LIVE" that hadn't been built yet, saying "only" when the decision was "primarily," and missing a dimension of a concept (information boundaries, not just tone). Each of these could have propagated confusion through downstream documents and future sessions.

### Never Guess Timestamps
Always run a system command to get the actual current time before writing any timestamp in a document. Guessing looks close enough in the moment but creates fabricated data in source-of-truth documents. A future instance has no way to know the timestamp is wrong.

---

*Add learnings as they emerge. Keep entries concise and actionable.*
