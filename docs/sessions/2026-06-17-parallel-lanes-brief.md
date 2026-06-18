# Parallel Lanes Brief — v0.2 Hardening Wave (2026-06-17)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** AC0 (pure orchestrator) wrote this to brief the parallel AC instances of the v0.2-hardening wave — **AC1/AC2/AC3** run the three sprint lanes here; **AC5** (M1) and **AC4** (staging) run under this same preamble but with their own detail docs (see the instance table below). **Everyone: read the shared preamble, then your section/doc, then skim the others** (cross-lane awareness is required — see step 1 of "Before you build"). The single source of truth for *what* each sprint step is remains `evryn-backend/docs/SPRINT-V0.2-HARDENING.md` — this brief points at sprint Step numbers; it does not re-describe them (one-home discipline).

---

## The shape of the day (so you know where you sit)

Justin is racing to have everything solid **before Mark forwards his first email**. **AC0 is a PURE ORCHESTRATOR** — AC0 builds nothing this wave; it answers questions, resolves cross-lane seams, threads everything into one deploy, and keeps context headroom clear for that convergence. Every build runs under a dedicated AC:

| Instance | Owns | Detail doc |
|---|---|---|
| **AC0** | orchestration + convergence (no build) | this file |
| **AC1** | Lane A — email ingestion + resilience | this file (Lane A) |
| **AC2** | Lane B — operator / approval / Slack | this file (Lane B) |
| **AC3** | Lane C — **cost** (incl. lean Reflection; #2 priority) | this file (Lane C) |
| **AC5** | **M1** — silent-death detection (the one un-backstoppable go-live blocker) | `docs/working/2026-06-17-m1-stage2-design.md` |
| **AC4** | **staging launch space** (decoupled — see note) | `docs/working/2026-06-17-staging-launch-space.md` |
| **Mira** | on-call for identity-coupled follow-ons | — |

- **Approval-gate-backstopped (AC1/2/3):** the sprint hardening — does NOT block Mark's first forward, but we knock it out now while we have runway. Quality ≫ speed; Mark's trust is the asset.
- **M1 (AC5)** is the protected race item. **Cost (AC3)** is #2.
- **Staging (AC4) is DECOUPLED from the deploy bundle** — it builds an *environment* (a validation tool), not a code branch that merges. It does not gate this bundle (pre-Mark grace); if ready in time we validate the bundle through it, else we fall back to a create-from-zero pass. So AC4 runs on its own track and is NOT part of the convergence merge.

**Convergence:** each *code* lane (AC1/2/3 + AC5/M1) builds **to QC-GO on its own branch — NOT merged to main, NOT deployed.** When you're QC-GO you hand off to AC0 (see "When your lane is done"). AC0 assembles the four code branches into one bundle, resolves cross-lane merges, validates (via AC4 staging if ready, else create-from-zero), and presents Justin **one review + one deploy-go → one `railway up`**. You never merge to main or deploy.

---

## ⚡ PING DISCIPLINE — the single most important coordination rule today (Justin)

Today Justin is running AC0 + five build ACs + Mira **and** consolidating most of his ops team. **He cannot babysit you — he needs flawless pings so no one sits blocked, losing time.** This is not optional and not "when convenient":

- **Ping the moment you (a) have a blocking question, or (b) are done / at a clean stopping point.** Never sit silently waiting — an un-pinged blocker is dead time he can't see.
- **Route by purpose (Justin's rule):**
  - **"I'm done" / "I'm blocked, need you" → `#team-alerts`** (via Node `fetch` to `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env`), prefixed with your tag (`AC1:`…`AC5:`). This is the channel that brings Justin *back to you*. Keep it a concise attention-tap; the substance goes in chat + your handoff doc.
  - **DC/operational record pings → `#dev-alerts`** (the build/ops record). Keeping "done/blocked" out of `#dev-alerts` keeps that channel low-noise so the record stays scannable.
- **A ping is part of the deliverable.** "Done but un-pinged" reads as "still working" — it silently deadlocks (he thinks you're going, you think he'll come back). If you're blocked, **ping AND keep advancing whatever else you can** while you wait.
- Use Node `fetch` for Slack — **not** bash+curl or PowerShell (both mangle/ prompt on Windows).

---

## LOAD FIRST (non-negotiable)

You are doing build-level work, so **load the Full Startup Context Cascade** per `_evryn-meta/CLAUDE.md` → SESSION STARTUP: this file's instruction is equivalent to Justin calling the full cascade — load every file in it *fully*, and load **all of your worktree's `src/`** (not just the files your lane touches — you need the whole runtime to reason about composition). Specifically:
- `_evryn-meta/CLAUDE.md` (auto), `docs/current-state.md`, `docs/hub/roadmap.md`, `docs/hub/technical-vision.md`
- `evryn-backend/docs/ARCHITECTURE.md` (full), `evryn-backend/docs/BUILD-EVRYN-MVP.md` (full), `evryn-backend/docs/SPRINT-V0.2-HARDENING.md` (full)
- **All of `<your worktree>/src/`** — every file.
- The orchestration protocol: `_evryn-meta/docs/protocols/ac-orchestration-protocol.md` (how you spin DC/QC) and the writing protocol before you write any doc.

---

## Before you build — you are the AC-in-charge, not a builder (READ THIS)

**These sprint lists were compiled on the fly.** We were deep in a context, tossed items on a pile as we found them, and *later* grouped them into thematically-adjacent lanes. **That grouping is a convenience, not a design.** The whole reason this work is going to an **AC** instead of straight to DC is so that your **higher-level judgment** shapes it. **Do not start at the microscopic level of the build in front of you.** Before you touch code, do this explicitly:

1. **Read the entire sprint doc and *this whole brief* — including the other two lanes.** Your build has to *compose* with what the other ACs are building. If your change and another lane's change touch the same seam, you need to see that now, not at merge.
2. **Place each item in the whole.** Consult `ARCHITECTURE.md` + `BUILD-EVRYN-MVP.md`: where does this work live in the system? Does the sprint's one-line framing still make sense against the architecture, or does the architecture suggest a better shape? **If a step's framing is wrong or a better approach exists, say so** — you are not obligated to build the sprint's literal phrasing.
3. **Reason from the runtime you loaded.** The runtime is the *actual* shape; the docs are the *intended* shape. They diverge. Ground every decision in what `src/` actually does.
4. **Recall the craft, every step.** Per CLAUDE.md's "stop and recall the craft" discipline: at each build decision, pause and ask *"what software-architecture best practices bear on this, right now?"* (DRY, single source of truth, structural-over-instructional invariants, naming that doesn't lie, composition over duplication). The sprint items are small; the seams between them are where damage hides.

**Then, before building, explain your day to Justin** (ping `#team-alerts` + the substance in chat): **in CEO-accessible terms** (concept first, then jargon), what you're doing today, why it matters, and how it fits the whole. Justin is not an engineer and is bouncing between instances — orient him plainly. This is a required step, not optional.

**Post-and-proceed, NOT wait-for-approval.** Posting your day-plan is a *required notification*, not a gate — **you do NOT wait for Justin to approve it before you start building.** Post it, then go. The post IS his async catch-opportunity: he reads it and interjects only if something looks off; otherwise you keep moving. Sitting idle waiting for his sign-off is the anti-pattern we're avoiding (it makes him a gate on every lane). The exceptions where you DO pause for him are the standing ones: a **major design call** (surface it, 3-part form) and **convergence** (you never merge/deploy). Everything else: orient, post, build.

---

## Design calls — make them, but surface the big ones

Justin's standing rule: **do the thinking and make the call yourself** — he'd much rather you decide than ask. **But a *major* design call that changes how the system works gets surfaced to him**, in this exact form:

> 1. **Here was the call** (what needed deciding).
> 2. **Here's what I chose.**
> 3. **Here were the top alternatives, and why I went this way over them.**

Minor/local calls: just make them and note them in your summary. When unsure whether it's "major," surface it — cheap.

---

## Hard constraints (every lane)

- **Work ONLY in your assigned worktree path.** Verify branch before *every* edit (`git -C <your-worktree> branch --show-current`) — these worktrees share one `.git/` pool; never edit on the wrong branch.
- **`npm install` in your worktree first** — `node_modules` is gitignored and not carried into a fresh worktree. Tests/typecheck won't run without it.
- **DB-touching lanes (A, C, staging) need the PostgreSQL 17 client** — it is NOT installed on this laptop (verified 2026-06-17). Install ONCE, machine-level (unblocks all DB lanes): `winget install PostgreSQL.PostgreSQL.17 --accept-source-agreements --accept-package-agreements` → lands at `C:\Program Files\PostgreSQL\17\bin\` (invoke by full path; NOT on the git-bash PATH). The connection vars (`SUPABASE_DB_URL_DEV`/`_PROD`/`_EAST` in `evryn-backend/.env`) + the dump/migration-apply recipes live in `evryn-backend/backups/README.md` — read it before any DB op. **You can WRITE + review a migration without psql; you only need it to APPLY (dev-first + pre/post `pg_dump`).** If the install needs UAC elevation it can't run from a non-interactive shell — ask Justin to run it once.
- **Build to QC-GO on your branch. Do NOT merge to `main`. Do NOT deploy (`railway up`).** That's AC0 + Justin at convergence.
- **Real DC + real QC.** Per the orchestration protocol, a subagent named "DC"/"QC" *without their CLAUDE.md loaded* is a generic subagent, not them. Load their context in the brief. QC reviews every real code change.
- **Commit only YOUR lane's files** — stage by pathspec, never `git add -A`. If you see files modified that you didn't touch, stop and check.
- **DC pings → `#dev-alerts`** (not `#team-alerts`). YOUR pings to Justin → `#team-alerts`, prefixed with your instance tag (`AC1:`/`AC2:`/`AC3:`).
- **Tests are part of "done,"** not a follow-up.
- **Identity files (`identity/*.md`) are Mira's.** Today's three lanes are designed to be **pure runtime — no identity edits.** If a step pulls you toward an identity file, stop, flag it to Justin, and coordinate with Mira — don't fold it in quietly.
- **When QC-GO:** ping `#dev-alerts` ("LANE X QC-GO on `<branch>` — ready for AC0 convergence") and tell Justin in chat. AC0 takes it from there.

---

## Cross-lane file-overlap map (so you don't collide blind)

Separate worktrees make working-tree corruption impossible; the only cost is **merge conflicts on shared files**, which AC0 resolves at convergence. Stay in *your region* of a shared file:

- **`src/triage/classify.ts`** — Lane B touches the **MCP-tools region** (Steps 15/18/37); Lane C touches **`loadCommonPrefix` + `runEvrynQuery`** (cost). Stay in your region.
- **`src/email/client.ts`** — Lane A owns it (inbound fetch + outbound `sendEmail`). Lane B's Step 14 (outbound threading) needs a `sendEmail` change → **Lane B: coordinate with Lane A / flag it; AC0 resolves.**
- **`src/db/items.ts`** — Lane A's Step 13 adds a DB trigger (migration, not logic); Lane B's Step 18 + Step 36 touch `updateEmailmgrItem`. Mostly Lane B's region.

---

# LANE A (AC1) — Email ingestion + resilience
**Worktree:** `c:/Users/jbmcg/Evryn/Code/evryn-backend-ingest` · **Branch:** `lane-a/ingest-resilience`
**Owns:** `src/email/poll.ts`, `src/email/process.ts`, `src/email/detect.ts`, `src/email/client.ts`
**Theme:** the email-pipeline fixes that bit live in Phase 6 + the resilience batch. Highest immediate Mark-experience value.

Sprint Steps (read each in the sprint for full detail):
- **13** — `emailmgr_items.updated_at` never advances on UPDATE → add a `moddatetime` trigger (mis-times stale-detection today). *(DB migration — **write + review now, not blocked**; the APPLY is dev-first + pre/post `pg_dump` per ADR-037 and needs the PostgreSQL 17 client — install it per the setup constraint above, or route the apply to AC0/Justin. `backups/README.md` has the recipe.)*
- **16** — internal-address skip (denylist `review@evryn.ai` + aliases in the inbound guard — root cause of the S2 phantom-user cascade).
- **17** — empty-body sender-aware bounce (move the empty-body decision *after* the cheap sender lookup; known user → deterministic warm bounce, no LLM).
- **19** — empty `Message-ID` defeats dedup → fall back to Gmail `email.id`.
- **20** — sustained-outage alert storm → dedupe/rate-limit the transient-failure alert.
- **21** — held-cursor + Gmail `historyId` expiry resilience.
- **22** — proactive-cron heartbeat log-noise (hour-gate it).
- **29** — comment accuracy (transient/permanent classification).
- **34** — EVR-72: `checkFollowUps` loads the gatekeeper, not the contact.
- **40** — dead-config sweep (`TEST_RECIPIENT`/`NODE_ENV` + stale `client.ts` comment).
- **32 (SPLIT — AC1 caught this cross-lane seam, 2026-06-17):** Lane A owns only the `client.ts` half — make `sendEmail` injectable + test *its* failure surfacing. The retry-on-send-failure *rollback* logic being tested lives in `executeApproval` (`approval/flow.ts` = **Lane B's** file) → **that test moves to Lane B (AC2).** Coordinate at convergence.

---

# LANE B (AC2) — Operator / approval / Slack surface
**Worktree:** `c:/Users/jbmcg/Evryn/Code/evryn-backend-operator` · **Branch:** `lane-b/operator-approval`
**Owns:** `src/notify/slack.ts`, `src/approval/flow.ts` (+ the MCP-tools region of `src/triage/classify.ts`, + `src/db/items.ts` `updateEmailmgrItem`)
**Theme:** operator-facing behavior + the approval/draft surface + audit-trail integrity.

Core Steps:
- **14** — outbound Gmail quoted-history collapse + runtime-owned threading (auto-populate `in_reply_to`/`thread_id`). *Touches `client.ts` (Lane A) — coordinate/flag.*
- **15** — operator re-draft context (the *conversational* re-draft path carries prev-draft + triggering note as discrete context).
- **18** — `supabase_upsert` status changes bypass the lifecycle audit → **small design call first** (typed status-change tool vs. special-case vs. restrict raw status writes), then build. `DC+QC`.
- **26** — drop the `Gold/Edge/Reply` triage code from the *operator* subject line.
- **27** — review-email approval-handle reposition (right after `--- END DRAFT ---`).
- **33** — idempotency key on draft submission (status-guard so `submitDraftForApproval` is safe to re-call).
- **37** — `redact_user_from_message` MCP tool.
- **31** — phantom-parser test coverage (exercise the real `parseSlackMessage` — load-bearing for the silent-diversion guarantee, ADR-035).
- **32 (Lane-B half — reassigned from Lane A, 2026-06-17):** the retry-on-send-failure **rollback** test for `executeApproval` (`approval/flow.ts` — your file). AC1 owns the `client.ts` `sendEmail` DI + its surfacing test; you own the `executeApproval`-level retry/rollback test (Item-4 was verified by code-read only — this gives it a real failure-path test). Coordinate with AC1 at convergence on the DI seam.

If time: **23** (pong-timeout warns downgrade), **28** (stale collision help-string), **24**/**38** (low-pri).

---

# LANE C (AC3) — COST  *(#2 priority — right behind M1)*
**Worktree:** `c:/Users/jbmcg/Evryn/Code/evryn-backend-cost` · **Branch:** `lane-c/cost`
**Owns:** `src/triage/classify.ts` (`loadCommonPrefix` + `runEvrynQuery` regions), a new Reflection module, a `story_versions` migration.
**Why this is #2:** cost won't block day one, but Mark's ~200/day inbox can bury us fast. The pass-stamp (PREVENT) already shipped; this is the BOUND half. **Read `evryn-team-workspace/shared/projects/product/research/2026.06.11 evryn-cost-analysis.md`** (the 7-lever model) before you design.

Steps, in this order:
- **11a — cache-TTL flip (do FIRST — the cheap, big lever).** Verify the runtime isn't on Anthropic's default 5-min cache TTL; switch to the **1-hour TTL** in `runEvrynQuery`. The single highest cost-leverage one-liner (cold-pocket avoidance).
- **11b** — verify nothing per-call breaks the prefix's byte-identity (cache-prefix integrity).
- **11c** — document the **week-one cache-create-vs-read measurement plan** (resolves the $2k↔$6.5k spread — this is a plan/ops deliverable, not code).
- **10 — lean v0.2 Reflection-consolidation (the big structural lever — DESIGN CALL → surface to Justin → build).** A periodic per-user read→write that re-synthesizes accumulated `pending_notes` into a tight `story`, archives the raw to a new `story_versions` table, clears the notes — shrinking the force-loaded profile (~28.7k → ~2.5k tok) → cutting cache-read on **all** ~200/day queries. **LEAN scope ONLY** — token-cutting consolidation; the full matching-aware Reflection (relevance triggers, confidence audits, cross-user `evryn_knowledge`, binding-TTL) stays v0.3 (ADR-027). This is the design-consequential piece of the whole wave — surface your design to Justin in the 3-part form before building. (Sequencing: the pass-stamp already shipped, so consolidation won't immediately re-bloat — good to proceed.)
- **12** — `num_turns` reduction (low-pri; largely falls out of the pass-stamp — revisit after 10/11).

---

## When your lane is done
Two deliverables — **a low-res one for Justin and a high-res one for AC0** (they serve different readers; don't conflate them):

1. **Low-res, for Justin (chat):** a CEO-accessible summary — what shipped, why it matters, in plain English. Justin needs the *where-are-we*, not the engineering.
2. **High-res, for AC0 (a working doc):** write `docs/working/2026-06-17-lane-<X>-handoff.md` that **actually makes the build make sense to a peer AC at full resolution** — every step touched, exact files/functions, design calls made *and* surfaced, shared seams touched (and how), test status, migration/DB notes, and anything convergence-relevant (merge-order hints, conflicts you foresee). **Do not rely on Justin to translate engineering back to AC0 — he's explicitly not the man for that job.** ACs speak to each other at high resolution, in writing; Justin gets the low-res. This doc is what AC0 actually converges from.
3. **Then ping `#team-alerts`** (it's a "done" tap that brings AC0/Justin back): `"AC<n>: LANE <X> QC-GO on <branch> — handoff at docs/working/2026-06-17-lane-<X>-handoff.md"`, and stop. **Do not merge, do not deploy.** AC0 converges. (Per the ping-discipline rule: done/blocked → `#team-alerts`; the build/ops *record* → `#dev-alerts`.)

---

# LANE B (AC2) — SALVAGE ADDENDUM (2026-06-18T16:31)

> **Why this exists:** the file-sync failure means **all subagent work this lane is confirmed junk** (compromised DC/QC/research loads). The worktree `lane-b/operator-approval` (commits `bc7cc1b` · `ab6b915` · `1a0f9ac` · `4446ef0`) is being **scrapped** — nothing in it carries forward; don't read it for the rewrite. This addendum is for the next AC0 to rebuild the Lane B brief *right*: (Part 1) decisions/findings/process-changes, (Part 2) cross-lane pitches, (Part 3) outputs *outside* the worktree that survive the scrap + a corruption read, (Part 4) my honest opinion. **Every item carries a provenance parenthetical and flags subagent influence** — so we consciously see what crept in from the junk subagents.
>
> **Provenance key:** `[Justin]` he drove it · `[AC2-direct]` my own first-principles reasoning / direct observation, no subagent · `[SUBAGENT]` originated in a subagent → **treat as junk** · `[mixed]` combination, broken down inline.
>
> **The subagents I ran (ALL suspect):** **DC#1** (trip-1 build → `bc7cc1b`) · **QC#2** (trip-1 review) · **DC#3** (trip-2 build → `ab6b915`) · **QC#4** (final pass — *this is the one that **confabulated**, falsely claiming it "carried ARCHITECTURE.md from a prior pass"*) · **CCG#5** (claude-code-guide research) · **QC#6** (re-run w/ ARCHITECTURE.md). The **entire Lane-B code** was DC#1+DC#3; the **entire quality gate** (3 GO/NO-GO verdicts) was QC#2/#4/#6.

## Part 1 — Decisions, findings & process-changes (roll into the rewritten brief)

The lane's *scope* (steps 14/15/18/26/27/28/31/32/33/37) barely moved; what changed is the **solution shape**, and most of that shape is **downstream of junk QC**.

1. **Step 18 grew into "single-path `set_item_status` + a REJECT guard."** `[mixed]` The sprint already offered the design options (typed tool vs special-case vs restrict); I picked the typed-tool **[AC2-direct]**; the enum + `escalated`-as-golden-bridge + choosing REJECT over my ROUTE rec was **[Justin]**; but the reason REJECT needed scaffolding at all came from **[SUBAGENT: QC#2]** (#2). *Rewrite: the audit-gap is real (it's in the sprint); the guard's exact shape should be re-derived by a clean DC/QC, not inherited.*
2. **B1 — "the REJECT guard strands Evryn because her instructions still point at the old tool."** `[SUBAGENT: QC#2]` — **the single most load-bearing finding of the lane, and it came from a junk QC.** It spawned the identity repoints, the AC1 cross-lane note (Part 2 #1), and the bad_actor/matched beats. *Caveat: the B1 problem is mechanically checkable from the code (reject `supabase_upsert`-status while `triage.md`/`core.md`/`poll.ts` still say "use `supabase_upsert` for status" → she walls), so it's probably real — but the RESOLUTION is suspect judgment; re-derive clean.*
3. **B1-a — bad_actor (and matched) item-terminalization is un-instructed.** `[SUBAGENT: QC#4 — the confabulating one]`, then **[Justin]** extended it ("bad_actor needs a user-record stamp + a note; matched needs instructions too — get it in"). Distrust the QC seed especially.
4. **The whole "repoint every caller" workstream** (identity files + a runtime prompt in AC1's lane). `[SUBAGENT: QC#2 + QC#4]` — **scrutinize hardest; most subagent-derived, and it reached into another lane.**
5. **"Do it once — don't route-then-reject; fix the callers now."** `[Justin]` (when I over-recommended a route-then-reject migration — and my over-caution was itself shaped by the fragility QC#2 surfaced, so even this framing was subagent-prompted).
6. **Threading (Step 14): runtime-owned; cross-account threading is impossible.** `[AC2-direct + Justin]` — "a mailbox can only thread messages it holds, so a curation sent to a *different* inbox won't group" was **[AC2-direct]** first-principles email behavior; the new-email-vs-thread ballot answer was **[Justin]**. **NOT subagent — clean.**
7. **"Different inbound inbox vs. communication inbox" → new sprint Step 61.** `[Justin]` flagged it; AC0 added it. **NOT subagent.** (Couples to Lane-B threading.)
8. **`users.status` typed-tool gap → defer to the S1 "retire generic `supabase_upsert`" sweep.** `[Justin + AC2-direct]` — Justin noticed the bad_actor user-stamp uses `supabase_upsert`; I explained `set_item_status` is `emailmgr_items`-only and `users.status` has no audit-gap. **NOT subagent.**
9. **Subagent fresh-spawn / no-resume / confabulation discipline.** `[AC2-direct + mixed]` — I *noticed* QC#4 confabulating **[AC2-direct]**; I verified `SendMessage`/resume is unavailable in this env via ToolSearch **[AC2-direct]**; CCG#5 **[SUBAGENT]** only corroborated the general SDK model (hedged). **Load-bearing facts self-verified.** (Ironically, this finding is *about* the failure being debugged.)
10. **Process/scope notes** `[non-subagent]`: Step **32** was split mid-wave (AC1 caught the seam; the `executeApproval` rollback-test half came to Lane B) `[AC1]`; Justin authorized **mechanical** identity tool-name swaps to be done now + flagged to Mira (voice untouched) `[Justin]`; QC was batched to one pass per build round (a token-mgmt choice) `[AC2-direct]`.

## Part 2 — Cross-lane pitches (left Lane B; another lane may have acted)

1. **→ AC1 (Lane A): the `poll.ts:584` + `process.ts:283` repoints** (`supabase_upsert`-for-status → `set_item_status`). `[SUBAGENT: QC#2/#4]` — I gave Justin exact find/replace; **Justin reports AC1 made them verbatim.** **Suspect-subagent contamination that crossed into AC1's lane.** AC1's worktree scraps too, so the code vanishes — but **the rewritten AC1 brief must NOT inherit "repoint poll.ts" as a given;** re-derive whether the reject-guard premise even survives a clean Lane-B rebuild.
2. **→ AC1 (Lane A): Step-14/61 threading coordination** (don't engineer cross-account threading; capture the designated outbound address + original subject on the item). `[AC2-direct]` (+ Justin's Step-61). **NOT subagent — sound to carry forward** (re-confirm against the clean rebuild).
3. **→ Mira (via AC0's batch): the identity beats** (ignored/bad_actor/matched → `set_item_status`; operator redact → `redact_user_from_message`). `[SUBAGENT: QC#2/#4 + Justin]` — **the whole Mira identity-repoint batch is downstream of junk QC.** Mira should NOT voice/ship them until the underlying need is re-confirmed by a clean DC/QC.

## Part 3 — Outputs OUTSIDE the worktree (survive the scrap) + corruption read

*(The 4 worktree commits are NOT listed — they're in the scrapped worktree.)*

| Output | Where | Source | Corruption read |
|---|---|---|---|
| **`docs/working/2026-06-17-lane-b-handoff.md`** | `_evryn-meta` · **UNCOMMITTED on disk** (survives — not in the worktree) | AC2-written, but it's the **record of the suspect chain** (DC builds, QC verdicts, B1/B1-a) | **HIGH — scrap/archive.** This addendum supersedes its useful content for AC0. |
| **`evryn-quality/CLAUDE.md` @ `06eaa9b`** | `evryn-quality` · **COMMITTED** | I added a "Patterns This Role Watches For" section — the *"guard is half a change"* pattern, **from [SUBAGENT: QC#2]** | **HIGH — URGENT FLAG.** (a) Pattern from a junk QC; (b) **this IS the `evryn-quality/CLAUDE.md` that wasn't syncing** — my commit may collide with the sync-repair. **Tell whoever's repairing QC's file that `06eaa9b` exists; recommend revert + reconsider.** |
| **`_evryn-meta/CLAUDE.md` @ `83a3ecb`** | `_evryn-meta` · **COMMITTED** | Subagent fresh-spawn/no-resume discipline — `[AC2-direct]` core, CCG#5 corroborated | **LOW — probably keep.** Self-verified facts; hedged where it leaned on CCG#5; content is *about the failure being debugged*. Sanity-check, don't reflex-scrap. |
| **`evryn-team-workspace/CLAUDE.md` @ `fffe372`** | `evryn-team-workspace` · **COMMITTED** | Same subagent discipline | **LOW — same.** Team should be aware; "resume exists but verify it's exposed" is appropriately hedged. |
| **Database / migrations** | — | — | **NONE.** Lane B was runtime/identity only. Confirmed. |

## Part 4 — My honest read (per "be smart about it")

- **Throw out hardest:** the **B1/B1-a → "repoint every caller" → identity beats + the AC1 note** chain (Part 1 #2–#4, Part 2 #1/#3). It's the bulk of the lane's net-new shape and almost entirely downstream of junk QC (#2, #4). **Don't even trust that REJECT is the right design** — re-derive from a clean DC/QC.
- **Materially un-influenced by subagents (my opinion — AC0 judges):** the **threading design** (#6, Part-2 #2), the **`users.status`/S1 flag** (#8), the **Step-61 insight** (#7), and the **subagent-discipline CLAUDE.md edits** (#9 / Part-3 rows 3-4). These rest on Justin + my own first-principles reasoning + self-verified facts, with subagents at most *confirming*. Carry forward with a sanity-check, not a reflex-scrap.
- **Needs a human decision NOW:** the **`evryn-quality/CLAUDE.md` commit `06eaa9b`** — it touches the file at the center of the sync failure. Surface it to whoever's repairing QC's file *before* they reconcile, so it isn't silently baked in or left as a confusing diff.

---

# LANE C (AC3) — POST-MORTEM ADDENDUM (2026-06-18)

> **Why this exists:** the subagent load protocol misfired this wave (unsynced files), so **all subagent work in Lane C is confirmed suspect and is being scrapped** with the worktree (`evryn-backend-cost` / `lane-c/cost`). This addendum captures, for AC0 rewriting the next Lane C brief: (B) the decisions/learnings to fold in, each provenance-tagged; (C) the Reflection design (clean — settled pre-subagent); (D) cross-lane pitches; (E) outputs that escaped the worktree + how corrupt I think each is; (F) my overall read. **Provenance tags:** `(Justin)` = your call · `(AC)` = my own reading of the runtime/docs · `(SUBAGENT — suspect)` = came from/through a spawned subagent.
>
> **Subagents I spawned (all suspect):** (1) a `claude-code-guide` research agent — "does the Agent SDK expose a 1h cache-TTL knob?"; (2) **DC** — the Reflection build; (3) **QC** — the review (returned GO). Per the load-protocol failure, treat all three as junk.

## B. Decisions / scope changes to fold into the next brief

1. **DROP Step 11a (switch to 1h cache TTL) — it's MOOT.** *(Justin — your decision to cluster the day's reads into one ~10am batch (Step 58) keeps the cache warm by volume, replacing the TTL lever. A `claude-code-guide` subagent also claimed the Agent SDK exposes no TTL knob — **(SUBAGENT — suspect), re-verify** — but the moot conclusion stands on your clustering regardless of that claim.)*
2. **Step 12 (num_turns reduction) — defer; Step 57 (runtime-does-bookkeeping) subsumes it.** *(AC — I read this in AC0's own Phase 2b sprint addition, which says so explicitly. Not from my subagents.)*
3. **11b + 11c are the surviving cache deliverables; 11c (measurement) becomes the lead.** *(AC reframe, because 11a went moot.)* The **11b byte-identity finding** — the common identity prefix is byte-stable, but the per-user suffix (story + pending_notes) is volatile (every `append_pending_note` invalidates that tail) — is my own runtime read **(AC)**. The regression *test* that pinned it was DC-built **(SUBAGENT — suspect)**.
4. **11b feeds sprint Step 59 (cache-partitioning SDK check):** whether the SDK caches identity as a *separate* breakpoint from the per-user suffix is SDK-internal and can only be answered empirically from `llm_usage`'s `cache_create`/`cache_read` columns. *(AC — pitch to the Phase 2b cost AC / Step 59.)*
5. **Message-level memory idea → forward the BUILD to v0.3, MEASURE now.** *(Justin pitched the "capture useful stuff, mark messages remembered, load condensed + last-few-verbatim, pull-back by keyword/vector" idea; AC judgment to defer the build (it's the existing ARCHITECTURE "Conversation Compaction" open question + needs a retrieval path) and measure now.)* Supporting fact — **forwards never enter the `messages` table (only `emailmgr_items`)**, so a gatekeeper's loaded history is bounded — is my own read of `process.ts` **(AC)**.
6. **Make the week-one cost/cache/history measurement a tracked sprint Step** (not just a working-doc breadcrumb — per the sprint's own process-tightening rule). *(Justin forwarded the "keep it front of mind" half to AC0; AC recommendation.)*
7. **ARCHITECTURE.md needs an update when the work is redone:** `profile_jsonb.story` is now written in v0.2 (the doc currently says "Reflection-only, v0.3, empty in v0.2"). *(Justin's earlier call that lean Reflection lands in v0.2; AC drafted the edit, you diff-reviewed + approved + asked to lighten the jsonc. The edit itself was in the worktree → scrapped → re-do.)*
8. **Canary finding (persists regardless of worktree):** 4 of the 10 identity files lacked the truncation canary — **`core.md`, `activities/triage.md`, `situations/gatekeeper.md`, and the new `reflection.md`** (the other 6 had it). The canary injecting into the prompt is proven-fine (6 files already do it in prod). *(Justin flagged the gap; AC identified the exact 4. NOT subagent-related — worth fixing in the canonical identity files independent of all this.)*
9. **N1 / SF1 / SF2 / search_path were QC findings → (SUBAGENT — suspect); re-derive with a real QC.** N1 = stale `read_identity_module` tool description; SF1 = `reason`-column comment mismatch; SF2 = pass-stamps will feed consolidation (I argued it's moot for v0.2 because passed contacts are `lead`-status and not in the consolidation population — that *reasoning* is my own runtime read **(AC)**, but the flag originated with QC); search_path-not-set on SECURITY DEFINER RPCs. The N1 "fix" I applied was QC-driven and also touched **Lane B's region** of `classify.ts` (the MCP-tools block) — a cross-lane seam regardless.
10. **Process learnings (CLEAN — AC's own; useful for any lane / worth a permanent home):**
    - Tests run via `tsx tests/<file>.ts` — there is **no `npm test` script**, and vitest's default glob doesn't match the `test-*.ts` naming.
    - `.env` does **not** propagate into a new worktree (it's gitignored; `git worktree add` only checks out tracked files) — a fresh worktree needs its `.env` created/copied.
    - **Dev/prod DB safety (important):** dev and prod share the *same* Supabase pooler **host**, and `current_user` returns `postgres` for **both** — so neither distinguishes them. The **only** reliable dev/prod tell is the project **ref** in the connection username (`postgres.<ref>`: dev = `maqkdesopsskptpxjbqs`, prod = `wvaaqwapueycyxyhxdnh`). Verify the ref before any DB write. *(Worth adding to `backups/README.md`.)*

## C. The Reflection design — CLEAN, reusable as-is (settled pre-subagent)

This whole design was settled by **AC + Justin BEFORE any subagent was spun** (I presented it, you refined + signed off, *then* I spun DC to build it). The implementation is junk, but **the design spec is sound and AC0 can hand it to a properly-loaded DC unchanged:**
- **Trigger on accumulated *pending-notes* size, NOT story/profile size** *(Justin — you caught that triggering on story size would loop; notes-trigger self-limits because consolidation clears the notes).*
- **Soft target for the story, never a hard cap / truncate** — oversized story alarms (`notifyDev`) but is still written *(Justin — "careful about a hard limit; what if someone has a detailed situation," and "escalate, don't loop").*
- **Runtime-orchestrated deterministic persistence, mirroring `record_pass`:** Evryn returns the consolidated story as reply text (no write tool); the runtime persists it. *(AC — mirrors the existing `record_pass`/`append_pending_note` pattern I read in the runtime.)*
- **Atomic, race-safe write:** archive-before-overwrite in ONE transaction; `SELECT … FOR UPDATE` row-lock; clear EXACTLY the first N notes (N read fresh just before the LLM call) so notes appended mid-run survive. *(AC proposed; you asked "what does atomic mean," I explained, you approved.)*
- **A `story_versions` archive table** (old story + raw notes + new story + count) — archive-before-overwrite makes a bad synthesis recoverable. *(AC.)*
- **Validation guard:** empty/garbage/refusal LLM result → no write, alert, notes intact. *(AC.)*
- **Reflection guidance = a Mira-editable `identity/activities/reflection.md`, loaded ONLY in the consolidation pathway** (kept OUT of the force-load so it costs nothing on normal queries); the consolidation query loads `core.md` + `reflection.md` only. *(Justin — your call that the instructions be a Mira-editable file the runtime injects.)* The draft I wrote is in the worktree (scrapped), but its substance (clarity-over-compression guardrails + your exact "be concise, but clarity is more important — double-check you never drop load-bearing signal" wording) is reusable. **Still needs a Mira voice pass.**
- **Trigger mechanics:** a poll-loop checker (sibling to the existing cron checkers), size-gated, **no per-user daily cap** *(Justin — "consolidate at a token count, even if more than once a day")*; population = active/gatekeeper users.

## D. Cross-lane pitches (for AC0 to route)
- **→ Lane B:** if N1 is re-done, it touches `classify.ts`'s MCP-tools region (Lane B's). *(But N1 is a suspect QC finding — re-derive first.)*
- **→ Phase 2b cost AC / Step 59:** the 11b byte-identity finding (B.3/B.4).
- **→ AC0:** make the week-one measurement a tracked sprint Step (B.6).

## E. Outputs that ESCAPED the worktree (cleanup targets) + corruption read

1. **DEV DATABASE — a DC-authored migration is APPLIED and PERSISTENT. ⚠️ This is the one piece of subagent *code* that survives the worktree scrap.** I applied DC's migration to the dev Supabase project (`maqkdesopsskptpxjbqs`), creating table **`story_versions`** + function **`consolidate_profile(uuid,text,integer)`**. I reviewed + live-tested them myself, but the SQL is **DC-authored (SUBAGENT — suspect)**, so per your principle it's junk. **Recommended cleanup (dev only):** `DROP FUNCTION IF EXISTS public.consolidate_profile(uuid, text, integer); DROP TABLE IF EXISTS public.story_versions;` — **I can run this on dev on your word.** (All throwaway test rows were already cleaned up; these two schema objects are the only residue.) **Corruption: HIGH.**
2. **`_evryn-meta/docs/working/2026-06-17-cache-measurement-plan.md`** (committed to `_evryn-meta` `main`). AC-written; the SQL queries are my own work. **Corruption: LOW** — the one tainted thread is the §0 "the SDK has no TTL knob" framing from the `claude-code-guide` subagent (re-verify), which doesn't undermine the plan (clustering moots 11a anyway). *Recommend: keep, soften that one claim.* Mostly salvageable.
3. **`_evryn-meta/docs/working/2026-06-17-lane-c-handoff.md`** (committed to `_evryn-meta` `main`). AC-written, but it documents and **vouches for** the DC build + QC-GO + the live-test as if validated. **Corruption: HIGH as a "this work is good" artifact.** Its AC-original parts are superseded by *this* addendum. *Recommend: AC0 ignore the handoff and use this addendum; delete or mark the handoff superseded.*
4. **Slack pings** (#team-alerts + #dev-alerts, ~8 attention-taps). Ephemeral; no cleanup. *Note:* the `#dev-alerts` "LANE C QC-GO" ping is now a **false signal** in the channel history (the work isn't genuinely QC-verified) — flagging for the record.
5. **No CLAUDE.md changes from me.** *(You had `CLAUDE.md` open and it showed modified in `git status` — that was your edit; I left it untouched.)*

## F. My overall read (you asked for my opinion — here it is)
- **The Reflection DESIGN (§C) and the scope reshaping (B.1–B.6) are materially CLEAN.** The design was settled by you + my own runtime reading *before* any subagent ran; the scope changes flow from your clustering decision and AC0's sprint, not my subagents. **AC0 can reuse the design spec confidently** and re-brief a properly-loaded DC from it.
- **The IMPLEMENTATION (DC's code) and the REVIEW (QC's GO + N1/SF1/SF2/search_path) are junk — scrap entirely** with the worktree.
- **The dev DB migration is the one persistent subagent-code artifact outside the worktree — DROP it.**
- **The measurement plan is mostly clean AC work** (one suspect technical claim to re-verify); **the handoff is moot** (it vouches for scrapped work).
- **Honest self-check on whether subagents crept into my *thinking*:** the design — no (it preceded them). The 11a-moot call — reinforced by a suspect subagent finding but stands independently on your clustering. The QC-sourced nitpicks (N1/SF1/etc.) — yes, subagent-influenced; drop and re-derive. Net: the load-bearing thinking (the design + the scope) is clean; the suspect material is confined to the implementation, the review, and a couple of technical sub-claims I've flagged.

---

# ADDENDUM — Lane A (AC1) session capture for the re-run (2026-06-18)

> **Why this exists:** the subagent-load protocol was **CONFIRMED misfiring** this wave (identity/context files weren't synced — QC's for sure, DC's too), so **ALL Lane A subagent work is junk** and the worktree `evryn-backend-ingest` is being shelved. Lane A spun **7 subagents — 4 "DC" builds** (`0430a6f`, `30db607`, `3f8d3d4`, `d2d98af`) **+ 3 "QC" reviews** (all returned a now-meaningless GO). Captured for **AC0's re-brief**. *(Full standalone copy also committed at `docs/working/2026-06-17-lane-a-RERUN-CAPTURE.md` — written first as a collision-safe fallback while this shared brief was being concurrently appended by sibling lanes; this inline copy is the canonical one.)*
>
> **Provenance tags:** `(Justin)` = his call · `(AC1-clean)` = my analysis from the **original, pre-subagent** runtime (full-cascade load happened BEFORE any subagent) · `(AC2/AC0)` = cross-lane input · `(⚠️ SUBAGENT)` = surfaced/shaped by a suspect subagent → **re-derive clean.**
>
> **Headline opinion for AC0 (Justin asked):** the *design decisions* are **materially un-corrupted** — Justin's calls + my reads of the clean original runtime + AC2/AC0 inputs. Subagents *built to* these designs, didn't author them. **Junk:** every *implementation* (`src/` + migration SQL, shelved) and every *QC "GO"/"verified-safe" stamp* (suspect QC → nothing verified, even where my AC-review agreed). ⚠️-tagged items need clean re-derivation. **Net: the thinking is reusable; the building and verifying must be redone.**

## Part 1 — Decisions / findings (roll into the re-brief)

1. **Step 34 / EVR-72 — sprint phrasing is WRONG (fix it).** Runtime *already* loads the gatekeeper (`checkFollowUps`→`findUserById(item.user_id)`; `user_id`=forwarder). Fix is NOT switch-scope-to-contact (would leak contact-private notes into a gatekeeper-facing follow-up) — it's **add the contact's name+status to the prompt text** via the ADR-036 FK. "Enabled by the FK" is the tell: needing the FK proves the fix *adds* contact info. *(AC1-clean — verified against the original runtime; Justin's "I bet it loads the contact" prompted the verify; neither his bet nor the sprint text matched the code.)*
2. **Step 17 empty-body bounce = DIRECT send bypassing the approval gate — allowed ONLY because deterministic/fixed-template/no-LLM/no-PII (pre-authorized content), respects `SEND_ENABLED`, audited to `messages`.** Bounce *copy* = placeholder → **Mira owns wording; must stay deterministic** (the whole basis for the bypass). *(Justin, ballot A. Gate-tension was AC1-clean from ARCHITECTURE's Outbound-Approval-Gate. The "`sendEmail` isn't an MCP tool" reassurance was ⚠️ SUBAGENT — re-confirm clean.)*
3. **Step 21 cursor resilience = time-bounded catch-up, NO new table.** Cold-start/`historyId`-expiry → fetch "everything since the last processed email" (from existing data — newest `emailmgr_items.created_at`), larger page, dedup absorbs overlap; replaces the "last 10 inbox" fallback that dropped mail on restarts. *(AC1-clean; no-new-table was my call. Justin approved, ballot B.)*
4. **Step 32 = SPLIT** — Lane A owns only the `client.ts` `sendEmail` injectable-transport seam (+ its surfacing test); the `executeApproval` retry/rollback test → **Lane B**. *(AC1 caught the seam; AC0 formalized; Justin ballot D.)*
5. **Step 13 must be a DB TRIGGER reusing `public.touch_updated_at()`** (already on `users` via `trg_users_updated_at`), NOT `moddatetime`; trigger is required because Evryn's raw status writes bypass `updateEmailmgrItem`. *(Trigger-not-app-code is AC1-clean. "Reuse `touch_updated_at` + `DROP TRIGGER IF EXISTS`" was ⚠️ SUBAGENT (trip-1 QC) but I independently verified it against the real schema dump → sound.)*
6. **Step 61 (gatekeeper-address resolution) — full design exists, is the cleanest surviving artifact.** Inbound lanes (many→one via a `gatekeeper_inbound_addresses` table) + settable `users.outbound_address` (gold destination, decoupled from inbound) + **escalate unregistered-lane forwards** (don't triage blind — the bug Justin reacted to). Email-only v0.2 floor; multi-channel = v0.3. *(Design = AC1-clean (pre-Step-61-subagent) + Justin's all-(a) ballot + AC2/AC0's outbound model. Doc: `docs/working/2026-06-17-step61-gatekeeper-address-resolution.md`. Build = ⚠️ SUBAGENT.)*
7. **Step 61 outbound/threading model:** gold → the gatekeeper's *designated* destination; threads into the original only if that destination is the same account holding it (AC2 headers), else standalone w/ original subject quoted. No cross-account threading. Lane A SETs destination + STASHes original subject; **AC2 Step 14 USEs them.** *(AC2 via Justin + AC0.)*
8. **Minor builds (AC1-clean designs; implementations junk):** Step 16 internal-address sender-skip; Step 19 external-id dedup fallback (`messageId||gmailId`); Step 20 rate-limit transient alert + remove a double-`notifyDev`; Step 22 hour-gate the proactive heartbeat; Step 29 comment accuracy; Step 40 stale `sendEmail` comment.
9. **Orchestration:** ran as two batches (mechanical-now vs design-pending-on-ballot); AC0 added "post-and-proceed"; the migration dev-rehearsal is the Lane-A AC's job ("AC applies"), Justin confirmed. *(AC1+AC0+Justin.)*

## Part 2 — Pitched to OTHER lanes (AC0: roll into THOSE briefs)

- **→ Lane B:** (a) the Step 32 `executeApproval` retry/rollback test; (b) `sendEmail` gained a `transport` param — Step 14 must compose with that signature; (c) **AC2's Step 18 `set_item_status`** — Lane A's `checkFollowUps` prompt must reference it (not `supabase_upsert`), a **convergence dependency** (prompt + tool same bundle). *(swap commit `d2d98af` is junk; clean re-run re-adds once Lane B's clean Step 18 exists.)*
- **→ AC0/sprint:** fix the Step 34 framing (Part 1 #1); **Step 58 clustering** touches `poll.ts` — seam = the synchronous per-email triage trigger (`handleNewEmail`→`processEmail`→`processForward/Direct`→`runEvrynQuery`). *(AC0 Step 58 + AC1-clean seam analysis.)*
- **→ Step 48 onboarding (⚠️ SUBAGENT-surfaced, sound — re-derive):** runbook MUST register **Mark's PRIMARY email as an inbound lane** — else, once Step 61 ships, his own forwards escalate instead of triaging. *(Surfaced by Step-61 QC; a sound deduction from the design.)*
- **→ Ops (⚠️ SUBAGENT-surfaced — verify):** a DC test failed `original_from_user_id ... not found in schema cache` → maybe prod PostgREST lacks ADR-036's column (real silent-failure) or a test-env artifact. Verify clean.

## Part 3 — Outputs that SURVIVE the worktree scrap + corruption

1. **🔴 DEV DB — both migrations APPLIED to `Evryn Product — Dev` and PERSIST (the one needing action).** I ran psql myself (sound), but the SQL was DC-authored (suspect)+suspect-QC'd. Live in dev: `trg_emailmgr_items_updated_at` trigger; `gatekeeper_inbound_addresses` table; `users.outbound_address` column+grants. **PROD untouched.** **Recommend: ROLL BACK the dev changes** (drop trigger/table/column) so the clean re-run starts fresh (the `IF NOT EXISTS` guards would otherwise skip recreating, leaving suspect structure that could conflict with a clean DC's design). AC1 can roll back now (psql + dev URL) on Justin's go.
2. **`docs/working/2026-06-17-step61-gatekeeper-address-resolution.md`** (committed). **Corruption: LOW** — authored BEFORE the Step-61 subagent (it built *from* this); clean design. **Reusable.** Caveats: the ⚠️ Step-48 primary-lane note (sound, re-derive); its "proposed ARCH/BUILD edits" need clean-AC re-review before applying.
3. **`docs/working/2026-06-17-lane-a-handoff.md`** (committed). **Corruption: HIGH as a trustworthy record** — describes/vouches-for the suspect subagent work (the 4 commits, 3 GOs). Recommend shelve/supersede.
4. **`docs/working/2026-06-17-lane-a-RERUN-CAPTURE.md`** (committed `6c4319b`) — the standalone copy of THIS addendum (collision-safe fallback). Redundant with this inline copy; keep or delete, AC0's call.
5. **evryn-meta commits** `393228d`/`7952ed3`/`44ab67e`/`6c4319b` on `main` — added the working docs above. Survive (different repo from the worktree).
6. **Slack pings** announced "Lane A QC-GO" / "dev rehearsal done" — **now false.** Not files; AC1 can post a one-line retraction on Justin's go.
7. **NO `CLAUDE.md`/identity/Linear changes** (Lane A was pure-runtime). **Housekeeping:** the worktree `.env` (live DB creds) — remove it if you *shelve* rather than delete the worktree.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
