/**
 * local-postgres.test.mjs — the acceptance suite: every R1–R8 rule proven AT THE DATABASE, against
 * a throwaway local PostgreSQL 17 cluster shaped like the Evryn Team project.
 *
 * WHY LOCAL: task_history is append-only, so every test row written live would be permanent. The
 * refusals are proven here; Tasks AC runs only refused-and-rowless checks live, plus one real row.
 *
 * FAITHFULNESS (Soren's condition — a local test only certifies against a faithful copy):
 *   - roles as Supabase has them: service_role WITH BYPASSRLS; anon and authenticated WITHOUT it;
 *   - Supabase's PRE-2026-10-30 default privileges are in force when runtime 003 creates `tasks`,
 *     so tasks carries table grants to anon/authenticated and only RLS stops them (asserted);
 *   - those defaults are then REMOVED before our migrations run, modelling the post-10/30 rule that
 *     new objects get no default grants — so our explicit grants are what is tested;
 *   - PostgREST is simulated the way it runs a request: `set local role <role>` plus
 *     `set local request.headers = '<json>'` inside one transaction.
 * The schema snapshots before and after migrating are compared with committed golden files, which
 * are what Tasks AC diffs the live snapshots against.
 *
 * Run:  node --test scripts/tasks/test/acceptance/
 *       EVRYN_TASKS_UPDATE_SNAPSHOTS=1 to (re)write the golden snapshot files.
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import '../helpers.mjs';
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TASKS_DIR } from '../helpers.mjs';
import { CODE_ROOT } from '../../lib/config.mjs';
import { findPgTool, pgEnv, runPsql } from '../../lib/pg.mjs';
import { buildPastes, changeSet } from '../../make-paste.mjs';
import { splitSql } from '../../lib/sqlsplit.mjs';
import { pgToolsAvailable, startCluster } from './cluster.mjs';

const RUNTIME_003 =
  process.env.EVRYN_TASKS_RUNTIME_003 ?? join(CODE_ROOT, 'evryn-team-runtime', 'migrations', '003_tasks_proposals.sql');
const FIXTURES = join(TASKS_DIR, 'test', 'fixtures');
const available = pgToolsAvailable() && existsSync(RUNTIME_003);

let cluster;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const hdr = (actor) => JSON.stringify({ 'x-evryn-actor': actor });

/**
 * Run SQL as a simulated PostgREST request (or as the owner when role is null). `verbose` makes psql print
 * the SQLSTATE in front of the message ("ERROR:  ET008: …"), so a test can assert on the code itself.
 */
function req(db, body, { role = 'service_role', header, evrynActor, verbose = false } = {}) {
  const lines = verbose ? ['\\set VERBOSITY verbose', 'begin;'] : ['begin;'];
  if (role) lines.push(`set local role ${role};`);
  if (header !== undefined) lines.push(`set local request.headers = ${lit(header)};`);
  if (evrynActor !== undefined) lines.push(`set local evryn.actor = ${lit(evrynActor)};`);
  lines.push(body, 'commit;');
  return cluster.psql(db, lines.join('\n'));
}

function ok(res) {
  assert.equal(res.status, 0, `expected success, got: ${res.stderr}`);
  return res.stdout.trim();
}

function refused(res, pattern) {
  assert.notEqual(res.status, 0, `expected a refusal, but it succeeded: ${res.stdout}`);
  assert.match(res.stderr, pattern);
}

/** As the owner, with no simulated request: read-only queries. */
function scalar(db, sql) {
  return ok(cluster.psql(db, sql));
}

let seq = 0;
const uniq = (p) => `${p}-${process.pid}-${(seq += 1)}`;

/** Insert a task as `actor` and return its uuid. */
function seed(db, { title = uniq('seed'), status = 'open', raci = '{"r":"lucas","a":"justin"}', extra = '' , actor = 'ac'} = {}) {
  const cols = extra ? `, ${extra.split('=')[0]}` : '';
  const vals = extra ? `, ${extra.split('=').slice(1).join('=')}` : '';
  const out = ok(
    req(db, `insert into public.tasks (title, status, raci${cols}) values (${lit(title)}, ${lit(status)}, ${lit(raci)}::jsonb${vals}) returning id;`, {
      header: hdr(actor),
    }),
  );
  return out.split('\n').pop();
}

/**
 * A psql session held OPEN across other sessions' work, for concurrency tests. `send` writes SQL and
 * waits until psql has executed it (a `\echo` marker comes back); `finish` writes the rest, closes
 * stdin and resolves with { status, stdout, stderr }.
 */
