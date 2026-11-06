#!/usr/bin/env node
/**
 * make-paste.mjs — generate the files Justin pastes into the Supabase SQL editor
 * (Soren's design, brief's Log 2026-11-05 16:00–16:08: no agent holds the database password).
 *
 * ONE PAIR PER CHANGE SET (CHANGE_SETS below; Soren's cutover design §1.6, 2026-11-06):
 *   001-004 (APPLIED 2026-11-06): paste/paste-1-dry-run.sql, paste/paste-2-apply.sql — byte-identical forever
 *   005 (the Linear cutover):     paste/005-paste-1-dry-run.sql, paste/005-paste-2-apply.sql
 * In each pair:
 *   …-1-dry-run.sql   the set's migrations, then RAISE "DRY RUN OK — nothing was changed (N rows; M NOT VALID)"
 *   …-2-apply.sql     the same, refused if M > 0, then NOTIFY pgrst to reload its schema cache
 *
 * USAGE   node make-paste.mjs            write every set's pair
 *         node make-paste.mjs --check    exit 1 if any committed file is not what the sources produce
 *
 * SHAPE — ONE STATEMENT, so Postgres (not the editor) decides atomicity. Each paste is a single
 * `DO $paste$ … $paste$;` block:
 *   (a) before-assertions   (<set srcDir>/before.plpgsql) — the live shape the set starts from, pinned exactly
 *                           (001-004: runtime 003's shape, nothing of ours; 005: the live shape after 004)
 *   (b) the migration       (the set's migrations, every statement wrapped VERBATIM as EXECUTE $sNNN$ … $sNNN$)
 *   (c) after-assertions    (<set srcDir>/after.plpgsql)  — every new object, grant and revoke; nothing existing changed
 *   (d) the final statement — the only in-block difference between the two pastes.
 * A DO block is one statement: whether the editor sends the text as one batch or splits it, any RAISE
 * rolls back everything before it. Paste 2's NOTIFY sits AFTER the block (a notify in a rolled-back
 * transaction is never delivered, so Paste 1 can never trigger a reload).
 *
 * The two files differ in exactly three places: the header (its file name and instruction lines;
 * Paste 2's FIRST line is the "M above 0 → do not run today" STOP), statement (d), and Paste 2's
 * trailing NOTIFY. A unit test pins that. (The earlier brief said "identical except the last line";
 * that predates putting the dry-run raise INSIDE the one-statement block, which moved the difference.)
 * Paste 2 also REFUSES BY ITSELF if M > 0 — the STOP line's rule, enforced rather than only stated.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MIGRATIONS_DIR, listMigrations } from './migrate.mjs';
import { splitSql } from './lib/sqlsplit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PASTE_DIR = join(HERE, 'paste');
export const PASTE_SRC = join(HERE, 'paste-src');

/**
 * CHANGE SETS (Soren's cutover design §1.6, 2026-11-06). Each set is ONE pair of pastes, built from ITS
 * migrations only, under ITS OWN before- and after-assertions — because each set's before-assertions pin
 * the live shape that set starts from, and only that set's.
 *
 * - '001-004' is APPLIED (Justin pasted it on 2026-11-06). Its migrations are pinned BY NAME, and its two
 *   files must stay byte-identical: they are the record of what he ran. `--check` proves it.
 * - '005' is the Linear cutover: it starts from the live shape 001–004 left.
 * - A migration in no set, or in two, makes buildPastes THROW: a new 006 must get its own set (with its
 *   own paste-src/006/), never silently ride inside another set's hash.
 */
export const CHANGE_SETS = Object.freeze([
  Object.freeze({
    id: '001-004',
    migrations: ['001_tasks_columns.sql', '002_task_history.sql', '003_task_triggers.sql', '004_schema_snapshot_fn.sql'],
    srcDir: PASTE_SRC,
    srcLabel: 'paste-src/declare, before, after',
    files: { dryRun: join(PASTE_DIR, 'paste-1-dry-run.sql'), apply: join(PASTE_DIR, 'paste-2-apply.sql') },
    headerNote: null,
  }),
  Object.freeze({
    id: '005',
    migrations: ['005_linear_cutover.sql'],
    srcDir: join(PASTE_SRC, '005'),
    srcLabel: 'paste-src/005/declare, before, after',
    files: { dryRun: join(PASTE_DIR, '005-paste-1-dry-run.sql'), apply: join(PASTE_DIR, '005-paste-2-apply.sql') },
    headerNote: 'CHANGE SET 005 (the Linear cutover). It applies ON TOP OF 001–004, which Justin pasted on 2026-11-06; it refuses on any other starting shape.',
  }),
]);

