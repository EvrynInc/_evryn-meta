// copied verbatim from C:/Users/jbmcg/.claude/jobs/51110d9e/tmp/qc6v/mutate-dcg6.mjs; original sha256 d7d98ec522c6d3eef6c684e89bcfb08bbb4108f1d8fc16e063941e33dc35618a; copied 2026-11-20 by AC-006R2
// Mutation controls for migration 006 and its CLI/audit (DCG-6). Runs ONLY in the detached worktree
// C:/Users/jbmcg/AppData/Local/Temp/dcg6/mutwt (outside the shared code folder, so no .env path resolves).
// For each mutation: apply it (exactly one occurrence, verified changed), syntax-check an .mjs with node --check,
// run the named tests, require them to FAIL (and, for SQL, require that the migration still APPLIED, so the failure
// is the mutation's, not a syntax error), then restore the original bytes and verify the restore.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const WT = 'C:/Users/jbmcg/AppData/Local/Temp/dcg6/mutwt';
const T = join(WT, 'scripts/tasks');
const LOG = 'C:/Users/jbmcg/AppData/Local/Temp/dcg6/mutation-results.txt';
const MIG = 'migrations/006_authorization_record.sql';
const ACC = 'test/acceptance/migration-006.test.mjs';
const env = { ...process.env, EVRYN_TASKS_RUNTIME_003: 'C:/Users/jbmcg/Evryn/Code/evryn-team-runtime/migrations/003_tasks_proposals.sql' };

const M = (id, file, from, to, test, pattern, note = '') => ({ id, file, edits: [[from, to]], test, pattern, note });
const MM = (id, file, edits, test, pattern, note = '') => ({ id, file, edits, test, pattern, note });

