// QC5 probe 2: Q4-2 (C12 under either name), Q4-6 (beginsNaming needs a real run), and C10's incoming half after a git mv archive.
// Usage: node p2.mjs <root holding scripts/packout> [probe-id...]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
const only = process.argv.slice(3);
const H = await import(pathToFileURL(path.join(root, 'scripts', 'packout', 'test', 'helpers.mjs')).href);
const { goodPackout, check, checkRecorded, verify, verdicts, git, Tx, run } = H;
const NL = String.fromCharCode(10);
const show = (id, out, keys) => { const v = verdicts(out); console.log(`${id}\t` + keys.map((k) => `${k}=${v[k]?.v} (${(v[k]?.e || '').slice(0, 170)})`).join(' | ')); };
const P = {};
const OLD = '2026.10.19-consolidation-standup-near-zero-campaign.md', NEW = '2026.10.19-near-zero-campaign.md';
// ---- Q4-2
P.E1 = () => { const g = goodPackout({ nzName: OLD }); show('E1 table written at the OLD name', check(g.f).out, ['C12']); };
P.E2 = () => { const g = goodPackout({ nzName: NEW }); show('E2 table written at the NEW name', check(g.f).out, ['C12']); };
P.E3 = () => { const g = goodPackout(); g.tx.blank(g.L.nz).flush(); show('E3 no write, no PACKOUT-NONE C12 line', check(g.f).out, ['C12']); };
// a file that shares PART of the name, written instead of the table
const partial = (name, sub) => () => { const g = goodPackout(); g.tx.blank(g.L.nz); const p = path.join(g.f.tw, 'shared', ...sub, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, '# x' + NL); g.tx.edit(p, '# x', '# x' + NL + 'row'); g.tx.flush(); git(g.f.tw, 'add', '-A'); git(g.f.tw, 'commit', '-qm', 'p'); show(`partial-name write: shared/${sub.join('/')}/${name}`, check(g.f).out, ['C12']); };
P.E4 = partial('2026.10.19-near-zero-campaign-notes.md', ['projects', 'helm', '2026']);
P.E5 = partial('near-zero-campaign.md', ['projects', 'helm', '2026']);
P.E6 = partial('x-2026.10.19-near-zero-campaign.md', ['projects', 'helm', '2026']);
P.E7 = partial('2026.10.19-near-zero-campaign.md.bak', ['projects', 'helm', '2026']);
// an exact-name file somewhere ELSE under shared (walkFind returns the first one it meets)
P.E8 = () => { const g = goodPackout({ nzName: OLD }); g.tx.blank(g.L.nz); const p = path.join(g.f.tw, 'shared', 'projects', 'growth', NEW); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, '# a stray copy' + NL); g.tx.edit(p, '# a stray copy', '# a stray copy' + NL + 'row'); g.tx.flush(); git(g.f.tw, 'add', '-A'); git(g.f.tw, 'commit', '-qm', 'p'); show('E8 exact NEW name, but a stray copy at shared/projects/growth/ (the real table is at the OLD name)', check(g.f).out, ['C12']); };
// the table under historical/ (walkFind skips historical folders)
P.E9 = () => { const g = goodPackout({ nzName: OLD }); g.tx.blank(g.L.nz); const p = path.join(g.f.tw, 'shared', 'projects', 'helm', '2026', 'historical', NEW); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, '# old' + NL); g.tx.edit(p, '# old', '# old' + NL + 'row'); g.tx.flush(); git(g.f.tw, 'add', '-A'); git(g.f.tw, 'commit', '-qm', 'p'); show('E9 a write to an archived copy under .../historical/', check(g.f).out, ['C12']); };
// ---- Q4-6
const ghost = 'ffffffff-0000-0000-0000-000000000000';
const editMeta = (rep, fn) => { const t = fs.readFileSync(rep, 'utf8'); const m = /```json\n([\s\S]*?)\n```/.exec(t); const j = JSON.parse(m[1]); fn(j); fs.writeFileSync(rep, t.replace(m[1], JSON.stringify(j))); };
const passed = () => { const g = goodPackout(); const r = checkRecorded(g); if (r.code !== 0) throw new Error('baseline check failed'); return { g, rep: g.f.handoff.replace(/\.md$/, '.packout-report.md') }; };
P.Q6p7 = () => { const { g, rep } = passed(); editMeta(rep, (j) => { j.machine = 'SOME-OTHER-HOST'; }); const c = new Tx(path.join(g.f.root, 'projects', 'proj', 'checkersess.jsonl')); c.user('check the packout'); c.bash('grep -n "packout.mjs begin\\|PREDECESSOR" start-line.txt', `3:PREDECESSOR: testsess · HANDOFF: ${g.f.handoff} · REPORT: ${rep}`); c.flush(); fs.renameSync(g.f.transcript, g.f.transcript + '.elsewhere'); const r = verify(g, rep); console.log(`Q6 p7 (cross-machine + a grep whose output is the footer)\texit ${r.code}: ${r.out.trim().slice(0, 170)}`); };
P.Q6p7b = () => { const { g, rep } = passed(); editMeta(rep, (j) => { j.machine = 'SOME-OTHER-HOST'; }); const c = new Tx(path.join(g.f.root, 'projects', 'proj', 'checkersess.jsonl')); c.user('check'); c.bash(`echo "node packout.mjs begin --agent soren --handoff ${g.f.handoff.replace(/\\/g, '/')}"; cat start-line.txt`, `node packout.mjs begin …${NL}PREDECESSOR: testsess · HANDOFF: ${g.f.handoff} · REPORT: ${rep}`); c.flush(); fs.renameSync(g.f.transcript, g.f.transcript + '.elsewhere'); const r = verify(g, rep); console.log(`Q6 p7b (cross-machine + an echo of a begin command plus cat of the footer)\texit ${r.code}: ${r.out.trim().slice(0, 170)}`); };
P.Q6ghost = () => { const g = goodPackout(); g.tx.blank(g.L.memory).flush(); checkRecorded(g); const rep = g.f.handoff.replace(/\.md$/, '.packout-report.md'); editMeta(rep, (j) => { j.session = ghost; j.machine = 'SOME-OTHER-HOST'; j.verdicts.C1 = 'PASS'; }); const r = run(g.f, 'verify', '--report', rep, '--predecessor', ghost, '--handoff', g.f.handoff); console.log(`Q6 GHOST (a real begin row names the handoff)\texit ${r.code}: ${r.out.trim().slice(0, 200)}`); };
P.Q6ghostCd = () => { const g = goodPackout(); g.tx.blank(g.L.memory); g.tx.bash(`cd C:/x && node C:/Users/x/_evryn-meta/scripts/packout/packout.mjs begin --agent soren --handoff ${g.f.handoff.replace(/\\/g, '/')} 2>&1 | tail -3`, `PREDECESSOR: testsess · HANDOFF: ${g.f.handoff} · REPORT: x${NL}BEGIN-ARGS: agent=soren · incoming=-`); g.tx.flush(); checkRecorded(g); const rep = g.f.handoff.replace(/\.md$/, '.packout-report.md'); editMeta(rep, (j) => { j.session = ghost; j.machine = 'SOME-OTHER-HOST'; }); fs.renameSync(g.f.transcript, g.f.transcript.replace('testsess', 'renamedsess')); const r = run(g.f, 'verify', '--report', rep, '--predecessor', ghost, '--handoff', g.f.handoff); console.log(`Q6 GHOST, begin typed as 'cd … && node <abs path> begin … | tail'\texit ${r.code}: ${r.out.trim().slice(0, 200)}`); };
P.Q6dup = () => { const { g, rep } = passed(); editMeta(rep, (j) => { j.machine = 'SOME-OTHER-HOST'; }); const dup = path.join(g.f.root, 'projects', 'proj2', 'testsess.jsonl'); fs.mkdirSync(path.dirname(dup), { recursive: true }); fs.copyFileSync(g.f.transcript, dup); const r = verify(g, rep); console.log(`Q6 DUP\texit ${r.code}: ${r.out.trim().slice(0, 170)}`); };
// ---- C10's incoming half once the incoming is archived (Q4-1 made that legal)
P.X1 = () => { const g = goodPackout(); fs.writeFileSync(path.join(g.f.tw, 'shared', 'carried.md'), 'changed, uncommitted' + NL); fs.writeFileSync(g.f.handoff, fs.readFileSync(g.f.handoff, 'utf8').replace('`shared/carried.md`' + NL, '')); g.tx.read(g.f.handoff); g.tx.flush(); show('X1 incoming in place, its uncommitted path dropped from the outgoing list', check(g.f).out, ['C7', 'C10']); };
P.X2 = () => { const g = goodPackout(); fs.writeFileSync(path.join(g.f.tw, 'shared', 'carried.md'), 'changed, uncommitted' + NL); fs.writeFileSync(g.f.handoff, fs.readFileSync(g.f.handoff, 'utf8').replace('`shared/carried.md`' + NL, '')); g.tx.read(g.f.handoff); g.tx.flush(); fs.mkdirSync(path.join(g.f.tw, 'shared', 'historical', '2026.11'), { recursive: true }); git(g.f.tw, 'mv', 'shared/handoff-in.md', 'shared/historical/2026.11/handoff-in.md'); git(g.f.tw, 'commit', '-qm', 'arch', '--', 'shared/handoff-in.md', 'shared/historical/2026.11/handoff-in.md'); show('X2 the SAME, then step 6 archives the incoming by git mv', check(g.f).out, ['C7', 'C10']); };
for (const [k, f] of Object.entries(P)) { if (only.length && !only.includes(k)) continue; try { f(); } catch (e) { console.log(`${k}\tPROBE CRASHED: ${e.message}`); } }
