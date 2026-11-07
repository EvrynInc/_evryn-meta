import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { FAKE_KEY, TASKS_DIR, TEST_ENV, capture, fakePostgrest, jsonResponse } from '../helpers.mjs';
import {
  CLOSED_STATUSES,
  HELP,
  PULL_CLOSED_CAP,
  PULL_OPEN_CAP,
  PULL_REVIEW_CAP,
  PULL_STATUSES,
  SETTABLE_STATUSES,
  STATUSES,
  addDays,
  canonicalJson,
  headline,
  ptToday,
  run,
} from '../../lib/cli.mjs';
import { DEFAULT_ACCOUNTABLE } from '../../lib/defaults.mjs';

const NOW = new Date('2026-11-05T22:00:00Z');

function task(n, extra = {}) {
  return { short_id: n, status: 'open', title: `task ${n}`, owner: 'lucas', addressed_to: null, needed_by: null, closed_at: null, ...extra };
}

async function cli(argv, { rows = [], history = [], env = TEST_ENV, onWrite, fetchImpl, pageSize } = {}) {
  const io = capture();
  const fake = fakePostgrest({ rows, history, onWrite });
  const code = await run(argv, {
    env,
    fetch: fetchImpl ?? fake.fetchImpl,
    stdout: io.stdout,
    stderr: io.stderr,
    now: () => NOW,
    pageSize,
    writeFile: (p, t) => {
      io.written = { p, t };
    },
  });
  return { code, ...io, calls: fake.calls };
}

// ---------------------------------------------------------------------------
// The help text is the manual
// ---------------------------------------------------------------------------

test('--help opens with Soren\'s definition and documents pull, search, close, the actor, status and the screen', async () => {
  const { code, out } = await cli(['--help']);
  assert.equal(code, 0);
  const firstLines = out.split('\n').slice(0, 4).join('\n');
  assert.match(firstLines, /A task is one owed item, with one owner, that outlives the session it was born in\./);
  for (const s of ['pull --as', 'search "<words>"', 'close T-12 --note', '--decided-against', 'EVRYN_ACTOR', 'warning-grade screen, NOT a guarantee', 'RECORD, NEVER A GATE', "old default 'todo' is not allowed", 'Do NOT commit']) {
    assert.ok(out.includes(s), `help lacks: ${s}`);
  }
});

test('help needs no credentials and makes no request', async () => {
  const { code, calls } = await cli(['help'], { env: {} });
  assert.equal(code, 0);
  assert.equal(calls.length, 0);
});

// ---------------------------------------------------------------------------
// R5 and secrets
// ---------------------------------------------------------------------------

test('R5: a product URL is refused before ANY request, and no value is printed', async () => {
  const env = { ...TEST_ENV, EVRYN_TEAM_SUPABASE_URL: 'https://productref1234567890.supabase.co' };
  for (const argv of [['pull', '--as', 'ac'], ['search', 'x'], ['add', '--as', 'ac', '--title', 'x'], ['export']]) {
    const r = await cli(argv, { env });
    assert.equal(r.code, 1, argv.join(' '));
    assert.equal(r.calls.length, 0, `a request left for ${argv[0]}`);
    assert.match(r.err, /does not point at the Evryn Team project/);
    assert.ok(!`${r.out}${r.err}`.includes('productref1234567890'));
    assert.ok(!`${r.out}${r.err}`.includes(FAKE_KEY));
  }
});

test('missing credentials are named, the exit is non-zero, nothing is sent', async () => {
  const r = await cli(['search', 'x'], { env: { EVRYN_TEAM_SUPABASE_URL: TEST_ENV.EVRYN_TEAM_SUPABASE_URL } });
  assert.equal(r.code, 1);
  assert.match(r.err, /missing variable: EVRYN_TEAM_SUPABASE_SECRET_KEY/);
  assert.equal(r.calls.length, 0);
});

test('no secret in any output — including a forced server error that echoes the key and a thrown network error', async () => {
  const echo = async () => jsonResponse(500, { message: `boom ${FAKE_KEY}`, code: 'XX000', hint: `hint ${FAKE_KEY}`, details: FAKE_KEY });
  const r1 = await cli(['search', 'x'], { fetchImpl: echo });
  assert.equal(r1.code, 1);
  assert.match(r1.err, /boom <REDACTED>/);
  const thrower = async () => {
    const e = new Error(`socket closed ${FAKE_KEY}`);
    e.cause = { headers: { apikey: FAKE_KEY } };
    throw e;
  };
  const r2 = await cli(['pull', '--as', 'ac'], { fetchImpl: thrower });
  assert.equal(r2.code, 1);
  for (const r of [r1, r2]) assert.ok(!`${r.out}${r.err}`.includes(FAKE_KEY), 'the key was printed');
});

