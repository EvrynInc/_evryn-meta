#!/usr/bin/env node
// daily-report.mjs — the guards' section of Justin's morning brief (guards design §1.5 and §1.3 revised; build brief 1
// item 4; DCG-V, 2026-11-18). No model. The Admiral runs it and pastes its output into the daily brief.
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
//   node daily-report.mjs [--since <ISO>] [--mark] [--ref <git ref, default origin/main>] [--code-root <dir>] [--no-tasks]
//
// It reports, as markdown:
//   1. every commit since the last report that touches the watchlist (team CLAUDE.md, agent definitions, the Hub and
//      spokes, the protocols, authorization-rules, the counsel list, both settings files, the guard and scheduled-Admiral
//      code), with its commit, author, date, subject and any session named in the subject (Justin's 11/12 ask: "when any
//      of the protected docs were changed, and track them to our particular sessions");
//   2. "changed in the repo, not yet approved": each vault file whose version at <ref> differs from what the vault holds
//      (review finding 17: an edit there simply doesn't run until he approves it, so this is the list he approves from);
//   3. per machine: the vault's approved commits and time, the counsel list's entry count (zero is an alarm: probe E),
//      each scheduled task's state and whether only administrators can change it, each scheduled state folder's STOP and
//      its last gate-log line (and whether the gate's URGENT ping was delivered: QCI finding 5), today's guard-log counts
//      by guard and event (never content), and the settings changes the config guard held back (QCI finding 13).
//   Every git read has replace refs off and every object re-hashed (approve-guards' readVerified; QCI finding 2).
//   --state <dir> (repeatable) names the state folders; by default the code root's state and state-thea.
// --mark records this run's time, so the next report starts there. Read-only otherwise: it changes no task, file or repo.
//
// WHAT IT CAN'T SEE: a change made and reverted between two reports, if the commits were squashed away; work that was
// never committed (only the vault hooks guard that); a session that names itself falsely in a commit message; another
// machine (each machine runs its own report).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { VAULT, DATA, readJSON, loadCounsel } from './lib.mjs';

