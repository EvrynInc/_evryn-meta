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

## In Progress: roadmap.md Move + Edit Policy

**File moved but not yet committed:** `git mv docs/roadmap.md docs/hub/roadmap.md` was run. The Hub file is now at `docs/hub/roadmap.md` but this hasn't been committed yet.

### Hub content edits still needed (before committing the move):

1. **Header rewrite:**
   - "Only Justin edits this document" → own line, reworded to: "**Do not edit this document without explicit approval from Justin.** If you think something here is wrong or incomplete, tell Justin — do not rewrite it yourself."
   - Move "Load domain spokes only when your current task requires the depth" into the header area (was at bottom under Spokes).

2. **Inline spoke link paths:** Since the Hub is now IN `docs/hub/`, the inline links to spokes need checking. VS Code uses workspace-root-relative paths, so `docs/hub/trust-and-safety.md` still works. Cross-repo link `../evryn-backend/docs/ARCHITECTURE.md` may need adjustment (now `../../evryn-backend/...`). The `SYSTEM_OVERVIEW.md` link may need `../../SYSTEM_OVERVIEW.md`. Test these.

3. **References section rewrite:** Rename "Spokes (Domain Depth)" → "Additional References". Cut the 7 domain spokes (already linked inline). Keep: BizOps spoke (cross-context, not linked inline), build docs (BUILD-EVRYN-MVP, BUILD-LUCAS-SDK), AC/DC protocol, decisions, historical vaults. Cut: ARCHITECTURE.md and SYSTEM_OVERVIEW.md (already linked inline from Technical Architecture section). Add maintenance note: "Domain spokes are linked inline throughout the sections above. When adding new references, prefer inline links in the relevant section."

4. **"Not a SaaS" fix:** Already done — changed to "not a traditional SaaS".

5. **Long View closing:** Justin said "connection is a lost art/buried/what matters" is weak. He wanted to link to a "trusted briefing" he keeps updated. **I don't have the path to this file yet** — need to ask Justin.

### Reference updates needed across repos (14 files):

All references change from `docs/roadmap.md` → `docs/hub/roadmap.md` (internal) or `_evryn-meta/docs/roadmap.md` → `_evryn-meta/docs/hub/roadmap.md` (cross-repo).

**_evryn-meta:**
- SYSTEM_OVERVIEW.md:3
- CLAUDE.md:37
- CHANGELOG.md:61 (historical, low priority)
- docs/doc-ownership.md:26
- docs/session-hub-build-2026-02-20.md:9,67 (this file — ephemeral)
- docs/historical/master-plan-reference.md:3,10
- docs/historical/Background-The_Evryn_Master_Plan_v2.3.md:3

**evryn-backend:**
- CLAUDE.md:27
- docs/BUILD-EVRYN-MVP.md:23,66,359,487
- docs/ARCHITECTURE.md:532
- docs/historical/build-doc-absorption-notes.md:84

**evryn-team-agents:**
- docs/BUILD-LUCAS-SDK.md:118

**evryn-dev-workspace:**
- CLAUDE.md:34

### Edit-approval disclaimer — new policy from Justin

Justin wants explicit approval required before editing source-of-truth docs. Strong tendency to over-compress prose documents is the concern. Policy: "Edits require explicit approval from Justin. Propose changes; don't make them directly."

**Docs that need the disclaimer added to their headers:**

Hub & spokes:
- docs/hub/roadmap.md (already being reworded — see above)
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

**Also add the rule to _evryn-meta/CLAUDE.md** — in the Documentation Approach section. Something like: "Source-of-truth documents require explicit approval from Justin before edits. You have a strong tendency to over-compress prose — always propose changes rather than making them directly. Excluded: CHANGELOG.md, session working notes, ADRs, mailbox files."

**Excluded from disclaimer (free to edit):**
- CHANGELOG.md
- Session working notes (ephemeral)
- ADRs (written once, typically frozen)
- Mailbox files (ac-to-dc, dc-to-ac — disposable snapshots)

## Remaining Work (in order)

1. Finish Hub content edits (header, references section, link paths)
2. Commit the roadmap.md move + Hub edits
3. Update all 14 reference files across 4 repos
4. Add edit-approval disclaimers to all ~20 files listed above
5. Add edit-approval rule to CLAUDE.md
6. Freeze MPR header ("fully superseded by Hub + spokes")
7. Commit and push all repos
8. Ask Justin about the "trusted briefing" path for The Long View closing
9. Review pass with Justin
10. (Optional) Sanity check against original MP v2.3 for lost content

## Justin's Feedback Applied (This Session, Post-Compaction)

- **Salted hash:** Restored in trust-and-safety spoke. The clarifications doc generalized it for the *legal questionnaire audience*, not because the approach was wrong. Internal docs should keep technical specificity.
- **GTM intro:** Added to gtm-and-growth spoke — AI-first pivot changes burn rate, makes organic launch viable, gatekeeper strategy reduces cold-start, but gatekeepers are hard to reach so bottom-up still necessary.
- **Stale tools:** Noted pivots in bizops-and-tooling (Webflow→Next.js, ClickUp→Linear, Mailchimp→HubSpot).
- **Age nuance:** Added to bizops — "May consider younger users with parent-administered accounts, once there's team and revenue."
- **"Not a SaaS":** Changed to "not a traditional SaaS" — technically is a SaaS, just unconventional model.
- **Spoke duplication in Hub:** Domain spokes were listed both inline AND at bottom. Justin flagged as bloat. Being resolved — inline links stay, bottom section becomes "Additional References" for cross-context items only.
- **"Only Justin edits" → edit-approval policy:** Justin wants this expanded to all source-of-truth docs, with own line, explicit approval language. See full list above.
