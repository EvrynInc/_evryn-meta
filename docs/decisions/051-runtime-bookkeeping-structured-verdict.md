# ADR-051: Runtime-Owned Bookkeeping + Structured Verdict (Step 57)

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

**Status:** Accepted (design ratified by Justin 2026-07-14; build pending)
**Date:** 2026-07-14
**Author:** AC2 (cost lane)
**Reviewers:** Justin (the two product/security calls, §Decision Q1/Q2); Soren (ADR-018/lifecycle owner — awareness, not a gate); QC (build review); Fable (merge-gate review)
**Related:** [ADR-018](018-gold-to-match-bilateral-reframe.md) (status lifecycle — amended), [ADR-033](033-permission-compulsion-spectrum.md) (permission/compulsion — amended: write-surface removal), [ADR-036](036-cross-user-interaction-loopback.md) (original-sender reification — amended: moves to verdict-time), [ADR-020](020-model-tier-selection.md) (Opus-for-everything; the turn-multiplication this attacks), [ADR-047](047-v0.2-security-bulkheads.md) (AC4 read-lock — this is the write-side sibling), [ADR-049](049-daily-clustering-pipeline.md) (clustering — ③ is the third cost change). Full design: `_evryn-meta/docs/working/2026.07.14-ac2-step57-runtime-bookkeeping-design.md`. Cost basis: `evryn-team-workspace/shared/projects/product/research/2026.06.12 cost-levers-consolidated.md` §4.

---

## Context

Step 57 is the third and final v0.2 cost change (after ① the Haiku pre-screen / ADR-020-amendment and ② clustering / ADR-049). It is the keystone: it attacks turn-multiplication at the root, independent of the other two.

**The problem (measured, cost-levers §4).** During triage, Evryn performs deterministic bookkeeping herself: she checks prior-triage history (a tool-call turn), sometimes creates the sender's user record (a turn — often redundant, since the runtime already reified the sender at forward time per ADR-036), and writes status/lifecycle transitions via the generic `supabase_upsert` tool (a turn). Every one of those turns re-sends her entire ~250k-token context to Opus. A measured `pass` burned **15 turns / ~$1.92 cold**; the fitted model attributes ~$0.058/turn, so the bookkeeping turns are pure, avoidable spend. The runtime already *has* every piece of that data — it makes Opus pay full-context turns to move it around.

**A coupled security problem.** The generic `supabase_upsert` is a raw write tool (any table, any record) exposed in *every* pathway, including the untrusted triage pathways. It is the write-side sibling of the read-side hole AC4 closed in ADR-047: a prompt-injected Evryn could be steered into arbitrary writes (corrupt a status, mis-stamp a record). ADR-033's tier-5 principle says safety boundaries should be *structurally* enforced — and a raw write in an injection-reachable pathway is exactly the surface that principle wants gone.

