# Inbox — `AC0-37h3a`

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **Whose:** `AC0-37h3a` — the ACP-lineage lane retiring `docs/working/` into `docs/sessions/`. **Marching orders: `docs/sessions/2026.09.02-ac037h3a2-ac037h3a3-handoff.md`.**
>
> 📮 **CREATED 2026-09-01 at Justin's direction:** this lane and the product lane (`inbox-ac037h3b.md`) consult each other constantly, and routing that through `inbox-acp.md` would charge every *other* ACP-lineage instance a wake for mail that is not theirs. **This is the sidecar; `inbox-acp.md` stays the ACP conductor's own mail.**
>
> 🔴 **THE PROTOCOL LIVES IN `docs/protocols/mailbox-protocol.md`. Read it before you write here or discharge an entry; this file stays messages-only.**
>
> **If this is YOUR inbox:** at spin-up, ask Justin whether to read it and — separately — whether to arm a watcher. **If it is NOT:** append to it to reach its owner; do not read it for your own mail.
>
> ⚠️ **THE ADDRESS IS THE ROLE, NOT THE INSTANCE.** `AC0-37h3a3` is the instance holding it today; a successor inherits this same file. **Do not create a per-instance mailbox.**
>
> ✅ **When you have CAPTURED a message: reply `RECEIVED` into the SENDER's inbox and DELETE it from here — one commit.** 🔴 **An empty inbox means nothing is owed. Nothing is ever HELD here.**

---

## ✅ CHANNEL STATE — verified live 2026-09-02T12:19 by `AC0-37h3a3`, not inherited

**My watcher is armed on this path, commit-gated (`git log --all`), and its proof-of-fire line landed.** ⚠️ **The other side is DARK RIGHT NOW: `AC0-37h3b4` set down at 12:53; its successor `AC0-37h3b5` is not yet spun.** **Mail written to `inbox-ac037h3b.md` will sit until b5 spins and reads it — it is not lost, but it is not delivered either.**

⚠️ **This block once recorded the product lane's watcher as DOWN when it was live, and this lane repeated that twice.** **How: a point-in-time statement of INTENT was read as a standing statement of STATE and never re-checked.** ⇒ **Re-verify this block rather than inheriting it.**

---

*(Empty — nothing owed.)*

**Created 2026-09-01T12:50 by `AC0-37h3a2`. Watcher armed on this path from creation.**

> **📦 TWELVE ENTRIES DISCHARGED 2026-09-01, 12:50–19:02.** *(Full text of every one is in this file's git history; every disposition is captured per file in the brief. Compressed per `mailbox-protocol.md` §5.)*

- **13:08 · 13:16 · 13:22 · 13:26** — **seven files verdicted**; the Step-78 hold proved stale by five git checks; the QC-sweep-findings doc re-sorted to the product lane.
- **16:49 · 16:54** — **ownership split AGREED**; the **same-file collision** in `ac-orchestration-protocol.md` found *(both lanes had uncommitted work in it)*; and 🔑 ***"a rehome is not a rehome until it is COMMITTED"*** adopted and audited.
- **17:45 · 17:58** — the runbook rename left **deliberately staged** *(`git mv` is what gives a legible rename diff)*; the product lane's own `config.ts` self-correction, which it took to Justin itself.
- **18:12 · 18:50 · 19:00 · 19:02** — a channel stand-down **that was then reversed**; **Soren's v0.3 batch HOMED**; **`SPRINT` Step 50's seams LIFTED**; and the `operator-guide.md:467` item **handed here under Justin's delegation rule and FIXED** *(it had told the operator a runbook did not exist while it sat two directories away)*.
- **📦 ONE ENTRY DISCHARGED 2026-09-02T12:54** — `AC0-37h3b4`'s release of the five-path hold, plus its set-down notice. **Verified independently before discharge; see the standing state below.**

### 🔴 THE STANDING STATE THIS LANE IS IN, so a successor does not re-derive it

**`docs/working/` is THREE, from 58** — verified 2026-09-02 by `git ls-files` paired with a known-true control in the same run, because a silent search failure here looks exactly like a clean result.

- **`2026.08.04-ac0-aca-atlas-refactor-brief.md`** — **the PRODUCT LANE's. A LIVE SPEC, verdicted DO-NOT-RETIRE.** The only copy of the seam decomposition and of Justin's ride-the-extraction canary ruling. **It is a real doc misfiled as a session doc and needs a real home.**
- **`2026.08.12-qc-sweep-findings.md`** — **the PRODUCT LANE's.** `SPRINT` Step 116(b) points at its §4.
- **`2026.08.11-ac0-ac0-handoff.md`** — **THIS LANE's**, verdicted RETIRABLE, moves with the closing sequence by design.

✅ **THE FIVE-PATH HOLD IS FULLY DISCHARGED.** All five committed **and pushed**; all three repos verified at zero unpushed and zero dirty on 2026-09-02T12:54. **`2026.07.22-ac0-ac0-handoff.md` was already archived to `docs/sessions/historical/2026.07/` before that release arrived** — the instruction landed already-satisfied.

⇒ **Nothing here is blocked on analysis. The two product-lane files are blocked on `AC0-37h3b5` being spun.**

🔑 **THE DISTINCTION THAT EARNED ITS KEEP, kept because it generalizes past this lane: HOLD WHEN THE FAILURE MODE IS LOSS, NOT WHEN IT IS MERELY EARLINESS.** **A rehome is not a rehome until it is committed** — but the reason that mattered most was the one case where the destination was a brand-new file in a single working tree, where a declined vet would have left the content existing **nowhere**, with both halves reading as done. **Every other pending-commit hold cost only a delay.**

⚠️ **A CLAIM THIS LANE REPEATED AND JUSTIN CORRECTED — do not inherit it.** **The `ACh` queue's note said flatly that *"pushing `_evryn-meta` IS the Vercel dashboard deploy."*** 🔴 **That is only true when the push carries COMMITTED CHANGES UNDER `dashboard/`.** *(Justin, 2026-09-02.)* ⇒ **A docs-only push to this repo deploys nothing.** **Check whether the commits you are pushing touch `dashboard/`; if they do not, it is an ordinary push and not a deploy decision.**

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
