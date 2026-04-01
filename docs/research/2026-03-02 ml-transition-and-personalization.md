# ML Transition and Personalization

**How to use this file:** Explanation of when and how Evryn transitions from prose-based knowledge management to actual machine learning, and how personalization works at both stages. Read this when planning matching intelligence, the general knowledge store, or ML infrastructure. Retire as contents get absorbed into architecture and build docs.

*Source: Claude.ai conversation, 2026-03-01, with additional thinking 2026-03-02. Participants: Justin + Claude.*
*Created: 2026-03-02*

---

## The Transition: Knowledge Management to ML

### What "learning" means before ML

Evryn doesn't have persistent neural network weights that update between conversations. She gets a fresh context window every time. Her "learning" is entirely a function of what gets loaded: identity files, user stories, knowledge modules, reasoning traces.

The "weight update" is literally rewriting a knowledge document. A periodic synthesis process (an LLM call) reads traces + outcomes and updates the knowledge stores. It's automated knowledge management, not model training — but it produces the same practical effect: better context leads to better decisions.

### When ML becomes necessary

**Not "tens of thousands of data points away" — more like ~20 active users.** At that point:

- Manual knowledge store management becomes impractical
- Patterns span too many users and dimensions for prose to capture
- The synthesis process starts missing patterns visible in the data

**The trigger:** When Evryn (or the operator) notices that her knowledge stores don't reflect patterns that seem to exist in the raw data. That's the signal that prose-based knowledge management has hit its ceiling.

**How we'd notice:** This won't announce itself. We need to design detection mechanisms early, even if we don't automate them immediately:

- **Periodic spot checks:** Pull a random sample of recent decisions and their outcomes. Compare the reasoning traces against what's in the knowledge stores. Are there patterns visible in the traces — things that keep coming up — that the stores don't capture? If a human reviewer can see a pattern in 20 traces that the knowledge store doesn't mention, the store is falling behind.
- **Operator frustration signal:** If the operator finds themselves making the same correction repeatedly, the knowledge stores aren't learning fast enough. Repetitive corrections = a pattern the synthesis process should have caught.
- **Calibration drift:** If Evryn's confidence scores stop correlating with outcomes (she says "confidence 8" but only 50% of those work out), something she's not tracking is driving results. The knowledge stores are missing a variable.
- **Volume heuristic:** Simple rule of thumb — if there are more active users than the operator can meaningfully review, the system needs automated pattern detection to supplement human oversight.

### What ML looks like when it arrives

