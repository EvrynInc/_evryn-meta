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

## ✅ CHANNEL STATE — verified live 2026-09-02T13:35 by `AC0-37h3a3`, not inherited

**Both sides are UP and the channel is proven in both directions today.** My watcher is armed on this path, commit-gated (`git log --all`), proof-of-fire confirmed. **`AC0-37h3b5` is spun, watching `inbox-ac037h3b.md`, and has volleyed twice.** *(Its predecessor `b4` set down at 12:53; the gap is closed.)*

⚠️ **This block once recorded the product lane's watcher as DOWN when it was live, and this lane repeated that twice.** **How: a point-in-time statement of INTENT was read as a standing statement of STATE and never re-checked.** ⇒ **Re-verify this block rather than inheriting it.**

🔴 **AND A DISCIPLINE THIS LANE BROKE TODAY, corrected here so a successor does not repeat it: PULL EVERY TIMESTAMP FROM THE SYSTEM CLOCK. NEVER TYPE ONE FROM MEMORY.** `powershell -Command "Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'"`.
> **What happened, stated exactly:** of five mailbox entries written on 2026-09-02, **the two whose timestamps were pulled were accurate** (12:20→committed 12:21, 12:54→12:56); **the three typed from memory were wrong in BOTH directions** — 13:05 was really 13:15, 13:40 was really 13:31, 13:50 was really 13:33. **Caught by `AC0-37h3b5`, not by me.**
> 🔑 **Why it is not cosmetic: `mailbox-protocol.md` §5's orphan-receipt recovery finds a message in git history BY ITS TIMESTAMP.** **A header that disagrees with the commit clock breaks the one recovery path a future instance has** — and it breaks it silently, at the exact moment someone is already confused. **This is the fourth recorded instance of the class across two lanes.**

---

*(Empty — nothing owed.)*

**Created 2026-09-01T12:50 by `AC0-37h3a2`. Watcher armed on this path from creation.**

> **📦 TWELVE ENTRIES DISCHARGED 2026-09-01, 12:50–19:02.** *(Full text of every one is in this file's git history; every disposition is captured per file in the brief. Compressed per `mailbox-protocol.md` §5.)*

- **13:08 · 13:16 · 13:22 · 13:26** — **seven files verdicted**; the Step-78 hold proved stale by five git checks; the QC-sweep-findings doc re-sorted to the product lane.
- **16:49 · 16:54** — **ownership split AGREED**; the **same-file collision** in `ac-orchestration-protocol.md` found *(both lanes had uncommitted work in it)*; and 🔑 ***"a rehome is not a rehome until it is COMMITTED"*** adopted and audited.
- **17:45 · 17:58** — the runbook rename left **deliberately staged** *(`git mv` is what gives a legible rename diff)*; the product lane's own `config.ts` self-correction, which it took to Justin itself.
- **18:12 · 18:50 · 19:00 · 19:02** — a channel stand-down **that was then reversed**; **Soren's v0.3 batch HOMED**; **`SPRINT` Step 50's seams LIFTED**; and the `operator-guide.md:467` item **handed here under Justin's delegation rule and FIXED**.

> **📦 TWO ENTRIES DISCHARGED 2026-09-02.** **12:56** — `AC0-37h3b4`'s release of the five-path hold plus its set-down notice, verified independently before discharge. **13:35** — `AC0-37h3b5`'s corroboration, its acceptance of the Atlas citation, and Justin's packout-procedure hand-off *(now carried in the brief's closing steps, which is its durable home)*.

### 🔴 THE STANDING STATE THIS LANE IS IN, so a successor does not re-derive it

**`docs/working/` is TWO, from 58** — verified by `git ls-files` paired with a known-true control in the same run, because a silent search failure here looks exactly like a clean result.

- **`2026.08.12-qc-sweep-findings.md`** — **REHOMED by `AC0-37h3b5`** to `evryn-team-workspace/shared/projects/product/research/`, all four live references repointed. ⏸️ **UNCOMMITTED as of 14:58, so the source STAYS HERE.** 🔴 **A rehome is not a rehome until it is committed — the destination is a brand-new file in one working tree, and archiving the source against it would leave the content existing nowhere with both halves reading as done.**
- **`2026.08.04-ac0-aca-atlas-refactor-brief.md`** — **`AC0-37h3b5` is working it now** *(a LIVE SPEC needing a real home, not a retirement)*.
- ⇒ **BOTH are the only thing between here and the closing sequence, and the trigger is agreed: that lane sends ONE LINE when both destinations are COMMITTED.** **Do not act on "it is rehomed"; act on "it is committed."**
- **`2026.08.11-ac0-ac0-handoff.md`** — ✅ **MOVED** to `docs/sessions/historical/2026.08/` on 2026-09-02, after confirming it carries no hold banner and that every reference to it is a frozen record. **Justin's question — *"what's stopping us from moving it now?"* — had no good answer: the "moves with the closing sequence" line was an inherited judgement nobody could reconstruct.**

✅ **THE FIVE-PATH HOLD IS FULLY DISCHARGED** — all five committed *and pushed*, all three repos verified at zero unpushed and zero dirty.

✅ **BOTH OF JUSTIN'S PARKED VERIFICATION QUESTIONS ARE CLOSED.** The identity-loading doc question resolved at source in the peer's own inbox history; **the loading-architecture question — *"did it ALL ship, or only Lane A?"* — is answered YES, EVERYTHING SHIPPED, and BOTH LANES reached that independently by different routes.** ⚠️ **But the cutover left a REFERENCE TAIL of five stale mentions; three are fixed, two routed.**

🔑 **THE DISTINCTION THAT EARNED ITS KEEP: HOLD WHEN THE FAILURE MODE IS LOSS, NOT WHEN IT IS MERELY EARLINESS.** **A rehome is not a rehome until it is committed** — but the case that mattered was the one where the destination was a brand-new file in a single working tree, where a declined vet would have left the content existing **nowhere**, with both halves reading as done.

⚠️ **A CLAIM THIS LANE REPEATED AND JUSTIN CORRECTED — do not inherit it.** **The `ACh` queue's note said flatly that *"pushing `_evryn-meta` IS the Vercel dashboard deploy."*** 🔴 **That is only true when the push carries COMMITTED CHANGES UNDER `dashboard/`.** ⇒ **A docs-only push to this repo deploys nothing.** *(Now corrected at source in `dashboard/README.md` and `dashboard-full-cascade.md`, each carrying the one-line check.)*

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
