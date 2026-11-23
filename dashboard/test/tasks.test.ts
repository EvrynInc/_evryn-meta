// Tests for dashboard/api/tasks.ts (the Tasks tab's endpoint, task T-142).
//
// Truncation check: the last line of this file reads "FULL FILE LOADED".
//
// Runs with NO install and NO network: `npm test` (node --test, Node 25 strips the
// types). The endpoint is driven through its exported seam, handleTasks(request,
// { env, createClient }), with a FAKE Supabase client that records every call.
//
// WHAT THIS SUITE PINS — the ACCIDENTAL-EDIT classes. On EVERY request, inside run():
//   - no write or rpc on the fake client, and no touch of any client surface the fake
//     does not model (schema, storage, functions, auth, ...: the fake is a Proxy that
//     records any such access, so try/catch or `?.` cannot hide it); reads only from
//     `tasks`, with only read ops;
//   - every select names exactly the eight columns;
//   - exactly the two expected reads (two first pages, each the not-closed or the
//     closed-in-window shape) and a closed window of a literal 30 days;
//   - response headers exactly the allowlist for that status, every non-200 body
//     exactly its fixed string, and no secret marker in any header or body;
//   - a 200 carries exactly its top-level keys, and rows only the eight columns;
//   - nothing sent to console.error carries a secret marker (only console.error is
//     captured; console.log and the other methods are not).
// And for the whole run: the global fetch is replaced BEFORE tasks.ts loads, is never
// restored, and throws synchronously, so a call during a request fails that test, and
// an unhandled deferred call fails the run. A deferred call whose throw is swallowed by
// its own try/catch is NOT caught by the stub; the source-text lint, which keeps network
// and timer APIs out of tasks.ts, is what catches that.
//
// WHAT IT DOES NOT PIN: code written on purpose to slip past it (an encoded secret, an
// indirection built to dodge these checks). No test suite is proof against deliberate
// code; reviewing the diff is that defense.
//
// test/mutation-controls.mjs proves each check above goes red, against deliberately
// broken copies of tasks.ts in a temp folder.

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { format } from 'node:util';
import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// The ambient guards, installed BEFORE tasks.ts loads (it is imported dynamically
// below), and never restored. A reference saved at module load gets this stub too,
// and a deferred call throws an uncaught error that fails the run.
// ---------------------------------------------------------------------------

const fetchCalls = [];
globalThis.fetch = (...args) => {
  fetchCalls.push(args.map((a) => format('%o', a)).join(' '));
  throw new Error('test: global fetch is forbidden');
};

let errorLog = [];
console.error = (...args) => { errorLog.push(format(...args)); };

const { handleTasks, PAGE_SIZE, MAX_PAGES, CLOSED_WINDOW_DAYS } = await import('../api/tasks.ts');

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

// Exact response headers per status: what each path sets today, and nothing more.
const JSON_HEADERS = { 'cache-control': 'no-store', 'content-type': 'application/json' };
const HEADERS_BY_STATUS = {
  200: JSON_HEADERS,
  500: JSON_HEADERS,
  405: { ...JSON_HEADERS, allow: 'GET' },
  401: { 'content-type': 'text/plain;charset=UTF-8', 'www-authenticate': 'Basic realm="Evryn Dashboard"' },
};
// Exact non-200 bodies.
const BODIES_BY_STATUS = {
  401: ['Authentication required', 'Invalid credentials'],
  405: ['{"error":"Method not allowed"}'],
  500: ['{"error":"Failed to load tasks"}'],
};

// Builder methods a read may use. Anything else on a builder, or anything but
// from() on the client, is a violation.
const READ_OPS = new Set(['select', 'in', 'not', 'gt', 'gte', 'order', 'limit']);
const WRITE_OPS = ['insert', 'update', 'upsert', 'delete'];

