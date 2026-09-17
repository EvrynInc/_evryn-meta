// Renders ACT-A's session transcript into readable markdown parts for ACT-A-P1 and ACT-A-P2.
// Every Justin message, ACT-A chat message, tool call and non-Read tool result is copied verbatim; Read CONTENTS are elided.
// Usage: node build-extract.js <transcript.jsonl> <outDir> <splitLine>   (splitLine 0 = print sizes only, write nothing)
const fs = require('fs');
const path = require('path');
const [src, outDir, splitArg] = process.argv.slice(2);
const SPLIT = Number(splitArg || 0);
const NL = String.fromCharCode(10);
const SCOUT_ID = 'a26624b75b3161b22';
const SCOUT_REPORT = 'evryn-team-runtime/docs/research/2026.09.14-acta-scoutf-runtime-capability-inventory.md';

const recs = [];
fs.readFileSync(src, 'utf8').split(NL).forEach((l, i) => {
  if (!l) return;
  try { recs.push({ ln: i + 1, o: JSON.parse(l) }); } catch (e) { /* partial last line while the session is live */ }
});

const textOf = p => typeof p === 'string' ? p
  : Array.isArray(p) ? p.map(x => x.type === 'text' ? x.text : '[' + x.type + ' block]').join(NL) : '';
const FENCE = '~~~~~~';
const fence = (s, lang) => FENCE + (lang || '') + NL + s + NL + FENCE;
const cap = (s, n, ln) => s.length <= n ? s
  : s.slice(0, n) + NL + '[… TRUNCATED IN THIS EXTRACT — ' + (s.length - n) + ' more characters. Full text: node _evryn-meta/.cache/acta-packout/show-record.js ' + ln + ' ]';

const results = new Map();
for (const { ln, o } of recs) {
  const m = o.message;
  if (!m || !Array.isArray(m.content)) continue;
  for (const c of m.content) {
    if (c.type === 'tool_result') results.set(c.tool_use_id, { text: textOf(c.content), isError: !!c.is_error, ln });
  }
}

function toolInput(name, i, ln) {
  if ((name === 'Write' || name === 'Edit') && /acta-packout|actap/.test(i.file_path || '')) {
    return '`' + i.file_path + '` · *content elided — this file belongs to the ACT-A-P1/P2 packout itself; read it on disk*';
  }
  switch (name) {
    case 'Read': return '`' + i.file_path + '`' + (i.offset ? ' · offset ' + i.offset : '') + (i.limit ? ' · limit ' + i.limit : '');
    case 'Bash': return (i.description ? '*' + i.description + '*' + NL : '') + fence(cap(i.command || '', 6000, ln), 'bash');
    case 'Edit': return '`' + i.file_path + '`' + (i.replace_all ? ' (replace_all)' : '') + NL + 'OLD:' + NL + fence(cap(i.old_string || '', 15000, ln)) + NL + 'NEW:' + NL + fence(cap(i.new_string || '', 15000, ln));
    case 'Write': return '`' + i.file_path + '`' + NL + fence(cap(i.content || '', 60000, ln));
    case 'Grep': return 'pattern `' + i.pattern + '`' + (i.path ? ' · path `' + i.path + '`' : '') + (i.glob ? ' · glob `' + i.glob + '`' : '') + (i.output_mode ? ' · mode ' + i.output_mode : '');
    case 'Glob': return 'pattern `' + i.pattern + '`' + (i.path ? ' · path `' + i.path + '`' : '');
    case 'WebFetch': return i.url + NL + 'prompt: ' + (i.prompt || '');
    case 'WebSearch': return 'query: ' + i.query;
    case 'Agent': return 'type ' + i.subagent_type + ' · model ' + i.model + ' · background ' + i.run_in_background + ' · ' + (i.description || '') + NL + fence(i.prompt || '');
    case 'SendMessage': return 'to ' + i.to + NL + fence(i.message || '');
    case 'Monitor': return (i.description || '') + NL + fence(cap(i.command || '', 3000, ln), 'bash');
    default: return fence(cap(JSON.stringify(i, null, 1), 2000, ln), 'json');
  }
}

