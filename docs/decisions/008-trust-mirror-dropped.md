# ADR-008: Trust Mirror Feature Dropped (Canary Principle)

**Date:** 2026-02-19
**Status:** Superseded by [ADR-010](010-canary-principle-revised.md)
**Decision by:** Justin + AC
**Surfaced during:** Legal questionnaire verification pass

## Context

The Master Plan described a "Trust Mirror" feature: users could ask Evryn "Would you have connected me to this person?" and receive a graduated response ("I definitely would have" → "I wouldn't have under any circumstances"). The idea was that Evryn could offer relational clarity about existing relationships as a value-add.

This seemed compelling because it gives users insight into their existing relationships through Evryn's lens — a natural extension of her judgment.

## Decision

**Feature dropped.** Evryn never comments on specific named individuals, period.

## Why — Three Fatal Problems

### 1. Membership leakage
Any answer about a specific person risks confirming or denying they're on the platform. Even "I can't answer that" is a signal if Evryn answers differently depending on whether she knows the person.

### 2. Coercion risk
The feature becomes a tool for controlling partners, screening employees, or pressuring people. "My partner says they're faithful — what does Evryn think?" is a use case we never want to enable.

### 3. Honesty poisoning
If users learn that their private disclosures to Evryn could be leveraged (even indirectly) through Trust Mirror queries about them, they stop confiding in Evryn. This destroys the foundation of the entire system — Evryn's value comes from people being honest with her.

## The Canary Principle (Broader Implications)

The Trust Mirror analysis revealed a deeper architectural constraint:

**Evryn cannot comment on *any* specific named individual — not even based on public information.**

Here's why: Any response about a specific person creates a baseline. If Evryn freely comments on most people but hesitates or declines for one person (because she privately knows something troubling about them), the *deviation* from the baseline is a canary signal that leaks private information. And if she doesn't hesitate — giving a positive public-information-based assessment — she could find herself endorsing someone who, based on public info, is perfectly fine, but whom she *privately* knows is a predator.

**The only safe position is absolute consistency: Evryn never evaluates named individuals.**

If a user wants to know whether someone is the best mutual match for them, that's the standard matching process — both people engage with Evryn independently. This also creates a natural moat: Evryn's deepest value requires both parties to be engaged.

## What This Affects

- **User isolation architecture** — Trust Mirror was described as a controlled information pathway. It is not. Remove from user isolation documentation.
- **Evryn's system prompt** — Hard line: never comment on specific named individuals. Redirect to standard matching process.
- **Marketing/positioning** — Trust Mirror was a memorable concept. It should not appear in any forward-looking materials.
- **Hub and spoke docs** — Any mention should note it was dropped with a pointer back here.

## Alternatives Considered

- **Anonymized Trust Mirror** ("Would you connect someone like me to someone like them?") — Still creates inference pathways. Too easy to narrow down.
- **General relationship advice** ("What makes a strong partnership?") — This is fine and Evryn will do it naturally. It's just not Trust Mirror.
- **Standard matching as the answer** — If you want Evryn's opinion on whether someone is right for you, both of you engage with Evryn independently. This is the correct path.
