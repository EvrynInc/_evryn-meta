# ADR-022: Evryn Observation of Connection Conversations Deferred Past v0.3

**Date:** 2026-03-28
**Status:** Accepted
**Decision maker:** Justin

## Context

The UX spoke and ARCHITECTURE.md described a feature where two connected users could invite Evryn to observe their conversation — she'd listen to stay informed about the relationship but never speak, to prevent accidental information leaks. This was always opt-in (both parties must invite her) and designed as a calibration mechanism: Evryn learns from the actual interaction, not just each user's self-report.

During v0.3 wireframing and scoping (March 28 session with Mira, Soren, Nathan), Justin raised several concerns:

1. **Asymmetric consent complexity.** What if User A allows observation but User B doesn't? Do you tell User A that User B declined? That decline *becomes* the opening dynamic of the relationship — one person wanted Evryn present, the other didn't, and now both know it. The UX is convoluted.
2. **Surveillance feel.** Even with opt-in, the presence of an AI observer in a private conversation between two people changes the nature of that conversation. Justin's words: "I want it not to feel surveillance-y and convoluted."
3. **Unnecessary for v0.3 scope.** The aftercare model (users return to Evryn after their conversation and share how it went) provides a calibration feedback loop without the complexity. It's simpler, cleaner, and maintains the privacy of the connection conversation.

## Decision

Defer Evryn's observation of connection conversations past v0.3. For v0.3, connection conversations are fully private — Evryn is not present. Users report back to Evryn during aftercare. Before connecting two users, Evryn explicitly sets this expectation: "After you two talk, come back and tell me how it goes, okay?"

## Rationale

- Aftercare provides a feedback loop that's simpler and feels more natural — it mirrors how a real matchmaker works (you tell them how the date went, they don't sit at the next table listening)
- Eliminates the asymmetric consent problem entirely
- Keeps connection conversations feeling private and human
- The quality of aftercare feedback may be *better* than observation — users reflect on and synthesize their experience rather than Evryn trying to interpret raw conversation
- Observation can be revisited when the product is mature enough that the consent UX can be designed thoughtfully, and when there's evidence that aftercare feedback alone is insufficient

## Consequences

- UX spoke (`user-experience.md`): observation sections updated with deferral note, v0.3 aftercare model described
- ARCHITECTURE.md: "Shared conversations" paragraph updated with deferral note and reasoning
- BUILD-EVRYN-MVP.md: "Evryn stays present" breadcrumb updated to "deferred past v0.3"
- Wireframe v2 will not include any observation UI
- Meeting prep doc for Fenwick should note this deferral (they may have seen observation referenced in prior materials)
- The long-term observation design remains in the docs as the future vision — this decision defers it, it doesn't kill it
