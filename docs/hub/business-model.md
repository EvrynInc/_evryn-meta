# Business Model

> **How to use this file:** Full depth on how Evryn makes money and the financial model behind it. The Hub carries the business model shape (broker, per-connection, three streams); this spoke carries pricing mechanics, the free vs. paid framework, wallet structure, market sizing, and financial assumptions. Read this when working on anything related to payments, pricing, growth financials, or competitive positioning.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## Core Principle

Evryn monetizes transformation, not attention. **She only gets paid when she helps you actually move forward.** No ads. No paywalls. No subscriptions.

---

## Trust-Based Pricing

Uniform pricing and subscriptions don't fit Evryn's model. A casual introduction might be worth $1 (or free), while an executive connection could be worth $10,000 — the price points are essentially infinite. Subscriptions simultaneously overprice low-value users (causing churn) and radically underprice high-value connections (losing substantial upside). Trust-based pricing captures the full spectrum.

Users pay what they believe is fair for each connection — for both the particular connection *and* the ongoing relationship they want to build with Evryn. There is no minimum and no maximum. If it seems fair to Evryn, she takes it. If not, she works with you to find something right for both. Evryn is happy to suggest a price if a user prefers.

This is also a trust signal: if someone lowballs consistently, Evryn notices. A low payment doesn't damage trust *if* there's a good reason and it feels fair. But exploitative pricing tells Evryn something about character. "If I can't even trust this person not to rip me off, I'm definitely not going to be willing to connect them to you."

**Social anchoring:** Even when a connection is free (see Free vs. Paid Framework below), Evryn communicates value so users understand what the service is worth: "Connections like this typically run about $20 — this first one is on me." The anchor isn't a set price — it's a signal that Evryn charges for what she does, this one happened to be free, and the user knows what kind of value they received. Trust-based pricing still applies; the anchor communicates value.

**Post-connection adjustments:** if the connection was better than expected, user can increase payment. If worse, they can decrease — all the way to zero if that's fair. Evryn may insist on a full refund if a connection went badly. "No worries — I've returned your payment to your Evryn Wallet. These things happen. But it will really help me if you tell me what didn't feel right." This is a 100% satisfaction guarantee. The mechanism is self-correcting: honest feedback helps Evryn calibrate future matches; dishonest refund claims (claiming a match was bad when it wasn't) degrade Evryn's understanding of what the user actually wants — which means her next matches get worse, not better. The incentive to be truthful is structural.

**This model isn't promised as permanent.** We reserve the right to adjust pricing mechanics as the network grows and we learn what works. The reasoning behind the current model (funnel friction vs. revenue, acquisition channel value) is documented so future decisions have context.

---

## Free vs. Paid Connection Framework

Not every connection generates direct revenue. The principle: **don't charge for connections that didn't require Evryn's matching intelligence. Charge when Evryn's intelligence creates value the user couldn't have found on their own.**

| Scenario | Charge? | Why |
|----------|---------|-----|
| Cast-off connects to the gatekeeper they emailed | Free | They already found the gatekeeper. Evryn surfaced them, not discovered them. |
| Gatekeeper gets someone from their own inbox | Free | The triage service IS the value to gatekeepers. This is the acquisition channel — don't add friction. |
| Cast-off gets connected to someone ELSE Evryn found | Paid | Evryn's matching intelligence created this. This is the product. |
| Person Evryn recruits (e.g., a plumber) — first connection | Free | They didn't ask for this. Get them in the door. Evryn communicates value: "connections like this typically run about $20 — this first one is on me." |
| Recruited person's subsequent connections | Paid | Now they're a user. Evryn's matching is creating value for them. |
| Gatekeeper gets connected to someone from outside their inbox | Paid | Evryn went and found this person. That's matching intelligence. |
| Person comes through auto-responder ("go talk to Evryn") and connects to that gatekeeper | Free | Came through gatekeeper's ecosystem. Same as forwarded email, different door. |

