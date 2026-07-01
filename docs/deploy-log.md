# Evryn — Deploy Log (production ship ledger)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.
>
> **How to use this file:** The single source of truth for **what shipped to production, when, and under which version.** One row per production deploy, newest first. When anyone references "round-2" or "the 6/29 ship," map it here.
>
> **The authoritative pair:** an item's STATUS (`TODO`/`DONE`) **+** this ledger. A *"riding round/wave-X"* tag on a sprint item is **intent to ship, never proof it shipped** — always check the item's status and this ledger. *(This is the exact gap that made the determination-sharing guardrail look shipped when it wasn't — Step 55, 2026-07-01.)*
>
> **Naming convention (adopted 2026-07-01):** each production deploy is **`v0.2.N`** — the Nth prod ship within the v0.2 phase (v0.3 ships become `v0.3.N`, etc.). **One bump per `railway up` to prod.** **No leading zero** (`v0.2.9` → `v0.2.10`), matching the semver / git-tag / npm convention — so we never have some systems padded and some not.
>   - **Sort-safety (why no-pad is fine):** the `v0.2.9 → v0.2.10` ordering is only "weird" under naive *lexicographic* sort. The systems we use sort **version-aware**: `git config tag.sort version:refname` is set on `evryn-backend` (so `git tag` lists `v0.2.10` after `v0.2.9` correctly), and this ledger table is hand-ordered newest-first. No auto-lexical-sorted surface exists.
>   - **Each deploy is git-tagged** on its commit (`v0.2.N`) in `evryn-backend`, so the number is anchored to the exact commit forever (`git describe`, `git log --tags`).
>
> **Legacy Rosetta (so existing references still decode — no retroactive rewrite of dated records):**
> - **"round-1"** = the discarded **2026-06-17** lobotomized hardening attempt — **NEVER shipped** (all code was junk, thrown away).
> - **"round-2"** = **v0.2.2** (the 2026-06-29 hardening deploy).
> - **"go-live bundle"** = **v0.2.1**.

---

| Version | Date | Commit (tag) | What shipped |
|---------|------|--------------|--------------|
| **v0.2.3** | 2026-07-01 | `83fa367` | **AC1 cleanup batch** — mechanical hardening (system-actor constant centralization, always-merge metadata, reference-only history wrapper across the 4 draft sites, per-tool ROLE guards on note/scope tools, M1 fast-follow tests, comment/rename fixes) **+ Step-72 `search_path` pin** on the 3 SECURITY DEFINER RPCs (prod migration, pre/post `pg_dump`). **LIVE** — deployed 2026-06-30 16:48 PT (Railway `d4563ce4`, latest SUCCESS); clean boot (Supabase/Slack/polling), proactive cron firing. Boot-health confirmed 2026-07-01. |
| **v0.2.2** | 2026-06-29 | `d198ef1` | **v0.2 Hardening** *(formerly "round-2")* — M1 silent-death layer, Step-61 gatekeeper-address resolution (ADR-046), lean Reflection (ADR-043), Lane-B operator/approval hardening. 4 prod migrations. |
| **v0.2.1** | 2026-06-16 | `49fb6ff` | **v0.2 Go-Live bundle** — quiet-hours redesign (ADR-040), morning sweep, M1 emergency Stage-1 (plumbing), cost pass-stamp (`record_pass`), Phase-6 Mira identity batch. First v0.2 production bundle. |
| *(pre-ledger)* | 2026-06-04 → 06-10 | `1610f3b` … `23f9858` | Earlier v0.2 dev-iteration deploys toward go-live (Oregon/us-west-2 cutover, context-architecture fixes, email/approval-flow polish, per-event cost-capture). Not individually renumbered — grouped here for completeness. |

**Upcoming (current 4-lane wave — each deploys on Justin's go, then gets its number):** AC4 security bulkheads → likely `v0.2.4` · AC2 cost lane → likely `v0.2.5` · (AC3 identity/ops rides where its pieces land). Numbers are assigned **at deploy**, never reserved ahead.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
