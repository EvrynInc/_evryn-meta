# Changelog — _evryn-meta

**How to use this file:** Brief one-liners per change. Detail lives in git log. Most recent changes at top.

**Monthly archive:** At the end of each month, move that month's entries to `docs/historical/changelog-historical/changelog-YYYY-MM.md`. Keeps this file from blasting context.

---

## 2026-03-25 (AC0 — orchestrator session, doc alignment, test prep)

- **`seen_by_subject` → `shareable_with_user` renamed everywhere** — ARCHITECTURE.md schema spec, BUILD doc memory timeline, adversarial test protocol. Aligns with core.md protocol (AC1). Runtime cleanup deferred to DC.
- **`story_versions` table decided for v0.3** — `story_history` breaks out of `profile_jsonb` into dedicated `story_versions` table at v0.3 launch, not deferred to v0.4. Rationale doc (05-memory-scaling.md) updated with decision, naming rationale, retention approach (ties to ADR-019 light/deep reflection split).
- **ARCHITECTURE.md: runtime initialization reminder** — New user records must use structured template, not empty `{}`. Reminder lives next to the schema spec so DC sees it when modifying fields.
- **ARCHITECTURE.md: story → match profile → embedding pipeline made explicit** — Stories are never embedded directly. Match profiles are separate written artifacts written by Opus editorial judgment. Closes gap where a reader could assume direct story embedding. BUILD doc memory timeline corrected accordingly.
- **ARCHITECTURE.md: confidence self-audit added (AC2)** — Reflection Module produces `profile_jsonb.confidence_audit` during weekly batch. Natural language confidence self-assessment. Also added to profile_jsonb schema block.
- **Adversarial test protocol fixed** — `seen_by_user` → `shareable_with_user` in setup and test 1.1.
- **Permissions simplified (_evryn-meta)** — `Bash(*)` replaces ~40 specific command prefixes. `linear.app` added to WebFetch.
- **DC knock list built** — Model tier switch, profile_jsonb scaffold, seen_by_subject cleanup, confidence_audit in template, Railway deploy. Waiting on AC1 identity files before spinning up.

## 2026-03-24/25 (AC2 — matching cascade, model tiers, ARCHITECTURE.md updates)

- **ADR-019: Matching Cascade Pipeline** — Full reflection → profile evaluation → re-matching design. Weekly batch at 50% cost, Evryn's judgment as profile-rewrite gate, two-phase re-matching (structured filter diffs + cosine sensitivity dial), Friday re-matching day, first matches real-time. Location architecture (PostGIS user_locations table) designed for v0.3.
- **ADR-020: Model Tier Selection** — Opus for everything in v0.2. Conversation is the product, triage is matching. v0.3+ needs dedicated analysis before downgrading any operation.
- **ARCHITECTURE.md updated (evryn-backend)** — Structured fields in profile_jsonb, location earmarked for PostGIS promotion, embedding strategy (what embeddings are good/bad at, two-phase pipeline), matching trigger model (event-driven, not scheduled), model tiers (Opus for everything), Reflection Module ADR-019 ref.
- **BUILD doc fixed (evryn-backend)** — Model tiers corrected from "Sonnet default, Opus for edge cases" to "Opus for everything" per ADR-020. Code example updated. ADR-019 ref in v0.3 staging.
- **Session doc updated** — Pickup reading list for fresh AC2. Items #2/#3 done, #4-7 remaining with per-item context.

## 2026-03-23 (AC2 — weekend thinking intake, structured fields decision)

- **Weekend thinking evaluated** — Five docs from non-repo Claude session assessed against full architecture (Hub, spokes, ARCHITECTURE.md, BUILD doc). Genuine improvements identified (onboarding frameworks, confidence-aware reflection, matching trigger model, embedding guidance). Redundancy caught (pattern observation system duplicates existing Insight Routing Pipeline). Conflicts flagged (investigative matching needs trust-architecture alignment).
- **Structured fields decision approved** — `profile_jsonb.structured` subobject for matching pre-filters (location, profession, company, industry). Extracted during triage when inferable, nulls when not. Story remains source of truth. No schema migration — JSONB subobject within existing column. AC1 implementing in triage.md.
- **Installment plans positioned for v0.4** — Trust-based pricing extension: non-binding payment plans for users who can't pay full connection value upfront. Opens market segments. Justin's strategic rationale captured in session doc.
- **Cost model gap flagged** — Spreadsheet only reflects v0.2 ops. Breadcrumb placed in BUILD doc v0.3 staging section. Justin to update before v0.3 BUILD doc.
- **BUILD doc updated (evryn-backend)** — v0.3 staging section: cost model verification breadcrumb + weekend thinking analysis references.
- **CLAUDE.md updated** — Sub-agent doc reading guidance: be wary, read directly when precision/nuance matters, sub-agents fine for low-lift tasks.

## 2026-03-23 (AC1 — core.md privacy + story lenses, S5 session doc)

- **core.md "User privacy is sacred" rewrite (evryn-backend)** — Hard constraint expanded: explicit consent model (this information, this person), default-private rule, existential consequence framing. Headline changed from "User isolation is absolute."
- **core.md story lenses framework (evryn-backend)** — Six categories Evryn maintains for every user profile: who they are, what they're looking for, how they came to Evryn, what you've observed, where you and this user are, what you wonder.
- **core.md `shareable_with_user` protocol (evryn-backend)** — Notes from others protocol: authorization model for cross-user information sharing. Renamed from `seen_by_subject` (awareness) to `shareable_with_user` (authorization). Felt appeal tying back to privacy constraint.
- **S5 session doc created** — Full revision specs for gatekeeper-onboarding.md (8 changes), onboarding.md pass (14 feedback items + MI priming), conversation.md update, three internal-reference files, ARCHITECTURE.md proposals. Reading list for fresh instances.
- **AC0 note written** — Runtime scaffold spec (profile_jsonb template, story_history separate table, model tier shift, adversarial test note). For DC via sprint doc.
- **S4 retirement ready** — All content captured in persistent docs or S5. Move to `sessions/historical/` next session.

## 2026-03-23 (AC0 — test suites, cost model note)

- **Integration test protocol written (evryn-backend)** — `tests/integration-test-v02.md`: full-chain test on Railway (deploy → onboard Rachel Blackwood → triage fixtures → data wipe).
- **Adversarial test suite written (evryn-backend)** — `tests/adversarial-test-v02.md`: 14 scenarios across 6 categories (privacy leakage, prompt injection, classification integrity, approval gate, crisis, resilience). Adversarial testing established as architectural practice in ARCHITECTURE.md.
- **BUILD doc cost model note** — v0.3 staging section updated: cost model spreadsheet only covers v0.2, must be extended before scoping v0.3 (reflection, matching, proactive outreach costs not yet modeled). Weekend thinking evaluation referenced.

