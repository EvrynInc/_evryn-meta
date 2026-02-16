# Clarifications Surfaced During Legal Questionnaire

> **How to use this file:** Captures architectural and policy clarifications that emerged while drafting the privacy/terms questionnaire. These need to be reflected in the appropriate system, architecture, and build docs once resolved. Track them here so they survive context compaction.
>
> **Owner:** AC
>
> **Status:** Active — items added 2026-02-16

---

## Unresolved (need decisions)

### Gatekeeper first-right-of-refusal
**Surfaced:** Legal questionnaire, Q5 connection decisions
**Issue:** When a person emails a gatekeeper and Evryn classifies them as a "pass" for that gatekeeper — but they'd be a great match for someone else — does the gatekeeper get first right of refusal before Evryn connects that person elsewhere? What if the person is in multiple gatekeepers' inboxes simultaneously? We need clear rules here to avoid any appearance of "poaching" inbound from gatekeepers, and to be transparent about what we're doing and why.
**Needs to flow to:** ARCHITECTURE.md (connection lifecycle), BUILD-EVRYN-MVP.md (cast-off handling), Evryn's system prompt (judgment framework)
**Status:** Open — Justin flagged, needs discussion

### Identity verification data retention
**Surfaced:** Legal questionnaire, Additional Context
**Issue:** Current architecture says verification artifacts (ID photos, documents) are discarded immediately after verification. Should we reconsider? Could verification data be kept as part of the user profile? What's the compelling reason to delete vs. retain? Privacy vs. re-verification convenience vs. legal risk.
**Needs to flow to:** ARCHITECTURE.md (security section), iDenfy integration design
**Status:** Open — Justin flagged, needs discussion

### Age requirement: 16 vs 18
**Surfaced:** Legal questionnaire, Additional Context
**Issue:** Need to decide minimum age before finalizing with legal team. 16 with parental consent, or 18 flat? Connection types include romantic contexts, which pulls toward 18. But professional/creative connections for 16-17 year olds are legitimate.
**Needs to flow to:** Terms of Service, ARCHITECTURE.md (user model)
**Status:** Open — Justin flagged, needs discussion

### Safety imprint implementation approach
**Surfaced:** Legal questionnaire, Q5 account deletion
**Issue:** The "non-reversible salted hash" is one technical approach to remembering willingness to do business with deleted accounts. Is it the best approach? Should the legal/policy docs be more general about the mechanism, or specific? Risk of boxing in to one approach vs. clarity for regulators.
**Needs to flow to:** ARCHITECTURE.md (security section), privacy policy
**Status:** Open — Justin flagged, needs discussion

### Data export format and process
**Surfaced:** Legal questionnaire, Additional Context
**Issue:** Data portability is a right, but we haven't defined the format or process. Current answer: email support@evryn.com. Do we need to specify more than that?
**Needs to flow to:** Terms of Service, support processes
**Status:** Open — needs discussion

## Resolved (need to be written into docs)

### ElevenLabs data flow
**Surfaced:** Legal questionnaire, Q4
**Clarification:** Evryn's spoken responses CAN contain user information (e.g., "I'd love to introduce you to Sarah, she's a filmmaker in Brooklyn"). The text sent to ElevenLabs for voice synthesis may include user data from conversations. This should be reflected in the data flow description.
**Needs to flow to:** ARCHITECTURE.md (voice integration section, when written)

### Evryn in user-user conversations
**Surfaced:** Legal questionnaire, Q5
**Clarification:** Evryn can be invited into direct conversations between connected users — as a mediator, facilitator, or just to help. This is always opt-in. This is a third pathway for cross-user data flow (in addition to mediated introductions and direct messaging after mutual consent).
**Needs to flow to:** ARCHITECTURE.md (user isolation section), Evryn system prompt

### Connection types breadth + disclaimers
**Surfaced:** Legal questionnaire
**Clarification:** Evryn connects people across ALL life domains — including contexts that touch regulated fields (medical: connecting someone to a therapist; financial: connecting someone to a financial advisor; legal: connecting someone to a lawyer). Evryn is NOT providing medical, financial, or legal services — she's making introductions. But disclaimers are needed to make this clear.
**Needs to flow to:** Terms of Service, ARCHITECTURE.md, Evryn system prompt

### Trust stance in Terms & Privacy Policy
**Surfaced:** Legal questionnaire
**Clarification:** The T&C and PP need to actively reflect Evryn's trust values, not just be legally compliant. If the legal language sounds creepy or extractive, it undermines the product. This doesn't mean weak legal protections — it means the language should signal who Evryn is while being legally sound.
**Needs to flow to:** Guidance for Fenwick when drafting

### Gatekeeper-specific connection audit trail
**Surfaced:** Legal questionnaire, Q5
**Clarification:** In the gatekeeper pathway, Evryn needs to record reasoning for "pass" decisions (not just "gold" ones). This is different from the many-to-many pathway where non-matches simply don't get surfaced. Reasons: (1) auditability, (2) defense against "poaching" claims, (3) the person may still become a user elsewhere.
**Needs to flow to:** ARCHITECTURE.md (connection lifecycle), BUILD-EVRYN-MVP.md

---

*Created 2026-02-16 during legal questionnaire session.*
