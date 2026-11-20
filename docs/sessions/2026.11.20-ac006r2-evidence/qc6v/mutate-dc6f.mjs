// copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v/mutate-dc6f.mjs; original sha256 e4c0bf3a31d198f8f01bf6a2fe026d8d705edcae6b842e172fe910ed136dfe0d; copied 2026-11-20 by AC-006R2
// DC6F mutation controls for QC6's fixes to migration 006. Adapted from DCG-6's and QC6's mutate.mjs.
// Runs ONLY in the detached sandbox C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/dc6f-sandbox (at 16fb675, outside the
// shared code folder, so no .env path resolves). For each mutation: apply each edit (exactly one occurrence, file
// verified changed), node --check any .mjs, run the named tests, require RED (and that the migration still applied,
// so the red is the mutation's, not a syntax error), restore the original bytes and verify the restore.
// A clean baseline of every selected test set runs first, in the same run.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const WT = 'C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/dc6f-sandbox';
const T = join(WT, 'scripts/tasks');
const LOG = 'C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/dc6f/mutation-results.txt';
const MIG = 'migrations/006_authorization_record.sql';
const ACC = 'test/acceptance/migration-006.test.mjs';
const SBO = 'test/acceptance/paste-supabase-owner.test.mjs';
const env = { ...process.env, EVRYN_TASKS_RUNTIME_003: 'C:/Users/jbmcg/Evryn/Code/evryn-team-runtime/migrations/003_tasks_proposals.sql' };

const M = (id, file, from, to, test, pattern, expect = 'RED', note = '') => ({ id, file, edits: [[from, to]], test, pattern, expect, note });
const MM = (id, file, edits, test, pattern, expect = 'RED', note = '') => ({ id, file, edits, test, pattern, expect, note });

const LOOKUP = `     where a.id = v_from_id and a.task_id = new.id and a.scope_hash = new.scope_hash;`;
const ALLOW = (next) => `                         and current_user = (select pg_catalog.pg_get_userbyid(c.relowner) from pg_catalog.pg_class c\n                                              where c.oid = 'public.tasks'::regclass);\n  ${next}`;

