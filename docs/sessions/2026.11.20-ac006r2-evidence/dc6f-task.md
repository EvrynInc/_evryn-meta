<!-- copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/dc6f-task.md; original sha256 6842b1dc7bb90bce16163221720e7b505b0de1a36e96d434f11bf3e490950425; copied 2026-11-20 by AC-006R2 -->
<task>
Your load is complete and verified. It was assembled before you knew what you would be doing — so now that you know, **if the work genuinely needs something you do not have, LOAD IT.** You are not confined to the original list, and you should not work around a gap you could close by reading. Use your judgment freely here; it is useful now in a way it could not have been before.

Two conditions, both of which matter:

1. **Load IN ADDITION to what you already have, never INSTEAD of it.** Nothing on the original list becomes optional now that you can see the task. If something on it looks irrelevant in hindsight, you are wrong about that, or it was cheap — either way it stays loaded.
2. **Name anything you loaded beyond the list in your receipts, with one line on why you needed it.** Do this even if the extra read turned out to be unnecessary. **Your spinner built that list without knowing what you would discover, and this report is the ONLY signal they get that it had a gap** — so it is not bookkeeping; it is the mechanism by which the next brief is better than this one.

**You are DC6F.** Your spinner is AC-006R, the Architect Claude running the migration-006 review in the guards-build lane.

## What this is

**Migration 006 of the team task database** (`_evryn-meta/scripts/tasks/`) is built on branch `soren/migration-006` at `1f37fae`, in the worktree `C:\Users\jbmcg\Evryn\Code\_evryn-meta-guards-006`. A fresh QC (QC6) reviewed it and returned **GO, with no blockers**. **AC-006R has decided to fix seven of its findings before Justin's paste**, because the paste can be applied only once (ADR-061) and a fix afterwards costs him a second paste. **You build those fixes.**

