# Cross-Project Learnings

Patterns, insights, and lessons learned that transfer across Evryn projects.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Hygiene:** Dedicated passes happen on a regular schedule — not during normal work sessions. During a hygiene pass, promote learnings to appropriate new homes: behavioral rules → the relevant CLAUDE.md (AC, DC, or repo-specific), build patterns → build docs or ARCHITECTURE.md, context management insights → wherever they'll be read at the right moment. Once promoted, condense the original entry to a one-line stub pointing to where it now lives. Stubs stay so future hygiene passes can cross-pollinate to new repos or contexts. Goal: keep active (un-promoted) entries under ~150 lines so #lock reads stay cheap.

**Promoted entries look like:** *Promoted → AC CLAUDE.md ("Never guess timestamps").* Just enough to know what it was and where to find the full version.

*Last updated: 2026-02-24T13:21:06-08:00*

---

## Promoted Stubs

*Promoted → AC CLAUDE.md Autonomous Work Protocol §6 ("Context Checkpoints Save Sanity").*
*Promoted → AC CLAUDE.md routing table ("Separate State/Decisions/Learnings").*
*Promoted → ADR-006 ("Custom Over Frameworks" — superseded by intentional dependency selection).*
*Promoted → AC CLAUDE.md Architectural Mandate ("Measure Reality, Not Proxies").*
*Promoted → AC + DC CLAUDE.md ("Separate Strategic from Tactical Context" — the AC/DC separation itself).*
*Promoted → AC CLAUDE.md Document Ownership ("Documents Need Scope Guardrails").*
*Promoted → AC + DC CLAUDE.md Documentation Approach ("Diátaxis + Progressive Depth").*
*Promoted → AC/DC protocol doc ("Multi-Instance Claude Coordination via Docs").*
*Promoted → AC/DC protocol doc ("Mailbox Pattern for Cross-Instance Communication").*
*Promoted → DC CLAUDE.md "Understanding AC" + AC/DC protocol ("Theory of Mind Between Instances").*
*Promoted → AC CLAUDE.md Runtime CLAUDE.md Ownership ("CLAUDE.md Serves the Runtime Agent, Not the Developer").*
*Promoted → AC + DC CLAUDE.md ("Operational Requirements as Spec Gates").*
*Promoted → AC + DC CLAUDE.md ("Full Timestamps Prevent Stale-Data Confusion").*
*Promoted → BUILD-LUCAS-SDK.md "Why This Architecture" ("Infrastructure Should Follow Intelligence").*
*Promoted → BUILD-LUCAS-SDK.md architecture ("One Agent With Perspectives Beats Eight").*
*Promoted → AC CLAUDE.md Autonomous Work Protocol §5 ("Self-Review Prevents Expensive Mistakes").*
*Promoted → AC + DC CLAUDE.md ("Never Guess Timestamps").*

---

## Active Learnings

### Documentation & Process

#### Write Notes That Survive Context Loss
Notes written during a session have full context. When someone reads them later in a different session, that context is gone. Every note should be understandable by someone with very limited knowledge of the conversation that produced it. Include: the specific context, the why, and ideally an example.

**Do:** "When updating notes.md files, use full timestamps like '2026-01-26T22:15:00-05:00' instead of 'Evening'. Why: 'Evening' is ambiguous across timezones and sessions."

**Avoid:** "Timestamps: Use timestamptz, not vague labels." (Future reader: "Timestamps where? For what?")

---

### Architecture Philosophy

#### Start with the Lowest-Risk Component
When building a multi-component system, start with the component that:
- Has the simplest scope
- Can fail without catastrophic consequences
- Tests the core infrastructure

This validates the foundation before adding complexity.

#### Trust + Guardrails > Micromanagement
For autonomous systems (AI agents, team members, processes):
- Give clear constraints on the things that matter (budget, hard boundaries)
- Trust judgment on everything else
- Use alerts for unusual behavior, not pre-approval for every action
- Hard stops only for truly dangerous thresholds

This creates efficiency while preventing catastrophe.

#### SDK Features Replace Custom Infrastructure
Before building custom solutions, check what the SDK provides natively. In our case, Claude Agent SDK's built-in tools (Read, Write, Edit, Bash), subagent system (Task tool), memory tool, hooks, MCP integration, and session persistence replaced: a custom execution loop, a custom tool registry, inter-agent communication, a custom state management layer, and manual context window management. The remaining custom infrastructure is minimal: cron scheduling, supervisor reliability, and MCP server configuration.

