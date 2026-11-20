// copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v/mutate-C.mjs; original sha256 2b7372bda38cecef7bdf6a5963f8c25f9fc04c5ad7ebec6466cd6c2a48c48320; copied 2026-11-20 by AC-006R2
// QC6V's own extra controls on 16fb675, in the plain-copy sandbox qc6v-sandbox2 (CODE_ROOT = tmp, no .env).
// Same method as DCG-6 / DC6F: clean baseline of each selected set first, in the same run; one-occurrence edits,
// file verified changed; migration must still apply; restore verified.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const WT = 'C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v-sandbox2';
const T = join(WT, 'scripts/tasks');
const LOG = 'C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v/mutation-C.txt';
const MIG = 'migrations/006_authorization_record.sql';
const ACC = 'test/acceptance/migration-006.test.mjs';
const env = { ...process.env, EVRYN_TASKS_RUNTIME_003: 'C:/Users/jbmcg/Evryn/Code/evryn-team-runtime/migrations/003_tasks_proposals.sql' };
const BEH = '^([0-9]+[.] |no actor|Rule N|ET009|ET007|an unknown status|QC6-|005 §1.3)';
const M = (id, from, to, pattern, expect = 'RED', note = '') => ({ id, from, to, pattern, expect, note });

const mutations = [
  M('QC6V-ET016-proposed-exception-dropped', `      if new.status is distinct from old.status and new.status is distinct from 'proposed' then`, `      if new.status is distinct from old.status then`, '^QC6-C5:', 'RED', 'scope + withdrawal to proposed must stay allowed'),
  M('QC6V-ET016-only-for-closing', `      if new.status is distinct from old.status and new.status is distinct from 'proposed' then`, `      if new.status in ('done','decided_against') then`, BEH, 'GREEN?', 'is scope + an active->active move pinned? (H8b shape)'),
  M('QC6V-C6-decided-against-only', `    if new.status = any (v_closed) and new.status is distinct from old.status then\n      new.needs_reauthorization := false;`, `    if new.status = 'decided_against' and new.status is distinct from old.status then\n      new.needs_reauthorization := false;`, BEH, 'GREEN?', 'expected equivalent mutant: done only via acceptance, where the flag is already false'),
  M('QC6V-NB2g-hint-dropped', `            raise exception using errcode = 'ET011', message = c_et011,\n              hint = 'This active task carries no authorization record (authorization_id is NULL).';`, `            raise exception using errcode = 'ET011', message = c_et011;`, '^QC6-NB2 g:'),
  M('QC6V-NB4-owner-check-to-literal-postgres', `                         and current_user = (select pg_catalog.pg_get_userbyid(c.relowner) from pg_catalog.pg_class c\n                                              where c.oid = 'public.tasks'::regclass);\n  v_from_id`, `                         and current_user::text = 'postgres';\n  v_from_id`, BEH, 'GREEN?', 'equivalent here: the owner is postgres in every suite'),
  M('QC6V-setting-task-half-as-only-binding (row lookup by id only, setting task half kept)', `     where a.id = v_from_id and a.task_id = new.id and a.scope_hash = new.scope_hash;`, `     where a.id = v_from_id and a.scope_hash = new.scope_hash;`, '^(17\\. |QC6-NB1)', 'RED', 'NB1 a must still go red: twin scopes, setting names C'),
];

function run(pattern) {
  // SEALED-EXEC: followed 2026-08-11 — process.execPath is the absolute path of the node binary already running; no network.
  return spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=${pattern}`, join(T, ACC)], { encoding: 'utf8', env, cwd: WT, timeout: 600000 });
}
const counts = (s) => ({ pass: Number((s.match(/^# pass (\d+)/m) ?? [])[1] ?? NaN), fail: Number((s.match(/^# fail (\d+)/m) ?? [])[1] ?? NaN) });
writeFileSync(LOG, `# QC6V mutation run ${new Date().toISOString()} at ${WT}\n`);
for (const p of [...new Set(mutations.map((m) => m.pattern))]) {
  const c = counts(run(p).stdout);
  appendFileSync(LOG, `CLEAN /${p}/ -> pass ${c.pass} fail ${c.fail} ${c.fail === 0 && c.pass > 0 ? 'OK' : 'BAD'}\n`);
}
for (const m of mutations) {
  const path = join(T, MIG);
  const raw = readFileSync(path, 'utf8');
  const s = raw.replace(/\r\n/g, '\n');
  const n = s.split(m.from).length - 1;
  if (n !== 1) { appendFileSync(LOG, `SKIP ${m.id}: occurs ${n}x\n`); continue; }
  writeFileSync(path, s.replace(m.from, () => m.to));
  const changed = readFileSync(path, 'utf8') !== raw;
  const proof = readFileSync(path, 'utf8').includes(m.to);
  const r = run(m.pattern);
  const c = counts(r.stdout);
  const migrateFailed = /migrate failed/.test(r.stdout + r.stderr);
  writeFileSync(path, raw);
  const restored = readFileSync(path, 'utf8') === raw;
  const reds = [...r.stdout.matchAll(/^ {0,4}not ok \d+ - (.*)$/gm)].map((x) => x[1]).filter((t) => !/^006:/.test(t)).join(' | ');
  appendFileSync(LOG, `${m.id}: applied=${changed} proof=${proof} migrateFailed=${migrateFailed} -> pass ${c.pass} fail ${c.fail} [expect ${m.expect}]; red: ${reds || '-'}; restored=${restored} (${m.note})\n`);
}
appendFileSync(LOG, `# done ${new Date().toISOString()}\n`);
console.log(readFileSync(LOG, 'utf8'));
