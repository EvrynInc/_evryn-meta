# Session: 2026-04-29 — v0.2 Deploy + DC Absorption + ARCHITECTURE.md Updates — Handoff for Fresh AC

**Status when this doc was written:** v0.2 deploy is functionally complete and verified end-to-end. DC's reply is fully absorbed. ADR-030 + ADR-031 mechanics are landed in code (DC) and identity layer (Mira pass for ADR-030 done; Mira pass for ADR-031 queued via brief). ARCHITECTURE.md just received substantial revisions (five sections) and **needs fresh-AC review pass** — see the dedicated section below. Justin and DC are running through the integration test now (Phase 2 onwards); fresh AC will pick up in support after the test settles.

**This is a handoff for a fresh AC instance**, not a #lock. Outgoing AC's context got heavy across the deploy + absorption pass; Justin made the deliberate call to spin a fresh instance for integration test support rather than risk muddiness mid-test.

---

## Load list for the fresh AC arriving cold

### Tier 1 — Auto-loaded (no action needed)

- `_evryn-meta/CLAUDE.md` — your operating manual. Note: the Slack section was updated 2026-04-29 — em-dash advice is corrected (Slack handles UTF-8 cleanly; the earlier `?` rendering was a Windows curl/bash transport artifact, not Slack's renderer). New Railway CLI section was added: `railway whoami`, `railway status`, `railway logs --deployment`, `railway logs --build`, `railway deployment list --json`. Status.railway.com is the right first stop for queued/failed deploys (a Railway Image Registry incident bit DC during the 2026-04-29 deploy, queued auto-deploy behind the incident).

### Tier 2 — Orientation (read first, in order)

- `_evryn-meta/docs/hub/roadmap.md` — the Hub. Company truth. Read every session.
- `_evryn-meta/docs/current-state.md` — current snapshot across all repos. Refreshed in this session's commit; treat as authoritative.
- This session doc (you're reading it) — the AC-side state of today's work.
- `evryn-backend/docs/dc-to-ac.md` — DC's deploy reply. Currently `READ — absorbed` (this AC absorbed it before clearing). Detail still recoverable via git log if you want it; the absorption routed three architecture findings to ADR-031 + the Mira brief + the v0.3 multi-party doc, plus four LEARNINGS to AGENT_PATTERNS.

### Tier 3 — Architecture (read the sections that just changed)

- `evryn-backend/docs/ARCHITECTURE.md` — **five sections were revised today (2026-04-29)** — see the dedicated section below for the review pass you need to run. Don't skip this.

### Tier 4 — Today's architectural decisions

- `_evryn-meta/docs/decisions/031-late-scope-recovery.md` — extends ADR-030 with the third recovery pattern. **Critical** if anything in the integration test surfaces late-scope behavior.
- `_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md` — original; ADR-031 extends this.
- `_evryn-meta/docs/decisions/029-remove-getrecipient-redirect.md` — implemented today (the redirect is gone; SEND_ENABLED is the kill switch; approval gate is structural).

### Tier 5 — Build + sprint context

- `evryn-backend/docs/BUILD-EVRYN-MVP.md` — Phase 0 + Phase 1 status table caught up to reality today (commit `a53be96`); v0.3 Staging table has a new proposal #07 (multi-party orchestration); Critical Principles still has Permission-Not-Compulsion. The "Built-in tools require dual listing" gotcha is in the SDK Architecture section.
- `evryn-backend/docs/SPRINT-MARK-LIVE.md` — sprint state. Day 6 rows for the deploy bundle are now DONE. Backlog has six new items today: late-scope recovery, name-search semantics + stub-record legibility, em-dash sanitizer (resolved as DONE), deep text-encoding audit, **emergency-alerts wiring (Mark-live blocker — read this first)**, EVRYN_USER_ID centralization deferral, adversarial test real-Mark refresh.
- `evryn-backend/docs/operator-guide.md` — updated today for ADR-029 (redirect removal) + ADR-030 (thread-scope cheat sheet + recovery patterns). Approval format examples now use pipe separator.

### Tier 6 — Identity layer

- `evryn-backend/identity/situations/operator.md` — Mira's 2026-04-29 pass for ADR-030 (commits `7721972` + `0fd4181`) is in. **Mira's NEXT pass for ADR-031 is queued via brief at `_evryn-meta/docs/sessions/2026-04-29-mira-brief-operator-md-late-scope.md`** — Justin is passing the brief to Mira (per his note). When Mira ships, no AC follow-up is required other than confirming the file was updated.
- `evryn-backend/identity/core.md` — Mira's earlier 2026-04-28 pass (commit `a4d7d2e`) for permission-over-compulsion is in. Stable.
- Other identity files (gatekeeper.md, gatekeeper-onboarding.md, triage.md, onboarding.md) — not touched today.

### Tier 7 — Runtime files (skim if needed; DC verified end-to-end)

DC's three commits cover the deploy bundle: `6316126` (six tasks + AC's pre-deploy notify_slack fix), `e4d0cec` (WebFetch/WebSearch tools[] dual-list fix), `4d8b214` (em-dash sanitizers removed), `ccb3048` (Slack `say()` thread_ts fix), `96b4125` (CHANGELOG + SPRINT updates). All verified in smoke-test. Also `bd7fda8` and `a90a946` from DC's later trip.

### Tier 8 — Pull only if needed

- `_evryn-meta/AGENT_PATTERNS.md` — has new "SDK Integration & Tool Wiring" section (three patterns) + Stub-Shaped Records pattern in Memory & Context. Surfaces today's SDK lessons.
- `_evryn-meta/LEARNINGS.md` — items 47-50, 55-58 are now stubs (promoted to AGENT_PATTERNS / CLAUDE.md). Items 51-54 stay in Unpromoted.
- `evryn-team-workspace/shared/projects/product/research/v03-design/2026.04.29 07-multi-party-orchestration.md` — discovery note for v0.3 web matching design.

---

## ARCHITECTURE.md review pass — needs your eyes

Five sections were revised today. The outgoing AC had heavy context from the deploy + absorption pass; spinning you fresh is the deliberate move so you can review with cleaner context. Read each updated section critically, looking for:

- Anything that reads as load-bearing but isn't actually true post-deploy (the runtime is the source of truth; DC's reply has the empirical evidence).
- Tone drift — the existing prose has a particular voice; the updates were written in voice but a fresh read can catch where it slipped.
- Coverage gaps — anything ADR-030 or ADR-031 covers that didn't make it into the architecture doc.
- Any place where the "(Updated 2026-04-29 per ADR-030 + ADR-031)" callouts read as defensive rather than informative.

