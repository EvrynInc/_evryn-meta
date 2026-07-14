# ADR-036: Triage Interaction History Loopback (v0.2 calibration phase)

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

**Status:** Proposed
**Date:** 2026-06-01 (rewritten 2026-06-01 — initial draft misframed `cross_user_notes` as the substrate; corrected to `emailmgr_items` + FK)
**Authors:** AC0 (architecture), spec for DC + Mira to implement
**Related:** [ADR-027 — Profile Architecture Simplification](027-profile-architecture-simplification.md), [SPRINT-MARK-LIVE.md backlog — createUser MCP tool](../../../evryn-backend/docs/SPRINT-MARK-LIVE.md)

---

## Context

Mark's projected v0.2 calibration volume is ~200 inbound/day × 30 days ≈ **6,000 emailmgr_items per month**, all forwarded from Mark with an `original_from` someone-else (Eva-shaped: a person who emailed Mark, Mark forwarded to Evryn for triage). Most will be `pass` classifications.

Three coupled gaps in the current v0.2 architecture surface when reasoning through that volume:

### Gap 1 — Eva doesn't exist as a user record

`processForward` ([src/email/process.ts:89](../../../evryn-backend/src/email/process.ts#L89)) creates an `emailmgr_items` row with `original_from` stored as a *string* (text), not as a foreign-key reference. The original_from is never reified as a `users` row. `triage.md` Phase 2 instructs Evryn to create the user record via tool, but the only tool available is generic `supabase_upsert`, which doesn't apply the ADR-027 `profile_jsonb` template — so any Evryn-created user gets a malformed record. The `createUser` MCP tool is on the SPRINT backlog but not built.

**Result:** 6,000 Evas with no proper user records. Nothing else in the loopback can work — the FK has nothing to point at, the lookup has nothing to find, the v0.3 backlog-outreach pathway has no profiles to load.

### Gap 2 — Same-person-resubmits-tweaked-email failure mode

If Eva is classified `pass` on her first forward and resubmits a week later with a tweaked email that omits the deal-breaker (or just hopes Evryn won't remember), Evryn has no structural way to know she's seen Eva before. Today there's no prior-interaction lookup at triage time. Each triage runs fresh-eyed.

At Mark scale, the law of large numbers says this will happen — repeat senders, polished follow-ups after a soft pass, *"let me try again"* patterns are routine in real inboxes. **Evryn re-recommending someone Mark previously declined is a trust-breaking failure for Mark.**

### Gap 3 — `original_from` as text means no relational queries

Even if Eva existed as a user, there's no FK from `emailmgr_items.original_from` (text) to `users.id` (UUID). Every "show me all forwards involving this person" query has to text-match the email column, which:
- Doesn't scale gracefully past v0.2 (works fine at 6,000 rows; less so at 60K).
- Breaks when Eva changes her email (work → personal, etc.).
- Makes the "do we have prior history with this person from this gatekeeper" question much more expensive than it needs to be.

`emailmgr_items` already has the *data* we need for the lookback (gatekeeper, original-sender-email, triage classification, reasoning, status, lifecycle metadata). It's the natural substrate for triage history — already there, already populated on every forward. We just need it queryable by Eva-as-user, which means we need Eva-as-user *and* a FK.

### Why these gaps couple

All three must close together:
- Without Gap 1 (Eva-as-user), there's nothing for the FK to reference.
- Without Gap 3 (FK column), the lookup at Gap 2 is fragile string-match.
- Without Gap 2 (triage-time discipline to check prior history), the data sits there unused and the resubmission failure mode persists.

### What `cross_user_notes` is — and why it's NOT the right home for this

A prior draft of this ADR proposed writing closure notes to Eva's `cross_user_notes` column. That was wrong. Per [ADR-027 Decision 3](027-profile-architecture-simplification.md) + [evryn-backend/identity/internal-reference/feedback-guidance.md](../../../evryn-backend/identity/internal-reference/feedback-guidance.md), `cross_user_notes` is specifically for **third-party feedback about a user from another user, in the context of connections Evryn mediated** — *e.g., "Mark gave feedback to Evryn that Eva flaked on their connection."* Mark forwarding Eva's cold inbound is not a connection Evryn mediated; the triage outcome is not feedback-shaped. Putting it in `cross_user_notes` would pollute the feedback substrate (which is firewalled from `buildPersonContext` and reserved for Reflection-mediated bias-aware processing).

The triage interaction history is its own thing, and `emailmgr_items` already is the right home. This ADR just makes it queryable by user.

---

## Decision

Three components: one schema migration, two runtime changes, one identity-side discipline.

### 1. `createUser` MCP tool (runtime)

Promote the SPRINT backlog item. Wrap `src/db/users.ts:52` `createUser()` as an MCP tool. Schema mirrors `findOrCreateUser({email, display_name?, full_name?, status?, referrer?})` — defaults applied at the library level produce a guaranteed-correct ADR-027 `profile_jsonb` template. The tool MUST use find-or-create semantics (idempotent — same email + multiple calls = same end state, per the existing `findOrCreateUser` pattern at [src/db/users.ts:145](../../../evryn-backend/src/db/users.ts#L145)). Returns `{user, created: boolean}` so Evryn knows whether this is a first-touch or a return-visit.

### 2. Runtime auto-creates Eva's user record at forward time

Modify `processForward` ([src/email/process.ts:89](../../../evryn-backend/src/email/process.ts#L89)) to call `findOrCreateUser` for `forwardInfo.originalFrom` *immediately after* `createEmailmgrItem` (or before, if cleaner). Set `status: "lead"` and `referrer: sender.id` (the gatekeeper's UUID). Then populate `emailmgr_items.original_from_user_id` with the resulting user UUID.

The auto-create is at the *runtime* level, defense-in-depth — Evryn doesn't have to remember to do it via tool. The `createUser` MCP tool from #1 stays available for the cases where Evryn needs to create users in non-forward contexts (operator-introduces-someone, Evryn-initiated cold opens at v0.3, etc.).

**Edge case:** `forwardInfo.originalFrom` can be null if forward-detection found subject keywords but couldn't extract a sender email. In that case, leave `original_from_user_id` null and proceed as today — the emailmgr_item still records the forward.

### 3. `emailmgr_items.original_from_user_id` FK column

Migration: add `original_from_user_id UUID REFERENCES users(id)` column on `emailmgr_items`. Nullable (legacy rows have no FK; new rows where forward-detection didn't extract a sender stay null). Indexed if profiling shows queries against it are slow.

At write time in `processForward`, populate it with Eva's user UUID from #2. The text column `original_from` stays for archival/display (so the audit trail is preserved even if Eva's user record is later deleted), but the FK is the operational handle.

**Backfill:** not required. Legacy rows can stay null. If we want clean v0.3 backlog-outreach data, run a one-time backfill script that reads `original_from`, finds/creates the user, and populates `original_from_user_id`. Cheap, idempotent, can wait.

### 4. Lookup at triage time — `supabase_read` is sufficient; typed tool optional

Evryn can query prior history via existing `supabase_read`:

```
supabase_read({
  table: "emailmgr_items",
  filters: '{"user_id": "<gatekeeper_uuid>", "original_from_user_id": "<eva_uuid>"}',
  select: "id, created_at, status, triage_result, triage_reasoning"
})
```

This returns Eva's prior interactions with this gatekeeper — outcome, reasoning, status. No cross-user containment concern: Mark's Evryn-scoped context is reading data about *Mark's own forwards*, which is information Mark himself has (he forwarded those emails). No cross-bleed.

**Optional:** a typed `read_triage_history(gatekeeper_id, target_user_id)` MCP tool that wraps this query with constrained semantics. Pro: smaller operational surface for Evryn; harder to misuse. Con: another tool to maintain; `supabase_read` already works. **DC's judgment** — ship the typed tool if it feels cleaner; skip if `supabase_read` is fine. Either way, no new architecture.

### 5. Identity-side discipline (Mira's trip — proposed new language)

**`triage.md` does not currently have a "check prior interaction history" beat.** Today's Phase 2 covers "check for an existing user record by email" (and "always read `profile_jsonb` first" when updating an existing record), but nothing instructs Evryn to query `emailmgr_items` for prior triage outcomes. This ADR proposes Mira add a new beat, placed after the existing user-record check.

The proposed beat — Mira refines the exact wording per her writing-bible craft, but the substance is:

> **Before classifying, check prior triage history for this person with this gatekeeper.** If the person already has a user record (post-`findOrCreateUser`), query `emailmgr_items` filtered to `user_id = <gatekeeper>` AND `original_from_user_id = <this person>`. Read what came up.
>
> A prior pass doesn't mandate a re-pass — circumstances change, people learn, the new email may be a genuinely fresh shot. But it's a load-bearing signal. **Factor it into your judgment, name it in your reasoning, and flag to the Operator if the new submission appears to be the same person attempting to outsmart prior triage.**

No Phase 3 closure-write needed — the `emailmgr_items` row Evryn updates as part of normal triage *is* the closure record. The status, `triage_result`, `triage_reasoning`, and lifecycle metadata captured during triage are the artifact.

---

## Consequences

### The 6,000-Evas problem closes structurally

Every forward Mark sends produces:
- Eva's user record (idempotent — created on first forward, found on every subsequent).
- An `emailmgr_items` row with `original_from_user_id` FK linking back to her.
- The triage outcome (status, result, reasoning) recorded on that row.

At v0.3 backlog outreach time, these records have proper history. Querying *"all leads from Mark's calibration phase, with prior triage outcomes"* becomes a single indexed query.

### Resubmission failure mode mitigated

When Eva re-submits with a tweaked email, triage Phase 2's check-prior-interactions beat fires. Evryn sees the prior emailmgr_item, the prior classification, the prior reasoning. She can:
- Re-pass with a clearer reason (*"same person resubmitting, no new signal"*).
- Edge-case it and flag to Operator (*"this is the third attempt; may want a closer look"*).
- Genuinely reclassify gold if the new email demonstrates real change.

The runtime gives her the information; her judgment decides what to do with it.

### `cross_user_notes` stays untouched and properly scoped

`cross_user_notes` remains reserved for its proper purpose: third-party feedback on Evryn-mediated connections (post-v0.3). The triage interaction layer doesn't pollute the feedback substrate. Reflection (v0.3+) processes `cross_user_notes` cleanly into sanitized `story` insights without having to filter out non-feedback noise.

### Cross-user containment preserved structurally

Mark's Evryn querying her own forwards (filtered to `user_id = mark.id`) is reading Mark's data, not Eva's profile. No cross-user containment concern. The query at #4 above is structurally scoped to the gatekeeper's interaction history; Eva's full profile is never loaded into Mark's context.

### `original_from_user_id` FK is forward-investment

The FK has no immediate v0.2 query consumer beyond the prior-history check — but it makes every v0.3 query trivial: *"show me all forwards involving Eva"* (across multiple gatekeepers, when there are multiple) becomes a single index lookup. Backlog-outreach pipeline (Phase II Pathway 1 per [gatekeeper-flow.md](../hub/detail/gatekeeper-flow.md)) directly depends on this shape.

### Identity-stated and runtime-actual finally agree

`triage.md` already instructed Evryn to create user records (Phase 2: *"For every lead and bad_actor: check for an existing user record by email... If no match, create a new record."*). The architecture gap was the *tool* not existing and the runtime not doing it defense-in-depth. With `createUser` (#1) and the runtime auto-create (#2), instruction and implementation match.

### Subagent path stays deferred

Justin's original *"grep then Haiku subagent"* framing was the right shape for *cross-user-notes* sanitization at v0.3+ when story content is rich free-text. For *triage interaction history* it's overkill — `emailmgr_items` rows are uniform structured data and Mark's view of his own forwards isn't a containment concern. We may revisit subagent-mediated lookup at v0.3+ if cross-gatekeeper queries become a use case ("has this person approached other gatekeepers we work with?") and we need fine-grained sanitization of multi-gatekeeper data.

### Trip cost is bounded

- Migration: ~15 min (one column, nullable, no backfill required).
- Runtime auto-create: ~15 min (a few lines in `processForward`).
- `createUser` MCP tool: ~30 min (already specced on backlog).
- Optional typed read tool: ~30 min (DC's judgment).
- Mira's triage.md beat: ~30-60 min (small additive identity work).
- Tests: existing test patterns extend; ~30 min.

Total: one DC trip (~2 hours) + one Mira trip (small) + one Railway redeploy.

---

## Out of scope

- **`cross_user_notes` involvement.** Reserved for its proper feedback purpose.
- **Cross-gatekeeper history queries.** At v0.2 with one gatekeeper, this is moot. At v0.3 it becomes a design surface — but it has different containment dynamics (you might want to see "Eva approached Lacey too" but you might NOT want to see "Lacey thought Eva flaked"). Out of scope here; defer to v0.3 design.
- **Closure-note write-back to `cross_user_notes`.** Not needed — `emailmgr_items` is the closure. The cross_user_notes write-back happens when Mark gives Evryn *feedback* on a connection she made, not when she triages an inbound on his behalf.
- **DC3's CONCERN 1 fix.** Separate trip (already queued in `evryn-backend/docs/ac-to-dc.md`).

---

## Implementation

### Trip 1 — DC (runtime)

Order matters; later items depend on earlier ones.

1. **createUser MCP tool** (~30 min). Wraps `src/db/users.ts:52`. Find-or-create semantics. Returns `{user, created}`.
2. **`original_from_user_id` column migration** (~15 min). Nullable UUID FK on `emailmgr_items`. No backfill required.
3. **Auto-create + populate FK in `processForward`** (~15 min). After `createEmailmgrItem`, call `findOrCreateUser` for `originalFrom`, update item with `original_from_user_id`. Handle null `originalFrom`.
4. **(Optional) Typed `read_triage_history` MCP tool** (~30 min). DC's call — `supabase_read` is sufficient if the tool feels redundant.
5. **Tests** — at least one assertion covering Eva-as-user creation on forward, one covering the FK populate, one covering a re-forward finding the prior record.

Branch: `dc/triage-history-loopback`. Single PR. Bisect-clean per-item commits recommended.

### Trip 2 — Mira (identity)

Update `triage.md`:
- New Phase 2 beat: check-prior-triage-history if existing user record. Public-safe language (no implication that prior pass is binding; emphasizes judgment + Operator flag on suspicious resubmission).

Identity-file-review protocol applies. Branch: `mira/triage-md-loopback-beat`. Standard PR review.

### Sequencing

Trip 1 ships first (the tools and FK need to exist before Mira can instruct Evryn to use them). Trip 2 ships against the merged Trip 1 state. Single Railway deploy after both merge. Then re-run the integration test against the post-loopback runtime to verify the "Mark re-submits Eva" scenario behaves correctly.

This is independent of DC3's post-review-fixes trip — bundle separately, deploy separately.

---

## Open questions for v0.3+

- **Multi-gatekeeper interaction history.** At v0.3 with multiple gatekeepers, *"has Eva approached any of our gatekeepers"* is a useful triage signal. But cross-gatekeeper visibility raises containment questions (do you see *"Lacey's Evryn thought Eva was great"* in Mark's context? Probably not — gatekeeper judgments are gatekeeper-private). Defer.
- **Cast-off outreach activation.** Phase II Pathway 1 (gatekeeper-flow.md) reaches the leads classified during calibration. The loopback closes the data precondition; the outreach itself is v0.3 build scope.
- **Reflection over emailmgr_items history.** At v0.3 when Reflection ships, should triage-interaction-history feed into a lead's story? Probably yes for the gatekeeper's narrative ("Mark has triaged 6K emails; here's the pattern of what he's saying yes/no to"), less clear for the lead's. Defer to v0.3 Reflection design.

---

## Empirical case

Justin's 2026-06-01 conversation surfaced this:

> *"the loopback: this can't be deferred to v0.3, because we are going to write 6000 of these during calibration - and in v0.3, we're going to pull up all 6000...and not have proper notes about what happened with Mark in their profile."*

And:

> *"what if there was a previous interaction with Eva, that made her a 'no' for Mark? Maybe that's been resolved. But maybe it hasn't - and Eva just got smart and thought 'let me out-smart Mark's triage bot and re-submit, not mentioning the deal-breaker'."*

And the catch on the initial mis-framing:

> *"Yeah, I'm not sure about your understanding of cross_user_notes. Grep for that, and go read the lines everywhere that talks about it. I think it's something else."*

Justin was right. `cross_user_notes` is the connection-feedback substrate (ADR-027 Decision 3); the triage interaction layer is `emailmgr_items` + a missing FK. Cleaner design.

---

## Amendment (ADR-051, 2026-07-14 — Runtime Bookkeeping / Step 57)

Decision #2 here reifies the original sender as a `lead` user record at **forward time** ("defense-in-depth — Evryn doesn't have to remember"). The runtime-bookkeeping rewrite ([ADR-051](051-runtime-bookkeeping-structured-verdict.md)) moves that reification to **verdict time**, per Justin's ratified call (2026-07-14):

- **User-record creation moves from forward-time to the verdict hook**, and **no record is created for an `ignore` verdict** (junk — spam / no-reply blasts / bots — no longer leaves a durable `lead` row that pollutes the map v0.3 matching is built on). Every real-person verdict (pass / gold / edge / bad_actor / handled_by_gatekeeper) still creates/finds the record — now *more* deterministically (the FK no longer depends on a parse racing a Supabase blip at ingest).
- **The prior-triage-history lookup (Decision #4) still works.** Pre-verdict the item has no FK, so the runtime's pre-loaded history (ADR-051 has the runtime pre-load it, retiring the manual Phase-2 lookup) falls back to matching `original_from` by email; past real-person verdicts set FKs, and a beyond-TTL junk re-sender is simply re-screened cheaply by the Haiku pre-screen. The `original_from` text column and the `original_from_user_id` FK are both unchanged in shape — only *when* the FK is populated moves.
- **`processDirect` is unaffected** — a person emailing Evryn directly is a real person initiating contact, so arrival-time creation stays there. This amendment scopes to the *forward* path only.