function toolResult(name, r) {
  if (!r) return '↳ *(no result recorded in the transcript)*';
  const err = r.isError ? ' ⚠️ ERRORED' : '';
  if (name === 'Read' && !r.isError) {
    const L = r.text.split(NL).map(s => s.match(/^\s*(\d+)\t(.*)$/)).filter(Boolean);
    if (L.length) {
      const tail = L.slice(-2).map(x => x[2]).join(' ');
      const canary = /FULL FILE LOADED/.test(tail);
      return '↳ Read returned lines ' + L[0][1] + '–' + L[L.length - 1][1] + (canary ? ' · bottom canary SEEN' : ' · bottom canary NOT on the last lines returned') + ' · *contents elided — `show-record.js ' + r.ln + '` prints them*';
    }
    return '↳ Read returned no numbered lines (L' + r.ln + '):' + NL + fence(cap(r.text, 1500, r.ln));
  }
  const n = name === 'WebFetch' ? 25000 : (name === 'Agent' || name === 'SendMessage') ? 60000 : 8000;
  return '↳ result' + err + ' (L' + r.ln + ')' + NL + fence(cap(r.text, n, r.ln));
}

function tag(t, name) {
  const i = t.indexOf('<' + name + '>');
  const j = t.indexOf('</' + name + '>');
  return i >= 0 && j > i ? t.slice(i + name.length + 2, j).trim() : '';
}

function notification(t, ln, H) {
  const id = tag(t, 'task-id');
  const summary = tag(t, 'summary');
  const event = tag(t, 'event');
  const result = tag(t, 'result');
  let body = '🔔 notification · task `' + id + '` · ' + summary + (event ? ' · ' + event.replace(/\s+/g, ' ').slice(0, 300) : '');
  if (result) {
    if (id === SCOUT_ID && result.length > 20000) body += NL + NL + '**Scout-F result, ' + result.length + ' characters — NOT reproduced here. It was captured verbatim, by script, to `' + SCOUT_REPORT + '`. Read that file if a question turns on its content; `show-record.js ' + ln + '` prints this exact copy.**';
    else body += NL + fence(cap(result, 60000, ln));
  }
  return H('🔔 NOTIFICATION') + NL + body;
}

const out = [];
for (const { ln, o } of recs) {
  const ts = (o.timestamp || '').slice(11, 19);
  const H = label => '#### L' + ln + (ts ? ' · ' + ts + 'Z' : '') + ' · ' + label;
  if (o.isCompactSummary) {
    out.push({ ln, t: H('🔴 COMPACTION SUMMARY — machine-written; the compacted ACT-A resumed from this, not from the conversation above') + NL + fence(textOf(o.message && o.message.content)) });
    continue;
  }
  if (o.type === 'system') {
    const body = typeof o.content === 'string' ? o.content : JSON.stringify(o.compactMetadata || o.content || {});
    out.push({ ln, t: H('⚙️ SYSTEM ' + (o.subtype || '')) + NL + fence(cap(body, 3000, ln)) });
    continue;
  }
  if (o.type === 'attachment' && o.attachment) {
    const a = o.attachment;
    if (a.type === 'queued_command') {
      const t = textOf(a.prompt);
      if (t.includes('<task-notification>')) out.push({ ln, t: notification(t, ln, H) });
      else out.push({ ln, kind: 'JUSTIN', t: H('🟦 JUSTIN — sent while ACT-A was mid-turn') + NL + NL + t });
    } else if (a.type !== 'prompt_snapshot') {
      out.push({ ln, t: H('📎 attachment · ' + a.type) + NL + fence(cap(JSON.stringify(a), 1500, ln)) });
    }
    continue;
  }
  if (o.type !== 'user' && o.type !== 'assistant') continue;
  const m = o.message;
  if (!m) continue;
  const content = typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : (m.content || []);
  for (const c of content) {
    if (o.type === 'user' && c.type === 'text') {
      if (c.text.includes('<task-notification>')) out.push({ ln, t: notification(c.text, ln, H) });
      else if (o.isMeta) out.push({ ln, t: H('⚙️ harness-injected turn text') + NL + fence(cap(c.text, 3000, ln)) });
      else out.push({ ln, kind: 'JUSTIN', t: H('🟦 JUSTIN') + NL + NL + c.text });
    } else if (o.type === 'assistant' && c.type === 'text') {
      out.push({ ln, kind: 'ACTA', t: H('🟩 ACT-A — said in chat') + NL + NL + c.text });
    } else if (c.type === 'thinking' && c.thinking) {
      out.push({ ln, t: H('⬜ ACT-A — private reasoning (Justin never saw this)') + NL + NL + c.thinking });
    } else if (c.type === 'tool_use') {
      out.push({ ln, t: H('🔧 tool call · ' + c.name) + NL + toolInput(c.name, c.input || {}, ln) + NL + NL + toolResult(c.name, results.get(c.id)) });
    }
  }
}

const boundary = recs.find(r => (r.o.type === 'system' && r.o.subtype === 'compact_boundary') || r.o.isCompactSummary);
const B = boundary ? boundary.ln : Infinity;
const size = arr => arr.reduce((s, e) => s + e.t.length + 2, 0);

