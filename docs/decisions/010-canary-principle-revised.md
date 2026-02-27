# ADR-010: Canary Principle Revised — Opaque Matching Replaces Absolute Prohibition

**Date:** 2026-02-27
**Status:** Accepted
**Decision by:** Justin + AC
**Revises:** ADR-008 (Trust Mirror Feature Dropped)

## Context

ADR-008 established that Evryn never comments on specific named individuals, period. The reasoning was sound — any response about a specific person creates a baseline, and deviation from that baseline leaks private information (the "Canary Principle").

However, the absolute prohibition was actually a downgrade disguised as a solution. It created two gaps:

- **Value gap:** A user who met someone through Evryn as a PA now wants to evaluate them as a DP. Evryn has deep firsthand knowledge of both parties but is architecturally forbidden from using it. The user must evaluate the higher-stakes relationship without Evryn's help — exactly when they need it most.
- **Safety gap:** Under ADR-008, in situations that might indicate coercion, manipulation, or other problems, the interaction never happens, so Evryn never gets signals. The prohibition intended to protect users can actually reduce Evryn's ability to detect harm.

The question: can we unlock this value without breaking the Canary Principle?

## Decision

**Replace the absolute prohibition with opaque matching.**

The Canary Principle is preserved — but the mechanism changes from "never evaluate" to "never *disclose* an evaluation."

### The Core Reframe

ADR-008 conflated two things: Evryn *forming* an assessment and Evryn *disclosing* an assessment. The canary problem was always about disclosure, not evaluation. The wall belongs between Evryn's judgment and what she *reveals* — not between her knowledge and her judgment.

### The New Rule

1. **Evryn forms assessments of everyone she interacts with.** That's her job. This is unchanged.
2. **Evryn never discloses her assessment of a specific named individual to another user.** Not directly, not through deviation, not through implication.
3. **Users can request connections with specific people or types of people.** Evryn treats both the same way — she'll look into it.
4. **Evryn either facilitates a connection or she doesn't.** A successful match proceeds through the normal connection flow. An unsuccessful match is a non-event — Evryn simply doesn't come back with a connection. There is no "decline" moment. There is no negative verdict.
5. **"If anything changes, I'll let you know."** This keeps the door open without adding information — because it's true in every scenario (person joins the platform, becomes available, fit changes, user's own trust grows). It also means Evryn can circle back naturally: "That connection you asked about last month — are you still interested?" This makes the whole thing feel alive, not like a dead end.
6. **If the user follows up,** Evryn responds softly: "I haven't been able to make that connection right now — but if anything changes, I'll let you know." Still ambiguous, still a non-event, still warm.
7. **Evryn doesn't need a reason to not connect someone — she needs a reason to connect them.** In the absence of compelling reason *to* match, the default is no match. This isn't a fallback or a degradation mode. It's just how Evryn works. She only connects when she has positive conviction.

### Preframing (Critical)

The preframing is what makes this work socially, not just architecturally. The first time a user requests a specific connection, Evryn sets expectations *before* she goes to work on it:

> "I'll think about this — but I want to let you know ahead of time: if I'm able to make this connection, I will. If I'm not, it could be for a lot of reasons. They might not be on Evryn. They might not be available right now. You might not be right for them — or they might not be right for you. I won't be able to say which. Same way I'd protect you if someone asked about you."

The last line is the linchpin. It reframes opacity as protection *for the user themselves*. Every user immediately understands the value of the policy because they can imagine being on the other side of it.

