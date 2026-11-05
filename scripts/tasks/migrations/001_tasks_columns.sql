-- 001_tasks_columns.sql — extend the runtime's existing public.tasks for the team's task list:
-- new columns, CHECK constraints and indexes. ADD ONLY.
--
-- 🔴 PREREQUISITE: evryn-team-runtime/migrations/003_tasks_proposals.sql (it creates public.tasks).
-- This folder is its OWN sequence, separate from evryn-team-runtime/migrations/ — never number into
-- that folder (its 015–018 are unapplied and must apply in order). The block below raises if
-- public.tasks is absent.
--
-- THE FENCE (Justin's typed go, 2026-11-05 14:52, in the brief's Log): add columns, CHECK constraints
-- (NOT VALID first if any existing row would fail them), triggers and indexes to public.tasks, and
-- create task_history. NOT allowed: dropping or renaming a column, deleting a row, changing an
-- existing value, touching public.proposals or any other existing table, or runtime code. So:
--   - uniqueness is enforced with UNIQUE INDEXES (indexes are in the go; a UNIQUE constraint is not
--     named in it);
--   - parent_id carries NO foreign key (an FK is a constraint type the go does not name; Soren
--     agreed, S2 2026-11-05 15:29); the trigger in 003 checks the parent exists and refuses a cycle
--     of any length, which is sound because tasks can never be deleted (also 003);
--   - existing column comments are left exactly as they are, even where they are now stale.
--
-- Idempotent: re-applying converges (IF NOT EXISTS everywhere; constraints added only if absent).
-- Applied by migrate.mjs inside ONE transaction together with 002 and 003.
-- Truncation check: the last line of this file should read `FULL FILE LOADED` — if you don't see it, your load was truncated; re-read until you do.

do $$
begin
  if to_regclass('public.tasks') is null then
    raise exception 'TASKS-MIGRATION: public.tasks does not exist. Runtime migration evryn-team-runtime/migrations/003_tasks_proposals.sql is the prerequisite of this sequence; apply it first.';
  end if;
end $$;

-- ============================================================================
-- New columns
-- ============================================================================

-- GENERATED ALWAYS, not BY DEFAULT: under BY DEFAULT a client could choose a number ahead of the
-- sequence, and a later normal insert would collide on it — a quiet outage of `add` (Soren, 14:49).
alter table public.tasks add column if not exists short_id bigint generated always as identity;
alter table public.tasks add column if not exists owner text generated always as (raci->>'r') stored;
alter table public.tasks add column if not exists created_by text;
alter table public.tasks add column if not exists closed_at timestamptz;
alter table public.tasks add column if not exists closing_note text;
alter table public.tasks add column if not exists needed_by date;
alter table public.tasks add column if not exists parent_id uuid;
alter table public.tasks add column if not exists tags text[];
alter table public.tasks add column if not exists addressed_to text;
alter table public.tasks add column if not exists signed_at timestamptz;
alter table public.tasks add column if not exists signed_ref text;
alter table public.tasks add column if not exists linear_id text;
alter table public.tasks add column if not exists linear_status text;
alter table public.tasks add column if not exists search tsvector
  generated always as (to_tsvector('english'::regconfig, coalesce(title, '') || ' ' || coalesce(description, ''))) stored;

comment on column public.tasks.short_id is
  'Human id, shown as T-<n>. Identity GENERATED ALWAYS: never renumbers, and no client can pick one (BY DEFAULT would let a chosen number collide with a later insert). Also the keyset cursor every list read pages on.';
comment on column public.tasks.owner is
  'The one owner, generated from raci->>''r'' so it can be indexed and filtered. Read-only. tasks_one_owner requires it non-blank; an owner outside the roster (public.task_roster()) is written and flagged in task_history.';
comment on column public.tasks.created_by is
  'The actor who created the row, set by the tasks_before_write trigger from the request (never by the client), immutable afterwards. NULL on rows that predate the task system.';
comment on column public.tasks.closed_at is
  'When the task was closed. Required (with closing_note) whenever status is done or decided_against (tasks_closed_needs_note).';
comment on column public.tasks.closing_note is
  'Required at close: what happened or why not, and where the record lives. A blank note does not count.';
comment on column public.tasks.needed_by is
  'Needed-by date. Required whenever addressed_to is justin (tasks_justin_needs_date), so Thea can place it on his calendar. Nothing auto-closes for age.';
comment on column public.tasks.parent_id is
  'Parent task. Deliberately no foreign key (outside the 2026-11-05 go; agreed by Soren, S2 2026-11-05 15:29); the tasks_before_write trigger refuses a parent that does not exist, or that would create a cycle of any length (bounded walk, at most 50 ancestors). Sound because tasks are never deleted.';
comment on column public.tasks.tags is 'Domain or topic tags. Screened by the CLI for personal data like every free-text field.';
comment on column public.tasks.addressed_to is
  'One actor name: whom a watcher should wake. Shape-checked like the actor; a name outside the roster is written and flagged in task_history.';
comment on column public.tasks.signed_at is
  'When Justin signed this item (his daily signing). A RECORD, NEVER A GATE: any holder of the key can set it, so nothing outbound or irreversible may depend on it (R7). Requires signed_ref.';
