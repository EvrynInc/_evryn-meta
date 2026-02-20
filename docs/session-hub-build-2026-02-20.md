# Session Working Notes — Hub Build (2026-02-20)

> **Purpose:** Compaction-safe capture of the Hub restructuring plan. If you're reading this after context compaction, this file IS your context. Read it fully before taking any action. Delete after work is complete and committed.

---

## What We're Doing and Why

The Master Plan Reference (MPR, `docs/historical/master-plan-reference.md`, ~730 lines) is supposed to be frozen history but keeps getting referenced because the Hub (`docs/roadmap.md`, ~115 lines) is too thin. Justin wants ONE place agents can look. The MPR is 4 months out of date and has stale content (Trust Mirror is described as a feature but was dropped; terminology and decisions have evolved).

**The solution:** Restructure into a hub-and-spokes wiki. The Hub stays lean but gains enough ethos and principle-level content that agents have the right mental model. Domain spokes carry the MPR's full depth (NOT further condensed — the MPR was already a condensation). Corrections from recent work (clarifications doc, legal questionnaire) get applied during the reorganization.

**After this work:** The MPR is truly frozen. The Hub + spokes are the living system. No agent should ever need to read the MPR again.

---

## Critical Nuances (These Are Easy to Lose in Compaction)

### Hub must be LIGHT — real money is at stake
The Hub loads on every volley for every agent (AC, DCs, Lucas, all team subagents). Justin is concerned about API costs with many agents. Target: ~150-200 lines MAX. Every line costs tokens across every agent interaction.

### Layer 1 vs Layer 2 cutoff
**The test:** "If an agent doesn't know this, they'll ask a dumb question or make a decision that contradicts who Evryn is." That goes in the Hub. Everything else drops to spokes.

**What this means concretely:**
- The HUB carries: what Evryn is, trust principles, business model shape, current stage, team, repos, brief safety/UX/long-view principles
- SPOKES carry: full trust mechanics, full UX flows, financial model details, GTM specifics, technical vision at scale, moderation details, BizOps reference

### Ethos vs voice — important distinction
Evryn's personality in the Hub is NOT about agents mimicking her voice. Every agent (AC, DC, Lucas, team subagents) has its own personality and voice. The Hub carries who Evryn IS as a brand persona — the coffee shop owner energy, the trust-first posture, "first resonance is between you and her." This is so every agent *knows the company's soul*, not so they talk like Evryn. An agent wanting Evryn's specific conversation voice and patterns drops to the user-experience spoke.

### Three distinct technical docs — don't conflate
- **ARCHITECTURE.md** (evryn-backend) = "how we're building v0.2" — current reality, schema, pipelines
- **SYSTEM_OVERVIEW.md** (_evryn-meta) = "what exists and how it's connected" — components, services, repos
- **technical-vision.md** (NEW spoke) = "how the system works at scale" — aspirational architecture, matchmaking engine, privacy gateway, learning systems. This is the "CTO mental model" that doesn't belong in any single repo.

### Inline links — the specific pattern
Each Hub section has ~15-20 lines of principles + an inline link to the spoke. NOT a link dump at the bottom. An agent can read just one Hub section, get the right mental model, and follow the link if it needs depth. This also means humans can say "go read Hub lines 50-65" and the agent gets a focused orientation with the depth pointer right there.

### "Why not" decisions — two categories
1. **Blind alleys** (seemed great, found fatal flaws) → ADR with full reasoning + one-liner in spoke. Trust Mirror is the canonical example.
2. **World changed** (stale timelines, old team structures) → Brief breadcrumb in spoke. No ADR needed.
The MPR has "Removed: X because Y" notes — preserve the useful ones as breadcrumbs.

### Hub ownership
Hub header says "Only Justin edits this document." We're drafting for his review — he approves the final version.

### DRY — where duplication is OK vs not
Each doc carries information AT ITS ALTITUDE ONLY:
- Hub: principles and shape (links to spokes for detail)
- Spokes: full domain depth (links to repo docs for build specifics)
- Repo docs: build reality (ARCHITECTURE.md, BUILD doc)
- Reference doc: tool/vendor lookup (bizops-and-tooling.md)

A tool or concept may be NAMED in multiple docs, but its DETAIL lives in one place. When something changes, you update one doc.