function openSession(db) {
  const psql = findPgTool('psql');
  // SEALED-EXEC: followed 2026-08-11 — psql is an absolute path to the installed PostgreSQL 17 binary (findPgTool never consults PATH or a registry); no network.
  const child = spawn(psql, ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'], { env: pgEnv(cluster.targetFor(db)), windowsHide: true });
  let stdout = '';
  let stderr = '';
  let waiter = null;
  child.stdout.on('data', (d) => {
    stdout += d;
    if (waiter && stdout.includes(waiter.marker)) {
      const w = waiter;
      waiter = null;
      w.resolve();
    }
  });
  child.stderr.on('data', (d) => {
    stderr += d;
  });
  let n = 0;
  return {
    send(sql) {
      n += 1;
      const marker = `__READY_${n}__`;
      return new Promise((resolve, reject) => {
        waiter = { marker, resolve };
        child.once('exit', () => reject(new Error(`psql exited early: ${stderr}`)));
        child.stdin.write(`${sql}\n\\echo ${marker}\n`);
      });
    },
    finish(sql) {
      return new Promise((resolve) => {
        child.on('close', (status) => resolve({ status, stdout, stderr }));
        child.stdin.end(`${sql}\n`);
      });
    },
  };
}

function historyCount(db, id) {
  return Number(scalar(db, `select count(*) from public.task_history where task_id = ${lit(id)};`));
}

function runScript(script, db, args = []) {
  // SEALED-EXEC: followed 2026-08-11 — process.execPath is the absolute path of the node binary already running this suite; no resolution, no network.
  return spawnSync(process.execPath, [join(TASKS_DIR, script), ...args], {
    encoding: 'utf8',
    windowsHide: true,
    env: {
      ...process.env,
      EVRYN_TASKS_TEST_MODE: '1',
      EVRYN_TASKS_ENV_FROM_PROCESS: '1',
      EVRYN_TASKS_LOCAL_PG: cluster.urlFor(db),
    },
  });
}

/**
 * Drop the lines that legitimately differ by default-privilege MODE (`default-acl`) or by run
 * (`#` headers other than the target). What remains is "our objects": the part that must be
 * IDENTICAL in both modes (QC Finding 1).
 */
function ourObjects(snapshot) {
  return snapshot
    .split(/\r?\n/)
    .filter((l) => l !== '' && !l.startsWith('default-acl ') && !/^# server_version/.test(l))
    .join('\n');
}

function golden(name, rawText) {
  // The golden files hold our objects AND the server-version lines (QC N3: snapshot-compare needs the
  // LOCAL version to decide whether a MAINTAIN difference is a version artifact). They drop only the
  // mode-dependent default-acl lines, so ONE committed file serves both modes. The equality below
  // ignores the version lines, so the file stays valid on a machine with another PostgreSQL 17 minor.
  const keep = (s) => s.split(/\r?\n/).filter((l) => l !== '' && !l.startsWith('default-acl ')).join('\n');
  const text = `${keep(rawText)}\n`;
  const path = join(FIXTURES, name);
  if (process.env.EVRYN_TASKS_UPDATE_SNAPSHOTS === '1') {
    writeFileSync(path, text, 'utf8');
    return;
  }
  // A missing golden file FAILS rather than silently regenerating: a guard that rewrites its own
  // expectation can never go red.
  assert.ok(existsSync(path), `${name} is missing — rerun with EVRYN_TASKS_UPDATE_SNAPSHOTS=1 and review the diff`);
  const committed = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  assert.match(committed, /^# server_version_num=\d+$/m, `${name} lost its server_version_num line (QC N3)`);
  assert.equal(ourObjects(text), ourObjects(committed), `${name} differs from the committed golden snapshot`);
}

const SUPABASE_DEFAULTS_ON = `
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;`;
const SUPABASE_DEFAULTS_OFF = `
alter default privileges in schema public revoke all on tables from anon, authenticated, service_role;
alter default privileges in schema public revoke all on sequences from anon, authenticated, service_role;
alter default privileges in schema public revoke all on functions from anon, authenticated, service_role;`;

/**
 * THE TWO MODES (QC Finding 1). We do not know whether the live project still has Supabase's old
 * default privileges, so the suite runs in either:
 *   EVRYN_TASKS_DEFAULTS=off (default) — the defaults were removed before our migration;
 *   EVRYN_TASKS_DEFAULTS=on            — they are still in force when our migration runs.
 * Every behavioural test must pass in BOTH, and every run also builds a database in the OTHER mode and
 * proves the after-snapshot of our objects is identical. (ALTER DEFAULT PRIVILEGES appears ONLY here,
 * to model the platform; the migrations never use it.)
 */
const MODE = process.env.EVRYN_TASKS_DEFAULTS === 'on' ? 'on' : 'off';
const OTHER_MODE = MODE === 'on' ? 'off' : 'on';

/** Build a database the way the live one was built: defaults on → runtime 003 → (old rows) → defaults off unless mode 'on'. */
function prepareDb(db, { legacyRows = '', defaults = MODE } = {}) {
  ok(cluster.psql('postgres', `create database ${db};`));
  ok(cluster.psql(db, SUPABASE_DEFAULTS_ON));
  ok(cluster.psql(db, readFileSync(RUNTIME_003, 'utf8')));
  if (legacyRows) ok(cluster.psql(db, legacyRows));
  if (defaults === 'off') ok(cluster.psql(db, SUPABASE_DEFAULTS_OFF));
}

// ---------------------------------------------------------------------------
// setup / teardown
// ---------------------------------------------------------------------------

const DB = 'tasks_clean';
let snapBefore;
let migrateOut;

before(async () => {
  if (!available) return;
  cluster = await startCluster();
  ok(
    cluster.psql(
      'postgres',
      `create role anon nologin noinherit;
       create role authenticated nologin noinherit;
       create role service_role nologin noinherit bypassrls;
       create role authenticator login noinherit;
       grant anon, authenticated, service_role to authenticator;`,
    ),
  );
  prepareDb(DB);
  const s = runScript('schema-snapshot.mjs', DB);
  assert.equal(s.status, 0, s.stderr);
  snapBefore = s.stdout;
  const m = runScript('migrate.mjs', DB);
  assert.equal(m.status, 0, `migrate failed: ${m.stdout}\n${m.stderr}`);
  migrateOut = m.stdout;
});

after(() => {
  if (cluster) cluster.stop();
});

const suite = available ? describe : describe.skip;

// An acceptance suite that cannot run must not look green: a silent skip reads exactly like a pass.
// It FAILS unless the caller has said, explicitly, that skipping is acceptable on this machine.
test('the acceptance suite actually ran (PostgreSQL 17 tools and runtime 003 were found)', () => {
  if (available || process.env.EVRYN_TASKS_ACCEPTANCE_OPTIONAL === '1') return;
  assert.fail(
    `acceptance suite SKIPPED: ${pgToolsAvailable() ? '' : 'PostgreSQL client/server tools not found (set EVRYN_TASKS_PG_BIN). '}` +
      `${existsSync(RUNTIME_003) ? '' : `runtime migration not found at ${RUNTIME_003} (set EVRYN_TASKS_RUNTIME_003). `}` +
      'Set EVRYN_TASKS_ACCEPTANCE_OPTIONAL=1 only if skipping is genuinely acceptable here.',
  );
});

// ---------------------------------------------------------------------------
// The copy is faithful
// ---------------------------------------------------------------------------

suite('local copy is faithful to the Supabase shape', () => {
  test('service_role has BYPASSRLS; anon and authenticated do not', () => {
    assert.equal(scalar(DB, `select string_agg(rolname || '=' || rolbypassrls, ',' order by rolname) from pg_roles where rolname in ('anon','authenticated','service_role');`),
      'anon=false,authenticated=false,service_role=true');
  });

  test('tasks was born with Supabase\'s default table grants to anon and authenticated (only RLS stops them)', () => {
    assert.match(snapBefore, /^grant tasks: anon INSERT$/m);
    assert.match(snapBefore, /^grant tasks: anon SELECT$/m);
    assert.match(snapBefore, /^grant tasks: authenticated SELECT$/m);
    assert.match(snapBefore, /^table tasks: owner=postgres$/m);
    assert.match(snapBefore, /^rls tasks: enabled=true forced=false$/m);
  });

  test('the migration did NOT revoke tasks\' existing grants (outside the go)', () => {
    const after = ok(runScript('schema-snapshot.mjs', DB));
    for (const line of snapBefore.split('\n').filter((l) => l.startsWith('grant tasks:'))) {
      assert.ok(after.includes(line), `grant line lost: ${line}`);
    }
  });

  test('golden snapshots: before and after migrating (our objects; identical in both modes)', () => {
    golden('local-snapshot-before.txt', snapBefore);
    golden('local-snapshot-after.txt', ok(runScript('schema-snapshot.mjs', DB)));
  });

  test(`QC Finding 1: the after-snapshot of our objects is IDENTICAL with Supabase's defaults ${MODE} (this run) and ${OTHER_MODE}`, (t) => {
    const other = `tasks_mode_${OTHER_MODE}`;
    prepareDb(other, { defaults: OTHER_MODE });
    const m = runScript('migrate.mjs', other);
    assert.equal(m.status, 0, m.stderr);
    const mine = ourObjects(ok(runScript('schema-snapshot.mjs', DB)));
    const theirs = ourObjects(ok(runScript('schema-snapshot.mjs', other)));
    assert.equal(mine, theirs, 'our objects differ between the two default-privilege modes');
    // ...while the default privileges themselves DO differ, so the test is not vacuous.
    const acl = (db) => ok(runScript('schema-snapshot.mjs', db)).split('\n').filter((l) => l.startsWith('default-acl ')).join('\n');
    assert.notEqual(acl(DB), acl(other), 'the two modes did not actually differ in default privileges');
    t.diagnostic(`mode ${MODE} vs ${OTHER_MODE}: ${mine.split('\n').length} object lines identical`);
  });

  test('QC Finding 6: public.proposals is unchanged by the migration (columns, constraints, triggers, grants, RLS)', () => {
    const proposals = (s) => s.split(/\r?\n/).filter((l) => /^(table|rls|column|constraint|index|trigger|policy|grant) proposals[ .:]/.test(l)).join('\n');
    const before = proposals(snapBefore);
    assert.match(before, /^column proposals #01 id uuid/m, 'proposals is not in the snapshot at all');
    assert.equal(proposals(ok(runScript('schema-snapshot.mjs', DB))), before);
  });
});

// ---------------------------------------------------------------------------
// migrate.mjs itself
// ---------------------------------------------------------------------------

suite('migrate.mjs', () => {
  test('applied all three files on a clean table and validated every constraint', () => {
    assert.match(migrateOut, /001_tasks_columns\.sql/);
    assert.match(migrateOut, /003_task_triggers\.sql/);
    assert.doesNotMatch(migrateOut, /NOT VALID/);
    assert.equal(scalar(DB, `select count(*) from pg_constraint where conrelid = 'public.tasks'::regclass and not convalidated;`), '0');
  });

  test('re-applying is idempotent: succeeds and leaves the schema identical', () => {
    const before = ok(runScript('schema-snapshot.mjs', DB));
    const again = runScript('migrate.mjs', DB);
    assert.equal(again.status, 0, again.stderr);
    assert.equal(ok(runScript('schema-snapshot.mjs', DB)), before);
  });

  test('refuses when runtime 003 is absent', () => {
    ok(cluster.psql('postgres', 'create database tasks_empty;'));
    const r = runScript('migrate.mjs', 'tasks_empty');
    assert.equal(r.status, 1);
    assert.match(r.stderr, /runtime migration 003 is not present/);
    assert.equal(scalar('tasks_empty', `select count(*) from pg_class where relname in ('tasks','task_history');`), '0');
  });

  test('refuses a non-loopback EVRYN_TASKS_LOCAL_PG', () => {
    // SEALED-EXEC: followed 2026-08-11 — process.execPath, the node binary already running; no network.
    const r = spawnSync(process.execPath, [join(TASKS_DIR, 'migrate.mjs')], {
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, EVRYN_TASKS_ENV_FROM_PROCESS: '1', EVRYN_TASKS_LOCAL_PG: 'postgresql://postgres@db.example.com:5432/postgres' },
    });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /must point at a loopback host/);
  });

  test('existing rows that fail a rule: constraint left NOT VALID and reported; old rows unchanged; new writes still checked', () => {
    const LEG = 'tasks_legacy';
    const longTitle = 'L'.repeat(90);
    prepareDb(LEG, {
      legacyRows: `insert into public.tasks (title, status, raci) values (${lit(longTitle)}, 'todo', '{}'::jsonb);
                   insert into public.tasks (title, status, raci) values ('fine old row', 'proposed', '{"r":"lucas","a":"justin"}'::jsonb);`,
    });
    const snapshotOld = scalar(LEG, `select string_agg(id || '|' || title || '|' || status || '|' || raci::text || '|' || description || '|' || created_at || '|' || updated_at, E'\\n' order by title) from public.tasks;`);
    const m = runScript('migrate.mjs', LEG);
    assert.equal(m.status, 0, m.stderr);
    for (const c of ['tasks_status_allowed', 'tasks_title_max_80', 'tasks_one_owner']) {
      assert.match(m.stdout, new RegExp(`constraint ${c} left NOT VALID`));
    }
    assert.equal(
      scalar(LEG, `select string_agg(conname, ',' order by conname) from pg_constraint where conrelid = 'public.tasks'::regclass and not convalidated;`),
      'tasks_one_owner,tasks_status_allowed,tasks_title_max_80',
    );
    assert.equal(
      scalar(LEG, `select string_agg(id || '|' || title || '|' || status || '|' || raci::text || '|' || description || '|' || created_at || '|' || updated_at, E'\\n' order by title) from public.tasks;`),
      snapshotOld,
      'existing values changed',
    );
    assert.equal(scalar(LEG, `select count(*) from public.tasks where short_id is null;`), '0', 'old rows got short ids');
    refused(req(LEG, `insert into public.tasks (title, status, raci) values ('x', 'banana', '{"r":"lucas"}');`, { header: hdr('ac') }), /tasks_status_allowed/);
  });
});

// ---------------------------------------------------------------------------
// R1 — the actor
// ---------------------------------------------------------------------------

suite('R1 actor', () => {
  const insert = (title) => `insert into public.tasks (title, status, raci) values (${lit(title)}, 'open', '{"r":"lucas","a":"justin"}');`;

  test('no actor (no headers, no evryn.actor) → refused', () => {
    const t = uniq('noactor');
    const r = req(DB, insert(t));
    refused(r, /no actor/);
    // QC Finding 12: the psql hint recommends SET LOCAL inside a transaction, never a session-level SET.
    assert.match(r.stderr, /HINT: .*begin; set local evryn\.actor = '<name>'/);
    assert.equal(scalar(DB, `select count(*) from public.tasks where title = ${lit(t)};`), '0');
  });

  test('headers present without x-evryn-actor → refused', () => {
    refused(req(DB, insert(uniq('noactor')), { header: '{"accept":"application/json"}' }), /no actor/);
  });

  test('empty request.headers → refused cleanly, not a JSON error', () => {
    const r = req(DB, insert(uniq('empty')), { header: '' });
    refused(r, /no actor/);
    assert.doesNotMatch(r.stderr, /invalid input syntax for type json/);
  });

  test('malformed request.headers → treated as absent, not a JSON error', () => {
    const r = req(DB, insert(uniq('bad')), { header: '{not json' });
    refused(r, /no actor/);
    assert.doesNotMatch(r.stderr, /invalid input syntax/);
  });

  test('a malformed name is refused (shape of isSafeActorName)', () => {
    refused(req(DB, insert(uniq('shape')), { header: hdr('bad name!') }), /not a valid name/);
    refused(req(DB, insert(uniq('shape')), { header: hdr('x'.repeat(65)) }), /not a valid name/);
  });

  test('psql path: evryn.actor is accepted when no header is sent', () => {
    const t = uniq('psql');
    ok(req(DB, insert(t), { evrynActor: 'ac' }));
    assert.equal(scalar(DB, `select created_by from public.tasks where title = ${lit(t)};`), 'ac');
  });

  test('the header wins over evryn.actor', () => {
    const t = uniq('both');
    ok(req(DB, insert(t), { header: hdr('soren'), evrynActor: 'ac' }));
    assert.equal(scalar(DB, `select created_by from public.tasks where title = ${lit(t)};`), 'soren');
  });

  test('created_by comes from the request, not from the client\'s value', () => {
    const t = uniq('forge');
    ok(req(DB, `insert into public.tasks (title, status, raci, created_by) values (${lit(t)}, 'open', '{"r":"lucas"}', 'justin');`, { header: hdr('mira') }));
    assert.equal(scalar(DB, `select created_by from public.tasks where title = ${lit(t)};`), 'mira');
  });

  test('a raw update with no actor fails; with an off-roster actor it is written and flagged', () => {
    const id = seed(DB);
    refused(req(DB, `update public.tasks set status = 'blocked', note = 'r1' where id = ${lit(id)};`), /no actor/);
    ok(req(DB, `update public.tasks set status = 'blocked', note = 'r1' where id = ${lit(id)};`, { header: hdr('nobody-real') }));
    assert.equal(scalar(DB, `select status from public.tasks where id = ${lit(id)};`), 'blocked');
    assert.equal(scalar(DB, `select actor || ' ' || array_to_string(flags, ',') from public.task_history where task_id = ${lit(id)} order by id desc limit 1;`), 'nobody-real actor_off_roster');
  });

  test('an on-roster actor is not flagged', () => {
    const id = seed(DB, { actor: 'thea' });
    assert.equal(scalar(DB, `select cardinality(flags) from public.task_history where task_id = ${lit(id)};`), '0');
  });

  test('an off-roster owner is written and flagged; an off-roster addressed_to too', () => {
    const id = seed(DB, { raci: '{"r":"stranger","a":"justin"}', extra: `addressed_to='outsider'` });
    assert.equal(scalar(DB, `select array_to_string(flags, ',') from public.task_history where task_id = ${lit(id)};`), 'owner_off_roster,addressed_to_off_roster');
  });

  test('created_by, id and created_at are immutable', () => {
    const id = seed(DB);
    refused(req(DB, `update public.tasks set created_by = 'justin' where id = ${lit(id)};`, { header: hdr('ac') }), /created_by is immutable/);
    refused(req(DB, `update public.tasks set id = gen_random_uuid() where id = ${lit(id)};`, { header: hdr('ac') }), /id is immutable/);
    refused(req(DB, `update public.tasks set created_at = '2000-01-01' where id = ${lit(id)};`, { header: hdr('ac') }), /created_at is immutable/);
  });

  test('the frozen runtime\'s propose_work insert shape (no header) fails loudly', () => {
    refused(
      req(DB, `insert into public.tasks (title, description, status, raci) values ('a proposal', 'body', 'proposed', '{"r":"lucas","a":"justin"}');`),
      /no actor/,
    );
  });
});

// ---------------------------------------------------------------------------
// R2 — history
// ---------------------------------------------------------------------------

suite('R2 history', () => {
  test('an insert writes exactly one history row (op insert)', () => {
    const id = seed(DB, { actor: 'emma' });
    assert.equal(scalar(DB, `select count(*) || ' ' || min(op) || ' ' || min(actor) from public.task_history where task_id = ${lit(id)};`), '1 insert emma');
  });

  test('one update → exactly one history row, recording only the changed fields', () => {
    const id = seed(DB);
    const before = historyCount(DB, id);
    ok(req(DB, `update public.tasks set status = 'blocked', note = 'waiting on soren' where id = ${lit(id)};`, { header: hdr('lucas') }));
    assert.equal(historyCount(DB, id), before + 1);
    // 005: the note rides in task_history.note and is never a changed field
    assert.equal(
      scalar(DB, `select array_to_string(changed_fields, ',') || ' ' || old::text || ' ' || new::text || ' ' || note from public.task_history where task_id = ${lit(id)} order by id desc limit 1;`),
      'status {"status": "open"} {"status": "blocked"} waiting on soren',
    );
  });

  test('a no-change update writes no row and leaves updated_at alone', () => {
    const id = seed(DB);
    const before = historyCount(DB, id);
    const updatedBefore = scalar(DB, `select updated_at from public.tasks where id = ${lit(id)};`);
    ok(req(DB, `update public.tasks set title = title, status = status where id = ${lit(id)};`, { header: hdr('lucas') }));
    assert.equal(historyCount(DB, id), before);
    assert.equal(scalar(DB, `select updated_at from public.tasks where id = ${lit(id)};`), updatedBefore);
  });

  test('a client cannot forge updated_at (and doing so alone is a no-op)', () => {
    const id = seed(DB);
    const before = historyCount(DB, id);
    const updatedBefore = scalar(DB, `select updated_at from public.tasks where id = ${lit(id)};`);
    ok(req(DB, `update public.tasks set updated_at = '2000-01-01' where id = ${lit(id)};`, { header: hdr('lucas') }));
    assert.equal(historyCount(DB, id), before);
    assert.equal(scalar(DB, `select updated_at from public.tasks where id = ${lit(id)};`), updatedBefore);
  });

  test('a real change bumps updated_at', () => {
    const id = seed(DB);
    const updatedBefore = scalar(DB, `select updated_at from public.tasks where id = ${lit(id)};`);
    ok(req(DB, `update public.tasks set description = 'changed' where id = ${lit(id)};`, { header: hdr('lucas') }));
    assert.notEqual(scalar(DB, `select updated_at from public.tasks where id = ${lit(id)};`), updatedBefore);
  });

  test('a direct insert into history is refused — as service_role and as the owner', () => {
    const body = `insert into public.task_history (task_id, actor, op) values (gen_random_uuid(), 'ac', 'update');`;
    refused(req(DB, body, { header: hdr('ac') }), /history is written only by the database/);
    refused(req(DB, body, { role: null }), /history is written only by the database/);
  });

  test('update, delete and truncate on history are refused — as service_role (grants) and as the owner (trigger)', () => {
    seed(DB);
    refused(req(DB, `update public.task_history set actor = 'x';`), /permission denied for table task_history/);
    refused(req(DB, `delete from public.task_history;`), /permission denied for table task_history/);
    refused(req(DB, `truncate public.task_history;`), /permission denied for table task_history/);
    refused(req(DB, `update public.task_history set actor = 'x';`, { role: null }), /history is append-only/);
    refused(req(DB, `delete from public.task_history;`, { role: null }), /history is append-only/);
    refused(req(DB, `truncate public.task_history;`, { role: null }), /history is append-only/);
  });

  test('history ids are generated and cannot be chosen', () => {
    refused(req(DB, `insert into public.task_history (id, task_id, actor, op) values (1, gen_random_uuid(), 'ac', 'update');`, { role: null }), /non-DEFAULT value|history is written only/);
  });
});

// ---------------------------------------------------------------------------
// R3 — constraints
// ---------------------------------------------------------------------------

suite('R3 constraints', () => {
  const as = { header: hdr('ac') };

  test('close without a note → refused (done and decided_against); blank note too; note without closed_at too', () => {
    const id = seed(DB);
    // (005: a status change with no note and no closing_note is now refused EARLIER, by Rule N (ET008), so
    // these carry a write note to reach the constraint they prove.)
    refused(req(DB, `update public.tasks set status = 'done', closed_at = now(), note = 'x' where id = ${lit(id)};`, as), /tasks_closed_needs_note/);
    refused(req(DB, `update public.tasks set status = 'decided_against', closed_at = now(), note = 'x' where id = ${lit(id)};`, as), /tasks_closed_needs_note/);
    refused(req(DB, `update public.tasks set status = 'done', closed_at = now(), closing_note = '   ' where id = ${lit(id)};`, as), /tasks_closed_needs_note/);
    refused(req(DB, `update public.tasks set status = 'done', closing_note = 'shipped' where id = ${lit(id)};`, as), /tasks_closed_needs_note/);
    ok(req(DB, `update public.tasks set status = 'decided_against', closed_at = now(), closing_note = 'Justin said no; see brief Log 14:52' where id = ${lit(id)};`, as));
  });

  test('an 81-character title → refused; 80 → accepted', () => {
    refused(req(DB, `insert into public.tasks (title, status, raci) values (${lit('x'.repeat(81))}, 'open', '{"r":"lucas"}');`, as), /tasks_title_max_80/);
    ok(req(DB, `insert into public.tasks (title, status, raci) values (${lit('y'.repeat(80))}, 'open', '{"r":"lucas"}');`, as));
  });

  test('status banana → refused; an omitted status (default todo) → refused', () => {
    refused(req(DB, `insert into public.tasks (title, status, raci) values ('b', 'banana', '{"r":"lucas"}');`, as), /tasks_status_allowed/);
    refused(req(DB, `insert into public.tasks (title, raci) values ('no status', '{"r":"lucas"}');`, as), /tasks_status_allowed/);
  });

  test('every allowed status is accepted', () => {
    for (const s of ['open', 'in_progress', 'blocked', 'proposed']) {
      ok(req(DB, `insert into public.tasks (title, status, raci) values (${lit(uniq(s))}, ${lit(s)}, '{"r":"lucas"}');`, as));
    }
  });

  test('a signed time with no ref → refused; with a ref → accepted', () => {
    const id = seed(DB);
    // (005: only lucas or justin may sign at all (ET009), so this signs as lucas to reach the constraint.)
    const asLucas = { header: hdr('lucas') };
    refused(req(DB, `update public.tasks set signed_at = now() where id = ${lit(id)};`, asLucas), /tasks_signed_needs_ref/);
    refused(req(DB, `update public.tasks set signed_at = now(), signed_ref = ' ' where id = ${lit(id)};`, asLucas), /tasks_signed_needs_ref/);
    ok(req(DB, `update public.tasks set signed_at = now(), signed_ref = 'brief Log 14:52' where id = ${lit(id)};`, asLucas));
  });

  test('addressed to justin with no needed_by → refused (any case); with a date → accepted', () => {
    const id = seed(DB);
    refused(req(DB, `update public.tasks set addressed_to = 'justin' where id = ${lit(id)};`, as), /tasks_justin_needs_date/);
    refused(req(DB, `update public.tasks set addressed_to = 'Justin' where id = ${lit(id)};`, as), /tasks_justin_needs_date/);
    ok(req(DB, `update public.tasks set addressed_to = 'justin', needed_by = '2026-11-20' where id = ${lit(id)};`, as));
  });

  test('one owner, enforced: missing or blank raci.r → refused', () => {
    refused(req(DB, `insert into public.tasks (title, status, raci) values ('o', 'open', '{}');`, as), /tasks_one_owner/);
    refused(req(DB, `insert into public.tasks (title, status, raci) values ('o', 'open', '{"r":"  "}');`, as), /tasks_one_owner/);
  });

  test('QC Finding 7: one owner means one JSON STRING — an array, object, number or null is refused', () => {
    for (const r of ['{"r":["lucas","soren"]}', '{"r":{"name":"lucas"}}', '{"r":42}', '{"r":null}', '{"r":true}']) {
      refused(req(DB, `insert into public.tasks (title, status, raci) values ('o', 'open', ${lit(r)});`, as), /tasks_one_owner/, r);
    }
  });

  test('addressed_to must have the actor-name shape', () => {
    const id = seed(DB);
    refused(req(DB, `update public.tasks set addressed_to = 'two words' where id = ${lit(id)};`, as), /tasks_addressed_to_shape/);
  });

  test('delete and truncate on tasks are refused — as service_role and as the owner', () => {
    const id = seed(DB);
    refused(req(DB, `delete from public.tasks where id = ${lit(id)};`, as), /tasks are never deleted/);
    refused(req(DB, `delete from public.tasks where id = ${lit(id)};`, { role: null }), /tasks are never deleted/);
    refused(req(DB, `truncate public.tasks cascade;`, { role: null }), /tasks are never deleted/);
    assert.equal(scalar(DB, `select count(*) from public.tasks where id = ${lit(id)};`), '1');
  });

  test('parent_id: a missing parent and a self-parent are refused; a real parent is accepted', () => {
    const parent = seed(DB);
    const child = seed(DB);
    refused(req(DB, `update public.tasks set parent_id = gen_random_uuid() where id = ${lit(child)};`, as), /parent_id names no existing task/);
    refused(req(DB, `update public.tasks set parent_id = id where id = ${lit(child)};`, as), /would create a cycle/);
    ok(req(DB, `update public.tasks set parent_id = ${lit(parent)} where id = ${lit(child)};`, as));
  });

  // S2 (Soren, 15:29): a cycle of ANY length is refused, by a bounded walk up the ancestors.
  const setParent = (child, parent) => req(DB, `update public.tasks set parent_id = ${lit(parent)} where id = ${lit(child)};`, as);

  test('parent cycle of 2 (A→B, then B→A) is refused', () => {
    const a = seed(DB);
    const b = seed(DB);
    ok(setParent(a, b));
    refused(setParent(b, a), /would create a cycle/);
    assert.equal(scalar(DB, `select coalesce(parent_id::text, 'null') from public.tasks where id = ${lit(b)};`), 'null');
  });

  test('parent cycle of 3 (A→B→C, then C→A) is refused', () => {
    const a = seed(DB);
    const b = seed(DB);
    const c = seed(DB);
    ok(setParent(a, b));
    ok(setParent(b, c));
    refused(setParent(c, a), /would create a cycle/);
  });

  test('QC Finding 10: under REPEATABLE READ, a cycle closed by a link committed after the snapshot is REFUSED, not committed', async () => {
    const a = seed(DB);
    const b = seed(DB);
    // Session 1 opens a REPEATABLE READ transaction and takes its snapshot (B has no parent, A has none).
    const s1 = openSession(DB);
    await s1.send(`begin isolation level repeatable read;
set local role service_role;
set local request.headers = ${lit(hdr('ac'))};
select count(*) from public.tasks;`);
    // Session 2 links A → B and COMMITS, after session 1's snapshot.
    ok(setParent(a, b));
    // Session 1 now links B → A. Its snapshot cannot see A → B; reading A FOR SHARE must refuse.
    const r = await s1.finish(`update public.tasks set parent_id = ${lit(a)} where id = ${lit(b)};
commit;`);
    refused(r, /could not serialize access due to concurrent update/);
    assert.equal(scalar(DB, `select coalesce(parent_id::text, 'null') from public.tasks where id = ${lit(b)};`), 'null', 'the cycle was committed');
  });

  test('a chain of exactly 50 ancestors is accepted; one more is refused at the bound', () => {
    const tag = uniq('chain');
    // t0 (no parent), t1 → t0, …, t50 → t49: t50 has 50 ancestors. One transaction, as service_role.
    ok(req(DB, `do $$
      declare prev uuid := null; cur uuid;
      begin
        for i in 0..50 loop
          insert into public.tasks (title, status, raci, parent_id, tags)
          values (${lit(tag)} || '-' || i, 'open', '{"r":"lucas"}', prev, array[${lit(tag)}])
          returning id into cur;
          prev := cur;
        end loop;
      end $$;`, as));
    const deepest = scalar(DB, `select id from public.tasks where title = ${lit(`${tag}-50`)};`);
    refused(
      req(DB, `insert into public.tasks (title, status, raci, parent_id) values (${lit(`${tag}-51`)}, 'open', '{"r":"lucas"}', ${lit(deepest)});`, as),
      /parent chain is deeper than 50 ancestors/,
    );
    assert.equal(scalar(DB, `select count(*) from public.tasks where title = ${lit(`${tag}-51`)};`), '0');
  });

  test('short_id cannot be chosen by a client; linear_id is unique', () => {
    refused(req(DB, `insert into public.tasks (short_id, title, status, raci) values (999999, 's', 'open', '{"r":"lucas"}');`, as), /non-DEFAULT value into column "short_id"/);
    ok(req(DB, `insert into public.tasks (title, status, raci, linear_id) values ('l1', 'open', '{"r":"lucas"}', 'EVR-1');`, as));
    refused(req(DB, `insert into public.tasks (title, status, raci, linear_id) values ('l2', 'open', '{"r":"lucas"}', 'EVR-1');`, as), /tasks_linear_id_key/);
  });
});

// ---------------------------------------------------------------------------
// R4 — grants, RLS, functions
// ---------------------------------------------------------------------------

suite('R4 grants and RLS', () => {
  for (const role of ['anon', 'authenticated']) {
    // TWO LAYERS, PROVEN SEPARATELY (Soren, 15:29). An RLS violation is SQLSTATE 42501 too, so the
    // code alone cannot say which layer refused: these assert on the MESSAGE, and neither refusal
    // stands in for proof of the other.
    test(`${role} INSERT into tasks is refused by the FUNCTION GRANT (message asserted), and writes nothing`, () => {
      const title = uniq(`${role}-insert`);
      const r = req(DB, `insert into public.tasks (title, status, raci) values (${lit(title)}, 'open', '{"r":"lucas"}');`, { role, header: hdr('ac') });
      refused(r, /ERROR: {2}permission denied for function task_request_actor/);
      assert.doesNotMatch(r.stderr, /row-level security/);
      assert.equal(scalar(DB, `select count(*) from public.tasks where title = ${lit(title)};`), '0');
    });

    test(`${role} INSERT into tasks is refused by RLS ON ITS OWN, even if the function grant were widened (rolled back)`, () => {
      const title = uniq(`${role}-rls`);
      // As the owner, widen the grant INSIDE this transaction only, then act as the role. The
      // transaction always ROLLS BACK, so nothing here survives, whatever happens.
      const r = cluster.psql(DB, [
        'begin;',
        `grant execute on function public.task_request_actor() to ${role};`,
        `grant execute on function public.task_roster() to ${role};`,
        `set local role ${role};`,
        `set local request.headers = ${lit(hdr('ac'))};`,
        `insert into public.tasks (title, status, raci) values (${lit(title)}, 'open', '{"r":"lucas"}');`,
        'rollback;',
      ].join('\n'));
      refused(r, /new row violates row-level security policy for table "tasks"/);
      assert.equal(scalar(DB, `select count(*) from public.tasks where title = ${lit(title)};`), '0');
      assert.equal(scalar(DB, `select has_function_privilege(${lit(role)}, 'public.task_request_actor()', 'EXECUTE')::text;`), 'false', 'the widened grant leaked');
    });

    test(`${role}: RLS is enabled on tasks and no policy admits the role`, () => {
      assert.equal(scalar(DB, `select relrowsecurity::text from pg_class where oid = 'public.tasks'::regclass;`), 'true');
      assert.equal(scalar(DB, `select count(*) from pg_policies where schemaname = 'public' and tablename = 'tasks' and (${lit(role)} = any (roles) or 'public' = any (roles));`), '0');
    });

    test(`${role} SELECT on tasks returns zero rows while service_role returns at least one`, () => {
      seed(DB);
      assert.equal(ok(req(DB, 'select count(*) from public.tasks;', { role })), '0');
      assert.ok(Number(ok(req(DB, 'select count(*) from public.tasks;'))) >= 1);
    });

    test(`${role} UPDATE on tasks touches nothing (RLS hides every row) and leaves no history`, () => {
      const id = seed(DB);
      const before = historyCount(DB, id);
      ok(req(DB, `update public.tasks set status = 'blocked' where id = ${lit(id)};`, { role, header: hdr('ac') }));
      assert.equal(scalar(DB, `select status from public.tasks where id = ${lit(id)};`), 'open');
      assert.equal(historyCount(DB, id), before);
    });

    test(`${role} SELECT on task_history is denied outright`, () => {
      refused(req(DB, 'select count(*) from public.task_history;', { role }), /permission denied for table task_history/);
    });

    test(`${role} cannot execute the task functions`, () => {
      refused(req(DB, 'select public.task_roster();', { role }), /permission denied for function task_roster/);
    });
  }

  test('service_role inserts into both identity tables with no sequence grant of its own', () => {
    // seed() runs as service_role; the tasks trigger inserts into task_history as service_role.
    const id = seed(DB);
    assert.equal(historyCount(DB, id), 1);
    assert.equal(scalar(DB, `select count(*) from information_schema.role_usage_grants where grantee = 'service_role' and object_type = 'SEQUENCE';`), '0');
  });

  test('no task function is SECURITY DEFINER; every one pins search_path', () => {
    assert.equal(scalar(DB, `select count(*) from pg_proc where pronamespace = 'public'::regnamespace and (proname like 'task\\_%' or proname like 'tasks\\_%') and prosecdef;`), '0');
    assert.equal(scalar(DB, `select count(*) from pg_proc where pronamespace = 'public'::regnamespace and (proname like 'task\\_%' or proname like 'tasks\\_%') and not (proconfig @> array['search_path=""']);`), '0');
  });

  test('task_history has RLS on, the service_role_only policy, and only SELECT/INSERT for service_role', () => {
    const snap = ok(runScript('schema-snapshot.mjs', DB));
    assert.match(snap, /^table task_history: owner=postgres$/m);
    assert.match(snap, /^rls task_history: enabled=true forced=false$/m);
    // R4 / S1: no new function is executable by PUBLIC, anon or authenticated.
    assert.doesNotMatch(snap, /^function-grant [^:]+: (PUBLIC|anon|authenticated) EXECUTE$/m);
    assert.match(snap, /^function-grant task_request_actor\(\): service_role EXECUTE$/m);
    assert.match(snap, /^policy task_history\.service_role_only: PERMISSIVE ALL to service_role/m);
    const grants = snap.split('\n').filter((l) => l.startsWith('grant task_history:') && !l.includes(' postgres '));
    assert.deepEqual(grants, ['grant task_history: service_role INSERT', 'grant task_history: service_role SELECT']);
  });
});

// ---------------------------------------------------------------------------
// R6 support, R8 pagination, search
// ---------------------------------------------------------------------------

suite(`QC fix trip 2 (defaults ${MODE})`, () => {
  test('CTO fence 3: after the revokes, service_role can still INSERT, UPDATE and CLOSE a task, with history for each', () => {
    const t = uniq('sr-lifecycle');
    const id = ok(req(DB, `insert into public.tasks (title, status, raci) values (${lit(t)}, 'open', '{"r":"lucas","a":"justin"}') returning id;`, { header: hdr('lucas') })).split('\n').pop();
    ok(req(DB, `update public.tasks set status = 'in_progress', description = 'started', note = 'starting' where id = ${lit(id)};`, { header: hdr('lucas') }));
    ok(req(DB, `update public.tasks set status = 'done', closed_at = now(), closing_note = 'shipped; record in docs/x.md' where id = ${lit(id)};`, { header: hdr('lucas') }));
    assert.equal(scalar(DB, `select status from public.tasks where id = ${lit(id)};`), 'done');
    assert.equal(scalar(DB, `select string_agg(op, ',' order by id) from public.task_history where task_id = ${lit(id)};`), 'insert,update,update');
  });

  test('QC Finding 1: no client role holds any privilege on the new identity sequences', () => {
    for (const seq of [`pg_get_serial_sequence('public.tasks','short_id')`, `pg_get_serial_sequence('public.task_history','id')`]) {
      for (const role of ['anon', 'authenticated', 'service_role', 'public']) {
        for (const priv of ['USAGE', 'SELECT', 'UPDATE']) {
          const has = role === 'public'
            ? scalar(DB, `select count(*) from aclexplode(coalesce((select relacl from pg_class where oid = ${seq}::regclass), '{}')) a where a.grantee = 0;`) !== '0'
            : scalar(DB, `select has_sequence_privilege(${lit(role)}, ${seq}, ${lit(priv)})::text;`) === 'true';
          assert.equal(has, false, `${role} holds ${priv} on ${seq}`);
        }
      }
    }
  });

  test('QC Finding 1: no trigger function is executable by any client role, service_role included; the two helpers by service_role only', () => {
    for (const fn of ['tasks_before_write', 'tasks_after_write', 'tasks_refuse_delete', 'task_history_guard_insert', 'task_history_refuse_change']) {
      for (const role of ['anon', 'authenticated', 'service_role']) {
        assert.equal(scalar(DB, `select has_function_privilege(${lit(role)}, 'public.${fn}()', 'EXECUTE')::text;`), 'false', `${role} can execute ${fn}`);
      }
    }
    for (const fn of ['task_roster', 'task_request_actor']) {
      assert.equal(scalar(DB, `select has_function_privilege('service_role', 'public.${fn}()', 'EXECUTE')::text;`), 'true');
      for (const role of ['anon', 'authenticated']) {
        assert.equal(scalar(DB, `select has_function_privilege(${lit(role)}, 'public.${fn}()', 'EXECUTE')::text;`), 'false');
      }
    }
  });

  test('QC Finding 3: replica mode cannot skip the triggers — no-actor insert, history rewrite and task delete are all still refused', () => {
    const id = seed(DB);
    const replica = (body, header) => req(DB, `set local session_replication_role = replica;\n${body}`, { role: null, header });
    refused(replica(`insert into public.tasks (title, status, raci) values (${lit(uniq('replica'))}, 'open', '{"r":"lucas"}');`), /no actor/);
    refused(replica(`update public.task_history set actor = 'justin' where task_id = ${lit(id)};`), /history is append-only/);
    refused(replica(`delete from public.tasks where id = ${lit(id)};`), /tasks are never deleted/);
    refused(replica(`insert into public.task_history (task_id, actor, op) values (${lit(id)}, 'x', 'update');`), /history is written only by the database/);
    // and a legitimate write in replica mode still records its history
    const before = historyCount(DB, id);
    ok(replica(`update public.tasks set description = 'replica edit' where id = ${lit(id)};`, hdr('ac')));
    assert.equal(historyCount(DB, id), before + 1);
    assert.equal(scalar(DB, `select string_agg(distinct tgenabled::text, ',') from pg_trigger t join pg_class c on c.oid = t.tgrelid where not t.tgisinternal and c.relname in ('tasks','task_history');`), 'A');
  });
});

// ---------------------------------------------------------------------------
// FIX TRIP 3: the paste files Justin runs in the Supabase SQL editor (no agent holds the password)
// ---------------------------------------------------------------------------

/** psql -f splits on statements and sends them ONE AT A TIME — the harder case for atomicity. */
const runPaste = (db, text, { continueOnError = false } = {}) =>
  runPsql(cluster.targetFor(db), ['-q', '-A', '-t', ...(continueOnError ? ['-v', 'ON_ERROR_STOP=0'] : []), '-f', '-'], { input: text });
/**
 * Feed a paste the way the Supabase editor does from a Windows clipboard: with CRLF line endings, AS THE
 * SERVER RECEIVES THEM. psql on Windows turns CRLF into LF when it reads its input (measured 2026-11-06:
 * a CRLF paste through runPaste passed while the same paste in the editor refused), so sending CRLF text
 * through psql proves nothing. Instead the server builds the CRLF text itself and EXECUTEs it. Only the
 * paste's first statement (its DO block) runs; Paste 2's trailing NOTIFY does not.
 */
const runPasteCRLF = (db, text) => {
  const stmt = splitSql(text)[0];
  assert.ok(!stmt.includes('$crlf$') && !stmt.includes('$src$'), 'a wrapper tag occurs in the paste');
  return runPsql(cluster.targetFor(db), ['-q', '-A', '-t', '-f', '-'], {
    input: `do $crlf$ begin execute replace($src$${stmt}$src$, chr(10), chr(13) || chr(10)); end $crlf$;`,
  });
};
const snap = (db) => ok(runScript('schema-snapshot.mjs', db));
let pasteDbs = 0;
/** A database the way the live one was built, up to runtime 003 (no migration of ours). */
const freshDb = (legacyRows = '') => {
  pasteDbs += 1;
  const db = `paste_${MODE}_${pasteDbs}`;
  prepareDb(db, { legacyRows });
  return db;
};

suite(`paste files, change set 001-004 (defaults ${MODE})`, () => {
  const pastes = buildPastes();

  test('Paste 1 (dry run) raises "DRY RUN OK — nothing was changed (0 rows; 0 NOT VALID)" and leaves the snapshot BYTE-IDENTICAL', () => {
    for (const continueOnError of [false, true]) {
      const db = freshDb();
      const before = snap(db);
      const r = runPaste(db, pastes.dryRun, { continueOnError });
      assert.match(r.stderr, /ERROR: {2}DRY RUN OK — nothing was changed \(0 rows; 0 NOT VALID\)/, r.stderr);
      assert.equal(snap(db), before, `the dry run changed something (continueOnError=${continueOnError})`);
    }
  });

  test('Paste 2 (apply) succeeds and produces exactly the golden after-004 state (the live shape since 2026-11-06); the snapshot function returns the script\'s text', () => {
    const db = freshDb();
    const r = runPaste(db, pastes.apply);
    assert.equal(r.status, 0, r.stderr);
    // migrate.mjs now applies 001–005, so the 001-004 paste is held to the after-004 golden instead.
    golden('local-snapshot-after-004.txt', snap(db));
    // The function, called as service_role (as PostgREST would), returns the same text as the script.
    const lfOnly = (s) => s.replace(/\r\n/g, '\n').trim();
    const fromFunction = lfOnly(ok(req(db, 'select public.team_tasks_schema_snapshot();')));
    const fromScript = lfOnly(snap(db).replace(/\r\n/g, '\n').split('\n').slice(1).join('\n')); // minus the "# target=" line
    assert.equal(fromFunction, fromScript);
    refused(req(db, 'select public.team_tasks_schema_snapshot();', { role: 'anon' }), /permission denied for function team_tasks_schema_snapshot/);
    // and the CLI's role can work in it
    ok(req(db, `insert into public.tasks (title, status, raci) values ('after paste', 'open', '{"r":"ac"}');`, { header: hdr('ac') }));
  });

  test('CRLF, as the editor sends it from a Windows clipboard: the 001-004 dry run and apply behave exactly as with LF', () => {
    const db = freshDb();
    const before = snap(db);
    assert.match(runPasteCRLF(db, pastes.dryRun).stderr, /ERROR: {2}DRY RUN OK — nothing was changed \(0 rows; 0 NOT VALID\)/);
    assert.equal(snap(db), before);
    const r = runPasteCRLF(db, pastes.apply);
    assert.equal(r.status, 0, r.stderr);
    golden('local-snapshot-after-004.txt', snap(db));
  });

  test('Paste 2 run a SECOND time is refused by its before-assertions and changes nothing', () => {
    const db = freshDb();
    assert.equal(runPaste(db, pastes.apply).status, 0);
    const before = snap(db);
    const r = runPaste(db, pastes.apply);
    refused(r, /BEFORE-ASSERTION FAILED: public\.task_history already exists/);
    assert.equal(snap(db), before);
  });

  test('a deliberately BROKEN after-assertion rolls EVERYTHING back — snapshot byte-identical — even in continue-on-error mode', () => {
    const broken = pastes.apply.replace("('search','tsvector')", "('search','tsvectorX')");
    assert.notEqual(broken, pastes.apply, 'the break did not apply');
    for (const continueOnError of [false, true]) {
      const db = freshDb();
      const before = snap(db);
      const r = runPaste(db, broken, { continueOnError });
      assert.match(r.stderr, /AFTER-ASSERTION FAILED: tasks columns missing or mistyped: search tsvectorX\. Everything was rolled back\./);
      assert.equal(snap(db), before, `a failed paste left changes behind (continueOnError=${continueOnError})`);
    }
  });

  test('a deliberately BROKEN before-assertion refuses before anything runs — snapshot byte-identical', () => {
    const broken = pastes.apply.replace("tasks_pkey: PRIMARY KEY (id)'", "tasks_pkey: PRIMARY KEY (nope)'");
    assert.notEqual(broken, pastes.apply, 'the break did not apply');
    const db = freshDb();
    const before = snap(db);
    refused(runPaste(db, broken), /BEFORE-ASSERTION FAILED: public\.tasks constraints are not runtime 003's/);
    assert.equal(snap(db), before);
  });

  // QC N2 — her probes Q3 and Q4: a state that is NOT runtime 003's through tasks' INDEXES or POLICIES.
  test('QC N2 (Q3): a pre-existing tasks_short_id_key on (id) is refused by Paste 2 — nothing changed', () => {
    const db = freshDb();
    ok(cluster.psql(db, 'create unique index tasks_short_id_key on public.tasks (id);'));
    const before = snap(db);
    refused(runPaste(db, pastes.apply), /BEFORE-ASSERTION FAILED: public\.tasks indexes are not runtime 003's \(exactly tasks_pkey\)\. Found: tasks_pkey, tasks_short_id_key/);
    assert.equal(snap(db), before);
  });

  test('QC N2 (Q4): an extra permissive anon policy on tasks is refused by Paste 2 — nothing changed', () => {
    const db = freshDb();
    ok(cluster.psql(db, 'create policy anon_read on public.tasks for select to anon using (true);'));
    const before = snap(db);
    refused(runPaste(db, pastes.apply), /BEFORE-ASSERTION FAILED: public\.tasks policies are not runtime 003's/);
    assert.equal(snap(db), before);
  });

  test('QC N2: one of our index names pre-existing on ANOTHER table is refused (IF NOT EXISTS would have skipped ours)', () => {
    const db = freshDb();
    ok(cluster.psql(db, 'create index task_history_task_id_id_idx on public.proposals (task_id);'));
    const before = snap(db);
    refused(runPaste(db, pastes.apply), /BEFORE-ASSERTION FAILED: relation\(s\) named like this migration's indexes already exist: task_history_task_id_id_idx/);
    assert.equal(snap(db), before);
  });

  // QC N4 — a breach INSIDE the paste must be caught by the paste's own after-assertions. Each test
  // injects one extra statement into the migration section of Paste 2 and expects its assertion.
  const inject = (sql) => {
    const anchor = '  -- (c) AFTER-ASSERTIONS';
    assert.equal(pastes.apply.split(anchor).length, 2, 'injection anchor not found exactly once');
    return pastes.apply.replace(anchor, `  ${sql}\n${anchor}`);
  };
  for (const [label, sql, message] of [
    ['alters public.proposals', 'execute $inj$ alter table public.proposals add column sneaky text $inj$;', /AFTER-ASSERTION FAILED: public\.proposals changed\./],
    ['revokes a grant on public.tasks', 'execute $inj$ revoke select on public.tasks from anon $inj$;', /AFTER-ASSERTION FAILED: grants on public\.tasks changed\./],
    ['grants a new sequence to anon', "execute format('grant usage on sequence %s to anon', pg_get_serial_sequence('public.tasks', 'short_id'));", /AFTER-ASSERTION FAILED: a client role holds a privilege on a new sequence: anon on public\.tasks_short_id_seq/],
  ]) {
    test(`QC N4: a migration that ${label} is caught INSIDE Paste 2 by its after-assertion — snapshot byte-identical`, () => {
      const db = freshDb();
      const before = snap(db);
      const r = runPaste(db, inject(sql));
      refused(r, message);
      assert.equal(snap(db), before);
    });
  }

  test('QC N7: a held lock on tasks FAILS the paste after lock_timeout (5s) instead of hanging — nothing changed', async () => {
    const db = freshDb();
    const before = snap(db);
    const holder = openSession(db);
    await holder.send('begin; lock table public.tasks in access exclusive mode;');
    const started = Date.now();
    // A hard 30 s kill, so a paste WITHOUT lock_timeout goes red here instead of hanging the suite
    // (it would wait for the holder, which is released only after this call returns).
    // SEALED-EXEC: followed 2026-08-11 — psql is an absolute path to the installed PostgreSQL 17 binary (findPgTool never consults PATH or a registry); no network.
    const p = spawnSync(findPgTool('psql'), ['-X', '-v', 'ON_ERROR_STOP=1', '-q', '-A', '-t', '-f', '-'], {
      input: pastes.apply, env: pgEnv(cluster.targetFor(db)), encoding: 'utf8', timeout: 30000, windowsHide: true,
    });
    const r = { status: p.status ?? -1, stdout: p.stdout ?? '', stderr: `${p.stderr ?? ''}${p.error ? ` [killed: ${p.error.message}]` : ''}` };
    const waited = Date.now() - started;
    await holder.finish('rollback;');
    refused(r, /canceling statement due to lock timeout/);
    assert.ok(waited < 30000, `the paste waited ${waited} ms`);
    assert.equal(snap(db), before);
  });

  test('a live tasks that is NOT runtime 003\'s shape is refused (an extra column)', () => {
    const db = freshDb();
    ok(cluster.psql(db, 'alter table public.tasks add column surprise text;'));
    refused(runPaste(db, pastes.dryRun), /BEFORE-ASSERTION FAILED: public\.tasks columns are not runtime 003's shape/);
  });

  test('old rows that break a rule: the dry run REPORTS the counts, and Paste 2 REFUSES by itself, changing nothing', () => {
    const db = freshDb(`insert into public.tasks (title, status, raci) values (${lit('L'.repeat(90))}, 'todo', '{}'::jsonb);
                        insert into public.tasks (title, status, raci) values ('fine old row', 'proposed', '{"r":"lucas","a":"justin"}'::jsonb);`);
    const before = snap(db);
    assert.match(runPaste(db, pastes.dryRun).stderr, /DRY RUN OK — nothing was changed \(2 rows; 3 NOT VALID\)/);
    assert.equal(snap(db), before);
    refused(runPaste(db, pastes.apply), /APPLY REFUSED — 3 constraint\(s\) would be left NOT VALID by existing rows\. Nothing was changed\./);
    assert.equal(snap(db), before);
  });
});

// ---------------------------------------------------------------------------
// MIGRATION 005 — every rule proven at the database by a raw request that skips the CLI
// (Soren's cutover design §1.5 items 1–7; Soren-005's backlog rulings, Ruling 1 tests 1–7)
// ---------------------------------------------------------------------------

suite(`005 rules at the database (defaults ${MODE})`, () => {
  const as = (actor = 'ac') => ({ header: hdr(actor), verbose: true });
  const upd = (id, set, actor = 'ac') => req(DB, `update public.tasks set ${set} where id = ${lit(id)};`, as(actor));
  const lastHistory = (id, cols) => scalar(DB, `select ${cols} from public.task_history where task_id = ${lit(id)} order by id desc limit 1;`);
  /** A date n Pacific days from today, computed by the database itself (the same clock ET010 reads). */
  const ptPlus = (n) => scalar(DB, `select ((now() at time zone 'America/Los_Angeles')::date + ${n})::text;`);

  test('§1.5 item 1: backlog (with a review date) and needs_acceptance (addressed) are accepted; banana is refused', () => {
    ok(req(DB, `insert into public.tasks (title, status, raci, needed_by) values (${lit(uniq('bl'))}, 'backlog', '{"r":"lucas"}', ${lit(ptPlus(30))});`, as()));
    ok(req(DB, `insert into public.tasks (title, status, raci, addressed_to) values (${lit(uniq('na'))}, 'needs_acceptance', '{"r":"lucas"}', 'lucas');`, as()));
    refused(req(DB, `insert into public.tasks (title, status, raci) values ('b', 'banana', '{"r":"lucas"}');`, as()), /tasks_status_allowed/);
  });

  test('§1.5 item 2: a status change with no note is refused with ET008 (and its hint); with a note it succeeds, and the history row carries the note', () => {
    const id = seed(DB);
    const r = upd(id, `status = 'blocked'`);
    refused(r, /ERROR: {2}ET008: task update refused: a status change, or a new review date on a backlog item, needs a note/);
    assert.match(r.stderr, /if you sent one, it matches the previous note word for word, so say what's new/);
    assert.equal(scalar(DB, `select status from public.tasks where id = ${lit(id)};`), 'open');
    ok(upd(id, `status = 'blocked', note = 'waiting on soren'`));
    assert.equal(lastHistory(id, `array_to_string(changed_fields, ',') || ' | ' || note`), 'status | waiting on soren');
  });

  test('§1.5 item 3: a note-only write (a comment) gives exactly one history row, empty changed_fields, the note — and bumps updated_at', () => {
    const id = seed(DB);
    const before = historyCount(DB, id);
    const updatedBefore = scalar(DB, `select updated_at from public.tasks where id = ${lit(id)};`);
    ok(upd(id, `note = 'pointer: docs/contribution.md'`, 'mira'));
    assert.equal(historyCount(DB, id), before + 1);
    assert.equal(lastHistory(id, `op || ' ' || cardinality(changed_fields) || ' ' || old::text || ' ' || new::text || ' ' || actor || ' ' || note`), 'update 0 {} {} mira pointer: docs/contribution.md');
    assert.notEqual(scalar(DB, `select updated_at from public.tasks where id = ${lit(id)};`), updatedBefore);
    assert.equal(scalar(DB, `select note from public.tasks where id = ${lit(id)};`), 'pointer: docs/contribution.md');
  });

  test('§1.3: the note belongs to ONE write — the next write without one clears it, records none, and a stale-note no-op writes nothing', () => {
    const id = seed(DB);
    ok(upd(id, `note = 'first'`));
    ok(upd(id, `description = 'changed'`));
    assert.equal(scalar(DB, `select coalesce(note, 'NULL') from public.tasks where id = ${lit(id)};`), 'NULL');
    assert.equal(lastHistory(id, `array_to_string(changed_fields, ',') || ' ' || coalesce(note, 'NULL')`), 'description NULL');
    // a raw client that sends the old note back sends "no note": nothing changes, no row
    ok(upd(id, `note = 'second'`));
    const before = historyCount(DB, id);
    ok(upd(id, `note = 'second'`));
    assert.equal(historyCount(DB, id), before);
  });

  test('§1.5 item 4: a status change whose note repeats the previous write\'s note word for word is refused (ET008)', () => {
    const id = seed(DB);
    ok(upd(id, `status = 'blocked', note = 'same words'`));
    refused(upd(id, `status = 'open', note = 'same words'`), /ET008/);
    assert.equal(scalar(DB, `select status from public.tasks where id = ${lit(id)};`), 'blocked');
  });

  test('§1.3: a blank note is no note — a status change carrying only whitespace is refused (ET008)', () => {
    const id = seed(DB);
    refused(upd(id, `status = 'blocked', note = '   '`), /ET008/);
  });

  test('§1.5 item 5: a close with a fresh closing_note and no note succeeds; reopening it with no note is refused', () => {
    const id = seed(DB);
    ok(upd(id, `status = 'done', closed_at = now(), closing_note = 'shipped; docs/x.md'`));
    assert.equal(lastHistory(id, `array_to_string(changed_fields, ',') || ' ' || coalesce(note, 'NULL')`), 'closed_at,closing_note,status NULL');
    refused(upd(id, `status = 'open'`), /ET008/);
    ok(upd(id, `status = 'open', note = 'Justin sent it back: brief Log 15:10'`));
  });

  test('§1.3: an insert\'s note goes to task_history.note and NOT into the snapshot; a note over 600 characters is refused', () => {
    const t = uniq('ins-note');
    const id = ok(req(DB, `insert into public.tasks (title, status, raci, note) values (${lit(t)}, 'open', '{"r":"lucas"}', 'from the 11/06 standup') returning id;`, as())).split('\n').pop();
    assert.equal(lastHistory(id, `note || ' ' || (new ? 'note')::text || ' ' || (array_position(changed_fields, 'note') is null)::text`), 'from the 11/06 standup false true');
    refused(upd(id, `note = ${lit('n'.repeat(601))}`), /tasks_note_max_600/);
  });

  test('§1.5 item 6: a needs_acceptance task with no addressee is refused, on insert and on update', () => {
    refused(req(DB, `insert into public.tasks (title, status, raci) values ('x', 'needs_acceptance', '{"r":"lucas"}');`, as()), /tasks_acceptance_addressed/);
    const id = seed(DB);
    refused(upd(id, `status = 'needs_acceptance', note = 'please accept'`), /tasks_acceptance_addressed/);
    ok(upd(id, `status = 'needs_acceptance', addressed_to = 'lucas', note = 'please accept'`));
  });

  test('§1.5 item 7 / §2.2: a sign by nathan is refused (ET009); lucas and justin may sign; mira may not clear or change one', () => {
    const id = seed(DB);
    const sign = `signed_at = now(), signed_ref = 'brief Log 14:52'`;
    const r = upd(id, sign, 'nathan');
    refused(r, /ERROR: {2}ET009: task write refused: only lucas or justin may set, change or clear a sign-off/);
    ok(upd(id, sign, 'lucas'));
    ok(upd(id, `signed_ref = 'brief Log 14:53'`, 'justin'));
    refused(upd(id, `signed_at = null, signed_ref = null`, 'mira'), /ET009/);
    refused(upd(id, `signed_ref = 'elsewhere'`, 'mira'), /ET009/);
    assert.equal(scalar(DB, `select signed_ref from public.tasks where id = ${lit(id)};`), 'brief Log 14:53');
    // ...an unrelated write by anyone leaves the sign alone and is not refused
    ok(upd(id, `description = 'more context'`, 'mira'));
    // on INSERT too
    refused(req(DB, `insert into public.tasks (title, status, raci, signed_at, signed_ref) values ('s', 'open', '{"r":"lucas"}', now(), 'x');`, as('nathan')), /ET009/);
    ok(req(DB, `insert into public.tasks (title, status, raci, signed_at, signed_ref) values ('s', 'open', '{"r":"lucas"}', now(), 'x');`, as('lucas')));
    // and the history records who signed
    assert.equal(scalar(DB, `select string_agg(actor, ',' order by id) from public.task_history where task_id = ${lit(id)} and 'signed_ref' = any (changed_fields);`), 'lucas,justin');
  });

  // Ruling 1 (Soren-005): the backlog's review date
  test('Ruling 1.1: a backlog insert with no needed_by is refused with SQLSTATE 23514 on tasks_backlog_needs_review_date (not a trigger error)', () => {
    const r = req(DB, `insert into public.tasks (title, status, raci) values ('idea', 'backlog', '{"r":"lucas"}');`, as());
    refused(r, /ERROR: {2}23514: new row for relation "tasks" violates check constraint "tasks_backlog_needs_review_date"/);
    assert.doesNotMatch(r.stderr, /ET010/);
  });

  test('Ruling 1.2: a backlog insert at PT today +89 succeeds; at +91 it is refused with ET010', () => {
    ok(req(DB, `insert into public.tasks (title, status, raci, needed_by) values (${lit(uniq('bl89'))}, 'backlog', '{"r":"lucas"}', ${lit(ptPlus(89))});`, as()));
    const r = req(DB, `insert into public.tasks (title, status, raci, needed_by) values (${lit(uniq('bl91'))}, 'backlog', '{"r":"lucas"}', ${lit(ptPlus(91))});`, as());
    refused(r, /ERROR: {2}ET010: task write refused: a backlog item's review date can be at most 90 days out\./);
    assert.match(r.stderr, /close it --decided-against with the reason/);
  });

  const backlogRow = (days) =>
    ok(req(DB, `insert into public.tasks (title, status, raci, needed_by) values (${lit(uniq('bl'))}, 'backlog', '{"r":"lucas"}', ${lit(ptPlus(days))}) returning id;`, as())).split('\n').pop();

  test('Ruling 1.3: re-dating an existing backlog row to +91, even with a note, is refused with ET010', () => {
    const id = backlogRow(10);
    refused(upd(id, `needed_by = ${lit(ptPlus(91))}, note = 'later'`), /ET010/);
  });

  test('Ruling 1.4: re-dating to +30 without a note is refused (ET008); with one it succeeds, and history records the note and needed_by old → new', () => {
    const id = backlogRow(10);
    refused(upd(id, `needed_by = ${lit(ptPlus(30))}`), /ET008/);
    ok(upd(id, `needed_by = ${lit(ptPlus(30))}, note = 'worth another look after the meeting'`));
    assert.equal(
      lastHistory(id, `array_to_string(changed_fields, ',') || ' ' || (old ->> 'needed_by') || '→' || (new ->> 'needed_by') || ' ' || note`),
      `needed_by ${ptPlus(10)}→${ptPlus(30)} worth another look after the meeting`,
    );
  });

  test('Ruling 1.5: an open row with needed_by at +200 is accepted (the cap is backlog-only)', () => {
    ok(req(DB, `insert into public.tasks (title, status, raci, needed_by) values (${lit(uniq('far'))}, 'open', '{"r":"lucas"}', ${lit(ptPlus(200))});`, as()));
  });

  test('Ruling 1.6: an unrelated update (tags) to a backlog row dated +80 succeeds', () => {
    const id = backlogRow(80);
    ok(upd(id, `tags = array['v0.3']`));
  });

  test('Ruling 1.7: a blocked row dated +120, moved to backlog with a note, is refused with ET010', () => {
    const id = ok(req(DB, `insert into public.tasks (title, status, raci, needed_by) values (${lit(uniq('blk'))}, 'blocked', '{"r":"lucas"}', ${lit(ptPlus(120))}) returning id;`, as())).split('\n').pop();
    refused(upd(id, `status = 'backlog', note = 'parking it'`), /ET010/);
  });

  test('005 replaced two trigger FUNCTIONS and recreated no trigger: all five are still ENABLE ALWAYS, and both functions INVOKER with EXECUTE held by no client role', () => {
    assert.equal(scalar(DB, `select string_agg(tgname || '=' || tgenabled::text, ',' order by tgname) from pg_trigger where tgrelid in ('public.tasks'::regclass, 'public.task_history'::regclass) and not tgisinternal;`),
      'task_history_guard_insert=A,task_history_refuse_change=A,tasks_after_write=A,tasks_before_write=A,tasks_refuse_delete=A');
    for (const fn of ['tasks_before_write', 'tasks_after_write']) {
      assert.equal(scalar(DB, `select prosecdef::text || ' ' || array_to_string(proconfig, ';') from pg_proc where oid = 'public.${fn}()'::regprocedure;`), 'false search_path=""');
      for (const role of ['anon', 'authenticated', 'service_role']) {
        assert.equal(scalar(DB, `select has_function_privilege(${lit(role)}, 'public.${fn}()', 'EXECUTE')::text;`), 'false', `${role} can execute ${fn}`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// CHANGE SET 005's pastes (Soren's design §1.5 item 9 and §1.6; Soren-005 Ruling 4)
// ---------------------------------------------------------------------------

suite(`paste files, change set 005 (defaults ${MODE})`, () => {
  const base = buildPastes();
  const p5 = buildPastes(changeSet('005'));
  /** A database at the live shape since 2026-11-06: runtime 003, then the 001-004 paste. */
  const post004 = (rows = 0) => {
    const db = freshDb();
    assert.equal(runPaste(db, base.apply).status, 0);
    for (let i = 0; i < rows; i += 1) seed(db, { title: `existing ${i}` });
    return db;
  };
  const triggerOids = (db) => scalar(db, `select string_agg(tgname || ':' || oid, ',' order by tgname) from pg_trigger where not tgisinternal;`);
  const rowsDigest = (db) => scalar(db, `select md5(coalesce(string_agg((to_jsonb(t) - 'note')::text, E'\\n' order by t.id), '')) || ' ' || (select count(*) from public.task_history) from public.tasks t;`);

  test('item 9a: on the post-004 shape, Paste 1 raises "DRY RUN OK — nothing was changed (N rows; 0 NOT VALID)" and changes NOTHING (both psql modes)', () => {
    for (const continueOnError of [false, true]) {
      const db = post004(2);
      const before = snap(db);
      const digest = rowsDigest(db);
      const r = runPaste(db, p5.dryRun, { continueOnError });
      assert.match(r.stderr, /ERROR: {2}DRY RUN OK — nothing was changed \(2 rows; 0 NOT VALID\)/, r.stderr);
      assert.equal(snap(db), before, `the dry run changed something (continueOnError=${continueOnError})`);
      assert.equal(rowsDigest(db), digest);
    }
  });

  test('item 9a: on the post-004 shape, Paste 2 reaches exactly the new golden state (= migrate.mjs\'s 001–005) — no trigger recreated, no row value changed, no history row written', () => {
    const db = post004(3);
    const oids = triggerOids(db);
    const digest = rowsDigest(db);
    const r = runPaste(db, p5.apply);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(ourObjects(snap(db)), ourObjects(snap(DB)), 'the 005 paste and migrate.mjs produced different objects');
    golden('local-snapshot-after.txt', snap(db));
    assert.equal(triggerOids(db), oids, 'a trigger was dropped and recreated');
    assert.equal(rowsDigest(db), digest, 'an existing value changed, or a history row was written');
    // and the new rules are live in it
    refused(req(db, `update public.tasks set status = 'blocked' where title = 'existing 0';`, { header: hdr('ac') }), /a status change, or a new review date/);
  });

  // The 2026-11-06 live refusal: from a Windows clipboard the editor sends CRLF, so every multi-line
  // pinned literal carried \r\n against the server's \n. These run the pastes with CRs really reaching
  // the server (runPasteCRLF), and went RED on 47e2021 with exactly Justin's error.
  test('CRLF, as the editor sends it: the 005 dry run reaches "DRY RUN OK — nothing was changed (N rows; 0 NOT VALID)" and changes nothing', () => {
    const db = post004(2);
    const before = snap(db);
    const r = runPasteCRLF(db, p5.dryRun);
    assert.match(r.stderr, /ERROR: {2}DRY RUN OK — nothing was changed \(2 rows; 0 NOT VALID\)/, r.stderr);
    assert.equal(snap(db), before);
  });

  test('CRLF, as the editor sends it: the 005 apply reaches the new golden — the CRs really reached the server, and no comment or rule carries one', () => {
    const db = post004(2);
    const r = runPasteCRLF(db, p5.apply);
    assert.equal(r.status, 0, r.stderr);
    golden('local-snapshot-after.txt', snap(db));
    // proof the wrapper delivered CRs (the function bodies are stored as sent; their hash pins strip CRs)
    assert.equal(scalar(db, `select (position(chr(13) in prosrc) > 0)::text from pg_proc where oid = 'public.tasks_before_write()'::regprocedure;`), 'true');
    // ...and nothing a reader or a check compares picked one up: comments, constraint definitions
    assert.equal(scalar(db, `select count(*) from pg_description d join pg_constraint c on c.oid = d.objoid where c.conrelid in ('public.tasks'::regclass, 'public.task_history'::regclass) and position(chr(13) in d.description) > 0;`), '0');
    assert.equal(scalar(db, `select count(*) from pg_description where objoid in ('public.tasks'::regclass, 'public.task_history'::regclass, 'public.tasks_before_write()'::regprocedure, 'public.tasks_after_write()'::regprocedure) and position(chr(13) in description) > 0;`), '0');
    assert.equal(scalar(db, `select count(*) from pg_constraint where conrelid = 'public.tasks'::regclass and position(chr(13) in pg_get_constraintdef(oid)) > 0;`), '0');
    // and the rules work, CR and all: Rule N refuses, a note passes
    refused(req(db, `update public.tasks set status = 'blocked' where title = 'existing 0';`, { header: hdr('ac') }), /a status change, or a new review date/);
    ok(req(db, `update public.tasks set status = 'blocked', note = 'crlf ok' where title = 'existing 0';`, { header: hdr('ac') }));
  });

  test('item 9b: on runtime 003\'s ORIGINAL shape, the 005 paste refuses and changes nothing', () => {
    const db = freshDb();
    const before = snap(db);
    refused(runPaste(db, p5.apply), /BEFORE-ASSERTION FAILED: public\.tasks, public\.task_history and public\.proposals must all exist/);
    assert.equal(snap(db), before);
  });

  test('item 9b: on an ALREADY-APPLIED state, the 005 paste (dry run and apply) refuses and changes nothing', () => {
    const db = post004();
    assert.equal(runPaste(db, p5.apply).status, 0);
    const before = snap(db);
    refused(runPaste(db, p5.dryRun), /BEFORE-ASSERTION FAILED: a note column already exists/);
    refused(runPaste(db, p5.apply), /BEFORE-ASSERTION FAILED: a note column already exists/);
    assert.equal(snap(db), before);
  });

  test('a tasks_before_write that is not 003\'s exact body (one comment line added) is refused by the body-hash pin — nothing changed', () => {
    const db = post004();
    const body = scalar(db, `select prosrc from pg_proc where oid = 'public.tasks_before_write()'::regprocedure;`);
    ok(cluster.psql(db, `create or replace function public.tasks_before_write() returns trigger language plpgsql security invoker set search_path = '' as $fn$${body}\n-- a stray edit\n$fn$;`));
    const before = snap(db);
    refused(runPaste(db, p5.apply), /BEFORE-ASSERTION FAILED: tasks_before_write or tasks_after_write is not the function 003 created/);
    assert.equal(snap(db), before);
  });

  test('a live status rule that is NOT the six-value one (a seventh value) is refused — the drop never runs on an unknown variant', () => {
    const db = post004();
    ok(cluster.psql(db, `alter table public.tasks drop constraint tasks_status_allowed;
      alter table public.tasks add constraint tasks_status_allowed check (status in ('open','in_progress','blocked','done','decided_against','proposed','parked'));`));
    const before = snap(db);
    refused(runPaste(db, p5.apply), /BEFORE-ASSERTION FAILED: tasks_status_allowed is not the six-value rule that 001 created/);
    assert.equal(snap(db), before);
  });

  test('ADR-061\'s premise: if authenticator is a member of postgres, the paste refuses (fails closed) — nothing changed', () => {
    const db = post004();
    const before = snap(db);
    ok(cluster.psql('postgres', 'grant postgres to authenticator;'));
    try {
      refused(runPaste(db, p5.apply), /BEFORE-ASSERTION FAILED: the role authenticator is a member of postgres/);
    } finally {
      ok(cluster.psql('postgres', 'revoke postgres from authenticator;'));
    }
    assert.equal(snap(db), before);
  });

  // A breach INSIDE the paste must be caught by 005's own after-assertions: each injects one statement
  // into the migration section and expects its assertion, with everything rolled back.
  const inject = (sql) => {
    const anchor = '  -- (c) AFTER-ASSERTIONS for change set 005';
    assert.equal(p5.apply.split(anchor).length, 2, 'injection anchor not found exactly once');
    return p5.apply.replace(anchor, `  ${sql}\n${anchor}`);
  };
  for (const [label, sql, message] of [
    ['recreates a trigger (resetting ENABLE ALWAYS)', 'execute $inj$ drop trigger tasks_after_write on public.tasks $inj$; execute $inj$ create trigger tasks_after_write after insert or update on public.tasks for each row execute function public.tasks_after_write() $inj$;', /AFTER-ASSERTION FAILED: trigger\(s\) no longer ENABLE ALWAYS: tasks\.tasks_after_write=O/],
    ['adds an extra column to tasks', 'execute $inj$ alter table public.tasks add column sneaky text $inj$;', /AFTER-ASSERTION FAILED: tasks\.note is not the 23rd and last column/],
    ['alters public.proposals', 'execute $inj$ alter table public.proposals add column sneaky text $inj$;', /AFTER-ASSERTION FAILED: columns other than note changed/],
    ['revokes a grant on public.tasks', 'execute $inj$ revoke select on public.tasks from anon $inj$;', /AFTER-ASSERTION FAILED: table grants changed/],
    ['grants EXECUTE on a replaced function to service_role', 'execute $inj$ grant execute on function public.tasks_after_write() to service_role $inj$;', /AFTER-ASSERTION FAILED: a client role can execute a replaced trigger function: service_role -> tasks_after_write/],
    ['drops another constraint', 'execute $inj$ alter table public.tasks drop constraint tasks_title_max_80 $inj$;', /AFTER-ASSERTION FAILED: constraints other than the five 005 adds or replaces changed/],
    // (with an actor, so the trigger lets the write through and only the paste's own check can catch it)
    ['changes an existing value', "perform set_config('evryn.actor', 'ac', true); execute $inj$ update public.tasks set description = 'rewritten' $inj$;", /AFTER-ASSERTION FAILED: rows: no existing value changed, no history row written changed/],
  ]) {
    test(`a migration that ${label} is caught INSIDE the 005 paste by its after-assertion — snapshot byte-identical`, () => {
      const db = post004(1);
      const before = snap(db);
      refused(runPaste(db, inject(sql)), message);
      assert.equal(snap(db), before);
    });
  }

  test('a deliberately BROKEN after-assertion (the pinned new body hash) rolls EVERYTHING back, even in continue-on-error mode', () => {
    const broken = p5.apply.replace('body_md5=5424d669d256941cd7bb671d9a487cc2', 'body_md5=00000000000000000000000000000000');
    assert.notEqual(broken, p5.apply, 'the break did not apply');
    for (const continueOnError of [false, true]) {
      const db = post004();
      const before = snap(db);
      // (psql exits 0 in continue-on-error mode, so assert on the message, as the 001-004 test does)
      assert.match(runPaste(db, broken, { continueOnError }).stderr, /AFTER-ASSERTION FAILED: tasks_before_write or tasks_after_write is not the reviewed function/);
      assert.equal(snap(db), before);
    }
  });
});

suite('search and R8', () => {
  test('full-text search finds a word in the body', () => {
    const t = uniq('fts');
    ok(req(DB, `insert into public.tasks (title, description, status, raci) values (${lit(t)}, 'evaluate the embeddings pipeline cost', 'open', '{"r":"lucas"}');`, { header: hdr('ac') }));
    assert.equal(scalar(DB, `select title from public.tasks where search @@ websearch_to_tsquery('english', 'embedding pipeline');`), t);
  });

  test('keyset pagination on short_id, page size 2, returns all 5 rows and stops on an empty page', () => {
    const tag = uniq('r8');
    for (let i = 0; i < 5; i += 1) {
      ok(req(DB, `insert into public.tasks (title, status, raci, tags) values (${lit(`${tag}-${i}`)}, 'open', '{"r":"lucas"}', array[${lit(tag)}]);`, { header: hdr('ac') }));
    }
    const got = [];
    let cursor = null;
    let pages = 0;
    for (;;) {
      pages += 1;
      const page = ok(req(DB, `select short_id from public.tasks where tags @> array[${lit(tag)}] ${cursor === null ? '' : `and short_id > ${cursor}`} order by short_id asc limit 2;`));
      const ids = page ? page.split('\n').map(Number) : [];
      if (ids.length === 0) break;
      got.push(...ids);
      cursor = ids[ids.length - 1];
    }
    assert.equal(got.length, 5);
    assert.equal(pages, 4);
  });
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
