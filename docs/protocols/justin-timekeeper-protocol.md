# Justin Timekeeper Protocol

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** Read it when Justin needs to know how he actually spent his time over some past period — because his calendar went spotty, because he needs hours for a report, or because he wants to see a pattern across weeks. It is a **how-to guide**: the instruments, the order to use them in, and the traps that produce confident wrong answers. It does **not** hold the findings of any particular reconstruction — those go to his calendar, and anything durable about how he works goes to its own home.
>
> **AC owns this file.** Propose changes; don't make them directly.
>
> *Last updated: 2026-09-23.*

---

## What you are actually doing

You are reconstructing a person's working day from the traces his tools left behind. **The traces are good but partial, and the gaps are where the interesting time hides** — meetings, meals, appointments, illness. Most of the craft here is in *not* over-claiming: knowing which silences are real absences and which are just a machine you weren't looking at.

**Two instruments, and neither is sufficient alone.**

| | **Git commits** | **Claude Code transcripts** |
|---|---|---|
| **Covers** | Every machine — everything gets pushed | **One machine only** |
| **Tells you** | Which days he worked, and rough first/last bounds | Session rhythm, gap structure, what the work was, and his own words about where he was going |
| **Cannot tell you** | What he was doing, or where the meetings sat | Anything about the machine you aren't reading |

⇒ **The method is the reconciliation between them.** Git says *a day happened*; transcripts say *what it was*; and the disagreement between two machines' transcripts is what separates a real absence from a phantom one.

---

## Step 0 — Read the calendar before you write anything to it

**Do this first, not last.** Two things come out of it, and both change what you do next.

1. **Learn his conventions from a stretch he logged well.** Ask him which period looks right, then read it. You are looking for block length, title style, how he handles parallel work, and which colors he actually uses.
2. **Find what is already there.** Anything present is either correct, or a divergence worth flagging — but in both cases it is not yours to re-create.

> **Rule:** never create an event before reading the window you are about to write into.
> **Mechanism:** he will ask you to create things he has already created. He is reconstructing from memory across weeks, and memory does not track what got logged.
> **Consequence:** duplicates on a calendar are worse than absences, because he cannot tell which copy is the real one.
> *(2026-09-23: he asked for two Sick Days to be created. Both already existed, identically. A third day he suspected was also already logged.)*

---

## Step 1 — Build the day map from git

This is machine-independent, so it is the one source that sees the whole period. **Fetch first**, or you will miss work pushed from the other machine.

```bash
cd /path/to/Evryn/Code
for d in */; do d=${d%/}; [ -e "$d/.git" ] || continue; git -C "$d" fetch --all --quiet; done

# Commits per local day, across every repo. Enumerate repos dynamically - never a hardcoded list.
for d in */; do d=${d%/}; [ -e "$d/.git" ] || continue
  git -C "$d" log --all --since=<START> --date=format-local:'%Y-%m-%d %H:%M' --pretty=format:"%ad"; echo ""
done | grep -v '^$' | sort | awk '{c[$1]++; if(f[$1]==""||$2<f[$1])f[$1]=$2; if($2>l[$1])l[$1]=$2}
  END {for(d in c) printf "%s commits=%4d  %s -> %s\n", d, c[d], f[d], l[d]}' | sort
```

**Read the output as a skeleton, not as hours.** A day with commits is a day he worked. The first and last commit bound the day loosely — he was usually working before the first one and sometimes after the last.

---

## Step 2 — Extract his real typed turns, on every machine he used

**This is where most of the danger lives**, because a transcript is full of rows that look like Justin and are not.

**What is in a transcript that is not him:** tool results, subagent and sidechain traffic, slash-command echoes, IDE-context wrappers, harness compaction summaries (`This session is being continued from a previous conversation...`), task notifications from heartbeats and monitors, and cross-session messages relayed from other agents.

> **Rule:** count a `type: "user"` row as Justin only when `origin.kind === "human"` (or `origin` is absent, on older transcripts), and additionally drop rows whose text begins with a compaction summary or a peer-message wrapper.
> **Mechanism:** the noisy rows carry real timestamps, so they land inside your timeline like genuine activity. **Task notifications are the worst of them, because a heartbeat fires on a timer whether he is at the keyboard or not** — so they cluster precisely in the hours he was away.
> **Consequence:** a burst of machine rows after a real absence manufactures a block boundary, and you report him working through a gap he spent elsewhere.
> *(2026-09-23: on one desktop day, machine rows outnumbered his real messages 316 to 72. Two blocks were found to open on a compaction summary landing after a long gap.)*

