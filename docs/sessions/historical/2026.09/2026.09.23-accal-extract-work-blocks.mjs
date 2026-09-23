#!/usr/bin/env node
// Condense Justin's real typed turns into work BLOCKS separated by idle gaps.
// A block is a contiguous stretch of his attention; the gaps between blocks are
// where the meetings, meals and errands live. Emits a compact per-day timeline
// plus any message that smells like a calendar event (meeting, call, travel...).
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const ROOT = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'projects');
const SINCE = process.argv[2] || '2026-08-28';
const UNTIL = process.argv[3] || '2026-12-31';
const GAP = Number(process.argv[4] || 25);   // minutes of silence that ends a block

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
});
function pt(iso) {
  const p = fmt.formatToParts(new Date(iso));
  const g = (t) => p.find((x) => x.type === t).value;
  let hh = g('hour'); if (hh === '24') hh = '00';
  return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${hh}:${g('minute')}`, ms: Date.parse(iso) };
}

// Things that hint at a real-world commitment sitting in a gap.
const SIGNAL = /\b(meeting|meet with|call with|a call|zoom|lunch|dinner|breakfast|coffee|appointment|interview|standup|stand-up|investor|pitch|deck|fundrais|diligence|lawyer|counsel|doctor|dentist|flight|drive|driving|travel|airport|kids?|school|family|wife|errand|out of the (house|office)|stepping (out|away)|be back|gotta run|heading out|pulled away|took a break|back from)\b/i;

const turns = [];
for (const pd of fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const dir = path.join(ROOT, pd.name);
  const proj = pd.name.replace(/^[Cc]--Users-Justin-Evryn-Code-?-?/, '').replace(/^evryn-/, '') || 'home';
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.jsonl')) continue;
    const rl = readline.createInterface({ input: fs.createReadStream(path.join(dir, f)), crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line || line[0] !== '{' || !line.includes('"timestamp"')) continue;
      let o; try { o = JSON.parse(line); } catch { continue; }
      if (!o.timestamp || o.isSidechain === true || o.isMeta === true) continue;
      const t = pt(o.timestamp);
      if (t.date < SINCE || t.date > UNTIL) continue;
      const m = o.message; if (!m) continue;

      if (o.type === 'assistant') {
        let chars = 0;
        if (Array.isArray(m.content)) for (const b of m.content) if (b.type === 'text') chars += (b.text || '').length;
        if (chars) turns.push({ ...t, kind: 'A', chars, text: '', proj });
        continue;
      }
      if (o.type !== 'user') continue;
      const ok = o.origin && o.origin.kind;
      if (ok && ok !== 'human') continue;            // peer / system rows are not Justin
      const c = m.content;
      let text = null;
      if (typeof c === 'string') text = c;
      else if (Array.isArray(c)) {
        if (c.some((b) => b.type === 'tool_result')) continue;
        text = c.filter((b) => b.type === 'text').map((b) => b.text || '').join('\n');
      }
      if (text == null) continue;
      let s = text.trim();
      if (!s) continue;
      if (/^<(command-name|local-command|command-message|bash-input)/.test(s)) continue;
      if (/^\[Request interrupted/.test(s)) continue;
      // strip the IDE/task noise that wraps some real messages
      const ide = s.match(/<\/(ide_opened_file|ide_selection|task-notification|system-reminder)>\s*([\s\S]*)$/);
      if (ide && ide[2].trim()) s = ide[2].trim();
      else if (/^<(ide_opened_file|ide_selection|task-notification|system-reminder)/.test(s)) continue;
      turns.push({ ...t, kind: 'H', chars: s.length, text: s.replace(/\s+/g, ' '), proj });
    }
  }
}
turns.sort((a, b) => a.ms - b.ms);

const byDay = new Map();
for (const t of turns) { if (!byDay.has(t.date)) byDay.set(t.date, []); byDay.get(t.date).push(t); }

for (const date of [...byDay.keys()].sort()) {
  const all = byDay.get(date);
  const human = all.filter((t) => t.kind === 'H');
  if (!human.length) continue;
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(date + 'T12:00:00Z').getUTCDay()];

  // build blocks
  const blocks = [];
  let cur = [human[0]];
  for (let i = 1; i < human.length; i++) {
    if ((human[i].ms - human[i - 1].ms) / 60000 >= GAP) { blocks.push(cur); cur = [human[i]]; }
    else cur.push(human[i]);
  }
  blocks.push(cur);

  // read+compose runway before his first message of the day
  const first = human[0];
  const prevA = turns.filter((t) => t.kind === 'A' && t.ms < first.ms).pop();
  let runway = '';
  if (prevA) {
    const hrs = (first.ms - prevA.ms) / 3.6e6;
    runway = `prior AI turn ${prevA.date} ${prevA.time} (${prevA.chars}ch), ${hrs.toFixed(1)}h earlier`;
  }

  console.log(`\n${'#'.repeat(80)}\n## ${date} ${dow}  |  ${human.length} turns  |  ${first.time}-${human[human.length - 1].time}  |  ${runway}`);
  console.log(`## opener ${first.chars}ch: ${first.text.slice(0, 300)}`);

  blocks.forEach((b, i) => {
    const mins = Math.round((b[b.length - 1].ms - b[0].ms) / 60000);
    const projs = [...new Set(b.map((x) => x.proj))].join('+');
    const gapBefore = i === 0 ? '' : `  [gap ${Math.round((b[0].ms - blocks[i - 1][blocks[i - 1].length - 1].ms) / 60000)}m]`;
    console.log(`\n  BLOCK ${i + 1}: ${b[0].time}-${b[b.length - 1].time} (${mins}m, ${b.length} turns, ${projs})${gapBefore}`);
    // representative snippets: first, longest, last
    const longest = b.reduce((a, x) => (x.chars > a.chars ? x : a), b[0]);
    const picks = [...new Set([b[0], longest, b[b.length - 1]])];
    for (const p of picks) console.log(`     ${p.time} (${p.chars}ch) ${p.text.slice(0, 200)}`);
  });

  const sig = human.filter((h) => SIGNAL.test(h.text));
  if (sig.length) {
    console.log(`\n  >> REAL-WORLD SIGNALS (${sig.length}):`);
    for (const s of sig.slice(0, 14)) {
      const m = s.text.match(SIGNAL);
      const idx = Math.max(0, s.text.search(SIGNAL) - 90);
      console.log(`     ${s.time} [${m[0]}] ...${s.text.slice(idx, idx + 230)}...`);
    }
  }
}
