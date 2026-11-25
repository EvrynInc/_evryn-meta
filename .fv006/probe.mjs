// FV006's probe harness (throwaway; lives only in the sandbox). Loopback only, never reads a .env.
// Builds a Supabase-shaped cluster (postgres = NON-superuser owner), the live path (runtime 003, the committed
// 001-004 and 005 pastes, old default privileges ON as on live), a seed shaped like live rows, then the committed
// 006 dry run and apply, then attack and legitimate-path probes as PostgREST would send them
// (connect as authenticator, SET LOCAL ROLE, request.headers).
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
const RUNTIME_003 = process.env.EVRYN_TASKS_RUNTIME_003;
const DB = 'team';
const SESSION = 'aaaaaaaa-1111-2222-3333-444444444444';

const out = [];
const log = (s = '') => out.push(s);
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lastLine = (s) => s.trim().split('\n').pop();
const firstErr = (res) => ((res.stderr.match(/ERROR:.*$/m) || [''])[0] + ' ' + ((res.stderr.match(/HINT:.*$/m) || [''])[0])).trim().slice(0, 230);

const cluster = await startSupabaseShapedCluster();
console.log(`cluster dir: ${cluster.dir} port ${cluster.port}`);

const own = (sql) => cluster.psqlAs('postgres', DB, sql);
const must = (res, what = '') => {
  if (res.status !== 0) throw new Error(`setup failed ${what}: ${res.stderr.slice(0, 1500)}`);
  return res.stdout.trim();
};
const q = (sql) => must(own(sql), sql.slice(0, 80));

/** A request as PostgREST sends it: authenticator logs in, switches role, sets request.headers. */
function api(sql, { role = 'service_role', actor = 'ac', session = SESSION, sets = [], claims } = {}) {
  const h = {};
  if (actor) h['x-evryn-actor'] = actor;
  if (session) h['x-evryn-session'] = session;
  const lines = ['\\set VERBOSITY verbose', 'begin;', `set local role ${role};`,
    `set local request.headers = ${lit(JSON.stringify(h))};`,
    `set local request.jwt.claims = ${lit(JSON.stringify(claims ?? { role }))};`,
    ...sets, sql, 'commit;'];
  return cluster.psqlAs('authenticator', DB, lines.join('\n'));
}

/** Record one probe. expect: 'refuse' (an attack that must be refused) or 'ok' (a legitimate path that must work). */
function R(id, desc, res, expect, pat) {
  const refused = res.status !== 0;
  let verdict;
  if (expect === 'refuse') verdict = refused && (!pat || pat.test(res.stderr)) ? 'held   ' : (refused ? 'held?  ' : 'BYPASS ');
  else verdict = refused ? 'REFUSED' : 'works  ';
  log(`[${verdict}] ${id} ${desc} :: ${refused ? firstErr(res) : 'ok ' + res.stdout.trim().replace(/\s+/g, ' ').slice(0, 110)}`);
  return !refused;
}

