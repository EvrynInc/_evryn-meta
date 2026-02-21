# MP v2.3 → Hub Gap Analysis

**Source:** `docs/historical/master-plan-v2.3.md` (~3,200 lines)
**Checked against:** Hub + 7 spokes, `evryn-backend/docs/ARCHITECTURE.md`, `evryn-backend/docs/BUILD-EVRYN-MVP.md`

---

## Ethos & User Experience / Who is Evryn? (lines 23-127)
- No gaps. Core identity, poetic language, and value prop are well-captured in Hub "What Evryn Is" + user-experience spoke. The Hub's historical vault reference (line 141) already points back to MP for exact marketing prose.

## The Quiet Architecture of Trust (lines 129-226)
- No gaps. Trust architecture, trust-based pricing mechanics, refund flow, user control commitments — all adequately captured across Hub, trust-and-safety spoke, and business-model spoke.

## The Globally Scalable Honor Economy (lines 227-277)
- No gaps. Captured in trust-and-safety spoke "The Globally Scalable Honor Economy" section including the culture table and strategic implications.

## What Evryn is Like / User Interface & Flows (lines 279-424)
- **Gap:** Chat interface UX details — small bubbles, pauses, ability to interrupt, "like texting" — not captured anywhere. → belongs in user-experience spoke (UI Philosophy section)
- **Gap:** Persistent footer with 'Share Evryn', 'Pre-Buy', 'Become an Owner' buttons mentioned as core UI element. Not captured. → user-experience spoke
- **Gap:** Evryn tags and records info for CRM during onboarding, captures preferred contact method. Not captured as a mechanic. → user-experience spoke or ARCHITECTURE.md (onboarding data flow)
- **Gap:** Growth ask timing — Evryn chooses the right emotional moment to invite users to share/pre-buy/invest; three specific CTAs (share, pre-purchase with 30% credit, become an owner via StartEngine). The pre-purchase credit mechanic (30%) is not in the business-model spoke. → business-model spoke (referral/pre-purchase section)
- **Gap:** After-care detail — Evryn continues thinking about next connections and keeps user in the loop ("so you don't ever think she's forgotten you, and so that when she arrives with a new connection, you're very excited"). This proactive anticipation-building between matches is not explicitly captured. → user-experience spoke (After Care section)

## Additional UX Details (lines 418-700)
- **Gap:** "Revealing What's Already There" / Trust Mirror concept (lines 564-599) — the Hub notes it was dropped (ADR-008), but the *latent truth discovery* mechanic IS captured in user-experience spoke. However, the "Would she have connected me to them?" mechanic for existing non-Evryn contacts (lines 564-581) is a separate concept from latent truth discovery. It was presumably dropped with Trust Mirror, but if any part of it survives, it's not captured. → verify with ADR-008; if fully dropped, no gap
- **Gap:** Shared conversations — "two connected users can invite Evryn to be present" is in user-experience spoke. But the MP's detail about connection summary cards (line 397-398: "short summary of the connection: who they are, why Evryn connected you") with user-editable notes is not captured. → user-experience spoke (Connection Conversations section)
- **Gap:** Legal clarity section (lines 683-701) — explicit user disclosures ("no guarantees of a match", "system doesn't owe you visibility, it owes the community safety") appear in Terms of Service language. Not captured in any current doc. → trust-and-safety spoke or bizops-and-tooling spoke (legal section), or flagged for Fenwick work
- **Gap:** Peer-to-peer wallet detail — "Evryn Credit cannot be used to pay other users" (Cash only for P2P) is captured in business-model spoke. But the wallet visibility detail ("wallet remains visible at all times and acts as a subtle cue of user engagement and future connection potential") is not. Minor UX point. → user-experience spoke
- **Gap:** Evryn as main spokesperson on marketing site — "she has high-level training in ethical, value-based sales techniques" for converting prospects. The "always-on channel" where users can voice dreams/concerns and see she's listening. Concept exists in Hub ("growth is conversationally embedded") but the sales technique angle is not captured. → gtm-and-growth spoke or Evryn CLAUDE.md (when built)

