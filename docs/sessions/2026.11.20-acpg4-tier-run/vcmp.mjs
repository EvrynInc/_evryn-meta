// vcmp.mjs — compare probe outputs by VERDICT only (Cn=PASS|FAIL tokens, and "exit N"), line by line, keyed on the probe label.
// usage: node vcmp.mjs <reference.txt> <new.txt>
import fs from 'node:fs';
const load = f => {
  const m = new Map();
  for (const ln of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (!ln.trim() || /^\s/.test(ln)) continue;
    const label = ln.split('\t')[0];
    const v = [...ln.matchAll(/\b(C\d+)=(PASS|FAIL|OPEN)\b/g)].map(x => `${x[1]}=${x[2]}`);
    const ex = ln.match(/\bexit (\d+)/);
    if (ex) v.push(`exit=${ex[1]}`);
    m.set(label, v.join(' '));
  }
  return m;
};
const [a, b] = [load(process.argv[2]), load(process.argv[3])];
let same = 0, diff = 0;
for (const k of new Set([...a.keys(), ...b.keys()])) {
  if (a.get(k) === b.get(k)) { same++; continue; }
  diff++;
  console.log(`DIFF  ${k}\n   ref: ${a.get(k) ?? '(missing)'}\n   new: ${b.get(k) ?? '(missing)'}`);
}
console.log(`probes compared: ${same + diff} · same verdicts: ${same} · verdict changes: ${diff}`);