The five sections (find each via the "Updated 2026-04-29" callout):

1. **Operator Track** (~line 114) — most substantial rewrite. "Slack Operator is single-shot by design" is gone; thread-scoped semantics replace it. Verify-and-lock beat documented; three recovery patterns named (with cross-ref to ADR-031 for late-scope); Operator's profile as working-knowledge documented with the deliberate-exception framing. CC sessions repositioned as fallback for heavyweight work.

2. **System Actors** (~line 132) — stated the durable principle ("system actors are FK anchors and senders, never *implicit* subjects of user-scoped operations") with cross-ref to LEARNINGS 53. Added "Deliberate exceptions are different" paragraph. Added the Operator-profile exception with the call-site verification language from DC's reply ("only `handleGeneralMessage` passes the third operatorProfile argument"). Closed with the "One-of carve-out — does not generalize" paragraph (lifted from ADR-030's same content) so future readers don't generalize the Operator carve-out into multi-user loading.

3. **v0.3 Operator Interface** (~line 140) — updated note: ADR-030 delivers this early on Slack. The four original requirements (per-user persistence, searchability, separation, custom build) are walked through point-by-point with what's now delivered. The "custom build" branch is explicitly no longer the planned path.

4. **Meta-Operator** (~line 153) — updated note: NULL-scoped Slack threads deliver this in v0.2's runtime. The three architectural requirements + three-layer separation are walked through with what's structurally enforced. Cross-thread continuity via `getRecentMetaMessages` documented.

5. **Identity Composition** (~line 657) — rewrote the "Composition per query" pseudocode to show three pathway branches (User Pathways, Slack-Operator Pathway with full thread-scope flow, Cron Pathways). Updated the "Trigger composes" line. Updated the Prompt caching optimization block to reflect Operator profile + discipline_notice loading rule.

