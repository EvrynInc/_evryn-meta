# Weekend Thinking Intake — 2026-03-23

**How to use this file:** Session doc for absorbing Justin's weekend thinking (5 docs from a non-repo Claude conversation) into the existing architecture. Captures the evaluation, decisions, and action items. Ephemeral — absorb into persistent docs at #lock, then this doc can be archived.

*Started: 2026-03-23T14:13-07:00*

---

## Context

Justin did blue-sky thinking over the weekend with a Claude instance that did NOT have repo access. Five docs landed in `docs/sessions/2026-03-23-weekend-thinking/`. AC evaluated each against the full existing architecture (Hub, spokes, ARCHITECTURE.md, BUILD doc, sprint doc, identity-writing-brief, S4 session doc) to identify genuine improvements vs conflicts vs redundancies.

**Key framing from Justin:** This is weekend thinking, not vetted architecture. The authoring Claude lacked repo context. Justin was working at 2am. Evaluate critically — don't rubber-stamp.

A sixth doc (06 — claude.ai user memory structure) was dropped to AC1 for the identity writing thread. Not worked in this session — noted for cross-reference only.

---

## Decisions by Doc

### Doc 01 — Onboarding Frameworks (MI, narrative, graduated vulnerability)

**Verdict: Genuine improvement. Ship it.**

Expand gatekeeper-onboarding.md "Get to Know Them" section with conversational framework guidance: Motivational Interviewing techniques (reflective listening, following resistance, OARS), narrative techniques (invite specific moments not self-descriptions, follow energy shifts), graduated vulnerability (from Aron rapid closeness research).

**Why it's good:** The section currently has four lines. Says *what* but not *how*. This is exactly where Evryn falls back to generic chatbot patterns. Naming frameworks primes capabilities Claude already has. Well-aligned with "script-as-skill" principle.

**Constraint to watch:** Token budget (~500-800, up to ~1,200 for complex activities). Core.md v7 already has "gentle guide" quality. AC2 needs to hold the dedup line against core.md's "How You See People" section.

**Action:** Justin took this directly to AC1 for identity writing. The weekend doc IS the task brief.

**Timing note for AC0:** Don't update gatekeeper-onboarding.md until AFTER the integration test passes against the current version. Test the existing pipeline first, then apply the expansion.

---

### Doc 02 — Confidence-Aware Reflection

**Verdict: Genuine improvement. Absorb into ARCHITECTURE.md.**

Add "What I'm Confident About and What I'm Still Guessing" section to profile_jsonb alongside story, produced during reflection rewrites. Not scores — natural language self-audit. Confident observations (behavioral consistency across contexts), open questions (thin understanding), tensions/contradictions.

**Why it's good:** Stories carry ambiguity gracefully, which is usually a strength but occasionally lets important patterns hide in beautiful prose. The existing "labels are working hypotheses with confidence and source" (ARCHITECTURE.md:261) is per-label granularity. This adds a holistic self-audit that complements it.

**Timing clarification:** The weekend doc says "rewritten every time the story gets rewritten." But the current design has two cadences — end-of-conversation (frequent, lightweight) and full Reflection Module (periodic, deep). The confidence audit should only run during deeper reflection cycles, not every story append. The weekend Claude wasn't distinguishing those two cadences.

**Action:** Write into ARCHITECTURE.md Reflection Module section. Target: v0.3.

**No conflicts with existing architecture.**

---

### Doc 03 — Matching Architecture (Subconscious/Conscious)

**Verdict: Strong parts + conflicts. Absorb selectively.**

#### What to absorb:

1. **Trigger model** — New entrant triggers search, not a schedule. Huge cost implication (million users idle at near-zero cost). Sound architecture. Goes into ARCHITECTURE.md Judgment & Matching.

2. **What embeddings are good/bad at** — "Seattle" and "Bellevue" may not be close in embedding space. Structured pre-filters (location, profession, hard constraints) must run as traditional database filters BEFORE vector search. Goes into ARCHITECTURE.md Embedding Strategy.

