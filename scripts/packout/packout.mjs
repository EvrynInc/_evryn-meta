#!/usr/bin/env node
// packout.mjs — the packout guard, step 1: begin · sweep · check (live, or --historical) · verify. Build brief §3.1–§3.3.
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// USAGE (run by hand by the outgoing seat; its successor runs verify)
//   node _evryn-meta/scripts/packout/packout.mjs begin  --agent <name> --handoff <path> [--incoming <path>]
//   node _evryn-meta/scripts/packout/packout.mjs sweep  --handoff <path>
//   node _evryn-meta/scripts/packout/packout.mjs check  --handoff <path>                      (writes <handoff-stem>.packout-report.md)
//   node _evryn-meta/scripts/packout/packout.mjs verify --report <path>
//   node _evryn-meta/scripts/packout/packout.mjs check --historical --transcript <file> --to <N> --from <line> --agent <name>
//        --handoff <suffix> --final <file> [--incoming <suffix> --incoming-file <file>] [--findings <suffix> --findings-file <file>]
//        [--hist <json-file>] [--out <report>]
// Options for tests and odd machines: --transcript <file> (instead of finding it by session id), --session <id>,
//   PACKOUT_STATE_DIR (state folder root; default ~/.claude/packout), PACKOUT_CODE_ROOT (parent of the repos),
//   PACKOUT_PROJECTS_DIR (default ~/.claude/projects).
// The seat writes no step claims: the report IS the packout record. check exits 1 on any FAIL; verify exits 1 unless it agrees.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse, hashFirst, sha12, normPath, readLines } from './lib/transcript.mjs';
import { buildExtract, actionDigest, MARKER_RE } from './lib/sweep.mjs';
import { runAll, uncommittedList } from './lib/checks.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CODE = process.env.PACKOUT_CODE_ROOT || path.resolve(HERE, '..', '..', '..');
const STATE_ROOT = process.env.PACKOUT_STATE_DIR || path.join(os.homedir(), '.claude', 'packout');
const PROJECTS = process.env.PACKOUT_PROJECTS_DIR || path.join(os.homedir(), '.claude', 'projects');

function args(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) { const k = t.slice(2); const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) a[k] = true; else { a[k] = v; i++; } } else a._.push(t);
  }
  return a;
}
const die = (msg, code = 2) => { console.error(`packout: ${msg}`); process.exit(code); };
const readOrNull = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const shaFile = (p) => { const t = readOrNull(p); return t == null ? null : sha12(t); };

// ---- state: keyed by the normalized handoff path, carrying the chain of session ids (a resumed session gets a new id)
const stateDir = (handoff) => path.join(STATE_ROOT, sha12(normPath(path.resolve(handoff))));
const statePath = (handoff) => path.join(stateDir(handoff), 'state.json');
function loadState(handoff) { const t = readOrNull(statePath(handoff)); return t ? JSON.parse(t) : null; }
function saveState(handoff, s) { fs.mkdirSync(stateDir(handoff), { recursive: true }); fs.writeFileSync(statePath(handoff), JSON.stringify(s, null, 2) + '\n'); }

function findTranscript(session) {
  if (!session) return null;
  let dirs = [];
  try { dirs = fs.readdirSync(PROJECTS).map((d) => path.join(PROJECTS, d)).filter((d) => fs.statSync(d).isDirectory()); } catch { return null; }
  const hits = [];
  for (const d of dirs) for (const f of fs.readdirSync(d)) if (f.endsWith('.jsonl') && f.startsWith(session)) hits.push(path.join(d, f));
  return hits.length === 1 ? hits[0] : null;
}
function transcriptFor(a, s) {
  if (a.transcript) return path.resolve(a.transcript);
  const id = a.session || s?.sessions?.[s.sessions.length - 1] || process.env.CLAUDE_CODE_SESSION_ID;
  const t = findTranscript(id);
  if (!t) die(`no transcript found for session ${id || '(none: CLAUDE_CODE_SESSION_ID unset)'} under ${PROJECTS}`);
  return t;
}

