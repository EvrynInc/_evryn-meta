# ADR-035: Approval Mechanism Redesign — Short-ID + Strict-Match + Dual-Route + Deterministic Confirmation

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

**Status:** Accepted
**Date:** 2026-05-29
**Authors:** AC0 (architecture), DC1 (implementation)
**Related:** [ADR-030 — Slack Threads as Operator Scope](030-slack-threads-as-operator-scope.md), [ADR-033 — Permission-Compulsion Spectrum](033-permission-compulsion-spectrum.md)

---

## Context

The pre-Wave-3 approval mechanism worked like this:

- Evryn drafts a notification or reply.
- `submitDraftForApproval` sends a review-format copy to `review@evryn.ai` (Justin's review inbox alias) and posts a Slack ping in `#evryn-approvals` naming the subject.
- Justin types `approve [Evryn] Gold | Sender Name | Topic` (or similar variants) into `#evryn-approvals`.
- A regex-based parser in `handleOperatorMessage` matches the message against pending drafts by subject.
- On match: `executeApproval` fires, email goes to the recipient (Bcc review@), item status → `delivered`.
- On near-match: an `approval_hint` path returns a "did you mean..." prompt listing pending subjects.

Three coupled problems surfaced during the 2026-05-28 → 2026-05-29 integration test:

### Problem 1 — `approval_hint` silently consumes conversational messages

The `approval_hint` path matched on the *word* "approve" appearing anywhere in the message. If the message didn't strict-match a pending subject, the parser returned the hint prompt and **never invoked `handleOperatorMessage`**. The message never reached Evryn.

**2026-05-29 evening: Justin sent Evryn a substantive Slack question** that contained the word "approve" inside a sentence: *"if I send an 'approve' on that, will it hit both of them, or is only one of them marked pending?"* The parser caught it, returned a hint prompt, and ate the message. Evryn never saw the question. **8 minutes of unexplained silence.**

The pattern: any parser that pattern-matches on keywords without strict-matching needs to err toward "let the conversational handler see this" not "I'll handle it." The pre-Wave-3 parser silently DIVERTED traffic from the conversational path, with no signal to the operator that diversion had occurred.

### Problem 2 — Subject-match collision when multiple drafts share a subject

The pre-Wave-3 parser matched by subject string. **Multiple pending drafts could share the same subject** (e.g., today's test produced two pending drafts both titled `[Evryn] Reply | Mark Titus | Re: Justin sent me your way` because Evryn re-drafted after Justin's standing-instruction). On approval, the parser's first match would fire — coin-flip on which item was sent.

Mark scale (~6 gold/month) makes the collision rare but non-zero. **Coin-flip approvals at any rate are not acceptable in a Mark-live system.**

### Problem 3 — No deterministic confirmation that the send actually happened

After `executeApproval` fired, the runtime had no consistent signal that the send completed. Justin had to either check the recipient's view (impossible for real Mark), wait for a Slack confirmation if one was wired, or query the database manually. **Silent success is almost as bad as silent failure when the operator needs to trust the system.**

### Problem 4 — Operator approves blind

The `review@evryn.ai` email showed the draft body but not the conversation it was responding to. During testing Justin knew what Mark said because he wrote it 5 minutes earlier; with real Mark in the loop, Justin would be approving without seeing what triggered the draft. Real Mark-live blocker.

---

## Decision

Redesign the approval mechanism around four coupled changes. All four ship together (DC1's Wave 3, commit `05bd1ff`).

### 1. Short-ID handle replaces subject-match

Every `emailmgr_item` gets a **short-id** stored in `DraftMetadata.short_id` — the first 4 hex characters of the item UUID (e.g., `fb93`). Collision odds at v0.2 gatekeeper scale are negligible (~1 in 65,536 across simultaneously-pending items; max 2-3 pending at any moment).

The short-id is **the operator-facing identifier** throughout the approval flow:
- Slack ping names the short-id
- review@evryn.ai email ends with the literal copy-paste string
- Justin types `approve <id4>` to approve
- Justin types `notes <id4>: <notes>` to request revisions

### 2. Strict parser — no fuzzy match, no `approval_hint` diversion

The parser strict-matches **exactly two patterns**:
- `approve <id4>` (matches `/^approve\s+([a-f0-9]{4})\s*$/i` or equivalent)
- `notes <id4>: <body>` (matches `/^notes\s+([a-f0-9]{4})\s*:\s*(.+)$/i`)

Anything else routes to `handleOperatorMessage` as a normal conversational message. **The `approval_hint` path is removed entirely.** No fuzzy capture, no diversion. The pre-Wave-3 `handleApprovalHint` and `findItemsByStatus` import are removed as dead code (DC1's Wave 3 reply confirms).

### 3. Dual-route on strict-approve match

When `approve <id4>` strict-matches:
- `executeApproval` fires (sends the email, updates lifecycle, etc.)
- The inbound message **also routes to `handleOperatorMessage`** so Evryn sees what happened

This closes the silent-diversion failure mode at a deeper level: even when the parser DOES match (legitimate approval), the conversational handler still sees the message. Evryn maintains awareness of approval actions; future cron-Evryn instances reading messages history see the approval as part of the audit stream.

### 4. Deterministic Evryn-voice confirmation

After `executeApproval` succeeds, the runtime posts a confirmation message in the user-scoped Slack thread:

- Posted via `slackApp.client.chat.postMessage` with `thread_ts` so it lands in the right thread
- Posted as the Evryn bot (deterministic message, NOT LLM-generated — runtime emits the exact string)
- Records a `messages` row scoped to `item.user_id` with `metadata.origin = "approval_confirmation"`

Message: *"Confirmed — sent to {Name}."*

The deterministic shape matters: an LLM-generated confirmation would consume tokens and could fail or vary. A runtime-emitted string is reliable and zero-cost. The `messages` row preserves the audit trail in Evryn's stream so future Evryn-instances can see "approval fired on X date."

Note: The deterministic confirmation uses `chat.postMessage` directly, NOT `notifySlack`. It is therefore **not gated by quiet hours** — this is intentional. Confirmation of an action the operator JUST initiated should not be queued.

### Companion: thread-history-in-drafts

The `review@evryn.ai` email composition (via `submitDraftForApproval`) now prepends a **RECENT CONVERSATION section** showing the inbound being replied to + recent volleys formatted as a quoted-reply chain. Operator can evaluate the draft against what triggered it.

The same `loadConversationContextBlock` helper prepends thread context to the recipient's email body (so the recipient sees a proper threaded reply on their side) and is included as its own section in the review@ pre-send email.

### Deferred (stretch goal)

**Slack interactive buttons via Socket Mode** — Block Kit message construction with Approve / Reject / Notes buttons, `action_id` handlers, modal/text-input for notes. Eliminates regex entirely. DC1's call per the brief's DC1-call clause: estimated ~3-4 hours vs ~1 hour for short-id; deferred to a follow-up trip if Justin wants it after seeing the short-id route in action. Not a Mark-live blocker.

---

## Consequences

### Approval format changes (operator-facing)

Old `approve [Evryn] Gold | Sender Name | Topic` is **no longer recognized.** New format: `approve <id4>`. Justin's `operator-guide.md` updated to reflect the change. The review@ email tells Justin the exact text to type.

### `approval_hint` silent-diversion failure mode closed

Conversational messages containing "approve" now route to Evryn normally. No more 8-minute unexplained silences.

### Subject collision risk eliminated

Short-id is unambiguous within practical scale; multiple drafts with the same subject can coexist without coin-flip approval.

### Operator-approves-blind risk closed

Thread-history-in-drafts gives Justin the context to evaluate drafts against the conversation that triggered them. Real Mark-live works.

### Deterministic audit trail for sends

Every approved send produces a runtime-emitted Evryn-voice confirmation in the user-scoped Slack thread + a `messages` row scoped to the user. Future Evryn-instances reading messages history see the approval action; Justin sees the confirmation immediately.

### Backwards-compat note

DC1 left `findPendingByApprovalSubject` in place for backward compat with `tests/test-approval-flow.ts`; the new `findPendingByShortId` is the primary handle. A future small refactor trip can update the test and remove the legacy function + `asciiSafe` helper.

### `chat.postMessage` direct path bypasses quiet hours

The deterministic Evryn-voice confirmation uses `chat.postMessage` directly (not `notifySlack`), which means it's not subject to quiet-hours gating. This is intentional — confirming an action the operator just initiated. The same pattern applies to Evryn's conversational responses in operator threads (also use `chat.postMessage` direct). The `notifySlack` quiet-hours gating only covers approval pings, stale-item reminders, and tool-driven `notify_slack` calls.

---

## Empirical case

Surfacing material that drove the decision, for future readers:

- **The 8-minute silence incident.** Justin's question containing "approve" was sent at ~20:50 PT 2026-05-29; Evryn produced no response. Investigation traced the message to the `approval_hint` path. Captured in `_evryn-meta/CHANGELOG.md` 2026-05-29 evening entry + the session doc DC list item #8.
- **The dual-Reply-draft state.** When Justin issued a standing-instruction mid-test, Evryn re-drafted; two `[Evryn] Reply | Mark Titus | Re: Justin sent me your way` items coexisted as `pending_approval` simultaneously. Subject-collision risk was no longer theoretical.
- **Session doc DC list item #8** carries the full spec written 2026-05-29 evening before DC1's ship: `_evryn-meta/docs/sessions/2026-05-28-integration-test.md`.

---

## Implementation

DC1's Wave 3 ship, commit `05bd1ff`, Railway deploy `4e79b834` (2026-05-29T17:22 PT). Reply in `evryn-backend/docs/dc-to-ac.md` confirms all four changes shipped per spec + thread-history-in-drafts companion + dual-route + deterministic confirmation + deferred buttons stretch. Tests rewritten: 16 assertions in `test-prompt-composition.ts` (per DC1's reply; commit message said 15 — assertion-count mismatch flagged for DC3 to reconcile).

DC3 independent review trip dispatched 2026-05-29 evening to verify implementation against spec, including strict-approve parser whitespace/case behavior, dual-route invocation, and deterministic-confirmation `messages` row scope.

---

## Future considerations

- **Approval throttling.** If a future incident produces a flood of pending drafts, the operator might want bulk-approve or bulk-reject affordances. Not Mark-live blocking; future trip.
- **Short-id collision at scale.** At v0.3+ multi-user, 4 hex chars = 65,536 possible values. With ~100 simultaneously-pending items (high estimate), collision odds are ~0.08%. Increase to 6 hex chars when collision rate becomes empirically observable.
- **Interactive buttons.** Deferred this trip. Worth revisiting once Mark is live and the operator-burden of typing `approve <id4>` becomes data we can evaluate.
- **`notes <id4>: <body>` parser tightness.** Currently the parser strict-matches `notes` + id + colon. Should it also accept other revision-intent forms (e.g., `revise fb93`, `redo fb93`)? Out of scope this trip; consider if operator typo patterns emerge.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
