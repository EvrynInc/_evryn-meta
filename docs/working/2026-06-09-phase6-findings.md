# Phase 6 live-fire — runtime findings to formalize (2026-06-09)

Captured live during the Phase 6 run (AC0 + Justin, S3b). **Non-blocking for the run.**
Formalize into `evryn-backend/docs/BUILD-EVRYN-MVP.md` ("v0.2 → v0.3 Resilience / Hardening / Polish Backlog", same shape as items 1-8) + Linear at #lock, with Justin's go.

---

## Finding 1 — Evryn's `supabase_upsert` status changes bypass the lifecycle audit trail
*(Justin, 2026-06-09: "log that upsert bug — we need lifecycle to update.")*

- **Symptom:** emailmgr_item `352bef4b` (S3b) was set to `escalated` + `triage_result=edge` by Evryn, but `metadata.lifecycle` holds only the runtime's single `processing` entry ("triage started"). No `escalated` entry.
- **Cause:** Evryn writes item status/fields via the generic `supabase_upsert` MCP tool (`src/triage/classify.ts`), which does a raw `db.from(table).update(record).eq("id", …)`. The lifecycle-append logic lives ONLY in `updateEmailmgrItem` (`src/db/items.ts`) — the runtime's status-change path. Evryn's tool never routes through it, so every Evryn-driven status transition (escalated / passed / ignored / bad_actor / matched / no_gk_response) skips the `metadata.lifecycle` append.
- **Impact:** incomplete audit trail for Evryn-driven transitions. `checkFollowUps` (`src/email/poll.ts`) counts `delivered` lifecycle entries to gate follow-ups — would undercount if a delivery transition ever came via supabase_upsert.
- **Fix direction (Soren/DC):** give Evryn a typed status-change tool that routes through `updateEmailmgrItem` (lifecycle-appending); and/or special-case emailmgr_items status writes in the `supabase_upsert` handler to append lifecycle; and/or restrict raw status writes to that table. Design call.

## Finding 2 — `emailmgr_items.updated_at` never advances on UPDATE (sibling; arguably higher impact)

- **Symptom:** `4e85277d` `updated_at == created_at` (2026-06-09 01:18 UTC) despite going `delivered` via `executeApproval` at 17:45 UTC. `352bef4b` `updated_at == created_at` (23:00:21) despite Evryn's edge/escalated/reasoning writes afterward.
- **Cause:** `updateEmailmgrItem` (`src/db/items.ts`) never sets `updated_at`, and there is apparently no DB `ON UPDATE` trigger (Postgres does not auto-bump timestamps). So `updated_at` is frozen at insert ≈ `created_at`.
- **Impact (NOT cosmetic):** `checkStaleItems` (`src/email/poll.ts`) filters stale items on `updated_at < cutoff` (pending_approval > 4h, processing > 30m, error/escalated > 4h). With `updated_at` frozen at creation, stale detection keys off creation time, not last activity — mis-times the 4h re-ping and the 7-day follow-up window (an item that just transitioned looks as old as when it was born).
- **Fix direction:** add an `updated_at` auto-update trigger (e.g. `moddatetime`) on `emailmgr_items` — the more complete fix, since it also covers Evryn's raw supabase_upsert writes — or set `updated_at = now()` inside `updateEmailmgrItem`.

