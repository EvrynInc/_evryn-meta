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

test('a thread cleared earlier is closed again when a later metadata read shows a lawyer replied', () => {
  const s = sid();
  post(s, 'get_thread', { threadId: 'rr1', messageFormat: 'METADATA_ONLY' }, meta('rr1', 'friend@example.com'));
  assert.equal(pre(s, 'get_thread', { threadId: 'rr1' }), null);
  post(s, 'get_thread', { threadId: 'rr1', messageFormat: 'METADATA_ONLY' }, JSON.stringify({ id: 'rr1', messageCount: 2, messages: [{ id: 'rr1m1', sender: 'friend@example.com' }, { id: 'rr1m2', sender: 'partner@fenwick.com' }] }));
  assert.ok(denied(pre(s, 'get_thread', { threadId: 'rr1' })));
});

test('review probe A: a message metadata read that names its thread does not clear the thread', () => {
  const s = sid();
  post(s, 'get_message', { messageId: 'pa1msg', messageFormat: 'METADATA_ONLY' }, JSON.stringify({ id: 'pa1msg', threadId: 'pa1thread', sender: 'friend@example.com', date: 'd' }));
  assert.ok(denied(pre(s, 'get_thread', { threadId: 'pa1thread' })), 'the thread was never checked');
  assert.equal(pre(s, 'get_message', { messageId: 'pa1msg' }), null, 'the message itself was checked');
});

test('review probe B: an attachment needs a clean body read of its message first', () => {
  const s = sid();
  post(s, 'get_message', { messageId: 'pb1msg', messageFormat: 'METADATA_ONLY' }, meta('pb1msg', 'justin@evryn.ai').replace('"id":"pb1msgm1"', '"id":"pb1msg"'));
  assert.ok(denied(pre(s, 'download_gmail_attachment', { messageId: 'pb1msg', attachmentId: 'x' })), 'a metadata read alone is not enough');
  post(s, 'get_message', { messageId: 'pb1msg' }, thread('pb1msg', 'justin@evryn.ai', 'here is the file'));
  assert.equal(pre(s, 'download_gmail_attachment', { messageId: 'pb1msg', attachmentId: 'x' }), null, 'after a clean body read it is allowed');
  const s2 = sid();
  post(s2, 'get_message', { messageId: 'pb2msg' }, thread('pb2msg', 'justin@evryn.ai', 'Forwarded message From: partner@fenwick.com'));
  assert.ok(denied(pre(s2, 'download_gmail_attachment', { messageId: 'pb2msg', attachmentId: 'x' })), 'a forward of a lawyer never clears its attachment');
});

test('review probe E: a reordered counsel table still guards; one that parses to nothing fails closed', () => {
  const v = path.join(tmp, 'vault-reordered'); fs.mkdirSync(v, { recursive: true });
  fs.writeFileSync(path.join(v, 'counsel-list.md'), '| Who | Address |\n|---|---|\n| Fenwick | `fenwick.com` |\n');
  const env = { EVRYN_GUARD_VAULT: v };   // the repo copy (another lawyer) still reads, so only the reordered table stands between Fenwick and the model
  const o = run('gmail-guard.mjs', { hook_event_name: 'PostToolUse', session_id: sid(), tool_name: G + 'get_thread', tool_input: { threadId: 'pe1' }, tool_response: thread('pe1', 'partner@fenwick.com', BODY) }, env);
  assert.ok(replaced(o) && !JSON.stringify(replaced(o)).includes(BODY));
  const v2 = path.join(tmp, 'vault-empty'); fs.mkdirSync(v2, { recursive: true });
  fs.writeFileSync(path.join(v2, 'counsel-list.md'), '# a list with no table\nfenwick.com\n');
  const env2 = { EVRYN_GUARD_VAULT: v2, EVRYN_GUARD_CODE_ROOT: path.join(tmp, 'nowhere') };
  assert.ok(denied(run('gmail-guard.mjs', { hook_event_name: 'PreToolUse', session_id: sid(), tool_name: G + 'get_thread', tool_input: { threadId: 'pe2' } }, env2)));
  const o2 = run('gmail-guard.mjs', { hook_event_name: 'PostToolUse', session_id: sid(), tool_name: G + 'get_thread', tool_input: { threadId: 'pe3' }, tool_response: thread('pe3', 'partner@fenwick.com', BODY) }, env2);
  assert.ok(replaced(o2) && !JSON.stringify(replaced(o2)).includes(BODY), 'a body arriving while the list parses to nothing is withheld');
});

