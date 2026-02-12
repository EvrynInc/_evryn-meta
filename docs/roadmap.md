# Evryn — The Hub

> **Living source of truth.** Loaded every session by every agent. If your notes contradict this document, flag the discrepancy — don't silently override.
> **Tactical status:** `_evryn-meta/docs/current-state.md` (what's in flight, blockers, infrastructure).

---

## What Evryn Is

An AI-powered relationship broker. She finds you "your people" — the rare individuals who are the right fit — and only connects you to people she trusts. Not a dating app, not a networking tool, not a marketplace. A trust-based connection engine across all life domains: soulmate, cofounder, plumber, creative collaborator, hookup, someone who'd pay $100 for the thing you were about to throw away.

**Design philosophy:** Stories over structures. Trust is non-negotiable. Character becomes currency. Aligned incentives. The first resonance is between you and Evryn; the ultimate resonance is between you and yourself.

**Entity:** Evryn Inc., Delaware Public Benefit Corporation. Mission-locked.

## Trust Architecture

Trust is the operating system, not a feature. Evryn only connects people in proportion to how much she trusts them.

- **Trust is a story, not a score.** Multi-dimensional, context-specific. Structured as a document in the user profile, not a number.
- **Character becomes currency.** Behavioral, not performative. What you've done and how it impacted others.
- **You're always in control.** No manipulation, no auto-invites, no fake urgency, no gamification, no ads, no data selling.
- **Behavioral filtering, not belief filtering.** Filters predatory behavior, deception, coercion — not politics or worldview.
- **Trust imprint on deletion.** Personal data purged; non-reversible hash anchors trust memory so bad actors can't reset.
- **Identity verification** before connections. Relational framing, not bureaucratic.

## Business Model

Evryn is a **broker**, not a SaaS. Everyone is a "user" — both sides pay per-connection.

- **Trust-based pricing:** Users pay what they believe is fair. 100% satisfaction guarantee.
- **Three revenue streams:** (1) Match payments, (2) Post-match transactions (Stripe Connect), (3) Participant-based business access ("ads without ads").
- **Structural moat:** Trust compounds. LTV is exponential — each success drives more demand. Legacy platforms profit from churn; Evryn profits from success.

## Current Strategy

**Build stages:** v0.1 (Custom GPT PoC) done → **v0.2 (Mark's Inbox)** ← current → v0.3 (live onboarding) → v0.4 (wizard-of-oz matching) → v1.0 (full matching).

- **v0.2 "Mark's Inbox":** Pilot user Mark forwards emails → Evryn classifies (gold/pass/edge case) → drafts notifications → Justin approves via email → Evryn delivers.
- **Lucas (Chief of Staff agent) PAUSED** — building Evryn product first. Everything transfers back.
- **Website** live at evryn.ai.
- **GTM:** LA film industry first (tight-knit, high need, Justin's network). Bottom-up wave strategy. Invite-only "whisper cascade." Grow by solving, proving, and being invited forward.
- **Growth is conversationally embedded.** The ideal landing page is "talk to Evryn." She pitches from the user's vantage point while demonstrating value.

## Technical Architecture

**Stack:** Claude Agent SDK + Supabase (PostgreSQL) + TypeScript. Anthropic Claude for all AI (Sonnet default, Opus for nuance, Haiku for routine).

**Three Brains (conceptual model):**
1. **Dialogue Brain** — Evryn's voice. Conversation, tone, emotional arcs.
2. **Connection Brain** — Evryn's judgment. Matching, constraint filtering, readiness.
3. **Care Brain** — Evryn's intuition. Watches over time, knows when to act or hold space.

**Dual-track processing:** Warm human conversation + structured metadata collection running in parallel. Analytical layer invisible to the user.

For MVP (v0.2), the three brains collapse into a single agent. Separation matters for scaling.

**Script-as-skill, not script-as-constraint.** Evryn receives onboarding scripts + the reasoning behind them, then flows naturally while hitting the same targets. Not a script-follower — a skilled agent who understands the technique.

**Security:** Information firewalling by construction (not instruction). Front-facing Evryn is structurally blind to sensitive data. Zero-trust, defense in depth. "46-inch titanium."

**Internal/external firewalling for Lucas.** Lucas operates both internally (team coordination) and externally (via Evryn). The Hub is internal company truth. Any external-facing derivative must be firewalled so internal-only information cannot leak.

## Team

- **Justin** — Founder/CEO. Sole human operator. Building everything with Claude Code.
- **Lucas Everhart** — Chief of Staff agent (Claude Agent SDK). Primary autonomous operator. Paused for Evryn build.
- **AI Team** (Lucas subagents): Alex (CTO), Taylor (COO/CFO), Dana (CPO), Dominic (Strategic Advisor), Jordan (CGO), Nathan (Internal Counsel), Thea (EA — separate subagent).
- **Human Advisors:** Andrew Lester (Operations), Salil Chatrath (Product), Manuele Capacci (Design), Megan Griffiths (Film Industry).
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

## Spokes (Domain Depth)

Load only when your current task requires the depth.

- **Tactical status:** `_evryn-meta/docs/current-state.md`
- **Historical vault (_evryn-meta):** `_evryn-meta/docs/historical/` — Master Plan Reference, Master Plan v2.3
- **Historical vault (evryn-backend):** `evryn-backend/docs/historical/` — v0.1 system prompt, requirements drafts, prototype schema, n8n prototype
- **Evryn product build:** `evryn-backend/docs/BUILD-EVRYN-MVP.md`
- **Lucas agent build:** `evryn-team-agents/docs/BUILD-LUCAS-SDK.md`
- **AC/DC protocol:** `_evryn-meta/docs/ac-dc-protocol.md`
- **Decision log:** `_evryn-meta/docs/decisions/`
- **System overview:** `_evryn-meta/SYSTEM_OVERVIEW.md` (detailed component breakdown, external services)
- **Company context (for Lucas):** `evryn-team-agents/modules/company-context.md`

---

*Hub created 2026-02-12 by AC. Synthesized from Master Plan, SYSTEM_OVERVIEW, company-context, v0.1 system prompt analysis, and Session 2 architectural insights.*