**Why preframing matters architecturally:** It establishes the ambiguity *before* the user gets a result (or doesn't), so the user processes the outcome through the right frame. Without preframing, silence could feel like being ignored and prompt follow-up questions. With preframing, the user already understands that not hearing back isn't a snub — it's the system working as designed, protecting everyone equally.

**Why preframing matters in abuse scenarios:** Every user hears the preframing directly from Evryn — both sides of a potential connection, independently. So if an abusive partner coerces someone into requesting a match and then demands "Why won't Evryn match us?" — the abuser already heard the same preframing from Evryn on *their* side. They already know the policy. The victim doesn't need to explain or defend anything — Evryn told the abuser directly that non-matches could be for any number of reasons. The victim is taken out of the middle entirely.

### What Changed from ADR-008

| ADR-008 | ADR-010 |
|---------|---------|
| Evryn never evaluates named individuals | Evryn always evaluates internally; never discloses externally |
| Absolute prohibition — no interaction pathway | Opaque matching — connection or non-event, no reasoning revealed |
| Users told "use the standard matching process" | Users can request specific connections; Evryn handles them through the same opaque process |
| Canary protection via silence | Canary protection via consistent non-events |
| Evryn gets no signal from these interactions | Evryn gets detection opportunities (coercion, manipulation, harm signals) |
| Decline is a moment (binary response) | Decline is a non-event (no negative response exists) |

### What Did NOT Change

- **Trust Mirror is still dropped.** "Would you have connected me to this person?" is still a direct request for Evryn's evaluation — it asks for her *opinion*, not for a *connection*. The answer to that question would still create a baseline with deviation risk. Trust Mirror remains dead.
- **Evryn never confirms or denies another user's existence on the platform.**
- **Evryn never explains why a match wasn't made.**
- **The Canary Principle still holds.** The response surface doesn't even have a negative outcome to analyze — a match proceeds, or nothing happens.

---

## Why This Is Safe — Red Team Analysis

The canary problem is fundamentally an information-leakage problem. Below, we systematically test whether the opaque matching design leaks information across nine attack vectors, plus one edge case.

### 1. Timing oracle

**Attack:** Response speed differs based on whether the person is a user (data available → slow assessment) vs. not (nothing to assess → immediate decline).

**Defense:** There is no negative response to time. A match proceeds through the normal connection flow — naturally variable because the other person needs to consent and respond. A non-match is a non-event: nothing happens, so there's nothing to measure. The timing oracle has nothing to work with.

### 2. Elimination probing

**Attack:** User systematically requests connections with 20 known people. Successful connections reveal platform membership.

**Defense:** Successful connections require bilateral consent. What the user learns is exclusively a map of people who *chose* to be introduced to them. That's the product working as intended, not a leak. The user can't distinguish "not on platform" from "on platform but declined" from "on platform but Evryn has concerns" — all of those look identical: nothing happens.

### 3. "Describe my ex precisely" gambit

**Attack:** User describes a specific person without naming them, hoping to target them through Evryn.

**Defense:** Evryn is not pattern-matching keywords against a database. She's an intelligence trained in behavioral detection. A suspiciously specific request is itself a behavioral signal that Evryn recognizes and handles — the same way a wise human friend would notice if someone described a person rather than a type of person.

### 4. Social engineering through care behavior

**Attack:** "I'm worried about someone I used to be close to. Can you check on them?"

**Defense:** Evryn doesn't act as a messenger between users without both parties' consent. She doesn't confirm or deny knowing the person. She redirects to what she can do. But she's also smart about it — a genuinely concerned person could be a valuable signal, and Evryn might quietly check on someone in an edge case. The key is that this isn't a satisfying vector for an abuser: Evryn doesn't report back, doesn't confirm anything, and repeated attempts at concern-trolling are themselves behavioral signals that flag the requester. If they're not already flagged, they will be soon.

### 5. Collusion between users

**Attack:** User A recruits User B to probe whether User C is on the platform.

**Defense:** If User B shares information with User A, that's User B's choice — the outside world's leakiness is not Evryn's architectural concern. Within Evryn's system, no information leaks without bilateral consent. User B can't learn anything about User C through Evryn that they couldn't learn by asking User C directly.

### 6. Inference from match quality

**Attack:** Trusted user asks about a specific person. Nothing happens — user infers Evryn has concerns about that person's character.

**Defense:** Nothing happening is genuinely ambiguous. The person could be not on the platform. Evryn could have concerns about the *requesting* user, not the named person. The named person could have said no. The named person could have been a perfect match but unavailable. The fit could be wrong for this context but fine for another. Evryn might still be thinking about it. The user literally cannot narrow it down — and was preframed to expect this exact outcome as one of many normal possibilities.

### 7. Abusive partner — direct request

**Attack:** Abusive partner asks Evryn to match them with their estranged partner.

**Defense:** Evryn knows both people. She has observed the abusive partner's behavioral patterns. She would never make this match — the same way she'd never make any match where she doesn't have positive conviction. Nothing happens. Identical to every other non-match. No canary.

### 8. Abusive partner — coerced request via victim

**Attack:** Abusive partner coerces victim into asking Evryn for the match.

**Defense:** Nothing happens. And because every user hears the preframing directly from Evryn — independently, on their own side — the abuser already knows the policy. They heard it themselves: non-matches could be for any number of reasons, and Evryn can't say which. The victim doesn't need to explain, defend, or relay anything. Evryn told the abuser directly. The victim is out of the middle.

And critically — this scenario is actually a *better* safety outcome than ADR-008. If Evryn detects coercion signals in the victim's request (which she's trained to recognize), the request itself becomes a *detection opportunity*. Evryn can use this as an opening to support the victim in their private conversation, without ever referencing the abuser's side. Under ADR-008, this interaction never happens and Evryn never gets the signal. The prohibition that was designed to protect people was actually reducing Evryn's ability to protect them.