/** The applied set's files (kept under this name for the tests and README that use it). */
export const PASTE_FILES = CHANGE_SETS[0].files;

export function changeSet(id) {
  const set = CHANGE_SETS.find((s) => s.id === id);
  if (!set) throw new Error(`make-paste: no change set "${id}" (have: ${CHANGE_SETS.map((s) => s.id).join(', ')})`);
  return set;
}

/** Every file in migrations/ belongs to exactly one change set, and every named file exists. */
export function checkChangeSets(migrationFiles = listMigrations(), sets = CHANGE_SETS) {
  const onDisk = migrationFiles.map((f) => basename(f));
  const named = sets.flatMap((s) => s.migrations);
  const problems = [];
  for (const f of onDisk) {
    const n = named.filter((m) => m === f).length;
    if (n === 0) problems.push(`${f} is in no change set`);
    if (n > 1) problems.push(`${f} is in ${n} change sets`);
  }
  for (const m of named) if (!onDisk.includes(m)) problems.push(`${m} is named in a change set but is not in migrations/`);
  if (problems.length) throw new Error(`make-paste: change sets do not match migrations/: ${problems.join('; ')}`);
}

const lf = (s) => s.replace(/\r\n/g, '\n');
const read = (p) => lf(readFileSync(p, 'utf8'));
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

const NOT_VALID_COUNT = `(select count(*) from pg_constraint where conrelid = 'public.tasks'::regclass and contype = 'c' and not convalidated)`;

/** Statement (d). The exact dry-run wording (Soren, 16:07–16:08) is a prefix, followed by the counts. */
export const FINAL = {
  dryRun: `  raise exception 'DRY RUN OK — nothing was changed (% rows; % NOT VALID)', (select count(*) from public.tasks), ${NOT_VALID_COUNT};`,
  apply: `  if ${NOT_VALID_COUNT} > 0 then raise exception 'APPLY REFUSED — % constraint(s) would be left NOT VALID by existing rows. Nothing was changed. Run Paste 1, have Tasks AC report the failing rows, and fix them first.', ${NOT_VALID_COUNT}; end if;`,
};

export const NOTIFY = `notify pgrst, 'reload schema';`;

