// controls.mjs — prove the guard tests can FAIL (Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// P4 (my definition): a check certifies only the failures it can see. So each guard check below is removed in turn,
// in a COPY of the scripts, and the test suite is re-run against the copy. Every control MUST fail at least one test;
// a control that passes means the tests are blind to that check. The originals are never touched.
// Run: node scripts/guards/tests/controls.mjs   (exit 0 only if every control failed the suite, and the clean copy passed)
// The suite is guards.test.mjs and vault.test.mjs together (since 2026-11-18).

import { execFileSync, execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, '..');
const CONTROLS = [
  ['gmail-guard.mjs', 'layer 1 removed (cleared or not, allow)', 'if (isCleared(l, id)) return null;', 'return null;'],
  ['gmail-guard.mjs', 'layer 2 removed', 'if (hits.length) {                                                    // layer 2', 'if (false) {                                                    // layer 2'],
  ['gmail-guard.mjs', 'search: partly-listed threads not redacted', 'const partial = (th.messageCount ?? msgs.length) > msgs.length;', 'const partial = false;'],
  ['gmail-guard.mjs', 'search: counsel threads not redacted', 'if (partial || counselHits(JSON.stringify(th), entries).length) {', 'if (partial) {'],
  ['gmail-guard.mjs', 'RAW allowed', "if (input.messageFormat === 'RAW')", 'if (false)'],
  ['gmail-guard.mjs', 'unreadable list: an old clearance is honored', 'if (!readAny) return preDeny(', 'if (false) return preDeny('],
  ['gmail-guard.mjs', 'unreadable list: a body arriving is shown', 'if (!readAny && body) return postReplace(', 'if (false) return postReplace('],
  ['gmail-guard.mjs', 'clearance never expires', 'now() - new Date(map[id]) < CLEAR_MINUTES * 60000', 'true'],
  ['gmail-guard.mjs', 'counsel threads cleared like any other', 'all.forEach(i => { l.counsel[i] = now().toISOString(); });', ';'],
  ['lib.mjs', 'repo copy of the list ignored (no union)', 'for (const s of sources)', 'for (const s of sources.slice(0, 1))'],
  ['lib.mjs', 'look-alike domains match', "new RegExp(`(?<![a-z0-9-])(?:[a-z0-9-]+\\\\.)*${esc}${tail}`)", "new RegExp(`(?:[a-z0-9-]+\\\\.)*${esc}${tail}`)"],
  ['model-switch.mjs', 'hook never fires', 'triggers.includes(payload.source)', 'false'],
  ['model-switch.mjs', 'fires on a user switch too', "(env('EVRYN_MODEL_SWITCH_TRIGGER') || 'auto')", "(env('EVRYN_MODEL_SWITCH_TRIGGER') || 'auto,command')"],
  ['gmail-guard.mjs', 'probe A: a threadId inside a message clears the thread', 'const own = [...new Set([input[BODY_TOOLS[t]], ...ownIdsIn(text)].filter(Boolean))];', 'const own = [...new Set([input[BODY_TOOLS[t]], ...idsIn(text)].filter(Boolean))];'],
  ['gmail-guard.mjs', 'probe B: attachments need only a metadata clearance', 'if (!l.counsel[id] && fresh(l.bodyChecked, id)) return null;', 'if (!l.counsel[id] && (fresh(l.bodyChecked, id) || fresh(l.cleared, id))) return null;'],
  ['gmail-guard.mjs', 'probe G: non-metadata hits only annotated', 'return metadataRead ? postContext(note) :', 'return true ? postContext(note) :'],
  ['gmail-guard.mjs', 'finding 8: unknown search shape passes', 'if (!Array.isArray(threads)) return null;', 'if (!Array.isArray(threads)) return { text, changed: 0 };'],
  ['lib.mjs', 'probe E: first column only', "for (const m of line.matchAll(/`([^`]+)`/g)) {", "for (const m of [line.match(/^\\|\\s*`([^`]+)`/)].filter(Boolean)) {"],
  ['lib.mjs', 'probe E: a list that parses to nothing still counts as read', 'if (got.length) { got.forEach(e => entries.add(e)); readAny = true; }', 'if (true) { got.forEach(e => entries.add(e)); readAny = true; }'],
  ['lib.mjs', 'finding 7: a look-alike path counts as the vault', 'export const isVaultUrl = url => /^file:\\/\\/\\/c:\\/program%20files\\/claudecode\\//i.test(String(url));', 'export const isVaultUrl = url => /program%20files/i.test(String(url));'],
  ['handback.mjs', 'finding 13: no disclosure in the handed-back report', 'if (asked && off.length) {', 'if (false) {'],
  ['subagent-model.mjs', 'subagent fallback never flagged', 'if (asked && off.length) {', 'if (false) {'],
  ['subagent-model.mjs', 'blocks again on the second stop (loop)', "&& !payload.stop_hook_active)", ')'],
  ['compaction.mjs', 'no marker for the watch', 'if (compactNow) {', 'if (false) {'],
  ['compaction.mjs', 'the summary gets logged', 'keys: Object.keys(payload) });', 'keys: Object.keys(payload), s: payload.compact_summary });'],
  // DCG-V, 2026-11-18: the secrets guard (Ballots 23, 23.3), the outbound gate (10.1), the browser guard and the config guard.
  ['lib.mjs', 'any value of the attended signal counts as attended', "process.env.CLAUDE_CODE_SESSION_ATTENDED === '1'", '!!process.env.CLAUDE_CODE_SESSION_ATTENDED'],
  ['secrets-guard.mjs', 'secrets guard off (attended or not)', 'if (attended()) return null;', 'if (true) return null;'],
  ['secrets-guard.mjs', 'the .env path check removed', 'if (target && isEnvFile(f))', 'if (false)'],
  ['secrets-guard.mjs', 'the production-copy path check removed', 'if (target && isDump(f))', 'if (false)'],
  ['secrets-guard.mjs', 'the shell routes not checked', 'what = shellHits(input.command, cwd);', 'what = [];'],
  ['secrets-guard.mjs', 'wildcard spellings of .env not caught', String.raw`/\.e\*|\.en\*|\.env\?|`, String.raw`/\.zzz|`],
  ['secrets-guard.mjs', 'dotenv runners not caught', String.raw`/\bdotenv\b|\benv-cmd\b/.test(t)`, 'false'],
  ['secrets-guard.mjs', 'a Grep of the whole backups folder not caught', "if (t === 'Grep' && under(f, 'backups'))", 'if (false)'],
  ['secrets-guard.mjs', 'a Grep glob naming .env not caught', "if (t === 'Grep' && globHits(input.glob, f))", 'if (false)'],
  ['outbound-gate.mjs', 'network words not checked', "const net = NETSET.has(p) || NETSET.has(String(prog).replace(/\\\\/g, '').toLowerCase().replace(/\\.exe$/, '')) ||", 'const net = false ||'],
  ['outbound-gate.mjs', 'command substitution can ride an allowlisted command', 'filter(w => substitutes ||', 'filter(w => false ||'],
  ['outbound-gate.mjs', 'scripts run by an interpreter not checked', 'if (NET_API.test(body) || NET.test(body))', 'if (false)'],
  ['outbound-gate.mjs', 'calendar guests not checked', 'if (g.length) why', 'if (false) why'],
  ['outbound-gate.mjs', 'attended sessions denied instead of asked', "if (attended() && ALLOW.attendedMode === 'ask')", 'if (false)'],
  ['outbound-gate.mjs', 'the attended-only list applies unattended', 'f.length && attended() && segments(', 'f.length && segments('],
  ['outbound-gate.mjs', 'a missing vault list still allows git', "attendedMode: 'deny', allow: [],", "attendedMode: 'deny', allow: [{ pattern: '^git' }],"],
  ['browser-guard.mjs', 'navigation to Gmail not checked', '.find(names);', '.find(() => false);'],
  ['browser-guard.mjs', 'an open Gmail tab\'s result not checked', 'if (!ADDRESS.test(text)) return null;', 'return null;'],
  ['browser-guard.mjs', 'a URL judged by its text, not its host', '.find(names);', '.find(s => HOSTS.test(s));'],
  ['config-guard.mjs', 'unattended settings changes allowed', "payload.hook_event_name === 'ConfigChange' && !attended() &&", "payload.hook_event_name === 'ConfigChange' && false &&"],
  ['config-guard.mjs', 'attended settings changes blocked too', "payload.hook_event_name === 'ConfigChange' && !attended() &&", "payload.hook_event_name === 'ConfigChange' &&"],
  // Ballot 5 (b): Justin's one-time opening of one counsel thread.
  ['gmail-guard.mjs', 'an opened thread is never honored', "if (t === 'get_thread' && claimGrant(", "if (false && claimGrant("],
  ['gmail-guard.mjs', 'an opening can be used twice', 'if (used) return false;', 'if (false) return false;'],
  ['gmail-guard.mjs', 'another session rides on the opening at layer 2', 'return !!used && used.session === session;', 'return !!used;'],
  ['gmail-guard.mjs', 'an expired opening still opens', 'if (!g || g.threadId !== id || !(now() < new Date(g.expiresAt))) return null;', 'if (!g || g.threadId !== id) return null;'],
  // The vault's own machinery (tests/vault.test.mjs).
  ['vault/approve-guards.mjs', 'the approver reads the working tree, not the commit', 'let { buf, oid } = readVerified(repos[repo], commits[repo], p);', "let { buf, oid } = { buf: fs.readFileSync(path.join(repos[repo], p)), oid: 'x' };"],
  ['vault/approve-guards.mjs', 'a staged file swapped after staging still installs', 'if (shaFile(path.join(fresh, name)) !== want) {', 'if (false) {'],
  ['vault/approve-guards.mjs', '"_" keys reach Claude Code', 'obj = stripUnderscore(obj);', 'obj = obj;'],
  ['vault/approve-guards.mjs', 'a missing source is not refused by name', 'if (!found) throw new Error(`REFUSED: ${p} is missing', 'if (false) throw new Error(`REFUSED: ${p} is missing'],
  ['vault/approve-guards.mjs', 'a hook outside the vault installs', "if (bad.length) throw new Error(`REFUSED: managed-settings", "if (false) throw new Error(`REFUSED: managed-settings"],
  ['vault/approve-guards.mjs', 'grants are lost on re-approval', "for (const k of KEEP) if (fs.existsSync(path.join(vault, k)))", 'for (const k of []) if (fs.existsSync(path.join(vault, k)))'],
  ['gate.mjs', 'the gate never compares hashes', 'if (got !== want) bad.push', 'if (false) bad.push'],
  ['gate.mjs', 'the gate writes no STOP', "fs.writeFileSync(path.join(STATE, 'STOP'), `Stopped by the vault gate", "void (`Stopped by the vault gate"],
  ['gate.mjs', 'the alarm runs a repo copy of the kill switch', "const runs = kill ? [[path.join(VAULT, 'kill-switch.mjs'), '--all']] : [];", "const runs = kill ? [[path.join(process.cwd(), 'kill-switch.mjs'), '--all']] : [];"],
  ['gate.mjs', 'a manifest may drop a required file', 'for (const r of REQUIRED) if (!(r in m.files))', 'for (const r of []) if (!(r in m.files))'],
  ['gate.mjs', 'a tampered kill switch is still run', 'if (bad.some(b => deps.some(d => b.startsWith(d + \' \')))) {', 'if (false) {'],
  // QCI fix trip (DCF, 2026-11-18). Several run the INSTALLED layout (a spaced vault path, the real launcher line), per
  // QCI note 15: the gate and approver path controls, the launcher-line controls, and the wrapper control.
  ['gate.mjs', 'QCI 1: the gate finds itself through URL.pathname (%20 under Program Files)', 'const HERE = path.dirname(fileURLToPath(import.meta.url));', String.raw`const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');`],
  ['vault/approve-guards.mjs', 'QCI 1: the approver finds itself through URL.pathname', 'const SELF = fileURLToPath(import.meta.url);', String.raw`const SELF = path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));`],
  ['vault/approve-guards.mjs', 'QCI 2: git honors replace refs', "export const GIT_ARGS = ['--no-replace-objects', '-c', 'core.useReplaceRefs=false'];", 'export const GIT_ARGS = [];', "GIT_NO_REPLACE_OBJECTS: '1', ", ''],
  ['vault/approve-guards.mjs', 'QCI 2: an object is not re-hashed against its id', 'if (objectId(type, buf, algoOf(oid)) !== oid) throw', 'if (false) throw'],
  ['vault/approve-guards.mjs', 'QCI 3: the launcher line does not clear NODE_OPTIONS (template and checker agree)', "export const CLEAR_NODE = 'set NODE_OPTIONS=&set NODE_PATH=&", "export const CLEAR_NODE = 'set NODE_PATH=&"],
  ['vault/managed-settings.template.json', 'QCI 3: the template\'s gmail hook skips the NODE_OPTIONS clear', '"NODE_OPTIONS=&set",', '"NODE_XOPTIONS=&set",'],
  ['vault/approve-guards.mjs', 'QCI 3: the stage half runs with NODE_OPTIONS set', 'if (process.env.NODE_OPTIONS || process.env.NODE_PATH) throw', 'if (false) throw'],
  ['vault/approve-guards.mjs', 'QCI 4: the wrapper runs a copy it never checked', 'if($got -ne $want){', 'if($false){'],
  ['vault/approve-guards.mjs', 'QCI 5: the vaulted webhook is not the team .env\'s', "write('webhook.json', { team: hook });", "write('webhook.json', { team: 'https://hooks.slack.com/x' });"],
  ['vault/approve-guards.mjs', 'QCI 5: the full webhook is printed', 'export const webhookHint = url => `${new URL(url).host} …${url.slice(-6)}`;', 'export const webhookHint = url => url;'],
  ['ping.mjs', 'QCI 5: the vault ping reads the team .env, not webhook.json', 'if (IN_VAULT) {', 'if (false) {'],
  ['gate.mjs', 'QCI 5: a failed alarm is recorded as delivered', 'tries: 1, delivered: status === 0 }));', 'tries: 1, delivered: true }));'],
  ['gate.mjs', 'QCI 5: a pre-written alarm record suppresses the first ping', 'const status = alarm(bad, log, { kill: true });', 'const status = readJSON(alarmFile, {}).delivered ? 0 : alarm(bad, log, { kill: true });'],
  ['gate.mjs', 'QCI 5: an undelivered alarm is retried every run, not hourly', '!(Date.now() - new Date(a.lastTry) < HOUR)', 'true'],
  ['gate.mjs', 'QCI 5: an undelivered alarm is never retried', '!(Date.now() - new Date(a.lastTry) < HOUR)', 'false'],
  ['gate.mjs', 'QCI note 16: managed-settings.json is not checked', "if (got && got !== m.managed) bad.push('managed-settings.json (changed)');", ';'],
  ['daily-report.mjs', 'QCI 5: the daily report hides STOP', '${fs.existsSync(stop) ?', '${false ?'],
  ['daily-report.mjs', 'QCI 13: the config guard\'s blocks get no line', 'out.push(configBlocks.length ?', 'out.push(false ?'],
  ['config-guard.mjs', 'QCI 13: a list of sources to block (a new source passes)', '!ALLOWED.includes(payload.source)', "['user_settings', 'project_settings', 'local_settings', 'skills'].includes(payload.source)"],
  ['browser-guard.mjs', 'QCI 10: only Claude in Chrome and the local built-in browser', 'const BROWSER = /^mcp__.*(claude-in-chrome|claude_browser|computer)/i;', 'const BROWSER = /^mcp__(claude-in-chrome|claude_browser)__/i;'],
  ['vault/managed-settings.template.json', 'QCI 10: the template matcher misses computer use', '"^mcp__.*(claude-in-chrome|Claude_Browser|computer)"', '"^mcp__(claude-in-chrome|Claude_Browser)__"'],
  ['gmail-guard.mjs', 'QCI 9: a session-bound opening is honored for any session', 'const boundElsewhere = (g, session) => !!g.sessionId && g.sessionId !== session;', 'const boundElsewhere = () => false;'],
  ['vault/approve-guards.mjs', 'QCI 9: the opening lasts 30 minutes', 'export const COUNSEL_MINUTES = 10;', 'export const COUNSEL_MINUTES = 30;'],
  ['vault/approve-guards.mjs', 'QCI 8: the claude floors may differ', "if (!floor || floor !== json['watch.json'].minClaudeVersion) throw", 'if (!floor) throw'],
  ['vault/approve-guards.mjs', 'QCI 8: an older claude is not refused', 'if (low.length) throw', 'if (false) throw'],
  ['lib.mjs', 'QCI 6: a client by full path (C:/…/curl.exe) not caught (the program name keeps its path)', ".replace(/\\\\/g, '/').split('/').pop().toLowerCase()", ".toLowerCase()"],
  ['outbound-gate.mjs', 'QCI 6: -ec is not an encoded command', String.raw`const ENCODED = /(^|\s)-e[a-z]*\s+[a-z0-9+/=]{16,}/;`, String.raw`const ENCODED = /(^|\s)-(e|en|enc|enco|encod|encode|encoded|encodedc|encodedcommand)\s+[a-z0-9+/=]{16,}/;`],
  ['outbound-gate.mjs', 'QCI 6: git settings that redirect or run commands not caught', 'if (GIT_RISK.test(cseg)) {', 'if (false) {'],
  ['vault/outbound-allowlist.json', 'QCI 6: any named remote is allowlisted for git push', '(origin|https://github', '([a-z]+|https://github'],
  ['outbound-gate.mjs', 'an imported network module (require(\'https\')) not counted', String.raw`const NET_API = /require\s*\(\s*['"]?(node:)?(https?|net|tls|dgram|undici)['"]?\s*\)|\bfrom\s+['"](node:)?(https?|net|tls|dgram)['"]|import\s*\(\s*['"](node:)?(https?|net|tls|dgram)['"]|fetch`, 'const NET_API = /fetch'],
  ['outbound-gate.mjs', 'QCI 6: preloaded files not checked', '[...openText.matchAll(PRELOAD)].map(m => m[5])', '[]'],
  ['outbound-gate.mjs', 'QCI 6: code piped into an interpreter not caught', 'if (open.length && STDIN_PIPE.test(c))', 'if (false)'],
  ['outbound-gate.mjs', 'QCI 6: a heredoc-written script run in the same command not caught', 'if (files.length && NET_API.test(c))', 'if (false)'],
  ['outbound-gate.mjs', 'QCI 6: a script that can\'t be read is allowed', "catch { body = 'fetch('; }   // can't read it: assume the worst", "catch { body = ''; }"],
  ['outbound-gate.mjs', 'QCI 12: URL openers not caught', "URL_OPENER.test(cseg.replace(/^\\S+/, p)) ||", 'false ||'],
  ['outbound-gate.mjs', 'QCI 12: PowerShell COM HTTP and Invoke-Expression not caught', "((powershell || p === 'powershell' || p === 'pwsh') && PS_RISK.test(cseg))", 'false', 'if (powershell && PS_RISK.test(c))', 'if (false)'],
  ['outbound-gate.mjs', 'calendar: an attendee spelled with a space slips through', 'Array.isArray(input?.attendees) ? input.attendees : []', '[]'],
  ['secrets-guard.mjs', 'QCI 7: no realpath (junctions and 8.3 names pass)', 'try { head = fs.realpathSync.native(head); }', 'try { void 0; }'],
  ['secrets-guard.mjs', 'QCI 7: stream suffixes and trailing dots kept', String.raw`x.replace(/:.*$/, '').replace(/[. ]+$/, '')`, 'x'],
  // The prefix stripping overlaps the name net (a path ending evryn-backend/.env), so one control removes both: it shows
  // the stripping is what catches \\?\ and \\localhost\C$\ when the name net doesn't.
  ['secrets-guard.mjs', 'QCI 7: \\\\?\\ and admin-share prefixes kept (and the name net off)', String.raw`s = s.replace(/^\/\/[?.]\/(unc\/)?/i`, String.raw`s = s.replace(/^NEVER/i`, String.raw` || /(^|\/)evryn-backend\/\.env$/.test(p);`, ';'],
  ['secrets-guard.mjs', 'QCI 7: recursive searches not caught', 'if (RECURSIVE.test(c))', 'if (false)'],
  ['secrets-guard.mjs', 'QCI 7: wildcards that expand to .env not caught', 'if (READER.test(c) && DOT_GLOB.test(c))', 'if (false)'],
  ['secrets-guard.mjs', 'QCI 7: copying or archiving the backend not caught', 'if (BULK.test(c))', 'if (false)'],
  ['secrets-guard.mjs', 'QCI 7: backslash escapes (.en\\v) not undone', 'for (const t of [c, u])', 'for (const t of [c])'],
  ['secrets-guard.mjs', 'QCI 7: backups globs not caught', String.raw`if (/\bbackups\/[^\s;|&]*[*?[]/.test(c)`, 'if (false'],
  ['secrets-guard.mjs', 'QCI 7: git history of backups not caught', String.raw`if (/\bgit\b[^;|&]*\b(log|show|diff|cat-file|archive|grep|blame|whatchanged)\b[^;|&]*\bbackups\b/.test(c))`, 'if (false)'],
  // QCR fix trip (DCF2, 2026-11-19).
  ['outbound-gate.mjs', 'QCR New 1: a pinned script trusted by its name, not its bytes', 'if (shaText(buf) !== want[r]) return false;', ';'],
  ['outbound-gate.mjs', 'QCR New 1: a pinned script\'s imports are not walked', 'for (const i of imps) todo.push(path.resolve(path.dirname(f), i));', ';'],
  ['outbound-gate.mjs', 'QCR New 1: a pinned entry that fails its pin falls to the generic check', 'if (s && !pinnedOk(s, cwd))', 'if (false)'],
  ['outbound-gate.mjs', 'QCR New 1: NODE_OPTIONS= in front of a command not caught', 'for (const e of env) if (RISKY_ENV.test(e))', 'for (const e of []) if (RISKY_ENV.test(e))'],
  ['vault/outbound-allowlist.json', 'QCR New 4: any path under the org (.. included) for git push', '[a-z0-9_][a-z0-9_.-]*)', '[a-z0-9._/-]+)'],
  ['outbound-gate.mjs', 'QCR New 5: a network word anywhere in a segment counts again', 'const net = NETSET.has(p) ||', 'const net = words.some(w => NETSET.has(progName(w))) || NETSET.has(p) ||'],
  ['outbound-gate.mjs', 'QCR New 5: wrappers (xargs, timeout, env) not looked through', 'if (WRAPPERS.has(p) && i + 1 < words.length', 'if (false && WRAPPERS.has(p) && i + 1 < words.length'],
  ['outbound-gate.mjs', 'QCR New 5: find -exec not checked', "if (/^-(exec|execdir|ok|okdir)$/.test(w)", 'if (false'],
  ['outbound-gate.mjs', 'QCR New 5: bash -c / cmd /c code not parsed again', 'if (SHELLS.has(p) && depth < 3) {', 'if (false) {'],
  ['outbound-gate.mjs', 'QCR New 5: a command name assembled at run time allowed', "if (prog.includes('$')) {", 'if (false) {'],
  ['secrets-guard.mjs', 'QCR New 6: recursive grep not checked', 'if (recursiveGrepHits(command, cwd))', 'if (false)'],
  ['secrets-guard.mjs', 'QCR New 6: any recursive grep path counts (the old over-block)', 'if (backend().some(b => b === f || b.startsWith(f.endsWith(\'/\') ? f : f + \'/\'))) return true;', 'return true;'],
  ['secrets-guard.mjs', 'QCR New 10: MultiEdit not guarded', "MultiEdit: 'file_path', ", ''],
  ['vault/managed-settings.template.json', 'QCR New 10: the template matcher misses MultiEdit', 'Read|Grep|Edit|MultiEdit|Write', 'Read|Grep|Edit|Write'],
  ['vault/approve-guards.mjs', 'QCR New 1: the approver does not walk a pinned script\'s imports', 'for (const r of rel) todo.push(path.posix.join(path.posix.dirname(p), r));', ';'],
  ['vault/approve-guards.mjs', 'QCR New 1: a pinned script importing a package is pinned anyway', 'if (bare.length) throw new Error(`REFUSED: pinned', 'if (false) throw new Error(`REFUSED: pinned'],
  ['vault/approve-guards.mjs', 'QCR New 3: the native installer copy (~/.local/bin) not checked', 'if (fs.existsSync(native)) files.add(native);', ';'],
  ['vault/approve-guards.mjs', 'QCR New 7: the stage folder is left behind', 'finally { fs.rmSync(stageDir, { recursive: true, force: true }); }', 'finally { }'],
  ['gate.mjs', 'QCR New 2: the kill switch\'s STOP does not stop another role', 'if (!bad.length && ks && fs.existsSync(ks))', 'if (false)'],
  ['gate.mjs', 'QCR New 6b: EVRYN_* variables reach the watch', " && !/^EVRYN_/i.test(k)", ''],
  ['lib.mjs', 'QCR New 6c: test overrides honored in the vault', 'export const env = name => (IN_VAULT ? undefined : process.env[name]);', 'export const env = name => process.env[name];'],
  ['lib.mjs', 'QCR New 6c: the vault does not find itself (hard-coded path)', 'IN_VAULT ? path.dirname(fileURLToPath(import.meta.url)) : ', ''],
];

