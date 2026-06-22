# Triage-reasoning capture on a research-driven downgrade (Justin, 2026-06-22)

> **How to use this file:** A captured hardening concern Justin raised 2026-06-22, parked here so it doesn't evaporate before it's wired into the round-2 wave. Not yet a sprint Step — AC0 folds it into the right lane (+ flags the Mira/identity side) when the lanes spin. Once it lands in `SPRINT-V0.2-HARDENING.md` + the lane brief, this file can be retired.

## The concern (Justin's words, paraphrased)
With the cost change that stops Evryn writing a prose `triage_reasoning`/pending-note on a **pass** (`record_pass` — deterministic stamp, "keep reasoning TIGHT, one line, don't write prose"), we must make sure we are **not also dropping the reasoning in the case that matters most to Mark**: a candidate that **looked like gold/edge on first read, but where Evryn's web research then surfaced a problem and she downgraded it to a pass.**

Mark is likely to catch exactly those ("hey, what about this person?"). Evryn needs to be able to say: *"Yeah — that looked good to me too at first, but then I researched and here was the problem."* If the tight-reasoning instruction suppresses the substance of a research-driven downgrade, she can't.

## Why it's real (against the runtime as of `main` 7eb6d73)
- `record_pass` (`src/triage/classify.ts`) writes `triage_reasoning` **only if** Evryn passes `args.reasoning`, and the tool description tells her to keep it *"TIGHT (one line)… don't write a prose note."* That guidance is right for the silent-majority pass (~6k/mo) — wrong for the **non-obvious downgrade**, which is precisely the case Mark will question.
- The deterministic CONTACT pending-note stamp carries **no substance** ("emailed <gk>, Evryn chose not to connect") — by design.
- So on a looked-gold-then-passed item, the "here's what my research found" narrative can be lost unless `triage_reasoning` deliberately captures it.

## Fix direction (to re-derive cleanly with DC/QC + Mira — NOT settled)
Three coordinated surfaces:
1. **`record_pass` tool description (runtime — Lane B owns the MCP-tools region of `classify.ts`):** soften "always tight" to *tight by default, BUT capture the substantive why when the call was non-obvious — especially a gold/edge first-read that research downgraded to a pass.*
2. **`triage.md` (identity — Mira's; AC owns the mechanics, coordinate):** instruct Evryn that when research flips an initial gold/edge read to a pass, she records the "looked promising, but research surfaced X" reasoning, because she may need to explain it to the gatekeeper later.
3. **Retrieval path (runtime — verify, may be a gap):** when Mark later asks about that person, can Evryn actually surface the prior `triage_reasoning`? Re-triage reads prior history via the ADR-036 FK (`original_from_user_id`), but a gatekeeper *question* (`processDirect` from Mark) does not obviously load the contact's prior item. Confirm the reasoning is retrievable in the gatekeeper-question pathway, or it can't be voiced to Mark.

## Justin's refinement (2026-06-22) — the boundary + the open tension
Justin sharpened the boundary on *when* reasoning gets written, and surfaced a real tension to work out:
- **Slam-dunk passes → NEVER write reasoning.** In the cost design, the cheap pre-screen tier (the planned **Haiku pre-screen**, sprint Step 44 / the cost-levers thrust — note: *not yet built; v0.2 is currently Opus-for-everything*) handles the obvious-junk passes; those can be assumed to *never* need an explanation, so no reasoning at all.
- **The rest escalate to Opus → Evryn decides per-item: does this need any reasoning?** Default is still no prose.
- **When yes, it's only a few lines** — e.g. *"looked like it had potential, but research suggested xyz problem"* or *"was an 'edge', but [gatekeeper uuid] said no for xyz reason."* Not a prose essay.
- **OPEN TENSION (work this out — don't assume):** in exactly those non-obvious cases, the reasoning is likely *already in Mark's conversation history* (the `messages` thread), so writing a separate `triage_reasoning` may **double the work / duplicate the record.** Before building, resolve: is the conversation-history copy sufficient and retrievable when Mark later asks, or do we still need a compact `triage_reasoning` stamp as the durable handle (the item TTLs at 6mo; convo history doesn't)? The answer decides whether this is a tool-description tweak, an identity beat, a retrieval-path fix, or some combination. This is the "stuff to work out" — a design call for the owning lane, surfaced to Justin in the 3-part form.

## Where it slots
Primarily a **triage-reasoning-capture** item — touches **Lane B** (record_pass tool region) + **Mira/triage.md** (identity) + a **retrieval-path check**. AC0 to wire into the sprint + Lane B brief and flag the Mira side at lane-spin time. Re-derive against the real runtime + clean DC/QC; don't inherit any of the above as settled.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
