# v0.3 Design Proposal: Trust Architecture at Scale

> **Type:** Research proposal (AC2)
> **Status:** Draft for AC0/Justin review
> **Date:** 2026-03-20
> **Depends on:** trust-and-safety spoke, ARCHITECTURE.md (Security), technical-vision spoke (Privacy & Security, Trust Graph), foundation-architecture.md
> **Affects:** Relationship graph, matching engine, identity verification, user model, deception detection

---

## The Problem

v0.2 trust is simple: Justin approves everything, there's one gatekeeper, and Evryn's "trust assessment" is effectively her triage classification. At 100+ users, this breaks:

1. **Justin can't review everything.** The approval gate is the trust mechanism. When volume exceeds Justin's capacity, trust enforcement must shift from human gatekeeping to structural guarantees.
2. **Trust signals need to compound.** One interaction tells Evryn a little. Fifty interactions across multiple contexts tell her a lot. The system needs to accumulate and reason about trust over time.
3. **Bad actors will arrive.** With gatekeeper cast-off outreach (v0.3), Evryn is contacting people who didn't ask to hear from her. Some will try to game the system.
4. **Trust needs to be per-context.** Someone trustworthy for professional connections might be unreliable for personal ones. The trust-and-safety spoke is explicit: "The assessment is multidimensional, context-specific, and dynamic — not a single score."

---

## Design Principle: Trust Is a Story, Not a Score

From the Hub: "Trust and fit are a story, not a score. Multi-dimensional, context-specific. Structured as a document in the user profile, not a number."

This is a fundamental constraint. The architecture must resist the urge to reduce trust to a number — even internally. Trust is Evryn's narrative judgment about someone, grounded in observed behavior.

---

## Proposed: Trust as a Profile Layer

### Where Trust Lives

Trust is NOT a separate table. It's a structured section within `profile_jsonb`, alongside the story:

```jsonc
{
  "trust": {
    // Evryn's current assessment (the "hot" trust context)
    "current_standing": "positive",  // positive, cautionary, concerning, restricted
    "summary": "Consistent, responsive, follows through. Professional interactions are straightforward. No concerning signals.",

    // Per-context trust (multidimensional)
    "context_assessments": {
      "professional": {
        "standing": "positive",
        "basis": "Strong follow-through on 3 introductions. Direct communicator.",
        "last_updated": "2026-04-15"
      },
      "personal": {
        "standing": "insufficient_data",
        "basis": "No personal-context interactions yet.",
        "last_updated": "2026-04-15"
      }
    },

    // Behavioral signals Evryn has observed (cumulative)
    "observed_signals": [
      {
        "signal": "follow_through",
        "valence": "positive",
        "context": "Responded to connection within 24 hours, followed up as promised",
        "date": "2026-04-10",
        "weight": "moderate"
      },
      {
        "signal": "honesty",
        "valence": "positive",
        "context": "Corrected a claim from initial email when asked for detail",
        "date": "2026-04-12",
        "weight": "strong"
      }
    ],

    // Verification status
    "identity_verified": false,
    "identity_verified_at": null,
    "identity_hash": null,  // Non-reversible salted hash (post-verification)

    // Trust graph position (computed, not stored — or cached for performance)
    "vouched_by": ["user_uuid_1"],
    "vouch_weight": "moderate"  // Based on voucher's own trust standing
  }
}
```

### Why Not a Separate Table?

Trust is inseparable from understanding. Evryn's trust assessment of someone is part of her understanding of that person — loading it separately from their story would fragment her reasoning. When Evryn decides whether to connect two people, she needs both profiles *with* trust context in a single read.

The `relationships` table (from proposal 01) carries trust signals on *edges* (how the relationship itself is trusted). The `profile_jsonb.trust` carries trust signals on *nodes* (how the person is trusted). Both are needed.

---

## Trust Signal Categories

From the trust-and-safety spoke — what Evryn observes:

| Signal Category | What Evryn Watches | How It Manifests |
|----------------|-------------------|-----------------|
| **Honesty** | Consistency between claims, willingness to correct | Verified claims, corrections, contradictions |
| **Kindness/Respect** | Tone in conversations, treatment of Evryn | Language patterns, escalation behavior |
| **Reliability** | Follow-through on commitments, response patterns | Connection outcomes, ghosting, timing |
| **Boundaries** | Healthy boundary-setting, respect for others' boundaries | Push-back patterns, consent behavior |
| **Emotional Presence** | Genuine engagement vs. transactional interaction | Conversation depth, vulnerability, curiosity |

