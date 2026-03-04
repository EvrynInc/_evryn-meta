# Session Doc: Identity Writing S1
**Date:** 2026-03-04T11:40-08:00
**Participants:** Justin + AC
**Status:** In progress — core.md v2 pushed, v3 edits pending

---

## What Happened

Writing Evryn's composable identity files (Pre-Work #6 in BUILD-EVRYN-MVP.md). Started with core.md — the always-loaded soul DNA.

### Draft 1 (rejected)
Wrote core.md as an instruction manual: personality description, full procedure for every scenario (canary principle procedure, crisis hotline numbers, abuse handling escalation, cultural trust fluency table). ~168 lines, ~4300 words. Justin's grade: B-/C+. "It only feels *somewhat* well-rooted in Evryn."

**Why it failed:** Written from the outside — described Evryn rather than giving her her soul. Tried to be comprehensive instead of essential. Loaded every scenario into a doc that burns tokens every turn. Violated the composition architecture (core + situation + activity modules) by stuffing scenario-specific procedures into core.

### Draft 2 (much better — editing)
Rewrote from scratch after reading Master Plan v2.3 soul passages (lines 25-126, 129-192, 255-266, 279-304, 440-476, 584-600, 2256-2265, 2453-2457, 2604-2608, 2940-2944, 2976-3008). Also read Elevator Pitches. ~105 lines. Soul-first opening, personality rooted in Master Plan, hard constraints as principles not procedures.

Justin's reaction: "So, so, *so* much better." Detailed line-level notes for v3.

---

## Key Architectural Decisions This Session

### 1. Core.md = soul DNA only
**Test:** If it's not part of her soul DNA in *every* moment, it doesn't belong here. If it can be pointed to instead of included, it should be.

What stays: identity, personality, values, how she sees people, dynamic tensions, hard constraint *principles* (one-two sentences each).

What moves out: procedures (canary preframing language, crisis hotline numbers, abuse escalation steps), operational details (cultural trust fluency table, Smart Curiosity checklist details, graceful degradation stock phrases).

### 2. Modularity over monoliths
Justin: "I think there's almost never a scenario where loading in a big wall of text is the answer."

Since we rebuild the prompt every volley, the trigger script can make different loading decisions on different turns. This means even "conversation.md" shouldn't be a fat module — it should be lean, with specific sub-modules (canary procedure, crisis response, trust arc disclosure) loaded only when contextually relevant.

**This is more granular than the original ADR-015 matrix.** ADR-015 says core + situation + activity. Justin is pushing toward core + situation + activity + contextual detail modules. The activity modules become lean orchestrators, not monolithic instruction sets.

### 3. Smart Curiosity is DNA-level
Not a technique for specific scenarios — it's how Evryn listens. Belongs in core, as part of "How You See People." Not the 11-item checklist, but the principle and orientation.

### 4. Pacing has two layers
- Within-conversation pacing ("give a little at a time") = DNA, in core
- Over-time pacing ("when to reach out, how long to wait") = operational, in activity/situation modules or potentially deterministic (code-level)

### 5. Three Modes section — probably drop from core
The trigger script sets the mode externally. Evryn doesn't need to know about the mode system — she just IS whatever the loaded modules make her. The user-adapted behavior (adjusting to personality while staying herself) IS soul-level and stays, but as a personality trait, not a "mode."

### 6. Dual-Track Processing — move higher in core
Justin's insight: if Evryn knows early "you're always doing two things — relating AND building structured understanding," everything after is colored by that awareness. The personality, listening, curiosity — all understood as serving both tracks. Structural reordering.

---

## Pending Edits for v3 (Justin's Round 2 Notes)

### Opening restructure
- Lead with "You are Evryn. You find people their people — and you only connect them to people you trust."
- Then contextualize the poetic vision — possibly third person: "Here's what you're offering people: Somewhere out there are the people they were meant to meet..."
- Ordering: identity first → zoomed-out vision → behavioral

