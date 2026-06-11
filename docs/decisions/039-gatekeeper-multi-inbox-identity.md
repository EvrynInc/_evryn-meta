# ADR-039: Gatekeeper Multi-Inbox Identity (Forward-From ≠ Reply-To)

**Date:** 2026-06-10
**Status:** Accepted (design) — **build parked** until the Phase-6 findings stabilize; then build *ahead* of Mark's real forwarding (not wait-and-see).
**Related:** ADR-036 (original-sender reification), ARCHITECTURE.md (User Model — Identity Resolution v0.2/v0.3)

## Context

The runtime identifies the gatekeeper **purely by the `From` address of the inbound forward** (`processEmail` → `parseEmailAddress(email.from)` → `findOrCreateUser`), and a `users` row holds exactly **one** email. There is no concept of a gatekeeper having (a) more than one forwarding-source address, or (b) a reply-to address distinct from the address forwards arrive from.

Justin's realization (2026-06-10): gatekeepers will likely forward from a **big inbound bucket** address but want Evryn's notifications sent to their **smaller personal inbox**. Two distinct risks:
1. **Identification (the sharp one):** if Mark forwards from an address that isn't on his record, the runtime treats the forward as a brand-new stranger — it never loads his gatekeeper criteria/profile and mis-triages. Effectively a go-live gate.
2. **Reply-routing:** where Evryn's notification lands. Softer at v0.2 — Justin sees the `TO:` on every approval — but still real.

This is a concrete v0.2 instance of what ARCHITECTURE.md already names as a known gap: v0.2 identity resolution is "match by email, escalate ambiguous"; v0.3 needs real multi-email/multi-channel identity ("same person with multiple emails"). It also knots with the existing "validate the real Gmail auto-forward format before go-live" item (BUILD resilience 9e) — what address Mark's auto-forwards actually carry is the unknown that determines how much handling is needed.

## Decision

**Build the identification mechanism AHEAD of Mark's return — do NOT discover-at-setup.** (Justin: when Mark gets back, we can't stop to build it then.)

- **Narrow case (build now, for Mark):** the gatekeeper's record holds a **set of forward-from addresses** + a **designated reply-to**. Evryn recognizes a forward as the gatekeeper's if its `From` matches any of his source addresses; notifications go to his reply-to.
- **Clean shape to avoid build-debt:** store as `aliases[]` + `reply_to` on the user record (or a small alias table) so the v0.3 robust case *extends* it rather than rewriting. ("Build for one, structure for many" — the ~10% abstraction.)
- **Robust case (v0.3, scoped not built):** the general multi-email/multi-channel identity resolution (per ARCHITECTURE.md) — verification-before-merge, escalate-ambiguous, alias graph.
- **Address values are filled at setup:** Evryn asks Mark, during onboarding/setup, *"are you forwarding from the same address you want replies sent to?"* and captures both — but the **mechanism** is built ahead; only the values are setup-time.
- **Must be documented in BOTH runtime and identity layers** (Justin): the runtime carries the alias/reply-to handling; a Mira identity beat carries the "ask the address" behavior.
- **Separate, still-needed:** the one-real-auto-forward test (BUILD 9e) validates the auto-forward *format* (`detectForward`/`splitForwardBody`) — that's orthogonal to identification and still required.

## Consequences

- Mark's forwards are recognized as his regardless of which of his addresses they come from; notifications reach the inbox he wants.
- v0.2 stays single-gatekeeper-simple; the alias/reply-to shape generalizes to gatekeeper #2 as config, not a rewrite.
- One open dependency: we don't yet know what `From` Mark's auto-forwarder will stamp — the one-real-forward test resolves it and confirms whether the alias set needs the bucket address, the personal address, or both.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
