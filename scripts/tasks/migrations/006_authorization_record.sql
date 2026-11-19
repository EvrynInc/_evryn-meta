-- 006_authorization_record.sql — the authorization record (build brief 5 v2,
-- evryn-team-workspace/shared/projects/helm/2026/2026.11.13-autonomy-guards-soren/builds/5-migration-006-v2.md;
-- Justin's Ballot 18, 2026-11-16: "authorization is its own record"; re-signed with conditions C3–C5 by
-- Admiral Soren 1.18 pm2, 2026-11-18 15:27).
--
-- STATUS SAYS WHERE THE WORK IS; public.task_authorizations SAYS WHO SAID YES, TO EXACTLY WHAT.
--   - Every task is created backlog or proposed, for every actor, lucas and justin included (ET011).
--   - The only way a task becomes authorized is a task_authorizations row written by lucas or justin (ET012);
--     that row's insert moves the task to open in the same transaction. Acceptance (done) is a second row.
--   - The database keeps tasks.scope_hash (title, description, owner) itself. A later scope edit on authorized
--     work, by ANY actor, returns the task to proposed, clears its authorization and sets needs_reauthorization.
--   - The authorization pointer (tasks.authorization_id) moves only from inside the authorization trigger (ET014).
--   - Which writes count as Justin-tier is one config row (public.task_auth_config) only the owner can change.
--
-- 🔴 HOW STRONG ET012 IS, SAID PLAINLY (Admiral Soren's condition C3, 2026-11-18). It is STRUCTURAL against the
-- accidental and the "helpful" write: an agent taking a default, or persuading itself a thing is in scope, as
-- its own actor. It is DETECTION-ONLY against a session that deliberately writes --as lucas: the actor is a
-- request header any session on this Windows account can set (the residual the guards design §5.3 names; 006
-- does not change it). What detects it: the session stamp (task_request_session) and the nightly audit
-- (scripts/tasks/audit.mjs). What would close it: task T-97's sign-in for Justin-tier rows (task_auth_config
-- switched to justin_signin), and later a separate operating-system identity for unattended agents.
--
-- 🔴 PREREQUISITE: migrations 001–005 of this folder (live since 2026-11-06).
--
-- WHAT IT TOUCHES: replaces three functions with CREATE OR REPLACE (tasks_before_write, tasks_after_write,
-- task_roster); recreates NO trigger on tasks or task_history (that would reset ENABLE ALWAYS); adds three
-- columns to tasks and one to task_history; creates two tables (task_authorizations, task_auth_config), five
-- functions and three triggers, every new trigger ENABLE ALWAYS. Then the data steps (§2.2 of the brief).
--
-- Every object is schema-qualified: the paste runs this with search_path = '' (paste-src/006/before.plpgsql).
-- Applied locally by migrate.mjs in one transaction with 001–005; live, by Justin's change-set-006 paste.
-- Truncation check: the last line of this file should read `FULL FILE LOADED` — if you don't see it, your load was truncated; re-read until you do.

do $$
begin
  if to_regclass('public.task_history') is null or to_regprocedure('public.tasks_before_write()') is null
     or not exists (select 1 from pg_attribute where attrelid = 'public.tasks'::regclass and attname = 'note' and not attisdropped) then
    raise exception 'TASKS-MIGRATION 006: migrations 001–005 of scripts/tasks/migrations/ are the prerequisite (public.task_history, public.tasks_before_write() and tasks.note must exist); apply them first.';
  end if;
end $$;

-- ============================================================================
-- (a) New columns
-- ============================================================================

alter table public.tasks add column if not exists scope_hash text;
alter table public.tasks add column if not exists authorization_id bigint;
alter table public.tasks add column if not exists needs_reauthorization boolean not null default false;
alter table public.task_history add column if not exists session_id text;

comment on column public.tasks.scope_hash is
  'sha256 of the task''s scope (title, description, owner), computed ONLY by public.task_scope_hash() and stamped by the '
  'tasks_before_write trigger on every insert and update, whatever the client sent. Compare it with an authorization row''s '
  'scope_hash; never recompute it outside the database.';
comment on column public.tasks.authorization_id is
  'The task_authorizations row (kind authorization) this task is currently authorized by, or NULL. Moved only from inside the '
  'authorization trigger (evryn.authorizing bound to that row AND this task); any client change is refused (ET014). Cleared when '
  'the task returns to proposed.';
comment on column public.tasks.needs_reauthorization is
  'True when a scope edit voided the task''s authorization and returned it to proposed. Set and cleared only by the database (ET014).';
comment on column public.task_history.session_id is
  'The x-evryn-session header of the write (the CLI sends CLAUDE_CODE_SESSION_ID), or NULL. As forgeable as the actor name; its value '
  'is that the honest path records it without anyone remembering to (guards design §5.2).';

-- ============================================================================
-- (b) The scope hash: ONE function, the only place it is computed
-- ============================================================================

create or replace function public.task_scope_hash(p_title text, p_description text, p_owner text)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
           pg_catalog.jsonb_build_array(coalesce(p_title, ''), coalesce(p_description, ''), coalesce(p_owner, ''))::text,
           'UTF8')), 'hex')
$$;

