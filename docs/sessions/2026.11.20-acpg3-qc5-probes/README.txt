QC5's probes, copied read-only into the worktree by AC-PG3 on Fri 2026-11-20 ~13:1x PT (the Captain's question 10 (a) ruling), because QC5's scratch (C:/Users/jbmcg/.claude/jobs/e8af53fa/tmp/qc5/) dies with AC-PG3's job.

- p1.mjs: QC5's Q4-1 probes (A, B, C, D, H1-H10b). Usage: node p1.mjs <root holding scripts/packout> [probe-id...]
- p2.mjs: QC5's Q4-2 (E1-E9), Q4-6 (p7, p7b, GHOST, DUP) and Q5-3 (X1, X2) probes. Same usage.
- probes-1-new.txt / probes-2-new.txt: their output on fix trip 4's code (1fca1c1). probes-*-old.txt: on the code before it.
- probes-1-fixtrial.txt: p1's output on QC5's trial of the C7 patch (a scratch copy, never the lane's tree).
- qc5-c7-patch-trial.diff: that trial patch, as a diff of scripts/packout/lib/checks.mjs (worktree at 1fca1c1 vs QC5's scratch copy). A lead for fix trip 5, not a commit.

Expected after fix trip 5 (QC5's report, section 4): H8 -> C7 PASS; H9 -> C7 FAIL; X2 -> C10 FAIL; every other probe unchanged from probes-*-new.txt.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
