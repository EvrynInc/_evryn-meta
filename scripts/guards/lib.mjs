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

export const now = () => (process.env.EVRYN_GUARD_NOW ? new Date(process.env.EVRYN_GUARD_NOW) : new Date());
export const VAULT = process.env.EVRYN_GUARD_VAULT || 'C:\\Program Files\\ClaudeCode\\evryn-guards';
export const DATA = process.env.EVRYN_GUARD_DATA || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'evryn-guards');

export function readStdin() {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch { /* none */ }
  let payload = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { _unparsed: true }; }
  return { raw, payload };
}

export function readJSON(f, dflt) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return dflt; } }

export function codeRoot() {
  if (process.env.EVRYN_GUARD_CODE_ROOT) return process.env.EVRYN_GUARD_CODE_ROOT;
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
// Entries are the first-column `backticked` values of the list's table: an address (has @) or a domain.
export function parseCounsel(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    const m = line.match(/^\|\s*`([^`]+)`/);
    if (!m) continue;
    const v = m[1].trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v) || /^[a-z0-9.-]+\.[a-z]{2,}$/.test(v)) out.push(v);
  }
  return out;
}
export function loadCounsel() {
  const sources = [path.join(VAULT, 'counsel-list.md'), path.join(codeRoot(), 'evryn-team-workspace', 'shared', 'projects', 'legal', 'counsel-list.md')];
  const entries = new Set(); let readAny = false;
  for (const s of sources) { try { parseCounsel(fs.readFileSync(s, 'utf8')).forEach(e => entries.add(e)); readAny = true; } catch { /* next */ } }
  for (const e of (process.env.EVRYN_GUARD_EXTRA_COUNSEL || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)) entries.add(e);
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

// Hook outputs.
export const preDeny = reason => JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } });
export const postContext = text => JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } });
export const postReplace = (output, text) => JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', updatedToolOutput: output, ...(text ? { additionalContext: text } : {}) } });

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
