# Repo Inventory — the ONE canonical list of Evryn repos

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** This is the **single canonical home** for the Evryn repo list — what every repo is, its expected `origin`, its **one canonical branch**, and whether it's active/frozen. **Reference/Explanation hybrid.** Every agent manual (`CLAUDE.md`) points *here* instead of carrying its own repo list — so the list can't drift across six manuals. **If you maintain a repo list anywhere else, *strongly consider* deleting it and pointing here instead.** Edits are source-of-truth → propose to Justin first.

> **Why this exists:** the 2026-06-17 lobotomized-subagent disaster was half a *machine-state* failure — `evryn-quality` was checked out on a stale forked `master` while the good manual lived on an unrelated `main`, and nobody could see the divergence because "push/pull" only ever moves committed work on the current branch. A canonical "expected branch per repo" + a session-start sync check makes that class of failure **detectable instead of invisible.** See [ADR-042](decisions/042-subagent-loading-discipline.md).

*Last verified: 2026-06-19 (ACP — `git remote` + `gh repo view defaultBranchRef` across all repos; every active repo on `main`, only the frozen SDK build on `master`).*

---

## The inventory

Org: **`EvrynInc`**. All remotes are `https://github.com/EvrynInc/<repo>.git`.

| Repo | Canonical branch | Status | What it is |
|------|------------------|--------|-----------|
| `_evryn-meta` | `main` | **Active** | AC's home. Source-of-truth docs (Hub, spokes, ADRs, protocols, legal finals) + AC cross-repo ops (current-state, sessions). |
| `evryn-backend` | `main` | **Active** | Evryn product backend (v0.2 "Gatekeeper's Inbox"). Live on Railway. |
| `evryn-dev-workspace` | `main` | **Active** | DC's home — build identity & methodology. |
| `evryn-quality` | `main` | **Active** | QC's home — review identity & methodology. *(The stale `master` fork was retired 2026-06-18; `main` is canonical — never spin QC off `master`.)* |
| `evryn-ops` | `main` | **Active (reactivating)** | OC's home — operations, monitoring, deploy. Renamed `master → main` on GitHub 2026-06-19; CLAUDE.md rebuild in progress. Had been dormant since 2026-03-20. |
| `evryn-team-workspace` | `main` | **Active** | The AI founding team (Lucas, Soren, Mira, Emma, Marlowe, Nathan, Thea, Dominic) — agent identities (`.claude/agents/`), memory (`.claude/agent-memory/`), shared projects. |
| `evryn-team-agents` | `master` | **Frozen** (ADR-021) | SDK-era agent build. Insurance if Cowork/Code proves insufficient. *(Canonical branch is `master` — it predates the org-wide `main` convention and was never migrated because it's frozen.)* |
| `evryn-website` | `main` | **Live** | Marketing site (evryn.ai). Next.js on Vercel. |
| `evryn-langgraph-archive` | `main` | **Sealed** | LangGraph-era code archive. |
| `evryn-prelaunch-landing` | `main` | **Active** | Prelaunch landing page. *(Not yet described in the Hub; confirm scope with Justin when it next matters.)* |

**One repo = one history = one default branch.** No repo should carry two unrelated roots (the `evryn-quality` fork was the lesson). If a `git merge-base A B` ever returns "no common ancestor" for two branches of the same repo, that's a fork — flag it.

---

## Session-start sync check → moved to the manuals

The session-start / machine-switch **sync ritual** + the **load-bearing-file rule** now live in **AC's `CLAUDE.md` → SESSION STARTUP ("Repo-sync check")**, and each agent's manual carries a one-line branch-check — because a sync ritual is only useful *at startup*, not when someone finally opens this inventory (ADR-042 / AC6 §7). This file stays the canonical **data**: the table above (each repo's canonical branch + status) is what those checks assert against.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
