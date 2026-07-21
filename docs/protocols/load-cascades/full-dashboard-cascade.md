# Full Startup Context Cascade — Dashboard (`_evryn-meta/dashboard`)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the **per-build full cascade** for doing *or directing* build work on the **monitoring dashboard** (`_evryn-meta/dashboard`, deployed at `evryn-dashboard.vercel.app`). It is the `dashboard` branch of `_evryn-meta/CLAUDE.md`'s cascade router: **load the Light Startup Context Cascade (in CLAUDE.md) first, then this.** A **reference** (a precise load list), not an explanation. **The universal full-cascade PRINCIPLES** — "when Justin calls the full cascade it is non-negotiable — do not trim it," verify-at-claim-is-additive, which-runtime-state-did-you-load — **live in CLAUDE.md and govern this load; this file is the dashboard FILE LIST + contract register those principles apply to.**
>
> **Owner: AC.** Edits need Justin's approval (propose first). Keep the CONTRACT REGISTER (§3) in lockstep with the runtimes — when a runtime renames a column, changes a status enum, alters `/health`, or changes the team-runtime control semantics, update the matching entry here and bump the reconcile date, or a stale register silently misleads a dashboard build.

---

## The nature of THIS target — read this before the load list

The dashboard is a **non-agentic** static SPA (`public/index.html`, vanilla JS + Chart.js) plus four Vercel Edge Functions (`api/data.ts`, `api/usage.ts`, `api/product.ts`, `api/team.ts`). **It has NO identity half of its own** — that's exactly what makes it a clean `#cascade-override` target under `ac-orchestration-protocol.md` ("When the target is a SEPARATE codebase"): a dashboard build swaps in *this* load and does NOT pull the Evryn-runtime cascade, because the dashboard doesn't compose wakes or run agent judgment.

**BUT its whole job is to read (and, for the team tab, WRITE) the state of TWO agentic runtimes plus one legacy DB.** So its dependencies are **contracts owned elsewhere, in systems that evolve independently:**

| The dashboard's… | reads/writes | owned by |
|---|---|---|
| **Agents tab** (`api/data.ts`, `api/usage.ts`) | `agent_daily_spend` · `agent_api_calls` · `agent_messages` | the **legacy Agents DB** (us-east-1, prior-era team monitoring) |
| **Evryn Product tab** (`api/product.ts`) | `llm_usage` · `messages` · `emailmgr_items` + Railway `/health` | the **Evryn product runtime** (`evryn-backend`) |
| **Team Runtime tab** (`api/team.ts`) — a **control panel that WRITES** | `agent_state` · `agent_capabilities` · `capability_catalog` · `capability_tiers` · `wake_manifests` | the **team runtime** (`evryn-team-runtime`) |

**This is a FLUID-CONTRACT problem, not a stable-runtime one** — and it is the sharpest form of the "identity-as-runtime dividend." A `dashboard/`-only read tells you what the dashboard *thinks* the contracts are; it CANNOT tell you the runtime has since renamed a column, added a status, or changed the `/health` shape. When that drifts, the dashboard doesn't error — it shows a **dropped light, a stale zero, or (on the Team tab) writes a row the runtime's gate no longer reads the way the dashboard assumed.** The Team tab is the highest-stakes: `api/team.ts` explicitly says *"do not invent — this must match the process exactly, since both write the same rows"* (the ~5s gate-cache TTL means a mismatched write bites within seconds).

**⇒ How to hold this cascade (the "stable spine + drifting contract-register, re-verified live" shape):**

