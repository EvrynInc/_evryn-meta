// guards.test.mjs — tests for the vaulted guard hooks (Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// Run:      node --test scripts/guards/tests/guards.test.mjs
// Controls: node scripts/guards/tests/controls.mjs   (re-runs these tests against copies of the guards with each
//           check removed in turn; every control MUST make at least one test FAIL, or the test can't see that failure)
// No real mail is touched: every Gmail result here is a synthetic fixture shaped like the connector's real output
// (a JSON string; search: {threads:[{id,messageCount,messages:[{id,sender,toRecipients,subject,snippet,...}]}]}).
// GUARD_DIR=<dir> points the tests at another copy of the scripts (the controls use it).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const DIR = process.env.GUARD_DIR || path.resolve(HERE, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'evryn-guards-test-'));
const VAULT = path.join(tmp, 'vault'); const DATA = path.join(tmp, 'data'); const CODE = path.join(tmp, 'code');
fs.mkdirSync(VAULT, { recursive: true });
fs.mkdirSync(path.join(CODE, 'evryn-team-workspace', 'shared', 'projects', 'legal'), { recursive: true });
const LIST = '| Address or domain | Who |\n|---|---|\n| `fenwick.com` (the whole domain) | Fenwick |\n| `mark@tkntysonlaw.com` | Tyson |\n';
fs.writeFileSync(path.join(VAULT, 'counsel-list.md'), LIST);
fs.writeFileSync(path.join(CODE, 'evryn-team-workspace', 'shared', 'projects', 'legal', 'counsel-list.md'), '| `newlawyer.example` | added in the repo only |\n');

function run(script, payload, env = {}) {
  const out = execFileSync('node', [path.join(DIR, script)], { input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, EVRYN_GUARD_VAULT: VAULT, EVRYN_GUARD_DATA: DATA, EVRYN_GUARD_CODE_ROOT: CODE, ...env } });
  return out ? JSON.parse(out.startsWith('{') ? out : JSON.stringify({ text: out })) : null;
}
const G = 'mcp__claude_ai_Gmail__';
let n = 0; const sid = () => `test-session-${++n}`;
const pre = (s, tool, input) => run('gmail-guard.mjs', { hook_event_name: 'PreToolUse', session_id: s, tool_name: G + tool, tool_input: input });
const post = (s, tool, input, resp) => run('gmail-guard.mjs', { hook_event_name: 'PostToolUse', session_id: s, tool_name: G + tool, tool_input: input, tool_response: resp });
const denied = o => o?.hookSpecificOutput?.permissionDecision === 'deny';
const replaced = o => o?.hookSpecificOutput?.updatedToolOutput;
const BODY = 'PRIVILEGED-BODY-TEXT-do-not-show';
const thread = (id, sender, body = 'ordinary words') => JSON.stringify({ id, messageCount: 1, messages: [{ id: id + 'm1', threadId: id, sender, toRecipients: ['justin@evryn.ai'], subject: 'Re: things', date: '2026-10-01', plaintextBody: body, snippet: body.slice(0, 20) }] });
const meta = (id, sender) => JSON.stringify({ id, messageCount: 1, messages: [{ id: id + 'm1', threadId: id, sender, toRecipients: ['justin@evryn.ai'], date: '2026-10-01' }] });

test('a body read with no metadata read first is denied', () => {
  assert.ok(denied(pre(sid(), 'get_thread', { threadId: 'aaa111' })));
  assert.ok(denied(pre(sid(), 'get_message', { messageId: 'bbb111', messageFormat: 'PLAIN_TEXT' })));
  assert.ok(denied(pre(sid(), 'download_gmail_attachment', { messageId: 'ccc111' })));
});

test('RAW is always denied, even when cleared', () => {
  const s = sid(); post(s, 'get_message', { messageId: 'raw111', messageFormat: 'METADATA_ONLY' }, meta('raw111', 'friend@example.com'));
  assert.ok(denied(pre(s, 'get_message', { messageId: 'raw111', messageFormat: 'RAW' })));
});

test('a metadata read is always allowed', () => {
  assert.equal(pre(sid(), 'get_thread', { threadId: 'ddd111', messageFormat: 'METADATA_ONLY' }), null);
});

test('a non-counsel thread is cleared by a metadata read, then its body read goes through', () => {
  const s = sid();
  assert.equal(post(s, 'get_thread', { threadId: 'eee111', messageFormat: 'METADATA_ONLY' }, meta('eee111', 'friend@example.com')), null);
  assert.equal(pre(s, 'get_thread', { threadId: 'eee111' }), null);
  assert.equal(post(s, 'get_thread', { threadId: 'eee111' }, thread('eee111', 'friend@example.com')), null);
});

