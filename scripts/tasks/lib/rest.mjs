/**
 * rest.mjs — a minimal PostgREST client over `fetch`, with no npm dependency.
 *
 * - Auth: the secret key goes on the `apikey` header ONLY. Supabase's API-keys guide: "Send
 *   publishable and secret keys on the `apikey` header, not on `Authorization: Bearer`" (read
 *   2026-11-05 through a fetch summarizer, so treat the quote as a lead). A LEGACY service_role JWT
 *   is also sent as `Authorization: Bearer`, as supabase-js always did for those keys.
 * - Actor: `x-evryn-actor` on every request. The database refuses a write without it; the CLI
 *   refusing first is a courtesy, not the control.
 * - Errors: PostgREST's `message`, `code`, `hint` and `details` are surfaced; a network error
 *   surfaces only `err.message` (+ a cause code), never the error object, which can carry headers.
 * - R8: `paginateAll` walks a keyset on an ascending unique integer column and stops ONLY on a
 *   zero-row page. PostgREST silently caps unbounded reads at its max-rows setting (1,000 here),
 *   a bigger `limit` does not defeat it, and a short page proves nothing
 *   (evryn-team-runtime/src/db/paginate.ts, header). The cursor here is unique, so the
 *   duplicate-boundary machinery that module needs is not needed.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */

export class RestError extends Error {
  constructor(message, { status, code, hint, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.hint = hint;
    this.details = details;
  }
}

export const DEFAULT_PAGE_SIZE = 500;
export const DEFAULT_MAX_PAGES = 200;

function safeNetworkMessage(err) {
  const msg = err instanceof Error ? err.message : 'unknown error';
  const code = err && err.cause && typeof err.cause.code === 'string' ? ` (${err.cause.code})` : '';
  return `${msg}${code}`;
}

export function makeRest({ target, actor, fetchImpl }) {
  if (typeof fetchImpl !== 'function') throw new Error('makeRest: fetchImpl is required');

  async function request(method, path, { body, prefer, extraHeaders } = {}) {
    const headers = { apikey: target.key, Accept: 'application/json' };
    if (target.keyKind === 'legacy-service-role') headers.Authorization = `Bearer ${target.key}`;
    if (actor) headers['x-evryn-actor'] = actor;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (prefer) headers.Prefer = prefer;
    Object.assign(headers, extraHeaders ?? {});
    const table = path.split('?')[0];

    let res;
    try {
      res = await fetchImpl(`${target.base}/rest/v1/${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      throw new RestError(`${method} ${table}: request failed: ${safeNetworkMessage(err)}`);
    }

    const text = await res.text();
    if (!res.ok) {
      let parsed = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { message: text.slice(0, 300) };
      }
      throw new RestError(`${method} ${table}: HTTP ${res.status}: ${parsed.message ?? 'no message'}`, {
        status: res.status,
        code: parsed.code,
        hint: parsed.hint,
        details: parsed.details,
      });
    }
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new RestError(`${method} ${table}: response was not JSON`);
      }
    }
    return { data, headers: res.headers, status: res.status };
  }

  /**
   * Read every row matching `query` from `table`, keyset-paginated on `cursorCol` ascending.
   * `query` is the filter/select part, without order/limit/cursor.
   */
  async function paginateAll(table, query, { cursorCol = 'short_id', pageSize = DEFAULT_PAGE_SIZE, maxPages = DEFAULT_MAX_PAGES } = {}) {
    const rows = [];
    let cursor = null;
    for (let page = 0; ; page += 1) {
      if (page >= maxPages) {
        throw new RestError(
          `${table}: page budget exhausted (${maxPages} pages of ${pageSize}) with rows still unread — refusing to return a partial list`,
        );
      }
      const parts = [];
      if (query) parts.push(query);
      if (cursor !== null) parts.push(`${cursorCol}=gt.${cursor}`);
      parts.push(`order=${cursorCol}.asc`, `limit=${pageSize}`);
      const { data } = await request('GET', `${table}?${parts.join('&')}`);
      if (!Array.isArray(data)) throw new RestError(`${table}: expected a JSON array`);
      if (data.length === 0) return rows;
      for (const row of data) {
        const value = row[cursorCol];
        if (typeof value !== 'number') throw new RestError(`${table}: row is missing numeric ${cursorCol}`);
        if (cursor !== null && !(value > cursor)) {
          throw new RestError(`${table}: page ${page + 1} is not ascending on ${cursorCol} — refusing (a walk out of order skips rows)`);
        }
        cursor = value;
        rows.push(row);
      }
    }
  }

  return { request, paginateAll };
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
