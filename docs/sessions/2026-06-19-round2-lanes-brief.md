# Round-2 Parallel Lanes Brief — v0.2 Hardening, clean re-spin (2026-06-19)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** AC0 wrote this to brief the **round-2** AC instances — the clean re-spin of the 2026-06-17 wave that ran on lobotomized subagents. **AC1a** (Lane A), **AC2a** (Lane B), **AC3a** (Lane C/cost), **AC4a** (staging), **AC5a** (M1). Everyone: read the shared preamble, then your lane section, then skim the others (cross-lane awareness is required). The single source of truth for *what* each sprint step is remains `evryn-backend/docs/SPRINT-V0.2-HARDENING.md`; this brief points at step numbers and carries the **round-1 salvage** (what STANDS vs. what's JUNK) so you don't rebuild blind.

*Authored 2026-06-19 by AC0 (recovery orchestrator). Supersedes the round-1 `docs/sessions/2026-06-17-parallel-lanes-brief.md` (retired to historical — its salvage is distilled below).*

---

## Why this exists (the one-paragraph situation)
The 2026-06-17 wave ran its DC/QC/Soren subagents **lobotomized** — they loaded only a `CLAUDE.md` (or a stale forked one) with no startup cascade, so the coordination system never fired. **All round-1 lane *code* is junk (no merge, ever).** Justin caught it pre-merge. The **loading failure is now fixed** (ADR-042 + the rewritten `docs/protocols/ac-orchestration-protocol.md`: precise file lists with line-spans → two-part receipts → re-run on any partial; a real team-subagent provision). The round-1 *thinking* was salvaged. **Your job: re-run your lane CLEAN, off the salvage below + the now-reliable loading discipline.**

---

## ⚠️ THE TWO RULES THAT CHANGED FROM ROUND 1 (read these first)

### 1. DESCRIBE-THEN-PAUSE — NOT post-and-proceed (Justin, 2026-06-19, hard gate)
Round 1 told you to *post your day-plan and proceed without waiting*. **That is REVERSED.** Justin got burned by lanes racing ahead. Now:

> **Orient Justin on your plan in CEO-accessible terms (concept first, then jargon) — what you'll do, why it matters, how it fits — then STOP and WAIT for his explicit "aligned, go" before you build or spin anything.**

This is a **hard gate**, not a notification. Do NOT start building, do NOT spin DC/QC, until Justin has explicitly confirmed alignment on your plan. He needs to verify you're pointed right before you take off — *especially* given round 1. (After he greenlights your plan, the normal flow resumes: build → QC → handoff to AC0. The standing pauses still apply too: a major design call gets surfaced in the 3-part form; you never merge to main or deploy.)

### 2. LOADING IS NOW PRECISE-LOAD + RECEIPTS (per the fixed protocol — non-negotiable)
When you spin DC/QC (and now you CAN spin a real Soren — see Lane M1), follow the **rewritten `docs/protocols/ac-orchestration-protocol.md` exactly**:
- **Grep-the-cascade, assemble the load yourself, hand the subagent an EXPLICIT file list with line-spans** (`(full — N lines)` or exact lines). Count each file's length before you spin.
- **The full standing cascade is mandatory; your judgment is ADDITIVE-only.** Never drop a standing file because it looks task-irrelevant — that's the exact self-truncation that lobotomized round 1. `#cascade-override` is the ONLY sanctioned narrowing, and it had better be near-existential.
- **Verify the two-part receipts** against your list every time (read-before-task + read-during-task, with line ranges). Short span / missing canary / absent file → the load didn't happen → **RE-RUN**; do not act on the partial run's output. A finding from a partial-loaded agent is UNVERIFIED.
- **Identity files are runtime, not fluff** — when a code task's blast radius touches them, they load in full.

---

