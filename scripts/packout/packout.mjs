#!/usr/bin/env node
// packout.mjs — the packout guard, step 1: begin · sweep · check (live, or --historical) · verify. Build brief §3.1–§3.3.
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// USAGE (run by hand by the outgoing seat; its successor runs verify)
//   node _evryn-meta/scripts/packout/packout.mjs begin  --agent <name> --handoff <path> [--incoming <path>]
//   node _evryn-meta/scripts/packout/packout.mjs sweep  --handoff <path>
//   node _evryn-meta/scripts/packout/packout.mjs check  --handoff <path>                      (writes <handoff-stem>.packout-report.md)
//   node _evryn-meta/scripts/packout/packout.mjs verify --report <path> --predecessor <session> --handoff <path>   (both from the footer)
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
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse, hashFirst, sha12, normPath, winPath, readLines } from './lib/transcript.mjs';
import { buildExtract, actionDigest } from './lib/sweep.mjs';
import { runAll, stripHeredocs, runsPackout, C10, C11 } from './lib/checks.mjs';

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

const projectDirs = () => { try { return fs.readdirSync(PROJECTS).map((d) => path.join(PROJECTS, d)).filter((d) => fs.statSync(d).isDirectory()); } catch { return []; } };
/** Every transcript for a session id (prefix): top-level, or a subagent's. More than one hit is AMBIGUOUS, never "absent" (Q3-2). */
function transcriptHits(session) {
  if (!session) return [];
  const hits = [];
  for (const d of projectDirs()) for (const f of fs.readdirSync(d)) {
    if (f.endsWith('.jsonl') && f.startsWith(session)) hits.push(path.join(d, f));
    // a subagent's transcript lives at <project>/<parent-session>/subagents/agent-<agentId>.jsonl
    const sub = path.join(d, f, 'subagents', `agent-${session}.jsonl`);
    if (!f.endsWith('.jsonl') && fs.existsSync(sub)) hits.push(sub);
  }
  return hits;
}
function findTranscript(session) { const hits = transcriptHits(session); return hits.length === 1 ? hits[0] : null; }

/** Q3-2: every `packout.mjs begin` row, in ANY transcript on this machine (top-level and subagent), whose footer names this
 *  handoff. verify may downgrade only when this is empty: the seat writes the report's session and the footer's PREDECESSOR,
 *  so a session id that matches nothing here proves nothing; a begin row naming the handoff proves this is the same machine.
 *  Deliberately BROADER than the begin anchor (the command test is the strict one OR the old loose one), because this list
 *  can only refuse a downgrade, never earn a PASS. Cost: a byte search for the footer token before any parse (measured
 *  2026-11-20 on this laptop: 650 transcripts, 2.2 GB, ~1.6 s; 15 files carry the token). Never consults state.json. */
