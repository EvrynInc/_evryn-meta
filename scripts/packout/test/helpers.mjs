// helpers.mjs — synthetic transcripts and a throwaway code root for packout.mjs's tests. Node built-ins only; no network.
// Truncation check: the last line of this file should read FULL FILE LOADED.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const PACKOUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'packout.mjs');
let seq = 0;
const ts = () => new Date(Date.UTC(2026, 10, 19, 20, 0, seq++)).toISOString();

/** A transcript under construction. Every add returns the row's 1-based line (the tool_use row for a call). */
export class Tx {
  constructor(file) { this.file = file; this.rows = []; this.n = 0; }
  push(o) { this.rows.push(JSON.stringify(o)); return this.rows.length; }
  flush() { fs.writeFileSync(this.file, this.rows.map((r) => r + '\n').join('')); return this; }
  user(text) { return this.push({ type: 'user', timestamp: ts(), uuid: 'u' + seq, message: { role: 'user', content: text } }); }
  say(text) { return this.push({ type: 'assistant', timestamp: ts(), message: { id: 'm' + seq, role: 'assistant', content: [{ type: 'text', text }] } }); }
  call(name, input, resultText, { tur, err, dup } = {}) {
    const id = 'toolu_' + (++this.n) + '_' + seq;
    const use = { type: 'assistant', timestamp: ts(), message: { id: 'm' + seq, role: 'assistant', content: [{ type: 'tool_use', id, name, input }] } };
    const at = this.push(use);
    if (dup) this.push(use); // the same call written on a second transcript line
    const res = { type: 'user', timestamp: ts(), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: resultText, ...(err ? { is_error: true } : {}) }] } };
    if (tur) res.toolUseResult = tur;
    this.push(res);
    return at;
  }
  /** A Read of the file's current content, lines a..b (1-based, inclusive; default whole), as the Read tool returns it. */
  read(p, { a = 1, b, text, dup } = {}) {
    const content = (text ?? fs.readFileSync(p, 'utf8')).replace(/\r\n/g, '\n');
    const all = content.split('\n');
    const end = Math.min(b ?? all.length, all.length);
    const win = all.slice(a - 1, end);
    const numbered = win.map((l, i) => `${a + i}\t${l}`).join('\n');
    return this.call('Read', { file_path: p }, numbered, { dup, tur: { type: 'text', file: { filePath: p, content: win.join('\n'), numLines: win.length, startLine: a, totalLines: all.length } } });
  }
  edit(p, oldS, newS) { const t = fs.readFileSync(p, 'utf8'); fs.writeFileSync(p, t.replace(oldS, newS)); return this.call('Edit', { file_path: p, old_string: oldS, new_string: newS }, 'ok'); }
  write(p, content) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); return this.call('Write', { file_path: p, content }, 'ok'); }
  bash(command, out = '') { return this.call('Bash', { command }, out); }
  agent(description, agentId) { return this.call('Agent', { description, subagent_type: 'claude', prompt: 'x' }, `done. agentId: ${agentId}`); }
  compact() { return this.push({ type: 'system', subtype: 'compact_boundary', timestamp: ts() }); }
  /** Replace rows in place with a harmless text row, so line numbers do not shift (deleting the deciding line). */
  blank(lines) { for (const n of [].concat(lines)) this.rows[n - 1] = JSON.stringify({ type: 'assistant', timestamp: ts(), message: { id: 'blank' + n, role: 'assistant', content: [{ type: 'text', text: '(removed)' }] } }); return this; }
  drop(lines) { const s = new Set(lines); this.rows = this.rows.filter((_, i) => !s.has(i + 1)); return this; }
}

// SEALED-EXEC: followed 2026-11-19 — `git` is the system git on disk; used only on a throwaway repo in the OS temp folder.
export const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

