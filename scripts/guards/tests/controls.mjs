// controls.mjs — prove the guard tests can FAIL (Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// P4 (my definition): a check certifies only the failures it can see. So each guard check below is removed in turn,
// in a COPY of the scripts, and the test suite is re-run against the copy. Every control MUST fail at least one test;
// a control that passes means the tests are blind to that check. The originals are never touched.
// Run: node scripts/guards/tests/controls.mjs   (exit 0 only if every control failed the suite, and the clean copy passed)
// The suite is guards.test.mjs and vault.test.mjs together (since 2026-11-18).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
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
  ['secrets-guard.mjs', 'dotenv runners not caught', String.raw`/\bdotenv\b|\benv-cmd\b/.test(c)`, 'false'],
  ['secrets-guard.mjs', 'a Grep of the whole backups folder not caught', "if (t === 'Grep' && /(^|\\/)evryn-backend\\/backups(\\/|$)/.test(f))", 'if (false)'],
  ['secrets-guard.mjs', 'a Grep glob naming .env not caught', "if (t === 'Grep' && globHits(input.glob, f))", 'if (false)'],
  ['outbound-gate.mjs', 'network words not checked', 'const net = NET.test(seg) ||', 'const net = false ||'],
  ['outbound-gate.mjs', 'command substitution can ride an allowlisted command', 'if (net && (substitutes ||', 'if (net && (false ||'],
  ['outbound-gate.mjs', 'scripts the session wrote not checked', 'if (NET_API.test(body) || NET.test(body))', 'if (false)'],
  ['outbound-gate.mjs', 'calendar guests not checked', 'if (g.length) why', 'if (false) why'],
  ['outbound-gate.mjs', 'attended sessions denied instead of asked', "if (attended() && ALLOW.attendedMode === 'ask')", 'if (false)'],
  ['outbound-gate.mjs', 'the attended-only list applies unattended', 'f.length && attended() && f.every(', 'f.length && f.every('],
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
  ['vault/approve-guards.mjs', 'the approver reads the working tree, not the commit', "try { buf = git(repos[repo], ['show', `${commits[repo]}:${p}`]); }", 'try { buf = fs.readFileSync(path.join(repos[repo], p)); }'],
  ['vault/approve-guards.mjs', 'a staged file swapped after staging still installs', 'if (shaFile(path.join(fresh, name)) !== want) {', 'if (false) {'],
  ['vault/approve-guards.mjs', '"_" keys reach Claude Code', 'obj = stripUnderscore(obj);', 'obj = obj;'],
  ['vault/approve-guards.mjs', 'a missing source installs silently', "catch { throw new Error(`REFUSED: ${p} is missing", "catch { buf = Buffer.from(''); if (0) throw new Error(`REFUSED: ${p} is missing"],
  ['vault/approve-guards.mjs', 'a hook outside the vault installs', "if (bad.length) throw new Error(`REFUSED: managed-settings", "if (false) throw new Error(`REFUSED: managed-settings"],
  ['vault/approve-guards.mjs', 'the launcher is left out of the vault (DCG-L)', "...['launcher.mjs', 'auth-check.mjs', 'start-task-session.mjs', 'approval.mjs', 'task-source.mjs'].map(", '...[].map('],
  ['vault/approve-guards.mjs', "the task tool's modules are left out of the vault (DCG-L)", "['tasks-config.mjs', 'meta', 'scripts/tasks/lib/config.mjs'],", ''],
  ['vault/approve-guards.mjs', 'grants are lost on re-approval', "for (const k of KEEP) if (fs.existsSync(path.join(vault, k)))", 'for (const k of []) if (fs.existsSync(path.join(vault, k)))'],
  ['gate.mjs', 'the gate never compares hashes', 'if (got !== want) bad.push', 'if (false) bad.push'],
  ['gate.mjs', 'the gate writes no STOP', "fs.writeFileSync(path.join(STATE, 'STOP'), `Stopped by the vault gate", "void (`Stopped by the vault gate"],
  ['gate.mjs', 'the alarm runs a repo copy of the kill switch', "const runs = [[path.join(VAULT, 'kill-switch.mjs'), '--all']];", "const runs = [[path.join(process.cwd(), 'kill-switch.mjs'), '--all']];"],
  ['gate.mjs', 'a manifest may drop a required file', 'for (const r of REQUIRED) if (!(r in m.files))', 'for (const r of []) if (!(r in m.files))'],
  ['gate.mjs', 'a tampered kill switch is still run', 'if (bad.some(b => deps.some(d => b.startsWith(d + \' \')))) {', 'if (false) {'],
  ['gate.mjs', 'the same mismatch pings every run', 'if (!told) runs.push(', 'if (true) runs.push('],
];

function suite(dir) {
  try { execFileSync('node', ['--test', path.join(HERE, 'guards.test.mjs'), path.join(HERE, 'vault.test.mjs')], { env: { ...process.env, GUARD_DIR: dir }, stdio: 'pipe', encoding: 'utf8' }); return 'pass'; }
  catch (e) { const m = String(e.stdout).match(/ℹ fail (\d+)/); return `fail (${m ? m[1] : '?'} tests)`; }
}
function copy(mut) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'evryn-guards-control-'));
  for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.mjs'))) fs.copyFileSync(path.join(SRC, f), path.join(d, f));
  // The vault's own files too (2026-11-18): the approver and its config are tested by vault.test.mjs.
  fs.mkdirSync(path.join(d, 'vault')); for (const f of fs.readdirSync(path.join(SRC, 'vault'))) fs.copyFileSync(path.join(SRC, 'vault', f), path.join(d, 'vault', f));
  if (mut) {
    const [file, , from, to] = mut; const p = path.join(d, file); const t = fs.readFileSync(p, 'utf8');
    if (!t.includes(from)) throw new Error(`control text not found in ${file}: ${from}`);
    fs.writeFileSync(p, t.replace(from, to));
    // A mutation that breaks the script's syntax fails every test for the wrong reason, and would hide a blind test
    // (found 2026-11-13: the first "layer 2 removed" control did exactly that). Such a control is itself broken.
    try { execFileSync('node', ['--check', p], { stdio: 'pipe' }); } catch { throw new Error(`BROKEN CONTROL (syntax error after mutation): ${file}: ${mut[1]}`); }
  }
  return d;
}

let ok = true;
const clean = suite(copy(null));
console.log(`clean copy: ${clean}`); if (clean !== 'pass') ok = false;
for (const c of CONTROLS) {
  const r = suite(copy(c));
  const good = r.startsWith('fail');
  console.log(`${good ? '✔' : '✘ BLIND'}  ${c[0]}: ${c[1]} → suite ${r}`);
  if (!good) ok = false;
}
console.log(ok ? 'ALL CONTROLS FAILED THE SUITE (good): the tests can see every check.' : 'SOME CONTROL PASSED: the tests are blind to that check.');
process.exit(ok ? 0 : 1);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
