# Privacy Policy & Terms of Service — Legal Team Questionnaire

> **How to use this file:** Draft responses to Fenwick's questionnaire for building Evryn's Terms & Conditions and Privacy Policy. This is a working document — answers will be refined through discussion with legal counsel. Maintained in the repo so we can update it as the product evolves.
>
> **Owner:** Justin (with AC research support)
>
> **Status:** Fourth draft — 2026-02-16T16:09:20-08:00

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
| **Anthropic (Claude API)** | AI processing. Email content, user conversations, and user profile data are sent to Anthropic's API so Evryn can read, understand context, and compose responses. | Email content, user conversations, profile data, and Evryn's analysis of whether people are good connections. Anthropic's API usage policy states they do not train on API-submitted data. |
| **Supabase** | Hosted PostgreSQL database. All user records, conversation history, connection records, and user profiles are stored here. | All persistent user data. Supabase provides SOC2 compliance, encryption at rest and in transit, and row-level security (which we enforce on all tables). |
| **Vercel** | Hosts the marketing website (evryn.ai). | Waitlist form submissions (name, email). Standard web server logs (IP addresses, user agent, etc.). |
| **HubSpot** | CRM and email marketing. Captures waitlist signups from the website. Will be used for email campaigns. | Names, email addresses, signup metadata. |
| **Cloudflare** | Provides Turnstile (captcha/bot protection) on the waitlist form. | IP addresses and browser fingerprint data (standard for bot detection). Minimal personal data exposure. |
| **Railway** | Cloud hosting for Evryn's backend process (the always-on service that polls for new email and runs the AI). | User data passes through their infrastructure in transit. Railway provides the compute environment. |
| **GitHub** | Source code repository hosting. | Source code only — no customer data is stored in repos. Environment variables and credentials are excluded. |

### Planned (all expected within 6 months)

We are building toward anonymizing and minimizing user data before it passes through third-party services. For example, when Evryn sends data to the AI for processing, personally identifiable information will be tokenized or replaced with pseudonymous identifiers so the AI provider processes context and meaning without seeing real names, emails, or other PII. This isn't implemented yet, but it's a near-term architectural priority.

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

### Multi-channel communication (under research)

We're researching the feasibility of letting Evryn communicate with users on their preferred platform — email, text (SMS/MMS), WhatsApp, etc. Technically straightforward to implement, but we're carefully considering the security and legal implications of each channel before committing. Each new channel means a new integration partner handling user message content, and potentially a different regulatory framework.

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

### Derived and inferred by Evryn's AI

This is important and somewhat unusual — Evryn doesn't just store what users tell her. She builds an evolving understanding of each person.

| Data type | How it's created | Purpose |
|-----------|-----------------|---------|
| **User "story"** | Evryn synthesizes everything she learns about a person into a narrative understanding — not a profile with checkboxes, but a written synthesis of who they are. This evolves over time as she learns more. | The story is the foundation for connection matching. It captures the kind of cross-domain nuance (someone is a filmmaker AND a parent AND looking for a career change) that structured data can't. |
| **Behavioral trust assessment** | Evryn observes patterns over time: reliability, follow-through, tone, how someone treats others, whether they show up honestly. This is not a numeric score — it's a qualitative, narrative assessment. | This assessment determines what types of connections Evryn is willing to broker for a given user and in what contexts. It's the core mechanism that keeps the platform safe — Evryn only connects people in proportion to how much she trusts them in that particular context. See "Behavioral trust assessment" in the Additional Context section below for more detail. |
| **Connection decisions and reasoning** | When Evryn decides to connect two users, she records her judgment, confidence level, and written reasoning. In the gatekeeper pathway specifically, Evryn also records reasoning for decisions *not* to match — why someone in a gatekeeper's inbound wasn't surfaced as a connection. | Creates an audit trail of how and why Evryn made each connection decision. |
| **Connection graph** | A map of relationships — who was connected by Evryn, known existing relationships, vouching, relationship strength. | The relationship graph enables better matching over time. It also means some information becomes shared: if User A tells Evryn they know User B, that relationship becomes part of User B's context as well (see data retention notes below). |

### On account deletion

This is architecturally important and we'd like the legal team's guidance:

- **Personal data is purged** — conversations, profile, story, preferences, contact information.
- **A safety identifier is retained.** When an account is deleted, Evryn retains the ability to recognize if the same verified person creates a new account in the future — and to remember the nature of our willingness to do business with them — without retaining any personal information. The identifier is designed so that it cannot be reversed to recover names, emails, or any identifying data. It only tells Evryn: "We've encountered this verified identity before, and here is what we remember about the nature of our willingness to do business with them again." See "Safety imprint on account deletion" in the Additional Context section below for how we'd like to frame this legally.
- **Shared relational data persists where it belongs to other users.** If User A told Evryn they know User B, and then User A deletes their account, the fact that User B has this connection in their graph remains — it's part of User B's data now, not just User A's. User A's personal details are still purged.

We'd like the legal team to advise on how to disclose the safety identifier and shared relational data, and how to ensure these are compatible with GDPR right to erasure, CCPA deletion rights, and similar regulations.

