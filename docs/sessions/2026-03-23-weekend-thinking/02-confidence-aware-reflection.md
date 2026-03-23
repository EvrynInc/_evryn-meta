# Task: Add Confidence-Aware Self-Evaluation to the Reflection Module

## Context

We explored whether Evryn should maintain formal psychometric-style scores (like Big Five dimensions) alongside the narrative story for each person. The conclusion: **no scores, but yes to the discipline that scoring forces.**

The reasoning: psychometric dimensions like "agreeableness" flatten the texture that makes matching work. Two people who both score high on agreeableness might be completely wrong for each other because the *source* of their agreeableness is different — one is generous from abundance, another from a need to be liked. The story preserves that texture. The embedding encodes the story. The match depends on the texture. Scoring would be lossy at exactly the layer where Evryn needs to be richest.

However, the *process* of scoring forces a valuable cognitive move: committing to a claim and evaluating your own evidence. Stories can carry ambiguity gracefully, which is usually a strength but occasionally lets important patterns hide in beautiful prose.

## What to Add

When the reflection module rewrites a person's story (currently weekly for appended material, monthly for full re-interpretation), it should also produce a **"What I'm Confident About and What I'm Still Guessing"** section. This is not a score. It's a natural language self-audit.

### What This Section Should Contain

- **Confident observations:** Patterns Evryn has seen across multiple contexts or stories. "I've seen his generosity in three different situations and it feels core to who he is." The key indicator of confidence is **behavioral consistency across contexts** — the same quality showing up in different stories, different relationships, different circumstances.
- **Open questions:** Where Evryn's understanding is thin, extrapolated from limited data, or based on a single context. "I haven't seen her under professional pressure — I don't know yet if the warmth she shows in personal relationships extends to competitive situations."
- **Tensions or contradictions:** Places where the story contains signals that don't fully align. These aren't problems — they're invitations for future curiosity.

### Why This Matters Operationally

This section serves two functions:

1. **For future-Evryn:** It's an explicit map of where her understanding is thin, which tells her what to be curious about in future conversations. Instead of re-exploring everything, she knows where to focus.
2. **For matching quality:** When evaluating a potential match, Evryn can check her own confidence on the dimensions that matter for that specific connection. "I think he'd be a great collaborator for her — but my read on his collaborative style is based on one story, so confidence is moderate."

### Placement

This lives in `profile_jsonb` alongside the story — not replacing it, complementing it. It gets rewritten every time the story gets rewritten. It should be concise — a few sentences to a short paragraph, not a lengthy analysis.

### What NOT to Do

- Don't introduce numeric scores, scales, or ratings of any kind.
- Don't create fixed dimensions or categories to evaluate against. The observations should emerge from what Evryn actually knows about this specific person, not from a universal template.
- Don't make this section visible to the user. It's Evryn's internal working notes.
