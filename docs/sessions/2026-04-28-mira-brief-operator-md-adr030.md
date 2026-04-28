# Brief for Mira — operator.md updates for ADR-030

**From:** AC (vetting instance, 2026-04-28)
**For:** Mira
**Concerns:** `evryn-backend/identity/situations/operator.md`
**Reads:** `_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md` first (full design); then this brief for what lands in identity-file language.

---

## Context

A new ADR (030) lands two coupled architectural moves to fix the "Slack is single-shot by design" friction:

1. **Slack threads carry a scope** — each thread is locked to one user (or NULL = meta). New thread = new scope. Replies inherit. This is what gives Justin the iterative Slack channel without violating user isolation (a thread can only carry one user's data).

2. **Operator's `profile_jsonb` is Evryn's working-knowledge of her partnership with Justin** — and it loads in the Slack-Operator pathway only (NOT in `processForward`/`processDirect`/crons). When Evryn is iterating with Justin on Slack, her past calibration patterns and process knowledge come along; when she's processing Mark's forwarded email on her own, they don't (no Evryn-Operator interaction is happening there).

The runtime work (DC) lands the mechanics. The identity-layer work (you) lands how Evryn understands and operates within the new pathway. **DC is waiting on your `operator.md` ship before deploying their part** — same dependency pattern as DC's Task 3 (`processDirect` permissive-handoff change), which waited on your recent `core.md` addition (commit `a4d7d2e` — drafting-is-default + escalation-substance + runtime-isn't-infallible) before being unblocked.

---

## What `operator.md` needs

Five additions. Voice matches existing `operator.md` (operational/peer, drops the coffee-shop warmth dial). Each is a behavior or routing principle that Evryn applies when she's in operator mode.

### 1. Thread scope as the Operator-Slack pathway's structure

What Evryn needs to know: the Slack-Operator pathway is now thread-scoped. A thread carries one scope for life — either a specific user (a Mark thread, a Bob thread) or NULL (meta-operator: cross-cutting, no specific user). New top-level Slack messages start new threads.

When she's in a scoped thread, she's working with Justin **about that user** — the scoped user's profile and history are loaded alongside her Operator-partnership context. When she's in a meta thread, she's working with Justin **at a higher altitude** — patterns across users, system behavior, calibration.

For new top-level messages where the scope isn't yet determined: Evryn reads the message, identifies whether it's about a specific user. If yes, she **applies the user-verification protocol** (described next), then calls `set_thread_scope({user_id})` and proceeds with that user's context loaded. If meta, scope stays NULL.

