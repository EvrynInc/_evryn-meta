import { createClient } from '@supabase/supabase-js';

// Team Runtime (founding-team autonomous runtime) Supabase — the "Evryn Team"
// project. A DIFFERENT project from BOTH the Agents DB (/api/data → SUPABASE_*)
// and the Product DB (/api/product → PRODUCT_SUPABASE_*). New env vars so none
// of the three ever get crossed:
//   TEAM_SUPABASE_URL, TEAM_SUPABASE_SERVICE_ROLE_KEY
// Justin sets these in Vercel separately; until then this endpoint returns
// { configured: false } (HTTP 200) and the frontend shows a clean
// "not yet connected" state — it must NEVER throw / 500 on missing config.
//
// This tab is the CONTROL PANEL for the runtime: it reads AND writes the SAME
// agent_state / agent_capabilities rows the runtime's PreToolUse gate checks
// (truth, not a copy — the ~5s gate-cache TTL means writes bite within seconds).
//
// PII posture (HARD CONSTRAINT — the dashboard is web-hosted): this DB carries
// internal team deliberation in `agent_messages`. This endpoint NEVER touches
// that table. Every .select() below is column-allowlisted; only states,
// capabilities, timestamps, thread COUNTS, and wake reasons reach the response.
// The service_role key is read from env and used only inside these handlers —
// it never appears in any response body. Same discipline as product.ts.
//
// Runtime semantics MIRRORED from evryn-team-runtime/src/safety/kill.ts (do not
// invent — this must match the process exactly, since both write the same rows):
//   - graceful pause : active=false                              (blocks NEW wakes; in-flight finish)
//   - hard pause     : active=false, hard_paused=true            (also parks in-flight at next tool call)
//   - kill           : active=false, hard_paused=true, killed_reason set
//   - resume         : active=true, hard_paused=false, killed_reason=null
// Reserved agent_state rows: __runtime__ (process singleton lock + heartbeat),
// __global__ (the global RUNTIME_ACTIVE kill switch — 'all' targets this row).

export const config = {
  runtime: 'edge',
};

// Reserved agent_state / agent_capabilities row names (never a "real" agent).
const RESERVED = new Set(['__runtime__', '__global__']);
const GLOBAL_ROW = '__global__';
const RUNTIME_ROW = '__runtime__';

// Runtime alive: the scheduler refreshes __runtime__.heartbeat_at every ~15s
// cycle even while paused, so a heartbeat older than this = the process is down.
const ALIVE_FRESH_MS = 60 * 1000;

// Mirrors api/product.ts / data.ts Basic-auth (same DASHBOARD_PASSWORD env, same
// `evryn` user). Fail-closed: no hardcoded fallback — denies if the env var is unset.
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

// ---- Reason storage (AC-decided, flagged in the build report) --------------
// The runtime has no dedicated state_reason column yet (a flagged rider for the
// next runtime migration). Until then we store BOTH pause and kill reasons in
// the killed_reason column, PREFIXED so the source is unambiguous:
//   "PAUSE: <text>"  vs  "KILL: <text>"
// When no human reason is given, we still record who/when/how (the auto-record):
//   "PAUSE (dashboard, <ISO>)"  /  "KILL (dashboard, <ISO>)"
// The runtime treats killed_reason as audit-only display text (verified: nothing
// reads it as a control signal — only .active / .hard_paused gate behavior), so
// storing a pause reason here changes no runtime behavior.
//
// NOTE / DIVERGENCE from kill.ts: the runtime's pauseAgent() deliberately does
// NOT set killed_reason (it comments "a pause is not a kill"). The dashboard
// intentionally DOES (per the brief), because the operator needs the reason to
// persist + display + be editable. Both write .active/.hard_paused identically,
// so the control semantics still match exactly; only the audit-text column
// diverges, and resume clears killed_reason either way.
function buildReasonText(
  kind: 'PAUSE' | 'KILL',
  reason: string | undefined,
  nowIso: string,
): string {
  const trimmed = typeof reason === 'string' ? reason.trim() : '';
  if (trimmed) return `${kind}: ${trimmed}`;
  return `${kind} (dashboard, ${nowIso})`;
}

