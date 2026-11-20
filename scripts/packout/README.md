# packout.mjs — the packout guard, step 1 (v1)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.
>
> **How to use this file:** read it before you run `packout.mjs`, as an outgoing seat or as its successor. It says what the script does, what you must write so it can judge you, what it proves, and what it does not. **History and rulings are not here:** see the build brief (`evryn-team-workspace/shared/projects/product/2026/2026.11.19-packout-guard-build/2026.11.19-packout-guard-build-brief.md`, §3 and its Log) and this lane's brief (`_evryn-meta/docs/sessions/2026.11.19-sorenpg-acpg-packout-guard-step1-brief.md`).

## What it proves, and what it does not

🔴 **v1 detects HONEST skips. It does NOT resist a seat that sets out to forge.**
- **What it catches:** a seat that genuinely believes it ran a packout step it did not. That was every failure in the 11/19 audit: six of six seats recorded steps that had not run, and none of them forged anything. `check` judges the steps from the session's own transcript and files, never from what the seat says it did.
- **What it cannot stop:** a seat that sets out to cheat. Its evidence lives where that seat can write: the transcript itself is a writable file (N11), and so are the state folder and the report.
- **What will:** forgery resistance comes from the hooks and the vault (build steps 3–4), which keep the evidence where a seat cannot reach it.

## Usage: four subcommands, in this order

```
node _evryn-meta/scripts/packout/packout.mjs begin  --agent <name> --handoff <path> --incoming <path>|none
node _evryn-meta/scripts/packout/packout.mjs sweep  --handoff <path>
node _evryn-meta/scripts/packout/packout.mjs check  --handoff <path>
node _evryn-meta/scripts/packout/packout.mjs verify --report <path> --predecessor <session> --handoff <path>
```