## Revenue Model & Monetization (lines 705-848)
- **Gap:** "Match Types & Value Mapping" — MP references seven general categories of match value from casual help to life-changing introductions, and a "blended trust-weighted revenue curve." Neither the categories nor the curve concept appear in business-model spoke. → business-model spoke (financial model section)
- **Gap (better phrasing):** The "casino model" competitive framing (lines 773-848) is noted as existing in the Hub's business-model spoke via a marketing note reference (line 76), but the spoke itself only captures a compressed version. The MP's prose here is materially more compelling for investor pitches — the spoke's note correctly points back to MP lines 770-848 for this. Not a content gap, but worth noting the reference is working as intended.

## Financial Posture & Capital Strategy (lines 851-873)
- **Gap:** Financial Model details — Low/Medium/High cases, $188K bridge funding floor, toggleable scenarios. Not captured in business-model spoke beyond the brief "Capital Strategy" section. The specific funding ask structure ($15K + $25K + $48K family + $750K angels) is partially captured ($40K raised to date) but the full breakdown and contingency reasoning is not. → business-model spoke (capital strategy section) — though some of this may be intentionally omitted as stale
- **Gap:** Pre-loaded wallet funds as working capital ("gives us working capital to provide services before they're delivered") — a financing mechanic, not just UX. Not captured. → business-model spoke

## L.A. Film Industry Launch (lines 874-1000)
- **Gap:** Industry in transition detail — "film industry is evaporating faster than expected with the rise of AI video tools" is captured in gtm-and-growth spoke. But the MP's specific argument that this makes Evryn MORE urgent (find best connections in shrinking landscape + find next opportunities) is better stated in the spoke. No gap.
- **Gap:** "Sacred Launch Conditions" concept (lines 969-978) — 4 conditions for go/no-go. Stale dates, but the *principle* of having launch conditions isn't captured. May be worth preserving as a pattern for v0.2 launch. → gtm-and-growth spoke or build doc
- **Gap:** The follow-through argument for film (line 920: "introductions aren't enough — follow-through matters. By facilitating payments and re-engagements, Evryn becomes not just the introducer, but the connective tissue for real working relationships") — this is a crisp articulation of post-match value that's not stated this clearly anywhere. → gtm-and-growth spoke (LA Film section) or business-model spoke

## Department Overviews / Launch Timeline / Scope Triggers (lines 1000-1160)
- Stale staffing plans and timelines — intentionally not flagged per instructions.
- **Gap:** Scope compression/expansion trigger *principle* — the concept of having codified go/no-go conditions and scope flex triggers as a launch discipline. The gtm-and-growth spoke has a "Removed" note preserving the core principle ("experience of meeting Evryn never gets compromised") but the *pattern itself* (codified triggers that reshape scope rather than cancel launch) is not captured as a reusable discipline. → gtm-and-growth spoke or build doc (as a launch readiness pattern)

## Technical Milestones & Build Cadence / Where We Are Now (lines 1163-1222)
- Stale timelines — not flagged.
- **Gap:** v0.4 Wizard-of-Oz concept (line 1192-1194) — "quietly begin human-in-the-loop matchmaking... offer two potential matches for each match to learn faster" — is referenced in Hub build stages as "v0.4 (wizard-of-oz matching)" but the specific mechanic (two candidates per match for faster learning) is not captured. → Hub build stages note or build doc

## Growth Ethos (lines 1225-1230)
- **Gap:** "Rhizomatic growth" metaphor — "like the roots of a great tree, spreading strong and unseen until suddenly the canopy is everywhere." Sharper than anything in the current docs. The concept exists but the metaphor is missing. → gtm-and-growth spoke (growth mechanics section) — a phrasing improvement, not a missing idea

## Messaging / Outreach / Referrals / Segment Alignment (lines 1231-1407)
- Outreach details (PR strategy, film festivals, forums, influencer plan, ad spend) — gtm-and-growth spoke correctly has "Removed" notes pointing back to MP. No gap.
- **Gap:** StartEngine seeding strategy — "$50K from friendly sources for social proof" and the narrative control rationale ("keeping it within family of users, we control the narrative"). Not captured. → business-model spoke (capital strategy) or gtm-and-growth spoke
- **Gap:** Segment-to-avatar mapping table (lines 1384-1401) — the detailed mapping of market segments (Film Creators, Disillusioned Daters, Network-Burnout Professionals, Creative Collaborators, Gig-Weary Seekers) to financial model avatars with strategic GTM roles. Business-model spoke has the avatars but not this mapping. → business-model spoke or gtm-and-growth spoke
- **Gap:** "Precision-targeted belief ladders, calibrated to the jobs these users actually hired their current platforms to do" (line 1403) — sharp framing of the JTBD approach to growth. Not captured. → gtm-and-growth spoke

