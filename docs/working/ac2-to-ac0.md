# AC2 → AC0 — Pre-Go-Live Audit Report

**From:** AC2 (the pre-go-live audit instance)
**To:** AC0 (cutover + integration-test lane)
**Date:** 2026-06-04T15:24-07:00
**Status:** Complete first pass. Full product-architect cascade loaded (no trim) + full runtime read directly + prod DB artifacts inspected. Evidence pointers are concise; "unverified" marked where I couldn't reach ground truth.

> **For Justin (he hasn't been in these docs in months):** the headline is good news. The path to go-live is **short and mostly already done.** Of everything I swept, there is **one** real build blocker left (the silent-death alert), plus a handful of operational steps you already have checklists for, plus two quick verifications. The two scarier-sounding "hard gates" — database backups and row-level security — are essentially **already handled**; they just need a confirm. Details below, plainest-English summary first.

---

## TL;DR — the whole answer in six lines

1. **One true build blocker before Mark:** the `#emergency-alerts` **silent-death detector** (wakes you if Evryn dies at 3am). Not built. ~½-day. [M1 / Hard Gate 1]
2. **Operational gates (no building, you have checklists):** flip `SEND_ENABLED=true` + prod env at go-live; run STEP 0 cleanup (wipe test-Mark → introduce real Mark); the create-from-zero integration test must pass first (that's your lane, AC0). [M2/M3]
3. **One ordering dependency (your cutover already covers it):** the ADR-036 DB migration must land on Oregon **before** the deploy, or triage breaks. [M4]
4. **Backups + rollback (Hard Gate 2): essentially DONE** (AC1/ADR-037). Just wants a one-line written rollback procedure. **Not a blocker.**
5. **RLS / row-level security (Hard Gate 3): verified ON for all 5 tables** (from the dump that was restored to Oregon). Wants a ~5-min live confirm post-cutover. **Not a blocker.**
6. **Everything else** (4 QC resilience items, SSRF hardening, EVR-72, adversarial test, dashboard, PII anonymization, ~10 small backlog items) is **legitimately CAN-WAIT** — most already marked so, and I agree.

---

# D2 — The definitive go-live blocker list

**The "must" test I applied:** an item blocks only if its absence would, before or shortly after Mark starts forwarding, (a) break/visibly-degrade Mark's experience, (b) lose data, (c) leave a real failure **silent** (no operator signal), or (d) breach trust/security/user-isolation.

## MUST — before Mark go-live

### M1. `#emergency-alerts` silent-death detector + DND-override — **TRUE BLOCKER (build)**
The pilot-ending failure: at 3am an auth token expires / the poll loop dies / the process crashes → Evryn goes dark → Mark's forwards pile up unprocessed → Mark is ghosted → **Justin never knows.** Today every alert path lands in `#dev-alerts` (`notifyDev`, which is DND-respecting) or `#evryn-approvals` (also DND-respecting + quiet-hours-queued). Nothing breaks through DND, and nothing actively *detects* a silent death.

- **Verified unbuilt:** grep of `src/` shows only *comments* referencing a future emergency path — `bypassQuietHours: true` is a defined-but-**unused** option in `src/notify/slack.ts:143` ("Reserved for future `#emergency-alerts` pathway"); there is no `notifyEmergency()`, no `SLACK_EMERGENCY_WEBHOOK_URL`, no detector, no caller. The `#emergency-alerts` channel exists in Slack (operator-guide channels table) but is wired to nothing — `operator-guide.md:112` admits this directly.
- **Minimal-sufficient version (not the gold-plated v0.3):** (i) a `notifyEmergency()` → dedicated `SLACK_EMERGENCY_WEBHOOK_URL` → `#emergency-alerts`, the channel set to break DND; (ii) detectors for the three death-shapes: poll loop stalled / N consecutive poll failures with backoff exhausted, hard auth failure (401/403 from Gmail/Anthropic/Supabase, not transient), and process-not-alive.
- **⚠ Design catch worth surfacing to Justin:** the **process-crash** case can't be self-reported — a dead process can't fire its own alert. The in-process detectors cover auth-fail and poll-stall, but a hard crash / Railway stop needs an **external** watchdog (Railway's own healthcheck-failure alerting, or a tiny external pinger against the `/health` endpoint). Recommend the minimal version lean on Railway's healthcheck alert for the crash case + in-process detectors for the rest.
- **Estimate:** Stage 1 (wiring + DND config) ~30 min DC + a Slack/Android config step (Justin). Stage 2 (which conditions fire, + the external-watchdog decision) is an AC+Justin+Soren design conversation, ~½ day total. Spec already sketched at `SPRINT-MARK-LIVE.md:545`.

### M2. Production env flip at go-live — **operational gate (no build)**
`SEND_ENABLED=false` locally right now (verified in `.env`). Go-live requires Railway: `SEND_ENABLED=true`, `NODE_ENV=production`, `POLL_INTERVAL_MS=300000`. Already on the `operator-guide.md` Go-Live Checklist (lines 285-288). Flagging only so it isn't missed. *(Unverified: Railway's current `SEND_ENABLED` value — I can't see Railway env from here.)*

### M3. Pre-go-live STEP 0 cleanup + create-from-zero — **operational gate (no build), sequenced after the integration test**
Wipe test-Mark (UUID + all refs), clear the `evryn@`/`systemtest@`/`review@` inboxes, then introduce the real Mark on Slack so Evryn creates his record via `create_user`. Fully specced and consistent across `operator-guide.md` STEP 0 (271-280) and `SPRINT-MARK-LIVE.md` Pre-Go-Live Cleanup (466-487). **Precondition:** the create-from-zero integration test must pass first — **that's your mission, AC0**, not a build item.

### M4. ADR-036 migration must hit Oregon **before** the deploy — **ordering dependency (your cutover step #2)**
Master's runtime references `emailmgr_items.original_from_user_id`; that column does **not** exist in the DB until the migration runs (`backups/adr-036-original-from-user-id-migration.sql`). Deploying master against a DB without the column breaks the forward/triage path. Already in your cutover plan and the handoff — I list it only because it's a real "if missed, breaks Mark's core flow" item, and the audit's job is to make the must-list complete.

## MUST-DECIDE (Justin's call — I lean CAN-WAIT, but the Build doc's stated intent says otherwise)

### crisis-protocol.md is missing
- **Ground truth:** `identity/internal-reference/` holds only `feedback-guidance.md` + `trust-arc-scripts.md`. `crisis-protocol.md` does not exist.
- **Why I lean CAN-WAIT:** `core.md` already carries the crisis principle inline — *"If someone is in crisis, you shift to support mode and escalate to Justin immediately"* (`core.md:163-167`) — and the module list **annotates** the missing file gracefully: *"crisis-protocol.md … (Doc not available yet — core.md's 'Abuse, crisis, and safety' section has the principles)"* (`core.md:251`). So it's a **known, gracefully-handled gap, not a broken reference**, and every outbound is approval-gated — a crisis response can't reach Mark un-reviewed. By the must-test, the silent/trust-breach path is closed.
- **The tension:** `BUILD-EVRYN-MVP.md:45` explicitly says crisis-protocol.md is "safety file, **write before go-live**." So the *stated intent* was pre-go-live. Low effort (a Mira trip) if Justin wants the intent honored. **Recommend: Justin decides; default CAN-WAIT given principles-present + approval-gated.**

## CAN WAIT — after Mark is live

| # | Item | Why it waits | Evidence |
|---|------|-------------|----------|
| CW1 | 4 resilience/hardening items (empty `Message-ID` dedup; sustained-outage alert storm; held-cursor + Gmail `historyId` expiry; a cosmetic comment) | **QC verified all 4 NON-blocking**; backstopped by the approval gate + low probability | `BUILD-EVRYN-MVP.md:683-690` (QC review 2026-06-02) |
| CW2 | S1 — `supabase_read/upsert` run as service_role (RLS-bypass), arbitrary table/filter | Low risk at single trusted gatekeeper, no anon surface; structural fix is v0.3 (Soren) | `SPRINT:573` |
| CW3 | S2 — WebFetch/WebSearch SSRF via injected URL in forwarded email | Low risk at single curated-gatekeeper window; email body already wrapped as untrusted. The v0.2 *identity* mini-mitigation (a Mira beat) is nice-to-have, not a hard blocker; architectural fix is v0.3 | `SPRINT:575` |
| CW4 | EVR-72 — follow-up loads gatekeeper, not the contact | Enabled by 036's FK, small follow-up trip; doesn't affect Mark's core experience | `current-state.md:38`, handoff |
| CW5 | Adversarial test full run | **Justin already downgraded it** (2026-05-27 CEO call) to run against live-Mark post-go-live | `SPRINT:551`, `CHANGELOG 2026-05-27` |
| CW6 | Dashboard integration (1e), Sentry, PII anonymization, rate-limits, idempotency-key, updateEmailmgrItem merge-JSDoc, WS-heartbeat restart false-positive, Railway auto-deploy fix, rescope real-run test, name-search semantics | All explicitly post-go-live "NICE" or small backlog | BUILD/handoff/SPRINT backlog |

---

# D1 — SPRINT-MARK-LIVE.md reconciled to reality

Audited three ways (against itself, against the changelogs, against runtime/git/DB). Concise pointers; no essays.

### The big one — internal self-contradiction on the emergency-alerts gate
**`SPRINT:60` (2026-06-03) reclassifies emergency-alerts as a HARD go-live gate.** But **`SPRINT:107` and `SPRINT:545` (both 2026-06-02) still say "deferred to v0.3, reasoned-safe."** The 06-03 reclassification supersedes (confirmed: `CHANGELOG.md:52` + `2026-06-04-ac0-handoff.md:91` both treat it as a hard gate), but lines 107 and 545 were never updated to match. **Fix:** un-defer line 107's parenthetical and the line-545 backlog header so the doc stops arguing with itself. *(This is the seed example of the doc-drift you flagged in my charter — and it's load-bearing, since it's the one true blocker.)*

### Stale "still to-do" items that are actually shipped
- **Cron observability (`SPRINT:569`):** says "queued for DC dispatch immediately after the 2026-05-28 integration test." **Actually SHIPPED** — `checkProactiveOutreach` in `src/email/poll.ts` has the `[cron:proactive]` heartbeat logs (gate-passed / returned / timestamp-bumped) and tool-call JSON logging is plumbed (Wave 3, deploy `4e79b834`, 2026-05-29). → mark DONE.
- **`createUser` MCP tool (`SPRINT:534`, backlog):** listed as an unbuilt task. **Actually SHIPPED** as `create_user` in `src/triage/classify.ts` (ADR-036 Trip 1, `CHANGELOG 2026-06-03`). → mark DONE.

### Still-accurate but worth a status word
- **Late-scope recovery / `rescope_messages` (`SPRINT:542`):** "SHIPPED but UNTESTED in a real run" — still true; the tool is deployed but hasn't been exercised live. Minor; carry forward.
- **Phase 0d (`SPRINT:56`):** correctly marked DONE (ADR-037, AC1). Accurate.
- **QC standup (`SPRINT:571`):** "STATUS 2026-06-01: QC stood up, cadence codified" — accurate.

### Framing drift (not wrong, just dated)
The whole doc is still titled/framed as a **"5-day March sprint"** with statuses patched in piecemeal through 06-03. The Day-5 go/no-go checklist (`SPRINT:318-330`) and Pre-Go-Live Cleanup (466-487) are the operative gates and read **correctly** (SEND_ENABLED=true noted; create-from-zero model reflected). The contradiction above is the only place it actively misleads.

---

# D3 — The three hard gates

### Hard Gate 1 — Silent-death detector → **TRUE BLOCKER**
See **M1** above for the full recommendation (minimal-sufficient version, the external-watchdog catch for the crash case, ~½-day estimate). This is the gate that actually gates.

### Hard Gate 2 — DB backups + rollback → **NOT a blocker (essentially DONE; fold in AC1)**
- **Backups:** ADR-037 shipped the model — Supabase **Pro daily auto-backups** (primary, 7-day retention, live on prod + dev) + periodic real **`pg_dump`** snapshots (portable/archival). The dead non-restorable JSON dumps are gone. First real restorable dump committed `0df5e0c`.
- **Rollback:** code rollback is the Railway dashboard "Rollback to previous deployment" (`operator-guide.md:60-65`); DB rollback = restore from daily backup or the `pg_dump`; **old East prod stays live as the net until cutover-retire**; the new **dev DB gives a rehearsal surface** for risky changes.
- **Minimal-sufficient remaining:** the *mechanics* exist but the **written rollback procedure is thin** — recommend a one-line "here's exactly how we roll back the DB" note in operator-guide (low effort). **AC1 owns this gate's DB piece** per the lane split; I'm folding his status in, not rebuilding.

### Hard Gate 3 — RLS verification → **NOT a blocker (verified ON; wants a live confirm)**
- **Verified:** all **5 live tables have row-level security ENABLED** — `users`, `emailmgr_items`, `messages`, `evryn_knowledge`, `notify_queue` — read directly from `backups/full-public-2026-06-03.sql` (the faithful `pg_dump` that was **restored into Oregon** via `replicate-to-oregon-2026-06-03.sql`). Service-role access policies exist on `users` / `emailmgr_items` / `messages`.
- **Nuance:** `evryn_knowledge` and `notify_queue` have RLS **on but no explicit policy** → default **deny-all** for non-service roles. That's fine (arguably safest) at v0.2: the runtime uses the `service_role` key, which **bypasses RLS** entirely, and there is no anon/authenticated surface yet (no web app). Those two tables will want explicit policies **before** the v0.3 web app introduces `anon`/`authenticated` roles.
- **⚠ Honesty flag (unverified-live):** the above is from the committed dump that was restored to Oregon — **not** a live query against running Oregon prod/dev (I have no `psql` on PATH and I'm staying out of the DB-credential/cutover lane). **Minimal-sufficient remaining:** AC1 runs a ~5-min live confirm post-cutover (`SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace`) against Oregon prod **and** dev. Not a build blocker.

---

# Doc-drift (full scope, per Justin — not just SPRINT)

Places where ARCHITECTURE / BUILD / supporting docs are stale-and-in-our-face. **I did not edit any of these** (source-of-truth edits are yours with Justin's auth). Pointers only.

### ARCHITECTURE.md
- **`ARCHITECTURE.md:1156-1176` ("Current State") — badly stale, highest-priority fix.** Still says *"product build: pre-work phase,"* *"Phase 0c DEFERRED,"* *"Phase 0d DEFERRED,"* *"No deployment infrastructure,"* *"No testing environment."* **All false now** — deployed since April, dev DB exists, Phase 0c+0d done. A fresh reader is told the system isn't built or deployed. This is the worst drift in the doc.
- `ARCHITECTURE.md:13` date stamp *"Last updated 2026-03-18 … DC built to this spec Days 2-4, no design changes needed"* — heavily edited since (many Apr/May/Jun sections). Bump it.
- `ARCHITECTURE.md:208/224` still says the foundation tables "exist in … `maruxkjwlfltlmureqkt`" (old East, "renamed from n8n Prototype"), while the Separate-Projects section (398-402) correctly points at Oregon and calls East retired. Internal inconsistency; low priority (208 is historical framing).

### BUILD-EVRYN-MVP.md
- **`BUILD:16-18` (top Status block) — stale.** *"Go-live blocked on Fenwick terms/privacy finals (expected April 7). Target: Go-live week of April 7. v0.3 target: early May."* Months out of date; Fenwick finals were done in April (technical-vision spoke:261). Reframe to the current create-from-zero / Oregon-cutover reality.
- `BUILD:29` + `BUILD:37-50` (Pre-Work #6 "IN PROGRESS," DC Blockers, internal-reference module list) — partially stale; the identity files are largely done (only `crisis-protocol.md` + v0.3 stubs absent), and `feedback-guidance.md`/`trust-arc-scripts.md`/`company-context.md` are all DONE (SPRINT Day 6).
- `BUILD:700-708` (the "reactivate deferred Phase 0d" section the charter named as a seed) — **already handled**: AC1 added a `✅ RESOLVED 2026-06-04 (ADR-037)` banner at the top (line 702); body kept for provenance. Note it as resolved-with-banner, not open.
- `BUILD:403` (Phase 0e) correctly flags emergency-alerts as a Mark-live blocker — **this is the one place the docs already agree** with SPRINT:60. Good.

### Supporting docs
- `docs/schema-reference.md` — header says *"Last pulled 2026-05-02 (⚠ STALE)"* with a partial 2026-06-04 update; recommends a full column-level re-pull. Self-annotated; does **not** record RLS state (which is why I went to the dump). Minor.
- `operator-guide.md:9` date stamp says 2026-05-29 but the body contains post-05-29 reconciliations (create-from-zero STEP 0). Bump the stamp. Content is otherwise current and honestly flags the emergency-alerts gap (line 112).

---

## Questions / forks for AC0 (or Justin if faster)
1. **crisis-protocol.md** — honor BUILD doc's "write before go-live" intent (small Mira trip), or accept CAN-WAIT given principles-present + approval-gated? *(I lean CAN-WAIT; flagging because the doc states an intent.)*
2. **Silent-death crash case** — OK to lean on Railway's healthcheck-failure alerting for the process-crash shape, and reserve the new in-process detector for auth-fail + poll-stall? Or do you want an external pinger too? *(Affects the M1 estimate.)*
3. Anything you want me to **verify live** that I marked unverified (Railway `SEND_ENABLED`, live RLS on Oregon) — say the word and I'll find a path, or hand those two to AC1's DB lane.

— AC2, 2026-06-04
