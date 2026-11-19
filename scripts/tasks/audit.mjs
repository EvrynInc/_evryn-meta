#!/usr/bin/env node
/**
 * audit.mjs — the nightly audit of the authorization record (build brief 5 v2 §2.4; guards design §5.3). No
 * model. The watch runs it once a night; its output goes into the daily brief.
 *
 * WHY IT EXISTS: the database refuses an authorization written by anyone but `lucas` or `justin` (ET012), but on
 * one Windows account any session can SEND the name `lucas`. That residual is detection-only (migration 006's
 * header, condition C3). This audit is the detection: over the last N hours it lists
 *   1. every task_authorizations row, with tier, source, actor and session; for each, whether a transcript of
 *      that session exists ON THIS MACHINE and contains the `tasks.mjs authorize|accept T-<n>` command, and the
 *      session's display name if a `claude agents --all --json` capture is supplied. 🔴 A NAME DECIDES NOTHING
 *      (any session can name itself "Lucas"; condition C1): it is printed for a reader, never trusted;
 *   2. every write recorded as `justin` (Justin never runs the CLI; migration 006's own data-step writes are
 *      expected once, on the day of the paste);
 *   3. every write with no session id;
 *   4. every return to proposed for re-authorization (history flag reauthorization_needed), so the Lucas seat
 *      sees what needs a fresh yes.
 * It says plainly which sessions it could not check because their transcript is not on this machine.
 *
 * PRIVACY: a transcript can hold anything a session read. This script only tests each transcript for the one
 * command pattern; it NEVER prints transcript text, only "found" or "not found".
 *
 * USAGE   node audit.mjs [--hours 24] [--agents <claude-agents.json>] [--transcripts <dir>]
 *         --transcripts defaults to ~/.claude/projects (one folder per project, <session-id>.jsonl inside).
 * EXIT    0 = nothing to flag · 1 = something to look at (or a failure) · 2 = usage error
 * Reads the live database only through PostgREST with the secret key (lib/config.mjs's bulkhead); writes nothing.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { ConfigError, ENV_FILES, VAR, loadVars, redact, teamRestTarget } from './lib/config.mjs';
import { RestError, SESSION_SHAPE, makeRest } from './lib/rest.mjs';

/** Find <session>.jsonl one level below `dir` (Claude Code keeps one folder per project). Returns its path or null. */
export function findTranscriptIn(dir, session) {
  if (!SESSION_SHAPE.test(session) || !existsSync(dir)) return null;
  for (const project of readdirSync(dir)) {
    const p = join(dir, project, `${session}.jsonl`);
    try {
      if (statSync(p).isFile()) return p;
    } catch {
      /* not this project */
    }
  }
  return null;
}

/** True when the transcript text holds the CLI command that wrote this row (authorize or accept, this task). */
export function transcriptHoldsCommand(text, kind, shortId) {
  const verb = kind === 'acceptance' ? 'accept' : 'authorize';
  return new RegExp(`tasks(?:\\.mjs)?\\s+${verb}\\s+T-${shortId}(?![0-9])`).test(text);
}

/** Session id → display name, from a `claude agents --all --json` capture (any of its usual field names). */
export function namesFrom(agentsJson) {
  const names = new Map();
  const list = Array.isArray(agentsJson) ? agentsJson : Array.isArray(agentsJson?.agents) ? agentsJson.agents : [];
  for (const a of list) {
    const id = a.sessionId ?? a.session_id ?? a.id;
    const name = a.name ?? a.title;
    if (typeof id === 'string' && typeof name === 'string') names.set(id, name);
  }
  return names;
}