function beginsNaming(handoff) {
  const want = normPath(handoff); const token = Buffer.from('PREDECESSOR: '); const found = [];
  const files = [];
  for (const d of projectDirs()) for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (f.endsWith('.jsonl')) { files.push(p); continue; }
    let subs = []; try { subs = fs.readdirSync(path.join(p, 'subagents')); } catch {}
    for (const s of subs) if (s.endsWith('.jsonl')) files.push(path.join(p, 'subagents', s));
  }
  for (const file of files) {
    let buf; try { buf = fs.readFileSync(file); } catch { continue; }
    if (buf.indexOf(token) < 0) continue;
    for (const k of parse(file).calls) {
      if (!k.ok || k.name !== 'Bash') continue;
      const cmd = String(k.input.command || '');
      if (runsPackout(cmd, ['begin']) !== 'begin' && !/packout\.mjs["']?\s+begin\b/.test(stripHeredocs(cmd))) continue;
      const m = String(k.text || '').match(/PREDECESSOR: (\S+) · HANDOFF: (.+?) · REPORT:/);
      if (m && normPath(m[2].trim()) === want) found.push(`${file} line ${k.n} (session ${m[1]})`);
    }
  }
  return found;
}
function transcriptFor(a, s) {
  if (a.transcript) return path.resolve(winPath(a.transcript));
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
/** Fix trip 3b (Captain's ⓼ (a), 11/20): is the file's NEWEST commit no earlier than `ms` (this session's last write to it)?
 *  true / false; null when its repo can't be found or git fails (the caller then FAILs, as before). Commit times are whole
 *  seconds, so the write is floored to its second. One `git log` per written file (measured on Soren 2's real report: see DC2). */
function committedAfter(p, ms) {
  const abs = path.isAbsolute(p) ? p : path.join(CODE, p);
  const root = rootOf(abs); if (!root) return null;
  const o = gitOut(root, ['log', '-1', '--format=%ct', '--', abs]);
  if (o == null) return null;
  const ct = parseInt(o.trim(), 10);
  return Number.isFinite(ct) ? ct >= Math.floor(ms / 1000) : false; // no commit at all: not committed
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
  // One extraction per command SEGMENT (split on ; && || newline) that runs session-text.mjs and redirects it; heredoc
  // bodies are removed first (am3 1109 wrote a file whose heredoc text quoted such a command). pm 790 ran `--help | head`
  // and then the real extraction in one command: only a pipe INSIDE the extracting segment marks it filtered.
  const ext = [];
  calls.forEach((k) => {
    if (!k.ok || k.name !== 'Bash') return;
    const cmd = stripHeredocs(String(k.input.command || ''));
    // variable assignments, quoted or not (Lucas am's 20:40 re-extraction used S=<path> unquoted, and was missed by the prototype)
    const vars = Object.fromEntries([...cmd.matchAll(/(?:^|[\s;&])([A-Za-z_][A-Za-z0-9_]*)=(?:"([^"]*)"|'([^']*)'|([^\s;&|]+))/g)].map((x) => [x[1], x[2] ?? x[3] ?? x[4]]));
    for (const segRaw of cmd.split(/;|&&|\|\||\n/)) {
      const at = segRaw.indexOf('session-text.mjs'); if (at < 0) continue;
      const seg = segRaw.slice(at);
      const m = seg.match(/(?:^|[^0-9&])>\s*("[^"]+"|'[^']+'|[^\s;&|]+)/); if (!m) continue;
      const file = m[1].replace(/^["']|["']$/g, '').replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (_, v) => vars[v] ?? `$${v}`);
      if (!/\.txt$/i.test(file)) continue;
      ext.push({ k, file, filtered: seg.slice(0, seg.indexOf(m[0])).includes('|') });
    }
  });
  ext.forEach((x, idx) => {
    const b = path.basename(x.file).toLowerCase();
    const next = ext.slice(idx + 1).find((y) => path.basename(y.file).toLowerCase() === b);
    const until = next ? next.k.n : Infinity;
    const reads = calls.filter((j) => j.n > x.k.n && j.n < until && j.ok && j.name === 'Read' && j.win && path.basename(String(j.input.file_path)).toLowerCase() === b);
    const tot = reads.map((j) => j.win.total).find((t) => Number.isInteger(t));
    // N = the Read tool's totalLines, strictly: session-text ends with a newline, so its last numbered line is empty, and a
    // full Read returns it. No line of tolerance is given (the prototype's ±2 is what step 1 removes).
    out.push({ path: x.file, base: b, createdN: x.k.n, filtered: x.filtered, content: null, nKnown: Number.isInteger(tot), N: Number.isInteger(tot) ? tot : null, until });
  });
  return out;
}

function buildCtx({ parsed, from, agent, handoff, handoffText, incoming, incomingText, findings, findingsText, sweeps, historical, hist }) {
  const prof = profileFor(agent);
  const ctx = { ...prof, calls: parsed.calls, compactions: parsed.compactions, from, agent, handoff, handoffText, incoming, incomingText, findings, findingsText, sweeps, historical: !!historical, rootOf, isCommitted, committedAfter };
  if (hist) {
    if ('uncommitted' in hist) ctx.uncommittedOverride = hist.uncommitted;
    if ('incomingUncommitted' in hist) ctx.incomingUncommittedOverride = hist.incomingUncommitted;
    if (hist.c12Stated) ctx.c12Stated = hist.c12Stated;
    if (hist.c2Stated) ctx.c2Stated = hist.c2Stated;
    if (hist.c8Order) ctx.c8Order = true;
    if (hist.c7SameFile) ctx.c7SameFile = true;
  }
  return ctx;
}

// ---- ANCHORS (F-AC1, F-AC2, F2): every mark comes from the command's OWN tool_use row in the transcript, never from a line
// count taken while the script runs. A top-level transcript lags inside an assistant turn (AC-PG measured: sweep 1's run-time
// count was 1140 while its own call sat at 1142), so a run-time count can land BEFORE calls made earlier in the same turn.
// The row of `packout.mjs begin` is identified by its result's footer naming this handoff; each sweep by its result naming
// the extract's path. Agent and incoming come from that begin call's own arguments, in the transcript, never from a report.
// Q3-1 (c): a row anchors only when one of its command segments actually RUNS `node <…>packout.mjs begin|sweep`
// (runsPackout); an `echo` whose text merely contains "packout.mjs sweep" does not. (The old text-only test survives only in
// beginsNaming's refusal-only scan above.)
export function anchors(calls, handoff) {
  const want = normPath(handoff);
  let begin = null; const sweeps = new Map();
  for (const k of calls) {
    if (!k.ok || k.name !== 'Bash') continue;
    const cmd = stripHeredocs(String(k.input.command || ''));
    const sub = runsPackout(cmd, ['begin', 'sweep']); if (!sub) continue;
    const out = String(k.text || '');
    if (sub === 'begin') {
      const f = out.match(/PREDECESSOR: (\S+) · HANDOFF: (.+?) · REPORT:/);
      if (!f || normPath(f[2].trim()) !== want) continue;
      // The resolved arguments come from begin's own second output line (BEGIN-ARGS), never from re-parsing the command:
      // the transcript stores the command as typed, so `--incoming $R/in.md` would read as a literal "$R" (real-path run, 18:41).
      const ba = out.match(/^BEGIN-ARGS: agent=(.*?) · incoming=(.*)$/m);
      if (!begin && ba) begin = { n: k.n, ts: k.ts, session: f[1], agent: ba[1].trim(), incoming: ba[2].trim() === '-' ? null : ba[2].trim() };
    } else {
      const s = out.match(/sweep (\d+): (.+?) \((\d+) lines \+ marker/);
      if (s && !sweeps.has(normPath(s[2]))) sweeps.set(normPath(s[2]), { n: k.n, k: +s[1] });
    }
  }
  return { begin, sweeps };
}

// ================= subcommands
function cmdBegin(a) {
  if (!a.agent || !a.handoff) die('begin needs --agent and --handoff');
  const handoff = path.resolve(winPath(a.handoff));
  const prev = loadState(handoff);
  const session = a.session || process.env.CLAUDE_CODE_SESSION_ID || (a.transcript ? path.basename(a.transcript, '.jsonl') : null);
  if (!session) die('no session id (CLAUDE_CODE_SESSION_ID unset; pass --session)');
  const t = a.transcript ? path.resolve(winPath(a.transcript)) : findTranscript(session);
  if (!t) die(`no transcript for session ${session}`);
  let s;
  if (prev) {
    // F8: a second begin from a DIFFERENT session must say it is a resume; it then joins the chain with its own transcript.
    if (!prev.sessions.includes(session) && !a.resume) die(`REFUSED: a packout for this handoff already began in session ${prev.sessions.join(' → ')}; pass --resume to add session ${session} to its chain`, 1);
    // N13: a second begin may not silently change what the packout is judged as (QC2 P13: an added --incoming was ignored,
    // leaving C7 an unearned "no incoming" PASS). Refuse, naming both values.
    const inc = a.incoming ? path.resolve(winPath(a.incoming)) : null;
    if (a.agent !== prev.agent) die(`REFUSED: this packout began with --agent ${prev.agent}; this begin says --agent ${a.agent}`, 1);
    if (normPath(inc || '') !== normPath(prev.incoming || '')) die(`REFUSED: this packout began with --incoming ${prev.incoming || '(none)'}; this begin says --incoming ${inc || '(none)'}`, 1);
    s = prev; if (!s.sessions.includes(session)) s.sessions.push(session);
    s.transcripts = s.transcripts || {}; s.transcripts[session] = t; s.transcript = t;
  } else s = { agent: a.agent, handoff, incoming: a.incoming ? path.resolve(winPath(a.incoming)) : null, sessions: [session], transcripts: { [session]: t }, transcript: t, beganAtRun: readLines(t).length, beganTs: new Date().toISOString(), incomingSha: a.incoming ? shaFile(path.resolve(winPath(a.incoming))) : null, sweeps: [] };
  saveState(handoff, s);
  const rep = handoff.replace(/\.md$/i, '') + '.packout-report.md';
  console.log(`PREDECESSOR: ${session} · HANDOFF: ${handoff} · REPORT: ${rep}`);
  console.log(`BEGIN-ARGS: agent=${s.agent} · incoming=${s.incoming || '-'}`);
}

function cmdSweep(a) {
  if (!a.handoff) die('sweep needs --handoff');
  const handoff = path.resolve(winPath(a.handoff)); const s = loadState(handoff); if (!s) die('no packout state: run begin first');
  const t = transcriptFor(a, s); const parsed = parse(t);
  const ex = buildExtract(parsed.rows);
  // F3: an extract with no user or assistant turn is the wrong transcript (or a subagent's, whose rows are all sidechain).
  const turns = (ex.content.match(/^===== (user|assistant)\b/gm) || []).length;
  if (!turns) die(`REFUSED: the extract from ${t} has no user or assistant turn (wrong session, or a subagent's sidechain transcript); nothing recorded`, 1);
  const k = s.sweeps.length + 1;
  const p = path.join(stateDir(handoff), `sweep-${k}.txt`);
  fs.writeFileSync(p, ex.content);
  fs.writeFileSync(path.join(stateDir(handoff), `actions-${k}.txt`), actionDigest(parsed.calls));
  const session = a.session || process.env.CLAUDE_CODE_SESSION_ID || null;
  s.sweeps.push({ k, path: p, N: ex.N, sha: ex.sha, fileSha: sha12(ex.content), turns, transcript: t, session, ranAtLine: parsed.n });
  saveState(handoff, s);
  console.log(`sweep ${k}: ${p} (${ex.N} lines + marker "${ex.marker}"). Read it with the Read tool to its marker (line ${ex.N + 1}).`);
  console.log(`actions: ${path.join(stateDir(handoff), `actions-${k}.txt`)}`);
}

/** Judge a live packout. State supplies only the extract files' paths and hashes; every position comes from the transcript. */
function liveCheck(a, { boundN, forVerify } = {}) {
  const handoff = path.resolve(winPath(a.handoff));
  const s = loadState(handoff);
  // N15 (a): a successor is told the PREDECESSOR's state is missing here, not to "run begin"
  if (!s) forVerify ? (console.log(`VERIFY FAIL\tthe predecessor's packout state for ${handoff} is missing on this machine (${statePath(handoff)}); its sweep extracts cannot be checked`), process.exit(1)) : die('no packout state: run begin first');
  const t = transcriptFor(a, s); const parsed = parse(t, { to: boundN });
  const an = anchors(parsed.calls, handoff);
  const notes = [];
  if (!an.begin) die(`no \`packout.mjs begin\` call for ${handoff} in ${t}: nothing can be anchored`, 1);
  const sweeps = [];
  for (const w of s.sweeps) {
    const content = readOrNull(w.path); const at = an.sweeps.get(normPath(w.path));
    if (content == null || sha12(content) !== w.fileSha) { notes.push(`sweep ${w.k}: extract missing or changed on disk; not counted`); continue; }
    if (!at) { notes.push(`sweep ${w.k}: no \`packout.mjs sweep\` call producing it in this transcript; not counted`); continue; }
    if (w.transcript && normPath(w.transcript) !== normPath(t)) { notes.push(`sweep ${w.k}: made from another transcript (${w.transcript}); not counted`); continue; }
    if (!w.turns) { notes.push(`sweep ${w.k}: empty extract; not counted`); continue; }
    sweeps.push({ ...w, content, createdN: at.n });
  }
  const findings = handoff.replace(/\.md$/i, '') + '.fresh-eyes.md';
  const agent = an.begin.agent || s.agent;
  const incoming = an.begin.incoming ? path.resolve(winPath(an.begin.incoming)) : null;
  const ctx = buildCtx({ parsed, from: an.begin.n, agent, handoff, handoffText: readOrNull(handoff), incoming, incomingText: incoming ? readOrNull(incoming) : null, findings, findingsText: readOrNull(findings), sweeps });
  ctx.findingsMtime = (() => { try { return fs.statSync(findings).mtimeMs; } catch { return null; } })();
  const lines = runAll(ctx);
  const h = hashFirst(t, parsed.n);
  if (s.sessions.length > 1) notes.push(`session chain ${s.sessions.join(' → ')}; checks ran on the newest transcript only (earlier links are not evaluated in step 1)`);
  const meta = { agent, transcript: t, session: an.begin.session, n: h.n, sha: h.sha, handoff, handoffSha: shaFile(handoff), from: an.begin.n, incoming, notes, machine: os.hostname() };
  return { lines, meta, ctx };
}

function cmdCheck(a) {
  if (a.historical) return cmdHistorical(a);
  if (!a.handoff) die('check needs --handoff');
  const { lines, meta } = liveCheck(a);
  const out = a.out || path.resolve(winPath(a.handoff)).replace(/\.md$/i, '') + '.packout-report.md';
  // Q3-6: print (and write) the RESOLVED path, so `check --out <relative>` can still be bound by verify's report: match
  const outAbs = path.resolve(winPath(out));
  const r = report(lines, meta, outAbs);
  printLines(lines);
  console.log(`SUMMARY\t${r.fails} FAIL, ${r.opens} OPEN, ${lines.length - r.fails - r.opens} PASS\treport: ${outAbs}`);
  process.exit(r.fails ? 1 : 0);
}

function cmdHistorical(a) {
  for (const k of ['transcript', 'to', 'from', 'agent', 'handoff', 'final']) if (!a[k]) die(`--historical needs --${k}`);
  const tp = path.resolve(winPath(a.transcript));
  const parsed = parse(tp, { to: +a.to });
  const hist = a.hist ? JSON.parse(fs.readFileSync(a.hist, 'utf8')) : null;
  const ctx = buildCtx({ parsed, from: +a.from, agent: a.agent, handoff: a.handoff, handoffText: readOrNull(a.final), incoming: a.incoming || null, incomingText: a['incoming-file'] ? readOrNull(a['incoming-file']) : null, findings: a.findings || null, findingsText: a['findings-file'] ? readOrNull(a['findings-file']) : null, sweeps: historicalSweeps(parsed.calls), historical: true, hist });
  const lines = runAll(ctx);
  const h = hashFirst(tp, +a.to);
  const meta = { historical: true, agent: a.agent, transcript: tp, n: h.n, sha: h.sha, handoff: a.handoff, handoffSha: shaFile(a.final), from: +a.from, notes: ['historical mode: no begin, no owned sweeps; extract lengths only from Read totalLines; OPEN is never PASS; C9 timing (mtime) not judged on frozen copies'] };
  const r = report(lines, meta, a.out || null);
  printLines(lines);
  console.log(`SUMMARY\t${r.fails} FAIL, ${r.opens} OPEN, ${lines.length - r.fails - r.opens} PASS\t(transcript lines 1..${h.n}, sha ${h.sha}, from ${a.from})`);
  process.exit(r.fails ? 1 : 0);
}

// verify (ruling ⓹, hardened per QC1 F1/F2 and QC2 N9/N1/N10):
//  - N10: --predecessor and --handoff (the successor's footer) are REQUIRED, and must match the report;
//  - N1: verify finds the predecessor's transcript ITSELF, by session, the way check does; the report's transcript path and
//    machine are hints only. It downgrades only when no transcript for that session exists on this machine;
//  - N9: the report does not choose the bound. verify finds the `packout.mjs check` call whose output names this report and
//    judges at least to that row (so C6/C10 see everything up to check's own row), and judges C11 UNBOUNDED;
//  - nothing else is taken from the report but the claims under test; cross-machine ⇒ DOWNGRADED, exit 3, never 0;
//  - Q3-2 (fix trip 3): a session matching several transcripts FAILs as ambiguous; with none, the downgrade is open only if NO
//    transcript on this machine holds a begin row naming this handoff (beginsNaming); and it still refuses a FAILing report;
//  - Q3-5: C10, like C11, is judged on the whole transcript; C6 stays bounded at check's row.
function cmdVerify(a) {
  if (!a.report) die('verify needs --report');
  if (!a.predecessor || a.predecessor === true || !a.handoff || a.handoff === true) die('verify needs --report, --predecessor and --handoff (the last two from your start line\'s PREDECESSOR footer)');
  const repPath = path.resolve(winPath(a.report));
  const txt = readOrNull(repPath); if (txt == null) die(`report not readable: ${a.report}`, 1);
  const m = /```json\n([\s\S]*?)\n```/.exec(txt); if (!m) { console.log('VERIFY FAIL\tthe report carries no machine block'); process.exit(1); }
  let meta; try { meta = JSON.parse(m[1]); } catch { console.log('VERIFY FAIL\tthe report\'s machine block is not valid JSON'); process.exit(1); }
  const problems = [];
  if (meta.session !== a.predecessor) problems.push(`the report is for session ${meta.session}, the footer names ${a.predecessor}`);
  if (normPath(path.resolve(winPath(a.handoff))) !== normPath(meta.handoff)) problems.push(`the report is for handoff ${meta.handoff}, the footer names ${a.handoff}`);
  if (problems.length) { console.log(`VERIFY FAIL\t${problems.join(' · ')}`); process.exit(1); }
  // Q3-2: an ambiguous lookup is a FAIL, never an absence (a copied transcript must not open the downgrade)
  const hits = transcriptHits(a.predecessor);
  if (hits.length > 1) { console.log(`VERIFY FAIL\tsession ${a.predecessor} is ambiguous on this machine: ${hits.length} transcripts match (${hits.join(' · ')})`); process.exit(1); }
  const t = findTranscript(a.predecessor);
  if (t) {
    const h = hashFirst(t, meta.n);
    if (h.n !== meta.n || h.sha !== meta.sha) {
      console.log(`VERIFY FAIL\tthe transcript's first ${meta.n} lines changed since the check (sha ${meta.sha} at check, ${h.sha} now; ${h.n} lines): the report no longer describes this transcript`);
      process.exit(1);
    }
    // N9: the bound is check's own row, found in the transcript, never the report's n alone
    const full = parse(t);
    const checkRow = full.calls.filter((k) => k.ok && k.name === 'Bash' && /packout\.mjs["']?\s+check\b/.test(stripHeredocs(String(k.input.command || ''))))
      .filter((k) => { const r = String(k.text || '').match(/report: (.+)$/m); return r && normPath(r[1].trim()) === normPath(repPath); }).pop();
    if (!checkRow) { console.log(`VERIFY FAIL\tno \`packout.mjs check\` call in the predecessor's transcript produced this report (${repPath})`); process.exit(1); }
    const bound = Math.max(meta.n, checkRow.n);
    const { lines, meta: now, ctx } = liveCheck({ handoff: meta.handoff, transcript: t }, { boundN: bound, forVerify: true });
    // C11 is judged on the WHOLE transcript: a compaction anywhere before the successor starts means the predecessor compacted
    const i11 = lines.findIndex((r) => r.id === 'C11');
    if (i11 >= 0) lines[i11] = C11({ compactions: full.compactions, calls: full.calls });
    // Q3-5: so is C10 (a file left uncommitted and unlisted after `check` is the ledger's X1). C6 stays bounded at check's row,
    // because the successor's own launch follows `check`.
    const i10 = lines.findIndex((r) => r.id === 'C10');
    if (i10 >= 0) lines[i10] = C10({ ...ctx, calls: full.calls });
    for (const k of ['agent', 'from', 'session']) if (String(now[k]) !== String(meta[k])) problems.push(`the report's ${k} (${meta[k]}) differs from the transcript's (${now[k]})`);
    if (normPath(now.incoming || '') !== normPath(meta.incoming || '')) problems.push(`the report's incoming (${meta.incoming}) differs from the begin call's (${now.incoming})`);
    for (const r of lines) if (meta.verdicts?.[r.id] !== r.verdict) problems.push(`${r.id}: report says ${meta.verdicts?.[r.id]}, re-run says ${r.verdict} (${r.evidence})`);
    if (Object.values(meta.verdicts || {}).includes('FAIL')) problems.push('the report itself carries a FAIL'); // Q3-3: same machine
    if (problems.length) { console.log(`VERIFY FAIL\t${problems.join(' · ')}`); process.exit(1); }
    const hint = normPath(meta.transcript || '') !== normPath(t) ? ` (the report's transcript path ${meta.transcript} differs; the transcript found by session was used)` : '';
    console.log(`VERIFY PASS\tsame machine: transcript ${t} found by session; lines 1..${meta.n} sha ${meta.sha} unchanged; ${lines.length} verdicts re-derived to check's own row ${checkRow.n} (C11 over the whole transcript), and equal${hint}`);
    process.exit(0);
  }
  // Q3-2: no transcript for that session here. Downgrade only if NO transcript here holds a begin row naming this handoff.
  const found = beginsNaming(meta.handoff);
  if (found.length) { console.log(`VERIFY FAIL\tno transcript for session ${a.predecessor} is here, but this machine holds a \`packout.mjs begin\` naming this handoff (${found.join('; ')}): this is the same machine, and the report's session or the footer is wrong`); process.exit(1); }
  if (meta.machine === os.hostname()) { console.log(`VERIFY FAIL\tthe report says it was made on this machine (${meta.machine}), but no transcript for session ${a.predecessor} is here`); process.exit(1); }
  const nowSha = shaFile(meta.handoff);
  if (nowSha !== meta.handoffSha) problems.push(`the handoff changed since the check (sha ${meta.handoffSha} at check, ${nowSha} now)`);
  if (Object.values(meta.verdicts || {}).includes('FAIL')) problems.push('the report itself carries a FAIL'); // Q3-3: downgrade branch
  if (problems.length) { console.log(`VERIFY FAIL (cross-machine, downgraded)\t${problems.join(' · ')}`); process.exit(1); }
  console.log(`VERIFY DOWNGRADED (cross-machine)\tthe report was made on ${meta.machine}; its transcript is not on this machine; checked only the report's hashes (handoff sha ${nowSha} unchanged; no FAIL). NOT a pass: say so in your Report #0.`);
  process.exit(3);
}

// N15 (c): run the CLI only when this file is the program, so `import` of its exports (anchors, profileFor) works
const isMain = !!process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (isMain) {
  const a = args(process.argv.slice(2));
  const sub = a._[0];
  if (sub === 'begin') cmdBegin(a);
  else if (sub === 'sweep') cmdSweep(a);
  else if (sub === 'check') cmdCheck(a);
  else if (sub === 'verify') cmdVerify(a);
  else die('usage: packout.mjs begin|sweep|check|verify … (see the header of this file)');
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
