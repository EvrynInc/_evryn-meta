# #lock Protocol — DC

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** DC's step-by-step `#lock` checklist. **Read it every time Justin says `#lock`.**
>
> 🔴 **REHOMED 2026-08-18 from `evryn-dev-workspace/docs/lock-protocol.md`, because that repo is being retired.** It was the one file in that repo with real, distinct content and no other home — DC's manual says *"read it every time,"* so retiring the repo without moving this would have left a dangling pointer inside a live instruction.
>
> ⚠️ **THIS FILE HAS KNOWN STALE CONTENT — it predates two changes and has NOT been reconciled.** It still describes the **hand-relayed mailbox model** (*"tell Justin so he can relay to AC"*), which was **RETIRED 2026-08-12** in favour of AC spinning DC as a subagent; and its step 5 routes research to `_evryn-meta/docs/research/`, a directory **deleted 2026-08-13** as a misfiling. **Treat those two steps as historical until someone reconciles them. The rest is current.**

**How to use this file:** Step-by-step checklist for when Justin says `#lock` or it's time for a checkpoint. Follow the steps in order.

**IMPORTANT:** All items below go in **the repo you're building in** (e.g., `evryn-backend`, `evryn-team-runtime`) — never in `_evryn-meta`, which is source-of-truth docs and AC's ops, not a build repo. **No build artifacts, changelogs or session docs land there.** *(This line used to say "NOT in `evryn-dev-workspace`," which was DC's home until that repo was retired on 2026-08-18. DC's manual is now `_evryn-meta/.claude/agents/dc.md`; corrected 2026-08-20.)*

---

When Justin says `#lock` or it's time for a checkpoint:

1. **`CHANGELOG.md`** (in the repo you're working in) — Log what was built/fixed/changed this session.
2. **Build progress** — Update the BUILD doc's phase checklist with any steps completed this session (status column). If a sprint doc exists, mark completed tasks there too.
3. **AC handoff** — DC does NOT modify `docs/ARCHITECTURE.md` (AC-owned) or write ADRs directly. If you have architecture-relevant findings OR decisions that need ADR capture, write them to `docs/dc-architecture-notes-for-ac.md` (in the repo you're working in) with a date-stamped entry. This is AC's inbox from DC — architecture notes, decision flags, implementation-level insights AC wouldn't see from the blueprint level. **If you wrote something, tell Justin** — he's the relay to AC, and AC won't see it until he does.
4. **`_evryn-meta/LEARNINGS.md`** — Add distilled lessons from this session. All learnings go to the central meta file (not repo-local), where AC's #lock workflow promotes them. If you can't access meta directly, write them to `docs/dc-to-ac.md` and tell Justin.
5. **Research — 🔴 BOTH destinations this step used to name are GONE. Corrected 2026-08-20.** *(It routed strategic work to `_evryn-meta/docs/research/`, **deleted 2026-08-13 by Justin as a misfiling** — *"there should be no meta research folder"* — and build methodology to `evryn-dev-workspace/docs/research/`, in a repo **retired 2026-08-18**. Following this step as written would have put research in two directories that do not exist.)* **The rule now: research lives in the repo it is ABOUT.** Repo-specific/implementation → `[repo]/docs/build-research/` · about a specific runtime → that repo's own `docs/research/` · strategic or cross-cutting → `evryn-team-workspace/shared/projects/<dept>/research/`. **When in doubt, default to `evryn-team-workspace/shared/projects/`** — it is easier to find there. Place breadcrumbs in the consuming docs, or the research is dead on arrival.
6. **Mailbox check (inbound)** — Peek at `docs/ac-to-dc.md` in the repo you're working in. If there's content you haven't absorbed, absorb it now and **clear the file** (replace contents with `READ — absorbed`). If you've been designated as a specific instance (DC1, DC2, etc.), only absorb notes meant for you.
7. **Mailbox check (outbound)** — If you have general findings, implementation blockers, or questions for AC beyond architecture notes, write them to `docs/dc-to-ac.md` in the repo you're working in. Check that the file is clear before writing — if it still has content, your previous message hasn't been received. **Tell Justin** so he can relay to AC.
8. **Database backup check** — If schema changes were made this session, verify that pre-migration and post-migration backups exist (both schema + data dumps — see `evryn-backend/backups/README.md`). If the post-migration dump is missing, take it now. The pre-migration dump should have been taken before the migration ran (see Build Mandate in CLAUDE.md).
9. **Bitwarden reminder** — If `.env` was modified in any repo, remind Justin: "Hey, we updated .env — remember to re-upload to Bitwarden."
10. **Auto-memory hygiene** — Check `.claude/projects/*/memory/MEMORY.md`. DC does not use auto-memory (see CLAUDE.md). If anything landed there accidentally, promote it to persistent docs or clear it. The file should contain only the "DO NOT WRITE HERE" notice.
11. **Settings.local.json cleanup** — Delete `.claude/settings.local.json` if it exists. This file silently accumulates one-off command approvals at runtime. If any approvals in it should be permanent, propose adding them to `.claude/settings.json` (in git) first. If it contains secrets (API keys, UUIDs auto-saved from approved commands), flag to Justin before deleting. Stale local settings can bleed into parallel instances or mislead fresh sessions.
12. **Commit and push** — Get everything to remote immediately. All repos you touched this session.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