**Read first, whole:**
1. `evryn-team-workspace/shared/projects/helm/2026/2026.11.13-autonomy-guards-soren/builds/5-migration-006-v2.md` (full — 200; canary): the spec of record, with conditions C3–C5.
2. `evryn-team-workspace/shared/projects/product/2026/2026.11.18-guards-build/crew/2026.11.19-QC6-report.md` (full — 226; canary): the findings, with file:line references, probes and fix sketches. Its probe scripts are in `C:\Users\jbmcg\.claude\jobs\51110d9e\tmp\qc6-probe\` (read them if they help; copy, never edit them).
3. `evryn-team-workspace/shared/projects/product/2026/2026.11.18-guards-build/crew/2026.11.18-DCG-6-report.md` (full — 246; canary): the builder's report. **§2 holds its mutation method.** The builder's harness is `C:\Users\jbmcg\AppData\Local\Temp\dcg6\mutate.mjs`, and QC6's extended copy is `qc6-probe/mutate.mjs`.

**What AC-006R has read and checked, so you weigh this correctly:**
- It has read every file on your load list whole, and QC6's report whole.
- It has not run QC6's probes itself.
- **The decisions below rest on QC6's evidence plus its own reading of the code** (for example, `006_authorization_record.sql:508` looks up only `a.kind` for the row the setting names).
- **Treat every claim here as a LEAD.** Where the code says otherwise, follow the code and say so first.
- 🔴 **If a fix as specified would be wrong, break something, or conflict with the spec, STOP and say so before building.** Surfacing it costs one message; quietly doing something else, or quietly building a lesser fix, costs a false record.

## The fixes (each MUST ship a test that fails without it, and a control proving that test can fail)

1. **NB1, C4: the authorization row must belong to the task.**
   - **Where the setting is honoured:** in `tasks_before_write` (`:504-512`, and its uses at `:559-560`, `:596` and `:621`), a write counts as "from the authorization trigger" only if the `task_authorizations` row the setting names **has `task_id = new.id`**.
   - **On a move into active work:** additionally, the row's `scope_hash` must equal `new.scope_hash`.
   - **Tests:** with the setting set to `rowA:C` (as the owner, or with `set local` as `service_role`), task C must be refused. Two more shapes from QC6's probes must also be refused: a task reopened on its own stale row after a scope edit, and `ac` closing a task with another task's acceptance row. **Each test needs a control.**
   - **Keep test 17 passing.**
2. **NB2: behavioural tests for eight guards that only a body-hash pin protects today.** QC6 proved that removing any one of these leaves every behavioural test green:
   - `:285-286`: a backfill row that is not an authorization;
   - `:297-301`: authorizing a closed task. **This one is reachable today:** an authorization row for a `done` task, written as `lucas`, must be refused;
   - `:308-310`: an acceptance with no authorization;
   - `:312-314`: an acceptance whose scope doesn't match;
   - `:338`: the NULL-session exemption covers backfill rows only;
   - `:580`, departure 6: the return to `proposed` applies only to active tasks. A `lucas` title edit on a `done` task must stay `done`;
   - `:605-607`: an active → active move with a NULL pointer;
   - `:609-611`: an active → active move whose row's scope doesn't match.
   
   **One raw-request test per guard.** Seed the states clients normally can't reach as the owner with triggers disabled, then make the client request. **Each test needs a control, and line numbers will move with fix 1:** re-find each guard by its code.
3. **NB3: one acceptance test that runs the real pastes as a non-superuser owner, the way Supabase runs them.**
   - Build a throwaway cluster bootstrapped with `initdb -U supabase_admin`. Make `postgres` a non-superuser owner (`createrole createdb bypassrls`, a member of the three client roles), as QC6's `probe2.mjs` does.
   - Run the committed 001-004, 005 and 006 apply pastes as `postgres`, and assert the 006 dry run's message and the golden after-006 snapshot.
   - **Do NOT change `cluster.mjs`'s default bootstrap for the other suites.** Add a helper beside it.
4. **NB4: C5's role check must fail closed.**
   - Replace the deny-list `current_user not in ('service_role','authenticator','anon','authenticated')`, at both sites (`task_authorizations_before_insert` and `tasks_before_write`), with an allow-list: **the exemption applies only when `current_user` is the owner of `public.tasks`** (for example, `current_user = (select pg_catalog.pg_get_userbyid(c.relowner) from pg_catalog.pg_class c where c.oid = 'public.tasks'::regclass)`).
   - **Test:** a role that is NOT on the old list, carrying `evryn.migration = '006'`, gets no exemption; the owner still does (test 18's positive control). Plus a control.
5. **COSMETIC 5: on authorized work, refuse a single write that changes BOTH scope and status**, unless the new status is `proposed`.
   - Today the forced return silently overrides the writer's status, leaving `proposed` with `closed_at` set.
   - Use a clear message (ET011, or a new code if you judge one clearer; say which and why).
   - Test it, with a control.
6. **COSMETIC 6: the trigger clears `needs_reauthorization` on any move to `decided_against` or `done`.** Test it, with a control. Keep ET014 refusing a client's own change to the flag.
7. **Departure 1's caveat: re-prove 005's note semantics on the 001–006 shape** in `migration-006.test.mjs`: a note-only write gives a comment row (empty `changed_fields`, the note), and a stale-note no-op writes nothing.
8. **README:** one line saying that `import-linear.mjs --apply` is retired by 006, because every row it writes is refused (ET011).

**Not to change:** data step 2 clearing `tasks.note` (by design), and anything outside `scripts/tasks/`.

**Every fix changes function bodies, so regenerate and re-pin, and review each diff:**
- the after-assertion `body_md5` pins in `paste-src/006/after.plpgsql`;
- `test/fixtures/local-snapshot-after-006.txt` (`EVRYN_TASKS_UPDATE_SNAPSHOTS=1`; `local-snapshot-after-004.txt` and `local-snapshot-after.txt` must come back UNCHANGED);
- the 006 pastes (`node scripts/tasks/make-paste.mjs`);
- the hash `migration-006.test.mjs` breaks (`AFTER_BREAK_FROM`).

**The 001-004 and 005 pastes must stay byte-identical** (their sha256 pins).

## Where, and how

- **Work in the worktree `C:\Users\jbmcg\Evryn\Code\_evryn-meta-guards-006`, on branch `soren/migration-006`.**
  - Commit there by path, with the pathspec on the commit.
  - **Do not push.** Never touch `main` or any main folder.
  - Never `checkout`, `stash`, `merge`, `reset` or `rebase` anywhere but your own sandbox.
  - Never `EnterWorktree`.
- **Mutations run ONLY in a detached sandbox outside the code folder,** never in the worktree. Make one yourself at your commit: `git -C <worktree> worktree add --detach C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/dc6f-sandbox <sha>`. Reap it when done (`git worktree remove`). Use the builder's method:
  - prove the edit occurs exactly once;
  - run `node --check` on any `.mjs` you mutate;
  - for SQL, check the migration still applies, so a red comes from the mutation and not a syntax error;
  - restore the bytes and verify the restore;
  - run a clean baseline in the same run.
  - Set `EVRYN_TASKS_RUNTIME_003=C:/Users/jbmcg/Evryn/Code/evryn-team-runtime/migrations/003_tasks_proposals.sql` in the sandbox.
- **Run before you hand back:** unit; acceptance with Supabase's defaults off; acceptance with `EVRYN_TASKS_DEFAULTS=on`; and `node scripts/tasks/make-paste.mjs --check`. Report counts before and after.
- **Never connect to the live Evryn Team database or any Supabase project, by any route.** Never read a secret value (no `.env`).
- 🔴 **Do NOT delete or edit `.claude/settings.local.json`, or any settings file, in any repo**, even though your manual's SESSION STARTUP says to. This lane's limits forbid changing settings files. If you find one, note it in your report and leave it alone. The canonical-branch check is fine (read-only).
- **Use `C:/Users/...` paths with `git -C`.** `/c/Users/...` failed with exit 128 on your load trip and on QC6's.
- If a tool call is refused, note it and carry on; never route around it.
- **Stop by 4:45 PM PT** whatever state you're in. Commit what passes, and say plainly what doesn't.

**Finish the whole task, not just the tractable part.** If you genuinely cannot finish something, do the rest and say plainly what is missing and why.

## Output

- **Your full report goes to** `C:\Users\jbmcg\.claude\jobs\51110d9e\tmp\DC6F-report.md` (AC-006R's scratch).
  - Use the `Write` tool, and give the file a truncation canary.
  - **Write NOTHING in `evryn-team-workspace`, and nothing in any repo except your branch's code** (the Admiral's ruling).
  - **If that write is refused, put the full report in your output instead.**
  - It opens with your work-trip receipts.
  - Then each fix with its commit.
  - Then the test and control that prove it (what you broke, and how many tests went red).
  - Then the suite counts before and after, with the commands.
  - Then the NEW `-- migrations sha256:` header line both 006 pastes carry, and the final branch head.
  - Then anything you did differently from this brief, and why.
- **Your returned output is at most 25 lines.**
- **Cap your headings at `##`.** Never write `'s read` in any form.
</task>

<questions_first>
Do the work — or, if a real gap would compromise it, output a numbered list of blocking questions INSTEAD and stop. Don't guess past a real gap — but also don't manufacture questions to dodge the work.
</questions_first>

<output_format>
Wrap your entire final response in a heading pair, so your spinner can see at a glance where your output begins and ends inside a wall of tool output.

Open with:  ## [your designated name]'s Output
Close with: ## End of [your designated name]'s Output

Use your own designated name — the one given to you in <identity>. Put nothing after the closing line.
</output_format>

<isolation>
You work in a dedicated worktree on your own branch; you never touch `main`; you never deploy (`railway up`).
</isolation>
