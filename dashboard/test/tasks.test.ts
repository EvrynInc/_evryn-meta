// Tests for dashboard/api/tasks.ts (the Tasks tab's endpoint, task T-142).
//
// Truncation check: the last line of this file reads "FULL FILE LOADED".
//
// Runs with NO install and NO network: `npm test` (node --test, Node 25 strips the
// types). The endpoint is driven through its exported seam, handleTasks(request,
// { env, createClient }), with a FAKE Supabase client that records every call and
// fails the test the moment anything but a read on `tasks` is attempted.
//
// Three checks run on EVERY test, not just the ones that name them, because a check
// that runs only where its author thought to look misses the path nobody listed:
//   - the global fetch is replaced by a recorder; any call at all fails the test
//     (a write can go around the fake client, carrying the same service-role key);
//   - every response body is checked for the secret markers, and every 200 for its
//     exact top-level keys and for row keys within the eight columns;
//   - everything sent to console.error is checked for the secret markers.
//
// Every test here is proven able to fail by test/mutation-controls.mjs, which runs
// this suite against deliberately broken copies of tasks.ts in a temp folder.

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { format } from 'node:util';
import { handleTasks, PAGE_SIZE, MAX_PAGES, CLOSED_WINDOW_DAYS } from '../api/tasks.ts';

const URL_SECRET = 'https://fakeproject-secret.supabase.co';
const KEY_SECRET = 'service-role-key-SECRET-do-not-leak';
const PASSWORD = 'correct-horse';
const SECRET_MARKERS = [URL_SECRET, 'fakeproject-secret', KEY_SECRET, 'SECRET-do-not-leak', PASSWORD];

const EXPECTED_COLUMNS = [
  'short_id', 'title', 'status', 'owner', 'addressed_to', 'needed_by', 'updated_at', 'closed_at',
];
const TOP_LEVEL_KEYS = ['closed', 'configured', 'fetched_at', 'open', 'truncated'];
const CLOSED = ['done', 'decided_against'];
// Literal, never the imported constant: a test that computes its expectation from the
// code's own constant moves with the code and pins nothing.
const WINDOW_DAYS_LITERAL = 30;

// Builder methods a read may use. Anything else on a builder, or anything but
// from() on the client, is a violation.
const READ_OPS = new Set(['select', 'in', 'not', 'gt', 'gte', 'order', 'limit']);
const WRITE_OPS = ['insert', 'update', 'upsert', 'delete'];

// ---------------------------------------------------------------------------
// Suite-wide guards: global fetch and console.error.
// ---------------------------------------------------------------------------

let fetchCalls = [];
let errorLog = [];
let realFetch;
let realConsoleError;

beforeEach(() => {
  fetchCalls = [];
  errorLog = [];
  realFetch = globalThis.fetch;
  realConsoleError = console.error;
  globalThis.fetch = (...args) => {
    fetchCalls.push(args.map((a) => format('%o', a)).join(' '));
    return Promise.reject(new Error('test: global fetch is forbidden'));
  };
  console.error = (...args) => { errorLog.push(format(...args)); };
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.error = realConsoleError;
  assert.equal(fetchCalls.length, 0, `global fetch was called: ${fetchCalls.join(' | ')}`);
  const logged = errorLog.join('\n');
  for (const m of SECRET_MARKERS) assert.ok(!logged.includes(m), `secret marker in the server log: ${m}`);
});

function fullEnv(over = {}) {
  return {
    DASHBOARD_PASSWORD: PASSWORD,
    TEAM_SUPABASE_URL: URL_SECRET,
    TEAM_SUPABASE_SERVICE_ROLE_KEY: KEY_SECRET,
    ...over,
  };
}

function basic(user, pass) {
  return 'Basic ' + btoa(`${user}:${pass}`);
}

function req(method = 'GET', auth = basic('evryn', PASSWORD)) {
  const headers = auth ? { authorization: auth } : {};
  return new Request('https://dash.example/api/tasks', { method, headers });
}

function rows(from, n, extra = {}) {
  return Array.from({ length: n }, (_, i) => ({
    short_id: from + i, title: `t${from + i}`, status: 'open', owner: 'lucas',
    addressed_to: null, needed_by: null, updated_at: '2026-11-20T00:00:00Z', closed_at: null, ...extra,
  }));
}

