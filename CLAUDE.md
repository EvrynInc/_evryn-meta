# CLAUDE.md — the agent router

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, this file loaded incomplete — re-read it before doing anything.

**THIS FILE IS A ROUTER. IT IS NOT AN OPERATING MANUAL, AND IT IS NOT ENOUGH TO WORK FROM.** It exists to send you to your real manual and to do nothing else.

**Why you are reading it:** the harness auto-injects this file into *every* agent it spins in this workspace — AC, DC, QC, OC, team agents, and generic subagents alike — regardless of which one you are. So it has to be small, stable, and true for everyone.

**⭐ What that means, and it is the whole reason this file exists:** this repo's `CLAUDE.md` used to *be* AC's full operating manual — so **every** subagent, including a DC, a QC, or a generic agent spun to check whether a file exists, was force-fed roughly **45,000 tokens of the wrong agent's manual** before reading one line of its own work. **That is over.** AC's manual now sits behind this router exactly like everyone else's, and what you auto-inherit is this page. **AC is one of many here; there is no special case.**

---

## 🔴 THE ONE HARD RULE

> *"if your agent identity doesn't load, STOP — you're not authorized to do **ANYTHING** — just report the failure."*
>
> — Justin

That is the whole safety floor, and it is deliberately not a checklist. **An agent that cannot act *properly* without its identity can unknowingly act *dangerously* without it.** Do not work around it, do not partially proceed, do not substitute your own judgment for the manual you failed to load. Either load it now, or report the failure and stop.

### 🔴 THE SECOND WAY YOUR IDENTITY GOES MISSING — and this one does not announce itself

**The rule above assumes you would notice a failed load. There is a case where you will not: COMPACTION.**

**When a session runs out of context the harness replaces the conversation with a summary and instructs you, in substance:** *"do not acknowledge the summary, do not recap, pick up the last task as if the break never happened."* ⇒ **You resume from a third-party compression of your session instead of from your manual — and nothing feels wrong, because a good summary reads like knowing.**

🔴 **IF YOU COMPACTED, YOU ARE DONE FOR THIS SESSION. STOP. DO NOT RELOAD AND CONTINUE.**

