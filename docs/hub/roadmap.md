# Evryn — The Hub

> **Living source of truth.** Loaded every session by every agent. If your notes contradict this document, flag the discrepancy — don't silently override.
>
> **Do not edit this document without explicit approval from Justin.** If you think something here is wrong or incomplete, tell Justin — do not rewrite it yourself.
>
> **Hub hygiene:** This doc is loaded into every session — every line costs tokens. But the goal isn't brevity, it's *fidelity*. After reading the Hub, an agent should have the right mental model of Evryn at a high altitude — enough that nothing in the sub-docs is a substantive surprise. More detail, yes. Different understanding, never. When maintaining this doc with Justin: (1) If a section is growing, move detail to a spoke and leave a hint here that sets the right expectation. (2) If reading the Hub could leave a wrong impression about something important, make sure it gets fixed — even if that makes it longer. (3) Every time you read this, ask: is it succeeding? If not, flag it.
>
> **Domain spokes** (`docs/hub/`) carry full depth on each topic — load them only when your current task requires that depth. Most sections below link to their spoke inline.
>
> **Downstream dependency:** When this document changes substantively, the Evryn company context module (`evryn_knowledge`, slug: `company-context`) should be refreshed — it's a **public-safe** derivative of Hub content. See `evryn-backend/docs/BUILD-EVRYN-MVP.md` Memory Architecture.
>
> **Every word in this document is load-bearing.** Nothing here is filler — every phrase was chosen to convey specifically what we mean. If something reads like fluff, pause and consider what it might mean if it isn't.
>
> **Tactical status:** `docs/current-state.md` (what's in flight, blockers, infrastructure).

---

## What Evryn Is

Today's connection tools optimize for engagement metrics (swipes, scrolls, clicks), not real outcomes. The result: frustration, shallow interactions, eroded trust, rising disconnection. We don't need more access to people — we need the *right* people, and someone we can trust to connect us.

Evryn is an AI-powered relationship broker. She finds you "your people" — the rare individuals who are the right fit — and only connects you to people she trusts. Not a dating app, not a networking tool, not a marketplace. A trust-based connection engine across all life domains: soulmate, cofounder, plumber, creative collaborator, hookup, someone who'd pay $100 for the thing you were about to throw away.

Evryn is active, not passive. She starts conversations. She thinks about you in the background. She offers thoughts unprompted. She's kind of a mix between your best friend, a wise mentor, and a timeless Oracle — warm, wise, curious, principled, tough in a gentle way. She runs her own shop — like a cool coffee shop owner who remembers your name, makes it right if something goes wrong, and gives you a free cup of coffee because she can tell you need it today.

**Design philosophy:** Stories over structures. Trust is non-negotiable. Character becomes currency. Aligned incentives. The first resonance is between you and Evryn; the ultimate resonance is between you and yourself. Evryn doesn't just connect you to others — she connects you more to *yourself*.

**What Evryn is NOT:** Not a dating app ("a resonance layer for life"). Not a chatbot ("a relational intelligence with judgment"). Not another network ("a trust-based connection engine"). Not a marketplace ("a personal connector for what — and who — you actually need").

**Entity:** Evryn Inc., Delaware Public Benefit Corporation. Mission-locked to "*foster trusted human connection for our users by developing systems that create high-resonance connections, responsibly steward personal information and insights, and structurally protect emotional wellbeing, informed consent, and relational alignment and trust across every interaction*".

## Why Now

- **AI can finally be a trusted presence**, not just a tool
- **Cultural fatigue** with extraction, manipulation, and addiction-driven platforms
- **Loneliness epidemic** + professional displacement = acute demand for trusted connection
- **Competitors can't follow** — incumbents are trapped by their financial dependence on models that require keeping things broken; upstarts can't catch up to compounding trust

## Trust & Fit

Trust and fit are the operating system, not features. Evryn only connects people in proportion to how much she trusts them — and only when the fit is genuinely right. Full depth: `docs/hub/trust-and-safety.md`.

- **Trust and fit are a story, not a score.** Multi-dimensional, context-specific. Structured as a document in the user profile, not a number. Some dimensions bleed across contexts; others are domain-specific.
- **Character becomes currency.** Behavioral, not performative. What you've done and how it impacted others.
- **You're always in control.** No manipulation, no auto-invites, no fake urgency, no gamification, no ads, no data selling.
- **Behavioral filtering, not belief filtering.** Filters predatory behavior, deception, coercion — not politics or worldview.
- **Trust imprint on deletion.** Personal data purged; non-reversible salted hash anchors trust memory so bad actors can't reset.
- **Identity verification** before connections — "I only connect people I trust, and part of that is knowing they're real." Evryn never stores ID documents or biometrics — a third-party service handles verification; Evryn only stores verified or not.
- **No disclosing evaluations of named individuals.** Evryn forms assessments of everyone — that's her job. But she never reveals those assessments to other users. Users can request connections with specific people; Evryn either facilitates or doesn't — a non-match is a non-event, not a verdict. This preserves the Canary Principle (no information leakage through response patterns) while letting Evryn use her full intelligence. See [ADR-010](../decisions/010-canary-principle-revised.md) (revises [ADR-008](../decisions/008-trust-mirror-dropped.md)).

## How Connections Work

Everyone who interacts with Evryn is a "user" — whether they came through a gatekeeper's inbox, an invite, or direct signup. Finding the gatekeeper was just their first connection; Evryn will find them everything else they need. Full depth: `docs/hub/user-experience.md`.

- **Double opt-in.** Evryn proposes a match, each person approves what's shared at every step. Either can say no at any point — Evryn softens any rejection. Neither knows the other exists until both have agreed.
- **Evryn is the broker, not the sorter.** She explains *why* someone matters, not just *that* they match. Connection quality is the product.
- **Trust-based pricing at the point of connection.** Both sides pay what they believe is fair. 100% satisfaction guarantee.
- **After-care.** Evryn follows up: "How did that feel?" Feedback calibrates her judgment over time.

## Business Model

Evryn is a **broker**, not a subscription platform — she gets paid when she delivers, not for access. Everyone is a "user" — both sides pay per-connection. Full depth: `docs/hub/business-model.md`.

- **Trust-based pricing:** Connections span from a free favor to a $10,000 executive match — any fixed pricing leaves money on the table or prices people out. And how the user shows up in the exchange tells Evryn something about how they show up in relationships. Evryn notices.
- **Three revenue streams:** (1) Match payments, (2) Post-match transactions (Stripe Connect), (3) Participant-based business access ("ads without ads").
- **The flywheel:** Value compounds after a connection, not just during. You seek a soulmate → then a wedding planner → then a midwife → a babysitter → a new job. The more Evryn knows you, the more verticals open up. Every success fuels growth.
- **Structural moat:** Legacy platforms are structurally incentivized to keep you *almost* satisfied — solving your problem kills their subscription. Evryn only gets paid when the connection works. Trust compounds; LTV is exponential.

## Safety & Moderation

Safety is structural, not bolted on. Full depth: `docs/hub/trust-and-safety.md`.

- **No open messaging.** Users can't see or contact each other unless Evryn initiates and both opt in. No feeds, no forums, no comment threads.
- **Evryn stays present.** After making a connection, she will quietly observe early exchanges, only if both users agree. Can intervene, end chats, or remove users from future consideration.
- **Crisis protocols.** Mental health crises → support mode + resources + may escalate to human. Illegal activity → disengage + legal review.

## Current Strategy

**Build stages:** v0.1 (Custom GPT PoC) done → **v0.2 "Gatekeeper's Inbox"** ← current sprint, Mark live ~March 10 → **v0.3 "The Broker"** (web app + matching + payments + cast-off outreach, target first revenue late April / early May) → **v0.4 "Scale"** (second gatekeeper, publisher module, agents, target June/July).

- **v0.2 "Gatekeeper's Inbox":** Evryn surfaces connections from a gatekeeper's inbox. Gatekeeper forwards emails → Evryn identifies who's worth their time (gold/pass/edge case) → drafts notification → Justin approves via email → Evryn delivers. Pilot gatekeeper: Mark (Seattle). These are connections being brokered, not emails being sorted — tracked as such from day one.
- **Lucas (Chief of Staff agent) PAUSED** — building Evryn product first. Everything transfers back.
- **Website** live at evryn.ai.
- **Runway:** ~$6,700 cash on hand. Additional $15K available ($5K founder + $10K angel, contingent on traction). Burn rate: ~$4,200/mo during build sprints, ~$2,950/mo steady state (component breakdown in [business-model spoke](docs/hub/business-model.md)). Revenue target: late April / early May 2026.
- **GTM:** Film industry first, Pacific Northwest ignition (Mark and key contacts are Seattle-based), LA expansion. Why film: acute need (everyone either clamoring for attention or drowning in it), dense network (each customer knows hundreds of prime leads), founder advantage (Justin's 78K+ second-gen industry contacts), industry in transition (AI disruption makes trusted connections more urgent). Two parallel channels: **top-down** via gatekeepers like Mark — high-volume connectors whose ~200 daily cast-offs become Evryn users; **bottom-up** via whisper cascade — trust mechanics as growth engine, not artificial scarcity. Full depth: `docs/hub/gtm-and-growth.md`.
- **Growth is conversationally embedded.** The ideal landing page is "talk to Evryn." She demonstrates value by tailoring to the user's specific needs.

## Technical Architecture

**Stack:** Claude Agent SDK + Supabase (PostgreSQL) + TypeScript. Anthropic Claude for all AI (Sonnet default, Opus for nuance, Haiku for routine). Full depth: `docs/hub/technical-vision.md` (north star), `evryn-backend/docs/ARCHITECTURE.md` (product architecture, v0.2–v1.0).

**Three domains of intelligence (conceptual model):**
1. **Conversation & voice** — how Evryn talks. Tone, emotional arcs, personality alignment.
2. **Judgment & matching** — how Evryn decides. Constraint filtering, compatibility, readiness.
3. **Intuition & care** — how Evryn watches over time. Knows when to act or hold space.

**Dual-track processing:** Warm human conversation + structured metadata collection running in parallel. Analytical layer invisible to the user.

For MVP (v0.2), a single agent handles all three domains. As complexity grows, they separate into independent modules — some subagents, some deterministic processes, some separate runtimes — plus a **publisher** (safety gate that checks everything before it goes out) and **deception detection**. Detail in `docs/hub/technical-vision.md`.

**User isolation is absolute.** Each user's conversation is its own track. Evryn never reveals one user's information to another. Multi-channel conversations (email, chat, voice) interleave *within* a user by time — same as a real friendship across channels — but never bleed *between* users. Admin access to user data must be heavily gated even from Evryn's own operators (future architecture requirement).

**Script-as-skill, not script-as-constraint.** Evryn receives onboarding scripts + the reasoning behind them, then flows naturally while hitting the same targets. Not a script-follower — a skilled agent who understands the technique.

**Security:** Information firewalling by construction (not just instruction). Front-facing Evryn is structurally blind to sensitive data. Zero-trust, defense in depth.

**Internal/external firewalling for Lucas.** Lucas operates both internally (team coordination) and externally (via Evryn). The Hub is internal company truth; externally, Lucas references only Evryn's public-safe company context module (`evryn_knowledge`). Internal-only information must never leak.

## The Long View

Trust compounds. Evryn's ultimate leverage: owning the trust layer of human connection. The moat is built not just on AI, but on accumulated human outcomes that only Evryn has visibility into. Full depth: `docs/hub/long-term-vision.md`.

The vision: a world where the *default* would be that people can be trusted and relationships actually work — because there's a reliable trust broker. Mental health improves. Divorce drops. Job satisfaction rises. Money becomes less necessary as Evryn does what money was always meant to do — vouch for your contributions and let you carry forward value.

**Target state:**
1. Trust data held by an independent Swiss foundation, structurally inaccessible even to Evryn Inc.
2. Evryn's trust layer is designed to optionally become infrastructure — competitors could embed it rather than compete with it.

## Team

- **Justin** — Founder/CEO. Sole human operator. Building everything with Claude Code.
- **Lucas Everhart** — Chief of Staff agent (Claude Agent SDK). Primary autonomous operator. Paused for Evryn build.
- **AI Team** (Lucas subagents): Alex (CTO), Taylor (COO/CFO), Dana (CPO), Dominic (Strategic Advisor), Jordan (CGO), Nathan (Internal Counsel), Thea (EA — separate subagent).
- **Human Advisors:** Andrew Lester (Operations), Salil Chatrath (Product), Manuele Capacci (Design), Megan Griffiths (Film Industry).
- **Legal:** Fenwick & West (legal and strategic partner).
- **Pilot User:** Mark (August Island Pictures / Eva's Wild).

## Repositories

| Repo | Purpose | Status |
|------|---------|--------|
| `_evryn-meta` | AC's home. Hub, cross-repo docs | Active |
| `evryn-backend` | Evryn product agent (Gatekeeper's Inbox) | Active — building |
| `evryn-team-agents` | Lucas (Chief of Staff) runtime | Paused |
| `evryn-website` | Marketing site (evryn.ai) | Live |
| `evryn-dev-workspace` | DC's home. Identity & methodology | Active |
| `evryn-langgraph-archive` | LangGraph-era code archive | Sealed |

## Additional References

Most domain spokes are linked inline in the sections above. When adding new references, prefer inline links in the relevant section — this list is for cross-context items and non-spoke docs.

- **BizOps & Tooling:** `docs/hub/bizops-and-tooling.md` — legal entities, finance, vendors, operational tools
- **Evryn product build:** `evryn-backend/docs/BUILD-EVRYN-MVP.md` (what to build, phase by phase)
- **Lucas agent build:** `evryn-team-agents/docs/BUILD-LUCAS-SDK.md`
- **Decision log:** `docs/decisions/`
- **Trusted Partner Briefing:** `docs/historical/Evryn Trusted Partner Briefing v1.6.md` — condensed pitch doc for collaborators, advisors, and capital partners. Keep updated when strategy evolves.
- **Historical vault (_evryn-meta):** `docs/historical/` — Master Plan Reference (~730 lines, frozen), Master Plan v2.3 (~3,200 lines, frozen original). Go to the original for exact wording, marketing prose, or full competitive analysis.
- **Historical vault (evryn-backend):** `evryn-backend/docs/historical/` — v0.1 system prompt, requirements drafts, prototype schema, n8n prototype

---
