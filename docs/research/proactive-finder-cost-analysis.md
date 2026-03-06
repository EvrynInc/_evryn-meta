# Proactive Person Finder — Cost Analysis

> **How to use this file:** Detailed cost breakdown for when Evryn proactively sources people not yet in the network to fulfill a seeker's need. Covers methodology, assumptions, and key variables. Referenced from the [business-model spoke](../hub/business-model.md) (Proactive Finder Economics).
>
> **Created:** 2026-03-06. **Context:** Justin asked AC to reason through the API costs of Evryn going out to find (e.g.) a plumber in Seattle when none exist in the network.

---

## Scenario

A user in Seattle needs a plumber. No plumbers in the network. Evryn goes out searching — web research, review analysis, quality ranking — then contacts the top candidates with personalized outreach.

## What counts as "extra"

If the plumber were already in the network, the cost to match them to the user is just the standard matching cost ($0.48). The **extra** cost is everything Evryn does to *find and contact* people who aren't in the system yet. Onboarding, matching, and follow-ups are excluded — those are standard costs regardless of how someone entered the network.

## Model pricing (from budget CSV, 2026-03-06)

| Model | Input $/MTok | Output $/MTok |
|-------|-------------|--------------|
| Opus 4.6 | $5.00 | $25.00 |
| Sonnet 4.5 | $3.00 | $15.00 |
| Haiku 4.5 | $0.80 | $4.00 |
| Embedding (voyage-3) | $0.06 | — |

---

## Phase 1: Research (~$1.30, one-time per category × geography)

"Find all plumbers in Seattle worth reaching out to." One-time cost — once Evryn has researched "plumbers in Seattle," that research serves every future user who needs a plumber there.

### Step-by-step

**1. Discovery search — $0.05**
- 5-8 web search queries: "best plumbers Seattle," "licensed plumbers Seattle WA," "highest rated plumbers Seattle," etc.
- Search API (Google Custom Search, Brave, or Tavily): ~$0.005-0.01/query
- **Cost: ~$0.05**

**2. Parse search results — $0.04**
- Read 5 search result pages, extract business names/links/basic ratings
- Each page ~5,000 tokens. Haiku handles this fine.
- Haiku: 25K input × $0.80/MTok + 5K output × $4.00/MTok
- **Cost: $0.02 + $0.02 = $0.04**

**3. Fetch review pages — $0.50**
- For ~100 plumber candidates, fetch their Yelp/Google/Angi review pages
- Review sites require JavaScript rendering (Yelp, Google Maps), so a scraping service is needed
- ~$0.005/page × 100 pages
- **Cost: ~$0.50**
- *Alternative: structured APIs (Yelp Fusion free tier, Google Places) could drop this to ~$0.10-0.20 but with less rich data*

**4. Extract review data — $0.48**
- For each of 100 review pages, extract: rating, review count, key themes (reliability, punctuality, quality), red flags, specialties
- Average review page after HTML→text: ~4,000 tokens. Output per plumber: ~400 tokens
- Haiku: 400K input × $0.80/MTok + 40K output × $4.00/MTok
- **Cost: $0.32 + $0.16 = $0.48**

**5. Quality ranking & synthesis — $0.23**
- Sonnet synthesizes all extracted data into a ranked list with trust signals
- Input: ~50K tokens (all 100 plumber profiles), Output: ~5K tokens (ranked assessment)
- Sonnet: 50K × $3.00/MTok + 5K × $15.00/MTok
- **Cost: $0.15 + $0.075 = $0.23**

| Component | Model/API | Cost |
|-----------|-----------|------|
| Discovery search (5-8 queries) | Search API | $0.05 |
| Parse search results | Haiku | $0.04 |
| Fetch review pages (100 businesses) | Web scraping | $0.50 |
| Extract review data (100 pages) | Haiku | $0.48 |
| Quality ranking + synthesis | Sonnet | $0.23 |
| **RESEARCH TOTAL** | | **~$1.30** |

---

## Phase 2: Outreach ($0.04/plumber, ~$4.40 for all 100)

Reach out to all 100. Research cost is split across them; each outreach is theirs.

The pitch is richer than the standard cast-off pitch ($0.02 in the budget) because Evryn needs to: explain who she is (they've never heard of Evryn), reference their specific business/reviews/strengths, and frame why a real person's need makes this worth their time.

| Component | Model | Input tok | Output tok | Cost/each |
|-----------|-------|-----------|------------|-----------|
| Personalized pitch | Sonnet | 3,000 | 1,500 | $0.032 |
| Publisher safety check | Sonnet | 1,500 | 400 | $0.011 |
| Email delivery | SendGrid/Resend | — | — | $0.001 |
| **Per-plumber total** | | | | **$0.044** |

**Outreach for 100 plumbers: ~$4.40**

---

## Grand Total

| | Cost |
|---|---|
| Research (one-time) | $1.30 |
| Outreach (100 plumbers) | $4.40 |
| **TOTAL** | **~$5.70** |

---

## Per-Found-Person Costs

| Metric | Assumption | Extra cost per person |
|--------|-----------|---------------------|
| Per plumber contacted | 100 out of 100 | **$0.057** |
| Per plumber who responds | ~10% response rate | **$0.57** |
| Per plumber who joins network | ~5% of contacted (50% of responders complete intake) | **$1.14** |

For comparison, current full acquisition cost for a cast-off is $1.09 (text onboard) or $3.34 (phone onboard) — and that *includes* onboarding + matching. The proactive finder adds $0.57-1.14 *before* onboarding.

---

## Key Insight: Network Investment, Not Per-Connection Cost

The $5.70 doesn't just serve the one user who asked for a plumber. Once recruited plumbers join the network, every future "I need a plumber in Seattle" costs $0 extra — just standard matching ($0.48). The research has a shelf life (plumbers close, new ones open) but is probably good for 6-12 months before needing a refresh. A refresh is cheaper than the first pass (landscape already mapped, just checking for changes).

Proactive sourcing makes sense when the aggregate connection value justifies the one-time spend.

---

## Where This Methodology Might Have Holes

1. **Response rate is a guess.** 10% is a reasonable cold email benchmark, but Evryn is offering free business, not selling something. Could be higher (15-20%) with a good pitch. Could be lower (5%) if plumbers are skeptical of AI outreach.

2. **Web scraping costs vary wildly.** Structured APIs (Yelp Fusion free tier) instead of scraping could drop the $0.50 fetch cost to near-zero — but with less rich data. If sites block scraping, costs go up.

3. **Haiku may not be enough for review extraction.** If reviews require nuanced interpretation (e.g., "great work but terrible at returning calls" = reliability red flag), Sonnet may be needed. That roughly doubles extraction cost: $0.48 → ~$1.20. Total goes from $5.70 to ~$6.40.

4. **Geographic clustering.** Seattle is big. Separate searches for different neighborhoods could multiply search queries, though the total candidate pool stays similar.

5. **Scale economics work in our favor.** The first proactive search is the most expensive. Once the infrastructure pattern exists (search → extract → rank → pitch), subsequent category searches reuse the same pipeline. Searching "electricians Seattle" after "plumbers Seattle" is just swapping the query.

6. **The decision to go searching isn't free.** When the user says "I need a plumber" and Evryn realizes there aren't any in the network, there's a decision-making LLM call. But that's basically a standard follow-up message ($0.04) — trivial.
