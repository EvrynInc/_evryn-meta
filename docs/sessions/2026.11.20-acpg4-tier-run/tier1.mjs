// tier1.mjs — which mutation rows did fix trips 4-6 touch? Run from the worktree root.
// usage: node tier1.mjs <base-sha> [near=15]
// A row is tier 1 if (a) it is new since <base>, (b) its row line changed since <base>, or (c) its target text, in the file at HEAD,
// sits on a line within `near` lines of a hunk that changed in that file since <base>. Prints the ids, one reason each, then a total.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const [base, nearArg] = process.argv.slice(2); const near = +(nearArg || 15);
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 << 20 });
const rowsOf = (txt) => { const m = new Map(); for (const l of txt.split(/\r?\n/)) { const r = l.match(/^\s*\['([^']+)',\s*(CH|PO|TX),/); if (r) m.set(r[1], { line: l.trim(), file: r[2] }); } return m; };
const FILES = { CH: 'scripts/packout/lib/checks.mjs', PO: 'scripts/packout/packout.mjs', TX: 'scripts/packout/lib/transcript.mjs' };
const MUT = 'scripts/packout/test/mutations.mjs';
const before = rowsOf(git('show', `${base}:${MUT}`)); const now = rowsOf(fs.readFileSync(MUT, 'utf8'));
// changed line ranges at HEAD per file
const hunks = {};
for (const [k, f] of Object.entries(FILES)) {
  hunks[k] = [...git('diff', '-U0', base, 'HEAD', '--', f).matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)].map((x) => [+x[1], +x[1] + Math.max(+(x[2] ?? 1), 1) - 1]);
}
// target text: the third array element; find its line in the file at HEAD
const src = await import('node:url').then(() => fs.readFileSync(MUT, 'utf8'));
const targets = new Map();
for (const l of src.split(/\r?\n/)) {
  const r = l.match(/^\s*\['([^']+)',\s*(CH|PO|TX),\s*(['"`])((?:\\.|(?!\3).)*)\3/);
  if (r) targets.set(r[1], { file: r[2], text: r[4].replace(/\\(['"`\\])/g, '$1') });
}
const out = [];
for (const [id, r] of now) {
  let why = null;
  if (!before.has(id)) why = 'new row';
  else if (before.get(id).line !== r.line) why = 'row changed';
  else {
    const t = targets.get(id); const body = fs.readFileSync(FILES[r.file], 'utf8').split(/\r?\n/);
    const ln = t ? body.findIndex((x) => x.includes(t.text.split('\\n')[0])) + 1 : 0;
    if (!ln) why = 'TARGET NOT LOCATED (include it)';
    else if (hunks[r.file].some(([a, b]) => ln >= a - near && ln <= b + near)) why = `target line ${ln} near a changed hunk`;
  }
  if (why) out.push(`${id}\t${why}`);
}
console.log(out.join('\n'));
console.log(`TIER1\t${out.length} of ${now.size} rows; hunks: ${Object.entries(hunks).map(([k, h]) => `${k} ${h.length}`).join(', ')}`);
