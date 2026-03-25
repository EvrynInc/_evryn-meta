# Current State — Evryn (Cross-Project)

**How to use this file:** Snapshot of current project status across all Evryn repos. NOT a log — each update replaces the previous state. Updated during #lock by whoever is active (AC or Lucas). Read this to orient on what's happening now.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Keep this file under 50 lines.** If a project needs more than 2-3 lines, the detail belongs in that repo's own state file or build doc — not here.

*Last updated: 2026-03-25T11:19-07:00*
*Last #sweep: 2026-03-18*
*Last #align: 2026-03-18*

---

## Strategic Pivot: Evryn Product First

Team agent build (Lucas) paused — not cancelled. Building Evryn product MVP (v0.2 "Gatekeeper's Inbox") for Mark (pilot user, Seattle) first. See `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

**Key framing:** Evryn is a broker, not a SaaS. v0.2 surfaces connections from a gatekeeper's inbox — not sorting email, brokering connections. Everyone is a "user," both sides pay per-connection.

**Runway:** ~$6,125 cash + $15K available ($5K founder + $10K angel contingent on traction). Burn ~$800/mo current (agents paused); Fenwick ~$35K due August is the critical constraint. Revenue target: late April / early May.

## What's Next

- **All DC build work complete.** Days 2-5 done. ADR-018 status lifecycle migrated. Pipeline hardened. Follow-up cron, retry, approval parser, WebSocket heartbeat all operational.
- **core.md updated (AC1).** Story lenses framework, `shareable_with_user` protocol, "User privacy is sacred" rewrite. All activity modules done. gatekeeper-onboarding.md revision + onboarding.md pass planned (S5 session doc).
- **Remaining pre-go-live: three internal-reference files + gatekeeper-onboarding revision.** feedback-guidance.md (highest priority), trust-arc-scripts.md, company-context.md. Plus gatekeeper-onboarding.md tightening (preconditions, data orientation, intro substance, validation check-ins). Full plan in S5 session doc.
- **Remaining v0.3 identity files:** onboarding.md rewrite, new-contact.md, regular-user.md, conversation.md update (cross-user note writing).
- **Runtime scaffold needed (AC0 note for DC).** profile_jsonb template (not empty `{}`), `shareable_with_user` naming, model tier shift (Opus default). See `docs/sessions/2026-03-23-ac0-note-runtime-scaffold.md`.
- **Weekend thinking (AC2): major progress.** Structured fields, embedding strategy, matching trigger model written into ARCHITECTURE.md. ADR-019 (matching cascade pipeline — reflection, re-matching, cost optimization) and ADR-020 (model tiers — Opus for everything v0.2) written and breadcrumbed. BUILD doc model tiers fixed (was Sonnet default, now Opus per ADR-020). **Remaining AC2 items:** ARCHITECTURE.md confidence-aware reflection (#4), insight routing clarification (#5), business-model spoke installment plans + breadcrumbs (#6), investigative matching design note (#7). Session doc: `docs/sessions/2026-03-23-weekend-thinking-intake.md`.
- **Cost model needs v0.3+ features.** Current spreadsheet only reflects v0.2 costs — doesn't include reflection, matching, proactive outreach. Must be updated before v0.3 BUILD doc. Breadcrumb in BUILD doc v0.3 staging section.
- **Legal: Terms & Privacy Policy** — Fenwick draft received, extensive changes sent back (2026-03-18). Likely 3+ more days. Go-live blocked on legal completion — pushed to next week.
- **Go-live timing relaxed.** Mark is in no hurry. Quality over speed — "right over fast" principle added to sprint doc.

## Active Projects

- **_evryn-meta** — OC + QC repos created. AC2 v0.3 design proposals complete (6 files, Justin review pending). Weekend thinking evaluated (5 docs, session doc captures decisions + remaining work). Seattle launch research complete. Trusted Partner Briefing v1.7 drafted (Justin reviewing).
- **evryn-backend** — All DC build work complete (Days 2-5). Hardened pipeline. Status lifecycle migrated (ADR-018). All v0.2 identity activity modules done. Integration + adversarial test suites written. Remaining: three internal-reference files → deploy to Railway → integration test → adversarial test → go/no-go. Legal (Fenwick) blocks actual go-live.
- **evryn-ops** — Created. OC CLAUDE.md ready.
- **evryn-quality** — Created. QC CLAUDE.md ready.
- **evryn-team-agents** — PAUSED. Slack channel architecture documented.
- **evryn-dev-workspace** — DC's home repo.
- **evryn-website** — Live at evryn.ai.

## Infrastructure

- Running locally on Justin's desktop. No cloud deployment yet.
- Slack: "Evryn" app — Socket Mode, bot token via `@slack/bolt`. "Dev Alerts" app with webhook. Channels: `#evryn-approvals`, `#dev-alerts`, `#emergency-alerts` (not wired).
- Railway: `evryn-backend` project created, CLI installed and linked.
- Supabase: "Evryn Product" project. Schema migrated Day 2. Free plan — no automated backups.
- evryn@evryn.ai, review@evryn.ai, systemtest@evryn.ai — see operator guide for roles.

## Backlog

[Linear (EVR workspace)](https://linear.app/evryn) — backlog bucket, not a workflow tool. LINEAR_API_KEY is in `_evryn-meta/.env` for querying.
