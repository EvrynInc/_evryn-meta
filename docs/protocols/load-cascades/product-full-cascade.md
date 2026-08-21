# Full Startup Context Cascade — Evryn product (`evryn-backend`)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the **self-sufficient load list** for doing *or directing* build-level work on the **Evryn product** (`evryn-backend`, "Gatekeeper's Inbox," live on Railway). Load the **Light Startup Context Cascade** (`_evryn-meta/.claude/agents/ac.md`) first, then execute this file **top to bottom, in order**. You should be able to do your **entire** full load from this file alone — every step is here.
>
> **When Justin calls this cascade, load every step IN FULL.** He invokes it only when the work needs the heavy load, so there is nothing for you to trim, skim, or defer-to-claim-time. Trimming a load he called is not your judgment to make — if a step looks unnecessary, flag it (see ⚑ below); don't silently drop it.
>
> **Owner: AC.** Edits need Justin's approval (propose first). Keep in lockstep with the product runtime.

---

## Before loading

- **Confirm WHICH runtime state you're loading.** `src/` on `main` is the *shipped* shape; in-flight work lives on feature branches / worktrees and can differ in load-bearing ways (whole modules added, rewritten, or deleted). If you weren't told which branch/worktree — or told only "main" when the live work may be a held bundle on a worktree — **resolve it before you load, then tell Justin explicitly which state you loaded.** Reading `main` while the live work sits on a worktree = orchestrating blind. (He may also want you to read `main` *in addition to* a worktree, to see the contrast.)
- **Honor each doc's own Required Context.** Several docs below declare a Required Context section — when a beat in your work hits it, load what it names.

## The load — IN ORDER (intended shape first, runtime last)

The order is deliberate: arch → build → sprint teach the **intended** shape, so that when you finally read the runtime it reads as a **diff against intent** and divergences pop — a spec-runtime mismatch, or a sprint item marked "todo" that you then see already shipped in the code. Load each **in full**.

1. **`_evryn-meta/docs/hub/technical-vision.md`** — the widest-lens architecture (three domains of intelligence, bulkhead architecture, target-state matching design). The frame the build-altitude docs descend from.
2. **`evryn-backend/docs/ARCHITECTURE.md`** — the system you're architecting against (the *intended* shape). **Soren (CTO) owns it of record; AC is co-owner with full edit rights, often hands-on** (editing it needs Justin's explicit authorization first; keep Soren informed of substantive structural changes). Stable for the repo's life — named directly here.
3. **The active BUILD doc** — currently **`evryn-backend/docs/BUILD-EVRYN-MVP.md`**. ⚑ **Confirm it is still the active build in `current-state.md` before trusting it** — build docs shift by phase; don't load a stale one. (`BUILD-EVRYN-v0.3.md` and `BUILD-FUTURE.md` also exist and are NOT the active build.)
4. **The active SPRINT doc(s)** — currently **`evryn-backend/docs/SPRINT-V0.2-HARDENING.md`** + **`evryn-backend/docs/SPRINT-v0.2-optionals.md`**. ⚑ **Confirm the active set in `current-state.md`** — sprints churn faster than anything else here.
5. **Skim two changelogs** (~30 seconds each; top ~100 lines newest-first + `## <date>` section headers):
   - **`evryn-backend/CHANGELOG.md`** — what recently **shipped** to the product; keeps you from re-proposing a shipped thing or being surprised by it in the runtime.
   - **`_evryn-meta/CHANGELOG.md`** — the **meta** changelog, read by every AC on load: it carries changes to your operating manual (`.claude/agents/ac.md` — and to `dc.md`/`qc.md`/`oc.md`), the router (`CLAUDE.md`), the protocols, and the cascades — things the product changelog won't show you.
