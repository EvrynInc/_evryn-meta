#!/usr/bin/env node
/**
 * check.mjs — is the task tool's environment ready? Prints ONLY presence, kinds and verdicts:
 * never a value, on any path, including errors. Talks to the live database only through PostgREST
 * with the secret key. There is no database password (Soren, 2026-11-05 16:00–16:08).
 *
 *   node check.mjs             1. each variable: present or missing (by NAME)
 *                              2. the project ref in the URL compared with the hard-coded Evryn Team ref
 *                              3. the kind of key (secret / legacy service_role JWT), or why it is refused
 *                              4. the row count of public.tasks
 *
 *   node check.mjs --absent    ADVISORY ONLY, after Paste 1 (the dry run): confirms through PostgREST
 *                              that the new tasks columns and task_history are NOT there.
 *       ⚠ It is NOT the proof that nothing changed. PostgREST caches the schema, and a stale cache
 *       reports a column as unknown even when it exists. The BINDING guard is structural: Paste 2's
 *       own before-assertions require runtime 003's exact shape and no task_history, so if a dry run
 *       had somehow committed, Paste 2 refuses and changes nothing (Soren, 16:07).
 *
 * Exit 0 only if every check passed. Tasks AC runs this live; tests drive it with fakes.
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { pathToFileURL } from 'node:url';
import { ConfigError, ENV_FILES, TEAM_HOST, TEAM_REF, VAR, classifyKey, loadVars, redact, teamRestTarget } from './lib/config.mjs';
import { RestError, makeRest } from './lib/rest.mjs';

/** PostgREST / Postgres signals that a column or relation is unknown. */
const UNKNOWN_COLUMN = new Set(['42703', 'PGRST204']);
const UNKNOWN_RELATION = new Set(['42P01', 'PGRST205', 'PGRST200']);

export async function runCheck({ argv = [], env, fetchImpl = globalThis.fetch, out = console.log } = {}) {
  const absentMode = argv.includes('--absent');
  if (argv.some((a) => a !== '--absent')) {
    out('usage: node check.mjs [--absent]');
    return 2;
  }
  let ok = true;
  const vars = loadVars([VAR.url, VAR.key], { env, file: ENV_FILES.team });
  const secrets = [vars[VAR.key]];
  const say = (s) => out(redact(s, secrets));

  for (const name of [VAR.url, VAR.key]) {
    say(`  ${name}: ${vars[name] ? 'present' : 'MISSING'}`);
    if (!vars[name]) ok = false;
  }

  if (vars[VAR.url]) {
    let host = null;
    try {
      host = new URL(vars[VAR.url]).hostname;
    } catch {
      /* reported below */
    }
    if (host === TEAM_HOST) say(`  project ref in URL: matches ${TEAM_REF}`);
    else {
      say(`  project ref in URL: DOES NOT MATCH ${TEAM_REF} (or the URL does not parse)`);
      ok = false;
    }
  }
  if (vars[VAR.key]) {
    try {
      say(`  key kind: ${classifyKey(vars[VAR.key])}`);
    } catch (e) {
      say(`  key kind: REFUSED — ${e instanceof ConfigError ? e.message : 'unrecognized'}`);
      ok = false;
    }
  }

  let rest = null;
  if (ok) {
    try {
      rest = makeRest({ target: teamRestTarget(vars), actor: 'ac', fetchImpl });
      const { headers } = await rest.request('GET', 'tasks?select=id&limit=1', { prefer: 'count=exact' });
      const total = (headers.get('content-range') ?? '').split('/')[1];
      say(`  tasks rows (PostgREST, secret key): ${total ?? 'unknown (no Content-Range)'}`);
      if (total === undefined || total === '*') ok = false;
    } catch (e) {
      ok = false;
      if (e instanceof RestError) say(`  tasks rows: FAILED — ${e.message}${e.code ? ` [${e.code}]` : ''}${e.hint ? ` hint: ${e.hint}` : ''}`);
      else say(`  tasks rows: REFUSED — ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }

  if (absentMode && rest) {
    say('  --absent (ADVISORY — PostgREST caches the schema; the binding guard is Paste 2\'s before-assertions):');
    const probe = async (label, path, unknownCodes) => {
      try {
        await rest.request('GET', path);
        say(`    ${label}: PRESENT — the migration appears to be applied (or the cache is stale). Do not run Paste 2; report this.`);
        return false;
      } catch (e) {
        if (e instanceof RestError && unknownCodes.has(String(e.code))) {
          say(`    ${label}: absent, as expected [${e.code}]`);
          return true;
        }
        say(`    ${label}: UNEXPECTED — ${e instanceof Error ? e.message : 'unknown error'}${e instanceof RestError && e.code ? ` [${e.code}]` : ''}`);
        return false;
      }
    };
    if (!(await probe('tasks.short_id column', 'tasks?select=short_id&limit=1', UNKNOWN_COLUMN))) ok = false;
    if (!(await probe('task_history table', 'task_history?select=id&limit=1', UNKNOWN_RELATION))) ok = false;
  }

  say(ok ? '  CHECK OK' : '  CHECK FAILED');
  return ok ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = await runCheck({ argv: process.argv.slice(2) });
  } catch (e) {
    console.error(`CHECK FAILED: ${e instanceof Error ? e.message : 'unknown error'}`);
    process.exitCode = 1;
  }
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
