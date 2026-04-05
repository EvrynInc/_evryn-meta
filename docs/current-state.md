# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-04-03T22:35-07:00*
*Last #sweep: 2026-03-18*
*Last #align: 2026-03-18*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** See the latest team current-state snapshot (`evryn-team-workspace/shared/current-state/`) for current bank balance and runway status.

## What's Next

- **AC0 (orchestrator): doc alignment done, DC knock list ready.** `seen_by_subject` → `shareable_with_user` renamed across all docs. `story_versions` table decided for v0.3 (rationale doc updated). Runtime init reminder in ARCHITECTURE.md. Story → match profile → embedding pipeline made explicit. Adversarial test protocol fixed. Permissions simplified. DC tasks queued (see below). `follow_ups` rename note pending (`docs/sessions/2026-03-25-ac0-note-follow-ups-rename.md`).
- **AC1 (identity): in progress.** core.md done (story lenses, shareable_with_user, privacy rewrite). All activity modules done. Remaining pre-go-live: feedback-guidance.md (highest priority), trust-arc-scripts.md, company-context.md, gatekeeper-onboarding.md tightening. Full plan in S5 session doc.
- **AC2 (v0.3 design): mostly landed.** Structured fields, embedding strategy, matching trigger model, confidence-aware reflection all in ARCHITECTURE.md. ADR-019 + ADR-020 written and breadcrumbed. **Remaining:** insight routing clarification (#5), business-model spoke installment plans + breadcrumbs (#6), investigative matching design note (#7). Session doc: `docs/sessions/2026-03-23-weekend-thinking-intake.md`.
- **DC: all build work complete, new tasks queued.** Days 2-5 done. Pipeline hardened. New knock list from AC0: model tier switch (Sonnet→Opus), profile_jsonb runtime scaffold, `seen_by_subject` runtime cleanup, `confidence_audit` in template, Railway deploy. Waiting on AC1 identity files before spinning up.
- **Remaining v0.3 identity files:** onboarding.md rewrite, new-contact.md, regular-user.md, conversation.md update (cross-user note writing).
- **Cost model needs v0.3+ features.** Current spreadsheet only reflects v0.2 costs. Must be updated before v0.3 BUILD doc. Breadcrumb in BUILD doc v0.3 staging section.
- **Legal: v0.2 ToS and Privacy Notice — one revision remaining.** Fenwick finals received 2026-04-02. 10(a) PII carveout resolved: removing prohibition entirely, shifting responsibility to Initiating User. Updated docs expected Tuesday April 7. Both pages built for evryn.ai at `/terms` and `/privacy` — committed locally, push blocked on final revision. Phase 2 (v0.3) scoping call completed; meeting prep and wireframes sent. Phase 2 legal work in progress.
- **Go-live timing relaxed.** Mark is in no hurry. Quality over speed.

## Active Projects

- **_evryn-meta** — OC + QC repos created. AC2 v0.3 design proposals complete (6 files, Justin review pending). Weekend thinking evaluated (5 docs, session doc captures decisions + remaining work). Seattle launch research complete. Trusted Partner Briefing v1.7 drafted (Justin reviewing).
- **evryn-backend** — All DC build work complete (Days 2-5). Hardened pipeline. Status lifecycle migrated (ADR-018). All v0.2 identity activity modules done. Integration + adversarial test suites written. Remaining: three internal-reference files → deploy to Railway → integration test → adversarial test → go/no-go. Legal (Fenwick) blocks actual go-live.
- **evryn-ops** — Created. OC CLAUDE.md ready.
- **evryn-quality** — Created. QC CLAUDE.md ready.
- **evryn-team-workspace** — Cowork agent workspace. Major overhaul complete (2026-04-01/05): memory as narrative GPS (ADR-023), #standup/#consolidate/#lock protocols, task authority (ADR-025), Linear integration, project folder structure (helm/product/ops/legal/growth), research moved here from _evryn-meta, demarcation rule established. Agent integration tests passed. **4 items remaining — see `docs/sessions/2026-04-05-ac3-team-workspace-overhaul-remaining.md`.**
- **evryn-team-agents** — FROZEN. SDK-era agent build preserved as insurance. `evryn-team-workspace` is the active team home.
- **evryn-dev-workspace** — DC's home repo. developer.md agent definition created in _evryn-meta (verbatim copy, adaptation pending). CLAUDE.md updated with team-workspace reference and current team names. Stale SDK references cleaned.
- **evryn-website** — Live at evryn.ai. ToS + Privacy Notice pages built, committed locally, push pending Fenwick 10(a) response. Homepage updated: Terms | Privacy | Contact footer, bot-resistant contact email. Old privacy policy archived.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Slack: "Evryn" app — Socket Mode, bot token via `@slack/bolt`. "Dev Alerts" app with webhook. Channels: `#evryn-approvals`, `#dev-alerts`, `#emergency-alerts` (not wired).
- Railway: `evryn-backend` project created, CLI installed and linked.
- Supabase: "Evryn Product" project. Schema migrated Day 2. Free plan — no automated backups.
- evryn@evryn.ai, review@evryn.ai, systemtest@evryn.ai — see operator guide for roles.

## Task Management

[Linear (EVR workspace)](https://linear.app/evryn) — the team's task tracking system with RACI labels. For protocol and API key, see `evryn-team-workspace/shared/protocols/linear-protocol.md`.
