<!-- copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6-task.md; original sha256 176e58cf5111af86b975b8c434153e9897aac4661d9a791dc50cecdf85a0caec; copied 2026-11-20 by AC-006R2 -->
<task>
Your load is complete and verified. It was assembled before you knew what you would be doing — so now that you know, **if the work genuinely needs something you do not have, LOAD IT.** You are not confined to the original list, and you should not work around a gap you could close by reading. Use your judgment freely here; it is useful now in a way it could not have been before.

Two conditions, both of which matter:

1. **Load IN ADDITION to what you already have, never INSTEAD of it.** Nothing on the original list becomes optional now that you can see the task. If something on it looks irrelevant in hindsight, you are wrong about that, or it was cheap — either way it stays loaded.
2. **Name anything you loaded beyond the list in your receipts, with one line on why you needed it.** Do this even if the extra read turned out to be unnecessary. **Your spinner built that list without knowing what you would discover, and this report is the ONLY signal they get that it had a gap** — so it is not bookkeeping; it is the mechanism by which the next brief is better than this one.

**You are QC6.** Your spinner is AC-006R, an Architect Claude running the migration-006 review in the guards-build lane.

## What you are reviewing, and why it matters

**Migration 006 of the team task database** (`_evryn-meta/scripts/tasks/`, the Evryn Team Supabase project) puts Justin's rule into the database: **no agent authorizes its own work, and authorization is its own record.**
- Every task is created `backlog` or `proposed`.
- Only an append-only `task_authorizations` row, written as `lucas` or `justin`, moves a task to `open`.
- A later edit to a task's title, description or owner returns it to `proposed` for a fresh yes.
- Acceptance (to `done`) is a second row of the same table.

**It is built, on branch `soren/migration-006` at `1f37fae`** (worktree `C:\Users\jbmcg\Evryn\Code\_evryn-meta-guards-006`; four commits on base `37a1b26`), **by a Developer Claude, `DCG-6b`, and nobody has reviewed it.**

It is a guard that will run unattended, on the database every agent writes to. **It can be applied only once, by Justin pasting it into Supabase's SQL editor as the database owner (ADR-061).** A wrong version looks exactly like a right one from outside: a trigger that refuses the wrong thing, an exemption a client can reach, a backfill that authorizes work nobody authorized. **This is a Depth-3 sign-off:** fresh eyes, plus proof that every check can fail.

## Read these first (trip-2 reading, held back from your load because each carries the task)

1. `evryn-team-workspace/shared/projects/helm/2026/2026.11.13-autonomy-guards-soren/builds/5-migration-006-v2.md` (full — 200 lines; confirm the canary). **This is the spec of record.** Admiral Soren re-signed it with conditions C3, C4 and C5 (see its header, §2.1 (d) and (e), and §2.2).
2. **Only AFTER your own independent pass over the diff against the spec:** `evryn-team-workspace/shared/projects/product/2026/2026.11.18-guards-build/crew/2026.11.18-DCG-6-report.md` (full — 246; canary).
   - **Why the order matters:** a reviewer gets the artifact and its sources, not the worker's conclusion. Read the code against the spec first.
   - Then treat the report's §3 as the builder's defence of each departure, and rule on each one.
   - ⚠️ A fact to correct in that report: it gives `meta.test.mjs` as 87 lines; it is 89.
3. `evryn-team-workspace/shared/projects/product/2026/2026.11.18-guards-build/crew/2026.11.18-DCG-L-report.md` (full — 228; canary). **Its §5 lists every name the task launcher depends on.**

## What your spinner has read, so you weigh this brief correctly

AC-006R has read **every file on your load list, whole**, plus the spec and the builder's report. It has **not** probed any of the code by running it. **Treat every claim in this brief, the spec and the builder's report as a LEAD, not a fact**, line numbers included. Where the code says otherwise, follow the code and say so loudly and early. **Where this brief is silent, do not read that as "checked and clear"; assume your spinner could not see it.**

🔴 **If anything here is wrong, internally inconsistent, or something you cannot verify, say so before building on it.** A contradiction you surface costs one line. A contradiction you resolve quietly costs a false record that nobody knows is false.

## What you MUST do, at minimum

