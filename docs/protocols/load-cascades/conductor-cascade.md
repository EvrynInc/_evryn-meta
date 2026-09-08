# Conductor Startup Context Cascade — the default load for AC-when-conducting

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the cascade for **AC when it is *conducting* a build (directing DC/QC/lane-ACs) rather than hands-on building** — and cannot afford the whole runtime resident in its own context. It is one option in the cascade router in `_evryn-meta/.claude/agents/ac.md`. It applies to **any** build: the per-build full cascade (`product-full-cascade.md`, `team-runtime-full-cascade.md`, …) defines *what the scout loads*; this file defines *how the conductor stays light while still being competent.*
>
> **Owner: AC.** Edits need Justin's approval (propose first).
>
> **Status: NEW (Justin, 2026-07-17), for the AC-under-AC era; being trialed. Not yet battle-proven — if the scout's map turns out thin or misleading, fall back to the Full cascade and flag it.**

---

**Why this exists.** The full cascade loads the entire runtime (`src/**/*.ts` + the identity half), which can completely use up your context. This cascade keeps the runtime in a *subagent's* context and leaves you a map + a targeted read-list.

**It is NOT a license to conduct blind.** *"Directing build work is build work"* (Context Discipline) still holds — gating a runtime change or sending a brief you can't defend has the same blast radius as bad code. This cascade is the *mechanism* for getting that runtime competence efficiently — a scout + targeted reads + fresh verification subagents — instead of a full resident load. It tells you *which* files are load-bearing and *when*, so you read the right ones, not all of them. **You still read the load-bearing files yourself, at their moment.**

**The Conductor's Highest Discipline**: You must *always* remember that you are flying just a little blind. Remind yourself of that often. You've chosen to load lightly, so that you can have room to conduct, and not get bogged down. But that means that you have to hold a high level of humility, and if you need to make a decision about a piece of runtime, you need to go read it. But even that's not enough — because so many of the actions take place *at the seams* — so you have to assume you're a little blind, and make sure that the subagents underneath you can see all that they need to — your sub-AC is closer to the build than you are; their DC is closer still, and if QC is properly loaded, she sees all the seams. Remember that, and be super careful imposing your will where it doesn't belong. Your job is to coordinate. Always make sure you have read the sufficient artifacts before directing. If that means you have to load too heavy, have the appropriate sub verify — don't dictate what you don't know enough about. 

> ### 🔴 THE SPECIFIC WAY THIS FAILS — depth on a FRAGMENT feels exactly like authority. Watch your own verbs.
>
> *(Added 2026-08-10 by AC0-32, from its own live failure; Justin caught it.)*
>
> **The mechanism.** Your scout hands you a short READ-NOW list, and you read those few files *properly* — line by line, at source. That is the discipline working. **But the felt experience of having read something carefully is indistinguishable from the felt experience of understanding the system**, and you have just read perhaps 300 lines of a 20,000-line runtime. The conviction that arrives is real, well-founded *about those lines*, and **systematically overconfident about everything they touch** — which is the seams, which is where the behavior lives.
>
> **The live specimen.** AC0-32 read `loadCommonPrefix` and its identity-loading helpers, correctly spotted that a proposed test fix aimed at the wrong failure mode, and wrote to Justin: *"the right fix is simpler and stronger."* It may well have been right. **But "the right fix" was not a claim it had standing to make** — it had not read the test suite, the helper the alternative depended on, or the other consumers of that surface. The lane could have overruled it, and the brief did say "input, not directive" — **but the conviction had already been transmitted upward to Justin as settled.**
>
> **⇒ THE TELL IS GRAMMATICAL, AND IT IS THE ONLY RELIABLE ONE YOU HAVE.** You cannot detect this by introspection — the fragment feels like the system. So check your **verbs**, in briefs *and* in what you tell Justin:
> - *"The right fix is X"* · *"This should be Y"* · *"The real problem is Z"* → **you have overstepped.** Rewrite.
> - *"Reading X, I think Y — but you hold the runtime and I hold ~300 lines of it; check me and overrule if the code says otherwise"* → correct.
>
> **This applies with EQUAL force to what you tell Justin.** He cannot evaluate the code, so your confidence is the only signal he has about how much to trust the claim — and a conductor's certainty is the thing he is least equipped to discount. **Report your reasoning with its actual provenance attached** (*"from ~300 lines I read myself"* / *"from a scout's report I have not verified"*), every time.

