# Full Startup Context Cascade — `evryn-team-runtime`

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the **self-sufficient load list** for doing *or directing* build-level work on **`evryn-team-runtime`** — the founding team's autonomous runtime (ADR-050). Load the **Light Startup Context Cascade** (`_evryn-meta/.claude/agents/ac.md`) first, then execute this file **top to bottom, in order.** You should be able to do your entire full load from this file alone.
>
> **When Justin calls this cascade, load every step IN FULL — the must-load set (§ "The load") is non-negotiable.** He invokes it only when the work needs the heavy load; there is nothing for you to trim or defer. If a step looks unneeded, flag it (⚑ below); don't silently drop it.
>
> **Owner: AC.** Edits need Justin's approval (propose first). Keep it in lockstep — when the runtime grows a half (a new agent, a new composed layer, a new build/sprint doc), update this list, because a stale cascade silently under-loads.

---

## What you're loading, and why it's shaped this way

`evryn-team-runtime` runs each of the 8 founding-team agents as a series of **wakes**: the runtime composes a fresh prompt from files (identity + memory + conversation + ambient context), the agent acts, the wake ends. **Its behavior is half `src/` and half the files it composes** — so you load both halves, and you load them *after* the intended-shape docs (ARCH → SPRINT → ADRs), so the runtime reads as a **diff against intent** and divergences pop.

**⚠️ THE IDENTITY HALF is the one everyone under-loads here** — because for the team runtime the identity files don't live in this repo and don't look like "runtime": **the agent definitions, the agent memory, the team manual, and the composed skills ARE the judgment runtime.** An instruction in `lucas.md` or `runtime-ops.md` programs Lucas's behavior as surely as a line of `src/` code — what he does, which tools he calls, what he must never do. Design or review the runtime without the identity half and you get **invisible drift**: the docs tell an agent to call a tool the code no longer exposes, or the code composes a layer the docs don't know about — costing extra reasoning every wake and making behavior unpredictable. *(The canonical "an identity instruction is runtime" statement + the `record_pass` example live in `product-full-cascade.md`.)*

**🔴 The enumeration trap:** `git ls-files src` / `find src -name '*.ts'` **cannot** return an identity file — enumerate **BOTH** halves separately, every time. The authoritative definition of the identity half is **`src/composer/layers.ts`** (the code that decides what composes into a wake) — **read the composer to learn the real list** rather than trusting the snapshot below; it drifts as layers are added.

---

## Before loading

- **Confirm WHICH runtime state you're loading** (branch/worktree). `src/` on `main` is the *shipped* shape; in-flight build work lives on feature branches / worktrees and can differ in load-bearing ways. It it's ever unclear, resolve it before loading, and then always tell Justin explicitly which state you loaded.
- **Honor each doc's own Required Context.**

## The load — IN ORDER (intended shape first, runtime last)

Steps 1–5 are the intended shape + the shipped record; steps 6–7 are the actual runtime, both halves. **The whole set (1–7) is must-load and not subject to your unilateral override** — you never trim it because a file "looks irrelevant." In this runtime that instinct is almost always wrong: the irrelevant-looking file is where the seam-bug hides (see ARCHITECTURE → "why local reasoning often fails here"), and *"this change is small / self-contained"* is exactly the judgment this gate exists to override.

