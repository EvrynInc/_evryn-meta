// sweep.mjs — the owned extract (session text + end marker) and the action digest, for packout.mjs.
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// The said-text method is _evryn-meta/scripts/session-text.mjs's, applied to already-parsed rows (user and assistant text,
// mid-turn human and peer messages, compaction marks; no tool calls; re-sent copies skipped). Lines longer than WRAP characters
// are hard-wrapped so every line of the extract comes back whole from the Read tool, inside the token cap, and Reads back exactly.
// (Measured: Read did not truncate a 12,011-character line, but a line over the 25K-token cap is dropped whole into a PARTIAL view.)

import { sha12 } from './transcript.mjs';

export const WRAP = 2000;
export const MARKER_RE = /^END OF SESSION TEXT · (\d+) lines · sha256 ([0-9a-f]{12})$/;

export function sessionText(rows) {
  const seen = new Set();
  let out = '';
  for (const { o } of rows) {
    if (o.isSidechain) continue;
    if (o.isCompactSummary) { out += `\n\n===== COMPACTION at ${o.timestamp} (summary omitted; it is not the record) =====\n`; continue; }
    if (o.attachment?.type === 'queued_command') {
      const a = o.attachment; const kind = a.origin?.kind;
      if ((kind !== 'human' && kind !== 'peer') || seen.has(a.delivery_id)) continue;
      seen.add(a.delivery_id);
      const p = typeof a.prompt === 'string' ? a.prompt : Array.isArray(a.prompt) ? a.prompt.filter((x) => x.type === 'text').map((x) => x.text).join('\n') : '';
      out += `\n\n===== ${kind === 'human' ? 'user, sent mid-turn' : 'another agent'} ${o.timestamp ?? ''} =====\n${p}`;
      continue;
    }
    const role = o.message?.role; const c = o.message?.content;
    if (role !== 'user' && role !== 'assistant') continue;
    const raw = typeof c === 'string' ? c : Array.isArray(c) ? c.filter((x) => x.type === 'text').map((x) => x.text).join('\n') : '';
    const text = raw.replace(/<system-reminder[\s\S]*?<\/system-reminder>/g, '').trim();
    if (!text) continue;
    if (!o.timestamp) continue;
    const key = o.message?.id ? `${o.message.id}:${text.length}` : o.uuid;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out += `\n\n===== ${role} ${o.timestamp ?? ''} =====\n${text}`;
  }
  return out;
}

/** Split into lines, CR removed, each line hard-wrapped at WRAP characters. */
export function wrapLines(text) {
  const out = [];
  for (const l of text.replace(/\r/g, '').split('\n')) {
    if (l.length <= WRAP) { out.push(l); continue; }
    for (let i = 0; i < l.length; i += WRAP) out.push(l.slice(i, i + WRAP));
  }
  return out;
}

/** The extract file's full content: N body lines, then the marker line, then a final newline. */
export function buildExtract(rows) {
  const body = wrapLines(sessionText(rows));
  const sha = sha12(body.map((l) => l + '\n').join(''));
  const marker = `END OF SESSION TEXT · ${body.length} lines · sha256 ${sha}`;
  return { content: body.map((l) => l + '\n').join('') + marker + '\n', N: body.length, sha, marker };
}

const WRITE_BASH = /(\bappend-entry\.mjs\b|>>|(^|[^0-9&>])>\s*[^&\s]|\bsed\s+-i\b|\btee\b|writeFileSync|appendFileSync|\bSet-Content\b|\bAdd-Content\b|\bOut-File\b|\bcp\s|\bmv\s)/;

/** One line per tool call that wrote a file, sent a message, committed, pushed, launched a session or wrote a calendar event. */
export function actionDigest(calls) {
  const out = [];
  for (const k of calls) {
    if (!k.ok) continue;
    const i = k.input || {};
    let what = null;
    if (k.name === 'Edit' || k.name === 'Write' || k.name === 'NotebookEdit') what = `${k.name} ${i.file_path || i.notebook_path}`;
    else if (k.name === 'SendMessage') what = `SendMessage to=${i.to}`;
    else if (k.name === 'Agent' || k.name === 'Task') what = `${k.name} ${i.subagent_type || ''} "${String(i.description || '').slice(0, 60)}"`;
    else if (/calendar/i.test(k.name) && /(create|update|delete|respond)/i.test(k.name)) what = `${k.name}`;
    else if (k.name === 'Bash') {
      const c = String(i.command || '');
      const tags = [];
      if (/\bgit\b[^|;&]*\bcommit\b/.test(c)) tags.push('commit');
      if (/\bgit\b[^|;&]*\bpush\b/.test(c)) tags.push('push');
      if (/\bclaude\b[^|;&]*--bg\b/.test(c)) tags.push('launch');
      if (WRITE_BASH.test(c)) tags.push('write');
      if (tags.length) what = `Bash[${tags.join(',')}] ${c.replace(/\s+/g, ' ').slice(0, 160)}`;
    }
    if (what) out.push(`${k.n}\t${k.ts || ''}\t${what}`);
  }
  return out.join('\n') + (out.length ? '\n' : '');
}

export { WRITE_BASH };

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
