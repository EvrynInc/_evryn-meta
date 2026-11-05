/**
 * pg.mjs — run the PostgreSQL client tools without ever putting a credential on a command line,
 * and without ever resolving a tool from PATH or the network.
 *
 * - Credentials travel as PG* ENVIRONMENT VARIABLES, never argv: a spawn error object carries the
 *   whole argv, so a secret there leaks into the transcript the moment the call throws
 *   (`_evryn-meta/scripts/pg-dump.mjs` header, the ACf incident of 2026-07-13).
 * - Tools are found by ABSOLUTE path only (SEALED-EXEC, DC manual): the known install directories,
 *   or EVRYN_TASKS_PG_BIN when it is an absolute directory. Never a bare name.
 * - Every output is scrubbed of URI-shaped text and of the password itself before it is returned.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { redact } from './config.mjs';

const DEFAULT_DIRS = [
  'C:\\Program Files\\PostgreSQL\\17\\bin',
  'C:\\Program Files\\PostgreSQL\\16\\bin',
  '/usr/lib/postgresql/17/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/opt/homebrew/bin',
];

export function findPgTool(name, env = process.env) {
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  const dirs = env.EVRYN_TASKS_PG_BIN ? [env.EVRYN_TASKS_PG_BIN] : DEFAULT_DIRS;
  for (const dir of dirs) {
    if (!isAbsolute(dir)) continue;
    const candidate = join(dir, exe);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    `${name} not found in: ${dirs.join(', ')}. Install the PostgreSQL 17 client tools ` +
      '(they are per-machine and do not travel with git; winget install PostgreSQL.PostgreSQL.17 --source winget), ' +
      'or set EVRYN_TASKS_PG_BIN to their absolute bin directory. This script never looks a tool up on PATH.',
  );
}

/** The child environment: the parent's, minus every inherited PG* variable, plus the target. */
export function pgEnv(target, base = process.env) {
  const env = {};
  for (const [k, v] of Object.entries(base)) if (!/^PG/i.test(k)) env[k] = v;
  env.PGHOST = target.host;
  env.PGPORT = String(target.port);
  env.PGUSER = target.user;
  env.PGDATABASE = target.database;
  env.PGSSLMODE = target.sslmode ?? 'require';
  env.PGCONNECT_TIMEOUT = '15';
  env.PGAPPNAME = 'evryn-tasks';
  if (target.password) env.PGPASSWORD = target.password;
  return env;
}

/**
 * Run psql against `target`. Returns { status, stdout, stderr }, all scrubbed. Never throws a
 * spawn error object outward — only its message, which by construction holds no secret.
 */
export function runPsql(target, args, { input, runner = spawnSync, tool } = {}) {
  const psql = tool ?? findPgTool('psql');
  // SEALED-EXEC: followed 2026-08-11 — psql is an absolute path to an installed PostgreSQL client binary (findPgTool never consults PATH or a registry), so it cannot fetch itself from the network.
  const r = runner(psql, ['-X', '-v', 'ON_ERROR_STOP=1', ...args], {
    env: pgEnv(target),
    encoding: 'utf8',
    input,
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  const secrets = [target.password];
  if (r.error) throw new Error(`psql could not run: ${redact(r.error.message, secrets)}`);
  return {
    status: r.status,
    stdout: redact(r.stdout ?? '', secrets),
    stderr: redact(r.stderr ?? '', secrets),
  };
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
