# Business Model Revision Notes — Session 2026-02-28

> **How to use this file:** Working notes from the 2026-02-28 GTM spoke session that affect the business model spoke. These capture strategic thinking that needs to be integrated into `docs/hub/business-model.md` during its next revision. This is a capture doc, not a source of truth — read the business model spoke for current official positions.

---

## Financial Reality (as of Feb 2026)

**Current cash: ~$6,700.** The original $40K ($15K founder + $25K angel) was substantially depleted by the CTO debacle in late 2025 — a human CTO hire who turned out to be a fraud, burning ~$30K and producing nearly nothing. Other expenses consumed the rest.

**Additional runway available:**
- Justin willing to put in $5,000 more
- Angel investor willing to put in $10,000 more — contingent on seeing actual traction
- Total potential: ~$21,700

**At $3,900/mo full bore (Evryn + agents): ~5.5 months without revenue.** Revenue target: late April / early May 2026. If even modest revenue materializes ($5-10K/mo by June), runway extends significantly.

**This needs to be visible in the Hub** — not buried in a spoke — so every agent has this context. The business model spoke's Capital Strategy section ("Raised to date: $40K") is stale and needs updating.

---

## Free vs Paid Connection Framework

### The Principle

Don't charge for connections that didn't require Evryn's matching intelligence. Charge when Evryn's intelligence creates value the user couldn't have found on their own.

### The Framework

| Scenario | Charge? | Why |
|----------|---------|-----|
| Cast-off connects to the gatekeeper they emailed | Free | They already found the gatekeeper. Evryn surfaced them, not discovered them. |
| Gatekeeper gets someone from their own inbox | Free | The triage service IS the value to gatekeepers. This is the acquisition channel — don't add friction. |
| Cast-off gets connected to someone ELSE Evryn found | Paid | Evryn's matching intelligence created this. This is the product. |
| Person Evryn recruits (e.g., a plumber) — first connection | Free | They didn't ask for this. Get them in the door. Show the value: "users typically pay $X for this, but I want to give this to you." |
| Recruited person's subsequent connections | Paid | Now they're a user. Evryn's matching is creating value for them. |
| Gatekeeper gets connected to someone from outside their inbox | Paid | Evryn went and found this person. That's matching intelligence. |
| Person comes through auto-responder ("go talk to Evryn") connects to gatekeeper | Free | Came through gatekeeper's ecosystem. Same as forwarded email, different door. |

### Why This Works: The "Loss Leader" Framing

Gatekeeper connections are Evryn's freemium tier — and it's glorious. A gatekeeper giving you 500 leads/day is an incredible acquisition channel. Don't add ANY friction to that arrangement. The revenue comes from what Evryn does with those people AFTER they're in the system — matching them to each other and to the wider network.

This is the loss leader that shovels business into Evryn's mouth. Who cares if gatekeeper connections are free? The gold is in the second, third, hundredth connection Evryn brokers for each of those people.

### Value Communication (Even When Free)

Even free connections should communicate value so users understand the business model:
- For gatekeepers: "I normally charge for introductions like this, but since you're helping me build something special, this one's on me."
- For recruited users (the plumber): "Connections like this typically run about $20 — but since I reached out to you, this first one is my treat."
- Goal: they know Evryn charges, they know this is valuable, they don't think it's a scam, they don't think it's always free.

How this interacts with "you set your price" needs thought. Maybe: "typically, users are paying about $X for a connection like this" — not a set price, a social anchor. The trust-based pricing still applies; the anchor just communicates value.

### Gaming Risks and Mitigations

**Risk: Someone spams every gatekeeper for free connections.**
- Mitigation: Evryn's behavioral intelligence. If someone is gaming the system, she notices — same trust mechanics that govern everything else. Trust-based pricing means trust-based everything.
- Also: by the time gaming becomes a problem at scale, most gatekeepers are on the "go talk to Evryn" train, so people come through Evryn directly (standard pricing applies for non-gatekeeper connections).
- Also: we don't advertise the "gatekeeper connections are free" policy. It's how Evryn operates, not a marketing pitch.

**Risk: Gatekeeper forwards 500/day with no intention of paying for anything.**
- NOT actually a risk. That's 500 free leads per day. That's the acquisition engine. Revenue comes from matching those 500 people to each other and to the wider network. Don't add friction to this arrangement.

### Open Design Question

We don't promise this model is permanent. Reserve the right to adjust as the network grows. Document why we started this way (funnel friction vs revenue, acquisition channel value) so future decisions have context. The framing: "we reserve the right to change anything that feels wrong to us" — which is already how Evryn operates in every domain.

---

## Active Acquisition: Two Modes

### Mode 1: Growth Marketing (Jordan, CGO agent)

Organic marketing on forums, communities, any pathway that doesn't require ad spend. Jordan finds people who MIGHT need Evryn and points them her way. This is growth marketing, not brokering. Before revenue AND after, focus primarily on beating the bushes before spending on ads.

