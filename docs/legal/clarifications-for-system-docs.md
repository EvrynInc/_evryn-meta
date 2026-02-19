# Clarifications Surfaced During Legal Questionnaire

> **How to use this file:** Captures architectural and policy clarifications that emerged while drafting the privacy/terms questionnaire. These need to be reflected in the appropriate system, architecture, and build docs once resolved. Track them here so they survive context compaction.
>
> **Owner:** AC
>
> **Status:** Active — updated 2026-02-17T16:04:46-08:00

---

## Unresolved (need decisions)

### Gatekeeper first-right-of-refusal
**Surfaced:** Legal questionnaire, Q5 connection decisions
**Issue:** When a person emails a gatekeeper and Evryn classifies them as a "pass" for that gatekeeper — but they'd be a great match for someone else — does the gatekeeper get first right of refusal before Evryn connects that person elsewhere? What if the person is in multiple gatekeepers' inboxes simultaneously? We need clear rules here to avoid any appearance of "poaching" inbound from gatekeepers, and to be transparent about what we're doing and why.
**Discussion (2026-02-16):** Justin and AC discussed extensively. Key framing: the gatekeeper model is a *channel*, not an ownership structure. "First right of refusal" is the wrong frame — it implies ownership. The principle is: Evryn's obligation is to *each* user, not just to the gatekeeper. If Bob emails 20 gatekeepers who all use Evryn, each gatekeeper deserves the best match, but likewise, Bob deserves the best match regardless of which inbox surfaced him first. The deal for gatekeepers is "we will find you the *best mutual* matches" — not "you own your inbound." This framing naturally transitions to the future state where gatekeepers redirect inbound to Evryn directly. Need to avoid codifying gatekeeper rights that would be hard to walk back. For now, the legal doc says: "Evryn prioritizes match quality over order of discovery."
**Needs to flow to:** ARCHITECTURE.md (connection lifecycle), BUILD-EVRYN-MVP.md (cast-off handling), Evryn's system prompt (judgment framework), gatekeeper onboarding messaging
**Status:** Open — substantial discussion captured, needs final resolution before gatekeeper agreements

### Safety imprint implementation approach
**Surfaced:** Legal questionnaire, Q5 account deletion
**Issue:** The "non-reversible salted hash" is one technical approach to remembering willingness to do business with deleted accounts. Is it the best approach? Should the legal/policy docs be more general about the mechanism, or specific? Risk of boxing in to one approach vs. clarity for regulators.
**Decision (partial):** Legal doc now generalized — describes the function (recognize returning identity, remember nature of willingness to do business) without naming a specific mechanism. Technical approach still TBD for ARCHITECTURE.md.
**Needs to flow to:** ARCHITECTURE.md (security section), privacy policy
**Status:** Resolved for legal doc; technical mechanism still needs architectural decision

## Resolved (need to be written into docs)

### Age requirement: 18 for launch
**Surfaced:** Legal questionnaire, Additional Context
**Decision:** Minimum age 18 for launch. Easier to get off the ground. May consider younger users (with parent-administered accounts) later when there's a team and revenue to deep-dive the compliance requirements.
**Needs to flow to:** Terms of Service, ARCHITECTURE.md (user model)

### Identity verification: pass-through model
**Surfaced:** Legal questionnaire, Q4 and Additional Context
**Decision:** Evryn never stores identity documents, photos, or biometric data. Verification is handled entirely by the verification service (currently iDenfy, likely Jumio at scale). Evryn stores only: verified/not-verified flag, date of verification, and the safety identifier. Keeps expertise with experts, limits liability, simplifies privacy story.
**Needs to flow to:** ARCHITECTURE.md (security section), iDenfy/Jumio integration design

### ElevenLabs data flow
**Surfaced:** Legal questionnaire, Q4
**Clarification:** Evryn's spoken responses CAN contain user information (e.g., "I'd love to introduce you to Sarah, she's a filmmaker in Brooklyn"). The text sent to ElevenLabs for voice synthesis may include user data from conversations. This should be reflected in the data flow description.
**Needs to flow to:** ARCHITECTURE.md (voice integration section, when written)

### Evryn in user-user conversations
**Surfaced:** Legal questionnaire, Q5
**Clarification:** Two connected users can invite Evryn to be present in their conversation as an observer. Evryn listens so she stays informed about the relationship, but she does NOT speak in shared conversations — she only speaks in private one-on-one conversations with individual users. This ensures she never accidentally reveals private information. This is NOT a third data-crossing pathway — she doesn't pass information in shared convos. It's an observation mode, always opt-in.
**Needs to flow to:** ARCHITECTURE.md (user isolation section), Evryn system prompt

