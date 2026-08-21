# Held session docs — the index of what cannot retire yet, and why

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> ## 🔴 ABSENCE FROM THIS FILE MEANS RETIRABLE. That inversion is the whole design.
>
> **A session doc not listed here is not held — it is a retirement candidate by default.** ⚠️ **Without that, this file is decorative**, because the dangerous failure was never a stale row. **It is a doc quietly held by nobody's decision, which is how a working folder becomes an archive nobody dares touch.**
>
> ⭐ **What licenses a default that harsh: retiring a session doc is now nearly free.** Session-doc references are no longer repointed — findability is a rule (`docs/sessions/`, or `docs/sessions/historical/YYYY.MM/` by the doc's own date), so a wrong retirement costs a `git mv` and breaks nothing. 🔴 **The two changes only work together. Do not adopt this default without that rule.**
>
> **How to use this file:** read it at `#lock`, test each condition, retire what is met, and re-justify anything that has gone stale. **Adding a row is how you hold a doc; there is no other way to hold one.**
>
> **Owner: AC and Justin.** **Status: DRAFT, 2026-08-21 — the design decisions below are not yet ratified.**

---

## The register

| Path | Why it is alive (one line) | **Retire upon** (testable) | Owner (LINEAGE) | Held since |
|---|---|---|---|---|
| *(empty — populated when `docs/working/` is retired into `docs/sessions/`)* | | | | |

---

## The five rules that make it work

**1 · 🔴 ABSENCE MEANS RETIRABLE.** Stated at the top because it is the design, not a detail.

**2 · THE CONDITION MUST BE TESTABLE IN UNDER A MINUTE.** *"Still in play"* and *"might be useful"* are true of almost everything and expire silently. **A condition someone can check as a boolean is the entire value of the file** — it converts an expensive re-derivation into a lookup.
> ⚠️ **The tell that you are holding the wrong kind of doc: if the condition you are writing is *"once its content is rehomed,"* you do not have a session doc. You have a misfiled REAL doc.** **Move it to its department's folder; do not add a row.**

**3 · THE OWNER IS A LINEAGE, NOT AN INSTANCE.** `ACP`, `ACT` — never `AC0-37h`.
> 🔑 **An instance dies at the end of its session, so an instance-owned condition is orphaned the moment it is written.** *(The same lesson the mailbox rename paid for: name the agent, not the moment.)* **A lineage persists and can be reached at `docs/mailboxes/inbox-<lineage>.md`.**
> ⚠️ **If the owner is another lineage, the checker does not act — it asks.** Without that, a cross-lane condition sits untested forever because nobody is sure whose it is. *(Live: `ac-mailbox.md` sat held for two days because one peer had not confirmed and nobody owned chasing it.)*

**4 · `HELD SINCE` IS A SIGNAL FOR A HUMAN, NOT A TRIGGER.** **The trigger is `#lock`** — every condition is tested there, every time.
> 🔴 **Deliberately NOT a day-count trigger, and the reasoning matters: a rule that fires on a clock needs someone watching the clock.** **`#lock` actually happens; a 14-day timer does not fire on its own.** *(The inverse of the mailbox drain rule, which needed a size trigger precisely because `#lock` was not being scheduled — here the tie is safe because `#lock` is where this file is read at all.)*
> **What the date IS for: reading the register and noticing that something has been "about to clear" for a month.** **That is a judgment cue, and it works without anyone remembering a threshold.**

**5 · THE FILE'S LENGTH IS ITSELF A HEALTH SIGNAL.** The only legitimate holds are in-flight sessions plus the occasional not-yet-rehomed fact — **and the second kind is a bug, not a steady state.** ⇒ **If this register passes ~10 rows, the finding is hoarding, not bookkeeping.**

---

## Design decisions still open — for Justin

**1 · Hand-maintained, or generated from banners inside the docs?**
> **Recommendation: HAND-MAINTAINED, and the reason is stronger than "it's short."** 🔴 **A generator can only read what is already in the doc — and the thing this file exists to carry, the retirement CONDITION, is a judgment that does not exist anywhere until a person writes it.** **A generator would produce a list of files. The list of files is not the hard part.** ⇒ **Generation would give us a trustworthy index of the wrong thing.**

**2 · One file for all lineages, or one per lineage?**
> **Recommendation: ONE FILE.** **The per-recipient split that was right for mailboxes does not transfer** — that design existed to stop the wrong agent being *woken*, and **nobody watches this file.** ⇒ **The cost that justified splitting is absent, and one place to look is the whole point.** **The write-collision risk is real but small:** it is edited at `#lock`, not continuously, and the owner column makes rows independent.

**3 · The staleness window.**
> **Recommendation: DROP the window; tie re-justification to `#lock`** — see rule 4. **If you want a number anyway, use 7 days to match the bulletin's**, rather than inventing a second threshold nobody will remember.

**4 · 🆕 A question the first draft did not ask: what happens when a held doc's condition can never be met?**
> **A condition can go permanently unsatisfiable** — the lane closed, the peer retired, the decision was overtaken. **Today that row would sit forever, testing false every `#lock`, looking healthy.** ⇒ **Recommendation: a condition that has been tested and failed at three consecutive `#lock`s gets ESCALATED to Justin as a decision, not re-tested a fourth time.** **Three strikes turns a silent permanent hold into a question somebody has to answer.**

---

## The `#lock` change that makes this real

**Step 10 currently makes every instance scan `docs/sessions/` and re-derive what is superseded.** ⇒ **Replace that with: read this register, test each condition, retire what is met, escalate what has failed three times.** **Re-derivation becomes a lookup.**

⚠️ **`lock-protocol.md` step 10 was rewritten by Justin on 2026-08-19 and gained step 9b on 2026-08-21 — this would be its third revision in three days. Propose it; do not edit it.**

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
