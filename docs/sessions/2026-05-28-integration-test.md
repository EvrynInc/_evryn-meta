# Integration Test Session — 2026-05-28 → 2026-05-29

> **Mid-flight scratchpad.** This doc holds the running lists (Mira pile + DC pre-Mark-live knock list + v0.3 deferred questions) and a rolling status snapshot. **From 2026-05-29 forward, every list change in chat is reflected here in the same turn — no "I'll capture it later."** A fresh AC0 instance should be able to pick up from this doc + the conversation thread it references without losing material context.
>
> The full narrative arc, decisions, lessons, and #lock content will be populated at the end of the session.

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

---

## Status (rolling)

**Where we are (top of 2026-05-29, post-overnight):**

- Test sequence is **mid Phase 2 → Phase 3 transition.** First intro email shipped to Mark at 22:54:57Z 2026-05-28 (`systemtest@evryn.ai`). Mark replied at 23:07:42Z (Justin playing Mark). Evryn drafted a response (item `6383fdc2`, original body) — rejected by Justin as "not recognizable as Evryn" (transactional voice, "three lanes," "junk classifications" jargon, no warmth, gatekeeper-onboarding beats either missed or treated as soft suggestions).
- Justin issued a **standing instruction at ~00:08Z 2026-05-29:** Evryn must `read_identity_module` for all five activity/situation/feedback modules every volley and lead each response with a header naming what's loaded. Posted as a NEW top-level Slack message — landed in a different thread from the Mark-scoped one (thread `1780009886.535399`, scope=null).
- **Re-draft in that NULL-scoped thread was substantially better** — recognizably Evryn. Not submitted via `submit_draft` (Justin instructed her to draft in Slack only until iteration's dialed). Sitting in chat at end of day.
- **Overnight (2026-05-28 17:10 PT through 2026-05-29 07:43 PT):** Evryn pinged Justin every 15 minutes from 6:34pm onward. Slack DND saved him; he marked them complete at 7:43am to stop the cascade. **Adding as DC item 7** (quiet hours + cadence).

**Next moves (Justin's call):**

1. Ship a clean second-volley response to Mark — either send the existing Slack-iterated draft via `submit_draft`, or have Evryn re-do with everything loaded. Completes Phase 2.
2. Run 1-2 Phase 3 volleys — mechanically exercise the multi-turn email pipeline (history loading, threading, `append_pending_note` from real conversation, cron not firing inappropriately). Voice may still be off; that's expected pre-force-load.
3. Stop. Ship DC fixes (force-load is the big one).
4. Re-run test cleanly post-fix — that's the Mark-live readiness signal.

---

## Required reading before Mira's trip — the 2026-05-28 → 2026-05-29 integration-test Slack threads

**Read both threads end-to-end before touching the identity files.** They carry more in-the-wild empirical material on activity-module-load failure modes, the introspection gap, "loaded-but-not-loaded," the slick-phrasing tell ("no tool, no call"), "Should also cover" reading-as-suggestion, hyper-brevity collapsing into minimalism, feedback-guidance miss, hallucination-and-correction, Operator-profile-write in practice, and "performing forward motion" self-diagnosis than any other session.

**Where to find them:**

- **Mark thread (original):** `1779997809.975439` — scope=`72c22bc4-f18e-404d-a1c9-6fcdf7289b3a` (Mark). Window: 2026-05-28 ~19:50 UTC onward.
- **Standing-instruction thread:** `1780009886.535399` — scope=null. Window: 2026-05-29 ~00:08 UTC onward. *(This is the thread where the "load everything every turn + show header" discipline got installed and the better re-draft happened.)*
- **Linear-ticket post:** separate NULL-scoped top-level message from 2026-05-28.
- **Outbound emails / Mark inbound:** `src='email'` rows, scope=null.

Queries:

```sql
SELECT created_at, sender_id, source, message_body
FROM messages
WHERE thread_id IN ('1779997809.975439', '1780009886.535399')
   OR (created_at::date >= '2026-05-28' AND source = 'email')
ORDER BY created_at;
```

---

## Mira pile (queued for post-test trip)

Identity-file work for Mira to land after the integration test wraps. Files in `evryn-backend/identity/`.

1. **Verification-block-always discipline.** 2026-05-28 turn 1: Evryn used Justin's two URLs as implicit anchor confirmation and locked scope without presenting an explicit verification block. `operator.md` §"Setting scope on a new thread" already calls for verify-and-lock as one combined beat — but it didn't fire as an explicit step. Current language is permissive enough that anchor-via-URL-disambiguation reads as "verification already happened." Tighten so the explicit beat fires 100% of the time (architecturally important because the verification block is what creates the clean turn-1 → turn-2 boundary where the scoped user's profile loads structurally on turn 2; today she did all the research on turn 1 without the structurally-loaded profile in her systemPrompt).
2. **Tighten the meta-note-from-scoped-thread mechanic** in `operator.md`. Line 96 carries the principle (route Operator-coordination state to Operator's profile, not user pending_notes). The *mechanic* — that from within a user-scoped thread she can call `append_pending_note(target_user_id=<operator's UUID>)` to write to the Operator's profile — is implicit but not explicit. Make it explicit so the principle is actionable. *(Empirically validated 2026-05-28 — she did it when Justin explicitly asked, would benefit from doing it unprompted.)*
3. **Activity-module forward-load beat.** Once Evryn has formed a working sense of who a user is and what kind of work is about to happen with them, proactively load the relevant activity module — don't wait until she's mid-draft. Frames the response before composition starts. Today, 2026-05-28: she correctly executed the research pattern from `onboarding.md` ("Look Them Up" — `operator.md` line 110 cues it for Operator handoffs); whether she also loaded `gatekeeper-onboarding.md` for the intro-drafting is unknown (observability gap — see DC list #2). Even if she did, the *discipline* of forward-loading deserves explicit naming so it doesn't depend on her happening to think of it. Candidate framing: a "Look Ahead" companion beat alongside the existing "Look Them Up" research pattern.

   **Lifecycle note (2026-05-28, updated 2026-05-29):** if DC's force-load fix lands (loading all activity modules structurally for v0.2), this beat becomes moot for v0.2. **Whether it re-activates at v0.3+ is now genuinely open**: per Justin's 2026-05-29 caching insight (see v0.3 deferred question #3 below), force-load + prompt caching may be the right v0.3+ shape too, in which case the beat stays permanently dormant rather than transitionally so. Frame in module text as transitional, with a note that the v0.3 architecture pass will resolve whether selective loading actually returns.

4. **Tighten gatekeeper-onboarding.md so the first-touch landing is unambiguous.** Surfaced 2026-05-28 mid-test. Even when Evryn explicitly loads `gatekeeper-onboarding.md`, the first message she produces from it is muddled — grabbing some beats, missing others, treating "Should also cover" as soft suggestion when it's load-bearing, hyper-optimizing for brevity at the cost of substance, then losing the criteria-conversation entry point entirely. Future volleys can leave judgment open, but **the first message has to stick the landing** — first-impression damage with a gatekeeper compounds (Mark would walk away thinking "this is going to be a slow, boggy process — I'll get to it in a month"). Specific candidates: (a) distinguish "what belongs in first-touch" from "what belongs in the conversation that follows the reply"; (b) sharpen the criteria-conversation entry point so she doesn't justify cutting it; (c) firm up "Should also cover" as load-bearing-not-optional with vocabulary calibrated against ADR-033's spectrum; (d) possibly add a worked example of a clean first-touch email so she has a reference shape; (e) name the failure mode explicitly ("if you cut beats to feel light, the email feels boggy, not light — concreteness *is* what makes it feel easy").

   **Open question for Mira (Justin's call): should we just script this?** The trust-arc-scripts.md pattern is the model — *"these scripts were designed very intentionally — follow the sequence and the wording unless the situation genuinely requires you to adapt. When you do adapt, track close — understand why these words were chosen, and carry that reasoning into your version. Don't paraphrase casually. These are your words."* The first-touch landing has the same character: exact words matter, the framing is intentional, deviation should be only "to be more responsive to the moment." A scripted first-touch (Mark / Eva / etc. — gatekeeper variants, with the same "follow unless the situation genuinely requires adapt" framing) might solve the muddled-landing problem more reliably than tighter guidance. Mira's craft call.

---

## DC pre-Mark-live knock list (current as of 2026-05-29)

Runtime work for DC to land after the current integration test wraps. Files in `evryn-backend/src/`. *(History of churn through 2026-05-28: list grew, items were dropped, items expanded. Below is the current authoritative state.)*

1. **Cron heartbeat log.** `checkProactiveOutreach` in `src/email/poll.ts:365-428` produces zero stdout on the happy no-op path (only writes to `console.error` on throw; `updateUser` is silent on success). Add 3-4 `console.log` lines naming user + decision (gate passed, runEvrynQuery succeeded with X outcome, timestamp bumped). Confirmed empirically 2026-05-28 7am PT cron fired against Mark's wiped profile and wrote no log line. Already in SPRINT-MARK-LIVE.md backlog as of 2026-05-28's commits.

2. **MCP tool-call logging (including `read_identity_module`).** Every time Evryn calls a tool, log `{tool: <name>, args: <relevant args>, pathway, scope, timestamp}`. Tiny instrumentation; massive observability win during integration + adversarial testing. **Kept on the list per Justin 2026-05-29 even with the force-load fix below:** if shit is weird, he wants to verify what *actually* loaded, not what was *supposed* to load. Empirical observability beats designed observability.

3. **Slack-Operator cross-thread scope-loading** (the Bug B parallel). Bug B's auto-load fires in user pathways (`processForward`, `processDirect`, cron); the Slack-Operator pathway (`handleGeneralMessage`) has the parallel gap. When in a user-scoped Slack-Operator thread, also load Operator-scoped messages about that user from other threads (excluding current thread to avoid duplication with thread history). Uses the existing `getOperatorScopedMessages(user.id)` helper Bug B already added — same shape, different caller. **Subsumed by item 4 architecturally but kept as a separate logical artifact in case 4 takes longer than expected.**

4. **User/Operator dossier refactor + force-load ALL identity modules + `handleGeneralMessage` → `handleOperatorMessage` rename.** *(The big one — covers Justin's 2026-05-28 v0.2 pragma about force-loading the activity modules, and subsumes item 3's surgery.)* Introduce `loadUserDossier(user_id)` and `loadOperatorDossier()` as composition primitives that every pathway calls. The dossier definitions include **every activity/situation/internal-reference module Evryn might need for v0.2** — so structurally she always has the full toolkit, regardless of whether she'd think to call `read_identity_module`. Eliminates the per-pathway duplication that caused Bug B in the first place. Rename `handleGeneralMessage` → `handleOperatorMessage` in the same trip (the function is Operator-only; the "general" naming misleads readers). Cite: AC + Justin discussion 2026-05-28, captured in the Slack threads referenced above.

5. **Markdown → HTML email rendering.** 2026-05-28: Evryn's draft contained `**bold**` and `-` bullets, which render as literal characters in Gmail recipients' inboxes — janky and unprofessional. `src/email/client.ts` needs a markdown → HTML conversion step before sending (library like `marked` or `markdown-it`, ~5 lines). Send as multipart with both plain and HTML for graceful degradation. **Pre-Mark-live priority — Mark sees this in current state.**

6. **`submit_draft` notification scope-logging.** 2026-05-28 evening: empirical finding — `submit_draft`'s Slack notification doesn't write a `messages` row with `scope_user_id = emailmgr_item.user_id`. Result: when Justin replies in that notification's thread, scope inheritance fails (no parent row in messages to inherit from), and his reply lands as a NEW top-level NULL-scoped message instead of a Mark-scoped reply. **Same shape as Bug A, different code path.** Fix: `submit_draft`'s notification path must log to messages with `scope_user_id` set from the emailmgr_item.

7. **Quiet hours + reminder cadence.** 2026-05-29 morning: empirical finding — after Evryn drafted yesterday (5:10 PT, end-of-test), she pinged Justin every 15 minutes from 6:34 PT through ~7:43 AM next day. Slack DND saved him; would have woken him repeatedly otherwise. **This becomes catastrophic when `#emergency-alerts` ships** (his Slack will be set to break through DND for actual emergencies; pestering pings would wake him for non-emergencies). Two coupled requirements:
   - (a) **Runtime quiet hours** — `notify_slack` and any other ping path hard-suppress between configurable hours (defaults: last ping at 5pm PT, silent 6pm–8am PT, first ping at 8am PT). Only `#emergency-alerts` channel bypasses (real emergencies only — auth failure, loop bug, etc.).
   - (b) **Reminder cadence** — after an initial nudge, reminders go to **1 per hour**, not 1 per 15 minutes. 15-min cadence is wrong in every context.

*(Historical: an earlier proposed item "DRAFT_ITERATION_MODE runtime flag" was withdrawn 2026-05-28 evening as overbuild — ship force-load first, watch whether first drafts are good enough, then decide if a separate iteration-mode is needed.)*

---

## v0.3 deferred questions (new as of 2026-05-29)

Questions and architectural considerations surfaced during the 2026-05-28 → 2026-05-29 test that don't block Mark-live but want to be addressed at v0.3 architecture work.

1. **Pathway voice gap — does universal force-load resolve it on its own?** 2026-05-28: Evryn's response quality on the email pathway (`processDirect` → `submit_draft`) was substantially below her response quality on the Slack-Operator pathway, despite producing both within minutes of each other and (per her own self-report) loading the same activity modules in both. The bad email draft predated an explicit standing-instruction to reload everything fresh; the better Slack draft postdated it. Hypotheses worth investigating without committing to one: timing (load discipline gap that closes under force-load), pathway-context (`processDirect` lacks some structural composition that `handleGeneralMessage` has — e.g., `operator.md` + Operator's profile only load on the Slack-Operator path), `submit_draft` commitment-pressure shaping the voice differently from iteration-pressure, or something else entirely. **Under universal force-load (every pathway gets every module), this question may resolve itself** — the gap closes because everything's loaded everywhere. **First question to ask post-force-load:** does the email-pathway draft come out at Slack-quality on first try? If yes — original question is moot. If no — there's a deeper pathway-context issue worth investigating, and the original question reactivates.

2. **Late-scope recovery's friendlier cousin (proactive scope-question).** 2026-05-28 evening: Justin posted a new top-level Slack message that was substantively about Mark, but the runtime had no way to surface the question "is this Mark-scoped?" — it just landed NULL. When the new top-level message references a recently-active user (mention in body, UUID, etc.), Evryn could proactively surface: *"Looks like this might be about Mark — same as the prior thread you were in. Want me to inherit Mark scope, or is this genuinely meta?"* Quality-of-life vs. catastrophic-recovery flavor of the same family. Not blocking Mark-live but valuable at v0.3 when multi-user threading complexity increases.

3. **Force-load + caching as the v0.3+ identity architecture (ADR-012 amendment candidate).** 2026-05-29: Justin surfaced this from overnight API-log review. The original ADR-012 reasoning for trigger-composed/selective-load identity was about token economy — keep the prompt lean, load only what's needed for each task. **Anthropic prompt caching inverts that calculus:** stability of prefix matters more than size of prefix. Cache reads are ~10% of base cost, cache writes are 25% more (paid once, amortized across hits). A force-loaded identity prefix that's byte-identical across every query and every user becomes cheaper at scale than a per-task selective load that breaks the cache. Empirical observation from 2026-05-28 overnight logs: queries to Evryn are ~90% cached. At v0.3+ multi-user scale, force-load + caching could be **dramatically** cheaper than selective load + cache misses, because the identity prefix is identical across users → every user reinforces the same cache. **Caveats (both negligible at our scale):** cache TTL (~5 min default) means low-volume queries miss the cache and pay cold-call cost (~$0.75 for a 50K prefix at Opus base rates — trivial per call); and every Mira/Soren identity-file commit invalidates the cache for the next call. **Decision to land at v0.3 architecture pass (Soren territory):** amend or supersede ADR-012 to make force-load the standing shape, with prompt caching as the named cost lever. Cognitive-load concern (does Evryn over-apply rules when everything's loaded?) was empirically tested 2026-05-28 — her best work happened when she had everything loaded, not worst. The activity-module-orientation-not-rule framing in identity files protects against bloat-equals-confusion.

---

## Re-test sequencing (post-fix run)

After Mira's + DC's work ships (parallel-able — different files in different directories, no conflict), single Railway redeploy, then re-run the integration test. Goal of re-run: clean verify-and-lock beat firing, observability into what loaded, cross-thread scope-loading working, force-loaded first drafts at Slack-quality, no overnight pestering, scope inheritance via submit_draft.

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
