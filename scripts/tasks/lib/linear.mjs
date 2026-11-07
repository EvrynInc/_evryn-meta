/**
 * linear.mjs — the one-time Linear import's logic: READ Linear's open tickets, plan each one, report.
 *
 * - READ-ONLY against Linear: one GraphQL query, no mutation anywhere in this file. It never writes,
 *   comments, or changes a status in Linear (cutover is a Meta-Meeting decision).
 * - Team "Evryn", as `shared/protocols/linear-protocol.md` requires; read = state type not
 *   completed/canceled. Paginated to the end, loudly bounded. BACKLOG is read but NEVER imported
 *   (Soren, 15:38): "open tickets" means non-Backlog, non-closed; the report counts Backlog by owner.
 * - NOTHING here treats Linear's "Authorized" column as authorization: it maps to `open`, and the
 *   verbatim status is kept in linear_status for the record. The map is a PROPOSAL that Tasks AC
 *   confirms before the real run.
 * - A title over 80 characters FAILS its ticket — never truncated. A body over 600 fails too,
 *   unless --long-body pointer is chosen (then the body becomes a pointer back to the ticket, and
 *   the report lists every such ticket as OWED: move the substance to a doc before Linear closes).
 * - Nathan's tickets (any RACI label naming nathan) are HELD for him, not imported.
 * - A Justin ticket (R: justin, OR R: lucas with I: justin — see isJustinTicket) with a due date
 *   gets addressed_to justin + needed_by. One with no due date gets neither and is LISTED in the
 *   report, count and headlines, so Thea and the Admiral can date or close it (Soren, 14:47 and
 *   15:29) — otherwise it would drop off his radar unseen.
 * - "Needs Acceptance" imports as blocked and is listed under "awaiting Justin's acceptance".
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { isSafeActorName } from './config.mjs';
import { DEFAULT_ACCOUNTABLE } from './defaults.mjs';
import { screenRow } from './screen.mjs';

export const LINEAR_ENDPOINT = 'https://api.linear.app/graphql';

/** Proposed map, Linear state NAME → task status. Tasks AC confirms it before --apply. */
// Backlog is deliberately ABSENT: it is skipped, never imported (Soren, 15:38; see planIssue).
// Linear's `triage` state is unmapped too, so a triage ticket FAILS loudly rather than guessing.
export const STATUS_MAP = Object.freeze({
  Todo: 'open',
  Authorized: 'open', // NOT an authorization: Linear's column is non-binding (2026-07-24 safeguard)
  'Needs Authorization': 'proposed',
  'In Progress': 'in_progress',
  // Blocked on Justin's acceptance (Soren S3, 15:29). Listed in the report under
  // "awaiting Justin's acceptance"; linear_status keeps the verbatim "Needs Acceptance".
  'Needs Acceptance': 'blocked',
  Blocked: 'blocked',
});

/**
 * A "Justin ticket": R: justin, OR R: lucas together with I: justin. The Linear protocol (line 50)
 * routes Justin-bound tickets to R: lucas, so most of them carry R: lucas + I: justin, not
 * R: justin (Soren S3, 15:29). This definition drives BOTH addressed_to and the undated-Justin list.
 */
export function isJustinTicket(raci) {
  return raci.r.includes('justin') || (raci.r.includes('lucas') && raci.i.includes('justin'));
}

export const OPEN_ISSUES_QUERY = `query OpenIssues($after: String) {
  issues(first: 50, after: $after, filter: { team: { name: { eq: "Evryn" } }, state: { type: { nin: ["completed", "canceled"] } } }) {
    pageInfo { hasNextPage endCursor }
    nodes { identifier title description dueDate url state { name type } labels(first: 50) { nodes { name } } }
  }
}`;

export class LinearError extends Error {}

