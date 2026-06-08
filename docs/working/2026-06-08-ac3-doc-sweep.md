# AC3 task — `master` → `main` documentation sweep (post-rename)

**From:** AC0 · **To:** AC3 · **Date:** 2026-06-08
**Why:** AC3 renamed evryn-backend's default branch `master` → `main` (verified complete). The git side is done; this is the **documentation fallout** — prose references to "master" across the docs that are now stale. AC0 is heading into the integration test, so this is yours.

**Context load:** You do **not** need the architectural cascade. This is per-hit judgment local to each sentence — read the surrounding lines, classify, edit. If you want calibration on what "the live setup" looks like, skim `_evryn-meta/docs/current-state.md`, but that's optional. The rule below carries it.

---

## The core rule — this is READ-AND-JUDGE, not find-replace

For every `master` you find, ask one question: **is this describing how things are NOW, or recording what happened THEN?**

- **NOW (live reference to the current default branch) → change to `main`.**
  Examples: "the validated bundle is on master", "deploy from master", "work on master", a `git checkout master` instruction, "master is the default branch", a repo-self link like `.../blob/master/...`.

- **THEN (historical / point-in-time record) → LEAVE as `master`.**
  Examples: CHANGELOG entries ("deployed master `1610f3b` on 2026-06-04"), session docs / handoffs (dated snapshots), "merged to master on date X". Rewriting these to `main` would **falsify the historical record** — the branch *was* called master then. Don't.

When you're genuinely unsure whether a hit is now-vs-then: **leave it and list it in your report** for AC0. Don't guess — a wrong "fix" to a historical record is worse than a missed one.

## ⚠️ NEVER touch these — "master" that is NOT the git branch

A naive find-replace would corrupt these. They are not branch references — leave every one untouched:
- **"Master Plan"** / **`master-plan-reference.md`** (the company planning doc — "Main Plan" would be nonsense)
- **"ProRes master"** (a video term, in a test fixture)
- **backup JSON / `.sql` data dumps** (raw data, not prose)
- any **"master"** inside a third-party name, a quote, or sample data

Only the **git branch** named `master` becomes `main`.

---

## Where to look

Don't trust this list alone — **grep each repo** for `master` (case-insensitive) and judge every hit. But the known surfaces:

**`evryn-backend`** (the renamed repo — most live refs are here):
- `docs/ARCHITECTURE.md`, `docs/SPRINT-MARK-LIVE.md`, `docs/BUILD-EVRYN-MVP.md`
- `docs/operator-guide.md`, `docs/schema-reference.md` (grep — may or may not have hits)
- `docs/dc-to-ac.md`, `docs/ac-to-dc.md` (mailbox — likely historical, judge each)
- `CHANGELOG.md` (almost all historical → leave; see CHANGELOG step below)
- historical/session docs under `docs/` (historical → leave)

**`_evryn-meta`** (references to evryn-backend's branch live here too):
- `docs/current-state.md` — **propose only, do NOT edit** (see below). Likely the main live ref.
- `CHANGELOG.md` — historical entries leave; add the new rename entry (below).
- `docs/sessions/**` handoffs + `docs/working/**` (incl. this doc and the recon doc) — these are **dated records of the rename process → LEAVE**. They're history now.

Net: in `_evryn-meta` your actual edits should be small — mostly the CHANGELOG entry — because most hits are historical.

---

## Two special files

1. **CHANGELOG.md (`_evryn-meta/CHANGELOG.md`)** — freely editable (it's excluded from the approval rule). **Add a new top entry** recording the rename: evryn-backend default branch renamed `master` → `main` on 2026-06-08, via GitHub native rename (retargets PRs, redirects, moves default); remote `master` deleted; local trees synced. Match the existing entry format/voice — read the top few entries first.

2. **current-state.md (`_evryn-meta/docs/current-state.md`)** — **approval-gated: propose, do NOT edit directly.** If it has a live `master` reference (e.g., in the Infrastructure section), write the exact one-line change you'd make into your report. Justin approves, then you apply it. (If he's not around, it falls to AC0's #lock — fine.)

---

## Commit discipline

- Stage **only files you changed**, by path — never `git add -A` (other agents share these repos).
- Verify branch before editing each repo: `evryn-backend` is now on `main`; `_evryn-meta` on `main`.
- **Get Justin's explicit go before committing/pushing.** This is a docs sweep, not mailbox traffic, so it needs his go-ahead.

## Optional secondary (only if you want it — gated)

Stale remote-branch cleanup on evryn-backend, surfaced during the rename:
- `mira/adr036-triage-beat` — content is already in `main`; safe to delete (`git push origin --delete mira/adr036-triage-beat`).
- `dc4/qc-fixes` — **verify it's merged into `main` first** (`git branch --merged main` / check the PR); do NOT delete unmerged work.
- Get Justin's go before deleting either. If you'd rather not, leave them — AC0 has them on the #lock list.

---

## Report back to AC0

- Which files you edited (live → main) and a quick count.
- Anything you left as historical that might look like a live ref (so AC0 can sanity-check the judgment calls).
- The proposed current-state one-liner (if any).
- Whether you did the optional branch cleanup.

— AC0, 2026-06-08
