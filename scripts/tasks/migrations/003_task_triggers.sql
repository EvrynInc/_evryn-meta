-- 003_task_triggers.sql — the rules that make the task list trustworthy, enforced by the database
-- itself, because the CLI is only one of several clients (a raw request with the key, a future
-- watcher, the frozen runtime's propose_work, an agent's hand-rolled call).
--
--   R1  tasks_before_write   — every insert/update needs an actor FROM THE REQUEST; sets created_by,
--                              refuses changes to id / created_at / created_by, stamps updated_at.
--   R2  tasks_after_write    — writes exactly one task_history row per real change; none for a no-op.
--       task_history_guard_insert / task_history_refuse_change — nobody writes or rewrites history.
--       tasks_refuse_delete  — tasks are never deleted (or truncated); they close with a note.
--
-- THE ACTOR. Taken from the request header x-evryn-actor (PostgREST exposes request headers to SQL
-- as JSON in current_setting('request.headers', true), names lowercased); failing that, from the
-- session setting evryn.actor (for psql work). Raises if both are absent or the name fails
-- isSafeActorName's shape. NO fallback to raci->>'r' or any other column: any client can set those,
-- and a column fallback silently credits the wrong writer (Soren R1). Consequence, accepted: the
-- frozen runtime's propose_work sends no header and fails loudly.
-- HONEST LIMIT: with one shared key, a MISSING name can be refused; a FALSE name cannot.
--
-- SECURITY: every function is SECURITY INVOKER with a pinned search_path. Nothing is SECURITY
-- DEFINER. Trigger functions: EXECUTE revoked from every client role. The two helpers: EXECUTE to
-- service_role only. Every trigger is ENABLE ALWAYS, so replica mode cannot skip it.
--
-- Idempotent (CREATE OR REPLACE; DROP-then-CREATE for triggers). Applied with 001 and 002 in one transaction.
-- Truncation check: the last line of this file should read `FULL FILE LOADED` — if you don't see it, your load was truncated; re-read until you do.

-- ============================================================================
-- The roster — ONE home. Nothing else may copy this list.
-- ============================================================================

create or replace function public.task_roster()
returns text[]
language sql
immutable
security invoker
set search_path = ''
as $$
  select array['lucas','soren','mira','emma','marlowe','thea','nathan','dominic',
               'justin','ac','dc','qc','oc']::text[]
$$;

comment on function public.task_roster() is
  'The ONE home of the task roster: the eight founding agents, justin, ac, dc, qc, oc (lowercase). '
  'A name outside it is written and FLAGGED in task_history, never refused. Nothing else may copy this list.';

-- ============================================================================
-- The actor of the current request
-- ============================================================================

create or replace function public.task_request_actor()
returns text
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_raw     text;
  v_headers jsonb;
  v_actor   text;
begin
  -- An empty or missing request.headers must not throw a JSON error: treat it as "no header".
  v_raw := nullif(btrim(coalesce(current_setting('request.headers', true), '')), '');
  if v_raw is not null then
    begin
      v_headers := v_raw::jsonb;
    exception when others then
      v_headers := null;
    end;
    if v_headers is not null and jsonb_typeof(v_headers) = 'object' then
      v_actor := nullif(v_headers->>'x-evryn-actor', '');
    end if;
  end if;

  -- Only when no header actor was sent: the session setting, for psql work.
  if v_actor is null then
    v_actor := nullif(current_setting('evryn.actor', true), '');
  end if;

  if v_actor is null then
    raise exception using
      errcode = 'ET001',
      message = 'task write refused: no actor. Every write must say who is making it.',
      hint    = 'Send the x-evryn-actor header (the tasks CLI does this with --as <name>), or for psql, inside a transaction: begin; set local evryn.actor = ''<name>''; ...; commit; (SET LOCAL, so a pooled connection cannot carry your name into someone else''s session).';
  end if;

  if v_actor !~ '^[A-Za-z0-9_.-]{1,64}$' then
    raise exception using
      errcode = 'ET002',
      message = 'task write refused: the actor name is not a valid name (letters, digits, _ . - only, 1 to 64 characters).',
      hint    = 'Use your lowercase agent name, e.g. --as lucas.';
  end if;

  return v_actor;
end;
$$;

comment on function public.task_request_actor() is
  'Returns the actor of the current request: header x-evryn-actor (PostgREST request.headers), else the evryn.actor '
  'session setting. Raises ET001 if absent, ET002 if malformed. Never reads a column.';

