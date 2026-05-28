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

1. **Verification-block-always discipline.** Today (2026-05-28 turn 1) Evryn used Justin's two URLs as implicit anchor confirmation and locked scope without presenting an explicit verification block. `operator.md` §"Setting scope on a new thread" already calls for verify-and-lock as one combined beat — but it didn't fire as an explicit step. The current language is permissive enough that anchor-via-URL-disambiguation reads as "verification already happened." Tighten so the explicit beat fires 100% of the time (architecturally important because the verification block is what creates the clean turn-1 → turn-2 boundary where Mark's profile loads structurally on turn 2; today she did all the research on turn 1 without Mark's profile in her systemPrompt).
2. **Tighten the meta-note-from-scoped-thread mechanic** in `operator.md`. Line 96 carries the principle (route Operator-coordination state to Operator's profile, not user pending_notes). The *mechanic* — that from within a user-scoped thread she can call `append_pending_note(target_user_id=<operator's UUID>)` to write to the Operator's profile — is implicit but not explicit. Make it explicit so the principle is actionable.

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
