import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { splitSql } from '../../lib/sqlsplit.mjs';
import { join } from 'node:path';
import { CHANGE_SETS, FINAL, NOTIFY, PASTE_FILES, buildPastes, changeSet, checkChangeSets, finalFor, runMakePaste } from '../../make-paste.mjs';
import { MIGRATIONS_DIR, listMigrations } from '../../migrate.mjs';
import { TASKS_DIR } from '../helpers.mjs';

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
const built005 = buildPastes(changeSet('005'));
const built006 = buildPastes(changeSet('006'));
const ALL = [['001-004', built], ['005', built005], ['006', built006]];

test('the committed paste files are exactly what the sources produce, for every change set (regenerate with node make-paste.mjs)', () => {
  const lf = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  for (const [id, b] of ALL) {
    const set = changeSet(id);
    assert.equal(lf(set.files.dryRun), b.dryRun, `${basename(set.files.dryRun)} is stale`);
    assert.equal(lf(set.files.apply), b.apply, `${basename(set.files.apply)} is stale`);
  }
  assert.equal(runMakePaste(['--check'], { out: () => {}, err: () => {} }), 0);
});

// The 001-004 pair is the RECORD of what Justin pasted on 2026-11-06. These are the sha256s of the
// files as merged at 7a60d07 (and unchanged on main at bf6b1b2). If this fails, the record was rewritten.
const APPLIED_SHA256 = {
  'paste-1-dry-run.sql': 'fd1cc0fe7173033638bbe65ba2aa0a2a71b786d10acfd73a242e6de55a1fed97',
  'paste-2-apply.sql': 'de4e6316213bdef7024f5b27d21fc2a8857dc92b57e2eb95d9abbfa917cada8c',
};
test('the APPLIED 001-004 pair is byte-identical to what Justin ran on 2026-11-06 (sha256 pinned), and still generated from 001–004 only', () => {
  for (const which of ['dryRun', 'apply']) {
    const p = PASTE_FILES[which];
    const bytes = readFileSync(p).toString('utf8').replace(/\r\n/g, '\n');
    assert.equal(createHash('sha256').update(bytes, 'utf8').digest('hex'), APPLIED_SHA256[basename(p)], `${basename(p)} changed`);
    assert.equal(createHash('sha256').update(built[which], 'utf8').digest('hex'), APPLIED_SHA256[basename(p)], `make-paste no longer builds ${basename(p)}`);
  }
  assert.deepEqual(changeSet('001-004').migrations, ['001_tasks_columns.sql', '002_task_history.sql', '003_task_triggers.sql', '004_schema_snapshot_fn.sql']);
});

test('every migration belongs to exactly one change set; a migration in none (a future 006) makes make-paste THROW', () => {
  checkChangeSets();
  const files = [...listMigrations(), join(MIGRATIONS_DIR, '006_future.sql')];
  assert.throws(() => checkChangeSets(files), /006_future\.sql is in no change set/);
  const twice = [...CHANGE_SETS, { ...CHANGE_SETS[1], id: 'dup' }];
  assert.throws(() => checkChangeSets(listMigrations(), twice), /005_linear_cutover\.sql is in 2 change sets/);
  assert.throws(() => checkChangeSets(listMigrations().filter((f) => !f.endsWith('005_linear_cutover.sql'))), /named in a change set but is not in migrations/);
  assert.throws(() => changeSet('nope'), /no change set "nope"/);
});

test('each header carries the sha256 of ITS OWN set\'s migrations (file name + LF text, in order), and names its own files and sources', () => {
  for (const [id, b] of ALL) {
    const set = changeSet(id);
    const expected = createHash('sha256')
      .update(set.migrations.map((m) => `${m}\n${readFileSync(join(MIGRATIONS_DIR, m), 'utf8').replace(/\r\n/g, '\n')}`).join('\n'))
      .digest('hex');
    for (const [which, text] of [['dryRun', b.dryRun], ['apply', b.apply]]) {
      assert.match(text, new RegExp(`^-- migrations sha256: ${expected} `, 'm'));
      assert.match(text, new RegExp(`^-- ${basename(set.files[which]).replace(/\./g, '\\.')} — GENERATED`, 'm'));
      assert.ok(text.includes(`(${set.srcLabel})`));
    }
  }
  // 005's pair carries no migration of the applied set, and says what it applies on top of.
  assert.ok(!built005.apply.includes('migration 001_tasks_columns.sql'));
  assert.match(built005.apply, /^-- CHANGE SET 005 \(the Linear cutover\)\. It applies ON TOP OF 001–004/m);
});

