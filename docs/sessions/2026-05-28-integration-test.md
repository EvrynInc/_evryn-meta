# Integration Test Session — 2026-05-28

> **Mid-flight scratchpad.** This doc is currently a holding place for two running lists (Mira pile + DC pre-Mark-live knock list). The full narrative arc, decisions, lessons, and #lock content will be populated at the end of the session. **Do not treat this as the complete record yet.**

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

---

## Status (high level)

Mid integration test (Phase 2 of v0.2 "Gatekeeper's Inbox"). Wave 2 live on production (`865af3cf` from 2026-05-27 14:12 PT). Mark's DB wiped clean per the packout. Test sequence:

- **Turn 1 landed 2026-05-28 19:50:10Z** — Justin's intro per the script, with research-instruction.
- **Turn 1 outbound 2026-05-28 19:52:41Z (+151s)** — Evryn presented locked-confirmation + research summary + 3 clarifying questions.
- **Currently awaiting:** Justin's reply to her three questions, then she drafts the intro email to Mark.

---

## Mira pile (queued for post-test trip)

Identity-file work for Mira to land after the current integration test wraps. Files in `evryn-backend/identity/`.

### Required reading before Mira's trip — the 2026-05-28 integration-test Slack thread

**Read this thread end-to-end before touching the identity files below.** It carries more in-the-wild empirical material on how activity modules shape outputs (and how their absence shows up in drafts), the introspection gap, the "loaded-but-not-loaded" failure mode, the slick-phrasing tell ("no tool, no call"), the "Should also cover" reading-as-suggestion problem, hyper-brevity collapsing into minimalism, the feedback-guidance miss (bare yes/no = least useful), hallucination-and-correction, the Operator-profile-write mechanic in practice, and Evryn's own "performing forward motion" self-diagnosis — than any other session we have. Reading the pile items below without first reading the thread will miss the texture they emerged from.

**Where to find it:**

- Thread: `1779997809.975439` in the Evryn `messages` table (Slack-Operator pathway, scope=`72c22bc4-f18e-404d-a1c9-6fcdf7289b3a` Mark)
- Query: `SELECT created_at, sender_id, message_body FROM messages WHERE thread_id = '1779997809.975439' ORDER BY created_at`
- Window: 2026-05-28 starting ~19:50 UTC (12:50 PT) through wherever the thread ends at session #lock
- The Linear-ticket post she made is a separate NULL-scoped top-level message also from 2026-05-28; query: `SELECT * FROM messages WHERE created_at::date = '2026-05-28' AND scope_user_id IS NULL`

1. **Verification-block-always discipline.** Today (2026-05-28 turn 1) Evryn used Justin's two URLs as implicit anchor confirmation and locked scope without presenting an explicit verification block. `operator.md` §"Setting scope on a new thread" already calls for verify-and-lock as one combined beat — but it didn't fire as an explicit step. The current language is permissive enough that anchor-via-URL-disambiguation reads as "verification already happened." Tighten so the explicit beat fires 100% of the time (architecturally important because the verification block is what creates the clean turn-1 → turn-2 boundary where Mark's profile loads structurally on turn 2; today she did all the research on turn 1 without Mark's profile in her systemPrompt).
2. **Tighten the meta-note-from-scoped-thread mechanic** in `operator.md`. Line 96 carries the principle (route Operator-coordination state to Operator's profile, not user pending_notes). The *mechanic* — that from within a user-scoped thread she can call `append_pending_note(target_user_id=<operator's UUID>)` to write to the Operator's profile — is implicit but not explicit. Make it explicit so the principle is actionable.
3. **Activity-module forward-load beat.** Once Evryn has formed a working sense of who a user is and what kind of work is about to happen with them (gatekeeper onboarding, regular onboarding, an aftercare check-in, etc.), proactively load the relevant activity module — don't wait until she's mid-draft. Frames the response before composition starts. Today, 2026-05-28: she correctly executed the research pattern from `onboarding.md` ("Look Them Up" — `operator.md` line 110 cues it for Operator handoffs); whether she also loaded `gatekeeper-onboarding.md` for the intro-drafting is unknown (observability gap — see DC list #2). Even if she did, the *discipline* of forward-loading deserves explicit naming so it doesn't depend on her happening to think of it. Candidate framing: a "Look Ahead" companion beat alongside the existing "Look Them Up" research pattern.

---

## DC pre-Mark-live knock list (queued for post-test trip)

Runtime work for DC to land after the current integration test wraps. Files in `evryn-backend/src/`.

1. **Cron heartbeat log.** `checkProactiveOutreach` in `src/email/poll.ts:365-428` produces zero stdout on the happy no-op path (only writes to `console.error` on throw; `updateUser` is silent on success). Add 3-4 `console.log` lines naming user + decision (gate passed, runEvrynQuery succeeded with X outcome, timestamp bumped). Confirmed empirically 2026-05-28 7am PT cron fired against Mark's wiped profile and wrote no log line. Already in SPRINT-MARK-LIVE.md backlog as of today's earlier commit.
2. **`read_identity_module` call logging** (and ideally all MCP tool calls). Every time Evryn calls a tool, log `{tool: <name>, args: <relevant args>, pathway, scope, timestamp}`. Tiny instrumentation; massive observability win during integration + adversarial testing. Without this we are blind to what Evryn actually loaded for each turn.
3. **Slack-Operator cross-thread scope-loading** (the Bug B parallel). Bug B's auto-load fires in user pathways (`processForward`, `processDirect`, cron); the Slack-Operator pathway (`handleGeneralMessage`) has the parallel gap. When in a user-scoped Slack-Operator thread, also load Operator-scoped messages about that user from other threads (excluding current thread to avoid duplication with thread history). Uses the existing `getOperatorScopedMessages(user.id)` helper Bug B already added — same shape, different caller.
4. **User / Operator dossier refactor — land #3 via the abstraction.** Introduce `loadUserDossier(user_id)` and `loadOperatorDossier()` as composition primitives that every pathway calls. Eliminates the per-pathway duplication that caused Bug B in the first place. While in this code, also rename `handleGeneralMessage` → `handleOperatorMessage` (the function is Operator-only; the "general" naming is a misnomer that misleads readers about what it does). Cite: AC + Justin discussion 2026-05-28, captured in this session doc.

---

## Re-test sequencing

After Mira's + DC's work ships (parallel-able — different files in different directories, no conflict), single Railway redeploy, then re-run the integration test. Goal of re-run: clean verify-and-lock beat firing, observability into what loaded, cross-thread scope-loading working.

---

## End-of-session — to populate at #lock

- Full narrative arc of the test (turns, decisions, what worked, what didn't)
- Decisions made
- Lessons / patterns surfaced
- ADR candidates
- Files committed this lock
- Operator-relevant changes
- Bring Soren + Mira in at the very end so they can see this and write their own memories about it (Justin's reminder)

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
