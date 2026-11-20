// packout.test.mjs — the machine-independent gate for packout.mjs: run with `node --test scripts/packout/test/`.
// Truncation check: the last line of this file should read FULL FILE LOADED.
// Node built-ins only; no network; no database; state goes to a temp PACKOUT_STATE_DIR, never ~/.claude/packout.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { goodPackout, check, run, verdicts, Tx, codeRoot } from './helpers.mjs';
import { parse } from '../lib/transcript.mjs';
import { C4, uncommittedList, bashWriteTargets, launchSegment } from '../lib/checks.mjs';

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
  const g = goodPackout({ agent: 'soren' });
  // re-run check as an AC: profile switches by --agent at begin; rebuild state with an AC agent
  const st = path.join(g.f.state); const dir = fs.readdirSync(st)[0]; const sp = path.join(st, dir, 'state.json');
  const s = JSON.parse(fs.readFileSync(sp, 'utf8')); s.agent = 'AC-PG'; fs.writeFileSync(sp, JSON.stringify(s));
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

// ---- verify (ruling ⓹)
function passed() { const g = goodPackout(); const r = check(g.f); assert.equal(r.code, 0); return { g, rep: g.f.handoff.replace(/\.md$/, '.packout-report.md') }; }
test('verify: same machine, untouched → VERIFY PASS', () => {
  const { g, rep } = passed();
  const r = run(g.f, 'verify', '--report', rep);
  assert.equal(r.code, 0, r.out + r.err); assert.match(r.out, /^VERIFY PASS/);
});
test('verify: a tampered report (a verdict changed) → FAIL', () => {
  const { g, rep } = passed();
  fs.writeFileSync(rep, fs.readFileSync(rep, 'utf8').replace('"C8":"PASS"', '"C8":"OPEN"'));
  const r = run(g.f, 'verify', '--report', rep);
  assert.equal(r.code, 1); assert.match(r.out, /C8: report says OPEN, re-run says PASS/);
});
test('verify: the handoff edited after the PASS → FAIL (C8 re-judged against the file now)', () => {
  const { g, rep } = passed();
  fs.appendFileSync(g.f.handoff, 'late edit\n');
  const r = run(g.f, 'verify', '--report', rep);
  assert.equal(r.code, 1); assert.match(r.out, /C8: report says PASS, re-run says FAIL/);
});
test('verify: lines appended to the transcript after the check are fine; a change inside lines 1..N fails with that message', () => {
  const { g, rep } = passed();
  g.tx.say('later turn'); g.tx.flush();
  assert.equal(run(g.f, 'verify', '--report', rep).code, 0, 'growth after N is expected');
  const t = fs.readFileSync(g.f.transcript, 'utf8').split('\n'); t[1] = t[1].replace('Working.', 'Working!'); fs.writeFileSync(g.f.transcript, t.join('\n'));
  const r = run(g.f, 'verify', '--report', rep);
  assert.equal(r.code, 1); assert.match(r.out, /first \d+ lines changed/);
});
test('verify: cross-machine (transcript absent) downgrades to the report hashes, and catches a handoff change', () => {
  const { g, rep } = passed();
  fs.renameSync(g.f.transcript, g.f.transcript + '.elsewhere');
  let r = run(g.f, 'verify', '--report', rep);
  assert.equal(r.code, 0); assert.match(r.out, /VERIFY DOWNGRADED \(cross-machine\)/);
  fs.appendFileSync(g.f.handoff, 'late\n');
  r = run(g.f, 'verify', '--report', rep);
  assert.equal(r.code, 1); assert.match(r.out, /handoff changed since the check/);
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