// 🔴 Only a REPORTED test failure, in a run that executed EVERY test, counts as a control that worked. node counts a
// test file that crashes at load as one failing "test", so a crash would otherwise read as a working control (DCG-L's
// report §3 item 9). So each run's test count must equal the clean copy's; a different count, or no count, is a 'crash'.
let CLEAN_TESTS = null;
// Runs in parallel (CONTROLS_JOBS at a time, default 6): the vault suite takes about a minute, and there are ~110 controls.
const runSuite = dir => new Promise(res => execFile('node', ['--test', path.join(HERE, 'guards.test.mjs'), path.join(HERE, 'vault.test.mjs')], { env: { ...process.env, GUARD_DIR: dir }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => res({ out: String(stdout), status: err ? 'fail' : 'pass' })));
async function suite(dir) {
  const { out, status } = await runSuite(dir);
  const tests = Number((out.match(/ℹ tests (\d+)/) || [])[1]); const fail = Number((out.match(/ℹ fail (\d+)/) || [])[1]);
  if (!tests || (CLEAN_TESTS !== null && tests !== CLEAN_TESTS)) return `crash (${tests || 'no'} tests ran, clean copy ran ${CLEAN_TESTS ?? '?'})`;
  if (CLEAN_TESTS === null) CLEAN_TESTS = tests;
  return status === 'pass' ? 'pass' : fail > 0 ? `fail (${fail} tests)` : 'crash (non-zero exit, no failing test reported)';
}
// One control that crashes the suite on purpose (vault.test.mjs imports the approver at load), to prove it reads as a crash.
const CRASH_PROBE = ['vault/approve-guards.mjs', 'CRASH PROBE: the approver throws at import', 'const SELF = fileURLToPath(import.meta.url);', "const SELF = fileURLToPath(import.meta.url); throw new Error('controls crash probe');"];
function copy(mut) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'evryn-guards-control-'));
  for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.mjs'))) fs.copyFileSync(path.join(SRC, f), path.join(d, f));
  // The vault's own files too (2026-11-18): the approver and its config are tested by vault.test.mjs.
  fs.mkdirSync(path.join(d, 'vault')); for (const f of fs.readdirSync(path.join(SRC, 'vault'))) fs.copyFileSync(path.join(SRC, 'vault', f), path.join(d, 'vault', f));
  // And scripts/ping.mjs (2026-11-18, DCF): the vault test reads GUARD_DIR's copy, so its controls can mutate it.
  fs.copyFileSync(path.join(SRC, '..', 'ping.mjs'), path.join(d, 'ping.mjs'));
  if (mut) {
    // [file, label, from, to, from2, to2, …]: every pair is applied (a control may need two edits to remove one defense).
    const [file, , ...pairs] = mut; const p = path.join(d, file); let t = fs.readFileSync(p, 'utf8');
    for (let i = 0; i < pairs.length; i += 2) {
      if (!t.includes(pairs[i])) throw new Error(`control text not found in ${file}: ${pairs[i]}`);
      t = t.replace(pairs[i], pairs[i + 1]);
    }
    fs.writeFileSync(p, t);
    // A mutation that breaks the script's syntax fails every test for the wrong reason, and would hide a blind test
    // (found 2026-11-13: the first "layer 2 removed" control did exactly that). Such a control is itself broken.
    // A JSON file gets the JSON check instead (2026-11-18: the template and the allowlist have controls too).
    if (/\.json$/.test(file)) { try { JSON.parse(t); } catch { throw new Error(`BROKEN CONTROL (invalid JSON after mutation): ${file}: ${mut[1]}`); } }
    else try { execFileSync('node', ['--check', p], { stdio: 'pipe' }); } catch { throw new Error(`BROKEN CONTROL (syntax error after mutation): ${file}: ${mut[1]}`); }
  }
  return d;
}

