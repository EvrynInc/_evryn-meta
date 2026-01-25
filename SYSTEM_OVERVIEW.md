# Evryn System Overview

The central reference document for how all the pieces of Evryn fit together.

*Last updated: January 24, 2026*

---

## What is Evryn?

Evryn is an AI-powered relationship broker. She finds you "your people" — the rare individuals who are just the right fit for you in any domain of life — and only connects you to people she trusts.

**Company:** Evryn Inc. (Public Benefit Corporation)  
**Founder:** Justin  
**Stage:** Pre-launch, building MVP

---

## Core Philosophy

**"Stories over structures"**  
We capture the *feel* of a person through narrative-based profiles, not checkboxes and filters.

**Trust is non-negotiable**  
Evryn only connects people she trusts. She gets to know each user, evaluates character in relation to the type of connection. Verification (proving you're a real person) is part of the core offering.

**Character becomes currency**  
In Evryn's world, who you are matters more than what you have.

**Aligned incentives**  
You pay only when a connection genuinely works for you. Evryn's success and your success are always the same thing.

---

## System Architecture (Current)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EVRYN SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐                         ┌─────────────────┐      │
│   │  EVRYN WEBSITE  │                         │    SUPABASE     │      │
│   │  (evryn.ai)     │                         │    DATABASE     │      │
│   │                 │                         │                 │      │
│   │  • Landing page │                         │  Current tables │      │
│   │  • Waitlist     │                         │  (see below)    │      │
│   │                 │                         │                 │      │
│   │  Repo: evryn-   │                         │  Schema will    │      │
│   │  website        │                         │  evolve as we   │      │
│   │                 │                         │  build          │      │
│   │  Tech: Next.js  │                         │                 │      │
│   │  Host: Vercel   │                         └────────┬────────┘      │
│   └─────────────────┘                                  │                │
│                                                        │                │
│   ┌─────────────────────────────────────────┐          │                │
│   │          EVRYN BACKEND                  │          │                │
│   │          (built by Claude Code)         │◄─────────┘                │
│   │                                         │                           │
│   │  Conversational Core:                   │     ┌─────────────────┐  │
│   │  • Onboarding & intake                  │     │   ANTHROPIC     │  │
│   │  • Intent collection                    │     │   (Claude API)  │  │
│   │  • Check-ins & relationship warmth      │◄────│                 │  │
│   │  • Matching                             │     │  AI brain for   │  │
│   │  • Post-match follow-up & learning      │     │  all agents     │  │
│   │                                         │     └─────────────────┘  │
│   │  Supporting Modules:                    │                           │
│   │  • Email intake & routing               │                           │
│   │  • Safety/voice (publisher agent)       │                           │
│   │  • Deception detection                  │                           │
│   │                                         │                           │
│   │  Admin:                                 │                           │
│   │  • Dashboard & monitoring               │                           │
│   └─────────────────────────────────────────┘                           │
│                                                                         │
│   ┌─────────────────┐     ┌─────────────────┐                          │
│   │    HUBSPOT      │     │     iDENFY      │                          │
│   │                 │     │                 │                          │
│   │  • Waitlist     │     │  • ID verify    │                          │
│   │  • Email mktg   │     │  • Trust layer  │                          │
│   │                 │     │                 │                          │
│   └─────────────────┘     └─────────────────┘                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components Explained

### Evryn Website (`evryn-website` repo)
**What:** Public marketing site at evryn.ai
**Tech:** Next.js 15 on Vercel
**Status:** LIVE
**Purpose:** Explain what Evryn is, capture waitlist signups

**URLs:**
- Production: https://evryn.ai
- Preview: https://evryn-website.vercel.app
- Old site (rollback): https://evryn-prelaunch.vercel.app

### Evryn Backend (future `evryn-backend` repo)
**What:** All agent logic, built by Claude Code  
**Tech:** TBD (likely Node.js or Python - CC will determine what's best)  
**Status:** After website

**Conversational Core:**
- Onboarding - getting to know new users
- Intent collection - what are you looking for?
- Check-ins - keeping the relationship warm while waiting for matches
- Matching - finding the right people
- Post-match follow-up - learning from outcomes

**Supporting Modules:**
- Email intake & routing
- Publisher agent - ensures Evryn says what we want her to say (safety, voice, no secrets leaked)
- Deception detection - scanning for bad actors

**Admin:**
- Dashboard for monitoring and management

*Note: Architecture will emerge as we build. These are the capabilities needed, not a rigid structure.*

### Supabase Database
**What:** PostgreSQL database  
**Status:** Set up with initial tables

**Current tables:**
- `emailmgr_items`
- `emailmgr_queue`
- `evryn_knowledge`
- `messages`
- `users`

*Schema will evolve as we build. This is where we're at, not what we're married to.*

### HubSpot
**What:** CRM and email marketing  
**Status:** Connected  
**Purpose:** Waitlist capture, future email campaigns

### Claude API (Anthropic)
**What:** AI powering all the agents  
**Status:** Will be connected via backend code  
**Purpose:** Classification, conversation, matching logic

### iDenfy
**What:** Identity verification  
**Status:** Chosen  
**Purpose:** Verify users are real humans before allowing connections

**Why iDenfy:** Jumio was the next best option with a more robust feature set, but their minimum contract was cost-prohibitive. iDenfy is more than adequate for our needs for at least the first few years. Worth reconsidering Jumio when we're significantly larger.

---

## Current Priorities

### Priority 1: Website ✅ COMPLETE
Get a landing page Justin is proud to share.
- New visual identity (aqua/teal, Seed of Life)
- Simplified copy (finalized)
- HubSpot waitlist integration (with Cloudflare Turnstile captcha)
- **Status:** LIVE at evryn.ai

### Priority 2: Mark's Triage MVP
Prove the "gatekeeper" concept works.
- Mark forwards his 200 daily emails to Evryn
- Evryn classifies: gold vs. services spam vs. other
- Evryn surfaces ~1-2 "gold" opportunities per week
- Mark provides feedback to improve accuracy

**Two pathways when Evryn receives email from Mark:**
1. **Forward detected** → Triage pathway (classify, route, surface gold)
2. **Direct message from Mark** → Conversation pathway (talk to him directly)

**Success criteria:** Mark stops manually sorting and trusts Evryn to surface what matters.

### Priority 3: Member Interface
Let users talk to Evryn through a web/mobile interface rather than email.
- Built by Claude Code
- Mobile-responsive from day one (PWA for "app-like" experience)
- Native apps (App Store) deferred until user demand warrants it
- Includes verification flow (iDenfy)

---

## The Evryn Brains (Conceptual Architecture)

The full Evryn vision involves specialized "brains" working together:

| Brain | Role | Description |
|-------|------|-------------|
| **Dialogue Brain** | Conversation | The voice of Evryn - listens, responds, feels like a wise friend |
| **Care Brain** | Relational intelligence | Remembers context, notices silence, knows when to check in or hold space |
| **Connection Brain** | Matchmaking | Finds mutual fits based on deep resonance, not just similarity |
| **Trust Graph** | Memory of character | Tracks who treats others well, gates who gets connected |

These are conceptual. Building starts simple and evolves toward this architecture.

---

## Data Flow: Mark's Triage (Planned)

```
1. Email arrives at evryn@evryn.ai from Mark
                    │
                    ▼
2. Backend Email Intake determines type:
   ┌────────────────┴────────────────┐
   │                                 │
   ▼                                 ▼
FORWARD DETECTED               DIRECT MESSAGE
(someone emailed Mark,         (Mark writing to Evryn)
 he forwarded to Evryn)              │
   │                                 │
   ▼                                 ▼
3a. Triage Pathway             3b. Conversation Pathway
   • Extract original sender       • Respond to Mark directly
   • Write to triage_queue         • Normal Evryn conversation
   • Classify: gold/spam/other
   • Score confidence
   │
   ▼
4. Review & Surface
   • High-confidence gold → Notify Mark
   • Edge cases → Flag for review
   • Mark's feedback → Improves classification
```

---

## Repositories

| Repo | Purpose | Status |
|------|---------|--------|
| `_evryn-meta` | System-wide documentation | Active |
| `evryn-website` | Marketing site | LIVE |
| `evryn-team-agents` | AI executive team (C-suite agents) | Building |
| `evryn-prelaunch-landing` | Old landing page | Archived |
| `evryn-app` | Member product UI | Future |
| `evryn-backend` | API, agents, admin tools | Future |

---

## External Services

| Service | Purpose | Account/Project |
|---------|---------|---------|
| **Vercel** | Website hosting | `evryn-website` (production), `evryn-prelaunch` (archived) |
| **GitHub** | Code repos | EvrynInc |
| **Supabase** | Database | Evryn |
| **HubSpot** | CRM, waitlist | Evryn |
| **Cloudflare** | Turnstile captcha | Evryn |
| **Anthropic** | Claude API + Claude Code | Claude Pro subscription + API credits |
| **Google Cloud** | Pub/Sub for Gmail push notifications | Evryn project |
| **iDenfy** | Identity verification | Chosen, not yet integrated |
| **Vapi** | Voice AI platform (future) | Researched, not yet integrated |
| **Hume AI** | Emotion detection for voice (future) | Researched, not yet integrated |
| **ElevenLabs** | Voice synthesis (future) | Researched, not yet integrated |

---

## Key Contacts

**Leadership:**
- **Justin** — Founder/CEO, building everything with Claude Code

**AI Executive Team (Primary Operations):**
- See `evryn-team-agents/agents/` for the full C-suite (Thea, Taylor, Jordan, Dana, Dominic, Nathan, Lucas, Alex)
- This is the primary operating team

**Human Advisors:**
- **Andrew Lester** — Operations Advisor
- **Salil Chatrath** — Product Advisor
- **Manuele Capacci** — Design Advisor
- **Megan Griffiths** — Film Industry Advisor

**Pilot Users:**
- **Mark** — First gatekeeper user (August Island Pictures, Eva's Wild)

---

## Open Questions

1. ~~Where should this document live?~~ → Resolved: `_evryn-meta` repo
2. ~~What verification provider to use?~~ → Resolved: iDenfy
3. ~~At what scale does n8n need to be replaced with code?~~ → Resolved: Building in code from start
4. How to handle the "cast-offs" from Mark's triage — the 999 rejected emails that could become Evryn users?

---

## Revision History

| Date | Change |
|------|--------|
| 2025-01-16 | Initial document created |
| 2025-01-20 | Removed n8n - all backend built in code via Claude Code. Added _evryn-meta repo. Updated architecture diagram. Aligned "brains" with PRD concepts. Added iDenfy rationale. Updated Supabase tables to current state. Added two-pathway flow for Mark's triage. |
| 2025-01-21 | Website LIVE at evryn.ai. Updated Vercel project info. Added Cloudflare to external services. Priority 1 marked complete. |
| 2025-01-22 | Added evryn-team-agents repo (AI executive team). Created LEARNINGS.md and AGENT_PATTERNS.md for cross-project knowledge capture. Architecture complete. Code scaffolded overnight - ready for credentials and testing. |
| 2025-01-23 | Team agents update: AA Alex (email/API) is primary interface, CC Alex (terminal) occasional. Gmail push notifications via Pub/Sub instead of polling. Billing switch to Pro + API credits. Added Google Cloud to external services. |
| 2025-01-23 | Gmail aliases configured on agents@evryn.ai. Catch-all routing to Thea. Voice integration researched (Vapi + Hume AI) for future Phase 4. Added voice AI platforms to external services (future). |
| 2025-01-24 | Team structure update: AI executive team is now primary operations, human team members (Andrew, Salil, Manuele) moving to advisor roles. Added company-context.md to evryn-team-agents for agent context. |
