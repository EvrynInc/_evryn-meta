// FV006's second probe run (throwaway; sandbox only). Loopback only, never reads a .env.
// 1. The paste racing a task write that is in flight (does Paste 2 fail, and is the failure safe?).
// 2. A scope edit racing an authorization insert (real concurrency, both orders).
// 3. Replays of a superseded authorization / acceptance row by someone who can set evryn.authorizing (NOT API-reachable).
// 4. Follow-ups to run 1: the withdraw route around the Justin-tier acceptance rule; scope-edit-then-close; a repeated closing note.
process.env.EVRYN_TASKS_TEST_MODE = '1';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TASKS = join(HERE, '..', 'scripts', 'tasks');
const imp = (rel) => import(pathToFileURL(join(TASKS, rel)).href);
const { startSupabaseShapedCluster } = await imp('test/acceptance/cluster-supabase.mjs');
const { changeSet } = await imp('make-paste.mjs');
const { findPgTool, pgEnv } = await imp('lib/pg.mjs');
const RUNTIME_003 = process.env.EVRYN_TASKS_RUNTIME_003;
const DB = 'team';
const SESSION = 'bbbbbbbb-1111-2222-3333-444444444444';

const out = [];
const log = (s = '') => out.push(s);
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lastLine = (s) => s.trim().split('\n').pop();
const firstErr = (res) => ((res.stderr.match(/ERROR:.*$/m) || [''])[0] + ' ' + ((res.stderr.match(/HINT:.*$/m) || [''])[0])).trim().slice(0, 260);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cluster = await startSupabaseShapedCluster();
console.log(`cluster dir: ${cluster.dir} port ${cluster.port}`);
const own = (sql) => cluster.psqlAs('postgres', DB, sql);
const must = (res, what = '') => {
  if (res.status !== 0) throw new Error(`setup failed ${what}: ${res.stderr.slice(0, 1500)}`);
  return res.stdout.trim();
};
const q = (sql) => must(own(sql), sql.slice(0, 80));
const wrap = (sql, { role = 'service_role', actor = 'ac', session = SESSION, sets = [] } = {}) => {
  const h = {};
  if (actor) h['x-evryn-actor'] = actor;
  if (session) h['x-evryn-session'] = session;
  return ['\\set VERBOSITY verbose', 'begin;', `set local role ${role};`, `set local request.headers = ${lit(JSON.stringify(h))};`, ...sets, sql, 'commit;'].join('\n');
};
const api = (sql, o) => cluster.psqlAs('authenticator', DB, wrap(sql, o));
/** The same request, but asynchronous, so two sessions can overlap. Resolves { status, stdout, stderr }. */
function apiAsync(sql, o, user = 'authenticator') {
  return new Promise((resolve) => {
    const p = spawn(findPgTool('psql'), ['-X', '-v', 'ON_ERROR_STOP=1', '-q', '-A', '-t', '-f', '-'], { env: pgEnv(cluster.targetFor(DB, user)), windowsHide: true });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (b) => { stdout += b; });
    p.stderr.on('data', (b) => { stderr += b; });
    p.on('close', (status) => resolve({ status, stdout, stderr }));
    p.stdin.end(user === 'authenticator' ? wrap(sql, o) : sql);
  });
}
const committed = (id, which) => readFileSync(changeSet(id).files[which], 'utf8');

