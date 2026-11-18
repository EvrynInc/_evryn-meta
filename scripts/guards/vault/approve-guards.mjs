#!/usr/bin/env node
// approve-guards.mjs — the only way anything changes in the vault: Justin, at the keyboard, on a commit (task T-79;
// guards design §1; build brief 1, revised block items 1 and 2; review finding 4; DCG-V, 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// RUN BY JUSTIN ONLY, by double-clicking approve-guards.cmd. NEVER BY AN AGENT: its install step asks Windows for
// administrator rights (a UAC "Yes"), and an agent must never raise a prompt it hopes he clicks.
//
// TWO HALVES, and the split is the security:
//   stage   (unelevated, as Justin): reads EVERY file with `git show <commit>:<path>` (never the working tree, so an
//           uncommitted edit can't ride in), by git's absolute path; strips every key starting "_" from the JSON files;
//           refuses if any source is missing at that commit or managed-settings.json wouldn't parse; writes the files and
//           a plan (each file's SHA-256) to a fresh temp folder; shows what changes against the vault now; asks him to
//           type APPROVE; then asks Windows to run the install half elevated.
//   install (elevated): runs NO git and nothing from PATH (only this file, node.exe by absolute path, and icacls by
//           absolute path). It checks its own hash, the plan's hash (both passed from the stage half on the command
//           line), copies each staged file into a NEW folder, re-hashes each COPY and refuses on any mismatch (so a file
//           swapped in the temp folder after staging can't get in), then swaps the new folder in, writes
//           managed-settings.json last, sets the folder's ACL (Administrators and SYSTEM full, Users read and execute),
//           and logs one line to approvals.log. The previous vault is kept beside it as evryn-guards.prev.
//   release-brake / open-counsel <threadId> (stage then elevated, the same split): Justin's two one-off grants, written
//           to evryn-guards\grants\ (guard Ballot 5 (b): one counsel thread, opened once, for 30 minutes; and the
//           runaway brake's release, review finding 10). Grants survive re-approval.
//
// DRY MODE (tests, and a rehearsal before Thursday): `--dry <folder>` installs into <folder> instead of
// C:\Program Files\ClaudeCode, in-process, with no elevation and no ACL change. `--yes` skips the typed APPROVE (dry
// only). `--meta <commit>` / `--team <commit>` choose the commits (default: origin/main of each repo).
//
// WHAT IT CAN'T SEE: whether the commit itself is good (that is the fresh review's job, before he approves); a git.exe
// replaced under C:\Program Files\Git (admin-only, out of scope); on the FIRST install, this script itself, launched
// from the repo: so the stage half prints its fingerprint and the step card carries the one a fresh reviewer read, and
// he checks they match before typing APPROVE. After the first install he launches only the vault's own copy.

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const SELF = path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const HERE = path.dirname(SELF);
const IN_VAULT = /^file:\/\/\/c:\/program%20files\/claudecode\//i.test(import.meta.url);
const ROOT = 'C:\\Program Files\\ClaudeCode';
const NODE_EXE = 'C:\\Program Files\\nodejs\\node.exe';
const GIT_EXE = 'C:\\Program Files\\Git\\cmd\\git.exe';
const ICACLS = 'C:\\Windows\\System32\\icacls.exe';
const POWERSHELL = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
const FOLDER = 'shared/projects/helm/2026/2026.11.05-admiral-on-a-schedule';