3. **Opus for profile writing and match evaluation** — Current guidance ("Sonnet default, Opus for edge cases") is too vague for matching. Profile quality → embedding quality → match quality. Cost difference is pennies. Quality difference is the brand. Goes into ARCHITECTURE.md Model Tiers. (See also Doc 05 action on cost model line items.)

4. **Naming: "algorithmic (subconscious)" / "analytical (conscious)"** — Use both. The metaphor is useful; the technical terms are necessary for DC. First reference uses both, then contextual.

#### What needs more thought:

5. **Investigative matching** — Powerful concept (Evryn widens search when she suspects stated constraints are softer than they appear). But touches trust architecture: "You're always in control" (trust-and-safety spoke), "hard constraints come first" (UX spoke). The weekend doc handles it correctly ("goes back to them and explores") but the mechanism (privately flagging constraints as "may be softer") means Evryn is forming assessments the user hasn't asked for and using them to override stated preferences. **This is ultimately fine — it's what a great human matchmaker does — but it must be explicitly connected to the trust architecture.** And: the user's second statement of a constraint must be respected absolutely. Needs a dedicated design note, not just a paragraph in matching.

6. **A/B testing profile formulations** — Multiple embedding variants per intent. Interesting but premature. Note as "future optimization," don't design into v0.3.

#### Structured pre-filter fields — DECISION NEEDED NOW

See dedicated section below.

---

### Doc 04 — Pattern Observation System

**Verdict: The distinction is valid. The proposed mechanism is redundant.**

The weekend doc distinguishes reflection (backward-looking, per-person, periodic) from pattern observation (forward-looking, cross-person, real-time). That distinction is real and useful.

**But the existing architecture already handles this.** The Insight Routing Pipeline (ARCHITECTURE.md:343-354) identifies "Global connection intelligence — anonymized compatibility patterns" as pathway #3. The evryn_knowledge consolidation (ARCHITECTURE.md:341) explicitly describes the Reflection module consolidating per-person observations into global patterns. The weekend Claude didn't have access to these sections.

**Action:** Absorb the *distinction* (reflection ≠ pattern observation) as a clarifying note in the existing Insight Routing Pipeline section. Don't add a separate table or system. The existing evryn_knowledge consolidation pathway handles this.

---

### Doc 05 — Matching Economics

