# v0.3 Design Proposal: Feedback Loop Formalization

> **Type:** Research proposal (AC2)
> **Status:** Draft for AC0/Justin review
> **Date:** 2026-03-20
> **Depends on:** ADR-018 (gold→match confirmation, two separate feedback flows), ARCHITECTURE.md (Insight Routing Pipeline, Approval Gate as Training Interface), BUILD doc (feedback-guidance.md spec, cross-user feedback routing)
> **Affects:** Identity files (feedback-guidance.md), care_queue, learning systems, matching calibration

---

## The Problem

ADR-018 established two separate feedback concerns. The BUILD doc adds a third. Currently none of them have formalized architecture:

1. **Gold→match confirmation** (gatekeeper validates Evryn's prediction)
2. **Training feedback** (calibration signals from approvals, reactions, explicit feedback)
3. **Cross-user feedback routing** (feedback from one user updates another user's profile)

Each is a different data flow with different privacy implications.

---

## Flow 1: Gold→Match Confirmation

**What it is:** The gatekeeper tells Evryn whether a gold classification was right.

**Current state (v0.2):** ADR-018 designed the lifecycle (delivered → matched/passed/no_gk_response) with follow-up tracking in lifecycle metadata. The stale-item checker prompts Evryn to follow up after 7 days. But there's no structured way for the gatekeeper to respond — they just... email Evryn, or don't.

**v0.3 design:**

### Structured Confirmation Channels

**Channel 1: Conversational.** Mark tells Evryn in an email or (future) chat: "That Sarah Chen was perfect" or "Nah, not a fit." Evryn interprets the feedback using her conversational intelligence, updates the emailmgr_item status, and records the gatekeeper's actual words in the lifecycle note (per ADR-018 decision #9).

This is the primary channel and works today with no schema changes. The feedback-guidance.md identity module should spec:
- How Evryn asks for feedback (gentle, not transactional)
- How Evryn interprets ambiguous responses ("Hmm" ≠ confirmation)
- How Evryn captures the reasoning (not just yes/no but *why*)

**Channel 2: Inline in notifications (v0.3).** When Evryn sends a gold notification to the gatekeeper, include lightweight response prompts:

> "I think Sarah Chen is worth your time — she's a documentary DP with 10 years of experience in the Pacific Northwest. [Original email attached]
>
> If you'd like to connect with her, just let me know. And if this isn't quite right, even a quick 'not this time because X' helps me get so much sharper."

The response comes back through the normal conversation flow. No special UI needed for v0.3.

**Channel 3: Quick-response buttons (v0.4+, web app).** When the web interface exists, gatekeeper notifications could include quick-response buttons (thumbs up / thumbs down / tell me more). These generate structured feedback events that bypass conversational interpretation. But this is premature for v0.3.

### Confirmation Data Model

No new tables needed. The `emailmgr_items.metadata.lifecycle` (ADR-018) already tracks this:

```json
{
  "status": "matched",
  "at": "2026-03-24T14:30:00-07:00",
  "note": "gatekeeper confirmed: 'Sarah Chen is exactly who I was looking for — her reel is incredible'",
  "confirmation_type": "explicit_positive",
  "feedback_quality": "high"  // high (with reasoning), medium (yes/no), low (ambiguous)
}
```

Add `confirmation_type` and `feedback_quality` to the lifecycle entry when transitioning to a terminal state. These enable calibration queries: "How often do my golds get explicit positive confirmation with reasoning?"

---

## Flow 2: Training Feedback (Calibration Signals)

**What it is:** Every interaction produces signals that help Evryn calibrate. This is the learning-levels-and-instrumentation research applied to v0.3.

### Signal Sources

| Source | Signal Type | Where Captured | Quality |
|--------|------------|----------------|---------|
| Justin's approval decisions | approve/edit/reject + optional annotation | Approval event metadata | High (expert judgment) |
| Gatekeeper confirmation | matched/passed + reasoning | emailmgr_items lifecycle | High (ground truth) |
| Gatekeeper implicit signals | Response time, engagement level, enthusiasm | Inferred from conversation patterns | Medium |
| User explicit feedback | "That was perfect" / "Not quite right" | Conversation → profile_jsonb notes | High |
| User implicit signals | Engagement after connection, return frequency | Behavioral patterns over time | Low-Medium |
| Connection outcomes | Did the connection work? After-care responses | connection_events lifecycle + care_queue | Highest |

### Reasoning Traces (the foundation)

From ARCHITECTURE.md: "Every classification and match decision should capture a reasoning trace (what, why, confidence 0-10, signals) alongside the outcome."

**Proposed: `reasoning_traces` table.**

```sql
CREATE TABLE reasoning_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What decision was made?
  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'triage_classification',  -- gold/pass/edge for a forwarded email
    'match_proposal',         -- Proposed a connection between two users
    'match_withdrawal',       -- Withdrew a proposed match
    'trust_assessment',       -- Updated trust evaluation for a user
    'proactive_outreach',     -- Decided to reach out proactively
    'feedback_interpretation' -- Interpreted ambiguous feedback
  )),

  -- Context
  user_id UUID REFERENCES users(id),               -- Primary user this decision is about
  related_user_id UUID REFERENCES users(id),        -- Secondary user (for matches)
  emailmgr_item_id UUID REFERENCES emailmgr_items(id),
  connection_event_id UUID REFERENCES connection_events(id),

  -- The trace itself
  reasoning JSONB NOT NULL,
  -- Example for triage:
  -- {
  --   "decision": "gold",
  --   "confidence": 8,
  --   "signals": [
  --     {"signal": "10 years DP experience", "weight": "strong_positive", "source": "email_content"},
  --     {"signal": "Pacific Northwest based", "weight": "positive", "source": "email_content"},
  --     {"signal": "Mentioned Mark's Eva's Wild project specifically", "weight": "strong_positive", "source": "email_content"}
  --   ],
  --   "alternatives_considered": "Could be edge — no reel link provided. But experience depth and geographic fit are strong.",
  --   "gatekeeper_criteria_match": ["looking_for: experienced DPs", "red_flags: none detected"]
  -- }

  -- Outcome (filled in later when we know how it landed)
  outcome JSONB,
  -- Example:
  -- {
  --   "approval_result": "approved",
  --   "gatekeeper_result": "matched",
  --   "gatekeeper_feedback": "Exactly right",
  --   "feedback_quality": "high"
  -- }

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outcome_recorded_at TIMESTAMPTZ
);

CREATE INDEX idx_reasoning_traces_type ON reasoning_traces(decision_type);
CREATE INDEX idx_reasoning_traces_user ON reasoning_traces(user_id);
CREATE INDEX idx_reasoning_traces_outcome ON reasoning_traces(outcome_recorded_at) WHERE outcome IS NOT NULL;
```

**Why a separate table:** Reasoning traces are the atomic units for future ML training, calibration dashboards, and self-reflection. Embedding them in emailmgr_items or connection_events metadata would make them hard to query at scale and would conflate the trace with the lifecycle.

**Evryn writes traces during normal operation.** When she classifies a forward, she writes a reasoning_trace. When she proposes a match, she writes a reasoning_trace. This happens via the triage and matching tools — the tool writes the trace as a side effect.

**Outcomes are backfilled.** When Justin approves/rejects, or when the gatekeeper confirms/rejects, the corresponding reasoning_trace gets its outcome filled in. This creates labeled training data: (decision + reasoning) → outcome.

---

## Flow 3: Cross-User Feedback Routing

**What it is:** When one user gives feedback that's relevant to another user's profile, Evryn routes the insight without compromising privacy.

**From the BUILD doc:** "When a gatekeeper gives feedback on a triage result (e.g., 'that Sarah Chen was great' or 'nah, not a fit because X'), Evryn should (1) update the gatekeeper's criteria with the pattern, AND (2) update the contact's profile with the outcome — without revealing the gatekeeper's specific words or compromising their privacy."

### The Privacy Challenge

Mark says: "Sarah Chen was great — I need more people like her. Her Alaska experience really set her apart."

Evryn needs to:
- Update Mark's `gatekeeper_criteria` with: "Alaska experience is a strong positive signal"
- Update Sarah's `profile_jsonb.story` with: "A gatekeeper confirmed Sarah is a strong fit in the documentary world. Her Alaska experience was specifically noted as a differentiator."

**What Evryn must NOT do:**
- Tell Sarah that Mark specifically praised her (reveals Mark's assessment — violates opaque matching)
- Store Mark's exact words in Sarah's profile (privacy leak)
- Attribute the feedback to Mark by name in any user-facing context

### Proposed Routing Logic

When Evryn processes cross-user feedback:

1. **Extract the signal.** What did the feedback reveal about the gatekeeper's criteria? What did it reveal about the contact?

2. **Update the gatekeeper's profile** with the specific feedback (Mark's criteria get sharper — "Alaska experience = strong positive"). Mark's exact words are preserved in *his* profile and in the emailmgr_item lifecycle note.

3. **Update the contact's profile** with a privacy-safe synthesis. Transform the gatekeeper-specific feedback into Evryn's own assessment:
   - Mark said: "Her Alaska experience really set her apart"
   - Evryn writes in Sarah's story: "Her Alaska experience appears to be a significant professional differentiator in the documentary world."
   - Source: noted as "Evryn's assessment based on professional reception" — not attributed to Mark.

4. **Update the reasoning_trace** for the original triage decision with the outcome. This creates labeled training data.

### Identity File Spec (for feedback-guidance.md)

The `internal-reference/feedback-guidance.md` module should cover:

1. **How to ask for feedback:** Gentle, specific, low-friction. "Even a quick 'because X' helps me calibrate so much faster."
2. **How to interpret feedback:** Map common response patterns to structured signals.
3. **Cross-user routing protocol:** The privacy-safe transformation described above.
4. **Gold→match confirmation flow:** How to follow up, when to close as no_gk_response.
5. **Follow-up cadence:** First follow-up at ~5-7 business days. Second at ~14 days. After 2 follow-ups with no response → close as `no_gk_response`. Each follow-up through the approval gate.
6. **Feedback quality calibration:** High-quality feedback (with reasoning) gets weighted more heavily than binary yes/no. Evryn should express this: "The more you tell me about *why*, the faster I get sharper."

---

## The Calibration Loop (Putting It Together)

```
INTERACTION
  → Evryn makes a decision (triage, match, outreach)
  → Writes reasoning_trace (decision + reasoning + signals)
  → Submits for approval

APPROVAL
  → Justin approves/edits/rejects
  → Outcome recorded on reasoning_trace
  → If edited: delta between Evryn's draft and Justin's edit is a calibration signal

GATEKEEPER RESPONSE
  → Confirmation or rejection
  → Outcome recorded on reasoning_trace + emailmgr_item lifecycle
  → Cross-user feedback routing (criteria update + privacy-safe profile update)

AFTER-CARE (v0.3)
  → Connection outcome ("How did that feel?")
  → Outcome recorded on reasoning_trace + connection_event lifecycle
  → Richest calibration signal — ground truth on whether the match worked

REFLECTION (v0.3-v0.4)
  → Periodic analysis of reasoning_traces with outcomes
  → Pattern detection: "My confidence-8 golds get confirmed 90% of the time,
     but my confidence-6 golds only get confirmed 50% — I should be more honest
     about edge cases"
  → Updates to Evryn's self-knowledge (evryn_knowledge modules)
```

---

## Open Questions for Justin/AC0

1. **Reasoning traces for every triage?** At 200 emails/day per gatekeeper, that's 200 traces/day. With outcome backfill, this becomes a substantial calibration dataset within weeks. Storage cost is minimal (JSONB rows). But should Evryn write full reasoning traces for obvious passes too, or only for gold/edge? Proposed: all classifications — pass reasoning is valuable for auditing ("why *didn't* Evryn surface this person?").

2. **Approval edit diffs:** When Justin edits a draft before approving, the diff between Evryn's original and Justin's version is a high-fidelity training signal. Should we capture both versions? Proposed: yes — store original draft in `emailmgr_items.metadata.original_draft` alongside the approved version.

3. **Feedback-guidance.md priority:** The BUILD doc flags this as pre-Mark-onboarding. Is this still blocking, or has Mark onboarding been pushed enough that there's time? It needs to exist before Evryn starts asking for feedback.