// What goes in the vault, and from where. Nothing else is ever copied (brief 1: "MUST NOT copy anything not named").
// [vault name, repo ('meta' = _evryn-meta, 'team' = evryn-team-workspace), path at the commit]
export const FILES = [
  ...['lib.mjs', 'gmail-guard.mjs', 'compaction.mjs', 'handback.mjs', 'model-switch.mjs', 'subagent-model.mjs', 'secrets-guard.mjs',
    'outbound-gate.mjs', 'browser-guard.mjs', 'config-guard.mjs', 'gate.mjs', 'daily-report.mjs'].map(f => [f, 'meta', `scripts/guards/${f}`]),
  ...['approve-guards.mjs', 'approve-guards.cmd', 'open-counsel-thread.cmd', 'release-brake.cmd', 'outbound-allowlist.json', 'watch.json', 'launcher.json'].map(f => [f, 'meta', `scripts/guards/vault/${f}`]),
  ['ping.mjs', 'meta', 'scripts/ping.mjs'],
  ['counsel-list.md', 'team', 'shared/projects/legal/counsel-list.md'],
  ...['admiral-watch.mjs', 'kill-switch.mjs', 'claude-bin.mjs', 'standing-orders.md', 'standing-orders-thea.md'].map(f => [f, 'team', `${FOLDER}/${f}`]),
  // Slots, added when each is built and approved: the launcher (brief 7), and each agent's orders page (guard Ballot 14).
];
const MANAGED = ['managed-settings.json', 'meta', 'scripts/guards/vault/managed-settings.template.json'];
const KEEP = ['grants', 'approvals.log'];                                 // carried forward from the old vault on every swap

const sha = buf => createHash('sha256').update(buf).digest('hex');
const shaFile = f => sha(fs.readFileSync(f));
const stamp = () => new Date().toISOString();
const say = s => console.log(s);

// Strip every key that starts with "_" at any depth (the templates' notes and canaries), so Claude Code never sees them.
export const stripUnderscore = v => Array.isArray(v) ? v.map(stripUnderscore) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, stripUnderscore(x)])) : v;

// Every hook in the managed settings must run the vault's node.exe on a script that is in the vault list: a template that
// points anywhere else would install a hook outside the vault's protection.
export function checkManaged(obj, names) {
  const problems = [];
  for (const [event, groups] of Object.entries(obj.hooks || {})) for (const g of groups) for (const h of g.hooks || []) {
    if (h.command !== NODE_EXE) problems.push(`${event}: command is not ${NODE_EXE}`);
    const target = (h.args || [])[0] || '';
    const name = target.startsWith(ROOT + '\\evryn-guards\\') ? target.slice((ROOT + '\\evryn-guards\\').length) : null;
    if (!name || !names.includes(name)) problems.push(`${event}: ${target || '(no script)'} is not a vault file`);
  }
  return problems;
}

