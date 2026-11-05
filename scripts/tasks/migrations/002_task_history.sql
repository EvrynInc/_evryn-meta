-- 002_task_history.sql — the append-only change history of public.tasks (R2, plus Soren's Q7).
--
-- WRITTEN ONLY BY THE DATABASE. The tasks_after_write trigger (003) inserts every row; a BEFORE
-- INSERT guard (003) refuses any insert that was not fired from inside that trigger; any UPDATE,
-- DELETE or TRUNCATE raises (003). Behind the triggers, the grants are a second wall: service_role
-- holds SELECT and INSERT only, and anon / authenticated hold nothing.
--
-- GRANTS ARE EXPLICIT because tables created after Supabase's 2026-10-30 change get no default
-- grants, and the house migrations (which this file otherwise copies) carry none.
--
-- Idempotent. Applied by migrate.mjs in one transaction with 001 and 003.
-- Truncation check: the last line of this file should read `FULL FILE LOADED` — if you don't see it, your load was truncated; re-read until you do.

create table if not exists public.task_history (
  id             bigint generated always as identity primary key,
  task_id        uuid not null,
  at             timestamptz not null default now(),
  actor          text not null,
  op             text not null check (op in ('insert','update')),
  changed_fields text[] not null default '{}',
  old            jsonb,
  new            jsonb,
  flags          text[] not null default '{}'
);

create index if not exists task_history_task_id_id_idx on public.task_history (task_id, id);

alter table public.task_history enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'task_history'
                   and policyname = 'service_role_only') then
    create policy "service_role_only" on public.task_history
      for all to service_role using (true) with check (true);
  end if;
end $$;

revoke all on table public.task_history from public, anon, authenticated, service_role;
grant select, insert on table public.task_history to service_role;

comment on table public.task_history is
  'Append-only history of every change to public.tasks: who, when, which fields, old and new values. '
  'Written ONLY by the tasks_after_write trigger; a direct insert, and any update, delete or truncate, is refused '
  '(triggers), and service_role holds only SELECT and INSERT (grants). The future watcher reads it from a checkpoint '
  'on the monotonic id.';
comment on column public.task_history.id is 'Monotonic key (identity GENERATED ALWAYS). The watcher''s checkpoint cursor.';
comment on column public.task_history.task_id is 'The task changed. Deliberately NO foreign key: history must never block on, or cascade from, the tasks table.';
comment on column public.task_history.at is 'When the change committed its transaction (now() = transaction start time).';
comment on column public.task_history.actor is 'Who made the change, taken from the request (x-evryn-actor header, or the evryn.actor session setting for psql). Never from a column a client can set.';
comment on column public.task_history.op is 'insert or update. Deletes never happen: tasks_refuse_delete refuses them.';
comment on column public.task_history.changed_fields is
  'For an update, the fields whose value actually changed, excluding the ones the database maintains itself (updated_at, owner, search). For an insert, every non-null field. An update that changes nothing writes no row.';
comment on column public.task_history.old is 'Update: the changed fields'' previous values only. Insert: null.';
comment on column public.task_history.new is 'Update: the changed fields'' new values only. Insert: the whole new row (minus the search vector).';
comment on column public.task_history.flags is
  'Anomalies recorded rather than refused: actor_off_roster, owner_off_roster, addressed_to_off_roster (roster = public.task_roster()).';

-- Truncation canary — DO NOT REMOVE: FULL FILE LOADED