1. **`evryn-team-runtime/docs/ARCHITECTURE.md`** — the intended shape + cardinal invariants + "**Why local reasoning often fails here — and why you must load BOTH halves.**" *(Soren owns of record.)*
2. **The active build spec** — the team-runtime's build is two-part: the **current active build spec** is the memory + wake-economics **design-of-record** (`evryn-team-workspace/shared/projects/ops/team-runtime/2026.07.15-acf-team-runtime-memory-architecture.md`, ADR-052) — the spec for the in-flight Phase-1 memory build; read it **IN FULL** (revised several times — read the top stamps first; it exceeds one Read-call cap, page it to the canary). *(The prior-phase **harness** build-record is `evryn-team-runtime/docs/BUILD-PHASE-1.md` — situational, below.)* ⚑ Confirm the active build in `current-state.md`.
3. **The Current Sprint Doc** — currently **`evryn-team-runtime/docs/SPRINT-team-runtime-memory.md`** — the tracker = **live status source of truth** (every build item + finding, by tier). Read it for *where the work is now*. ⚑ Confirm against `current-state.md`.
4. **Key ADRs:** `_evryn-meta/docs/decisions/050-team-runtime-sdk-mains-worker-tier.md` (the foundational decision) + `_evryn-meta/docs/decisions/052-team-runtime-memory-wake-economics.md` (the memory decision record; terse) + 🔴 **`_evryn-meta/docs/decisions/055-thread-as-complete-record.md`** — **the thread IS the agent's complete record.** *(Added 2026-09-08. **It was missing, and it is the one that bit: SPRINT §H — Steps 68, 69 and 70 — implements ADR-055 in its entirety, so a lane spun on this cascade would not have loaded the decision its own lane exists to build.** Its own §H banner says to read the ADR before scoping any of it, and three of its rejected alternatives have each been proposed more than once.)*
5. **Skim two changelogs** (top ~100 lines newest-first + `## <date>` section headers): **`evryn-team-runtime/CHANGELOG.md`** (recent runtime ships `current-state` can lag) **and `_evryn-meta/CHANGELOG.md`** (the **meta** changelog, read by every AC on load — changes to your operating manual, the protocols, and the cascades).
6. **Runtime — CODE half** (live-enumerate; read every file IN FULL):
   ```bash
   git -C evryn-team-runtime ls-files src migrations
   ```
   - **`src/**/*.ts`** — EVERY file. **Enumerate live; no count is written here on purpose.** *(This line used to say "~36 as of 2026-07-21." It was 41 by 2026-09-08 — a restated completeness claim that went stale with nobody touching this file, which is exactly the shape `ac.md`'s Documentation Approach now bars.)* Never "the relevant bits": every real defect lives in a *seam* — a value minted in one file, stored in a second, given meaning by a third — which a partial read cannot see.
   - **`migrations/*.sql`** — EVERY migration. **Enumerate live; likewise no count.** The DB shape is half the contract; `src/db/types.ts` is hand-maintained against these **with nothing enforcing it** *(SPRINT Step 47 is a live instance: a table created by a migration, asserted at boot, read in the hot path, and absent from the types)*.
   - **`tests/`** — **SKIM for shape** (what's pinned, what's a real catcher). **Not a full read.**
     - 🔴 **THIS LINE IS LOAD-BEARING AND WAS BEING OVERRIDDEN BY THE LANE BRIEFS.** *(Found 2026-09-08.)* **Every `ACT*` lane brief on disk asked for all 63 test files IN FULL — roughly 12,500 lines, larger than `src/` itself — and the load that compacted a lane on 2026-08-19 included them.** ⇒ **The sanctioned cascade never asked for that.** **If a brief you are handed demands a full test read, check it against this line before you obey it.**

   - 🆕 **`evryn-team-runtime/docs/dependency-map.md`** — **the generated structural map** (`npm run depmap`; merged 2026-09-08). **Read it BEFORE the code half, not after** — it tells you what imports what, so the files arrive as a graph rather than a pile. ⭐ **Its five hub files are ~635 lines and are where this runtime's seams run; anyone reading any part of `src/` should hold all five.** ⚠️ **It is an INDEX, never a substitute — it never licenses skipping a file you were given.**
7. **Runtime — IDENTITY half** (the always-composed layer + the LIVE agent(s)):
   - **Team manual + runtime-ops (composer layer 1):** `evryn-team-workspace/CLAUDE.md` + `evryn-team-workspace/shared/protocols/runtime-ops.md`. `runtime-ops.md` is the agents' operative behavior doc (thread navigation, listen-permission, memory-discipline, standing gates) — composed into **every** wake, so it's must-load, always.
   - 🆕 **The TEAM CURRENT-STATE (composer layer 3):** `evryn-team-workspace/shared/current-state/current-state.md`. 🔴 **Composed IN FULL, NEVER windowed, NEVER elided — Justin's explicit ruling, enforced at `src/composer/layers.ts:9-10`.** *(Added 2026-09-08: **this layer was missing from this list entirely.** At ~800 lines it is the single largest file in the identity half, so anyone estimating a wake's composed size from this cascade was low by roughly that much.)*
   - **The LIVE agent's definition + memory:** currently **Lucas only** — `evryn-team-workspace/.claude/agents/lucas.md` + `evryn-team-workspace/.claude/agent-memory/lucas/MEMORY.md` (confirm its bottom canary — memory files truncate silently). The runtime runs Lucas today; his identity **is** live behavior. (Grows to the other mains as they stamp on — Phase 3.)
   - **That agent's SPOKE (composer layer 4)** — the `_evryn-meta/docs/hub/*` file its `src/config/agents.ts` entry names *(Lucas → `vision-and-ethos.md`)*. ⚠️ **This is a COMPOSED LAYER on every wake, not situational reading** — it appears again under "situational" below for *voice/spoke work*, which is a different and larger task. **The Hub itself (layer 2) is already in the Light cascade, so it is covered — but do not mistake that for the spoke.**