// ---- agent profiles (ruling ⓸): team agent, or AC (--agent AC*)
function walkFind(dir, name, depth = 6) {
  if (depth < 0) return null;
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }
  for (const e of ents) if (e.isFile() && e.name.toLowerCase() === name.toLowerCase()) return path.join(dir, e.name);
  for (const e of ents) if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'historical') { const r = walkFind(path.join(dir, e.name), name, depth - 1); if (r) return r; }
  return null;
}
export function profileFor(agent) {
  const isAC = /^AC/i.test(agent);
  const team = path.join(CODE, 'evryn-team-workspace');
  return {
    profile: isAC ? 'ac' : 'team',
    memoryPath: isAC ? null : path.join(team, '.claude', 'agent-memory', agent.toLowerCase(), 'MEMORY.md'),
    currentStatePath: isAC ? path.join(CODE, '_evryn-meta', 'docs', 'current-state.md') : path.join(team, 'shared', 'current-state', 'current-state.md'),
    topsheetPath: walkFind(path.join(team, 'shared'), `${agent.toLowerCase()}-topsheet.md`),
    nearZeroPath: path.join(team, 'shared', 'projects', 'helm', '2026', '2026.10.19-consolidation-standup-near-zero-campaign.md'),
  };
}

// ---- git, for C10. SEALED-EXEC: followed 2026-11-19 — `git` is the system git already on disk (PATH), invoked with fixed
// read-only subcommands (rev-parse, status); no package manager resolves it and it never fetches itself from the network.
function gitOut(cwd, argv) { try { return execFileSync('git', ['-C', cwd, ...argv], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } }
const rootCache = new Map();
function rootOf(p) {
  const d = path.dirname(path.resolve(p));
  if (rootCache.has(d)) return rootCache.get(d);
  const r = gitOut(d, ['rev-parse', '--show-toplevel']); const v = r ? r.trim() : null; rootCache.set(d, v); return v;
}
function isCommitted(p) {
  const abs = path.isAbsolute(p) ? p : path.join(CODE, p);
  const root = rootOf(abs); if (!root) return null;
  const o = gitOut(root, ['status', '--porcelain', '--', abs]);
  return o == null ? null : o.trim() === '';
}

function report(lines, meta, out) {
  const fails = lines.filter((r) => r.verdict === 'FAIL').length; const opens = lines.filter((r) => r.verdict === 'OPEN').length;
  const body = [
    `# Packout report — ${meta.historical ? 'HISTORICAL ' : ''}${meta.agent}`, '',
    '> Truncation check: the last line of this file should read `FULL FILE LOADED`.', '>',
    '> Generated by `_evryn-meta/scripts/packout/packout.mjs check`. The seat writes no step claims: this report is the packout record.', '',
    `- **Transcript:** \`${meta.transcript}\` · lines 1–${meta.n} · sha256(12) of those lines \`${meta.sha}\``,
    `- **Handoff:** \`${meta.handoff}\` · sha256(12) now \`${meta.handoffSha}\` · checks from transcript line ${meta.from}`,
    ...(meta.notes || []).map((x) => `- **Note:** ${x}`), '',
    '| Check | Verdict | Evidence |', '|---|---|---|',
    ...lines.map((r) => `| ${r.id} | ${r.verdict} | ${String(r.evidence).replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`), '',
    `**Summary:** ${fails} FAIL · ${opens} OPEN · ${lines.length - fails - opens} PASS`, '',
    '```json', JSON.stringify({ ...meta, verdicts: Object.fromEntries(lines.map((r) => [r.id, r.verdict])) }), '```', '',
    'Truncation canary — DO NOT REMOVE: FULL FILE LOADED', ''];
  if (out) fs.writeFileSync(out, body.join('\n'));
  return { fails, opens, text: body.join('\n') };
}
function printLines(lines) { for (const r of lines) console.log(`${r.verdict}\t${r.id}\t${r.evidence}`); }

// ---- historical extractions: Bash calls running session-text.mjs into a .txt file (the only way they were ever made).
// Their length is taken ONLY from a later Read's toolUseResult totalLines (minus the trailing empty line session-text writes);
// it is never rebuilt, because the rebuild was off by ±2 (review §1.2 item 2). A pipe between the script and the file = filtered.
function historicalSweeps(calls) {
  const out = [];
  calls.forEach((k, idx) => {
    if (!k.ok || k.name !== 'Bash') return;
    const cmd = String(k.input.command || '');
    if (!/session-text\.mjs/.test(cmd) || !/>/.test(cmd)) return;
    const vars = Object.fromEntries([...cmd.matchAll(/\b([A-Za-z_]+)="([^"]+)"/g)].map((x) => [x[1], x[2]]));
    const seg = cmd.slice(cmd.indexOf('session-text.mjs'));
    const m = seg.match(/>\s*"?([^"\s;&|]+)/); if (!m) return;
    const file = m[1].replace(/\$\{?([A-Za-z_]+)\}?/g, (_, v) => vars[v] ?? `$${v}`);
    if (!/\.txt$/i.test(file)) return;
    const filtered = seg.slice(0, seg.indexOf(m[0])).includes('|');
    const b = path.basename(file).toLowerCase();
    const next = calls.slice(idx + 1).find((j) => j.ok && j.name === 'Bash' && /session-text\.mjs/.test(String(j.input.command || '')) && String(j.input.command).toLowerCase().includes(b));
    const until = next ? next.n : Infinity;
    const reads = calls.filter((j) => j.n > k.n && j.n < until && j.ok && j.name === 'Read' && j.win && path.basename(String(j.input.file_path)).toLowerCase() === b);
    const tot = reads.map((j) => j.win.total).find((t) => Number.isInteger(t));
    out.push({ path: file, createdN: k.n, filtered, content: null, nKnown: Number.isInteger(tot), N: Number.isInteger(tot) ? tot - 1 : null, until });
  });
  return out;
}