test('each paste is ONE statement: a single DO $paste$ block (plus only the NOTIFY in Paste 2), with no transaction control or psql meta-commands', () => {
  for (const [which, text] of ALL.flatMap(([, b]) => [['dryRun', b.dryRun], ['apply', b.apply]])) {
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

test('in each set, the two pastes differ ONLY in the header, the final in-block statement, and Paste 2\'s trailing NOTIFY', () => {
  for (const [id, pair] of ALL) {
  const a = pair.dryRun.split('\n');
  const b = pair.apply.split('\n');
  const bodyStart = (ls) => ls.indexOf('do $paste$');
  const finalIdx = (ls) => ls.indexOf('  -- (d) the final statement') + 1;
  // identical from `do $paste$` to just before the final statement
  assert.deepEqual(a.slice(bodyStart(a), finalIdx(a)), b.slice(bodyStart(b), finalIdx(b)));
  assert.equal(a[finalIdx(a)], finalFor(changeSet(id)).dryRun);
  assert.equal(b[finalIdx(b)], finalFor(changeSet(id)).apply);
  // identical after it, except Paste 2's NOTIFY line
  assert.deepEqual(a.slice(finalIdx(a) + 1), b.slice(finalIdx(b) + 1).filter((l) => l !== NOTIFY));
  assert.ok(b.slice(finalIdx(b) + 1).includes(NOTIFY));
  assert.ok(!a.includes(NOTIFY), 'the dry run must never NOTIFY');
  }
});

test('QC N7: the first statement inside each block sets a transaction-local lock_timeout of 5s', () => {
  for (const text of ALL.flatMap(([, b]) => [b.dryRun, b.apply])) {
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
  for (const [, b] of ALL) {
    assert.match(b.apply.split('\n')[0], /^-- STOP: if the dry run \(Paste 1\) showed M above 0 NOT VALID, do NOT run this today\. Tasks AC first reports which rows fail and the plan to fix and validate them\.$/);
    for (const t of [b.dryRun, b.apply]) assert.match(t.trimEnd(), /FULL FILE LOADED$/);
    assert.match(b.dryRun, /That error IS the success/);
  }
});

test('every migration statement of a set appears verbatim inside an EXECUTE with a unique dollar tag, in its own set\'s paste only', () => {
  for (const [id, b] of ALL) {
    const tags = [...b.apply.matchAll(/^  execute (\$s\d{3}\$)$/gm)].map((m) => m[1]);
    assert.equal(tags.length, b.statementCount);
    assert.equal(new Set(tags).size, tags.length);
    for (const m of changeSet(id).migrations) {
      for (const stmt of splitSql(readFileSync(join(MIGRATIONS_DIR, m), 'utf8'))) assert.ok(b.apply.includes(`\n${stmt}\n$s`), `${id}: missing verbatim: ${stmt.slice(0, 60)}`);
    }
  }
});

test('005\'s before-assertions pin TODAY\'S LIVE SHAPE: every pinned block is verbatim lines of the live snapshot of 2026-11-06 (and of the golden after-004 fixture)', () => {
  const before = readFileSync(join(TASKS_DIR, 'paste-src', '005', 'before.plpgsql'), 'utf8').replace(/\r\n/g, '\n');
  const golden = readFileSync(join(TASKS_DIR, 'test', 'fixtures', 'local-snapshot-after-004.txt'), 'utf8').replace(/\r\n/g, '\n').split('\n');
  const pins = [...before.matchAll(/\$pin\$([\s\S]*?)\$pin\$/g)].map((m) => m[1]);
  assert.ok(pins.length >= 10, `found ${pins.length} pins`);
  for (const pin of pins) {
    for (const line of pin.split('\n')) {
      // A pinned line is a snapshot line, or (for the status rule's bare definition) the tail of one.
      assert.ok(golden.includes(line) || golden.some((g) => g.endsWith(`: ${line}`)), `pinned line is not in the after-004 golden: ${line}`);
    }
  }
  // the three things the design names
  assert.match(before, /CHECK \(\(status = ANY \(ARRAY\['open'::text, 'in_progress'::text, 'blocked'::text, 'done'::text, 'decided_against'::text, 'proposed'::text\]\)\)\)/);
  assert.match(before, /body_md5=527670e20253b2a7c6059a57c3b6a37f/);
  assert.match(before, /body_md5=e39010f0082dd5d81d68d1888b41127f/);
  assert.match(before, /pg_has_role\('authenticator', 'postgres', 'MEMBER'\)/);
});

// ---------------------------------------------------------------------------
// change set 006 (the authorization record)
// ---------------------------------------------------------------------------

// The 005 pair as committed at ed9d5f9 (the CRLF fix that followed its first live dry run). Pinned now that 006
// applies on top of it (build brief 5 v2 §2.1). ⚠️ Pinned to the COMMITTED bytes: whoever holds the live
// record confirms they are the bytes Justin ran; if this fails, the record of 005 was rewritten.
const APPLIED_005_SHA256 = {
  '005-paste-1-dry-run.sql': '6bec1cbc3fcd25494b89cb615584e9f812b3e6bceacd257935cf2e16402c0a1f',
  '005-paste-2-apply.sql': '97ffd67aa36965b739b1c578546652090bb25942369aca08281027b8a95ce707',
};
test('the 005 pair is byte-identical to the committed record (sha256 pinned), and still generated from 005 only', () => {
  for (const which of ['dryRun', 'apply']) {
    const p = changeSet('005').files[which];
    const bytes = readFileSync(p).toString('utf8').replace(/\r\n/g, '\n');
    assert.equal(createHash('sha256').update(bytes, 'utf8').digest('hex'), APPLIED_005_SHA256[basename(p)], `${basename(p)} changed`);
    assert.equal(createHash('sha256').update(built005[which], 'utf8').digest('hex'), APPLIED_005_SHA256[basename(p)], `make-paste no longer builds ${basename(p)}`);
  }
});

test('006: its dry run reports the data steps (B backlog rows moved; A rows backfilled); 001-004 and 005 keep the original final statement', () => {
  assert.equal(finalFor(changeSet('001-004')), FINAL);
  assert.equal(finalFor(changeSet('005')), FINAL);
  const f = finalFor(changeSet('006'));
  assert.match(f.dryRun, /raise exception 'DRY RUN OK — nothing was changed \(% rows; % NOT VALID; % backlog rows moved; % rows backfilled\)'/);
  assert.match(f.dryRun, /v_backlog_moved, \(select count\(\*\) from public\.task_authorizations where tier = 'backfill'\);$/);
  assert.ok(!f.dryRun.includes('<NOT_VALID_COUNT>'), 'the NOT VALID count placeholder was not filled');
  assert.equal(f.apply, FINAL.apply);
  assert.match(built006.apply, /^-- CHANGE SET 006 \(the authorization record\)\. It applies ON TOP OF 005/m);
  assert.ok(!built006.apply.includes('migration 005_linear_cutover.sql'));
});

test('006\'s before-assertions pin THE POST-005 SHAPE: every pinned block is verbatim lines of the after-005 golden', () => {
  const before = readFileSync(join(TASKS_DIR, 'paste-src', '006', 'before.plpgsql'), 'utf8').replace(/\r\n/g, '\n');
  const golden = readFileSync(join(TASKS_DIR, 'test', 'fixtures', 'local-snapshot-after.txt'), 'utf8').replace(/\r\n/g, '\n').split('\n');
  const pins = [...before.matchAll(/\$pin\$([\s\S]*?)\$pin\$/g)].map((m) => m[1]);
  assert.ok(pins.length >= 9, `found ${pins.length} pins`);
  for (const pin of pins) {
    for (const line of pin.split('\n')) assert.ok(golden.includes(line), `pinned line is not in the after-005 golden: ${line}`);
  }
  assert.match(before, /body_md5=f564a9be7ffeaa20db13902d5edcd38b/);
  assert.match(before, /body_md5=5424d669d256941cd7bb671d9a487cc2/);
  assert.match(before, /pg_has_role\('authenticator', 'postgres', 'MEMBER'\)/);
});

test('006\'s after-assertions pin every replaced or new function\'s body exactly as the after-006 golden prints it', () => {
  const after = readFileSync(join(TASKS_DIR, 'paste-src', '006', 'after.plpgsql'), 'utf8').replace(/\r\n/g, '\n');
  const golden = readFileSync(join(TASKS_DIR, 'test', 'fixtures', 'local-snapshot-after-006.txt'), 'utf8').replace(/\r\n/g, '\n').split('\n');
  const fnPin = [...after.matchAll(/\$pin\$(function [\s\S]*?)\$pin\$/g)].map((m) => m[1]);
  assert.equal(fnPin.length, 1);
  const lines = fnPin[0].split('\n');
  assert.equal(lines.length, 10);
  for (const line of lines) assert.ok(golden.includes(line), `pinned function line is not in the after-006 golden: ${line}`);
});
