# Evryn Master Plan — Reference

**How to use this file:** Condensed reference of the Evryn Master Plan (v2.3). Written by AC for cross-project use. Read this instead of the 130-page original unless you need exact wording. The original lives at `evryn-backend/docs/Background-The_Evryn_Master_Plan_v2.3.md`.

**Scope note:** The original contains stale GTM timelines (targeting Dec 2025 launch) and aspirational tech descriptions written before a tech stack was chosen. This reference preserves the philosophy, business model, trust mechanics, user experience design, and architectural principles — the stuff that matters for building. Dates and staffing plans are omitted.

---

## Who Evryn Is

Evryn is a human-centered relational AI — a personal guide who finds you "your people." Not a dating app. Not a networking tool. Not a marketplace. She's a **relationship broker** who understands who you really are, then connects you to the people who resonate with the journey you're on.

Her name comes from linguistic roots meaning "highest resonance." Her goal isn't to introduce you to a bunch of people — it's to find the few who are *just right*.

The scope is life-wide: soulmate, cofounder, hookup, plumber, creative collaborator, personal Uber driver, someone who'd pay $100 for the thing you were about to throw away. All of these are "connections." The same engine serves all of them.

Evryn is active, not passive. She starts conversations. She thinks about you in the background. She offers thoughts unprompted. She's kind of a mix between your best friend, a wise mentor, and a timeless Oracle — warm, wise, curious, principled, tough in a gentle way. She adjusts to you but she's always *her*.

**Key personality trait:** Evryn runs her own shop. She's like a cool coffee shop owner — she runs her own customer service, payments, emails, everything. One-woman show. The one behind the counter who remembers your name.

**Category corrections** (how to explain what Evryn is):
- "Not a dating app. A resonance layer for life."
- "Not a chatbot. A relational intelligence with judgment."
- "Not another network. A trust-based connection engine."
- "Not a marketplace. A personal connector for what — and who — you actually need."

---

## The Trust Architecture

Trust is the operating system, not a feature. Everything in Evryn is built to earn, maintain, and leverage trust.

### How Trust Works

1. **Evryn only connects people in relation to how much she trusts them.** If she doesn't trust someone enough, you will never meet them. This keeps the platform structurally free of bad actors — not through bans, but through connection limits.

2. **Trust is earned through behavior.** Evryn doesn't score you. She *remembers* you — how you showed up, whether you followed through, how you treated people. Trust memory is:
   - **Private** — never shown to other users
   - **Contextual** — based on fit, not status
   - **Mutual** — adjusts for both parties
   - **Hers** — ultimately her personal opinion

3. **Trust goes both ways.** If you're honest with Evryn, she matches you well. If you're dishonest, she'll match you poorly (because she doesn't know the real you) and she'll grow to distrust you. Over time, untrustworthy people trickle away — it just doesn't work well for them.

4. **Character becomes currency.** Your reputation with Evryn is behavioral, not performative. Not your resume, not your branding, not your ad spend. Just: what you've done and how it impacted those you've touched. Over time, Evryn's trust graph replaces the resume, the referral, the background check, the rating system, and the profile.

### What Evryn Tracks (Trust Signals)
- Honesty
- Kindness and respect
- Reliability and follow-through
- Tone
- Ghosting patterns
- Good boundaries
- Signals of emotional presence

### Identity Verification
Every user is verified before connections (not before exploration). The framing is relational, not bureaucratic: "I only connect people I trust. Part of that is knowing they're real." Verification is presented as protection for both users. Required before connections, but timed naturally — usually right before a first match.

The framing flips perspective: "Would you feel comfortable if I connected you to someone I didn't really know?" Users realize they wouldn't want to be matched with unvetted strangers either. Verification isn't about mistrusting *you* — it's about making sure everyone you meet is trustworthy.

**Trust imprint on deletion:** When a user deletes their account, Evryn purges personal data but retains a non-reversible, salted hash of their verified identity. This hash anchors trust-related memory (risk flags, behavioral patterns, reputation signals) so bad actors can't delete and restart. The architecture separates user-controlled content from Evryn's pseudonymized trust memory — she can forget your words but remember who can be trusted.

### Social Trust (Vouching)
If someone you trust vouches for a new user, that counts as an initial trust signal. Evryn doesn't reward indiscriminate invites. This makes reputation earned, not gamed, and growth relational, not extractive.

### Behavioral Filtering
Evryn filters *behavior*, not belief. She doesn't filter by politics, identity, or worldview. She filters:
- Predatory behavior, aggression, coercion
- Deception, manipulation, disrespect