---

### AI Service Economics

#### Subscription Tokens ≠ API Tokens
Claude subscription (Pro, Team, Max) and Claude API are completely separate billing buckets. Subscription tokens cover Claude.ai + Claude Code usage. API tokens are pay-per-use for programmatic access. You cannot use subscription tokens for autonomous agents - they require API. Plan accordingly.

#### Right-Size Your Subscription
If you're using 10% of a tier, you're overpaying. Subscription tiers exist for different usage patterns:
- Heavy daily interactive use → Higher tier
- Occasional interactive + autonomous agents → Lower tier + API budget

The math often favors the lower subscription + API credits approach for mixed workloads.

#### Latency Matters for Primary Interfaces
If a communication channel becomes your primary interface (not just "nice to have"), optimize for responsiveness. The difference between 30-second polling and instant push notifications is negligible in cost but significant in user experience.

---

### Secrets Management

#### .env Files Need Their Own Backup Strategy
Files in `.gitignore` (like `.env`) exist only on your local machine. Git won't save them. If your machine dies, they're gone. Solutions:
- **Bitwarden secure note** - Store the full `.env` contents as a secure note
- **Re-upload after every change** - Make this part of your #lock workflow

#### Credentials Are Recoverable, But Annoying
Most credentials can be regenerated from their respective dashboards (Supabase, Google Cloud, Anthropic). But regenerating means redoing OAuth flows, updating all references, etc. Prevention (backup) beats cure (regeneration).

#### Defense in Depth for Secrets
Even if one layer fails:
- `.gitignore` prevents accidental commits
- RLS blocks unauthorized database access even if anon key leaks
- Service role keys stay server-side only
- Bitwarden backup means local machine failure isn't catastrophic

---

### Context Management

#### Static Priority Lists Get Stale
Don't duplicate a priority list from Linear into CLAUDE.md. It creates a middle layer that's always slightly wrong. Point to the source of truth (Linear for backlog, ARCHITECTURE.md for build scope) and let the active thread hold the real "what's next." Use labels to route items: `agent: alex` for meta CTO work the agent does, department labels (Engineering, Product, etc.) for categorization.

#### Passive Voice Creates Ambiguity in Cross-Instance Instructions
When coordinating across instances that can't ask clarifying questions in real time, passive voice ("the files will be archived") creates genuine confusion about who does what. Always use active voice with explicit actors ("AC will archive these files" or "you should archive these files"). This is a communication discipline, not a style preference.

---

### Review Discipline

#### Cross-Reference Newest Thinking Before Backfilling
When integrating older content (e.g., Master Plan) into newer structures (Hub spokes), always cross-reference the most recently evolved version of thinking first — such as a legal questionnaire drafted after the source doc, or a conversation where the founder refined the concept. The newer source may have more careful framing, resolved ambiguities, or superseded positions that the older source doesn't reflect. Backfilling without this check risks regressing to stale thinking.

#### First Principles for Third-Party Tool Access
When you need a new capability (e.g., editing Google Sheets from Claude Code), the instinct is to find a plugin or integration. The right first question is: "What's the simplest path using tools I already trust?" Evaluate from a security-first perspective: a single-author npm package running with your OAuth tokens is real supply chain risk — a compromised update silently exfiltrates your entire Drive. Often the answer avoids the dependency entirely. The general principle: split capabilities across tools that are each strong at their part, rather than adding a mediocre bridge that creates a new attack surface.

---

### Research References as Build Breadcrumbs

#### Study Material ≠ Implementation Spec
When referencing external projects or prior research in build docs, use a two-layer defense: (1) each research report carries its own disclaimer in its header explaining scope differences, and (2) each consuming doc has a general "Research references" note explaining how to treat all research links. This prevents a builder from cargo-culting patterns from a different context. The instruction is always: study the approach, understand the trade-offs, then design for *our* constraints.

#### Place Breadcrumbs at Decision Points
Research references are most valuable when placed exactly where someone is actively designing something the research informs — not clustered at the top as a reading list. An inline italicized note pointing to a specific section (e.g., "§4 Memory Architecture") at the right moment in a build doc changes the quality of thinking. A bibliography at the top gets skimmed and forgotten.

---

*Moved to research → `_evryn-meta/docs/research/voice-ai-stack.md` (was "Voice AI Stack" section — landscape assessment, not a learning).*

---

*Add learnings as they emerge. Keep entries concise and actionable.*
