# Cache-Temperature Measurement Plan — week-one of Mark-live (Lane C / Sprint Step 11c)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** A runnable ops/analysis plan, not code. It is the **lead deliverable of the cache half of Lane C** (Sprint Steps 11a–11c in `evryn-backend/docs/SPRINT-V0.2-HARDENING.md`). Run these queries against the **prod `llm_usage` table** after ~1 week of Mark's *real* forwarded traffic. Their job: resolve the single biggest uncertainty in the cost model — the **~$2k (warm) ↔ ~$6.5k (cold) cache-temperature spread** (`evryn-team-workspace/shared/projects/product/research/2026.06.11 evryn-cost-analysis.md`, §5) — and decide whether the 1-hour-TTL experiment (Step 11a) is worth pursuing. Created 2026-06-17 by AC3 (Lane C). Read the "Why this replaced the one-liner" section first — it is load-bearing context for whoever runs this.

---

## 0. Why this replaced the "flip a one-liner" framing of Step 11a (read first)

Sprint Step 11a was written as: *"switch to Anthropic's 1-hour cache TTL in `runEvrynQuery` — the single highest cost-leverage one-liner."* **That one-liner does not exist.** AC3 verified (2026-06-17, claude-code-guide research against the official Agent SDK TypeScript reference + SDK GitHub issues):

- The runtime does **not** call the raw Anthropic Messages API — it calls the **Claude Agent SDK `query()`**, which spawns Claude Code as a subprocess and manages prompt caching **internally**.
- The SDK `query()` options (`systemPrompt`, `model`, `maxTurns`, `tools`, `mcpServers`, `permissionMode`, `env`, …) expose **no `cache_control` / `cacheTTL` field**. There is no per-content TTL knob the way the raw API has (`cache_control: {ttl: "1h"}` + the `extended-cache-ttl` beta header).
- The closest control is a **Claude Code env var** — `ENABLE_PROMPT_CACHING_1H=1` (opt into 1h) / `FORCE_PROMPT_CACHING_5M=1` (force 5m) — documented for Claude Code's own sessions. Whether it **threads through** to an Agent-SDK-spawned subprocess (our `query()` passes `env: {...process.env, ANTHROPIC_API_KEY}`) is **untested and must be proven empirically**, not assumed.
- The SDK's *default* TTL is itself undocumented/inconsistent (an SDK issue reports it defaults to 1h; a March-2026 platform regression muddied it). **We do not actually know our effective TTL from docs.**

**Consequence:** the cache work is **measure-and-instrument, not flip-a-switch.** The good news: the runtime **already captures the exact data needed** — `src/db/llm-usage.ts` writes `cache_creation_tokens` and `cache_read_tokens` per query into `llm_usage`. So we can *measure* our effective cache behavior directly from the bill, and only then decide whether the env-var experiment is worth running. This doc is that measurement.

