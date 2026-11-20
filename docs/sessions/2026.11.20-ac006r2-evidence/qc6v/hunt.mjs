// copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v/hunt.mjs; original sha256 b2373725fe1c045a735c4f5156f6196891a81825abb8cbb8071d1971ba820701; copied 2026-11-20 by AC-006R2
// QC6V hunt — what did the fix trip (16fb675) break? Throwaway loopback clusters only. Never reads a .env.
process.env.EVRYN_TASKS_TEST_MODE = '1';
const SB = 'file:///C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v-sandbox/scripts/tasks/';
const { startCluster } = await import(SB + 'test/acceptance/cluster.mjs');
const { startSupabaseShapedCluster } = await import(SB + 'test/acceptance/cluster-supabase.mjs');
const { changeSet } = await import(SB + 'make-paste.mjs');
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const TASKS = 'C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v-sandbox/scripts/tasks/';
const RT003 = 'C:/Users/jbmcg/Evryn/Code/evryn-team-runtime/migrations/003_tasks_proposals.sql';
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const SESSION = '0b6f7c1e-2f43-4c5a-9d1e-5f7a8b9c0d1e';
const hdr = (a, s = SESSION) => JSON.stringify({ 'x-evryn-actor': a, ...(s ? { 'x-evryn-session': s } : {}) });
const log = (...a) => console.log(a.join(' '));
const verdict = (r) => (r.status === 0 ? 'ACCEPTED' : 'REFUSED: ' + (r.stderr.match(/ERROR:\s+(\S+: [^\n]{0,120})/)?.[1] ?? r.stderr.slice(0, 200)));

