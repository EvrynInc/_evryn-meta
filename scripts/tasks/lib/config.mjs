/**
 * config.mjs — where the task scripts get their credentials, and the bulkhead that keeps them
 * pointed at the Evryn Team project and nowhere else.
 *
 * THREE RULES, each enforced here so no script can forget one:
 *
 *  1. NO VALUE IS EVER PRINTED. Errors name the VARIABLE, never its value, on every path.
 *     (Same discipline as `_evryn-meta/scripts/ping.mjs` and `pg-dump.mjs`.)
 *
 *  2. R5 — THE TEAM PROJECT ONLY. The project ref is hard-coded. A URL for any other host — the
 *     product database above all, which holds people's personal data — is refused BEFORE any
 *     request is built. A legacy JWT key is decoded (not verified; we only read its claims) and
 *     refused unless it is a service_role key for this same ref. A publishable key is refused.
 *     The ONE exception is the local-test channel EVRYN_TASKS_LOCAL_PG, which is accepted only
 *     for a loopback host, so it cannot be aimed at any real database either.
 *
 *  3. A TEST RUN CAN NEVER READ A REAL .env (Soren, 2026-11-05 14:53). The real credentials sit
 *     one directory away from any checkout of this repo, and these scripts find them from their
 *     own location. So `readEnvFile` throws a TRIPWIRE whenever it is called inside a test run —
 *     detected from the real process environment (EVRYN_TASKS_TEST_MODE=1, or NODE_TEST_CONTEXT,
 *     which `node --test` sets in every test process). Tests inject their environment instead.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEAM_REF = 'azugibmylktinddyqkhd';
export const TEAM_HOST = `${TEAM_REF}.supabase.co`;

/** The session pooler. The direct DB host is IPv6-only from this network (S7 RESULTS §1). */
export const POOLER = Object.freeze({
  host: 'aws-1-us-west-2.pooler.supabase.com',
  port: '5432',
  user: `postgres.${TEAM_REF}`,
  database: 'postgres',
});

export const VAR = Object.freeze({
  url: 'EVRYN_TEAM_SUPABASE_URL',
  key: 'EVRYN_TEAM_SUPABASE_SECRET_KEY',
  password: 'EVRYN_TEAM_DB_PASSWORD',
  linear: 'LINEAR_API_KEY',
  local: 'EVRYN_TASKS_LOCAL_PG',
});

/** The shared parent folder holding every repo as a sibling, derived from THIS file's location. */
export const CODE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

export const ENV_FILES = Object.freeze({
  team: join(CODE_ROOT, 'evryn-team-workspace', '.env'),
  meta: join(CODE_ROOT, '_evryn-meta', '.env'),
});

/** Same shape as `isSafeActorName` in evryn-team-runtime/src/tools/tools.ts. */
export const ACTOR_SHAPE = /^[A-Za-z0-9_.-]{1,64}$/;
export function isSafeActorName(name) {
  return typeof name === 'string' && ACTOR_SHAPE.test(name);
}

export class ConfigError extends Error {}

/** True inside any test run. Reads the REAL process environment, never an injected one. */
export function inTestRun() {
  return process.env.EVRYN_TASKS_TEST_MODE === '1' || Boolean(process.env.NODE_TEST_CONTEXT);
}

export function parseEnvText(text) {
  const out = {};
  for (const rawLine of String(text).split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    out[m[1]] = value;
  }
  return out;
}

/**
 * Read one .env file. Returns null if it does not exist. THROWS the tripwire inside a test run,
 * before touching the filesystem — that throw is what makes "a test touched the real .env" a red
 * test instead of a silent credential load.
 */
export function readEnvFile(path, { readFile = readFileSync } = {}) {
  if (inTestRun()) {
    throw new ConfigError(
      `TEST TRIPWIRE: a test run tried to read an env file (${path}). ` +
        'Tests must inject their environment; nothing under test may load real credentials.',
    );
  }
  let text;
  try {
    text = readFile(path, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw new ConfigError(`could not read ${path} (${err && err.code ? err.code : 'unknown error'})`);
  }
  return parseEnvText(text);
}

const nonEmpty = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);

/**
 * Resolve variables.
 *  - `env` given (in-process tests): it is the ONLY source; no file is read.
 *  - EVRYN_TASKS_ENV_FROM_PROCESS=1 (spawned-process tests): the process environment only.
 *  - otherwise: the process environment wins, then the .env file.
 */
