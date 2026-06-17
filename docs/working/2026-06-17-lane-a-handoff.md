# Lane A Handoff — Email Ingestion + Resilience (AC1 → AC0)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** AC1's high-resolution handoff of **Lane A** of the 2026-06-17 v0.2-hardening parallel wave, written for **AC0** to converge from (NOT for Justin — he gets the low-res chat summary). It records every step built, exact files/functions, design calls (made + surfaced), the cross-lane seams AC0 must resolve at merge, migration/DB state, the clustering (Step 58) seams AC0 asked me to flag, test status, and watch-items. Source of truth for *what* each step is = `evryn-backend/docs/SPRINT-V0.2-HARDENING.md`; this doc is the *how it was built*. Lane brief: `_evryn-meta/docs/sessions/2026-06-17-parallel-lanes-brief.md` (Lane A section).

*Written 2026-06-17T12:49-07:00 (AC1).*

---

## Status: Lane A is QC-GO. THREE commits on `lane-a/ingest-resilience` (worktree `evryn-backend-ingest`). NOT merged, NOT deployed, NOT pushed.

- **`0430a6f`** — trip 1 (mechanical batch): Steps **16, 19, 20, 22, 29, 40** + the Step 13 migration file. QC-GO (clean; the 2 migration should-fixes QC raised were folded into trip 2 before any apply).
- **`30db607`** — trip 2 (design set): Steps **17, 21, 34, 32(client.ts half)** + the migration should-fix rewrite. QC-GO (no blockers, no should-fix, 2 non-gating nits).
- **`3f8d3d4`** — **Step 61** (gatekeeper-address resolution): the inbound-lane table + `users.outbound_address` migration FILE, the `process.ts` resolution reorder + escalation, the `original_subject` stash for AC2. QC-GO (no blockers, no should-fix, 3 nits + 1 go-live precondition — see §Step 61). **Added after my first "Lane A QC-GO" ping** — Lane A now includes Step 61; converge Lane A as a whole.

Both trips: real DC built, real QC reviewed (full Startup Context Cascade loaded each), AC1 reviewed. `npx tsc --noEmit` green; all new + existing `tsx` tests pass.

