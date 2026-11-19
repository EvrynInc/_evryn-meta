#!/usr/bin/env node
// secrets-guard.mjs — no unattended session reads the production keys file or the production database copies
// (Justin's guard Ballots 23 (a) and 23.3 (a), 2026-11-17; DCG-V, 2026-11-18; QCI finding 7, DCF, 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// REQUIREMENT: an unattended session MUST NOT read `evryn-backend/.env` (it holds production's database, mailbox,
// deploy and API keys) or `evryn-backend/backups/full-public-*.sql` (full copies of production's data), by the Read,
// Grep, Edit, Write or NotebookEdit tools, by any Windows spelling of those paths (a trailing dot or space, a `:$DATA`
// stream suffix, an 8.3 short name, a junction, a `\\?\` or `\\localhost\C$\` prefix: each is canonicalized first), or
// by the obvious shell routes (cat, type, Get-Content, cp, a node or python one-liner, a wildcard that expands to .env,
// a recursive search, a copy or archive of the backend, git history of the backups folder). Enforced here, in a vaulted
// PreToolUse hook with onFailure "block"; tests/guards.test.mjs FAILS if any listed route gets through. An attended
// session (Justin at it) is left to the normal permission flow.
//
// 🔴 SAID PLAINLY, UNTIL JUSTIN'S STRUCTURAL FIXES LAND (Ballot 23 (a): the production lines out of the file; 23.3 (a):
// the copies off the machine): a recursive search or a program run in the backend can still read `.env`. This hook
// refuses the recursive readers it can name, but the backend's own code loads `.env` through dotenv whenever it starts
// (`npm test`, `npx tsx …`, any script under src/), and that can't be told apart from ordinary work by command text.
//
// WHAT IT CAN'T SEE (a classifier over command TEXT and path STRINGS; design §6 is the same class): code that opens the
// file without naming it (the dotenv case above; a script that builds the name from pieces; a glob or reader not listed
// below); copies made before this guard, or in another worktree or machine; a hard link made earlier (it shares no path
// with the original; realpath can't see it); an archive or a git object read by id rather than by path; another repo's
// .env (not in the ruling). It never reads either file: it looks only at paths and command text, and the only
// filesystem call it makes is realpath, which opens no file for reading.

import fs from 'node:fs';
import path from 'node:path';
import { readStdin, guardLog, preDeny, attended, normCmd, codeRoot } from './lib.mjs';

// Glob is left out on purpose: it returns names, never contents. Edit and Write are in: an unattended session has no
// business changing the keys file either.
const FILE_TOOLS = { Read: 'file_path', NotebookEdit: 'notebook_path', Grep: 'path', Edit: 'file_path', Write: 'file_path' };
const SHELL_TOOLS = ['Bash', 'PowerShell', 'Monitor'];