const mutations = [
  M('ET011-insert', MIG, `    if new.status = any (v_active || v_closed) then`, `    if false then`, ACC, '^1\\. '),
  M('ET011-pre-to-active', MIG, `          if not (v_from_auth and coalesce(new.authorization_id = v_from_id, false)) then`, `          if false then`, ACC, '^2\\. '),
  M('ET012-actor', MIG, `  if not (v_actor = any (array['lucas','justin'])) then`, `  if false then`, ACC, '^3\\. '),
  M('ET012-rule_ref', MIG, `    if coalesce(btrim(new.rule_ref), '') = '' then`, `    if false then`, ACC, '^3\\. '),
  M('ET012-justin_ref', MIG, `    if coalesce(btrim(new.justin_ref), '') = '' then`, `    if false then`, ACC, '^4\\. '),
  M('justin_signin-seam', MIG, `  if v_mode = 'lucas_relay' then`, `  if v_mode in ('lucas_relay','justin_signin') then`, ACC, '^4\\. '),
  M('ET012-backfill-source', MIG, `  if coalesce(new.tier = 'backfill' or new.source = 'migration_006', false) and not v_migration then`, `  if false then`, ACC, '^5\\. '),
  M('ET012-session-required', MIG, `  if v_session is null and not (new.tier = 'backfill' and v_migration) then`, `  if false then`, ACC, '^6\\. '),
  M('ET013-append-only', MIG, `begin\n  raise exception using\n    errcode = 'ET013',`, `begin\n  return null;\n  raise exception using\n    errcode = 'ET013',`, ACC, '^7\\. '),
  M('return-replaced-by-old-refusal', MIG, `      new.status := 'proposed';\n      new.authorization_id := null;\n      new.needs_reauthorization := true;`, `      raise exception using errcode = 'ET011', message = 'scope edit refused (the 11/13 design)';`, ACC, '^8\\. ', 'the brief\'s named control for test 8'),
  M('return-flag-dropped', MIG, `    v_flags := v_flags || 'reauthorization_needed'::text;`, `    null;`, ACC, '^8\\. '),
  MM('revert-attack-pointer-kept', MIG, [
    [`      new.status := 'proposed';\n      new.authorization_id := null;\n      new.needs_reauthorization := true;`, `      new.status := 'proposed';\n      new.needs_reauthorization := true;`],
    [`          if not (v_from_auth and coalesce(new.authorization_id = v_from_id, false)) then`, `          if not (v_from_auth and coalesce(new.authorization_id = v_from_id, false)) and new.authorization_id is null then`],
  ], ACC, '^9\\. ', 'the vulnerable design: the return keeps the pointer, and a status write may reopen on it'),
  M('ET014-pointer', MIG, `       and not (v_from_auth and coalesce(new.authorization_id = v_from_id, false)) then`, `       and false then`, ACC, '^10\\. '),
  M('ET014-flag', MIG, `       and not (v_from_auth and new.needs_reauthorization = false) then`, `       and false then`, ACC, '^10\\. '),
  M('scope_hash-client-trusted', MIG, `  new.scope_hash := public.task_scope_hash(new.title, new.description, new.raci->>'r');`, `  new.scope_hash := coalesce(new.scope_hash, public.task_scope_hash(new.title, new.description, new.raci->>'r'));`, ACC, '^10\\. '),
  M('acceptance-justin-tier', MIG, `    if v_auth_tier = 'justin' and new.tier is distinct from 'justin' then`, `    if false then`, ACC, '^11\\. '),
  M('acceptance-needs_acceptance', MIG, `    if v_status is distinct from 'needs_acceptance' then`, `    if false then`, ACC, '^11\\. '),
  M('done-by-status-write', MIG, `          if not (v_from_acc and old.status = 'needs_acceptance') then`, `          if false then`, ACC, '^11\\. '),
  M('decided_against-by-non-signer', MIG, `          if not (v_actor = any (v_signers)) then\n            raise exception using errcode = 'ET011', message = c_et011,\n              hint = 'Deciding`, `          if false then\n            raise exception using errcode = 'ET011', message = c_et011,\n              hint = 'Deciding`, ACC, '^12\\. '),
  M('reopen-rule', MIG, `        if not (v_actor = any (v_signers) and new.status = 'proposed') then`, `        if false then`, ACC, '^12\\. '),
  M('ET015', MIG, `    if old.status = any (v_closed) and new.scope_hash is distinct from old.scope_hash and not (v_actor = any (v_signers)) then`, `    if false then`, ACC, '^12\\. '),
  M('C5-backlog-exemption-removed', MIG, `          if not (v_migration and old.status = 'blocked' and coalesce('backlog' = any (old.tags), false)) then`, `          if true then`, ACC, '^(13|18)\\. ', 'C5 control 1: data step 1 must then be refused'),
  MM('C5-role-check-removed', MIG, [
    [`                         and current_user::text not in ('service_role','authenticator','anon','authenticated');\n  v_status`, `                         ;\n  v_status`],
    [`                         and current_user::text not in ('service_role','authenticator','anon','authenticated');\n  v_from_id`, `                         ;\n  v_from_id`],
  ], ACC, '^18\\. ', 'C5 control 2: a service_role request carrying the setting then gets the exemption'),
  M('backfill-step-removed', MIG, `    insert into public.task_authorizations (task_id, kind, tier, source, rule_ref, note)\n    values (r.id, 'authorization', 'backfill', 'migration_006', 'migration 006 backfill: no authorization record existed', v_note);`, `    null;`, ACC, '^13\\. '),
  M('ET002-session-shape', MIG, `  if v_session is not null and v_session !~ '^[A-Za-z0-9-]{1,64}$' then`, `  if false then`, ACC, '^14\\. '),
  M('session-not-in-history', MIG, `values (new.id, v_actor, lower(tg_op), v_changed, v_old, v_new, v_flags, new.note, v_session);`, `values (new.id, v_actor, lower(tg_op), v_changed, v_old, v_new, v_flags, new.note, null);`, ACC, '^14\\. '),
  M('launcher-off-roster', MIG, `               'justin','ac','dc','qc','oc','launcher']::text[]`, `               'justin','ac','dc','qc','oc']::text[]`, ACC, '^15\\. '),
  M('hash-field-order', MIG, `jsonb_build_array(coalesce(p_title, ''), coalesce(p_description, ''), coalesce(p_owner, ''))`, `jsonb_build_array(coalesce(p_description, ''), coalesce(p_title, ''), coalesce(p_owner, ''))`, ACC, '^16\\. ', 'the brief\'s named control for test 16'),
  M('C4-task-half-dropped', MIG, `     and split_part(v_setting, ':', 2) = new.id::text then`, `     then`, ACC, '^17\\. ', 'the brief\'s named control for test 17'),
  M('C4-not-cleared', MIG, `  perform pg_catalog.set_config('evryn.authorizing', '', true);\n  return null;`, `  return null;`, ACC, '^17\\. '),
  // CLI and audit (unit tests)
  M('cli-add-default-open', 'lib/cli.mjs', `      status: values.status ?? 'proposed',`, `      status: values.status ?? 'open',`, 'test/unit/cli.test.mjs', 'every write sends x-evryn-actor|006: add refuses'),
  M('cli-add-status-refusal', 'lib/cli.mjs', `    if (values.status !== undefined && !ADD_STATUSES.includes(values.status)) {`, `    if (false) {`, 'test/unit/cli.test.mjs', '006: add refuses'),
  M('rest-session-header', 'lib/rest.mjs', `    if (session) headers['x-evryn-session'] = session;`, ``, 'test/unit/cli.test.mjs', 'x-evryn-session'),
  M('cli-rescope-refusal', 'lib/cli.mjs', `      if (!values.rescope) {`, `      if (false) {`, 'test/unit/cli.test.mjs', '--rescope'),
  M('cli-close-retired', 'lib/cli.mjs', `    if (!values['decided-against']) {`, `    if (false) {`, 'test/unit/cli.test.mjs', 'close without --decided-against'),
  M('cli-pre-to-active-courtesy', 'lib/cli.mjs', `    if (values.status !== undefined && ['backlog', 'proposed'].includes(current.status) && ACTIVE_STATUSES.includes(values.status)) {`, `    if (false) {`, 'test/unit/cli.test.mjs', 'a status write from backlog or proposed'),
  M('cli-authorize-actor-courtesy', 'lib/cli.mjs', `  if (!AUTHORIZERS.includes(actor)) {`, `  if (false) {`, 'test/unit/cli.test.mjs', 'authorize and accept refuse'),
  M('audit-transcript-check', 'audit.mjs', `        } else if (transcriptHoldsCommand(readText(path), a.kind, shortOf.get(a.task_id))) {`, `        } else if (true) {`, 'test/unit/audit.test.mjs', 'WITHOUT the command'),
  M('audit-justin-expected', 'audit.mjs', `      const expected = /^(migration 006|authorized \\(T-auth #\\d+, tier backfill\\))/.test(h.note ?? '');`, `      const expected = true;`, 'test/unit/audit.test.mjs', 'writes as justin are flagged'),
];