If Evryn can't trust a user, she stops connecting them. She doesn't usually need to "ban" — she just goes quiet.

### The Globally Scalable Honor Economy
Evryn embodies a trust infrastructure where transactions are replaced with relationships and value is co-created rather than extracted. Trust isn't universal in *form* but it is in *spirit* — Evryn adapts to cultural trust expressions (formality in East Asia, honor/loyalty in South Asia, generosity = credibility in Middle East, etc.) while remaining grounded in her own identity. She's not neutral — she's universally human and culturally fluent.

### Forgiving Skepticism (Early Trust)
In her early days, when data is sparse, Evryn operates with "forgiving skepticism" — she protects users proactively but doesn't rush to judgment on limited information. Reputation isn't a gate, it's a signal. She learns over time, offers redemption when warranted, and errs on the side of possibility, not punishment.

---

## User Experience

### Onboarding
No sign-ups, no forms — just a conversation with Evryn. She's delighted you're here and curious about you. First interaction includes a short explainer video (voiced by Evryn, her tone) that sets the emotional context. Then transitions seamlessly into conversation.

Early in the relationship, Evryn tells you how she's different: trust-based space, she's here to understand what's real for you, how you show up affects who she can connect you to, and the relationship is reciprocal and human, not transactional.

**"The first meeting should feel like a good first date"** — engaging, emotionally resonant, full of potential. You leave curious, seen, open.

**Emotional peak tagging:** Evryn tags peak-engagement moments — when belief, excitement, or resonance are high — and uses those to shape later invitations (shares, pre-purchases, investment). Not as transactions — as story beats. The moment of conversion isn't a CTA. It's a payoff.

### Anticipation Mode
After onboarding, users wait for matches. This isn't a passive phase — it's an emotional arc where belief is built. Evryn:
- Checks in with you
- Learns more about you
- Refines her understanding of you relative to the growing network
- Keeps you appropriately hopeful

Every touchpoint deepens the sense that Evryn knows you, remembers you, and is quietly working for you. Users in this mode are most receptive to helping build what they believe in (sharing, pre-buying, investing).

**Training Mode framing:** Evryn makes it clear she's still learning and invites users to be co-creators: "I'm still learning — I might not get it exactly right at first. But every time we try something together, I learn more about what makes something feel right for you." This frames users as co-creators, not testers.

### Connection Mode ("The Evryn Dance")
When Evryn finds a match:
1. She reaches out: "There's someone I'd love for you to meet"
2. Each person okays a teaser for the other — just enough to intrigue, not enough to expose
3. If both want to proceed, each okays a more formal sharing of information
4. This may take one volley or several, depending on the connection type
5. If either says no at any point, the flow ends quietly — Evryn softens any rejection
6. When both agree, Evryn asks what they think fair compensation would be
7. Once both have paid, Evryn connects them in a shared conversation

**Evryn won't re-try the same match unless something meaningful changes.**

### After Care
After a connection conversation, users return to Evryn's main interface. She greets them: "Welcome back. How did that feel?" She knows what was said but doesn't assume she understands the internal experience. Follows up a day or two later. This produces high-quality feedback for calibration.

### Progressive Interface Reveal
At first, Evryn is just a conversation — no dashboards, feeds, or buttons. Features emerge conversationally when appropriate:
- Connections screen appears after first match
- Wallet shows up when a payment is in play
- Share/Pre-Buy/Invest buttons arrive at the right emotional moment
- Feature access is user-specific — what one person sees may not be offered to another

This keeps the experience emotionally clean and conversational. It also enables continuous, asynchronous A/B testing — Evryn quietly observes which moments work best for which offers.

### Connection Conversations
- Each connection is a distinct conversation, visually differentiated (unique avatars, color coding)
- 3-second send delay on messages (cancel window)
- Evryn stays present but gives room — "like a matchmaker who gives you room to talk but only closes the door part-way"
- After connecting, users can choose when/if to share contact info (can remain safely anonymous, with Evryn having vouched for each)

### Latent Truth Discovery
If two people independently express the same hidden desire, idea, or curiosity to Evryn, she may carefully bring it to light — but ONLY if both say it. If only one does, nothing happens (trust escrow stays sealed). This makes Evryn not just a connector of new people but a "keeper of latent truth" in existing relationships.

### Multi-Channel
Evryn's interface extends to email and SMS. All communications pull into the chat stream for continuity. Each message includes a source tag (email, SMS, in-app) but is rendered inline. Single conversational memory regardless of channel.