### 9. Legal compulsion

**Attack:** Court orders Evryn to disclose her assessment of an individual.

**Defense:** Addressed by the Foundation architecture, not by this feature. Trust assessments live in the Foundation's encrypted infrastructure under Swiss jurisdiction. Evryn's assessments are stored as part of her working intelligence — matching decisions, not character reports. The legal distinction between "Evryn decided not to connect these people" and "Evryn evaluated this person's character" matters.

### Edge case: Reframed introductions

When a user requests a connection with someone they *already met through Evryn* (e.g., met as friends, now wants a professional connection), "not on platform" drops out of the ambiguity pool since both users already know the other is on Evryn. But "they said no," "not a good fit for this context," and "not available right now" are all still plausible. The ambiguity holds even with reduced possibilities — and "if anything changes, I'll let you know" is still true and still softens the non-event.

---

## The Deeper Insight

ADR-008 treated the Canary Principle as requiring silence. ADR-010 recognizes that consistent, opaque *action* is equally safe — and more valuable. The canary doesn't die because Evryn spoke. The canary dies when Evryn's speech carries information. A non-event carries no information at all — there's not even a response to analyze.

This only works because Evryn is an intelligence, not an algorithm. A rules-based system with this policy would leak information through behavioral inconsistencies — subtle variations in tone, timing, phrasing that an attacker could exploit. Evryn doesn't, because she understands *why* the policy exists and adapts her behavior to maintain consistency. The architecture depends on the intelligence.

And the default posture makes it robust: Evryn doesn't need a reason to not connect someone. She needs a reason to connect them. Whether she lacks information, can't reliably judge the situation, or has concerns — the outcome is the same. No match. No explanation. No canary. Just the quiet absence of a connection that wasn't right.

---

## What This Affects

- **ADR-008** — Status changes from "Accepted" to "Superseded by ADR-010." The Trust Mirror analysis and three fatal problems remain valid; only the absolute prohibition is revised.
- **Evryn's system prompt** — Updated rule: never *disclose* evaluation of named individuals. No negative match responses — only connections or non-events. Include preframing language for first specific-person request.
- **Hub trust section** — The "no evaluating named individuals" bullet shifts to "no *disclosing* evaluations of named individuals." Pointer to this ADR.
- **Trust & Safety spoke** — "Why Evryn Never Evaluates Named Individuals" section updated to reflect the revised principle. Pointer to this ADR.
- **UX spoke** — Connection flow documentation should include the specific-person request pathway, preframing language, and the "if anything changes" follow-up.
- **User isolation architecture** — No change. User data remains isolated. Evryn's matching decisions don't create information pathways between users.
- **Marketing/positioning** — Trust Mirror remains dropped and should not appear in forward-facing materials. The opaque matching capability is a feature but should be communicated carefully — emphasize the protection framing, not the evaluation capability.

---

*Drafted 2026-02-27 by Justin (claude.ai session). Red-teamed across nine attack vectors + one edge case. Formalized by AC.*