beforeEach(() => { errorLog = []; });
afterEach(() => {
  assert.equal(fetchCalls.length, 0, `global fetch was called: ${fetchCalls.join(' | ')}`);
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

// The shape of one read chain: its filters, with the paging calls (gt / order / limit)
// and the cutoff's VALUE left out, so every page of one read has the same shape. The
// cutoff value is checked separately, against a literal 30 days.
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

// Every request goes through here. `fake` is a makeFake() result, or { createClient }
// for a factory that throws. All the invariants run on every request, whatever it
// returns, so a behaviour that appears only when there is data cannot hide.
async function run(request, env, fake) {
  const res = await handleTasks(request, { env, createClient: fake.createClient });
  const requestEnded = Date.now();

  // Ambient channels first, so a test fails on the cause, not a symptom.
  assert.equal(fetchCalls.length, 0, `global fetch was called: ${fetchCalls.join(' | ')}`);
  const logged = errorLog.join('\n');
  for (const m of SECRET_MARKERS) assert.ok(!logged.includes(m), `secret marker in the server log: ${m}`);

  // The fake client: writes first, then reads.
  if (fake.violations) {
    assert.deepEqual(fake.violations, [], 'write, rpc or unmodeled access attempted on the fake client');
    for (const c of fake.log) {
      if (c.on === 'client') {
        assert.equal(c.op, 'from', `client.${c.op} is not a read`);
        assert.equal(c.args[0], 'tasks', `read from a table other than tasks: ${c.args[0]}`);
      } else {
        assert.ok(READ_OPS.has(c.op), `builder.${c.op} is not a read op`);
      }
    }
    for (const c of fake.log.filter((x) => x.op === 'select')) {
      assert.equal(c.args.length, 1, 'select takes the column list only');
      assert.deepEqual(String(c.args[0]).split(',').map((x) => x.trim()), EXPECTED_COLUMNS, 'select names exactly the eight columns');
    }
    // Exactly the expected reads, on every request that reads at all.
    if (fake.builders.length > 0) {
      for (const { b } of fake.builders) {
        const s = chainShape(b);
        assert.ok(s === OPEN_SHAPE || s === CLOSED_SHAPE, `unexpected read: ${s}`);
        if (s === CLOSED_SHAPE) {
          const gte = b.calls.find((c) => c.op === 'gte');
          const expected = requestEnded - WINDOW_DAYS_LITERAL * 86400000;
          const off = new Date(gte.args[1]).getTime() - expected;
          assert.ok(Math.abs(off) < 60000, `closed window is not 30 days (off by ${(off / 86400000).toFixed(1)} days)`);
        }
      }
      const firstPages = fake.builders.filter(({ b }) => !b.calls.some((c) => c.op === 'gt'));
      assert.equal(firstPages.length, 2, `exactly two reads expected, saw ${firstPages.length} first pages`);
      assert.deepEqual(firstPages.map(({ b }) => chainShape(b)).sort(), [CLOSED_SHAPE, OPEN_SHAPE].sort(),
        'one not-closed read and one closed read');
    }
  }

  // The response: headers, then body.
  const headers = Object.fromEntries([...res.headers]);
  assert.deepEqual(headers, HEADERS_BY_STATUS[res.status] || { unexpected_status: String(res.status) },
    `response headers are not exactly the allowlist for ${res.status}`);
  for (const [k, v] of Object.entries(headers)) {
    for (const m of SECRET_MARKERS) assert.ok(!k.includes(m) && !v.includes(m), `secret marker in a header: ${k}`);
  }
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
  } else {
    assert.ok((BODIES_BY_STATUS[res.status] || []).includes(text), `non-200 body is not its fixed string: ${JSON.stringify(text)}`);
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

  // Hand out a Proxy: reading ANY property the fake does not model (schema, storage,
  // functions, auth, rest, ...) is recorded as a violation. Without this such a read is
  // just `undefined`, and the TypeError it causes is swallowed by any try/catch or `?.`,
  // so a write through that surface would pass silently. `then` is skipped because
  // `await` probes it on every awaited value.
  const proxied = new Proxy(client, {
    get(target, prop) {
      if (typeof prop === 'symbol' || prop === 'then') return target[prop];
      if (!(prop in target)) {
        violations.push(`unmodeled client property: ${prop}`);
        log.push({ on: 'client', op: `get:${prop}`, args: [] });
      }
      return target[prop];
    },
  });

  const createClient = async (url, key) => {
    factoryCalls.push({ url, key });
    return proxied;
  };
  return { createClient, log, violations, factoryCalls, builders };
}

// ---------------------------------------------------------------------------
// The source-text lint: no network or timer API in tasks.ts, and exactly one
// dynamic import, of @supabase/supabase-js.
// ---------------------------------------------------------------------------

test('source: tasks.ts uses no network or timer API, and imports only @supabase/supabase-js', () => {
  const src = readFileSync(new URL('../api/tasks.ts', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
    .replace(/^\s*\/\/.*$/gm, '');      // whole-line comments; a trailing comment stays in, so
                                        // a listed word in one fails loudly, never silently
  for (const word of ['fetch', 'globalThis', 'setTimeout', 'setInterval', 'WebSocket', 'navigator', 'XMLHttpRequest', 'EventSource']) {
    assert.ok(!new RegExp(`\\b${word}\\b`).test(src), `tasks.ts uses ${word}`);
  }
  assert.ok(!/\brequire\s*\(/.test(src), 'tasks.ts uses require()');
  assert.ok(!/^\s*import\s/m.test(src), 'tasks.ts has a static import');
  const dynamic = [...src.matchAll(/\bimport\s*\(\s*([^)]*)\)/g)].map((m) => m[1].trim());
  assert.deepEqual(dynamic, ["'@supabase/supabase-js'"], `dynamic imports: ${dynamic}`);
});

// ---------------------------------------------------------------------------
// The auth suite: no task data without valid Basic auth.
// ---------------------------------------------------------------------------

const AUTH_CASES = [
  ['no Authorization header', () => req('GET', null), fullEnv(), 'Authentication required'],
  ['a wrong password', () => req('GET', basic('evryn', 'wrong')), fullEnv(), 'Invalid credentials'],
  ['a wrong user', () => req('GET', basic('justin', PASSWORD)), fullEnv(), 'Invalid credentials'],
  ['DASHBOARD_PASSWORD unset', () => req('GET', basic('evryn', PASSWORD)), fullEnv({ DASHBOARD_PASSWORD: undefined }), 'Invalid credentials'],
  ['DASHBOARD_PASSWORD empty, empty password sent', () => req('GET', basic('evryn', '')), fullEnv({ DASHBOARD_PASSWORD: '' }), 'Invalid credentials'],
  ['a non-Basic scheme', () => req('GET', 'Bearer ' + PASSWORD), fullEnv(), 'Authentication required'],
  ['a header that is not base64', () => req('GET', 'Basic %%%not-base64%%%'), fullEnv(), 'Invalid credentials'],
];

for (const [name, makeReq, env, expectedBody] of AUTH_CASES) {
  test(`auth: ${name} -> 401 and the client is never created`, async () => {
    const fake = makeFake({ pages: { open: [rows(1, 3)] } });
    const { res, text } = await run(makeReq(), env, fake);
    assert.equal(res.status, 401);
    assert.equal(text, expectedBody);
    assert.equal(fake.factoryCalls.length, 0, 'client factory must not run');
    assert.equal(fake.log.length, 0, 'no query may be made');
  });
}

test('auth: a non-GET without valid auth is a 401, not a 405 (auth runs first)', async () => {
  const fake = makeFake();
  const { res } = await run(req('POST', null), fullEnv(), fake);
  assert.equal(res.status, 401);
  assert.equal(fake.factoryCalls.length, 0);
});

test('auth: valid credentials get 200 (control: the gate is not simply closed)', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 1)] } });
  const { res } = await run(req(), fullEnv(), fake);
  assert.equal(res.status, 200);
});

