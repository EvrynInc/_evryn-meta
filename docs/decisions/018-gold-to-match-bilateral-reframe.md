# ADR-018: Triage as Bilateral Matching (Gold ≠ Match)

**Date:** 2026-03-18 (revised 2026-03-19)
**Status:** Accepted (revised — original proposed renaming gold→match; revision keeps gold, clarifies the lifecycle, adds status lifecycle design)

## Context

The triage pipeline classifies forwarded emails as `gold / pass / edge` in the `emailmgr_items.triage_result` field. "Gold" was coined informally during early triage design — it meant "this person is worth the gatekeeper's time."

When drafting the Terms of Service and Privacy Policy with Fenwick, "gold" felt wrong in legal language. We substituted "match" in the legal docs, which prompted the question: why isn't it "match" everywhere?

Exploring the rename surfaced a deeper insight: the "gold" framing treated triage as a one-directional filter — finding the gatekeeper's treasure. But the original sender already expressed interest by emailing the gatekeeper. That's a signal. When Evryn confirms the fit, both sides have signaled interest. Triage is Evryn's first matching engine, not just a filter.

## The Gold → Match Lifecycle

The initial proposal was to rename `gold` to `match`. On further analysis, gold and match are different stages — not synonyms:

- **Gold** = Evryn's prediction. "I think this person matches the gatekeeper's criteria, worth surfacing." This is a judgment call. Evryn could be wrong.
- **Match** = confirmed reality. The gatekeeper validated the connection — "yeah, that's a great fit." Both sides have confirmed.

Calling someone a "match" at the triage stage is premature — like calling someone a hire before the interview. Gold is the right word for the triage classification: it captures Evryn's assessment without claiming a confirmed outcome.

The legal docs (Terms, Privacy Policy) correctly use "match" because they describe confirmed connections, not triage predictions.

## Decision

1. **Keep `gold` as the triage_result value.** `triage_result` values remain: `gold / pass / edge`. Gold is Evryn's classification — her prediction, not a confirmed outcome. `triage_result` is immutable after classification — it records what Evryn thought, and that record is valuable for auditing her accuracy.

2. **`match` is the next stage.** When the gatekeeper confirms — "yeah, that's great" — the connection becomes a match. Gold is a waypoint on the road to match. This distinction matters for v0.3+ where "match" is the core product.

3. **Reframe triage as Evryn's first matching engine.** The bilateral insight stands: both sides have signaled interest (sender emailed the gatekeeper, Evryn confirmed the fit). Triage is the same operation v0.3 does at scale, applied to a gatekeeper's inbox. The difference is that triage produces *candidates* (gold), not *confirmed matches*.

4. **Track the sender's side from day one.** The sender's `profile_jsonb.story` should capture what *they* wanted (why they reached out, what they were looking for), not just how they scored against the gatekeeper's criteria. In v0.3, their history with Evryn starts here — not at signup.

5. **Gatekeeper feedback completes the transaction.** In v0.3+ matching, double opt-in gives Evryn a clear confirmation signal. In v0.2 triage, the flow is asymmetric: Evryn sends a gold notification to the gatekeeper, and then silence. The gatekeeper might act on it, ignore it, or love it but never tell Evryn. Without explicit feedback, gold stays gold — it never becomes a confirmed match, and Evryn can't learn from the outcome. This means:
   - **Gatekeeper onboarding must set the expectation** that feedback closes the loop — not just for training ("helps me learn") but transactionally ("I need to know if this landed so I can complete the connection on my end").
   - **v0.2:** A cron checks for delivered items older than 7 days and triggers Evryn to follow up with the gatekeeper through the normal approval flow. Justin still approves every outbound message — the cron just prompts Evryn to act, it doesn't bypass the approval gate.
   - **v0.3:** Evryn follows up proactively — no cron trigger needed. This is the bridge between the triage pipeline and the full matching engine.

6. **Separate classification from lifecycle.** `triage_result` and `status` are different concerns on `emailmgr_items`:
   - `triage_result` = Evryn's immutable classification (gold / pass / edge). What Evryn thought.
   - `status` = where this item is in its lifecycle. What's happening with it now.

   This separation enables clean auditing: compare `triage_result` against terminal `status` to measure Evryn's prediction accuracy (e.g., "how often do my golds become matches?").