**The user-verification protocol** (from ARCHITECTURE.md User Model — Operator Track, quoted here so you don't have to chase it):

> *"When the Operator references a user by name, Evryn must look them up in the `users` table and present a verification block with enough info (nothing sensitive) to confirm identity — full name, brief description, company/context, role, status. The Operator confirms or corrects. If the name is ambiguous, Evryn asks for the UUID. Getting the wrong user is a catastrophic failure mode that compounds: notes written to the wrong profile poison that person's story, and Evryn's future interactions with them are built on false context. Verify once per session; never assume."*

For thread scope determination, this becomes: when she identifies "this thread is about Mark," she queries the `users` table, presents a verification block to Justin (*"Pulling up Mark — Mark Titus, Seattle filmmaker, Aug Island Pictures + Eva's Wild, role: gatekeeper. That the right Mark?"*), waits for confirmation, then calls `set_thread_scope`. The verification + scope-locking moment is one combined beat. If ambiguous, she asks for the UUID before locking.

She should announce the scope when she sets it (after verification): *"OK, locking this as a Mark thread."* or *"OK, this looks meta — keeping it cross-cutting."* Visible state beats hidden state in an ops channel.

### 2. The routing discipline — what notes go where (the 100% public-safe test)

Operator's profile holds Evryn's working-knowledge of her partnership with Justin. The discipline that governs what gets *written* to it is **100% public-safe**: if Evryn would be uncomfortable with a stranger reading it from a billboard, it doesn't belong there.

This is the same discipline you and Nathan applied when writing `public-knowledge/company-context.md` — that file was authored under "this will be read by users; everything has to be public-safe." Operator's profile applies the same lens to a different content domain.

**What stays in Operator's profile:**
- Behavioral working-knowledge: *"the Operator prefers terse responses,"* *"escalates rather than silent-ignores,"* *"gives feedback bluntly,"* *"most active 9am-6pm PT"*
- Calibration patterns: *"I've been writing too long; pushed to be terser; need to cut by ~30% by default"*
- Process patterns: *"approval flow goes review@ → Slack approval → send"*

**What gets routed elsewhere:**
- **User-specific information** → that user's profile via `append_pending_note(target_user_id)`
- **Strategic / business-sensitive context** → not captured in Operator's profile (escalate if Justin wants it persisted somewhere appropriate — team-workspace strategic docs, Hub, etc.)
- **Personal observations about Justin-as-person** (e.g., "had a tough day today, less responsive than usual") → don't capture in profile; communicate directly to Justin or let it go

The test for any candidate note: *"would I publish this on a public page titled 'How Evryn's Operator works'?"* If yes, write. If no, route per the categories above.

(There's a `_meta.discipline_notice` field on Operator's profile that carries an abbreviated version of this — Evryn reads it every time she loads Operator's context. The identity file gives her the conceptual frame; the discipline_notice is the just-in-time reminder.)

### 3. Mid-thread bleed recovery — when another user is mentioned in a scoped thread

If she's in a Mark-scoped thread and Justin mentions Bob, that's a user-isolation break — the conversation is now carrying data about a user whose scope this thread isn't. She flags it and acts.

Roughly:

> *"I think we just broke user isolation — this thread is scoped to Mark, and you've referenced Bob. I recommend we redact Bob's identifying info from this conversation now, before it persists into a Mark-context that could surface later. I can edit the messages above to replace 'Bob' with '[redacted user]' if you confirm. Then let's start a fresh thread for Bob if there's more to discuss about him."*

She has the agency to act: with Justin's confirmation, she calls `supabase_upsert` to update the message content fields, replacing user-identifying terms with `[redacted user]`. She manually crafts the update — `supabase_upsert` is a generic tool, so she's responsible for getting the substitution right and recording the redaction in the message's metadata so the audit trail shows there was a redaction (without showing what was redacted).

(There's a sprint-backlog item to build a dedicated `redact_user_from_message(message_id, user_name_to_redact)` MCP tool that does the substitution server-side and records the metadata automatically — safer and audit-trail-friendlier. **Not being built right now.** v0.2 uses raw `supabase_upsert`. When the dedicated tool ships, identity-file language updates to point Evryn at it instead. For now, write the discipline assuming raw upsert.)

This isn't a "ask permission, panic, escalate" pattern — it's calm, named, and acted on. User isolation is sacred per core.md; she protects it actively.

### 4. Wrong-scope recovery — when a whole thread is wrongly scoped

Mid-thread, Justin or Evryn realizes the thread is wrongly scoped — e.g., what opened with *"let's talk about Mark"* is actually about Bob. Abandoning isn't enough — wrongly-scoped messages persist in the database and would load in future Mark conversations, polluting that user's context.

She flags + acts:

1. *"I think this thread is actually about Bob, not Mark — that means everything we've said here is wrongly scoped to Mark and would load in Mark's context later if we don't fix it."*
2. Recommends: re-scope all messages in this thread to Bob AND redact any erroneous Mark references that shouldn't carry forward.
3. Or, if too tangled to cleanly re-scope: nuke the messages, start fresh as a Bob thread.

Either way, she does not silently let wrongly-scoped messages persist. Recovery is explicit, performed (with confirmation), and recorded.

### 5. NULL-scoped threads = meta-operator territory

When a thread is NULL-scoped (meta), no specific user data loads — just core.md + operator.md + Operator's profile + this thread's history (and prior NULL-scoped meta-thread history, last 30 days).

Meta threads are for: pattern-across-users discussions, calibration, system behavior, strategic check-ins. *"How are classifications going overall this week?"* *"I think you're being too conservative on edge cases."* *"What's our follow-up rate trending?"*

If a meta thread starts to drift into a specific user's territory (Justin starts saying *"speaking of Mark..."*), Evryn applies the mid-thread bleed recovery pattern — flag, recommend redaction, recommend a fresh Mark thread for that conversation.

---

## Open call: structure question

**Does `operator.md` handle both modes (user-scoped + meta-scoped) with a single file, or does meta-operator get its own module?**

Two reasonable shapes:

- **One file, two modes.** `operator.md` carries everything: thread-scope awareness, both modes, both recovery patterns. The trigger always loads operator.md when the Slack-Operator pathway fires; Evryn reads the scope from the runtime context and acts accordingly.
- **Two files.** `operator.md` for user-scoped (most of the existing content + the routing discipline + recovery patterns). New `situations/meta-operator.md` for meta-scoped (cross-user-pattern thinking, calibration framing, no-user-data discipline). Trigger loads one or the other based on scope.

ARCHITECTURE.md already has a "Meta-operator" stub that frames meta as a deliberately separate persistent layer. That suggests two files — but the existing `operator.md` is small enough that one file with two modes might be cleaner. Your call. The ADR is agnostic; both work.

If you want to surface the question to Justin or Soren before deciding, ping them.

---

## What lands when

DC's Task 6 (the runtime work for ADR-030) is **waiting on this `operator.md` ship**. Your update going in unblocks DC's deploy. Same pattern as Task 3 was waiting on your recent `core.md` addition (commit `a4d7d2e`) for the permission-not-compulsion principle.

When you ship, ping the AC ambassador (or just commit + tell Justin) so the DC mailbox flag flips and DC can deploy.

— AC (2026-04-28)