## 2026-03-20 (AC0 — AC1 decisions, AC2 review, session hygiene)

- **AC1 decisions absorbed** — Standalone modules (gatekeeper-onboarding not nested with onboarding), pre-go-live internal-reference files (feedback-guidance, trust-arc-scripts, company-context). Sprint tracker, BUILD doc, core.md module hub updated.
- **AC2 v0.3 design proposals reviewed** — 6 proposals (connection graph, proactive behavior, multi-gatekeeper, feedback loops, memory scaling, trust at scale). All architecturally sound. Breadcrumbs placed in ARCHITECTURE.md + BUILD doc v0.3 Staging section with key questions. Prompt saved for re-run.
- **Session hygiene protocol** — settings.local.json cleanup added to all CLAUDE.md files (session startup) and lock protocols (session end) across AC, DC, OC, QC. AC settings.json: curl permission added for Slack webhooks. AC CLAUDE.md: Slack webhook instructions added.
- **Vertical sweep** — Full alignment check Hub→ARCHITECTURE→BUILD→sprint→identity→code. Two critical findings fixed by AC1 (core.md approval backstop, triage.md `done`→terminal states). Bcc bug fixed by DC.
- **Database backup** — Post-Day 5 migration backup (schema + data, 2026-03-20).

## 2026-03-19 (DC Day 5 — status lifecycle migration + stabilization)

- **Status lifecycle migration complete (evryn-backend)** — CHECK constraint updated (done→terminal states), processed_at dropped, lifecycle metadata on every status change with timestamptz + descriptive notes. Existing rows migrated: done→passed/ignored/delivered based on triage_result.
- **sendEmail retry (evryn-backend)** — executeApproval() now retries 3x with exponential backoff (2s, 4s). On final failure: error status + #dev-alerts.
- **Follow-up cron (evryn-backend)** — checkFollowUps() runs hourly. Delivered items >7 days → triggers Evryn via runEvrynQuery(). Follow-ups go through approval gate.
- **Approval parser improvement (evryn-backend)** — "approval_hint" parse type: if message contains "approve" but doesn't match regex, lists pending subjects for copy/paste.
- **WebSocket heartbeat (evryn-backend)** — Checks every 30min, alerts #dev-alerts if no Slack events in 2 hours.
- **Vertical sweep findings** — Two critical: core.md missing approval backstop (AC1 fixing), triage.md references `done` status (AC1 fixing). One moderate: Bcc not passed to sendEmail in executeApproval() (flagged for DC).

## 2026-03-19 (AC0 — ADR-018 status lifecycle + Day 5 prep)

