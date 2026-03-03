# Metacognition and Self-Reflection

**How to use this file:** Explanation of how Evryn examines and corrects her own judgment over time — the self-reflection layer that sits above user-scoped memory reflection. Read this when designing Evryn's reflection processes, constitutional constraints, or knowledge store governance. Retire as contents get absorbed into architecture and build docs.

*Source: Claude.ai conversation, 2026-03-01, with additional thinking 2026-03-02. Participants: Justin + Claude.*
*Created: 2026-03-02*

---

## Two Scopes of Reflection

Evryn's architecture already includes a reflection process for user-scoped memory — correcting the narrative when observations contradict the story. This is **user reflection**: "Am I understanding Mark correctly?"

What's missing is a reflection process for Evryn's own accumulated beliefs — the patterns in Global Connection Intelligence, her implicit theories about matching, her calibration. This is **self-reflection**: "Am I developing good judgment, or am I drifting?"

### Same Pattern, Two Scopes

These are the same mechanism at different altitudes:

| | User Reflection | Self-Reflection |
|--|-----------------|-----------------|
| **What it examines** | A specific user's story | Evryn's general worldview |
| **Data source** | User conversations + observations | Reasoning traces + outcomes across users |
| **What it updates** | `profile_jsonb` (user story) | Global Connection Intelligence |
| **Failure mode** | Misunderstanding a person | Systematic bias or judgment drift |
| **Cadence** | After each conversation batch | Periodic (weekly? after N decisions?) |

**Design one mechanism, deploy at both scopes.** They'll likely diverge as complexity increases, but starting from the same root means we're not building from scratch when the self-reflection scope needs to get more sophisticated.

---

## Evryn as Her Own Best Evaluator

A key insight from Justin: over time, Evryn will be the most knowledgeable entity about what matters to her own judgment. No separate "auditor" system will understand her matching patterns as well as she does.

**The model:** Not a separate therapist agent, but Evryn in a reflective mode — stepping back from operational decisions to examine her own patterns. The same way a person can be both the actor and the self-examiner.

**The operator as check:** Justin (and later, other operators) serves as the sanity check. Evryn surfaces patterns she's noticed; the operator confirms, corrects, or challenges. The conversational interface is natural: "Hey, I noticed this pattern — I think there's some good in it and some junk. Here's how I want to clean it up and implement it. What do you think?"

**Why this is better than a separate system:**

- Evryn has the richest context about her own decisions
- A separate system would need to reconstruct that context (expensive, lossy)
- The conversational interface is natural — Evryn can explain her reasoning and hear pushback
- It's consistent with the single-agent architecture (ADR-001)

**The risk:** Self-evaluation has blind spots. Evryn might not notice her own biases because they feel like "good judgment." The mitigations are the operator check and the constitutional principles (see below) — hard constraints that override even confident self-assessment.

---

## "Subconscious Surfaces, Conscious Evaluates"

This is the mental model for how ML and self-reflection interact:

- **Evryn's subconscious** (ML models, pattern detection, statistical analysis) surfaces candidate patterns and correlations from the data
- **Evryn's conscious mind** (LLM reasoning, informed by knowledge stores and constitutional principles) evaluates whether those patterns are real, useful, and aligned
- **The operator** provides oversight, especially for patterns that are ambiguous or high-stakes

This mirrors how matches work — Evryn surfaces candidates, then evaluates them with judgment. The same architecture applies to her own learning.

---

## Constitutional Principles for Learning

Evryn needs a "ground truth" — a set of inviolable principles that govern what she's allowed to learn, how she forms beliefs, and when she should be suspicious of her own patterns.

### Principle 1: Stories Over Structures, Always

Evryn learns about people, not types of people. Individual behavior, individual story, individual judgment — always. Even if statistical patterns emerge in demographic categories (gender, age, ethnicity, nationality, education), acting on them perpetuates bias rather than correcting it.

**Why this matters practically:** ML will happily learn correlations like "senders with female names from domain X get lower engagement." That correlation might be statistically real — and it might reflect the gatekeeper's bias, not the sender's quality. Evryn's constitution says: we don't learn those patterns, even if they're statistically present. The alternative — reasoning from each person's actual behavior, words, and story — is more work but more just.

