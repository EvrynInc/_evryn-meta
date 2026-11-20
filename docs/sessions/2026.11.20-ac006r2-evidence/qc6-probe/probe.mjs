// copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6-probe/probe.mjs; original sha256 0a4e17e601a0e65ac097ceec717b22535121633cb94dcffcaca807f24cda42ea; copied 2026-11-20 by AC-006R2
// QC6 probe harness — throwaway loopback cluster only. Never reads a .env.
process.env.EVRYN_TASKS_TEST_MODE = '1';
const SB = 'file:///C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6-sandbox/scripts/tasks/';
const { startCluster } = await import(SB + 'test/acceptance/cluster.mjs');
const { runPsql } = await import(SB + 'lib/pg.mjs');
const { buildPastes, changeSet } = await import(SB + 'make-paste.mjs');
const { splitSql } = await import(SB + 'lib/sqlsplit.mjs');
const { snapshotQuery } = await import(SB + 'schema-snapshot.mjs');
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const TASKS = 'C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6-sandbox/scripts/tasks/';
const RT003 = 'C:/Users/jbmcg/Evryn/Code/evryn-team-runtime/migrations/003_tasks_proposals.sql';
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const SESSION = '0b6f7c1e-2f43-4c5a-9d1e-5f7a8b9c0d1e';
const hdr = (a, s = SESSION) => JSON.stringify({ 'x-evryn-actor': a, ...(s ? { 'x-evryn-session': s } : {}) });
const out = [];
const log = (...a) => { const l = a.join(' '); out.push(l); console.log(l); };

