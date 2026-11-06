import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FAKE_KEY, TEST_ENV, fakeJwt, jsonResponse } from '../helpers.mjs';
import { runCheck } from '../../check.mjs';
import { runMigrate } from '../../migrate.mjs';
import { SNAPSHOT_SQL, runSnapshot, snapshotQuery } from '../../schema-snapshot.mjs';
import { TEAM_REF } from '../../lib/config.mjs';

const LOCAL = { EVRYN_TASKS_LOCAL_PG: 'postgresql://postgres@127.0.0.1:5999/x' };

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
// check.mjs — API only, no password
// ---------------------------------------------------------------------------

test('check: presence, ref match, key kind, row count, CHECK OK — no password asked for, no value printed', async () => {
  const lines = [];
  const code = await runCheck({ env: TEST_ENV, fetchImpl: countFetch, out: (s) => lines.push(s) });
  const text = lines.join('\n');
  assert.equal(code, 0, text);
  assert.match(text, /EVRYN_TEAM_SUPABASE_URL: present/);
  assert.match(text, new RegExp(`project ref in URL: matches ${TEAM_REF}`));
  assert.match(text, /key kind: secret/);
  assert.match(text, /tasks rows \(PostgREST, secret key\): 3/);
  assert.doesNotMatch(text, /PASSWORD|pooler/i, 'the password era is over');
  assert.ok(!text.includes(FAKE_KEY));
});

test('check: missing variables named; a product URL is a mismatch and is never contacted', async () => {
  const lines = [];
  let fetched = false;
  const code = await runCheck({
    env: { EVRYN_TEAM_SUPABASE_URL: 'https://productref1234567890.supabase.co' },
    fetchImpl: async () => {
      fetched = true;
      return countFetch();
    },
    out: (s) => lines.push(s),
  });
  const text = lines.join('\n');
  assert.equal(code, 1);
  assert.match(text, /EVRYN_TEAM_SUPABASE_SECRET_KEY: MISSING/);
  assert.match(text, /DOES NOT MATCH/);
  assert.equal(fetched, false);
  assert.ok(!text.includes('productref1234567890'));
});

test('check: a publishable key is refused; a legacy service_role JWT is classified', async () => {
  const a = [];
  assert.equal(await runCheck({ env: { ...TEST_ENV, EVRYN_TEAM_SUPABASE_SECRET_KEY: 'sb_' + 'publishable_zzz' }, fetchImpl: countFetch, out: (s) => a.push(s) }), 1);
  assert.match(a.join('\n'), /key kind: REFUSED — .*publishable/);
  const b = [];
  await runCheck({ env: { ...TEST_ENV, EVRYN_TEAM_SUPABASE_SECRET_KEY: fakeJwt({ role: 'service_role', ref: TEAM_REF }) }, fetchImpl: countFetch, out: (s) => b.push(s) });
  assert.match(b.join('\n'), /key kind: legacy-service-role/);
});

/** A fake PostgREST that answers like an UN-migrated or a migrated schema. */
function schemaFetch({ migrated }) {
  return async (url) => {
    const u = new URL(url);
    if (u.pathname.endsWith('/tasks') && u.searchParams.get('select') === 'short_id') {
      return migrated ? jsonResponse(200, []) : jsonResponse(400, { code: '42703', message: 'column tasks.short_id does not exist' });
    }
    if (u.pathname.endsWith('/task_history')) {
      return migrated ? jsonResponse(200, []) : jsonResponse(404, { code: 'PGRST205', message: "Could not find the table 'public.task_history' in the schema cache" });
    }
    return countFetch();
  };
}