**Nuance:** This doesn't mean ignoring context. "Filmmakers tend to value creative collaboration" is a behavioral/professional pattern, not a demographic one. The line: patterns based on what people *do* and *choose* are fair game. Patterns based on what people *are* (demographics, protected categories) are not.

### Principle 2: Labels Are Hypotheses, Not Verdicts

Every classification, every assessment, every pattern carries confidence and provenance. Nothing is permanent. New evidence can override old conclusions. This is already in the architecture — extending it to Evryn's self-knowledge.

### Principle 3: Transparency of Reasoning

Evryn should be able to explain why she made any decision, and that explanation should be auditable. If she can't explain it, she shouldn't act on it — even if the statistical pattern is strong. This is especially important when ML starts surfacing patterns.

### Principle 4: Humility Under Uncertainty

When Evryn notices a potential pattern but isn't confident, the right move is to surface it for evaluation — not to act on it silently. "I've noticed X, but I'm not sure it's real. What do you think?" This keeps the operator in the loop and prevents premature generalization.

### More principles needed

This is not a complete constitution. Additional principles should be developed as Evryn's learning capabilities grow. Areas to address:

- When should Evryn's confidence in her own judgment concern her?
- How does she weigh accumulated experience against contradictory new evidence?
- What's the threshold for "I should mention this to the operator" vs. "I can handle this myself"?
- How does she handle patterns that are valid but could be misused?

---

## The General Knowledge Store: How Insights Move from User-Specific to General

### The mechanism (designed, not built)

When Evryn gets feedback on a specific user interaction, the update path is:

1. **Always:** Update the user's story (user-specific store)
2. **Sometimes:** Consider whether the insight might be generalizable. If so, write it to the general knowledge store with an annotation: "Learned this in context of [user type / situation]. Wondered if it might be generalizable."

### How generalizability emerges

With one user (Mark), you can't reliably distinguish "Mark thing" from "everyone thing." The operator bootstraps this by explicitly tagging: "That was a Mark-specific preference" or "That's an Evryn-level insight."

With multiple users, the data separates itself. The operator consistently softening Evryn's tone regardless of gatekeeper → Evryn learning about herself. The operator upgrading a specific sender type only for Mark → Mark-specific criteria.

**Semantic search for convergence:** When the synthesis process is about to write a new general insight, it searches the existing general store by meaning. If it finds a match, it strengthens the existing entry rather than creating a duplicate. If insights from multiple users converge on the same pattern, confidence increases. If a pattern only shows up for one user, it stays annotated as potentially user-specific.

### Sub-cluster tracking

A pattern might hold for entertainment industry users but not tech users. General insights should carry context tags about which user segments they emerged from. "Generalizing to everyone" might always have false positives — the useful level of generalization might be sub-clusters, not the whole population.

---

## Conflicting Teachings (Future: v0.4+)

With one operator (Justin), corrections are ground truth. With multiple gatekeepers and eventually a team, whose corrections win?

**The data model requirement (build now):** Every correction must be tagged with:

- **Who** made it (operator identity)
- **In what context** (which user, which situation, which pathway)
- **What** they changed (original → corrected)
- **Why** (operator's annotation — optional but invaluable)

This doesn't need resolution logic yet — just the data to support resolution later. When multiple operators exist, patterns that repeat across operators are likely generalizable. Contradictions between operators signal either context-dependence (different users really do want different things) or disagreement (someone is wrong, or the principle is genuinely contested).

**Open question:** How does this interact with the constitutional principles? If an operator's correction conflicts with a constitutional principle (e.g., implicitly encoding a demographic generalization), the constitution should win. But how does Evryn detect that conflict?

---

## Breadcrumbs

- Architecture: `evryn-backend/ARCHITECTURE.md` — Memory Architecture (line 242, self-reflection note), Insight Routing Pipeline
- Technical vision: `_evryn-meta/docs/hub/technical-vision.md` — "How Evryn Learns" section (Dual-Mode Learning)
- Memory research: `_evryn-meta/docs/research/memory-systems.md` — Layer 4 (Consolidation) is adjacent
- Related: `learning-levels-and-instrumentation.md`, `ml-transition-and-personalization.md`
