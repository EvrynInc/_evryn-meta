# AC0 Handoff — Monday 2026-06-02 (or whenever Justin spins fresh AC0)

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**From:** AC0 (the instance that took the integration test through Phase 4, shipped DC1's Wave 3 dispatch, dispatched Mira + DC3, paused AC1, wrote ADR-034 + ADR-035, ran a full #lock + a worktree dig-out, and closed up shop for the weekend on 2026-05-30 evening at 17:23 PT)
**To:** Fresh AC0 Monday (or whenever Justin returns)
**Date:** 2026-05-30 evening
**Status:** Everything pushed and stable. Weekend battening complete.

---

## TL;DR — where Evryn is right now

**v0.2 integration test:** First run considered done after Phase 4. Phase 5 (triage validation) deliberately deferred to the post-fix re-run — wrestling with Phase 5 against a known-broken Evryn would coaching-corrupt the test.

**Wave 3 / pre-Mark is LIVE on Railway.** Deploy `4e79b834` SUCCESS, commit `05bd1ff`. Seven runtime items + ARCH.md rewrite (force-load dossier + handleOperatorMessage rename + approval mechanism redesign + quiet hours + 3 other items). ADR-034 (force-load) + ADR-035 (approval redesign) capture the architectural decisions.

**Three open branches waiting for review/merge:**
- `mira/2026-05-29-pre-mark-bundle` — Mira's 8-item identity-file bundle. 3 commits. Pushed.
- `soren/build-doc-linear-tickets` — Soren's v0.3 BUILD doc scope addition (Evryn writes Linear tickets about her own runtime). 1 commit. Pushed.
- `dc3/wave3-review` — DC3's independent review of DC1's Wave 3 work. 1 commit on `docs/dc-to-ac.md`. Pushed.

**AC1 PAUSED.** Brief at `_evryn-meta/docs/working/2026-05-29-ac1-brief-silent-failure-audit.md`. Sits until DC1+Mira+DC2 ship + DC3's review clears.

**One DC follow-up trip queued in DC3's mailbox** (`evryn-backend/docs/ac-to-dc.md` on master, "ADDITIONAL FIX" section): quiet-hours queue+replay + cron-time conform `PROACTIVE_CHECK_HOUR_PT=7→8`. Monday work for DC3.

---

## Critical path to Mark-live

1. **AC0 (you) reviews + merges Mira's PR** against master.
2. **AC0 reviews + merges Soren's PR** against master.
3. **AC0 reviews + merges DC3's PR** against master.
4. **DC3 ships the ADDITIONAL FIX** (quiet-hours queue+replay + cron-time conform). New branch off master from `evryn-backend-dc3/` worktree, separate PR.
5. **Justin updates Railway env var** `PROACTIVE_CHECK_HOUR_PT=7→8` when DC3's ADDITIONAL FIX ships.
6. **Justin configures Slack per-channel notification schedules** (his client-side config) — `#evryn-approvals`/`#dev-alerts` follow night schedule; `#emergency-alerts` always notifies.
7. **AC0 unblocks AC1** to run the silent-failure audit against the post-Mira-merge + post-DC3-ADDITIONAL-FIX codebase.
8. **DC2 ships AC1's silent-failure fixes** (separate trip).
9. **Re-run integration test from top through Phase 5.** That's the Mark-live readiness signal.
10. **Pre-Mark-live STEP 0 cleanup** (kill test-Mark UUID + create fresh real-Mark + clear inboxes + visual verify).
11. **Justin sends Mark the go-email.**

---

## Where everything lives

### Repos + worktrees

- `_evryn-meta` — on main. AC's home.
- `evryn-backend` — local working tree at `c:/Users/Justin/Evryn/Code/evryn-backend` is on `mira/2026-05-29-pre-mark-bundle` (Mira's tree).
- `evryn-backend-ac` — AC's worktree at `c:/Users/Justin/Evryn/Code/evryn-backend-ac` on master. **Use this for AC operations in evryn-backend.**
- `evryn-backend-soren` — Soren's worktree at `c:/Users/Justin/Evryn/Code/evryn-backend-soren` on `soren/build-doc-linear-tickets`.
- `evryn-backend-dc3` — DC3's worktree at `c:/Users/Justin/Evryn/Code/evryn-backend-dc3` on `dc3/wave3-review`.
- `evryn-dev-workspace` — on main. DC's home.
- `evryn-team-workspace` — on main. Team's home.

### Today's session docs + briefs

- **The live session doc** (running lists, empirical material, threads to read): `_evryn-meta/docs/sessions/2026-05-28-integration-test.md`. Has the DC list (8 items), Mira pile (8 items), v0.3 deferred questions (3 items including Justin's caching insight).
- **AC1 brief — PAUSED**: `_evryn-meta/docs/working/2026-05-29-ac1-brief-silent-failure-audit.md`. Don't unblock until DC1+Mira+DC2 ship and DC3 review clears.
- **Mira brief**: `_evryn-meta/docs/sessions/2026-05-29-mira-brief-bundle.md`. Already shipped against (her PR open).
- **DC3 review brief + ADDITIONAL FIX**: `evryn-backend/docs/ac-to-dc.md` on master. DC3 has internalized; the ADDITIONAL FIX section is his Monday work.
- **DC1 Wave 3 reply** (his self-report on what shipped): `evryn-backend/docs/dc-to-ac.md` on master. Preserved through the dig-out.
- **DC3 Wave 3 review** (his review of DC1's work): `evryn-backend/docs/dc-to-ac.md` on `dc3/wave3-review` branch. Will land on master when merged.
- **Yesterday's packout** (this session's predecessor — for context only, archived): `_evryn-meta/docs/sessions/historical/2026-05-29-ac0-packout-day2.md`. Carries the persistence-rule nuances + division-of-labor rule + several mid-session disciplines Justin installed.

### ADRs landed this session

- **ADR-034** — Force-load dossier composition (v0.2): `_evryn-meta/docs/decisions/034-force-load-dossier-composition.md`. Four-layer composition, operator.md gated for safety + cache. Amendment relationship to ADR-012; v0.3 architecture pass with Soren (EVR-109) determines final shape.
- **ADR-035** — Approval mechanism redesign: `_evryn-meta/docs/decisions/035-approval-mechanism-redesign.md`. Short-id + strict-match + dual-route + Evryn-voice confirmation + thread-history-in-drafts. Closes the `approval_hint` silent-diversion failure mode.

### CLAUDE.md updates landed this session

- **AC CLAUDE.md** (`_evryn-meta/CLAUDE.md`): Communication Rules — tightened "verify branch before every commit" to "verify branch before every EDIT, not just commit" + surface-to-Justin-on-multi-agent-activity discipline + worktrees-per-agent durable fix with one-line setup command.
- **Team-workspace CLAUDE.md** (`evryn-team-workspace/CLAUDE.md`): Commit discipline — same branch-before-edit + worktrees discipline added, adapted for team agents.
- **DC CLAUDE.md** (`evryn-dev-workspace/CLAUDE.md`): Build Mandate — "AC's spec is a contract; distinguish your domain from his" rule. Driven by DC1 shipping Wave 3 without waiting for Mira despite explicit brief instruction.

### Linear tickets created this session

- **EVR-110** — "Set up git worktrees per agent for shared local repos". R: lucas, A: justin, Backlog (post-Mark). Standing practice for the worktrees fix.

---

## Open decisions waiting for Justin

1. **Approve Mira's PR** when ready. Identity files; AC reviews against the 7-item identity-file-review.md checklist.
2. **Approve Soren's PR** when ready. v0.3 BUILD doc scope addition; light review.
3. **Approve DC3's review PR** when ready. Mailbox content; basic approval.
4. **Decide on DC3's follow-up concerns** (his Concerns 6 + 7 in the review: ARCH.md tree drift + submitDraftForApproval sendEmail-no-retry gap). Both arguably warrant fix trips; Justin's call on routing.
5. **Slack per-channel notification config** (Justin's client-side task — Slack supports per-channel Notification Schedules and DND-override-per-channel; configure `#emergency-alerts` to always notify, others to follow night schedule).
6. **Railway env var update** `PROACTIVE_CHECK_HOUR_PT=7→8` when DC3's ADDITIONAL FIX ships.
7. **Whether to write fresh ADRs for the smaller decisions** that landed this session (the worktrees rule? the cadence-rule nuances?) or absorb into LEARNINGS at next #sweep.

---

## Startup load for fresh AC0

1. **`_evryn-meta/CLAUDE.md`** — auto-loaded. Gained the branch-before-edit + worktrees rule (Communication Rules section) this session.
2. **`_evryn-meta/docs/current-state.md`** — auto-loaded. Reflects end-of-day 2026-05-30.
3. **`_evryn-meta/CHANGELOG.md`** — read today's full entry (2026-05-29 evening) for the narrative arc + this session-end appendage if added.
4. **This packout** — you're reading it.
5. **`_evryn-meta/docs/sessions/2026-05-28-integration-test.md`** — the live session doc. All running lists live here. Read in full.
6. **`evryn-backend/docs/dc-to-ac.md` on master** — DC1's Wave 3 reply. Carries the implementation details + 9 flags for follow-up.
7. **DC3's PR** — once open, the review is the structured per-item report on DC1's work.
8. **ADR-034 + ADR-035** — the architectural decisions implementing today's Wave 3 work.

**Trigger-load only if X:**
- Anything off-pattern → load `_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md` (+ Amendment 2026-05-22) + `031-late-scope-recovery.md`.
- Identity-file-related craft question → load `evryn-backend/identity/core.md` + relevant activity/situation file.
- Quiet-hours fix work (DC3's ADDITIONAL FIX) → load `evryn-backend/src/notify/slack.ts` + `src/email/poll.ts` for cron timing.

---

## What you DON'T need to do first thing Monday

- **You do NOT need to commit anything immediately.** Everything is pushed. The working trees are clean.
- **You do NOT need to dispatch DC2.** AC1 is paused; DC2 doesn't exist yet; that whole chain waits until post-Mira-merge + post-DC3-ADDITIONAL-FIX.
- **You do NOT need to write more ADRs urgently.** ADR-034 + ADR-035 cover today's architecturals.
- **You do NOT need to re-run the integration test until DC3's ADDITIONAL FIX ships + the 3 PRs are merged.** Coaching-corrupted data from this run means a fresh top-to-bottom run is the right re-test, not an attempt to pick up from where Phase 4 stopped.

---

## Humility note + mid-session disciplines this AC0 picked up

Several disciplines landed mid-session that aren't yet in CLAUDE.md (candidates for promotion at next #sweep):

- **Persistence-rule nuances** (in the packout for this AC0 — Day 2): DC/Mira/v0.3 lists update only after Justin says "good to add"; rolling status updates much less often; respond+ping FIRST then write so Justin doesn't sit waiting.
- **Division of labor during live tests**: Justin = eyes on Slack + email; AC = eyes on EVERYTHING else (DB state, Railway logs, tool calls, lifecycle, scope, audit trails). Justin can do in tens of minutes what AC can do in milliseconds — backend-look ownership lives with AC.
- **Worktree-per-agent as the durable shared-tree fix** (now in CLAUDE.md as of 2026-05-29 evening commit).
- **Branch-before-edit, not just before commit** (now in CLAUDE.md).
- **"AC's spec is a contract" rule for DC** (now in DC CLAUDE.md).

**Cooked-context markers from this session worth carrying forward as awareness:**
- DC1's "16:57 → 17:25 (~2h25min)" math error (actual 25 min) — cooked-context signal at end of trip
- Assertion count mismatch in DC1's commit message (15) vs reply (16) — same signal
- AC0 telling Justin the original DC1 brief was recoverable from git when actually it was never committed (had to reconstruct inline in DC3's brief)
- AC0 forgetting to verify branch before editing in evryn-backend (the bug the CLAUDE.md rule update closes)

These don't go anywhere durable as their own learnings — they're examples that demonstrate the rules we already absorbed.

---

## Final coordination notes

- **Ping `#team-alerts` every response** if Justin's running multiple instances (standing discipline this session). `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env` via Node fetch.
- **Slack pings = attention taps, not the message.** Substance in chat; ping is the "come back here" signal.
- **Per-agent worktree rollout is queued** as EVR-110 for Lucas post-Mark. Ad-hoc worktree setup is fair game any time it would dig out a collision.
- **No more chat-only ephemeral content** as of this session. Everything is on remote.

---

— AC0, 2026-05-30 evening (post-#lock, post-dig-out, post-handoff-prep)

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
