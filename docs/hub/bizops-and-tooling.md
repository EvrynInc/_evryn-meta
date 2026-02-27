# BizOps & Tooling

> **How to use this file:** Reference doc for Evryn's business operations tools, infrastructure services, legal entities, and vendor choices. One place to look up what tool we use for what. Read this when evaluating a new tool, checking what we already use, or onboarding someone who needs the operational picture.
>
> **Product architecture** lives in `evryn-backend/docs/ARCHITECTURE.md`. **Aspirational technical vision** lives in `docs/hub/technical-vision.md`. This spoke covers business operations and infrastructure services.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## Legal & Corporate

- **Entity:** Evryn Inc., Delaware Public Benefit Corporation
- **Mission:** "to foster trusted human connection for our users by developing systems that create high-resonance connections, responsibly steward personal information and insights, and structurally protect emotional wellbeing, informed consent, and relational alignment and trust across every interaction."
- **Planned future:** Evryn Foundation (Switzerland, nonprofit) as custodian of Protocol and trust infrastructure — see [Foundation Architecture](detail/evryn-foundation-architecture.md)
- **Legal counsel:** Fenwick & West — strategic partner, not just legal counsel. Their willingness to take on Evryn raises profile, decreases short-term burn (legal cost deferment), and increases access to strategic and capital partners.
- **Incorporation:** via Clerky
- **Trademark:** filed via LegalZoom
- **Age requirement:** 18+ for launch. May consider serving younger users in the future with parent-administered accounts, once there's team and revenue to handle the compliance requirements.
- **Terms of Service & Privacy Policy:** In progress with Fenwick. Full legal context, data practices, compliance questions, and regulatory considerations are centralized in the [Fenwick questionnaire](../legal/privacy-and-terms-questionnaire.md). Once the ToS and Privacy Policy are drafted, they will supersede the questionnaire as the authoritative legal documents and be linked here.

---

## Finance & Accounting

| Tool | Purpose | Notes |
|------|---------|-------|
| **Rho** | Banking — startup-focused, no-fee digital checking | |
| **QuickBooks Online** | Bookkeeping and financial records | |
| **Finmark** (now part of BILL) | Forecasting, runway, scenario analysis | |
| **Gusto** | Payroll — employee and contractor pay | Integrates with QuickBooks |
| **Deel** | International hiring — EOR and contractor payments | |
| **Google Sheets** | Cap table | Early stage; will move to dedicated tool as investors/employees grow |

---

## Fundraising

| Tool | Purpose | Notes |
|------|---------|-------|
| **StartEngine** | Crowdfunding (Reg CF) | Pass-through model — handles all securities compliance |
| **DocSend** | Pitch deck tracking | Share decks with view/time-on-slide tracking |

**StartEngine compliance framing:** Investment invitations are offered through StartEngine under Regulation Crowdfunding (Reg CF). Invitations are conversational and responsive to the user's expressed interest and/or general enthusiasm — never timed to moments of vulnerability or emotional distress. Participation is always optional and non-transactional; users access all platform features without investing. Users can opt out of future investment prompts at any time. This ensures compliance with Reg CF/SEC guidelines (no coercion, exclusivity, or misrepresentation), GDPR/CCPA profiling laws (full disclosure and control), and FTC standards (no manipulation, urgency, or baiting). See the [Fenwick questionnaire](../legal/privacy-and-terms-questionnaire.md) (Crowdfunding and investment section) for the full legal framing including open questions about AI-initiated investment solicitation.

---

## Payments & Identity

| Tool | Purpose | Notes |
|------|---------|-------|
| **Stripe + Stripe Connect** | All payment processing | Evryn never holds or transmits user funds. P2P via Connect. |
| **iDenfy** | Identity verification (current) | Pass-through: Evryn stores only verified flag + date + safety identifier. International coverage, pay-per-success. |
| **Jumio** | Identity verification (long-term) | Almost certainly the right choice at scale (more robust feature set, expanded capabilities). Minimum contract was cost-prohibitive at current stage. iDenfy is more than adequate for now. Revisit when scale justifies it. |

---

## Website & Hosting

| Tool | Purpose | Notes |
|------|---------|-------|
| **Namecheap** | Domain registrar | evryn.ai, .net, .org secured; domain broker pursuing evryn.com |
| **Vercel** | Marketing site hosting | Next.js 15. Production: evryn.ai. Preview: evryn-website.vercel.app. Old rollback: evryn-prelaunch.vercel.app. |
| **Cloudflare** | Turnstile captcha | Waitlist spam protection |
| **Google Analytics** | Website traffic analytics | Marketing site only — never inside the product experience |

---

## Infrastructure & Platform Services

| Tool | Purpose | Notes |
|------|---------|-------|
| **Anthropic (Claude API)** | AI for all agents | Sonnet default, Opus for nuance, Haiku for routine. API billing is separate from Claude Code subscription — different buckets entirely. |
| **Supabase** | PostgreSQL database + serverless backend | TWO separate projects: (1) Agent dashboard project (evryn-team-agents), dashboard at evryn-dashboard.vercel.app; (2) Evryn product project (evryn-backend, was "n8n Prototype" — to be renamed). RLS on all tables. |
| **Google Cloud** | Gmail API + Pub/Sub | Gmail API live polling for evryn@evryn.ai. Pub/Sub scaffolded but not yet wired. |
| **GitHub** | Code repositories | EvrynInc organization |

---

## Customer Management

| Tool | Purpose | Notes |
|------|---------|-------|
| **HubSpot CRM** | CRM and email marketing | Free tier for early audience; scales with growth. Replaced earlier Mailchimp/ConvertKit consideration. |
| **Zendesk** | Support | Earmarked for post-launch; AI-driven support first |
| **Discord** | Community | Early users and supporters |

---

## Project Management & Documentation

| Tool | Purpose | Notes |
|------|---------|-------|
| **Linear** | Backlog and task tracking | Replaced ClickUp. EVR workspace. Free tier. |
| **Slack** | Team communication | |
| **Notion** | Ideation/notes, historical vault | |
| **Google Drive** | Document storage (Docs & Sheets) | |
| **Airtable** | Flexible database | On the table but no specific home yet |

---

## Product Analytics

| Tool | Purpose | Notes |
|------|---------|-------|
| **Amplitude** | User behavior tracking | Deferred until product interface exists |

---

## Voice AI (Future)

| Tool | Purpose | Notes |
|------|---------|-------|
| **Vapi** | Voice AI platform | Researched, not yet integrated. See `docs/research/` for voice research. |
| **Hume AI** | Emotion detection for voice | Researched, not yet integrated |
| **ElevenLabs** | Voice synthesis | Researched, not yet integrated |

---

## Recruitment Platforms (Historical)

Used during the founding team search. Listed for reference:
- YC Co-founder Matching, CoFoundersLab, Pioneer.app, AngelList/Wellfound
- Indie Hackers, FoundersList, Indie.vc Network, LinkedIn
- Upwork, Fiverr, Toptal (freelance/contract work)
- Dribbble, Behance (design talent scouting)

> *The BizOps appendix in the original Master Plan (lines 3104-3210) has longer rationale for each tool choice. The Notion Vault has deeper evaluations.*

---
