# Matching Algorithm Design — Research & Architectural Thinking

*Created: 2026-03-29 (Soren + Justin, discovery session)*

> **What this is:** Foundational research on how matching algorithms work — drawing from ad-tech, recommendation systems, search-and-matching economics, network science, clinical psychology, and more — and what it means for Evryn's matching pipeline design. This isn't a spec. It's the thinking that should inform specs.
>
> **How to use it:** Read this before making architectural decisions about the matching pipeline (v0.3 onward). The ad-tech section has the most depth; the other lenses are stubs that need their own deep dives as we get closer to building those pieces. The "Open Questions" section at the end is permanently tracked — revisit it, don't resolve it prematurely.
>
> **Downstream:** Breadcrumbed from `evryn-backend/docs/ARCHITECTURE.md` (Embedding Strategy, Matching Calibration) and `evryn-backend/docs/BUILD-EVRYN-MVP.md` (Matching / Classification Approach).

---

## The Core Problem

Evryn builds rich, holistic understanding of each user through conversation. That understanding lives as a narrative "story" in the user profile. To match users to each other, we need to translate that understanding into a form that supports efficient retrieval across a growing user base.

The naive approach — embed the whole story into a single vector, search for similar vectors — fails because a holistic embedding is too diffuse. It contains signal about every dimension of a person (romantic, professional, creative, personal, geographic, philosophical) compressed into one point in vector space. When you search for matches against a specific intent ("find me a cofounder"), the noise from all the irrelevant dimensions drowns the signal from the relevant ones.

Our current architecture addresses this with **intent-curated match profiles** — Opus reads the full story and writes focused profiles tailored for each matching context, which then get embedded separately. This is the right instinct. The question is: is it the best mechanism? And what does the broader field know about this problem?

---

## Lens 1: Ad-Tech and Recommendation Systems (Deep Dive)

The advertising industry has spent billions solving a structurally identical problem: given a noisy, multidimensional user profile, find the right item (ad, content, product) for a specific context. The optimization target differs (clicks vs. life-changing connections), but the *matching structure* is the same — decompose a noisy profile into intent-specific representations, retrieve candidates efficiently, rank them precisely.

### How the Big Systems Work

**Two-tower architecture** is the dominant production pattern. One neural network encodes the user, another encodes the item. Both map to a shared embedding space. Matching is approximate nearest-neighbor (ANN) search in that space. Google uses this across Search, YouTube, Ads, and Lens. LinkedIn uses it for job matching. Pinterest, Uber, and others use variants.

The critical insight is what happens *inside the user tower*.

**Multi-interest extraction** addresses profile diffuseness directly. Rather than producing a single embedding that tries to capture everything about a user, the system decomposes behavioral history into K distinct interest vectors:

- **MIND (Multi-Interest Network with Dynamic Routing)** — Alibaba, 2019. Uses capsule networks to cluster user behavior into interest "capsules." Each interest is a separate vector. Deployed at Tmall scale; significantly outperforms single-vector approaches. Foundational paper: [arxiv.org/pdf/1904.08030](https://arxiv.org/pdf/1904.08030).
- **ComiRec** — Uses multi-head attention instead of capsules. Each attention head learns to focus on different behavioral clusters. More interpretable than capsule routing.
- **Controllable Multi-Interest Framework** — Allows explicit control over how many interests to extract. Addresses the question: "How many distinct interest dimensions does this user actually have?" Paper: [arxiv.org/pdf/2005.09347](https://arxiv.org/pdf/2005.09347).

**Multi-gate Mixture of Experts (MMoE)** — Google/Pinterest, 2018+. Multiple expert sub-networks learn specialized features; task-specific gating networks route inputs to relevant experts. When predicting "will this person click?" vs. "will they watch for 30 seconds?", different expert networks activate. The profile isn't split — it's *projected differently* depending on the prediction task. Pinterest reports significant improvements in multi-task engagement modeling. See: [Pinterest engineering blog on MMoE](https://medium.com/pinterest-engineering/multi-gate-mixture-of-experts-mmoe-model-architecture-and-knowledge-distillation-in-ads-08ec7f4aa857).

**Meta's Andromeda algorithm** (2025) emphasizes real-time behavioral signals over static profiles — what you're engaging with *right now*, engagement depth, reaction patterns. The profile is dynamic and contextual rather than fixed.

**Key takeaway:** The field has converged on this: **stop trying to make one vector represent a diverse user; instead, explicitly extract multiple context-specific vectors and match against those.** The mechanisms differ (capsules, attention heads, expert gating, contextual projection), but the principle is universal.

### What This Means for Evryn

Our intent-curated match profiles are doing the same thing these systems do — decomposing a holistic understanding into context-specific representations — but through a different mechanism. They decompose *computationally* (neural networks learn to cluster behavior). We decompose *editorially* (Opus reads the story and writes focused profiles).

**Advantages of our editorial approach:**
- Captures narrative judgment that no statistical decomposition can replicate — "the way this person talks about cooking reveals how they'd show up in a relationship"
- Works with sparse data (new users with one conversation, not thousands of behavioral signals)
- Produces human-readable match profiles that Evryn can reference when explaining a match

**Disadvantages:**
- Expensive per-user per-intent (Opus inference for every profile write)
- Introduces a translation chain: story → editorial judgment → prose → embedding → vector. Each arrow can degrade signal.
- Doesn't scale to speculative matching — writing profiles for intents the user hasn't declared is combinatorially expensive

**The hybrid path:** Use editorial decomposition at launch (v0.3). Instrument everything. As match outcome data accumulates, train domain-specific embeddings that learn what good matches look like *from outcomes*. The editorial step gradually shifts from "write the match profile for embedding" to "evaluate the finalists the learned system surfaced." This is a planned transition, not a replacement — narrative judgment stays in the pipeline permanently, but moves from the middle (profile writing) to the end (finalist evaluation).

### The Translation Chain Problem

This deserves explicit attention. When Opus writes "this person approaches work the way a gardener approaches a plot — patient, seasonal, attentive to what's ready," does the embedding model place that vector near the right candidates? General-purpose embedding models are surprisingly good at semantic proximity, but we're trusting a lot to their ability to capture *relational resonance* from prose.

Ad-tech systems sidestep this problem because their embeddings are *trained end-to-end* — the vector space is optimized for the prediction task (click, conversion). The embedding *is* the matching signal. Our approach has an intermediary translation from narrative to vector that theirs doesn't.

**This is why the experimentation framework matters** (see below). We need to empirically test what editorial approaches produce the best retrieval results — not assume that good writing automatically produces good vectors.

### The Pipeline Architecture

The ad-tech consensus and our current architecture converge on the same shape: a multi-stage funnel where each stage uses the cheapest mechanism appropriate for its resolution.

| Stage | Ad-Tech | Evryn (Current Plan) | Evryn (Evolution) |
|-------|---------|---------------------|-------------------|
| **Pre-filter** | Rules, constraints | PostGIS geography, structured fields, hard constraints | Same |
| **Retrieval** | Two-tower ANN | Vector similarity on intent-curated embeddings | Learned domain-specific embeddings + multi-interest vectors |
| **Triage** | Lightweight ranker | *Not yet designed* | Local open-source model with show-your-work reasoning |
| **Ranking/evaluation** | Deep model (CTR prediction) | Opus analytical evaluation | Opus analytical evaluation (always) |

The **triage layer** is new from this session. See "Triage Layer Design" section below.

### Key References

- Google two-tower retrieval: [cloud.google.com architecture docs](https://docs.cloud.google.com/architecture/implement-two-tower-retrieval-large-scale-candidate-generation)
- YouTube deep neural networks for recommendations: Covington et al., 2016
- Multi-Interest Recommendation Survey: [arxiv.org/html/2506.15284v1](https://arxiv.org/html/2506.15284v1)
- User Modeling and Profiling Comprehensive Survey (2024): [arxiv.org/html/2402.09660v2](https://arxiv.org/html/2402.09660v2)
- LinkedIn embeddings for job matching: [LinkedIn engineering blog](https://www.linkedin.com/blog/engineering/platform-platformization/using-embeddings-to-up-its-match-game-for-job-seekers)
- Deep Learning for CTR Prediction survey: [mdpi.com/2079-9282/14/18/3734](https://www.mdpi.com/2079-9282/14/18/3734)
- Contextual User Profiles: [researchgate.net/publication/254200939](https://www.researchgate.net/publication/254200939_Inferring_Contextual_User_Profiles_--_Improving_Recommender_Performance)

---

## Lens 2: Search-and-Matching Economics (Stub)

**What it is:** A branch of economics (Diamond, Mortensen, Pissarides — Nobel 2010) that models how agents with incomplete information find each other in markets where both sides are choosy.

**Why it matters for Evryn:** Our matching pipeline is essentially a friction-minimization architecture. Each stage — structured filters, vector search, triage, Opus evaluation — represents a different *cost of search*. This literature has formal models for how to optimally allocate search effort across stages. It also addresses the question of when to *stop* searching — when is the current best match good enough?

**What to study:** Optimal stopping theory, search cost allocation, bilateral matching with frictions. These could formalize our intuitions about pipeline stage design.

**Status:** Needs its own deep dive.

---

## Lens 3: Stable Matching Theory (Stub)

**What it is:** Gale-Shapley deferred acceptance, Roth's market design work (Nobel 2012). How to produce stable matches in bilateral markets where both sides have preferences.

**Why it matters for Evryn:** Our matching is bilateral — A's profile against B's intent *and* B's profile against A's intent. This literature has thought hard about the difference between maximizing individual match quality and maximizing *system-level* match quality. The best match for person A might not produce the best overall allocation across the user base. We need to decide whether Evryn optimizes locally (best match for this person now) or globally (best allocation across everyone).

**What to study:** Stability vs. optimality tradeoffs, deferred acceptance mechanics, whether Evryn's sequential matching (one at a time, not batch) changes the dynamics.

**Status:** Needs its own deep dive.

---

## Lens 4: Collaborative Filtering and Recommendation Systems (Stub)

**What it is:** "People like you liked this." Netflix, Spotify, Amazon — predicting individual preferences from population patterns.

**Why it matters for Evryn:** Provides techniques for cold-start problems (new users with no history) and sparse matrices (most people haven't been matched with most other people). Also relevant to the population/cluster/individual tuning question — how much can aggregate patterns predict individual match quality?

**Key difference from standard recommender systems:** Our "items" are other people who are also being matched, who also have preferences, and who change over time. Standard collaborative filtering assumes items are fixed.

**Status:** Needs its own deep dive.

---

## Lens 5: Social Network Analysis and Community Detection (Stub)

**What it is:** Graph theory applied to human relationships. Cluster formation, structural holes, bridging ties.

**Why it matters for Evryn:** Burt's work on structural holes shows that the most valuable connections are often *between* clusters, not within them. That's literally what Evryn does with cross-domain matching. Network science has formal models for identifying bridging opportunities and predicting which cross-cluster connections would be valuable.

**What to study:** Structural hole theory, weak ties (Granovetter), community detection algorithms, how graph structure predicts connection value.

**Status:** Needs its own deep dive.

---

## Lens 6: Clinical Psychology and Therapeutic Matching (Stub)

**What it is:** Research on therapist-client matching and therapeutic alliance.

**Why it matters for Evryn:** This is the closest analog to what we're matching — deep personal compatibility, not surface preferences. The literature shows that therapeutic alliance is the single strongest predictor of outcomes, stronger than technique or modality. And the research on what predicts good alliance — not personality similarity, but complementarity of communication styles and compatible attachment patterns — could directly inform what signals Opus should prioritize when writing match profiles.

**What to study:** Alliance predictors, complementarity vs. similarity, attachment-style compatibility, what makes some matches work despite surface-level mismatch.

**Status:** Needs its own deep dive. This one may be especially valuable for the profile-writing schema experiments.

---

## Lens 7: Information Retrieval (Stub)

**What it is:** The discipline of representing documents and queries so that the right results are findable. BM25, TF-IDF, learning-to-rank, query expansion.

**Why it matters for Evryn:** A user's *intent* is a query. A candidate's *profile* is a document. Matching is retrieval. The IR literature has spent decades on representing complex, multifaceted documents in ways that respond well to diverse queries. The sub-profile / multi-interest problem maps directly to query expansion and document representation problems in IR.

**What to study:** Multi-aspect document representation, query-dependent document scoring, how modern neural IR (ColBERT, dense retrieval) handles the same diffuseness problem.

**Status:** Needs its own deep dive.

---

## Lens 8: Mechanism Design and Market Design (Stub)

**What it is:** Designing the rules of the game so that self-interested behavior produces good outcomes. Auction theory, incentive compatibility, truthful reporting.

**Why it matters for Evryn:** Evryn's matching quality depends on users being honest. The system needs to be designed so that honesty is the optimal strategy. The ad-tech systems have this problem too (advertisers misrepresenting bids), but ours is more subtle — users misrepresenting *themselves*. Mechanism design has formal tools for analyzing when truth-telling is incentive-compatible.

**Status:** Needs its own deep dive. Connects to trust-and-safety architecture.

---

## Lens 9: Evolutionary Biology and Signaling Theory (Stub)

**What it is:** Mate selection, Zahavi's handicap principle, assortative mating, honest signaling.

**Why it matters for Evryn:** There's deep research on how organisms solve the problem of finding compatible mates under uncertainty with costly search. The signaling literature is particularly relevant: how do you design a system where the signals people send are *costly enough to fake* that they're reliable? Evryn's trust architecture is essentially an honest-signaling mechanism. Behavioral trust (how you actually show up) is a costly signal; self-reported trust (what you claim about yourself) is cheap and unreliable.

**Status:** Needs its own deep dive. May connect more to trust-and-safety than to matching mechanics directly.

---

## Lens 10: Human Judgment and Decision-Making (Stub)

**What it is:** Kahneman, Gigerenzer, heuristics and biases. How judgment under uncertainty actually works.

**Why it matters for Evryn:** Evryn's analytical layer *is* judgment under uncertainty. She's subject to the same cognitive patterns — anchoring, availability bias, representativeness. Understanding these helps us design feedback loops that actually correct for systematic biases rather than reinforcing them. Also relevant to calibrating Evryn's confidence — when should she trust her judgment, and when should she flag uncertainty?

**Status:** Needs its own deep dive. Connects to metacognition research already in `metacognition-and-self-reflection.md`.

---

## Proposed Mechanisms (From This Session)

These emerged from the discovery conversation and haven't been built or formally designed. They represent architectural directions to validate.

### Match Profile Schema Experimentation

**The idea:** Instead of one editorial strategy for writing match profiles, develop and test multiple *schemas* — structural hypotheses about what information, organized how, produces the best retrieval results for a given intent.

**How it works:**
1. For the same user and intent, Evryn writes match profiles using 3-5 different schemas (e.g., one leads with values and communication patterns, one leads with specific experiences, one captures relational dynamics — how this person affects those around them)
2. All profiles get embedded and searched against the same candidate pool
3. Evryn evaluates what comes back — not the quality of her own writing, but the quality of the *retrieval results*. Which schema produced the highest density of genuinely promising candidates? The best top-3? The most noise? Something extraordinary that no other schema found?
4. User validation confirms or challenges Evryn's evaluation

**What we're mapping:** The relationship between editorial approach and retrieval behavior. We may find that different schemas work best for different intents, different populations, different industries. We may find that some schemas produce 90% garbage but the 10% is unreachable any other way — and then the question becomes whether cheap noise filtering makes that schema viable.

**Architecture requirement:** The embedding table must support multiple vectors per user per intent, tagged by schema strategy. This is a natural extension of the existing "multiple vectors per user, typed by purpose" design.

**When to run:** Experiments can start as soon as we have even a small pool of test profiles — potentially during v0.3 development using synthetic data.

### Triage Layer (Local Model with Reasoning)

**The idea:** Between vector search and Opus evaluation, a cheap local model (quantized Llama/Mistral variant, or a free-tier API model) reads each candidate and writes a 1-2 sentence assessment explaining *why* it thinks the match was surfaced and whether it's worth Opus's time.

**How it works:**
1. Vector search returns N candidates (potentially 50-200)
2. Local model reads each candidate's profile against the original user's profile and intent
3. For each candidate, writes a brief assessment: "Surfaced because both mentioned patience as a core value, but candidate is 22/casual dating while user is 45/life partner — unlikely fit" or "Weak geographic signal, but deeper resonance around creative collaboration — worth a look"
4. Evryn scans the full set of assessments (200 one-line reads, trivially cheap) and pulls out candidates for full evaluation
5. Evryn also reviews rejection rationales — can override the local model when it missed nuance

**Why reasoning, not just pass/fail:** The local model *will* miss nuance — that's guaranteed. But by writing its reasoning, it gives Evryn a window into what it noticed and what it might have missed. "Rejected because different cities" is a rationale Evryn can override ("that person told me last week they're thinking about relocating"). "Rejected because no obvious connection" is a rationale that might stand.

**Threshold bias:** When in doubt, push it forward. The cost of a few extra candidates reaching Opus is cheap. The cost of a missed extraordinary match is expensive.

**v0.2 applicability:** Even at v0.2 scale (Mark's inbox triage), we could experiment with a cheap model doing first-pass classification, with Opus reviewing the reasoning. This gives us a testbed for calibrating the triage pattern before matching goes live.

### Latent-Signal Probes (Cross-Domain Surprise Matching)

**The problem:** Under the current plan, Evryn writes match profiles only for *declared* intents. But the serendipitous match — "I know you came here for a job, but something you said about your last relationship made me think of someone" — has no profile to match against.

**The brute-force failure mode:** Writing full match profiles for every possible latent need a user might have is combinatorially expensive and produces enormous noise.

**The proposed mechanism:**
1. When Opus writes match profiles for declared intents, she *also* identifies latent signals — things the user hasn't asked for but that Evryn's judgment suggests might be there
2. Instead of full match profiles, she writes **lightweight probes** — 2-sentence descriptions of the latent signal: "This person's relationship to solitude and creative discipline suggests they might thrive with a co-working partner who shares their rhythm"
3. Probes get embedded and searched against the same candidate pool, but with a *higher similarity threshold* — only very strong resonance passes
4. Results are flagged for Evryn's background attention, not routed through the full triage pipeline
5. If a probe returns an unusually strong candidate, Evryn investigates further

**The peripheral vision metaphor:** You're not actively looking for these matches. But when something strong enough enters the field, you notice. The mechanism is just the threshold — strong signal above the bar triggers attention.

**Connection to ad-tech multi-interest models:** As outcome data accumulates, a learned multi-interest model could eventually discover latent clusters *automatically* — "users who exhibit behavioral pattern X tend to respond well to matches of type Y, even when they didn't ask for Y." This is a pattern a trained model can learn at scale. The probes are the editorial bootstrap; the learned model is the scaled version.

---

## Open Questions (Permanently Tracked)

These are not questions waiting for answers. They're questions we need to *keep asking* as we build, measure, and learn. When we make a decision that partially answers one, the decision goes in the architecture doc or an ADR; the question stays here.

### What models for what parts of the process?

Which model tiers are appropriate for each pipeline stage — and when should those assignments change? The current plan is Opus for everything in v0.2 (ADR-020). But as the pipeline grows stages (triage, probe matching, profile writing, finalist evaluation), each stage needs its own model assessment. Open-source local models are improving rapidly; a triage layer that needs Llama-70B today might work with Llama-8B in six months. This question should be revisited with every significant model release.

### Can aggregate data train embeddings on what *this person* wants?

Population-level patterns probably exist in what makes connections work — complementary communication styles, compatible attachment patterns, shared value hierarchies. A trained model could learn these. But the *magic* matches — the ones where Evryn sees something nobody else would — might be fundamentally individual, not population-level patterns. They might be *judgments*, not learnable statistical regularities.

The practical framing: at each layer (population, cluster, individual), what can a trained model learn, and what still requires conscious evaluation? We should instrument from day one to track this:
- For each match that succeeds, was it one the learned model would have surfaced on its own, or did it require Opus's editorial judgment?
- If the ratio shifts over time, the patterns are more learnable than expected
- If it stays stable, narrative judgment is irreducible at some level

### How do we measure whether the embedding captured the judgment?

When Opus writes something meaningful about a user and it gets embedded, does the vector space actually represent that meaning in a way that produces the right retrieval results? This is the translation chain problem. We need empirical validation, not assumptions. The schema experimentation framework is our primary tool for this.

### Local vs. global optimization

Does Evryn optimize for the best match for *this person right now*, or for the best allocation of matches across the entire user base? These can conflict. The stable matching literature (Lens 3) has formal models for this. We need to decide — or decide that Evryn does both, in different contexts.

### Where does the editorial/computational boundary stabilize?

As the system matures, will the learned model capture most of what used to require editorial judgment — leaving Opus only for the tail of truly novel matches? Or is there a persistent, significant layer that always requires narrative intelligence? The answer determines long-term cost structure and architecture.

---
