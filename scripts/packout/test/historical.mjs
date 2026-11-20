#!/usr/bin/env node
// historical.mjs — run packout.mjs check --historical on today's six frozen packouts and set each verdict beside the ledger.
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// NOT part of `node --test`: it needs this laptop's real transcripts and the evryn-team-workspace freeze ref.
//   node scripts/packout/test/historical.mjs [--scratch <dir>]
// For each seat it FIRST hashes the transcript's first `to` lines against the ledger's freeze table and STOPS on a mismatch.
// Frozen files come from `git show refs/audit/2026-11-19-freeze:<path>` (read-only; nothing is checked out).
// Assertions are made only where the manifest cites a ledger line; everything else prints as "ledger silent".

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hashFirst, readLines, parse } from '../lib/transcript.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKOUT = path.resolve(HERE, '..', 'packout.mjs');
const CODE = process.env.PACKOUT_CODE_ROOT || path.resolve(HERE, '..', '..', '..', '..');
const TW = path.join(CODE, 'evryn-team-workspace');
const PROJ = path.join(os.homedir(), '.claude', 'projects', 'c--Users-jbmcg-Evryn-Code-evryn-team-workspace');
const REF = 'refs/audit/2026-11-19-freeze';
const argv = process.argv.slice(2);
const scratch = argv.includes('--scratch') ? argv[argv.indexOf('--scratch') + 1] : fs.mkdtempSync(path.join(os.tmpdir(), 'packout-hist-'));
fs.mkdirSync(scratch, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, 'historical.manifest.json'), 'utf8'));

// SEALED-EXEC: followed 2026-11-19 — `git` is the system git on disk, run with the read-only `show`; it never fetches itself.
const gitShow = (p) => { try { return execFileSync('git', ['-C', TW, 'show', `${REF}:${p}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64e6 }); } catch { return null; } };
const transcriptOf = (id) => { const f = fs.readdirSync(PROJ).find((x) => x.startsWith(id) && x.endsWith('.jsonl')); return f ? path.join(PROJ, f) : null; };
const put = (name, text) => { const p = path.join(scratch, name); fs.writeFileSync(p, text); return p; };

let asserted = 0, agreed = 0, diverged = 0, broken = 0;
const out = [];
for (const s of manifest.seats) {
  const t = transcriptOf(s.session);
  if (!t) { out.push(`## ${s.seat}: transcript ${s.session} NOT FOUND — skipped`); broken++; continue; }
  let to = s.to, pinNote = '';
  if (to === 'pin') { to = readLines(t).length; const h = hashFirst(t, to); pinNote = `not frozen; pinned by AC-PG at ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false })} PT (by its DC1): ${to} lines, sha256(12) ${h.sha}`; }
  const h = hashFirst(t, to);
  if (s.freezeSha && h.sha !== s.freezeSha) { out.push(`## ${s.seat}: EVIDENCE MISMATCH — first ${to} lines hash ${h.sha}, freeze table says ${s.freezeSha}. STOPPED; nothing judged.`); broken++; continue; }
  // files
  const handoffFrozen = gitShow(s.handoff);
  let final = handoffFrozen, finalNote = 'the frozen file';
  if (s.final?.reverseEditOf) {
    const pt = transcriptOf(s.final.reverseEditOf.session);
    const k = parse(pt).calls.find((c) => c.n === s.final.reverseEditOf.line && c.name === 'Edit');
    if (!k || !handoffFrozen || !handoffFrozen.includes(k.input.new_string)) { out.push(`## ${s.seat}: could not reverse ${s.final.reverseEditOf.session} line ${s.final.reverseEditOf.line} — STOPPED`); broken++; continue; }
    final = handoffFrozen.replace(k.input.new_string, k.input.old_string);
    finalNote = `frozen file minus ${s.final.reverseEditOf.session} line ${s.final.reverseEditOf.line}'s Edit (reversed by script)`;
  }
  const args = ['check', '--historical', '--transcript', t, '--to', String(to), '--from', String(s.from), '--agent', s.agent, '--handoff', s.handoff, '--final', put(`${s.session}-final.md`, final)];
  if (s.incoming) { const x = gitShow(s.incoming); if (x != null) args.push('--incoming', s.incoming, '--incoming-file', put(`${s.session}-incoming.md`, x)); }
  if (s.findings) { const x = gitShow(s.findings); args.push('--findings', s.findings); if (x != null) args.push('--findings-file', put(`${s.session}-findings.md`, x)); }
  const hist = { ...(s.hist || {}), ...(s.final?.c8Order ? { c8Order: true } : {}), ...(s.c7SameFile ? { c7SameFile: true } : {}) };
  args.push('--hist', put(`${s.session}-hist.json`, JSON.stringify(hist)), '--out', path.join(scratch, `${s.session}.packout-report.md`));
  // SEALED-EXEC: followed 2026-11-19 — process.execPath is the node binary already running this script.
  const r = spawnSync(process.execPath, [PACKOUT, ...args], { encoding: 'utf8', env: { ...process.env, PACKOUT_CODE_ROOT: CODE } });
  const v = Object.fromEntries([...r.stdout.matchAll(/^(PASS|FAIL|OPEN)\t(C\d+)\t(.*)$/gm)].map((m) => [m[2], { v: m[1], e: m[3] }]));
  out.push(`## ${s.seat} (\`${s.session}\`, lines 1–${to}, from ${s.from})`);
  out.push(`- evidence: ${s.freezeSha ? `first ${to} lines hash ${h.sha} = freeze table ✓` : pinNote}; final = ${finalNote}${s.toDerivation ? `; --to: ${s.toDerivation}` : ''}`);
  out.push('', '| Check | Verdict | Ledger | Agrees? | Evidence |', '|---|---|---|---|---|');
  for (const c of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12']) {
    const got = v[c]; const exp = s.expect?.[c];
    let agree = 'ledger silent', led = '—';
    if (exp) {
      asserted++; led = `${exp[0]} (ledger ${exp[1]})`;
      if (got?.v === exp[0]) { agreed++; agree = exp[2] ? `✓ — ${exp[2]}` : '✓'; if (exp[2] && /divergence/.test(exp[2])) diverged++; }
      else { agree = `✗ MISMATCH (got ${got?.v})`; broken++; }
    }
    out.push(`| ${c} | ${got?.v ?? '?'} | ${led} | ${agree} | ${(got?.e ?? r.stderr.slice(0, 120)).replace(/\|/g, '\\|')} |`);
  }
  out.push('');
}
out.push(`**TOTAL:** ${asserted} ledger-cited assertions, ${agreed} hold (${diverged} of them ruled divergences from the ledger's own words), ${broken} broken (mismatch, evidence stop, or missing input). Reports in ${scratch}.`);
console.log(out.join('\n'));
process.exit(broken ? 1 : 0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