**A coupled data problem.** Two items had been routed into Step 57 because they only become clean once the runtime owns every verdict deterministically:
- **54b forward-persistence** (from the standalone AC3 build brief, folded in by Justin 2026-07-07): a forwarded email lives only in the 6-month-TTL `emailmgr_items` table, so a contact's email is lost once the row ages out — breaking the v0.3 reach-back. The fix persists the forward as a permanent contact↔Evryn `messages` row, re-attributed to the gatekeeper at `matched`. Option C (verdict-keyed) was ratified; its one weakness in the standalone (bad_actor had no deterministic recording home) *disappears* inside ③, which gives every verdict a deterministic home.
- **User-creation-at-verdict** (Justin's open question, 2026-07-07): today `processForward` reifies *every* parseable sender as a `lead` at forward time (ADR-036), so spam senders get durable user rows that pollute the map v0.3 matching is built on.

## Decision

**The runtime pre-loads everything Evryn needs, and persists everything she decides. Evryn does only judgment and returns a structured verdict; the runtime writes.** A pass drops ~15 → ~2–4 turns; a gold ~13 → ~5–6.

### Core — the verdict hook + pre-loading

1. **New `record_verdict` tool** — `({emailmgr_item_id, verdict, reasoning?, contact_user_id?})`, one call, terminal. The verdict enum is Evryn's real disposition space: `pass · ignore · bad_actor · handled_by_gatekeeper · not_a_candidate · escalate`. Gold/edge do NOT use it — the draft IS the verdict act (see 3). `reasoning → triage_reasoning`, tight-by-default (the ADR-020-amendment discipline carries verbatim). `contact_user_id` is a validated fallback used only on a sender-resolution miss (never trusted raw — Finding-16 fabrication defense carries over).

2. **New runtime module `src/triage/verdict.ts`** — `applyVerdict(item, disposition, opts, deps?)`, the single deterministic writer: transitions status (lifecycle-appended via `updateEmailmgrItem`), canonicalizes `triage_result`, find-or-creates the contact where the verdict warrants it, backfills the item FK, persists the forward (54b), writes the pass-stamp where warranted. Injectable-deps + pure-helper pattern per codebase convention; idempotent throughout. **Callers:** the `record_verdict` tool · `submitDraftForApproval` (gold/edge) · the Haiku screen's active-pass/active-ignore branches (unifying their current direct `recordPass`/`recordIgnore` calls) · `waveOffNotedForward` (→ `handled_by_gatekeeper`).

3. **`submit_draft` runs the verdict hook for gold/edge** — writing `triage_result = gold|edge` + `sender_type = lead`, find-creating the contact, persisting the forward. This **canonicalizes `triage_result` for all three verdicts** (the ADR-018 amendment; retires the gap ①'s `deriveOpusVerdict` reads around). Written at *submit* (Evryn's triage-time judgment), not approval (which gates the *send*).

4. **New `record_outcome` tool** — `({emailmgr_item_id, outcome: matched|passed|no_gk_response, note?})`, the post-delivery lifecycle closer (replaces the raw-upsert instructions in the follow-up/feedback prompts). **`matched` carries the 54b re-attribution**: atomically repoint the preserved forward's `recipient_id` → `metadata.intended_for` (contact↔Evryn → contact↔gatekeeper — the forward enters the gatekeeper's history *at match, never before*).