const ourObjects = (s) => s.split(/\r?\n/).filter((l) => l !== '' && !l.startsWith('default-acl ') && !/^# server_version/.test(l)).join('\n');
const snap = () => `# target=local-loopback\n${q(SNAPSHOT_SQL).split(/\r?\n/).filter((l) => l.trim() !== '').join('\n')}\n`;
const committed = (id, which) => readFileSync(changeSet(id).files[which], 'utf8');
const d = (n) => q(`select ((now() at time zone 'America/Los_Angeles')::date + (${n}))::text`);

try {
  // ---------------------------------------------------------------- build the live path
  must(cluster.psqlAs('supabase_admin', 'postgres', `create database ${DB} owner postgres;`), 'create db');
  must(own(`grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;`), 'defaults ON, as live');
  must(own(readFileSync(RUNTIME_003, 'utf8')), 'runtime 003');
  must(own(`insert into public.tasks (title, status, raci) values ('legacy row from before the task system', 'open', '{"r":"lucas","a":"justin"}');`), 'legacy row');
  must(own(committed('001-004', 'apply')), '001-004 apply');
  must(own(committed('005', 'apply')), '005 apply');
  log(`postgres is superuser: ${q(`select rolsuper::text from pg_roles where rolname = 'postgres'`)}; owner of public.tasks: ${q(`select pg_get_userbyid(relowner) from pg_class where oid = 'public.tasks'::regclass`)}`);

  const pre = (actor, cols, vals) => lastLine(must(api(`insert into public.tasks (${cols}) values (${vals}) returning id;`, { actor, session: null }), `seed ${vals.slice(0, 40)}`));
  const S = {};
  S.legacy = q(`select id from public.tasks where title like 'legacy row%'`);
  S.bk120 = pre('lucas', 'title,status,raci,tags,needed_by', `'pre-005 backlog, review +120','blocked','{"r":"soren"}',array['backlog','eng'],'${d(120)}'`);
  S.bkNull = pre('lucas', 'title,status,raci,tags', `'pre-005 backlog, no date','blocked','{"r":"soren"}',array['backlog']`);
  S.bkPast = pre('lucas', 'title,status,raci,tags,needed_by', `'pre-005 backlog, date past','blocked','{"r":"soren"}',array['backlog'],'${d(-5)}'`);
  S.bk70 = pre('lucas', 'title,status,raci,tags,needed_by', `'pre-005 backlog, review +70','blocked','{"r":"soren"}',array['backlog'],'${d(70)}'`);
  S.realBacklog = pre('soren', 'title,status,raci,needed_by', `'a real post-005 backlog idea','backlog','{"r":"soren"}','${d(30)}'`);
  S.open = pre('soren', 'title,status,raci,note', `'self-created open','open','{"r":"soren","a":"lucas"}','a standing note on the row'`);
  S.inprog = pre('soren', 'title,status,raci', `'in progress work','in_progress','{"r":"soren","a":"justin"}'`);
  S.blocked = pre('mira', 'title,status,raci', `'blocked, no backlog tag','blocked','{"r":"mira"}'`);
  S.na = pre('soren', 'title,status,raci,addressed_to', `'handed in to lucas','needs_acceptance','{"r":"soren"}','lucas'`);
  S.naJ = pre('soren', 'title,status,raci,addressed_to,needed_by', `'handed in, addressed to justin','needs_acceptance','{"r":"soren","a":"justin"}','justin','${d(3)}'`);
  S.done = pre('lucas', 'title,status,raci', `'finished work','open','{"r":"lucas"}'`);
  must(api(`update public.tasks set status='done', closed_at=now(), closing_note='shipped' where id=${lit(S.done)};`, { actor: 'lucas', session: null }));
  S.against = pre('emma', 'title,status,raci', `'an idea decided against','proposed','{"r":"emma"}'`);
  must(api(`update public.tasks set status='decided_against', closed_at=now(), closing_note='no' where id=${lit(S.against)};`, { actor: 'emma', session: null }));
  S.proposed = pre('mira', 'title,status,raci,addressed_to', `'a proposal waiting','proposed','{"r":"mira"}','lucas'`);
  S.signed = pre('soren', 'title,status,raci', `'signed by justin via lucas','open','{"r":"soren","a":"justin"}'`);
  must(api(`update public.tasks set signed_at=now(), signed_ref='Log 11/06' where id=${lit(S.signed)};`, { actor: 'lucas', session: null }));
  S.child = pre('soren', 'title,status,raci,parent_id', `'child of open','open','{"r":"soren"}',${lit(S.open)}`);
  S.linear = pre('ac', 'title,status,raci,linear_id,linear_status', `'imported from linear','open','{"r":"nathan"}','EVR-777','Authorized'`);

  const dumpSql = (extra) => `select coalesce(json_agg(x order by x.short_id), '[]') from (select short_id, id, title, status, needed_by::text as needed_by, note, updated_at::text as updated_at${extra} from public.tasks) x`;
  const before = JSON.parse(q(dumpSql('')));
  const snapBefore = snap();
  const digest = () => q(`select md5(coalesce(string_agg(to_jsonb(t)::text, E'\\n' order by t.id), '')) || ' hist=' || (select count(*) from public.task_history) from public.tasks t`);
  const digBefore = digest();

  // ---------------------------------------------------------------- the committed 006 pastes, as the non-superuser owner
  log('');
  log('== PASTE 1 (dry run), as postgres (not a superuser), defaults ON ==');
  const dry = own(committed('006', 'dryRun'));
  log(`exit ${dry.status} :: ${(dry.stderr.match(/ERROR:.*$/m) || ['(no error line)'])[0]}`);
  log(`schema unchanged: ${snap() === snapBefore}; rows+history unchanged: ${digest() === digBefore}`);
  log('== PASTE 2 (apply) ==');
  const ap = own(committed('006', 'apply'));
  log(`exit ${ap.status} ${ap.status === 0 ? '' : ap.stderr.slice(0, 600)}`);
  const golden = readFileSync(join(TASKS, 'test', 'fixtures', 'local-snapshot-after-006.txt'), 'utf8').replace(/\r\n/g, '\n');
  log(`reaches the golden after-006 snapshot: ${ourObjects(snap()) === ourObjects(golden)}`);
  log(`settings after the paste (new session): evryn.actor='${q(`select coalesce(current_setting('evryn.actor', true),'')`)}' evryn.migration='${q(`select coalesce(current_setting('evryn.migration', true),'')`)}'`);

  log('');
  log('== DATA STEPS, row by row (before -> after) ==');
  const after = JSON.parse(q(dumpSql(`, authorization_id, needs_reauthorization, (scope_hash = public.task_scope_hash(title, description, raci->>'r')) as hash_ok`)));
  const name = (id) => Object.keys(S).find((k) => S[k] === id) ?? '?';
  for (const a of after) {
    const b = before.find((x) => x.id === a.id);
    const au = q(`select coalesce(string_agg(tier || '/' || source || '/' || actor || '/sess=' || coalesce(session_id,'NULL') || ' :: ' || note, ' || '), '(no authorization row)') from public.task_authorizations where task_id = ${lit(a.id)}`);
    log(`T-${a.short_id} ${name(a.id)}: status ${b.status} -> ${a.status}; needed_by ${b.needed_by} -> ${a.needed_by}; row note ${JSON.stringify(b.note)} -> ${JSON.stringify(a.note)}; updated_at ${b.updated_at === a.updated_at ? 'same' : 'BUMPED'}; hash_ok ${a.hash_ok}; pointer ${a.authorization_id ?? 'NULL'}`);
    log(`      auth: ${au}`);
  }
  log(`dates for reference: today ${d(0)}, +14 ${d(14)}, +90 ${d(90)}`);
  log(`history rows added by the paste: ${q(`select string_agg(actor || ':' || array_to_string(changed_fields, ',') || ':sess=' || coalesce(session_id,'NULL'), ' | ' order by id) from public.task_history where note like 'migration 006%' or note like 'authorized (T-auth%'`)}`);

  // ---------------------------------------------------------------- helpers on the post-006 shape
  let n = 0;
  const uniq = (p) => `${p} ${(n += 1)}`;
  const RULE = 'authorization-rules.md s1 item 1';
  const newTask = ({ actor = 'soren', status = 'proposed', title = uniq('task'), owner = 'soren', desc = '', extraCols = '', extraVals = '' } = {}) =>
    lastLine(must(api(`insert into public.tasks (title, description, status, raci${extraCols}) values (${lit(title)}, ${lit(desc)}, ${lit(status)}, ${lit(JSON.stringify({ r: owner, a: 'lucas' }))}::jsonb${extraVals}) returning id;`, { actor }), 'newTask'));
  const auth = (id, o = {}) => {
    const { actor = 'lucas', kind = 'authorization', tier = 'lucas', note = 'go', extra = '', extraVals = '', ...rest } = o;
    const rule = 'rule' in o ? o.rule : (tier === 'lucas' ? RULE : null);
    const ref = 'ref' in o ? o.ref : (tier === 'justin' ? 'guards Log 2026-11-20, his words' : null);
    delete rest.rule; delete rest.ref;
    return api(`insert into public.task_authorizations (task_id, kind, tier, rule_ref, justin_ref, note${extra}) values (${lit(id)}, ${lit(kind)}, ${lit(tier)}, ${rule === null ? 'null' : lit(rule)}, ${ref === null ? 'null' : lit(ref)}, ${lit(note)}${extraVals}) returning id;`, { actor, ...rest });
  };
  const upd = (id, set, o) => api(`update public.tasks set ${set} where id = ${lit(id)};`, o);
  const f = (id, expr) => q(`select coalesce((${expr})::text,'NULL') from public.tasks where id = ${lit(id)}`);
  const st = (id) => f(id, `status || ' ptr=' || coalesce(authorization_id::text,'NULL') || ' reauth=' || needs_reauthorization`);
  const openTask = (o) => { const id = newTask(o); const aid = lastLine(must(auth(id), 'openTask')); return { id, aid }; };
  const handIn = (id, actor = 'soren') => must(upd(id, `status='needs_acceptance', addressed_to='lucas', note=${lit(uniq('please accept'))}`, { actor }), 'handIn');

  // ---------------------------------------------------------------- A. anon and authenticated
  log('');
  log('== A. anon and authenticated, through the API ==');
  log(`table privileges held by client roles: ${q(`select string_agg(t.tbl || ':' || r.rol || ':' || p.priv, ' ' order by t.tbl, r.rol, p.priv) from (values ('task_authorizations'),('task_auth_config'),('task_history')) t(tbl) cross join (values ('anon'),('authenticated'),('service_role')) r(rol) cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(priv) where has_table_privilege(r.rol, 'public.' || t.tbl, p.priv)`)}`);
  log(`EXECUTE held by client roles on task functions: ${q(`select string_agg(p.proname || ':' || r.rol, ' ' order by p.proname, r.rol) from pg_proc p cross join (values ('anon'),('authenticated'),('service_role'),('public')) r(rol) where p.pronamespace='public'::regnamespace and (p.proname like 'task\\_%' or p.proname like 'tasks\\_%' or p.proname = 'team_tasks_schema_snapshot') and has_function_privilege(r.rol, p.oid, 'EXECUTE')`)}`);
  log(`sequence privileges held by client roles: ${q(`select coalesce(string_agg(r.rol, ','), '(none)') from (values ('anon'),('authenticated'),('service_role')) r(rol) where has_sequence_privilege(r.rol, pg_get_serial_sequence('public.task_authorizations','id'), 'USAGE,SELECT,UPDATE')`)}`);
  const victim = openTask();
  for (const role of ['anon', 'authenticated']) {
    const o = { role, actor: 'lucas' };
    log(`[info   ] A.${role} select count(*) from tasks -> ${api('select count(*) from public.tasks;', o).stdout.trim()} (RLS: sees no rows)`);
    R(`A.${role}.1`, 'insert a proposed task', api(`insert into public.tasks (title,status,raci) values ('x','proposed','{"r":"lucas"}');`, o), 'refuse');
    const u = api(`update public.tasks set status='proposed', note='anon' where id=${lit(victim.id)} returning id;`, o);
    log(`[${u.status === 0 && u.stdout.trim() === '' ? 'held   ' : 'CHECK  '}] A.${role}.2 update an open task :: exit ${u.status}, rows returned '${u.stdout.trim()}' ${firstErr(u)}; task now ${st(victim.id)}`);
    R(`A.${role}.3`, 'select task_authorizations', api('select count(*) from public.task_authorizations;', o), 'refuse', /permission denied/);
    R(`A.${role}.4`, 'insert an authorization row as actor lucas', auth(newTask(), o), 'refuse', /permission denied/);
    R(`A.${role}.5`, 'select task_auth_config', api('select * from public.task_auth_config;', o), 'refuse', /permission denied/);
    R(`A.${role}.6`, 'update task_auth_config', api(`update public.task_auth_config set justin_tier_source='justin_signin';`, o), 'refuse', /permission denied/);
    R(`A.${role}.7`, 'select task_history', api('select count(*) from public.task_history;', o), 'refuse', /permission denied/);
    R(`A.${role}.8`, 'call task_justin_tier_ok()', api('select public.task_justin_tier_ok();', o), 'refuse', /permission denied/);
    R(`A.${role}.9`, 'truncate tasks (holds the old default TRUNCATE grant; not reachable through PostgREST)', api('truncate public.tasks;', o), 'refuse');
    R(`A.${role}.10`, 'delete from tasks', api(`delete from public.tasks where id=${lit(victim.id)} returning id;`, o), 'refuse');
    log(`          task still there: ${q(`select count(*) from public.tasks where id=${lit(victim.id)}`)}`);
  }

  // ---------------------------------------------------------------- B. service_role as an honest non-authorizer
  log('');
  log('== B. service_role, actor ac/soren (its own name) ==');
  for (const [status, cols, vals] of [['open', '', ''], ['in_progress', '', ''], ['blocked', '', ''], ['needs_acceptance', ', addressed_to', ", 'lucas'"], ['done', ', closed_at, closing_note', ", now(), 'x'"], ['decided_against', ', closed_at, closing_note', ", now(), 'x'"]]) {
    R('B1', `insert at ${status}`, api(`insert into public.tasks (title,status,raci${cols}) values (${lit(uniq('i'))}, ${lit(status)}, '{"r":"ac"}'${vals});`), 'refuse', /ET011/);
  }
  const prop = newTask({ actor: 'ac', owner: 'ac' });
  const op = openTask({ actor: 'ac', owner: 'ac' });
  R('B2a', 'upsert (merge-duplicates shape) onto an existing PROPOSED task with status open', api(`insert into public.tasks (id,title,status,raci) values (${lit(prop)}, 'u', 'open', '{"r":"ac"}') on conflict (id) do update set title=excluded.title, status=excluded.status, raci=excluded.raci;`), 'refuse', /ET011/);
  R('B2b', 'upsert onto an existing proposed task: payload status proposed, DO UPDATE sets status open', api(`insert into public.tasks (id,title,status,raci) values (${lit(prop)}, 'u', 'proposed', '{"r":"ac"}') on conflict (id) do update set status='open', note='upsert';`), 'refuse', /ET011/);
  R('B2c', 'upsert carrying authorization_id', api(`insert into public.tasks (id,title,status,raci,authorization_id) values (${lit(prop)}, 'u', 'proposed', '{"r":"ac"}', ${op.aid}) on conflict (id) do update set authorization_id=excluded.authorization_id;`), 'refuse', /ET014/);
  R('B3a', 'status write proposed -> open', upd(prop, `status='open', note='go'`), 'refuse', /ET011/);
  R('B3b', 'proposed -> open carrying another task\'s authorization id', upd(prop, `status='open', authorization_id=${op.aid}, note='go'`), 'refuse', /ET014/);
  R('B3c', 'proposed -> needs_acceptance', upd(prop, `status='needs_acceptance', addressed_to='lucas', note='go'`), 'refuse', /ET011/);
  R('B3d', 'proposed -> done', upd(prop, `status='done', closed_at=now(), closing_note='x'`), 'refuse', /ET011/);
  R('B3e', 'open -> done by a status write', upd(op.id, `status='done', closed_at=now(), closing_note='x'`), 'refuse', /ET011/);
  R('B4a', 'authorization row, payload claims actor lucas, header says ac', auth(prop, { actor: 'ac', extra: ', actor', extraVals: ", 'lucas'" }), 'refuse', /ET012/);
  R('B4b', 'authorization row with header actor "Lucas" (capital)', auth(prop, { actor: 'Lucas' }), 'refuse', /ET012/);
  R('B4c', 'acceptance row by ac', auth(op.id, { actor: 'ac', kind: 'acceptance', note: 'done' }), 'refuse', /ET012/);
  R('B5a', 'update task_auth_config', api(`update public.task_auth_config set justin_tier_source='justin_signin';`), 'refuse', /permission denied/);
  R('B5b', 'insert task_auth_config', api(`insert into public.task_auth_config values (2,'lucas_relay',null);`), 'refuse');
  R('B5c', 'delete task_auth_config', api(`delete from public.task_auth_config;`), 'refuse', /permission denied/);
  R('B6a', 'update an authorization row', api(`update public.task_authorizations set tier='justin' where id=${op.aid};`), 'refuse', /permission denied/);
  R('B6b', 'delete an authorization row', api(`delete from public.task_authorizations where id=${op.aid};`), 'refuse', /permission denied/);
  R('B6c', 'insert a history row directly', api(`insert into public.task_history (task_id, actor, op) values (${lit(op.id)}, 'lucas', 'update');`), 'refuse', /ET005/);
  R('B6d', 'call set_config to set evryn.authorizing in the same transaction, then move the task (NOT reachable through PostgREST; needs SQL)', api(`select set_config('evryn.authorizing', '${op.aid}:${prop}', true); update public.tasks set status='open', authorization_id=${op.aid}, note='crafted' where id=${lit(prop)};`), 'refuse', /ET014/);

  // B7: the scope swapped between the yes and its record
  log('');
  const t7 = newTask({ actor: 'soren', title: 'Fix a typo in the README', desc: 'a one-line fix' });
  const seenHash = f(t7, 'scope_hash');
  must(upd(t7, `title='Deploy the web app to production', description='ship it tonight'`, { actor: 'soren' }), 'B7 edit');
  const r7 = auth(t7, { tier: 'justin', ref: 'Log 11/20: Justin said yes to the README typo fix', note: 'his yes to the typo fix', extra: ', scope_hash', extraVals: `, ${lit(seenHash)}` });
  log(`[${r7.status === 0 ? 'OBSERVE' : 'held   '}] B7 a proposed task is edited by its owner (soren, own name) after the authorizer read it; lucas then authorizes, sending the scope_hash he saw :: ${r7.status === 0 ? 'authorization ACCEPTED' : firstErr(r7)}`);
  log(`          task now: ${st(t7)}; title ${f(t7, 'title')}`);
  log(`          record: ${q(`select 'tier ' || tier || ', scope.title=' || (scope->>'title') || ', stored hash = the hash lucas sent: ' || (scope_hash = ${lit(seenHash)})::text || ', justin_ref=' || justin_ref from public.task_authorizations where task_id=${lit(t7)}`)}`);
  log(`          history flags on that task: ${q(`select coalesce(string_agg(array_to_string(flags, ','), '|'), '') from public.task_history where task_id=${lit(t7)}`)} (empty = nothing flagged)`);

  // B8: deciding against authorized work, in two writes
  const t8 = openTask({ actor: 'soren', owner: 'soren' });
  R('B8a', 'ac decides against AUTHORIZED work it does not own, in one write', upd(t8.id, `status='decided_against', closed_at=now(), closing_note='no'`, { actor: 'ac' }), 'refuse', /ET011/);
  const w1 = upd(t8.id, `status='proposed', note='withdrawn'`, { actor: 'ac' });
  const w2 = upd(t8.id, `status='decided_against', closed_at=now(), closing_note='no'`, { actor: 'ac' });
  log(`[${w1.status === 0 && w2.status === 0 ? 'OBSERVE' : 'held   '}] B8b the same in two writes (withdraw to proposed, then decided_against), by ac, not the owner :: write1 exit ${w1.status}, write2 exit ${w2.status} ${firstErr(w2)}; task now ${st(t8.id)}`);

  // B9: a closed task's closing note and date
  const t9 = openTask(); handIn(t9.id); must(auth(t9.id, { kind: 'acceptance', note: 'delivered: docs/x.md' }), 'B9 accept');
  const c9 = upd(t9.id, `closing_note='rewritten by ac', closed_at='2020-01-01'`, { actor: 'ac' });
  log(`[${c9.status === 0 ? 'OBSERVE' : 'held   '}] B9 ac rewrites closing_note and closed_at of a DONE task :: exit ${c9.status} ${firstErr(c9)}; closing_note now '${f(t9.id, 'closing_note')}', closed_at ${f(t9.id, 'closed_at::date')}; acceptance row note still '${q(`select note from public.task_authorizations where task_id=${lit(t9.id)} and kind='acceptance'`)}'`);
  R('B9b', 'ac edits the title of that done task', upd(t9.id, `title='rewritten'`, { actor: 'ac' }), 'refuse', /ET015/);

  // B10: someone else's proposal
  const t10 = newTask({ actor: 'mira', owner: 'mira' });
  const k10 = upd(t10, `status='decided_against', closed_at=now(), closing_note='not worth it'`, { actor: 'ac' });
  log(`[${k10.status === 0 ? 'OBSERVE' : 'held   '}] B10 ac closes mira's PROPOSED task as decided_against :: exit ${k10.status}; task now ${st(t10)}`);
  R('B10b', 'ac (not lucas) reopens it', upd(t10, `status='proposed', note='reopen'`, { actor: 'ac' }), 'refuse', /ET011/);
  // B11: timestamps at insert
  const t11 = lastLine(must(api(`insert into public.tasks (title,status,raci,created_at,updated_at,created_by) values ('backdated','proposed','{"r":"ac"}','2020-01-01','2020-01-01','justin') returning id;`), 'B11'));
  log(`[OBSERVE] B11 insert with client-set created_at/updated_at/created_by :: created_at ${f(t11, 'created_at::date')}, updated_at ${f(t11, 'updated_at::date')}, created_by ${f(t11, 'created_by')} (created_by is the database's; the two dates are the client's, as before 006)`);

  // ---------------------------------------------------------------- C. as lucas (the name any session can send): what even lucas must not do
  log('');
  log('== C. service_role, actor lucas ==');
  R('C1', 'lucas inserts a task at open', api(`insert into public.tasks (title,status,raci) values ('x','open','{"r":"lucas"}');`, { actor: 'lucas' }), 'refuse', /ET011/);
  const c2 = newTask();
  R('C2', 'lucas status write proposed -> open', upd(c2, `status='open', note='go'`, { actor: 'lucas' }), 'refuse', /ET011/);
  R('C3', 'lucas-tier row without rule_ref', auth(c2, { rule: null }), 'refuse', /ET012/);
  R('C4', 'justin-tier row without justin_ref', auth(c2, { tier: 'justin', ref: null }), 'refuse', /ET012/);
  R('C5', 'row with no session header', auth(c2, { session: null }), 'refuse', /ET012/);
  R('C6', 'client-set tier backfill', auth(c2, { tier: 'backfill' }), 'refuse', /ET012/);
  R('C7', 'authorization of a decided_against task', auth(t10), 'refuse', /ET012/);
  // C8: the downgrade
  const j = newTask(); must(auth(j, { tier: 'justin' }), 'C8 justin auth'); handIn(j);
  R('C8a', 'control: lucas-tier acceptance of Justin-tier authorized work', auth(j, { kind: 'acceptance', note: 'delivered' }), 'refuse', /Justin authorized this task himself/);
  const dg = auth(j, { tier: 'lucas', note: 'continuing work Justin already authorized' });
  const acc = auth(j, { kind: 'acceptance', note: 'delivered' });
  log(`[${dg.status === 0 && acc.status === 0 ? 'OBSERVE' : 'held   '}] C8b lucas re-authorizes the same task at tier LUCAS (pointer moves off the Justin-tier row), then accepts at tier lucas :: re-authorize exit ${dg.status} ${firstErr(dg)}; accept exit ${acc.status} ${firstErr(acc)}; task now ${st(j)}`);
  // the same under justin_signin
  const j2 = newTask(); must(auth(j2, { tier: 'justin' }), 'C9 justin auth'); handIn(j2);
  const j3 = newTask();
  must(own(`update public.task_auth_config set justin_tier_source='justin_signin', justin_user_id='11111111-1111-1111-1111-111111111111';`), 'switch to justin_signin');
  R('C9a', 'under justin_signin: lucas (service_role) writes a Justin-tier authorization', auth(j3, { tier: 'justin' }), 'refuse', /justin_signin/);
  R('C9b', 'under justin_signin: service_role carrying Justin\'s JWT claims writes Justin-tier', auth(j3, { tier: 'justin', claims: { role: 'service_role', sub: '11111111-1111-1111-1111-111111111111', aal: 'aal2' } }), 'refuse', /justin_signin/);
  R('C9c', 'under justin_signin: lucas-tier acceptance of Justin-tier work', auth(j2, { kind: 'acceptance', note: 'delivered' }), 'refuse', /Justin authorized this task himself/);
  const dg2 = auth(j2, { tier: 'lucas', note: 'continuing' });
  const acc2 = auth(j2, { kind: 'acceptance', note: 'delivered' });
  log(`[${dg2.status === 0 && acc2.status === 0 ? 'OBSERVE' : 'held   '}] C9d under justin_signin: lucas-tier re-authorization, then lucas-tier acceptance of the Justin-tier task :: exit ${dg2.status}/${acc2.status} ${firstErr(dg2)} ${firstErr(acc2)}; task now ${st(j2)}`);
  const sgn = auth(j3, { role: 'authenticated', actor: 'justin', tier: 'justin', claims: { role: 'authenticated', sub: '11111111-1111-1111-1111-111111111111', aal: 'aal2' } });
  log(`[info   ] C9e under justin_signin: Justin's own sign-in (role authenticated, his sub, aal2) writes a Justin-tier row :: exit ${sgn.status} ${firstErr(sgn)} (expected to be refused until T-97's migration grants that path)`);
  must(own(`update public.task_auth_config set justin_tier_source='lucas_relay', justin_user_id=null;`), 'switch back');

  // ---------------------------------------------------------------- D. legitimate paths
  log('');
  log('== D. legitimate paths (each must work) ==');
  const o1 = openTask({ actor: 'soren' });
  R('D1a', 'owner: open -> in_progress, with a note', upd(o1.id, `status='in_progress', note='started'`, { actor: 'soren' }), 'ok');
  R('D1b', 'owner: in_progress -> blocked', upd(o1.id, `status='blocked', note='waiting on nathan'`, { actor: 'soren' }), 'ok');
  R('D1c', 'owner: blocked -> in_progress', upd(o1.id, `status='in_progress', note='unblocked'`, { actor: 'soren' }), 'ok');
  R('D1d', 'owner hands in: needs_acceptance, to lucas, note (one write, the CLI shape)', upd(o1.id, `status='needs_acceptance', addressed_to='lucas', note='please accept: docs/x.md'`, { actor: 'soren' }), 'ok');
  R('D1e', 'lucas sends it back: needs_acceptance -> in_progress', upd(o1.id, `status='in_progress', addressed_to='soren', note='not yet: see my comments'`, { actor: 'lucas' }), 'ok');
  R('D1f', 'owner hands in again', upd(o1.id, `status='needs_acceptance', addressed_to='lucas', note='fixed, please accept'`, { actor: 'soren' }), 'ok');
  R('D1g', 'lucas accepts at tier lucas', auth(o1.id, { kind: 'acceptance', note: 'delivered: docs/x.md' }), 'ok');
  log(`          -> ${st(o1.id)}, closed_at set ${f(o1.id, 'closed_at is not null')}, closing_note '${f(o1.id, 'closing_note')}'`);

  const o2 = openTask({ actor: 'soren' });
  must(upd(o2.id, `status='in_progress', note='working'`, { actor: 'soren' }));
  R('D2a', 'upgrade an in_progress lucas-tier task to a Justin-tier authorization', auth(o2.id, { tier: 'justin', note: 'Justin confirmed it himself' }), 'ok');
  log(`          -> ${st(o2.id)} (status kept), current row tier ${q(`select a.tier from public.task_authorizations a join public.tasks t on t.authorization_id=a.id where t.id=${lit(o2.id)}`)}, authorization rows on the task: ${q(`select count(*) from public.task_authorizations where task_id=${lit(o2.id)}`)}`);
  handIn(o2.id);
  R('D2b', 'justin-tier acceptance of it (lucas relaying, with justin_ref)', auth(o2.id, { kind: 'acceptance', tier: 'justin', note: 'accepted by Justin: Log 11/20' }), 'ok');

  const o3 = openTask({ actor: 'soren' });
  R('D3a', 'owner withdraws authorized work to proposed', upd(o3.id, `status='proposed', note='withdrawn: needs rethinking'`, { actor: 'soren' }), 'ok');
  log(`          -> ${st(o3.id)}`);
  R('D3b', 'lucas re-authorizes it', auth(o3.id), 'ok');
  log(`          -> ${st(o3.id)}`);

  R('D4a', 'lucas reopens a DONE task to proposed', upd(o1.id, `status='proposed', note='Justin sent it back'`, { actor: 'lucas' }), 'ok');
  log(`          -> ${st(o1.id)}; closed_at left behind: ${f(o1.id, 'closed_at is not null')}, closing_note left behind: '${f(o1.id, 'closing_note')}'`);
  R('D4b', 'lucas re-authorizes the reopened task', auth(o1.id), 'ok');
  must(upd(o1.id, `status='needs_acceptance', addressed_to='lucas', note='second delivery'`, { actor: 'soren' }));
  R('D4c', 'second acceptance of the same task', auth(o1.id, { kind: 'acceptance', note: 'delivered again' }), 'ok');
  log(`          -> ${st(o1.id)}, closing_note '${f(o1.id, 'closing_note')}'`);
  R('D4d', 'lucas reopens a DECIDED_AGAINST task to proposed', upd(t10, `status='proposed', note='worth another look'`, { actor: 'lucas' }), 'ok');

  const o5 = openTask({ actor: 'soren' });
  const p5 = newTask();
  R('D5a', 'note-only write on a proposed task, any actor', upd(p5, `note='a comment'`, { actor: 'mira' }), 'ok');
  R('D5b', 'note-only write on an open task, any actor', upd(o5.id, `note='progress: half done'`, { actor: 'mira' }), 'ok');
  R('D5c', 'note-only write on a done task, any actor', upd(o2.id, `note='postscript'`, { actor: 'mira' }), 'ok');
  R('D5d', 'launcher writes a note on an open task, with NO session', upd(o5.id, `note='SHADOW: launcher would start this (authorization #${o5.aid}, tier lucas)'`, { actor: 'launcher', session: null }), 'ok');
  log(`          -> ${st(o5.id)}; history row: ${q(`select actor || ' sess=' || coalesce(session_id,'NULL') || ' flags=' || array_to_string(flags, ',') from public.task_history where task_id=${lit(o5.id)} order by id desc limit 1`)}`);
  R('D5e', 'launcher creates a proposed task with no session', api(`insert into public.tasks (title,status,raci) values ('from the launcher','proposed','{"r":"lucas"}') returning short_id;`, { actor: 'launcher', session: null }), 'ok');

  R('D6a', 'owner edits the body of authorized work (the return)', upd(o5.id, `description='a different job'`, { actor: 'soren' }), 'ok');
  log(`          -> ${st(o5.id)}; note '${f(o5.id, 'note')}'`);
  R('D6b', 'owner keeps editing while it is proposed', upd(o5.id, `title=${lit(uniq('renamed'))}`, { actor: 'soren' }), 'ok');
  R('D6c', 'lucas re-authorizes it', auth(o5.id), 'ok');
  log(`          -> ${st(o5.id)}`);
  R('D7a', 'lucas moves authorized work to another owner (returns to proposed)', upd(o5.id, `raci = raci || '{"r":"mira"}'::jsonb, note='moving to mira'`, { actor: 'lucas' }), 'ok');
  R('D7b', 'lucas re-authorizes it under the new owner', auth(o5.id, { note: 'authorization-rules s1 item 3' }), 'ok');
  log(`          -> ${st(o5.id)}, owner ${f(o5.id, 'owner')}`);
  R('D7c', 'changing accountable, tags, needed_by, addressed_to, links, parent on authorized work keeps the authorization', upd(o5.id, `raci = raci || '{"a":"justin"}'::jsonb, tags=array['v0.3'], needed_by='2026-12-01', addressed_to='mira', links='["docs/x.md"]'::jsonb, parent_id=${lit(o3.id)}`, { actor: 'mira' }), 'ok');
  log(`          -> ${st(o5.id)}`);

  const b8 = lastLine(must(api(`insert into public.tasks (title,status,raci,needed_by) values (${lit(uniq('idea'))},'backlog','{"r":"soren"}','${d(20)}') returning id;`, { actor: 'soren' }), 'D8'));
  R('D8a', 'owner proposes a backlog idea', upd(b8, `status='proposed', note='ready to propose'`, { actor: 'soren' }), 'ok');
  R('D8b', 'owner parks it back in backlog', upd(b8, `status='backlog', needed_by='${d(30)}', note='not yet'`, { actor: 'soren' }), 'ok');
  R('D8c', 'lucas authorizes a BACKLOG task directly', auth(b8), 'ok');
  log(`          -> ${st(b8)}`);
  R('D8d', 'owner parks AUTHORIZED work in backlog in one write', upd(b8, `status='backlog', needed_by='${d(30)}', note='park it'`, { actor: 'soren' }), 'ok');
  R('D8e', '...the two-write way: withdraw to proposed, then backlog', api(`update public.tasks set status='proposed', note='withdraw to park' where id=${lit(b8)};`, { actor: 'soren' }), 'ok');
  R('D8f', '...then backlog', upd(b8, `status='backlog', needed_by='${d(30)}', note='parked'`, { actor: 'soren' }), 'ok');

  const p9 = newTask({ actor: 'soren' });
  R('D9a', 'owner closes its own proposed idea as decided_against (the CLI close shape)', upd(p9, `status='decided_against', closing_note='not worth it', closed_at=now()`, { actor: 'soren' }), 'ok');
  const o9 = openTask();
  R('D9b', 'lucas decides against authorized work', upd(o9.id, `status='decided_against', closing_note='overtaken: Log 11/20', closed_at=now()`, { actor: 'lucas' }), 'ok');
  R('D10', 'lucas signs an active task (a record)', upd(o3.id, `signed_at=now(), signed_ref='Log 11/20', note='signed'`, { actor: 'lucas' }), 'ok');

  log('');
  log('-- backfilled tasks (authorized only by migration 006\'s backfill row) --');
  R('D11a', 'owner moves a backfilled open task to in_progress', upd(S.open, `status='in_progress', note='carrying on'`, { actor: 'soren' }), 'ok');
  R('D11b', 'note-only on a backfilled task', upd(S.inprog, `note='progress'`, { actor: 'soren' }), 'ok');
  R('D11c', 'lucas-tier acceptance of a backfilled needs_acceptance task (the brief\'s known residual)', auth(S.na, { kind: 'acceptance', note: 'delivered' }), 'ok');
  R('D11d', 'upgrade a backfilled task to Justin tier', auth(S.inprog, { tier: 'justin', note: 'Justin re-authorized it' }), 'ok');
  log(`          -> ${st(S.inprog)}`);
  R('D11e', 'justin-tier acceptance of the backfilled task addressed to justin', auth(S.naJ, { kind: 'acceptance', tier: 'justin', note: 'he accepted it: Log' }), 'ok');
  R('D11f', 'the legacy pre-task-system row: owner hands it in', upd(S.legacy, `status='needs_acceptance', addressed_to='lucas', note='handing in the legacy item'`, { actor: 'lucas' }), 'ok');
  R('D12a', 'a moved pre-005 backlog row: owner proposes it', upd(S.bk70, `status='proposed', note='worth doing now'`, { actor: 'soren' }), 'ok');
  R('D12b', 'a moved pre-005 backlog row: owner re-dates it with a note', upd(S.bk120, `needed_by='${d(45)}', note='look again in six weeks'`, { actor: 'soren' }), 'ok');
  R('D12c', 'the row whose review date is past: owner closes it', upd(S.bkPast, `status='decided_against', closing_note='stale idea', closed_at=now()`, { actor: 'soren' }), 'ok');
  R('D13', 'authorize with an envelope and a proposal_ref', api(`insert into public.task_authorizations (task_id, kind, tier, justin_ref, note, envelope, proposal_ref) values (${lit(S.proposed)}, 'authorization', 'justin', 'Log 11/20', 'yes', '{"max_api_usd": 5}'::jsonb, 'shared/x.md@abc123') returning id, tier, source;`, { actor: 'lucas' }), 'ok');

  // ---------------------------------------------------------------- E. one write, many rows
  log('');
  const activeBefore = q(`select count(*) from public.tasks where status in ('open','in_progress','blocked','needs_acceptance')`);
  const mass = api(`update public.tasks set status='proposed', note='one PATCH with a wide filter' where status in ('open','in_progress','blocked','needs_acceptance');`, { actor: 'ac' });
  log(`[${mass.status === 0 ? 'OBSERVE' : 'held   '}] E1 ONE request by ac (PATCH /tasks?status=in.(...)) withdraws EVERY authorized task, anyone's :: exit ${mass.status} ${firstErr(mass)}; active before ${activeBefore}, after ${q(`select count(*) from public.tasks where status in ('open','in_progress','blocked','needs_acceptance')`)}; pointers left ${q(`select count(*) from public.tasks where authorization_id is not null and status not in ('done','decided_against')`)}`);
} catch (e) {
  log(`HARNESS ERROR: ${e.message}`);
} finally {
  cluster.stop();
  writeFileSync(join(HERE, 'probe-out.txt'), out.join('\n') + '\n', 'utf8');
  console.log(out.join('\n'));
}