Channels: film industry forums, Reddit communities, Facebook groups, industry events, any organic pathway. Jordan's personality and approach TBD when agents come online (v0.4), but the function is needed and should be in the plan.

### Mode 2: Supply-Side Recruiting (Evryn herself)

When a user says "I need a plumber," Evryn goes and FINDS one. "Hey, your reviews look amazing — I have someone who'd love to work with you." This is Evryn brokering a connection — warm, personal, on-brand.

**Why Evryn herself, not Jordan:** When the plumber gets an email from Evryn saying "I have someone who needs you," that IS brokering. That's her job. Jordan does broad awareness; Evryn does targeted recruiting.

**Open question:** Should supply-side recruiting always be Evryn's job, or does Jordan handle the initial outreach and Evryn takes over once the person responds? Could go either way. It would be nice for Evryn herself to be reaching out — more on-brand, and the recruited person's first interaction is with Evryn, which is ideal. But at scale, Jordan doing initial outreach and handing warm leads to Evryn might be more efficient. Defer this decision until agents are actually being built.

### The Batching Insight

Once you have 1,100 active users and 50 need plumbers, don't run 50 separate searches — find the 5 best plumbers and connect them to all 50. One search, many connections. API cost stays flat while revenue scales linearly.

**The math:** $3,900/mo at full bore. 200 plumber connections at $20 each = $4,000. One category of connection covers the entire monthly operating cost. The unit economics work even at modest scale.

---

## Matching Threshold Design

### Objective Standard, Not "Best Available"

Don't match at "the best we have" — match at "good enough to vouch for." If we run the match at a 200-user batch size and the best matches are 30% compatibility — no matches happen. We wait. Run it again at 400, at 600, at 800. Matches only get surfaced to Evryn's analytical judgment layer when they clear a quality threshold (80%+ or whatever we calibrate to).

This belongs in ARCHITECTURE.md / technical docs, not the GTM spoke — but the GTM implications are: don't promise matches on day one. Promise that Evryn is getting to know people, building the network, and will connect them when she finds someone worth connecting them to.

### The Backlog Math (v0.2 → v0.3 transition)

After 3 weeks of v0.2 triage (before v0.3 cast-off outreach activates), ~4,200 people are in the system (200/day × 21 days). Not all are reachable:
- Week 1 cast-offs (stale): ~5% response rate
- Week 2 cast-offs: ~10% response rate
- Week 3 cast-offs: ~15% response rate
- Estimated ~420 responses from backlog outreach
- 15-20% convert to active users → ~63-84 active users to START v0.3

Then same-day cast-off outreach adds ~30-50 active users/day:
- End of v0.3 week 1: ~350-450 active users
- End of week 2: ~600-750
- End of week 3: ~900-1050

But the 3-week-old backlog isn't worthless. "How lovely to get a response at all in this day and age." If Mark had a human assistant, she might reach out after three weeks and say "I'm sorry, Mark isn't available." That's warm. That's human. That's Evryn.

### Density Thresholds Need Vetting

Business model spoke says: ~150 = testing, ~300 = early magic, ~500 = resonant matches common, 800+ = multi-intent.

**Domain homogeneity matters enormously.** 300 indie producers + crew in Seattle with overlapping needs = early magic. 300 people spanning film, salmon business, Alaskan natives, and random vendors from Mark's eclectic inbox = probably not enough matching density.

Mark is a weird first gatekeeper for matching density — but right for proving the model (triage, conversation, trust). Matching density will come from more focused gatekeepers.

**Megan specifically mentioned:** indie producers get a lot of inbound, department heads get a lot, casting folks. These are all domain-focused — much better for matching density than Mark's diverse inbox. A gatekeeper whose inbound is 90% "people wanting to work in indie film" produces far more matchable users than one whose inbound spans six different industries.

When vetting density thresholds for v0.3 planning, model them per CLUSTER, not globally. 500 users globally might mean 150 in Seattle film + 50 in Alaskan business + 300 scattered — and only the 150 Seattle film cluster has real matching density.

**Farmer + batch model changes the math:** If Evryn is actively recruiting supply-side (finding plumbers, finding DPs, finding casting directors), she can target the specific roles that users are asking for. This dramatically increases matching probability at lower total user counts — you don't need 500 random people, you need 200 people in the right roles. The batching insight (find one great plumber, connect them to 50 people who need plumbers) further amplifies this.

### The "Candy Before the Store Opens" Framing

For users who are in the system before v0.3 officially launches in their area: "Hey, we haven't officially launched yet, but I think I might have stumbled upon someone you might like." Everyone loves getting something before the store opens. Target: every user gets their first match before official launch. This turns pre-launch users into evangelists: "Evryn found me someone and she hasn't even launched yet."

---

## Foundation Timing

**Current state:** Evryn Inc. is a Delaware PBC (done). Swiss Foundation is designed but not incorporated.

