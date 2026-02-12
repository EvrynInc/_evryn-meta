# MPR Verification Notes — Working Doc

**How to use this file:** AC's working notes from the MP v2.3 ↔ MPR side-by-side verification pass. These are the changes to make to `master-plan-reference.md` before freezing it in `historical/`. Delete this file once the MPR is updated and committed.

*Written: 2026-02-12*

---

## Context

AC read the full MP v2.3 (3,205 lines) side-by-side with the MPR (611 lines). Justin reviewed the findings and gave corrections. This doc captures everything needed to update the MPR.

## Justin's Global Guidance

- Where big portions are omitted, leave a **breadcrumb note** explaining WHY (not just a hole). Light touch on the "why" — enough to explain why it would be stupid to include it, but not heavy.
- For BizOps tools: keep ALL of them. Only note a replacement if we *know* we've replaced something. Justin doesn't want tools dropped just because they seem operational — he wants them all preserved.
- External references (Financial Model, Deep Research Report, Notion Vault) must be added to Related Documents.
- The MPR's "What's omitted" header needs updating to match the breadcrumb approach.

---

## Changes Needed

### A. Breadcrumb Notes for Omitted Sections

These go inline in the MPR at the logical location where the content would have appeared. Light, one-liner + brief "why removed."

1. **Launch Timeline** (MP lines 921-1006, ~80 lines)
   - Place after GTM Strategy section or within it
   - Note: "Removed: month-by-month launch timeline targeting Dec 28, 2025. Dates have passed; build plan being rebuilt as v0.2 MVP. See original for the founding launch plan."

2. **Department Overviews & Staffing Plans** (MP lines 1012-1127, ~120 lines)
   - Place near Launch Timeline breadcrumb or after GTM
   - Note: "Removed: 12-month department plans (CEO, Product, Tech, Growth, UX, BizOps, Legal, Trust & Safety, People & Culture) with staffing timelines. These assumed a human team pre-AI pivot — the AI team (Lucas + subagents) now covers most of these functions. See original for the founding org plan."

3. **Capital Strategy** (MP lines 850-871, ~20 lines)
   - Place in Business Model section, after Financial Model Assumptions
   - Note should preserve the PHILOSOPHY (user-led, backed by VC as needed) even though dollar amounts are stale. Write a brief paragraph, not just a removal note — this is substantive.

4. **Detailed GTM Outreach Tactics** (MP lines 1305-1337, ~30 lines)
   - Place in GTM section
   - Note: "Removed: detailed outreach plan (PR strategy, community outreach, influencer plan, ad spend). Being rebuilt for the v0.2 pilot phase. See original for the founding GTM tactics."

5. **Scope Management & Expansion Triggers** (MP lines 1130-1158)
   - Brief breadcrumb in GTM or Version History
   - Note: "Removed: scope compression/expansion triggers (runway thresholds, compute cost triggers, user count triggers). These were calibrated for the Dec 2025 launch. Core principle preserved: 'The experience of meeting Evryn never gets compromised.'"

### B. Substantive Additions

These are content that belongs in the MPR but is currently missing.

1. **Societal Long View Vision** (MP lines 3019-3031)
   - Add to "The Long View" section
   - Content: Mental health, divorce rates, job fit, family stability, money becoming less necessary, democratized opportunity through connection. This is Justin's ultimate vision for Evryn's impact on the world.

2. **Market Size Framework** (MP lines 1477-1517)
   - Add to "Financial Model Assumptions" or create a brief "Market Size" subsection
   - Include: TAM/SAM/TSM/SOM framework (especially the unique "Trusted Serviceable Market" concept — SAM after trust filters), the revenue projection table (LA $48M → Global $72B), and the key density thresholds already partially in MPR.

3. **Avatar Behavioral Descriptions** (MP lines 1392-1402)
   - Expand the existing avatar mention in "Financial Model Assumptions"
   - Add behavioral descriptions: Seekers (emotionally primed, win their heart → loyalty), Builders (need trust scaffolding, long-term potential), Operators (reliability, speed, frictionless), Casual Connectors (usefulness, simplicity, low-friction viral), Social Anchors (belonging, bring community), Torchbearers (need to feel chosen, become firestarters), Legacy Gatekeepers (invited at exactly right moment with right social proof).

