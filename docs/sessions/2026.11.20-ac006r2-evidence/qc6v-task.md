<!-- copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v-task.md; original sha256 4dc27314dc8e790a4ecb3c7f3b3aba843f273faa4b503cf1c5b19e9df0f169ed; copied 2026-11-20 by AC-006R2 -->
<task>
Your load is complete and verified. It was assembled before you knew what you would be doing — so now that you know, **if the work genuinely needs something you do not have, LOAD IT.** You are not confined to the original list, and you should not work around a gap you could close by reading. Use your judgment freely here; it is useful now in a way it could not have been before.

Two conditions, both of which matter:

1. **Load IN ADDITION to what you already have, never INSTEAD of it.** Nothing on the original list becomes optional now that you can see the task. If something on it looks irrelevant in hindsight, you are wrong about that, or it was cheap — either way it stays loaded.
2. **Name anything you loaded beyond the list in your receipts, with one line on why you needed it.** Do this even if the extra read turned out to be unnecessary. **Your spinner built that list without knowing what you would discover, and this report is the ONLY signal they get that it had a gap** — so it is not bookkeeping; it is the mechanism by which the next brief is better than this one.

**You are QC6V.** Your spinner is AC-006R, an Architect Claude running the migration-006 review in the guards-build lane.

## What you are verifying, and why it matters

**Migration 006 of the team task database** (`_evryn-meta/scripts/tasks/`) puts Justin's rule into the database: no agent authorizes its own work, and authorization is its own append-only record (`task_authorizations`). **It can be applied only once, by Justin pasting it into Supabase's SQL editor as the database owner (ADR-061)**, so a defect that ships costs a second paste. It is a guard that runs unattended. **This is a Depth-3 sign-off:** fresh eyes, plus proof that every check can fail.

**The history, in order:**
- `DCG-6b` built it (branch `soren/migration-006`, through `1f37fae`).
- A fresh QC, QC6, reviewed `1f37fae` and returned **GO with no blockers**, but with four non-blocker and four cosmetic findings.
- AC-006R decided to fix seven of them before the paste.
- A DC, DC6F, built those fixes in **one commit, `16fb675`**.
- **You verify that fix trip,** and you are the fresh eyes on the whole branch at its new head.

**Read first, whole:**
1. `evryn-team-workspace/shared/projects/helm/2026/2026.11.13-autonomy-guards-soren/builds/5-migration-006-v2.md` (full — 200; canary): the spec of record, with conditions C3–C5.
2. `evryn-team-workspace/shared/projects/product/2026/2026.11.18-guards-build/crew/2026.11.19-QC6-report.md` (full — 226; canary): QC6's findings and probes. Its probe scripts are in `C:\Users\jbmcg\.claude\jobs\51110d9e\tmp\qc6-probe\`. Copy them, never edit them.
3. **Only AFTER your own pass over `git diff 1f37fae 16fb675`:** DC6F's report, `C:\Users\jbmcg\.claude\jobs\51110d9e\tmp\DC6F-report.md` (full — 156; canary). Its harness is in `C:\Users\jbmcg\.claude\jobs\51110d9e\tmp\dc6f\`. **Why this order:** you get the artifact before the worker's account of it. Then treat the report's departures as the worker's defence, and rule on each one.
4. `evryn-team-workspace/shared/projects/product/2026/2026.11.18-guards-build/crew/2026.11.18-DCG-6-report.md` (full — 246; canary). **Its §2 is the builder's mutation method and its 39 controls.** The builder's harness is `C:\Users\jbmcg\AppData\Local\Temp\dcg6\mutate.mjs`.

**AC-006R's own decisions on QC6's findings** (what DC6F was told to build):
- **NB1, C4 binds the row:** the authorization row named by `evryn.authorizing` must belong to the task and match its scope.
- **NB2:** behavioural tests for eight guards that only a body-hash pin protected.
- **NB3:** a test running the real pastes as a non-superuser `postgres` owner, without changing `cluster.mjs`'s default bootstrap.
- **NB4:** C5's role check becomes an allow-list: the owner of `public.tasks`.
- **Cosmetic 5:** refuse a single write that changes both scope and status on authorized work, unless the new status is `proposed`.
- **Cosmetic 6:** a move to `done` or `decided_against` clears `needs_reauthorization`.
- **Departure 1:** re-prove 005's note semantics on the 001–006 shape.
- **README:** say that `import-linear --apply` is retired.
- **Deliberately NOT changed:** cosmetic 7 (data step 2 clears `tasks.note`, by design), and the T-97 note on departure 4.

**What your spinner has read, so you weigh this correctly:** AC-006R has read every file on your load list, QC6's and DC6F's reports, and the full code diff `1f37fae..16fb675` (migration, README, after-assertions). It agreed with DC6F's departures by reading, not by running. **Treat every claim here, in DC6F's report and in QC6's report as a LEAD.** Where the code says otherwise, follow the code and say so loudly and early. **Where this brief is silent, assume your spinner could not see it.** 🔴 **If anything here is wrong or internally inconsistent, say so before building on it.**

## What you MUST do, at minimum