/** A throwaway code root: evryn-team-workspace (a git repo) with memory, current-state, topsheet and near-zero files. */
export function codeRoot(agent = 'soren') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'packout-test-'));
  const tw = path.join(root, 'evryn-team-workspace');
  const f = {
    // the transcript sits where verify finds it BY SESSION (N1): <PACKOUT_PROJECTS_DIR>/<project>/<session>.jsonl
    root, tw, state: path.join(root, 'state'), transcript: path.join(root, 'projects', 'proj', 'testsess.jsonl'),
    memory: path.join(tw, '.claude', 'agent-memory', agent, 'MEMORY.md'),
    cs: path.join(tw, 'shared', 'current-state', 'current-state.md'),
    top: path.join(tw, 'shared', 'projects', 'product', `${agent}-topsheet.md`),
    nz: path.join(tw, 'shared', 'projects', 'helm', '2026', '2026.10.19-consolidation-standup-near-zero-campaign.md'),
    handoff: path.join(tw, 'shared', 'handoff-out.md'),
    incoming: path.join(tw, 'shared', 'handoff-in.md'),
  };
  fs.mkdirSync(path.dirname(f.transcript), { recursive: true });
  for (const p of [f.memory, f.cs, f.top, f.nz]) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, '# file\n\nTruncation canary — DO NOT REMOVE: FULL FILE LOADED\n'); }
  fs.writeFileSync(f.incoming, '# Incoming handoff\n\n## Uncommitted\n\n`shared/carried.md`\n\nTruncation canary — DO NOT REMOVE: FULL FILE LOADED\n');
  fs.writeFileSync(path.join(tw, 'shared', 'carried.md'), 'carried\n');
  git(tw, 'init', '-q'); git(tw, 'config', 'user.email', 't@t'); git(tw, 'config', 'user.name', 't'); git(tw, 'add', '-A'); git(tw, 'commit', '-qm', 'base');
  return f;
}

