// Tasks tab (task T-142): a live, READ-ONLY view of the team task list.
//
// Reads public.tasks in the "Evryn Team" Supabase project, the same project and
// the same credentials as the Team Runtime tab (/api/team):
//   TEAM_SUPABASE_URL, TEAM_SUPABASE_SERVICE_ROLE_KEY
// No new environment variable. Either unset -> { configured: false } (HTTP 200)
// and no client is created.
//
// READ-ONLY BY CONSTRUCTION, because the key is a service-role key that COULD write:
//   - GET only; any other method gets 405 before a client exists;
//   - one table (tasks), one fixed column list (COLUMNS below), read filters only;
//   - no insert / update / upsert / delete / rpc anywhere in this file.
// test/tasks.test.ts pins all of that against a recording fake client, and
// test/mutation-controls.mjs proves each of those tests goes red when it should.
//
// PRIVACY: the column list is deliberately narrow. Task bodies, links, RACI, tags,
// notes and sign-off fields never leave the server; the headline is the most this
// web-hosted page shows. The service-role key and the project URL are used only
// inside this handler and never appear in a response body, error or not.
//
// PAGING (evryn-team-runtime cardinal invariant 8): PostgREST returns a silent
// 1,000-row prefix on an unbounded read, so each read pages by keyset on short_id
// and stops ONLY on a zero-row page. A short page is not proof of the end unless
// you know the server's ceiling, and we do not rely on knowing it. The loop is
// bounded; if the bound is hit the response says truncated: true instead of
// silently returning a prefix.
//
// TESTABLE SEAM: the logic is handleTasks(request, { env, createClient }). The
// default export passes the real process.env and a factory that imports
// @supabase/supabase-js dynamically, so a test can import this module with no
// node_modules installed (Vercel bundles the dynamic import).

export const config = {
  runtime: 'edge',
};

export const COLUMNS =
  'short_id, title, status, owner, addressed_to, needed_by, updated_at, closed_at';

// The six statuses that are not closed (migration 005's eight, minus the two closed ones).
export const OPEN_STATUSES = ['backlog', 'proposed', 'open', 'in_progress', 'blocked', 'needs_acceptance'];
export const CLOSED_STATUSES = ['done', 'decided_against'];
export const CLOSED_WINDOW_DAYS = 30;

// Rows per page: under PostgREST's 1,000-row default ceiling, so a page is never
// silently clipped by the server. Correctness does not depend on this value.
export const PAGE_SIZE = 500;
// Hard bound on pages per read (25,000 rows at PAGE_SIZE 500). Hitting it sets truncated: true.
export const MAX_PAGES = 50;

type Env = Record<string, string | undefined>;
type ClientFactory = (url: string, key: string) => Promise<any>;

const NO_STORE = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...NO_STORE, ...extra } });
}

// The same gate as api/team.ts / product.ts / data.ts: HTTP Basic, user `evryn`,
// DASHBOARD_PASSWORD, fail closed when the password env var is unset (no hardcoded
// fallback). Two differences, both for this file only: the password arrives as a
// parameter (so tests can inject it), and a header that is not valid base64 gets a
// 401 instead of an uncaught throw.
function checkAuth(request: Request, validPassword: string | undefined): Response | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Evryn Dashboard"' },
    });
  }

  let decoded = '';
  try {
    decoded = atob(authHeader.split(' ')[1] || '');
  } catch {
    decoded = '';
  }
  const [user, password] = decoded.split(':');

  if (!validPassword || user !== 'evryn' || password !== validPassword) {
    return new Response('Invalid credentials', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Evryn Dashboard"' },
    });
  }

  return null; // Auth passed
}

// Thrown on a database error. Carries nothing: the caller answers with a generic 500.
class TasksReadError extends Error {}

// Page one read to exhaustion by keyset on short_id. `filter` applies the read's
// own WHERE clauses to a fresh select on tasks.
async function readAll(
  client: any,
  filter: (q: any) => any,
): Promise<{ rows: any[]; truncated: boolean }> {
  const out: any[] = [];
  let last: number | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    let q = filter(client.from('tasks').select(COLUMNS));
    if (last !== null) q = q.gt('short_id', last);
    const { data, error } = await q.order('short_id', { ascending: true }).limit(PAGE_SIZE);
    if (error) throw new TasksReadError();
    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) return { rows: out, truncated: false };
    out.push(...rows);
    last = rows[rows.length - 1].short_id;
  }
  return { rows: out, truncated: true };
}

export async function handleTasks(
  request: Request,
  deps: { env: Env; createClient: ClientFactory },
): Promise<Response> {
  const env = deps.env || {};

  // 1. The access gate, before anything else.
  const denied = checkAuth(request, env.DASHBOARD_PASSWORD);
  if (denied) return denied;

  // 2. GET only. Nothing here writes, so nothing else is accepted.
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405, { Allow: 'GET' });
  }

  // 3. Graceful when unconfigured: 200 { configured: false }, no client.
  const url = env.TEAM_SUPABASE_URL;
  const key = env.TEAM_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return json({ configured: false });
  }

  try {
    const client = await deps.createClient(url, key);
    const cutoff = new Date(Date.now() - CLOSED_WINDOW_DAYS * 86400000).toISOString();

    const [open, closed] = await Promise.all([
      readAll(client, (q) => q.in('status', OPEN_STATUSES)),
      readAll(client, (q) => q.in('status', CLOSED_STATUSES).gte('closed_at', cutoff)),
    ]);

    return json({
      configured: true,
      fetched_at: new Date().toISOString(),
      open: open.rows,
      closed: closed.rows,
      truncated: open.truncated || closed.truncated,
    });
  } catch {
    // Generic on purpose: a client error object can carry the project URL.
    console.error('Tasks API: read failed');
    return json({ error: 'Failed to load tasks' }, 500);
  }
}

export default async function handler(request: Request): Promise<Response> {
  return handleTasks(request, {
    env: process.env as Env,
    createClient: async (url: string, key: string) => {
      const { createClient } = await import('@supabase/supabase-js');
      return createClient(url, key);
    },
  });
}
