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

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