## Clean-vs-junk — the cardinal discipline for the re-spin
- **DO NOT read the round-1 lane *handoffs*** (`docs/working/2026.06.17-corrupted/`) for the rebuild — they vouch for the junk subagent work as if validated. They're warehoused for provenance only.
- **The salvage you DO use** is distilled per-lane below, plus the kept-live design docs (M1, Step-61, staging, cache) which carry their own clean-vs-suspect addenda. Where a round-1 conclusion came *through* a lobotomized subagent, it's tagged **[RE-DERIVE]** — treat it as a hypothesis to re-confirm with a clean DC/QC, never as settled.
- **Everything kept from round 1 is RESEARCH, not gospel — verify it independently.** Only THREE docs were *clean inbound* briefs (AC0-authored, pre-subagent): the round-1 parallel-lanes brief (retired to historical), `staging-launch-space.md`, and `m1-stage2-design.md`. **Everything else** — `step61-...md`, `cache-measurement-plan.md`, `staging-validation-playbook.md`, and the per-lane salvage distilled below — is **wave OUTPUT** (AC-authored on the clean *side* of the timeline, but still produced during the corrupted run, so the "watch for subagent-injected bullshit" filter applies). Treat ALL of it as a **starting hypothesis you re-derive against the real ARCHITECTURE + runtime + a clean DC/QC** — make your own inquiries; inherit nothing as settled. Backstop: clean DC/QC rebuild the code fresh regardless, so a bad idea that slipped a tag still gets caught against the real spec.
- **The round-1 *code* is junk** — build fresh; don't port it.

---

## Shared preamble (every lane)

