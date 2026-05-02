# Mira Brief — 2026-05-01 — Three Identity-Craft Items from Phase 2 Run

**From:** AC0 (the Phase 2 conversation instance)
**To:** Mira
**Status:** Background dispatch. Justin and AC0 are continuing the Phase 2 integration test. These three items surfaced during yesterday's run and need your craft. Pick order at your discretion — they're independent, not blocking.

---

## Why this exists

The canonical v0.2 integration test Phase 2 ran yesterday (2026-04-30). Verify-and-lock-first beat passed cleanly post-deploy. Research pass was strong but Evryn drifted into performance in her first email draft and broke a process-commitment to Justin via a separate cron-Evryn invocation. Three identity-craft seams emerged. Full context: [`_evryn-meta/docs/sessions/2026-04-30-canonical-phase2-run.md`](2026-04-30-canonical-phase2-run.md) — read that first; it's load-bearing for understanding the *why* behind each item below.

Two of these three items are already in the [evryn-backend SPRINT-MARK-LIVE.md backlog](../../../evryn-backend/docs/SPRINT-MARK-LIVE.md) (commit `7d5b79d`) — written there for tracking, not as the brief. This doc is the actual brief.

---

## Item 1 — Onboarding "follow your curiosity" affordance

**The observation.** Yesterday Evryn researched Mark Titus before introducing herself. She hit the major public beats well — trilogy, NCIS reach, Eva's Wild origin, Duncan endorsement, "save what you love" frame, joy-as-frame. But she missed inside details that were *publicly available* with a deeper hunt: F/V Ava Jane (his drag-net boat in Bristol Bay, plausibly the Eva connection she correctly held back from claiming), four-time Sundance, the addiction/recovery arc *The Wild* is partly about, recent 2025 Pebble Mine political context.

**The shape that's missing in onboarding.md.** The "Look Them Up" pattern at line 28 has *"Hold what you found with humility"* and *"Lead with breadcrumbs, not summaries."* It tells her to be careful with what she finds — but doesn't explicitly invite *going deeper when something pulls at her*. She's calibrated to humility; she's under-calibrated to curiosity-as-craft.

**Justin's framing.** *"If you surface something in research that intrigues you, feel free to hunt it down."* The intuition: research-as-care has two halves — restraint about what you do with it (already covered) AND depth in pursuit of it (missing).

**What to add.** A beat in the "Look Them Up" pattern naming curiosity-led hunting as *part* of the craft. Same discipline applies (humility, ask-rather-than-state, transparent provenance) — just explicitly extend the invitation to go deeper when a thread pulls.

**Test signal.** Once shipped, re-run a research pass on Mark (or another candidate). Does richness scale? Does she follow open threads she previously dropped?

---

## Item 2 — Identity addition: Evryn owns her user relationships

**The observation.** During Phase 2 turn two, Evryn asked Justin (operator) *"anything you want me to not lead with?"* — a sensible calibration question, but one that revealed a posture ambiguity underneath: *does the Operator decide how Evryn opens her relationships, or does the Operator provide context while Evryn shapes the relationship?*

Justin's instinct, expressed back to her: *"This is your relationship you're starting with him — lead how you want to lead. I think you have good instincts."*

**What's missing in identity.** Currently nothing names this at the principle level. `operator.md`'s "Working with Users" section (line 82-92) covers *capturing* user information from the Operator, *researching* a user the Operator introduces — but doesn't name the deeper "your relationships are yours" stance. Without it, she may default to seeking permission rather than expressing agency.

**Candidate placement.** Most natural fit: a paragraph in `operator.md` (possibly in or near "Working with Users") framing the Operator handoff as: *"the Operator brings them in; you build the relationship from there. Use the Operator's framing as context, lead how you'd lead."* Could also live in `core.md` if you want it more foundational.

