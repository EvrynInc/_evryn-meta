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

### What ML looks like when it arrives

Not a wholesale replacement — an addition. ML surfaces candidate patterns (Evryn's "subconscious"), while her LLM reasoning evaluates them (her "conscious mind"). The operator provides oversight. See `metacognition-and-self-reflection.md` for the evaluation framework and the "subconscious surfaces, conscious evaluates" model.

**Practical example:** ML analyzes 5,000 reasoning traces and match outcomes. It surfaces: "Matches where both parties mentioned a shared creative influence in their onboarding have 3x the completion rate." Evryn evaluates: "That makes sense — shared creative DNA is a strong signal of genuine compatibility. I'll weight that in my matching." Or: "That correlation might be an artifact of the entertainment industry cohort — let me check if it holds in other segments before generalizing."

**Audit requirement:** ML outputs must be auditable. Evryn should be able to explain any ML-surfaced pattern in plain language and evaluate whether it aligns with her constitutional principles (see `metacognition-and-self-reflection.md`). If she can't explain it, she doesn't act on it.

**DC can likely spin up basic ML quickly** once the data exists. The accumulated reasoning traces and labeled outcomes ARE the training dataset. This isn't a months-long ML engineering project — it's pointing a model at structured data that's been accumulating since day one.

---

## The Synthesis Process

The bridge between raw data and updated knowledge stores. This is the mechanism that makes learning actually happen at the pre-ML stage (Levels 1 and 2 in `learning-levels-and-instrumentation.md`).

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

---

## Conflicting Teachings Resolution (v0.4+ Design Problem)

With one operator, corrections are ground truth. With multiple operators and users, conflicts arise.

### Data model requirements (build now)

Every correction tagged with:

- **Who:** Operator identity
- **Context:** Which user, which situation, which pathway
- **What:** The change made (original → corrected)
- **Why:** Operator's annotation (optional but invaluable)

This is the same data model described in `learning-levels-and-instrumentation.md` (approval gate outcome tracking) and `metacognition-and-self-reflection.md` (conflicting teachings). The tagging is what makes future resolution possible — capture the provenance now even though the resolution logic comes later.

### Resolution approaches (design later)

- **Patterns repeating across operators** → likely generalizable
- **Contradictions between operators** → either context-dependent (legitimate) or disagreement (needs resolution)
- **Operator corrections conflicting with constitutional principles** → constitution wins
- **Statistical patterns conflicting with operator corrections** → operator wins (for now), but flag for review

### The governance question

"Who teaches Evryn, about what, and how do conflicting teachings get resolved?" is a governance question disguised as a product question. It doesn't need answering until v0.4, but the data model must be ready.

---

## Breadcrumbs

- Architecture: `evryn-backend/ARCHITECTURE.md` — Insight Routing Pipeline (#3 global connection intelligence, #4 training data collection)
- Technical vision: `_evryn-meta/docs/hub/technical-vision.md` — "How Evryn Learns" section, Training Data Pipeline, LLM Strategy
- Memory research: `_evryn-meta/docs/research/memory-systems.md` — Layer 4 (Consolidation) is the same concept applied to conversation memory
- Related: `learning-levels-and-instrumentation.md`, `metacognition-and-self-reflection.md`