function run(test, pattern) {
  // SEALED-EXEC: followed 2026-08-11 — process.execPath is the absolute path of the node binary already running; no network.
  return spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=${pattern}`, join(T, test)], { encoding: 'utf8', env, cwd: WT, timeout: 600000 });
}
const counts = (s) => ({ pass: Number((s.match(/^# pass (\d+)/m) ?? [])[1] ?? NaN), fail: Number((s.match(/^# fail (\d+)/m) ?? [])[1] ?? NaN) });

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
writeFileSync(LOG, `# mutation run ${new Date().toISOString()}\n`, { flag: only ? 'a' : 'w' });
// Clean controls first: each selected test set must PASS unmutated.
const sets = [...new Map(mutations.filter((m) => !only || only.test(m.id)).map((m) => [`${m.test}|${m.pattern}`, m])).values()];
for (const m of sets) {
  const r = run(m.test, m.pattern);
  const c = counts(r.stdout);
  appendFileSync(LOG, `CLEAN ${m.test} /${m.pattern}/ → pass ${c.pass} fail ${c.fail} ${c.fail === 0 && c.pass > 0 ? 'OK' : 'BAD'}\n`);
}
for (const m of mutations.filter((x) => !only || only.test(x.id))) {
  const path = join(T, m.file);
  const raw = readFileSync(path, 'utf8');
  const crlf = raw.includes('\r\n');
  let s = raw.replace(/\r\n/g, '\n');
  let applied = true;
  for (const [from, to] of m.edits) {
    const n = s.split(from).length - 1;
    if (n !== 1) { applied = false; appendFileSync(LOG, `SKIP ${m.id}: "${from.slice(0, 60)}" occurs ${n}x\n`); break; }
    s = s.replace(from, () => to);
  }
  if (!applied) continue;
  writeFileSync(path, crlf ? s.replace(/\n/g, '\r\n') : s);
  const changed = readFileSync(path, 'utf8') !== raw;
  let syntax = 'n/a';
  if (path.endsWith('.mjs')) {
    // SEALED-EXEC: followed 2026-08-11 — process.execPath, the running node binary; no network.
    syntax = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' }).status === 0 ? 'ok' : 'SYNTAX ERROR';
  }
  const r = run(m.test, m.pattern);
  const c = counts(r.stdout);
  const migrateFailed = /migrate failed/.test(r.stdout + r.stderr);
  writeFileSync(path, raw);
  const restored = readFileSync(path, 'utf8') === raw;
  const verdict = changed && syntax !== 'SYNTAX ERROR' && !migrateFailed && c.fail > 0 ? 'RED (control proves the test)' : 'NOT RED — INVESTIGATE';
  const firstFail = (r.stdout.match(/^ {0,4}not ok \d+ - (.*)$/m) ?? [])[1] ?? '-';
  appendFileSync(LOG, `${m.id}: applied=${changed} syntax=${syntax} migrateFailed=${migrateFailed} → pass ${c.pass} fail ${c.fail} → ${verdict}; first red: ${firstFail}; restored=${restored}${m.note ? ` (${m.note})` : ''}\n`);
}
appendFileSync(LOG, `# done ${new Date().toISOString()}\n`);
console.log(readFileSync(LOG, 'utf8'));