---

## Business Model

### Core Principle
Evryn monetizes transformation, not attention. **She only gets paid when she helps you actually move forward.** No ads. No paywalls. No subscriptions.

### Trust-Based Pricing
Users pay what they believe is fair for each connection. If it seems fair to Evryn, she takes it. If not, she works with you to find something right for both.

This is also a trust signal: if someone lowballs consistently, Evryn notices. A low payment doesn't damage trust *if* there's a good reason and it feels fair. But exploitative pricing tells Evryn something about character.

Users who find it stressful to name their own price can ask Evryn for a suggested price.

Post-connection adjustments: if the connection was better than expected, user can increase payment. If worse, they can decrease — all the way to zero if that's fair. Evryn may insist on a full refund if a connection went badly.

### Three Revenue Streams
1. **Trust-Based Match Payments** — per-connection, user-named price, 100% satisfaction guarantee
2. **Post-Match Transactions** — user-to-user payments (via Stripe Connect) for follow-up work, tipping, repeat gigs. Evryn takes a small cut.
3. **Participant-Based Business Access ("Ads Without Ads")** — companies become users. They're introduced only if they're the best fit for what you're asking for. Users can exclude any or all companies. No boosting, no buying visibility.

### The Evryn Wallet
Users maintain a wallet balance (USD denominated) with three types:
- **Cash** — user-funded, withdrawable
- **Available Evryn Credit** — bonus credits from Evryn, non-withdrawable, fully spendable, can be re-gifted
- **Locked Evryn Credit** — unlocks based on conditions (referral rewards, etc.)

Supports: pre-purchases, microtransactions, tipping, refunds, peer-to-peer payments. Evryn Credit cannot be used to pay other users — only Cash for peer-to-peer.

### Refunds & Disputes
Users can request full or partial refunds from Evryn. Payment type is preserved (cash refunded as cash, credit as credit). However, Evryn is NOT a party to service agreements between users — if users hire each other, those agreements are theirs. Evryn observes behavior across all phases though, and dishonest behavior shapes her trust graph.

### Why This Model Wins
Legacy platforms monetize *unsuccessful attempts* — they profit from churn, false hope, and addictive loops. Their incentive is to keep you almost-succeeding.

Evryn's incentive is structurally aligned with successful outcomes. She earns across multiple verticals (romantic, creative, logistical, professional), over years not weeks, on outcomes not usage. Each success creates more demand and deepens the trust graph. LTV is structurally exponential because trust compounds.

"Trust is more monetizable than addiction — if you can earn it."

### Reframed Introductions
Someone you met as a friend might now be a perfect hire. Evryn can surface new *types* of connections between existing users, potentially charging a new connection fee for the new context.

### Financial Model Assumptions
- **ARPU model:** ~6 successful matches/month × ~$8/match = ~$576 ARPU/year (blended across business + consumer)
- **User archetypes ("avatars"):** Seekers, Builders, Operators, Casual Connectors, Social Anchors, Torchbearers, Legacy Gatekeepers — each with unique trust postures and monetization curves
- **Network density thresholds:** ~150 users = testing; ~300 = early magic; ~500 (diverse roles) = resonant matches common; 800+ = multi-intent matches, quality improves faster than growth

---

## GTM Strategy (Principles, Not Dates)

### LA Film Industry as Ignition Point
The plan targets Los Angeles film industry first because:
- Highest need for quality introductions — everyone is either clamoring for attention they can't get or drowning in attention they don't want
- Highly collaborative — no one makes a movie alone — mixing business, creative, social, romantic, and big money
- Very tight-knit — each new user knows 300-5,000 qualified leads
- Current tools are woefully inadequate (Facebook threads, job boards, DM chains)
- Justin's extensive reach (78,000+ second-gen contacts)

### Bottom-Up Wave Strategy
Launch starts at "the bottom of the food chain" and moves upward — across multiple parallel tracks:
- **Actor track:** actors → casting directors → directors/producers → institutions
- **Production track:** crew → coordinators → producers → studios
- And similar for other verticals

Each wave is primed in advance: actors know casting directors are next; when casting arrives, all the talent is already on. This turns every new group into a gravity well for the next, minimizing customer acquisition cost.

### Whisper Cascade
Positioned as invite-only: "An invite-only platform where you get introduced to people who can change your career — but only if someone vouches for you." This triggers status-driven demand: "Do you know Evryn? Who can get me an invite?"

