#!/usr/bin/env node
/**
 * import-linear.mjs — import Linear's OPEN tickets into the task list, ONCE. Dry run by default.
 *
 * USAGE
 *   node import-linear.mjs [--long-body pointer] [--report <path>]          DRY RUN: reads Linear only
 *   node import-linear.mjs --apply [--long-body pointer] [--report <path>]  writes tasks, as actor `ac`
 *
 * - Reads LINEAR_API_KEY from _evryn-meta/.env under the same no-print rules as every script here.
 * - Only READS Linear. Never writes, comments or changes a status there.
 * - --apply is idempotent on linear_id: tickets already imported are skipped. Every write goes
 *   through the database's own rules (actor, checks, history), with actor `ac`.
 * - Run the dry run first, and have Tasks AC confirm the status map in its report, before --apply.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { ConfigError, ENV_FILES, VAR, loadVars, redact, requireVars, teamRestTarget } from './lib/config.mjs';
import { LinearError, fetchOpenIssues, planIssue, renderReport } from './lib/linear.mjs';
import { RestError, makeRest } from './lib/rest.mjs';

export const IMPORT_ACTOR = 'ac';

export async function runImport(argv, { env, fetchImpl = globalThis.fetch, out = (s) => process.stdout.write(s), err = console.error, writeFile = writeFileSync, pageSize } = {}) {
  let secrets = [];
  const warn = (s) => err(redact(s, secrets));
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      // --dry-run is accepted as an explicit no-op: a dry run is already the default (QC Finding 14).
      options: { apply: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, 'long-body': { type: 'string' }, report: { type: 'string' }, help: { type: 'boolean', short: 'h' } },
      strict: true,
      allowPositionals: false,
    }));
  } catch (e) {
    warn(`usage error: ${e instanceof Error ? e.message : 'bad options'}`);
    return 2;
  }
  if (values.help) {
    out('usage: node import-linear.mjs [--dry-run | --apply] [--long-body pointer] [--report <path>]\n  Dry run by default: reads Linear, writes a report, changes nothing. Backlog is never imported.\n');
    return 0;
  }
  if (values.apply && values['dry-run']) {
    warn('usage error: --apply and --dry-run contradict each other; pass one');
    return 2;
  }
  if (values['long-body'] !== undefined && values['long-body'] !== 'pointer') {
    warn("usage error: --long-body takes only 'pointer'");
    return 2;
  }

  try {
    const linearVars = loadVars([VAR.linear], { env, file: ENV_FILES.meta });
    requireVars(linearVars, [VAR.linear], '_evryn-meta/.env');
    secrets = [linearVars[VAR.linear]];

    // In --apply mode, resolve and R5-check the team target BEFORE reading Linear, so a bad target
    // refuses before anything happens at all.
    let rest = null;
    if (values.apply) {
      const target = teamRestTarget(loadVars([VAR.url, VAR.key], { env, file: ENV_FILES.team }));
      secrets.push(target.key);
      rest = makeRest({ target, actor: IMPORT_ACTOR, fetchImpl });
    }

    const issues = await fetchOpenIssues({ key: linearVars[VAR.linear], fetchImpl });
    const plans = issues.map((i) => planIssue(i, { longBody: values['long-body'] ?? 'fail' }));

    let applied;
    if (rest) {
      applied = { inserted: 0, skipped: 0, failed: 0 };
      const existing = new Set(
        (await rest.paginateAll('tasks', 'select=short_id,linear_id&linear_id=not.is.null', { pageSize })).map((r) => r.linear_id),
      );
      for (const p of plans) {
        if (p.verdict !== 'import') continue;
        if (existing.has(p.linear_id)) {
          applied.skipped += 1;
          continue;
        }
        try {
          await rest.request('POST', 'tasks?select=short_id', { body: p.row, prefer: 'return=representation' });
          applied.inserted += 1;
        } catch (e) {
          applied.failed += 1;
          p.verdict = 'fail';
          p.reasons.push(`insert refused: ${e instanceof Error ? e.message : 'unknown error'}${e instanceof RestError && e.code ? ` [${e.code}]` : ''}`);
        }
      }
    }

    const report = renderReport(plans, { mode: values.apply ? 'apply' : 'dry-run', applied });
    if (values.report) {
      // Redacted on the file path exactly as on stdout (QC Finding 8): an error message echoing a key
      // must not land in the report file either.
      writeFile(values.report, redact(report, secrets), 'utf8');
      warn(`report written to ${values.report}`);
    } else {
      out(redact(report, secrets));
    }
    return applied && applied.failed > 0 ? 1 : 0;
  } catch (e) {
    if (e instanceof ConfigError) warn(`REFUSED: ${e.message}`);
    else if (e instanceof LinearError || e instanceof RestError) warn(`FAILED: ${e.message}`);
    else warn(`FAILED: ${e instanceof Error ? e.message : 'unknown error'}`);
    return 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await runImport(process.argv.slice(2));
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
