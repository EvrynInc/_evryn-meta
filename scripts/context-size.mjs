#!/usr/bin/env node
// context-size.mjs — how full an agent's context window is, MEASURED rather than guessed.
//
// Truncation check: the last line of this file should read `FULL FILE LOADED`.
//
// WHY THIS EXISTS
//   Every Claude Code session writes a transcript at ~/.claude/projects/<folder>/<session-id>.jsonl, and every
//   assistant turn in it records the API's own token accounting. The prompt size of the most recent call —
//   input_tokens + cache_creation_input_tokens + cache_read_input_tokens — IS the context the model is holding.
//   Subagents write their own transcripts under <folder>/<session-id>/subagents/agent-<agentId>.jsonl.
//   ⇒ An agent can read its own context size, a conductor can read a subagent's, and an Admiral can read a Captain's.
//   Verified 2026-09-16: this method read 761K for the Admiral's session at the moment Justin's UI showed 761K.
//   Observed 2026-09-11: two sessions compacted with their last call at ~963K–965K on a 1M-token window.
//
// USAGE (runs from any directory)
//   node _evryn-meta/scripts/context-size.mjs                   this session (reads CLAUDE_CODE_SESSION_ID)
//   node _evryn-meta/scripts/context-size.mjs --session <id>    another session; an id prefix is enough
//   node _evryn-meta/scripts/context-size.mjs --agent <agentId> a subagent's own context
//   node _evryn-meta/scripts/context-size.mjs --subagents <id>  every subagent of a session, with its context (an Admiral's view of a Captain's lane)
//   node _evryn-meta/scripts/context-size.mjs --recent [min]    every session active in the last N minutes (default 60)
//   It prints numbers only — never message content.
//
// CAVEATS, so nobody over-reads the number
//   - It is the size at the LAST COMPLETED API call, so it lags the current turn by whatever that turn has added.
//   - A session resumed after a restart can come back under a NEW session id; find it with --recent.
//   - The compaction point is observed, not documented. Pack out well before it (~850K on a 1M window).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BASE = path.join(os.homedir(), '.claude', 'projects');
const WINDOW = 1_000_000;
const K = n => `${Math.round(n / 1000)}K`;
const pt = ts => ts ? new Date(ts).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
const promptSize = u => u ? (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) : 0;
const folderLabel = d => { const i = d.toLowerCase().indexOf('-code-'); return i >= 0 ? d.slice(i + 6) : d; };

function folders() { try { return fs.readdirSync(BASE).map(d => path.join(BASE, d)).filter(p => fs.statSync(p).isDirectory()); } catch { return []; } }

function sessionFiles() {
  const out = [];
  for (const dir of folders()) for (const f of fs.readdirSync(dir)) if (f.endsWith('.jsonl')) out.push(path.join(dir, f));
  return out;
}

function agentFile(agentId) {
  for (const dir of folders()) {
    let subs; try { subs = fs.readdirSync(dir); } catch { continue; }
    for (const s of subs) {
      const f = path.join(dir, s, 'subagents', `agent-${agentId}.jsonl`);
      if (fs.existsSync(f)) return f;
    }
  }
  return null;
}

function measure(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let now = 0, peak = 0, at = '', calls = 0, compactions = 0;
  for (const l of lines) {
    if (!l) continue;
    let j; try { j = JSON.parse(l); } catch { continue; }
    if (j.type === 'system' && j.subtype === 'compact_boundary') compactions++;
    if (j.type === 'assistant' && j.message && j.message.usage) {
      const c = promptSize(j.message.usage);
      if (c) { calls++; now = c; at = j.timestamp; if (c > peak) peak = c; }
    }
  }
  return { now, peak, at, calls, compactions };
}

function report(label, file) {
  const m = measure(file);
  const pct = Math.round((m.now / WINDOW) * 100);
  const flag = m.now >= 850_000 ? '  🔴 PACK OUT NOW' : m.now >= 700_000 ? '  🟡 plan a packout' : '';
  console.log(`${label}\n  context ~${K(m.now)} (${pct}% of a 1M window) at last call ${pt(m.at)} PT · peak ~${K(m.peak)} · compactions ${m.compactions} · ${m.calls} calls${flag}`);
}

const args = process.argv.slice(2);
const flag = args[0];

if (!flag) {
  const id = process.env.CLAUDE_CODE_SESSION_ID;
  if (!id) { console.error('No CLAUDE_CODE_SESSION_ID in the environment — run with --session <id> or --recent.'); process.exit(1); }
  const f = sessionFiles().find(p => path.basename(p) === `${id}.jsonl`);
  if (!f) { console.error(`Transcript for this session (${id}) not found under ${BASE}.`); process.exit(1); }
  report(`THIS SESSION · ${id} · ${folderLabel(path.basename(path.dirname(f)))}`, f);
} else if (flag === '--session' && args[1]) {
  const hits = sessionFiles().filter(p => path.basename(p).startsWith(args[1]));
  if (!hits.length) { console.error(`No session transcript starts with ${args[1]}.`); process.exit(1); }
  for (const f of hits) report(`SESSION · ${path.basename(f, '.jsonl')} · ${folderLabel(path.basename(path.dirname(f)))}`, f);
} else if (flag === '--agent' && args[1]) {
  const f = agentFile(args[1]);
  if (!f) { console.error(`No subagent transcript for ${args[1]}.`); process.exit(1); }
  report(`SUBAGENT · ${args[1]}`, f);
} else if (flag === '--subagents' && args[1]) {
  const hits = sessionFiles().filter(p => path.basename(p).startsWith(args[1]));
  if (!hits.length) { console.error(`No session transcript starts with ${args[1]}.`); process.exit(1); }
  for (const f of hits) {
    const dir = path.join(path.dirname(f), path.basename(f, '.jsonl'), 'subagents');
    let subs = []; try { subs = fs.readdirSync(dir).filter(x => x.endsWith('.jsonl')); } catch {}
    console.log(`SUBAGENTS OF ${path.basename(f, '.jsonl')} · ${subs.length} found`);
    for (const s of subs) {
      let desc = ''; try { desc = JSON.parse(fs.readFileSync(path.join(dir, s.replace('.jsonl', '.meta.json')), 'utf8')).description || ''; } catch {}
      report(`  ${s.replace('agent-', '').replace('.jsonl', '')}${desc ? ' · ' + desc : ''}`, path.join(dir, s));
    }
  }
} else if (flag === '--recent') {
  const minutes = Number(args[1] || 60);
  const cutoff = Date.now() - minutes * 60_000;
  const recent = sessionFiles().filter(p => fs.statSync(p).mtimeMs >= cutoff).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!recent.length) { console.log(`No session active in the last ${minutes} minutes.`); process.exit(0); }
  for (const f of recent) report(`SESSION · ${path.basename(f, '.jsonl')} · ${folderLabel(path.basename(path.dirname(f)))}`, f);
} else {
  console.error('Usage: context-size.mjs [--session <id> | --agent <agentId> | --recent [minutes]]');
  process.exit(1);
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
