// checks.mjs — C1–C12 of the packout guard (build brief §3.3), one pure function each, returning {id, verdict, evidence}.
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// Verdicts: PASS · FAIL · OPEN (historical: <reason>) — OPEN is never a PASS. There is no C13 (Justin's B14 (b)).
// Everything here judges what the transcript and the files CONTAIN. "Re-read after the last edit" is content equality (C7, C8, C9),
// never edit-counting. A sweep counts only if it is an extract this tool made (live) and a Read reached its marker; text printed
// in Bash output never counts (review §1.3; Justin's ruling on Ballot 3).

import path from 'node:path';
import { samePath, endsWithPath, normPath } from './transcript.mjs';
import { WRITE_BASH, MARKER_RE } from './sweep.mjs';

const R = (id, verdict, evidence) => ({ id, verdict, evidence });
const base = (p) => normPath(p).split('/').pop();

/** Lines of a file's current content as the Read tool numbers them (CR stripped; a final newline yields one empty last line). */
export const fileLines = (text) => String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

/** Does tool call k write the file at p? Returns 'edit' | 'bash-named' | null. */
export function writes(k, p) {
  if (!k.ok || !p) return null;
  const i = k.input || {};
  if ((k.name === 'Edit' || k.name === 'Write' || k.name === 'NotebookEdit') && (samePath(i.file_path || i.notebook_path, p) || endsWithPath(i.file_path || i.notebook_path, p))) return 'edit';
  if (k.name === 'Bash') {
    // Only a WRITE TARGET counts: the file after > or >>, append-entry.mjs's first argument, tee's, sed -i's, cp/mv's
    // destination — with heredoc bodies removed first. A command whose TEXT merely names the file is not a write
    // (the prototype's defect: Thea 2352 appended to a Log whose text named the handoff; am2 1090 wrote a /tmp file
    // whose heredoc named the findings). Matching is on the last TWO path segments, never a bare file name.
    const tail = normPath(p).split('/').slice(-2).join('/');
    for (const t of bashWriteTargets(String(i.command || ''))) if (normPath(t).endsWith(tail)) return 'bash-target';
  }
  return null;
}

/** The segment of a shell command that LAUNCHES a session (its first word is the claude binary, and it carries --bg), or null.
 *  A command whose text merely mentions "claude --bg" (a log line, a printf) is not a launch (Lucas am3 line 896). */
export function launchSegment(cmd) {
  const c = stripHeredocs(cmd);
  for (const seg of c.split(/;|&&|\|\||\n/)) {
    const words = seg.trim().replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S+)\s+)*/, '');
    const first = (words.match(/^("[^"]+"|'[^']+'|\S+)/) || [''])[0].replace(/^["']|["']$/g, '');
    if (!/\s--bg\b/.test(seg)) continue;
    if (/(^|[\\/])claude(\.exe)?$/i.test(first)) return seg;
    // "$CLAUDE" --bg …, with CLAUDE assigned to the binary's path earlier in the same command (the fleet's usual form)
    const v = first.match(/^\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?$/);
    if (v && new RegExp(`(^|[\\s;&])${v[1]}=[^\\n]*?claude(\\.exe)?["']?(?=;|\\s|$)`, 'i').test(c)) return seg;
  }
  return null;
}

/** Remove heredoc bodies (<<EOF … EOF, <<'EOF' … EOF, <<-EOF) from a shell command. */
export function stripHeredocs(cmd) {
  const lines = String(cmd).split('\n');
  const out = [];
  let term = null;
  for (const l of lines) {
    if (term) { if (l.trim() === term) term = null; continue; }
    out.push(l);
    const m = l.match(/<<-?\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/);
    if (m) term = m[1] || m[2] || m[3];
  }
  return out.join('\n');
}

