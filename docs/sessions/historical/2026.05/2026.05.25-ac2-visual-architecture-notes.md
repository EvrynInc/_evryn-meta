# AC2 Visual Architecture — Notes for Whoever Writes the Dispatch Brief

> **Status:** Stub. Not yet the AC2 dispatch brief itself — these are notes from old-AC0 capturing Justin's ask + the design space considered, so the new AC0 writing the dispatch brief doesn't have to re-elicit it from Justin. Written 2026-05-25 before machine switch.

---

## Justin's original ask (his own words, lightly grouped)

From the 2026-05-22 conversation when the substance of what he wants surfaced:

> *"I need a visual interface if I'm going to continue. I really liked using n8n for one reason: I could see the nodes/modules/whatever they're called, and how they flowed together. I feel like this is all just in code, and it's not at all my native language, so it's hard to keep it all in my head. I need visuals."*

> *"I need to see the **whole** architecture, and I need to be able to zoom into architectural pieces, and see the sub-architectures."*

> *"I have almost unlimited visual memory — if we can get this into a visual state, I can 'see the matrix', and I'll be much more effective. Not sure how to visually represent it all."*

> *"I might want you to capture my question — and also a description of what we're doing here — maybe pointing to a session doc, or how he can anchor on where we're at in the process — because I want the whole architecture, but I feel like something like an integration test might run alongside it, and get checked off as we go, or something — I don't know."*

On dispatch:

> *"Yeah, C sounds by far the best. So just give me the session doc, and I'll go spin up AC2, to be working through this. The key for me is: we need to have **one** architectural source of truth — **ONE** — I don't want to maintain yet another layer — so yeah, could the new doc **be** the architecture doc? Would it **replace** architecture.md? Or how would that work? I'm not asking you to answer this, I'm asking you to include it for AC2."*

---

## What he's actually asking for

A visual map of the Evryn system that:

- Shows the whole architecture at altitude
- Lets him zoom into any piece to see its sub-architecture
- **Stays in sync with reality (doesn't drift) — load-bearing constraint.** This is the one Justin emphasized most.
- Lives in version control alongside the code
- Lets him "see the matrix" — leverage his visual memory where his non-visual memory is overwhelmed by complexity
- Is updated as part of normal #lock discipline (he mentioned "we can add to the lock list or whatever so that it doesn't drift")

The deeper why: as Evryn's complexity has grown (multi-repo, multi-agent, multi-pathway), Justin has been juggling more architectural state in his head than he can sustainably hold. He has *unlimited visual memory* but bounded non-visual capacity — visualization moves the load to the channel where his capacity is high.

---

## The option set old-AC0 walked through with Justin

Five options laid out. Tradeoffs honest. Recommendation: C.

**Option A — Multi-level Mermaid diagrams in markdown.** Quick. Version-controllable as plain text. Renders natively in GitHub. One diagram per altitude; nodes can link to next-level-down diagrams. *Cons:* limited interactivity, no real zoom, gets visually busy at scale.

**Option B — Excalidraw or Whimsical (hand-drawn diagrams).** Beautiful. Sketch-on-whiteboard freedom. *Cons:* drift risk is **high** (it's manual); hard to version-control meaningfully.

**Option C — Custom static web app reading structured data (RECOMMENDED).** A small custom app (Vue/React/vanilla JS) that reads architecture from a YAML/JSON file in the repo and renders it as a zoomable, pan-able, clickable diagram. *Pros:* the architecture-as-data file is version-controlled (the truth), the visual is generated from it (so they can't drift far), zoomable + interactive, can be made beautiful. *Cons:* most upfront effort (~1-2 days build), needs maintenance.

**Option D — Anthropic artifact (single interactive HTML/JS file).** Self-contained HTML page with embedded JS. *Pros:* zero deploy, runs locally. *Cons:* less version-control-friendly, harder to evolve, file gets huge.

**Option E — Obsidian Canvas.** Local note-taking tool with infinite-canvas layout of markdown cards + arrows. *Pros:* marries existing docs with visual layout, fully version-controlled (.canvas JSON file). *Cons:* requires Obsidian; better for "linked docs" than "system structure."

---

## Why C — the load-bearing reasoning

The drift problem is the load-bearing problem. If the architecture-as-data file is the single source of truth and the visual is **generated** from it, then keeping things in sync becomes:

- "edit one text file when the architecture changes" (tractable)

rather than:

- "remember to redraw the picture" (will fail)

The YAML/JSON file becomes a beautiful artifact in itself — *the architecture written down structurally* — and serves as a checkpoint document independent of the visual.

Zoom-into-subsystem is natural — each subsystem is a sub-node in the YAML, clicking it expands it. The #lock protocol can include "update architecture.yaml if anything structural changed" as a one-line checkbox.

Build estimate: 1-2 days of focused work for an AC instance. Tooling candidates: vanilla JS + Cytoscape.js (good for hierarchical zoomable graphs) or D3.js. Served as a static page either locally or via Railway/Vercel.

---

## The load-bearing question Justin specifically asked be included

> *"could the new doc **be** the architecture doc? Would it **replace** architecture.md? Or how would that work?"*

This is the design question AC2 should answer in the dispatch brief response. Justin's principle: **one architectural source of truth, not multiple maintained in parallel.** His worry is that adding "the architecture YAML" plus keeping `ARCHITECTURE.md` plus the Hub plus the spokes creates *more* drift surface, not less.

Possible answers AC2 might land on (not for old-AC0 to decide — AC2 should think through):

- **The YAML replaces ARCHITECTURE.md entirely.** The viewer renders the YAML; the prose that was in ARCHITECTURE.md becomes annotations or descriptions inside the YAML nodes themselves. Heavier migration.
- **The YAML lives alongside ARCHITECTURE.md, with the lock protocol enforcing both-update.** Lower migration cost but doesn't actually solve Justin's "one source of truth" desire.
- **The YAML IS the structural truth; ARCHITECTURE.md becomes derivative.** Either auto-generated from the YAML (so it's a view of the same truth), or ARCHITECTURE.md narrows to "the prose narrative about why the architecture is shaped this way" with structural facts moving to the YAML.
- **Something else AC2 sees.**

Worth AC2's thinking. The answer shapes the whole project — whether it's "build a viewer on top of existing docs" vs. "migrate to a new structural source of truth with a viewer."

---

## Integration test as a possible overlay

Justin floated this as a maybe:

> *"something like an integration test might run alongside it, and get checked off as we go, or something — I don't know."*

Not a hard requirement, but worth surfacing in the dispatch brief as a design question for AC2:

- Does the architecture viewer have a "test status" layer that lights up nodes as integration test phases pass?
- Or is the test a separate dashboard?
- Or both — with the test dashboard rendering over the architecture map?

Justin's not prescribing — he wants AC2 to think this through and propose.

---

## Anchor docs the AC2 dispatch brief should point at

When old-AC0 (or whoever writes the dispatch) writes the brief proper, point AC2 at:

- `_evryn-meta/docs/hub/roadmap.md` — Hub. Company truth. Must read first.
- `evryn-backend/docs/ARCHITECTURE.md` — the document that may or may not get replaced/subsumed. Particularly the post-2026-04-29 / 2026-05-22 sections.
- `_evryn-meta/docs/decisions/` — all the ADRs (027/029/030 + amendment/031/032). These shape the architectural truth that needs visualizing.
- `_evryn-meta/docs/current-state.md` — current snapshot.
- `_evryn-meta/docs/sessions/2026-04-30-canonical-phase2-run.md` — the seam-level architectural understanding that surfaced during Phase 2. Especially the 5/22 status appendage.
- The 2026-05-20 team-runtime feasibility study at `_evryn-meta/docs/sessions/2026-05-20-team-runtime-feasibility.md` — a recent example of architectural thinking that the viewer might one day represent.

---

## What the dispatch brief itself should add on top of this

When you (whoever's reading this — likely new-AC0 on the new machine) write the actual AC2 dispatch brief, this stub gives you the **content** but not the **dispatch shape**. Add:

- A "load this first" tier list with explicit reading order (you can use this stub directly as Tier 1 reading for AC2)
- Authority boundaries (per CLAUDE.md — no commits without Justin's go-ahead; don't touch source-of-truth docs unilaterally; etc.)
- Working-doc structure expectations (where AC2's output lives; how big the build is; cadence for surfacing decisions)
- Coordination notes for parallel agents (AC0 active, Mira's bundle pending merge, AC1 working architectural-thinking docs, DC on standby)
- A "when you're done" definition — what success looks like (probably: a working YAML schema + a deployed viewer + a recommendation on the architecture-doc-replacement question)

This shape was the same as the AC1 brief at `_evryn-meta/docs/sessions/2026-05-01-ac1-brief-phase2-architectural-adrs.md` — use it as a template.

— Old AC0, 2026-05-25 (notes stub before machine switch — for new AC0 to consume when writing the actual AC2 dispatch brief)