### Evryn's company context — separate from the Hub
Already stubbed in `evryn-backend/docs/BUILD-EVRYN-MVP.md` (Memory Architecture section). Key distinction:
- **Core identity** (CLAUDE.md, loaded every query) = operational rules she must follow
- **Company context** (evryn_knowledge module, loaded on demand) = what she'd say about the company when users ask
She's public-facing and can't access the Hub (could leak internal info). Has a freshness timestamp + "ask Justin/Lucas to update if >7 days old."

---

## Agreed Structure

### Layer 1: Hub (`docs/roadmap.md`, ~150-200 lines)

Sections (each with inline link to depth):
1. **What Evryn Is** — EXPANDED with ethos: coffee shop owner, active nature, category corrections, design philosophy. (~25 lines)
2. **Why Now** — Stays roughly as-is. (~6 lines)
3. **Trust & Fit** — EXPANDED with trust loop, key pillars at principle level, character becomes currency, user isolation, canary principle brief. (~25 lines) → links to trust-and-safety spoke
4. **How Connections Work** — NEW. Brief: everyone is a user, connection mode basics, double opt-in, Evryn as broker not sorter. (~15 lines) → links to user-experience spoke
5. **Business Model** — EXPANDED with per-connection shape, trust-based pricing, three revenue streams, satisfaction guarantee, flywheel. (~20 lines) → links to business-model spoke
6. **Safety & Moderation** — NEW. Structural safety principle, behavioral filtering, crisis protocol principle. (~10 lines) → links to trust-and-safety spoke
7. **Current Strategy** — Stays. Build stages, Lucas paused, GTM brief. (~12 lines) → links to gtm-and-growth spoke
8. **Technical Architecture** — Stays but with better pointers. Three brains concept, stack, security principle. (~15 lines) → links to technical-vision spoke, ARCHITECTURE.md, BUILD doc, SYSTEM_OVERVIEW
9. **The Long View** — NEW. Trust compounds, the world Evryn creates, civilizational stakes. (~8 lines) → links to long-term-vision spoke
10. **Team** — Stays. (~6 lines)
11. **Repositories** — Stays. (~8 lines)

### Layer 2: Spokes (`docs/hub/`)

1. **trust-and-safety.md** (~150-180 lines) — Full trust architecture, moderation, safety
2. **user-experience.md** (~100-120 lines) — Onboarding through after-care, Evryn's voice and conversation patterns
3. **business-model.md** (~120-140 lines) — Pricing, revenue, wallet, financial model, market sizing
4. **gtm-and-growth.md** (~80-100 lines) — LA film, waves, whisper cascade, competitive landscape
5. **technical-vision.md** (~150-180 lines) — Aspirational architecture at scale
6. **long-term-vision.md** (~80-100 lines) — Foundation, federation, risks
7. **bizops-and-tooling.md** (~80-100 lines) — Legal, finance, vendors. One reference doc.

### Layer 3: Deep Reference (already exists)
- `evryn-backend/docs/ARCHITECTURE.md` — Current v0.2 technical truth
- `evryn-backend/docs/BUILD-EVRYN-MVP.md` — Current build spec
- `SYSTEM_OVERVIEW.md` — Cross-repo components, external services
- `docs/historical/master-plan-reference.md` — Frozen after this session
- `docs/historical/Background-The_Evryn_Master_Plan_v2.3.md` — Original founding vision

---

## Corrections to Apply

These are real decisions that have been made. Apply them as you reorganize MPR content into spokes.

