#!/usr/bin/env node
/**
 * schema-snapshot.mjs — READ-ONLY. Print a deterministic text description of public.tasks and
 * public.task_history: columns, defaults, identity/generated, constraints, indexes, triggers, RLS,
 * policies, grants, owners, the identity sequences, and the task functions (security mode,
 * search_path, privileges, a hash of the body).
 *
 * USAGE
 *   node schema-snapshot.mjs > live-before.txt                    (the Evryn Team database)
 *   EVRYN_TASKS_LOCAL_PG=postgresql://postgres@127.0.0.1:<port>/postgres node schema-snapshot.mjs
 *   node snapshot-compare.mjs local-before.txt live-before.txt     (classifies every difference)
 *
 * WHAT IS A STOP (Soren, S1, 2026-11-05 15:29) is decided by snapshot-compare.mjs, not by eye. Each
 * fact this prints is ONE line with a kind prefix, so the compare can classify it: the server version
 * (`#` lines, information), `table` (owner), `rls` (enabled / forced), `column`, `constraint`, `index`,
 * `trigger`, `policy`, `grant` (table privileges, one grantee and privilege per line), `sequence` and
 * `sequence-grant` (the identity sequences), `function` (definition hash, security mode, search_path)
 * and `function-grant` (EXECUTE, one grantee per line, for every function the migrations create).
 *
 * Runs inside `begin transaction read only` and ends with rollback. Prints no credential.
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { pathToFileURL } from 'node:url';
import { ConfigError, ENV_FILES, VAR, loadVars, pgTarget } from './lib/config.mjs';
import { runPsql } from './lib/pg.mjs';

export const SNAPSHOT_SQL = String.raw`
begin transaction read only;

select '# server_version=' || current_setting('server_version');
select '# server_version_num=' || current_setting('server_version_num');

select format('table %s: owner=%s', c.relname, pg_get_userbyid(c.relowner))
from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname in ('tasks','task_history')
order by c.relname;

select format('rls %s: enabled=%s forced=%s', c.relname, c.relrowsecurity::text, c.relforcerowsecurity::text)
from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname in ('tasks','task_history')
order by c.relname;

select format('column %s #%s %s %s%s%s%s',
  c.relname,
  lpad(row_number() over (partition by c.relname order by a.attnum)::text, 2, '0'),
  a.attname,
  format_type(a.atttypid, a.atttypmod),
  case when a.attnotnull then ' NOT NULL' else '' end,
  case a.attidentity when 'a' then ' IDENTITY ALWAYS' when 'd' then ' IDENTITY BY DEFAULT' else '' end,
  case when a.attgenerated = 's' then ' GENERATED ' || pg_get_expr(d.adbin, d.adrelid)
       when d.adbin is not null then ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid)
       else '' end)
from pg_class c
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
where c.relnamespace = 'public'::regnamespace and c.relname in ('tasks','task_history')
order by c.relname, a.attnum;

select format('constraint %s.%s: %s', c.relname, con.conname, pg_get_constraintdef(con.oid))
from pg_constraint con join pg_class c on c.oid = con.conrelid
where c.relnamespace = 'public'::regnamespace and c.relname in ('tasks','task_history')
order by c.relname, con.conname;

select format('index %s.%s: %s', tablename, indexname, indexdef)
from pg_indexes
where schemaname = 'public' and tablename in ('tasks','task_history')
order by tablename, indexname;

select format('trigger %s.%s: %s [enabled=%s]', c.relname, t.tgname, pg_get_triggerdef(t.oid), t.tgenabled)
from pg_trigger t join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal and c.relnamespace = 'public'::regnamespace and c.relname in ('tasks','task_history')
order by c.relname, t.tgname;

select format('policy %s.%s: %s %s to %s using (%s) with check (%s)',
  tablename, policyname, permissive, cmd, array_to_string(roles, ','), coalesce(qual, '-'), coalesce(with_check, '-'))
from pg_policies
where schemaname = 'public' and tablename in ('tasks','task_history')
order by tablename, policyname;

select format('grant %s: %s %s%s', c.relname, coalesce(r.rolname, 'PUBLIC'), a.privilege_type,
              case when a.is_grantable then ' WITH GRANT OPTION' else '' end)
from pg_class c
cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
left join pg_roles r on r.oid = a.grantee
where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname in ('tasks','task_history')
order by c.relname, coalesce(r.rolname, 'PUBLIC'), a.privilege_type;

select format('sequence %s.%s: owner=%s', c.relname, att.attname, pg_get_userbyid(sc.relowner))
from pg_class c
join pg_attribute att on att.attrelid = c.oid and att.attidentity <> '' and not att.attisdropped
join pg_class sc on sc.oid = pg_get_serial_sequence(format('public.%I', c.relname), att.attname)::regclass
where c.relnamespace = 'public'::regnamespace and c.relname in ('tasks','task_history')
order by c.relname, att.attname;

select format('sequence-grant %s.%s: %s %s', c.relname, att.attname, coalesce(r.rolname, 'PUBLIC'), a.privilege_type)
from pg_class c
join pg_attribute att on att.attrelid = c.oid and att.attidentity <> '' and not att.attisdropped
join pg_class sc on sc.oid = pg_get_serial_sequence(format('public.%I', c.relname), att.attname)::regclass
cross join lateral aclexplode(coalesce(sc.relacl, acldefault('s', sc.relowner))) a
left join pg_roles r on r.oid = a.grantee
where c.relnamespace = 'public'::regnamespace and c.relname in ('tasks','task_history')
order by c.relname, att.attname, coalesce(r.rolname, 'PUBLIC'), a.privilege_type;

select format('function %s(%s): owner=%s security=%s volatility=%s config=%s body_md5=%s',
  p.proname, pg_get_function_identity_arguments(p.oid), pg_get_userbyid(p.proowner),
  case when p.prosecdef then 'DEFINER' else 'INVOKER' end, p.provolatile,
  coalesce(array_to_string(p.proconfig, ';'), '-'),
  md5(replace(p.prosrc, chr(13), '')))
from pg_proc p
where p.pronamespace = 'public'::regnamespace and (p.proname like 'task\_%' or p.proname like 'tasks\_%')
order by p.proname;

select format('function-grant %s(%s): %s %s', p.proname, pg_get_function_identity_arguments(p.oid), coalesce(r.rolname, 'PUBLIC'), a.privilege_type)
from pg_proc p
cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
left join pg_roles r on r.oid = a.grantee
where p.pronamespace = 'public'::regnamespace and (p.proname like 'task\_%' or p.proname like 'tasks\_%')
order by p.proname, coalesce(r.rolname, 'PUBLIC'), a.privilege_type;

rollback;
`;

export function runSnapshot(argv, { env, psql = runPsql, out = (s) => process.stdout.write(s), err = console.error } = {}) {
  if (argv.length) {
    err('usage: node schema-snapshot.mjs   (no options; EVRYN_TASKS_LOCAL_PG selects a local loopback cluster)');
    return 2;
  }
  let target;
  try {
    target = pgTarget(loadVars([VAR.password, VAR.local], { env, file: ENV_FILES.team }));
  } catch (e) {
    err(`SNAPSHOT REFUSED: ${e instanceof ConfigError ? e.message : 'could not resolve the target'}`);
    return 1;
  }
  const r = psql(target, ['-q', '-A', '-t', '-f', '-'], { input: SNAPSHOT_SQL });
  if (r.status !== 0) {
    err(`SNAPSHOT FAILED: psql exited ${r.status}\n${r.stderr.trim()}`);
    return 1;
  }
  const text = r.stdout.split(/\r?\n/).filter((l) => l.trim() !== '').join('\n');
  out(`${text}\n`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = runSnapshot(process.argv.slice(2));
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