function buildCtx({ parsed, from, agent, handoff, handoffText, incoming, incomingText, findings, findingsText, sweeps, historical, hist }) {
  const prof = profileFor(agent);
  const ctx = { ...prof, calls: parsed.calls, compactions: parsed.compactions, from, agent, handoff, handoffText, incoming, incomingText, findings, findingsText, sweeps, historical: !!historical, rootOf, isCommitted };
  if (hist) {
    if (hist.uncommittedAtFreeze) { const set = new Set(hist.uncommittedAtFreeze.map(normPath)); ctx.isCommitted = (p) => ![...set].some((q) => normPath(p).endsWith(q)); ctx.rootOf = (p) => /evryn-team-workspace|_evryn-meta|evryn-backend/i.test(p); }
    if ('uncommitted' in hist) ctx.uncommittedOverride = hist.uncommitted;
    if ('incomingUncommitted' in hist) ctx.incomingUncommittedOverride = hist.incomingUncommitted;
    if (hist.c12Stated) ctx.c12Stated = hist.c12Stated;
  }
  return ctx;
}

// ================= subcommands
function cmdBegin(a) {
  if (!a.agent || !a.handoff) die('begin needs --agent and --handoff');
  const handoff = path.resolve(a.handoff);
  const prev = loadState(handoff);
  const session = a.session || process.env.CLAUDE_CODE_SESSION_ID || (a.transcript ? path.basename(a.transcript, '.jsonl') : null);
  if (!session) die('no session id (CLAUDE_CODE_SESSION_ID unset; pass --session)');
  const t = a.transcript ? path.resolve(a.transcript) : findTranscript(session);
  if (!t) die(`no transcript for session ${session}`);
  const n = readLines(t).length;
  let s;
  if (prev) { s = prev; if (!s.sessions.includes(session)) s.sessions.push(session); s.resumedAt = s.resumedAt || []; s.resumedAt.push({ session, line: n }); }
  else s = { agent: a.agent, handoff, incoming: a.incoming ? path.resolve(a.incoming) : null, sessions: [session], transcript: t, beganAt: n, beganTs: new Date().toISOString(), incomingSha: a.incoming ? shaFile(a.incoming) : null, sweeps: [] };
  if (a.transcript) s.transcript = t;
  saveState(handoff, s);
  const rep = handoff.replace(/\.md$/i, '') + '.packout-report.md';
  console.log(`PREDECESSOR: ${session} · HANDOFF: ${handoff} · REPORT: ${rep}`);
}

