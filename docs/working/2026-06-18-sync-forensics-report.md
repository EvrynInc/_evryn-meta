# Sync Forensics Report — What Happened to Git/Sync (2026-06-18)

> **Truncation check:** last line should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** AC6's forensic findings on the 2026-06-17 DC/QC "lobotomization" + cross-machine git/sync mystery. **Diagnosis only — nothing here has been executed.** Read it to understand (1) what actually broke, (2) the safe remediation steps (awaiting Justin's go), (3) the durable guardrail, (4) the narrow protocol-gap fix. Authored by AC6 (read-only forensic instance), commissioned by AC0's brief (`docs/working/2026-06-18-ac6-sync-forensics-brief.md`). **Status of the "other-machine" column: PENDING** — needs Justin to run the script in §6 on the second machine.

*Authored: 2026-06-18T12:09-07:00 (AC6). All findings are from READ-ONLY inspection — no push/pull/fetch-prune/merge/reset/checkout was run.*

---

## TL;DR (the headline)

1. **`this-machine → GitHub is NOT broken.** AC0's last-night pushes landed: GitHub `_evryn-meta/main` = `6655cff` and `evryn-backend/main` = `8da07bf`, both **identical to local HEAD.** The "other machine doesn't see the pushes" symptom is a **pull/fetch problem on the other machine**, not a push failure here.

2. **THE QC LOBOTOMIZATION ROOT CAUSE = a forked `evryn-quality` repo with two *unrelated* git histories.** This machine is checked out on a stale **`master`** branch (old "How QC Orients" heading, **no cascade anchor**). All the real QC hardening — including the commit that created the exact **"Startup Context Cascade — Auto-load (tiered)"** section the orchestration protocol depends on — lives on a **separate `main` branch**. The two branches share **no common ancestor** (two separate `git init`s). GitHub's **default branch for quality is the stale `master`**, so a fresh clone gets the broken manual. When QC was spun here, it loaded the stale manual → no cascade → lobotomized.

3. **DC was NOT lobotomized by a stale manual *on this machine*.** `evryn-dev-workspace` here is healthy: single history, on `main`, and its CLAUDE.md has the full Startup Context Cascade. **This corrects the brief's premise** (which assumed both DC and QC manuals were stale here). If DC was lobotomized yesterday, the cause is elsewhere — see §3.

4. **`evryn-ops` IS on GitHub** (`EvrynInc/evryn-ops`, default `master`) — **not missing.** It's just frozen since 2026-03-20 and has *uncommitted* local CLAUDE.md edits that were never committed. The other machine's "it's not on GitHub" is most likely a not-cloned-there or auth/visibility issue (verify in §6).

5. **No fork / wrong-org / wrong-remote anywhere.** Every repo on this machine points at the correct `https://github.com/EvrynInc/<repo>.git`. The root cause is **branch/commit divergence and never-pushed local work**, not remote misconfiguration.

---

## 1. The Sync Matrix (this-machine / GitHub / other-machine)

**Legend:** ✓ = in sync · ⚠ = local work not on GitHub · ✗ = broken/forked. **Other-machine column is PENDING** the §6 script.