## Finding 3 — Evryn-initiated scoped Slack threads get no operator-facing scope-lock announce
*(Justin's intuition, confirmed live.)*

- **Symptom:** the S3b escalation thread (`1781046187.323399`) is scope-locked to Mark (`7497d231`) — set via Evryn's escalation `notify_slack` `about_user_id`. But the ADR-030 verify-and-lock *announce* ("scoping this to Mark — confirm?") never fired.
- **Cause:** that announce beat fires in `handleOperatorMessage` only when the OPERATOR opens a new thread with no inherited scope (→ `set_thread_scope` exposed → announce). Evryn opened this thread via escalation `notify_slack` (already scoped via `about_user_id`), so the Operator's replies `getThreadScope` → inherit Mark-scope silently; `set_thread_scope` is never exposed; no announce.
- **Impact:** when Evryn initiates a scoped thread (escalation / proactive / cron), the operator is not formally told the scope — they only know if Evryn narrates it (she did, in her action summary, this time). Minor today (single operator, she narrated), but a real asymmetry vs. operator-initiated threads.
- **Fix direction (design Q, Soren/Mira):** decide whether Evryn should announce scope on threads she initiates, or whether narrating it in the ping body suffices.

---

---

## Update — S3b additions (2026-06-09 eve)

**Routing buckets:** **[1]** fix before the invite email · **[2]** sprint "week of 6/8" (with M1), before *actual* Mark-forwarding · **[3]** v0.3 BUILD list. Mira items live in `2026-06-09-phase6-mira-dispatch.md`.

- **Finding 4 — Multi-party scope seam: operator resolutions don't cross from gatekeeper-scope to contact-scope. [2 — week of 6/8 (Justin's call); the Evryn-discipline binding-clear (Mira beat) is the short-order fix that suffices for v0.2, runtime/Reflection auto-propagation is a v0.3 nicety / Soren+Mira]**
  S3b: the identity question was resolved by the Operator IN THE MARK-SCOPED Slack thread ("forget the connection, treat as a regular email"). When Film-Justin's REPLY arrived, it was processed under FILM-JUSTIN's scope (`processForward`, scope=`8c740234`) — isolated from Mark's thread — so the resolution was invisible, and Evryn re-escalated off the stale "hold pending Operator" note in Film-Justin's profile. **Isolation working exactly as designed → a cross-seam context gap in the two-scope (gatekeeper-side ↔ contact-side) outreach flow.** Fails safe (she held + re-escalated, didn't guess). Primarily a v0.3 concern — contact outreach is what creates the seam; v0.2 gatekeeper triage is mostly single-scope. Connects to Proposal 07 (multi-party orchestration) + the Reflection operator-message consolidation design. Fix direction: operator resolutions/instructions ABOUT a contact must land on that contact's record (or be visible to the contact pathway), not only in the thread where they were spoken.

- **Finding 5 — Approval confirmation mislabels recipient when recipient ≠ gatekeeper. [3] (Justin flagged, non-blocking)**
  Approving the outreach to Film-Justin returned "Confirmed — sent to Mark." `handleApprovalMessage` (`src/notify/slack.ts`) posts `Confirmed — sent to ${match.displayName}`, where `match.displayName` resolves from the item's `user_id` (the gatekeeper = Mark) in `findPendingByShortId`, NOT the draft's actual recipient (`draft.draft_to` = Film-Justin). Invisible at v0.2 (recipient usually = gatekeeper); mis-fires for contact outreach (v0.3, surfaced now). Same recipient≠gatekeeper class as the `formatUserLabel` fix. Fix: derive the confirmation name from the draft recipient.

- **Finding 6 — Outbound emails don't collapse quoted history in recipients' Gmail. [2] (Mark-experience polish)**
  The quoted "Original message" block is `> `-prefixed → renders as `<blockquote>` via marked, but Gmail's collapse-to-"…" needs its own `gmail_quote` structure, so it stays expanded in the recipient's client (messy as threads grow). `src/email/client.ts` (renderMarkdownToHtml) + the quoting in `src/approval/flow.ts`. Fix: render quoted history in the structure Gmail recognizes for collapsing (or accept non-collapse).

- **Finding 7 — Outbound emails don't attach to the Gmail thread. [2] (Mark-experience polish)**
  `sendEmail` threads only when `inReplyTo`/`threadId` are passed (from `submit_draft`'s `in_reply_to`/`thread_id`, which Evryn must supply). New outreach correctly starts a thread; replies/notifications in an existing conversation need threading or Mark's inbox scatters. Fix direction: make threading a RUNTIME concern — auto-populate `in_reply_to`/`thread_id` from the inbound being replied to — rather than relying on Evryn (same principle as runtime-owns-context). Confirm whether she passes them on replies.

- **Finding 3 (scope-announce) — DROPPED.** Justin: she announced it in flow; not a gap.

- **Forward-misdetection (low-pri observation) [3 / watch].** Replies whose quoted chain contains "Forwarded message" are detected as forwards (`detectForward`), spawning a forward-type item with `original_from: unknown` (Mark's reply → `cb1ad7aa`; Film-Justin's reply → `2ffa3dfa`). Benign here; at scale spawns spurious forward-items.

- **Finding 8 — Operator re-draft context should include the previous draft + the triggering note. [2 — week of 6/8] (Justin)**
  When the Operator directs a re-draft *conversationally* (a general operator message, not the formal `notes <id>:` command → `handleRevisionNotes`), the re-draft prompt should explicitly carry (1) Evryn's previous draft and (2) the operator note that triggered the re-draft, as discrete context — not lean on thread history to carry them. `handleRevisionNotes` (`src/approval/flow.ts`) already includes the current draft + notes; the gap is the conversational re-draft path (`handleOperatorMessage`).

- **Finding 9 — Binding hygiene: cross-profile bindings cleared inconsistently + duplicated. [3 / watch — ties to the v0.3 binding-TTL audit]**
  The identity-question binding was written to BOTH Mark's (`7497d231`) and Film-Justin's (`8c740234`) profiles; she cleared it properly on Film-Justin (paired `[binding-cleared]` carrying the full resolution) but left the duplicate uncleared on Mark (`[binding: until-operator-resolves-42pictures-identity-question]`). Mark's profile also shows duplicated open bindings (`until-mark-shares-vague-zone-methodology` ×4, `until-mark-sets-up-auto-forward…` ×3 — re-emitted across successive notes), and at least one resolved inline as "RESOLVED" text rather than a paired `[binding-cleared]` tag. Benign at v0.2; the v0.3 binding-TTL audit (breadcrumbed in ARCHITECTURE/BUILD) is the structural cleanup. Watch for accumulation.

- **Finding 10 — Validate the REAL Gmail auto-forward format before go-live. [2 — go-live setup]**
  Production = Mark sets up an auto-forwarder, so virtually all real forwards will be **note-less auto-forwards**. The integration test uses hand-pasted forwards (manual `----- Forwarded message -----` format). Dropping the gatekeeper note (Justin, S1 onward) tests the **no-note behavior** — and the runtime already handles `forwardingNote: null` (`buildForwardedEmailPrompt` omits the note line; `splitForwardBody` returns null cleanly), so no crash expected. **The open question is the auto-forward FORMAT:** a real Gmail auto-forward has its own header/structure that `detectForward` / `splitForwardBody` (`src/email/detect.ts`) haven't been validated against. Before Mark relies on it, send one real auto-forward through (when Mark sets up the forwarder) and confirm detection + original-sender extraction still fire.

- **Finding 11 — Runtime trusts the forwarded body's claimed sender; no header cross-check (deception surface). [3 / adversarial-suite + v0.3 deception-detection]**
  `extractOriginalFrom` (`src/email/detect.ts`) reads the original sender from the forwarded BODY's "From:" line, with NO cross-check against the actual email metadata/headers. A spoofed forward (visible sender ≠ real metadata — the classic phishing shape) would not be flagged by the system; Evryn would catch it only if a visible inconsistency survives in the content she's shown. **Adversarial test to add** (dev DB, fictional gatekeeper, post-launch — per SPRINT, NEVER live-Mark): a body/metadata-mismatch forward — does the system flag it; does Evryn read it as suspicious? **v0.3 deception-detection seed:** cross-check the claimed sender vs. headers. (Surfaced by Justin's "spoof the forwarded-from" idea, 2026-06-09.)

- **Finding 12 — Contact-outreach draft re-uses the gold forward item (single draft-slot; forward-vs-outreach conflation). [3 / v0.3 connection-record design]**
  S1 (Nadia gold, 2026-06-10): after the gold notification to the gatekeeper was approved + sent (item `36952262` → `delivered`), Mark's "connect us" led Evryn to draft the **outreach to the contact (Nadia) onto the same item** — she called `submit_draft` with `emailmgr_item_id = 36952262` (reusing short_id `3695`), which flipped the item's `draft_to` from the gatekeeper (`systemtest@evryn.ai`) to the contact (`nadia.calderon.films@gmail.com`) and overwrote the prior gold-notif draft in `metadata.draft` (harmless here — the gold notif was already sent + audited in `messages`).
  - **Read:** arguably *correct* per the ADR-018 lifecycle (one item tracks the connection `gold` → `delivered` → `matched`, and the contact-outreach is part of reaching `matched`). But it conflates two distinct things on one record with a single draft-slot: the inbound *forward FROM the contact* and the outbound *outreach TO the contact*. The item's `draft_to` and meaning shift across its life, and only the latest draft survives.
  - **Impact:** none at v0.2 (approval gate + the notif was already audited). A data point for the v0.3 connection-record / connection-event design (**Proposal 01**) — whether the forward-item and the connection-event (the brokered outreach) should be separate records, so the outreach draft/recipient/lifecycle don't overwrite the forward's. Connects to Finding 4 (the gatekeeper↔contact scope seam).
  - *(Surfaced S1, 2026-06-10. Nothing was sent to the contact — the outreach draft was test-killed; item marked `matched`.)*

*Source: Phase 6 S3b live-fire, 2026-06-09 (Findings 1-11). Finding 12 from S1 live-fire, 2026-06-10. Verified against prod (Evryn Product / West Coast) via psql.*
