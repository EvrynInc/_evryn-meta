# ADR-059 — Decline EU users, temporarily, and enforce it in the product

**Status:** **Accepted (2026-08-31, Justin) as a TEMPORARY HOLDING POSTURE.** The decision is made; **the control is NOT built, and its central engineering question is unanswered** — see *The open question* below.
**Deciders:** Justin (the ruling). **Joint on execution: Nathan** (Internal Counsel — the legal analysis) **and Soren** (CTO — the technical half). Neither half can be closed alone.
**Context repos:** `evryn-backend` (the control, when specified) and `evryn-website` (the v0.3 Terms).
**Written:** 2026-09-08 by Nathan, discharging Justin's 2026-09-04 standup ballot item 4 (*"the Soren and Nathan subagents write the ADRs when spun"*).
**Related:** v0.3 ToS/PP checklist **T25** (the drafting surface) and **P9** (third-party notice on a bulk corpus ingest) in `evryn-team-workspace/shared/projects/legal/terms-and-privacy/v0.3/v0.3-tos-pp-update-checklist.md` · *Awaiting Justin* item 11 in `evryn-team-workspace/shared/current-state/current-state.md` · evidence base `evryn-team-workspace/shared/projects/helm/research/2026.08.31-nathan-identity-infrastructure-landscape.md`.

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the decision record for why Evryn declines EU users today and what has to be true before that changes. **Read *The control protects the wrong surface* and *The open question* before specifying or approving any control** — the obvious implementation does not cover the actual exposure, and shipping it would make things worse rather than better.
>
> **This is a holding position, not a market decision.** Justin's framing, and it is load-bearing: *we want to open the EU as soon as we can.* An ADR that recorded this as a settled posture would misrepresent the ruling.

---

## Context

### The contradiction this resolves

Two commitments sat inside the Hub at once and they cannot both hold. Evryn is scoped **Washington-only for at least a year** (Justin, 2026-07-29). The Hub also promises that Evryn *"welcomes and serves anyone who arrives, from any domain, from day one."*

**EU law follows the user, not the office.** One EU user pulls in the AI Act's Article 5 prohibitions, its Article 50 transparency obligations, the GDPR, and eventually the Annex III high-risk rules where recruitment-adjacent use is in scope. So the WA-only scoping is a sound, deliberate risk decision — **but it is only sound if something in the product actually enforces it, and as of this writing nothing does.**

### The finding that made it urgent: EU AI Act Article 5(1)(c)

The social-scoring prohibition is **broader than our internal framing had assumed.**

- It reaches **implicit classification**, not only numeric scores. **Therefore *"stories, not scores"* is not the shield we had been treating it as** — the mechanism we deliberately avoided is not the mechanism the prohibition names.
- Its two conditions are **alternatives, not cumulative**.
- *"Unfavourable treatment"* requires **no demonstrated harm**.
- It applies **fully to private companies**.
- Penalties reach **EUR 35M or 7% of worldwide turnover**.

**Our strongest argument is context-relevance:** Evryn assesses trustworthiness-*for-connection*, using data generated in the course of seeking connection.

### The distinction — stated correctly, because the wrong version was circulating

**The surviving distinction is NOT in-context versus cross-context.** We use cross-context assessment deliberately and the product depends on it; a reading that made any cross-context use indefensible would either force a constraint we do not need or concede ground we do not have to concede.

**It is relevance-gated cross-context use versus context-unrelated assessment.**

The Hub's own line — *"some dimensions bleed across contexts"* — is what appears to weaken the position on a first read. **Justin's refinement, 2026-08-31, is what repairs it, and it is a genuinely stronger statement than the one it replaced: they do not bleed *arbitrarily*. They bleed when they are *relevant*.** Relevance-gated cross-context use is a materially different thing from the context-*unrelated* assessment the prohibition names.

**The consequence for design, and it is the reason this belongs in an ADR rather than only in a legal checklist: cross-context bleed is a REGULATED DESIGN CHOICE, not a neutral architectural one.** Anyone extending it should know they are spending against an EU constraint — **and the distinction has to remain true in the implementation, not only in the description.** That is an awareness item for Mira and Soren, not a change request.

