# `docs/ops/` — OC's operational surfaces

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the index for the three places OC writes what it learns. **Rehomed here 2026-08-19** (Justin's call) from `evryn-ops/docs/`, because **that repo is retired** and OC now runs in `_evryn-meta`.

**Why this move happened, and it is the useful part:** at the 2026-08-18 cutover, `evryn-dev-workspace`, `evryn-quality` and `evryn-ops` were retired to redirect stubs. **QC's references to her old repo were all DEAD** — they described the hand-relayed mailbox model retired 2026-08-12. **OC's were not.** His manual points at `docs/runbooks/`, `docs/incidents/` and `docs/monitoring-checklist.md` as where to write findings, and **that workflow is still real — it simply had no destination in `_evryn-meta`.** ⇒ **Three surfaces, rehomed rather than deleted.**

| Surface | What goes in it |
|---|---|
| **`runbooks/`** | How-to guides for specific operational tasks. One file per procedure. Written when OC diagnoses an issue worth documenting for next time. |
| **`incidents/`** | What happened, what we did, what we learned. **Breadcrumbs, not postmortems.** One file per incident, named `YYYY-MM-DD-brief-description.md`. |
| **`monitoring-checklist.md`** | Quick-scan status of all infrastructure. **A SNAPSHOT, not a log** — each update replaces the previous state. |

⚠️ **All three arrived here EMPTY of real content — they were stubs in `evryn-ops` and were never used.** That is worth knowing before you conclude from an empty `incidents/` that nothing has ever gone wrong: **nothing was ever written here, in either location.**

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
