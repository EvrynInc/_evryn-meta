# AC → Mira Brief Bundle — Pre-Mark Trip

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

**From:** AC0, 2026-05-29 evening
**To:** Mira, pre-Mark identity-file trip
**Re:** 8-item identity-file bundle. Companion-ships with DC1's parallel runtime trip. Single Railway redeploy.

---

## Why this is the pre-Mark trip

The v0.2 integration test ran 2026-05-28 → 29 (Phase 1 through Phase 4). It surfaced rich empirical material on Evryn's identity craft — both what's working (cross-instance memory through pending_notes, discretion-floor language, hallucination-and-correction discipline, criteria capture from Mark's reply was gold-standard) and what's NOT (introspection gap on what's loaded, performing forward motion, "Should also cover" reading-as-soft-suggestion, gatekeeper-onboarding ending the conversation before edge cases or logistics fire, research going broad but missing inside details).

Mark is queued to go live as soon as DC1's runtime work + your identity work + (later) DC2's silent-failure fixes all ship. **This is your pre-Mark trip — 8 items to land before Justin sends Mark his real first-touch email.**

---

## Required reading — empirical material first

Before touching identity files:

1. **`_evryn-meta/docs/sessions/2026-05-28-integration-test.md`** — the live session doc. Read the **"Mira pile"** section in full. **8 items detailed there.** Also read "Status (rolling)" + "Required reading before Mira's trip" sections. This brief is the dispatch envelope; the session doc carries the substance.

2. **The two Slack threads** (the empirical material that drove the pile additions — read end-to-end before drafting any edits). Query:

   ```sql
   SELECT created_at, sender_id, source, message_body
   FROM messages
   WHERE thread_id IN ('1779997809.975439', '1780009886.535399')
      OR (created_at::date >= '2026-05-28' AND source = 'email')
   ORDER BY created_at;
   ```

   - Thread `1779997809.975439` — Mark-scoped, Day 1 verify-and-lock + research + first email iteration
   - Thread `1780009886.535399` — was NULL-scoped (now backfilled to Mark), Day 2 standing-instruction + better re-draft + most of the load-discipline empirical material

3. **`evryn-backend/identity/`** — the current state of every file you'll be editing. operator.md, gatekeeper-onboarding.md, onboarding.md, possibly core.md and feedback-guidance.md.

4. **`evryn-backend/docs/identity-writing-bible.md`** — your craft reference. Note: the three new Structural Principles you added 2026-05-29 (Score and Direction Across Boundaries, Presence vs Performance Register Check, Clear-Over-Pretty Applied to Evryn's Output) are marked "developmental — pending force-load verification." Don't treat them as settled craft until the post-fix integration test re-runs. (Load-discipline reframe — failure modes happened under degraded load, not because of identity bugs.)

5. **`evryn-team-workspace/shared/protocols/identity-file-review.md`** — the branch + PR + reviewer + checklist protocol. AC0 is your default reviewer.

6. **Identity-file PHASE 4 verification snapshot** (helpful context for item #7): Today's test produced 5 high-quality pending_notes on Mark, but AK notes 9 (edge cases) + 10 (personal depth) are missing because Evryn never ran Blocks D or F of the integration-test-script. AK note 2-6 (research) are partial — covered the trunk but missed F/V Ava Jane, Mat Cerf, four-time Sundance vet, specific chefs (Tom Douglas, Taichi Kitamura), specific restaurants (Salish Lodge, Sankai), and named conservation orgs (NRDC, Audubon Alaska). The inside-details miss is exactly what item #8 addresses.

---

## The 8 items (full text in session doc — summaries here for orientation)

1. **Verification-block-always discipline** — `operator.md`. Tighten so the explicit verify-and-lock beat fires 100% of the time, not as anchor-via-URL implicit confirmation.

2. **Tighten meta-note-from-scoped-thread mechanic** — `operator.md`. Make the `append_pending_note(target_user_id=operator)` mechanic explicit, not just the principle.

3. **Activity-module forward-load beat** — `onboarding.md` (Lifecycle: likely moot under DC1's force-load. Mark as transitional with a note that v0.3 architecture pass will determine whether selective loading returns. See v0.3 deferred question #3 in session doc.)

4. **Tighten gatekeeper-onboarding.md so the first-touch landing is unambiguous** — `gatekeeper-onboarding.md`. **Open question for you: should we just script this?** The trust-arc-scripts.md pattern is the model — exact words, intentional sequence, deviation only for situational responsiveness. A scripted first-touch (Mark / Eva / etc. — gatekeeper variants) might solve the muddled-landing problem more reliably than tighter guidance. Your craft call.

5. **Rescope-naming discipline** — `operator.md` (or extension). When Evryn rescopes a thread mid-flight, she must announce it. Today's empirical: Justin told her to scope thread `1780009886.535399` to Mark; she did it (set_thread_scope + in-thread backfill worked), but her response didn't NAME the rescope. Justin had zero visibility until AC0 verified via DB query. Per Justin: light identifiers — full name, an obvious piece of bio context (e.g., "August Island Pictures"), and the UUID. **Open question for you: does the existing verify-and-lock beat in `operator.md` already cover the Operator-initiated mid-thread rescope case (and Evryn just skipped it), or does the beat need extending?** Either way: invisible state in a verification-sensitive flow is the failure to close.

6. **Parse "don't X" instructions separately from any implied "do Y"** — placement TBD. The wrong-instruction-blindness pattern. Evryn caught this herself in her 20:45 self-note on 5/29; the discipline needs to live somewhere structural. Your craft call: `operator.md`? `feedback-guidance.md`? `core.md` "What You Can Draw On"?

7. **Compare gatekeeper-onboarding.md ↔ integration-test-script.md ↔ how-we-actually-want-Evryn-to-guide-the-interaction (three-way)** — `gatekeeper-onboarding.md` + possibly `tests/fixtures/integration-test-script.md`. Today's gap: Evryn ran Blocks A-C cleanly but didn't elicit D (edge cases) or F (logistics) or G (personal depth). Two possible diagnoses (likely both): module under-specs the load OR script over-specs the expected conversation. **Your three-way comparison + lands the fix wherever the gap is.** Couples with item #4 (tighten first-touch) — same module, end-to-end care.

8. **Land the existing "follow your curiosity" affordance (activation, not new work)** — `onboarding.md` "Look Them Up" pattern. Backlog item from 2026-04-30 (`SPRINT-MARK-LIVE.md` ~line 553); today's Phase 4 verification is in-the-wild empirical evidence. Add a beat naming curiosity-led hunting as part of the craft — same discipline (humility, ask-rather-than-state, transparent provenance) — going deeper when something pulls at her. Justin's 2026-04-30 framing: *"if you surface something in research that intrigues you, feel free to hunt it down."*

---

## Coordination with DC1

DC1 ships in parallel:
- **Force-load of ALL identity modules structurally** (the headline) — every activity/situation/internal-reference module loads in Evryn's prompt automatically, every pathway. Your file edits land in her prompt without DC needing to know about them.
- **`handleGeneralMessage` → `handleOperatorMessage` rename** — doesn't affect identity files.
- **Approval mechanism redesign + thread history in drafts** — affects the `submit_draft` tool description and the review@evryn.ai email composition. If any of your identity edits touch the submit_draft tool description or how Evryn frames the approval flow, coordinate with AC0.
- **Quiet hours + reminder cadence, markdown→HTML rendering, submit_draft scope-logging, MCP tool-call logging, cron heartbeat** — runtime-only, don't affect identity files.

**Key composition note (from DC1's brief):** `operator.md` will be loaded ONLY in Operator-audience pathways (Slack-Operator + cron + handleRevisionNotes), NOT in user pathways. So content you put in `operator.md` is safe from leaking into user-facing output. Other modules (core.md, all activities, all situations-except-operator, all internal-reference, trust-arc-scripts.md) load EVERYWHERE under force-load — write knowing they're always-on, every pathway, every user.

You and DC are cleanly parallel. No sequential dependency. AC0 reviews your PR + merges before DC builds against the merged state. Single Railway redeploy at the end of both trips.

---

## Process

1. **Branch from master:** `mira/2026-05-29-pre-mark-bundle` (or your preferred slug).
2. **Iterate per the identity-file-review.md protocol.** PR opened against master, AC0 reviews against the 7-item checklist (+ tier check per ADR-033), AC0 merges.
3. **Use the tier-inflation guardrail as your default** (ADR-033 amendment): new rules default to tier 2-3 + lifecycle transitional; escalations require explicit justification. Tier-4 ("must"/"not optional") and tier-5 ("never"/"cannot") need rationale per new rule.
4. **Voice anchoring (ongoing):** continue treating `trust-arc-scripts.md` and the new Structural Principles in `identity-writing-bible.md` as your craft reference. Watch for items #5 (rescope-naming) and #6 (parse don't-X) which are good test cases for the Clear-Over-Pretty principle.
5. **Ping `#team-alerts`** at each turn (you know the pattern — your `SLACK_TEAM_WEBHOOK_URL` + Node fetch).

---

## Deliverable

PR against master with:
- All 8 items addressed (or you flag and skip with reasoning — your craft call, but document in PR description)
- Companion deltas to `tests/fixtures/integration-test-script.md` if your work on item #7 lands there (your call on whether to ship script edits in the same PR or a separate one)
- PR description naming: which items landed, which open questions you closed (e.g., should we script first-touch — yes/no/your direction), which deferred to your next trip with rationale
- Tier annotations per ADR-033 for any new rule-language

AC0 reviews against the identity-file 7-item checklist + tier check + the three-way comparison (item #7) + the rescope-naming question (item #5).

---

## When you're done

- AC0 merges your PR
- AC0 pings DC1 to build against the merged state (if DC1 not already done)
- Single Railway redeploy ships both trips
- AC0 verifies via smoke + a planned post-fix integration-test re-run from top, straight through Phase 5

---

— AC0, 2026-05-29 evening

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
