# AC6 Brief — Git/Sync Forensics + the Subagent-Identity Loading Gap (2026-06-18)

> **Truncation check:** last line should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** AC0 wrote this to brief **AC6**, a dedicated **forensic investigator**. Your job is to find out **what the actual fuck happened** to our git/sync between machines + GitHub (the "broad case"), document the **subagent-identity loading gap** in the orchestration protocol (the "narrow case"), find the **root cause(s)**, and produce a **safe remediation plan + a "never recurs" guardrail.** You **DIAGNOSE and RECOMMEND — you do NOT fix, merge, push, pull, reset, or force anything** without Justin's explicit go (see Constraints). Read this under the Full Startup Context Cascade (`_evryn-meta/CLAUDE.md` → SESSION STARTUP) — you're doing AC-level cross-repo work — plus `docs/protocols/ac-orchestration-protocol.md` (for the narrow case).

---

## Why this matters (the stakes)
Yesterday (2026-06-17) AC0 ran a 5-AC parallel wave (AC1-5 + Mira/OC subagents). **It turns out DC and QC were running "lobotomized" all day** — they loaded only their `CLAUDE.md` and started working, with **no startup load cascade** — because the `evryn-dev-workspace` and `evryn-quality` `CLAUDE.md` files on THIS machine are **NOT the up-to-date versions that pair with the orchestration protocol.** So the AC↔DC↔QC coordination system we built and "tested flawlessly" **wasn't firing at all.** **Decision already made by Justin: NONE of yesterday's worktree code will be merged** — a lobotomized DC builds code that breaks things; untangling a merge of it would be a nightmare. (The *thinking* from yesterday is being salvaged separately by each AC; that is NOT your job — yours is the forensics.) **The reason we MUST understand this:** if we don't find the root cause, it recurs and we get burned again — possibly after a merge next time.

---

## THE TWO CASES

### Broad case — the git/sync mystery (your PRIMARY mission)
Symptoms Justin reported (treat as evidence, verify each):
1. **`evryn-dev-workspace/CLAUDE.md` and `evryn-quality/CLAUDE.md` DON'T MATCH between the two machines** — even though the *other* machine says it "pushed everything" and *this* machine's `git pull` said it "pulled everything," and Justin verified the repos on both machines.
2. The CLAUDE.mds on THIS machine are **stale** — missing the pieces that pair with `ac-orchestration-protocol.md`, so the DC/QC startup cascade never fires.
3. **`evryn-ops` exists on THIS machine (has for a while) but is NOT on GitHub** (per the AC on the other machine) — and the other machine **does not see AC0's pushes from last night.**
4. So: we don't know if **this machine's work isn't reaching GitHub** (ops has existed a while and isn't up there), or if **the other machine's work isn't coming down**, or both. **Unknown how deep the rabbit hole goes — assume nothing transferred correctly until proven.**

