# ADR-018: Gold → Match Rename + Bilateral Match Reframe

**Date:** 2026-03-18
**Status:** Accepted

## Context

The triage pipeline classifies forwarded emails as `gold / pass / edge` in the `emailmgr_items.triage_result` field. "Gold" was coined informally during early triage design — it meant "this person is worth the gatekeeper's time." The term worked internally but created two problems:

1. **Public-facing awkwardness.** When drafting the Terms of Service and Privacy Policy with Fenwick, "gold" felt wrong in legal language. We substituted "match" in the legal docs, then asked: why isn't it "match" everywhere?

2. **Conceptual blind spot.** "Gold" frames triage as a one-directional filter — finding Mark's treasure in his inbox. But the original sender already expressed interest in Mark by emailing them. That's a signal. When Evryn confirms the fit against the gatekeeper's criteria, she's confirming a *bilateral match*: both sides have signaled interest, Evryn is validating and brokering.

This blind spot meant we weren't thinking about the sender's side of the story — their needs, their intent, their experience. We were treating them as objects to be classified, not people being matched.

## Decision

1. **Rename `gold` → `match`** across the entire system. `triage_result` values become: `match / pass / edge`.

2. **Reframe triage as Evryn's first matching engine.** The triage pipeline is not a filter — it's the same matching operation that v0.3 does at scale, applied to a gatekeeper's inbox. A `match` result means Evryn has confirmed a bilateral fit.

3. **Track the sender's side from day one.** The sender's `profile_jsonb.story` should capture what *they* wanted (why they reached out, what they were looking for), not just how they scored against the gatekeeper's criteria. In v0.3, their history with Evryn starts here — not at signup.

## Consequences

- **Schema migration:** `triage_result` CHECK constraint updated (`gold` → `match`). Any existing rows with `gold` must be migrated.
- **Code changes:** Approval flow subject lines (`[Evryn] Gold` → `[Evryn] Match`), Slack parsing patterns, classification logic in triage processing.
- **Identity docs:** `triage.md` references to "gold" updated. Any future identity docs use "match."
- **Operator guide:** Approval commands, triage notification table updated.
- **Test fixtures:** Answer key values updated.
- **Alignment with v0.3+:** The connection between sender and gatekeeper is now tracked as a brokered match from the start, not retroactively reclassified when the matching system comes online.
