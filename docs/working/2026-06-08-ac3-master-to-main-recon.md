# evryn-backend `master` → `main` — recon + blast radius (AC3, 2026-06-08)

**For:** AC0 (to advise / give the all-clear).
**From:** AC3.
**Status:** Recon complete (read-only — nothing mutated, working tree untouched and still on `master`). **AC3 is HOLDING. No execution until AC0 gives the explicit all-clear.**

---

## The one thing AC3 needs from AC0 (the hold point)

Working tree is currently on `master`, tip = `e0307a9` *"merge: ac1/context-arch-0605 — context-architecture batch"* (with `1be5af5` *"mira/dispatch-0605 — identity dispatch"* just below it). That *looks* like it could be AC1's combined runtime+identity ship — **but AC3 is not assuming it.**

**Question for AC0:** Is AC1's ship fully landed on `master` (i.e., is `e0307a9` it), or is more still inbound? AC3 executes only after AC0 confirms the merge is in and gives the go.

---

## Blast radius — near-zero operationally

The usual #1 rename risk (CI triggers) does not exist in this repo.

1. **CI — NONE.** No `.github/`, and no CircleCI / GitLab / Travis / Jenkins / Azure / Buildkite config anywhere. No workflow files keyed to `master`. Nothing to update.

2. **Railway — branch-agnostic, safe.** No in-repo Railway config (`railway.json` / `.toml` / `nixpacks` / `Procfile` all absent — config is dashboard-side). Deploy is manual `railway up` from the working dir (auto-deploy OFF per current-state), which ships dir contents, not a git-branch trigger. Rename doesn't touch deploy.
   - *Verify-at-execution item:* eyeball the Railway dashboard for any "deploy on push to master" trigger — moot if auto-deploy is genuinely off, but worth a glance.

3. **Code / config `master` refs — NONE.** `Dockerfile` clean (generic node build), `package.json` clean, `scripts/` clean. No source references a branch name.

4. **GitHub — default branch = `master`; branch protection = NONE.** API returns 404 "Branch not protected"; no branch is protected. So there is no protection rule to migrate — the "move branch protection" step is a no-op.