> ### ✅ THE FULL COMPOSED SET, so this list can be checked against the code rather than trusted
> **`src/composer/layers.ts` is the authority.** Its file-backed layers are: **L1** team manual + `runtime-ops.md` · **L2** the Hub · **L3** the team current-state · **L4** the agent's spokes · **L5** the agent definition · **L6** its `MEMORY.md` · **L7/L8** the skills registry named in `src/config/skills.ts`. ⇒ **If a layer above is not in step 7 or accounted for elsewhere in this cascade, this cascade is very likely wrong — pause and announce rather than working around it.** *(That check is what found L3 missing.)*

## Load DEPENDING ON THE WORK (situational — ADD the ones your task hits; never TRIM the must-load set)

Judgment here is only ever about what to **add on top** of must-load. When in doubt, add it.

- *(**Memory / composition / digest / wake work** — the design-of-record is now **step 2** in the ordered load above, since it's the current active build spec. Load it there, in full.)*
- **Fleet-wide / multi-agent design** (behavior *across* mains) → the OTHER agent definitions + memories: `find evryn-team-workspace/.claude/agents -name '*.md'` (8 total: `dominic · emma · lucas · marlowe · mira · nathan · soren · thea`) + their `agent-memory/*/MEMORY.md`.
- **Skill-composition work** → the registry skill protocol docs named in `src/config/skills.ts` (read `config/skills.ts` for the live registry — it, not this line, is the source of truth).
- **Harness-architectural "why is it shaped this way"** → design v2: `evryn-team-workspace/shared/projects/ops/team-runtime/2026.07.10-acf-justin-team-runtime-design-v2.md`.
- **Harness module-contract questions / the original harness build-record** → `evryn-team-runtime/docs/BUILD-PHASE-1.md`.
- **Per-agent voice / spoke work** → the `_evryn-meta/docs/hub/*` spokes the agent's `config/agents.ts` entry names (Lucas → `vision-and-ethos.md`). The Hub itself (layer 2) is already in the Light cascade.
- 🔴 **RE-OPENING A SETTLED QUESTION, or hitting one this repo has already studied → `evryn-team-runtime/docs/research/`.** *(Added 2026-08-17. **This directory existed for four days with nothing in the loading path naming it** — which is exactly the failure it was created to prevent: research nobody can find is research nobody has.)*
  - **`2026.08.12-acfsq-team-runtime-sdk-sessions.md`** — why the agents have **no SDK session** and what we are building instead. **Read it before proposing sessions, a per-wake transcript, or anything that touches what an agent carries between wakes.** It is cited by **ADR-052's amendment** and **SPRINT Step 65**, and its §11/§13 are the origin of **ADR-055**. ⚠️ **Its §13.4 was superseded by ADR-055 — the "pointers, never payloads" conclusion is wrong; read the ADR alongside it.**
  - **`2026.08.11-acfc3t-team-runtime-test-coverage-map.md`** — a full read of all 56 test files: what is *executed* versus merely *asserted in source*. **The evidence base under SPRINT Steps 26, 43, 45, 51 and 73.** ⚠️ **Step 73 carries an open obligation to SAMPLE it — one lane already corrected three of its claims and nobody checked the rest.** Treat a specific claim as a lead until verified.

## ⚑ Flag rule

If **anything** looks off as you load — a doc contradicts `current-state`, the code composes a layer the docs don't know about, an identity file instructs a tool the runtime no longer exposes, the tracker says "todo" for something already in `src/`, a doc recommendation is stale, a link is broken — **surface it to Justin. Never silently resolve it.** In this runtime the divergence is usually exactly the thing that was about to bite.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