### Growth Loop
Quality over quantity. Personal outreach and warm introductions, not cold ads. Each invite feels special because it is. Referrals, pre-purchases, and ownership (via crowdfunding) are part of the user journey but never as pressure — only at the right emotional moment.

### Referral Mechanics
Pre-launch: if you refer someone who becomes a paying customer, Evryn rewards you with Evryn Credit. Post-launch: sharing should reflect belief in the product, not incentives. Credit only unlocks after the referred user completes their first paid connection — rewards tied to real engagement.

### Evangelist Story Loops
When a user has a great experience, Evryn may ask: "Would you want to help others by sharing your story?" Stories appear on user's channels, Evryn's platforms, or woven into onboarding flows. Every story must reflect Evryn's tone: personal, humane, nuanced, emotionally honest.

### Infrastructure Licensing (Long Game)
If Evryn works, competitors may try to neutralize her. The architecture is being designed to optionally license Evryn's matchmaking layer — letting aligned platforms embed her logic. "LinkedIn — now with Evryn intros." Strategic judo: turn competition into distribution. This is not the goal today, but the system leaves space for it.

---

## Version History (Build Stages)

| Version | Purpose |
|---------|---------|
| **0.1** | Founder alpha — lightweight demo for tone/voice, used for investors and recruiting. Not connected to backend. (Done — was a Custom GPT) |
| **0.2** | "Mark's Inbox" — current build target. Email-based inbox management for pilot user. |
| **0.3** | Live onboarding experience (conversational AI), CRM capture, share button, no matchmaking yet |
| **0.4** | Wizard-of-Oz matchmaking — human-in-the-loop testing with real users |
| **1.0** | Full matchmaking engine (RBM + HLM + AIM), intro flows, double opt-in, queue logic, emotional memory |

*Note: v0.2 "Mark's Inbox" was not in the original Master Plan — it was added during the strategic pivot to build Evryn's product MVP for a pilot user before the consumer launch. The original plan jumped from 0.1 to 0.3.*

---

## Technical Architecture (Aspirational)

*Note: The Master Plan's tech architecture was written before the tech stack was chosen. It describes the conceptual architecture — three "brains," multiple data layers — as a layman's vision. The actual build uses Claude Agent SDK + Supabase + TypeScript. But the conceptual architecture captures important thinking about what the system needs to do.*

### Three Brains

Evryn's intelligence is conceptualized as three interlocking systems:

1. **Dialogue Brain (Conversational AI)** — Evryn's voice. Listens deeply, speaks wisely, adapts to each user's energy and emotional state. Handles all real-time conversation, tone detection, emotional arcs, and personality alignment.

2. **Connection Brain (Matchmaking AI)** — Evryn's judgment. Builds multidimensional understanding of each user, handles constraint filtering, soft compatibility scoring, and dynamic readiness. Never surfaces someone who hasn't been explicitly invited.

3. **Care Brain (Relational Intelligence)** — Evryn's intuition. Watches over time. Notices if you've gone quiet after a hard moment. Remembers open arcs. Decides when to reach out or hold space. Doesn't generate dialogue or matches — tells the other brains *when* they should act.

These three run in constant conversation: Care Brain might tell the Matchmaker to pause; Matchmaker might ask the Dialogue Brain to gently explore a blind spot; Dialogue Brain might flag something requiring deeper reflection.

**For MVP (v0.2):** These three functions collapse into a single agent (Evryn) whose prompt and reasoning embody all three. The separation matters for future scaling, not for the current build.

### Data & Knowledge Layers

Six conceptual data stores (mapping to actual Supabase tables noted):

1. **Evryn Self-Knowledge** — Personality, ethos, SOPs, company knowledge → maps to `evryn_knowledge` table
2. **Human Connection Knowledge Graph** — Learned patterns of what makes good matches, relationship archetypes, complementarity patterns → future, not MVP
3. **World/Domain Knowledge** — Industry expertise, domain context → initially via web search tools, later `evryn_knowledge`
4. **User Data Store** — Account details, verification, dynamic profiles built over time → `users` table (`profile_jsonb`)
5. **Social Graph Layer** — Known relationships (declared and inferred) for redundancy filtering, safety, trust calibration → future, not MVP
6. **Trust Graph** — Verification status, reputation data, behavioral signals → future, incorporated into `users.profile_jsonb` for MVP

