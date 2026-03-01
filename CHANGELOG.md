# Changelog — _evryn-meta

**How to use this file:** Brief one-liners per change. Detail lives in git log. Most recent changes at top.

---

## 2026-02-28 (BizOps cleanup + financial projections)

- **BizOps spoke cleaned up** (`docs/hub/bizops-and-tooling.md`) — status indicators added to all tools, missing tools added (Google Workspace, Zoom, X, Claude Max, Bitwarden, Carta), domains updated (6 TLDs), Clerky/Toptal notes updated, n8n/Airtable removed, Canva noted.
- **Business model spoke: financial projections added** — burn profile table (cost by operational state), revenue model (user ramp from cast-off conversion, density-adjusted matches/user, all variables explicit), cash runway projection Mar–Aug with revenue + capital infusions. Fenwick ~$35K due August identified as critical constraint.
- **Burn rate reconciled** from actual vendor costs: base ops ~$725/mo today → ~$1,000/mo with agent seats. Hub and current-state updated.
- **Cash updated** from ~$6,700 to $6,125 (actual).
- Business model session doc verified fully absorbed, deleted.

## 2026-02-28 (Business model spoke revision)

- **Business model spoke fully revised** (`docs/hub/business-model.md`) — two drafts, extensive Justin feedback integrated. Key changes: free/paid connection framework (full scenario table with loss-leader framing), supply-side economics & batching section, capital strategy rewritten (burn rate components replacing $3,900 headline, contingent angel investment, "Help Us Not Need Institutional Capital"), trust-based pricing (social anchoring, not-permanent note), pre-purchase bonus 30% → 25%, avatars tightened (Enterprise added, Torchbearer framing, long-tail collapsed), network density thresholds (per-cluster not global, domain homogeneity, farmer+batch model), Foundation as competitive moat breadcrumbed, Fenwick flags added inline (stored-value question, service agreement disclaimer).
- **GTM spoke** (`docs/hub/gtm-and-growth.md`): pitch note added to Competitive Landscape (Master Plan competitive analysis prose reference for investor pitches).
- **Fenwick questionnaire** (`docs/legal/privacy-and-terms-questionnaire.md`): third addendum — service agreement disclaimer (Evryn not party to user-to-user service agreements).
- current-state.md refreshed for #lock.

## 2026-02-28 (GTM spoke session — part 2)

- **GTM spoke fully revised** (`docs/hub/gtm-and-growth.md`) — two drafts, extensive Justin feedback integrated. Key changes: geographic reframe (Pacific Northwest ignition, LA expansion — not "choose one"), whisper cascade rewritten around trust mechanics (not artificial scarcity), competitive landscape refreshed (Overtone HIGH WATCH, Amata, Osmos), "Industry in Transition" expanded with 40+ source research, soft dates added to phase alignment (SIFF mid-May target), user-owned positioning woven throughout, new Outreach Playbook section, active user acquisition section (Jordan marketing + Evryn supply-side recruiting), "candy before the store opens" pre-launch framing, matching threshold note in launch readiness.
- **Business model revision notes** created → `docs/sessions/2026-02-28-business-model-revision-notes.md`. Captures volatile strategic thinking: financial reality ($6,700 + $15K contingent runway), free/paid connection framework (full scenario table), loss leader framing, value communication patterns, gaming mitigations, active acquisition two modes, batching insight, matching threshold design (objective standard not "best available"), backlog math for v0.2→v0.3 transition, density threshold vetting, Foundation timing plan, VC positioning ("help us not need them"), geographic strategy notes.
- **Hub updated** (`docs/hub/roadmap.md`) — finalized phase labels (v0.2 "Gatekeeper's Inbox" → v0.3 "The Broker" → v0.4 "Scale") with target dates, runway line added, geographic correction (PNW ignition), whisper cascade reframed.
- **Phase nomenclature finalized:** v0.2/v0.3/v0.4 with descriptive names. Old "Build 2/Build 3" terminology retired.
- Session doc (`docs/sessions/2026-02-27-gtm-spoke-update-plan.md`) marked COMPLETE, decisions resolved.
- current-state.md refreshed for #lock checkpoint.
- GTM spoke final notes: Mark inbound softened (verified via web search), LA hedge added ("eggs in one basket"), Justin's broader Seattle network (health club) noted, "$20 on me" wording fix.
- **Trusted Partner Briefing v1.6** (`docs/historical/Evryn Trusted Partner Briefing v1.6.md`) — Market Entry reframed from LA-first to PNW-first with LA expansion, industry contraction rationale, Seattle's loneliness epidemic, Justin's broader Seattle network.
- Business model revision notes: Justin's health club network insight captured (potential breadth play beyond film).
- Old GTM spoke archived to `docs/historical/LA gtm-and-growth - deprecated 2.26.md`.
- Stale session doc path cleaned up (moved to `docs/sessions/` previously).
- GTM session doc deleted (all content absorbed into GTM spoke, business model notes, Hub). References in evryn-backend ARCHITECTURE.md and SPRINT-MARK-LIVE.md updated to point to GTM spoke.
- Hub: Trusted Partner Briefing added to Additional References (so it stays on the radar for updates).
- **GTM spoke MP2.3 gap fill** — 8 items from Master Plan Growth section that hadn't made it into spokes: PR & press strategy, community & event presence (SIFF inaugural, NoFilmSchool, long-form content with Evryn as primary author), influencer outreach, paid channels (organic-first philosophy), investment as growth driver, adjacent creative ecosystems (music/game dev/fashion), city expansion mechanism (tag-based density thresholds), cross-domain illustration (actor's full-spectrum needs).
- Stale session doc reference fixed in evryn-backend BUILD-EVRYN-MVP.md warning banner.
- **ADR-011: PNW Ignition, LA Expansion** — geographic launch pivot from LA-first to Pacific Northwest first, driven by film industry contraction + pilot/contacts being Seattle-based.

