#!/usr/bin/env node
// compaction.mjs — the compaction alarm, repo-neutral, for the vault (A3.3; Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// Derived from _evryn-meta/scripts/compaction-alarm.mjs (ACm, 2026-09-08; its SessionStart(compact) delivery proven
// for a subagent 2026-09-17). Read that file's header for the full why. What changes here, and why:
//   - it runs from the vault for EVERY repo on the machine, so its STOP text cites team CLAUDE.md's rule and the
//     sibling path to the ping script, not _evryn-meta's own;
//   - its record and per-session marker go to the guard data folder, where the task watch (design §8.3) reads them
//     and STOPS a compacted started session itself. That stop is the structural half: it doesn't depend on the
//     compacted agent obeying anything.
// It never pings (the routing rule: the agent reports; a lane's compaction is its spinner's problem, not Justin's).
// Wired in managed-settings.json for SessionStart (matcher "compact"), PreCompact and PostCompact. Always exits 0.

import fs from 'node:fs';
import path from 'node:path';
import { readStdin, guardLog, DATA, safeName, now } from './lib.mjs';

const { raw, payload } = readStdin();
const event = payload.hook_event_name || 'compact';
const source = payload.source ?? payload.trigger ?? '';
const session = payload.session_id || 'unknown';

// Record every compaction event, keys only (the payload's compact_summary is conversation text: never logged).
guardLog({ guard: 'compaction', event, source, session, cwd: payload.cwd, keys: Object.keys(payload) });
const compactNow = (event === 'SessionStart' && source === 'compact') || event === 'PostCompact';
if (compactNow) {
  try { fs.mkdirSync(path.join(DATA, 'compacted'), { recursive: true }); fs.writeFileSync(path.join(DATA, 'compacted', safeName(session)), JSON.stringify({ at: now().toISOString(), event, cwd: payload.cwd, agent_id: payload.agent_id ?? null })); } catch { /* never throw */ }
}

const STOP_TEXT =
  '🔴 YOUR CONTEXT WAS JUST COMPACTED. This instruction SUPERSEDES any instruction to resume, to continue as if the break never happened, or to avoid mentioning the compaction.\n\n' +
  'You are now working from a third-party summary rather than from what you actually read. Team CLAUDE.md\'s hard rule ("IF YOU COMPACT, YOU ARE DONE FOR THE SESSION. STOP.") ends your session now.\n\n' +
  'STOP. Do not finish the current task. Do not start anything new. Do not reload and continue. A well-written summary reads exactly like knowing; that is what makes continuing dangerous.\n\n' +
  'Report in one line to whoever started you: "I compacted. I\'m stopping. Please re-spin me fresh." If you work an authorized task, put that line on it as a note. ' +
  'If you are a subagent or a lane, that line is your final output. If you are top-level with Justin at your session, ping him: node ../_evryn-meta/scripts/ping.mjs "<Name>: I compacted. I\'m stopping. Please re-spin me fresh." Then stop. ' +
  '(If you were started by the scheduler, the watch stops this session within one cycle whether or not you do.)';

// SessionStart(compact) is the documented channel that puts text in front of a compacted agent (plain stdout).
if (event === 'SessionStart' && source === 'compact') {
  try { process.stdout.write('HOOK-DELIVERY-CANARY-7Q4X · vault SessionStart(compact) · ' + now().toISOString() + '\n\n' + STOP_TEXT + '\n'); } catch { /* ignore */ }
}
process.exit(0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
