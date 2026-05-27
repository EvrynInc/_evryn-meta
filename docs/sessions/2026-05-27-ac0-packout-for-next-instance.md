# AC0 Packout for Next Instance — 2026-05-27

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

**From:** AC0 (the instance that dispatched + verified Wave 1 + staged Wave 2; locked + handing off because context was getting full)
**To:** Fresh AC0 on next instance
**Date:** 2026-05-27
**Status:** Active. Wave 1 verified clean; Wave 2 brief written + ready to dispatch. Your first action is to dispatch Mira + DC for Wave 2 (details below).

---

## TL;DR — what's live, what's queued, what to do first

**Live and working:** Wave 1 of the v0.2 maturation work shipped 2026-05-26 (Railway deploy `55adcbd9` of commit `a0a4ae5`) and verified 2026-05-27 via DB query on the 7am PT cron fire. Both Item 1 (cron loads full Operator-discipline) and Item 2 (`trust-arc-scripts.md` loads in every prompt as voice anchor) are working as designed. Cross-instance memory through `pending_notes` is structurally validated.

**Queued for you to dispatch:** Wave 2 (six items total — four DC runtime + two Mira paired identity beats). Brief at `evryn-backend/docs/ac-to-dc.md`. Mira's beats in her 5/22 brief Wave 2 appendage at `_evryn-meta/docs/sessions/2026-05-22-mira-brief-bundle.md`. **One Railway redeploy lands all six.**

**Your first action:** read this doc end-to-end, then dispatch Mira (her two paired beats are smaller — she runs first on a new branch); when she pushes, you delta-review and merge; then dispatch DC against the merged state. Single redeploy at the end. Sequence per the existing `evryn-backend/docs/ac-to-dc.md` brief "Bundle commit + companion-ship sequence" section.