function cmdSweep(a) {
  if (!a.handoff) die('sweep needs --handoff');
  const handoff = path.resolve(a.handoff); const s = loadState(handoff); if (!s) die('no packout state: run begin first');
  const t = transcriptFor(a, s); const parsed = parse(t);
  const k = s.sweeps.length + 1;
  const ex = buildExtract(parsed.rows);
  const p = path.join(stateDir(handoff), `sweep-${k}.txt`);
  fs.writeFileSync(p, ex.content);
  fs.writeFileSync(path.join(stateDir(handoff), `actions-${k}.txt`), actionDigest(parsed.calls));
  s.sweeps.push({ k, path: p, N: ex.N, sha: ex.sha, fileSha: sha12(ex.content), createdN: parsed.n });
  saveState(handoff, s);
  console.log(`sweep ${k}: ${p} (${ex.N} lines + marker "${ex.marker}"). Read it with the Read tool to its marker (line ${ex.N + 1}).`);
  console.log(`actions: ${path.join(stateDir(handoff), `actions-${k}.txt`)}`);
}

function liveCheck(a, { boundN, stateOverride } = {}) {
  const handoff = path.resolve(a.handoff); const s = stateOverride || loadState(handoff); if (!s) die('no packout state: run begin first');
  const t = transcriptFor(a, s); const parsed = parse(t, { to: boundN });
  const sweeps = s.sweeps.map((w) => ({ ...w, content: readOrNull(w.path) })).filter((w) => w.content != null && sha12(w.content) === w.fileSha);
  const findings = handoff.replace(/\.md$/i, '') + '.fresh-eyes.md';
  const ctx = buildCtx({ parsed, from: s.beganAt, agent: s.agent, handoff, handoffText: readOrNull(handoff), incoming: s.incoming, incomingText: s.incoming ? readOrNull(s.incoming) : null, findings, findingsText: readOrNull(findings), sweeps });
  const lines = runAll(ctx);
  const h = hashFirst(t, parsed.n);
  const notes = [];
  if (s.sessions.length > 1) notes.push(`session chain ${s.sessions.join(' → ')}; checks ran on the newest transcript only (earlier links are not evaluated in step 1)`);
  if (s.sweeps.length !== sweeps.length) notes.push(`${s.sweeps.length - sweeps.length} recorded sweep extract(s) missing or changed on disk; not counted`);
  const meta = { agent: s.agent, transcript: t, session: s.sessions[s.sessions.length - 1], n: h.n, sha: h.sha, handoff, handoffSha: shaFile(handoff), from: s.beganAt, notes, state: s, machine: os.hostname() };
  return { lines, meta };
}

function cmdCheck(a) {
  if (a.historical) return cmdHistorical(a);
  if (!a.handoff) die('check needs --handoff');
  const { lines, meta } = liveCheck(a);
  const out = a.out || path.resolve(a.handoff).replace(/\.md$/i, '') + '.packout-report.md';
  const r = report(lines, meta, out);
  printLines(lines);
  console.log(`SUMMARY\t${r.fails} FAIL, ${r.opens} OPEN, ${lines.length - r.fails - r.opens} PASS\treport: ${out}`);
  process.exit(r.fails ? 1 : 0);
}

