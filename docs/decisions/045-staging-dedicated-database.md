# ADR-045 — Staging runtime gets its own dedicated Supabase project

**Status:** Accepted (Justin ratified 2026-06-24)
**Date:** 2026-06-24
**Authors:** AC4a (staging lane) + Soren (CTO, architectural recommendation)
**Extends:** [ADR-037](037-dev-staging-db-region-conformance-pro.md) (dev/staging DB + Supabase Pro region conformance)
**Context docs:** `docs/working/2026.06.17-ac0-staging-launch-space.md` (staging design), `docs/working/2026.06.17-ac4-staging-validation-playbook.md` (validation procedure)

---

## Context

We are standing up a **staging runtime** before Mark goes live: a second, isolated Railway service running the full Evryn stack, pointed at non-prod, so a release candidate can be validated end-to-end and the **exact same build** promoted to prod. (Pre-Mark, a bad deploy is recoverable; once Mark is forwarding it is not — and every future change needs a safe place to prove out as a whole. So staging is mandatory before Mark.)

The original design baseline (round-1 staging-launch-space doc) pointed the staging runtime's `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` at the **existing dev DB** ("Evryn Product — Dev", us-west-2, ref `maqkdesopsskptpxjbqs`), which today is used **only by admin tooling** for dev-first migration rehearsal + QC live-tests (per ADR-037).

A *running* staging runtime pointed at the dev DB makes the dev DB a **two-writer surface**: the staging runtime continuously writing test rows (`users`/`emailmgr_items`/`messages`/`llm_usage`) **and** the migration-rehearsal tooling.

## Decision

**Staging gets its own dedicated 4th Supabase project** (us-west-2, co-located with the others), **reset-able/disposable** (seeded from a prod-shape `pg_dump`), leaving the dev DB pristine as the migration-rehearsal mirror.

- **Topology:** a dedicated 4th project — NOT the shared dev DB, and NOT a separate schema inside the dev DB.
- **Lifecycle:** on-demand reset / disposable. Staging's DB holds nothing real, so the answer to accumulation is **reseed, not prune**: each reset restores the latest prod-shape schema dump (ADR-037's `pg_dump` model) + a small synthetic seed. Destructive create-from-zero validation suites can run repeatedly with no cleanup burden.

## Why (the reasoning is epistemic, not just coordination)

The two-writer *coordination* problem (DDL rehearsal running while staging is mid-write) is real but mundane. The **load-bearing** reason is the second one:

ADR-037 built the dev DB as a **faithful clean mirror of prod** so that dev-first migration rehearsal actually *validates* (rehearse → verify against prod-shape → apply the identical SQL to prod). A migration's correctness often depends on the **data** it runs against (row counts, null distributions, the values in a column getting a new CHECK constraint, FK integrity across `original_from_user_id`, the JSONB shape inside `profile_jsonb`). A running staging Evryn writing continuous synthetic rows makes dev **diverge from prod in exactly the dimension the rehearsal is supposed to certify** — so the rehearsal still *runs* (green light) but no longer *means* what we think. That is the trap: a green light that doesn't mean what you assume.

This is a **bulkhead** argument: dev-as-clean-mirror and staging-as-system-exerciser are two compartments that must stay watertight. Sharing knocks a hole in the wall and stations a manual "reset ritual before each rehearsal" to bail — safety that depends on *remembering*, which fails under pressure, exactly when it matters. The 4th-project call simply extends ADR-037's own logic (it already chose a separate *project* over a Supabase *branch* for clean isolation).

**A separate schema inside the dev DB was rejected** as *false isolation*: same compute, same connection pool, same backup/PITR unit, same blast radius if a staging `TRUNCATE`-and-reseed goes wrong. False isolation is worse than honest sharing because it *looks* safe.

## Cost

**~$10/month marginal** — one more Micro compute instance on the **Supabase Pro plan we already pay** ($25 base + ~$10/Micro per project − $10 credit, across the existing 3 projects per ADR-037). The base fee and the project-cap are already paid; a 4th project is one more Micro instance, **not** another $45 plan. At a stage where a single confusing migration incident on Mark's live data could end the pilot, ~$10/mo to keep the rehearsal honest is not a close call.

## Consequences

**Positive (three clean side-wins):**
1. **Preserves an architectural invariant.** ARCHITECTURE.md states "dev is reached only by admin tooling, never by the runtime." Pointing the staging *runtime* at dev would have been the **first time any runtime touched the dev project** — quietly weakening that invariant. A dedicated 4th project gives staging its own *purpose-built* DB that a runtime is *designed* to point at; the dev project stays tooling-only. The validation playbook's cross-wiring pre-flight gate becomes a check against a **third, purpose-built** ref — even less ambiguous.
2. **Cost-attribution cleanliness.** Staging's `llm_usage` rows land in **staging's own DB**, so prod cost analysis is never polluted by test traffic. (Anthropic API spend is still shared at the billing level if the same API key is reused; the per-event capture table — the thing we analyze — stays clean.) This pairs with the dashboard "staging tab" (a duplicate vitals endpoint pointed at staging's DB: visible, isolated).
3. **Disposable-by-design** removes the accumulation-management problem entirely.

**Costs / trade-offs:**
- ~$10/mo recurring.
- One more project to provision + maintain (the standup runbook covers it — OC owns provisioning).

**v0.3 implication:** the topology generalizes cleanly. When v0.3 brings the web app, matching/embeddings, and real-time traffic, "staging has its own faithful-mirror, reset-able DB" is exactly the shape for load-testing the matching pipeline and rehearsing the bigger schema changes (`user_locations` PostGIS, embedding tables, `match_candidates`) without touching prod **or** the rehearsal mirror. The ~$10/mo is a permanent, well-spent fixture, not a v0.2 stopgap. If staging ever holds anonymized-real-shaped data for matching tests, that data-bearing seed artifact follows ADR-037's rule (data-bearing dumps → encrypted cloud storage, not git).

## Breadcrumbs (so this isn't re-litigated)

- **ADR-037** — add a forward-pointer noting the staging-runtime DB is its own 4th project per this ADR (the dev DB is rehearsal-only; the runtime never points at it).
- **ARCHITECTURE.md** "Separate Supabase Projects" — update the project list from three to **four** (add the staging project) once it's provisioned. *(Auth-gated ARCH edit → AC0/Justin apply.)*
- **`docs/current-state.md`** — record the staging DB topology decision at the next #lock. *(Auth-gated → propose.)*
- **The staging design docs** (`2026.06.17-ac0-staging-launch-space.md`, `2026.06.17-ac4-staging-validation-playbook.md`) — the DB baseline updates from "the existing dev DB" to "a dedicated 4th project" (carried in the staging-r2 handoff).

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
