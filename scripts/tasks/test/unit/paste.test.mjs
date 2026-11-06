import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { splitSql } from '../../lib/sqlsplit.mjs';
import { FINAL, NOTIFY, PASTE_FILES, buildPastes, runMakePaste } from '../../make-paste.mjs';
import { listMigrations } from '../../migrate.mjs';

// ---------------------------------------------------------------------------
// the splitter
// ---------------------------------------------------------------------------

test('splitSql: splits on top-level semicolons only', () => {
  assert.deepEqual(splitSql('select 1; select 2;\nselect 3'), ['select 1', 'select 2', 'select 3']);
});

test('splitSql: a ; inside strings, E-strings, identifiers, comments and dollar quotes does not split', () => {
  const sql = [
    "select 'a;b', 'it''s; fine';",
    "select E'x\\';y', E'\\\\';",
    'select "we;ird" from t;',
    '-- a comment; with a semicolon\nselect 1;',
    '/* block; /* nested; */ still; */ select 2;',
    'do $$ begin perform 1; perform 2; end $$;',
    'create function f() returns int language sql as $body$ select 1; $body$;',
    "do $x$ begin execute $q$ select ';'; $q$; end $x$;",
  ].join('\n');
  const parts = splitSql(sql);
  assert.equal(parts.length, 8, JSON.stringify(parts, null, 1));
  assert.match(parts[5], /^do \$\$ begin perform 1; perform 2; end \$\$$/);
});

test('splitSql: comment-only fragments are dropped; unterminated quotes are LOUD', () => {
  assert.deepEqual(splitSql('-- just a comment\n;\n/* and this */;  \n'), []);
  assert.throws(() => splitSql("select 'oops"), /unterminated string/);
  assert.throws(() => splitSql('do $$ begin'), /unterminated dollar quote/);
});

test('splitSql over the real migrations: every statement survives, none is empty, the canaries are dropped', () => {
  let total = 0;
  for (const f of listMigrations()) {
    const parts = splitSql(readFileSync(f, 'utf8'));
    assert.ok(parts.length > 0, f);
    for (const p of parts) assert.ok(!/^\s*$/.test(p));
    assert.ok(!parts.some((p) => /^-- Truncation canary/.test(p)));
    total += parts.length;
  }
  assert.ok(total > 50);
});

// ---------------------------------------------------------------------------
// make-paste
// ---------------------------------------------------------------------------

const built = buildPastes();

test('the committed paste files are exactly what the sources produce (regenerate with node make-paste.mjs)', () => {
  const lf = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  assert.equal(lf(PASTE_FILES.dryRun), built.dryRun, 'paste-1-dry-run.sql is stale');
  assert.equal(lf(PASTE_FILES.apply), built.apply, 'paste-2-apply.sql is stale');
  assert.equal(runMakePaste(['--check'], { out: () => {}, err: () => {} }), 0);
});

test('each header carries the sha256 of the migrations (file name + LF text, in order)', () => {
  const expected = createHash('sha256')
    .update(listMigrations().map((f) => `${basename(f)}\n${readFileSync(f, 'utf8').replace(/\r\n/g, '\n')}`).join('\n'))
    .digest('hex');
  for (const text of [built.dryRun, built.apply]) {
    assert.match(text, new RegExp(`^-- migrations sha256: ${expected} `, 'm'));
  }
});

test('each paste is ONE statement: a single DO $paste$ block (plus only the NOTIFY in Paste 2), with no transaction control or psql meta-commands', () => {
  for (const [which, text] of [['dryRun', built.dryRun], ['apply', built.apply]]) {
    const stmts = splitSql(text);
    const expected = which === 'apply' ? 2 : 1;
    assert.equal(stmts.length, expected, `${which}: ${stmts.length} statements`);
    assert.match(stmts[0], /^(--[^\n]*\n|\n)*do \$paste\$\ndeclare\n/);
    assert.match(stmts[0], /\nend\n\$paste\$$/);
    if (which === 'apply') assert.equal(stmts[1], NOTIFY.replace(/;$/, ''));
    assert.doesNotMatch(text, /^\s*(begin|commit|rollback|start transaction)\s*;/im, `${which} has transaction control`);
    assert.doesNotMatch(text, /^\\/m, `${which} has a psql meta-command`);
  }
});

test('the two pastes differ ONLY in the header, the final in-block statement, and Paste 2\'s trailing NOTIFY', () => {
  const a = built.dryRun.split('\n');
  const b = built.apply.split('\n');
  const bodyStart = (ls) => ls.indexOf('do $paste$');
  const finalIdx = (ls) => ls.indexOf('  -- (d) the final statement') + 1;
  // identical from `do $paste$` to just before the final statement
  assert.deepEqual(a.slice(bodyStart(a), finalIdx(a)), b.slice(bodyStart(b), finalIdx(b)));
  assert.equal(a[finalIdx(a)], FINAL.dryRun);
  assert.equal(b[finalIdx(b)], FINAL.apply);
  // identical after it, except Paste 2's NOTIFY line
  assert.deepEqual(a.slice(finalIdx(a) + 1), b.slice(finalIdx(b) + 1).filter((l) => l !== NOTIFY));
  assert.ok(b.slice(finalIdx(b) + 1).includes(NOTIFY));
  assert.ok(!a.includes(NOTIFY), 'the dry run must never NOTIFY');
});

test('QC N7: the first statement inside each block sets a transaction-local lock_timeout of 5s', () => {
  for (const text of [built.dryRun, built.apply]) {
    const body = text.split('\nbegin\n')[1];
    const firstStatement = body.split('\n').find((l) => l.trim() !== '' && !l.trim().startsWith('--'));
    assert.equal(firstStatement, "  perform set_config('lock_timeout', '5s', true);");
  }
});

test('Paste 1 ends with the exact dry-run wording as a prefix; Paste 2 refuses on any NOT VALID constraint', () => {
  assert.match(FINAL.dryRun, /raise exception 'DRY RUN OK — nothing was changed \(% rows; % NOT VALID\)'/);
  assert.match(FINAL.apply, /> 0 then raise exception 'APPLY REFUSED/);
});

test('Paste 2\'s FIRST line is the STOP instruction; both end with the canary; Paste 1 explains its expected error', () => {
  assert.match(built.apply.split('\n')[0], /^-- STOP: if the dry run \(Paste 1\) showed M above 0 NOT VALID, do NOT run this today\. Tasks AC first reports which rows fail and the plan to fix and validate them\.$/);
  for (const t of [built.dryRun, built.apply]) assert.match(t.trimEnd(), /FULL FILE LOADED$/);
  assert.match(built.dryRun, /That error IS the success/);
});

test('every migration statement appears verbatim inside an EXECUTE with a unique dollar tag', () => {
  const tags = [...built.apply.matchAll(/^  execute (\$s\d{3}\$)$/gm)].map((m) => m[1]);
  assert.equal(tags.length, built.statementCount);
  assert.equal(new Set(tags).size, tags.length);
  for (const f of listMigrations()) {
    for (const stmt of splitSql(readFileSync(f, 'utf8'))) assert.ok(built.apply.includes(`\n${stmt}\n$s`), `missing verbatim: ${stmt.slice(0, 60)}`);
  }
});