comment on function public.task_scope_hash(text, text, text) is
  'The ONLY computation of a task''s scope hash: sha256 hex of jsonb_build_array(title, description, owner)::text, NULLs as ''''. '
  'jsonb''s text form escapes every field, so content cannot fake a field boundary. The launcher compares stored hashes; it never recomputes.';

-- ============================================================================
-- (g) The session stamp
-- ============================================================================

create or replace function public.task_request_session()
returns text
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_raw     text;
  v_headers jsonb;
  v_session text;
begin
  v_raw := nullif(btrim(coalesce(current_setting('request.headers', true), '')), '');
  if v_raw is not null then
    begin
      v_headers := v_raw::jsonb;
    exception when others then
      v_headers := null;
    end;
    if v_headers is not null and jsonb_typeof(v_headers) = 'object' then
      v_session := nullif(v_headers->>'x-evryn-session', '');
    end if;
  end if;
  if v_session is not null and v_session !~ '^[A-Za-z0-9-]{1,64}$' then
    raise exception using
      errcode = 'ET002',
      message = 'task write refused: the x-evryn-session header is not a valid session id (letters, digits and - only, 1 to 64 characters).',
      hint    = 'The tasks CLI sends CLAUDE_CODE_SESSION_ID; send that or nothing.';
  end if;
  return v_session;
end;
$$;

comment on function public.task_request_session() is
  'Returns the x-evryn-session header of the current request, or NULL when absent (never raises for absence). '
  'Raises ET002 if present and malformed. Never reads a column.';

-- ============================================================================
-- (f) The Justin-tier seam: one config row only the owner can change
-- ============================================================================

create table if not exists public.task_auth_config (
  id                 integer primary key check (id = 1),
  justin_tier_source text not null check (justin_tier_source in ('lucas_relay','justin_signin')),
  justin_user_id     uuid
);
insert into public.task_auth_config (id, justin_tier_source, justin_user_id) values (1, 'lucas_relay', null)
  on conflict (id) do nothing;

alter table public.task_auth_config enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'task_auth_config' and policyname = 'service_role_read') then
    create policy "service_role_read" on public.task_auth_config for select to service_role using (true);
  end if;
end $$;
revoke all on table public.task_auth_config from public, anon, authenticated, service_role;
grant select on table public.task_auth_config to service_role;

comment on table public.task_auth_config is
  'ONE row: which writes count as Justin-tier. lucas_relay (seeded) = the Lucas seat writes Justin-tier rows pointing at his typed words; '
  'justin_signin = only his own sign-in (authenticated role, JWT sub = justin_user_id, aal2) may. service_role may only read it; '
  'switching is one UPDATE Justin pastes in the SQL editor (owner only), once task T-97''s migration gives his sign-in a write path.';
comment on column public.task_auth_config.justin_tier_source is 'lucas_relay or justin_signin. Stamped onto every authorization row as its source.';
comment on column public.task_auth_config.justin_user_id is 'Justin''s Supabase auth user id; required for justin_signin.';

create or replace function public.task_justin_tier_ok()
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_mode   text;
  v_user   uuid;
  v_claims jsonb;
begin
  select c.justin_tier_source, c.justin_user_id into v_mode, v_user from public.task_auth_config c where c.id = 1;
  if v_mode = 'lucas_relay' then
    return coalesce(public.task_request_actor() = any (array['lucas','justin']), false);
  elsif v_mode = 'justin_signin' then
    -- Only his own sign-in: the authenticated role, his user id, and a second factor. A service_role request
    -- (every agent's key) never qualifies, whatever claims it carries.
    if current_user::text <> 'authenticated' or v_user is null then
      return false;
    end if;
    begin
      v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
    exception when others then
      v_claims := null;
    end;
    return coalesce(v_claims->>'sub' = v_user::text and v_claims->>'aal' = 'aal2', false);
  end if;
  return false;
end;
$$;

comment on function public.task_justin_tier_ok() is
  'True when the current request may write a Justin-tier task_authorizations row: under lucas_relay, the actor is lucas or justin; '
  'under justin_signin, only the authenticated role with JWT sub = task_auth_config.justin_user_id and aal = aal2.';

-- ============================================================================
-- (c) public.task_authorizations, append-only
-- ============================================================================

create table if not exists public.task_authorizations (
  id           bigint generated always as identity primary key,
  task_id      uuid not null,
  kind         text not null check (kind in ('authorization','acceptance')),
  tier         text not null check (tier in ('lucas','justin','backfill')),
  source       text not null check (source in ('lucas_relay','justin_signin','migration_006')),
  actor        text not null,
  session_id   text,
  justin_ref   text,
  rule_ref     text,
  scope_hash   text not null,
  scope        jsonb not null,
  envelope     jsonb not null default '{}'::jsonb,
  proposal_ref text,
  note         text not null check (char_length(btrim(note)) between 1 and 600),
  at           timestamptz not null default now()
);

create index if not exists task_authorizations_task_id_id_idx on public.task_authorizations (task_id, id);

alter table public.task_authorizations enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'task_authorizations' and policyname = 'service_role_only') then
    create policy "service_role_only" on public.task_authorizations for all to service_role using (true) with check (true);
  end if;
end $$;
revoke all on table public.task_authorizations from public, anon, authenticated, service_role;
grant select, insert on table public.task_authorizations to service_role;
do $$ begin
  execute format('revoke all on sequence %s from public, anon, authenticated, service_role',
                 pg_get_serial_sequence('public.task_authorizations', 'id'));
end $$;

comment on table public.task_authorizations is
  'Append-only record of who said yes to a task, to exactly what scope, when, from which session, pointing at whose words (kind '
  'authorization), and who accepted it as done (kind acceptance). Written only by lucas or justin (ET012); never updated, deleted or '
  'truncated (ET013, every role). Its insert moves the task (task_authorizations_after_insert).';
comment on column public.task_authorizations.task_id is 'The task. Deliberately no foreign key, as task_history.task_id.';
comment on column public.task_authorizations.kind is 'authorization (makes the task open) or acceptance (makes it done).';
comment on column public.task_authorizations.tier is
  'lucas (authorization-rules.md §1; rule_ref required), justin (his own words; justin_ref required; task_justin_tier_ok()), or backfill '
  '(written only by migration 006''s data step for tasks active before 006; never starts work).';
comment on column public.task_authorizations.source is 'How the row came to be, stamped by the trigger from task_auth_config (or migration_006), never by the client.';
comment on column public.task_authorizations.actor is 'The request actor (task_request_actor), stamped by the trigger, whatever the client sent.';
comment on column public.task_authorizations.session_id is 'The request session (task_request_session), stamped by the trigger; required except on backfill rows.';
comment on column public.task_authorizations.justin_ref is 'Where Justin''s own words are (a Log line, a commit). Required non-blank for tier justin.';
comment on column public.task_authorizations.rule_ref is 'Which rule allowed a Lucas-tier yes (e.g. authorization-rules.md §1 item 1). Required non-blank for tier lucas.';
comment on column public.task_authorizations.scope_hash is 'The task''s scope_hash at the moment of the row, stamped by the trigger.';
comment on column public.task_authorizations.scope is 'The task''s {title, description, owner} at the moment of the row, stamped by the trigger, so a reader sees exactly what was authorized.';
comment on column public.task_authorizations.envelope is 'The discretionary limits the authorizer grants (e.g. {"max_api_usd": 5}).';
comment on column public.task_authorizations.proposal_ref is 'The proposal doc the yes was given against, as path or path@commit.';
comment on column public.task_authorizations.note is 'Why, at most 600 characters. On an acceptance, what was delivered and where (it becomes the closing note).';
comment on column public.task_authorizations.at is 'When the row was written (stamped by the trigger).';

-- ============================================================================
-- (d) BEFORE INSERT on task_authorizations
-- ============================================================================

create or replace function public.task_authorizations_before_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor     text := public.task_request_actor();
  v_session   text := public.task_request_session();
  -- C5: the data step's exemption needs BOTH the migration setting AND a non-client role.
  v_migration boolean := coalesce(current_setting('evryn.migration', true), '') = '006'
                         and current_user::text not in ('service_role','authenticator','anon','authenticated');
  v_status    text;
  v_hash      text;
  v_auth_id   bigint;
  v_title     text;
  v_desc      text;
  v_owner     text;
  v_auth_tier text;
  v_auth_hash text;
  v_mode      text;
begin
  if not (v_actor = any (array['lucas','justin'])) then
    raise exception using
      errcode = 'ET012',
      message = 'authorization refused: only lucas or justin may write an authorization or acceptance record.',
      hint    = 'Propose it instead: tasks update T-<n> --status proposed --to lucas --note "<why>".';
  end if;
  if coalesce(new.tier = 'backfill' or new.source = 'migration_006', false) and not v_migration then
    raise exception using
      errcode = 'ET012',
      message = 'authorization refused: tier backfill and source migration_006 are written only by migration 006''s data step.';
  end if;
  if new.tier = 'backfill' and new.kind is distinct from 'authorization' then
    raise exception using errcode = 'ET012', message = 'authorization refused: a backfill row can only be an authorization.';
  end if;

  select t.status, t.scope_hash, t.authorization_id, t.title, t.description, t.raci->>'r'
    into v_status, v_hash, v_auth_id, v_title, v_desc, v_owner
    from public.tasks t where t.id = new.task_id for update;
  if not found then
    raise exception using errcode = 'ET012', message = 'authorization refused: task_id names no existing task.';
  end if;

  if new.kind = 'authorization' then
    if v_status not in ('backlog','proposed','open','in_progress','blocked','needs_acceptance') then
      raise exception using
        errcode = 'ET012',
        message = format('authorization refused: the task is %s; a closed task is reopened to proposed (lucas or justin) before it is authorized.', v_status);
    end if;
  elsif new.kind = 'acceptance' then
    if v_status is distinct from 'needs_acceptance' then
      raise exception using
        errcode = 'ET012',
        message = format('acceptance refused: the task is %s, not needs_acceptance; the owner hands it in first.', v_status);
    end if;
    if v_auth_id is null then
      raise exception using errcode = 'ET012', message = 'acceptance refused: the task carries no authorization.';
    end if;
    select a.tier, a.scope_hash into v_auth_tier, v_auth_hash from public.task_authorizations a where a.id = v_auth_id;
    if v_auth_hash is distinct from v_hash then
      raise exception using errcode = 'ET012', message = 'acceptance refused: the task''s scope no longer matches its authorization.';
    end if;
    if v_auth_tier = 'justin' and new.tier is distinct from 'justin' then
      raise exception using
        errcode = 'ET012',
        message = 'acceptance refused: Justin authorized this task himself, so only a justin-tier acceptance closes it (authorization-rules.md §3).';
    end if;
  end if;

  select c.justin_tier_source into v_mode from public.task_auth_config c where c.id = 1;
  if new.tier = 'justin' then
    if not coalesce(public.task_justin_tier_ok(), false) then
      raise exception using
        errcode = 'ET012',
        message = format('authorization refused: under task_auth_config %s, this request may not write a Justin-tier record.', coalesce(v_mode, '(missing)'));
    end if;
    if coalesce(btrim(new.justin_ref), '') = '' then
      raise exception using errcode = 'ET012', message = 'authorization refused: a Justin-tier record needs justin_ref, where his own words are.';
    end if;
  elsif new.tier = 'lucas' then
    if coalesce(btrim(new.rule_ref), '') = '' then
      raise exception using errcode = 'ET012', message = 'authorization refused: a Lucas-tier record needs rule_ref, the rule that allows it.';
    end if;
  end if;

  if v_session is null and not (new.tier = 'backfill' and v_migration) then
    raise exception using
      errcode = 'ET012',
      message = 'authorization refused: the request carries no x-evryn-session header.',
      hint    = 'The tasks CLI sends CLAUDE_CODE_SESSION_ID; run it from a Claude Code session.';
  end if;

  -- Stamped from the request and the task, whatever the client sent.
  new.actor      := v_actor;
  new.session_id := v_session;
  new.source     := case when new.tier = 'backfill' then 'migration_006' else coalesce(v_mode, 'lucas_relay') end;
  new.scope_hash := v_hash;
  new.scope      := jsonb_build_object('title', v_title, 'description', v_desc, 'owner', v_owner);
  new.at         := now();
  return new;
end;
$$;

comment on function public.task_authorizations_before_insert() is
  'BEFORE INSERT on task_authorizations: ET012 for any actor but lucas or justin; refuses client-set backfill tier or migration_006 '
  'source, a missing task, a closed task (authorization), an acceptance of a task not needs_acceptance or with a stale or missing '
  'authorization, a lucas-tier acceptance of a Justin-tier authorization, a Justin-tier row task_justin_tier_ok() refuses or without '
  'justin_ref, a Lucas-tier row without rule_ref, and a row with no session (backfill excepted, data step only). Stamps actor, '
  'session_id, source, scope_hash, scope and at.';

-- ============================================================================
-- (e) AFTER INSERT on task_authorizations: move the task
-- ============================================================================

create or replace function public.task_authorizations_after_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- C4: bound to THIS row AND THIS task, and cleared before returning, so it can never move another task.
  perform pg_catalog.set_config('evryn.authorizing', new.id::text || ':' || new.task_id::text, true);
  if new.kind = 'authorization' then
    update public.tasks t
       set authorization_id      = new.id,
           needs_reauthorization = false,
           status                = case when t.status in ('backlog','proposed') then 'open' else t.status end,
           note                  = left(format('authorized (T-auth #%s, tier %s): %s', new.id, new.tier, new.note), 600)
     where t.id = new.task_id;
  else
    update public.tasks t
       set status       = 'done',
           closed_at    = now(),
           closing_note = new.note,
           note         = left(format('accepted (T-auth #%s, tier %s)', new.id, new.tier), 600)
     where t.id = new.task_id;
  end if;
  perform pg_catalog.set_config('evryn.authorizing', '', true);
  return null;
end;
$$;

comment on function public.task_authorizations_after_insert() is
  'AFTER INSERT on task_authorizations: sets evryn.authorizing to ''<row id>:<task id>'' (transaction-local), moves the task '
  '(authorization: authorization_id, needs_reauthorization false, open from backlog/proposed; acceptance: done with the row''s note '
  'as closing_note), then clears the setting to '''' (C4).';

