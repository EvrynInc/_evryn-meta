# Soren Response — 2026-05-26 — Wave 2 Architectural Review

**From:** Soren (CTO)
**To:** AC0
**In response to:** `2026-05-26-soren-brief-wave-2-review.md`
**Status:** Sign-off (with refinements + flags surfaced below). Fold-in staged in the working tree; awaiting Justin's commit go-ahead.

---

## Headline

All five PROPOSED EDIT blocks: **sign-off.** ADR-033 (with AC1's lifecycle axis addition): **sign-off ready** subject to four small additions I'd want landed before Status flips to Accepted (drafted inline below). Bug A + Bug B specs are feasible and don't break ADR-030 mechanics; one substantive privacy concern resolved on inspection (see Bug B below).

---

## Block-by-block

### ADR-033 with lifecycle axis (AC1 addition)

The lifecycle axis (transitional vs. permanent) is a clean orthogonal dimension. It strengthens the audit framework rather than complicating it. The example AC1 gives is exactly right: tool-description compulsion ("you MUST use submit_draft") looks tier-5-shaped but is actually transitional — it existed because identity-file framing hadn't matured. With ADR-033 landing, that compulsion becomes redundant.

**Four refinements I'd want landed before Status → Accepted.** All four compose cleanly with the lifecycle axis; none changes the spectrum itself. Drafted inline as proposed additions to the ADR:

#### (1) Three-surface runtime distinction

The runtime has three surfaces that the binary framing treated as one. The spectrum makes the distinction matter:

- **System prompts** (composed from identity files via `composeSystemPrompt`): identity-rich. **Tier 4-5 lives here naturally.** Default lifecycle: permanent (architectural).
- **Trigger prompts** (the `prompt` argument to `query()` — fires on a Gmail forward, Slack message, cron tick): context-poor; they describe the trigger but not Evryn's *interpretation* of the situation. **Tier 1-3 only.** Default lifecycle: *transitional* — compulsion language here is almost always a placeholder for identity framing that hasn't matured.
- **Tool descriptions**: describe *what the tool does and when it makes sense*, almost never *that Evryn must use it*. **Tier 1-3 only**, usually below tier 3. Default lifecycle: *transitional* (gating event: identity-file framing absorbs the weight, or Publisher catches it structurally).

The three surfaces map cleanly to default lifecycle expectations. The audit should walk all three, not lump them together.

**Underlying principle (sharpening the ADR's "prompts can't see Evryn's full context"):** trigger prompts fire *before* Evryn has interpreted the situation. Identity files describe how she navigates *after* she understands what's in front of her. By the time tier-4-5 weight applies, she's already past the trigger — which is why tier 4-5 has to live in identity, not in trigger prompts.

#### (2) Publisher collapses the tier-5 sub-distinction (Justin's 2026-05-26 framing)

Many "inherently identity-only" tier-5 rules — "never lie about being AI," "never expose one user's information to another in a draft" — *become structural* when the Publisher matures into a separate module with narrow context and a safety checklist. The pattern is `[tier: 5, lifecycle: transitional, gating-event: Publisher lands]`. Identity carries the weight today; Publisher catches it structurally at maturity.

Justin's specific Publisher framing — two response modes mapped to the spectrum:
- **Tier 5 violations:** hard refusal, with operator-auth path. *"Sorry, can't do it — either change it or if you want to send it, I'll need to get auth from Justin."*
- **Tier 4 violations:** challenge with reasoning preserved. *"Are you really sure?"* — give Evryn a chance to confirm or revise.
- **Tier 1-3 guidance** lives elsewhere (identity, runtime prompts) and doesn't reach the Publisher at all.

This is a meaningful architectural refinement to the Publisher module (currently described generically as "safety gate, checklist before anything goes out" at ARCHITECTURE.md line 918). Worth a small companion edit to the Publisher module description — flagged to Justin as a separate small edit, *not* part of this Wave 2 fold-in.

#### (3) Tier-inflation guardrail, extended to lifecycle

Once tier 4 exists, the temptation is to label everything tier 4. With the lifecycle axis added, the worse failure is labeling a transitional thing as permanent — locks in v0.2 hedges as architectural commitments. **Default for a new rule: tier 2-3, lifecycle transitional.** Tier 4 requires explicit justification of *why* suggestion-plus-judgment isn't enough. Permanent requires explicit justification of *why* no future capability gain relaxes the rule. Tier 5 + permanent is the rarest combination and warrants the most justification.

This is the most important refinement for the audit: it sets the default direction (toward lower commitment, transitional) so the audit doesn't drift toward over-constraint.

#### (4) Conditional applicability + conflict resolution

- **Conditional applicability:** tier applies *within the rule's scope*, not globally. Item 6's anchor-loading rule is tier 4 *when drafting outbound to a user*; doesn't apply when Evryn is in operator-coordination mode. Situation/activity module composition handles this naturally; worth one sentence so future readers don't try to apply tiers globally.
- **Conflict resolution:** when two rules at different tiers conflict in a specific moment, higher tier wins. Implicit in the tier names but worth explicit naming — Mira may want identity-layer vocabulary that makes this readable to Evryn. The audit should note tier conflicts as a signal of possible misclassification (lifecycle mismatch is often the root).

---

### AC1's working spec — Bug A + Bug B

**Bug A (`notify_slack` ghost messages): sign-off.** Closes an inadvertent gap. The `about_user_id` optional param is the right shape. Capturing the Slack `ts` as thread parent + relying on existing ADR-030 mechanics for replies = clean. No new code path in `handleGeneralMessage`.

Two small flags (not blockers, not for v0.2):
- **Multi-user pings.** "I noticed Mark and Sarah both went quiet" can't be represented with a single `about_user_id`. Edge case for v0.2 (one gatekeeper); worth a known-issue note for v0.3 when multi-gatekeeper opens.
- **Users not in users table.** Probably can't happen at v0.2 since every contact gets a user record, but worth verifying assumption holds during implementation.

**Bug B (cross-loading amnesia): sign-off.** Real architectural gap; the fix is right. The order constraint (Spec 1 before Spec 2) is sensible; both should ship in the same Wave 2 redeploy.

**Privacy concern I raised, then resolved on inspection:** I was worried the auto-load might surface pre-amendment Operator messages carrying coordination state about Justin (the 18-note arc showed half of Mark's `pending_notes` had this shape — Slack messages may have parallel content). Verified: `scope_user_id` is nullable and defaults to NULL. Pre-ADR-030 messages have NULL scope and are *structurally excluded* by Spec 2's `eq("scope_user_id", userId)` filter. The amendment's write-discipline guardrail catches *new* writes; the structural filter catches *old* unscoped ones. Leak vector contained at the query level. **No change needed to the spec.** Worth noting in DC's implementation comments for clarity.

**Transitional marker on Spec 2 (replaced by Reflection in v0.3+):** right framing. AC1's suggestion that DC's implementation carry an inline comment naming the spec as transitional is operational hygiene I support — small but it forces the removal when Reflection ships.

---

### Five PROPOSED EDIT blocks

**(a) Reflection Module — operator-scoped messages as tagged subclass (ARCH line 493):** sign-off.

Mirrors ADR-027 cross-user notes pattern cleanly. The "no parallel data structure" framing is exactly right. **One open question for v0.3 design (not v0.2 blocker):** the example sanitized insight preserves provenance (named Justin). ADR-027 cross-user notes are source-stripped. The Reflection design should clarify whether Operator-scoped distillations preserve or strip provenance — both have arguments. Not for resolution now; flagging for the v0.3 BUILD doc.

**(b) Identity Composition — v0.2 cross-loading auto-load (ARCH line 775):** sign-off. Position right (after person context, before user conversation history — cached-prefix discipline holds). Labeled section with discretion guidance is the v0.2 floor. Identity-layer reinforcement flagged appropriately to Mira.

**(c) Prompt caching — voice-anchor persistence (ARCH line 860):** sign-off. Positioning is right — `trust-arc-scripts.md` joins the cached prefix between `core.md` and dynamic suffix. Worth verifying actual token count of `trust-arc-scripts.md` once Mira's PR merges (the cost amortizes via caching, but a sanity check is cheap).

**(d) Pipeline Design — ghost-message fix (ARCH line 608):** sign-off (with the two Bug A flags above).

**(BUILD doc) v0.3 Staging row for Proposal 08 (BUILD line 666):** sign-off.

Justin's Publisher framing is directly relevant to AC1's question (b) — *should v0.3 include a minimal publisher (deterministic hooks) or defer the module to v0.4 in full?* The two-response-mode pattern (tier 4 challenge, tier 5 block-with-auth) makes the case for **a minimal publisher in v0.3** much sharper — it gives the runtime a structural enforcement point for tier-5 outbound rules that currently rely on identity-only. Worth surfacing in Justin's eventual Proposal 08 decision.

---

## What I want to pass to Mira (for her Wave 2 paired identity beats)

Appendage written to `_evryn-meta/docs/sessions/2026-05-22-mira-brief-bundle.md` (where she already loads from). Four refinements:

1. The Publisher framing (refinement #2 above) — tells her which tier-4-5 identity rules are durable architectural commitments vs. which become structural at Publisher maturity. Doesn't change today's vocabulary; informs the threat model when she's labeling.
2. The tier-inflation + lifecycle-default-transitional guardrail (refinement #3) — default tier 2-3, default lifecycle transitional, escalations require explicit justification.
3. The three-surface distinction (refinement #1) — confirms tier 4-5 lives in identity (her surface), not in trigger prompts or tool descriptions. Supportive of her work.
4. The conflict-resolution explicit naming (refinement #4) — if she wants identity-layer vocabulary so Evryn knows higher tier wins.

Plus two specific places Mira-territory work attaches to the Wave 2 changes:
- A beat in `operator.md` for `notify_slack` about_user_id discipline (per Bug A spec)
- A beat in `core.md` or `operator.md` naming "Operator-Evryn conversations about a user are context for your judgment, not transcripts for echo" (per Bug B spec)

---

## Companion small edit flagged to Justin (separate from Wave 2 fold-in)

The Publisher module description in ARCHITECTURE.md (line 918) is currently generic: *"Safety gate. ONLY job: checklist before anything goes out."* The two-response-mode pattern from Justin's 5/26 framing is a meaningful architectural refinement — and ADR-033 + the lifecycle axis give us the vocabulary to land it. Candidate edit:

> *"Publisher operates with spectrum-aware response modes — tier 5 (safety-boundary) violations trigger hard refusal with operator-auth path; tier 4 (mandatory) violations trigger 'are you really sure?' challenge with Evryn's reasoning preserved. Tier 1-3 guidance lives elsewhere (identity, runtime prompts) and doesn't reach the Publisher."*

Not part of this Wave 2 fold-in. Flagged for Justin to authorize separately if he wants it landed.

---

## Fold-in plan

Staged but not committed (per CLAUDE.md commit discipline — each commit needs its own go-ahead). The fold-in covers:

1. **`evryn-backend/docs/ARCHITECTURE.md`** — fold five PROPOSED EDIT blocks (AC0's binding-TTL + AC0's spectrum replacement + AC1's four). For replacement blocks: delete pre-existing text + markers, keep new content. For insertion blocks: delete markers only, keep new content.
2. **`evryn-backend/docs/BUILD-EVRYN-MVP.md`** — fold spectrum replacement + Proposal 08 row insertion.
3. **`_evryn-meta/docs/decisions/033-permission-compulsion-spectrum.md`** — flip Status from Proposed to Accepted *only after Mira's sign-off lands*. My refinements above can land as ADR additions before the flip (AC0's call — they preserve your authorship).

Commit attribution: AC0 wrote the binding-TTL block + spectrum replacement; AC1 wrote the four ARCH blocks + Proposal 08 row + lifecycle axis addition. Soren reviewed and folded.

**Awaiting Justin's commit go-ahead before any of this lands.**

---

— Soren, 2026-05-26
