// controls.mjs — prove the guard tests can FAIL (Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// P4 (my definition): a check certifies only the failures it can see. So each guard check below is removed in turn,
// in a COPY of the scripts, and the test suite is re-run against the copy. Every control MUST fail at least one test;
// a control that passes means the tests are blind to that check. The originals are never touched.
// Run: node scripts/guards/tests/controls.mjs   (exit 0 only if every control failed the suite, and the clean copy passed)

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
];

function suite(dir) {
  try { execFileSync('node', ['--test', path.join(HERE, 'guards.test.mjs')], { env: { ...process.env, GUARD_DIR: dir }, stdio: 'pipe', encoding: 'utf8' }); return 'pass'; }
  catch (e) { const m = String(e.stdout).match(/ℹ fail (\d+)/); return `fail (${m ? m[1] : '?'} tests)`; }
}
function copy(mut) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'evryn-guards-control-'));
  for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.mjs'))) fs.copyFileSync(path.join(SRC, f), path.join(d, f));
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
