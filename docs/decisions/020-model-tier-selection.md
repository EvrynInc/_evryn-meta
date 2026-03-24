# ADR-020: Model Tier Selection

**Status:** Accepted (v0.2); analysis required before v0.3
**Date:** 2026-03-24
**Deciders:** Justin, AC2

## Context

Anthropic offers multiple model tiers (Opus, Sonnet, Haiku) with significant cost and capability differences. Every operation Evryn performs — conversation, triage, profile writing, reflection, match evaluation — could theoretically run on a different tier. The question: which operations justify Opus, and which (if any) can tolerate a lighter model?

## Decision

### v0.2: Opus for everything

No exceptions. Every operation runs on Opus.

**Conversation is the product.** Evryn's personality, warmth, judgment, and in-the-moment responsiveness are what users experience. If the conversation sounds like a lesser model — less nuanced, less perceptive, less *Evryn* — the product fails. This isn't a backend optimization where users never see the difference. Every word Evryn says IS the product.

**Triage IS matching.** Reading an email and deciding "is this person gold for Mark?" requires the same quality of analytical judgment as "are these two people right for each other?" The inputs differ (email vs. two profiles), but the cognitive demand — weighing nuance, reading between lines, exercising taste — is identical. Downgrading triage is downgrading match quality.

**Profile writing determines match quality downstream.** Profile quality determines embedding quality determines match quality. A Sonnet-written profile that misses a nuance produces an embedding that misses connections. The cost difference per profile is pennies; the quality difference cascades through every match that user is ever part of.

**Volume makes this free.** v0.2 has one gatekeeper and a handful of users. The cost difference between Opus and Sonnet at this volume is negligible. There is no economic argument for using a lighter model in v0.2.

### v0.3+: Dedicated analysis required

At scale (thousands of users, thousands of conversations per day), "Opus for everything" has real cost implications. Before v0.3 launches, a dedicated analysis should determine which operations, if any, can tolerate a lighter model.

**The analysis should answer:**
1. What is the actual per-operation cost difference between Opus and Sonnet at projected v0.3 volume?
2. For each operation type (conversation, triage, profile writing, reflection, match evaluation), is there a measurable quality difference between Opus and Sonnet output?
3. If Sonnet is "good enough" for some operations, what's the user-experience impact? Run side-by-side comparisons with real data, not synthetic benchmarks.
4. Are there operations that are genuinely low-judgment (status updates, formatting, data lookups) where Haiku or Sonnet would perform identically? If so, those are safe to downgrade.

**The default is Opus until proven otherwise.** The analysis should not start from "how do we minimize cost?" but from "which operations can we prove tolerate a lighter model without degrading the experience?" The burden of proof is on downgrading, not on keeping Opus.

**The answer might still be Opus for everything.** If the analysis shows that the quality difference matters for every operation, the cost of Opus at scale is the cost of the product being good. That's a business decision, not a technical one — and it's a strong position to be in (our product is so good that we can't cut corners on the AI).

**Batch API reduces the pressure.** Background operations (reflection, profile evaluation, re-matching) run at 50% cost via the Anthropic batch API (see [ADR-019](019-matching-cascade-pipeline.md)). This means the model tier question is primarily about real-time operations (conversation, first-match). Batch operations are already half-price regardless of tier.

## Alternatives Considered

### Sonnet for conversation, Opus for matching (rejected for v0.2)

The intuition: conversation is "just talking" while matching requires deeper judgment.

**Rejected because:** Conversation IS Evryn's judgment. When she's talking to someone, she's simultaneously building her understanding of who they are, catching emotional signals, exercising taste about what to say and when, and deciding what's worth noting. This is the same cognitive load as matching — applied in real time, with a human waiting. A lesser model here degrades the core experience.

### Tiered by operation complexity (rejected as a framework)

Assign model tiers based on how "complex" each operation is.

**Rejected because:** Complexity is a poor proxy for what matters. A "simple" conversation volley ("How's your week going?") requires the same model quality as a "complex" one, because Evryn's personality and perceptiveness need to be consistent. Users notice when the AI feels different, even if they can't articulate why. Tier by measurable quality impact, not by intuitive complexity.

### Cost-first optimization (rejected as an approach)

Start from "what's the cheapest we can run?" and upgrade only where quality visibly suffers.

**Rejected because:** Quality degradation in a relationship product is subtle and cumulative. Users don't say "your AI got dumber on Tuesday" — they gradually disengage. By the time you notice, the damage is done. Start from quality, downgrade only with evidence.

## Consequences

- **v0.2 cost model is simple:** one tier, one price. See cost model spreadsheet for per-operation numbers.
- **v0.3 planning must include a model tier analysis** before the BUILD doc is finalized. This analysis is a prerequisite, not a nice-to-have — building a cost model on the wrong tier assumptions leads to understated projections.
- **The batch API's 50% discount applies regardless of tier.** This means switching a batch operation from Opus to Sonnet saves 50% on top of the batch discount — potentially significant at scale. The analysis should quantify this.
- **If the analysis concludes "Opus for everything," that's a defensible position** — document the reasoning and move on. The product's quality justification is strong.
