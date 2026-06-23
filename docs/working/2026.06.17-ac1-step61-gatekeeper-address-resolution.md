# Step 61 Design — Gatekeeper-Address Resolution (AC1)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** The locked design for SPRINT-V0.2-HARDENING **Step 61**, routed to AC1. This is the **one home** for the design — DC builds from it, QC reviews against it, AC0 converges from it. It bakes in the ballot decisions (Justin, 2026-06-17), AC2's threading resolution + AC0's synthesized outbound model, and the proposed (auth-gated) ARCH/BUILD doc edits. Sprint Step text = the *what*; this = the *how*. Lane brief: `_evryn-meta/docs/sessions/2026-06-17-parallel-lanes-brief.md`.

*Written 2026-06-17T13:44-07:00 (AC1). Design LOCKED — Justin's ballot answered all 4 (a).*

---

## The problem (verified against the runtime)

`src/email/process.ts` `processEmail` resolves the "gatekeeper" of a forward purely from the email's `From` header: `senderEmail = parseEmailAddress(email.from)` → `findOrCreateUser({email, status:"lead"})` → `processForward` sets `item.user_id = sender.id` and composes the triage systemPrompt with `scopedUser: sender` (that record's profile = the criteria). **So a forward from any address that isn't a registered gatekeeper record creates a blank `lead` and triages against an EMPTY profile — no criteria, mis-attributed.** A literal "rando" who knew `evryn@evryn.ai` and sent a `Fwd:` would be triaged against empty criteria (low probability at v0.2 — the address isn't public — but a real failure mode, and Mark's own multiple forwarding addresses hit it routinely).

**Justin's reframing (the load-bearing insight — NOT "just add aliases"):** inbound and outbound are different shapes.
- **Inbound = many → one:** Mark may forward from work / personal / an auto-forwarder's envelope address; all must resolve to his ONE gatekeeper record + criteria.
- **Outbound = one, deliberately set:** gold goes to a destination *chosen* per gatekeeper ("curating a big bucket into a small clean stream"), independent of which lane forwarded. NOT "reply to the inbound lane."

---

## Decisions (Justin's ballot, 2026-06-17 — all (a))

1. **Inbound-lane storage → a table** (`gatekeeper_inbound_addresses`), not a JSONB blob. Scales to N gatekeepers × M lanes with an indexed lookup; ~10% more than a blob, prevents the multi-gatekeeper rewrite ("build for one, structure for many").
2. **Outbound destination → a settable `users.outbound_address`** on the gatekeeper record; gold goes there, falling back to `users.email` when unset.
3. **Escalate** an unregistered-lane forward to the operator instead of triaging blind.
4. **Scope = email-only v0.2 floor.** Real multi-channel identity (phone, Instagram, same person across emails) stays the v0.3 design ARCH already defers.

---

## The design

### Data model (one migration — `gatekeeper_inbound_addresses` table + `users.outbound_address` column)

```sql
-- New table: many inbound addresses → one gatekeeper record.
CREATE TABLE public.gatekeeper_inbound_addresses (
  address            citext PRIMARY KEY,                       -- case-insensitive, like users.email
  gatekeeper_user_id uuid   NOT NULL REFERENCES public.users(id),
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gk_inbound_gatekeeper ON public.gatekeeper_inbound_addresses (gatekeeper_user_id);
ALTER TABLE public.gatekeeper_inbound_addresses ENABLE ROW LEVEL SECURITY;  -- RLS day one; runtime uses service_role
-- (No explicit policy needed at v0.2 — service_role bypasses RLS; no anon/authenticated surface yet.
--  Add explicit policies when the v0.3 web app introduces those roles — same as evryn_knowledge/notify_queue.)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gatekeeper_inbound_addresses TO service_role;
-- REVOKE the project-default anon/authenticated grants (the llm_usage precedent — see BUILD v0.3 security item 4).

-- New column: the deliberately-set gold destination on the gatekeeper record.
ALTER TABLE public.users ADD COLUMN outbound_address citext;  -- nullable; null → fall back to users.email
COMMENT ON COLUMN public.users.outbound_address IS
  'Gatekeeper-only: the deliberately-set destination Evryn sends gold/edge to (Step 61). Decoupled from the inbound lane the forward arrived on. NULL → fall back to users.email. Set at onboarding (Step 48).';
```
- `address` as a citext PRIMARY KEY gives the case-insensitive unique lookup we want (mirrors `users.email`).
- The migration is a new file in `backups/`, modeled on the ADR-036 / Step-13 header + run-order (dev-first, pre/post `pg_dump`, **AC0/Justin applies — DC writes, does not run**).

### Inbound resolution (process.ts) — the core runtime change

