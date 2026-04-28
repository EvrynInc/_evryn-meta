# Session: 2026-04-28 — Fresh-AC Vetting Pass + ADR-030 + Permission-Over-Compulsion + Pre-Handoff

**Status when this doc was written:** All session work shipped, committed, and ready for hand-off to Mira and DC. This is the #lock for the vetting-AC instance. Fresh AC instance can pick up from this doc + current-state.md.

**Reading order for the fresh AC arriving cold:**
1. CLAUDE.md (auto-loaded)
2. `docs/current-state.md`
3. This session doc
4. ADR-030 (`docs/decisions/030-slack-threads-as-operator-scope.md`) — the architectural move at the heart of today's work
5. `evryn-backend/docs/ac-to-dc.md` — the queued DC bundle (six tasks)
6. `_evryn-meta/docs/sessions/2026-04-28-mira-brief-operator-md-adr030.md` — the queued Mira brief

---

## What happened today

This session was kicked off as a vetting pass on the 2026-04-27 lock work (integration-test pivot + loop bug + research-aware Evryn). It expanded substantially:

1. **Vetting pass (morning)** — fresh-AC review of the prior day's lock work. Verified LEARNINGS 53, ADR-029, AGENT_PATTERNS additions, all 18 fixtures, real-Mark profile claims (against public sources via WebFetch + WebSearch), Mira's identity edits.
   - **Findings fixed inline:** wrong commit hash propagated in 4 places (Mira's web-research work was commits `3771ca8` + `416cd44`, not just `416cd44`); fixture 15 answer-key entry harmonized with metadata header; Mat Cerf profile attributions stripped of unverifiable claims (Yaya Films, "produces The Turn," "Letters from Bristol blog series" — all unconfirmed against public sources).
   - **Findings surfaced for Justin:** DC mailbox Task 3 prompt scope ambiguity (which prompt to modify); Task 1 SDK gotcha (built-in tools may need to be in both `tools` and `allowedTools`); profile claims unverified vs. confirmed (4-time Sundance, Daniel Housberg award, NCIS producer credit all confirmed; Mat Cerf's deeper attributions not).
   - **Confirmed clean:** LEARNINGS 53 against runtime walk; dropped-Task-5 reasoning sound; ADR-029 reasoning sound; all 7 AGENT_PATTERNS additions sound; integration test script + Phase 4 verification anchors all confirmed against public sources.

2. **DC mailbox Task 3 reframe** — Justin pushed back on "give Evryn a no-draft escalation exit" framing. The deeper architectural move is: replace compulsion ("you MUST submit_draft") with permission (here are the tools, use your judgment). Lands as Task 3 rewrite + identity-layer addition for Mira.

3. **Mira spun for `core.md` addition** — three principles: (a) drafting-is-default-for-inbound-not-the-rule, (b) when escalating give the Operator enough to respond from Slack alone, (c) runtime-isn't-infallible failsafe (if frame doesn't fit, pull the right module or ping Operator). Mira shipped at commit `a4d7d2e` ("core.md: compulsion-vs-judgment reframe + drafting/escalation guidance"). This unblocks DC's Task 3.

4. **DC mailbox Task 5 added (UTF-8 cleanliness)** — Justin showed mojibake (`Ã¢Â€Â"` em-dash) in email subjects + Slack-vs-email subject mismatch. Expanded to: subject encoding (RFC 2047), body encoding (Content-Transfer-Encoding), single-source-of-truth approval-reference subject, ASCII-safe separator in approval references, audit pass for other text-pipeline gotchas, evaluate slack.ts sanitization removal. Pre-test prerequisite.

5. **ADR-030 written + iterated** — Slack threads as Operator user-isolation scope + Operator's profile as working-knowledge in Operator pathways. Two coupled architectural moves:
   - **Part A:** `messages.scope_user_id` column + thread-scope determination/inheritance/backfill in `handleGeneralMessage`. Each Slack thread carries one scope (user OR NULL meta); cross-user bleed becomes structurally impossible.
   - **Part B:** Operator's `profile_jsonb` loaded in `handleGeneralMessage` only (NOT in `processForward`/`processDirect`/crons) with `_meta.discipline_notice` for "100% public-safe content only" discipline.
   - Cross-user-bleed recovery patterns codified (mid-thread bleed, wrong-scope recovery — both with redaction agency, Justin confirmation).
   - Audit pathway: v0.2 manual via #sweep, v0.3+ via Reflection (instructed by `_meta.discipline_notice`).
   - **Iteration history matters:** initial draft over-loaded Operator's profile in EVERY pathway (processForward, processDirect, crons too). Justin caught this — partnership-knowledge isn't relevant when Evryn is triaging Mark's email on her own. Corrected to Slack-Operator pathway only.

6. **DC mailbox Task 6 added** — implements ADR-030. Depends on Mira's `operator.md` ship for deploy.

7. **Permission-over-compulsion principle landed** — added to `evryn-backend/docs/ARCHITECTURE.md` Pipeline Design (section right after "One code path, not two") and `evryn-backend/docs/BUILD-EVRYN-MVP.md` Critical Principles.

8. **Mira brief written** for the operator.md updates ADR-030 needs. Five additions (thread-scope awareness, public-safe routing discipline, mid-thread bleed recovery, wrong-scope recovery, NULL-scoped meta territory) + one open call (one-file-two-modes vs. separate `meta-operator.md`).

9. **Sweep protocol updated** — `evryn-team-workspace/shared/protocols/sweep-protocol.md` section 10 gained an Operator-profile public-safe spot-check step.

10. **LEARNINGS 53 clarification** — "implicit" vs. "deliberate" subject-ification distinction. Implicit is barred (the loop-bug pattern); deliberate exceptions with explicit pathway-gating (e.g., ADR-030's Operator pathway) are designed exceptions, not violations.

---

## State at session end (2026-04-28)

**Both agents ready to spin in parallel:**

- **Mira:** brief at `_evryn-meta/docs/sessions/2026-04-28-mira-brief-operator-md-adr030.md`. Reads ADR-030 first then the brief. Five additions to `operator.md`. Open structural call (one file vs. two for meta-operator).
- **DC:** mailbox at `evryn-backend/docs/ac-to-dc.md`. Six tasks (1: WebFetch+WebSearch tools, 2: loop-bug fix, 3: permissive `processDirect` prompt, 4: remove `getRecipient()` redirect, 5: UTF-8 cleanliness across all outbound paths, 6: ADR-030 implementation). Tasks 1-5 deployable as soon as built; Task 6 deploy waits on Mira's `operator.md` ship.

**Deploy pattern (Justin's call):** option (b) — DC builds 1-6 locally, deploys all six together once Mira ships. Cleanest test signal: integration test re-runs against the iterative-Slack architecture, not the single-shot one we're replacing.

**Pre-test items already confirmed by Justin:**
- evryn@evryn.ai inbox is clear ✓
- Railway env still as expected (`SEND_ENABLED=true`, `NODE_ENV=development`, `POLL_INTERVAL_MS=10000`) ✓

**Pre-test items still pending Justin's action:**
- Spin Mira (he was about to do this when he asked for #lock)
- Spin DC (any time after kicking off Mira — they work in parallel)
- After both ship: signal DC to deploy Task 6 alongside 1-5; re-run integration test from Phase 2 (post real-Mark Slack intro from `tests/fixtures/integration-test-script.md`)

**No blockers on the AC side.** All vetting findings either fixed in code/docs or surfaced for Justin's call (and resolved).

---

## What got committed today (chronological)

**`_evryn-meta`:**
- `db5cc60` — vetting fixes + ADR-030 draft (initial)
- `7ae3d55` — ADR-030 revision: clarify context-vs-surfaced, strengthen bleed recovery, sweep-not-lock, Reflection-as-audit
- `0e913ab` — ADR-030 narrow scope: Operator's profile loads in Operator pathways only (not in user pathways)
- `13eb71d` — ADR-030 polish: cut reactive framing and overexplanation
- `95751bf` — LEARNINGS 53 deliberate-vs-implicit clarification + Mira brief for ADR-030
- `496129f` — Mira brief accuracy pass: correct attribution

**`evryn-team-workspace`:**
- `ebe10f4` — sweep-protocol: add Operator-profile public-safe spot-check (ADR-030)

**`evryn-backend`:**
- `1163554` — DC mailbox Task 3 rewrite + Task 5 added; profile fixes (Mat Cerf strip, fixture 15)
- `a4d7d2e` — Mira: core.md compulsion-vs-judgment reframe + drafting/escalation guidance
- `178a651` — ADR-030 wired into sprint + DC mailbox; permission-over-compulsion principle landed
- `d072394` — DC mailbox accuracy pass: Task 3 unblocked, dropped-task naming clarified

---

## What's worth #locking (already done — flagging here for completeness)

**Architectural decisions:**
- ADR-030 (Slack threads as Operator scope + Operator's profile as Operator-pathway working-knowledge) — written, reviewed, committed
- Permission-over-compulsion as architectural principle — landed in ARCHITECTURE.md + BUILD doc

**Identity-layer decisions:**
- Mira's core.md addition (drafting-is-default + escalation-substance + runtime-isn't-infallible) — shipped at `a4d7d2e`
- Mira brief for operator.md ADR-030 work — queued, ready to spin

**Discipline + audit decisions:**
- 100% public-safe discipline for Operator's `profile_jsonb`
- v0.2 manual audit step in #sweep; v0.3+ Reflection-as-audit instructed via `_meta.discipline_notice`
- Cross-user-bleed recovery patterns (mid-thread bleed + wrong-scope recovery)

**LEARNINGS:**
- Item 53 clarified (implicit vs. deliberate subject-ification)
- No new items added today (today's work surfaces principles that promote into ARCHITECTURE.md, not new LEARNINGS entries)

---

## Open considerations carried forward

- **Reflection-self-audit for Operator's profile** is referenced in the `_meta.discipline_notice` but the Reflection module doesn't exist yet (v0.3+). When Reflection lands, it should pick up the discipline_notice instruction without further design work.
- **Dedicated `redact_user_from_message` MCP tool** is in the sprint Backlog. v0.2 can use raw `supabase_upsert` for redaction; the dedicated tool is a quality-of-life upgrade.
- **Compulsion audit pass** is in the sprint Backlog. Driven initially by DC's Task 3 scan results; expand to systematic review across all `runEvrynQuery` prompts and tool descriptions.
- **Mat Cerf detail re-verification** — if Justin (or anyone with primary-source knowledge of Mat) wants to restore the stripped attributions (Yaya Films, Letters from Bristol, produces The Turn), the test profile is the place; verification before restoring.
- **Operator-guide.md update** is queued for after DC ships Task 4 (per ADR-029 doc-sequencing — operator-guide describes what IS, updates after the redirect removal lands).
- **ARCHITECTURE.md Operator Track + System Actors revisions** are queued for after DC ships Task 6 — same doc-sequencing principle.

---

## Recommended first action for fresh AC

If Justin spins a fresh AC after this lock:

1. **Read this doc + current-state.md.** Get oriented on where things stand.
2. **Check mailboxes:** `evryn-backend/docs/dc-to-ac.md` and `dc-architecture-notes-for-ac.md`. Both should still be `READ — absorbed` unless DC has shipped and replied. If DC has replied, absorb the reply per the protocol.
3. **Check whether Mira has shipped operator.md updates** (look for a recent commit on `evryn-backend/identity/situations/operator.md`). If yes, signal DC to deploy Task 6.
4. **If both Mira and DC have shipped:** ready to coordinate the test re-run. Justin posts the real-Mark Slack intro from `tests/fixtures/integration-test-script.md` Phase 2. AC monitors and supports.
5. **If neither has shipped yet:** wait, or work on backlog items (compulsion audit, dedicated redaction tool spec, etc.) until they ping back.

---

— AC (vetting instance, end of session, 2026-04-28)