| Correction | Source | Where it goes |
|-----------|--------|---------------|
| **Trust Mirror DROPPED** — canary principle: any response about a specific person leaks info (membership, or worse, creates a baseline where deviation = signal). Evryn never evaluates named individuals. | clarifications doc (2026-02-19) | trust-and-safety spoke + ADR-008 |
| **Latent Truth Discovery** — courier model. Both parties must independently express desire, then both explicitly sign off on exact wording. | clarifications doc | user-experience spoke |
| **Vouching** — input for Evryn's independent judgment, not a direct mechanism. Weight depends on voucher's trust level + corroboration. | clarifications doc | trust-and-safety spoke |
| **Identity verification** — pass-through model. Evryn stores only: verified flag, date, safety identifier. Never stores documents/photos/biometrics. | clarifications doc | trust-and-safety spoke |
| **Payments architecture** — Stripe handles all money. Pre-purchases = completed transactions. Evryn Credit = non-monetary. P2P via Stripe Connect, Evryn takes small commission. | clarifications doc + questionnaire | business-model spoke |
| **Referral rewards** — Evryn Credit after referred user's first paid connection | questionnaire | business-model spoke |
| **Age: 18+** for launch | clarifications doc | operational (Hub brief mention or core identity) |
| **Evryn in shared conversations** — observation mode only, never speaks, opt-in | clarifications doc | user-experience spoke |
| **Connection coaching** — Evryn's perspective as a friend, not professional advice | clarifications doc | user-experience spoke |
| **PII anonymization** — NOT yet implemented; full data goes to Anthropic API today | clarifications doc | technical-vision spoke |
| **Safety imprint on deletion** — generalized (function, not mechanism) | clarifications doc | trust-and-safety spoke |
| **Gatekeeper first-right-of-refusal** — wrong frame; Evryn's obligation is to each user | clarifications doc | gtm-and-growth spoke or business-model spoke |
| **Crisis protocols** — mental health → support + resources; illegal → disengage + legal | clarifications doc | trust-and-safety spoke |
| **Cast-off outreach consent** — CAN-SPAM navigable, framing defined | clarifications doc | gtm-and-growth spoke |
| **Content rights** — user stories shared with permission, licensing language needed | questionnaire | gtm-and-growth spoke |

---

## MPR Section → Destination Map

| MPR Section (line range) | Hub | Spoke | Notes |
|-------------------------|-----|-------|-------|
| Who Evryn Is (16-37) | EXPAND "What Evryn Is" | — | Coffee shop owner, category corrections, design philosophy |
| Trust Architecture (40-106) | EXPAND "Trust & Fit" (~20 lines of principles) | trust-and-safety.md (full detail) | Apply vouching, identity verification, safety imprint corrections |
| User Experience (109-183) | NEW "How Connections Work" (~15 lines) | user-experience.md (full detail) | REMOVE Trust Mirror (170-178), update Latent Truth, add shared convos, coaching |
| Business Model (186-268) | EXPAND existing (~20 lines of shape) | business-model.md (full detail) | Apply payments, P2P, referral, Evryn Credit corrections |
| GTM Strategy (272-331) | Current Strategy stays adequate | gtm-and-growth.md | Apply cast-off consent, gatekeeper framing, content rights |
| Version History (334-348) | Already there | — | |
| Technical Architecture (355-437) | Existing section stays adequate | technical-vision.md | Apply PII anonymization note |
| How Evryn Learns (440-482) | — | technical-vision.md | |
| Moderation & Safety (485-531) | NEW "Safety & Moderation" (~10 lines of principles) | trust-and-safety.md | Apply crisis protocols, coaching disclaimer |
| Sovereign Memory (535-559) | — | technical-vision.md | |
| Jurisdictional Trust (562-586) | — | long-term-vision.md | REMOVE Trust Mirror reference (584-586) |
| Federation & Future (589-610) | — | long-term-vision.md | |
| Key Risks (614-641) | Brief mention woven in | long-term-vision.md | |
| The Long View (644-655) | NEW section | — | Ethos — stays in Hub |
| Legal/Tools (659-712) | — | bizops-and-tooling.md | Update stale tools |
| Related Docs (716-727) | Drop | — | Replaced by inline links |

---

## Completed Work