## Network Density & Ignition Model (lines 1409-1557)
- Density thresholds and sub-cluster ignition captured in business-model spoke and gtm-and-growth spoke.
- **Gap:** "When the Magic Starts" modeling (lines 1520-1539) — Day 1-2: 15-20%, Day 3-7: 30-60%, Day 8-14: 70-90% match projections; "four not-quite attempts before something lands" as built-in expectation; 27,000-40,000 match attempts in first two weeks. Based on stale user counts but the *modeling framework* and match-attempt math pattern is not captured anywhere. → business-model spoke or build doc (as a launch projection methodology)
- **Gap:** Referral decay mitigation (line 1567) — "ensuring each referred user gets the same warm welcome and context as the referrer did" so referral chains don't sputter. Not captured as a principle. → gtm-and-growth spoke (growth mechanics) or user-experience spoke

## Competitive Landscape (lines 1569-1670)
- Well captured in gtm-and-growth spoke. No gaps beyond what's already noted with "see original MP lines" references.

## Technical Architecture (lines 1674-2000)
- **Gap:** "Five imperatives" checklist (lines 1677-1686) — Trusted Intelligence, Attuned Presence, Resonant Matching, Continuous Learning, Structural Safety — crisp list of what the system must deliver. Not captured as a list in any current doc. → technical-vision spoke or ARCHITECTURE.md
- **Gap:** "Five critical conditions" (lines 1690-1703) — structural requirements that, if missed, the system breaks (network density, high-fidelity user understanding, real-time memory + consent-aware logic, trust graph integrity, system stability under load). Not captured as a checklist. → technical-vision spoke
- **Gap:** Client interface — texting-style chat with streaming in bursts, interrupt gracefully halting rendering, partial thread recovery, "Trust & Account" page for ToS/billing/data management. → user-experience spoke
- **Gap:** "Focused Mode" vs "Open Door" notification setting for user-user conversations (line 1803). → user-experience spoke
- **Gap:** Training Data Pipeline (lines 1884-1886) — periodic aggregation of anonymized user profile snapshots + behavior metadata + match outcomes into training datasets for model tuning. Not captured. → technical-vision spoke (How Evryn Learns)
- **Gap:** Consent-based growth retargeting cookie for incomplete onboardings (line 1936-1937). → technical-vision spoke or gtm-and-growth spoke
- **Gap:** User-approved contextual assistance — opt-in to let Evryn observe external digital behavior (calendar, social app usage) for deeper support (line 1937). Future concept, not captured. → technical-vision spoke (future capabilities) or long-term-vision spoke
- **Gap:** Security monitoring specifics — API rate limiting, anomaly detection, pen testing, dependency scanning, role-based internal access (lines 1951-1956). → technical-vision spoke (Privacy & Security)
- **Gap:** Incident response protocol concept — isolate, diagnose, contain, notify users (lines 1958-1960). → technical-vision spoke
- **Gap:** Compliance alignment — GDPR/CCPA/similar, user data export/deletion/correction, DPO function (lines 1962-1968). Partially covered by data minimization section but not as explicit compliance list. → technical-vision spoke or bizops-and-tooling spoke

