// Tests for dashboard/api/tasks.ts (the Tasks tab's endpoint, task T-142).
//
// Truncation check: the last line of this file reads "FULL FILE LOADED".
//
// Runs with NO install and NO network: `npm test` (node --test, Node 25 strips the
// types). The endpoint is driven through its exported seam, handleTasks(request,
// { env, createClient }), with a FAKE Supabase client that records every call and
// fails the test the moment anything but a read on `tasks` is attempted.
//
// Every test here is proven able to fail by test/mutation-controls.mjs, which runs
// this suite against deliberately broken copies of tasks.ts in a temp folder.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleTasks,
  PAGE_SIZE,
  MAX_PAGES,
  CLOSED_WINDOW_DAYS,
} from '../api/tasks.ts';

const URL_SECRET = 'https://fakeproject-secret.supabase.co';
const KEY_SECRET = 'service-role-key-SECRET-do-not-leak';
const PASSWORD = 'correct-horse';

const EXPECTED_COLUMNS = [
  'short_id', 'title', 'status', 'owner', 'addressed_to', 'needed_by', 'updated_at', 'closed_at',
];
const OPEN = ['backlog', 'proposed', 'open', 'in_progress', 'blocked', 'needs_acceptance'];
const CLOSED = ['done', 'decided_against'];

// Builder methods a read may use. Anything else on a builder, or anything but
// from() on the client, is a violation.
const READ_OPS = new Set(['select', 'in', 'gt', 'gte', 'order', 'limit']);
const WRITE_OPS = ['insert', 'update', 'upsert', 'delete'];

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

function rows(from, n) {
  return Array.from({ length: n }, (_, i) => ({
    short_id: from + i, title: `t${from + i}`, status: 'open', owner: 'lucas',
    addressed_to: null, needed_by: null, updated_at: '2026-11-20T00:00:00Z', closed_at: null,
  }));
}

// A recording fake. pages.open / pages.closed are queues of row arrays, one per
// awaited query; an exhausted queue yields [] (a zero-row page). `error` makes
// every query return a database error. `endless` makes a read never end.
function makeFake({ pages = {}, error = null, endless = false } = {}) {
  const log = [];        // every call: { on, op, args }
  const violations = []; // anything that is not a read on tasks
  const queues = { open: [...(pages.open || [])], closed: [...(pages.closed || [])] };
  const factoryCalls = [];

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
    b.rpc = (...args) => { violations.push('rpc on builder'); throw new Error('fake: rpc is forbidden'); };
    b.then = (resolve, reject) => {
      if (error) return Promise.resolve({ data: null, error }).then(resolve, reject);
      if (table !== 'tasks') return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      const inCall = calls.find((c) => c.op === 'in' && c.args[0] === 'status');
      const which = inCall && inCall.args[1].includes('done') ? 'closed' : 'open';
      let data;
      if (endless) {
        const gt = calls.find((c) => c.op === 'gt');
        const start = gt ? gt.args[1] + 1 : 1;
        data = rows(start, 1);
      } else {
        data = queues[which].length ? queues[which].shift() : [];
      }
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    };
    b.calls = calls;
    return b;
  }

  const builders = [];
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

async function body(res) {
  return JSON.parse(await res.text());
}

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
    const res = await handleTasks(makeReq(), { env, createClient: fake.createClient });
    assert.equal(res.status, 401);
    const text = await res.text();
    assert.ok(!text.includes('t1'), 'no task data in a 401 body');
    assert.equal(fake.factoryCalls.length, 0, 'client factory must not run');
    assert.equal(fake.log.length, 0, 'no query may be made');
  });
}

test('auth: a non-GET without valid auth is a 401, not a 405 (auth runs first)', async () => {
  const fake = makeFake();
  const res = await handleTasks(req('POST', null), { env: fullEnv(), createClient: fake.createClient });
  assert.equal(res.status, 401);
  assert.equal(fake.factoryCalls.length, 0);
});

test('auth: valid credentials get 200 (control: the gate is not simply closed)', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 1)] } });
  const res = await handleTasks(req(), { env: fullEnv(), createClient: fake.createClient });
  assert.equal(res.status, 200);
});

// ---------------------------------------------------------------------------
// The read-only suite.
// ---------------------------------------------------------------------------

for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
  test(`read-only: ${method} -> 405 with Allow: GET, and no client`, async () => {
    const fake = makeFake();
    const res = await handleTasks(req(method), { env: fullEnv(), createClient: fake.createClient });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'GET');
    assert.equal(fake.factoryCalls.length, 0, 'client factory must not run');
  });
}

test('read-only: only from("tasks") + the exact eight columns + read filters; nothing else', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2)], closed: [rows(50, 1)] } });
  const res = await handleTasks(req(), { env: fullEnv(), createClient: fake.createClient });
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

