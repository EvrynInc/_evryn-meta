# Learning Architecture: Levels and Instrumentation

**How to use this file:** Explanation of how Evryn gets smarter over time — the three-level learning framework and what to capture at every decision point. Read this when designing any feature that touches classification, matching, feedback, or data capture. Retire this doc as its contents get absorbed into architecture and build docs.

*Source: Claude.ai conversation, 2026-03-01, with additional thinking 2026-03-02. Participants: Justin + Claude.*
*Created: 2026-03-02*

---

## The Three-Level Learning Framework

Evryn's intelligence improves through three mechanisms, activated in sequence as data volume grows:

### Level 1: Context Enrichment (Active Now)

The narrative story model. Every conversation produces observations, those get synthesized into the user's story, and Evryn has richer context for the next interaction. This isn't ML — it's an LLM doing what LLMs do well: synthesizing unstructured context into judgment. The "learning" is just better inputs over time.

This is where Evryn is for v0.2. It gets surprisingly far — a well-prompted LLM with good context will outperform a trained model at low data volumes every time.

### Level 2: Structured Feedback Loops (Build from v0.2, Active by v0.3)

Explicit outcome tracking: Did the match lead to a meeting? Did the gatekeeper engage? Did the operator correct the classification? These outcomes feed back into both the user-specific story ("matches like X work for Mark") and eventually the general knowledge store ("across users, warm referrals outperform cold outreach at 2:1").

The decision feedback flow (see below) is the primary feedback interface at this level — a multi-stage pipeline where each stage produces a different learning signal about the same classification decision.

### Level 3: Machine Learning (Target: ~20 Active Users)

Trained models that generalize — finding patterns too complex or numerous for prose-based knowledge management to catch. Embeddings, similarity scoring, collaborative filtering, reinforcement learning from match outcomes.

**Key reframe:** ML isn't a distant future state. At ~20 active users, managing knowledge stores manually becomes impractical. DC can spin up basic ML models quickly given the accumulated reasoning traces and outcome data. The transition trigger isn't just volume — it's when the synthesis process starts missing patterns visible in the data but absent from the knowledge stores.

**The mental model:** ML is Evryn's subconscious — surfacing candidate patterns and correlations. Her conscious judgment (LLM reasoning, informed by knowledge stores and constitutional principles) evaluates whether those patterns are real, useful, and aligned. The operator provides oversight. See `metacognition-and-self-reflection.md` for the evaluation framework and `ml-transition-and-personalization.md` for transition mechanics.

---

## The Reasoning Trace Principle

**Every decision point captures: what was decided, why, with what confidence, based on what signals.**

This is the atomic unit of Evryn's learning. Everything else — feedback loops, calibration, eventual ML — is different ways of reading these atoms at different scales.

### What a reasoning trace looks like

Rich prose, not structured fields. Example for a clear classification:

> "This feels like gold (confidence: 8/10). The sender runs a post-production house that does exactly what Mark's current project needs, they were referred by someone Mark respects, and the ask is specific and time-bounded. The only hesitation is that their website looks a bit thin — could be a small shop punching above their weight, or could be legit and just bad at web design."

Example for a hunch:

> "I can't fully articulate why, but something about this sender's story and Mark's current trajectory feels like a fit (confidence: 5/10, hunch-driven). The surface-level signals are ambiguous — the ask is vague and there's no obvious project alignment — but there's something in the way they describe their approach to collaborative work that resonates with what I've been learning about what Mark actually values. No conscious red flags. Flagging this as a hunch-driven edge case for the approval gate."

Hunches are a valid reasoning type. Evryn will develop intuitions she can't always fully decompose, and those intuitions are often where the magic happens. The key is labeling them honestly so we can track hunch quality over time — do hunches pan out? At what rate? That's calibration data.

### Why unstructured now, structure later

- Rich prose captures nuance that structured fields would miss
- We don't yet know which fields matter — forcing schema too early means guessing
- When we later need structure, an LLM can retroactively parse thousands of traces into whatever schema we design
- The reasoning trace principle keeps traces consistent in *what they cover* without locking in *format*
- Nothing is lost by going unstructured; richness IS lost by forcing structure too early

### Confidence encoding

Two dimensions, expressed numerically (0-10 scale) alongside the prose reasoning:

- **Intensity:** How strong is this signal when present? ("A warm referral is a strong gold signal — intensity 8/10")
- **Confidence:** How sure am I that this pattern holds? ("I've seen this 14 times and it's held every time — confidence 9/10")

