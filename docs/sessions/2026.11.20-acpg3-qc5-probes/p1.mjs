// QC5 probe 1: Q4-1 (C7 judged on the whole read alone). Usage: node p1.mjs <root holding scripts/packout> [probe-id...]
// Runs against whichever packout.mjs the given root holds (the worktree = fix trip 4; qc5/old = the code before it).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
const only = process.argv.slice(3);
const H = await import(pathToFileURL(path.join(root, 'scripts', 'packout', 'test', 'helpers.mjs')).href);
const { goodPackout, check, checkRecorded, verify, verdicts, git, Tx } = H;
const NL = String.fromCharCode(10);
const show = (id, out, keys = ['C7', 'C8', 'C10']) => { const v = verdicts(out); console.log(`${id}\t` + keys.map((k) => `${k}=${v[k]?.v} (${(v[k]?.e || '').slice(0, 150)})`).join(' | ')); };
const P = {};
const commitIn = (f, msg) => git(f.tw, 'commit', '-qm', msg, '--', 'shared/handoff-in.md');
// ---- QC4's four
P.A = () => { const g = goodPackout(); g.tx.edit(g.f.incoming, '# Incoming handoff', '**SUPERSEDED BY:** shared/handoff-out.md' + NL + NL + '# Incoming handoff'); g.tx.flush(); commitIn(g.f, 'sup'); show('A SUPERSEDED banner after re-read', check(g.f).out); };
P.B = () => { const g = goodPackout(); g.tx.edit(g.f.incoming, '# Incoming handoff', '🔒 **HELD-SESSION-DOC** — x · **RETIRE UPON:** y · **OWNER:** ACP · **HELD SINCE:** 2026-11-20' + NL + NL + '# Incoming handoff'); g.tx.flush(); commitIn(g.f, 'held'); show('B HELD banner after re-read', check(g.f).out); };
P.C = () => { const g = goodPackout(); const dst = path.join(g.f.tw, 'shared', 'historical', '2026.11'); fs.mkdirSync(dst, { recursive: true }); git(g.f.tw, 'mv', 'shared/handoff-in.md', 'shared/historical/2026.11/handoff-in.md'); git(g.f.tw, 'commit', '-qm', 'arch', '--', 'shared/handoff-in.md', 'shared/historical/2026.11/handoff-in.md'); show('C git mv archive after re-read (exists now: ' + fs.existsSync(g.f.incoming) + ')', check(g.f).out); };
P.D = () => { const g = goodPackout(); const r0 = checkRecorded(g); fs.writeFileSync(g.f.incoming, '**SUPERSEDED BY:** x' + NL + NL + fs.readFileSync(g.f.incoming, 'utf8')); const r = verify(g, g.f.handoff.replace(/\.md$/, '.packout-report.md')); console.log(`D banner after clean check (check exit ${r0.code})\tverify exit ${r.code}: ${r.out.trim().slice(0, 200)}`); };
// ---- the honest false PASS hunt
P.H1 = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead).flush(); show('H1 no read after begin', check(g.f).out); };
P.H2 = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); g.tx.read(g.f.incoming, { a: 1, b: 6 }); g.tx.flush(); show('H2 read 1-6 of 8 (stops before canary line 7)', check(g.f).out); };
P.H2b = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); g.tx.read(g.f.incoming, { a: 1, b: 7 }); g.tx.flush(); show('H2b read 1-7 of 8 (to the canary, not the trailing empty line)', check(g.f).out); };
P.H3 = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); const e = new Tx(path.join(g.f.root, 'e.jsonl')); e.read(g.f.incoming); g.tx.rows.splice(1, 0, ...e.rows); g.tx.flush(); show('H3 whole read only BEFORE begin', check(g.f).out); };
P.H4a = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); const cp = path.join(g.f.tw, 'shared', 'old', 'handoff-in.md'); fs.mkdirSync(path.dirname(cp), { recursive: true }); fs.copyFileSync(g.f.incoming, cp); g.tx.read(cp); g.tx.flush(); show('H4a whole read of a COPY at shared/old/handoff-in.md', check(g.f).out); };
P.H4b = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); const cp = g.f.incoming + '.bak'; fs.copyFileSync(g.f.incoming, cp); g.tx.read(cp); g.tx.flush(); show('H4b whole read of handoff-in.md.bak', check(g.f).out); };
P.H4c = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); const cp = path.join(g.f.tw, 'shared', 'x-handoff-in.md'); fs.copyFileSync(g.f.incoming, cp); g.tx.read(cp); g.tx.flush(); show('H4c whole read of shared/x-handoff-in.md', check(g.f).out); };
P.H4d = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); g.tx.read(g.f.incoming.replace(/\\/g, '/').toUpperCase()); g.tx.flush(); show('H4d whole read of the SAME file, path upper-cased, forward slashes', check(g.f).out); };
P.H6 = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); g.tx.read(g.f.incoming, { a: 1, b: 3 }); g.tx.read(g.f.incoming, { a: 4, b: 8 }); g.tx.flush(); show('H6 whole read in two windows 1-3, 4-8', check(g.f).out); };
P.H6b = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); g.tx.read(g.f.incoming, { a: 4, b: 8 }); g.tx.read(g.f.incoming, { a: 1, b: 3 }); g.tx.flush(); show('H6b two windows out of order 4-8, then 1-3', check(g.f).out); };
P.H7 = () => { const g = goodPackout(); fs.appendFileSync(g.f.handoff, 'another session added this' + NL); show('H7 OUTGOING changed after its last read (C8 must still compare with now)', check(g.f).out); };
// ---- mixed versions: a whole read, then step 6's banner, then a partial look at the top (an honest packout)
P.H8 = () => { const g = goodPackout(); g.tx.edit(g.f.incoming, '# Incoming handoff', '**SUPERSEDED BY:** shared/handoff-out.md' + NL + NL + '# Incoming handoff'); g.tx.read(g.f.incoming, { a: 1, b: 3 }); g.tx.flush(); commitIn(g.f, 'sup'); show('H8 whole read, banner (+2 lines), then Read 1-3 to see the banner', check(g.f).out); };
// ---- mixed versions: a PARTIAL read, the seat trims the file, then a short look (an honest skip of the whole read)
P.H9 = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); g.tx.read(g.f.incoming, { a: 1, b: 4 }); g.tx.edit(g.f.incoming, '## Uncommitted' + NL + NL + '`shared/carried.md`' + NL + NL, ''); g.tx.read(g.f.incoming, { a: 1, b: 1 }); g.tx.flush(); commitIn(g.f, 'carry'); console.log('   incoming now: ' + JSON.stringify(fs.readFileSync(g.f.incoming, 'utf8'))); show('H9 Read 1-4 of 8 (never the canary), trim 4 lines by Edit, Read 1-1 of 4', check(g.f).out); };
// ---- H9 without the trailing look: does the partial read alone still FAIL?
P.H9b = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); g.tx.read(g.f.incoming, { a: 1, b: 4 }); g.tx.edit(g.f.incoming, '## Uncommitted' + NL + NL + '`shared/carried.md`' + NL + NL, ''); g.tx.flush(); commitIn(g.f, 'carry'); show('H9b Read 1-4 of 8, trim by Edit, no later read', check(g.f).out); };
// ---- a read with no totalLines (numbered text only), then the file archived
P.H10 = () => { const g = goodPackout(); g.tx.blank(g.L.incomingRead); const lines = fs.readFileSync(g.f.incoming, 'utf8').split(NL); g.tx.call('Read', { file_path: g.f.incoming }, lines.map((l, i) => `${i + 1}\t${l}`).join(NL)); g.tx.flush(); show('H10a whole read, NO toolUseResult, file still there', check(g.f).out); fs.mkdirSync(path.join(g.f.tw, 'shared', 'historical', '2026.11'), { recursive: true }); git(g.f.tw, 'mv', 'shared/handoff-in.md', 'shared/historical/2026.11/handoff-in.md'); git(g.f.tw, 'commit', '-qm', 'arch', '--', 'shared/handoff-in.md', 'shared/historical/2026.11/handoff-in.md'); show('H10b the same, then archived by git mv', check(g.f).out); };
for (const [k, f] of Object.entries(P)) { if (only.length && !only.includes(k)) continue; try { f(); } catch (e) { console.log(`${k}\tPROBE CRASHED: ${e.message}`); } }
