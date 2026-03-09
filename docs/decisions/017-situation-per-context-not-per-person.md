# ADR-017: Situation Is Per-Context, Not Per-Person

**Status:** Accepted
**Date:** 2026-03-05
**Participants:** Justin + AC

## Context

ADR-015 introduced the Situation × Activity matrix: situations answer "who am I talking to?" and activities answer "what am I doing right now?" The original architecture (ADR-012) had the trigger deterministically loading both — situation from the person's profile, activity from the interaction type.

Identity Writing S2 (archived at `docs/sessions/historical/2026-03-04-identity-writing-s2.md`) progressively refined this model. First, activity modules shifted to on-demand (Evryn determines activity from the conversation, not the trigger — see ADR-012 revised, ADR-015 revised). Then Justin identified two deeper problems:

**Problem 1: A person can occupy different situations in different interactions.** Mark is a gatekeeper *in the context of his inbox* — when he forwards emails for triage. But as Evryn's network grows (v0.3+), Mark might be a gold contact for someone else, or just a regular user asking Evryn a personal question. A static "gatekeeper" label on his profile would cause the trigger to load gatekeeper context when it shouldn't.

**Problem 2: "Forward = triage" isn't deterministic either.** Mark might forward Evryn an email about a friend, or forward info she asked for, or forward something for context — none of which are triage events. The forward is a delivery mechanism, not an intent signal.

These two insights, combined with the activity shift, collapse into a single architectural principle: **the trigger should be as simple as possible, and Evryn should determine both situation and activity from the conversation.**

## Decision

### The Simplified Trigger

The trigger's job is minimal:

```
TRIGGER (code-level):
    │
    ├─ Identify sender → Supabase lookup → load person context
    ├─ Compose systemPrompt: Core.md + person context
    ├─ ONE hard-coded exception:
    │   └─ Slack from Justin's verified user ID → add operator.md to systemPrompt
    ├─ If forwarded email → store in emailmgr_items (data capture)
    └─ Call query(systemPrompt, incomingMessage)

EVRYN (prompt-level):
    │
    ├─ Reads the incoming message (passed as prompt, NOT in systemPrompt)
    ├─ Determines situation from message + person context
    │   (pulls situation module via tool if needed)
    ├─ Determines activity from message + person context
    │   (pulls activity module via tool if needed)
    └─ Responds, writes observations back to Supabase
```

The incoming message is the `prompt` parameter to `query()`, never part of the `systemPrompt`. This is a security boundary — email content is untrusted user input and must not be in system-level instructions where prompt injection could manipulate Evryn's identity or access controls.

### Operator Security (Defense in Depth)

Operator mode is the one situation that MUST be trigger-controlled — it grants full information access and operational commands. Three layers prevent unauthorized access:

1. **Core.md doesn't mention it.** The "available modules" section in core.md lists situations and activities Evryn can pull on demand. `operator.md` is not listed. Evryn has no knowledge it exists.
2. **The tool blocks it.** The file-read tool Evryn uses for on-demand module loading excludes `operator.md` from accessible paths. Even if a prompt injection tried to get Evryn to read it, the tool refuses.
3. **Only the trigger can load it.** The trigger code reads `operator.md` directly from the filesystem and concatenates it into `systemPrompt` — code-level string concatenation, no tool involved.

An attacker would need to compromise the trigger code itself. At that point, you have bigger problems.

### Situation Is Per-Context

The person's `profile_jsonb` in Supabase stores role context as fluid, structured data — not a single static label:

```jsonb
{
  "roles": {
    "gatekeeper": {
      "active": true,
      "context": "Inbox triage for mark@example.com",
      "since": "2026-03-07"
    }
  }
  // v0.3+: a person might have multiple roles
  // "user": { "context": "Matched via Dana's network" }
}
```

The trigger does NOT use this to determine situation. It passes the person context to Evryn, who reads the message and decides: "Mark forwarded a candidate email — I should approach this as gatekeeper triage" vs. "Mark is telling me about a friend — this is a regular conversation." The roles in JSONB are input for Evryn's judgment, not a lookup key for the trigger.

### Inbox Pipeline

All forwarded emails go into `emailmgr_items` as data capture — nothing is lost. Evryn then classifies intent:

- **Triage:** "Evaluate this person against Mark's criteria" → pull `triage.md`, proceed with classification workflow, tag the item
- **Not triage:** "Mark is sharing info / telling me about a friend / continuing a conversation" → route appropriately, tag the item as non-triage

This resolves the v0.3 unknown sender question too. An email from someone not in Supabase: the trigger creates a minimal person record, loads core + that thin context, and Evryn determines what to do (first-contact evaluation, spam, etc.) — no special trigger path needed.

### v0.2 Implications

Minimal code impact — DC hasn't built trigger logic yet (only Phase 0 scaffolding: email polling, Gmail OAuth, Supabase client, Slack webhook). The simplified trigger is actually *easier* to build than the original deterministic model.

Data model impact: `profile_jsonb.roles` (structured, multi-role) instead of a static situation field. This is a "build for one, structure for many" decision — adding a second gatekeeper next month is a config change, and when Mark starts interacting outside his inbox, no schema change is needed.

### What This Changes From Earlier Decisions

| Earlier model | Now |
|---|---|
| Trigger loads situation from person profile | Trigger loads core + person context only (except operator) |
| Trigger loads triage deterministically for forwards | All forwards → emailmgr_items; Evryn classifies intent |
| Activity modules on-demand, situations trigger-loaded | Both on-demand (except operator) |
| Unknown sender = special trigger path (open question) | No special path — trigger creates minimal record, Evryn evaluates |
| `situation: "gatekeeper"` static field | `profile_jsonb.roles` fluid structure |

## Reasoning

**Why not let the trigger determine situation from metadata:**
- Forward ≠ triage (Mark might forward info, not candidates)
- "Email from Mark" ≠ gatekeeper (Mark might be asking a personal question)
- The trigger would need to read message content to disambiguate — which means it needs intelligence, which means it's doing Evryn's job worse than Evryn would
- Simpler trigger = smaller attack surface, fewer bugs, easier to maintain

**Why operator is the exception:**
- Operator mode is a security boundary (full access, operational commands), not just a framing difference
- The trigger CAN determine operator deterministically (Slack channel + verified user ID) — no ambiguity
- Defense in depth: three layers prevent unauthorized access (see above)

**Why JSONB roles, not a static field or roles table:**
- Roles are a property of the person's relationship with Evryn, read as part of person context the trigger already loads
- Multi-role is the natural state (gatekeeper AND user AND potential match) — static fields force either/or
- Simple enough for JSONB now; can migrate to a table if role relationships become complex

**Why store all forwards in emailmgr_items regardless of intent:**
- Data hygiene — every forward is captured, nothing lost
- Evryn's classification is recorded (triage, personal, info-sharing, etc.)
- Analytics and learning — patterns in what gatekeepers forward beyond triage candidates are valuable signal

## References

- ADR-012: Trigger-Composed Identity (trigger mechanism — updated for simplified model)
- ADR-015: Situation × Activity Module Matrix (introduces situations and activities)
- ADR-014: Operator Module — Slack Only (operator channel restriction)
- ARCHITECTURE.md file tree and Identity Composition section (canonical reference)
- Session doc: `docs/sessions/historical/2026-03-04-identity-writing-s2.md` (archived — decisions captured in this ADR)
