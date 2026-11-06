# ADR-061: Schema changes to the Evryn Team database are applied only by Justin's paste

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**Status:** Accepted 2026-11-06 (Justin, A: his "a" to Admiral Lucas's Report #1, Ballot 4). He decided the substance on 2026-11-05, when he chose to paste the migration himself rather than reset the database password. Drafted by Soren (CTO) on 2026-11-06; filed by Admiral Lucas. The record behind it: `evryn-team-workspace/shared/projects/helm/2026/2026.11.04-team-task-database/` (Soren's brief, entries 15:21 and 16:05 on 11/05, and the build brief's Log).

## Context

The team task database (the Evryn Team Supabase project, ref `azugibmylktinddyqkhd`) went live on 2026-11-06, merged as `_evryn-meta` `7a60d07`. Its schema changes live in their own folder, `_evryn-meta/scripts/tasks/migrations/`, separate from `evryn-team-runtime/migrations/`, and they alter the runtime's `public.tasks` table.

Migrations would normally run through a direct database connection with the database password. No copy of that password could be found on 2026-11-05. Resetting it was the simple route. Justin instead chose to paste the reviewed migration into the Supabase SQL editor himself. **That turned out to be the better design, not just a workaround,** because the database password is the owner's credential: it can change any table's structure, bypass row-level security, and defeat the history table's guard (which trusts trigger depth, a thing a role with SQL access can fake).

## Decision

1. **Schema changes to the team database MUST be applied only by Justin pasting a reviewed migration into the Supabase SQL editor.** No agent holds the database password; it MUST NOT be placed in any `.env` file or any other location an agent can read.
   - **Enforced by:** the task scripts reach the live database only through PostgREST with the secret key, which can read and write rows but cannot run DDL; and `_evryn-meta/scripts/tasks/lib/config.mjs` refuses any Postgres-protocol target that isn't a loopback test cluster, with unit tests that fail if it accepts one.
2. **Each paste MUST be generated, not hand-written,** by `_evryn-meta/scripts/tasks/make-paste.mjs` from the migrations folder, and its sha256 MUST match the commit that passed review before anyone puts it in front of Justin.
3. **Each paste MUST be one database statement** (a single `DO` block), so it is all-or-nothing however the editor splits the text. **It MUST carry its own checks:** before-assertions that the live schema is exactly what the migration expects, and after-assertions that it produced exactly the intended result, inside the same transaction, so a failed check undoes everything.
4. **A dry run MUST come first:** the same block ending in a deliberate error that reports `DRY RUN OK — nothing was changed`, then the real paste.

## Consequences

- **Positive:** no agent can change the team database's structure without Justin's hands, which makes schema changes a structural gate rather than a rule (it applies `_evryn-meta/docs/hub/technical-vision.md` line 254, "security by construction, not just by instruction," to our own tooling). A failed migration leaves nothing behind. The post-change record is readable over the API through `public.team_tasks_schema_snapshot()`, with no password.
- **Cost:** about five minutes of Justin's time per schema change (two pastes), recorded in the near-zero campaign's decisions table as "stays his, by design." Changes to this schema are expected to be rare.
- **Limits:** the history guard's trust in trigger depth holds only while no agent has SQL access (point 1 is what keeps it true). The owner can still disable triggers; owner access can't be fenced from inside a table.
- **Revisit when:** any agent needs SQL access to this project (for instance, if `evryn-team-runtime` unfreezes and its own migrations 015–018 must be applied). **At that point, harden the history guard first:** no client role holds `INSERT` on `task_history`, and the after-trigger writes it as a pinned `SECURITY DEFINER`.

## Scope

The Evryn Team project only. The product database (`evryn-backend`) is a separate project with its own migration practice, and this decision says nothing about it.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