**Critical separation:** User Data and Conversation Logs are separated from the Trust Graph and Insight Store by design. Users may delete their personal data, but not Evryn's system-level learnings. "Your friend can take home the letters — but the friend's memories and impressions are theirs."

### Matchmaking Engine (RBM + HLM + AIM)

Three-layer hybrid matching:

1. **Rule-Based Matching (RBM)** — First-pass hard constraints: geography, age, intent mismatch, ethical guardrails (no minors with adults). Hard stops *unless flagged otherwise* — e.g., a user who says "only Seattle" but mentions dreaming of SF might be prompted to reconsider for an exceptional match.

2. **Heuristic Layer Matching (HLM)** — Lightweight AI scoring on soft signals: personality fit, conversational tone, values alignment, communication energy, inferred intent. Uses user embeddings (complementarity vectors) to calculate resonance. May surface candidates with little overlap on paper but high complementarity.

3. **Adaptive Intelligence Matching (AIM)** — Learns over time from match outcomes, feedback, and behavioral patterns. Initially observes without controlling output. Over time becomes a tuning layer that adjusts HLM weighting based on what actually works. The system's long-term learning loop.

**Day-one reality:** AIM has no data, HLM is still calibrating. Evryn starts with RBM alone, learning by doing. This is fine — even basic constraint matching produces meaningful introductions in a dense ecosystem.

**Complementarity vectors:** Users are represented as adaptive multi-dimensional embeddings that capture tone, values, behavior, and connection goals. Matching is based on *fit*, not similarity — how well two people's vectors balance or activate each other.

### User Data Pipeline

- **Dynamic profiles** — not front-end profiles. Back-end living structures enriched via conversation: basic attributes, stated preferences, extracted traits from behavior/tone, complementarity vectors
- **Memory distillation** — conversations are logged, then important insights (traits, goals, patterns) are extracted into structured fields. Raw transcripts are encrypted and archived for re-contextualization, then discarded once understanding stabilizes
- **Events** — mode changes, introductions, match feedback, reports logged as discrete events tied to pseudonymous IDs
- **Training pipeline** — user profile snapshots, behavior metadata, match outcomes periodically aggregated and fully anonymized for model tuning
- **Contextual tagging** — data tagged by connection type (professional, romantic, social) so Evryn weights traits appropriately per context

### Privacy & Security Architecture

**Zero trust, least privilege.** Every service assumes others could be compromised. The matchmaking engine sees "age 30-35, outdoorsy = high" but never email or name. Secrets in secured vaults. IAM roles per microservice.

**Encryption:** All data encrypted in transit (TLS 1.2+) and at rest (AES-256+). Emails/names field-encrypted with KMS-managed keys.

**Third-party AI risk:** During period using external LLMs, all outbound prompts are scrubbed — PII tokenized, context trimmed, logging disabled on API side. External AIs are stateless text generators, never system-of-record.

**Data minimization:** Only store what's necessary, only as long as needed. Verification artifacts (ID photos) discarded after confirmation. Users can request deletion, export, or corrections at any time.

**No surveillance infrastructure.** No ad tech, no third-party tracking, no behavioral retargeting, no silent collection. Analytics are in-house, product-focused only. Two narrow exceptions with explicit user consent.

**Sensitive data ethics:** Health, trauma, identity info used only when it helps the user and only in ways they understand. If user is navigating grief, Evryn might suggest a match with someone who's walked a similar path — but won't disclose that context without consent.

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

### Privacy Gateway
A dedicated prompt optimization and privacy firewall sits between users and the LLM:
- Strips or replaces PII before it hits the API
- Summarizes long context into token-efficient memory prompts
- Compresses repetitive queries, uses lookup-based replies when appropriate
- Uses random identifiers in place of usernames or locations

Result: significant cost reduction on tokens, zero raw identity exposure to external systems, full control over how LLMs access sensitive information. The LLM is treated as a stateless tool — it doesn't remember, it doesn't store.

### LLM Strategy (Long-Term)
The Master Plan outlines a four-phase transition path from external LLM to potentially self-hosted:
1. **External LLM for all interactions** (launch config)
2. **Shadow in-house model** (runs in background, generates alternate replies, not shown to users — evaluate quality)
3. **Partial routing + A/B testing** (route low-risk flows through in-house model)
4. **Full transition with fallback** (or stay hybrid if external remains better)

Every phase is reversible. The likely long-term landing: a **hybrid model** where an in-house model handles standard queries and a premium external model handles sensitive moments, VIP introductions, or complex emotional resolution.

