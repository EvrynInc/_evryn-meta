# Conductor Startup Context Cascade — the default load for AC-when-conducting

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the cascade for **AC when it is *conducting* a build (directing DC/QC/lane-ACs) rather than hands-on building** — and cannot afford the whole runtime resident in its own context. It is one option in `_evryn-meta/CLAUDE.md`'s cascade router. It applies to **any** build: the per-build full cascade (`full-product-cascade.md`, `full-team-runtime-cascade.md`, …) defines *what the scout loads*; this file defines *how the conductor stays light while still being competent.*
>
> **Owner: AC.** Edits need Justin's approval (propose first).
>
> **Status: NEW (Justin, 2026-07-17), for the AC-under-AC era; being trialed. Not yet battle-proven — if the scout's map turns out thin or misleading, fall back to the Full cascade and flag it.**

---

**Why this exists.** The full cascade loads the entire runtime (`src/**/*.ts` + the identity half), which can completely use up your context. This cascade keeps the runtime in a *subagent's* context and leaves you a map + a targeted read-list.

**It is NOT a license to conduct blind.** *"Directing build work is build work"* (Context Discipline) still holds — gating a runtime change or sending a brief you can't defend has the same blast radius as bad code. This cascade is the *mechanism* for getting that runtime competence efficiently — a scout + targeted reads + fresh verification subagents — instead of a full resident load. It tells you *which* files are load-bearing and *when*, so you read the right ones, not all of them. **You still read the load-bearing files yourself, at their moment.**

**The sequence:**

1. **Load the build's Full Startup Context Cascade (the per-build file in this directory) only *without* the runtime.**
2. **Read the map of the work YOURSELF** — your active handoff + your active lane briefs (when applicable), in full. These define the work in front of you; they're small, and you cannot conduct or gate from a subagent's summary of a source-of-truth doc (the "be wary of subagents reading load-bearing docs" rule — read these yourself). This is also what lets the scout's read be *work-oriented* rather than a generic tour.
3. **Spin the Runtime Scout — it IS the orchestration protocol's *reporter* AC-subagent** (`docs/protocols/ac-orchestration-protocol.md` → "Spinning an AC subagent": *a meta-level AC needing a map of a domain it can't afford to load itself*). Don't grep just for this section or you'll miss the supporting info — you must read the whole protocol to understand it. **Spin the subagent strictly per that protocol** — the AC-variant tagged brief, the load-gate, the model pin, and verifying its two-part receipts on return are all the protocol's job; do NOT restate that machinery here. This section adds only what's specific to *this* use — the two fixed choices, the load, and the return format:
   - **Tier = FULL · model = Opus.** The scout makes claims about runtime behavior, so the protocol's tier rule forces the **Full Startup Context Cascade** with the **entire** runtime (**both halves**); Opus is the identity-bearing-AC default.
   - **Its load = the build's Full-cascade file set (the per-build file in this directory — your source, so it can't drift), resolved to exact files.** Both runtime halves enumerated LIVE (the code half AND the identity half separately — the enumeration trap), plus `CLAUDE.md` · `current-state.md` · the active handoff · the active lane briefs (so its read is *work-oriented*, not a generic tour). You assemble + name every file with its line span — the protocol's part-2 discipline, not something to shortcut.
   - **Return, structured:**
     1. **Work-oriented runtime map** — a tight summary of the runtime *as it bears on the lanes / critical path in front of you* (e.g. *"XYZ rewrites the verdict tool surface across these files; the identity files still instruct the OLD surface — here's the collision set"*). Not a generic tour.
     2. **READ NOW** — the files you must read yourself to be competent for the *immediate* work, each with a reasonably concise why (+ line-spans where a file is large and only part matters).
     3. **READ BEFORE `<milestone>`** — files keyed to specific upcoming beats (*"before a merge-gate re-check: X, Y"; "before a staging live-fire: A, B"*), so you pull them at their moment, not all up front. Strongly consider writing these into your working/session doc/brief as soon as you have this, to remind you at the right moment.
     4. **⚠ Surprises / contradictions** — anything it noticed reading both halves *together* that you would want flagged: a spec-runtime mismatch, a stale doc, a landmine. *(This is the identity-as-runtime dividend — a scout reading both halves catches what a `src`-only read never could.)*
     5. **Deliberately skipped** — substantive material it did NOT flag, and why, so you know the coverage boundary (no silent gaps).
   - **The scout returns a MAP, never a substitute for your own reading.** Treat its summary as *routing*, not knowledge; distinguish what it *found* from what it *recommends*, and verify any load-bearing claim against the artifact before acting on it. It's a fresh full-load instance — cheap to re-spin if the map reads thin.
4. **Load the scout's READ-NOW list directly.** Hold the map + the READ-BEFORE list + the surprises as your working map. Conduct; pull READ-BEFORE files at their milestone.

**Important: until you have gotten the subagent's report back and have loaded the READ-NOW list, you have not completed your load-in - so there's no point in beginning your work until you have read these files. Beginning before this will have you working in the dark — usually not even the profound depth of your ignorance of what you're working on.**

**For a deep verification moment** — the classic being an independent runtime-vs-identity re-check at a merge gate — do NOT load the whole runtime to do it. Spin a **fresh full-load review subagent** (a QC, or an AC reviewer — per the same protocol) to run the verification and return a verdict you **independently weigh** (and read the specific handful of files it names yourself). A fresh subagent is *also* cleaner for the "independent eyes" requirement than re-using your own already-anchored context. Same discipline: its verdict is a claim to verify, not a fact to file.

**The payoff.** The AC-under-AC model doubles as the context-budget strategy — the lane/scout carries the territory; the conductor stays light enough to last the whole build. When you feel the runtime pulling into your own context, ask whether a subagent should hold it instead.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
