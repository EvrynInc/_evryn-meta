// lib.mjs — shared helpers for Evryn's vaulted guard hooks (Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// Design: evryn-team-workspace/shared/projects/helm/2026/2026.11.13-autonomy-guards-soren/2026.11.13-autonomy-guards-design.md
// In production these scripts run from the VAULT (C:\Program Files\ClaudeCode\evryn-guards\), copied there from a
// commit by approve-guards.cmd, and are wired by managed-settings.json, which no lower settings file can override.
// Every hook here MUST fail safe: a guard that throws must never let the guarded thing through.
//
// Env, for tests only:
//   EVRYN_GUARD_VAULT=<dir>     the vault folder (default: C:\Program Files\ClaudeCode\evryn-guards)
//   EVRYN_GUARD_DATA=<dir>      the per-user data folder (default: %LOCALAPPDATA%\evryn-guards)
//   EVRYN_GUARD_CODE_ROOT=<dir> the folder holding the Evryn repos (default: read from <vault>\config.json)
//   EVRYN_GUARD_NOW=<ISO>       a pretend clock

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// 🔴 Test overrides are IGNORED when this file runs from the vault (Fresh Soren's review, finding 7): any lower
// settings file's `env` can set an EVRYN_* variable, so an honored override in production is a way around every guard
// (point the counsel list at a harmless file, freeze the clock, silence the downgrade hook). Only a copy outside the
// vault, which is to say a test, reads them. tests/guards.test.mjs proves a vault-named copy ignores each one.
export const isVaultUrl = url => /^file:\/\/\/c:\/program%20files\/claudecode\//i.test(String(url));
export const IN_VAULT = isVaultUrl(import.meta.url);
export const env = name => (IN_VAULT ? undefined : process.env[name]);
export const now = () => (env('EVRYN_GUARD_NOW') ? new Date(env('EVRYN_GUARD_NOW')) : new Date());
export const VAULT = env('EVRYN_GUARD_VAULT') || 'C:\\Program Files\\ClaudeCode\\evryn-guards';
export const DATA = env('EVRYN_GUARD_DATA') || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'evryn-guards');

export function readStdin() {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch { /* none */ }
  let payload = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { _unparsed: true }; }
  return { raw, payload };
}

export function readJSON(f, dflt) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return dflt; } }

export function codeRoot() {
  if (env('EVRYN_GUARD_CODE_ROOT')) return env('EVRYN_GUARD_CODE_ROOT');
  const cfg = readJSON(path.join(VAULT, 'config.json'), {});
  return cfg.codeRoot || path.join(os.homedir(), 'Evryn', 'Code');
}

// One line per guard event, never message content: who, what, which ids. The watch and the daily brief read it.
export function guardLog(entry) {
  try {
    fs.mkdirSync(DATA, { recursive: true });
    fs.appendFileSync(path.join(DATA, 'guard-log.jsonl'), JSON.stringify({ at: now().toISOString(), ...entry }) + '\n');
  } catch { /* logging never throws */ }
}

export const safeName = s => String(s || 'unknown').replace(/[^A-Za-z0-9._-]/g, '_');

// ---------- the counsel list ----------
// The UNION of the vault's snapshot and the repo's live file (design §2.2): an agent can widen the guard by adding
// a lawyer to the repo file, never narrow it, because the vault copy changes only through Justin's approval.
// Entries are EVERY `backticked` address (has @) or domain in any cell of the list's table rows, whatever column it
// sits in: reordering the table must never empty the list (finding 6, probe E). An extra entry only widens the guard,
// which is the safe direction. A file that reads but yields NO entries counts as unreadable, so it fails closed.
export function parseCounsel(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    if (!/^\s*\|/.test(line)) continue;
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      const v = m[1].trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v) || /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(v)) out.push(v);
    }
  }
  return out;
}
export function loadCounsel() {
  const sources = [path.join(VAULT, 'counsel-list.md'), path.join(codeRoot(), 'evryn-team-workspace', 'shared', 'projects', 'legal', 'counsel-list.md')];
  const entries = new Set(); let readAny = false;
  for (const s of sources) {
    let got = [];
    try { got = parseCounsel(fs.readFileSync(s, 'utf8')); } catch { continue; }
    if (got.length) { got.forEach(e => entries.add(e)); readAny = true; }
    else guardLog({ guard: 'gmail', event: 'ERROR', error: `counsel list parsed to zero entries: ${s}` });
  }
  for (const e of (env('EVRYN_GUARD_EXTRA_COUNSEL') || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)) entries.add(e);
  return { entries: [...entries], readAny };
}

// Does this text mention a counsel address or domain anywhere? Case-insensitive. A domain matches itself and any
// subdomain, at a boundary, so "fenwick.com" matches "x@fenwick.com" and "mail.fenwick.com" but not "notfenwick.com".
export function counselHits(text, entries) {
  const t = String(text || '').toLowerCase();
  const hits = [];
  for (const e of entries) {
    const esc = e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tail = '(?![a-z0-9-]|\\.[a-z0-9])';           // not followed by more name: "fenwick.com." ends a sentence fine
    const re = e.includes('@') ? new RegExp(`(?<![a-z0-9._%+-])${esc}${tail}`) : new RegExp(`(?<![a-z0-9-])(?:[a-z0-9-]+\\.)*${esc}${tail}`);
    if (re.test(t)) hits.push(e);
  }
  return hits;
}

// A subagent's own transcript: did any turn run on a model other than the one requested? (Every assistant line records
// message.model and requestedModel; checked on a real transcript 2026-11-13, and across ~40 by the fresh reviewer.)
export function subagentFallback(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(x => x?.type === 'assistant' && x.message?.model);
  const asked = lines.find(x => x.requestedModel)?.requestedModel;
  const off = [...new Set(lines.filter(x => x.requestedModel && x.message.model !== x.requestedModel && x.message.model !== '<synthetic>').map(x => x.message.model))];
  return { asked, off };
}
export const fallbackLine = (asked, off) => `⚠️ Part of this work ran on ${off.join(', ')} after a safety fallback, not ${asked}. Review it as lesser-model work, or re-run it.`;

// Hook outputs.
export const preDeny = reason => JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } });
export const postContext = text => JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } });
export const preUpdate = input => JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', updatedInput: input } });
export const postReplace = (output, text) => JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', updatedToolOutput: output, ...(text ? { additionalContext: text } : {}) } });

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
