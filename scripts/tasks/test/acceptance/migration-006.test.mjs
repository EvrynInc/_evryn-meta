/**
 * migration-006.test.mjs — migration 006 (the authorization record) proven AT THE DATABASE, against a
 * throwaway local PostgreSQL 17 cluster shaped like the Evryn Team project (the same faithfulness rules as
 * local-postgres.test.mjs: Supabase's roles, its old default privileges then their removal, and PostgREST
 * simulated as `set local role` plus `set local request.headers`).
 *
 * Build brief: evryn-team-workspace/shared/projects/helm/2026/2026.11.13-autonomy-guards-soren/builds/5-migration-006-v2.md
 * §3, tests 1–18 (C3, C4 and C5 folded in). Every test is a raw request that skips the CLI. Each refusal's
 * test has a control: a mutation of the migration, run by the mutation harness outside the code folder
 * (the DCG-6 report lists each mutation and its result).
 *
 * WHY A SEPARATE FILE: local-postgres.test.mjs proves 001–005 on the post-005 shape (it seeds `open`
 * tasks directly, which 006 refuses by design). This file builds its databases through 006, and also
 * re-proves on that shape the 005 rules 006's replaced trigger must keep.
 *
 * Run:  node --test scripts/tasks/test/acceptance/migration-006.test.mjs
 *       EVRYN_TASKS_DEFAULTS=on … (the other default-privilege mode); EVRYN_TASKS_UPDATE_SNAPSHOTS=1 to rewrite the golden.
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
import { runPsql } from '../../lib/pg.mjs';
import { buildPastes, changeSet } from '../../make-paste.mjs';
import { splitSql } from '../../lib/sqlsplit.mjs';
import { pgToolsAvailable, startCluster } from './cluster.mjs';

const RUNTIME_003 =
  process.env.EVRYN_TASKS_RUNTIME_003 ?? join(CODE_ROOT, 'evryn-team-runtime', 'migrations', '003_tasks_proposals.sql');
const FIXTURES = join(TASKS_DIR, 'test', 'fixtures');
const MIGRATION_006 = join(TASKS_DIR, 'migrations', '006_authorization_record.sql');
const available = pgToolsAvailable() && existsSync(RUNTIME_003);

let cluster;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const SESSION = '0b6f7c1e-2f43-4c5a-9d1e-5f7a8b9c0d1e';
const hdr = (actor, session = SESSION) => JSON.stringify({ 'x-evryn-actor': actor, ...(session ? { 'x-evryn-session': session } : {}) });

/**
 * Run SQL as a simulated PostgREST request (role service_role by default), with psql's verbose errors so a
 * test can assert on the SQLSTATE ("ERROR:  ET011: …"). role null = the owner. `sets` are extra SET LOCAL lines.
 */