create or replace function public.task_authorizations_refuse_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception using
    errcode = 'ET013',
    message = format('task_authorizations %s refused: the authorization record is append-only.', lower(tg_op)),
    hint    = 'A re-authorization adds a new row; no row is ever edited.';
end;
$$;

comment on function public.task_authorizations_refuse_change() is
  'Refuses UPDATE, DELETE and TRUNCATE on task_authorizations for every role, owner included (ENABLE ALWAYS). Honest limit: the owner '
  'can still disable or drop the trigger; owner access cannot be fenced from inside the table.';

drop trigger if exists task_authorizations_before_insert on public.task_authorizations;
create trigger task_authorizations_before_insert
  before insert on public.task_authorizations
  for each row
  execute function public.task_authorizations_before_insert();

drop trigger if exists task_authorizations_after_insert on public.task_authorizations;
create trigger task_authorizations_after_insert
  after insert on public.task_authorizations
  for each row
  execute function public.task_authorizations_after_insert();

drop trigger if exists task_authorizations_refuse_change on public.task_authorizations;
create trigger task_authorizations_refuse_change
  before update or delete or truncate on public.task_authorizations
  for each statement
  execute function public.task_authorizations_refuse_change();

alter table public.task_authorizations enable always trigger task_authorizations_before_insert;
alter table public.task_authorizations enable always trigger task_authorizations_after_insert;
alter table public.task_authorizations enable always trigger task_authorizations_refuse_change;

