# ADR-060: Gate-BURN — measuring the cost of running is a formal condition before any gatekeeper is switched on

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**Status:** Accepted 2026-09-02 (Justin, A), adopting Emma's burn analysis. Written up 2026-09-08T15:25-07:00 by Soren (C, CTO) at Justin's direction — the decision had been living only in `evryn-backend/docs/SPRINT-V0.2-HARDENING.md`, `_evryn-meta/docs/current-state.md` and a team current-state appendage. **Emma owns the measurement; Justin rules the flip.**

**Related:** ADR-049 (daily clustering pipeline) and the Haiku pre-screen both change the workload this gate measures — see *The re-opening clause*. ADR-043 (Lean Reflection) and ADR-051 (runtime bookkeeping) are two of the five cost levers whose effect this gate exists to measure rather than assume.

## Context

**Serving a gatekeeper costs money we have not measured.** The June cost analysis (`evryn-team-workspace/shared/projects/product/research/2026.06.11 evryn-cost-analysis.md`) modeled the ladder from ~$11,000/mo down to a ~$200/mo irreducible floor, but every figure in it is **modeled on n=4 hard captures**, and the 2× prefix correction applied to it in July is a **re-derivation, not a re-fit**. That document has carried a standing action since July: *"capture ~50 real items through the live pipeline and refit."* It was never done.

**Emma's 2026-08-18 burn analysis made the consequence concrete, and it is a runway fact rather than a cost-tuning one.** Runway swings from roughly **five months dormant** to roughly **sixteen days in the worst transient corner**, depending on a cache-temperature number nobody has measured. Her conclusion, verbatim:

> *"the go-live decision for a gatekeeper is a burn decision, not just a build decision — and nobody has been treating it as one."*

⚠️ **That recommendation then sat for fifteen days and reached nobody who could act on it**, because it was filed in `_evryn-meta`'s cross-lane notice board, which the founding team does not read. **From the sending side it looked exactly like delivery.** The fifteen days are not incidental to this ADR — they are why the condition is being recorded as a *gate with an owner* rather than as an analysis with a recommendation.

🔑 **The connection nobody had made, and it is the reason this is cheap rather than new work: Gate-BURN and the June analysis's standing "capture ~50 real items and refit" action are the SAME MEASUREMENT.** The gate does not add a burden. It gives an action that has been owed since July an owner, a trigger, and a consequence for skipping it.

## Decision

**Measuring what the system costs to run is a formal condition that must be satisfied before any gatekeeper is switched on.** Not a nice-to-have, and not something that can be worked around by being ready in every other respect.

It is recorded as a **gate rather than a Step** — in `evryn-backend/docs/SPRINT-V0.2-HARDENING.md`'s GATES region — because a Step gets marked DONE once and a gate is a **condition that is re-evaluated at the moment it guards.**

- **Owner: Emma** (the analysis and the measurement). **Justin rules the flip.**
- **The measurement:** capture ~50 real items through the live pipeline and refit the cost model, reading the `cache_creation` : `cache_read` ratio on the prod `llm_usage` table.
- **Quote the band, never an endpoint.** The frequently-repeated *"~$200/mo to serve a gatekeeper"* is the June document's **irreducible row** — gold and edge Opus judgment only, warm cache — and was never an all-in figure.

## The re-opening clause — this is the part most likely to be simplified away, and it must not be

🔴 **A measurement taken before the Haiku or Clustering flips does not survive them, because those flips change the thing being measured.**

- **Clustering** (`v0.2.7`, ships `CLUSTERING_MODE` off) batches an inbox into twice-daily packages, so only the first item per batch pays the cold-cache intercept and the rest run warm — **regardless of total volume.**
- **The Haiku pre-screen** (`v0.2.6`, ships off) removes the Opus screen from the majority of items.

Both flip at gatekeeper onboarding. ⇒ **A pre-flip reading certifies a workload we will not be running.** This is the same principle `ARCHITECTURE.md` already records for the Haiku shadow validation — *a validation certifies the rubric it was measured against, not the mechanism* — arriving as a cost model rather than as a test.

## 🔴 The shadow-window inversion — a reading taken then is a CEILING and must be labeled one

**In `shadow` mode the Haiku screen runs *alongside* Evryn's full Opus judgment so the two can be compared. Nothing is skipped, so we pay both.** The saving is *Opus-avoided minus Haiku-added*, and during calibration **no Opus is avoided.**

⇒ **The first ~1–3 weeks of a live gatekeeper are the MOST expensive weeks, not the least**, dropping to the bottom of the band only at the full `active` flip. *(Justin confirmed 2026-09-04 that the shadow period is calibration, not a trial of whether to use the screen.)*

⚠️ **So a Gate-BURN reading taken during the shadow window measures the ceiling. It is fine to gate on — but it must be recorded as the ceiling, or a membership dues price gets set against a cost that is about to fall substantially.**

## The rejected alternative — the circularity objection, and why bounded exposure dissolves it

**The objection was real and was made in our own documents.** `evryn-team-workspace/shared/projects/product/watch-list.md` §2 argued that this measurement **cannot gate go-live, for a structural reason rather than a matter of priority: the measurement needs real gatekeeper traffic to exist.** So *"measure, then decide whether to go live"* is circular. That watch-list entry therefore treated it as a **tripwire** — read the ratio inside the first days and treat a cold result as a runway event — explicitly *not* as a go/no-go.

⚠️ **That framing is precisely what let the recommendation sit for fifteen days**: filed as a cost-tuning input, it read as something to do *after* go-live, so nothing about it blocked anything.

⭐ **What dissolves the circularity is Emma's bounded-exposure formulation: the gate is satisfiable as a *bounded* measurement rather than a *pre-flight* one.** Three components — **a pre-agreed halt threshold**, **a reading inside roughly the first three days of real traffic**, and **the authority to pause forwarding on a breach.** The arithmetic is what makes it work: **three days of the worst corner costs ~$400; discovering the same thing after thirty costs ~$4,000, roughly twice everything we have.**

⇒ **The condition is not "measure before any traffic," which is impossible. It is "do not run unmeasured past a bounded exposure," which is achievable.** The circularity objection defeats the naive reading of the gate and does not defeat this one.

⚠️ **STATUS OF THAT FORMULATION: PROPOSED, NOT RATIFIED. Justin has not ruled on bounded exposure.** What he ruled on 2026-09-02 is that the measurement is a formal condition. **The halt threshold, the reading window and the pause authority are Emma's proposal awaiting his decision** — do not build against them as though settled, and do not let this ADR be read as having settled them.

## Consequences

**(+)** An action owed since July has an owner, a trigger and a consequence. **(+)** The go-live decision is explicitly a spending decision, which is what Emma established and what nobody was treating it as. **(+)** The gate re-opens, so it cannot be satisfied once and then quietly invalidated by the two flips that were always going to follow it.

**(−)** It adds a condition to a go-live chain that is already long — staging seed refresh (SPRINT Step 125) → clustering proven on staging → Gate-B → Gate-BURN → flip. **(−)** The bounded-exposure half is unratified, so the gate's *satisfaction criteria* are not yet fully specified; a reader could mistake "the gate exists" for "we know what clears it." **(−)** ⚠️ **Sequencing dependency worth stating plainly: Gate-BURN cannot be satisfied for the clustered case until SPRINT Step 125 lands**, because staging's reset seed predates the `queued` status and clustering lands every forward at `queued` — so the first clustered forward would be rejected by the database.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