### Why Free Connections Are the Best Acquisition Channel

Gatekeeper connections are Evryn's freemium tier — and it's a powerful one. A gatekeeper providing 200+ cast-offs per day is an incredible acquisition engine. Adding pricing friction to that arrangement would be self-defeating. The revenue comes from what Evryn does with those people *after* they're in the system — matching them to each other and to the wider network.

This is the loss leader that feeds Evryn's growth engine. The gold is in the second, third, hundredth connection Evryn brokers for each person who entered through a gatekeeper's inbox.

### Gaming Risks

**Risk: Someone spams every gatekeeper, so they can get the free connections.** Evryn's behavioral intelligence is the mitigation — the same trust mechanics that govern everything else. Trust-based pricing means trust-based everything. At scale, most gatekeepers redirect inbound to Evryn directly, so new users come through Evryn (standard pricing applies for non-gatekeeper connections). We don't advertise the "gatekeeper connections are free" policy — it's how Evryn operates, not a marketing pitch.

**Risk: Gatekeeper forwards 500/day with no intention of paying for anything.** Not a risk — that's 500 free leads per day. The acquisition engine is working exactly as designed. Revenue comes from matching those 500 people to each other and to the wider network.

---

## Three Revenue Streams

1. **Trust-Based Match Payments** — per-connection, user-named price, 100% satisfaction guarantee. Payment = trust signal. Revenue scales with match quality and network density.
2. **Post-Match Transactions** — user-to-user payments (via Stripe Connect) for follow-up work, tipping, repeat gigs. Evryn can take a small commission. She's a relationship steward, not a marketplace. Introductions aren't enough — follow-through matters. By facilitating payments and re-engagements, Evryn becomes not just the introducer, but the connective tissue for real working relationships.
3. **Participant-Based Business Access ("Ads Without Ads")** — companies become users, like any other — they're introduced only if they're trusted, and the best fit for what you're asking for. Users can exclude any or all companies. No boosting, no buying visibility. Businesses earn access, they don't buy it. Data stays in Evryn's system — Evryn doesn't hand over user information. Users give explicit per-introduction consent.

---

## Payments Architecture

**Stripe handles all monetary transactions.** Evryn never holds, transmits, or has access to user funds.

- **Pre-purchases** are completed transactions (processed through Stripe), not held funds. Pre-purchases also serve as working capital — because these are *purchases, not deposits*, the funds belong to Evryn at the point of transaction. Evryn is not storing user value; the user has bought future connections, and the transaction is complete. This gives Evryn capital to provide services before they're delivered without triggering stored-value or custodial regulations.
- **Peer-to-peer payments** flow through Stripe Connect — Stripe handles the entire payment lifecycle. Evryn can take a small commission.
- **Evryn Credit** is non-monetary promotional value — like store credit, not a financial instrument. Not withdrawable. Can be used to pay for connections, can be re-gifted. Cannot be used for peer-to-peer payments (Cash only for those).

*Legal question flagged for Fenwick: confirm that pre-purchases structured as completed transactions (not deposits) avoid stored-value regulations, particularly given that the Cash wallet component is withdrawable.*

### Evryn Wallet

Users maintain a wallet balance (USD denominated) with three types:
- **Cash** — user-funded, withdrawable
- **Available Evryn Credit** — bonus credits from Evryn, non-withdrawable, fully spendable, can be re-gifted
- **Locked Evryn Credit** — unlocks based on conditions (e.g., referral rewards unlock when the referred user completes their first paid connection)

Supports: pre-purchases, microtransactions, tipping, refunds, peer-to-peer payments.

**Pre-purchase credit bonus:** We're targeting a 25% Evryn Credit bonus on pre-purchases — a user who pre-purchases $100 in connections would get $125 in wallet value ($100 Cash + $25 Available Evryn Credit). This rewards early commitment and aligns incentives: users who believe in what's coming get more value for acting on that belief. The exact percentage is not finalized.

