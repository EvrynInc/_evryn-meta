#!/usr/bin/env node
/**
 * check.mjs — is the task tool's environment ready? Prints ONLY presence, kinds and verdicts:
 * never a value, on any path, including errors.
 *
 *   1. each variable: present or missing (by NAME)
 *   2. the project ref in the URL compared with the hard-coded Evryn Team ref
 *   3. the kind of key (secret / legacy service_role JWT), or why it is refused
 *   4. the row count of public.tasks, through PostgREST with the key
 *   5. `select 1` through the session pooler with the database password
 *
 * Exit 0 only if every check passed. Tasks AC runs this live; tests drive it with fakes.
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { pathToFileURL } from 'node:url';
import { ConfigError, ENV_FILES, POOLER, TEAM_HOST, TEAM_REF, VAR, classifyKey, loadVars, pgTarget, redact, teamRestTarget } from './lib/config.mjs';
import { RestError, makeRest } from './lib/rest.mjs';
import { runPsql } from './lib/pg.mjs';

export async function runCheck({ env, fetchImpl = globalThis.fetch, psql = runPsql, out = console.log } = {}) {
  let ok = true;
  const vars = loadVars([VAR.url, VAR.key, VAR.password], { env, file: ENV_FILES.team });
  const secrets = [vars[VAR.key], vars[VAR.password]];
  const say = (s) => out(redact(s, secrets));

  for (const name of [VAR.url, VAR.key, VAR.password]) {
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
  say(`  pooler: ${POOLER.host}:${POOLER.port} as ${POOLER.user} (hard-coded; ref matches ${TEAM_REF})`);

  if (vars[VAR.url] && vars[VAR.key]) {
    try {
      const target = teamRestTarget(vars);
      const rest = makeRest({ target, actor: 'ac', fetchImpl });
      const { headers } = await rest.request('GET', 'tasks?select=id&limit=1', { prefer: 'count=exact' });
      const range = headers.get('content-range') ?? '';
      const total = range.split('/')[1];
      say(`  tasks rows (PostgREST, secret key): ${total ?? 'unknown (no Content-Range)'}`);
      if (total === undefined || total === '*') ok = false;
    } catch (e) {
      ok = false;
      if (e instanceof RestError) say(`  tasks rows: FAILED — ${e.message}${e.code ? ` [${e.code}]` : ''}${e.hint ? ` hint: ${e.hint}` : ''}`);
      else say(`  tasks rows: REFUSED — ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }

  if (vars[VAR.password]) {
    try {
      // The pooler only: a local override is deliberately not honoured by the live check.
      const target = pgTarget({ [VAR.password]: vars[VAR.password] });
      const r = psql(target, ['-At', '-c', 'select 1']);
      if (r.status === 0 && r.stdout.trim() === '1') say('  pooler select 1: ok');
      else {
        ok = false;
        say(`  pooler select 1: FAILED (psql exited ${r.status}) ${r.stderr.trim().split(/\r?\n/)[0] ?? ''}`);
      }
    } catch (e) {
      ok = false;
      say(`  pooler select 1: FAILED — ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }

  say(ok ? '  CHECK OK' : '  CHECK FAILED');
  return ok ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = await runCheck();
  } catch (e) {
    console.error(`CHECK FAILED: ${e instanceof Error ? e.message : 'unknown error'}`);
    process.exitCode = 1;
  }
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