| Repo | Branch (local) | Local HEAD | GitHub tip (same branch) | This vs GitHub | Other machine |
|---|---|---|---|---|---|
| `_evryn-meta` | main | `6655cff` | `6655cff` | ✓ synced (1 untracked: this brief) | PENDING |
| `evryn-backend` | main | `8da07bf` | `8da07bf` | ✓ synced | PENDING |
| `evryn-dev-workspace` | main | `ee72e74` | `ee72e74` | ✓ synced, healthy, cascade present | PENDING |
| **`evryn-quality`** | **master (stale)** | `06eaa9b` | master=`3c98322`, **main=`fffaf2d`** | ✗ **FORKED — on wrong branch; +1 unpushed** | PENDING |
| `evryn-ops` | master | `60db052` | `60db052` | ⚠ HEAD synced but **uncommitted `M CLAUDE.md`**; repo frozen since Mar 20 | PENDING |
| `evryn-team-workspace` | main | `fffe372` | `b32ff1e` | ⚠ **+1 unpushed commit** + 1 uncommitted (`M consolidation-protocol-updates.md`) | PENDING |
| `evryn-team-agents` | master | `a8abe2e` | `a8abe2e` | ✓ synced (frozen) | PENDING |
| `evryn-website` | main | `2b64b33` | `2b64b33` | ✓ synced | PENDING |
| `evryn-langgraph-archive` | main | `3e1db4d` | `3e1db4d` | ✓ synced (sealed) | PENDING |
| `evryn-prelaunch-landing` | main | `7f0abc9` | `7f0abc9` | ✓ synced | PENDING |

**Backend worktrees (yesterday's lanes, all on origin):** `evryn-backend-cost` (lane-c/cost `03e8fa2`), `evryn-backend-ingest` (lane-a/ingest-resilience `d2d98af`), `evryn-backend-m1` (m1/silent-death-stage2 `7903ed3`), `evryn-backend-operator` (lane-b/operator-approval `4446ef0`). All four lane branches exist on `origin`. (Per Justin's decision, none of this code merges — settled junk.)

**Stale merged branches lingering on `evryn-backend` origin** (post-deploy cleanup debt, not active divergence): `bundle/go-live-v0.2`, `dc/cost-pass-stamp`, `dc/m1-emergency-channel`, `dc/morning-sweep-c2`, `dc/quiet-hours-redesign`, `dc4/qc-fixes`, `mira/phase6-identity-batch`. current-state says 6 were reaped 6/16 — locally yes, but the **origin copies were not deleted.** Minor cleanup.

---

## 2. ROOT CAUSE — the `evryn-quality` fork (the QC lobotomization)

**Two unrelated histories in one repo:**

- **Stale chain** — root `91fa8ad` ("Initial QC repo") → `3c98322` → `06eaa9b`. Branch name: **`master`**. CLAUDE.md heading: **"How QC Orients"** (old). **No** "Startup Context Cascade" anchor, **no** `#cascade-override`. ~279 lines. **This is what's checked out on this machine, and it's GitHub's default branch.**
- **Good chain** — root `825ac6b` ("Initial commit: QC standup") → … `f2f2dac` → **`c396438` "standardize Startup Context Cascade"** → `d2c04c0` "harden + #cascade-override" → … → `fffaf2d`. Branch name: **`main`**. CLAUDE.md has full **SESSION STARTUP**, **"Startup Context Cascade — Auto-load (tiered)"** (line 20), Severity Rubric, Mailbox Protocol, etc. ~374+ lines. **This is the correct, protocol-paired QC manual.**

`git merge-base master origin/main` → **no common ancestor.** They were never the same repo; two separate inits were both pushed to the same `EvrynInc/evryn-quality` remote as different branch names.

**Why this lobotomized QC:** The orchestration protocol's verbatim trigger tells a spun QC to *"load your Startup Context Cascade — the section by exactly that name in your CLAUDE.md."* On this machine, the working tree is `master` → that section **does not exist** → QC finds nothing to load → runs generic. The protocol and the checked-out manual were paired against **different chains.**

**The one piece of unique work trapped on stale `master`:** the unpushed `06eaa9b` commit adds a **"guard-is-half-a-change"** QC pattern (earned 2026-06-17: the Step-18 status-write guard that repointed `ignored` but missed `bad_actor`/`matched`/`no_gk_response`). This pattern is **absent from `main`** (confirmed) and exists **only in this machine's local working tree, unpushed, on the wrong branch.** It is the single most at-risk piece of real work in the whole estate — one stray `reset`/`checkout` and it's gone. **Preserve it first.**

---

## 3. The DC question — correcting the brief

