-- 004_schema_snapshot_fn.sql — public.team_tasks_schema_snapshot(): the schema snapshot, readable
-- over the API (Soren's paste design, 2026-11-05 16:00–16:07; Tasks AC's fix trip 3).
--
-- WHY. No agent holds the database password: Justin applies the migration by pasting it into the
-- Supabase SQL editor. So after Paste 2, the only way to compare live with the local golden snapshot
-- is through PostgREST with the secret key — which needs a function.
--
-- ONE SOURCE OF TRUTH. The query between the SNAPSHOT-QUERY markers below is the ONLY copy of the
-- snapshot query. schema-snapshot.mjs extracts it from this file and runs it directly (for a local
-- cluster, before or after migrating), so the function and the script return the same text BY
-- CONSTRUCTION; the acceptance suite also asserts it. Edit the query here, and nowhere else.
--
-- SECURITY. Read-only (STABLE, catalog reads only), SECURITY INVOKER, pinned search_path. EXECUTE to
-- service_role only; explicitly revoked from PUBLIC, anon and authenticated.
-- Idempotent (CREATE OR REPLACE). Applied with 001–003 in one transaction.
-- Truncation check: the last line of this file should read `FULL FILE LOADED` — if you don't see it, your load was truncated; re-read until you do.

create or replace function public.team_tasks_schema_snapshot()
returns text
language sql
stable
security invoker
set search_path = ''
as $snapshot$
-- SNAPSHOT-QUERY-BEGIN
select concat_ws(E'\n',
  '# server_version=' || current_setting('server_version'),
  '# server_version_num=' || current_setting('server_version_num'),

  (select string_agg(format('table %s: owner=%s', c.relname, pg_get_userbyid(c.relowner)), E'\n' order by c.relname)
     from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname in ('tasks','task_history','proposals')),

  (select string_agg(format('rls %s: enabled=%s forced=%s', c.relname, c.relrowsecurity::text, c.relforcerowsecurity::text), E'\n' order by c.relname)
     from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname in ('tasks','task_history','proposals')),

  (select string_agg(s.line, E'\n' order by s.relname, s.attnum) from (
     select c.relname, a.attnum,
            format('column %s #%s %s %s%s%s%s',
              c.relname,
              lpad(row_number() over (partition by c.relname order by a.attnum)::text, 2, '0'),
              a.attname,
              format_type(a.atttypid, a.atttypmod),
              case when a.attnotnull then ' NOT NULL' else '' end,
              case a.attidentity when 'a' then ' IDENTITY ALWAYS' when 'd' then ' IDENTITY BY DEFAULT' else '' end,
              case when a.attgenerated = 's' then ' GENERATED ' || pg_get_expr(d.adbin, d.adrelid)
                   when d.adbin is not null then ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid)
                   else '' end) as line
       from pg_class c
       join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
       left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
      where c.relnamespace = 'public'::regnamespace and c.relname in ('tasks','task_history','proposals')) s),

  (select string_agg(format('constraint %s.%s: %s', c.relname, con.conname, pg_get_constraintdef(con.oid)), E'\n' order by c.relname, con.conname)
     from pg_constraint con join pg_class c on c.oid = con.conrelid
    where c.relnamespace = 'public'::regnamespace and c.relname in ('tasks','task_history','proposals')),

  (select string_agg(format('index %s.%s: %s', i.tablename, i.indexname, i.indexdef), E'\n' order by i.tablename, i.indexname)
     from pg_indexes i
    where i.schemaname = 'public' and i.tablename in ('tasks','task_history','proposals')),

  (select string_agg(format('trigger %s.%s: %s [enabled=%s]', c.relname, t.tgname, pg_get_triggerdef(t.oid), t.tgenabled), E'\n' order by c.relname, t.tgname)
     from pg_trigger t join pg_class c on c.oid = t.tgrelid
    where not t.tgisinternal and c.relnamespace = 'public'::regnamespace and c.relname in ('tasks','task_history','proposals')),

  (select string_agg(format('policy %s.%s: %s %s to %s using (%s) with check (%s)',
            p.tablename, p.policyname, p.permissive, p.cmd, array_to_string(p.roles, ','), coalesce(p.qual, '-'), coalesce(p.with_check, '-')),
          E'\n' order by p.tablename, p.policyname)
     from pg_policies p
    where p.schemaname = 'public' and p.tablename in ('tasks','task_history','proposals')),

  (select string_agg(format('grant %s: %s %s%s', c.relname, coalesce(r.rolname, 'PUBLIC'), a.privilege_type,
                            case when a.is_grantable then ' WITH GRANT OPTION' else '' end),
          E'\n' order by c.relname, coalesce(r.rolname, 'PUBLIC'), a.privilege_type)
     from pg_class c
     cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
     left join pg_roles r on r.oid = a.grantee
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname in ('tasks','task_history','proposals')),

  (select string_agg(format('sequence %s.%s: owner=%s', c.relname, att.attname, pg_get_userbyid(sc.relowner)), E'\n' order by c.relname, att.attname)
     from pg_class c
     join pg_attribute att on att.attrelid = c.oid and att.attidentity <> '' and not att.attisdropped
     join pg_class sc on sc.oid = pg_get_serial_sequence(format('public.%I', c.relname), att.attname)::regclass
    where c.relnamespace = 'public'::regnamespace and c.relname in ('tasks','task_history','proposals')),

  (select string_agg(format('sequence-grant %s.%s: %s %s', c.relname, att.attname, coalesce(r.rolname, 'PUBLIC'), a.privilege_type),
          E'\n' order by c.relname, att.attname, coalesce(r.rolname, 'PUBLIC'), a.privilege_type)
     from pg_class c
     join pg_attribute att on att.attrelid = c.oid and att.attidentity <> '' and not att.attisdropped
     join pg_class sc on sc.oid = pg_get_serial_sequence(format('public.%I', c.relname), att.attname)::regclass
     cross join lateral aclexplode(coalesce(sc.relacl, acldefault('s', sc.relowner))) a
     left join pg_roles r on r.oid = a.grantee
    where c.relnamespace = 'public'::regnamespace and c.relname in ('tasks','task_history','proposals')),

  (select string_agg(format('function %s(%s): owner=%s security=%s volatility=%s config=%s body_md5=%s',
            p.proname, pg_get_function_identity_arguments(p.oid), pg_get_userbyid(p.proowner),
            case when p.prosecdef then 'DEFINER' else 'INVOKER' end, p.provolatile,
            coalesce(array_to_string(p.proconfig, ';'), '-'),
            md5(replace(p.prosrc, chr(13), ''))), E'\n' order by p.proname)
     from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and (p.proname like 'task\_%' or p.proname like 'tasks\_%' or p.proname = 'team_tasks_schema_snapshot')),

  (select string_agg(format('function-grant %s(%s): %s %s', p.proname, pg_get_function_identity_arguments(p.oid), coalesce(r.rolname, 'PUBLIC'), a.privilege_type),
          E'\n' order by p.proname, coalesce(r.rolname, 'PUBLIC'), a.privilege_type)
     from pg_proc p
     cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
     left join pg_roles r on r.oid = a.grantee
    where p.pronamespace = 'public'::regnamespace
      and (p.proname like 'task\_%' or p.proname like 'tasks\_%' or p.proname = 'team_tasks_schema_snapshot')),

  -- Default privileges for FUTURE objects (QC Finding 1): LISTED by the compare, never a stop.
  (select string_agg(s.line, E'\n' order by s.line) from (
     select format('default-acl %s %s %s: %s %s',
              pg_get_userbyid(d.defaclrole), coalesce(n.nspname, '(all-schemas)'),
              case d.defaclobjtype when 'r' then 'tables' when 'S' then 'sequences' when 'f' then 'functions'
                                   when 'T' then 'types' when 'n' then 'schemas' else d.defaclobjtype::text end,
              coalesce(r.rolname, 'PUBLIC'), a.privilege_type) as line
       from pg_default_acl d
       left join pg_namespace n on n.oid = d.defaclnamespace
       cross join lateral aclexplode(d.defaclacl) a
       left join pg_roles r on r.oid = a.grantee) s)
)
-- SNAPSHOT-QUERY-END
$snapshot$;

comment on function public.team_tasks_schema_snapshot() is
  'Read-only text description of tasks, task_history, proposals, the task functions, their grants and the default '
  'privileges — the same text schema-snapshot.mjs prints (it runs this very query, extracted from migration 004). '
  'For comparing live with the local golden snapshot over the API after the paste. EXECUTE: service_role only.';

revoke all on function public.team_tasks_schema_snapshot() from public, anon, authenticated, service_role;
grant execute on function public.team_tasks_schema_snapshot() to service_role;

-- Truncation canary — DO NOT REMOVE: FULL FILE LOADED
