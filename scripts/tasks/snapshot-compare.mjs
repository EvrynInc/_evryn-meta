#!/usr/bin/env node
/**
 * snapshot-compare.mjs — compare two schema-snapshot.mjs outputs (typically LOCAL vs LIVE, taken at
 * the same point) and classify EVERY difference as a STOP or as LISTED. Reads two files; touches no
 * database and no credential.
 *
 * USAGE   node snapshot-compare.mjs <local-snapshot.txt> <live-snapshot.txt>
 * EXIT    0 = no stop (listed differences may exist) · 1 = STOP · 2 = usage error
 *
 * THE RULE (Soren, S1, 2026-11-05 15:29, in the brief's Log):
 *   STOP — any difference in columns, defaults, constraints, triggers, RLS policies, whether RLS is
 *          enabled, or owner; and any difference in grants to service_role, anon, authenticated or
 *          PUBLIC, on both tables AND on every function the migrations create (an EXECUTE grant to
 *          PUBLIC, anon or authenticated is R4's exact failure).
 *   LISTED, not a stop — grants to any other role (Supabase-only roles), and privilege names that
 *          exist only in some Postgres versions (MAINTAIN, PostgreSQL 17+).
 *   The server version of each side is printed FIRST, so a version-only line can be told apart from
 *   a real one rather than assumed to be one.
 *
 * TWO CALLS THIS FILE MAKES THAT THE RULE DOES NOT NAME, both on the strict side (DC, 2026-11-05):
 *   - index differences STOP: tasks' uniqueness (short_id, linear_id) lives in unique indexes, so an
 *     index is a constraint here in all but name;
 *   - function DEFINITION differences (body hash, security mode, search_path, owner) STOP: a function
 *     body is trigger logic, and SECURITY DEFINER is R4's other failure.
 *   A line of a kind this file does not recognize also STOPS — an unknown difference is not safe.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const CORE_ROLES = new Set(['service_role', 'anon', 'authenticated', 'PUBLIC']);
export const VERSION_ONLY_PRIVILEGES = new Set(['MAINTAIN']);
const STRUCTURAL_KINDS = new Set(['table', 'rls', 'column', 'constraint', 'index', 'trigger', 'policy', 'sequence', 'function']);
const GRANT_KINDS = new Set(['grant', 'sequence-grant', 'function-grant']);

function lines(text) {
  return String(text)
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l !== '');
}

/** Classify one line that appears on only one side. Returns { stop: boolean, reason }. */
export function classify(line) {
  if (line.startsWith('#')) return { stop: false, reason: 'server version (information)' };
  const kind = line.split(' ', 1)[0];
  if (STRUCTURAL_KINDS.has(kind)) return { stop: true, reason: kind };
  if (GRANT_KINDS.has(kind)) {
    // "<kind> <object>: <grantee> <PRIVILEGE>[ WITH GRANT OPTION]"
    const m = line.match(/: (\S+) ([A-Z]+)(?: WITH GRANT OPTION)?$/);
    if (!m) return { stop: true, reason: `${kind} (unparseable)` };
    const [, grantee, privilege] = m;
    if (!CORE_ROLES.has(grantee)) return { stop: false, reason: `grant to a non-core role (${grantee})` };
    if (VERSION_ONLY_PRIVILEGES.has(privilege)) return { stop: false, reason: `version-only privilege (${privilege})` };
    return { stop: true, reason: `${kind} to ${grantee}` };
  }
  return { stop: true, reason: 'unrecognized line kind' };
}

export function compareSnapshots(localText, liveText) {
  const a = lines(localText);
  const b = lines(liveText);
  const setA = new Set(a);
  const setB = new Set(b);
  const version = (ls) => ls.filter((l) => l.startsWith('# server_version=')).map((l) => l.slice('# server_version='.length))[0] ?? 'unknown';
  const stops = [];
  const listed = [];
  for (const [side, mine, theirs] of [['only in local', a, setB], ['only in live', b, setA]]) {
    for (const line of mine) {
      if (theirs.has(line) || line.startsWith('#')) continue;
      const c = classify(line);
      (c.stop ? stops : listed).push({ side, line, reason: c.reason });
    }
  }
  return { localVersion: version(a), liveVersion: version(b), stops, listed };
}

export function renderComparison(result) {
  const out = [];
  out.push(`server version — local: ${result.localVersion} · live: ${result.liveVersion}`);
  out.push('');
  out.push(`STOPS (${result.stops.length})${result.stops.length ? ' — do not proceed:' : ''}`);
  for (const s of result.stops) out.push(`  [${s.side}] (${s.reason}) ${s.line}`);
  out.push('');
  out.push(`LISTED, not stops (${result.listed.length}):`);
  for (const s of result.listed) out.push(`  [${s.side}] (${s.reason}) ${s.line}`);
  out.push('');
  out.push(result.stops.length ? 'VERDICT: STOP' : 'VERDICT: no stop');
  return `${out.join('\n')}\n`;
}

export function runCompare(argv, { read = (p) => readFileSync(p, 'utf8'), out = (s) => process.stdout.write(s), err = console.error } = {}) {
  if (argv.length !== 2) {
    err('usage: node snapshot-compare.mjs <local-snapshot.txt> <live-snapshot.txt>');
    return 2;
  }
  let localText;
  let liveText;
  try {
    localText = read(argv[0]);
    liveText = read(argv[1]);
  } catch (e) {
    err(`COMPARE FAILED: ${e instanceof Error ? e.message : 'could not read the files'}`);
    return 2;
  }
  const result = compareSnapshots(localText, liveText);
  out(renderComparison(result));
  return result.stops.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = runCompare(process.argv.slice(2));
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
