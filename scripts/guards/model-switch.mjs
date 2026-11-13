#!/usr/bin/env node
// model-switch.mjs — the model-downgrade hook (task T-75; Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// REQUIREMENT (Justin's A4 ruling, 2026-11-12): keep the safety-flag fallback to a lesser model rather than
// stopping dead, and tell the session "you just went to a lesser model - do a full and fastidious #packout and ask
// to be re-spun." Survive Anthropic changing the default step-down model. A test FAILS without it
// (tests/model-switch.test.mjs).
//
// MECHANISM (Claude Code hooks docs, fetched raw 2026-11-13): PostModelSwitch runs after the session's model
// changes, including "an automatic model fallback," with source "auto"; its plain-text stdout reaches Claude "with
// the next request after the switch." So this keys on SOURCE, never on model names: any change Claude Code makes on
// its own is a downgrade we want packed out, whichever model it lands on. A user's own /model switch
// (command, picker, sdk) and a resume are left alone.
// Wired in managed-settings.json: { "PostModelSwitch": [ { "hooks": [ { "type": "command", "command": "node ...model-switch.mjs" } ] } ] }
// Env, tests only: EVRYN_MODEL_SWITCH_TRIGGER=<comma list of sources that count> (the live delivery test uses "command").

import { readStdin, guardLog } from './lib.mjs';

const { payload } = readStdin();
const triggers = (process.env.EVRYN_MODEL_SWITCH_TRIGGER || 'auto').split(',').map(s => s.trim());
try {
  if (payload.hook_event_name === 'PostModelSwitch' && triggers.includes(payload.source)) {
    const from = payload.from_model || 'your previous model', to = payload.to_model || 'a fallback model';
    guardLog({ guard: 'model-switch', event: 'downgraded', session: payload.session_id, from, to, source: payload.source });
    process.stdout.write(
      `🔴 MODEL DOWNGRADE: Claude Code just moved this session from ${from} to ${to} on its own (an automatic fallback, ` +
      `usually after a safety classifier flagged a request). Justin's ruling (A4, 2026-11-12): don't carry on as if nothing changed.\n\n` +
      `1. Finish only the tool call in hand; start nothing new.\n` +
      `2. Run a full #packout: read and execute _evryn-meta/docs/protocols/packout-protocol.md in full, every step, both fresh-eyes passes included.\n` +
      `3. If you work an authorized task, note on it: "model fallback ${from} -> ${to}; packed out; please re-spin." (tasks update T-<n> --note "..." --as <you>).\n` +
      `4. Ask to be re-spun: tell whoever started you (your Captain, the Admiral, or Justin if you're top-level and he's at your session) in one line, then stop.\n` +
      `Say in that line which models you moved between, so a re-spin can avoid whatever tripped the flag.\n`);
  }
} catch { /* this hook can't block anything; never throw */ }
process.exit(0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
