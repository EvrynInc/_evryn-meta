# AC0 Packout for Next Instance — 2026-05-27 (mid-integration-test handoff)

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

**From:** AC0 (the instance that dispatched + verified Wave 1 in the morning, shipped Wave 2 in the afternoon, prepped the DB + reviewed Mira PR #3 + locked; handing off before compaction)
**To:** Fresh AC0 on next instance
**Date:** 2026-05-27 (afternoon)
**Status:** Active. Wave 2 live on production. DB wiped clean for Mark. **Integration test (Phase 2) is staged and ready — Justin's about to drive it (or already is when you spin up).**

> **Backup reference (don't load by default):** the previous AC0's morning packout is at `docs/sessions/historical/2026-05-27-ac0-packout-for-next-instance.md` if you ever need the prior session's framing — everything operational you need to drive should be in *this* doc.

---

## TL;DR

You're observer + diagnostic helper during Justin's Phase 2 integration test, not driver. Justin plays both Operator (in `#evryn-approvals` via Slack) and Mark (via `systemtest@evryn.ai`). You watch, keep him contextualized at re-orient moments, help diagnose if anything goes off-pattern.

---

## In-flight state (what's *not* in current-state / CHANGELOG)

- **Mark's DB wiped clean for the test.** UUID + email preserved (`72c22bc4-f18e-404d-a1c9-6fcdf7289b3a` / `systemtest@evryn.ai`); display_name "Mark" + full_name "Mark Titus" preserved. Everything else zeroed: `profile_jsonb` reset to empty ADR-027 template, `cross_user_notes` cleared, `last_proactive_check_at` nulled, all emailmgr_items + scope-Mark messages deleted. Backup at `evryn-backend/backups/mark-data-pre-integration-test-wipe-2026-05-27.json` (recovery: re-insert from JSON).
- **Mira and DC are stood down.** Both have no pending work after today's ship. Don't dispatch unless something genuinely new comes up.
- **Lucas is actively working in `evryn-team-workspace`** — separate repo, no cross-contamination risk for the integration test. He has unpushed local commits there + in `evryn-backend` (BUILD-EVRYN-MVP.md breadcrumb); his stuff, not yours.

---

## Startup load

All required, in order.

1. `_evryn-meta/CLAUDE.md` — auto. **Gained meaningful content today** (directing-is-build-work expansion, Slack pings block, keep-Justin-contextualized rule, DC ping-channel discipline, branch-verify-before-commit, PR review file-state-vs-merge-base diff check). Read fully.
2. `_evryn-meta/docs/current-state.md` — auto.
3. `_evryn-meta/CHANGELOG.md` — read today's full entry; carries the day's narrative arc.
4. `_evryn-meta/docs/hub/roadmap.md` — orients you in the company.
5. **This packout.** You're reading it.
6. `_evryn-meta/docs/hub/technical-vision.md` (391 lines).
7. `evryn-backend/docs/ARCHITECTURE.md` — these ranges:
   - 114-200 (Operator Track + System Actors + Three Modes)
   - 632-780 (Identity Composition — full pathway-by-pathway breakdown including the new APPROVAL-FLOW REVISION PATHWAY block that landed today)
   - 999-1006 (Outbound Approval Gate Invariant)
   - 502-575 (Pipeline Design)
   - 918-925 (Approval Gate)
8. `evryn-backend/docs/BUILD-EVRYN-MVP.md` — 68-99 (Critical Principles), 114-165 (Workflow), 379-417 (Build Order/Phase status).
9. `evryn-backend/docs/SPRINT-MARK-LIVE.md` — 66-110 (Sprint Tracker / Day 6 status), 466-487 (Pre-Go-Live Cleanup — CRITICAL), 530-553 (Backlog — includes DC's Wave 2 flags routed earlier today).
10. `evryn-backend/tests/integration-test-v02.md` — the protocol Justin is executing.
11. `evryn-backend/tests/fixtures/test-gatekeeper-profile.md` — Mark character + answer key.
12. `evryn-backend/tests/fixtures/integration-test-script.md` — Justin's scripted lines.

**Trigger-load** (only if X happens):

- Operator / cron / thread-scope behavior surprises you → ADR-030 full + Amendment 2026-05-22 + ADR-031 (late-scope recovery)
- Evryn produces output that looks off → `evryn-backend/identity/core.md` + the relevant activity module (`onboarding.md`, `gatekeeper-onboarding.md`, `triage.md`, `conversation.md`)
- Tool or SDK behavior surprises you → `_evryn-meta/AGENT_PATTERNS.md` §"SDK Integration & Tool Wiring" lines 406-448 *only*. This doc is loose collected patterns; may not be directly applicable, but can be helpful to know.
- **Anything else off-pattern you can't ground in the above** → STOP, ask Justin before proceeding. Don't infer through gaps.

**Note on line numbers:** anchors are stable (section headers) but exact line numbers may drift as docs evolve. If a range doesn't match, grep the section header name.

---

## Architectural reference index — drill-in pointers by topic

When something off-pattern surfaces and you need depth, drill here. The discipline isn't to read all of this preemptively — it's to know *where to look the moment you need it*. Without these in back-of-mind, you won't even know what you're missing.

### `_evryn-meta/docs/hub/technical-vision.md` (in startup load, but framings worth holding cold)

- **System Landscape diagram** (top of doc) — full topology (Website + Backend + Supabase + Anthropic + Google Cloud + HubSpot + iDenfy)
- **Five imperatives + five critical conditions** — what the system must deliver vs. what structurally has to hold
- **Three Domains of Intelligence** (Conversation & Voice / Judgment & Matching / Intuition & Care) — categories of capability, not modules
- **Module Separation Principles** — safety gates have narrow context and independent judgment; bulkhead architecture
- **Data & Knowledge Layers** — six conceptual stores; critical separation between user data and Trust Graph
- **Privacy & Security Architecture** — Bulkhead, Zero Trust + Least Privilege, Information Firewalling (security by construction, not just instruction)
- **Sovereign Memory & Cryptographic Trust** — long-term target with Swiss Foundation; user vaults vs working intelligence

### `evryn-backend/docs/ARCHITECTURE.md` — drill-in by topic

The startup-load ranges cover today's load-bearing sections. Drill into these others as needed:

- **lines 202-298** — Data Model overview (foundation tables from prototype, `emailmgr_items` status lifecycle per ADR-018, Relationship Graph, Connection Records). Drill when touching schema decisions or how forwarded items move through statuses.
- **lines 298-388** — `profile_jsonb` Structure. Critical facts: `pending_notes` is the only field conversational Evryn writes to; `story` is empty in v0.2 (Reflection writes it v0.3+); `cross_user_notes` is structurally firewalled from `buildPersonContext`; `append_pending_note` and `append_cross_user_note` RPCs prevent raw-upsert-clobbers-column failure mode. **Drill here when anything around what Evryn writes/reads about a user comes up.**
- **lines 382-389** — Separate Supabase Projects (Agent Dashboard vs Evryn Product). Credentials in `evryn-backend/.env` for product project.
- **lines 390-510** — Memory Architecture (Memory Layers, Embedding Strategy, Story Model, Conversation Compaction, Reflection Module, Insight Routing Pipeline). Drill when anything Reflection-related comes up or embedding strategy questions land.
- **lines 632-668** — Three Domains of Intelligence (build version / runtime-mapping of tech-vision's three domains)
- **lines 863-878** — Proactive Behavior. Drill when cron-related work surfaces beyond Wave 2's scope.
- **lines 880-908** — Dual-Track Processing + Module Separation (At Scale) + Matching Calibration (Planned). Mostly v0.3+ design.
- **lines 910-942** — Principle Breadcrumbs (cross-cutting principles that get forgotten when build pressure increases). **Drill at any post-Mark architectural pivot.**
- **lines 945-963** — Onboarding Patterns (v0.1-era patterns informing v0.2). Drill when working on `activities/onboarding.md`.
- **lines 965-1044** — Security sections: Information Firewalling by Construction; External Communication as Untrusted Data (*critical: external content goes in `prompt`, never `systemPrompt`, with explicit XML-tag separation*); Outbound Approval Gate; Attachment Handling; PII Anonymization Known Gap; Crisis Protocols; Cultural Trust Fluency; Escalate Don't Fake; Adversarial Testing. **Drill the section that matches the concern in front of you.**
- **lines 1046-1119** — System Diagram (v0.2) — ASCII diagram of v0.2 runtime
- **lines 1120-1144** — Current State + Related Documents

### `evryn-backend/docs/BUILD-EVRYN-MVP.md` — drill-in by topic

Critical Principles + Workflow + Build Order already in startup load. Skim with `Grep ^##` for full TOC; drill sections matching the work in front of you.

### Runtime code map — entry points and key files

- **`src/index.ts`** (100 lines) — main entry. Sequence: Supabase check → resetStuckItems (recovery from crashed-mid-processing) → health check HTTP endpoint → start Slack Socket Mode → startup notification → startPolling. Graceful SIGINT/SIGTERM; uncaught-exception alerts via `notifyDev`. Read once as a sanity baseline.
- **`src/email/poll.ts`** (423 lines) — polling loop + cron functions. `startPolling`, `processNewEmails`, `checkProactiveOutreach` (line 360), `checkFollowUps`, `resetStuckItems`, `shouldRunProactiveCheck` gating predicate (line 337), `PROACTIVE_CHECK_HOUR_PT` read (line 328). **Read when** any cron-related work; if you need the gating logic; if you're about to suggest a runtime intervention against the cron path (verify mental model first — the morning's `last_proactive_check_at` story is the canonical "I was confidently wrong" example).
- **`src/email/process.ts`** (231 lines) — user pathways. `processForward` and `processDirect` — inbound user-pathway entry points. Now load Bug B's `operatorAboutUserSection` (4th arg to `composeSystemPrompt`).
- **`src/triage/classify.ts`** (535 lines) — the heart of the runtime. `composeSystemPrompt` (central prompt-assembly used by all pathways), `runEvrynQuery` (Claude API call), MCP tool definitions: `submit_draft`, `append_pending_note`, `append_cross_user_note`, `notify_slack` (now scope-logging post-Bug-A), `rescope_messages`, `read_identity_module`, `supabase_read`/`upsert`, plus new `formatOperatorAboutUserMessages` formatter (Bug B).
- **`src/approval/flow.ts`** (394 lines) — `submitDraftForApproval` (line 84, now retry-rollback-fixed post-Item-4), `handleRevisionNotes` (line 279, now Operator-audience-normalized post-Item-3 — loads full Operator-discipline), `executeApproval`.
- **`src/notify/slack.ts`** (574 lines) — `notifySlack` (now returns `Promise<string | null>` — the `ts` on bot-path success, null on webhook fallback), `loadOperatorProfile`, `handleGeneralMessage` (Slack-Operator pathway runtime), `startSlackSocketMode`.
- **`src/notify/dev.ts`** — `notifyDev` (structured-alert path to `#dev-alerts`). Used throughout for ops alerts; the retry-with-backoff Build Mandate's structural alert mechanism.
- **`src/db/`** — `client.ts` (Supabase client init), `users.ts` (user CRUD + `createUser` with ADR-027 template), `messages.ts` (message CRUD + `getRecentMessages`, `getThreadHistory`, `getThreadScope`, `getRecentMetaMessages`, post-Bug-B `getOperatorScopedMessages`).

### Key invariants worth holding cold

These come up implicitly across sessions. Internalizing them prevents confidently-wrong answers:

- **Outbound only via `submit_draft`.** There is no `send_email` tool. Evryn structurally cannot send without operator approval. (ARCH §"Outbound Approval Gate".)
- **External content goes in `prompt`, never `systemPrompt`.** Security boundary — email content, user messages, any external input is *untrusted data*, not instruction context. (ARCH §"External Communication as Untrusted Data".)
- **`pending_notes` only writeable via `append_pending_note` RPC.** Raw `supabase_upsert` to `users.profile_jsonb` clobbers the entire column (story, _meta, structured all destroyed). The RPC is server-side append-only.
- **`cross_user_notes` NEVER loaded by user-facing Evryn.** Structurally firewalled — separate column, `buildPersonContext` deliberately excludes it. Cross-user feedback flows through Reflection, not direct exposure.
- **RLS on all tables, no exceptions.** Even internal/system tables. If a migration creates a table without RLS, it's incomplete.
- **Identity files load structurally, not via the file-read tool.** `read_identity_module` excludes `operator.md` from accessible paths; `operator.md` only loads via code-level concatenation into `systemPrompt` for verified Operator pathways. (ARCH §"Identity Composition" + ADR-014.)
- **Two Supabase projects.** Agent Dashboard (monitoring, agent spend) vs Evryn Product (the tables AC queries). Credentials in `evryn-backend/.env` for the product project.
- **`labels are working hypotheses, never verdicts`.** Inferences carry confidence + source; users can contest. The schema supports provenance, not flat assertions.

---

## Integration test execution support

**The test protocol** (per `evryn-backend/tests/integration-test-v02.md`):

1. AC verifies (and wipes if drift) DB pre-deploy. ✓ **Done by previous AC0 (you).** DB is clean.
2. DC deploys + smoke-tests. ✓ **Done.** Wave 2 live.
3. Justin sends Evryn a NEW top-level message in `#evryn-approvals`: *"Hey Evryn — I want you to meet my friend Mark..."* (scripted intro at `evryn-backend/tests/fixtures/integration-test-script.md`).
4. Evryn does the **verify-and-lock beat** — looks Mark up in users table, presents verification block (name, brief description, company/context, role, status), waits for Justin to confirm, then calls `set_thread_scope({mark.uuid})` and announces the lock.
5. All Justin's subsequent operator messages about Mark go in that same Slack thread.
6. Evryn drafts an intro email to Mark → Justin approves at `#evryn-approvals` → email goes to `systemtest@evryn.ai`.
7. Justin replies from systemtest@ as Mark, using the scripted responses + the character profile.
8. Evryn processes those replies via `processDirect`, builds Mark's `pending_notes` via `append_pending_note`.
9. Re-run synthetic fixtures (Day 2 fixture replay) → compare to original Day 2 results.

**New since the test was last paused (5/21):** Bug B's auto-load fires in `processDirect` (and `processForward` + crons). When Evryn processes Justin-as-Mark's replies, she'll also see Operator-Evryn conversations *about* Mark loaded in her prompt with the discretion-floor label. Since the wipe cleared all Mark-scoped messages, the loaded section will be empty on early runs and start filling as the test progresses (Slack-Operator thread messages about Mark get `scope_user_id = mark.uuid` and load on future user-pathway invocations).

**What to watch as observer:**

- Verify-and-lock beat fires correctly (Evryn finds Mark, presents verification block, waits for confirm).
- Intro email draft lands at `review@evryn.ai` with the proper approval format (subject line, classification metadata).
- Bug B's discretion-floor language behaves correctly when the loaded section is non-empty.
- Mira's PR #3 hint **does NOT fire** (assuming `submit_draft` doesn't fail — it shouldn't on a clean test path). If it fires and Evryn handles it via `notify_slack`, that validates the hint; the hint is live only at next Railway redeploy (which isn't queued).

**If something goes off-pattern:** apply the verify-before-claiming discipline (CLAUDE.md Context Discipline section). The cron-trigger lesson from this morning still applies — don't assert how anything behaves without reading the artifact that defines it, with this question in front of you.



---

## Humility note — what you (and I) still don't know

AC0 has NOT exhaustively read the trust-and-safety spoke, user-experience spoke, vision-and-ethos spoke, long-term-vision spoke, business-model spoke, GTM spoke, or bizops-and-tooling spoke. Most of `evryn-backend/src/` is unread (only `index.ts` full + `poll.ts` sections, plus what got read in passing during today's work). Most of `evryn-backend/identity/` is unread (only via diff during PR reviews).

**One specific gotcha this AC0 hit (not yet in CLAUDE.md):** the Edit tool fails silently if `old_string` has even one character off — asterisks around `*your*` got missed today, required a re-read + retry. When an Edit fails on "string not found," re-read the file with `Read` first; don't assume your remembered text matches the literal bytes.

---

## Coordination notes for you

- **Ping Justin every response on `#team-alerts`, even when it seems like he's right there.** He's bouncing between AC0, Mira, Soren, AC1, DC, Lucas — sometimes multiple at once. This is a session-specific discipline Justin set today; not yet codified in CLAUDE.md. (The CLAUDE.md Slack-pings-are-attention-taps rule still governs *how* — one short sentence routing him to the chat, substance lives in the chat.)
- **Justin doesn't read agent-to-agent notes by default.** When you synthesize something for him (e.g., "what did DC flag?"), translate internal references — don't say "blocks 5a-5d" or "Proposal 08" without explaining what they are. You are the ambassador.

---

— AC0, 2026-05-27 (afternoon — mid-integration-test handoff)

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
