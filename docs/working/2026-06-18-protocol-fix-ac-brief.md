# Brief — The Protocol-Fix AC (the gate before any clean re-spin)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** AC0 wrote this to brief the **protocol-fix AC - "ACP"** — a dedicated, **top-level** AC instance Justin spins in its own Claude Code session (so AC's `CLAUDE.md` auto-loads correctly; this is deliberately NOT a subagent, because subagent loading is the very thing that's broken). Your job is the **gate** in the 2026-06-18 recovery: make subagent loading provably reliable, and fix the orchestration protocol — **before** anyone re-spins AC1–5. If this isn't done and verified, a re-spin just re-lobotomizes. **You DIAGNOSE + FIX the protocol (proposing source-of-truth edits for Justin's approval); you do NOT re-spin the lanes.**

*Authored 2026-06-18 by AC0 (the recovery orchestrator).*

---

## Read first (load order)
1. **Load the Full Startup Context Cascade** (`_evryn-meta/CLAUDE.md` → SESSION STARTUP). You're doing AC-level cross-repo + orchestration-protocol work. The runtime (`evryn-backend/src/`) is NOT needed for this task — `#cascade-override` the runtime load; you need the *org/orchestration* layer, not the product internals. (Confirm with Justin if unsure.)
2. **`docs/sessions/2026-06-18-ac0-handoff.md`** — the recovery handoff (you are step 2, "the gate").
3. **`docs/working/2026-06-18-sync-forensics-report.md`** (AC6) — the root-cause forensics. §2 (the quality fork), §3 (DC), §5 (the team-subagent protocol gap), §7 (the "never recurs" guardrail).
4. **`docs/working/2026-06-17-m1-stage2-design.md` → "Part 0 — The loading failure itself"** (AC5's direct diagnosis of *why* each agent loaded wrong, with the grep-anchor fix recommendation). This Part 0 is the single most useful prior-art for your mandate.
5. **`docs/protocols/ac-orchestration-protocol.md`** — the doc you're fixing. The agent-spinning section (~line 36) is where DC/QC loading is covered and where the team-subagent provision is missing.

---

## ONE-PARAGRAPH SITUATION
On 2026-06-17 a 5-AC wave spun DC/QC/Soren subagents that loaded **only** their `CLAUDE.md` (or worse) with **no startup cascade** — so the coordination system never fired and all the wave's code is junk (Justin caught it pre-merge). Root cause is **two-fold**: (1) a *machine-state* problem — the laptop's `evryn-quality` was on a stale forked `master` branch with no cascade anchor (now fixed: laptop switched to `main`, the trapped pattern ported, GitHub default-flip in progress); and (2) a *protocol/mechanics* problem — even DC, whose manual was fine, **still skipped the cascade**, and the protocol has **no provision for loading team subagents** (Soren/Mira). The durable lesson: **"the manual is correct" is NOT enough — every subagent must be precise-loaded on every spin, and the spinner must verify it.**

---

## YOUR MANDATE (Justin, 2026-06-18)
**Verify EVERY agent can *receive* its load, and fix `ac-orchestration-protocol.md` so spin-up is correct for each — including the team-subagent provision.** Concretely:

### A. Verify every agent's load is receivable
For each spinnable agent — **AC (top-level AND when AC is itself a subagent), DC, QC, OC, and the ops/founding team agents (Soren, Mira, Nathan, …)** — confirm:
1. **Its load-defining section exists** in its manual / agent-definition, and the file on this machine is the **synced, good version** (the QC fork is the cautionary tale — don't ever spin an agent whose manual has no load anchor). Use bounded greps + targeted reads (heading → next heading); do NOT full-load every manual and blow your context.
2. **What its full load actually is** — the union of every file its cascade/definition names. Note that for team agents the load-list can be **split** across the team `CLAUDE.md` *and* the agent-definition (`evryn-team-workspace/.claude/agents/<name>.md`) *and* its memory file — none of which auto-loads when spawned from AC's seat.
3. **Terminology varies** across agents (DC: "Startup Context Cascade"; Soren: "Context Loading"; QC: now "Startup Context Cascade — Auto-load (tiered)" on `main`; OC: "How OC Orients" — NOT standardized). A single "load your cascade" string can't anchor reliably. Either (a) make the protocol robust to the variance via a **grep-anchor SET** (`Startup Context Cascade | Context Loading | How * Orients | Required Context | Always read on load`), and/or (b) recommend standardizing the section names across manuals (auth-gated edits — propose, don't apply).

### B. Bake the two new rules into the protocol
1. **Precise-load every subagent, every time.** The spinner names every assembled file **explicitly** in the brief ("load your cascade, INCLUDING explicitly: X, Y, Z"), not "load your cascade." Verification is up-front (at spin), not just an end-check — because **receipts can't be trusted** (a subagent will confabulate "I read X"; Justin watched a lobotomized QC claim it read `roadmap.md` when it hadn't). AC cannot see a *background* subagent's actual file-reads (only its final text), so the up-front explicit naming is the real control.
2. **Grep-the-cascade technique (Justin's).** When an AC spins a subagent, it **greps the subagent's load-defining file(s) for the anchor set, reads just the matched load-lines** (heading → next heading), assembles the union, and passes precise load instructions — so it can *guarantee* correct loading **without** reading the whole manual and blowing its own context. (This deliberately reverses the old "don't read their CLAUDE.md to save context" instinct — grepping just the load-lines is cheap and worth it.)

### C. Add the missing "Spinning a team subagent" provision
The protocol only documents "Spinning a DC or QC subagent" (whose identity is a `CLAUDE.md` at a known repo path). Add a parallel **"Spinning a team subagent"** block (mirror the DC/QC shape), naming — in the same "read and faithfully follow, in full" register — the load set, in order:
1. `evryn-team-workspace/CLAUDE.md` (the team operating manual — read first);
2. `evryn-team-workspace/.claude/agents/<name>.md` (the agent's definition/identity);
3. `evryn-team-workspace/.claude/agent-memory/<name>/MEMORY.md` (the agent's memory — **with the truncation-canary check**, memory files can silently truncate);
4. **whatever that agent definition itself names** as its context set (spokes, project docs — the full set, not just the definition).

Plus: the same **identity-redirect** ("you are not AC; your manual is …") + **up-front explicit naming** as DC/QC, and a one-line note that **AC cannot use a registered `agentType` for team agents** (there is no `soren`/`mira` agent type from AC's seat → AC necessarily spawns a *generic* subagent that auto-loads AC's CLAUDE.md and nothing else → the manual load is mandatory, not optional). Cross-reference the team `CLAUDE.md` "Multi-agent sessions and subagents" section, and flag to Justin/Lucas that the team CLAUDE.md's "agent-definition + MEMORY auto-load" claim is **only true when spawned as a registered team agent type — false from a cross-repo seat like AC's** (footnote it).

---

## WHAT'S ALREADY DONE (so you don't redo it) — AC0, 2026-06-18
- **QC fork fixed on this machine:** laptop `evryn-quality` switched `master → main` (the good, protocol-paired chain); the trapped `06eaa9b` "guard-is-half-a-change" pattern ported onto `main` (`b4ce5be`, pushed). **GitHub default-branch flip `master→main` is in progress (Justin's admin action).** Old `master` kept on ice until the flip is verified. **You: verify the laptop is on `main` + the manual there has the cascade anchor; confirm the default flip landed before declaring QC-loadable.**
- **ops `CLAUDE.md`** suspect edits committed+pushed for later mining (`53d5bf9`) — not part of your task; noted so you don't trip on the dirty-then-clean state.
- **Desktop** is the clean reference (on `main` for quality, in sync) — per AC6/AC7, no at-risk work there.

## CONSTRAINTS
- **`ac-orchestration-protocol.md` is a protocol doc = source-of-truth → auth-gated.** PROPOSE the edits (draft them in full), get Justin's approval, then apply. Same for any standardizing edits to DC/QC/OC/team manuals.
- **Do NOT re-spin AC1–5.** That's after the gate (a later step, AC0's orchestration). Your job ends at "loading is provably reliable + the protocol is fixed."
- **Verification over assertion:** prefer a real bounded check (grep + targeted read of each manual's anchor; if feasible, a tiny test spin that asserts what a subagent actually loaded via the tool-call log the runtime emits) over "I read it and it looks right."
- **Ping `#team-alerts` every response** (Node `fetch` to `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env`; parse the `.env` directly — `dotenv` isn't installed; prefix your designation).

## DELIVERABLE
1. **A verification report** in the chat: per agent — does its load anchor exist, is the on-disk file the good/synced version, what is its full load set, and is it spinnable-clean. Flag any agent that ISN'T.
2. **Proposed edits to `ac-orchestration-protocol.md`** (drafted in full, for Justin's approval): the precise-load rule, the grep-cascade technique, the team-subagent provision, and the grep-anchor-set robustness.
3. **ADR-042** (the next free number — 041 is the M1 ADR, itself flagged for re-vet; confirm 042 is free) codifying the loading-discipline fix. Frame: precise-load-every-subagent + grep-the-cascade + team-subagent loading; the receipts-can't-be-trusted principle; verification-at-spin.
4. **(Recommend, don't apply)** whether to standardize the load-section names across all agent manuals, and the durable guardrail from AC6 §7 (a checked-in repo inventory + session-start sync ritual) — route those as follow-ups.

## NORTH STAR
A re-spin before this lands just re-lobotomizes. Take the time to make loading **provable**, not plausible. When you're done, AC0 harvests the salvage and re-crafts the AC1–5 briefs against your fixed loading model.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
