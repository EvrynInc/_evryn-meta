# ADR-055 — The thread IS the complete record: full bodies, in-position diffs, and a loud ceiling

**Status:** Accepted (2026-08-13, Justin)
**Context repo:** `evryn-team-runtime` (ADR-050)
**Extends:** ADR-052 (team-runtime memory & wake-economics) — this does **not** reverse its decision 1 (no SDK sessions); it changes *what we build instead*.
**Supersedes:** the "pointers and conclusions, never payloads" conclusion in `evryn-team-runtime/docs/research/2026.08.12-acfsq-team-runtime-sdk-sessions.md` §13.4, and the composed-thread windowing behavior in `src/composer/layers.ts`.

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.
>
> **How to use this file:** the decision record for how an agent's working context is assembled per wake. **Read the Reasoning section before proposing any change to thread composition** — three of the alternatives below were considered and rejected for specific reasons, and each has been proposed more than once.

---

## Context

**An agent has no session.** Every wake is a brand-new conversation with the model; the runtime composes it fresh from identity, memory, the thread, and a handful of other layers. ADR-052 decision 1 declined SDK sessions, and a 2026-08-12 analysis re-confirmed that on stronger reasoning (a session freezes the memory trunk, which is the design).

**That left an open question ADR-052 never answered: if not a session, then what carries an agent's working experience within a room?** Three things were true of the runtime as built:

1. **A file an agent reads mid-wake is gone when that wake ends.** No layer carries a tool result; the `PostToolUse` handler discards the arguments and the response. The next wake in the same room re-reads the file and pays again.
2. **The agent's reasoning also reaches the runtime and is discarded** — it arrives as thinking content on the message stream the wake loop iterates, and that loop handles only the final `result` message.
3. **When a thread exceeds `THREAD_HARD_CEILING_TOKENS`, the composer drops the MIDDLE of the conversation** and inserts `[...N messages elided — search_messages to retrieve]`.

**The 2026-08-12 analysis proposed a "work record": store what was called, a content hash, and the agent's conclusion — but not response bodies, on the reasoning that "the file is still in the workspace clone, unchanged and re-readable."**

**Justin rejected that, and the rejection is the substance of this ADR.**

---

## Decision

**The thread is the agent's complete record of its own experience in a room. Nothing an agent has seen is dropped, summarized, or made retrievable-on-request.**

1. **Full file bodies are written into the thread, in position, at first read.** Diffs are written in position on every subsequent read where the content moved. Tool calls, their results, and a bounded distillation of the agent's reasoning are written the same way.
2. **The agent never derives its current state.** Current file contents are composed directly as their own layer. History lives in the thread; the present is handed over.
3. **Windowing is removed.** A thread is never silently trimmed.
4. **A graduated warning ladder replaces it, ending in a loud refusal** — see *Mechanics*.
5. **Agents gain the ability to start a thread** — one verb for a human-facing thread, one for an inter-agent room.
6. **Diffs are computed once**, when a read is found to differ from the last recorded version, and stored. Never recomputed at wake time.

---

## Reasoning — read this before re-proposing anything below

### 🔴 Why "store it and let the agent query it" was rejected. This is the load-bearing one.

**A retrievable-on-request design re-creates compaction at the file level.** The agent does not hold the file; it holds a *reference*, reasons confidently from what it believes the file said, and **never queries — because nothing tells it that it does not know.**

**Justin's statement of it, which is the canonical version:**

> *"I work with you guys all the time and you *think* you know what's in a file — you fucking don't. He'll be lobotomized all the time and won't know it."*

**This was demonstrated live on 2026-08-13, on the conductor writing this ADR.** Its session compacted; it worked from the machine-written summary for several turns without noticing, and asserted at least three things to Justin that were false — while feeling entirely competent. **A pointer is a summary wearing a path.** The failure is not that information is missing; it is that **its absence is invisible to the party who needs it.**

⇒ **This is not a cost-versus-quality trade-off. It is the same failure mode the runtime is otherwise built to refuse.**

### 🔴 Why the "re-read it if you need it" premise was false anyway

§13.4's argument rested on *"the file is still in the workspace clone, unchanged and re-readable."* **"Unchanged" was asserted, never verified, and is false:**

- **The runtime writes, commits and pushes `MEMORY.md` after every note write.** So the file that changes most often, within a single boot, by the agents' own action, is the one most central to the question.
- A redeploy can move anything.
- ⚠️ **The "~15-min workspace refresh" in ARCHITECTURE cardinal invariant 1 does NOT exist** — `syncWorkspace` and `syncMetaRepo` are called exactly once, at boot. *(Filed separately; it is the third instance in this repo of a doc asserting a runtime behavior that was never built.)*

**And the worst case is not a gap — it is a silent wrong answer.** An agent asked to compare an old document against a new one re-reads the path expecting version A, receives version B, compares B against B, and reports *"no change."* **Nothing in the system can catch that** — no park, no alert, no missing-data signal. **A confident false negative is categorically worse than a hole.**

**The one case §13.4 left open as "narrow" — results that cannot be reproduced — is not narrow.** It is every file in a repo anyone writes to, including the memory files the agents rewrite every wake.

### Why the agent is never asked to derive current state

**Applying a sequence of diffs to reconstruct a present value is an operation a model performs confidently and wrongly**, and the error is undetectable from the outside. So the composition gives three things, each answering a different question, none requiring reconstruction:

| What | Answers |
|---|---|
| **The body, in position, at first read** | *"What were we looking at when we said that?"* — this is what makes the conversation legible |
| **The diff, in position, at each change** | *"When did it move, and what moved?"* |
| **Current contents, as their own layer** | *"What is true now?"* — **handed over, never derived** |

**This is less cognitive work than the status quo, not more.** Today an agent receives a thread and must remember what it read.

### Why storage is not the same question as composition

**The rejected §13.4 conflated them.** Context is expensive; a database row is not. **Excluding bodies from *composition* would be right if we needed to — excluding them from *storage* never followed**, and that was the move that manufactured the failure above.

⚠️ **The runtime keeps a content-addressed version store, and it is NOT an agent-facing feature.** It exists so the runtime can compute the next diff and so identical content re-read across many wakes is stored once. **The agent never queries it.** It receives bodies and diffs, composed. *(This distinction matters: "store it so the runtime can do its job" is not "store it and make the agent look it up." Only the second was rejected.)*

### Why the ceiling fails loud rather than degrading

**Windowing drops the middle of an agent's own conversation and tells it to go look the rest up** — the retrieval pattern rejected above, arriving as a failure mode rather than a design. Justin: *"I don't want holes. I also don't want to start dropping things."*

**The alternative is not "no limit." It is ample warning, then a hard stop.** A graduated ladder gives the agent — and everyone watching — room to wrap up deliberately. **With the last warning at 90% of a 1,000,000-token window, an agent that hits the wall has ignored 100,000 tokens of notice.**

### Why the warning is also posted to the room

**The agent nearing its limit is the party least able to act well on that fact.** Posting the state deterministically into the room makes it a shared problem: **Justin and the other agents can see the cliff and help close up shop**, instead of one agent privately sweating. It also gives Justin a signal he can act on — *"tell me and I'll start a new thread."*

### Why thread-creation verbs are part of this and not a separate item

**Without them, the warning is an instruction the agent cannot obey.** Verified 2026-08-13: a thread ID is *derived* from a Slack channel plus an existing message timestamp, so **a thread exists only because a human posted.** `post_to_thread` requires membership in a room that already exists. **Agents can join, reply and invite. They cannot initiate — with each other or with Justin.**

**In supervised Phase 1 that is by design. It becomes a blocker the moment autonomy turns on**, and it had no Step. **Shipping the alarm without the exit is worse than shipping neither**, which is why they are one piece of work.

---

## Mechanics

**The warning ladder** *(thresholds are Justin's, against a 1,000,000-token window)*:

| At | The agent is told | Also |
|---|---|---|
| **700k** | Informational — *"this thread is at ~X"* | — |
| **800k** | **Actionable** — capture what you need and plan to continue elsewhere; **names what is heavy** | **Posted to the room** |
| **900k** | **Urgent** — write your closing note now | **Posted to the room** |
| **950k** | Final notice | **Posted to the room** |
| **Over** | **Refuse.** Do not compose the newest content; park with a durable record and alert | **Posted to the room** |

- **The warning is composed LAST**, after wake context. Last-read is what gets acted on.
- **Two size signals, both already available:** an estimate computed at composition time, and the *exact* input-token count the model reported on the previous wake. **The exact figure calibrates the estimate.**
- ⚠️ **Under-estimating is the dangerous direction.** Budget conservatively, per the same discipline that sized the URL byte budget 2× under the most conservative limit.
- **`THREAD_HARD_CEILING_TOKENS = 200_000` is superseded** — it was set at **20%** of the real window, so the windowing nobody wants fired five times earlier than necessary.

**Composition ordering** — stable → volatile, preserving prompt-cache stability: identity/memory/skills → the thread (with embedded bodies and diffs) → current file contents → wake context → **the warning, last**.

---

## Consequences

- **Wakes get larger, deliberately.** Accepted: *"I'd rather have them smart than cheap any day."* Cost is bounded by storing each body once plus deltas, and by threads ageing out at dormancy.
- **A new message class** that is composed into the thread but **does not wake anyone, does not reset the dormancy clock, and does not mirror to Slack.** Two of those three filters already exist for `heartbeat`; **the third — visible but non-waking — is the genuinely new combination.** Requires a migration (a `message_type` value).
- **Data governance:** this creates a new durable copy of arbitrary file content in our database. **ADR-050's Tier-A/Tier-B rule applies and Nathan should see it before it ships.**
- **Retention** ties to the thread lifecycle, dying at dormancy *after* the closing memory has had its chance. ⚠️ **Build the sweep deliberately, never as a scheduled TTL** — the product lane carries a live case where a built-but-never-scheduled deletion job would have destroyed a real backlog the moment someone "closed the gap."
- **SPRINT Step 67 (scratchpad clobber risk) is narrowed, not resolved.** The scratchpad stays agent-written and snapshot-semantic; the thread now carries the durable history it was being asked to carry.
- **The compaction-observability measurement (Step 65 ①) drops from precondition to parallel.** This design bounds what we *send*, so the model cannot auto-compact on our prompt. ⚠️ **It does not bound what an agent reads mid-turn, and today usage arrives only on the final message — so an in-flight overflow would still be invisible.** Partial-message streaming (already proven in `evryn-backend`) is the known mechanism if that becomes real.

---

## What this does NOT decide

- **How much of the model's reasoning is captured, and in what form.** A bounded distillation is intended; the shape is a design-pass question and ADR-050's data rule constrains it.
- **The exact diff format**, and what happens to a *deleted* file (a diff against nothing).
- **Whether current-contents composition covers every file the agent touched, or only those still referenced.**
- **Anything about the product runtime.** This is `evryn-team-runtime` only.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