### Narrow case — the protocol has no team-subagent identity-loading provision
`ac-orchestration-protocol.md` tells an AC to spin DC/QC and have the subagent **"load what its CLAUDE.md says to load."** But it has **no provision for spinning a *team* subagent** (Soren, Mira, Nathan, etc.) — agents whose identity lives in `evryn-team-workspace/.claude/agents/*.md` (e.g. `soren.md`) + their memory files, NOT in a `CLAUDE.md`. So yesterday when an AC spun a subagent **Soren** to vet (believed: AC5), the protocol's instruction loaded a **lobotomized Soren** — none of `soren.md`'s identity/loading. (Justin's IDE was on ~line 36 of the protocol — the agent-spinning section — when he flagged this.) **This is a real, fixable protocol gap** and a *second* root cause of yesterday's lobotomization (distinct from the broad git case). Document it + recommend the fix; do NOT edit the protocol yourself (source-of-truth, auth-gated).

---

## KNOWN FACTS (AC0's last-night actions — use as forensic anchors)
Last night AC0 committed + pushed, and **git reported success**, to these exact remotes:
- **`_evryn-meta`**: `c87ddfa..6655cff  main -> main` → `https://github.com/EvrynInc/_evryn-meta.git`
- **`evryn-backend`**: `fcc8856..8da07bf  main -> main` → `https://github.com/EvrynInc/evryn-backend.git`
- **4 lane branches** (new on origin): `lane-a/ingest-resilience`, `lane-b/operator-approval`, `lane-c/cost`, `m1/silent-death-stage2` → `evryn-backend`.
- AC0 **did NOT push `evryn-dev-workspace`, `evryn-quality`, or `evryn-ops`** last night (only the two above + branches). So evryn-ops not being on GitHub is **not** contradicted by AC0's actions — it points to evryn-ops having *never* been pushed by anyone.

**The single highest-value first check:** does GitHub actually have `6655cff` (meta) / `8da07bf` (backend)? `gh api repos/EvrynInc/_evryn-meta/commits/main --jq .sha` (and same for evryn-backend). 
- **If YES** → AC0's push landed; the other machine isn't pulling/pointing at the right remote → the problem is on the *pull/remote* side.
- **If NO** → AC0's "successful" push went somewhere else (a fork? a different remote?) → the problem is on the *push/remote* side. This single bisection narrows the whole hunt.

---

## YOUR FORENSIC MISSION

### 1. Build a per-repo SYNC MATRIX (the core artifact)
For **every** repo on this machine (`_evryn-meta`, `evryn-backend`, `evryn-dev-workspace`, `evryn-quality`, `evryn-ops`, `evryn-team-workspace`, `evryn-team-agents`, `evryn-website`, `evryn-langgraph-archive`, + any others under `c:/Users/jbmcg/Evryn/Code/`), capture:
- `git remote -v` (the **exact** remote URL — watch for forks / wrong org / no remote at all)
- current branch (`git branch --show-current`) + default branch
- local HEAD (`git rev-parse HEAD`) + last-commit date
- origin HEAD per branch (`git ls-remote` / `gh api`) — and **unpushed** commits (`git log origin/<branch>..<branch>`)
- **uncommitted** working-tree state (`git status`)
- for the load-bearing files specifically — `CLAUDE.md` in dev-workspace + quality (and `evryn-team-workspace/.claude/agents/*.md`): **when last committed, on which branch, and is that commit on GitHub?** (`git log -1 --format='%H %ci' -- CLAUDE.md` + check it's in origin)
- **GitHub truth** via `gh` (`gh repo view EvrynInc/<repo>`, `gh api .../commits/<branch>`): does the repo even exist on GitHub? what's its latest commit?
- **Other machine** (you can't see it — Justin runs the same commands there or relays): same fields, so you can diff three columns: **this-machine / GitHub / other-machine**.

### 2. Root-cause the mismatch — hypotheses, Occam-first
1. **Never-committed / never-pushed source.** "Push everything" only carries **committed** work on the **pushed branch**. If the up-to-date dev/quality CLAUDE.md edits were uncommitted (or stashed, or on an unpushed branch) on the source machine, they never reached GitHub → this machine pulled the OLD committed version. **Check the commit/push state of those exact files on BOTH machines first.**
2. **Branch mismatch.** `git push`/`pull` default to the current branch. If the good versions live on a branch that wasn't pushed/pulled (or the machines are on different branches), they don't transfer. (Were the pushes `--all`/`--mirror`, or just the current branch?)
3. **Remote URL divergence.** Machines point at different remotes (a personal fork vs. `EvrynInc`, an SSH-vs-HTTPS duplicate, a renamed repo). `git remote -v` everywhere; compare to GitHub truth.
4. **`evryn-ops` is local-only.** Likely has **no remote / was never pushed** (explains "exists here, not on GitHub, never saw the push"). Confirm `git -C evryn-ops remote -v`.
5. **Multiple clones / wrong path.** The AC on the other machine may be reading a *different clone* than what was pushed (stale duplicate dir). Check for duplicate repo paths.
6. **Auth pointing at a fork.** A "successful" push landing in a personal fork, not `EvrynInc`. Cross-check the push URL vs. GitHub truth (ties to hypothesis 3 + the §"highest-value first check").
7. **gitignore / sparse-checkout** excluding files (least likely for CLAUDE.md — check last).

### 3. Document the narrow protocol gap + recommend the fix
Locate the exact spot in `ac-orchestration-protocol.md` (the agent-spinning section, ~line 36) where it covers DC/QC loading. Document that it has **no provision for team subagents** (Soren/Mira/etc. — identity in `evryn-team-workspace/.claude/agents/*.md` + memory, not a `CLAUDE.md`). **Recommend** the fix (a clear "spinning a team subagent" block: load that agent's `<name>.md` + its memory + the team `CLAUDE.md` context, the way the team's own model expects — cross-ref the team `CLAUDE.md` loading rules). **Do NOT edit the protocol** — it's auth-gated; your output is the recommendation, AC0/Justin apply it.

---

## CONSTRAINTS (read carefully — this is a forensic scene)
- **NON-DESTRUCTIVE / READ-ONLY by default.** Use only inspection commands (`git remote -v`, `status`, `log`, `rev-parse`, `ls-remote`, `gh api/repo view`, `diff`). **Do NOT `push`, `pull`, `fetch --prune`, `merge`, `reset`, `checkout -f`, `clean`, `rebase`, or `branch -D`** anything without Justin's explicit go. We do **not** want to overwrite the divergence before we understand it — the current state IS the evidence.
- **Preserve the snapshot.** Your first deliverable is the sync matrix = a forensic snapshot of the current state *before* anyone remediates.
- **No merging worktrees, no building, no fixing code.** Yesterday's worktree code is settled-junk (not merged). You are diagnosis only.
- **You can't see the other machine.** Coordinate with Justin: give him the exact commands to run there (or he relays output). Build the three-column diff from his results.
- **Ping discipline** (today is high-stakes + Justin's coordinating): done/blocked → `#team-alerts` (Node `fetch` to `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env`), prefixed `AC6:`. Ping the moment you have the bisection answer (does GitHub have `6655cff`/`8da07bf`?) — that one result reshapes the hunt, so surface it immediately, don't wait for the full report.

---

## DELIVERABLE
A forensic report (write to `_evryn-meta/docs/working/2026-06-18-sync-forensics-report.md`):
1. **The sync matrix** (per-repo: this-machine / GitHub / other-machine — remote URL, branch, HEAD, unpushed, uncommitted, key-file commit/push state).
2. **Root cause(s)** — what actually broke the dev/quality CLAUDE.md transfer, and separately why evryn-ops isn't on GitHub, and whether this-machine→GitHub and/or other-machine→GitHub is failing and *why*.
3. **Safe remediation plan** — the exact steps (for Justin's go) to (a) recover the correct dev/quality CLAUDE.mds, (b) get every repo's true-latest state reconciled across both machines + GitHub, (c) get evryn-ops onto GitHub. **Steps only — don't execute without his go.**
4. **The "never recurs" guardrail** — the durable fix (a pre-flight sync-verification ritual? a "commit-and-verify-on-GitHub" checklist? a repo inventory with expected remotes?) so a machine-switch can't silently drop work again.
5. **The narrow protocol-gap fix recommendation** (team-subagent loading).

---

## WHY AC0 ISN'T DOING THIS
AC0 is preserving context to author the next-AC0 extraction handoff (re-spin AC1-5 cleanly once DC/QC/Soren load correctly). The forensic hunt is unbounded and would blow that context — hence a dedicated AC6. When you've found root cause + remediation, AC0 (or next-AC0) folds your findings into the path forward.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
