/**
 * helpers.mjs — imported FIRST by every test file. Its first act marks this process as a test run,
 * which arms config.mjs's tripwire: from here on, any attempt to read a .env file throws.
 * (`node --test` also sets NODE_TEST_CONTEXT, which arms it independently; this makes it hold even
 * when a test file is run directly with `node file.test.mjs`.)
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
process.env.EVRYN_TASKS_TEST_MODE = '1';

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TASKS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');

/** A team URL and a fake new-style secret key. The key is a sentinel we grep every output for. */
export const TEAM_URL = 'https://azugibmylktinddyqkhd.supabase.co';
// Built at runtime, so no key-shaped literal sits in the source (secret scanners flag one even when fake).
export const FAKE_KEY = ['sb', 'secret', 'FAKEFAKEFAKE', 'do', 'not', 'print', '9f3k2'].join('_');
export const TEST_ENV = Object.freeze({
  EVRYN_TEAM_SUPABASE_URL: TEAM_URL,
  EVRYN_TEAM_SUPABASE_SECRET_KEY: FAKE_KEY,
});

/** Build a legacy-style JWT (unsigned; only the claims are read). */
export function fakeJwt(claims) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(claims)}.c2lnbmF0dXJl`;
}

/** Collect output from run()'s injected stdout/stderr. */
export function capture() {
  const o = { out: '', err: '' };
  o.stdout = (s) => {
    o.out += s;
  };
  o.stderr = (s) => {
    o.err += s;
  };
  return o;
}

export function jsonResponse(status, body, headers = {}) {
  const text = body === undefined ? '' : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: async () => text,
  };
}

/**
 * A fake PostgREST over an in-memory `tasks` array. It understands exactly the query shapes the
 * CLI builds, and — like the real server — enforces a silent row CAP regardless of `limit`.
 * Every call is recorded in `calls`.
 */
export function fakePostgrest({ rows = [], history = [], cap = 1000, onWrite } = {}) {
  const calls = [];
  const parseFilters = (qs) => {
    const params = new URLSearchParams(qs);
    return params;
  };
  const applyFilters = (data, params) => {
    let out = [...data];
    for (const [k, v] of params) {
      if (['select', 'order', 'limit', 'or'].includes(k)) continue;
      const m = v.match(/^(eq|gt|gte|in|wfts\(english\))\.(.*)$/);
      if (!m) continue;
      const [, op, val] = m;
      if (op === 'eq') out = out.filter((r) => String(r[k]) === val);
      if (op === 'gt') out = out.filter((r) => r[k] > Number(val));
      if (op === 'gte') out = out.filter((r) => String(r[k]) >= val);
      if (op === 'in') {
        const set = val.replace(/^\(|\)$/g, '').split(',');
        out = out.filter((r) => set.includes(String(r[k])));
      }
      if (op === 'wfts(english)') {
        const words = val.toLowerCase().split(/\s+/);
        out = out.filter((r) => words.every((w) => `${r.title} ${r.description ?? ''}`.toLowerCase().includes(w)));
      }
    }
    const or = params.get('or');
    if (or) {
      const clauses = or.replace(/^\(|\)$/g, '').split(',').map((c) => c.split('.eq.'));
      out = out.filter((r) => clauses.some(([col, val]) => String(r[col]) === val));
    }
    const order = params.get('order');
    if (order) {
      const col = order.split('.')[0];
      out.sort((a, b) => a[col] - b[col]);
    }
    const limit = params.get('limit');
    out = out.slice(0, Math.min(limit ? Number(limit) : Infinity, cap));
    return out;
  };

  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const u = new URL(url);
    const table = u.pathname.replace('/rest/v1/', '');
    const params = parseFilters(u.search);
    const source = table === 'task_history' ? history : rows;
    if (init.method === 'GET') {
      const data = applyFilters(source, params);
      const headers = {};
      if ((init.headers.Prefer ?? '').includes('count=exact')) headers['content-range'] = `0-${data.length - 1}/${source.length}`;
      return jsonResponse(200, data, headers);
    }
    if (onWrite) return onWrite({ url, init, table, params, rows });
    return jsonResponse(201, [{ short_id: 99, status: 'open', title: 'x', owner: 'lucas' }]);
  };
  return { fetchImpl, calls };
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