if (!SPLIT) {
  const pre = out.filter(e => e.ln < B);
  const total = size(pre);
  let cum = 0;
  for (const e of pre) {
    if (e.kind === 'JUSTIN' || (e.kind === 'ACTA' && /Report #\d/.test(e.t.slice(0, 400)))) {
      console.log('L' + e.ln + ' ' + (e.kind === 'JUSTIN' ? 'JUSTIN' : 'REPORT') + ' at ' + Math.round(100 * cum / total) + '% (' + cum + ' chars) :: ' + e.t.split(NL).slice(2).join(' ').slice(0, 90));
    }
    cum += e.t.length + 2;
  }
  console.log('pre-compaction rendered chars ' + total + ' · post-compaction ' + size(out.filter(e => e.ln >= B)) + ' · boundary L' + B + ' · last record L' + recs[recs.length - 1].ln);
  process.exit(0);
}

const extractedAt = new Date().toISOString();
const header = (n, scope, extra) => [
  '# ACT-A session transcript — extract, part ' + n + ' of 3 · ' + scope,
  '',
  '> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you do not see it, read in sections until you do.',
  '>',
  '> **What this is:** a mechanical, script-generated rendering of ACT-A\'s 2026-09-14 Claude Code session transcript, produced for ACT-A-P1 and ACT-A-P2 at ' + extractedAt + '. **No model summarized or edited any of it.** Every message from Justin, every message ACT-A wrote in chat, every tool call and every non-`Read` tool result is copied verbatim, in transcript order.',
  '>',
  '> **What is left out, and how to get it:** the CONTENTS of `Read` calls — each shows the file, the span returned, and whether the bottom canary came back. To see exactly what ACT-A saw, run `node _evryn-meta/.cache/acta-packout/show-record.js <L>` from `C:/Users/Justin/Evryn/Code` using the result line it names. Very long results are cut with a marker naming the line. Heartbeat and watcher notifications are one line each. Scout-F\'s ~72K-character work-trip report is replaced by a pointer to its verbatim capture.',
  '>',
  '> **Citations:** `L<n>` is the line number in the raw transcript `' + src.replace(/\\/g, '/') + '`. Cite it in every finding. **Timestamps are UTC** — Pacific time is UTC−7.',
  '>',
  '> **Legend:** 🟦 JUSTIN · 🟩 ACT-A, said in chat (what Justin could see) · ⬜ ACT-A private reasoning (Justin never saw it; most such blocks are empty in the transcript) · 🔧 a tool call, with its ↳ result beneath · 🔔 a notification · ⚙️ system · 🔴 compaction.',
  extra ? '>' + NL + '> ' + extra : '',
  '',
  '---',
  '',
].join(NL);
const footer = NL + '---' + NL + NL + 'Truncation canary — DO NOT REMOVE: FULL FILE LOADED' + NL;

const p1 = out.filter(e => e.ln < SPLIT);
const p2 = out.filter(e => e.ln >= SPLIT && e.ln < B);
const p3 = out.filter(e => e.ln >= B);
const overlap = [...p1].reverse().find(e => e.kind === 'ACTA' && /Report #\d/.test(e.t.slice(0, 400)));

fs.mkdirSync(outDir, { recursive: true });
const write = (name, head, arr, pre) => {
  const body = (pre || '') + arr.map(e => e.t).join(NL + NL);
  fs.writeFileSync(path.join(outDir, name), head + body + footer);
  console.log(name + ': ' + arr.length + ' entries, ' + (head.length + body.length + footer.length) + ' chars, lines L' + (arr[0] ? arr[0].ln : '-') + '–L' + (arr.length ? arr[arr.length - 1].ln : '-'));
};
write('transcript-part1.md', header(1, 'session start through L' + (SPLIT - 1) + ' (ACT-A-P1 reads this)'), p1);
write('transcript-part2.md', header(2, 'L' + SPLIT + ' through the compaction at L' + B + ' (ACT-A-P2 reads this)',
  '**It opens with an OVERLAP entry** — the last numbered report ACT-A sent before this part begins (also the end of part 1) — so the first message from Justin below has its context.'), p2,
  overlap ? '## ⤴ OVERLAP — the last report before this part (also in part 1)' + NL + NL + overlap.t + NL + NL + '## ⤵ PART 2 BEGINS' + NL + NL : '');
write('transcript-part3-post-compaction.md', header(3, 'after the compaction, L' + B + ' through L' + recs[recs.length - 1].ln + ' at extraction time (ACT-A-P2 reads this)',
  '⚠️ **Everything ACT-A did in this part was done by a COMPACTED instance.** Treat its claims as leads. Justin\'s own words in this part are rulings.'), p3);
