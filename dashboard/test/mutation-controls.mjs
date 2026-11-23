#!/usr/bin/env node
// mutation-controls.mjs — proves the Tasks endpoint's tests can FAIL.
//
// Truncation check: the last line of this file reads "FULL FILE LOADED".
//
// Run from dashboard/:  node test/mutation-controls.mjs
//
// A passing suite only says the tests did not complain. This script shows they WOULD
// complain if the code broke: it copies api/tasks.ts and test/tasks.test.ts into a
// fresh temp folder OUTSIDE the repo, breaks the copy of tasks.ts one way at a time,
// and runs the suite against each broken copy.
//
// For every control it prints: whether the break applied (each anchor text found
// exactly once and the copy differs from the original), whether the broken copy still
// PARSES (node --check), the suite's result, and — where a control names them — whether
// the specific check meant to catch it fired. A control HOLDS only if the break
// applied, the copy parsed, the suite went RED, and every named check fired. A copy
// that fails to parse proves nothing, because a suite that cannot load fails for the
// wrong reason.
//
// What these controls prove is that each check catches the ACCIDENTAL-EDIT shape it was
// written for. They are not proof against code written on purpose to slip past the
// suite; reviewing the diff is that defense.
//
// The real api/tasks.ts is never written. The script reads it, and at the end checks
// its bytes are unchanged.
//
// Exit code: 0 if the baseline is green and every control holds; 1 otherwise.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DASH = resolve(HERE, '..');
const SRC = join(DASH, 'api', 'tasks.ts');
const TEST = join(DASH, 'test', 'tasks.test.ts');
const PKG = join(DASH, 'package.json');

const originalBytes = readFileSync(SRC, 'utf8');
// The anchors below are written with LF. A Windows checkout (core.autocrlf) can give
// the file CRLF endings, so the temp copies are made from an LF-normalized text. The
// real file is only ever read; the unchanged-check at the end compares its raw bytes.
const original = originalBytes.replace(/\r\n/g, '\n');

const AFTER_CLIENT = '    const client = await deps.createClient(url, key);\n';
const AFTER_READS = '    ]);\n\n    return json({\n      configured: true,';
const DELETE_CALL = "_netf(url + '/rest/v1/tasks?id=not.is.null', { method: 'DELETE', headers: { apikey: key, Authorization: 'Bearer ' + key } }).catch(() => {});";

