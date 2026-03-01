# BizOps & Tooling

> **How to use this file:** Reference doc for Evryn's business operations tools, infrastructure services, legal entities, and vendor choices. One place to look up what tool we use for what. Read this when evaluating a new tool, checking what we already use, or onboarding someone who needs the operational picture.
>
> **Product architecture** lives in `evryn-backend/docs/ARCHITECTURE.md`. **Aspirational technical vision** lives in `docs/hub/technical-vision.md`. This spoke covers business operations and infrastructure services.
>
> **Status key:** Active = currently paying/using. Set up = account exists, not yet in regular use. Planned = selected, will activate when needed. Future = earmarked, no specific timeline.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## Legal & Corporate

- **Entity:** Evryn Inc., Delaware Public Benefit Corporation
- **Mission:** "to foster trusted human connection for our users by developing systems that create high-resonance connections, responsibly steward personal information and insights, and structurally protect emotional wellbeing, informed consent, and relational alignment and trust across every interaction."
- **Planned future:** Evryn Foundation (Switzerland, nonprofit) as custodian of Protocol and trust infrastructure — see [Foundation Architecture](detail/evryn-foundation-architecture.md)
- **Legal counsel:** Fenwick & West — strategic partner, not just legal counsel. Their willingness to take on Evryn raises profile, decreases short-term burn (legal cost deferment), and increases access to strategic and capital partners.
- **Incorporation:** via Clerky ($800 one-time). Still used for some corporate filings; Fenwick handles most legal work now.
- **Trademark:** filed via LegalZoom
- **Age requirement:** 18+ for launch. May consider serving younger users in the future with parent-administered accounts, once there's team and revenue to handle the compliance requirements.
- **Terms of Service & Privacy Policy:** In progress with Fenwick. Full legal context, data practices, compliance questions, and regulatory considerations are centralized in the [Fenwick questionnaire](../legal/privacy-and-terms-questionnaire.md). Once the ToS and Privacy Policy are drafted, they will supersede the questionnaire as the authoritative legal documents and be linked here.

---

## Core Operations

| Tool | Purpose | Status | Cost | Notes |
|------|---------|--------|------|-------|
| **Google Workspace** | Email, docs, drive — evryn.ai domain | Active | ~$18/seat/mo (2 seats: Justin + Evryn) | Will scale to ~10 seats when agents come online (~$180/mo) |
| **Bitwarden** | Credential and secrets management | Active | Free tier | `.env` backup for all repos |
| **Zoom** | Business phone number | Active | ~$11/mo | Phone presence only — not using for video |
| **Canva** | Design | Active | ~$15/mo | Minimal use; kept on discounted rate |

---

## Finance & Accounting

| Tool | Purpose | Status | Notes |
|------|---------|--------|-------|
| **Rho** | Banking — startup-focused, no-fee digital checking | Active | |
| **QuickBooks Online** | Bookkeeping and financial records | Planned | Tax season priority — expect active within ~1 month |
| **Finmark** (now part of BILL) | Forecasting, runway, scenario analysis | Future | Want this when agents are running, budget permitting |
| **Gusto** | Payroll — employee and contractor pay | Future | No employees yet. Integrates with QuickBooks |
| **Deel** | International hiring — EOR and contractor payments | Future | No international hires yet |
| **Carta** | Cap table management | Active | Free tier. Standard for equity management; replaces earlier Google Sheets approach. |

---

## Fundraising

| Tool | Purpose | Status | Notes |
|------|---------|--------|-------|
| **StartEngine** | Crowdfunding (Reg CF) | Planned | Pass-through model — handles all securities compliance |
| **DocSend** | Pitch deck tracking | Future | Share decks with view/time-on-slide tracking |

**StartEngine compliance framing:** Investment invitations are offered through StartEngine under Regulation Crowdfunding (Reg CF). Invitations are conversational and responsive to the user's expressed interest and/or general enthusiasm — never timed to moments of vulnerability or emotional distress. Participation is always optional and non-transactional; users access all platform features without investing. Users can opt out of future investment prompts at any time. This ensures compliance with Reg CF/SEC guidelines (no coercion, exclusivity, or misrepresentation), GDPR/CCPA profiling laws (full disclosure and control), and FTC standards (no manipulation, urgency, or baiting). See the [Fenwick questionnaire](../legal/privacy-and-terms-questionnaire.md) (Crowdfunding and investment section) for the full legal framing including open questions about AI-initiated investment solicitation.

---

## Payments & Identity

