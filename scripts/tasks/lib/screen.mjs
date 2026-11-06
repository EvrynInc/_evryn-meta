/**
 * screen.mjs — R6: a WARNING-GRADE screen for the commonest personal data. Not a guarantee.
 *
 * - An email address is REFUSED.
 * - A phone number is WARNED about, with a deliberately NARROW pattern: it needs separators in the
 *   North-American 3-3-4 shape, or a leading +country code. A broad digit pattern would trip on
 *   dates, ticket numbers (EVR-123), task ids (T-12) and commit SHAs (Tasks AC, 10:55) — the tests
 *   pin each of those as a non-match.
 *
 * No machine can recognize privileged legal content, a trade secret or a user's story; the real
 * control for those is size (a 600-character body holds a pointer, not the substance). This screen
 * catches the cheap, common case and says nothing about the rest.
 *
 * The matched text is NEVER echoed back: the report names the field and the kind of match only.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */

export const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;

export const PHONE = new RegExp(
  [
    // North American: optional +1, then (206) 555-0100 / 206-555-0100 / 206.555.0100 / 206 555 0100
    String.raw`(?<![\w.+-])(?:\+?1[ .-]?)?(?:\(\d{3}\)[ .-]?|\d{3}[ .-])\d{3}[ .-]\d{4}(?![\w-])`,
    // International: +44 20 7946 0958 — a leading + is required
    String.raw`(?<![\w.+-])\+\d{1,3}[ .-]\d{1,4}(?:[ .-]\d{2,4}){2,3}(?![\w-])`,
  ].join('|'),
);

/** The free-text fields every write and the export screen (Soren, 14:49; `note` added at 005: a note is exactly where someone pastes an email address). */
export const SCREENED_FIELDS = ['title', 'description', 'closing_note', 'signed_ref', 'tags', 'links', 'note'];

function asText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

/**
 * Screen one row (or a partial row). Returns { refused: [...], warnings: [...] }, each entry
 * `{ field, kind }`. Fields absent from `row` are skipped.
 */
export function screenRow(row) {
  const refused = [];
  const warnings = [];
  for (const field of SCREENED_FIELDS) {
    if (!(field in row)) continue;
    const text = asText(row[field]);
    if (EMAIL.test(text)) refused.push({ field, kind: 'email address' });
    else if (PHONE.test(text)) warnings.push({ field, kind: 'phone number' });
  }
  return { refused, warnings };
}

export function describeScreen(label, result) {
  const lines = [];
  for (const r of result.refused) lines.push(`REFUSED ${label}: ${r.field} contains something shaped like an ${r.kind}`);
  for (const w of result.warnings) lines.push(`WARNING ${label}: ${w.field} contains something shaped like a ${w.kind} — remove it if it is anyone's personal data`);
  return lines;
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
