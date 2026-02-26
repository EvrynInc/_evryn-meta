# Technical Vision

> **How to use this file:** The widest lens on Evryn's technical architecture — the north star that shapes every build decision. Covers three domains of intelligence, matching design, data pipelines, privacy architecture, and learning systems. Also includes the system landscape diagram for visual orientation. Zooms out to where Evryn is heading long-term; anchors down into `evryn-backend/docs/ARCHITECTURE.md` (product architecture, v0.2–v1.0) where the build gets specific. Read this when thinking about future capabilities, scalability, or architectural direction.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## System Landscape

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EVRYN SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐                         ┌─────────────────┐       │
│   │  EVRYN WEBSITE  │                         │    SUPABASE     │       │
│   │  (evryn.ai)     │                         │    DATABASE     │       │
│   │                 │                         │                 │       │
│   │  • Landing page │                         │  Two projects:  │       │
│   │  • Waitlist     │                         │  Agent dashboard│       │
│   │                 │                         │  + Evryn product│       │
│   │  Repo: evryn-   │                         │                 │       │
│   │  website        │                         │                 │       │
│   │                 │                         │                 │       │
│   │  Tech: Next.js  │                         │                 │       │
│   │  Host: Vercel   │                         └────────┬────────┘       │
│   └─────────────────┘                                  │                │
│                                                        │                │
│   ┌─────────────────────────────────────────┐          │                │
│   │          EVRYN BACKEND                  │          │                │
│   │          (built by Claude Code)         │◄─────────┘                │
│   │                                         │                           │
│   │  Conversational Core:                   │     ┌─────────────────┐   │
│   │  • Onboarding & intake                  │     │   ANTHROPIC     │   │
│   │  • Intent collection                    │     │   (Claude API)  │   │
│   │  • Check-ins & relationship warmth      │◄────│                 │   │
│   │  • Matching                             │     │  AI brain for   │   │
│   │  • Post-match follow-up & learning      │     │  all agents     │   │
│   │                                         │     └─────────────────┘   │
│   │  Supporting Modules:                    │                           │
│   │  • Email intake & routing               │     ┌─────────────────┐   │
│   │  • Safety/voice (publisher agent)       │◄────│  GOOGLE CLOUD   │   │
│   │  • Deception detection                  │     │                 │   │
│   │                                         │     │  • Gmail API    │   │
│   │  Admin:                                 │     │  • Pub/Sub      │   │
│   │  • Dashboard & monitoring               │     │                 │   │
│   │                                         │     └─────────────────┘   │
│   │  Host: Railway                          │                           │
│   └─────────────────────────────────────────┘                           │
│                                                                         │
│   ┌─────────────────┐     ┌─────────────────┐                           │
│   │    HUBSPOT      │     │     iDENFY      │                           │
│   │                 │     │                 │                           │
│   │  • Waitlist     │     │  • ID verify    │                           │
│   │  • Email mktg   │     │  • Trust layer  │                           │
│   │                 │     │                 │                           │
│   └─────────────────┘     └─────────────────┘                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Where we are now:** v0.2 "Gatekeeper's Inbox" — email-based, single agent, single gatekeeper. Everything below is the architecture Evryn is growing into. Current build details: `evryn-backend/docs/ARCHITECTURE.md`. Build phases: `evryn-backend/docs/BUILD-EVRYN-MVP.md`.

### Member Interface (Future)

Web/mobile interface — PWA, mobile-responsive from day one. Native apps deferred until user demand warrants it. Includes identity verification flow.

**Conversational rendering:** Messages are streamed in bursts and rendered incrementally — if a user interrupts, ongoing rendering halts gracefully, and the system tracks partial threads for later recovery. This supports the UX principle that talking to Evryn should feel like texting with a real person (see [user-experience spoke](user-experience.md), Interface Philosophy).

---

## What the System Must Deliver

**Five imperatives** — what the system must deliver to make the relationship feel genuine, safe, and worth returning to:

1. **Trusted Intelligence** — understand users quickly, speak with emotional precision, protect privacy by design. Interpret nuance, honor consent, align guidance with user values.
2. **Attuned Presence** — feel *with* the user. Track their journey, remember what matters, know when to engage or hold space. Not always active, but always aware.
3. **Resonant Matching** — introduce people who feel uniquely right and worth paying for. Deep understanding, real constraint handling, judgment calls that earn belief.
4. **Continuous Learning** — improve with every conversation, every match, every outcome. The model of each user should get sharper over time.
5. **Structural Safety** — protect users from harm, deception, and noise. Filter out what doesn't belong. Maintain a space where trust compounds.

**Five critical conditions** — structural requirements that, if missed, break the system:

