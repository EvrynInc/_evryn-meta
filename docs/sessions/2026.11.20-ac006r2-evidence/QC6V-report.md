<!-- copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/QC6V-report.md; original sha256 2056615721e5c4a47b86b4bbb92131a5c66329b782a9ddd8bd49931686ef7029; copied 2026-11-20 by AC-006R2 -->
# QC6V report: PAUSED — PARTIAL (verification of `16fb675`, migration 006's pre-paste fixes)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.
>
> **What this is:** the state of QC6V's work when it was paused. QC6V is a fresh Opus QC spun by AC-006R. The pause order came from the Fleet Admiral, on Justin's word, at about 09:25 PT on Thu 2026-11-19. Work ran from **09:10:44 to 09:29:40 PT**. **This is not a verdict: no GO or NO-GO is given here.**
>
> Every database was a throwaway loopback cluster. No Supabase project was connected to, no secret or `.env` was read, nothing was committed, and the worktree `_evryn-meta-guards-006` was only read. 🔴 **The real live rows were not available: nobody in this lane may connect to the live database.** My scratch is in `C:\Users\jbmcg\.claude\jobs\51110d9e\tmp\qc6v\`.

## Receipts

**Load trip:** the full mandatory list, receipted separately to the spinner.

**Work trip, read with `Read`:**
- `builds/5-migration-006-v2.md`, lines 1–200, canary at 200.
- `crew/2026.11.19-QC6-report.md`, lines 1–226, canary at 226.
- `DC6F-report.md`, lines 1–156, canary at 156. I read it **after** my own pass over the diff.
- `crew/2026.11.18-DCG-6-report.md`, lines 1–246, canary at 246.

**Read beyond the list, each with why:**
- QC6's `qc6-probe/probe.mjs` (1–169) and `probe2.mjs` (1–63), whole. I copied each and retargeted the copy at my sandbox; the originals were not edited.
- QC6's `qc6-probe/mutate.mjs` (1–142, whole; it holds the builder's 39 controls) and DC6F's `dc6f/mutate.mjs` (1–118, whole). I copied both and retargeted the copies.

**Bash:**
- `git diff --stat` and `git diff 1f37fae 16fb675`, on the migration and the README.
- `git diff --stat main...16fb675`, `git log`, and the commit message.
- The suites, `make-paste --check`, the probes and the harnesses (results below).

**Refused, disclosed:** one Bash call that would have stopped two test clusters orphaned by the pause (see "Stopping safely"). I did not retry it.

## What I ran, and what it showed

**Suites, in my sandbox `qc6v-sandbox`** (detached at `16fb675`, clean; its `CODE_ROOT` is `tmp`, which holds no `.env`):

| Suite | Result |
|---|---|
| Unit | 168/168 |
| Acceptance, defaults off | 179/179 |
| Acceptance, `EVRYN_TASKS_DEFAULTS=on` | 179/179 |

- `make-paste.mjs --check`: OK for all three change sets.
- Both 006 pastes carry exactly `-- migrations sha256: aeca893ddd03e1160eb42780d27af515a9106a41833fd6565435064e735b6ca0  (006_authorization_record.sql; LF-normalized)`: line 2 of Paste 1, line 3 of Paste 2.

**QC6's probes against `16fb675`** (`qc6v/probe.out` and `probe2.out`, each diffed against QC6's `1f37fae` output):

| Probe | At `1f37fae` | At `16fb675` |
|---|---|---|
| A1: another task's row authorizes C | accepted | **refused, ET014** |
| A2: stale own row reopens R | accepted | **refused, ET014** |
| A3: another task's acceptance closes E | accepted | **refused, ET011** |
| B5: a role not on the old deny-list gets the exemption | accepted | **refused, ET011** |
| D1: scope edit plus close | accepted, silently proposed | **refused, ET016**; the task is untouched |
| D2: returned task, then decided against | flag stays true | **flag false** |

- B4, C1, the data steps through the REAL 006 paste on a 19-row seeded post-005 copy in LF and CRLF (E), and the snapshot check (F) are **byte-identical** to QC6's results.
  - The dry run read `19 rows; 0 NOT VALID; 4 backlog rows moved; 10 rows backfilled`.
  - A1b is QC6's own syntax error, unchanged; it proves nothing.
- `probe2`, as a non-superuser owner `postgres`: the committed pastes 001-004, 005 and 006 applied; the dry run read `4/0/1/2`. The launcher's note-only write, with no session, on an open task was accepted with the authorization kept.

**My own probe, `qc6v/hunt.mjs` → `hunt.out`:** hunting for legitimate paths the fixes broke.
- **These all pass:**
  - authorize from backlog, proposed and returned;
  - re-authorize an active task at tier justin (the upgrade path);
  - two rows for one task in one request;
  - lucas-tier and justin-tier acceptances, with lucas refused after an upgrade;
  - owner withdrawals: active → proposed → backlog → decided_against;
  - scope plus a withdrawal to proposed;
  - lucas reopening a decided-against task and a done task, then re-authorizing;
  - note-only writes on open and on needs_acceptance;
  - the launcher, with no session.
- **Ordering inside `tasks_before_write`:**
  - a scope edit with the status unchanged takes the forced return, not ET016;
  - scope plus `in_progress` or `backlog` is refused by ET016;
  - a client clearing the flag while closing is refused by ET014, and the same close without it clears the flag (C6).
- **On a Supabase-shaped cluster** (`postgres` the non-superuser owner):
  - the exemption works for the owner, both for the move and for the backfill row;
  - it is refused to `service_role`, to `supabase_admin` (a superuser that is not the owner), and to a member of `postgres`;
  - `authenticator` is denied on the table;
  - `anon` and `authenticated` reached zero rows (RLS), and the status was unchanged.

**Observations so far, NOT yet ranked:**
1. **H9, a residual, reachable only by whoever can set the setting (today, the owner):** with the setting naming the task's own still-matching row, a withdrawn task can be reopened. That satisfies C4's letter.
2. **The setting's task half is now unpinned by any test.** NB1's row binding makes it redundant. A test could isolate it: update X with a setting naming `rowX:Y`.
3. **H8g:** a returned task moved to backlog keeps `needs_reauthorization` (C6 covers closed tasks only). Cosmetic.
4. **Two control mutations stayed green, as I expected:**
   - narrowing ET016 to closing statuses stays green on every behavioural test, so scope plus an active → active move (the H8b shape) has no test of its own;
   - limiting C6's clearing to `decided_against` alone is an equivalent mutant, because `done` comes only through acceptance, where the flag is already false.

## Fix status (each still needs the final write-up)

- **NB1, NB4, cosmetic 5 and cosmetic 6:** the attack that succeeded at `1f37fae` is now refused, for the right reason, by execution (above).
- **NB3:** suite green, and its control red (see below).
- **NB2, departure 1 and the README:** tests green and DC6F's controls red. The README was checked by reading.
- **Not yet done:** a ruling on each finding, written up.

## Where the control runs stand

**DC6F's 22 controls, re-run in the copy sandbox `qc6v-sandbox2`** (`qc6v/mutation-B.txt`):
- Clean baseline in the same run: 19 sets OK.
- Every control applied, the migration still applied each time, and every restore was verified.
- **All went RED for the named test, except two:**
  - `C4-task-half-of-setting-dropped` stayed GREEN. **This confirms DC6F's claim** (its own harness labels it "UNEXPECTED"; DC6F's report explains it).
  - `C4-both-task-checks-dropped` stayed GREEN, as DC6F expected.
- `C4-all-three` went RED. The calibration control stayed GREEN.

**The builder's 39, plus QC6's extras, re-run in `qc6v-sandbox`** (`qc6v/mutation-A.txt`):
- Clean baseline: 29 sets OK.
- C5 control 2 was re-targeted at the allow-list text.
- **38 of 39 went RED, with first red the named test.** No syntax error, no failed migration, every restore verified.
- **The one exception is `C4-task-half-dropped`, which stayed GREEN.** That is the same finding as DC6F's: test 17 still guards C4 through the row binding, and the "all three dropped" control goes red.
- Of QC6's extras:
  - two ran and went RED (acceptance with no authorization; acceptance with a mismatched scope);
  - two SKIPPED, because their text moved when the hints were added (DC6F's NB2 g and h cover them);
  - **the rest were interrupted by the pause.**

**My own controls** (`qc6v/mutation-C.txt`): two of six ran, ET016's proposed exception (RED) and ET016 narrowed (GREEN, observation 4). **The other four were interrupted.**

**Stopping safely:**
- I stopped harnesses A and C.
- `qc6v-sandbox` was restored with `git checkout` of the one mutated file. **It is clean at `16fb675`.**
- `qc6v-sandbox2` (a plain copy, not a worktree) was restored byte-for-byte and verified with `diff -r`.
- ⚠️ **Two orphaned throwaway clusters are still running, both mine:** `C:/Users/jbmcg/AppData/Local/Temp/evryn-tasks-pg-qKW4Ts` (port 64727) and `evryn-tasks-pg-Bsarea` (port 55297), both started 09:28, loopback only. My `pg_ctl stop` was refused, and I did not retry it. **They need stopping:** `pg_ctl -D <dir>/data -m immediate stop`, then delete the dir.

## What remains

- Finish QC6's remaining extras and my four remaining controls.
- Write a full section ruling on each of DC6F's departures. **Leaning, by evidence so far:**
  - **YES:** the scope check on every use; the hints; ET016; NB3 as a new suite plus a helper.
  - **YES with a note:** one commit.
- Rank the observations above as findings.
- Finish the fresh-eyes read of `main...16fb675` against C3–C5. Done by reading so far; no defect found yet.
- Give the GO or NO-GO.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