/** Run packout.mjs. SEALED-EXEC: followed 2026-11-19 — process.execPath is the node binary already running this test. */
export function run(f, ...argv) {
  const r = spawnSync(process.execPath, [PACKOUT, ...argv], { encoding: 'utf8', env: { ...process.env, PACKOUT_STATE_DIR: f.state, PACKOUT_CODE_ROOT: f.root, PACKOUT_PROJECTS_DIR: path.join(f.root, 'projects'), CLAUDE_CODE_SESSION_ID: 'testsess' } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
export const verdicts = (out) => Object.fromEntries([...out.matchAll(/^(PASS|FAIL|OPEN)\t(C\d+)\t(.*)$/gm)].map((m) => [m[2], { v: m[1], e: m[3] }]));

/**
 * The GOOD packout, built step by step against the real CLI: every check should PASS.
 * Returns { f, tx, L } where L names the deciding transcript line of each step, for mutation tests.
 */
export function goodPackout({ agent = 'soren', shortSweeps = false, bashSweeps = false, earlySweep2 = false, lagBegin = false, lagSweep = false } = {}) {
  const NL = String.fromCharCode(10), TAB = String.fromCharCode(9);
  const readSweep = (tx, p) => {
    const lines = fs.readFileSync(p, 'utf8').split(NL);
    const N = lines.length - 2; // body lines; line N+1 is the marker; the last element is the empty line after the final newline
    if (bashSweeps) return tx.bash(`sed -n '1,9999p' ${p}`, lines.map((l, i) => (i + 1) + TAB + l).join(NL));
    return shortSweeps ? tx.read(p, { a: 1, b: N }) : tx.read(p);
  };
  const f = codeRoot(agent);
  const tx = new Tx(f.transcript);
  const L = {};
  tx.user('start line: do the work, then pack out');
  tx.say('Working.');
  L.agent = tx.agent('Fresh-eyes reader', 'a1b2c3d4e5f6a7b8');
  tx.flush();
  let r = run(f, 'begin', '--agent', agent, '--handoff', f.handoff, '--incoming', f.incoming, '--transcript', f.transcript);
  if (r.code !== 0) throw new Error('begin failed: ' + r.err);
  // lagBegin (F-AC2): the run-time line count is taken BEFORE a write made earlier in the same turn; the begin call's own row
  // lands after that write. Anchored to its own row, begin must not count that write as "after begin".
  if (lagBegin) L.memory = tx.edit(f.memory, '# file', '# file\n\nnote');
  // typed with a shell variable, as seats do: the transcript keeps `$I` literally; begin's own BEGIN-ARGS line resolves it
  L.begin = tx.bash(`I=${f.incoming.replace(/\\/g, '/')}; node packout.mjs begin --agent ${agent} --handoff ${f.handoff} --incoming $I`, r.out);
  if (!lagBegin) L.memory = tx.edit(f.memory, '# file', '# file\n\nnote');
  L.cs = tx.bash(`node _evryn-meta/scripts/append-entry.mjs ${f.cs.replace(/\\/g, '/')} entry.md`, ''); fs.appendFileSync(f.cs, 'x\n');
  L.top = tx.edit(f.top, '# file', '# file\nrow');
  L.task = tx.bash('node scripts/tasks/tasks.mjs update T-1 --note "done"', '');
  L.nz = tx.edit(f.nz, '# file', '# file\n| row |');
  L.incomingRead = tx.read(f.incoming);
  tx.flush();
  r = run(f, 'sweep', '--handoff', f.handoff, '--transcript', f.transcript); if (r.code !== 0) throw new Error('sweep1: ' + r.err);
  const s1 = r.out.match(/sweep 1: (.*?) \(/)[1];
  L.sweep1 = tx.bash('node packout.mjs sweep', r.out);
  L.sweep1Read = readSweep(tx, s1);
  const writeHandoff = () => { L.handoffWrite = tx.write(f.handoff, `# Outgoing handoff\n\nSubagent a1b2c3d4 (the fresh reader).\n\n## Uncommitted\n\n\`shared/handoff-out.md\`\n\`shared/carried.md\`\n\nTruncation canary — DO NOT REMOVE: FULL FILE LOADED\n`); tx.flush(); };
  // lagSweep (F-AC1): the handoff Write and sweep 2 run in ONE turn, and the transcript has not yet reached the Write when the
  // sweep script runs: its run-time count understates. The sweep call's own row lands after the Write.
  if (!earlySweep2 && !lagSweep) writeHandoff();
  tx.flush();
  r = run(f, 'sweep', '--handoff', f.handoff, '--transcript', f.transcript); if (r.code !== 0) throw new Error('sweep2: ' + r.err);
  if (lagSweep) writeHandoff();
  const s2 = r.out.match(/sweep 2: (.*?) \(/)[1];
  L.sweep2 = tx.bash('node packout.mjs sweep', r.out);
  L.sweep2Read = readSweep(tx, s2);
  if (earlySweep2) writeHandoff(); // both sweeps BEFORE the handoff's first write: the second cannot count for C5
  const fe = f.handoff.replace(/\.md$/, '.fresh-eyes.md');
  fs.writeFileSync(fe, '# Findings\n\nnone\n\nTruncation canary — DO NOT REMOVE: FULL FILE LOADED\n'); // written by ANOTHER session: no call here
  L.findingsRead = tx.read(fe);
  L.handoffRead = tx.read(f.handoff);
  tx.flush();
  // commit what this session wrote, except the handoff (listed under ## Uncommitted)
  git(f.tw, 'add', '.claude', 'shared/current-state', 'shared/projects'); git(f.tw, 'commit', '-qm', 'seat');
  return { f, tx, L, s1, s2, fe };
}

export const check = (f) => run(f, 'check', '--handoff', f.handoff, '--transcript', f.transcript);
/** Run check AND write its own Bash row into the transcript, as a real seat's would be (verify anchors on that row: N9). */
export function checkRecorded(g, { before } = {}) {
  const r = check(g.f);
  if (before) before(); // rows that land after check counted its lines but before check's own row (the same-turn lag)
  g.tx.bash(`node packout.mjs check --handoff ${g.f.handoff}`, r.out); g.tx.flush();
  return r;
}
export const verify = (g, rep, ...extra) => run(g.f, 'verify', '--report', rep, '--predecessor', 'testsess', '--handoff', g.f.handoff, ...extra);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
