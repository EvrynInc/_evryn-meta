#!/usr/bin/env node
// secrets-guard.mjs — no unattended session reads the production keys file or the production database copies
// (Justin's guard Ballots 23 (a) and 23.3 (a), 2026-11-17; DCG-V, 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// REQUIREMENT: an unattended session MUST NOT read `evryn-backend/.env` (it holds production's database, mailbox,
// deploy and API keys) or `evryn-backend/backups/full-public-*.sql` (full copies of production's data), by the Read,
// Grep, Glob or NotebookEdit tools or by the obvious shell routes (cat, type, Get-Content, cp, a node or python
// one-liner). Enforced here, in a vaulted PreToolUse hook with onFailure "block"; tests/guards.test.mjs FAILS if any
// listed route gets through. An attended session (Justin at it) is left to the normal permission flow.
//
// WHAT IT CAN'T SEE (said plainly; design §6 is the same class): a classifier over command TEXT. A session that runs
// code which opens the file without naming it (the backend's own code loads `.env` through dotenv on start; a script
// that builds the name from pieces; a glob the patterns below don't list; an archive or a copy made earlier) gets
// through. The structural fixes are Ballot 23 (a)'s other half, Justin deleting the production lines from the file,
// and moving the copies off the machine (Ballot 23.3 (a)); this hook stops the honest and the steered-but-obvious paths.
// It never reads either file: it looks only at paths and command text.

import path from 'node:path';
import { readStdin, guardLog, preDeny, attended, normCmd, codeRoot } from './lib.mjs';

// Glob is left out on purpose: it returns names, never contents. Edit and Write are in: an unattended session has no
// business changing the keys file either.
const FILE_TOOLS = { Read: 'file_path', NotebookEdit: 'notebook_path', Grep: 'path', Edit: 'file_path', Write: 'file_path' };
const SHELL_TOOLS = ['Bash', 'PowerShell', 'Monitor'];

// A path (absolute or relative to cwd), flattened to lowercase with forward slashes.
const flat = (p, cwd) => path.resolve(cwd || codeRoot(), String(p || '')).replace(/\\/g, '/').toLowerCase();
const inBackend = p => /(^|\/)evryn-backend(\/|$)/.test(p);
// The two protected things, as path tests. `.env` exactly: `.env.example` and `.envrc` are not it.
const isEnvFile = p => /(^|\/)evryn-backend\/\.env$/.test(p);
const isDump = p => /(^|\/)evryn-backend\/backups\/full-public[^/]*\.sql$/.test(p) || /(^|\/)evryn-backend\/backups\/full-public/.test(p);

// Does a glob or path pattern name either thing? (Grep's `glob`, Glob's `pattern`.)
const globHits = (g, base) => {
  const s = String(g || '').toLowerCase().replace(/\\/g, '/');
  if (!s) return false;
  if (/full-public|\.sql\b|\*\.sq|backups\/\*/.test(s) && (inBackend(base) || /evryn-backend/.test(s))) return true;
  if (/(^|[/*{,])\.env(?![.\w-])|\.e\*|\.en\*|\*\.?env\b|\.\[e]|\*env\*/.test(s) && (inBackend(base) || /evryn-backend/.test(s))) return true;
  return false;
};

// Shell: does this command text reach for either thing? The `.env` test needs an evryn-backend context, from the text
// or from cwd, because other repos keep their own `.env` (ping.mjs reads the team workspace's, which is not this rule).
function shellHits(command, cwd) {
  const c = normCmd(command);
  const ctx = /evryn-backend/.test(c) || inBackend(String(cwd || '').replace(/\\/g, '/').toLowerCase());
  const hits = [];
  if (/full-public|backups\/\*|backups\/[^\s]*\.sql|backups\/\?/.test(c) || (/\bbackups\b/.test(c) && /\.sql|\*\.s/.test(c))) hits.push('a production database copy');
  if (ctx && (/(^|[\s/=:(,;|&<>])\.env(?![.\w-])/.test(c) || /\.e\*|\.en\*|\.env\?|\.\[e]|\.e\?\?|\*env\b|\.en\[v]/.test(c) || /\bdotenv\b|\benv-cmd\b/.test(c))) hits.push('the production keys file');
  return hits;
}

function check(p) {
  if (attended()) return null;                                          // Justin is at it: the normal permission flow
  const t = p.tool_name; const input = p.tool_input || {}; const cwd = p.cwd;
  let what = [];
  if (t in FILE_TOOLS) {
    const target = input[FILE_TOOLS[t]];
    const f = target ? flat(target, cwd) : flat('.', cwd);
    if (target && isEnvFile(f)) what.push('the production keys file');
    if (target && isDump(f)) what.push('a production database copy');
    if (t === 'Grep' && globHits(input.glob, f)) what.push('a protected file, by pattern');
    if (t === 'Grep' && /(^|\/)evryn-backend\/backups(\/|$)/.test(f)) what.push('a production database copy');   // a search of the whole folder
  } else if (SHELL_TOOLS.includes(t)) {
    what = shellHits(input.command, cwd);
  }
  if (!what.length) return null;
  guardLog({ guard: 'secrets', event: 'pre-deny', session: p.session_id, tool: t, what });
  return preDeny(`Secrets guard: an unattended session may not read or change ${[...new Set(what)].join(' or ')} (Justin's guard Ballots 23 and 23.3). This holds by any route. If your task truly needs it, stop and say so in your task's notes; Justin decides.`);
}

const { payload } = readStdin();
let out = null;
try { if (payload.hook_event_name === 'PreToolUse') out = check(payload); }
catch (e) {
  guardLog({ guard: 'secrets', event: 'ERROR', session: payload.session_id, error: String(e?.message || e).slice(0, 200) });
  if (!attended()) out = preDeny('Secrets guard: the guard hit an error, so this call is refused in an unattended session. Tell the Admiral.');
}
if (out) process.stdout.write(out);
process.exit(0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