const mutations = [
  // NB1
  M('NB1-task-half-dropped', MIG, LOOKUP, `     where a.id = v_from_id and a.scope_hash = new.scope_hash;`, ACC, '^QC6-NB1 (a|c):'),
  M('NB1-scope-half-dropped', MIG, LOOKUP, `     where a.id = v_from_id and a.task_id = new.id;`, ACC, '^QC6-NB1 b:'),
  M('NB1-both-dropped (the 1f37fae lookup)', MIG, LOOKUP, `     where a.id = v_from_id;`, ACC, '^QC6-NB1 '),
  // NB2
  M('NB2a-backfill-only-authorization', MIG, `  if new.tier = 'backfill' and new.kind is distinct from 'authorization' then`, `  if false then`, ACC, '^QC6-NB2 a:'),
  M('NB2b-authorize-closed-task', MIG, `    if v_status not in ('backlog','proposed','open','in_progress','blocked','needs_acceptance') then`, `    if false then`, ACC, '^QC6-NB2 b:'),
  M('NB2c-acceptance-no-authorization', MIG, `    if v_auth_id is null then`, `    if false then`, ACC, '^QC6-NB2 c:'),
  M('NB2d-acceptance-scope-match', MIG, `    if v_auth_hash is distinct from v_hash then`, `    if false then`, ACC, '^QC6-NB2 d:'),
  M('NB2e-null-session-exemption-widened', MIG, `  if v_session is null and not (new.tier = 'backfill' and v_migration) then`, `  if v_session is null and not v_migration then`, ACC, '^QC6-NB2 e:'),
  M('NB2f-return-on-closed-too (departure 6)', MIG, `    if old.status = any (v_active) and old.authorization_id is not null and new.scope_hash is distinct from old.scope_hash then`, `    if old.authorization_id is not null and new.scope_hash is distinct from old.scope_hash then`, ACC, '^QC6-NB2 f:'),
  M('NB2g-active-null-pointer', MIG, `          if new.authorization_id is null then\n            raise exception using errcode = 'ET011', message = c_et011,\n              hint = 'This active task`, `          if false then\n            raise exception using errcode = 'ET011', message = c_et011,\n              hint = 'This active task`, ACC, '^QC6-NB2 g:'),
  M('NB2h-active-scope-match', MIG, `          if v_auth_hash is distinct from new.scope_hash then`, `          if false then`, ACC, '^QC6-NB2 h:'),
  // NB3: a statement only a superuser may run, injected into the COMMITTED 006 apply paste
  M('NB3-superuser-only-statement-in-the-paste', 'paste/006-paste-2-apply.sql', `  -- (c) AFTER-ASSERTIONS for change set 006`, `  execute $inj$ set local session_replication_role = replica $inj$;\n  -- (c) AFTER-ASSERTIONS for change set 006`, SBO, '001-004, 005, then 006'),
  // NB4
  MM('NB4-back-to-the-deny-list', MIG, [
    [ALLOW('v_status'), `                         and current_user::text not in ('service_role','authenticator','anon','authenticated');\n  v_status`],
    [ALLOW('v_from_id'), `                         and current_user::text not in ('service_role','authenticator','anon','authenticated');\n  v_from_id`],
  ], ACC, '^QC6-NB4'),
  MM('NB4-role-check-removed', MIG, [
    [ALLOW('v_status'), `                         ;\n  v_status`],
    [ALLOW('v_from_id'), `                         ;\n  v_from_id`],
  ], ACC, '^(18\\. |QC6-NB4)', 'RED', 'the builder\'s C5 control 2, re-targeted at the allow-list'),
  // Cosmetic 5 and 6
  M('C5-ET016-removed', MIG, `      if new.status is distinct from old.status and new.status is distinct from 'proposed' then`, `      if false then`, ACC, '^QC6-C5:'),
  M('C6-clear-on-close-removed', MIG, `    if new.status = any (v_closed) and new.status is distinct from old.status then\n      new.needs_reauthorization := false;`, `    if false then\n      new.needs_reauthorization := false;`, ACC, '^QC6-C6:'),
  // Departure 1: 005's note semantics on the 001–006 shape
  M('D1-comment-row-dropped', MIG, `    if cardinality(v_changed) = 0 and new.note is null then\n      return null;`, `    if cardinality(v_changed) = 0 then\n      return null;`, ACC, '^005 §1.3 on the 001'),
  M('D1-stale-note-kept', MIG, `    -- The note belongs to ONE write (005).\n    if new.note is not distinct from old.note then\n      new.note := null;\n    end if;`, `    -- The note belongs to ONE write (005).`, ACC, '^005 §1.3 on the 001'),
  // Test 17 still guards the task half of the setting (the builder's named control, still applicable)
  M('C4-task-half-of-setting-dropped', MIG, `     and split_part(v_setting, ':', 2) = new.id::text then`, `     then`, ACC, '^17\\. '),
  // With NB1's row binding, the setting's task half is redundant; dropping BOTH task checks still leaves the scope
  // check refusing test 17's crafted write (its tasks differ in title). Dropping all three must turn test 17 red.
  MM('C4-both-task-checks-dropped', MIG, [
    [`     and split_part(v_setting, ':', 2) = new.id::text then`, `     then`],
    [LOOKUP, `     where a.id = v_from_id and a.scope_hash = new.scope_hash;`],
  ], ACC, '^17\\. ', 'GREEN', 'expected green: the scope check alone still refuses'),
  MM('C4-all-three-checks-dropped', MIG, [
    [`     and split_part(v_setting, ':', 2) = new.id::text then`, `     then`],
    [LOOKUP, `     where a.id = v_from_id;`],
  ], ACC, '^17\\. '),
  // Calibration: a body edit with NO behaviour change must stay GREEN on every new behavioural test
  M('calibration-comment-only', MIG, `  -- A blank note is no note.\n  if new.note is not null and btrim(new.note) = '' then\n    new.note := null;\n  end if;\n\n  -- The scope hash`, `  -- A blank note is no note. (DC6F calibration edit)\n  if new.note is not null and btrim(new.note) = '' then\n    new.note := null;\n  end if;\n\n  -- The scope hash`, ACC, '^(QC6-|005 §1.3 on the 001|17\\. |18\\. )', 'GREEN', 'calibration'),
];

