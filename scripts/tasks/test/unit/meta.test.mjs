/**
 * meta.test.mjs — guards on the suite and the scripts themselves, the kind of rule that otherwise
 * lives only in a reviewer's memory.
 */
import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { TASKS_DIR } from '../helpers.mjs';

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(TASKS_DIR);

test('every test file imports ../helpers.mjs FIRST (it arms the .env tripwire before anything else loads)', () => {
  const tests = files.filter((f) => f.endsWith('.test.mjs'));
  assert.ok(tests.length >= 6);
  for (const f of tests) {
    // Split on CRLF too: core.autocrlf=true checks these files out with CRLF on Justin's machines.
    const firstImport = readFileSync(f, 'utf8').split(/\r?\n/).find((l) => l.startsWith('import '));
    assert.equal(firstImport, "import '../helpers.mjs';", `${relative(TASKS_DIR, f)} does not import helpers first`);
  }
});

test('SEALED-EXEC: every spawn call site carries the audit comment on the line above', () => {
  const code = files.filter((f) => f.endsWith('.mjs'));
  let sites = 0;
  for (const f of code) {
    const lines = readFileSync(f, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (/\b(spawnSync|spawn|execFile|execFileSync|exec|execSync)\(/.test(line) && !/^\s*(\*|\/\/)/.test(line) && !line.includes('function ')) {
        sites += 1;
        const above = lines.slice(Math.max(0, i - 3), i).join('\n');
        assert.match(above, /SEALED-EXEC: followed 2026-08-11 — /, `${relative(TASKS_DIR, f)}:${i + 1} spawns without a SEALED-EXEC comment`);
      }
    });
  }
  assert.ok(sites >= 5, `expected to find the spawn sites, found ${sites}`);
});

test('no script invokes a tool by bare name through a package runner', () => {
  for (const f of files.filter((p) => p.endsWith('.mjs') && !p.endsWith('meta.test.mjs'))) {
    const text = readFileSync(f, 'utf8');
    assert.doesNotMatch(text, /['"`](npx|pnpx|bunx|yarn dlx)['"` ]/, relative(TASKS_DIR, f));
  }
});

test('the roster lives in exactly one place (public.task_roster in 003); nothing else copies it', () => {
  // A "copy" = any shipped file naming three roster members who appear nowhere else together.
  const shipped = files.filter((f) => !relative(TASKS_DIR, f).replace(/\\/g, '/').startsWith('test/'));
  const holders = shipped.filter((f) => {
    const text = readFileSync(f, 'utf8').toLowerCase();
    return ['marlowe', 'dominic', 'nathan'].every((n) => text.includes(n));
  });
  assert.deepEqual(holders.map((f) => relative(TASKS_DIR, f).replace(/\\/g, '/')), ['migrations/003_task_triggers.sql']);
});

test('every migration and script carries its truncation canary', () => {
  for (const f of files.filter((p) => /\.(sql|mjs)$/.test(p) && !p.includes(`${'test'}`) && !p.endsWith('tasks.mjs'))) {
    assert.match(readFileSync(f, 'utf8').trimEnd(), /FULL FILE LOADED$/, relative(TASKS_DIR, f));
  }
});
