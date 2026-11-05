import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { FAKE_KEY, TASKS_DIR, TEST_ENV, capture, fakePostgrest, jsonResponse } from '../helpers.mjs';
import { HELP, PULL_CLOSED_CAP, PULL_OPEN_CAP, canonicalJson, headline, run } from '../../lib/cli.mjs';

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
  assert.deepEqual(body.raci, { r: 'mira', a: 'justin' });
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
    ['sign', 'T-1', '--as', 'ac', '--ref', 'email from j@x.com'],
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
