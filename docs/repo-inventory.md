# Repo Inventory — the ONE canonical list of Evryn repos

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** This is the **single canonical home** for the Evryn repo list — what every repo is, its expected `origin`, its **one canonical branch**, and whether it's active/frozen. **Reference/Explanation hybrid.** Every agent manual (`CLAUDE.md`) points *here* instead of carrying its own repo list — so the list can't drift across six manuals. **If you maintain a repo list anywhere else, *strongly consider* deleting it and pointing here instead.** Edits are source-of-truth → propose to Justin first.

> **Why this exists:** the 2026-06-17 lobotomized-subagent disaster was half a *machine-state* failure — `evryn-quality` was checked out on a stale forked `master` while the good manual lived on an unrelated `main`, and nobody could see the divergence because "push/pull" only ever moves committed work on the current branch. A canonical "expected branch per repo" + a session-start sync check makes that class of failure **detectable instead of invisible.** See [ADR-042](decisions/042-subagent-loading-discipline.md).

*Last verified: 2026-06-19 (ACP — `git remote` + `gh repo view defaultBranchRef` across all repos; every active repo on `main`, only the frozen SDK build on `master`). Row added 2026-07-11 (ACf, Justin-approved): `evryn-team-runtime` — created on `main`, default branch set via `gh repo edit`.*

---

## The inventory

Org: **`EvrynInc`**. All remotes are `https://github.com/EvrynInc/<repo>.git`.

