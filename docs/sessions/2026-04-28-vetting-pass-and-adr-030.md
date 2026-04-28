# Session: 2026-04-28 — Fresh-AC Vetting Pass + ADR-030 + Permission-Over-Compulsion + Pre-Handoff

**Status when this doc was written:** All session work shipped, committed, and ready for hand-off to Mira and DC. This is the #lock for the vetting-AC instance. Fresh AC instance can pick up from this doc + current-state.md.

## Load list for the fresh AC arriving cold

You're stepping in to absorb DC's reply on the 6-task bundle, judge the compulsion candidates DC surfaced, possibly signal deploy on Task 6 (which depends on Mira's `operator.md` ship status), and possibly support the integration-test re-run. Below is what to load. **Err on the side of overshooting on ARCHITECTURE.md** — instances who've skimped on it tend to make mistakes; the structural understanding it provides is load-bearing for almost every judgment call you'll face.

### Tier 1 — Auto-loaded (no action needed)

- `_evryn-meta/CLAUDE.md` — your operating manual

### Tier 2 — Orientation (read first, in order)

- `_evryn-meta/docs/hub/roadmap.md` — the Hub. Company truth. Read every session, every time.
- `_evryn-meta/docs/hub/technical-vision.md` — the tech north star. The next-layer-down from the Hub on architecture, lensed for "what is the system?"
- `_evryn-meta/docs/current-state.md` — current snapshot of what's happening across all repos.
- This session doc (you're reading it) — what landed today and where things stand.
- `_evryn-meta/docs/sessions/2026-04-27-integration-test-pivot-and-loop-bug.md` — yesterday's session. Provides the prior-day context for the loop bug, the real-Mark pivot, and the original muddiness that triggered today's vetting.

### Tier 3 — Architecture (read the full file — Justin's instruction)

- `evryn-backend/docs/ARCHITECTURE.md` — **read it end-to-end.** The structure matters; instances who skim mistake what's a deliberate decision vs. what's open. If you're truly time-pressed, the sections most load-bearing for today's task are: User Model (Operator Track + System Actors), Data Model (profile_jsonb + emailmgr_items lifecycle), Pipeline Design (One code path + Permission-not-compulsion — the new principle that landed today), Agent Architecture (Identity Composition + Module Architecture). But default: read it all. The Onboarding Patterns and System Diagram sections are the lowest-cost-to-skim if you must.

### Tier 4 — Today's architectural decisions

- `_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md` — the architectural move at the heart of today's work. DC's Task 6 implements this. **Critical** for verifying Task 6's reply.
- `_evryn-meta/docs/decisions/029-remove-getrecipient-redirect.md` — the prior-day decision DC's Task 4 implements. Critical for verifying Task 4's reply.
- `_evryn-meta/docs/decisions/027-profile-architecture-simplification.md` — the profile schema decision Task 6 builds on (`_meta`, `pending_notes`, `story`). Important context for the Operator profile initialization in Task 6.

### Tier 5 — Build + sprint context

- `evryn-backend/docs/BUILD-EVRYN-MVP.md` — what we're building, phase by phase. Critical Principles section now includes Permission-Not-Compulsion (today's addition).
- `evryn-backend/docs/SPRINT-MARK-LIVE.md` — sprint state. Day 6 row covers today's queued work; Backlog covers what's deferred.

### Tier 6 — The DC handoff (the immediate task)

- `evryn-backend/docs/ac-to-dc.md` — the original 6-task spec. Read top-to-bottom.
- `evryn-backend/docs/dc-to-ac.md` — DC's reply. **Your immediate task is absorbing this**: verify each task confirmation against the spec, judge the compulsion candidates DC surfaced (item f), evaluate the audit candidates from Task 5 (item g), confirm Task 6 implementation (item h).
- `evryn-backend/docs/dc-architecture-notes-for-ac.md` — DC's longer-form architectural notes if any (often empty).

### Tier 7 — Identity layer

- `evryn-backend/identity/core.md` — Evryn's core identity. Mira's recent addition (commit `a4d7d2e`) is in "What You Can Draw On" — drafting-is-default, escalation-substance, runtime-isn't-infallible. Verify alignment with DC's Task 3 (permissive `processDirect` prompt).
- `evryn-backend/identity/situations/operator.md` — operator mode. Mira's pending update (per the Mira brief at `_evryn-meta/docs/sessions/2026-04-28-mira-brief-operator-md-adr030.md`) lands here. **Check whether Mira has shipped this** before signaling DC to deploy Task 6.
- `evryn-backend/identity/activities/onboarding.md` — has the "Look Them Up" research pattern + "Listen to what they want held" discretion beat. Light read for context on the research-aware Evryn shape.
- `evryn-backend/identity/activities/triage.md` — referenced by `processForward`. Light read.
- Other identity files (`gatekeeper.md`, `gatekeeper-onboarding.md`, `internal-reference/*`, `public-knowledge/*`) — pull as needed, not required for today's task.
- `_evryn-meta/docs/sessions/2026-04-28-mira-brief-operator-md-adr030.md` — the brief Mira is working from. Useful context for understanding what's coming and what to verify when Mira ships.

### Tier 8 — Runtime files (for verifying DC's reply)

Read all of `evryn-backend/src/`. The bundle touched many files; better to load the whole runtime than to chase what changed. Particularly:

- `src/index.ts` — entry point
- `src/config.ts` — env config
- `src/email/client.ts` — Gmail send/receive (Task 4 + Task 5)
- `src/email/poll.ts` — polling loop, cron jobs (Task 2)
- `src/email/process.ts` — email processing (Task 2 + Task 3)
- `src/email/detect.ts` — forward detection
- `src/triage/classify.ts` — `runEvrynQuery` + `composeSystemPrompt` + MCP tool definitions (Task 1 + Task 6)
- `src/notify/slack.ts` — Slack Socket Mode + `handleGeneralMessage` (Task 5 + Task 6)
- `src/notify/dev.ts` — dev alerts
- `src/db/users.ts` — user CRUD (Task 6 — Operator profile init)
- `src/db/messages.ts` — message CRUD (Task 6 — `scope_user_id` queries)
- `src/db/items.ts` — emailmgr_items CRUD
- `src/db/client.ts` — Supabase client
- `src/approval/flow.ts` — approval lookup (Task 5 — single-source-of-truth subject)
- Any new migration files DC added under `evryn-backend/migrations/` or similar (for Task 6 schema change)

### Tier 9 — Recent LEARNINGS

- `_evryn-meta/LEARNINGS.md` items 47-54 — the recent batch from 2026-04-27 + today's clarification on item 53 (deliberate vs. implicit subject-ification).

### Tier 10 — Pull only if needed

- `_evryn-meta/docs/hub/trust-and-safety.md` — if a question touches user isolation or trust architecture
- `_evryn-meta/docs/hub/user-experience.md` — if a question touches Evryn's voice or interaction design
- `_evryn-meta/AGENT_PATTERNS.md` — if you're trying to recall a pattern; the Research & Grounding section is recent
- `_evryn-meta/CHANGELOG.md` — if you need a chronological snapshot of what's shipped recently
- Other ADRs in `_evryn-meta/docs/decisions/` — pull individually if a question references one
- `evryn-backend/docs/operator-guide.md` — Justin's operational cheat sheet; relevant if you need to update operator-facing behavior. Currently slightly stale (still describes the `getRecipient()` redirect that ADR-029/Task 4 removes — operator-guide updates after DC ships, not before, per ADR-029 doc-sequencing).
- `evryn-team-workspace/shared/current-state/current-state.md` — team-level snapshot, append-only. Useful if you need context on what other team members are doing.

### Original 6-item starter list (kept for the truly time-pressed)

If you genuinely have to triage and read fewer files first, the absolute minimum is: this session doc, `current-state.md`, ADR-030, `ac-to-dc.md`, `dc-to-ac.md`, and the Mira brief. But you'll be making judgment calls without architectural depth — Justin's strong preference is the full ARCHITECTURE.md read.

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
