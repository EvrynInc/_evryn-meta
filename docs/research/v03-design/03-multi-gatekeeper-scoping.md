# v0.3 Design Proposal: Multi-Gatekeeper Scoping

> **Type:** Research proposal (AC2)
> **Status:** Draft for AC0/Justin review
> **Date:** 2026-03-20
> **Depends on:** ARCHITECTURE.md (User Model, build-for-one-structure-for-many), gatekeeper-approach.md, gatekeeper-flow.md, ADR-018
> **Affects:** Identity composition, approval routing, triage pipeline, relationship graph, notification system

---

## The Problem

v0.2 serves one gatekeeper (Mark). v0.4 targets a second (Megan, via SIFF/film connections). But the architecture test is: **"If we add a second gatekeeper next month, is it a config change or a rewrite?"**

This proposal maps every component that changes when gatekeeper #2 arrives and identifies what's per-gatekeeper vs. global.

---

## What Changes With Gatekeeper #2

### Already Per-Gatekeeper (no changes needed)

These are already structured for many because v0.2 was built with "build for one, structure for many":

| Component | How it works today | Multi-gatekeeper ready? |
|-----------|-------------------|------------------------|
| `users` table | Mark is a row with `profile_jsonb.gatekeeper_criteria` | Yes — Megan gets her own row with her own criteria |
| `emailmgr_items.user_id` | Points to Mark (the gatekeeper who forwarded) | Yes — Megan's forwards point to Megan's user_id |
| Triage classification | Uses the gatekeeper's `gatekeeper_criteria` | Yes — Evryn loads the specific gatekeeper's criteria per-forward |
| Identity files | `gatekeeper.md` is generic (no Mark-specific content) | Yes — situation module works for any gatekeeper |
| `relationships` table | `gatekeeper_triage` edges link to the specific gatekeeper | Yes — edges are per-user-pair |

### Needs Work: Cross-Gatekeeper Dedup

**The scenario:** Bob emails both Mark and Megan. Both gatekeepers forward to Evryn. Evryn now has two `emailmgr_items` for the same person — one per gatekeeper.

**Current behavior (v0.2):** Triage.md already has dedup logic: "Before classifying, check if you've already sent a notification about this person to this gatekeeper." But this only dedupes *within* a single gatekeeper.

**Needed for multi-gatekeeper:**

1. **Cross-gatekeeper awareness during triage.** When processing a forward from Megan, Evryn should know if she already triaged this person for Mark. This doesn't change the classification — Bob might be gold for Mark and pass for Megan — but it changes the story. Evryn's notes should reflect: "This is Bob. I first encountered him through Mark's inbox (classified gold). Now he's also reaching out to Megan."

2. **User record dedup.** The existing identity resolution (match by email, verify same person) already handles this. Bob has one user record regardless of how many gatekeepers he emailed. The `referrer` field on `users` only captures the *first* gatekeeper who surfaced him — but the `relationships` table captures all gatekeeper_triage edges.

