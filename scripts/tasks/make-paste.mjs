#!/usr/bin/env node
/**
 * make-paste.mjs — generate the two files Justin pastes into the Supabase SQL editor
 * (Soren's design, brief's Log 2026-11-05 16:00–16:08: no agent holds the database password).
 *
 *   paste/paste-1-dry-run.sql   everything, then RAISE "DRY RUN OK — nothing was changed (N rows; M NOT VALID)"
 *   paste/paste-2-apply.sql     everything, refused if M > 0, then NOTIFY pgrst to reload its schema cache
 *
 * USAGE   node make-paste.mjs            write both files
 *         node make-paste.mjs --check    exit 1 if the committed files are not what the sources produce
 *
 * SHAPE — ONE STATEMENT, so Postgres (not the editor) decides atomicity. Each paste is a single
 * `DO $paste$ … $paste$;` block:
 *   (a) before-assertions   (paste-src/before.plpgsql)  — live tasks is runtime 003's shape; nothing of ours exists
 *   (b) the migration       (migrations/*.sql, every statement wrapped VERBATIM as EXECUTE $sNNN$ … $sNNN$)
 *   (c) after-assertions    (paste-src/after.plpgsql)   — every new object, grant and revoke; nothing existing changed
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
import { listMigrations } from './migrate.mjs';
import { splitSql } from './lib/sqlsplit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PASTE_DIR = join(HERE, 'paste');
export const PASTE_SRC = join(HERE, 'paste-src');
export const PASTE_FILES = { dryRun: join(PASTE_DIR, 'paste-1-dry-run.sql'), apply: join(PASTE_DIR, 'paste-2-apply.sql') };

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

export function buildPastes({ migrationFiles = listMigrations(), srcDir = PASTE_SRC } = {}) {
  const migrations = migrationFiles.map((f) => ({ name: basename(f), text: read(f) }));
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
      `-- ${which === 'dryRun' ? 'paste-1-dry-run.sql' : 'paste-2-apply.sql'} — GENERATED by _evryn-meta/scripts/tasks/make-paste.mjs. Do not edit; regenerate.`,
      `-- migrations sha256: ${migrationsHash}  (${migrations.map((m) => m.name).join(', ')}; LF-normalized)`,
      `-- assertions sha256: ${assertionsHash}  (paste-src/declare, before, after)`,
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
  const built = buildPastes();
  if (check) {
    const stale = Object.entries(PASTE_FILES).filter(([k, p]) => !existsSync(p) || read(p) !== built[k]);
    if (stale.length) {
      err(`STALE: ${stale.map(([, p]) => basename(p)).join(', ')} do not match the sources. Run: node make-paste.mjs`);
      return 1;
    }
    out(`OK: both paste files are current (migrations sha256 ${built.migrationsHash.slice(0, 12)}…, ${built.statementCount} statements).`);
    return 0;
  }
  if (!existsSync(PASTE_DIR)) mkdirSync(PASTE_DIR, { recursive: true });
  writeFileSync(PASTE_FILES.dryRun, built.dryRun, 'utf8');
  writeFileSync(PASTE_FILES.apply, built.apply, 'utf8');
  out(`wrote ${basename(PASTE_FILES.dryRun)} and ${basename(PASTE_FILES.apply)} (${built.statementCount} migration statements; migrations sha256 ${built.migrationsHash})`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = runMakePaste(process.argv.slice(2));
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
