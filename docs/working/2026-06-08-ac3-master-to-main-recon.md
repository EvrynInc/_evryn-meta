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
