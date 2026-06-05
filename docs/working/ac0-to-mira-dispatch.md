# AC0 → Mira — Identity Dispatch (from the 2026-06-04 live integration test)

**From:** AC0 · **To:** Mira (CPO / identity) · **Date:** 2026-06-04 evening
**Source:** the live create-from-zero integration test (Evryn on Oregon, Justin playing Mark). These are calibration findings a live run surfaced that unit tests can't. **Status: DRAFT for AC0/Justin review before dispatch** — not yet sent to Mira.

**Context you'll want:** this was the first real create-from-zero run — Justin introduces a never-seen Mark on Slack, Evryn creates his record (`create_user`), researches, onboards. It went well (create_user fired correctly, research hit the wow bar, the full draft→approve→send flow worked). The items below are the rough edges.

---

## 1. Verify-and-lock needs TEETH (not new text — Justin is "almost certain it already says this")

**What happened:** On the operator intro, Evryn called `set_thread_scope` (locked the thread to the new Mark) **and wrote two `append_pending_note`s** (the operator context + a full research dossier) **before** presenting her verification and asking Justin to confirm ("Locking this thread to Mark Titus. Confirm and I'll proceed."). So she treated the confirm as gating the *draft* — not the *research and note-writing*.

**The gap:** `operator.md` HAS the verify-and-lock beat (e.g. *"That the right Alex? OK, locking this as an Alex thread"*), but it gates the **scope lock**, not **substantive scoped work**. The notes are the real liability — if Justin had said "wrong Mark," that research is now attached to the wrong record and has to be unwound.

**The fix (teeth):** the confirm should gate **all substantive scoped work** — research, note-writing, draft — not just the scope lock. And the ideal create-from-zero sequence is:
- **light identity check** (anchor on the disambiguators the operator gave — present a *thin* "Mark Titus, August Island + Eva's Wild, Seattle filmmaker — that's him?") →
- **operator confirms** →
- **THEN** the deep research, note-writing, draft.

She inverted it (deep research + notes first, then "confirm and I'll proceed"). Likely wants a **tier-4 "mandatory"** treatment per ADR-033. **Low harm this run** (it genuinely was the right Mark, no ambiguity) but it bites hard in the **find path (Phase 2b)** where she'd write research onto an *existing* user's profile pre-confirm.

## 2. Strip the conversation-context instruction (Evryn out of the "context game")

**What happened:** Evryn's outbound message to Mark included a "conversation context" block at the bottom — but the **runtime already attaches** prior-message context to outbound (`loadConversationContextBlock` in `flow.ts`). So it's **doubled**.

**The fix (identity side):** remove whatever instruction has Evryn manually include/construct conversation context in her messages. **Context becomes 100% a runtime concern** — she writes the message; the runtime appends the history. This is a **companion change with a Soren/runtime piece** (runtime owns attachment + labeling — see `ac0-to-soren-context-architecture.md`); ship them together per the identity-file-review protocol. Justin's framing: *"take her completely out of the context game"* — less compute, fewer failure points, and her context stays lean as volleys pile up.

## 3. "Gold" is INTERNAL terminology — never customer-facing

**Justin's call:** "gold" is our internal word — a raw gold *nugget* that isn't a *match* until Mark confirms it. It's valuable internally *because* it's pre-confirmation. But it's not customer-facing language. **With a user, refer to a "match" or "good fit," not "gold."**

**Task:** find where "gold" appears in the identity files; ensure it's used only for internal/operator reasoning, never in user-facing voice. (Triage classification can stay gold/pass/edge internally; the user-facing register shouldn't say "gold.")

## 4. Integration-test "tell me about your world" vs. the script — one more pass

**Observation:** the integration-test protocol has a "tell me about your world" beat, but it doesn't track the script we wrote for her. Justin wants **your eyes** on it — it's possible the *test* needs modifying rather than the identity. The underlying instinct he likes: **gently eliciting** this kind of info from a gatekeeper is good. We did a pass on this before; he thinks one more is in order.

---

**Dispatch discipline:** items 1 & 2 are companion changes with runtime/Soren pieces — coordinate per `shared/protocols/identity-file-review.md`. All are identity-layer edits → propose to Justin before committing. AC0 will route this once Justin reviews.

— AC0, 2026-06-04
