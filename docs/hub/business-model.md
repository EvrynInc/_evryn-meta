# Business Model

> **How to use this file:** Full depth on how Evryn makes money and the financial model behind it. The Hub carries the business model shape (broker, per-connection, three streams); this spoke carries pricing mechanics, wallet structure, market sizing, and financial assumptions. Read this when working on anything related to payments, pricing, growth financials, or competitive positioning.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## Core Principle

Evryn monetizes transformation, not attention. **She only gets paid when she helps you actually move forward.** No ads. No paywalls. No subscriptions.

---

## Trust-Based Pricing

Uniform pricing and subscriptions don't fit Evryn's model. A casual introduction might be worth $1 (or free), while an executive connection could be worth $10,000 — the price points are essentially infinite. Subscriptions simultaneously overprice low-value users (causing churn) and radically underprice high-value connections (losing substantial upside). Trust-based pricing captures the full spectrum.

Users pay what they believe is fair for each connection — for both the particular connection *and* the ongoing relationship they want to build with Evryn. There is no minimum and no maximum. If it seems fair to Evryn, she takes it. If not, she works with you to find something right for both.

Users who find it stressful to name their own price can ask Evryn for a suggested price.

This is also a trust signal: if someone lowballs consistently, Evryn notices. A low payment doesn't damage trust *if* there's a good reason and it feels fair. But exploitative pricing tells Evryn something about character. "If I can't even trust this person not to rip me off, I'm definitely not going to be willing to connect them to you."

**Post-connection adjustments:** if the connection was better than expected, user can increase payment. If worse, they can decrease — all the way to zero if that's fair. Evryn may insist on a full refund if a connection went badly. "No worries — I've returned your payment to your Evryn Wallet. These things happen. But it will really help me if you tell me what didn't feel right." This is a 100% satisfaction guarantee.

---

## Three Revenue Streams

1. **Trust-Based Match Payments** — per-connection, user-named price, 100% satisfaction guarantee. Payment = trust signal.
2. **Post-Match Transactions** — user-to-user payments (via Stripe Connect) for follow-up work, tipping, repeat gigs. Evryn takes a small, trust-aligned commission. She's a relationship steward, not a marketplace.
3. **Participant-Based Business Access ("Ads Without Ads")** — companies become users. They're introduced only if they're the best fit for what you're asking for. Users can exclude any or all companies. No boosting, no buying visibility. Businesses earn access, they don't buy it. Data stays in Evryn's system — Evryn doesn't hand over user information. Users give explicit per-introduction consent.

---

## Payments Architecture

**Stripe handles all monetary transactions.** Evryn never holds, transmits, or has access to user funds.

- **Pre-purchases** are completed transactions (processed through Stripe), not held funds.
- **Peer-to-peer payments** flow through Stripe Connect — Stripe handles the entire payment lifecycle. Evryn takes a small commission.
- **Evryn Credit** is non-monetary promotional value — like store credit, not a financial instrument. Not withdrawable. Can be used to pay for connections, can be re-gifted. Cannot be used for peer-to-peer payments (Cash only for those).

### Evryn Wallet

Users maintain a wallet balance (USD denominated) with three types:
- **Cash** — user-funded, withdrawable
- **Available Evryn Credit** — bonus credits from Evryn, non-withdrawable, fully spendable, can be re-gifted
- **Locked Evryn Credit** — unlocks based on conditions (referral rewards, etc.)

Supports: pre-purchases, microtransactions, tipping, refunds, peer-to-peer payments.

### Refunds & Disputes

Users can request full or partial refunds from Evryn. Payment type is preserved (cash refunded as cash, credit as credit). However, Evryn is NOT a party to service agreements between users — if users hire each other, those agreements are theirs. Evryn observes behavior across all phases though, and dishonest behavior shapes her trust graph.

### Referral Rewards

Users who refer someone to Evryn may receive Evryn Credit — but only after the referred user completes their first paid connection. Rewards tied to real engagement, not just signups.

---

## Why This Model Wins

