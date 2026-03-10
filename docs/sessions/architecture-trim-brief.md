# Task Brief: Trim evryn-backend ARCHITECTURE.md

**For:** A fresh AC instance
**Created:** 2026-03-09
**Status:** Ready to execute

---

## The Problem

`evryn-backend/docs/ARCHITECTURE.md` is 847 lines. It's the system blueprint that AC and DC both read at session start. At this size, it blasts the context window — sessions compact within minutes of loading it, which defeats its purpose. We need it shorter without losing anything that matters.

## The Goal

Trim ARCHITECTURE.md to be **skimmable and modular** — an instance should be able to load the whole doc and still have room to work, OR skim headers and pull only the sections relevant to the current task. Target: significant reduction (ideally under 500 lines), but **do not sacrifice clarity for brevity.**

## The Strategy

Justin's specific suggestions:

1. **Replace inline rationale with ADR pointers.** Many sections explain *why* a decision was made when an ADR already captures the full reasoning. Replace "We do X because [3 paragraphs of reasoning]" with "We do X (see ADR-NNN for rationale)." Keep only the *what* and *how* inline.

2. **Identify sections that are read-on-demand, not always-read.** Some sections only matter when working on specific parts of the system. Could these be clearly marked so an instance knows to skip them unless relevant?

3. **Eliminate redundancy.** The doc has grown through accretion — multiple passes added content, and some ideas are now stated more than once in different sections. Collapse duplicates.

4. **Keep it skimmable.** Headers, short paragraphs, tables over prose where appropriate. An instance scanning the doc should be able to find what it needs in seconds.

## Critical Constraint: Don't Overcompress

**This is the most important constraint.** AC's CLAUDE.md has an explicit warning about overcompression: *"Before tightening prose, consider WHY it might have been verbose — the phrasing may carry important nuance, emphasis, or context that a future reader needs."*

The doc was built over many sessions with Justin's direct input. Some things that look redundant or wordy are deliberately so — they encode emphasis, scope boundaries, or context that prevents future misunderstanding. If something *seems* redundant, consider whether both instances serve different audiences or contexts before cutting.

**When in doubt, keep it. A slightly long doc is better than one that lost something important.**

## What to Read

**In this order:**