// Every response goes through here. It reads the body once, checks it, and hands
// back { res, text, body }. The checks fail the calling test on any response that
// leaks a secret marker, or any 200 whose shape is wider than the contract.
async function run(request, env, createClient) {
  const res = await handleTasks(request, { env, createClient });
  // Both checked here as well as in afterEach, so the failure lands on the test that
  // caused it, and before any later assertion in that test can fail first.
  assert.equal(fetchCalls.length, 0, `global fetch was called: ${fetchCalls.join(' | ')}`);
  const logged = errorLog.join('\n');
  for (const m of SECRET_MARKERS) assert.ok(!logged.includes(m), `secret marker in the server log: ${m}`);
  const text = await res.text();
  for (const m of SECRET_MARKERS) assert.ok(!text.includes(m), `secret marker in a ${res.status} body: ${m}`);
  let body = null;
  if (res.status === 200) {
    body = JSON.parse(text);
    if (body.configured === false) {
      assert.deepEqual(Object.keys(body), ['configured'], 'unconfigured body is exactly { configured }');
    } else {
      assert.deepEqual(Object.keys(body).sort(), TOP_LEVEL_KEYS, 'exact top-level keys');
      for (const r of [...body.open, ...body.closed]) {
        for (const k of Object.keys(r)) assert.ok(EXPECTED_COLUMNS.includes(k), `row key outside the eight columns: ${k}`);
      }
    }
  }
  return { res, text, body };
}

// Apply a builder's recorded read filters to a dataset, the way PostgREST would.
function applyFilters(data, calls) {
  let out = data.slice();
  let limit = Infinity;
  for (const c of calls) {
    const [col, a, b] = c.args;
    if (c.op === 'in') out = out.filter((r) => a.includes(r[col]));
    else if (c.op === 'not') {
      assert.equal(a, 'in', 'fake supports not(col, "in", "(a,b)") only');
      const list = String(b).replace(/^\(|\)$/g, '').split(',');
      out = out.filter((r) => !list.includes(r[col]));
    } else if (c.op === 'gt') out = out.filter((r) => r[col] > a);
    else if (c.op === 'gte') out = out.filter((r) => r[col] != null && r[col] >= a);
    else if (c.op === 'order') out.sort((x, y) => (x[col] > y[col] ? 1 : x[col] < y[col] ? -1 : 0));
    else if (c.op === 'limit') limit = col;
  }
  return out.slice(0, limit);
}

// A recording fake.
//   pages.open / pages.closed: queues of row arrays, one per awaited query; an
//     exhausted queue yields [] (a zero-row page). Routed by the read's status filter.
//   dataset: instead of pages, a table of rows the builder's filters are APPLIED to.
//   error: every query returns this database error.
//   endless: every read always has one more row.
function makeFake({ pages = {}, dataset = null, error = null, endless = false } = {}) {
  const log = [];
  const violations = [];
  const queues = { open: [...(pages.open || [])], closed: [...(pages.closed || [])] };
  const factoryCalls = [];
  const builders = [];

  function builder(table) {
    const calls = [];
    const b = {};
    for (const op of READ_OPS) {
      b[op] = (...args) => { calls.push({ op, args }); log.push({ on: table, op, args }); return b; };
    }
    for (const op of WRITE_OPS) {
      b[op] = (...args) => {
        violations.push(`${op} on ${table}`);
        log.push({ on: table, op, args });
        throw new Error(`fake: ${op} is forbidden`);
      };
    }
    b.rpc = () => { violations.push('rpc on builder'); throw new Error('fake: rpc is forbidden'); };
    b.then = (resolve, reject) => {
      if (error) return Promise.resolve({ data: null, error }).then(resolve, reject);
      if (table !== 'tasks') return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      let data;
      if (dataset) {
        data = applyFilters(dataset, calls);
      } else if (endless) {
        const gt = calls.find((c) => c.op === 'gt');
        data = rows(gt ? gt.args[1] + 1 : 1, 1);
      } else {
        const inCall = calls.find((c) => c.op === 'in' && c.args[0] === 'status');
        const which = inCall && inCall.args[1].includes('done') ? 'closed' : 'open';
        data = queues[which].length ? queues[which].shift() : [];
      }
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    };
    b.calls = calls;
    return b;
  }

  const client = {
    from(table) {
      log.push({ on: 'client', op: 'from', args: [table] });
      const b = builder(table);
      builders.push({ table, b });
      return b;
    },
    rpc(...args) {
      violations.push(`rpc ${args[0]}`);
      log.push({ on: 'client', op: 'rpc', args });
      throw new Error('fake: rpc is forbidden');
    },
  };
  for (const op of WRITE_OPS) {
    client[op] = () => { violations.push(`${op} on client`); throw new Error(`fake: ${op} is forbidden`); };
  }

  const createClient = async (url, key) => {
    factoryCalls.push({ url, key });
    return client;
  };
  return { createClient, log, violations, factoryCalls, builders };
}