The brief assumed both DC and QC manuals on this machine were stale. **The evidence says only QC's is.** `evryn-dev-workspace` here is healthy: single root (`c2dad82`), on `main`, in sync with GitHub, and its CLAUDE.md contains the full Startup Context Cascade ("Startup Context Cascade — How to Orient in a New Repo" + the `#cascade-override` rule + NON-NEGOTIABLE framing). DC's anchor matches the protocol exactly.

So **a stale DC manual on this machine cannot be the cause of DC lobotomization here.** If DC ran lobotomized yesterday, the cause is one of:
- **(a)** Yesterday's wave (or parts of it) ran on the **other machine**, whose `evryn-dev-workspace` branch/HEAD I can't see — *verify via §6.*
- **(b)** The **spinning mechanics** — the AC briefs didn't paste the verbatim identity-redirect + cascade trigger, so DC loaded generic regardless of a correct manual.
- **(c)** The **narrow team-subagent gap** (§5) — applies to Soren, not DC, but it's the same "no loading provision" failure mode and may have been conflated.

I cannot confirm DC was lobotomized; I can confirm its manual here is correct. **This is a real open thread — §6 closes it.**

---

## 4. Hypothesis scorecard (Occam-first, per the brief)

| # | Hypothesis | Verdict |
|---|---|---|
| 1 | Never-committed / never-pushed source | **CONFIRMED (primary).** quality `main`-chain standardization never reached this machine's checkout; quality `06eaa9b`, team-ws `fffe372`, ops `M CLAUDE.md` all local-only. |
| 2 | Branch mismatch | **CONFIRMED (the core).** quality is checked out on `master` while the good work is on `main` — and they're unrelated histories. |
| 3 | Remote URL divergence / fork | **RULED OUT.** Every remote = correct `EvrynInc/<repo>`. No forks, no SSH/HTTPS dupes. |
| 4 | `evryn-ops` local-only / no remote | **PARTIAL / RE-CHARACTERIZED.** It HAS a correct remote and IS on GitHub — but frozen since Mar 20 with uncommitted local edits. Not "missing." |
| 5 | Multiple clones / wrong path | **LIKELY on the other machine** (the quality fork is the on-disk symptom of exactly this). Verify in §6. |
| 6 | Auth → fork | **RULED OUT.** gh auth = `jbmcgowan42`, pushes verified landing in `EvrynInc`. |
| 7 | gitignore / sparse-checkout | **RULED OUT** for CLAUDE.md (files are tracked + present). |

**One-line root cause:** *Work moved between machines as branches and commits that were never reconciled — the quality repo carries two unrelated histories under `master`/`main`, this machine sits on the stale one, and several repos hold local-only commits/edits that never reached GitHub. "Push everything"/"pull everything" only ever moved committed work on the current branch, so the divergence was invisible to both operators.*

---

## 5. Narrow case — the protocol has no team-subagent loading provision

**Confirmed gap.** `ac-orchestration-protocol.md` only documents **"Spinning a DC or QC subagent"** — agents whose identity is a `CLAUDE.md` at a known repo path the AC names. It has **no provision** for spinning a **team** subagent (Soren, Mira, Nathan, …), whose identity lives in `evryn-team-workspace/.claude/agents/<name>.md` + `evryn-team-workspace/.claude/agent-memory/<name>/MEMORY.md` + the team `CLAUDE.md` — **none of which is a `CLAUDE.md` at the agent's "repo."**

