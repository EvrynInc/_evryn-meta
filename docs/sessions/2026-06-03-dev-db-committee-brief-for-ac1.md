# Dev / Staging Database — Exploratory Committee Brief (for AC1)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.
>
> **What this is:** a self-contained charter for an **AC1 instance** (Architect Claude, second instance) to run a focused investigation — "the DB exploratory committee" — into standing up a **dev/staging database** for `evryn-backend`, and to come back to Justin with a **precise requirements list** and **hardened time estimates** so he can decide whether to do it himself **pre-Mark-live**. Written by AC0, 2026-06-03, at Justin's request.
>
> **Status:** Proposed / not yet started. Justin will spin AC1 to execute this.

---

## Your mission (AC1)

Investigate what it takes to give `evryn-backend` a **dev/staging database separate from production**, and produce a decision package Justin can act on immediately. The two things he needs from you, above everything else:

1. **Precisely what does this need *from Justin*** — the exact human/provisioning/account steps only he can do (clicks, billing, credentials, env vars), enumerated as discrete tasks.
2. **Hardened time estimates** — and specifically, **separate the agent-coding time (fast, DC-multiplier applies) from Justin's human/infra time (the real bottleneck)**. Do not hand back one blended "~30 minutes" number. The whole reason this brief exists is that the human/infra time is the unknown, and Justin is deciding whether *his* lift is small enough to do **now, pre-Mark.**

From your package, Justin will either (1) do it now himself if his lift is low enough, or (2) have you produce a tighter rollout doc linked from the meta meeting doc to spin it ASAP.

## Which tree/branch to read, and the current in-flight state (read FIRST — it explains anything that looks "off")

Read the **main `evryn-backend` tree, checked out on `master`** — not a feature worktree. That's where the current schema, config, migration files, and build doc live. **You do not strictly need the full product-architect cascade for this dev-DB task** — the "Required context" files below are sufficient; load deeper only if you find you need it.

If you *did* load the broader cascade, here's the in-flight state so nothing reads as a contradiction:
- `master` carries the **EVR-71/68 + ADR-036-Trip-1 bundle, merged but NOT yet deployed** — Railway runs older code, so the *runtime on master is ahead of what's live*. Expected; it deploys together soon.
- The **ADR-036 migration** (`backups/adr-036-original-from-user-id-migration.sql`) is **written but not applied** to the DB — it rides the next coordinated deploy. So the runtime references a column the live DB doesn't have yet. *(This is itself a strong argument for the dev DB you're investigating — there's nowhere safe to rehearse it.)*
- **Mira's `triage.md` identity beat** is on a feature branch (`mira/adr036-triage-beat`), not yet merged — so `master`'s `identity/activities/triage.md` is the pre-beat version. Irrelevant to the dev-DB task; noted so it doesn't look inconsistent.

None of this affects your investigation — but it explains any "the code is ahead of the deployed/applied/identity state" observations.

## You are NOT a subagent — you're a full AC1 instance

Justin is spinning you as a real instance precisely because this needs **back-and-forth** with him (provisioning decisions, plan trade-offs, billing). Work conversationally; ask him the questions only he can answer; don't try to one-shot it. A subagent would pull focus and guess; you're here to *think with him*.

## Why this matters (the stakes — hold these the whole time)

- **Day-one-with-Mark is the failure mode that ends the pilot.** Mark is bringing thousands of leads, and likely other gatekeepers who'll each bring thousands more. If a DB bug surfaces in his first days and we have **no safe surface to reproduce/debug/test a fix** — we'd be building the staging surface *during a live incident*. That's slow, and it looks profoundly incompetent to the exact person whose trust the entire v0.2 strategy depends on. Justin's framing: that's suicide. The downside is **catastrophic and hard to reverse**; the setup cost is **bounded**. That asymmetry is why this is pre-Mark, not post-Mark.
- **It's also a capability upgrade for QC, not just safety.** Today QC (Quality Claude) **cannot run code at all** — she's limited to static review + pure (no-DB) tests, because there's no DB she can safely hit. The DB-dependent bugs therefore only surface in *Justin's* manual integration test. A dev DB lets QC actually exercise the runtime against real data — catching those bugs before they reach Justin and **buying back his integration-test time**. Factor this into the recommendation; it strengthens the case.
- **Best practice, plainly:** you never test schema migrations or risky operations against the database holding live user data. The moment Mark's real data lands, testing-against-prod stops being acceptable.

## Current state (what exists today — verify, don't trust blindly)