## AI Architecture continued (lines 2000-2406)
- Three brains, LLM transition, dual-mode learning, knowledge retrieval — all well captured in technical-vision spoke. No gaps on core concepts.
- **Gap:** "Coherence-calibrated modularity" (lines 2227-2252) — cross-domain intelligence architecture: context-isolated memory buffers per intent domain (romantic, professional, platonic), centralized compatibility engine, threshold-based checks for cross-domain suggestions, and the four design principles (model clarity, data hygiene, cognitive coherence, user control). Not captured. → technical-vision spoke (Matchmaking Engine or Three Brains section)
- **Gap:** Dynamic Weight Adjustment (lines 2298-2309) — real-time fine-tuning of matching model that is localized (not global retrains), reversible, personalized, bounded by safety constraints. Not captured as a distinct concept. → technical-vision spoke (Matchmaking Engine)
- **Gap:** Model deployment discipline — "every model update treated like a code release: spot-checked, A/B tested, rollback-enabled" (lines 2272-2278). Not captured. → technical-vision spoke (How Evryn Learns)
- **Gap:** Pre-training with simulated data (lines 2212-2223) — simulated profiles, controlled conversations, labeled match outcomes as working baseline before live data. Not captured as an approach. → technical-vision spoke or build doc

## Moderation and Safety Systems (lines 2408-2612)
- Core moderation captured well in trust-and-safety spoke.
- **Gap:** "Preventing Platform Abuse" specifics (lines 2509-2515) — spam mitigation (rate limits, refusal of spammy prompts, quiet blocking), scraping defense (no browsing by design), reverse-engineering prevention (behavioral throttles). Only partially captured. → trust-and-safety spoke
- **Gap:** EU Digital Services Act alignment — appeal path for bans/moderation decisions, aggregate transparency reporting (lines 2550-2556). Not captured. → trust-and-safety spoke or bizops-and-tooling spoke (legal)
- **Gap:** "Evryn is not a mirror; she is a witness" framing (lines 2863-2875) — users may request clarity on how Evryn sees them but may not demand changes. Evryn shares her truth proportionate to trust. If flagged/dangerous, she goes quiet. Distinct from the dropped Trust Mirror — this is about Evryn's relationship to her own assessments. Not captured. → trust-and-safety spoke or user-experience spoke

## Scalability, Resilience & Disaster Recovery (lines 2614-2694)
- Infrastructure details largely stale (pre-AI-pivot). Not flagging specifics.
- **Gap:** Graceful degradation UX messaging — "I've got a lot going on right now, but I promise I'll get back to you shortly" and "Something's gone a bit sideways on my end" (lines 2633-2636, 2670-2674). These are UX principles for how Evryn communicates system issues to users. Not captured. → user-experience spoke or ARCHITECTURE.md (operational patterns)
- **Gap:** Resilience design principles — "Fail safely, recover quickly, scale with integrity" as a named triad (lines 2619-2622). Not captured as a principle set. → technical-vision spoke

## Future Directions & Roadmap (lines 2696-2886)
- Feature growth items captured in long-term-vision spoke (group matching, federation, etc.).
- **Gap:** "Rejected match history and sensitive social signals" as data inside the Trust Core (line 2823). The long-term-vision spoke's Trust Core data list omits "rejected match history and sensitive social signals." → long-term-vision spoke (Trust Core list)

## Key Risks (lines 2889-2973)
- Most risks captured in long-term-vision spoke.
- **Gap:** "The AI can't deliver" risk + mitigation (lines 2916-2921) — selling early adopters on the dream while being transparent about needing collective buy-in to reach critical mass. Not captured. → long-term-vision spoke (Key Risks)
- **Gap:** "Black Box decisions" risk (lines 2923-2927) — users losing ability to trust own judgment by over-relying on Evryn. Mitigation: user has ultimate control. Not captured. → long-term-vision spoke (Key Risks)
- **Gap:** "AI to detect AI" — deepfake detection, linguistic pattern analysis, markers of inauthenticity (line 2962). Mentioned as part of exploitation prevention but not captured in current docs. → trust-and-safety spoke (Detecting Harm and Deception)

## Long View (lines 2976-3034)
- Well captured in long-term-vision spoke. No gaps.

## Appendix: Terms of Service (lines 3036-3101)
- Trust Mirror — dropped per ADR-008. Not a gap.
- **Gap:** ToS provisions as reusable legal language: "Right to withhold matching," "No guaranteed access or earnings," "Referral rewards are conditional," "Evryn Credit is not cash." Not captured in any current doc. → bizops-and-tooling spoke (legal section) or a future Terms of Service draft
- **Gap:** StartEngine compliance framing — explicitly structured for Reg CF/SEC, GDPR/CCPA profiling laws, FTC standards. The reasoning for how investment invitations avoid regulatory issues (lines 3082-3101). Not captured. → bizops-and-tooling spoke (fundraising section) or legal docs

