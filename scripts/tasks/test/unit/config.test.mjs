import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { FAKE_KEY, TASKS_DIR, TEAM_URL, fakeJwt } from '../helpers.mjs';
import {
  ConfigError,
  ENV_FILES,
  TEAM_REF,
  inTestRun,
  loadVars,
  localPgTarget,
  parseEnvText,
  pgTarget,
  readEnvFile,
  redact,
  teamRestTarget,
} from '../../lib/config.mjs';

// ---------------------------------------------------------------------------
// The tripwire: no test run may read a real .env (Soren, 14:53)
// ---------------------------------------------------------------------------

test('this process is recognized as a test run', () => {
  assert.equal(inTestRun(), true);
});

test('TRIPWIRE: reading the real team .env inside a test run throws BEFORE touching the file', () => {
  let touched = false;
  const spy = () => {
    touched = true;
    return 'EVRYN_TEAM_SUPABASE_URL=x';
  };
  assert.throws(() => readEnvFile(ENV_FILES.team, { readFile: spy }), /TEST TRIPWIRE/);
  assert.equal(touched, false, 'the reader was called — the file would have been read');
});

test('TRIPWIRE: the meta .env (LINEAR_API_KEY) is guarded the same way', () => {
  assert.throws(() => readEnvFile(ENV_FILES.meta, { readFile: () => '' }), /TEST TRIPWIRE/);
});

test('TRIPWIRE: loadVars without an injected env goes through the tripwire', () => {
  const saved = process.env.EVRYN_TASKS_ENV_FROM_PROCESS;
  delete process.env.EVRYN_TASKS_ENV_FROM_PROCESS;
  try {
    assert.throws(() => loadVars(['EVRYN_TEAM_SUPABASE_URL'], { file: ENV_FILES.team }), /TEST TRIPWIRE/);
  } finally {
    if (saved !== undefined) process.env.EVRYN_TASKS_ENV_FROM_PROCESS = saved;
  }
});

test('TRIPWIRE end-to-end: every script, spawned in a test run without an injected env, trips instead of reading .env', () => {
  const cases = [
    ['tasks.mjs', ['pull', '--as', 'ac']],
    ['check.mjs', []],
    ['migrate.mjs', ['--rehearse']],
    ['schema-snapshot.mjs', []],
    ['import-linear.mjs', []],
  ];
  for (const [script, args] of cases) {
    const env = { ...process.env, EVRYN_TASKS_TEST_MODE: '1' };
    delete env.EVRYN_TASKS_ENV_FROM_PROCESS;
    for (const k of Object.keys(env)) if (k.startsWith('EVRYN_TEAM_') || k === 'LINEAR_API_KEY' || k === 'EVRYN_TASKS_LOCAL_PG') delete env[k];
    // SEALED-EXEC: followed 2026-08-11 — process.execPath, the node binary already running this test; no network.
    const r = spawnSync(process.execPath, [join(TASKS_DIR, script), ...args], { encoding: 'utf8', env, windowsHide: true });
    assert.notEqual(r.status, 0, `${script} exited 0`);
    assert.match(`${r.stdout}${r.stderr}`, /TEST TRIPWIRE/, `${script} did not trip: ${r.stdout}${r.stderr}`);
  }
});

test('an injected env is the ONLY source: no file is consulted', () => {
  const vars = loadVars(['A', 'B'], { env: { A: ' x ', B: '' } });
  assert.deepEqual(vars, { A: 'x', B: undefined });
});

test('parseEnvText handles quotes, CRLF, export and comments', () => {
  assert.deepEqual(parseEnvText('# c\r\nA="1"\r\nexport B=two\nC = \'3\'\nnot a line\n'), { A: '1', B: 'two', C: '3' });
});

// ---------------------------------------------------------------------------
// R5: the team project only
// ---------------------------------------------------------------------------

const good = { EVRYN_TEAM_SUPABASE_URL: TEAM_URL, EVRYN_TEAM_SUPABASE_SECRET_KEY: FAKE_KEY };

