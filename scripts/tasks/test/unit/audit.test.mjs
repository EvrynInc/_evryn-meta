import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FAKE_KEY, TEST_ENV, jsonResponse } from '../helpers.mjs';
import { findTranscriptIn, namesFrom, runAudit, transcriptHoldsCommand } from '../../audit.mjs';

const NOW = () => new Date('2026-11-19T07:00:00Z');
const S1 = '0b6f7c1e-2f43-4c5a-9d1e-5f7a8b9c0d1e';
const S2 = '7d9e0000-0000-4000-8000-000000000002';

/** A fake PostgREST for the audit's four reads plus the short-id lookup. Every read pages to an empty page. */
function fakeDb({ auths = [], justin = [], noSession = [], returns = [], tasks = [] } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const u = new URL(url);
    const table = u.pathname.replace('/rest/v1/', '');
    if ([...u.searchParams.keys()].includes('id') && /^gt\./.test(u.searchParams.get('id') ?? '')) return jsonResponse(200, []);
    if (table === 'task_authorizations') return jsonResponse(200, auths);
    if (table === 'tasks') return jsonResponse(200, tasks);
    if (table === 'task_history') {
      if (u.searchParams.get('actor') === 'eq.justin') return jsonResponse(200, justin);
      if (u.searchParams.get('session_id') === 'is.null') return jsonResponse(200, noSession);
      if (u.searchParams.get('flags')) return jsonResponse(200, returns);
    }
    return jsonResponse(200, []);
  };
  return { fetchImpl, calls };
}

const auth = (extra = {}) => ({ id: 1, task_id: 'u5', kind: 'authorization', tier: 'justin', source: 'lucas_relay', actor: 'lucas', session_id: S1, justin_ref: 'Log 15:27', rule_ref: null, at: '2026-11-19T01:00:00Z', ...extra });
const TASKS = [{ id: 'u5', short_id: 5 }, { id: 'u6', short_id: 6 }];

async function audit(db, { transcripts = {}, agents, argv = [] } = {}) {
  const lines = [];
  const files = { ...(agents ? { 'agents.json': JSON.stringify(agents) } : {}), ...Object.fromEntries(Object.entries(transcripts).map(([s, t]) => [`/t/${s}.jsonl`, t])) };
  const code = await runAudit({
    argv: [...argv, ...(agents ? ['--agents', 'agents.json'] : [])],
    env: TEST_ENV,
    fetchImpl: db.fetchImpl,
    out: (s) => lines.push(s),
    now: NOW,
    readText: (p) => {
      if (!(p in files)) throw new Error(`no file ${p}`);
      return files[p];
    },
    findTranscript: (s) => (transcripts[s] !== undefined ? `/t/${s}.jsonl` : null),
  });
  return { code, text: lines.join('\n') };
}

