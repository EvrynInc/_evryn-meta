# AC0 Packout for Next Instance — 2026-05-27 (mid-integration-test handoff)

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

**From:** AC0 (the instance that dispatched + verified Wave 1 in the morning, shipped Wave 2 in the afternoon, prepped the DB + reviewed Mira PR #3 + locked; handing off before compaction)
**To:** Fresh AC0 on next instance
**Date:** 2026-05-27 (afternoon)
**Status:** Active. Wave 2 live on production end-to-end. DB wiped clean for Mark. **Integration test (Phase 2) is staged and ready — Justin's about to drive it (or already is when you spin up).**

> **Note on references in this doc:** "the morning packout" or "this morning's packout" refers to `docs/sessions/historical/2026-05-27-ac0-packout-for-next-instance.md` — moved to `historical/` at this afternoon's lock. Load it if you want the longer architectural reference index + DC dispatch texts; this packout (the one you're reading) is the leaner mid-flight handoff.

---

## TL;DR — what to do first

**This packout is leaner than this morning's** because the matching #lock entry carries more of the persistent state. Read `_evryn-meta/CHANGELOG.md` (today's full entry) + `_evryn-meta/docs/current-state.md` (snapshot) — those give you 80% of the picture. This doc adds the operational state that doesn't fit in either.

**Your role for the next chunk of work:** observer + diagnostic helper during Justin's Phase 2 integration test, not driver. Justin plays both Operator (in #evryn-approvals via Slack) and Mark (via systemtest@evryn.ai). You watch, you keep him contextualized at re-orient moments, and you help diagnose if anything goes off-pattern.

**Three critical patterns you must hold cold** (all just landed in CLAUDE.md, but call them out at startup so they fire before you need them):
1. **Verify current branch before every commit** — `git -C <repo> status`. Shared local repos mean other agents' `git checkout` switches your working tree. Cost real time in this session, twice. Don't assume.
2. **For PR reviews, compare `git diff master..pr-branch` against `gh pr diff`** — if they disagree, the PR branch's base is stale; surface to author for rebase. Almost ate Mira's Wave 2 PR today.
3. **DC pings `#dev-alerts` for ALL ops pings, not `#team-alerts`.** If you ever dispatch DC for any work, use the post-correction dispatch text in this morning's packout (or just say `#dev-alerts` explicitly). Codified in CLAUDE.md.

---

## In-flight state at #lock time

**Wave 2 live on production.** Deploy `865af3cf` at 14:12 PT today. All six Wave 2 items shipped: Bug A (notify_slack ghost-message fix), Bug B (user-pathway cross-loading auto-load), `handleRevisionNotes` Operator-discipline normalization, `submitDraftForApproval` retry-rollback fix, plus Mira's two paired identity beats (notify_slack scoping cue + Operator-conversations-as-judgment-context discipline). Mira PR #3 (submit_draft failure-handling identity hint, post-Item-4 reinforcement) also merged today (commit `d4be5d0`) but takes effect at *next* Railway redeploy (which isn't queued — only matters on the unlikely send-failure path).

**Master state across repos:**
- `evryn-backend` master at `656d0c9` (last commit was the Mark-data backup)
- `_evryn-meta` main at this lock's commit (will be the latest after push)
- No stray branches anywhere (deleted both `mira/2026-05-22-bundle` and `mira/2026-05-27-*` post-merge)

**Mark's DB state — WIPED clean for the integration test:**
- UUID preserved: `72c22bc4-f18e-404d-a1c9-6fcdf7289b3a`
- Email preserved: `systemtest@evryn.ai`
- display_name "Mark" + full_name "Mark Titus" preserved
- `profile_jsonb` reset to empty ADR-027 template (story empty, pending_notes empty, structured fields null)
- `cross_user_notes` cleared
- `last_proactive_check_at` nulled (next cron fires fresh)
- All emailmgr_items WHERE user_id = Mark: deleted (2 rows)
- All messages WHERE sender_id / recipient_id / scope_user_id = Mark: deleted (6 rows total)
- **Backup** at `evryn-backend/backups/mark-data-pre-integration-test-wipe-2026-05-27.json` (committed `656d0c9`) — recovery is "re-insert from JSON" if the test produces an unrecoverable error.