### Connection types breadth + disclaimers
**Surfaced:** Legal questionnaire
**Clarification:** Evryn connects people across ALL life domains — including contexts that touch regulated fields (medical: connecting someone to a therapist; financial: connecting someone to a financial advisor; legal: connecting someone to a lawyer). Evryn is NOT providing medical, financial, or legal services — she's making introductions. But disclaimers are needed to make this clear.
**Needs to flow to:** Terms of Service, ARCHITECTURE.md, Evryn system prompt

### Trust stance in Terms & Privacy Policy
**Surfaced:** Legal questionnaire
**Clarification:** The T&C and PP need to actively reflect Evryn's trust values, not just be legally compliant. User trust is unusually critical to Evryn's core offering. If the legal language sounds extractive, it undermines the product. Trust-first posture: if there's a way to say something that's both legally sound and supports that posture, prefer it over standard boilerplate.
**Needs to flow to:** Guidance for Fenwick when drafting

### Gatekeeper-specific connection audit trail
**Surfaced:** Legal questionnaire, Q5
**Clarification:** In the gatekeeper pathway, Evryn needs to record reasoning for "pass" decisions (not just "gold" ones). This is different from the many-to-many pathway where non-matches simply don't get surfaced. Reasons: (1) auditability, (2) defense against "poaching" claims, (3) the person may still become a user elsewhere.
**Needs to flow to:** ARCHITECTURE.md (connection lifecycle), BUILD-EVRYN-MVP.md

### Data export process
**Surfaced:** Legal questionnaire, Additional Context
**Decision:** Users email support@evryn.com to request data export. No need to specify format at this stage. Full export provided on request.
**Needs to flow to:** Terms of Service, support processes

## Surfaced during verification pass (2026-02-17)

The following clarifications emerged when AC did a verification pass — reading all system docs against the questionnaire to find gaps. Items below were resolved directly into the questionnaire (sixth draft) and are documented here for flow-through to other docs.

### Vouching mechanics
**Surfaced:** Verification pass — master plan reference describes vouching system
**Clarification:** Users can vouch for people they know, but a vouch is input for Evryn's independent judgment, not a direct mechanism. Evryn evaluates vouches in context: a vouch from a highly trusted user with corroborating signals may carry significant weight; one from a newer user with no corroboration may carry little or none. Key language: "Users do not *directly* affect another user's standing with Evryn. Evryn takes in a variety of signals and exercises her own judgment."
**Needs to flow to:** ARCHITECTURE.md (trust model), Evryn system prompt

