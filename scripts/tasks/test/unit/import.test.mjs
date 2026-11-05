import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FAKE_KEY, TEST_ENV, jsonResponse } from '../helpers.mjs';
import { LINEAR_ENDPOINT, OPEN_ISSUES_QUERY, STATUS_MAP, planIssue, renderReport } from '../../lib/linear.mjs';
import { runImport } from '../../import-linear.mjs';

const LINEAR_KEY = 'lin_' + 'api_SENTINEL_never_print_123';

function issue(id, { title = `Ticket ${id}`, state = 'Backlog', labels = ['R: lucas', 'A: justin'], description = '', dueDate = null } = {}) {
  return { identifier: `EVR-${id}`, title, description, dueDate, url: `https://linear.app/evryn/issue/EVR-${id}`, state: { name: state, type: 'unstarted' }, labels: { nodes: labels.map((name) => ({ name })) } };
}

/** Fake Linear (GraphQL, paginated) + fake team PostgREST. Records every call. */
function fakeWorld(issues, { pageSize = 2, existing = [] } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url === LINEAR_ENDPOINT) {
      const { variables } = JSON.parse(init.body);
      const start = variables.after ? Number(variables.after) : 0;
      const nodes = issues.slice(start, start + pageSize);
      const next = start + pageSize;
      return jsonResponse(200, { data: { issues: { nodes, pageInfo: { hasNextPage: next < issues.length, endCursor: String(next) } } } });
    }
    if (init.method === 'GET') {
      const u = new URL(url);
      const after = u.searchParams.get('short_id');
      return jsonResponse(200, after ? [] : existing.map((l, i) => ({ short_id: i + 1, linear_id: l })));
    }
    return jsonResponse(201, [{ short_id: 50 }]);
  };
  return { fetchImpl, calls };
}

async function runIt(argv, world, env = { ...TEST_ENV, LINEAR_API_KEY: LINEAR_KEY }) {
  let out = '';
  let err = '';
  const code = await runImport(argv, { env, fetchImpl: world.fetchImpl, out: (s) => (out += s), err: (s) => (err += `${s}\n`) });
  return { code, out, err };
}

test('the Linear query is read-only (no mutation) and scoped to team Evryn, open states only', () => {
  assert.doesNotMatch(OPEN_ISSUES_QUERY, /mutation/i);
  assert.match(OPEN_ISSUES_QUERY, /team: \{ name: \{ eq: "Evryn" \} \}/);
  assert.match(OPEN_ISSUES_QUERY, /nin: \["completed", "canceled"\]/);
});

test('"Authorized" maps to open — NOT to any authorized state — and the verbatim status is kept', () => {
  assert.equal(STATUS_MAP.Authorized, 'open');
  const p = planIssue(issue(1, { state: 'Authorized' }));
  assert.equal(p.row.status, 'open');
  assert.equal(p.row.linear_status, 'Authorized');
  assert.equal(planIssue(issue(2, { state: 'Needs Authorization' })).row.status, 'proposed');
});

test('a title over 80 characters FAILS the ticket and is never truncated', () => {
  const long = 'x'.repeat(81);
  const p = planIssue(issue(3, { title: long }));
  assert.equal(p.verdict, 'fail');
  assert.equal(p.row.title, long);
  assert.match(p.reasons.join(), /81 characters/);
});

test('Nathan\'s tickets are held, not imported', () => {
  assert.equal(planIssue(issue(4, { labels: ['R: nathan', 'A: justin'] })).verdict, 'held');
  assert.equal(planIssue(issue(5, { labels: ['R: lucas', 'C: nathan'] })).verdict, 'held');
});

test('Justin tickets: with a due date → addressed_to justin + needed_by; without → neither, and flagged for the report', () => {
  const dated = planIssue(issue(6, { labels: ['R: justin'], dueDate: '2026-11-20' }));
  assert.equal(dated.row.addressed_to, 'justin');
  assert.equal(dated.row.needed_by, '2026-11-20');
  const undated = planIssue(issue(7, { labels: ['R: justin'] }));
  assert.equal(undated.row.addressed_to, undefined);
  assert.equal(undated.row.needed_by, undefined);
  assert.equal(undated.justinNoDate, true);
  assert.equal(undated.verdict, 'import');
});

test('owner and accountable carry over; C/I become raci lists; other labels become tags', () => {
  const p = planIssue(issue(8, { labels: ['R: Soren', 'A: lucas', 'C: mira', 'I: thea', 'infra'] }));
  assert.deepEqual(p.row.raci, { r: 'soren', a: 'lucas', c: ['mira'], i: ['thea'] });
  assert.deepEqual(p.row.tags, ['infra']);
  assert.equal(planIssue(issue(9, { labels: ['R: emma'] })).row.raci.a, 'justin');
});

