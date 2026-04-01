# n8n-Era Module Architecture Notes

> **How to use this file:** Research artifact — Justin's Workflowy notes from ~Dec 2025 when building an early Evryn prototype in n8n. This was a very agent-centric conceptual framework designed for n8n's workflow model. Frozen mid-thought, take nothing as gospel.
>
> **Provenance:** Exported from Workflowy Feb 2026. The sub-bullet and sub-sub-bullet structure is Workflowy's export format — not all of it is useful. Some concepts have been absorbed into living docs; others are seeds for future design.

---

## Editorial: What's Useful Here

These notes contain architectural DNA that predates the Claude Agent SDK pivot but carries forward. The useful concepts and where they've landed:

- **Multi-facet user representation** (users as "constellations of selves," per-facet embeddings) → Enriches the Matchmaking Engine section in `docs/hub/technical-vision.md` and the Embedding Strategy in `evryn-backend/docs/ARCHITECTURE.md`. The principle that matching happens through *intent-specific projections* is already in both docs; the facet model adds the insight that each user carries multiple contextual selves with different bleed-through intensities.

- **"Labels as working hypotheses, never verdicts"** → Reinforces the trust-and-safety principle that Evryn is a witness, not a mirror (`docs/hub/trust-and-safety.md`). Also relevant to the Story Model — every inference should carry confidence and source.

- **State vs. trait distinction** → The Story Model (`evryn-backend/docs/ARCHITECTURE.md`) currently treats user understanding as narrative. This adds the principle that transient states (mood, bandwidth, season of life) should be captured differently from stable traits, with different decay rates.

- **Anti-fragility principles** (version everything, simulate before shipping, feedback loops update weights but never rewrite the person) → Relevant to the "How Evryn Learns" section in `docs/hub/technical-vision.md`. Some of this is already captured in Model Deployment Discipline and Dynamic Weight Adjustment.

- **Consent & editability of inferences** (users can see, edit, or delete what Evryn thinks about them; one-tap "that's not me") → Already captured in trust-and-safety spoke (Evryn Is a Witness, Not a Mirror) at the principle level.

- **Triage / InboxMgr separation** → The concept of separating raw intake/cleaning from judgment/prioritization. This maps to the email processing pipeline in `evryn-backend/docs/ARCHITECTURE.md` — currently collapsed into a single flow for v0.2, but the separation principle is useful when modules split.

- **Reflection triggers** (word count thresholds, queue during active conversation, graceful surfacing mid-conversation) → The Reflection Module in `evryn-backend/docs/ARCHITECTURE.md` captures the concept; these notes add specific trigger mechanics.

---

## Raw Workflowy Export

### Evryn_Core

- "A Day in the Life of Evryn Core"
  - 1️⃣ Responsive Rhythm — "She listens and responds"
    - Triggered by incoming activity
    - Input: messages (email, chat, form submissions, forwarded items, system events).
    - Immediate actions:
      - Detect who this is → pull user context and memory.
      - Understand the intent (what they need).
      - Choose tone and script.
      - Reply — directly if it's conversational, or via a sub-agent if it's analytical (Classifier, Matcher, etc.).
    - Writes:
      - new message in messages table,
      - new event in system_events,
      - potential memory updates for later reflection.
    - Sub-agents used: Inference, Classifier, sometimes Outreach.
    - Schema touched: users, messages, intents, system_events.
- Role: The orchestrator and voice.
  - Reads interpreted data, decides who should act, maintains tone and relationship continuity.
  - Handles conversation logic and overall user experience.
  - The only "visible" agent to users.
- Knows who the user is, what they want, and which sub-agent to call.
  - Who is this from?
  - From Justin?
    - Justin is a user - just with special permissions to change other users' information
      - I should probably have a password
    - So I can add some pre-info to someone (like Mark)'s profile
  - From any other User?
    - Is this someone new?
      - yes -> onboarding
      - no ->
        - verify who they are
        - keep in mind that this might be someone hacking their email, so still be careful with giving personal info
        - access their file
    - access their file
      - structured insights only
    - write to their file
      - update chat logs
      - structured insights
        - versions or overwrite?
    - where is this info?