-- ============================================================================
-- (j) The roster gains launcher (brief 7 v2's note-writer; never an authorizer)
-- ============================================================================

create or replace function public.task_roster()
returns text[]
language sql
immutable
security invoker
set search_path = ''
as $$
  select array['lucas','soren','mira','emma','marlowe','thea','nathan','dominic',
               'justin','ac','dc','qc','oc','launcher']::text[]
$$;

comment on function public.task_roster() is
  'The ONE home of the task roster: the eight founding agents, justin, ac, dc, qc, oc, and launcher (migration 006: the task '
  'launcher''s note-writer, never an authorizer) (lowercase). A name outside it is written and FLAGGED in task_history, never refused. '
  'Nothing else may copy this list.';

-- ============================================================================
-- (h) R1 replaced: BEFORE INSERT OR UPDATE on tasks
-- ============================================================================

create or replace function public.tasks_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor     text := public.task_request_actor();
  -- Columns the database maintains itself, plus the per-write note: never count as a field change.
  v_skip      text[] := array['updated_at','owner','search','note','scope_hash'];
  v_signers   constant text[] := array['lucas','justin'];
  v_pre       constant text[] := array['backlog','proposed'];
  v_active    constant text[] := array['open','in_progress','blocked','needs_acceptance'];
  v_closed    constant text[] := array['done','decided_against'];
  v_setting   text := coalesce(current_setting('evryn.authorizing', true), '');
  -- C5: the data step's exemption needs BOTH the migration setting AND a non-client role.
  v_migration boolean := coalesce(current_setting('evryn.migration', true), '') = '006'
                         and current_user::text not in ('service_role','authenticator','anon','authenticated');
  v_from_id   bigint;   -- the task_authorizations row the setting names, when its TASK half names this task (C4)
  v_from_kind text;
  v_from_auth boolean;
  v_from_acc  boolean;
  v_auth_hash text;
  v_forced    boolean := false;
  v_fields    text[] := '{}';
  v_cur       uuid;
  v_next      uuid;
  v_depth     integer := 0;
  v_max       constant integer := 50;
  c_et011     constant text := 'task write refused: only an authorization record (tasks authorize, as lucas or justin) makes work authorized; only an acceptance record makes it done. Propose it: --status proposed --to lucas.';
begin
  -- A blank note is no note.
  if new.note is not null and btrim(new.note) = '' then
    new.note := null;
  end if;

  -- The scope hash is the database's: stamped on every write, whatever the client sent.
  new.scope_hash := public.task_scope_hash(new.title, new.description, new.raci->>'r');

  -- "Comes from the authorization trigger" means the setting names a row AND this very task (C4).
  if v_setting ~ '^[0-9]{1,18}:[0-9A-Fa-f-]{36}$'
     and split_part(v_setting, ':', 2) = new.id::text then
    v_from_id := split_part(v_setting, ':', 1)::bigint;
    select a.kind into v_from_kind from public.task_authorizations a where a.id = v_from_id;
  end if;
  -- Every comparison below is NULL-safe: a NULL inside "if not (...)" would silently skip a refusal.
  v_from_auth := coalesce(v_from_kind = 'authorization', false);
  v_from_acc  := coalesce(v_from_kind = 'acceptance', false);

  if tg_op = 'INSERT' then
    new.created_by := v_actor;                   -- whatever the client sent is overwritten
    if (new.signed_at is not null or new.signed_ref is not null) and not (v_actor = any (v_signers)) then
      raise exception using
        errcode = 'ET009',
        message = 'task write refused: only lucas or justin may set, change or clear a sign-off (signed_at, signed_ref).',
        hint    = 'A sign records Justin''s own yes, and goes through Lucas: tasks sign T-<n> --ref "<where his words are>" --as lucas.';
    end if;
    -- ET014: the authorization pointer and its flag are the database's.
    if new.authorization_id is not null or new.needs_reauthorization then
      raise exception using
        errcode = 'ET014',
        message = 'task write refused: authorization_id and needs_reauthorization are set only by an authorization record.';
    end if;
    -- ET011: nothing is created authorized, for every actor, lucas and justin included (Justin, 2026-11-16).
    -- (An unknown status falls through to tasks_status_allowed.)
    if new.status = any (v_active || v_closed) then
      raise exception using errcode = 'ET011', message = c_et011,
        hint = 'Create it as proposed (or backlog), then authorize it: tasks authorize T-<n> (lucas or justin).';
    end if;
  else
    if new.id is distinct from old.id then
      raise exception using errcode = 'ET003', message = 'task update refused: id is immutable.';
    end if;
    if new.created_by is distinct from old.created_by then
      raise exception using errcode = 'ET003', message = 'task update refused: created_by is immutable.';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception using errcode = 'ET003', message = 'task update refused: created_at is immutable.';
    end if;

    -- The note belongs to ONE write (005).
    if new.note is not distinct from old.note then
      new.note := null;
    end if;

    if (new.signed_at is distinct from old.signed_at or new.signed_ref is distinct from old.signed_ref)
       and not (v_actor = any (v_signers)) then
      raise exception using
        errcode = 'ET009',
        message = 'task write refused: only lucas or justin may set, change or clear a sign-off (signed_at, signed_ref).',
        hint    = 'A sign records Justin''s own yes, and goes through Lucas: tasks sign T-<n> --ref "<where his words are>" --as lucas.';
    end if;

    -- ET014: the pointer moves only from inside the authorization trigger, to the row it names, for this task.
    if new.authorization_id is distinct from old.authorization_id
       and not (v_from_auth and coalesce(new.authorization_id = v_from_id, false)) then
      raise exception using
        errcode = 'ET014',
        message = 'task write refused: authorization_id is set only by an authorization record (tasks authorize).';
    end if;
    if new.needs_reauthorization is distinct from old.needs_reauthorization
       and not (v_from_auth and new.needs_reauthorization = false) then
      raise exception using
        errcode = 'ET014',
        message = 'task write refused: needs_reauthorization is set only by the database.';
    end if;

    -- ET015: a closed task's scope is a record of what was accepted or declined; only lucas or justin edit it.
    if old.status = any (v_closed) and new.scope_hash is distinct from old.scope_hash and not (v_actor = any (v_signers)) then
      raise exception using
        errcode = 'ET015',
        message = 'task update refused: only lucas or justin may change the title, body or owner of a closed task.';
    end if;

    -- A scope edit on authorized work returns it to proposed, for EVERY actor, lucas and justin included.
    if old.status = any (v_active) and old.authorization_id is not null and new.scope_hash is distinct from old.scope_hash then
      if new.title is distinct from old.title then v_fields := v_fields || 'title'::text; end if;
      if new.description is distinct from old.description then v_fields := v_fields || 'description'::text; end if;
      if (new.raci->>'r') is distinct from (old.raci->>'r') then v_fields := v_fields || 'owner'::text; end if;
      new.status := 'proposed';
      new.authorization_id := null;
      new.needs_reauthorization := true;
      new.note := left('re-authorization needed: scope changed (' || array_to_string(v_fields, ', ') || ')'
                       || coalesce('; ' || new.note, ''), 600);
      v_forced := true;
    end if;

    -- ET011: status moves, checked on the status after the return above.
    if new.status is distinct from old.status and not v_forced then
      if old.status = any (v_pre) then
        if new.status = any (v_active) then
          if not (v_from_auth and coalesce(new.authorization_id = v_from_id, false)) then
            raise exception using errcode = 'ET011', message = c_et011;
          end if;
        elsif new.status = 'done' then
          raise exception using errcode = 'ET011', message = c_et011;
        end if;
        -- backlog <-> proposed and -> decided_against: any actor (an owner withdrawing its own idea).
      elsif old.status = any (v_active) then
        if new.status = any (v_active) then
          if new.authorization_id is null then
            raise exception using errcode = 'ET011', message = c_et011;
          end if;
          select a.scope_hash into v_auth_hash from public.task_authorizations a where a.id = new.authorization_id;
          if v_auth_hash is distinct from new.scope_hash then
            raise exception using errcode = 'ET011', message = c_et011;
          end if;
        elsif new.status = 'proposed' then
          new.authorization_id := null;           -- an owner withdrawing: the yes goes with it
        elsif new.status = 'backlog' then
          -- C5: the ONE exempt move, data step 1's pre-005 backlog rows, and only from a non-client role.
          if not (v_migration and old.status = 'blocked' and coalesce('backlog' = any (old.tags), false)) then
            raise exception using errcode = 'ET011', message = c_et011;
          end if;
          new.authorization_id := null;
        elsif new.status = 'done' then
          if not (v_from_acc and old.status = 'needs_acceptance') then
            raise exception using errcode = 'ET011', message = c_et011;
          end if;
        elsif new.status = 'decided_against' then
          if not (v_actor = any (v_signers)) then
            raise exception using errcode = 'ET011', message = c_et011,
              hint = 'Deciding against authorized work is the authorizer''s (lucas or justin). Withdraw it to proposed instead.';
          end if;
        end if;
      elsif old.status = any (v_closed) then
        if not (v_actor = any (v_signers) and new.status = 'proposed') then
          raise exception using errcode = 'ET011', message = c_et011,
            hint = 'Only lucas or justin reopen a closed task, and only to proposed.';
        end if;
        new.authorization_id := null;
      end if;
    end if;

    -- Rule N (005): a status change carries a reason (the forced return above carries its own).
    if new.note is null
       and ((new.status is distinct from old.status
             and not (new.status in ('done','decided_against') and new.closing_note is distinct from old.closing_note))
            or (old.status = 'backlog' and new.status = 'backlog' and new.needed_by is distinct from old.needed_by)) then
      raise exception using
        errcode = 'ET008',
        message = 'task update refused: a status change, or a new review date on a backlog item, needs a note saying why.',
        hint    = 'a status change, or a new review date on a backlog item, needs a note (--note) saying why; if you sent one, it matches the previous note word for word, so say what''s new.';
    end if;

    -- updated_at is the database's (005).
    if (to_jsonb(new) - v_skip) = (to_jsonb(old) - v_skip) and new.note is null then
      new.updated_at := old.updated_at;
    else
      new.updated_at := now();
    end if;
  end if;

  -- The backlog's 90-day cap (005).
  if new.status = 'backlog'
     and new.needed_by is not null
     and (tg_op = 'INSERT' or new.status is distinct from old.status or new.needed_by is distinct from old.needed_by)
     and new.needed_by > (now() at time zone 'America/Los_Angeles')::date + 90 then
    raise exception using
      errcode = 'ET010',
      message = 'task write refused: a backlog item''s review date can be at most 90 days out.',
      hint    = 'Pick a review date within 90 days. If it is not worth looking at by then, close it --decided-against with the reason.';
  end if;

  -- parent_id (001/003/005): exists, no cycle of any length, bounded walk.
  if new.parent_id is not null and (tg_op = 'INSERT' or new.parent_id is distinct from old.parent_id) then
    perform pg_catalog.pg_advisory_xact_lock(7427016301);
    v_cur := new.parent_id;
    loop
      if v_cur = new.id then
        raise exception using errcode = 'ET007',
          message = 'task write refused: this parent would create a cycle (a task cannot be its own ancestor).';
      end if;
      select t.parent_id into v_next from public.tasks t where t.id = v_cur for share;
      if not found then
        if v_depth = 0 then
          raise exception using errcode = 'ET007', message = 'task write refused: parent_id names no existing task.';
        end if;
        exit;
      end if;
      v_depth := v_depth + 1;
      if v_depth > v_max then
        raise exception using errcode = 'ET007',
          message = format('task write refused: the parent chain is deeper than %s ancestors.', v_max);
      end if;
      exit when v_next is null;
      v_cur := v_next;
    end loop;
  end if;

  return new;
end;
$$;

comment on function public.tasks_before_write() is
  'R1 (replaced by migration 006; keeps everything 005 does). BEFORE INSERT OR UPDATE on tasks: actor required; created_by set on insert; '
  'id/created_at/created_by immutable; stale note cleared; sign-off only by lucas/justin (ET009); Rule N (ET008); backlog 90-day cap (ET010); '
  'parent exists and no cycle (ET007). 006 adds: stamps scope_hash; inserts only backlog or proposed (ET011); authorization_id and '
  'needs_reauthorization move only from the authorization trigger bound to that row and this task (ET014); a scope edit on authorized work '
  'returns it to proposed with needs_reauthorization, for every actor; status moves into active work only by an authorization record and to '
  'done only by an acceptance record (ET011); closed tasks'' scope only by lucas/justin (ET015).';

-- ============================================================================
-- (i) R2 replaced: AFTER INSERT OR UPDATE on tasks, the history row
-- ============================================================================

create or replace function public.tasks_after_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor   text := public.task_request_actor();
  v_session text := public.task_request_session();
  v_roster  text[] := public.task_roster();
  -- The note is never a field change; scope_hash is the database's, like updated_at.
  v_skip    text[] := array['updated_at','owner','search','note','scope_hash'];
  v_oldj    jsonb;
  v_newj    jsonb;
  v_changed text[];
  v_old     jsonb;
  v_new     jsonb;
  v_flags   text[] := '{}';
begin
  if tg_op = 'INSERT' then
    v_newj := to_jsonb(new) - 'search' - 'note';
    select coalesce(array_agg(e.key order by e.key), '{}') into v_changed
      from jsonb_each(v_newj) e
      where e.value <> 'null'::jsonb;
    v_old := null;
    v_new := v_newj;
  else
    v_oldj := to_jsonb(old) - v_skip;
    v_newj := to_jsonb(new) - v_skip;
    select coalesce(array_agg(e.key order by e.key), '{}') into v_changed
      from jsonb_each(v_newj) e
      where e.value is distinct from (v_oldj -> e.key);
    if cardinality(v_changed) = 0 and new.note is null then
      return null;
    end if;
    select coalesce(jsonb_object_agg(k, v_oldj -> k), '{}'::jsonb), coalesce(jsonb_object_agg(k, v_newj -> k), '{}'::jsonb)
      into v_old, v_new
      from unnest(v_changed) as k;
  end if;

  if not (v_actor = any (v_roster)) then
    v_flags := v_flags || 'actor_off_roster'::text;
  end if;
  if new.owner is not null and not (new.owner = any (v_roster))
     and (tg_op = 'INSERT' or new.owner is distinct from old.owner) then
    v_flags := v_flags || 'owner_off_roster'::text;
  end if;
  if new.addressed_to is not null and not (new.addressed_to = any (v_roster))
     and (tg_op = 'INSERT' or new.addressed_to is distinct from old.addressed_to) then
    v_flags := v_flags || 'addressed_to_off_roster'::text;
  end if;
  if tg_op = 'UPDATE' and new.needs_reauthorization and not old.needs_reauthorization then
    v_flags := v_flags || 'reauthorization_needed'::text;
  end if;

  insert into public.task_history (task_id, actor, op, changed_fields, old, new, flags, note, session_id)
  values (new.id, v_actor, lower(tg_op), v_changed, v_old, v_new, v_flags, new.note, v_session);

  return null;
end;
$$;

comment on function public.tasks_after_write() is
  'R2 (replaced by migration 006). AFTER INSERT OR UPDATE on tasks: one task_history row with the actor, the request session '
  '(session_id), the changed fields (excluding updated_at, owner, search, note and scope_hash) with old and new values, roster flags, '
  'the flag reauthorization_needed when a scope edit voided an authorization, and the write''s note.';

-- ============================================================================
-- Comments that the above made untrue
-- ============================================================================

comment on constraint tasks_status_allowed on public.tasks is
  'The eight statuses (migration 005; meaning refined by 006): backlog = an idea with a review date, never in the daily pull; '
  'proposed = awaiting a yes (Justin''s, or Lucas''s under authorization-rules.md); open = authorized, with an authorization record '
  '(task_authorizations; tasks.authorization_id); in_progress; blocked (the note says on what); needs_acceptance = submitted, must be '
  'addressed (tasks_acceptance_addressed); done (only by an acceptance record) and decided_against = closed, each with a closing_note. '
  'The column default ''todo'' is not allowed, so an insert must name a status.';

-- ============================================================================
-- Function privileges (R4). Trigger functions: no client role. Helpers the triggers call as the invoker: service_role only.
-- ============================================================================

revoke all on function public.tasks_before_write()                from public, anon, authenticated, service_role;
revoke all on function public.tasks_after_write()                 from public, anon, authenticated, service_role;
revoke all on function public.task_authorizations_before_insert() from public, anon, authenticated, service_role;
revoke all on function public.task_authorizations_after_insert()  from public, anon, authenticated, service_role;
revoke all on function public.task_authorizations_refuse_change() from public, anon, authenticated, service_role;

revoke all on function public.task_scope_hash(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.task_request_session()           from public, anon, authenticated, service_role;
revoke all on function public.task_justin_tier_ok()            from public, anon, authenticated, service_role;
grant execute on function public.task_scope_hash(text, text, text) to service_role;
grant execute on function public.task_request_session()           to service_role;
grant execute on function public.task_justin_tier_ok()            to service_role;

-- ============================================================================
-- §2.2 THE DATA STEPS. Run as actor justin (Justin pastes) with evryn.migration = '006', both
-- transaction-local, and both cleared at the end. The exemption that setting grants is named exactly
-- in the triggers above (C5): the blocked-with-backlog-tag -> backlog move; ET012's refusal of the
-- backfill tier and migration_006 source; the NULL-session refusal for backfill rows. Nothing else, and
-- only for a non-client current_user.
-- ============================================================================

do $$ begin
  perform pg_catalog.set_config('evryn.actor', 'justin', true);
  perform pg_catalog.set_config('evryn.migration', '006', true);
end $$;

-- Step 1: the pre-005 backlog rows (filed as blocked + tag backlog under the task protocol's interim box).
update public.tasks t
   set status    = 'backlog',
       needed_by = least(coalesce(t.needed_by, (now() at time zone 'America/Los_Angeles')::date + 14),
                         (now() at time zone 'America/Los_Angeles')::date + 90),
       note      = 'migration 006: pre-005 backlog item moved to backlog.'
 where t.status = 'blocked' and 'backlog' = any (t.tags);

-- Step 2: every row's scope_hash, stamped by the trigger (no scope field changes; no history row is written).
update public.tasks set scope_hash = null;

-- Step 3: the backfill. Every task active now gets one backfill authorization row; it never starts work.
do $$
declare
  r       record;
  v_hid   bigint;
  v_actor text;
  v_note  text;
begin
  for r in
    select t.id, t.created_by from public.tasks t
     where t.status in ('open','in_progress','blocked','needs_acceptance') and t.authorization_id is null
     order by t.short_id
  loop
    v_hid := null;
    v_actor := null;
    select h.id, h.actor into v_hid, v_actor
      from public.task_history h
     where h.task_id = r.id
       and h.new ->> 'status' in ('open','in_progress','blocked','needs_acceptance')
       and (h.op = 'insert' or 'status' = any (h.changed_fields))
     order by h.id desc
     limit 1;
    v_note := case
      when v_hid is not null then format('migration 006 backfill: no authorization record existed; last moved into an active status by task_history #%s (%s).', v_hid, v_actor)
      when r.created_by is null then 'migration 006 backfill: no authorization record existed; active since before the task system.'
      else 'migration 006 backfill: no authorization record existed; no history row records its move into an active status.'
    end;
    insert into public.task_authorizations (task_id, kind, tier, source, rule_ref, note)
    values (r.id, 'authorization', 'backfill', 'migration_006', 'migration 006 backfill: no authorization record existed', v_note);
  end loop;
end $$;

do $$ begin
  perform pg_catalog.set_config('evryn.migration', '', true);
  perform pg_catalog.set_config('evryn.actor', '', true);
end $$;

-- Truncation canary — DO NOT REMOVE: FULL FILE LOADED
