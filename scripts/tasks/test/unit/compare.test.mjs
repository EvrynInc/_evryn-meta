import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TASKS_DIR } from '../helpers.mjs';
import { checkTargets, classify, compareSnapshots, renderComparison, runCompare } from '../../snapshot-compare.mjs';

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

test('LISTED fixtures — a Supabase-only role, and a default privilege for future objects', () => {
  expectListed(add('grant tasks: supabase_admin SELECT'), /non-core role \(supabase_admin\)/);
  expectListed(add('function-grant task_roster(): supabase_admin EXECUTE'), /non-core role/);
  expectListed(add('default-acl postgres public tables: anon SELECT'), /default privilege/);
});

test('MAINTAIN (QC Finding 9): LISTED only when the servers straddle 17; a STOP between two 17s or when a version is unknown', () => {
  // local 17, live 15: straddles → listed
  const live15 = add('grant tasks: anon MAINTAIN').replace('server_version_num=170006', 'server_version_num=150008');
  const r1 = compareSnapshots(add('grant tasks: anon MAINTAIN'), live15.replace('grant tasks: anon MAINTAIN\n', ''));
  assert.equal(r1.stops.length, 0, renderComparison(r1));
  assert.match(r1.listed[0].reason, /straddle 170000/);
  // both 17: a MAINTAIN grant to anon is real
  expectStop(add('grant tasks: anon MAINTAIN'), /grant to anon/);
  // a version unknown on one side: not exempt
  const noVersion = BASE.replace('# server_version_num=170006\n', '');
  const r3 = compareSnapshots(noVersion, add('grant tasks: anon MAINTAIN'));
  assert.equal(r3.stops.length, 1);
});

test('QC N3: against the REAL golden fixture, a PostgreSQL-15-shaped live side LISTS the MAINTAIN lines and does not stop', () => {
  const golden = readFileSync(join(TASKS_DIR, 'test', 'fixtures', 'local-snapshot-after.txt'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(golden, /^# server_version_num=17\d{4}$/m, 'the golden file must carry the local server version');
  assert.match(golden, /^grant tasks: anon MAINTAIN$/m, 'precondition: the PG17 golden has MAINTAIN grants');
  // PG 15 has no MAINTAIN privilege: same objects, minus those lines, with a 15 version.
  const live15 = golden
    .replace(/^# target=.*$/m, '# target=evryn-team ref=azugibmylktinddyqkhd via api')
    .replace(/^# server_version=.*$/m, '# server_version=15.8')
    .replace(/^# server_version_num=.*$/m, '# server_version_num=150008')
    .split('\n').filter((l) => !/ MAINTAIN$/.test(l)).join('\n');
  assert.equal(checkTargets(golden, live15), null);
  const r = compareSnapshots(golden, live15);
  assert.equal(r.stops.length, 0, renderComparison(r));
  // Core roles' MAINTAIN lines are listed as version-only; postgres's as a non-core role. Nothing else differs.
  const core = r.listed.filter((l) => / (anon|authenticated|service_role|PUBLIC) MAINTAIN$/.test(l.line));
  assert.ok(core.length >= 6, `expected the core-role MAINTAIN lines to be listed, got ${core.length}`);
  for (const l of core) assert.match(l.reason, /version-only privilege \(MAINTAIN; the servers straddle 170000\)/);
  for (const l of r.listed) assert.match(l.line, / MAINTAIN$/, `an unexpected difference: ${l.line}`);
  // ...and the same live side at PostgreSQL 17 would STOP on every one of them.
  const live17 = live15.replace('server_version_num=150008', 'server_version_num=170006');
  assert.ok(compareSnapshots(golden, live17).stops.length >= 6);
});

test('targets (QC Finding 4): a live side taken from loopback, with no target line, or from the same target is REFUSED', () => {
  const local = `# target=local-loopback\n${BASE}`;
  const live = `# target=evryn-team ref=azugibmylktinddyqkhd via api\n${BASE}`;
  assert.equal(checkTargets(local, live), null);
  assert.match(checkTargets(local, local), /local loopback/);
  assert.match(checkTargets(local, BASE), /no "# target=" line/);
  assert.match(checkTargets(live, live), /same target/);
  let printed = '';
  const io = { read: (p) => ({ l: local, v: local })[p], out: (s) => (printed += s), err: () => {} };
  assert.equal(runCompare(['l', 'v'], io), 1);
  assert.match(printed, /COMPARE REFUSED: the "live" snapshot was taken from a local loopback cluster/);
  assert.doesNotMatch(printed, /VERDICT: no stop/);
});

test('an unrecognized or unparseable line STOPS rather than slipping through', () => {
  assert.equal(classify('mystery tasks: something').stop, true);
  assert.equal(classify('grant tasks: weird line').stop, true);
});

test('runCompare: exit 1 on a stop, 0 otherwise, 2 on usage', () => {
  const L = '# target=local-loopback\n';
  const V = '# target=evryn-team ref=azugibmylktinddyqkhd via api\n';
  const files = { a: L + BASE, b: V + BASE, c: V + swap('<= 80', '<= 81') };
  let printed = '';
  const io = { read: (p) => files[p], out: (s) => (printed += s), err: () => {} };
  assert.equal(runCompare(['a', 'b'], io), 0);
  assert.match(printed, /VERDICT: no stop/);
  assert.equal(runCompare(['a', 'c'], io), 1);
  assert.match(printed, /VERDICT: STOP/);
  assert.equal(runCompare(['a'], io), 2);
});
