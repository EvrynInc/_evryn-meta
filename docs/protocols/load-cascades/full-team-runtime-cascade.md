# Full Startup Context Cascade — `evryn-team-runtime`

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the **per-build full cascade** for anyone doing *or directing* build-level work on **`evryn-team-runtime`** — the founding team's autonomous runtime (ADR-050). It is the `evryn-team-runtime` branch of `_evryn-meta/CLAUDE.md`'s cascade router: **load the Light Startup Context Cascade (in CLAUDE.md) first, then this.** This file is a **reference** (a precise load list), not an explanation — the *why* of each doc lives in the doc itself. **The universal full-cascade PRINCIPLES** — every agentic system has two halves, the enumeration trap, "when Justin calls the full cascade it is non-negotiable — do not trim it," verify-at-claim-is-additive-not-a-substitute — **live in CLAUDE.md and govern this load; this file is the team-runtime FILE LIST that those principles apply to.**
>
> **Owner: AC.** Edits need Justin's approval (propose first). Keep it in lockstep with the runtime — when the runtime grows a half (a new agent, a new composed layer, a new build doc), update this list, because a stale cascade silently under-loads.

---

## What you're loading, and why it's shaped this way

`evryn-team-runtime` is the autonomous harness for Evryn's 8 founding-team agents (Lucas, Soren, Emma, Mira, Marlowe, Nathan, Dominic, Thea). It runs each agent as a series of **wakes**: the runtime composes a fresh prompt from files (identity + memory + conversation + ambient context), the agent acts, the wake ends. **That composition is the thing to internalize: the runtime's behavior is half `src/` and half the files it composes.**

**⚠️ THE TWO HALVES — and for the team runtime, the identity half is the one everyone under-loads.** For the Evryn *product*, we tell people to read Evryn's identity files (`evryn-backend/identity/`). For the team runtime the analog is easy to miss because the identity files don't live in this repo at all and don't look like "runtime": **the agent definitions, the agent memory, the team manual, and the composed skills ARE the judgment runtime of this system.** An instruction in `lucas.md` or `runtime-ops.md` programs Lucas's behavior as surely as a line of `src/` code — what he does, which tools he calls, what he must never do.

**If you design or review the runtime without reading the identity half, you get drift you cannot see:** the agent instructions and the runtime code start to fight — the docs tell an agent to call a tool the code no longer exposes, or the code composes a layer the docs don't know exists. Drift like that costs **extra reasoning every wake** (the agent burns tokens reconciling a contradiction) and makes behavior **unpredictable** (conflicting instructions resolve differently wake to wake). *(Justin, 2026-07-21: "those ARE the identity files for these agents, and they function as runtime — if we're not reading those as we design the runtime, we get drift that makes the agent instructions and the runtime fight.")*

**🔴 The enumeration trap (do not fall into it):** `git ls-files src` / `find src -name '*.ts'` **cannot** return an identity file — so every "enumerate the runtime live" recipe silently omits the identity half unless you enumerate it **separately**. Enumerate *both* halves, every time. And the authoritative definition of the identity half is **`src/composer/layers.ts`** — it is the code that decides what composes into a wake, so **read the composer to learn the real list rather than trusting the snapshot below**; the snapshot will drift as layers are added.

---

## MUST-LOAD — every full-cascade load of this runtime (non-negotiable; do NOT trim)

This set **does not vary by task.** The "punishes local reasoning" property (see ARCHITECTURE → "Why local reasoning often fails here") is exactly why: in this runtime, what looks skippable is where the bugs hide.

**Code half — live-enumerate, read every file IN FULL:**
```bash
git -C evryn-team-runtime ls-files src migrations
```
- **`evryn-team-runtime/src/**/*.ts`** — EVERY file (~36 as of 2026-07-21; enumerate live — the tree grows). Never "the relevant bits": every real defect lives in a *seam* — a value minted in one file, stored in a second, given meaning by a third — which a partial read cannot see.
- **`evryn-team-runtime/migrations/*.sql`** — EVERY migration (001–015 as of 2026-07-21). The DB shape is half the contract; `src/db/types.ts` is hand-maintained against these.
- **`evryn-team-runtime/tests/`** — skim for shape (what's pinned, what's a real catcher). Not a full read, but know what the suite guards.