**Cleanliness audit passed:** Operator's profile_jsonb has zero Mark references; other users' cross_user_notes have zero Mark references; other users' pending_notes have zero Mark references. The cross-instance-memory firewalls (ADR-030 scoping) held cleanly — wipe SQL was sufficient, no additional cleanup needed.

**Mira and DC are stood down for now.** Both have no pending work after today's ship + identity beats. Don't dispatch either unless something genuinely new comes up.

**Lucas is working in `evryn-team-workspace`** (separate repo, no cross-contamination risk). Already confirmed clear for him.

---

## Recommended startup load

Justin's directive carries over from the morning packout: **don't blow context loading everything; load enough to be effective + know what you don't know.**

### Tier 1: Essential at startup (small, always load)

1. `_evryn-meta/CLAUDE.md` — auto (the AC operating manual; gained today: directing-is-build-work expansion, Slack pings block, keep-Justin-contextualized rule, DC ping-channel discipline, branch-verify-before-commit, PR review file-state-vs-merge-base diff check). **Read CLAUDE.md fully** — it has more text added today than usual.
2. `_evryn-meta/docs/current-state.md` — auto.
3. `_evryn-meta/CHANGELOG.md` — read today's full entry; it carries the day's narrative arc.
4. `_evryn-meta/docs/hub/roadmap.md` — small; orients you in the company; load every session.
5. **This packout.** You're reading it.

### Tier 2: Load before dispatching anyone OR making any architectural claim

Per the new "Directing is build work" rule in CLAUDE.md:

6. `_evryn-meta/docs/hub/technical-vision.md` (391 lines)
7. `evryn-backend/docs/ARCHITECTURE.md` — at minimum these ranges (from this morning's packout's architectural reference index, still valid):
   - 114-200 (Operator Track + System Actors + Three Modes)
   - 632-780 (Identity Composition with the full pathway-by-pathway breakdown including the new APPROVAL-FLOW REVISION PATHWAY block)
   - 999-1006 (Outbound Approval Gate Invariant)
   - For integration test resume: also 502-575 (Pipeline Design) + 918-925 (Approval Gate)
8. `evryn-backend/docs/BUILD-EVRYN-MVP.md` — 68-99 (Critical Principles), 114-165 (Workflow), 379-417 (Build Order/Phase status). The full off-path drill-target map is in this morning's packout — re-reference if needed.

### Tier 3: Load for integration-test execution support

