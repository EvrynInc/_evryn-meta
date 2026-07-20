import { createClient } from '@supabase/supabase-js';

// Product (Evryn) Supabase — a DIFFERENT project from the Agents DB that
// /api/data reads. New env vars so the two never get crossed:
//   PRODUCT_SUPABASE_URL, PRODUCT_SUPABASE_SERVICE_ROLE_KEY
// Justin sets these in Vercel separately; until then this endpoint returns
// { configured: false } (HTTP 200) and the frontend shows a clean
// "not yet connected" state — it must NEVER throw / 500 on missing config.
//
// PII posture (HARD CONSTRAINT — the dashboard is web-hosted): only
// aggregates, statuses, costs, and timestamps reach the response. NEVER raw
// user data. Every .select() below is column-allowlisted; no users-table query
// at all. The service_role key is read from env and used only inside this
// handler — it never appears in any response body. Same posture as data.ts.

export const config = {
  runtime: 'edge',
};

// Mirrors api/data.ts Basic-auth (same DASHBOARD_PASSWORD env, same `evryn`
// user). Fail-closed: no hardcoded fallback — denies if the env var is unset.
function checkAuth(request: Request): Response | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Evryn Dashboard"' },
    });
  }

  const encoded = authHeader.split(' ')[1];
  const decoded = atob(encoded);
  const [user, password] = decoded.split(':');

  // Fail closed: if DASHBOARD_PASSWORD isn't set, deny all — never fall back to
  // a hardcoded default (a default in source = a publicly-readable password).
  const validPassword = process.env.DASHBOARD_PASSWORD;

  if (!validPassword || user !== 'evryn' || password !== validPassword) {
    return new Response('Invalid credentials', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Evryn Dashboard"' },
    });
  }

  return null; // Auth passed
}

// Max ISO timestamp across an array of rows on a given column, or null.
function maxTimestamp(
  rows: Array<Record<string, unknown>> | null,
  col: string,
): string | null {
  if (!rows || rows.length === 0) return null;
  let max: string | null = null;
  for (const r of rows) {
    const v = r[col];
    if (typeof v === 'string' && (max === null || v > max)) max = v;
  }
  return max;
}

// The /health `checks` block (Step 78 Half A — evryn-backend src/safety/health.ts).
// Every field is a boolean, a timestamp, or a detector-name `reason` string
// (e.g. "loop-signature") — NO PII, so it's safe to pass through to the
// web-hosted dashboard under the aggregates-only posture above.
interface HealthChecks {
  db: { ok: boolean };
  slack_socket: { ok: boolean };
  poll: { ok: boolean; last_success_at: string | null; age_seconds: number | null };
  m1: { breaker_tripped: boolean; reason: string | null };
}

interface HealthResult {
  /** 'ok' | 'wedged' | 'halted' — an unrecognized value degrades to 'unknown'. */
  status: string;
  uptimeSeconds: number;
  /** null against the OLD (pre-Half-A-deploy) /health, which has no `checks`. */
  checks: HealthChecks | null;
}

// Validate + narrow the untrusted `checks` object off the /health body. Returns
// null — the graceful-degrade signal the frontend renders as idle lights — when
// the key is absent (the OLD always-200 /health shape, which is what's live in
// prod until Half A deploys) or malformed. Each field is defensively coerced:
// a partial/garbled body degrades to a conservative value, never throws.
function parseHealthChecks(raw: unknown): HealthChecks | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, any>;
  // All four subsystems must be present, else treat the body as the old shape.
  if (!c.db || !c.slack_socket || !c.poll || !c.m1) return null;
  return {
    db: { ok: !!c.db.ok },
    slack_socket: { ok: !!c.slack_socket.ok },
    poll: {
      ok: !!c.poll.ok,
      last_success_at:
        typeof c.poll.last_success_at === 'string' ? c.poll.last_success_at : null,
      age_seconds: typeof c.poll.age_seconds === 'number' ? c.poll.age_seconds : null,
    },
    m1: {
      breaker_tripped: !!c.m1.breaker_tripped,
      reason: typeof c.m1.reason === 'string' ? c.m1.reason : null,
    },
  };
}

