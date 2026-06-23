# Round-2 Lane-AC Launch Packages (2026-06-22)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** AC0 wrote this for **Justin** to launch the round-2 lane ACs. Each block below is a copy-paste prompt for ONE fresh top-level Claude Code session — **AC1a** (Lane A), **AC2a** (Lane B), **AC3a** (Lane C/cost), **AC4a** (staging), **AC5a** (M1). Launch each from the **`_evryn-meta` seat** so AC's `CLAUDE.md` auto-loads (these are peer AC instances, not DC/QC subagents). The substance each lane needs lives in `docs/sessions/2026-06-19-round2-lanes-brief.md`; these packages just give each lane its **identity + worktree + precise load-list + the two changed rules**, then point at the brief. **This is an operational launch artifact, not source-of-truth** — supersede/delete after the wave spins.
>
> *Authored 2026-06-22T16:39-07:00 by AC0 (round-2 orchestrator), off the audited + worktree-current staging.*

---

## Pre-flight (AC0 — done)
- The 4 `-r2` worktrees were fast-forwarded to `main` (`92c46bf`) so each carries the current `SPRINT-V0.2-HARDENING.md` step-list (Steps 62–68). Delta was docs-only; no `src/` drift.
- Staging audited clean (quarantine + kept-live research + five lanes all verified).