## 2026-02-27 (GTM spoke session)

- **Film industry AI disruption research report** created → `docs/research/film-industry-ai-disruption-v1.md` (~4500 words, 40+ sources). Covers AI video tool landscape (Seedance 2.0, Kling 3.0, Sora 2, Runway Gen-4.5, Adobe Firefly, Veo 3.1), job displacement (41K LA jobs lost), union contract expirations (May-July 2026), "two lanes" market split, Seedance copyright battle, Chinese AI dominance, entry-level pipeline broken, geographic shift.
- **Competitive landscape research report** created → `docs/research/competitive-landscape-v1.md` (~3500 words, 23 sources). Covers Amata, Overtone (HIGH WATCH — Hinge CEO + Match Group), Osmos, Lunchclub, Stage 32, incumbent AI features, trust-based platform trends.
- Deleted `docs/historical/Evryn Trusted Partner Briefing v1.4.md` (superseded by v1.5, only CHANGELOG refs left as historical)
- GTM spoke reviewed and concerns flagged — full edit plan approved. Session working doc at `docs/session-gtm-spoke-update-plan.md`. GTM spoke edits not yet started — will be continued in next session.
- current-state.md refreshed for session checkpoint.

## 2026-02-27

- **Gatekeeper Approach doc** (`hub/detail/gatekeeper-approach.md`) — operational playbook: three gatekeeper types, four-step pitch, setup menu by email client, validation period, "Evryn handles this" end state, delivery preferences, Evryn as point of contact. Breadcrumbed from GTM spoke + BUILD doc.
- Volume standardized to ~200/day across all docs (was ~1,000/week extrapolation). Hub, GTM spoke, openclaw research, BUILD doc.
- "trash" → "pass" terminology fix in n8n research doc.
- **ADR-010: Canary principle revised** — opaque matching replaces absolute prohibition (ADR-008 superseded). Nine red-team vectors + one edge case. Key insights: non-event > binary response, preframing as mutual protection, both sides hear policy directly from Evryn, default posture is "needs a reason to connect, not a reason to decline."
- Circulated ADR-010 through Hub (trust bullet), trust-and-safety spoke (section rewritten), UX spoke (specific-person requests subsection added), active session doc (Publisher hard rules updated).
- Creation/history footers stripped from Hub and all spokes + Foundation architecture detail doc — git history covers provenance.
- current-state.md refreshed for session checkpoint.

## 2026-02-26