These are NOT scored. They're narrative observations stored in `observed_signals` and synthesized into the `summary` and `context_assessments`.

---

## Trust Progression: How Trust Builds

### Phase 1: Unknown (new user)

- **Standing:** `insufficient_data`
- **What Evryn does:** Forgiving skepticism. Protect proactively, don't rush to judgment. Lean "edge case" over "pass" when info is limited.
- **Connection access:** Limited to low-stakes connections (professional introductions, practical needs). No high-stakes matches (romantic, financial) until trust builds.

### Phase 2: Emerging (a few interactions)

- **Standing:** `positive` (default trajectory) or `cautionary` (if signals concern)
- **What Evryn does:** Normal service. Begins offering higher-stakes connections if context assessments support it.
- **Identity verification:** Required before any brokered connection (not before exploration). Evryn introduces this naturally: "Before I can connect you with someone, I need to know you're real — same way I'd want to verify anyone I'd introduce you to."

### Phase 3: Established (multiple interactions, connection outcomes)

- **Standing:** `positive` with rich context assessments
- **What Evryn does:** Full service. Proactive match proposals. Deeper conversations. Trust-based pricing (higher trust → more latitude on pricing).
- **Vouching:** Can vouch for others, with vouch weight based on their own standing.

### Phase 4: Restricted (trust erosion)

- **Standing:** `concerning` or `restricted`
- **What Evryn does:** Reduces connection access. May stop matching entirely. Doesn't announce this — just goes quiet (per trust-and-safety spoke: "If Evryn can't trust a user, she stops connecting them. She doesn't usually need to 'ban' — she just goes quiet.").
- **Path back:** Trust can be rebuilt through consistent positive behavior. Evryn is forgiving but remembers.

---

## Identity Verification at Scale

### v0.2 (current): No verification

No connections are being brokered, so verification isn't needed yet.

### v0.3: Verification before connections

When Evryn proposes a match, both parties must be verified before the connection proceeds. The flow:

1. Evryn identifies a match
2. Checks verification status of both parties
3. If either is unverified, initiates verification flow first
4. Once both are verified, proceeds with the Evryn Dance

### Verification Flow

From the trust-and-safety spoke: "Third-party service handles verification; Evryn only stores verified or not."

```
User hasn't verified yet
  → Evryn: "Before I can introduce you to someone, I need to verify your identity.
     It's quick — just a photo ID check through a secure third-party service.
     I never see your ID — I just get a yes or no. Would you like to proceed?"
  → User agrees → redirect to iDenfy verification flow
  → iDenfy callback → update profile_jsonb.trust:
     - identity_verified: true
     - identity_verified_at: timestamp
     - identity_hash: generated non-reversible salted hash
```

**The hash:** Generated at verification time. Survives account deletion (trust imprint). Used for:
- Recognizing returning identities (banned user tries to re-register)
- Anchoring trust memory to a persistent identity

**Implementation detail:** The hash generation and storage should be a separate, auditable service — not embedded in the main Evryn query flow. This is a security boundary: the verification result comes from iDenfy, the hash is generated server-side, and Evryn only sees the boolean result.

---

## Deception Detection (Foundational Design)

### v0.3 Scope: Behavioral Signals

Full AI-powered deception detection (deepfakes, linguistic pattern analysis) is v0.4+. But v0.3 should capture the behavioral signals that enable it:

1. **Consistency tracking.** Compare claims across conversations. If someone says they're a "10-year DP" in one conversation and a "recent film school grad" in another, that's a signal. The structured story (proposal 05) preserves these claims with timestamps.

2. **Pattern detection across the population.** If 5 users send identical messages, that's suspicious. The reasoning_traces table (proposal 04) enables querying for similar patterns.

3. **Prompt injection resistance.** Already enforced architecturally (external data is untrusted, separated from instructions). But at scale, adversarial users will try harder. The publisher module (v0.4) adds a second layer.

### Evryn's Response to Deception