| Repo | Canonical branch | Status | What it is |
|------|------------------|--------|-----------|
| `_evryn-meta` | `main` | **Active** | AC's home. Source-of-truth docs (Hub, spokes, ADRs, protocols, legal finals) + AC cross-repo ops (current-state, sessions). |
| `evryn-backend` | `main` | **Active** | Evryn product backend (v0.2 "Gatekeeper's Inbox"). Live on Railway. |
| `evryn-dev-workspace` | `main` | ⚫ **RETIRED** (2026-08-18, ADR-057) | **Was DC's home.** Its `CLAUDE.md` is now a redirect stub. **DC's manual lives at `_evryn-meta/.claude/agents/dc.md`** — naming this repo's path in a subagent's load list hands it a stub instead of a manual. |
| `evryn-quality` | `main` | ⚫ **RETIRED** (2026-08-18, ADR-057) | **Was QC's home.** `CLAUDE.md` is a redirect stub; **QC's manual is `_evryn-meta/.claude/agents/qc.md`.** *(Historical: a stale `master` fork was retired 2026-06-18 after it lobotomized a QC — that lesson is why this table exists.)* |
| `evryn-ops` | `main` | ⚫ **RETIRED** (2026-08-18, ADR-057) | **Was OC's home.** `CLAUDE.md` is a redirect stub; **OC's manual is `_evryn-meta/.claude/agents/oc.md`.** Its three operational surfaces — runbooks, incidents, the monitoring checklist — were rehomed to `_evryn-meta/docs/ops/` on 2026-08-19. |
| `evryn-team-workspace` | `main` | **Active** | The AI founding team (Lucas, Soren, Mira, Emma, Marlowe, Nathan, Thea, Dominic) — agent identities (`.claude/agents/`), memory (`.claude/agent-memory/`), shared projects. |
| `evryn-team-runtime` | `main` | **Active** (ADR-050) | Founding-team autonomous runtime: the SDK-mains harness + worker dispatch. **Identity content NEVER lives here** — single home is `evryn-team-workspace`; this repo is harness code only. Created 2026-07-11. |
| `evryn-team-agents` | `master` | **Frozen** (ADR-021) | SDK-era agent build. Insurance if Cowork/Code proves insufficient. *(Canonical branch is `master` — it predates the org-wide `main` convention and was never migrated because it's frozen.)* |
| `evryn-website` | `main` | **Live** | Marketing site (evryn.ai). Next.js on Vercel. |
| `evryn-langgraph-archive` | `main` | **Sealed** | LangGraph-era code archive. |
| `evryn-prelaunch-landing` | `main` | **Inactive** · 📁 `z.archive/` | Prelaunch landing page — not currently active. |

> ### 📁 **SIX OF THE REPOS ABOVE LIVE IN `Code/z.archive/`, NOT AS SIBLINGS OF THE ACTIVE ONES** *(moved 2026-08-21)*
>
> **The six:** `evryn-dev-workspace` · `evryn-quality` · `evryn-ops` · `evryn-team-agents` · `evryn-langgraph-archive` · `evryn-prelaunch-landing`. **All six are also ARCHIVED ON GITHUB** — which makes them **read-only**; changing anything in one means unarchiving first (one click, reversible).
>
> **The four still living as siblings in `Code/` are the active ones:** `_evryn-meta` · `evryn-backend` · `evryn-team-workspace` · `evryn-team-runtime` · `evryn-website`.

> ### ⚫ On the RETIRED repos — what that does and does not mean *(recorded 2026-08-20 by AC0-37g; the retirement itself was 2026-08-18, ADR-057)*
>
> **Nothing in them is any agent's context.** All four agent manuals now live in `_evryn-meta/.claude/agents/`, which is their single home.
>
> 🔴 **The one live trap: naming an old path in a subagent's `<mandatory_load>` list now hands it a redirect stub rather than a manual** — and per the router's hard rule, an agent without its manual is not authorized to do anything. **Check the path, not your memory.**
>
> ✅ **ARCHIVE-VS-DELETE IS DECIDED: ARCHIVE, NOT DELETE** *(Justin, 2026-08-21, ahead of the ~2026-09-18 due date)*. **Nothing of value remains in the three.** They hold **16 tracked files** (4 + 6 + 6) and — the half that actually needed checking — **ZERO untracked or gitignored ones.** ⚠️ **That was verified against the DISK, not against `git ls-files`, because a gitignored credential is invisible to the index and that exact class has already bitten this estate once.** Each `.claude/settings.json` holds only a generic tool allow-list, nothing unique; `evryn-ops`'s three real documents were rehomed to `_evryn-meta/docs/ops/` on 2026-08-19.
>
> ### ✅ THE MOVE IS DONE — executed 2026-08-21 by AC0-37i, on the LAPTOP
>
> **The design:** archived repos live in **`Code/z.archive/`** rather than among the active ones. *(Justin's reason, and it is the whole point: he trips over them daily.)* **Six moved**, and each was verified to still function as a git repo from its new home.
>
> **What was checked before moving, because each of these would have made it unsafe:** every one clean, on its canonical branch, **zero unpushed commits and zero commits living only on this machine** *(the check that matters before making a repo read-only — anything unpushed would have been trapped)*, and **no linked worktrees** *(a worktree breaks if you move the main tree out from under it)*.
>
> ⭐ **What the move does to the session-start sync check — this is the point, not a side effect, and it was verified by running the check afterwards.** That check enumerates **top-level** directories in `Code/` containing a `.git`. A repo under `z.archive/` is one level deeper, and `z.archive/` itself has no `.git`, so **the whole set is skipped.** The check now returns exactly the five active repos plus the live worktrees. ⇒ 🔴 **An archived repo's absence from that check is CORRECT and is NOT a finding** — which **supersedes this file's earlier reasoning** that a retired repo should stay visible to the check precisely so it could not vanish unnoticed. **If you are reading a handoff written before 2026-08-21 that treats a missing archived repo as a discrepancy, that is why.**
>
> ⚠️ **The trap the move ADDS: an old path no longer lands on a redirect stub — it does not resolve at all.** Before, an agent following `evryn-quality/CLAUDE.md` got a stub telling it where to go; now it gets "file not found." **Clearer, but less helpful** — so the fix is still to check the path rather than trust memory.
>
> 🖥️ **MACHINE-SPECIFIC: the move will be made on the laptop first. The desktop must be conformed separately** — see the bulletin entry in `docs/current-state.md`.

**One repo = one history = one default branch.** No repo should carry two unrelated roots (the `evryn-quality` fork was the lesson). If a `git merge-base A B` ever returns "no common ancestor" for two branches of the same repo, that's a fork — flag it.

---

## Session-start sync check → moved to the manuals

The session-start / machine-switch **sync ritual** + the **load-bearing-file rule** now live in **AC's `CLAUDE.md` → SESSION STARTUP ("Repo-sync check")**, and each agent's manual carries a one-line branch-check — because a sync ritual is only useful *at startup*, not when someone finally opens this inventory (ADR-042 / AC6 §7). This file stays the canonical **data**: the table above (each repo's canonical branch + status) is what those checks assert against.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