test('PostgREST refusals are printed with message, code and hint, and exit 1', async () => {
  const refuse = async () => jsonResponse(400, { message: 'new row violates check constraint "tasks_closed_needs_note"', code: '23514', hint: null });
  const r = await cli(['close', 'T-3', '--as', 'ac', '--note', 'x'], { fetchImpl: refuse });
  assert.equal(r.code, 1);
  assert.match(r.err, /tasks_closed_needs_note/);
  assert.match(r.err, /code: 23514/);
});

// ---------------------------------------------------------------------------
// the actor
// ---------------------------------------------------------------------------

test('a write without an actor is refused BEFORE any request (the database is the control; this is a courtesy)', async () => {
  for (const argv of [['add', '--title', 'x'], ['close', 'T-1', '--note', 'n'], ['update', 'T-1', '--status', 'blocked'], ['sign', 'T-1', '--ref', 'r'], ['pull']]) {
    const r = await cli(argv);
    assert.equal(r.code, 2, argv.join(' '));
    assert.equal(r.calls.length, 0);
    assert.match(r.err, /needs to know who you are/);
  }
});

test('EVRYN_ACTOR works in place of --as, and a malformed name is refused', async () => {
  const ok = await cli(['mine'], { env: { ...TEST_ENV, EVRYN_ACTOR: 'soren' } });
  assert.equal(ok.code, 0);
  assert.equal(ok.calls[0].init.headers['x-evryn-actor'], 'soren');
  const bad = await cli(['mine', '--as', 'two words']);
  assert.equal(bad.code, 2);
});

test('every write sends x-evryn-actor', async () => {
  const r = await cli(['add', '--as', 'mira', '--title', 'Draft the cutover note']);
  assert.equal(r.code, 0);
  const post = r.calls.find((c) => c.init.method === 'POST');
  assert.equal(post.init.headers['x-evryn-actor'], 'mira');
  const body = JSON.parse(post.init.body);
  assert.deepEqual(body.raci, { r: 'mira', a: 'lucas' });
  assert.equal(body.status, 'open');
});

// ---------------------------------------------------------------------------
// pull (Soren's Q5)
// ---------------------------------------------------------------------------

test('pull: line shape is "T-12 [blocked] headline (needed 11/20)"', () => {
  assert.equal(headline(task(12, { status: 'blocked', title: 'headline', needed_by: '2026-11-20' }), 'lucas'), 'T-12 [blocked] headline (needed 11/20)');
});

test('pull: my open tasks plus those addressed to me, then my closed in the last 30 days', async () => {
  const rows = [
    task(1, { owner: 'lucas' }),
    task(2, { owner: 'soren', addressed_to: 'lucas', needed_by: '2026-11-08' }),
    task(3, { owner: 'soren' }),
    task(4, { owner: 'lucas', status: 'done', closed_at: '2026-11-01T10:00:00Z' }),
    task(5, { owner: 'lucas', status: 'decided_against', closed_at: '2026-10-30T10:00:00Z' }),
    task(6, { owner: 'lucas', status: 'done', closed_at: '2026-09-01T10:00:00Z' }),
  ];
  const r = await cli(['pull', '--as', 'lucas'], { rows });
  assert.equal(r.code, 0);
  assert.match(r.out, /T-1 \[open\] task 1/);
  assert.match(r.out, /T-2 \[open\] task 2 \(needed 11\/08\) \(to you; owner soren\)/);
  assert.doesNotMatch(r.out, /T-3 /);
  assert.match(r.out, /T-4 \[done 11\/01\] task 4/);
  assert.match(r.out, /T-5 \[decided_against 10\/30\] task 5/);
  assert.doesNotMatch(r.out, /T-6 /, 'closed more than 30 days ago');
});

test('pull: a hard cap with a LOUD "+N more", and nothing silently dropped', async () => {
  const rows = [
    ...Array.from({ length: PULL_OPEN_CAP + 5 }, (_, i) => task(i + 1)),
    ...Array.from({ length: PULL_CLOSED_CAP + 3 }, (_, i) => task(100 + i, { status: 'done', closed_at: '2026-11-02T00:00:00Z' })),
  ];
  const r = await cli(['pull', '--as', 'lucas'], { rows });
  assert.match(r.out, new RegExp(`Open — yours or addressed to you \\(${PULL_OPEN_CAP + 5}\\)`));
  assert.match(r.out, /\+5 more open — NOT SHOWN/);
  assert.match(r.out, /\+3 more closed — NOT SHOWN/);
  assert.equal((r.out.match(/^ {2}T-/gm) ?? []).length, PULL_OPEN_CAP + PULL_CLOSED_CAP);
});

