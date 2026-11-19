#!/usr/bin/env node
// config-guard.mjs — an unattended session keeps the settings it started with (review finding 5; build brief 1's revised
// block item 5; DCG-V, 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// REQUIREMENT: in an unattended session, a mid-session change to any settings source but managed policy (user, project
// or local settings, skills, and any source Claude Code adds later) MUST NOT take effect. Claude Code applies most settings edits to a running session at once, permissions and hooks
// included (settings docs, line 178), so without this an unattended session could widen its own permissions or set an
// `env` variable and have it count in the next tool call. A ConfigChange hook that answers `decision: "block"` keeps the
// new settings out of the running session (hooks docs, "ConfigChange decision control"). The brief asked for `env` and
// `permissions` changes; this blocks EVERY change to those files in an unattended session, because the hook is told
// only which file changed, not which keys, and an unattended session has no reason to change its own settings at all.
// tests/guards.test.mjs FAILS if an unattended change gets through, or an attended one is blocked.
//
// WHAT IT CAN'T SEE: a change to managed settings (policy_settings can't be blocked, by design: the docs say so, and it
// only matters to whoever can write the vault, which takes Justin's UAC yes); rules saved through "Yes, and don't ask
// again" or /permissions in the session that saved them (they skip the hook, per the docs; an unattended session has
// nobody to click them); the file on disk, which still changes and binds the NEXT session that starts (that's what the
// daily report's watch on settings files is for); a ConfigChange hook that crashes (onFailure "block" is set, but the
// docs don't say whether "block" on ConfigChange keeps the change out, so treat a crash as unverified).

import { readStdin, guardLog, attended } from './lib.mjs';

// Everything but managed policy is blocked (QCI finding 13): a list of what to block would let through any source Claude
// Code adds later (a made-up "plugin_settings" passed the old list). policy_settings can't be blocked anyway (docs).
// The block is SILENT to the session (hooks docs: "A blocked change surfaces no message to you or to Claude"), so the
// daily report gives these blocks their own line, and the standing orders should say settings and skill edits take
// effect only in the next session.
const ALLOWED = ['policy_settings'];
const { payload } = readStdin();
let out = null;
try {
  if (payload.hook_event_name === 'ConfigChange' && !attended() && !ALLOWED.includes(payload.source)) {
    guardLog({ guard: 'config', event: 'blocked', session: payload.session_id, source: payload.source, file: payload.file_path || null });
    out = JSON.stringify({ decision: 'block', reason: 'An unattended session keeps the settings it started with (vault config guard).' });
  }
} catch (e) {
  guardLog({ guard: 'config', event: 'ERROR', session: payload.session_id, error: String(e?.message || e).slice(0, 200) });
  if (!attended()) out = JSON.stringify({ decision: 'block', reason: 'config guard error' });
}
if (out) process.stdout.write(out);
process.exit(0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
