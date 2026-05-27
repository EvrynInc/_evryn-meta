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

## Architectural reference index — specific drill-in pointers (added post-lock by AC0)

After locking this packout, AC0 did a second-pass deep read on the tech-vision spoke + selected ARCH.md sections + runtime entry points, looking for things he wished he'd known during today's work. The pointers below codify what to read when — so you can pay the read cost only on demand.

### Tech-vision spoke — read it before any architectural conversation

`_evryn-meta/docs/hub/technical-vision.md` (391 lines). **Read in full when you do any of these:** post-Mark architectural design work, any Publisher-related discussion, anything touching matching architecture, anything touching privacy/security at the structural level, any LLM-strategy or hosting discussion. Sharp framings worth knowing before you need them:

- **System Landscape diagram** (top of doc) — the full topology (Website + Backend + Supabase + Anthropic + Google Cloud + HubSpot + iDenfy).
- **Five imperatives + five critical conditions** — what the system must deliver vs. what structurally has to hold for it not to break. Useful for evaluating any architectural change against "does this protect what must hold?"
- **Three Domains of Intelligence** (Conversation & Voice / Judgment & Matching / Intuition & Care) — these are categories of capability, not modules. They separate into distinct modules as scale demands; the principles governing that separation live in the **Module Separation Principles** subsection. *Soren's Publisher framing today implicitly drew from "safety gates must have narrow context and independent judgment" — knowing that section sharper would have made the Publisher-as-backstop conversation faster.*
- **How Matching Works** — hard constraints → multi-dimensional fit → narrative judgment → learning from outcomes. Plus "asymmetric starts, symmetric resolution," cross-domain matching intelligence, coherence-calibrated modularity. The matching design is largely v0.3+ but it shapes how v0.2 schema decisions get evaluated.
- **Data & Knowledge Layers** — six conceptual stores (Self-Knowledge, Global Connection Intelligence, World/Domain, User Data, Relationship Graph, Trust Graph). Critical separation: user data and conversation logs are separated from the Trust Graph and Global Connection Intelligence by design.
- **Privacy & Security Architecture** — Bulkhead Architecture (every part assumes neighbors could be compromised), Zero Trust + Least Privilege, Information Firewalling. The "current reality vs. target state" gap on PII anonymization is honestly stated.
- **Sovereign Memory & Cryptographic Trust** — long-term target with the Swiss Foundation, two-entity structure, user vaults vs. working intelligence, LLM constraint honest assessment. Mostly v0.4+ but shapes v0.3 schema decisions.

### ARCHITECTURE.md — drill-in pointers by topic

`evryn-backend/docs/ARCHITECTURE.md` (1152 lines). AC0 has read sections 70-200, 502-575, 605-645, 632-780, 855-895, 918-925 in detail; 298-388 + 977-1006 during the deep-read pass. **What you should know about the parts AC0 has NOT read (sections, not exhaustive — grep `^##` and `^### ` for full TOC):**