try {
  must(cluster.psqlAs('supabase_admin', 'postgres', `create database ${DB} owner postgres;`), 'create db');
  must(own(`grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;`), 'defaults ON');
  must(own(readFileSync(RUNTIME_003, 'utf8')), 'runtime 003');
  must(own(committed('001-004', 'apply')), '001-004');
  must(own(committed('005', 'apply')), '005');
  const pre = (actor, cols, vals) => lastLine(must(api(`insert into public.tasks (${cols}) values (${vals}) returning id;`, { actor, session: null }), 'seed'));
  const a0 = pre('soren', 'title,status,raci', `'self-created open','open','{"r":"soren"}'`);
  pre('lucas', 'title,status,raci,tags', `'pre-005 backlog','blocked','{"r":"soren"}',array['backlog']`);
  pre('mira', 'title,status,raci', `'a proposal','proposed','{"r":"mira"}'`);

  // ------------------------------------------------------------ 1. the paste, with a task write in flight
  log('== 1. Paste 2 while an agent\'s task write is in flight (uncommitted for ~3 s) ==');
  const inflight = apiAsync(`update public.tasks set note='a write in flight during the paste' where id=${lit(a0)}; select pg_sleep(3);`, { actor: 'soren', session: null });
  await sleep(900);
  const t0 = Date.now();
  const raced = own(committed('006', 'apply'));
  const f1 = await inflight;
  log(`in-flight write: exit ${f1.status} ${firstErr(f1)}`);
  log(`paste: exit ${raced.status} after ${((Date.now() - t0) / 1000).toFixed(1)} s :: ${firstErr(raced) || 'applied'}`);
  log(`006 applied? task_authorizations exists: ${q(`select (to_regclass('public.task_authorizations') is not null)::text`)}; the in-flight write survived: ${q(`select coalesce(note,'NULL') from public.tasks where id=${lit(a0)}`)}`);
  if (raced.status !== 0) {
    const again = own(committed('006', 'apply'));
    log(`re-run of the same paste, nothing in flight: exit ${again.status} ${firstErr(again)}`);
  }
  log('-- and with the write held longer than the paste\'s 5 s lock timeout: reasoned, not executed (the ALTER TABLE gives up with a lock-timeout error; nothing changes) --');

  // ------------------------------------------------------------ helpers, post-006
  let n = 0;
  const uniq = (p) => `${p} ${(n += 1)}`;
  const RULE = 'authorization-rules.md s1 item 1';
  const newTask = ({ actor = 'soren', title = uniq('task'), owner = 'soren' } = {}) =>
    lastLine(must(api(`insert into public.tasks (title, status, raci) values (${lit(title)}, 'proposed', ${lit(JSON.stringify({ r: owner }))}::jsonb) returning id;`, { actor }), 'newTask'));
  const authSql = (id, { kind = 'authorization', tier = 'lucas', note = 'go' } = {}) =>
    `insert into public.task_authorizations (task_id, kind, tier, rule_ref, justin_ref, note) values (${lit(id)}, ${lit(kind)}, ${lit(tier)}, ${tier === 'lucas' ? lit(RULE) : 'null'}, ${tier === 'justin' ? lit('Log 11/20, his words') : 'null'}, ${lit(note)}) returning id;`;
  const auth = (id, o = {}) => api(authSql(id, o), { actor: o.actor ?? 'lucas' });
  const upd = (id, set, o) => api(`update public.tasks set ${set} where id = ${lit(id)};`, o);
  const st = (id) => q(`select status || ' ptr=' || coalesce(authorization_id::text,'NULL') || ' reauth=' || needs_reauthorization || ' | row hash = current authorization hash: ' || coalesce((select (a.scope_hash = t.scope_hash)::text from public.task_authorizations a where a.id = t.authorization_id), 'n/a') from public.tasks t where id = ${lit(id)}`);
  const openTask = (o) => { const id = newTask(o); const aid = lastLine(must(auth(id), 'openTask')); return { id, aid }; };

  // ------------------------------------------------------------ 2. real concurrency: scope edit vs authorization
  log('');
  log('== 2. A scope edit racing an authorization (two overlapping sessions) ==');
  const r1 = newTask();
  const A = apiAsync(`${authSql(r1)} select pg_sleep(2);`, { actor: 'lucas' });
  await sleep(700);
  const B = await apiAsync(`update public.tasks set description='edited while the authorization was uncommitted' where id=${lit(r1)};`, { actor: 'soren' });
  const Ar = await A;
  log(`2a authorization first (held open 2 s), edit second: authorization exit ${Ar.status}, edit exit ${B.status} ${firstErr(B)}; task now ${st(r1)}`);
  const r2 = newTask();
  const B2 = apiAsync(`update public.tasks set description='edited first, uncommitted for 2 s' where id=${lit(r2)}; select pg_sleep(2);`, { actor: 'soren' });
  await sleep(700);
  const A2 = await apiAsync(authSql(r2), { actor: 'lucas' });
  await B2;
  log(`2b edit first (held open 2 s), authorization second: authorization exit ${A2.status} ${firstErr(A2)}; task now ${st(r2)}; the record's scope body: '${q(`select scope->>'description' from public.task_authorizations where task_id=${lit(r2)}`)}'`);

  // ------------------------------------------------------------ 3. replays (need evryn.authorizing; not reachable through PostgREST)
  log('');
  log('== 3. Replaying a superseded row, by someone who can set evryn.authorizing (owner or SQL access only) ==');
  const w = openTask();
  must(upd(w.id, `status='proposed', note='withdrawn by its owner'`, { actor: 'soren' }), 'withdraw');
  const rp = upd(w.id, `status='open', authorization_id=${w.aid}, note='replay of the withdrawn yes'`, { actor: 'ac', sets: [`set local evryn.authorizing = '${w.aid}:${w.id}';`] });
  log(`3a withdrawn task, its OLD authorization row replayed by ac: exit ${rp.status} ${firstErr(rp)}; task now ${st(w.id)}`);
  const x = openTask();
  must(upd(x.id, `status='needs_acceptance', addressed_to='lucas', note='please accept'`, { actor: 'soren' }));
  const acc1 = lastLine(must(auth(x.id, { kind: 'acceptance', note: 'delivered once' }), 'accept 1'));
  must(upd(x.id, `status='proposed', note='sent back'`, { actor: 'lucas' }));
  must(auth(x.id), 're-authorize');
  must(upd(x.id, `status='needs_acceptance', addressed_to='lucas', note='second hand-in'`, { actor: 'soren' }));
  const rp2 = upd(x.id, `status='done', closed_at=now(), closing_note='self-accepted with the old acceptance row'`, { actor: 'ac', sets: [`set local evryn.authorizing = '${acc1}:${x.id}';`] });
  log(`3b reopened and re-handed-in task, its OLD acceptance row replayed by ac: exit ${rp2.status} ${firstErr(rp2)}; task now ${st(x.id)}`);

  // ------------------------------------------------------------ 4. follow-ups
  log('');
  log('== 4. Follow-ups ==');
  const j = newTask(); must(auth(j, { tier: 'justin' }), 'justin auth');
  must(upd(j, `status='proposed', note='withdrawn'`, { actor: 'lucas' }));
  const la = auth(j, { tier: 'lucas', note: 'continuing' });
  must(upd(j, `status='needs_acceptance', addressed_to='lucas', note='hand in'`, { actor: 'soren' }));
  const lacc = auth(j, { kind: 'acceptance', note: 'delivered' });
  log(`4a Justin-tier task: withdrawn, re-authorized at tier lucas, handed in, accepted at tier lucas: exit ${la.status}/${lacc.status} ${firstErr(lacc)}; task now ${st(j)}; rows: ${q(`select string_agg(kind || ':' || tier, ', ' order by id) from public.task_authorizations where task_id=${lit(j)}`)}`);
  const k = openTask({ owner: 'soren' });
  const e1 = upd(k.id, `description='rewritten by ac'`, { actor: 'ac' });
  const e2 = upd(k.id, `status='decided_against', closed_at=now(), closing_note='no'`, { actor: 'ac' });
  log(`4b ac edits the body of soren's authorized task (returns it), then closes it as decided_against: exit ${e1.status}/${e2.status}; task now ${st(k.id)}`);
  const c = newTask();
  must(upd(c, `status='decided_against', closed_at=now(), closing_note='not worth it'`, { actor: 'soren' }));
  must(upd(c, `status='proposed', note='reopened'`, { actor: 'lucas' }));
  const again = upd(c, `status='decided_against', closed_at=now(), closing_note='not worth it'`, { actor: 'soren' });
  log(`4c a reopened task closed again with the SAME closing note (the CLI close shape): exit ${again.status} ${firstErr(again)}`);
  const jj = newTask();
  const ja = api(authSql(jj, { tier: 'justin' }), { actor: 'justin' });
  log(`4d known residual, for the record: service_role sending actor justin writes a Justin-tier row under lucas_relay: exit ${ja.status}; ${q(`select coalesce(string_agg(tier || '/' || source || '/' || actor, ','), '-') from public.task_authorizations where task_id=${lit(jj)}`)}`);
} catch (e) {
  log(`HARNESS ERROR: ${e.message}`);
} finally {
  cluster.stop();
  writeFileSync(join(HERE, 'probe2-out.txt'), out.join('\n') + '\n', 'utf8');
  console.log(out.join('\n'));
}
