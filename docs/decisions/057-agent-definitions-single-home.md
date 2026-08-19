# ADR-057 — Agent definitions in `_evryn-meta/.claude/agents/` become the single home for every agent's manual

**Status:** Accepted (2026-08-18, Justin) · **merged; the CUTOVER that completes it is still OWED and is Justin's**
**Context repo:** `_evryn-meta`
**Companion:** ADR-056 (`CLAUDE.md` as a router) — shipped together in "Lane A", separable decisions.
**Written:** 2026-08-18 by AC0-37e, retroactively.

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.
>
> **How to use this file:** the decision record for *where each agent's operating manual lives*. ⚠️ **This decision is HALF-LANDED as of writing** — read the Status section below before assuming which copy is authoritative, because getting that backwards silently forks a manual.

---

## Context

**Each of the four build agents kept its manual in its own repo:** `evryn-dev-workspace/CLAUDE.md` (DC), `evryn-quality/CLAUDE.md` (QC), `evryn-ops/CLAUDE.md` (OC), and AC's inside `_evryn-meta/CLAUDE.md`. **That made sense when each agent primarily worked in its own repo. It stopped making sense when they stopped doing that.**

**Two things had changed underneath the arrangement:**

1. **The harness gained spawnable agent types** — a definition file in `_evryn-meta/.claude/agents/<name>.md` makes `<name>` a type the `Agent` tool can spawn, with that file delivered as the agent's context. **Manuals in sibling repos cannot participate in that at all.**
2. 🔑 **The agents stopped running in their own repos.** Justin, 2026-08-11: ***"nothing happens in QC's repo; QC is virtually always just a subagent for AC, that's it — it's been a long time since we've run QC in her own repo."*** **The same is true of DC.** ⇒ **A manual's home repo had become an archaeological fact rather than an operational one.**

**One symptom worth recording, because it is what made the cost concrete:** `evryn-quality` has **no `CHANGELOG.md` at all**, so under the ordinary per-repo routing rule, changes to QC's manual had **no home anywhere** — which is how four Justin-approved QC pattern promotions came to be recorded nowhere.

---

## Decision

**`_evryn-meta/.claude/agents/{ac,dc,qc,oc}.md` are the single home for all four operating manuals.** Each definition is front matter (name, description, model pin) plus the manual **verbatim** below a `MANUAL BODY BEGINS` marker.

**The three sibling-repo `CLAUDE.md` files become REDIRECTS; the repos remain as working directories and archives.**

**Changes to DC's and QC's manuals are logged in `_evryn-meta/CHANGELOG.md`** — a deliberate, named exception to the per-repo changelog rule, because *those changes are a meta phenomenon* (Justin's ruling, 2026-08-11). ⚠️ **Do not "fix" this by creating per-repo changelogs for DC or QC.**

## 🔴 STATUS — this decision is HALF-LANDED, and the half that is missing changes which file you must edit

**The merge landed the definitions. The CUTOVER that makes them authoritative has NOT run.** Until it does:

- **The repo `CLAUDE.md` files are AUTHORITATIVE and the definitions are verbatim COPIES.**
- ⭐ **Justin's standing instruction: make any manual change in BOTH places.** Three verbatim copies exist in this window and **an edit to one silently forks it.**
- ✅ **The detector is a three-line drift-check, and it works — it caught a real fork on 2026-08-18 that two audits and two humans had missed:**
  ```bash
  diff <(tr -d '\r' < evryn-quality/CLAUDE.md) \
       <(awk '/^<!-- ===== MANUAL BODY/{f=1;next} f' _evryn-meta/.claude/agents/qc.md | tr -d '\r')
  ```
- **The six cutover steps live at `docs/working/2026.08.11-ac0-acm-loading-architecture-brief.md` §11.3** and are quoted in the current AC0 handoff.

---

## Reasoning

- **A spawnable type is worth more than a tidy repo layout.** It converts "spin a DC and remember to name its manual" into a type the harness itself resolves — **and it makes the model pin structural rather than instructional**, since the definition's front matter carries it.
- **One home ends the drift class.** The elevation discipline this org already applies to docs — one home per item, everything else a pointer — was being violated for the most load-bearing documents we have.
- **It gives homeless changes a home.** See the QC changelog symptom above.

---

## Alternatives considered and rejected

- **Leave the manuals in their repos and make definitions thin pointers.** ❌ **Rejected: a spawned agent gets the definition, not the pointer's target** — a thin definition means a spawned DC boots with a stub, which is the exact failure the hard rule exists to catch.
- **Move the manuals and delete the repos.** ❌ **Rejected as premature, and correctly.** Those repos still hold mailbox files, build research and session docs. 🔵 **Retiring `evryn-dev-workspace` IS Justin's eventual intent, but he sequenced it explicitly as the LAST step — after the cutover, and after we have verified the subagents actually work well. It is not yet designed.**
- **Do the cutover in the same change as the merge.** ❌ **Rejected: step 3 is a verification gate** — confirm the four types are actually spawnable *before* converting the originals to redirects, or a failure strands three manuals.

---

## Consequences

- ✅ **Four agents, one home, one place to look.**
- ⚠️ **A three-copy window exists between merge and cutover, and it is the risky part of this decision.** The drift-check is the only detector and **it only works if someone runs it.**
- 🔴 **A gap the cutover creates that was NOT designed until 2026-08-18: what a MAIN-agent DC/QC/OC reads post-cutover.** Step 5 turns their repo `CLAUDE.md` into a redirect, so a main-agent boots into a stub — and each definition's front matter is written wholly in *spawned-as-subagent* terms ("the harness delivered this file; your task arrives in a tagged two-trip brief"), **both false for that reader.** ⇒ **The redirects must be written for the main-agent case, not merely as pointers.** ⚠️ **OC is the most likely to legitimately run as a main agent** — incidents and deploys do not wait for an orchestration loop. **Drafts exist at `docs/working/2026.08.18-ac037e-justin-cutover-redirect-drafts.md`, pending Justin's vet.**
- 📌 **Cutover step 6 is not optional bookkeeping:** the router's transitional note and the orchestration protocol's manual-path line **both currently state the repo files are authoritative**, which step 5 makes false. **They change in the same commit or they become the next fork.**

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