test('no owner, two owners, unmapped status, email → fail; phone → warning only', () => {
  assert.equal(planIssue(issue(10, { labels: [] })).verdict, 'fail');
  assert.equal(planIssue(issue(11, { labels: ['R: a', 'R: b'] })).verdict, 'fail');
  assert.equal(planIssue(issue(12, { state: 'Triage' })).verdict, 'fail');
  assert.equal(planIssue(issue(13, { description: 'ping x@y.com' })).verdict, 'fail');
  const phone = planIssue(issue(14, { description: 'vendor 206-555-0100' }));
  assert.equal(phone.verdict, 'import');
  assert.match(phone.warnings.join(), /phone/);
});

test('a body over 600 fails by default; --long-body pointer replaces it with a pointer', () => {
  const big = 'b'.repeat(700);
  assert.equal(planIssue(issue(15, { description: big })).verdict, 'fail');
  const p = planIssue(issue(15, { description: big }), { longBody: 'pointer' });
  assert.equal(p.verdict, 'import');
  assert.match(p.row.description, /stays in Linear EVR-15/);
  assert.ok(p.row.description.length <= 600);
});

test('the report lists every ticket, the long titles, and the undated Justin tickets with a count and headlines', () => {
  const plans = [planIssue(issue(1)), planIssue(issue(2, { title: 'y'.repeat(85) })), planIssue(issue(3, { title: 'Sign the lease', labels: ['R: justin'] }))];
  const r = renderReport(plans, { mode: 'dry-run' });
  assert.match(r, /DRY RUN/);
  assert.match(r, /\| EVR-1 \| open \| "Backlog" \| ok \|/);
  assert.match(r, /Titles over 80 characters \(1\)/);
  assert.match(r, /Justin tickets with NO due date \(1\)[^\n]*\n- EVR-3: Sign the lease/);
});

test('dry run (the default): reads Linear to the end, touches NO team endpoint, never prints the key', async () => {
  const issues = Array.from({ length: 5 }, (_, i) => issue(i + 1));
  const world = fakeWorld(issues);
  const r = await runIt([], world);
  assert.equal(r.code, 0, r.err);
  assert.ok(world.calls.every((c) => c.url === LINEAR_ENDPOINT), 'a non-Linear request in a dry run');
  assert.equal(world.calls.length, 3, 'three pages of 2');
  assert.match(r.out, /Open tickets read: 5/);
  assert.ok(world.calls.every((c) => c.init.method === 'POST' && !/mutation/i.test(c.init.body)));
  assert.ok(!`${r.out}${r.err}`.includes(LINEAR_KEY));
});

test('--apply: writes as actor ac, skips tickets already imported (idempotent on linear_id), never writes to Linear', async () => {
  const issues = [issue(1), issue(2), issue(3, { title: 'z'.repeat(90) })];
  const world = fakeWorld(issues, { existing: ['EVR-1'] });
  const r = await runIt(['--apply'], world);
  assert.equal(r.code, 0, r.err);
  const posts = world.calls.filter((c) => c.url.includes('/rest/v1/tasks') && c.init.method === 'POST');
  assert.equal(posts.length, 1, 'only EVR-2 should be inserted');
  assert.equal(JSON.parse(posts[0].init.body).linear_id, 'EVR-2');
  assert.equal(posts[0].init.headers['x-evryn-actor'], 'ac');
  assert.match(r.out, /inserted 1 · already imported \(skipped\): 1/);
  assert.ok(!`${r.out}${r.err}`.includes(FAKE_KEY));
});

test('--apply with a product URL refuses before reading Linear or writing anything', async () => {
  const world = fakeWorld([issue(1)]);
  const r = await runIt(['--apply'], world, { EVRYN_TEAM_SUPABASE_URL: 'https://productref1234567890.supabase.co', EVRYN_TEAM_SUPABASE_SECRET_KEY: FAKE_KEY, LINEAR_API_KEY: LINEAR_KEY });
  assert.equal(r.code, 1);
  assert.equal(world.calls.length, 0);
  assert.match(r.err, /does not point at the Evryn Team project/);
});

test('a missing LINEAR_API_KEY is named; a Linear error is loud and keyless', async () => {
  const r = await runIt([], fakeWorld([]), { ...TEST_ENV });
  assert.equal(r.code, 1);
  assert.match(r.err, /missing variable: LINEAR_API_KEY/);
  const failing = { fetchImpl: async () => jsonResponse(200, { errors: [{ message: 'Authentication required' }] }) };
  const r2 = await runIt([], failing);
  assert.equal(r2.code, 1);
  assert.match(r2.err, /Linear query failed: Authentication required/);
});