9. `evryn-backend/tests/integration-test-v02.md` — the protocol Justin is executing.
10. `evryn-backend/tests/fixtures/test-gatekeeper-profile.md` — Mark character + answer key (open in browser/editor during execution; this is *Justin's* reference, but if he asks "wait, what's Mark's stance on X?", you can check).
11. `evryn-backend/tests/fixtures/integration-test-script.md` — Justin's scripted lines.

### Tier 4: Trigger-load (only if X happens during the test)

(Carried forward from this morning's packout — all still valid.)

- Operator / cron / thread-scope behavior surprises you → ADR-030 full + Amendment 2026-05-22 + ADR-031 (late-scope recovery)
- Evryn produces output that looks off → `evryn-backend/identity/core.md` + the relevant activity module (`onboarding.md`, `gatekeeper-onboarding.md`, `triage.md`, `conversation.md`)
- Tool or SDK behavior surprises you → `_evryn-meta/AGENT_PATTERNS.md` §"SDK Integration & Tool Wiring"
- **Anything else off-pattern you can't ground in the above** → STOP, ask Justin before proceeding. Don't infer through gaps.

---

## Integration test execution support

**The test protocol** (per `evryn-backend/tests/integration-test-v02.md` + operator-guide.md lines 229-242):

1. AC verifies (and wipes if drift) DB pre-deploy. ✓ **Done by previous AC0 (you, today).** DB is clean.
2. DC deploys + smoke-tests. ✓ **Done.** Wave 2 live.
3. Justin tells Evryn via Slack as a NEW top-level message in `#evryn-approvals`: *"Hey Evryn — I want you to meet my friend Mark..."* (scripted intro at `evryn-backend/tests/fixtures/integration-test-script.md`).
4. Evryn does the **verify-and-lock beat** — looks Mark up in users table, presents verification block (name, brief description, company/context, role, status), waits for Justin to confirm, then calls `set_thread_scope({mark.uuid})` and announces the lock.
5. All Justin's subsequent operator messages about Mark go in that same Slack thread.
6. Evryn drafts an intro email to Mark → Justin approves at `#evryn-approvals` → email goes to systemtest@evryn.ai (Mark's DB email = his test alias).
7. Justin replies from systemtest@ as Mark, using the scripted responses + the character profile.
8. Evryn processes those replies via `processDirect`, builds Mark's `pending_notes` via `append_pending_note`.
9. Re-run synthetic fixtures (Day 2 fixture replay) → compare to original Day 2 results.

**What's new since the test was last paused (5/21):** Bug B's auto-load fires in `processDirect` (and `processForward` + crons) — when Evryn processes Justin-as-Mark's replies, she'll also see Operator-Evryn conversations *about* Mark loaded in her prompt with the discretion-floor label. Since the wipe cleared all Mark-scoped messages, the loaded section will be empty on early runs and start filling as the test progresses (Slack-Operator thread messages about Mark get `scope_user_id = mark.uuid` and load on future user-pathway invocations).

**What to watch for as observer:**
- Verify-and-lock beat fires correctly on the new thread (Evryn finds Mark, presents the verification block, waits for confirm).
- Intro email draft lands at review@evryn.ai with the proper approval format (subject line, classification metadata).
- Bug B's discretion-floor language behaves correctly when the loaded section is non-empty.
- Mira's PR #3 hint **does NOT fire** (assuming submit_draft doesn't fail — it shouldn't on a clean test path). If it does fire and Evryn handles it via notify_slack, that's the hint validating; the hint is live only at next Railway redeploy (which isn't queued).

**If something goes off-pattern:** apply the verify-before-claiming discipline (CLAUDE.md Context Discipline section). The cron-trigger lesson from this morning still applies — don't assert how anything behaves without reading the artifact that defines it, with this question in front of you.

---

## After the integration test runs + passes

Per the sequencing in current-state:

**adversarial test → go/no-go → Mark go-live email**

**Adversarial test character:** Justin's CEO call today (2026-05-27) was that Rachel-character is fine; adversarial test runs against post-go-live live-Mark system. Categories 1.4, 2, 4, 5, 6 are architectural (work regardless of gatekeeper); Categories 1.2, 1.3 (criteria leakage, cross-user leakage) become *more* relevant when running against real-Mark profile than the fictional Rachel setup. Doc-refresh is nice-to-have but not blocking. Full reasoning in `evryn-backend/docs/SPRINT-MARK-LIVE.md` backlog (the entry has "2026-05-27 update from Justin").

**Pre-Mark-live blockers still standing** (post-adversarial-test):
- **Emergency-alerts wiring** — code that triggers `#emergency-alerts` channel doesn't exist yet; silent 3am bugs would not wake Justin. The most operationally important blocker. Two-stage design in SPRINT backlog: small DC trip (~30 min) for `notifyEmergency()` wiring + .env var; then AC + Soren + Justin design pass on trigger conditions.
- **Pre-go-live STEP 0 cleanup** — full delete of test-Mark + recreate with real-Mark email + new UUID + clear inboxes + visual verify. Per `evryn-backend/docs/SPRINT-MARK-LIVE.md` lines 466-487. Critical and mechanical.

**Then Mark go-live email** (Justin sends).

---

## DC's flag #2 follow-up — DC's next trip

Of DC's 7 Wave 2 flags, 5 are in SPRINT-MARK-LIVE.md backlog and 1 shipped via Mira PR #3. The remaining one (#2) — `updateEmailmgrItem` metadata-merge inconsistency — was specifically flagged for DC to add a **JSDoc comment at the function definition** on his next trip (per Justin's call that DC's CLAUDE.md SCOPE GUARDRAIL excludes build details; inline code comment is the right home). When DC has a next trip touching `evryn-backend/src/db/emailmgr_items.ts` or similar, this should bundle in.

---

## Process patterns from today (already in CLAUDE.md but call them out at startup)

This morning's packout had an architectural reference index; this packout's equivalent is a process-discipline index. These all just landed in CLAUDE.md but flagging them here so they fire before you need them:

1. **Verify branch before every commit.** Communication Rules section. The two-strikes story is in the parenthetical. Don't make this a third.
2. **For PR reviews, compare file-state diff against merge-base diff.** Same section, right after the above.
3. **DC pings `#dev-alerts` for ALL ops pings, never `#team-alerts`.** Slack section in CLAUDE.md.
4. **Verify before claiming behavior — related context is not behavioral knowledge.** Context Discipline section. The cron-trigger story from earlier today is the canonical failure example.
5. **Keep Justin contextualized as you go.** Communication Rules. 10,000-ft session opener + 500-ft new-section overview. Reasoning: he doesn't read the detail docs you do, but at re-orient moments he's lethally sharp at catching what you miss.
6. **Directing is build work.** Context Discipline section. Dispatching DC/Mira, reviewing their work, editing architectural specs, runtime claims all count — read tech-vision + ARCH before any of them. The morning packout's tiered load list does NOT supersede this rule; the rule fires every time.

---

## Humility note — what you (and I) still don't know

Carrying forward from this morning's packout: AC0 has NOT exhaustively read the trust-and-safety spoke, user-experience spoke, vision-and-ethos spoke, long-term-vision spoke, business-model spoke, GTM spoke, bizops-and-tooling spoke. Most of `evryn-backend/src/` is unread (only `index.ts` full + `poll.ts` sections, plus what got read in passing during today's work). Most of `evryn-backend/identity/` is unread (only via diff during PR reviews).

**Specific things this AC0 (the one writing this packout) wishes he'd known preemptively:**
- The Edit tool fails silently if `old_string` has even one character off (asterisks around `*your*` got missed today — required re-read + retry).
- Local branch state affects ALL agents in the shared repo — explicit branch-verify is the only mitigation.
- The Phase 2 integration test protocol uses Mark's pre-existing user record (UUID preserved) — wipe is profile-only, not full delete+recreate. STEP 0 (real-go-live cleanup) is the full-delete-recreate path.

**Strategy for managing what you don't know:** when Justin asks a question you can't answer with sharp confidence, *tell him* — say "I haven't loaded that; let me check" — and then load surgically. The cost of a small targeted read is much smaller than the cost of confidently wrong information.

---

## Coordination notes for you

- **Justin operates as Conductor.** He bounces between AC0, Mira, Soren, AC1, DC, Lucas — sometimes multiple at once. Pings to him on `#team-alerts` are attention-taps (per the rule that landed via AC1 yesterday) — one short sentence routing him to the chat. Substance lives in the chat.
- **Per the new "ping every response" Justin set today** — even when it seems like he's right there, ping him. He's bouncing.
- **Justin is not a developer.** Concept-first then jargon; name patterns when they map to standard engineering concepts; explain reasoning + breadcrumb commands. (CLAUDE.md Working With Justin section.)
- **Justin doesn't read agent-to-agent notes by default.** When you synthesize something for him (e.g., "what did DC flag?"), translate internal references. You are the ambassador.
- **Commit discipline is strict.** Each commit needs explicit go-ahead from Justin in the immediately preceding turn. Workflow instructions don't authorize commits. The test before any commit: *"Did Justin's most recent message contain a specific command to commit or push?"* If no, pause and summarize.
- **Stage by file path explicitly.** Never `git add -A` / `git add .` / `git commit -am`. Parallel agents work in the same repos at the same time.

---

— AC0, 2026-05-27 (afternoon — mid-integration-test handoff)

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