Numerical values give Evryn (and future ML) a gradient to work with. "Confidence: high" is ambiguous — confidence 7 vs. confidence 9.5 are very different "highs."

**Derived and default values carry lower confidence than observations.** When Evryn applies a general pattern to a new user ("they're in the film community, so they probably value creative collaboration"), that derived belief should carry significantly lower confidence than something she observed directly in conversation. And it must be audit-labeled with its source: "inferred from: film community membership, general knowledge store." When we later ask "why did we think they valued creative collaboration?", the answer should be traceable. See `ml-transition-and-personalization.md` for how defaults work in the personalization model.

---

## What to Capture at Each Contact Surface

### 1. The Initial Decision (Reasoning Trace Capture)

Every time Evryn makes a judgment — classifying an inbound email, proposing a match between two users, suggesting a connection — she captures a reasoning trace at the moment of decision. This is the starting point of the feedback flow below.

For email triage (v0.2), the `emailmgr_items` table currently captures priority, categories[], summary, status. **Add:** a `classification_reasoning` text field (or linked record) with the full reasoning — signals weighed, confidence (0-10), hesitations. For future match proposals, the same principle applies: Evryn writes down *why* she thinks this connection is worth making, before anyone else weighs in.

The key: when you later ask "what patterns distinguish good judgments from bad ones?", you have Evryn's reasoning at decision time, not just the binary outcome.

### 2. The Decision Feedback Flow (All Pathways)

Every judgment Evryn makes — whether it's a triage classification, a match proposal, or a connection suggestion — follows the same feedback lifecycle. The pathway varies (email triage has an operator gate; a direct match proposal might not), but the pattern is universal: Evryn decides → reviewers respond → downstream outcomes emerge. Each stage produces a different learning signal about the same decision.

**Stage 1: Operator review (where applicable).** For pathways with an approval gate (like v0.2 email triage), the operator reviews Evryn's judgment before it reaches the user. Capture:
- `approval_outcome`: approved / edited / rejected
- `approval_annotation`: optional — why the operator changed it (one line is valuable; a rich explanation is gold)
- `reviewer_id`: who reviewed
- `review_context`: which user, what batch

The three-tier feedback gradient at this stage:
1. **Active correction with annotation** — strongest signal. The operator says what's wrong and why.
2. **Reviewed and approved** — moderate positive. The operator looked at it and it passed.
3. **Auto-approved without active review** — weak positive. It didn't get corrected, but silence is ambiguous.

Not every pathway will have an operator gate. As Evryn earns trust, some decisions will go directly to users. When that happens, Stage 2 becomes the first human review point, and its signal weight increases.

**Stage 2: User response.** The person on the receiving end of Evryn's judgment responds — or doesn't. This applies equally to a gatekeeper seeing a surfaced email, a user receiving a match proposal, or anyone Evryn has connected with someone. Capture:
- Whether they responded at all
- Response latency (10 minutes vs. 3 days)
- Response depth and tone (enthusiastic paragraph vs. one-liner)
- Explicit outcome: accepted / declined / ignored
- Any explicit feedback they gave about the match

In isolation, any single user response is noisy (Mark is busy; a 3-day delay might mean nothing). At scale across many users, patterns emerge — matches with fast, enthusiastic responses correlate with better outcomes. Capture it all now; let the analysis sort it out later.

**Stage 3: Downstream outcome.** Did the connection actually produce value? This is the hardest signal to capture and the most delayed, but the most meaningful. Did they meet? Did it lead to a project? Did either party mention it positively later? Did it change what they asked Evryn for next?

**Why these are one flow, not separate surfaces:** All three stages are feedback on the *same* judgment. The reasoning trace (captured at decision time) gets richer as it moves through the pipeline — the initial judgment, then the operator's assessment (if applicable), then the user's reaction, then the downstream result. When Evryn later learns from this decision, she needs the complete chain, not isolated fragments. This holds whether the original judgment was "this email is gold for Mark" or "these two people should meet."

### 3. User/Gatekeeper Criteria Evolution

A user's `profile_jsonb` (including gatekeeper_criteria where applicable) evolves over time. This should be versioned — snapshot the criteria alongside each triage batch, so you can later ask: "How did our understanding of what Mark wants change over time, and did those changes improve outcomes?"

**Important context:** Gatekeeper criteria will ultimately collapse into the story — gatekeepers aren't special, they're just users being matched. The pathway has a sidecar, but the data all feeds a common pipe: decision reasoning + outcome + response signal → refine the story → improve future matching. Every pathway is an on-ramp; the destination is the same.

