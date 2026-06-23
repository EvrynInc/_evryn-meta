# Work Briefing — March 25, 2026

*Compiled from: Hub docs, Google Drive, Gmail (last 7 days), Linear backlog.*

---

## Urgent: Requires Action This Week

### 1. Fenwick wants to align on scope before drafting — you need to respond

**What happened:** You pinged the Fenwick ToS/Privacy team on March 24 asking for an ETA on the next draft. Andrea Louie responded the same day with a substantive email that needs a careful reply. She's not just giving a timeline — she's raising scope questions that will affect the legal bill and your launch timeline.

**Key points from Andrea (March 24):**

- They understood Phase 1 as **gatekeeper email forwarding and tagging only** — no matching. If you're launching with matching in Phase 1 (which your v0.3 timeline implies), they need to know because both documents need revision.
- They want to **omit the payments section** from the current draft since Phase 1 has no fees. The different payment structures (trust-based pricing, peer-to-peer, credit) each carry legal considerations and will take additional time.
- They're cautioning against **over-disclosure in public comms** — saying things publicly that go beyond what the legal docs actually reflect creates exposure.
- They provided inline comments on your review notes (refund period language, email addresses, etc.) and are ready to incorporate.

**Why this is urgent:** They're explicitly pausing drafting until you confirm scope. Every day this sits is a day the legal timeline slides — and that timeline is already tight given the ~$35K bill landing in August and your need for finalized ToS/Privacy before v0.3 can go live with real users.

**What you probably need to decide:**
- Are the ToS/Privacy docs scoped to v0.2 only (email triage, no payments, no matching), with a Phase 2 expansion later? Or do you want them to cover through v0.3?
- If v0.2 only: that keeps the current bill lower but means another round of legal when matching goes live.
- If through v0.3: more work now, but you ship with real legal cover for the revenue-generating product.

**People involved:** Andrea Louie (associate), Natalie Kim (associate), Andy Albertson (partner — your main relationship).

### 2. Andy Albertson responded on the deferral — read between the lines

**What happened:** Andy replied today (March 25) to your check-in about approaching the $25K deferral limit. His response was warm but contained a signal worth noting:

> "Let's complete the Terms of Service and Privacy Policy and check in (we will likely have to pause additional meaningful legal spend at that point)."

**Translation:** Fenwick is willing to finish the ToS/Privacy work on deferral, but after that, the free ride likely ends. Any future legal work (crowdfunding docs, Foundation setup, additional phases) will probably need to be paid for. This is consistent with your financial model's ~$35K Fenwick line item in August.

### 3. Your calendar is telling you things

You have **recurring daily reminders** that are firing:
- **"Before Evryn has automated check-in, YOU are the check-in module"** — Are you actually doing manual check-ins with Mark or early contacts? If not, this is a process gap.
- **"#sweep and #align"** — Document alignment sessions. Today is a good day for this since you're already in briefing mode.
- **"AWS Startup, and AWS Activate Credits"** — You had a note about AWS startup credits. Worth pursuing if you're considering moving off Railway or need infrastructure credits.

---

## Conversations Where You're Mentioned / Active

### Megan Griffiths — Advisor (last contact: March 20)

**Status:** Active and engaged. She reacted positively to the Restricted Stock Purchase agreement you sent on March 20. Your last substantive meeting was March 20 where you discussed:
- Marketing strategy, cold start problem, organic growth
- Goal of 5,000 matchable people by May from Mark's inbound
- Hardening testing before onboarding Mark
- Megan's strong network of potential gatekeepers

**SIFF / NWFF thread (March 6):** Megan gave you a solid list of Seattle film community orgs and events to consider for organic launch presence:
- **SIFF** — sponsorship likely too expensive, but organic presence at filmmaker-focused events is doable
- **Northwest Film Forum** — gala in early June, Local Sightings in September, ongoing member events
- **Roger Deakins residency** (late May) — Megan is helping plan this, would attract local film community
- **Other orgs:** Women in Film Seattle, Seattle Film Society, SeaDoc

**Open item:** You haven't followed up on any of these SIFF/NWFF leads since March 6. With May approaching, the Roger Deakins residency and NWFF gala are both in your launch window.

### HubSpot — Sam Jaku (sales rep, last contact: March 24)

Sam is following up on a "2026 Strategy" conversation. This is a sales call, not urgent, but if you're evaluating whether to upgrade HubSpot (currently ~$16/mo) as you scale, it might be worth a quick reply.

### Plug and Play — Jeremy Steinberg (March 23)

**"Final Invitation"** to pitch at a Virtual Pitch Session on **April 1** — 3 minutes to 100+ VC investors. This came through your catchall address (jmcgowan@evryn.ai). They're positioning it as a UW alumni founder opportunity, only 3 spots left.