// ---------- canonical paths (QCI finding 7) ----------
// Windows reaches one file by many spellings. Undo each before comparing: the long-path and admin-share prefixes; a
// stream suffix (`.env::$DATA`); trailing dots and spaces on a name (Windows drops them); then realpath on the deepest
// part that exists, which expands 8.3 short names and resolves junctions and symlinks.
const lower = p => p.replace(/\\/g, '/').toLowerCase();
export function canon(p, cwd) {
  let s = String(p || '').replace(/\\/g, '/');
  s = s.replace(/^\/\/[?.]\/(unc\/)?/i, m => (/unc\/$/i.test(m) ? '//' : ''));            // \\?\C:\…, \\.\C:\…, \\?\UNC\…
  s = s.replace(/^\/\/(localhost|127\.0\.0\.1|\[?::1\]?|[^/]+)\/([a-z])\$\//i, '$2:/');      // \\host\C$\… → C:/…
  let abs = path.resolve(cwd || codeRoot(), s);
  const [root, ...segs] = abs.split(/[\\/]/);
  const clean = segs.map(x => x.replace(/:.*$/, '').replace(/[. ]+$/, '')).filter(x => x !== '');
  abs = [root, ...clean].join('\\');
  let head = abs, tail = [];
  while (head && !fs.existsSync(head)) { const up = path.dirname(head); if (up === head) break; tail.unshift(path.basename(head)); head = up; }
  try { head = fs.realpathSync.native(head); } catch { /* keep it as written */ }
  return lower(path.join(head, ...tail));
}
let backendCache = null;
function backend() {
  if (backendCache) return backendCache;
  const b = path.join(codeRoot(), 'evryn-backend');
  let real = b; try { real = fs.realpathSync.native(b); } catch { /* not present: compare as written */ }
  return (backendCache = [...new Set([lower(b), lower(real)])]);
}
const under = (p, rel) => backend().some(b => p === `${b}/${rel}` || p.startsWith(`${b}/${rel}/`)) || new RegExp(`(^|/)evryn-backend/${rel}(/|$)`).test(p);
// The code root's backend, by its real path; and, as a second net, any folder NAMED evryn-backend (another clone).
const isEnvFile = p => backend().some(b => p === `${b}/.env`) || /(^|\/)evryn-backend\/\.env$/.test(p);
const isDump = p => backend().some(b => p.startsWith(`${b}/backups/full-public`)) || /(^|\/)evryn-backend\/backups\/full-public/.test(p);
const inBackend = p => backend().some(b => p === b || p.startsWith(`${b}/`)) || /(^|\/)evryn-backend(\/|$)/.test(p);

// Does a glob or path pattern name either thing? (Grep's `glob`.)
const globHits = (g, base) => {
  const s = lower(String(g || ''));
  if (!s) return false;
  if (/full|\.sql\b|\*\.sq|backups\/\*/.test(s) && (inBackend(base) || /evryn-backend/.test(s))) return true;
  if (/(^|[/*{,])\.env(?![.\w-])|\.e\*|\.en\*|\*\.?env\b|\.\[e]|\*env\*|^\.\*|\/\.\*/.test(s) && (inBackend(base) || /evryn-backend/.test(s))) return true;
  return false;
};

// ---------- the shell routes ----------
// Readers of file content, for the wildcard rule below.
const READER = /(^|[\s;|&(])(cat|type|head|tail|less|more|gc|get-content|bat|strings|xxd|od|sed|awk|cut|sort|uniq|wc|base64|nl|tac|grep|findstr|sls|select-string|cp|copy|copy-item|mv|move|tee|diff|cmp)(\.exe)?\s/;
// A dot-name with a wildcard in its first few characters can expand to .env: `.*`, `.e?v`, `.?nv`, `.e*`, `.[e]nv`.
const DOT_GLOB = /(^|[\s/=])\.[a-z]{0,3}[?*[]/;
// Recursive readers: they read every file, .env included (QCI finding 7).
const RECURSIVE = /(^|[\s;|&(])(grep|egrep|fgrep)\b[^;|&]*\s-[a-z]*[rr]|(^|[\s;|&(])grep\b[^;|&]*--recursive|(^|[\s;|&(])rg\b[^;|&]*(\s-u|--hidden|--no-ignore|-uu)|(^|[\s;|&(])findstr\b[^;|&]*\s\/s|(select-string|sls)\b[^;|&]*-r(ecurse)?\b|(get-childitem|gci|dir|ls)\b[^;|&]*\s-(r|recurse|fo|force)\b[^;]*\|\s*(get-content|gc|cat|type|select-string|sls)|(get-content|gc)\s*\(\s*(get-childitem|gci|dir|ls)\b/;
// Copying or archiving the whole backend moves .env somewhere the path rules can't follow.
const BULK = /(^|[\s;|&(])(cp|copy-item|xcopy|robocopy|rsync|tar|zip|7z|compress-archive)\b[^;|&]*\s(-[a-z]*r[a-z]*\s+)?(\.|\.\/|\*)(\s|$)|(^|[\s;|&(])(xcopy|robocopy|compress-archive)\b/;

// Shell: does this command text reach for either thing? The `.env` test needs an evryn-backend context, from the text
// or from cwd, because other repos keep their own `.env` (ping.mjs reads the team workspace's, which is not this rule).
function shellHits(command, cwd) {
  const c = normCmd(command);
  // `.en\v` is `.env` to bash, but normCmd turns the backslash into a slash: so also test with backslashes REMOVED.
  const u = String(command || '').toLowerCase().replace(/["'`^]/g, '').replace(/\\/g, '');
  const ctx = /evryn-backend/.test(c) || inBackend(lower(String(cwd || '')));
  const hits = [];
  if (/full-public|backups\/\*|backups\/[^\s]*\.sql|backups\/\?/.test(c) || (/\bbackups\b/.test(c) && /\.sql|\*\.s/.test(c))) hits.push('a production database copy');
  if (/\bbackups\/[^\s;|&]*[*?[]/.test(c) && (ctx || /evryn-backend/.test(c))) hits.push('a production database copy');
  if (/\bgit\b[^;|&]*\b(log|show|diff|cat-file|archive|grep|blame|whatchanged)\b[^;|&]*\bbackups\b/.test(c)) hits.push('a production database copy, from git history');
  if (ctx) {
    for (const t of [c, u]) if (/(^|[\s/=:(,;|&<>])\.env(?![.\w-])/.test(t) || /\.e\*|\.en\*|\.env\?|\.\[e]|\.e\?\?|\*env\b|\.en\[v]/.test(t) || /\bdotenv\b|\benv-cmd\b/.test(t)) { hits.push('the production keys file'); break; }
    if (READER.test(c) && DOT_GLOB.test(c)) hits.push('the production keys file, by a wildcard');
    if (RECURSIVE.test(c)) hits.push('the production keys file, by a recursive search');
    if (BULK.test(c)) hits.push('the production keys file, by copying or archiving the backend');
  }
  return hits;
}

function check(p) {
  if (attended()) return null;                                          // Justin is at it: the normal permission flow
  const t = p.tool_name; const input = p.tool_input || {}; const cwd = p.cwd;
  let what = [];
  if (t in FILE_TOOLS) {
    const target = input[FILE_TOOLS[t]];
    const f = canon(target || '.', cwd);
    if (target && isEnvFile(f)) what.push('the production keys file');
    if (target && isDump(f)) what.push('a production database copy');
    if (t === 'Grep' && globHits(input.glob, f)) what.push('a protected file, by pattern');
    if (t === 'Grep' && under(f, 'backups')) what.push('a production database copy');   // a search of the whole folder
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
