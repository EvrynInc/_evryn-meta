# ADR-031: Late-Scope Recovery — Third Recovery Pattern Under ADR-030

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**Status:** Proposed — pending Justin approval and DC implementation.
**Date:** 2026-04-29
**Deciders:** Justin, AC, DC (surfaced)
**Extends:** [ADR-030](030-slack-threads-as-operator-scope.md) — adds a third named recovery pattern alongside mid-thread bleed and wrong-scope recovery.

---

## Context

ADR-030 names two recovery patterns for the Slack-Operator pathway:

1. **Mid-thread bleed** — a scoped thread mentions another user. Evryn flags + recommends redaction in-thread.
2. **Wrong-scope recovery** — the whole thread is wrongly scoped (e.g., opened "let's talk about Mark" but turned out to be about Bob). Evryn flags + recommends re-scope or nuke.

The 2026-04-29 v0.2 deploy smoke-test surfaced a third pattern that ADR-030 didn't anticipate: **late-scope recovery** — *"this conversation drifted from meta to user-substantive across multiple turns or threads, and I should have locked scope earlier."*

**Empirical example.** During smoke-test, Mark-substantive content (Evryn's gatekeeper-fit assessment) landed in thread `1777492994.283769` NULL-scoped because Evryn didn't lock scope until a later thread (`1777493029.312859`). The substantive content was still about Mark, but it sat orphaned — wouldn't load when Mark's profile was queried, and wouldn't surface during `getRecentMetaMessages` for a meta thread either (since the original thread was the wrong place for it). DC and Evryn recovered the orphaned content via raw `supabase_upsert` with one-shot operator coaching, but the move was ad-hoc; no first-class primitive supports the pattern.

**Why ADR-030 missed it.** The within-thread case is already covered: when `set_thread_scope` fires at turn N, `handleGeneralMessage` backfills messages 1..N-1 of the same `thread_id` (because the thread was the same scope all along — Evryn just locked late). What ADR-030 didn't consider is **cross-thread** late scoping — Mark-substantive content in a *different* `thread_id` that, in retrospect, also belongs to Mark's scope. Today's `set_thread_scope` only affects the current thread; it has no way to reach back into prior threads.

This isn't a hypothetical edge case. It surfaced on the first day of real testing. As Evryn's operator-pathway tempo increases (post-Mark-live, ~200 emails/day with operator-driven mid-day calibration), the pattern of "I was treating this as meta but it became user-substantive somewhere along the way" will recur.

## Decision

Add **late-scope recovery** as the third named recovery pattern under ADR-030, with both runtime tooling and identity-layer support.

### Identity layer

Mira pass on `evryn-backend/identity/situations/operator.md` to:

1. Add late-scope recovery alongside mid-thread bleed and wrong-scope recovery in the Recovery Patterns section.
2. Reframe scope determination as **ongoing**, not a one-shot at thread start. The current operator.md frames it as "when the Operator opens a new top-level thread, read the message and identify whether it's about a specific user." The empirical failure mode is mid-thread drift — Evryn correctly judges a thread as meta on turn 1, then fails to re-evaluate as the conversation drifts toward user-substantive territory. The identity-layer fix is a re-evaluation beat: *"Scope isn't a one-shot decision at thread start. If a meta thread drifts toward user-substantive content (research about a specific user, direct assessment of a user's fit, captures that should land on a profile), pause and re-evaluate — that's the moment to lock scope, not the next time you happen to think about it."*
3. Pair the late-scope recovery pattern with the re-evaluation beat — when she catches the drift late, she has both the conceptual frame ("I should re-evaluate scope") and the recovery procedure (flag + recommend specific message IDs / thread IDs to rescope, operator confirms, perform with audit trail).

The Mira brief is at `_evryn-meta/docs/sessions/2026-04-29-mira-brief-operator-md-late-scope.md`.

### Runtime tooling

DC adds a primitive that supports cross-thread rescoping with audit-trail discipline. Two options sketched:

**Option A — dedicated `rescope_messages` MCP tool.**
```
rescope_messages({
  message_ids: string[],
  scope_user_id: string,
}) -> { rescoped_count: number, audit_metadata: ... }
```
- Updates `messages.scope_user_id` for the given message IDs.
- Records audit metadata on each row: `metadata.rescoped_from: null` (or the prior scope, if any), `metadata.rescoped_at: <ts>`, `metadata.rescoped_by: <operator_user_id>`.
- Pairs naturally with the planned `redact_user_from_message` tool (also in ADR-030 Open considerations) — both are message-level surgical operations with audit metadata.

**Option B — extend `set_thread_scope` with `also_rescope_thread_ids: string[]`.**
- Less invasive but conflates "lock scope on this thread" with "rescope older threads."
- Doesn't compose as cleanly with redact-style operations.

**Recommended:** Option A. Build judgment defers to DC, but the dedicated tool reads cleaner architecturally and the redact-tool composition is real.

### Operator-confirmation discipline

Same discipline as wrong-scope recovery (ADR-030):

1. Evryn flags: *"There are messages in thread X that look Mark-substantive but are still NULL-scoped — they should rescope to Mark."*
2. Evryn recommends specific message IDs / thread IDs (not "all NULL-scoped messages mentioning Mark," which would be over-eager).
3. Operator confirms (or corrects).
4. Evryn performs the rescope via the new tool, with audit metadata captured automatically.

Not unilateral. Same shape as the existing recovery patterns.

## Consequences

**Positive:**
- Closes the cross-thread gap in ADR-030's recovery design.
- Audit trail (`metadata.rescoped_from`, `metadata.rescoped_at`) makes after-the-fact review possible.
- Pairs the identity-layer re-evaluation beat with the tool primitive — the failure mode and the recovery move evolved together in the same session, so addressing them together is cleaner than treating them separately.
- Reduces the risk of orphaned user-substantive content quietly polluting future context queries (or being invisible to `getRecentMetaMessages` cross-thread continuity).
- The `rescope_messages` primitive composes with the planned `redact_user_from_message` tool — both are message-level surgical operations.

**Negative / risks:**
- Adds another tool to Evryn's surface area. Mitigated by the strong analogy to existing recovery patterns; she already has the conceptual frame.
- Operator-confirmation friction on every late-scope recovery. Accepted — same friction as wrong-scope recovery in ADR-030.
- Discipline dependency: Evryn must recognize *when* she should have locked earlier. The identity-layer re-evaluation beat is what makes this discoverable; without it, the tool sits unused.
- The tool's blast radius is per-message-ID, but if Evryn passes the wrong IDs the audit trail captures it — recoverable, not catastrophic.

**Operational:**
- Mira pass on `evryn-backend/identity/situations/operator.md` (brief queued at `_evryn-meta/docs/sessions/2026-04-29-mira-brief-operator-md-late-scope.md`).
- DC implementation of `rescope_messages` MCP tool with audit metadata. Sprint backlog has the entry.
- After tooling lands: ADR-030 doesn't get amended (frozen at decision time); this ADR carries the extension.

## Related

- [ADR-030](030-slack-threads-as-operator-scope.md) — the original Slack-Operator pathway design with the two original recovery patterns. This ADR extends that one without superseding it.
- ADR-030 Open considerations: `redact_user_from_message` MCP tool. The `rescope_messages` tool here composes with that one — both message-level surgical operations.
- `evryn-backend/docs/SPRINT-MARK-LIVE.md` Backlog: late-scope recovery entry (the empirical motivating example, with thread IDs `1777492994.283769` and `1777493029.312859`).
- `evryn-backend/docs/dc-architecture-notes-for-ac.md` 2026-04-29 finding 1.
- `_evryn-meta/LEARNINGS.md` item 57 (Library defaults don't enforce architectural invariants — the `say()` threading-orphan story that initially obscured this finding during diagnosis).

## Open considerations

- **Tool design — dedicated vs. extension.** Recommended above is Option A (`rescope_messages`). Final call rests with DC + Justin during implementation.
- **Triggers for re-evaluation.** Beyond the identity-layer beat, are there code-level triggers worth wiring? E.g., when `append_pending_note(target_user_id)` fires within a NULL-scoped thread, is that a signal to flag the scope mismatch automatically? Worth thinking about as v0.3 multi-party flows land.
- **Bulk recovery.** What happens if Evryn realizes mid-day that a *week* of meta-thread content has been about Mark? The pattern still works (same operator-confirmation discipline, just more message IDs), but the workflow may want batching primitives. Defer until volume justifies.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
