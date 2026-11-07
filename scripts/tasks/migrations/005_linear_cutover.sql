-- 005_linear_cutover.sql — the Linear cutover's schema change (Soren's design, 2026-11-06:
-- evryn-team-workspace/shared/projects/helm/2026/2026.11.06-linear-cutover/2026.11.06-soren-cutover-design.md
-- §1.2–§1.4 and §2.2).
--
--   §1.2  tasks_status_allowed REPLACED under the same name: eight statuses (adds backlog, needs_acceptance).
--   §1.3  a NOTE that belongs to ONE WRITE: tasks.note and task_history.note (each at most 600 characters).
--         The database clears a note that is not fresh, records it in the history row, writes a history row
--         for a note-only write (a comment), and refuses a status change that carries no reason (ET008).
--   §1.4  tasks_acceptance_addressed: a needs_acceptance task must be addressed to someone.
--   §2.2  only actor lucas or justin may set, change or clear a sign-off (signed_at, signed_ref) (ET009).
--   Soren-005's backlog rulings (2026.11.06-soren005-backlog-amendment-rulings.md, Ruling 1): a backlog item
--         must carry a review date (tasks_backlog_needs_review_date), never more than 90 days out (ET010), and
--         re-dating one needs a note (ET008).
--
-- 🔴 PREREQUISITE: migrations 001–004 of this folder (live on the Evryn Team project since 2026-11-06).
--
-- WHAT IT TOUCHES, AND WHAT IT MUST NOT (the go in the design's §4):
--   - it REPLACES TWO trigger FUNCTIONS (tasks_before_write, tasks_after_write) with CREATE OR REPLACE. It
--     drops and recreates NO trigger: recreating one would reset it from ENABLE ALWAYS to plain ENABLE,
--     which 003 deliberately undid (QC Finding 3). Both functions stay SECURITY INVOKER with search_path ''.
--   - it drops exactly ONE constraint, tasks_status_allowed, and only to re-add it wider under the same name:
--     CHECK constraints combine with AND, so a second, wider CHECK could never widen anything.
--   - it adds two nullable columns and four CHECK constraints. It changes no existing value, and does not
--     touch public.proposals.
--
-- Every object is schema-qualified: the paste runs this with search_path = '' (paste-src/005/before.plpgsql).
-- Idempotent: re-applying converges (IF NOT EXISTS; constraints replaced only when their definition differs).
-- Applied locally by migrate.mjs in one transaction with 001–004; live, by Justin's change-set-005 paste.
-- Truncation check: the last line of this file should read `FULL FILE LOADED` — if you don't see it, your load was truncated; re-read until you do.

do $$
begin
  if to_regclass('public.task_history') is null or to_regprocedure('public.tasks_before_write()') is null then
    raise exception 'TASKS-MIGRATION 005: migrations 001–004 of scripts/tasks/migrations/ are the prerequisite (public.task_history and public.tasks_before_write() must exist); apply them first.';
  end if;
end $$;

-- ============================================================================
-- §1.3 — the note columns
-- ============================================================================

alter table public.tasks add column if not exists note text;
alter table public.task_history add column if not exists note text;

comment on column public.tasks.note is
  'The note of the MOST RECENT write, or NULL. A note belongs to one write: the tasks_before_write trigger clears it on any update '
  'that brings no fresh note (a blank note counts as none), and the history row of that write carries it (task_history.note). '
  'A status change needs one (ET008), unless it closes the task with a fresh closing_note. At most 600 characters: a reason or a pointer, never substance.';
comment on column public.task_history.note is
  'The note carried by the write that produced this row (tasks.note at that moment), or NULL. A row with empty changed_fields and a note is a comment.';

-- ============================================================================
-- §1.2, §1.3, §1.4 — CHECK constraints
-- ============================================================================
-- The 001 pattern: each is added NOT VALID, then VALIDATED only if no existing row fails it; otherwise it
-- stays NOT VALID (still enforced on every new write) and a NOTICE names the failing rows. On the live
-- database every one validates: the new status list is a superset of the old validated one, no row carries a
-- note yet, and no row can be needs_acceptance or backlog before this migration widens the status rule.
--
-- tasks_status_allowed is REPLACED when its definition differs from the target (ignoring a NOT VALID
-- suffix): drop, then add under the same name. Inside one transaction the ALTER TABLE holds an exclusive
-- lock on tasks until commit, so no other session ever sees the table without the rule. The paste pins the
-- old six-value definition in its before-assertions, so the drop only ever runs from the known state.

do $$
declare
  c        record;
  v_def    text;
  bad_ids  text;
begin
  for c in
    select * from (values
      ('public.tasks', 'tasks_status_allowed',
       $x$status in ('backlog','proposed','open','in_progress','blocked','needs_acceptance','done','decided_against')$x$,
       $x$CHECK ((status = ANY (ARRAY['backlog'::text, 'proposed'::text, 'open'::text, 'in_progress'::text, 'blocked'::text, 'needs_acceptance'::text, 'done'::text, 'decided_against'::text])))$x$),
      ('public.tasks', 'tasks_note_max_600',
       $x$char_length(note) <= 600$x$,
       $x$CHECK ((char_length(note) <= 600))$x$),
      ('public.tasks', 'tasks_acceptance_addressed',
       $x$status <> 'needs_acceptance' or addressed_to is not null$x$,
       $x$CHECK (((status <> 'needs_acceptance'::text) OR (addressed_to IS NOT NULL)))$x$),
      ('public.tasks', 'tasks_backlog_needs_review_date',
       $x$status <> 'backlog' or needed_by is not null$x$,
       $x$CHECK (((status <> 'backlog'::text) OR (needed_by IS NOT NULL)))$x$),
      ('public.task_history', 'task_history_note_max_600',
       $x$char_length(note) <= 600$x$,
       $x$CHECK ((char_length(note) <= 600))$x$)
    ) as v(tbl, name, expr, target)
  loop
    select pg_get_constraintdef(oid) into v_def
      from pg_constraint where conrelid = c.tbl::regclass and conname = c.name;

    if v_def is not null and regexp_replace(v_def, ' NOT VALID$', '') <> c.target then
      execute format('alter table %s drop constraint %I', c.tbl, c.name);
      v_def := null;
    end if;
    if v_def is null then
      execute format('alter table %s add constraint %I check (%s) not valid', c.tbl, c.name, c.expr);
    end if;

    execute format('select string_agg(id::text, '', '' order by id) from %s where not coalesce((%s), true)', c.tbl, c.expr)
      into bad_ids;

    if bad_ids is null then
      if not (select convalidated from pg_constraint where conrelid = c.tbl::regclass and conname = c.name) then
        execute format('alter table %s validate constraint %I', c.tbl, c.name);
      end if;
    else
      raise notice 'TASKS-MIGRATION: constraint % left NOT VALID (still enforced on new writes); existing rows failing it: %',
        c.name, bad_ids;
    end if;
  end loop;
end $$;

-- Dropping a constraint drops its comment, so the status rule's comment is re-issued here.
comment on constraint tasks_status_allowed on public.tasks is
  'The eight statuses (2026-11-06, migration 005): backlog = an idea with a review date, never in the daily pull; '
  'proposed = awaiting a yes (Justin''s, or Lucas''s under authorization-rules.md); open = authorized; in_progress; '
  'blocked (the note says on what); needs_acceptance = submitted, must be addressed (tasks_acceptance_addressed); '
  'done and decided_against = closed, each with a closing_note. The column default ''todo'' is not allowed, so an insert must name a status.';
comment on constraint tasks_note_max_600 on public.tasks is 'A note is a reason or a pointer, never substance: at most 600 characters, like the body.';
comment on constraint task_history_note_max_600 on public.task_history is 'Matches tasks_note_max_600: the history row holds the note of one write.';
comment on constraint tasks_acceptance_addressed on public.tasks is
  'A needs_acceptance task must be addressed to someone (Soren, 2026-11-06 §1.4): a task shows only in its owner''s pull and its addressee''s, '
  'so submitted work with no addressee would never reach the one who accepts it. Justin-bound acceptance is addressed to lucas.';
comment on constraint tasks_backlog_needs_review_date on public.tasks is
  'A backlog item (an idea, not committed work) must carry a review date in needed_by: the day its owner decides to propose it, '
  're-date it with a note, or close it decided_against. The 90-day cap lives in tasks_before_write, because a CHECK must not depend on the current date.';

-- ============================================================================
-- §1.3, §2.2 — R1 replaced: BEFORE INSERT OR UPDATE on tasks
-- ============================================================================

create or replace function public.tasks_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor   text := public.task_request_actor();
  -- Columns the database maintains itself, plus the per-write note: never count as a field change.
  v_skip    text[] := array['updated_at','owner','search','note'];
  -- Who may set, change or clear a sign-off (§2.2). With one shared key a FALSE "lucas" cannot be
  -- refused; every other name is, and every sign is recorded with its actor.
  v_signers constant text[] := array['lucas','justin'];
  v_cur     uuid;
  v_next    uuid;
  v_depth   integer := 0;
  v_max     constant integer := 50;
begin
  -- A blank note is no note.
  if new.note is not null and btrim(new.note) = '' then
    new.note := null;
  end if;

  if tg_op = 'INSERT' then
    new.created_by := v_actor;                   -- whatever the client sent is overwritten
    if (new.signed_at is not null or new.signed_ref is not null) and not (v_actor = any (v_signers)) then
      raise exception using
        errcode = 'ET009',
        message = 'task write refused: only lucas or justin may set, change or clear a sign-off (signed_at, signed_ref).',
        hint    = 'A sign records Justin''s own yes, and goes through Lucas: tasks sign T-<n> --ref "<where his words are>" --as lucas.';
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

    -- The note belongs to ONE write: a write that brings no fresh note carries none, so tasks.note always
    -- holds the note of the most recent write, or nothing. (An unchanged value is what a client that never
    -- mentioned the note sends back, so "the same as before" means "no note".)
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

    -- Rule N: a status change carries a reason. The one exception is a close whose closing_note changed in
    -- the same write: the close's note IS its reason, so it is not entered twice. Re-dating a backlog item
    -- (backlog to backlog, needed_by changed) needs one too: a silent snooze is how a backlog rots
    -- (Soren-005, Ruling 1).
    if new.note is null
       and ((new.status is distinct from old.status
             and not (new.status in ('done','decided_against') and new.closing_note is distinct from old.closing_note))
            or (old.status = 'backlog' and new.status = 'backlog' and new.needed_by is distinct from old.needed_by)) then
      raise exception using
        errcode = 'ET008',
        message = 'task update refused: a status change, or a new review date on a backlog item, needs a note saying why.',
        hint    = 'a status change, or a new review date on a backlog item, needs a note (--note) saying why; if you sent one, it matches the previous note word for word, so say what''s new.';
    end if;

    -- updated_at is the database's: bumped on a real field change or when the write carries a note (a
    -- comment is activity), left alone on a no-op, and never taken from the client.
    if (to_jsonb(new) - v_skip) = (to_jsonb(old) - v_skip) and new.note is null then
      new.updated_at := old.updated_at;
    else
      new.updated_at := now();
    end if;
  end if;

  -- The backlog's 90-day cap (Soren-005, Ruling 1). In the trigger, not a CHECK: a CHECK is assumed
  -- immutable and is re-run on every write, so a date-dependent one would lock rows against unrelated
  -- updates (even the move to decided_against) the day the cap is lowered. It fires only at the moment of
  -- dating: an insert, a status change, or a needed_by change. The date is Pacific, matching the CLI's
  -- "today". A null needed_by is skipped here, so tasks_backlog_needs_review_date refuses it as an
  -- ordinary check violation (BEFORE ROW triggers run before CHECK constraints).
  if new.status = 'backlog'
     and new.needed_by is not null
     and (tg_op = 'INSERT' or new.status is distinct from old.status or new.needed_by is distinct from old.needed_by)
     and new.needed_by > (now() at time zone 'America/Los_Angeles')::date + 90 then
    raise exception using
      errcode = 'ET010',
      message = 'task write refused: a backlog item''s review date can be at most 90 days out.',
      hint    = 'Pick a review date within 90 days. If it is not worth looking at by then, close it --decided-against with the reason.';
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
  'R1 (replaced by migration 005). BEFORE INSERT OR UPDATE on tasks: requires a request actor (task_request_actor), sets created_by on insert, '
  'refuses changes to id/created_at/created_by; clears a note that is not fresh (blank, or equal to the previous one); refuses a sign-off '
  'set, changed or cleared by any actor but lucas or justin (ET009); refuses a status change with no note unless it closes with a fresh '
  'closing_note, and a backlog re-date with no note (ET008); stamps updated_at only on a real change or a note; refuses a backlog review '
  'date more than 90 Pacific days out, at the moment of dating (ET010); checks parent_id exists and refuses a parent cycle of any '
  'length (bounded walk: more than 50 ancestors is refused).';