test('R5: the team URL and a secret key are accepted; the key goes nowhere but the target', () => {
  const t = teamRestTarget(good);
  assert.equal(t.base, `https://${TEAM_REF}.supabase.co`);
  assert.equal(t.keyKind, 'secret');
});

test('R5: a product URL is refused, and the refusal prints no value', () => {
  const product = 'https://abcdefghijklmnopqrst.supabase.co';
  let msg = '';
  try {
    teamRestTarget({ ...good, EVRYN_TEAM_SUPABASE_URL: product });
  } catch (e) {
    assert.ok(e instanceof ConfigError);
    msg = e.message;
  }
  assert.match(msg, /does not point at the Evryn Team project/);
  assert.ok(!msg.includes('abcdefghijklmnopqrst'));
  assert.ok(!msg.includes(FAKE_KEY));
});

test('R5: look-alike hosts are refused (subdomain trick, http, other port, path trick)', () => {
  for (const url of [
    `https://${TEAM_REF}.supabase.co.evil.example`,
    `http://${TEAM_REF}.supabase.co`,
    `https://${TEAM_REF}.supabase.co:8443`,
    `https://evil.example/${TEAM_REF}.supabase.co`,
    'not a url',
  ]) {
    assert.throws(() => teamRestTarget({ ...good, EVRYN_TEAM_SUPABASE_URL: url }), ConfigError, url);
  }
});

test('R5: key kinds — publishable refused; legacy anon refused; legacy for another project refused; legacy team service_role accepted', () => {
  assert.throws(() => teamRestTarget({ ...good, EVRYN_TEAM_SUPABASE_SECRET_KEY: 'sb_' + 'publishable_abc' }), /publishable/);
  assert.throws(() => teamRestTarget({ ...good, EVRYN_TEAM_SUPABASE_SECRET_KEY: fakeJwt({ role: 'anon', ref: TEAM_REF }) }), /role other than service_role/);
  assert.throws(
    () => teamRestTarget({ ...good, EVRYN_TEAM_SUPABASE_SECRET_KEY: fakeJwt({ role: 'service_role', ref: 'productprojectref000' }) }),
    /different project/,
  );
  assert.throws(() => teamRestTarget({ ...good, EVRYN_TEAM_SUPABASE_SECRET_KEY: 'garbage' }), /not a recognizable/);
  assert.equal(teamRestTarget({ ...good, EVRYN_TEAM_SUPABASE_SECRET_KEY: fakeJwt({ role: 'service_role', ref: TEAM_REF }) }).keyKind, 'legacy-service-role');
});

test('a missing variable is NAMED, and nothing else is printed', () => {
  assert.throws(() => teamRestTarget({ EVRYN_TEAM_SUPABASE_URL: TEAM_URL }), /missing variable: EVRYN_TEAM_SUPABASE_SECRET_KEY/);
  assert.throws(() => pgTarget({}), /missing variable: EVRYN_TEAM_DB_PASSWORD/);
});

test('R5 for Postgres: the default target is the hard-coded team pooler with the team user', () => {
  const t = pgTarget({ EVRYN_TEAM_DB_PASSWORD: 'pw-123456' });
  assert.equal(t.host, 'aws-1-us-west-2.pooler.supabase.com');
  assert.equal(t.user, `postgres.${TEAM_REF}`);
  assert.equal(t.sslmode, 'require');
});

test('the local-test channel accepts loopback only', () => {
  assert.equal(localPgTarget('postgresql://postgres@127.0.0.1:55432/x').port, '55432');
  assert.equal(localPgTarget('postgresql://postgres@localhost/x').host, 'localhost');
  for (const bad of ['postgresql://postgres@db.abcdefghijklmnopqrst.supabase.co:5432/postgres', 'postgresql://p@10.0.0.5/x', 'https://127.0.0.1/']) {
    assert.throws(() => localPgTarget(bad), ConfigError, bad);
  }
});

test('redact strips known secrets and URI-shaped text', () => {
  assert.equal(redact(`a ${FAKE_KEY} b postgresql://u:p@h/db c`, [FAKE_KEY]), 'a <REDACTED> b <REDACTED-URI> c');
});