| Tool | Purpose | Status | Notes |
|------|---------|--------|-------|
| **Stripe + Stripe Connect** | All payment processing | Planned | Evryn never holds or transmits user funds. P2P via Connect. |
| **iDenfy** | Identity verification (current choice) | Planned | Pass-through: Evryn stores only verified flag + date + safety identifier. International coverage, pay-per-success. |
| **Jumio** | Identity verification (long-term) | Future | More robust feature set at scale. Minimum contract was cost-prohibitive at current stage. iDenfy is more than adequate for now. Revisit when scale justifies it. |

---

## Website & Marketing

| Tool | Purpose | Status | Cost | Notes |
|------|---------|--------|------|-------|
| **Namecheap** | Domain registrar | Active | | evryn.ai, .app, .foundation, .net, .online, .org secured. Domain broker pursuing evryn.com. |
| **Vercel** | Marketing site hosting | Active | ~$22/mo | Next.js 15. Production: evryn.ai. Preview: evryn-website.vercel.app. |
| **Cloudflare** | Turnstile captcha | Active | Free | Waitlist spam protection |
| **Google Analytics** | Website traffic analytics | Planned | Free | Marketing site only — never inside the product experience. Setup imminent. |
| **X** | Social media presence | Active | ~$9/mo | Marketing and brand visibility |

---

## Infrastructure & Platform Services

| Tool | Purpose | Status | Notes |
|------|---------|--------|-------|
| **Anthropic (Claude API)** | AI for all agents and product | Active | Sonnet default, Opus for nuance, Haiku for routine. API billing is usage-based and separate from Claude Code subscription. |
| **Claude Max** | Claude Code + claude.ai | Active | $100/mo. Justin's primary development tool — building everything with Claude Code. |
| **Supabase** | PostgreSQL database + serverless backend | Active | TWO separate projects: (1) Agent dashboard project (evryn-team-agents), dashboard at evryn-dashboard.vercel.app; (2) Evryn product project (evryn-backend — needs rename from "n8n Prototype"). RLS on all tables. |
| **Google Cloud** | Gmail API + Pub/Sub | Active | Gmail API live polling for evryn@evryn.ai. Pub/Sub scaffolded but not yet wired. |
| **GitHub** | Code repositories | Active | ~$9/mo. EvrynInc organization. |

---

## Customer Management

| Tool | Purpose | Status | Notes |
|------|---------|--------|-------|
| **HubSpot CRM** | CRM and email marketing | Active | ~$16/mo. Scales with growth. Replaced earlier Mailchimp/ConvertKit consideration. |
| **Zendesk** | Support | Future | AI-driven support first; Zendesk when volume requires it |
| **Discord** | Community | Set up | Backup/future channel for early users and supporters |

---

## Project Management & Documentation

| Tool | Purpose | Status | Notes |
|------|---------|--------|-------|
| **Linear** | Backlog and task tracking | Active | Free tier. EVR workspace. Replaced ClickUp. |
| **Slack** | Team communication | Planned | ~$4.38/seat/mo. For agents + Evryn when Lucas comes online (~10 seats = ~$44/mo). |
| **Notion** | Ideation/notes, historical vault | Active | Light use — some docs still linked. Historical content from early planning. |
| **Google Drive** | Document storage (Docs & Sheets) | Active | Via Google Workspace |

---

## Product Analytics

| Tool | Purpose | Status | Notes |
|------|---------|--------|-------|
| **Amplitude** | User behavior tracking | Future | Deferred until product interface exists |

---

## Voice AI (Future)

| Tool | Purpose | Status | Notes |
|------|---------|--------|-------|
| **Vapi** | Voice AI platform | Future | Researched, not yet integrated. See `docs/research/` for voice research. |
| **Hume AI** | Emotion detection for voice | Future | Researched, not yet integrated |
| **ElevenLabs** | Voice synthesis | Future | Researched, not yet integrated |

---

## Contractor & Recruitment Platforms

**Historical — founding team search:**
- YC Co-founder Matching, CoFoundersLab, Pioneer.app, AngelList/Wellfound
- Indie Hackers, FoundersList, Indie.vc Network, LinkedIn
- Dribbble, Behance (design talent scouting)

**Contractor sourcing (used, not currently active):**
- **Toptal** — used for UX (Manuele Capacci) and product (Salil Chatrath) contractors. High quality talent, but 67% markup on contractor rates. Would use again for quality if budget allows; explore alternatives for cost.
- **Upwork, Fiverr** — available for future freelance/contract needs

> *The BizOps appendix in the original Master Plan (lines 3104-3210) has longer rationale for each tool choice. The Notion Vault has deeper evaluations.*

---
