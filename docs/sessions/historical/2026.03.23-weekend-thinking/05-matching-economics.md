# Task: Document Matching Economics and Pricing Model

## Context

We ran detailed cost analysis on Evryn's matching pipeline and validated against actual numbers. This document captures the cost model, the pricing philosophy, and the economic structure that makes it all work.

## Actual Cost Numbers

These are real numbers from our current build:

- **Onboarding:** $0.44 per person (includes conversation, profile writing, sub-profiles, and embeddings)
- **Match search:** $0.16 per match (vector search plus Opus conscious evaluation)
- **Follow-up:** $0.04 per interaction (check-ins, small story updates, re-embedding if needed)

### Typical Monthly Costs Per User

- **Simple user, month one:** ~$0.78 (onboarding + 3 sub-profile matches + 2 follow-ups)
- **Complex user, month one:** ~$1.10
- **Ongoing monthly cost:** ~$0.08 (follow-ups only; match searches triggered only when candidates cross threshold)

### Why Idle Cost Is Near Zero

The system does not re-run searches on a schedule for every user. New entrants are the trigger event — when a new person is onboarded and embedded, their embedding is checked against all existing intents, and their intents are checked against all existing people. This is all vector search, which is fractions of a cent regardless of database size. Opus evaluation only fires when something crosses the similarity threshold.

A person waiting for an A+++ soulmate might go months without triggering an Opus evaluation. Their intent sits in the vector database and gets checked for free every time someone new enters. They only cost real money on the rare occasion that a genuinely plausible candidate appears.

## Model Selection by Task

| Task | Model | Rationale |
|---|---|---|
| Day-to-day conversation, triage, routine chat | Sonnet | Cost-efficient, good enough for conversational quality |
| Profile writing (curated intent-specific profiles) | Opus | Core of what Evryn does — profile quality determines embedding quality determines match quality. ~$0.03/variant. Not the place to economize. |
| Conscious match evaluation | Opus | Nuanced judgment about resonance between two people's stories. Subtle complementarities that Sonnet might miss. ~$0.035/candidate. |
| Reflection module (story rewrites) | Opus | Deep re-interpretation of accumulated signal. Quality of the story determines everything downstream. |

## Pricing Philosophy

### Pay What You Believe Is Fair

No fixed prices. After Evryn delivers a connection, the person decides what it was worth to them. This is viable because marginal cost per match is so low that almost any payment is profitable.

- A minimum-wage person paying $20 for a soulmate introduction is still a ~20x return on the match cost.
- A millionaire paying $2,000 for the same service is subsidizing the ecosystem without feeling it.
- Blended average revenue per match is currently modeled at $7.88 (includes free buy-nothing connections and cheap one-offs alongside higher-value matches).

### Payment Only on Delivery

No subscriptions. Evryn only gets paid when she delivers a connection. This creates perfect incentive alignment — Evryn's economic interest and the person's interest are identical. This is a foundational principle, not just a pricing tactic.

Contrast with the existing matchmaking market: traditional matchmakers charge $5,000–$500,000 upfront with no outcome guarantee. Dating apps charge monthly subscriptions and are economically disincentivized from finding your match quickly. Evryn charges nothing until she delivers, and the person decides what it was worth.

### Installment Plans for Accessibility

Someone who believes a soulmate match is worth $300 but can't pay it all at once can spread it out — e.g., $10/month. This is not a subscription and not a debt obligation. It's a stated intention. If they stop paying, there are no penalties and no collections. The relationship is theirs.

If someone stops paying early, that's a data point about who they are, but it doesn't change how Evryn treats them. It quietly informs her understanding, consistent with the principle that character becomes currency.

### Breakeven and Idle Tolerance

Even at the blended average of $7.88 per match, a person can idle in the system for approximately 7 months before their accumulated cost (onboarding + follow-ups) exceeds the expected revenue from a single match. And someone who's been idling for 7 months is likely waiting for a high-value match (soulmate, business partner) that will command well above the blended average.

### Free Ongoing Support

Post-match check-ins (~$0.04 each, a couple times per month) should be offered for free. The cost is negligible, and the value is significant: it keeps Evryn in the person's awareness, provides data on what they need, and to them it just feels like a friend who cares. This is also where Evryn learns whether her matches are actually working, which feeds back into her pattern recognition and reflection.

## Competitive Context

For reference, these are the market rates Evryn is competing against:

- **Professional matchmaking:** $5,000–$25,000 mid-tier; $25,000–$150,000 high-end; $150,000–$500,000+ ultra-exclusive
- **Executive talent placement:** 25–35% of first-year salary (a $200K role = $50K–$70K in fees)
- **Dating apps:** $20–$60/month subscription with no guarantee

Evryn offers arguably better service at a fraction of these costs because she knows people more deeply than a human matchmaker with a 45-minute intake call, she never forgets, she's always refining, and her operating costs per match are negligible. The "pay what you believe is fair" model means she's accessible to everyone while still capturing significant value from high-stakes matches.
