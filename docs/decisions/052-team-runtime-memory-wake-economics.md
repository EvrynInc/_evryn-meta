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

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
