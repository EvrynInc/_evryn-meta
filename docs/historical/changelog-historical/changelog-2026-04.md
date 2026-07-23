# Changelog Archive — _evryn-meta, April 2026

> **Post-hoc archive note:** this per-repo April archive was built **2026-07-23 by splitting the former unified cross-repo April changelog, months after the fact** — it may be slightly inaccurate or incomplete. If you're hunting for something that should be here and it isn't, **check the other repos' changelogs** (product build → `evryn-backend`; website → `evryn-website`; team-workspace/legal history → the `helm` collection doc `shared/projects/helm/2026.07.23-acr-historical-team-ships.md`).

---

## 2026-04-30 (Mira — values architecture: orientations, not rules)

- **ADR-032 written.** Replaces "behavior, not belief" framing (which falsely claimed objectivity) with "Evryn has her own values, expressed as orientations." Captures full reasoning, six ethical traditions tested, failure modes avoided, and what we considered and rejected as primary directives (justice-as-directive, autonomy-as-primary, hard-and-fast rules). Permanent open question codified: the narrative-dependence of ethical judgment is something we *manage*, not *solve*.
- **`docs/hub/vision.md` renamed to `vision-and-ethos.md`** (git mv, history preserved). New "Evryn's Ethos" section carries the values architecture: ownership-of-values frame, seven cultivations + seven avoidances, "what we left off, and why" subsection. Commit `52edf5e`.
- **Hub updated.** New "Evryn's Ethos" sub-section under "What Evryn Is" — ownership frame + tight cultivation/avoidance hits + spoke pointer. Trust & Fit "behavioral filtering" bullet rewritten as "Access flows from ethos and compatibility." Reference paths updated to renamed spoke. Commit `56732d4`.
- **Trust & Safety spoke rewritten.** "Behavioral Filtering" section renamed and rewritten as "Filtering from Evryn's Ethos." Mechanics preserved; framing changed from objective behavior-filter to applied character. Frontmatter updated to point at vision-and-ethos. Commit `56732d4`.
- **Long-term-vision and user-experience spokes** — vision references updated to vision-and-ethos. Commit `56732d4`.
- **Auto-memory rule landed in CLAUDE.md.** "Do not use the Claude Code auto-memory system" — Justin caught Mira writing to it earlier in session. The auto-memory system doesn't understand agent identities and creates unattributed noise on every agent's load.

---

## 2026-04-29 evening (Cross-team — v0.2 evening bundle deploy + ADR-031 round-trip + #dev-alerts security cleanup)