```javascript
// The filter that matters. Everything else is presentation.
if (o.type !== 'user' || o.isSidechain || o.isMeta) continue;
const kind = o.origin && o.origin.kind;
if (kind && kind !== 'human') continue;                       // task-notification, peer, system
const c = o.message && o.message.content;
let text = typeof c === 'string' ? c
  : Array.isArray(c) && !c.some(b => b.type === 'tool_result')
    ? c.filter(b => b.type === 'text').map(b => b.text || '').join('\n') : null;
if (text == null || !text.trim()) continue;
const s = text.trim();
if (/^<(command-name|local-command|command-message|bash-input|ide_opened_file|ide_selection|task-notification|system-reminder)/.test(s)) continue;
if (/^This session is being continued from a previous conversation/.test(s)) continue;  // harness
if (/^Another Claude session sent a message/.test(s) || /^<cross-session-message/.test(s)) continue;  // peer
```

**Then group his turns into blocks separated by idle gaps.** A gap threshold of **25 minutes** works well. Anything much longer hides the meetings you are trying to find; anything much shorter fragments a normal working rhythm into noise.

> **Rule:** use the same gap threshold on every machine.
> **Mechanism:** a 40-minute meeting is a visible gap at a 25-minute threshold and invisible inside a block at a 60-minute one.
> **Consequence:** mixed thresholds mean you systematically find meetings on one machine and miss them on the other, and the result looks internally consistent.

**Transcripts live under `~/.claude/projects/<project-slug>/*.jsonl`.** Read timestamps out of the file contents, never from file mtimes — a session that spanned three days has one mtime.

---

## Step 3 — Reconcile the machines against each other

**There are two machine roots and both are usually live.** Run Step 2 on each, then lay the two timelines side by side.

> **Rule:** before calling any gap an absence, confirm the other machine was also quiet.
> **Mechanism:** he switches machines mid-day without remarking on it. A silent stretch on one is frequently a busy stretch on the other.
> **Consequence:** you invent free time he did not have, and the error is invisible because the timeline you are holding looks complete.
> *(2026-09-23: two desktop gaps on one day, together nearly three hours, were laptop work. On another day the reverse: a 106-minute laptop gap was desktop work in a different lane.)*

**If you cannot reach the other machine, get an agent on it.** Cross-machine session messaging works when Remote Control is on; without it you will only see sessions on your own machine, and a peer list that looks complete will simply omit the other machine entirely. **Names differ between the two sides** — a session reports one name for itself and appears under another in your listing — so identify a peer by asking it for `echo $HOME` and its hostname, not by the name someone passed you.

### A negative result needs a control in the same run

> **Rule:** when you report that a day has no activity, run a known-busy day through the identical query and report its count alongside.
> **Mechanism:** a query that failed to execute, pointed at the wrong path, or filtered too tightly returns **exactly** what a genuine absence returns — an empty result and a success code.
> **Consequence:** "he did not work that day" is the single most consequential claim in this whole exercise, and it is the one your instrument is least able to distinguish from its own failure.

---

## Step 4 — Derive the start of the day

**His first typed message is not when he started.** Two things reliably precede it.

1. **Reading and composing.** If the first message is long, and especially if it answers a substantial output from the night before, he spent real time reading before he typed. Size it from the length of what he was replying to and the length of his reply. A short opener needs almost no allowance; a several-thousand-character reply working through a stack of overnight reports can be an hour.
2. **About 15 minutes of getting underway** — email, working out the day. **This goes on top, as its own block.**

> **Rule:** start the day at (first typed message) minus (read-and-compose estimate) minus 15 minutes.
> **Provenance:** the 15 minutes and the separate-block form are Justin's, 2026-09-23. His own logged entries call it "Orienting", "Getting oriented", "Setting up priorities for the day" or "Organizing the day, email, etc.", at 15 to 60 minutes.

**Say in the event description when a block is derived rather than observed.** A reader months later cannot otherwise tell which times came from a timestamp and which from your arithmetic.

---

