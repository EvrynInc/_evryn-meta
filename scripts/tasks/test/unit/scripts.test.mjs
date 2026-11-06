import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FAKE_KEY, TEST_ENV, fakeJwt, jsonResponse } from '../helpers.mjs';
import { runCheck } from '../../check.mjs';
import { runMigrate } from '../../migrate.mjs';
import { runSnapshot } from '../../schema-snapshot.mjs';
import { TEAM_REF } from '../../lib/config.mjs';

const PASSWORD = 'pw-sentinel-77aa91';
const FULL = { ...TEST_ENV, EVRYN_TEAM_DB_PASSWORD: PASSWORD };

function fakePsql(responses) {
  const calls = [];
  const fn = (target, args, opts) => {
    calls.push({ target, args, opts });
    const r = typeof responses === 'function' ? responses(args, calls.length) : responses[calls.length - 1] ?? { status: 0, stdout: '', stderr: '' };
    return { status: 0, stdout: '', stderr: '', ...r };
  };
  fn.calls = calls;
  return fn;
}

const countFetch = async () => jsonResponse(200, [{ id: 'x' }], { 'content-range': '0-0/3' });

// ---------------------------------------------------------------------------
// check.mjs
// ---------------------------------------------------------------------------

test('check: all present → presence, ref match, key kind, row count, select 1, and CHECK OK; no value printed', async () => {
  const lines = [];
  const psql = fakePsql([{ stdout: '1\n' }]);
  const code = await runCheck({ env: FULL, fetchImpl: countFetch, psql, out: (s) => lines.push(s) });
  const text = lines.join('\n');
  assert.equal(code, 0, text);
  assert.match(text, /EVRYN_TEAM_SUPABASE_URL: present/);
  assert.match(text, new RegExp(`project ref in URL: matches ${TEAM_REF}`));
  assert.match(text, /key kind: secret/);
  assert.match(text, /tasks rows \(PostgREST, secret key\): 3/);
  assert.match(text, /pooler select 1: ok/);
  assert.ok(!text.includes(FAKE_KEY) && !text.includes(PASSWORD));
  assert.equal(psql.calls[0].target.host, 'aws-1-us-west-2.pooler.supabase.com');
  assert.ok(!psql.calls[0].args.join(' ').includes(PASSWORD), 'password on the psql command line');
});

test('check: missing variables named; product URL reported as a mismatch and never contacted', async () => {
  const lines = [];
  let fetched = false;
  const code = await runCheck({
    env: { EVRYN_TEAM_SUPABASE_URL: 'https://productref1234567890.supabase.co', EVRYN_TEAM_SUPABASE_SECRET_KEY: FAKE_KEY },
    fetchImpl: async () => {
      fetched = true;
      return countFetch();
    },
    psql: fakePsql([]),
    out: (s) => lines.push(s),
  });
  const text = lines.join('\n');
  assert.equal(code, 1);
  assert.match(text, /EVRYN_TEAM_DB_PASSWORD: MISSING/);
  assert.match(text, /DOES NOT MATCH/);
  assert.equal(fetched, false);
  assert.ok(!text.includes('productref1234567890') && !text.includes(FAKE_KEY));
});

test('check: a publishable key is reported as refused', async () => {
  const lines = [];
  const code = await runCheck({ env: { ...FULL, EVRYN_TEAM_SUPABASE_SECRET_KEY: 'sb_' + 'publishable_zzz' }, fetchImpl: countFetch, psql: fakePsql([{ stdout: '1' }]), out: (s) => lines.push(s) });
  assert.equal(code, 1);
  assert.match(lines.join('\n'), /key kind: REFUSED — .*publishable/);
});

test('check: a forced psql error that echoes the password prints no password', async () => {
  const lines = [];
  const psql = () => {
    throw new Error(`psql could not run: spawn failed with ${PASSWORD}`);
  };
  await runCheck({ env: FULL, fetchImpl: countFetch, psql, out: (s) => lines.push(s) });
  assert.ok(!lines.join('\n').includes(PASSWORD));
});

test('check: a legacy JWT is classified', async () => {
  const lines = [];
  await runCheck({ env: { ...FULL, EVRYN_TEAM_SUPABASE_SECRET_KEY: fakeJwt({ role: 'service_role', ref: TEAM_REF }) }, fetchImpl: countFetch, psql: fakePsql([{ stdout: '1' }]), out: (s) => lines.push(s) });
  assert.match(lines.join('\n'), /key kind: legacy-service-role/);
});

// ---------------------------------------------------------------------------
// migrate.mjs
// ---------------------------------------------------------------------------

test('migrate: the live target refuses without --rehearse or --apply-live, and runs nothing', () => {
  const psql = fakePsql([]);
  const errs = [];
  const code = runMigrate([], { env: FULL, psql, out: () => {}, err: (s) => errs.push(s) });
  assert.equal(code, 2);
  assert.equal(psql.calls.length, 0);
  assert.match(errs.join('\n'), /live Evryn Team database/);
});

test('migrate: refuses unless runtime 003 is present', () => {
  const psql = fakePsql([{ stdout: 'false,true\n' }]);
  const errs = [];
  const code = runMigrate(['--apply-live'], { env: FULL, psql, out: () => {}, err: (s) => errs.push(s) });
  assert.equal(code, 1);
  assert.equal(psql.calls.length, 1, 'went past the prerequisite check');
  assert.match(errs.join('\n'), /runtime migration 003 is not present/);
});