test('clearance is per session and expires after 15 minutes', () => {
  const s = sid(); post(s, 'get_thread', { threadId: 'fff111', messageFormat: 'METADATA_ONLY' }, meta('fff111', 'friend@example.com'));
  assert.ok(denied(pre(sid(), 'get_thread', { threadId: 'fff111' })), 'another session is not cleared');
  const later = new Date(Date.now() + 16 * 60000).toISOString();
  assert.ok(denied(run('gmail-guard.mjs', { hook_event_name: 'PreToolUse', session_id: s, tool_name: G + 'get_thread', tool_input: { threadId: 'fff111' } }, { EVRYN_GUARD_NOW: later })));
});

test('a counsel thread is never cleared, and its body read stays denied', () => {
  const s = sid();
  const o = post(s, 'get_thread', { threadId: 'ggg111', messageFormat: 'METADATA_ONLY' }, meta('ggg111', 'Partner <partner@fenwick.com>'));
  assert.match(o.hookSpecificOutput.additionalContext, /includes counsel/);
  assert.ok(denied(pre(s, 'get_thread', { threadId: 'ggg111' })));
});

test('layer 2: a counsel body that arrives anyway is replaced before the model sees it', () => {
  const o = post(sid(), 'get_thread', { threadId: 'hhh111' }, thread('hhh111', 'partner@fenwick.com', BODY));
  const r = replaced(o); assert.ok(r, 'result must be replaced');
  assert.ok(!JSON.stringify(r).includes(BODY), 'the body must not survive');
  assert.match(JSON.stringify(r), /WITHHELD/);
  assert.match(JSON.stringify(r), /Re: things/, 'subjects stay');
});

test('layer 2: a lawyer forwarded inside an ordinary thread is caught by its quoted address', () => {
  const fwd = `---------- Forwarded message ---------\nFrom: Partner <partner@fenwick.com>\n${BODY}`;
  const o = post(sid(), 'get_message', { messageId: 'iii111' }, thread('iii111', 'justin@evryn.ai', fwd));
  assert.ok(replaced(o) && !JSON.stringify(replaced(o)).includes(BODY));
});

test('layer 2: a subdomain and a listed address both match; a look-alike domain does not', () => {
  assert.ok(replaced(post(sid(), 'get_message', { messageId: 'jjj111' }, thread('jjj111', 'x@mail.fenwick.com', BODY))));
  assert.ok(replaced(post(sid(), 'get_message', { messageId: 'jjj222' }, thread('jjj222', 'Mark@TKNTysonLaw.com', BODY))));
  assert.equal(post(sid(), 'get_message', { messageId: 'jjj333' }, thread('jjj333', 'x@notfenwick.com')), null);
});

test('the list is the union: a lawyer added only in the repo is guarded too', () => {
  assert.ok(replaced(post(sid(), 'get_message', { messageId: 'kkk111' }, thread('kkk111', 'a@newlawyer.example', BODY))));
});

test('search: snippets are removed for counsel threads and for partly-listed threads; others are untouched', () => {
  const res = JSON.stringify({ threads: [
    { id: 't1', messageCount: 1, messages: [{ id: 'm1', sender: 'partner@fenwick.com', subject: 'S1', snippet: BODY }] },
    { id: 't2', messageCount: 9, messages: [{ id: 'm2', sender: 'friend@example.com', subject: 'S2', snippet: 'maybe quotes a lawyer' }] },
    { id: 't3', messageCount: 1, messages: [{ id: 'm3', sender: 'friend@example.com', subject: 'S3', snippet: 'fine to show' }] }] });
  const r = replaced(post(sid(), 'search_threads', { query: 'x' }, res)); assert.ok(r);
  const j = JSON.parse(typeof r === 'string' ? r : r[0].text);
  assert.ok(!('snippet' in j.threads[0].messages[0]) && !('snippet' in j.threads[1].messages[0]));
  assert.equal(j.threads[2].messages[0].snippet, 'fine to show');
  assert.equal(j.threads[0].messages[0].subject, 'S1');
});

test('fail closed: an unreadable counsel list denies body reads', () => {
  const env = { EVRYN_GUARD_VAULT: path.join(tmp, 'nowhere'), EVRYN_GUARD_CODE_ROOT: path.join(tmp, 'nowhere') };
  assert.ok(denied(run('gmail-guard.mjs', { hook_event_name: 'PreToolUse', session_id: sid(), tool_name: G + 'get_thread', tool_input: { threadId: 'lll111' } }, env)));
});

