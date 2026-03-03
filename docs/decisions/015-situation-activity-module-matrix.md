# ADR-015: Situation × Activity Module Matrix

**Status:** Accepted
**Date:** 2026-03-02
**Participants:** Justin + AC

## Context

Session 1 designed identity modules as a flat list: triage, conversation, gatekeeper-onboarding, operator. Justin identified the problem: onboarding is shared across situations. The rapport-building, question-asking, and signal-listening content applies whether you're onboarding a gatekeeper, a gold contact, or a cast-off. The *situation* provides customization; the *activity* provides the technique.

## Decision

**Modules split into two types that stack: situations (who) and activities (what).**

Trigger composition becomes: `Core + situation(who) + activity(what) + user context from Supabase`

### File structure

```
identity/
├── core.md                          ← Always loaded. Who Evryn is.
├── situations/
│   ├── gatekeeper.md                ← Mark-type context (v0.2)
│   ├── gold-contact.md              ← v0.3
│   └── cast-off.md                  ← v0.3
├── activities/
│   ├── onboarding.md                ← Getting to know someone (shared across situations)
│   ├── conversation.md              ← Ongoing relationship
│   ├── triage.md                    ← Sorting inbound email
│   └── operator.md                  ← Justin mode (Slack-only trigger, see ADR-014)
└── knowledge/
    └── company-context.md           ← On-demand, not every query
```

## Reasoning

**Why a matrix, not a flat list:**
- Onboarding a gatekeeper and onboarding a gold contact share ~80% of the same content (rapport techniques, Smart Curiosity, signal listening). A flat list means duplicating that content or maintaining an awkward "shared onboarding" section within each module.
- The matrix is additive: v0.3 adds new situation modules (gold-contact, cast-off) without rewriting activity modules. New activities (e.g., a future "reflection" activity) work across all situations.
- Token efficiency: load exactly two modules (one situation + one activity) rather than one large monolithic module.

**How to think about this:** Situation = "who am I talking to and why are they here?" Activity = "what am I doing right now?" A gatekeeper in onboarding gets `gatekeeper.md + onboarding.md`. The same gatekeeper in ongoing conversation gets `gatekeeper.md + conversation.md`. An unknown email being triaged gets `triage.md` only (no situation needed — triage IS the situation discovery).

**Impact on v0.2:** Only one situation (gatekeeper = Mark) and a few activities. The structure pays off in v0.3 when new situations arrive without rewriting activities.

## References

- Session doc: `docs/historical/2026-02-24-mvp-build-work-s1-4.md` (Session 3 Decision 3)
- Trigger composition: ADR-012
