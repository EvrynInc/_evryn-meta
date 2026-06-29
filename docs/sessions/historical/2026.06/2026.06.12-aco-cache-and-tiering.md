# Session — Cost, Cache Mechanics & Model Tiering (ACo, 2026-06-12)

> **How to use this file:** Working session notes from a cost/caching deep-dive with Justin (2026-06-12). Companion to the cost analysis v2 (`evryn-team-workspace/shared/projects/product/research/2026.06.11 evryn-cost-analysis.md`) — this doc is the **cache-mechanics / model-tiering / turn-anatomy** angle. ACf is working the same cost problem from a different angle (`docs/sessions/2026-06-12-acf-cost-levers.md`). **Ephemeral working notes** — the durable findings should be absorbed into cost-analysis v2 + ARCHITECTURE/BUILD, after which this can retire.
>
> ## ⚠️ CONFIDENCE DISCIPLINE — READ FIRST (Justin's directive)
>
> This doc mixes verified facts, modeled estimates, and unverified hypotheses. **Each claim is tagged. Do NOT take a `[MODELED]` or `[VERIFY]` claim as settled fact.** The point of this doc is to carry *our thinking* to the machine with prod access + the pre-wipe dump, where it can be confirmed — not to be gospel.
>
> - **`[HARD]`** — measured (the 4 cost-captured queries) or read directly from the runtime code. Trust it.
> - **`[MODELED]`** — extrapolated from the cost model. Has a basis and a band; never measured.
> - **`[VERIFY]`** — a hypothesis that needs a log pull, an SDK check, or a test before acting on it.
>
> **The open `[VERIFY]` items (do these on the prod/dump machine):**
> 1. **SDK cache-breakpoint behavior** — does the Agent SDK cache Evryn's identity prefix *separately* from the per-user profile, so a new user reuses warm identity? Or is the whole systemPrompt one cache block (→ every new user re-writes identity)?
> 2. **Haiku screen false-pass rate** — run the screen in *shadow mode* against Opus's real verdicts for a week. Does it ever kill a real gold/edge? (The whole tiering plan rests on this being ~0 with conservative tuning.)
> 3. **Batch-API ↔ agentic-loop compatibility** — confirmed-suspected that the 50%-off Batch API does NOT compose with the multi-turn `query()` loop. Verify.
> 4. **Cache temperature under real volume** — measure `cache_create` vs `cache_read` token ratio once Mark's real ~200/day flow lands. This resolves the entire cold↔warm cost swing.
> 5. **Onboarding volley count** — in `evryn-backend/backups/pre-wipe-2026-06-11.sql` (NOT on the laptop this was drafted on — it's local/out-of-git on the prod machine). One query against `llm_usage` once real-Mark onboards gives the literal bill.

---

## 0. The pricing facts everything rests on `[HARD]`

From the Claude API reference (current rates). Evryn runs `claude-opus-4-7` (`EVRYN_MODEL` in `src/triage/classify.ts`).

| | Input | Output | Cache **read** (0.1×) | Cache **write** 5-min (1.25×) |
|---|---:|---:|---:|---:|
| **Opus 4.7** | $5.00/M | $25.00/M | **$0.50/M** | **$6.25/M** |
| **Haiku 4.5** | $1.00/M | $5.00/M | **$0.10/M** | $1.25/M |

- Default cache TTL is **5 minutes**, refreshed on each hit. 1-hour TTL costs **2×** to write (Opus $10/M).
- **Caches are model-scoped.** Opus and Haiku have *separate* caches — one model's reads never warm the other's. (Confirmed in the API docs: "switching models mid-session invalidates the cache.")
- Min cacheable prefix on Opus 4.7 = 4,096 tokens. Evryn's prefix (~28k identity + ~28k Mark profile) is well above, so it caches.

---

## 1. The 4 measured queries + the cost model `[HARD]`

The only measured data. `llm_usage` went live 2026-06-10; these 4 are the whole hard dataset.

| Q | Pathway | Result | Turns | Output | Cache-read | Cache-create | **SDK $** |
|---|---|---|---:|---:|---:|---:|---:|
| A | processDirect | conversation | 3 | 8,981 | 233,313 | 122,075 | **$1.127** |
| B | processDirect | conversation | 3 | 6,004 | 229,723 | 119,062 | **$1.032** |
| C | processForward | **pass** | 15 | 18,945 | 779,514 | 144,333 | **$1.921** |
| D | processForward | **edge** | 12 | 21,530 | 501,337 | 142,183 | **$1.751** |

**Fitted model** (`[HARD]` fit, <2% residuals): `cost ≈ $0.0000121 × output + $0.05775 × turns + $0.8136`
→ output ~$12/MTok · per-turn ~$0.058 · **per-query cold intercept ~$0.81** (the one-time cold cache-write of the ~28k prefix; collapses to ~$0.07 warm).

All 4 captures wrote 119k–144k cache-create tokens → **all 4 were cold** (test queries >5 min apart). So every measured number is a *cold-cache* number.

---

## 2. The "$15/$75 vs correct figures" puzzle — RESOLVED `[HARD]`

The cost-analysis v2 Appendix flagged an unresolved "2.86× discrepancy" between published list rates and the SDK bill. **Resolution:** v2's Appendix used Opus **4.1-era** rates ($15/$75 per MTok); Opus 4.7 actually costs **$5/$25** — a 3× difference, which *is* the "discrepancy."

- The headline $/query and $/mo figures come from the SDK's `total_cost_usd` (the literal bill) and are correct.
- The $15/$75 only appears in a *failed independent reconstruction* in the Appendix — it never feeds any figure.
- The SDK number landing ~2.86× *below* the stale recompute is itself **confirmation the SDK prices at the current ~$5/$25.** The wrong recompute validates the right bill.

**Action:** fold this resolution back into v2's Appendix so a future reader doesn't re-chase it.

---

## 3. What a "turn" is, and the multiplication problem `[HARD]` mechanics

One **query** = one inbound email → one Evryn response = one `runEvrynQuery` call. Inside it, an agentic loop: model emits a tool call → runtime executes → result appended → next tool call → … until done or `maxTurns: 20`. **A "turn" is one internal round-trip within the query.**

**Each turn re-sends the entire context, which *grows* every turn** (each tool result is appended). Capture C (15-turn pass) processed ~943k tokens for one query — nearly a million, exactly the "50k × 20" intuition (and an undercount, since later turns also carry accumulated history).

**But caching is what makes 20 turns affordable.** Decomposing C's $1.92:
- Cold cache-write (prefix written fresh): ~144k × $6.25/M ≈ **$0.90**
- Cache-read (prefix + history re-read across turns): ~780k × $0.50/M ≈ **$0.39**
- Output (never cached): ~19k × $25/M ≈ **$0.47**

Without caching, the 780k of re-reads would be $3.90 instead of $0.39 — the pass would be ~$5. The remaining pain: (a) the **cold-write tax** when cache is cold, (b) the 0.1× read still × many turns × ~56k prefix, (c) output never caches.

→ **Two multiplicands to attack: context size AND turn count.** They're entangled (most levers hit both).

---

## 4. Turn-vs-runtime audit — what the LLM is doing that the runtime could `[HARD] (read against the runtime)`

Reconstruction of a 15-turn pass *(the literal trace aged out with the container — reconstructed from `activities/triage.md` + the tool set + named Findings; counts are inference, the verified column is code-read)*:

| Turn | Could be… | Status |
|---|---|---|
| status → `processing` | **Runtime — and it ALREADY does this** | **`[HARD]` redundant.** `processForward` runs `updateEmailmgrItem(…, "processing")` *before* calling Evryn. triage.md *also* tells her to set it → she re-writes a status the runtime already set. **Cut the triage.md instruction.** |
| check prior-triage history | **Runtime could pre-load** | `[HARD]` gap. Runtime pre-loads *conversation* history into the prompt (`getRecentMessages`) but NOT prior-triage history (the `original_from_user_id` FK lookup). triage.md makes her spend a turn on it. Pre-fetch it → turn gone. |
| create/find user record | **Runtime already reifies the sender at forward time** (ADR-036) | `[HARD]`. The record usually already exists by triage time (triage.md says so). Her `create_user` call is often a redundant turn. |
| re-read Mark's profile | **Already in the cached prefix** | `[VERIFY]` whether she actually spends a turn on this; if so it's redundant (force-loaded). |
| status → terminal (`passed`/etc.) | **Runtime, via structured output** | If Evryn returns a structured verdict `{result, reasoning}`, the runtime writes the status — removes the turn AND fixes Finding (g) (her `supabase_upsert` status writes bypass the `metadata.lifecycle` audit append). |
| web research ×4–5 | **Truly Opus** (gate via the Haiku screen) | judgment — keep, non-obvious only |
| note-writing ×3 | **Content is Opus; over-writing is waste** | one tight note for gold/edge; zero for passes (pass-stamp) |

**Headline:** the runtime makes Opus spend full-context turns on *deterministic bookkeeping* — setting statuses (one already set), creating records (already created), reading history (could be pre-loaded). **Cleanest structural move:** runtime does all bookkeeping + pre-loads everything Evryn needs (conversation history, prior-triage history, sender record) into the prompt; **Evryn does only judgment + returns a structured verdict the runtime persists.** A pass drops from ~15 turns to ~2–4; a gold from ~13 to ~5–6. This attacks turn-multiplication at the root, *independent* of model-tiering.

**What could Sonnet/Haiku reliably handle (vs. truly-Opus):** the clean cheap-model candidates are exactly two — the **obvious-pass screen** and the **"is this even a real person / obvious-ignore" first-call** (the latter partly deterministic already — the empty-body bounce, Finding 21/6a). Everything else is either runtime-deterministic bookkeeping or genuinely Opus: the draft to Mark (user-facing Evryn voice), research synthesis (judgment), note content (her understanding). Don't tier those.

---

## 5. Model tiering — the cheap pre-screen `[MODELED] + [VERIFY]`

**The mechanics correction that shapes everything:** you canNOT tier *within* a query — `query()` is pinned to one model (`EVRYN_MODEL`), every turn runs on it. Tiering = a **separate cheap pre-call** that gates whether the Opus query runs at all:

```
forward → Haiku screen (one self-contained call): "obvious no-fit for Mark?"
   ├─ obvious pass → record pass, done.  OPUS NEVER RUNS.
   └─ maybe / edge / gold → hand to full Opus runEvrynQuery (as today)
```

**Self-contained screen — load NONE of Evryn's identity.** Just `[Mark's tight criteria ~2k] + [email ~1k] + [one-line instruction]`, output ~100 tokens. On Haiku 4.5:
- Cold ~$0.004 · warm (criteria cached) **~$0.002/screen** `[MODELED]`
- **Whole screening layer for Mark: ~$15–30/mo.** It kills ~5,650 Opus queries worth ~$1,800/mo.

**The safety rule (non-negotiable — asymmetric error):** Haiku may **only PASS, never gold/edge**, and must be **conservative — escalate on any whiff of potential.** A false-pass (kills a real gold) is catastrophic; a false-escalate (hands an obvious pass to Opus) just costs one Opus query. Tune to over-escalate.

**Validation = shadow mode `[VERIFY]`:** run the screen logging what it *would* decide, don't act, for a week, against Opus's real verdicts. Measure false-pass rate on golds/edges. ~0 → flip it on. Zero-risk; this is the ADR-020 model-tier analysis done cheaply.

**Cross-model cache note `[HARD]`:** Haiku and Opus caches are separate, so the Haiku screen never warms Opus. That's fine — the screen exists to handle the *stop* majority, which has no continuation to warm. On the rare escalate path, Haiku adds ~$0.003 overhead on top of the full Opus query (~$1/mo total). Strictly net-positive.

**Pull-in timing:** this is the v0.3 model-tiering, but the Mark-period savings (~$2k → ~$150–400/mo) argue for pulling it in early, behind the shadow-mode gate.

---

## 6. The tiered floor — corrected volumes `[MODELED]`

Justin's corrected volume mix: ~6,000 forwards/mo; ~5,900 passes of which **~250 are borderline "edge-edges"** (need Opus, Haiku must NOT kill them); ~25 gold; ~25 edge. → **~5,650 obvious passes** (Haiku-killable), **~300 non-obvious** (Opus).

| Layer | Volume | Cost |
|---|---:|---:|
| Haiku self-contained screen | 6,000 | ~$20/mo |
| Opus on the ~300 non-obvious (clustered warm) | 300 | ~$130/mo |
| Opus same, if run cold (sparse) | 300 | ~$360/mo |
| **Total — Mark period** | | **~$150–380/mo** |

vs. ~$2k (warm) / ~$6.5k (cold) non-tiered. This is at/near cost-analysis v2's "irreducible ~$200" floor — **during Mark, not deferred.**

**The tiering↔cache interaction `[MODELED]`:** moving 95% of volume off Opus makes the remaining ~300 Opus queries *sparse* → Opus cache goes cold between them → cold intercept returns. The Haiku cache stays warm (continuous). Net still wins enormously, but the "warm Opus" assumption partly evaporates once you tier — which is what **batching** (below) fixes.

---

## 7. Cache partitioning at scale `[MODELED] + [VERIFY]`

**Justin's instinct (correct):** at scale, Evryn's identity (loads first, byte-identical) is *permanently warm*; a new user does NOT invalidate it. Caching is a **longest-matching-prefix** match (render order: identity → operator suffix → user suffix → history). A new user's query reads identity from the SAME warm entry another user warmed; the cache only diverges at the user-profile suffix. New user = warm identity + their own cold profile (one-time) + warm thereafter.

**Where it could break `[VERIFY] — the load-bearing check`:** that clean behavior depends on identity being a **separate cache breakpoint** from the user profile. The API allows up to 4 `cache_control` breakpoints. Ideal: breakpoint after identity (shared, always warm) + breakpoint after profile (warm per-user). **BUT Evryn runs through the Agent SDK's `query()`, which manages caching itself** — unknown whether it places that identity│profile breakpoint or caches the whole systemPrompt as one block. If it's one block, every new user re-writes identity too (wasteful). **If so, the fix is to partition — a potential quiet, free win. This is the #1 thing to verify in the SDK / a controlled test.**

---

## 8. Batching — time-clustering, not Anthropic's Batch API `[HARD] + [VERIFY]`

Two distinct things both called "batching":

1. **Time-clustering for cache warmth `[our mechanism]`** — process accumulated forwards in tight bursts instead of spread out, so queries 2..N land within the 5-min window → all warm. **This is the fix for the cold-Opus-from-sparse-traffic problem in §6:** batch the ~300 non-obvious Opus queries (≈10/day) → all-but-first warm. **Daily-batch-everything** keeps *both* caches warm (one cold write per model per day, rest warm). Cost: a little latency.
   - **Gold-latency caveat:** daily batching adds up to ~24h latency. Fine for passes (go nowhere); **bad for golds** (time-sensitive — Mark hearing late could cost the connection). So batch latency-tolerant stuff freely; keep the gold/edge path prompt (or cluster sub-daily, e.g. hourly, to stay warm without the tail).

2. **Anthropic Batch API (literal 50%-off) `[VERIFY]`** — a *separate product*: async (minutes–24h), 50% off. **Almost certainly does NOT compose with the agentic `query()` loop** (it's for single-shot requests; the SDK's tool-loop is a different submission model). It *would* compose with the single-shot Haiku screen — but that's already ~free, so marginal.

**Decision (Justin):** time-clustering is our mechanism; not banking on Anthropic's Batch API.

---

## 9. 5-min vs 1-hour cache — decision `[HARD] + decision`

- **5-min is the dominant lever** because it caches the turns *within* a query (all ~15 turns fire within seconds → all warm). That's what makes a 15-turn query $1.92 not ~$5. Automatic.
- **1-hour only helps *between* human-paced volleys**, of which there are few, and you pay **2×** to write. Juice isn't worth the squeeze at current scale.
- **The logs show only 5-min caching** → the SDK defaults to 5-min and nothing sets 1-hour. Good — and it confirms intra-volley caching is live.

**Decision: stay on 5-min; defer 1-hour.** Time-clustering (§8) is the better tool for between-query warmth. *(`[VERIFY]` whether the SDK even exposes a 1-hour TTL knob, if ever revisited at v0.3 web-app scale.)*

---

## 10. Onboarding cost model `[MODELED]` (v0.3-relevant)

Onboarding runs the `processDirect` conversation pathway. **An onboarding = N sequential volleys, each a billable query**, not uniform:

| Volley type | Shape | Per-volley (cold) |
|---|---|---:|
| First (research-heavy: look-them-up + intro + notes) | ~10–15 turns, ~12–18k out | ~$1.5–1.9 |
| Get-to-know-them (several) | ~3–5 turns, ~8–12k out | ~$1.1–1.5 |
| Trust-arc / contact-capture | conversation-shaped | ~$1.0–1.3 |

Onboarding is **human-paced → cache cold each volley** (the conversation anchors A/B were already cold, so they apply directly). Formula: `1 research volley (~$1.7) + (N−1) conversation volleys (~$1.2–1.3)`:

| Onboarding | N volleys | **Total (cold)** |
|---|---:|---:|
| Lean | ~7 | ~$9 |
| **Typical** | **~11** | **~$14** |
| Deep | ~18 | ~$24 |

- **Warm (1-hour TTL + replies within the hour) ≈ halves it** (~$14 → ~$6) — the one place 1-hour cache *might* pay, but per §9 it's deferred.
- **It's a v0.3 concern, not v0.2** — Mark onboards once (~$14, negligible vs. $11k/mo triage). Material only when the web app makes everyone onboard: `~$14 (cold) or ~$6 (warm) × new users`.
- **`[VERIFY]` the real number two ways:** (a) cleanest — once real-Mark onboards, `SELECT count(*), sum(total_cost_usd) FROM llm_usage WHERE pathway='processDirect' AND scope_user_id='<mark>'`; (b) from the pre-wipe dump — count the Mark↔Evryn direct-conversation `messages` rows (the onboarding thread, excluding forward-triage items) → drop N into the formula.

---

## 11. Action summary (for the prod/dump machine)

**Verify (the `[VERIFY]` list, ordered by leverage):**
1. SDK cache-breakpoint behavior (§7) — identity cached separately from profile? Potential free win.
2. Haiku screen shadow-mode test (§5) — false-pass rate on real golds/edges.
3. Cache temperature under real volume (§3) — `cache_create` vs `cache_read` ratio, week one.
4. Batch-API ↔ agentic-loop compatibility (§8).
5. Real onboarding cost via `llm_usage` (§10).

**Build candidates (ordered):**
1. **Runtime-does-bookkeeping + structured-verdict** (§4) — cuts turns at the root; remove the redundant `processing` instruction from triage.md first (free).
2. **Self-contained Haiku pre-screen** (§5) behind shadow-mode gate — ~$2k → ~$150–400/mo.
3. **Time-clustering / daily-ish batching** (§8) — keeps both caches warm; respect gold latency.
4. **Cache partitioning** (§7) — pending the SDK check.

*Drafted 2026-06-12 by ACo. Source: live session with Justin + cost-analysis v2 + direct read of `src/` (process.ts, classify.ts, triage.md) + the Claude API pricing reference. PII-free. The pre-wipe-2026-06-11 dump is NOT on the drafting machine (laptop) — the `[VERIFY]` items needing it must run on the prod machine.*
