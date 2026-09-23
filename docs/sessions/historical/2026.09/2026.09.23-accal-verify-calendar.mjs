#!/usr/bin/env node
// Verify what actually landed on the calendar against what we intended.
//
// Usage:
//   node docs/sessions/2026.09.23-accal-verify-calendar.mjs <list_events-result.json>
//
//   <list_events-result.json> is a saved Google Calendar list_events response covering
//   2026-08-30 .. 2026-09-24 on justin@evryn.ai. An optional second argument overrides
//   the intended-events file; by default it resolves the companion JSON sitting next to
//   this script, so the check works from any working directory.
//
// This exists because "the script reported success" and "the right events are on the
// calendar" are different claims. Only the second one matters, and only a read proves it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const intendedPath = process.argv[3] || path.join(HERE, '2026.09.23-accal-calendar-events.json');
if (!fs.existsSync(intendedPath)) {
  console.error(`cannot find the intended-events file: ${intendedPath}`);
  process.exit(1);
}
const intended = JSON.parse(fs.readFileSync(intendedPath, 'utf8'));
const MARKER = intended.marker;

const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const live = raw.events || [];

const F = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
});
const pt = (iso) => {
  const p = F.formatToParts(new Date(iso));
  const g = (t) => p.find((x) => x.type === t).value;
  let h = g('hour'); if (h === '24') h = '00';
  return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${h}:${g('minute')}` };
};

// Only events we created carry the marker. Everything else is Justin's and is none of our business.
const ours = [];
for (const e of live) {
  const desc = e.description || '';
  if (!desc.includes(MARKER)) continue;
  const sd = e.start?.dateTime, ed = e.end?.dateTime;
  if (!sd || !ed) { ours.push({ bad: 'all-day / no dateTime', summary: e.summary, id: e.id }); continue; }
  const s = pt(sd), en = pt(ed);
  ours.push({ date: s.date, start: s.time, end: en.time, colorId: e.colorId || null, summary: e.summary, id: e.id });
}

const key = (x) => `${x.date}|${x.start}|${x.summary}`;
const liveByKey = new Map(ours.filter((x) => !x.bad).map((x) => [key(x), x]));
const intByKey = new Map(intended.events.map((x) => [key(x), x]));

const missing = [], mismatched = [], extra = [], ok = [];

for (const [k, want] of intByKey) {
  const got = liveByKey.get(k);
  if (!got) { missing.push(want); continue; }
  const problems = [];
  if (got.end !== want.end) problems.push(`end ${got.end} != ${want.end}`);
  if ((got.colorId || null) !== (want.colorId || null)) problems.push(`colorId ${got.colorId} != ${want.colorId}`);
  if (problems.length) mismatched.push({ ...want, problems });
  else ok.push(want);
}
for (const [k, got] of liveByKey) if (!intByKey.has(k)) extra.push(got);

// Duplicates: same title at the same start, created twice.
const seen = new Map();
const dupes = [];
for (const x of ours) {
  if (x.bad) continue;
  const k = key(x);
  if (seen.has(k)) dupes.push(x); else seen.set(k, x);
}

console.log(`intended: ${intended.events.length}   on calendar with marker: ${ours.length}\n`);
const line = (label, arr, fmt) => {
  console.log(`${label}: ${arr.length}`);
  arr.forEach((x) => console.log('   ' + fmt(x)));
  if (arr.length) console.log('');
};
line('MATCHED', ok, (x) => `${x.date} ${x.start}-${x.end} c${x.colorId || 'default'}  ${x.summary}`);
line('MISSING (intended, not on calendar)', missing, (x) => `${x.date} ${x.start}-${x.end}  ${x.summary}`);
line('MISMATCHED', mismatched, (x) => `${x.date} ${x.start}  ${x.summary}  -> ${x.problems.join('; ')}`);
line('DUPLICATED', dupes, (x) => `${x.date} ${x.start}  ${x.summary}  (id ${x.id})`);
line('EXTRA (marked ours, not intended)', extra, (x) => `${x.date} ${x.start}-${x.end}  ${x.summary}  (id ${x.id})`);
line('MALFORMED', ours.filter((x) => x.bad), (x) => `${x.summary}  -> ${x.bad}`);

const clean = !missing.length && !mismatched.length && !dupes.length && !extra.length && !ours.some((x) => x.bad);
console.log(clean
  ? `VERDICT: CLEAN — all ${ok.length} intended events are on the calendar at the right times and colours, with no duplicates and nothing extra.`
  : `VERDICT: PROBLEMS — ${missing.length} missing, ${mismatched.length} mismatched, ${dupes.length} duplicated, ${extra.length} extra.`);