**Why a spun "Soren" is lobotomized from AC's seat:** AC's available agent types are `claude`, `Explore`, `general-purpose`, `Plan`, etc. — **there is no registered `soren`/`mira` agent type** (that registry only exists *inside* `evryn-team-workspace`'s Claude Code context). So from `_evryn-meta`, AC necessarily spawns a **generic** subagent, which auto-loads **AC's** CLAUDE.md and nothing else. The team's own model (`evryn-team-workspace/CLAUDE.md`, "Multi-agent sessions and subagents", ~line 226) assumes the agent-definition + MEMORY auto-load — **true only when spawned via the team's registered agent types, false from AC's seat.** The protocol never bridged that.

**Recommended fix (do NOT apply — auth-gated; AC0/Justin apply):** Add a **"Spinning a team subagent"** section to `ac-orchestration-protocol.md`, mirroring the DC/QC block, that names — in the same "read and faithfully follow, in full" register — the four loads, in order:
1. `evryn-team-workspace/CLAUDE.md` (the team operating manual — the analog of DC/QC's manual; read first).
2. `evryn-team-workspace/.claude/agents/<name>.md` (the agent's definition / identity).
3. `evryn-team-workspace/.claude/agent-memory/<name>/MEMORY.md` (the agent's memory — **with the truncation-canary check**, since memory files can silently truncate; per team CLAUDE.md line 231).
4. **Whatever that agent definition itself names** as its context set (spokes, project docs) — the team model expects the *full* set per the definition, not just the definition.

Plus: the same **identity-redirect** ("you are not AC; your manual is …") + **receipts-first** discipline as DC/QC, and a one-line note that **AC cannot use a registered `agentType` for team agents** (so the manual load is mandatory, not optional). Cross-reference the team CLAUDE.md "Multi-agent sessions and subagents" section as the authority. **Also flag for Justin/Lucas:** the team CLAUDE.md's "agent-definition + MEMORY auto-load" claim should be footnoted as *"…when spawned as a registered team agent type; from a cross-repo seat (e.g. AC), none auto-load — name them all."*

---

## 6. Safe remediation plan — STEPS ONLY (await Justin's go)

> Nothing below is executed. Each is a proposal. The quality-fork steps are the only delicate ones; the rest are routine.

### 6a. FIRST — preserve the at-risk unique work (before any branch surgery)
- The unpushed `evryn-quality` `06eaa9b` "guard-is-half-a-change" pattern exists **only** in this machine's local working tree. **Before touching anything**, capture its content (already quoted in this report; also recoverable via `git -C evryn-quality show 06eaa9b -- CLAUDE.md`). It must be **ported into the `main`-chain CLAUDE.md's "Patterns This Role Watches For" section.**

### 6b. Resolve the `evryn-quality` fork (the core fix)
- **Decision Justin must make:** `main` is canonical (richer, protocol-paired). Adopt `main` as the **single source of truth** and **retire `master`.** Concretely (for AC0/OC to execute on Justin's go):
  1. On GitHub, **change the default branch** `evryn-quality` from `master` → `main` (so fresh clones get the correct manual).
  2. Port the `06eaa9b` "guard-is-half" pattern onto `main` (a normal commit on `main`).
  3. On **every** machine, **check out `main`** for `evryn-quality` (this machine is on `master` — switch it, once the unique pattern is safely on `main`).
  4. Once confirmed everywhere, **delete the stale `master`** branch on origin + locally (only after the port + default-branch flip are verified).
- **Do NOT** `reset`/force/merge the two chains together — they're unrelated histories; a merge would be a tangle. Adopt-one, port-the-delta, retire-the-other.

### 6c. Reconcile the other local-only work (low risk, normal commits/pushes)
- `evryn-team-workspace`: commit + push `fffe372` (already committed, just unpushed) and decide on the uncommitted `M shared/projects/helm/consolidation-protocol-updates.md`.
- `evryn-ops`: decide on the uncommitted `M CLAUDE.md` (commit + push, or discard) — and unfreeze/sync the repo if it's meant to be active (it's frozen at Mar 20).
- Stale merged `evryn-backend` origin branches (§1): delete on origin once confirmed merged.

### 6d. Get the other machine reconciled
- Run §6's script on the other machine first (below), diff the three columns, then have the other machine **`git fetch` + check out the canonical branches** and **push any local-only work** it holds before anyone resets anything. **Assume the other machine also has unpushed local work** until proven otherwise — do not overwrite it.

### THE OTHER-MACHINE SCRIPT (Justin: run this on the second machine, paste output back)
```bash
cd /path/to/Evryn/Code   # adjust to that machine's root
for d in _evryn-meta evryn-backend evryn-dev-workspace evryn-quality evryn-ops \
         evryn-team-workspace evryn-team-agents evryn-website \
         evryn-langgraph-archive evryn-prelaunch-landing; do
  echo "===== $d ====="
  if [ -d "$d" ]; then
    echo "branch: $(git -C "$d" branch --show-current 2>&1)"
    echo "HEAD:   $(git -C "$d" log -1 --format='%H %ci' 2>&1)"
    echo "remote: $(git -C "$d" remote get-url origin 2>&1)"
    echo "status:"; git -C "$d" status -s 2>&1 | head -15
    echo "all local branches:"; git -C "$d" branch 2>&1
  else
    echo "  >> NOT PRESENT on this machine"
  fi
  echo ""
done
```
**Three things I most need from that output:**
1. `evryn-quality` — **which branch is checked out?** (Hypothesis: `main`. If so, that *is* the cross-machine mismatch.)
2. `evryn-dev-workspace` — branch + HEAD + status (is it ahead of GitHub with unpushed cascade edits? closes the DC question in §3).
3. `evryn-ops` — is it **present at all**, and what's its `remote`? (explains the "not on GitHub" claim).

---

## 7. The "never recurs" guardrail (durable fix)

The failure was **invisible divergence**: two operators each believed "everything synced" because the words "pushed"/"pulled" only ever describe *committed work on the current branch*. The durable fixes:

1. **A repo inventory with expected remote + canonical branch** (a checked-in `docs/repo-inventory.md` in `_evryn-meta`): for every repo — expected `origin` URL, the **one** canonical branch, and "frozen/active" status. A pre-flight check diffs reality against it. This would have caught the quality `master`/`main` fork and the `master`/`main` default-branch mismatch immediately.
2. **A machine-switch / session-start sync ritual** (lightweight): per repo, `git fetch` then assert `local HEAD == origin/<canonical>` AND `git status` is clean AND `branch == canonical`. Anything that fails is surfaced, not silently worked around. (Could be a tiny script; OC's domain.)
3. **"Commit-and-verify-on-GitHub" for load-bearing files.** When a source-of-truth/identity file is edited (CLAUDE.md, protocols, identity), the edit isn't "done" until `gh api .../commits/<branch>` confirms the commit is on GitHub's canonical branch. The 2026-06-06 quality standardization was authored but its landing on the shared chain was never verified — that's the exact gap.
4. **One repo = one history = one default branch.** No repo should carry two unrelated roots. The quality fork is the concrete lesson; the inventory (#1) makes a second one detectable.
5. **Pair-edit discipline already in the protocol, now enforced:** the protocol says "keep the trigger wording and the CLAUDE.md section name in lockstep — change one, change the other in the same commit." The fork shows the section name and the protocol drifted onto *different chains*. The inventory + GitHub-verify (#1, #3) is what makes "lockstep" actually hold across machines.

---

## 8. What's verified vs. still open

**Verified (read-only, this machine + GitHub):** the full §1 matrix this-machine/GitHub columns; the quality fork + unrelated roots; the trapped `06eaa9b` pattern; dev-workspace health; ops-is-on-GitHub; no fork/wrong-remote anywhere; AC0's pushes landed; the narrow protocol gap + AC's lack of a team agent-type.

**Still open (needs the other machine — §6):** the third matrix column; whether the other machine's quality is on `main` (the presumed mismatch source); whether the other machine's dev-workspace carries unpushed cascade work (the DC-lobotomization thread, §3); whether `evryn-ops` exists on the other machine and why its AC reported it "not on GitHub"; whether the other machine holds *any* unpushed local work that must be saved before reconciliation.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