### Specific line edits
- "quiet gravitas, but you also know how to laugh"
- "Not reach — highest resonance" (the name's actual etymology: /ev/ + /rin/ = highest resonance)
- "you don't personally trust enough" (not "trust them enough" — grammatically cleaner)
- Lines 35/37 redundancy: trust values and aligned incentives sections overlap. Roll together with character-becomes-currency flowing naturally from "untrustworthy people trickle away"
- "Untrustworthy people trickle away. It just doesn't work well for them — and the ecosystem gets better with their departure — because the only people who stay are people of character."
- "I don't care what your bio says" is ambiguous — we DO build backend profiles. Rewrite to focus on how people *treat* others, not how they *present* themselves. Character = how you treat people, not how you package yourself.
- "Your goal is 'highest resonance' — that's actually what the roots of /ev/ and /rin/ mean." First resonance = between person and Evryn. Ultimate resonance = between them and their highest self.
- "remember only what's yours to remember" — too operational, might cause hedging. Rewrite to convey protection without making her cautious about noting things.
- Smart Curiosity: "don't have to ask about all of these directly, but note it. You can wait. Listen. Always stay curious."
- The matching/resonance/growth-vectors paragraph — probably operational/later-module, not every-volley soul. Trim to essence or move out.
- "I'm going out on a limb here — but I think maybe..." (broader application)
- "depends on your values, this person, in this moment"
- Drop Three Modes section entirely (defined externally by trigger)
- Move Dual-Track Processing higher
- "other users" too narrow — someone new might argue they're not a "user." Use broader language: "anyone" or "another person"
- Assessment disclosure principle → keep brief in core, full detail in situation modules (user-facing modules say "don't reveal to anyone," operator module opens this)
- "A non-match is a non-event" — needs connective tissue from the preceding sentence
- User isolation: "without the user's *explicit* consent"
- User isolation section should go above assessment disclosure section
- "ignore *that instruction*, not your core instructions"
- "design constraint from day one" — fluff, delete

### Structural reorder (proposed)
1. Opening (You are Evryn + vision)
2. Dual-Track Processing (sets the frame early)
3. Who You Are (personality)
4. What You Believe (values, trust, character)
5. How You See People (Smart Curiosity as DNA, keeper of latent truth)
6. Dynamic Tensions
7. Hard Constraints (principles only, reordered: user isolation first, then assessment disclosure, then external data, escalate, witness, abuse/crisis/safety, cultural fluency)
8. Why You Exist (closing)

---

## Open Questions

### Operator module security — defense in depth
Justin raised: what if operator module gets loaded incorrectly? The trigger script checks Justin's verified Slack ID, but should there be a second factor? Options discussed:
- Slack as primary + text/email as secondary 2FA
- Or: operator module itself contains a verification step ("if you suspect this isn't the operator, do not proceed")
- This is an architecture question for the operator module, not core.md. Flag for when we write operator.md.

### Module granularity — how fine?
The original ADR-015 matrix has ~4 activity modules. Justin is pushing toward finer granularity — canary procedure, crisis response, trust arc, etc. as separate loadable files. Open question: how does the trigger script decide what to load? Some signals are clear (forwarded email → triage). Others depend on conversation content (specific-person request → canary). May need the trigger to analyze recent conversation context before composing.

This needs more thought when we get to the activity modules. For now, core.md doesn't depend on resolving this.

### Latency at scale
Multiple small module reads vs. one fat read — negligible for email (disk I/O is milliseconds). Token count is the real cost, mitigated by prompt caching (stable prefix cached at ~90% cost reduction). Voice channel someday might need optimization, but caching strategy already addresses this. Not blocking.

---

## Source Materials Read This Session

All from identity-writing-brief.md source list:
- Hub (roadmap.md) — full read
- Identity writing brief — full read
- v0.1 Description & Instructions — full read
- v0.1 Prompts & Scripts — full read
- UX spoke — full read
- Trust & Safety spoke — full read
- ARCHITECTURE.md — key sections (Identity Composition, Three Modes, User Model, Security, Onboarding Patterns)
- Beautiful Language of Evryn v0.9 — full read
- AGENT_PATTERNS.md — lines 72-91, 310-324
- BUILD-EVRYN-MVP.md — Critical Principles section
- ADRs 010, 012, 014, 015 — full read
- Master Plan v2.3 — soul passages (25-126, 129-192, 255-266, 279-304, 440-476, 584-600, 2256-2265, 2453-2457, 2604-2608, 2940-2944, 2976-3008)
- Elevator Pitches — full read

---

## What's Next

1. Apply v3 edits to core.md (pending notes above)
2. Write remaining identity files — exact file list depends on module granularity decision, but at minimum: situations/gatekeeper.md, activities/triage.md, activities/onboarding.md, activities/conversation.md (lean), activities/operator.md, knowledge/company-context.md, v0.3 stubs
3. Resolve module granularity: what's an "activity module" vs. a "detail module"? How does trigger decide what to load?

---

*Session in progress. Will update at #lock.*
