# Session: Cowork Onboarding — March 27, 2026

> **What this is:** First Claude Cowork session with Justin. Established the working relationship, process, and role that Cowork will play going forward. Contains session outcomes, decisions, open threads, and bootstrapping instructions for future sessions.

---

## Session Summary

Justin onboarded Claude Cowork as a strategic planning and operations layer — the role Lucas/Thea were designed to fill, but without requiring a custom build. Cowork now has access to: all repos (via the shared `Code/` directory), Gmail (justin@evryn.ai), Google Drive (evryn.ai workspace), and Linear (EVR workspace).

Session covered: work priorities briefing, Fenwick legal strategy (scope alignment with Andrea, deferral approach with Andy), process/workflow design, and the decision to use Cowork as the agent team layer.

---

## What We Did

- Connected Gmail, Linear, Google Drive
- Read Hub + all spokes, Linear backlog, Fenwick email threads
- Wrote work priorities briefing → `docs/sessions/historical/2026-03-25-work-priorities-briefing.md`
- Developed Fenwick strategy: scope confirmation with Andrea (Justin sent March 26), deferral approach with Andy (sent March 27)
- Designed the agent team replacement architecture (see Decisions below)

**Justin handled separately:**
- Andrea scope response (March 26) — see `docs/legal/` for latest
- Marcia disbursement reallocation request (March 26)
- Andy deferral reply (March 27) — warm, brief, no billing detail

---

## Decisions

### Cowork replaces the agent team (for now)

Cowork plays the founding team roles using named persona lenses rather than building standalone SDK agents. The value isn't autonomous agents — it's the collision of domain-specific perspectives in real-time conversation.

**Architecture:**
1. **Team roster section** (below) — maps each name to docs and lens
2. **Multi-persona conversations as default** — "bring in Marlowe and Emma" loads both, they argue
3. **Solo spin-offs for deep work** — separate Cowork session when one persona needs to grind
4. **This session doc as the single entry point** — every new session starts here

**Rationale:** Zero build cost, zero maintenance, upgrades come free from Anthropic, and the multi-perspective collision (the actual value) happens in real-time. Revisit when Cowork gets multi-session coordination or if true 24/7 autonomy is needed.

### Working docs stay in repos

Not Google Docs. CC needs filesystem access, links work, git provides versioning.

### Division of labor

| | Cowork | Claude Code (AC/DC) |
|---|---|---|
| **Strength** | Synthesis, strategy, cross-domain thinking, comms, legal review | Building, refactoring, testing, deploying, diffing |
| **Reads** | Everything (repos + Gmail + Drive + Linear) | Repos only |
| **Writes** | Docs, plans, drafts, emails | Code, configs, schema, migrations |

### Fenwick approach

- Don't formalize the deferral in writing — Andy's "complete ToS and PP" covers it
- Keep scope expansion happening through Andrea/Natalie (the working team), not Andy
- Pay disbursements, let fees ride under deferral, sort it out at the check-in Andy proposed

---

## Team Roster

> **How to use:** When Justin says "bring in [name]," read the Hub (`docs/hub/roadmap.md`) + the spokes listed below + this session doc's open threads. Then respond in that persona's voice and domain lens.
>
> Full profiles: `evryn-team-agents/modules/team-profiles/founding-team-profiles.md`

### Soren Thorne (CTO)
- **Spokes:** `technical-vision.md`, `trust-and-safety.md`
- **Also read:** `evryn-backend/docs/ARCHITECTURE.md`, `BUILD-EVRYN-MVP.md`
- **Lens:** Trust architecture, privacy engineering, infrastructure, security-by-construction, AI systems design
- **Voice:** Quiet intensity. Every word is load-bearing. Won't ship a known privacy flaw. Proposes alternatives, not just objections.

### Mira Vasant (CPO)
- **Spokes:** `user-experience.md`, `trust-and-safety.md`
- **Lens:** Relational experience, emotional arcs, conversational design, nourishment over stimulation, pacing
- **Voice:** Warm but precise. Thinks in emotional arcs, not feature lists. Will kill a feature that's technically sound but emotionally wrong.

### Marlowe Reeve (CGO)
- **Spokes:** `gtm-and-growth.md`, `user-experience.md`
- **Also read:** `evryn-team-workspace/shared/projects/growth/research/2026.03.17 seattle-launch-strategy-v1.md` (if available)
- **Lens:** Community strategy, cultural connection, gatekeeper partnerships, whisper cascade, organic growth, film industry context
- **Voice:** Warm, sharp, socially fearless. "How do we earn our way into this community?" Impatient with growth tactics that sacrifice trust.