Not a wholesale replacement — an addition. ML surfaces candidate patterns (Evryn's "subconscious"), while her LLM reasoning evaluates them (her "conscious mind"). The operator provides oversight. See `metacognition-and-self-reflection.md` for the evaluation framework and the "subconscious surfaces, conscious evaluates" model.

**Practical example:** ML analyzes 5,000 reasoning traces and match outcomes. It surfaces: "Matches where both parties mentioned a shared creative influence in their onboarding have 3x the completion rate." Evryn evaluates: "That makes sense — shared creative DNA is a strong signal of genuine compatibility. I'll weight that in my matching." Or: "That correlation might be an artifact of the entertainment industry cohort — let me check if it holds in other segments before generalizing."

**Audit requirement:** ML outputs must be auditable. Evryn should be able to explain any ML-surfaced pattern in plain language and evaluate whether it aligns with her constitutional principles (see `metacognition-and-self-reflection.md`). But "explain" doesn't require full decomposition — sometimes the honest audit is "this pattern is statistically strong and I can't find a reason it's biased or harmful, so I'm going to try it and see." The same hunch-friendly transparency that applies to Evryn's conscious judgment (see Principle 3 in the metacognition doc) applies to her evaluation of ML outputs.

**DC can likely spin up basic ML quickly** once the data exists. The accumulated reasoning traces and labeled outcomes ARE the training dataset. This isn't a months-long ML engineering project — it's pointing a model at structured data that's been accumulating since day one.

---

## The Synthesis Process

The synthesis process is how learning actually happens at the pre-ML stage — it's the mechanism that reads accumulated evidence and updates Evryn's knowledge stores, both user-specific and general. (See Levels 1 and 2 in `learning-levels-and-instrumentation.md`.)

### How it works (designed, not built)

1. **Trigger:** Periodic (daily? weekly? after N decisions?), or when the operator requests a reflection
2. **Input:** Recent reasoning traces, approval gate outcomes, response signals, raw conversation logs
3. **Process:** An LLM call reads the accumulated evidence and identifies:
   - User-specific updates (refine this user's story)
   - General updates (patterns that might hold across users)
   - Calibration signals (is Evryn's confidence well-calibrated?)
   - Drift warnings (is Evryn developing problematic patterns?)
4. **Output:** Updated knowledge store entries with provenance (what evidence, from which users, with what confidence)
5. **Check:** Operator reviews significant updates, especially general knowledge store changes

### Cadence (open question)

The memory-systems research (`memory-systems.md`) describes multiple "naps" per day for memory consolidation. The learning synthesis might operate on a different cadence — less frequent, since it's looking for patterns across more data. Weekly deep passes with lighter daily checks? TBD based on data volume and how quickly patterns emerge.

---

## Personalization: Base Model + Correction Weights

### The concept

Production recommendation systems typically work this way: a base model captures general population patterns, then per-user parameters capture individual deviations. Justin's intuition about "correction weights off main weights" maps directly to this — it's a real ML concept (personalization layers, user embeddings on a base model).

### How it works in the prose phase (now)

- **General knowledge store:** "Warm referrals tend to outperform cold outreach." (base model)
- **User story:** "Except for Mark, who values a specific, well-researched cold pitch over a vague warm intro." (correction weight)

This is already how the two-store architecture works naturally. The general store provides defaults; the user story provides overrides. Evryn reasons over both when making a decision.

### Defaults must be heavily down-confidenced and audit-labeled

When Evryn applies a general pattern to a new user — before she actually knows them — those applied defaults should:

- **Carry very low confidence.** A belief inferred from "they're in the film community" is categorically weaker than a belief observed in conversation. The confidence encoding should reflect this (see `learning-levels-and-instrumentation.md`).
- **Be explicitly audit-labeled with their source.** "Inferred from: film community membership, general knowledge store" — not just "we think they value creative collaboration." When we later ask "why did we think they were XYZ?", the answer should be: "Because they were in the film community, and our general pattern said X. No direct observation."
- **Be immediately overridable** by any actual observation about this person. One real data point about an individual outweighs any number of population-level defaults.

This matters because without it, defaults silently become beliefs. Evryn starts "knowing" things about someone she's never met, and nobody can trace where that "knowledge" came from. Audit labeling keeps derived beliefs honest.

### How it works in the ML phase (future)

- **Base model:** Trained on all anonymized match data. Captures population-level patterns.
- **Per-user embeddings:** Capture how each individual deviates from the base. Learned from that user's specific history.
- **Inference:** Base prediction + user-specific adjustment = personalized prediction.

This is standard in recommendation systems (matrix factorization, collaborative filtering with user embeddings, etc.).

### The spectrum of generalization

```
Most specific ←————————————————————————→ Most general

User-specific   Sub-cluster    Segment       Population
(Mark's story)  (indie film    (creative     (all users)
                 producers)    industry)
```

Every insight has a natural level of generalization. Forcing it wider introduces false positives; keeping it too narrow misses transferable patterns. The data model should support tracking where each insight sits on this spectrum, and updating that position as evidence accumulates.

**Sub-cluster tracking matters.** A pattern might hold for entertainment industry users but not tech users. "Generalizing to everyone" might always be lossy — the useful level of generalization might be sub-clusters. General knowledge entries should carry context tags about which user segments they emerged from, so the system can reason about applicability rather than assuming universality.

**Meta-question worth holding:** Is population-level generalization even useful, or do we always end up reconstructing understanding at the individual level anyway? It's possible that the real value lives at the sub-cluster and user-specific levels, and that broad generalizations are always too lossy to act on — useful only as very weak priors for brand-new users. The system should be designed to answer this empirically over time, not assume the answer in advance. If population-level patterns consistently get overridden by individual evidence, that's signal that we should spend our complexity budget at finer granularities.

---

## Conflicting Teachings Resolution (v0.4+ Design Problem)

With one operator, corrections are ground truth. With multiple operators and users, conflicts arise.

### The hierarchy of authority

See `metacognition-and-self-reflection.md` for the full hierarchy. The short version:

1. **Constitutional principles** — the heaviest weight in any decision. Not rigid law, but the strongest guidance Evryn carries. Deviating requires explicit, conscious reasoning about why this case is genuinely exceptional — not just convenience. Think "avoid killing" rather than "thou shalt not kill" — the spirit matters more than the letter, but the spirit is very strong.
2. **The user's own experience** — each user is the ultimate arbiter of what works for them
3. **Operator guidance** — teaches Evryn's general judgment, but defers to user feedback about that specific user
4. **General patterns** — useful defaults, always defeasible

Evryn retains her own judgment alongside all of these — she differentiates what a user wants from what they might need, and decides who she's willing to be in each context.

### Data model requirements (build now)

Every correction tagged with:

- **Who:** Operator identity, or user identity
- **Context:** Which user, which situation, which pathway
- **What:** The change made (original → corrected)
- **Why:** Annotation (optional but invaluable)

This is the same data model described in `learning-levels-and-instrumentation.md` (approval gate outcome tracking) and `metacognition-and-self-reflection.md` (conflicting teachings). The tagging is what makes future resolution possible — capture the provenance now even though the resolution logic comes later.

### Resolution approaches (design later)

- **Patterns repeating across operators** → likely generalizable
- **Contradictions between operators** → either context-dependent (legitimate) or disagreement (needs resolution)
- **Operator corrections conflicting with constitutional principles** → constitution wins
- **Statistical patterns conflicting with operator corrections** → operator wins (for now), but flag for review
- **User feedback contradicting operator guidance** → for that user, the user wins — *provided* no safety concern, no harm to other users, no legal/compliance issue, and Evryn's own integrity isn't compromised. The contradiction itself is data worth examining

### The governance question

"Who teaches Evryn, about what, and how do conflicting teachings get resolved?" is a governance question disguised as a product question. It doesn't need answering until v0.4, but the data model must be ready.

---

## Breadcrumbs

- Architecture: `evryn-backend/ARCHITECTURE.md` — Insight Routing Pipeline (#3 global connection intelligence, #4 training data collection)
- Technical vision: `_evryn-meta/docs/hub/technical-vision.md` — "How Evryn Learns" section, Training Data Pipeline, LLM Strategy
- Memory research: `_evryn-meta/docs/research/memory-systems.md` — Layer 4 (Consolidation) is the same concept applied to conversation memory
- Related: `learning-levels-and-instrumentation.md`, `metacognition-and-self-reflection.md`
