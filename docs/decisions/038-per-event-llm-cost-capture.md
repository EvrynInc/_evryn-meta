# ADR-038: Per-Event LLM Cost/Token Capture

**Date:** 2026-06-10
**Status:** Accepted — built + deployed (evryn-backend `23f9858`, prod migration applied 2026-06-10)
**Related:** ADR-007 (Budget-Based Limits — the inherited principle), ADR-020 (model-tier selection), ADR-037 (dev-first migrations)

## Context

The runtime computed per-query usage (input/output/cache tokens + `total_cost_usd`) inside `runEvrynQuery` (`src/triage/classify.ts`) and only `console.log`'d it — so cost data evaporated with Railway's 30-day log retention and could answer none of: "cost per gatekeeper per day/month," "where is spend coming from," "what did onboarding a user actually cost." Justin's driving concern: Opus-for-everything at ~200 forwards/day may not scale, and we need real per-message-shaped cost data **from Mark's first email**, not after.

ADR-007 (budget-based limits) was written for the *old team-agents/Lucas era* (Jan 2025) — its principle (money is the limit; tiered alert→halt; measure cost not proxies) is sound and inherited, but it predates the Evryn product. The BUILD doc already scoped product cost-tracking as a v0.3 item (mirror the `agent_api_calls`/`agent_daily_spend` dashboard tables; `runEvrynQuery` is the single choke point). This ADR pulls the **capture** half forward to now; alert/halt/dashboard stay later.

## Decision

**Persist one row per `runEvrynQuery` call (the event), not per outbound message.** A large share of spend produces no message (pass/ignore triage, proactive no-ops, operator chat, revisions); scoping capture to messages would systematically undercount the exact thing we're worried about. `runEvrynQuery` is the sole Anthropic choke point (six call sites; web-search/fetch costs are included in the query's cumulative usage; no embeddings or other-provider spend at v0.2).

**New `llm_usage` table** (`backups/add-llm-usage-table.sql`): `created_at, pathway, scope_user_id (FK), emailmgr_item_id (FK), model, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, total_cost_usd, num_turns, activity`. Raw **and** cached tokens stored so cost is recomputable if pricing is restated. `pathway` + `scope_user_id` come from the existing `ToolCallContext`; `emailmgrItemId` was threaded into it from the four item-bearing call sites.

**Design choices:**
- **Best-effort write, never throws.** A cost-logging failure (DB down, table missing, thrown client) is caught + logged + swallowed — it must never break the live email/triage pipeline. Mirrors the `executeApproval` audit-write pattern. Safe to deploy even before the migration is applied (table-missing → swallowed).
- **Capture now, observe later.** No dashboard/alerting in this build. The table mirrors the `agent_api_calls`/`agent_daily_spend` shape so the existing agent dashboard can likely ingest it — a fast-follow.
- **Onboarding-cost via relative-time normalization (downstream, no extra capture).** "Cost to onboard user X" isn't a single event; the dashboard normalizes each user's spend timeline to their day-0 (first message, from `messages`), aligns cohorts, and the onboarding tail becomes visible empirically — then the "onboarding = first X days" line is drawn from real shape. The coarse `activity` tag (derived free from pathway) is a forward-compat hook for finer onboarding-vs-servicing attribution later; precise per-activity tagging is a v0.3 refinement, not a Reflection dependency.
- **Security:** RLS on, `service_role`-only grant, FKs `ON DELETE SET NULL` (a cost row's value is the spend — it must survive deletion of the user/item it referenced, and `RESTRICT` would have blocked the 6-month `cleanup_emailmgr_items()` TTL job). Migration also `REVOKE`s the project's blanket `anon`/`authenticated` grant (see Consequences).

## Consequences

- We have queryable, per-event, per-user, per-pathway spend from go-live — the data needed to make the v0.3 model-tier call (ADR-020) instead of guessing.
- **Known undercount:** a query that throws mid-stream (5xx, billing error, max-turns abort) writes no row — on a throw the usage-bearing result message usually never arrived, and capture is deliberately kept out of the error path so it can't compete with the billing alert. Rare + small; accepted for v0.2 (documented at the call site).
- `model` is captured as the pinned alias (`claude-opus-4-7`), not the served snapshot id — sufficient for v0.2; capturing the served id from `modelUsage` is a deferred v0.3 nicety.
- Surfaced a **systemic** security issue: the Supabase project's `ALTER DEFAULT PRIVILEGES` auto-grants `anon`/`authenticated` on *every* new public table (hits `notify_queue` too). `llm_usage` revokes it explicitly; the systemic retro-fix is a v0.3 security-hardening item (BUILD v0.3 Security Hardening §4).
- Review: DC built; AC reviewed + fixed the FK + REVOKE; QC independently verified (GO) against the live dev DB; AC applied QC's structural-hardening polish (row-build moved inside the best-effort try).

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
