# Session: 2026-04-27 — Integration Test Pivot + Loop Bug Discovery

**Status when this doc was written:** Paused mid-test. AC self-flagged as muddy. Justin asked AC to write this session doc and hand off to a fresh AC instance who will vet everything (especially the DC mailbox note) before DC is spun.

**This is NOT a #lock.** Justin specifically chose session-doc-then-fresh-AC-review over #lock. Future AC: read this, then read the DC mailbox note critically, then proceed.

---

## Heads up: AC was muddy

The previous AC instance (me, writing this) was tracking many threads simultaneously by the end of the session and started making architectural reasoning errors that Justin caught with first-principles thinking. Specifically: I proposed a cross-user-bleed defensive fix, then proposed an implementation that would have broken legitimate user history loading, then re-proposed the fix again — and Justin still felt I wasn't really tracking what he was pointing at.

**Future AC: do not rubber-stamp my conclusions, especially Task 5 in the DC mailbox note. Re-derive the cross-user-bleed analysis from first principles and judge whether Task 5 is actually needed.** Justin's intuition (rendered in his own words below) may be more correct than my framing.

---

## What's at the top of mind right now

The integration test was paused when a loop bug surfaced. The bug: Evryn's own draft submissions were being polled back as inbound `direct_message` `emailmgr_items`, triggering her to draft about them, which created the next inbound, etc. Loop ran ~9 minutes / 14 items before Justin manually broke it. Evryn diagnosed the root cause herself in real time (impressive).

**Database is now back to plastic-wrap state** (3 system actors + Mark, 0 emailmgr_items, 0 messages).

**DC mailbox note has been updated three times today.** The current version (`evryn-backend/docs/ac-to-dc.md`) has 4-5 tasks. **Future AC must vet this note carefully before Justin spins DC.** It is the most consequential artifact from this session.

---

## What's done (don't redo)

