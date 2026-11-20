// Counsel Soren's honest-path probes. Read-only against the worktree code; all state in OS temp roots.
import fs from 'node:fs';
import path from 'node:path';
const W = 'file:///C:/Users/jbmcg/Evryn/Code/_evryn-meta-packout-guard/scripts/packout/test/helpers.mjs';
const { Tx, codeRoot, run, verdicts, git, goodPackout, checkRecorded, verify } = await import(W);
const show = (label, r) => {
  const v = verdicts(r.out); console.log(`\n## ${label} (exit ${r.code})`);
  for (const c of Object.keys(v)) if (v[c].v !== 'PASS' || /^(C7|C10|C1)$/.test(c)) console.log(`  ${v[c].v}\t${c}\t${v[c].e.slice(0, 220)}`);
  if (r.err) console.log('  stderr: ' + r.err.trim().slice(0, 300));
};

function build({ incomingArg = 'real', agentArg = 'soren', readIncoming = true, listLine = null, dropCarried = false, rebegin = null } = {}) {
  const f = codeRoot('soren'); const tx = new Tx(f.transcript);
  if (listLine) { fs.writeFileSync(f.incoming, `# Incoming handoff\n\n## Uncommitted\n\n${listLine}\n\nTruncation canary — DO NOT REMOVE: FULL FILE LOADED\n`); git(f.tw, 'commit', '-qam', 'incoming form'); }
  tx.user('pack out'); tx.say('ok'); tx.flush();
  const inc = incomingArg === 'real' ? f.incoming : incomingArg;
  const bargs = ['begin', '--agent', agentArg, '--handoff', f.handoff, ...(inc ? ['--incoming', inc] : []), '--transcript', f.transcript];
  let r = run(f, ...bargs); tx.bash(`node packout.mjs ${bargs.slice(0, -2).join(' ')}`, r.out + r.err); tx.flush();
  const out = { begin1: r };
  if (r.code !== 0) return { f, tx, refused: true, ...out }; // DC3 copy: a refused begin ends the build (P1 after fix trip 6)
  if (rebegin) { const b2 = rebegin(f); r = run(f, ...b2); tx.bash(`node packout.mjs ${b2.slice(0, -2).join(' ')}`, r.out + r.err); tx.flush(); out.begin2 = r; }
  tx.edit(f.memory, '# file', '# file\n\nnote');
  tx.bash(`node _evryn-meta/scripts/append-entry.mjs ${f.cs.replace(/\\/g, '/')} e.md`, ''); fs.appendFileSync(f.cs, 'x\n');
  tx.edit(f.top, '# file', '# file\nrow'); tx.bash('node scripts/tasks/tasks.mjs update T-1 --note "x"', ''); tx.edit(f.nz, '# file', '# file\n| r |');
  if (readIncoming) tx.read(f.incoming);
  tx.flush();
  const sw = () => { tx.flush(); const s = run(f, 'sweep', '--handoff', f.handoff, '--transcript', f.transcript); tx.bash('node packout.mjs sweep --handoff h', s.out); tx.read(s.out.match(/sweep \d+: (.*?) \(/)[1]); tx.flush(); };
  sw();
  if (dropCarried) fs.writeFileSync(path.join(f.tw, 'shared', 'carried.md'), 'dirty\n');
  tx.write(f.handoff, `# Out\n\n## Uncommitted\n\n\`shared/handoff-out.md\`\n${dropCarried ? '' : '`shared/carried.md`\n'}\nTruncation canary — DO NOT REMOVE: FULL FILE LOADED\n`);
  sw();
  const fe = f.handoff.replace(/\.md$/, '.fresh-eyes.md'); fs.writeFileSync(fe, '# F\n\nnone\n\nTruncation canary — DO NOT REMOVE: FULL FILE LOADED\n');
  tx.read(fe); tx.read(f.handoff); tx.flush();
  git(f.tw, 'add', '.claude', 'shared/current-state', 'shared/projects'); git(f.tw, 'commit', '-qm', 'seat');
  return { f, tx, ...out };
}
const chk = (f) => run(f, 'check', '--handoff', f.handoff, '--transcript', f.transcript);

{ const g = build({}); show('P0 control: the builder itself passes', chk(g.f)); }
{ const g = build({ incomingArg: null, readIncoming: false }); if (g.refused) console.log(`\n## P1 --incoming omitted: begin exit ${g.begin1.code} | ${g.begin1.err.trim().slice(0, 220)}`); else show('P1 --incoming omitted, incoming never re-read', chk(g.f)); }
{ const g = build({ readIncoming: false }); show('P1b control: --incoming given, never re-read', chk(g.f)); }
{ const g = build({ incomingArg: 'C:/nowhere/handof-in.md', rebegin: (f) => ['begin', '--agent', 'soren', '--handoff', f.handoff, '--incoming', f.incoming, '--transcript', f.transcript] });
  console.log('\n## P2 second begin correcting a typo in --incoming: exit', g.begin2.code, '|', (g.begin2.err || g.begin2.out).trim().slice(0, 220));
  show('P2 check after the correction (the real incoming WAS re-read)', chk(g.f)); }
{ const g = build({ agentArg: 'sorne', rebegin: (f) => ['begin', '--agent', 'soren', '--handoff', f.handoff, '--incoming', f.incoming, '--transcript', f.transcript] });
  console.log('\n## P3 second begin correcting a typo in --agent: exit', g.begin2.code, '|', (g.begin2.err || g.begin2.out).trim().slice(0, 220));
  show('P3 check after the correction (memory WAS written)', chk(g.f)); }
{ const g = build({ listLine: '`evryn-team-workspace/shared/carried.md`', dropCarried: true }); show('P4 incoming list in shared-parent form, dropped and left dirty', chk(g.f)); }
{ const g = build({ dropCarried: true }); show('P4b control: repo-relative list, dropped and left dirty', chk(g.f)); }
{ const g = build({ listLine: '`./shared/carried.md`', dropCarried: true }); show('P4c ./-prefixed list, dropped and left dirty', chk(g.f)); }
{ const g = build({ listLine: '`shared\\carried.md`', dropCarried: true }); show('P4d backslash list, dropped and left dirty', chk(g.f)); }
{ const g = goodPackout(); checkRecorded(g); const r2 = checkRecorded(g); const v = verify(g, g.f.handoff.replace(/\.md$/, '.packout-report.md'));
  console.log('\n## P5 check run twice: second exit', r2.code, '| verify', v.code, v.out.trim().slice(0, 120)); }
{ const f = codeRoot(); const tx = new Tx(f.transcript); tx.user('x'); tx.say('y'); tx.flush();
  const gb = f.handoff.replace(/\\/g, '/').replace(/^([A-Za-z]):\//, (_, d) => `/${d.toLowerCase()}/`);
  const r0 = run(f, 'begin', '--agent', 'soren', '--handoff', gb, '--transcript', f.transcript); console.log(`\n## P6 as committed (no --incoming): begin exit ${r0.code}`);
  const r = run(f, 'begin', '--agent', 'soren', '--handoff', gb, '--incoming', 'none', '--transcript', f.transcript); tx.bash(`node packout.mjs begin --agent soren --handoff ${gb} --incoming none`, r.out); tx.flush();
  const c = run(f, 'check', '--handoff', f.handoff, '--transcript', f.transcript);
  console.log('\n## P6 begin with a Git-Bash path, check with a Windows path: exit', c.code, '| anchored?', !/nothing can be anchored|no packout state/.test(c.err), '|', (c.err || '').trim().slice(0, 150)); }
{ const g = goodPackout(); g.tx.edit(g.fe, 'none', 'none (folded by the seat)'); g.tx.read(g.fe); g.tx.flush(); show('P7 seat annotates the findings file as folded', chk(g.f)); }
{ const g = goodPackout(); g.tx.blank(g.L.memory).flush(); const r1 = checkRecorded(g); g.tx.edit(g.f.memory, 'note', 'note\nmore'); g.tx.flush(); git(g.f.tw, 'commit', '-qam', 'mem');
  const r2 = checkRecorded(g); const v = verify(g, g.f.handoff.replace(/\.md$/, '.packout-report.md'));
  console.log('\n## P8 FAIL, repair, re-check: first', r1.code, 'second', r2.code, '| verify', v.code, v.out.trim().slice(0, 100)); }