1. **Ecosystem-level network density** — minimum viable density within key interaction zones (e.g., particular clusters within LA film). Sparse networks = failed matches = belief collapse.
2. **High-fidelity user understanding** — deep conversational intake, behavioral signal extraction, and emotional calibration from day one. Evryn can't match well if users aren't richly profiled.
3. **Real-time memory + consent-aware logic** — remember what matters, forget what doesn't, respect privacy and consent. Without memory scaffolding, Evryn becomes generic. Without consent scaffolding, she becomes unsafe.
4. **Trust graph integrity** — trust signals must be consistent, protected, and impossible to bypass. If bad actors can reset or manipulate identity, the entire safety layer collapses.
5. **System stability under load** — when users hit their first "magic moment," they're most likely to share. Infrastructure, queueing, and load management must be rock-solid during spikes.

If these five conditions hold, everything else can iterate. If they don't, no amount of charm or polish will save it.

*These imperatives and conditions also appear at build altitude in `evryn-backend/docs/ARCHITECTURE.md`, where they inform specific v0.2 design decisions. For how they manifest in user-facing experience, see the [user-experience spoke](user-experience.md).*

---

## Three Domains of Intelligence

Evryn's intelligence covers three interlocking domains. These are not agents or modules — they're categories of capability that Evryn must deliver. How they're implemented varies by stage: for MVP (v0.2), a single agent handles all three. As complexity grows, these domains separate into independent modules — some may be subagents, some deterministic processes, some separate runtimes. The separation is driven by what each domain needs, not by a predetermined architecture.

### Conversation & Voice

Evryn's voice. Listens deeply, speaks wisely, adapts to each user's energy and emotional state. Handles all real-time conversation, tone detection, emotional arcs, and personality alignment.

### Judgment & Matching

Evryn's judgment. Builds multidimensional understanding of each user, handles constraint filtering, soft compatibility scoring, and dynamic readiness. Never surfaces someone who hasn't been explicitly invited.

### Intuition & Care

Watches over time. Notices if you've gone quiet after a hard moment. Remembers open arcs. Decides when to reach out or hold space. Doesn't generate dialogue or matches — tells the other domains *when* they should act.

- **What it covers:** curiosity prompts, warm check-ins, pacing, after-care, moment readiness, proactive outreach scheduling
- **What it does NOT do:** pick people to introduce, reveal sensitive info, pressure users, transgress message limits or quiet hours
- **When it acts:** belief moments, silence/dormancy, open arcs/contradictions, new promising leads with missing details
- **How it shows up:** short, respectful, easy to decline. One question at a time. Tone-matched to user.

Proactive outreach includes intelligent scheduling: context-aware triggers, per-user frequency caps, quiet hours by locale, snooze/opt-out. Whether this is implemented as rules, LLM judgment, or a hybrid is a build decision — the principle is that Evryn reaches out when the moment is right and stays quiet when it isn't.

### The Loop

These three domains run in constant conversation: intuition might tell judgment to pause; judgment might ask conversation to gently explore a blind spot; conversation might flag something requiring deeper reflection. The loop: Conversation reveals identity → Identity informs connection → Connection evolves care → Care drives better conversation.

### Module Separation Principles

When volume and complexity demand it, Evryn's intelligence separates into independent modules. The principles governing that separation:

- **Safety gates must have narrow context and independent judgment.** The publisher module's only job is a checklist before anything goes out (inappropriate content? user info leaks? tone check?). It deliberately does NOT carry Evryn's full conversational state — this is security by construction, not just a filter.
- **Deception detection is a separate concern from conversation.** Trust verification and behavioral analysis run independently of the dialogue.
- **Modules separate when they need different things:** different context windows, different model tiers, different schedules, or structural isolation from each other.
- **The boundary between subagent and deterministic process is a build decision, not an architectural one.** Some intelligence needs LLM judgment; some is better served by rules. This vision doc doesn't prescribe which.

Current module design for v0.2: `evryn-backend/docs/ARCHITECTURE.md` (Agent Architecture). Earlier module architecture thinking from the n8n prototype era: `docs/research/2025-12-01-n8n-module-architecture.md`.

---

## How Matching Works

Matching is Evryn's core act — the thing she gets paid for, the thing that builds trust. The engine must deliver four capabilities at increasing sophistication:

**Hard constraints come first.** Geography, age, intent mismatch, ethical guardrails (no minors with adults). These are gates, not scores — they filter before intelligence runs. Hard stops *unless flagged otherwise*: a user who says "only Seattle" but mentions dreaming of SF might be prompted to reconsider for an exceptional match.

**Then multi-dimensional fit.** Users are represented as adaptive multi-dimensional embeddings capturing tone, values, behavior, and connection goals. Matching is based on *fit*, not similarity — how well two people's vectors balance or activate each other. Critically, Evryn matches *profiles to intents*, not people to people. Person A's profile might score against B's need for a cofounder, C's need for a math tutor, and D's need for a creative collaborator — simultaneously, across completely different dimensions. The bidirectional shape: does A's profile fit B's intent *and* does B's profile fit A's intent? This is fundamentally different from holistic person-to-person matching.