**Why this matters beyond ergonomics.** This connects to permission-not-compulsion (already in core.md) and to the broader peer-not-tool posture. When Evryn defers to the Operator on *how to relate to a user*, she flattens herself into a delegate. The whole architecture of Evryn-the-broker assumes she's exercising her own judgment in connection — and that includes the connection she's forming with the user, not just the connections she brokers between them.

---

## Item 3 — Process-commitments-as-pending-notes — design conversation

**This one isn't a quick edit. It's a real design conversation with Justin.**

**The observation.** Yesterday in the Phase 2 Slack thread, Evryn told Justin *"I'll wait on the outbound path you're working out before drafting again."* 40 minutes later, the daily proactive cron ([poll.ts:312 `checkProactiveOutreach`](../../../evryn-backend/src/email/poll.ts#L312)) fired in a different invocation context — fresh Evryn, no `operator.md` loaded, fresh prompt asking *"is there anything you want to bring up, follow up on, or initiate?"* — and that Evryn drafted a fresh email anyway.

The cron-Evryn read the conversation history (the Slack thread is in `getRecentMessages(Mark.id, 50)`) and *could* have seen the "I'll wait" promise as text in transcript — but the promise wasn't a structured binding note anywhere. So it didn't bind.

**Verified state from yesterday:**
- Mark's `pending_notes` count: 2 (research note + operator-intro note from earlier in the day; nothing about the promise)
- Operator's `profile_jsonb`: unchanged — story empty, pending_notes empty
- The promise lives ONLY as words in Slack thread history

**The architectural problem.** Onboarding.md frames `pending_notes` as user-substantive (line 90: *"Would a future version of me be better at serving this user if I knew this?"*). A process-commitment between Evryn and the Operator about a user is *not* user-substantive in that test's sense — it's coordination state. So under current discipline, it doesn't pass the test for capture. **But for cron-Evryn-tomorrow, the promise IS load-bearing** — she'd want to know *"I committed to waiting pending the outbound-path decision."*

**Three candidate fixes — design with Justin which is right:**

**(a) Expand the pending_notes test.** Current: *"would a future me be better at serving this user if I knew this?"* — could expand to *"...or be better at coordinating with the Operator about this user?"* This admits process-commitments as legitimate notes. Question: does that broaden the field too much? Pending_notes could fill with coordination ephemera that isn't really durable.

**(b) Operator-profile gets a `commitments` section.** Operator profile is already meant for working-knowledge of the partnership. Could carry "active commitments to Justin re: specific users" as structured items there. Discipline check: does this break the 100% public-safe rule? Probably not — *"I told Justin I'd wait on the Mark email pending outbound-path decision"* is fine for a billboard. Question: how does it get cleared when commitment is fulfilled?

**(c) Slack-thread-state-as-source-of-truth.** Don't try to capture commitments anywhere structurally; just make sure cron-Evryn loads enough thread context to see them as binding. This is partially a runtime fix (cron loads operator.md, cron sees recent operator-thread history, cron applies scope-thread discipline). DC has been briefed on the cron-loads-operator.md piece. Question: is identity-side also needed (e.g., a beat in operator.md saying *"check active threads before initiating"*) or is the runtime sufficient?

**Process for this item.** This is real Mira-Justin design conversation, not an edit. The right shape: surface the question, propose tradeoffs, get Justin's read, then write the language (which will likely be small once the design is decided).

---

## Coordination notes

- **AC0 is the Phase 2 conversation instance.** Don't write to `evryn-backend/identity/` files directly without coordination — AC0 might be working those at the same time. Use the AC↔Mira mailbox protocol for coordination if any item lands during active Phase 2 work.
- **DC will be working on a cron architecture fix in parallel** — the cron-loads-operator.md piece (related to item 3 above). If your design conversation on item 3 produces identity-side language, coordinate with DC's runtime fix so they companion-ship.
- **None of these are blocking the integration test.** They're post-test work. Don't rush.

— AC0, 2026-05-01

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
