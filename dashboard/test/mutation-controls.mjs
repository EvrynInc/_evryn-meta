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
// For every control it prints: whether the break applied (the anchor text was found
// exactly once and the copy differs from the original), whether the broken copy still
// PARSES (node --check), and the suite's result. A control HOLDS only if the break
// applied, the copy parsed, and the suite went RED. A copy that fails to parse proves
// nothing, because a suite that cannot load fails for the wrong reason.
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

// Each control: a name, the suite that must go red, and one exact-text replacement.
const CONTROLS = [
  {
    id: 'a', name: 'write: add an insert call',
    find: '    const client = await deps.createClient(url, key);\n',
    replace: "    const client = await deps.createClient(url, key);\n    await client.from('tasks').insert({ title: 'x' });\n",
  },
  {
    id: 'b', name: 'write: add an rpc call',
    find: '    const client = await deps.createClient(url, key);\n',
    replace: "    const client = await deps.createClient(url, key);\n    await client.rpc('noop');\n",
  },
  {
    id: 'c', name: 'read from a second table',
    find: '    const client = await deps.createClient(url, key);\n',
    replace: "    const client = await deps.createClient(url, key);\n    await client.from('agent_state').select('agent');\n",
  },
  {
    id: 'd', name: 'auth: remove the checkAuth call (must turn the AUTH suite red)',
    find: '  const denied = checkAuth(request, env.DASHBOARD_PASSWORD);\n  if (denied) return denied;\n',
    replace: '',
    mustFail: /^not ok \d+ - auth: /m,
  },
  {
    id: 'e', name: 'columns: add description to the select',
    find: "  'short_id, title, status,",
    replace: "  'short_id, title, description, status,",
  },
  {
    id: 'f', name: 'method: let POST through',
    find: "  if (request.method !== 'GET') {",
    replace: "  if (request.method !== 'GET' && request.method !== 'POST') {",
  },
  {
    id: 'g', name: 'paging: stop on a short page instead of a zero-row page',
    find: '    if (rows.length === 0) return { rows: out, truncated: false };\n    out.push(...rows);\n',
    replace: '    out.push(...rows);\n    if (rows.length < PAGE_SIZE) return { rows: out, truncated: false };\n',
  },
];

function count(hay, needle) {
  let n = 0, i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}

const root = mkdtempSync(join(tmpdir(), 'dctt-tasks-mutation-'));
console.log(`temp folder (outside the repo): ${root}`);

function stage(srcText) {
  const dir = mkdtempSync(join(root, 'case-'));
  mkdirSync(join(dir, 'api'));
  mkdirSync(join(dir, 'test'));
  writeFileSync(join(dir, 'api', 'tasks.ts'), srcText, 'utf8');
  copyFileSync(TEST, join(dir, 'test', 'tasks.test.ts'));
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
  const n = count(original, c.find);
  if (n !== 1) {
    allHold = false;
    console.log(`[${c.id}] ${c.name}: break NOT applied (anchor found ${n} times, need exactly 1) -> CONTROL INVALID`);
    continue;
  }
  const mutated = original.replace(c.find, c.replace);
  if (mutated === original) {
    allHold = false;
    console.log(`[${c.id}] ${c.name}: break NOT applied (copy identical to original) -> CONTROL INVALID`);
    continue;
  }
  const dir = stage(mutated);
  const syn = syntaxCheck(dir);
  const suite = runSuite(dir);
  const red = suite.status !== 0 && suite.fail > 0;
  const failedNames = [...suite.out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]);
  let holds = syn.ok && red;
  let extra = '';
  if (c.mustFail) {
    const hit = c.mustFail.test(suite.out);
    extra = ` auth-suite-red=${hit ? 'YES' : 'NO'}`;
    holds = holds && hit;
  }
  if (!holds) allHold = false;
  console.log(`[${c.id}] ${c.name}: applied=YES syntax=${syn.ok ? 'OK' : 'FAIL'} suite=${red ? 'RED' : 'GREEN'} (exit ${suite.status}, pass ${suite.pass}, fail ${suite.fail})${extra} -> ${holds ? 'CONTROL HOLDS' : 'CONTROL FAILS'}`);
  for (const name of failedNames) console.log(`      red: ${name}`);
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