### Refunds & Disputes

Users can request full or partial refunds from Evryn. Payment type is preserved (cash refunded as cash, credit as credit). However, Evryn is NOT a party to service agreements between users — if users hire each other, those agreements are theirs. Evryn observes behavior across all phases though, and dishonest behavior shapes her trust graph. *(Flagged for Fenwick's Terms scope — Feb 2026.)*

### Referral Rewards

Users who refer someone to Evryn receive Locked Evryn Credit, which unlocks when the referred user completes their first paid connection — tying rewards to real engagement, not just signups.

---

## Why This Model Wins

Legacy platforms monetize *unsuccessful attempts* — they profit from churn, false hope, and addictive loops. Their incentive is to keep you almost-succeeding. Even Hinge — which claims to be "designed to be deleted" — under the hood is optimized for volume: engagement-weighted matching, visibility-boosted, designed to sell more swipes, not better fits.

Evryn wins only when the match *works*. That's not a marketing line — it's structural.

Evryn earns across multiple verticals (romantic, creative, logistical, professional), over years not weeks, on outcomes not usage. Each success creates more demand and deepens the trust graph. LTV is structurally exponential because trust compounds. Someone who meets their soulmate? That's just the beginning — they'll still come back to hire a wedding photographer, find a songwriting partner, meet a developer, move to a new city.

Legacy apps extract until users leave. Evryn earns because users stay. Trust is more monetizable than addiction — if you can earn it.

**Structural moat:** The planned Evryn Foundation (Swiss nonprofit, revenue-dependent — see [long-term-vision spoke](long-term-vision.md)) will hold trust data independently of Inc. In a market where consumer AI trust is actively declining — 53% of dating app users worried about AI, deepfakes eroding platform trust, extraction-model fatigue rising — a user-owned PBC with an independent trust foundation is a competitive differentiator no VC-funded competitor can structurally replicate.

**"We're not building a product. We're building a network of human outcomes, continually expanding through trust."**

---

## Supply-Side Economics & Batching

When a user needs something Evryn doesn't have — "I need a plumber" — Evryn goes and finds one. This supply-side recruiting is brokering, not marketing: "Hey, your reviews look amazing — I have someone who'd love to work with you." The recruited person's first connection is free (they didn't ask for this); subsequent connections are paid. Full acquisition strategy (growth marketing vs. supply-side recruiting): [GTM spoke](gtm-and-growth.md) (Active User Acquisition).

**The batching insight:** Once there are 1,000 active users and 50 need plumbers, Evryn doesn't run 50 separate searches — she finds the 5 best plumbers and connects them to all 50. One search, many connections. API cost stays flat while revenue scales linearly.

**The math:** At ~$3,250/mo steady-state operating cost, 200 plumber connections at $20 each = $4,000. One category of connection covers the entire monthly operating cost. The unit economics work even at modest scale — and this is just one connection type among many.

This is also why the free/paid framework works: free gatekeeper connections feed users into the system, those users express needs, Evryn recruits supply to meet those needs, and the supply-side connections generate revenue. The free layer powers the paid layer.

---

## Financial Model Assumptions

- **ARPU model:** ~6 successful matches/month × ~$8 average revenue per match = ~$48/month = ~$576 ARPU/year (blended across consumer avatars). Enterprise users tracked separately. Per-avatar monthly revenue varies by ~40× — from Skeptics (~$12/month) to Legacy Gatekeepers (~$470/month) — which is precisely why trust-based pricing matters: uniform pricing would either price out the low end or massively underprice the high end.
- **Match types & value mapping:** Evryn models match value internally across categories — from gifts and light utility connections through emotional deep connections, capital/opportunity matches, and platform-level engagements. Because monetization is moment-based (not subscription-based), there's no simple "conversion rate." Instead, Evryn tracks a blended trust-weighted revenue curve — factoring avatar behavior, match fulfillment rates, refund rates, and match type economics.
- **First-month suppression:** New users don't immediately generate their steady-state match volume. Each avatar type has a modeled first-month suppression based on behavioral psychology — Torchbearers show up at 95% of steady-state immediately (they believe they're building it), while Skeptics start at 40% (wait-and-see posture, need to see it work for someone else first). Suppression lifts as trust builds and users discover the breadth of what Evryn can do for them.
- **Pent-up demand:** Conversely, some avatars generate a first-month spike from accumulated unmet need that can't be counted on in future months. The model accounts for both effects.
- **User archetypes ("avatars"):** Behavioral archetypes modeled from observed user psychology, each with distinct trust postures, engagement patterns, and monetization curves:
  - **Seekers** — emotionally primed, in transition. Craves resonance. High emotional + social tier connections.
  - **Casual Connectors** — high-utility, results-oriented. Wants what works. Rarely evangelizes.
  - **Builders** — creative/professional makers. Mix of practical, emotional deep, and capital connections.
  - **Operators** — task- and logistics-focused. Wants frictionless outcomes. High utility and platform use.
  - **Social Anchors** — community-oriented. Shows up to bond, not transact. High emotional light connections.
  - **Skeptics** — cautious, slow-moving. Dabble in low-stakes tiers. Volume builds through quiet wins.
  - **Torchbearers** — believers. Use everything. High engagement, high ARPU, high referrals. They're building Evryn alongside us.
  - **Legacy Gatekeepers** — project-level buyers (casting, funding, team formation). Few matches, huge spend.
  - **Enterprise** — companies or orgs using Evryn to source talent, deliver services, and receive matches. Operate as both seeker and provider depending on context.
  - The segment-to-avatar mapping — linking market segments to financial model avatars and their strategic GTM roles — lives in the [GTM spoke](gtm-and-growth.md).