comment on column public.tasks.signed_ref is 'Where Justin''s words are (a doc path, a log entry). Required whenever signed_at is set.';
comment on column public.tasks.linear_id is 'The Linear identifier (e.g. EVR-123) for rows imported once from Linear. Unique; the import is idempotent on it.';
comment on column public.tasks.linear_status is
  'Linear''s status for an imported row, copied word for word. Informational only: Linear''s "Authorized" column is not an authorization.';
comment on column public.tasks.search is
  'Full-text search vector over title and description (english config), stored and GIN-indexed. Generated; read-only.';

-- ============================================================================
-- Indexes (uniqueness lives here, as unique indexes)
-- ============================================================================

create unique index if not exists tasks_short_id_key on public.tasks (short_id);
create unique index if not exists tasks_linear_id_key on public.tasks (linear_id);
create index if not exists tasks_owner_status_idx on public.tasks (owner, status);
create index if not exists tasks_addressed_to_status_idx on public.tasks (addressed_to, status);
create index if not exists tasks_closed_at_idx on public.tasks (closed_at);
create index if not exists tasks_parent_id_idx on public.tasks (parent_id);
create index if not exists tasks_search_idx on public.tasks using gin (search);

-- ============================================================================
-- CHECK constraints (R3, plus Soren's 14:44 and 14:49 entries)
-- ============================================================================
-- Each is added NOT VALID (so the migration can never fail halfway on old data), then VALIDATED
-- only if no existing row fails it. If rows fail, it stays NOT VALID — still enforced on every new
-- insert and every update — and a NOTICE names the failing row ids. Fixing those rows would mean
-- changing existing values, which the go does not allow; that is a decision for a person.
--
-- Note: status's DEFAULT stays 'todo' (changing a default is not in the go), and 'todo' is not an
-- allowed status, so an insert that omits status is refused. That makes status effectively
-- required, which is intended.

do $$
declare
  c record;
  bad_ids text;
begin
  for c in
    select * from (values
      ('tasks_status_allowed',
       $x$status in ('open','in_progress','blocked','done','decided_against','proposed')$x$),
      ('tasks_title_max_80',
       $x$char_length(title) <= 80$x$),
      ('tasks_closed_needs_note',
       $x$status not in ('done','decided_against') or (coalesce(btrim(closing_note), '') <> '' and closed_at is not null)$x$),
      ('tasks_signed_needs_ref',
       $x$signed_at is null or coalesce(btrim(signed_ref), '') <> ''$x$),
      ('tasks_justin_needs_date',
       $x$lower(addressed_to) is distinct from 'justin' or needed_by is not null$x$),
      ('tasks_one_owner',
       $x$coalesce(btrim(raci->>'r'), '') <> ''$x$),
      ('tasks_addressed_to_shape',
       $x$addressed_to is null or addressed_to ~ '^[A-Za-z0-9_.-]{1,64}$'$x$)
    ) as v(name, expr)
  loop
    if not exists (select 1 from pg_constraint
                   where conrelid = 'public.tasks'::regclass and conname = c.name) then
      execute format('alter table public.tasks add constraint %I check (%s) not valid', c.name, c.expr);
    end if;

    execute format(
      'select string_agg(id::text, '', '' order by id) from public.tasks where not coalesce((%s), true)',
      c.expr) into bad_ids;

    if bad_ids is null then
      if not (select convalidated from pg_constraint
              where conrelid = 'public.tasks'::regclass and conname = c.name) then
        execute format('alter table public.tasks validate constraint %I', c.name);
      end if;
    else
      raise notice 'TASKS-MIGRATION: constraint % left NOT VALID (still enforced on new writes); existing rows failing it: %',
        c.name, bad_ids;
    end if;
  end loop;
end $$;

comment on constraint tasks_status_allowed on public.tasks is
  'The six statuses. proposed = awaiting Justin''s authorization (what the frozen runtime''s propose_work writes). The column default ''todo'' is not allowed, so an insert must name a status.';
comment on constraint tasks_title_max_80 on public.tasks is 'The headline: at most 80 characters, meaningful by itself. Imported Linear titles over 80 fail the import; never truncated.';
comment on constraint tasks_closed_needs_note on public.tasks is 'done and decided_against both require a non-blank closing_note and a closed_at. Decided-against is first-class.';
comment on constraint tasks_signed_needs_ref on public.tasks is 'A signed time with no pointer to Justin''s words is refused outright (Soren, 14:44, correcting R7).';
comment on constraint tasks_justin_needs_date on public.tasks is 'Every row addressed to Justin carries a needed_by (Soren, Q8). Case-insensitive, so ''Justin'' cannot slip past.';
comment on constraint tasks_one_owner on public.tasks is 'One owner, enforced: raci->>''r'' must be non-blank (Soren, Q4 and 14:49).';
comment on constraint tasks_addressed_to_shape on public.tasks is 'addressed_to has the actor-name shape (isSafeActorName: ^[A-Za-z0-9_.-]{1,64}$).';

-- Truncation canary — DO NOT REMOVE: FULL FILE LOADED
