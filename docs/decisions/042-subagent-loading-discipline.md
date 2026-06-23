# ADR-042 — Subagent Loading Discipline: Precise-Load, Grep-the-Cascade, Team-Subagent Provision

**Status:** Accepted (2026-06-19)
**Context date:** 2026-06-18 → 2026-06-19
**Supersedes (in part):** the 2026-06-06 "binary rule loads the base cascade reliably" confidence in `ac-orchestration-protocol.md`
**Related:** ADR-009 (dev-pipeline four personas), ADR-041 (M1 silent-death — itself flagged for re-vet because its Soren vet ran lobotomized)

## Context

On 2026-06-17 a five-AC parallel wave (AC1–5) spun DC / QC / Soren subagents that loaded **only** their `CLAUDE.md` (or, for QC, a stale forked `master` manual with no cascade anchor; for Soren, nothing of his split identity) with **no startup cascade**. The AC↔DC↔QC coordination system never fired, and all of the wave's code was junk — caught pre-merge by Justin. (Recovery handoff: `docs/sessions/2026.06.18-ac0-ac0-handoff.md`; forensics: `docs/working/2026.06.18-ac6-sync-forensics-report.md`.)

Root cause was **two-fold**:

1. **Machine-state** — the laptop's `evryn-quality` was checked out on a stale `master` fork (heading "How QC Orients", no cascade anchor) while the good, protocol-paired manual lived on an unrelated `main` history. The orchestration protocol told QC to *"load the section by exactly that name in your CLAUDE.md"*; that section did not exist on disk → QC loaded generic. (Resolved: laptop switched to `main`, the trapped pattern ported, GitHub default flipped `master → main` — verified.)
2. **Protocol / mechanics** — even **DC, whose manual was correct, STILL skipped its cascade** (the trigger misfired even though the anchor section existed), and the protocol had **no provision for loading *team* subagents** (Soren/Mira/…), whose identity is split across the team manual + an agent-definition + a memory file, none of which auto-loads from AC's cross-repo seat (there is no registered `soren`/`mira` agent type there).

The 2026-06-06 conclusion — *"the base cascade loads reliably on its own now; you no longer need to re-enumerate the files"* (from bait tests of the binary `#cascade-override` rule) — was **over-stated**: a correct manual + binary rule is **not** sufficient. The load-bearing lesson: **"the manual is correct" / "testing shows it works" is NOT enough — every subagent must be precise-loaded on every spin, and the spinner must verify it up front.**

## Decision

1. **Precise-load every subagent, every time.** The spinner names every assembled file **explicitly** in the brief — *"load your cascade, INCLUDING explicitly: X, Y, Z"* — not *"load your cascade."* A correct manual does not make the explicit list optional.

2. **Grep-the-cascade (Justin's technique).** Before spinning, AC greps the subagent's load-defining file(s) for an **anchor SET** — `Startup Context Cascade | Context Loading | How .* Orients | Required Context | Always read on load | Auto-load` — reads only the matched sections (heading → next `##`), and assembles the union of every file named (base cascade + task-specific additions). The load can be **split across multiple files**, so grep all of them. This is cheap and deliberately reverses the older "don't read their manual, to save context" instinct. **If an agent has no anchor match, its manual is STALE → do not spin; flag it.**

3. **Team-subagent provision.** A parallel "Spinning a team subagent" block names the split load — `evryn-team-workspace/CLAUDE.md` + `.claude/agents/<name>.md` + `.claude/agent-memory/<name>/MEMORY.md` (with the truncation-canary check) + whatever the definition names — with the same identity-redirect, and a note that **AC has no registered team agent type → the manual load is mandatory, not optional.** The team manual's "subagent auto-loads agent-definition + MEMORY" claim is true only within the team's own registered-agent context; it is false from a cross-repo seat — flagged to Lucas to footnote.

4. **Receipts can't be trusted; verify at spin.** Subagents confabulate file-reads (a lobotomized QC claimed it read `roadmap.md` when it hadn't), and AC **cannot** see a *background* subagent's actual reads — only its final text. So the real control is the **up-front explicit naming (1–2), verified at spin**, not an end-of-run receipts check. Receipts are a backstop used only where the read-stream is observable.

## Consequences

- Spin-up briefs get longer (explicit file lists), and AC does a cheap grep + bounded read before each spin. Worth it: a second lobotomized wave is the only real failure mode left after the gate.
- `ac-orchestration-protocol.md` is edited accordingly: parts 1–2 (precise-load + grep-the-cascade + anchor SET), part 6 (receipts demoted to backstop), the `#cascade-override` premise (reversed the "loads reliably" claim), and a new "Spinning a team subagent" section + verbatim block.
- **Durable guardrails (follow-up, AC6 §7):** a checked-in canonical `docs/repo-inventory.md` (expected origin URL + canonical branch + frozen/active per repo), a session-start sync ritual, and commit-and-verify-on-GitHub for load-bearing files — to make the *machine-state* half of the failure (stale/forked manuals) **detectable** rather than invisible. The repo-inventory is being made the single canonical home; every agent manual points to it rather than carrying its own drift-prone repo list.
- **Heading standardization (recommended, follow-up):** load-section headings vary ("Startup Context Cascade" / "Context Loading" / "How OC Orients"). The anchor SET makes loading robust *today* without standardizing; standardizing is hygiene, best done as OC's manual is rebuilt and via Lucas for the team definitions.
- ADR-041 (M1) refinement details that were shaped by the lobotomized Soren vet must be re-validated by a correctly-loaded Soren before they are trusted.

## Why the protocol, not just instinct

This is the same class as the existing AC discipline "stop and recall the craft, every time" — the failure mode is silent (a brief *looks* complete; the missing load only bites after the subagent returns confident, wrong work). Making the load **provable** (grep + explicit naming, verified at spin) rather than **plausible** ("it loaded last time / the manual is correct") is the whole point.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