**Then narrative judgment on top.** Evryn doesn't just score — she explains *why* someone matters. Not "87% match" but the story of the match. When judgment catches something the scoring misses — or raises a flag the numbers don't — judgment overrides. May surface candidates with little overlap on paper but high complementarity.

**Then learning from outcomes.** Every match attempt (successful or not) is training signal. Initially, Evryn observes outcomes without automatically adjusting — the team makes the calls. Over time, as calibration patterns stabilize, she takes on more of this autonomously within bounded parameters.

**Day-one reality:** The scoring layer has no data and the learning layer has no outcomes. Evryn starts with judgment alone — reasoning about who matters to whom and why. Even pure judgment produces meaningful introductions in a dense ecosystem. Computational layers develop as data accumulates.

*Implementation detail: `evryn-backend/docs/ARCHITECTURE.md` (Judgment & Matching, Embedding Strategy, Matching Calibration).*

### Asymmetric Starts, Symmetric Resolution

Traditional platforms optimize for superficial compatibility. Evryn's model recognizes that sometimes people grow, adapt, and surprise each other — especially when deep resonance and the conditions for trust and curiosity are right. She scouts for resonance ("does this person call out something real in you?") and maps growth vectors ("is this someone who helps you become who you truly want to become?"). She doesn't help you "settle" — she helps you more deeply understand what you want and need.

### Cross-Domain Matching Intelligence

Evryn maintains a holistic understanding of each user, but matching happens through intent-specific projections. For a romantic match, for example, professional credentials are mostly de-emphasized — but not excluded, because for just the right person, a shared niche skill or unexpected interest might be the connection point. The system constructs sub-profiles tuned to each intent: what to emphasize, what to de-emphasize, what to surface only when confidence is high.