function req(db, body, { role = 'service_role', actor = 'ac', session = SESSION, header, sets = [] } = {}) {
  const lines = ['\\set VERBOSITY verbose', 'begin;'];
  if (role) lines.push(`set local role ${role};`);
  const h = header !== undefined ? header : actor === null ? undefined : hdr(actor, session);
  if (h !== undefined) lines.push(`set local request.headers = ${lit(h)};`);
  for (const s of sets) lines.push(s);
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

const scalar = (db, sql) => ok(cluster.psql(db, sql));
let seq = 0;
const uniq = (p) => `${p}-${process.pid}-${(seq += 1)}`;
const lastLine = (s) => s.split('\n').pop();

/** Insert a task (default: proposed, owner lucas, as ac) and return its uuid. */
function newTask(db, { actor = 'ac', status = 'proposed', title = uniq('t'), owner = 'lucas', description = '', extraCols = '', extraVals = '' } = {}) {
  return lastLine(ok(req(db,
    `insert into public.tasks (title, description, status, raci${extraCols}) values (${lit(title)}, ${lit(description)}, ${lit(status)}, ${lit(JSON.stringify({ r: owner }))}::jsonb${extraVals}) returning id;`,
    { actor })));
}

/** Insert an authorization (or acceptance) row; returns the raw psql result. */
function authReq(db, taskId, { actor = 'lucas', kind = 'authorization', tier = 'lucas', rule = 'authorization-rules.md §1 item 1', ref = null, note = 'go', session = SESSION, extra = '', extraVals = '', sets = [], role = 'service_role' } = {}) {
  return req(db,
    `insert into public.task_authorizations (task_id, kind, tier, rule_ref, justin_ref, note${extra}) values (${lit(taskId)}, ${lit(kind)}, ${lit(tier)}, ${rule === null ? 'null' : lit(rule)}, ${ref === null ? 'null' : lit(ref)}, ${lit(note)}${extraVals}) returning id;`,
    { actor, session, sets, role });
}
const authId = (res) => lastLine(ok(res));

/** A task authorized at tier lucas: { id, aid }. */
function openTask(db, opts = {}) {
  const id = newTask(db, opts);
  const aid = authId(authReq(db, id));
  return { id, aid };
}

const field = (db, id, col) => scalar(db, `select coalesce((${col})::text, 'NULL') from public.tasks where id = ${lit(id)};`);
const upd = (db, id, set, opts) => req(db, `update public.tasks set ${set} where id = ${lit(id)};`, opts);
const ptPlus = (db, n) => scalar(db, `select ((now() at time zone 'America/Los_Angeles')::date + ${n})::text;`);

function runScript(script, db, { through } = {}) {
  // SEALED-EXEC: followed 2026-08-11 — process.execPath is the absolute path of the node binary already running this suite; no resolution, no network.
  return spawnSync(process.execPath, [join(TASKS_DIR, script)], {
    encoding: 'utf8',
    windowsHide: true,
    env: {
      ...process.env,
      EVRYN_TASKS_TEST_MODE: '1',
      EVRYN_TASKS_ENV_FROM_PROCESS: '1',
      EVRYN_TASKS_LOCAL_PG: cluster.urlFor(db),
      ...(through ? { EVRYN_TASKS_MIGRATE_THROUGH: through } : {}),
    },
  });
}

function ourObjects(snapshot) {
  return snapshot.split(/\r?\n/).filter((l) => l !== '' && !l.startsWith('default-acl ') && !/^# server_version/.test(l)).join('\n');
}

function golden(name, rawText) {
  const keep = (s) => s.split(/\r?\n/).filter((l) => l !== '' && !l.startsWith('default-acl ')).join('\n');
  const text = `${keep(rawText)}\n`;
  const path = join(FIXTURES, name);
  if (process.env.EVRYN_TASKS_UPDATE_SNAPSHOTS === '1') {
    writeFileSync(path, text, 'utf8');
    return;
  }
  assert.ok(existsSync(path), `${name} is missing — rerun with EVRYN_TASKS_UPDATE_SNAPSHOTS=1 and review the diff`);
  const committed = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
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
const MODE = process.env.EVRYN_TASKS_DEFAULTS === 'on' ? 'on' : 'off';
const OTHER_MODE = MODE === 'on' ? 'off' : 'on';

function prepareDb(db, { defaults = MODE } = {}) {
  ok(cluster.psql('postgres', `create database ${db};`));
  ok(cluster.psql(db, SUPABASE_DEFAULTS_ON));
  ok(cluster.psql(db, readFileSync(RUNTIME_003, 'utf8')));
  if (defaults === 'off') ok(cluster.psql(db, SUPABASE_DEFAULTS_OFF));
}

/** A database migrated by migrate.mjs, through `through` (default: every file, i.e. 001–006). */
function migratedDb(db, { through, defaults = MODE } = {}) {
  prepareDb(db, { defaults });
  const m = runScript('migrate.mjs', db, { through });
  assert.equal(m.status, 0, `migrate failed: ${m.stdout}\n${m.stderr}`);
  return db;
}

const snap = (db) => ok(runScript('schema-snapshot.mjs', db));
let dbs = 0;
const nextDb = (p) => `${p}_${MODE}_${(dbs += 1)}`;

/**
 * A post-005 database with representative rows, made the way the live rows were made before 006 (005 still
 * allowed an insert at open): a pre-005 backlog row (blocked, tag backlog, review date +120), a self-created
 * open row (lucas), an imported open row (ac, with a linear id), a done row, and a proposed row.
 */
function post005WithRows() {
  const db = migratedDb(nextDb('p5'), { through: '005' });
  const ins = (actor, title, status, extraCols = '', extraVals = '') =>
    lastLine(ok(req(db, `insert into public.tasks (title, status, raci${extraCols}) values (${lit(title)}, ${lit(status)}, '{"r":"lucas"}'${extraVals}) returning id;`, { actor, session: null })));
  const backlog = ins('lucas', 'old backlog idea', 'blocked', ', tags, needed_by', `, array['backlog'], ((now() at time zone 'America/Los_Angeles')::date + 120)`);
  const self = ins('lucas', 'self-created open', 'open');
  const imported = ins('ac', 'imported from linear', 'open', ', linear_id', ", 'EVR-777'");
  const done = ins('lucas', 'finished work', 'open');
  ok(req(db, `update public.tasks set status = 'done', closed_at = now(), closing_note = 'shipped' where id = ${lit(done)};`, { actor: 'lucas', session: null }));
  const proposed = ins('mira', 'an idea for later', 'proposed');
  return { db, backlog, self, imported, done, proposed };
}

const apply006 = (db) => runPsql(cluster.targetFor(db), ['-q', '-1', '-f', MIGRATION_006]);

// ---------------------------------------------------------------------------
// setup / teardown
// ---------------------------------------------------------------------------

const DB = 'a6_clean';

before(async () => {
  if (!available) return;
  cluster = await startCluster();
  ok(cluster.psql('postgres', `create role anon nologin noinherit;
       create role authenticated nologin noinherit;
       create role service_role nologin noinherit bypassrls;
       create role authenticator login noinherit;
       grant anon, authenticated, service_role to authenticator;`));
  migratedDb(DB);
});

after(() => {
  if (cluster) cluster.stop();
});

const suite = available ? describe : describe.skip;

test('the 006 acceptance suite actually ran (PostgreSQL 17 tools and runtime 003 were found)', () => {
  if (available || process.env.EVRYN_TASKS_ACCEPTANCE_OPTIONAL === '1') return;
  assert.fail('006 acceptance suite SKIPPED: PostgreSQL tools or runtime 003 not found. Set EVRYN_TASKS_ACCEPTANCE_OPTIONAL=1 only if skipping is genuinely acceptable here.');
});

// ---------------------------------------------------------------------------
// The shape
// ---------------------------------------------------------------------------

suite(`006: the shape (defaults ${MODE})`, () => {
  test('golden: the snapshot after migrate.mjs 001–006 (our objects; identical in both default-privilege modes)', () => {
    golden('local-snapshot-after-006.txt', snap(DB));
    const other = migratedDb(nextDb(`a6_other_${OTHER_MODE}`), { defaults: OTHER_MODE });
    assert.equal(ourObjects(snap(DB)), ourObjects(snap(other)), 'our objects differ between the two default-privilege modes');
  });

  test('no task function is SECURITY DEFINER; every one pins search_path; trigger functions are executable by no client role; helpers by service_role only', () => {
    assert.equal(scalar(DB, `select count(*) from pg_proc where pronamespace = 'public'::regnamespace and (proname like 'task\\_%' or proname like 'tasks\\_%') and prosecdef;`), '0');
    assert.equal(scalar(DB, `select count(*) from pg_proc where pronamespace = 'public'::regnamespace and (proname like 'task\\_%' or proname like 'tasks\\_%') and not (proconfig @> array['search_path=""']);`), '0');
    for (const fn of ['task_authorizations_before_insert()', 'task_authorizations_after_insert()', 'task_authorizations_refuse_change()', 'tasks_before_write()', 'tasks_after_write()']) {
      for (const role of ['anon', 'authenticated', 'service_role']) {
        assert.equal(scalar(DB, `select has_function_privilege(${lit(role)}, 'public.${fn}', 'EXECUTE')::text;`), 'false', `${role} can execute ${fn}`);
      }
    }
    for (const fn of ['task_scope_hash(text,text,text)', 'task_request_session()', 'task_justin_tier_ok()']) {
      assert.equal(scalar(DB, `select has_function_privilege('service_role', 'public.${fn}', 'EXECUTE')::text;`), 'true', fn);
      for (const role of ['anon', 'authenticated']) {
        assert.equal(scalar(DB, `select has_function_privilege(${lit(role)}, 'public.${fn}', 'EXECUTE')::text;`), 'false', `${role} can execute ${fn}`);
      }
    }
  });

  test('every trigger on tasks, task_history and task_authorizations is ENABLE ALWAYS, and 006 recreated none of 003\'s', () => {
    assert.equal(scalar(DB, `select string_agg(c.relname || '.' || t.tgname || '=' || t.tgenabled::text, ',' order by c.relname, t.tgname) from pg_trigger t join pg_class c on c.oid = t.tgrelid where not t.tgisinternal and c.relname in ('tasks','task_history','task_authorizations');`),
      'task_authorizations.task_authorizations_after_insert=A,task_authorizations.task_authorizations_before_insert=A,task_authorizations.task_authorizations_refuse_change=A,task_history.task_history_guard_insert=A,task_history.task_history_refuse_change=A,tasks.tasks_after_write=A,tasks.tasks_before_write=A,tasks.tasks_refuse_delete=A');
  });

  test('task_auth_config is seeded lucas_relay, readable by service_role, and writable by no client role', () => {
    assert.equal(scalar(DB, `select id || ' ' || justin_tier_source || ' ' || coalesce(justin_user_id::text, 'NULL') from public.task_auth_config;`), '1 lucas_relay NULL');
    assert.equal(ok(req(DB, 'select justin_tier_source from public.task_auth_config;')), 'lucas_relay');
    for (const role of ['service_role', 'anon', 'authenticated']) {
      refused(req(DB, `update public.task_auth_config set justin_tier_source = 'justin_signin';`, { role }), /permission denied for table task_auth_config/);
      refused(req(DB, `insert into public.task_auth_config values (2, 'justin_signin', null);`, { role }), /permission denied for table task_auth_config/);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests 1–18 (build brief 5 v2 §3)
// ---------------------------------------------------------------------------

suite(`006: the authorization record (defaults ${MODE})`, () => {
  test('1. an insert at open, in_progress, blocked, needs_acceptance or done is refused (ET011) as ac, lucas and justin; backlog and proposed succeed', () => {
    for (const actor of ['ac', 'lucas', 'justin']) {
      for (const [status, cols, vals] of [
        ['open', '', ''], ['in_progress', '', ''], ['blocked', '', ''],
        ['needs_acceptance', ', addressed_to', ", 'lucas'"],
        ['done', ', closed_at, closing_note', ", now(), 'x'"],
      ]) {
        refused(req(DB, `insert into public.tasks (title, status, raci${cols}) values (${lit(uniq('i'))}, ${lit(status)}, '{"r":"lucas"}'${vals});`, { actor }), /ERROR: {2}ET011: task write refused: only an authorization record/);
      }
      newTask(DB, { actor, status: 'proposed' });
      newTask(DB, { actor, status: 'backlog', extraCols: ', needed_by', extraVals: `, ${lit(ptPlus(DB, 10))}` });
    }
  });

  test('2. a status write proposed → open is refused (ET011) as ac and as lucas', () => {
    const id = newTask(DB);
    for (const actor of ['ac', 'lucas']) refused(upd(DB, id, `status = 'open', note = 'go'`, { actor }), /ET011/);
    assert.equal(field(DB, id, 'status'), 'proposed');
  });

  test('3. an authorization row by ac is refused (ET012); by lucas at tier lucas with rule_ref it moves the task to open in the same transaction, with a history row by lucas; without rule_ref it is refused', () => {
    const id = newTask(DB);
    refused(authReq(DB, id, { actor: 'ac' }), /ERROR: {2}ET012: authorization refused: only lucas or justin/);
    refused(authReq(DB, id, { rule: null }), /ET012: authorization refused: a Lucas-tier record needs rule_ref/);
    assert.equal(field(DB, id, 'status'), 'proposed');
    const aid = authId(authReq(DB, id));
    assert.equal(field(DB, id, 'status'), 'open');
    assert.equal(field(DB, id, 'authorization_id'), aid);
    // the trigger-depth claim: the move wrote its history row (depth 3 passes the guard), by the authorizing actor
    assert.equal(scalar(DB, `select actor || ' | ' || array_to_string(changed_fields, ',') || ' | ' || note from public.task_history where task_id = ${lit(id)} order by id desc limit 1;`),
      `lucas | authorization_id,status | authorized (T-auth #${aid}, tier lucas): go`);
    assert.equal(scalar(DB, `select tier || ' ' || source || ' ' || actor || ' ' || session_id from public.task_authorizations where id = ${aid};`), `lucas lucas_relay lucas ${SESSION}`);
  });

  test('4. a Justin-tier row by lucas without justin_ref is refused; with it, under lucas_relay, it succeeds with source lucas_relay; under justin_signin the same row is refused', () => {
    const a = newTask(DB);
    refused(authReq(DB, a, { tier: 'justin', rule: null }), /ET012: authorization refused: a Justin-tier record needs justin_ref/);
    const aid = authId(authReq(DB, a, { tier: 'justin', rule: null, ref: 'guards brief Log 2026-11-18T15:27' }));
    assert.equal(scalar(DB, `select source from public.task_authorizations where id = ${aid};`), 'lucas_relay');
    const b = newTask(DB);
    ok(cluster.psql(DB, `update public.task_auth_config set justin_tier_source = 'justin_signin', justin_user_id = '11111111-1111-1111-1111-111111111111';`));
    try {
      refused(authReq(DB, b, { tier: 'justin', rule: null, ref: 'x' }), /ET012: authorization refused: under task_auth_config justin_signin, this request may not write a Justin-tier record/);
      // a service_role request carrying his claims is still refused: only his own sign-in (the authenticated role) qualifies
      refused(authReq(DB, b, { tier: 'justin', rule: null, ref: 'x', sets: [`set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","aal":"aal2"}';`] }), /under task_auth_config justin_signin/);
      // a lucas-tier row is unaffected by the switch
      authId(authReq(DB, b));
    } finally {
      ok(cluster.psql(DB, `update public.task_auth_config set justin_tier_source = 'lucas_relay', justin_user_id = null;`));
    }
  });

  test('5. a client-set tier backfill or source migration_006 is refused (ET012)', () => {
    const id = newTask(DB);
    refused(authReq(DB, id, { tier: 'backfill' }), /ET012: authorization refused: tier backfill and source migration_006/);
    refused(authReq(DB, id, { extra: ', source', extraVals: ", 'migration_006'" }), /ET012: authorization refused: tier backfill and source migration_006/);
    // a client-set source of any other value is overwritten, never trusted
    const aid = authId(authReq(DB, id, { extra: ', source, actor, session_id', extraVals: ", 'justin_signin', 'justin', 'forged-session'" }));
    assert.equal(scalar(DB, `select source || ' ' || actor || ' ' || session_id from public.task_authorizations where id = ${aid};`), `lucas_relay lucas ${SESSION}`);
  });

  test('6. a row without x-evryn-session is refused (ET012)', () => {
    const id = newTask(DB);
    refused(authReq(DB, id, { session: null }), /ET012: authorization refused: the request carries no x-evryn-session header/);
  });

  test('7. UPDATE, DELETE and TRUNCATE on task_authorizations are refused as service_role (grants) and as the owner (ET013); anon and authenticated can neither read nor insert', () => {
    const { id } = openTask(DB);
    refused(req(DB, `update public.task_authorizations set note = 'x' where task_id = ${lit(id)};`), /permission denied for table task_authorizations/);
    refused(req(DB, `delete from public.task_authorizations where task_id = ${lit(id)};`), /permission denied for table task_authorizations/);
    refused(req(DB, 'truncate public.task_authorizations;'), /permission denied for table task_authorizations/);
    for (const body of [`update public.task_authorizations set note = 'x' where task_id = ${lit(id)};`, `delete from public.task_authorizations where task_id = ${lit(id)};`, 'truncate public.task_authorizations;']) {
      refused(req(DB, body, { role: null }), /ERROR: {2}ET013: task_authorizations (update|delete|truncate) refused: the authorization record is append-only/);
    }
    for (const role of ['anon', 'authenticated']) {
      refused(req(DB, 'select count(*) from public.task_authorizations;', { role }), /permission denied for table task_authorizations/);
      refused(authReq(DB, id, { role }), /permission denied for table task_authorizations/);
    }
  });

  test('8. the return: a description edit on an open task (by ac, and by lucas) leaves it proposed, unauthorized, flagged, with the forced note; note, needed_by, tags and in_progress → blocked keep the authorization', () => {
    for (const actor of ['ac', 'lucas']) {
      const { id } = openTask(DB);
      ok(upd(DB, id, `description = 'a different job'`, { actor }));
      assert.equal(field(DB, id, `status || ' ' || coalesce(authorization_id::text, 'NULL') || ' ' || needs_reauthorization`), 'proposed NULL true');
      assert.equal(scalar(DB, `select array_to_string(flags, ',') || ' | ' || note || ' | ' || actor from public.task_history where task_id = ${lit(id)} order by id desc limit 1;`),
        `reauthorization_needed | re-authorization needed: scope changed (description) | ${actor}`);
    }
    const { id, aid } = openTask(DB);
    ok(upd(DB, id, `note = 'progress: half done'`));
    ok(upd(DB, id, `needed_by = '2026-12-01'`));
    ok(upd(DB, id, `tags = array['v0.3']`));
    ok(upd(DB, id, `status = 'in_progress', note = 'started'`));
    ok(upd(DB, id, `status = 'blocked', note = 'waiting on soren'`));
    assert.equal(field(DB, id, `status || ' ' || authorization_id || ' ' || needs_reauthorization`), `blocked ${aid} false`);
  });

  test('9. the revert attack: after a return, editing the scope back and writing status open is refused', () => {
    const title = uniq('rev');
    const { id } = openTask(DB, { title });
    ok(upd(DB, id, `title = 'something else entirely'`));
    ok(upd(DB, id, `title = ${lit(title)}`));
    assert.equal(field(DB, id, 'status'), 'proposed');
    refused(upd(DB, id, `status = 'open', note = 'back as it was'`), /ET011/);
    refused(upd(DB, id, `status = 'open', authorization_id = (select max(id) from public.task_authorizations where task_id = ${lit(id)}), note = 'x'`), /ET014/);
  });

  test('10. a client write to authorization_id or needs_reauthorization is refused (ET014); a client scope_hash is overwritten', () => {
    const { id } = openTask(DB);
    const other = openTask(DB);
    refused(upd(DB, id, `authorization_id = ${other.aid}`), /ERROR: {2}ET014: task write refused: authorization_id is set only by an authorization record/);
    refused(upd(DB, id, 'authorization_id = null'), /ET014/);
    refused(upd(DB, id, 'needs_reauthorization = true'), /ET014: task write refused: needs_reauthorization is set only by the database/);
    const p = newTask(DB);
    ok(upd(DB, p, `scope_hash = 'forged'`));
    assert.equal(field(DB, p, 'scope_hash = public.task_scope_hash(title, description, raci->>\'r\')'), 'true');
    refused(req(DB, `insert into public.tasks (title, status, raci, authorization_id) values ('x', 'proposed', '{"r":"lucas"}', ${other.aid});`), /ET014/);
    refused(req(DB, `insert into public.tasks (title, status, raci, needs_reauthorization) values ('x', 'proposed', '{"r":"lucas"}', true);`), /ET014/);
    const forged = lastLine(ok(req(DB, `insert into public.tasks (title, status, raci, scope_hash) values ('x', 'proposed', '{"r":"lucas"}', 'forged') returning id;`)));
    assert.equal(field(DB, forged, 'scope_hash = public.task_scope_hash(title, description, raci->>\'r\')'), 'true');
  });

  test('11. acceptance: by ac refused; not needs_acceptance refused; lucas-tier acceptance of a Justin-tier authorization refused; justin-tier succeeds (done, closed_at, closing_note); a status write to done refused', () => {
    const id = newTask(DB);
    authId(authReq(DB, id, { tier: 'justin', rule: null, ref: 'his words, Log 15:27' }));
    const accept = (opts) => authReq(DB, id, { kind: 'acceptance', note: 'delivered: docs/x.md', ...opts });
    refused(accept({ tier: 'justin', rule: null, ref: 'x' }), /ET012: acceptance refused: the task is open, not needs_acceptance/);
    ok(upd(DB, id, `status = 'needs_acceptance', addressed_to = 'lucas', note = 'please accept'`));
    refused(accept({ actor: 'ac' }), /ET012: authorization refused: only lucas or justin/);
    refused(accept({}), /ET012: acceptance refused: Justin authorized this task himself/);
    refused(upd(DB, id, `status = 'done', closed_at = now(), closing_note = 'self-accepted'`), /ET011/);
    ok(accept({ tier: 'justin', rule: null, ref: 'his words at the 11/19 sitting' }));
    assert.equal(field(DB, id, `status || ' ' || (closed_at is not null) || ' ' || closing_note`), 'done true delivered: docs/x.md');
    // a lucas-tier authorization may be accepted at tier lucas
    const { id: l } = openTask(DB);
    ok(upd(DB, l, `status = 'needs_acceptance', addressed_to = 'lucas', note = 'please accept'`));
    ok(authReq(DB, l, { kind: 'acceptance', note: 'delivered' }));
    assert.equal(field(DB, l, 'status'), 'done');
  });

  test('12. moves: active → proposed by ac allowed; active → decided_against by ac refused, by lucas allowed; out of done by ac refused, by lucas only to proposed; a closed task\'s title edit by ac refused (ET015)', () => {
    const a = openTask(DB);
    ok(upd(DB, a.id, `status = 'proposed', note = 'withdrawn'`));
    assert.equal(field(DB, a.id, `status || ' ' || coalesce(authorization_id::text, 'NULL')`), 'proposed NULL');
    const b = openTask(DB);
    refused(upd(DB, b.id, `status = 'decided_against', closed_at = now(), closing_note = 'no'`), /ET011/);
    ok(upd(DB, b.id, `status = 'decided_against', closed_at = now(), closing_note = 'no: Log 15:40'`, { actor: 'lucas' }));
    const c = openTask(DB);
    ok(upd(DB, c.id, `status = 'needs_acceptance', addressed_to = 'lucas', note = 'please accept'`));
    ok(authReq(DB, c.id, { kind: 'acceptance', note: 'delivered' }));
    refused(upd(DB, c.id, `status = 'proposed', note = 'reopen'`), /ET011/);
    refused(upd(DB, c.id, `status = 'open', note = 'reopen'`, { actor: 'lucas' }), /ET011/);
    refused(upd(DB, c.id, `title = 'rewritten after the fact'`), /ERROR: {2}ET015: task update refused: only lucas or justin may change the title/);
    ok(upd(DB, c.id, `status = 'proposed', note = 'Justin sent it back'`, { actor: 'lucas' }));
    assert.equal(field(DB, c.id, `status || ' ' || coalesce(authorization_id::text, 'NULL')`), 'proposed NULL');
    // an owner may still withdraw its own unauthorized idea
    const d = newTask(DB);
    ok(upd(DB, d, `status = 'decided_against', closed_at = now(), closing_note = 'not worth it'`));
    // an active task cannot be parked in backlog by a client (only migration 006's data step moved such rows)
    const e = openTask(DB);
    refused(upd(DB, e.id, `status = 'backlog', needed_by = ${lit(ptPlus(DB, 10))}, note = 'park it'`), /ET011/);
  });

  test('13. the data steps, on a post-005 database with representative rows', () => {
    const { db, backlog, self, imported, done, proposed } = post005WithRows();
    const scopeBefore = scalar(db, `select string_agg(id || '|' || title || '|' || description || '|' || raci::text, E'\\n' order by id) from public.tasks;`);
    const r = apply006(db);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(scalar(db, `select status || ' ' || needed_by from public.tasks where id = ${lit(backlog)};`), `backlog ${ptPlus(db, 90)}`);
    for (const id of [self, imported]) {
      assert.equal(scalar(db, `select count(*) || ' ' || min(tier) || ' ' || min(source) || ' ' || min(actor) || ' ' || coalesce(min(session_id), 'NULL') from public.task_authorizations where task_id = ${lit(id)};`), '1 backfill migration_006 justin NULL');
      assert.equal(scalar(db, `select (t.authorization_id = a.id and t.status = 'open' and a.scope_hash = t.scope_hash)::text from public.tasks t join public.task_authorizations a on a.task_id = t.id where t.id = ${lit(id)};`), 'true');
    }
    assert.match(scalar(db, `select note from public.task_authorizations where task_id = ${lit(imported)};`), /last moved into an active status by task_history #\d+ \(ac\)\.$/);
    for (const id of [done, proposed, backlog]) assert.equal(scalar(db, `select count(*) from public.task_authorizations where task_id = ${lit(id)};`), '0');
    assert.equal(scalar(db, `select count(*) from public.tasks where scope_hash is distinct from public.task_scope_hash(title, description, raci->>'r');`), '0');
    assert.equal(scalar(db, `select string_agg(id || '|' || title || '|' || description || '|' || raci::text, E'\\n' order by id) from public.tasks;`), scopeBefore, 'a scope field changed');
    // the backfill row never starts work: it is not Justin-tier, and no client can write one
    assert.equal(scalar(db, `select count(*) from public.task_authorizations where tier = 'justin';`), '0');
  });

  test('14. the session stamp lands in task_history.session_id and task_authorizations.session_id; a malformed one is refused (ET002)', () => {
    const id = newTask(DB);
    assert.equal(scalar(DB, `select session_id from public.task_history where task_id = ${lit(id)};`), SESSION);
    const aid = authId(authReq(DB, id));
    assert.equal(scalar(DB, `select session_id from public.task_authorizations where id = ${aid};`), SESSION);
    refused(upd(DB, id, `note = 'x'`, { session: 'bad session!' }), /ERROR: {2}ET002: task write refused: the x-evryn-session header is not a valid session id/);
    refused(upd(DB, id, `note = 'x'`, { session: 'x'.repeat(65) }), /ET002/);
    // absent is allowed on an ordinary write (NULL recorded)
    ok(upd(DB, id, `note = 'no session'`, { session: null }));
    assert.equal(scalar(DB, `select coalesce(session_id, 'NULL') from public.task_history where task_id = ${lit(id)} order by id desc limit 1;`), 'NULL');
  });

  test('15. launcher is on the roster (not flagged) and is refused as an authorizer (ET012)', () => {
    const id = newTask(DB, { actor: 'launcher' });
    assert.equal(scalar(DB, `select cardinality(flags) from public.task_history where task_id = ${lit(id)};`), '0');
    refused(authReq(DB, id, { actor: 'launcher' }), /ET012: authorization refused: only lucas or justin/);
  });

  test('16. the hash is the database\'s: task_scope_hash() on a fixed vector equals the pinned value', () => {
    assert.equal(scalar(DB, `select public.task_scope_hash('Ship the vault', 'Install on the laptop', 'soren');`), SCOPE_HASH_VECTOR);
    // field boundaries cannot be faked by content
    assert.notEqual(scalar(DB, `select public.task_scope_hash('a","b', '', 'c');`), scalar(DB, `select public.task_scope_hash('a', 'b', 'c');`));
  });

  test('17. C4: the authorizing setting is bound to one row AND one task: two rows in one request move exactly their two tasks; a crafted write naming a row cannot move a third task; the setting reads \'\' after', () => {
    const a = newTask(DB);
    const b = newTask(DB);
    const c = newTask(DB);
    const r = req(DB, `
      insert into public.task_authorizations (task_id, kind, tier, rule_ref, note)
        select v.id::uuid, 'authorization', 'lucas', 'authorization-rules.md §1 item 1', 'bulk' from (values (${lit(a)}), (${lit(b)})) as v(id);
      select 'SETTING=' || coalesce(current_setting('evryn.authorizing', true), 'NULL');`, { actor: 'lucas' });
    assert.match(ok(r), /SETTING=$/m);
    assert.equal(field(DB, a, 'status'), 'open');
    assert.equal(field(DB, b, 'status'), 'open');
    const rowA = field(DB, a, 'authorization_id');
    // the crafted write: a setting naming row A (and its own task) cannot move task C
    refused(req(DB, `update public.tasks set authorization_id = ${rowA}, status = 'open', note = 'crafted' where id = ${lit(c)};`,
      { actor: 'lucas', sets: [`set local evryn.authorizing = '${rowA}:${a}';`] }), /ET014/);
    assert.equal(field(DB, c, `status || ' ' || coalesce(authorization_id::text, 'NULL')`), 'proposed NULL');
  });

  test('18. C5: the data-step exemption needs a non-client role — a service_role request carrying evryn.migration = 006 gets none; the owner with it does (the positive control)', () => {
    const { id } = openTask(DB, { extraCols: ', tags', extraVals: ", array['backlog']" });
    ok(upd(DB, id, `status = 'blocked', note = 'waiting'`));
    const mig = [`set local evryn.migration = '006';`];
    const backlogMove = `status = 'backlog', needed_by = ${lit(ptPlus(DB, 30))}, note = 'migration 006: pre-005 backlog item moved to backlog.'`;
    refused(upd(DB, id, backlogMove, { actor: 'justin', sets: mig }), /ET011/);
    const p = newTask(DB);
    refused(authReq(DB, p, { actor: 'justin', tier: 'backfill', session: null, sets: mig }), /ET012: authorization refused: tier backfill and source migration_006/);
    // the owner (the paste runs as the owner) with the setting: the named exemptions apply
    ok(upd(DB, id, backlogMove, { actor: 'justin', role: null, sets: mig }));
    assert.equal(field(DB, id, 'status'), 'backlog');
    ok(authReq(DB, p, { actor: 'justin', tier: 'backfill', session: null, role: null, sets: mig }));
    // ...and ET014 still applies to the data steps (the pointer moves only through evryn.authorizing)
    const q = openTask(DB);
    refused(upd(DB, q.id, 'authorization_id = null', { actor: 'justin', role: null, sets: mig }), /ET014/);
  });
});

// ---------------------------------------------------------------------------
// The 005 rules 006's replaced trigger must keep, re-proved on the 001–006 shape
// ---------------------------------------------------------------------------

suite(`006 keeps 005 (defaults ${MODE})`, () => {
  test('no actor → refused (ET001); created_by from the request; id, created_by and created_at immutable (ET003)', () => {
    refused(req(DB, `insert into public.tasks (title, status, raci) values ('x', 'proposed', '{"r":"lucas"}');`, { actor: null }), /ET001: task write refused: no actor/);
    const id = newTask(DB, { actor: 'mira' });
    assert.equal(field(DB, id, 'created_by'), 'mira');
    refused(upd(DB, id, `created_by = 'justin'`), /ET003: task update refused: created_by is immutable/);
    refused(upd(DB, id, 'id = gen_random_uuid()'), /ET003: task update refused: id is immutable/);
    refused(upd(DB, id, `created_at = '2000-01-01'`), /ET003: task update refused: created_at is immutable/);
  });

  test('Rule N (ET008): a status change with no note is refused; a repeated note counts as none', () => {
    const { id } = openTask(DB);
    refused(upd(DB, id, `status = 'in_progress'`), /ET008/);
    ok(upd(DB, id, `status = 'in_progress', note = 'same words'`));
    refused(upd(DB, id, `status = 'blocked', note = 'same words'`), /ET008/);
  });

  test('ET009: only lucas or justin sign; ET010: a backlog review date over 90 days is refused', () => {
    const id = newTask(DB);
    refused(upd(DB, id, `signed_at = now(), signed_ref = 'x'`, { actor: 'nathan' }), /ET009/);
    ok(upd(DB, id, `signed_at = now(), signed_ref = 'x'`, { actor: 'lucas' }));
    refused(req(DB, `insert into public.tasks (title, status, raci, needed_by) values ('b', 'backlog', '{"r":"lucas"}', ${lit(ptPlus(DB, 91))});`), /ET010/);
  });

  test('ET007: a parent cycle is refused; a no-change update writes no history row; delete is refused; history is append-only', () => {
    const a = newTask(DB);
    const b = newTask(DB);
    ok(upd(DB, a, `parent_id = ${lit(b)}`));
    refused(upd(DB, b, `parent_id = ${lit(a)}`), /ET007/);
    const before = scalar(DB, `select count(*) from public.task_history where task_id = ${lit(a)};`);
    ok(upd(DB, a, 'title = title, status = status'));
    assert.equal(scalar(DB, `select count(*) from public.task_history where task_id = ${lit(a)};`), before);
    refused(req(DB, `delete from public.tasks where id = ${lit(a)};`), /ET004/);
    refused(req(DB, `update public.task_history set actor = 'x' where task_id = ${lit(a)};`, { role: null }), /ET006/);
    refused(req(DB, `insert into public.task_history (task_id, actor, op) values (${lit(a)}, 'x', 'update');`, { role: null }), /ET005/);
  });

  test('an unknown status is still refused by tasks_status_allowed (not ET011), on insert and on update', () => {
    refused(req(DB, `insert into public.tasks (title, status, raci) values ('b', 'banana', '{"r":"lucas"}');`), /tasks_status_allowed/);
    refused(req(DB, `insert into public.tasks (title, raci) values ('no status', '{"r":"lucas"}');`), /tasks_status_allowed/);
  });
});

// ---------------------------------------------------------------------------
// CHANGE SET 006's pastes (005's pattern)
// ---------------------------------------------------------------------------

const runPaste = (db, text, { continueOnError = false } = {}) =>
  runPsql(cluster.targetFor(db), ['-q', '-A', '-t', ...(continueOnError ? ['-v', 'ON_ERROR_STOP=0'] : []), '-f', '-'], { input: text });
const runPasteCRLF = (db, text) => {
  const stmt = splitSql(text)[0];
  assert.ok(!stmt.includes('$crlf$') && !stmt.includes('$src$'), 'a wrapper tag occurs in the paste');
  return runPsql(cluster.targetFor(db), ['-q', '-A', '-t', '-f', '-'], {
    input: `do $crlf$ begin execute replace($src$${stmt}$src$, chr(10), chr(13) || chr(10)); end $crlf$;`,
  });
};
const rowsDigest = (db) => scalar(db, `select md5(coalesce(string_agg(to_jsonb(t)::text, E'\\n' order by t.id), '')) || ' ' || (select count(*) from public.task_history) from public.tasks t;`);

suite(`paste files, change set 006 (defaults ${MODE})`, () => {
  const p6 = buildPastes(changeSet('006'));

  test('Paste 1 on the post-005 shape raises "DRY RUN OK — nothing was changed (N rows; 0 NOT VALID; B backlog rows moved; A rows backfilled)" and changes NOTHING (both psql modes)', () => {
    for (const continueOnError of [false, true]) {
      const { db } = post005WithRows();
      const before = snap(db);
      const digest = rowsDigest(db);
      const r = runPaste(db, p6.dryRun, { continueOnError });
      assert.match(r.stderr, /ERROR: {2}DRY RUN OK — nothing was changed \(5 rows; 0 NOT VALID; 1 backlog rows moved; 2 rows backfilled\)/, r.stderr);
      assert.equal(snap(db), before, `the dry run changed something (continueOnError=${continueOnError})`);
      assert.equal(rowsDigest(db), digest);
    }
  });

  test('Paste 2 on the post-005 shape reaches exactly the new golden (= migrate.mjs\'s 001–006), with the data steps done', () => {
    const { db, self, imported } = post005WithRows();
    const r = runPaste(db, p6.apply);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(ourObjects(snap(db)), ourObjects(snap(DB)), 'the 006 paste and migrate.mjs produced different objects');
    golden('local-snapshot-after-006.txt', snap(db));
    assert.equal(scalar(db, `select count(*) from public.task_authorizations where tier = 'backfill' and task_id in (${lit(self)}, ${lit(imported)});`), '2');
    // and the new rules are live in it
    refused(req(db, `insert into public.tasks (title, status, raci) values ('x', 'open', '{"r":"lucas"}');`), /ET011/);
  });

  test('CRLF, as the editor sends it from a Windows clipboard: the 006 dry run and apply behave exactly as with LF', () => {
    const { db } = post005WithRows();
    const before = snap(db);
    assert.match(runPasteCRLF(db, p6.dryRun).stderr, /ERROR: {2}DRY RUN OK — nothing was changed \(5 rows; 0 NOT VALID; 1 backlog rows moved; 2 rows backfilled\)/);
    assert.equal(snap(db), before);
    const r = runPasteCRLF(db, p6.apply);
    assert.equal(r.status, 0, r.stderr);
    golden('local-snapshot-after-006.txt', snap(db));
  });

  test('a second Paste 2 is refused by its before-assertions and changes nothing; on the post-004 shape it refuses too', () => {
    const { db } = post005WithRows();
    assert.equal(runPaste(db, p6.apply).status, 0);
    const before = snap(db);
    refused(runPaste(db, p6.apply), /BEFORE-ASSERTION FAILED: task_authorizations or task_auth_config already exists/);
    assert.equal(snap(db), before);
    const old = migratedDb(nextDb('p4'), { through: '004' });
    const beforeOld = snap(old);
    refused(runPaste(old, p6.apply), /BEFORE-ASSERTION FAILED: task_history's columns are not the post-005 shape/);
    assert.equal(snap(old), beforeOld);
  });

  test('a deliberately BROKEN before-assertion refuses before anything runs; a BROKEN after-assertion rolls EVERYTHING back (both psql modes)', () => {
    const brokenBefore = p6.apply.replace('body_md5=f564a9be7ffeaa20db13902d5edcd38b', 'body_md5=00000000000000000000000000000000');
    assert.notEqual(brokenBefore, p6.apply, 'the before break did not apply');
    const { db } = post005WithRows();
    const before = snap(db);
    refused(runPaste(db, brokenBefore), /BEFORE-ASSERTION FAILED: task_roster, tasks_before_write, tasks_after_write or team_tasks_schema_snapshot is not the function 005/);
    assert.equal(snap(db), before);
    const brokenAfter = p6.apply.replace(AFTER_BREAK_FROM, AFTER_BREAK_TO);
    assert.notEqual(brokenAfter, p6.apply, 'the after break did not apply');
    for (const continueOnError of [false, true]) {
      const { db: d } = post005WithRows();
      const b = snap(d);
      const digest = rowsDigest(d);
      assert.match(runPaste(d, brokenAfter, { continueOnError }).stderr, /AFTER-ASSERTION FAILED/);
      assert.equal(snap(d), b, `a failed paste left changes behind (continueOnError=${continueOnError})`);
      assert.equal(rowsDigest(d), digest);
    }
  });

  // A breach INSIDE the paste must be caught by 006's own after-assertions.
  const inject = (sql) => {
    const anchor = '  -- (c) AFTER-ASSERTIONS for change set 006';
    assert.equal(p6.apply.split(anchor).length, 2, 'injection anchor not found exactly once');
    return p6.apply.replace(anchor, `  ${sql}\n${anchor}`);
  };
  for (const [label, sql, message] of [
    ['recreates a trigger (resetting ENABLE ALWAYS)', 'execute $inj$ drop trigger tasks_after_write on public.tasks $inj$; execute $inj$ create trigger tasks_after_write after insert or update on public.tasks for each row execute function public.tasks_after_write() $inj$;', /AFTER-ASSERTION FAILED: trigger\(s\) not ENABLE ALWAYS: tasks\.tasks_after_write=O/],
    ['alters public.proposals', 'execute $inj$ alter table public.proposals add column sneaky text $inj$;', /AFTER-ASSERTION FAILED: columns other than 006's four changed/],
    ['grants INSERT on task_auth_config to service_role', 'execute $inj$ grant insert on public.task_auth_config to service_role $inj$;', /AFTER-ASSERTION FAILED: task_auth_config grants/],
    ['grants UPDATE on task_authorizations to service_role', 'execute $inj$ grant update on public.task_authorizations to service_role $inj$;', /AFTER-ASSERTION FAILED: task_authorizations grants/],
    // (each sets an actor so the triggers let the write through, then clears it, so only the paste's own check can catch it)
    ['changes an existing title', "perform set_config('evryn.actor', 'ac', true); execute $inj$ update public.tasks set title = 'rewritten' where status = 'proposed' $inj$; perform set_config('evryn.actor', '', true);", /AFTER-ASSERTION FAILED: a field 006 must never change changed/],
    ['leaves an active task unbackfilled', "perform set_config('evryn.actor', 'ac', true); execute $inj$ alter table public.tasks disable trigger tasks_before_write $inj$; execute $inj$ update public.tasks set authorization_id = null where status = 'open' $inj$; execute $inj$ alter table public.tasks enable always trigger tasks_before_write $inj$; perform set_config('evryn.actor', '', true);", /AFTER-ASSERTION FAILED: every active task must point at its own authorization row/],
  ]) {
    test(`a migration that ${label} is caught INSIDE the 006 paste by its after-assertion — snapshot byte-identical`, () => {
      const { db } = post005WithRows();
      const before = snap(db);
      refused(runPaste(db, inject(sql)), message);
      assert.equal(snap(db), before);
    });
  }
});

// Pinned values (filled from the first green run; a change to either is a deliberate, reviewed edit).
const SCOPE_HASH_VECTOR = 'c4c6aa4c21a84b45c140f59e334f3a388321dff242f249074433ba7b8222c465';
// The pinned NEW body hash of tasks_before_write in 006's after-assertions, broken.
const AFTER_BREAK_FROM = 'body_md5=5f493f81525bb8aa777ff63c1c25279c';
const AFTER_BREAK_TO = 'body_md5=00000000000000000000000000000000';

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