### Proactive outreach — default policies + user preferences
**Surfaced:** Verification pass — ARCHITECTURE.md describes proactive behavior as core
**Clarification:** Evryn has default communication policies (she won't spam people) AND users can set preferences during onboarding. Both layers exist. This is relevant for TCPA/consent framing as channels expand beyond email.
**Needs to flow to:** ARCHITECTURE.md (proactive behavior section), Evryn system prompt

### Trust Mirror — DROPPED as a feature
**Surfaced:** Verification pass — master plan reference describes Trust Mirror feature
**Original design:** When a user asks "Would Evryn have connected me to this person?", Evryn gives a graduated response expressing commercial judgment.
**Decision (2026-02-17):** Feature dropped after pressure-testing. Evryn is a broker — she finds you the best match. She doesn't evaluate existing relationships. Three fatal problems: (1) **Membership leakage** — any answer about a specific person risks confirming they're on the platform. (2) **Coercion risk** — becomes a tool for controlling partners. (3) **Honesty poisoning** — if private disclosures can be leveraged, users stop confiding in Evryn. If a user wants to know whether someone is the best mutual match, that's the standard matching process — both people engage independently.
**Needs to flow to:** Hub (Trust Mirror is currently described in the MPR, which needs to be fully ported into Hub — this reversal should be captured during that port), ARCHITECTURE.md (user isolation — remove as controlled pathway), Evryn system prompt (line to hold: "I find you the best match — I don't evaluate your existing relationships")

### Latent Truth Discovery — courier model with explicit consent
**Surfaced:** Verification pass — master plan reference describes this feature
**Clarification:** If two users independently express the same hidden desire/interest, Evryn may offer to facilitate — but ONLY if both have independently expressed it. Evryn acts as a courier: each user must explicitly sign off on exact wording. Justin's framing: this could be a checkbox or submit button — something where Evryn is basically a courier on their behalf, only carrying messages they've explicitly approved. Added to questionnaire as a fourth controlled information pathway (future).
**Needs to flow to:** ARCHITECTURE.md (user isolation), Terms of Service

### Cast-off outreach consent framework
**Surfaced:** Verification pass — BUILD-EVRYN-MVP.md describes ~1,000 cast-offs/week
**Clarification:** These people emailed a gatekeeper (not Evryn) and didn't opt in to hearing from Evryn. However, they initiated contact with someone in Evryn's ecosystem. CAN-SPAM is navigable (doesn't require prior consent for email, requires opt-out mechanism). Framing: "You reached out to [gatekeeper], who works with Evryn. They're not the right fit for this, but if you'd like, I'd be happy to help you find what you're looking for." Legal team asked to advise on consent framework, best practices, and opt-out mechanisms.
**Needs to flow to:** BUILD-EVRYN-MVP.md (cast-off handling), Evryn system prompt (outreach templates)

### Operator access to user data
**Surfaced:** Verification pass — ARCHITECTURE.md describes Justin-as-operator track
**Clarification:** During pilot and early phases, the operations team has direct access to all user data as part of human-in-the-loop oversight. This is necessary for the safety model but must be disclosed in the Privacy Policy. At scale, operator access will be heavily gated and audited. Questionnaire now uses organizational language ("operations team") rather than naming individuals.
**Needs to flow to:** Privacy Policy (disclosure), ARCHITECTURE.md (operator access constraints at scale)

### PII anonymization — current state vs. target
**Surfaced:** Verification pass — master plan describes Privacy Gateway, not yet built
**Clarification:** Today, full user data goes to Anthropic's API without any anonymization or tokenization. The questionnaire now explicitly states this current state alongside the planned tokenization approach.
**Needs to flow to:** ARCHITECTURE.md (security section — note current gap)

### Biometric data laws for voice features
**Surfaced:** Verification pass — voice features (Vapi, Hume) may trigger BIPA
**Clarification:** Voice prints and emotion analysis from voice may qualify as biometric data under Illinois BIPA and similar state laws. BIPA has a private right of action and statutory damages of $1,000-$5,000 per violation. Legal team asked to advise on consent framework before voice features launch.
**Needs to flow to:** ARCHITECTURE.md (voice integration section, when written)

### Connection coaching — not professional advice
**Surfaced:** Verification pass — this will emerge organically, not as a built feature
**Clarification:** Evryn will naturally start sharing observations about patterns she notices ("your emails tend to come across as aggressive" or "I've noticed you rush in romantic connections"). These are her perspective shared as a friend would, not professional guidance. She is not a therapist, career counselor, or licensed advisor. Justin: "this will organically grow — it's not a feature in the traditional sense." Stubbed into questionnaire now so the Terms cover it from day one.
**Needs to flow to:** Terms of Service (disclaimer), Evryn system prompt (coaching guardrails)

### Payments architecture — Stripe handles everything
**Surfaced:** Verification pass — master plan describes Evryn Wallet with stored value
**Clarification:** Justin's instinct: keep all actual monetary value in Stripe. Pre-purchases are completed transactions (processed through Stripe), not held funds. Evryn Credit is non-monetary promotional value — like store credit, not held funds. Peer-to-peer via Stripe Connect means Evryn never touches money in transit. Legal team asked to confirm this avoids money transmitter licensing.
**Needs to flow to:** ARCHITECTURE.md (payments section, when written)

### Crowdfunding and AI-initiated investment solicitation
**Surfaced:** Verification pass + Justin direction — StartEngine not previously in questionnaire
**Clarification:** Evryn plans to solicit investment through StartEngine (Reg CF). StartEngine handles all securities compliance — pass-through model like iDenfy. Evryn may conversationally invite users to invest when they express genuine enthusiasm (not vulnerability). The novelty of an AI making investment solicitations within a conversational product is flagged as an edge case for legal review. Pre-sales (pre-purchasing connections) are also surfaced.
**Needs to flow to:** Terms of Service, any future crowdfunding campaign materials

### Participant-Based Business Access — data stays in Evryn's system
**Surfaced:** Verification pass — master plan describes "Ads Without Ads" revenue stream
**Clarification:** When Evryn connects a user to a paying business, she doesn't hand over the user's information. She puts them in contact through Evryn's system — they would need to exchange external contact info themselves. User must give explicit per-introduction consent. Legal team asked about FTC disclosure requirements and CCPA "sale" definition.
**Needs to flow to:** ARCHITECTURE.md (business user model, when designed), Terms of Service

### Emerging regulatory frameworks
**Surfaced:** Verification pass — system docs describe features touching multiple regulated domains
**Clarification:** Three frameworks flagged for legal team awareness: (1) EU AI Act — automated matching in employment/romantic contexts may be high-risk AI, (2) FCRA — trust assessments could function like consumer reports if they inform third-party decisions, (3) Anti-discrimination — matching in housing/employment contexts must comply with FHA, Title VII, ECOA. Evryn's behavioral filtering (behavior, not belief/identity) is the right approach but needs legal confirmation.
**Needs to flow to:** Terms of Service, ARCHITECTURE.md (compliance section, when written)

---

*Created 2026-02-16 during legal questionnaire session. Updated 2026-02-17 with verification pass findings.*