- **One Supabase project: "Evryn Product"** (`maruxkjwlfltlmureqkt`). It is *production*. There is **no dev/prod separation** — Phase 0d ("environment separation") was deferred for build speed (see `evryn-backend/docs/BUILD-EVRYN-MVP.md`, Build Order Phase 0d = DEFERRED, and the "Dev / Staging Database" note in that doc).
- All testing currently runs against this prod project. It's been *safe so far only because the DB holds test data* — real-Mark is fully out of the DB; only `systemtest@evryn.ai` records exist. That safety evaporates the day Mark goes live.
- **Runtime config:** `src/config.ts` reads `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` from env. So the runtime already *selects its DB by env var* — switching to a dev DB is fundamentally an env-config problem, not a code rewrite. **But** `NODE_ENV` is currently "descriptive only" (post-ADR-029) — there is no real env-switching wired. Determine what selection mechanism we actually want (separate Railway env? a `.env.dev`? a flag?).
- **Migration convention (important, and *not* what you'd assume):** there is **no `supabase/migrations/` directory**. Migrations are hand-authored SQL files in `evryn-backend/backups/*.sql`, applied manually via the Supabase CLI (`npx supabase db query --linked -f <file>`), with a schema backup taken before/after. The CLI authenticates via `SUPABASE_ACCESS_TOKEN` (in `evryn-backend/.env`). Current schema snapshot: `evryn-backend/docs/schema-reference.md`.
- **Deploy:** Railway, manual `railway up`. Railway holds the prod env vars. A dev environment needs its own credentials/env.
- **In flight right now (so your plan slots in cleanly):** ADR-036's migration (`backups/adr-036-original-from-user-id-migration.sql`) is written-but-not-applied; it rides the next coordinated deploy. The EVR-71/68 + 036 bundle is merged-not-deployed. A dev DB would let us *rehearse that very migration* — a concrete near-term payoff to mention.

## What to investigate (the committee's scope)

Evaluate the realistic options for the dev surface, and for each, nail down the human-vs-agent task split:

1. **A second Supabase project (a dedicated "Evryn Product — Dev").** Separate URL/keys; replicate the schema (apply all existing `backups/*.sql` migrations to it); seed representative test data; point dev runs at it via env. *Likely the simplest mental model; check the cost of a second project on the current plan.*
2. **Supabase database branching** (if available on our plan/tier). Supabase offers a branching feature that spins ephemeral/persistent DB branches off prod. *Investigate availability, cost, and whether it fits a manual-`railway up` workflow.*
3. **Local Supabase (Docker).** Fully local dev DB for agent/dev iteration. *Check the Docker/Windows realities and whether it's worth it vs. a hosted dev project.*

For the recommended option, work out:
- **Schema replication** — how the dev DB gets and stays in sync with prod's schema (the `backups/*.sql` history; future migrations applied dev-first-then-prod).
- **Seed data** — what representative non-PII test data the dev DB needs (the `systemtest@` gatekeeper, synthetic fixtures), and how it's maintained.
- **Runtime/deploy selection** — how a dev run points at dev vs prod (env mechanism), and how this interacts with Railway (`railway up`) and local runs.
- **The QC integration** — concretely how QC would point at dev to run live tests (this is a big part of the payoff; spec it).
- **The migration flow going forward** — dev-first → verify → prod, and who runs each step (DC writes + applies-to-dev; AC/Justin apply-to-prod at coordinated deploy).
- **Gotchas:** the Supabase Data API grant cliff (post-2026-10-30 new tables need explicit `GRANT`s — see the build doc), RLS parity between dev and prod, secrets handling for a second set of keys, and not letting dev/prod schemas silently drift.

## The deliverable (what you hand Justin)

A decision doc containing, at minimum:
1. **Recommended option + why** (with the runner-up and why-not).
2. **The precise "Justin must personally do X" list** — every provisioning/billing/account/credential/env step that only he can do, as discrete checkboxes, each with its own time estimate.
3. **Hardened time estimates, split:** (a) agent work (DC/AC — apply the multiplier, this is fast), (b) **Justin's human/infra time** — the number he's actually deciding on — broken into the discrete steps from #2. No blended number.
4. **Rollout / "who's job changes" plan** — Justin's explicit standing ask: *everyone whose job changes must be told how.* Name the manual updates required (DC's CLAUDE.md = dev-first migration flow; QC's CLAUDE.md = she can now run live tests against dev — a real capability gain; OC's setup = owns dev/prod infra + deploy flow; the build doc / a protocol = the dev→prod discipline) and what each change says.
5. **Risks + gotchas** (from the scope list above).
6. **A clear go/no-go-pre-Mark recommendation** with the reasoning.

The deliverable should be **linkable from the meta meeting doc** — `evryn-team-workspace/shared/projects/helm/2026.04.30-meta-meeting.md` — so it can be spun ASAP if Justin doesn't just do it on the spot. **If you (an AC) write into that meta-meeting doc, mark your entry *unmistakably* as an AC note** (e.g., a clear `— AC note, <date>` signature). It's the team's shared helm doc; an unlabeled AC entry would confuse the team (Lucas et al.), who don't expect AC to be writing there.

## Required context (read these)

- `evryn-backend/docs/BUILD-EVRYN-MVP.md` — the "Dev / Staging Database" note + Build Order Phase 0d + the Supabase Data API grant note (v0.3 Web App scope items).
- `evryn-backend/docs/ARCHITECTURE.md` — Data Model section (schema, RLS, backup strategy) + the System Diagram's "TESTING ENVIRONMENT (designed, not yet built)" note.
- `evryn-backend/docs/schema-reference.md` — current schema.
- `evryn-backend/src/config.ts` — how the runtime selects its DB (env vars).
- `evryn-backend/backups/` — the migration-file convention + existing migrations (incl. the un-applied `adr-036-*` one).
- `evryn-backend/.env` — what credentials exist (SUPABASE_URL/SERVICE_KEY/ACCESS_TOKEN). **Do not print secrets to Justin; just confirm what's present.**
- `_evryn-meta/CLAUDE.md` (AC's manual) — Railway CLI + Supabase access notes under "AC's known tools."

## A calibration to settle early (the crux of Justin's decision)

Justin's instinct is "even if it's multi-hour, with the multiplier it's probably ~30 min — and worth it." **Pressure-test that honestly.** The DC multiplier compresses *coding*; it does **not** compress provisioning a Supabase project, configuring billing, generating/placing credentials, wiring a second Railway environment, or the back-and-forth those require — and those are human tasks on Justin's plate. Your job is to tell him the *true* shape of his personal lift. If it really is ~30 minutes of his time, say so with confidence and he does it today. If it's meaningfully more, say *that* clearly so the pre-Mark decision is made with eyes open — pre-Mark may still win on the catastrophe-asymmetry, but he should know the real number.

---

*Authored by AC0, 2026-06-03. Hand this to AC1 verbatim; it is meant to be self-sufficient.*

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