**After Wave 2 ships + smoke-tests clean:** resumed Phase 2 integration test (paused since 2026-05-21 per Justin's directive to Evryn).

---

## What's loaded automatically when you spin up (vs. what's not)

**Auto-loaded (every AC0 session):** `_evryn-meta/CLAUDE.md` (your operating manual) + `_evryn-meta/docs/current-state.md` (snapshot). That's it for the core context.

**What this AC0 (the one writing this) had to load to do today's work:**
- `_evryn-meta/docs/hub/roadmap.md` (the Hub — read at startup; full)
- The targeted integration-test reading list from the now-archived 5/25 machine-switch handoff doc (lines 94-133 in that doc — preserved below in this packout)
- `evryn-backend/docs/ARCHITECTURE.md` — heavy sections, NOT full doc (lines 70-200, 502-575, 605-645, 632-780, 855-895, 918-925, ~893 Publisher)
- `evryn-backend/docs/BUILD-EVRYN-MVP.md` — partial (lines 68-99, 114-165, 379-417, 575-605)
- `evryn-backend/src/email/poll.ts` (cron implementation — lines 378-405 most relevant)
- Various ADRs as referenced (ADR-030 + amendment, ADR-033, ADR-027, ADR-017)
- AC1's outputs from 5/26 (cron-architecture working doc + Proposal 08 + handoff)
- Mira's brief + appendages
- Soren's brief + review response

**What this AC0 has NOT read** (and which may matter — see "Humility note" below):
- Full `evryn-backend/docs/ARCHITECTURE.md` (only ~60% by section coverage)
- Full `evryn-backend/docs/BUILD-EVRYN-MVP.md` (only ~30%)
- The tech-vision spoke (`_evryn-meta/docs/hub/technical-vision.md`)
- The trust-and-safety spoke
- The vision-and-ethos spoke
- Most of `evryn-backend/src/` source (only `poll.ts` lines 378-405 + grep results across various files)
- The integration-test fixtures (`evryn-backend/tests/fixtures/`)
- The full identity files in `evryn-backend/identity/` (only via diff review of Mira's PR — small slices)
- The Evryn product runtime end-to-end as a whole

---

## Recommended startup-load sequence for you

Justin's clear directive (2026-05-27): **don't blow context loading everything up front; do load enough to be effective + know what you don't know.** Pragmatic load list, in order:

### Tier 1: Essential at startup (small, every session)
1. `_evryn-meta/CLAUDE.md` — auto.
2. `_evryn-meta/docs/current-state.md` — auto.
3. `_evryn-meta/docs/hub/roadmap.md` — small, orients you in the company; load this every session.
4. **This packout doc you're reading now.** Carries the in-flight state.

### Tier 2: Load before dispatching Wave 2
5. `evryn-backend/docs/ac-to-dc.md` (Wave 2 brief I wrote this lock) — Mira/DC dispatch context.
6. `_evryn-meta/docs/sessions/2026-05-22-mira-brief-bundle.md` (just the Wave 2 appendage at the bottom — `## Appendage — 2026-05-26 (Wave 2 follow-ups...)`) — Mira's two paired beats.
7. `_evryn-meta/docs/sessions/2026-05-26-ac0-wave-1-and-wave-2-prep.md` — yesterday's session doc; captures the day's flow + Wave 2 plate.

### Tier 3: Load if you need depth on specific topics
8. `_evryn-meta/docs/decisions/033-permission-compulsion-spectrum.md` — Accepted 2026-05-26 with reviewer signoffs + AC0+Soren+AC1 additions. Useful framework for any future runtime-language decisions.
9. `_evryn-meta/docs/working/cron-architecture-and-cross-loading.md` — AC1's working doc with Bug A + Bug B specs in detail. Read this if you need to write DC dispatch text or you're answering Justin's questions about Wave 2 design.
10. `evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26 08-capability-vs-constraint.md` — Proposal 08, the v0.3+ capability/constraint roadmap. Useful for any post-Wave-2 architectural conversation about how constraints evolve as Evryn's capabilities grow.

### Tier 4: Targeted reading for the resumed Phase 2 integration test
**This list is carried forward from the now-archived 5/25 machine-switch handoff.** AC0 deliberately preserved it here so that integration-test execution stays surgically loaded, not deep-cascaded. **Skim-headers-first strategy works here — read just the headers + section openers to know what's in each file, then drill in only when the test surfaces a specific question.**

- `evryn-backend/tests/integration-test-v02.md` — the protocol you're executing.
- `evryn-backend/tests/fixtures/test-gatekeeper-profile.md` — Mark character + answer key (open in browser/editor during execution).
- `evryn-backend/tests/fixtures/integration-test-script.md` — Justin's scripted lines.
- `evryn-backend/docs/ARCHITECTURE.md` — section line ranges (anchors still valid — section headers are stable):
  - 70-200 — User Model + Operator Track (thread scope per ADR-030) + System Actors + Three Modes
  - 502-575 — Pipeline Design: Email + Slack Processing + Approval Gate
  - 632-780 — Identity Composition (pathway-by-pathway trigger composition, post-2026-05-22 amendment)
  - 918-925 — Outbound Approval Gate (architectural invariant)
- `evryn-backend/docs/BUILD-EVRYN-MVP.md` — section line ranges:
  - 68-99 — Critical Principles (Mark's Trust, Build for One, Permission not Compulsion)
  - 114-165 — What Evryn Does (MVP): the workflow you're testing
  - 379-417 — Build Order: Phase 0/1/2 status tables
- `evryn-backend/docs/SPRINT-MARK-LIVE.md` — section line ranges:
  - 66-110 — Sprint Tracker table (Day 6 rows have freshest status)
  - 412-464 — Day 6 narrative content (real-Mark pivot context)
  - **466-487 — Pre-Go-Live Cleanup** (CRITICAL — visually verify squeaky-clean DB + Gmail before real-Mark email goes live)
  - 530-555 — Backlog (includes emergency-alerts Mark-live blocker)

**Trigger-load (only if X happens during the test):**
- Operator / cron / thread-scope behavior surprises you → ADR-030 full + Amendment 2026-05-22 + ADR-031 (late-scope recovery)
- Evryn produces output that looks off → `evryn-backend/identity/core.md` + the relevant activity module (`onboarding.md`, `gatekeeper-onboarding.md`, `triage.md`, `conversation.md`)
- Tool or SDK behavior surprises you → `_evryn-meta/AGENT_PATTERNS.md` §"SDK Integration & Tool Wiring"
- Strategy or principle question the foundation doesn't cover → the relevant Hub spoke
- **Anything else off-pattern you can't ground in the above** → STOP, ask Justin before proceeding. Don't infer through gaps.

**Note on line numbers:** anchors are stable (section headers) but exact line numbers may drift as docs evolve. If a line range doesn't match, grep for the section header name.

---

## Humility note — what you (and I) don't know

I (the AC0 writing this) deliberately did NOT do an exhaustive read of ARCHITECTURE.md, BUILD-EVRYN-MVP.md, the tech-vision spoke, the trust-and-safety spoke, or the evryn-backend runtime end-to-end. **There are real holes in my coverage** that may be holes in yours too if you only do the Tier 1-3 loads above. Justin's directive (2026-05-27, summarized): keep humility about what you haven't loaded; load specifically when a question lands that exposes a gap.

**Things this AC0 wishes he'd known earlier today, that you might want to load preemptively:**
- The actual cron gating logic (`src/email/poll.ts:328-358`) — I confidently told Justin that resetting `last_proactive_check_at` would force a cron fire; on reading the code I found that the *hour gate* runs first (line 370) and short-circuits before the 23h gate is even evaluated. Wasted a round-trip with Justin to correct. **If you're proposing any runtime intervention, read the code first.**
- The Railway CLI log truncation quirk — `railway logs --deployment` returns only ~9 lines of init-phase content regardless of historical window. DC flagged this; AC0 hit it independently. **For runtime verification, look at what the system persists (DB rows, message timestamps, pending_notes adds) rather than relying on logs.** That's how AC0 verified the 7am cron fire today.
- The `messages.internal_context` schema gap (ADR-028) — column was specced but never migrated. Discovered when a verification query referenced it and got 42703 error. Wave 2 plate or later sprint item.
- The Publisher-as-backstop-not-replacement framing (just landed in ADR-033). Justin pushed back hard on Soren's original framing. **For any future runtime work that references the Publisher, this reframe is load-bearing.** Identity carries the primary weight at tier 5 permanently; Publisher is the *backstop on the rare slip*; design bias is to keep the Publisher's catch list small.

**Strategy for managing what you don't know:** when Justin asks a question you can't answer with sharp confidence, *tell him* — say "I haven't loaded that; let me check" — and then load surgically. The cost of a small targeted read is much smaller than the cost of confidently wrong information that has to be corrected mid-flow.

**Skim-with-headers-only as a load strategy:** when you need a sense of what's in a doc without paying the full token cost, use `Grep` on `^##` or `^### ` patterns (or read just the first N lines) to get section headers + openers. That's often enough to know whether you need to drill in. Useful for ARCHITECTURE.md and BUILD-EVRYN-MVP.md which are both long.

---

## In-flight state at #lock time

**Committed and pushed (all repos clean as of this lock):**
- `_evryn-meta/docs/current-state.md` — refreshed
- `_evryn-meta/CHANGELOG.md` — today's entry added
- `_evryn-meta/docs/sessions/historical/2026-05-25-machine-switch-handoff.md` — moved here from `sessions/` (yesterday's predecessor doc; the still-relevant integration-test reading list is carried forward in this packout)
- `_evryn-meta/docs/sessions/2026-05-27-ac0-packout-for-next-instance.md` — this doc
- `evryn-team-workspace/shared/current-state/current-state.md` — AC0 appendage added before the truncation canary
- `evryn-backend/docs/ac-to-dc.md` — Wave 2 brief (replaces the 5/22 Wave 1 brief)
- `evryn-backend/docs/dc-to-ac.md` — cleared to `READ — absorbed`

**Nothing in flight from this AC0's session.** No uncommitted work in any repo. No mailbox messages pending absorption.

**Open questions Justin hasn't answered (low priority, not blocking):**
- Five open questions at the bottom of Proposal 08 (capability-vs-constraint roadmap) — `evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26 08-capability-vs-constraint.md`. Some are v0.3 scoping decisions; some are publisher-timing questions. None gate Wave 2.

---

## Dispatch texts (paste-ready for Justin to relay)

When Justin's ready to fire Wave 2, these are the dispatch texts.

### To Mira (fires first — her beats land before DC's runtime reads):

> Spin Mira. Read your standard cascade. Then your section in `_evryn-meta/docs/sessions/2026-05-22-mira-brief-bundle.md` — Wave 2 follow-ups appendage at the bottom (starts at `## Appendage — 2026-05-26 (Wave 2 follow-ups, not in flight today)`). Two paired identity beats: (1) `notify_slack` `about_user_id` scoping cue in `operator.md`, (2) Operator-Evryn-conversations-as-judgment-context discipline beat (your craft call: `core.md` or `operator.md`). New branch (suggested `mira/2026-05-XX-wave2-pairs` — pick the date you push). One PR. **Ping me on `#team-alerts` every time you have something for me — even when it seems like I'm right there. I'm bouncing between instances and I'm *not* there.**

### To DC (fires after Mira's PR merges):

> Spin DC. Read your standard cascade. Then your brief at `evryn-backend/docs/ac-to-dc.md` (Wave 2 — replaces the 5/22 Wave 1 brief which has now shipped). Four runtime items: Bug A `notify_slack` ghost-message fix; Bug B user-pathway cross-loading auto-load; `handleRevisionNotes` Operator-discipline normalization; `submitDraftForApproval` retry-rollback fragility fix. Item 1 must ship before Item 2 (sequencing required). Pull master before starting. Auto-deploy is still off post-Image-Registry-incident; manual `railway up` required (you knew this from Wave 1). **Ping me on `#team-alerts` every time you have something specifically for me (decisions, unblocks) — even when it seems like I'm right there. I'm bouncing between instances and I'm *not* there.** (Keep using `#dev-alerts` for ops pings — deploy outcomes — per your standard convention.)

---

## Coordination notes for you

- **Justin operates as Conductor.** He bounces between AC0, Mira, Soren, AC1, DC — sometimes multiple at once. Pings to him on `#team-alerts` are attention-taps (per the CLAUDE.md rule that landed today via AC1) — keep Slack messages to one short sentence routing him to the chat. Substance lives in the chat.
- **Justin is not a developer.** Concept-first then jargon; name patterns when they map to standard engineering concepts; explain reasoning + breadcrumb commands. (Per CLAUDE.md Working With Justin section — read that if you haven't.)
- **Justin doesn't read agent-to-agent notes by default.** When you synthesize something for him (e.g., "what did Soren say in his review?"), translate internal references — don't say "blocks 5a-5d" or "Proposal 08" without explaining what they are. This came up explicitly today; he flagged it as critical. **You are the ambassador.**
- **Commit discipline is strict.** Each commit needs explicit go-ahead from Justin in the immediately preceding turn. Workflow instructions ("blaze through," "handle it," "do the lock") do NOT authorize commits. The test before any commit: *"Did Justin's most recent message contain a specific command to commit or push?"* If no, pause and summarize, don't commit.
- **Stage by file path explicitly.** Never `git add -A` / `git add .` / `git commit -am`. Parallel agents work in the same repos at the same time; explicit staging prevents accidentally sweeping in their work.

---

## After Wave 2 ships and smoke-tests clean

The resumed Phase 2 integration test is the next major milestone. Justin's directive of 5/21 had paused it; he'll un-pause when Wave 2 is shipped + verified. The mechanism for the unpause to reach cron-Evryn is `pending_notes` on Mark — Justin tells Evryn (in Slack, any pathway), she writes the resume directive to `pending_notes` via `append_pending_note`. Cron-Evryn next-fire sees the updated `pending_notes` and proceeds. (Bug B's auto-load — Wave 2 — also surfaces Operator-Evryn-about-Mark conversations directly, so the resume signal would propagate via both pathways post-Wave-2.)

Test protocol: `evryn-backend/tests/integration-test-v02.md`. Reading list above. Pre-Mark-live blockers post-integration-test: emergency-alerts wiring; STEP 0 cleanup; adversarial test full real-Mark refresh. None on your immediate plate; surface when integration-test approaches go/no-go.

---

— AC0, 2026-05-27

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