// ---------------- Part H: legitimate paths on the 001-006 shape (superuser owner) ----------------
const c = await startCluster();
try {
  const P = (db, sql) => c.psql(db, sql);
  const ok = (r, w) => { if (r.status !== 0) throw new Error(`${w}: ${r.stderr}`); return r.stdout.trim(); };
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
  const db = 'h6';
  ok(P('postgres', `create database ${db};`), 'db');
  ok(P(db, `grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;`), 'defaults on');
  ok(P(db, readFileSync(RT003, 'utf8')), 'rt003');
  ok(P(db, `alter default privileges in schema public revoke all on tables from anon, authenticated, service_role;`), 'defaults off');
  const m =spawnSync(process.execPath, [TASKS + 'migrate.mjs'], { encoding: 'utf8', env: { ...process.env, EVRYN_TASKS_ENV_FROM_PROCESS: '1', EVRYN_TASKS_LOCAL_PG: c.urlFor(db) } });
  if (m.status !== 0) throw new Error('migrate ' + m.stderr);
  const val = (sql) => ok(P(db, sql), sql);
  const st = (id) => val(`select status || ' auth=' || coalesce(authorization_id::text,'NULL') || ' reauth=' || needs_reauthorization from public.tasks where id = ${lit(id)};`);
  const newTask = (title, { actor = 'ac', status = 'proposed', extra = '', vals = '' } = {}) => ok(req(db, `insert into public.tasks (title, status, raci${extra}) values (${lit(title)}, ${lit(status)}, '{"r":"lucas"}'${vals}) returning id;`, { actor }), 'new').split('\n').pop();
  const auth = (id, { tier = 'lucas', kind = 'authorization', note = 'go' } = {}) =>
    req(db, `insert into public.task_authorizations (task_id, kind, tier, rule_ref, justin_ref, note) values (${lit(id)}, ${lit(kind)}, ${lit(tier)}, ${tier === 'lucas' ? lit('authorization-rules.md §1 item 1') : 'null'}, ${tier === 'justin' ? lit('his words, Log') : 'null'}, ${lit(note)}) returning id;`, { actor: 'lucas' });
  const upd = (id, set, o) => req(db, `update public.tasks set ${set} where id = ${lit(id)};`, o);

  log('## H. legitimate paths at 16fb675');
  // H1 the authorization trigger's own update, in each starting status
  const b = newTask('h1 backlog', { status: 'backlog', extra: ', needed_by', vals: `, current_date + 10` });
  log('H1a authorize a backlog task:', verdict(auth(b)), '->', st(b));
  const p = newTask('h1 proposed');
  log('H1b authorize a proposed task:', verdict(auth(p)), '->', st(p));
  ok(upd(p, `status = 'in_progress', note = 'start'`), 'start');
  log('H1c re-authorize an in_progress task at tier justin (the upgrade path):', verdict(auth(p, { tier: 'justin' })), '->', st(p));
  log('    its pointer is the justin row:', val(`select a.tier from public.tasks t join public.task_authorizations a on a.id = t.authorization_id where t.id = ${lit(p)};`));
  const r = newTask('h1 returned'); ok(auth(r), 'a'); ok(upd(r, `description = 'new job'`), 'rescope');
  log('H1d authorize a RETURNED task (proposed, flag true):', verdict(auth(r)), '->', st(r));
  const two = newTask('h1 twice');
  log('H1e two authorization rows for the SAME task in one request:',
    verdict(req(db, `insert into public.task_authorizations (task_id, kind, tier, rule_ref, note) select ${lit(two)}::uuid, 'authorization', 'lucas', 'r', 'n' || g from generate_series(1,2) g;`, { actor: 'lucas' })), '->', st(two),
    val(`select count(*) || ' rows; pointer=max? ' || (select (t.authorization_id = max(a.id))::text from public.tasks t join public.task_authorizations a on a.task_id = t.id where t.id = ${lit(two)} group by t.authorization_id) from public.task_authorizations where task_id = ${lit(two)};`));
  // H2 acceptance
  const a1 = newTask('h2 lucas acc'); ok(auth(a1), 'a'); ok(upd(a1, `status = 'needs_acceptance', addressed_to = 'lucas', note = 'pls'`), 'hand in');
  log('H2a lucas-tier acceptance of a lucas-tier authorization:', verdict(auth(a1, { kind: 'acceptance', note: 'delivered' })), '->', st(a1));
  const a2 = newTask('h2 justin acc'); ok(auth(a2, { tier: 'justin' }), 'a'); ok(upd(a2, `status = 'needs_acceptance', addressed_to = 'lucas', note = 'pls'`), 'hand in');
  log('H2b justin-tier acceptance of a justin-tier authorization:', verdict(auth(a2, { kind: 'acceptance', tier: 'justin', note: 'delivered' })), '->', st(a2));
  const a3 = newTask('h2 upgraded'); ok(auth(a3), 'a'); ok(auth(a3, { tier: 'justin' }), 'upgrade'); ok(upd(a3, `status = 'needs_acceptance', addressed_to = 'lucas', note = 'pls'`), 'hand in');
  log('H2c lucas acceptance after an upgrade to justin tier (must refuse):', verdict(auth(a3, { kind: 'acceptance', note: 'd' })));
  log('H2d justin acceptance after the upgrade:', verdict(auth(a3, { kind: 'acceptance', tier: 'justin', note: 'd' })), '->', st(a3));
  // H4 owner withdrawing
  const w = newTask('h4 withdraw'); ok(auth(w), 'a');
  log('H4a active -> proposed by ac (owner withdrawing):', verdict(upd(w, `status = 'proposed', note = 'withdrawn'`)), '->', st(w));
  log('H4b proposed -> backlog by ac:', verdict(upd(w, `status = 'backlog', needed_by = current_date + 10, note = 'park'`)), '->', st(w));
  log('H4c backlog -> decided_against by ac:', verdict(upd(w, `status = 'decided_against', closed_at = now(), closing_note = 'dropped'`)), '->', st(w));
  const w2 = newTask('h4 withdraw+rescope'); ok(auth(w2), 'a');
  log('H4d active -> proposed with a scope edit in the same write (allowed by ET016):', verdict(upd(w2, `status = 'proposed', title = 'h4 rescoped', note = 'rescoping'`)), '->', st(w2));
  log('    its last history note:', val(`select note from public.task_history where task_id = ${lit(w2)} order by id desc limit 1;`));
  // H5 lucas reopening a closed task
  log('H5a lucas reopens a decided_against task to proposed:', verdict(upd(w, `status = 'proposed', note = 'Justin sent it back'`, { actor: 'lucas' })), '->', st(w));
  log('H5b then authorizes it again:', verdict(auth(w)), '->', st(w));
  log('H5c lucas reopens a DONE task (H2a) to proposed:', verdict(upd(a1, `status = 'proposed', note = 'reopen'`, { actor: 'lucas' })), '->', st(a1));
  // H6 note-only writes on authorized work
  const n = newTask('h6 notes'); ok(auth(n), 'a');
  log('H6a note-only on open, ac with session:', verdict(upd(n, `note = 'progress: half'`)), '->', st(n));
  ok(upd(n, `status = 'needs_acceptance', addressed_to = 'lucas', note = 'pls'`), 'hand in');
  log('H6b note-only on needs_acceptance:', verdict(upd(n, `note = 'progress: docs/x.md'`)), '->', st(n));
  log('H7 launcher note-only, no session, on needs_acceptance:', verdict(upd(n, `note = 'SHADOW: would start'`, { actor: 'launcher', session: null })), '->', st(n));
  // H8 ordering: ET016 against the forced return, and C6 against ET014
  const o = newTask('h8 order'); ok(auth(o), 'a');
  log('H8a scope edit with the status UNCHANGED (forced return, not ET016):', verdict(upd(o, `title = 'h8 renamed', status = 'open'`)), '->', st(o));
  const o2 = newTask('h8 order2'); ok(auth(o2), 'a');
  log('H8b scope edit + in_progress (ET016):', verdict(upd(o2, `title = 'x2', status = 'in_progress', note = 'go'`)), '->', st(o2));
  log('H8c scope edit + backlog (ET016):', verdict(upd(o2, `title = 'x3', status = 'backlog', needed_by = current_date + 5, note = 'park'`)), '->', st(o2));
  log('H8d scope edit + needs_reauthorization=false by a client (ET014 before ET016):', verdict(upd(o2, `title = 'x4', needs_reauthorization = false`)), '->', st(o2));
  ok(upd(o2, `title = 'x5'`), 'return');
  log('H8e a returned task: client decided_against AND needs_reauthorization=false in one write:', verdict(upd(o2, `status = 'decided_against', closed_at = now(), closing_note = 'no', needs_reauthorization = false`)), '->', st(o2));
  log('H8f same without touching the flag (C6 clears it):', verdict(upd(o2, `status = 'decided_against', closed_at = now(), closing_note = 'no'`)), '->', st(o2));
  const o3 = newTask('h8 order3'); ok(auth(o3), 'a'); ok(upd(o3, `title = 'y1'`), 'return');
  log('H8g a returned task moved to backlog keeps the flag (C6 is closed-only):', verdict(upd(o3, `status = 'backlog', needed_by = current_date + 5, note = 'park'`)), '->', st(o3));
  const o4 = newTask('h8 order4'); ok(auth(o4), 'a');
  log('H8h lucas: scope edit + decided_against on authorized work (ET016, no silent replace):', verdict(upd(o4, `title = 'z', status = 'decided_against', closed_at = now(), closing_note = 'no'`, { actor: 'lucas' })), '->', st(o4));
  log('H8i owner-only edit (raci.r) + status proposed on open (allowed):', verdict(upd(o4, `raci = '{"r":"soren"}', status = 'proposed', note = 'reassign'`)), '->', st(o4));
  // H9 NB1 on the C4 setting: a crafted setting naming a row of THIS task whose scope matches, by ac, on proposed
  const k = newTask('h9 crafted'); const kr = ok(auth(k), 'a').split('\n').pop(); ok(upd(k, `status = 'proposed', note = 'withdraw'`), 'w');
  log('H9 withdrawn task, crafted setting naming its OWN matching row, ac moves it open (residual if a client could set the GUC):',
    verdict(upd(k, `authorization_id = ${kr}, status = 'open', note = 'crafted'`, { sets: [`set local evryn.authorizing = '${kr}:${k}';`] })), '->', st(k));
} finally { c.stop(); }