export async function runAudit({
  argv = [],
  env,
  fetchImpl = globalThis.fetch,
  out = console.log,
  now = () => new Date(),
  readText = (p) => readFileSync(p, 'utf8'),
  findTranscript,
} = {}) {
  let values;
  try {
    ({ values } = parseArgs({ args: argv, options: { hours: { type: 'string' }, agents: { type: 'string' }, transcripts: { type: 'string' } }, strict: true }));
  } catch (e) {
    out(`usage: node audit.mjs [--hours 24] [--agents <file>] [--transcripts <dir>] (${e instanceof Error ? e.message : 'bad options'})`);
    return 2;
  }
  const hours = values.hours === undefined ? 24 : Number(values.hours);
  if (!Number.isInteger(hours) || hours < 1 || hours > 24 * 31) {
    out('usage: --hours must be a whole number from 1 to 744');
    return 2;
  }
  const transcriptsDir = values.transcripts ?? join(homedir(), '.claude', 'projects');
  const find = findTranscript ?? ((s) => findTranscriptIn(transcriptsDir, s));
  let names = new Map();
  if (values.agents) {
    try {
      names = namesFrom(JSON.parse(readText(values.agents)));
    } catch {
      out(`WARNING: could not read the agents capture at ${values.agents}; names are not shown.`);
    }
  }

  let secrets = [];
  const say = (s) => out(redact(s, secrets));
  try {
    const target = teamRestTarget(loadVars([VAR.url, VAR.key], { env, file: ENV_FILES.team }));
    secrets = [target.key];
    const rest = makeRest({ target, actor: 'launcher', fetchImpl });
    const since = new Date(now().getTime() - hours * 3600000).toISOString();
    const at = `at=gte.${encodeURIComponent(since)}`;

    const auths = await rest.paginateAll('task_authorizations', `${at}&select=id,task_id,kind,tier,source,actor,session_id,justin_ref,rule_ref,at`, { cursorCol: 'id' });
    const justinWrites = await rest.paginateAll('task_history', `${at}&actor=eq.justin&select=id,task_id,at,op,changed_fields,note`, { cursorCol: 'id' });
    const noSession = await rest.paginateAll('task_history', `${at}&session_id=is.null&select=id,task_id,at,actor,op`, { cursorCol: 'id' });
    const returns = await rest.paginateAll('task_history', `${at}&flags=cs.%7Breauthorization_needed%7D&select=id,task_id,at,actor,note`, { cursorCol: 'id' });

    const ids = [...new Set([...auths, ...justinWrites, ...noSession, ...returns].map((r) => r.task_id))];
    const shortOf = new Map();
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const { data } = await rest.request('GET', `tasks?id=in.(${chunk.join(',')})&select=id,short_id`);
      for (const t of data ?? []) shortOf.set(t.id, t.short_id);
    }
    const tn = (id) => (shortOf.has(id) ? `T-${shortOf.get(id)}` : `task ${id}`);

    let flagged = 0;
    const notHere = new Set();
    say(`Authorization audit — the last ${hours} h (since ${since})`);
    say('');
    say(`1. Authorization record rows (${auths.length}):`);
    if (auths.length === 0) say('   (none)');
    for (const a of auths) {
      const where = a.justin_ref ? `Justin's words: ${a.justin_ref}` : a.rule_ref ? `rule: ${a.rule_ref}` : '-';
      const name = a.session_id && names.has(a.session_id) ? ` · name "${names.get(a.session_id)}" (display only; a name decides nothing)` : '';
      let check;
      if (a.tier === 'backfill') {
        check = 'migration 006 backfill (no session, by design)';
      } else if (!a.session_id) {
        check = '⚑ NO SESSION';
        flagged += 1;
      } else {
        const path = find(a.session_id);
        if (!path) {
          check = 'transcript not on this machine: NOT CHECKED';
          notHere.add(a.session_id);
          flagged += 1;
        } else if (transcriptHoldsCommand(readText(path), a.kind, shortOf.get(a.task_id))) {
          check = 'transcript holds the command';
        } else {
          check = `⚑ transcript found, but it does NOT hold "tasks.mjs ${a.kind === 'acceptance' ? 'accept' : 'authorize'} ${tn(a.task_id)}"`;
          flagged += 1;
        }
      }
      say(`   T-auth #${a.id} ${a.at} ${tn(a.task_id)} ${a.kind} · tier ${a.tier} · source ${a.source} · by ${a.actor} · session ${a.session_id ?? '-'}${name}`);
      say(`      ${where} · ${check}`);
    }
    say('');
    say(`2. Writes recorded as justin (${justinWrites.length}) — Justin never runs the CLI; only migration 006's own data steps, once, are expected:`);
    if (justinWrites.length === 0) say('   (none)');
    for (const h of justinWrites) {
      const expected = /^(migration 006|authorized \(T-auth #\d+, tier backfill\))/.test(h.note ?? '');
      if (!expected) flagged += 1;
      say(`   ${expected ? '' : '⚑ '}history #${h.id} ${h.at} ${tn(h.task_id)} ${h.op} ${(h.changed_fields ?? []).join(',')}${expected ? ' (migration 006 data step)' : ''}`);
    }
    say('');
    say(`3. Writes with no session id (${noSession.length}):`);
    if (noSession.length === 0) say('   (none)');
    for (const h of noSession) say(`   history #${h.id} ${h.at} ${tn(h.task_id)} ${h.op} by ${h.actor}`);
    if (noSession.length) flagged += 1;
    say('');
    say(`4. Returned to proposed for re-authorization (${returns.length}) — each needs a fresh yes:`);
    if (returns.length === 0) say('   (none)');
    for (const h of returns) say(`   ${tn(h.task_id)} ${h.at} by ${h.actor}: ${h.note ?? ''}`);
    say('');
    if (notHere.size) {
      say(`Could not check ${notHere.size} session(s) here, because their transcript is not on this machine (run this audit on the other machine too): ${[...notHere].join(', ')}`);
    }
    say(flagged ? `AUDIT: ${flagged} item(s) to look at.` : 'AUDIT: nothing to flag.');
    return flagged ? 1 : 0;
  } catch (e) {
    if (e instanceof ConfigError) say(`AUDIT REFUSED: ${e.message}`);
    else if (e instanceof RestError) say(`AUDIT FAILED: ${e.message}${e.code ? ` [${e.code}]` : ''}`);
    else say(`AUDIT FAILED: ${e instanceof Error ? e.message : 'unknown error'}`);
    return 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await runAudit({ argv: process.argv.slice(2) });
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