// ---------------------------------------------------------------------------
// The read-only suite.
// ---------------------------------------------------------------------------

for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']) {
  test(`read-only: ${method} with valid auth -> 405 with Allow: GET, and no client`, async () => {
    const fake = makeFake();
    const { res } = await run(req(method), fullEnv(), fake);
    assert.equal(res.status, 405);
    assert.equal(fake.factoryCalls.length, 0, 'client factory must not run');
  });
}

test('read-only: the client is made with the configured URL and key, and reads happen', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2)], closed: [rows(50, 1)] } });
  const { res } = await run(req(), fullEnv(), fake);
  assert.equal(res.status, 200);
  assert.deepEqual(fake.factoryCalls, [{ url: URL_SECRET, key: KEY_SECRET }]);
  assert.ok(fake.builders.length > 0, 'the endpoint read something');
});

test('read-only: the exported window is 30 days', () => {
  assert.equal(CLOSED_WINDOW_DAYS, WINDOW_DAYS_LITERAL);
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
  const { body } = await run(req(), fullEnv(), fake);
  assert.deepEqual(body.open.map((r) => r.short_id), [1, 2], 'open includes the unknown status');
  assert.deepEqual(body.open.map((r) => r.status), ['open', 'awaiting_review']);
  assert.deepEqual(body.closed.map((r) => r.short_id), [3], 'only the closure inside 30 days');
});