- v0.1 prompt files review: 4 concepts landed — pacing design constraint + not-a-chatbot boundary (user-experience spoke), early match calibration "magic of duds" (user-experience spoke), refund dishonesty feedback loop (business-model spoke).
- Tech-vision final coherence pass: PII anonymization status inconsistency fixed (LLM Constraint now correctly reflects target-state, not current), Relationship Graph aligned with ARCHITECTURE.md (added contextual color).
- Foundation architecture extracted from long-term-vision spoke to new sub-spoke (`docs/hub/detail/evryn-foundation-architecture.md`). Long-term-vision reduced from ~200 to ~80 lines. All cross-references updated (technical-vision ×3, bizops ×1).
- Master Plan v2.3 tech section gap analysis (lines 1674–2889) — 5 gaps + 1 ML note landed: social graph functions (ARCHITECTURE.md), insight routing pipeline (ARCHITECTURE.md), block/don't-match-again (user-experience spoke), sub-cluster density detail (technical-vision spoke), surveillance fears + addiction-by-design risks (long-term-vision spoke), ML evolution note (technical-vision spoke).
- Surveillance fears risk: added messaging/communication requirement — "architecture alone doesn't build perception."
- current-state.md refreshed for session checkpoint.
- Technical-vision spoke readthrough (session 3): Sovereign Memory & Cryptographic Trust rewritten — Swiss Foundation vault model (Evryn operates within vault, not outside reaching in), layered encryption (jurisdictional + cryptographic + structural), LLM inference constraint honest assessment, Identity Without Exposure sharpened, Legal Resilience rewritten with Inc./Foundation separation and Trust Severance Protocol reference.
- Long-term-vision spoke: Jurisdictional Trust Architecture significantly expanded — cryptographic architecture (HSM, E2E, threshold key recovery), trustee governance (composition principles, jurisdictional distribution), Inc.–Foundation relationship (tied to PBC charter, severable on mission breach), Trust Severance Protocol (5-step sequence from warning to wind-down), warrant canary, honest trust surface (what we trust and what we can't eliminate). Fenwick question flagged (trustee veil-piercing).
- Technical-vision spoke readthrough continued (session 2): Matching engine rewritten (RBM/HLM/AIM → four capabilities with profile-to-intent model, complementarity vectors folded in, cross-domain open design question resolved). Data & Knowledge Layers cleaned (renamed stores: Global Connection Intelligence, Relationship Graph; stripped table references; User Data Pipeline → principle-level "How User Understanding Builds"). Privacy & Security stripped of impl specs, honest GDPR tension language added, legal reference updated. How Evryn Learns: Disciplined AI Stack → Layered Intelligence, Dual-Mode Learning freshened, Model Deployment Discipline dropped, Exploratory Matching expanded from Master Plan source, Privacy Gateway concerns separated. coherence-calibrated modularity kept as named principle.
- Technical-vision spoke readthrough (session 1): "Three Brains" → "Three Domains of Intelligence" (Conversation & Voice, Judgment & Matching, Intuition & Care). Check-in Orchestrator folded into Intuition & Care. Agent Council → Module Separation Principles (encode principles, not specific module lists). Hub updated to match.
- ARCHITECTURE.md (evryn-backend): Three Domains rename, "subconscious/conscious" → "algorithmic/analytical", Module Separation aligned with tech-vision principles, multi-vector embedding stub (holistic + intent-shaped projections), state-vs-trait note in Story Model, labels-as-hypotheses design principle in profile_jsonb, cross-thread awareness note in Pipeline Design, stale Workflowy TODO resolved.
- Created `docs/research/2025-12-01-n8n-module-architecture.md` — n8n-era Workflowy export preserved as research artifact with editorial notes on what's been absorbed where.
- memory-systems.md: updated stale "Connection Brain" reference.

## 2026-02-25

- Technical-vision spoke readthrough in progress: header reframed as zoom-stack ("north star → ARCHITECTURE.md → BUILD doc"), system landscape diagram updated (added Google Cloud/Gmail API + Railway hosting), current-phase anchor added after diagram, "Pre-Training with Simulated Data" → "Simulated Data Strategy" (anchored v0.2 classification testing vs v0.3+ matching pre-training)
- **v0.2 renamed: "Mark's Inbox" → "Gatekeeper's Inbox"** — same system serves all gatekeepers, Mark is the pilot. Updated across Hub, current-state, ARCHITECTURE.md, BUILD doc (8 files, 2 repos). Historical/frozen files untouched.
- Doc zoom-stack established: technical-vision (north star) → ARCHITECTURE.md (v0.2–v1.0, decreasing resolution) → BUILD doc (current phase). Headers updated in all three docs + Hub cross-reference.
- User-experience spoke readthrough complete with Justin: 20+ edits — Interface Philosophy (v0.2 current-state nod, "Trust & Account" → "Account" + status confirmations, "Present But Not Pressing" named principle), Connection Mode (courier model note, narrative framing separation, "Making Every Connection Healthier" moved in), Connection Conversations expanded from MP source (safety framing, input field names, spatial metaphor, connection list detail), Shared Conversations folded into Connection Conversations, Latent Truth Discovery moved up, Evryn Wallet tightened with business-model cross-ref, multiple wording fixes throughout
- Technical-vision: conversational rendering detail added to Member Interface section
- Trust-and-safety spoke readthrough complete with Justin: safety identifier ↔ trust imprint hash linkage, "Honor Economy" → "Cultural Trust Fluency" (design constraint framing), section reorder (Forgiving Skepticism after Behavioral Filtering), "Canary Principle" → "Why Evryn Never Evaluates Named Individuals with Other Users", named-individuals mechanics clarified, User-AI moderation expanded from MP source, multiple tightening edits throughout
- `#align` protocol created (`docs/align-protocol.md`): weekly principles-to-practice integration checklist
- CLAUDE.md: one-line purpose descriptions restored for #lock, #sweep, #align protocols
- Hub: named-individuals reference updated to match spoke retitle
- Fenwick questionnaire: second addendum (match guarantees, exclusion language, safety-priority framing)
- Hub final pass: identity verification, business model, growth, security, long view, Fenwick — all sections reviewed and tightened with Justin
- SYSTEM_OVERVIEW.md retired: content absorbed into bizops-and-tooling, trust-and-safety, and technical-vision spokes. Moved to `docs/historical/`. All cross-repo references updated (4 repos, 8 files).
- doc-ownership.md retired: ownership enforcement handled by doc headers + CLAUDE.md. Moved to `docs/historical/`.
- Technical-vision diagram: alignment fixed (26 lines were 1 char short, causing wavy right border)
- `#sweep` protocol created (`docs/sweep-protocol.md`): weekly hygiene checklist with resolution hierarchy
- `#lock` protocol updated: added Hub/spokes consistency step (step 4), fixed numbering gap
- CLAUDE.md slimmed: #lock "in short" removed (dead tokens — protocol file gets read anyway), Document Ownership section → Document Hygiene (kept rules, removed pointer to retired file), #sweep pointer added

## 2026-02-24 (evening — Session 2)

- Pre-Work #6 Session 2: verification pass + cookbook research. Cross-referenced all 8 research files + AGENT_PATTERNS against ARCHITECTURE.md and BUILD doc — gaps documented in session doc.
- Anthropic cookbooks read (Chief of Staff Agent, Memory & Context Management, Automatic Context Compaction) — surfaced SDK-native identity composition alternative (setting_sources + systemPrompt layering, output styles, hooks)
- Justin's Session 1 open questions resolved: multilingual → module (v0.3+), Beautiful Language → main flow (breadcrumb pending), visual identity → Growth/UX spokes (breadcrumb pending), growth invitations → v0.3 (breadcrumb pending)
- Session doc expanded with full Session 2 findings (verification results, cookbook analysis, SDK-native vs raw composition architectural question, remaining work items)
- current-state.md updated (#6 status, blocking question noted)

## 2026-02-24

- SDK research breadcrumbs placed: 8 new breadcrumbs across 4 docs for 6 research files (claude-agent-sdk, memory-systems, orchestration-frameworks, tools-and-workflows, linear-project-management, misc). Zero dead research — all 8 reports now linked.
- 2 stale `docs/research/` references fixed in team-agents ARCHITECTURE.md (communication-channels path + Related Documents table)
- Voice AI Stack moved from LEARNINGS.md to `docs/research/voice-ai-stack.md` (8th research report). Breadcrumbed in evryn-backend BUILD-EVRYN-MVP.md Voice section.
- First LEARNINGS.md hygiene pass: 17 entries promoted to one-line stubs, Voice section moved to research. ~226 → ~145 active lines.
- LEARNINGS fully promoted: all 33 entries now stubs. Header rewritten as "temporary holding pen." Numbered stubs for stable referencing.
- AC CLAUDE.md: 3 Architectural Mandate bullets (lowest-risk, trust+guardrails, latency), 1 Security Mindset bullet (first principles for tool access), split source-of-truth approval from writing discipline, softened full-file-writes rule, fixed stale evryn-backend status.
- DC CLAUDE.md: writing discipline paragraph added (survive context loss + active voice).
- SYSTEM_OVERVIEW.md: Anthropic billing note (subscription vs API separation).
- Lock protocols: auto-memory hygiene step added (AC + DC). Bitwarden reminder rationale added (AC).
- DC pivot notification moved from lock-protocol transitional items → AC/DC protocol doc "Pending Handoffs" section.
- Pre-Work #6 session doc: context notes added for fresh instance orientation.
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
