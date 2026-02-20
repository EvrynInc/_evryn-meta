# Evryn System Overview

> **What this doc is:** Technical component breakdown, swim lane status, and infrastructure reference. For company strategy, business model, and team, see [the Hub](docs/hub/roadmap.md).
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

*Last updated: 2026-02-12T16:52:22-08:00*

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

**URLs:**
- Production: https://evryn.ai
- Preview: https://evryn-website.vercel.app
- Old site (rollback): https://evryn-prelaunch.vercel.app

**Done:** Landing page, visual identity, HubSpot waitlist (with Cloudflare Turnstile), SEO/analytics, Open Graph images.
**Next:** Justin has pending updates — see `evryn-website/2026.02.12_Website_Changes_Spec`.

### Evryn Team Agents (`evryn-team-agents` repo)
**What:** Lucas Everhart (Chief of Staff) — single autonomous agent powered by Claude Agent SDK. Other team members exist as perspective lenses spawned as ephemeral subagents.
**Tech:** TypeScript, Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`), MCP servers (Slack, Gmail, Supabase), trigger infrastructure
**Status:** PAUSED — building Evryn product first. Everything transfers back.

**Architecture:** SDK `query()` is the sole runtime. Lucas wakes via trigger (cron for scheduled work, pub/sub for inbound email, potentially more over time), reads his state (file-based memory), decides what needs doing, acts, writes back to state. Subagents spawned via SDK Task tool for team perspectives (one level deep). Slack primary for internal communication, email primarily for external correspondence.

**Key capabilities (planned):** Autonomous briefing compilation, scheduled operations (morning/evening/weekly/monthly), perspective deliberation (#garp), persistent file-based memory, graduated autonomy model, CTO/engineering capability via Alex subagent.

**Done:** Architecture defined (ADR-001), LangGraph archived to `evryn-langgraph-archive`, build spec drafted.
**Next (when resumed):** SDK build per `evryn-team-agents/docs/BUILD-LUCAS-SDK.md`. Team profiles need Justin's review.

### Evryn Backend (`evryn-backend` repo)
**What:** Evryn product agent — connection broker, starting with Mark's inbox as the first source
**Tech:** TypeScript, Claude Agent SDK, Gmail API (evryn@evryn.ai — own Google account), Supabase, Slack (Justin channel)
**Status:** Active — AC pre-work in progress, preparing build spec and architecture doc for DC

**MVP workflow:** Evryn surfaces connections from Mark's inbox. Mark forwards emails → Evryn identifies who's worth Mark's time (gold/pass/edge case) → drafts notification → Justin approves via email → Evryn sends to Mark. These are connections being brokered — tracked as such from day one. Evryn interviews Mark to learn what "gold" means to him. Cast-offs deferred to Phase 2 (Gmail inbox is the capture mechanism).

**Architectural principles (detail in `evryn-backend/docs/ARCHITECTURE.md`):**
- **User isolation is absolute** — conversations never bleed between users. Multi-channel interleaves within one user by time, never across users.
- **For MVP, Justin is the publisher** — approves all outbound. At scale, an automated publisher subagent takes over (safety checklist: inappropriate content, user info leaks, tone).
- **Proactive behavior is core** — even in v0.2, Evryn should notice if Mark goes quiet and reach out. She's not Evryn if she only reacts.
- **Three Brains collapse for MVP, separate at scale** — see Hub for the conceptual model.

**Done:** Repo created (2026-02-10), build spec drafted, all blockers cleared (v0.1 prompt analyzed, prototype analyzed, schema analyzed).
**Next:** AC pre-work (build spec rewrite, source absorption, ARCHITECTURE.md creation) → DC builds Phase 0 → Phases 1-3.

**For build detail:** See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

### Supabase Database
**What:** PostgreSQL database + serverless backend
**Status:** LIVE — two separate projects

**Agent dashboard project (evryn-team-agents):**
- `agent_messages` — Every email sent/received with full body
- `agent_api_calls` — Every Claude API call with cost, tokens, model
- `agent_notes_history` — Snapshots of agent notes over time
- `agent_tasks` — Tasks agents create for themselves or others
- `agent_daily_spend` — Aggregated daily spend per agent
- Dashboard at evryn-dashboard.vercel.app

**Evryn n8n prototype project (evryn-backend):**
- `emailmgr_items`, `emailmgr_queue`, `evryn_knowledge`, `messages`, `users`
- Schema analysis at `evryn-backend/docs/historical/prototype-schema-analysis.md`
- Product tables will evolve during build — schema finalized in build spec
- **Note:** This project should be renamed to "evryn-backend" and appropriated for the product build — existing tables are likely usable as-is

**Security:** RLS enabled on ALL tables. Only service_role key (in `.env`, never exposed) can access data. pg_cron for scheduled triggers.

### HubSpot
**What:** CRM and email marketing  
**Status:** Connected  
**Purpose:** Waitlist capture, future email campaigns

### Claude API (Anthropic)
**What:** AI powering Lucas agent (planned) + development tool (Claude Code)
**Status:** Claude Code (with AC/DC pattern) actively builds the system. Lucas agent not yet running — SDK build in progress.
**Purpose:** Agent execution (Sonnet default, Opus for hard/nuanced/multilingual thinking, Haiku for routine tasks). Claude Code for development.

### iDenfy
**What:** Identity verification  
**Status:** Chosen  
**Purpose:** Verify users are real humans before allowing connections

**Why iDenfy:** Jumio was the next best option with a more robust feature set, but their minimum contract was cost-prohibitive. iDenfy is more than adequate for our needs for at least the first few years. Worth reconsidering Jumio when we're significantly larger.

---

## Product Roadmap Sequence

1. **Website** — ✅ COMPLETE. LIVE at evryn.ai. See swim lane in Components above.
2. **Mark's Inbox MVP (v0.2)** — IN PROGRESS. Evryn surfaces connections from Mark's inbox — proving the gatekeeper pathway works. Full detail in `evryn-backend/docs/BUILD-EVRYN-MVP.md`, architecture in `evryn-backend/docs/ARCHITECTURE.md`.
3. **Member Interface** — FUTURE. Web/mobile interface (PWA, mobile-responsive from day one). Native apps deferred until user demand warrants it. Includes iDenfy verification flow.

---

## Data Flow: Mark's Inbox — Connection Brokering (Planned)

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
3a. Connection Discovery       3b. Conversation Pathway
   • Extract original sender       • Respond to Mark directly
   • Sender → users table          • Normal Evryn conversation
   • Identify connection fit:
     gold / pass / edge case
   • Score confidence
   │
   ▼
4. Surface & Broker
   • Gold + edge case → Draft notification → Justin approves → Mark receives
     (edge cases include Evryn's reasoning and uncertainty)
   • Pass → No notification to Mark (for now)
   • Connection tracked (identified → pending_approval → surfaced → connected/declined)
   • Mark's feedback → Evryn learns, improves
   • Every sender is a new Evryn user — finding Mark is just their first connection
```

