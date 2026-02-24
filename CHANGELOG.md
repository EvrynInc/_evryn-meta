# Changelog — _evryn-meta

**How to use this file:** Brief one-liners per change. Detail lives in git log. Most recent changes at top.

---

## 2026-02-24

- SDK research breadcrumbs placed: 8 new breadcrumbs across 4 docs for 6 research files (claude-agent-sdk, memory-systems, orchestration-frameworks, tools-and-workflows, linear-project-management, misc). Zero dead research — all 8 reports now linked.
- 2 stale `docs/research/` references fixed in team-agents ARCHITECTURE.md (communication-channels path + Related Documents table)
- Voice AI Stack moved from LEARNINGS.md to `docs/research/voice-ai-stack.md` (8th research report). Breadcrumbed in evryn-backend BUILD-EVRYN-MVP.md Voice section.
- First LEARNINGS.md hygiene pass: 17 entries promoted to one-line stubs, Voice section moved to research. ~226 → ~145 active lines.
- OpenClaw research report created (`docs/research/openclaw-research.md`) — 12-section pattern library from open-source AI assistant, with scope disclaimer
- Research breadcrumb convention established: italicized inline references in build/architecture docs pointing to specific research sections, with general "Research references" disclaimer at top of each consuming doc
- 18 breadcrumbs placed across 4 docs: evryn-backend ARCHITECTURE.md (5), BUILD-EVRYN-MVP.md (5), evryn-team-agents ARCHITECTURE.md (3), BUILD-LUCAS-SDK.md (5)
- current-state.md updated (Pre-Work #6 research prep done)
- LEARNINGS.md: added hygiene pass protocol (promote → stub → cross-pollinate)
- Research centralized: 6 topic files moved from `evryn-team-agents/docs/research/` → `_evryn-meta/docs/research/`. Monolith `RESEARCH.md` deleted (both repos). All stale references fixed across 4 repos.
- Research routing + "dead research" breadcrumb rule added to AC CLAUDE.md and DC CLAUDE.md
- Redundant CLAUDE.md scope line removed (already in SCOPE GUARDRAIL header)

## 2026-02-23 (evening session)

- Fenwick email addendum appended to privacy questionnaire (5 items: self-assessment sharing, abuse prevention, authenticity monitoring, training data pipeline, incident response)
- current-state.md: removed two open design questions (gatekeeper agreement terms → pre-launch checkpoint in ARCHITECTURE.md; safety imprint → parked in legal flow-through, surfaces during design)

## 2026-02-23

- **Spoke integration pass COMPLETE** — 34 gaps integrated, 1 dropped (StartEngine seeding) across 7 spokes + ARCHITECTURE.md. Gap analysis file deleted (recoverable from git).
- business-model spoke: pre-purchase credit bonus (targeting 30%), match types & value mapping, working capital with structural note (completed transactions, not stored value), sensitivity analysis framing (replaces stale Low/Medium/High), match quality progression, follow-through, segment-to-avatar cross-reference. StartEngine seeding dropped (leaner path).
- gtm-and-growth spoke: segment-to-avatar mapping table, precision-targeted belief ladders, growth ask timing (emotional intelligence framing), follow-through as film differentiator, referral chain resilience, rhizomatic growth metaphor, ethical salesperson ("the close is the relationship"), launch readiness discipline (sacred launch conditions + scope flex triggers)
- user-experience spoke: Interface Philosophy section (chat UX, persistent footer, Trust & Account page), "present but not pressing" design principle, CRM capture, after-care anticipation-building, connection summary cards, wallet visibility (muted pre-activation on Trust & Account page), Focused/Open Door notification control, graceful degradation. Trust Mirror verified fully dropped per ADR-008. Cross-link to five imperatives added.
- technical-vision spoke: "What the System Must Deliver" section (five imperatives + five critical conditions), cross-domain matching intelligence (coherence-calibrated modularity — evolved to intent-specific projections from holistic user understanding, open design question noted), dynamic weight adjustment (human-first framing), training data pipeline, security monitoring, incident response, compliance alignment, "no dark surveillance" with two constrained exceptions, model deployment discipline, pre-training with simulated data, resilience design triad
- ARCHITECTURE.md (evryn-backend): Design Drivers section (five imperatives at build altitude), Matching Calibration planned section (wizard-of-oz two-candidate offers to users for comparative training signal + operator reasoning review, schema implications for earlier versions)
- Fenwick questionnaire delta list: expanded from 3 to 5 items (added training data pipeline, incident response/breach notification). Justin captured into email draft.
- Google Drive MCP server evaluated and rejected — supply chain risk (single-author npm package with OAuth token access) not justified. Decision: Sheets editing via Claude.ai (native Drive integration), AC gets read-only CSV snapshots locally. current-state.md updated.
- Trusted Partner Briefing v1.4 marked as "fully ingested"
- current-state.md: clarifications doc stale reference replaced with specific open design decisions (gatekeeper agreement terms, safety imprint mechanism)

Previously this session (before context compaction):
- Spoke integration pass: 11 of ~35 gaps integrated across 3 spokes (long-term-vision, trust-and-safety, BizOps). All 7 high-priority gaps complete.
- long-term-vision spoke: added "Rejected match history" to Trust Core list, "The AI Can't Deliver" and "Black Box Decisions" risks
- trust-and-safety spoke: added "Evryn Is a Witness, Not a Mirror" section (with GDPR/EU AI Act implementation note), "Regulatory Alignment" (EU DSA), "User Disclosures", "Preventing Platform Abuse", expanded AI detection in "Detecting Harm and Deception"
- BizOps spoke: legal/compliance content centralized to Fenwick questionnaire (spoke links to it), StartEngine compliance framing added to Fundraising section (using questionnaire's more careful framing over MP's emotional-timing language)
- Decision: ToS/PP legal content centralized in Fenwick questionnaire, not scattered across spokes. BizOps spoke references questionnaire; when ToS/PP are drafted, they supersede.
- Fenwick email addendum drafted: 3 delta items not in questionnaire (self-assessment sharing regulatory implications, system-level abuse prevention practices, AI authenticity monitoring as ongoing practice). Justin holding email pending further spoke integration findings.
- MP's StartEngine emotional-timing framing (line 3090) superseded by questionnaire's more careful position: invitations responsive to expressed interest/general enthusiasm, never timed to vulnerability or distress

## 2026-02-20

- MP v2.3 gap analysis: line references backfilled for all 14 gaps that were missing specific MP line numbers
- MP v2.3 gap analysis COMPLETE — ~36 gaps identified across Hub + 7 spokes, prioritized (7 high, 22 medium, 7 low), written to `docs/working/mp-gap-analysis.md`
- Hub restructuring COMPLETE — all content, identity, disclaimers, and MPR freeze done. Justin review pass pending.
- Edit-approval disclaimers added to 18 source-of-truth files across 3 repos
- MPR header frozen: both v2.3 and condensation marked fully superseded by Hub + spokes
- AC CLAUDE.md updated: edit-approval rule (compression reframe), auto-memory hygiene, runtime CLAUDE.md ownership, glossary line
- DC CLAUDE.md updated: reading order, Diataxis, auto-memory hygiene, redundancy cleanup, Build Priorities restored
- DC redirects added to evryn-backend and evryn-team-agents CLAUDE.md (hard stop + runtime agent context)
- Auto-memory trimmed (removed items now captured in persistent docs)
- doc-ownership.md restructured: added 7 spokes, split by repo, updated CLAUDE.md descriptions, added evryn-website + evryn-dev-workspace
- Legal clarifications doc fully absorbed into absorption notes checklist, then deleted
- Questionnaire cross-referenced against internal docs — 4 gaps routed to absorption notes (age requirement, identity verification pass-through, cross-border data, shared data on deletion)
- Trusted partner briefing v1.4 verified against Hub spokes — one gap found (anti-subscription reasoning), added to business-model spoke
- Spoke edits: business-model (anti-subscription reasoning, capital strategy), bizops (Fenwick strategic value), GTM (film industry transition, referral lists, file reference update), long-term-vision (voice bullet removed — near-term, not long-term)
- Voice integration items moved to absorption notes as near-term ARCHITECTURE.md items
- Session doc (session-hub-build) deleted — all items resolved or properly routed
- Session doc trimmed (294 → 95 lines)
- Hub header rewritten: edit-approval on own line, spoke loading guidance in header, "Additional References" with maintenance note (cut items already linked inline)
- Link convention established: repo-root-relative within-repo, sibling-repo for cross-repo. No `../` paths. Works from any clone.
- Updated all 15 roadmap.md references across 4 repos (`docs/roadmap.md` → `docs/hub/roadmap.md`)
- evryn-website restructured: CLAUDE.md → hard stop ("use DC, do not build here"), all build context moved to `evryn-website/docs/ARCHITECTURE.md`
- CLAUDE.md audience separation decided: each repo's CLAUDE.md serves the runtime agent, not developers. DC builds from evryn-dev-workspace and reads standardized `docs/` structure.
- DC reading order established: Hub first (for the frame) → repo's docs/ARCHITECTURE.md → build doc → deeper only if needed
- Hub restructuring started: MPR → hub-and-spokes wiki. Created `docs/hub/` directory for domain spokes. Working notes at `docs/session-hub-build-2026-02-20.md`.
- ADR-008: Trust Mirror dropped (canary principle) — full reasoning documented
- Evryn company context module stubbed in BUILD-EVRYN-MVP.md (public-safe loadable module, not loaded every query, freshness requirement)
- Renamed `docs/session-handoff-2026-02-13.md` → `evryn-backend/docs/historical/build-doc-absorption-notes.md` (clearer purpose)
- 7 domain spokes created in `docs/hub/`: trust-and-safety, user-experience, business-model, gtm-and-growth, technical-vision, long-term-vision, bizops-and-tooling
- Hub expanded: ethos/personality, "How Connections Work", "Safety & Moderation", "The Long View" sections added; inline links to spokes throughout
- Hub moved from `docs/roadmap.md` → `docs/hub/roadmap.md`
- Edit-approval policy decided: all source-of-truth docs require explicit Justin approval before edits (implementation pending)
- Justin feedback applied: salted hash restored in trust spoke (was over-generalized for legal audience), GTM intro added (AI-first pivot changes burn/launch calculus), stale tools noted, age nuance added, "not a traditional SaaS" fix
- #lock checkpoint (second)

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
