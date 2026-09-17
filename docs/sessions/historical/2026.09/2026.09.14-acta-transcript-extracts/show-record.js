// Prints ACT-A's raw transcript records by line number, unwrapping tool-result text, so an extract reader can see exactly what ACT-A saw.
// Usage (from C:/Users/Justin/Evryn/Code): node _evryn-meta/.cache/acta-packout/show-record.js <line> [<line> ...]
const fs = require('fs');
const NL = String.fromCharCode(10);
const SRC = 'C:/Users/Justin/.claude/projects/c--Users-Justin-Evryn-Code--evryn-meta/35277727-fd2f-4919-a979-60f7e91043c1.jsonl';
const lines = fs.readFileSync(SRC, 'utf8').split(NL);
for (const arg of process.argv.slice(2)) {
  const raw = lines[Number(arg) - 1];
  if (!raw) { console.log('===== L' + arg + ' — no such line'); continue; }
  const o = JSON.parse(raw);
  console.log('===== L' + arg + ' · type ' + o.type + ' · ' + (o.timestamp || ''));
  const m = o.message;
  if (m && Array.isArray(m.content)) {
    for (const c of m.content) {
      if (c.type === 'tool_result') console.log(typeof c.content === 'string' ? c.content : (c.content || []).map(x => x.text || '[' + x.type + ']').join(NL));
      else if (c.type === 'text') console.log(c.text);
      else console.log(JSON.stringify(c, null, 1));
    }
  } else if (o.attachment) {
    const p = o.attachment.prompt;
    console.log(typeof p === 'string' ? p : JSON.stringify(o.attachment, null, 1));
  } else {
    console.log(JSON.stringify(o, null, 1));
  }
}
