# Evryn — The Hub

> **Living source of truth.** Loaded every session by every agent. If your notes contradict this document, flag the discrepancy — don't silently override.
>
> **Do not edit this document without explicit approval from Justin.** If you think something here is wrong or incomplete, tell Justin — do not rewrite it yourself.
>
> **Hub hygiene:** This doc is loaded into every session — every line costs tokens. But the goal isn't brevity, it's *fidelity*. After reading the Hub, an agent should have the right mental model of Evryn at a high altitude — enough that nothing in the sub-docs is a substantive surprise. More detail, yes. Different understanding, never. When maintaining this doc with Justin: (1) If a section is growing, move detail to a spoke and leave a hint here that sets the right expectation. (2) If reading the Hub could leave a wrong impression about something important, fix it — even if that makes it longer. (3) Every time you read this, ask: is it succeeding? If not, flag it.
>
> **Domain spokes** (`docs/hub/`) carry full depth on each topic — load them only when your current task requires that depth. Most sections below link to their spoke inline.
>
> **Downstream dependency:** When this document changes substantively, the Evryn company context module (`evryn_knowledge`, slug: `company-context`) should be refreshed — it's a public-safe derivative of Hub content. See `evryn-backend/docs/BUILD-EVRYN-MVP.md` Memory Architecture.
>
> **Tactical status:** `docs/current-state.md` (what's in flight, blockers, infrastructure).

---

## What Evryn Is

Today's connection tools optimize for engagement metrics (swipes, scrolls, clicks), not real outcomes. The result: frustration, shallow interactions, eroded trust, rising disconnection. We don't need more access to people — we need the *right* people, and someone we can trust to connect us.

Evryn is an AI-powered relationship broker. She finds you "your people" — the rare individuals who are the right fit — and only connects you to people she trusts. Not a dating app, not a networking tool, not a marketplace. A trust-based connection engine across all life domains: soulmate, cofounder, plumber, creative collaborator, hookup, someone who'd pay $100 for the thing you were about to throw away.

Evryn is active, not passive. She starts conversations. She thinks about you in the background. She offers thoughts unprompted. She's kind of a mix between your best friend, a wise mentor, and a timeless Oracle — warm, wise, curious, principled, tough in a gentle way. She runs her own shop — like a cool coffee shop owner who remembers your name, makes it right if something goes wrong, and gives you a free cup of coffee because she can tell you need it today.

**Design philosophy:** Stories over structures. Trust is non-negotiable. Character becomes currency. Aligned incentives. The first resonance is between you and Evryn; the ultimate resonance is between you and yourself. Evryn doesn't just connect you to others — she connects you more to *yourself*.

**What Evryn is NOT:** Not a dating app ("a resonance layer for life"). Not a chatbot ("a relational intelligence with judgment"). Not another network ("a trust-based connection engine"). Not a marketplace ("a personal connector for what — and who — you actually need").

**Entity:** Evryn Inc., Delaware Public Benefit Corporation. Mission-locked.

## Why Now

- **AI can finally be a trusted presence**, not just a tool
- **Cultural fatigue** with extraction, manipulation, and addiction-driven platforms
- **Loneliness epidemic** + professional displacement = acute demand for trusted connection
- **Competitors can't follow** — incumbents are trapped by models that require keeping things broken; upstarts can't catch up to compounding trust

## Trust & Fit

Trust and fit are the operating system, not features. Evryn only connects people in proportion to how much she trusts them — and only when the fit is genuinely right. Full depth: `docs/hub/trust-and-safety.md`.

- **Trust and fit are a story, not a score.** Multi-dimensional, context-specific. Structured as a document in the user profile, not a number. Some dimensions bleed across contexts; others are domain-specific.
- **Character becomes currency.** Behavioral, not performative. What you've done and how it impacted others.
- **You're always in control.** No manipulation, no auto-invites, no fake urgency, no gamification, no ads, no data selling.
- **Behavioral filtering, not belief filtering.** Filters predatory behavior, deception, coercion — not politics or worldview.
- **Trust imprint on deletion.** Personal data purged; non-reversible salted hash anchors trust memory so bad actors can't reset.
- **Identity verification** before connections. Relational framing, not bureaucratic. Pass-through model — Evryn never stores documents or biometrics.
- **The canary principle.** Evryn never evaluates or comments on specific named individuals — any response creates a baseline where deviation leaks information. See `docs/decisions/008-trust-mirror-dropped.md`.

## How Connections Work

Everyone who interacts with Evryn is a "user" — whether they came through a gatekeeper's inbox, an invite, or direct signup. Finding the gatekeeper was just their first connection; Evryn will find them everything else they need. Full depth: `docs/hub/user-experience.md`.

- **Double opt-in.** Evryn proposes a match, each person approves what's shared at every step. Either can say no at any point — Evryn softens any rejection. Neither knows the other exists until both have agreed.
- **Evryn is the broker, not the sorter.** She explains *why* someone matters, not just *that* they match. Connection quality is the product.
- **Trust-based pricing at the point of connection.** Both sides pay what they believe is fair. 100% satisfaction guarantee.
- **After-care.** Evryn follows up: "How did that feel?" Feedback calibrates her judgment over time.

## Business Model

Evryn is a **broker**, not a traditional SaaS. Everyone is a "user" — both sides pay per-connection. Full depth: `docs/hub/business-model.md`.

- **Trust-based pricing:** Users pay what they believe is fair. 100% satisfaction guarantee.
- **Three revenue streams:** (1) Match payments, (2) Post-match transactions (Stripe Connect), (3) Participant-based business access ("ads without ads").
- **Structural moat:** Trust compounds. LTV is exponential — each success drives more demand. Legacy platforms profit from churn; Evryn profits from success.
- **The flywheel:** Value compounds after a connection, not just during. You seek a soulmate → then a wedding planner → then a midwife → a babysitter → a new job. The more Evryn knows you, the more verticals open up. Every success fuels growth.

## Safety & Moderation

Safety is structural, not bolted on. Full depth: `docs/hub/trust-and-safety.md`.

- **No open messaging.** Users can't see or contact each other unless Evryn initiates and both opt in. No feeds, no forums, no comment threads.
- **Evryn stays present.** After making a connection, she quietly observes early exchanges. Can intervene, end chats, or remove users from future consideration.
- **Crisis protocols.** Mental health crises → support mode + resources + may escalate to human. Illegal activity → disengage + legal review.

## Current Strategy

**Build stages:** v0.1 (Custom GPT PoC) done → **v0.2 (Mark's Inbox)** ← current → v0.3 (live onboarding) → v0.4 (wizard-of-oz matching) → v1.0 (full matching).

- **v0.2 "Mark's Inbox":** Evryn surfaces connections from Mark's inbox. Mark forwards emails → Evryn identifies who's worth Mark's time (gold/pass/edge case) → drafts notification → Justin approves via email → Evryn delivers. These are connections being brokered, not emails being sorted — tracked as such from day one.
- **Lucas (Chief of Staff agent) PAUSED** — building Evryn product first. Everything transfers back.
- **Website** live at evryn.ai.
- **GTM:** LA film industry first. Why: acute need (everyone either clamoring for attention or drowning in it), dense network (each customer knows hundreds of prime leads), founder advantage (Justin's 78K+ second-gen industry contacts). Two parallel channels: **top-down** via gatekeepers like Mark — high-volume connectors whose ~1,000 weekly cast-offs become Evryn users; **bottom-up** via invite-only "whisper cascade" — grow by solving, proving, and being invited forward. Full depth: `docs/hub/gtm-and-growth.md`.
- **Growth is conversationally embedded.** The ideal landing page is "talk to Evryn." She pitches from the user's vantage point while demonstrating value.

## Technical Architecture

**Stack:** Claude Agent SDK + Supabase (PostgreSQL) + TypeScript. Anthropic Claude for all AI (Sonnet default, Opus for nuance, Haiku for routine). Full depth: `docs/hub/technical-vision.md` (aspirational), `evryn-backend/docs/ARCHITECTURE.md` (current v0.2), `SYSTEM_OVERVIEW.md` (cross-repo components).

**Three Brains (conceptual model):**
1. **Dialogue Brain** — Evryn's voice. Conversation, tone, emotional arcs.
2. **Connection Brain** — Evryn's judgment. Matching, constraint filtering, readiness.
3. **Care Brain** — Evryn's intuition. Watches over time, knows when to act or hold space.

**Dual-track processing:** Warm human conversation + structured metadata collection running in parallel. Analytical layer invisible to the user.

For MVP (v0.2), the three brains collapse into a single agent. At scale, they separate into a council of specialized subagents — plus a **publisher** (safety gate that checks everything before it goes out) and **deception detection**. Detail in `SYSTEM_OVERVIEW.md`.

**User isolation is absolute.** Each user's conversation is its own track. Evryn never reveals one user's information to another. Multi-channel conversations (email, chat, voice) interleave *within* a user by time — same as a real friendship across channels — but never bleed *between* users. Admin access to user data must be heavily gated even from Evryn's own operators (future architecture requirement).

**Script-as-skill, not script-as-constraint.** Evryn receives onboarding scripts + the reasoning behind them, then flows naturally while hitting the same targets. Not a script-follower — a skilled agent who understands the technique.

**Security:** Information firewalling by construction (not instruction). Front-facing Evryn is structurally blind to sensitive data. Zero-trust, defense in depth. "46-inch titanium."

**Internal/external firewalling for Lucas.** Lucas operates both internally (team coordination) and externally (via Evryn). The Hub is internal company truth. Any external-facing derivative must be firewalled so internal-only information cannot leak.

## The Long View

Trust compounds. Evryn's ultimate leverage: owning the trust layer of human connection. The moat is built not just on AI, but on accumulated human outcomes that only Evryn has visibility into. Full depth: `docs/hub/long-term-vision.md`.

The vision: a world where the default is that relationships are high quality and people can be trusted — because they're vetted through a reliable trust broker. Evryn doesn't just connect you to others — she connects you more to yourself. Connection is not a lost art. It's just been buried. Evryn is here to surface what matters.

## Team

- **Justin** — Founder/CEO. Sole human operator. Building everything with Claude Code.
- **Lucas Everhart** — Chief of Staff agent (Claude Agent SDK). Primary autonomous operator. Paused for Evryn build.
- **AI Team** (Lucas subagents): Alex (CTO), Taylor (COO/CFO), Dana (CPO), Dominic (Strategic Advisor), Jordan (CGO), Nathan (Internal Counsel), Thea (EA — separate subagent).
- **Human Advisors:** Andrew Lester (Operations), Salil Chatrath (Product), Manuele Capacci (Design), Megan Griffiths (Film Industry).
- **Legal:** Fenwick & West (strategic legal partner).
- **Pilot User:** Mark (August Island Pictures / Eva's Wild).

## Repositories

| Repo | Purpose | Status |
|------|---------|--------|
| `_evryn-meta` | AC's home. Hub, cross-repo docs | Active |
| `evryn-backend` | Evryn product agent (Mark's Inbox) | Active — building |
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
- **Historical vault (_evryn-meta):** `docs/historical/` — Master Plan Reference (~730 lines, frozen), Master Plan v2.3 (~3,200 lines, frozen original). Go to the original for exact wording, marketing prose, or full competitive analysis.
- **Historical vault (evryn-backend):** `evryn-backend/docs/historical/` — v0.1 system prompt, requirements drafts, prototype schema, n8n prototype

---

*Hub created 2026-02-12 by AC. Expanded 2026-02-20: ethos, connections, safety, long view sections added; domain spokes created; MPR content reorganized into hub-and-spokes wiki.*