test('review probe G: a non-metadata tool that echoes counsel text is replaced, not just annotated', () => {
  const o = post(sid(), 'label_thread', { threadId: 'pg1' }, thread('pg1', 'partner@fenwick.com', BODY));
  assert.ok(replaced(o) && !JSON.stringify(replaced(o)).includes(BODY));
});

test('review finding 8: a search result in an unknown shape is withheld; an empty one passes', () => {
  const r = replaced(post(sid(), 'search_threads', { query: 'x' }, JSON.stringify({ results: [{ snippet: BODY }] })));
  assert.ok(r && !JSON.stringify(r).includes(BODY));
  assert.equal(post(sid(), 'search_threads', { query: 'x' }, '{}'), null);
});

test('review finding 7: only the vault path counts as the vault, so test overrides are ignored there', async () => {
  const { isVaultUrl } = await import(new URL('file:///' + path.join(DIR, 'lib.mjs').replace(/\\/g, '/')).href);
  assert.ok(isVaultUrl('file:///C:/Program%20Files/ClaudeCode/evryn-guards/lib.mjs'));
  assert.ok(isVaultUrl('file:///c:/program%20files/claudecode/evryn-guards/lib.mjs'));
  assert.ok(!isVaultUrl('file:///C:/Program%20Files%20(x86)/ClaudeCode/evryn-guards/lib.mjs'));
  assert.ok(!isVaultUrl('file:///C:/Users/jbmcg/Evryn/Code/_evryn-meta/scripts/guards/lib.mjs'));
});

test('review finding 13: the handback hook writes the disclosure into the report itself', () => {
  const proj = path.join(tmp, 'proj'); const sess = 'sess-hb'; const subdir = path.join(proj, sess, 'subagents'); fs.mkdirSync(subdir, { recursive: true });
  const mk = (id, turns) => fs.writeFileSync(path.join(subdir, `agent-${id}.jsonl`), turns.map(([s, a]) => JSON.stringify({ type: 'assistant', requestedModel: a, message: { model: s } })).join('\n') + '\n');
  mk('hb1', [['claude-opus-5-5', 'claude-opus-5-5'], ['claude-opus-4-8', 'claude-opus-5-5']]);
  mk('hb2', [['claude-opus-5-5', 'claude-opus-5-5']]);
  const hb = (agent) => run('handback.mjs', { hook_event_name: 'PreToolUse', tool_name: 'SubagentHandback', session_id: sess, agent_id: agent, transcript_path: path.join(proj, `${sess}.jsonl`), tool_input: { message: 'MY REPORT' } });
  const o = hb('hb1'); assert.match(o.hookSpecificOutput.updatedInput.message, /^⚠️ Part of this work ran on claude-opus-4-8/); assert.match(o.hookSpecificOutput.updatedInput.message, /MY REPORT$/);
  assert.equal(hb('hb2'), null);
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

const subTranscript = (turns) => { const f = path.join(tmp, `agent-${++n}.jsonl`); fs.writeFileSync(f, turns.map(([served, asked]) => JSON.stringify({ type: 'assistant', requestedModel: asked, message: { model: served, content: [] } })).join('\n') + '\n'); return f; };
const subStop = (f, active = false) => run('subagent-model.mjs', { hook_event_name: 'SubagentStop', session_id: 'sa', agent_id: 'a1', stop_hook_active: active, agent_transcript_path: f });

test('subagent: a turn served by a fallback model blocks the stop once, with the disclosure', () => {
  const o = subStop(subTranscript([['claude-opus-5-5', 'claude-opus-5-5'], ['claude-opus-4-8', 'claude-opus-5-5']]));
  assert.equal(o.decision, 'block'); assert.match(o.reason, /claude-opus-4-8/); assert.match(o.reason, /top of your final report/);
});

test('subagent: no fallback, or the second stop, passes through', () => {
  assert.equal(subStop(subTranscript([['claude-opus-5-5', 'claude-opus-5-5']])), null);
  assert.equal(subStop(subTranscript([['claude-opus-4-8', 'claude-opus-5-5']]), true), null);
  assert.equal(subStop(path.join(tmp, 'missing.jsonl')), null);
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