-- ============================================================================
-- R1 — BEFORE INSERT OR UPDATE on tasks
-- ============================================================================

create or replace function public.tasks_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor text := public.task_request_actor();
  -- Columns the database maintains itself: never count as a client change.
  v_skip  text[] := array['updated_at','owner','search'];
  v_cur   uuid;
  v_next  uuid;
  v_depth integer := 0;
  v_max   constant integer := 50;
begin
  if tg_op = 'INSERT' then
    new.created_by := v_actor;                   -- whatever the client sent is overwritten
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
    -- updated_at is the database's: bumped on a real change, left alone on a no-op (so a no-op
    -- leaves no unrecorded trace), and never taken from the client.
    if (to_jsonb(new) - v_skip) = (to_jsonb(old) - v_skip) then
      new.updated_at := old.updated_at;
    else
      new.updated_at := now();
    end if;
  end if;

  -- parent_id (no foreign key — outside the 2026-11-05 go; Soren S2, 15:29): the parent must exist,
  -- and the new link must not close a CYCLE OF ANY LENGTH. Walk up the ancestors from the new parent;
  -- meeting this task means a cycle. The walk is BOUNDED: a chain deeper than v_max ancestors is
  -- refused rather than walked forever. Sound because tasks are never deleted (tasks_refuse_delete),
  -- so an ancestor cannot vanish under the walk.
  if new.parent_id is not null and (tg_op = 'INSERT' or new.parent_id is distinct from old.parent_id) then
    -- Serialize parent changes: two concurrent updates (A→B, B→A) could each pass a walk that cannot
    -- see the other's uncommitted link. The lock is held to commit, and is taken ONLY when parent_id
    -- actually changes (Soren, 15:38), so ordinary updates never serialize on it.
    perform pg_catalog.pg_advisory_xact_lock(7427016301);
    -- Each ancestor is read FOR SHARE. Under READ COMMITTED that reads the latest committed link.
    -- Under REPEATABLE READ or SERIALIZABLE, a stale snapshot would hide a link committed after it
    -- was taken; FOR SHARE on a row changed since raises a serialization error instead of walking
    -- the stale value (QC Finding 10). Loud, never a silently committed cycle.
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
        exit;                                    -- unreachable in practice: tasks are never deleted
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
  'R1. BEFORE INSERT OR UPDATE on tasks: requires a request actor (task_request_actor), sets created_by on insert, '
  'refuses changes to id/created_at/created_by, stamps updated_at only on a real change, checks parent_id exists '
  'and refuses a parent cycle of any length (bounded walk: more than 50 ancestors is refused).';

drop trigger if exists tasks_before_write on public.tasks;
create trigger tasks_before_write
  before insert or update on public.tasks
  for each row
  execute function public.tasks_before_write();

-- ============================================================================
-- R2 — AFTER INSERT OR UPDATE on tasks: the history row
-- ============================================================================

create or replace function public.tasks_after_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor   text := public.task_request_actor();
  v_roster  text[] := public.task_roster();
  v_skip    text[] := array['updated_at','owner','search'];
  v_oldj    jsonb;
  v_newj    jsonb;
  v_changed text[];
  v_old     jsonb;
  v_new     jsonb;
  v_flags   text[] := '{}';
begin
  if tg_op = 'INSERT' then
    v_newj := to_jsonb(new) - 'search';
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
    if cardinality(v_changed) = 0 then
      return null;                               -- an update that changes nothing writes no row
    end if;
    select jsonb_object_agg(k, v_oldj -> k), jsonb_object_agg(k, v_newj -> k)
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

  insert into public.task_history (task_id, actor, op, changed_fields, old, new, flags)
  values (new.id, v_actor, lower(tg_op), v_changed, v_old, v_new, v_flags);

  return null;
end;
$$;

comment on function public.tasks_after_write() is
  'R2. AFTER INSERT OR UPDATE on tasks: writes one task_history row recording the actor, the changed fields '
  '(excluding updated_at, owner, search) with old and new values, and roster flags. An update that changes nothing writes no row.';

drop trigger if exists tasks_after_write on public.tasks;
create trigger tasks_after_write
  after insert or update on public.tasks
  for each row
  execute function public.tasks_after_write();

