# The team task list (`scripts/tasks/`)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.
>
> **How to use this file:** what this folder is, its commands, its variables and its gates. The manual for *using* the task list is `node tasks.mjs --help`, and only that. Design and decisions: `evryn-team-workspace/shared/projects/helm/2026/2026.11.04-team-task-database/` (the brief, its Log and the DC build spec) and Soren's review, `evryn-team-workspace/shared/projects/product/2026.11.05-soren-task-database-review.md` (R1–R8).

**A task is one owed item, with one owner, that outlives the session it was born in.** Each is a row in `public.tasks` of the "Evryn Team" Supabase project (ref `azugibmylktinddyqkhd`), extended here, with every change recorded by the database in `public.task_history`. **Every rule is enforced in the database, not in these scripts,** because the scripts are only one of several clients.

## Files

| File | Job |
|---|---|
| `tasks.mjs` | The CLI agents run (`pull`, `mine`, `closed`, `show`, `search`, `add`, `update`, `close`, `sign`, `export`). No npm dependencies. Logic in `lib/cli.mjs`. |
| `check.mjs` | Is the environment ready? Presence of each variable, the project ref, the key kind, a `tasks` row count, `select 1` through the pooler. **Prints no value.** |
| `migrate.mjs` | Applies `migrations/*.sql` in one transaction through `psql`. `--rehearse` applies and rolls back; `--apply-live` is required to commit live. |
| `schema-snapshot.mjs` | **Read-only.** A deterministic text description of `tasks` and `task_history`, one fact per line: server version, owner, RLS, columns, constraints, indexes, triggers, policies, table/sequence grants, and every task function with its EXECUTE grants. |
| `snapshot-compare.mjs` | Compares a local and a live snapshot and classifies every difference as a **STOP** or **LISTED** (Soren's S1 rule, encoded and tested). Exit 1 on any stop. Reads two files; touches nothing else. |
| `import-linear.mjs` | One-time import of Linear's open tickets. **Dry run by default**; `--apply` writes as actor `ac`, idempotently on `linear_id`. Only reads Linear. |
| `migrations/` | **Its own sequence**, never numbered into `evryn-team-runtime/migrations/`. Prerequisite: runtime `003_tasks_proposals.sql`. |
| `test/unit/` | `node --test` against a fake PostgREST. |
| `test/acceptance/` | Every R1–R8 rule proven against a throwaway local PostgreSQL cluster. |
| `test/fixtures/` | Golden local schema snapshots, before and after migrating — what the live snapshots are diffed against. |

## Variables (never printed, on any path)

| Name | Where | Used by |
|---|---|---|
| `EVRYN_TEAM_SUPABASE_URL` | `evryn-team-workspace/.env` | `tasks`, `check`, `import --apply` |
| `EVRYN_TEAM_SUPABASE_SECRET_KEY` | `evryn-team-workspace/.env` | same. A new-style secret key (prefix `sb_` then `secret_`) goes on the `apikey` header only; a legacy service_role JWT also goes as `Authorization: Bearer`. |
| `EVRYN_TEAM_DB_PASSWORD` | `evryn-team-workspace/.env` | `check`, `migrate`, `schema-snapshot` (session pooler `aws-1-us-west-2.pooler.supabase.com:5432`, user `postgres.azugibmylktinddyqkhd`; the direct host is IPv6-only) |
| `LINEAR_API_KEY` | `_evryn-meta/.env` | `import-linear` |
| `EVRYN_ACTOR` | the shell | `tasks`, in place of `--as` |
| `EVRYN_TASKS_LOCAL_PG` | tests only | `migrate`, `schema-snapshot`: a **loopback-only** local cluster |
| `EVRYN_TASKS_PG_BIN` | optional | an absolute directory holding `psql`; tools are never looked up on `PATH` |

## The gates

- **R5, the bulkhead:** every script refuses any URL that is not the Evryn Team project, before any request exists. The only other target accepted is a loopback test cluster.
- **Tests can never read a real `.env`:** inside a test run (`node --test`, or `EVRYN_TASKS_TEST_MODE=1`) any attempt to read one throws `TEST TRIPWIRE`, and a test proves every script trips it.
  - 🔴 **A mutation that DISABLES the tripwire must only ever run in a copy OUTSIDE the shared code folder** (e.g. a scratchpad worktree). The scripts find `.env` files from their own location (`<shared parent>/evryn-team-workspace/.env`), so inside the code folder a tripwire-off test run reads the REAL credentials and its spawned scripts reach the live database. Outside it, those paths resolve to files that do not exist. Check where `CODE_ROOT` resolves before running it. *(QC Finding 11, 2026-11-05.)*
- **Mutation proofs in general run in a detached worktree outside the code folder**, never in this checkout.
- **Live work belongs to Tasks AC, under Justin's go of 2026-11-05 14:52** (the brief's Log): `check.mjs`, `migrate.mjs --rehearse`, the before snapshot, `migrate.mjs --apply-live`, the after snapshot, the live checks. **Compare each live snapshot with the local golden one in `test/fixtures/` using `snapshot-compare.mjs`.**
  - **STOP** (Soren, S1, 2026-11-05 15:29): any difference in columns, defaults, constraints, triggers, policies, whether RLS is enabled, or owner; any grant difference to `service_role`, `anon`, `authenticated` or `PUBLIC`, on either table or on any task function's EXECUTE. The compare also stops on index and function-definition differences, and on any line it cannot classify.
  - **LISTED, not a stop:** grants to any other (Supabase-only) role, and version-only privilege names (`MAINTAIN`). Both servers' versions print first.
- **`export` output is not committed** and is not part of `#lock` until Justin rules.

## Running the tests

```bash
node --test "scripts/tasks/test/unit/*.test.mjs"
node --test "scripts/tasks/test/acceptance/*.test.mjs"   # needs PostgreSQL 17 binaries; creates and deletes a temp cluster
EVRYN_TASKS_UPDATE_SNAPSHOTS=1 node --test "scripts/tasks/test/acceptance/*.test.mjs"   # rewrite the golden snapshots; review the diff
```

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