**Verdict: Cost numbers useful (reference spreadsheet, don't hard-print). Installments are a strong feature for v0.4.**

#### 5.1 — Per-operation cost numbers

Useful granularity. **But:** docs should reference the cost model spreadsheet by description and last-verified date, not hard-print numbers that will drift. Reasoning anchors ("Opus for profiles because quality difference is the brand") are more durable than dollar amounts.

**Action:** When absorbing into ARCHITECTURE.md and business-model spoke, reference the cost model rather than embedding specific numbers. Pattern: "See cost model (last verified: [date])" with the reasoning stated in prose.

#### 5.2 — Breakeven analysis ("7 months idle")

Powerful data point. Lightly reference in business-model spoke with pointer to cost model for the underlying math.

#### 5.3 — Competitive context

Professional matchmaking $5K-$500K, executive placement 25-35% of salary, dating apps $20-60/mo with no guarantee. This context exists in a spreadsheet. A light breadcrumb in the business-model spoke would strengthen the pricing argument — not the full table, just enough to anchor the "why trust-based pricing wins" argument.

#### 5.4 — Free ongoing support (check-ins)

Already aligned with UX spoke after-care design. The weekend Claude suggested making this an add-on service; Justin pushed back. No further doc action needed.

#### 5.5 — Installment plans

**Justin's case (compelling):** This isn't "wait for users to ask" — it's something Evryn *offers* to unlock markets. Without installments, a poor user who knows a soulmate match is worth $200 but can only pay $20 either pays $20 (leaving $180 on the table) or walks away. With auto-billing installments at $10/mo, Evryn is revenue-positive by month 3 and likely captures most of the $200 over time. At scale, this opens entire market segments of people who can't pay the full value of high-stakes connections upfront. Gratitude drives payment continuation. Not doing this leaves massive money on the table.

**Non-binding framing:** Not a subscription, not a debt obligation. If they stop paying, no penalties — but it's a data point about character, consistent with "character becomes currency."

**Revenue modeling:** Justin's point that this is no *more* uncertain than a monthly subscription that can be canceled at any time is correct. Both have churn risk. Installments at least start from a stated intention anchored to a specific connection's value.

**Timing:** v0.3 is too stuffed. **Target: v0.4, or v0.3.1 if bandwidth allows.** Not later — the market-access argument is too strong to defer indefinitely.

**Action:** Write into a spoke (business-model spoke, new subsection under Trust-Based Pricing) as a designed feature with v0.4 target. Light breadcrumb in ARCHITECTURE.md payments section pointing to the spoke. Include Justin's reasoning — this is a strategic decision, not just a feature.

#### 5.6 — Model selection / cost model line items

The cost model spreadsheet currently bundles "intent extraction + sub-profiles" into one line. Justin wants this broken into separate lines: intent extraction, intent writing, main profile writing, sub-profile writing. Easier to verify, easier to update as costs change.

**Also:** The cost model currently only reflects v0.2 operations. It does NOT account for v0.3+ feature costs (user reflection, Evryn's self-reflection, matching pipeline, proactive outreach). This needs to be fixed soon — otherwise v0.3 planning is based on a cost model that understates real burn.

**Action (Justin):** Update cost model spreadsheet:
- Break "Concierge distills" into separate line items
- Add v0.3+ feature costs (reflection, matching, proactive outreach)
- Priority: before v0.3 BUILD doc is finalized — don't plan a build against understated costs

---

## Structured Pre-Filter Fields — Decision

**Why now:** v0.2 is creating user records for every contact in Mark's inbox. If structured filterable data (location, profession, company) only lives buried in the `profile_jsonb.story` narrative, then when matching launches in v0.3, we either:
- Parse hundreds of existing stories to extract structured data (lossy, error-prone)
- Re-process all original emails (expensive, may miss context from story)
- Accept that v0.2 contacts have no structured data (delayed matching for early users)

None of those are good. Better to extract now, even sparsely.

**What we can extract during v0.2 triage:** From a single forwarded email, Evryn can often infer:
- Name (already captured in user record)
- Email (already captured)
- Profession/role (often visible from email content, signature)
- Location (sometimes visible)
- Company/organization (often visible from signature, domain)
- Industry/domain (inferable from context)

This will be sparse — a single email doesn't reveal everything. That's fine. v0.3 onboarding enriches it.

**Where it lives:** `profile_jsonb.structured` — a JSONB subobject within the existing column. No schema migration needed. Postgres JSONB operators can query it. If specific fields prove critical for matching performance, they can be promoted to real indexed columns later.

**Proposed structure:**
```jsonc
{
  "story": "...",
  "structured": {
    "location": "Seattle, WA",        // when inferable
    "profession": "cinematographer",   // when inferable
    "company": "August Island Pictures", // when inferable
    "industry": "film",               // when inferable
    // fields added as matching design matures
  },
  // ... existing fields (story_history, pending_notes, etc.)
}
```

**Reconciliation with "stories over structures":** These structured fields are *derived from* the story — extracted alongside it, not collected separately. The story remains the source of truth for understanding. The structured fields are a query optimization for matching pre-filters. If the story says "based in Seattle" and `structured.location` says "Portland" (because it was extracted from an earlier, stale email), the story wins. Reflection module resolves conflicts.

**What this requires:**
1. **triage.md update** — Add a step after writing story: extract structured fields into `profile_jsonb.structured` when inferable. Don't guess — leave null when uncertain.
2. **ARCHITECTURE.md update** — Document the decision and the structure.
3. **Note to DC** — Convention for structured fields in profile_jsonb.
4. **Identity-writing-brief update** — Add structured extraction as a pattern for activity modules that create/update user records.

**Decision needed from Justin:** Approve this approach, or discuss alternatives.

---

## Cross-Reference: Doc 06 (profile_jsonb structure)

Justin dropped doc 06 (claude.ai user memory structure) to AC1 for the identity writing thread. Relevant to this session because:

- We DO have a profile_jsonb structure spec: ARCHITECTURE.md:221-257
- The structured fields decision above extends that spec
- AC1's question ("is this a runtime thing or an instruction thing") — answer is both. The `_meta` key is belt-and-suspenders (instruction in the data), triage.md tells Evryn what fields to write, and code validates
- Whatever AC1 concludes about memory structure should be reconciled with the structured fields decision here

**Not worked in this session.** Flagged for cross-reference only.

---

## Action Items

### This session (AC, with Justin's approval)

| # | Action | Priority | Status |
|---|--------|----------|--------|
| 1 | Structured fields decision — get Justin's approval on approach above | **NOW** | PENDING |
| 2 | ARCHITECTURE.md — Judgment & Matching: trigger model, embedding guidance, model tiers | High | NOT STARTED |
| 3 | ARCHITECTURE.md — Embedding Strategy: what embeddings are good/bad at, structured pre-filters | High | NOT STARTED |
| 4 | ARCHITECTURE.md — Reflection Module: confidence-aware self-evaluation (Doc 02) | Medium | NOT STARTED |
| 5 | ARCHITECTURE.md — Insight Routing Pipeline: clarify reflection vs pattern observation (Doc 04) | Low | NOT STARTED |
| 6 | business-model spoke — installment plans (v0.4 target), competitive context breadcrumb, breakeven reference | Medium | NOT STARTED |
| 7 | triage.md — add structured extraction step (after #1 is approved) | High | NOT STARTED |
| 8 | Investigative matching — design note connecting to trust architecture (Doc 03 item 5) | Medium | NOT STARTED |

### Justin

| # | Action | Priority |
|---|--------|----------|
| J1 | Update cost model: break "Concierge distills" into separate line items | Before v0.3 BUILD |
| J2 | Update cost model: add v0.3+ feature costs (reflection, matching, proactive) | Before v0.3 BUILD |
| J3 | Review structured fields decision (#1 above) | Now |

### AC1 (identity writing thread)

| # | Action | Notes |
|---|--------|-------|
| A1 | Doc 01 — expand gatekeeper-onboarding.md "Get to Know Them" | Justin delivered the brief directly |
| A2 | Doc 06 — profile_jsonb structure discussion | Cross-ref: structured fields decision here affects the spec |

### AC0 (integration test)

| # | Action | Notes |
|---|--------|-------|
| A0 | Nothing changes for integration test | Run against current identity files. gatekeeper-onboarding.md update comes after test passes. |

### Sprint-awareness note

Justin is mid-sprint. The ARCHITECTURE.md updates (items 2-5) are important but not sprint-blocking — they're design documentation, not code changes. The triage.md update (item 7) IS sprint-relevant if we want v0.2 contacts to have structured data from day one. Prioritize #1 → #7 → #2-3, then the rest as bandwidth allows.

---

## What NOT to Do This Session

- Don't rewrite the business-model spoke's financial projections — the cost model spreadsheet is the source of truth and needs updating first (J1, J2).
- Don't design the full v0.3 matching schema — the structured fields decision enables future matching without committing to the full schema now.
- Don't update the BUILD doc's v0.3 staging section — that's a #lock task after the persistent docs are updated.
- Don't work on Doc 06 (profile_jsonb memory structure) — that's AC1's thread.
