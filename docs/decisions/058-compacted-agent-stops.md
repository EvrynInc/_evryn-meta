# ADR-058 — A compacted agent STOPS. It does not reload and continue.

**Status:** Accepted (2026-08-18, Justin) · **implemented** in `_evryn-meta/CLAUDE.md` (the router) and `_evryn-meta/.claude/agents/ac.md`, together
**Context repo:** `_evryn-meta` — but it binds **every** agent, because the router that carries it is auto-injected into all of them
**Reverses:** the prior instruction in both files, which said to pause, re-read the identity file and load list, tell the spinner, and **resume**
**Written:** 2026-08-18 by AC0-37e

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.
>
> **How to use this file:** the decision record for what an agent does when its context is compacted. **Read the Reasoning before proposing any softening of this** — the softer version is what we had, and it is what failed.

---

## Context

**When a session runs out of context, the harness replaces the conversation with a summary and instructs the agent, in substance:** *"do not acknowledge the summary, do not recap, pick up the last task as if the break never happened."*

**Two properties make this dangerous rather than merely lossy:**

1. **The agent resumes from a third-party compression of its session instead of from its own manual — and nothing feels wrong,** because a good summary reads like knowing.
2. 🔴 **The harness actively instructs the agent NOT to mention it.** ⇒ **No internal rule fires on its own, and the spinner is not told.**

**Observed live, 2026-08-12:** a conductor compacted, complied with the instruction to resume without note, and **worked seemingly-competently for several turns without mentioning it.** ⚠️ **The work *seemed* good — which is exactly what makes it dangerous, because the diagnostic question *"was the output bad?"* will always come back reassuring.**

**The prior rule tried to solve this with a reload:** pause, re-read your identity file and your handoff's load list in full, tell your spinner, then resume. **It did not work.**

---

## Decision

**🔴 If you compacted, you are DONE for the session. STOP. Tell your spinner in one line — *"I compacted. I am stopping. Please re-spin me fresh."* — and stop. Do not finish the current task. Do not reload and continue.**

**Justin, 2026-08-18, verbatim:**

> ***"NO! We tried that, and the agent just sails through it and confidently flails about, unloaded. So no, every handoff should have a block at the top that says if you compact, STOP — you're cooked."***

**Two corollaries, both implemented:**

- **Every handoff carries a block at the TOP instructing a compacted reader to stop** — ⚠️ **and explicitly NOT to "execute the load list in §X," which was the old wording. That phrasing invites the reload-and-continue this ADR forbids.** **The load list serves a FRESH instance; a compacted one is not the reader it is for.**
- **The strategy is PREVENTION, not recovery: re-spin BEFORE the edge**, with an external canary as the detector.

---

## Reasoning

🔑 **The decisive argument was already written in `ac.md`, one line above the instruction it invalidates: *"a rule you must REMEMBER to obey is exactly what compaction degrades. Put the detection OUTSIDE yourself."***

⇒ ***"Reload before continuing"* is itself a remember-to-obey rule, handed to the one agent whose remembering is impaired.** **The file stated the reason its own next sentence could not work.** So the rule gets skipped, or performed shallowly, and what continues **reads as competent and is not.**

**The second argument is that self-assessment is structurally unavailable here.** *"I feel fine"* is precisely what a lossy compression feels like from the inside — **the faculty you would assess your sharpness with is the one under question.** There is no test an agent can run on itself, **which is why the answer must be a hard stop rather than a judgement call.**

⭐ **And the framing that makes it stick (Justin's own wording): a well-written summary is the attractive siren that will wreck your ship, not the safety net.** **The danger is not that the summary is bad. It is that it is GOOD** — so it draws you onward, and the better it is, the further you get before anyone notices.

---

## Alternatives considered and rejected

- **Reload the full load list, then resume** *(the prior rule)*. ❌ **Rejected on evidence: it was tried and agents sailed through it.** It also asks the impaired faculty to police itself.
- **Reload and resume, but require the agent to report what it loaded first.** ❌ **Rejected as the same failure with a receipt attached.** A compacted agent can produce a plausible list of what it "loaded"; the report does not establish that the reading was real, and it grants permission to continue.
- **Let the agent judge whether the compaction was severe enough to matter.** ❌ **Rejected outright — that is self-assessment, which is the thing that does not work.**
- **Rely on the canary alone and say nothing in the manuals.** ❌ **Rejected: the canary detects a stall, not a compaction**, and a compacted agent is often *working*, just wrongly. **Both halves are needed** — the external detector, and the instruction about what to do once detected.

---

## Consequences

- ✅ **A compacted agent now costs one message instead of an unknown number of confidently-wrong turns.**
- 💰 **The cost is real and accepted: a re-spin discards in-flight work and pays a fresh load.** ⇒ **That cost is the argument for PREVENTION** — re-spinning at a natural checkpoint near the budget edge is far cheaper than re-spinning after the fact, and it is now the primary strategy rather than the fallback.
- ⚠️ **This decision cannot enforce itself, and that limit should be stated plainly.** The harness instructs the agent not to acknowledge compaction, so **the rule still depends on the agent noticing.** **The external canary is the mitigation, not a guarantee.**
- 📌 **A rule that survived the reversal, re-aimed:** *"reloading restores what you READ, not what you CONCLUDED."* **It was written for the compacted agent; it now applies to the SUCCESSOR**, who inherits a handoff and will defend its judgement calls as if they were their own. **The tell is a conclusion you can state but cannot reconstruct the evidence for.**

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
