import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FAKE_KEY, TEST_ENV, fakeJwt, fakePostgrest, jsonResponse } from '../helpers.mjs';
import { TEAM_REF, teamRestTarget } from '../../lib/config.mjs';
import { RestError, makeRest } from '../../lib/rest.mjs';

const target = teamRestTarget(TEST_ENV);
const rowsOf = (n) => Array.from({ length: n }, (_, i) => ({ short_id: i + 1, title: `t${i + 1}` }));

test('a secret key travels on apikey ONLY, never Authorization; the actor header is sent', async () => {
  const { fetchImpl, calls } = fakePostgrest({ rows: [] });
  await makeRest({ target, actor: 'lucas', fetchImpl }).request('GET', 'tasks?select=id');
  const h = calls[0].init.headers;
  assert.equal(h.apikey, FAKE_KEY);
  assert.equal(h.Authorization, undefined);
  assert.equal(h['x-evryn-actor'], 'lucas');
  assert.ok(calls[0].url.startsWith(`https://${TEAM_REF}.supabase.co/rest/v1/`));
});

test('a legacy service_role JWT is also sent as Authorization: Bearer', async () => {
  const key = fakeJwt({ role: 'service_role', ref: TEAM_REF });
  const legacy = teamRestTarget({ ...TEST_ENV, EVRYN_TEAM_SUPABASE_SECRET_KEY: key });
  const { fetchImpl, calls } = fakePostgrest();
  await makeRest({ target: legacy, actor: 'ac', fetchImpl }).request('GET', 'tasks');
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${key}`);
});

test('R8: 5 rows at a page size of 2 all come back, ending on a zero-row page', async () => {
  const { fetchImpl, calls } = fakePostgrest({ rows: rowsOf(5) });
  const got = await makeRest({ target, fetchImpl }).paginateAll('tasks', 'select=short_id', { pageSize: 2 });
  assert.deepEqual(got.map((r) => r.short_id), [1, 2, 3, 4, 5]);
  assert.equal(calls.length, 4, 'pages of 2, 2, 1, then the empty page');
});

test('R8: a server cap SMALLER than the page size still loses nothing (no short-page termination)', async () => {
  const { fetchImpl } = fakePostgrest({ rows: rowsOf(7), cap: 3 });
  const got = await makeRest({ target, fetchImpl }).paginateAll('tasks', '', { pageSize: 500 });
  assert.equal(got.length, 7);
});

test('R8: 2,500 rows behind a 1,000-row cap all come back', async () => {
  const { fetchImpl } = fakePostgrest({ rows: rowsOf(2500), cap: 1000 });
  const got = await makeRest({ target, fetchImpl }).paginateAll('tasks', '');
  assert.equal(got.length, 2500);
});

test('R8: running out of page budget is LOUD, never a silent prefix', async () => {
  const { fetchImpl } = fakePostgrest({ rows: rowsOf(10) });
  await assert.rejects(makeRest({ target, fetchImpl }).paginateAll('tasks', '', { pageSize: 2, maxPages: 3 }), /page budget exhausted/);
});

test('R8: an out-of-order page is refused', async () => {
  const fetchImpl = async () => jsonResponse(200, [{ short_id: 5 }, { short_id: 3 }]);
  await assert.rejects(makeRest({ target, fetchImpl }).paginateAll('tasks', ''), /not ascending/);
});

test('PostgREST errors surface message, code, hint and details', async () => {
  const fetchImpl = async () => jsonResponse(400, { message: 'task write refused: no actor.', code: 'ET001', hint: 'Send x-evryn-actor', details: null });
  await assert.rejects(makeRest({ target, fetchImpl }).request('POST', 'tasks', { body: {} }), (e) => {
    assert.ok(e instanceof RestError);
    assert.equal(e.code, 'ET001');
    assert.equal(e.hint, 'Send x-evryn-actor');
    assert.match(e.message, /no actor/);
    return true;
  });
});

test('a network error surfaces only its message — never the request, its headers or the key', async () => {
  const fetchImpl = async (url, init) => {
    const err = new Error('fetch failed');
    err.cause = { code: 'ECONNRESET', request: { url, headers: init.headers }, message: `leak ${FAKE_KEY}` };
    throw err;
  };
  await assert.rejects(makeRest({ target, fetchImpl }).request('GET', 'tasks'), (e) => {
    assert.equal(e.message, 'GET tasks: request failed: fetch failed (ECONNRESET)');
    assert.ok(!JSON.stringify({ m: e.message, s: e.stack }).includes(FAKE_KEY));
    return true;
  });
});