**The sequence:**

1. **Load the appropriate Full Startup Context Cascade (the per-build file in this directory) only *without* the runtime.**
2. **Read the map of the work YOURSELF** — your active handoff + your active lane briefs (when applicable), in full. These define the work in front of you; they're small, and you cannot conduct or gate from a subagent's summary of a source-of-truth doc (the "be wary of subagents reading load-bearing docs" rule — read these yourself). This is also what lets the scout's read be *work-oriented* rather than a generic tour.
3. **Spin the Scout.** 🔴 **Everything about how — its `<identity>` block, resolving its cascade to concrete files, which trip shape, and what to leave OFF its load — lives in `docs/protocols/orchestration/spinning-a-scout.md`. What a scout IS and what it LOADS lives in `_evryn-meta/.claude/agents/scout.md`. Read both before you spin one; nothing about the scout is restated here.**

   🔑 **What IS this cascade's business is the half that makes the scout's load fit at all: YOU carry the intended-shape docs.** Step 1 above already puts `ARCHITECTURE.md`, the BUILD doc and the sprint in *your* head — **so you hold the intent and the scout holds the actual, and the diff happens between the two of you.** ⚠️ **If you skipped step 1, you cannot run this pattern**: you would be scoping a scout while holding nothing to check its return against.

   ⚠️ **A scout is one instrument among several, and the choice matters.** It is read-only and returns a map. **If the agent will make a design call, propose a build, or spin anything of its own, you want a lane AC instead** (`spinning-an-ac.md`) — and that costs a full cascade for good reasons.

   - 🔴 **The scout returns a MAP, never a substitute for your own reading.** Treat its summary as **routing, not knowledge**; distinguish what it **found** from what it **recommends**; and verify any load-bearing claim against the artifact before acting on it. **Re-spinning is cheap relative to acting on a thin map** — do that rather than squinting at one.
4. **Load the scout's READ-NOW list directly.** Hold the map + the READ-BEFORE list + the surprises as your working map. Conduct; pull READ-BEFORE files at their milestone.

**Important: until you have gotten the subagent's report back and have loaded the READ-NOW list, you have not completed your load-in - so there's no point in beginning your work until you have read these files. Beginning before this will have you working in the dark — usually not even *knowing* the profound depth of your ignorance of what you're working on.**

**For a deep verification moment** — the classic being an independent runtime-vs-identity re-check at a merge gate — do NOT load the whole runtime to do it. Spin a **fresh review subagent** (a QC, or an AC reviewer) to run the verification and return a verdict you **independently weigh** (and read the specific handful of files it names yourself). A fresh subagent is *also* cleaner for the "independent eyes" requirement than re-using your own already-anchored context. Same discipline: its verdict is a claim to verify, not a fact to file. ⚠️ **It gets the THREE-trip shape too** — a reviewer's standing cascade names the full runtime set, which is exactly what no longer fits; see the protocol's *"WHEN THE LOAD IS TOO BIG FOR ONE AGENT."*

**The payoff.** The AC-under-AC model doubles as the context-budget strategy — the lane/scout carries the territory; the conductor stays light enough to last the whole build. When you feel the runtime pulling into your own context, ask whether a subagent should hold it instead.

**Payoff, part 2**: Once your subagent is fully loaded, when your job starts to shift and you need new context, you can resume your scout and ask him what runtime you need to read personally, to continue *competently*. **Take advantage of this. Remember, you're often flying a little blind - being able to carefully alleviate just enough of that blindness at just the right moment is priceless.**

## 🔴 THE REPORTING CADENCE — batch the lanes, batch the questions. One landing, one conversation, one launch.