**If you find issues:** edit directly (don't propose; just edit, this is your handoff turn). If you find gaps that need new sections, write them. If anything reads wrong-rooted (the kind of thing that would mislead a future reader), fix the rooting. Recall: the earlier "Slack Operator is single-shot by design" framing was wrong-rooted in roughly the same way after ADR-030 — keep an eye out for similar drift.

---

## What happened today (chronological)

**Morning:**

- Justin spun fresh AC (this AC's session start). Justin asked AC to load per the load list in `_evryn-meta/docs/sessions/2026-04-28-vetting-pass-and-adr-030.md`.
- AC walked the load list (Tier 2-9), absorbed DC's prior reply, verified Mira's `operator.md` ADR-030 ship.
- AC verified the DB state pre-deploy (3 users, 0 emailmgr_items, **8 stale messages** from Justin's overnight Slack chats with Evryn). Wiped messages; verified plastic-wrap clean (3 users, 0 items, 0 messages).
- AC updated `evryn-backend/tests/fixtures/integration-test-script.md` Phase 2 with thread-scope additions (top-level message preamble, verify-and-lock beat as "Expect", in-thread continuation note).
- AC updated `evryn-backend/docs/operator-guide.md` for ADR-029 (redirect removed; three remaining safety layers documented) + ADR-030 (thread-scope cheat sheet, recovery patterns). Approval format examples switched to pipe separator (per Task 5).
- Committed and pushed `13838ba`.

**Mid-morning to early afternoon — DC's deploy trip (DC commits in `evryn-backend`):**

- `6316126` — v0.2 deploy bundle: six tasks + AC's pre-deploy `notify_slack` fix; backups taken pre/post migration.
- `4d8b214` — em-dash sanitizers removed from `notifyDev` + `notifySlack`.
- `e4d0cec` — `tools: ["WebFetch", "WebSearch"]` dual-list fix (WebFetch silently failed when listed only in `allowedTools`).
- `ccb3048` — Slack `say()` `thread_ts` orphan fix (responses were orphaning out of parent threads, breaking ADR-030 scope inheritance in the Slack UI).
- `96b4125` — CHANGELOG + SPRINT status updates for today's deploy.
- `a90a946` — operator.md scrub of real-user identifying info from examples.
- `bd7fda8` — SPRINT backlog: late-scope recovery + stub-record legibility (the two findings DC surfaced during smoke-test).
- DC also updated `_evryn-meta/CLAUDE.md` twice: `d197d7b` (Railway CLI access) + `9f73a1d` (em-dash advice corrected — was wrong-rooted as Slack rendering issue; actually a Windows-curl transport artifact).

**Afternoon — Lucas handoff absorption:**

- Lucas surfaced four items from Soren's verification (`evryn-team-workspace/shared/projects/helm/2026.04.29-ac-handoff-post-soren-verification.md` — Lucas may move to historical now).
- AC absorbed: BUILD doc ADR-027 alignment (lines 86-87, 116, 132, 149, 274, 276, 458, 491); Phase 0 + Phase 1 status table catch-up; adversarial-test-v02.md line 15 fix; EVRYN_USER_ID centralization deferral documented; emergency-alerts wiring flagged as Mark-live blocker (sprint backlog). Schema-reference re-pull (commit `72d7388`) closed EVR-60.
- Commit `a53be96` for the BUILD/sprint/adversarial-test trio.

**Late afternoon — DC reply absorption + ARCHITECTURE.md revisions:**

- DC's full reply at `evryn-backend/docs/dc-to-ac.md` absorbed (multi-pass, since DC added cross-references mid-read). Three architecture findings + four LEARNINGS distillations.
- ADR-031 written (late-scope recovery as third ADR-030 recovery pattern, extending the original ADR).
- Mira brief written at `_evryn-meta/docs/sessions/2026-04-29-mira-brief-operator-md-late-scope.md` for the operator.md pass (reframe scope as ongoing not one-shot + add late-scope recovery beat).
- Multi-party orchestration v0.3 discovery note written at `evryn-team-workspace/shared/projects/product/research/v03-design/2026.04.29 07-multi-party-orchestration.md`. Breadcrumbed in BUILD doc v0.3 Staging table.
- AGENT_PATTERNS got three additions: Stub-Shaped Records (Memory & Context); new "SDK Integration & Tool Wiring" section with three patterns (dual-list `tools[]` + `allowedTools[]`, library defaults don't enforce architectural invariants, validate transport before blaming renderer).
- LEARNINGS items 46-50 + 55-58 promoted to stubs; long entries removed from Unpromoted.
- BUILD-EVRYN-MVP.md gained a "Built-in tools require dual listing" gotcha note in the SDK Architecture section.
- ARCHITECTURE.md revisions across five sections (described above).
- `dc-to-ac.md` and `dc-architecture-notes-for-ac.md` cleared to `READ — absorbed`.

---

## State at session end (2026-04-29)

**Deploy state:** v0.2 deployed and verified end-to-end. DB had been at smoke-test state when the integration test started; Justin and DC are working through Phase 2 (Slack intro + Naia gold email forward + onboarding multi-turn). The post-smoke-test re-wipe boundary that was originally planned didn't happen — they went straight from smoke-test into Phase 2. That's a deliberate Justin call.

**Mira state:** ADR-030 pass shipped (commits `7721972` + `0fd4181`). ADR-031 brief queued — Justin is passing it to her per his note. When she ships, the late-scope recovery pattern is named in the identity layer + DC's `rescope_messages` MCP tool (sprint backlog) is decoupled and can land separately.

**DC state:** sprint backlog has the next round of work queued: emergency-alerts wiring (Mark-live blocker), `rescope_messages` MCP tool (ADR-031 tooling), `find_user_by_name` + stub-record legibility, dedicated `redact_user_from_message` (from ADR-030 Open considerations). None blocking the integration test; emergency-alerts is blocking Mark-live.

**Pre-Mark-live blockers:**
- Emergency-alerts wiring (sprint backlog has the design + wiring entry — small DC trip + design pass for trigger conditions)
- Integration test passes (in flight)
- Adversarial test passes (deferred until integration test settles; doc needs real-Mark refresh per backlog)
- Pre-Go-Live cleanup (operator-guide STEP 0 — kill test-Mark UUID, create fresh real-Mark record, clear inboxes, visual verification)

**Pre-test items already handled:**
- DB plastic-wrap clean before deploy ✓
- Schema-reference re-pull (EVR-60 closed) ✓
- Lucas handoff absorbed ✓
- ARCHITECTURE.md ADR-030 + ADR-031 absorption ✓ (review pass needed)

**Active mailboxes:**
- `evryn-backend/docs/ac-to-dc.md` — DC's deploy go-signal mailbox from yesterday. DC has acted on it; should be cleared to `READ — absorbed` (DC's territory; Justin asked the question, AC confirmed the protocol expects the reader to clear).
- `evryn-backend/docs/dc-to-ac.md` — `READ — absorbed` (this AC cleared after full absorption).
- `evryn-backend/docs/dc-architecture-notes-for-ac.md` — `READ — absorbed`.

---

## What got committed today (chronological, evryn-backend unless noted)

- `13838ba` (evryn-backend) — operator-guide + integration-test-script: ADR-029 + ADR-030 absorption (AC pre-deploy)
- `6316126` (evryn-backend) — v0.2 deploy bundle (DC)
- `4d8b214` (evryn-backend) — em-dash sanitizers removed (DC)
- `e4d0cec` (evryn-backend) — `tools[]` dual-list fix (DC)
- `ccb3048` (evryn-backend) — Slack `say()` `thread_ts` fix (DC)
- `96b4125` (evryn-backend) — CHANGELOG + SPRINT status (DC)
- `a90a946` (evryn-backend) — operator.md identifying-info scrub (DC)
- `bd7fda8` (evryn-backend) — SPRINT backlog adds (DC)
- `d197d7b` (_evryn-meta) — CLAUDE.md Railway CLI section (DC, AC's house)
- `9f73a1d` (_evryn-meta) — CLAUDE.md em-dash advice corrected (DC, AC's house)
- `a53be96` (evryn-backend) — Lucas handoff absorption (AC)
- `72d7388` (evryn-backend) — schema-reference re-pull (AC, EVR-60 close)
- **PENDING COMMIT:** ADR-031 + Mira brief + AGENT_PATTERNS + LEARNINGS stubs + BUILD doc SDK gotcha + multi-party v0.3 doc + dc-to-ac/dc-architecture-notes cleared + ARCHITECTURE.md revisions. About to land as three commits across `_evryn-meta`, `evryn-backend`, `evryn-team-workspace`.

---

## Open considerations carried forward

- **Operator-profile content discipline at scale.** ADR-030 declares 100% public-safe; the `_meta.discipline_notice` loads above the story every time the Slack-Operator pathway fires; v0.2 audit happens manually in `#sweep`; v0.3+ Reflection picks up the audit instruction. The DC tooling (`rescope_messages`, `find_user_by_name`) helps on the operational side but doesn't enforce content discipline at write time. Worth thinking about whether `append_pending_note(target_user_id=<operator_uuid>)` should structurally check the public-safe constraint at the RPC level rather than relying on identity-layer instruction.

- **Cross-thread retrospective UX for Operator.** Once threads accumulate, the Operator may want a "show me my recent Mark threads" affordance. Currently this is an ad-hoc `supabase_read` Evryn runs. Worth speccing in a small backlog entry if the workflow gets clunky during real use.

- **Stub-record legibility tooling.** Three escalating manifestations during smoke-test (over-narrow filter / multi-column rendering / stub-record disbelief). Sprint backlog has the entry; DC's `find_user_by_name` MCP tool with `is_stub` flag is the structural fix.

- **ARCHITECTURE.md sections beyond what was revised today.** The five sections this AC touched (Operator Track, System Actors, v0.3 Operator Interface, Meta-Operator, Identity Composition) are the load-bearing ones for ADR-030/031. Other sections (Pipeline Design, Memory Architecture, Data Model around messages.scope_user_id) may have stale references — fresh AC should grep for "single-shot" or "operator session" or other pre-ADR-030 vocabulary during the review pass and catch any stragglers.

- **Sprint backlog growth.** Today the backlog grew by ~6 entries. Most are well-scoped. Review whether any of them should be promoted to active work before the integration test re-runs at higher tempo.

- **Lucas handoff archival.** Justin said "can he move his handoff to historical?" — yes; AC confirmed in note to Lucas that all four items addressed. Lucas can archive at his discretion.

- **DC mailbox `ac-to-dc.md` clearing.** Justin asked — yes, DC can clear `ac-to-dc.md` to `READ — absorbed` since he's acted on the deploy go-signal. This is in DC's territory; AC doesn't clear it.

---

## Recommended first action for fresh AC

1. **Read this doc + current-state.md.** Get oriented.
2. **Check the integration test state.** Are Justin and DC still in flight, or wrapping? If still in flight, support; if wrapping, handle the post-test cleanup (DB re-wipe to plastic-wrap if Phase 4 verification calls for it; recreate Mark fresh per Pre-Go-Live STEP 0 if going live, or reset profile if continuing testing).
3. **Run the ARCHITECTURE.md review pass** described in the dedicated section above. Edit directly where you find issues. Section 5 (Identity Composition) is the trickiest because the pseudocode is dense — stress-test it against `src/notify/slack.ts` and `src/triage/classify.ts` to make sure the runtime matches the description.
4. **Mira pass for operator.md (ADR-031) — Justin is handing the brief over.** When Mira ships, no AC follow-up is required other than verifying operator.md was updated in the expected places.
5. **Emergency-alerts wiring.** This is a Mark-live blocker per the BUILD doc Phase 0e flag I just landed. The two-stage design is in sprint backlog; the next AC + DC + Justin conversation that pushes toward Mark-live should pull this forward.
6. **Re-run pre-Mark-live: integration test final pass + adversarial test (Rachel→Mark refresh required) + Pre-Go-Live STEP 0 + emergency-alerts wiring.** Then go/no-go.

---

— AC (deploy + absorption instance, end of session, 2026-04-29)
