/**
 * cli.mjs — the `tasks` command. `run(argv, deps)` is the whole program; tasks.mjs only calls it.
 *
 * Every dependency that touches the world is injectable (env, fetch, stdout, stderr, clock, page
 * size), so the unit tests drive the real code against a fake PostgREST and never read a real
 * .env (config.mjs's tripwire enforces that).
 *
 * The rules live in the DATABASE (migrations/), not here. The checks in this file are courtesies
 * that give a friendlier message first; every one of them is also enforced, more strictly, below.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import {
  ConfigError,
  ENV_FILES,
  VAR,
  isSafeActorName,
  loadVars,
  redact,
  teamRestTarget,
} from './config.mjs';
import { RestError, makeRest } from './rest.mjs';
import { describeScreen, screenRow } from './screen.mjs';

export const STATUSES = ['open', 'in_progress', 'blocked', 'done', 'decided_against', 'proposed'];
export const OPEN_STATUSES = ['open', 'in_progress', 'blocked', 'proposed'];
export const CLOSED_STATUSES = ['done', 'decided_against'];
export const PULL_OPEN_CAP = 20;
export const PULL_CLOSED_CAP = 10;
export const PULL_CLOSED_DAYS = 30;
export const SEARCH_MAX_CHARS = 200;
export const TITLE_MAX = 80;
export const BODY_MAX = 600;

const HEADLINE_COLS = 'short_id,status,title,owner,addressed_to,needed_by,closed_at';
/** Every column except the generated search vector. */
export const ROW_COLS = [
  'id', 'short_id', 'title', 'description', 'status', 'raci', 'owner', 'links', 'tags',
  'created_by', 'created_at', 'updated_at', 'closed_at', 'closing_note', 'needed_by', 'parent_id',
  'addressed_to', 'signed_at', 'signed_ref', 'linear_id', 'linear_status',
].join(',');
/** The export: every stored column a person wrote, minus the generated ones (owner, search). */
export const EXPORT_COLS = ROW_COLS.split(',').filter((c) => c !== 'owner').join(',');