const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CODE = opt('--code-root') || readJSON(path.join(VAULT, 'config.json'), {}).codeRoot || path.resolve(HERE, '..', '..', '..');
const REF = opt('--ref') || 'origin/main';
const GIT = fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
const POWERSHELL = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
const LAST = path.join(DATA, 'daily-report-last.json');
const since = opt('--since') || readJSON(LAST, {}).at || new Date(Date.now() - 24 * 3600000).toISOString();
const FOLDER = 'shared/projects/helm/2026/2026.11.05-admiral-on-a-schedule';
const REPOS = { meta: path.join(CODE, '_evryn-meta'), team: path.join(CODE, 'evryn-team-workspace') };
const WATCH = {
  team: ['CLAUDE.md', '.claude/agents', '.claude/settings.json', 'shared/protocols', 'shared/projects/legal/counsel-list.md', FOLDER],
  meta: ['docs/hub', 'docs/protocols', '.claude/settings.json', 'scripts/guards', 'scripts/ping.mjs'],
};
// Replace refs off and GIT_* dropped, as in the approver (QCI finding 2): otherwise a `git replace` could make "not yet
// approved" agree with a doctored file.
const GIT_ENV = { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/i.test(k))), GIT_NO_REPLACE_OBJECTS: '1', GIT_CONFIG_NOSYSTEM: '1' };
const git = (repo, args) => execFileSync(GIT, ['--no-replace-objects', '-c', 'core.useReplaceRefs=false', '-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024, env: GIT_ENV });
// The scheduled-Admiral state folders whose STOP and gate log this machine's report shows (QCI finding 5). --state <dir>
// (repeatable) names others, for tests.
const STATES = (() => { const s = []; argv.forEach((a, i) => { if (a === '--state') s.push(argv[i + 1]); }); return s.length ? s : ['state', 'state-thea'].map(d => path.join(REPOS.team, ...FOLDER.split('/'), d)); })();
const sha = b => createHash('sha256').update(b).digest('hex');
const out = [];

// 1 · Commits to the watchlist
out.push(`### Guards: changes to protected files since ${since.slice(0, 16).replace('T', ' ')}`);
let any = false;
for (const [k, repo] of Object.entries(REPOS)) {
  let log = '';
  try { log = git(repo, ['log', REF, `--since=${since}`, '--format=@@%h\t%an\t%ad\t%s', '--date=format:%m/%d %H:%M', '--name-only', '--', ...WATCH[k]]); } catch (e) { out.push(`- ⚠️ ${k}: couldn't read the log (${String(e.message).split('\n')[0]})`); continue; }
  for (const block of log.split('@@').filter(Boolean)) {
    const [head, ...files] = block.trim().split('\n'); const [hash, author, date, subject] = head.split('\t');
    const session = (subject.match(/\[[0-9a-f]{6}\]|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0];
    out.push(`- ${k === 'meta' ? '_evryn-meta' : 'team workspace'} \`${hash}\` ${date}, ${author}${session ? `, session ${session}` : ''}: ${subject.slice(0, 140)} (${files.filter(Boolean).length} file${files.filter(Boolean).length === 1 ? '' : 's'})`);
    any = true;
  }
}
if (!any) out.push('- none');

// 2 · In the repo, not yet approved into the vault
const manifest = readJSON(path.join(VAULT, 'manifest.json'), null);
out.push('', '### Guards: in the repo, not yet approved into the vault');
if (!manifest) out.push('- the vault isn\'t installed on this machine (no manifest)');
else {
  const { FILES, stripUnderscore, readVerified, gitRaw } = await import(new URL('./approve-guards.mjs', import.meta.url).href).catch(() => import(new URL('./vault/approve-guards.mjs', import.meta.url).href));
  const pending = [];
  const at = {};
  for (const [name, repo, p] of FILES) {
    let buf;
    try { at[repo] ??= gitRaw(REPOS[repo], ['rev-parse', '--verify', `${REF}^{commit}`]).toString().trim(); buf = readVerified(REPOS[repo], at[repo], p).buf; }
    catch (e) { pending.push(`${name} (${/doctored|resolves/.test(e.message) ? 'a doctored git object: tell Soren' : `missing at ${REF}`})`); continue; }
    if (name.endsWith('.json')) { try { buf = Buffer.from(JSON.stringify(stripUnderscore(JSON.parse(buf.toString('utf8'))), null, 2) + '\n'); } catch { pending.push(`${name} (not valid JSON at ${REF})`); continue; } }
    if (manifest.files?.[name] !== sha(buf)) pending.push(name);
  }
  out.push(pending.length ? pending.map(n => `- ${n}`).join('\n') : '- none: the vault matches the repo');
}

// 3 · This machine
out.push('', `### Guards: this machine (${os.hostname()})`);
out.push(manifest ? `- vault approved ${String(manifest.approvedAt).slice(0, 16).replace('T', ' ')}, from _evryn-meta \`${String(manifest.commits?.meta).slice(0, 10)}\` and team workspace \`${String(manifest.commits?.team).slice(0, 10)}\`` : '- vault: not installed');
const { entries } = loadCounsel();
out.push(entries.length ? `- counsel list: ${entries.length} entries read` : '- 🔴 counsel list: ZERO entries read. The counsel-mail guard is refusing every body read until this is fixed.');
if (!argv.includes('--no-tasks')) {
  const names = ['Admiral', 'Thea'].flatMap(r => ['Watch', 'Morning', 'Midday'].map(t => `Evryn-${r}-${t}`));
  const ps = `$svc = New-Object -ComObject Schedule.Service; $svc.Connect(); foreach ($n in '${names.join("','")}') { try { $t = $svc.GetFolder('\\').GetTask($n); "$n|$($t.Enabled)|$($t.GetSecurityDescriptor(4))" } catch { "$n|missing|" } }`;
  let rows = []; try { rows = execFileSync(POWERSHELL, ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8', timeout: 60000 }).trim().split(/\r?\n/); } catch (e) { out.push(`- ⚠️ couldn't read the scheduled tasks (${String(e.message).split('\n')[0]})`); }
  for (const r of rows) {
    const [n, enabled, sddl] = r.split('|'); if (enabled === 'missing') continue;
    const adminOnly = /^D:P\(A;;FA;;;BA\)\(A;;FA;;;SY\)\(A;;FRFX;;;S-[\d-]+\)$/.test(sddl || '');
    out.push(`- ${n}: ${enabled === 'True' ? 'enabled' : '⚠️ DISABLED'}, ${adminOnly ? 'only administrators can change it' : '⚠️ changeable without administrator rights'}`);
  }
}
// Each scheduled state folder: is it STOPPED, and what did the gate last do? (QCI finding 5: gate.mjs's header relies on
// this report showing both.)
for (const s of STATES) {
  const stop = path.join(s, 'STOP'); const gl = path.join(s, 'gate-log.jsonl');
  if (!fs.existsSync(s)) continue;
  let last = null; try { last = fs.readFileSync(gl, 'utf8').trim().split('\n').at(-1); } catch { /* no gate log yet */ }
  const alarm = readJSON(path.join(s, 'gate-alarm.json'), null);
  out.push(`- ${path.basename(s)}: ${fs.existsSync(stop) ? `🔴 STOPPED (${fs.readFileSync(stop, 'utf8').trim().slice(0, 200)})` : 'running (no STOP)'}${alarm && alarm.delivered === false ? '; ⚠️ the gate\'s URGENT ping has NOT been delivered' : ''}`);
  out.push(`  - last gate run: ${last ? last.slice(0, 300) : 'none logged'}`);
}
const today = new Date().toISOString().slice(0, 10);
const counts = {}; const configBlocks = [];
try { for (const l of fs.readFileSync(path.join(DATA, 'guard-log.jsonl'), 'utf8').split('\n')) { let e = null; try { e = JSON.parse(l); } catch { /* skip a torn line */ } if (e && String(e.at).startsWith(today)) { const k = `${e.guard} ${e.event}`; counts[k] = (counts[k] || 0) + 1; if (e.guard === 'config' && e.event === 'blocked') configBlocks.push(`${e.source}${e.file ? ` (${e.file})` : ''}`); } } } catch { /* no log yet */ }
out.push(Object.keys(counts).length ? `- guard events today: ${Object.entries(counts).map(([k, v]) => `${k} ×${v}`).join(', ')}` : '- guard events today: none');
// The config guard blocks silently (the session isn't told), so its blocks get their own line (QCI finding 13).
out.push(configBlocks.length ? `- ⚠️ settings or skill changes held back from unattended sessions today (they apply from the next session): ${configBlocks.slice(0, 10).join(', ')}` : '- settings changes held back from unattended sessions today: none');

console.log(out.join('\n'));
if (argv.includes('--mark')) { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(LAST, JSON.stringify({ at: new Date().toISOString() })); }

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