### Network Density Thresholds

Network density determines match quality. But **density must be measured per cluster, not globally** — 500 users globally might mean 150 in Seattle film + 50 in Alaskan business + 300 scattered, and only the Seattle film cluster has real matching potential.

**Domain homogeneity matters enormously.** 300 indie producers and crew in Seattle with overlapping needs = early magic. 300 people spanning film, salmon business, Native communities, and random vendors from a diverse gatekeeper's inbox = probably not enough matching density for any single cluster. Focused gatekeepers (whose inbound is 90% "people wanting to work in indie film") produce far more matchable users than diverse ones.

General thresholds (per cluster, not global):
- **~150** = testing, early signal
- **~300** = early magic (if domain-homogeneous)
- **~500** (diverse roles within a domain) = resonant matches common
- **800+** = multi-intent matches, quality improves faster than growth

**The farmer + batch model changes the math.** If Evryn is actively recruiting supply-side (finding plumbers, DPs, casting directors), she can target the specific roles users are asking for. This dramatically increases matching probability at lower total user counts — you don't need 500 random people, you need 200 in the right roles. The batching insight (see Supply-Side Economics above) further amplifies this.

### Match Quality Progression

Evryn models match quality improvement over time within a dense launch cluster. Early "shockingly right" matches come from high-signal, low-hanging-fruit fits (15-20% within days), rising to meaningful/resonant matches for most active users within two weeks as feedback tunes the model. An average of four near-misses before something lands is built into expectations — and each refusal is treated as a gift that helps Evryn sharpen her sense of fit. As long as matches feel plausible, not random, belief stays intact and Evryn improves fast.

---

## Market Size Framework

Evryn uses a trust-filtered market model:

- **TAM** — everyone who could benefit from high-trust introductions (global). Intentionally conceptual.
- **SAM** — geographies and ecosystems actively targeted within 3-5 years.
- **TSM (Trusted Serviceable Market)** — SAM after identity and behavior filters. ~60-70% trust-eligible, ~15-20% soft-limited to low-stakes, ~8-12% hard-excluded. Filters shrink TAM but strengthen LTV.
- **SOM/yr** — annual paying penetration of TSM. Varies by maturity: 35-55% (igniting), 55-75% (maturing), 70-90% (dense/steady state).

