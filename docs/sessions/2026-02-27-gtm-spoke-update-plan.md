# GTM Spoke Update + Build Phase Rethink — Session Working Doc

> **Session:** 2026-02-27
> **Status:** COMPLETE. Phase labels finalized (v0.2/v0.3/v0.4). GTM spoke fully revised (2026-02-28). Business model revision notes captured. See continuation session: `docs/sessions/2026-02-28-business-model-revision-notes.md`.

This session started as GTM spoke edits but surfaced two strategic corrections and evolved into a full build-phase rethink + sprint plan.

**Key outputs this session:**
1. Whisper cascade reframing (trust mechanics, not artificial scarcity)
2. Build phases restructured (old v0.3/v0.4 collapsed — cast-off outreach needs matching needs vector search needs web app)
3. Pre-Work #6 reframed: building Evryn's identity, not a classifier. v0.1 scripts are the foundation — adaptation, not creation.
4. Evryn's conversational capability in v0.2 transfers directly to cast-off outreach — same Evryn, new audience.
5. **5-day sprint plan written → `evryn-backend/docs/SPRINT-MARK-LIVE.md`** — Mark live by end of week of March 3.
6. Parallel streams mapped: AC designs Build 2 (graph schema, web app) during sprint week so DC transitions immediately after.

**What's NOT done:** ~~GTM spoke draft~~ (done 2026-02-28), ~~phase label finalization~~ (done 2026-02-28), BUILD-EVRYN-MVP.md revision (deferred, warning banner in place), ~~Hub GTM paragraph update~~ (done 2026-02-28).

---

## Strategic Corrections Identified This Session

### 1. Whisper Cascade Reframing

The current GTM spoke frames the whisper cascade as "invite-only" artificial scarcity. That's wrong. The cascade emerges *organically from how trust works:*

Evryn connects people based on how much she trusts them. New users have low trust — Evryn can get a good vibe, but can't vouch for them yet. So she says: "I'd like to connect you, but since I only connect people I trust enough, I need to get to know you better. We can stick to low-stakes connections, I can connect you to people who are cool meeting someone I can't fully vouch for — but one of the best ways is for people I already trust to vouch for you. Go talk to your friends and see if they know me. If they vouch for you, as my trust for them grows, my trust for you grows. And vice versa."

This creates the cascade: "Do you know Evryn? Do you know Evryn?" In Hollywood, that's status-signal catnip. Follow up with a billboard or targeted ads and you get real synergy.

**What this changes:** The whisper cascade section needs a full rewrite around trust mechanics as the growth engine, not artificial exclusivity. The detailed trust-ramp conversation (low-stakes connections, vouching, trust growing together) is UX/trust-and-safety depth — the GTM spoke captures the *growth mechanic* concisely.

### 2. Build Phases Need Restructuring

The old phasing was:
- v0.2 "Gatekeeper's Inbox" — triage for Mark
- v0.3 "Cast-off Outreach + Onboarding"
- v0.4 "Wizard-of-Oz Matching"
- v1.0 "Full Matching"

**Problem:** Cast-off outreach without matching is useless. If Evryn says "I'd love to help you find what you're looking for" but can't actually do anything, the relationship dies on first contact. And at 200 new users/day from Mark alone (fragmented — film, Alaskan natives, salmon business), analytical matching without vector search is both impossible (context window) and ruinously expensive (API costs). Within 30 days that's 6,000 profiles.

**Revised build sequence (see detailed breakdown below):**
1. **Build 1: Triage** — Mark's inbox, as currently scoped
2. **Build 2: The Product** — web app + matching + payments + cast-off outreach (cast-offs are the *acquisition channel*, not a separate phase)
3. **Build 3: Scale** — second gatekeeper, publisher module, proactive outreach, agents

---

## Revised Build Sequence — Full Detail

### Build 1: Triage (~3 weeks for DC)

Everything in BUILD-EVRYN-MVP.md. Email polling, forward detection, triage (gold/pass/edge), Justin approval gate, user records for every sender, Slack alerts, monitoring. Mark is running. User records start accumulating.

