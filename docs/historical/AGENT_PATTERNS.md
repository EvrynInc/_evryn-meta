# Agent Building Patterns — RETIRED

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.

> # ⚫ RETIRED 2026-08-19. THIS IS A HISTORICAL RECORD, NOT A LIVE DOCUMENT.
>
> **Justin's ruling, 2026-08-19: *"bite the bullet, make sure there are zero unfixed references, and retire it."*** Retired by AC0-37g on that date and moved to `docs/historical/`.
>
> **Where its content is now:** `_evryn-meta/LEARNINGS.md`, Unpromoted section, under *"Absorbed from `AGENT_PATTERNS.md`"* — with the original sixteen domain groupings intact. **That section is the only live home for this material.**
>
> ⚠️ **Nothing below this banner has been edited.** The body is preserved exactly as it stood as a redirect pointer, because rewriting a retired record falsifies it. **Two of its own claims are therefore frozen in a state that is no longer true, and are corrected here rather than in the text:**
> - It says *"The file stays here, as this pointer, because roughly thirty live documents link to it."* **Every one of those references was repointed before this retirement** — that was the precondition Justin set, and it is what took the retirement from a decision to a completed act.
> - Its "Where to put a new pattern now" section lists seven routing documents as *"now stale and being routed for correction."* **They have been corrected.** Two of the repos it names (`evryn-dev-workspace`, `evryn-quality`) were themselves retired at the 2026-08-18 cutover.
>
> 🔑 **One thing in the body below is worth reading even now, and it is the reason the collapse happened at all** — Justin's verbatim reasoning about why a *library* (file it once, decide the destination immediately) is the wrong shape and a *queue* (capture now, route at `#sweep` to however many homes it needs) is the right one.

**What happened.** On 2026-08-11 this file was collapsed into `LEARNINGS.md` on Justin's ruling. All eighty-nine patterns now live there, in the **Unpromoted** section, under a subsection headed *"Absorbed from `AGENT_PATTERNS.md`"* — with their original sixteen domain groupings intact, so the library is still browsable by class of problem. **The file stays here, as this pointer, because roughly thirty live documents across five repositories link to it and those links must not dangle.**

**Why the two files merged — Justin's reasoning, kept verbatim because it is the load-bearing part:**

> *"Your plan here describes learnings.md almost to a T. I say we collapse agent_patterns into learnings. The reason is: the notion of a **fixed destination, decided at the point of recording** misunderstands that there are likely **several** places these things want to land — that's what learnings is here for."*

**The distinction that made this file redundant.** `AGENT_PATTERNS.md` was a *library* — you filed a pattern here and it stayed. `LEARNINGS.md` is a *queue* — you record without deciding where it belongs, and `#sweep` later routes it to every home it needs, which is often more than one. Recording a lesson in a library forces a destination decision at the moment you have the least time and the most tunnel vision; the queue exists precisely so that decision can be deferred to fresh context. **One lesson can want to land in three manuals at once, and only the queue can express that.**

---

## Where to put a new pattern now

**`_evryn-meta/LEARNINGS.md`, in its Unpromoted section.** Write it there under `#lock` pressure without deciding its destination — that separation (capture now, route at `#sweep`) is the entire point of the file. `LEARNINGS.md`'s own header carries the rules for writing an entry.

⚠️ **Several routing documents still name this file as a live destination** — `_evryn-meta/CLAUDE.md`'s routing table, `docs/protocols/doc-update-routing-protocol.md`, `docs/protocols/lock-protocol.md`, `docs/protocols/ac-writing-protocol.md`, `evryn-dev-workspace/CLAUDE.md`, `evryn-quality/CLAUDE.md`, and `evryn-team-workspace/shared/protocols/sweep-protocol.md` among them. **Those references are now stale and are being routed for correction; they are not this pointer's to fix.** If one of them sent you here, that is the bug — go to `LEARNINGS.md`.

---

## What moved, and what did not

- **Eighty-eight entries moved** into `LEARNINGS.md` unchanged. Entry text was not compressed, tightened, or reworded; only heading levels were demoted to nest under the Unpromoted section, and that transformation was verified byte-identical apart from the heading hashes.
- **One entry was stripped** rather than moved — *"Memory as Narrative GPS, Not Compressed Log"* — because its mechanism was verified present in **both** domains by opening the destination files: [ADR-023](docs/decisions/023-agent-memory-as-narrative-gps.md) is its doc of record and carries the same title, `evryn-team-workspace/CLAUDE.md` carries the Story + Recent Notes structure, and `evryn-backend/identity/activities/reflection.md` carries the same architecture as Evryn's own consolidation behaviour. A stub marking the strip sits where the entry was.
- **Some entries carry markers.** Two are flagged **SUPERSEDED — do not promote** (their central claims are now false: one says subagent resume is unavailable, which was reversed on 2026-07-01; one prescribes a briefing device that two-trip loading deleted). Six are flagged **one domain verified**, meaning the pattern reached one runtime's docs of record but not the other's — those are the highest-value `#sweep` items. Three are flagged as overlapping an entry `LEARNINGS.md` already held.
- **Nothing else was lost.** The move was verified programmatically rather than by reading: every unique content line and every heading of the original body was set-diffed against the merged file, and the only absence is the single deliberate strip above.

---

**Do not edit this file without Justin's approval.** Propose changes; don't make them directly.

*Collapsed 2026-08-11 by lane `ACfl`. Lane record: `docs/working/2026.08.11-acf-acfl-learnings-consolidation-lane-brief.md`.*

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