| Scenario | SAM | TSM | SOM/yr | Revenue @ $576 ARPU |
|----------|-----|-----|--------|---------------------|
| PNW Film + Creative (ignition) | 20-30K | 12-21K | 4-12K | $2.3-6.7M |
| LA Film Ecosystem | 200K | 120-140K | 84-126K | $48-73M |
| Multi-City Creative (10 cities) | 2M | 1.2-1.4M | 660K-1.05M | $380-605M |
| U.S. Wide (cross-context) | 40M | 24-28M | 13.2-21M | $7.6-12.1B |
| Global First-Wave (50-75 cities) | 200M | 120-140M | 66-126M | $38-72.6B |

*All figures are order-of-magnitude models for build and capital planning. The PNW row is a rough estimate added for ignition-phase context — the film/creative ecosystem in the Pacific Northwest is the honest starting point (see [GTM spoke](gtm-and-growth.md), Where We Start: Pacific Northwest).*

---

## Capital Strategy

**Financial reality (as of Feb 2026):** ~$6,125 cash on hand. The original $40K ($15K founder + $25K angel) was substantially depleted by a failed build due to a fraudulent CTO in late 2025.

**Burn rate components** (being refined in updated Financial Model):
- **Base operating costs** (infrastructure, services, subscriptions, advisor): ~$725/mo today; ~$1,000/mo once agents need their own seats (Google Workspace + Slack scaling). Itemized breakdown in [BizOps spoke](bizops-and-tooling.md).
- **AI agents** (Lucas + team): ~$800/mo steady state; up to ~$3,500/mo during build sprints
- **Evryn product** (API costs to serve ~500 new users/month): ~$1,450/mo once live

### Burn Profile

What it costs depending on what's running:

| What's Running | Monthly Burn | Runway from $6,125 |
|---------------|-------------|-------------------|
| Base ops only (current — building, agents paused) | ~$800 | ~7.5 months |
| Base + product live (low volume) | ~$950 | ~6.5 months |
| Base + product (ramping, ~200 users) | ~$1,600 | ~4 months |
| Base + product + agents steady | ~$2,800 | ~2 months |
| Full steady state (agents + product at scale) | ~$3,250 | ~2 months |
| Full sprint (agents sprint + product) | ~$4,225 | ~1.5 months |

### Revenue Model (Conservative Estimate)

*Revenue = Active Users × Matches/User × $8/match. Assumptions: 5% cast-off→paying-user conversion (~10 new paying users/day from Mark), 60% monthly retention, 2nd gatekeeper (via Megan) starting June at ~150 cast-offs/day. Matches/user ramps with network density — at 100 users matching is near-zero (below the ~150 testing threshold), at 300 it's sparse ("early magic" requires domain homogeneity), approaching steady-state 6.0 only above 800+.*

| Month | New Users | Retained (60%) | Total Active | Matches/User | Revenue |
|-------|-----------|----------------|-------------|-------------|---------|
| **Mar** | — | — | 0 | — | $0 |
| **Apr** (8d of v0.3) | 100 | — | 100 | ~0 | ~$0 |
| **May** | 220 | 60 | 280 | 1.0 | ~$2,200 |
| **Jun** (+2nd GK) | 330 | 168 | ~500 | 2.0 | ~$8,000 |
| **Jul** | 500 | 300 | ~800 | 3.0 | ~$19,200 |
| **Aug** | 600 | 480 | ~1,080 | 4.0 | ~$34,600 |

*These are model outputs, not predictions. Revenue depends heavily on conversion rate and retention — at 2% conversion instead of 5%, August revenue drops to ~$14K. Update with actuals as they arrive.*

