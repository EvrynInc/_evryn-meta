# Privacy Policy & Terms of Service — Legal Team Questionnaire

> **How to use this file:** Draft responses to Fenwick's questionnaire for building Evryn's Terms & Conditions and Privacy Policy. This is a working document — answers will be refined through discussion with legal counsel. Maintained in the repo so we can update it as the product evolves.
>
> **Owner:** Justin (with AC research support)
>
> **Status:** First draft — 2026-02-16

---

## 1. Have you started building out a website/app yet?

Yes. Our marketing website is live at [evryn.ai](https://evryn.ai). It currently serves as a landing page with a waitlist signup form.

The product itself (Evryn's AI-powered connection brokering) is in active development. The first deployment will be email-based — no app or web interface for end users initially. A responsive web application is next, with native mobile apps as a longer-term goal.

---

## 2. Mockups

Other than what you can see on the live site, we don't have mockups yet. We're starting with an email-based pilot (explained below) where the interface *is* email — there's no app UI to mock up. Once the web app version gets further along, we'll provide those.

The reason we're starting with email: we're running a pilot with a film industry gatekeeper who receives ~200 emails/day. Evryn finds the connections worth his time within that volume. He just forwards his inbound email to Evryn — no new interface to learn, no disruption to his workflow.

---

## 3. AI service providers

We're using **Anthropic** (Claude) as our AI provider. Anthropic powers both:

- **The product** — Evryn's conversational AI, email classification, user profiling, and connection brokering all run on Claude's API.
- **Development tooling** — We build with Claude Code (Anthropic's CLI development tool). This is internal and doesn't touch user data.

We'd like to preserve the option to change AI providers if needed. The AI landscape is moving fast, and while Anthropic is well ahead of our needs right now, we're designing with some optionality. That said, we're not building vendor-agnostic abstractions that would add complexity — we're just being mindful about how tightly we couple to any single provider.

---

## 4. Third-party integrations that handle user/customer information

### Currently in use

| Service | What it does | What data flows through it |
|---------|-------------|---------------------------|
| **Google (Gmail / Google Workspace)** | Email infrastructure. Our gatekeeper user (Mark) forwards emails to Evryn's Gmail address (evryn@evryn.ai). Evryn reads, processes, and sends email through her own Google account. | Full email content — sender names, email addresses, message bodies, attachments (metadata only for now — we note that attachments exist but don't process their contents yet). |
| **Anthropic (Claude API)** | AI processing. Email content, user conversations, and user profile data are sent to Anthropic's API so Evryn can read, classify, reason, and compose responses. | Email content, user conversations, profile data, classification reasoning. Anthropic's API usage policy states they do not train on API-submitted data. |
| **Supabase** | Hosted PostgreSQL database. All user records, conversation history, email classifications, connection records, and user profiles are stored here. | All persistent user data. Supabase provides SOC2 compliance, encryption at rest and in transit, and row-level security (which we enforce on all tables). |
| **Vercel** | Hosts the marketing website (evryn.ai). | Waitlist form submissions (name, email). Standard web server logs (IP addresses, user agent, etc.). |
| **HubSpot** | CRM and email marketing. Captures waitlist signups from the website. Will be used for email campaigns. | Names, email addresses, signup metadata. |
| **Cloudflare** | Provides Turnstile (captcha/bot protection) on the waitlist form. | IP addresses and browser fingerprint data (standard for bot detection). Minimal personal data exposure. |
| **Railway** | Cloud hosting for Evryn's backend process (the always-on service that polls email and runs the AI agent). | User data passes through their infrastructure in transit. Railway provides the compute environment. |
| **GitHub** | Source code repository hosting. | Source code only — no customer data is stored in repos. Environment variables and credentials are excluded via .gitignore. |

### Near-term (within 6 months, likely sooner)

| Service | What it does | What data flows through it |
|---------|-------------|---------------------------|
| **Stripe + Stripe Connect** | Payment processing. When we begin charging, Stripe handles all payment card data. Stripe Connect enables peer-to-peer payments between users (e.g., if a connection leads to a freelance engagement). | Evryn never sees or stores payment card numbers. Stripe holds all sensitive financial data. We receive transaction records (amount, timestamp, status) but zero card details. |
| **QuickBooks** | Accounting and bookkeeping. | Payment records pulled from Stripe — just the fact that a payment was received, amounts, and dates. No user-identifying information beyond what's needed for financial records. |
| **iDenfy** | Identity verification. Users verify their identity before Evryn will broker connections for them. The flow: we pass the user to iDenfy, they verify, and iDenfy shares back a verification status. | We send the user to iDenfy's verification flow. iDenfy processes their ID document and biometric data. We receive back: pass/fail status and any flags (e.g., "document appears altered"). **We do not store ID photos or document images** — verification artifacts are discarded after confirmation. Only the yes/no result is retained. |
| **Web search API** (likely Brave Search) | Evryn researches senders before classifying their emails — looking up their company, public profile, etc. to make better judgments about fit. | Sender names, company names, and potentially email addresses are sent as search queries. Only publicly available information is returned. |

### Future (planned but not built)

| Service | What it does | What data flows through it |
|---------|-------------|---------------------------|
| **Vapi** | Voice AI platform — for live voice conversations with Evryn. | Voice audio, transcripts of spoken conversations. |
| **Hume AI** | Emotion/sentiment detection during voice conversations — helps Evryn read the room. | Voice audio analyzed for emotional signals. |
| **ElevenLabs** | Voice synthesis — gives Evryn a speaking voice. | Text of Evryn's responses (not user data, but user context shapes what she says). |
| **Amplitude** | Product analytics — understanding how users interact with the product. Deferred until beta. | User behavior data (screens viewed, actions taken, time spent). |

### Multi-channel communication (under research)

We're researching the feasibility of letting Evryn communicate with users on their preferred platform — email, text (SMS/MMS), WhatsApp, etc. Technically straightforward to implement, but we're carefully considering the security and legal implications of each channel before committing. Each new channel would mean a new integration partner handling user message content.

---

## 5. Other information collected from users

### Directly provided by users

| Data type | How it's collected | Purpose |
|-----------|-------------------|---------|
| **Name and email address** | During onboarding or when they email Evryn | Identity, communication |
| **Conversation content** | Everything users tell Evryn in conversation — their interests, goals, preferences, personal stories, what they're looking for | Building a deep understanding of who they are so Evryn can find the right connections |
| **Feedback on connections** | Users tell Evryn how a connection went — what was good, what was wrong, what was surprising | Evryn learns and improves her judgment |
| **Payment amounts** | Users name their own price for each connection (trust-based pricing model) | Revenue + pricing is itself a trust signal |
| **Identity verification data** | ID document and biometric data submitted to iDenfy during verification | Confirming users are real humans. Verification artifacts are discarded after confirmation (see Q4 above). |

### Derived and inferred by Evryn's AI

This is important and somewhat unusual — Evryn doesn't just store what users tell her. She builds an evolving understanding of each person.

| Data type | How it's created | Purpose |
|-----------|-----------------|---------|
| **User "story"** | Evryn synthesizes everything she learns about a person into a narrative understanding — not a profile with fields, but a written synthesis of who they are. This evolves over time as she learns more. | The story is the foundation for connection matching. It captures cross-domain nuance that structured data can't. |
| **Behavioral trust signals** | Evryn observes and remembers patterns: honesty, reliability, follow-through, tone, ghosting patterns, boundary respect, how someone treats others. This is not a numeric score — it's a narrative assessment. | Trust determines who Evryn will connect a user with. She only introduces people in proportion to how much she trusts them. This is the core mechanism that keeps the platform safe. |
| **Classification decisions** | For each forwarded email, Evryn makes a judgment (gold / pass / edge case) with confidence scoring and written reasoning. | Surfacing the right connections. Also creates an audit trail of her reasoning. |
| **Connection graph** | A map of relationships — who was connected by Evryn, known existing relationships, vouching, relationship strength. | The relationship graph is the long-term intelligence layer. It enables better matching as it grows. |

### On account deletion

This is architecturally important and the legal team should weigh in:

- **Personal data is purged** — conversations, profile, story, preferences, contact information.
- **A non-reversible, salted hash of verified identity is retained.** This hash anchors trust-related memory (risk flags, behavioral patterns) so that bad actors cannot delete their account and create a new one to reset their reputation. The hash cannot be reversed to recover personal information — it only allows Evryn to recognize "I've seen this person before and here's what I remember about their trustworthiness."
- **Analogy we use internally:** "If you shared private letters with a friend — you can take the letters home, they're yours. But your friend's memories and impressions — those are theirs."

The legal team should advise on how to disclose this and whether it's compatible with various privacy regulations (GDPR right to erasure, CCPA deletion rights, etc.).

### Future data types (not yet collected)

- **Voice recordings and transcripts** — if voice interface is built
- **Emotional/sentiment data from voice** — via Hume AI integration
- **Social network mapping** — who users know, inferred from conversation context and declared relationships
- **Location data** — for geographic matching (user-provided, not tracked)

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

- **Top-down:** Partnerships with gatekeepers (high-volume connectors in specific industries) who route their inbound to Evryn.
- **Bottom-up:** Invite-only "whisper cascade" — we grow by solving, proving, and being invited forward. Each invite is meant to feel special because it is.
- **Outreach:** Personal outreach, warm introductions, presence at industry events (starting with LA film festivals and industry gatherings).

We will also run paid advertising to support awareness and growth.

### Analytics — current

- **Google Analytics** on evryn.ai (marketing site) — standard website traffic analytics.
- **HubSpot** — email campaign tracking (opens, clicks) for waitlist/marketing emails.
- No in-product analytics yet (no end-user product interface exists yet).

### Analytics — planned

- **Amplitude** (deferred until beta) — product analytics for understanding how users interact with the web/mobile interface once it exists.
- **Retargeting pixels** — we expect to use standard tracking pixels (Google, potentially Meta) on the **marketing site** to retarget website visitors with ads. This is standard website-level retargeting — it would never be based on what users tell Evryn in private conversation.
- **Broader tracking pixels** within the product experience are a longer-term consideration and would be **opt-in only**.

### What we will NOT do

Evryn's core brand promise is trust, and our data practices reflect that:

- **No selling user data.** Ever. To anyone.
- **No third-party behavioral tracking inside the product.** The marketing site may have standard pixels; the product experience will not have third-party trackers watching what users do.
- **No ad-tech SDKs inside the app.** We will not embed Facebook SDK, Google Ads SDK, TikTok SDK, or similar inside the product. These SDKs collect rich behavioral data from inside the app and send it to ad platforms — that's incompatible with our trust model.
- **Analytics are for product improvement, not ad targeting.** When we add Amplitude or similar, it's to understand how the product is used (so we can improve it), not to build targeting profiles.

### What's an SDK in the advertising context?

An SDK (Software Development Kit) in this context is a package of code from an ad/analytics company (Meta, Google, TikTok, etc.) that gets embedded directly into your mobile app or web application. Unlike a tracking pixel (which just notes "this person visited this page"), an SDK runs inside the app and can collect much richer data — which screens users view, what buttons they tap, how long they spend, what they search for, sometimes even scroll behavior. That data goes back to the ad platform to build detailed targeting profiles. We don't plan to use these inside the product.

---

## Additional Context for Terms & Privacy Policy

The following items weren't covered by your questions, but they're architecturally significant to Evryn and likely relevant for the Terms & Conditions and/or Privacy Policy. We're surfacing them proactively because Evryn's structure is unusual enough that some of these wouldn't be obvious to ask about.

### AI-powered automated decision-making

Evryn makes AI-powered judgments about people — classifying emails, assessing trust, deciding who to connect. These decisions meaningfully affect users (determining which connections they're offered and which they're not). Under GDPR Article 22 and evolving US state privacy laws (including CCPA/CPRA), users may have rights regarding automated decisions that significantly affect them.

Currently, **every outbound action Evryn takes is manually approved by a human** (Justin, the founder). No automated decision reaches a user without human review. This is a strong compliance position and should be documented in the Terms.

At scale, we plan to introduce an automated "publisher" safety gate that checks outbound messages against a safety checklist — but this will supplement human oversight, not replace it for consequential decisions.

### Behavioral trust assessment (not a "score")

Evryn builds a qualitative, narrative assessment of each user's trustworthiness based on observed behavior — not a numeric credit-score-style number. This assessment determines who Evryn will connect the user with. It's multidimensional, context-specific, and dynamic (it can improve or degrade over time).

This is conceptually similar to a credit score in that it affects what services a user can access — but it's structurally different (narrative, not numeric; private, never shown to other users; contextual, not universal). The legal team should advise on how to disclose this and whether it triggers any "automated profiling" regulations.

### Behavioral filtering, not belief filtering

Evryn filters behavior — predatory conduct, deception, manipulation, coercion — not politics, identity, religion, or worldview. We don't ban users; Evryn simply stops connecting untrustworthy people. This distinction is intentional and should be reflected in the Terms.

### Trust imprint on account deletion

Covered in Q5 above. When a user deletes their account, personal data is purged but a non-reversible hash anchors trust memory. This means Evryn can remember "this identity was previously flagged for deceptive behavior" without retaining any personal information. The legal team should advise on GDPR/CCPA compatibility and how to disclose this.

### Data retention

| Data type | Retention policy |
|-----------|-----------------|
| Forwarded emails (work items) | 6-month time-to-live, then purged |
| User profiles and conversation history | Retained for the life of the account |
| Classification decisions and reasoning | Retained indefinitely (audit trail) |
| Trust memory (post-deletion hash) | Retained indefinitely |
| Identity verification artifacts | Discarded immediately after verification |
| Payment records | Per standard financial record-keeping requirements |

### Children and age restrictions

We need to establish a minimum age requirement. Given the nature of the service (brokering real-world connections between adults, including professional and potentially romantic contexts), **18+** is likely appropriate. The legal team should advise on whether any exceptions (e.g., 16+ with parental consent for professional-only connections) make sense, but our default position is 18+.

### Sensitive personal data

Users will tell Evryn about deeply personal topics — romantic preferences, health situations, financial circumstances, career struggles, family dynamics, identity-related information. Some of this falls under "sensitive personal data" or "special category data" under various privacy frameworks (GDPR, CCPA, state biometric laws). The Privacy Policy needs to address:

- What sensitive categories Evryn may process
- That this data is used exclusively to serve the user (finding better connections)
- That it is never sold, never used for advertising, never shared with other users without explicit permission
- How it's protected (encryption, access controls, user isolation)

### User isolation as an architectural principle

Each user's relationship with Evryn is structurally isolated. Evryn never reveals one user's information to another — this is enforced at the database level (row-level security), not just by instruction. Even if Evryn's AI were somehow confused or manipulated, the architecture prevents data leakage between users because the system physically cannot access User B's data while processing User A's conversation.

This is a strong privacy position and worth highlighting in the Privacy Policy.

### Data portability

Users can request an export of their data. The architecture supports this — user profiles are stored in structured format (JSON) and conversations are logged with timestamps. We should define the export format and the process for requesting it.

### Cross-border data considerations

Current infrastructure locations (to be confirmed with each provider):

- **Supabase** — AWS-hosted (region TBD; typically US)
- **Anthropic API** — US-based processing
- **Google (Gmail)** — Google's global infrastructure
- **Railway** — US-based hosting
- **Vercel** — Global CDN, US-based origin

Currently all users are US-based (LA film industry pilot). If/when we serve users in the EU or other jurisdictions with data transfer restrictions, we'll need to address cross-border data flows. The legal team should advise on whether Standard Contractual Clauses or other mechanisms are needed now or can wait until international expansion.

### Long-term jurisdictional architecture (future)

Our long-term architectural vision includes creating a **Swiss foundation** (separate nonprofit entity) as the custodian of Evryn's trust graph and behavioral memory. The US operating company (Evryn Inc.) would access trust data only through narrow, consent-governed APIs. This structure is designed so that even the company's own operators cannot access private trust memory.

This is years away from implementation, but the legal team should be aware it's in the architectural roadmap, as it may influence how we structure the Terms and Privacy Policy now (e.g., reserving the right to transfer trust data to a mission-locked custodial entity).

### Entity structure

- **Evryn Inc.** — Delaware Public Benefit Corporation. Mission statement: "to foster trusted human connection for our users by developing systems that create high-resonance connections, responsibly steward personal information and insights, and structurally protect emotional wellbeing, informed consent, and relational alignment and trust across every interaction."
- **Legal counsel:** Fenwick & West

---

*Draft prepared 2026-02-16. Sources: Evryn Hub (roadmap.md), SYSTEM_OVERVIEW.md, Master Plan Reference, evryn-backend ARCHITECTURE.md, BUILD-EVRYN-MVP.md.*