3. **Notification dedup.** If Bob is gold for both Mark and Megan, both gatekeepers should be notified (they each need to know). But Evryn's approach to Bob should be coordinated — she shouldn't reach out to Bob twice with different framings. In v0.3 Pathway 1 (outreach on gatekeeper's behalf), this means: one outreach to Bob that acknowledges both connections, or a primary outreach followed by a "and you also caught Megan's eye" addendum.

**Proposed implementation:**

Add to triage.md (or its successor): "Before classifying, also check if this person has been triaged for *any* gatekeeper. If so, load their existing story and note the cross-gatekeeper context. Each gatekeeper still gets their own classification and notification — but your outreach to the person should be coordinated."

The `emailmgr_items` table already supports this — query by `original_from` across all `user_id` values to find cross-gatekeeper hits.

### Needs Work: Approval Routing

**Current:** All outbound goes through Justin on Slack (`#evryn-approvals`). One gatekeeper = one approval queue.

**With two+ gatekeepers:** Volume increases. Justin is still the sole approver in v0.3/v0.4, but the queue needs structure.

**Proposed:**
- **Per-gatekeeper Slack threads** (not channels). Within `#evryn-approvals`, each gatekeeper gets a thread. Evryn tags approvals with which gatekeeper they're for.
- **Priority ordering.** Gold notifications for active gatekeepers should surface above routine follow-ups.
- **Future (v0.4+): per-gatekeeper approval delegation.** When Justin trusts Evryn's judgment for a specific gatekeeper, he can enable auto-send for high-confidence golds. This is per-gatekeeper, not global — Justin might trust Evryn's judgment for Mark's film world but not yet for Megan's different domain.

### Needs Work: Gatekeeper Onboarding Pipeline

**Current:** Manual — Justin introduces Mark to Evryn, Evryn interviews Mark, Mark sets up forwarding.

**For scale:** The pipeline needs to be repeatable:

1. Justin introduces the gatekeeper to Evryn (Slack instruction)
2. Evryn creates the user record with `role: 'gatekeeper'` in profile_jsonb
3. Evryn conducts the intake interview (via email or future web chat)
4. Evryn builds `gatekeeper_criteria` from the interview
5. Gatekeeper sets up forwarding (assisted by Justin or self-serve guide)
6. Validation period (Evryn triages in parallel, gatekeeper gives feedback)
7. Handoff to steady state

The `gatekeeper-onboarding.md` activity module (currently being written by AC1) should be generic enough for any gatekeeper. Each gatekeeper's specific criteria live in their `profile_jsonb`, not in the identity file.

### Needs Work: Evryn's Internal Mental Model

**The subtle thing:** With one gatekeeper, Evryn's world is simple — Mark's criteria, Mark's inbox, Mark's notifications. With two+, Evryn needs to hold multiple gatekeepers' worlds simultaneously and reason about cross-gatekeeper patterns.

**This is NOT a schema problem — it's a context problem.** The trigger loads one user's context per query. When triaging for Megan, Evryn doesn't have Mark's criteria in context. But she *does* have the person's existing story (which might mention Mark).

**Proposed:** No architecture change needed. Evryn's per-query context already includes the person's full story (which captures cross-gatekeeper history). The gatekeeper's criteria are loaded per-query. Cross-gatekeeper reasoning happens through the person's story, not through simultaneous gatekeeper context.

For the rare case where Evryn needs to reason about gatekeeper-to-gatekeeper patterns (e.g., "Mark and Megan both keep classifying the same types of people as gold — is there a network pattern here?"), that's a reflection module concern (v0.4), not a per-query concern.

---

## Per-Gatekeeper vs. Global: The Complete Map

| Concern | Per-Gatekeeper | Global |
|---------|---------------|--------|
| Triage criteria | Per-gatekeeper (`gatekeeper_criteria`) | — |
| Triage classification | Per-gatekeeper (gold for Mark ≠ gold for Megan) | — |
| Notification to gatekeeper | Per-gatekeeper | — |
| Outreach to contact | — | Coordinated across gatekeepers |
| User record | — | One record per person, regardless of source |
| Relationship edges | Per-gatekeeper-pair (separate triage edge per gatekeeper) | Graph is global |
| Approval routing | Per-gatekeeper (threads/tags) | Justin is sole approver |
| Communication preferences | Per-gatekeeper (frequency of notifications to them) | Per-user (for contacts/users) |
| Follow-up cadence | Per-gatekeeper (based on their responsiveness) | care_queue is per-user |
| Trust assessment | — | Global (per-user, not per-gatekeeper) |
| Identity files | — | Generic (no gatekeeper-specific identity) |
| Email forwarding setup | Per-gatekeeper (their email → Evryn) | Single Evryn inbox |
| Validation period | Per-gatekeeper | — |

---

## What Doesn't Change

- **Email polling:** Same `evryn@evryn.ai` inbox. Multiple gatekeepers forward to the same address. The trigger identifies the forwarding gatekeeper from the email headers.
- **Identity composition:** Same Core.md + person context pattern. The gatekeeper's context loads from their user record, not from the identity file.
- **Supabase schema:** No new tables needed (assuming the graph schema from proposal 01 is in place). `emailmgr_items.user_id` already distinguishes gatekeepers.
- **Slack integration:** Same `#evryn-approvals` channel. Thread-based organization within it.

---

## The Second Gatekeeper Checklist

When Megan (or any new gatekeeper) is ready to onboard:

1. [ ] Create user record with gatekeeper role
2. [ ] Evryn conducts intake interview → builds `gatekeeper_criteria`
3. [ ] Set up email forwarding to `evryn@evryn.ai`
4. [ ] Verify the trigger correctly identifies Megan as the forwarding gatekeeper
5. [ ] Run validation period (Evryn triages, Megan gives feedback)
6. [ ] Verify cross-gatekeeper dedup works (test with a sender who emailed both)
7. [ ] Verify approval routing is distinguishable (which gatekeeper is this for?)
8. [ ] Update operator guide with multi-gatekeeper procedures

---

## Open Questions for Justin/AC0

1. **Gatekeeper-specific forwarding addresses?** Currently all gatekeepers forward to `evryn@evryn.ai`. An alternative: `mark@evryn.ai`, `megan@evryn.ai`. This simplifies gatekeeper identification in the trigger (no need to parse forward headers). But it's another email address to manage per gatekeeper. Proposed: stay with `evryn@evryn.ai` for now — header parsing is reliable and scales without new aliases.

2. **Should gatekeepers know about each other?** Mark and Megan might both be in the film world. Should Evryn tell Mark "I'm also working with Megan" to build trust? Or keep gatekeeper relationships private? Proposed: Justin decides case-by-case. Evryn does not volunteer this information by default (user isolation principle applies to gatekeepers too).

3. **Different approval thresholds per gatekeeper?** Justin might trust Evryn's triage for Mark (months of calibration) but want tight review for Megan (new). The approval gate architecture supports this — just need a per-gatekeeper config for auto-send thresholds. Not needed for v0.3 (Justin approves everything), but design for it.
