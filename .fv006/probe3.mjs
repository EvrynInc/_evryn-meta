// FV006's third probe (throwaway; sandbox only). Loopback only, never reads a .env.
// The committed 006 pastes at something like live scale (hundreds of rows), sent with CRLF line endings (a Windows
// clipboard), as the NON-superuser owner, with Supabase's old default privileges ON (the live mode).
process.env.EVRYN_TASKS_TEST_MODE = '1';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TASKS = join(HERE, '..', 'scripts', 'tasks');
const imp = (rel) => import(pathToFileURL(join(TASKS, rel)).href);
const { startSupabaseShapedCluster } = await imp('test/acceptance/cluster-supabase.mjs');
const { changeSet } = await imp('make-paste.mjs');
const { SNAPSHOT_SQL } = await imp('schema-snapshot.mjs');
const { splitSql } = await imp('lib/sqlsplit.mjs');
const RUNTIME_003 = process.env.EVRYN_TASKS_RUNTIME_003;
const DB = 'team';
const out = [];
const log = (s = '') => out.push(s);
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

const cluster = await startSupabaseShapedCluster();
console.log(`cluster dir: ${cluster.dir} port ${cluster.port}`);
const own = (sql) => cluster.psqlAs('postgres', DB, sql);
const must = (res, what = '') => {
  if (res.status !== 0) throw new Error(`setup failed ${what}: ${res.stderr.slice(0, 1500)}`);
  return res.stdout.trim();
};
const q = (sql) => must(own(sql), sql.slice(0, 80));
const api = (sql, actor) => cluster.psqlAs('authenticator', DB, ['begin;', 'set local role service_role;', `set local request.headers = ${lit(JSON.stringify({ 'x-evryn-actor': actor }))};`, sql, 'commit;'].join('\n'));
const committed = (id, which) => readFileSync(changeSet(id).files[which], 'utf8');
const ourObjects = (s) => s.split(/\r?\n/).filter((l) => l !== '' && !l.startsWith('default-acl ') && !/^# server_version/.test(l)).join('\n');
const snap = () => `# target=local-loopback\n${q(SNAPSHOT_SQL).split(/\r?\n/).filter((l) => l.trim() !== '').join('\n')}\n`;
/** The paste as the editor sends it from a Windows clipboard: the one DO statement, every LF turned into CRLF. */
const crlf = (text) => {
  const stmts = splitSql(text);
  const body = stmts[0];
  if (body.includes('$crlf$') || body.includes('$src$')) throw new Error('wrapper tag occurs in the paste');
  return `do $crlf$ begin execute replace($src$${body}$src$, chr(10), chr(13) || chr(10)); end $crlf$;`;
};

try {
  must(cluster.psqlAs('supabase_admin', 'postgres', `create database ${DB} owner postgres;`), 'create db');
  must(own(`grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;`), 'defaults ON');
  must(own(readFileSync(RUNTIME_003, 'utf8')), 'runtime 003');
  must(own(committed('001-004', 'apply')), '001-004');
  must(own(committed('005', 'apply')), '005');
  const seed = (actor, sql) => must(api(sql, actor), 'seed');
  seed('soren', `insert into public.tasks (title,status,raci) select 'bulk open ' || g, 'open', '{"r":"soren"}' from generate_series(1,150) g;`);
  seed('mira', `insert into public.tasks (title,status,raci) select 'bulk in progress ' || g, 'in_progress', '{"r":"mira"}' from generate_series(1,20) g;`);
  seed('lucas', `insert into public.tasks (title,status,raci,tags,needed_by) select 'bulk pre-005 backlog ' || g, 'blocked', '{"r":"emma"}', array['backlog'], case when g <= 10 then null when g <= 20 then (now() at time zone 'America/Los_Angeles')::date + 200 else (now() at time zone 'America/Los_Angeles')::date + 20 end from generate_series(1,30) g;`);
  seed('lucas', `insert into public.tasks (title,status,raci) select 'bulk to be done ' || g, 'open', '{"r":"lucas"}' from generate_series(1,40) g;`);
  seed('lucas', `update public.tasks set status='done', closed_at=now(), closing_note='shipped' where title like 'bulk to be done %';`);
  seed('nathan', `insert into public.tasks (title,status,raci) select 'bulk proposed ' || g, 'proposed', '{"r":"nathan"}' from generate_series(1,25) g;`);
  seed('thea', `insert into public.tasks (title,status,raci,needed_by) select 'bulk real backlog ' || g, 'backlog', '{"r":"thea"}', (now() at time zone 'America/Los_Angeles')::date + 30 from generate_series(1,10) g;`);
  log(`seeded: ${q(`select string_agg(status || '=' || c, ', ' order by status) from (select status, count(*) c from public.tasks group by status) s`)}; history rows ${q('select count(*) from public.task_history')}`);

  const before = snap();
  let t = Date.now();
  const dry = own(crlf(committed('006', 'dryRun')));
  log(`CRLF dry run as postgres (non-superuser): exit ${dry.status} in ${((Date.now() - t) / 1000).toFixed(1)} s :: ${(dry.stderr.match(/ERROR:.*$/m) || ['(no error line)'])[0].replace(/\r/g, '')}`);
  log(`schema unchanged after the dry run: ${snap() === before}; task_authorizations exists: ${q(`select (to_regclass('public.task_authorizations') is not null)::text`)}`);
  t = Date.now();
  const ap = own(crlf(committed('006', 'apply')));
  log(`CRLF apply: exit ${ap.status} in ${((Date.now() - t) / 1000).toFixed(1)} s ${ap.status === 0 ? '' : ap.stderr.slice(0, 500)}`);
  const golden = readFileSync(join(TASKS, 'test', 'fixtures', 'local-snapshot-after-006.txt'), 'utf8').replace(/\r\n/g, '\n');
  log(`reaches the golden after-006 snapshot: ${ourObjects(snap()) === ourObjects(golden)}`);
  log(`after: ${q(`select string_agg(status || '=' || c, ', ' order by status) from (select status, count(*) c from public.tasks group by status) s`)}`);
  log(`authorization rows: ${q(`select string_agg(tier || '/' || kind || '=' || c, ', ') from (select tier, kind, count(*) c from public.task_authorizations group by tier, kind) s`)}`);
  log(`active tasks pointing at exactly their own backfill row: ${q(`select count(*) from public.tasks t where t.status in ('open','in_progress','blocked','needs_acceptance') and (select count(*) from public.task_authorizations a where a.task_id = t.id) = 1 and exists (select 1 from public.task_authorizations a where a.id = t.authorization_id and a.task_id = t.id and a.scope_hash = t.scope_hash)`)} of ${q(`select count(*) from public.tasks where status in ('open','in_progress','blocked','needs_acceptance')`)}`);
  log(`tasks with two or more authorization rows: ${q(`select count(*) from (select task_id from public.task_authorizations group by task_id having count(*) > 1) s`)}; non-active tasks with a pointer: ${q(`select count(*) from public.tasks where status not in ('open','in_progress','blocked','needs_acceptance') and authorization_id is not null`)}`);
  log(`moved backlog rows by review date: ${q(`select string_agg(d || ' x' || c, ', ' order by d) from (select (needed_by - (now() at time zone 'America/Los_Angeles')::date) as d, count(*) c from public.tasks where title like 'bulk pre-005 backlog %' group by 1) s`)} (days from today)`);
  log(`rows whose scope_hash is missing or wrong: ${q(`select count(*) from public.tasks where scope_hash is distinct from public.task_scope_hash(title, description, raci->>'r')`)}; history rows now ${q('select count(*) from public.task_history')}`);
  log(`function bodies stored with a carriage return (CRLF paste): ${q(`select count(*) from pg_proc where pronamespace='public'::regnamespace and proname like 'task%' and position(chr(13) in prosrc) > 0`)} of ${q(`select count(*) from pg_proc where pronamespace='public'::regnamespace and proname like 'task%'`)}`);
  // a CRLF-pasted trigger still works: one authorization through the API shape
  const id = must(api(`insert into public.tasks (title,status,raci) values ('after crlf','proposed','{"r":"soren"}') returning id;`, 'soren')).split('\n').pop();
  const a = cluster.psqlAs('authenticator', DB, ['begin;', 'set local role service_role;', `set local request.headers = '{"x-evryn-actor":"lucas","x-evryn-session":"cccccccc-1111-2222-3333-444444444444"}';`, `insert into public.task_authorizations (task_id, kind, tier, rule_ref, note) values (${lit(id)}, 'authorization', 'lucas', 'rule', 'go') returning id;`, 'commit;'].join('\n'));
  log(`an authorization on the CRLF-pasted database: exit ${a.status}; task ${q(`select status from public.tasks where id=${lit(id)}`)}`);
} catch (e) {
  log(`HARNESS ERROR: ${e.message}`);
} finally {
  cluster.stop();
  writeFileSync(join(HERE, 'probe3-out.txt'), out.join('\n') + '\n', 'utf8');
  console.log(out.join('\n'));
}