// Each control: an id, a name, its edits ([anchor, replacement] pairs, each anchor
// found exactly once), and optionally:
//   checks: [{ re, label }] — text that must appear in the suite's output, i.e. the
//           named check that must catch this break;
//   everyRed: { re, label } — EVERY failing test must fail with this reason, so the red
//           comes from that check and not from a side effect.
//   guardOnly: { re, label } — run the suite a SECOND time with the source-text lint
//           skipped (in the temp copy of the test file only), and require it to go red
//           with this reason too. That proves the runtime guard catches the break on
//           its own, not only the lint.
const CONTROLS = [
  {
    id: 'a', name: 'write: add an insert call',
    edits: [[AFTER_CLIENT, AFTER_CLIENT + "    await client.from('tasks').insert({ title: 'x' });\n"]],
  },
  {
    id: 'b', name: 'write: add an rpc call',
    edits: [[AFTER_CLIENT, AFTER_CLIENT + "    await client.rpc('noop');\n"]],
  },
  {
    id: 'c', name: 'read from a second table',
    edits: [[AFTER_CLIENT, AFTER_CLIENT + "    await client.from('agent_state').select('agent');\n"]],
  },
  {
    id: 'd', name: 'auth: remove the checkAuth call (must turn the AUTH suite red)',
    edits: [['  const denied = checkAuth(request, env.DASHBOARD_PASSWORD);\n  if (denied) return denied;\n', '']],
    checks: [{ re: /^not ok \d+ - auth: /m, label: 'auth-suite-red' }],
  },
  {
    id: 'e', name: 'columns: add description to the select',
    edits: [["  'short_id, title, status,", "  'short_id, title, description, status,"]],
  },
  {
    id: 'f', name: 'method: let POST through',
    edits: [["  if (request.method !== 'GET') {", "  if (request.method !== 'GET' && request.method !== 'POST') {"]],
  },
  {
    id: 'g', name: 'paging: stop on a short page instead of a zero-row page',
    edits: [[
      '    if (rows.length === 0) return { rows: out, truncated: false };\n    out.push(...rows);\n',
      '    out.push(...rows);\n    if (rows.length < PAGE_SIZE) return { rows: out, truncated: false };\n',
    ]],
  },
  // ---- Fix round 1 (QC-TT B1-B3, N1, N2, N7). ----
  {
    id: 'h', name: 'B1: put the URL and key in the 200 body (debug: { url, key })',
    edits: [['      truncated: open.truncated || closed.truncated,\n', '      truncated: open.truncated || closed.truncated,\n      debug: { url, key },\n']],
    checks: [{ re: /secret marker in a 200 body/, label: 'secret-check-red' }],
  },
  {
    id: 'i', name: 'B2: an unawaited DELETE through the global fetch, around the client',
    edits: [[AFTER_CLIENT, AFTER_CLIENT + "    fetch(url + '/rest/v1/tasks?id=not.is.null', { method: 'DELETE', headers: { apikey: key, Authorization: 'Bearer ' + key } }).catch(() => {});\n"]],
    checks: [{ re: /global fetch was called/, label: 'fetch-guard-red' }, { re: /tasks\.ts uses fetch/, label: 'lint-red' }],
    guardOnly: { re: /global fetch was called/, label: 'guard-alone-red' },
  },
  {
    id: 'j', name: 'B3: closed window 30 -> 36500 days',
    edits: [['export const CLOSED_WINDOW_DAYS = 30;', 'export const CLOSED_WINDOW_DAYS = 36500;']],
    checks: [{ re: /closed window is not 30 days/, label: 'window-check-red' }],
  },
  {
    id: 'k', name: 'B3: a third read over every status, no window, merged into closed',
    edits: [[AFTER_READS, '    ]);\n    const extra = await readAll(client, (q) => q);\n    closed.rows.push(...extra.rows);\n\n    return json({\n      configured: true,']],
    checks: [{ re: /unexpected read|exactly two reads expected/, label: 'two-reads-check-red' }],
  },
  {
    id: 'l', name: 'N1: revert the open read to the six known statuses',
    edits: [["q.not('status', 'in', CLOSED_FILTER)", "q.in('status', ['backlog', 'proposed', 'open', 'in_progress', 'blocked', 'needs_acceptance'])"]],
    checks: [{ re: /not ok \d+ - read-only: against a filtering table, an unknown status comes back in open/, label: 'unknown-status-test-red' }],
  },
  {
    id: 'm', name: 'N2: log the raw error object',
    edits: [['    console.error(`Tasks API: read failed (code=${code}, name=${name})`);\n', "    console.error('Tasks API: read failed', err);\n"]],
    checks: [{ re: /secret marker in the server log/, label: 'log-check-red' }],
  },
  {
    id: 'n', name: 'N7: let HEAD through the method gate',
    edits: [["  if (request.method !== 'GET') {", "  if (request.method !== 'GET' && request.method !== 'HEAD') {"]],
    checks: [{ re: /not ok \d+ - read-only: HEAD with valid auth/, label: 'head-test-red' }],
  },
  // ---- Fix round 2 (QC-TT2's D-series; the accidental-edit classes). ----
  {
    id: 'D4', name: 'fetch saved at module load, DELETE called after the client is made',
    edits: [
      ['export const config = {', 'const _netf = globalThis.fetch;\n\nexport const config = {'],
      [AFTER_CLIENT, AFTER_CLIENT + '    ' + DELETE_CALL + '\n'],
    ],
    checks: [{ re: /global fetch was called/, label: 'fetch-guard-red' }, { re: /tasks\.ts uses (globalThis|fetch)/, label: 'lint-red' }],
    guardOnly: { re: /global fetch was called/, label: 'guard-alone-red' },
  },
  {
    id: 'D5', name: 'the same DELETE, deferred 1.5s past every assertion',
    edits: [
      ['export const config = {', 'const _netf = globalThis.fetch;\n\nexport const config = {'],
      [AFTER_CLIENT, AFTER_CLIENT + '    setTimeout(() => { ' + DELETE_CALL + ' }, 1500);\n'],
    ],
    // The deferred call throws the stub's error with no test left to catch it.
    checks: [{ re: /test: global fetch is forbidden/, label: 'deferred-fetch-guard-red' }, { re: /tasks\.ts uses (globalThis|setTimeout|fetch)/, label: 'lint-red' }],
    guardOnly: { re: /test: global fetch is forbidden/, label: 'guard-alone-red' },
  },
  {
    id: 'D6', name: 'a third, 39-day closed read only when open rows exist, merged and deduplicated',
    edits: [[AFTER_READS,
      '    ]);\n' +
      '    if (open.rows.length) {\n' +
      "      const extra = await readAll(client, (q) => q.in('status', CLOSED_STATUSES).gte('closed_at', new Date(Date.now() - 39 * 86400000).toISOString()));\n" +
      '      const seen = new Set(closed.rows.map((r) => r.short_id));\n' +
      '      for (const r of extra.rows) if (!seen.has(r.short_id)) closed.rows.push(r);\n' +
      '    }\n\n    return json({\n      configured: true,']],
    checks: [{ re: /closed window is not 30 days|exactly two reads expected/, label: 'reads-check-red' }],
  },
  {
    id: 'D1', name: 'debug headers carrying the URL and key on the 200',
    edits: [['      truncated: open.truncated || closed.truncated,\n    });', "      truncated: open.truncated || closed.truncated,\n    }, 200, { 'X-Debug-Upstream': url, 'X-Debug-Key': key });"]],
    checks: [{ re: /response headers are not exactly the allowlist for 200/, label: 'header-allowlist-red' }],
  },
  {
    id: 'D2p', name: 'the dashboard password in a header on the 401',
    edits: [[
      "    return new Response('Invalid credentials', {\n      status: 401,\n      headers: { 'WWW-Authenticate': 'Basic realm=\"Evryn Dashboard\"' },",
      "    return new Response('Invalid credentials', {\n      status: 401,\n      headers: { 'WWW-Authenticate': 'Basic realm=\"Evryn Dashboard\"', 'X-Debug-Pw': String(validPassword) },",
    ]],
    checks: [{ re: /response headers are not exactly the allowlist for 401/, label: 'header-allowlist-red' }],
  },
  {
    id: 'D9', name: 'an insert wrapped in try/catch, so no throw can mask it',
    edits: [[AFTER_CLIENT, AFTER_CLIENT + "    try { await client.from('tasks').insert({ title: 'x' }); } catch {}\n"]],
    everyRed: { re: /write or rpc attempted on the fake client/, label: 'every-red-from-violation-check' },
  },
  {
    id: 'D3p', name: "the key in plain text in a row's title",
    edits: [['      open: open.rows,\n', '      open: open.rows.map((r) => ({ ...r, title: key })),\n']],
    checks: [{ re: /secret marker in a 200 body/, label: 'secret-check-red' }],
  },
];