test('audit: a row whose session transcript holds the authorize command passes; nothing else to flag exits 0', async () => {
  const r = await audit(fakeDb({ auths: [auth()], tasks: TASKS }), { transcripts: { [S1]: '... node ../_evryn-meta/scripts/tasks/tasks.mjs authorize T-5 --as lucas --tier justin ...' } });
  assert.equal(r.code, 0, r.text);
  assert.match(r.text, /T-auth #1 .* T-5 authorization · tier justin · source lucas_relay · by lucas · session 0b6f7c1e/);
  assert.match(r.text, /Justin's words: Log 15:27 · transcript holds the command/);
  assert.match(r.text, /AUDIT: nothing to flag\./);
});

test('audit: a transcript WITHOUT the command (a write as lucas from a session that never ran it) is flagged; the transcript text is never printed', async () => {
  const r = await audit(fakeDb({ auths: [auth()], tasks: TASKS }), { transcripts: { [S1]: 'SECRET-TRANSCRIPT-TEXT tasks.mjs authorize T-55' } });
  assert.equal(r.code, 1);
  assert.match(r.text, /⚑ transcript found, but it does NOT hold "tasks\.mjs authorize T-5"/);
  assert.ok(!r.text.includes('SECRET-TRANSCRIPT-TEXT'), 'transcript text was printed');
});

test('audit: a session whose transcript is not on this machine is NOT CHECKED, flagged, and named at the end', async () => {
  const r = await audit(fakeDb({ auths: [auth({ session_id: S2 })], tasks: TASKS }));
  assert.equal(r.code, 1);
  assert.match(r.text, /transcript not on this machine: NOT CHECKED/);
  assert.match(r.text, new RegExp(`Could not check 1 session\\(s\\) here, because their transcript is not on this machine .*${S2}`));
});

test('audit: a display name is shown, marked as deciding nothing; a backfill row needs no session; an acceptance is matched to accept', async () => {
  const r = await audit(fakeDb({
    auths: [auth(), auth({ id: 2, tier: 'backfill', source: 'migration_006', actor: 'justin', session_id: null, justin_ref: null, rule_ref: 'migration 006 backfill' }), auth({ id: 3, kind: 'acceptance', task_id: 'u6' })],
    tasks: TASKS,
  }), { transcripts: { [S1]: 'tasks.mjs authorize T-5 ... tasks accept T-6' }, agents: [{ sessionId: S1, name: 'Admiral Lucas 1.19 am' }] });
  assert.equal(r.code, 0, r.text);
  assert.match(r.text, /name "Admiral Lucas 1\.19 am" \(display only; a name decides nothing\)/);
  assert.match(r.text, /migration 006 backfill \(no session, by design\)/);
  assert.match(r.text, /T-auth #3 .* T-6 acceptance/);
});

test('audit: writes as justin are flagged unless they are migration 006\'s data steps; no-session writes and returns to proposed are listed', async () => {
  const r = await audit(fakeDb({
    justin: [
      { id: 10, task_id: 'u5', at: 'a', op: 'update', changed_fields: ['status'], note: 'migration 006: pre-005 backlog item moved to backlog.' },
      { id: 11, task_id: 'u6', at: 'b', op: 'update', changed_fields: ['authorization_id'], note: 'authorized (T-auth #2, tier backfill): migration 006 backfill' },
      { id: 12, task_id: 'u6', at: 'c', op: 'update', changed_fields: ['title'], note: null },
    ],
    noSession: [{ id: 13, task_id: 'u5', at: 'd', actor: 'ac', op: 'update' }],
    returns: [{ id: 14, task_id: 'u6', at: 'e', actor: 'mira', note: 're-authorization needed: scope changed (description)' }],
    tasks: TASKS,
  }));
  assert.equal(r.code, 1);
  assert.match(r.text, /^ {3}history #10 .*\(migration 006 data step\)$/m);
  assert.match(r.text, /^ {3}history #11 .*\(migration 006 data step\)$/m);
  assert.match(r.text, /^ {3}⚑ history #12 a? ?.*T-6 update title$/m);
  assert.match(r.text, /3\. Writes with no session id \(1\):\n {3}history #13 d T-5 update by ac/);
  assert.match(r.text, /T-6 e by mira: re-authorization needed: scope changed \(description\)/);
});

test('audit: refuses a non-team URL before any request; never prints the key', async () => {
  const db = fakeDb();
  const lines = [];
  const code = await runAudit({ env: { ...TEST_ENV, EVRYN_TEAM_SUPABASE_URL: 'https://productref1234567890.supabase.co' }, fetchImpl: db.fetchImpl, out: (s) => lines.push(s), now: NOW });
  assert.equal(code, 1);
  assert.equal(db.calls.length, 0);
  assert.match(lines.join('\n'), /AUDIT REFUSED/);
  assert.ok(!lines.join('\n').includes(FAKE_KEY));
});

test('audit helpers: the command match is exact to the task number; names come from either capture shape; a bad session id finds no file', () => {
  assert.equal(transcriptHoldsCommand('tasks.mjs authorize T-12 --as lucas', 'authorization', 12), true);
  assert.equal(transcriptHoldsCommand('tasks.mjs authorize T-123', 'authorization', 12), false);
  assert.equal(transcriptHoldsCommand('tasks.mjs accept T-12', 'authorization', 12), false);
  assert.equal(transcriptHoldsCommand('tasks accept T-12', 'acceptance', 12), true);
  assert.equal(namesFrom({ agents: [{ id: 'x', name: 'n' }] }).get('x'), 'n');
  assert.equal(namesFrom([{ sessionId: 'y', title: 't' }]).get('y'), 't');
  assert.equal(findTranscriptIn('/nonexistent-dir', '../../etc'), null);
});
