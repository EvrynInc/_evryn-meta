# Cost Levers — Consolidated Session Notes (ACf + ACo + Justin, 2026-06-12)

> **How to use this file:** Consolidated working notes from TWO parallel cost sessions with Justin on 2026-06-12 — ACf (batching/clustering/ops-design angle) and ACo (cache-mechanics/tiering/turn-anatomy angle). **This doc absorbs and supersedes `2026-06-12-aco-cache-and-tiering.md`** (synthesized 2026-06-12 by ACf at Justin's direction; the ACo doc can be deleted). The two sessions converged — no unresolved forks; the one real tension (cluster cadence vs gold latency) is recorded as a decided trade-off in §6.
>
> **Audience:** AC0, who is running the v0.2-hardening builds and will integrate this where it needs to go (Justin's call — ACf makes NO downstream edits to SPRINT/BUILD/Mira-dispatch/v2-appendix; that's all AC0's). After integration, this doc likely moves to research, then retires.
>
> ## ⚠️ CONFIDENCE DISCIPLINE — READ FIRST (Justin's directive, from the ACo session)
>
> This doc mixes verified facts, modeled estimates, and unverified hypotheses. **Each claim is tagged. Do NOT take a `[MODELED]` or `[VERIFY]` claim as settled fact.**
>
> - **`[HARD]`** — measured (the 4 cost-captured queries), read from the runtime code, or verified against current API documentation. Trust it.
> - **`[MODELED]`** — extrapolated from the cost model. Has a basis and a band; never measured.
> - **`[VERIFY]`** — a hypothesis needing a log pull, SDK check, or test before acting on it. Consolidated list in §13.
> - **`[DECIDED — Justin]`** — his call, made in one of the two 2026-06-12 sessions. Decisions log in §14.

---

## 0. The pricing facts everything rests on `[HARD]`

From the Claude API reference (current rates, June 2026). Evryn runs `claude-opus-4-7` (`EVRYN_MODEL` in `src/triage/classify.ts`).

| | Input | Output | Cache **read** (0.1×) | Cache **write** 5-min (1.25×) |
|---|---:|---:|---:|---:|
| **Opus 4.7 / 4.8** | $5.00/M | $25.00/M | **$0.50/M** | **$6.25/M** |
| **Sonnet 4.6** | $3.00/M | $15.00/M | $0.30/M | $3.75/M |
| **Haiku 4.5** | $1.00/M | $5.00/M | **$0.10/M** | $1.25/M |

- Default cache TTL is **5 minutes**, refreshed on each hit. 1-hour TTL costs **2×** to write (Opus $10/M).
- **Caches are model-scoped.** Opus and Haiku have separate caches — one model's reads never warm the other's.
- A cache entry becomes **readable only after the first response begins streaming** — N parallel identical-prefix requests all pay full price; "1 warm-up, then fan out" is the parallel-safe pattern.
- Min cacheable prefix on Opus 4.7 = 4,096 tokens; Evryn's prefix (~28k identity + ~28k test-Mark profile) is well above.
- **Batch API:** 50% off ALL token usage including cache rates; up to 100k requests/batch; most complete <1h, max 24h. Cache hits *inside* a batch are probabilistic (concurrent processing; 5-min TTL vs up-to-1h window). See §6 for why we're not using it.
- Sonnet is now only **1.67× cheaper than Opus** — Sonnet-tiering is structurally weak; Haiku (5×, and far more on multi-turn asymmetry) is the only tier worth quality risk. ADR-020's "Opus for everything" got cheaper to hold.

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
→ output ~$12/MTok · per-turn ~$0.058 · **per-query cold intercept ~$0.81** (the one-time cold cache-write of the prefix; collapses to ~$0.07 warm).

All 4 captures wrote 119k–144k cache-create tokens → **all 4 were cold** (test queries >5 min apart). Every measured number is a *cold-cache* number.

---

## 2. The "$15/$75" appendix puzzle — RESOLVED `[HARD]`

Cost-analysis v2's Appendix flagged an unresolved "~2.86× discrepancy" between published list rates and the SDK bill. **Resolution:** the Appendix used stale Opus rates ($15/$75 per MTok); current Opus is **$5/$25** — a 3× difference, which *is* the "discrepancy."

- The headline figures come from the SDK's `total_cost_usd` (the literal bill) and are correct; the stale rates only appear in a failed independent reconstruction that feeds nothing.
- ACf reconstruction of Q C at current rates: $1.77 (5-min writes) vs actual $1.92 — within ~8%. **The wrong recompute validates the right bill**; the SDK prices at current list.
- **Action (AC0):** fold this resolution into v2's Appendix so a future reader doesn't re-chase it.

---

## 3. What a "turn" is, and the multiplication problem `[HARD]` mechanics

One **query** = one inbound → one Evryn response = one `runEvrynQuery`. Inside it, an agentic loop: model emits a tool call → runtime executes → result appended → next call → … until done or `maxTurns: 20`. **A turn is one internal round-trip within the query, and each turn re-sends the entire (growing) context.** Capture C processed ~943k tokens for one 15-turn query.

**Caching is what makes that affordable.** Decomposing C's $1.92: cold prefix write ~144k × $6.25/M ≈ **$0.90**; cache-read across turns ~780k × $0.50/M ≈ **$0.39**; output ~19k × $25/M ≈ **$0.47**. Without caching the re-reads alone would be ~$3.90.

→ **Two multiplicands to attack: context size AND turn count.** Most levers below hit both. This is also why Justin's tiering insight (§5) is right: one Haiku read vs a multi-turn Opus loop is a ~30–100× gap, not the 5× rate ratio — Opus re-reads the whole package every turn.

---

## 4. Turn-vs-runtime audit — bookkeeping the runtime should own `[HARD]` (read against the runtime)

Reconstruction of a 15-turn pass *(literal trace aged out with the container; reconstructed from `activities/triage.md` + the tool set + Findings; counts are inference, the verified column is code-read)*:

| Turn | Could be… | Status |
|---|---|---|
| status → `processing` | **Runtime — ALREADY does this** | **`[HARD]` redundant.** `processForward` sets it *before* calling Evryn; triage.md also tells her to set it → she re-writes it. **Cut the triage.md instruction** (free). |
| check prior-triage history | **Runtime could pre-load** | `[HARD]` gap. Runtime pre-loads *conversation* history but NOT the `original_from_user_id` prior-triage lookup; triage.md makes her spend a turn on it. Pre-fetch → turn gone. |
| create/find user record | **Runtime already reifies sender at forward time** (ADR-036) | `[HARD]`. Record usually exists by triage time; her `create_user` call is often a redundant turn. |
| re-read Mark's profile | **Already in the cached prefix** | `[VERIFY]` whether she actually spends a turn on this. |
| status → terminal | **Runtime, via structured output** | Evryn returns structured verdict `{result, reasoning}`; runtime writes status — removes the turn AND fixes Finding (g) (her `supabase_upsert` status writes bypass `metadata.lifecycle`). |
| web research ×4–5 | **Truly Opus** | Judgment — keep, but scope to non-obvious only (§9 proportional research + §5 screen). |
| note-writing ×3 | **Content is Opus; over-writing is waste** | One tight note for gold/edge; zero for passes (pass-stamp). |

**Headline:** the runtime makes Opus spend full-context turns on *deterministic bookkeeping*. **Cleanest structural move:** runtime does all bookkeeping + pre-loads everything (conversation history, prior-triage history, sender record); **Evryn does only judgment + returns a structured verdict the runtime persists.** A pass drops ~15 → ~2–4 turns; a gold ~13 → ~5–6. Attacks turn-multiplication at the root, *independent* of tiering. (This is also what makes the pass decision single-shot-shaped — the property that made batching conceivable at all, §6.)

**Tier-candidate boundary:** the only clean cheap-model candidates are the **obvious-pass screen** (§5) and the **"is this a real person / obvious-ignore" first-call** (partly deterministic already — empty-body bounce, Finding 21/6a). The draft to Mark (user-facing voice), research synthesis, and note content are genuinely Opus. Don't tier those.

---

## 5. Haiku pre-screen `[MODELED] + [VERIFY]` — **[DECIDED — Justin: pull up to v0.2 hardening]**

**Mechanics correction that shapes everything:** you canNOT tier *within* a query — `query()` is pinned to one model. Tiering = a **separate cheap pre-call** gating whether the Opus query runs at all:

```
forward → Haiku screen (one self-contained call): "obvious no-fit for Mark?"
   ├─ obvious pass → record pass (deterministic stamp), done. OPUS NEVER RUNS.
   └─ maybe / edge / gold → full Opus runEvrynQuery (as today)
```

- **Reasoning-on-downgrade boundary (Justin, 2026-06-22) — honor when building this screen:** the `obvious pass → record pass (deterministic stamp)` branch writes **NO** reasoning (slam-dunk passes never need it). The case that DOES need a few lines is the *Opus* branch — a forward that read as gold/edge until research downgraded it to a pass. Mark will ask about those, and Evryn must be able to say *"looked good to me too at first, but research found X."* Build the split accordingly, and resolve the open tension (that reasoning may already live in Mark's conversation history → a separate write could double the work). Full design: `_evryn-meta/docs/working/2026-06-22-triage-reasoning-on-downgrade.md`.
- **Self-contained — load NONE of Evryn's identity.** `[Mark's tight criteria ~2k] + [email ~1k] + [one-line instruction]`, output ~100 tok. Cold ~$0.004 · warm **~$0.002/screen** `[MODELED]`. Whole screening layer: **~$15–30/mo**, killing ~5,650 Opus queries worth ~$1,800/mo (warm) and far more cold.
- **Safety rule (non-negotiable — asymmetric error):** Haiku may **only PASS, never gold/edge**, and must **over-escalate on any whiff of potential.** A false-pass is silent and un-backstoppable (no draft → the approval gate never sees it — exactly the Gate-B "un-backstoppable" class). A false-escalate costs one Opus query.
- **Validation = shadow mode `[VERIFY]`:** run the screen logging what it *would* decide (not acting) for a week against Opus's real verdicts; measure false-pass rate on golds/edges; ~0 → flip on. Also calibrate against the existing **18-fixture answer key** pre-live. This is the ADR-020 model-tier analysis done cheaply.
- **Ongoing audit:** periodic Opus re-review of a sample of Haiku-stamped passes (an offline job — Batch-API-able at 50% off if ever desired).
- Cross-model cache note `[HARD]`: Haiku never warms Opus (model-scoped caches). Fine — the screen handles the *stop* majority; on escalation it adds ~$0.003 overhead (~$1/mo total).

---

## 6. Batching — clustering chosen; Anthropic Batch API out **[DECIDED — Justin]**

Two distinct things both called "batching":

### 6a. Anthropic Batch API — investigated, OUT for now `[HARD]` mechanics

- A batch request = one `messages.create` call. **Server-side tools (WebSearch/WebFetch) run INSIDE a single request** — a batched Evryn could still research. **Client-side tools (our MCP: supabase, append_pending_note, submit_draft) END the request** — continuing requires a new request in a new batch round (each up to ~1h). *(This resolves ACo's `[VERIFY]` #3: confirmed, the multi-client-tool loop doesn't compose; a single-shot classify would.)*
- Post-pass-stamp + §4 bookkeeping-move, the pass decision becomes near-single-shot → technically batchable via a hand-rolled Messages API path (the Agent SDK doesn't batch).
- **Why it's still out:** (1) architecture misalignment — a real rebuild off the SDK for the triage path; (2) cache benefit inside a batch is probabilistic while caching is the more powerful lever; (3) clustering (6b) captures most of the same savings with control and near-zero build. Residual upside if layered on a clustered pipeline ≈ $100–200/mo at Mark scale `[MODELED]` — not worth it. **Revisit trigger:** multi-gatekeeper scale where the residual Opus bill grows enough that another 50% pays for the build.

### 6b. Time-clustering — our mechanism: **daily cluster + morning package [DECIDED — Justin]**

Hold all forwards; run the pile **once a day, first thing**:

1. **Haiku phase** — all held forwards through the §5 screen.
2. **Opus phase** — survivors (~300/mo ≈ 10/day) through full triage, back-to-back. First Opus query of the day pays the one cold prefix write (~$0.50); the rest run warm.
3. **Morning package** — gold/edge drafts land in Justin's approval queue together; he vets; **Mark gets one package every morning.**

**Sequencing mechanics (Justin's question, answered `[HARD]`):**
- Sequential is NOT cache-required — "1 warm-up query, then fan out in parallel" works (cache readable once the first response starts streaming).
- **But sequential is sufficient and free:** the runtime is already strictly sequential; ~10 Opus queries/day clear in ~5–10 min; sequential avoids rate-limit pressure from parallel multi-hundred-k-token loops. **Recommendation: stay sequential**; revisit only if a pile ever outgrows the morning window.
- Haiku-phase ordering doesn't matter for Opus cache (model-scoped). Precision on "everything's warm but the first": it's the first *query per model per cluster* that pays the cold write; each query still pays its own small per-turn cache extensions.

**Gold-latency trade-off (the one cross-session tension, resolved):** ACo flagged that daily clustering adds up-to-24h latency on golds (time-sensitive) and suggested keeping gold/edge prompt or sub-daily clusters. **Justin's call (ACf session): the daily morning package IS the product design** — one tidy package/day, accepted at Mark scale. Recorded trade-off; revisit cadence if a gatekeeper ever needs faster. Open design question: a same-day escape hatch (e.g., Mark's forwarding note says "urgent") — see §13.

**Ops-design notes for the build brief:**
- Cluster = **forwards only.** Direct messages to Evryn (Mark conversing; operator traffic) stay real-time through existing paths.
- Build shape: **decouple ingest from triage** in the poll loop — forwards land as `new` items immediately (nothing lost), triage-run drains on the daily schedule. Modest DC build; keeps the Agent SDK.
- **M1 interaction:** a silent cluster failure = a whole missed day. The silent-death detector should include a **positive daily heartbeat** ("cluster ran at HH:MM, screened N, escalated M, drafted K"), not just error alerts.
- Proactive cron already fires 8am PT — natural co-scheduling.
- Clustering **supersedes keepalive pre-warming** for triage **[DECIDED — Justin]** (keepalive: ~$0.02–0.03/ping ≈ $150–300/mo — stays in the back pocket for any future must-be-real-time pathway).

---

## 7. 5-min vs 1-hour cache — decision `[HARD] + [DECIDED]`

- **5-min is the dominant lever**: it caches turns *within* a query (all fire within seconds → warm). Automatic; what makes a 15-turn query $1.92 not ~$5.
- **1-hour** only helps *between* human-paced volleys, at 2× write cost. **The logs show only 5-min caching** → SDK defaults to 5-min, nothing sets 1h.
- **Decision: stay on 5-min; defer 1-hour.** Clustering (§6b) is the better tool for between-query warmth. One nuance: 1h might pay for **onboarding volleys** at v0.3 web-app scale (§12) — `[VERIFY]` whether the SDK even exposes the knob, if ever revisited.

---

## 8. Cache partitioning at scale `[MODELED] + [VERIFY]`

**Justin's instinct (correct in principle):** caching is longest-matching-prefix (render order: identity → operator suffix → user suffix → history), so at scale Evryn's byte-identical identity should be *permanently warm* across all users; a new user diverges only at the profile suffix.

**Where it could break — the load-bearing check:** that behavior needs identity to be a **separate cache breakpoint** from the user profile (API allows 4). **The Agent SDK manages breakpoints itself** — unknown whether it places identity│profile separately or caches the whole systemPrompt as one block (→ every new user re-writes identity too). If one block, partitioning is a quiet free win. **#1 SDK check in §13.**

---

## 9. Proportional-research beat in triage.md (Mira) — **[DECIDED — Justin: yes]**

`[HARD]` verified: triage.md never scopes research effort; Phase 5/6 showed Evryn web-verifies during triage; the captured pass burned 15 turns. Beat: **obvious-pass-from-the-email-alone → no research; the research budget is for plausible gold/edge + verifying substantive claims.** Guard: preserve forgiving-skepticism — *limited* info still leans edge, not pass; only *obvious* no-fits skip research. Also from §4: cut the redundant "set status to processing" instruction in the same Mira/identity pass.

---

## 10. Repriced floor `[MODELED]` — corrected volumes

Justin's corrected mix: ~6,000 forwards/mo → **~5,650 obvious passes** (Haiku-killable) · **~300 non-obvious** (incl. ~250 borderline "edge-edges" Haiku must NOT kill, ~25 gold, ~25 edge).

| Layer | ~$/mo |
|---|---:|
| Haiku screen, 6,000/mo | ~$20–30 |
| Daily cold Opus prefix writes (1/day) | ~$15 |
| Opus on ~300 non-obvious, clustered warm (incl. gold/edge drafting) | ~$120–200 |
| Overhead pathways (operator chat, proactive, follow-up, revision — un-captured) | ~$50–200 |
| **Total — Mark period** | **~$250–450** |

vs ~$11,000 today (HARD-anchored) and v2's ~$2,000 warm floor. **The v2 "irreducible ~$200" floor is reachable during v0.2** — via §4 bookkeeping + §5 screen + §6b clustering + §9 proportional research + the already-planned pass-stamp/note-template/lean-Reflection — with no Batch API and no architecture rebuild. *(ACo's $150–380 and ACf's $250–450 are the same estimate with/without overhead pathways.)*

Per-query anchors behind the table: cleaned warm pass ~$0.32 `[MODELED, v2]`; warm gold/edge ~$0.62–0.67; Haiku screen ~$0.002–0.004; first-of-day cold Opus ~+$0.50.

---

## 11. Onboarding cost model `[MODELED]` (v0.3-relevant)

Onboarding = N sequential `processDirect` volleys, each billable, human-paced → **cold each volley** (the A/B conversation anchors were cold, so they apply directly). Formula: `1 research-heavy volley (~$1.7) + (N−1) conversation volleys (~$1.2–1.3)`:

| Onboarding | N volleys | Total (cold) |
|---|---:|---:|
| Lean | ~7 | ~$9 |
| **Typical** | **~11** | **~$14** |
| Deep | ~18 | ~$24 |

- Warm (1h TTL + fast replies) ≈ halves it — the one place 1h cache might pay; deferred per §7.
- **v0.3 concern, not v0.2** — Mark onboards once (~$14, noise). Material when the web app makes everyone onboard.
- `[VERIFY]` the real number: (a) once real-Mark onboards — `SELECT count(*), sum(total_cost_usd) FROM llm_usage WHERE pathway='processDirect' AND scope_user_id='<mark>'`; (b) from the pre-wipe dump (prod machine, not laptop) — count Mark↔Evryn direct-conversation rows → drop N into the formula.

---

## 12. Levers NOT changed by these sessions

The v2 analysis's core levers stand: **deterministic pass-stamp** (still #1 — the only lever deleting whole LLM calls), **Mira note template**, **lean Reflection consolidation** (the profile re-read tax compounds with everything above — a bloated profile makes even warm clustered reads expensive). Gate B as planned. Web-app/v0.3 interactive paths stay live/full-price by design — paying customers, real-time UX **[DECIDED — Justin]**.

---

## 13. Consolidated `[VERIFY]` list + build candidates (for AC0 / the prod machine)

**Verify (ordered by leverage):**
1. **SDK cache-breakpoint behavior** (§8) — identity cached separately from user profile? Potential free win at scale.
2. **Haiku screen shadow mode** (§5) — false-pass rate on real golds/edges over a week; plus 18-fixture calibration.
3. **Cache temperature under real volume** (§3) — `cache_create` vs `cache_read` ratio week one; with clustering live, this becomes "confirm the cluster runs warm as designed."
4. ~~Batch-API ↔ agentic-loop compatibility~~ — **RESOLVED** (§6a): doesn't compose with the multi-client-tool loop; single-shot would; out regardless per Justin.
5. Real onboarding cost via `llm_usage` (§11).
6. Current **web-search per-search pricing** (for the addendum's per-query research line).
7. Whether the SDK exposes a 1h-TTL knob (only if §7 ever revisited at v0.3 scale).
8. Morning-package **same-day escape hatch** design (urgent-flagged forwards) — design question, not blocker.

**Build candidates (ordered):**
1. **Runtime-does-bookkeeping + structured verdict** (§4) — cuts turns at the root; the free first step is cutting triage.md's redundant `processing` instruction.
2. **Haiku pre-screen** (§5) behind shadow mode.
3. **Daily cluster + morning package** (§6b) — ingest/triage decoupling + M1 heartbeat.
4. **Proportional-research Mira beat** (§9) — rides with the Gate-B Mira batch.
5. **Cache partitioning** (§8) — pending the SDK check.

**ADR candidates (for AC0 at spec time — fragment-sweep catch, not yet written by design):** the Haiku pre-screen is the ADR-020 model-tier decision in miniature (write as an ADR-020 amendment when specced); the daily-cluster/morning-package cadence changes pipeline timing semantics and Justin's operating rhythm (ADR-worthy when built); runtime-does-bookkeeping + structured verdict touches ADR-033 territory (it removes tool-call surface from Evryn). None written this session — decisions live here + in Justin's head + AC0's queue; AC0 writes them at spec time so they're grounded in the actual build shape.

## 14. Decisions log **[DECIDED — Justin, 2026-06-12]**

1. Anthropic Batch API: out (revisit trigger: multi-gatekeeper residual bill).
2. Time-clustering is our mechanism; **daily cadence, morning package**; gold latency accepted at Mark scale.
3. Keepalive: superseded by clustering (back pocket).
4. Cache TTL: stay 5-min; 1h deferred.
5. Haiku pre-screen: pull up to v0.2 hardening, behind shadow-mode gate.
6. Proportional-research beat: yes (Mira).
7. Persistence: **AC0 integrates everything** — this doc is his input; ACf makes no SPRINT/BUILD/Mira-dispatch/v2-appendix edits. Doc moves to research post-integration.
8. Web-app/v0.3 interactive paths stay real-time/full-price by design.

---

*Consolidated 2026-06-12 by ACf, absorbing ACo's `2026-06-12-aco-cache-and-tiering.md` (drafted same day; safe to delete after this lands). Sources: live sessions with Justin (both instances), cost-analysis v2, full startup cascade + direct runtime read (`src/`, `identity/activities/triage.md`), claude-api pricing reference. PII-free. The pre-wipe-2026-06-11 dump needed for §11(b) lives on the prod machine, not the laptop.*