function count(hay, needle) {
  let n = 0, i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}

// Split TAP output into one block per failing test: the "not ok" line up to the next
// result line at the same indentation.
function failingBlocks(out) {
  const lines = out.split('\n');
  const blocks = [];
  let cur = null;
  for (const line of lines) {
    if (/^not ok \d+ - /.test(line)) { cur = [line]; blocks.push(cur); continue; }
    if (/^(ok|not ok) \d+ - |^# (tests|pass|fail) /.test(line)) { cur = null; continue; }
    if (cur) cur.push(line);
  }
  return blocks.map((b) => b.join('\n'));
}

const root = mkdtempSync(join(tmpdir(), 'dctt-tasks-mutation-'));
console.log(`temp folder (outside the repo): ${root}`);

const LINT_ANCHOR = "test('source: tasks.ts uses no network or timer API";

function stage(srcText, { skipLint = false } = {}) {
  const dir = mkdtempSync(join(root, 'case-'));
  mkdirSync(join(dir, 'api'));
  mkdirSync(join(dir, 'test'));
  writeFileSync(join(dir, 'api', 'tasks.ts'), srcText, 'utf8');
  if (skipLint) {
    const testText = readFileSync(TEST, 'utf8');
    if (count(testText, LINT_ANCHOR) !== 1) throw new Error('lint test anchor not found exactly once');
    writeFileSync(join(dir, 'test', 'tasks.test.ts'), testText.replace(LINT_ANCHOR, 'test.skip' + LINT_ANCHOR.slice(4)), 'utf8');
  } else {
    copyFileSync(TEST, join(dir, 'test', 'tasks.test.ts'));
  }
  copyFileSync(PKG, join(dir, 'package.json'));
  return dir;
}

function syntaxCheck(dir) {
  const r = spawnSync(process.execPath, ['--check', join('api', 'tasks.ts')], { cwd: dir, encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stderr || '') + (r.stdout || '') };
}

function runSuite(dir) {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', join('test', 'tasks.test.ts')], {
    cwd: dir, encoding: 'utf8',
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const pass = (out.match(/^# pass (\d+)/m) || [])[1];
  const fail = (out.match(/^# fail (\d+)/m) || [])[1];
  return { status: r.status, out, pass: Number(pass ?? NaN), fail: Number(fail ?? NaN) };
}

let allHold = true;

// Baseline: the unmodified copy must parse and pass, or no control means anything.
{
  const dir = stage(original);
  const syn = syntaxCheck(dir);
  const suite = runSuite(dir);
  const green = syn.ok && suite.status === 0 && suite.fail === 0;
  console.log(`[base] unmodified copy: syntax=${syn.ok ? 'OK' : 'FAIL'} suite=${suite.status === 0 ? 'GREEN' : 'RED'} (exit ${suite.status}, pass ${suite.pass}, fail ${suite.fail}) -> ${green ? 'BASELINE GREEN' : 'BASELINE BROKEN'}`);
  if (!green) { allHold = false; console.log(suite.out); }
}

for (const c of CONTROLS) {
  let mutated = original;
  let invalid = '';
  for (const [find, replace] of c.edits) {
    const n = count(mutated, find);
    if (n !== 1) { invalid = `anchor found ${n} times, need exactly 1: ${JSON.stringify(find.slice(0, 60))}`; break; }
    mutated = mutated.replace(find, replace);
  }
  if (!invalid && mutated === original) invalid = 'copy identical to original';
  if (invalid) {
    allHold = false;
    console.log(`[${c.id}] ${c.name}: break NOT applied (${invalid}) -> CONTROL INVALID`);
    continue;
  }
  const dir = stage(mutated);
  const syn = syntaxCheck(dir);
  const suite = runSuite(dir);
  const red = suite.status !== 0 && suite.fail > 0;
  const failedNames = [...suite.out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]);
  let holds = syn.ok && red;
  let extra = '';
  for (const chk of c.checks || []) {
    const hit = chk.re.test(suite.out);
    extra += ` ${chk.label}=${hit ? 'YES' : 'NO'}`;
    holds = holds && hit;
  }
  if (c.everyRed) {
    const blocks = failingBlocks(suite.out);
    const all = blocks.length > 0 && blocks.every((b) => c.everyRed.re.test(b));
    extra += ` ${c.everyRed.label}=${all ? 'YES' : 'NO'} (${blocks.filter((b) => c.everyRed.re.test(b)).length}/${blocks.length})`;
    holds = holds && all;
  }
  let guardRedNames = [];
  if (c.guardOnly) {
    const g = runSuite(stage(mutated, { skipLint: true }));
    guardRedNames = [...g.out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]);
    const gRed = g.status !== 0 && g.fail > 0;
    const gHit = c.guardOnly.re.test(g.out);
    extra += ` ${c.guardOnly.label}=${gRed && gHit ? 'YES' : 'NO'} (lint skipped: exit ${g.status}, pass ${g.pass}, fail ${g.fail})`;
    holds = holds && gRed && gHit;
  }
  if (!holds) allHold = false;
  console.log(`[${c.id}] ${c.name}: applied=YES syntax=${syn.ok ? 'OK' : 'FAIL'} suite=${red ? 'RED' : 'GREEN'} (exit ${suite.status}, pass ${suite.pass}, fail ${suite.fail})${extra} -> ${holds ? 'CONTROL HOLDS' : 'CONTROL FAILS'}`);
  for (const name of failedNames) console.log(`      red: ${name}`);
  for (const name of guardRedNames) console.log(`      red with the lint skipped: ${name}`);
  if (!syn.ok) console.log(syn.out);
}

const after = readFileSync(SRC, 'utf8');
const untouched = after === originalBytes;
console.log(`real api/tasks.ts unchanged: ${untouched ? 'YES' : 'NO'}`);
if (!untouched) allHold = false;

rmSync(root, { recursive: true, force: true });
console.log(`temp folder removed. RESULT: ${allHold ? 'ALL CONTROLS HOLD' : 'SOMETHING DID NOT HOLD'}`);
process.exit(allHold ? 0 : 1);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
