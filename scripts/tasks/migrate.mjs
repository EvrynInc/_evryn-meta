#!/usr/bin/env node
/**
 * migrate.mjs — apply scripts/tasks/migrations/*.sql, in order, in ONE transaction, through psql.
 *
 * USAGE
 *   node migrate.mjs --rehearse     apply everything, then ROLL BACK (proves it applies; changes nothing)
 *   node migrate.mjs --apply-live   apply to the Evryn Team database (Tasks AC, under Justin's go)
 *   EVRYN_TASKS_LOCAL_PG=postgresql://postgres@127.0.0.1:<port>/postgres node migrate.mjs
 *                                   apply to a LOCAL loopback test cluster (no flag needed)
 *
 * SAFETY
 *   - Credentials go to psql as PG* environment variables, never argv (pg-dump.mjs's pattern).
 *   - R5: the live target is the hard-coded team pooler host and user; the only other target
 *     accepted is a loopback test cluster. Nothing can aim this at the product database.
 *   - A live APPLY needs the explicit --apply-live flag, so a stray run cannot migrate anything.
 *   - REFUSES unless runtime migration 003 is present (public.tasks and public.proposals exist).
 *   - All files run in one transaction with lock_timeout 5s: it applies whole, or not at all.
 *   - A constraint that existing rows would fail is left NOT VALID and named in a NOTICE.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ConfigError, ENV_FILES, VAR, loadVars, pgTarget } from './lib/config.mjs';
import { runPsql } from './lib/pg.mjs';

export const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

export function listMigrations(dir = MIGRATIONS_DIR) {
  return readdirSync(dir)
    .filter((f) => /^\d{3}_[A-Za-z0-9_-]+\.sql$/.test(f))
    .sort()
    .map((f) => join(dir, f));
}

const USAGE = `usage: node migrate.mjs --rehearse | --apply-live
       EVRYN_TASKS_LOCAL_PG=postgresql://postgres@127.0.0.1:<port>/postgres node migrate.mjs`;

export function runMigrate(argv, { env, psql = runPsql, out = console.log, err = console.error, dir = MIGRATIONS_DIR } = {}) {
  const rehearse = argv.includes('--rehearse');
  const applyLive = argv.includes('--apply-live');
  const unknown = argv.filter((a) => !['--rehearse', '--apply-live'].includes(a));
  if (unknown.length || (rehearse && applyLive)) {
    err(USAGE);
    return 2;
  }

  let target;
  try {
    target = pgTarget(loadVars([VAR.password, VAR.local], { env, file: ENV_FILES.team }));
  } catch (e) {
    err(`MIGRATE REFUSED: ${e instanceof ConfigError ? e.message : 'could not resolve the target'}`);
    return 1;
  }
  // QC Finding 5: the live flags must never quietly land on a local cluster — an operator who typed
  // --apply-live must not be told "applied" about a database that is not live.
  if (target.local && (rehearse || applyLive)) {
    err(
      `MIGRATE REFUSED: ${rehearse ? '--rehearse' : '--apply-live'} is for the live Evryn Team database, but EVRYN_TASKS_LOCAL_PG ` +
        'selects a local loopback cluster. Unset it to target live, or drop the flag to migrate the local cluster.',
    );
    return 2;
  }
  if (!target.local && !rehearse && !applyLive) {
    err('MIGRATE REFUSED: the target is the live Evryn Team database. Pass --rehearse (applies, then rolls back) or --apply-live.');
    return 2;
  }

  out(`  target: ${target.label}`);
  out(`  mode:   ${rehearse ? 'REHEARSE (everything is rolled back)' : 'APPLY'}`);

  const pre = psql(target, [
    '-At',
    '-c',
    "select (to_regclass('public.tasks') is not null)::text || ',' || (to_regclass('public.proposals') is not null)::text",
  ]);
  if (pre.status !== 0) {
    err(`MIGRATE FAILED: could not run the prerequisite check (psql exited ${pre.status})\n${pre.stderr.trim()}`);
    return 1;
  }
  if (pre.stdout.trim() !== 'true,true') {
    err(
      'MIGRATE REFUSED: runtime migration 003 is not present (public.tasks and public.proposals must both exist). ' +
        'Apply evryn-team-runtime/migrations/003_tasks_proposals.sql first; this sequence extends it.',
    );
    return 1;
  }

  const files = listMigrations(dir);
  if (files.length === 0) {
    err('MIGRATE FAILED: no migration files found');
    return 1;
  }
  for (const f of files) out(`  file:   ${f.split(/[\\/]/).pop()}`);

  const fileArgs = files.flatMap((f) => ['-f', f]);
  const args = rehearse
    ? ['-q', '-c', 'begin', '-c', "set local lock_timeout = '5s'", ...fileArgs, '-c', 'rollback']
    : ['-q', '-1', '-c', "set local lock_timeout = '5s'", ...fileArgs];
  const r = psql(target, args);

  const notices = r.stderr.split(/\r?\n/).filter((l) => l.trim() !== '');
  for (const line of notices) out(`  psql:   ${line}`);
  if (r.status !== 0) {
    err(`MIGRATE FAILED: psql exited ${r.status}. Nothing was committed (single transaction).`);
    return 1;
  }
  const notValid = notices.filter((l) => l.includes('left NOT VALID'));
  if (notValid.length) {
    out(`  ⚠ ${notValid.length} constraint(s) left NOT VALID because existing rows fail them (listed above).`);
    out('    They are enforced on every new write. Fixing the old rows changes existing values: a person decides that.');
  }
  out(rehearse ? '  OK: rehearsal applied cleanly and was rolled back. Nothing changed.' : '  OK: migrations applied and committed.');
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = runMigrate(process.argv.slice(2));
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