export const HELP = `tasks — the founding team's task list, in the Evryn Team database.

  A task is one owed item, with one owner, that outlives the session it was born in.
                                                        — Soren (CTO), 2026-11-05

  If it will be finished inside this session, it is not a task. A task is a HEADLINE and
  a POINTER: the headline is at most 80 characters and must mean something on its own;
  the body is at most 600 characters; any real substance goes in a doc in a repo, and
  the task points at it with --link.

  Run it as:  node _evryn-meta/scripts/tasks/tasks.mjs <command> [options]

WHO YOU ARE
  --as <name>   (or set EVRYN_ACTOR=<name>). Your own lowercase name, e.g. --as lucas, --as ac.
                The DATABASE refuses any write that carries no name. A name outside the team
                roster (kept in one place: the database function public.task_roster()) is
                accepted but flagged in the task's history. Never write as someone else:
                with one shared key a false name cannot be caught, only a missing one.

AT THE START OF A SESSION
  pull --as <name>
      Your open tasks plus anything addressed to you (headlines only), then your own tasks
      closed as done or decided against in the last 30 days. Capped at ${PULL_OPEN_CAP} open and
      ${PULL_CLOSED_CAP} closed lines; past that it prints "+N more" and the command for the full list.
      One line a task:   T-12 [blocked] headline (needed 11/20)

BEFORE YOU PROPOSE OR ADD ANYTHING
  search "<words>"
      Keyword search over EVERYONE's headlines and bodies, open and closed. Run it first.
      A [decided_against] hit means it was already decided against — don't re-raise it
      without new information. Up to ${SEARCH_MAX_CHARS} characters. "quoted phrase", or, -word work.

READING
  mine --as <name>                 your open tasks and those addressed to you, no cap
  closed [--days N] [--by <name> | --all]
                                   done + decided against, closed in the last N days
                                   (default 30). Default owner: you (--as).
  show T-12                        the whole task and its complete change history

WRITING (all need --as)
  add --title "<headline>" [options]
  update T-12 [options]
  close T-12 --note "<what happened or why not, and where the record lives>" [--decided-against]
  sign T-12 --ref "<where Justin's words are>"

  Options for add and update:
    --title "<at most 80 chars>"       --body "<at most 600 chars>"
    --status open|in_progress|blocked|proposed    (add defaults to open)
    --owner <name>         (add defaults to you)    --accountable <name>  (add defaults to justin)
    --consulted a,b        --informed a,b
    --to <name>            whom a watcher should wake ('none' clears it)
    --needed-by YYYY-MM-DD ('none' clears it). REQUIRED whenever --to is justin.
    --parent T-n           ('none' clears it)
    --tags a,b             (replaces the tags)
    --link <doc path>      repeatable; on update it ADDS to the links

  Statuses: open · in_progress · blocked · proposed · done · decided_against.
    "proposed" means awaiting Justin's authorization.
    done and decided_against are set ONLY by close, which requires a note.
    A raw write that names no status is refused: the column's old default 'todo' is not allowed.
  Tasks are never deleted. If it won't happen, close it --decided-against with the reason.

  sign is a RECORD, NEVER A GATE. It records that Justin signed this item and where his words
  are. Anyone holding the key can set it, so nothing outbound or irreversible may ever
  depend on it.

EXPORT
  export [--out <path>]
      The whole table as JSON, ordered by T-number, LF line endings, to stdout or a file.
      Do NOT commit its output and do not add it to #lock: whether it is committed routinely
      is Justin's call and is still open. Refuses to write anything if any row fails the screen.

THE SCREEN (a warning-grade screen, NOT a guarantee)
  add, update, close, sign and export scan the title, body, closing note, signed ref, tags
  and links. Anything shaped like an EMAIL ADDRESS is REFUSED. Anything shaped like a PHONE
  NUMBER is WARNED about. That is all it catches: it cannot recognize privileged legal
  content, a trade secret or a user's personal story. Those never go in a task — put a
  pointer to the right doc instead.

CREDENTIALS (read by the script, never printed)
  ${VAR.url} and ${VAR.key}, from evryn-team-workspace/.env.
  The script refuses any URL that is not the Evryn Team project, before sending anything.

EXIT CODES   0 done · 1 refused or failed (the reason is printed) · 2 usage error
`;

export class UsageError extends Error {}
export class ScreenRefusal extends Error {}

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

function parseTaskRef(value) {
  const m = String(value ?? '').match(/^(?:T-)?(\d{1,18})$/i);
  if (!m) throw new UsageError(`"${value ?? ''}" is not a task id (expected T-<number>)`);
  return Number(m[1]);
}

function checkName(label, value) {
  if (!isSafeActorName(value)) throw new UsageError(`${label} must be a name of letters, digits, _ . - (1 to 64 characters)`);
  return value;
}

function nameList(label, value) {
  if (value === undefined) return undefined;
  const names = value.split(',').map((s) => s.trim()).filter(Boolean);
  for (const n of names) checkName(label, n);
  return names;
}

/** Tags are free text (screened like every free-text field), comma-separated. */
function tagList(value) {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function checkDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new UsageError(`--needed-by must be a date as YYYY-MM-DD (or 'none' to clear it)`);
  }
  return value;
}

