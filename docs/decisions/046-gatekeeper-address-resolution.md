# ADR-046 — Gatekeeper-address resolution + self-registration

**Status:** Accepted (design Justin-balloted pre-subagent; built round-2, QC-GO ×2 on `r2/lane-a-ingest-resilience` [Step 61] + `r2/lane-a-register-tool` [register tool]; **not yet merged/deployed** — rides AC0 convergence)
**Date:** 2026-06-25 (recorded by AC0 from the round-2 builds; ADR owed-but-unwritten was flagged in both the Lane A + ACc handoffs)
**Authors:** AC1a (Step 61 build) + ACc (register tool) + AC0 (recording); design balloted by Justin
**Relates to:** [ADR-036](036-cross-user-interaction-loopback.md) (original-sender reification — the `original_from_user_id` FK), SPRINT-V0.2-HARDENING Steps 61 + the register-tool step
**Context docs:** `docs/working/2026.06.17-ac1-step61-gatekeeper-address-resolution.md` (design), `docs/working/2026.06.23-ac1a-ac0-handoff.md`, `docs/working/2026.06.24-acc-ac0-step21-register-handoff.md`

---

## Context

Before this change, `processEmail` resolved a forwarded email's gatekeeper purely from the `From` header. Two problems:

1. **A forward from any unregistered address triaged against an empty profile** — Evryn would treat an unknown forwarder as the gatekeeper and classify with no gold/pass/edge framework, producing junk.
2. **A gatekeeper has more than one inbound address** (a primary plus auto-forwarders), and the **gold destination** (where Evryn's notifications should go) is not necessarily the address mail arrives *from*. The single-`From`-header model couldn't express either.

Separately, Step 61 built the gatekeeper-address *plumbing* (the table, the column, typed read helpers, a gather-at-onboarding identity beat) but gave Evryn **no write path** — she could only `notify_slack` the gathered addresses to the Operator to enter by hand. Justin rejected operator-by-hand SQL as the v0.2 end-state: he wants **Evryn to register the addresses herself**.

## Decision

**1. A `gatekeeper_inbound_addresses` table** (`address` citext PK → `gatekeeper_user_id` FK): many inbound addresses → one canonical gatekeeper record.

**2. A nullable `users.outbound_address`** (citext): the deliberately-set gold destination, decoupled from inbound; `null` → fall back to `users.email`. Resolved by the pure `goldDestination(gatekeeper) = outbound_address?.trim() || email`.

**3. `processEmail` resolution order** (dedup FIRST → `detectForward` → `resolveGatekeeperByInboundAddress` → pure `decideSenderResolution`): a registered inbound lane → use that canonical gatekeeper (no blank lead); a forward from an **unregistered** lane → **escalate** (a tracked `escalated` `emailmgr_items` row anchored to the Operator system actor, real sender in `metadata.unresolved_from`, `external_id`-stamped so a re-fetch dedups — no blind triage); a non-forward from no-lane → the existing find-or-create-as-lead path.

**4. The resolver THROWS on a DB error or a dangling FK** (`resolveGatekeeperByInboundAddress`), never swallows-to-null. A swallow would read as a clean "no registered lane" and misroute a real gatekeeper's forward; the throw propagates → `handleNewEmail` treats it transient → holds the Gmail cursor + retries.

**5. A `register_gatekeeper_address` MCP tool** — Evryn self-registers a gatekeeper's inbound lanes + gold destination via **typed `db/users.ts` helpers** (NOT the generic RLS-bypassing `supabase_upsert`), **validate-first**: the gatekeeper UUID is validated via `findUserById` (the record_pass "B-1" lesson — never trust a fabricated id), **role-gated** (rejects `system`/`admin` actors), and **all-or-nothing** (a different-gatekeeper conflict rejects the whole batch + `notifyDev`; same-gatekeeper = idempotent no-op). Additive — never wipes existing lanes. Pairs with Mira's gatekeeper-onboarding "Setup Check-In" beat (Evryn gathers the addresses, registers them herself, then `notify_slack`s the Operator a confirmation).

## Why

- **Empty-profile triage is a correctness bug**, not a polish item — an unknown forwarder must not be mistaken for the gatekeeper.
- **Throw-don't-swallow** is the load-bearing invariant: misrouting a real gatekeeper's forward (because a transient DB error read as "no lane") is far worse than holding + retrying.
- **Escalate-don't-guess** on an unregistered forward keeps Evryn from triaging blind; the Operator registers the lane (or ignores it), and the 4h stale-`escalated` checker backstops.
- **Evryn self-registers** (Justin's call) removes the operator-by-hand SQL stopgap; typed helpers + validate-first keep it from becoming a cross-user mis-write surface.

## Consequences

- **Go-live precondition (Step-48 runbook):** Mark's forwarding addresses — **including his primary email** — must be registered as inbound lanes (and his `outbound_address` set) **before he forwards**, or every forward escalates. Must be in the onboarding runbook.
- **The operator-guide Step-48 "Operator registers Mark's lanes by hand via SQL" instruction is superseded** by the register tool (Evryn self-registers). Until the bundle deploys, the hand-register stays the live path, so the guide update rides the deploy.
- **ARCH/BUILD absorption owed (auth-gated, at convergence):** the `gatekeeper_inbound_addresses` table + `outbound_address` + the escalate-unregistered-forward pathway into the Data Model + Pipeline + System-Actors sections. Lane A's branch already carries draft ARCH/BUILD edits (`abbf417`) — reconcile against `main`-drift at convergence.
- **Migration:** `backups/add-gatekeeper-inbound-addresses.sql` (RLS on, service_role-only grants, anon/authenticated revoked; self-cleans round-1 dev residue). Dev-applied; **prod applies at AC0 convergence.**

## Breadcrumbs
- ARCHITECTURE.md Data Model / Pipeline / System Actors — Step-61 absorption (reconcile Lane A's `abbf417` edits).
- `evryn-backend/docs/operator-guide.md` — Step-48 runbook: register Mark's lanes (incl. primary) before forwarding; the register tool supersedes hand-SQL.
- SPRINT-V0.2-HARDENING — mark Step 61 + the register-tool step DONE on merge.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