1. **`begin`** runs once, **as the very first act of the packout**: writes made before it don't count, so a late `begin` FAILs steps that did run. `--incoming` is required: the incoming handoff's path, or `none` when this packout genuinely has no incoming handoff (an omitted `--incoming` is refused, because it would silently switch off C7 and C10's incoming half). It prints the successor's footer line; put that line in the successor's start line. **A second `begin` cannot change `--agent` or `--incoming`:** to correct either, start a fresh packout with a new handoff path.
2. **`sweep`** runs once for the lock's fragment sweep, and again after the handoff's first write. Read each extract it names with the Read tool, down to its end marker.
3. **`check`** runs at the final gate, and again until it passes. It writes `<handoff-stem>.packout-report.md` beside the handoff. That report is the packout record; the seat writes no step claims of its own.
4. **`verify`** is the successor's first act, using the three values from its footer. It finds the predecessor's transcript itself and re-derives every verdict.

**Exit codes:**
- `check`: 0 = all PASS · 1 = any FAIL (or a refusal it names) · 2 = it could not run: a usage error, "no packout state: run begin first", or "no transcript found". The message says which.
- `verify`: 0 = PASS · 1 = FAIL · 2 = usage · **3 = DOWNGRADED, which is NOT a pass.** Exit 3 means the predecessor's transcript is on another machine, so only the report's hashes could be checked. Say so in your Report #0.

**Two rules a seat must know:**
- **Never filter `packout.mjs` output** through `head`, `grep` or anything else. The footer and the `report:` line must reach the transcript whole; that is how `check` and `verify` find them.
- **Run the plain form:** `node …packout.mjs <subcommand>`. A leading `cd … &&` is fine. A `time` or `env` wrapper does NOT anchor (Q4-4), so the step reads as not run.

## The checks (as built)

| | PASS when |
|---|---|
| C1 | the agent's own `MEMORY.md` is written after `begin` (AC: a `PACKOUT-NONE C1:` line, interim) |
| C2 | current-state, the topsheet (when one exists) and a task note are written after `begin`, or a `PACKOUT-NONE C2:` line is in the handoff |
| C3 | a `sweep` extract made after `begin` is Read to its end marker |
| C4 | the handoff is written after `begin` |
| C5 | a different `sweep` extract, made after the handoff's first write, is Read to its marker |
| C6 | every `Agent` call and `claude --bg` launch in the session is named in the handoff by id or name |
| C7 | the incoming handoff is Read whole after `begin`: one version of it, every line, by Reads reporting the same length. The report says "to its canary", or "(the file carries no canary)" when the last line read is not one. **It is judged on that read alone**, so packout step 6 may then banner, supersede or archive the file (C10 reads the incoming's list from the same read) |
| C8 | the last whole Read of the handoff equals the handoff as it stands now, exactly |
| C9 | `<handoff-stem>.fresh-eyes.md` was written by another session after the handoff's first write, and Read whole by this seat; that last whole Read equals the findings file now |
| C10 | every file this session wrote is clean, committed after its last write, or listed under `## Uncommitted` (the handoff itself and its packout report count as listed; the start line and work trip do not); and every path in the incoming's list (taken from the seat's whole Read of the incoming) is committed or carried forward. A listed path whose first segment names a repo (`evryn-team-workspace/shared/x.md`) resolves under the code root; any other relative path, against the handoff's repo. A listed path that resolves to no repo FAILs loud, and so does a list that can be read neither from a whole Read nor from the file |
| C11 | there is no compaction in the transcript. If there is one, the seat must stop, and any write after it is UNVERIFIED |
| C12 | the near-zero decisions table (under either of its names) is written after `begin`, or a `PACKOUT-NONE C12: nothing by hand — <reason>` line is in the handoff |

`verify` re-judges all twelve up to `check`'s own row, except C10 and C11, which it judges over the whole transcript.

## What a seat writes so the script can read it

- **`## Uncommitted`**: a section with exactly this heading, one backticked repo-relative path per line. It ends at the next `#` or `##` heading.
- **`PACKOUT-NONE` lines**, each at the start of a line in the handoff: `PACKOUT-NONE C1: <reason>` (AC only, interim), `PACKOUT-NONE C2: <reason>`, and `PACKOUT-NONE C12: nothing by hand — <reason>` (with an em dash). They prove presence only, and the report says so.
- **Extract marker** (written by `sweep`): `END OF SESSION TEXT · <N> lines · sha256 <12>`.
- **Footer** (printed by `begin`): `PREDECESSOR: <session> · HANDOFF: <path> · REPORT: <path>`.
- **Findings:** `<handoff-stem>.fresh-eyes.md`, beside the handoff. **Never edit the fresh reader's findings file, not even to mark items folded:** C9 FAILs on any write to it by this session, and nothing can repair that afterwards. Record folds in the handoff.
- **Report:** `<handoff-stem>.packout-report.md`, beside the handoff.
- **A task note** is a `tasks.mjs update` or `close` call with `--note`.

## Named residuals in v1 (each with why it stays)

- **N11: the transcript is writable.** A seat can hand-edit its own evidence. Closing this needs the vault.
- **Q3-1 part (a): an edited state folder.** A seat that rewrites its own sweep extract and `state.json` can buy C5 PASS. This is deliberate tampering, and it is closed by the hooks and vault, not by v1.
- **Q4-3: C10 judges a commit's TIME, not its content.** Two sequences leave the write uncommitted while C10 still PASSes: a stale staged copy committed after the write without a pathspec, or a later `--amend` of an older commit touching the file. QC4 measured the seat's own sequence at **0 of 826 commits over 7 days.** **The cross-seat route is unmeasured:** another seat's index holding our file across our write, then a whole-index commit (685 of 748 team commits take the whole index). A content check was declined because it risks the honest false-FAIL class that fix trip 3b closed.
- **`verify` finds `check`'s own row by text match only.** An `echo` that prints a `report:` line could bind it. That takes deliberate tampering.
- **Git commit times can be forged** (`GIT_COMMITTER_DATE`), which C10 trusts. That also takes deliberate tampering.

## Deferred (and to where)

- **F11** (PowerShell writes are invisible to the checks): step 4's design.
- **The session chain** (`check` reads only the newest transcript of a resumed session): step 4's design.
- **C9 writer identity** (judged by mtime only): step 4's design.
- **Q3-7** (do resumed or forked transcripts carry compaction marks?): to measure before step 3's blocking mode.
- **N15 (d)** (Edit-versus-Bash path asymmetry): step 4's design.
- **C10 historical** (OPEN for all six frozen seats; their lists are not transcribed): the first real packout that trips it.
- **SG-1** (C5 anchors on the handoff's FIRST write, so later writes go unswept): step 6's text, or v1.1.
- **SG-3 / GC-3** (edits after `check` that the handoff never learns of): step 6's text ("after `check` passes, change nothing your successor relies on; if you must, re-run `check`"), or v1.1.
- **GC-1** (C1 passes a whole-file rewrite that drops another session's memory note): the v1.1 queue, first.
- **GC-2** (C8 covers only the handoff, not the successor's other files): the v1.1 queue.
- **Q4-4** (`time`/`env` wrappers don't anchor): step 6's text gives the exact form.
- **Q4-5** (a successor start line written after `check` and left uncommitted FAILs `verify`): step 6's text, so write it before `check` or commit it; joins SG-3.
- **Q4-7** (in a subagent, the session id is the parent's): fails loud; seats are top-level today.
- **Q5-4** (a whole Read with no reported length, then the incoming archived, FAILs C7 loud; 8 of 5,085 top-level Reads in 7 days lacked a length): v1.1.
- **Q5-5** (C12 accepts an exact-name copy of the near-zero table elsewhere under `shared/`): v1.1.
- **The same-version case** (an edit that keeps the incoming's line count, made between two partial Reads, can still be stitched into one "whole" read): v1.1.
- **The orphan path's verdict** (a repaired packout can't reach VERIFY PASS): step 4's quarantine.
- **C6's name-substring match** (a launch named `X` passes when the handoff names only `X 2`; 60 of 61 real launches print no id, so names decide): v1.1, a whole-name match on a word boundary.
- **A second `begin` that corrects its own `--agent` or `--incoming`** (from the same session, before any sweep, both rows recorded in the report): v1.1. Until then the refusal names the repair: a fresh packout with a new handoff path.

## Tests

- `node --test "scripts/packout/test/*.test.mjs"` is the machine-independent suite.
- `scripts/packout/test/mutations.mjs <detached-sandbox>` reverts each fix and requires its test to go red; `--count` re-counts every row's target, read-only.
- `scripts/packout/test/historical.mjs` replays the six frozen 11/19 packouts against the ledger (needs this laptop's transcripts).

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