**Why still the right first step:** Commitment to Mark. Proves the SDK pattern. Starts populating real user data. Dramatically simpler than what comes next — if the SDK surprises us, we learn it here.

**Critical: Pre-Work #6 (Evryn's system prompt) must be scoped as Evryn's full identity, not just a triage classifier.** Evryn needs to talk to Mark as herself — answer his questions, explain how things work, have real conversations. If we build her identity right in v0.2, the same conversational intelligence transfers directly to cast-off outreach and onboarding. The transition isn't "build a new Evryn" — it's "point the same Evryn at new people." Pre-Work #6 is building Evryn, not building a classifier.

**What Evryn needs to know about herself for v0.2:**
- Who she is (personality — warm, wise, curious, principled, runs her own shop)
- How she works (trust-based connections, double opt-in, pay-what's-fair)
- What she's doing right now (helping Mark, learning, getting started)
- What she can't do yet (honest — "I'm still building my network")
- Onboarding patterns from v0.1 (Dream with me, Smart Curiosity, More About Me)
- Loaded via `evryn_knowledge` modules, not a massive system prompt

**While DC builds triage, AC architects Build 2** — web app design, relationship graph schema, embedding pipeline design. The two hardest design problems (graph schema, web app) need to be solved before DC starts Build 2.

### Build 2: The Product (~6-8 weeks)

This is the real thing. Sub-pieces are deeply intertwined — can't ship matching without the app, can't ship the app without auth, can't ship payments without the connection lifecycle.

**Layer 1 — Foundation (~2 weeks)**
- Supabase Auth (magic link — user clicks link in email, they're in, zero friction)
- Minimal web app (Next.js PWA, chat interface with Evryn, deployed)
- Relationship graph + connection records schema (resolving open design question in ARCHITECTURE.md)
- Story model working (triage observations → pending_notes → synthesized stories)

**Layer 2 — Intelligence (~2 weeks)**
- Embedding pipeline (generate vectors from user stories/intents, store in pgvector)
- Onboarding conversation pathway (Evryn gets to know people through the app)
- Vector search for match candidates
- Evryn's analytical judgment on top of vector results

**Layer 3 — Brokering (~2 weeks)**
- Connection lifecycle (discovered → proposed → accepted/declined → completed)
- Bilateral consent flow (the "Evryn Dance" from UX spoke)
- Stripe integration (trust-based pricing — user names their price)
- Justin-in-the-loop approval for matches
- iDenfy identity verification (before first connection, not before exploration)

**Layer 4 — Acquisition (~1-2 weeks)**
- Cast-off outreach via email → brings people to web app ("You reached out to Mark... here's where we can talk: [link]")
- Onboarding flow for inbound users from cast-off outreach
- QC/OC pipeline comes online (real code to review, real infra to run)

**Why the web app is necessary (not premature):**
- Stripe needs a web interface
- iDenfy verification needs a web interface
- Email is insecure for sensitive personal information — Evryn's brand is trust
- Auth gives Evryn certainty about who she's talking to
- The "texting with Evryn" UX is the target product experience
- Email remains the *acquisition channel* (how people find Evryn) — the app is where the relationship lives

**Revenue starts flowing:** During Layer 3 — first brokered connection with payment. Target: late April / early May 2026.

### Build 3: Scale (after Build 2 working)

- Second gatekeeper
- Publisher module replacing Justin for routine approvals
- Proactive outreach (check-ins, care module)
- Algorithmic matching refinements
- Lucas + agents come online to manage operations while Justin focuses on product

### Dev Pipeline Infrastructure

AC designs → DC builds → QC reviews → OC runs (ADR-009). QC comes online at Build 2 Layer 4 when there's real application code to review. OC comes online alongside or shortly after. AC creates their repos and CLAUDE.md files.

---

## GTM Spoke Edits — Updated Plan

The edits from the prior session are still mostly valid, but phase annotations need to use the revised build sequence (Build 1/2/3 or revised version labels — TBD) instead of the old v0.2/v0.3/v0.4/v1.0. The whisper cascade section needs a full rewrite around trust mechanics.

### Prior Session Work (still valid)
1. Film industry AI disruption research → `docs/research/film-industry-ai-disruption-v1.md`
2. Competitive landscape research → `docs/research/competitive-landscape-v1.md`
3. Master Plan lines read and integration points identified

### Edits Still Planned (with modifications)
1. **Phase-annotate sections** — using revised build phases, not old v0.2-v1.0
2. **Elevate "industry in transition"** — unchanged
3. **Build out Launch Readiness Discipline** — unchanged
4. **Add Outreach Playbook** — unchanged
5. **Clear Master Plan references** — unchanged
6. **Competitive Landscape refresh** — unchanged
7. **Whisper cascade rewrite** — NEW (trust mechanics, not artificial scarcity)
8. **Final consistency pass** — now includes cross-check against revised build phases

### Blocker
Phase annotations can't be finalized until the revised build phases are approved and the Hub/BUILD docs are updated. The rest of the edits (industry transition, launch readiness, outreach playbook, competitive landscape, whisper cascade) can proceed independently.

---

## Research Report Key Findings (carried forward)

### Film Industry (docs/research/film-industry-ai-disruption-v1.md)
- Sora 2 + Runway Gen-4 solved jitter problem. Professional adoption year.
- 41K LA jobs lost. 204K projected displaced. 17K+ slashed in 2025 alone.
- Entry-level pipeline broken — compositing, rotoscoping, rough edits absorbed by AI.
- All union contracts expire mid-2026 (SAG-AFTRA June 30, DGA June 30, WGA May 1, IATSE July 31)
- Studios offering 5-year contracts (vs 3-year) for $100M health plan money
- LA production down: 22.4% Q1 2025, 16.1% full-year. Only 24/87 scripted projects filmed partly in LA.
- New roles emerging: AI supervisors, pipeline integrators, prompt engineers for film

### Competitive Landscape (docs/research/competitive-landscape-v1.md)
- Overtone: Hinge CEO left to build AI+voice dating. Match Group backing. HIGH WATCH.
- Amata: Closest UX competitor. AI matchmaker, no swiping, $20/match. Dating-only, thin trust. $6M funding.
- Osmos: Professional networking. 1 curated match/week. Double opt-in. Validates model.
- No one is cross-domain. No one has compounding trust graph. No one does trust-based pricing.

---

## Pre-Sprint Blocker (Saturday, March 1)

**Pre-Work #6 SDK question — must resolve before Monday.** The sprint plan has AC writing Evryn's system prompt on Monday. But there's an unresolved question from the Pre-Work #6 session (`docs/sessions/2026-02-24-pre-work-6-session-1.md`): in the Claude Agent SDK, does `systemPrompt` supplement or replace content loaded via `setting_sources` (like CLAUDE.md)? This determines the entire architecture of how Evryn's identity gets structured — monolithic system prompt vs. layered CLAUDE.md + prompt. If we don't answer this Saturday, Monday's AC work starts with a research detour instead of creative work.

---

## Open Questions — Resolution Status

1. **~~Revised build phase names/numbers.~~** RESOLVED (2026-02-28): v0.2 "Gatekeeper's Inbox" / v0.3 "The Broker" / v0.4 "Scale". Soft dates added to GTM spoke and Hub.
2. **Web app home.** Still open. Does it live in evryn-backend? A new repo? The evryn-website repo?
3. **~~Hub GTM paragraph.~~** RESOLVED (2026-02-28): Updated with finalized phases, target dates, financial reality, geographic correction (PNW ignition).
4. **BUILD-EVRYN-MVP.md.** Still needs revision for new phasing. Warning banner is in place. Will revise after sprint stabilizes.
5. **ARCHITECTURE.md.** Still open. Relationship graph "open design question" is on the critical path for v0.3. AC needs to resolve before DC starts.
