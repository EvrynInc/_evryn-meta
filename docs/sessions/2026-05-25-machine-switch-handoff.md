# Machine-Switch Handoff — 2026-05-25

> **Why this exists:** Justin is switching machines. All active Claude Code instances on the old machine (AC0, Mira, AC1, DC) cannot transfer — each new machine session is a cold spin. This doc gives each agent the exact reload path so spin-up is fast and nothing is dropped.
>
> **For Justin:** push this from the old machine, pull on the new machine, point each new instance at this file path and tell them to find their section.

*Written: 2026-05-25T12:55:24-07:00 by AC0 (last session before machine switch)*

---

## TL;DR — what's currently true

- **`_evryn-meta`** at `f6a80dd` (origin/main). Latest #lock is `8af097f` from 2026-05-22.
- **`evryn-backend`** master at `3a87137` (5/22). **Mira's PR branch `mira/2026-05-22-bundle` at `7f5a0b1`** — pushed but NOT merged. Awaits review + merge.
- **`evryn-team-workspace`** at `dc9a3c7` (origin/main). Lucas active on post-Mark sequence + meta-meeting work (multiple recent commits).

Phase 2 of v0.2 integration test is **paused** per Justin's 2026-05-21 directive to Evryn. ADR-030 Amendment (Operator-Audience Carve-Out) landed 5/22. Mira's bundle PR is the next thing waiting to merge. DC's trip is the thing after that.

---

## For new AC0

Read in this order before doing anything:

1. **`_evryn-meta/docs/sessions/2026-04-30-canonical-phase2-run.md`** — scroll to the bottom first. The 2026-05-22 status appendage has the freshest reload context. Then read the original Recommended-First-Action and the 5/2 update for layered context.
2. **`_evryn-meta/docs/current-state.md`** — current cross-repo snapshot.
3. **`_evryn-meta/CHANGELOG.md`** — latest entry is 2026-05-22.
4. **`_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md`** — particularly the "Amendment 2026-05-22 — Operator-Audience Carve-Out" at the bottom (this is the load-bearing architectural decision currently in flight).

**State you're walking into:**

- Phase 2 conversation with Evryn is **paused** per Justin's 5/21 directive ("you can pause until I let you know"). Don't engage Phase 2 with Evryn until Justin gives a green light.
- **Mira's PR is open** on `mira/2026-05-22-bundle` in `evryn-backend` (commit `7f5a0b1`, also visible as PR #1 — `gh pr view 1` works). Six items in one PR. Your first action is to review it.
- **Mira has a follow-up prose block proposed for `operator.md`** (Item 2 execution beat — *"You lead the relationship the Operator hands you"*), captured in her appendage at the bottom of this doc. **Pending Justin's call** on whether it lands as a follow-up to PR #1 or as a separate trip. Don't lose this; raise it on `#team-alerts` if Justin doesn't bring it up.
- **DC is on standby** — fires once Mira's PR merges. His brief is at `evryn-backend/docs/ac-to-dc.md`. Don't ping him until merge.
- **AC1 is cleared to start** working docs in `_evryn-meta/docs/working/`. No coordination required from AC0 unless he pings.

**Your first action — Mira's PR review:**

