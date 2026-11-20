<!-- copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/log-pending-0835.md; original sha256 dcb5c5a3f3b3a091e9cd1c81d33d4e3f3ac7a8cb602d41f0e9018964b8530072; copied 2026-11-20 by AC-006R2 -->
### 2026-11-19T08:35:56-0800 — AC-006R: QC6 returned GO (no blockers); my decision on each finding; fix trip DC6F next

(PENDING ENTRY for the brief's Log. Written to scratch because the bg-isolation guard refused my Edit of the brief at ~08:37, the same guard that earlier refused crew/ writes. Earlier Edits of the brief, through 07:2x, were accepted.)

- **QC6's report:** `evryn-team-workspace/shared/projects/product/2026/2026.11.18-guards-build/crew/2026.11.19-QC6-report.md` (226 lines; read whole, canary L226). Its crew/ write succeeded.
  - GO, no blockers.
  - Suites in its sandbox: 168 / 161 / 161.
  - Controls: all 39 of the builder's went red for the mutation's reason, with a clean baseline in the same run.
  - Paste: the real 006 paste applied on a seeded post-005 copy (19 rows: 4 backlog moves, 10 backfills), LF and CRLF, and with a non-superuser `postgres` owner.
  - Real live rows: not available.
- **Why route the non-blockers now:** the paste is one-time, so a later fix costs Justin a second paste (ADR-061).

**My decision on each finding:**
1. **NB1, C4 binds the setting's text, not the row: AGREE, FIX.** Require `task_authorizations.task_id = new.id` wherever the setting is honoured, and a scope match on the move into active work. Ship tests for three shapes, each with a control:
   - `rowA:C` (a setting naming another task's row);
   - a task's own stale row after a scope edit;
   - self-acceptance with another task's acceptance row.
2. **NB2, eight guards with only a hash pin: AGREE, FIX.** One behavioural test plus a control for each of `:285`, `:297` (reachable today), `:308`, `:312`, `:338`, `:580`, `:605`, `:609`. Seed the unreachable states as the owner with triggers disabled.
3. **NB3, the paste suites run as a superuser: AGREE, as a targeted TEST.** Run the real 001-004, 005 and 006 pastes as a non-superuser `postgres` owner, on a cluster bootstrapped with `-U supabase_admin`. **Not** a global `cluster.mjs` change, since every suite's role setup assumes a superuser; that stays a should-do for 007.
4. **NB4, C5's role check is a deny-list: AGREE, FIX.** Fail closed: grant the exemption only when `current_user` owns `public.tasks`. Test it, with a control.
5. **C5, a scope edit plus a close becomes `proposed` with `closed_at` set: AGREE, FIX.** On authorized work, refuse a single write that changes both scope and status (to anything but `proposed`). Test it.
6. **C6, the flag stays true after close: AGREE, FIX.** The trigger clears `needs_reauthorization` on a move to `decided_against` or `done`. Test it.
7. **C7, data step 2 clears `tasks.note`: NO CHANGE.** By design (005's one-write note); history keeps every note.
8. **C8: README YES** (`import-linear --apply` is retired by 006). The 87/89 count lives only in the builder's report; correcting it is recorded here.
9. **Departure 1's caveat: AGREE, FIX.** Re-prove 005's note semantics (the comment row, the stale-note no-op) on the 001–006 shape.
10. **The T-97 note on departure 4: NO CHANGE in 006.** Owner: whoever builds T-97.

**QC6's rulings, adopted:**
- departures 1–13: YES;
- §6.1, merge the CLI in the same sitting as the paste: YES;
- the 005 pin: YES as the committed record, NO as proof of what Justin ran. Owed: whoever holds the 11/06 live record.

**Consequence:** the hash pins, the after-006 golden and both 006 pastes regenerate, so the `-- migrations sha256:` header will change from `c3639e59…`.

### 2026-11-19T08:38:33-0800 — AC-006R: the Admiral's ruling on the guard block (PENDING entry, scratch)

- **Ruling from Adm Soren 1.19 pm [7387d2], by message:**
  - **(c) YES:** run DC6F now on the 4 non-blockers and 3 cosmetics as decided. Log entries stay in scratch, and the READY names the deviation (load list recorded in scratch, not committed before the spin).
  - **(a) NO:** nobody copies my entries in from another session; the subagents' transcripts are the durable record.
  - **DC6F writes only its branch,** so its report goes to my scratch, not crew/.
  - **(b)** is Justin's, and the Admiral is putting it to him.
  - **READY goes by message to `Adm Soren 1.19 pm [7387d2]`.** Send nothing to [ce1d5b] (a second session with the same name, not launched by the Admiral).
- **DC6F trip 1:** `dc6f-trip1.txt` (QC6's sent trip 1 with four substitutions: DC, dc.md, "is not DC", dc.md (full — 362)). The same 61 files plus brief.md 418–704, with qc.md replaced by dc.md. Model Opus, type dc.
- **DC6F trip 2:** `dc6f-task.md`.

### 2026-11-19T08:41:31-0800 — AC-006R: DC6F load VERIFIED by script; work trip sent (PENDING entry, scratch)

- **Checker** (the same one, controlled earlier): **62 of 62 files proven whole.**
  - **Calls: 66** (Read 63, Bash 2, SubagentHandback 1). **Errors: 2, both Bash.** The first (`git -C /c/...`) was disclosed.
  - The second (`git worktree list; ls ...`) is recorded by the harness as an error, but DC6F's receipt calls it a successful retry. Its output did show the worktree at 1f37fae, and the error is probably the trailing `ls`.
  - **Deviation let stand:** a loose description of a call that affects no load. No listed file depends on it.
- **CLAUDE.md given:** `_evryn-meta`'s router (seen in its transcript).
- **Line counts it flagged:** local-postgres.test.mjs 1362 and migration-006.test.mjs 663, against the brief's 1361 and 662. That is the wc-reads-one-short case, with the canary on the last line, so it is not a defect.
- **Work trip:** `dc6f-task.md`, sent verbatim, plus two binding lines added before sending:
  - do NOT delete or edit `settings.local.json` or any settings file (its manual's SESSION STARTUP says to, and our limits forbid it);
  - use `C:/` paths with `git -C`.

### 2026-11-19T09:06:30-0800 — AC-006R: DC6F returned (16fb675); my review of its diff; QC6V verification spin (PENDING entry, scratch)

- **DC6F:** one commit, `16fb675` on soren/migration-006 (not pushed). Report: `DC6F-report.md` in my scratch (156 lines, read whole, canary).
  - **Suites:** before 168/161/161; **after 168/179/179**. `make-paste --check` OK for all three change sets.
  - **New header:** `-- migrations sha256: aeca893ddd03e1160eb42780d27af515a9106a41833fd6565435064e735b6ca0  (006_authorization_record.sql; LF-normalized)`.
  - **Unchanged:** the 001-004 and 005 pastes, the after-004 and after-005 goldens, cluster.mjs. In after-006, only the two function hashes moved.
- **My review of the full diff** (migration, README, after.plpgsql; read whole):
  - **NB1's lookup** now requires `task_id = new.id AND scope_hash = new.scope_hash` (DC6F applied the scope check to every use, not only the move into active work). **Accepted:** every legitimate path stamps the row from the task's current scope, and `new.scope_hash` is computed before the lookup.
  - **ET016** sits inside the authorized-work scope-edit branch. **C6's flag clearing** comes after ET014's check. **NB4's allow-list** is the owner of public.tasks, which is `postgres` in Justin's editor.
- **DC6F's departures, all accepted:**
  1. the scope check on every use;
  2. distinct hints on the two active→active refusals, so guard g is testable (g is subsumed by h, and c by d);
  3. a new code, ET016;
  4. one commit, not eight;
  5. NB3 as a new suite plus a helper beside cluster.mjs.
- **Its finding:** the builder's test-17 control (drop the setting's task half) now stays green, because NB1 makes that check redundant. Dropping all three checks turns test 17 red. **Kept as defense in depth. Accepted.**
- **Its gap, routed to QC6V:** it did not re-run the builder's original 39 controls (two were retargeted). QC6V re-runs all 39 plus DC6F's.
- **Instrument note:** my `tasklist //FI` call ERRORS ("Invalid argument/option") and printed 0 earlier. **That 0 was a failed instrument, not a count.** Use powershell Get-Process.
- **QC6V (fresh Opus QC, new spawn):**
  - **Trip 1** = QC6's sent trip 1 with the head changed to 16fb675; 006.sql 993→1018; migration-006.test 662→836; two new files: cluster-supabase.mjs (94) and paste-supabase-owner.test.mjs (114). File: `qc6v-trip1.txt`.
  - **Expectation list:** `qc6v.json` (64 entries).

### 2026-11-19T09:07:10-0800 — AC-006R: routing (PENDING entry, scratch)

- **The Admiral is now `Adm Soren 1.19 pm2`, by message.** READY goes to the literal target `Adm Soren 1.19 pm2`. The 08:38 ruling stands.

### 2026-11-19T09:09:49-0800 — AC-006R: QC6V load VERIFIED by script; work trip sent (PENDING entry, scratch)

- **Load: 64 of 64 files proven whole.** Calls: 71 (Read 69, Bash 1, SubagentHandback 1). **Errors: 0.**
- **CLAUDE.md given:** `_evryn-meta`'s router.
- **Its partial `qc.md` read** (1–274, at the cap) was disclosed and completed (275–584).
- **Minor, let stand:** its router diff ran inside the branch worktree, so it proved nothing. The router on `_evryn-meta` main is unchanged since my own diff at session start.
- **Work trip:** `qc6v-task.md`, sent verbatim. Sandbox: `qc6v-sandbox` (detached at 16fb675). QC6's sandbox was reaped clean.

### 2026-11-19T09:28:40-0800 — AC-006R: ALL WORK PAUSED on Justin's order, via the Fleet Admiral (PENDING entry, scratch)

- **From Adm Lucas 1.19 am4** (~09:25): finish in-flight calls only. No new DC or QC trips, edits or commits. Crew stop at a safe point and persist. Wait for word from Adm Soren 1.19 pm2 or the Fleet Admiral.
- **QC6V** (mid work trip, verifying 16fb675) was told to stop safely and write a PAUSED — PARTIAL report to `QC6V-report.md` in my scratch.
- **State at pause:**
  - branch `soren/migration-006` at **16fb675** (not pushed; origin still at 1f37fae);
  - suites green per DC6F (168/179/179);
  - QC6V verification incomplete;
  - **NOT at GO;** no READY sent;
  - sandbox `qc6v-sandbox` live (to be reaped);
  - QC6 and DC6F finished, their sandboxes reaped.

### 2026-11-19T09:30:46-0800 — AC-006R: QC6V paused cleanly (PENDING entry, scratch)

- **Partial report:** `QC6V-report.md` in my scratch, headed PAUSED — PARTIAL. **No verdict yet.**
- **So far:**
  - suites at 16fb675 are 168/179/179; `make-paste --check` OK; the `aeca893d…` header is on both 006 pastes;
  - QC6's attacks A1–A3, B5, D1 and D2 are now refused for the right reason;
  - the data steps through the real paste (LF and CRLF) match QC6's results;
  - no legitimate path found broken;
  - DC6F's 22 controls re-run; the builder's 39: 38 red, and test 17's task-half control stays green, as DC6F said;
  - QC6's extra controls and QC6V's own were not finished.
- **Left running:** two throwaway loopback test clusters, `C:/Users/jbmcg/AppData/Local/Temp/evryn-tasks-pg-qKW4Ts` and `evryn-tasks-pg-Bsarea`. QC6V's `pg_ctl stop` was REFUSED by the harness. **I am NOT stopping them on its behalf** (that would route around the refusal). **Surfaced** to the Admiral and the user, for whoever is permitted.
- **Sandboxes still on disk:** `qc6v-sandbox` (a worktree at 16fb675, clean) and `qc6v-sandbox2` (a plain copy). Reaping is paused with all other work.
