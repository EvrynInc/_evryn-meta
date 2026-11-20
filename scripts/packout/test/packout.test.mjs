// packout.test.mjs — the machine-independent gate for packout.mjs: run with `node --test scripts/packout/test/`.
// Truncation check: the last line of this file should read FULL FILE LOADED.
// Node built-ins only; no network; no database; state goes to a temp PACKOUT_STATE_DIR, never ~/.claude/packout.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { goodPackout, check, checkRecorded, verify, run, runAt, verdicts, Tx, codeRoot, PACKOUT } from './helpers.mjs';
import { pathToFileURL } from 'node:url';
import { parse, winPath, hashFirst } from '../lib/transcript.mjs';
const verdictsN = (rep) => { const m = /```json\n([\s\S]*?)\n```/.exec(fs.readFileSync(rep, 'utf8')); return JSON.parse(m[1]).n; };
import { C4, uncommittedList, bashWriteTargets, launchSegment, isTaskNote, runsPackout } from '../lib/checks.mjs';

const ALL = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];
function only(out, failing) {
  const v = verdicts(out);
  for (const c of ALL) assert.equal(v[c]?.v, failing.includes(c) ? 'FAIL' : 'PASS', `${c}: ${v[c]?.v} — ${v[c]?.e}`);
  return v;
}

test('baseline: the good packout passes all twelve checks', () => {
  const g = goodPackout();
  const r = check(g.f);
  only(r.out, []);
  assert.equal(r.code, 0);
  assert.ok(fs.existsSync(g.f.handoff.replace(/\.md$/, '.packout-report.md')), 'report written beside the handoff');
});