### Future data types (not yet collected)

- **Voice recordings and transcripts** — when the voice interface is built
- **Emotional/sentiment data from voice** — via Hume AI integration
- **Social network mapping** — who users know, inferred from conversation context and declared relationships
- **Location data** — for geographic matching (user-provided)

---

## 6. Platform — mobile, web, or both?

Our platform will evolve in stages:

1. **Current:** Email-only. Evryn communicates via email. No app, no web interface for end users.
2. **Near-term:** Responsive web application (mobile-friendly from day one, but accessed via browser, not an app store).
3. **Later:** Native mobile apps (iOS, Android) — only when user demand warrants the investment.
4. **Multi-channel communication (under research):** We're exploring having Evryn communicate on the user's preferred platform — email, text, WhatsApp, etc. This is technically feasible but we're evaluating the security and legal angles carefully. Each channel is a different security surface and potentially different regulatory framework.

---

## 7. Marketing, analytics, and tracking

### Marketing approach

Our primary growth strategy is organic and relational, not ad-driven:

- **Top-down (gatekeeper partnerships):** Partnerships with gatekeepers — high-volume connectors in specific industries who route their inbound to Evryn. Each gatekeeper provides a large pool of people — many of whom aren't the right fit for *them* specifically but are real people with real needs. Both those we connect with the gatekeeper, as well as their "cast-offs," become full Evryn users who we can continue to connect to others. Gatekeepers come in different sizes, but our current gatekeeper is likely representative at ~1,000 new potential users per week.
- **Bottom-up (whisper cascade):** Invite-only growth — we grow by solving, proving, and being invited forward.
- **Organic outreach:** Content creation (blog posts, thought leadership), organic presence on platforms (Reddit, social media), community engagement in target industries.
- **Events:** Presence at industry events and gatherings.
- **Paid advertising:** We will also run paid ads to support awareness and growth.

### Analytics — current

- **Google Analytics** on evryn.ai (marketing site) — standard website traffic analytics.
- **HubSpot** — email campaign tracking (opens, clicks) for waitlist/marketing emails.
- No in-product analytics yet (no end-user product interface exists yet).

### Analytics — planned

- **Amplitude** — product analytics for understanding how users interact with the web/mobile interface once it exists.
- **Retargeting pixels on the marketing site** — we expect to use standard tracking pixels (Google, potentially Meta) on **evryn.ai** (the marketing website) to retarget website visitors with ads. This is standard website-level retargeting — "this person visited our website, show them a reminder ad."

### The line we draw: marketing site vs. product experience

This distinction is important to how Evryn operates:

- **Marketing site (evryn.ai):** Standard retargeting pixels are acceptable. Someone visited our website — we can remind them we exist. This is no different from any other company's marketing website.
- **Product experience (conversations with Evryn, the app, anything inside the user's relationship with Evryn):** Zero third-party tracking. What users tell Evryn is private. No advertising platform gets any signal from inside the product. No third-party ad-tech code (SDKs, pixels, or otherwise) runs inside the product experience.

**Broader tracking within the product** would only ever be for product improvement, and would only ever be opt-in.

### What we will NOT do

- **No selling user data.** Ever. To anyone.
- **No ad-tech code inside the product.** We will not embed Facebook SDK, Google Ads SDK, TikTok SDK, or any similar third-party advertising packages inside the product experience.
- **Product analytics are for product improvement only.** When we add analytics tools, they're to understand how the product is used so we can improve it — not to build advertising profiles.

---

## Additional Context for Terms & Privacy Policy

The following items weren't covered by your questions, but they're architecturally significant to Evryn and likely relevant for the Terms & Conditions and/or Privacy Policy. Evryn's structure is unusual enough that some of these wouldn't be obvious to ask about — we want to surface them proactively so the Terms and Privacy Policy can be built with the full picture.

### A note on tone and trust

While of course this document needs to be a legal document first and foremost, user trust is unusually critical to Evryn's core offering, so it also needs to faithfully represent Evryn's trust ethos — the Terms and Privacy Policy are one of the first things a thoughtful user will read, and the language needs to signal who we are. Legal robustness and trust are not at odds. We'd ask the legal team to keep this in mind when drafting: if there's a way to say something that's both legally sound and supports our trust-first posture, we prefer that over standard boilerplate.

### AI-powered automated decision-making

Evryn makes AI-powered judgments about people — who to connect, in what contexts, and why. These decisions meaningfully affect users (determining which connections they're offered and which they're not). Under GDPR Article 22 and evolving US state privacy laws (including CCPA/CPRA), users may have rights regarding automated decisions that significantly affect them.

Currently, **every outbound action Evryn takes is manually approved by a human** (Justin, the founder). No automated decision reaches a user without human review.

We're building toward a model where, at scale, an automated safety gate will replace much of the direct human oversight — checking all outbound messages against safety criteria before they reach users. But some human oversight will remain for consequential decisions as this system is developed and refined.

### Behavioral trust assessment (not a "score")

Evryn builds a qualitative, narrative assessment of each user's trustworthiness as it relates to various types of connections, based on observed behavior — not a numeric credit-score-style number. This assessment determines the contexts in which Evryn will connect a given user with others. It's multidimensional, context-specific, and dynamic (it can improve or degrade over time).

For example, Evryn might trust someone highly for professional connections but have reservations about romantic introductions based on observed behavior — or vice versa. The assessment is private (never shown to other users), contextual (not a universal label), and always evolving.

This is conceptually similar to a credit score in that it affects what services a user can access — but it's structurally different (narrative, not numeric; private; context-specific). The legal team should advise on how to disclose this and how to remain compliant with any "automated profiling" regulations.

### Behavioral filtering, not belief filtering

Evryn filters behavior — predatory conduct, deception, manipulation, coercion — not politics, identity, religion, or worldview. We don't ban users; Evryn simply doesn't connect users beyond what their demonstrated trustworthiness warrants. This distinction is intentional and should be reflected in the Terms.

### Connection types and regulated contexts

Evryn connects people across all life domains — professional, creative, romantic, community, mentorship, and more. This breadth means some connections will touch contexts that overlap with regulated fields: connecting someone to a therapist (medical), a financial advisor (financial), or a lawyer (legal). Evryn is not providing medical, financial, or legal services — she's making introductions between people. But the Terms should include clear disclaimers that Evryn is a connection broker, not a licensed service provider, and that any professional services resulting from a connection are between the individuals involved.

### Safety imprint on account deletion

Covered in Q5 above. When a user deletes their account, personal data is purged but a safety identifier is retained that allows Evryn to recognize a returning identity and remember the nature of our willingness to do business with them — without retaining any personal information. The technical implementation will ensure that no personal data can be recovered from this identifier. It functions similarly to how any business reserves the right to decide what relationship they're willing to offer a returning customer, but implemented with privacy-preserving technology so that no personal data needs to be stored to exercise that right.

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
- Long-term, we may want to consider offering the service to younger users, potentially with accounts administered by a parent or guardian (parent controls the account, approves connections). This isn't near-term, but if there's language we should include now to leave room for it, we'd want to know.

### Sensitive personal data

Users will tell Evryn about deeply personal topics — romantic preferences, health situations, financial circumstances, career struggles, family dynamics, identity-related information. Some of this falls under "sensitive personal data" or "special category data" under various privacy frameworks (GDPR, CCPA, state biometric laws). The Privacy Policy needs to address:

- What sensitive categories Evryn may process
- That this data is used exclusively to serve the user (finding better connections)
- That it is never sold, never used for advertising, never shared with other users without explicit permission
- How it's protected (encryption, access controls, user isolation)

### User isolation as an architectural principle

Each user's relationship with Evryn is structurally isolated. Evryn never reveals one user's information to another — this is enforced at the database level (row-level security), not just by AI instruction. Even if Evryn's AI were somehow confused or manipulated, the architecture prevents data leakage between users because the system physically cannot access User B's data while processing User A's conversation.

**There are precisely two controlled pathways where information can cross between users:**

1. **Evryn-mediated introductions:** When Evryn brokers a connection, she may share a description of one user with another — but the specific wording is explicitly approved by the user whose information is being shared before anything is sent.
2. **Direct messaging after mutual consent:** Users can communicate directly with each other only after both have independently agreed to be in contact. Until both say yes, neither knows the other exists. The mechanics of how this works are carefully crafted — please ask if you need more detail.

Outside of these two pathways, user data never crosses between accounts.

**A note on shared conversations:** Two connected users can invite Evryn to be present in their conversation — this helps her stay informed about the relationship. But Evryn only speaks in private, one-on-one conversations with individual users. She will not speak in shared conversations, ensuring she never accidentally reveals private information from either user's individual relationship with her. This is always opt-in: Evryn is never present unless both parties have invited her.

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

### Long-term jurisdictional architecture (future)

Our long-term architectural vision includes creating a **Swiss foundation** (separate nonprofit entity) as the custodian of Evryn's trust graph and behavioral memory. This structure is designed to maximize user privacy — the US operating company (Evryn Inc.) would access trust data only through narrow, consent-governed APIs, and even the company's own operators would be structurally unable to access private user trust data. The foundation would be governed by a multinational board under a mission-locked charter, benefiting from Switzerland's strong privacy protections.

This is likely many months away from implementation, but the legal team should be aware it's in the architectural roadmap. It may influence how we structure the Terms and Privacy Policy now — for example, reserving the right to transfer trust data to a mission-locked custodial entity dedicated to user privacy protection.

### Entity structure

**Evryn Inc.** — Delaware Public Benefit Corporation. Mission statement: "to foster trusted human connection for our users by developing systems that create high-resonance connections, responsibly steward personal information and insights, and structurally protect emotional wellbeing, informed consent, and relational alignment and trust across every interaction."

---

*Draft prepared 2026-02-16. Fourth pass: age to 18, verification pass-through model, safety identifier generalization, ElevenLabs data flow, connection types disclaimers, tone-and-trust note, shared conversation note, data retention refinements, Jumio transition, data portability simplification.*