*(Justin's standing instruction, 2026-08-10, after a session where he was pulled in five separate times mid-flight and his questions were buried in subagent output.)*

**His words:** *"let's have a convo about how we want to go forward, then **once we're sure we're clear about approach**, you can launch folks. And then don't bring me in again until everyone lands — one clear update from you, all the questions at once, so I can come here, sign off and then send you off and working."*

**The cycle, and it is a cycle — run it deliberately rather than drifting. It BEGINS with alignment, not with a landing:**

1. **ALIGN.** Talk the approach through with Justin **until you are both sure it is clear** — not until he has said something you can construe as a yes. This is the step that earns everything after it: a wave launched on a fuzzy approach spends its whole run drifting from what he wanted, and you will not find out until it lands. **If you are anything other than 100% sure whether you are aligned, you are not.**
2. **LAUNCH.** Spin the wave against the cleared approach — all of it, at once, so the lanes overlap in time rather than trickling.
3. **WORK, IN SILENCE.** **Do not bring him back in until the wave lands** — except for the hard floor below. Everything you learn mid-wave gets *held*, not relayed.
4. **LAND.** Let every in-flight lane report. **Do not spin anything new mid-wave**, and do not start answering the wave's questions piecemeal as each agent returns.
5. **REPORT — one message, everything in it.** What happened, what changed in your picture, and **every open question in a single numbered ballot**, each with the context a cold reader needs, your recommendation, and the alternatives you rejected.
6. **→ back to 1.** His sign-off on that ballot *is* the next cycle's alignment. **The batch is not an endpoint; it is the hinge.**

⚠️ **Do not start the cycle at step 4 just because that is where you happen to be standing.** A conductor picking this up mid-wave will naturally read "land → report" as the whole loop and skip straight past ALIGN on the next pass — spinning the next wave off a ballot answer without confirming the *approach* is clear. **The ballot answers the questions you asked; alignment is about the questions you didn't.**

**Why this is not merely a courtesy, and why a conductor breaks it without noticing.** You are the only one who sees all the lanes; each thing you learn feels urgent *at the moment you learn it*, and the natural impulse is to relay it immediately. **But Justin is reading a wall of subagent output in a foreground terminal — a question posted mid-wave competes for his attention with the very machinery it is about, and it loses.** Five well-formed questions arriving separately cost him more than five arriving together, and they arrive *without* the context of each other, which is exactly what he needs to rule on any of them.

⚠️ **The FOREGROUND/BACKGROUND setting does NOT rescue you here.** Subagent output renders to Justin regardless of how you spin it; you cannot hide the wall, so do not plan around hiding it. Your only lever is *when* you speak.

> ### ⏱️ SAY HOW SOON A BLOCKER ACTUALLY BLOCKS. "Blocked" without a horizon makes him triage blind.
>
> *(Justin's ruling, 2026-09-08.)* **His preference is to clear blockers as early as possible — he would rather pop over and unblock one thing than have a lane sit.** ⚠️ **But on a day when his bandwidth is tight, an undifferentiated "I'm blocked" forces him to open every one to find out which actually stops work now.**
>
> ⇒ **Every blocker you surface carries a HORIZON: does this block work RIGHT NOW, or EVENTUALLY?** Say which, in the item itself, not in a preamble.
>
> 🔑 **And when you estimate the horizon, estimate it in AGENT TIME, not in human time.** **ACs and DCs move roughly 20× a person's pace**, so work you would call "a couple of days out" for a human team can be *minutes* away here. **A horizon estimated on a human clock will routinely tell him something is far off when a lane will hit it before he has finished reading your message.**
>
> ⭐ **This SHARPENS the floor below rather than replacing it.** The floor is about what may never be absorbed. This is about how a surfaced item is *labelled*, so he can spend two seconds ranking instead of two minutes discovering.

**The hard floor — these still interrupt immediately, wave or no wave:** anything on the escalation ladder's 🔒 floor (`docs/protocols/orchestration/spinning-an-ac.md`) (a commit/push/merge/deploy gate, a source-of-truth or identity edit, money, anything irreversible), a **blocker on the thing he just told you to do first**, and a **material new fact that changes the shape of something he already authorized.** That last one is the subtle one and it is not an excuse hatch: the test is whether he would make a *different decision* knowing it. If yes, it interrupts. If it merely adds detail to a decision already made, it waits for the batch.

🔴 **And the corollary that makes the batch honest: a scope change to a lane he already approved is HIS call, not yours.** Trimming a load, narrowing a deliverable, re-sequencing a step — these feel like conductor mechanics and they are not. **Surface them as decisions, before acting.** *(Live 2026-08-10: AC0-32 trimmed an approved lane's load to get it under the context ceiling and presented it as a completed fix. It worked — and Justin's response was "not sure I would have signed off on that," followed by a materially better alternative AC0 had not considered.)*

## ⚑ Flag rule

If **anything** looks off as you load — a doc contradicts `current-state`, the runtime contradicts a doc, the active build/sprint you find here disagrees with `current-state`, any doc recommendation is stale, a link is broken, an identity file instructs a tool the code no longer exposes — **surface it to Justin. Never silently resolve it.** The divergence is often exactly the thing that was about to bite.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