// ---- one transcript mutation per check: delete (blank in place) or insert the deciding line; the verdict must flip
const blankCases = { C1: 'memory', C2: 'task', C4: 'handoffWrite', C5: 'sweep2Read', C7: 'incomingRead', C8: 'handoffRead', C9: 'findingsRead', C12: 'nz' };
for (const [c, key] of Object.entries(blankCases)) {
  test(`mutation ${c}: deleting its deciding line (${key}) flips ${c} to FAIL`, () => {
    const g = goodPackout(); g.tx.blank(g.L[key]).flush();
    const r = check(g.f);
    // no handoff write: no second sweep or findings can follow it. C8 still PASSes, correctly: it judges content, and the seat's
    // last whole Read still equals the file as it stands.
    const extra = c === 'C4' ? ['C5', 'C9'] : [];
    only(r.out, [c, ...extra]);
    assert.equal(r.code, 1);
  });
}
test('mutation C3: deleting both sweep Reads flips C3 (and C5) to FAIL; deleting only the first flips exactly one of the pair', () => {
  let g = goodPackout(); g.tx.blank([g.L.sweep1Read, g.L.sweep2Read]).flush();
  only(check(g.f).out, ['C3', 'C5']);
  g = goodPackout(); g.tx.blank(g.L.sweep1Read).flush();
  only(check(g.f).out, ['C5']); // one owned sweep read to its marker satisfies the lock sweep, so the SECOND sweep is what is missing
});
test('mutation C5b: a second sweep made BEFORE the handoff\'s first write does not count for C5', () => {
  const g = goodPackout({ earlySweep2: true });
  const v = only(check(g.f).out, ['C5']);
  assert.match(v.C5.e, /no sweep extract made after the handoff's first write/);
});
test('mutation C6: inserting an Agent call the handoff does not name flips C6 to FAIL', () => {
  const g = goodPackout(); g.tx.agent('helper described only by its job', 'ffff0000eeee1111'); g.tx.flush();
  const v = only(check(g.f).out, ['C6']);
  assert.match(v.C6.e, /ffff0000eeee1111/);
});
test('mutation C10: inserting a Write to a repo file that is neither committed nor listed flips C10 to FAIL', () => {
  const g = goodPackout(); g.tx.write(path.join(g.f.tw, 'shared', 'stray.md'), 'stray\n'); g.tx.flush();
  const v = only(check(g.f).out, ['C10']);
  assert.match(v.C10.e, /stray\.md/);
});
test('mutation C10 (second half): the incoming list names an uncommitted path the outgoing list drops', () => {
  const g = goodPackout(); fs.writeFileSync(path.join(g.f.tw, 'shared', 'carried.md'), 'changed, uncommitted\n');
  fs.writeFileSync(g.f.handoff, fs.readFileSync(g.f.handoff, 'utf8').replace('`shared/carried.md`\n', ''));
  g.tx.read(g.f.handoff); g.tx.flush(); // keep C8 honest: re-read after the change
  const v = verdicts(check(g.f).out);
  assert.equal(v.C10.v, 'FAIL'); assert.match(v.C10.e, /incoming's uncommitted shared\/carried\.md/);
});
test('mutation C11: inserting a compaction marker flips C11 to FAIL and marks later writes UNVERIFIED', () => {
  const g = goodPackout(); g.tx.compact(); g.tx.flush();
  const v = only(check(g.f).out, ['C11']);
  assert.match(v.C11.e, /compaction at line/);
});
test('PACKOUT-NONE C2 and C12 lines (presence-only) restore PASS when the writes are missing', () => {
  const g = goodPackout(); g.tx.blank([g.L.task, g.L.nz]);
  fs.appendFileSync(g.f.handoff, 'PACKOUT-NONE C2: nothing changed for the team\nPACKOUT-NONE C12: nothing by hand — Justin was not in this session\n');
  g.tx.read(g.f.handoff); g.tx.flush();
  const v = only(check(g.f).out, []);
  assert.match(v.C2.e, /presence-only/); assert.match(v.C12.e, /presence-only; truth invisible/);
});
test('AC profile: PACKOUT-NONE C1 passes C1 (interim), and current-state is _evryn-meta/docs/current-state.md', () => {
  const g = goodPackout({ agent: 'AC-PG' }); // the profile comes from the begin call's own --agent, in the transcript
  let v = verdicts(check(g.f).out);
  assert.equal(v.C1.v, 'FAIL'); assert.equal(v.C2.v, 'FAIL'); assert.match(v.C2.e, /current-state none/);
  fs.appendFileSync(g.f.handoff, 'PACKOUT-NONE C1: AC keeps no MEMORY.md\n'); g.tx.read(g.f.handoff); g.tx.flush();
  v = verdicts(check(g.f).out);
  assert.equal(v.C1.v, 'PASS'); assert.match(v.C1.e, /AC profile \(interim\)/);
});

// ---- the four instrument controls (each failed in the prototype)
test('instrument 1: one tool call written on two transcript lines counts once', () => {
  const f = codeRoot(); const tx = new Tx(f.transcript);
  tx.call('Write', { file_path: f.handoff, content: 'x' }, 'ok', { dup: true });
  tx.read(f.incoming, { dup: true }); tx.flush();
  const p = parse(f.transcript);
  assert.equal(p.calls.length, 2, 'two calls, not four');
  const r = C4({ calls: p.calls, from: 0, handoff: f.handoff });
  assert.match(r.evidence, /\(1 writes\)/);
});
test('instrument 2: a sweep Read that stops one line short of its marker fails C3', () => {
  const g = goodPackout({ shortSweeps: true });
  const v = verdicts(check(g.f).out);
  assert.equal(v.C3.v, 'FAIL'); assert.match(v.C3.e, /unread \d+(;|$)/); // exactly one line — the marker — is unread
  assert.equal(v.C5.v, 'FAIL');
});
test('instrument 3: an edit to the handoff by ANOTHER session after the last Read fails C8 (content inequality)', () => {
  const g = goodPackout();
  fs.appendFileSync(g.f.handoff, 'a line another session added\n'); // no call in this transcript
  const v = verdicts(check(g.f).out);
  assert.equal(v.C8.v, 'FAIL'); assert.match(v.C8.e, /differs from the handoff now/);
});
test('instrument 4: an extract printed by sed or head in Bash output does not count', () => {
  const g = goodPackout({ bashSweeps: true });
  const v = verdicts(check(g.f).out);
  assert.equal(v.C3.v, 'FAIL'); assert.equal(v.C5.v, 'FAIL');
});

// ---- transcript-format facts measured in part 0
test('format: an errored Read and a PARTIAL view never count as a whole read', () => {
  const f = codeRoot(); const tx = new Tx(f.transcript);
  tx.call('Read', { file_path: f.incoming }, 'File does not exist.', { err: true });
  const full = fs.readFileSync(f.incoming, 'utf8');
  tx.read(f.incoming, { a: 1, b: 2 }); // a partial view: whole lines, the canary missing, is_error false
  tx.flush();
  const p = parse(f.transcript);
  assert.equal(p.calls[0].ok, false);
  assert.equal(p.calls[1].win.lines.length, 2);
  assert.ok(full.split('\n').length > 2);
});
test('format: CRLF files compare equal to a Read (the Read tool strips CR)', () => {
  const g = goodPackout();
  fs.writeFileSync(g.f.handoff, fs.readFileSync(g.f.handoff, 'utf8').replace(/\n/g, '\r\n'));
  assert.equal(verdicts(check(g.f).out).C8.v, 'PASS');
});
test('form: "## Uncommitted" parses one backticked path per line', () => {
  assert.deepEqual(uncommittedList('# H\n\n## Uncommitted\n\n`a/b.md`\n`c.md`\n\n## Next\n`z.md`\n'), ['a/b.md', 'c.md']);
  assert.equal(uncommittedList('# none here\n'), null);
});

// ---- defects the historical runs found in the first build (each one a real transcript shape, reduced)
test('a command whose TEXT names a file is not a write to it; only write targets count (heredoc bodies stripped)', () => {
  const t = (c) => bashWriteTargets(c);
  assert.deepEqual(t(`cat > /tmp/s6.txt <<'EOF'\nsee shared/x/handoff-review.md\nEOF`), ['/tmp/s6.txt']);
  assert.deepEqual(t('node append-entry.mjs .claude/agent-memory/soren/MEMORY.md - <<EOF\nbody > shared/current-state/current-state.md\nEOF'), ['.claude/agent-memory/soren/MEMORY.md']);
  assert.deepEqual(t('f=shared/a/h.md && cp /tmp/h.md $f && echo 2>&1'), ['shared/a/h.md']);
  assert.deepEqual(t('echo hi > /dev/null'), []);
});
test('a launch is a segment whose first word is the claude binary (or "$VAR" set to it) with --bg; prose that mentions it is not', () => {
  assert.ok(launchSegment('CLAUDE="$(ls -d ~/x/claude-code-* | tail -1)/resources/native-binary/claude.exe"; "$CLAUDE" --bg -n "Adm X" --model opus'));
  assert.ok(launchSegment('claude --bg --name "A"'));
  assert.equal(launchSegment("printf '- Reopened by `claude --bg --resume dacfb635`' >> log.md"), null);
  assert.equal(launchSegment('cat > note.md <<EOF\nclaude --bg -n x\nEOF'), null);
});

// ---- verify (ruling ⓹). check's own row is written into the transcript (checkRecorded), as a real seat's is; verify anchors on it.
function passed() { const g = goodPackout(); const r = checkRecorded(g); assert.equal(r.code, 0); return { g, rep: g.f.handoff.replace(/\.md$/, '.packout-report.md') }; }
test('verify: same machine, untouched → VERIFY PASS', () => {
  const { g, rep } = passed();
  const r = verify(g, rep);
  assert.equal(r.code, 0, r.out + r.err); assert.match(r.out, /^VERIFY PASS/);
});
test('verify: a tampered report (a verdict changed) → FAIL', () => {
  const { g, rep } = passed();
  fs.writeFileSync(rep, fs.readFileSync(rep, 'utf8').replace('"C8":"PASS"', '"C8":"OPEN"'));
  const r = verify(g, rep);
  assert.equal(r.code, 1); assert.match(r.out, /C8: report says OPEN, re-run says PASS/);
});
test('verify: the handoff edited after the PASS → FAIL (C8 re-judged against the file now)', () => {
  const { g, rep } = passed();
  fs.appendFileSync(g.f.handoff, 'late edit\n');
  const r = verify(g, rep);
  assert.equal(r.code, 1); assert.match(r.out, /C8: report says PASS, re-run says FAIL/);
});
test('verify: lines appended to the transcript after the check are fine; a change inside lines 1..N fails with that message', () => {
  const { g, rep } = passed();
  g.tx.say('later turn'); g.tx.flush();
  assert.equal(verify(g, rep).code, 0, 'growth after N is expected');
  const t = fs.readFileSync(g.f.transcript, 'utf8').split('\n'); t[1] = t[1].replace('Working.', 'Working!'); fs.writeFileSync(g.f.transcript, t.join('\n'));
  const r = verify(g, rep);
  assert.equal(r.code, 1); assert.match(r.out, /first \d+ lines changed/);
});
const editMeta = (rep, fn) => { const t = fs.readFileSync(rep, 'utf8'); const m = /```json\n([\s\S]*?)\n```/.exec(t); const j = JSON.parse(m[1]); fn(j); fs.writeFileSync(rep, t.replace(m[1], JSON.stringify(j))); };
test('verify: cross-machine (no transcript for the session here, report from another host) is DOWNGRADED with exit 3, never 0, and catches a handoff change', () => {
  const { g, rep } = passed();
  editMeta(rep, (j) => { j.machine = 'SOME-OTHER-HOST'; });
  fs.renameSync(g.f.transcript, g.f.transcript + '.elsewhere');
  let r = verify(g, rep);
  assert.equal(r.code, 3); assert.match(r.out, /VERIFY DOWNGRADED \(cross-machine\).*NOT a pass/);
  fs.appendFileSync(g.f.handoff, 'late\n');
  r = verify(g, rep);
  assert.equal(r.code, 1); assert.match(r.out, /handoff changed since the check/);
});
test('verify: a report saying it was made HERE, with no transcript for its session here → FAIL', () => {
  const { g, rep } = passed();
  fs.renameSync(g.f.transcript, g.f.transcript + '.elsewhere');
  const r = verify(g, rep);
  assert.equal(r.code, 1); assert.match(r.out, /made on this machine.*no transcript for session testsess/);
});

// ---- QC1's findings and AC-PG's F-AC1/F-AC2 (fix trip). Each test fails without its fix.
test('F1 (QC1 P1): a forged report pointing at a missing transcript, same machine → VERIFY FAIL, not DOWNGRADED', () => {
  const g = goodPackout(); g.tx.blank(g.L.memory).flush();
  const rep = g.f.handoff.replace(/\.md$/, '.packout-report.md');
  assert.equal(checkRecorded(g).code, 1);
  editMeta(rep, (j) => { j.verdicts.C1 = 'PASS'; j.transcript = 'C:/nowhere/forged.jsonl'; });
  const r = verify(g, rep);
  assert.equal(r.code, 1, r.out); assert.match(r.out, /C1: report says PASS, re-run says FAIL/);
});
test('F1: verify checks the successor footer — a wrong PREDECESSOR or HANDOFF fails; the right ones pass', () => {
  const { g, rep } = passed();
  assert.equal(run(g.f, 'verify', '--report', rep, '--predecessor', 'someone-else', '--handoff', g.f.handoff).code, 1);
  assert.equal(run(g.f, 'verify', '--report', rep, '--predecessor', 'testsess', '--handoff', g.f.incoming).code, 1);
  assert.equal(run(g.f, 'verify', '--report', rep, '--predecessor', 'testsess', '--handoff', g.f.handoff).code, 0);
});
test('F2 (QC1 P2): a forged report state (incoming dropped, C7 flipped to PASS) → VERIFY FAIL; state comes from the transcript', () => {
  const g = goodPackout(); g.tx.blank(g.L.incomingRead).flush();
  const rep = g.f.handoff.replace(/\.md$/, '.packout-report.md');
  assert.equal(verdicts(checkRecorded(g).out).C7.v, 'FAIL');
  editMeta(rep, (j) => { j.incoming = null; if (j.state) j.state.incoming = null; j.verdicts.C7 = 'PASS'; });
  const r = verify(g, rep);
  assert.equal(r.code, 1, r.out); assert.match(r.out, /C7: report says PASS, re-run says FAIL|incoming/);
});

// ---- QC2's findings (fix trip 2). Each test fails without its fix.
test('N9 (QC2 P9): a forged n (with its sha recomputed) that hides a compaction → VERIFY FAIL; C11 is judged on the whole transcript', () => {
  const g = goodPackout(); g.tx.compact(); g.tx.flush();
  const rep = g.f.handoff.replace(/\.md$/, '.packout-report.md');
  assert.equal(checkRecorded(g).code, 1);
  const n = verdictsN(rep) - 1; // the line before the compaction row
  editMeta(rep, (j) => { j.n = n; j.sha = hashFirst(g.f.transcript, n).sha; j.verdicts.C11 = 'PASS'; });
  const r = verify(g, rep);
  assert.equal(r.code, 1, r.out); assert.match(r.out, /C11: report says PASS, re-run says FAIL/);
});
test('N9 (QC2 P9b): a forged n that hides an unlisted, uncommitted Write → VERIFY FAIL; C10 is judged at least to check\'s own row', () => {
  const g = goodPackout(); g.tx.write(path.join(g.f.tw, 'shared', 'stray9.md'), 'x\n'); g.tx.flush();
  const rep = g.f.handoff.replace(/\.md$/, '.packout-report.md');
  assert.equal(checkRecorded(g).code, 1);
  const n = verdictsN(rep) - 2; // before the Write's two rows
  editMeta(rep, (j) => { j.n = n; j.sha = hashFirst(g.f.transcript, n).sha; j.verdicts.C10 = 'PASS'; });
  const r = verify(g, rep);
  assert.equal(r.code, 1, r.out); assert.match(r.out, /C10: report says PASS, re-run says FAIL/);
});
test('N9 (honest, same turn): a repo Write landing after check counted its lines but before check\'s own row → VERIFY FAIL', () => {
  const g = goodPackout();
  const r0 = checkRecorded(g, { before: () => g.tx.write(path.join(g.f.tw, 'shared', 'sameturn.md'), 'x\n') });
  assert.equal(r0.code, 0, 'check could not see the Write: its row had not reached the transcript');
  const r = verify(g, g.f.handoff.replace(/\.md$/, '.packout-report.md'));
  assert.equal(r.code, 1, r.out); assert.match(r.out, /C10: report says PASS, re-run says FAIL/);
});
// (fix trip 3: Q3-5 judges C10 on the whole transcript, so the test above no longer needs the bound; C6 is the check that still
// does, because it stays bounded at check's row. Without this test the N9-bound revert went green — DC2's full run, 11/20.)
test('N9 (honest, same turn, C6): an Agent spawn landing after check counted its lines but before check\'s own row → VERIFY FAIL on C6', () => {
  const g = goodPackout();
  const r0 = checkRecorded(g, { before: () => g.tx.agent('spawned in the same turn as check', 'dead0000beef2222') });
  assert.equal(r0.code, 0, 'check could not see the spawn: its row had not reached the transcript');
  const r = verify(g, g.f.handoff.replace(/\.md$/, '.packout-report.md'));
  assert.equal(r.code, 1, r.out); assert.match(r.out, /C6: report says PASS, re-run says FAIL .*dead0000beef2222/);
});
test('N9: a compaction AFTER check\'s own row, before verify → VERIFY FAIL (C11 is unbounded)', () => {
  const { g, rep } = passed();
  g.tx.compact(); g.tx.flush();
  const r = verify(g, rep);
  assert.equal(r.code, 1, r.out); assert.match(r.out, /C11: report says PASS, re-run says FAIL/);
});
test('N9: a report no check call in the transcript produced → VERIFY FAIL', () => {
  const g = goodPackout(); const r0 = check(g.f); assert.equal(r0.code, 0); // check ran, but its row never reached the transcript
  const r = verify(g, g.f.handoff.replace(/\.md$/, '.packout-report.md'));
  assert.equal(r.code, 1); assert.match(r.out, /no `packout.mjs check` call/);
});
test('N1 (QC2 P1b): QC1\'s P1 plus an edited machine field, real transcript present → VERIFY FAIL, not DOWNGRADED', () => {
  const g = goodPackout(); g.tx.blank(g.L.memory).flush();
  const rep = g.f.handoff.replace(/\.md$/, '.packout-report.md');
  assert.equal(checkRecorded(g).code, 1);
  editMeta(rep, (j) => { j.verdicts.C1 = 'PASS'; j.transcript = 'C:/nowhere/forged.jsonl'; j.machine = 'SOME-OTHER-HOST'; });
  const r = verify(g, rep);
  assert.equal(r.code, 1, r.out); assert.match(r.out, /C1: report says PASS, re-run says FAIL/);
});
test('N10: verify without --predecessor or --handoff exits non-zero', () => {
  const { g, rep } = passed();
  for (const extra of [[], ['--predecessor', 'testsess'], ['--handoff', g.f.handoff]]) {
    const r = run(g.f, 'verify', '--report', rep, ...extra);
    assert.notEqual(r.code, 0); assert.match(r.err, /verify needs --report, --predecessor and --handoff/);
  }
});
test('N13: a second begin with a different --agent or --incoming is refused, naming both values', () => {
  const g = goodPackout();
  let r = run(g.f, 'begin', '--agent', 'thea', '--handoff', g.f.handoff, '--incoming', g.f.incoming, '--transcript', g.f.transcript);
  assert.equal(r.code, 1); assert.match(r.err, /began with --agent soren; this begin says --agent thea/);
  r = run(g.f, 'begin', '--agent', 'soren', '--handoff', g.f.handoff, '--transcript', g.f.transcript);
  assert.equal(r.code, 1); assert.match(r.err, /began with --incoming .*handoff-in\.md; this begin says --incoming \(none\)/);
  r = run(g.f, 'begin', '--agent', 'soren', '--handoff', g.f.handoff, '--incoming', g.f.incoming, '--transcript', g.f.transcript);
  assert.equal(r.code, 0, r.err);
});
test('N17: check and verify with Git-Bash /c/... paths on win32', { skip: process.platform !== 'win32' }, () => {
  const g = goodPackout();
  const gb = (p) => p.replace(/\\/g, '/').replace(/^([A-Za-z]):\//, (_, d) => `/${d.toLowerCase()}/`);
  const r1 = run(g.f, 'check', '--handoff', gb(g.f.handoff), '--transcript', gb(g.f.transcript));
  assert.equal(r1.code, 0, r1.out + r1.err);
  g.tx.bash(`node packout.mjs check --handoff ${gb(g.f.handoff)}`, r1.out); g.tx.flush();
  const rep = g.f.handoff.replace(/\.md$/, '.packout-report.md');
  const r2 = run(g.f, 'verify', '--report', gb(rep), '--predecessor', 'testsess', '--handoff', gb(g.f.handoff));
  assert.equal(r2.code, 0, r2.out + r2.err); assert.match(r2.out, /^VERIFY PASS/);
});
test('N15 (a): verify with the predecessor\'s state missing says so, not "run begin first"', () => {
  const { g, rep } = passed();
  const st = fs.readdirSync(g.f.state)[0]; fs.renameSync(path.join(g.f.state, st), path.join(g.f.root, 'moved-state'));
  const r = verify(g, rep);
  assert.equal(r.code, 1); assert.match(r.out, /predecessor's packout state .* is missing on this machine/); assert.doesNotMatch(r.err + r.out, /run begin first/);
});
test('N15 (c): importing packout.mjs does not run the CLI; its exports are usable', () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `import(${JSON.stringify(pathToFileURL(PACKOUT).href)}).then((m) => console.log(typeof m.anchors, typeof m.profileFor))`], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /^function function/);
});
test('F-AC1: a sweep run in the same turn as the handoff Write (the run-time count lags) still counts after the Write: C5 PASS', () => {
  const g = goodPackout({ lagSweep: true });
  only(check(g.f).out, []);
});
test('F-AC2: a write made before begin in the same turn (the run-time count lags) does NOT count as after begin', () => {
  const g = goodPackout({ lagBegin: true });
  const v = only(check(g.f).out, ['C1']);
  assert.match(v.C1.e, /no write/);
});
test('F3: sweep refuses an extract with no user or assistant turn; nothing is recorded', () => {
  const f = codeRoot(); const tx = new Tx(f.transcript);
  tx.read(f.incoming); tx.flush();
  assert.equal(run(f, 'begin', '--agent', 'soren', '--handoff', f.handoff, '--transcript', f.transcript).code, 0);
  const r = run(f, 'sweep', '--handoff', f.handoff, '--transcript', f.transcript);
  assert.equal(r.code, 1); assert.match(r.err, /no user or assistant turn/);
});
test('F3: an extract made from ANOTHER transcript, Read to its marker here, does not count', () => {
  const g = goodPackout();
  const other = new Tx(path.join(g.f.root, 'other.jsonl')); other.user('unrelated'); other.say('text'); other.flush();
  const r = run(g.f, 'sweep', '--handoff', g.f.handoff, '--transcript', other.file);
  const s3 = r.out.match(/sweep 3: (.*?) \(/)[1];
  g.tx.blank([g.L.sweep1Read, g.L.sweep2Read]); g.tx.bash('node packout.mjs sweep', r.out); g.tx.read(s3); g.tx.flush();
  const out = check(g.f).out;
  only(out, ['C3', 'C5']);
});
test('F5: a file written by Bash, uncommitted and unlisted, fails C10', () => {
  const g = goodPackout(); const p = path.join(g.f.tw, 'shared', 'stray-bash.md').replace(/\\/g, '/');
  fs.writeFileSync(p, 'x\n'); g.tx.bash(`echo x >> ${p}`, ''); g.tx.flush();
  const v = only(check(g.f).out, ['C10']); assert.match(v.C10.e, /stray-bash\.md/);
});
test('F6: the uncommitted-list match is on a segment boundary (`ray.md` does not cover shared/stray.md)', () => {
  const g = goodPackout();
  fs.writeFileSync(g.f.handoff, fs.readFileSync(g.f.handoff, 'utf8').replace('`shared/carried.md`', '`shared/carried.md`\n`ray.md`'));
  g.tx.read(g.f.handoff); g.tx.write(path.join(g.f.tw, 'shared', 'stray.md'), 'stray\n'); g.tx.flush();
  assert.equal(verdicts(check(g.f).out).C10.v, 'FAIL');
});
test('F7: a task note is tasks.mjs update|close with --note, $VAR resolved; `add … note` is not', () => {
  assert.ok(isTaskNote('T=../_evryn-meta/scripts/tasks/tasks.mjs; node $T update T-1 --status done --note "done"'));
  assert.ok(isTaskNote('node scripts/tasks/tasks.mjs close T-2 --note "why"'));
  assert.equal(isTaskNote('node scripts/tasks/tasks.mjs add "a note about x"'), false);
  assert.equal(isTaskNote('node scripts/tasks/tasks.mjs note T-1 "done"'), false);
});
test('F8: a second begin from a different session is refused unless --resume', () => {
  const g = goodPackout();
  const r = spawnSync(process.execPath, [PACKOUT, 'begin', '--agent', 'soren', '--handoff', g.f.handoff, '--transcript', g.f.transcript], { encoding: 'utf8', env: { ...process.env, PACKOUT_STATE_DIR: g.f.state, PACKOUT_CODE_ROOT: g.f.root, CLAUDE_CODE_SESSION_ID: 'another-session' } });
  assert.equal(r.status, 1); assert.match(r.stderr, /REFUSED.*--resume/);
  const r2 = spawnSync(process.execPath, [PACKOUT, 'begin', '--agent', 'soren', '--handoff', g.f.handoff, '--incoming', g.f.incoming, '--transcript', g.f.transcript, '--resume'], { encoding: 'utf8', env: { ...process.env, PACKOUT_STATE_DIR: g.f.state, PACKOUT_CODE_ROOT: g.f.root, CLAUDE_CODE_SESSION_ID: 'another-session' } });
  assert.equal(r2.status, 0, r2.stderr);
});
test('F4 (minimum): findings last written before the handoff\'s first write fail C9', () => {
  const g = goodPackout(); fs.utimesSync(g.fe, new Date('2020-01-01'), new Date('2020-01-01'));
  const v = only(check(g.f).out, ['C9']); assert.match(v.C9.e, /before the handoff's first write/);
});
test('F10: one compaction writes two rows; it counts once. F12: a Git-Bash path becomes a Windows path on win32', () => {
  const f = codeRoot(); const tx = new Tx(f.transcript);
  tx.compact(); tx.push({ type: 'user', isCompactSummary: true, timestamp: '2026-11-19T20:00:00Z', message: { role: 'user', content: 'summary' } }); tx.flush();
  assert.equal(parse(f.transcript).compactions.length, 1);
  if (process.platform === 'win32') assert.equal(winPath('/c/Users/x'), 'C:/Users/x');
});

// ---- fix trip 3: QC3's Q3-1 (c), Q3-2, Q3-3, Q3-5 and Q3-6, scoped by the definition of done (11/20). Each fails without its fix.
const reportOf = (g) => g.f.handoff.replace(/\.md$/, '.packout-report.md');
test('Q3-2 GHOST: a session id that matches no transcript, plus an edited machine, while this machine holds the begin row → VERIFY FAIL, not DOWNGRADED', () => {
  const g = goodPackout(); g.tx.blank(g.L.memory).flush();
  assert.equal(checkRecorded(g).code, 1);
  const ghost = 'ffffffff-0000-0000-0000-000000000000';
  editMeta(reportOf(g), (j) => { j.session = ghost; j.machine = 'SOME-OTHER-HOST'; j.verdicts.C1 = 'PASS'; });
  const go = () => run(g.f, 'verify', '--report', reportOf(g), '--predecessor', ghost, '--handoff', g.f.handoff);
  let r = go();
  assert.equal(r.code, 1, r.out); assert.match(r.out, /this machine holds a `packout.mjs begin` naming this handoff/);
  // the begin row in a SUBAGENT's transcript is found the same way
  const sub = path.join(g.f.root, 'projects', 'proj', 'parentsess', 'subagents', 'agent-a0b1c2d3e4f5a6b7c.jsonl');
  fs.mkdirSync(path.dirname(sub), { recursive: true }); fs.renameSync(g.f.transcript, sub);
  r = go();
  assert.equal(r.code, 1, r.out); assert.match(r.out, /holds a `packout.mjs begin` naming this handoff \(.*agent-a0b1c2d3e4f5a6b7c\.jsonl/);
});
test('Q3-2 DUP: the same session id in two project folders is AMBIGUOUS → VERIFY FAIL, never an absence', () => {
  const { g, rep } = passed();
  editMeta(rep, (j) => { j.machine = 'SOME-OTHER-HOST'; });
  const dup = path.join(g.f.root, 'projects', 'proj2', 'testsess.jsonl');
  fs.mkdirSync(path.dirname(dup), { recursive: true }); fs.copyFileSync(g.f.transcript, dup);
  const r = verify(g, rep);
  assert.equal(r.code, 1, r.out); assert.match(r.out, /ambiguous on this machine: 2 transcripts match/);
});
test('Q3-2 genuine cross-machine: other transcripts here, one a packout of a DIFFERENT handoff, none naming this one → still DOWNGRADED, exit 3', () => {
  const { g, rep } = passed();
  editMeta(rep, (j) => { j.machine = 'SOME-OTHER-HOST'; });
  const o = new Tx(path.join(g.f.root, 'projects', 'proj', 'othersess.jsonl'));
  o.user('another seat'); o.bash('node packout.mjs begin --agent thea --handoff C:/elsewhere/other.md', 'PREDECESSOR: othersess · HANDOFF: C:\\elsewhere\\other.md · REPORT: C:\\elsewhere\\other.packout-report.md\nBEGIN-ARGS: agent=thea · incoming=-'); o.flush();
  fs.renameSync(g.f.transcript, g.f.transcript + '.elsewhere');
  const r = verify(g, rep);
  assert.equal(r.code, 3, r.out); assert.match(r.out, /^VERIFY DOWNGRADED \(cross-machine\)/);
});
test('Q3-1 (c) STATE-ii: an echo whose text contains "packout.mjs sweep", with a real state entry and a Read to its marker, does not anchor → C5 FAIL', () => {
  const g = goodPackout(); g.tx.blank(g.L.sweep2); // the real sweep-2 call is gone; its state entry and extract remain
  const N = fs.readFileSync(g.s2, 'utf8').split('\n').length - 2;
  g.tx.bash(`echo "node packout.mjs sweep" >/dev/null; echo "sweep 2: ${g.s2} (${N} lines + marker"`, `sweep 2: ${g.s2} (${N} lines + marker`);
  g.tx.read(g.s2); g.tx.flush();
  only(check(g.f).out, ['C5']);
});
test('Q3-1 (c): runsPackout counts real runs (cd &&, ../ or quoted paths, node.exe, $VAR, node flags) and not text that mentions one', () => {
  assert.equal(runsPackout('cd /c/x && node ../_evryn-meta/scripts/packout/packout.mjs sweep --handoff h.md'), 'sweep');
  assert.equal(runsPackout('node "C:/Users/x/Evryn Code/packout.mjs" begin --agent a'), 'begin');
  assert.equal(runsPackout('"/c/Program Files/nodejs/node.exe" scripts/packout/packout.mjs check --handoff h.md'), 'check');
  assert.equal(runsPackout('P=scripts/packout/packout.mjs; node "$P" sweep --handoff h.md'), 'sweep');
  assert.equal(runsPackout('node --no-warnings packout.mjs begin', ['begin', 'sweep']), 'begin');
  assert.equal(runsPackout('node packout.mjs check', ['begin', 'sweep']), null);
  assert.equal(runsPackout('echo "node packout.mjs sweep" >/dev/null; echo "sweep 9: x"'), null);
  assert.equal(runsPackout('git commit -m "packout.mjs check ran"'), null);
  assert.equal(runsPackout('node mutations.mjs packout.mjs sweep'), null);
  assert.equal(runsPackout("cat > n.md <<'EOF'\nnode packout.mjs sweep\nEOF"), null);
});
test('Q3-3 same machine: an honest packout missing one step, report untouched → VERIFY FAIL "the report itself carries a FAIL", exit 1', () => {
  const g = goodPackout(); g.tx.blank(g.L.memory).flush();
  assert.equal(checkRecorded(g).code, 1);
  const r = verify(g, reportOf(g));
  assert.equal(r.code, 1, r.out); assert.match(r.out, /^VERIFY FAIL\tthe report itself carries a FAIL$/m);
});
test('Q3-3 downgrade branch: the same FAILing report, machine edited, no begin row for it on this machine → exit 1, not 3', () => {
  const g = goodPackout(); g.tx.blank(g.L.memory).flush();
  assert.equal(checkRecorded(g).code, 1);
  editMeta(reportOf(g), (j) => { j.machine = 'SOME-OTHER-HOST'; });
  fs.renameSync(g.f.transcript, g.f.transcript + '.elsewhere');
  const r = verify(g, reportOf(g));
  assert.equal(r.code, 1, r.out); assert.match(r.out, /^VERIFY FAIL \(cross-machine, downgraded\)\tthe report itself carries a FAIL$/m);
});
test('Q3-5: an uncommitted, unlisted Write after check\'s own row → VERIFY FAIL on C10; an Agent spawn after it → C6 still PASS', () => {
  let { g, rep } = passed();
  g.tx.write(path.join(g.f.tw, 'shared', 'after-check.md'), 'x\n'); g.tx.flush();
  let r = verify(g, rep);
  assert.equal(r.code, 1, r.out); assert.match(r.out, /C10: report says PASS, re-run says FAIL \(.*after-check\.md/);
  ({ g, rep } = passed());
  g.tx.agent('the successor, launched after check', 'beef0000cafe1111'); g.tx.flush();
  r = verify(g, rep);
  assert.equal(r.code, 0, r.out); assert.match(r.out, /^VERIFY PASS/);
});
test('Q3-6: check --out <relative> prints the resolved report path, so verify still binds it → VERIFY PASS', () => {
  const g = goodPackout();
  const r = runAt(g.f.root, g.f, 'check', '--handoff', g.f.handoff, '--transcript', g.f.transcript, '--out', 'rel-out.packout-report.md');
  assert.equal(r.code, 0, r.out + r.err);
  const rep = path.join(g.f.root, 'rel-out.packout-report.md');
  assert.ok(fs.existsSync(rep), 'the report is written relative to the working directory');
  g.tx.bash(`node packout.mjs check --handoff ${g.f.handoff} --out rel-out.packout-report.md`, r.out); g.tx.flush();
  const v = verify(g, rep);
  assert.equal(v.code, 0, v.out); assert.match(v.out, /^VERIFY PASS/);
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
