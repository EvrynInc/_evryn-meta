# Full Startup Context Cascade — `evryn-team-runtime`

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the **self-sufficient load list** for doing *or directing* build-level work on **`evryn-team-runtime`** — the founding team's autonomous runtime (ADR-050). Load the **Light Startup Context Cascade** (in `CLAUDE.md` — CLAUDE.md + `current-state.md` + the Hub) first, then execute this file **top to bottom, in order.** You should be able to do your entire full load from this file alone.
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

Steps 1–4 are the intended shape + the shipped record; steps 5–6 are the actual runtime, both halves. **The whole set (1–6) is must-load and not subject to your unilateral override** — you never trim it because a file "looks irrelevant." In this runtime that instinct is almost always wrong: the irrelevant-looking file is where the seam-bug hides (see ARCHITECTURE → "why local reasoning often fails here"), and *"this change is small / self-contained"* is exactly the judgment this gate exists to override.

1. **`evryn-team-runtime/docs/ARCHITECTURE.md`** — the intended shape + cardinal invariants + "**Why local reasoning often fails here — and why you must load BOTH halves.**" *(Soren owns of record.)*
2. **The Current Sprint Doc** — currently **`evryn-team-runtime/docs/SPRINT-team-runtime-memory.md`** — the tracker = **live status source of truth** (every build item + finding, by tier). Read it for *where the work is now*. ⚑ Confirm against `current-state.md`.
3. **Key ADRs:** `_evryn-meta/docs/decisions/050-team-runtime-sdk-mains-worker-tier.md` (the foundational decision) + `_evryn-meta/docs/decisions/052-team-runtime-memory-wake-economics.md` (the memory decision record; terse).  
4. **Skim two changelogs** (top ~100 lines newest-first + `## <date>` section headers): **`evryn-team-runtime/CHANGELOG.md`** (recent runtime ships `current-state` can lag) **and `_evryn-meta/CHANGELOG.md`** (the **meta** changelog, read by every AC on load — changes to your operating manual, the protocols, and the cascades).
5. **Runtime — CODE half** (live-enumerate; read every file IN FULL):
   ```bash
   git -C evryn-team-runtime ls-files src migrations
   ```
   - **`src/**/*.ts`** — EVERY file (~36 as of 2026-07-21; enumerate live — the tree grows). Never "the relevant bits": every real defect lives in a *seam* — a value minted in one file, stored in a second, given meaning by a third — which a partial read cannot see.
   - **`migrations/*.sql`** — EVERY migration (001–015 as of 2026-07-21). The DB shape is half the contract; `src/db/types.ts` is hand-maintained against these.
   - **`tests/`** — skim for shape (what's pinned, what's a real catcher). Not a full read, but know what the suite guards.
6. **Runtime — IDENTITY half** (the always-composed layer + the LIVE agent(s)):
   - **Team manual + runtime-ops (composer layer 1):** `evryn-team-workspace/CLAUDE.md` + `evryn-team-workspace/shared/protocols/runtime-ops.md`. `runtime-ops.md` is the agents' operative behavior doc (thread navigation, listen-permission, memory-discipline, standing gates) — composed into **every** wake, so it's must-load, always.
   - **The LIVE agent's definition + memory:** currently **Lucas only** — `evryn-team-workspace/.claude/agents/lucas.md` + `evryn-team-workspace/.claude/agent-memory/lucas/MEMORY.md` (confirm its bottom canary — memory files truncate silently). The runtime runs Lucas today; his identity **is** live behavior. (Grows to the other mains as they stamp on — Phase 3.)

## Load DEPENDING ON THE WORK (situational — ADD the ones your task hits; never TRIM the must-load set)

Judgment here is only ever about what to **add on top** of must-load. When in doubt, add it.

- **Memory / composition / digest / wake work** — *the active lane, so effectively required right now* → the design-of-record IN FULL: `evryn-team-workspace/shared/projects/ops/team-runtime/2026.07.15-acf-team-runtime-memory-architecture.md` (ADR-052; revised several times — read the top stamps first; it exceeds one Read-call cap, page it to the canary).
- **Fleet-wide / multi-agent design** (behavior *across* mains) → the OTHER agent definitions + memories: `find evryn-team-workspace/.claude/agents -name '*.md'` (8 total: `dominic · emma · lucas · marlowe · mira · nathan · soren · thea`) + their `agent-memory/*/MEMORY.md`.
- **Skill-composition work** → the registry skill protocol docs named in `src/config/skills.ts` (read `config/skills.ts` for the live registry — it, not this line, is the source of truth).
- **Harness-architectural "why is it shaped this way"** → design v2: `evryn-team-workspace/shared/projects/ops/team-runtime/2026.07.10-acf-justin-team-runtime-design-v2.md`.
- **Harness module-contract questions / the original harness build-record** → `evryn-team-runtime/docs/BUILD-PHASE-1.md`.
- **Per-agent voice / spoke work** → the `_evryn-meta/docs/hub/*` spokes the agent's `config/agents.ts` entry names (Lucas → `vision-and-ethos.md`). The Hub itself (layer 2) is already in the Light cascade.

## ⚑ Flag rule

If **anything** looks off as you load — a doc contradicts `current-state`, the code composes a layer the docs don't know about, an identity file instructs a tool the runtime no longer exposes, the tracker says "todo" for something already in `src/`, a doc recommendation is stale, a link is broken — **surface it to Justin. Never silently resolve it.** In this runtime the divergence is usually exactly the thing that was about to bite.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