// Optional server-side /health fetch with a short timeout. Parses the Step 78
// tri-state /health (ok / wedged / halted) + its per-subsystem `checks`.
//
// READS THE BODY EVEN ON A NON-200 (the change from the old `if (!res.ok) return
// null`): the new /health returns **503 for `wedged`**, and that 503's body
// carries exactly the status + checks we want to show. Bailing on !res.ok would
// blank the lights in the one state they exist to surface.
//
// Returns null ONLY on a genuine failure: unset env, unreachable backend, abort/
// timeout, or a non-JSON body. Never throws — the handler must not 500 on an
// unreachable backend.
async function fetchHealth(): Promise<HealthResult | null> {
  const healthUrl = process.env.RAILWAY_HEALTH_URL;
  if (!healthUrl) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    let res: Response;
    try {
      res = await fetch(healthUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    const body = (await res.json()) as {
      status?: unknown;
      uptime?: unknown;
      checks?: unknown;
    };
    return {
      status: typeof body.status === 'string' ? body.status : 'unknown',
      uptimeSeconds: typeof body.uptime === 'number' ? body.uptime : 0,
      checks: parseHealthChecks(body.checks),
    };
  } catch {
    return null;
  }
}

export default async function handler(request: Request) {
  // Check authentication (identical gate to data.ts)
  const authResponse = checkAuth(request);
  if (authResponse) return authResponse;

  // Graceful-when-unconfigured: return 200 { configured: false }, never throw.
  const productUrl = process.env.PRODUCT_SUPABASE_URL;
  const productKey = process.env.PRODUCT_SUPABASE_SERVICE_ROLE_KEY;
  if (!productUrl || !productKey) {
    return new Response(JSON.stringify({ configured: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Separate client for the PRODUCT db — never reuse SUPABASE_URL/KEY.
    const supabase = createClient(productUrl, productKey);

    // "Today" in Pacific time (same derivation as data.ts).
    const now = new Date();
    const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const today = pacific.toISOString().split('T')[0]; // YYYY-MM-DD (PT)

    // Lower bounds for timestamp filters. created_at is stored UTC; we use the
    // PT calendar-day start as a rough lower bound (per the brief — DST is not
    // worth overengineering here).
    const todayStart = `${today}T00:00:00-07:00`;
    const monthStart = `${today.substring(0, 7)}-01T00:00:00-07:00`;
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // ---- Liveness: last activity across llm_usage + messages ----
    // Only created_at leaves the messages table (see PII rule). One row each.
    const [{ data: lastLlmRows }, { data: lastMsgRows }] = await Promise.all([
      supabase
        .from('llm_usage')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('messages')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const lastLlmUsageAt = maxTimestamp(lastLlmRows, 'created_at');
    const lastMsgAt = maxTimestamp(lastMsgRows, 'created_at');
    const lastActivityAt =
      [lastLlmUsageAt, lastMsgAt].filter((t): t is string => !!t).sort().pop() ?? null;

    // Recent errors: items in error/escalated with activity in the last 24h.
    const { count: recentErrors } = await supabase
      .from('emailmgr_items')
      .select('id', { count: 'exact', head: true })
      .in('status', ['error', 'escalated'])
      .gte('updated_at', last24h);

    // The actual error/escalated ROWS behind that count — the dashboard's drill-down
    // panel (Step 78 Half B, Change 2). SAME column allowlist + truncation as the
    // recentItems select below: created_at / status / subject ONLY, subject sliced
    // to 60 — NO content_raw / original_from / metadata / user_id (PII firewall,
    // HARD CONSTRAINT). Same 24h/status filter as the count; newest error activity
    // first (order by updated_at desc — not returned, not PII); capped at 10.
    const { data: recentErrorRows } = await supabase
      .from('emailmgr_items')
      .select('created_at, status, subject')
      .in('status', ['error', 'escalated'])
      .gte('updated_at', last24h)
      .order('updated_at', { ascending: false })
      .limit(10);

    const recentErrorItems = (recentErrorRows || []).map((r) => ({
      created_at: r.created_at,
      status: r.status,
      subject: r.subject ? String(r.subject).slice(0, 60) : null,
    }));

    const health = await fetchHealth();

    // BACKWARD-COMPAT: the frontend's liveness banner reads liveness.processUp
    // { ok, uptimeSeconds }. Derive `ok` from status === 'ok' — the OLD /health
    // reports status:"ok" unconditionally, so this stays true against the shape
    // that's live in prod today, and the banner is unchanged. Under the new
    // /health, `wedged`/`halted` yield ok:false, which is exactly what the old
    // code did (it returned null for any non-"ok" status) — the banner falls
    // through to its 26h last-activity check either way.
    const processUp = health
      ? { ok: health.status === 'ok', uptimeSeconds: health.uptimeSeconds }
      : null;

    // ---- Today's activity (counts only) ----
    // Each is a head-count (count: 'exact', head: true) so no rows are
    // returned — only the count. All today-scoped except pendingApproval,
    // which is ALL open (per spec). Inlined rather than abstracted: the
    // Supabase query-builder's chained return types don't compose cleanly
    // behind a single typed helper.
    const [
      { count: itemsProcessed },
      { count: passed },
      { count: goldEdgeSurfaced },
      { count: delivered },
      { count: pendingApproval },
    ] = await Promise.all([
      supabase
        .from('emailmgr_items')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart),
      supabase
        .from('emailmgr_items')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .or('triage_result.eq.pass,status.eq.passed'),
      supabase
        .from('emailmgr_items')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .in('triage_result', ['gold', 'edge']),
      supabase
        .from('emailmgr_items')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .eq('status', 'delivered'),
      // Pending approval is ALL open (not just today).
      supabase
        .from('emailmgr_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_approval'),
    ]);

    // ---- Cost (from llm_usage; aggregate only) ----
    // total_cost_usd + activity + model + created_at only. No scope_user_id /
    // emailmgr_item_id leaves the server. `model` is a non-PII model-id string
    // (e.g. claude-opus-4-7 / claude-haiku-4-5) — safe to return; it powers the
    // by-model spend cut (Opus vs. Haiku) so the pre-screen's net saving is
    // legible. Still ONE round trip — model is added to the existing select.
    const [{ data: todayCostRows }, { data: monthCostRows }] = await Promise.all([
      supabase
        .from('llm_usage')
        .select('total_cost_usd, activity, model')
        .gte('created_at', todayStart),
      supabase
        .from('llm_usage')
        .select('total_cost_usd')
        .gte('created_at', monthStart),
    ]);

    const todayUsd = (todayCostRows || []).reduce(
      (sum, r) => sum + (r.total_cost_usd || 0),
      0,
    );
    const monthUsd = (monthCostRows || []).reduce(
      (sum, r) => sum + (r.total_cost_usd || 0),
      0,
    );
    const todayByActivity: Record<string, number> = {};
    (todayCostRows || []).forEach((r) => {
      const key = r.activity || 'unknown';
      todayByActivity[key] = (todayByActivity[key] || 0) + (r.total_cost_usd || 0);
    });
    // Aggregate by the RAW model string (keyed as-is, so a future dated model id
    // like claude-opus-4-7-YYYYMMDD sums under its own key rather than being
    // dropped) — same reduce shape as todayByActivity. The frontend derives the
    // friendly Opus/Haiku label via substring test.
    const todayByModel: Record<string, number> = {};
    (todayCostRows || []).forEach((r) => {
      const key = r.model || 'unknown';
      todayByModel[key] = (todayByModel[key] || 0) + (r.total_cost_usd || 0);
    });

    // ---- Recent items (STATUS-ONLY; subject truncated) ----
    // Allowlisted select — NO content_raw / original_from / metadata / user_id.
    const { data: recentRows } = await supabase
      .from('emailmgr_items')
      .select('created_at, status, triage_result, subject')
      .order('created_at', { ascending: false })
      .limit(10);

    const recentItems = (recentRows || []).map((r) => ({
      created_at: r.created_at,
      status: r.status,
      triage_result: r.triage_result,
      subject: r.subject ? String(r.subject).slice(0, 60) : null,
    }));

    return new Response(
      JSON.stringify({
        configured: true,
        today,
        liveness: {
          lastActivityAt,
          lastLlmUsageAt,
          recentErrors: recentErrors ?? 0,
          processUp,
          // Step 78 Half B: the tri-state status + per-subsystem checks for the
          // status lights. null when /health is unreachable; `checks` null when
          // /health answers in the OLD pre-Half-A shape → lights render idle.
          health: health ? { status: health.status, checks: health.checks } : null,
        },
        today_activity: {
          itemsProcessed: itemsProcessed ?? 0,
          passed: passed ?? 0,
          goldEdgeSurfaced: goldEdgeSurfaced ?? 0,
          delivered: delivered ?? 0,
          pendingApproval: pendingApproval ?? 0,
        },
        cost: {
          todayUsd,
          monthUsd,
          todayByActivity,
          todayByModel,
        },
        // STUB — daily-cluster heartbeat ships separately (a cost-levers
        // thrust). Frontend renders null as "—".
        cluster_heartbeat: null,
        recentItems,
        // Error/escalated rows for the drill-down panel (Change 2). Empty array (not
        // null) when there are none → the panel renders nothing.
        recentErrorItems,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Product dashboard API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch product data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