---

## External Services

| Service | Purpose | Account/Project |
|---------|---------|---------|
| **Vercel** | Website hosting | `evryn-website` (production), `evryn-prelaunch` (archived) |
| **GitHub** | Code repos | EvrynInc |
| **Supabase** | Database | Evryn |
| **HubSpot** | CRM, waitlist | Evryn |
| **Cloudflare** | Turnstile captcha | Evryn |
| **Anthropic** | Claude API (agent execution) + Claude Code (development) | API credits + Claude Code subscription |
| **Google Cloud** | Gmail API (live polling), Pub/Sub (scaffolded, not wired) | Evryn project |
| **Linear** | Backlog and issue tracking (EVR workspace) | Free tier |
| **iDenfy** | Identity verification | Chosen, not yet integrated |
| **Vapi** | Voice AI platform (future) | Researched, not yet integrated |
| **Hume AI** | Emotion detection for voice (future) | Researched, not yet integrated |
| **ElevenLabs** | Voice synthesis (future) | Researched, not yet integrated |

---

## Revision History

| Date | Change |
|------|--------|
| 2026-01-16 | Initial document created |
| 2026-01-20 | Removed n8n - all backend built in code via Claude Code. Added _evryn-meta repo. Updated architecture diagram. Aligned "brains" with PRD concepts. Added iDenfy rationale. Updated Supabase tables to current state. Added two-pathway flow for Mark's triage. |
| 2026-01-21 | Website LIVE at evryn.ai. Updated Vercel project info. Added Cloudflare to external services. Priority 1 marked complete. |
| 2026-01-22 | Added evryn-team-agents repo (AI executive team). Created LEARNINGS.md and AGENT_PATTERNS.md for cross-project knowledge capture. Architecture complete. Code scaffolded overnight - ready for credentials and testing. |
| 2026-01-23 | Team agents update: AA Alex (email/API) is primary interface, CC Alex (terminal) occasional. Gmail push notifications via Pub/Sub instead of polling. Billing switch to Pro + API credits. Added Google Cloud to external services. |
| 2026-01-23 | Gmail aliases configured on agents@evryn.ai. Catch-all routing to Thea. Voice integration researched (Vapi + Hume AI) for future Phase 4. Added voice AI platforms to external services (future). |
| 2026-01-24 | Team structure update: AI executive team is now primary operations, human team members (Andrew, Salil, Manuele) moving to advisor roles. Added company-context.md to evryn-team-agents for agent context. |
| 2026-01-31 | Major update: evryn-team-agents Phase 1 complete (LangGraph runtime, 3 triggers, all verified). Supabase tables updated to reflect agent infrastructure. Claude API now live. Added Linear. Updated repo statuses. |
| 2026-02-06 | Architecture pivot: LangGraph multi-agent replaced by single Lucas agent on Claude Agent SDK. Updated team agents section, repos table, Claude API section, key contacts. Build spec DRAFT in progress. |
| 2026-02-10 | Strategic pivot: building Evryn product MVP for Mark first (Lucas paused). Created evryn-backend repo. LangGraph archived to evryn-langgraph-archive. Added evryn-dev-workspace, evryn-langgraph-archive to repos. Cast-offs resolved (Phase 2, Gmail captures). |
| 2026-02-12 | Tightened: stripped Hub-duplicate sections (philosophy, brains, contacts, repos, open questions). Added swim lane status (Done/Next) to each component. Updated Supabase to show two projects. Slimmed Current Priorities to Product Roadmap Sequence. |
