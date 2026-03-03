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

The approval gate is the primary feedback interface at this level. See "The Approval Gate as Training Interface" below.

### Level 3: Machine Learning (Target: ~20 Active Users)

Trained models that generalize — finding patterns too complex or numerous for prose-based knowledge management to catch. Embeddings, similarity scoring, collaborative filtering, reinforcement learning from match outcomes.

**Key reframe:** ML isn't a distant future state. At ~20 active users, managing knowledge stores manually becomes impractical. DC can spin up basic ML models quickly given the accumulated reasoning traces and outcome data. The transition trigger isn't just volume — it's when the synthesis process starts missing patterns visible in the data but absent from the knowledge stores.

**The mental model:** ML is Evryn's subconscious — surfacing candidate patterns and correlations. Her conscious judgment (LLM reasoning, informed by knowledge stores and constitutional principles) evaluates whether those patterns are real, useful, and aligned. The operator provides oversight. See `metacognition-and-self-reflection.md` for the evaluation framework and `ml-transition-and-personalization.md` for transition mechanics.

---

## The Reasoning Trace Principle

**Every decision point captures: what was decided, why, with what confidence, based on what signals.**

This is the atomic unit of Evryn's learning. Everything else — feedback loops, calibration, eventual ML — is different ways of reading these atoms at different scales.

### What a reasoning trace looks like

Rich prose, not structured fields. Example:

> "This feels like gold (confidence: 8/10). The sender runs a post-production house that does exactly what Mark's current project needs, they were referred by someone Mark respects, and the ask is specific and time-bounded. The only hesitation is that their website looks a bit thin — could be a small shop punching above their weight, or could be legit and just bad at web design."

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

---

## What to Capture at Each Contact Surface

### 1. Triage Classification (emailmgr_items)

Currently captures: priority, categories[], summary, status.

**Add:** A reasoning trace — the full reasoning for gold/pass/edge classification. Not just the label, but the signals weighed, the confidence (0-10), and any hesitations. This could be a `classification_reasoning` text field on `emailmgr_items`, or a linked record. The key: when you later ask "what patterns distinguish gold from pass?", you have Evryn's reasoning at decision time, not just the binary outcome.

### 2. Approval Gate Outcome

Currently not captured as structured data.

**Add:** `approval_outcome` (approved / edited / rejected) + optional `approval_annotation` (why Justin changed it) + `reviewer_id` (who reviewed) + `review_context` (which gatekeeper, what batch). Even a one-line annotation from Justin is the highest-value learning signal in the system — expert-labeled, contextualized calibration data.

The three-tier feedback gradient:
1. **Active correction with annotation** — strongest signal. The operator says what's wrong and why.
2. **Reviewed and approved** — moderate positive. The operator looked at it and it passed.
3. **Auto-approved without active review** — weak positive. It didn't get corrected, but silence is ambiguous.

Over time, as Evryn improves and the operator approves more without edits, the absence of correction becomes signal too — but weaker than active confirmation. This gradient gives Evryn calibration, not just binary pass/fail.

### 3. Gatekeeper/User Response Signals

**Explicit:** Did they respond? Accept? Decline? Already partially captured in the connection lifecycle (discovered → notified → accepted → completed/declined).

**Implicit — add:** Response latency and depth. Did Mark respond in 10 minutes with enthusiasm, or three days with a one-liner? In isolation, this is noisy (Mark is busy). At scale across many users, patterns emerge — matches with fast, enthusiastic responses correlate with better outcomes. Capture it all now; let the analysis sort it out later.

### 4. Gatekeeper Criteria Evolution

Mark's `profile_jsonb` holds `gatekeeper_criteria`. This should be versioned — snapshot the criteria alongside each triage batch, so you can later ask: "How did our understanding of what Mark wants change over time, and did those changes improve outcomes?"

**Important context:** Gatekeeper criteria will ultimately collapse into the story — gatekeepers aren't special, they're just users being matched. The pathway has a sidecar, but the data all feeds a common pipe: decision reasoning + outcome + response signal → refine the story → improve future matching. Every pathway is an on-ramp; the destination is the same.

### 5. Temporal Signals

Timestamps are already on everything — capture patterns passively. When things happen, seasonality in requests, response time patterns. The signal emerges at scale.

### 6. Relational Signals

How people relate to each other *through* Evryn. Do warm introductions have better outcomes than cold ones? Does trust beget trust — does a good match make someone more open to the next one? Requires the relationship graph to capture enough structure to ask these questions later.

### 7. Evryn's Confidence Calibration (Meta-Signal)

Over time, the most important thing to track is how well Evryn's confidence correlates with outcomes. If "confidence 9" works out 90% of the time, she's well-calibrated. If it only works out 60%, she's overconfident. This is the signal about the quality of her signals.

---

## The Approval Gate as Training Interface

The approval gate isn't just a safety mechanism — it's the primary training interface during early operation.

**Why the operator is the best teacher:** Evryn has three sources of learning signal: what users do (ambiguous), what she observes herself (limited by context), and what the operator tells her (high-fidelity, labeled, contextualized). The operator's corrections are the cleanest training data in the system.

**Quality of feedback matters.** There's a spectrum:

- "Reject this." → Evryn knows the outcome but not the reasoning. She adjusts, but she's guessing at why.
- "Reject this — Mark wouldn't care about brand partnerships right now." → Outcome + user-specific signal. Evryn updates her understanding of Mark.
- "Reject this — you're overweighting specificity of ask and underweighting relationship signal, and that's probably true generally." → Outcome + user-specific + generalizable principle. Evryn learns about Mark AND about her own judgment.

The richer the annotation, the faster Evryn learns.

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