6. **🗺️ THE CODE ATLAS + THE DEPENDENCY MAP — the two targeting instruments. Read the Atlas's `00-INDEX.md` first; page the sections your work touches.** *(Added 2026-08-12 at Justin's direction. This step was missing entirely — the Atlas landed on `main` and the cascade that every product build loads never learned it existed.)*
   - **`evryn-backend/docs/atlas/`** — **12 sections, ~3,100 lines: a complete, non-overlapping partition of all 45 `src/` files PLUS the identity half.** Each invariant it records is tagged **STRUCTURAL** (the code makes violation impossible) or **INSTRUCTIONAL** (a comment asks nicely) — **that tag is its most valuable content**, because it tells you whether you are protected or merely advised. **`00-INDEX.md` states each section's exact file set**, which is what makes a *targeted* load possible instead of a 20,000-line one.
   - **`evryn-backend/docs/dependency-map.md`** (+ `.json`) — **a SEPARATE, machine-generated artifact, not part of the Atlas.** The Atlas calls it *"the companion instrument."* **Regenerate with `npm run depmap`** — it is byte-identical on re-run against unchanged code, so **a non-empty diff on the `.json` means the import graph actually moved.** ⇒ **Use it, not a grep, to answer *"what imports X?"*** ⚠️ Its generation stamp is always one commit behind **by construction** — that is not staleness, and at least one agent has already misread it as such.
   - 🔴 **BOTH ARE INDEXES. NEITHER IS A SUBSTITUTE FOR READING THE RUNTIME — and this exact substitution has already cost us once.** Docs were reconciled, people concluded they could skip `src/`, and it burned us. **A confident agent holding a map is not the same as an agent that has looked.**
   - ⚠️ **Two known-false claims remain in the Atlas** — §11's flagship "cannot fail" specimen is **stale**, and §4.6 disagrees with `identity/situations/operator.md` about whether thread scope is deliberately locked. **Read `_evryn-meta/docs/working/2026.08.12-qc-sweep-findings.md` §4 before trusting a specific Atlas claim** *(a session doc — if that path has moved, it is under `_evryn-meta/docs/sessions/` or `docs/sessions/historical/YYYY.MM/` filed by the date in its own filename. **Session-doc paths are not proactively maintained, but if you see this has moved repoint this reference.**)*, and treat a `STRUCTURAL` tag as an assertion to verify rather than a guarantee.
   - ✅ **Two others this warning used to name are now REPAIRED — do not go looking for them** *(verified at source by ACv, 2026-08-19; corrected on Justin's approval)*. **§07** no longer describes the halt sentinel's delimiters as spaces: it states the NUL-byte truth **and** preserves why three separate readers got it wrong. **§03**'s cursor-advance headline reads correctly and has since been *sharpened*, flagging the property as structural at the check but **instructional at the wiring**. Both were fixed by SPRINT Step 106, merged 2026-08-17.
   - 🔑 **Why this correction mattered enough to make:** a stale distrust-list is the bad-map failure aimed at the *warning* rather than the map. An agent told to distrust a repaired section either burns a lane re-deriving something settled, or — worse — "fixes" a correct claim back to the wrong one. **The Atlas only works if it is trusted, and this list eats that from the other side. Keep it current or delete it.**
   - **Its currency is not optional:** a build that moves, splits, renames, adds or deletes a module — or creates/removes a dependency edge — **is not done until the Atlas reflects it, in the same commit or merge.** (`_evryn-meta/.claude/agents/ac.md`, Documentation Approach → the Atlas standing order.)

7. **The runtime — BOTH halves, enumerated LIVE, every file in full:**
   - **code = `evryn-backend/src/**/*.ts`** — every file.
   - **identity = `evryn-backend/identity/**/*.md`** — every file (currently 11: `core.md` · `activities/*` · `situations/*` · `internal-reference/*` · `public-knowledge/*` — but **enumerate live; do not trust that count**).
   - 🔴 **The enumeration trap:** `find src -name "*.ts"` **cannot** return an identity file — so any "enumerate the runtime live" recipe silently omits the identity half unless you enumerate `identity/**/*.md` **separately**. Do both, every time.

**Why the identity half is not optional** *(the identity-is-runtime teaching lives here — this is the canonical statement referenced elsewhere).* An instruction in an identity file programs Evryn's behavior **as surely as a line of code** — what she does, which tools she calls, what she must never do. A `src/`-only load is a **HALF load, and you will not be able to tell**: you'll reason confidently about a system whose behavior is half-written in files you skipped. It is never "just voice docs," and never judgeable from a filename (`core.md` sounds like a voice doc; it is far more than that). **The defect class this catches is real and invisible from the code side** — live example, 2026-07-16: Step 57 deleted `record_pass` from the code while `triage.md` still told Evryn to call it on *every* pass. A `src/`-only review passes that clean. ARCH says the *intended* shape; the runtime is the *actual* shape; the two diverge in load-bearing ways — which is exactly why you load both halves, and why you load them *after* the intended-shape docs so the divergence is visible.

## Reference only — do NOT load now (here if a task needs them)

- **`evryn-backend/docs/SPRINT-MARK-LIVE.md`** — the Mark-live sprint (the most recent prior sprint; reference).
- **`evryn-backend/docs/SPRINT-V0.3-CANDIDATES.md`** — upcoming v0.3 sprint candidates (reference).
- **`evryn-backend/docs/BUILD-EVRYN-v0.3.md`** and **`BUILD-FUTURE.md`** — future-phase build docs (reference).

## ⚑ Flag rule

If **anything** looks off as you load — a doc contradicts `current-state`, the runtime contradicts a doc, the active build/sprint you find here disagrees with `current-state`, a doc recommendation is stale, a link is broken, an identity file instructs a tool the code no longer exposes — **surface it to Justin. Never silently resolve it.** The divergence is often exactly the thing that was about to bite.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