When matching runs, each intent searches across the full profile pool — both focused sub-profiles (tuned for targeted matching) and raw holistic profiles (the full person). Every intent scores against both. The sub-profiles increase the hit rate for high-confidence, on-target matches. The holistic profiles surface unexpected candidates — people whose full picture resonates with the intent in ways a focused sub-profile would never capture. The analytical layer then sorts what comes back: some unexpected results are clearly noise (a surface-level numerical catch, but the real fit isn't there), while others are genuine discoveries — resonance that neither person would have thought to look for, but that Evryn can see because she holds the whole picture.

Four design principles govern this — what we call **coherence-calibrated modularity** (cross-domain intelligence without fracturing the user's experience of Evryn or obscuring the rationale behind her recommendations):

1. **Model clarity** — matching logic stays focused and legible per domain
2. **Data hygiene** — signals don't bleed across domains without a compelling reason
3. **Cognitive coherence** — Evryn's reasoning stays consistent even navigating overlapping needs
4. **User control** — she flags when she's making a cross-domain leap

### Dynamic Weight Adjustment

Parts of the matching model can be fine-tuned based on emerging behavioral trends — if a shift in user behavior is detected, match scoring adjusts to reflect it. These adjustments are:
- **Right-scaled** — scoped to an individual, a cluster, or the whole model, depending on what the signal warrants
- **Reversible**
- **Personalized**
- **Bounded by safety constraints**

Initially, weight adjustments are human-reviewed and human-applied — the system surfaces the data, the team makes the call. As confidence in the calibration patterns grows, Evryn may take on more of this autonomously within bounded parameters.

---

## Data & Knowledge Layers

Six conceptual data stores:

1. **Evryn Self-Knowledge** — personality, ethos, SOPs, company knowledge
2. **Global Connection Intelligence** — learned patterns of what makes good matches, relationship archetypes, complementarity patterns. This is accumulated matching wisdom, not a map of specific people.
3. **World/Domain Knowledge** — industry expertise, domain context. Initially via web search tools; grows into a curated knowledge base over time.
4. **User Data** — account details, verification, dynamic profiles built through conversation over time
5. **Relationship Graph** — known relationships between specific people (declared and inferred). Used for redundancy filtering, safety, trust calibration.
6. **Trust Graph** — verification status, reputation data, behavioral signals

**Critical separation:** User data and conversation logs are separated from the Trust Graph and Global Connection Intelligence by design. Users may delete their personal data, but not Evryn's system-level learnings.

*Schema mappings: `evryn-backend/docs/ARCHITECTURE.md` (Data Model).*

### How User Understanding Builds

Evryn builds understanding through conversation, not forms. The principles:

- **Narrative, not extraction.** Understanding is synthesized into a living story of who someone is — not a list of extracted snippets or survey answers.
- **Compression over accumulation.** Conversations produce observations; observations compress into understanding; once understanding stabilizes, raw material can be released. The story is what carries forward.
- **Contextual scoping.** What matters for a romantic match is different from what matters for a professional one. Understanding is tagged by domain so Evryn weights signals appropriately.
- **Provenance preserved.** Notes from others (an operator's intro, a friend's vouch) stay distinct from Evryn's own synthesized understanding. She reads them, but they don't silently merge.

### Training Data Pipeline

User profile snapshots, behavior metadata, and match outcomes are periodically aggregated into training datasets for model tuning. These are fully anonymized (randomized IDs, no raw PII) before use. This allows Evryn to learn from user behavior while protecting user identity — even during AI evolution.

---

## Privacy & Security Architecture

**Zero trust, least privilege.** Every service assumes others could be compromised. The matchmaking engine sees "age 30-35, outdoorsy = high" but never email or name. Secrets in secured vaults. IAM roles per microservice.

**Encryption:** All data encrypted in transit (TLS 1.2+) and at rest (AES-256+). Emails/names field-encrypted with KMS-managed keys.

**Third-party AI risk:** All outbound prompts to external LLMs are scrubbed — PII tokenized, context trimmed, logging disabled on API side. External AIs are stateless text generators, never system-of-record.

**Current reality:** PII anonymization is NOT yet implemented. Today, full user data (including names, email addresses, message content) goes to Anthropic's API without tokenization. Implementing the tokenization layer is a near-term architectural priority. We are also pursuing Anthropic's Zero Data Retention (ZDR) arrangement — data processed in real-time and immediately discarded. Target state: anonymized data in, zero retention on the other end. See `evryn-backend/docs/ARCHITECTURE.md` for current-state security.

**Data minimization:** Only store what's necessary, only as long as needed. Verification artifacts (ID photos) discarded after confirmation. Users can request deletion, export, or corrections at any time.

**No dark surveillance infrastructure.** Analytics are in-house, product-focused only. The sole purpose of any analytics is to create more value for users. Two constrained exceptions exist within this philosophy:

1. **Consent-based growth support:** If a visitor doesn't complete onboarding, a limited-scope retargeting cookie on the marketing site may invite them back. Isolated to the marketing funnel, never tied to deeper user data.
2. **User-approved contextual assistance (future):** Users may explicitly opt in to let Evryn observe external digital behavior (browser, calendar, social app usage) to deepen support. Transparent, revocable, designed solely for user benefit.

Even where tracking is used: Evryn-controlled, user-consented, purpose-limited.

**Sensitive data ethics:** Health, trauma, identity info used only when it helps the user and only in ways they understand.

**Information firewalling (architectural principle):** Sensitive data processing happens in pipelines that are structurally separate from the front-facing conversational agent. The conversational Evryn receives only sanitized outputs — she literally never has access to certain raw data. This is security by construction, not by instruction. Even under prompt injection or confusion, she can't leak what she never had.

### Security Monitoring

- API rate limiting and anomaly detection
- Admin access audit logs
- Penetration testing and dependency scanning
- Role-based access for internal tools

### Incident Response

Should a breach occur: isolate, diagnose, contain, notify. Encryption, segmentation, and anonymization reduce real-world exposure — but any incident triggers user notification and resolution workflows. Trust demands it.

### Compliance Alignment

Evryn aligns with GDPR, CCPA, and similar frameworks:
- User data export, deletion, correction
- Clear terms and consent mechanisms
- Appointed DPO function

*Full legal treatment lives in `docs/legal/privacy-and-terms-questionnaire.md` (sent to Fenwick).*

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

### Simulated Data Strategy

Synthetic data plays a role at every stage, but the purpose evolves. Early on, synthetic test fixtures validate Evryn's email classification judgment — realistic scenarios covering the full spectrum from clear gold to tricky edge cases. As matching goes live (v0.3+), simulated data shifts to pre-training the matchmaking engine — fictional profiles, controlled conversations, and labeled match outcomes that provide a working baseline before real matching data exists. As real user data accumulates (under explicit consent), it progressively replaces simulation. Even early match attempts — successful or not — generate labeled datapoints for future tuning.

### Model Deployment Discipline

Every model update is treated like a code release:
- Spot-checked
- A/B tested
- Rollback-enabled

If performance degrades, revert immediately. This protects user experience while allowing rapid iteration.

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

## Resilience Design Principles

Three goals govern how Evryn handles pressure:

1. **Fail safely** — degrade thoughtfully, not abruptly
2. **Recover quickly** — restore service fast, with user-first communication
3. **Scale with integrity** — grow without degrading trust or experience

*For how Evryn communicates system strain to users, see [user-experience spoke](user-experience.md) (Graceful Degradation).*

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