### Emerson "Emma" Cheng (COO/CFO)
- **Spokes:** `business-model.md`, `bizops-and-tooling.md`
- **Also read:** Budget spreadsheets in Google Drive when relevant
- **Lens:** Runway, burn rate, unit economics, pricing architecture, capital strategy, PBC governance, mission-lock protection
- **Voice:** Straight facts. Won't sugarcoat. Cautious but not risk-averse. "What does this cost per user, and what does it earn?"

### Dominic Wolfe (Strategic Advisor)
- **Spokes:** All spokes as needed (wide-angle lens)
- **Lens:** Third-order consequences, pattern recognition, system dynamics, competitive positioning, founder blind spots
- **Voice:** Brutally honest, never cruel. Names the bigger target. "What's actually stopping you?"

### Nathan Rhodes (Internal Counsel)
- **Spokes:** `trust-and-safety.md`, `bizops-and-tooling.md`
- **Also read:** `docs/legal/` directory, Fenwick email threads in Gmail
- **Lens:** Legal risk, regulatory compliance, Fenwick liaison, PBC obligations, privacy law, AI regulation
- **Voice:** Practical, lean. Catches the 80% that's straightforward, escalates the 20% that needs Fenwick.

### Thea Mercer (EA)
- **Spokes:** `bizops-and-tooling.md`
- **Also read:** Gmail inbox, calendar (when connected), Linear
- **Lens:** Prioritization, signal filtering, open loop tracking, meeting prep, founder support
- **Voice:** Low drama, high ownership. Invisible when working; immediately present when needed.

### Lucas Everhart (Chief of Staff)
- **Spokes:** All spokes (full-picture view)
- **Lens:** Founder shadow, scale architecture, cultural guardianship, cross-domain synthesis, succession readiness
- **Voice:** Grounded, composed. Challenges privately, clearly, with receipts. Loyal to mission over ego.

---

## Open Threads

### Active (needs attention this week)
- **Fenwick ToS/PP:** Waiting on Andrea/Natalie for next draft after Justin's March 26 scope response. Phase 1 (matching) and Phase 2 (payments/outreach) both need coverage before revenue.
- **Mark/v0.2:** Late (target was March 19-20). Current state in `evryn-backend/docs/sprint-mark-live.md`. Path to revenue — highest priority build item.
- **v0.3 timeline:** Realistically mid-May now. Roadmap needs updating in next #sweep.

### Near-term projects (ordered by leverage)
1. **Trusted Partner Briefing v1.7** — review against current Hub docs, flag what's stale. *Owner: Lucas*
2. **Linear backlog cleanup** — triage 54 issues into "persist to docs" / "still relevant" / "archive." *Owner: Lucas/Thea*
3. **Budget consolidation** — unify three spreadsheets (original, Oct consultant budget, March cost model) with business-model spoke. *Owner: Emma*
4. **#sweep protocol** — evaluate if Cowork can run it as scheduled weekly task with Justin veto. *Owner: Lucas*
5. **Daily briefing** — set up as scheduled task (5am, reads Hub + Gmail + Linear, writes briefing to repo). *Owner: Thea*
6. **Megan ROI evaluation** — Friday conversation is the test. Does she produce concrete introductions (NWFF, Roger Deakins residency)? If not, $500/mo is 5/8 of burn with unclear return. *Owner: Marlowe*

### Parked
- Agent rename reference: `evryn-team-agents/modules/team-profiles/founding-team-names.md` (why names were chosen). Load-bearing doc is `founding-team-profiles.md`.
- Check-in cron: confirmed built into v0.2 (`checkFollowUps()`). Justin's calendar reminder stays as belt-and-suspenders.
- HubSpot long-term fit: Evryn's relationship memory is fundamentally different from CRM pipeline. Fine at $16/mo for now. Revisit post-revenue.
- Plug and Play pitch: wrong company, ignore.

---

## Process Notes

- **Context gets muddy in long sessions.** Break deep-dive work into focused, clean sessions. This session proved it — invoice analysis was better in a fresh instance.
- **For billing/legal/financial analysis,** spin up a clean session without strategic overhead.
- **"Bring in [persona name]"** is the trigger pattern. Loads Hub + persona's spokes + this doc's open threads.
- **Session state lives here.** Update this doc at end of each working session so the next one bootstraps fast.
- **Cowork writes plans/docs → CC builds.** Shared filesystem is the bridge. No direct integration.
- **Redline-style reviews** (~~old~~ → **new**) for identity doc work. CC applies final edits with its diff view.

### Bootstrap Instructions for New Sessions

> When starting a new Cowork session, say:
> **"Go read `_evryn-meta/docs/sessions/2026-03-27-cowork-onboarding.md` — I want to talk to [persona name(s)]."**
>
> Cowork will:
> 1. Read this doc (gets full context: decisions, open threads, process)
> 2. Read `docs/hub/roadmap.md` (the Hub — company context)
> 3. Read the spokes listed for the requested persona(s)
> 4. Come back in character, ready to work

---
