# The Map — why it looks the way it does

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

> **How to use this file:** the **backstage reasoning** behind the Map (tab one of the dashboard). It is an *explanation* doc, not a how-to and not a status page — read it before changing the Map's structure, so decisions already made are not re-litigated. **What the Map shows is on the Map.** What is here is *why*, and what was deliberately rejected.
>
> **Owner: Soren of record** (he owns `evryn-backend/docs/ARCHITECTURE.md`, and the Map is prescriptive — see *Prescriptive, not descriptive*). Built by ACv, 2026-08-19, at Justin's direction.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## What the Map is for

Justin is a **visuo-spatial thinker and not an engineer**. Evryn's design lives in a stack of prose at increasing resolution — Hub → `ARCHITECTURE.md` → BUILD docs → sprints — and the runtime is ~20,100 lines across 45 files. **He could not see the system, and prose was never going to let him.**

The Map answers four questions, and it was built to answer them *in one glance* before it answers them in detail:

1. **What are the pieces, and how do they interact?**
2. **What do our own docs say should be here?**
3. **What have we forgotten?** ← the highest-value half, and the one no tool can generate
4. **Where are we in the build?**

---

## The thing we deliberately did NOT build

**An auto-generated import graph.** It is the standard answer, it is nearly free, and it is wrong here. Five reasons, each of which forced a design decision:

| Why the node graph fails | What the Map does instead |
|---|---|
| Answers *"what imports what"* — a refactoring question asked twice a year | Draws the **flow**: what arrives, what decides, what leaves |
| Every edge weighs the same — our own dependency map admits *"edge existence is not edge weight"* | **Line thickness is reserved for real traffic**, by human judgment |
| No top, no bottom — a hairball destroys sequence | **Position is fixed and never re-laid-out**, so the geography becomes memorable |
| Shows structure, not behavior | Layers for money, safety, security, identity |
| 🔴 **Can only draw what exists** | **The gap layer** — structurally impossible to generate, and the most valuable thing here |

**Prior art we did borrow:** **C4** — the practice of drawing a system at fixed zoom levels rather than one flat picture. We took the zoom-level idea and rejected the auto-layout renderers, because auto-layout rearranges on every render, which is exactly what prevents anyone building a mental map of the place.

---

## The visual grammar — one channel, one meaning

**This is the rule that makes multiple layers legible at once, and it is the single most load-bearing decision in the Map.**

| Channel | Carries | Must never carry |
|---|---|---|
| **Position** | the flow — fixed forever | anything else |
| **Color** | which layer | build state |
| **Fill** | does it exist? (solid → live · muted → merged, undeployed · hatched → built but OFF · translucent → designed · outline → sketched) | which layer |
| **Border style** | how well specified (solid → has a decision record · dashed → loosely sketched · dotted → known gap, nothing written) | |
| **Left-edge stripe** | **which layers this box belongs to**, one segment each | |
| **Badge** | process state (live · undeployed · off · this sprint · next · designed · ⚠ gap) | |
| **Halo** | selection | |
| **Line thickness** | **reserved — deliberately unspent** | |

### 🔴 The collision this fixed, so nobody re-introduces it

**The first build colored the box OUTLINE by layer.** With two layers active, two CSS rules competed for one property and **source order silently decided the winner** — so *"which layer predominates?"* had no answer a user could reason about. Justin caught it immediately.

⇒ **Layers were moved off the outline entirely, onto a stacked left-edge stripe.** Three active layers a box belongs to render as three segments. **Nothing overwrites anything.** The stripe is generated from each box's own rect, so it cannot drift from the box it describes.

### Why line weight is left unspent

Selection originally used stroke weight. That spent a whole visual channel on a *transient state* — so selection moved to a **halo**, and weight is now free. **We are deliberately not spending it.** The natural future use is **edge thickness = how much actually flows through a path**, which is precisely the thing an import graph cannot know and a human can.

---

## The bands, and the rule that decides what goes where

The Map is organized around the **v0.3 shape** — the product as designed — **not the v0.2 shape**. Justin's reasoning: *"the codebase makes it feel like the email stuff is the main show, but it's really not, it's this small sidecar on the main show."* Drawing it any other way would reproduce the very distortion the Map exists to correct.

