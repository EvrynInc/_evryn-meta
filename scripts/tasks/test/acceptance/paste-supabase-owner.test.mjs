/**
 * paste-supabase-owner.test.mjs — the COMMITTED pastes, run the way Supabase's SQL editor runs them: as `postgres`,
 * the schema owner, which on Supabase is NOT a superuser (QC6 NB3). Every other paste suite runs as a superuser
 * owner, so a statement only a superuser may run would pass there and fail on Justin's paste.
 *
 * On a cluster from cluster-supabase.mjs (bootstrap superuser supabase_admin): runtime 003, then the committed
 * 001-004 and 005 apply pastes, then representative rows, then the committed 006 dry run (its message asserted) and
 * the 006 apply, whose schema must equal the golden after-006 snapshot. Both default-privilege modes
 * (EVRYN_TASKS_DEFAULTS), as the other acceptance suites.
 *
 * Run:  node --test scripts/tasks/test/acceptance/paste-supabase-owner.test.mjs
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import '../helpers.mjs';
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TASKS_DIR } from '../helpers.mjs';
import { CODE_ROOT } from '../../lib/config.mjs';
import { changeSet } from '../../make-paste.mjs';
import { SNAPSHOT_SQL } from '../../schema-snapshot.mjs';
import { pgToolsAvailable, startSupabaseShapedCluster } from './cluster-supabase.mjs';

const RUNTIME_003 =
  process.env.EVRYN_TASKS_RUNTIME_003 ?? join(CODE_ROOT, 'evryn-team-runtime', 'migrations', '003_tasks_proposals.sql');
const FIXTURES = join(TASKS_DIR, 'test', 'fixtures');
const available = pgToolsAvailable() && existsSync(RUNTIME_003);
const MODE = process.env.EVRYN_TASKS_DEFAULTS === 'on' ? 'on' : 'off';
const DB = 'team';

let cluster;
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const asOwner = (sql) => cluster.psqlAs('postgres', DB, sql);
function ok(res, what = '') {
  assert.equal(res.status, 0, `expected success${what ? ` (${what})` : ''}, got: ${res.stderr}`);
  return res.stdout.trim();
}
const committed = (id, which) => readFileSync(changeSet(id).files[which], 'utf8');
const ourObjects = (s) => s.split(/\r?\n/).filter((l) => l !== '' && !l.startsWith('default-acl ') && !/^# server_version/.test(l)).join('\n');
const snap = () => `# target=local-loopback\n${ok(asOwner(SNAPSHOT_SQL), 'snapshot').split(/\r?\n/).filter((l) => l.trim() !== '').join('\n')}\n`;

/** A raw request as a PostgREST client: postgres (a member of service_role) switches to it, as PostgREST's authenticator does. */
const asClient = (actor, body) => asOwner([
  'begin;',
  'set local role service_role;',
  `set local request.headers = ${lit(JSON.stringify({ 'x-evryn-actor': actor }))};`,
  body,
  'commit;',
].join('\n'));

before(async () => {
  if (!available) return;
  cluster = await startSupabaseShapedCluster();
  ok(cluster.psqlAs('supabase_admin', 'postgres', `create database ${DB} owner postgres;`), 'create database');
  // The live project was built this way: Supabase's old default privileges in force when runtime 003 made tasks,
  // then (mode off) removed before our migrations ran.
  ok(asOwner(`grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;`), 'defaults on');
  ok(asOwner(readFileSync(RUNTIME_003, 'utf8')), 'runtime 003');
  if (MODE === 'off') {
    ok(asOwner(`alter default privileges in schema public revoke all on tables from anon, authenticated, service_role;
      alter default privileges in schema public revoke all on sequences from anon, authenticated, service_role;
      alter default privileges in schema public revoke all on functions from anon, authenticated, service_role;`), 'defaults off');
  }
});

after(() => {
  if (cluster) cluster.stop();
});

const suite = available ? describe : describe.skip;

test('the Supabase-owner paste suite actually ran (PostgreSQL 17 tools and runtime 003 were found)', () => {
  if (available || process.env.EVRYN_TASKS_ACCEPTANCE_OPTIONAL === '1') return;
  assert.fail('Supabase-owner paste suite SKIPPED: PostgreSQL tools or runtime 003 not found. Set EVRYN_TASKS_ACCEPTANCE_OPTIONAL=1 only if skipping is genuinely acceptable here.');
});

suite(`the committed pastes as a NON-superuser owner, as on Supabase (defaults ${MODE})`, () => {
  test('postgres owns the database and is not a superuser; supabase_admin is', () => {
    assert.equal(ok(asOwner(`select current_user || ' super=' || rolsuper from pg_roles where rolname = current_user;`)), 'postgres super=false');
    assert.equal(ok(asOwner(`select rolsuper::text from pg_roles where rolname = 'supabase_admin';`)), 'true');
  });

  test('001-004, 005, then 006 (dry run, apply) succeed as postgres; the dry run reports its counts and changes nothing; the apply reaches the golden after-006 snapshot', () => {
    ok(asOwner(committed('001-004', 'apply')), '001-004 apply');
    ok(asOwner(committed('005', 'apply')), '005 apply');
    // representative rows, made the way the live rows were made before 006
    ok(asClient('lucas', `insert into public.tasks (title, status, raci, tags, needed_by) values ('old backlog idea', 'blocked', '{"r":"lucas"}', array['backlog'], ((now() at time zone 'America/Los_Angeles')::date + 120));`));
    ok(asClient('lucas', `insert into public.tasks (title, status, raci) values ('self-created open', 'open', '{"r":"lucas"}');`));
    ok(asClient('ac', `insert into public.tasks (title, status, raci, linear_id) values ('imported from linear', 'open', '{"r":"lucas"}', 'EVR-777');`));
    ok(asClient('lucas', `insert into public.tasks (title, status, raci) values ('finished work', 'open', '{"r":"lucas"}');
      update public.tasks set status = 'done', closed_at = now(), closing_note = 'shipped' where title = 'finished work';`));
    ok(asClient('mira', `insert into public.tasks (title, status, raci) values ('an idea for later', 'proposed', '{"r":"lucas"}');`));

    const before = snap();
    const dry = asOwner(committed('006', 'dryRun'));
    assert.match(dry.stderr, /ERROR: {2}DRY RUN OK — nothing was changed \(5 rows; 0 NOT VALID; 1 backlog rows moved; 2 rows backfilled\)/, dry.stderr);
    assert.equal(snap(), before, 'the dry run changed something');

    ok(asOwner(committed('006', 'apply')), '006 apply');
    const golden = readFileSync(join(FIXTURES, 'local-snapshot-after-006.txt'), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(ourObjects(snap()), ourObjects(golden), 'the 006 paste as a non-superuser owner did not reach the golden after-006 snapshot');
    assert.equal(ok(asOwner(`select count(*) from public.task_authorizations where tier = 'backfill';`)), '2');
    // and the new rules are live in it
    const r = asClient('ac', `insert into public.tasks (title, status, raci) values ('x', 'open', '{"r":"lucas"}');`);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /only an authorization record/);
  });
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
