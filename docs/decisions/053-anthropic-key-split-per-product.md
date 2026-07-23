# ADR-053: Dedicated Anthropic Workspace + API Key for Production Evryn

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

**Status:** Accepted + SHIPPED (deployed with `v0.2.8`, 2026-07-22)
**Date:** 2026-07-22
**Author:** AC2 (cost lane) — executed the deploy; runbook researched by ACU 2026-07-13 (`_evryn-meta/docs/working/2026.07.13-acu-ac0-anthropic-key-split-runbook.md`)
**Reviewers:** Justin (did the Anthropic-console + Railway console work; the key value never passed through an agent context)
**Related:** [ADR-038](038-per-event-llm-cost-capture.md) (per-event `llm_usage` cost capture — the per-product spend signal this sharpens), [ADR-048](048-explicit-env-selection.md) (explicit env selection — the qualified-Supabase-var scheme whose dead unqualified pair was cleaned up in the same deploy), [ADR-050](050-team-runtime-architecture.md) (team-runtime is subscription-auth only — why it is untouched by this split). Runbook: `docs/working/2026.07.13-acu-ac0-anthropic-key-split-runbook.md`.

---

## Context

Evryn's **production backend** (`evryn-backend`) authenticates to Anthropic with an API key in `ANTHROPIC_API_KEY` (required at boot, `src/config.ts`). Until this change, that key drew on the **same Anthropic account/billing** that AC/DC and other dev-side CLI + SDK experimentation use. That shared arrangement had three costs:

1. **Blended billing** — prod runtime spend (the real product) and dev/experimentation spend landed on one invoice line, so "what does running Evryn-for-Mark actually cost per month?" was unanswerable at the account level. (The per-event `llm_usage` capture, ADR-038, was the only clean per-product signal.)
2. **Shared blast radius** — one key leaking, or one runaway loop, threatened both prod and dev at once. A per-product key bounds the damage to that product.
3. **A muddied spend-cap picture** — the M1 circuit-breaker + the Anthropic-console monthly ceiling are meant to be a *per-product* backstop; a shared key means a console-level cap can't distinguish prod runtime from dev noise.

**The load-bearing clarification (a common misconception):** this split is **not** "separate prod from the team-runtime." The **team-runtime** (`evryn-team-runtime`) never used an API key — it is **subscription-auth only** (`CLAUDE_CODE_OAUTH_TOKEN`; `src/boot/env.ts` *boot-refuses* if `ANTHROPIC_API_KEY` is present, ADR-050 invariant 5). So the old shared key is really the **dev/CLI** key (AC/DC local experimentation), and the split is a single-var change on **one** runtime (`evryn-backend`) plus Anthropic-console setup.

## Decision

Give the production backend its **own Anthropic API key**, minted inside its **own Anthropic workspace** (`Evryn Production`) with its **own monthly spend limit** — so prod billing, blast radius, and spend caps are cleanly isolated from dev/team work.

- **Prod (`evryn-backend`):** `ANTHROPIC_API_KEY` on the Railway **production** service (`evryn-backend`) = a key minted in the `Evryn Production` workspace. The var **name is unchanged**; only its value changed.
- **Dev/team:** the old key (still valid, relabeled `dev-team`) stays in AC/DC local `.env` / shell for CLI + SDK work. **Not revoked** (dev work depends on it), and it does **not** belong in `evryn-team-runtime/.env` (that runtime boot-refuses an API key).
- **Staging (`evryn-staging` Railway service):** stays on the **dev/team** key so staging test runs don't spend against the prod workspace cap — so the new prod key was set **service-scoped** on `evryn-backend`, never at the environment/shared level.

**Boundary — the key value is the Operator's alone.** The mint + the Railway swap are console-only, done by Justin; the key value never passes through an agent's context (the 2026-07-13 self-poisoning rule). AC2 ran the `railway up` that picked up the staged change but never handled the value.

## Consequences

- **Clean per-product billing + spend cap:** prod runtime spend now accrues against the `Evryn Production` workspace and its monthly limit; dev/team spend stays on the old key. Confirmed live: the post-deploy verification call (`$0.40`) landed on the `Evryn Production` workspace.
- **Bounded blast radius:** a leak/runaway of the prod key threatens only prod, capped by the workspace limit; the console cap is now a genuine per-product backstop alongside the M1 breaker.
- **Rollback is a one-variable revert** — restore the old key value in Railway prod + redeploy (value-only change, no code to undo; the old key stays valid).
- **Deploy shape:** a **value-only** Railway env change with **no code**, so it rode the next scheduled deploy (`v0.2.8`, the ③ runtime-bookkeeping ship) rather than a solo deploy — Railway applies staged variable changes on the next deployment. The same deploy also removed the now-dead unqualified `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` (superseded by the `_PROD`-qualified pair, ADR-048).
- **Follow-up (owed):** the operator-guide's "Anthropic monthly spend ceiling" note updates to name the `Evryn Production` workspace limit (source-of-truth edit, pending Justin's vet at the #lock).

Verified live (`v0.2.8`, 2026-07-22): clean boot on the prod DB + a real Anthropic call succeeded on the new key (a test triage drafted a reply and recorded an `llm_usage` row); the billing landed on the `Evryn Production` workspace.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
