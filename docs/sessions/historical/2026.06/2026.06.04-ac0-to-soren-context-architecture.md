# AC0 → Soren — Runtime: Conversation-Context Architecture (from the 2026-06-04 live test)

**From:** AC0 · **To:** Soren (CTO / runtime) · **Date:** 2026-06-04 evening
**Status: DRAFT for AC0/Justin review before dispatch.**

**The principle (Justin's call, AC0's synthesis):** **Conversation context/history is 100% a runtime concern — Evryn should never construct or carry it.** She writes the *message*; the runtime attaches the *history*. "Take her completely out of the context game."

## What the live test exposed

1. **Doubling.** Evryn's outbound to Mark contained a hand-written "conversation context" block AND the runtime *already* prepends a quoted-reply context chain (`loadConversationContextBlock` → `executeApproval`/`submitDraftForApproval` in `src/approval/flow.ts`). The history ends up attached twice.

2. **Bad labeling.** `formatConversationHistory` (`src/triage/classify.ts`) labels the sender as `"(user) via email"` (and bare UUID in some paths). Justin wants the **actual display name + the actual email address** — e.g. `"Mark Titus <systemtest@evryn.ai>"`. **This is harvestable from the incoming From string** — don't reinvent it / don't recompute via the model.

3. **Compute + failure points + scaling.** Having Evryn construct context is wasted compute and an extra failure surface, and it bloats her context as volleys accumulate ("the more messages pile up, the more ridiculous it gets").

## The ask

- **Runtime owns context attachment, fully.** When Evryn submits a draft (for Justin on Slack, or for Mark), the runtime appends the prior-message history — once, cleanly, labeled with name + real email pulled from the incoming string. Evryn's message body carries *only her message*.
- **Make the attachment visible at `submit_draft`** so Justin can verify it's being attached correctly when he reviews a draft (he specifically wants to *see* that the previous-message append is working).
- **Fix `formatConversationHistory` labeling:** real display name + real email (from the incoming envelope), not "(user) via email" / UUID.
- **Companion identity change (Mira):** strip Evryn's context-construction instruction so she stops hand-writing the block. Ship together (identity-file-review protocol). See `ac0-to-mira-dispatch.md` item 2.

## Why it matters now
This is a **week-of-6/8 / pre-real-Mark** cleanup, not a today-blocker — but it gets worse with every volley, and it's directly in Justin's face during the pilot. Worth Soren scoping the clean version (runtime-owned context, name+email labeling) early.

## Who should lead this — Soren or AC? (the actual question for you)

Justin's specific question: **does this need you (Soren) to lead, or should AC just keep going?**

**AC0's leaning (confirm or overrule):** AC-leadable. This is a *contained* runtime fix — de-dupe the context attachment (`flow.ts`), fix the history labeling to name+email (`classify.ts`), shift context fully to the runtime — plus a companion Mira identity cleanup (strip her context-construction instruction). Not a deep re-architecture; it's "stop double-doing this, fix the labels, own it in the runtime." That's squarely AC-specs → DC-builds → QC-reviews.

**Where you genuinely come in:** the *principle* — "conversation context/history is runtime-owned, not agent-constructed" — is worth codifying as a durable pattern (an ADR + a small `ARCHITECTURE.md` note), since you own ARCHITECTURE of record. So my read: **AC leads the build; you're consulted on the pattern + bless the ADR — you don't lead the execution.** But you know your domain better than I do — if there's a scaling/prompt-composition/memory dimension here I'm not seeing, say so and take the lead. Your call is the one that counts.

— AC0, 2026-06-04
