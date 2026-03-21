# v0.3 Design Proposal: Proactive Behavior Architecture

> **Type:** Research proposal (AC2)
> **Status:** Draft for AC0/Justin review
> **Date:** 2026-03-20
> **Depends on:** ARCHITECTURE.md (Proactive Behavior section), ADR-016 (curated memory), technical-vision spoke (Intuition & Care domain)
> **Affects:** Care module separation, cron infrastructure, identity files, connection graph

---

## The Problem

ARCHITECTURE.md says proactive behavior is "v0.2 or the first thing after it" and describes what the system needs:
- Evryn-set follow-up timers per interaction
- A trigger mechanism for proactive outreach (cron-based, separate from email polling)
- Tone guidelines for proactive messages
- Escalation tracking
- Two-layer consent model (Evryn defaults + user preferences)

v0.2 has a basic stale-item checker (ADR-018: delivered items >7 days trigger follow-up). v0.3 needs Evryn to *think* about when to reach out, not just react to timers.

The technical-vision spoke describes Intuition & Care as a separate domain — "watches over time, notices if you've gone quiet, remembers open arcs, decides when to reach out or hold space." This is the architecture for that.

---

## Design Principle: Intelligent Timing, Not Deterministic Crons

From ARCHITECTURE.md: "After each interaction, Evryn sets her own expectation: 'Based on this conversation, I'd expect to hear back by X.' If that window passes, she considers reaching out."

This is fundamentally different from "check every 7 days." The timing is:
- **Context-sensitive** — a busy week for Mark ≠ a new user who went quiet after onboarding
- **Interaction-scoped** — each conversation produces its own follow-up expectation
- **Evryn-driven** — she decides the timing, not a fixed rule

---

## Proposed Architecture: The Care Queue

### Core Concept

A `care_queue` table holds Evryn's proactive intentions — things she wants to do for people, at times she's determined are right. A lightweight scheduler checks the queue and fires `query()` calls for items whose time has come.

### Schema

```sql
CREATE TABLE care_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is this about?
  user_id UUID NOT NULL REFERENCES users(id),

  -- What does Evryn want to do?
  care_type TEXT NOT NULL CHECK (care_type IN (
    'follow_up',          -- Check on a delivered triage result (gatekeeper)
    'check_in',           -- "How are you doing?" — relationship warmth
    'after_care',         -- Post-connection follow-up ("How did that feel?")
    'open_arc',           -- Something unresolved from a previous conversation
    'proactive_match',    -- Evryn spotted an opportunity and wants to propose it
    'onboarding_nudge',   -- User stalled during onboarding
    'feedback_request',   -- Asking for feedback on a specific interaction
    'reengagement'        -- User has been dormant
  )),

  -- Evryn's reasoning for this outreach
  context JSONB NOT NULL DEFAULT '{}',
  -- Example:
  -- {
  --   "trigger": "Mark hasn't responded to the gold notification about Sarah Chen (3 days)",
  --   "evryn_assessment": "This is unusual for Mark — he usually responds within a day.
  --                        Could be busy with Eva's Wild shoot.",
  --   "intended_tone": "gentle, not nagging — check in on how things are going generally",
  --   "related_emailmgr_item_id": "uuid",
  --   "related_connection_event_id": "uuid"
  -- }

  -- When should Evryn act?
  scheduled_at TIMESTAMPTZ NOT NULL,

  -- Priority (affects ordering when multiple items are due)
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'low',       -- Nice to do, can wait
    'normal',    -- Standard outreach
    'high',      -- Time-sensitive (e.g., after-care within 24-48 hours)
    'urgent'     -- Escalation re-ping, crisis follow-up
  )),

  -- State
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',    -- Waiting for scheduled_at
    'ready',        -- Time has come, waiting for processing
    'processing',   -- Evryn is thinking about this right now
    'pending_approval', -- Draft submitted, awaiting Justin's approval
    'sent',         -- Outreach delivered
    'cancelled',    -- Evryn decided not to act (context changed)
    'superseded'    -- A newer care_queue entry replaced this one
  )),

  -- If the user contacted Evryn before the scheduled outreach, this is moot
  superseded_by TEXT,  -- 'user_initiated_contact' or care_queue.id

  -- Consent check
  consent_verified BOOLEAN NOT NULL DEFAULT false,
  -- True = verified this outreach is within user's communication preferences

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_care_queue_scheduled ON care_queue(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_care_queue_user ON care_queue(user_id);
CREATE INDEX idx_care_queue_status ON care_queue(status);
```