| Band | What it is |
|---|---|
| **Channels** | how a person and Evryn reach each other |
| **Evryn** | her personal intelligence |
| **The gates** | deliberately **not** her — someone else checking |
| **Outcomes** | what she actually delivers |
| **Stores** | what she remembers |
| **The spine** | what wraps everything above |

### 🔑 The membership rule for the Evryn band (Justin's, and it settles most arguments)

> **If it is HER personality running it, it belongs in the Evryn band.**

- **Reflection belongs** — it is Evryn reflecting.
- **The Publisher and deception detection do not** — those are someone *else* checking her. They are gates.
- **Proactive outreach belongs** — the *decision* to reach out is hers. The **campaign** to reach the v0.2 backlog is a deliverable, so that sits in Outcomes.

---

## The gap layer — two kinds of missing, never drawn alike

- **Documented gap** — a doc says X should exist and the code lacks it. Carries both citations.
- **Judgment gap** — no doc mentions it, but conventionally it belongs (a retry, a rate limit, an idempotency key, an alert). Drawn lighter and **labeled as judgment, not as a finding.**
- **Ghost box** — something named in a source-of-truth doc that has **no box at all**. Currently: *Anticipation mode*, a phase the user-experience spoke names and nothing in the system represents.

**Every claim in the inspector is tagged with its instrument** — `read` (read at source) · `atlas` (from the Code Atlas, which states it was never executed) · `judge` (reasoning).

🔴 **This is not decoration, and it has already earned its place twice in one day:** the first build claimed `classify.ts` spanned six concerns. A developer read the file end to end and found the sixth — triage judgment — **is not in there at all.** The Atlas had never claimed it was; ACv inferred it from the filename. **A confident-looking map that is quietly guessing is worse than no map**, and the tags are what stop that.

---

## Prescriptive, not descriptive

**Justin's ruling: the v0.3 shape drawn here is the target the `classify.ts` refactor aims at**, not merely a picture of what exists.

⇒ **The code overlay is the scoreboard.** It shows which file implements each box; when one file lights up across several boxes, that *is* the god-module problem, drawn. **The refactor is finished when every box has its own file.**

⚠️ **One promise the Map must never make:** extracting `classify.ts` **does not** deliver concurrency. The serialization is in the caller, not in that file. This is documented in `BUILD-EVRYN-v0.3.md` and is repeatedly forgotten.

---

## Keeping it current

**The Map has two halves with completely different staleness rates, and maintaining them the same way is what would bog everyone down.**

- **State** (what is built/deployed/off, sizes, counts) rots **every merge** → **machine-refreshed. No human in the loop.**
- **Shape** (which boxes exist) rots **slowly** → human review, but **triggered by a diff, not a date**: `npm run depmap` is byte-identical against unchanged code, so a non-empty diff means the shape actually moved. The Map stores a fingerprint of what it was drawn against and **banners itself** when they diverge.

**Three further rules:**
1. **Design-shape changes route through `doc-update-routing-protocol.md`** — when ARCHITECTURE or a BUILD doc changes, the Map is one of the surfaces it touches. Mechanical, not memory-based.
2. **One beat, two artifacts.** The Code Atlas already carries an identical standing order. **Do not create a second, separate obligation** — *a build that changes the runtime's shape updates the Atlas AND the Map*, same moment, done by whoever moved the code.
3. **Escalate by age** — amber when the fingerprint diverges, red with a day count past a week. A check that never nags lets a map rot; one that nags daily gets ignored.

⚠️ **Deliberately rejected: a hand-maintained "last updated" line.** That is the exact shape that has rotted here before. The fingerprint computes itself.

---

## Open questions

1. **Not yet represented anywhere:** Latent Truth Discovery · Connection Coaching · Reframed Introductions · the Account page. Boxes, or a fifth "journey" view?
2. **The user journey is a real structure the Map does not show** — Onboarding → Anticipation → the Dance → After-care. Possibly its own view rather than more boxes.
3. **L3 (the code level) is unbuilt.**
4. **Live state is not wired.** The dashboard already reads Railway health and the product database, so the Map could eventually light up with real state — breaker tripped, clustering on, version live. Plumbing exists; deliberately deferred until the picture settled.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