Reorder the top of `processEmail` so forward-detection runs **before** sender resolution (it's pure on subject+body), then resolve the gatekeeper from the lane table:

```
senderEmail   = parseEmailAddress(email.from)
forwardInfo   = detectForward(email.subject, email.body)            // moved up (pure)
gatekeeperLane = await resolveGatekeeperByInboundAddress(senderEmail)  // NEW db lookup (table → users)

if (gatekeeperLane) {
    sender = gatekeeperLane            // canonical gatekeeper record — NO blank lead
}
else if (forwardInfo.isForward) {
    // A forward from an address that is NOT a registered gatekeeper lane.
    // At v0.2 all forwards should be Mark's → escalate, do NOT triage blind.
    → escalateUnregisteredForward(email, senderEmail)   // see below
    return                                              // short-circuit; no triage
}
else {
    sender = (await findOrCreateUser({email: senderEmail, status:"lead", ...})).user  // existing — direct msg from a new person
}
// ... then detectForward branch → processForward(sender) / processDirect(sender) as today
```

- `resolveGatekeeperByInboundAddress(address)` (new in `src/db/users.ts` or `src/db/items.ts`): looks up `gatekeeper_inbound_addresses` by address, returns the joined `users` record (the canonical gatekeeper) or null.
- **The gatekeeper's own primary `email` should also resolve** — either seed a `gatekeeper_inbound_addresses` row for it at onboarding, OR have the resolver fall back to `findUserByEmail(address) where role='gatekeeper'`. Simplest + explicit: register the primary email as a lane row too (one source of truth for "is this a gatekeeper lane"). Spec: onboarding registers ALL of Mark's lanes *including* his primary.

### Escalate unregistered-lane forwards (the safety net — decision 3)

`escalateUnregisteredForward`: create a tracked `emailmgr_items` row stamped **`escalated`** (`metadata: { reason: "unregistered_forward_lane", from: senderEmail }`, `user_id` = ... see note) + `notifySlack` the operator: *"A forward arrived from an unregistered address `<X>` — not triaged. Register it as a gatekeeper lane (Step 48) and re-forward, or ignore."* HandleOutcome = `"done"` (durably handled by escalating + tracking; won't re-fetch/re-escalate). The existing 4h stale-`escalated` re-ping (`checkStaleItems`) covers it as a backstop. **This structurally kills the criteria-less-triage failure mode** — a forward is only triaged when its From resolves to a real gatekeeper with criteria.
- *`user_id` note for the escalated item:* it has no valid gatekeeper. Options: a dedicated "unresolved" system marker, or leave the FK pointed at the operator/system actor. DC decides the least-bad FK that satisfies the NOT-NULL constraint without creating a phantom gatekeeper; flag if it needs a schema tweak. (Leaning: `user_id` = the Operator system actor, `metadata` carries the real unresolved-from — the item is an operator escalation, not a user's work item.)

### Outbound destination + the stash for AC2 (AC0's synthesized model — baked in here, one home)

**The outbound model (AC0's one-liner, the canonical statement):** *gold goes to the gatekeeper's designated destination (`users.outbound_address`, decision 2); it threads into the original ONLY when that destination is the same account holding the original (bonus — AC2's headers), else graceful standalone with the original's subject quoted for matching (AC2).*

**Division of labor (per AC0 + AC2):**
- **AC1 (Step 61) — SET + STASH:**
  - SET the destination: `users.outbound_address` exists + is settable (onboarding, Step 48). Gold-destination = `gatekeeper.outbound_address ?? gatekeeper.email`.
  - STASH for AC2's match-by-quote: in `processForward`, write the **original email's subject** (`forwardInfo.originalSubject`, already extracted by `detect.ts`'s `extractOriginalSubject` — "where extractable", may be null for some auto-forward formats) onto `item.metadata.original_subject`. (The `outbound_address` itself does NOT need stashing on the item — it lives on the gatekeeper record `item.user_id → users.outbound_address`, AC2 reads it there; one home.)
- **AC2 (Step 14) — USE:** sends gold to the designated destination and owns threading entirely header-side. Per AC2: *do NOT engineer cross-account threading* (it can't group across mailboxes) — threading is "nice if the destination is the same account Mark forwards from; graceful standalone otherwise," and AC2 handles that with headers + the quoted original subject. **So the outbound-address model here only SETS the destination; it does not try to solve threading.**

This split keeps Step 61 in Lane A's region (process.ts + db + migration + a metadata stash) and Step 14 in Lane B's (the send/threading). AC0 resolves the seam at convergence.

### v0.2 floor vs v0.3

- **v0.2 floor (this build):** email-only. Inbound-lane table + `outbound_address` + escalation. Mark's lanes + destination registered at onboarding (Step 48); the exact lane list waits on Step 8 (real auto-forward `From` format — unverified).
- **v0.3 (deferred — see "v0.3 notes" below):** real multi-channel identity (the table generalizes to a channels/identifiers map); and the **escalation-doesn't-scale** problem (below).

---

## Dependencies & coordination (flag, don't resolve here)

- **Step 8 (unverified):** we can't finalize *which* addresses are Mark's lanes until we see his real auto-forward `From`. Design now; populate lanes at onboarding. The design is robust to either outcome (forwarder preserves Mark's From → register that; forwarder rewrites → register the envelope address).
- **Step 48 (onboarding runbook):** add "register the gatekeeper's inbound lanes (incl. primary email) + set the outbound destination" as an onboarding step. (Operator tooling to insert lane rows / set `outbound_address` — a simple SQL insert at v0.2, or a small `create_user`-adjacent tool later.)
- **Step 14 / AC2:** the USE/threading half (above). AC2 reads `gatekeeper.outbound_address` + `item.metadata.original_subject`.
- **Step 13 (this lane):** the new migration follows the same dev-first apply pattern; AC0 can apply both together.

---

## Proposed doc edits (AUTH-GATED → AC0/Justin apply, NOT AC1; drafted here ready to paste)

Per Step 61's instruction (*"ARCH/BUILD edits are auth-gated → applied via AC0/Justin, not by AC1"*) — I draft them; they're applied in one pass to avoid a half-edited source-of-truth doc + the hot-repo (`evryn-backend` main) collision risk mid-wave.

1. **`evryn-backend/docs/ARCHITECTURE.md` → User Model → "Identity resolution (v0.2)":** extend the current "Match by email address…" to add the gatekeeper inbound-lanes (many→one) resolution + the designated outbound destination, and the escalate-unregistered-forward rule.
2. **ARCHITECTURE.md → "Gatekeeper users":** note the inbound-lanes + outbound-destination model (a gatekeeper is reached at any registered inbound lane; gold goes to the set destination).
3. **ARCHITECTURE.md → Data Model:** add the `gatekeeper_inbound_addresses` table + `users.outbound_address` column to the table inventory.
4. **ARCHITECTURE.md → Pipeline Design (sender resolution / "Message recording" inbound):** the resolution change (lane lookup → escalate-or-find-or-create).
5. **`evryn-backend/docs/BUILD-EVRYN-MVP.md` → gatekeeper model + Workflow:** note which address(es) Mark forwards from resolve to his record + the set gold-destination; onboarding registers them.
6. **v0.3 note (Justin pre-authorized me to write this — flag in handoff that it's written, no AC0 decision needed):** add a v0.3 entry — *"Unregistered/unknown-sender forward handling at scale. The v0.2 floor escalates every unregistered-lane forward to the operator — fine for one gatekeeper, but it scales abysmally (manual operator adjudication of every unknown forward is untenable at multi-gatekeeper / v0.3 self-signup / cast-off volume, where non-gatekeepers legitimately interact). Needs a real v0.3 design: trust-signal-based auto-handling, distinguishing a known contact from a true unknown, and/or a review surface instead of per-forward operator pings. Sibling to the 'Gaming-Resubmit Detection at Scale (v0.3)' pattern."* **Home:** the ARCH "Identity resolution (v0.3+)" note (extend it) AND/OR a `SPRINT-V0.3-CANDIDATES.md` entry — AC0's call on placement when applying, but the text is locked here.

---

## Build plan (after this design — DC+QC, on `lane-a/ingest-resilience`)

- **Migration file** (`backups/2026-06-17-gatekeeper-address-resolution.sql`): the table + column above; ADR-036/Step-13 header style; FILE-ONLY, AC0/Justin applies dev-first.
- **`src/db/`:** `resolveGatekeeperByInboundAddress(address)`; a helper to read `outbound_address` (or just use the field). Additive.
- **`src/email/process.ts`:** the resolution reorder + escalation short-circuit + the `original_subject` metadata stash in `processForward`. (Note the seam with the QC-GO ingest-resilience commits already on this branch — same file, top-of-`processEmail` region; composes with the Step 19/20 changes there.)
- **`src/email/poll.ts` (`handleNewEmail`):** route the escalation outcome (likely `escalateUnregisteredForward` lives in process.ts; poll.ts just sees the existing HandleOutcome flow).
- **Tests:** `resolveGatekeeperByInboundAddress` (hit/miss/case-insensitive); the resolution branch (lane-hit → gatekeeper; forward-miss → escalate; direct-miss → find-or-create); the `original_subject` stash; `outbound_address` fallback.

**Branch decision:** built on `lane-a/ingest-resilience` (same branch as the QC-GO ingest-resilience work — Step 61 is more Lane A / ingest work, one branch per lane, one convergence). **AC0 note:** my earlier "Lane A QC-GO" ping covered the 11-fix bundle; Step 61 adds to the same branch — I'll re-ping when Step 61 is also QC-GO so AC0 converges Lane A as a whole. Same-file seam with the ingest-resilience `process.ts` changes is intra-branch (sequential commits), not a cross-lane conflict.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
