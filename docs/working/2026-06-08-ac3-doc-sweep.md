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

---

## ✅ AC3 SWEEP COMPLETE (2026-06-08) — report back to AC0

Grepped both repos (case-insensitive), read-and-judged every hit per the now-vs-then rule.

### Edits made (LIVE → `main`) — 4 total, all in `_evryn-meta`, all HELD for Justin's commit review

I extended slightly beyond evryn-backend-specific refs — reasoning first: **after the rename, no repo in the ecosystem is named `master` anymore**, so generic operating-doc refs meaning "the default/integration branch" are now globally stale, not just evryn-backend's. The four:

1. `docs/protocols/ac-orchestration-protocol.md` — 3 refs, all live workflow instructions a future AC/subagent follows:
   - "the subagent … never touches `master`" → `main`
   - "Merging to master ≠ deploying" → `main`
   - "AC merges to master … never lets a subagent push to master" → `main`
2. `CLAUDE.md` — 1 ref: the PR-review technique example `git diff master..pr-branch` → `git diff main..pr-branch` (the base branch in that technique is now `main` everywhere).

(Flagging the scope extension because you expected `_evryn-meta` edits to be "mostly CHANGELOG." Easily reverted if you'd rather scope tighter — but I believe these are genuinely now-stale.)

### Already done in my #lock (not re-touched)
Your two "special files":
- **CHANGELOG.md** rename entry → already added + pushed during the lock (commit `eecd087`, the 2026-06-08 entry).
- **current-state.md** Infrastructure live-ref → already added during the lock ("evryn-backend default branch: `main` …", Justin-approved). So current-state's live ref already reads `main`.

### LEFT as historical (the judgment calls — sanity-check these)
- **`evryn-backend` `docs/ARCHITECTURE.md:1165` + `docs/BUILD-EVRYN-MVP.md:16`** — both contain "QC-verified on `master` / deploy `master`" BUT inside **dated state-blocks** ("Build (as of 2026-06-04)" / "Phase … As of 2026-06-04"). On those dates the branch *was* master, and the blocks are also stale in other ways (they describe the Oregon cutover as pending when it's DONE). Per your now-vs-then rule (dated snapshot → leave) I left them — **and recommend folding the master→main fix into your owed ARCHITECTURE/BUILD full-accuracy pass** (current-state flags that pass as owed) rather than spot-editing one word in a block you're about to rewrite. Your call.
- **`evryn-backend` `docs/SPRINT-MARK-LIVE.md:16`** — "`railway up` (deploy `master`)" under the dated heading "2026-06-04 → 06-05"; cutover is done. Dated record → left.
- **Mailboxes** `evryn-backend/docs/{dc-to-ac,ac-to-dc}.md` — all "merged to master `<sha>`" / "branch off master" are dated brief/absorption records → left.
- **All `_evryn-meta/docs/sessions/**` + `docs/sessions/2026-06-04-ac0-handoff.md`** (dated handoffs/packouts, incl. the one recording the *decision* to do this rename) → left. **All CHANGELOG + changelog-historical entries** → left.
- **`CLAUDE.md:336/338`** — "`master`/`main`" (worktree discipline) is *deliberately generic* ("the default branch, whatever it's called"); not a stale assertion → left. Optional simplification to just `main` now all repos are main — your/Justin's call, flagged not done.
- **NEVER-touch class** (left, as instructed): all "Master Plan" / `master-plan-reference.md` (Hub, spokes, ADRs), "master key" / "puppet master" (technical-vision, vision-and-ethos, long-term-vision, master-plan), "ProRes master" (test fixture), backup `.json`/`.sql` data dumps.

### Proposed current-state one-liner (approval-gated — did NOT edit)
The Pending-doc-syncs bullet I added during the lock (`master→main doc-reference sweep — OWED (AC0)`) can now be updated to reflect the sweep is done. Proposed replacement:
> - **`master`→`main` doc-reference sweep — DONE (AC3, 2026-06-08).** Live operating-doc refs updated to `main` (orchestration protocol ×3, CLAUDE.md PR-review example); all historical/dated refs + "Master Plan"/"master key" left intact. **Remaining:** the `master` refs in `evryn-backend` ARCHITECTURE.md / BUILD-EVRYN-MVP.md dated state-blocks — folded into AC0's owed ARCHITECTURE/BUILD accuracy pass.

(Justin approves → I apply. Or it rides your next #lock.)

### Optional branch cleanup — NOT done (gated)
Left `mira/adr036-triage-beat` + `dc4/qc-fixes` remote branches alone per your "leave them, AC0 has them on the #lock list." If Justin wants them gone I'll verify-merged-then-delete; otherwise they stay.

— AC3, 2026-06-08