- **Identity-file-review protocol exercised end-to-end for the first time.** Mira authored on `mira/operator-md-late-scope-2026-04-29` branch; AC reviewed against the 7-item checklist (all confirmed); AC merged via `--no-ff` (`eebd399`); branch deleted post-merge. Companion-ship discipline observed: AC's mailbox to DC asked for `rescope_messages` to ride DC's slack.ts trip so identity layer + runtime tool would land atomically; DC shipped both same trip; Mira's pass merged against a runtime that already had the tool registered.
- **Identity-file-review protocol hardened (AC review pass).** Four additions to DC's draft: (a) new "Preconditions" section naming Railway deploy-config dependency explicitly so the branch-only safety property can't silently break if anyone enables PR-preview deploys later; (b) author responsibility #7 — don't merge mid-test, coordinate before the merge not after; (c) #8 — companion-ship coordination across repos when the identity-file references runtime tools / sibling docs / ADRs (atomic landing under one Railway redeploy); (d) #3 refined — AC-routing language clarified (prefer the coordinating AC or a fresh AC; don't grab one mid-other-work). Commit `70bafbf` (evryn-team-workspace).
- **`#dev-alerts` security cleanup.** Evryn removed from the channel; agent-team-side "Dev Team" Slack app gained bot-token scopes (`channels:read`, `groups:read`, `channels:history`, `groups:history`); `SLACK_DEV_BOT_TOKEN` added to `evryn-dev-workspace/.env`; AC + DC `CLAUDE.md` SESSION STARTUP rewritten to use the agent-team token (commits `ad2953c` in `_evryn-meta`, `6f29c22` in `evryn-dev-workspace`). The Evryn-bot-reading-agent-channel conflation Justin flagged is closed.
- **AGENT_PATTERNS clarification (AC).** LEARNING 55 stub now distinguishes built-in Claude Code tools (need both `tools[]` AND `allowedTools[]`) from MCP tools (auto-exposed when their server registers them; `allowedTools[]` only with `mcp__<server>__<tool>` prefix). DC caught the misreading on AC's mailbox to him during the rescope_messages trip — pattern was being read as "all tools need both lists" rather than "built-in tools need both lists." Commit `82e555c`.
- **Outgoing-AC handoff doc fix + Mira brief reference.** Self-contradiction in the 2026-04-29 deploy-and-absorption handoff doc fixed (handoff said current-state lagged but the same commit refreshed it). Commit `afceac5`.
- **Bash-on-Windows backtick gotcha** landed in `AGENT_PATTERNS.md` SDK Integration & Tool Wiring as a sibling to "Validate Transport Before Blaming the Renderer" (same root family — bash-on-Windows mangling non-trivial payloads). Webhook payload via Node fetch in a bash heredoc silently corrupted backtick-wrapped strings (shell command-substitution evaluated before Node saw the JS template literal); webhook returned 200 with empty content where code references should have been. Pattern: file-based payloads via `fs.readFileSync` instead of inline-via-bash for non-trivial JSON. Justin's routing call: AGENT_PATTERNS direct, not LEARNINGS Unpromoted (didn't need the holding tank).
- **Session-docs sweep (AC).** All 9 active session docs in `_evryn-meta/docs/sessions/` had flowed up to persistent homes; moved to `historical/`. Reference path updates landed in `CHANGELOG.md`, `LEARNINGS.md`, `decisions/031-late-scope-recovery.md` (Mira-brief reference dropped per CLAUDE.md doc discipline — "persistent docs never reference session docs"; ADR captures the decision substance, the brief was operational handoff and is now consumed), `evryn-backend/docs/SPRINT-MARK-LIVE.md`, and `evryn-team-workspace/shared/current-state/current-state.md`. Three commits — `fa89e64` (`_evryn-meta`), `499660d` (`evryn-backend`), `6178821` (`evryn-team-workspace`).
- **Commit-discipline rule landed (AC).** Edits in `_evryn-meta` and `evryn-team-workspace` are now auto-allowed (`Edit` + `Write` paths added to `.claude/settings.json`); the trade is "never commit without Justin's explicit go-ahead" — pause for diff review in source control after each logical chunk. Justin runs several agent instances at once and was burning approval cycles on per-edit prompts. Co-discipline beat in `ac-dc-protocol.md`: AC↔DC mailbox traffic stays commit-freely (Justin doesn't read those), but AC sends Justin a short summary so he tracks the shape. Commits `4dbab51` (`_evryn-meta`: CLAUDE.md + ac-dc-protocol.md + settings.json) and `8c2f441` (`evryn-team-workspace`: CLAUDE.md + claude-code-ops.md + settings.json). Auto-edit takes effect on next session restart.

---

## 2026-04-29 (Cross-team — v0.2 deploy + ADR-030/031 absorption + identity-file-review protocol)

- **Identity-file-review protocol shipped (DC).** Branch + PR + AC-as-default-reviewer + 7-item explicit checklist + `#dev-alerts` merge ping. Motivated by the 2026-04-29 real-Mark-identifying-info leak in `operator.md` that multiple reviewers missed. AC startup gains a `#dev-alerts` peek (last 12-24h via `conversations.history`) so push-less agents can see production events. Commits: `0cf20fc` (evryn-team-workspace) + `4416091` (_evryn-meta) + companion ships in evryn-dev-workspace + evryn-backend CHANGELOG. AC sign-off given today.
- **AGENT_PATTERNS additions (AC).** New "SDK Integration & Tool Wiring" section: Built-in Tools Need Dual Listing, Library Defaults Don't Enforce Architectural Invariants, Validate Transport Before Blaming the Renderer. Memory & Context section gained Stub-Shaped Records Need Explicit Legibility Signals.
- **LEARNINGS items 55-58 added (DC) and promoted to stubs (AC).** 55: dual-list `tools[]` + `allowedTools[]`. 56: validate transport before blaming renderer. 57: library defaults don't enforce architectural invariants. 58: stub-shaped records need explicit legibility signals. Plus retroactive stubbing of items 46-50 (Strip Instructions, Anchor-Then-Expand, Inside Details, Hold Research with Humility, No Tiering).
- **CLAUDE.md updates (DC).** Added Railway CLI section (commit `d197d7b`) — `railway whoami`, `status`, `logs --deployment`, `logs --build`, `deployment list --json`; status.railway.com for incidents. Corrected em-dash advice (commit `9f73a1d`) — was wrong-rooted as Slack rendering issue; actually a Windows-curl transport artifact. Added `#dev-alerts` peek to AC startup (commit `4416091`).
- **Lucas handoff absorbed.** Items #2, #3, #4, plus Item #1 schema-reference re-pull. Lucas free to archive `2026.04.29-ac-handoff-post-soren-verification.md`.

---

## 2026-04-28 (AC — vetting pass + ADR-030 + permission-over-compulsion principle + Mira/DC pre-handoff)

- **Sweep protocol updated** — `evryn-team-workspace/shared/protocols/sweep-protocol.md` section 10 (Schema & Backup Health) gained an Operator-profile public-safe spot-check step. ADR-030 v0.2 audit pathway; v0.3+ becomes Reflection's job (instructed via `_meta.discipline_notice`).
- **LEARNINGS item 53 clarified** — distinguished "implicit" subject-ification (barred — the loop-bug pattern) from "deliberate" subject-ification with explicit pathway-gating (designed exception, e.g., ADR-030's Operator pathway). Title now reads "...Never *Implicit* Subjects."
- **Session doc** at `_evryn-meta/docs/sessions/historical/2026.04/2026-04-28-vetting-pass-and-adr-030.md` — full handoff for fresh AC arriving cold.
- **Fresh-AC handoff (evening).** Walked the full load list, verified DC's six-task build against the runtime (root cause + two fix layers for the loop bug clean; ADR-030 implementation isolation correct — only `handleGeneralMessage` loads Operator's profile; UTF-8 fixes single-source-of-truth; `getRecipient` redirect deleted entirely). Verified Mira's `operator.md` ADR-030 ship (commits `7721972` + `0fd4181`, one-file-two-modes structure). Wrote DC deploy go-signal mailbox at `evryn-backend/docs/ac-to-dc.md` with one pre-deploy fix (`notify_slack` tool description: compulsion → permission, from DC's audit candidates). Em-dash sanitizer cleanup at `notify/slack.ts:79-83` + `notify/dev.ts:16-20` folded into the same DC trip via the smoke-test (sprint backlog updated to reflect). Mailbox tightly scoped to one job; Justin spins DC in the morning.