-- ============================================================================
-- Tasks are never deleted
-- ============================================================================

create or replace function public.tasks_refuse_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception using
    errcode = 'ET004',
    message = format('task %s refused: tasks are never deleted.', lower(tg_op)),
    hint    = 'Close it instead, as done or decided_against, with a closing note: tasks close T-<n> --note "..." [--decided-against].';
end;
$$;

comment on function public.tasks_refuse_delete() is 'Refuses DELETE and TRUNCATE on tasks. Tasks end by closing, with a note.';

drop trigger if exists tasks_refuse_delete on public.tasks;
create trigger tasks_refuse_delete
  before delete or truncate on public.tasks
  for each statement
  execute function public.tasks_refuse_delete();

-- ============================================================================
-- History: no direct writes, no rewrites
-- ============================================================================

create or replace function public.task_history_guard_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Fired from inside tasks_after_write, this trigger runs at depth 2. A direct insert by any
  -- client runs it at depth 1.
  if pg_trigger_depth() < 2 then
    raise exception using
      errcode = 'ET005',
      message = 'task_history insert refused: history is written only by the database, from the tasks trigger.';
  end if;
  return new;
end;
$$;

comment on function public.task_history_guard_insert() is
  'Refuses any insert into task_history not fired from inside the tasks trigger (pg_trigger_depth() < 2).';

drop trigger if exists task_history_guard_insert on public.task_history;
create trigger task_history_guard_insert
  before insert on public.task_history
  for each row
  execute function public.task_history_guard_insert();

create or replace function public.task_history_refuse_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception using
    errcode = 'ET006',
    message = format('task_history %s refused: history is append-only.', lower(tg_op));
end;
$$;

comment on function public.task_history_refuse_change() is
  'Refuses UPDATE, DELETE and TRUNCATE on task_history, for every role, including the owner and including '
  'session_replication_role = replica (the trigger is ENABLE ALWAYS). Honest limit: the table owner can still '
  'ALTER TABLE ... DISABLE TRIGGER or drop it — owner access cannot be fenced from inside the table.';

drop trigger if exists task_history_refuse_change on public.task_history;
create trigger task_history_refuse_change
  before update or delete or truncate on public.task_history
  for each statement
  execute function public.task_history_refuse_change();

-- ============================================================================
-- ENABLE ALWAYS (QC Finding 3): the triggers fire even under session_replication_role = replica,
-- the switch a data restore uses to skip triggers. Without this, a pooler session holding the
-- password could write tasks with no actor and no history, rewrite history, or delete tasks.
-- These alter only the triggers this migration creates (inside the go: "triggers").
-- ============================================================================

alter table public.tasks        enable always trigger tasks_before_write;
alter table public.tasks        enable always trigger tasks_after_write;
alter table public.tasks        enable always trigger tasks_refuse_delete;
alter table public.task_history enable always trigger task_history_guard_insert;
alter table public.task_history enable always trigger task_history_refuse_change;

-- ============================================================================
-- Function privileges (R4, QC Finding 1). EXPLICIT for every new function, so the result is the same
-- whether or not the project still has Supabase's old default privileges (which would otherwise grant
-- EXECUTE on new functions to anon, authenticated and service_role). No ALTER DEFAULT PRIVILEGES and
-- nothing on any existing object: only the functions created above.
--   - Trigger functions: EXECUTE revoked from EVERY client role, service_role included. A trigger
--     fires without its caller holding EXECUTE (proven by the acceptance suite), so nobody needs it.
--   - Helper functions the triggers call as the invoker: EXECUTE to service_role, the only client
--     role that writes. Nothing else.
-- ============================================================================

revoke all on function public.tasks_before_write()         from public, anon, authenticated, service_role;
revoke all on function public.tasks_after_write()          from public, anon, authenticated, service_role;
revoke all on function public.tasks_refuse_delete()        from public, anon, authenticated, service_role;
revoke all on function public.task_history_guard_insert()  from public, anon, authenticated, service_role;
revoke all on function public.task_history_refuse_change() from public, anon, authenticated, service_role;

revoke all on function public.task_roster()        from public, anon, authenticated, service_role;
revoke all on function public.task_request_actor() from public, anon, authenticated, service_role;
grant execute on function public.task_roster()        to service_role;
grant execute on function public.task_request_actor() to service_role;

-- Truncation canary — DO NOT REMOVE: FULL FILE LOADED