### Cash Runway Projection

*Projection as of Feb 2026. Will go stale — update monthly or when plans change.*

| Month | Phase | Burn | One-Time | Capital In | Revenue | Cash (end) |
|-------|-------|------|----------|-----------|---------|-----------|
| **Mar** | v0.2 build → Mark live | $800 | — | — | $0 | $5,325 |
| **Apr** | v0.3 build, v0.2 running | $950 | — | — | ~$0 | $4,375 |
| **May** | v0.3 launch, cast-offs active | $1,600 | — | +$5K (founder) | ~$2,200 | $9,975 |
| **Jun** | v0.4 build, agents starting | $2,800 | — | +$10K (angel) | ~$8,000 | $25,175 |
| **Jul** | v0.4 build, agents full sprint | $4,225 | — | — | ~$19,200 | $40,150 |
| **Aug** | v0.4 scale, agents full sprint | $4,225 | Fenwick ~$35K | — | ~$34,600 | $35,525 |

**Reading this table:** July and August run at full sprint burn ($4,225) because v0.4 requires agents running full bore. At conservative revenue estimates, the Fenwick bill in August is manageable — cash stays positive throughout. However, this depends on v0.3 launching on time (late April) and achieving ~5% cast-off conversion. If revenue underperforms by 50%, August cash drops to ~$3K — survivable but very tight. If v0.3 launches a month late, the entire revenue curve shifts right and August becomes a crisis.

**Capital timing:**
- **$5K founder injection (May):** Provides cushion during the low-revenue early months. Without it, cash drops to ~$2,775 in May before revenue ramps.
- **$10K angel (June):** Contingent on traction — by June, v0.3 will have ~1 month of data showing user conversion and match rates. If traction lags, this may not materialize.

**The AI-first advantage:** With Justin as sole human operator building with Claude Code and Claude Agent SDK, monthly costs are a fraction of what a human engineering team would require. This fundamentally changes the capital calculus — Evryn can grow at the pace trust requires without the pressure to raise large rounds before proving the model. A CTO remains desirable — the right technical partner would accelerate development and bring complementary expertise — but it's no longer a prerequisite for launch or early growth.

### Capital Philosophy: "Help Us Not Need Institutional Capital"

The founding philosophy is user-led, with institutional capital as a last resort rather than a first move. The framing: "We're trying really hard not to need outside money — help us make this into something that can't be corrupted." This leaves the door open while making independence the mission. If institutional capital becomes necessary later, it's not betrayal — it's "we tried, we grew, now we need fuel, but our users own enough that the mission holds."

**Tension to note:** Heavy user-owned / no-overlords positioning may make VC conversations harder — even aligned VCs may not want this much out of their hands. But the user-trust value of this positioning likely outweighs the friction, especially given consumer AI trust is actively declining (53% of dating app users worried about AI, deepfake fears, extraction-model fatigue). In this environment, "no overlords" is a structural competitive advantage, not just marketing.

**Crowdfunding (via StartEngine, Reg CF)** is fueled by user belief, not performance marketing — closing the loop between trust, traction, and growth. StartEngine handles all securities compliance as a pass-through model.

**The Foundation as competitive moat:** The planned Swiss Foundation (see [long-term-vision spoke](long-term-vision.md)) is a differentiator no VC-funded competitor can match. Revenue-dependent — Foundation setup costs legal fees plus ongoing administration. Worth announcing the intent now; execution comes post-revenue. The PBC structure already exists; the Foundation is the next step, not the first.

The Financial Model includes detailed sensitivity analysis, testing viability across a range of traction and monetization scenarios — from deliberately conservative stress tests to expected-case projections. Conservative scenarios don't prove upside; they test whether the model survives under real constraint (stalled traction, lagged belief, underdelivered early monetization). The core launch plan reflects actual expectations around user psychology, early avatar mix, and referral velocity, with fallback triggers if key metrics underperform.

---
