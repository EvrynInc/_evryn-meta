#!/usr/bin/env node
/**
 * schema-snapshot.mjs — READ-ONLY. Print a deterministic text description of public.tasks,
 * public.task_history AND public.proposals (included so a before/after compare catches any change to
 * a table the go forbids touching — QC Finding 6): columns, defaults, identity/generated,
 * constraints, indexes, triggers, RLS, policies, grants, owners, the identity sequences, the task
 * functions (security mode, search_path, privileges, a hash of the body), and the project's default
 * privileges for future objects.
 *
 * USAGE
 *   EVRYN_TASKS_LOCAL_PG=postgresql://postgres@127.0.0.1:<port>/postgres node schema-snapshot.mjs
 *       a LOCAL loopback cluster, through psql (before or after migrating)
 *   node schema-snapshot.mjs --api
 *       the LIVE Evryn Team database, AFTER Paste 2, through PostgREST with the secret key: it calls
 *       public.team_tasks_schema_snapshot(). (There is no database password, so there is no live
 *       "before" snapshot: Paste 2's own before-assertions pin the live shape instead.)
 *   node snapshot-compare.mjs test/fixtures/local-snapshot-after.txt live-after.txt
 *
 * ONE SOURCE OF TRUTH. The query is NOT in this file: it is extracted from the body of
 * public.team_tasks_schema_snapshot() in migrations/004_schema_snapshot_fn.sql (between the
 * SNAPSHOT-QUERY markers), so the local script and the live function print the same text by
 * construction.
 *
 * THE LINE FORMAT. Each fact is ONE line with a kind prefix, so snapshot-compare.mjs can classify it:
 * `#` headers (information), `table` (owner), `rls`, `column`, `constraint`, `index`, `trigger`,
 * `policy`, `grant`, `sequence`, `sequence-grant`, `function`, `function-grant`, `default-acl`. The very
 * first line is `# target=...`, added here: where the snapshot was taken.
 *
 * Local runs inside `begin transaction read only` … `rollback`. Prints no credential.
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ConfigError, ENV_FILES, TEAM_REF, VAR, loadVars, pgTarget, redact, teamRestTarget } from './lib/config.mjs';
import { runPsql } from './lib/pg.mjs';
import { RestError, makeRest } from './lib/rest.mjs';

const SNAPSHOT_FN_FILE = join(dirname(fileURLToPath(import.meta.url)), 'migrations', '004_schema_snapshot_fn.sql');

/** The snapshot query, extracted from migration 004 — the only copy that exists. */
export function snapshotQuery(file = SNAPSHOT_FN_FILE) {
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = text.match(/-- SNAPSHOT-QUERY-BEGIN\n([\s\S]*?)\n-- SNAPSHOT-QUERY-END/);
  if (!m) throw new Error(`schema-snapshot: SNAPSHOT-QUERY markers not found in ${file}`);
  return m[1];
}

// search_path = '' exactly as inside the function (its `set search_path = ''`): the catalog
// deparsers (pg_get_constraintdef, pg_get_triggerdef, …) schema-qualify names according to the
// search_path, so without this the script and the function would print `tasks(id)` vs `public.tasks(id)`.
export const SNAPSHOT_SQL = `begin transaction read only;\nset local search_path = '';\n${snapshotQuery()};\nrollback;\n`;

/** The first line of every snapshot. No credential, and no port (so local golden files stay stable). */
export function targetLine(target) {
  if (target.local) return '# target=local-loopback';
  return `# target=evryn-team ref=${TEAM_REF} via api`;
}

const normalize = (text) => String(text).split(/\r?\n/).filter((l) => l.trim() !== '').join('\n');

export async function runSnapshot(argv, { env, psql = runPsql, fetchImpl = globalThis.fetch, out = (s) => process.stdout.write(s), err = console.error } = {}) {
  const api = argv.includes('--api');
  if (argv.some((a) => a !== '--api')) {
    err('usage: node schema-snapshot.mjs [--api]   (no flag: a local loopback cluster via EVRYN_TASKS_LOCAL_PG; --api: live, after Paste 2)');
    return 2;
  }

  if (api) {
    let secrets = [];
    try {
      const target = teamRestTarget(loadVars([VAR.url, VAR.key], { env, file: ENV_FILES.team }));
      secrets = [target.key];
      const rest = makeRest({ target, fetchImpl });
      const { data } = await rest.request('POST', 'rpc/team_tasks_schema_snapshot', { body: {} });
      if (typeof data !== 'string') throw new RestError('rpc/team_tasks_schema_snapshot did not return text');
      out(`${targetLine({ local: false })}\n${normalize(data)}\n`);
      return 0;
    } catch (e) {
      if (e instanceof ConfigError) err(`SNAPSHOT REFUSED: ${e.message}`);
      else if (e instanceof RestError) {
        err(redact(`SNAPSHOT FAILED: ${e.message}${e.code ? ` [${e.code}]` : ''}${e.hint ? ` hint: ${e.hint}` : ''}`, secrets));
        if (e.status === 404) err('  (If Paste 2 has not been run, the snapshot function does not exist yet — that is expected.)');
      } else err(redact(`SNAPSHOT FAILED: ${e instanceof Error ? e.message : 'unknown error'}`, secrets));
      return 1;
    }
  }

  let target;
  try {
    target = pgTarget(loadVars([VAR.local], { env, file: ENV_FILES.team }));
  } catch (e) {
    err(`SNAPSHOT REFUSED: ${e instanceof ConfigError ? e.message : 'could not resolve the target'}`);
    return 1;
  }
  const r = psql(target, ['-q', '-A', '-t', '-f', '-'], { input: SNAPSHOT_SQL });
  if (r.status !== 0) {
    err(`SNAPSHOT FAILED: psql exited ${r.status}\n${r.stderr.trim()}`);
    return 1;
  }
  // WHERE the snapshot came from (QC Finding 4): the compare refuses a "live" side that is loopback.
  out(`${targetLine(target)}\n${normalize(r.stdout)}\n`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await runSnapshot(process.argv.slice(2));
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