test('pull pages to exhaustion (page size 2)', async () => {
  const r = await cli(['pull', '--as', 'lucas'], { rows: Array.from({ length: 5 }, (_, i) => task(i + 1)), pageSize: 2 });
  assert.match(r.out, /\(5\)/);
});

// ---------------------------------------------------------------------------
// reads
// ---------------------------------------------------------------------------

test('closed: needs a who (--as, --by or --all); --all lists everyone with owners', async () => {
  assert.equal((await cli(['closed'])).code, 2);
  const rows = [task(1, { status: 'done', closed_at: '2026-11-04T00:00:00Z', owner: 'thea' })];
  const r = await cli(['closed', '--all', '--days', '7'], { rows });
  assert.equal(r.code, 0);
  assert.match(r.out, /T-1 \[done 11\/03\] task 1 — thea/);
});

test('search: everyone\'s tasks, decided-against flagged, terms bounded', async () => {
  const rows = [task(1, { title: 'Linear import', owner: 'ac' }), task(2, { title: 'linear cutover', status: 'decided_against', owner: 'lucas', closed_at: '2026-11-01T00:00:00Z' })];
  const r = await cli(['search', 'linear'], { rows });
  assert.equal(r.code, 0);
  assert.match(r.out, /2 matches/);
  assert.match(r.out, /DECIDED AGAINST/);
  assert.ok(r.calls[0].url.includes('search=wfts(english).linear'));
  const long = await cli(['search', 'x'.repeat(201)]);
  assert.equal(long.code, 2);
  assert.equal(long.calls.length, 0);
});