test('realistic data: every open status, addressed to justin and lucas, plus a recent closure', async () => {
  const OPEN_STATUSES_LITERAL = ['backlog', 'proposed', 'open', 'in_progress', 'blocked', 'needs_acceptance'];
  const openRows = OPEN_STATUSES_LITERAL.map((status, i) => rows(i + 1, 1, {
    status,
    addressed_to: i % 2 === 0 ? 'justin' : 'lucas',
    needed_by: '2026-12-01',
  })[0]);
  const doneRow = rows(20, 1, { status: 'done', closed_at: new Date(Date.now() - 3 * 86400000).toISOString() })[0];
  const fake = makeFake({ dataset: [...openRows, doneRow] });
  const { body } = await run(req(), fullEnv(), fake);
  assert.deepEqual(body.open, openRows, 'open rows come back exactly as stored');
  assert.deepEqual(body.closed, [doneRow], 'the recent closure comes back exactly as stored');
});

test('response: configured, fetched_at, rows split open/closed, truncated false', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2)], closed: [rows(10, 1)] } });
  const { body } = await run(req(), fullEnv(), fake);
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
    const { res, body } = await run(req(), fullEnv(over), fake);
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
  const { body } = await run(req(), fullEnv(), fake);
  assert.equal(body.open.length, PAGE_SIZE + 3);
  assert.equal(body.truncated, false);
});

test('paging: a SHORT page is not the end; only a zero-row page is', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2), rows(3, 1), []] } });
  const { body } = await run(req(), fullEnv(), fake);
  assert.deepEqual(body.open.map((r) => r.short_id), [1, 2, 3]);
});

test('paging: each next page is keyed on the last short_id seen, ordered by short_id', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2), rows(3, 1), []] } });
  await run(req(), fullEnv(), fake);
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
  const { body } = await run(req(), fullEnv(), fake);
  assert.equal(body.truncated, true);
  assert.equal(body.open.length, MAX_PAGES);
});

// ---------------------------------------------------------------------------
// Errors: fixed body, sanitized log, never the URL or the key.
// ---------------------------------------------------------------------------

test('error: a database error -> 500 with the fixed body; the log names the code only', async () => {
  const fake = makeFake({
    error: { message: `connect failed for ${URL_SECRET} with key ${KEY_SECRET}`, code: 'PGRST000', details: URL_SECRET, hint: KEY_SECRET },
  });
  const { res } = await run(req(), fullEnv(), fake);
  assert.equal(res.status, 500);
  const logged = errorLog.join('\n');
  assert.ok(logged.includes('code=PGRST000'), `log names the cause: ${logged}`);
  assert.ok(!logged.includes('connect failed'), 'log has no error message');
});

test('error: a code that is not a plain token logs as unknown', async () => {
  const fake = makeFake({ error: { message: 'x', code: `${URL_SECRET}/oops` } });
  const { res } = await run(req(), fullEnv(), fake);
  assert.equal(res.status, 500);
  assert.ok(errorLog.join('\n').includes('code=unknown'));
});

test('error: a throwing client factory -> 500; the log carries its name, not its message', async () => {
  const createClient = async () => {
    const e = new TypeError(`bad url ${URL_SECRET} ${KEY_SECRET}`);
    e.code = 'ERR_MODULE_NOT_FOUND';
    throw e;
  };
  const { res } = await run(req(), fullEnv(), { createClient });
  assert.equal(res.status, 500);
  const logged = errorLog.join('\n');
  assert.ok(logged.includes('code=ERR_MODULE_NOT_FOUND') && logged.includes('name=TypeError'), `log: ${logged}`);
  assert.ok(!logged.includes('bad url'), 'log has no error message');
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