**Blockers:** Legal work (Swiss incorporation), cost, Justin's attention during build sprints. Nathan (Internal Counsel agent) isn't live yet (Lucas paused).

**Plan:**
- **Now:** Website/messaging says "we are actively working toward" independent Foundation for trust data. Language: "we plan to" or "we are working toward" — honest, credible, not over-promising, but making clear this is really real.
- **v0.4 (June/July):** When Lucas + agents come online, Nathan gets Foundation on his back burner — "only work on this if blocked on all current stuff."
- **Post-v0.4:** Nathan actively scopes Swiss incorporation, legal requirements, governance structure.
- **Revenue-dependent:** Foundation setup costs legal fees + ongoing administration. Need revenue flow before committing.

**Competitive value:** In a trust-scarce environment where every competitor is VC-funded, the Foundation is a differentiator no one can match. Worth announcing the intent early even if execution is later. The PBC structure already exists — the Foundation is the next step, not the first.

---

## VC Positioning: "Help Us Not Need Them"

**NOT "fuck VCs."** The right tone is from Evryn's v0.1 ownership script (`evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/The_Beautiful_Language_of_Evryn_v0.9.md`, lines 157-204):

> "Most startups are built mostly with VCs' money... bit by bit, the mission shifts... I want Evryn to be user-owned. Help me become it. And if the day ever comes when we do need outside money, you and I will do it on our terms. Because together, we will have built something too strong to corrupt."

**The framing Justin wants:** "We're trying really hard not to need them — help us make this into something that can't be corrupted." This leaves the door open while making independence the mission. If VC money becomes necessary later, it's not betrayal — it's "we tried, we grew, now we need fuel, but our users own enough that the mission holds."

**Tension to note:** Heavy user-owned/no-overlords positioning may make VC conversations harder — even aligned VCs may not want this much out of their hands. Worth noting in strategy docs. But the user trust value of this positioning likely outweighs the VC friction, especially given:
- 53% of dating app users worried about AI
- Deepfakes eroding platform trust
- Seedance copyright battle making "AI" a loaded word
- General fatigue with extraction-model platforms

In this environment, "no overlords" is a structural competitive advantage, not just marketing.

---

## Geographic Strategy Notes

**Seattle is the honest ignition point, not LA.** Mark is in Seattle. Megan is in Seattle. Justin's 600-700 direct contacts are primarily Seattle. Both Mark and Megan know LA people and can make introductions, but the warm paths to gatekeeper #2 and #3 run through Seattle.

**Don't force a choice.** Let growth spread where it spreads. There's no subscription churn — if someone in Portland tries Evryn and there aren't matches yet, Evryn says "we haven't officially launched in your area, but I'll keep an eye out" and surprises them later. Focus DENSITY efforts on Seattle (where warm paths exist), let stray matches happen anywhere, expand to LA when connections materialize.

**Seattle has its own acute need:** The "Seattle Freeze" is real — Seattle consistently ranks among the loneliest cities in America. The social fabric problem isn't just an abstract national trend; it's ground zero. This is a real angle for positioning.

**SIFF (Seattle International Film Festival, mid-May to early June):** Both Mark and Megan are connected to SIFF. v0.3 should be in Layer 2-3 by then. This is a real, achievable target for presence/demo. Could be the first public-facing moment.

**Justin's 78K contacts clarification:** ~40 highly connected film people × ~2,000 contacts each ≈ 78,000 second-gen. But Justin has ~600-700 direct contacts (film/theatre/adjacent), primarily Seattle. Only a few of the 40 have been contacted so far. **Action needed: go through Justin's contacts, figure out where they are geographically, and start warming the most promising paths.**

**LA strategy isn't dead — it's the expansion target.** LA is still where the density is for long-term scale. The reasons the film industry is a good ignition point (tight-knit, high-need, collaborative) are about the INDUSTRY, not the city. But the realistic path is: prove the model in Seattle → use Seattle connections (Mark, Megan, others) to get introductions to LA gatekeepers → expand to LA with proof of concept in hand.

### Justin's Broader Seattle Network (Beyond Film)

Justin worked at (and eventually ran) a health club in Seattle for nearly a decade (~2000-2007, plus some time in 2011-2012). This means he knows *a lot* of people in Seattle beyond the film/theatre world — potentially thousands. Not close friends — maybe 50 are Facebook friends at most — but people who know him, and who are consistently delighted to see him when paths cross. These contacts have their own communities: yoga, fitness, social groups, and beyond.

**What this might mean:** Justin could be within two hops of a very large portion of Seattle. If even a fraction of his dense contacts in this world are willing to share their communities, it opens a breadth play across the city that complements the film-specific depth play. This isn't verified or quantified — it's a new realization that needs exploration. The key question: are these warm-enough connections to activate, and how?

**Not overselling it:** These aren't current relationships in most cases. But the warmth is real — "any time I run into any of them, they're always delighted to see me." The potential is in the second-hop reach: each of these people sits at the center of their own community.

---