- **ADR-018 revised with full status lifecycle design** — `triage_result` stays immutable (Evryn's prediction). `status` tracks lifecycle: new→processing→pending_approval→delivered→matched/passed/no_gk_response. Terminal states replace generic "done." Lifecycle metadata (timestamptz + annotated notes) replaces `processed_at`. Follow-up tracking via lifecycle entries. Approval gate as architectural invariant. Gatekeeper response mechanics.
- **ARCHITECTURE.md updated** — emailmgr_items Status Lifecycle section, Outbound Approval Gate in Security section.
- **DC Day 5 mailbox written** — status migration, sendEmail retry, follow-up cron, approval parser improvement, final stabilization.
- **AC0→AC1 note written** — core.md approval backstop, triage.md dedup/repeat-contact, gatekeeper-onboarding feedback loop, feedback-guidance.md two flows.
- **Operator guide updated** — delivered items follow-up, failed send retry, new alert types (WebSocket disconnect, follow-up drafts, send failures).

## 2026-03-20 (AC1 — gatekeeper-onboarding.md + identity framing fixes)

- **gatekeeper-onboarding.md written (evryn-backend)** — Standalone activity module. Structured around conversation flow: introduce → get to know them → learn criteria → what happens next (setup, validation, feedback, handoff with auto-responder end state). Four-step ramp from gatekeeper-approach.md woven in as script-as-skill. `onboarding_pending` pattern for tracking uncovered topics across conversations.
- **"Gatekeepers are just users" framing fix** — Fixed false dichotomy in identity-writing-brief.md (lines 180, 274). Gatekeepers are users whose current interaction involves their gatekeeper role. Same onboarding goal (understand who they are and what they need), with criteria-learning layer on top.
- **Onboarding/gatekeeper-onboarding standalone decision** — Originally planned as nested (gatekeeper layers on general onboarding). Changed: different situation modules load (gatekeeper.md vs new-contact.md), shared techniques live in internal-reference/ files. Composition model is one situation + one activity.
- **onboarding.md updated (evryn-backend)** — Gatekeeper section extracted (now in gatekeeper-onboarding.md). `onboarding_pending` pattern added. Deferred to v0.3.
- **S4 session doc updated** — Status, modules table, and key decisions brought current for fresh AC1 handoff.

## 2026-03-19 (AC1 — ADR-018 implementation + identity doc cleanup)

- **triage.md: ADR-018 status fixes (evryn-backend)** — `done` replaced with proper terminal states (`ignored`, `passed`). Dedup + repeat-contact handling added (re-triage vs follow-up data point vs repeat bad_actor). Bilateral framing: sender's story captures what *they* wanted, not just how they scored.
- **core.md: approval gate backstop (evryn-backend)** — "You never send anything without approval" added to Hard Constraints. Belt-and-suspenders with code-level enforcement (submit_draft tool). If tooling changes, Evryn still routes through approval or stops and asks Justin.
- **operator.md + gatekeeper.md confirmed clean** — Passed through runtime-dedup lens. Both are situation modules (disposition/judgment only), no redundancy with runtime mechanics.
- **Bcc bug flagged for DC** — executeApproval() stores draft_bcc but never passes it to sendEmail(). Written to ac-to-dc.md, absorbed by AC0.

## 2026-03-19 (AC1 — BUILD breadcrumbs + back to critical path)

- **BUILD doc breadcrumbs placed (evryn-backend)** — Memory scaling timeline (profile_jsonb structure pressure-test → v0.3 launch, pgvector → v0.3 launch, Reflection Module → v0.3 stabilization). Cross-user feedback routing spec added to feedback-guidance.md line item + Phase 2c. v0.3 testing character framework added to Testing Strategy.
- **triage.md finalized (evryn-backend)** — All Justin feedback addressed: gatekeeper privacy safeguard in story writing, "future version of you" richness framing restored, "create a new record" gap fixed, bad actor documentation motivation restored, italics/clarity fixes.

## 2026-03-18 (ADR-018: triage as bilateral matching)

- **ADR-018: Triage as bilateral matching — gold ≠ match ([ADR-018](docs/decisions/018-gold-to-match-bilateral-reframe.md)).** Initially proposed renaming gold→match; revised after realizing they're different stages. Gold = Evryn's prediction (triage classification). Match = confirmed reality (gatekeeper validated). Gold stays in the schema. Legal docs correctly use "match" for confirmed connections. Bilateral insight stands: triage is Evryn's first matching engine, sender's story should be tracked from day one. Gatekeeper feedback completes the gold→match transaction — onboarding must set this expectation, feedback-guidance.md must spec the flow.
- **Fenwick Terms and Privacy Policy draft reviewed** — extensive changes sent back. Separate doc at `docs/legal/2026.03.18-fenwick-review-response.md`.

## 2026-03-18 (AC1 — triage.md trim + identity doc review)

- **triage.md trimmed (evryn-backend)** — Removed runtime-redundant mechanics (field lists duplicated by tool descriptions, approval steps handled by submit_draft tool, "What You Have" section duplicated by structured handoff prompt). Kept all judgment content (classification framework, "spam is people," cultural trust fluency, merge caution, story writing quality, security). ~140 lines → ~95 lines.
- **Gatekeeper privacy safeguard added to triage.md** — Story writing instruction now explicitly says: don't assume gatekeeper acted on recommendation, write so nothing compromises gatekeeper's privacy if referenced in future conversation with this person.
- **Load-bearing language restored** — "future version of you" framing for story richness, "in the system" for bad actor recognition, explicit "create a new record" instruction, bad actor "this lets a future instance revisit" motivation.
- **Open design threads identified** — full profile_jsonb structure (story_history, pending_notes, notes with provenance) deferred to v0.3; cross-user feedback routing (gatekeeper feedback → contact profile) needs spec in feedback-guidance.md; testing character framework for v0.3 match testing.

## 2026-03-18 (#align)

- **#align protocol updated** — Added identity layer (Evryn's identity files) and agent identity layer (team agents when running) to checklist. Previous #align missed that identity files are where principles become practice.
- **"Nourishment, not stimulation" added to core.md** — Evryn's What You Believe section. Enticing and inspiring yearning is encouraged; manufactured craving is the line.
- **Internal-reference module tracking added to BUILD** — crisis-protocol.md and feedback-guidance.md before go-live; canary-procedure, trust-arc-scripts, contact-capture, company-context for v0.3.
- **Manual check-ins operator task** — Added to BUILD and operator guide. Evryn can't initiate in v0.2; Justin triggers check-ins manually until v0.3 proactive behavior is built.
- **Five principle breadcrumbs added to BUILD** — proactive check-ins (v0.2 manual → v0.3 automated), budget tracking (v0.3, existing dashboard), bias/fairness testing (v0.4, pairs with self-reflection), PII anonymization (hardening sprint v0.3→v0.4), ZDR (bundle with PII).

## 2026-03-17 (AC1 — conversation.md + identity/runtime dedup analysis)

- **conversation.md v2 written (evryn-backend)** — Lean activity module (~400 tokens): trust arc skill reference with breadcrumb triggers, feedback handling, proactive awareness, approval gate. v1 rejected (sloppy — repeated core.md, disembodied field references, no synthesis). v2 carries only what core.md and situation modules don't already provide.
- **Identity/runtime dedup principle established** — Justin observed triage.md duplicates runtime mechanics (field constraints in tool descriptions, structured handoff in prompt composition, auto-recording in tool responses). Principle: identity docs carry *judgment and disposition*; runtime carries *mechanics and data*. Applies to all future modules. triage.md trim deferred (decision pending: now vs stabilization week).

## 2026-03-17 (Seattle launch research + strategic reframe)

- **Seattle launch strategy research** — Full demand landscape analysis (`docs/research/seattle-launch-strategy-v1.md`): 7 demand channels (Freeze, transplant flood, tech displacement, cross-ecosystem void, dating, practical needs, cultural resonance), community ecosystem map (10+ sectors with specific orgs/events), spore dynamic (migration-driven organic expansion), I-5 corridor (Portland as inevitability).
- **"Concentrate effort, open aperture" strategic reframe** — Film is the hose, everything else is rain. Cross-domain IS the product; constraining to one domain cripples it. Proactive finding enables serving any user in any domain from day one.
- **GTM spoke updated** — Seattle data (7 waters), open aperture section, spore dynamic (mover + evangelist types), I-5 corridor expansion, proactive finding as engine.
- **Business model spoke updated** — Trust-based pricing Seattle cultural resonance, cross-domain density reframe, spore multiplier on Seattle investment.
- **Hub updated** — GTM section reframed from "film first, LA expansion" to "concentrate effort, open aperture" with Seattle as launchpad.
- **Gatekeeper approach updated** — Breadcrumb for non-film gatekeeper archetypes (tech, food, nonprofit).
- **Trusted Partner Briefing v1.7 drafted** — Market entry rewritten (Seattle ignition, gatekeeper strategy origin, open aperture, spore dynamic), Where We Are Now updated (3/17/26, v0.2 going live, AI-first team), Capital Strategy updated. Justin reviewing.

## 2026-03-17 (Day 4 — hardening + OC/QC repos)

- **Day 4 hardening complete (evryn-backend)** — All 10 hardening items: Gmail retry with exponential backoff (30s→5min), Supabase unreachable handling, SDK query() failure→error status, dedup verified (in-memory Set + external_id), edge cases (empty body skip, 50k char truncation, multilingual native), sequential rate limiting, startup crash recovery (reset `processing`→`new`), stale item re-ping (every 15min, 4hr threshold), uncaught error handlers, graceful shutdown (SIGTERM/SIGINT).
- **notifyDev() separation (evryn-backend)** — New `src/notify/dev.ts` for `#dev-alerts` via Dev Alerts webhook. Clean split: `notifySlack()`→`#evryn-approvals` (Evryn), `notifyDev()`→`#dev-alerts` (system). Same Unicode sanitization.
- **Status lifecycle hardened** — `new`→`processing`→`pending_approval`→`done` (happy path), `processing`→`error` (failure), `processing`→`new` (crash recovery on startup).
- **Conversation fixture test passed** — Fixture 15 through full pipeline: conversation.md pulled, submit_draft with "reply" classification, email threading correct, in-character response. All 4 checks passed.
- **evryn-ops repo created** — OC (Operations Claude) CLAUDE.md: SRE mindset, hard block authority, ops review checklist, monitoring table, severity-based workflow, standalone mailbox protocol, Slack webhook instructions.
- **evryn-quality repo created** — QC (Quality Claude) CLAUDE.md: adversarial reviewer, security-first mandate, code review checklist, ADR-aware review process, standalone mailbox protocol, Slack webhook instructions, v0.2 review targets.
- **Hub repos table updated** — evryn-ops and evryn-quality added.
- **Operator guide updated** — actual approval flow commands from DC Day 3 report, three-channel Slack structure, DND setup instructions.

## 2026-03-17 (Day 3 — approval flow + conversation pathway + Slack restructure)

- **Day 3 complete (evryn-backend)** — DC built full approval flow and conversation pathway. `submit_draft` MCP tool replaces `send_email` — Evryn cannot send directly, everything through Justin's approval. Approval flow: Evryn drafts → review@evryn.ai (delivery format) → Slack ping → Justin approves/notes → send (Bcc review@evryn.ai) or revise. Three Slack parsing patterns: `approve [subject]`, `notes [subject]: feedback`, `[subject]: feedback`.
- **conversation.md written and wired (evryn-backend)** — AC1 completed conversation activity module. Evryn pulls it on demand for direct messages. DC wired into identity reader tool.
- **Slack restructured (evryn-backend)** — Justin-initiated separation: `#evryn-approvals` (Evryn's channel, bot token), `#dev-alerts` (DC/AC/OC/QC, webhook). `#emergency-alerts` created for DND-override emergencies. Evryn app renamed "Evryn Notifications" → "Evryn". All incoming webhooks deleted from Evryn app — bot token via `@slack/bolt` is primary path. Webhook optional fallback in config.
- **Direct messages now create emailmgr_items** — deviation from spec (originally forwards-only), needed for approval flow draft metadata attachment. Tagged with `metadata.type: "direct_message"`.
- **`send_email` tool removed from Evryn** — replaced entirely by `submit_draft`. Stricter than spec but simpler and safer.
- **Email threading supported** — `inReplyTo` and `threadId` passed through approval flow to `sendEmail()`.
- **Slack Unicode sanitization** — em dashes, en dashes, smart quotes → ASCII before sending. Applies to ALL agents posting to Slack (code-side `notifySlack()` and curl-side webhooks).
- **Double subject prefix bug found and fixed** — Evryn included `[Evryn] Gold` AND approval code wrapped it again. Fixed with prefix stripping.
- **Operator guide created (evryn-backend)** — Justin's cheat sheet for approval flow, triage notifications, operator mode, escalations, go-live checklist. Maintained by AC during #lock; DC flags operator-relevant changes.
- **Sprint tracker enhanced** — "Blocks day" column added for critical path visibility. Identity/runtime dedup review added as Day 4 task.
- **OC/SRE strategy decided** — OC (manual Claude Code persona) now for sprint. SRE subagent under Soren (CTO agent) later for autonomous monitoring. Severity-based workflow: quick fix (OC→DC), architectural (OC→AC→DC), emergency (OC patches→notify all).
- **Three-channel Slack architecture** — `#evryn-approvals` (Evryn drafts/approvals), `#dev-alerts` (build status, non-urgent ops), `#emergency-alerts` (DND override, runaway behavior, anything touching Mark unsafely).
- **Lock protocol updated** — operator guide check added (step 12), auto-memory hygiene updated to match current policy.
- **AC/DC CLAUDE.md updates** — operator guide maintenance wired into AC handoff steps and DC report protocol.

## 2026-03-16 (Day 2 — schema migration + triage pipeline + AC review)

- **Day 2 complete (evryn-backend)** — DC built full triage pipeline in one session: schema migration (sender_type, triage_result, triage_reasoning, CHECK constraints, archived priority), SDK query() with trigger-composed identity (core.md + person context), MCP tools (Supabase read/write, identity module reader, email send, Slack notify), Slack Socket Mode two-way with catch-up-on-reconnect, forward detection, user record creation. 16/18 synthetic fixtures correct; 2 non-deterministic but defensible.
- **CHECK constraint principle added (evryn-backend ARCHITECTURE.md)** — Every text field Evryn writes must have a CHECK constraint. LLMs invent plausible values (e.g., `triaged` instead of `done`). Belt-and-suspenders: CHECK in database + valid values in tool descriptions. Confirmed by Day 2 testing.
- **triage.md updated (evryn-backend)** — "No note means triage" rule added. Fixes category error where Evryn sometimes classified forwarded emails as "direct correspondence" because the sender was writing to the gatekeeper. People emailing the gatekeeper IS the input; no gatekeeper note means evaluate.
- **Answer key assessment** — Evryn outperformed the answer key in every divergent case. Fixtures 09 (newsletter→ignore) and 16 (scam→bad_actor) were answer key errors from pre-S4 schema. Fixtures 11, 14, 17 Evryn correctly classified as gold where answer key said edge — she evaluated substance over surface.
- **DC mailbox protocol established** — ac-to-dc.md pattern: Slack ping first (verify comms), reading list, schema decisions summary, deliverables checklist, completion protocol (Slack ping + dc-to-ac.md debrief + commit/push).
- **Identity architecture validated by Day 2 testing** — Evryn's voice is strong even in procedural triage (not just a classifier, feels like a person who classifies). Cultural trust fluency from core.md works in practice (Japanese email translated and correctly classified). Tool call reliability high when handoff prompt explicitly names the module to pull.
- **Windows subagent limit noted (evryn-backend ARCHITECTURE.md)** — subagent prompts >8,191 chars fail on Windows. Main query unaffected. Breadcrumb placed for publisher subagent design.
- **Answer key corrections needed** — fixtures 04 (warm intro: gold→edge, Evryn too conservative), 09 (newsletter: pass→ignore), 12 (spammy-but-relevant: edge→pass, Evryn evaluated substance correctly), 16 (scam: pass→bad_actor). Stale `emailmgr_items` table comment also needs updating.
- **Sprint tracker table added (evryn-backend)** — all tasks across all days with owner and status. Makes missed parallel work visible.
- **#lock checkpoint** — current-state refreshed.

## 2026-03-15 (Identity writing S4 — triage rewrite + schema decisions + brief evolution)

- **Triage schema questions resolved** — all 5 gaps answered: `sender_type` (lead/ignore/bad_actor), `triage_result` (gold/pass/edge), `triage_reasoning` (renamed from summary), `profile_jsonb.story` (single append-only narrative, merged from story+notes), `_meta` hygiene key. Bad actors get status `bad_actor` (not restricted). Leads get status `lead` (not user — avoids table name ambiguity).
- **triage.md rewritten (v3, evryn-backend)** — phase-based structure (classify → record → act), table anchoring per phase, structured handoff from trigger, profile_jsonb creation with over-compression warning, cultural trust fluency nuance, identity resolution with same-person check. Dry-run tested with fresh instance — 8 findings, all addressed.
- **Schema reference doc created (evryn-backend)** — `docs/schema-reference.md`, pulled from Supabase OpenAPI endpoint. Snapshot of what IS (ARCHITECTURE.md is what ought to be).
- **ARCHITECTURE.md updated (evryn-backend)** — schema reference pointer, message recording architecture (outbound auto-recorded by tools, inbound recorded by Evryn), identity resolution breadcrumbs (v0.2 email + same-person check, v0.3+ multi-channel design needed), evryn_knowledge consolidation note (Reflection module, v0.3+).
- **Identity writing brief evolved (evryn-backend)** — clean header with lasting-guide purpose, Activity Module Patterns section (9 principles from triage.md), stale session-level content removed, S4 resolved questions added.
- **core.md updated (evryn-backend)** — Supabase tools mention in "What You Can Draw On."
- **gatekeeper.md updated (evryn-backend)** — Supabase table anchoring, triage history in profile (not raw emailmgr_items), prescriptive feedback learning.
- **Sprint doc DC0 added (evryn-backend)** — schema migration task with detailed COMMENT ON instructions, backup directory setup.
- **Sprint doc DC1 updated (evryn-backend)** — outbound tools must auto-record to messages table.
- **Sweep protocol updated** — schema & backup health check added (item 9).
- **Supabase project renamed** — "n8n Prototype" → "Evryn Product."
- **CLAUDE.md** — auto-memory hygiene tightened (MEMORY.md should only contain DO NOT WRITE notice). Numbering rule already present from earlier session.
- **review@evryn.ai created** — alias for draft review/approval workflow. Replaced all `justin@evryn.ai` references in review contexts across 7 files (triage.md, operator.md, sprint doc, BUILD doc, ARCHITECTURE.md, identity-writing-brief, session doc). Keeps Justin-the-user separate from the operator review function.
- **Test gatekeeper profile created (evryn-backend)** — `tests/fixtures/test-gatekeeper-profile.md` with character definition, `gatekeeper_criteria` JSON for Supabase seeding, and answer key for all 18 fixtures. Sprint doc updated with pointer.
- **#lock checkpoint** — current-state refreshed.

## 2026-03-14 (Identity review S3b + operational documentation)

- **core.md v7 (evryn-backend)** — Justin's full review pass (v6: ~16 line edits — voice, trust structure, precision) + three additions (v7: gentle guide paragraph, Smart Curiosity full 11-area framework, available modules hub "What You Can Draw On" section).
- **operator.md reviewed and approved** — "Be reasonably concise", instruction channel expanded (team integration feedback).
- **gatekeeper.md reviewed and approved** — No changes needed.
- **triage.md reviewed — gaps identified** — 5 schema questions (where do classifications live? who creates records?) + 3 doc clarity issues (no status update instructions, descriptive not prescriptive "Learn immediately", no existing-user check). Must resolve before rewrite.
- **Email address roles clarified (evryn-backend)** — `justin@evryn.ai` for draft review, `systemtest@evryn.ai` as test recipient (fictional gatekeeper). Fixed operator.md, triage.md, sprint doc. Sprint doc #align flag resolved.
- **emailmgr_items status lifecycle documented (evryn-backend)** — Consolidated status values in ARCHITECTURE.md (`new→processing→pending_approval→done`, `escalated`, `error`). Full lifecycle table in BUILD doc (who sets, what triggers next step, what catches stuck items). Startup recovery + stale item check added to sprint Day 4 hardening.
- **Escalation tracking (evryn-backend)** — Mechanics clarified: `notifySlack()` tool call during `query()`, item marked `escalated` in emailmgr_items. ARCHITECTURE.md Proactive Behavior section updated. EVR-54 created for full infrastructure (v0.3).
- **Go-live checklist updated** — `.env` flip (`SEND_ENABLED=true`, `TEST_RECIPIENT` to Mark's real address) added.
- **Sprint shifted ~2 days** — Snow/power outage March 12-13. Day 2 now Mon March 16, go-live ~March 19-20.
- **Session doc rewritten** for machine transition — full reading list, triage gaps analysis, updated todos, shifted timeline.
- **setup-credentials.md created (evryn-backend)** — Slack Socket Mode + Railway step-by-step for Justin.
- **#lock checkpoint** — current-state refreshed.

## 2026-03-14 (Testing approach: fictional gatekeeper + two-phase validation)

- **Testing strategy updated (evryn-backend)** — Replaced "pre-define Mark's real criteria" with fictional test gatekeeper approach. Two phases: (1) hand-seeded criteria for Day 2 engine validation, (2) wipe-and-reonboard integration test on Day 4 (Justin plays fictional gatekeeper at `systemtest@evryn.ai`, Evryn gathers criteria through Slack-initiated onboarding conversation). Mark's real criteria learned through his own onboarding — not pre-defined.
- **BUILD doc + sprint doc updated** — Fictional gatekeeper character defined on Day 1 (with answer key). Day 2 uses hand-seeded criteria. Day 4 tests full chain: Slack introduction → Evryn outreach → onboarding conversation → criteria gathering → classification. Validates the pipeline Mark will actually experience.
- **Manus evaluated and rejected** — Chinese company, incompatible with Evryn's security posture. Claude Code Agent Teams and Cowork researched as alternatives. Conclusion: neither replaces the need for a custom agent build, and the MVP bottleneck is human tasks (identity files, credentials) not coding speed. DC instances complete estimated 2-hour builds in 5-7 minutes.
- **#lock checkpoint** — current-state refreshed.

## 2026-03-11 (DC credential setup + Identity writing S3a prep + Claude Code permissions)

- **Slack Socket Mode credentials configured (evryn-backend)** — Socket Mode enabled, App-Level Token generated, Bot Token scopes set (chat:write, channels:history, channels:read, im:history, im:read, groups:read, groups:history, users:read), event subscriptions (message.channels, message.im, message.groups). Tokens in `evryn-backend/.env`. Legacy webhook URL retained until Socket Mode is live in code.
- **Railway project created and CLI linked (evryn-backend)** — project `evryn-backend` on Railway, CLI installed and linked to local repo. DC deploys with `railway up`.
- **Slack breadcrumb (evryn-team-agents)** — ARCHITECTURE.md note: copy Evryn Notifications app config for future agent Slack apps.
- **Identity writing brief (evryn-backend)** — "What Identity Means" section, "Rewriting Rules" section (pointer comments, "more Evryn" test, prescriptive language), caching/cost note, gentle guide requirement, Smart Curiosity in full decision.
- **Pointer comments added** to all 5 existing identity files — rewriting guidelines gate.
- **Sprint doc dates fixed (evryn-backend)** — days of week corrected, Day 1 extended framing added.
- **Claude Code permissions** — portable `settings.json` (in git, `~/` paths) created for all 5 repos. `settings.local.json` files cleared and untracked. `.gitignore` updated across all repos. Permissions hygiene notes added to AC and DC CLAUDE.md files.
- **Session doc rewritten** for clean handoff — full reading list for fresh instance, decisions captured, cleanup items batched.
- **#lock checkpoint** — current-state refreshed.

## 2026-03-10 (Cross-doc consistency + BUILD memory table restoration)

- **BUILD doc (evryn-backend)** — Stale phase names stripped (8 locations), "Gmail as natural archive" corrected to Supabase, "triage system prompt" → "composable identity files", memory architecture table restored (had been over-trimmed to pointer-only — DC needs the build-resolution detail while writing core.md).
- **ARCHITECTURE.md (evryn-backend)** — Sprint dates corrected (March 11-17), Current State section updated (Phase 0a/0b DONE, remaining identity files listed), stale "triage system prompt" terminology fixed.
- **SPRINT doc (evryn-backend)** — AC1 task updated to "composable identity files" with correct directory structure. All "Build 2" references → "v0.3".
- **Architecture trim brief** — Moved to `docs/sessions/historical/2026-03-09-architecture-trim-brief.md` (work complete).
- **Claude Code permissions** — `settings.local.json` cleaned up from one-off approvals to structured allow list (reads scoped to Evryn repos, safe git/bash/dev tools auto-approved).
- **#lock checkpoint** — current-state refreshed.

## 2026-03-09 (#align — evryn-meta + evryn-backend)

- **#align results:** 4 principles with no build representation (addressed), 1 build/principle tension (date updated), 0 ADR integrity issues, 6 missing breadcrumbs (placed). All 17 ADRs hold.
- **identity-writing-brief.md (evryn-backend)** — Cultural trust fluency added as structural principle (design constraint, not future feature). "Spam is people" added to triage.md content spec (redirect before blocking).
- **ARCHITECTURE.md (evryn-backend)** — "Behavioral Design Principles" section added after Onboarding Patterns: catalyst-not-replacement, emotional peak tagging, "talk to Evryn" as primary landing. These are v0.3+ breadcrumbs that inform identity writing and future build specs.
- **BUILD-EVRYN-MVP.md (evryn-backend)** — "Phase 1-2 Principle Breadcrumbs" section added before Future Phase Resources: 9 deferred principles with spoke sources, timing, and build impact. v0.3 web app design principle made explicit (conversation-first, not form-first).
- **Hub (roadmap.md)** — Mark live date updated from "~March 10" to "~March 18-19".
- **GTM spoke** — v0.2 date updated to match Hub.
- **ADR-005** — v0.2 implementation note added: the public-knowledge/internal-reference directory split is the v0.2 implementation of the information boundary this ADR called for.
- **current-state.md** — #align date updated.

## 2026-03-09 (#sweep — doc hygiene + protocol hardening)

- **Absorption protocol added to AC CLAUDE.md** — information must flow back up the doc hierarchy (session → sprint → BUILD → ARCHITECTURE). Persistent docs never reference ephemeral session docs (one exception: BUILD doc active session pointer, cleared at #lock).
- **Build progress tracking added to both #lock protocols** — BUILD doc status column updated at #lock, sprint doc tasks marked, active session pointer cleared when absorbed.
- **AC/DC protocol updated** — mailbox checks at session startup and #lock (both AC and DC). DC explicitly told to tell Justin when writing to dc-architecture-notes-for-ac.md.
- **DC #lock protocol restructured** — old steps 3+6 merged into single "AC handoff" step. Mailbox check added. Multi-instance note: designated instances (DC1, DC2) only absorb their own notes.
- **DC CLAUDE.md updated** — build progress tracking rule, session start mailbox check with multi-instance safeguard, permanent infrastructure framing for AC/DC.
- **BUILD doc (evryn-backend)** — status columns added to all phase tables (0a/0b DONE, 0c-0e DEFERRED, Phase 1-2 NOT STARTED). Active session pointer added.
- **Sprint doc (evryn-backend) rewritten** — Day 1-5 with dates (Tue 3/11 – Mon 3/17), BUILD phase mappings, per-task status (DC1 scaffolding DONE, AC2 fixtures DONE, AC1 system prompt IN PROGRESS). Friday meeting removed. After Sprint dates corrected (stabilization week March 18, Build 2 ~March 25). OC/QC timing updated to Day refs.
- **AC CLAUDE.md** — OC/QC repo descriptions updated from specific sprint days to trigger-based timing.
- **current-state.md** — #sweep date updated, Mark live date corrected (~March 18-19).

## 2026-03-09 (Doc hygiene + #lock)

- **Session docs reorganized** — S1 and S2 archived to `docs/sessions/historical/`. S3 created with remaining identity writing work only. All ADR and persistent doc references updated to historical/ paths.
- **S3 bug fixed** — "triage is deterministic from email headers" corrected to match ADR-017 (forward ≠ triage, Evryn determines intent). Cultural trust fluency table added to internal-reference files list.
- **CHANGELOG February archived** to `docs/historical/changelog-historical/changelog-2026-02.md`. Monthly archive instruction added to CHANGELOG header.
- **trust-and-safety spoke** — "spam is people" principle added to spam mitigation bullet (redirect before blocking; bad actors get blocked, bad habits get redirected).
- **LEARNINGS.md** — 4 new entries (#36-39: forward ≠ triage, situation per-context, untrusted input in prompt, catch-up-on-reconnect).
- **AGENT_PATTERNS.md** — 3 new patterns (per-context situation determination, defense-in-depth for privileged modes, catch-up-on-reconnect).
- **ARCHITECTURE.md trim brief** written at `docs/sessions/historical/2026-03-09-architecture-trim-brief.md` — reading list, strategy, constraints for a fresh instance to trim from 847 to ~500 lines. *(Executed in subsequent session — trim complete.)*
- **#lock checkpoint** — current-state refreshed.

## 2026-03-06 (Cross-repo gatekeeper flow alignment + doc cleanup)

- **gatekeeper-approach.md aligned with gatekeeper-flow.md** — v0.2 = calibration only (no sender contact), forwarding section updated for v0.3+ with flow doc reference, CAN-SPAM label corrected.
- **gatekeeper-flow.md** — Pathway 2 preference note added (preferred end state, but Pathway 1 works indefinitely).
- **evryn-backend ARCHITECTURE.md** — pricing model fixed (gold ↔ gatekeeper = free, cast-off = paid), three-tier outreach refs (gold/edge/pass) replace generic messages, system diagram updated for Socket Mode + simplified trigger + approval flow.
- **evryn-backend BUILD doc** — v0.3 scope clarified (all classifications + Phase I backlog), stale "Gmail IS the capture mechanism" fixed (triage pipeline captures in Supabase), Socket Mode added to Slack line, systemtest@evryn.ai → justin@evryn.ai for approval review, Phase 1d relabeled Slack-based.
- **gatekeeper.md identity module** — "What You Know" → "What You Should Know" lifecycle fix (don't assert knowledge Evryn might not have yet during onboarding).
- **Session doc items 4/6/7 marked done** — gatekeeper lifecycle fix, ARCHITECTURE diagrams, BUILD Socket Mode.

## 2026-03-05 (SDK Skills alignment + dynamic loading/sessions/activity determination)

- **ADR-012 addendum written** — SDK Skills framework evaluated against identity architecture. Skills format principles adopted; loading mechanism not needed. Activity modules already serve as discovery layer more precisely than Skills metadata.
- **ARCHITECTURE.md provisional note → resolved** — Skills alignment no longer open.
- **Activity modules shift from trigger-loaded to on-demand** — trigger can only deterministically know triage (forwarded email) and operator (Slack). Everything else: Evryn reads person context and determines activity, pulls activity guidance via tool if needed.
- **SDK sessions NOT used for user-facing interactions** — memory-managed context from Supabase instead. Single source of truth, cross-channel by default, full control over what's summarized.
- **Core.md becomes Evryn's activity hub** — needs "available activities" section so Evryn knows what on-demand resources exist.
- **Prompt caching strategy clarified** — prefix ordering (core first) gives automatic caching; optimization deferred to v0.3+.
- **Unknown sender routing identified as open item** — person/ignore/bad_actor classification needs to be available outside triage pathway.

## 2026-03-05 (Structural work to support identity write — context discipline)

- **Required Context pattern added to `evryn-backend/docs/ARCHITECTURE.md`** — doc-level header declaring 4 must-read docs with consequence language ("without it, you'll..."), plus per-section context notes on all 9 `##` sections.
- **SDK knowledge digested inline** in ARCHITECTURE.md Identity Composition section — what SDK offers natively (settingSources + Skills), why we diverge (trigger knows context, prompt caching, structural security), what we DO use (query, hooks, MCP, sessions, subagents). Provisional note: SDK alignment not yet fully resolved.
- **Context Discipline section added to AC's CLAUDE.md** — "always read the architecture doc before build-level work, honor its Required Context section."
- **Required Context stub added to `evryn-team-agents/docs/ARCHITECTURE.md`** — placeholder for when Lucas build resumes.
- **Root cause diagnosed:** AC keeps losing SDK context because no reading path points to the SDK research with urgency. ARCHITECTURE.md documented the trigger approach but never explained what the SDK offers natively — fresh instances see only the answer, never the question.

## 2026-03-05 (Identity writing S2 — modules + BUILD workflow + structural rethink)

- **Situation modules written and pushed:** `operator.md` (Justin mode, approval workflow), `gatekeeper.md` (gatekeeper relationship context — needs lifecycle fix: "What You Know" → "What You Should Know").
- **Triage activity module complete** (`triage.md`) — emailmgr_items tagging (user/ignore/bad_actor), gold/edge/pass classification, user record provenance in `users` table, precondition checks, security section. Multiple rounds of Justin feedback.
- **BUILD doc workflow rewritten** — steps 4, 7-10 expanded, approval gate updated (systemtest@evryn.ai + Slack), preconditions/error handling added, v0.2 vs v0.3 expectation-setting framing added to step 4.
- **gatekeeper-approach.md updated** — delivery preferences struck (send as they come), "End State" section labeled as v0.3+ target.
- **identity-writing-brief.md updated** — added gatekeeper-approach.md and learning-levels doc to source materials.
- **Onboarding first draft written but rejected** — 14 specific issues from Justin (missing workflow structure, "let them lead" wrong, gatekeeper onboarding should be separate, need real situation modules not stubs). Paused on structural rethink.
- **Structural rethink triggered** — three open questions: (1) SDK Skills framework alignment (should Evryn choose her own modules?), (2) module shape/format (job description + workflow, not personality guide), (3) what belongs in core.md vs activity modules. Must resolve before continuing.

## 2026-03-04 (Identity writing session 2 — module architecture restructure)

- **Operator moved from activities/ to situations/.** Operator mode answers "who am I talking to?" (Justin), not "what am I doing?" — the activity varies. ADR-015 revised.
- **Module granularity decided: Option A (lean modules + reference files).** Activity modules carry judgment (~500-800 tokens), not procedures. Detailed procedures in `internal-reference/`, Evryn pulls via tool when needed.
- **knowledge/ renamed to public-knowledge/, internal-reference/ added.** Bright security line: public-knowledge = content Evryn can share with users; internal-reference = procedures never surfaced.
- **Two new situation stubs:** `new-contact.md` (unknown sender, v0.3), `regular-user.md` (established relationship, v0.3).
- **Standardized situation order:** operator, gatekeeper, gold-contact, cast-off, regular-user, new-contact.
- **Six docs updated:** ADR-015, ADR-012, ARCHITECTURE.md (evryn-backend), identity-writing-brief.md, session doc S1, this changelog. current-state.md pending.

## 2026-03-04 (Identity writing session 1 — core.md)

- **core.md v1–v4** written through 4 drafts with Justin's line-level feedback. v1 (instruction manual, rejected) → v2 (soul-first rewrite from Master Plan) → v3 (structural reorder, committed) → v4 (all final edits applied, on disk, pending one tiny edit from Justin before commit). File at `evryn-backend/identity/core.md`.
- **Identity directory structure** created in evryn-backend: `identity/`, `identity/situations/`, `identity/activities/`, `identity/knowledge/`.
- **Session doc** written at `docs/sessions/historical/2026-03-04-identity-writing-s1.md` — 9 architectural decisions, v4 draft, offloaded content routing (what moved from core to which module), source materials index, open questions, resume instructions. All decisions absorbed into ADRs and persistent docs.
- **AGENT_PATTERNS.md** — 2 new patterns: Script-as-Skill, Two-Layer Pacing.
- **LEARNINGS.md** — 2 new entries: "Rich insights" over "structured data" (#34), Soul DNA test (#35).

## 2026-03-02 (Learning architecture research — three docs created)

- **Three learning research docs created** in `docs/research/`: `learning-levels-and-instrumentation.md` (three-level framework, reasoning traces, decision feedback flow, approval gate as training interface), `metacognition-and-self-reflection.md` (two scopes of reflection, Advisory Council, adversarial self-examination, constitutional principles for learning, "rich context softly held"), `ml-transition-and-personalization.md` (ML transition triggers, synthesis process, personalization/correction weights, down-confidenced defaults, conflicting teachings resolution).
- **Breadcrumbs placed** in `docs/hub/technical-vision.md` (pointer to all three research docs), `evryn-backend/docs/ARCHITECTURE.md` (3 breadcrumbs: reasoning traces in Insight Routing Pipeline, self-reflection note, approval gate as training interface), `evryn-backend/docs/BUILD-EVRYN-MVP.md` (reasoning trace requirement on Phase 1 step 1c, approval outcome tracking on step 1d).

## 2026-03-02 (Session doc extraction — identity writing brief ready)

- **Identity writing brief** extracted to `evryn-backend/docs/identity-writing-brief.md` — all actionable content from archived session doc (file structure, structural principles, content specs, 14 source materials). Nothing actionable remains only in archive.
- **Cookbook implementation notes** added to BUILD doc Key Cookbooks section (hook env vars, compaction_control, beta flags).
- Session doc archive confirmed reference-only after full 1024-line audit.

## 2026-03-02 (Sprint launch — Session 4 decisions placed)

- **ADR-012: Trigger-Composed Identity** — Option A confirmed. Trigger script reads identity files, concatenates into single `systemPrompt` string. No settingSources, no filesystem config. Full control over content, ordering, token budget.
- **ADR-013: TypeScript for Agent Runtime** — TypeScript for agent runtime (v0.2), Python for ML services (v0.3+). Separate services with API boundaries. Python SDK now GA but decision stands on ecosystem maturity + existing codebase.
- **ADR-014: Operator Module — Slack Only** — Only Justin's verified Slack user ID loads operator module. Email from Justin → conversation mode (recognizes him, kitchen door stays closed).
- **ADR-015: Situation × Activity Module Matrix** — Modules split into situations (who: gatekeeper, gold-contact, cast-off) and activities (what: onboarding, conversation, triage, operator). Trigger composes: Core + situation + activity + user context.
- **ADR-016: Curated Memory Over Brute-Force History** — 4-tier memory system (core/working/long-term/consolidation). Curated understanding over raw conversation history. Semantic retrieval as safety net.
- DC1 scaffolding brief written to `evryn-backend/docs/ac-to-dc.md` (project init, email polling, Supabase, Slack, Railway, Mark Protection)
- DC2 synthetic fixtures brief written to `_evryn-meta/docs/tasks/dc2-synthetic-fixtures.md` (15-20 realistic test emails)
- Session 4 captured in session doc (SDK verification, sprint launch status, remaining work items)

## 2026-03-02 (Pre-Work #6 loose ends)

- **Pre-Work #6 Sessions 1-3 loose ends tied off** — Vertex AI breadcrumb added to evryn-backend ARCHITECTURE.md (External Services, evaluate at v0.3). Beautiful Language v0.9 committed to evryn-backend historical dir. Visual identity breadcrumb added to GTM spoke (video ads section → Beautiful Language source). Python/TS decision status clarified in session doc (final determination at Phase 1 start, not locked in; ADR when decided). Session doc remaining work items reconciled against current state.
- current-state.md refreshed for #lock.

## 2026-03-02 (#align session — belief-to-build integration)

- **#align completed** — full belief layer (Hub + 5 spokes) validated against build layer (both ARCHITECTURE.md files, BUILD doc, sprint plan).
- **Behavioral filtering language fixed** — distinguished platform *access* (behavior-filtered) from *matching* (full-picture including values/worldview). Updated trust-and-safety spoke + evryn-backend ARCHITECTURE.md breadcrumb.
- **OC/QC entities added** to AC's and DC's CLAUDE.md with sprint timing and interaction protocol notes.
- **#sweep/#align weekly cadence** enforced — both protocols now say "at least once a week" with proactive suggestion. Tracking dates added to current-state.md.
- **Sprint plan updated** — QC creation step added (end of Tuesday/start of Wednesday), OC/QC protocol reference notes added to both creation steps, dev/prod safeguard added.
- **Session doc expanded** — canary principle fix, crisis protocols, cultural trust fluency added to Pre-Work #6 session doc.
- **evryn-backend ARCHITECTURE.md** — 3 v0.2 breadcrumbs (gatekeeper-as-channel, no-open-messaging, witness-not-mirror) + v0.3 Design Breadcrumbs section (15 items from 4 spokes).
- **evryn-team-agents ARCHITECTURE.md** — #align flag added (do #align before resuming Lucas build).
- **evryn-dev-workspace CLAUDE.md** — OC/QC entities + repos added, evryn-backend status updated to Active.

## 2026-03-02 (First #sweep + sprint date corrections)

- **#sweep protocol expanded** — 3 new steps added (ADR consistency, changelog cross-check, session doc reconciliation). Hub/detail subdirectory added to step 1. Output template updated.
- **First #sweep completed** — all 8 steps clean or findings resolved. Report at `docs/sessions/2026-03-02-sweep-report.md` (temporary, deleted after findings absorbed).
- **current-state.md refreshed** — sprint dates corrected (March 2–6, was March 3–7), Pre-Work #6 updated from "blocker" to "sprint Monday, being done today."
- **SPRINT-MARK-LIVE.md dates corrected** (evryn-backend) — sprint March 2–6, stabilization week March 9, Build 2 ~March 16.
- **#align protocol expanded** — added full ADR archive as decision history input, hub/detail/ to belief layer, session docs and sprint plans to build layer. New step 3 (Decision Integrity) checks whether rejected alternatives still hold up against current thinking.

*February 2026 and earlier: archived to `docs/historical/changelog-historical/changelog-2026-02.md`*