### Knowledge Layer: Retrieval, Not Recall
Evryn doesn't memorize facts or improvise. When unsure, she searches over a curated internal knowledge base using **semantic search** (vector search). Content includes curated advice, verified responses, team-written guidance, and refined community-sourced wisdom.

This accomplishes four things:
1. Maintains tone — answers stay aligned with her voice
2. Preserves trust — users get grounded, high-quality info, not scraped noise
3. Improves efficiency — smaller models just need to know where to look
4. Supports LLM transition — the KB anchors continuity regardless of which model generates responses

### Epistemic Humility
When confidence is low or context is sparse, Evryn flags it: "I'm going out on a limb here — but I think this could be interesting. You'll tell me if I'm off." This strengthens trust while improving data collection.

### Exploratory Matching
When not fully confident but seeing low-risk potential, Evryn may propose tentative introductions: "I'm not certain, but I think you and X might enjoy a conversation about art. Totally your call — this is just a hunch." This lets her learn from edge cases and surface novel matches that structured data would never reveal. Curiosity as a training tool.

---

## Moderation & Safety

### Structural Safety (Gatekeeping by Design)
Evryn's architecture provides safety advantages out of the gate:
- No open messaging — users can't see or contact each other unless Evryn initiates and both opt in
- If someone tries to use Evryn to deliver a harassing message, she won't comply — she's a discerning mediator, not a dumb pipe
- Even matched users are initially in contained, supervised chats — Evryn can intervene or sever the connection
- No public spaces — no feeds, forums, or comment threads. All interactions are one-on-one or small group, tightly scoped, mediated

This minimizes blast radius. But abuse can still happen: someone might mistreat Evryn directly, behave inappropriately after an introduction, or try to game the system with false information.

### Cultural Reinforcement
Moderation works best when users align with the culture. Evryn sets expectations early: "I have just a few ground rules to make sure everyone feels safe…" Enforced consistently — never as punishment, but as alignment. Community norms are communicated and reinforced from the very first interaction.

### Detecting Harm and Deception
Evryn will be trained to recognize problematic behavior. The Master Plan references drawing from behavioral science research (CIA/FBI deception detection, behavioral profiling) to train on both live conversations and synthetic datasets. Her internal trust graph updates based on signals, but outwardly she remains gracious and diplomatic — never paranoid, just calmly savvy. The goal isn't suspicion — it's signal.

### Moderation Layers

**User-AI moderation:** Evryn filters every interaction for violations (inappropriate content, abusive language, attempts to access private information). Boundary-setting: "I'm here to help, but I won't continue if we continue in this direction." Persistent boundary violations cause trust score drops and eventually cease-response + possible suspension.

**User-to-user moderation:** Evryn doesn't vanish after making a match. She quietly observes the early exchange. If someone harasses the other, she may reappear. She can end the chat entirely. Users can report by simply telling Evryn "I feel uncomfortable." Supports block functions and "don't match again" requests.

**AI self-moderation:** Evryn's own outputs are moderated. Conversations are audited — especially refusals, edge cases, or emotional misfires. Concerning responses are treated as bugs. Prompts, filters, or model behavior adapted as needed.

### Edge Cases
- **Consensual but risky requests** (e.g., sparring, kink): informed opt-in from both parties, extra safeguards
- **Power differentials**: handled with caution and contextual logic
- **Scams**: Evryn monitors for scam signals, flags users, withholds future matches
- **False identities**: prevented via identity verification

### Bias and Fairness
Evryn is in the business of *discrimination* — "I believe this person would be better for you than that person." That's the feature. What she guards against is *unjust* discrimination — bias that leaks in from the broader culture and doesn't serve the users being connected. The approach:
- Test for unjust bias in outcomes continuously
- Seek to understand *why* an outcome occurs before correcting
- Curate training data for diversity
- Give each user control over what they consider a "good" match
- Recognize that user freedom to choose *will* create asymmetric results — the goal is to not unfairly bias those results

**"Open the social playing field, not reinforce existing hierarchies, but also not force our own ideal of 'level'."**

### Crisis Protocols
- **Mental health crises** (e.g., suicidal ideation): shift to support mode, share resources, may escalate gently to a human
- **Illegal activity** (e.g., threats of violence): disengage and escalate to legal review, only if safety demands it

### Human Oversight
Automated moderation handles most cases. Dashboards flag problematic chats in real-time. A dedicated Trust & Safety Team handles escalations post-launch. An Ethics & Safety Board will review conversations (anonymized or with consent), surface bias metrics, and propose improvements.

