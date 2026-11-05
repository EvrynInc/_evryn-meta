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
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TASKS_DIR } from '../helpers.mjs';
import { CODE_ROOT } from '../../lib/config.mjs';
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

/** Run SQL as a simulated PostgREST request (or as the owner when role is null). */
function req(db, body, { role = 'service_role', header, evrynActor } = {}) {
  const lines = ['begin;'];
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
      EVRYN_TEAM_DB_PASSWORD: '',
    },
  });
}

function golden(name, text) {
  const path = join(FIXTURES, name);
  if (process.env.EVRYN_TASKS_UPDATE_SNAPSHOTS === '1') {
    writeFileSync(path, text, 'utf8');
    return;
  }
  // A missing golden file FAILS rather than silently regenerating: a guard that rewrites its own
  // expectation can never go red.
  assert.ok(existsSync(path), `${name} is missing — rerun with EVRYN_TASKS_UPDATE_SNAPSHOTS=1 and review the diff`);
  assert.equal(text, readFileSync(path, 'utf8').replace(/\r\n/g, '\n'), `${name} differs from the committed golden snapshot`);
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

/** Build a database the way the live one was built: defaults on → runtime 003 → (old rows) → defaults off. */
function prepareDb(db, { legacyRows = '' } = {}) {
  ok(cluster.psql('postgres', `create database ${db};`));
  ok(cluster.psql(db, SUPABASE_DEFAULTS_ON));
  ok(cluster.psql(db, readFileSync(RUNTIME_003, 'utf8')));
  if (legacyRows) ok(cluster.psql(db, legacyRows));
  ok(cluster.psql(db, SUPABASE_DEFAULTS_OFF));
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
       create role service_role nologin noinherit bypassrls;`,
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
    assert.match(snapBefore, /^table tasks: owner=postgres rls=true/m);
  });

  test('the migration did NOT revoke tasks\' existing grants (outside the go)', () => {
    const after = ok(runScript('schema-snapshot.mjs', DB));
    for (const line of snapBefore.split('\n').filter((l) => l.startsWith('grant tasks:'))) {
      assert.ok(after.includes(line), `grant line lost: ${line}`);
    }
  });

  test('golden snapshots: before and after migrating', () => {
    golden('local-snapshot-before.txt', snapBefore);
    golden('local-snapshot-after.txt', ok(runScript('schema-snapshot.mjs', DB)));
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
    refused(req(DB, insert(t)), /no actor/);
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
    refused(req(DB, `update public.tasks set status = 'blocked' where id = ${lit(id)};`), /no actor/);
    ok(req(DB, `update public.tasks set status = 'blocked' where id = ${lit(id)};`, { header: hdr('nobody-real') }));
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
    ok(req(DB, `update public.tasks set status = 'blocked' where id = ${lit(id)};`, { header: hdr('lucas') }));
    assert.equal(historyCount(DB, id), before + 1);
    assert.equal(
      scalar(DB, `select array_to_string(changed_fields, ',') || ' ' || old::text || ' ' || new::text from public.task_history where task_id = ${lit(id)} order by id desc limit 1;`),
      'status {"status": "open"} {"status": "blocked"}',
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
    refused(req(DB, `update public.tasks set status = 'done', closed_at = now() where id = ${lit(id)};`, as), /tasks_closed_needs_note/);
    refused(req(DB, `update public.tasks set status = 'decided_against', closed_at = now() where id = ${lit(id)};`, as), /tasks_closed_needs_note/);
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
    refused(req(DB, `update public.tasks set signed_at = now() where id = ${lit(id)};`, as), /tasks_signed_needs_ref/);
    refused(req(DB, `update public.tasks set signed_at = now(), signed_ref = ' ' where id = ${lit(id)};`, as), /tasks_signed_needs_ref/);
    ok(req(DB, `update public.tasks set signed_at = now(), signed_ref = 'brief Log 14:52' where id = ${lit(id)};`, as));
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
    refused(req(DB, `update public.tasks set parent_id = id where id = ${lit(child)};`, as), /own parent/);
    ok(req(DB, `update public.tasks set parent_id = ${lit(parent)} where id = ${lit(child)};`, as));
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
    test(`${role} INSERT into tasks is refused, and writes nothing`, (t) => {
      const title = uniq(`${role}-insert`);
      const r = req(DB, `insert into public.tasks (title, status, raci) values (${lit(title)}, 'open', '{"r":"lucas"}');`, { role, header: hdr('ac') });
      refused(r, /permission denied for function task_request_actor|row-level security/);
      t.diagnostic(`${role} insert refused with: ${r.stderr.split('\n').find((l) => l.includes('ERROR')) ?? r.stderr}`);
      assert.equal(scalar(DB, `select count(*) from public.tasks where title = ${lit(title)};`), '0');
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
    assert.match(snap, /^table task_history: owner=postgres rls=true/m);
    assert.match(snap, /^policy task_history\.service_role_only: PERMISSIVE ALL to service_role/m);
    const grants = snap.split('\n').filter((l) => l.startsWith('grant task_history:') && !l.includes(' postgres '));
    assert.deepEqual(grants, ['grant task_history: service_role INSERT', 'grant task_history: service_role SELECT']);
  });
});

// ---------------------------------------------------------------------------
// R6 support, R8 pagination, search
// ---------------------------------------------------------------------------

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
