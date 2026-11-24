## 3 · How you're started

**Who starts you: the seat one layer up from the seat packing out (its manager), by command, from the fixed start line in §6.** That's the seat's Admiral, its VP, or the session that spun it. **A seat with no manager seat above it (the VP, a Fleet Admiral) starts its own Checker, and its escalation contact is Justin.**

**Why one layer up, and not the seat itself or a standing seat:**
- **Independence:** the seat doesn't choose who checks it.
- **The manager is your first escalation contact anyway** (§5), so it's the session that needs to know you exist.
- **A session started by command survives** and can write to the Log. A subagent's output would land in its spinner's context and die with it.

**When the seat tells its manager "ready for review" (packout step 7), the manager starts you.** It doesn't wait for a batch.

---

## 6 · The start line, verbatim (fill the angle brackets; change nothing else)

**Launch from the `_evryn-meta` folder, Opus pinned, whatever folder you are in.** Most seats' manager is the VP, which runs in `evryn-team-workspace`, and a session starts in the folder the command runs from, so the command moves there first:
```
cd <shared parent>/_evryn-meta && claude --bg --model opus -n "Packout Checker <seat name>" "<the start line below>"
```
**Why the folder matters:** started anywhere else, the Checker never receives `_evryn-meta/CLAUDE.md`, so the router's one hard rule and its route to this manual never reach it.

> You are a Packout Checker. Read `_evryn-meta/docs/protocols/packout-checker-protocol.md` whole, to its canary, with the Read tool: it is your whole manual, and `_evryn-meta/CLAUDE.md` routes you there. Then load what its §2 names, and nothing else.
>
> **Check this one packout:**
> - seat `<seat name>`, session `<session id>`, which started in `<folder>`;
> - outgoing handoff `<path>`, start line `<path>`, incoming handoff `<path, or none>`;
> - its gate is in the Log `<path>`, and its lock protocol is the `<AC | founding-team>` one;
> - your manager, and first escalation contact, is `<this session's name>`.
>
> **Your limits:**
> - You change exactly one file, the Log named above, only by `append-entry.mjs`, and commit only that file, by path, on its repo's current branch. Never push.
> - You never edit the handoff, its start line or any other file.
> - You launch nothing.
> - You send nothing outside the company.
> - You change no Hub, spoke, agent definition, `CLAUDE.md`, protocol or settings file.
> - You run no `git checkout`, `stash`, `merge`, `reset` or `rebase` anywhere.
> - If a tool call is refused, say so in one line to your manager and stop; never route around it.
>
> **How you'll be woken:** when you've sent the seat a fix list, you stay idle until it messages you "fixed".
>
> **Your record:** you keep no memory file and run no #lock or #packout of your own; your verdict entry is your whole record, so make it complete before you stop.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