1. **This brief** (you're reading it)
2. **`_evryn-meta/CLAUDE.md`** — AC's operating manual. Pay special attention to: "Documentation Approach" (Diataxis + progressive depth), "Write notes that survive context loss" (the overcompression warning), and "Source-of-truth documents require explicit approval from Justin before edits."
3. **`_evryn-meta/docs/hub/roadmap.md`** — The Hub. What Evryn is. You need this to understand what ARCHITECTURE.md is describing.
4. **docs\hub\trust-and-safety.md, docs\hub\user-experience.md, docs\hub\technical-vision.md** these are essential context, to understand what really matters. 
5. **`evryn-backend/docs/ARCHITECTURE.md`** — The full 847 lines. Read every word. This is what you're trimming.
6. **All 17 ADRs in `_evryn-meta/docs/decisions/`** — Read each one. You need to know what rationale is already captured in ADRs so you can confidently replace inline reasoning with pointers. The relevant ones for this doc are primarily ADRs 001, 012, 013, 014, 015, 016, 017 — but scan all of them.
7. C:\Users\Justin\Evryn\Code\evryn-backend\docs\BUILD-EVRYN-MVP.md, C:\Users\Justin\Evryn\Code\evryn-backend\docs\SPRINT-MARK-LIVE.md

**You do NOT need to read:** Session docs, CHANGELOG, LEARNINGS, AGENT_PATTERNS, identity files, additional spokes (other than those mentioned).

## How to Deliver

**This is a source-of-truth document. Do not edit it directly.** Instead:

1. **Produce a section-by-section proposal.** For each `##` section in ARCHITECTURE.md, state:
   - Current line count
   - What you propose to cut, collapse, or replace with ADR pointers
   - Why each cut is safe (what captures the removed content elsewhere)
   - Proposed new line count
   - Any concerns or things you'd flag for Justin

2. **Flag anything you're unsure about.** If a section seems redundant but you can't confirm the content lives elsewhere, say so. Justin will decide.

3. **After Justin approves the proposal,** make the edits. Not before.

## Sections in the Current Doc (for reference)

| Section | Lines | Notes |
|---------|-------|-------|
| Header + Required Context | 1-30 | Keep — this is the reading protocol |
| How to Author This Document | 32-48 | Evaluate — is this needed every read? |
| What Evryn Is | 50-74 | Short already, probably fine |
| User Model | 76-127 | |
| Data Model | 129-243 | Longest section — schema details |
| Memory Architecture | 245-335 | |
| Pipeline Design | 337-416 | |
| Agent Architecture | 418-642 | Second longest — identity composition, SDK, file tree |
| Onboarding Patterns | 644-672 | May be absorbable into identity-writing-brief |
| Security | 674-744 | |
| System Diagram | 746-817 | ASCII art — hard to trim |
| Current State | 819-836 | |
| Related Documents | 838-847 | Keep |

## What Success Looks Like

- A doc that's *ideally* under ~500 lines (flexible — quality over target)
- Every cut is traceable: "this rationale is in ADR-012" or "this is stated identically in section X"
- The doc is still self-contained enough that DC can build from it without chasing references
- Justin reviews and approves every change before it's made
- Nothing was lost that would cause a future instance to misunderstand the architecture

---

## Execution Plan (AC proposal, needs approval by Justin section-by-section)

**Guiding principle (from Justin):** Figure out the right altitude for each piece of content. Write it in one place, point elsewhere. A fresh instance reading the doc should (1) understand well enough *at the altitude they're at*, and (2) know when — and where — to go deeper. Don't waste tokens restating spoke content. But also don't compress so hard it reads like fluff — it has to *land*.

**Three tactics:**
1. Replace inline rationale with ADR pointers — keep the *what*, cut the *why*
2. Consolidate breadcrumbs — future-version breadcrumbs exist in both ARCHITECTURE.md and BUILD doc; put them in one place
3. De-duplicate across docs — where ARCHITECTURE.md and BUILD or spokes carry the same content, make one authoritative and the other a pointer

---

### Section 1: Header + Required Context (Lines 1–30)
**Current:** ~30 lines | **Proposed:** ~28 lines | **Savings:** ~2 | **Status:** PENDING

Mostly lean. The timestamped note (line 11, "2026-02-28") about phase restructuring should be integrated rather than left as a temporary callout — it's been there a month. Replace it with a clean statement.

---

### Section 2: How to Author This Document (Lines 32–48)
**Current:** ~17 lines | **Proposed:** ~5 lines | **Savings:** ~12 | **Status:** PENDING

DC never edits this doc. AC only needs this when actively authoring. Collapse to: the 4 principles as one-liners and the status badge key. Drop the full explanatory sentences — AC can infer "status is sacred" without the elaboration.

**Safety:** The status badge definitions (EXISTS, *designed*, *planned*, *open design question*) must survive — they're used throughout. The rest is guidance for the author, not the reader.

---

### Section 3: What Evryn Is (Lines 50–74)
**Current:** ~25 lines | **Proposed:** ~25 lines | **Savings:** 0 | **Status:** PENDING

Already concise. The Design Drivers (5 imperatives + conditions) are a good altitude-appropriate summary that avoids needing to load the technical-vision spoke. Keep as-is.

---

### Section 4: User Model (Lines 76–127)
**Current:** ~52 lines | **Proposed:** ~42 lines | **Savings:** ~10 | **Status:** PENDING

**Trim targets:**
- **"Shared conversations (future)"** (line 104): 3 lines about opt-in observation — future-state detail. Compress to one sentence + spoke pointer.
- **"Trust imprint on deletion"** (line 108): A full paragraph restating the trust-and-safety spoke. The key add for ARCHITECTURE.md is one thing: *"The data model must support this hash as a persistent artifact surviving account deletion."* Replace the paragraph with that sentence + spoke pointer.
- **"Shared data on deletion"** (line 106): Keep — this is schema-relevant and not fully covered elsewhere.

**Safety:** The "Everyone Is a User" subsection and the gatekeeper model explanation (line 85) are detailed but load-bearing. A future DC who builds a `clients` table because this was trimmed would be a disaster. Keep that detail.

---

### Section 5: Data Model (Lines 129–243)
**Current:** ~115 lines | **Proposed:** ~95 lines | **Savings:** ~20 | **Status:** PENDING

**Trim targets:**
- **"Multi-dimensional matching"** paragraph (line 187): This exact concept is stated *again* in Agent Architecture (line 431, "Judgment & matching"). Remove it from Data Model; keep it in Agent Architecture (where it's more contextually relevant). Leave a one-line note here: "The schema must support multi-dimensional profile-to-intent matching — see Agent Architecture."
- **profile_jsonb "Design principle"** paragraph (line 235): Good concept but verbose. Compress from 4 lines to 2.
- **Open questions** (lines 189–194): Important for AC/Justin. Compact to a tighter bullet list.

**Safety:** The Foundation Tables table and the Relationship Graph section are essential for DC. The JSON example for profile_jsonb is essential. Don't touch these.

---

### Section 6: Memory Architecture (Lines 245–335)
**Current:** ~91 lines | **Proposed:** ~65 lines | **Savings:** ~26 | **Status:** PENDING

**Trim targets:**
- **Reflection Module** (lines 305–320): 16 lines for a feature that's *planned for v0.3*. Compress to ~5 lines: what it is, why it matters, when it's needed, pointer to research. The "how it works" bullets and verification details can wait until v0.3 design.
- **Embedding Strategy** (lines 269–275): 7 lines. Compress to ~4 — the key point is "two distinct needs (knowledge search vs. matching), multiple vectors per user." The Dec 2 historical reference can go.
- **Conversation Compaction** (lines 293–303): 11 lines. The "reference model" line about "Claude Code's auto-compaction" (line 301) can go. Key design decisions stay but tighten.
- **Research pointers** (throughout): Keep — they're already lean.

**Safety:** Memory Layers table is essential. Story Model (how it builds, 4 steps) is essential for DC. Insight Routing Pipeline is essential for future-proofing. Keep all three.

---

### Section 7: Pipeline Design (Lines 337–416)
**Current:** ~80 lines | **Proposed:** ~72 lines | **Savings:** ~8 | **Status:** PENDING

**Trim targets:**
- **Approval Gate** (lines 388–398): Some detail repeated in BUILD doc (lines 142–147). Since ARCHITECTURE.md is canonical for *how the system works*, keep the description here but tighten (~3 lines saved).
- **Connection Lifecycle** (lines 400–414): The "Audit trail includes pass decisions" paragraph (line 414) can be 2 lines instead of 4.

**Safety:** ASCII pipeline diagram is essential. "One code path, not two" is essential. "Cross-thread awareness" is essential. Keep.

**Linked change — duplicate diagram decision:** The pipeline diagram here (lines 343–382) and the trigger diagram in Identity Composition (lines 469–487) cover overlapping ground from different perspectives. Need Justin's call: keep one canonical diagram, simplify the other to a pointer? Or keep both since they serve different purposes (email flow vs. identity composition)?

---

### Section 8: Agent Architecture (Lines 418–642)
**Current:** ~225 lines | **Proposed:** ~135 lines | **Savings:** ~90 | **Status:** PENDING

**This is the main trim target.** Four sub-proposals:

#### 8a. Identity Composition (Lines 439–555): 117 → ~70 lines (-47)

**"What the SDK offers natively and why we diverge"** (lines 445–458): Currently 14 lines explaining settingSources and Skills. Replace with ~4 lines: state what we *don't* use, the three reasons (conversational agent ≠ dev tool, prompt caching control, operator security), and point to ADR-012 for full reasoning.

**"Resolved" note about SDK Skills** (line 459): Absorb the conclusion into the main text in one sentence. Remove the callout box.

**"Composition per query" diagram** (lines 469–487): 18-line trigger diagram. See linked change note in Section 7 above — this diagram and the Pipeline Design diagram overlap. Keep one, simplify the other.

**"Why the trigger doesn't determine situation or activity"** (line 489): 7 lines restating ADR-017 reasoning. Replace with 2 lines + ADR pointer.

**Module architecture explanation** (lines 495–529): The Situation × Activity matrix explanation (8 lines) restates ADR-015. The file tree (24 lines) is valuable — keep it. Compress the explanation to ~3 lines + ADR-015 pointer.

**Prompt caching** (lines 535–551): Code diagram (12 lines) is useful — keep. "v0.3+ note" (line 551) compress to 1-line parenthetical.

**Uncertainty — file tree:** The identity file tree (lines 506–529) is 24 lines. Extremely useful for DC but changes as modules are added. Could it live in the identity-writing-brief? Kept it here because DC needs it at build time and ARCHITECTURE.md is DC's first read. Flag for Justin.

#### 8b. Module Separation (Lines 579–593): 15 → 10 lines (-5)

The 5 likely modules list is useful. The preamble can point to technical-vision spoke instead of restating. The historical n8n reference (line 593) can go — it says "all substantive concepts absorbed."

#### 8c. Matching Calibration (Lines 595–605): 11 → 4 lines (-7)

Status: *planned — v0.4*. Compress to: what the two mechanisms are (one sentence each), and the schema implication (ranked candidate lists from the start). Drop the detailed framing — that's v0.4 UX design, not v0.2 architecture.

#### 8d. Breadcrumbs consolidation: Matching Principles + v0.3 Design Breadcrumbs + Behavioral Design Principles (Lines 607–641 + 672–679): ~40 → 8 lines (-32)

**Key finding:** BUILD doc already has a "Phase 1-2 Principle Breadcrumbs" table (BUILD lines 539–555) serving this exact purpose. There's overlap — after-care, catalyst not replacement, emotional peak tagging, "talk to Evryn" appear in BOTH docs. And ~14 items from ARCHITECTURE.md are missing from BUILD's table.

**Proposal:** Merge all breadcrumbs into BUILD doc's table (already in scannable table format). Replace the ~40 lines in ARCHITECTURE.md with: "**v0.3+ design breadcrumbs** live in `BUILD-EVRYN-MVP.md` (Phase 1-2 Principle Breadcrumbs). Do an `#align` check against those items before finalizing v0.3 architecture."

**Linked change — BUILD doc breadcrumb merge:** Before removing breadcrumbs from ARCHITECTURE.md, the ~14 items only in ARCHITECTURE.md must be added to BUILD's "Phase 1-2 Principle Breadcrumbs" table. Items to merge:
- "Present But Not Pressing" interface philosophy (UX spoke)
- Graceful degradation in-character (UX spoke)
- Latent truth discovery (UX spoke)
- Progressive interface reveal (UX spoke)
- Connection conversations (UX spoke)
- Evryn Wallet (business-model spoke)
- Free vs. paid framework (business-model spoke)
- Post-match transactions via Stripe Connect (business-model spoke)
- Social trust / vouching (trust-and-safety spoke)
- Moderation layers (trust-and-safety spoke)
- Detecting harm and deception (trust-and-safety spoke)
- Growth is conversationally embedded (GTM spoke)
- Cast-off outreach framing (GTM spoke)
- Behavioral filtering for access, full-picture matching (trust-and-safety spoke)
- Forgiving skepticism (trust-and-safety spoke)
- Bias and fairness testing (trust-and-safety spoke)
- 100% satisfaction guarantee (business-model spoke)

**Concern:** DC reading ARCHITECTURE.md won't see these breadcrumbs after the move. But DC also reads BUILD. And these are *future-version* breadcrumbs — not relevant during v0.2 build. BUILD is where future-phase planning lives.

---

### Section 9: Onboarding Patterns (Lines 644–679)
**Current:** ~36 lines | **Proposed:** ~12 lines | **Savings:** ~24 | **Status:** PENDING

The three v0.1 patterns (Dream with me, Smart Curiosity, More About Me) are architectural highlights from historical docs. The identity-writing-brief (`docs/identity-writing-brief.md`) is the right home for onboarding writing guidance.

**Proposal:** Keep section header and context note. Keep "Script-as-Skill" principle (the architectural insight). Keep Justin's onboarding philosophy one-liner. Replace the three pattern descriptions with a pointer to identity-writing-brief and historical docs.

The "Behavioral Design Principles" breadcrumbs (lines 672–679) move to BUILD's breadcrumb table per Section 8d.

**Uncertainty — section thinness:** At ~12 lines this section is mostly pointers. Could merge into Agent Architecture or make it a subsection. Flag for Justin.

---

### Section 10: Security (Lines 682–751)
**Current:** ~70 lines | **Proposed:** ~60 lines | **Savings:** ~10 | **Status:** PENDING

**Trim targets:**
- **Crisis Protocols** (lines 732–738): 7 lines restating trust-and-safety spoke. ARCHITECTURE-specific add is one thing: "must be in trigger-composed systemPrompt via core identity." Compress to 3 lines + spoke pointer.
- **Cultural Trust Fluency** (lines 740–746): 7 lines. Keep v0.2 triage framing (2 lines), cut general principle restatement, add spoke pointer.

**Safety:** Information Firewalling (3 bullets), External Communication as Untrusted Data (prompt template), Attachment Handling table, PII Anonymization gap documentation, "Escalate Don't Fake" — all essential. Don't touch.

**Uncertainty — prompt template:** The untrusted content prompt template (lines 698–711) is 14 lines. Essential security pattern, but could live in an internal-reference file. Kept it because security patterns should be visible, not buried. Flag for Justin.

---

### Section 11: System Diagram (Lines 754–823)
**Current:** ~70 lines | **Proposed:** ~68 lines | **Savings:** ~2 | **Status:** PENDING

ASCII art is hard to trim. Minor: the Vertex AI note in External Services (lines 811–816) can compress from 6 lines to 3.

---

### Section 12: Current State (Lines 827–843)
**Current:** ~17 lines | **Proposed:** ~14 lines | **Savings:** ~3 | **Status:** PENDING

"Prior art synthesized" list: slightly compress parenthetical explanations.

---

### Section 13: Related Documents (Lines 846–856)
**Current:** ~11 lines | **Proposed:** ~11 lines | **Savings:** 0 | **Status:** PENDING

Keep as-is.

---

### Estimated Totals

| Section | Current | Proposed | Savings |
|---------|---------|----------|---------|
| Header + Required Context | 30 | 28 | 2 |
| How to Author | 17 | 5 | 12 |
| What Evryn Is | 25 | 25 | 0 |
| User Model | 52 | 42 | 10 |
| Data Model | 115 | 95 | 20 |
| Memory Architecture | 91 | 65 | 26 |
| Pipeline Design | 80 | 72 | 8 |
| Agent Architecture | 225 | 135 | **90** |
| Onboarding Patterns | 36 | 12 | 24 |
| Security | 70 | 60 | 10 |
| System Diagram | 70 | 68 | 2 |
| Current State | 17 | 14 | 3 |
| Related Documents | 11 | 11 | 0 |
| **Total** | **~839** | **~632** | **~207** |

**Estimated result: ~630 lines** — a 25% reduction. Prioritizes trustworthiness over hitting a number.