type Supabase = ReturnType<typeof createClient>;

// Upsert an agent_state row, echoing back the allowlisted columns so the UI can
// render truth. Never selects singleton_lock into the response (it can carry a
// runtime lock or thread ids — states/timestamps only leave here).
async function upsertAgentState(
  supabase: Supabase,
  agent: string,
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('agent_state')
    .upsert({ agent, updated_at: nowIso, ...patch }, { onConflict: 'agent' })
    .select('agent, active, hard_paused, killed_reason, updated_at');
  if (error) throw error;
  return (data && data[0]) || { agent, ...patch, updated_at: nowIso };
}

// The distinct non-reserved agents that have capability rows (the dashboard's
// definition of "the mains"). Data-driven — the dashboard cannot import the
// runtime's ACTIVE_AGENTS constant, and this is the row set the operator acts on.
async function listAgents(supabase: Supabase): Promise<string[]> {
  const { data, error } = await supabase
    .from('agent_capabilities')
    .select('agent');
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data || []) {
    const a = (r as { agent?: string }).agent;
    if (typeof a === 'string' && !RESERVED.has(a)) set.add(a);
  }
  return [...set].sort();
}

// ============================================================================
// GET — read the full control-panel state.
// ============================================================================
async function handleGet(supabase: Supabase): Promise<Response> {
  // Enumerate the real agents first — everything else keys off this list.
  const agentNames = await listAgents(supabase);

  // All agent_state rows we care about: reserved rows + the real agents. One
  // round trip; singleton_lock included so we can derive heartbeat + thread
  // counts server-side (only the DERIVED numbers/booleans leave the server).
  const stateAgents = [GLOBAL_ROW, RUNTIME_ROW, ...agentNames];
  const { data: stateRows, error: stateErr } = await supabase
    .from('agent_state')
    .select('agent, active, hard_paused, killed_reason, singleton_lock, updated_at')
    .in('agent', stateAgents);
  if (stateErr) throw stateErr;

  const stateByAgent = new Map<string, Record<string, unknown>>();
  for (const r of stateRows || []) {
    stateByAgent.set((r as { agent: string }).agent, r as Record<string, unknown>);
  }

  // ---- Global state (the __global__ row) ----
  const globalRow = stateByAgent.get(GLOBAL_ROW);
  const global = {
    // No row = never deactivated = active (mirrors kill.ts isAgentActive).
    active: globalRow ? (globalRow.active as boolean) : true,
    hard_paused: globalRow ? Boolean(globalRow.hard_paused) : false,
    killed_reason: globalRow ? ((globalRow.killed_reason as string | null) ?? null) : null,
    updated_at: globalRow ? ((globalRow.updated_at as string | null) ?? null) : null,
  };

  // ---- Runtime alive (the __runtime__ singleton lock heartbeat) ----
  const runtimeRow = stateByAgent.get(RUNTIME_ROW);
  const lock = runtimeRow
    ? (runtimeRow.singleton_lock as { heartbeat_at?: string } | null)
    : null;
  const heartbeatAt = lock && typeof lock.heartbeat_at === 'string' ? lock.heartbeat_at : null;
  const aliveFresh = heartbeatAt
    ? Date.now() - new Date(heartbeatAt).getTime() < ALIVE_FRESH_MS
    : false;

  // ---- Capabilities: catalog (descriptions + essential) + grants ----
  const { data: catalogRows, error: catErr } = await supabase
    .from('capability_catalog')
    .select('capability, description, essential');
  if (catErr) throw catErr;

  const { data: grantRows, error: grantErr } = await supabase
    .from('agent_capabilities')
    .select('agent, capability, granted');
  if (grantErr) throw grantErr;

  // Grants indexed by agent -> capability -> granted.
  const grantsByAgent = new Map<string, Map<string, boolean>>();
  for (const r of grantRows || []) {
    const row = r as { agent: string; capability: string; granted: boolean };
    if (RESERVED.has(row.agent)) continue;
    if (!grantsByAgent.has(row.agent)) grantsByAgent.set(row.agent, new Map());
    grantsByAgent.get(row.agent)!.set(row.capability, Boolean(row.granted));
  }

  // The catalog IS the capability universe for the UI — LEFT JOIN each agent's
  // grant onto it, so a not-yet-granted capability still renders (as off) with
  // its description + essential star. Essentials first, then alpha.
  const catalog = (catalogRows || []).map((r: Record<string, unknown>) => {
    const row = r as { capability: string; description: string; essential: boolean };
    return { capability: row.capability, description: row.description, essential: Boolean(row.essential) };
  });
  const catalogSorted = [...catalog].sort((a, b) => {
    if (a.essential !== b.essential) return a.essential ? -1 : 1;
    return a.capability.localeCompare(b.capability);
  });

  // ---- Last wake per agent (newest wake_manifests row) ----
  // Column-allowlisted: agent, reason, created_at. No components/workspace_sha
  // needed here. Fetch newest-first and keep the first seen per agent.
  const lastWakeByAgent = new Map<string, { created_at: string; reason: string }>();
  if (agentNames.length > 0) {
    const { data: wakeRows, error: wakeErr } = await supabase
      .from('wake_manifests')
      .select('agent, reason, created_at')
      .in('agent', agentNames)
      .order('created_at', { ascending: false })
      .limit(200);
    if (wakeErr) throw wakeErr;
    for (const r of wakeRows || []) {
      const row = r as { agent: string; reason: string; created_at: string };
      if (!lastWakeByAgent.has(row.agent)) {
        lastWakeByAgent.set(row.agent, { created_at: row.created_at, reason: row.reason });
      }
    }
  }

  // ---- Per-agent assembly ----
  const agentsOut = agentNames.map((name) => {
    const st = stateByAgent.get(name);
    // In-flight thread count from singleton_lock.threads (agent rows only).
    let inFlight = 0;
    if (st) {
      const sl = st.singleton_lock as { threads?: Record<string, unknown> } | null;
      if (sl && sl.threads && typeof sl.threads === 'object') {
        inFlight = Object.keys(sl.threads).length;
      }
    }
    const agentGrants = grantsByAgent.get(name) || new Map<string, boolean>();
    const capabilities = catalogSorted.map((c) => ({
      capability: c.capability,
      description: c.description,
      essential: c.essential,
      granted: agentGrants.get(c.capability) === true, // fail closed: missing = not granted
    }));

    return {
      agent: name,
      active: st ? (st.active as boolean) : true,
      hard_paused: st ? Boolean(st.hard_paused) : false,
      killed_reason: st ? ((st.killed_reason as string | null) ?? null) : null,
      updated_at: st ? ((st.updated_at as string | null) ?? null) : null,
      in_flight: inFlight,
      last_wake: lastWakeByAgent.get(name) || null,
      capabilities,
    };
  });

  // ---- Tier presets (capability_tiers) ----
  const { data: tierRows, error: tierErr } = await supabase
    .from('capability_tiers')
    .select('tier, description, capabilities');
  if (tierErr) throw tierErr;
  const tiers = (tierRows || []).map((r: Record<string, unknown>) => {
    const row = r as { tier: string; description: string; capabilities: Record<string, boolean> };
    return { tier: row.tier, description: row.description, capabilities: row.capabilities || {} };
  });

  return new Response(
    JSON.stringify({
      configured: true,
      global,
      runtime: { heartbeat_at: heartbeatAt, aliveFresh },
      agents: agentsOut,
      catalog: catalogSorted,
      tiers,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}

// ============================================================================
// POST — apply a control action. Body: { action, ...}. Every write echoes the
// updated row(s) so the UI renders truth, not optimism.
// ============================================================================
async function handlePost(supabase: Supabase, request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Invalid JSON body');
  }

  const action = typeof body.action === 'string' ? body.action : '';
  const nowIso = new Date().toISOString();

  // Resolve a target to the actual agent_state row(s) to write. 'all' → __global__.
  // Returns null for an invalid target.
  const resolveOne = (target: unknown): string | null => {
    if (typeof target !== 'string' || !target) return null;
    if (target === 'all') return GLOBAL_ROW;
    if (RESERVED.has(target)) return null; // never let the UI address reserved rows by name
    return target;
  };

  switch (action) {
    case 'pause': {
      const agentRow = resolveOne(body.target);
      if (!agentRow) return badRequest('pause: invalid target');
      const hard = body.hard === true;
      // Graceful: active=false. Hard: active=false + hard_paused=true.
      // Reason stored in killed_reason, prefixed (see buildReasonText note).
      const patch: Record<string, unknown> = {
        active: false,
        hard_paused: hard,
        killed_reason: buildReasonText('PAUSE', body.reason as string | undefined, nowIso),
      };
      const updated = await upsertAgentState(supabase, agentRow, patch);
      return ok({ action, updated });
    }

    case 'resume': {
      const agentRow = resolveOne(body.target);
      if (!agentRow) return badRequest('resume: invalid target');
      // Mirrors reactivateAgent: active=true, hard_paused=false, killed_reason=null.
      const updated = await upsertAgentState(supabase, agentRow, {
        active: true,
        hard_paused: false,
        killed_reason: null,
      });
      return ok({ action, updated });
    }

    case 'kill': {
      // target: agent | 'all-mains' | 'all'
      const target = typeof body.target === 'string' ? body.target : '';
      const reasonText = buildReasonText('KILL', body.reason as string | undefined, nowIso);

      if (target === 'all-mains') {
        // Every non-reserved agent row — hard-killed. Best-effort: one failure
        // must not block the rest (mirrors killAllMains' Promise.allSettled).
        const agentNames = await listAgents(supabase);
        const results = await Promise.allSettled(
          agentNames.map((a) =>
            upsertAgentState(supabase, a, {
              active: false,
              hard_paused: true,
              killed_reason: reasonText,
            }),
          ),
        );
        const updated: Record<string, unknown>[] = [];
        const failed: string[] = [];
        results.forEach((res, i) => {
          if (res.status === 'fulfilled') updated.push(res.value);
          else failed.push(agentNames[i]);
        });
        return ok({ action, target, updated, failed });
      }

      // 'all' → __global__ ; otherwise a single agent.
      const agentRow = resolveOne(target);
      if (!agentRow) return badRequest('kill: invalid target');
      const updated = await upsertAgentState(supabase, agentRow, {
        active: false,
        hard_paused: true,
        killed_reason: reasonText,
      });
      return ok({ action, target, updated });
    }

    case 'set_capability': {
      const agent = typeof body.agent === 'string' ? body.agent : '';
      const capability = typeof body.capability === 'string' ? body.capability : '';
      if (!agent || RESERVED.has(agent)) return badRequest('set_capability: invalid agent');
      if (!capability) return badRequest('set_capability: capability required');
      if (typeof body.granted !== 'boolean') return badRequest('set_capability: granted must be boolean');
      const { data, error } = await supabase
        .from('agent_capabilities')
        .upsert(
          {
            agent,
            capability,
            granted: body.granted,
            granted_by: 'justin (dashboard)',
            granted_at: nowIso,
          },
          { onConflict: 'agent,capability' },
        )
        .select('agent, capability, granted, granted_by, granted_at');
      if (error) throw error;
      return ok({ action, updated: (data && data[0]) || null });
    }

    case 'apply_tier': {
      const agent = typeof body.agent === 'string' ? body.agent : '';
      const tier = typeof body.tier === 'string' ? body.tier : '';
      if (!agent || RESERVED.has(agent)) return badRequest('apply_tier: invalid agent');
      if (!tier) return badRequest('apply_tier: tier required');

      const { data: tierData, error: tierErr } = await supabase
        .from('capability_tiers')
        .select('tier, capabilities')
        .eq('tier', tier)
        .limit(1);
      if (tierErr) throw tierErr;
      const tierRow = tierData && tierData[0];
      if (!tierRow) return badRequest(`apply_tier: unknown tier '${tier}'`);

      const caps = ((tierRow as { capabilities?: Record<string, boolean> }).capabilities) || {};
      const rows = Object.entries(caps).map(([capability, granted]) => ({
        agent,
        capability,
        granted: Boolean(granted),
        granted_by: `tier:${tier}`,
        granted_at: nowIso,
      }));
      if (rows.length === 0) return ok({ action, agent, tier, updated: [] });

      const { data, error } = await supabase
        .from('agent_capabilities')
        .upsert(rows, { onConflict: 'agent,capability' })
        .select('agent, capability, granted, granted_by, granted_at');
      if (error) throw error;
      return ok({ action, agent, tier, updated: data || [] });
    }

    case 'set_reason': {
      // Update the reason text after the fact (reasons are optional + editable).
      // Preserves the PAUSE/KILL prefix by inspecting the current row's state:
      // an active-inactive row that is hard_paused with a killed_reason is a kill;
      // otherwise a pause. When the operator clears the text, fall back to the
      // auto-record so who/when/how is never lost.
      //
      // INVARIANT — this upsert patches killed_reason ONLY, never active /
      // hard_paused. On conflict, PostgREST updates only the provided columns,
      // which is exactly what keeps this write safe: it cannot touch the
      // pause/kill switches. Do NOT "helpfully" echo active/hard_paused from
      // the read below into this patch — that would write back a stale read
      // and could silently resurrect (or re-kill) an agent whose state changed
      // in the read→upsert window. The runtime relies on this same PostgREST
      // behavior for the same reason: see evryn-team-runtime/
      // src/scheduler/index.ts (buildThreadLockUpsert — "Deliberately WITHOUT
      // `active`").
      const agentRow = resolveOne(body.target);
      if (!agentRow) return badRequest('set_reason: invalid target');
      const { data: cur, error: curErr } = await supabase
        .from('agent_state')
        .select('agent, active, hard_paused, killed_reason')
        .eq('agent', agentRow)
        .limit(1);
      if (curErr) throw curErr;
      const row = cur && cur[0];
      // Infer whether this row is currently a kill vs a pause from its existing
      // reason prefix (falls back to PAUSE if unset/ambiguous — the softer label).
      const existing = row ? ((row as { killed_reason?: string | null }).killed_reason ?? '') : '';
      const kind: 'PAUSE' | 'KILL' = existing.startsWith('KILL') ? 'KILL' : 'PAUSE';
      const updated = await upsertAgentState(supabase, agentRow, {
        killed_reason: buildReasonText(kind, body.reason as string | undefined, nowIso),
      });
      return ok({ action, updated });
    }

    default:
      return badRequest(`Unknown action: ${action || '(none)'}`);
  }
}

function ok(payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ configured: true, ...payload }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(request: Request) {
  // Identical auth gate to product.ts / data.ts.
  const authResponse = checkAuth(request);
  if (authResponse) return authResponse;

  // Graceful-when-unconfigured: return 200 { configured: false }, never throw.
  const teamUrl = process.env.TEAM_SUPABASE_URL;
  const teamKey = process.env.TEAM_SUPABASE_SERVICE_ROLE_KEY;
  if (!teamUrl || !teamKey) {
    return new Response(JSON.stringify({ configured: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Separate client for the TEAM db — never reuse SUPABASE_URL/KEY or PRODUCT_*.
    const supabase = createClient(teamUrl, teamKey);

    if (request.method === 'POST') {
      return await handlePost(supabase, request);
    }
    // Default: GET (read the control-panel state).
    return await handleGet(supabase);
  } catch (error) {
    console.error('Team runtime dashboard API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process team runtime request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