- **§1–§2 (the dashboard's own code + its framing docs) are the STABLE SPINE — must-load, in full, never trim.** They change only when *you* change them.
- **§3 (the CONTRACT REGISTER) is the FLUID part.** Each entry names *what* the contract is and *where its authoritative source lives in the runtime*, and tells you to **read that live source to confirm the contract is still what this doc says.** This doc is a **map to the current territory, never a substitute for it** — the runtime owns the shape, so you re-derive the shape from the runtime at build time.
- **The `Last contract reconcile:` marker (below) makes drift visible.** A stale date is a signal the register may have moved under you.
- **The humility is scoped to §3 ONLY — and it is *additive*, never subtraction.** "Re-verify against the live source" is a step you *add*; it is **never** license to skip loading a named file. You cannot competently touch a dashboard read without knowing the columns it reads, and you cannot know those without loading the source file that defines them. Under-loading here breaks things exactly the way under-loading anywhere does.

**`Last contract reconcile: 2026-07-21`** *(AC — first authoring; §3 product contracts confirmed against live `evryn-backend/src`. Team-runtime + legacy-Agents contract *sources* named from `api/team.ts` / `api/data.ts` themselves and cross-checked against the dashboard reads — NOT yet re-read against the live `evryn-team-runtime/src`; re-verify those two against their live source on the next team-tab or agents-tab build.)*

---

## §1 — The dashboard's OWN codebase (STABLE SPINE; load in full)

All in `_evryn-meta/dashboard/`. **Enumerate live** (`git -C _evryn-meta ls-files dashboard`).

- **`public/index.html`** (~2,000 lines) — the entire frontend: CSS, the three-tab SPA, the render + control logic, Basic-auth login, Chart.js usage chart. The load-bearing UI file — read it in full for any dashboard work.
- **`api/product.ts`** — the Evryn Product tab's edge function. The single richest contract surface: it holds the `llm_usage` / `messages` / `emailmgr_items` column allowlists, the `/health` fetch + `parseHealthChecks`, and — critically — the **PII posture** (aggregates/statuses/costs/timestamps only, column-allowlisted, `subject` truncated to 60, `cross_user_notes` never touched). ⚠️ **That aggregates-only / PII-firewall posture is a HARD CONSTRAINT** — the dashboard is web-hosted, so any new read you add must not surface raw user data.
- **`api/team.ts`** — the Team Runtime control panel (GET reads state, POST writes pause/hard-pause/kill/resume/capability/tier/reason). Read the header comment block: it enumerates the runtime semantics this file MIRRORS and MUST match.
- **`api/data.ts`** + **`api/usage.ts`** — the legacy Agents tab (spend + activity + usage chart).
- **`package.json`** (only dep: `@supabase/supabase-js`), **`vercel.json`** (`outputDirectory: public`, no build step), **`.gitignore`**.
- **Deploy model:** the dashboard ships from `_evryn-meta` — **the `_evryn-meta` push IS the deploy** to Vercel (confirmed in `current-state.md` for the Step-78 Half-B deploy). Auth = Basic auth, user `evryn`, `DASHBOARD_PASSWORD` (fail-closed if unset). Env-var pairs (each a SEPARATE project, never cross them): `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (Agents) · `PRODUCT_SUPABASE_URL`/`PRODUCT_SUPABASE_SERVICE_ROLE_KEY` (Product) · `TEAM_SUPABASE_URL`/`TEAM_SUPABASE_SERVICE_ROLE_KEY` (Team) · `RAILWAY_HEALTH_URL` (product `/health`). Every endpoint returns `{ configured: false }` (HTTP 200) when its env is unset — the tabs render an inert "not connected" state, never a 500.

## §2 — Framing docs (STABLE SPINE; the altitude the contracts sit at)

- **`evryn-backend/docs/ARCHITECTURE.md`** — the **Data Model** rows for `llm_usage` (ADR-038) + `emailmgr_items` (status lifecycle, ADR-018) + `messages`, the **Monitoring & Silent-Death Safety (M1)** section, and the **Security → Bulkhead Layers** section (the PII-firewall posture the dashboard must honor). Read the specific rows/sections your work touches, not the whole doc, unless directing a broad dashboard build.
- **`_evryn-meta/docs/current-state.md`** + **`_evryn-meta/docs/deploy-log.md`** — what's actually LIVE vs. inert. (E.g. Step 78: the dashboard's per-subsystem `/health` lights render idle until the backend's real `/health` deploys — the dashboard degrades gracefully by design.)
- **`_evryn-meta/docs/protocols/ac-orchestration-protocol.md` → "When the target is a SEPARATE codebase"** — the authoritative rule for how a `#cascade-override` dashboard build is briefed (it names the dashboard as *the* canonical non-agentic example). Read it before spinning a DC/QC dashboard trip.

## §3 — The CONTRACT REGISTER (FLUID; RE-READ THE LIVE SOURCE to confirm each is still current)

**Each entry = what the contract is · where its source-of-truth lives · why it drifts.** Load the source file for the contract your task touches, and confirm the shape below still matches — the runtime owns it, this doc only points.

**PRODUCT-runtime contracts (`evryn-backend` — confirmed live 2026-07-21):**

- **`llm_usage` columns** (Product tab cost) → source: **`evryn-backend/src/db/llm-usage.ts`** (`LlmUsageRow`). `api/product.ts` reads `total_cost_usd`, `activity`, `model`, `created_at`. Drifts when a cost column is renamed or the `PATHWAY_ACTIVITY` / model-id set changes (the by-model Opus/Haiku cut keys on the raw `model` string).
- **`emailmgr_items` status + fields** (Product tab activity/recent-items/error-drill-down) → source: **`evryn-backend/src/db/items.ts`** (the `ItemStatus` enum — note it now includes `queued` from Clustering — plus `triage_result`, `subject`, `created_at`, `updated_at`). `api/product.ts` filters on these statuses; a new status the dashboard doesn't know about goes uncounted. **PII line:** only `created_at`/`status`/`triage_result`/`subject`(≤60 chars) may leave — never `content_raw`/`original_from`/`metadata`/`user_id`.
- **`/health` shape** (Product tab liveness banner + 5 subsystem lights) → source: **`evryn-backend/src/safety/health.ts`** (`HealthResponseBody`) + **`src/safety/liveness.ts`** (`decideHealthStatus` — the `halted` > `wedged` precedence; 503 for `wedged`, 200 for `halted`) + the handler wiring in **`src/index.ts`**. Tri-state `status` (ok/wedged/halted) + `checks{ db, slack_socket, poll, m1 }`. `api/product.ts`'s `parseHealthChecks` reads the OLD (no-`checks`) shape as null → idle lights, so it degrades gracefully — but a *renamed* check key would silently blank a light.
- **`messages.created_at`** (Product tab last-activity) → source: **`evryn-backend/src/db/messages.ts`**. Only `created_at` leaves the table (PII line).

**TEAM-runtime contracts (`evryn-team-runtime` — a SEPARATE agentic repo; the Team tab both READS and WRITES these, so drift = a broken control panel):**

- **Control semantics** (pause / hard-pause / kill / resume, and the reserved `__global__` / `__runtime__` rows) → source: **`evryn-team-runtime/src/safety/kill.ts`**. `api/team.ts` writes `active` / `hard_paused` / `killed_reason` to MATCH what the runtime's PreToolUse gate reads. ⚠️ If `kill.ts` changes what a pause/kill sets, the dashboard's writes go out of sync and the ~5s gate-cache means it bites fast.
- **Scheduler row-shape** (runtime-alive heartbeat + in-flight thread counts + the reason-column caveat) → source: **`evryn-team-runtime/src/scheduler/index.ts`** (`singleton_lock.heartbeat_at` / `.threads`, and `buildThreadLockUpsert`'s "deliberately WITHOUT `active`" pattern the dashboard's `set_reason` mirrors).
- **The state tables** (`agent_state`, `agent_capabilities`, `capability_catalog`, `capability_tiers`, `wake_manifests`) → source: the `evryn-team-runtime/migrations/*.sql` that define them (+ `src/db/types.ts`, hand-maintained against those migrations). `api/team.ts` reads these column-allowlisted (states/capabilities/timestamps/thread-counts/wake-reasons only — it NEVER touches `agent_messages`, which carries internal team deliberation: a PII/confidentiality line).
- **You do NOT need the team runtime's IDENTITY half for a dashboard build.** The dashboard reads/writes the runtime's *state tables*, not its composed wakes — so load the specific `src`/migration sources above, not the agent definitions/memory/composer. (This is the one place the dashboard's contract with an agentic runtime is narrower than a full runtime load.)

**LEGACY Agents-DB contracts (prior-era; low-priority; may be retired):**

- **`agent_daily_spend` / `agent_api_calls` / `agent_messages`** (Agents tab) → these predate the current team and track the *previous-era* agents (thea/lucas/alex/taylor/dana/jordan/dominic/nathan, hardcoded in `index.html` + `api/data.ts`). No live `src` owner in the current runtimes — the schema is whatever the legacy Agents DB holds. Before building against the Agents tab, confirm with Justin whether it's still live or being superseded by the Team Runtime tab.

---

## The discipline (why the split is drawn where it is)

**§1–§2 are a normal must-load — you don't trim them.** The dashboard is small, but a change to one tab's read still wants `public/index.html` (the render side) AND the matching `api/*.ts` (the data side) in full, or you'll break the pair.

**§3 is where the humility lives — and it is *additive verification*, never subtraction.** The contracts are genuinely the runtimes' to define, and they move, so a frozen copy in this doc would rot; the honest move is to name the live source and read it at build time. That is a *requirement to re-read the source*, not permission to skip it. The failure this guards against is a *silent* one — a dashboard that renders a stale or wrong picture (or, on the Team tab, WRITES one) because a contract drifted and nobody re-checked. When you touch a contract, re-verify it against its live source **and** update this register's entry + the reconcile date in the same pass — so the next builder inherits the current map, not a stale one.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