Legacy platforms monetize *unsuccessful attempts* — they profit from churn, false hope, and addictive loops. Their incentive is to keep you almost-succeeding. Even Hinge — which claims to be "designed to be deleted" — under the hood is optimized for volume: engagement-weighted matching, visibility-boosted, designed to sell more swipes, not better fits.

Evryn wins only when the match *works*. That's not a marketing line — it's structural.

Evryn earns across multiple verticals (romantic, creative, logistical, professional), over years not weeks, on outcomes not usage. Each success creates more demand and deepens the trust graph. LTV is structurally exponential because trust compounds. Someone who meets their soulmate? That's just the beginning — they'll still come back to hire a wedding photographer, find a songwriting partner, meet a developer, move to a new city.

Legacy apps extract until users leave. Evryn earns because users stay. "Trust is more monetizable than addiction — if you can earn it."

**"We're not building a product. We're building a network of human outcomes, continually expanding through trust."**

> *Marketing note: The original Master Plan has extensive competitive analysis prose (lines 770-848) — the "casino model" framing, the structural moat argument, the LTV analysis. Excellent for investor pitches.*

---

## Financial Model Assumptions

- **ARPU model:** ~6 successful matches/month × ~$8/match = ~$576 ARPU/year (blended across business + consumer)
- **User archetypes ("avatars"):** Predictive archetypes based on observed behavior, not demographics. Each with unique trust postures and monetization curves:
  - **Seekers** — emotionally primed, looking for meaning. Win their heart → win their loyalty.
  - **Builders** — need trust scaffolding and long-term potential. Respond to vision.
  - **Operators** — need reliability, speed, frictionless delivery. Practical value first.
  - **Casual Connectors** — thrive on usefulness and simplicity. Ideal for low-friction viral mechanics.
  - **Social Anchors** — engage around belonging. When they believe, they bring their community.
  - **Torchbearers** — need to feel chosen. Once in, they become firestarters.
  - **Legacy Gatekeepers** — must be invited at the right moment with the right social proof.
  - The long tail: institutions, niche personalities, quiet lurkers — they build the floor.
- **Network density thresholds:** ~150 = testing; ~300 = early magic; ~500 (diverse roles) = resonant matches common; 800+ = multi-intent matches, quality improves faster than growth

---

## Market Size Framework

Evryn uses a trust-filtered market model:

- **TAM** — everyone who could benefit from high-trust introductions (global). Intentionally conceptual.
- **SAM** — geographies and ecosystems actively targeted within 3-5 years.
- **TSM (Trusted Serviceable Market)** — SAM after identity and behavior filters. ~60-70% trust-eligible, ~15-20% soft-limited to low-stakes, ~8-12% hard-excluded. Filters shrink TAM but strengthen LTV.
- **SOM/yr** — annual paying penetration of TSM. Varies by maturity: 35-55% (igniting), 55-75% (maturing), 70-90% (dense/steady state).

| Scenario | SAM | TSM | SOM/yr | Revenue @ $576 ARPU |
|----------|-----|-----|--------|---------------------|
| LA Film Ecosystem | 200K | 120-140K | 84-126K | $48-73M |
| Multi-City Creative (10 cities) | 2M | 1.2-1.4M | 660K-1.05M | $380-605M |
| U.S. Wide (cross-context) | 40M | 24-28M | 13.2-21M | $7.6-12.1B |
| Global First-Wave (50-75 cities) | 200M | 120-140M | 66-126M | $38-72.6B |

*All figures are order-of-magnitude models for build and capital planning.*

---

## Capital Strategy

**Raised to date:** $40K ($15K founder capital + $25K early angel investor).

The founding capital philosophy is **user-led, backed by traditional VC as needed**. The plan had been to pursue a very-carefully-vetted set of angels and VCs, though the approach is being reconsidered in light of the AI-first pivot (dramatically lower burn changes the calculus — see GTM spoke for context). Crowdfunding (via StartEngine, Reg CF) is fueled by user belief, not performance marketing — closing the loop between trust, traction, and growth. StartEngine handles all securities compliance as a pass-through model.

---

*Spoke created 2026-02-20 by AC. Reorganized from MPR Business Model section with corrections from clarifications doc and legal questionnaire.*