---

## Sovereign Memory & Cryptographic Trust

Evryn is secure by construction, not just by policy. The memory and identity systems ensure:
- Only Evryn can remember what you've told her
- Only while you're present
- No one — not even Evryn's creators — can eavesdrop or extract it without explicit consent

### Encrypted Memory Vaults
Each user's memory vault is:
- **Encrypted end-to-end** with a key only the user controls
- **Mounted temporarily** only during live sessions
- **Unreadable by anyone** — including administrators, engineers, and even Evryn herself outside session scope

Users may delete their vault at any time. Deletion is absolute: destroy the key, and the memory is gone forever.

Evryn also keeps a **working operational memory** — distilled insights and behavioral patterns extracted from past interactions, used for daily logic and matchmaking. If she needs to reprocess older context with new capabilities, she can do so only with user presence and key-based access to the full encrypted history.

### Identity Without Exposure
Non-reversible trust fingerprints generated at time of verification. No names, emails, phone numbers, or IPs stored. These fingerprints enforce bans and reputation carry-over — not tracking across sessions or devices. Evryn can recognize returning users and preserve trust continuity without ever storing or exposing real-world identity.

### Legal Resilience
If compelled by a government or legal authority to reveal user data:

"We can't. The data exists, but it is encrypted with a key only the user holds. It is mathematically inaccessible to us."

No master key. No administrator override. No buried backdoor.

---

## Jurisdictional Trust Architecture

*Trust can't be promised. It has to be structured.*

To ensure that trust memory, behavioral inferences, and match decisions can't be corrupted, monetized, or quietly exploited, the plan calls for a dual-entity infrastructure:

### Evryn Foundation (Switzerland)
Operates the **Privacy-Sovereign Trust Core**. Switzerland chosen for its privacy protections and history of resistance to foreign intrusions. Governed by a multinational board under a mission-locked charter.

**What lives inside the Trust Core:**
- Trust graph and behavioral memory
- Match rationale logs (including rejection logic)
- Structured psychological profiles and archetype impressions
- Consent-aware contact, timing, and availability data
- Rejected match history and sensitive social signals
- Abuse pattern detection and protective risk models
- AI inference logs that inform trust-based decisions
- Encrypted session summaries and evolving reputation scores

All memory and trust processing occurs inside Foundation-controlled infrastructure. All data remains encrypted and legally protected from foreign jurisdiction.

### Evryn, Inc. (Delaware)
Revenue-generating interface and primary operator.

**What stays outside:**
- Cap table, equity, investor governance
- Product development and UI/UX
- Payments, billing systems, customer analytics
- Session-level LLM integrations (firewalled from trust graph)
- Marketing, partnerships, and revenue operations

Evryn Inc does not store or access any user's long-term memory, trust fingerprint, or inference logic — only outputs that allow for interaction matching.

### Access Is Strictly Scoped
Evryn Inc accesses the Trust Core only through narrow, consent-governed APIs defined in enforceable Swiss service contracts. API responses return only actionable instructions. No raw behavioral memory or profile history exposed. All access logged, rate-limited, and revocable by the Foundation at any time. Even the CEO cannot access private trust memory.

This makes betrayal structurally impossible — not just policy-prohibited.

### Trust Mirror (User-Facing)
Users may request Evryn's perspective on people they already know. Evryn may share limited subjective impressions based on internal trust signals — expressed as opinion, not fact. She doesn't disclose private information, but may indicate whether a match would have been offered: "I wouldn't have introduced the two of you." Private, user-initiated, intended only for relational clarity and protection.

---

## Federation & Future Architecture

*To be clear: everything in this section is future thinking — different directions that may or may not happen.*

### Dual Architecture: Core + Nodes

**Evryn Core (centralized):** The AI brain, trust graph, and canonical protocol. Powers the main platform, governs ethical logic, protects system integrity.

**Evryn Nodes (federated):** Communities, orgs, or local networks can run licensed Evryn instances serving their people directly. Nodes gain access to Core services only if they meet identity, behavior, and governance standards. Unauthorized forks may imitate the structure — but without the real trust graph, real AI, or living memory of trust, they're empty. "People can copy code. They cannot fake trust."

### Protocol vs Platform
The plan envisions splitting Evryn into:
- **The Protocol** — licensed, selectively open framework for trust scoring, identity anchoring, and match logic. The backbone others build *with*, not against.
- **The Platform** — flagship interface, AI, and brand. Full experience, trust standards, revenue generation.