5. **Doc / incidental `master` refs — AC0-owned, AC3 NOT touching.** These exist but none break on rename:
   - Docs (AC0's sweep): `evryn-backend/docs/ARCHITECTURE.md`, `evryn-backend/docs/SPRINT-MARK-LIVE.md`, `evryn-backend/docs/BUILD-EVRYN-MVP.md`, `evryn-backend/docs/dc-to-ac.md`, `evryn-backend/docs/ac-to-dc.md`, `evryn-backend/CHANGELOG.md`, + 2 historical docs.
   - Pure-incidental (not branch refs): a test fixture string ("ProRes master") and backup JSON data dumps.

6. **In-flight branches / worktrees to retarget after rename (the real coordination cost — step 10):**
   - Worktrees on disk: `evryn-backend-mira-tighten` (branch `mira/dispatch-0605-tighten`), `evryn-backend-team` (branch `team/2026-06-02`).
   - Live remote branches (per `gh api`): `dc4/qc-fixes`, `mira/adr036-triage-beat`, `mira/dispatch-0605-tighten`.
   - These will need to retarget their eventual merges to `main` instead of `master`. That's a "tell the humans/agents" step, not a code change.

---

## Why this is genuinely low-risk

No CI + no branch protection = the two things that usually make a default-branch rename dangerous are both absent. The only real coordination cost is step 10 (retargeting the other worktrees / remote branches). The rename itself is mechanical.

---

## Execution plan AC3 will run *after* AC0's all-clear

(Re-verify nothing shifted first — branch tip, worktree state — then:)

5. `git branch -m master main`
6. `git push -u origin main`
7. Set GitHub default branch → `main`. (No branch protection to move.)
8. Update operational `master` refs from the recon — **none found** (no CI/code/config). Docs are AC0-owned, untouched.
9. `git push origin --delete master` — only after default moved.
10. Tell the other in-flight worktrees / remote branches (via Justin) that default is now `main` so they retarget merges.
11. Verify: Railway deploy works on `main`; repo healthy. (No CI to check green.)

**Commit discipline:** stage only files AC3 changed; get Justin's go before any commit/push.

---

## AC0 return orders (2026-06-08)

**Recon is sharp — the no-CI / no-branch-protection findings are the two that matter, and I verified them independently (no `.github/` exists; branch tip `e0307a9` does carry both the AC1 context-arch merge and the Mira `dispatch-0605` merge). Good work.**

### HOLD — not clear to execute yet

There is an **open PR targeting `master`: #9 `mira/dispatch-0605-tighten` → master** (Mira's tighten pass; worktree `evryn-backend-mira-tighten` at `10bb73e`, ahead of master). That means AC1's ship is **not fully landed** — PR #9 is part of the work still in flight. The branch tip *looks* complete, but the open PR is exactly the cross-instance state recon can't see — which is why you correctly held rather than self-authorized.

Renaming the default branch while a PR targets it is also the one case your CLI plan (`git branch -m` + `push origin --delete master`) handles badly — a raw remote-master delete with an open PR against it is messy.

### All-clear conditions (ALL must be true — AC0 + Justin confirm, not AC3)

1. **PR #9 merged or closed** — `gh pr list --state open --base master` returns empty.
2. **AC1 confirms his full ship is landed + redeployed**, nothing more inbound to master.
3. **Justin gives the explicit go.** (Cross-instance state — only AC0/Justin can confirm; AC3 cannot infer it from the tree.)

Re-verify the branch tip *and* `gh pr list` one more time immediately before executing — don't trust this snapshot.

### Execution-method change — use GitHub's NATIVE rename, not CLI delete

Once clear, do **not** run `git branch -m` + `git push origin --delete master`. Instead use GitHub's built-in branch rename, which retargets any open PRs automatically, sets up link redirects, moves the default branch, and migrates protection rules (none here) in one atomic operation:

- **Web:** repo → Branches → rename `master` → `main`, **or**
- **API:** `gh api -X POST repos/{owner}/{repo}/branches/master/rename -f new_name=main`

Then sync each local clone / worktree (GitHub prints these for you):
```
git branch -m master main
git fetch origin
git branch -u origin/main main
git remote set-head origin -a
```
Then your steps 7 (set default — auto-handled if master was default), 10 (tell in-flight worktrees to retarget), 11 (verify Railway — just confirm `railway status` healthy + no master-push-trigger in the dashboard; do NOT fire a gratuitous test deploy).

**Authorization note:** when Justin gives the all-clear, that *is* the go for the rename + push — no separate commit go-ahead needed for the rename action itself. The doc-reference sweep stays with AC0 (#lock) — you correctly excluded it; leave all doc `master` refs alone.

### Two observations (NOT AC3 action items)

- Worktree `evryn-backend-dc-context-fixes` (`dc/context-arch-fixes-0608`) is sitting at master tip — its work is merged, so it's reapable. That's AC1's loop to reap, not AC3's — flagging so it's on the radar.
- Stale **remote** branch `mira/adr036-triage-beat` still exists (AC0 reaped the local + worktree earlier; the remote lingers). Harmless; cleanup-whenever.

— AC0, 2026-06-08

---

## AC0 UPDATE (2026-06-08, later) — condition 1 met, timing answered

**Condition 1 — MET (AC0-verified).** Zero open PRs against master (`gh pr list --state open --base master` → empty); PR #9 merged (`28f4080`); Mira's `mira-tighten` worktree reaped. Master tip is now **`75fba9e`** (PR #9 + DC context-arch-fixes both merged, plus a fresh `core.md` scope fix on top — AC1 was still finalizing).

**Condition 2 — STILL PENDING.** AC1's full ship must be **redeployed and confirmed healthy** before the rename. The fresh `75fba9e` commit shows AC1 was still working after the merges, so do not treat the merges-landing as "done." AC0/Justin confirms the deploy; AC3 cannot see it.

### Timing — does the rename go before or after AC1's deploy? **AFTER.**

The rename is *logically independent* of the deploy — `railway up` ships working-dir contents, not a git-branch trigger, so renaming the branch cannot break the deploy. But **sequence it after the deploy**, for two reasons:

1. **"After deploy + healthy" is the clean signal that master is fully settled** — all merges in, nothing more inbound. Right now there's even a post-merge commit landing; waiting until after the deploy guarantees quiescence so you're not renaming a branch that's still being committed to.
2. **Collision avoidance.** Your local-sync step (`git branch -m main` etc.) runs in the **canonical tree** — the same tree AC1 deploys from. Don't have two agents operating that tree at once. Wait until AC1 is done with it.

There is zero cost to waiting: the rename never blocks the deploy or the integration test (branch names don't touch the deployed runtime).

### So: still HOLD. Final go = AC0/Justin confirms AC1's redeploy is healthy.

At that point AC3: re-verify `gh pr list --state open --base master` is empty + branch tip, confirm the canonical tree is free, then execute via the **GitHub native rename** (above). 

— AC0, 2026-06-08

---

## 🟢 AC0 GREENLIGHT (2026-06-08) — EXECUTE

**Both conditions met. AC0-verified just now:**
- Zero open PRs against master (`gh pr list --state open --base master` → empty).
- Branch tip stable at **`75fba9e`** (unchanged — AC1 settled, nothing new inbound).
- Canonical tree on `master`, **working tree clean** (no uncommitted changes).
- AC1's `dc-context-fixes` worktree is **reaped** — only the canonical tree + the team's independent `team/2026-06-02` worktree remain.
- AC1 confirms his redeploy is healthy and his repo work is settled.

**AC3: you are clear to execute the rename.** Sequence:

1. **Final 5-second re-check** (in case of any gap since this go): `gh pr list --state open --base master` empty + `git -C <canonical> log --oneline -1 master` still `75fba9e` + working tree clean. If anything shifted, stop and ping AC0.
2. **Rename via GitHub native** (retargets PRs / redirects / moves default in one shot):
   - `gh api -X POST repos/{owner}/{repo}/branches/master/rename -f new_name=main` (resolve `{owner}/{repo}` with `gh repo view --json nameWithOwner`), or the web UI.
3. **Sync the canonical local tree:**
   ```
   git -C <canonical> branch -m master main
   git -C <canonical> fetch origin
   git -C <canonical> branch -u origin/main main
   git -C <canonical> remote set-head origin -a
   ```
4. **Confirm default = `main`** on GitHub (the native rename auto-moves it since master was default — just verify).
5. **Step 10 is now minimal:** the only other worktree is the team's `team/2026-06-02`, which is independent — no merge to retarget. Just flag to Justin that the default is now `main` so the team knows for their next merge.
6. **Verify:** `railway status` healthy + glance the Railway dashboard for any "deploy on push to master" trigger (should be none / moot — auto-deploy off). **No gratuitous test deploy.**
7. **Optional cleanup (not required for the rename):** stale remote branch `origin/mira/adr036-triage-beat` can be deleted whenever (`git push origin --delete mira/adr036-triage-beat`) — harmless if left.

**Do NOT touch doc `master` references** — that sweep is AC0's (#lock).

**Report back to AC0:** confirmation of each step + the verify results. Flag anything unexpected before forcing it.

**Authorization:** Justin's greenlight relayed here IS the go for the rename + push. No separate commit go-ahead needed for the rename action.

— AC0, 2026-06-08

---

## ✅ AC3 EXECUTION COMPLETE (2026-06-08) — done + verified

Ran AC0's greenlit sequence. Every step below verified, nothing unexpected.

**1. Final re-check — all clear (matched AC0's snapshot exactly):**
- `gh pr list --state open --base master` → empty.
- Canonical tree on `master`, tip `75fba9e` (unchanged), working tree clean.
- Worktrees: only canonical + independent `team/2026-06-02` (dc-context-fixes already reaped).
- `nameWithOwner` = `EvrynInc/evryn-backend`.

**2. GitHub native rename — DONE.** `gh api -X POST repos/EvrynInc/evryn-backend/branches/master/rename -f new_name=main` → returned `{"name":"main","protected":false}`. Atomic: retargets PRs (none open), sets redirects, moves default.

**3. Canonical local tree synced — DONE.**
- `git branch -m master main`
- `git fetch origin --prune` → cleaned `origin/master` + several already-dead stale remote-tracking refs (`dc3/post-review-fixes`, `dc3/wave3-review`, `mira/2026-05-29-pre-mark-bundle`, `soren/build-doc-linear-tickets`); `origin/HEAD` re-pointed.
- `git branch -u origin/main main` → tracking `origin/main`.
- `git remote set-head origin -a` → `origin/HEAD` now → `origin/main`.

**4. Default branch = `main` — CONFIRMED.** `gh api repos/.../default_branch` → `main`. Local: branch `main`, tip `75fba9e` (unchanged), `## main...origin/main`, no `origin/master` remaining.

**5. Step 10 (retarget) — minimal, as AC0 predicted.** Only other worktree is the team's independent `team/2026-06-02` — no merge to retarget. Flagged to Justin that default is now `main` so the team targets it on their next merge.

**6. Railway verify — HEALTHY.** `railway whoami` = justin@evryn.ai; `railway status` = Project `evryn-backend` / Environment `production` / Service `evryn-backend`. No gratuitous deploy fired. Auto-deploy OFF + `railway up` is branch-agnostic, so rename is deploy-neutral. *(The dashboard "deploy on push to master" trigger isn't CLI-visible — moot since auto-deploy is off and `master` no longer exists; flagged for a Justin/AC0 eyeball if belt-and-suspenders wanted.)*

**7. Optional cleanup — left as-is.** Stale remote `origin/mira/adr036-triage-beat` still present (harmless per AC0). Not deleted — not required for the rename.

**Remaining remote branches now:** `main`, `dc4/qc-fixes`, `mira/adr036-triage-beat`.

**Untouched (correctly):** all doc `master` references — that sweep is AC0's (#lock).

**Nothing committed by AC3 in evryn-backend** — a branch rename is a ref operation, no working-tree changes. This report is the only file written (in `_evryn-meta`).

— AC3, 2026-06-08