1. **Verify each fix against QC6's finding,** by re-running QC6's own attacks (`probe.mjs` A1–A3, B4–B5, D1–D2) against `16fb675`. A fix is verified when the attack that succeeded at `1f37fae` is now refused, for the right reason.
2. **Re-run every suite yourself**, in your sandbox `C:\Users\jbmcg\.claude\jobs\51110d9e\tmp\qc6v-sandbox` (detached at `16fb675`, outside the code folder; check that its `CODE_ROOT` resolves to a folder with no `.env` before running anything with the tripwire off).
   - **Suites:** unit; acceptance with Supabase's defaults off; acceptance with `EVRYN_TASKS_DEFAULTS=on`. Set `EVRYN_TASKS_RUNTIME_003=C:/Users/jbmcg/Evryn/Code/evryn-team-runtime/migrations/003_tasks_proposals.sql`.
   - **Then run:** `node scripts/tasks/make-paste.mjs --check`.
   - **Confirm both 006 pastes carry exactly:** `-- migrations sha256: aeca893ddd03e1160eb42780d27af515a9106a41833fd6565435064e735b6ca0  (006_authorization_record.sql; LF-normalized)`.
3. **Re-run ALL of the builder's 39 controls (DCG-6 report §2) AND all of DC6F's new controls** against `16fb675`, with a clean baseline in the same run. Prove each mutation applied, and say whether each went red for the mutation's reason and not a syntax error.
   - **DC6F did not re-run the builder's 39 after its change.** It reports that the builder's test-17 control (drop the setting's task half) now stays green by design, because NB1's row binding makes that check redundant. **Confirm or refute that,** and say whether test 17 still guards C4 adequately.
   - **Mutate only your sandbox. Never touch the `_evryn-meta-guards-006` worktree** or any main folder.
4. **Rule yes or no, with a reason, on each of DC6F's departures from its brief** (its report, "What I did differently"):
   - the scope check on every use of the setting;
   - the hints on the two active→active refusals;
   - the new code ET016;
   - one commit instead of one per fix;
   - NB3 as a new suite plus a helper.
5. **Hunt for what the fixes broke.** A new refusal that refuses a legitimate path:
   - the authorization trigger's own update;
   - an acceptance;
   - the data steps (re-run them through the REAL 006 paste on a seeded post-005 copy, LF and CRLF, the way QC6 did);
   - an owner withdrawing;
   - lucas reopening a closed task;
   - a note-only write on authorized work;
   - the launcher's note-only write as `launcher` with no session.
   
   Also check:
   - **NB4:** confirm the exemption still works for the paste as the non-superuser owner `postgres` (as on Supabase), and that it is refused to every client role.
   - **The ordering inside `tasks_before_write`:** for example, ET016 against the forced return, and the C6 clearing against ET014.
6. **Review the whole branch at `16fb675` against the spec and C3–C5 with fresh eyes,** not only the fix diff (`git -C C:/Users/jbmcg/Evryn/Code/_evryn-meta-guards-006 diff main...16fb675`; use three dots).
7. **Say plainly that the real live rows were not available.** Nobody in this lane may connect to the live database.

## Limits, binding

- **Never connect to the live Evryn Team database or any Supabase project, by any route.** Never run either paste anywhere but a throwaway loopback cluster. **Never read a secret value** (no `.env`, no `backups/full-public*`).
- **Write nothing in any repo, and commit nothing.** Write nothing in `evryn-team-workspace`, including `crew/` (the Admiral's ruling).
  - Your single exception is your report, at `C:\Users\jbmcg\.claude\jobs\51110d9e\tmp\QC6V-report.md`, written with the `Write` tool.
  - Your sandbox, the throwaway clusters and your own scratch are yours.
  - If the report write is refused, put the full report in your output instead.
- **Never `git checkout`, `stash`, `merge`, `reset` or `rebase` outside your sandbox.** Never push, never deploy. **Never delete or edit any settings file.**
- **Use `C:/Users/...` paths with `git -C`** (`/c/...` fails here with exit 128).
- If a tool call is refused, note it and carry on; never route around it.
- **Stop by 4:45 PM PT** whatever state you're in. Write what you have and say plainly what is missing.

**Finish the whole task, not just the tractable part.** If you genuinely cannot finish something, do the rest and say plainly what is missing and why.

## Output

- **The full report goes to** `C:\Users\jbmcg\.claude\jobs\51110d9e\tmp\QC6V-report.md`.
  - It opens with your work-trip receipts.
  - Then GO or NO-GO.
  - Then each QC6 finding marked VERIFIED, NOT VERIFIED or REGRESSED, with what you ran.
  - Then new findings ranked by severity (BLOCKER / NON-BLOCKER / COSMETIC, plus SUSPECTED). Each gives `file:line`, what the code does, what the spec expects, a fix sketch, and **what you RAN**.
  - Then your rulings on DC6F's departures.
  - Then the control results (all 39 plus DC6F's).
  - Then a section headed "What I could not establish".
  - Label anything cleared by reading alone **"reasoned, not executed"**.
  - Follow `ac-writing-protocol.md`, and give the file a truncation canary.
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