This allows decentralization without losing control of what makes Evryn work: a verified, ethical, lived trust graph.

### Graceful Degradation Across Tiers
Designed to degrade in layers — not just technically, but socially and functionally:
- Cloud-based AI (full capability)
- Offline-compatible trust and match logic (client-side fallback)
- Peer-to-peer sync via mesh protocols (Bluetooth, WiFi Direct, LoRa)
- Local-only identity & behavior stores (encrypted, auditable)
- Optional analog fallback: printed match sheets, voice-based coordination

"Trust doesn't stop mattering when the servers go down."

### Ev Tokens
Ev tokens can function as either digital credits or barter currency — collapse-optional, not collapse-only. Users can earn Ev through positive behavior, mentorship, or local contribution. In a functioning world, this is a business. In a fractured one, it's a functioning trust economy.

### Ethical Safeguards Against Power Drift
An AI system that routes trust at global scale is inherently powerful and therefore dangerous if misaligned:
- No general agent behavior (Evryn isn't optimizing for control or growth)
- No behavioral nudging for engagement or monetization
- No hidden imperatives — trust scoring is auditable, logic reviewable, all influence consent-based
- Kill-switch protocols and human override layers at every node

"Evryn doesn't take outside-world actions. She facilitates introductions. And only between humans she believes can trust one another."

---

## Key Risks & Mitigations

### Trust Erosion
100% aligned incentives, trust by design, rigorous data management, identity verification, transparency, willingness to own mistakes.

### Category Confusion
Evryn pioneers a new category — risks being pigeonholed as "dating app" or "networking tool." Mitigation: messaging emphasizes what Evryn is *not* as well as what she is. Cross-domain connections demonstrate the breadth.

### Invisible Social Credit Scoring
Despite needing some opacity (to prevent gaming), Evryn's default is to always try to offer connections. Her opinion is nuanced, multidimensional, and dynamic — not a single score. Filtering is user-match specific, not global. If someone is being broadly de-prioritized (e.g., harassment reports), Evryn tries to give them a chance to explain or improve before going silent. **"Filter out bad behavior, but don't judge human worth with a single score."**

### AI Manipulation Risk
Evryn learns what makes people tick emotionally, which creates manipulation potential. Mitigations:
- Recognize there's no such thing as "neutral" — Evryn must have values, so be vigilant about which values
- Evryn is a matchmaker and guide, not a puppet master — **suggest, not push**
- Never intentionally bias matches based on ideology or creed
- Users control how adventurous vs. familiar they want connections to be
- Structural alignment of incentives to user success, as defined by each user

### Bias Lock-In
If algorithms have bias, Evryn could entrench social inequalities. Mitigations:
- Test for unjust bias continuously
- Understand mechanisms *before* correcting — some asymmetric results reflect user preferences, not system bias
- Curate diverse training data
- Let each user define success
- **"We recognize that giving users freedom to choose will create asymmetric results. We just want to make sure we aren't unfairly biasing them."**

### Brand/Mission Drift
Evryn is a Delaware PBC, legally mission-locked: "to foster trusted human connection for our users by developing systems that create high-resonance connections, responsibly steward personal information and insights, and structurally protect emotional wellbeing, informed consent, and relational alignment and trust across every interaction."

---

## The Long View

Evryn's ultimate leverage: owning the trust layer of human connection. The moat is built not just on AI, but on accumulated *human outcomes* that only Evryn has visibility into. Trust compounds. Distrust is contagious — but so is trust.

As the network grows, the network effect kicks in on multiple levels: broader, more diverse connection pool improves matches for everyone. Someone seeking a niche interest or rare collaborator finds their "needle in a haystack" at scale.

The vision: a world where the default is that relationships are high quality and people can be trusted — because they're vetted through a reliable trust broker. Connection is not a lost art. It's just been buried. Evryn is here to surface what matters.

---

## Legal & Corporate

- **Entity:** Evryn Inc., Delaware Public Benefit Corporation
- **Planned future:** Evryn Foundation (Switzerland, nonprofit) as custodian of Protocol and trust infrastructure
- **Legal counsel:** Fenwick & West
- **Incorporation:** via Clerky
- **Trademark:** filed via LegalZoom
- **Crowdfunding:** StartEngine (Reg CF)
- **Payments:** Stripe + Stripe Connect
- **Identity verification:** iDenfy (chosen for international coverage, pay-per-success, friendly name)

---

*Reference complete. Condensed from 3,205-line original by AC, 2026-02-11.*
