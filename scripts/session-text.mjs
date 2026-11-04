#!/usr/bin/env node
// session-text.mjs — the conversation of a Claude Code session, pulled from its transcript, so a fragment sweep reads the record instead of memory.
//
// Truncation check: the last line of this file should read `FULL FILE LOADED`.
//
// WHY THIS EXISTS
//   A fragment sweep from memory feels thorough and finds nothing, because what you dropped leaves no trace in what you remember.
//   Every Claude Code session writes a transcript at ~/.claude/projects/<folder>/<session-id>.jsonl. This prints its user and
//   assistant text in order, including messages the person sent mid-turn and what other agents sent in. It marks every compaction,
//   and leaves out tool calls, tool results, harness reminders and subagents' own turns. It only reads: it writes to stdout, and it
//   sends nothing anywhere.
//   (2026-11-03: a sweep from this record found eighteen things a sweep from memory had missed.)
//
// USAGE (runs from any directory)
//   node _evryn-meta/scripts/session-text.mjs > <your scratchpad>/session.txt          this session (reads CLAUDE_CODE_SESSION_ID)
//   node _evryn-meta/scripts/session-text.mjs --session <id-prefix> > <file>           another session
//   Then read the file with the Read tool, in pieces. Output to a file, not to the shell: a shell read over the cap never reaches you.
//
// CAVEATS, so nobody over-reads it
//   - It shows what was SAID. It does not show what a tool did; check the artifact for that.
//   - A long session's text is large. Measure with `wc -c` before you read.
//   - It reports its counts on stderr. A zero count means the wrong session or a changed format, not an empty conversation.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BASE = path.join(os.homedir(), '.claude', 'projects');
const args = process.argv.slice(2);
const i = args.indexOf('--session');
const wanted = i >= 0 ? args[i + 1] : process.env.CLAUDE_CODE_SESSION_ID;
if (!wanted) { console.error('session-text: no session id (CLAUDE_CODE_SESSION_ID is unset; pass --session <id-prefix>)'); process.exit(2); }

const hits = [];
for (const d of fs.readdirSync(BASE)) {
  const dir = path.join(BASE, d);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.jsonl') && f.startsWith(wanted)) hits.push(path.join(dir, f));
}
if (hits.length !== 1) { console.error(`session-text: ${hits.length} transcripts match "${wanted}"`); process.exit(2); }

const seen = new Set();
let user = 0, assistant = 0, compactions = 0, midTurn = 0, peers = 0, copies = 0, out = '';
for (const line of fs.readFileSync(hits[0], 'utf8').split('\n')) {
  if (!line) continue;
  let o; try { o = JSON.parse(line); } catch { continue; }
  if (o.isSidechain) continue;
  if (o.isCompactSummary) { compactions++; out += `\n\n===== COMPACTION at ${o.timestamp} (summary omitted; it is not the record) =====\n`; continue; }
  // A message that arrives while the agent is mid-turn is stored as an attachment, not a user row.
  // Miss these and you miss the person's own words, which is the worst thing a sweep can miss.
  if (o.attachment?.type === 'queued_command') {
    const a = o.attachment; const kind = a.origin?.kind;
    if ((kind !== 'human' && kind !== 'peer') || seen.has(a.delivery_id)) continue;
    seen.add(a.delivery_id);
    const p = typeof a.prompt === 'string' ? a.prompt : Array.isArray(a.prompt) ? a.prompt.filter(x => x.type === 'text').map(x => x.text).join('\n') : '';
    if (kind === 'human') { user++; midTurn++; } else peers++;
    out += `\n\n===== ${kind === 'human' ? 'user, sent mid-turn' : 'another agent'} ${o.timestamp ?? ''} =====\n${p}`;
    continue;
  }
  const role = o.message?.role; const c = o.message?.content;
  if (role !== 'user' && role !== 'assistant') continue;
  // Harness reminders (the manuals, tool lists) are most of a user row by size and none of the conversation.
  const raw = typeof c === 'string' ? c : Array.isArray(c) ? c.filter(x => x.type === 'text').map(x => x.text).join('\n') : '';
  const text = raw.replace(/<system-reminder[\s\S]*?<\/system-reminder>/g, '').trim();
  if (!text) continue;
  // A row with no timestamp is the harness re-sending an earlier turn (after a compaction, or on a resume): a copy, not a new turn.
  // That includes the compaction summary, which is exactly what a sweep must not read as the record.
  if (!o.timestamp) { copies++; continue; }
  const key = o.message?.id ? `${o.message.id}:${text.length}` : o.uuid;
  if (key && seen.has(key)) continue;
  if (key) seen.add(key);
  if (role === 'user') user++; else assistant++;
  out += `\n\n===== ${role} ${o.timestamp ?? ''} =====\n${text}`;
}
process.stdout.write(out + '\n');
console.error(`session-text: ${path.basename(hits[0])} · ${user} user (${midTurn} sent mid-turn) · ${assistant} assistant · ${peers} from other agents · ${compactions} compactions · ${copies} re-sent copies skipped · ${out.length} chars`);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
