// transcript.mjs — parse a Claude Code transcript (JSONL) into tool calls, results and compaction marks, for packout.mjs.
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// Facts this rests on, MEASURED 2026-11-19 by DC1 against real transcripts (see docs/sessions/2026.11.19-acpg-DC1-report.md, part 0):
//  - One tool call can be written on more than one transcript line (the harness re-sends rows). Calls are deduped by tool_use.id,
//    first occurrence wins; results are joined by tool_use_id, and the first result row (the one carrying toolUseResult) wins.
//  - A Read result is "N\t<line>" per line, numbered from startLine, CR stripped. A file ending in a newline shows one extra empty
//    numbered line. No line truncation was observed (12,011 characters came back whole); a result over the token cap is NOT an
//    error: it is a shorter run of whole lines (a "PARTIAL view"), with a separate attachment row of type read_truncation_notice.
//  - An errored Read has is_error true and no numbered lines.
//  - The first result row usually carries toolUseResult.file {content, startLine, numLines, totalLines}: the exact text read.
//  - A compaction is a row with isCompactSummary, or a system row with subtype compact_boundary.

import fs from 'node:fs';
import crypto from 'node:crypto';

export const sha12 = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);

/** Read a transcript's raw lines; `to` bounds it (1-based, inclusive). */
export function readLines(file, to) {
  const all = fs.readFileSync(file, 'utf8').split('\n');
  if (all.length && all[all.length - 1] === '') all.pop();
  return to ? all.slice(0, to) : all;
}

/** sha256(12) of the first n lines, each terminated by "\n" (the ledger freeze table's definition, matched on 0e8790fc). */
export function hashFirst(file, n) {
  const lines = readLines(file, n);
  return { n: lines.length, sha: sha12(lines.map((l) => l + '\n').join('')) };
}

function resultText(b) {
  if (typeof b.content === 'string') return b.content;
  if (Array.isArray(b.content)) return b.content.filter((x) => x.type === 'text').map((x) => x.text || '').join('\n');
  return '';
}

/**
 * Parse a Read result into {start, lines[]} or null.
 * Prefers toolUseResult.file (exact text); falls back to the numbered text, accepting only a run numbered start, start+1, …
 * so a file line that itself begins with digits and a tab cannot be mistaken for a window boundary.
 */
export function readWindow(text, tur) {
  if (tur && typeof tur === 'object' && tur.file && typeof tur.file.content === 'string' && Number.isInteger(tur.file.startLine)) {
    const lines = tur.file.content.split('\n');
    return { start: tur.file.startLine, lines, total: tur.file.totalLines ?? null, source: 'toolUseResult' };
  }
  const raw = (text || '').split('\n');
  const m0 = raw[0] && raw[0].match(/^\s*(\d+)\t/);
  if (!m0) return null;
  const start = +m0[1];
  const lines = [];
  for (let i = 0; i < raw.length; i++) {
    const m = raw[i].match(/^\s*(\d+)\t([\s\S]*)$/);
    if (!m || +m[1] !== start + i) break;
    lines.push(m[2]);
  }
  return { start, lines, total: null, source: 'numbered' };
}

/**
 * Parse the transcript. Returns { lines, calls, compactions, n }.
 * Each call: { id, n (transcript line), ts, name, input, ok, err, text, win (Read only) }.
 */
export function parse(file, { to } = {}) {
  const lines = readLines(file, to);
  const calls = [];
  const byId = new Map();
  const compactions = [];
  const summaries = [];
  const rows = [];
  lines.forEach((ln, i) => {
    const n = i + 1;
    if (!ln.trim()) return;
    let o;
    try { o = JSON.parse(ln); } catch { return; }
    rows.push({ n, o });
    // F10: one compaction writes BOTH a compact_boundary row and an isCompactSummary row; count the boundary only
    // (the summary row is the fallback for a transcript that carries no boundary rows).
    if (o.type === 'system' && o.subtype === 'compact_boundary') compactions.push({ n, ts: o.timestamp });
    else if (o.isCompactSummary) summaries.push({ n, ts: o.timestamp });
    const c = o.message?.content;
    if (!Array.isArray(c)) return;
    for (const b of c) {
      if (b.type === 'tool_use' && !byId.has(b.id)) {
        const k = { id: b.id, n, ts: o.timestamp, cwd: o.cwd, name: b.name, input: b.input || {} };
        calls.push(k);
        byId.set(b.id, k);
      } else if (b.type === 'tool_result' && byId.has(b.tool_use_id)) {
        const k = byId.get(b.tool_use_id);
        if (k.text !== undefined) continue; // a re-sent copy; the first result wins
        k.err = !!b.is_error;
        k.text = resultText(b);
        k.resultN = n;
        k.tur = o.toolUseResult;
        if (k.name === 'Read' && !k.err) k.win = readWindow(k.text, o.toolUseResult);
      }
    }
  });
  for (const k of calls) k.ok = k.text !== undefined && !k.err;
  return { lines, rows, calls, compactions: compactions.length ? compactions : summaries, n: lines.length };
}

/** Normalize a path for comparison: forward slashes, lower case, Git-Bash /c/ and C:/ forms unified. */
/** F12: a Git-Bash path (/c/Users/...) given on the command line, as a Windows path (C:/Users/...), on win32 only. */
export function winPath(p) { return process.platform === 'win32' ? String(p).replace(/^\/([a-zA-Z])\//, (_, d) => d.toUpperCase() + ':/') : p; }

export function normPath(p) {
  let s = String(p || '').replace(/\\/g, '/').toLowerCase();
  s = s.replace(/^\/([a-z])\//, '$1:/');
  return s;
}
export const samePath = (a, b) => !!a && !!b && normPath(a) === normPath(b);
export const endsWithPath = (p, suffix) => !!p && !!suffix && normPath(p).endsWith(normPath(suffix).replace(/^\.?\//, ''));

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