**Caveat on timing:** these queries need **real clustered volume** (Mark's ~200/day arriving in natural bursts). Today (post-wipe, Mark not yet forwarding) there is no meaningful traffic to measure, and dev cadence won't replicate Mark's. Run week-one, not before.

**Update 2026-06-17 — clustering supersedes the TTL chase.** The cache-warmth strategy is now **daily clustering** (sprint Step 58 — drain the day's triage in one ~10am burst, so the first query pays the one cold prefix-write and the rest run warm). That is the real warmth lever (warmth-by-volume), and it makes the 1h-TTL question (Q5 below) a **contingency, not the lead**: measure first (Q1/Q2); only if clustering still leaves cold pockets do we run the `ENABLE_PROMPT_CACHING_1H` experiment. The measurement is what decides — the queries below stand regardless of which strategy wins.

---

## 1. The columns we have (no new instrumentation needed)

`public.llm_usage`, one row per `runEvrynQuery` call (the single Anthropic choke point). Relevant columns (from `src/db/llm-usage.ts` `LlmUsageRow` — re-pull `docs/schema-reference.md` to confirm `created_at` naming before running):

| Column | Meaning |
|---|---|
| `pathway` | `processForward` / `processDirect` / `checkProactiveOutreach` / `checkFollowUps` / `handleOperatorMessage` / `handleRevisionNotes` (+ `checkReflectionConsolidation` once Step 10 ships) |
| `activity` | coarse tag (`triage` / `conversation` / `proactive` / …) — `PATHWAY_ACTIVITY` map |
| `scope_user_id` | the user the query was scoped to (Mark vs. a contact) |
| `cache_creation_tokens` | tokens **written** to cache this query (the *cold-write tax*) |
| `cache_read_tokens` | tokens **read** from cache this query (the *warm benefit*) |
| `input_tokens` / `output_tokens` | fresh input / Evryn's output |
| `total_cost_usd` | the literal SDK bill for this query |
| `num_turns` | tool-loop turns (each re-reads the prefix) |
| `created_at` | when the row was written (query time) — the inter-arrival clock |

---

## 2. The queries (run in order; each names what it decides)

> Replace `created_at` if the schema-reference shows a different name. All are read-only.

### Q1 — Cache temperature, headline (per activity)
The ratio that resolves the $2k↔$6.5k spread. High `create:read` = **cold** (paying the write tax repeatedly); low = **warm**.
```sql
select activity,
       count(*)                               as queries,
       sum(cache_creation_tokens)             as total_create,
       sum(cache_read_tokens)                 as total_read,
       round(sum(cache_creation_tokens)::numeric
             / nullif(sum(cache_read_tokens),0), 3) as create_to_read_ratio,
       round(avg(cache_creation_tokens))      as avg_create_per_query,
       round(avg(total_cost_usd)::numeric, 4) as avg_cost
from llm_usage
group by activity
order by queries desc;
```
**Decide:** `create_to_read_ratio` ≳ 0.3 across the high-volume `triage` activity → we're running cold → the env-var experiment (Q5) is worth it. ≲ 0.1 → already warm → Step 11a is largely moot; bank the win and move on.

### Q2 — Effective TTL, inferred from inter-arrival gaps (the real 11a answer)
For each triage query, look at the gap since the prior triage query. If queries **5–60 min** after the previous one still show large `cache_creation_tokens`, our effective TTL is ~5-min (cold pockets between bursts). If they show mostly `cache_read`, we're effectively on ~1h (or volume keeps it warm).
```sql
with t as (
  select created_at, cache_creation_tokens, cache_read_tokens,
         extract(epoch from (created_at
           - lag(created_at) over (order by created_at)))/60.0 as gap_min
  from llm_usage
  where activity = 'triage'
)
select case
         when gap_min is null then 'first'
         when gap_min < 5  then '<5m (warm-expected)'
         when gap_min < 60 then '5-60m (TTL-sensitive)'
         else '>60m (cold-expected)'
       end as gap_bucket,
       count(*)                            as queries,
       round(avg(cache_creation_tokens))   as avg_create,
       round(avg(cache_read_tokens))       as avg_read
from t
group by gap_bucket
order by 1;
```
**Decide:** if the **5–60m bucket** looks like the **>60m (cold)** bucket (high create) → we're on 5-min TTL → 1h would help → run Q5. If it looks like the **<5m (warm)** bucket → we're effectively ≥1h already → no TTL change needed.

### Q3 — The per-query cold intercept, made real
The cost model's load-bearing ~$0.81 cold intercept. Look at the cheapest, lowest-turn queries (auto-ignore passes / short conversations) — their cost ≈ the intercept.
```sql
select pathway, num_turns, output_tokens, cache_creation_tokens,
       cache_read_tokens, total_cost_usd
from llm_usage
where num_turns <= 3 and output_tokens < 2000
order by total_cost_usd asc
limit 25;
```
**Decide:** if these floor near ~$0.07 → cache is warm (intercept collapsed, the model's warm case). Near ~$0.81 → cold (intercept paid every query).

### Q4 — Profile-bloat → cache-create correlation (ties to Step 10 Reflection)
Confirms the recurring-tax thesis: the bigger Mark's force-loaded profile, the more cache-create on his queries. Run before vs. after a consolidation run.
```sql
select scope_user_id,
       count(*)                          as queries,
       round(avg(cache_creation_tokens)) as avg_create,
       round(avg(cache_read_tokens))     as avg_read,
       round(avg(total_cost_usd)::numeric,4) as avg_cost
from llm_usage
where activity in ('triage','proactive','follow_up')
group by scope_user_id
order by queries desc;
```
**Decide:** Mark's `avg_create` should drop materially after a consolidation run (Step 10) — the empirical proof consolidation cut the recurring tax.

### Q5 — The `ENABLE_PROMPT_CACHING_1H` A/B (only if Q1/Q2 say we're cold)
**Not a query — an experiment.** Set `ENABLE_PROMPT_CACHING_1H=1` in the env passed to `query()` in `runEvrynQuery` (Railway env var, threaded into the subprocess env) for a measured window, vs. a window without. Then re-run Q1/Q2 on each window (`where created_at between …`) and compare `create_to_read_ratio` on the **5–60m bucket**.
- **Watch the write premium:** 1h cache *writes* cost ~2× (200% vs 125% of base). 1h only wins if the read-amortization within the hour beats that 2× write premium — which is exactly what the A/B measures. If `total_cost_usd` per triage drops, keep it; if not, revert.
- This is a **runtime change → QC reviews it**, even though it's one env-var line. Do it as its own small reviewed change, gated on Q1/Q2 showing cold.

### Q6 — Per-pathway daily spend (feeds the dashboard, Step 46)
```sql
select date(created_at) as day, activity,
       count(*) as queries, round(sum(total_cost_usd)::numeric,2) as spend_usd
from llm_usage
group by 1,2
order by 1 desc, spend_usd desc;
```

---

### Q7 — Message-history token load (Justin's "where do we capture it")
How many tokens does the loaded message-history cost per query? The runtime loads up to the **50 most-recent messages** for a user (`getRecentMessages(userId, 50)`) into the `prompt`. This estimates that load directly from the `messages` table — **no new instrumentation needed**. Run per gatekeeper (and any active user).
```sql
-- Estimate the per-query history token load = chars of the 50 most-recent
-- messages for a user ÷ 4. Run with :uid bound to the gatekeeper's UUID.
with recent as (
  select coalesce(length(message_body), length(content_raw), 0) as chars
  from messages
  where sender_id = :uid or recipient_id = :uid
  order by created_at desc
  limit 50
)
select count(*)                       as messages_loaded,
       sum(chars)                     as total_chars,
       round(sum(chars)/4.0)          as est_tokens_per_query
from recent;
```
**Decide (the message-memory deferral, B.5 of the Lane C handoff):** if `est_tokens_per_query` is **small** relative to the ~28k profile prefix → message-history is secondary for v0.2 → the "remembered-marking + condense + keyword-retrieve" idea stays a v0.3 build (it's the existing ARCHITECTURE "Conversation Compaction" open question). If it's **surprisingly large** → revisit sooner. (Remember: forwards never enter `messages` — `processForward` writes only `emailmgr_items` — so for a forwarding gatekeeper this is just direct emails + gold/edge notifications + feedback, expected to be bounded.)

---

## 3. What this plan resolves, and what it can't

- **Resolves:** our *effective* cache TTL (Q2) without SDK docs; the cold-vs-warm reality (Q1/Q3); whether the env-var TTL experiment is worth it (Q5); the consolidation payoff (Q4). These together collapse the model's biggest uncertainty.
- **Can't resolve from our side:** *where* the SDK places cache breakpoints. The byte-identity of our common prefix is verified at source level (Step 11b — see the lane handoff), but the realized cache structure is SDK-internal. Q1–Q3 are how we observe it indirectly. If the SDK ever exposes a TTL knob (tracking SDK issues #188 TS / #864 Python), revisit Step 11a as a real one-liner then.

---

## 4. Pointers
- Cost model + the lever this serves: `evryn-team-workspace/shared/projects/product/research/2026.06.11 evryn-cost-analysis.md` (Lever 4, §5).
- Capture layer: `evryn-backend/src/db/llm-usage.ts`; choke point: `src/triage/classify.ts` `runEvrynQuery`.
- Sprint home: `evryn-backend/docs/SPRINT-V0.2-HARDENING.md` Steps 11a/11b/11c (+ 46 for the dashboard).

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