1. ~~Write this working notes file~~ ✓
2. ~~Write ADR-008~~ ✓ — at `docs/decisions/008-trust-mirror-dropped.md`
3. ~~Write all 7 spoke files~~ ✓ — all in `docs/hub/`. Committed and pushed (68fe095).
4. ~~Write expanded Hub~~ ✓ — Hub expanded with ethos, connections, safety, long view sections + inline links to spokes. Committed and pushed.
5. ~~Company context update cadence note~~ ✓ — added "Downstream dependency" to Hub header.
6. ~~#lock checkpoint~~ ✓ — current-state.md, CHANGELOG.md updated.
7. ~~Rename session-handoff-2026-02-13~~ ✓ — moved to evryn-backend/docs/historical/build-doc-absorption-notes.md.
8. ~~Move roadmap.md~~ ✓ — `git mv docs/roadmap.md docs/hub/roadmap.md`. Committed (1340525).
9. ~~Hub header rewrite~~ ✓ — Edit-approval on own line. Spoke loading guidance moved to header. "Spokes (Domain Depth)" → "Additional References" with maintenance note. Cut items already linked inline (ARCHITECTURE.md, SYSTEM_OVERVIEW.md, domain spokes except BizOps). Also removed AC/DC protocol from Additional References (DC-only concern, already in CLAUDE.md). Committed (2068e35).
10. ~~Link convention established~~ ✓ — Within-repo: repo-root-relative paths (e.g., `docs/hub/trust-and-safety.md`). Cross-repo: sibling-repo paths (e.g., `evryn-backend/docs/ARCHITECTURE.md`). No relative `../` gymnastics. Paths work from any clone of the repo regardless of where on the machine it lives. Easy to grep when paths change.
11. ~~Update all 15 roadmap.md references across 4 repos~~ ✓ — All `docs/roadmap.md` → `docs/hub/roadmap.md` (internal) and `_evryn-meta/docs/roadmap.md` → `_evryn-meta/docs/hub/roadmap.md` (cross-repo). Committed and pushed in all 4 repos.
12. ~~evryn-website restructured~~ ✓ — All build context moved to `evryn-website/docs/ARCHITECTURE.md`. CLAUDE.md replaced with hard stop. Committed (2ab4aa9) and pushed.
13. ~~DC redirects added to evryn-backend and evryn-team-agents~~ ✓ — Hard stop at top (matching evryn-website's language), runtime agent context below with transitional notes. Hub reference added to evryn-team-agents key pointers. Committed (5cd4801, 5db3d7b).
14. ~~DC identity updated (evryn-dev-workspace/CLAUDE.md)~~ ✓ — Reading order (Hub first → ARCHITECTURE.md → build doc → deeper only if needed), Diataxis explained directly (not "same as AC"), auto-memory hygiene, edit-approval rule, Security Mindset merged into Build Mandate (removed redundancy), Architecture Doc Rule folded into reading order, Documentation Approach combined with How to Orient, Key References → Additional References (only unlisted items). Committed (de1e21b). Justin reviewed and refined: architecture conflicts flagged to Justin/Lucas/Alex (not just AC), Build Priorities restored with Lucas/Alex, compression warning reframed.
15. ~~AC CLAUDE.md updated~~ ✓ — Edit-approval rule in Documentation Approach (reframed per Justin: about compressing language that was verbose for a reason, not about redundancy per se; plus fresh-instance self-review note), auto-memory hygiene (reframed per Justin: short-term memory, not operational lessons — those go to LEARNINGS.md), runtime CLAUDE.md ownership section, handoff section fixed (DC reads docs/ not CLAUDE.md), Dynamic Tensions trimmed (compression warning moved to Documentation Approach), glossary line updated (ask Justin if he wants new terms added). Committed (91045e5). Session notes NOT excluded from edit-approval list.

### Edit-approval disclaimer — new policy from Justin

Justin wants explicit approval required before editing source-of-truth docs. The concern is not just about redundancy — it's about compressing *language* that was written a specific way for a reason. The phrasing may carry important nuance, emphasis, or context that a future reader needs. Policy: "Edits require explicit approval from Justin. Propose changes; don't make them directly."

**Docs that need the disclaimer added to their headers:**

Hub & spokes:
- docs/hub/roadmap.md (already has it)
- docs/hub/trust-and-safety.md
- docs/hub/user-experience.md
- docs/hub/business-model.md
- docs/hub/gtm-and-growth.md
- docs/hub/technical-vision.md
- docs/hub/long-term-vision.md
- docs/hub/bizops-and-tooling.md

Architecture / build / system:
- _evryn-meta/SYSTEM_OVERVIEW.md
- evryn-backend/docs/ARCHITECTURE.md
- evryn-backend/docs/BUILD-EVRYN-MVP.md
- evryn-team-agents/docs/ARCHITECTURE.md
- evryn-team-agents/docs/BUILD-LUCAS-SDK.md

State & learnings:
- _evryn-meta/docs/current-state.md
- _evryn-meta/LEARNINGS.md
- _evryn-meta/AGENT_PATTERNS.md

Protocols & governance:
- _evryn-meta/docs/lock-protocol.md
- _evryn-meta/docs/ac-dc-protocol.md
- _evryn-meta/docs/doc-ownership.md

**Also added to both AC and DC CLAUDE.md** ✓ — in Documentation Approach sections.

**Excluded from disclaimer (free to edit):**
- CHANGELOG.md
- ADRs (written once, typically frozen)
- Mailbox files (ac-to-dc, dc-to-ac — disposable snapshots)

## Decisions Made This Session (Continuation — After Second Compaction)

### Link convention (decided with Justin)
- **Within-repo:** repo-root-relative paths (e.g., `docs/hub/trust-and-safety.md`)
- **Cross-repo:** sibling-repo paths (e.g., `evryn-backend/docs/ARCHITECTURE.md`)
- **Why this matters:** Paths work from any clone of the repo, regardless of machine or environment (local, GitHub, Railway). When we need to find all references to a file, we grep the path and get a clean list. The old `../` relative paths were fragile — they broke when the Hub moved into `docs/hub/`.

### Hub lives in git — no special deployment needed
- Agents access the Hub by having the repos cloned in their environment, which is already how any deployment works (Railway pulls from GitHub, Claude Code clones repos).
- Flow: Justin and AC work locally → push to git → agents (wherever they run) pull from git.
- The question of WHERE agents run (Railway? local?) doesn't need to be solved now — the Hub works in any environment that has a clone.

### CLAUDE.md audience separation — this is critical
Each repo's CLAUDE.md serves its **primary audience**, which is the runtime agent — NOT a developer opening Claude Code:
- **evryn-backend/CLAUDE.md** — for the Evryn product agent at runtime
- **evryn-team-agents/CLAUDE.md** — for Lucas at runtime
- **evryn-website/CLAUDE.md** — hard stop (no runtime agent here, and DC builds the website, not ad-hoc Claude Code)
- **evryn-dev-workspace/CLAUDE.md** — for DC (the builder who works ACROSS repos)

**The problem this solves:** evryn-website's CLAUDE.md had been functioning as an ad-hoc DC for months — it had Working Style, Context Checkpoints, #lock, design specs, everything a builder would need. But now that DC has a dedicated identity in evryn-dev-workspace, that ad-hoc setup creates confusion. Someone opens Claude Code in evryn-website, gets a full builder context, and starts building without DC's safety rails (edit approval rules, build mandate, AC/DC protocol awareness, etc.).

**Justin's decision:** evryn-website CLAUDE.md should be a hard stop — "Do not build here, use DC." If Justin needs changes, he has AC make them or does it by hand. The CLAUDE.md does NOT tell the Claude instance what the repo is or point it at context — that would encourage it to start building ad-hoc.

### DC doesn't read other repos' CLAUDE.md files — this drives the docs/ structure
DC loads from evryn-dev-workspace. When it goes to build in another repo, it does NOT load that repo's CLAUDE.md. So any build context in a repo's CLAUDE.md is invisible to DC. BUT we also can't tell DC "go read each repo's CLAUDE.md" because then it would pull in agent runtime context from evryn-backend and evryn-team-agents — exactly what we don't want.

**Solution:** Standardize the `docs/` structure across all repos. DC knows to look for:
- `docs/ARCHITECTURE.md` — how the system works (or design system for website)
- `docs/BUILD-*.md` — what to build (where applicable)
- `docs/DECISIONS.md` — decisions made
- `docs/SETUP.md` — dev setup

This way DC has a predictable pattern everywhere it goes, without ever touching CLAUDE.md.

### DC reading order — Hub first for the frame
When DC goes to build in any repo, the reading order is:
1. **The Hub** (`_evryn-meta/docs/hub/roadmap.md`) — company context first, so DC has the frame. When the build doc says "trust-based pricing" or "canary principle," DC already knows what those mean.
2. **That repo's `docs/ARCHITECTURE.md`** — how the system works
3. **That repo's build doc** (`docs/BUILD-*.md`) — what to build
4. **Other docs/ files and Hub spoke links only if needed** — don't bloat by following every link. If the build doc references something deeper, DC follows the link then, not preemptively.

This is the progressive depth principle applied to DC onboarding. Justin's insight: "I think it's easier on the cognitive load if you know the frame first."

### Auto-memory hygiene
Justin flagged that auto-memory files tend to accumulate bloat and get poorly maintained. **The rule:** Auto-memory is short-term memory — things you need to remember between sessions that don't have a proper home yet. NOT a second documentation system. Operational lessons go to LEARNINGS.md. Agent patterns go to AGENT_PATTERNS.md. Once something is captured in persistent docs, remove it from memory. Added to both AC and DC CLAUDE.md files.

### Edit-approval includes session notes
Session working notes are NOT excluded from the edit-approval requirement. Justin caught AC over-compacting session notes in an earlier round — prose that seemed verbose was carrying important context a future instance would need. Session notes are source-of-truth documents for their active lifespan.

### AC's compression tendency — reframed
The edit-approval rule is NOT primarily about redundancy — Justin often *likes* removing redundancy. The issue is compressing *language* that was written a specific way for an important reason. Before tightening prose, consider *why* it might have been verbose. Also: when writing notes, imagine waking up as a fresh AC instance with very limited context — will what you've written make sense without the conversation you're currently holding?

---

## Remaining Work (in order)

1. **Add edit-approval disclaimers to ~20 files** — full list in edit-approval section above. Hub already has it. ~19 files remaining.
2. **Freeze MPR header** — "fully superseded by Hub + spokes"
3. **Commit and push all repos** — _evryn-meta has uncommitted CLAUDE.md + session notes changes. evryn-dev-workspace has uncommitted exclusion-list fix.
4. **Review pass with Justin**
5. **Ask Justin about "trusted briefing" path** for The Long View closing (flagged last session, still open)
6. (Optional) Sanity check against original MP v2.3 for lost content

---

## Justin's Feedback Applied (Full Session — All Continuations)

- **Salted hash:** Restored in trust-and-safety spoke. The clarifications doc generalized it for the *legal questionnaire audience*, not because the approach was wrong. Internal docs should keep technical specificity.
- **GTM intro:** Added to gtm-and-growth spoke — AI-first pivot changes burn rate, makes organic launch viable, gatekeeper strategy reduces cold-start, but gatekeepers are hard to reach so bottom-up still necessary.
- **Stale tools:** Noted pivots in bizops-and-tooling (Webflow→Next.js, ClickUp→Linear, Mailchimp→HubSpot).
- **Age nuance:** Added to bizops — "May consider younger users with parent-administered accounts, once there's team and revenue."
- **"Not a SaaS":** Changed to "not a traditional SaaS" — technically is a SaaS, just unconventional model.
- **Spoke duplication in Hub:** Domain spokes were listed both inline AND at bottom. Justin flagged as bloat. Resolved — inline links stay, bottom section became "Additional References" for cross-context items only.
- **"Only Justin edits" → edit-approval policy:** Expanded to all source-of-truth docs, with own line, explicit approval language. See full list in edit-approval section above.
- **Link convention:** Repo-root-relative within repo, sibling-repo for cross-repo. No relative `../` paths.
- **Hub stays in git:** No special deployment — agents clone/pull from any environment.
- **CLAUDE.md serves the agent, not DC:** DC has its own identity and reads standardized docs/ structure. Repo CLAUDE.md files should NOT contain DC build context.
- **DC reading order:** Hub first (for the frame), then build docs (now with context), then deeper only if the task requires it.
- **evryn-website hard stop:** CLAUDE.md tells Claude Code not to function — "use DC." All content moved to docs/ARCHITECTURE.md. Justin: "If I need to change anything, I'll have you come in and change it, or I'll change by hand."
- **Auto-memory hygiene:** Short-term memory only — not operational lessons (those go to LEARNINGS.md etc.). Don't duplicate docs. Clean periodically.
- **DC redirect language:** "Steal from evryn-website's claude.md" — match the hard-stop energy.
- **evryn-backend transitional note:** Justin liked Lucas's "this repo is in transition" section, wanted the same for Evryn's CLAUDE.md.
- **DC redundancy cleanup:** Merged Security Mindset into Build Mandate, combined How to Orient + Documentation Approach + Architecture Doc Rule, restored Build Priorities with Lucas/Alex, Key References → Additional References.
- **DC Diataxis:** Explained directly with type table — don't reference "same as AC."
- **Architecture conflict flagging:** Broadened from "flag to AC" to "flag to Justin (if working directly), Lucas or Alex (if working with them)."
- **AC compression warning reframed:** Not about redundancy (Justin often likes removing redundancy). About compressing *language* that was verbose for a reason. Plus: fresh-instance self-review — will this make sense without the current conversation context?
- **AC glossary line:** Ask Justin if he wants new terms added to the glossary.
- **Session notes require approval:** NOT excluded from edit-approval list. Justin caught over-compaction of session notes earlier — verbose prose was carrying context a future instance needs.