function cmdHistorical(a) {
  for (const k of ['transcript', 'to', 'from', 'agent', 'handoff', 'final']) if (!a[k]) die(`--historical needs --${k}`);
  const parsed = parse(path.resolve(a.transcript), { to: +a.to });
  const hist = a.hist ? JSON.parse(fs.readFileSync(a.hist, 'utf8')) : null;
  const ctx = buildCtx({ parsed, from: +a.from, agent: a.agent, handoff: a.handoff, handoffText: readOrNull(a.final), incoming: a.incoming || null, incomingText: a['incoming-file'] ? readOrNull(a['incoming-file']) : null, findings: a.findings || null, findingsText: a['findings-file'] ? readOrNull(a['findings-file']) : null, sweeps: historicalSweeps(parsed.calls), historical: true, hist });
  if (!ctx.findings) ctx.findings = null;
  const lines = runAll(ctx);
  const h = hashFirst(path.resolve(a.transcript), +a.to);
  const meta = { historical: true, agent: a.agent, transcript: path.resolve(a.transcript), n: h.n, sha: h.sha, handoff: a.handoff, handoffSha: shaFile(a.final), from: +a.from, notes: ['historical mode: no begin, no owned sweeps; extract lengths only from Read totalLines; OPEN is never PASS'] };
  const r = report(lines, meta, a.out || null);
  printLines(lines);
  console.log(`SUMMARY\t${r.fails} FAIL, ${r.opens} OPEN, ${lines.length - r.fails - r.opens} PASS\t(transcript lines 1..${h.n}, sha ${h.sha}, from ${a.from})`);
  process.exit(r.fails ? 1 : 0);
}

// verify (ruling ⓹): re-hash lines 1..N; FAIL on any change. Re-run check bounded at N on this machine; compare verdicts.
// C8 is re-judged against the handoff as it stands NOW, so an edit after the PASS changes the verdict and fails verify.
// Cross-machine (the transcript isn't here): downgrade to the report's hashes, and say so.
function cmdVerify(a) {
  if (!a.report) die('verify needs --report');
  const txt = readOrNull(a.report); if (txt == null) die(`report not readable: ${a.report}`, 1);
  const m = /```json\n([\s\S]*?)\n```/.exec(txt); if (!m) { console.log('VERIFY FAIL\tthe report carries no machine block'); process.exit(1); }
  const meta = JSON.parse(m[1]);
  const problems = [];
  if (fs.existsSync(meta.transcript)) {
    const h = hashFirst(meta.transcript, meta.n);
    if (h.n !== meta.n || h.sha !== meta.sha) {
      console.log(`VERIFY FAIL\tthe transcript's first ${meta.n} lines changed since the check (sha ${meta.sha} at check, ${h.sha} now; ${h.n} lines): the report no longer describes this transcript`);
      process.exit(1);
    }
    const { lines } = liveCheck({ handoff: meta.handoff, transcript: meta.transcript }, { boundN: meta.n, stateOverride: meta.state });
    for (const r of lines) if (meta.verdicts[r.id] !== r.verdict) problems.push(`${r.id}: report says ${meta.verdicts[r.id]}, re-run says ${r.verdict} (${r.evidence})`);
    if (Object.values(meta.verdicts).includes('FAIL')) problems.push('the report itself carries a FAIL');
    if (problems.length) { console.log(`VERIFY FAIL\t${problems.join(' · ')}`); process.exit(1); }
    console.log(`VERIFY PASS\tsame machine: transcript 1..${meta.n} sha ${meta.sha} unchanged; ${lines.length} verdicts re-derived and equal; the handoff now equals what the predecessor last read (C8)`);
    process.exit(0);
  }
  const now = shaFile(meta.handoff);
  if (now !== meta.handoffSha) problems.push(`the handoff changed since the check (sha ${meta.handoffSha} at check, ${now} now)`);
  if (Object.values(meta.verdicts).includes('FAIL')) problems.push('the report itself carries a FAIL');
  if (problems.length) { console.log(`VERIFY FAIL (cross-machine, downgraded)\t${problems.join(' · ')}`); process.exit(1); }
  console.log(`VERIFY DOWNGRADED (cross-machine)\tthe predecessor's transcript is not on this machine; checked only the report's hashes (handoff sha ${now} unchanged; no FAIL). Say so in your Report #0.`);
  process.exit(0);
}

const a = args(process.argv.slice(2));
const sub = a._[0];
if (sub === 'begin') cmdBegin(a);
else if (sub === 'sweep') cmdSweep(a);
else if (sub === 'check') cmdCheck(a);
else if (sub === 'verify') cmdVerify(a);
else die('usage: packout.mjs begin|sweep|check|verify … (see the header of this file)');

export { uncommittedList, MARKER_RE, crypto };

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