// The shape of one read chain: its filters, with the paging calls (gt / order / limit)
// and the cutoff's VALUE left out, so every page of one read has the same shape.
function chainShape(b) {
  return JSON.stringify(b.calls
    .filter((c) => !['gt', 'order', 'limit'].includes(c.op))
    .map((c) => (c.op === 'gte' ? { op: c.op, col: c.args[0] } : { op: c.op, args: c.args })));
}
const OPEN_SHAPE = JSON.stringify([
  { op: 'select', args: [EXPECTED_COLUMNS.join(', ')] },
  { op: 'not', args: ['status', 'in', '(done,decided_against)'] },
]);
const CLOSED_SHAPE = JSON.stringify([
  { op: 'select', args: [EXPECTED_COLUMNS.join(', ')] },
  { op: 'in', args: ['status', CLOSED] },
  { op: 'gte', col: 'closed_at' },
]);

// ---------------------------------------------------------------------------
// The auth suite: no task data without valid Basic auth.
// ---------------------------------------------------------------------------

const AUTH_CASES = [
  ['no Authorization header', () => req('GET', null), fullEnv()],
  ['a wrong password', () => req('GET', basic('evryn', 'wrong')), fullEnv()],
  ['a wrong user', () => req('GET', basic('justin', PASSWORD)), fullEnv()],
  ['DASHBOARD_PASSWORD unset', () => req('GET', basic('evryn', PASSWORD)), fullEnv({ DASHBOARD_PASSWORD: undefined })],
  ['DASHBOARD_PASSWORD empty, empty password sent', () => req('GET', basic('evryn', '')), fullEnv({ DASHBOARD_PASSWORD: '' })],
  ['a non-Basic scheme', () => req('GET', 'Bearer ' + PASSWORD), fullEnv()],
  ['a header that is not base64', () => req('GET', 'Basic %%%not-base64%%%'), fullEnv()],
];

for (const [name, makeReq, env] of AUTH_CASES) {
  test(`auth: ${name} -> 401 and the client is never created`, async () => {
    const fake = makeFake({ pages: { open: [rows(1, 3)] } });
    const { res, text } = await run(makeReq(), env, fake.createClient);
    assert.equal(res.status, 401);
    assert.ok(!text.includes('t1'), 'no task data in a 401 body');
    assert.equal(fake.factoryCalls.length, 0, 'client factory must not run');
    assert.equal(fake.log.length, 0, 'no query may be made');
  });
}

test('auth: a non-GET without valid auth is a 401, not a 405 (auth runs first)', async () => {
  const fake = makeFake();
  const { res } = await run(req('POST', null), fullEnv(), fake.createClient);
  assert.equal(res.status, 401);
  assert.equal(fake.factoryCalls.length, 0);
});

test('auth: valid credentials get 200 (control: the gate is not simply closed)', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 1)] } });
  const { res } = await run(req(), fullEnv(), fake.createClient);
  assert.equal(res.status, 200);
});

// ---------------------------------------------------------------------------
// The read-only suite.
// ---------------------------------------------------------------------------

for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']) {
  test(`read-only: ${method} with valid auth -> 405 with Allow: GET, and no client`, async () => {
    const fake = makeFake();
    const { res } = await run(req(method), fullEnv(), fake.createClient);
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'GET');
    assert.equal(fake.factoryCalls.length, 0, 'client factory must not run');
  });
}