4. **"You're always in control" principle** (MP line 205)
   - Add to Trust Architecture section, or create a brief "User Agency" note
   - Include: explicit no-manipulation commitment (no auto-invites, no fake urgency, no gamification). This is a POSITIVE commitment, not just risk mitigation.

5. **Competitive Analysis by Category** (MP lines 1568-1670)
   - Add a brief section or subsection in GTM
   - Categories: Film (fragmented, no dominant connector), Dating (massive, churn-heavy, exhausted), Professional Networking (static, cold), Gig/Freelance (transactional, commoditized), Social Media (massive, chaotic, wrong tool for connection)
   - For each: Evryn's edge + top threats. Brief, not the full SWOT.

6. **"First resonance between you and her, ultimate resonance between you and yourself"** (MP line 302)
   - Add to "Who Evryn Is" section as a design philosophy note.

7. **Capital Strategy Philosophy** (MP lines 860-871)
   - Overlaps with breadcrumb #3 above. Write it as a preserved paragraph with a note that specific dollar amounts are stale.

### C. BizOps Tools — Full Preservation

The current MPR has only 6 tool entries in Legal & Corporate. The MP has ~25 tools across 8 categories. Justin wants ALL preserved.

Expand the "Legal & Corporate" section to include all BizOps tools from the MP appendix (lines 3104-3210), organized by category:
- Legal & Incorporation (Clerky, Fenwick) ✓ already in MPR
- Trademark (LegalZoom) ✓ already in MPR
- Finance & Accounting (Rho, QuickBooks, Finmark, Gusto, Deel, Stripe, Google Sheets cap table)
- Fundraising (StartEngine ✓, DocSend)
- Website & Hosting (Namecheap, Webflow, Google Analytics, Cloudflare/Vercel)
- Customer Management (Mailchimp, ConvertKit, HubSpot, Zendesk, Discord, iDenfy ✓)
- Project Management (ClickUp, Slack, Notion, Google Drive, Airtable)
- Product Analytics (Amplitude)
- Recruitment (YC, CoFoundersLab, Pioneer, AngelList, Indie Hackers, LinkedIn, Indie.vc, Upwork, Fiverr, Toptal, Dribbble, Behance)

Note any known replacements (e.g., ClickUp → Linear for backlog; the actual tech stack is now Claude/Supabase/TypeScript, not GPT-4/AWS).

### D. External References — Add to Related Documents

Add these to the "Related Documents" section:

1. **Financial Model** — spreadsheet (location TBD — ask Justin where this lives). Referenced throughout MP for avatar details, pricing tiers, burn rate, runway scenarios.
2. **Deep Research Report: Market Analysis & Competitive Landscape** — Notion doc. Referenced at MP lines 1406 and 1570.
3. **Notion Vault** — contains longer BizOps tool rationale and historical drafts. Referenced at MP line 3106.

### E. Header Update

Update the "What's omitted" paragraph to reflect the breadcrumb approach:
- Instead of just "Stale GTM timelines, staffing plans, specific tool evaluations" → note that these are breadcrumbed inline with brief explanations of why they were removed and what replaced them.
- Actually, with BizOps tools now being preserved, the header should say something like: "Stale GTM timelines and staffing plans are breadcrumbed inline with context for why they're omitted."

---

## Execution Order

1. Add breadcrumb notes (A1-A5)
2. Add substantive content (B1-B7)
3. Expand BizOps tools (C)
4. Add external references (D)
5. Update header (E)
6. Commit and push
7. Delete this working doc

**If compaction happens mid-process:** The next instance should read this file, check git log to see which steps are done, and continue from where it left off.

---

## What the MPR Does Well (no changes needed)

- Trust architecture — comprehensive
- Trust-based pricing — faithful
- Three brains conceptual architecture — captures intent without stale tech details
- Privacy/security framework — thorough
- Evryn's personality — well captured
- Connection mode flows — step by step
- Wallet mechanics — complete
- Moderation & safety — comprehensive
- Federation/future — well covered
- Jurisdictional architecture — solid
- Marketing notes pointing back to original for prose — smart approach
