# Technical Vision

> **How to use this file:** Evryn's aspirational technical architecture at scale — the "CTO mental model." This is distinct from `evryn-backend/docs/ARCHITECTURE.md` (how we're building v0.2) and `SYSTEM_OVERVIEW.md` (what exists and how it's connected). This spoke carries the long-term technical thinking: three brains in detail, matchmaking engine design, data pipelines, privacy architecture, and learning systems. Read this when thinking about future capabilities, scalability, or architectural direction.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## Three Brains (Detailed)

Evryn's intelligence is conceptualized as three interlocking systems. For MVP (v0.2), all three collapse into a single agent. At scale, they separate.

### 1. Dialogue Brain (Conversational AI)

Evryn's voice. Listens deeply, speaks wisely, adapts to each user's energy and emotional state. Handles all real-time conversation, tone detection, emotional arcs, and personality alignment.

### 2. Connection Brain (Matchmaking AI)

Evryn's judgment. Builds multidimensional understanding of each user, handles constraint filtering, soft compatibility scoring, and dynamic readiness. Never surfaces someone who hasn't been explicitly invited.

### 3. Care Brain (Relational Intelligence)

Evryn's intuition. Watches over time. Notices if you've gone quiet after a hard moment. Remembers open arcs. Decides when to reach out or hold space. Doesn't generate dialogue or matches — tells the other brains *when* they should act.

- **What it handles:** curiosity prompts, warm check-ins, pacing, after-care, moment readiness
- **What it does NOT:** pick people to introduce (Connection Brain), reveal sensitive info, pressure users, transgress message limits/quiet hours
- **When it acts:** belief moments, silence/dormancy, open arcs/contradictions, new promising leads with missing details
- **How it shows up:** short, respectful, easy to decline. One question at a time. Tone-matched to user.
- **KPIs:** healthy reply rates, very few opt-outs after first prompt, most intros get a brief debrief

### The Loop

These three run in constant conversation: Care Brain might tell Connection Brain to pause; Connection Brain might ask Dialogue Brain to gently explore a blind spot; Dialogue Brain might flag something requiring deeper reflection. The loop: Conversation reveals identity → Identity informs connection → Connection evolves care → Care drives better conversation.

### Check-in Orchestrator

Rules-based check-in coordination that integrates with Care Brain:
- **Triggers:** context-aware, time-based, event-based (match pending, refund, silence), belief moment tags
- **Controls:** per-user frequency caps, quiet hours by locale, global throttle, snooze/opt-out
- **Content:** short templates with variables, routed through Care Brain for Evryn's voice

### Agent Council (At Scale)

When volume demands it, the three brains separate into specialized subagents plus:
- **Publisher** — safety gate. Only job: checklist before anything goes out (inappropriate content? user info leaks? tone check?). Deliberately narrow context — doesn't carry Evryn's full conversational state. This is a subagent, not a skill — it needs independent judgment.
- **Deception detection** — trust verification, behavioral analysis

---

## Matchmaking Engine (RBM + HLM + AIM)

Three-layer hybrid matching:

### 1. Rule-Based Matching (RBM)

First-pass hard constraints: geography, age, intent mismatch, ethical guardrails (no minors with adults). Hard stops *unless flagged otherwise* — e.g., a user who says "only Seattle" but mentions dreaming of SF might be prompted to reconsider for an exceptional match.

### 2. Heuristic Layer Matching (HLM)

Lightweight AI scoring on soft signals: personality fit, conversational tone, values alignment, communication energy, inferred intent. Uses user embeddings (complementarity vectors) to calculate resonance. Includes narrative framing: "why this person" — not just scoring, but the story of the match. May surface candidates with little overlap on paper but high complementarity.

### 3. Adaptive Intelligence Matching (AIM)

Learns over time from match outcomes, feedback, and behavioral patterns. Initially observes without controlling output (human-reviewed). Over time becomes a tuning layer that adjusts HLM weighting based on what actually works.

**Day-one reality:** AIM has no data, HLM is still calibrating. Evryn starts with RBM alone, learning by doing. Even basic constraint matching produces meaningful introductions in a dense ecosystem.

### Complementarity Vectors

Users are represented as adaptive multi-dimensional embeddings that capture tone, values, behavior, and connection goals. Matching is based on *fit*, not similarity — how well two people's vectors balance or activate each other.

### Asymmetric Starts, Symmetric Resolution

Traditional platforms optimize for superficial compatibility. Evryn's model recognizes that sometimes people grow, adapt, and surprise each other — especially when deep resonance and the conditions for trust and curiosity are right. She scouts for resonance ("does this person call out something real in you?") and maps growth vectors ("is this someone who helps you become who you truly want to become?"). She doesn't help you "settle" — she helps you more deeply understand what you want and need.

---

## Data & Knowledge Layers

Six conceptual data stores (mapping to actual Supabase tables noted):

1. **Evryn Self-Knowledge** — personality, ethos, SOPs, company knowledge → `evryn_knowledge` table
2. **Human Connection Knowledge Graph** — learned patterns of what makes good matches, relationship archetypes, complementarity patterns → future, not MVP
3. **World/Domain Knowledge** — industry expertise, domain context → initially via web search tools, later `evryn_knowledge`
4. **User Data Store** — account details, verification, dynamic profiles built over time → `users` table (`profile_jsonb`)
5. **Social Graph Layer** — known relationships (declared and inferred) for redundancy filtering, safety, trust calibration → future, not MVP
6. **Trust Graph** — verification status, reputation data, behavioral signals → future, incorporated into `users.profile_jsonb` for MVP

**Critical separation:** User Data and Conversation Logs are separated from the Trust Graph and Insight Store by design. Users may delete their personal data, but not Evryn's system-level learnings.

### User Data Pipeline

- **Dynamic profiles** — not front-end profiles. Back-end living structures enriched via conversation: basic attributes, stated preferences, extracted traits from behavior/tone, complementarity vectors
- **Memory distillation** — conversations are logged, then important insights (traits, goals, patterns) are extracted into structured fields. Raw transcripts are encrypted and archived for re-contextualization, then discarded once understanding stabilizes
- **Events** — mode changes, introductions, match feedback, reports logged as discrete events tied to pseudonymous IDs
- **Contextual tagging** — data tagged by connection type (professional, romantic, social) so Evryn weights traits appropriately per context

---

## Privacy & Security Architecture

**Zero trust, least privilege.** Every service assumes others could be compromised. The matchmaking engine sees "age 30-35, outdoorsy = high" but never email or name. Secrets in secured vaults. IAM roles per microservice.

**Encryption:** All data encrypted in transit (TLS 1.2+) and at rest (AES-256+). Emails/names field-encrypted with KMS-managed keys.

**Third-party AI risk:** All outbound prompts to external LLMs are scrubbed — PII tokenized, context trimmed, logging disabled on API side. External AIs are stateless text generators, never system-of-record.

**Current reality:** PII anonymization is NOT yet implemented. Today, full user data (including names, email addresses, message content) goes to Anthropic's API without tokenization. Implementing the tokenization layer is a near-term architectural priority. We are also pursuing Anthropic's Zero Data Retention (ZDR) arrangement — data processed in real-time and immediately discarded. Target state: anonymized data in, zero retention on the other end. See `evryn-backend/docs/ARCHITECTURE.md` for current-state security.

**Data minimization:** Only store what's necessary, only as long as needed. Verification artifacts (ID photos) discarded after confirmation. Users can request deletion, export, or corrections at any time.

**No surveillance infrastructure.** No ad tech, no third-party tracking, no behavioral retargeting, no silent collection. Analytics are in-house, product-focused only.

**Sensitive data ethics:** Health, trauma, identity info used only when it helps the user and only in ways they understand.

**Information firewalling (architectural principle):** Sensitive data processing happens in pipelines that are structurally separate from the front-facing conversational agent. The conversational Evryn receives only sanitized outputs — she literally never has access to certain raw data. This is security by construction, not by instruction. Even under prompt injection or confusion, she can't leak what she never had.

---

## How Evryn Learns

*Note: The Master Plan was written assuming GPT-4/OpenAI. The actual build uses Claude (Anthropic). The learning concepts still apply — the vendor-specific details don't.*

### Disciplined AI Stack

The LLM is wrapped in a disciplined stack, not used as a monolith:
- **System prompt** — defines Evryn's personality, tone, and boundaries
- **User context memory** — feeds in traits, history, preferences
- **Output filters** — detect misalignment, tone drift, or ethical edge cases

### Dual-Mode Learning

**Real-time adaptation (inference layer):** As users speak, Evryn infers traits, intentions, tone shifts, and unmet needs. These become metadata tagged to the user profile and matchmaking graph. No explicit feedback needed — just talking teaches her.

**Batch learning (reflection layer):** At intervals, Evryn aggregates match success/failure signals, conversation tone maps, behavioral patterns (ghosting, engagement, response timing). These inform updates to matchmaking logic, conversation strategies, and timing calibration. This is what makes her feel both deeply present and quietly evolving.

### Privacy Gateway (Target State)

A dedicated prompt optimization and privacy firewall sits between users and the LLM:
- Strips or replaces PII before it hits the API
- Summarizes long context into token-efficient memory prompts
- Compresses repetitive queries, uses lookup-based replies when appropriate
- Uses random identifiers in place of usernames or locations

Result: significant cost reduction on tokens, zero raw identity exposure to external systems, full control over how LLMs access sensitive information.

### LLM Strategy (Long-Term)

Four-phase transition path from external LLM to potentially self-hosted:
1. **External LLM for all interactions** (launch config)
2. **Shadow in-house model** (runs in background, evaluate quality)
3. **Partial routing + A/B testing** (route low-risk flows through in-house model)
4. **Full transition with fallback** (or stay hybrid if external remains better)

Every phase is reversible. Likely long-term: **hybrid model** — in-house for standard queries, premium external for sensitive moments.

### Knowledge Layer: Retrieval, Not Recall

Evryn doesn't memorize facts or improvise. When unsure, she searches over a curated internal knowledge base using **semantic search** (vector search). Content includes curated advice, verified responses, team-written guidance, and refined community-sourced wisdom.

### Epistemic Humility

When confidence is low, Evryn flags it: "I'm going out on a limb here — but I think this could be interesting. You'll tell me if I'm off."

### Exploratory Matching

When not fully confident but seeing low-risk potential, Evryn may propose tentative introductions. Curiosity as a training tool.

---

## Sovereign Memory & Cryptographic Trust (Target State)

Evryn is secure by construction, not just by policy:
- Only Evryn can remember what you've told her
- Only while you're present
- No one — not even Evryn's creators — can eavesdrop or extract it without explicit consent

### Encrypted Memory Vaults

Each user's memory vault is:
- **Encrypted end-to-end** with a key only the user controls
- **Mounted temporarily** only during live sessions
- **Unreadable by anyone** — including administrators, engineers, and even Evryn herself outside session scope

Deletion is absolute: destroy the key, and the memory is gone forever.

Evryn also keeps a **working operational memory** — distilled insights and behavioral patterns, used for daily logic and matchmaking. Full re-contextualization requires user presence and key access.

### Identity Without Exposure

Non-reversible trust fingerprints generated at time of verification. No names, emails, phone numbers, or IPs stored. Enforces bans and reputation carry-over without tracking.

### Legal Resilience

"We can't. The data exists, but it is encrypted with a key only the user holds. It is mathematically inaccessible to us."

No master key. No administrator override. No buried backdoor.

---

*Spoke created 2026-02-20 by AC. Reorganized from MPR Technical Architecture, How Evryn Learns, and Sovereign Memory sections. Current-state vs. target-state annotations added where relevant.*
