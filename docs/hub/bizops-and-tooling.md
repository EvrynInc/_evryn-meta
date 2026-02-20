# BizOps & Tooling

> **How to use this file:** Reference doc for Evryn's business operations tools, legal entities, and vendor choices. One place to look up what tool we use for what. Read this when evaluating a new tool, checking what we already use, or onboarding someone who needs the operational picture.
>
> **Product/tech stack** lives in `SYSTEM_OVERVIEW.md` and `evryn-backend/docs/ARCHITECTURE.md`. This spoke covers business operations only.

---

## Legal & Corporate

- **Entity:** Evryn Inc., Delaware Public Benefit Corporation
- **Mission:** "to foster trusted human connection for our users by developing systems that create high-resonance connections, responsibly steward personal information and insights, and structurally protect emotional wellbeing, informed consent, and relational alignment and trust across every interaction."
- **Planned future:** Evryn Foundation (Switzerland, nonprofit) as custodian of Protocol and trust infrastructure — see [long-term-vision spoke](long-term-vision.md)
- **Legal counsel:** Fenwick & West (strategic legal partner)
- **Incorporation:** via Clerky
- **Trademark:** filed via LegalZoom
- **Age requirement:** 18+ for launch. May consider serving younger users in the future with parent-administered accounts, once there's team and revenue to handle the compliance requirements.

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

---

## Payments & Identity

| Tool | Purpose | Notes |
|------|---------|-------|
| **Stripe + Stripe Connect** | All payment processing | Evryn never holds or transmits user funds. P2P via Connect. |
| **iDenfy** | Identity verification (current) | Pass-through: Evryn stores only verified flag + date + safety identifier. International coverage, pay-per-success. |
| **Jumio** | Identity verification (at scale) | Being evaluated as alternative to iDenfy |

---

## Website & Hosting

| Tool | Purpose | Notes |
|------|---------|-------|
| **Namecheap** | Domain registrar | evryn.ai, .net, .org secured; domain broker pursuing evryn.com |
| **Vercel** | Marketing site hosting | Next.js. Pivoted from Webflow (no-code) to Next.js for more control. |
| **Google Analytics** | Website traffic analytics | Marketing site only — never inside the product experience |

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
| **Linear** | Backlog and task tracking | Replaced ClickUp. |
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

## Recruitment Platforms (Historical)

Used during the founding team search. Listed for reference:
- YC Co-founder Matching, CoFoundersLab, Pioneer.app, AngelList/Wellfound
- Indie Hackers, FoundersList, Indie.vc Network, LinkedIn
- Upwork, Fiverr, Toptal (freelance/contract work)
- Dribbble, Behance (design talent scouting)

> *The BizOps appendix in the original Master Plan (lines 3104-3210) has longer rationale for each tool choice. The Notion Vault has deeper evaluations.*

---

*Spoke created 2026-02-20 by AC. Reorganized from MPR Legal, Corporate & Tools section. Tool statuses updated where known (pivots noted inline).*