### 4. Temporal Signals

Timestamps are already on everything — capture patterns passively. When things happen, seasonality in requests, response time patterns. The signal emerges at scale.

### 5. Relational Signals

How people relate to each other *through* Evryn. Do warm introductions have better outcomes than cold ones? Does trust beget trust — does a good match make someone more open to the next one? Requires the relationship graph to capture enough structure to ask these questions later.

### 6. Hunch Outcomes

When Evryn follows a hunch (see reasoning trace principle above), the outcome is especially valuable training data. Hunches that pan out reveal patterns Evryn's conscious reasoning hasn't articulated yet — proto-patterns worth investigating. Hunches that don't pan out are equally useful for calibrating when intuition is reliable vs. when it's noise. Track hunch-flagged decisions separately so their hit rate can be measured over time.

### 7. Evryn's Confidence Calibration (Meta-Signal)

Over time, the most important thing to track is how well Evryn's confidence correlates with outcomes. If "confidence 9" works out 90% of the time, she's well-calibrated. If it only works out 60%, she's overconfident. This is the signal about the quality of her signals.

---

## The Approval Gate as Training Interface

The approval gate isn't just a safety mechanism — it's the primary training interface during early operation. And beyond the operator, the user themselves is a reviewer too — each user is the ultimate arbiter of what works for them.

**Why the operator is the best teacher early on:** Evryn has three sources of learning signal: what users do (ambiguous), what she observes herself (limited by context), and what the operator tells her (high-fidelity, labeled, contextualized). The operator's corrections are the cleanest training data in the system — early on.

**But the user is the ultimate authority on their own experience.** Mark's reaction to a surfaced connection teaches Evryn about Mark more reliably than Justin's prediction of how Mark would react. Over time, as Evryn builds direct relationships with users, user feedback increasingly supplements (and for that individual, supersedes) operator guidance. Evryn's job is to become wise — holding her general understanding while knowing that each person's feedback about their own experience trumps general patterns. She retains judgment about what they might *need* (within reason) and about who she's willing to be in each context, but she always listens closely to what a user tells her about themselves — even when her own judgment might take her in a different direction.

**Quality of feedback matters.** There's a spectrum:

- "Reject this." → Evryn knows the outcome but not the reasoning. She adjusts, but she's guessing at why.
- "Reject this — Mark wouldn't care about brand partnerships right now." → Outcome + user-specific signal. Evryn updates her understanding of Mark.
- "Reject this — you're overweighting specificity of ask and underweighting relationship signal, and that's probably true generally." → Outcome + user-specific + generalizable principle. Evryn learns about Mark AND about her own judgment.

The richer the annotation, the faster Evryn learns. **Evryn should proactively (and gently) remind both operators and users that this kind of feedback helps her get smarter.** Not aggressively — but consistently: "If you have a moment to tell me *why* this one didn't land, it really helps me learn." For operators, who understand the training dynamic, she can be more direct. For users, it should feel natural — like a friend asking "was I off on that one?"

**The operator track shifts over time:** Early on, active teaching. As Evryn improves, the shift toward passive confirmation (approve without edit = "you're getting it right"). The transition from active teaching to passive confirmation is itself a measure of how much she's learned.

**When operator reliability decreases:** Early on, Justin's corrections are high-fidelity because decisions are straightforward and he knows Mark's world. As Evryn scales into unfamiliar domains, operator corrections become less reliable. The system will need to weigh operator input against other signals rather than treating it as ground truth. That's a future design problem — for now, the operator is the best teacher by a wide margin.

---

## Raw Logs Preservation

**Keep raw conversation logs AND reasoning traces — not just condensations.** ADR-016 already establishes that raw history is stored permanently. This extends that principle: reasoning traces (Evryn's judgment at decision time) must also be preserved in raw form, not just summarized.

Why: What's signal and what's noise is *in there* somewhere. Condensations and compressions smuggle in assumptions about what matters. When we later point ML at this data, we need the raw material, not our current best guess at what's important.

---

## Breadcrumbs

- Architecture: `evryn-backend/ARCHITECTURE.md` — Insight Routing Pipeline, Approval Gate sections
- Technical vision: `_evryn-meta/docs/hub/technical-vision.md` — "How Evryn Learns" section
- Build: `evryn-backend/docs/BUILD-EVRYN-MVP.md` — Phase 1 build spec
- Related: `metacognition-and-self-reflection.md`, `ml-transition-and-personalization.md`