export function buildPastes(set = CHANGE_SETS[0]) {
  checkChangeSets();
  const migrations = set.migrations.map((name) => ({ name, text: read(join(MIGRATIONS_DIR, name)) }));
  const srcDir = set.srcDir;
  const declare = read(join(srcDir, 'declare.plpgsql'));
  const before = read(join(srcDir, 'before.plpgsql'));
  const after = read(join(srcDir, 'after.plpgsql'));

  const migrationsHash = sha256(migrations.map((m) => `${m.name}\n${m.text}`).join('\n'));
  const assertionsHash = sha256([declare, before, after].join('\n'));

  const body = [];
  let k = 0;
  for (const m of migrations) {
    body.push(`  -- ---- migration ${m.name} ----`);
    for (const stmt of splitSql(m.text)) {
      k += 1;
      const tag = `$s${String(k).padStart(3, '0')}$`;
      if (stmt.includes(tag) || stmt.includes('$paste$')) throw new Error(`make-paste: ${m.name} contains the reserved tag ${tag} or $paste$`);
      body.push(`  execute ${tag}\n${stmt}\n${tag};`);
    }
  }
  for (const part of [declare, before, after]) {
    if (part.includes('$paste$')) throw new Error('make-paste: an assertion source contains $paste$');
  }

  const header = (which) => {
    const lines = [
      ...(which === 'apply'
        ? ['-- STOP: if the dry run (Paste 1) showed M above 0 NOT VALID, do NOT run this today. Tasks AC first reports which rows fail and the plan to fix and validate them.']
        : []),
      `-- ${basename(set.files[which])} — GENERATED by _evryn-meta/scripts/tasks/make-paste.mjs. Do not edit; regenerate.`,
      `-- migrations sha256: ${migrationsHash}  (${migrations.map((m) => m.name).join(', ')}; LF-normalized)`,
      `-- assertions sha256: ${assertionsHash}  (${set.srcLabel})`,
      ...(set.headerNote ? [`-- ${set.headerNote}`] : []),
      '--',
      '-- Target: the "Evryn Team" Supabase project (ref azugibmylktinddyqkhd). Paste the WHOLE file into its SQL editor and Run.',
      '-- It is ONE statement (a single DO block): it applies completely, or changes nothing.',
    ];
    if (which === 'dryRun') {
      lines.push(
        '-- EXPECTED RESULT: an ERROR reading  DRY RUN OK — nothing was changed (N rows; M NOT VALID)',
        '-- That error IS the success: every step ran and passed, then everything was rolled back.',
        '-- Any other error means a check failed; nothing was changed. Report it as it reads.',
        '-- N = rows in tasks today; M = rules that existing rows would break (left NOT VALID). Report both.',
      );
    } else {
      lines.push(
        '-- Run only after Paste 1 printed "DRY RUN OK — nothing was changed (N rows; 0 NOT VALID)". (This paste also refuses by itself if M > 0.)',
        '-- EXPECTED RESULT: success, no rows. If it ends in an ERROR, nothing was changed; report it as it reads.',
      );
    }
    return lines.join('\n');
  };

  const assemble = (which) =>
    [
      header(which),
      '',
      'do $paste$',
      'declare',
      declare.trimEnd(),
      'begin',
      '  -- A held lock on tasks must FAIL the paste, not hang the editor (QC N7). Transaction-local.',
      "  perform set_config('lock_timeout', '5s', true);",
      '',
      before.trimEnd(),
      '',
      '  -- =========================================================================================',
      `  -- (b) THE MIGRATION — ${migrations.map((m) => m.name).join(', ')}, statement by statement, verbatim.`,
      '  -- =========================================================================================',
      body.join('\n'),
      '',
      after.trimEnd(),
      '',
      '  -- (d) the final statement',
      FINAL[which],
      'end',
      '$paste$;',
      ...(which === 'apply' ? [NOTIFY] : []),
      '-- If you can read this line, the whole file was copied. Truncation canary — DO NOT REMOVE: FULL FILE LOADED',
      '',
    ].join('\n');

  return { dryRun: assemble('dryRun'), apply: assemble('apply'), migrationsHash, assertionsHash, statementCount: k };
}

export function runMakePaste(argv, { out = console.log, err = console.error } = {}) {
  const check = argv.includes('--check');
  if (argv.some((a) => a !== '--check')) {
    err('usage: node make-paste.mjs [--check]');
    return 2;
  }
  const builtSets = CHANGE_SETS.map((set) => ({ set, built: buildPastes(set) }));
  if (check) {
    const stale = builtSets.flatMap(({ set, built }) =>
      Object.entries(set.files).filter(([k, p]) => !existsSync(p) || read(p) !== built[k]).map(([, p]) => basename(p)),
    );
    if (stale.length) {
      err(`STALE: ${stale.join(', ')} do not match the sources. Run: node make-paste.mjs`);
      return 1;
    }
    for (const { set, built } of builtSets) {
      out(`OK: change set ${set.id}: both paste files are current (migrations sha256 ${built.migrationsHash.slice(0, 12)}…, ${built.statementCount} statements).`);
    }
    return 0;
  }
  if (!existsSync(PASTE_DIR)) mkdirSync(PASTE_DIR, { recursive: true });
  for (const { set, built } of builtSets) {
    writeFileSync(set.files.dryRun, built.dryRun, 'utf8');
    writeFileSync(set.files.apply, built.apply, 'utf8');
    out(`change set ${set.id}: wrote ${basename(set.files.dryRun)} and ${basename(set.files.apply)} (${built.statementCount} migration statements; migrations sha256 ${built.migrationsHash})`);
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = runMakePaste(process.argv.slice(2));
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