## Appendix: Tools & Svcs for BizOps (lines 3104-3210)
- Well captured in bizops-and-tooling spoke with pivots noted. No gaps.

---

## Summary

**Total gaps found: ~35**

### Priority Ranking

**High priority (substantive ideas/mechanics not captured anywhere):**
1. "Coherence-calibrated modularity" — cross-domain matching architecture with intent-isolated memory buffers (technical-vision spoke)
2. "Five imperatives" + "Five critical conditions" checklists — what the system must deliver and what breaks it if missing (technical-vision spoke)
3. Segment-to-avatar mapping table — links market segments to financial model avatars with strategic GTM roles (business-model or gtm-and-growth spoke)
4. "AI can't deliver" + "Black Box decisions" risks — two risk categories missing from long-term-vision spoke
5. EU Digital Services Act alignment / appeal path / transparency reporting (trust-and-safety or bizops spoke)
6. "Evryn is a witness, not a mirror" — framing for how Evryn relates to her own assessments (trust-and-safety spoke)
7. "AI to detect AI" — deepfake and inauthenticity detection as an explicit capability (trust-and-safety spoke)

**Medium priority (useful detail or sharper phrasing for existing concepts):**
8. Chat UX details — small bubbles, pauses, interrupt, "like texting" (user-experience spoke)
9. "Focused Mode" vs "Open Door" notification setting (user-experience spoke)
10. Pre-purchase 30% credit mechanic (business-model spoke)
11. Wallet visibility as engagement cue (user-experience spoke)
12. Growth ask timing — three specific CTAs and emotional moment selection (gtm-and-growth spoke)
13. StartEngine seeding strategy — $50K social proof + narrative control (business-model spoke)
14. v0.4 Wizard-of-Oz mechanic — two candidates per match for faster learning (Hub or build doc)
15. "Precision-targeted belief ladders" / JTBD framing (gtm-and-growth spoke)
16. Follow-through as connective tissue for film industry (gtm-and-growth spoke)
17. Referral decay mitigation — same warm welcome for Nth-generation referrals (gtm-and-growth spoke)
18. Graceful degradation UX messages (user-experience spoke)
19. Dynamic Weight Adjustment in matching (technical-vision spoke)
20. Model deployment discipline (technical-vision spoke)
21. Training Data Pipeline / simulated pre-training (technical-vision spoke)
22. Platform abuse prevention specifics (trust-and-safety spoke)
23. Incident response protocol concept (technical-vision spoke)
24. Compliance alignment as explicit list (technical-vision spoke)
25. ToS provisions as legal language templates (bizops spoke)
26. StartEngine compliance framing (bizops spoke)
27. Rejected match history in Trust Core data list (long-term-vision spoke)
28. Scope flex trigger pattern as reusable discipline (gtm-and-growth or build doc)
29. "When the Magic Starts" projection methodology (business-model spoke)

**Low priority (minor UX detail, phrasing improvements, or very future-looking):**
30. Connection summary cards with user-editable notes (user-experience spoke)
31. Legal clarity / ToS disclosure language for users (trust-and-safety spoke)
32. After-care anticipation-building detail (user-experience spoke)
33. Evryn as ethical salesperson on marketing site (gtm-and-growth spoke)
34. "Rhizomatic growth" metaphor — sharper than current phrasing (gtm-and-growth spoke)
35. Consent-based retargeting cookie / user-approved contextual assistance (technical-vision spoke)
36. Resilience design triad (technical-vision spoke)

### Recommendation

The high-priority gaps should be addressed in the next spoke maintenance pass. Most are additions of 2-5 lines to existing sections. The "coherence-calibrated modularity" concept is the largest single gap — it's a genuine architectural idea that shapes how multi-domain matching works and has no home in current docs. The risk gaps (#4, #6, #7) are quick additions to existing lists. The segment-to-avatar mapping (#3) is a table that could go in either the business-model or gtm-and-growth spoke.

Medium-priority items can be batched into a "spoke enrichment" pass. Low-priority items can wait until relevant sections are being worked on anyway.

