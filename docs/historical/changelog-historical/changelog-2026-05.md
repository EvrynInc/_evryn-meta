# Changelog Archive — _evryn-meta, May 2026

> **Post-hoc archive note:** this per-repo May archive was built **2026-07-23 by splitting the former unified cross-repo May changelog, months after the fact** — it may be slightly inaccurate or incomplete. If you're hunting for something that should be here and it isn't, **check the other repos' changelogs** — it may have been mis-filed in the moment or mis-routed in the split. (The verbose "Files committed this lock" lists that the original entries carried were dropped in the split — git history is the authoritative file-level record.)

---

## 2026-05-30 evening (AC0 — handoff #lock: ADRs 034+035 + worktree dig-out + 3 PRs in flight from Mira/Soren/DC3 + Monday packout)

- **AC CLAUDE.md branch-discipline rule tightened from "before commit" to "before EDIT, not just commit"** + surface-to-Justin-on-multi-agent-activity + worktrees-per-agent as the durable shared-tree fix with one-line setup command. Team-workspace CLAUDE.md gained the same rule (adapted for team agents). Driven by 2026-05-29 evening AC0 making unstaged edits in evryn-backend without checking branch (Mira's checkout had silently switched the shared tree).
- **Per-agent worktree dig-out executed for evryn-backend.** AC at `c:/Users/Justin/Evryn/Code/evryn-backend-ac/` on master; Soren at `evryn-backend-soren/` on `soren/build-doc-linear-tickets`; DC3 at `evryn-backend-dc3/` on `dc3/wave3-review`; Mira keeps `evryn-backend/` on her bundle branch. EVR-110 created for Lucas (R: lucas, A: justin, Backlog) to roll out the worktree pattern as standing practice post-Mark.
- **Monday handoff packout** at `_evryn-meta/docs/sessions/2026-05-30-ac0-monday-handoff.md`. Yesterday's packout archived to `historical/`.
- **Final sweep verified all 4 main repos + 3 worktrees clean and in sync with origin.** Mira's tree even cleaned up her untracked scripts. Nothing held in chat-only ephemeral state.

---

## 2026-05-29 evening (AC0 — Phase 4 done + DC1 Wave 3 shipped pre-Mark + Mira + DC3 + AC1 paused + DC CLAUDE.md "AC's spec is a contract")

- **DC CLAUDE.md gained "AC's spec is a contract" rule** (Build Mandate section, after "Gate on Operational Requirements"). Distinguishes DC's domain (implementation choices — code structure, library choice, internal sequencing, testing strategy — use judgment freely) from AC's domain (cross-agent sequencing, mailbox protocol, commit/deploy gates, dossier shape, architectural decisions touching multiple agents) where DC follows the spec or surfaces the deviation before acting. Driven by the wait-for-Mira violation above. Justin's approved wording, example sentence dropped per his "feels redundant" call.
- **Cadence + process discipline that landed this session** (in packout; promotion-to-CLAUDE.md is candidate work, not done): (a) **persistence-rule nuances** — DC/Mira/v0.3 lists update only after Justin says "good to add"; rolling status updates much less often; respond+ping BEFORE writing so Justin doesn't wait; (b) **division of labor during live tests** — Justin has eyes on Slack + email, AC has eyes on EVERYTHING else (DB state, Railway logs, tool calls, lifecycle, scope, audit trails). Justin can do in tens of minutes what AC can do in milliseconds — the look-at-backend ownership lives with AC.

---

## 2026-05-29 (AC0 — integration test Day 1 + Day 2: empirical load-discipline material, Justin's caching insight, new DC list to 7 items, Mira pile to 4 items, v0.3 deferred questions surfaced)

- **AC0 CLAUDE.md / DC CLAUDE.md / team CLAUDE.md / Soren agent def updates 2026-05-28:** Railway CLI flag discipline + `--help` pointer (the prior packout's "9-line truncation" framing was AC0 using the wrong invocation); cross-repo file references in chat output use `../`-prefixed sibling paths (in-document path convention unchanged); "Stop and recall the craft, every time" pause discipline in Architectural Mandate / Build Mandate (and as a memory note to Soren); Soren MEMORY.md note from AC0 framing the discipline as tactical companion to his 2026-05-27 "soul-load" framing.
- **Railway: Hobby → Pro upgrade 2026-05-29.** 4× longer log retention (30 days vs 7), much higher CPU/RAM ceilings, collaboration support. $15/mo delta; pays for itself in time saved on the next "where did the logs go" hunt.
- **#lock executed light** per `docs/protocols/lock-protocol.md` (Founding Team current-state explicitly deferred to Soren per Justin's instruction; Linear update deferred; operator guide deferred until DC fixes ship). Settings.local.json absent, MEMORY.md clean, DB backups within 1-week threshold (2026-05-27), .env unchanged, no ADRs written this session (caching question deferred to v0.3 ADR-012 amendment work with Soren), no Hub/spokes changes, no identity-file changes shipped (Mira pile queued), no Build doc changes (DC list captured in session doc).

---

## 2026-05-27 (AC0 — Wave 2 shipped end-to-end: ARCH coherence + Mira identity beats + DC runtime; CLAUDE.md additions for directing-is-build-work, Slack pings, keep-Justin-contextualized)

- **CLAUDE.md gained three additions surfaced during today's dispatch work.** (1) Always-read-tech-vision-and-ARCH rule expanded from "doing build-level work" to "doing or *directing* build-level work" — dispatching other agents, reviewing their work, editing architectural specs, runtime claims. Closes the gap where the rule didn't fire on dispatch tasks because they pattern-matched as "coordination" rather than "build." Lands "Directing is build work" as standalone sentence. (2) New Slack pings block alongside the existing `#dev-alerts` entry — names `SLACK_TEAM_WEBHOOK_URL` (in `evryn-team-workspace/.env`) + Node fetch pattern + naming convention for parallel AC instances. (3) New Communication Rules bullet — "Keep Justin contextualized as you go" — 10,000-ft session opener + 500-ft new-section overview. Reasoning: Justin doesn't read the detail docs AC does, and re-orient moments are where he's lethally sharp at catching what AC misses.
- **DC ping-channel discipline corrected.** AC0's continuity-style DC dispatch text in the packout told DC to ping `#team-alerts` for deploy-ready/done — wrong. DC pings `#dev-alerts` for ALL ops pings: (a) he doesn't have `SLACK_TEAM_WEBHOOK_URL` (it's in `evryn-team-workspace/.env`, outside his repo); (b) his pings are a valuable shipping record AC instances can scroll back through; `#team-alerts` is too noisy (~50/day) for that purpose. Fixed: CLAUDE.md got a new paragraph in the Slack section; packout's DC dispatch texts (continuity + cold-spin) updated to specify `#dev-alerts`.
- **Two new branch-discipline patterns landed in AC CLAUDE.md** (LEARNINGS stubs 49-50): (1) **Verify branch before every commit** — shared local repos mean another agent's `git checkout` switches your working tree; bit AC0 twice in this session. (2) **For PR reviews, check file-state diff against merge-base diff** — `gh pr diff` (merge-base) can be misleading when the PR branch's base is stale; `git diff master..pr-branch` (file-state) is what merge actually does; caught Mira's Wave 2 PR based on pre-rebase Wave 1 bundle branch.
- **Packout for next AC0** at `_evryn-meta/docs/sessions/2026-05-27-ac0-packout-mid-integration-test.md` (leaner than morning packout because this #lock carries more persistent state). Next AC0 picks up mid-integration-test — Justin about to drive Phase 2 via the opening message in `#evryn-approvals`.
- **#lock executed** per `docs/protocols/lock-protocol.md`. Settings.local.json, MEMORY.md, DB backup recency, .env, ADR check, Hub/spokes, AGENT_PATTERNS, Linear all confirmed clean / not-applicable / already-current.

---

## 2026-05-27 (AC standalone — Supabase ops: Data API grant discipline added to v0.3 scope; Evryn-Agents project allowed to freeze; light #lock)

- **ADR-021 amended: "Evryn-Agents" Supabase project allowed to freeze.** SDK-era project (paused 85 days) flagged by Supabase for permanent freeze in 5 days (~2026-06-01). Justin chose to let it freeze rather than restore. Schema preserved in `evryn-team-agents/sql/schema.sql`; per Supabase, data remains downloadable from dashboard even post-freeze — what's lost is the ability to restore as a live Postgres instance. ADR-021's "frozen as insurance" framing still holds for the codebase; the database itself is now archived. Addendum dated 2026-05-27 added to the ADR.

---

## 2026-05-26 → 2026-05-27 (AC0 — Wave 1 dispatched + shipped + verified; ADR-033 Accepted; Wave 2 staged; #lock full + packout for next AC0)

- **DC CLAUDE.md gained Build Mandate retry-with-backoff bullet (LIVE as `065e1c4`).** Triggered by DC's Wave 1 bonus investigation of the 5/4 + 5/11 missing-review-email symptom — `submitDraftForApproval` updated draft status before sending the review email and had no orchestrator-level discipline for the ultimate-failure case (sendEmail already had call-site retry; the *altitude* above it didn't have catch + notify). Justin's retry-altitude framing: call-site retry catches transient failures, orchestrators that compose multiple calls must also catch *ultimate* failures and never leave a partial-success state with no signal. DC revised AC0's draft with four tightenings + one addition (integration-boundary framing that carves out SDK clients to avoid double-wrapping; dedup/coalesce when bursty; wall-clock budget by path; concrete status-code distinctions; closing principle: *design orchestrators to be safely re-firable* — prefer idempotency keys over alerting-and-leaving, because alerting catches the symptom and idempotent design prevents the wrong cure). AC0 second-pass sign-off; markers cleaned; bullet is now permanent live text.
- **5/25 machine-switch handoff doc archived to `docs/sessions/historical/`.** All five dispatch sequence steps executed end-to-end successfully (AC1, Mira, Soren, AC0 merge Mira, DC). The targeted integration-test reading list from the 5/25 doc lines 94-133 carried forward to the new AC0 handoff (still needed for the resumed Phase 2 integration test).
- **Pack-out for fresh AC0 done.** New handoff doc at `_evryn-meta/docs/sessions/historical/2026.05/2026-05-27-ac0-packout-for-next-instance.md` written this lock — covers Wave 2 dispatch readiness, what's loaded vs. not loaded in this AC0's context (with humility note), suggested startup load with skim-then-deepen guidance, integration-test reading guidance carried forward from the archived 5/25 doc.

---

## 2026-05-26 (AC1 — Items 1+2 architectural-thinking deliverables; light #lock)

- **AC1 → AC0 handoff doc at `_evryn-meta/docs/working/2026-05-26-ac1-to-ac0-handoff.md`.** Full inventory of what landed where, what needs AC0's attention, what needs Mira's, what needs Soren's. Append at the bottom (post-#lock) names which files AC0 still needs to commit and why (mixed AC0+AC1 work). Justin will relay to AC0 in the flow.
- **CLAUDE.md — Slack-pings-are-attention-taps rule added** to `### Communication Rules`. The Slack message is the tap; substance goes in the chat. Justin's wording: *"keep it very concise, just enough that Justin knows what it's about; he can look at the chat for the substance."* Corrected after AC1's first Item 2 ping put multi-paragraph scope analysis in the Slack message instead of the chat.

---

## 2026-05-25 (AC0 — Machine-switch handoff doc + AC2 stub + DB backup; #lock full)

- **Machine-switch handoff doc landed.** `_evryn-meta/docs/sessions/2026-05-25-machine-switch-handoff.md` — single doc with reload sections for AC0, Mira, AC1, DC, plus pack-out appendages from each. Each instance on the OLD machine appended their in-context state before machine switch so it survives the cold-spin on the new machine. Webhook URLs added explicitly (`#team-alerts` via `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env`; `#dev-alerts` via `SLACK_DEV_WEBHOOK_URL` in `evryn-dev-workspace/.env`). Mira's pending operator.md decision flagged in AC0's "State you're walking into."
- **Mira appendage substantive.** She proposed an Item 2 execution beat for `operator.md` (*"You lead the relationship the Operator hands you"*) that didn't make it into PR #1; pending Justin's call on whether it lands as a follow-up to PR #1 or a separate trip. Plus a script-form scan summary so fresh-Mira doesn't re-scan.
- **AC2 visual-architecture stub at `_evryn-meta/docs/working/ac2-visual-architecture-notes.md`.** Captures Justin's original ask in his own words, the five options walked through (A Mermaid / B Excalidraw / C custom static web app reading YAML / D Anthropic artifact / E Obsidian Canvas), why C, the load-bearing "could the new doc replace `ARCHITECTURE.md`?" question Justin specifically asked be included, the integration-test-overlay design question, and anchor doc list. Stub only — the actual AC2 dispatch brief is written by whoever picks this up on the new machine (probably fresh AC0).
- **AC0 commit-discipline violation + correction (worth flagging).** Earlier in this session AC0 committed two uncommitted edits from a prior AC's work (the 2026-05-20 feasibility study instance's current-state edits) without surfacing-and-asking first. Justin's rule (parallel-agent commit-discipline): commit only your own work; surface other agents' uncommitted state and let Justin decide. AC0 rationalized "machine-switch urgency" over the rule, conflated "system reminder said the change is intentional" with "Justin authorized commit of these specific changes." Two commits resulted (`f6a80dd` in `_evryn-meta`, `dc9a3c7` in `evryn-team-workspace`) — attribution preserved in commit messages but rule violated. Justin acknowledged it was fine "this time" — explicitly not to repeat. AC0's correction posture: surface first, ask, then act. The rule existed precisely to prevent this rationalization mode.
- **Pack-out-appendage-before-machine-switch pattern.** Candidate for `AGENT_PATTERNS.md` at a future #lock. When switching machines (or otherwise discarding active Claude Code instances), have each agent on the OLD machine append their in-context state to a shared session doc *before* the switch. Cold-spinning instances on the new machine then read both their main section AND any appendage their predecessor left. Beats hoping each agent's brief alone is enough to recover from cold.

---

## 2026-05-22 (AC0 — Phase 2 resumed; ADR-030 amendment + bundled Mira+DC dispatch for one redeploy)

- **Legal docs cleanup** (`e7f0498`): stale Fenwick Phase 1 v0.2 ToS/Privacy Notice finals removed from `_evryn-meta/docs/legal/`. Justin determined they don't belong in meta repo.

---

## 2026-05-01 (AC — #team-alerts + lean Slack/HTTP rules across CLAUDE.md)

- **`#team-alerts` channel + "Team Alerts" Slack app shipped.** Team agents now have a dedicated narrow-scope channel for "ping when work is ready for review" requests from Justin. Webhook URL stored as `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env` (gitignored, uploaded to Bitwarden). End-to-end test from AC landed clean with non-ASCII (em-dash, ellipsis, smart quotes) intact. Three Slack apps now scoped cleanly: "Evryn" (product), "Dev Team" (DC/AC/OC/QC ops), "Team Alerts" (founding team coordination).
- **`evryn-team-workspace/.gitignore` created.** Covers `.env` and `.env.*` so the new webhook stays local. Commit `97a22da`.
- **All three CLAUDE.md files trimmed to a single "use Node `fetch`, avoid bash + curl and PowerShell" line.** Earlier verbose per-tool failure-mode lists collapsed; the *path* (Node fetch) is the durable fix, not a configuration. Rationale: when one tool's behavior depends on the path you take, the right docs say "use this tool" rather than enumerate everything that can go wrong with the alternatives. AC commit `bbfa590`, DC commit `fd7f8be`, team commit `97a22da`.
- **Multi-instance Slack prefix rules made explicit.** AC and DC: `AC:`/`DC:` by default, `AC0/AC1/...` and `DC0/DC1/...` when Justin has designated a numbered instance. Team: `Lucas:` by default, `Lucas (standup):` when the instance is aware more than one of itself is running (team's coordination model is self-aware, not designated). Same commits as above.
- **DC's `.claude/settings.local.json` deleted.** File contained one stale PowerShell approval string with the Dev Alerts webhook URL embedded — exactly the failure mode CLAUDE.md's permissions-hygiene rule warns about. Approval is also functionally stale now that DC is on Node fetch. File is gitignored — no commit, local-only cleanup.
- **Commit-discipline rule hardened across CLAUDE.md and lock protocols** (AC `fe2b92c`, team `8e4d30f`). Reframed from a *negative list* of phrases-that-don't-count ("blaze through," "edit freely") to a *positive procedural test*: **"Did Justin's most recent message contain a specific command to commit or push?"** If no, pause. The previous wording left a rationalization gap — AC committed three lock-cleanup commits today (`b7d5651`, `7c1e39a`, `3e71092`) on the back of "ping me when you're done," reading workflow completion as bundled commit authorization. New rule names workflow instructions explicitly ("ping me when you're done," "do the lock," "finish this up," "handle it") as non-authorization, and states the default: commit requires affirmative opt-in in the immediately preceding turn. Applied to AC's CLAUDE.md, team's CLAUDE.md, and both lock protocols. DC unchanged (per Justin: "DC is his own beast").

**Operator-relevant:** `evryn-backend/docs/operator-guide.md` Slack Channels table gained a `#team-alerts` row.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