test('read-only: only from("tasks") + the exact eight columns + read filters; nothing else', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2)], closed: [rows(50, 1)] } });
  const { res } = await run(req(), fullEnv(), fake.createClient);
  assert.equal(res.status, 200);
  assert.deepEqual(fake.violations, [], 'no write, rpc or other call');
  assert.equal(fake.factoryCalls.length, 1);
  assert.deepEqual(fake.factoryCalls[0], { url: URL_SECRET, key: KEY_SECRET });

  const froms = fake.log.filter((c) => c.op === 'from').map((c) => c.args[0]);
  assert.ok(froms.length > 0);
  assert.ok(froms.every((t) => t === 'tasks'), `only tasks is read, got ${froms}`);

  for (const c of fake.log) {
    if (c.on === 'client') assert.equal(c.op, 'from', `client.${c.op} is not a read`);
    else assert.ok(READ_OPS.has(c.op), `builder.${c.op} is not a read op`);
  }

  const selects = fake.log.filter((c) => c.op === 'select');
  assert.ok(selects.length > 0);
  for (const s of selects) {
    assert.equal(s.args.length, 1, 'select takes the column list only');
    const cols = String(s.args[0]).split(',').map((x) => x.trim());
    assert.deepEqual(cols, EXPECTED_COLUMNS);
  }
});

test('read-only: exactly two reads per request: not-closed, and closed in the window', async () => {
  const fake = makeFake(); // both reads end on their first (zero-row) page
  await run(req(), fullEnv(), fake.createClient);
  assert.equal(fake.builders.length, 2, 'exactly two read chains');
  const shapes = fake.builders.map(({ b }) => chainShape(b)).sort();
  assert.deepEqual(shapes, [CLOSED_SHAPE, OPEN_SHAPE].sort(), 'one open read and one closed read, each exactly');
});

test('read-only: across paging, every page belongs to one of exactly those two reads', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2), rows(3, 1)], closed: [rows(10, 1)] } });
  await run(req(), fullEnv(), fake.createClient);
  const shapes = new Set(fake.builders.map(({ b }) => chainShape(b)));
  assert.equal(shapes.size, 2, 'two distinct read shapes, no third');
  for (const s of shapes) assert.ok(s === OPEN_SHAPE || s === CLOSED_SHAPE, `unexpected read: ${s}`);
});

test('read-only: the closed window is 30 days, pinned to a literal', async () => {
  assert.equal(CLOSED_WINDOW_DAYS, WINDOW_DAYS_LITERAL, 'the exported window is 30 days');
  const before = Date.now();
  const fake = makeFake();
  await run(req(), fullEnv(), fake.createClient);
  const closed = fake.builders.filter(({ b }) => chainShape(b) === CLOSED_SHAPE);
  assert.equal(closed.length, 1);
  const gte = closed[0].b.calls.find((c) => c.op === 'gte');
  const t = new Date(gte.args[1]).getTime();
  const expected = before - WINDOW_DAYS_LITERAL * 86400000;
  assert.ok(Math.abs(t - expected) < 60000, `cutoff is ~30 days ago (off by ${Math.round((t - expected) / 86400000)} days)`);
});

test('read-only: against a filtering table, an unknown status comes back in open; old closed rows do not', async () => {
  const now = Date.now();
  const dataset = [
    ...rows(1, 1, { status: 'open' }),
    ...rows(2, 1, { status: 'awaiting_review' }),
    ...rows(3, 1, { status: 'done', closed_at: new Date(now - 2 * 86400000).toISOString() }),
    ...rows(4, 1, { status: 'decided_against', closed_at: new Date(now - 40 * 86400000).toISOString() }),
    ...rows(5, 1, { status: 'done', closed_at: '2020-01-01T00:00:00Z' }),
  ];
  const fake = makeFake({ dataset });
  const { body } = await run(req(), fullEnv(), fake.createClient);
  assert.deepEqual(body.open.map((r) => r.short_id), [1, 2], 'open includes the unknown status');
  assert.deepEqual(body.open.map((r) => r.status), ['open', 'awaiting_review']);
  assert.deepEqual(body.closed.map((r) => r.short_id), [3], 'only the closure inside 30 days');
});

test('response: configured, fetched_at, rows split open/closed, truncated false, no-store', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2)], closed: [rows(10, 1)] } });
  const { res, body } = await run(req(), fullEnv(), fake.createClient);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(body.configured, true);
  assert.ok(!Number.isNaN(Date.parse(body.fetched_at)));
  assert.deepEqual(body.open.map((r) => r.short_id), [1, 2]);
  assert.deepEqual(body.closed.map((r) => r.short_id), [10]);
  assert.equal(body.truncated, false);
});

