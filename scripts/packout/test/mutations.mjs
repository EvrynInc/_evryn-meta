#!/usr/bin/env node
// mutations.mjs — one CODE mutation per check, run in a SANDBOX copy of the repo; the suite must go red for that check's reason.
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
//   node scripts/packout/test/mutations.mjs <sandbox-worktree-root>
//   node scripts/packout/test/mutations.mjs <any-root> --count     (read-only: every row's target text must occur exactly once)
// It refuses to mutate a checkout that is on a branch. For each mutation: apply it, PROVE it applied (the old text now occurs
// 0 times and the new text is present; the changed line is printed), `node --check` the file, run the suite, and require that
// the tests named for that check are among the failures. The file is restored from its saved original after every mutation.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = process.argv[2] && path.resolve(process.argv[2]);
if (!root || !fs.existsSync(path.join(root, 'scripts', 'packout', 'packout.mjs'))) { console.error('usage: mutations.mjs <sandbox-root>'); process.exit(2); }
void fileURLToPath;

const CH = 'scripts/packout/lib/checks.mjs', TX = 'scripts/packout/lib/transcript.mjs', PO = 'scripts/packout/packout.mjs';
const M = [
  ['C1', CH, 'const w = calls.filter(after(from)).find((k) => writes(k, memoryPath));', 'const w = calls.filter(after(from)).find((k) => true);', /mutation C1:/],
  ['C2', CH, 'const ok = cs && (ts || !topsheetPath) && tn;', 'const ok = cs && (ts || !topsheetPath);', /mutation C2:/],
  ['C3', CH, 'const target = s.N + 1; // the marker line', 'const target = s.N; // the marker line', /instrument 2:/],
  // (first run: `return true ? R('C4','PASS', …hw[0].n…)` did NOT go red — the evidence expression throws on an empty list, and a
  // crashed check is reported FAIL. Fail-safe, but it proved nothing; this mutation breaks the deciding filter instead.)
  ['C4', CH, 'function handoffWrites(ctx) { return ctx.calls.filter(after(ctx.from)).filter((k) => writes(k, ctx.handoff)); }', 'function handoffWrites(ctx) { return ctx.calls.filter(after(ctx.from)).filter((k) => k.ok); }', /mutation C4:/],
  // (first run: this mutation did NOT go red — no test made a second sweep before the handoff's first write. Test C5b added.)
  ['C5', CH, 'const cand = ctx.sweeps.filter((s) => s.createdN > first && (!c3 || s !== c3));', 'const cand = ctx.sweeps.filter((s) => s.createdN >= 0 && (!c3 || s !== c3));', /mutation C5b:/],
  ['C6', CH, 'const miss = spawns.filter(', 'const miss = [].filter(', /mutation C6:/],
  ['C7', CH, "if (!reads.length) return R('C7', 'FAIL'", "if (!reads.length) return R('C7', 'PASS'", /mutation C7:/],
  ['C8', CH, 'const eq = equalsFile(lw, handoffText);', 'const eq = { equal: true };', /instrument 3:/],
  ['C9', CH, "if (!reads.length) return R('C9', 'FAIL'", "if (!reads.length) return R('C9', 'PASS'", /mutation C9:/],
  // (fix trip 3b: C10's line gained the committed-since-write term; this row's target follows it, same mutation)
  ['C10', CH, 'if (c === false && !named(p) && !committedSinceWrite(ctx, p, ts)) bad.push(', 'if (false && !named(p) && !committedSinceWrite(ctx, p, ts)) bad.push(', /mutation C10:/],
  ['C11', CH, "if (!compactions.length) return R('C11', 'PASS'", "if (true) return R('C11', 'PASS'", /mutation C11:/],
  // (fix trip 4: C12's line now looks for the table under either name; this row's target follows it, same mutation)
  ['C12', CH, 'const w = calls.filter(after(from)).find((k) => nearZeroPaths.some((p) => writes(k, p)));', 'const w = calls.filter(after(from)).find(() => true);', /mutation C12:/],
  ['dedupe', TX, "if (b.type === 'tool_use' && !byId.has(b.id)) {", "if (b.type === 'tool_use') {", /instrument 1:/],
  // ---- fix trip (QC1 findings, AC-PG's F-AC1/F-AC2): each row REVERTS one fix; its test must go red
  // (fix trip 3, Q3-4: F1-host and F1-exit3 are repointed at the tests that now catch them, renamed or re-routed in fix trip 2;
  // F1-footer's target was rewritten by N10, so it is replaced by F1-footer-handoff, QC3's revert of the footer's HANDOFF match.)
  ['F1-host', PO, 'if (meta.machine === os.hostname()) {', 'if (false) {', /a report saying it was made HERE/],
  ['F1-exit3', PO, 'process.exit(3);', 'process.exit(0);', /verify: cross-machine/],
  ['F1-footer-handoff', PO, 'if (normPath(path.resolve(winPath(a.handoff))) !== normPath(meta.handoff)) problems.push(', 'if (false) problems.push(', /F1: verify checks the successor footer/],
  ['F-AC1', PO, 'sweeps.push({ ...w, content, createdN: at.n });', 'sweeps.push({ ...w, content, createdN: w.ranAtLine });', /F-AC1:/],
  ['F-AC2', PO, 'buildCtx({ parsed, from: an.begin.n,', 'buildCtx({ parsed, from: s.beganAtRun,', /F-AC2:/],
  ['F3-empty', PO, 'if (!turns) die(', 'if (false) die(', /F3: sweep refuses/],
  ['F3-foreign', PO, 'if (w.transcript && normPath(w.transcript) !== normPath(t))', 'if (false)', /F3: an extract made from ANOTHER/],
  ['F4', CH, 'if (ctx.findingsMtime != null && hw[0].ts', 'if (false && hw[0].ts', /F4 \(minimum\)/],
  ['F5', CH, "if (k.name === 'Bash') for (const t of bashWriteTargets", "if (false) for (const t of bashWriteTargets", /F5:/],
  ['F6', CH, "return normPath(p) === qq || normPath(p).endsWith('/' + qq);", 'return normPath(p).endsWith(qq);', /F6:/],
  ['F7', CH, "/tasks\\.mjs[\"']?\\s+(update|close)\\b[^|]*\\s--note\\b/", '/tasks\\.mjs[^|]*note/', /F7:/],
  ['F8', PO, 'if (!prev.sessions.includes(session) && !a.resume) die(', 'if (false) die(', /F8:/],
  // ---- fix trip 2 (QC2's N9, N1, N10, N13, N17, N15 a/c): each row REVERTS one fix; its test must go red
  ['N9-bound', PO, 'const bound = Math.max(meta.n, checkRow.n);', 'const bound = meta.n;', /N9 \(honest, same turn/],
  ['N9-C11', PO, 'if (i11 >= 0) lines[i11] = C11({ compactions: full.compactions, calls: full.calls });', 'void i11;', /N9: a compaction AFTER check/],
  ['N9-norow', PO, 'if (!checkRow) { console.log(', 'if (false) { console.log(', /N9: a report no check call/],
  ['N1', PO, 'const t = findTranscript(a.predecessor);', 'const t = fs.existsSync(meta.transcript) ? meta.transcript : null;', /N1 \(QC2 P1b\)/],
  ['N10', PO, "if (!a.predecessor || a.predecessor === true || !a.handoff || a.handoff === true) die(", 'if (false) die(', /N10:/],
  ['N13', PO, 'if (a.agent !== prev.agent) die(', 'if (false) die(', /N13:/],
  ['N17-verify', PO, 'const repPath = path.resolve(winPath(a.report));', 'const repPath = path.resolve(a.report);', /N17:/],
  ['N17-check', PO, 'const out = a.out || path.resolve(winPath(a.handoff))', 'const out = a.out || path.resolve(a.handoff)', /N17:/],
  ['N15a', PO, 'if (!s) forVerify ? (console.log(', 'if (!s) false ? (console.log(', /N15 \(a\)/],
  ['N15c', PO, 'if (isMain) {', 'if (true) {', /N15 \(c\)/],
  ['F10', TX,'    else if (o.isCompactSummary) summaries.push({ n, ts: o.timestamp });', '    if (o.isCompactSummary) compactions.push({ n, ts: o.timestamp });', /F10:/],
  // ---- fix trip 3 (QC3's Q3 findings, scoped by the definition of done): each row REVERTS one fix; its test must go red
  ['N13-incoming', PO, "if (normPath(inc || '') !== normPath(prev.incoming || '')) die(", 'if (false) die(', /N13:/],
  ['VERIFY-FAILGUARD-same', PO, "if (Object.values(meta.verdicts || {}).includes('FAIL')) problems.push('the report itself carries a FAIL'); // Q3-3: same machine", 'void 0; // Q3-3: same machine', /Q3-3 same machine/],
  ['VERIFY-FAILGUARD-cross', PO, "if (Object.values(meta.verdicts || {}).includes('FAIL')) problems.push('the report itself carries a FAIL'); // Q3-3: downgrade branch", 'void 0; // Q3-3: downgrade branch', /Q3-3 downgrade branch/],
  ['Q3-2-ambig', PO, 'if (hits.length > 1) {', 'if (false) {', /Q3-2 DUP/],
  ['Q3-2-scan', PO, 'const found = beginsNaming(meta.handoff);', 'const found = [];', /Q3-2 GHOST/],
  ['Q3-1c', PO, "const sub = runsPackout(cmd, ['begin', 'sweep']); if (!sub) continue;", "const sub = (cmd.match(/packout\\.mjs[\"']?\\s+(begin|sweep)\\b/) || [])[1]; if (!sub) continue;", /Q3-1 \(c\) STATE-ii/],
  ['Q3-5', PO, 'if (i10 >= 0) lines[i10] = C10({ ...ctx, calls: full.calls });', 'void i10;', /Q3-5:/],
  ['Q3-6', PO, 'report: ${outAbs}`);', 'report: ${out}`);', /Q3-6:/],
  // ---- fix trip 3b (the Captain's ⓼ (a)): revert "committed = a commit no earlier than this session's last write"
  ['C10-since', CH, ' && !committedSinceWrite(ctx, p, ts)) bad.push(', ') bad.push(', /C10 \[3b i\]/],
  // ---- fix trip 4 (QC4's Q4-1, Q4-2, Q4-6; the Captain's 12:06 ruling): each row REVERTS one fix; its test must go red
  // (the replacement must not CONTAIN the target, or the runner's applied-check sees it still present: hence "C7" in double quotes)
  ['Q4-1', CH, "return R('C7', 'PASS', `read whole (${lw", "if (incomingText == null || !equalsFile(lw, incomingText).equal) return R(\"C7\", 'FAIL', 'Q4-1 reverted: the read must equal the file now'); return R(\"C7\", 'PASS', `read whole (${lw", /Q4-1 \[A\]/],
  ['Q4-2', PO, "const NEAR_ZERO_NAMES = ['2026.10.19-near-zero-campaign.md', '2026.10.19-consolidation-standup-near-zero-campaign.md'];", "const NEAR_ZERO_NAMES = ['2026.10.19-consolidation-standup-near-zero-campaign.md'];", /Q4-2 \[new name\]/],
  ['Q4-6', PO, "if (runsPackout(cmd, ['begin']) !== 'begin') continue; // Q4-6", "if (runsPackout(cmd, ['begin']) !== 'begin' && !/packout\\.mjs[\"']?\\s+begin\\b/.test(stripHeredocs(cmd))) continue; // Q4-6", /Q4-6 \[p7\]/],
];
const count = (s, sub) => s.split(sub).length - 1;
// --count: READ-ONLY. Count every row's target text in its file and exit 1 unless each occurs exactly once (Q3-4: re-count EVERY
// row, not only the new ones; a rewritten target prints NOT APPLIED in a full run). Safe on any checkout, branch or not.
if (process.argv.includes('--count')) {
  let off = 0;
  // (fix trip 4: a replacement that CONTAINS its own target can never pass the applied-check, so it prints NOT APPLIED; flag it here)
  for (const [id, rel, oldS, newS] of M) {
    const c = count(fs.readFileSync(path.join(root, rel), 'utf8'), oldS); const self = newS.includes(oldS);
    if (c !== 1 || self) off++;
    console.log(`${id}\t${rel}\t${c}${c === 1 ? '' : '\t<< NOT EXACTLY ONCE'}${self ? '\t<< REPLACEMENT CONTAINS ITS TARGET' : ''}`);
  }
  console.log(`COUNT\t${M.length - off}/${M.length} rows' target text occurs exactly once, and no replacement contains its target`);
  process.exit(off ? 1 : 0);
}
// A sandbox is a DETACHED worktree (`git worktree add --detach`): a checkout on a branch is somebody's real tree, so refuse it.
// SEALED-EXEC: followed 2026-11-19 — system git on disk, read-only rev-parse; no network.
const head = spawnSync('git', ['-C', root, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
if (head !== 'HEAD') { console.error(`REFUSED: ${root} is on branch "${head}"; run this only in a detached sandbox worktree`); process.exit(2); }
// SEALED-EXEC: followed 2026-11-19 — process.execPath is the node binary already running this script; no network.
const node = (args, cwd) => spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });

let red = 0;
// Each row prints the moment it finishes (not batched at the end): a run killed part-way (fix trip 2: memory pressure at
// row 9) then keeps every finished row, and the sandbox shows which mutation was live when it died.
// Optional filter: node mutations.mjs <sandbox> <id-prefix>… runs only the rows whose id starts with one of the prefixes.
const only = process.argv.slice(3);
const rows = { push: (s) => console.log(s) };
let ran = 0;
for (const [id, rel, oldS, newS, want] of M) {
  if (only.length && !only.some((p) => id.startsWith(p))) continue;
  ran++;
  const f = path.join(root, rel); const orig = fs.readFileSync(f, 'utf8');
  try {
    if (count(orig, oldS) !== 1) { rows.push(`${id}\tNOT APPLIED: the text to mutate occurs ${count(orig, oldS)} times`); continue; }
    const mut = orig.replace(oldS, newS); fs.writeFileSync(f, mut);
    const now = fs.readFileSync(f, 'utf8');
    if (count(now, oldS) !== 0 || !now.includes(newS)) { rows.push(`${id}\tNOT APPLIED (verify failed)`); continue; }
    const lineNo = now.split('\n').findIndex((l) => l.includes(newS.split('\n')[0])) + 1;
    const syn = node(['--check', f], root);
    if (syn.status !== 0) { rows.push(`${id}\tnode --check FAILED: ${syn.stderr.slice(0, 120)}`); continue; }
    const r = node(['--test', 'scripts/packout/test/packout.test.mjs'], root);
    const failed = [...(r.stdout + r.stderr).matchAll(/^✖ (.+?) \(\d/gm)].map((m) => m[1]).filter((n, i, a) => a.indexOf(n) === i && n !== 'failing tests:');
    const hit = failed.some((n) => want.test(n));
    if (hit) red++;
    rows.push(`${id}\t${hit ? 'RED for its reason' : 'NOT RED for its reason'}\tline ${lineNo}: ${newS.trim().slice(0, 90)}\tfailing: ${failed.length} [${failed.map((n) => n.slice(0, 40)).join(' | ')}]`);
  } finally { fs.writeFileSync(f, orig); }
}
console.log(`SUMMARY\t${red}/${ran} mutations went red for their check's reason${only.length ? ` (filtered: ${only.join(' ')}; ${M.length} rows in all)` : ''}`);
process.exit(red === ran ? 0 : 1);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