**Do not import the GDPR Article 22 defense here.** Our *"no legal or similarly significant effects"* position (posted Privacy Notice section 3.F, Fenwick-retained) is a different regime with a different test. Article 5 does not ask whether effects are legally significant; *"less favourably than others"* suffices.

### Dates, stated with their uncertainty on the face of them

**Two of our own documents disagree, and a reader meeting both will assume one is a typo. Both are right about different milestones:**

- The **Article 5 prohibitions applied from 2025-02-02**.
- The **penalty regime applied from 2025-08-02**.

**Neither date has been verified against primary text.** The v0.3 checklist (T25) carries the first; the 2026-09-08 current-state rebuild carries the second. **Verify both against the Official Journal before either is relied on in anything binding or anything sent outside the company.**

### Confidence, stated plainly

- **Verified against the European Commission's own guidelines:** the Article 5 conditions, the alternatives-not-cumulative reading, the no-demonstrated-harm point, and the private-sector reach.
- **Not recovered beyond section headings:** two sub-points of the guidelines.
- **Not verified:** the two in-force dates above.
- **The application to Evryn is Nathan's analysis, not counsel's.** Fenwick has not been asked and should not be, until EU expansion is real — see *Consequences*.

---

## Decision

**Evryn declines EU users, and the product enforces it. Explicitly temporary.**

Three parts:

1. **A product control** that declines EU users. **What it actually is — signup geo-gating, a terms-level exclusion, a conversational refusal, an outbound check, or some combination — is NOT decided here** and cannot be until the question in the next section is answered. **Nathan and Soren work it jointly, on Justin's instruction.**
2. **A geographic-scope term in the v0.3 Terms of Service, drafted so that lifting it later is an AMENDMENT rather than a rewrite.** This is the cheap half and it is the half most likely to be done badly if it is drafted as though the exclusion were permanent.
3. **Tell Fenwick the posture** — recorded as item 5 on `evryn-team-workspace/shared/projects/legal/terms-and-privacy/2026.08.31-fenwick-phase2-discussion-list.md` — **so they do not scope EU compliance into Phase 2**, and so they understand the analysis is deferred rather than absent.

**Justin's framing, which governs how all three are drafted:** *we want to open the EU as soon as we can.* **Do not draft anything that makes reversal expensive.**

---

## The control protects the wrong surface, and this is the finding that most needs to survive

**This is the reason a well-intentioned implementation would make our position worse rather than better.**

- **GDPR and the AI Act attach to processing the personal data of people in the EU. They do not attach to having them as customers.**
- **A signup gate covers the customer surface.** The larger exposure is **a gatekeeper's inbound corpus** — Mark's roughly 48,000 senders is the live example — **where the probability of zero EU data subjects is effectively nil.** A film-industry inbox carrying eight months of international submissions is not a plausible candidate for containing no EU residents.
- **Ingesting is processing. No signup gate touches it**, because these people never sign up. **This is one of the places the Washington-only scoping does not protect us, precisely because the data arrives from a corpus we do not control.**

**Soren's framing, and it is why this is dangerous rather than merely incomplete:** ***a control that LOOKS like coverage stops anyone looking further.*** A partial control that is understood to be partial is fine. A partial control that reads as complete removes the very attention that would find the gap. It is the same family as a test that passes without asserting anything.

**A sequencing consequence that follows directly:** the intake gate is a **v0.3 object** — there is no signup surface at v0.2 — while **the corpus-side control is needed sooner**, at the first gatekeeper ingest. **Treated as one workstream they get scheduled at v0.3 pace and the urgent half arrives last.** They should be scoped and sequenced separately.

### And our own Privacy Notice bears on this directly

**The posted Privacy Notice, section 9, states: *"Evryn is the controller of the personal information we process under this Privacy Notice."*** Read the deployed artifact at `evryn-website/app/privacy/page.tsx`; do not fetch the page.

**That cuts against the on-behalf-of framing relayed from Fenwick** (per Justin, 2026-08-31: that we process only email those senders sent to the gatekeeper, and so are not processing on our own behalf until they agree to engage). **The agency structure is a strong answer to *on whose behalf are we processing* and a weak answer to *are we processing at all* — and the second is the question the Article 14 notice duty turns on**, because that duty attaches to *obtaining* personal data, and obtaining on someone else's behalf is still obtaining. We have told the world we are the controller.