export async function fetchOpenIssues({ key, fetchImpl, maxPages = 100 }) {
  const issues = [];
  let after = null;
  for (let page = 0; page < maxPages; page += 1) {
    let res;
    try {
      res = await fetchImpl(LINEAR_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: OPEN_ISSUES_QUERY, variables: { after } }),
      });
    } catch (err) {
      throw new LinearError(`Linear request failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new LinearError(`Linear returned HTTP ${res.status} with a non-JSON body`);
    }
    if (!res.ok || body.errors) {
      const msg = body.errors ? body.errors.map((e) => e.message).join('; ') : `HTTP ${res.status}`;
      throw new LinearError(`Linear query failed: ${msg}`);
    }
    const conn = body.data.issues;
    issues.push(...conn.nodes);
    if (!conn.pageInfo.hasNextPage) return issues;
    after = conn.pageInfo.endCursor;
  }
  throw new LinearError(`Linear: page budget (${maxPages} pages) exhausted with tickets still unread — refusing a partial import`);
}

export function parseLabels(labelNames) {
  const raci = { r: [], a: [], c: [], i: [] };
  const other = [];
  for (const name of labelNames) {
    const m = name.match(/^([RACI]):\s*(.+)$/);
    if (m) raci[m[1].toLowerCase()].push(m[2].trim().toLowerCase());
    else other.push(name);
  }
  return { raci, other };
}

/** Linear's Backlog: by state type (the stable signal) or by the state's name. */
export function isBacklog(issue) {
  return issue.state?.type === 'backlog' || issue.state?.name === 'Backlog';
}

/**
 * Plan one ticket. Returns { linear_id, title, linearStatus, status, verdict, reasons, warnings, row,
 * justinNoDate, pointered, backlogOwner }.
 * verdict: 'import' | 'fail' | 'held' | 'skipped-backlog'.
 *
 * A HELD or BACKLOG plan carries NO title (title: null): the report cannot print what the plan does
 * not hold. Held tickets are Nathan's privileged-content risk (QC Finding 13, confirmed by Soren); a
 * Backlog ticket is only counted, by owner.
 */
export function planIssue(issue, { longBody = 'fail' } = {}) {
  const reasons = [];
  const warnings = [];
  const labels = (issue.labels?.nodes ?? []).map((l) => l.name);
  const { raci, other } = parseLabels(labels);
  const linearStatus = issue.state?.name ?? '';
  const status = STATUS_MAP[linearStatus];
  const plan = {
    linear_id: issue.identifier,
    title: issue.title ?? '',
    linearStatus,
    status: status ?? '(unmapped)',
    verdict: 'import',
    reasons,
    warnings,
    row: null,
    justinNoDate: false,
    pointered: false,
    backlogOwner: null,
  };

  // Soren, 15:38: Backlog is NOT imported. "Open tickets" in requirement 10 means non-Backlog,
  // non-closed; Backlog stays readable in Linear for the cutover sweep, and the report counts it by owner.
  if (isBacklog(issue)) {
    plan.verdict = 'skipped-backlog';
    plan.title = null;
    plan.status = '(not imported)';
    plan.backlogOwner = raci.r[0] ?? '(no R: label)';
    reasons.push('Backlog — not imported (Soren, 15:38)');
    return plan;
  }

  const everyone = [...raci.r, ...raci.a, ...raci.c, ...raci.i];
  if (everyone.includes('nathan')) {
    plan.verdict = 'held';
    plan.title = null;
    reasons.push('held for Nathan (privileged-content screen is his) — not imported');
    return plan;
  }

  if (!status) reasons.push(`unmapped Linear status "${linearStatus}"`);
  if (plan.title.length > 80) reasons.push(`title is ${plan.title.length} characters (limit 80) — shorten it by hand; never truncated`);
  if (plan.title.trim() === '') reasons.push('blank title');
  if (raci.r.length === 0) reasons.push('no R: label, so no owner');
  if (raci.r.length > 1) reasons.push(`more than one R: label (${raci.r.join(', ')}) — a task has one owner`);
  if (raci.a.length > 1) reasons.push(`more than one A: label (${raci.a.join(', ')})`);
  for (const n of everyone) if (!isSafeActorName(n)) reasons.push(`label name "${n}" is not a valid actor name`);

  let description = issue.description ?? '';
  if (description.length > 600) {
    if (longBody === 'pointer') {
      warnings.push(`body is ${description.length} characters; replaced by a pointer to the Linear ticket`);
      plan.pointered = true;
      description = `Body (${description.length} chars) not imported; it stays in Linear ${issue.identifier}: ${issue.url ?? ''}`.slice(0, 600);
    } else {
      reasons.push(`body is ${description.length} characters (limit 600) — move it to a doc, or rerun with --long-body pointer`);
    }
  }

  const owner = raci.r[0];
  const row = {
    title: plan.title,
    description,
    status: status ?? 'open',
    raci: { r: owner, a: raci.a[0] ?? DEFAULT_ACCOUNTABLE }, // an explicit A: label is still honored
    links: [],
    linear_id: issue.identifier,
    linear_status: linearStatus,
  };
  if (raci.c.length) row.raci.c = raci.c;
  if (raci.i.length) row.raci.i = raci.i;
  if (other.length) row.tags = other;
  if (issue.dueDate) row.needed_by = issue.dueDate;
  if (isJustinTicket(raci)) {
    if (issue.dueDate) row.addressed_to = 'justin';
    else plan.justinNoDate = true;
  }

  const screen = screenRow(row);
  for (const r of screen.refused) reasons.push(`${r.field} contains something shaped like an ${r.kind}`);
  for (const w of screen.warnings) warnings.push(`${w.field} contains something shaped like a ${w.kind}`);

  plan.row = row;
  if (reasons.length) plan.verdict = 'fail';
  return plan;
}

/** A plan's title for the report — or a marker, for plans that deliberately carry none. */
function shownTitle(p) {
  if (p.title === null) return p.verdict === 'held' ? '(title withheld — held for Nathan)' : '(title not shown)';
  return p.title;
}

export function renderReport(plans, { mode, applied } = {}) {
  const lines = [];
  const count = (v) => plans.filter((p) => p.verdict === v).length;
  const active = plans.filter((p) => p.verdict !== 'skipped-backlog');
  lines.push(`# Linear import report — ${mode === 'apply' ? 'APPLY' : 'DRY RUN (nothing written anywhere)'}`);
  lines.push('');
  lines.push(
    `Tickets read: ${plans.length} · Backlog, not imported: ${count('skipped-backlog')} · open (non-Backlog): ${active.length} · ` +
      `would import: ${count('import')} · fail: ${count('fail')} · held for Nathan: ${count('held')}`,
  );
  if (applied) {
    lines.push(`Applied: inserted ${applied.inserted} · already imported (skipped): ${applied.skipped} · insert failures: ${applied.failed}`);
  }
  lines.push('');
  lines.push('## Status map (proposed — Tasks AC confirms before --apply; "Authorized" is NOT an authorization)');
  for (const [k, v] of Object.entries(STATUS_MAP)) lines.push(`- "${k}" → ${v}`);
  lines.push('- "Backlog" → not imported (counted by owner below); any other state → FAILS as unmapped');
  lines.push('');
  lines.push('## Every open (non-Backlog) ticket');
  lines.push('| Linear | mapped | Linear status (verbatim) | screen / result | headline |');
  lines.push('|---|---|---|---|---|');
  for (const p of active) {
    const result = p.verdict === 'import' ? (p.warnings.length ? `ok, WARN: ${p.warnings.join('; ')}` : 'ok') : `${p.verdict.toUpperCase()}: ${p.reasons.join('; ')}`;
    lines.push(`| ${p.linear_id} | ${p.status} | "${p.linearStatus}" | ${result.replace(/\|/g, '/')} | ${shownTitle(p).replace(/\|/g, '/')} |`);
  }
  const backlog = plans.filter((p) => p.verdict === 'skipped-backlog');
  const byOwner = new Map();
  for (const p of backlog) byOwner.set(p.backlogOwner, (byOwner.get(p.backlogOwner) ?? 0) + 1);
  lines.push('');
  lines.push(`## Backlog, by R: owner (${backlog.length}) — NOT imported; stays in Linear for the cutover sweep (Soren, 15:38)`);
  for (const [owner, n] of [...byOwner].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) lines.push(`- ${owner}: ${n}`);
  const long = active.filter((p) => p.title !== null && p.title.length > 80);
  lines.push('');
  lines.push(`## Titles over 80 characters (${long.length}) — each FAILS; shorten by hand, never truncated`);
  for (const p of long) lines.push(`- ${p.linear_id} (${p.title.length}): ${p.title}`);
  const awaiting = active.filter((p) => p.linearStatus === 'Needs Acceptance');
  lines.push('');
  lines.push(`## Awaiting Justin's acceptance (${awaiting.length}) — Linear "Needs Acceptance", imported as blocked`);
  for (const p of awaiting) lines.push(`- ${p.linear_id} [${p.verdict}]: ${shownTitle(p)}`);
  const nodate = plans.filter((p) => p.justinNoDate);
  lines.push('');
  lines.push(`## Justin tickets with NO due date (${nodate.length}) — imported WITHOUT addressed_to, so invisible to Thea until dated or closed`);
  lines.push('   (a Justin ticket = R: justin, or R: lucas with I: justin)');
  for (const p of nodate) lines.push(`- ${p.linear_id}: ${p.title}`);
  const pointered = plans.filter((p) => p.pointered && p.verdict === 'import');
  lines.push('');
  lines.push(`## Bodies replaced by a pointer to Linear (${pointered.length}) — OWED: move the substance to a doc before Linear closes`);
  for (const p of pointered) lines.push(`- ${p.linear_id}: ${p.title}`);
  const held = plans.filter((p) => p.verdict === 'held');
  lines.push('');
  lines.push(`## Held for Nathan (${held.length}) — not imported; Linear ids only, titles withheld`);
  for (const p of held) lines.push(`- ${p.linear_id}`);
  return `${lines.join('\n')}\n`;
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