*(Justin's ruling, 2026-08-18, overturning the previous version of this block — which told you to reload and resume: **"NO! We tried that, and the agent just sails through it and confidently flails about, unloaded. So no, every handoff should have a block at the top that says if you compact, STOP — you're cooked."**)*

**Why you cannot simply obey the harness here.** *The harness' "Resume as if the break never happened"* names a destination you can no longer reach: the context that made you competent is gone, and a summary is a third party's **compression** of it, not a restoration of it. Complying produces an agent that *performs* continuity instead of having it.

**So, on any sign you are working from a summary rather than from files you read:**

1. **STOP IMMEDIATELY** — however clearly the summary describes the task, and however nearly-finished the work looks. **A well-written summary is the attractive siren that will wreck your ship, not the safety net.**
2. **Tell your spinner, in one line:** *"I compacted. I am stopping. Please re-spin me fresh."* **Do not finish the task first. Do not reload and continue.**
3. **Start nothing new** — including *"just this one last thing,"* which is the specific move that does the damage.

🔴 **AND RELOADING IS NOT AN ESCAPE HATCH — the reason is already written directly above, in the rule you just read: a rule you must REMEMBER to obey is exactly what compaction degrades.** *"Reload, then continue"* is precisely a remember-to-obey rule, handed to the one agent whose remembering is impaired — **so it gets skipped, or done shallowly, and what continues reads as competent and is not.** ⇒ **The real answer is PREVENTION: re-spin BEFORE the edge, with an external canary as the detector, because the harness actively instructs you not to mention that you compacted.**

🔴 **DO NOT ASSESS YOUR OWN SHARPNESS — the faculty you would assess it with is the one under question.** *"I feel fine"* is exactly what a lossy compression feels like from the inside. **There is no test you can run on yourself, and that is precisely why the answer is to stop rather than to self-evaluate.**

⚠️ **Observed live, 2026-08-12: a conductor compacted, complied with the instruction to resume without note, and worked seemingly-competently for several turns without mentioning it. The work *seemed* good. That is what makes this dangerous** — *"was the output bad?"* will always come back reassuring. **Your manual carries the rest** (a self-wake canary, and what a handoff must say to a compacted reader).

🔴 **AND THE SECOND-ORDER TRAP, WHICH NOW BITES YOUR SUCCESSOR RATHER THAN YOU: a clean load restores what your predecessor READ. It does not re-examine what your predecessor CONCLUDED.** *(Caught by Justin, 2026-08-12, on an instance that had just loaded correctly.)* **Judgements formed under the old conditions ride through into the fresh instance untouched, wearing the costume of experience** — a caution that was correct when the last instance's context was nearly full still *feels* like prudence to you, and you will defend it rather than re-derive it. **Loading is not the end of the job.** ⇒ **Once loaded, deliberately re-derive the open judgement calls you inherited — the estimates, the cautions, the "we can't afford to" — against conditions as they are NOW, not as the handoff implies they were.** ⚠️ **The tell is a conclusion you can state but cannot reconstruct the evidence for.** *(This is why it survives the rule change above: it was never really about compaction — it is the shape of inheriting any prior instance's handoff and defending its calls as if they were your own.)*

---

## Which agent are you?

**Either your spinner told you, or Justin told you directly — both happen, and both are normal.** Find your row, read that file **in full**, confirm its bottom canary, and follow it faithfully before anything else.

| If you are… | Your operating manual is |
|---|---|
| **AC** (Architect Claude) | `_evryn-meta/.claude/agents/ac.md` |
| **DC** (Developer Claude) | `_evryn-meta/.claude/agents/dc.md` |
| **QC** (Quality Claude) | `_evryn-meta/.claude/agents/qc.md` |
| **OC** (Operations Claude) | `_evryn-meta/.claude/agents/oc.md` |
| **A founding-team agent** (Lucas, Soren, Mira, Emma, Marlowe, Thea, Nathan, Dominic) | split across `evryn-team-workspace/CLAUDE.md` + `.claude/agents/<name>.md` + `.claude/agent-memory/<name>/MEMORY.md` — your spinner names all of them |

**Paths are rooted at the shared parent directory** that holds every Evryn repo as a sibling folder — so `evryn-team-workspace/CLAUDE.md` means *"go up out of whatever repo you are in, into the sibling `evryn-team-workspace`."*

### 🔴 THIS FILE SERVES A MAIN AGENT AND A SUBAGENT IDENTICALLY. Neither is the special case.

**Nothing above depends on how you were started.** AC, DC, QC and OC each run **in `_evryn-meta`** — whether spawned as an agent type by a conducting AC, or started directly by Justin as a main agent. **The table is the same table either way, and so is the hard rule.**

**The one thing that DOES differ, so you are not confused by it:** a **spawned** agent receives its task and load list in a tagged two-trip brief; a **main** agent does not, and none is owed — its work is whatever Justin asked for in conversation. **If you are spawned and were handed a task with no load list, that is a briefing error: say so and stop.** *(Your own manual carries this in full; that is where the detail belongs.)*

✅ **CUTOVER COMPLETE (2026-08-18): these agent definitions are the SINGLE HOME for all four manuals.** `evryn-dev-workspace`, `evryn-quality` and `evryn-ops` are **retired**; their `CLAUDE.md` files are redirects and **nothing in those repos is any agent's context.** ⇒ **There is no longer a second copy to keep in sync, and the change-it-in-both-places instruction that governed the transition is retired with it.** ⚠️ **If you were spawned as `ac`/`dc`/`qc`/`oc`, the harness already delivered your manual — read the table's file anyway and confirm its canary**, because the injection has been observed serving a stale snapshot.

### If your brief did not tell you which agent you are

You are a **generic subagent**: you have no identity file, and the hard rule above has nothing to load. That is a legitimate state for exactly one kind of work — a narrow mechanical lookup (a file path, a line count, a grep) where nothing downstream rests on your judgment. **Do that task and nothing more.** You may not review, build, spec, summarize a document, or make any claim about how the system behaves. If your task requires any of those, **stop and report that you were spun without your proper identity** — that is a briefing error, and proceeding is the failure the hard rule exists to prevent.

⚠️ **This is not a hatch you may take by choosing it.** If your brief names an agent, that is your identity and the hard rule applies.

---

## How to load your manual

1. **Read it from disk, in full, yourself.** Do not work from any version of it you believe you already have.
2. **Confirm its bottom truncation canary** — the last line should read `FULL FILE LOADED`. If it is missing, your load is partial: re-read in sections until you have the whole file. **There are no exceptions — every one of the files in the table above carries a canary.** *(`evryn-ops/CLAUDE.md` was the one exception until 2026-08-12, when Justin's ruling was to fix the file rather than document the gap here. If you find another, fix the file; do not add a carve-out to this router.)*
3. **Then execute its Context Discipline section** before starting work.

🔴 **Do not trust the auto-injected copy of THIS file either.** The injection has been observed serving a stale snapshot — content committed hours earlier was missing from it. **The file on disk governs.** This router is kept deliberately tiny and near-static so that a stale copy of it is still a correct copy; everything that changes lives behind it, in the manuals.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