// ---------------- Part S: NB4 on a Supabase-shaped cluster (postgres owner is NOT a superuser) ----------------
const s = await startSupabaseShapedCluster();
try {
  const ok = (r, w) => { if (r.status !== 0) throw new Error(`${w}: ${r.stderr}`); return r.stdout.trim(); };
  ok(s.psqlAs('supabase_admin', 'postgres', 'create database team owner postgres;'), 'db');
  ok(s.psqlAs('postgres', 'team', `grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;`), 'defaults on');
  ok(s.psqlAs('postgres', 'team', readFileSync(RT003, 'utf8')), 'rt003');
  ok(s.psqlAs('postgres', 'team', `alter default privileges in schema public revoke all on tables from anon, authenticated, service_role;`), 'defaults off');
  for (const id of ['001-004', '005', '006']) ok(s.psqlAs('postgres', 'team', readFileSync(changeSet(id).files.apply, 'utf8')), id);
  ok(s.psqlAs('supabase_admin', 'postgres', `create role probe_member login; grant postgres to probe_member;`), 'member');
  const asRole = (login, role, actor, body) => s.psqlAs(login, 'team', ['\\set VERBOSITY verbose', 'begin;', role ? `set local role ${role};` : '', `set local request.headers = ${lit(hdr(actor, null))};`, `set local evryn.migration = '006';`, body, 'commit;'].join('\n'));
  // seed one blocked+backlog task that is active (authorized), as the owner via client role
  const seed = ok(s.psqlAs('postgres', 'team', `begin; set local role service_role; set local request.headers = ${lit(hdr('lucas'))};
    insert into public.tasks (title, status, raci, tags) values ('s1', 'proposed', '{"r":"lucas"}', array['backlog']) returning id; commit;`), 'seed').split('\n').filter(Boolean).pop();
  ok(s.psqlAs('postgres', 'team', `begin; set local role service_role; set local request.headers = ${lit(hdr('lucas'))};
    insert into public.task_authorizations (task_id, kind, tier, rule_ref, note) values (${lit(seed)}, 'authorization', 'lucas', 'r', 'go');
    update public.tasks set status = 'blocked', note = 'w' where id = ${lit(seed)}; commit;`), 'auth+block');
  const move = `update public.tasks set status = 'backlog', needed_by = current_date + 10, note = 'migration 006: x' where id = ${lit(seed)};`;
  log('## S. NB4 on a Supabase-shaped cluster');
  log('S0 owner of public.tasks:', ok(s.psqlAs('postgres', 'team', `select pg_get_userbyid(relowner) || ' super=' || (select rolsuper from pg_roles where rolname = pg_get_userbyid(relowner)) from pg_class where oid = 'public.tasks'::regclass;`), 'own'));
  const sStatus = () => ok(s.psqlAs('postgres', 'team', `select status from public.tasks where id = ${lit(seed)};`), 'st');
  for (const role of ['service_role', 'authenticated', 'anon']) {
    const r = asRole('postgres', role, 'justin', move.replace(/;$/, ' returning id;'));
    log(`S1 ${role} with evryn.migration=006:`, verdict(r), `rows returned=${r.stdout.trim().split('\n').filter((l) => /^[0-9a-f-]{36}$/.test(l)).length}`, `status now=${sStatus()}`);
  }
  log('S2 authenticator (login) with evryn.migration=006:', verdict(asRole('authenticator', null, 'justin', move)));
  log('S3 supabase_admin (a superuser, NOT the owner) with evryn.migration=006:', verdict(asRole('supabase_admin', null, 'justin', move)));
  log('S4 probe_member (member of postgres, not set role) with evryn.migration=006:', verdict(asRole('probe_member', null, 'justin', move)));
  log('S5 the owner postgres with evryn.migration=006 (the exemption, positive control):', verdict(asRole('postgres', null, 'justin', move)));
  log('S6 backfill insert by the owner with the setting, no session:', verdict(s.psqlAs('postgres', 'team', ['\\set VERBOSITY verbose', 'begin;', `set local request.headers = ${lit(hdr('justin', null))};`, `set local evryn.migration = '006';`,
    `insert into public.task_authorizations (task_id, kind, tier, source, rule_ref, note) select id, 'authorization', 'backfill', 'migration_006', 'r', 'n' from public.tasks where title = 's1';`, 'rollback;'].join('\n'))));
} finally { s.stop(); }
