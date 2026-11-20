// copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v/probe2.mjs; original sha256 84dc8620f18b283936efe1944f33444f0851845b1f9164f6823f27c73aac6f66; copied 2026-11-20 by AC-006R2
// QC6 probe 2 — the 006 paste as it runs installed: the owner `postgres` is NOT a superuser (as on Supabase).
// Throwaway loopback cluster whose bootstrap superuser is `supabase_admin`. Reads the COMMITTED paste files from the
// guards-006 worktree (read-only). Never reads a .env, never connects anywhere but 127.0.0.1.
process.env.EVRYN_TASKS_TEST_MODE = '1';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BIN = 'C:/Program Files/PostgreSQL/17/bin';
const WT = 'C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v-sandbox/scripts/tasks/';
const RT003 = 'C:/Users/jbmcg/Evryn/Code/evryn-team-runtime/migrations/003_tasks_proposals.sql';
const port = await new Promise((r) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const dir = mkdtempSync(join(tmpdir(), 'qc6-ns-'));
const data = join(dir, 'data');
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const log = (...a) => console.log(a.join(' '));
// SEALED-EXEC: followed 2026-08-11 — absolute paths to the installed PostgreSQL 17 binaries; no network.
const sh = (exe, args, opts = {}) => spawnSync(join(BIN, exe), args, { encoding: 'utf8', windowsHide: true, ...opts });
const init = sh('initdb.exe', ['-D', data, '-U', 'supabase_admin', '-A', 'trust', '-E', 'UTF8', '--no-locale', '--no-instructions']);
if (init.status !== 0) throw new Error(init.stderr);
sh('pg_ctl.exe', ['-D', data, '-l', join(dir, 'log'), '-w', '-o', `-p ${port} -c listen_addresses=127.0.0.1`, 'start'], { stdio: 'ignore' });
const psql = (user, db, sql) => sh('psql.exe', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-p', String(port), '-U', user, '-d', db, '-f', '-'], { input: sql });
const ok = (r, w) => { if (r.status !== 0) throw new Error(`${w}: ${r.stderr}`); return r.stdout.trim(); };
try {
  ok(psql('supabase_admin', 'postgres', `
    create role anon nologin noinherit; create role authenticated nologin noinherit;
    create role service_role nologin noinherit bypassrls; create role authenticator login noinherit;
    grant anon, authenticated, service_role to authenticator;
    create role postgres login createrole createdb bypassrls;           -- Supabase-like: NOT a superuser
    grant anon, authenticated, service_role to postgres;
    create database team owner postgres;`), 'setup');
  log('owner is superuser? ', ok(psql('supabase_admin', 'team', `select rolsuper from pg_roles where rolname = 'postgres';`), 'q'));
  ok(psql('postgres', 'team', `grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;`), 'defaults on');
  ok(psql('postgres', 'team', readFileSync(RT003, 'utf8')), 'runtime 003 as postgres');
  ok(psql('postgres', 'team', `alter default privileges in schema public revoke all on tables from anon, authenticated, service_role;`), 'defaults off');
  for (const f of ['paste-2-apply.sql', '005-paste-2-apply.sql']) {
    const r = psql('postgres', 'team', readFileSync(WT + 'paste/' + f, 'utf8'));
    log(`${f} as non-superuser postgres: exit ${r.status}`, r.status ? r.stderr.slice(0, 400) : '');
  }
  const seed = (actor, title, status, cols = '', vals = '') => ok(psql('postgres', 'team', `begin; set local role service_role; set local request.headers = ${lit(JSON.stringify({ 'x-evryn-actor': actor }))};
    insert into public.tasks (title, status, raci${cols}) values (${lit(title)}, ${lit(status)}, '{"r":"lucas"}'${vals}); commit;`), title);
  seed('lucas', 'bl', 'blocked', ', tags, needed_by', `, array['backlog'], current_date + 120`);
  seed('lucas', 'open one', 'open'); seed('ac', 'imported', 'open', ', linear_id', `, 'EVR-1'`); seed('lucas', 'prop', 'proposed');
  const dry = psql('postgres', 'team', readFileSync(WT + 'paste/006-paste-1-dry-run.sql', 'utf8'));
  log('006 dry run as non-superuser postgres:', (dry.stderr.match(/ERROR:\s+([^\n]*)/) ?? [, dry.stderr.slice(0, 400)])[1]);
  const app = psql('postgres', 'team', readFileSync(WT + 'paste/006-paste-2-apply.sql', 'utf8'));
  log('006 apply as non-superuser postgres: exit', app.status, app.status ? app.stderr.slice(0, 600) : '');
  log('after:', ok(psql('postgres', 'team', `select string_agg(title || ':' || status || ':' || coalesce((select tier from public.task_authorizations a where a.id = t.authorization_id),'-'), ', ' order by short_id) from public.tasks t;`), 'after'));
  // the launcher's only write: a note-only PATCH as actor launcher, no session header, on an open task
  const g = psql('postgres', 'team', `\\set VERBOSITY verbose
begin; set local role service_role; set local request.headers = ${lit(JSON.stringify({ 'x-evryn-actor': 'launcher' }))};
update public.tasks set note = 'SHADOW 2026-11-19: would start' where title = 'open one'; commit;`);
  log('launcher note-only write on an open task, no session:', g.status === 0 ? 'ACCEPTED' : g.stderr.slice(0, 300));
  log('   after it:', ok(psql('postgres', 'team', `select t.status || ' auth=' || coalesce(t.authorization_id::text,'NULL') || ' | ' || h.actor || ' flags=' || array_to_string(h.flags, ',') || ' session=' || coalesce(h.session_id,'NULL') || ' changed=' || array_to_string(h.changed_fields, ',') from public.tasks t join public.task_history h on h.task_id = t.id where t.title = 'open one' order by h.id desc limit 1;`), 'g'));
  // the launcher's read of a task's authorization record, as service_role
  log('service_role reads task_authorizations:', ok(psql('postgres', 'team', `begin; set local role service_role; select count(*) from public.task_authorizations; commit;`), 'read'));
} finally {
  sh('pg_ctl.exe', ['-D', data, '-m', 'immediate', '-w', 'stop'], { stdio: 'ignore' });
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
