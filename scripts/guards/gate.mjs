#!/usr/bin/env node
// gate.mjs — what every scheduled task runs: refuse to run any vault copy whose hash isn't the one Justin approved
// (guards design §1.3, revised after review finding 17; build brief 1, revised block items 1 and 2; DCG-V, 2026-11-18;
// QCI findings 1, 3, 5 and note 16, DCF, 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
//   cmd.exe /d /c cd /d C:\Program Files\ClaudeCode\evryn-guards&&set NODE_OPTIONS=&…&..\..\nodejs\node.exe gate.mjs <watch|morning|midday> "<state-folder>"
//   (the scheduled task's action, through conhost --headless: install-tasks.ps1 -Elevated writes it. The cmd /d line
//   clears NODE_OPTIONS before node starts, because node would otherwise run whatever it names first: QCI finding 3.)
//
// REQUIREMENT: the scheduled tasks MUST run only the watch Justin approved. So the gate hashes every file named in the
// vault's manifest.json (written by approve-guards on his UAC yes), and managed-settings.json beside the vault folder,
// and:
//   all match            → runs the VAULT's admiral-watch.mjs with the vault's node.exe, and exits with its code;
//   any mismatch, missing file, or unreadable manifest
//                        → writes STOP in the state folder, runs the VAULT's kill-switch.mjs --all, sends an URGENT ping
//                          through the VAULT's ping.mjs (which reads only the vault's webhook.json), logs, and exits 1.
//                          🔴 After a mismatch it runs NO repo code (review finding 4).
//   STOP present         → runs nothing, EXCEPT retrying an alarm that hasn't been delivered, at most once an hour.
//   the kill switch's STOP (QCR New 2: <codeRoot>evryn-team-workspace…admiral-on-a-schedulestateSTOP, the code root
//                          from the vault's config.json) → runs no watch, for EVERY role's state folder, Thea's included.
//                          A mismatch still raises its alarm: the kill switch stops the schedule, not the tamper alarm.
// The alarm is recorded as delivered only when the ping exits 0 (QCI finding 5). The FIRST alarm for a mismatch never
// consults anything in the state folder, so nothing an agent writes there in advance can suppress it.
// Every child runs with NODE_OPTIONS, NODE_PATH, NODE_COMPILE_CACHE and NODE_ICU_DATA removed from its environment, and with
// every EVRYN_* variable removed except the one the gate sets itself (QCR New 6b: a user-level EVRYN_SHARED_DIR, set with
// setx, would otherwise move the watch's kill-switch and brake records).
// tests/vault.test.mjs FAILS if a changed byte runs the watch, if the alarm path runs anything from outside the vault,
// if a failed ping is recorded as delivered, or if the gate can't find itself under a path with a space.
//
// WHAT IT CAN'T SEE: the vault copies change only with an administrator's write, so a mismatch means a failed install or
// someone with admin rights; it can't tell which, so it stops everything either way. It doesn't check the repo's working
// files at all, by design: an edit there never runs until Justin approves it (the daily report lists those). It can't
// stop a session someone starts by hand outside the scheduled tasks. The state folder is agent-writable: an agent can
// write STOP itself (which only stops the schedule: fail-safe, and the daily report shows it), or mark an undelivered
// alarm as delivered so the hourly RETRIES stop (the first attempt is never suppressible). If Slack itself is down or
// the vaulted webhook has been revoked, the ping fails; the daily report shows STOP and the gate log either way.

import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IN_VAULT, readJSON } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));                // never URL.pathname (QCI finding 1)
// Tests only (ignored in the vault): run against another folder, and record instead of running anything.
const VAULT = (!IN_VAULT && process.env.EVRYN_GATE_VAULT) || HERE;
const DRY = !IN_VAULT && process.env.EVRYN_GATE_DRY === '1';
const NODE = process.execPath;
const [mode, stateArg] = process.argv.slice(2);
// The files the gate refuses to run without, whatever the manifest says: an install that dropped one is a mismatch.
const REQUIRED = ['admiral-watch.mjs', 'kill-switch.mjs', 'claude-bin.mjs', 'ping.mjs', 'watch.json', 'config.json', 'webhook.json', 'outbound-pins.json', 'standing-orders.md', 'gate.mjs', 'lib.mjs'];
const SCHED = ['evryn-team-workspace', 'shared', 'projects', 'helm', '2026', '2026.11.05-admiral-on-a-schedule'];
const HOUR = 3600000;
// Children never inherit a variable node would load code or data from (QCI finding 3).
export const cleanEnv = (extra = {}) => ({ ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^NODE_(OPTIONS|PATH|COMPILE_CACHE|ICU_DATA)$/i.test(k) && !/^EVRYN_/i.test(k))), ...extra });
// The kill switch's STOP: the code root's Admiral state folder, whatever role this run serves (QCR New 2).
const killSwitchStop = () => { const root = readJSON(path.join(VAULT, 'config.json'), {}).codeRoot; return root ? path.join(root, ...SCHED, 'state', 'STOP') : null; };

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
  // managed-settings.json sits beside the vault folder (QCI note 16).
  if (!m.managed) bad.push('managed-settings.json (not in the manifest)');
  else { let got = null; try { got = sha(path.join(VAULT, '..', 'managed-settings.json')); } catch { bad.push('managed-settings.json (missing)'); } if (got && got !== m.managed) bad.push('managed-settings.json (changed)'); }
  return bad;
}