**Files touched across both commits (all within Lane A's owned region):** `src/email/poll.ts`, `src/email/process.ts`, `src/email/detect.ts`, `src/email/client.ts`, `src/db/items.ts` (one *additive* read helper only), `backups/2026-06-17-emailmgr-items-updated-at-trigger.sql`, and tests `tests/test-external-id.ts`, `tests/test-rate-limited-alert.ts`, `tests/test-empty-body-bounce.ts`, `tests/test-catch-up-since.ts`, `tests/test-send-email-di.ts`.

---

## Per-step detail

### Step 16 — internal-address sender skip (`src/email/poll.ts`, `handleNewEmail`)
`INTERNAL_SKIP_ADDRESSES = new Set(["review@evryn.ai"])`; an inbound whose extracted sender is in the set → `console.log` + `return "permanent-skip"`, **no `notifyDev`** (mirrors the existing self-send guard — expected internal noise). Placed right after the self-skip, before the empty-body branch. **Why:** an inbound that looked like it came from `review@evryn.ai` (our Bcc/review target) was find-or-created as a phantom "user" and triaged — the S2 phantom-user cascade root. No dedicated test (symmetric to the also-untested self-skip; QC accepted).

### Step 19 — external-id dedup fallback (`src/email/detect.ts` + `src/email/process.ts`)
New exported pure helper `externalIdFor(email) = email.messageId?.trim() || email.id` in `detect.ts` (single source of truth). `process.ts` dedup now **always** runs against it (was gated on a non-empty `messageId` → a Message-ID-less email skipped dedup and could be processed twice); both `createEmailmgrItem` `external_id` writes use it. `external_id` is a plain nullable text column (no unique constraint), so no collision risk; Gmail ids and RFC Message-IDs don't overlap in format. Test: `tests/test-external-id.ts`.

### Step 20 — rate-limit the transient-failure alert (`src/email/poll.ts` + `src/email/process.ts`)
Generalized the trip-0 checker-only `alertCheckerFailure`/`clearCheckerAlert` + cooldown map into **`rateLimitedNotifyDev(key, message, notify=notifyDev)`** + `clearRateLimitedAlert(key)` (the cron-checker callers build the *identical* message string → checker behavior byte-identical; QC verified). `handleNewEmail`'s transient alert now routes through key `"email-transient"`, cleared on a zero-transient `pollOnce` (recovery re-arm). **Removed the redundant inner `notifyDev`** in `process.ts`'s `findOrCreateUser` catch (it was double-alerting with `handleNewEmail`'s catch) — `handleNewEmail` is now the single, rate-limited alert point; the thrown `error.message` still carries the Supabase detail. `notify` is injectable for DB/Slack-free testing (`tests/test-rate-limited-alert.ts`).

### Step 22 — hour-gate the proactive-cron heartbeat (`src/email/poll.ts`, `checkProactiveOutreach`)
`lastProactiveHeartbeatKey` (PT-date + hour); the `[cron:proactive] woke` heartbeat emits once per hour-entry, not every ~30s poll. Mirrors the `lastMorningSweepDate` in-memory guard. (QC nit: the `ptHour` in the key is redundant since the function early-returns off-target-hour — harmless, the date alone would do. Left as-is.)

### Step 29 — comment accuracy only (`src/email/poll.ts`)
`HandleOutcome` doc + `handleNewEmail` catch comments now state re-processing a partially-handled email is made **safe by dedup**, not by post-durable-write throws being impossible (they aren't — a `createEmailmgrItem` throw reaches the catch as `"transient"`). No logic change.

### Step 40 — dead-config (`src/email/client.ts` comment only)
Dropped the stale "test recipient override" clause from `sendEmail`'s doc comment (no such override exists). Confirmed `TEST_RECIPIENT` has **zero** `src/` references (only the sprint doc's own tracking line — not touched). `config.nodeEnv` left in place (used in the `index.ts` startup log — cosmetic but live). **For AC0/Justin (not code):** `TEST_RECIPIENT` / `NODE_ENV` residue, if any, lives in `.env`/Railway env — an ops cleanup, not a code change.

### Step 13 — `emailmgr_items.updated_at` UPDATE trigger (migration FILE only)
`backups/2026-06-17-emailmgr-items-updated-at-trigger.sql`. **Today `emailmgr_items.updated_at` is `DEFAULT now()` with NO update trigger → frozen at insert**, so `checkStaleItems`/`checkFollowUps`/`findItemsByStatus(olderThanHours)` mis-time off creation time. The migration adds a BEFORE-UPDATE trigger. **A trigger (not app-side code) is required** so it also covers Evryn's raw `supabase_upsert` status writes, which bypass `updateEmailmgrItem`. After QC's find (+ AC1 verification against `backups/schema-public-2026-06-03.sql`), the file now **reuses the DB's existing `public.touch_updated_at()` function** (already wired to `users` via `trg_users_updated_at`) instead of introducing `extensions.moddatetime`, names the trigger `trg_emailmgr_items_updated_at` (convention match), and prepends `DROP TRIGGER IF EXISTS` for idempotent re-apply. **APPLY is AC0's** — see "Migration / DB" below.

### Step 17 — empty-body sender-aware bounce (`src/email/poll.ts`, `handleNewEmail` → `handleEmptyBody`)
The empty-body decision moved to **after** a cheap, no-LLM `findUserByEmail`:
- **Known sender** → a **deterministic, fixed-template, no-LLM warm bounce** via `sendEmail` (honors `config.sendEnabled`), recorded to `messages` (`sender=Evryn`, `origin: empty_body_bounce`) for audit, then `permanent-skip`.
- **Unknown sender** → the prior behavior (`notifyDev` + `permanent-skip`).
- Lookup failure / bounce-send failure → degrade to `"transient"` (held + retried next poll, not silent-dropped, not blind-bounced). Audit-record failure → best-effort (log + skip; never re-send).
- Pure testable helpers: `decideEmptyBodyAction(user)` ("bounce"|"alert"), `composeEmptyBodyBounce(user, subject)`. `handleEmptyBody` has injectable deps for DB/Gmail/Slack-free tests (`tests/test-empty-body-bounce.ts`).
- **`EVRYN_USER_ID` is defined locally in `poll.ts`** (mirrors the existing local definitions in `process.ts`/`classify.ts`/`approval/flow.ts`/`notify/slack.ts` — the current codebase pattern; centralizing it is the separate deferred Step 42, not pulled into this lane).
- **The bounce COPY is PLACEHOLDER** — see "Bounce copy → Mira" below.

### Step 21 — cursor/historyId catch-up resilience (`src/email/client.ts` + `src/email/poll.ts` + `src/db/items.ts`)
**Lean, no new table.** Added additive read helper `getNewestEmailmgrItemCreatedAt()` to `db/items.ts`. `poll.ts` builds a **lazy** `catchUpSinceProvider` (`() => Promise<number|undefined>`): reads the newest item's `created_at`, converts to epoch seconds via the pure `catchUpSinceEpochSeconds(iso, marginMs)` (60s safety margin; null/NaN → undefined; clamp ≥0). `client.ts`'s `fetchNewEmails(afterHistoryId?, getCatchUpSince?)` threads the provider into **both** fallbacks (the `historyId`-expiry 404 inside `fetchViaHistory`, and cold-start `fetchLatestBatch`); when bounded, `fetchLatestBatch` queries `in:inbox after:<since>` with `maxResults: 100`, else the original last-10. **`client.ts` stays DB-free** (receives the closure). The provider only fires on a fallback (not steady-state polling); a DB-read failure degrades to undefined (last-10), never throws the poll. Durable `external_id` dedup absorbs the over-inclusive boundary. **Why:** in-memory `latestHistoryId` is lost on a Railway restart → cold-start fell back to "last 10 inbox" → at ~200/day, mail arriving during the restart window was silently missed. Test: `tests/test-catch-up-since.ts`.

### Step 34 — EVR-72 follow-up enrichment (`src/email/poll.ts`, `checkFollowUps`)
**Verified runtime reality:** `checkFollowUps` *already* loads the **gatekeeper** (`findUserById(item.user_id)` — `user_id` is the forwarder), NOT the contact. So the literal sprint phrasing ("loads gatekeeper, not contact — fix it") and Justin's bet ("it's loading the contact") both mismatch the code; the "enabled by ADR-036's FK" note is the tell — the fix **adds** contact info. **The fix:** gatekeeper stays `scopedUser` (the follow-up is a message TO the gatekeeper; loading the contact's profile would risk leaking the contact's private notes into a gatekeeper-facing message). The contact is resolved via `item.original_from_user_id` and **only its `display_name`/`full_name` + `status`** are interpolated into the prompt **text** (the "Original sender:" line) — never into `composeSystemPrompt`. Cross-user-safe (name + status are operational, and the gatekeeper already knows who emailed them). QC confirmed no profile leak.

### Step 32 (client.ts half only) — `sendEmail` transport DI seam (`src/email/client.ts`)
`gmail.users.messages.send(...)` moved behind an injectable `SendTransport` (default `realGmailTransport`). Behavior-preserving — production callers pass nothing. A throwing transport propagates out of `sendEmail`, giving `executeApproval`'s retry/rollback a real, tested failure surface. Test: `tests/test-send-email-di.ts` (failure-surfacing + `SEND_ENABLED` short-circuit, run in BOTH modes). **The `executeApproval`-level retry/rollback test is Lane B's** per the Step-32 SPLIT in the brief — `approval/flow.ts` was NOT touched.

---

## Shared seams AC0 must handle at convergence

1. **`src/email/client.ts` ↔ Lane B Step 14 (outbound threading).** Lane A reshaped `sendEmail` (added the optional 2nd param `transport: SendTransport`; moved the Gmail send into `realGmailTransport`). Lane B's Step 14 auto-populates `in_reply_to`/`thread_id` and touches `sendEmail`'s call/signature. **Merge note:** Lane A's change is the *transport injection* (last line of `sendEmail` is now `await transport({raw, threadId})`); Lane B's is the *threading inputs*. They're in the same function but different concerns — both should compose, but eyeball the `sendEmail` signature + body merge. If Lane B added params, they sit alongside Lane A's `transport` default-param.

2. **`src/db/items.ts` — additive only from Lane A.** Lane A added `getNewestEmailmgrItemCreatedAt()` (new exported function). Lane B's Steps 18/36 touch `updateEmailmgrItem` (different function, same file). **Same-file/different-function — should merge cleanly**, but a textual conflict is possible if both appended near the same spot; trivial to resolve.

3. **`EVRYN_USER_ID` duplication.** Lane A added a *5th* local definition (in `poll.ts`). If any lane does Step 42 (centralize into `src/constants/system-actors.ts`) this wave, reconcile; otherwise it's consistent with the existing pattern. Not expected this wave.

4. **`rateLimitedNotifyDev` is now exported from `poll.ts`** (Step 20). If another lane imports an alert helper from `poll.ts`, this is the name.

No other Lane A file overlaps Lane B/C. `triage/classify.ts`, `notify/slack.ts`, `approval/flow.ts`, `config.ts` untouched by Lane A.

---

## Clustering (Step 58) — the poll.ts seams it will rework (AC0 requested this flag)

Lane A is entirely the **ingest/resilience** layer, which clustering keeps; **nothing here needs to be torn up.** The seam clustering (Step 58) will rework:

- **The synchronous per-email triage trigger.** Today: `handleNewEmail` → `processEmail` (`src/email/process.ts`) → `processForward`/`processDirect` → `runEvrynQuery` triages **inline, per email, during the poll**. Clustering splits this: **ingest** (fetch → dedup → find-or-create → store `emailmgr_item` as `new`) stays per-email/continuous; **triage** moves to a once-a-day cluster drain (~10am PT) that batches all `new` items. The decoupling point is the `processForward`/`processDirect` call to `runEvrynQuery`.
- **A new daily-cluster cron** will join the existing crons in the poll loop (`checkStaleItems`, `checkFollowUps`, `checkProactiveOutreach`, `checkMorningSweep` — all in `poll.ts`). It will mirror their once-per-period in-memory-guard shape (see `lastMorningSweepDate` / `getPacificDateString`).
- **Step 13 (the `updated_at` trigger) actively supports clustering** — items sitting in `new`/queued longer before the daily drain makes accurate `updated_at` more load-bearing for stale-detection.
- **Step 17 (empty-body bounce) and Step 21 (catch-up) are clustering-robust** — both are ingest-time/poll-time, and Step 58 explicitly keeps direct messages real-time (the empty-body case is overwhelmingly a direct message). Nothing assumes immediate triage.
- **Heads-up for the clustering builder:** Step 58 also notes a process.ts overlap with Step 57 (runtime-does-bookkeeping). Lane A's process.ts changes this wave are limited to Step 19 (external-id) + Step 20 (removed the inner alert) — both compose cleanly with a future bookkeeping refactor.

---

## Migration / DB — apply is AC0's

- The Step 13 migration file (`backups/2026-06-17-emailmgr-items-updated-at-trigger.sql`) is **QC-GO and ready**, **FILE-ONLY — DC/AC1 did NOT run it.** The dev-first run-order recipe (the full-path PG17 psql method, `SUPABASE_DB_URL_DEV` → verify → `pg_dump` prod → apply prod) is in the file header + `backups/README.md`.
- **AC0 owns the apply** (Justin: "AC0's on it"; AC1 deliberately did NOT apply to avoid a double-apply — the `DROP TRIGGER IF EXISTS` makes it idempotent anyway). The dev rehearsal + the coordinated prod apply ride AC0's convergence/deploy.
- **PG17 client tools:** not installed on this laptop as of the build; winget is now available (Justin installed it), so `winget install PostgreSQL.PostgreSQL.17` should work (may need a UAC prompt → Justin runs it). AC1 has not installed/applied — clean handoff to AC0.
- Verification query is in the file footer (`SELECT tgname FROM pg_trigger WHERE tgrelid = 'emailmgr_items'::regclass AND NOT tgisinternal;` → expect `trg_emailmgr_items_updated_at`).

---

## Bounce copy → Mira (flag for AC0's Mira batch)

Step 17's empty-body bounce body/subject is a **deterministic PLACEHOLDER** marked in-code in `composeEmptyBodyBounce` (`poll.ts`): *"Hi {name} — looks like your message came through empty on my end (no text — maybe an attachment didn't attach?). Could you resend whatever you meant to send? — Evryn"*. Per Justin (ballot A): put in reasonable placeholder, **flag to AC0 to get the real wording into the Mira batch.** It must stay **deterministic / no-LLM** (that's the entire basis on which it's allowed to bypass the approval gate) — Mira refines the *wording*, not the mechanism. The mechanism (a fixed template, no Evryn-the-LLM authorship) is the load-bearing invariant.

---

## Watch-items (non-gating — recorded for AC0 + the v0.2-maintenance / v0.3 passes)

1. **Step 21 catch-up `maxResults: 100`, no pagination.** Bounds the cold-start/expiry catch-up to ~12h of Mark's volume (~200/day). Fine for normal restart windows (seconds–minutes) and Step 58 changes ingest cadence anyway. Revisit (paginate on `nextPageToken`) only if real outage durations approach that window. (QC + AC1 agree: acceptable v0.2.)
2. **Step 17 empty-body emails get NO durable dedup** (they never create an `emailmgr_item`; only in-memory `processedIds`). After a successful bounce + a process restart, the same empty email still in the inbox (within the catch-up window) can be re-bounced (known sender) or re-alerted (unknown). Low-harm (one duplicate harmless "resend?" note / one extra `#dev-alerts` line, only on restart). (QC + AC1 agree: low-harm v0.2.)
3. **Step 17 loop risk:** a sender who repeatedly emails empty bodies gets a bounce each time (no dedup-guard, per spec). Low risk at Mark scale; not built.
4. **`external_id` has no index** (pre-existing, not introduced here): `findItemByExternalId` does an unindexed `.eq` scan. Low volume; on the record for the Step 47 maintenance pass.
5. **Step 17 subject-echo** (QC nit): the bounce subject echoes the sender's own subject back to them only — not a leak (same sender, `From: Evryn`), awareness-only.

---

## Test status
`npx tsc --noEmit` green. New tests (all `tsx`, DB/Gmail/Slack-free via injected fakes): `test-external-id`, `test-rate-limited-alert`, `test-empty-body-bounce`, `test-catch-up-since`, `test-send-email-di` (DI test run in both `SEND_ENABLED` modes). Regression set green: `test-poll-retry`, `test-proactive-gating`, `test-morning-sweep`, `test-review-send-format`. NOTE for whoever runs tests: scripts importing `poll.js`/`client.js` need env (they load `config.ts`'s `required()`); copy the canonical `evryn-backend/.env` into the worktree (gitignored — never stage/commit; delete after), as both DC and QC did.

---

## Step 61 — gatekeeper-address resolution (added 2026-06-17, commit `3f8d3d4`)

**Full design (the one home):** `_evryn-meta/docs/working/2026-06-17-step61-gatekeeper-address-resolution.md` — read it for the data model, resolution flow, escalation, the AC2/AC0 outbound model, and the proposed (auth-gated) ARCH/BUILD doc edits. Summary for convergence:

- **What it fixes:** the runtime resolved a forward's gatekeeper from the `From` header alone → a forward from any unregistered address triaged against a blank `lead` (no criteria). Now: a `gatekeeper_inbound_addresses` table maps many addresses → one gatekeeper record; an unregistered-lane forward **escalates to the operator** (tracked `escalated` item + Slack ping) instead of triaging blind; and a settable `users.outbound_address` is the deliberately-set gold destination (used by AC2's Step 14, not here).
- **Files (`3f8d3d4`):** `backups/2026-06-17-gatekeeper-address-resolution.sql` (table + column — FILE-ONLY, AC0/Justin applies dev-first), `src/db/users.ts` (`resolveGatekeeperByInboundAddress` + `outbound_address` on `UserRecord`/`updateUser`), `src/email/process.ts` (the `processEmail` reorder + `escalateUnregisteredForward` + `original_subject` stash), `tests/test-gatekeeper-resolution.ts`.
- **Convergence seams:** `process.ts` is touched again (same file as the Step 19/20 changes — intra-branch, sequential commits, dedup stays first, find-or-create try/catch preserved — not a cross-lane conflict). The send/outbound-USE path (`approval/flow.ts`) is untouched — that's **AC2's Step 14**, which reads `gatekeeper.outbound_address` + `item.metadata.original_subject`.
- **🚨 GO-LIVE PRECONDITION (QC nit 1 — must reach the Step 48 runbook):** once Step 61 ships, a forward whose `From` doesn't resolve to a registered lane *escalates instead of triaging*. So **Mark's own lanes — INCLUDING his primary email — must be registered in `gatekeeper_inbound_addresses` at onboarding (Step 48) before he forwards**, or every one of his forwards escalates and triage is dead. SPRINT Step 48 says "register Mark's lanes" but does NOT yet explicitly name "register the PRIMARY email as a lane" — that exact subtlety is the load-bearing gate. **AC0/Justin: ensure the Step 48 runbook text names it.**
- **Migration apply:** same as Step 13 — FILE-ONLY, QC-GO, **AC0/Justin applies dev-first** (recipe in the file header). Two Lane A migrations now (Step 13 trigger + Step 61 table/column) — apply both together.
- **ARCH/BUILD doc edits:** drafted verbatim in the design doc §"Proposed doc edits" (auth-gated → AC0/Justin apply). Includes the **v0.3-scaling note** (Justin pre-authorized me to write it — it's in the design doc, ready to apply; flagging here that it's written, no AC0 decision needed on its content, just placement).
- **Step 61 watch-items (non-gating):** (i) escalation `notifySlack` writes no `messages` audit row (the escalated `emailmgr_items` row + lifecycle is the durable record; the broader notify_slack-audit is its own item); (ii) the `escalated` item is born without a `lifecycle[0]` entry (consistent with how `new` items are born; `metadata.type/reason/unresolved_from` fully describe it).
- **⚠️ Ops note (NOT Step 61 — surfaced during testing):** `tests/test-processing-stuck` fails with `original_from_user_id ... not found in schema cache` — an **ADR-036 / PostgREST schema-cache** artifact (Step 61 touches neither `items.ts` nor that column). Worth verifying **prod's PostgREST has ADR-036's `original_from_user_id` column in its schema cache** (a `NOTIFY pgrst, 'reload schema'` if stale) — if it's genuinely missing/uncached, ADR-036's reification would fail live. Separate ops concern; flagging because it's a potential silent-failure.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