for (const [name, over] of [
  ['URL unset', { TEAM_SUPABASE_URL: undefined }],
  ['key unset', { TEAM_SUPABASE_SERVICE_ROLE_KEY: undefined }],
  ['both unset', { TEAM_SUPABASE_URL: undefined, TEAM_SUPABASE_SERVICE_ROLE_KEY: undefined }],
]) {
  test(`unconfigured (${name}) -> 200 { configured: false } and no client`, async () => {
    const fake = makeFake();
    const { res, body } = await run(req(), fullEnv(over), fake.createClient);
    assert.equal(res.status, 200);
    assert.deepEqual(body, { configured: false });
    assert.equal(fake.factoryCalls.length, 0);
  });
}

// ---------------------------------------------------------------------------
// Paging.
// ---------------------------------------------------------------------------

test('paging: continues past a FULL page and stops on a zero-row page', async () => {
  const fake = makeFake({ pages: { open: [rows(1, PAGE_SIZE), rows(PAGE_SIZE + 1, 3), []] } });
  const { body } = await run(req(), fullEnv(), fake.createClient);
  assert.equal(body.open.length, PAGE_SIZE + 3);
  assert.equal(body.truncated, false);
});

test('paging: a SHORT page is not the end; only a zero-row page is', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2), rows(3, 1), []] } });
  const { body } = await run(req(), fullEnv(), fake.createClient);
  assert.deepEqual(body.open.map((r) => r.short_id), [1, 2, 3]);
});

test('paging: each next page is keyed on the last short_id seen, ordered by short_id', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2), rows(3, 1), []] } });
  await run(req(), fullEnv(), fake.createClient);
  const openReads = fake.builders.filter(({ b }) => chainShape(b) === OPEN_SHAPE);
  assert.equal(openReads.length, 3, 'three page reads: 2 rows, 1 row, 0 rows');
  const gts = openReads.map(({ b }) => (b.calls.find((c) => c.op === 'gt') || { args: [] }).args);
  assert.deepEqual(gts, [[], ['short_id', 2], ['short_id', 3]]);
  for (const { b } of openReads) {
    const order = b.calls.find((c) => c.op === 'order');
    assert.deepEqual(order.args, ['short_id', { ascending: true }]);
    const limit = b.calls.find((c) => c.op === 'limit');
    assert.equal(limit.args[0], PAGE_SIZE);
  }
});

test('paging: a read that never ends stops at MAX_PAGES and says truncated: true', async () => {
  const fake = makeFake({ endless: true });
  const { body } = await run(req(), fullEnv(), fake.createClient);
  assert.equal(body.truncated, true);
  assert.equal(body.open.length, MAX_PAGES);
});

// ---------------------------------------------------------------------------
// Errors: generic body, sanitized log, never the URL or the key.
// ---------------------------------------------------------------------------

test('error: a database error -> 500 with a generic body; the log names the code only', async () => {
  const fake = makeFake({
    error: { message: `connect failed for ${URL_SECRET} with key ${KEY_SECRET}`, code: 'PGRST000', details: URL_SECRET, hint: KEY_SECRET },
  });
  const { res, text } = await run(req(), fullEnv(), fake.createClient);
  assert.equal(res.status, 500);
  assert.ok(!text.includes('PGRST000'), 'raw error code not in the body');
  assert.ok(!text.includes('connect failed'), 'raw message not in the body');
  const logged = errorLog.join('\n');
  assert.ok(logged.includes('code=PGRST000'), `log names the cause: ${logged}`);
  assert.ok(!logged.includes('connect failed'), 'log has no error message');
});

test('error: a code that is not a plain token logs as unknown', async () => {
  const fake = makeFake({ error: { message: 'x', code: `${URL_SECRET}/oops` } });
  const { res } = await run(req(), fullEnv(), fake.createClient);
  assert.equal(res.status, 500);
  assert.ok(errorLog.join('\n').includes('code=unknown'));
});

test('error: a throwing client factory -> 500; the log carries its name, not its message', async () => {
  const createClient = async () => {
    const e = new TypeError(`bad url ${URL_SECRET} ${KEY_SECRET}`);
    e.code = 'ERR_MODULE_NOT_FOUND';
    throw e;
  };
  const { res } = await run(req(), fullEnv(), createClient);
  assert.equal(res.status, 500);
  const logged = errorLog.join('\n');
  assert.ok(logged.includes('code=ERR_MODULE_NOT_FOUND') && logged.includes('name=TypeError'), `log: ${logged}`);
  assert.ok(!logged.includes('bad url'), 'log has no error message');
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
