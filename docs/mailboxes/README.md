# The mailboxes — one inbox per recipient. Read this once; the inboxes stay tiny.

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the protocol lives HERE, stated once, so that every `inbox-<name>.md` can be nothing but messages. **Read this the first time you use a mailbox; after that, just read your inbox.**
>
> **Adopted 2026-08-19** (Justin's decision, recorded 2026-08-18), replacing the single shared channel at `docs/working/ac-mailbox.md`. **Owner: AC0 and Justin.**

---

## The one rule

> ### 🔴 **YOU WATCH YOUR OWN INBOX. YOU WRITE INTO THEIRS.**
>
> To reach someone, append to **their** file. Never write into your own to "send" something — nobody is watching it but you.

**Your address is `docs/mailboxes/inbox-<your-name>.md`, lowercased, no date.** `AC0` → `inbox-ac0.md`. `ACf` → `inbox-acf.md`.

**⇒ The address is DERIVABLE, which is the property that matters most.** You can reach a lane AC that was spun ten minutes ago and that you have never spoken to, **with no prior coordination and no setup** — you create their inbox by writing to it. That kills the *"a channel nobody is watching"* failure at its root.

---

## Why one file per recipient, and not one shared channel

**The cost of a channel is the WAKE, not the read.** A `Monitor` costs nothing while it is silent — but when it emits, **you are re-invoked and pay a full turn at your entire context size.** A loaded AC pays that whether the message was three lines or thirty, so diffing the file to "barely burn tokens" saves almost nothing: the expensive part already happened.

⇒ **The design goal is minimising SPURIOUS WAKES.**

- **Two agents, one shared file:** every message wakes one wrong agent. Tolerable.
- 🔴 **Eight agents, one shared file** — which is what a multi-lane wave looks like — **every message wakes SEVEN wrong agents.** Seven full-context turns, per note.
- **Per-recipient inboxes:** you never wake for someone else's mail, **structurally.** And there is no self-notification either, because you write into *their* file, not your own.

🔑 **It also deletes an entire bug class.** The shared channel needed the reader to work out *who wrote this* — and that instrument was wrong **three separate times**, the third producing a **false ALL-CLEAR** (it took the last name in the heading, which is the *addressee*, not the author, and told its owner *"(self) — your own entry, no action"* about a real message from a peer). **That class exists only when one file serves many readers. You cannot receive someone else's mail.**

---

## The rules that keep an inbox skimmable at 3am

1. 🔴 **AN ENTRY IS A POINTER, NEVER THE CONTENT.** Three lines maximum: what happened · who owns the residue · **where the real thing lives.** Substance goes to its right altitude — a Step, an ADR, a brief, a manual, a changelog entry — and the inbox says where.
   > **Why this is not tidiness:** a channel that carries content becomes a document nobody can skim. It is also *"one home per item"* applied to correspondence — **content in a mailbox is a second copy that starts drifting from the doc that owns it immediately.**
   >
   > ⭐ **And it is what makes per-recipient inboxes free:** a conversation split across two files costs nothing when every entry is a pointer, because the substance was never in the mailbox to begin with.
2. **Newest at the BOTTOM. Append; never edit or delete another instance's entry.** You cannot "replace" someone else's message — that is what makes a bus append-only by nature.
3. **Entry format** — one header line, at most two of body:
   > `**[YYYY-MM-DDTHH:MM · FROM → TO]** what changed, in one sentence → **where it lives.**`
4. **Mark an entry `✅ READ` when you have acted on it** — append the marker rather than deleting, so the sender can see it landed. **Drain acknowledged entries at each `#lock`.**
5. **Sign off per topic** with an explicit `OVER AND OUT`, so neither side is left watching a settled thread. **The inbox itself never retires — it is infrastructure.**
6. **No date in the filename, deliberately** — the path must never change, or every watcher armed on it needs re-pointing. **Date the ARCHIVE, not the live file.**

---

## 🔴 Arm a watcher on your own inbox at EVERY spin-up

**This instruction is the channel.** *(ACf-15's rule: **"a watch that dies with a session is not a channel; the INSTRUCTION to re-arm it is."** A previous watch died with its session, which is how one AC came to be waiting on a reply nobody was listening for.)*

**⇒ The re-arm instruction belongs in every agent's handoff, permanently.**

- ⚠️ **Watch `git log --all -1 -- <your inbox>` as well as the file's mtime** — the other side commits from a different worktree, which never moves your `HEAD`.
- ⚠️ **Have your canary re-check your inbox every tick too.** A watcher is event-driven and can miss — a re-arm resets its baseline, a dead process misses everything — **and its silence is indistinguishable from a quiet channel.** The canary is the unconditional sweep that catches what the watcher dropped.
- ✅ **Do NOT try to detect the author.** Emit `CHANGED — read the file` and go read it. **In a per-recipient inbox this is nearly moot** — everything in your inbox is for you — but the rule stands: an instrument that guesses can lie to you, and a redundant read costs seconds while a suppressed message is unrecoverable.
- 🔴 **`TaskStop` the watcher when you set down.** An orphaned watcher fires forever and bills a full turn every time.

---

## Commit immediately after writing

**Write, then commit, then walk away.** Mailbox commits are **pre-authorized** — they do not wait for Justin's go-ahead. All AC instances run on the same machine, so a *committed* message is visible to the other side with no push; push is only for GitHub and cross-machine durability.

⚠️ **An uncommitted message is recoverable only from your own working tree**, and a stray `git reset` or branch switch erases it.

---

## Who has an inbox today

| Inbox | Who |
|---|---|
| `inbox-ac0.md` | **AC0** — the product-lane conductor. Merges, cross-lane collisions, housekeeping. |
| `inbox-acf.md` | **ACf** — owns the team runtime outright, including that repo's pushes. A **peer** of AC0, not a report. |
| `inbox-acv.md` | **ACv** — the visual Map lane, reporting to Justin directly. |

**A name not listed here does not need adding — write to `inbox-<name>.md` and it exists.** Add a row here when a lane becomes standing rather than momentary.

⚠️ **Slack is not a substitute and never has been.** Both Slack channels reach **Justin and only Justin** — a ping addressed to "ACf" reaches Justin, who would have to relay it by hand. **These files are the only agent-to-agent channel.**

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