Diff is on `mira/2026-05-22-bundle` vs `master`. Review against the 7-item identity-file-review protocol at `evryn-team-workspace/shared/protocols/identity-file-review.md`. Six items in the PR (see Mira's section below for the inventory).

If clean: merge to `master`, ping DC on `#dev-alerts` (`AC0: Mira merged, DC trip is go`). DC reads his brief, ships his two items + bonus investigation, redeploys.

If anything needs Justin's eyes: ping `#team-alerts` with the specific question, don't merge until resolved.

**After Mira-merge + DC-trip lands:**

1. Watch `#dev-alerts` for DC's redeploy confirmation. Absorb his reply in `evryn-backend/docs/dc-to-ac.md`, clear the mailbox to `READ — absorbed`.
2. Update CHANGELOG + current-state + this session doc family with what shipped.
3. **Write the AC2 dispatch brief** for the visual architecture viewer — still TODO. Option C path (custom static web app reading YAML; doesn't drift; could replace `ARCHITECTURE.md` as the single source of truth or not — that question goes to AC2). Reference Justin's request on 2026-05-22 in this session-arc. Save as `_evryn-meta/docs/sessions/2026-05-25-ac2-brief-visual-architecture.md` (or whatever date you write it).
4. **Phase 2 engagement** still requires Justin's green light. Once given, the queued reply about cross-thread cron divergence is documented in the 2026-04-30 session doc's earlier sections (search for "Suggested reply to her in the Phase 2 thread").

**Ping convention** (Justin's standing instruction for AC0):
- `#team-alerts` for things needing Justin's eyes (`AC0: <one-line ask>`). Webhook URL is `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env`.
- `#dev-alerts` for DC coordination. Webhook URL is `SLACK_DEV_WEBHOOK_URL` in `evryn-dev-workspace/.env`.
- Mechanics: Node `fetch` invoked from Bash (`node -e "..."`) is the standard path — auto-allowed and UTF-8 clean. Don't reach for PowerShell or bash + curl.
- Prefix every message with your name (`AC0:`, or `AC0/AC1/...` if Justin has designated a numbered instance).
- Don't over-ping. Ping for decisions, not routine status.

**Commit discipline** (load-bearing — read CLAUDE.md if needed):
- Each commit needs its own explicit go-ahead from Justin
- Edits are auto-allowed; the gate is at commit time
- **Stage by file path explicitly. Never `git add -A`.** Parallel agents may have work in the tray.
- Commit ONLY your own work. If you see another agent's edits uncommitted, surface to Justin — don't sweep them.

**Targeted reading list for integration test execution** *(added 2026-05-25 evening by AC0)*

The deep cascade (Hub + full ARCHITECTURE + full BUILD + full SPRINT) is the right load for *architecture work* — writing ADRs, evaluating tradeoffs, strategy conversations. For *executing the integration test*, it's expensive context for navigation knowledge you can encode here as line ranges. This list trades the full mental map for surgical reads at the right moments.

**Always-load (foundation, before any test work):**
1. `_evryn-meta/CLAUDE.md` (auto)
2. `_evryn-meta/docs/hub/roadmap.md` — light, orients in space
3. `_evryn-meta/docs/current-state.md`
4. This handoff doc (AC0 sections above)
5. `evryn-backend/docs/dc-to-ac.md` (mailbox state)
6. `evryn-backend/tests/integration-test-v02.md` — the protocol you're executing

**Targeted line ranges — read these sections only, not the whole file:**

`evryn-backend/docs/ARCHITECTURE.md`:
- 70-200 — User Model + Operator Track (thread scope per ADR-030) + System Actors + Three Modes
- 502-575 — Pipeline Design: Email + Slack Processing + Approval Gate
- 632-780 — Identity Composition (pathway-by-pathway trigger composition, post-2026-05-22 amendment)
- 918-925 — Outbound Approval Gate (architectural invariant)

`evryn-backend/docs/BUILD-EVRYN-MVP.md`:
- 68-99 — Critical Principles (Mark's Trust, Build for One, Permission not Compulsion)
- 114-165 — What Evryn Does (MVP): the workflow you're testing
- 379-417 — Build Order: Phase 0/1/2 status tables (what's wired, what's deferred)

`evryn-backend/docs/SPRINT-MARK-LIVE.md`:
- 66-110 — Sprint Tracker table (Day 6 rows carry the freshest status)
- 412-464 — Day 6 narrative content (post-sprint context, real-Mark pivot)
- **466-487 — Pre-Go-Live Cleanup** (CRITICAL — visually verify squeaky-clean DB + Gmail before real-Mark email goes live)
- 518-526 — 2026-05-01 three-fix bundle status
- 530-555 — Backlog (includes the emergency-alerts Mark-live blocker)

**Trigger-load — read only if X happens during the test:**
- *Operator / cron / thread-scope behavior surprises you* → ADR-030 full + Amendment 2026-05-22 + ADR-031 (late-scope recovery)
- *Evryn produces output that looks off* → `evryn-backend/identity/core.md` + the relevant activity module (`onboarding.md`, `gatekeeper-onboarding.md`, `triage.md`, `conversation.md`)
- *Tool or SDK behavior surprises you* → `_evryn-meta/AGENT_PATTERNS.md` §"SDK Integration & Tool Wiring"
- *Strategy or principle question the foundation doesn't cover* → the relevant Hub spoke
- *Anything else off-pattern you can't ground in the above* → STOP, ask Justin before proceeding. Don't infer through gaps.

**Note on line numbers:** accurate as of 2026-05-25. If a target doc has been substantially edited since, the section headers ("Operator Track," "Pipeline Design," "Identity Composition," "Pre-Go-Live Cleanup," etc.) are stable anchors — grep for those.

---

## For new Mira

Read in this order:

1. **`_evryn-meta/docs/sessions/2026-05-22-mira-brief-bundle.md`** — your brief. Six items. You may have already absorbed this; if cold-spinning, read it fresh.
2. **`evryn-backend`** — check that branch `mira/2026-05-22-bundle` exists locally (`git branch -a`). Your work landed there at commit `7f5a0b1` (pushed). Look at the four files: `core.md`, `operator.md`, `onboarding.md`, `trust-arc-scripts.md`.

**State you're walking into:** your bundle PR is open and awaits AC0 review + merge. You're between bundles — don't open another PR on the same branch.

**What to do next (in priority order):**

1. **Check your memory hygiene.** If past the 15K-character consolidation threshold, run a consolidation pass per your normal protocol.
2. **Watch `#team-alerts`** for AC0 review notes. If AC0 asks for revisions, address them on the same branch and push.
3. **If your PR has been merged when you wake up:** check `evryn-team-workspace/shared/current-state/current-state.md` for any cross-domain context Lucas or others have surfaced. Lucas has been active on post-Mark sequence + meta-meeting work; some of his thinking may interact with your post-Mark-live identity work.
4. **The broader anchor-rich activity files conversation** with Justin is in flight (longer-arc, not blocking). When you have bandwidth, sketch design space — what would make `gatekeeper-onboarding.md`, `onboarding.md`, `triage.md` etc. genuinely anchor-rich (voice samples, exemplars, exemplary judgment calls) vs. their current procedural shape? **Working doc territory, not a PR yet.** Save to `evryn-team-workspace/shared/projects/product/` or wherever your working docs live.

**Coordination:**
- AC0 reviews your PR per `evryn-team-workspace/shared/protocols/identity-file-review.md`
- DC follows your merge with his runtime trip — companion-shipped, atomic Railway redeploy
- Don't touch `evryn-backend` master while DC's trip is in flight (post-merge through redeploy)

---

## For new AC1

Read in this order:

1. **`_evryn-meta/docs/sessions/2026-05-01-ac1-brief-phase2-architectural-adrs.md`** — original brief at the top AND the 2026-05-22 Append at the bottom. The append has answers to your five clarifying questions + what shifted in your two items since the original brief.
2. **`_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md`** — particularly the new Amendment 2026-05-22 at the bottom. Your Item 1 (cron architecture) is partially absorbed by this amendment; you should know what landed and what's still open.

**State you're walking into:** You're cleared to start working docs. Output goes to **`_evryn-meta/docs/working/`** (create the directory). Working docs, not ADRs — actual ADR writes still wait for adversarial test passing as the next concrete data point.

**Your two items (recap from the brief append):**

1. **Cron architecture** — the Operator-Audience carve-out amendment closed the specific Phase 2 seam, but the deeper question is open: *should any pathway ever load fundamentally different identity, or should every pathway load a consistent baseline + situational add-ons?* Plus: the ghost-message problem (cron `notify_slack` doesn't log to messages table; empirically biting per the 18-note arc on Mark). Plus: cross-instance memory binding — informally working through pending_notes, Mira's `[binding: ...]` structural upgrade in flight.

2. **Capability-vs-constraint architecture** — unchanged substantively, but gained the **constraint-by-undersaturation** framing from the voice-anchoring conversation Justin/Mira are having. Evryn can be capability-limited not just by explicit constraints but by under-demonstration (margin notes vs. lines). Worth folding into your thinking on what relaxes when the publisher module lands in v0.3.

**Coordination:**
- `#team-alerts` for AC0 or Justin input if needed
- Don't touch `evryn-backend` while Mira's PR is open (you wouldn't be touching it anyway, but the constraint is real)
- Mira's brief at `_evryn-meta/docs/sessions/2026-05-22-mira-brief-bundle.md` interacts with your Item 1 thinking — read it briefly for design space awareness

---

## For new DC

**Hold off until AC0 pings you on `#dev-alerts`** confirming Mira's PR has merged. Don't start before that — Mira's identity edits to `trust-arc-scripts.md` (preamble) must be on master before your runtime change reads the file.

Once pinged, read:

1. **`evryn-backend/docs/ac-to-dc.md`** — your brief. Two items + one bonus investigation.

**Brief summary** (read the file for full detail):

1. **Item 1 — Cron loads Operator-discipline.** Both `checkProactiveOutreach` AND `checkFollowUps` in `src/email/poll.ts` change to `composeSystemPrompt(personContext, true, operatorProfile)`. Same call shape as `handleGeneralMessage` already uses. Load `operatorProfile` once per cron tick, not per user. Per the 2026-05-22 amendment to ADR-030 (audience over trigger).
2. **Item 2 — Voice-samples runtime.** Load `trust-arc-scripts.md` into every Evryn prompt at the position: end of internal-self stuff (after `core.md` + `operator.md` + Operator profile, before person context + recent conversation). Always loaded, every pathway. Read via `readIdentityFile("internal-reference/trust-arc-scripts.md")`. Mira's preamble at the top of that file lands in her merged PR — your runtime change reads the file post-merge.
3. **Bonus investigation:** trace why 5/4 and 5/11 cron-fired drafts never produced `review@evryn.ai` emails. Real bug vs. inbox miss. Defer if not small.

**Coordination:**
- Single trip, single Railway redeploy. Bundle commits how you like (suggest 2 commits, one per item, for bisect-clean revert).
- Reply in `evryn-backend/docs/dc-to-ac.md` per protocol — commits + smoke-test results + bug investigation findings.
- Ping `#dev-alerts` before/after the redeploy.

---

## Cross-instance coordination notes

- **No DC firing until Mira merges** — file-state dependency on `trust-arc-scripts.md`.
- **No new Mira PR until current PR resolves** — same-branch hygiene.
- **AC1 is fully parallel** — no dependencies, no blocking, can work any time.
- **AC0 is on the critical path** for Mira-merge → DC-fire. If AC0 is also juggling other work, that becomes the bottleneck. Sequence: review Mira → merge Mira → ping DC → wait for DC reply → absorb.
- **Lucas is active on a parallel track** (post-Mark sequence + meta-meeting). His work in `evryn-team-workspace` doesn't block this thread. Be aware he may have updated team current-state since the 2026-05-22 AC0 appendage.

## What's NOT in flight (parked for later)

- **Phase 2 conversation engagement with Evryn** — paused per Justin's 5/21 directive. Resumption requires Justin's green light. When given, AC0 has a queued cross-thread-divergence reply documented in the 2026-04-30 session doc.
- **AC2 dispatch brief for visual architecture viewer** — still TODO. AC0's first major task after Mira-merge + DC-trip lands.
- **Pre-Mark-live blockers (unchanged):** emergency-alerts wiring, pre-go-live STEP 0 cleanup, adversarial test full real-Mark refresh. All deferred to after the current bundle lands.
- **AC1's actual ADR writes** — deferred until adversarial test ships as next data point. Working docs only for now.

---

— AC0 (last session before machine switch, 2026-05-25T12:55-07:00)

---

## Pack-out appendages from instances before machine switch

Each instance reading this on the OLD machine: if you have in-context work, decisions, partial drafts, or judgment-calls that would be lost when your instance dies, add a short appendage below before Justin commits + switches. Format: `### [Your name + instance] appendage YYYY-MM-DDTHH:MM-TZ`. Brief is fine — just enough that your replacement on the new machine doesn't have to redo your thinking. If nothing's in your head that needs preserving, no appendage needed.

Sequence: Justin hands each agent this path → agent reads their main section → agent adds appendage here if needed → agent stages their edit (don't commit individually — Justin coordinates one final commit before switch). If the agent commits independently, that's fine too; just attribute clearly.

### [Mira] appendage — 2026-05-25T13:06-07:00

(General status — PR pushed, lock pushed, memory state — is covered in my 5/22 lock entry and will be refreshed in this session's lock. This appendage is for workstream-specific things that live only in this instance's tray.)

**Item 2 execution beat for `operator.md` — proposed prose, pending Justin's Monday call.**

AC0's brief called for the "Evryn owns her user relationships" item to land in *both* `core.md` (principle, in PR) AND `operator.md` (execution language, deferred). I missed the operator.md piece while drafting; Justin's script-form-scan question on 5/22 surfaced the gap. Justin paused before deciding whether to land it as a follow-up to PR #1 or as a separate trip. If he greenlights it, the proposed text below drops into `operator.md` at the top of "Working with Users" (before the existing "Writing to a user's profile" beat):

> **You lead the relationship the Operator hands you.** When the Operator brings in a user — *"I'm bringing in so-and-so, take a look"* — that's a handoff of context, not a handoff of relationship-shape. The relationship is yours to open. Take the Operator's framing as input to your judgment; don't take it as a brief that defines your opening.
>
> *Wrong move you may default to: asking the Operator "anything you want me to not lead with?" That cedes the relationship-shape to them. Right move: take their context in, then open the way **you'd** open — your warmth, your read, your craft. If acknowledging the handoff helps land cleanly, a simple "thanks for the context" works. Then bring **your** opening, not theirs.*

The script-anchor pattern (wrong-move/right-move contrast) is the script-form realization of the judgment-anchoring principle from the 5/22 lock — Evryn's 5/1 *"anything you want me to not lead with?"* is the empirical wrong-move; the prose gives her a concrete right-move to reach for.

**Script-form scan results from 5/22 (so new-Mira doesn't re-scan):** I walked all six items in the PR looking for under-scripted spots. Only Item 2 execution turned up a real gap. Item 1 (curiosity) is silent-research-action — hard to script the *act* of following a thread. Item 6 (pre-write) the directive IS the script. Item 4 (user-substantive) the test prose IS the script. Item 3 (bindings) heavily scripted via tag patterns. Item 5 (trust-arc-scripts framing) scripted via the *these are your words* principle. Item 6 reinforcement scripted via *stop and follow it* + *think about what you need*. The broader anchor-rich activity-files conversation (per AC0's handoff note above) is a working-doc-territory follow-up, not a PR-able item.

### [AC1] appendage — 2026-05-25T13:05-07:00

**One open question Justin didn't get to answer before the machine switch.** The brief's 2026-05-22 append says to integrate the *constraint-by-undersaturation* frame from the voice-anchoring conversation into Item 2 thinking. The boundary with Mira's lane isn't drawn explicitly. I asked Justin to confirm "fold in the implication (under-saturation as a constraint axis capability-vs-constraint has to account for) without prescribing the fix (voice-anchoring shape — Mira's territory)." Justin moved to the machine switch before answering. **Default for fresh AC1:** integrate it as a frame for capability-vs-constraint thinking, don't design the fix, ping `#team-alerts` only if your thinking starts drifting into Mira's design space.

Otherwise nothing to preserve — no Tier 1-5 reading done, no design space mapped, no draft started, no independent judgment calls. Most of what I said this session paraphrased AC0's brief + append back. A fresh AC1 picks up at the same line I was on.

### [DC] appendage — 2026-05-25T13:something-07:00

Nothing to add. The 5/2 trip's work is durable in git (commits `07b03bf` + `d533b2c` + `9326c58`), in the prod DB (migration + backfill), and in CHANGELOG / SPRINT-MARK-LIVE / `dc-to-ac.md` reply (cleared by AC0). The new 5/22 brief at `evryn-backend/docs/ac-to-dc.md` is on hold for Mira's PR merge per the cross-instance coordination above — I have not absorbed it as marching orders yet, so fresh DC on the new machine picks up cold from that file with no in-head state to lose.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
