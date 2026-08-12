# ADR-052 — Team-Runtime Memory & Wake-Economics Architecture

**Status:** Accepted (2026-07-15, Justin)
**Context repo:** `evryn-team-runtime` (ADR-050)
**Supersedes/extends:** design v2 §3.6 memory sketch (`evryn-team-workspace/shared/projects/ops/team-runtime/2026.07.10-acf-justin-team-runtime-design-v2.md`); the 2026-07-10 memory deep-dive.
**Design-of-record (the full spec — read it for any build):** `evryn-team-workspace/shared/projects/ops/team-runtime/2026.07.15-acf-team-runtime-memory-architecture.md`.

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.

---

## Context

The team runtime (ADR-050) composes each agent fresh per wake. "Memory" is how an agent carries understanding across wakes and conversations. Two problems were open: (1) the mature consolidation *design* (`consolidation-protocol.md`) is never *fired* by the autonomous runtime, so notes accumulate untouched (Lucas's memory was already past its consolidation trigger); and (2) the "meta-meeting token bomb" — today an @mention subscribes an agent and every subsequent thread message triggers a full ~64K-token wake, so 8 agents in one thread means 7 full wakes per message. A Fable deep-dive (2026-07-15) produced a full architecture; Justin reviewed and ruled the same day.

## Decision

Adopt the memory + wake-economics architecture in the design-of-record. The load-bearing decisions:

1. **The thread IS the session.** Load the current thread in full (remove the 30-message window); a durable, ledger-backed thread is the persistent working context — deliberately reinventing sessions without the un-steerable SDK compaction we reject.
2. **Wake economics = membership, not a model gate.** Only agents *in* a thread wake on it. Run membership like a good meeting: invite who's needed, `leave_thread` when done, invite a silent stakeholder at the *end* for one full-download pass. This replaces the deep-dive's first-draft Haiku "should I engage?" gate (Justin's call — deterministic, no guessing, no error surface).
3. **One shared digest per thread + a per-agent scratchpad headline.** Split digest *content* (one shared blurb per thread) from *membership* (per-agent); refresh on a **30-minute sweep** of threads with new activity (no per-message tagging/importance heuristics). Each agent's personal lens is its own scratchpad *headline*, not a per-agent digest. Digest visible to *ever-members* until the thread ages out.
4. **Private per-thread scratchpad** — working state that dies at dormancy; the relief valve that stops working-scratch from bloating `MEMORY.md`.
5. **Dormancy memory-write** — at thread age-out, one fully-loaded write per ever-member, **thread-ID-stamped** (the "echo rule": a re-activated thread's memory + fresh digest must reconcile as one story, not read as two).
6. **Per-agent wake serialization** — one wake at a time per agent ("one mind, one moment"), so cross-thread learning merges through memory fast-forward-only and never forks.
7. **Runtime-wired two-lane consolidation** (Phase 2) — Lane A runs the autonomous, reversible parts (versioned story rewrite + the protocol's fresh-instance/fact-audit/cross-agent-review subagents); Lane B parks the Protected-list items (source-of-truth promotions, durable-principle edits, structure changes) as proposals for Justin's async approval. **Hard requirement:** Justin's review touchpoints must stay genuinely light, so that he runs consolidations/standups *often* — frequent burn-downs are what keep every agent's composed load small.

   > ⚠️ **CORRECTED 2026-08-12 (ACf-13), recording a supersession from 2026-07-16 that never reached this file. This clause originally read *"genuinely light (phone-first, under a minute)."* The design-of-record §8.1 REVERSED that one day after this ADR was accepted, and the reversal is the load-bearing part:**
   >
   > **"Light enough" does NOT mean sub-minute — and demanding that is itself the corner-cutting failure.** A consolidation is precise surgery: it affects **every thought the agent has from here forward**, so it has to be right, and being right takes some time. A sub-minute target would make us cut corners on exactly the thing that must not be rushed. **5–10 minutes is a great outcome.**
   >
   > **The actual lever is FREQUENCY, not speed.** The trap is a doom-loop — *reviews take time → so he does them rarely → so decisions pile up → so each one takes longer still.* Run it the other way: **consolidate frequently (daily-ish) and any single review carries very few sign-offs**, which is what naturally holds it to 5–10 minutes without anything being rushed. **Design for cadence and let the light touch fall out of it.**
   >
   > Full reasoning: design-of-record **§8.1**. *(Left here as a correction rather than a silent rewrite, because an ADR is a decision record — and because whoever builds Phase 2 consolidation would otherwise have built to the wrong requirement, which is what this was heading for: it sat unfixed for four weeks and was flagged twice.)*
8. **Retrieval:** Postgres full-text + recency first; pgvector only on observed paraphrase-recall failure (not speculatively — right for our MB-not-TB corpus).

## Phasing

- **Phase 1 (approved, building now — lane ACf1):** scratchpad + headline · shared 30-min digest + ever-member visibility · membership wake-model (internal-thread members-wake, `leave_thread`, `post_to_thread`, late-invite) · full-thread-load + load-awareness nudge · per-agent serialization · dormancy memory-write · opt-in thread-stamped notes.
- **Phase 2 (approved in principle, scheduling with ACU — lane ACf2):** consolidation runtime-wiring (two-lane) · FTS retrieval · the little birds.
- *(These memory-track phase numbers are distinct from the `evryn-team-runtime` build Phases 0–4.)*

## Consequences

- **Positive:** ~70% cut on meta-meeting token cost by membership alone (no gating infra); memory that self-distills (Phase 2); no silent context loss (dormancy-write completes the thread lifecycle); vetted mainstream-correct against agentic-memory SOTA (design doc §9) and *ahead* on auditability.
- **Cost/risk:** full-thread-load costs more per *real* wake on a long thread (accepted — Justin: never silently forget a meeting's start); membership gaps mean an un-invited agent is a little behind until invited (accepted — same tradeoff human teams make; @mention is the real-time escalation); Phase 2's consolidation autonomy is guarded by archive-before-overwrite + the Lane-A/B split. Full risk table: design doc §10.
- **Divergence from today:** enumerated in design doc §3.7. `ARCHITECTURE.md` + `BUILD-PHASE-1.md` carry a breadcrumb to the design-of-record and describe the current built state until the phases merge.

---

## Amendment — 2026-08-12: the session question re-examined, and CONFIRMED on new reasoning

> **This is a dated re-examination, not a reversal. Decision 1 stands.** It is recorded here because Justin re-opened the question, accepted the recommendation to keep the decision, and asked that the reasoning be preserved at full resolution *"if we come back later and want to poke at this question again."* **The original decision's stated basis has weakened; a stronger basis replaced it — and a reader re-opening this question later needs the NEW argument, because refuting the old one is now easy and would not touch the decision.**
>
> **Full analysis, with `file:line` evidence:** `_evryn-meta/docs/research/2026.08.12-acfsq-team-runtime-sdk-sessions.md` (lane `ACfsq`). **This section carries the decision-grade reasoning; the SDK forensics stay there.**

**What was re-opened.** Decision 1 says the thread IS the session — *"deliberately reinventing sessions without the un-steerable SDK compaction we reject."* Justin challenged the premise: *"You've got the whole thread… but that's kind of it. You don't have access to your thinking during that turn."* His counter was that compaction only fires when a context grows large, and that the membership model (decision 2) plus 7-day age-out (decision 5) exist to keep rooms small — so under tight membership most threads should never compact at all, making the objection largely moot.

**The counter was correct, and it did not save sessions.**

### 1. The original objection is genuinely weaker than when this ADR was written

Against the pinned SDK (`@anthropic-ai/claude-agent-sdk@0.3.207`), compaction is **not** the opaque, un-steerable event decision 1 assumes. It is **observable** — it emits a boundary message, carrying its trigger and its before/after token counts, on the same stream the runtime already consumes. It is **interceptable** — a pre-compaction hook exists. And it is plausibly **disableable** outright. ⇒ **Justin's own proposed mitigation is available in a strictly better form than he proposed it:** he suggested a standing order telling agents to announce when they compact; the runtime can simply *detect* it, deterministically, with no instruction for an agent to forget. **Recorded plainly because it cuts against the decision this amendment confirms.**

### 2. 🔴 The argument that actually decides it — and it is NOT in the original decision

**A session freezes the trunk, and the trunk is the whole design.**

The runtime re-reads identity, `MEMORY.md`, team current-state and `runtime-ops.md` **fresh on every wake**. That is not an implementation detail; it is the mechanism decisions 5 and 6 rest on. The design-of-record states it directly: what an agent learns in room A reaches room B *"because both wakes are the same mind loading the same memory."*

**A per-(agent, thread) session freezes each room's copy of that base at session-creation time.** A note written in room A would no longer reach a live session in room B. **The trunk stops being a trunk and becomes N drifting branches** — which is precisely the *"disembodied versions"* fork that decision 6's per-agent serialization exists to eliminate, re-entering as **staleness** rather than **concurrency**.

**And the dilemma is unavoidable, which is what makes this decisive rather than merely a cost:**

- **Re-send the full composed base on every resumed turn** to keep memory fresh → you pay the ~63K-token base **plus** the entire accumulated transcript, every turn, with no equivalent of the 7-day age-out that bounds a thread. **Defeats the purpose.**
- **Don't** → the session is permanently stale in identity and memory, and gets staler. **Defeats the memory model.**

There is no third position, and **it holds regardless of how any remaining SDK unknown resolves.**

### 3. Persistence: established, and it disqualifies the default configuration outright

The gating question was whether an SDK session survives a restart, since ARCHITECTURE cardinal invariant 4 puts everything durable in Postgres. **Answered from the SDK's typings, two-branched, because the branch is a configuration choice:**

- **Default:** sessions persist to disk under `CLAUDE_CONFIG_DIR` — and this runtime points that at a **temp directory**. It would persist to exactly the place designed to be discarded. **Disqualifying on its own.**
- **With the SDK's pluggable external session store:** durable in Postgres, in principle. But that surface is `@alpha`, it is a **mirror rather than a primary** (local disk remains the durability guarantee), and **after three failed writes it drops the batch.** A store with a documented drop path is not invariant 4.

### 4. What replaces sessions — three tiers, in order

1. **Sharpen the scratchpad instruction from *status* to *work-done*.** ⚠️ **Correcting a claim that circulated during this review: an instruction already exists** — both `runtime-ops.md` and the `scratchpad_write` tool description already tell agents to keep working state. **The gap is narrower: every phrasing is scoped to *where I am* and *what I am waiting on*, never to *what I already checked and found nothing in*** — which is the loss Justin actually named. A clause on an existing bullet, not a new beat.
2. **A deterministic work record built from the `PostToolUse` hook that already fires.** The hook already delivers each tool call and its result; today's handler discards both and logs one line. Capturing a compact per-(agent, thread) record and composing it back hits the pain **deterministically** — not dependent on an agent remembering — while staying in Postgres, enumerable in the wake manifest, and steerable. **Commissioned as a design pass after the Phase-1 fast-follow, not before it.**
3. **A bounded session trial only if 1 and 2 prove insufficient**, and only on a durably-backed store — never on the default configuration.

### 5. Two findings from Justin's follow-up questions, both of which STRENGTHEN this decision

- **On what happens without compaction when a wake outgrows the window:** it does **not** crash. A context overflow surfaces as a result message the runtime already inspects, and the existing error path **parks the wake with a durable record and a Slack alert.** ⚠️ **But the runtime discards the SDK's specific `terminal_reason`, so the operator is told a generic error rather than "the prompt outgrew the context window."** That is a real, small gap in shipped code, independent of this decision. **A separate and sharper question is open: whether auto-compaction can already fire *inside* a single long wake today. If it can, the objection in decision 1 is not protecting us for exactly the case that matters, and we would be taking uncontrolled compaction unobserved** — because the runtime discards every stream message that is not a final result. **UNKNOWN from the typings; cheap to measure; worth measuring regardless of this decision.**
- **On where the model's reasoning lives:** the reasoning travels in the assistant-message stream as thinking content, **and the runtime already receives it and throws it away.** ⇒ **The work record in tier 2 is not limited to what was *done*; what was *concluded* is reachable too, without a session.** That moves the cheap path materially closer to session parity — though capturing it raw would be wrong on both volume and data-governance grounds (ADR-050's two-tier rule), so the right shape is a bounded distillation. **This is the strongest single reason the decision below is comfortable rather than merely defensible.**

### 6. One adjacent risk this review surfaced in shipped code

**The scratchpad is overwrite-only, with no version history and no archive** — one `content` column, replaced wholesale on every write. **The memory path has archive-before-overwrite (`memory_versions`); the scratchpad path has nothing.** Snapshot semantics were chosen deliberately, to stop an append-log bloating every wake — **but that rationale weighed bloat, never self-inflicted loss.** ⚠️ **Tier 1 above makes this worse before it makes it better, by asking agents to accumulate more value in exactly that store.** Raised by Justin (*"I've seen agents clobber themselves way too many times"*); **filed as its own item, not folded into this decision.**

### The amended decision

**Decision 1 STANDS: no SDK sessions. The reasoning changes from *"compaction is un-steerable"* to *"a session freezes the trunk, and the trunk is the design."*** Anyone re-opening this question should attack §2 above — refuting the compaction objection alone no longer moves it.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