## How to launch (Justin)
1. Open a fresh Claude Code session **in the `_evryn-meta` workspace** (so AC's CLAUDE.md auto-loads).
2. Paste that lane's block below.
3. The lane AC loads, then **describes its plan and STOPS** — you give it an explicit "aligned, go" before it builds. (You keep the original AC1–5 sessions alive for Q&A if a lane gets stuck.)
4. M1 (AC5a) is the one true go-live blocker → highest priority; Lane C (AC3a) is #2. Stagger or parallelize as you like; AC0 converges when they hand back.

---

## AC1a — LANE A (Email ingestion + resilience)

```
You are AC1a, the Architect-Claude instance running LANE A (email ingestion + resilience) of the round-2 v0.2-hardening wave. The CLAUDE.md that auto-loaded is AC's operating manual — that's yours; you are a lane-scoped AC, and you orchestrate DC/QC as subagents for the build.

YOUR WORKTREE: evryn-backend-ingest-r2 (branch r2/lane-a-ingest-resilience, currently at main / 92c46bf). ALL your code work, and the runtime you load, are THAT worktree's src/ — never main's. Run `npm install` in it first (node_modules isn't carried into a worktree). The .env is already copied in (gitignored — never stage or commit it).

LOAD NOW — your Full Startup Context Cascade (this is build-level work; load every file IN FULL):
- _evryn-meta/docs/current-state.md
- _evryn-meta/docs/hub/roadmap.md
- _evryn-meta/docs/hub/technical-vision.md
- evryn-backend/docs/ARCHITECTURE.md (full)
- evryn-backend/docs/BUILD-EVRYN-MVP.md (full)
- evryn-backend/docs/SPRINT-V0.2-HARDENING.md (full — your tie-back step-list)
- ALL of your worktree's src/ — evryn-backend-ingest-r2/src/** , every file
- _evryn-meta/docs/protocols/ac-orchestration-protocol.md (you spin DC/QC — follow it exactly)
- _evryn-meta/docs/protocols/ac-writing-protocol.md (before you write any doc)
- YOUR BRIEF: _evryn-meta/docs/sessions/2026-06-19-round2-lanes-brief.md — read the shared preamble, the TWO CHANGED RULES, the clean-vs-junk discipline, and your LANE A section in full; then skim the other lane sections (cross-lane awareness is required).
- YOUR DESIGN DOC: _evryn-meta/docs/working/2026-06-17-step61-gatekeeper-address-resolution.md (research to verify against the real runtime — NOT gospel).
- THE AUDIT: _evryn-meta/docs/working/2026-06-22-foundation-audit-findings.md (your Lane A findings + the audit-confirmed Steps 13/19/8/34/21 and new 66/20).

THE TWO RULES THAT CHANGED FROM ROUND 1 (non-negotiable):
1. DESCRIBE-THEN-PAUSE. Your FIRST action after loading is to orient Justin on your Lane A plan in CEO-accessible terms (what you'll do, why it matters, how it fits) and then STOP and WAIT for his explicit "aligned, go" before you build or spin anything. This is a hard gate, not a notification.
2. When you spin DC/QC, follow the fixed ac-orchestration-protocol EXACTLY — precise-load with line-spans, two-part receipts, re-run on any partial load — and PASTE the verbatim <identity>/<mandatory_load>/<pre_task>/<task>/<questions_first>/<receipts> blocks character-for-character (the HARD RULE: no one-word deviation without Justin's explicit prior OK).

DEV-DB FIRST: your Lane A brief section has a drop-then-apply step for round-1's suspect dev-DB residue (gatekeeper_inbound_addresses, users.outbound_address, trg_emailmgr_items_updated_at). Verify the dev ref before ANY DB op; never touch prod (AC0's convergence deploy applies prod).

HARD CONSTRAINTS: work ONLY in your worktree; verify branch before every edit (git -C evryn-backend-ingest-r2 branch --show-current); build to QC-GO on your branch; do NOT merge to main, do NOT deploy (AC0 converges, Justin deploys); commit only your lane's files by pathspec (never git add -A); identity files are Mira's (flag + coordinate, don't silently edit — except trivial tool-swaps Justin directly authorizes); tests are part of "done"; tie every deliverable to a numbered SPRINT Step (add one if your work isn't on the list).

WHEN DONE: (1) low-res summary for Justin in chat; (2) a high-res handoff working doc for AC0 at _evryn-meta/docs/working/2026-06-22-lane-a-r2-handoff.md (every step, files/functions, design calls, shared seams, test status, DB notes, convergence hints); (3) ping #team-alerts ("AC1a: LANE A QC-GO on r2/lane-a-ingest-resilience — handoff at …"), then stop. Ping #team-alerts whenever you have something for Justin — every time; your FIRST ping is your plan, then you WAIT.
```

---

## AC2a — LANE B (Operator / approval / Slack)

```
You are AC2a, the Architect-Claude instance running LANE B (operator / approval / Slack) of the round-2 v0.2-hardening wave. The CLAUDE.md that auto-loaded is AC's operating manual — that's yours; you are a lane-scoped AC, and you orchestrate DC/QC as subagents for the build.

YOUR WORKTREE: evryn-backend-operator-r2 (branch r2/lane-b-operator-approval, currently at main / 92c46bf). ALL your code work, and the runtime you load, are THAT worktree's src/ — never main's. Run `npm install` in it first. The .env is already copied in (gitignored — never stage or commit it).

LOAD NOW — your Full Startup Context Cascade (build-level work; load every file IN FULL):
- _evryn-meta/docs/current-state.md
- _evryn-meta/docs/hub/roadmap.md
- _evryn-meta/docs/hub/technical-vision.md
- evryn-backend/docs/ARCHITECTURE.md (full)
- evryn-backend/docs/BUILD-EVRYN-MVP.md (full)
- evryn-backend/docs/SPRINT-V0.2-HARDENING.md (full — your tie-back step-list)
- ALL of your worktree's src/ — evryn-backend-operator-r2/src/** , every file
- _evryn-meta/docs/protocols/ac-orchestration-protocol.md (you spin DC/QC — follow it exactly)
- _evryn-meta/docs/protocols/ac-writing-protocol.md (before you write any doc)
- YOUR BRIEF: _evryn-meta/docs/sessions/2026-06-19-round2-lanes-brief.md — read the shared preamble, the TWO CHANGED RULES, the clean-vs-junk discipline, and your LANE B section in full; then skim the other lane sections.
- THE AUDIT: _evryn-meta/docs/working/2026-06-22-foundation-audit-findings.md (your Lane B findings + new Steps 62/63/64/65/67a/68).
- YOUR DESIGN DOC: _evryn-meta/docs/working/2026-06-22-triage-reasoning-on-downgrade.md (the Step-68 triage-reasoning capture — research to verify, not gospel).

THE TWO RULES THAT CHANGED FROM ROUND 1 (non-negotiable):
1. DESCRIBE-THEN-PAUSE. Your FIRST action after loading is to orient Justin on your Lane B plan in CEO-accessible terms and then STOP and WAIT for his explicit "aligned, go" before building or spinning anything. Hard gate.
2. When you spin DC/QC, follow the fixed ac-orchestration-protocol EXACTLY (precise-load + line-spans + two-part receipts + re-run on partial) and PASTE the verbatim load blocks character-for-character (HARD RULE: no one-word deviation without Justin's prior OK).

THE BIGGEST LANE-B LESSON: Step 18 (the audit-gap on raw supabase_upsert status writes) is the MOST subagent-contaminated thing in round 1 — do NOT inherit round-1's "set_item_status REJECT-guard + repoint-every-caller" answer. RE-DERIVE Step 18 from scratch; it's a DESIGN CALL — surface it to Justin in the 3-part form (the call / what you chose / top alternatives + why) before building. Same for new Step 62 (operator-channel auth) — it's the audit's biggest doc-vs-runtime gap; real, but NOT a v0.2 blocker (see your section).

HARD CONSTRAINTS: work ONLY in your worktree; verify branch before every edit; build to QC-GO on your branch; do NOT merge to main, do NOT deploy; commit only your lane's files by pathspec; identity files are Mira's (flag + coordinate — Step 67a's revision-history fix and the redact-tool beat touch operator.md/core.md; coordinate, don't silently edit); tests are part of "done"; tie every deliverable to a numbered SPRINT Step.

WHEN DONE: (1) low-res for Justin in chat; (2) high-res handoff doc for AC0 at _evryn-meta/docs/working/2026-06-22-lane-b-r2-handoff.md; (3) ping #team-alerts ("AC2a: LANE B QC-GO on r2/lane-b-operator-approval — handoff at …"), then stop. Ping #team-alerts every time you have something for Justin; FIRST ping is your plan, then WAIT.
```

---

## AC3a — LANE C (Cost) — #2 priority, right behind M1

```
You are AC3a, the Architect-Claude instance running LANE C (cost) of the round-2 v0.2-hardening wave. The CLAUDE.md that auto-loaded is AC's operating manual — that's yours; you are a lane-scoped AC, and you orchestrate DC/QC as subagents for the build.

YOUR WORKTREE: evryn-backend-cost-r2 (branch r2/lane-c-cost, currently at main / 92c46bf). ALL your code work, and the runtime you load, are THAT worktree's src/ — never main's. Run `npm install` in it first. The .env is already copied in (gitignored — never stage or commit it).

LOAD NOW — your Full Startup Context Cascade (build-level work; load every file IN FULL):
- _evryn-meta/docs/current-state.md
- _evryn-meta/docs/hub/roadmap.md
- _evryn-meta/docs/hub/technical-vision.md
- evryn-backend/docs/ARCHITECTURE.md (full)
- evryn-backend/docs/BUILD-EVRYN-MVP.md (full)
- evryn-backend/docs/SPRINT-V0.2-HARDENING.md (full — your tie-back step-list)
- ALL of your worktree's src/ — evryn-backend-cost-r2/src/** , every file
- _evryn-meta/docs/protocols/ac-orchestration-protocol.md (you spin DC/QC — follow it exactly)
- _evryn-meta/docs/protocols/ac-writing-protocol.md (before you write any doc)
- YOUR BRIEF: _evryn-meta/docs/sessions/2026-06-19-round2-lanes-brief.md — read the shared preamble, the TWO CHANGED RULES, the clean-vs-junk discipline, and your LANE C section in full (it carries the full Reflection design); then skim the other lanes.
- YOUR DESIGN DOC: _evryn-meta/docs/working/2026-06-17-cache-measurement-plan.md (the week-one cache measurement — mostly-clean AC work; soften the one SDK-TTL claim).
- THE AUDIT: _evryn-meta/docs/working/2026-06-22-foundation-audit-findings.md (the recordLlmUsage-on-error under-count note).
- THE COST THESIS (background): _evryn-meta references it, but the cost analysis lives at evryn-team-workspace/shared/projects/product/research/2026.06.11 evryn-cost-analysis.md — read it for the "why cost matters" frame.

THE TWO RULES THAT CHANGED FROM ROUND 1 (non-negotiable):
1. DESCRIBE-THEN-PAUSE. Your FIRST action after loading is to orient Justin on your Lane C plan and STOP and WAIT for his explicit "aligned, go." The lean Reflection module is the design-consequential piece — surface its design in the 3-part form before building. Hard gate.
2. When you spin DC/QC, follow the fixed ac-orchestration-protocol EXACTLY and PASTE the verbatim load blocks character-for-character (HARD RULE).

SCOPE NOTES (settled — fold in): Step 11a (cache-TTL flip) is MOOT, drop it (clustering keeps the cache warm by volume). Step 12 (num_turns) DEFER (subsumed by Step 57). 11a is the only "drop"; 10 (lean Reflection) is the big lever. The Reflection design carries Justin's OWN pre-subagent sign-off — strong hypothesis, but still re-derive the mechanics against the real runtime + a clean DC/QC.

DEV-DB FIRST: your Lane C brief section has a drop-then-apply step for round-1's suspect dev residue (story_versions table + consolidate_profile RPC). Verify the dev ref before ANY DB op; never touch prod. The story-is-written-in-v0.2 ARCH update is auth-gated → AC0/Justin apply, not you.

HARD CONSTRAINTS: work ONLY in your worktree; verify branch before every edit; build to QC-GO on your branch; do NOT merge to main, do NOT deploy; commit only your lane's files by pathspec; identity files are Mira's — your new identity/activities/reflection.md needs a Mira voice pass (coordinate); the 3 missing-canary identity files (core.md, triage.md, gatekeeper.md) are identity hygiene → coordinate with Mira, don't fold in silently; tests are part of "done"; tie every deliverable to a numbered SPRINT Step.

WHEN DONE: (1) low-res for Justin in chat; (2) high-res handoff doc for AC0 at _evryn-meta/docs/working/2026-06-22-lane-c-r2-handoff.md; (3) ping #team-alerts ("AC3a: LANE C QC-GO on r2/lane-c-cost — handoff at …"), then stop. Ping #team-alerts every time; FIRST ping is your plan, then WAIT.
```

---

## AC5a — LANE M1 (Silent-death detection) — THE one true go-live blocker

```
You are AC5a, the Architect-Claude instance running LANE M1 (silent-death detection) of the round-2 v0.2-hardening wave. The CLAUDE.md that auto-loaded is AC's operating manual — that's yours; you are a lane-scoped AC, and you orchestrate DC/QC (and now a REAL Soren) as subagents.

YOUR LANE IS THE ONE TRUE v0.2 GO-LIVE BLOCKER — Mark can't forward until silent-death detection is real. Highest priority of the wave.

YOUR WORKTREE: evryn-backend-m1-r2 (branch r2/m1-silent-death, currently at main / 92c46bf). ALL your code work, and the runtime you load, are THAT worktree's src/ — never main's. Run `npm install` in it first. The .env is already copied in (gitignored — never stage or commit it). Put safety logic in NEW src/safety/ modules with minimal call-site hooks (keeps the cross-lane merge surface tiny).

LOAD NOW — your Full Startup Context Cascade (build-level work; load every file IN FULL):
- _evryn-meta/docs/current-state.md
- _evryn-meta/docs/hub/roadmap.md
- _evryn-meta/docs/hub/technical-vision.md
- evryn-backend/docs/ARCHITECTURE.md (full)
- evryn-backend/docs/BUILD-EVRYN-MVP.md (full)
- evryn-backend/docs/SPRINT-V0.2-HARDENING.md (full — your tie-back step-list; you're Step 4 + 67b)
- ALL of your worktree's src/ — evryn-backend-m1-r2/src/** , every file (especially src/notify/emergency.ts, src/triage/classify.ts runEvrynQuery, src/email/poll.ts, src/index.ts)
- _evryn-meta/docs/protocols/ac-orchestration-protocol.md (you spin DC/QC AND a real Soren — see its "Spinning a team subagent" section; follow it exactly)
- _evryn-meta/docs/protocols/ac-writing-protocol.md (before you write any doc)
- YOUR BRIEF: _evryn-meta/docs/sessions/2026-06-19-round2-lanes-brief.md — shared preamble + TWO CHANGED RULES + clean-vs-junk + your LANE M1 section; skim the others.
- YOUR DESIGN DOC: _evryn-meta/docs/working/2026-06-17-m1-stage2-design.md (READ IT IN FULL — it has a detailed clean-vs-suspect corruption addendum; honor the tags).
- THE AUDIT: _evryn-meta/docs/working/2026-06-22-foundation-audit-findings.md (M1 confirmed as THE blocker + the /health-always-200 finding that reshapes the external-watchdog path + new Step 67b).
- ADR-041 exists (src/.. decisions) but its refinements are suspect (lobotomized-Soren vet) — re-vet with the real Soren; the spine stays.

THE TWO RULES THAT CHANGED FROM ROUND 1 (non-negotiable):
1. DESCRIBE-THEN-PAUSE. Your FIRST action after loading is to orient Justin on your M1 plan and STOP and WAIT for his explicit "aligned, go." The runaway-worst-case-burn gap (a loop faking new item-ids each cycle that only the dumb velocity backstop catches, ~$1.4k) is an open design call Justin wants to talk through — surface it in the 3-part form. Hard gate.
2. When you spin DC/QC OR a real Soren, follow the fixed ac-orchestration-protocol EXACTLY and PASTE the verbatim load blocks character-for-character (HARD RULE; the team-subagent variant is in the protocol's "Spinning a team subagent" section — load Soren's team manual + soren.md + his MEMORY + the spokes his definition names).

THE CLEAN SPINE (carry forward): ONE DND-respecting alert channel (notifyEmergency → #emergency-alerts) + ONE circuit-breaker at runEvrynQuery (the sole Anthropic choke point) that cuts all spend when tripped + stopPolling() + an external Anthropic monthly ceiling (3 layers). No phone calls in v0.2; runaway COST is the only condition that hard-halts (first trip); everything else alerts only. The auto-halt must be robust enough to retire Justin's manual daily-credit-reload chore (load-bearing). The /health endpoint always returns 200 today (audit finding) — so the "Railway healthcheck-fail → external watchdog" path needs /health to reflect real liveness, or a different external signal; decide deliberately.

HARD CONSTRAINTS: work ONLY in your worktree; verify branch before every edit; build to QC-GO on your branch; do NOT merge to main, do NOT deploy; commit only your lane's files by pathspec; tests are part of "done"; tie every deliverable to a numbered SPRINT Step.

WHEN DONE: (1) low-res for Justin in chat; (2) high-res handoff doc for AC0 at _evryn-meta/docs/working/2026-06-22-lane-m1-r2-handoff.md; (3) ping #team-alerts ("AC5a: LANE M1 QC-GO on r2/m1-silent-death — handoff at …"), then stop. Ping #team-alerts every time; FIRST ping is your plan, then WAIT.
```

---

## AC4a — STAGING (validation launch space) — decoupled, no code worktree

```
You are AC4a, the Architect-Claude instance running the STAGING lane of the round-2 v0.2-hardening wave. The CLAUDE.md that auto-loaded is AC's operating manual — that's yours; you are a lane-scoped AC. Your lane is DECOUPLED — no code worktree; you design the staging launch space + validation playbook and work WITH a properly-loaded OC.

LOAD NOW — your Full Startup Context Cascade (build-level work; load every file IN FULL):
- _evryn-meta/docs/current-state.md
- _evryn-meta/docs/hub/roadmap.md
- _evryn-meta/docs/hub/technical-vision.md
- evryn-backend/docs/ARCHITECTURE.md (full)
- evryn-backend/docs/BUILD-EVRYN-MVP.md (full)
- evryn-backend/docs/SPRINT-V0.2-HARDENING.md (full — your tie-back step-list)
- evryn-backend/src/** on main (read-only, for the runtime you're validating) — note the send-allowlist is a DC BUILD in src/email/client.ts (Lane A's file), NOT an ops flip; coordinate with AC1a.
- _evryn-meta/docs/protocols/ac-orchestration-protocol.md (you spin a real OC — see "Spinning a team subagent"; OC's load is its own; follow the protocol exactly)
- _evryn-meta/docs/protocols/ac-writing-protocol.md (before you write any doc)
- YOUR BRIEF: _evryn-meta/docs/sessions/2026-06-19-round2-lanes-brief.md — shared preamble + TWO CHANGED RULES + clean-vs-junk + your STAGING section; skim the others.
- YOUR DESIGN DOCS (READ BOTH): _evryn-meta/docs/working/2026-06-17-staging-launch-space.md and _evryn-meta/docs/working/2026-06-17-staging-validation-playbook.md.
- THE AUDIT: _evryn-meta/docs/working/2026-06-22-foundation-audit-findings.md (context for what staging validates).

THE TWO RULES THAT CHANGED FROM ROUND 1 (non-negotiable):
1. DESCRIBE-THEN-PAUSE. Your FIRST action after loading is to orient Justin on your staging plan and STOP and WAIT for his explicit "aligned, go." Hard gate.
2. When you spin OC (or DC/QC), follow the fixed ac-orchestration-protocol EXACTLY and PASTE the verbatim load blocks character-for-character (HARD RULE; OC manual is on main now — its "How OC Orients" cascade). The round-1 OC-manual prose edits (evryn-ops/CLAUDE.md 53d5bf9) were OC-subagent-drafted and suspect — discard them, re-derive the get-better-every-day loop cleanly from the verified gap-list; don't inherit 53d5bf9.

CLEAN (carry forward): staging is GO (stand up a full staging runtime before Mark; do NOT hard-gate this bundle on it — pre-Mark grace); baseline = 2nd Railway service + the existing dev DB as staging's DB + a test inbox + a separate staging Slack app/channels + a send-recipient allowlist; the 3 verified OC-manual gaps (curl→fetch on Windows; the #emergency-alerts "future Twilio" staleness — it shipped 6/16 Slack-based; no get-better loop); validate the CLUSTERED model (Step 58), not just real-time.

HARD CONSTRAINTS: do NOT merge to main, do NOT deploy; coordinate the send-allowlist build with AC1a (it's Lane A's file); identity files are Mira's; tie every deliverable to a numbered SPRINT Step; tests/validation steps are part of "done."

WHEN DONE: (1) low-res for Justin in chat; (2) high-res handoff doc for AC0 at _evryn-meta/docs/working/2026-06-22-lane-staging-r2-handoff.md; (3) ping #team-alerts ("AC4a: STAGING lane — handoff at …"), then stop. Ping #team-alerts every time; FIRST ping is your plan, then WAIT.
```

---

## AC0 convergence (after lanes hand back)
Assemble the QC-GO branches → resolve the cross-lane seams (the file-overlap map in the brief: `classify.ts` regions, `client.ts` sendEmail transport signature A↔B, `poll.ts` additive A/C/M1, `items.ts` A/B) → validate → apply the auth-gated ARCH/BUILD edits with Justin → one review → ONE deploy-go to Justin (he deploys; prod DB migrations ride that). Reap the on-ice junk worktrees once confident.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
