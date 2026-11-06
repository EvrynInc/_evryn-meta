/**
 * sqlsplit.mjs — split a PostgreSQL script into its top-level statements, so make-paste.mjs can wrap
 * each one in EXECUTE inside a single DO block.
 *
 * It understands exactly what can hide a `;` that does not end a statement:
 *   - 'single-quoted' strings ('' is an escaped quote), and E'escape' strings (\' and \\ too);
 *   - "double-quoted" identifiers;
 *   - $tag$ dollar-quoted bodies (any tag, including the empty one), which may contain all of the above;
 *   - -- line comments and nested block comments.
 * Comment-only fragments are dropped. Statement text is returned verbatim (trimmed), without the `;`.
 *
 * The acceptance suite is the real proof: the pastes built from these statements must produce the
 * same objects as applying the migration files directly.
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */

export function splitSql(text) {
  const src = String(text).replace(/\r\n/g, '\n');
  const out = [];
  let start = 0;
  let i = 0;
  const n = src.length;

  const isIdentChar = (c) => /[A-Za-z0-9_$]/.test(c ?? '');

  while (i < n) {
    const c = src[i];
    const next = src[i + 1];

    if (c === '-' && next === '-') {
      const eol = src.indexOf('\n', i);
      i = eol === -1 ? n : eol + 1;
      continue;
    }
    if (c === '/' && next === '*') {
      let depth = 1;
      i += 2;
      while (i < n && depth > 0) {
        if (src[i] === '/' && src[i + 1] === '*') {
          depth += 1;
          i += 2;
        } else if (src[i] === '*' && src[i + 1] === '/') {
          depth -= 1;
          i += 2;
        } else i += 1;
      }
      if (depth > 0) throw new Error('splitSql: unterminated block comment');
      continue;
    }
    if (c === "'") {
      const escapeString = (src[i - 1] === 'E' || src[i - 1] === 'e') && !isIdentChar(src[i - 2]);
      i += 1;
      for (;;) {
        if (i >= n) throw new Error('splitSql: unterminated string literal');
        if (escapeString && src[i] === '\\') {
          i += 2;
          continue;
        }
        if (src[i] === "'") {
          if (src[i + 1] === "'") {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (c === '"') {
      const end = src.indexOf('"', i + 1);
      if (end === -1) throw new Error('splitSql: unterminated quoted identifier');
      i = end + 1;
      continue;
    }
    if (c === '$' && !isIdentChar(src[i - 1])) {
      const m = src.slice(i).match(/^\$([A-Za-z_][A-Za-z0-9_]*)?\$/);
      if (m) {
        const tag = m[0];
        const end = src.indexOf(tag, i + tag.length);
        if (end === -1) throw new Error(`splitSql: unterminated dollar quote ${tag}`);
        i = end + tag.length;
        continue;
      }
    }
    if (c === ';') {
      out.push(src.slice(start, i));
      i += 1;
      start = i;
      continue;
    }
    i += 1;
  }
  out.push(src.slice(start));

  return out.map((s) => s.trim()).filter((s) => stripComments(s).trim() !== '');
}

/** Remove -- and block comments (outside strings is assumed: used only to detect comment-only fragments). */
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