- **lines 202-298 — Data Model overview** (foundation tables from prototype, `emailmgr_items` status lifecycle per ADR-018, Relationship Graph and Connection Records). Read when touching any schema decision or considering how forwarded items move through statuses.
- **lines 298-388 — `profile_jsonb` Structure** (AC0 read this during the deep-read pass; **critical for understanding what cron-Evryn loads**). Key facts: `pending_notes` is the only field conversational Evryn writes to; `story` is empty in v0.2 (Reflection writes it in v0.3+); `cross_user_notes` is a separate column structurally firewalled from `buildPersonContext` (never loaded with user data); `append_pending_note` and `append_cross_user_note` are RPC functions that prevent the raw-upsert-clobbers-entire-column failure mode. **Read this section if anything around what Evryn writes/reads about a user comes up.**
- **lines 382-389 — Separate Supabase Projects** (Agent Dashboard + Evryn Product — two projects, kept separate; credentials live in `evryn-backend/.env` for the product project).
- **lines 390-510 — Memory Architecture** (Memory Layers, Embedding Strategy, Story Model, Conversation Compaction, Reflection Module, Insight Routing Pipeline). AC0 has NOT read this in detail. **Read when** anything Reflection-related comes up (Wave 2 doesn't touch it; future trips will); also if you're asked about embedding strategy or story-vs-pending_notes mechanics.
- **lines 632-668 — Three Domains of Intelligence (build version)** — the runtime-mapping of tech-vision's three domains. Useful complement to the tech-vision spoke.
- **lines 670-862 — Identity Composition (Trigger-Composed systemPrompt)** — AC0 has read 632-780 (composition rules + 5 PROPOSED EDITs that landed). Lines 780-862 cover the prompt-caching optimization + voice anchor — AC1's PROPOSED EDIT there folded to permanent, worth a fresh read.
- **lines 863-878 — Proactive Behavior** — AC0 has NOT read this. **Read when** doing any cron-related work beyond Wave 2's scope; designing future cron-triggered behaviors.
- **lines 880-908 — Dual-Track Processing + Module Separation (At Scale) + Matching Calibration (Planned)** — AC0 has NOT read in detail. Module Separation echoes the tech-vision principles; Matching Calibration is v0.3+ design.
- **lines 910-942 — Principle Breadcrumbs** — explicit "these principles from the Hub/spokes must inform future work" list. AC0 has NOT read in full. **Read at any post-Mark architectural pivot** — these are the cross-cutting principles that get forgotten when build pressure increases.
- **lines 945-963 — Onboarding Patterns (from v0.1)** — v0.1 era patterns informing v0.2 onboarding. Read when working on the onboarding activity module (`activities/onboarding.md`).
- **lines 965-1044 — Security** sections: Information Firewalling by Construction (969-976), External Communication as Untrusted Data (977-998 — AC0 read during deep-read, **critical: external content goes in `prompt`, never `systemPrompt`, with explicit XML-tag separation**), Outbound Approval Gate (999-1006 — read), Attachment Handling Phased (1008-1014), PII Anonymization Known Gap (1015-1022), Crisis Protocols (1023-1031), Cultural Trust Fluency (1032-1035), "Escalate, Don't Fake" (1036-1039), Adversarial Testing (1040-1044). **Read the section that matches the concern in front of you.**
- **lines 1046-1119 — System Diagram (v0.2)** — ASCII diagram of the v0.2 runtime. Useful as a visual reference; read once and you'll have it.
- **lines 1120-1144 — Current State + Related Documents** — informational. Skim once to know what's in scope right now.

### BUILD-EVRYN-MVP.md — drill-in pointers by topic

`evryn-backend/docs/BUILD-EVRYN-MVP.md` (667 lines). AC0 has read 68-99, 114-165, 379-417, 575-605. The phase-tracker tables and v0.3 staging table are what's in the middle. **Skim with `Grep` on `^##` for a TOC**; drill into sections that match the work in front of you.

### Runtime code map — entry points and key files

AC0 has read `src/index.ts` (full, 100 lines) and `src/email/poll.ts:378-405` (cron checkProactiveOutreach body). The rest is unread by this AC0 but should be loaded on demand:

- **`src/index.ts`** (100 lines) — main entry. Sequence: Supabase connection check → resetStuckItems (recovery from crashed-mid-processing state) → health check HTTP endpoint → start Slack Socket Mode → startup notification → startPolling. Graceful SIGINT/SIGTERM handlers; uncaught-exception/unhandled-rejection alerts via `notifyDev`. **Read this once at startup as a sanity baseline.**
- **`src/email/poll.ts`** (423 lines) — polling loop + cron functions. Contains `startPolling`, `processNewEmails`, `checkProactiveOutreach` (line 360), `checkFollowUps`, `resetStuckItems`, `shouldRunProactiveCheck` gating predicate (line 337), the `PROACTIVE_CHECK_HOUR_PT` env-var read (line 328). **Read when** any cron-related work; if you need to understand the gating logic; if you're about to suggest a runtime intervention against the cron path (verify your mental model first).
- **`src/email/process.ts`** (231 lines) — user pathways. `processForward` and `processDirect` — the inbound user-pathway entry points. Calls `composeSystemPrompt(personContext)` (no operator, no profile) per ADR-030. **Read when** Wave 2 Bug B work touches these (you'll augment them with `getOperatorScopedMessages`).
- **`src/triage/classify.ts`** (535 lines) — the heart of the runtime. Contains `composeSystemPrompt` (the central prompt-assembly function used by all pathways), `runEvrynQuery` (the Claude API call), MCP tool definitions including `submit_draft`, `append_pending_note`, `append_cross_user_note`, `notify_slack` (line 258), `rescope_messages`, `read_identity_module`, `supabase_read`/`upsert`. **Read on Wave 2** when implementing Bug A — the `notify_slack` definition is the file you're editing.
- **`src/approval/flow.ts`** (394 lines) — `submitDraftForApproval` (line 84), `handleRevisionNotes` (line 279), `executeApproval`. The Wave 2 Item 4 fix lives in `submitDraftForApproval`; Item 3 lives in `handleRevisionNotes`. **Read on Wave 2** for both items.
- **`src/notify/slack.ts`** (574 lines) — `notifySlack`, `loadOperatorProfile`, `handleGeneralMessage` (the Slack-Operator pathway runtime), `startSlackSocketMode`. **Read** when touching Slack pathway behavior or ADR-030 thread-scope mechanics.
- **`src/notify/dev.ts`** — the `notifyDev` function (structured-alert path to `#dev-alerts`). Used throughout for ops alerts; the retry-with-backoff Build Mandate's structural alert mechanism.
- **`src/db/`** — `client.ts` (Supabase client init), `users.ts` (user CRUD + `createUser` with proper ADR-027 template — read when initializing new user records), `messages.ts` (message CRUD + `getRecentMessages`, `getThreadHistory`, `getThreadScope`, `getRecentMetaMessages`; Wave 2 adds `getOperatorScopedMessages` here).

### Key invariants worth holding cold

These come up implicitly across multiple sessions. Internalizing them prevents asking what could have been a confident answer:

- **Outbound only via `submit_draft`.** There is no `send_email` tool. Evryn structurally cannot send without operator approval. (ARCH §"Outbound Approval Gate".)
- **External content goes in `prompt`, never `systemPrompt`.** Security boundary — email content, user messages, any external input is *untrusted data*, not instruction context. (ARCH §"External Communication as Untrusted Data" — lines 977-998.)
- **`pending_notes` only writeable via `append_pending_note` RPC.** Raw `supabase_upsert` to `users.profile_jsonb` clobbers the entire column (story, _meta, structured all destroyed). The RPC is server-side append-only. (ARCH §"profile_jsonb Structure" — lines 367-371.)
- **`cross_user_notes` NEVER loaded by user-facing Evryn.** Structurally firewalled — it's a separate column, and `buildPersonContext` deliberately excludes it. Cross-user feedback flows through Reflection, not direct exposure. (ARCH lines 351-368.)
- **RLS on all tables, no exceptions.** Even internal/system tables. If a migration creates a table without RLS, it's incomplete. (DC's CLAUDE.md Build Mandate.)
- **Identity files load structurally, not via the file-read tool.** The `read_identity_module` tool excludes `operator.md` from accessible paths; `operator.md` only loads via code-level concatenation into `systemPrompt` for verified Operator pathways. (ARCH §"Identity Composition" + ADR-014.)
- **Two Supabase projects.** Agent Dashboard (monitoring, agent spend) vs. Evryn Product (the tables AC0 queries). Credentials in `evryn-backend/.env` for the product project. (ARCH lines 382-389.)
- **`labels are working hypotheses, never verdicts`.** Inferences carry confidence + source; users can contest. The schema supports provenance, not flat assertions. (ARCH §"profile_jsonb Structure" closing paragraph.)

---

## Humility note — what you (and I) still don't know

Even after the post-lock deep-read pass, AC0 has NOT exhaustively read the trust-and-safety spoke, the user-experience spoke, the vision-and-ethos spoke, the long-term-vision spoke, the business-model spoke, the GTM-and-growth spoke, the bizops-and-tooling spoke. Most of `evryn-backend/src/` is unread (only `index.ts` full + `poll.ts` sections). Most of `evryn-backend/identity/` is unread (only via diff during Mira's PR review). The integration-test fixtures themselves are unread.

**There are real holes in coverage** that may be holes in yours too if you only do the Tier 1-3 loads above. Justin's directive (2026-05-27): keep humility about what you haven't loaded; load specifically when a question lands that exposes a gap.

**Specific things AC0 today wishes he'd known preemptively:**
- The actual cron gating logic (`src/email/poll.ts:328-358`) — AC0 confidently told Justin that resetting `last_proactive_check_at` would force a cron fire; on reading the code, found that the *hour gate* runs first (line 370) and short-circuits before the 23h gate is even evaluated. Wasted a round-trip to correct. **If you're proposing any runtime intervention, read the code first.**
- The Railway CLI log truncation quirk — `railway logs --deployment` returns only init-phase content. **For runtime verification, look at what the system persists (DB rows, message timestamps, pending_notes adds) rather than relying on logs.**
- The `messages.internal_context` schema gap (ADR-028) — column specced but never migrated. Wave 2 plate or later sprint item.
- The Publisher-as-backstop-not-replacement framing (now in ADR-033). Justin pushed back hard on Soren's original framing. Identity carries the primary weight at tier 5 permanently; Publisher is the *backstop on the rare slip*; design bias is to keep the Publisher's catch list small. **Load-bearing for any future safety-architecture work.**
- The Bulkhead Architecture framing in tech-vision (every part assumes neighbors could be compromised) — useful for evaluating any security trade-off in front of you.

**Strategy for managing what you don't know:** when Justin asks a question you can't answer with sharp confidence, *tell him* — say "I haven't loaded that; let me check" — and then load surgically. The cost of a small targeted read is much smaller than the cost of confidently wrong information that has to be corrected mid-flow.

**Skim-with-headers-only as a load strategy:** use `Grep` on `^##` or `^### ` patterns (or read just the first N lines) to get section headers + openers without paying the full token cost. Often enough to know whether you need to drill in. Useful for ARCHITECTURE.md (1152 lines) and BUILD-EVRYN-MVP.md (667 lines) which are both long.

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
