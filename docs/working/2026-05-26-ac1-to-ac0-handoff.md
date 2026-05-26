# AC1 → AC0 Handoff — 2026-05-26

**From:** AC1 (the architectural-thinking instance you briefed 5/1, updated 5/22, then handed off via the 5/25 machine-switch doc).
**To:** AC0.
**Read this whole doc before touching the source-of-truth files I edited.** Several of my edits are wrapped in `> **PROPOSED EDIT — 2026-05-26 (AC1) — NOT LIVE.**` markers awaiting your sign-off (or Mira's / Soren's, where appropriate). Section "What I edited" below is the complete list with paths and reasoning.

---

## What happened today

Justin pulled me up after the machine switch, gave me the standard reload (your 5/1 brief, the 5/22 append, your 5/25 machine-switch appendage for me, ADR-030 + amendment). I worked through both items I was briefed on. Three major shifts happened in conversation with Justin that you should know about:

1. **Item 2 reframing — v0.2 lens, v0.3 sprawl to its own doc.** Justin pushed back on the working-doc approach for Item 2. His call: anything that changes how we build *today* goes into the proper place in arch/build docs; anything broader/sprawly for v0.3 goes to `evryn-team-workspace/shared/projects/product/research/v03-design/` with breadcrumbs. The original "one combined working doc in `_evryn-meta/docs/working/`" framing was scrapped for Item 2. Item 1 still has a working doc because the cross-loading question is v0.2-active (specs need writing now), but its v0.3 direction is captured in arch docs, not a separate doc.

2. **Item 1 cross-loading question — Justin made the v0.2 and v0.3 architectural calls in conversation.** This wasn't in the brief; it surfaced when I flagged the architectural gap (Operator-about-user scoped messages are invisible to user-facing Evryn — `getRecentMessages` filters by sender/recipient only, not by `scope_user_id`). His calls:
   - **v0.2:** Auto-load Operator-about-user messages into user-facing Evryn's prompt, clearly labeled. Just Mark, all gated, full payload acceptable.
   - **v0.3+:** Likely Reflection-distilled into the user's story (same Reflection → story pipeline that handles pending_notes and cross-user notes per ADR-027 Decision 3). Alternatives exist; recommendation points that direction.

3. **Item 2 reframing — ADR-033 in active review.** Justin noted ADR-033 is *still in review* with Mira (identity vocabulary) and Soren (runtime alignment), not fully landed. He went with the "do Item 2 first to unblock them" plan so they can read it with the broader frame before finalizing 033. He's going to tell them to re-read 033 with my transitional-axis addition.

---

## What I edited (full list, all live in files)

All edits below are written into the live source-of-truth files, wrapped in `> **PROPOSED EDIT — 2026-05-26 (AC1) — NOT LIVE.**` markers (following your pattern from the ADR-033 / PROPOSED EDIT blocks you wrote earlier today). Nothing is committed to git yet — Justin can revert any block by deleting it.

### Brand-new files (not PROPOSED EDIT — direct writes)

1. **`evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26 08-capability-vs-constraint.md`** — Item 2's v0.3+ design doc. Adds two axes alongside ADR-033's instruction-strength axis: *lifecycle* (transitional vs. permanent) and *constraint-by-undersaturation*. Maps all v0.2 constraints across the axes; sketches the publisher's role at v0.4; names the capability side (what Evryn gains v0.2 → v0.4+). Justin's open questions live at the bottom of this file.

2. **`_evryn-meta/docs/working/cron-architecture-and-cross-loading.md`** — Item 1's working doc. Recaps the four Phase 2 seams (three from your brief, one surfaced today). Names the deeper "identity per pathway" question as *already-closed* by ADR-030's audience-over-trigger principle. Specs the two v0.2 fixes (ghost-message logging + cross-loading auto-load). Gives the v0.3 Reflection-into-story direction with alternatives. Names open implementation details for DC.

3. **`_evryn-meta/docs/working/2026-05-26-ac1-to-ac0-handoff.md`** — this doc.

### PROPOSED EDIT blocks (written into existing source-of-truth files, awaiting your / Mira's / Soren's review)

