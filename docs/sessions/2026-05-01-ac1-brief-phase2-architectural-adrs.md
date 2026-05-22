# AC1 Brief — 2026-05-01 — Two Architectural ADR-Thinking Items from Phase 2 Run

**From:** AC0 (the Phase 2 conversation instance)
**To:** AC1
**Status:** Background dispatch, not blocking. AC0 and Justin are continuing the v0.2 integration test. These two items surfaced during yesterday's Phase 2 run and need ADR-level architectural thinking — *not the actual writes yet*, but the thinking that will inform the writes once we have one more concrete data point (after adversarial test passes).

---

## What you are walking into (cold-context orientation)

You're not just being handed two tasks. You're being asked to do meaningful architectural thinking for Evryn at a specific moment in the build arc. Read this section completely before starting.

### Where we are right now

- **Evryn is pre-launch.** The product MVP is v0.2 "Gatekeeper's Inbox" — Mark Titus (Seattle filmmaker, August Island Pictures + Eva's Wild) is the pilot gatekeeper. Evryn-the-product surfaces gold/pass/edge classifications from his forwarded inbox, drafts responses, Justin approves on Slack. Code is built and deployed; identity-and-test work is the current gate.
- **Yesterday's deploy `ba37ee54`** (2026-04-29 18:43 PT) shipped late-scope recovery (ADR-031), the `rescope_messages` MCP tool, Mira's `operator.md` ADR-031 pass, and DC's disconnect-event Slack monitor.
- **The integration test is in flight.** Phase 2 (Slack intro + research + first-draft) ran yesterday. Phase 3 (multi-turn onboarding) and Phase 4 (verification) are still ahead. AC0 is the conversation instance.
- **Mark-live is gated** on: integration test passing → adversarial test passing → emergency-alerts wiring → STEP 0 cleanup → go-live decision. Not in a hurry per Justin (Mark is patient; quality > speed).
- **v0.3 is the next major arc** — web app, matching engine, payments, cast-off outreach, "active Evryn." This is when the publisher module lands, when proactive cron architecture gets exercised heavily, and when the capability-vs-constraint question stops being theoretical.

### What yesterday's Phase 2 run surfaced

Read [`_evryn-meta/docs/sessions/2026-04-30-canonical-phase2-run.md`](2026-04-30-canonical-phase2-run.md) end-to-end before doing any thinking. It is the load-bearing source. The TL;DR for orientation only:

- Verify-and-lock-first beat passed cleanly (the canonical happy path post-deploy works)
- Evryn's first draft email to Mark was performing — literary register, fabricated timeline, calling attention to her own framing
- Evryn self-corrected with sharp specificity when Justin pushed back
- 40 minutes later, the **daily proactive cron** fired in a separate Evryn-instance with different identity loaded — and that-Evryn drafted Mark a fresh email anyway, breaking a process-commitment ("I'll wait") that the conversation-instance had just made
- The cron message was also a *ghost* — visible in Slack, not logged to the messages table, not scoped to Mark, no audit trail anywhere

These observations are the seed for both items below.

### Required context before architectural thinking

Read these in order. They aren't just "background" — they're the prior decisions you have to reckon with so you don't propose anything that contradicts already-made calls or recreates work that's been done.

**Tier 1 — auto-loaded (you'll have this on session start):** `_evryn-meta/CLAUDE.md`. Pay attention to the Architectural Mandate, Security Mindset, and Documentation Approach sections.

**Tier 2 — orientation (read every session):**
- `_evryn-meta/docs/hub/roadmap.md` — the Hub. Company truth. Read this before architectural thinking — it will frame what you're optimizing *for*.
- `_evryn-meta/docs/hub/technical-vision.md` — particularly the publisher discussion. Capability-vs-constraint thinking has to be grounded in what the publisher is actually intended to be.
- `_evryn-meta/docs/hub/trust-and-safety.md` — what the constraints are *defending*.
- `_evryn-meta/docs/current-state.md` — current cross-repo snapshot.

**Tier 3 — architecture (load-bearing for both items):**
- `evryn-backend/docs/ARCHITECTURE.md` — particularly Pipeline Design (the pathways), Memory Architecture, the publisher discussion, and Identity Composition. **This is where existing decisions about identity loading live.** The "Updated 2026-04-29" callouts mark recent revisions for ADR-030/031.
- The five sections in ARCHITECTURE.md updated 2026-04-29 (Operator Track, System Actors, v0.3 Operator Interface, Meta-Operator, Identity Composition) are particularly relevant — they're the recently-considered ground-truth for the area you're thinking about.

**Tier 4 — prior decisions you need to reckon with:**
- `_evryn-meta/docs/decisions/027-profile-architecture-simplification.md` — story + pending_notes model
- `_evryn-meta/docs/decisions/029-remove-getrecipient-redirect.md` — why the previous defense-in-depth layer was removed
- `_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md` — thread-scope as the way Operator-Evryn isolation works
- `_evryn-meta/docs/decisions/031-late-scope-recovery.md` — the third recovery pattern (extends 030)
- These four together constitute the *very recent* architectural floor. Both items below sit on top of them.

**Tier 5 — existing related backlog/work:**
- `evryn-backend/docs/SPRINT-MARK-LIVE.md` — particularly the Backlog section. Row 526 ("Compulsion audit pass") is closely related to Item 2 below — be aware. Row 530 (late-scope recovery) is the precedent for how the last architectural-thinking-then-fix arc went.
- The two backlog rows added yesterday in commit `7d5b79d` (curiosity-led research, relationship-ownership posture) — these are Mira's plate, but they're sibling-thinking to your Item 1.

**Tier 6 — what you do NOT need to load yet:**
- The runtime code itself (poll.ts, slack.ts, classify.ts) — you'll reference specific lines below, but you don't need to read the whole runtime end-to-end. The architectural thinking is about principle, not implementation.
- The Mira brief sibling to this doc — only relevant if you find yourself in design space that overlaps her Item 3.

### Authority boundaries

- **You can read widely.** Anything in any repo.
- **You should not commit anything** without Justin's explicit per-commit go-ahead (this is a hardened CLAUDE.md rule as of yesterday — see line 123).
- **You should not edit source-of-truth docs** (Hub, spokes, ARCHITECTURE.md, BUILD docs, LEARNINGS.md, AGENT_PATTERNS.md, protocol docs). Propose changes; don't make them.
- **You can write working docs.** Use `_evryn-meta/docs/working/` (create the directory if needed) for your thinking. These are absorbed into ADRs later, not committed pre-emptively.
- **Coordinate via the AC↔AC mechanism Justin uses** — there is no AC-to-AC mailbox protocol; Justin hand-relays between us. If your thinking surfaces something AC0 needs to act on during the test, flag it in your working doc and let Justin know.

### Process expectation

You are doing **prep thinking, not final decisions**. Justin wants the actual ADR write to happen after adversarial test passes (one more concrete data point). Your output is the working doc that captures the design space, tradeoffs, preliminary recommendations, and questions for Justin — so when the time comes, the ADR can be written cleanly from your prep.

Your working doc should include, for each item:
1. Problem statement (the seam, the observable behavior, the architectural question underneath)
2. Design space (3-5 candidate framings, not just one)
3. Tradeoffs per framing (what it costs, what it buys, what it changes)
4. Open questions for Justin (things you can't decide alone)
5. Preliminary recommendation (your read, with reasoning)
6. Cross-references to existing decisions and current backlog

Don't bury the lede. Lead each section with the load-bearing observation, then unpack.

---

## Item 1 — Cron architecture ADR thinking

### The observable seams from yesterday

The daily proactive cron ([poll.ts:312 `checkProactiveOutreach`](../../../evryn-backend/src/email/poll.ts#L312)) fired during the Phase 2 run and surfaced three concrete seams:

**Seam A — Cron doesn't load operator.md when pinging the Operator.** [poll.ts:324](../../../evryn-backend/src/email/poll.ts#L324) calls `composeSystemPrompt(personContext, false)` — the `false` is `includeOperator`. So when cron-Evryn fires to ping Justin (the Operator), she does it without operator.md loaded. That means no scope-thread discipline, no verify-and-lock posture, and no structural respect for promises made in the Slack-Operator pathway.

**Seam B — Cron-initiated outbound about a user doesn't scope to that user.** Cron-Evryn used `notify_slack` to post a top-level message in `#evryn-approvals`. That message:
- Hit Slack (Justin saw it)
- Was NOT logged to `messages` table (`notify_slack` doesn't call `createMessage`)
- Had no `scope_user_id`
- Had no `thread_id` linked to anything queryable
- Is invisible to thread-Evryn via every DB query

So the cron message is a **ghost** — visible to Justin, invisible to future Evryn-instances, no audit trail.

**Seam C — Cadence is "24h since last invocation," not "fixed time of day."** [poll.ts:309-315](../../../evryn-backend/src/email/poll.ts#L309): `lastProactiveCheck = 0` on startup → fires immediately on deploy → "24h after that". So the "daily" cadence drifts based on deploy times.

### The deeper question — *should different Evryn-instances ever load fundamentally different identity?*

DC has been briefed to fix Seams A and C as small tactical changes (and possibly B). But the deeper architectural question is:

When the runtime spins up an Evryn-instance to do work, *what's the principle for what identity gets loaded?*

Today's reality:
- **Slack-Operator pathway:** core.md + operator.md + Operator's profile + scoped user's profile
- **Cron pathway:** core.md + scoped user's profile (no operator.md, no operator profile)
- **Inbound forwarded email pathway:** core.md + gatekeeper user's profile (no operator.md — runs in gatekeeper context)
- **Inbound direct message pathway:** core.md + sender user's profile (no operator.md)

Each pathway loads what's "relevant" for the task at hand. That's defensible — load minimum context for cost/coherence reasons. But **it produces inconsistent Evryn-instances that don't share commitments, posture, or even some core habits across invocations.**

The cron-Evryn-broke-her-promise incident is the consequence. Different version of *her* with different identity loaded made a different judgment call.

### What ADR thinking should explore

1. **Is the principle "load minimum context for the task" actually right?** Or should *every* Evryn-invocation load core.md + operator.md regardless of pathway, because operator.md carries discipline that should be universal (scope-thread discipline, recovery patterns, "don't break promises made elsewhere")?
2. **What's the cost of loading more identity per invocation?** Token cost (operator.md is ~125 lines, ~3KB). Coherence cost (does loading operator.md in inbound pathways confuse the runtime if Operator isn't actually present)? *Note: prompt caching mitigates the token cost substantially — ARCHITECTURE.md Identity Composition section discusses this. Read that before deciding tokens are a real constraint.*
3. **What's the right structural fix for the "ghost message" problem?** Should `notify_slack` always log to messages? Or should there be a clean distinction between "operational poke" (DM-like, doesn't log) and "Evryn-as-conversational-actor" (logs with scope)? The cron's proactive-outreach use case is the latter, but it's currently using the former mechanism.
4. **Are there other pathways with similar seams?** Look at the four pathways above and stress-test each one. Where else could a different Evryn-instance produce a different judgment because of different loaded identity?
5. **How does this interact with v0.3?** v0.3 active-Evryn introduces more pathways (proactive outreach, recurring follow-ups, cast-off contact, etc.). The cron architecture is about to get *much* more elaborate. Ground-truth principles need to land before that elaboration begins.
6. **How does this interact with Mira's parallel work?** She's thinking through process-commitments-as-pending-notes (item 3 in her brief). The two are sibling-questions — yours is the runtime/identity-loading frame; hers is the structured-memory frame. Together they form the answer to "how do promises bind across instances?"

---

## Item 2 — Capability-vs-constraint architecture ADR thinking

### Justin's framing (load-bearing — quote it back to yourself when stuck)

> *"Since all of her outbound has to go through me, why are we so worried about keeping her shackled? And in the future, once we trust her (and have the publisher module, to not let her fuck up), I feel like we should give her the tools to do what she needs."*

### The observation

The current architecture has multiple defensive layers all gating roughly the same risk (uncontrolled outbound). Stack as of v0.2:

1. **`SEND_ENABLED` kill switch** (env var) — pure shutoff
2. **DB-controlled recipient** (was `getRecipient()`; per ADR-029 that's now removed in favor of trusting the DB record + approval gate)
3. **Approval gate** (Justin must explicitly approve every outbound on Slack) — the safety floor
4. **`emailmgr_item_id` FK requirement on `submit_draft`** (organizational — every outbound has a parent record) — currently being relaxed in DC's bundle
5. **Tool-description compulsion language** (*"ALL outbound MUST go through this tool"*)
6. **Module-loading constraints** (cron doesn't load operator.md — see Item 1)

Items 1-3 are real safety layers. Items 4-6 are mostly *organization* (audit trails, structured pathways, defense-in-depth). The approval gate is the actual safety floor — *no draft goes out without Justin saying go*. So the upstream constraints (4, 5, 6) constrain *agency* without adding meaningful safety.

This is fine in v0.2 (Justin reviewing every outbound is the model). But:

### What changes when the publisher module lands

In v0.3+, the **publisher module** is a separate component that examines outbound before it leaves — checking for safety violations, leak risks, tone failures, hallucination — without Justin in the loop. **Read `evryn-backend/docs/ARCHITECTURE.md` and `_evryn-meta/docs/hub/technical-vision.md` for the existing thinking on what the publisher is. Don't reinvent.**

When the publisher exists:
- The approval gate relaxes (only flags problematic drafts for Justin, lets routine ones flow through)
- The compulsion language could relax (Evryn doesn't need a tool description threatening her if the publisher is the actual gate)
- The FK requirements could relax (the publisher doesn't need a parent record to evaluate a draft)
- Module-loading constraints could relax (more identity loaded everywhere is fine when the publisher is the floor)

**The architectural arc:** v0.2 is "tightly-typed rails + human gate"; v0.3 is "broader capability + publisher gate"; v0.4+ is "broad capability + accumulated trust + publisher as backstop, not gate."

### What ADR thinking should explore

1. **What's the right principle for distinguishing *constraint-as-safety* from *constraint-as-organization*?** Some constraints are real safety (the kill switch). Others are organizational (FK requirements). The distinction matters because they relax differently as trust accumulates.
2. **What's the publisher module's actual scope?** Existing thinking lives in ARCHITECTURE.md and technical-vision.md. *Read those first* — your job is to extend the thinking with the capability-vs-constraint framing, not to re-derive what the publisher is.
3. **Which v0.2 constraints should relax in v0.3 vs. stay?** Stratify them by "this protects against catastrophe" vs. "this enforces structure." The first stays; the second relaxes.
4. **How does this interact with the existing "compulsion audit pass" backlog row** (SPRINT-MARK-LIVE.md row 526)? That row is language-level — yours is structural-level. Are they the same ADR or two? My read: the structural one supersedes the language one (if you fix the structure, the language naturally follows). But check.
5. **What's the migration path?** v0.2 → v0.3 isn't a flip-the-switch transition. The publisher needs to be built, validated, trusted. What's the staged relaxation that matches the staged build?
6. **What's the failure mode if you over-constrain?** The cron-Evryn-broke-her-promise incident is partly evidence here — over-constraining what cron-Evryn can do (no operator.md) made her less aware, not safer. Constraints can produce *worse* judgment when they remove context she needs to make good calls.

---

## Coordination notes

- **AC0 is the Phase 2 conversation instance.** Don't touch `evryn-backend` during AC0's active session unless coordinating via Justin.
- **Mira is also doing parallel work** — she has the identity-craft items from Phase 2 (see [Mira brief](2026-05-01-mira-brief-phase2-discoveries.md)). Her item 3 (process-commitments-as-pending-notes) overlaps with your Item 1 (cron architecture) — the design space is shared. If you produce relevant thinking on cron-Evryn loading more identity, that may inform her design space too. There is no AC-to-Mira protocol; Justin coordinates between us.
- **DC will be working on cron tactical fixes in parallel** — your ADR thinking will eventually inform the *next* round of cron work, not this one. DC's bundle is just the small tactical fixes (load operator.md, fixed-time cadence, possibly cron-logs-to-messages). What ships in this DC bundle is *not* the architectural answer; it's the bandage. Your work is the structural answer.
- **Adversarial test is the next data point** that will inform the actual ADR write. Don't write the ADRs yet. Working doc only.

---

## What success looks like

You produce one working doc per item (or one combined doc — your call) at `_evryn-meta/docs/working/` that:

- Maps the design space comprehensively (3-5 framings minimum per item, not just the one you prefer)
- Identifies tradeoffs honestly (every framing has costs)
- Names open questions that need Justin's input — be specific, not vague
- Gives a preliminary recommendation with reasoning
- Cross-references the prior ADRs (027, 029, 030, 031) and explains how your thinking sits on top of them
- Names what *can't* be decided yet and what data point would unblock that decision

When AC0/Justin pick up this work post-adversarial-test, the working doc should be ready to compress into an ADR with minimal additional thinking.

— AC0, 2026-05-01

---

## Append 2026-05-22 — Context shift since you were briefed

You were briefed on 2026-05-01 and asked five clarifying questions. Three weeks of Justin's other-business absorption + my own session pause meant your questions sat unanswered until now. Here's the answers + what's shifted in the substance of your two items.

### Your five clarifying questions, answered

1. **Output location:** `_evryn-meta/docs/working/` is correct. Create the directory.
2. **One doc vs. two:** one combined working doc. Your two items share design space (cron-architecture's "should different Evryn-instances load fundamentally different identity?" interacts with capability-vs-constraint's "what relaxes when the publisher lands?").
3. **Read scope:** Tier 1-5 from the original brief. Skip Tier 6 unless you need it.
4. **Coordination with AC0:** ping me on `#team-alerts` if you need AC0 input. No formal mailbox between us.
5. **Read Mira's brief:** yes — particularly her Item 3 (process-commitments via `[binding: ...]`-tagged pending_notes). Interacts with your cron architecture thinking. **Note her brief has been superseded by `_evryn-meta/docs/sessions/2026-05-22-mira-brief-bundle.md`** (today's bundle, broader scope) — read the newer one.

### What shifted in your Item 1 (cron architecture)

**ADR-030 has been amended today (2026-05-22).** Read `_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md` — particularly the "Amendment 2026-05-22 — Operator-Audience Carve-Out" section appended at the bottom.

The amendment **partially absorbs your Item 1's first sub-question** — *should the cron load `operator.md`?* The answer that landed: **yes, when audience is the Operator** (i.e., always in cron — cron-Evryn may ping the Operator via `notify_slack` in any invocation, so Operator-discipline loads structurally). The framing principle is **audience over trigger**: what determines loaded identity isn't *what woke this instance*, it's *who she's talking to once awake*.

The amendment also surfaces a **leak-vector guardrail** that wasn't in the original brief and is worth folding into your Item 1 thinking: with Operator-context loaded in cron, cron-Evryn's writes to user pending_notes must stay user-substantive (not Operator-coordination state). Eighteen days of cron-fired pending_notes on Mark (5/4-5/22) exhibit exactly the leak pattern — half their substance is *about Justin*, not Mark. The amendment names the discipline (writes must be user-substantive); Mira's Item 4 in today's bundle translates that into operator.md language. Identity-layer fix, not architectural.

**What's still genuinely open** in your Item 1 — and where your thinking has the most leverage:

- **The deep question stays open:** should *any* pathway load fundamentally different identity, or should every pathway load a consistent baseline + situational add-ons? Today's amendment closes the specific seam Phase 2 surfaced, but it does so via case-by-case carve-out. A first-principles answer to "what's the universal identity baseline for every Evryn-invocation?" would either ratify the carve-out approach or replace it. The amendment is a v0.2 patch; your working doc can address the v0.3 ground-truth.
- **The ghost-message problem** (cron `notify_slack` pings not logged to messages table — empirically biting; four pings to Justin over 18 days unseen because they didn't surface anywhere queryable) is still unresolved. Worth thinking about whether `notify_slack` should always log, whether there's a clean distinction between "operational poke" and "Evryn-as-conversational-actor," or whether the structural fix is bigger.
- **Cross-instance memory binding** — the original ghost-message + promise-binding question — *partially* working informally today (Mark's 18 pending_notes show cross-instance continuity through writes/reads of the user record), structurally being upgraded by Mira's `[binding: ...]`-tag design (today's bundle). Your working doc could think about whether informal continuity + tagged-bindings is the durable shape or whether there's a deeper architecture (e.g., per-thread operator state, explicit commitments table).

### What shifted in your Item 2 (capability-vs-constraint)

**Substantively unchanged**, but with new context worth folding in:

- **A new design conversation is in flight between Mira and Justin** about Evryn's *voice anchoring*. Background: v0.1 Evryn felt magical because she had everything loaded; v0.2 Evryn feels okay because we've been miserly with tokens. Justin's read: *"we're telling her who she is while giving her very few anchors — we're giving our actor margin notes, but almost no lines."* The immediate tactical fix landing in today's bundle: load `trust-arc-scripts.md` (her voice samples) in every Evryn prompt, positioned at the end of her internal-self stuff before the user context. The trust-arc-scripts.md document is functional (the actual trust arc — finding people their people, only connecting people she trusts, etc.) AND voice-sample (how she sounds when she's most herself); the load makes both available every conversation.
- **The broader Mira-Justin conversation** (still in flight, not yet a brief): how do we make Evryn's identity docs more *anchor-rich* — especially the activity files (`onboarding.md`, `gatekeeper-onboarding.md`, `triage.md`) — so she doesn't just have rules and procedures but exemplars of voice, judgment, and discipline she can pattern-match against. Likely v0.2-or-early-v0.3 work; shape TBD.
- **Why this matters for your Item 2:** "capability vs. constraint" originally framed structural constraints (FK requirements, schema enforcement, tool-description compulsion). The voice-anchoring conversation surfaces a *complementary* dimension — **constraint-by-undersaturation**. Evryn might be capability-constrained not because we're explicitly limiting her, but because we're loading her with too few demonstrations to operate at full resolution. Worth integrating into your thinking — what's the right principle for *what* loads + *how much* loads + *when*, as the publisher module lands and trust accumulates?

### Coordination updates

- **AC0 is active** (not the pause I was in from 5/2-5/22). Phase 2 work resumed today; today's bundle (DC's Items + Mira's Items) ships in one Railway redeploy today.
- **Mira is working in parallel today** on her bundle.
- **DC is on standby** for his trip once Mira's PR merges.
- **You are *not* on the critical path for today's bundle.** Your working docs can land whenever — Justin wants the architectural thinking before he commits to v0.3 build decisions, and the deferral until adversarial test still holds.

### What's still deferred

The actual ADR writes for both items are still deferred per the original brief — adversarial test passing is still the next concrete data point that should inform the writes. Your output stays *working docs*, not ADRs.

### When you're ready

You're cleared to start. Your output goes to `_evryn-meta/docs/working/cron-architecture-and-capability-thinking.md` (or whatever name you prefer). Ping me on `#team-alerts` if you hit anything that needs AC0 input.

— AC0, 2026-05-22

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
