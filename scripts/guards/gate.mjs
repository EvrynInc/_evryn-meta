#!/usr/bin/env node
// gate.mjs — what every scheduled task runs: refuse to run any vault copy whose hash isn't the one Justin approved
// (guards design §1.3, revised after review finding 17; build brief 1, revised block items 1 and 2; DCG-V, 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
//   "C:\Program Files\nodejs\node.exe" "C:\Program Files\ClaudeCode\evryn-guards\gate.mjs" <watch|morning|midday> <state-folder>
//
// REQUIREMENT: the scheduled tasks MUST run only the watch Justin approved. So the gate hashes every file named in the
// vault's manifest.json (written by approve-guards on his UAC yes) and:
//   all match            → runs the VAULT's admiral-watch.mjs with the vault's node.exe, and exits with its code;
//   any mismatch, missing file, or unreadable manifest
//                        → writes STOP in the state folder, runs the VAULT's kill-switch.mjs --all, sends ONE URGENT
//                          ping through the VAULT's ping.mjs (once per distinct mismatch, not every 20 minutes), logs,
//                          and exits 1. 🔴 After a mismatch it runs NO repo code (review finding 4): the kill switch and
//                          the ping it uses are the vault's own approved copies, whose hashes it has just checked.
//   STOP present         → does nothing (logs), so a stopped machine stays stopped until Justin clears it.
// tests/guards.test.mjs FAILS if a changed byte runs the watch, or if the gate's alarm path runs anything from outside
// the vault.
//
// WHAT IT CAN'T SEE: the vault copies can only change with an administrator's write, so a mismatch means either a
// failed install or someone with admin rights; it can't tell which, so it stops everything either way. It doesn't check
// the repo's working files at all, by design: an edit there simply never runs until Justin approves it (the daily report
// lists those). It can't stop a session someone starts by hand outside the scheduled tasks; the launcher's own checks
// and the vault hooks cover those. If the ping's webhook in the team .env has been changed, the URGENT ping goes astray
// (STOP and the kill switch still happen; the daily report shows the gate log).

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { IN_VAULT, readJSON } from './lib.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
// Tests only (ignored in the vault): run against another folder, and record instead of running anything.
const VAULT = (!IN_VAULT && process.env.EVRYN_GATE_VAULT) || HERE;
const DRY = !IN_VAULT && process.env.EVRYN_GATE_DRY === '1';
const NODE = process.execPath;
const [mode, stateArg] = process.argv.slice(2);
// The files the gate refuses to run without, whatever the manifest says: an install that dropped one is a mismatch.
const REQUIRED = ['admiral-watch.mjs', 'kill-switch.mjs', 'claude-bin.mjs', 'ping.mjs', 'watch.json', 'config.json', 'standing-orders.md', 'gate.mjs', 'lib.mjs'];

const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const stamp = () => new Date().toISOString();

function check() {
  const m = readJSON(path.join(VAULT, 'manifest.json'), null);
  if (!m || typeof m.files !== 'object' || !m.files) return ['manifest.json (missing or unreadable)'];
  const bad = [];
  for (const r of REQUIRED) if (!(r in m.files)) bad.push(`${r} (not in the manifest)`);
  for (const [name, want] of Object.entries(m.files)) {
    if (name.includes('..') || path.isAbsolute(name)) { bad.push(`${name} (a path outside the vault)`); continue; }
    let got = null; try { got = sha(path.join(VAULT, name)); } catch { bad.push(`${name} (missing)`); continue; }
    if (got !== want) bad.push(`${name} (changed)`);
  }
  return bad;
}

function main() {
  if (!['watch', 'morning', 'midday'].includes(mode) || !stateArg) { console.error('usage: gate.mjs watch|morning|midday <state-folder>'); return 2; }
  const STATE = path.resolve(stateArg);
  fs.mkdirSync(STATE, { recursive: true });
  const log = e => fs.appendFileSync(path.join(STATE, 'gate-log.jsonl'), JSON.stringify({ at: stamp(), mode, ...e }) + '\n');
  if (fs.existsSync(path.join(STATE, 'STOP'))) { log({ action: 'stopped' }); return 0; }

  const bad = check();
  if (!bad.length) {
    if (DRY) { log({ action: 'would-run-watch', watch: path.join(VAULT, 'admiral-watch.mjs') }); return 0; }
    const r = spawnSync(NODE, [path.join(VAULT, 'admiral-watch.mjs'), mode], { env: { ...process.env, EVRYN_ADMIRAL_DIR: STATE }, encoding: 'utf8', timeout: 14 * 60000 });
    fs.appendFileSync(path.join(STATE, 'run.log'), `${stamp()} ${mode} (gate ok)\n${r.stdout || ''}${r.stderr || ''}`);
    return r.status ?? 1;
  }

  // A mismatch: stop everything, using only the vault's own copies, and tell Justin once per distinct mismatch.
  fs.writeFileSync(path.join(STATE, 'STOP'), `Stopped by the vault gate at ${stamp()}: ${bad.join('; ')}. Justin re-approves the vault (approve-guards.cmd), then clears STOP (kill-switch --undo).\n`);
  log({ action: 'MISMATCH', bad });
  const key = createHash('sha256').update(bad.join('|')).digest('hex').slice(0, 16);
  const alarm = path.join(STATE, 'gate-alarm.json');
  const told = readJSON(alarm, {}).key === key;
  const runs = [[path.join(VAULT, 'kill-switch.mjs'), '--all']];
  if (!told) runs.push([path.join(VAULT, 'ping.mjs'), `URGENT: Vault gate: a vault file doesn't match what you approved (${bad.slice(0, 3).join('; ')}${bad.length > 3 ? '; …' : ''}). Every scheduled run is stopped. At a computer: re-approve or reinstall the vault, then clear STOP.`]);
  for (const args of runs) {
    // Never run a vault file that is itself on the mismatch list (or the libraries they load): STOP still holds.
    const name = path.basename(args[0]);
    const deps = { 'kill-switch.mjs': ['kill-switch.mjs', 'claude-bin.mjs', 'config.json', 'watch.json'], 'ping.mjs': ['ping.mjs', 'config.json'] }[name] || [name];
    if (bad.some(b => deps.some(d => b.startsWith(d + ' ')))) { log({ action: 'skipped-tampered', script: name }); continue; }
    if (DRY) { log({ action: 'would-run', args }); continue; }
    const r = spawnSync(NODE, args, { encoding: 'utf8', timeout: 120000 });
    log({ action: 'ran', script: path.basename(args[0]), status: r.status });
  }
  fs.writeFileSync(alarm, JSON.stringify({ key, at: stamp() }));
  return 1;
}

process.exit(main());

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