4. **`_evryn-meta/docs/decisions/033-permission-compulsion-spectrum.md`** — **directly edited** (NOT a PROPOSED EDIT block — Justin told me to land it directly so Mira/Soren re-read with it included). Three changes:
   - **Header `Related:` line:** added pointer to Proposal 08.
   - **New subsection `### Adjacent axis — lifecycle of the rule (added 2026-05-26)`** inserted under `## Decision` after "Where each tier belongs in the system". Names the lifecycle axis as orthogonal to the spectrum, gives the audit-framework tagging format, points at Proposal 08 for worked examples.
   - **`### For runtime (Soren's territory)` first bullet:** expanded to be spectrum-aware AND lifecycle-aware (the compulsion audit gets both lenses, not just instruction strength).

   **Justin's instruction to me:** *"yes, definitely get this proposed addition into 033. I'll tell them to re-read."* Mira and Soren get a re-read; that's the live mechanism.

5. **`evryn-backend/docs/ARCHITECTURE.md`** — four PROPOSED EDIT blocks added (none replace existing prose; all are insertions):
   - **(a) In `### Memory Architecture` → `### Reflection Module`,** after your binding-TTL PROPOSED EDIT block. New paragraph naming Operator-scoped messages as a third tagged subclass Reflection processes (alongside pending_notes and cross_user_notes) → distills into the user's story in v0.3+. This is the destination for the v0.2 auto-load below; when this ships, the auto-load gets removed.
   - **(b) In `### Identity Composition` → after the four-pathway Composition diagram,** before "Why the trigger doesn't determine situation or activity." New subsection specs the v0.2 user-pathway auto-load of Operator-about-user scoped messages, labeled, marked transitional, with the prompt-section format and the lifecycle-axis reference to Proposal 08.
   - **(c) In `### Identity Composition` → `### Prompt caching optimization`,** after the "With the simplified trigger, only core.md..." paragraph. New subsection persisting the constraint-by-undersaturation 80/20 decision: `trust-arc-scripts.md` loads in every prompt, positioned after `core.md` + (operator content if loaded), before person context. Sits in the cached prefix because it's stable. Becomes live when DC's 5/22 voice-samples runtime change + Mira's 5/22 PR ship. v0.3 refinement tracked in Proposal 08.
   - **(d) In `## Pipeline Design` → `### Pipeline Design` → end of the `**Message recording:**` paragraph,** before `### Approval Gate (Justin/Publisher)`. New subsection: ghost-message fix spec. `notify_slack` always logs to `messages` with proper scope. Tool gains optional `about_user_id` parameter; tool handler captures the Slack `ts` and writes the `messages` row. The notification becomes a thread parent; ADR-030 mechanics inherit scope cleanly on the Operator's replies.

6. **`evryn-backend/docs/BUILD-EVRYN-MVP.md`** — one PROPOSED EDIT block:
   - In `## v0.3 Staging — Proposals Ready for Review` table, after the row for proposal 07 (multi-party orchestration). Adds a row for **Proposal 08 — Capability vs. constraint** with file link and key questions.

7. **`evryn-team-workspace/shared/projects/product/research/v03-design/2026.03.20 README.md`** — one PROPOSED EDIT block:
   - In the `## Proposals` table. Adds a row for **Proposal 07 — Multi-Party Orchestration** (yours, from 2026-04-29, which was orphaned from this README) AND a row for **Proposal 08 — Capability vs. Constraint Architecture** (mine, today). Flagging the proposal 07 row to you explicitly because I opportunistically fixed an index gap — if you'd rather I leave 07 out and only add 08, revert that row.

---

## What needs Mira's attention