**Identity half — the always-composed layer + the LIVE agent(s):**
- **Team manual + runtime-ops (composer layer 1):** `evryn-team-workspace/CLAUDE.md` + `evryn-team-workspace/shared/protocols/runtime-ops.md`. `runtime-ops.md` is the agents' operative behavior doc (thread navigation, listen-permission, memory-discipline, standing gates) — composed into **every** wake, so it's must-load, always.
- **The LIVE agent's definition + memory:** currently **Lucas only** — `evryn-team-workspace/.claude/agents/lucas.md` + `evryn-team-workspace/.claude/agent-memory/lucas/MEMORY.md` (confirm its bottom canary — memory files truncate silently). The runtime runs Lucas today; his identity **is** live behavior. (Grows to the other mains as they stamp on — Phase 3.)

**Always-live docs:**
- **`evryn-team-runtime/docs/ARCHITECTURE.md`** — intended shape + cardinal invariants + "Why local reasoning often fails here."
- **`evryn-team-runtime/docs/SPRINT-team-runtime-memory.md`** — the tracker = **live status source of truth** (every build item + finding, by tier). Read it for *where the work is now*.
- **ADRs:** `_evryn-meta/docs/decisions/050-team-runtime-sdk-mains-worker-tier.md` (the foundational decision) + `052-team-runtime-memory-wake-economics.md` (the memory decision record — terse).

## LOAD DEPENDING ON THE WORK (situational — ADD the ones your task hits; do NOT default-load all of them)

Judgment here is only ever about what to **add on top** of must-load — **never** about trimming must-load. When in doubt, add it.

- **Memory / composition / digest / wake work** — *this is the active lane, so it's effectively required right now* → the **design-of-record IN FULL**: `evryn-team-workspace/shared/projects/ops/team-runtime/2026.07.15-acf-team-runtime-memory-architecture.md` (ADR-052; revised several times — read the top stamps first; it exceeds one Read-call cap, page it to the canary).
- **Fleet-wide / multi-agent design** (behavior *across* mains, not one agent) → the OTHER agent definitions + memories: `find evryn-team-workspace/.claude/agents -name '*.md'` (8 total: `dominic · emma · lucas · marlowe · mira · nathan · soren · thea`) + their `agent-memory/*/MEMORY.md`. *(For single-agent Phase-1 work the live agent — already in must-load — is enough.)*
- **Skill-composition work** → the registry skill protocol docs named in `src/config/skills.ts` (as of 2026-07-21: `proposal-protocol · writing-protocol · consolidation-protocol · standup-protocol · domain-routing`, under `evryn-team-workspace/shared/protocols/`). Read `config/skills.ts` for the live registry (it, not this line, is the source of truth).
- **Harness-architectural "why is it shaped this way"** → design v2: `evryn-team-workspace/shared/projects/ops/team-runtime/2026.07.10-acf-justin-team-runtime-design-v2.md`.
- **Harness module-contract questions** → `evryn-team-runtime/docs/BUILD-PHASE-1.md` (the build-record for the original harness).
- **Per-agent voice / spoke work** → the `_evryn-meta/docs/hub/*` spokes the agent's `config/agents.ts` entry names (Lucas → `vision-and-ethos.md`). The Hub itself (layer 2) is already in the Light cascade.

## The discipline (why the split is drawn where it is)

The **must-load set is non-negotiable** — you never trim it because a file "looks irrelevant." In this runtime that instinct is almost always wrong: the irrelevant-looking file is where the seam-bug hides, and *"this change is small / self-contained"* is the exact judgment the load gate exists to override. The **situational set is the ONLY place you exercise judgment — and only to ADD.** If you catch yourself deciding what *in the must-load set* to skip, stop: that is the failure mode, not efficiency. When Justin explicitly calls "the full cascade," he means the must-load set in full, no shortcut — plus whatever situational the task hits.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
