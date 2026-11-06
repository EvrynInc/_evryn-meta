# The team task list (`scripts/tasks/`)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.
>
> **How to use this file:** what this folder is, its commands, its variables, its gates, and the procedure for applying it live. The manual for *using* the task list is `node tasks.mjs --help`, and only that. Design and decisions: `evryn-team-workspace/shared/projects/helm/2026/2026.11.04-team-task-database/` (the brief, its Log and the DC build spec) and Soren's review, `evryn-team-workspace/shared/projects/product/2026.11.05-soren-task-database-review.md` (R1–R8).

**A task is one owed item, with one owner, that outlives the session it was born in.** Each is a row in `public.tasks` of the "Evryn Team" Supabase project (ref `azugibmylktinddyqkhd`), extended here, with every change recorded by the database in `public.task_history`. **Every rule is enforced in the database, not in these scripts,** because the scripts are only one of several clients.

**There is no database password.** Justin applies the migration himself, by pasting two generated files into the Supabase SQL editor, so the owner credential never reaches an agent (Soren, brief's Log 2026-11-05 16:00–16:08). Agents reach the live database only through PostgREST with the secret key.

## Files

| File | Job |
|---|---|
| `tasks.mjs` | The CLI agents run (`pull`, `mine`, `closed`, `show`, `search`, `add`, `update`, `close`, `sign`, `export`). No npm dependencies. Logic in `lib/cli.mjs`. |
| `check.mjs` | Is the environment ready? Presence of each variable, the project ref, the key kind, a `tasks` row count. `--absent`: the advisory post-dry-run check (see the procedure). **Prints no value.** |
| `make-paste.mjs` | Generates `paste/paste-1-dry-run.sql` and `paste/paste-2-apply.sql` from `migrations/` and `paste-src/`. `--check` fails if the committed pastes are stale. |
| `paste/` | The two generated files Justin pastes. **Never edit them; regenerate.** |
| `paste-src/` | The before- and after-assertions the pastes wrap around the migration (plpgsql). |
| `migrate.mjs` | Applies `migrations/*.sql` in one transaction through `psql` — **to a local loopback test cluster only.** |
| `schema-snapshot.mjs` | **Read-only.** One fact per line about `tasks`, `task_history`, `proposals`, the task functions, their grants and the default privileges. Local: through `psql`. `--api`: live, through `public.team_tasks_schema_snapshot()` (after Paste 2). Both run the SAME query, kept once in migration 004. |
| `snapshot-compare.mjs` | Compares a local and a live snapshot and classifies every difference as **STOP** or **LISTED** (Soren's S1 rule, encoded and tested). Exit 1 on any stop, or if the "live" side is not live. |
| `import-linear.mjs` | One-time import of Linear's open (non-Backlog) tickets. **Dry run by default** (`--dry-run` is accepted); `--apply` writes as actor `ac`, idempotently on `linear_id`. Only reads Linear. |
| `migrations/` | **Its own sequence**, never numbered into `evryn-team-runtime/migrations/`. Prerequisite: runtime `003_tasks_proposals.sql`. |
| `test/unit/` | `node --test` against a fake PostgREST. |
| `test/acceptance/` | Every R1–R8 rule, both paste files, in both default-privilege modes, against a throwaway local PostgreSQL cluster. |
| `test/fixtures/` | Golden local schema snapshots (our objects), before and after migrating — what the live snapshot is compared with. |

## Variables (never printed, on any path)

| Name | Where | Used by |
|---|---|---|
| `EVRYN_TEAM_SUPABASE_URL` | `evryn-team-workspace/.env` | `tasks`, `check`, `schema-snapshot --api`, `import --apply` |
| `EVRYN_TEAM_SUPABASE_SECRET_KEY` | `evryn-team-workspace/.env` | same. A new-style secret key (prefix `sb_` then `secret_`) goes on the `apikey` header only; a legacy service_role JWT also goes as `Authorization: Bearer`. |
| `LINEAR_API_KEY` | `_evryn-meta/.env` | `import-linear` |
| `EVRYN_ACTOR` | the shell | `tasks`, in place of `--as` |
| `EVRYN_TASKS_LOCAL_PG` | tests only | `migrate`, `schema-snapshot`: a **loopback-only** local cluster |
| `EVRYN_TASKS_PG_BIN` | optional | an absolute directory holding the PostgreSQL tools; they are never looked up on `PATH` |
| `EVRYN_TASKS_DEFAULTS` | tests only | `on` / `off` (default): run the acceptance suite with Supabase's old default privileges kept or removed |

## Applying it live — the procedure

1. **Tasks AC, before handing a paste to Justin** (QC N5 — nothing inside a paste verifies itself):
   - name the **reviewed commit** (the one QC reviewed and that is merged), and check that the worktree is at it;
   - run `node make-paste.mjs --check` **on that commit** — it must print `OK: both paste files are current` — plus the full suites green in both modes, and `node check.mjs`;
   - **state in the handoff the exact `-- migrations sha256: …` header line** of the paste being handed over. Justin (or anyone) can then confirm that the file in the editor is the reviewed one: its second line (Paste 2: third) must match, character for character.
2. **Justin pastes `paste/paste-1-dry-run.sql`** (the whole file) into the Evryn Team project's SQL editor and runs it. **Expected: an ERROR reading `DRY RUN OK — nothing was changed (N rows; M NOT VALID)`.** That error is the success: every step and check ran, then everything rolled back. Any other error means a check failed and nothing changed; report it as it reads.
3. **If M is above 0, STOP for the day.** Tasks AC reports which rows fail and the plan to fix and validate them (a NOT VALID constraint is a rule old data does not meet yet). Paste 2 also refuses by itself when M > 0.
4. *(Advisory only)* `node check.mjs --absent` confirms through PostgREST that the new columns and `task_history` are not visible. **This is not the proof that nothing changed:** PostgREST caches the schema, and a stale cache reports a column as unknown even when it exists. **The binding guard is structural:** Paste 2's own before-assertions require runtime 003's exact shape and no `task_history`, so if a dry run had somehow committed, Paste 2 refuses and changes nothing.
5. **Justin pastes `paste/paste-2-apply.sql`.** Expected: success, no rows. It ends with `NOTIFY pgrst, 'reload schema'`, so the new columns and the snapshot function are visible over the API at once.
6. **Tasks AC:** `node schema-snapshot.mjs --api > live-after.txt`, then `node snapshot-compare.mjs test/fixtures/local-snapshot-after.txt live-after.txt`. **Any STOP is a stop.**
7. Then the live checks (refused requests, the one real write as `ac`, the startup-pull token count, a fresh agent from `--help`).

### Each paste is one statement — what is verified, and what is assumed

- **Shape.** Each paste is a single `DO $paste$ … $paste$;` block: before-assertions, then every migration statement verbatim inside `EXECUTE $sNNN$ … $sNNN$`, then after-assertions, then the final statement (Paste 1: the dry-run RAISE; Paste 2: refuse if M > 0). Paste 2 adds `NOTIFY` after the block. **A DO block is one statement, so Postgres — not the editor — decides atomicity:** any RAISE inside it rolls back everything before it.
- **Verified locally (PostgreSQL 17):** the dry run leaves the snapshot byte-identical; the apply produces exactly the objects `migrate.mjs` produces; a broken after-assertion and a broken before-assertion each roll everything back, byte-identical, both when `psql` stops at the first error and when it continues past errors; a second Paste 2 is refused; old failing rows are counted in the dry-run message and make Paste 2 refuse. `psql -f` sends statements **one at a time**, which is the harder case for atomicity, and it holds.
- **Assumed, not verified:** how the Supabase SQL editor transmits the text (one batch or statement by statement), and that it shows the RAISE message. Neither changes the outcome: the paste is one statement either way. **Worst case if an assumption is wrong:** the error text is not shown. The binding guard still holds, because Paste 2's before-assertions refuse on any state but runtime 003's.
- **The two pastes differ in exactly three places:** the header (Paste 2's first line is the STOP rule), the final in-block statement, and Paste 2's trailing NOTIFY. A unit test pins that.

## The gates

- **R5, the bulkhead:** every script refuses any URL that is not the Evryn Team project, before any request exists. Postgres-protocol tools connect only to a loopback test cluster.
- **Tests can never read a real `.env`:** inside a test run (`node --test`, or `EVRYN_TASKS_TEST_MODE=1`) any attempt to read one throws `TEST TRIPWIRE`, and a test proves every script trips it.
  - 🔴 **A mutation that DISABLES the tripwire must only ever run in a copy OUTSIDE the shared code folder** (e.g. a scratchpad worktree). The scripts find `.env` files from their own location (`<shared parent>/evryn-team-workspace/.env`), so inside the code folder a tripwire-off test run reads the REAL credentials and its spawned scripts reach the live database. Outside it, those paths resolve to files that do not exist. Check where `CODE_ROOT` resolves before running it. *(QC Finding 11, 2026-11-05.)*
- **Mutation proofs in general run in a detached worktree outside the code folder**, never in this checkout.
- **The snapshot compare** (Soren, S1, 2026-11-05 15:29, plus QC fix trip 2):
  - **STOP:** any difference in columns, defaults, constraints, triggers, policies, whether RLS is enabled, or owner; any grant difference to `service_role`, `anon`, `authenticated` or `PUBLIC`, on any covered table or task function's EXECUTE; index and function-definition differences; any line it cannot classify.
  - **LISTED, not a stop:** grants to any other (Supabase-only) role; `MAINTAIN` only when the two servers straddle PostgreSQL 17; `default-acl` lines. Both servers' versions print first.
  - **REFUSED:** a live side with no `# target=` line, taken from loopback, or from the same target as the local side.
- **`export`:** a command, no `#lock` step; its output is committed **once, as a snapshot at the Meta-Meeting cutover** (Justin's ruling, relayed in the brief's Log 15:22).

## Running the tests

```bash
node --test "scripts/tasks/test/unit/*.test.mjs"
node --test "scripts/tasks/test/acceptance/*.test.mjs"                          # Supabase defaults OFF (default)
EVRYN_TASKS_DEFAULTS=on node --test "scripts/tasks/test/acceptance/*.test.mjs"   # Supabase defaults ON
EVRYN_TASKS_UPDATE_SNAPSHOTS=1 node --test "scripts/tasks/test/acceptance/*.test.mjs"   # rewrite the golden snapshots; review the diff
node scripts/tasks/make-paste.mjs            # after ANY change to migrations/ or paste-src/
```

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