test('check --absent: after the dry run, both probes report absent — and the output says it is ADVISORY, not the guard', async () => {
  const lines = [];
  const code = await runCheck({ argv: ['--absent'], env: TEST_ENV, fetchImpl: schemaFetch({ migrated: false }), out: (s) => lines.push(s) });
  const text = lines.join('\n');
  assert.equal(code, 0, text);
  assert.match(text, /ADVISORY — PostgREST caches the schema; the binding guard is Paste 2's before-assertions/);
  assert.match(text, /tasks\.short_id column: absent, as expected \[42703\]/);
  assert.match(text, /task_history table: absent, as expected \[PGRST205\]/);
});

test('check --absent: if the new objects are visible, it FAILS and says not to run Paste 2', async () => {
  const lines = [];
  const code = await runCheck({ argv: ['--absent'], env: TEST_ENV, fetchImpl: schemaFetch({ migrated: true }), out: (s) => lines.push(s) });
  assert.equal(code, 1);
  assert.match(lines.join('\n'), /PRESENT — .*Do not run Paste 2/);
});

// ---------------------------------------------------------------------------
// migrate.mjs — local loopback clusters only
// ---------------------------------------------------------------------------

test('migrate: with no local cluster it REFUSES and runs nothing (there is no live target, and no password)', () => {
  const psql = fakePsql([]);
  const errs = [];
  const code = runMigrate([], { env: { ...TEST_ENV, EVRYN_TEAM_DB_PASSWORD: 'pw-old-design' }, psql, out: () => {}, err: (s) => errs.push(s) });
  assert.equal(code, 1);
  assert.equal(psql.calls.length, 0);
  assert.match(errs.join('\n'), /EVRYN_TASKS_LOCAL_PG is not set/);
});

test('migrate: the old live flags are gone — any argument is a usage error that points at the paste', () => {
  for (const flag of ['--apply-live', '--rehearse', '--yolo']) {
    const errs = [];
    assert.equal(runMigrate([flag], { env: LOCAL, psql: fakePsql([]), out: () => {}, err: (s) => errs.push(s) }), 2, flag);
    assert.match(errs.join('\n'), /migrated only by Justin's paste/);
  }
});

test('migrate: refuses unless runtime 003 is present', () => {
  const psql = fakePsql([{ stdout: 'false,true\n' }]);
  const errs = [];
  assert.equal(runMigrate([], { env: LOCAL, psql, out: () => {}, err: (s) => errs.push(s) }), 1);
  assert.equal(psql.calls.length, 1, 'went past the prerequisite check');
  assert.match(errs.join('\n'), /runtime migration 003 is not present/);
});

test('migrate: one transaction (-1), every file in order, lock_timeout; NOT VALID surfaced; failure loud', () => {
  const psql = fakePsql([{ stdout: 'true,true\n' }, { stderr: '' }]);
  assert.equal(runMigrate([], { env: LOCAL, psql, out: () => {}, err: () => {} }), 0);
  const args = psql.calls[1].args;
  assert.ok(args.includes('-1'));
  assert.ok(args.includes("set local lock_timeout = '5s'"));
  const files = args.filter((a, i) => args[i - 1] === '-f').map((f) => f.split(/[\\/]/).pop());
  // Locally, migrate.mjs applies EVERY migration (both change sets) in one transaction.
  assert.deepEqual(files, ['001_tasks_columns.sql', '002_task_history.sql', '003_task_triggers.sql', '004_schema_snapshot_fn.sql', '005_linear_cutover.sql']);
  assert.equal(psql.calls[1].target.host, '127.0.0.1');

  const notice = 'NOTICE:  TASKS-MIGRATION: constraint tasks_title_max_80 left NOT VALID (still enforced on new writes); existing rows failing it: abc';
  const out = [];
  runMigrate([], { env: LOCAL, psql: fakePsql([{ stdout: 'true,true' }, { stderr: notice }]), out: (s) => out.push(s), err: () => {} });
  assert.match(out.join('\n'), /1 constraint\(s\) left NOT VALID/);
  const errs = [];
  assert.equal(runMigrate([], { env: LOCAL, psql: fakePsql([{ stdout: 'true,true' }, { status: 3, stderr: 'ERROR: x' }]), out: () => {}, err: (s) => errs.push(s) }), 1);
  assert.match(errs.join('\n'), /Nothing was committed/);
});

// ---------------------------------------------------------------------------
// schema-snapshot.mjs
// ---------------------------------------------------------------------------

test('snapshot: ONE source — the query is extracted from migration 004\'s function body, run read-only', async () => {
  const q = snapshotQuery();
  assert.match(q, /^select concat_ws\(E'\\n',/);
  // search_path '' as inside the function, so the deparsers qualify names identically.
  assert.equal(SNAPSHOT_SQL, `begin transaction read only;\nset local search_path = '';\n${q};\nrollback;\n`);
  // No line of the query may BEGIN a write statement (the word "grant" appears inside format strings, legitimately).
  assert.doesNotMatch(q, /^\s*(insert|update|delete|alter|create|drop|grant|revoke|truncate|set)\b/im);
});

test('snapshot (local): SQL on stdin, flags-only argv, target line first with no port', async () => {
  const psql = fakePsql([{ stdout: 'table tasks: owner=postgres\n\n' }]);
  let printed = '';
  assert.equal(await runSnapshot([], { env: LOCAL, psql, out: (s) => (printed += s) }), 0);
  const { args, opts } = psql.calls[0];
  assert.deepEqual(args, ['-q', '-A', '-t', '-f', '-']);
  assert.equal(opts.input, SNAPSHOT_SQL);
  assert.equal(printed, '# target=local-loopback\ntable tasks: owner=postgres\n');
  assert.ok(!printed.includes('5999'));
});

test('snapshot (local): with no local cluster it refuses — there is no live psql path', async () => {
  const errs = [];
  assert.equal(await runSnapshot([], { env: TEST_ENV, psql: fakePsql([]), out: () => {}, err: (s) => errs.push(s) }), 1);
  assert.match(errs.join('\n'), /EVRYN_TASKS_LOCAL_PG is not set/);
});

test('snapshot --api: calls rpc/team_tasks_schema_snapshot with the secret key, prints the api target line, never the key', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return jsonResponse(200, '# server_version=17.6\ntable tasks: owner=postgres');
  };
  let printed = '';
  assert.equal(await runSnapshot(['--api'], { env: TEST_ENV, fetchImpl, out: (s) => (printed += s) }), 0);
  assert.equal(calls[0].url, `https://${TEAM_REF}.supabase.co/rest/v1/rpc/team_tasks_schema_snapshot`);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(printed, `# target=evryn-team ref=${TEAM_REF} via api\n# server_version=17.6\ntable tasks: owner=postgres\n`);
  assert.ok(!printed.includes(FAKE_KEY));
});

test('snapshot --api: a product URL is refused before any request; a missing function says Paste 2 may not have run', async () => {
  let fetched = false;
  const errs = [];
  const code = await runSnapshot(['--api'], {
    env: { ...TEST_ENV, EVRYN_TEAM_SUPABASE_URL: 'https://productref1234567890.supabase.co' },
    fetchImpl: async () => {
      fetched = true;
      return jsonResponse(200, '');
    },
    out: () => {},
    err: (s) => errs.push(s),
  });
  assert.equal(code, 1);
  assert.equal(fetched, false);
  const errs2 = [];
  await runSnapshot(['--api'], { env: TEST_ENV, fetchImpl: async () => jsonResponse(404, { code: 'PGRST202', message: 'Could not find the function' }), out: () => {}, err: (s) => errs2.push(s) });
  assert.match(errs2.join('\n'), /Paste 2 has not been run/);
});
