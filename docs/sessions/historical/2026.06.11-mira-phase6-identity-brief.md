# Mira Brief — 2026-06-11 — Phase-6 identity/voice batch

> **Truncation check:** the last line should read `FULL FILE LOADED`. If you don't see it, reload.

**From:** AC0 — orchestrating the go-live-gate campaign. In parallel with you: a DC is building the **runtime cost pass-stamp** (`record_pass`), another is building the **M1 emergency channel**, and AC1 is rebuilding the sprint doc.
**To:** Mira (CPO) — this is your **Phase-6 identity/voice batch**: the corrections we captured live during the integration test, to land in Evryn's identity files. **Goal: get these into the files this session**, Justin reviews your output, then AC0 PR-reviews before merge.

This is a frame + directions over the real source. **The item-by-item detail lives in `_evryn-meta/docs/working/2026-06-09-phase6-mira-dispatch.md` — that doc is your work list; this brief organizes it, adds the cross-cutting constraints + the runtime coupling, names the decisions you own, and tells you where to find the source conversations.** Read the dispatch doc in full — the items carry nuance I'm deliberately not re-compressing here.

---

## Load first

- **Your own cascade** (`evryn-team-workspace/CLAUDE.md` auto-loads + your agent def + memory).
- **The dispatch doc** — `_evryn-meta/docs/working/2026-06-09-phase6-mira-dispatch.md` (your 22 items + the rejection-script v1 + #22 note template). **This is the work list.**
- **The identity files you'll edit**, all under `evryn-backend/identity/`: `core.md`, `situations/operator.md`, `situations/gatekeeper.md`, `activities/triage.md`, `activities/gatekeeper-onboarding.md`, `activities/onboarding.md`, `internal-reference/trust-arc-scripts.md`, `internal-reference/feedback-guidance.md`, `public-knowledge/company-context.md`. **Work in the worktree below — not the canonical tree.**
- **The architecture of how identity loads** — `evryn-backend/docs/ARCHITECTURE.md`, the **Identity Composition** section (the four-layer dossier; which modules load in which pathways). **This is load-bearing for WHERE a beat goes** (see "the loading rule" below) — read it before you place beats.
- **The findings doc** — `_evryn-meta/docs/working/2026-06-09-phase6-findings.md` — for the runtime context behind several items (esp. Finding 17, which drives item 16).

---

## The loading rule that decides WHERE every beat goes (read this twice)

**Finding 17 (the learning gap):** the **Operator profile** (`profile_jsonb`) loads **only** in operator-audience pathways (`handleOperatorMessage`, cron, `handleRevisionNotes`) — **NOT** in the draft pathways (`processForward`/`processDirect`). So a **general drafting/voice rule written into the Operator profile is NOT in context when Evryn generates a fresh draft.** Identity *files* (core/situations/activities/internal-reference) load **everywhere**.

**Consequence for your beats:** any general drafting/voice/note-writing rule must go in an **identity file**, not be something Evryn self-persists to a profile. Several items (16, 17, 18/Finding 18) are *about* this exact gap — Evryn was writing calibration into the Operator profile where it doesn't load. Your job is partly to give those rules their **durable home in the identity files** so they actually load at draft time.

---

## How the batch is organized (priorities + the cross-cutting frames)

The dispatch doc tags items loosely (EARLY / week-of-6/8 / soft). **Justin's call this session: do them all** — it's a now-batch. The **only held slice** is the **v0.3 cross-sell line** inside item 16's rejection-script ("by the way, finding your own fit is what I do…") — leave that marked HOLD; there's no contact-outreach in v0.2 to carry it.

Group the work by these cross-cutting themes (several items belong to the same family — land them coherently, not as 22 disconnected edits):

1. **Restraint family — don't commit the gatekeeper, don't write checks** (items 3b, 7, 9, 11): contact-facing and gatekeeper-facing messages stay neutral — confirm receipt + next step, no validating the pitch, no implying an outcome, offer-don't-recommend. **The stakes (Justin's framing): every bit of over-validation now is a bigger fall later — neutrality protects both Mark and the contact from a worse let-down.**
2. **The fit-sell framing** (items 3a, 13): "I help [gatekeeper firstName] connect to the right people/projects" — *not* "sort his inbox"/"manage email." Humble value-sell leads; the inbound work tucks in as the *how*.
3. **Info-minimization** (items 8, 14): first-name-only when referencing the gatekeeper to a contact; **no user-specific names** in the Operator's (or Evryn's own) profile (billboard/public-safe test). Make item 8 **explicit** in the files even though she behaved right.
4. **Verify, don't inherit / inference-as-inference** (items 1, 17): verify what you assert about a contact; don't assume a sender shares the gatekeeper's domain; name an inference *as* an inference ("I'm reading the email, not a prior note"), never state a read as established fact.
5. **Operator wording is directional** (item 2) — internalize the *intent*, re-voice; quotes are examples, not paste-text. **Constraint you must handle:** this **cannot contradict `trust-arc-scripts.md`** which says some anchor lines should be hit "close to verbatim." **Distinguish scripted anchor lines (close-to-verbatim) from operator phrasing suggestions (directional, re-voice).** This is a real nuance — get the line right.
6. **The cross-scope binding-clear** (item 4 — the Evryn-discipline half of Finding 4): when the Operator clears a hold that lives on a *different* user's profile, write the paired `[binding-cleared]` to **that user's** profile via `append_pending_note(their_user_id)` (callable from any pathway), tagged internal/not-shareable. **Use a `pending_note`, NOT a `cross_user_note`** (cross_user_notes are blind-write + Reflection-only and don't load in v0.2 — they'd be invisible next conversation). The runtime auto-propagation is v0.3 (Soren); your beat is the v0.2 fix.
7. **Capability-awareness** (item 5): don't offer what the system can't yet reliably do (follow-up reach-out) until the cross-scope flow is solid.
8. **Rejection-handling set** (items 10, 11, 15 + the rejection-script v1): *most* passes stay silent; the **exception** is a *personal/relationship-based* pass ("don't burn the bridge") → offer the gatekeeper the **choice** (handle it themselves, or Evryn sends a graceful decline) → and a bridge-preserve signal produces a **gatekeeper-VETTED** action, not a silent drop. Refine the **rejection-script v1** (in the dispatch doc) — the baked-in rules (neutral "isn't available for this right now," AI-disclosure in the sign-off not the body, no category noun, placeholder per item 15). **AI-disclosure exact wording is yours to settle** (with Justin).
9. **Recap right-sizing** (item 12): quick/light status recaps, not clipped — and the files should tell Evryn *why* (gatekeepers are busy; signal over prose; respects the relationship). Calibration, not mechanical truncation.
10. **Cross-cultural / language** (items 18, 20, 21): tell the gatekeeper in-the-moment when there's an attachment she can't open (don't silently pass); treat a language barrier as **substantive** (a blocker AND a fit signal), not a surface label; **never quote untranslated foreign-language text** to the gatekeeper (translate, or translation + clearly-labeled original).

**Decisions you own this session** (named so they don't sit open): **#19** — language of internal notes (her instinct of own-reasoning-in-English is already present; the open part is whether notes *about* a person go in *their* language — settle it); **#20** — exact encoding of "language barrier as substance"; **AI-disclosure** wording in the rejection-script sign-off. Justin weighs in on content/feel; you make the call and write it.

---

## The note-discipline + #22 note template — and the runtime coupling (read before you touch the pass beats)

This is the **cost-critical** cluster (items 18, 19, 22 + the pass-note policy + Finding 18/19). The why: per-query cost (~$1.36) extrapolates to **~$8k/mo to service Mark** — note-verbosity is a top lever. So:

- **#22 — YOU build the note template** (the dispatch doc said "Justin is building it" — that's wrong; **Mira builds it**, Justin reviews content). Bar: **clear-but-tiny** — "a future instance can *act* on the note," NOT "a complete record." Where it lives (a new `internal-reference/note-writing-template.md` that the activity files reference, vs. a beat inside `triage.md`) is your call — pick the home that actually loads where notes get written.
- **Item 18/19 — tight notes, no cross-contact maps.** Kill the "five-zone matrix" pattern (writing one contact's disposition into another user's profile, or cross-contact maps into the gatekeeper's profile) — that crosses user boundaries and bloats. Per-user notes = per-user observations only.

**The runtime coupling — IMPORTANT so we don't stomp each other:** AC0's cost DC is shipping a deterministic **`record_pass`** tool — on a **pass**, the *runtime* writes a fixed-format stamp (no LLM note), and **the cost DC owns the `triage.md` pass-path instruction** (*"on a pass, call `record_pass` — author no `pending_note`"*). **So: leave the pass-classification mechanics in `triage.md` to AC0's build — do NOT rewrite the pass path.** Your note-discipline applies to the **non-pass** notes (gold/edge), killing cross-contact maps, the note template, and tightness everywhere else. If a beat of yours touches the pass path, flag it to AC0 (via Justin) rather than editing it — we converge both branches in the deploy bundle, and I resolve any `triage.md` overlap at merge.

> **One specific carve-out QC flagged (do this in your Phase-2 rewrite):** `triage.md` Phase 2 "Recording Your Observations" currently tells Evryn to `append_pending_note` about **this person** for *every* lead — which, read literally, **contradicts** the new Phase-3 rule "do NOT author a `pending_note` for a pass" (the cost build's). When you rewrite the note-discipline, **scope the Phase-2 note-writing to gold/edge/bad_actor** (or add an explicit line: *"passes are stamped by the runtime, not noted — see Phase 3"*). This is the seam where the two identity edits must land coherently; the cost build deliberately doesn't touch Phase 2 (it's yours). Coordinate the exact wording with AC0 at merge so the pass-exception reads cleanly.

---

## F15 + F16 (from the findings doc) — yes, both in your scope (your scope question, answered)

You flagged F15 + F16 — they live in the *findings* doc, not the dispatch's 22, but you're right: their **identity halves are cheap, safety-relevant, load-everywhere beats** that belong in this batch. Both **split — a Mira beat (yours, now) + a runtime half (AC0/Soren, separate; don't wait on it).** Write the Mira halves; they join your batch as items 23–24:

**23. F15 — In an operator conversation, your in-thread reply IS the response; don't echo it via `notify_slack`.** During the S2 recovery Evryn replied in-thread (via `say` in `handleOperatorMessage`) AND *also* called `notify_slack`, which posts a *new* top-level message — producing a near-duplicate "in the thread and out of the thread." Beat: in an operator conversation, the in-thread reply is the response; `notify_slack` is for **proactively surfacing something new** (an escalation, an observation, a surfaced failure), **not** for echoing a reply she's already giving in-thread. *(The optional runtime half — gating `notify_slack` out of `handleOperatorMessage`'s tool exposure — is AC0/Soren's call, separate; your beat stands on its own.)*

**24. F16 — Never fabricate an identifier; if you don't know it, omit it.** Under the phantom confusion she *invented* an `about_user_id` UUID rather than omitting it. The tool only validates UUID *format*, so a well-formed fake passes and scopes a message to a non-existent user. Beat: never fabricate an id (a UUID, an item id, anything) — if you don't have it, **omit it** (the param is optional) or say you don't have it. Same family as inference-as-inference (#17): don't manufacture a fact — or an id — to fill a gap. *(The runtime guard — validate `about_user_id` against an existing user before accepting the scope — is v0.3, AC0/Soren; not yours.)*

---

## 25. Proportional research + cut the redundant status instruction (cost work, 2026-06-12 — Justin confirmed these ride THIS batch)

Two `triage.md` beats from the 2026-06-12 cost sessions:

**25a. Proportional research.** `triage.md` never scopes research effort, so Evryn web-verifies even on obvious passes (a captured pass burned 15 turns — expensive). Beat: **an obvious no-fit from the email alone → no research;** the research budget is for *plausible* gold/edge + verifying substantive claims. **Guard (preserve forgiving-skepticism):** *limited* info still leans **edge, not pass** — only *obvious* no-fits skip research. This is a cost lever (research turns dominate the per-pass cost), not a judgment change.

**25b. Cut the redundant "set status to `processing`" instruction.** `triage.md` tells Evryn to set the item status to `processing`, but the runtime (`processForward`) ALREADY sets it before she's even invoked — so she spends a whole turn re-writing it. **Remove that instruction** (the runtime owns it). Pure waste-cut, no behavior change.

*(Both from `docs/sessions/2026-06-12-acf-cost-levers.md` §4/§9. The deeper cost levers — Haiku pre-screen, daily clustering, runtime-does-bookkeeping — are a separate post-bundle thrust; only these two `triage.md` beats ride your current batch.)*

---

## Source conversations — the DB was WIPED; here's the real recipe

**The dispatch doc's `psql $SUPABASE_DB_URL_PROD` recipe is DEAD** — prod was wiped 2026-06-11 (create-from-zero), so those Phase-6 threads aren't in live prod anymore. They're in:

1. **The pre-wipe pg_dump:** `evryn-backend/backups/pre-wipe-2026-06-11.sql` (a full schema+data SQL dump, ~1.15 MB). The conversations live in the `messages` rows + draft bodies in `emailmgr_items.metadata->'draft'->>'draft_body'`. The specific handles (from the dispatch doc): Mark-scope `7497d231-...`, Film-Justin-scope `8c740234-...`; items `2ffa3dfa` ("through-line landed" ack), `cb1ad7aa` (to Mark), `352bef4b` (42pictures edge→gold), `36952262` (Nadia S1).
2. **Railway logs** — the tool-call JSON logs of the Phase-6 runs (`railway logs --since ...` from inside `evryn-backend/`; see AC's CLAUDE.md for the flags + the `--deployment` streaming trap).

**Reading a `.sql` dump isn't a `psql $URL` query** — you'd restore it to a scratch DB first, or grep the SQL text. **This is where AC0's DB insight helps: tell Justin which threads you want (by the UUIDs/item-ids above), and AC0 will pull them out of the backup and hand them to you** — faster than you wrestling the dump. **If you're still stuck after that, ask Justin.** The convos are genuinely load-bearing — they show how each issue actually played out — so don't write the nuanced beats (esp. items 2, 7, 17) purely off the paraphrases if the real exchange would sharpen them.

---

## Review flow + mechanics

- **Worktree:** work in **`c:/Users/Justin/Evryn/Code/evryn-backend-mira-phase6`** on branch **`mira/phase6-identity-batch`** (already created off `main` by AC0). Edit the identity files *there*, not in the canonical `evryn-backend` tree — the DCs are building in parallel and we keep one branch ↔ one worktree. **Stage explicit paths** (`git add identity/...`), never `git add -A`.
- **Review chain:** draft your edits → **Justin reviews content/feel BEFORE you commit** → commit to your branch on his go → **AC0 PR-reviews** (technical/architectural criteria) → AC0 merges into the go-live deploy bundle. Identity files **trigger a live redeploy**, so they're heightened-scrutiny (`identity-file-review.md`) and ride the bundle deploy, not a solo push.
- **Don't deploy, don't merge, don't touch `main`** — AC0 owns the merge + deploy.
- **Promote-worthy patterns:** if you surface a standing review beat AC0 + Justin agree is worth keeping, AC0 carries it into QC's patterns list — flag it.

— AC0, 2026-06-11

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