**Worth considering:** Your capital philosophy is explicitly anti-VC, but Plug and Play exposure could lead to angel connections or strategic partnerships. The April 1 date is very soon — you'd need to decide fast.

---

## Threads You're Not In But Should Know About

Based on your current priorities, I didn't find external threads you're missing — you're a solo founder, so all threads involve you. But there are some **ambient signals** worth noting:

- **Linear just launched "Linear Agent"** (email from March 24) — given that EVR-53 in your backlog is literally "Evaluate how we can make Linear really work for us," this might be worth a look. AI-powered issue management could help with the exact problem you mentioned: breadcrumbing loose backlog items into your architecture docs.
- **Carta Community upgrade** (March 24) — your account needs activation in the new system. Low urgency but don't let it lapse if you're tracking cap table there.

---

## Linear Backlog — Full State

**54 issues total.** 15 Done, 6 Todo, 33 Backlog. No due dates on anything. No active cycles.

### Todo (ready to work):

| ID | Title |
|----|-------|
| EVR-6 | Wire up Google Calendar API — Thea manages Justin's calendar |
| EVR-14 | Implement tiered memory architecture |
| EVR-28 | Test all 8 agents respond to email individually |
| EVR-8 | Budget halt notification |
| EVR-7 | Agent self-wake trigger |
| EVR-5 | Wire up Gmail OAuth — Thea reads Justin's inbox |

### Backlog highlights (grouped by theme):

**Infrastructure / performance:**
- EVR-11: Lazy history loading
- EVR-12: Compressed history format
- EVR-13: Modular context loading
- EVR-16: Cloud deployment — move agents off desktop
- EVR-36: Gmail push notifications (replace polling)
- EVR-42: Fix thread_id type mismatch

**Agent team (paused but documented):**
- EVR-32: Google Drive API access for all agents
- EVR-43: Build Alex's coding tools
- EVR-49/50: Alex staying current on AI tools + evaluating memory solutions

**Cost optimization:**
- EVR-10: Haiku triage layer for routine emails
- EVR-33: Haiku for internal-only operations
- EVR-39: Cost calculation doesn't reflect prompt cache savings
- EVR-41: Set production budget thresholds

**Strategic / long-range:**
- EVR-17: Executive decision journal
- EVR-18: Cross-domain synthesis dashboard
- EVR-21: Competitive intelligence setup
- EVR-24: Privacy compliance audit
- EVR-52: How to keep Evryn safe from government meddling

**Product (Evryn-facing):**
- EVR-35: pgvector semantic search for agent long-term memory
- EVR-44: Voice integration (Vapi + Hume)
- EVR-51: Spam review workflow for Thea
- EVR-54: Escalation tracking for follow-up on escalated items

### Observation on Linear

You mentioned wanting to breadcrumb these into your architecture docs. Right now none of these issues have due dates, priorities, or cycle assignments — they're truly loose. The ones that matter for v0.2 and v0.3 (EVR-5, EVR-6, EVR-42, EVR-54, EVR-51) should probably get tagged and time-boxed. The strategic ones (EVR-17 through EVR-26) read more like "someday/maybe" — might be better as a separate doc or project rather than polluting the active backlog.

---

## What's Due This Week + Blockers

### Critical path (from your roadmap):

- **v0.2 "Mark live" target was March 19-20.** Today is March 25. Your roadmap says this is the current build. Is Mark live? If not, that's your top priority — every day v0.2 slips pushes v0.3 (and first revenue) further out.
- **v0.3 target: first revenue late April / early May.** That's 4-5 weeks away. v0.3 requires: web app + matching + payments + cast-off outreach. Plus finalized ToS/Privacy from Fenwick.

### Blockers:

1. **Fenwick scope alignment** (see Urgent #1) — legal docs are paused until you reply. These are a hard dependency for v0.3 launch.
2. **Cash runway** — ~$5,325 projected end of March at $800/mo burn. Comfortable for now, but the cliff is visible: without revenue by May, the August Fenwick bill ($35K) creates a crisis.
3. **No due dates or priorities in Linear** — nothing is technically "due this week" because nothing has dates. This is a process gap, not a status.

---

## Bottom Line

Your most leveraged actions right now, in order:

1. **Reply to Andrea at Fenwick** — confirm scope, unblock the legal drafting. This is a gating dependency for everything revenue-related.
2. **Confirm v0.2 status with Mark** — is it live? What's working, what's not? This feeds everything downstream.
3. **Follow up on Megan's SIFF/NWFF leads** — the May events are approaching and organic presence at the Roger Deakins residency and NWFF gala would be free/cheap visibility with exactly your target audience.
4. **Decide on Plug and Play pitch** (April 1) — quick yes/no, don't let it linger.
5. **Add dates to your Linear issues** — at minimum, tag what's needed for v0.2 and v0.3, so you have a real task board instead of a wish list.

---

*Generated March 25, 2026 from Gmail, Google Drive, Linear, and local Hub docs.*
