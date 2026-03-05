# ADR-015: Situation × Activity Module Matrix

**Status:** Accepted (revised 2026-03-05 — both situations and activities on-demand)
**Date:** 2026-03-02
**Participants:** Justin + AC

## Context

Session 1 designed identity modules as a flat list: triage, conversation, gatekeeper-onboarding, operator. Justin identified the problem: onboarding is shared across situations. The rapport-building, question-asking, and signal-listening content applies whether you're onboarding a gatekeeper, a gold contact, or a cast-off. The *situation* provides customization; the *activity* provides the technique.

## Decision

**Modules split into two types that stack: situations (who) and activities (what).**

Trigger composition: `Core.md + person context from Supabase`. Both situation and activity modules are on-demand — Evryn pulls them via tool when the conversation needs them, guided by the "available modules" section in core.md. One exception: operator is trigger-loaded only (security boundary — see ADR-017). Situation is per-context, not per-person — the same person may be in different situations in different interactions (see ADR-017).

**File structure:** See ARCHITECTURE.md (canonical reference for the file tree and composition model).

## Reasoning

**Why a matrix, not a flat list:**
- Onboarding a gatekeeper and onboarding a gold contact share ~80% of the same content (rapport techniques, Smart Curiosity, signal listening). A flat list means duplicating that content or maintaining an awkward "shared onboarding" section within each module.
- The matrix is additive: v0.3 adds new situation modules (gold-contact, cast-off, new-contact, regular-user) without rewriting activity modules. New activities (e.g., a future "reflection" activity) work across all situations.
- Token efficiency: situation modules are lean context-setters; activity modules only burn tokens when actually needed (on-demand loading). Neither loads unless Evryn determines the conversation needs it.

**How to think about this:** Situation = "who am I talking to and why are they here?" Activity = "what am I doing right now?" Both are determined by Evryn from the conversation, not by the trigger. A gatekeeper forwarding a candidate email: Evryn recognizes the triage context and pulls `gatekeeper.md` + `triage.md`. The same gatekeeper with a quick personal question: Evryn answers naturally, maybe without pulling any module at all. Mark forwarding info about a friend (not a candidate): Evryn recognizes this isn't triage and responds accordingly. The trigger doesn't need to distinguish these cases — Evryn does.

**Why operator is a situation, not an activity:** Operator mode answers "who am I talking to?" — Justin, with full access and operational tone. The *activity* Justin is doing can vary: reviewing triage decisions, discussing a user, giving feedback. The operator situation opens both dimensions (tone + information boundaries); the activity it pairs with depends on what Justin is doing. Operator is also unique in being trigger-loaded only — it's a security boundary, not just a framing difference (ADR-017).

**Why two on-demand directories (public-knowledge vs internal-reference):** Bright security line. `public-knowledge/` contains content Evryn can share with or paraphrase to users (e.g., "what are you?"). `internal-reference/` contains procedures that guide Evryn's behavior but are never surfaced to users (canary procedure, crisis protocols, trust arc scripts). Keeping them structurally separate makes the audience boundary impossible to miss.

**Activity modules are lean, not monolithic (Option A granularity).** Activity modules carry judgment-level guidance, not detailed procedures. Detailed procedures live in `internal-reference/` and Evryn pulls them via tool when she recognizes she needs them. This keeps token budgets tight (~500-800 tokens per activity module) while detailed procedures only burn tokens when actually needed.

**Impact on v0.2:** Two situations (gatekeeper, operator) and three activities. The structure pays off in v0.3 when new situations arrive without rewriting activities.

## References

- Session doc: `2026-02-24-mvp-build-work-s1-4.md` (Session 3 Decision 3)
- Identity Writing S2: `2026-03-04-identity-writing-s2.md` (operator move, granularity, on-demand shift, per-context situations)
- Trigger composition: ADR-012
- Per-context situations and operator security: ADR-017