- ✅ Pre-test cleanup: wiped Day 2 lead users + leftover items + Justin/Google Workspace stale records
- ✅ Pre-created Mark in DB with full ADR-027 template (UUID `72c22bc4-f18e-404d-a1c9-6fcdf7289b3a`, email `systemtest@evryn.ai`, empty story, empty pending_notes)
- ✅ Day 6 deferred items verified shipped (model tier Opus, RPCs, schema, gatekeeper_criteria removed, conversation history loading, profile_jsonb scaffold)
- ✅ Both subagent reports absorbed (architecture+build+sprint, vision+T&S+tech-vision)
- ✅ WebSearch enabled in `_evryn-meta/.claude/settings.json` (added to permissions allow list)
- ✅ Two web research subagents run on real Mark Titus — WebFetch alone got 5/10 richness in 27 calls; WebSearch+WebFetch got 9/10 in 8 calls. Decision: enable both for Evryn.
- ✅ Pivot to real-Mark identity: rewrote `tests/fixtures/test-gatekeeper-profile.md` with real Mark Titus profile + research-derived answer key
- ✅ Rewrote `tests/fixtures/integration-test-script.md` Phase 2 intro with real-Mark + research instruction
- ✅ Audited 18 fixture emails — 10 clean, rewrote 5 (gold-filmmaker-collab, gold-festival-programmer, gold-warm-intro, edge-adjacent-request, edge-spammy-but-relevant), updated 2 minor (gold-sustainable-food, edge-ambiguous-personal)
- ✅ End-of-sprint cleanup step added to BOTH `SPRINT-MARK-LIVE.md` AND `operator-guide.md` Go-Live Checklist (kill test-Mark UUID + create fresh real-Mark record + clear evryn@/systemtest@/review@ inboxes before going live; Justin must visually verify)
- ✅ Sprint tracker pivot row added (Day 6 row capturing today's work)
- ✅ Sprint tracker breadcrumb added on the Day 4 deferred Identity/runtime dedup review row, flagging today's finding
- ✅ Mira (in another window) shipped identity-file edits (commit 416cd44) — light WebFetch+WebSearch capability statement in core.md, full anchor-then-expand "Look Them Up" research pattern in onboarding.md, one paragraph in operator.md pointing back to onboarding.md. **AC has not yet sent Mira the second brief (no-reply short-circuit) — Justin held it pending DC report.**
- ✅ DB plastic-wrap restored after the loop bug (33 messages + 25 emailmgr_items + 2 Google user records wiped)
- ✅ Verified Railway env via GraphQL: `SEND_ENABLED=true`, `NODE_ENV=development`, `POLL_INTERVAL_MS=10000`. So drafts WERE sending — the missing-drafts mystery was that `getRecipient()` redirected them to systemtest@evryn.ai instead of review@. Justin found them there.

---

## What's open

### DC mailbox note (`evryn-backend/docs/ac-to-dc.md`) — REVIEW CRITICALLY

Current contents (as I last wrote them, before muddiness was self-flagged):
- **Task 1:** Add `WebFetch` + `WebSearch` to `allowedTools` in `classify.ts` (small)
- **Task 2 (CRITICAL):** Fix the draft-loops-as-inbound bug. Includes Evryn's own root-cause diagnosis as a starting point. Speculation about Gmail poll query being too broad (e.g., `is:unread` instead of `in:inbox`).
- **Task 3 (CRITICAL):** Give Evryn a no-draft escalation exit. Modify the trigger handoff prompt so on no-reply / system-noise senders, she uses `notify_slack` instead of `submit_draft`. (Justin's "she opts out, doesn't blow up my Slack" requirement.)
- **Task 4:** Remove the `getRecipient()` redirect entirely. Justin's reasoning: real Mark's email is verified absent everywhere, Mark in DB is systemtest@, so the redirect is fix-on-fix that's now actively breaking the review@ workflow. AFTER this lands, AC needs to update `operator-guide.md` to remove redirect references.
- **Task 5 (THE MUDDY ONE — RE-EXAMINE):** Skip history loading when inbound sender is a system actor. Defense-in-depth against cross-user bleed.

### The Task 5 analysis specifically — where I might be wrong

Sequence of how I got to Task 5:

1. Justin asked: *"if she's pulling her own messages every time she talks to a user, then she's creating cross-user bleed, no?"*
2. I said: yes, real risk, recommended Task 5 as defense-in-depth — "filter messages where queried user is Evryn"
3. Justin pushed back: *"that would completely break things. The fact that Evryn pulled her own messages — that was because she was the user she was dealing with. So it worked perfectly. Saying 'exclude messages with Evryn's uuid' would completely break things, no?"* He proposed: *"don't write messages to Evryn's user, just like we don't with Operator."*
4. I responded: yes, you're right my filter would break things. The literal version of your proposal isn't feasible (FK NOT NULL constraints) but the spirit is right — match the Operator pattern: don't query history when sender is a system actor.
5. Justin clarified again: *"the current getRecentMessages: the query is: get messages where userA and userB are on the message? That's fine, right? That can't create cross-user bleed, yeah? Because even though Evryn is involved with other users, the query will only pull the messages with this user. The only reason she was able to to see her own messages was because she was the other user, yeah?"*
6. I responded: yes, you've got it. Query is fine. Bleed only happens when queried user IS Evryn. Fix is to skip history loading when sender is a system actor.
7. Justin: *"I don't think you're getting it. And I think you're really muddy."*

**What I might be missing — for future AC to investigate:**

Justin's framing in #5 carries an implicit "two-user constraint" that I may have flattened. He says: "messages where userA AND userB are on the message." That implies a query that REQUIRES both parties — like `(sender=A AND recipient=B) OR (sender=B AND recipient=A)`. The current `getRecentMessages(user_id)` is a ONE-user query — "where this user is sender or recipient." Those are different.

In v0.2, in practice, those two queries return the same results (because all conversations are User↔Evryn). But conceptually they're different:
- One-user query: "all messages this user is involved in" — risks bleed if the queried user is in many conversations (Evryn is)
- Two-user constrained query: "all messages between THIS pair" — strictly scoped, no bleed possible regardless of who the queried users are

**Possible alternate read of Justin:** Maybe his point is "Task 5 is defending against a problem that doesn't exist if the query is correctly constrained — and the fix isn't 'don't call getRecentMessages for Evryn,' it's 'make sure getRecentMessages is correctly two-user-scoped.' OR maybe his point is: 'Task 2 alone (loop fix) is sufficient — if drafts can't become inbound items, sender=Evryn never arises in inbound processing, so Task 5 is fixing a problem we don't have.'"

I'm not sure which read is right because I'm muddy. **Future AC: read messages.ts directly to see what the actual query is. Determine whether Task 5 is necessary as a separate fix, or whether Task 2 alone is sufficient. Then update the DC mailbox note accordingly.**

### Mira's second brief (no-reply short-circuit) — held

I drafted a brief for Mira to add a no-reply / system-sender short-circuit to `triage.md` (defense-in-depth at identity layer alongside DC's runtime fix). Justin held it pending DC report — his reasoning was that this is the wrong altitude, the real fix is at runtime (Task 3 in DC mailbox), and the identity-layer defense-in-depth may be unnecessary if Task 3 lands cleanly. **Don't send the Mira brief unless DC's Task 3 turns out to be insufficient.**

---

## Justin's stated intent for the rest of today

1. Future AC reviews this doc + the DC mailbox note critically
2. Updates the DC mailbox note if Task 5 is wrong-altitude or unnecessary
3. Spins DC to do whatever the corrected mailbox note says
4. Once DC redeploys, run a smoke test
5. Resume the integration test from Phase 2 (Justin posts the real-Mark Slack intro from `tests/fixtures/integration-test-script.md`)

---

## What I think IS true (high confidence) — but verify

- **Database is in clean plastic-wrap state.** 3 users (Operator, Evryn, Mark), 0 emailmgr_items, 0 messages.
- **Real Mark's email is verified absent from codebase + DB.**
- **Mark's record in DB has full ADR-027 template** with empty story / empty pending_notes (intentional — Evryn fills it from her research + Justin's Slack intro + the conversation).
- **Railway env: `SEND_ENABLED=true`, `NODE_ENV=development`.** Drafts ARE being sent. They go to systemtest@ because of the redirect.
- **The redirect (`getRecipient()` in `src/email/client.ts`) is what made Justin's drafts appear missing during the loop.** They were going to systemtest@evryn.ai instead of review@evryn.ai.
- **WebSearch is enabled in `_evryn-meta/.claude/settings.json`.** AC subagents can use it. (Evryn herself can't until DC adds the tools to her allowedTools — Task 1.)
- **Mira's identity-file edits are committed (416cd44).** Research-aware Evryn pattern is in place.
- **The fixture emails are real-Mark-aligned.** All 18 fixtures match the new Mark profile.
- **The pre-go-live cleanup step is captured in two places** (sprint tracker + operator-guide). Both require Justin to visually verify clean DB AND clean Gmail before wiring real Mark's email.

---

## What I think IS true (lower confidence) — please verify

- **Task 2 (loop fix) alone may be sufficient — Task 5 may be unnecessary.** Justin's clarifications point this direction. But I haven't read messages.ts deeply enough to be sure.
- **The cross-user bleed risk is bounded by "system actor as queried user" — i.e., it CAN happen but only via the loop bug or some other code path that produces sender=Evryn.** No legitimate flow today produces sender=system-actor on inbound.
- **The Operator pattern isn't perfectly analogous to what we'd do for Evryn** — Operator messages are Slack (single-shot, no history is the design baseline). Evryn-as-sender on inbound is an emergent bug, not a designed channel. The right defense might just be "fix the bug" (Task 2), not "skip history for system actors" (Task 5).

---

## What's worth #locking (Justin asked me to flag)

**Two things only:**

1. **The decision to remove the `getRecipient()` redirect.** This is a real architectural shift — moving from "two safety layers (redirect + kill switch)" to "one kill switch + approval gate + use systemtest@ in DB as Mark's address." Worth an ADR at #lock so the reasoning is captured (real Mark's email verified absent, Tasks 2+3 close other risks, simplification > belt-on-suspenders). Don't write the ADR now (I'm muddy); future AC or next #lock can write it.

2. **The cross-user-bleed analysis** (whatever the actually-correct conclusion turns out to be after future AC reviews). This touches a load-bearing principle ("user isolation is absolute"). Worth capturing the architectural lesson properly. Could go in ADR or LEARNINGS.md.

Everything else from today (fixture rewrites, Mark profile, sprint tracker rows, identity edits) is already captured in the relevant files. No #lock needed for those.

---

## Files touched today (for reference)

- `_evryn-meta/.claude/settings.json` — WebSearch enabled
- `_evryn-meta/docs/current-state.md` — NOT touched today (still references pre-pivot state)
- `evryn-backend/docs/SPRINT-MARK-LIVE.md` — multiple updates (pivot row, dedup-review breadcrumb, Pre-Go-Live Cleanup section, Backlog section)
- `evryn-backend/docs/operator-guide.md` — Go-Live Checklist updated with cleanup step
- `evryn-backend/docs/ac-to-dc.md` — three rewrites; current version has 4-5 tasks (the muddy one)
- `evryn-backend/tests/fixtures/test-gatekeeper-profile.md` — full rewrite for real Mark Titus
- `evryn-backend/tests/fixtures/integration-test-script.md` — full rewrite for real-Mark + research instruction
- `evryn-backend/tests/fixtures/emails/01-gold-filmmaker-collab.txt` — "The Last Run" → "The Wild"
- `evryn-backend/tests/fixtures/emails/02-gold-festival-programmer.txt` — "Copper River" → "The Wild" + reframe
- `evryn-backend/tests/fixtures/emails/03-gold-sustainable-food-opportunity.txt` — Canlis chef → Sushi Kappo Tamura
- `evryn-backend/tests/fixtures/emails/04-gold-warm-intro.txt` — Cordova → Bristol Bay; expanded August Island framing
- `evryn-backend/tests/fixtures/emails/11-edge-adjacent-request.txt` — "Aronov" → "Titus"
- `evryn-backend/tests/fixtures/emails/12-edge-spammy-but-relevant.txt` — Cordova framing → Bristol Bay
- `evryn-backend/tests/fixtures/emails/13-edge-ambiguous-personal.txt` — removed "you know how it goes up here"
- `evryn-backend/identity/core.md` — Mira (commit 416cd44)
- `evryn-backend/identity/activities/onboarding.md` — Mira (commit 416cd44)
- `evryn-backend/identity/situations/operator.md` — Mira (commit 416cd44)

---

## Recommended first action for future AC

1. **Read this whole doc.**
2. **Read `evryn-backend/docs/ac-to-dc.md` critically.** Don't accept Task 5 at face value — re-derive whether it's actually needed.
3. **Read `evryn-backend/src/db/messages.ts`** to see what `getRecentMessages` actually does as code (not just the function signature). Determine if it's a one-user or two-user query.
4. **Decide whether Task 5 stays, gets reframed, or gets removed.**
5. **Update the DC mailbox note** to reflect the corrected reasoning, and flag the change explicitly to Justin so he can rubber-stamp meaningfully.
6. **Tell Justin you're done reviewing**, ask if he's ready to spin DC.
7. **After DC reports back** (1-3 min per DC multiplier), run smoke test, then resume Phase 2 of the integration test.

Good luck. Don't trust my final-hour conclusions.

— AC (2026-04-27, ~16:30 PT, end of session)