## Step 5 — Draft, put it in front of him, then write

**Present the whole plan before creating anything.** He will correct category calls and catch inferences you could not test — and a wrong block costs more to remove than to never create.

> **Rule:** create only. Never modify or delete an event he made.
> **Mechanism:** where your reconstruction disagrees with something he logged, **both readings are worth having** — his records what he intended, yours records what the evidence shows.
> **How to mark a divergence:** create a parallel event with **` - REPLACEMENT`** appended to the title, and explain the conflict in the description. He decides which survives.
> *(Justin's instruction, 2026-09-23.)*

### 🔴 MARK EVERYTHING YOU CREATE, IN TWO PLACES — they do different jobs

> **1 · `[CC]` at the END OF THE TITLE. On every event, no exceptions.** *(Justin's convention, 2026-09-23.)*
> 🔑 **This one is for HIM, at a glance, months later.** **In his words: *"so if it's wrong I can be like 'oh, Claude just did that — that was wrong.'"*** ⇒ **He should never have to open an event, or run a search, to learn that an agent put it there.**
> ⚠️ **`CC` deliberately, not your instance name.** **The agent that made it will be long gone and its naming scheme may have changed entirely** — so a tag naming *which* agent makes him search for a name he has no reason to remember. **The question he is actually asking is "did a human or a Claude do this?", and `[CC]` answers exactly that.**
>
> **2 · A dated instance tag in the DESCRIPTION** — `[ACcal-2026-09-23]` or whatever yours is.
> **This one is for MACHINE cleanup:** it identifies one batch precisely, so an undo pass can remove exactly what one run created and nothing else.
>
> ⚠️ **AN OUT-OF-OFFICE EVENT CANNOT HAVE A DESCRIPTION, so the title tag is the ONLY mark it can carry.** **That is the strongest argument for the title convention and the reason it is not redundant with the body tag.**

**Make the write idempotent.** Check for an event with the same title at the same start before creating it, so a re-run adds nothing.

### The credential trap, which will cost you a session if you meet it cold

> **Rule:** **test with one harmless event before writing a batch.** If it fails with an insufficient-scope error, **stop and go to Apps Script — do not spend the session chasing the connector.**
> **Consequence of not testing:** you write a partial batch into a live calendar and then cannot clean it up, because delete needs the scope you just discovered you lack.

**What is established, 2026-09-23, and it is narrower than it first appeared:** turning on calendar write access in the connector settings **did not reach a live session, and did not reach a freshly-spun one either.** Both failed identically at Google with `Insufficient scope`, naming `calendar.events`.

⚠️ **The tempting explanation — "a session gets its credential at startup, so spin a fresh one" — was tested and is FALSE.** It is worth naming because it is the obvious hypothesis, it sounds mechanical and correct, and acting on it costs a whole round trip through another agent.

✅ **WHAT DOES FIX IT, TESTED THE SAME DAY: JUSTIN DISCONNECTS AND RECONNECTS THE GOOGLE CALENDAR CONNECTOR.** Write worked immediately afterwards **in the same session, with no re-spin** — and **read survived it**, which was the specific thing he was afraid of when he hesitated. ⇒ **Ask him to do that. It costs him about a minute and it is the real repair.**

✅ **The fallback, if he would rather not touch the connector: Google Apps Script.** It runs as him inside his own account, so connector scopes are irrelevant to it. It sets colors, it can delete and modify, and it costs one paste and one click.

📌 **An out-of-office event creates fine — but it CANNOT CARRY A DESCRIPTION.** *(Isolated by elimination, 2026-09-23.)* **The API refuses with a bare `Invalid argument` that names no field**, so the natural reading — *"it won't let me create an OOO event"* — is wrong, and acting on it sends you to a fallback you do not need.

> **The trade this forces, on a day logged as out-of-office:** you can have **the type** (so it matches his other Sick Days and shows as away) **or the evidence** (why you concluded he was out), **not both.**
> ⚠️ **And if you are marking a batch for later cleanup, no description means no marker — an undo pass cannot find that event.**
> ⇒ **Ask him which he wants rather than choosing.** **Default to the ordinary event with the evidence**, since the whole point of a reconstruction is that a later reader can check it.
> *(Apps Script's `CalendarApp` cannot set the type at all — a limit of that path, not of the API.)*

### Two things that make a bulk write survive contact

> **Rule:** in Apps Script, build every `Date` from a string carrying an **explicit UTC offset** — `'2026-09-04T09:30:00-07:00'`, never `'2026-09-04T09:30:00'`.
> **Mechanism:** a bare datetime string is parsed in the **script project's** timezone, which is a separate setting from the calendar's and is not reliably Pacific.
> **Consequence:** every event shifts by a fixed number of hours, and **nothing looks wrong** — the blocks are all present, all the right length, and all in the wrong place. It is the one error a reader cannot spot by glancing at the result.
> **Also log both timezones at the start of the run**, so a mismatch is visible rather than inferred. *(Caught by ACch, 2026-09-23, before the script was run.)*

> **Rule:** make the write idempotent and print a created / skipped / failed tally.
> **Mechanism:** a bulk run is rarely clean the first time — an authorization prompt interrupts it, it times out partway, or one event gets tweaked and the whole thing is re-run.
> **Consequence:** a plain create-loop silently produces a second copy of everything, and the calendar gives no warning at all. **Dozens of duplicates are far more work to remove than they were to create.**

---

## Justin's calendar conventions

**His work time-log lives on `justin@evryn.ai`.** His Personal calendar is family and household, with its own unrelated color scheme — **read it for context about where a gap went, but never write to it and never copy its events across.**

**Colors, as he actually uses them.** Six of the eleven appear on his work calendar; the rest are defined but unused.

| Color | Label | In practice |
|---|---|---|
| Graphite | **Ops** | The default for most work — agent and team infrastructure, the manuals, the runtimes, legal and admin |
| Blueberry | **Product Design/Build** | The product itself: the codebase, deploys, refactors |
| Basil | **Protect the Helm** | Strategy and team consolidation work |
| Tangerine | **Ignite Demand** | Growth, demand, the website, work on specific relationships |
| Tomato | **Meeting** | Meetings with people, titled by participants |
| Flamingo | **Peri-meeting** | Prep and fallout around a meeting |

**Exclusions.** *Personal/Family* and *Nurturing Productive Capacity* are outside the work-hours picture and stay out of it. *(His instruction to an earlier AC, 2026-09-07, and repeated 2026-09-23. Nurturing Productive Capacity is his reminder to take walks and exercise, and he has largely stopped logging it.)*

**Granularity.** One or two blocks at a time, often very long — four to ten hours is normal. **He does not want quarter-hour slices**; the log has to stay readable months later.

**Parallel lanes overlap deliberately.** When he runs two lanes at once he logs two blocks covering the same hours in different colors. **Reproduce that rather than flattening the day** — it is an accurate picture of how he works.

**Titles are specific.** "Cleaning up Soren Consolidation and Lucas #sweep", not "team work".

---

## Traps that produce confident wrong answers

**A keyword search finds strings, not facts.** Searching his messages for *meeting*, *call*, *lunch* or *flight* surfaces candidates and nothing more: a project named "the Meta Meeting" is not a meeting he attended, and *in flight* matches *flight*. **Read every hit in context before it becomes an event.** The reliable signals are first-person and present-tense — *"I'm meeting with X in a few minutes"*, *"I need to go to dinner now"*, *"I'm stepping away, I'll be gone about 20 minutes"*.

**"Meetings" may not mean people.** He runs many Claude sessions, and moving between them reads in his own words as going to meetings. **Ask before coloring one as a meeting.** *(2026-09-23: "I just came back from being in a bunch of other meetings" meant sessions. The gap was work on the other machine, in a different lane.)*

**His own logged blocks can be wrong, usually by overstating continuity.** A block claiming ten unbroken hours of one kind of work will sometimes contain a two-hour hole. **Check his entries against the evidence rather than treating them as ground truth** — that is a large part of the value here.

**Some days are genuinely personal.** He may have been doing something he would rather not have described in a calendar description that persists and can be shared. **Ask what he wants logged rather than deciding, and keep health and personal specifics out of event descriptions entirely.**

**A line count is not a completeness check.** Confirm a full read with the bottom canary, not with a number.

---

## Breadcrumbs

- `_evryn-meta/.claude/agents/ac.md` points here from its tooling section.
- Anything durable this exercise teaches about **how Justin works** belongs in `ac.md`, not in this file. This one holds the method.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