-- ============================================================================
-- §1.3 — R2 replaced: AFTER INSERT OR UPDATE on tasks, the history row
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
  -- The note is never a field change: it rides in task_history.note.
  v_skip    text[] := array['updated_at','owner','search','note'];
  v_oldj    jsonb;
  v_newj    jsonb;
  v_changed text[];
  v_old     jsonb;
  v_new     jsonb;
  v_flags   text[] := '{}';
begin
  if tg_op = 'INSERT' then
    -- The insert's note goes to task_history.note, not into the snapshot, so it is not held twice.
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
      return null;                               -- an update that changes nothing and says nothing writes no row
    end if;
    -- A note-only write (a comment) records empty changed_fields and empty old/new objects.
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

  insert into public.task_history (task_id, actor, op, changed_fields, old, new, flags, note)
  values (new.id, v_actor, lower(tg_op), v_changed, v_old, v_new, v_flags, new.note);

  return null;
end;
$$;

comment on function public.tasks_after_write() is
  'R2 (replaced by migration 005). AFTER INSERT OR UPDATE on tasks: writes one task_history row recording the actor, the changed fields '
  '(excluding updated_at, owner, search and note) with old and new values, roster flags, and the write''s note in task_history.note. '
  'An update writes a row when a field changed OR it carries a note (a comment); one that does neither writes no row.';

-- ============================================================================
-- Comments that the above made untrue
-- ============================================================================

comment on column public.task_history.changed_fields is
  'For an update, the fields whose value actually changed, excluding the ones the database maintains itself (updated_at, owner, search) and the note. '
  'For an insert, every non-null field except the note. Empty on a comment (a note-only update). An update that changes nothing and carries no note writes no row.';
comment on column public.tasks.signed_at is
  'When Justin signed this item (his daily signing). A RECORD, NEVER A GATE: nothing outbound or irreversible may depend on it (R7). '
  'Only actor lucas or justin may set, change or clear it (tasks_before_write, ET009), but with one shared key a false "lucas" cannot be refused. Requires signed_ref.';

-- ============================================================================
-- Function privileges, re-stated (R4). CREATE OR REPLACE keeps a function's privileges; these make 005
-- self-sufficient, and the paste's after-assertions PROVE the result rather than assume it. Trigger
-- functions: EXECUTE revoked from every client role (a trigger fires without its caller holding EXECUTE).
-- ============================================================================

revoke all on function public.tasks_before_write() from public, anon, authenticated, service_role;
revoke all on function public.tasks_after_write()  from public, anon, authenticated, service_role;

-- Truncation canary — DO NOT REMOVE: FULL FILE LOADED