function git(repoDir, args) {
  const exe = fs.existsSync(GIT_EXE) ? GIT_EXE : null;
  if (!exe) throw new Error(`git isn't at ${GIT_EXE}; the approver won't use a git found on PATH`);
  return execFileSync(exe, ['-C', repoDir, ...args], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

// ---------- stage (unelevated) ----------
export function stage({ codeRoot, metaCommit = 'origin/main', teamCommit = 'origin/main', stageDir }) {
  const repos = { meta: path.join(codeRoot, '_evryn-meta'), team: path.join(codeRoot, 'evryn-team-workspace') };
  const commits = {};
  for (const [k, c] of [['meta', metaCommit], ['team', teamCommit]]) commits[k] = git(repos[k], ['rev-parse', '--verify', `${c}^{commit}`]).toString().trim();
  fs.mkdirSync(stageDir, { recursive: true });
  const plan = { commits, codeRoot, files: {}, managed: null, stagedAt: stamp() };
  const names = [...FILES.map(f => f[0]), 'config.json', 'manifest.json'];
  for (const [name, repo, p] of [...FILES, MANAGED]) {
    let buf;
    try { buf = git(repos[repo], ['show', `${commits[repo]}:${p}`]); } catch { throw new Error(`REFUSED: ${p} is missing at ${repo} commit ${commits[repo].slice(0, 10)}`); }
    if (name.endsWith('.json')) {
      let obj; try { obj = JSON.parse(buf.toString('utf8')); } catch { throw new Error(`REFUSED: ${p} at that commit is not valid JSON`); }
      obj = stripUnderscore(obj);
      if (name === 'managed-settings.json') { const bad = checkManaged(obj, names); if (bad.length) throw new Error(`REFUSED: managed-settings: ${bad.join('; ')}`); }
      buf = Buffer.from(JSON.stringify(obj, null, 2) + '\n');
    }
    fs.writeFileSync(path.join(stageDir, name), buf);
    if (name === 'managed-settings.json') plan.managed = sha(buf); else plan.files[name] = sha(buf);
  }
  const config = Buffer.from(JSON.stringify({ codeRoot }, null, 2) + '\n');
  fs.writeFileSync(path.join(stageDir, 'config.json'), config); plan.files['config.json'] = sha(config);
  // The manifest the gate checks: every vault file but itself, with the commits it came from.
  const manifest = Buffer.from(JSON.stringify({ approvedAt: plan.stagedAt, commits, files: { ...plan.files } }, null, 2) + '\n');
  fs.writeFileSync(path.join(stageDir, 'manifest.json'), manifest); plan.files['manifest.json'] = sha(manifest);
  const planBuf = Buffer.from(JSON.stringify(plan, null, 2));
  fs.writeFileSync(path.join(stageDir, 'plan.json'), planBuf);
  return { plan, planHash: sha(planBuf) };
}

// What changes against the vault as it stands: one line per file.
export function describe(plan, stageDir, root) {
  const vault = path.join(root, 'evryn-guards');
  const lines = [];
  const all = [...Object.keys(plan.files), 'managed-settings.json'];
  for (const name of all) {
    const now = name === 'managed-settings.json' ? path.join(root, name) : path.join(vault, name);
    const want = name === 'managed-settings.json' ? plan.managed : plan.files[name];
    if (!fs.existsSync(now)) { lines.push(`  + ${name} (new)`); continue; }
    if (shaFile(now) === want) continue;
    const a = fs.readFileSync(now, 'utf8').split('\n').length, b = fs.readFileSync(path.join(stageDir, name), 'utf8').split('\n').length;
    lines.push(`  ~ ${name} (changed: ${a} → ${b} lines)`);
  }
  if (fs.existsSync(vault)) for (const f of fs.readdirSync(vault)) if (!all.includes(f) && !KEEP.includes(f)) lines.push(`  - ${f} (removed)`);
  return lines;
}

// ---------- install (elevated) ----------
export function install({ stageDir, planHash, selfHash, root, dry = false }) {
  if (shaFile(SELF) !== selfHash) throw new Error('REFUSED: the approver changed between staging and install');
  const planBuf = fs.readFileSync(path.join(stageDir, 'plan.json'));
  if (sha(planBuf) !== planHash) throw new Error('REFUSED: the plan changed between staging and install');
  const plan = JSON.parse(planBuf.toString('utf8'));
  const vault = path.join(root, 'evryn-guards'), fresh = path.join(root, 'evryn-guards.new'), prev = path.join(root, 'evryn-guards.prev');
  fs.rmSync(fresh, { recursive: true, force: true }); fs.mkdirSync(fresh, { recursive: true });
  for (const [name, want] of Object.entries(plan.files)) {
    if (name.includes('/') || name.includes('\\') || name.includes('..')) throw new Error(`REFUSED: ${name} is not a plain file name`);
    fs.copyFileSync(path.join(stageDir, name), path.join(fresh, name));
    if (shaFile(path.join(fresh, name)) !== want) { fs.rmSync(fresh, { recursive: true, force: true }); throw new Error(`REFUSED: ${name} changed after staging; nothing installed`); }
  }
  const managedBuf = fs.readFileSync(path.join(stageDir, 'managed-settings.json'));
  if (sha(managedBuf) !== plan.managed) { fs.rmSync(fresh, { recursive: true, force: true }); throw new Error('REFUSED: managed-settings.json changed after staging; nothing installed'); }
  JSON.parse(managedBuf.toString('utf8'));                               // Claude Code refuses to START on a bad managed file
  for (const k of KEEP) if (fs.existsSync(path.join(vault, k))) fs.cpSync(path.join(vault, k), path.join(fresh, k), { recursive: true });
  fs.mkdirSync(path.join(fresh, 'grants'), { recursive: true });
  fs.appendFileSync(path.join(fresh, 'approvals.log'), JSON.stringify({ at: stamp(), commits: plan.commits, plan: planHash, files: Object.keys(plan.files).length, managed: plan.managed }) + '\n');
  fs.rmSync(prev, { recursive: true, force: true });
  // The swap. If a hook holds a vault file open, Windows refuses the rename: put the old vault back and stop, so the
  // managed settings never point at a missing folder (their hooks would block every guarded tool call).
  const had = fs.existsSync(vault);
  if (had) fs.renameSync(vault, prev);
  try { fs.renameSync(fresh, vault); }
  catch (e) { if (had) fs.renameSync(prev, vault); throw new Error(`REFUSED: couldn't swap the vault in (${e.code || e.message}); the old vault is back in place. Close Claude Code sessions and run it again.`); }
  const tmp = path.join(root, 'managed-settings.json.new');
  fs.writeFileSync(tmp, managedBuf);
  if (shaFile(tmp) !== plan.managed) throw new Error('REFUSED: managed-settings.json did not write cleanly; the old one stays');
  fs.renameSync(tmp, path.join(root, 'managed-settings.json'));
  if (!dry) lockDown(root);
  return { vault, files: Object.keys(plan.files).length };
}

// Administrators and SYSTEM: full control. Users: read and execute. Inheritance off, so nothing looser carries in.
function lockDown(root) {
  for (const t of [path.join(root, 'evryn-guards'), path.join(root, 'managed-settings.json')]) {
    const dir = fs.statSync(t).isDirectory();
    const g = p => (dir ? `${p}:(OI)(CI)` : `${p}:`);
    execFileSync(ICACLS, [t, '/inheritance:r', '/grant:r', `${g('*S-1-5-32-544')}F`, `${g('*S-1-5-18')}F`, `${g('*S-1-5-32-545')}RX`], { stdio: 'pipe' });
  }
}

// ---------- grants (elevated) ----------
export function grant({ kind, arg, selfHash, root }) {
  if (shaFile(SELF) !== selfHash) throw new Error('REFUSED: the approver changed between asking and granting');
  const dir = path.join(root, 'evryn-guards', 'grants');
  fs.mkdirSync(dir, { recursive: true });
  if (kind === 'brake') fs.writeFileSync(path.join(dir, 'brake-release.json'), JSON.stringify({ releasedAt: stamp() }) + '\n');
  else if (kind === 'counsel') {
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(arg || '')) throw new Error('REFUSED: that is not a Gmail thread id');
    const grantedAt = stamp();
    fs.writeFileSync(path.join(dir, `counsel-${arg}.json`), JSON.stringify({ threadId: arg, grantedAt, expiresAt: new Date(Date.now() + 30 * 60000).toISOString(), singleUse: true }) + '\n');
  } else throw new Error(`unknown grant ${kind}`);
  fs.appendFileSync(path.join(root, 'evryn-guards', 'approvals.log'), JSON.stringify({ at: stamp(), grant: kind, arg: arg || null }) + '\n');
}

// ---------- the command line ----------
const ask = q => new Promise(res => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, a => { rl.close(); res(a.trim()); }); });
function elevate(args) {
  // Windows shows its UAC prompt here. Only Justin, at the keyboard, can answer it.
  const list = args.map(a => `'"${String(a).replace(/'/g, "''")}"'`).join(',');
  const r = spawnSync(POWERSHELL, ['-NoProfile', '-Command', `$p = Start-Process -FilePath '${NODE_EXE}' -ArgumentList ${list} -Verb RunAs -Wait -PassThru; exit $p.ExitCode`], { stdio: 'inherit' });
  return r.status;
}
function opt(argv, name) { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; }
const codeRootFrom = () => {
  if (IN_VAULT) { try { return JSON.parse(fs.readFileSync(path.join(HERE, 'config.json'), 'utf8')).codeRoot; } catch { /* fall through */ } }
  return path.resolve(HERE, '..', '..', '..', '..');                       // scripts/guards/vault → the code root
};