test('fail closed: a clearance made earlier is not honored once the list cannot be read', () => {
  const s = sid(); post(s, 'get_thread', { threadId: 'lll222', messageFormat: 'METADATA_ONLY' }, meta('lll222', 'friend@example.com'));
  const env = { EVRYN_GUARD_VAULT: path.join(tmp, 'nowhere'), EVRYN_GUARD_CODE_ROOT: path.join(tmp, 'nowhere') };
  assert.ok(denied(run('gmail-guard.mjs', { hook_event_name: 'PreToolUse', session_id: s, tool_name: G + 'get_thread', tool_input: { threadId: 'lll222' } }, env)));
});

test('fail closed: a body that arrives while the list cannot be read is withheld', () => {
  const env = { EVRYN_GUARD_VAULT: path.join(tmp, 'nowhere'), EVRYN_GUARD_CODE_ROOT: path.join(tmp, 'nowhere') };
  const o = run('gmail-guard.mjs', { hook_event_name: 'PostToolUse', session_id: sid(), tool_name: G + 'get_thread', tool_input: { threadId: 'lll333' }, tool_response: thread('lll333', 'partner@fenwick.com', BODY) }, env);
  assert.ok(replaced(o) && !JSON.stringify(replaced(o)).includes(BODY));
});

test('fail closed: an unparseable search result is withheld', () => {
  const r = replaced(post(sid(), 'search_threads', { query: 'x' }, 'not json ' + BODY)); assert.ok(r && !JSON.stringify(r).includes(BODY));
});

test('the content-block container shape is preserved', () => {
  const r = replaced(post(sid(), 'get_message', { messageId: 'mmm111' }, [{ type: 'text', text: thread('mmm111', 'partner@fenwick.com', BODY) }]));
  assert.ok(Array.isArray(r) && r[0].type === 'text' && !r[0].text.includes(BODY));
});

test('non-Gmail tools and non-body Gmail tools pass untouched', () => {
  assert.equal(run('gmail-guard.mjs', { hook_event_name: 'PreToolUse', session_id: sid(), tool_name: 'Read', tool_input: {} }), null);
  assert.equal(pre(sid(), 'list_labels', {}), null);
});

test('model switch: an automatic fallback produces the packout instruction and a log line', () => {
  const o = run('model-switch.mjs', { hook_event_name: 'PostModelSwitch', session_id: 'ms1', source: 'auto', from_model: 'claude-opus-5-5', to_model: 'claude-opus-4-8', requested_model: null });
  assert.match(o.text, /MODEL DOWNGRADE/); assert.match(o.text, /packout-protocol\.md/); assert.match(o.text, /claude-opus-4-8/);
  assert.match(fs.readFileSync(path.join(DATA, 'guard-log.jsonl'), 'utf8'), /"downgraded"/);
});

test('model switch: a switch the user asked for, or a resume, says nothing', () => {
  for (const source of ['command', 'picker', 'sdk', 'resume']) assert.equal(run('model-switch.mjs', { hook_event_name: 'PostModelSwitch', session_id: 'ms2', source, from_model: 'a', to_model: 'b' }), null);
});

test('model switch: keyed on source, not on model names (a future step-down model still triggers)', () => {
  assert.match(run('model-switch.mjs', { hook_event_name: 'PostModelSwitch', session_id: 'ms3', source: 'auto', from_model: 'claude-fable-9', to_model: 'claude-opus-7' }).text, /MODEL DOWNGRADE/);
});

test('compaction: SessionStart(compact) delivers the STOP text and leaves a marker the watch reads', () => {
  const o = run('compaction.mjs', { hook_event_name: 'SessionStart', source: 'compact', session_id: 'cs1', cwd: 'x' });
  assert.match(o.text, /HOOK-DELIVERY-CANARY-7Q4X/); assert.match(o.text, /STOP/);
  assert.ok(fs.existsSync(path.join(DATA, 'compacted', 'cs1')));
});

test('compaction: an ordinary session start says nothing and leaves no marker; the summary is never logged', () => {
  assert.equal(run('compaction.mjs', { hook_event_name: 'SessionStart', source: 'startup', session_id: 'cs2' }), null);
  assert.ok(!fs.existsSync(path.join(DATA, 'compacted', 'cs2')));
  run('compaction.mjs', { hook_event_name: 'PostCompact', session_id: 'cs3', compact_summary: 'SECRET-SUMMARY-TEXT' });
  assert.ok(!fs.readFileSync(path.join(DATA, 'guard-log.jsonl'), 'utf8').includes('SECRET-SUMMARY-TEXT'));
  assert.ok(fs.existsSync(path.join(DATA, 'compacted', 'cs3')));
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
