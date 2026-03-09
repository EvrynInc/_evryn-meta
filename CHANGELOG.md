# Changelog — _evryn-meta

**How to use this file:** Brief one-liners per change. Detail lives in git log. Most recent changes at top.

**Monthly archive:** At the end of each month, move that month's entries to `docs/historical/changelog-historical/changelog-YYYY-MM.md`. Keeps this file from blasting context.

---

## 2026-03-09 (Doc hygiene + #lock)

- **Session docs reorganized** — S1 and S2 archived to `docs/sessions/historical/`. S3 created with remaining identity writing work only. All ADR and persistent doc references updated to historical/ paths.
- **S3 bug fixed** — "triage is deterministic from email headers" corrected to match ADR-017 (forward ≠ triage, Evryn determines intent). Cultural trust fluency table added to internal-reference files list.
- **CHANGELOG February archived** to `docs/historical/changelog-historical/changelog-2026-02.md`. Monthly archive instruction added to CHANGELOG header.
- **trust-and-safety spoke** — "spam is people" principle added to spam mitigation bullet (redirect before blocking; bad actors get blocked, bad habits get redirected).
- **LEARNINGS.md** — 4 new entries (#36-39: forward ≠ triage, situation per-context, untrusted input in prompt, catch-up-on-reconnect).
- **AGENT_PATTERNS.md** — 3 new patterns (per-context situation determination, defense-in-depth for privileged modes, catch-up-on-reconnect).
- **ARCHITECTURE.md trim brief** written at `docs/sessions/architecture-trim-brief.md` — reading list, strategy, constraints for a fresh instance to trim from 847 to ~500 lines.
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