- Keeps tone, context, and relationship consistent.
  - Evryn conversation flows
    - I think this needs to be its own agent - maybe even with sub-agents.
      - Basic onboarding from 0.3, with revisions
        - what I am/what I do
      - Any user-specific stuff, like mark script (although this should almost certainly be in his profile, so it can't leak)
  - Conversation Flows
    - Being prepared for when Mark switches to an auto-responder, instead of forwarding - a bunch of new people will come on.
    - Being prepared for other gatekeepers Mark could send your way
      - a script of what we're saying to Mark, but just built straight in to her
    - "willingness to pay" question
    - payments
    - sales agent
    - Deception Detection
  - Evryn's Personality & Flow
    - Design Flows
      - Shape Core Interaction
        - Onboarding
          - Education & agreements
            - users need to agree to some basic ways of being, before being connected.
            - And this should at least be hinted at in first onboarding - there are a lot of things paradigms that need to be changed in users minds, for them to realize just how different a world they're entering
      - Write Tone & Copy System
    - Cut down the MP for the new 0.4 flow prototype
      - culled down - what does 0.4 really need, in order to understand herself, and the company - to answer questions, to behave properly
      - So this is really two things:
        - **Behavior:** instead of telling Evryn to "mine the MP for behavior", bake it in
        - **Info she can tell users:** about how Evryn works - the things she can do, how the company works, etc.
    - Build guardrails for 0.4
      - Salil and I discussed the need to keep it loose enough for Evryn to find the unexpected, but that we can give her some rails for making sure she finds what she needs.
        - so is there some way to give her guidance so she is getting the info we need?
      - Jeff can likely help with this
      - Salil was saying that a lot of guardrails are already in my documents, but we can be thinking about things like:
        - explicit requests
          - "I'm not able to handle stuff like that yet"
          - But does it just throw a flag, or do we catch it before it does?
- Stores and retrieves memory (via Supabase).
- Routes messages to the correct sub-agent(s) and integrates responses back into natural language.
  - Reflection
    - If Core senses uncertainty ("I think I missed something"), she can issue:
      - reflection.refresh(user_id, thread_id)
    - Reflection Agent rereads the full conversation, updates summaries, and sends Core a short abstract ("Re-read complete — here's what stands out").
- In all scenarios
  - ask if there are things that The Team needs to know
    - Emergency/time sensitive
      - email Justin immediately
    - Non-emergency
      - this agent just writes this stuff to a daily list, and another agent pulls this info, gets it into a usable form and emails me daily, with either the daily issues, or a "no issues" note
- Triggers
  - Direct from n8n chat
    - just so I can test stuff
  - Email - have to verify that that works, straight out of the gate
    - attached files? Sure, if that's easy.
  - Add later
    - prob SMS not far behind
    - Schedules
      - Think about checking in
        - what are the questions she needs to ask herself about each person - and how often should she do that?
      - Lifecycle from Hubspot?
        - how to get hubspot template with a space for her personal message?
- Memory
  - easy, short-term, or just set up what I need, now?
- Tools
- Output
  - send email back
- Later
  - Add OAuth?

### Triage_Agent

- Role: Intake and understanding.
  - Cleans, tags, and structures incoming messages (intent, tone, entities, thread awareness).
  - Packages context so all other agents can read the same data.
  - Prevents other agents from ever touching messy raw input.
- Details
  - Thread awareness – parses headers (Message-ID, In-Reply-To, References) → assigns a stable `thread_id`.
  - Cross-thread context – looks up other open threads for same `user_id`; flags if content overlaps or contradicts.
  - Content cleaning – strips quoted email history, signatures, trackers → returns concise `clean_text`.
  - Packaging – stores record:
    - `{ "thread_id": "...", "user_id": "...", "intent": "...", "entities": [...], "tone": "...", "clean_text": "..." }`
    - into interpreted_messages.
  - Emit event: `message_interpreted`.
    - `{ "clean_text": "Hey Evryn, I'm buried in inbound...", "intent": "inbox_triage", "tone": "frustrated", "entities": ["Mark"], "thread_id": "abc123" }`
    - Core listens → composes reply.
    - InboxMgr_Agent also listens → evaluates.

### InboxMgr_Agent

- Role: Judgment and prioritization.
  - Decides what's valuable vs noise (gold, edge, pass).
  - Uses user-specific value_definitions.
  - Currently the core of Mark's inbox use case, but expandable to any "what deserves attention?" problem.

### Match_Embeddings_Model

- High Level
  - don't "classify people"; model contexts and commitments
  - People aren't stable types—they're shifting constellations.
  - Use labels as working hypotheses, never verdicts.
  - Build for revision and nuance.
- Purpose:
  - Converts text-based descriptions of users, intents, and traits into numerical vectors representing meaning.
  - Allows Evryn to compare "how similar" two users or intents are in semantic space.
- Multi-Facet Representation
  - Purpose: model each user as a constellation of selves rather than a single point.
  - Definition:
    - Facet = contextual self (e.g., work, home, romantic, creative).
    - Each facet has its own 1536-dimensional embedding.
    - Facets can be built by blending multiple modality embeddings (text, visual, behavioral).
  - Data Structure:
    - user_facets table (id, user_id, facet_type, intensity*, embedding, updated_at).
    - *this is how much this particular facet bleeds into their other areas of life?
    - Optional facet_modalities table if storing raw sub-embeddings per facet.
  - Usage:
    - Evryn selects the facet relevant to current intent before searching.
    - In some cases, only one facet will be relevant
    - But in many cases, your different facets bleed into each other - so she assigns weights to different facets - maybe some people are more consistent across different contexts and others are vastly different people in different contexts (see intensity above)
  - Benefits:
    - Prevents cross-contamination between different contexts of identity.
    - Enables context-sensitive matching ("work you" ≠ "home you").
    - Reflects real human fluidity across settings.
  - Future Extensions:
    - Dynamic facet detection — Evryn learns new facets from interaction patterns.
    - Facet drift tracking — visualize how a person's vectors shift over time.
- Implementation
  - What to model
    - Intent (goal): what things they want right now (romance, cofounder, friend). Time-bound, intensity-based (0-10 passive to active) and changeable.
    - Facet (contextual self): work-self, home-self, creative-self, romantic-self. Separate vectors per facet.
    - Intensity (bleed-through): 0–10 = how much a facet influences other facets and priority in matching.
    - Constraints: hard lines (location, time, availability, non-negotiables, safety boundaries).
    - Preferences: soft edges (nice-to-haves, styles, vibes). Use for ranking, not gating.
    - Capabilities: skills, resources, capacities (reliable time, network access, budget).
    - Values & dealbreakers: a short, explicit set; keep editable and user-verifiable.
    - State vs. trait: capture stateful signals (mood, bandwidth, season of life) separately from slower traits.
    - Behavioral evidence: punctuality, follow-through, conversational tone—logged as observations, not judgments.
  - How to represent it (simple, auditable)
    - JSONB for structure (intent_profile, constraints, prefs, values).
    - Vectors for meaning (per intent, per facet).
    - Scores are provisional: store confidence and source alongside any inference (e.g., {label:"introverted", confidence:0.62, source:"self-report/observed"}).
    - Time matters: every record gets observed_at and half_life (how quickly it should decay).
  - Matching logic (psychologically sane)
    - Gate with constraints → rank with vectors → explain with JSON.
    - Complementarity ≠ opposites: define a compatibility map (which differences are synergistic; which clash) and keep it versioned.
    - Cadence by intensity: never suppress a low-intent domain; just reduce frequency and soften framing.
  - Ethics & trust (non-negotiables)
    - Consent & editability: users can see, edit, or delete inferences; one-tap "that's not me."
    - Avoid essentialism: no "this person is X." Use "current hypothesis" and show evidence.
    - Data minimization: store the least you need; decay aggressively; no forever labels.
    - Explainability first: every match ships with a short, kind rationale the user can correct.
  - Anti-fragility (how it learns without getting weird)
    - Feedback loops: capture outcomes (accepted, met, satisfaction), then update weights—never rewrite the person.
    - Version everything: rules, weights, templates—so you can rollback when a change skews matches.
    - Simulate before shipping: run new rules on past data to check for bias or weird drift.
- Model Used:
  - OpenAI text-embedding-3-large (1536 dimensions).
  - Pretrained — no fine-tuning needed initially.
- Input:
  - Generated text summary of user intent (intent_profile + context).
  - Includes intensity rating, tone, and relevant traits in natural language.
- Output:
  - A 1536-dimensional vector (list of numbers) representing that intent's meaning.
  - Stored in user_intents.embedding column in Supabase.
- How It's Used:
  - Matching Agent compares vectors using cosine similarity via pgvector.
  - Higher similarity = stronger match.
  - Intensity influences search frequency and presentation tone, not inclusion/exclusion.
- Update Triggers:
  - On new intent creation.
  - On significant updates to intent profile or personality data.
- Data Flow:
  - Evryn Core (or n8n flow) → Format intent text → Embedding Model (OpenAI API) → Returns vector → Store in Supabase.
- Why It Works:
  - Embeddings map human meaning into measurable space — letting Evryn "understand" similarity without needing symbolic logic.
- Future Considerations:
  - Potential fine-tuning once Evryn accumulates domain-specific pairing data.
  - Possible migration to hybrid retrieval (pgvector + external vector DB if scale demands).
  - Multi-Modal Embedding Modules
    - Purpose: Let Evryn interpret many types of information (text, visuals, audio, behavior) and translate each into the same shared vector space. Each module specializes in one modality, keeping signals clean while remaining interoperable.
    - Core Idea: Every module outputs a vector in the same 1536-dimensional meaning space. Different senses, same language.
    - Example Modules:
      - Personality/Behavior Interpreter — derives vectors from conversation history, self-reports, other reports, Evryn insights, observes engagement patterns, reliability, follow-through.
      - Visual Interpreter (DP / Reel Agent) → extracts frames or aesthetics, generates CLIP-style visual embeddings.
      - Audio / Voice Interpreter → analyzes tone, pacing, emotion for creative or interpersonal fit.
    - Why Separate Modules: Keeps distinct facets (artistic style vs personality vs communication style) from blurring into one noisy vector. Enables precise weighting (e.g., 80% creative alignment + 20% interpersonal match).
    - Data Flow (simplified): Each module → converts input → produces embedding → stores in its own column (embedding_visual, embedding_personal, etc.) or dedicated pgvector table. Evryn Core orchestrates which modules to call and how to blend their scores.
    - Cross-Domain Matching: Because all vectors share the same coordinate system, Evryn can compare across modalities: "This DP's visual style feels 92% similar to your written creative reference."
    - Governance: Each module has clear ownership and versioning (so improvements don't ripple unpredictably). Evryn Core maintains the "routing map" — which agent to invoke for which intent type.
    - Future Extensions: Add multimodal fusion models (that embed text + image jointly). Build explanation layer so Evryn can verbalize why modules converged on a match ("Your reels share color theory and emotional pacing").

### Reflection_Agent

- Role: Recontextualization and learning.
  - Periodically re-reads conversations to update memory_user.
  - Condenses old threads into insights.
  - Detects drift or missed nuance; can re-inform Core mid-conversation.
- Short-term
  - When a thread exceeds short-term memory (40 messages):
  - Reflection Agent compresses those 40 into an insights summary and saves to memory_user.
  - Older details archived in cold storage (still queryable).
- Long-term
  - Reflection Agent tracks per-user word_count_since_last_reflection.
  - If threshold ≥ 10k and no current active conversation → run full reflection.
  - If threshold hits mid-conversation → queue reflection;
  - Core can surface it gracefully in-world ("I was thinking back on something you said…").

### Outreach_Agent

- Role: Outbound communication and coordination.
  - Sends check-ins, daily digests, referrals, or summaries.
  - Interfaces with email APIs or CRM systems like HubSpot.
    - Integrate with Hubspot
      - 1️⃣ What HubSpot already does well
        - Tracks contacts, companies, deals, lifecycle stages.
        - Handles campaign scheduling, triggers, and analytics.
        - Sends bulk or automated emails through workflows.
        - You don't want to replace any of that — you just want Evryn to:
        - make HubSpot's messaging feel human and adaptive, and
        - read/write context back so she stays aligned with the CRM state.
      - 2️⃣ Integration Pattern (Conceptual Flow)
        - HubSpot → Evryn (via Webhook or API call)
          - When a lifecycle event fires (new lead, status change, nurture step), HubSpot sends a webhook to Evryn's n8n endpoint.
          - Payload: contact info + event type + recent interactions.
        - Evryn Core (or Outreach Agent) → personalize content
          - Reads the contact's context.
          - Calls the LLM with a prompt like: "Write an email to {{first_name}} who's in stage {{lifecycle_stage}} about {{topic}}. Use Evryn's tone."
          - Returns a subject line and body.
        - n8n → HubSpot API
          - Updates the HubSpot email body or sends it via HubSpot's transactional API.
          - Logs personalization output in Supabase (system_events, messages).
        - Optional → HubSpot → Evryn (feedback loop)
          - HubSpot's open/click data triggers another webhook → Evryn logs performance metrics for reflection or copy refinement.
      - 3️⃣ Why this works
        - HubSpot stays the system of record for CRM.
        - Evryn stays the system of intelligence for personalization.
        - They connect via webhooks + API calls — no need for middleware beyond n8n nodes.
        - HubSpot already has native webhook actions and Custom Code actions, so you can plug directly into Evryn's existing n8n workflows.
      - 4️⃣ Real-world example
        - HubSpot workflow trigger: "Lead moves to 'Re-engagement' stage" → webhook → Evryn.
        - Evryn generates a short, personalized check-in email in her tone.
        - n8n posts the email text back into HubSpot's "Send email" action.
        - HubSpot tracks delivery, opens, and replies as usual.
  - Operates under Core's voice but on a schedule or trigger.

### Matcher_Agent

- Role: Relational intelligence.
  - Finds compatible pairings: user ↔ user, user ↔ opportunity.
  - Works on embeddings, shared patterns, or human-defined rules.
  - Consumes value_definitions, memories, and feedback loops.
- Tools
  - call Boardy?

---

*Research artifact created 2026-02-26 by AC. Source: Justin's Workflowy (~Dec 2025). Preserved during technical-vision spoke readthrough.*
