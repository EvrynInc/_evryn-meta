// packout.test.mjs — the machine-independent gate for packout.mjs: run with `node --test scripts/packout/test/`.
// Truncation check: the last line of this file should read FULL FILE LOADED.
// Node built-ins only; no network; no database; state goes to a temp PACKOUT_STATE_DIR, never ~/.claude/packout.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { goodPackout, check, checkRecorded, verify, run, runAt, verdicts, Tx, codeRoot, PACKOUT, git } from './helpers.mjs';
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
  r = run(g.f, 'begin', '--agent', 'soren', '--handoff', g.f.handoff, '--incoming', 'none', '--transcript', g.f.transcript); // fix trip 6: `none` is explicit
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
  assert.equal(run(f, 'begin', '--agent', 'soren', '--handoff', f.handoff, '--incoming', 'none', '--transcript', f.transcript).code, 0);
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
  const r = spawnSync(process.execPath, [PACKOUT, 'begin', '--agent', 'soren', '--handoff', g.f.handoff, '--incoming', g.f.incoming, '--transcript', g.f.transcript], { encoding: 'utf8', env: { ...process.env, PACKOUT_STATE_DIR: g.f.state, PACKOUT_CODE_ROOT: g.f.root, CLAUDE_CODE_SESSION_ID: 'another-session' } });
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
// ---- fix trip 3b (the Captain's ⓼ (a), 11/20): "committed" = this session's write reached a commit, not "the file is clean now"
const otherSeatEdits = (p) => fs.appendFileSync(p, 'another seat appended this and has not committed\n'); // no row in this transcript
// (Names carry no "(" followed by a digit: mutations.mjs reads a failing test's name up to the first " (<digit>", its duration.)
test('C10 [3b i]: the predecessor\'s write committed, then ANOTHER seat\'s uncommitted edit to the same shared file → C10 PASS (check and verify)', () => {
  let g = goodPackout(); otherSeatEdits(g.f.cs); otherSeatEdits(g.f.top);
  const v = only(check(g.f).out, []);
  assert.match(v.C10.e, /repo files written/);
  // the same shape at the successor: a clean PASS, then the shared file dirtied by someone else before verify runs
  const p = passed(); g = p.g;
  otherSeatEdits(g.f.cs); otherSeatEdits(g.f.nz);
  const r = verify(g, p.rep);
  assert.equal(r.code, 0, r.out); assert.match(r.out, /^VERIFY PASS/);
});
test('C10 [3b ii] X1 kept: an uncommitted write with no LATER commit (the file was committed before it) → C10 FAIL', () => {
  const g = goodPackout(); // every file but the handoff is committed at this point
  const n = g.tx.edit(g.f.top, '# file', '# file\nan edit this seat never committed');
  // make the write row LATER than the file's newest commit (fixture rows are otherwise dated 11/19, before any test commit)
  const later = new Date(Date.now() + 120000).toISOString();
  g.tx.rows[n - 1] = JSON.stringify({ ...JSON.parse(g.tx.rows[n - 1]), timestamp: later }); g.tx.flush();
  const v = only(check(g.f).out, ['C10']);
  assert.match(v.C10.e, /topsheet\.md \(written at \d+\) is uncommitted and not in "## Uncommitted"/);
});
// ---- fix trip 4: QC4's Q4-1, Q4-2 and Q4-6 (the Captain's 12:06 ruling). Each fails without its fix. Names carry no "(<digit>".
const banner = (p) => fs.writeFileSync(p, '**SUPERSEDED BY:** shared/handoff-out.md\n\n' + fs.readFileSync(p, 'utf8'));
const archived = (f) => path.join(f.tw, 'shared', 'historical', '2026.11', 'handoff-in.md');
const archive = (f) => { fs.mkdirSync(path.dirname(archived(f)), { recursive: true }); git(f.tw, 'mv', 'shared/handoff-in.md', 'shared/historical/2026.11/handoff-in.md'); git(f.tw, 'commit', '-qm', 'step 6: retire the incoming', '--', 'shared/handoff-in.md', 'shared/historical/2026.11/handoff-in.md'); };
test('Q4-1 [A]: packout step 6 banners the incoming SUPERSEDED after the whole re-read → C7 PASS, judged on the read alone', () => {
  const g = goodPackout();
  g.tx.edit(g.f.incoming, '# Incoming handoff', '**SUPERSEDED BY:** shared/handoff-out.md\n\n# Incoming handoff'); g.tx.flush();
  git(g.f.tw, 'commit', '-qm', 'step 6: supersede the incoming', '--', 'shared/handoff-in.md');
  const v = only(check(g.f).out, []);
  assert.match(v.C7.e, /read whole .* to its canary, judged on the read alone/);
});
test('Q4-1 [C]: packout step 6 archives the incoming by git mv after the whole re-read → C7 PASS, though the old path is gone', () => {
  const g = goodPackout(); archive(g.f);
  assert.equal(fs.existsSync(g.f.incoming), false);
  only(check(g.f).out, []);
});
test('Q4-1 [D]: a clean check, then the incoming bannered before the successor\'s verify → VERIFY PASS', () => {
  const { g, rep } = passed(); banner(g.f.incoming);
  const r = verify(g, rep);
  assert.equal(r.code, 0, r.out); assert.match(r.out, /^VERIFY PASS/);
});
test('Q4-1 kept: no Read of the incoming after begin, or a Read short of its end, still FAILs C7 (also when the file has moved)', () => {
  let g = goodPackout(); g.tx.blank(g.L.incomingRead).flush(); archive(g.f);
  // (fix trip 5, Q5-3: with no whole read AND the file moved, the incoming's list can't be read, so C10 now FAILs loud beside C7)
  let v = only(check(g.f).out, ['C7', 'C10']); assert.match(v.C7.e, /no Read of the incoming handoff after line/); assert.match(v.C10.e, /"## Uncommitted" list cannot be read/);
  g = goodPackout(); g.tx.blank(g.L.incomingRead); g.tx.read(g.f.incoming, { a: 1, b: 3 }); g.tx.flush();
  v = only(check(g.f).out, ['C7']); assert.match(v.C7.e, /incoming never read whole/);
  // a whole Read made only BEFORE begin (spliced in after the opening user row) does not count
  g = goodPackout(); g.tx.blank(g.L.incomingRead);
  const early = new Tx(path.join(g.f.root, 'early.jsonl')); early.read(g.f.incoming); g.tx.rows.splice(1, 0, ...early.rows); g.tx.flush();
  v = only(check(g.f).out, ['C7']); assert.match(v.C7.e, /no Read of the incoming handoff after line/);
});
// ---- fix trip 5: QC5's Q5-1, Q5-2 (one C7 change) and Q5-3 (the Captain's 13:04 ruling). Each fails without its fix.
test('Q5-2 [H8]: a whole Read, step 6\'s banner (+2 lines), then a Read of lines 1-3 to see it → C7 PASS on the whole read of the old version', () => {
  const g = goodPackout();
  g.tx.edit(g.f.incoming, '# Incoming handoff', '**SUPERSEDED BY:** shared/handoff-out.md\n\n# Incoming handoff'); g.tx.read(g.f.incoming, { a: 1, b: 3 }); g.tx.flush();
  git(g.f.tw, 'commit', '-qm', 'step 6: supersede the incoming', '--', 'shared/handoff-in.md');
  const v = only(check(g.f).out, []); assert.match(v.C7.e, /read whole \(\d+; 8 lines\) to its canary/);
});
test('Q5-1 [H9]: a partial Read, a trimming Edit, then a one-line Read of the new version → C7 FAIL (two versions are never stitched)', () => {
  const g = goodPackout(); g.tx.blank(g.L.incomingRead);
  g.tx.read(g.f.incoming, { a: 1, b: 4 }); g.tx.edit(g.f.incoming, '## Uncommitted\n\n`shared/carried.md`\n\n', ''); g.tx.read(g.f.incoming, { a: 1, b: 1 }); g.tx.flush();
  git(g.f.tw, 'commit', '-qm', 'carry', '--', 'shared/handoff-in.md');
  const v = only(check(g.f).out, ['C7']); assert.match(v.C7.e, /incoming never read whole after line \d+ \(reads \d+:1-4, \d+:1-1; 4 lines\)/);
});
test('Q5-3 [X2]: the incoming lists an uncommitted path, the seat drops it and leaves it dirty, then step 6 archives the incoming by git mv → C10 FAIL', () => {
  const g = goodPackout();
  fs.writeFileSync(path.join(g.f.tw, 'shared', 'carried.md'), 'changed, uncommitted\n');
  fs.writeFileSync(g.f.handoff, fs.readFileSync(g.f.handoff, 'utf8').replace('`shared/carried.md`\n', '')); g.tx.read(g.f.handoff); g.tx.flush();
  archive(g.f);
  const v = only(check(g.f).out, ['C10']); assert.match(v.C10.e, /incoming's uncommitted shared\/carried\.md is neither committed nor carried forward/);
});
test('Q5-3 kept: an incoming read whole with NO "## Uncommitted" section is not failed on C10\'s incoming half', () => {
  const g = goodPackout();
  fs.writeFileSync(g.f.incoming, '# Incoming handoff\n\nNothing uncommitted.\n\nTruncation canary — DO NOT REMOVE: FULL FILE LOADED\n');
  git(g.f.tw, 'commit', '-qm', 'an incoming with no list', '--', 'shared/handoff-in.md');
  g.tx.read(g.f.incoming); g.tx.flush();
  const v = only(check(g.f).out, []); assert.match(v.C10.e, /incoming list 0/);
});
test('Q4-2 [new name]: the near-zero table written at 2026.10.19-near-zero-campaign.md → C12 PASS', () => {
  const g = goodPackout({ nzName: '2026.10.19-near-zero-campaign.md' });
  const v = only(check(g.f).out, []); assert.match(v.C12.e, /near-zero decisions table written at line/);
});
test('Q4-2 [old name]: the near-zero table written at 2026.10.19-consolidation-standup-near-zero-campaign.md → C12 PASS', () => {
  const g = goodPackout({ nzName: '2026.10.19-consolidation-standup-near-zero-campaign.md' });
  const v = only(check(g.f).out, []); assert.match(v.C12.e, /near-zero decisions table written at line/);
});
test('Q4-6 [p7]: genuine cross-machine, while another transcript here holds a grep of the start line whose output is the footer → still DOWNGRADED, exit 3', () => {
  const { g, rep } = passed();
  editMeta(rep, (j) => { j.machine = 'SOME-OTHER-HOST'; });
  const c = new Tx(path.join(g.f.root, 'projects', 'proj', 'checkersess.jsonl'));
  c.user('check the packout before its successor launches');
  c.bash('grep -n "packout.mjs begin\\|PREDECESSOR" start-line.txt', `3:PREDECESSOR: testsess · HANDOFF: ${g.f.handoff} · REPORT: ${rep}`); c.flush();
  fs.renameSync(g.f.transcript, g.f.transcript + '.elsewhere');
  const r = verify(g, rep);
  assert.equal(r.code, 3, r.out); assert.match(r.out, /^VERIFY DOWNGRADED \(cross-machine\)/);
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

// ---- fix trip 6: counsel's P1 and P4 (honest-path blockers) and wording items 3 and 4 (the Captain's 14:13 ruling).
// Each of items 1 and 2 fails without its fix. Names carry no "(<digit>" (mutations.mjs cuts a test name there).
test('item 1 [P1]: begin with no --incoming, or a bare --incoming flag, is REFUSED naming both forms, and records nothing', () => {
  const f = codeRoot(); const tx = new Tx(f.transcript); tx.user('pack out'); tx.say('ok'); tx.flush();
  for (const extra of [[], ['--incoming']]) {
    const r = run(f, 'begin', '--agent', 'soren', '--handoff', f.handoff, ...extra, '--transcript', f.transcript);
    assert.notEqual(r.code, 0, r.out); assert.match(r.err, /REFUSED: begin needs --incoming <path>, or --incoming none/);
  }
  assert.equal(fs.existsSync(f.state), false, 'a refused begin writes no state');
});
test('item 1 [none]: begin --incoming none keeps the no-incoming verdicts, and verify re-derives them from the begin row → VERIFY PASS', () => {
  const g = goodPackout({ noIncoming: true });
  const r = checkRecorded(g); assert.equal(r.code, 0, r.out);
  const v = only(r.out, []); assert.match(v.C7.e, /no incoming handoff given/); assert.match(v.C10.e, /incoming list 0/);
  const vr = verify(g, reportOf(g)); assert.equal(vr.code, 0, vr.out); assert.match(vr.out, /^VERIFY PASS/);
});
// The seat drops the incoming's one listed path from its own list and leaves the file dirty (counsel's P4 family).
const dropCarried = (listLine) => {
  const g = goodPackout({ listLine });
  fs.writeFileSync(path.join(g.f.tw, 'shared', 'carried.md'), 'changed, uncommitted\n');
  fs.writeFileSync(g.f.handoff, fs.readFileSync(g.f.handoff, 'utf8').replace('`shared/carried.md`\n', ''));
  g.tx.read(g.f.handoff); g.tx.flush();
  return verdicts(check(g.f).out);
};
test('item 2 [P4]: the same dropped path FAILs C10 for the same reason in every form: shared-parent P4, repo-relative P4b, ./ P4c, backslash P4d', () => {
  // the siblings in ONE block, so a form that resolves differently shows here rather than having to be remembered
  for (const [line, shown] of [['`evryn-team-workspace/shared/carried.md`', 'evryn-team-workspace/shared/carried.md'], ['`shared/carried.md`', 'shared/carried.md'], ['`./shared/carried.md`', './shared/carried.md'], ['`shared\\carried.md`', 'shared\\carried.md']]) {
    const v = dropCarried(line);
    assert.equal(v.C10.v, 'FAIL', `${line}: ${v.C10.e}`);
    assert.ok(v.C10.e.includes(`incoming's uncommitted ${shown} is neither committed nor carried forward`), `${line}: ${v.C10.e}`);
  }
  // control: the shared-parent form, carried forward and clean, still PASSes everything
  only(check(goodPackout({ listLine: '`evryn-team-workspace/shared/carried.md`' }).f).out, []);
});
test('item 2 [no repo]: an incoming entry that resolves to no repo, not carried forward → C10 FAIL, loud, naming the path; never skipped', () => {
  const g = goodPackout({ listLine: '`nowhere/carried.md`' });
  const v = only(check(g.f).out, ['C10']);
  assert.match(v.C10.e, /incoming's uncommitted nowhere\/carried\.md resolves to no repo \(looked at .*nowhere.carried\.md\)/);
});
test('item 3: the generated report carries v1\'s strength in one line, exactly', () => {
  const g = goodPackout(); assert.equal(check(g.f).code, 0);
  assert.ok(fs.readFileSync(reportOf(g), 'utf8').split('\n').includes('> Detects honest skips; does not resist a seat that edits its own evidence.'));
});
test('item 4: a second begin changing --agent [P3] or --incoming [P2] is refused, and the refusal names the repair, exactly', () => {
  const g = goodPackout(); const REPAIR = 'to correct `--agent` or `--incoming`, start a fresh packout with a new handoff path.';
  let r = run(g.f, 'begin', '--agent', 'sorne', '--handoff', g.f.handoff, '--incoming', g.f.incoming, '--transcript', g.f.transcript);
  assert.equal(r.code, 1); assert.ok(r.err.includes(REPAIR), r.err);
  r = run(g.f, 'begin', '--agent', 'soren', '--handoff', g.f.handoff, '--incoming', 'C:/nowhere/handof-in.md', '--transcript', g.f.transcript);
  assert.equal(r.code, 1); assert.ok(r.err.includes(REPAIR), r.err);
});
// ---- fix trip 6 additions (the Captain's 14:23 ruling, from field test 1): items 6 and 7
test('item 6: the handoff and its packout report, uncommitted and not listed, count as listed → C10 PASS; another unlisted write still FAILs, X1 kept', () => {
  const g = goodPackout();
  // the handoff's own line goes from its list (the seat named its files in words), and the seat hand-writes its report: both uncommitted
  fs.writeFileSync(g.f.handoff, fs.readFileSync(g.f.handoff, 'utf8').replace('`shared/handoff-out.md`\n', '')); g.tx.read(g.f.handoff);
  g.tx.write(reportOf(g), '# a report the seat wrote by hand\n'); g.tx.flush();
  let v = only(check(g.f).out, []); assert.match(v.C10.e, /outgoing list 1/);
  // verify binds the same report path, so it re-derives the same PASS
  const r0 = checkRecorded(g); assert.equal(r0.code, 0, r0.out);
  const vr = verify(g, reportOf(g)); assert.equal(vr.code, 0, vr.out); assert.match(vr.out, /^VERIFY PASS/);
  g.tx.write(path.join(g.f.tw, 'shared', 'stray6.md'), 'x\n'); g.tx.flush();
  v = only(check(g.f).out, ['C10']); assert.match(v.C10.e, /stray6\.md \(written at \d+\) is uncommitted and not in "## Uncommitted"/);
  assert.doesNotMatch(v.C10.e, /handoff-out\.(md|packout-report\.md) \(written/);
});
test('item 7: a C10 FAIL names the expected form, exactly', () => {
  const g = goodPackout(); g.tx.write(path.join(g.f.tw, 'shared', 'stray7.md'), 'x\n'); g.tx.flush();
  const v = only(check(g.f).out, ['C10']);
  assert.ok(v.C10.e.includes('list each path in backticks, one per line, under `## Uncommitted`.'), v.C10.e);
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