/** The files a shell command writes, as written (variables resolved where assigned in the same command). */
export function bashWriteTargets(cmd) {
  const c = stripHeredocs(cmd);
  const vars = Object.fromEntries([...c.matchAll(/(?:^|[\s;&])([A-Za-z_][A-Za-z0-9_]*)=(?:"([^"]*)"|'([^']*)'|([^\s;&|]+))/g)].map((x) => [x[1], x[2] ?? x[3] ?? x[4]]));
  const res = (t) => t.replace(/^["']|["']$/g, '').replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (_, v) => vars[v] ?? `$${v}`);
  const tok = `("[^"]+"|'[^']+'|[^\\s;&|()<>]+)`;
  const out = [];
  for (const m of c.matchAll(new RegExp(`(?:^|[^0-9&<>])>>?\\s*${tok}`, 'g'))) out.push(res(m[1]));
  for (const m of c.matchAll(new RegExp(`append-entry\\.mjs\\s+${tok}`, 'g'))) out.push(res(m[1]));
  for (const m of c.matchAll(new RegExp(`\\btee\\s+(?:-a\\s+)?${tok}`, 'g'))) out.push(res(m[1]));
  for (const m of c.matchAll(new RegExp(`\\bsed\\s+-i\\S*\\s+(?:'[^']*'|"[^"]*"|\\S+)\\s+${tok}`, 'g'))) out.push(res(m[1]));
  for (const m of c.matchAll(new RegExp(`\\b(?:cp|mv)\\s+(?:-\\S+\\s+)*${tok}\\s+${tok}`, 'g'))) out.push(res(m[2]));
  return out.filter((t) => t && t !== '/dev/null' && !/^&\d/.test(t));
}
const isRead = (k, p) => k.ok && k.name === 'Read' && k.win && (samePath(k.input.file_path, p) || endsWithPath(k.input.file_path, p));

/** Compose the newest text seen for each line from a list of Read calls (oldest first). Returns Map line→text. */
function compose(reads) {
  const m = new Map();
  for (const k of reads) k.win.lines.forEach((t, j) => m.set(k.win.start + j, t));
  return m;
}
/** Do these reads cover lines 1..target with no gap? */
function covers(reads, target) {
  const m = compose(reads);
  const gaps = [];
  for (let i = 1; i <= target; i++) {
    if (m.has(i)) continue;
    let j = i; while (j + 1 <= target && !m.has(j + 1)) j++;
    gaps.push(i === j ? `${i}` : `${i}-${j}`); i = j;
  }
  return gaps.length ? { ok: false, gap: gaps.join(', ') } : { ok: true };
}
/** Compare composed reads to a file's current lines. Returns {equal, firstDiff, readLines, fileLines}. */
function equalsFile(reads, text) {
  const want = fileLines(text);
  const m = compose(reads);
  let maxRead = 0; for (const k of m.keys()) maxRead = Math.max(maxRead, k);
  for (let i = 1; i <= want.length; i++) {
    if (!m.has(i)) return { equal: false, why: `line ${i} never read (file has ${want.length} lines)` };
    if (m.get(i) !== want[i - 1]) return { equal: false, why: `line ${i} differs (read ${JSON.stringify(m.get(i).slice(0, 60))} vs now ${JSON.stringify(want[i - 1].slice(0, 60))})` };
  }
  if (maxRead > want.length) return { equal: false, why: `read reached line ${maxRead}; file now has ${want.length} lines` };
  return { equal: true };
}
/** The newest set of reads whose composition is the "last whole read": walk back from the newest read until 1..T is covered,
 *  T being the file's length AS THAT READ SAW IT (toolUseResult totalLines) when known, else its length now. */
function lastWhole(readsAll, text) {
  const T = readsAll.length && Number.isInteger(readsAll[readsAll.length - 1].win.total) ? readsAll[readsAll.length - 1].win.total : fileLines(text).length;
  const want = { length: T };
  const picked = [];
  const m = new Set();
  for (let j = readsAll.length - 1; j >= 0; j--) {
    picked.unshift(readsAll[j]);
    readsAll[j].win.lines.forEach((_, x) => m.add(readsAll[j].win.start + x));
    let all = true; for (let i = 1; i <= want.length; i++) if (!m.has(i)) { all = false; break; }
    if (all) return picked;
  }
  return null;
}

const after = (from) => (k) => k.n >= from;

export function C1(ctx) {
  const { calls, from, memoryPath, handoffText, profile } = ctx;
  if (profile === 'ac') {
    const m = /^PACKOUT-NONE C1: (.+)$/m.exec(handoffText || '');
    if (m) return R('C1', 'PASS', `AC profile (interim): "PACKOUT-NONE C1: ${m[1].slice(0, 80)}" in the handoff`);
  }
  const w = calls.filter(after(from)).find((k) => writes(k, memoryPath));
  return w ? R('C1', 'PASS', `${w.name} to ${memoryPath} at line ${w.n} (${w.ts}) [${writes(w, memoryPath)}]`)
    : R('C1', 'FAIL', `no write to ${memoryPath} after line ${from}`);
}

export function C2(ctx) {
  const { calls, from, currentStatePath, topsheetPath, handoffText } = ctx;
  const none = /^PACKOUT-NONE C2: (.+)$/m.exec(handoffText || '');
  const a = calls.filter(after(from));
  const cs = a.find((k) => writes(k, currentStatePath));
  const ts = topsheetPath ? a.find((k) => writes(k, topsheetPath)) : null;
  const tn = a.find((k) => k.ok && k.name === 'Bash' && /tasks\.mjs\b[^|;&]*\bnote\b/.test(String(k.input.command || '')));
  const parts = [`current-state ${cs ? 'line ' + cs.n : 'none'}`, `topsheet ${topsheetPath ? (ts ? 'line ' + ts.n : 'none') : 'n/a (no topsheet for this agent)'}`, `task note ${tn ? 'line ' + tn.n : 'none'}`];
  const ok = cs && (ts || !topsheetPath) && tn;
  if (ok) return R('C2', 'PASS', parts.join('; '));
  if (none) return R('C2', 'PASS', `presence-only: "PACKOUT-NONE C2: ${none[1].slice(0, 80)}" (${parts.join('; ')})`);
  return R('C2', 'FAIL', parts.join('; ') + '; and no "PACKOUT-NONE C2:" line in the handoff');
}

/** Is a sweep read to its marker after it was made? sweep: {path, N, createdN, content|null, filtered, nKnown} */
function sweepRead(calls, s) {
  if (s.filtered) return { ok: false, open: `extract ${base(s.path)} at ${s.createdN} was filtered before it was written (not a plain extract)` };
  // live: the exact owned path; historical: the extract's file name, between its making and the next extract to that name
  const reads = s.content != null ? calls.filter((k) => k.n > s.createdN && isRead(k, s.path))
    : calls.filter((k) => k.n > s.createdN && k.n < s.until && k.ok && k.name === 'Read' && k.win && base(k.input.file_path) === s.base);
  if (s.content != null) {
    const target = s.N + 1; // the marker line
    const cv = covers(reads, target);
    if (!cv.ok) return { ok: false, why: `extract ${s.path} (${s.N} lines + marker) made at ${s.createdN}: unread ${cv.gap}` };
    const m = compose(reads); const want = fileLines(s.content);
    for (let i = 1; i <= target; i++) if (m.get(i) !== want[i - 1]) return { ok: false, why: `extract ${s.path}: line ${i} as read differs from the extract` };
    if (!MARKER_RE.test(m.get(target))) return { ok: false, why: `extract ${s.path}: line ${target} is not the end marker` };
    return { ok: true, why: `extract ${base(s.path)} (${s.N} lines) made at ${s.createdN}, Read to its marker (reads ${reads.map((k) => k.n).join(',')})` };
  }
  // historical: no marker; the true length comes only from a Read that reported totalLines
  if (!reads.length) return { ok: false, why: `extract ${base(s.path)} made at ${s.createdN} was never Read` };
  if (!s.nKnown) return { ok: false, open: `extract ${base(s.path)} at ${s.createdN}: its length is not measurable (no Read reported totalLines; a rebuilt length is not exact)` };
  const cv = covers(reads, s.N);
  return cv.ok ? { ok: true, why: `extract ${base(s.path)} (${s.N} lines, measured by Read totalLines) made at ${s.createdN}, Read whole (reads ${reads.map((k) => k.n).join(',')})` }
    : { ok: false, why: `extract ${base(s.path)} (${s.N} lines) made at ${s.createdN}: unread ${cv.gap}` };
}

export function C3(ctx) {
  const { calls, from, sweeps } = ctx;
  const cand = sweeps.filter((s) => s.createdN >= from);
  if (!cand.length) return R('C3', 'FAIL', `no ${ctx.historical ? 'session-text extraction' : '`packout.mjs sweep` extract'} after line ${from}`);
  const res = cand.map((s) => ({ s, r: sweepRead(calls, s) }));
  const ok = res.find((x) => x.r.ok);
  if (ok) return R('C3', 'PASS', ok.r.why);
  if (res.some((x) => x.r.open)) return R('C3', 'OPEN', `(historical: no candidate passes and at least one cannot be judged — ${res.map((x) => x.r.why || x.r.open).join('; ')})`);
  return R('C3', 'FAIL', res.map((x) => x.r.why || x.r.open).join('; '));
}

function handoffWrites(ctx) { return ctx.calls.filter(after(ctx.from)).filter((k) => writes(k, ctx.handoff)); }

export function C4(ctx) {
  const hw = handoffWrites(ctx);
  return hw.length ? R('C4', 'PASS', `first write ${hw[0].n}, last ${hw[hw.length - 1].n} (${hw.length} writes)`) : R('C4', 'FAIL', `no write to ${ctx.handoff} after line ${ctx.from}`);
}

export function C5(ctx) {
  const hw = handoffWrites(ctx);
  if (!hw.length) return R('C5', 'FAIL', 'the handoff was never written, so no second sweep can follow its first write');
  const first = hw[0].n;
  const c3 = C3pick(ctx);
  const cand = ctx.sweeps.filter((s) => s.createdN > first && (!c3 || s !== c3));
  if (!cand.length) return R('C5', 'FAIL', `no ${ctx.historical ? 'extraction' : 'sweep extract'} made after the handoff's first write (${first})${c3 ? `; the lock sweep (${c3.createdN}) does not count twice` : ''}`);
  const res = cand.map((s) => ({ s, r: sweepRead(ctx.calls, s) }));
  const ok = res.find((x) => x.r.ok);
  if (ok) return R('C5', 'PASS', ok.r.why + `, after the handoff's first write (${first})`);
  if (res.some((x) => x.r.open)) return R('C5', 'OPEN', `(historical: no candidate passes and at least one cannot be judged — ${res.map((x) => x.r.why || x.r.open).join('; ')})`);
  return R('C5', 'FAIL', res.map((x) => x.r.why || x.r.open).join('; '));
}
function C3pick(ctx) { const cand = ctx.sweeps.filter((s) => s.createdN >= ctx.from); return cand.find((s) => sweepRead(ctx.calls, s).ok) || null; }

export function C6(ctx) {
  const { calls, handoffText } = ctx;
  const text = handoffText || '';
  const spawns = [];
  for (const k of calls) {
    if (!k.ok) continue;
    if (k.name === 'Agent' || k.name === 'Task') {
      const id = (String(k.text || '').match(/agentId:\s*([A-Za-z0-9]+)/) || [])[1] || (k.tur && k.tur.agentId) || null;
      spawns.push({ n: k.n, kind: 'Agent', id, name: null, desc: k.input.description });
    } else if (k.name === 'Bash' && launchSegment(String(k.input.command || ''))) {
      const c = launchSegment(String(k.input.command));
      const name = (c.match(/(?:--name|-n)\s+(?:"([^"]+)"|'([^']+)'|(\S+))/) || []).slice(1).find(Boolean) || null;
      const id = (String(k.text || '').match(/\b([0-9a-f]{8})(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/) || [])[1] || null;
      spawns.push({ n: k.n, kind: 'claude --bg', id, name });
    }
  }
  if (!spawns.length) return R('C6', 'PASS', 'no Agent call and no claude --bg launch in the session');
  const miss = spawns.filter((s) => !((s.id && text.includes(s.id.slice(0, 8))) || (s.name && text.includes(s.name))));
  const list = spawns.map((s) => `${s.kind}@${s.n} ${s.id || '-'}${s.name ? ' "' + s.name + '"' : ''}`).join('; ');
  return miss.length ? R('C6', 'FAIL', `not named in the handoff by id or name: ${miss.map((s) => `${s.kind}@${s.n} ${s.id || '(no id)'}${s.desc ? ' (described as "' + String(s.desc).slice(0, 40) + '")' : ''}`).join('; ')} — all: ${list}`)
    : R('C6', 'PASS', `all named: ${list}`);
}

export function C7(ctx) {
  const { calls, from, incoming, incomingText } = ctx;
  if (ctx.c7SameFile) return R('C7', 'OPEN', '(historical: the incoming handoff is the same shared, appended file as the outgoing one; nothing separate to re-read, and C8 covers the file)');
  if (!incoming) return R('C7', 'PASS', 'no incoming handoff given (nothing to re-read)');
  if (incomingText == null) return R('C7', 'FAIL', `the incoming handoff ${incoming} is not readable now`);
  const reads = calls.filter((k) => k.n >= from && isRead(k, incoming));
  if (!reads.length) return R('C7', 'FAIL', `no Read of the incoming handoff after line ${from}`);
  const lw = lastWhole(reads, incomingText);
  if (!lw) return R('C7', 'FAIL', `incoming never read whole after line ${from} (reads ${reads.map((k) => `${k.n}:${k.win.start}-${k.win.start + k.win.lines.length - 1}`).join(', ')})`);
  const eq = equalsFile(lw, incomingText);
  const want = fileLines(incomingText); const canaryOk = /FULL FILE LOADED/.test(want.filter((l) => l.trim()).pop() || '');
  if (!eq.equal) return R('C7', 'FAIL', `the last whole read (${lw.map((k) => k.n).join(',')}) differs from the incoming file now: ${eq.why}`);
  return R('C7', 'PASS', `read whole (${lw.map((k) => k.n).join(',')})${canaryOk ? ' to its canary' : ' (the file carries no canary)'}, equal to the file now`);
}

export function C8(ctx) {
  const { calls, handoff, handoffText } = ctx;
  if (handoffText == null) return R('C8', 'FAIL', `the handoff ${handoff} is not readable now`);
  const hw = handoffWrites(ctx);
  const lastW = hw.length ? hw[hw.length - 1].n : ctx.from;
  if (ctx.c8Order) {
    // HIST-ORDER: a shared, appended handoff has no true "final" for this seat, so content equality is impossible.
    // Judge write-ordering only; it can FAIL or be OPEN, never PASS.
    const all = calls.filter((k) => k.n >= ctx.from && isRead(k, handoff));
    let lastWholeAt = null;
    for (let j = all.length - 1; j >= 0 && lastWholeAt == null; j--) {
      const T = all[j].win.total; if (!Number.isInteger(T)) continue;
      if (covers(all.slice(0, j + 1).filter((k) => k.win.total === T), T).ok) lastWholeAt = all[j].n;
    }
    if (lastWholeAt == null) return R('C8', 'FAIL', `HIST-ORDER: no whole Read of the handoff after line ${ctx.from}`);
    const later = hw.filter((k) => k.n > lastWholeAt);
    return later.length ? R('C8', 'FAIL', `HIST-ORDER: the last whole Read (${lastWholeAt}) has ${later.length} of this seat's writes after it (${later.map((k) => k.n).join(', ')})`)
      : R('C8', 'OPEN', `(historical: HIST-ORDER — no write by this seat after its last whole Read (${lastWholeAt}), but content equality cannot be judged on a shared appended file)`);
  }
  const reads = calls.filter((k) => k.n > lastW && isRead(k, handoff));
  if (!reads.length) return R('C8', 'FAIL', `no Read of the handoff after its last write (${lastW})`);
  const lw = lastWhole(reads, handoffText);
  if (!lw) return R('C8', 'FAIL', `no whole Read after the last write (${lastW}); reads ${reads.map((k) => `${k.n}:${k.win.start}-${k.win.start + k.win.lines.length - 1}`).join(', ')}`);
  const eq = equalsFile(lw, handoffText);
  return eq.equal ? R('C8', 'PASS', `the last whole Read (${lw.map((k) => k.n).join(',')}) after the last write (${lastW}) equals the handoff now, exactly`)
    : R('C8', 'FAIL', `the last whole Read (${lw.map((k) => k.n).join(',')}) differs from the handoff now: ${eq.why}`);
}

export function C9(ctx) {
  const { calls, findings, findingsText } = ctx;
  if (!findings || findingsText == null) return R('C9', 'FAIL', `no findings file ${findings || '(none)'} exists`);
  const own = calls.filter((k) => writes(k, findings));
  if (own.length) return R('C9', 'FAIL', `the findings file was written by this seat (line ${own[0].n}), not by a different session`);
  const hw = handoffWrites(ctx);
  if (!hw.length) return R('C9', 'FAIL', 'the handoff was never written');
  const reads = calls.filter((k) => k.n > hw[0].n && isRead(k, findings));
  if (!reads.length) return R('C9', 'FAIL', `the findings file was never Read by this seat after the handoff's first write (${hw[0].n})`);
  const lw = lastWhole(reads, findingsText);
  if (!lw) return R('C9', 'FAIL', `the findings file was not Read whole (reads ${reads.map((k) => `${k.n}:${k.win.start}-${k.win.start + k.win.lines.length - 1}`).join(', ')})`);
  const eq = equalsFile(lw, findingsText);
  return eq.equal ? R('C9', 'PASS', `findings ${base(findings)} by another session; Read whole (${lw.map((k) => k.n).join(',')}), equal to the file now`)
    : R('C9', 'FAIL', `the last whole Read of the findings (${lw.map((k) => k.n).join(',')}) differs from the file now: ${eq.why}`);
}

/** Parse a "## Uncommitted" section: one backticked repo-relative path per line. */
export function uncommittedList(text) {
  if (text == null) return null;
  const m = /^## Uncommitted[ \t]*\n([\s\S]*?)(?=^#{1,2} |\s*$(?![\s\S]))/m.exec(String(text).replace(/\r\n/g, '\n'));
  if (!m) return null;
  return [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1]);
}

export function C10(ctx) {
  const { calls, handoffText, incomingText, isCommitted, rootOf } = ctx;
  const outList = ctx.uncommittedOverride ?? uncommittedList(handoffText);
  const inList = ctx.incoming ? (ctx.incomingUncommittedOverride ?? uncommittedList(incomingText)) : [];
  if (ctx.historical && (outList == null || (ctx.incoming && inList == null))) return R('C10', 'OPEN', '(historical: no machine-readable uncommitted list, and the manifest transcribes none)');
  const listed = new Set((outList || []).map(normPath));
  const named = (p) => [...listed].some((q) => normPath(p).endsWith(q));
  const written = new Map();
  for (const k of calls) {
    if (!k.ok) continue;
    if (k.name === 'Edit' || k.name === 'Write' || k.name === 'NotebookEdit') { const p = k.input.file_path || k.input.notebook_path; if (p && rootOf(p)) written.set(normPath(p), k.n); }
  }
  const bad = [];
  // listed paths are repo-relative to the repo that holds the handoff (live); historical overrides match by suffix
  const listRoot = ctx.historical ? null : rootOf(ctx.handoff);
  const abs = (p) => (listRoot && !path.isAbsolute(p) ? path.join(listRoot, p) : p);
  for (const [p, n] of written) { const c = isCommitted(p); if (c === false && !named(p)) bad.push(`${p} (written at ${n}) is uncommitted and not in "## Uncommitted"`); }
  for (const p of inList || []) { const c = isCommitted(abs(p)); if (c === false && !named(p)) bad.push(`incoming's uncommitted ${p} is neither committed nor carried forward`); }
  const note = `${written.size} repo files written; outgoing list ${outList ? outList.length : 'absent'}; incoming list ${inList ? inList.length : 'absent'}`;
  return bad.length ? R('C10', 'FAIL', bad.join('; ') + ` (${note})`) : R('C10', 'PASS', note + (ctx.historical ? ' [fixture-assisted: lists transcribed by the manifest]' : ''));
}

export function C11(ctx) {
  const { compactions, calls } = ctx;
  if (!compactions.length) return R('C11', 'PASS', 'no compaction marker in the transcript');
  const at = compactions[0].n;
  const after2 = calls.filter((k) => k.n > at && k.ok && (k.name === 'Edit' || k.name === 'Write' || (k.name === 'Bash' && WRITE_BASH.test(String(k.input.command || '')))));
  return R('C11', 'FAIL', `compaction at line ${at}: the seat must stop; UNVERIFIED writes after it: ${after2.map((k) => k.n).join(', ') || 'none'}`);
}

export function C12(ctx) {
  const { calls, from, nearZeroPath, handoffText } = ctx;
  const w = calls.filter(after(from)).find((k) => writes(k, nearZeroPath));
  if (w) return R('C12', 'PASS', `near-zero decisions table written at line ${w.n}`);
  const m = /^PACKOUT-NONE C12: nothing by hand — (.+)$/m.exec(handoffText || '');
  if (m) return R('C12', 'PASS', `presence-only; truth invisible to any check: "PACKOUT-NONE C12: nothing by hand — ${m[1].slice(0, 70)}"`);
  if (ctx.c12Stated) return R('C12', 'PASS', `presence-only; truth invisible to any check (${ctx.c12Stated})`);
  return R('C12', 'FAIL', `no write to the near-zero table after line ${from}, and no "PACKOUT-NONE C12: nothing by hand — <reason>" line`);
}

export const ALL = [C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12];
export function runAll(ctx) { return ALL.map((f) => { try { return f(ctx); } catch (e) { return R(f.name, 'FAIL', `check crashed: ${e.message}`); } }); }

export { path };

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
