# ADR-048 — Explicit, fail-safe environment selection for the Supabase DB

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.
>
> **How to use this file:** The decision record for how the runtime + tests choose *which* Supabase project (prod / dev / staging) they connect to. Read it when touching `src/config.ts`, `src/db/client.ts`, the test-harness DB wiring, or when standing up staging. It records the decision + why; the tracked build handle is **Step 87** in `evryn-backend/docs/SPRINT-V0.2-HARDENING.md`, and the problem provenance is `_evryn-meta/docs/working/2026.07.01-ac2-ac0-dev-prod-db-env-selection.md`.

**Status:** Proposed — Justin gave the design-go 2026-07-01; build in flight (DC on `dc/env-selection-step87`), QC pending, deploy gated on Justin/OC (Railway env-var swap).
**Date:** 2026-07-01
**Authors:** AC3 (identity/ops lane). Surfaced by AC2 (cost lane) + Justin; routed to AC3 by AC0.
**Extends:** [ADR-037](037-dev-staging-db-region-conformance-pro.md) (dev/staging DB + Supabase Pro region conformance), [ADR-045](045-staging-dedicated-database.md) (staging gets its own dedicated 4th project).

---

## Context

Environment selection for the Supabase database is **implicit and fail-OPEN-to-prod** — the worst possible default.

- The runtime AND every `@supabase/supabase-js` integration test read the **same two unqualified** env vars: `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (declared via `required(...)` in `src/config.ts`, consumed by `getDb()` in `src/db/client.ts`). In `evryn-backend/.env` they point at **prod**. There is **no dev-vs-prod selector in the runtime.**
- Pointing a supabase-js integration test at dev means *overriding* those two vars for that run. **Forget the override, and a "dev" test silently runs against prod** — creating users, calling `record_pass`, etc. against live data.
- This nearly bit AC2 on 2026-07-01: the DEV Haiku-screen integration test reads `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` (= prod), so it would have run against prod. **Caught by inspection, not by structure.**
- The admin `psql`/`pg_dump` tooling already uses a *correctly-qualified* scheme (`SUPABASE_DB_URL_PROD` / `_DEV` / `_EAST`, per ADR-037). So there are two credential schemes for "the same" environment — the qualified psql one, and the single unqualified supabase-js one.

**Why it was like this (do NOT naively reverse it):** two same-named `SUPABASE_SERVICE_KEY=` lines in one `.env` collide (dotenv is last-one-wins), so the dev API creds were moved out of `.env` into Bitwarden (ADR-037). Adding a second same-named key back into `.env` recreates the collision. **The fix must be structural (rename the namespace), not a config add.**

Today's only protection is vigilance (test-file headers, one hand-rolled DEV-only guard in `tests/test-execute-approval-transport.ts`). Relying on remembering to check every run means we WILL eventually miss it — a security-by-construction gap that contradicts Evryn's bulkhead architecture.

## Decision

Replace implicit selection with **one explicit, fail-safe env-selection primitive** — designed once, serving prod / dev / staging — combining two parts (per AC2's recommendation + AC3's sharpenings):

**(1) Explicit, qualified selection in `config.ts`.**
- New selector var `EVRYN_ENV` ∈ `{ production, dev, staging }`, **`required()` in the runtime — the process boot-fails if it is unset or invalid.** (This is stronger than "default to dev": the *live* process can never *implicitly* pick an environment. It must declare which one, out loud.)
- Qualified credentials: `SUPABASE_URL_{PROD,DEV,STAGING}` + `SUPABASE_SERVICE_KEY_{PROD,DEV,STAGING}` (kills the same-name dotenv collision — dev/staging creds can now coexist in `.env`/Railway).
- `config.supabaseUrl` / `config.supabaseServiceKey` resolve to the pair matching `EVRYN_ENV`. **`getDb()` in `db/client.ts` is unchanged** — it still reads `config.supabaseUrl`/`config.supabaseServiceKey`; only the *resolution* moves into `config.ts`. `config.evrynEnv` is exposed for the guard + observability.

**(2) A structural test-DB guard.**
- A shared helper (`assertNotProd()`) resolves the active Supabase project ref and **hard-aborts** if it equals the prod ref (`wvaaqwapueycyxyhxdnh`). It generalizes the one-off guard already in `tests/test-execute-approval-transport.ts` into a shared module every integration test runs first.
- The **test harness defaults `EVRYN_ENV=dev`** when unset, then runs `assertNotProd()`. The prod ref becomes **structurally unreachable from the test harness** — even a deliberate mis-selection aborts.

**Fail-safe inversion:** the runtime declares prod *explicitly* (boot-fails if not told); tests default to dev and *cannot* reach prod. Implicit-fail-open becomes explicit-fail-safe.

## Why

- **The runtime's `required("EVRYN_ENV")` boot-fail beats a silent default.** A forgotten env var takes the process *down* (loud, fail-safe), never silently onto the wrong database.
- **The guard is belt-and-suspenders to the selector's suspenders.** Even if selection is somehow wrong in a test, the ref-check aborts before a write lands on prod. Two independent barriers between untrusted-test and prod-data — the bulkhead posture.
- **One primitive, three environments.** This is the same env-separation family as the staging work (ADR-045 / SPRINT Steps 78–82). Staging's cross-wiring safety was going to be a *manual* "prove each credential points at non-prod before first boot" checklist; this primitive makes that **safe by construction**. So the fix is genuinely the foundation of the staging stream, not a throwaway — which is why it was routed to the staging owner (AC3).

## Consequences

- **Deploy coupling (Justin/OC, coordinated at deploy).** The runtime currently reads the unqualified pair from Railway. Cutover: set `EVRYN_ENV=production` + `SUPABASE_URL_PROD` + `SUPABASE_SERVICE_KEY_PROD` in Railway **before/with** the deploy, then retire the unqualified pair. Because `EVRYN_ENV` is `required()`, a deploy that forgets it boot-fails (fail-safe, loud) rather than running wrong — but that means the env-var swap is a hard part of the deploy runbook, not an afterthought. Flagged on the convergence radar (AC0).
- **`.env` / `.env.example`:** dev (+ staging) creds return to `.env` under the qualified names (no collision); prod creds stay in Railway only (least privilege — a developer's local `.env` should not hold prod creds). `.env.example` documents all with placeholders.
- **Files touched:** `src/config.ts` (the selector), a new guard module, the test harness setup + the existing `test-execute-approval-transport.ts` (adopt the shared guard), `.env.example`, a new unit test for the selector + guard. **`db/client.ts` is behaviorally unchanged.** NOT the email-ingest region (AC1) and NOT `classify.ts`/security tools (AC4).
- **Convergence note:** AC2's Haiku pre-screen adds a *different* const (`HAIKU_SCREEN_MODE`) to `config.ts` — additive vs. this URL/key restructure; reconciles cleanly at whichever lands second (AC0 tracking).

## Alternatives considered

1. **Explicit fail-safe selection (chosen — part 1).** The root fix.
2. **Structural test-DB guard (chosen — part 2).** The belt. Chosen *alongside* #1, not instead — defense in depth.
3. **Separate test config / repo (rejected — heaviest).** #1 + #2 buy the same safety without a repo split.
4. **Fold entirely into the staging work (partially adopted).** Not folded *away* — instead, #1+#2 are designed AS the shared primitive the staging work reuses (the unifying insight above).

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
