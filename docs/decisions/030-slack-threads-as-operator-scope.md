# ADR-030: Slack Threads as Operator Conversation Scope; Operator's Profile as Working-Knowledge in Operator Pathways

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

We need the iterative channel without violating user isolation. We also want Evryn to work with the Operator at full resolution — bringing her working-knowledge of the partnership into every Slack-Operator interaction — including in threads scoped to specific users.

## Decision

Two coupled architectural moves:

**Part 1 — Slack threads as user scope.** Each Slack thread carries one scope: a specific user (`scope_user_id` = that user's UUID), or NULL (= meta-operator: cross-cutting, no specific user). Scope is set at the first message of a thread and inherited by all replies. New top-level Slack messages start new threads, requiring fresh scope determination.

**Part 2 — Operator's profile as working-knowledge in Operator pathways.** Operator's `profile_jsonb` carries Evryn's working-knowledge of her partnership with the Operator (preferences, patterns, calibration). When the runtime fires the Slack-Operator pathway (`handleGeneralMessage`), Operator's profile loads alongside the scoped user's profile (if the thread is user-scoped) or alone (if meta-scoped). This gives Evryn cohesive working-knowledge of how she works with the Operator across iterations — instead of cold-starting every Slack message.

**Operator's profile does NOT load in user-facing pathways** (`processForward`, `processDirect`, cron-driven outreach). Those flows have no Evryn-Operator interaction happening. Minimal context for the task; partnership-knowledge loads when Evryn is partnering, nowhere else.

These two together make cross-user bleed structurally impossible (a thread carries one scope) AND give Evryn full-resolution awareness of her Operator partnership in the pathway where it matters.

### Note on user isolation in Slack-Operator threads

Slack-Operator threads are Justin-Evryn conversations *about* users, not *with* them. So when Mark's profile loads in a Mark-scoped Slack-Operator thread (so Evryn can think about him substantively), nothing from Mark's profile gets surfaced to Mark — he's not in that conversation. Same for Operator's profile: it shapes Evryn's behavior in the thread; it doesn't get echoed back as text. The 100% public-safe discipline below is the safety net for the unlikely case that Operator-profile content ever did surface in a recipient-facing message — it would be harmless because everything in the profile is public-safe by design.

### Mechanism — Part 1: Thread scope on the messages table

**Use the existing `messages` table — no new table needed.** Add a column:

```sql
ALTER TABLE messages ADD COLUMN scope_user_id UUID REFERENCES users(id);
COMMENT ON COLUMN messages.scope_user_id IS
  'For Slack-Operator messages: the user this thread is scoped to (or NULL for meta-operator). For non-Slack messages: NULL (scope is implicit in sender/recipient). See ADR-030.';
CREATE INDEX idx_messages_scope ON messages (thread_id, source) WHERE source = 'slack';
```

The existing `messages` table already has `thread_id` (Slack `thread_ts`), `sender_id`, `recipient_id`, `source`. The new `scope_user_id` column is the only addition needed — it lets any message carry its thread's scope, and the thread's scope is recoverable from any scoped message in the thread.

**Scope determination on a new thread:**
- Inbound Slack message arrives. Runtime checks: does any prior message in this `thread_id` have `scope_user_id IS NOT NULL`? If yes, inherit that scope. If no, this is a new-thread first-message.
- For new-thread first-message: write the inbound message to `messages` with `scope_user_id = NULL` (we don't know yet). Compose Evryn's context: core.md + operator.md + Operator's profile + this single inbound message. Evryn determines scope from content. If scope is a specific user, she calls `set_thread_scope({user_id})` (which writes the scope to the runtime's pending-write state). She composes her response. Runtime writes her outbound message with the determined `scope_user_id`. **Then runtime backfills:** `UPDATE messages SET scope_user_id = $scope WHERE thread_id = $thread_ts AND scope_user_id IS NULL`. Idempotent, cheap, runs once per thread.
- For inherited-scope replies: write the inbound message with the inherited `scope_user_id`. Compose Evryn's context: core.md + operator.md + Operator's profile + scoped user's profile (if scope is a user) + this thread's message history.

**Why backfill is structurally required, not optional:** without it, the first inbound message stays NULL. Cross-thread retrospective queries (*"pull recent threads about Mark"* → `WHERE scope_user_id = $mark_id`) would miss those early messages. Since the first message in a thread typically carries 80% of the framing, missing it is unacceptable.

**Scope locking:** A thread carries one scope for life. Scope changes mid-thread are not allowed — they re-introduce the cross-user-bleed surface this ADR closes.

**Per-thread persistence:** every Slack message gets written to `messages` with `thread_id = thread_ts` and `source = "slack"`. Loading "this thread's history" is a clean filtered query: `WHERE source = 'slack' AND thread_id = $thread_ts`. Never crosses to other threads.

**Meta-operator continuity:** NULL-scoped Slack threads (meta-operator) can load both this thread's history AND prior NULL-scoped operator-thread history (last N days, configurable). This gives Evryn cross-meta continuity safely — all those messages are by definition meta (no user data was loaded into any of them).

### Mechanism — Part 2: Operator's profile in Operator pathways

Operator's `profile_jsonb` follows the standard ADR-027 schema (story + pending_notes + supporting fields), with one addition described below. It's written and reflected on like any other user's profile. The runtime difference is *when* it's loaded.

**Loading rule:** When the runtime fires `handleGeneralMessage` (the Slack-Operator pathway), `composeSystemPrompt` loads core.md + operator.md + Operator's `profile_jsonb` story + Operator's `_meta.discipline_notice`. Then:

- If the thread is user-scoped (per Part 1): the scoped user's person context also loads, alongside Operator's.
- If the thread is meta-scoped (NULL): no specific user context loads. Just core + operator + Operator's profile + this thread's history (and prior NULL-scoped meta-thread history per the meta continuity rule).

**Other pathways do not load Operator's profile.** `processForward`, `processDirect`, and cron-driven flows compose context from core.md + the scoped user's person context, as today — there's no Evryn-Operator interaction in those flows for partnership-knowledge to apply to.

### The 100% public-safe discipline

Operator's profile loads in Operator pathways. The discipline that governs what gets *written* to it has to be ironclad — both because the profile shapes Evryn's behavior in those pathways (so its contents matter) and as defense-in-depth against any future load-surface expansion.

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

> *"This profile holds Evryn's working-knowledge of her partnership with the Operator. **100% public-safe content only — assume any of this could leak.** If a note isn't something you'd be comfortable with a stranger reading from a billboard, it doesn't belong here. Routing for the rest: notes about specific users → that user's profile via `append_pending_note(target_user_id)`. Strategic / business-sensitive content → not captured here (escalate to the Operator if it should be persisted somewhere appropriate). Personal observations about the Operator-as-person → don't capture; communicate directly to the Operator or let it go. **For Reflection (v0.3+):** when reflecting on this profile, do one extra pass — audit existing content for 100% public-safe compliance, flag anything that fails the test."*

Initialized once at Operator user creation. Lives in `_meta`, not `story`, so Reflection writes the story freely without compacting away the discipline header. The trigger loads `_meta.discipline_notice` independently of `story`.

### Audit pathway

For the discipline to actually hold over time, audits have to actually happen.

**v0.2 (manual, in #sweep):** Add a step to the #sweep checklist: *"Spot-check Operator's profile_jsonb for 100% public-safe compliance. If anything in `pending_notes` or `story` fails the 'would I publish this?' test, address it (route to right location, delete, or escalate to Justin)."* Sweep happens regularly; this catches drift early. (See `evryn-team-workspace/shared/protocols/sweep-protocol.md`.)

**v0.3+ (Evryn-self-audit, as part of Reflection):** Reflection is the audit. When Reflection processes Operator's profile, it follows the instruction in `_meta.discipline_notice` to do one extra pass — auditing existing content for 100% public-safe compliance, flagging anything that fails. No separate audit infrastructure needed; the instruction lives in the profile header where Reflection sees it. Justin's framing: *"who better?"* — Evryn writes the notes, has full context, has the calibration to know what's public-safe.

### Cross-user-bleed recovery

A scoped thread is supposed to carry one scope. When that boundary breaks — someone mentions another user mid-thread, or the thread turns out to be wrongly scoped — Evryn flags it as a user-isolation break and acts to restore isolation.

**Mid-thread bleed (another user mentioned in a scoped thread):**

In a Mark-scoped thread, Justin says: *"oh, also, Bob mentioned something interesting about Mark last week."*

Evryn's response, roughly:

> *"I think we just broke user isolation — this thread is scoped to Mark, and you've referenced Bob. I recommend we redact Bob's identifying info from this conversation now, before it persists into a Mark-context that could surface later. I can edit the messages above to replace 'Bob' with '[redacted user]' if you confirm. Then let's start a fresh thread for Bob if there's more to discuss about him."*

She has the agency to act: with Justin's confirmation, she can call `supabase_upsert` (or a dedicated redaction tool — see Open considerations) to update the message content fields, replacing user-identifying terms. The redaction is recorded in the message's metadata so the audit trail is preserved (we know there was a redaction; we can't see what was redacted).

**Wrong-scope recovery (whole thread is wrongly scoped):**

If Justin or Evryn realizes mid-thread that the entire thread is wrongly scoped — e.g., a thread that opened with Justin saying "let's talk about Mark" turns out to be about Bob — abandoning the thread isn't enough. The wrongly-scoped messages stay in the database with `scope_user_id = $wrong_user`. They'd load in future $wrong_user conversations, polluting that user's context.

Evryn's recovery, with Justin's confirmation:

1. Flag the realization: *"I think this thread is actually about Bob, not Mark — that means everything we've said here is wrongly scoped to Mark and would load in Mark's context later if we don't fix it."*
2. Recommend the right move: re-scope all messages in this thread to Bob (`UPDATE messages SET scope_user_id = $bob_id WHERE thread_id = $thread_ts`) AND redact any erroneous Mark references that shouldn't carry forward into Bob's context.
3. Or, if the content is too tangled to cleanly re-scope: nuke the messages, start fresh as a Bob thread.

Either way, Evryn does not silently let wrongly-scoped messages persist. The recovery is explicit, performed (with confirmation), and recorded.

**Identity-layer dependency:** This recovery behavior needs to be in `operator.md` so Evryn knows to flag and act when she detects a scope break. Mira's pass on `operator.md` will codify the language and the action discipline.

### UX flow

- Justin (top-level): *"Mark forwarded that vague filmmaker email — what do you think?"* → Mark-scoped thread opens.
- Evryn (in-thread, with Mark's profile + Operator's working-knowledge in her context): drafts a thoughtful response. Operator's working-knowledge informs *how* she frames it (tone, length, escalation calibration); Mark's profile informs *what* she's classifying.
- Justin (replying in thread): *"yeah let me know what you decide."* → she has the full thread context + Mark's profile + Operator's working-knowledge.
- Justin (top-level, new): *"thoughts on Bob's conversation history?"* → new Bob-scoped thread.
- Justin (top-level, new): *"how are classifications going overall this week?"* → new NULL-scoped thread, no specific user data, Operator's working-knowledge loaded.

### Identity-Layer Additions (Mira pass)

`operator.md` needs:
- The routing discipline (which notes go where, with the public-safe test)
- Awareness of thread scope as the Operator-Slack pathway's structure
- The mid-thread bleed recovery pattern (flag, recommend redaction, perform with confirmation)
- The wrong-scope recovery pattern (flag, re-scope or nuke, with confirmation)
- A note that NULL-scoped threads are meta-operator territory

Possibly a new identity module `situations/meta-operator.md` for cross-cutting strategic conversations, or `operator.md` handles both with a flag. AC + Mira to decide during the Mira pass.

## Consequences

**Positive:**
- Cross-user bleed structurally impossible (thread = scope; can't carry two)
- Justin gets natural multi-turn iteration with Evryn on Slack
- Evryn operates at full resolution in Operator pathways — partnership working-knowledge loads whenever she's iterating with the Operator (instead of cold-starting every Slack message)
- Uses Slack's native thread feature — no special syntax for the Operator
- Maps directly onto ARCHITECTURE.md's planned v0.3 per-user operator interface — this *is* that interface, arriving early
- Resolves the "Slack is single-shot by design" friction without violating user isolation
- Reflection works natively on Operator's profile (consolidates `pending_notes` into `story` over time → cohesive working memory; the public-safe audit is part of Reflection, not separate infrastructure)
- Calibration patterns from past sessions inform present Operator iterations without manual context-passing
- Worst-case-leak is harmless: Operator's profile is 100% public-safe by design

**Negative / risks:**
- New column + ~50-line `handleGeneralMessage` rewrite + small backfill query
- Behavioral dependency: Justin has to use threads for multi-user discussions (one user = one thread). Mistake mode: he replies top-level when he meant to reply in-thread. Mitigation: when Evryn detects ambiguity, she asks before assuming.
- Discipline dependency: Evryn must route notes correctly (public-safe → Operator's profile; user-specific → that user's profile; strategic → escalate) and must flag/redact when scope breaks. The discipline-notice + identity-file principle + audit pathway form belt-and-suspenders. Pattern failure becomes a re-architecture trigger.
- Scope-determination on first message may need an extra round-trip if user identification is ambiguous (verification protocol kicks in). Acceptable — verification is a one-time cost per thread.
- Redaction is destructive (we lose the original content). Acceptable trade-off for user isolation; metadata preserves the audit trail of "this was redacted."

**Operational:**
- Supabase migration: ALTER TABLE messages ADD COLUMN scope_user_id, plus index
- Supabase data: initialize Operator's `profile_jsonb._meta.discipline_notice` field
- ARCHITECTURE.md Operator Track section updated (replaces "single-shot by design" framing with "thread = scope" framing; clarifies Operator's profile loads in Operator pathways only)
- ARCHITECTURE.md v0.3 Operator Interface section updated to point at this ADR
- ARCHITECTURE.md System Actors section updated to clarify Operator's profile is the deliberate exception to "system actors are never subjects" — and that the exception is scoped to Operator pathways (see LEARNINGS 53 clarification)
- `evryn-team-workspace/shared/protocols/sweep-protocol.md` gains an Operator-profile spot-check step
- `operator.md` needs a Mira pass

## One-of carve-out — does not generalize

In a user-scoped Slack-Operator thread, two profiles load: the scoped user's and Operator's. This works *because* Operator is the team — one entity, predictable identity, public-safe working-knowledge applies universally to the partnership. **It does NOT generalize to "load multiple user profiles together in any pathway."** If we ever feel the impulse to load User A's profile alongside User B's because "they came up together," we should resist — that's the cross-user-bleed surface this whole architecture exists to prevent. Operator-as-partnership-context is a one-of carve-out, not a precedent for multi-user loading.

A future reader who sees Operator-loaded-alongside-Mark in a Slack thread and thinks *"oh, we can also load Sally alongside Mark in a `processDirect` flow when they came up together"* — no. This pattern stops with Operator, and only in Operator pathways.

## Related

- ARCHITECTURE.md Operator Track ("Slack Operator is single-shot by design" — to be revised to "Slack thread = scope; Operator's profile loads in Operator pathways only")
- ARCHITECTURE.md v0.3 Operator Interface (per-user persistence — this becomes that interface, on Slack)
- ARCHITECTURE.md Meta-Operator (persistent, cross-cutting, PII-free — NULL-scoped threads handle this naturally)
- ARCHITECTURE.md System Actors / Memory Architecture / Reflection Module (Operator's profile is a deliberate exception in Operator pathways; Reflection handles the public-safe audit via the `_meta.discipline_notice` instruction)
- ARCHITECTURE.md Identity Composition (Permission, not compulsion — the architectural principle this ADR honors by giving Evryn working-knowledge in the pathway where she's partnering, instead of compelling her behavior)
- LEARNINGS item 53 (System actors are FK anchors and senders, never *implicit* subjects of user-scoped operations — clarification needed: Operator-as-foundational-context-in-Operator-pathways is a deliberate exception with explicit pathway-gating; the principle still bars implicit subject-ification)
- ADR-014 (Operator Module Slack-Only — establishes the structural Operator detection that this ADR builds on)

## Open considerations

- **Visibility of scope.** When Evryn determines a new thread's scope, she should announce it ("starting a Mark thread") so Justin sees the state. Visible state beats hidden state, especially for an ops channel. The announcement also doubles as the user-verification step (Justin can correct if she got the wrong user).
- **Meta-operator identity module.** New file `situations/meta-operator.md`, or does `operator.md` handle both with a flag passed by the trigger? AC + Mira call.
- **Thread expiration / cleanup.** Threads accumulate over time. Operational policy: archive after N days? Hard-cap on active threads? TBD before scale.
- **Dedicated redaction tool.** v0.2 can use raw `supabase_upsert` for redaction (Evryn manually crafts the update). A dedicated `redact_user_from_message(message_id, user_name_to_redact)` MCP tool would be safer and audit-trail-friendlier — substitutes the user's name with `[redacted user]` server-side, records the redaction in message metadata. Worth speccing as a follow-up DC task; not blocking for v0.2 if Evryn can do raw upserts cleanly.
- **Evryn-initiated thread scope.** When `notify_slack` posts a new message (escalation), the message is being created in code — Evryn knows the user. `notify_slack` accepts an optional `user_id` parameter that pre-populates the thread's scope when the resulting Slack message gets `thread_ts` assigned. Worth specifying in the implementation.

---

## Amendment 2026-05-22 — Operator-Audience Carve-Out

**Driver:** v0.2 canonical Phase 2 test (2026-05-01) surfaced a cross-instance discipline gap. Cron-fired Evryn drafted a cold-open to Mark forty minutes after Slack-thread Evryn had committed *"I'll wait on the outbound path"* — different invocation context, no `operator.md` loaded, no structural awareness of the in-flight Operator partnership. Eighteen days of subsequent cron-fired pending_notes on Mark (2026-05-04 through 2026-05-22) showed the same gap from another angle: cron-Evryn pinged the Operator on Slack four times (5/6, 5/9, 5/14, 5/16) and wrote daily process-coordination state into Mark's pending_notes, all without the Operator-partnership discipline that would have shaped tone, cadence, and writing target. The original ADR-030 closed cross-user bleed. This amendment closes the cross-instance Operator-discipline gap that the original ADR left open.

### The shift — audience over trigger

The original ADR distinguished pathways by *trigger* (`handleGeneralMessage` loads Operator's profile; `processForward`, `processDirect`, and cron pathways do not). That cut held when triggers and audiences aligned cleanly. They don't always: **cron-driven outreach is two pathways masquerading as one** — sometimes its audience is the Operator (a `notify_slack` ping for approval / clarification / escalation), sometimes its audience is the user (a `submit_draft` outbound after approval). The audience determines what discipline applies, not the trigger.

**The amended rule:** Operator-context loads when Evryn's audience is the Operator. In practice, this means:

- **Slack-Operator pathway (`handleGeneralMessage`):** loads `operator.md` + Operator's profile + Operator's `_meta.discipline_notice`. *(Unchanged from original.)*
- **Cron pathways (`checkProactiveOutreach`, `checkFollowUps`):** **load `operator.md` + Operator's profile + Operator's `_meta.discipline_notice`** — because cron-Evryn may, in any given invocation, ping the Operator via `notify_slack` (audience = Operator) before deciding whether to draft. Loading Operator-discipline structurally means her judgment about *when to draft, when to escalate, when to wait* is informed by partnership context every time.
- **Inbound user pathways (`processForward`, `processDirect`):** **do NOT load Operator-context.** *(Unchanged from original.)* The audience in these flows is the inbound user; Evryn is responding to them; the Operator isn't in the conversation. ADR-030's original cross-user-bleed reasoning applies cleanly.

### The leak-vector guardrail — what gets *written* under this load

Loading Operator-context in cron is the easy half of the amendment. The harder half is what cron-Evryn writes once she has both Operator-context and the scoped user's profile in scope.

**The risk:** with `operator.md` + Operator's profile loaded alongside Mark's profile, cron-Evryn writing pending_notes to Mark could pollute Mark's record with Operator-coordination state (*"Justin's tied up with legal work,"* *"Justin took 3 days to respond,"* *"deferred per Justin's bandwidth"*). The eighteen pre-amendment cron notes on Mark exhibit exactly this pattern — half their substance is *about Justin*, not about Mark. That's a leak vector — Mark's record carries Operator-state that doesn't belong there.

**The discipline:** pending_notes written about a user must be *user-substantive*. Evryn's actions toward the user (drafted, deferred, surfaced) are user-substantive. Evryn's observations of the user's situation, work, or trajectory are user-substantive. Operator-state and Evryn-Operator coordination state are **not** user-substantive — they belong in Operator's profile (if 100% public-safe) or nowhere (if not).

The test, when cron-Evryn is about to write to a user's pending_notes: *"is this a fact about, action toward, or observation of the user — or is this state about Justin, my coordination with him, or my own process?"* The first goes to user pending_notes. The second does not.

**Why this works architecturally:** Operator-context informs cron-Evryn's *judgment* (she knows whom she's working with, what cadence is appropriate, when to escalate) without polluting *writes* (user pending_notes stay user-substantive). Same posture as a thoughtful executive assistant: she remembers your preferences when scheduling but doesn't write *"Justin is stressed"* in someone else's contact card.

### Identity-layer dependency

This amendment is mechanically realized by:

1. **Runtime change (DC):** [`src/email/poll.ts:378` `checkProactiveOutreach`](../../../evryn-backend/src/email/poll.ts#L378) — change `composeSystemPrompt(personContext, false)` to `composeSystemPrompt(personContext, true, operatorProfile)`. Same change for `checkFollowUps` (per DC's 2026-05-02 architectural note — already loads `operator.md` without Operator profile; normalize to load both). DC's 2026-05-02 Item-2 brief covers this.
2. **Identity-layer language (Mira):** `operator.md` needs an addition naming the write-discipline above — *"when writing to a user's pending_notes, restrict yourself to user-substantive content; Operator-coordination state goes to Operator's profile (if public-safe) or nowhere."* Mira's parallel work on `[binding: ...]`-tagged process-commitments (per her 2026-05-01 brief Item 3) gives the *structural* home for binding state — this amendment gives the *discipline* for what stays out of user-records during the v0.2 window before the binding-tag mechanism is fully in place.

### What the amendment does NOT do

- **Does not load Operator-context in inbound user pathways.** ADR-030's original cross-user-bleed reasoning still applies there.
- **Does not generalize the carve-out beyond Operator.** This stays a single-entity exception, scoped to one audience type. The "one-of carve-out" guardrail at the bottom of the original ADR continues to hold for all other "load multi-profile" impulses.
- **Does not enable cron-Evryn to write directly to Operator's profile from cron context.** Cron-Evryn reads Operator's profile for context; writing to Operator's profile happens via the standard `append_pending_note(target_user_id=$operator_id)` path, governed by the 100% public-safe discipline. Same path as today; no new write surface.

### Cross-references

- **ARCHITECTURE.md** Identity Composition + Cache Prefix sections updated 2026-05-22 to reflect the audience-not-trigger framing.
- **DC Item 2 brief** (2026-05-02 `evryn-backend/docs/ac-to-dc.md`): runtime mechanics that realize this amendment.
- **Mira identity-craft items** (2026-05-01 `_evryn-meta/docs/sessions/historical/2026.05/2026-05-01-mira-brief-phase2-discoveries.md`): identity-layer language realizing the write-discipline above + the structural `[binding: ...]` mechanism for cross-instance commitments.
- **2026-05-22 session work** (this session's lock notes): empirical evidence — 18-note arc on Mark's profile — that motivates the amendment.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
