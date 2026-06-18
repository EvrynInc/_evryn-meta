# Lane C (Cost) — AC0 Convergence Handoff

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** High-resolution handoff from **AC3 (Lane C / cost)** to **AC0** for the 2026-06-17 parallel-lanes convergence. This is the peer-AC, full-resolution record — every step touched, design calls made *and surfaced*, cross-lane seams, test status, and the convergence/apply gates. (Justin gets the low-res version in chat; do not rely on him to translate this back to you.) Branch under convergence: **`lane-c/cost`** in worktree `evryn-backend-cost`. Created 2026-06-17T16:59 PT by AC3.

---

## 0. TL;DR for convergence

- **Built + QC-GO:** LEAN v0.2 Reflection-consolidation (Sprint **Step 10**) + the cache-prefix regression test (Sprint **Step 11b**). Commits `03b0d50` (DC build) + `359d568` (AC's `reflection.md` draft) on `lane-c/cost`.
- **G1 dev live-test: DONE + PASSED (AC3, 2026-06-17).** The migration was applied to DEV and fully live-tested — the count-slice round-trip + the concurrent-append row-lock block test both pass (§5). **Only the PROD apply remains** (deploy-time, coordinated). Throwaway test data cleaned up; dev verified via the connection ref (`postgres.maqkdesopsskptpxjbqs`).
- **Scope changes from the original brief** (the "why it's different" record Justin asked for): **11a (1h-cache-TTL) is MOOT** (clustering, sprint Step 58, replaces it — and the SDK has no TTL knob anyway); **Step 12 (num_turns) is DEFERRED** (sprint Step 57 subsumes it); **11c (measurement) survives** and is now the lead cache deliverable. Detail §3.
- **Cross-lane seam:** one import + one checker block in `src/email/poll.ts` (Lane A's file) — both comment-flagged `⚠️ AC0`. §4.
- **reflection.md is a DRAFT for Mira** — voice is hers; needs her review before it's final. §6.
- **Two trivial follow-ups (SF1, N1)** to fold into convergence; **one v0.3 forward-flag (SF2)**. §7.

---

## 1. What shipped (files, on `lane-c/cost`)

| File | Change | Lane region |
|---|---|---|
| `backups/add-story-versions-and-consolidate-profile.sql` | **NEW** migration: `story_versions` table + atomic `consolidate_profile` RPC. **NOT applied** (AC applies dev-first). | Lane C |
| `src/reflection/consolidate.ts` | **NEW** module: `consolidateProfile` (orchestration), `checkReflectionConsolidation` (cron checker), pure predicates (`shouldConsolidate`, `pendingNotesCharLength`, `isValidConsolidatedStory`). | Lane C |
| `src/triage/classify.ts` | `loadReflectionSystemPrompt()` (new: core.md + reflection.md only) + excluded `reflection.md` from `loadCommonPrefix`'s force-load. | Lane C's region of classify.ts |
| `src/email/poll.ts` | **CROSS-LANE:** one import + one checker block in `startPolling`. | **Lane A's file** — see §4 |
| `src/db/llm-usage.ts` | `PATHWAY_ACTIVITY += checkReflectionConsolidation: "reflection"`. | shared, additive |
| `identity/activities/reflection.md` | **NEW** consolidation guidance (Mira draft). | AC-authored; Mira owns voice |
| `tests/test-reflection-consolidate.ts`, `tests/test-cache-prefix-stability.ts` | **NEW** tests. | Lane C |

**typecheck + tests:** `npm run typecheck` 0 errors; reflection tests + cache-prefix tests PASS; no regressions in the existing suites that touch these files (prompt-composition, record-pass, llm-usage).

---

## 2. The design (what was built + why this shape)

**The problem (cost-analysis Lever 3):** `profile_jsonb.pending_notes` accumulates and is force-loaded into the cached prefix on every query (`loadUserSuffix → buildPersonContext`) — a recurring re-read tax (~$2.65–4.26k/mo modeled at Mark's volume). Reflection-consolidation is the periodic per-user job that distills notes → tight `story`, **archives the raw**, clears the notes.

**Division of labor — mirrors `record_pass`/`append_pending_note` (Justin signed off):**
- **Evryn does the judgment** — `runEvrynQuery` with `core.md + reflection.md` only (NOT the full force-load — this is the *cost* lane; loading the ~28k prefix to shrink the profile would be self-defeating). She returns the consolidated story as her reply text. NO write tools.
- **The runtime does the persistence** — the `consolidate_profile` RPC archives-then-overwrites in ONE atomic, row-locked transaction. *Why runtime-writes (Justin asked):* the archive→write→clear must be atomic + race-safe, and that safety belongs in tested code, not in Evryn's tool-call ordering; and she has no story-write tool to mis-order.

**The four signed-off design intents (all verified by QC):**
1. **Trigger on NEW-NOTES char-length, NOT story/profile size** (`REFLECTION_NOTES_THRESHOLD_CHARS`, default 24000 ≈ ~6k tok). This is the **loop-killer** Justin spotted: consolidation always clears the consolidated notes → user drops back under threshold → cannot re-fire on the same material. Triggering on *story* size would loop on a legitimately-large story; triggering on *notes* never does.
2. **Soft target for the story, never a hard cap/truncate.** `REFLECTION_TARGET_CHARS` (10000) is passed as *guidance*; an oversized story fires a `notifyDev` alarm (`REFLECTION_STORY_ALARM_MULTIPLE`) but is still written — honoring Justin's "careful about a hard limit; what if someone has a detailed situation," and his "escalate, don't loop."
3. **Atomic, race-safe persistence.** Archive-INSERT + overwrite-UPDATE in one txn; `SELECT ... FOR UPDATE` row-lock serializes against a concurrent `append_pending_note`; the RPC clears **exactly the first N** notes (N = the count the runtime read fresh just before the LLM call), preserving any appended during the run. **No path loses a pending_note** (QC's cardinal hunt — confirmed).
4. **Validation guard.** Empty/garbage/refusal LLM result → no write, `notifyDev`, notes left intact (no data loss). Archive-before-overwrite makes even a *bad* synthesis recoverable from `story_versions`.

**Trigger cadence:** the checker scans hourly (`REFLECTION_CHECK_INTERVAL_MS`) but *fires* purely on the size gate — **no per-user daily cap** (Justin's call: "consolidate at a token count, even if more than once a day"). Population = `findUsersByStatus(["active","gatekeeper"])` minus system/admin roles (mirrors `checkProactiveOutreach`) → effectively Mark in v0.2.

**Architectural note:** this makes `profile_jsonb.story` written for the **first time in v0.2**. ARCHITECTURE.md currently says story is "written ONLY by Reflection (v0.3+), empty in v0.2." AC3 has drafted the ARCH update (the LEAN-consolidation-lands-in-v0.2 framing) — **proposed to Justin for diff-review before commit** (source-of-truth; his explicit ask). If not yet committed at convergence, it's in AC3's chat with Justin / can be picked up as a convergence #lock absorption.

---

## 3. Scope changes from the original Lane C brief (the "why different" record)

The brief listed Steps 10, 11a/b/c, 12. After loading the runtime + the new Phase 2b sprint diff (AC0's 2026-06-17 edit) and Justin's rethinking, the lane reshaped:

- **11a (switch to 1h cache TTL) — MOOT, dropped.** Two reasons: (1) **the Agent SDK exposes no cache-TTL knob** — verified (claude-code-guide research vs. the official Agent SDK TS reference + SDK GitHub issues #188/#864); the runtime goes through `query()`, which manages caching internally; there is no one-liner. (2) **Clustering (sprint Step 58) replaces it** — batching the day's reads into one ~10am burst keeps the cache warm by *volume*, which is the real lever (Justin: "the one-hour cache business is all moot now with the clustering"). The `ENABLE_PROMPT_CACHING_1H` env-var experiment is documented in the measurement plan as a *contingency* if clustering+measurement still shows cold pockets — but it's not built.
- **Step 12 (num_turns reduction) — DEFERRED.** Sprint Step 57 (runtime-does-bookkeeping, Phase 2b) subsumes it (the sprint says so explicitly). Not built today.
- **11b (cache-prefix byte-identity) — DONE.** Verified at source level + pinned with a regression test (`test-cache-prefix-stability.ts`): `loadCommonPrefix()` is byte-identical across calls and excludes reflection.md. **Input for sprint Step 59 (cache-partitioning SDK check):** the common prefix is byte-stable, but the *user-suffix tail* (story + pending_notes) is inherently volatile — every `append_pending_note` invalidates it. Whether the SDK caches identity as a *separate breakpoint* from the suffix (Step 59's question) is NOT determinable from our code — it's SDK-internal. **The `llm_usage` cache_create/cache_read columns are how Step 59 gets answered empirically** (see the measurement plan). This is why Reflection (shrinking the volatile suffix) matters regardless of the breakpoint answer.
- **11c (cache measurement) — DONE + refreshed.** `_evryn-meta/docs/working/2026-06-17-cache-measurement-plan.md` — week-one SQL against `llm_usage` (cache temperature, effective-TTL inference, per-query intercept, profile-bloat correlation, per-pathway spend). Refreshed to reflect clustering-moots-11a + a new message-history-token measurement (see §8).

---

## 4. Cross-lane seams (what AC0 must resolve at merge)

1. **`src/email/poll.ts` (Lane A / AC1's file)** — Lane C's ONLY touch: one `import { checkReflectionConsolidation }` (near the other db/user imports) + one `try/catch` checker block appended after the `checkMorningSweep` block in `startPolling`. Both annotated `⚠️ AC0 / Lane C`. **Merge action:** combine with Lane A's poll.ts changes; the checker block is additive and sits with the four sibling checkers. No logic overlap with Lane A's regions (Lane A works the email-handling + stale-check regions).
2. **`src/triage/classify.ts`** — Lane C touched `loadCommonPrefix` (the `["reflection.md"]` exclusion) + added `loadReflectionSystemPrompt` just above `cachedCommonPrefix`. Per the cross-lane map, **Lane B** touches the MCP-tools region of this file (Steps 15/18/37) — different region; merge surface is small but verify.
3. **`src/db/llm-usage.ts`** — one additive line in `PATHWAY_ACTIVITY`. Trivial.
4. **`identity/activities/reflection.md`** — new file, committed on `lane-c/cost` (`359d568`). **Do NOT merge to main until Mira has reviewed it** (it's an identity file; identity changes trigger a redeploy and are Mira's domain). See §6.

---

## 5. The migration apply + the live-test GATE (G1 — must happen before ship)

**Dev apply + G1 live-test: DONE + PASSED (AC3, 2026-06-17).** Applied to **dev** (`postgres.maqkdesopsskptpxjbqs`, verified via the connection ref — note `current_user` shows the generic `postgres` role under Supabase's pooler, so the *ref* is the authoritative project identifier) via the `backups/README.md` method (PG17 psql + `SUPABASE_DB_URL_DEV`). All G1 checks pass:
- **Objects:** `story_versions` created, RLS = `t`, `service_role` granted, no anon/authenticated, `consolidate_profile` is `SECURITY DEFINER`.
- **Count-slice round-trip** (ROLLBACK-wrapped): `consolidate_profile(user,'NEW STORY',3)` on a 5-note user → `{archived_count:3, remaining_count:2}`; story overwritten; **first 3 notes cleared, last 2 kept in order** (`[n4,n5]`); archive row = `OLD STORY` + `[n1,n2,n3]` + `note_count:3`; ROLLBACK clean (0 leftover).
- **Concurrent row-lock block test** (the invariant only a live DB proves): one session held `… FOR UPDATE` on the row; a second session's write to the same row **blocked** (`canceling statement due to statement timeout … while locking tuple … in relation "users"`) and never applied. Race-safety proven. Throwaway rows cleaned up.

**Only the PROD apply remains** — at the coordinated deploy (same recipe against `SUPABASE_DB_URL_PROD`), `pg_dump` before/after, re-pull `docs/schema-reference.md`. The migration is `CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE FUNCTION` — idempotent + additive (does not touch existing data). **Dev now carries the migration** (left applied, as the dev-first state).

---

## 6. reflection.md → Mira (identity coordination)

`identity/activities/reflection.md` is AC3's **close draft** for Mira (Justin: "write it now... put it in your handoff to AC0 to have Mira take a look. Get it close. Mira will tighten."). It carries the clarity-over-compression guardrails (stolen from AC CLAUDE.md + the writing protocol) + Justin's exact wording ("be concise, but clarity is more important — double-check that you never drop load-bearing signal"). **Mira owns the voice; route it to her before main-merge.** It's kept OUT of the always-loaded block (loaded only by `loadReflectionSystemPrompt`), so it costs nothing on normal queries.

**For Mira (from QC's SF2, refined by AC3):** pass-stamps (machine-generated `record_pass` notes) will eventually be a consolidation input *once contacts become active users (v0.3)* — they're on `lead`-status contacts today, who aren't in the consolidation population, so it does NOT bite in v0.2. When it does, reflection.md should say how to treat repeated machine-stamps (e.g. collapse N into "contacted Mark N times, no connection," preserving the `[shareable_with_user]` tag). **v0.3 flag, not a v0.2 fix.**

---

## 7. Follow-ups (tracked, not lost)

- **SF1 (should-fix, trivial):** the RPC hardcodes `reason = 'size threshold exceeded'` while the `story_versions.reason` column comment says "the runtime sets it." For v0.2 the recorded value is accurate; the comment/code just disagree. Fix at convergence: either add a `reason` param to the RPC (+ pass it from `consolidateProfile`) or tighten the two comments to "v0.3 adds a reason param for event-based triggers."
- **N1 (nit):** `read_identity_module`'s tool description (classify.ts ~line 800) still says "all activity modules are force-loaded — you already have everything," now untrue for reflection.md. Harmless (she never needs it outside consolidation, where the runtime loads it) but over-claims. Tweak the sentence at convergence.
- **SF2:** v0.3 forward-flag — see §6.
- **search_path on SECURITY DEFINER RPCs:** QC noted the new RPC doesn't `SET search_path` — but **neither does any existing RPC** (`append_pending_note` etc.). It *matches* the established posture; pinning `search_path` is a real hardening best practice but a **pre-existing project-wide gap**, not this build's regression. Defer to a v0.3 security-hardening pass across all RPCs (consistent with the deferred anon/authenticated default-privilege issue).

---

## 8. The message-history measurement (Justin's "where + keep-front-of-mind")

Justin raised a message-level memory idea (capture useful content, mark messages "remembered," load condensed memories + last-few-verbatim, pull-back by keyword/vector). **Decision (Justin agreed):** forward the *build* to v0.3 (it's the existing ARCHITECTURE "Conversation Compaction" open question; needs a retrieval path = real v0.3 scope), but **capture the cheap part — measurement — now.** Rationale it's likely secondary for v0.2: **forwards never enter the `messages` table** (`processForward` writes only `emailmgr_items`), so Mark's loaded history = his direct emails + gold/edge notifications + feedback, bounded — the *profile* force-load is the bigger tax (which Reflection targets). The Reflection-consolidation pattern IS the first instance of the "condense + archive + pull-back" shape his idea reuses.

- **WHERE we capture it (AC3's answer):** added to the cache measurement plan as a SQL query against the `messages` table — estimate per-query history-token load = sum of char-lengths of the 50 most-recent messages for the gatekeeper ÷ 4 (no new instrumentation needed; `getRecentMessages(userId, 50)` is what the runtime loads). It tells us with data whether message-history is secondary before we defer.
- **HOW we keep it front of mind (Justin forwarded this half to AC0):** the week-one measurement (this + the cache temperature work) is a working doc that **will be forgotten like the 6/12 cost-levers were** unless it's a tracked sprint Step. **AC0 action:** make the week-one cost+cache+history measurement a real `TODO` Step in `SPRINT-V0.2-HARDENING.md` (per the sprint's own new process-tightening rule), not just a working-doc breadcrumb. Candidate home: alongside Step 43 (cost-validation batch) / Step 11c.

---

## 9. Pointers
- Cost model: `evryn-team-workspace/shared/projects/product/research/2026.06.11 evryn-cost-analysis.md` (Lever 3 = this build).
- Measurement plan: `_evryn-meta/docs/working/2026-06-17-cache-measurement-plan.md`.
- Sprint home: `evryn-backend/docs/SPRINT-V0.2-HARDENING.md` (Step 10 = this; 11b done; 11a moot; 12 deferred to Step 57; Step 59 gets the 11b input above).
- Build commits: `lane-c/cost` `03b0d50` (DC), `359d568` (reflection.md).

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
