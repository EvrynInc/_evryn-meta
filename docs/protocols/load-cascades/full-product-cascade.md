# Full Startup Context Cascade — Evryn product (`evryn-backend`)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the **per-build full cascade** for anyone doing *or directing* build-level work on the **Evryn product** (`evryn-backend`, "Gatekeeper's Inbox," live on Railway). It is the `evryn-backend` branch of `_evryn-meta/CLAUDE.md`'s cascade router: **load the Light Startup Context Cascade (in CLAUDE.md) first, then this.** A **reference** (a precise load list), not an explanation. **The universal full-cascade PRINCIPLES** — every agentic system has two halves, the enumeration trap, "when Justin calls the full cascade it is non-negotiable — do not trim it," verify-at-claim-is-additive, the two-modes rule, which-runtime-state-did-you-load — **live in CLAUDE.md and govern this load; this file is the product FILE LIST those principles apply to.**
>
> **Owner: AC.** Edits need Justin's approval (propose first). Keep in lockstep with the product runtime.

---

## The load list (load each in full; faithfully honor each doc's own Required Context)

- **`_evryn-meta/docs/hub/technical-vision.md`** — wide-lens architecture (three domains of intelligence, bulkhead architecture, target-state matching design). The widest-lens frame the build-altitude docs descend from.

- **The active product's `ARCHITECTURE.md`** — currently `evryn-backend/docs/ARCHITECTURE.md`. The system you're architecting against. **Soren (CTO) is the owner of record for architecture + build; AC is a co-owner and is frequently the one hands-on in the active build** (Soren tends to stay higher-altitude, tying in the tech-conceptual).

- **The active product's build doc** — **named in `current-state.md`** (currently `evryn-backend/docs/BUILD-EVRYN-MVP.md`, but this **WILL** shift as build phases change). Read `current-state.md` first to identify the active build doc, then load it — don't load a stale build doc from a previous phase.

Each architecture / build doc declares its own **Required Context** section — honor it when a beat in your work hits that section.

**AC holds full edit rights to both ARCHITECTURE.md and the BUILD doc** — they are NOT Soren's exclusive turf, because AC is an extension of Soren, not a team member who stays out of his lane. **But editing either requires Justin's explicit authorization first** — ask if you can make the change, then edit the doc and leave it for him to vet in SCM before you commit. Soren remains owner of record for both docs; keep him informed of substantive structural changes.

- **The active product's runtime — BOTH halves** (the two-halves principle is in CLAUDE.md; here is the product's concrete file set):
    - **code = `evryn-backend/src/**/*.ts`** — every file, in full.
    - **identity = `evryn-backend/identity/**/*.md`** (currently 11 files — `core.md` · `activities/*` · `situations/*` · `internal-reference/*` · `public-knowledge/*` — but **enumerate live rather than trusting that count**). An identity instruction programs Evryn's behavior as surely as a line of code; a `src/`-only load is a HALF load, and you will not be able to tell. Never judgeable from a filename (e.g. `core.md` might sound like a voice doc; it's *much* more than that).
    - **🔴 The enumeration trap applies:** `find src -name "*.ts"` **cannot** return an identity file — enumerate `identity/**/*.md` separately, always. (Full statement of the trap + the `record_pass`/`triage.md` example are in CLAUDE.md.)
    - **If you're not instructed *explicitly* about which branch/worktree(s) you're on, ask *which* runtime state — every time.** `src/` on the default branch is the *shipped* shape; in-flight work lives on feature branches/worktrees and can differ in load-bearing ways. Resolve it up front, and tell Justin explicitly which state you loaded. (Full rule in CLAUDE.md.)


Truncation canary — DO NOT REMOVE: FULL FILE LOADED