function mmdd(dateLike) {
  const s = String(dateLike);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s.slice(5, 7)}/${s.slice(8, 10)}`;
  const d = new Date(s);
  return d.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: '2-digit', day: '2-digit' });
}

export function headline(row, me) {
  const closed = CLOSED_STATUSES.includes(row.status) && row.closed_at ? ` ${mmdd(row.closed_at)}` : '';
  let line = `T-${row.short_id} [${row.status}${closed}] ${row.title}`;
  if (row.needed_by) line += ` (needed ${mmdd(row.needed_by)})`;
  if (me && row.owner !== me && row.addressed_to === me) line += ` (to you; owner ${row.owner})`;
  else if (row.addressed_to && row.addressed_to !== row.owner) line += ` (to ${row.addressed_to})`;
  return line;
}

function sortOpen(rows) {
  return [...rows].sort((a, b) => {
    const da = a.needed_by ?? '9999-12-31';
    const db = b.needed_by ?? '9999-12-31';
    return da < db ? -1 : da > db ? 1 : a.short_id - b.short_id;
  });
}

function sortClosed(rows) {
  return [...rows].sort((a, b) => (a.closed_at < b.closed_at ? 1 : a.closed_at > b.closed_at ? -1 : b.short_id - a.short_id));
}

/** Deterministic JSON: keys sorted at every depth. */
export function canonicalJson(value, indent = 2) {
  const sortKeys = (v) => {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v && typeof v === 'object') {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
      return out;
    }
    return v;
  };
  return `${JSON.stringify(sortKeys(value), null, indent)}\n`;
}

function screenOrRefuse(label, fields, warn) {
  const result = screenRow(fields);
  for (const line of describeScreen(label, result)) warn(line);
  if (result.refused.length) {
    throw new ScreenRefusal(`${label}: nothing was written. Remove the personal data and try again; put a pointer to a doc instead.`);
  }
}

async function fetchTask(rest, n, cols = ROW_COLS) {
  const { data } = await rest.request('GET', `tasks?short_id=eq.${n}&select=${cols}`);
  if (!Array.isArray(data) || data.length === 0) throw new RestError(`T-${n} not found`);
  return data[0];
}

async function resolveParent(rest, value) {
  if (value === 'none') return null;
  const n = parseTaskRef(value);
  const row = await fetchTask(rest, n, 'id');
  return row.id;
}

async function patchTask(rest, n, patch) {
  const { data } = await rest.request('PATCH', `tasks?short_id=eq.${n}&select=${HEADLINE_COLS}`, {
    body: patch,
    prefer: 'return=representation',
  });
  if (!Array.isArray(data) || data.length === 0) throw new RestError(`T-${n} not found`);
  return data[0];
}

// ---------------------------------------------------------------------------
// option sets
// ---------------------------------------------------------------------------

const COMMON = {
  as: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
};

const FIELD_OPTIONS = {
  title: { type: 'string' },
  body: { type: 'string' },
  status: { type: 'string' },
  owner: { type: 'string' },
  accountable: { type: 'string' },
  consulted: { type: 'string' },
  informed: { type: 'string' },
  to: { type: 'string' },
  'needed-by': { type: 'string' },
  parent: { type: 'string' },
  tags: { type: 'string' },
  link: { type: 'string', multiple: true },
};

function courtesyLengths(values) {
  if (values.title !== undefined) {
    if (values.title.trim() === '') throw new UsageError('--title cannot be blank');
    if (values.title.length > TITLE_MAX) {
      throw new UsageError(`--title is ${values.title.length} characters; the headline limit is ${TITLE_MAX}. Shorten it — put detail in the body or a doc.`);
    }
  }
  if (values.body !== undefined && values.body.length > BODY_MAX) {
    throw new UsageError(`--body is ${values.body.length} characters; the limit is ${BODY_MAX}. Put the substance in a doc and --link it.`);
  }
  if (values.status !== undefined && !OPEN_STATUSES.includes(values.status)) {
    if (CLOSED_STATUSES.includes(values.status)) throw new UsageError(`use "close" to set ${values.status} (it requires a closing note)`);
    throw new UsageError(`--status must be one of: ${OPEN_STATUSES.join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
// commands
// ---------------------------------------------------------------------------

const COMMANDS = {
  async pull({ rest, actor, say, now, pageSize }) {
    const me = actor;
    const open = sortOpen(
      await rest.paginateAll(
        'tasks',
        `select=${HEADLINE_COLS}&status=in.(${OPEN_STATUSES.join(',')})&or=(owner.eq.${me},addressed_to.eq.${me})`,
        { pageSize },
      ),
    );
    const since = new Date(now().getTime() - PULL_CLOSED_DAYS * 86400000).toISOString();
    const closed = sortClosed(
      await rest.paginateAll(
        'tasks',
        `select=${HEADLINE_COLS}&status=in.(${CLOSED_STATUSES.join(',')})&owner=eq.${me}&closed_at=gte.${encodeURIComponent(since)}`,
        { pageSize },
      ),
    );
    say(`Open — yours or addressed to you (${open.length}):`);
    if (open.length === 0) say('  (none)');
    for (const r of open.slice(0, PULL_OPEN_CAP)) say(`  ${headline(r, me)}`);
    if (open.length > PULL_OPEN_CAP) {
      say(`  +${open.length - PULL_OPEN_CAP} more open — NOT SHOWN. Full list: tasks mine --as ${me}`);
    }
    say(`Closed by you in the last ${PULL_CLOSED_DAYS} days (${closed.length}):`);
    if (closed.length === 0) say('  (none)');
    for (const r of closed.slice(0, PULL_CLOSED_CAP)) say(`  ${headline(r, me)}`);
    if (closed.length > PULL_CLOSED_CAP) {
      say(`  +${closed.length - PULL_CLOSED_CAP} more closed — NOT SHOWN. Full list: tasks closed --as ${me}`);
    }
    say('Before proposing anything new: tasks search "<words>" (finds decided-against items too).');
    return 0;
  },

  async mine({ rest, actor, say, pageSize }) {
    const open = sortOpen(
      await rest.paginateAll(
        'tasks',
        `select=${HEADLINE_COLS}&status=in.(${OPEN_STATUSES.join(',')})&or=(owner.eq.${actor},addressed_to.eq.${actor})`,
        { pageSize },
      ),
    );
    say(`Open — yours or addressed to you (${open.length}):`);
    if (open.length === 0) say('  (none)');
    for (const r of open) say(`  ${headline(r, actor)}`);
    return 0;
  },

  async closed({ rest, actor, values, say, now, pageSize }) {
    const days = values.days === undefined ? PULL_CLOSED_DAYS : Number(values.days);
    if (!Number.isInteger(days) || days < 1 || days > 3650) throw new UsageError('--days must be a whole number from 1 to 3650');
    if (values.all && values.by) throw new UsageError('use --by <name> or --all, not both');
    let who = null;
    if (!values.all) {
      who = values.by ?? actor;
      if (!who) throw new UsageError('closed needs --by <name>, --all, or --as <name>');
      checkName('--by', who);
    }
    const since = new Date(now().getTime() - days * 86400000).toISOString();
    const filter = [`select=${HEADLINE_COLS}`, `status=in.(${CLOSED_STATUSES.join(',')})`, `closed_at=gte.${encodeURIComponent(since)}`];
    if (who) filter.push(`owner=eq.${who}`);
    const rows = sortClosed(await rest.paginateAll('tasks', filter.join('&'), { pageSize }));
    say(`Closed in the last ${days} days${who ? `, owner ${who}` : ', everyone'} (${rows.length}):`);
    if (rows.length === 0) say('  (none)');
    for (const r of rows) say(`  ${headline(r, null)}${who ? '' : ` — ${r.owner}`}`);
    return 0;
  },

  async show({ rest, positionals, say, pageSize }) {
    if (positionals.length !== 1) throw new UsageError('show takes one task id: show T-12');
    const n = parseTaskRef(positionals[0]);
    const t = await fetchTask(rest, n);
    let parent = '-';
    if (t.parent_id) {
      const { data } = await rest.request('GET', `tasks?id=eq.${t.parent_id}&select=short_id`);
      parent = Array.isArray(data) && data[0] ? `T-${data[0].short_id}` : t.parent_id;
    }
    const raci = t.raci ?? {};
    const list = (v) => (Array.isArray(v) && v.length ? v.join(', ') : '-');
    say(headline(t, null));
    say(`  owner: ${t.owner ?? '-'} · accountable: ${raci.a ?? '-'} · consulted: ${list(raci.c)} · informed: ${list(raci.i)}`);
    say(`  addressed to: ${t.addressed_to ?? '-'} · needed by: ${t.needed_by ?? '-'} · parent: ${parent}`);
    say(`  created: ${t.created_at} by ${t.created_by ?? '(before the task system)'} · updated: ${t.updated_at}`);
    if (t.closed_at || t.closing_note) say(`  closed: ${t.closed_at ?? '-'} · note: ${t.closing_note ?? '-'}`);
    if (t.signed_at) say(`  signed: ${t.signed_at} · where: ${t.signed_ref}  (a record, not a gate)`);
    say(`  tags: ${list(t.tags)} · links: ${list(t.links)}`);
    if (t.linear_id) say(`  linear: ${t.linear_id} (status in Linear: "${t.linear_status ?? ''}")`);
    say('  body:');
    for (const line of String(t.description || '(empty)').split('\n')) say(`    ${line}`);
    const history = await rest.paginateAll('task_history', `task_id=eq.${t.id}&select=id,at,actor,op,changed_fields,old,new,flags`, {
      cursorCol: 'id',
      pageSize,
    });
    say(`History (${history.length}):`);
    for (const h of history) {
      const flags = h.flags && h.flags.length ? `  ⚑ ${h.flags.join(', ')}` : '';
      if (h.op === 'insert') {
        say(`  #${h.id} ${h.at} ${h.actor} created${flags}`);
      } else {
        const parts = (h.changed_fields ?? []).map(
          (f) => `${f}: ${JSON.stringify(h.old ? h.old[f] : null)} → ${JSON.stringify(h.new ? h.new[f] : null)}`,
        );
        say(`  #${h.id} ${h.at} ${h.actor} ${parts.join(' · ')}${flags}`);
      }
    }
    return 0;
  },

  async search({ rest, positionals, say, pageSize }) {
    const terms = positionals.join(' ').trim();
    if (!terms) throw new UsageError('search needs some words: search "linear import"');
    if (terms.length > SEARCH_MAX_CHARS) throw new UsageError(`search terms are limited to ${SEARCH_MAX_CHARS} characters`);
    const rows = await rest.paginateAll(
      'tasks',
      `select=${HEADLINE_COLS}&search=wfts(english).${encodeURIComponent(terms)}`,
      { pageSize },
    );
    say(`Search "${terms}" — ${rows.length} match${rows.length === 1 ? '' : 'es'} (everyone's tasks, open and closed):`);
    if (rows.length === 0) say('  (none)');
    for (const r of rows) {
      const mark = r.status === 'decided_against' ? '  ← DECIDED AGAINST: do not re-raise without new information' : '';
      say(`  ${headline(r, null)} — ${r.owner}${mark}`);
    }
    return 0;
  },

  async add({ rest, actor, values, warn, say }) {
    if (values.title === undefined) throw new UsageError('add needs --title "<headline>"');
    courtesyLengths(values);
    const owner = values.owner ?? actor;
    checkName('--owner', owner);
    const accountable = values.accountable ?? 'justin';
    checkName('--accountable', accountable);
    const raci = { r: owner, a: accountable };
    const c = nameList('--consulted', values.consulted);
    const i = nameList('--informed', values.informed);
    if (c && c.length) raci.c = c;
    if (i && i.length) raci.i = i;
    const row = {
      title: values.title,
      description: values.body ?? '',
      status: values.status ?? 'open',
      raci,
      links: values.link ?? [],
    };
    if (values.tags !== undefined) row.tags = tagList(values.tags);
    if (values.to !== undefined && values.to !== 'none') row.addressed_to = checkName('--to', values.to);
    if (values['needed-by'] !== undefined && values['needed-by'] !== 'none') row.needed_by = checkDate(values['needed-by']);
    if (String(row.addressed_to ?? '').toLowerCase() === 'justin' && !row.needed_by) {
      throw new UsageError('a task addressed to justin needs --needed-by YYYY-MM-DD');
    }
    screenOrRefuse('add', row, warn);
    if (values.parent !== undefined && values.parent !== 'none') row.parent_id = await resolveParent(rest, values.parent);
    const { data } = await rest.request('POST', `tasks?select=${HEADLINE_COLS}`, { body: row, prefer: 'return=representation' });
    const created = Array.isArray(data) ? data[0] : data;
    say(`created ${headline(created, actor)}`);
    return 0;
  },

  async update({ rest, actor, values, positionals, warn, say }) {
    if (positionals.length !== 1) throw new UsageError('update takes one task id: update T-12 [options]');
    const n = parseTaskRef(positionals[0]);
    courtesyLengths(values);
    const patch = {};
    if (values.title !== undefined) patch.title = values.title;
    if (values.body !== undefined) patch.description = values.body;
    if (values.status !== undefined) patch.status = values.status;
    if (values.tags !== undefined) patch.tags = tagList(values.tags);
    if (values.to !== undefined) patch.addressed_to = values.to === 'none' ? null : checkName('--to', values.to);
    if (values['needed-by'] !== undefined) patch.needed_by = values['needed-by'] === 'none' ? null : checkDate(values['needed-by']);

    const touchesRaci = ['owner', 'accountable', 'consulted', 'informed'].some((k) => values[k] !== undefined);
    const needsCurrent = touchesRaci || values.link !== undefined || values.to !== undefined || values['needed-by'] !== undefined;
    const current = needsCurrent ? await fetchTask(rest, n, 'raci,links,addressed_to,needed_by') : null;
    if (touchesRaci) {
      const raci = { ...(current.raci ?? {}) };
      if (values.owner !== undefined) raci.r = checkName('--owner', values.owner);
      if (values.accountable !== undefined) raci.a = checkName('--accountable', values.accountable);
      if (values.consulted !== undefined) raci.c = nameList('--consulted', values.consulted);
      if (values.informed !== undefined) raci.i = nameList('--informed', values.informed);
      patch.raci = raci;
    }
    if (values.link !== undefined) {
      const links = Array.isArray(current.links) ? [...current.links] : [];
      for (const l of values.link) if (!links.includes(l)) links.push(l);
      patch.links = links;
    }
    if (current) {
      const to = 'addressed_to' in patch ? patch.addressed_to : current.addressed_to;
      const due = 'needed_by' in patch ? patch.needed_by : current.needed_by;
      if (String(to ?? '').toLowerCase() === 'justin' && !due) {
        throw new UsageError('a task addressed to justin needs a needed-by date: add --needed-by YYYY-MM-DD');
      }
    }
    if (values.parent !== undefined) patch.parent_id = await resolveParent(rest, values.parent);
    if (Object.keys(patch).length === 0) throw new UsageError('update needs at least one option to change (see --help)');
    screenOrRefuse(`update T-${n}`, patch, warn);
    const row = await patchTask(rest, n, patch);
    say(`updated ${headline(row, actor)}  (${Object.keys(patch).join(', ')})`);
    return 0;
  },

  async close({ rest, actor, values, positionals, warn, say, now }) {
    if (positionals.length !== 1) throw new UsageError('close takes one task id: close T-12 --note "..."');
    const n = parseTaskRef(positionals[0]);
    if (values.note === undefined || values.note.trim() === '') {
      throw new UsageError('close needs --note "<what happened or why not, and where the record lives>"');
    }
    const patch = {
      status: values['decided-against'] ? 'decided_against' : 'done',
      closing_note: values.note,
      closed_at: now().toISOString(),
    };
    screenOrRefuse(`close T-${n}`, patch, warn);
    const row = await patchTask(rest, n, patch);
    say(`closed ${headline(row, actor)}`);
    return 0;
  },

  async sign({ rest, actor, values, positionals, warn, say, now }) {
    if (positionals.length !== 1) throw new UsageError('sign takes one task id: sign T-12 --ref "<where>"');
    const n = parseTaskRef(positionals[0]);
    if (values.ref === undefined || values.ref.trim() === '') throw new UsageError(`sign needs --ref "<where Justin's words are>"`);
    const patch = { signed_at: now().toISOString(), signed_ref: values.ref };
    screenOrRefuse(`sign T-${n}`, patch, warn);
    const row = await patchTask(rest, n, patch);
    say(`signed ${headline(row, actor)} — a record of Justin's signature, never a gate`);
    return 0;
  },

  async export({ rest, values, warn, out, pageSize, writeFile }) {
    const rows = await rest.paginateAll('tasks', `select=${EXPORT_COLS}`, { pageSize });
    let refusedRows = 0;
    for (const r of rows) {
      const result = screenRow(r);
      for (const line of describeScreen(`T-${r.short_id}`, result)) warn(line);
      if (result.refused.length) refusedRows += 1;
    }
    if (refusedRows) {
      throw new ScreenRefusal(`export refused: ${refusedRows} row(s) fail the screen. Nothing was written. Fix those rows first.`);
    }
    const text = canonicalJson(rows);
    if (values.out) {
      writeFile(values.out, text);
      warn(`exported ${rows.length} task(s) to ${values.out}. Do not commit it: whether the export is committed is still Justin's call.`);
    } else {
      out(text);
      warn(`exported ${rows.length} task(s).`);
    }
    return 0;
  },
};

const COMMAND_SPECS = {
  pull: { needsActor: true, options: {} },
  mine: { needsActor: true, options: {} },
  closed: { needsActor: false, options: { days: { type: 'string' }, by: { type: 'string' }, all: { type: 'boolean' } } },
  show: { needsActor: false, options: {} },
  search: { needsActor: false, options: {} },
  add: { needsActor: true, write: true, options: FIELD_OPTIONS },
  update: { needsActor: true, write: true, options: FIELD_OPTIONS },
  close: { needsActor: true, write: true, options: { note: { type: 'string' }, 'decided-against': { type: 'boolean' } } },
  sign: { needsActor: true, write: true, options: { ref: { type: 'string' } } },
  export: { needsActor: false, options: { out: { type: 'string' } } },
};

/**
 * Run the CLI. Returns the exit code; never calls process.exit itself.
 * deps: { env, fetch, stdout, stderr, now, pageSize, writeFile }
 */
export async function run(argv, deps = {}) {
  const rawOut = deps.stdout ?? ((s) => process.stdout.write(s));
  const rawErr = deps.stderr ?? ((s) => process.stderr.write(s));
  let secrets = [];
  const out = (s) => rawOut(redact(s, secrets));
  const say = (s = '') => out(`${s}\n`);
  const warn = (s) => rawErr(`${redact(s, secrets)}\n`);

  try {
    const [command, ...args] = argv;
    if (!command || command === 'help' || command === '--help' || command === '-h') {
      say(HELP);
      return 0;
    }
    const spec = COMMAND_SPECS[command];
    if (!spec) throw new UsageError(`unknown command "${command}"`);
    let parsed;
    try {
      parsed = parseArgs({ args, options: { ...COMMON, ...spec.options }, allowPositionals: true, strict: true });
    } catch (e) {
      throw new UsageError(e instanceof Error ? e.message : 'could not parse the options');
    }
    const { values, positionals } = parsed;
    if (values.help) {
      say(HELP);
      return 0;
    }
    if (['pull', 'mine', 'add', 'update', 'close', 'sign', 'export'].includes(command) && positionals.length && !['update', 'close', 'sign'].includes(command)) {
      throw new UsageError(`${command} takes no positional arguments`);
    }

    const envSource = deps.env ?? process.env;
    const actor = values.as ?? envSource.EVRYN_ACTOR;
    if (actor !== undefined && !isSafeActorName(actor)) {
      throw new UsageError('--as must be a name of letters, digits, _ . - (1 to 64 characters)');
    }
    if (spec.needsActor && !actor) {
      throw new UsageError(
        `${command} needs to know who you are: --as <name> or EVRYN_ACTOR. ` +
          '(The database refuses a write without a name; this check only says so first.)',
      );
    }

    const vars = loadVars([VAR.url, VAR.key], { env: deps.env, file: ENV_FILES.team });
    const target = teamRestTarget(vars); // R5: throws before any request exists
    secrets = [target.key];
    const rest = makeRest({ target, actor, fetchImpl: deps.fetch ?? globalThis.fetch });

    return await COMMANDS[command]({
      rest,
      actor,
      values,
      positionals,
      say,
      warn,
      out,
      now: deps.now ?? (() => new Date()),
      pageSize: deps.pageSize,
      writeFile: deps.writeFile ?? ((p, text) => writeFileSync(p, text, 'utf8')),
    });
  } catch (e) {
    if (e instanceof UsageError) {
      warn(`usage error: ${e.message}\nRun with --help for the manual.`);
      return 2;
    }
    if (e instanceof RestError) {
      warn(`FAILED: ${e.message}`);
      if (e.code) warn(`  code: ${e.code}`);
      if (e.hint) warn(`  hint: ${e.hint}`);
      if (e.details) warn(`  details: ${e.details}`);
      return 1;
    }
    if (e instanceof ConfigError || e instanceof ScreenRefusal) {
      warn(`REFUSED: ${e.message}`);
      return 1;
    }
    warn(`FAILED: ${e instanceof Error ? e.message : 'unknown error'}`);
    return 1;
  }
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