5. **Runtime pre-loads two blocks into the forward-triage prompt** (variable per-item data, `prompt` never `systemPrompt`): (a) **prior-triage history** — `emailmgr_items` by `original_from_user_id` FK with fallback to `original_from` email-match, excluding the current item (retires triage.md's Phase-1 manual lookup; the *judgment* guidance stays); (b) **contact context** — the resolved contact's story + pending_notes, which also powers the shared-email safety beat (*a different-person read → `escalate`, never merge*). Net cost: ~1–3k prompt tokens vs. removing 2–4 full-context turns — clearly positive.

### Q1 (Justin) — user-creation moves to verdict-time; nothing for `ignore`

Forward-path user reification moves from forward-time (ADR-036) to the verdict hook. Real-person verdicts create/find the record; `ignore` creates nothing. The "have I seen them before?" pre-load falls back to `original_from` email-match pre-verdict (past real-person verdicts set FKs; a beyond-TTL junk re-sender is simply re-screened cheaply by the Haiku bouncer). `processDirect` keeps arrival-time creation (a real person initiating contact). **Amends ADR-036.**

### Q2 (Justin) — remove the raw write surface; a bounded operator-only correction tool replaces it

The principle that dissolves the "let her fix things vs. security" tension: **a write is only dangerous when untrusted content could steer it.** In triage pathways the driver could be a malicious email; in the operator channel the driver is the verified Operator. So:
- **`supabase_upsert` is removed from every pathway.** No raw write surface exists in the runtime after ③. (Also deletes the Step-18b `decideUpsertRouting` interim and the note-turn `isNoteTurnGuardedUpsert` guard — the vector is gone.)
- **New `correct_user_field` tool, registered ONLY in `handleOperatorMessage`** (same conditional-registration pattern as the existing operator-only tools). It edits a per-field allowlist on `users` (`display_name`/`full_name`/`email`/`outbound_address` — the "typo" class; extensible one line at a time), validated (`validateUserIsValidTarget`), via the typed `updateUser` helper. It **cannot** touch `profile_jsonb`, `cross_user_notes`, `status`/lifecycle, or any other table.
- This is *structural*, not command-gated: the channel IS the unlock, and the tool is bounded by construction — so there is no raw tool to weaponize even post-unlock. (An optional explicit arm-command layer was offered and declined.) **Amends ADR-033** (tier-5 structural enforcement of the write boundary).

### Ship discipline (Justin-accepted)

- **No dormancy flag.** ①/② shipped OFF because they change Mark-visible behavior; ③ is an internal-mechanics rewrite (same visible behavior), so a flag would mean maintaining two parallel triage paths — strictly worse. Safety = QC + a **live-path DEV exercise** (breaker off, real Opus, real tool loop — the ② process lesson: stubbed tests prove plumbing, not behavior) + AC0's **Gate-A** DEV baseline (SPRINT Step 88) + a **Fable** merge-gate review + Justin's explicit merge/deploy go. Prod is idle until Mark.
- **Zero schema migration** (the `triage_result` CHECK already allows gold/pass/edge; `messages.metadata` already exists). Simplest deploy of the three.

## Consequences

- **The tool-surface end-state composes with AC4's read-lock (ADR-047):** ③ removes the *write*, AC4 locked the *read* — `{typed verdict/outcome/correction tools}` + `{constrained supabase_read}` + **no raw `supabase_upsert`**. The pre-loads *reduce* Evryn's triage-path need for the generic read, but keep the `emailmgr_items.original_from_user_id` scope key load-bearing.
- **`deriveOpusVerdict` (the ① shadow-trial read-back) is untouched** — its branch (i) reads `triage_result` first, so post-③ it simply always hits; the gold/edge-via-draft branch (iii) becomes legacy.
- **M1/halt unaffected** (verified against the runtime): a breaker trip short-circuits before any tool call; a trip after `record_verdict` finds the item already terminal → `parkInFlightItemForHalt` no-ops; B2c still catches a verdict-less query.
- **Identity (Mira, via AC0):** `triage.md` Phase-1 lookup → "the runtime hands you the history" (judgment retained); Phase-2 record-the-person → the shared-email escalate beat + note discipline; Phase-3 `record_pass` → `record_verdict` + the disposition vocabulary. `core.md` "Drafting is the default" paragraph's `supabase_upsert` mention → the new tools. AC2 derives mechanics, briefs Mira the *what*, re-checks the voiced version against the runtime (identity-files-are-runtime).
- **Split out:** Step 71 (Reflection binding safety-net) is a separate small trip (different subsystem; keeps ③'s blast radius contained) riding the same deploy. Step 58a (`cluster now` missing from the Slack catch-up replay dispatch) is a one-line rider on this trip.
- **Deploy rider (AC0-owned):** the Anthropic API key-split env swap + dead `_PROD` var cleanup ride ③'s deploy window.

## Amendments this ADR carries (recorded on the source ADRs as dated pointers here)

- **ADR-018:** `triage_result` is now written for all three verdicts (gold/edge/pass), not just pass; the `sender_type` (is-there-a-person) vs `status` (item disposition) axes may legitimately diverge — the `handled_by_gatekeeper` verdict is the canonical case (real person, `sender_type=lead`, `status=ignored`).
- **ADR-033:** the raw-write boundary is now structurally enforced (no `supabase_upsert`); flexible correction is a bounded, operator-channel-only tool — tier-5 done structurally.
- **ADR-036:** original-sender reification moves from forward-time to verdict-time; no record for `ignore`; the prior-history lookup falls back to email-match pre-verdict.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