**Load first (you're doing build-level work):** the Full Startup Context Cascade per `_evryn-meta/CLAUDE.md` → SESSION STARTUP — `current-state.md`, the Hub, technical-vision, `evryn-backend/docs/ARCHITECTURE.md` (full), `BUILD-EVRYN-MVP.md` (full), `SPRINT-V0.2-HARDENING.md` (full), **all of your worktree's `src/`**, and `docs/protocols/ac-orchestration-protocol.md` + the writing protocol before you write any doc.

**Ping discipline:** done / blocked → `#team-alerts` (Node `fetch` to `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env`; parse the `.env` directly — `dotenv` isn't installed), prefixed with your tag (`AC1a:`…`AC5a:`). DC/QC operational record → `#dev-alerts`. A ping is part of the deliverable. **But remember Rule 1: your *first* ping is your plan, and then you WAIT.**

**Design calls:** make the local ones yourself; surface a *major* one in the 3-part form (the call / what you chose / top alternatives + why). When unsure if it's major, surface — cheap.

**Hard constraints:**
- Work ONLY in your assigned `-r2` worktree (pre-created for you — see your lane). Verify branch before every edit (`git -C <worktree> branch --show-current`). `npm install` in it first (`node_modules` isn't carried into a worktree). The `.env` is already copied in (gitignored — never stage/commit it; it carries live creds).
- Build to QC-GO on your branch. **Do NOT merge to `main`. Do NOT deploy (`railway up`).** AC0 converges + Justin deploys.
- **Real DC + real QC**, loaded per the fixed protocol. QC verifies every real code change.
- Commit only YOUR lane's files (stage by pathspec, never `git add -A`).
- **Identity files (`identity/*.md`) are Mira's** — these lanes are designed pure-runtime. If a step pulls you to an identity file, stop, flag Justin, coordinate with Mira (though there are some basic changes (tool swaps, etc) that Justin will just directly authorize for you to do - coordinate with him.)
- Tests are part of "done."

**Worktree assignments (pre-created by AC0, off `main` `7eb6d73`, `.env` copied in):**
| Lane | AC | Worktree | Branch |
|---|---|---|---|
| A — ingestion/resilience | AC1a | `evryn-backend-ingest-r2` | `r2/lane-a-ingest-resilience` |
| B — operator/approval | AC2a | `evryn-backend-operator-r2` | `r2/lane-b-operator-approval` |
| C — cost | AC3a | `evryn-backend-cost-r2` | `r2/lane-c-cost` |
| M1 — silent-death | AC5a | `evryn-backend-m1-r2` | `r2/m1-silent-death` |
| staging | AC4a | *(no code worktree — decoupled; infra + playbook, works with OC)* | — |

**Cross-lane file-overlap map (AC0 resolves merges at convergence):**
- `src/triage/classify.ts` — Lane B touches the MCP-tools region; Lane C touches `loadCommonPrefix` + `runEvrynQuery`. Stay in your region.
- `src/email/client.ts` — Lane A owns it; Lane B's Step 14 needs the `sendEmail` signature Lane A sets (Step 32 transport param) — coordinate.
- `src/email/poll.ts` — Lane A owns it; Lane C adds ONE checker line (Reflection); M1 adds minimal hooks. Additive; AC0 sequences.
- `src/db/items.ts` — Lane A additive read helper; Lane B's `updateEmailmgrItem` (Steps 18/36). Mostly Lane B.

---

# LANE A (AC1a) — Email ingestion + resilience
**Worktree:** `evryn-backend-ingest-r2` · **Branch:** `r2/lane-a-ingest-resilience`
**Owns:** `src/email/poll.ts`, `process.ts`, `detect.ts`, `client.ts` (+ an additive read helper in `db/items.ts`).
**Sprint steps:** 13, 16, 17, 19, 20, 21, 22, 29, 34, 40, 32(client.ts half), **61**.

**🔴 FIRST — drop the round-1 suspect dev-DB residue, then apply clean.** Round-1's lobotomized DC applied these to the **dev** DB (`Evryn Product — Dev`, ref `maqkdesopsskptpxjbqs`; prod untouched): `gatekeeper_inbound_addresses` table, `users.outbound_address` column, `trg_emailmgr_items_updated_at` trigger. Because the migrations use `CREATE … IF NOT EXISTS`, a clean re-apply would **silently skip** and leave suspect structure. So your dev rehearsal is **drop-then-apply**: `DROP TRIGGER IF EXISTS trg_emailmgr_items_updated_at ON public.emailmgr_items; DROP TABLE IF EXISTS public.gatekeeper_inbound_addresses; ALTER TABLE public.users DROP COLUMN IF EXISTS outbound_address;` (verify the dev ref in the connection string before ANY DB op — dev and prod share a pooler host; the `postgres.<ref>` username is the only tell). Then write + apply your clean migrations dev-first per `backups/README.md` (PG17 client is installed; `SUPABASE_DB_URL_DEV` in `.env`). **PROD apply rides AC0's convergence deploy — never apply to prod yourself.**

**Salvage — what STANDS (clean AC1 + Justin reasoning, pre-subagent):**
1. **Step 34 / EVR-72 — the sprint phrasing is WRONG; fix it.** The runtime *already* loads the gatekeeper (`checkFollowUps` → `findUserById(item.user_id)`; `user_id` is the forwarder). The fix is NOT "switch scope to the contact" (that would leak the contact's private notes into a gatekeeper-facing follow-up) — it's **add the contact's name + status to the prompt *text*** via the ADR-036 FK (`original_from_user_id`), never into `composeSystemPrompt`. ("Enabled by the FK" is the tell — needing the FK proves the fix *adds* contact info.)
2. **Step 13 — a DB TRIGGER, not app code.** Reuse the existing `public.touch_updated_at()` (already on `users` via `trg_users_updated_at`), NOT `moddatetime`. A trigger is required because Evryn's raw status writes bypass `updateEmailmgrItem`. Idempotent (`DROP TRIGGER IF EXISTS`). [The "reuse touch_updated_at" detail was round-1-QC-surfaced but independently verified against the real schema dump — sound.]
3. **Step 17 — empty-body sender-aware bounce.** Move the empty-body decision to *after* a cheap no-LLM `findUserByEmail`: known sender → a **deterministic, fixed-template, no-LLM warm bounce** (respects `SEND_ENABLED`, audited to `messages`); unknown → silent skip + dev-alert; lookup/send failure → degrade to **transient retry** (held + retried, never silent-drop or blind-bounce). The bounce is allowed to bypass the approval gate *only* because it's deterministic/no-LLM/no-PII — **keep that invariant; the copy is Mira's (still deterministic).** Known edges to handle deliberately: empty-body emails create no `emailmgr_item` → no durable dedup → a restart can re-bounce (low-harm, accepted); repeated empty sends → repeated bounces (no dedup-guard, accepted at v0.2).
4. **Step 21 — cursor/historyId catch-up resilience, NO new table.** On cold-start / `historyId`-expiry, fetch "everything since the last processed email" (from existing data — newest `emailmgr_items.created_at` minus a small margin) via a **lazy provider** (DB read only on a fallback, not every poll); larger page; durable `external_id` dedup absorbs the overlap. Keep `client.ts` DB-free (it receives the closure). Decide the page-size deliberately — it bounds how long an outage the catch-up covers (round-1 used `maxResults: 100` ≈ ~12h at Mark's volume, no pagination).
5. **Step 32 (SPLIT)** — Lane A owns ONLY the `client.ts` `sendEmail` injectable-transport seam (default = real Gmail; a throwing transport must propagate so a caller's retry has a real failure surface) + its surfacing test. The `executeApproval` retry/rollback test is **Lane B's**. Coordinate the seam: your `sendEmail` gains a `transport` param → Lane B's Step 14 must compose with that signature.
6. **Step 61 — gatekeeper-address resolution. The design lives in `docs/working/2026-06-17-step61-gatekeeper-address-resolution.md` — an AC-authored wave OUTPUT (Justin balloted it pre-subagent, so the shape is strong), but treat it as research to verify, not gospel; re-derive against the real runtime.** Inbound lanes (many→one via `gatekeeper_inbound_addresses`, `address citext PK` → `gatekeeper_user_id`) + settable `users.outbound_address` (gold destination, decoupled from inbound, falls back to `users.email`) + **escalate unregistered-lane forwards** (don't triage blind). **Load-bearing principles (do not lose):** (i) the lane resolver **THROWS on a DB error, never swallows-to-null** — a swallowed error reads as a clean "no lane" and would misroute a real gatekeeper's forward; throw → caller treats it transient → hold cursor + retry; (ii) pure resolution branch (lane-hit → canonical gatekeeper, no blank lead; forward + no-lane → escalate, short-circuit; not-forward + no-lane → existing find-or-create-as-lead; dedup stays FIRST); (iii) escalation = a tracked `escalated` `emailmgr_items` row anchored to the **Operator** system actor for the NOT-NULL `user_id` (real sender in `metadata.unresolved_from`), `external_id`-stamped, + operator ping; the 4h stale-`escalated` checker backstops. **Go-live precondition for the Step-48 runbook:** Mark's lanes — *including his PRIMARY email* — must be registered before he forwards, or every forward escalates. The design doc also carries verbatim-drafted ARCH/BUILD edits + a v0.3-scaling note — **those are auth-gated → AC0/Justin apply; re-review with the clean rebuild, don't auto-apply.**
7. **Minor builds (clean designs):** Step 16 internal-address sender-skip (skip `review@evryn.ai`-type by sender, like the self-skip — kills the S2 phantom-user cascade); Step 19 external-id dedup fallback (`messageId || gmailId` via one shared helper used by the dedup-check AND both item-creates); Step 20 rate-limit the transient alert (generalize the checker-cooldown) + **remove the double-`notifyDev`** (the inner one in `process.ts`'s `findOrCreateUser` catch); Step 22 hour-gate the `[cron:proactive] woke` heartbeat; Step 29 comment accuracy (re-processing is safe by *dedup*, not by post-write throws being impossible); Step 40 drop the stale "test recipient override" clause from `client.ts`'s `sendEmail` comment (`TEST_RECIPIENT` is dead in `src/`).

**JUNK (do not reuse):** all round-1 `src/` code + the dev migrations (drop them, above) + the 3 QC GOs. **[RE-DERIVE] flags:** the empty-body "sendEmail isn't an MCP tool" reassurance; the Step-61 Operator-anchor FK choice; the Step-48 primary-lane note; the `original_from_user_id ... not found in schema cache` ops concern (verify prod PostgREST actually has the ADR-036 column) — all sound-looking but came through a suspect subagent; re-confirm.

---

# LANE B (AC2a) — Operator / approval / Slack
**Worktree:** `evryn-backend-operator-r2` · **Branch:** `r2/lane-b-operator-approval`
**Owns:** `src/notify/slack.ts`, `src/approval/flow.ts` (+ the MCP-tools region of `classify.ts`, + `updateEmailmgrItem` in `db/items.ts`).
**Sprint steps:** 14, 15, 18, 26, 27, 28, 31, 33, 37, 32(Lane B half). If time: 23, 24, 38.

**⚠️ The biggest round-1 lesson for THIS lane: the Step-18 solution shape is the most subagent-contaminated thing in the whole wave — RE-DERIVE it from scratch.** Round 1 grew Step 18 into a "single-path `set_item_status` + REJECT-guard" with a cascade of caller-repoints (identity files + a runtime prompt in Lane A) and new `bad_actor`/`matched` beats. **That entire chain came downstream of a lobotomized QC (one of which *confabulated*).** The *audit-gap problem* is real (it's in the sprint: `supabase_upsert` status changes bypass `metadata.lifecycle`) — but **do NOT inherit "REJECT-guard + repoint every caller" as the answer.** Re-derive the design with a clean DC/QC: the sprint's own options are typed status-change tool vs. special-case vs. restrict raw status writes (it's a **design call → surface to Justin in the 3-part form** before building). Whatever you choose, remember QC's own promoted pattern (now on `evryn-quality/CLAUDE.md` `main`): *a guard/restriction is only half a change — confirm every caller (identity files AND runtime-built prompts) was repointed.*

**Salvage — what STANDS (clean AC2 + Justin, NOT B1-derived):**
1. **Step 14 — runtime-owned threading; cross-account threading is impossible** (a mailbox can only thread messages it holds). Derive `in_reply_to` from the inbound's stored Message-ID (`item.external_id`) + `thread_id` from `item.metadata.thread_id` (direct-message only); **drop `submit_draft`'s `in_reply_to`/`thread_id` params** (runtime-owned, not Evryn-supplied); for forward-curation use `Re: <original subject>` + a quoted original so Mark can eyeball-match across inboxes. Couples to Lane A's Step 61 (reads `gatekeeper.outbound_address` + `item.metadata.original_subject`) and Lane A's Step 32 `sendEmail` transport signature.
2. **Step 37 — `redact_user_from_message` (CLEAN, NOT part of the B1 chain).** Operator-gated (behind `threadScopeContext`, like `rescope_messages`); replaces a term with `[redacted user]` in `content_raw` + `message_body`; records *that* a redaction happened in metadata **without storing the term**; case-insensitive + regex-escaped. Its `operator.md` repoint (raw `supabase_upsert` → this tool) is the tool's natural identity beat (Mira; distinct from the junk status repoints).
3. **Step 26** — drop `Gold/Edge/Reply` from the *operator* subject (classification stays in the review body). **Discovery:** `findPendingByApprovalSubject` is **dead code** (no caller — approval is short-id-only), so the subject format is free to change.
4. **Step 31 — KEY: the existing `tests/test-slack-parsing.ts` tests a re-implemented OBSOLETE parser (a ghost)**, so the real strict `approve <id4>` parser (the ADR-035 silent-diversion guard) has **zero real coverage**. Fix: export + test the *real* `parseSlackMessage`. Carry this forward — a genuine latent risk.
5. **Step 33** — content-based idempotency on `submitDraftForApproval` (same to/subject/body while `pending_approval` → early-return, no re-send/re-ping; a differing body = legitimate revision → proceeds).
6. **Step 15** — inject the scoped user's *current pending draft* as discrete context into the **conversational** re-draft path (`handleOperatorMessage`, not the formal `notes <id>:` path which already has it); strictly scoped to the inherited-scope user; fail-safe on lookup error.
7. **Step 28** — the collision help-string points at a non-existent "approve via full-UUID `supabase_upsert`" path → replace with a real remediation (approval is short-id-only).
8. **Step 32 (Lane-B half)** — the `executeApproval` retry/rollback failure-path test (inject its deps). Compose with Lane A's `sendEmail` transport seam.
9. **Flag (defer, don't fix here):** the `users.status` typed-tool gap → folds into the v0.3 S1 "retire generic `supabase_upsert`" sweep, not this lane.

**JUNK / [RE-DERIVE]:** the entire B1 / B1-a → "repoint every caller" → `set_item_status` REJECT-guard + the `bad_actor`/`matched` identity beats — re-derive Step 18 clean (above). All round-1 code. The deferred QC nits (redact-tool logging the term; zero-occurrence `redacted:true` stamp; injected-update at the delivered-flip) — re-derive if they survive a clean rebuild.

---

# LANE C (AC3a) — COST  *(#2 priority, right behind M1)*
**Worktree:** `evryn-backend-cost-r2` · **Branch:** `r2/lane-c-cost`
**Owns:** `src/triage/classify.ts` (`loadCommonPrefix` + `runEvrynQuery`), a new Reflection module, a `story_versions` migration.
**Sprint steps:** 10 (lean Reflection — the big lever), 11b, 11c (done — the plan), 12 (defer). **11a is MOOT (drop).**

**🔴 FIRST — drop the round-1 suspect dev-DB residue, then apply clean.** Round-1 applied to **dev** (prod untouched): the `story_versions` table + the `consolidate_profile(uuid,text,integer)` RPC. Drop-then-apply (the `CREATE … IF NOT EXISTS` / `CREATE OR REPLACE` guards would otherwise leave suspect structure): `DROP FUNCTION IF EXISTS public.consolidate_profile(uuid, text, integer); DROP TABLE IF EXISTS public.story_versions;` (verify the dev ref first). Then write + apply your clean migration dev-first.

**Scope changes from round 1 (settled, fold in):**
- **Step 11a (1h cache-TTL flip) — MOOT, DROP it.** Justin's clustering decision (sprint Step 58 — drain the day's triage in one ~10am batch) keeps the cache warm *by volume*, which replaces the TTL lever. [A round-1 subagent also claimed the Agent SDK exposes no TTL knob — **[RE-DERIVE] if it matters** — but the moot conclusion stands on clustering regardless.]
- **Step 12 (num_turns) — DEFER;** sprint Step 57 (runtime-does-bookkeeping, Phase 2b) subsumes it.
- **Step 11b** (cache-prefix byte-identity) survives; **Step 11c** (the week-one measurement plan) is **done** and lives in `docs/working/2026-06-17-cache-measurement-plan.md` (kept live, mostly-clean AC work — soften the one SDK-TTL claim). It feeds sprint Step 59 (cache-partitioning SDK check). **Make the week-one measurement a tracked sprint Step** (per the sprint's process-tightening rule).

**The Reflection design carries Justin's OWN pre-subagent sign-off** (the strongest clean signal in the whole salvage — he refined + approved it before any DC/QC ran). Treat it as a strong design hypothesis, but still **verify it fresh, surface your plan (Rule 1), and re-derive the mechanics against the real runtime + a clean DC/QC before building** — don't inherit it blindly (the round-1 *code* is junk regardless):
- **Trigger on accumulated *pending-notes* size, NOT story/profile size** (triggering on story size loops; the notes-trigger self-limits because consolidation clears the notes).
- **Soft target for the story, never a hard cap/truncate** — an oversized story alarms (`notifyDev`) but is still written ("escalate, don't loop"; "what if someone has a genuinely detailed situation").
- **Runtime-orchestrated deterministic persistence, mirroring `record_pass`:** Evryn returns the consolidated story as reply text (no write tool); the runtime persists it.
- **Atomic, race-safe write:** archive-before-overwrite in ONE transaction; `SELECT … FOR UPDATE` row-lock; clear EXACTLY the first N notes (N read fresh just before the LLM call) so notes appended mid-run survive. No path loses a pending_note.
- **A `story_versions` archive table** (old story + raw notes + new story + count) → a bad synthesis is recoverable.
- **Validation guard:** empty/garbage/refusal result → no write, alert, notes intact.
- **Reflection guidance = a Mira-editable `identity/activities/reflection.md`, loaded ONLY in the consolidation pathway** (kept OUT of the force-load → costs nothing on normal queries); the consolidation query loads `core.md` + `reflection.md` only. Still needs a Mira voice pass.
- **Trigger mechanics:** a poll-loop checker (sibling to the existing crons), size-gated, **no per-user daily cap** ("consolidate at a token count, even if more than once a day"); population = active/gatekeeper users (≈ Mark in v0.2).
- **Starting defaults (tunable, not load-bearing):** consolidate when pending-notes exceed ~24,000 chars (~6k tok); soft story target ~10,000 chars (~2.5k tok); alarm (don't loop/truncate) if the new story exceeds ~4× the target.
- **LEAN scope ONLY** — the full matching-aware Reflection (relevance triggers, confidence audits, cross-user `evryn_knowledge`, binding-TTL) stays v0.3 (ADR-027). **This is the design-consequential piece — surface your plan to Justin (per Rule 1) and the design in the 3-part form before building.**
- **ARCH update needed** (auth-gated → AC0/Justin): `profile_jsonb.story` is now written in v0.2 (ARCHITECTURE.md currently says "Reflection-only, v0.3, empty in v0.2").

**Clean side-finding (independent of the wave):** 3 canonical identity files lacked the truncation canary — **`core.md`, `activities/triage.md`, `situations/gatekeeper.md`** (the `reflection.md` 4th is your new file). Adding the canary is identity-file hygiene → **coordinate with Mira** (don't fold it in silently). **JUNK / [RE-DERIVE]:** DC's Reflection code + the QC findings (N1/SF1/SF2/search_path) — re-derive with a real QC.

---

# LANE M1 (AC5a) — Silent-death detection
**Worktree:** `evryn-backend-m1-r2` · **Branch:** `r2/m1-silent-death` · **Sprint Step 4.**
**Full design lives in `docs/working/2026-06-17-m1-stage2-design.md` (kept live — READ IT; it has a detailed clean-vs-suspect corruption addendum).**

**The clean spine (Justin's decisions + AC5's own runtime read — carry forward):** ONE DND-respecting alert channel (`notifyEmergency` → `#emergency-alerts`, immediate, no piercing) + ONE **circuit-breaker at `runEvrynQuery`** (the sole Anthropic choke point — independently verified) that cuts all spend when tripped, plus `stopPolling()` + an external Anthropic monthly ceiling (3 layers). **No phone calls in v0.2; runaway cost is the ONLY condition that halts (hard-halt first trip); everything else alerts only. Cron move to ~10am PT.** The auto-halt must be robust enough to **retire Justin's manual daily-credit-reload chore** (a load-bearing requirement). Put safety logic in NEW `src/safety/` modules with minimal call-site hooks (keeps the cross-lane merge surface tiny).

**[RE-DERIVE] — the round-1 Soren vet was a *lobotomized* Soren, so its refinements are suspect. NOW you can spin a REAL Soren** (the fixed protocol has a team-subagent provision — `docs/protocols/ac-orchestration-protocol.md`, "Spinning a team subagent"; load his team manual + `soren.md` + his MEMORY + his spokes, with line-spans + receipts). Re-derive with him: the watch-the-watchman daily-affirmation mechanism; the clustering-robust velocity detector ("count attempts not `llm_usage`", repetition-over-distinct-work); and resolve the **open runaway worst-case-burn gap** (the loop-detector misses a runaway faking new item-ids each cycle → only the dumb velocity backstop catches it, ~$1.4k — Justin: "not stoked, interested in the cut, let's talk"). **ADR-041 exists but its refinements are suspect — re-vet with the real Soren; the spine stays.** The clean-vs-suspect split is fully tagged in the design doc — honor the tags.

---

# STAGING (AC4a) — the validation launch space  *(decoupled — no code worktree)*
**Design lives in `docs/working/2026-06-17-staging-launch-space.md` + `2026-06-17-staging-validation-playbook.md` (kept live — READ BOTH).**

**Clean (settled / AC-verified — carry forward):** staging is GO (stand up a full staging runtime before Mark; do NOT hard-gate this bundle on it — pre-Mark grace); the design baseline (2nd Railway service · the existing dev DB as staging's DB · a test inbox · a separate staging Slack app+channels · a send-recipient-allowlist); the **3 verified OC-manual gaps** (curl→fetch on Windows; the `#emergency-alerts` "future Twilio" staleness — it shipped 6/16 Slack-based; no get-better-every-day loop); the load-bearing finding that **the send-allowlist is a DC BUILD in `src/email/client.ts` (Lane A's file), not an ops config flip** — coordinate with AC1a; and the requirement to **validate the CLUSTERED model** (Step 58), not just real-time.

**[RE-DERIVE] — the OC-manual prose edits round-1 produced were OC-subagent-drafted (and the current `evryn-ops/CLAUDE.md` `53d5bf9` carries them, suspect, preserved for mining). Now you can spin a properly-loaded OC** (fixed protocol; ops is now on `main`, manual has its "How OC Orients" cascade). Redo the OC-competence augmentation cleanly: discard `53d5bf9`'s suspect prose, re-derive the get-better loop from the verified gap-list. Re-examine the OC-subagent-flagged items (dev-DB-two-writers → Soren; local-dry-run; cost-attribution) rather than inheriting them.

---

## When your lane is done
1. **Low-res for Justin (chat):** CEO-accessible — what shipped, why it matters.
2. **High-res for AC0 (a working doc, `docs/working/2026-06-XX-lane-<X>-r2-handoff.md`):** every step, exact files/functions, design calls made + surfaced, shared seams + how, test status, migration/DB notes, convergence hints. This is what AC0 converges from.
3. **Ping `#team-alerts`** ("AC<n>a: LANE <X> QC-GO on `<branch>` — handoff at …") and stop. Do NOT merge or deploy. AC0 converges.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