let ok = true;
// Preflight: every control's text must be found and its mutation must pass its syntax check BEFORE the long run starts,
// so one stale control can't throw away half an hour of suite runs.
const broken = [CRASH_PROBE, ...CONTROLS].flatMap(c => { try { copy(c); return []; } catch (e) { return [String(e.message)]; } });
if (broken.length) { console.log(`REFUSED: ${broken.length} control(s) can't be applied:\n${broken.join('\n')}`); process.exit(1); }
const clean = await suite(copy(null));
console.log(`clean copy: ${clean} (${CLEAN_TESTS} tests)`);
if (clean !== 'pass') { console.log('REFUSED: the clean copy does not pass, so no control can mean anything. Fix the suite first.'); process.exit(1); }
// CONTROLS_ONLY=<regex> runs only the controls whose label matches (a quick re-check; a full run is the record).
const only = process.env.CONTROLS_ONLY ? new RegExp(process.env.CONTROLS_ONLY) : null;
const jobs = [{ c: CRASH_PROBE, probe: true }, ...CONTROLS.filter(c => !only || only.test(c[1])).map(c => ({ c }))];
const results = new Array(jobs.length); let next = 0;
await Promise.all(Array.from({ length: Number(process.env.CONTROLS_JOBS || 6) }, async () => { while (next < jobs.length) { const i = next++; results[i] = await suite(copy(jobs[i].c)); } }));
jobs.forEach(({ c, probe }, i) => {
  const r = results[i];
  if (probe) { console.log(`${r.startsWith('crash') ? '✔' : '✘'}  crash probe → ${r} (must read as a crash, never as a working control)`); if (!r.startsWith('crash')) ok = false; return; }
  const good = r.startsWith('fail');
  console.log(`${good ? '✔' : r.startsWith('crash') ? '✘ CRASH (proves nothing)' : '✘ BLIND'}  ${c[0]}: ${c[1]} → suite ${r}`);
  if (!good) ok = false;
});
console.log(ok ? 'ALL CONTROLS FAILED THE SUITE WITH A REPORTED FAILURE (good): the tests can see every check.' : 'SOME CONTROL PASSED OR CRASHED: the tests are blind to that check, or the control proves nothing.');
process.exit(ok ? 0 : 1);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