7. **Status lifecycle on emailmgr_items.** Every status is specific — no generic "done" bucket:

   ```
   new → processing → pending_approval → delivered → matched / passed / no_gk_response
                    → escalated → (resolves to one of the above)
                    → error → (retried back to processing)

   For triage_result = pass:      status goes straight to → passed
   For triage_result = ignore:    status goes straight to → ignored
   For triage_result = bad_actor: status goes straight to → bad_actor
   ```

   **Terminal states:** `matched`, `passed`, `ignored`, `bad_actor`, `no_gk_response`
   **Non-terminal states:** `new`, `processing`, `pending_approval`, `escalated`, `delivered`, `error`

   The `delivered` state means: notification sent to gatekeeper, awaiting feedback. Items cycle `delivered → pending_approval → delivered` during follow-ups (each follow-up goes through the approval gate). Terminal states are the only "done."

8. **Follow-up tracking in metadata.** Instead of adding follow-up statuses, track follow-up state in `emailmgr_items.metadata`:

   ```json
   {
     "draft": { "..." },
     "follow_ups": 2,
     "last_follow_up_at": "2026-03-17T10:00:00-07:00"
   }
   ```

   The stale item checker uses `last_follow_up_at` (or `updated_at` if no follow-ups yet) to determine if it's time to trigger Evryn again. Evryn sees the follow-up count and decides: 0 → send first follow-up; 2+ → recommend closing as `no_gk_response`.

9. **Lifecycle metadata for auditability.** Every status change is recorded in `metadata.lifecycle` with timestamptz:

   ```json
   {
     "lifecycle": [
       { "status": "new", "at": "2026-03-17T09:00:00-07:00" },
       { "status": "processing", "at": "2026-03-17T09:00:05-07:00" },
       { "status": "pending_approval", "at": "2026-03-17T09:01:00-07:00" },
       { "status": "delivered", "at": "2026-03-17T09:05:00-07:00" }
     ]
   }
   ```

   Full audit trail without extra columns. `updated_at` (auto-managed) is the only timestamp column needed for queries — `processed_at` is dropped.

10. **Identity-level approval backstop.** The approval gate is enforced at the code level (only `submit_draft` tool, no `send_email`). But as belt-and-suspenders, `core.md` must include: "You never send anything to anyone without operator approval. Every outbound message goes through the approval flow. No exceptions." This protects against future code changes that might accidentally add a direct send path.

## Consequences

- **Schema changes needed for v0.2:**
  - Update `status` CHECK constraint: add `delivered`, `matched`, `passed`, `ignored`, `bad_actor`, `no_gk_response`; remove `done`
  - Drop `processed_at` column (use `updated_at` for all timestamp queries)
  - For `sender_type = ignore` and `bad_actor`: status goes straight to terminal (`ignored`, `bad_actor`) instead of through the full lifecycle
- **`triage_result` stays immutable.** Gold stays in the CHECK constraint, code, identity docs, operator guide, and test fixtures. No rename.
- **Legal docs use "match"** for confirmed connections — this is correct and intentional. No collision with the internal `gold` classification.
- **v0.3 needs a connection/relationship schema** with edges that carry both `original_assessment` and `outcome`, plus `gatekeeper_user_id` for multi-gatekeeper scoping. Design this when speccing v0.3 connection lifecycle.
- **Identity docs and story writing** should reflect the bilateral framing: the sender is a person with their own needs, not just an item in the gatekeeper's inbox.
- **Gatekeeper onboarding identity doc** must include the feedback-closes-the-loop expectation. See Decision #5.
- **`feedback-guidance.md`** (internal-reference module, pre-Mark-onboarding) should spec the follow-up cadence and Evryn's judgment framework for checking on delivered items.
- **Code changes for v0.2:** `executeApproval()` needs try/catch + retry around `sendEmail()`, status update from `"done"` to `"delivered"`, lifecycle metadata appended on every status change. Stale item checker extended for `delivered` items >7 days → triggers Evryn via `runEvrynQuery()`.
- **Dedup instruction needed in triage.md:** Before classifying, Evryn checks if she's already sent a notification about this person to this gatekeeper. If so, evaluate whether the new email changes the picture — don't re-classify from scratch.