test('read-only: the two reads filter by the right statuses and the 30-day closed window', async () => {
  const before = Date.now();
  const fake = makeFake();
  await handleTasks(req(), { env: fullEnv(), createClient: fake.createClient });
  const statusSets = fake.builders.map(({ b }) =>
    (b.calls.find((c) => c.op === 'in' && c.args[0] === 'status') || { args: [null, []] }).args[1]);
  assert.ok(statusSets.some((s) => JSON.stringify(s) === JSON.stringify(OPEN)), 'an open read');
  assert.ok(statusSets.some((s) => JSON.stringify(s) === JSON.stringify(CLOSED)), 'a closed read');

  const closedBuilders = fake.builders.filter(({ b }) =>
    b.calls.some((c) => c.op === 'in' && JSON.stringify(c.args[1]) === JSON.stringify(CLOSED)));
  for (const { b } of closedBuilders) {
    const gte = b.calls.find((c) => c.op === 'gte');
    assert.ok(gte, 'closed read has a closed_at lower bound');
    assert.equal(gte.args[0], 'closed_at');
    const t = new Date(gte.args[1]).getTime();
    const expected = before - CLOSED_WINDOW_DAYS * 86400000;
    assert.ok(Math.abs(t - expected) < 60000, 'cutoff is ~30 days ago');
  }
  const openBuilders = fake.builders.filter(({ b }) =>
    b.calls.some((c) => c.op === 'in' && JSON.stringify(c.args[1]) === JSON.stringify(OPEN)));
  for (const { b } of openBuilders) {
    assert.ok(!b.calls.some((c) => c.op === 'gte'), 'open read has no date bound');
  }
});

test('response: configured, fetched_at, rows split open/closed, truncated false, no-store', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2)], closed: [rows(10, 1)] } });
  const res = await handleTasks(req(), { env: fullEnv(), createClient: fake.createClient });
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const b = await body(res);
  assert.equal(b.configured, true);
  assert.ok(!Number.isNaN(Date.parse(b.fetched_at)));
  assert.deepEqual(b.open.map((r) => r.short_id), [1, 2]);
  assert.deepEqual(b.closed.map((r) => r.short_id), [10]);
  assert.equal(b.truncated, false);
});

for (const [name, over] of [
  ['URL unset', { TEAM_SUPABASE_URL: undefined }],
  ['key unset', { TEAM_SUPABASE_SERVICE_ROLE_KEY: undefined }],
  ['both unset', { TEAM_SUPABASE_URL: undefined, TEAM_SUPABASE_SERVICE_ROLE_KEY: undefined }],
]) {
  test(`unconfigured (${name}) -> 200 { configured: false } and no client`, async () => {
    const fake = makeFake();
    const res = await handleTasks(req(), { env: fullEnv(over), createClient: fake.createClient });
    assert.equal(res.status, 200);
    assert.deepEqual(await body(res), { configured: false });
    assert.equal(fake.factoryCalls.length, 0);
  });
}

// ---------------------------------------------------------------------------
// Paging.
// ---------------------------------------------------------------------------

test('paging: continues past a FULL page and stops on a zero-row page', async () => {
  const fake = makeFake({ pages: { open: [rows(1, PAGE_SIZE), rows(PAGE_SIZE + 1, 3), []] } });
  const b = await body(await handleTasks(req(), { env: fullEnv(), createClient: fake.createClient }));
  assert.equal(b.open.length, PAGE_SIZE + 3);
  assert.equal(b.truncated, false);
});

test('paging: a SHORT page is not the end; only a zero-row page is', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2), rows(3, 1), []] } });
  const b = await body(await handleTasks(req(), { env: fullEnv(), createClient: fake.createClient }));
  assert.deepEqual(b.open.map((r) => r.short_id), [1, 2, 3]);
});

test('paging: each next page is keyed on the last short_id seen, ordered by short_id', async () => {
  const fake = makeFake({ pages: { open: [rows(1, 2), rows(3, 1), []] } });
  await handleTasks(req(), { env: fullEnv(), createClient: fake.createClient });
  const openReads = fake.builders.filter(({ b }) =>
    b.calls.some((c) => c.op === 'in' && JSON.stringify(c.args[1]) === JSON.stringify(OPEN)));
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
  const b = await body(await handleTasks(req(), { env: fullEnv(), createClient: fake.createClient }));
  assert.equal(b.truncated, true);
  assert.equal(b.open.length, MAX_PAGES);
});

// ---------------------------------------------------------------------------
// Errors never leak the URL or the key.
// ---------------------------------------------------------------------------

test('error: a database error -> 500 whose body has neither the URL nor the key', async () => {
  const fake = makeFake({
    error: { message: `connect failed for ${URL_SECRET} with key ${KEY_SECRET}`, code: 'PGRST000' },
  });
  const res = await handleTasks(req(), { env: fullEnv(), createClient: fake.createClient });
  assert.equal(res.status, 500);
  const text = await res.text();
  assert.ok(!text.includes(URL_SECRET), 'URL leaked');
  assert.ok(!text.includes('fakeproject-secret'), 'project ref leaked');
  assert.ok(!text.includes(KEY_SECRET), 'key leaked');
  assert.ok(!text.includes('PGRST000'), 'raw error leaked');
});

test('error: a throwing client factory -> 500 with no secret in the body', async () => {
  const createClient = async () => { throw new Error(`bad url ${URL_SECRET} ${KEY_SECRET}`); };
  const res = await handleTasks(req(), { env: fullEnv(), createClient });
  assert.equal(res.status, 500);
  const text = await res.text();
  assert.ok(!text.includes(URL_SECRET) && !text.includes(KEY_SECRET));
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