### How It Works

**1. Evryn creates care_queue entries during normal conversations.**

After each interaction, Evryn evaluates: "What should I follow up on, and when?" She writes this to the care_queue using a `schedule_care` tool. This is NOT automatic — it's Evryn's judgment.

Example: After sending Mark a gold notification about Sarah Chen, Evryn creates:
```json
{
  "user_id": "mark_uuid",
  "care_type": "follow_up",
  "scheduled_at": "2026-03-24T10:00:00-07:00",
  "priority": "normal",
  "context": {
    "trigger": "Gold notification sent about Sarah Chen, no response yet",
    "evryn_assessment": "Mark usually responds within a day. Give him 5 business days before checking in.",
    "intended_tone": "light check-in, not just about Sarah — ask how things are going generally"
  }
}
```

**2. A lightweight scheduler runs every 15 minutes.**

Checks `care_queue` for items where `scheduled_at <= NOW()` and `status = 'scheduled'`. For each:
1. Check if the user has contacted Evryn since the item was created → if yes, mark `superseded`
2. Verify consent (check user's communication preferences) → mark `consent_verified`
3. Compose a `query()` call: Core.md + person context + the care_queue context
4. Evryn reads the context and decides what to say (or whether to say anything at all)
5. Draft goes through the normal approval gate (Justin approves on Slack)

**3. Evryn can decline to act.**

When the scheduler fires, Evryn reads the context and her current understanding of the user. She might decide:
- "Actually, Mark just had a busy week — I'll push this out 3 days" → reschedule
- "The situation has changed — Sarah Chen emailed again, this is moot" → cancel
- "Yes, time to check in" → draft and submit

This is the key difference from a deterministic cron: the cron *presents* the opportunity; Evryn *decides* whether to act.

---

## The Two-Layer Consent Model

From ARCHITECTURE.md: "Evryn has default outreach policies (what she'll do absent user instruction), AND users can set their own communication preferences."

### Layer 1: Evryn's Defaults

Evryn's judgment about what's appropriate. Encoded in identity files and her contextual reasoning:
- After-care within 24-48 hours of a connection
- Follow-up on delivered triage results after ~5-7 business days
- Check-in on dormant users after ~2 weeks
- Proactive match proposals when confidence is high

### Layer 2: User Preferences

Stored in `profile_jsonb.communication_preferences`:

```jsonc
{
  "communication_preferences": {
    "preferred_channel": "email",       // email, sms, chat (future)
    "frequency_cap": "weekly",          // daily, weekly, biweekly, monthly, none
    "quiet_hours": {
      "timezone": "America/Los_Angeles",
      "start": "21:00",
      "end": "08:00"
    },
    "snooze_until": null,               // ISO timestamp — user asked for silence until then
    "opt_out_types": []                  // Array of care_types the user has opted out of
  }
}
```

**User preferences always override Evryn's defaults.** The scheduler checks these before firing.

---

## Proactive Match Discovery (v0.3 Stretch)

Beyond follow-ups and check-ins, Evryn should proactively notice matching opportunities. This is a separate care_type (`proactive_match`) triggered differently:

**Batch matching scan:** Periodically (daily? weekly?), run the matching engine across all active users looking for new high-confidence matches. When found, create a `care_queue` entry for each proposed match — Evryn then evaluates timing and approach.

This is conceptually the "reflection module" applied to matching — Evryn steps back, looks at the full picture, and notices things she missed during real-time conversations.

**Not in scope for initial v0.3** — requires the embedding/matching engine to be operational first. But the care_queue architecture supports it from day one.

---

## Integration with ADR-018 Follow-Up

v0.2's stale-item checker (delivered >7 days → trigger Evryn) becomes a *seed* for the care_queue:

**Migration path:** When the care_queue is built, the stale-item checker creates `follow_up` entries in the care_queue instead of directly triggering `runEvrynQuery()`. The scheduler then handles firing. Same behavior, but now Evryn has context about *why* she's following up and can make better decisions.

The ADR-018 lifecycle on emailmgr_items still tracks the triage-specific lifecycle (delivered → pending_approval → delivered during follow-ups). The care_queue tracks the *proactive* side — when Evryn decided to act and why.

---

## Tone Guidelines for Proactive Messages

Identity file addition needed (probably `internal-reference/proactive-outreach.md`):

**Core principle:** Proactive outreach should feel like a friend who was thinking about you — not a notification, not a reminder, not a nag.

- **After-care:** Warm, genuinely curious. "Welcome back. How did that feel?"
- **Follow-up (gatekeeper):** Light, not transactional. "Hey Mark — just checking in. Did that Sarah Chen connection land the way I hoped?"
- **Check-in (dormant user):** Gentle, one question. "I've been thinking about what you said about finding a creative partner. Still on your mind?"
- **Onboarding nudge:** Inviting, zero pressure. "No rush — I'm here whenever you're ready. But I had a thought about what you mentioned..."
- **Proactive match:** Excited but measured. "I've been thinking about something. There's someone I think you'd really want to meet."

**Anti-patterns:**
- "Just following up!" (corporate, hollow)
- Multiple messages without a response (nagging)
- Urgency language when there's no urgency
- Mentioning the silence explicitly ("I noticed you haven't responded")

---

## Escalation Tracking Integration

The care_queue handles escalation re-pings naturally:

When Evryn escalates something to Justin (crisis, edge case), she creates a care_queue entry:
```json
{
  "user_id": "justin_uuid",
  "care_type": "follow_up",
  "scheduled_at": "+24h",
  "priority": "urgent",
  "context": {
    "trigger": "Escalated crisis situation with user X, no operator response yet",
    "intended_tone": "operational — this needs attention"
  }
}
```

If Justin doesn't respond, the scheduler fires and Evryn re-pings. This replaces ad-hoc stale-escalation checking with the same unified mechanism.

---

## Module Separation Implications

The care_queue + scheduler is the embryonic **Care Module** described in ARCHITECTURE.md:

> "Care Module — Reflection, intelligent scheduling, proactive outreach. Separate runtime with its own cron schedule."

For v0.3, this is just a table + a simple scheduler loop. For v0.4+, this becomes a separate runtime that:
- Runs its own reflection cycles (analyzing patterns across users)
- Manages intelligent scheduling with more sophisticated timing models
- Coordinates with the matching engine for proactive match discovery
- Potentially uses a different model tier (Haiku for routine check-ins, Sonnet for complex situations)

The architecture supports this progression without restructuring.

---

## Open Questions for Justin/AC0

1. **Scheduler frequency:** 15 minutes proposed. Fast enough for after-care (within hours), slow enough to not waste resources. The stale-item checker currently runs hourly — is aligning these desirable?

2. **Should Evryn see the full care_queue for a user?** If she's about to check in on Mark, should she know she also has a proactive match scheduled for next week? Proposed: yes — include pending care_queue items in person context so Evryn can coordinate ("I'll mention the match opportunity in this check-in instead of sending two messages").

3. **Care_queue cleanup:** Entries pile up. Proposed: completed/cancelled/superseded entries older than 90 days get purged. The lifecycle metadata preserves the audit trail.

4. **DND override for urgent escalations:** Currently proposed via Twilio SMS (deferred to v0.3 in sprint doc). The care_queue supports this — `priority: 'urgent'` items could route through SMS instead of email. But this needs the Twilio integration built.