// Run the vault's kill switch and ping, never one that is itself on the mismatch list (or the files they load).
// Returns the ping's exit status (null if it wasn't run).
function alarm(bad, log, { kill }) {
  const text = `URGENT: Vault gate: a vault file doesn't match what you approved (${bad.slice(0, 3).join('; ')}${bad.length > 3 ? '; …' : ''}). Every scheduled run is stopped. At a computer: re-approve or reinstall the vault, then clear STOP.`;
  const runs = kill ? [[path.join(VAULT, 'kill-switch.mjs'), '--all']] : [];
  runs.push([path.join(VAULT, 'ping.mjs'), text]);
  let pingStatus = null;
  for (const args of runs) {
    const name = path.basename(args[0]);
    const deps = { 'kill-switch.mjs': ['kill-switch.mjs', 'claude-bin.mjs', 'config.json', 'watch.json'], 'ping.mjs': ['ping.mjs', 'config.json', 'webhook.json'] }[name] || [name];
    if (bad.some(b => deps.some(d => b.startsWith(d + ' ')))) { log({ action: 'skipped-tampered', script: name }); continue; }
    if (DRY) { log({ action: 'would-run', args }); if (name === 'ping.mjs') pingStatus = 0; continue; }
    const r = spawnSync(NODE, args, { encoding: 'utf8', timeout: 120000, env: cleanEnv() });
    log({ action: 'ran', script: name, status: r.status });
    if (name === 'ping.mjs') pingStatus = r.status;
  }
  return pingStatus;
}

function main() {
  if (!['watch', 'morning', 'midday'].includes(mode) || !stateArg) { console.error('usage: gate.mjs watch|morning|midday <state-folder>'); return 2; }
  const STATE = path.resolve(stateArg);
  fs.mkdirSync(STATE, { recursive: true });
  const log = e => fs.appendFileSync(path.join(STATE, 'gate-log.jsonl'), JSON.stringify({ at: stamp(), mode, ...e }) + '\n');
  const alarmFile = path.join(STATE, 'gate-alarm.json');
  if (fs.existsSync(path.join(STATE, 'STOP'))) {
    // An alarm the gate raised and couldn't deliver is retried, at most once an hour, until it gets through.
    const a = readJSON(alarmFile, null);
    if (a && a.delivered === false && !(Date.now() - new Date(a.lastTry) < HOUR)) {
      const bad = check(); const list = bad.length ? bad : a.bad || ['(the mismatch has since cleared; STOP still holds)'];
      const status = alarm(list, log, { kill: false });
      fs.writeFileSync(alarmFile, JSON.stringify({ ...a, lastTry: stamp(), tries: (a.tries || 1) + 1, delivered: status === 0 }));
      log({ action: 'alarm-retry', delivered: status === 0 });
      return 1;
    }
    log({ action: 'stopped' }); return 0;
  }

  const bad = check();
  const ks = killSwitchStop();
  if (!bad.length && ks && fs.existsSync(ks)) { log({ action: 'stopped-by-kill-switch', stop: ks }); return 0; }
  if (!bad.length) {
    if (DRY) { log({ action: 'would-run-watch', watch: path.join(VAULT, 'admiral-watch.mjs') }); return 0; }
    const r = spawnSync(NODE, [path.join(VAULT, 'admiral-watch.mjs'), mode], { env: cleanEnv({ EVRYN_ADMIRAL_DIR: STATE }), encoding: 'utf8', timeout: 14 * 60000 });
    fs.appendFileSync(path.join(STATE, 'run.log'), `${stamp()} ${mode} (gate ok)\n${r.stdout || ''}${r.stderr || ''}`);
    return r.status ?? 1;
  }

  // A mismatch with no STOP is a new event: stop everything, using only the vault's own copies, and tell Justin. Nothing
  // in the state folder is consulted first, so an alarm record written there in advance can't suppress this ping.
  fs.writeFileSync(path.join(STATE, 'STOP'), `Stopped by the vault gate at ${stamp()}: ${bad.join('; ')}. Justin re-approves the vault (approve-guards.cmd), then clears STOP (kill-switch --undo).\n`);
  log({ action: 'MISMATCH', bad });
  const status = alarm(bad, log, { kill: true });
  fs.writeFileSync(alarmFile, JSON.stringify({ id: randomUUID(), bad, raisedAt: stamp(), lastTry: stamp(), tries: 1, delivered: status === 0 }));
  return 1;
}

process.exit(main());

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
