import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, compareSnapshots, renderComparison, runCompare } from '../../snapshot-compare.mjs';

// A base snapshot fixture, in schema-snapshot.mjs's line format.
const BASE = `# server_version=17.6
# server_version_num=170006
table tasks: owner=postgres
rls tasks: enabled=true forced=false
column tasks #01 id uuid NOT NULL DEFAULT gen_random_uuid()
constraint tasks.tasks_title_max_80: CHECK ((char_length(title) <= 80))
index tasks.tasks_short_id_key: CREATE UNIQUE INDEX tasks_short_id_key ON public.tasks USING btree (short_id)
trigger tasks.tasks_before_write: CREATE TRIGGER tasks_before_write BEFORE INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION tasks_before_write() [enabled=O]
policy tasks.service_role_only: PERMISSIVE ALL to service_role using (true) with check (true)
grant tasks: anon SELECT
grant tasks: service_role SELECT
sequence tasks.short_id: owner=postgres
function task_roster(): owner=postgres security=INVOKER volatility=i config=search_path="" body_md5=abc
function-grant task_roster(): postgres EXECUTE
function-grant task_roster(): service_role EXECUTE
`;
const swap = (from, to) => BASE.replace(from, to);
const add = (line) => `${BASE}${line}\n`;

function expectStop(live, pattern) {
  const r = compareSnapshots(BASE, live);
  // A CHANGED line appears on both sides (old in local, new in live); an added line on one.
  assert.ok(r.stops.length >= 1, `expected a stop:\n${renderComparison(r)}`);
  for (const s of r.stops) assert.match(s.reason, pattern);
  assert.equal(r.listed.length, 0);
}
function expectListed(live, pattern) {
  const r = compareSnapshots(BASE, live);
  assert.equal(r.stops.length, 0, renderComparison(r));
  assert.equal(r.listed.length, 1);
  assert.match(r.listed[0].reason, pattern);
}

test('identical snapshots: no stop, nothing listed', () => {
  const r = compareSnapshots(BASE, BASE.replace(/\n/g, '\r\n'));
  assert.deepEqual([r.stops.length, r.listed.length], [0, 0]);
});

test('a server-version-only difference is not a stop, and both versions are printed first', () => {
  const r = compareSnapshots(BASE, swap('server_version=17.6', 'server_version=15.8').replace('170006', '150008'));
  assert.deepEqual([r.stops.length, r.listed.length], [0, 0]);
  assert.match(renderComparison(r).split('\n')[0], /local: 17\.6 · live: 15\.8/);
});

test('STOP fixtures — one of each kind in the rule', () => {
  expectStop(swap('DEFAULT gen_random_uuid()', 'DEFAULT uuid_generate_v4()'), /column/); // a default
  expectStop(swap('<= 80', '<= 100'), /constraint/);
  expectStop(swap('[enabled=O]', '[enabled=D]'), /trigger/);
  expectStop(swap('to service_role', 'to public'), /policy/);
  expectStop(swap('enabled=true', 'enabled=false'), /rls/);
  expectStop(swap('table tasks: owner=postgres', 'table tasks: owner=supabase_admin'), /table/);
  expectStop(swap('security=INVOKER', 'security=DEFINER'), /function/);
  expectStop(swap('(short_id)', '(id)'), /index/);
});

test('STOP fixtures — a grant difference to each core role, on a table and on a function', () => {
  for (const role of ['service_role', 'anon', 'authenticated', 'PUBLIC']) {
    expectStop(add(`grant tasks: ${role} DELETE`), new RegExp(`grant to ${role}`));
    expectStop(add(`function-grant tasks_before_write(): ${role} EXECUTE`), new RegExp(`function-grant to ${role}`));
  }
  // and a grant that is MISSING on one side
  const r = compareSnapshots(BASE, swap('function-grant task_roster(): service_role EXECUTE\n', ''));
  assert.equal(r.stops.length, 1);
  assert.equal(r.stops[0].side, 'only in local');
});

test('LISTED fixtures — a Supabase-only role, and a version-only privilege name', () => {
  expectListed(add('grant tasks: supabase_admin SELECT'), /non-core role \(supabase_admin\)/);
  expectListed(add('function-grant task_roster(): supabase_admin EXECUTE'), /non-core role/);
  expectListed(add('grant tasks: anon MAINTAIN'), /version-only privilege \(MAINTAIN\)/);
});

test('an unrecognized or unparseable line STOPS rather than slipping through', () => {
  assert.equal(classify('mystery tasks: something').stop, true);
  assert.equal(classify('grant tasks: weird line').stop, true);
});

test('runCompare: exit 1 on a stop, 0 otherwise, 2 on usage', () => {
  const files = { a: BASE, b: BASE, c: swap('<= 80', '<= 81') };
  let printed = '';
  const io = { read: (p) => files[p], out: (s) => (printed += s), err: () => {} };
  assert.equal(runCompare(['a', 'b'], io), 0);
  assert.match(printed, /VERDICT: no stop/);
  assert.equal(runCompare(['a', 'c'], io), 1);
  assert.match(printed, /VERDICT: STOP/);
  assert.equal(runCompare(['a'], io), 2);
});