const c = await startCluster();
try {
  const P = (db, sql) => c.psql(db, sql);
  const ok = (r, what) => { if (r.status !== 0) throw new Error(`${what}: ${r.stderr}`); return r.stdout.trim(); };
  ok(P('postgres', `create role anon nologin noinherit; create role authenticated nologin noinherit;
    create role service_role nologin noinherit bypassrls; create role authenticator login noinherit;
    grant anon, authenticated, service_role to authenticator;`), 'roles');
  const req = (db, body, { role = 'service_role', actor = 'ac', session = SESSION, sets = [] } = {}) => {
    const lines = ['\\set VERBOSITY verbose', 'begin;'];
    if (role) lines.push(`set local role ${role};`);
    if (actor !== null) lines.push(`set local request.headers = ${lit(hdr(actor, session))};`);
    lines.push(...sets, body, 'commit;');
    return P(db, lines.join('\n'));
  };
  const verdict = (r) => (r.status === 0 ? 'ACCEPTED' : 'REFUSED: ' + (r.stderr.match(/ERROR:\s+(\S+: [^\n]{0,110})/)?.[1] ?? r.stderr.slice(0, 160)));
  const migrate = (db, through) => {
    const r = spawnSync(process.execPath, [TASKS + 'migrate.mjs'], { encoding: 'utf8', env: { ...process.env, EVRYN_TASKS_ENV_FROM_PROCESS: '1', EVRYN_TASKS_LOCAL_PG: c.urlFor(db), ...(through ? { EVRYN_TASKS_MIGRATE_THROUGH: through } : {}) } });
    if (r.status !== 0) throw new Error('migrate ' + r.stderr);
  };
  const fresh = (db, legacy = '') => {
    ok(P('postgres', `create database ${db};`), 'db');
    ok(P(db, `grant usage on schema public to anon, authenticated, service_role;
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;`), 'defaults');
    ok(P(db, readFileSync(RT003, 'utf8')), 'rt003');
    if (legacy) ok(P(db, legacy), 'legacy');
    ok(P(db, `alter default privileges in schema public revoke all on tables from anon, authenticated, service_role;`), 'defaults off');
  };
  const val = (db, sql) => ok(P(db, sql), sql);
  const newTask = (db, title, actor = 'ac') => req(db, `insert into public.tasks (title, status, raci) values (${lit(title)}, 'proposed', '{"r":"lucas"}') returning id;`, { actor }).stdout.trim().split('\n').pop();
  const authorize = (db, id) => req(db, `insert into public.task_authorizations (task_id, kind, tier, rule_ref, note) values (${lit(id)}, 'authorization', 'lucas', 'authorization-rules.md §1 item 1', 'go') returning id;`, { actor: 'lucas' }).stdout.trim().split('\n').pop();

  // ---------------- A: C4 binding, attacked -----------------
  log('## A. C4 binding attacks (db a6, migrate 001-006)');
  fresh('a6'); migrate('a6');
  const A = newTask('a6', 'task A'); const rowA = authorize('a6', A);
  const C = newTask('a6', 'task C');
  log('A1 crafted setting naming rowA AND task C (rowA belongs to A), as service_role:',
    verdict(req('a6', `update public.tasks set authorization_id = ${rowA}, status = 'open', note = 'crafted' where id = ${lit(C)};`, { actor: 'lucas', sets: [`set local evryn.authorizing = '${rowA}:${C}';`] })));
  log('   task C now:', val('a6', `select status || ' auth=' || coalesce(authorization_id::text,'NULL') from public.tasks where id = ${lit(C)};`));
  log('A1b same, as actor ac (non-signer):',
    verdict(req('a6', `update public.tasks set authorization_id = ${rowA}, status = 'open', note = 'crafted2' where id = ${lit(newTask('a6','task C2'))};`, { actor: 'ac', sets: [`set local evryn.authorizing = '${rowA}:' || (select id from public.tasks where title = 'task C2');`] })));
  // revert attack through an OLD authorization row of the same task
  const R = newTask('a6', 'task R'); const rowR = authorize('a6', R);
  ok(req('a6', `update public.tasks set description = 'a different job' where id = ${lit(R)};`), 'scope edit');
  log('A2 after a return, setting naming R\'s OLD row (stale scope) and R:',
    verdict(req('a6', `update public.tasks set authorization_id = ${rowR}, status = 'open', note = 'stale yes' where id = ${lit(R)};`, { actor: 'ac', sets: [`set local evryn.authorizing = '${rowR}:${R}';`] })));
  log('   task R now:', val('a6', `select t.status || ' auth=' || coalesce(t.authorization_id::text,'NULL') || ' reauth=' || t.needs_reauthorization || ' hash_matches_row=' || (t.scope_hash = a.scope_hash) from public.tasks t left join public.task_authorizations a on a.id = t.authorization_id where t.id = ${lit(R)};`));
  // acceptance-kind setting: another task's acceptance row
  const D = newTask('a6', 'task D'); authorize('a6', D);
  ok(req('a6', `update public.tasks set status = 'needs_acceptance', addressed_to = 'lucas', note = 'pls' where id = ${lit(D)};`), 'D hand-in');
  const accD = req('a6', `insert into public.task_authorizations (task_id, kind, tier, rule_ref, note) values (${lit(D)}, 'acceptance', 'lucas', 'r', 'delivered') returning id;`, { actor: 'lucas' }).stdout.trim().split('\n').pop();
  const E = newTask('a6', 'task E'); authorize('a6', E);
  ok(req('a6', `update public.tasks set status = 'needs_acceptance', addressed_to = 'lucas', note = 'pls' where id = ${lit(E)};`), 'E hand-in');
  log('A3 setting naming D\'s acceptance row AND task E, status done on E as ac:',
    verdict(req('a6', `update public.tasks set status = 'done', closed_at = now(), closing_note = 'self-accepted' where id = ${lit(E)};`, { actor: 'ac', sets: [`set local evryn.authorizing = '${accD}:${E}';`] })));
  log('   task E now:', val('a6', `select status from public.tasks where id = ${lit(E)};`));

  // ---------------- B: can a client role set the GUCs at all? -----------------
  log('## B. GUC reachability');
  log('B1 service_role: select set_config(evryn.migration) (psql, NOT PostgREST):', verdict(req('a6', `select pg_catalog.set_config('evryn.migration','006',true);`)));
  log('B2 public-schema functions executable by service_role (the only RPC surface PostgREST exposes):',
    val('a6', `select string_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ', ' order by p.proname) from pg_proc p where p.pronamespace = 'public'::regnamespace and has_function_privilege('service_role', p.oid, 'EXECUTE');`));
  log('B3 any public function body calling set_config with a parameter:',
    val('a6', `select coalesce(string_agg(proname, ', '), '(none)') from pg_proc where pronamespace = 'public'::regnamespace and prosrc ilike '%set_config%' and pronargs > 0;`));
  const BK = newTask('a6', 'bk'); authorize('a6', BK);
  ok(req('a6', `update public.tasks set status = 'blocked', tags = array['backlog'], note = 'w' where id = ${lit(BK)};`), 'bk blocked');
  for (const role of ['service_role', 'authenticator']) {
    log(`B4 ${role} with evryn.migration=006, blocked+backlog -> backlog:`,
      verdict(req('a6', `update public.tasks set status = 'backlog', needed_by = current_date + 10, note = 'mig' where id = ${lit(BK)};`, { role, actor: 'justin', sets: [`set local evryn.migration = '006';`] })));
  }
  ok(P('a6', `create role some_other_role nologin; grant service_role to some_other_role; grant usage on schema public to some_other_role;`), 'other role');
  log('B5 a role NOT on the C5 deny-list (member of service_role), with evryn.migration=006:',
    verdict(req('a6', `update public.tasks set status = 'backlog', needed_by = current_date + 10, note = 'mig2' where id = ${lit(BK)};`, { role: 'some_other_role', actor: 'justin', sets: [`set local evryn.migration = '006';`] })));
  log('   (B5 shows the deny-list shape; no such role is PostgREST-reachable today)');

  // ---------------- C: trigger depth -----------------
  log('## C. trigger depth');
  const T = newTask('a6', 'depth'); const rowT = authorize('a6', T);
  log('C1 last history row for the authorized task:', val('a6', `select actor || ' | ' || array_to_string(changed_fields, ',') || ' | ' || coalesce(session_id,'NULL') || ' | ' || note from public.task_history where task_id = ${lit(T)} order by id desc limit 1;`));

  // ---------------- D: edge moves -----------------
  log('## D. edge moves');
  const S = newTask('a6', 'scope+status'); authorize('a6', S);
  log('D1 lucas: decided_against + title edit in one write on open task:', verdict(req('a6', `update public.tasks set status = 'decided_against', closed_at = now(), closing_note = 'no', title = 'renamed' where id = ${lit(S)};`, { actor: 'lucas' })));
  log('   result:', val('a6', `select status || ' closed_at_set=' || (closed_at is not null) || ' reauth=' || needs_reauthorization from public.tasks where id = ${lit(S)};`));
  const W = newTask('a6', 'withdraw then close'); authorize('a6', W);
  ok(req('a6', `update public.tasks set title = 'changed' where id = ${lit(W)};`), 'w');
  ok(req('a6', `update public.tasks set status = 'decided_against', closed_at = now(), closing_note = 'dropped' where id = ${lit(W)};`), 'w2');
  log('D2 returned task then decided_against: needs_reauthorization =', val('a6', `select needs_reauthorization from public.tasks where id = ${lit(W)};`));

  // ---------------- E: data steps on a realistic post-005 copy, through the REAL 006 paste -----------------
  log('## E. data steps through the real 006 paste (LF and CRLF)');
  const p6 = buildPastes(changeSet('006'));
  for (const mode of ['LF', 'CRLF']) {
    const db = `e_${mode.toLowerCase()}`;
    fresh(db, `insert into public.tasks (title, status, raci) values ('legacy active pre-task-system', 'open', '{"r":"lucas"}'::jsonb);`);
    migrate(db, '005');
    const ins = (actor, title, status, cols = '', vals = '') => ok(req(db, `insert into public.tasks (title, status, raci${cols}) values (${lit(title)}, ${lit(status)}, '{"r":"lucas"}'${vals}) returning id;`, { actor, session: null }), title).split('\n').pop();
    const pt = `(now() at time zone 'America/Los_Angeles')::date`;
    ins('lucas', 'bl null date', 'blocked', ', tags', `, array['backlog','x']`);
    ins('lucas', 'bl past date', 'blocked', ', tags, needed_by', `, array['backlog'], ${pt} - 10`);
    ins('lucas', 'bl +120', 'blocked', ', tags, needed_by', `, array['backlog'], ${pt} + 120`);
    ins('lucas', 'bl +30', 'blocked', ', tags, needed_by', `, array['backlog'], ${pt} + 30`);
    ins('lucas', 'blocked untagged', 'blocked');
    ins('lucas', 'open tagged backlog', 'open', ', tags', `, array['backlog']`);
    ins('ac', 'imported', 'open', ', linear_id', `, 'EVR-9'`);
    ins('soren', 'in progress', 'in_progress');
    ins('lucas', 'needs acc', 'needs_acceptance', ', addressed_to', `, 'lucas'`);
    ins('lucas', 'signed open', 'open', ', signed_at, signed_ref', `, now(), 'Log 1'`);
    const parent = ins('lucas', 'parent open', 'open');
    ins('lucas', 'child proposed', 'proposed', ', parent_id', `, ${lit(parent)}`);
    ins('lucas', 'proposed', 'proposed');
    ins('lucas', 'backlog005', 'backlog', ', needed_by', `, ${pt} + 30`);
    const done = ins('lucas', 'done', 'open');
    ok(req(db, `update public.tasks set status = 'done', closed_at = now(), closing_note = 'x' where id = ${lit(done)};`, { actor: 'lucas', session: null }), 'done');
    const da = ins('lucas', 'decided', 'proposed');
    ok(req(db, `update public.tasks set status = 'decided_against', closed_at = now(), closing_note = 'no' where id = ${lit(da)};`, { actor: 'lucas', session: null }), 'da');
    const noted = ins('lucas', 'open with a last-write note', 'open');
    ok(req(db, `update public.tasks set note = 'the last word' where id = ${lit(noted)};`, { actor: 'lucas', session: null }), 'note');
    ins('lucas', 'u'.repeat(80), 'open', ', description', `, ${lit('d'.repeat(600))}`);
    const before = val(db, `select string_agg(title || '|' || status || '|' || coalesce(note,'') || '|' || updated_at, E'\\n' order by short_id) from public.tasks;`);
    const hBefore = val(db, 'select count(*) from public.task_history;');
    const run = (text) => mode === 'LF'
      ? runPsql(c.targetFor(db), ['-q', '-A', '-t', '-f', '-'], { input: text })
      : runPsql(c.targetFor(db), ['-q', '-A', '-t', '-f', '-'], { input: `do $crlf$ begin execute replace($src$${splitSql(text)[0]}$src$, chr(10), chr(13) || chr(10)); end $crlf$;` });
    const dry = run(p6.dryRun);
    log(`E-${mode} dry run:`, (dry.stderr.match(/DRY RUN OK[^\n]*/) ?? [dry.stderr.slice(0, 300)])[0]);
    const app = run(p6.apply);
    log(`E-${mode} apply exit:`, app.status, app.stderr.trim().slice(0, 300));
    log(`E-${mode} rows after:\n` + val(db, `select string_agg(rpad(left(t.title,32),33) || rpad(t.status,17) || coalesce(t.needed_by::text,'-') || ' auths=' || (select count(*) from public.task_authorizations a where a.task_id = t.id) || ' tier=' || coalesce((select tier from public.task_authorizations a where a.id = t.authorization_id),'-') || ' note=' || coalesce(left(t.note,40),'NULL'), E'\\n' order by t.short_id nulls first) from public.tasks t;`));
    log(`E-${mode} history rows: before ${hBefore}, after`, val(db, 'select count(*) from public.task_history;'));
    log(`E-${mode} backfill notes:\n` + val(db, `select string_agg(left(note,140), E'\\n' order by id) from public.task_authorizations;`));
    const after = val(db, `select string_agg(title || '|' || status || '|' || coalesce(note,'') || '|' || updated_at, E'\\n' order by short_id) from public.tasks;`);
    const changedUpdated = before.split('\n').filter((l, i) => l.split('|')[3] !== after.split('\n')[i].split('|')[3]).length;
    log(`E-${mode} rows whose updated_at changed: ${changedUpdated}`);
    log(`E-${mode} the 'last-write note' row's tasks.note after:`, val(db, `select coalesce(note,'NULL') from public.tasks where title = 'open with a last-write note';`));
  }

  // ---------------- F: the snapshot query on a pre-006 database -----------------
  log('## F. snapshot query, 004 vs 006, on a post-005 database');
  const q004 = snapshotQuery(TASKS + 'migrations/004_schema_snapshot_fn.sql');
  const q006 = snapshotQuery(TASKS + 'migrations/006_authorization_record.sql');
  fresh('f5'); migrate('f5', '005');
  const run = (q) => ok(runPsql(c.targetFor('f5'), ['-q', '-A', '-t', '-f', '-'], { input: `begin transaction read only; set local search_path = ''; ${q}; rollback;` }), 'snap');
  const a = run(q004), b = run(q006);
  log('F1 004 query == 006 query on post-005:', a === b, `(${a.split('\n').length} lines)`);
  log('F2 the live function on post-005 is 004\'s body (what --api calls):', val('f5', `select md5(replace(prosrc, chr(13), '')) from pg_proc where proname = 'team_tasks_schema_snapshot';`));
} finally {
  c.stop();
}