(Surface these via the existing Mira mailbox `_evryn-meta/docs/sessions/2026-05-22-mira-brief-bundle.md` or however the protocol now works — I left them in the working docs but didn't open the mailbox conversation. Justin can relay or you can route.)

Small `operator.md` additions named in my working docs, but **not blocking** anything:

1. **A short beat about `about_user_id` on `notify_slack`** — instructing Evryn (when calling the tool from cron context, where she knows who she's pinging about) to pass `about_user_id` so the log scopes correctly. Specified in the ARCHITECTURE.md PROPOSED EDIT (d).

2. **A discipline beat about Operator-Evryn conversations as judgment-context, not transcripts-for-echo.** Specified in the ARCHITECTURE.md PROPOSED EDIT (b) — when user-facing Evryn loads the auto-loaded Operator-about-user section, she needs the framing that this is context for her judgment, not material to echo back to the user. The PROPOSED EDIT's labeled section header carries the floor; identity-layer reinforcement in `core.md` or `operator.md` hardens it.

Neither is in flight today. Pair with the next Mira pass — same kind of small identity additions she made for ADR-031 and the 5/22 amendment.

---

## What needs Soren's attention

Per Justin's instruction: Soren is reviewing ADR-033 for runtime alignment. With my transitional-axis addition (point 4 above), the compulsion-audit guidance in `### For runtime (Soren's territory)` is now lifecycle-aware. Soren's re-read should:

1. Verify the spectrum-aware AND lifecycle-aware audit framework fits the runtime work he was scoping.
2. Verify the four PROPOSED EDITs in `evryn-backend/docs/ARCHITECTURE.md` (items 5a-5d above) are runtime-feasible — particularly the ghost-message fix (item 5d), which is a small runtime change that touches `notifySlack` to return the Slack `ts` and adds a `createMessage` call. Companion-shippable with DC's 5/22 bundle if Soren signs off and DC picks it up.

---

## What needs your attention (AC0)

1. **Read Proposal 08** ([`evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26 08-capability-vs-constraint.md`](../../../evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26%2008-capability-vs-constraint.md)) end-to-end. Five open questions at the bottom that Justin hasn't answered yet; some are decisions to land in v0.3 BUILD doc, some are scoping calls (e.g., whether v0.3 includes a minimal publisher via deterministic hooks or defers the module to v0.4 entirely).

2. **Read my Item 1 working doc** ([`_evryn-meta/docs/working/cron-architecture-and-cross-loading.md`](./cron-architecture-and-cross-loading.md)). v0.2 specs are concrete and lifecycle-tagged as transitional; v0.3 direction recommends Reflection-distilled-into-story. The five open implementation questions at the bottom are for DC when these specs are picked up — your call whether to fold them into a DC mailbox brief now or hand them off when the next bundle is being scoped.

3. **Review the four ARCHITECTURE.md PROPOSED EDITs** (items 5a-5d above). All four are insertions, no replacements, so the diff is clean. You own that doc — flip any of them live, ask for changes, or revert as you see fit.

4. **The BUILD doc `### Permission, Compulsion, and Where Each Belongs` PROPOSED EDIT block** (your own, lines 99-117) doesn't yet reference Proposal 08 as the broader frame. Probably worth adding a "see also" pointer when you finalize it, but your call.

5. **Companion-shipping question.** My Item 1 v0.2 fixes (ghost-message logging + cross-loading auto-load) are companion-shippable with DC's 5/22 bundle in the next Railway redeploy (Monday). Whether to bundle them or ship separately is your operational call — both are small and the order matters (Spec 1 / logging must ship before Spec 2 / loading, otherwise the auto-load has nothing new to surface).

6. **My README.md PROPOSED EDIT** (`v03-design/2026.03.20 README.md`) opportunistically adds your orphaned proposal 07 row to the index. Flag if you'd rather I leave it; I can revert.

---

## What's still open from the brief

- **No actual ADR writes yet** — that was always the plan ("working docs only until adversarial test passes"). My Items 1 and 2 stay in working-doc / design-doc / PROPOSED EDIT form. When adversarial test passes (or when you and Justin decide otherwise), the actual ADR write happens.
- **The deeper "identity per pathway" question** is closed by ADR-030 amendment (per my working doc). Not re-derived. If you disagree, push back.
- **Cross-instance memory binding** is covered by Mira's 5/22 bundle Item 3 (binding-TTL). Not re-designed. Same as above — push back if you read it differently.

---

## What I did NOT do

- Did not edit `core.md` or `operator.md` directly (Mira territory; flagged in working docs).
- Did not write a new ADR for the ghost-message fix (commitment is uncontroversial; PROPOSED EDIT in arch doc is sufficient).
- Did not touch the BUILD doc's existing PROPOSED EDIT block (your draft, in review with Mira/Soren).
- Did not commit anything to git (Justin's policy; per-commit go-ahead).
- Did not open a Mira mailbox or DC mailbox conversation (Justin relays).
- Did not edit CHANGELOG (that happens at #lock; not now).

---

— AC1, 2026-05-26

---

## Append — 2026-05-26 (post-#lock, post-push) — what's left for you to commit

After this handoff was first written, I did a light #lock (CHANGELOG entry + current-state update) and pushed my **clean** files only. I left three files **uncommitted** because they had your earlier-in-the-day work mixed with mine — sweeping them into my commit would have violated the parallel-agent commit-discipline rule (the one CLAUDE.md added after the 2026-04-30 Lucas collision). Reading from the bottom of this doc tells you the new state in order.

**Files I pushed** (clean — only my work in the diff):
1. `_evryn-meta/CLAUDE.md` — new Slack-pings-are-attention-taps rule in Communication Rules.
2. `_evryn-meta/CHANGELOG.md` — today's entry at the top.
3. `_evryn-meta/docs/current-state.md` — refreshed.
4. `_evryn-meta/docs/working/2026-05-26-ac1-to-ac0-handoff.md` — this file (the version you're reading lives in git as of my push).
5. `_evryn-meta/docs/working/cron-architecture-and-cross-loading.md` — Item 1 working doc.
6. `evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26 08-capability-vs-constraint.md` — Proposal 08.
7. `evryn-team-workspace/shared/projects/product/research/v03-design/2026.03.20 README.md` — proposals 07 + 08 added to the index (you'll see the PROPOSED EDIT markers around both rows; flip live by removing the markers, or revert the proposal 07 row if you'd rather not opportunistically fix that gap).

**Files left uncommitted for you to handle** — these still have your work + my additions sitting in the working tree of two repos:

1. **`evryn-backend/docs/ARCHITECTURE.md`** — your two `PROPOSED EDIT — 2026-05-26 (AC0)` blocks (the Pipeline Design "Permission, Compulsion, and Where Each Belongs" replacement, and the Reflection Module binding-TTL paragraph) sit uncommitted alongside my **four** `PROPOSED EDIT — 2026-05-26 (AC1)` blocks (described in detail above under "What I edited" §5). When you commit, you'll be committing all six together — fine, since they're all yours-or-mine, but the commit message should attribute both. Or carve them into two commits if you'd rather (`git add -p` works on a file).

2. **`evryn-backend/docs/BUILD-EVRYN-MVP.md`** — your two AC0 PROPOSED EDIT blocks (the "Permission, Compulsion, and Where Each Belongs" §replacement and the Reflection binding-TTL row in the v0.3 deferred-items table) sit uncommitted alongside my **one** AC1 PROPOSED EDIT block (Proposal 08 row in the v0.3 Staging table). Same shape as ARCHITECTURE.md — fine to commit together with attribution, or carve.

3. **`_evryn-meta/docs/decisions/033-permission-compulsion-spectrum.md`** — **brand new untracked file you created today.** I added the transitional-axis paragraph + lifecycle-aware audit guidance + Proposal 08 cross-ref directly into the file body (per Justin's explicit go: *"yes, definitely get this proposed addition into 033. I'll tell them to re-read."*). The whole file is your work + my additions; first commit of this file should capture both attributions. Justin will tell Mira and Soren to re-read.

**Suggested commit shape for you:**

- One commit per repo, or carve by topic. Either works. The diff is clean — no other agents' work in the way at the moment I'm writing this; the only mixed-author lines are yours + mine.
- If you carve, the natural split in `evryn-backend` is "AC0's Permission-Compulsion edits" vs. "AC1's Item 1+2 architectural edits."
- Attribution: I'd suggest your commit messages mention both authors (e.g., `ARCHITECTURE.md + BUILD doc + ADR-033: permission-compulsion landings (AC0) + AC1 Items 1+2 PROPOSED EDITs`). Up to you.

**Why I structured it this way** (background, in case you'd have preferred I take a different approach): Justin's commit-discipline rule says commit only your own work; surface other agents' uncommitted state and let Justin / the other agent decide. With your work uncommitted in these three files, the right move was to leave them alone for you. If you'd rather I commit them in future sessions where the same situation arises, push back and I'll adjust — but my read of the rule says this was the call.

— AC1, 2026-05-26 (append)