**This does not block anything. The condition on proceeding is narrow and cheap: establish in writing which of those two questions Fenwick was answering, and put the controller point to them explicitly rather than letting them find it.** One line in the Phase 2 scope request. Detail lives on checklist item P9.

---

## The open question this ADR deliberately does not answer

**Must the control be EFFECTIVE, or DILIGENT?**

**These are different engineering targets by roughly an order of magnitude, and Soren will not specify against an unnamed target — *"that is how security theater gets built."* He is right, and this ADR records the question as open rather than resolving it by implication.**

- **Diligent** — declared residency at intake, a terms-level exclusion, an EU-signal check before outbound, and a documented policy. **Days of work, and honest about being defeatable.**
- **Effective** — probably not achievable. **Geolocation loses to a VPN, declared residency is self-reported, people move, and none of it reaches a corpus we were handed.**

**Justin names the target. Until he does, the control is unspecified, and an ADR that read as though it were specified would be worse than no ADR at all** — because the next person to open this file would build against a target nobody set.

**What Soren can say without the answer, and it is worth holding:** there are **two chokepoints — intake and outbound — both auditable**, and **the outbound one must be structural rather than instructional**, because instructions lose to prompt injection and to context decay.

---

## Alternatives considered and rejected

- **Comply with the EU regime now.** Rejected on cost and timing. We are pre-revenue, Washington-scoped for at least a year, and have no EU users. GDPR and AI Act compliance is a real program, not a clause, and funding it before there is revenue would consume the runway that produces the revenue.
- **Do nothing and rely on the Washington-only scoping.** Rejected as the thing that made this urgent. **A scoping decision that nothing enforces is a description, not a control** — and the exposure follows the user rather than the office.
- **Rely on *"stories, not scores"* as the Article 5 answer.** Rejected on the finding itself: **the prohibition reaches implicit classification**, so the mechanism we avoided is not the mechanism it names.
- **Rely on the GDPR Article 22 *"no significant effects"* position.** Rejected as a category error — a different regime with a different test. Article 5 does not ask whether the effects are legally significant.
- **Ship a signup geo-gate now and call the matter closed.** Rejected, and this is the alternative most likely to be re-proposed by someone reading only the decision line. **It protects the customer surface while leaving the corpus untouched, and it would read as coverage** — see *The control protects the wrong surface*.
- **Take the Article 5 analysis to Fenwick now.** Rejected as premature spend. It does not bind while we are US-only, our Fenwick engagement is unsettled and past its deferment, and the analysis should go to them **at EU expansion**, not before. Recorded on the Phase 2 discussion list as *informational* for exactly this reason.

---

## Consequences

- **The v0.3 Terms gain a geographic-scope term, drafted for reversal.** Nathan owns the drafting; it is checklist item T25.
- **Two controls, two schedules.** The intake gate is a v0.3 object. **The corpus-side control is needed at the first gatekeeper ingest, which is sooner** — and it must not be bundled into v0.3 or it will arrive after the exposure it addresses. *(This is a live instance of the bundling-debt pattern named in the 2026-09-08 current-state: a small independent obligation filed inside a large gated event inherits the gate's schedule.)*
- **Cross-context bleed is now a regulated design choice.** Mira and Soren should know that extending it spends against an EU constraint. **No change is requested; the ask is that the relevance-gating stay true in the implementation and not only in the description.**
- **Fenwick is told the posture but not asked to scope for it.** They should not be surprised later by a document that moved, and they should not bill for EU work we deliberately deferred.
- **This ADR does not close the engineering question, and the gap is deliberate and named.** Anyone picking this up should treat the absence of a specified control as an open item awaiting Justin's *effective-or-diligent* ruling, not as an oversight to be filled in by whoever gets there first.
- **A Hub contradiction remains live and is flagged rather than fixed.** The Hub still promises Evryn *"welcomes and serves anyone who arrives, from any domain, from day one"* alongside the Washington-only scoping. **Spoke and Hub edits require Justin's approval, so this is raised, not made.** Whoever resolves it should keep the temporary framing intact — the sentence is aspirational and correct about where we are going.
- **Reversal is the expected end state, not a contingency.** When the EU is opened, this ADR should be superseded rather than quietly ignored, and the superseding record should say what changed: the analysis verified against primary text, counsel engaged, the controls lifted by amendment.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
