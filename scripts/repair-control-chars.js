// Repair a doc that accidentally contains a real control character where the
// author meant to WRITE the escape sequence as text. Replaces each stray C0
// control with its literal six-character form (backslash, u, four hex digits).
//
// Contains no literal control characters itself -- they are CONSTRUCTED, because
// every authoring path either interprets or strips them.
const fs = require("fs");
const p = process.argv[2];
const ALLOWED = new Set([9, 10, 13]);
const BACKSLASH = String.fromCharCode(92);

const buf = fs.readFileSync(p);
const hits = [];
for (let i = 0; i < buf.length; i++) {
  const b = buf[i];
  if ((b < 0x20 && !ALLOWED.has(b)) || b === 0x7f) hits.push(b);
}
if (!hits.length) { console.log(`  ${p}: already clean`); process.exit(0); }

let s = buf.toString("utf8");
const seen = new Set(hits);
for (const code of seen) {
  const ch = String.fromCharCode(code);
  const literal = BACKSLASH + "u" + code.toString(16).padStart(4, "0");
  const n = s.split(ch).length - 1;
  s = s.split(ch).join(literal);
  console.log(`  ${p}: replaced ${n} x char code ${code} with the literal text ${literal}`);
}
fs.writeFileSync(p, s, "utf8");

const after = fs.readFileSync(p);
let remaining = 0;
for (let i = 0; i < after.length; i++) {
  const b = after[i];
  if ((b < 0x20 && !ALLOWED.has(b)) || b === 0x7f) remaining++;
}
console.log(`  ${p}: stray controls remaining = ${remaining} (must be 0)`);