---

## 2026-04-27 (AC — integration test pivot + loop bug + research-aware Evryn)

- **WebSearch enabled in `_evryn-meta/.claude/settings.json`** — added to permissions allow list so AC subagents can use it.
- **Session doc** at `_evryn-meta/docs/sessions/historical/2026.04/2026-04-27-integration-test-pivot-and-loop-bug.md` — full handoff to fresh AC.

---

## 2026-04-27 (AC — Hub vulnerability test + framing additions)

- **"How We Hold the Hub and Spokes" added to roadmap.md** — Distinguishes Principles (commitments that don't bend to data) from Predictions (numbers held with conviction but tested from day one). Sets the right reading lens; most quantitative claims are experiments being tracked.
- **Bulkhead architecture added to technical-vision.md** — Meta-principle above zero-trust and information firewalling. Every system assumes breach and bounds it. Even walls on land are bulkheads — register signal for the crew.

---

## 2026-04-22 (AC — DC Day 6 spec review + deploy prep)

- **current-state.md** — Full rewrite to reflect weeks of team progress.

---

## 2026-04-05 (AC0 — Orchestration packout, sprint tracker finalization)

- **current-state.md** — Added AC3 section. Updated AC0, AC1, AC2, DC sections to reflect close-out state.

---

## 2026-04-05 (AC2 — Weekend thinking close-out, trust rewrite)

- **Weekend thinking fully ingested** — All 6 docs from 2026-03-23 absorbed into persistent files, moved to `docs/sessions/historical/`.
- **Hub trust rewrite** — "You're always in control" replaced with "No dark patterns" (full toolkit, aligned intent framing). Behavioral filtering rewritten with matching vs platform access distinction. "Evryn is a witness, not a mirror" added. Design philosophy reformatted to bullets.
- **Trust-and-safety spoke** — "You're always in control" header replaced with "Evryn is here *for you*".
- **Business-model spoke** — Installment plans subsection (v0.4 target), competitive pricing context, unit economics at rest.
- **EVR-77** — FYI to Soren re: doc 06 (claude.ai user memory structure) for agent memory design reference.

---

## 2026-04-03 (AC + Nathan — Fenwick finalization, website legal pages, Nathan onboarding)

- **Broken links fixed** — 4 persistent docs updated after legal folder reorganization (gtm-and-growth, gatekeeper-approach, technical-vision, openclaw research).
- **BizOps spoke updated** — Legal section reflects finalized v0.2 docs with archive pointers.

---

## 2026-04-03 (AC + DC — Research migration, project structure, DC agent definition)

- **Demarcation rule established** — _evryn-meta = source of truth + AC ops. Team workspace = active work, research, drafts. Written into both CLAUDE.md files.
- **AC protocols folder** — Moved lock, ac-dc, sweep, align protocols to `docs/protocols/`. References updated.
- **developer.md agent definition** — Verbatim copy of DC CLAUDE.md in `_evryn-meta/.claude/agents/`. Adaptation for subagent/teammate use pending.
- **DC CLAUDE.md updated** — Added evryn-team-workspace, fixed stale SDK references.
- **Hub + spokes updated** — Stale team references fixed (Hub, bizops, technical-vision, gtm-and-growth).
- **.gitignore fixed** — Was blocking all of `.claude/`; now only blocks `settings.local.json`.
- **AC #lock protocol** — Added team current-state appendage step (#10).

---

## 2026-04-01/02 (AC — Team workspace memory/protocol overhaul)

- **settings.json created** for evryn-team-workspace — broad Bash allow, deny list for destructive ops.

---

## 2026-04-02/03 (AC — Fenwick legal finalization + website legal pages)

- **BizOps spoke updated** — Legal section reflects finalized v0.2 docs with archive pointers.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