test('migrate --apply-live: one transaction (-1), every file in order, lock_timeout, no password in argv', () => {
  const psql = fakePsql([{ stdout: 'true,true\n' }, { stderr: '' }]);
  const code = runMigrate(['--apply-live'], { env: FULL, psql, out: () => {}, err: () => {} });
  assert.equal(code, 0);
  const args = psql.calls[1].args;
  assert.ok(args.includes('-1'));
  assert.ok(args.includes("set local lock_timeout = '5s'"));
  const files = args.filter((a, i) => args[i - 1] === '-f').map((f) => f.split(/[\\/]/).pop());
  assert.deepEqual(files, ['001_tasks_columns.sql', '002_task_history.sql', '003_task_triggers.sql']);
  assert.ok(!JSON.stringify(psql.calls.map((c) => c.args)).includes(PASSWORD));
  assert.equal(psql.calls[1].target.password, PASSWORD, 'the password travels in the target (→ PGPASSWORD), not argv');
});

test('migrate --rehearse: begin … rollback, never -1', () => {
  const psql = fakePsql([{ stdout: 'true,true\n' }, {}]);
  const out = [];
  assert.equal(runMigrate(['--rehearse'], { env: FULL, psql, out: (s) => out.push(s), err: () => {} }), 0);
  const args = psql.calls[1].args;
  assert.ok(!args.includes('-1'));
  assert.equal(args[args.indexOf('-c')+1], 'begin');
  assert.equal(args[args.length - 1], 'rollback');
  assert.match(out.join('\n'), /rolled back/);
});

test('migrate: a NOT VALID notice is surfaced; a psql failure is loud', () => {
  const notice = 'psql:...: NOTICE:  TASKS-MIGRATION: constraint tasks_title_max_80 left NOT VALID (still enforced on new writes); existing rows failing it: abc';
  const out = [];
  runMigrate(['--apply-live'], { env: FULL, psql: fakePsql([{ stdout: 'true,true' }, { stderr: notice }]), out: (s) => out.push(s), err: () => {} });
  assert.match(out.join('\n'), /1 constraint\(s\) left NOT VALID/);
  const errs = [];
  const code = runMigrate(['--apply-live'], { env: FULL, psql: fakePsql([{ stdout: 'true,true' }, { status: 3, stderr: 'ERROR: x' }]), out: () => {}, err: (s) => errs.push(s) });
  assert.equal(code, 1);
  assert.match(errs.join('\n'), /Nothing was committed/);
});

test('migrate (QC Finding 5): --apply-live and --rehearse REFUSE a local target, and run nothing', () => {
  for (const flag of ['--apply-live', '--rehearse']) {
    const psql = fakePsql([]);
    const errs = [];
    const code = runMigrate([flag], { env: { ...FULL, EVRYN_TASKS_LOCAL_PG: 'postgresql://postgres@127.0.0.1:5999/x' }, psql, out: () => {}, err: (s) => errs.push(s) });
    assert.equal(code, 2, flag);
    assert.equal(psql.calls.length, 0);
    assert.match(errs.join('\n'), /is for the live Evryn Team database/);
  }
});

test('snapshot (QC Finding 4): the first line names the target, with no port or credential', () => {
  let live = '';
  runSnapshot([], { env: FULL, psql: fakePsql([{ stdout: 'x\n' }]), out: (s) => (live += s) });
  assert.equal(live.split('\n')[0], `# target=evryn-team ref=${TEAM_REF} via session pooler`);
  let local = '';
  runSnapshot([], { env: { EVRYN_TASKS_LOCAL_PG: 'postgresql://postgres@127.0.0.1:5999/x' }, psql: fakePsql([{ stdout: 'x\n' }]), out: (s) => (local += s) });
  assert.equal(local.split('\n')[0], '# target=local-loopback');
  assert.ok(!`${live}${local}`.includes(PASSWORD) && !local.includes('5999'));
});

test('migrate: unknown flags are usage errors', () => {
  assert.equal(runMigrate(['--yolo'], { env: FULL, psql: fakePsql([]), out: () => {}, err: () => {} }), 2);
});

// ---------------------------------------------------------------------------
// schema-snapshot.mjs
// ---------------------------------------------------------------------------

test('snapshot: read-only transaction, SQL on stdin, nothing in argv but flags', () => {
  const psql = fakePsql([{ stdout: 'table tasks: owner=postgres\n\n' }]);
  let printed = '';
  assert.equal(runSnapshot([], { env: FULL, psql, out: (s) => (printed += s) }), 0);
  const { args, opts } = psql.calls[0];
  assert.deepEqual(args, ['-q', '-A', '-t', '-f', '-']);
  assert.match(opts.input, /^\s*begin transaction read only;/);
  assert.match(opts.input, /rollback;\s*$/);
  // No line may BEGIN a write statement (the word "grant" appears inside format strings, legitimately).
  assert.doesNotMatch(opts.input, /^\s*(insert|update|delete|alter|create|drop|grant|revoke|truncate|set)\b/im);
  assert.equal(printed, `# target=evryn-team ref=${TEAM_REF} via session pooler\ntable tasks: owner=postgres\n`);
});
