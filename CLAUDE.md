# CLAUDE.md — the agent router

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, this file loaded incomplete — re-read it before doing anything.

**THIS FILE IS A ROUTER. IT IS NOT AN OPERATING MANUAL, AND IT IS NOT ENOUGH TO WORK FROM.** It exists to send you to your real manual and to do nothing else.

**Why you are reading it:** the harness auto-injects this file into *every* agent it spins in this workspace — AC, DC, QC, OC, team agents, and generic subagents alike — regardless of which one you are. So it has to be small, stable, and true for everyone.

---

## 🔴 THE ONE HARD RULE

> *"if your agent identity doesn't load, STOP — you're not authorized to do **ANYTHING** — just report the failure."*
>
> — Justin

That is the whole safety floor, and it is deliberately not a checklist. **An agent that cannot act without its identity cannot act *dangerously* without it either.** Do not work around it, do not partially proceed, do not substitute your own judgment for the manual you failed to load. Report the failure and stop.

---

## Which agent are you?

Your spinner tells you which agent you are. Find your row, read that file **in full**, and follow it faithfully before anything else.

| If you are… | Your operating manual is |
|---|---|
| **AC** (Architect Claude) | `_evryn-meta/identity/ac.md` |
| **DC** (Developer Claude) | `evryn-dev-workspace/CLAUDE.md` |
| **QC** (Quality Claude) | `evryn-quality/CLAUDE.md` |
| **OC** (Operations Claude) | `evryn-ops/CLAUDE.md` |
| **A founding-team agent** (Lucas, Soren, Mira, Emma, Marlowe, Thea, Nathan, Dominic) | split across `evryn-team-workspace/CLAUDE.md` + `.claude/agents/<name>.md` + `.claude/agent-memory/<name>/MEMORY.md` — your spinner names all of them |

**Paths are rooted at the shared parent directory** that holds every Evryn repo as a sibling folder — so `evryn-quality/CLAUDE.md` means *"go up out of whatever repo you are in, into the sibling `evryn-quality`."*

### If your brief did not tell you which agent you are

You are a **generic subagent**: you have no identity file, and the hard rule above has nothing to load. That is a legitimate state for exactly one kind of work — a narrow mechanical lookup (a file path, a line count, a grep) where nothing downstream rests on your judgment. **Do that task and nothing more.** You may not review, build, spec, summarize a document, or make any claim about how the system behaves. If your task requires any of those, **stop and report that you were spun without an identity** — that is a briefing error, and proceeding is the failure the hard rule exists to prevent.

⚠️ **This is not a hatch you may take by choosing it.** If your brief names an agent, that is your identity and the hard rule applies.

---

## How to load your manual

1. **Read it from disk, in full, yourself.** Do not work from any version of it you believe you already have.
2. **Confirm its bottom truncation canary** — the last line should read `FULL FILE LOADED`. If it is missing, your load is partial: re-read in sections until you have the whole file. *(One known exception: `evryn-ops/CLAUDE.md` has no canary; its true final line is `---`.)*
3. **Then execute its Context Discipline section** before starting work.

🔴 **Do not trust the auto-injected copy of THIS file either.** The injection has been observed serving a stale snapshot — content committed hours earlier was missing from it. **The file on disk governs.** This router is kept deliberately tiny and near-static so that a stale copy of it is still a correct copy; everything that changes lives behind it, in the manuals.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