1. **Review the whole diff against the spec and C3–C5** (`git -C C:/Users/jbmcg/Evryn/Code/_evryn-meta-guards-006 diff main...1f37fae`; use three dots, never two). Probe the real code, not its description.
2. **Re-run every suite yourself, and all 39 of the builder's controls, in your sandbox.**
   - **Sandbox:** a detached worktree at `1f37fae` outside the code folder, already provisioned: `C:\Users\jbmcg\.claude\jobs\51110d9e\tmp\qc6-sandbox`.
     - Its `lib/config.mjs` resolves `CODE_ROOT` to a folder with no `.env`, so a test run there cannot reach credentials. Check that yourself before running anything with the tripwire off.
     - Set `EVRYN_TASKS_RUNTIME_003=C:/Users/jbmcg/Evryn/Code/evryn-team-runtime/migrations/003_tasks_proposals.sql` for the acceptance suites.
   - **Suite commands** (the builder's report, §2): unit `node --test --test-reporter=tap "scripts/tasks/test/unit/*.test.mjs"`; acceptance `node --test --test-reporter=tap "scripts/tasks/test/acceptance/*.test.mjs"`, once as is and once with `EVRYN_TASKS_DEFAULTS=on`.
   - **Run a clean baseline in the same run as your mutations**, and prove each mutation applied before you believe its verdict.
   - For each control, say whether it went red **for the mutation's reason and not a syntax error.**
   - **Mutate only the sandbox. Never touch the `_evryn-meta-guards-006` worktree** or any main folder.
3. **Give a yes or no, with its reason, on:**
   - each of the builder's departures from the spec (`DCG-6-report.md` §3 items 1–13);
   - its recommendation §6 item 1: merge the new CLI only in the same sitting as Justin's paste;
   - the 005 pin (report §5). The 005 paste is pinned to the committed bytes `ed9d5f9`, which nobody in this lane can confirm are the bytes Justin ran.
4. **Probe whether any PostgREST client can set `evryn.migration` or `evryn.authorizing`**, and whether C5's role check holds even if one can. Try it; don't argue it.
5. **Probe the trigger-depth claim** (spec §2.1 (e)): a history row exists for the status move, written by the authorizing actor.
6. **Run the data steps on the most realistic copy of the post-005 shape the local cluster can hold**: the post-005 golden, plus seeded rows of every kind the spec names (including the edge cases you can think of).
   - **Say plainly that the real live rows were not available:** nobody in this lane may connect to the live database.
7. **Probe C4's binding (test 17) and C5's named exemption (tests 13 and 18) by trying to defeat them**, not only by reading the tests.
8. **Check the paste path as it will actually run.** Justin pastes in Supabase's SQL editor, as the database owner, with `search_path = ''`.
   - Are the paste tests faithful to that, in both psql modes and with CRLF?
   - **This lane's standing rule** (it comes from the installer review, where every test passed and the installed code didn't run at all): **every guard ships at least one test that runs the way it runs installed.** For 006, that is the real paste text against the post-005 shape. Say whether such a test exists and whether it is enough.
9. **Confirm that `schema-snapshot.mjs --api` against a database WITHOUT 006 still runs the live (004) function.**
   - `1f37fae` changed how `schema-snapshot.mjs` picks its query: it now takes it from the newest migration that defines it.
   - The pre-paste live compare depends on this. Also: does the LOCAL snapshot of a pre-006 database still print exactly what 004's query prints?
10. **Confirm that every name the launcher depends on exists in the built 006** (`DCG-L-report.md` §5).
11. **Look for what nobody named.** Silent failures, a refusal that refuses the wrong thing, a NULL inside an `if not (...)` that skips a refusal, a sibling path that lacks a guard its twin has, a test that cannot fail.

## Limits, binding

- **Never connect to the live Evryn Team database or any Supabase project, by any route.** Never run either paste anywhere but a throwaway loopback cluster. **Never read a secret value** (no `.env`, no `backups/full-public*`).
- **Write nothing in any repo, and commit nothing.** Your single exception is your report file (below), written with the `Write` tool.
  - The local throwaway clusters the tests make, your sandbox, and your own scratch space are yours.
  - **If a write is refused, put your full report in your output instead, say so, and carry on.**
- **Never `git checkout`, `stash`, `merge`, `reset` or `rebase` in any folder but your sandbox.** Never push, never deploy.
- If a tool call is refused, note it and carry on; never route around it.
- **Stop by 4:45 PM PT** whatever state you're in. Write what you have and say plainly what is missing.

**Finish the whole task, not just the tractable part.** If you genuinely cannot finish something, do the rest and say plainly what is missing and why.

## Output

- **Your full report goes to** `C:\Users\jbmcg\Evryn\Code\evryn-team-workspace\shared\projects\product\2026\2026.11.18-guards-build\crew\2026.11.19-QC6-report.md`.
  - It opens with your work-trip receipts.
  - Then GO or NO-GO.
  - Then findings ranked by severity (BLOCKER / NON-BLOCKER / COSMETIC, plus SUSPECTED where you could not verify). Each finding gives `file:line`, what the code does, what the spec expects, a fix sketch, and **what you RAN to establish it**.
  - Then the yes/no rulings from item 3, and a section headed "What I could not establish".
  - Label anything you cleared by reading alone **"reasoned, not executed"**.
  - Follow `ac-writing-protocol.md`, and give the file a truncation canary.
- **Your returned output is at most 25 lines:** the verdict, the findings by severity in one line each, and where the report is.
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
