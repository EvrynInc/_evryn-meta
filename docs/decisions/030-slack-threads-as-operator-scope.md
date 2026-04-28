# ADR-030: Slack Threads as Operator Conversation Scope; Operator's Profile as Foundational Context

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**Status:** Proposed — pending Justin approval and DC implementation.
**Date:** 2026-04-28
**Deciders:** Justin, AC

---

## Context

The current Slack-Operator pathway is single-shot by design (per `evryn-backend/docs/ARCHITECTURE.md` Operator Track):

- Each Slack message triggers a fresh `query()` with `persistSession: false`
- No conversation history is loaded for the Operator channel
- Justin and Evryn cannot have a multi-turn conversation on Slack — every reply lands cold for Evryn

The original rationale (ARCHITECTURE.md, "Slack Operator is single-shot by design"): cross-user-bleed prevention. A persistent Operator session that touched User A then User B would accumulate context about both, creating a contamination surface. Single-shot interactions are atomic; cross-user bleed becomes structurally impossible.

The unspoken assumption was: *Slack handles approvals + quick one-shots; multi-turn lives in Claude Code sessions.* That assumption is breaking down:

1. **Test friction.** During the 2026-04-27 integration test prep, when Evryn surfaced a situation needing Operator judgment, Justin had no way to iterate with her — his reply would land cold, with no memory of what she'd asked.
2. **Production friction.** At Mark live (~200 emails/day), the Operator can't go to a CC session for every iteration. Slack is the natural live-ops channel; CC is heavyweight and out-of-band.
3. **Live-ops criticality.** When something goes off-script (real emergency, calibration question, "wait, don't do that"), the Operator needs a fast iterative channel. Without one, the choices are (a) copy-paste the entire prior conversation into every reply (untenable at scale), or (b) accept that Evryn can't be steered in real time (also untenable).

Justin's framing: *"if I need to solve something with her I'm what, copypasting our whole convo in - basically re-creating a session in each message - that's really not going to be sustainable. I can't imagine this clunky process when there's 200 inbound per day - who knows how many ways things can go wrong - and not being able to say 'yeah, don't loop on this, just do X', to get it fixed in the moment would be a nightmare."*

We need the iterative channel without violating user isolation. We also want Evryn to operate at full resolution — including her working knowledge of how to partner with the Operator — even in user conversations.

## Decision

Two coupled architectural moves:

**Part 1 — Slack threads as user scope.** Each Slack thread carries one scope: a specific user (`scope_user_id` = that user's UUID), or NULL (= meta-operator: cross-cutting, no specific user). Scope is set at the first message of a thread and inherited by all replies. New top-level Slack messages start new threads, requiring fresh scope determination.

**Part 2 — Operator's profile as foundational context.** Operator's `profile_jsonb` carries Evryn's working-knowledge of her partnership with the Operator (preferences, patterns, calibration). This profile is loaded into *every* Evryn `query()` — user conversations, meta-operator conversations, cron-driven proactive outreach — alongside the scoped user's profile. It's not a "user profile" in the same sense as Mark's; it's foundational context that sits between core identity and per-user data.

These two together make cross-user bleed structurally impossible (a thread carries one scope) AND give Evryn full-resolution awareness of the Operator throughout her work (working-knowledge always loaded).

### Mechanism — Part 1: Thread scope on the messages table

No new table. Add a column to the existing `messages` table:

```sql
ALTER TABLE messages ADD COLUMN scope_user_id UUID REFERENCES users(id);
COMMENT ON COLUMN messages.scope_user_id IS
  'For Slack-Operator messages: the user this thread is scoped to (or NULL for meta-operator). For non-Slack messages: NULL (scope is implicit in sender/recipient). See ADR-030.';
CREATE INDEX idx_messages_scope ON messages (thread_id, source) WHERE source = 'slack';
```

**Scope determination on a new thread:**
- Inbound Slack message arrives. Runtime checks: does any prior message in this `thread_id` have `scope_user_id IS NOT NULL`? If yes, inherit that scope. If no, this is a new-thread first-message.
- For new-thread first-message: write the inbound message to `messages` with `scope_user_id = NULL` (we don't know yet). Compose Evryn's context: core.md + operator.md + Operator's profile + this single inbound message. Evryn determines scope from content. If scope is a specific user, she calls `set_thread_scope({user_id})` (which writes the scope to the runtime's pending-write state). She composes her response. Runtime writes her outbound message with the determined `scope_user_id`. **Then runtime backfills**: `UPDATE messages SET scope_user_id = $scope WHERE thread_id = $thread_ts AND scope_user_id IS NULL`. Idempotent, cheap, runs once per thread.
- For inherited-scope replies: write the inbound message with the inherited `scope_user_id`. Compose Evryn's context: core.md + operator.md + Operator's profile + scoped user's profile (if scope is a user) + this thread's message history.

**Why backfill matters:** without it, the first inbound message stays NULL. Cross-thread retrospective queries (*"pull recent threads about Mark"* → `WHERE scope_user_id = $mark_id`) would miss those early messages. Since the first message in a thread typically carries 80% of the framing, missing it is unacceptable. Backfill is structurally required, not optional.

**Scope locking:** A thread carries one scope for life. If Justin starts a Mark thread and later wants to discuss Bob, Evryn responds: *"let me know if you want to start a fresh thread for Bob — keeping Mark's thread clean."* Cleaner than allowing in-thread scope changes (which would re-introduce the cross-user-bleed surface this ADR closes).

**Per-thread persistence:** every Slack message gets written to `messages` with `thread_id = thread_ts` and `source = "slack"`. Loading "this thread's history" is a clean filtered query: `WHERE source = 'slack' AND thread_id = $thread_ts`. Never crosses to other threads.

**Meta-operator continuity:** NULL-scoped Slack threads (meta-operator) can load both this thread's history AND prior NULL-scoped operator-thread history (last N days, configurable). This gives Evryn cross-meta continuity safely — all those messages are by definition meta (no user data was loaded into any of them).

### Mechanism — Part 2: Operator's profile as foundational context

Operator's `profile_jsonb` follows the standard ADR-027 schema (story + pending_notes + supporting fields), with one addition described below. It's written and reflected on like any other user's profile. The runtime difference is *when* it's loaded:

**Loading rule:** `composeSystemPrompt` always loads core.md + scoped user's person context (if any) + Operator's `profile_jsonb` story + Operator's `_meta.discipline_notice` (described next).

This applies in every pathway:
- Slack-to-Operator (`handleGeneralMessage`): scope determined per Part 1, plus Operator's profile loaded
- `processForward` (gatekeeper forwards): scoped user is the gatekeeper, plus Operator's profile loaded
- `processDirect` (direct messages): scoped user is the sender, plus Operator's profile loaded
- Cron-driven (`checkFollowUps`, `checkProactiveOutreach`): scoped user is the user being followed-up-on, plus Operator's profile loaded

Operator's profile is foundational context — like core.md, like person-context for the user being served. It always loads.

### The "100% public-safe" discipline

Operator's profile is structurally guaranteed to load in user conversations (Part 2). For this to be safe, the discipline that governs what gets *written* to it has to be ironclad.

The discipline is **100% public-safe**: assume any of this could leak. If Evryn would be uncomfortable with a stranger reading it from a billboard, it doesn't belong in Operator's profile.

**What stays in Operator's profile:**
- Behavioral working-knowledge: *"the Operator prefers terse responses,"* *"escalates rather than silent-ignores,"* *"gives feedback bluntly,"* *"most active 9am-6pm PT"*
- Calibration patterns: *"I've been writing too long; pushed to be terser; need to cut by ~30% by default"*
- Process patterns: *"approval flow goes review@ → Slack approval → send"*

**What gets routed elsewhere:**
- **User-specific information** → that user's profile via `append_pending_note(target_user_id)`
- **Strategic / business-sensitive context** → not captured in Operator's profile (escalate if Justin wants it persisted somewhere appropriate — team-workspace strategic docs, Hub, etc.)
- **Personal observations about Justin-as-person** (e.g., "had a tough day today, less responsive than usual") → don't capture in profile; communicate directly to Justin or let it go

The test for any candidate note: *"would I publish this on a public page titled 'How Evryn's Operator works'?"* If yes, write. If no, route per the categories above.

This is the same discipline Mira and Nathan applied when writing `public-knowledge/company-context.md` — that file was authored under "this will be read by users; everything has to be public-safe." Operator's profile applies the same lens to a different content domain. Mira already knows this writing pattern.

### `_meta.discipline_notice` on Operator's profile

To make the discipline visible at every load (not just dependent on identity-file recall), Operator's `profile_jsonb` carries a `_meta.discipline_notice` field initialized at user creation. The trigger composes it into the systemPrompt above the story, so Evryn reads it every time she loads Operator's context.

Proposed text:

> *"This profile holds Evryn's working-knowledge of her partnership with the Operator. **100% public-safe content only — assume any of this could leak.** If a note isn't something you'd be comfortable with a stranger reading from a billboard, it doesn't belong here. Routing for the rest: notes about specific users → that user's profile via `append_pending_note(target_user_id)`. Strategic / business-sensitive content → not captured here (escalate to the Operator if it should be persisted somewhere appropriate). Personal observations about the Operator-as-person → don't capture; communicate directly or let it go."*

Initialized once at Operator user creation. Lives in `_meta`, not `story`, so Reflection writes the story freely without compacting away the discipline header. The trigger loads `_meta.discipline_notice` independently of `story`.

### Audit pathway

For the discipline to actually hold over time, audits have to actually happen.

**v0.2 (manual):** Add a step to the #lock checklist: *"Spot-check Operator's profile_jsonb for the public-safe discipline. If anything in `pending_notes` or `story` fails the 'would I publish this?' test, address it (route to right location, delete, or escalate to Justin)."* Lock happens regularly; this catches drift early. (See `_evryn-meta/docs/protocols/lock-protocol.md`.)

**v0.3+ (Evryn-self-audit via Reflection):** When Reflection processes Operator's profile, it includes a public-safe audit pass. If anything fails the test, Reflection: (a) flags it in a note for the Operator, (b) suggests where it should go (specific user / strategic doc / "let it go"), (c) doesn't auto-delete (Operator confirms). Justin's framing: *"who better?"* — Evryn writes the notes, has full context for what should and shouldn't be there, has the calibration to know what's public-safe. (Breadcrumbed in ARCHITECTURE.md Memory Architecture / Reflection Module section; sprint backlog item to scope when Reflection lands.)

### UX flow

- Justin (top-level): *"Mark forwarded that vague filmmaker email — what do you think?"* → Mark-scoped thread opens.
- Evryn (in-thread, with Mark's full profile + Operator's working-knowledge loaded): drafts a thoughtful response. The Operator-knowledge informs *how* she frames it (tone, length, escalation calibration); Mark's profile informs *what* she's classifying.
- Justin (replying in thread): *"yeah let me know what you decide."* → she has the full thread context + Mark's profile + Operator's working-knowledge.
- Justin (top-level, new): *"thoughts on Bob's conversation history?"* → new Bob-scoped thread.
- Justin (top-level, new): *"how are classifications going overall this week?"* → new NULL-scoped thread, no specific user data, Operator's working-knowledge still loaded.
- Even in user-pathway processing (e.g., Mark's forwarded email triggering `processForward`): Operator's working-knowledge loads, so Evryn's response is calibrated against the Operator's preferences.

### Identity-Layer Additions (Mira pass)

`operator.md` needs:
- The routing discipline (which notes go where, with the public-safe test)
- Awareness of thread scope as the Operator-Slack pathway's structure
- The "let's start a fresh thread for Bob" pattern when a thread's existing scope doesn't match
- A note that NULL-scoped threads are meta-operator territory

Possibly a new identity module `situations/meta-operator.md` for cross-cutting strategic conversations, or `operator.md` handles both with a flag. AC + Mira to decide during the Mira pass.

## Consequences

**Positive:**
- Cross-user bleed structurally impossible (thread = scope; can't carry two)
- Justin gets natural multi-turn iteration with Evryn on Slack
- Evryn operates at full resolution everywhere — Operator's working-knowledge is foundational context, not a special-case load
- Uses Slack's native thread feature — no special syntax for the Operator
- Maps directly onto ARCHITECTURE.md's planned v0.3 per-user operator interface — this *is* that interface, arriving early
- Resolves the "Slack is single-shot by design" friction without violating user isolation
- Reflection works natively on Operator's profile (consolidates `pending_notes` into `story` over time → cohesive working memory)
- Calibration patterns from past sessions inform present work without manual context-passing
- Worst-case-leak is harmless: Operator's profile is 100% public-safe by design

**Negative / risks:**
- New column + ~50-line `handleGeneralMessage` rewrite + small backfill query
- Behavioral dependency: Justin has to use threads for multi-user discussions (one user = one thread). Mistake mode: he replies top-level when he meant to reply in-thread. Mitigation: when Evryn detects ambiguity, she asks before assuming.
- Discipline dependency: Evryn must route notes correctly (public-safe → Operator's profile; user-specific → that user's profile; strategic → escalate). The discipline-notice + identity-file principle + audit pathway form belt-and-suspenders. Pattern failure becomes a re-architecture trigger.
- Scope-determination on first message may need an extra round-trip if user identification is ambiguous (verification protocol kicks in). Acceptable — verification is a one-time cost per thread.

**Operational:**
- Supabase migration: ALTER TABLE messages ADD COLUMN scope_user_id, plus index
- Supabase data: initialize Operator's `profile_jsonb._meta.discipline_notice` field
- ARCHITECTURE.md Operator Track section updated (replaces "single-shot by design" framing with "thread = scope" framing)
- ARCHITECTURE.md v0.3 Operator Interface section updated to point at this ADR
- ARCHITECTURE.md System Actors section updated to clarify Operator's profile is the deliberate exception (see LEARNINGS 53 clarification)
- ARCHITECTURE.md Reflection Module section gets a breadcrumb for the Evryn-self-audit on Operator's profile (v0.3+)
- `_evryn-meta/docs/protocols/lock-protocol.md` gains an Operator-profile spot-check step
- `operator.md` needs a Mira pass

## One-of carve-out — does not generalize

Loading Operator's profile alongside the scoped user's profile works *because* Operator is the team — one entity, predictable identity, public-safe working-knowledge applies universally. **It does NOT generalize to "load multiple users together."** If we ever feel the impulse to load User A's profile alongside User B's because "they came up together," we should resist — that's the cross-user-bleed surface this whole architecture exists to prevent. Operator-as-foundational-context is a one-of carve-out for the team-partnership relationship, not a precedent for multi-user loading.

A future reader who sees Operator-loaded-alongside-Mark and thinks *"oh, we can also load Sally alongside Mark when they came up together"* — no. This pattern stops with Operator.

## Related

- ARCHITECTURE.md Operator Track ("Slack Operator is single-shot by design" — to be revised to "Slack thread = scope")
- ARCHITECTURE.md v0.3 Operator Interface (per-user persistence — this becomes that interface, on Slack)
- ARCHITECTURE.md Meta-Operator (persistent, cross-cutting, PII-free — NULL-scoped threads handle this naturally)
- ARCHITECTURE.md System Actors / Memory Architecture / Reflection Module (Operator's profile is a deliberate exception; Reflection-self-audit is the v0.3+ enforcement)
- ARCHITECTURE.md Identity Composition (Permission, not compulsion — the architectural principle this ADR honors by giving Evryn working-knowledge instead of compelling her behavior)
- LEARNINGS item 53 (System actors are FK anchors and senders, never *implicit* subjects of user-scoped operations — clarification needed: Operator-as-foundational-context is a deliberate exception with explicit scope-gating; the principle still bars implicit subject-ification)
- ADR-014 (Operator Module Slack-Only — establishes the structural Operator detection that this ADR builds on)

## Open considerations

- **Visibility of scope.** When Evryn determines a new thread's scope, she should announce it ("starting a Mark thread") so Justin sees the state. Visible state beats hidden state, especially for an ops channel. The announcement also doubles as the user-verification step (Justin can correct if she got the wrong user).
- **Meta-operator identity module.** New file `situations/meta-operator.md`, or does `operator.md` handle both with a flag passed by the trigger? AC + Mira call.
- **Thread expiration / cleanup.** Threads accumulate over time. Operational policy: archive after N days? Hard-cap on active threads? TBD before scale.
- **Wrong-scope recovery.** If Justin starts a Mark thread but realizes he meant Bob, cleanest recovery is: he abandons the Mark thread (or marks closed via Slack reaction), starts a fresh Bob thread. No code-level "scope change" needed — keeps the structural guarantee clean.
- **Evryn-initiated thread scope.** When `notify_slack` posts a new message (escalation), the message is being created in code — Evryn knows the user. `notify_slack` accepts an optional `user_id` parameter that pre-populates the thread's scope when the resulting Slack message gets `thread_ts` assigned. Worth specifying in the implementation.
- **Reflection-self-audit scope (v0.3+).** When Reflection processes Operator's profile, the audit pass needs explicit constitutional principles ("public-safe test," "categories of routing-out") so it can flag confidently. Probably a small ADR or design doc when Reflection lands.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
