# Changelog — _evryn-meta

**How to use this file:** Brief one-liners per change. Detail lives in git log. Most recent changes at top.

---

## 2026-02-20

- Hub restructuring started: MPR → hub-and-spokes wiki. Created `docs/hub/` directory for domain spokes. Working notes at `docs/session-hub-build-2026-02-20.md`.
- ADR-008: Trust Mirror dropped (canary principle) — full reasoning documented
- Evryn company context module stubbed in BUILD-EVRYN-MVP.md (public-safe loadable module, not loaded every query, freshness requirement)
- Renamed `docs/session-handoff-2026-02-13.md` → `evryn-backend/docs/historical/build-doc-absorption-notes.md` (clearer purpose)
- #lock checkpoint mid-Hub-build

## 2026-02-19

- Questionnaire: final review pass — Anthropic DPA/ZDR details, shared data on deletion, mutual matching rewrite (explicit gatekeeper non-ownership), tone/trust rewrite, "the line we draw" sections merged, coaching insights clarified, various refinements throughout
- **Trust Mirror dropped as a feature** — pressure-tested and identified three fatal problems: membership leakage, coercion risk, honesty poisoning. Evryn is a broker; she finds best matches, she doesn't evaluate existing relationships. Documented in clarifications doc.
- Clarifications doc: Trust Mirror reversal documented with full reasoning, canary principle, and flow-through targets
- Canary principle established: Evryn cannot comment on any specific named individual (even public info creates a baseline that leaks via deviation)
- Identified: MPR needs full port into Hub (living content stuck in historical doc). Near-term task after questionnaire.
- Questionnaire marked as final review draft, ready for Fenwick

## 2026-02-17

- Legal questionnaire: verification pass — read all system docs (ARCHITECTURE.md, BUILD-EVRYN-MVP.md, master-plan-reference.md, Hub, SYSTEM_OVERVIEW) against questionnaire. 16 gaps identified, all integrated.
- Questionnaire evolved from fourth → sixth draft: cast-off outreach consent, payments architecture (Stripe), StartEngine/crowdfunding, Trust Mirror + Latent Truth Discovery pathways, vouching mechanics, proactive outreach, biometric privacy, connection coaching, Participant-Based Business Access, emerging regulatory frameworks (EU AI Act, FCRA, anti-discrimination), PII anonymization current state, operator access disclosure
- Clarifications doc: added "Surfaced during verification pass" section with 15 items, each with "Needs to flow to" targets
- Decisions made: Evryn Credit = non-monetary promotional value (not stored value), StartEngine = pass-through model for securities compliance, Trust Mirror = Evryn's commercial judgment (not user data), behavioral filtering framing for anti-discrimination

## 2026-02-16

- Created `docs/legal/` directory for legal team documents
- Privacy & Terms questionnaire for Fenwick: 4 drafts. Covers all 7 questions + "Additional Context" section (trust assessment, safety imprint, user isolation, age, sensitive data, cross-border, Swiss foundation, mutual matching principle, connection types disclaimers, tone-and-trust framing)
- Decisions made: age=18, verification=pass-through model, safety identifier generalized, data export via support email
- Created `docs/legal/clarifications-for-system-docs.md` — tracks architectural decisions surfaced during legal work that need to flow to ARCHITECTURE.md, BUILD docs, and system prompts. Updated with resolved items and gatekeeper first-right-of-refusal discussion.
- Hub: clarified Master Plan spokes (relationship between Reference and v2.3)
- Open decisions: gatekeeper first-right-of-refusal (substantial discussion, "channel not ownership" framing captured), safety imprint technical mechanism

## 2026-02-13

- Created `evryn-backend/docs/ARCHITECTURE.md` (v4) — system blueprint: user model, data model, memory architecture, pipeline design, agent architecture, security, system diagram
- Lock protocol: added ARCHITECTURE.md as step 3 (update when anything architectural changes)
- Hub: added hygiene guidance (fidelity over brevity), reframed v0.2 as connection brokering, added user isolation principle, agent council stubs, ARCHITECTURE.md spoke
- SYSTEM_OVERVIEW: reframed data flow as "Connection Brokering" (not triage), added Evryn architecture principles (user isolation, publisher, proactive behavior), updated Evryn Backend section
- Read all Pre-Work #10 source documents + Dec 2 historical doc; nuance captured in session handoff
- Reviewed LEARNINGS.md and AGENT_PATTERNS.md for Evryn-transferable patterns
- Hub enriched: problem statement, Why Now, renamed Trust Architecture → Trust & Fit, GTM synthesis (gatekeeper + wave), Fenwick & West, flywheel in business model
- Retired `company-context.md` — unique content absorbed into Hub, all references updated across 4 repos, file deleted
- SYSTEM_OVERVIEW tightened: stripped Hub-duplicate sections, added swim lane status (Done/Next) per component, slimmed Current Priorities to Product Roadmap Sequence
- Created `evryn-backend/docs/historical/` — moved background docs, prototype, n8n, session handoff, v0.1 system prompt
- Moved v0.1 system prompt files from `_evryn-meta` to `evryn-backend/docs/historical/`
- Sources to Absorb section written in BUILD-EVRYN-MVP.md (pre-work checklist updated)
- Success criteria added to BUILD-EVRYN-MVP.md workflow section
- ADR-001: added Thea subagent reversal note
- MEMORY.md cleaned (removed ~70 lines of stale/completed content)
- Deleted cleanup-working-notes.md (all tasks complete)

## 2026-02-12

- Established hub-and-spoke document architecture: Hub (`docs/roadmap.md`) as single living source of company truth
- Master Plan Reference verified against full Master Plan v2.3 (side-by-side read, breadcrumbs, substantive additions, BizOps tools expanded)
- Moved Master Plan Reference + Master Plan v2.3 to `docs/historical/` with frozen headers
- CLAUDE.md: Hub pointer, reference-cleanup principle, communication rules, self-contained build doc principle
- AC/DC protocol: permanent infrastructure note
- Lock protocol: added CHANGELOG to checklist
- Cleaned stale references across repos (evryn-backend session handoff)

## 2026-02-11

- Created master-plan-reference.md (611 lines, comprehensive condensation of 3,205-line Master Plan)
- Moved Master Plan v2.3 from evryn-backend to _evryn-meta (company-level doc)
- Multi-repo sweep across all 6 repos (cleaned orphaned files, fixed timestamps, clarified protocols)
- Added "organize early" principle to CLAUDE.md Architectural Mandate
- Added v0.1 system prompt to `docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/`

## 2026-02-09

- Created ADR structure (`docs/decisions/`) with 7 initial ADRs (001-007)
- Restructured CLAUDE.md with Diátaxis + progressive depth approach
- Extracted AC/DC protocol to `docs/ac-dc-protocol.md`
- Extracted #lock protocol to `docs/lock-protocol.md`
- Extracted doc ownership table to `docs/doc-ownership.md`
- Created cross-project state file `docs/current-state.md`
- Absorbed and deleted session decisions doc (2026-02-06)
- Deleted vestigial mailbox files from `docs/` (moved to repo-level per protocol)
- Added DC CLAUDE.md cleanup items to archive removal plan

## 2026-02-06

- SDK architecture pivot: LangGraph → Claude Agent SDK (ADR-001)
- Created build spec DRAFT (`evryn-team-agents/docs/BUILD-LUCAS-SDK.md`)
- Created archive removal plan (`docs/archive-removal-plan.md`)