From core.md: "Trust people ↔ Verify claims — you start from good faith, but you're not naive."

Evryn doesn't accuse. She notices and adjusts:
- **Mild inconsistency:** Notes it in the story, may gently probe. "Earlier you mentioned X — I want to make sure I have the right picture."
- **Pattern of inconsistency:** Downgrades trust standing to `cautionary`. Reduces connection access.
- **Clear deception:** Flags to Justin. Updates trust to `restricted`. May cease engagement.

---

## Trust Graph Traversal

### How Trust Flows Through the Network

The `relationships` table (proposal 01) carries trust signals on edges. Combined with per-user trust in profiles, Evryn can reason about trust transitively:

**Vouching path:** User A (high trust) vouches for User B (new). The `vouched` edge in the relationships table + User A's trust standing gives User B a trust boost. This isn't automatic — Evryn evaluates the vouch in context (per trust-and-safety spoke: "a vouch from a highly trusted user with corroborating signals may carry significant weight; one from a newer user with no corroboration may carry little or none").

**Social network awareness:** As the graph grows, Evryn can see connection patterns. If a new user is connected to three highly-trusted users, that's a positive signal — even without a formal vouch.

**Safety traversal:** Before proposing a match, query the graph for concerning paths (are they connected to known bad actors? are there relationship patterns that suggest risk?).

### Performance at Scale

At 100 users: graph traversal is trivial (in-memory or simple SQL).
At 1,000 users: indexed queries on the relationships table are sufficient.
At 10,000+: May need materialized views or a graph-specific query pattern. But this is v0.5+ territory.

---

## The Approval Gate Evolution

### v0.2 (current): Justin approves everything

All trust is delegated to Justin. Works for one gatekeeper.

### v0.3 (proposed): Tiered approval

As Evryn's calibration improves and volume grows, the approval gate should tier:

| Confidence | Trust Standing (both parties) | Approval Required |
|------------|------------------------------|-------------------|
| High | Both verified + positive | Auto-approve (Justin notified, can override) |
| High | One unverified or cautionary | Justin approves |
| Medium | Any | Justin approves |
| Low / Edge | Any | Justin approves + explicit reasoning |

**Justin controls the thresholds.** He can tighten back to "approve everything" at any time. The system defaults to maximum oversight and loosens only as Justin grants trust.

**Auto-approve is NOT auto-send.** Even when Evryn's decision is auto-approved, the outbound message still goes through the publisher safety check (v0.4). For v0.3 without a publisher: auto-approve means Justin sees a Slack notification ("I sent this to Sarah — here's why") with a 15-minute window to recall.

### v0.4+: Publisher module as trust gate

The publisher module (safety gate with narrow context) takes over the mechanical safety check. Justin shifts to strategic oversight — reviewing patterns, not individual messages.

---

## Open Questions for Justin/AC0

1. **Trust standing granularity:** Four levels proposed (positive, cautionary, concerning, restricted). Is this enough? Alternative: a finer scale (positive/good/neutral/cautionary/concerning/restricted). Proposed: start with four — they map cleanly to behavior changes (full access / reduced access / minimal access / no access).

2. **Trust decay:** Should trust erode if a user goes dormant? Proposed: no. Trust is behavioral, and absence of behavior is not negative behavior. But `transient_state` in the story (proposal 05) may note that Evryn's understanding is stale — which affects matching confidence, not trust standing.

3. **Cross-gatekeeper trust:** If Mark says "Sarah Chen was great" and Megan independently says "Sarah Chen was great," should that double-count? Proposed: yes, but with diminishing returns. Multiple positive signals from independent sources strengthen trust more than multiple signals from the same source. The `observed_signals` array captures provenance, enabling this reasoning.

4. **Identity verification provider:** iDenfy is the current plan (Jumio at scale — per BizOps spoke). When should the switch happen? Proposed: evaluate at 500+ verifications. iDenfy's pricing and reliability at volume should be validated before committing.

5. **Auto-approve timeline:** When does Justin start trusting Evryn enough for tiered approval? This is a judgment call, not a technical one. The system should support it from v0.3 launch, but it activates only when Justin says so. Proposed: build the tiered approval infrastructure in v0.3, default to "approve everything," let Justin loosen it per-gatekeeper as confidence builds.