test('show: the row and its history', async () => {
  const rows = [{ ...task(7), id: 'u7', raci: { r: 'lucas', a: 'justin' }, description: 'body', created_at: 'c', updated_at: 'u', links: ['docs/x.md'] }];
  const history = [
    { id: 1, task_id: 'u7', at: 'a1', actor: 'lucas', op: 'insert', changed_fields: ['title'], old: null, new: {}, flags: [] },
    { id: 2, task_id: 'u7', at: 'a2', actor: 'nobody', op: 'update', changed_fields: ['status'], old: { status: 'open' }, new: { status: 'blocked' }, flags: ['actor_off_roster'] },
  ];
  const r = await cli(['show', 'T-7'], { rows, history });
  assert.equal(r.code, 0);
  assert.match(r.out, /accountable: justin/);
  assert.match(r.out, /#2 a2 nobody status: "open" → "blocked"  ⚑ actor_off_roster/);
});

// ---------------------------------------------------------------------------
// writes and the R6 screen
// ---------------------------------------------------------------------------

test('R6: an email anywhere in a write is REFUSED and nothing is sent', async () => {
  const cases = [
    ['add', '--as', 'ac', '--title', 'mail x@y.com'],
    ['add', '--as', 'ac', '--title', 'ok', '--body', 'a@b.io'],
    ['add', '--as', 'ac', '--title', 'ok', '--tags', 'x@y.io'],
    ['add', '--as', 'ac', '--title', 'ok', '--link', 'mailto:x@y.io'],
    ['close', 'T-1', '--as', 'ac', '--note', 'replied to x@y.com'],
    ['sign', 'T-1', '--as', 'lucas', '--ref', 'email from j@x.com'],
    ['add', '--as', 'ac', '--title', 'ok', '--note', 'per x@y.io'],
    ['update', 'T-1', '--as', 'ac', '--note', 'told q@r.org'],
    ['update', 'T-1', '--as', 'ac', '--title', 'see z@q.org'],
  ];
  for (const argv of cases) {
    const r = await cli(argv);
    assert.equal(r.code, 1, argv.join(' '));
    assert.match(r.err, /REFUSED .*email address/);
    assert.equal(r.calls.filter((c) => c.init.method !== 'GET').length, 0, `a write left for ${argv.join(' ')}`);
    assert.ok(!r.err.includes('@'), 'the address was echoed');
  }
});

test('R6: a phone number WARNS and the write still goes', async () => {
  const r = await cli(['add', '--as', 'ac', '--title', 'call vendor 206-555-0100']);
  assert.equal(r.code, 0);
  assert.match(r.err, /WARNING add: title .*phone number/);
  assert.equal(r.calls.filter((c) => c.init.method === 'POST').length, 1);
});

test('courtesy checks: 81-char title, 601-char body, closing status via update, justin without date', async () => {
  assert.equal((await cli(['add', '--as', 'ac', '--title', 'x'.repeat(81)])).code, 2);
  assert.equal((await cli(['add', '--as', 'ac', '--title', 'x', '--body', 'b'.repeat(601)])).code, 2);
  assert.equal((await cli(['update', 'T-1', '--as', 'ac', '--status', 'done'])).code, 2);
  assert.equal((await cli(['add', '--as', 'ac', '--title', 'x', '--to', 'justin'])).code, 2);
  assert.equal((await cli(['add', '--as', 'ac', '--title', 'x', '--to', 'justin', '--needed-by', '2026-11-20'])).code, 0);
});

test('close requires --note; --decided-against sets decided_against with closed_at', async () => {
  assert.equal((await cli(['close', 'T-1', '--as', 'ac'])).code, 2);
  assert.equal((await cli(['close', 'T-1', '--as', 'ac', '--note', '   '])).code, 2);
  const r = await cli(['close', 'T-1', '--as', 'ac', '--note', 'no: see brief Log 14:52', '--decided-against']);
  assert.equal(r.code, 0);
  const patch = JSON.parse(r.calls.find((c) => c.init.method === 'PATCH').init.body);
  assert.equal(patch.status, 'decided_against');
  assert.equal(patch.closed_at, NOW.toISOString());
});

test('update merges raci and adds links rather than replacing them', async () => {
  const rows = [{ ...task(4), raci: { r: 'lucas', a: 'justin', c: ['mira'] }, links: ['docs/a.md'] }];
  const r = await cli(['update', 'T-4', '--as', 'lucas', '--owner', 'soren', '--link', 'docs/b.md'], { rows });
  assert.equal(r.code, 0);
  const patch = JSON.parse(r.calls.find((c) => c.init.method === 'PATCH').init.body);
  assert.deepEqual(patch.raci, { r: 'soren', a: 'justin', c: ['mira'] });
  assert.deepEqual(patch.links, ['docs/a.md', 'docs/b.md']);
});

// ---------------------------------------------------------------------------
// export
// ---------------------------------------------------------------------------

test('export: deterministic, LF, keys sorted, and it round-trips', async () => {
  const rows = [
    { short_id: 2, title: 'b', status: 'open', raci: { r: 'x', a: 'justin' }, links: [] },
    { short_id: 1, title: 'a', status: 'done', raci: { a: 'justin', r: 'y' }, links: ['docs/a.md'] },
  ];
  const r1 = await cli(['export'], { rows, pageSize: 1 });
  const r2 = await cli(['export'], { rows: [...rows].reverse(), pageSize: 1 });
  assert.equal(r1.code, 0);
  assert.equal(r1.out, r2.out, 'export depends on input order');
  assert.ok(!r1.out.includes('\r'));
  const parsed = JSON.parse(r1.out);
  assert.deepEqual(parsed.map((t) => t.short_id), [1, 2]);
  assert.equal(canonicalJson(parsed), r1.out, 'export does not round-trip');
});

test('export refuses to write if ANY row fails the screen', async () => {
  const rows = [task(1), task(2, { closing_note: 'emailed bob@example.com' })];
  const r = await cli(['export', '--out', 'x.json'], { rows });
  assert.equal(r.code, 1);
  assert.match(r.err, /export refused/);
  assert.equal(r.written, undefined, 'a file was written');
});

// ---------------------------------------------------------------------------
// end to end through the real entry point
// ---------------------------------------------------------------------------

test('tasks.mjs end to end: a product URL refused with no network (spawned, env injected)', () => {
  // SEALED-EXEC: followed 2026-08-11 — process.execPath, the node binary already running this test; no network.
  const r = spawnSync(process.execPath, [join(TASKS_DIR, 'tasks.mjs'), 'pull', '--as', 'ac'], {
    encoding: 'utf8',
    windowsHide: true,
    env: {
      ...process.env,
      EVRYN_TASKS_ENV_FROM_PROCESS: '1',
      EVRYN_TEAM_SUPABASE_URL: 'https://productref1234567890.supabase.co',
      EVRYN_TEAM_SUPABASE_SECRET_KEY: FAKE_KEY,
    },
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /REFUSED: EVRYN_TEAM_SUPABASE_URL does not point at the Evryn Team project/);
  assert.ok(!`${r.stdout}${r.stderr}`.includes(FAKE_KEY));
});

test('unknown options and commands are usage errors (exit 2)', async () => {
  assert.equal((await cli(['frobnicate'])).code, 2);
  assert.equal((await cli(['pull', '--as', 'ac', '--bogus'])).code, 2);
  assert.equal((await cli(['show', 'twelve'])).code, 2);
});

// ---------------------------------------------------------------------------
// migration 005 — statuses, the note, sign, routing (Soren's cutover design §1.5)
// ---------------------------------------------------------------------------

const writes = (r) => r.calls.filter((c) => c.init.method !== 'GET');
const patchOf = (r) => JSON.parse(r.calls.find((c) => c.init.method === 'PATCH').init.body);
const postOf = (r) => JSON.parse(r.calls.find((c) => c.init.method === 'POST').init.body);

test('005: the status lists are split, and the sets are exactly as designed', () => {
  assert.deepEqual(STATUSES, ['backlog', 'proposed', 'open', 'in_progress', 'blocked', 'needs_acceptance', 'done', 'decided_against']);
  assert.deepEqual(SETTABLE_STATUSES, ['backlog', 'proposed', 'open', 'in_progress', 'blocked', 'needs_acceptance']);
  assert.deepEqual(PULL_STATUSES, ['proposed', 'open', 'in_progress', 'blocked', 'needs_acceptance']);
  assert.deepEqual(CLOSED_STATUSES, ['done', 'decided_against']);
  // siblings, asserted together: settable ∪ closed = all; pull = settable minus backlog; nothing closed is settable
  assert.deepEqual([...SETTABLE_STATUSES, ...CLOSED_STATUSES].sort(), [...STATUSES].sort());
  assert.deepEqual(PULL_STATUSES, SETTABLE_STATUSES.filter((s) => s !== 'backlog'));
});

test('005: update refuses --status without --note, before any request', async () => {
  const r = await cli(['update', 'T-1', '--as', 'ac', '--status', 'blocked'], { rows: [task(1)] });
  assert.equal(r.code, 2);
  assert.match(r.err, /a status change needs --note/);
  assert.equal(r.calls.length, 0);
});

test('005: update T-n --note alone is a COMMENT: the patch carries only the note', async () => {
  const r = await cli(['update', 'T-1', '--as', 'ac', '--note', 'handed the spec to Mira: docs/x.md'], { rows: [task(1)] });
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(patchOf(r), { note: 'handed the spec to Mira: docs/x.md' });
  assert.match(r.out, /^commented on T-/m);
});

test('005: a status change with --note sends both', async () => {
  const r = await cli(['update', 'T-1', '--as', 'ac', '--status', 'blocked', '--note', 'waiting on soren'], { rows: [task(1)] });
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(patchOf(r), { status: 'blocked', note: 'waiting on soren' });
});

test('005: a --note identical to the task\'s current note is refused after one read, and nothing is written', async () => {
  const r = await cli(['update', 'T-1', '--as', 'ac', '--status', 'open', '--note', 'same words'], { rows: [task(1, { status: 'blocked', note: 'same words' })] });
  assert.equal(r.code, 2);
  assert.match(r.err, /matches this task's last note word for word/);
  assert.equal(r.calls.filter((c) => c.init.method === 'GET').length, 1);
  assert.equal(writes(r).length, 0);
});

test('005: a blank or over-long --note is refused before any request', async () => {
  for (const note of ['   ', 'n'.repeat(601)]) {
    const r = await cli(['update', 'T-1', '--as', 'ac', '--note', note], { rows: [task(1)] });
    assert.equal(r.code, 2);
    assert.equal(r.calls.length, 0);
  }
});

test('005: add --note writes the note on the insert', async () => {
  const r = await cli(['add', '--as', 'ac', '--title', 'x', '--note', 'from the 11/06 standup']);
  assert.equal(r.code, 0, r.err);
  assert.equal(postOf(r).note, 'from the 11/06 standup');
});

test('005: close --note still writes closing_note, and no second note', async () => {
  const r = await cli(['close', 'T-1', '--as', 'ac', '--note', 'shipped; docs/x.md']);
  assert.equal(r.code, 0, r.err);
  const p = patchOf(r);
  assert.equal(p.closing_note, 'shipped; docs/x.md');
  assert.equal(p.note, undefined);
});

test('005: sign refuses any actor but lucas or justin before a request; lucas may sign, with an optional --note', async () => {
  for (const as of ['ac', 'nathan', 'mira']) {
    const r = await cli(['sign', 'T-1', '--as', as, '--ref', 'brief Log 14:52']);
    assert.equal(r.code, 2, as);
    assert.match(r.err, /only lucas or justin may sign/);
    assert.equal(r.calls.length, 0);
  }
  for (const as of ['lucas', 'justin']) {
    const r = await cli(['sign', 'T-1', '--as', as, '--ref', 'brief Log 14:52', '--note', 'his yes at standup']);
    assert.equal(r.code, 0, r.err);
    assert.deepEqual(Object.keys(patchOf(r)).sort(), ['note', 'signed_at', 'signed_ref']);
  }
});

test('005: an add owned by someone else is a REQUEST: proposed, addressed to them — each default yields to its option', async () => {
  const req = await cli(['add', '--as', 'lucas', '--title', 'review the cutover doc', '--owner', 'soren']);
  assert.equal(req.code, 0, req.err);
  assert.equal(postOf(req).status, 'proposed');
  assert.equal(postOf(req).addressed_to, 'soren');
  const authorized = await cli(['add', '--as', 'lucas', '--title', 'x', '--owner', 'soren', '--status', 'open']);
  assert.equal(postOf(authorized).status, 'open');
  assert.equal(postOf(authorized).addressed_to, 'soren');
  const unaddressed = await cli(['add', '--as', 'lucas', '--title', 'x', '--owner', 'soren', '--to', 'none']);
  assert.equal(postOf(unaddressed).addressed_to, undefined);
  const self = await cli(['add', '--as', 'soren', '--title', 'x']);
  assert.equal(postOf(self).status, 'open');
  assert.equal(postOf(self).addressed_to, undefined);
});

test('005: needs_acceptance must be addressed (courtesy, ahead of tasks_acceptance_addressed)', async () => {
  assert.equal((await cli(['add', '--as', 'ac', '--title', 'x', '--status', 'needs_acceptance'])).code, 2);
  assert.equal((await cli(['add', '--as', 'ac', '--title', 'x', '--status', 'needs_acceptance', '--to', 'lucas'])).code, 0);
  const r = await cli(['update', 'T-1', '--as', 'ac', '--status', 'needs_acceptance', '--note', 'done; please accept'], { rows: [task(1)] });
  assert.equal(r.code, 2);
  assert.equal(writes(r).length, 0);
});

test('005: show prints each history row\'s note under it, and a note-only row as a comment', async () => {
  const rows = [{ ...task(7), id: 'u7', raci: { r: 'lucas', a: 'lucas' }, description: '', created_at: 'c', updated_at: 'u', links: [], note: 'row note — never printed' }];
  const history = [
    { id: 1, task_id: 'u7', at: 'a1', actor: 'lucas', op: 'insert', changed_fields: ['title'], old: null, new: {}, flags: [], note: null },
    { id: 2, task_id: 'u7', at: 'a2', actor: 'lucas', op: 'update', changed_fields: ['status'], old: { status: 'open' }, new: { status: 'blocked' }, flags: [], note: 'waiting on soren' },
    { id: 3, task_id: 'u7', at: 'a3', actor: 'mira', op: 'update', changed_fields: [], old: {}, new: {}, flags: [], note: 'see docs/y.md' },
  ];
  const r = await cli(['show', 'T-7'], { rows, history });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /#2 a2 lucas status: "open" → "blocked"\n {6}note: waiting on soren\n/);
  assert.match(r.out, /#3 a3 mira commented\n {6}note: see docs\/y\.md\n/);
  assert.ok(!r.out.includes('row note'), 'the row\'s own note column was printed');
  assert.ok(r.calls.some((c) => c.url.includes('task_history') && c.url.includes(',note')), 'history read without its note');
});

test('005: export reads and writes the note column', async () => {
  const r = await cli(['export'], { rows: [task(1, { note: 'n1' })] });
  assert.equal(r.code, 0, r.err);
  assert.match(r.calls[0].url, /select=[^&]*\bnote\b/);
  assert.equal(JSON.parse(r.out)[0].note, 'n1');
});

// ---------------------------------------------------------------------------
// Soren-005 Ruling 2: backlog due for review (fixed clock: NOW is 2026-11-05 14:00 PT)
// ---------------------------------------------------------------------------

const backlog = (n, needed_by, extra = {}) => task(n, { status: 'backlog', needed_by, ...extra });

test('ptToday is Pacific: 2026-11-06T05:00Z is still 11/05 in Seattle', () => {
  assert.equal(ptToday(() => new Date('2026-11-06T05:00:00Z')), '2026-11-05');
  assert.equal(ptToday(() => NOW), '2026-11-05');
  assert.equal(addDays('2026-11-05', 90), '2027-02-03');
});

test('Ruling 2.1–2.3: due yesterday and today appear in the review section; tomorrow, another owner\'s, and the open section never', async () => {
  const rows = [
    task(1, { owner: 'lucas' }),
    backlog(2, '2026-11-04'),
    backlog(3, '2026-11-05'),
    backlog(4, '2026-11-06'),
    backlog(5, '2026-11-01', { owner: 'soren' }),
    backlog(6, '2026-11-01', { owner: 'soren', addressed_to: 'lucas' }),
  ];
  const r = await cli(['pull', '--as', 'lucas'], { rows });
  assert.equal(r.code, 0, r.err);
  const [openPart, rest] = r.out.split('Backlog due for review');
  const reviewPart = rest.split('Closed by you')[0];
  assert.ok(!/\[backlog\]/.test(openPart), 'a backlog row appeared in the open section');
  assert.match(reviewPart, /^ — yours \(2\): propose it, re-date it with --note, or close it --decided-against:$/m);
  assert.match(reviewPart, /T-2 \[backlog\] task 2 \(review 11\/04\)/);
  assert.match(reviewPart, /T-3 \[backlog\] task 3 \(review 11\/05\)/);
  assert.doesNotMatch(r.out, /T-4 |T-5 |T-6 /);
  assert.ok(!/needed/.test(reviewPart), 'a backlog row said "needed"');
});

test('Ruling 2.4: twelve due rows give ten lines and a loud +2, and the open section\'s count and overflow do not move', async () => {
  const open = Array.from({ length: PULL_OPEN_CAP + 1 }, (_, i) => task(i + 1));
  const due = Array.from({ length: 12 }, (_, i) => backlog(100 + i, '2026-11-01'));
  const r = await cli(['pull', '--as', 'lucas'], { rows: [...open, ...due] });
  assert.match(r.out, new RegExp(`Open — yours or addressed to you \\(${PULL_OPEN_CAP + 1}\\)`));
  assert.match(r.out, /\+1 more open — NOT SHOWN/);
  assert.match(r.out, /Backlog due for review — yours \(12\)/);
  assert.equal((r.out.match(/^ {2}T-\d+ \[backlog\]/gm) ?? []).length, PULL_REVIEW_CAP);
  assert.match(r.out, /\+2 more due for review — NOT SHOWN\. Full list: tasks mine --as lucas/);
  assert.equal((r.out.match(/^ {2}T-\d+ \[open\]/gm) ?? []).length, PULL_OPEN_CAP);
});

test('Ruling 2.5: at page size 2, five due rows are all counted (the review query pages to exhaustion)', async () => {
  const r = await cli(['pull', '--as', 'lucas'], { rows: Array.from({ length: 5 }, (_, i) => backlog(i + 1, '2026-11-01')), pageSize: 2 });
  assert.match(r.out, /Backlog due for review — yours \(5\)/);
  assert.ok(r.calls.some((c) => c.url.includes('status=eq.backlog') && c.url.includes('owner=eq.lucas') && c.url.includes('needed_by=lte.2026-11-05')));
});

test('Ruling 2.6: mine shows every due row, uncapped; mine --backlog shows all, by date, marking the due ones', async () => {
  const due = Array.from({ length: 12 }, (_, i) => backlog(100 + i, '2026-11-01'));
  const later = backlog(200, '2026-12-01');
  const mine = await cli(['mine', '--as', 'lucas'], { rows: [...due, later] });
  assert.equal((mine.out.match(/^ {2}T-\d+ \[backlog\]/gm) ?? []).length, 12);
  assert.doesNotMatch(mine.out, /NOT SHOWN/);
  const all = await cli(['mine', '--backlog', '--as', 'lucas'], { rows: [later, backlog(5, '2026-11-05'), backlog(4, '2026-11-02')] });
  assert.equal(all.code, 0, all.err);
  const lines = all.out.split('\n').filter((l) => l.startsWith('  T-'));
  assert.deepEqual(lines, [
    '  T-4 [backlog] task 4 (review 11/02) (due for review)',
    '  T-5 [backlog] task 5 (review 11/05) (due for review)',
    '  T-200 [backlog] task 200 (review 12/01)',
  ]);
});

test('Ruling 2.7: search still returns backlog', async () => {
  const r = await cli(['search', 'idea'], { rows: [backlog(9, '2026-12-01', { title: 'an idea worth keeping' })] });
  assert.match(r.out, /T-9 \[backlog\] an idea worth keeping \(review 12\/01\)/);
});

test('backlog courtesy: a review date is required and at most 90 Pacific days out; re-dating needs a note', async () => {
  assert.equal((await cli(['add', '--as', 'ac', '--title', 'x', '--status', 'backlog'])).code, 2);
  assert.equal((await cli(['add', '--as', 'ac', '--title', 'x', '--status', 'backlog', '--needed-by', '2027-02-04'])).code, 2); // +91
  assert.equal((await cli(['add', '--as', 'ac', '--title', 'x', '--status', 'backlog', '--needed-by', '2027-02-02'])).code, 0); // +89
  const redate = await cli(['update', 'T-1', '--as', 'ac', '--needed-by', '2026-12-01'], { rows: [backlog(1, '2026-11-20')] });
  assert.equal(redate.code, 2);
  assert.match(redate.err, /new review date on a backlog item needs --note/);
  assert.equal(writes(redate).length, 0);
  const ok = await cli(['update', 'T-1', '--as', 'ac', '--needed-by', '2026-12-01', '--note', 'Thea wants it after the meeting'], { rows: [backlog(1, '2026-11-20')] });
  assert.equal(ok.code, 0, ok.err);
  // an unrelated update to a backlog row dated near its cap is not refused (the cap fires only on dating)
  const tags = await cli(['update', 'T-1', '--as', 'ac', '--tags', 'v0.3'], { rows: [backlog(1, '2027-02-01')] });
  assert.equal(tags.code, 0, tags.err);
});

test('Ruling 6.2: leaving backlog without --needed-by warns that the review date becomes a needed-by', async () => {
  const r = await cli(['update', 'T-1', '--as', 'lucas', '--status', 'proposed', '--note', 'worth doing'], { rows: [backlog(1, '2026-11-20')] });
  assert.equal(r.code, 0, r.err);
  assert.match(r.err, /its review date 2026-11-20 becomes this item's needed-by; pass --needed-by <date> or none\./);
  const quiet = await cli(['update', 'T-1', '--as', 'lucas', '--status', 'proposed', '--note', 'worth doing', '--needed-by', 'none'], { rows: [backlog(1, '2026-11-20')] });
  assert.doesNotMatch(quiet.err, /becomes this item's needed-by/);
});

// ---------------------------------------------------------------------------
// Soren-005 Ruling 3: --accountable
// ---------------------------------------------------------------------------

test('Ruling 3.1: add without --accountable writes raci.a = lucas (DEFAULT_ACCOUNTABLE)', async () => {
  const r = await cli(['add', '--as', 'mira', '--title', 'x']);
  assert.equal(DEFAULT_ACCOUNTABLE, 'lucas');
  assert.equal(postOf(r).raci.a, 'lucas');
  assert.doesNotMatch(r.err, /accountable justin/);
});

test('Ruling 3.2: --accountable justin writes justin, and warns when there is no --link', async () => {
  const bare = await cli(['add', '--as', 'lucas', '--title', 'x', '--accountable', 'justin']);
  assert.equal(bare.code, 0, bare.err);
  assert.equal(postOf(bare).raci.a, 'justin');
  assert.match(bare.err, /accountable justin means Justin accepts it at close; link where he authorized it\./);
  const linked = await cli(['add', '--as', 'lucas', '--title', 'x', '--accountable', 'justin', '--link', 'brief.md#log-14-52']);
  assert.doesNotMatch(linked.err, /accountable justin means/);
});

test('005 help text: the eight statuses, the note rule, the sign rule, the backlog review, the accountable line', async () => {
  for (const s of STATUSES) assert.match(HELP, new RegExp(`^ {4}${s} +\\S`, 'm'), `help lacks a line for ${s}`);
  for (const s of [
    "proposed          awaiting a yes: Justin's, or Lucas's under",
    'shared/protocols/authorization-rules.md',
    'Must be addressed (--to)',
    'The DATABASE refuses a status change without a note',
    'Only lucas or justin may sign',
    'shows in pull only once that',
    '(add defaults to lucas). Use justin only on an item Justin authorized',
    'himself, and point at his words with --link.',
  ]) assert.ok(HELP.includes(s), `help lacks: ${s}`);
  assert.ok(!/backlog never appears in pull/.test(HELP), 'the superseded help line is back (Soren-005 Ruling 2)');
});
