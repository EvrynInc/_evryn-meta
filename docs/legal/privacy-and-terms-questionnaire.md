# Privacy Policy & Terms of Service — Legal Team Questionnaire

> **How to use this file:** Draft responses to Fenwick's questionnaire for building Evryn's Terms & Conditions and Privacy Policy. This is a working document — answers will be refined through discussion with legal counsel. Maintained in the repo so we can update it as the product evolves.
>
> **Owner:** Justin McGowan (with AC research support)
>
> **Status:** Seventh draft — 2026-02-17

---

## 1. Have you started building out a website/app yet?

Yes. Our marketing website is live at [evryn.ai](https://evryn.ai). It currently serves as a landing page with a waitlist signup form.

The product itself (Evryn's AI-powered connection brokering) is in active development. The first deployment will be email-based — no app or web interface for end users initially. A responsive web application is next, with native mobile apps as a longer-term goal.

---

## 2. Mockups

Other than what you can see on the live site, we don't have mockups yet. We're starting with an email-based pilot (explained below) where the interface *is* email — there's no app UI to mock up. Once the web app version gets further along, we'll provide those.

**About the pilot:** We're running a pilot with a film industry gatekeeper — someone who receives ~1,000 emails/week from people seeking his attention. He forwards his inbound to Evryn, and Evryn identifies which people are worth his time. He just forwards email — no new interface to learn, no disruption to his workflow.

For this pilot, we're keeping onboarding light. Our regular flow will include identity verification and a more thorough vetting process via the app, but for this first pilot, we're working with people who are already in our gatekeeper's professional orbit.

**The scale-up path:** Our gatekeeper typically finds about 1 in 1,000 emails useful. The very next phase after the pilot is reaching out to the other 999 — people who weren't the right fit for our gatekeeper specifically, but who are real people with real needs that Evryn can help with. They become full Evryn users in their own right, and Evryn helps them find connections across all life domains (not just the gatekeeper they originally emailed). This is how the user base grows organically from gatekeeper partnerships.

---

## 3. AI service providers

We're using **Anthropic** (Claude) as our AI provider. Anthropic powers:

- **The product** — Evryn's conversational AI, external message processing, user profiling, and connection brokering all run on Claude's API.
- **Internal AI agents** — We're building AI-powered operational agents (using Anthropic's Claude Agent SDK) to handle internal company functions. These are internal tools that help run the company, not user-facing features. They may handle user data in the course of operations (e.g., reviewing analytics, coordinating outreach campaigns). We minimize the surface area where user data comes into contact with these internal agents.
- **Development tooling** — We build with Claude Code (Anthropic's CLI development tool). This is purely internal and doesn't touch user data.

We'd like to preserve the option to change AI providers if needed. The AI landscape is moving fast, and while Anthropic is well ahead for our needs right now, we're designing with some optionality. That said, we're not building vendor-agnostic abstractions that would add complexity — we're just being mindful about how tightly we couple to any single provider.

---

## 4. Third-party integrations that handle user/customer information

### Currently in use

| Service | What it does | What data flows through it |
|---------|-------------|---------------------------|
| **Google (Gmail / Google Workspace)** | Email infrastructure. Our pilot gatekeeper forwards emails to Evryn's Gmail address (evryn@evryn.ai). Evryn reads, processes, and sends email through her own Google account. | Full email content — sender names, email addresses, message bodies, attachments (metadata only for now — we note that attachments exist but don't process their contents yet). |
| **Anthropic (Claude API)** | AI processing. Email content, user conversations, and user profile data are sent to Anthropic's API so Evryn can read, understand context, and compose responses. | Email content, user conversations, profile data, and Evryn's analysis of whether people are good connections. Governed by Anthropic's commercial API terms and Data Processing Addendum (DPA). Anthropic does not train on API-submitted data, does not retain inputs/outputs beyond 30 days, and provides SOC 2 Type II compliance. |
| **Supabase** | Hosted PostgreSQL database. All user records, conversation history, connection records, and user profiles are stored here. | All persistent user data. Supabase provides SOC2 compliance, encryption at rest and in transit, and row-level security (which we enforce on all tables). |
| **Vercel** | Hosts the marketing website (evryn.ai). | Waitlist form submissions (name, email). Standard web server logs (IP addresses, user agent, etc.). |
| **HubSpot** | CRM and email marketing. Captures waitlist signups from the website. Will be used for email campaigns. | Names, email addresses, signup metadata. |
| **Cloudflare** | Provides Turnstile (captcha/bot protection) on the waitlist form. | IP addresses and browser fingerprint data (standard for bot detection). Minimal personal data exposure. |
| **Railway** | Cloud hosting for Evryn's backend process (the always-on service that polls for new email and runs the AI). | User data passes through their infrastructure in transit. Railway provides the compute environment. |
| **GitHub** | Source code repository hosting. | Source code only — no customer data is stored in repos. Environment variables and credentials are excluded. |
| **Slack** | Internal operational communications. Evryn sends classification results, alerts, and edge case escalations to the operations team via Slack. | User names, email content summaries, classification reasoning. Internal use only — not user-facing. |
| **Google Analytics** | Website traffic analytics on evryn.ai (marketing site). | IP addresses, browsing behavior, device information, referral sources. Standard website analytics — marketing site only, not the product. |

### Planned (all expected within 6 months)

We are building toward anonymizing and minimizing user data before it passes through third-party services. For example, when Evryn sends data to the AI service provider for processing, personally identifiable information will be tokenized or replaced with pseudonymous identifiers so the AI provider processes context and meaning without seeing real names, emails, or other PII. This isn't implemented yet — today, full user data (including names, email addresses, and message content) is sent to the AI provider without anonymization. Implementing this tokenization layer is a near-term architectural priority.

We also plan to pursue Anthropic's **Zero Data Retention (ZDR)** arrangement, under which Anthropic commits to not storing any inputs or outputs after the API response is returned — data is processed in real-time and immediately discarded. This is a contractual arrangement available to commercial API customers who handle sensitive data. Combined with the tokenization layer above, the target state is: anonymized data in, zero retention on the other end.

| Service | What it does | What data flows through it |
|---------|-------------|---------------------------|
| **Stripe + Stripe Connect** | Payment processing. Stripe handles all payment card data. Stripe Connect enables peer-to-peer payments between users (e.g., if a connection leads to a freelance engagement). | Evryn never sees or stores payment card numbers. Stripe holds all sensitive financial data. We receive transaction records (amount, timestamp, status) but zero card details. |
| **QuickBooks** | Accounting and bookkeeping. | Payment records pulled from Stripe — just the fact that a payment was received, amounts, and dates. No user-identifying information beyond what's needed for financial records. |
| **Identity verification service** (currently iDenfy; likely transitioning to Jumio at scale) | Identity verification. Users verify their identity before Evryn will broker connections for them. The verification service handles the entire process — Evryn passes the user to the service, they verify, and Evryn receives back a verification status. | The verification service processes the user's ID document and biometric data entirely on their end. **Evryn never stores identity documents, photos, or biometric data.** We store only: a verified/not-verified flag, the date of verification, and a safety identifier for recognizing returning identities (see "Safety imprint on account deletion" in Q5 below). |
| **Web search API** (likely Brave Search) | Evryn researches people before deciding whether they're a good connection — looking up their company, public profile, etc. to make better judgments about fit. | Names, company names, and potentially email addresses are sent as search queries. Only publicly available information is returned. |
| **Vapi** | Voice AI platform — for live voice conversations with Evryn. | Voice audio, transcripts of spoken conversations. |
| **Hume AI** | Emotion/sentiment detection during voice conversations — helps Evryn understand tone and emotional context. | Voice audio analyzed for emotional signals. |
| **ElevenLabs** | Voice synthesis — gives Evryn a speaking voice. | Text of Evryn's spoken responses — which can contain user information from conversations (e.g., names, locations, context about people being discussed). |
| **Amplitude** | Product analytics — understanding how users interact with the web/mobile interface. | User behavior data (screens viewed, actions taken, time spent). |
| **StartEngine** | Crowdfunding platform (Reg CF). Users and prospective users may be invited to invest in Evryn through this registered intermediary. | StartEngine handles the full securities offering — investor identity verification, investment limits, escrow, compliance, and record-keeping. Evryn directs interested users to StartEngine's platform; StartEngine manages the investor relationship. Evryn receives investment records (who invested, amounts) for cap table purposes. |

### Multi-channel communication (under research)

We're researching the feasibility of letting Evryn communicate with users on their preferred platform — email for now, and soon our app, but expanding to text (SMS/MMS), Telegram, WhatsApp, etc. Technically straightforward to implement, but we're carefully considering the security and legal implications of each channel before committing. Each new channel means a new integration partner handling user message content, and potentially a different regulatory framework.

---

## 5. Other information collected from users

### Directly provided by users

| Data type | How it's collected | Purpose |
|-----------|-------------------|---------|
| **Name and contact information** (email address, phone number, and potentially other contact methods as we add communication channels) | During onboarding, when they contact Evryn, when provided in conversation, or when referred by another user (e.g., "my friend would love to hear from you" — always with the referring user's explicit intent to connect, never scraped or collected without context) | Identity, communication |
| **Conversation content** | Everything users tell Evryn in conversation — their interests, goals, preferences, personal stories, what they're looking for, who they know | Building a deep understanding of who they are so Evryn can find the right connections |
| **Feedback on connections** | Users tell Evryn how a connection went — what was good, what was wrong, what was surprising | Evryn learns and improves her judgment |
| **Payment amounts** | Users propose a price they believe is fair — for the connection and for the relationship they want to build with Evryn (trust-based pricing model) | Revenue; pricing behavior is also a signal about character (see trust assessment below) |
| **Identity verification status** | Verification is handled entirely by our identity verification provider — Evryn receives only a pass/fail result and date | Confirming users are real humans. Evryn never stores identity documents or biometric data — see Q4 above. |
| **Communication preferences** | Users set their preferred channels, frequency, and quiet hours during onboarding | Governs how and when Evryn reaches out, including proactive check-ins |

### Derived and inferred by Evryn's AI

Evryn doesn't just store what users tell her. She builds an evolving understanding of each person.

| Data type | How it's created | Purpose |
|-----------|-----------------|---------|
| **User "story"** | Evryn synthesizes everything she learns about a person into a narrative understanding — not a profile with checkboxes, but a written synthesis of who they are. This evolves over time as she learns more. | The story is the foundation for connection matching. It captures the kind of cross-domain nuance (someone is a filmmaker AND a parent AND looking for a career change) that structured data can't. |
| **Behavioral trust assessment** | Evryn observes patterns over time: reliability, follow-through, tone, how someone treats others, whether they show up honestly. This is not a numeric score — it's a qualitative, narrative assessment. Other users can provide input (e.g., vouching for someone they know), but this is information for Evryn's independent judgment, not a direct mechanism — a vouch from a highly trusted user with corroborating signals may carry weight, while a vouch with no corroboration may carry little or none. | This assessment determines what types of connections Evryn is willing to broker for a given user and in what contexts. It's the core mechanism that keeps the platform safe — Evryn only connects people in proportion to how much she trusts them in that particular context. See "Behavioral trust assessment" in the Additional Context section below for more detail. |
| **Connection decisions and reasoning** | When Evryn decides to connect two users, she records her judgment, confidence level, and written reasoning. In the gatekeeper pathway specifically, Evryn also records reasoning for decisions *not* to match — why someone in a gatekeeper's inbound wasn't surfaced as a connection. | Creates an audit trail of how and why Evryn made each connection decision. |
| **Connection graph** | A map of relationships — who was connected by Evryn, known existing relationships, vouching, relationship strength. | The relationship graph enables better matching over time. It also means some information becomes shared: if User A tells Evryn they know User B, that relationship becomes part of User B's context as well (see data retention notes below). |

### On account deletion

This is architecturally important and we'd like the legal team's guidance:

- **Personal data is purged** — conversations, profile, story, preferences, contact information.
- **A safety identifier is retained.** When an account is deleted, Evryn retains the ability to recognize if the same verified person creates a new account in the future — and to remember the nature of our willingness to do business with them — without retaining any personal information. The identifier is designed so that it cannot be reversed to recover names, emails, or any identifying data. It only tells Evryn: "We've encountered this verified identity before, and here is what we remember about the nature of our willingness to do business with them again." See "Safety imprint on account deletion" in the Additional Context section below for how we'd like to frame this legally.
- **Shared data persists where it belongs to other users.** Conversations between two connected users are part of both users' data — if User A deletes their account, User B's record of their conversations remains intact. Similarly, if User A told Evryn they know User B, that connection remains in User B's graph. User A's personal details are still purged from Evryn's systems, but the other user's own data (including their side of shared interactions) is not affected by the deletion.

We'd like the legal team to advise on how to disclose the safety identifier and shared relational data, and how to ensure these are compatible with GDPR right to erasure, CCPA deletion rights, and similar regulations.

### Future data types (not yet collected)

- **Voice recordings and transcripts** — when the voice interface is built. Note: voice features (Vapi, Hume AI) will involve voice prints and emotion analysis that may qualify as biometric data under Illinois BIPA and similar state biometric privacy laws. The legal team should advise on the consent framework needed before these features launch.
- **Emotional/sentiment data from voice** — via Hume AI integration
- **Social network mapping** — who users know, inferred from conversation context and declared relationships
- **Location data** — for geographic matching (primarily user-provided, but I can imagine scenarios where it would be valuable for the app to be able to detect a user's current location - this would of course be opt-in)
- **Attachment content** — Evryn currently notes that email attachments exist but doesn't process their contents. In future phases, she will selectively process attachment content from trusted users (with malware scanning) to better understand context.
- **Observations and coaching insights** — Evryn may share observations with a user about patterns in their interactions or connection outcomes. These are Evryn's perspective, shared as a friend would, not professional guidance.

---

## 6. Platform — mobile, web, or both?

Our platform will evolve in stages:

1. **Current:** Email-only. Evryn communicates via email. No app, no web interface for end users.
2. **Near-term:** Responsive web application (mobile-friendly from day one, but accessed via browser, not an app store).
3. **Later:** Native mobile apps (iOS, Android) — only when user demand warrants the investment.
4. **Multi-channel communication (under research):** As described in Q4 — we're exploring additional communication channels (SMS, WhatsApp, etc.) but evaluating the security and regulatory implications of each before committing.

---

## 7. Marketing, analytics, and tracking

### Marketing approach

Our primary growth strategy is organic and relational, not primarily ad-driven:

- **Top-down (gatekeeper partnerships):** As described in Q2 — gatekeepers are high-volume connectors who route their inbound to Evryn. Each provides a large pool of potential users, most of whom aren't the best *mutual* fit for that gatekeeper specifically but are real people with real needs. Our current gatekeeper is likely representative at ~1,000 new potential users per week.
- **Bottom-up (whisper cascade):** Invite-only growth — we grow by solving, proving, and being invited forward.
- **Organic outreach:** Content creation (blog posts, thought leadership), organic presence on platforms (Reddit, social media), community engagement in target industries.
- **Events:** Presence at industry events and gatherings.
- **Paid advertising:** In addition, where necessary, we will also run paid ads to support awareness and growth.

### Analytics — current

- **Google Analytics** on evryn.ai (marketing site) — standard website traffic analytics.
- **HubSpot** — email campaign tracking (opens, clicks) for waitlist/marketing emails.
- No in-product analytics yet (no end-user product interface exists yet).

### Analytics — planned

- **Amplitude** — product analytics for understanding how users interact with the web/mobile interface once it exists.
- **Retargeting pixels on the marketing site** — we expect to use standard tracking pixels (Google, potentially Meta) on **evryn.ai** (the marketing website) to retarget website visitors with ads. This is standard website-level retargeting — "this person visited our website, show them a reminder ad."

### The line we draw

This distinction is important to how Evryn operates:

- **Marketing site (evryn.ai):** Standard retargeting pixels are acceptable. Someone visited our website — we can remind them we exist. This is no different from any other company's marketing website.
- **Product experience (conversations with Evryn, the app, anything inside the user's relationship with Evryn):** Zero third-party tracking. What users tell Evryn is private. No advertising platform gets any signal from inside the product. We will not embed Facebook SDK, Google Ads SDK, TikTok SDK, or any similar third-party advertising packages inside the product experience.
- **No selling user data.** Ever. To anyone.
- **Product analytics are for product improvement only** — understanding how the product is used so we can improve it, not building advertising profiles. Always opt-in.

---

## Additional Context for Terms & Privacy Policy

The following items weren't covered by your questions, but they're architecturally significant to Evryn and likely relevant for the Terms & Conditions and/or Privacy Policy. Evryn's structure is unusual enough that some of these wouldn't be obvious to ask about — we want to surface them proactively so the Terms and Privacy Policy can be built with the full picture.

### A note on tone and trust

While of course these need to be legal documents first and foremost, user trust is unusually critical to Evryn's core offering — the Terms and Privacy Policy are one of the first things a thoughtful user will read, and if the language sounds extractive or adversarial, it undermines the product itself. We'd ask the legal team to keep this trust-first posture in mind when drafting, and beware of instances where standard boilerplate might inadvertently undermine it. We've tried to be specific throughout this document, but we can't anticipate every scenario — so we wanted to note the principle as a guide.

### Mutual matching — a foundational principle

Evryn finds the best <u>*mutual*</u> match — not just the best match for one side. This principle governs all user relationships, including with gatekeepers.

Everyone who comes through a gatekeeper's inbound becomes a full Evryn user (as described in Q2) — whether or not they're a good mutual fit for that gatekeeper. Evryn may connect them with that gatekeeper, but she may also connect them with other people across all life domains. Evryn's obligation is to each user individually, not to the gatekeeper who surfaced them.

The same person may have reached out to multiple gatekeepers simultaneously, but each gatekeeper will naturally assume these are "their leads." **The Terms need to make clear that they are not** — and must explicitly disclaim any ownership or priority rights over the people in a gatekeeper's inbound. 

Having said all of this, these gatekeeper relationships are very valuable to us, so the language should be honest and clear while doing all we can not to scare gatekeepers off.

### AI-powered automated decision-making

Evryn makes AI-powered judgments about people — who to connect, in what contexts, and why. These decisions meaningfully affect users (determining which connections they're offered and which they're not). Under GDPR Article 22 and evolving US state privacy laws (including CCPA/CPRA), users may have rights regarding automated decisions that significantly affect them.

Currently, **every outbound action Evryn takes is manually approved by a member of the operations team** before it reaches any user. No automated decision reaches a user without human review. During the pilot and early phases, the operations team also has direct access to user data — conversations, classifications, profiles — as part of this human-in-the-loop oversight. This operational access is necessary for the safety model to function and should be disclosed in the Privacy Policy. 

But we believe users deserve privacy from everyone, including the team that built Evryn. So at scale, operator access will be heavily gated, audited, and structurally constrained. And we're building toward a model where an automated safety gate will replace much of the direct human oversight — checking all outbound messages against safety criteria before they reach users. But some human oversight will remain for consequential decisions as this system is developed and refined.

### Behavioral trust assessment (not a "score")

The trust assessment described in Q5 is worth expanding on for legal purposes. It's multidimensional, context-specific, and dynamic — for example, Evryn might trust someone highly for professional connections but have reservations about romantic introductions based on observed behavior, or vice versa. The assessment is private (never shown to other users), contextual (not a universal label), and always evolving.

As noted in Q5, users can provide input (such as vouching), but users do not *directly* affect another user's standing with Evryn. Evryn takes in a variety of signals and exercises her own judgment.

This is conceptually similar to a credit score in that it affects what services a user can access — but it's structurally different (narrative, not numeric; private; context-specific). The legal team should advise on how to disclose this and how to remain compliant with any "automated profiling" regulations.

### Behavioral filtering, not belief filtering

Evryn filters behavior — predatory conduct, deception, manipulation, coercion — not politics, identity, religion, or worldview. We don't ban users; Evryn simply doesn't connect users beyond what their demonstrated trustworthiness warrants. This distinction is intentional and should be reflected in the Terms.

### Connection types and regulated contexts

Evryn connects people across all life domains — professional, creative, romantic, community, mentorship, and more. This breadth means some connections will touch contexts that overlap with regulated fields: connecting someone to a therapist (medical), a financial advisor (financial), or a lawyer (legal). Evryn is not providing medical, financial, or legal services — she's making introductions between people. But the Terms should include clear disclaimers that Evryn is a connection broker, not a licensed service provider, and that any professional services resulting from a connection are between the individuals involved.

Similarly, Evryn may share observations about patterns she's noticed in a user's interactions (also listed as a future data type in Q5). These observations are Evryn's perspective, shared as a friend would - not professional guidance. Evryn is not a therapist, career counselor, or licensed advisor of any kind.

### Proactive AI-initiated communication

Evryn reaches out to users on her own initiative — check-ins when she hasn't heard from someone in a while, follow-ups after connections, observations about patterns. This is core to the relationship Evryn builds with each user, it's not a notification system. Evryn has default communication policies to respect users' boundaries, but users are also able to set communication preferences during onboarding (preferred channels, frequency, quiet hours), and Evryn respects those boundaries.

The legal team should advise on how to frame consent for AI-initiated communications in the Terms, especially as channels expand beyond email (see multi-channel research in Q4) to platforms with different regulatory requirements (e.g., TCPA for SMS).

### Safety imprint on account deletion

The technical details are described in Q5 above. The legal framing we'd like: this functions similarly to how any business reserves the right to decide what relationship they're willing to offer a returning customer, but implemented with privacy-preserving technology so that no personal data needs to be stored to exercise that right.

The legal team should advise on how to disclose this, and how to ensure the framing as a standard commercial right (reserving the right to determine the terms on which we do business with a given individual) provides adequate legal basis under GDPR, CCPA, and similar frameworks.

### Data retention

| Data type | Retention policy |
|-----------|-----------------|
| Inbound emails forwarded by gatekeepers | 6-month retention period, then purged from our database. Information from these emails that pertains to a person who becomes an active user is incorporated into their user profile (retained for the life of the account). |
| User profiles and conversation history | Retained for the life of the account |
| Connection decisions and reasoning | Retained as a long-term audit trail. Note: some connection data becomes shared between users (if User A is connected to User B, that record is part of both users' data — deleting one account doesn't erase the other's connection history). |
| Safety identifier (post-deletion) | Retained indefinitely — see "Safety imprint on account deletion" above |
| Identity verification artifacts (photos, documents) | Never stored by Evryn — handled entirely by the verification service |
| Payment records | Per standard financial record-keeping requirements |

### Age requirements

We'd like to set a minimum age of **18** for using Evryn. Given the nature of the service — brokering real-world connections, including professional and potentially romantic contexts — we believe 18 is the appropriate floor for launch.

Questions for the legal team:
- Are there jurisdictions where 18 isn't sufficient and a higher age applies?
- Long-term, we may want to consider offering the service to younger users, potentially with accounts administered by a parent or guardian. This isn't near-term, but if there's language we should include now to leave room for it, we'd want to include it.

### Sensitive personal data

Users will tell Evryn about deeply personal topics — romantic preferences, health situations, financial circumstances, career struggles, family dynamics, identity-related information. Some of this falls under "sensitive personal data" or "special category data" under various privacy frameworks (GDPR, CCPA, state biometric laws). The Privacy Policy needs to address:

- What sensitive categories Evryn may process
- That this data is used exclusively to serve the user (finding better connections)
- That it is never sold, never used for advertising, never shared with anyone - including other users, without explicit permission
- How it's protected (encryption, access controls, user isolation)

### User isolation as an architectural principle

Each user's relationship with Evryn is structurally isolated. Evryn never reveals one user's information to another — this is enforced at the database level (row-level security), not just by AI instruction. Even if Evryn's AI were somehow confused or manipulated, the architecture prevents data leakage between users because the system physically cannot access User B's data while processing User A's conversations.

**There are precisely two controlled pathways where information can cross between users:**

1. **Evryn-mediated introductions:** When Evryn brokers a connection, she may share a description of one user with another — but the specific wording is explicitly approved by the user whose information is being shared before anything is sent.
2. **Direct messaging after mutual consent:** Users can communicate directly with each other only after both have independently agreed to be in contact. Until both say yes, neither knows the other exists in the system. The mechanics of how this works are carefully crafted — please ask if you need more detail.

**One additional mechanism is planned that involves carefully controlled information flow:**

3. **Latent Truth Discovery (future):** If two users independently express the same hidden desire or interest to Evryn, she may carefully offer to facilitate — but ONLY if both have expressed it independently, and only with both parties' active, informed consent. Ultimately, Evryn effectively acts as a courier: each user must explicitly sign off on the exact wording of anything shared. Nothing is revealed without both parties' consent.

**Evaluating existing relationships:** Users will inevitably ask Evryn to evaluate someone they already know — "Would you have connected me to my husband?" Evryn doesn't do this. She's a broker — she finds you the best match. She doesn't evaluate your existing relationships. Any answer about a specific person risks revealing whether they're on the platform, and the question itself can be used coercively. If a user wants to know whether someone is the best mutual match for them, that's the standard matching process — both people engage independently.

Outside of these pathways, user data never crosses between accounts.

**A note on shared conversations:** Two connected users can invite Evryn to be present in their conversation — this helps her stay informed about the relationship. But Evryn only speaks in private, one-on-one conversations with individual users. She will not speak in shared conversations, ensuring she never accidentally reveals private information from either user's individual relationship with her. This is always opt-in: Evryn is never present unless both parties have invited her.

### Cast-off outreach and consent

As described in Q2, our growth model involves reaching out to people who emailed a gatekeeper but weren't the right mutual fit for that gatekeeper. These people initiated contact with someone in Evryn's ecosystem but didn't directly sign up for Evryn. The outreach framing: "You reached out to [gatekeeper], who works with Evryn. They're not the right fit for this, but if you'd like, I'd be happy to help you find what you're looking for."

Questions for the legal team:
- What consent framework is needed for this outreach under CAN-SPAM and, if applicable, TCPA (for future SMS/text channels)?
- Does the fact that the person initiated contact with someone in Evryn's ecosystem provide a sufficient basis for outreach, and are there best practices we should keep in mind as we craft these approaches?
- What opt-out mechanisms should be included from the first message?

### Data portability

Users can request an export of their data by contacting support@evryn.com. User profiles are stored in structured format and conversations are logged — we can provide a full data export on request.

### Cross-border data considerations

Current infrastructure locations (to be confirmed with each provider):

- **Supabase** — AWS-hosted (region TBD; typically US)
- **Anthropic API** — US-based processing
- **Google (Gmail)** — Google's global infrastructure
- **Railway** — US-based hosting
- **Vercel** — Global CDN, US-based origin

Currently all users are US-based (LA film industry pilot). If/when we serve users in the EU or other jurisdictions with data transfer restrictions, we'll need to address cross-border data flows. The legal team should advise on whether Standard Contractual Clauses or other mechanisms are needed now or can wait until international expansion.

### Payments architecture and pre-purchases

Stripe handles all monetary transactions (see Q4 above) — Evryn never holds, transmits, or has access to user funds. Peer-to-peer payments flow through Stripe Connect, where Stripe handles the entire payment lifecycle.

Users may pre-purchase connections or receive Evryn Credit (non-monetary, non-withdrawable promotional value used within the platform). Pre-purchases are completed transactions (processed through Stripe), not held funds. Evryn Credit functions as a promotional or reward mechanism, not a financial instrument.

Questions for the legal team:
- Does this structure (Stripe handles all money, Evryn tracks completed purchases and non-monetary credits) avoid money transmitter licensing requirements?
- Are there state-level stored value or gift card regulations that apply to Evryn Credit?

### Crowdfunding and investment

StartEngine handles the full securities offering as a pass-through model (detailed in Q4 above) — the expertise and regulatory burden stays with the registered intermediary, similar to how we use iDenfy for identity verification.

Evryn may invite users to pre-purchase connections or learn about the investment opportunity when they express genuine enthusiasm for the service — for example, when a user says something like "this whole approach sounds amazing, I want to be part of this." These invitations are conversational and responsive to the user's expressed interest, not timed to moments of vulnerability or emotional distress. However, we want to surface this for the legal team: the fact that an AI may make commercial invitations — including mentioning a securities offering — within an ongoing conversational relationship is novel enough that it warrants review.

Questions for the legal team:
- What disclosures or guardrails are required when an AI conversationally invites users to invest through a Reg CF offering?
- Are there specific rules about AI-initiated investment solicitation within a conversational product?
- What language should the Terms include regarding pre-purchases and the distinction between purchasing a service vs. investing in the company?

### Participant-Based Business Access

One of Evryn's planned revenue streams involves businesses becoming Evryn users. A business is introduced to an individual user only when Evryn judges them to be the best fit for what the user is looking for — and only with the user's explicit, per-introduction consent. Users can exclude any or all businesses. There is no boosting, no buying visibility, and no sharing of user data with the business without the user's explicit approval in the moment.

Questions for the legal team:
- What FTC disclosure requirements apply when a connection involves a paying business?
- Under CCPA's broad definition of "sale," does facilitating a per-intro, user-consented introduction between a user and a paying business constitute a "sale" of personal information? And to be clear: we don't independently give either user the other user's info — we simply pass whatever information they've explicitly approved for sharing with the other, then put them into contact with each other through our system. They would need to exchange any external contact information themselves.

### Emerging regulatory considerations

The legal team should be aware of the following frameworks as they may affect how the Terms and Privacy Policy are drafted:

- **EU AI Act:** Evryn's automated matching decisions — particularly in employment and romantic contexts — may fall under high-risk AI system requirements as we expand internationally.
- **FCRA:** The behavioral trust assessment (see above) determines what connections a user can access. If trust assessments ever inform third-party decisions (e.g., a business deciding whether to engage with a user based on Evryn's willingness to broker the connection), FCRA requirements could apply.
- **Anti-discrimination laws:** Evryn connects across all life domains, including contexts that touch housing and employment. Fair housing (FHA), equal employment (Title VII), and equal credit opportunity laws may apply to how matching decisions are made in those contexts. Evryn's behavioral filtering approach (see "Behavioral filtering" section above) is designed to avoid discriminatory matching, but the legal team should confirm this provides adequate protection.

### Long-term jurisdictional architecture (future)

Our long-term architectural vision includes creating a **Swiss foundation** (separate nonprofit entity) as the custodian of Evryn's trust graph and behavioral memory. This structure is designed to maximize user privacy — the US operating company (Evryn Inc.) would access trust data only through narrow, consent-governed APIs, and even the company's own operators would be structurally unable to access private user trust data. The foundation would be governed by a multinational board under a mission-locked charter, benefiting from Switzerland's strong privacy protections.

This is likely many months away from implementation, but the legal team should be aware it's in the architectural roadmap. It may influence how we structure the Terms and Privacy Policy now — for example, reserving the right to transfer trust data to a mission-locked custodial entity dedicated to user privacy protection.

### Entity structure

**Evryn Inc.** — Delaware Public Benefit Corporation. Mission statement: "to foster trusted human connection for our users by developing systems that create high-resonance connections, responsibly steward personal information and insights, and structurally protect emotional wellbeing, informed consent, and relational alignment and trust across every interaction."

---

*Draft prepared 2026-02-16. Seventh pass: redundancy cleanup — trimmed repeated descriptions, added cross-references between sections for readability.*