export function loadVars(names, { env, file } = {}) {
  const out = {};
  if (env) {
    for (const n of names) out[n] = nonEmpty(env[n]);
    return out;
  }
  const fileVars =
    process.env.EVRYN_TASKS_ENV_FROM_PROCESS === '1' || !file ? {} : readEnvFile(file) ?? {};
  for (const n of names) out[n] = nonEmpty(process.env[n]) ?? nonEmpty(fileVars[n]);
  return out;
}

export function requireVars(vars, names, where) {
  const missing = names.filter((n) => !vars[n]);
  if (missing.length) {
    throw new ConfigError(
      `missing variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}` +
        (where ? ` (looked in ${where} and the process environment)` : ''),
    );
  }
}

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Classify the key WITHOUT printing it, and refuse any key that is not a team service key.
 * Returns 'secret' (a new-style key: "sb_" then "secret_") or 'legacy-service-role' (old JWT service_role key).
 */
export function classifyKey(key) {
  if (key.startsWith('sb_' + 'secret_')) return 'secret';
  if (key.startsWith('sb_' + 'publishable_')) {
    throw new ConfigError(`${VAR.key} is a publishable key; the task tool needs the project's secret key`);
  }
  const claims = decodeJwtPayload(key);
  if (claims) {
    if (claims.role !== 'service_role') {
      throw new ConfigError(`${VAR.key} is a legacy key for a role other than service_role; refusing`);
    }
    if (claims.ref !== TEAM_REF) {
      throw new ConfigError(`${VAR.key} is a legacy key for a different project (not ${TEAM_REF}); refusing`);
    }
    return 'legacy-service-role';
  }
  throw new ConfigError(`${VAR.key} is not a recognizable Supabase secret key; refusing`);
}

/** R5 for the REST path. Throws before anything is sent; returns where to send and how. */
export function teamRestTarget(vars) {
  requireVars(vars, [VAR.url, VAR.key], 'evryn-team-workspace/.env');
  let u;
  try {
    u = new URL(vars[VAR.url]);
  } catch {
    throw new ConfigError(`${VAR.url} is not a parseable URL`);
  }
  if (u.protocol !== 'https:' || u.hostname !== TEAM_HOST || (u.port !== '' && u.port !== '443')) {
    throw new ConfigError(
      `${VAR.url} does not point at the Evryn Team project (ref ${TEAM_REF}); refusing before any request is sent`,
    );
  }
  const keyKind = classifyKey(vars[VAR.key]);
  return { base: `https://${TEAM_HOST}`, key: vars[VAR.key], keyKind };
}

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

/** The local-test connection. Loopback only, so it can never be aimed at a real database. */
export function localPgTarget(value) {
  let u;
  try {
    u = new URL(value);
  } catch {
    throw new ConfigError(`${VAR.local} is not a parseable postgres URI`);
  }
  if (!/^postgres(ql)?:$/.test(u.protocol)) throw new ConfigError(`${VAR.local} is not a postgres:// URI`);
  if (!LOOPBACK.has(u.hostname)) {
    throw new ConfigError(`${VAR.local} must point at a loopback host (local test clusters only); refusing`);
  }
  return {
    label: 'local test cluster (loopback)',
    local: true,
    host: u.hostname.replace(/^\[|\]$/g, ''),
    port: u.port || '5432',
    user: decodeURIComponent(u.username || 'postgres'),
    database: decodeURIComponent(u.pathname.replace(/^\//, '')) || 'postgres',
    password: u.password ? decodeURIComponent(u.password) : undefined,
    sslmode: 'disable',
  };
}

/** R5 for the Postgres path: the team pooler (hard-coded host and user), or a loopback cluster. */
export function pgTarget(vars) {
  if (vars[VAR.local]) return localPgTarget(vars[VAR.local]);
  requireVars(vars, [VAR.password], 'evryn-team-workspace/.env');
  return {
    label: `Evryn Team (session pooler, ref ${TEAM_REF})`,
    local: false,
    ...POOLER,
    password: vars[VAR.password],
    sslmode: 'require',
  };
}

/** Last-line defence: strip any known secret from text before it is printed. */
export function redact(text, secrets) {
  let out = String(text ?? '');
  for (const s of secrets) {
    if (typeof s === 'string' && s.length >= 6) out = out.split(s).join('<REDACTED>');
  }
  return out.replace(/postgres(ql)?:\/\/\S+/gi, '<REDACTED-URI>');
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
