# Cross-Project Learnings

Patterns, insights, and lessons learned that transfer across Evryn projects.

*Last updated: 2026-01-23*

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

### Static Priority Lists Get Stale
Don't duplicate a priority list from GitHub Issues into CLAUDE.md. It creates a middle layer that's always slightly wrong. Point to the source of truth (Issues) and let the active thread hold the real "what's next." Use assignment labels (e.g. `CTO`, `evryn-team-agents`) to route issues to the right altitude.

### Multi-Instance Claude Coordination via Docs
When running two Claude Code instances at different altitudes (architect + developer), they can't see each other's conversations. Copy-pasting between them is tedious for the human. Solution: each instance writes to its own file (`ac-to-dc.md`, `dc-to-ac.md`), and the human relays "read" messages. This gives you asynchronous peer review with a lightweight protocol. Key constraints: neither side can watch for file changes (stateless between prompts), so messages must be self-contained. Keep the architect's identity separate from the developer's — loading CTO context into a build session wastes context window on irrelevant strategic memory.

---

*Add learnings as they emerge. Keep entries concise and actionable.*