function run(test, pattern) {
  // SEALED-EXEC: followed 2026-08-11 — process.execPath is the absolute path of the node binary already running; no network.
  return spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=${pattern}`, join(T, test)], { encoding: 'utf8', env, cwd: WT, timeout: 600000 });
}
const counts = (s) => ({ pass: Number((s.match(/^# pass (\d+)/m) ?? [])[1] ?? NaN), fail: Number((s.match(/^# fail (\d+)/m) ?? [])[1] ?? NaN) });

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
writeFileSync(LOG, `# DC6F mutation run ${new Date().toISOString()} at sandbox ${WT}\n`);
const sets = [...new Map(mutations.filter((m) => !only || only.test(m.id)).map((m) => [`${m.test}|${m.pattern}`, m])).values()];
for (const m of sets) {
  const r = run(m.test, m.pattern);
  const c = counts(r.stdout);
  appendFileSync(LOG, `CLEAN ${m.test} /${m.pattern}/ -> pass ${c.pass} fail ${c.fail} ${c.fail === 0 && c.pass > 0 ? 'OK' : 'BAD'}\n`);
}
for (const m of mutations.filter((x) => !only || only.test(x.id))) {
  const path = join(T, m.file);
  const raw = readFileSync(path, 'utf8');
  const crlf = raw.includes('\r\n');
  let s = raw.replace(/\r\n/g, '\n');
  let applied = true;
  for (const [from, to] of m.edits) {
    const n = s.split(from).length - 1;
    if (n !== 1) { applied = false; appendFileSync(LOG, `SKIP ${m.id}: "${from.slice(0, 70)}" occurs ${n}x\n`); break; }
    s = s.replace(from, () => to);
  }
  if (!applied) continue;
  writeFileSync(path, crlf ? s.replace(/\n/g, '\r\n') : s);
  const changed = readFileSync(path, 'utf8') !== raw;
  let syntax = 'n/a';
  if (path.endsWith('.mjs')) {
    // SEALED-EXEC: followed 2026-08-11 — process.execPath, the running node binary; no network.
    syntax = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' }).status === 0 ? 'ok' : 'SYNTAX ERROR';
  }
  const r = run(m.test, m.pattern);
  const c = counts(r.stdout);
  const migrateFailed = /migrate failed/.test(r.stdout + r.stderr);
  writeFileSync(path, raw);
  const restored = readFileSync(path, 'utf8') === raw;
  const red = c.fail > 0;
  const good = changed && syntax !== 'SYNTAX ERROR' && !migrateFailed && (m.expect === 'RED' ? red : !red && c.pass > 0);
  const verdict = good ? (m.expect === 'RED' ? 'RED (control proves the test)' : 'GREEN (calibration holds)') : 'UNEXPECTED — INVESTIGATE';
  const firstFail = (r.stdout.match(/^ {0,4}not ok \d+ - (.*)$/m) ?? [])[1] ?? '-';
  const reason = (r.stdout.match(/(permission denied[^\n'"]*|ET0\d\d: [^\n'"]{0,80})/) ?? [])[1] ?? '-';
  appendFileSync(LOG, `${m.id}: applied=${changed} syntax=${syntax} migrateFailed=${migrateFailed} -> pass ${c.pass} fail ${c.fail} -> ${verdict}; first red: ${firstFail}; reason seen: ${reason}; restored=${restored}${m.note ? ` (${m.note})` : ''}\n`);
}
appendFileSync(LOG, `# done ${new Date().toISOString()}\n`);
console.log(readFileSync(LOG, 'utf8'));
