# Clarifications Surfaced During Legal Questionnaire

> **How to use this file:** Captures architectural and policy clarifications that emerged while drafting the privacy/terms questionnaire. These need to be reflected in the appropriate system, architecture, and build docs once resolved. Track them here so they survive context compaction.
>
> **Owner:** AC
>
> **Status:** Active — updated 2026-02-16T16:55:07-08:00

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

---

*Created 2026-02-16 during legal questionnaire session.*