async function cli(argv) {
  const [cmd] = argv;
  const dryRoot = opt(argv, '--dry');
  const root = dryRoot ? path.resolve(dryRoot) : ROOT;
  const selfHash = shaFile(SELF);
  if (cmd === 'install') { const r = install({ stageDir: argv[1], planHash: argv[2], selfHash: argv[3], root, dry: !!dryRoot }); say(`installed ${r.files} files into ${r.vault}`); return 0; }
  if (cmd === 'grant') { grant({ kind: argv[1], arg: argv[2] === '-' ? null : argv[2], selfHash: argv[3], root }); say(`granted ${argv[1]}`); return 0; }

  say(`Evryn vault approver. Fingerprint of this approver: ${selfHash.slice(0, 16)}`);
  say(IN_VAULT ? '(running the vault\'s own copy)' : '⚠️  Running a copy from the repo: check the fingerprint above against your step card before you type anything.');
  if (cmd === 'release-brake' || cmd === 'open-counsel') {
    const kind = cmd === 'release-brake' ? 'brake' : 'counsel', arg = argv[1];
    const word = kind === 'brake' ? 'RELEASE' : 'OPEN';
    say(kind === 'brake' ? 'This releases the runaway brake: the scheduled Admiral may wake again.' : `This lets ONE agent read ONE counsel thread (${arg}), once, within the next 30 minutes.`);
    if ((await ask(`Type ${word} to go ahead: `)) !== word) { say('Nothing done.'); return 1; }
    if (dryRoot) { grant({ kind, arg, selfHash, root }); say('granted (dry)'); return 0; }
    return elevate([SELF, 'grant', kind, arg || '-', selfHash]);
  }
  if (cmd !== 'stage') { say('usage: approve-guards.mjs stage [--meta <commit>] [--team <commit>] [--dry <folder> [--yes]] | release-brake | open-counsel <threadId>'); return 2; }
  const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evryn-guards-stage-'));
  const { plan, planHash } = stage({ codeRoot: opt(argv, '--code-root') || codeRootFrom(), metaCommit: opt(argv, '--meta'), teamCommit: opt(argv, '--team'), stageDir });
  say(`From _evryn-meta ${plan.commits.meta.slice(0, 10)} and evryn-team-workspace ${plan.commits.team.slice(0, 10)}:`);
  const lines = describe(plan, stageDir, root);
  say(lines.length ? lines.join('\n') : '  (nothing changes)');
  if (!(dryRoot && argv.includes('--yes'))) {
    if ((await ask('Type APPROVE to install these into the vault (Windows will then ask you "Yes"): ')) !== 'APPROVE') { say('Nothing installed.'); return 1; }
  }
  if (dryRoot) { const r = install({ stageDir, planHash, selfHash, root, dry: true }); say(`installed ${r.files} files into ${r.vault} (dry)`); return 0; }
  const status = elevate([SELF, 'install', stageDir, planHash, selfHash]);
  say(status === 0 ? 'Installed. Open a NEW Claude Code session and run /status: it should list the managed settings file.' : `The install did not finish (exit ${status}). Nothing half-installed is left in place; tell Soren.`);
  return status;
}

const direct = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === SELF.toLowerCase();
if (direct) cli(process.argv.slice(2)).then(c => process.exit(c ?? 0), e => { console.error(String(e.message || e)); process.exit(1); });

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
