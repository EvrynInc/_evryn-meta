# Staging Validation Playbook (AC4, 2026-06-17)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** The repeatable procedure for proving a release candidate works *as a whole system* on the staging runtime before it touches prod. Companion to the design doc `_evryn-meta/docs/working/2026-06-17-staging-launch-space.md` (that = *what staging is + why*; this = *how we validate through it*). It does **not** re-describe the Phase-6 scenarios — those live in `evryn-backend/tests/phase6-live-fire-v02.md`; this playbook says *how to run them against staging instead of prod, and what's staging-specific.* Read the design doc first. **Status: spec — gated on the staging runtime existing (and on the send-allowlist build, see Dependencies).**

---

## Why this exists (one paragraph)

Until now, "integration testing" meant running against **prod with synthetic data, then wiping** (Phases 2–6). That works only while prod holds nothing real. **The moment Mark's data is in prod, that pattern is dead** — you can't FAFO on a live user's inbox. This playbook replaces it: run the *exact same release candidate* end-to-end on an isolated staging runtime, confirm the whole interlocking system behaves, then **promote the identical build to prod** (no rebuild between validation and prod). That's the difference between "QC says the code looks right" and "we watched the assembled system do the real thing."

---

## Pre-flight safety gate (NON-NEGOTIABLE — run before every staging boot)

This is the **cross-wiring invariant** (also now in `evryn-ops/CLAUDE.md`): a staging runtime that silently inherits one prod credential becomes prod-under-another-name, and you won't notice until it writes prod data or emails a real person. **Prove each line before first boot; never assume isolation — prove it:**

1. **Database** — staging `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` point at **Evryn Product — Dev** (`maqkdesopsskptpxjbqs`, us-west-2), NOT prod (`wvaaqwapueycyxyhxdnh`). Confirm by reading the staging service's env, not by assuming.
2. **Inbox** — staging polls the **test inbox** (`systemtest@` or `evryn-staging@` — see Open Questions), NOT `evryn@evryn.ai`. Confirm `GMAIL_USER` + the OAuth refresh token are the test account's.
3. **Slack** — staging posts to the **staging Slack app + channels**, NOT `#evryn-approvals` / `#dev-alerts` / `#emergency-alerts`. Confirm `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` / webhook envs are the staging app's.
4. **Send safety** — the **recipient allowlist is active** and contains only test addresses. With `SEND_ENABLED=true` on staging (we WANT real send, to test real rendering/threading), the allowlist is the only thing standing between staging and a real person's inbox. **If the allowlist mechanism isn't built yet, staging MUST run with `SEND_ENABLED=false`** (log-only) until it is — see Dependencies.
5. **Anthropic** — fine to share the key, but note staging spend lands in the same `llm_usage` capture unless separated; tag or accept it.

If any line can't be proven, **do not boot staging.** A staging runtime that can reach prod data or a real person is worse than no staging at all.

---

## The validation flow

1. **Assemble the release candidate** (AC0's convergence bundle, or any later change) on a branch.
2. **Deploy that exact build to the staging Railway service** (deploy target = the RC branch). This is a *faithful deploy rehearsal* — same container/env shape as prod, which is why local-only staging can't substitute (it wouldn't catch deploy/env-shaped failures).
3. **Run the pre-flight safety gate above.** Abort if anything fails.
4. **Run the create-from-zero + Phase-6 live-fire suite against staging** — the existing scenarios in `evryn-backend/tests/phase6-live-fire-v02.md` (onboarding → forward → triage → draft → approve → send), pointed at the staging inbox + dev DB, emailing only allowlisted test addresses. Justin plays the gatekeeper/sender roles as in Phase 6.
5. **Confirm the whole interlocking system works** — not just per-component: polling picks up mail, triage classifies, drafts hit the staging approval channel, approval sends real (allowlisted) email with correct rendering/threading, lifecycle + audit rows land, cost capture records, M1 liveness behaves.
6. **Promote the EXACT SAME build to prod** — no rebuild, no "one more tweak." If you change anything after validation, you've invalidated the validation; re-run it. This is the core guarantee staging buys.

---

## Staging-specific adaptation: validate the CLUSTERED model, not just real-time

**This is the one substantive way the staging suite must differ from Phase-6-as-run.** Sprint **Step 58 (daily clustering + morning package) is DECIDED as a super-fast-follow BEFORE Mark forwards** — so the operating model Mark first experiences is: forwards pool as `new` immediately, triage drains **once a day (~10am PT)**, gold/edge drafts land in the approval queue together, **Mark gets one morning package** (direct messages stay real-time). Implications for this playbook:

- **Until clustering ships:** validate the real-time per-email flow (today's behavior), exactly as Phase 6 did.
- **Once clustering ships (before Mark):** the live-fire MUST exercise the **once-a-day drain**: forward several emails across a simulated day → confirm they pool as `new` without immediate triage → trigger/await the daily drain → confirm the batch triages back-to-back (first query pays the cold cache write, the rest warm), gold/edge drafts arrive together as one package, and a silent cluster failure is caught (see next bullet).
- **M1 interaction (coordinate with AC5):** a silent cluster failure = a whole missed day. M1 Stage 2's heartbeat must carry a positive "cluster ran: screened N, escalated M, drafted K" signal — the staging suite is where we prove that heartbeat fires on a healthy run AND that its absence is detectable on an induced failure. This is a shared test surface with AC5's M1 lane.

---

## Dependencies & owners (what has to exist before this playbook can run)

| Dependency | State today | Owner | Note |
|---|---|---|---|
| **Send-recipient allowlist in `sendEmail`** | **NOT BUILT.** `src/email/client.ts` `sendEmail` gates only on `SEND_ENABLED` (boolean) — there is no recipient filtering; `TEST_RECIPIENT` is dead config. So "emails real addresses but only test ones" is a **DC build**, not an ops config flip. | DC build + QC review (AC4 specs) | The load-bearing safety net for staging. Until built, staging runs `SEND_ENABLED=false` (log-only) — useful but can't validate real rendering/threading. |
| **Staging Railway service/environment** | Not created | OC (standup) + Justin (account) | Service-vs-environment is an open question (below). |
| **Test inbox OAuth** | `systemtest@` exists for roleplay; *pollable OAuth unverified* | OC verify / Justin (creds) | Or stand up `evryn-staging@`. |
| **Staging Slack app + channels** | Not created | Justin (creates app) + OC (wires) | So staging can't ping real operator channels. |
| **Dev DB as staging DB** | Exists (tooling/migration-rehearsal use) | Soren (architecture touch) | Two writers now (tooling + running staging) — needs an ownership convention or staging gets its own ephemeral DB. Surface to Soren. |
| **Clustering (Step 58)** | Decided, not built | the cost/clustering AC + AC5 (M1 interaction) | Playbook covers both pre- and post-clustering; the clustered drain is the version Mark will live. |

---

## Open questions to resolve at standup

- **Railway: separate service or separate environment?** (Recommendation: a separate *service* — cleaner env isolation, no risk of an environment-var bleed within one service; revisit if Railway environments give equal isolation cheaper.)
- **Test inbox:** does `systemtest@` have a pollable Gmail OAuth a runtime can use, or do we stand up `evryn-staging@`? (Needs Justin / OC verification.)
- **Send-allowlist shape:** an env var list (`STAGING_RECIPIENT_ALLOWLIST=a@x,b@y`) checked in `sendEmail` when a staging flag is set — fail-closed (empty allowlist = send nothing). (AC4 to spec for DC.)
- **Cost attribution:** does staging spend pollute `llm_usage` analysis, or do we tag/segregate it?

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
