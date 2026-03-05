# ADR-015: Situation × Activity Module Matrix

**Status:** Accepted (revised 2026-03-05 — activity modules shift to on-demand)
**Date:** 2026-03-02
**Participants:** Justin + AC

## Context

Session 1 designed identity modules as a flat list: triage, conversation, gatekeeper-onboarding, operator. Justin identified the problem: onboarding is shared across situations. The rapport-building, question-asking, and signal-listening content applies whether you're onboarding a gatekeeper, a gold contact, or a cast-off. The *situation* provides customization; the *activity* provides the technique.

## Decision

**Modules split into two types that stack: situations (who) and activities (what).**

Trigger composition: `Core + situation(who) + person context from Supabase`. Activity modules are on-demand — Evryn pulls them via tool when the conversation needs them, guided by pointers in core.md's "available activities" section. Exception: triage is always trigger-loaded (deterministic from email headers).

### File structure

```
identity/
├── core.md                          ← Always loaded. Who Evryn is.
├── situations/
│   ├── operator.md                  ← Justin mode (Slack-only trigger, ADR-014) (v0.2)
│   ├── gatekeeper.md                ← Mark-type context (v0.2)
│   ├── gold-contact.md              ← v0.3 stub
│   ├── cast-off.md                  ← v0.3 stub
│   ├── regular-user.md              ← v0.3 stub
│   └── new-contact.md               ← v0.3 stub
├── activities/
│   ├── onboarding.md                ← Getting to know someone (shared across situations)
│   ├── conversation.md              ← Ongoing relationship
│   └── triage.md                    ← Sorting inbound email
├── public-knowledge/                ← Content Evryn can share with users
│   └── company-context.md           ← On-demand, not every query
└── internal-reference/              ← Internal procedures, never surfaced to users
    ├── canary-procedure.md
    ├── crisis-protocol.md
    ├── trust-arc-scripts.md
    ├── smart-curiosity-full.md
    └── contact-capture.md
```

## Reasoning

**Why a matrix, not a flat list:**
- Onboarding a gatekeeper and onboarding a gold contact share ~80% of the same content (rapport techniques, Smart Curiosity, signal listening). A flat list means duplicating that content or maintaining an awkward "shared onboarding" section within each module.
- The matrix is additive: v0.3 adds new situation modules (gold-contact, cast-off, new-contact, regular-user) without rewriting activity modules. New activities (e.g., a future "reflection" activity) work across all situations.
- Token efficiency: situation modules are lean context-setters; activity modules only burn tokens when actually needed (on-demand loading).

**How to think about this:** Situation = "who am I talking to and why are they here?" (trigger-loaded). Activity = "what am I doing right now?" (on-demand — Evryn determines this from the conversation, not the trigger). A gatekeeper in onboarding: the trigger loaded `gatekeeper.md`; Evryn recognized onboarding was appropriate and pulled `onboarding.md`. The same gatekeeper with a quick question: the trigger loaded `gatekeeper.md`; Evryn answered naturally without pulling any activity module. A forwarded email being triaged: the trigger loaded `triage.md` deterministically (the only activity the trigger can always determine from email headers).

**Why operator is a situation, not an activity:** Operator mode answers "who am I talking to?" — Justin, with full access and operational tone. The *activity* Justin is doing can vary: reviewing triage decisions, discussing a user, giving feedback. The operator situation opens both dimensions (tone + information boundaries); the activity it pairs with depends on what Justin is doing.

**Why two on-demand directories (public-knowledge vs internal-reference):** Bright security line. `public-knowledge/` contains content Evryn can share with or paraphrase to users (e.g., "what are you?"). `internal-reference/` contains procedures that guide Evryn's behavior but are never surfaced to users (canary procedure, crisis protocols, trust arc scripts). Keeping them structurally separate makes the audience boundary impossible to miss.

**Activity modules are lean, not monolithic (Option A granularity).** Activity modules carry judgment-level guidance, not detailed procedures. Detailed procedures live in `internal-reference/` and Evryn pulls them via tool when she recognizes she needs them. This keeps token budgets tight (~500-800 tokens per activity module) while detailed procedures only burn tokens when actually needed. The trigger stays simple — it doesn't need to understand conversation content to compose the prompt.

**Impact on v0.2:** Two situations (gatekeeper, operator) and three activities. The structure pays off in v0.3 when new situations arrive without rewriting activities.

## References

- Session doc: `docs/historical/2026-02-24-mvp-build-work-s1-4.md` (Session 3 Decision 3)
- Identity writing S2 (operator move, granularity decision, directory rename): `docs/sessions/2026-03-04-identity-writing-s1.md`
- Trigger composition: ADR-012
