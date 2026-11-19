#!/usr/bin/env node
// approve-guards.mjs — the only way anything changes in the vault: Justin, at the keyboard, on a commit (task T-79;
// guards design §1; build brief 1, revised block items 1 and 2; review finding 4; DCG-V, 2026-11-18; QCI fixes, DCF,
// 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// RUN BY JUSTIN ONLY, by double-clicking approve-guards.cmd. NEVER BY AN AGENT: its install step asks Windows for
// administrator rights (a UAC "Yes"), and an agent must never raise a prompt it hopes he clicks.
//
// TWO HALVES, and the split is the security:
//   stage   (unelevated, as Justin): refuses if NODE_OPTIONS or NODE_PATH is set (QCI finding 3). Reads EVERY file from
//           the commit through git's object database with replace refs OFF, and re-hashes every object it walks (the
//           commit, each tree, each blob) against its own id, so a `git replace` ref or a doctored loose object can't
//           change what a reviewed commit id installs (QCI finding 2). Strips every key starting "_" from the JSON files;
//           refuses if any source is missing, if the managed settings' hooks aren't exactly the vault's launcher form,
//           if watch.json's claude.exe floor differs from the managed settings' requiredMinimumVersion, or if any
//           `claude` in the places claudeFiles() lists (the PATH, ~/.local/bin, four editors' extension folders; QCR
//           New 3) is older than that floor (QCI finding 8). Hashes each pinned script of the outbound allowlist and its
//           whole import closure at the commit into a vault outbound-pins.json (QCR New 1). Deletes its temp stage folder
//           after an install and on any refusal (QCR New 7). Copies the team .env's Slack webhook into
//           a vault-only webhook.json, showing only its host and last 6 characters (QCI finding 5). Writes the files and
//           a plan (each file's SHA-256 and git blob id) to a fresh temp folder; shows what changes; asks him to type
//           APPROVE; then elevates.
//   elevation (QCI findings 3 and 4): Windows is asked to run C:\Windows\System32\cmd.exe /d (no AutoRun), which clears
//           the .NET profiler and NODE_* variables and starts powershell.exe -NoProfile -EncodedCommand <script>. The
//           script's text is on the command line, not in a file. It copies this approver into a fresh folder under
//           C:\Program Files\ClaudeCode, which users can't write, checks the COPY against the full 64-hex fingerprint
//           this half printed, and only then runs node.exe on the copy. No user-writable file runs elevated.
//   install (elevated, the copy): runs NO git and nothing from PATH. It checks its own hash and the plan's hash, copies
//           each staged file into a NEW folder, re-hashes each COPY and refuses on any mismatch, swaps the new folder in,
//           writes managed-settings.json last, sets the folder's ACL (Administrators and SYSTEM full, Users read and
//           execute), and logs one line to approvals.log. The previous vault is kept beside it as evryn-guards.prev.
//   release-brake / open-counsel <threadId> [sessionId] (stage then elevated, the same split): Justin's two one-off
//           grants, written to evryn-guards\grants\ (guard Ballot 5 (b): one counsel thread, opened once, for 10
//           minutes, bound to one session when he names it; and the runaway brake's release, review finding 10).
//
// DRY MODE (tests, and a rehearsal): `--dry <folder>` installs into <folder> instead of C:\Program Files\ClaudeCode,
// with no elevation and no ACL change. `--yes` skips the typed APPROVE (dry only). `--via-wrapper` (dry only) runs the
// real elevation wrapper without asking Windows to elevate. `--fake-claude <v,v>` (dry only) stands in for the installed
// claude versions. `--meta <commit>` / `--team <commit>` choose the commits (default: origin/main of each repo).
//
// WHAT IT CAN'T SEE: whether the commit itself is good (the fresh review's job, before he approves); a git.exe replaced
// under C:\Program Files\Git (admin-only, out of scope; and every object it returns is re-hashed anyway); the UNELEVATED
// side as a whole: a cmd AutoRun (HKCU) or a profiler variable can tamper with the stage half or the unelevated
// PowerShell that asks for elevation, and then print the fingerprint he expects while passing another. On one Windows
// account nothing unelevated is trustworthy against a determined agent; the separate identity of tier 2 closes it. The
// default `origin/main` is a ref any agent can move: Thursday's line names both commit ids. The webhook is readable by
// every user once vaulted (the gate runs as Justin's user and must read it); vaulting protects its integrity, not its
// secrecy.

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

// fileURLToPath, never URL.pathname: the vault sits under C:\Program Files, and .pathname keeps the space as %20, which
// names a folder that doesn't exist (QCI finding 1). tests/vault.test.mjs runs this file from a path with a space.
const SELF = fileURLToPath(import.meta.url);
const HERE = path.dirname(SELF);
const IN_VAULT = /^file:\/\/\/c:\/program%20files\/claudecode\//i.test(import.meta.url);
const ROOT = 'C:\\Program Files\\ClaudeCode';
const NODE_EXE = 'C:\\Program Files\\nodejs\\node.exe';
const GIT_EXE = 'C:\\Program Files\\Git\\cmd\\git.exe';
const ICACLS = 'C:\\Windows\\System32\\icacls.exe';
const POWERSHELL = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
export const CMD_EXE = 'C:\\Windows\\System32\\cmd.exe';
const WHERE_EXE = 'C:\\Windows\\System32\\where.exe';
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
export const GENERATED = ['config.json', 'webhook.json', 'outbound-pins.json', 'manifest.json'];  // written by the stage half, not from git

const sha = buf => createHash('sha256').update(buf).digest('hex');
const shaFile = f => sha(fs.readFileSync(f));
const stamp = () => new Date().toISOString();
const say = s => console.log(s);

// Strip every key that starts with "_" at any depth (the templates' notes and canaries), so Claude Code never sees them.
export const stripUnderscore = v => Array.isArray(v) ? v.map(stripUnderscore) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, stripUnderscore(x)])) : v;

// ---------- the vault's node launcher line (QCI finding 3) ----------
// node runs whatever NODE_OPTIONS names (--import, --require) BEFORE the script, and an agent can set it for every later
// process with `setx`; clearing it inside node is too late. So every vault node process starts through cmd.exe /d (no
// AutoRun, which HKCU could set), which clears the NODE_* variables node reads code or data from, and then runs the
// vault's node by a path RELATIVE to the vault (..\..\nodejs\node.exe = C:\Program Files\nodejs\node.exe). The relative
// path is deliberate: the line then has no token containing a space, so whatever quoting the hook runner applies to exec-
// form args, cmd receives exactly this text (a quoted token would be escaped as \" and break cmd). `cd /d` accepts a path
// with spaces unquoted, and `&&` means nothing runs if the cd fails (never node from the caller's folder).
export const CLEAR_NODE = 'set NODE_OPTIONS=&set NODE_PATH=&set NODE_COMPILE_CACHE=&set NODE_ICU_DATA=&';
export const VAULT_NODE_REL = '..\\..\\nodejs\\node.exe';
export const launcherLine = (vaultDir, script) => `cd /d ${vaultDir}&&${CLEAR_NODE}${VAULT_NODE_REL} ${script}`;
// A hook's exec form: command cmd.exe, these args. Each token has no space, so none is ever quoted.
export const hookArgs = (script, vaultDir = `${ROOT}\\evryn-guards`) => ['/d', '/c', ...launcherLine(vaultDir, script).split(' ')];

// Every hook in the managed settings must be exactly the launcher form above, on a script that is in the vault list: a
// template that points anywhere else, or that runs node without clearing NODE_*, would install a hook outside the
// vault's protection.
export function checkManaged(obj, names) {
  const problems = [];
  for (const [event, groups] of Object.entries(obj.hooks || {})) for (const g of groups) for (const h of g.hooks || []) {
    const args = h.args || [];
    const name = args.length ? String(args.at(-1)) : null;               // the launcher line ends with the script's name
    if (h.command !== CMD_EXE) problems.push(`${event}: command is not ${CMD_EXE}`);
    if (!name || !names.includes(name)) problems.push(`${event}: ${name || '(no script)'} is not a vault file`);
    else if (JSON.stringify(args) !== JSON.stringify(hookArgs(name))) problems.push(`${event}: ${name} is not run through the vault's launcher line`);
  }
  return problems;
}

// ---------- git, pinned to the commit (QCI finding 2) ----------
// git honors refs/replace/ by default, and its object files are user-writable, so "git show <commit>:<path>" can return
// something other than what the reviewed commit id names. Every call here turns replace refs off three ways and drops
// every GIT_* variable from the environment; and every object read is re-hashed against its own id (readVerified).
export const GIT_ARGS = ['--no-replace-objects', '-c', 'core.useReplaceRefs=false'];
export const gitEnv = () => ({ ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/i.test(k))), GIT_NO_REPLACE_OBJECTS: '1', GIT_CONFIG_NOSYSTEM: '1' });
export function gitExe() { if (!fs.existsSync(GIT_EXE)) throw new Error(`git isn't at ${GIT_EXE}; the approver won't use a git found on PATH`); return GIT_EXE; }
export const gitRaw = (repo, args) => execFileSync(gitExe(), [...GIT_ARGS, '-C', repo, ...args], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], env: gitEnv() });

const algoOf = oid => (oid.length === 64 ? 'sha256' : 'sha1');
export const objectId = (type, buf, algo = 'sha1') => createHash(algo).update(Buffer.concat([Buffer.from(`${type} ${buf.length}\0`), buf])).digest('hex');
const verified = new Map();                                              // repo|oid → bytes already re-hashed (content-addressed)
function catVerified(repo, type, oid) {
  const k = `${repo}|${type}|${oid}`; if (verified.has(k)) return verified.get(k);
  const buf = gitRaw(repo, ['cat-file', type, oid]);
  if (objectId(type, buf, algoOf(oid)) !== oid) throw new Error(`REFUSED: git returned a ${type} whose content doesn't hash to its id ${oid.slice(0, 12)} (a doctored object in ${path.basename(repo)})`);
  verified.set(k, buf); return buf;
}
// Walk commit → tree → … → blob, re-hashing each object; then cross-check git's own resolution of the same path.
export function readVerified(repo, commit, p) {
  let tree = (catVerified(repo, 'commit', commit).toString('latin1').match(/^tree ([0-9a-f]{40,64})$/m) || [])[1];
  if (!tree) throw new Error(`REFUSED: commit ${commit.slice(0, 12)} names no tree`);
  const parts = p.split('/'); let oid = null;
  for (let i = 0; i < parts.length; i++) {
    const t = catVerified(repo, 'tree', tree); const raw = commit.length === 64 ? 32 : 20; let at = 0, found = null;
    while (at < t.length) {
      const sp = t.indexOf(0x20, at), nul = t.indexOf(0, sp);
      const mode = t.toString('latin1', at, sp), name = t.toString('utf8', sp + 1, nul), id = t.toString('hex', nul + 1, nul + 1 + raw);
      at = nul + 1 + raw;
      if (name === parts[i]) { found = { mode, id }; break; }
    }
    if (!found) throw new Error(`REFUSED: ${p} is missing at ${path.basename(repo)} commit ${commit.slice(0, 10)}`);
    if (i < parts.length - 1) { if (found.mode !== '40000') throw new Error(`REFUSED: ${parts.slice(0, i + 1).join('/')} is not a folder at that commit`); tree = found.id; }
    else { if (!/^100(644|755)$/.test(found.mode)) throw new Error(`REFUSED: ${p} is not a regular file at that commit`); oid = found.id; }
  }
  const git = gitRaw(repo, ['rev-parse', `${commit}:${p}`]).toString().trim();
  if (git !== oid) throw new Error(`REFUSED: git resolves ${p} to ${git.slice(0, 12)}, but the commit's own trees name ${oid.slice(0, 12)}`);
  return { buf: catVerified(repo, 'blob', oid), oid };
}

// ---------- the outbound allowlist's pinned scripts (QCR New 1; DCF2, 2026-11-19) ----------
// For each `pinned` entry in the staged allowlist, walk its local import closure AT THE REVIEWED COMMIT (readVerified, so
// every object is re-hashed) and record each file's text hash. outbound-gate.mjs trusts the entry only when every file of
// the closure on disk hashes the same. These two functions MUST match lib.mjs's shaText and localImports exactly
// (tests/vault.test.mjs compares them); they are copied rather than imported because the approver runs on its own.
const shaText = buf => createHash('sha256').update(Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'))).digest('hex');
const BUILTIN = /^node:|^(fs|path|os|url|util|crypto|child_process|http|https|net|tls|dgram|readline|stream|events|zlib|assert|buffer|worker_threads|process)(\/|$)/;
export function localImports(text) {
  const rel = new Set(), bare = new Set();
  const re = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|^\s*import\s*['"]([^'"]+)['"]|\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/gm;
  for (const m of String(text).matchAll(re)) {
    const spec = m[1] || m[2] || m[3] || m[4];
    if (/^\.\.?\//.test(spec)) rel.add(spec); else if (!BUILTIN.test(spec)) bare.add(spec);
  }
  return { rel: [...rel], bare: [...bare] };
}
const REPO_OF = { '_evryn-meta': 'meta', 'evryn-team-workspace': 'team' };
export function pinScripts(entries, repos, commits) {
  const files = {};
  for (const entry of entries || []) {
    const [top, ...rest] = String(entry).split('/'); const repo = REPO_OF[top];
    if (!repo || !rest.length || rest.includes('..')) throw new Error(`REFUSED: pinned entry ${entry} is not a file in _evryn-meta or evryn-team-workspace`);
    const todo = [rest.join('/')]; const seen = new Set();
    while (todo.length) {
      const p = path.posix.normalize(todo.pop());
      if (p.startsWith('..')) throw new Error(`REFUSED: ${entry} imports a file outside its repository`);
      if (seen.has(p)) continue; seen.add(p);
      const { buf } = readVerified(repos[repo], commits[repo], p);
      files[`${top}/${p}`.toLowerCase()] = shaText(buf);
      const { rel, bare } = localImports(buf.toString('utf8'));
      if (bare.length) throw new Error(`REFUSED: pinned ${entry} reaches ${p}, which imports a package (${bare.join(', ')}); a pin can't cover a package`);
      for (const r of rel) todo.push(path.posix.join(path.posix.dirname(p), r));
    }
  }
  return { entries: (entries || []).map(e => String(e).toLowerCase()), files };
}

// ---------- claude versions (QCI finding 8) ----------
export const parseVersion = s => { const m = String(s || '').match(/(\d+)\.(\d+)\.(\d+)/); return m ? m.slice(1, 4).map(Number) : null; };
export function versionAtLeast(v, floor) {
  const a = parseVersion(v), b = parseVersion(floor); if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}
// Every claude this machine would run, from EXACTLY these places (QCR New 3; nowhere else is checked):
//   1. each `where claude` result that Windows can execute (the PATH, npm's global `claude.cmd` included);
//   2. %USERPROFILE%\.local\bin\claude.exe, the native installer's copy, which is often NOT on the PATH;
//   3. the Claude Code extension's claude.exe in %USERPROFILE%\.vscode\extensions, .vscode-insiders\extensions,
//      .cursor\extensions and .windsurf\extensions (every anthropic.claude-code-<version>-win32-x64 folder).
// A copy anywhere else (a portable folder, another editor, WSL) is NOT checked. Each is asked its own --version.
export const EDITOR_EXT = ['.vscode', '.vscode-insiders', '.cursor', '.windsurf'];
export function claudeFiles(home = os.homedir(), { where = true } = {}) {
  const files = new Set();
  if (where) try { for (const l of execFileSync(WHERE_EXE, ['claude'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split(/\r?\n/)) if (/\.(exe|cmd|bat)$/i.test(l.trim())) files.add(l.trim()); } catch { /* none on PATH */ }
  const native = path.join(home, '.local', 'bin', 'claude.exe');
  if (fs.existsSync(native)) files.add(native);
  for (const ed of EDITOR_EXT) {
    const ext = path.join(home, ed, 'extensions');
    try { for (const d of fs.readdirSync(ext)) if (/^anthropic\.claude-code-[\d.]+-win32-x64$/.test(d)) { const f = path.join(ext, d, 'resources', 'native-binary', 'claude.exe'); if (fs.existsSync(f)) files.add(f); } } catch { /* none */ }
  }
  return [...files];
}
export function realClaudeVersions(files = claudeFiles()) {
  return files.map(file => {
    let out = '';
    try {
      out = /\.exe$/i.test(file) ? execFileSync(file, ['--version'], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] })
        : execFileSync(CMD_EXE, [`/d /s /c ""${file}" --version"`], { encoding: 'utf8', timeout: 60000, windowsVerbatimArguments: true, stdio: ['ignore', 'pipe', 'ignore'] });
    } catch { /* unreadable: counts as below the floor */ }
    return { file, version: out.trim() };
  });
}
export function versionProblems(found, floor) {
  return found.filter(f => !versionAtLeast(f.version, floor)).map(f => `${f.file} reports ${f.version || 'no version'}`);
}

// ---------- the alarm's webhook (QCI finding 5) ----------
// The gate's URGENT ping must not depend on a file any agent can edit. The stage half reads the team .env's webhook
// ONCE, on Justin's approval, and the vault keeps its own copy. It is never printed whole: only the host and the last 6
// characters, for him to compare with his own record.
export function readWebhook(codeRoot) {
  const f = path.join(codeRoot, 'evryn-team-workspace', '.env');
  let text; try { text = fs.readFileSync(f, 'utf8'); } catch { throw new Error(`REFUSED: no .env at ${f}, so the vault's alarm would have no Slack webhook`); }
  const m = text.match(/^SLACK_TEAM_WEBHOOK_URL\s*=\s*(.+)$/m);
  if (!m) throw new Error(`REFUSED: SLACK_TEAM_WEBHOOK_URL isn't in ${f}`);
  const url = m[1].trim().replace(/\r$/, '').replace(/^["']|["']$/g, '');
  if (!/^https:\/\/hooks\.slack\.com\/\S+$/.test(url)) throw new Error('REFUSED: SLACK_TEAM_WEBHOOK_URL does not look like a Slack webhook URL');
  return url;
}
export const webhookHint = url => `${new URL(url).host} …${url.slice(-6)}`;

// ---------- stage (unelevated) ----------
export function stage({ codeRoot, metaCommit = 'origin/main', teamCommit = 'origin/main', stageDir, claudeVersions = realClaudeVersions }) {
  if (process.env.NODE_OPTIONS || process.env.NODE_PATH) throw new Error('REFUSED: NODE_OPTIONS or NODE_PATH is set in this window. Something may have changed your environment; tell Soren before going on.');
  const repos = { meta: path.join(codeRoot, '_evryn-meta'), team: path.join(codeRoot, 'evryn-team-workspace') };
  const commits = {};
  for (const [k, c] of [['meta', metaCommit], ['team', teamCommit]]) commits[k] = gitRaw(repos[k], ['rev-parse', '--verify', `${c}^{commit}`]).toString().trim();
  fs.mkdirSync(stageDir, { recursive: true });
  const plan = { commits, codeRoot, files: {}, blobs: {}, managed: null, stagedAt: stamp() };
  const names = [...FILES.map(f => f[0]), ...GENERATED];
  const json = {};
  for (const [name, repo, p] of [...FILES, MANAGED]) {
    let { buf, oid } = readVerified(repos[repo], commits[repo], p);
    plan.blobs[name] = oid;
    if (name.endsWith('.json')) {
      let obj; try { obj = JSON.parse(buf.toString('utf8')); } catch { throw new Error(`REFUSED: ${p} at that commit is not valid JSON`); }
      obj = stripUnderscore(obj); json[name] = obj;
      if (name === 'managed-settings.json') { const bad = checkManaged(obj, names); if (bad.length) throw new Error(`REFUSED: managed-settings: ${bad.join('; ')}`); }
      buf = Buffer.from(JSON.stringify(obj, null, 2) + '\n');
    }
    fs.writeFileSync(path.join(stageDir, name), buf);
    if (name === 'managed-settings.json') plan.managed = sha(buf); else plan.files[name] = sha(buf);
  }
  // One claude floor, enforced before the install, never only written down (QCI finding 8).
  const floor = json['managed-settings.json'].requiredMinimumVersion;
  if (!floor || floor !== json['watch.json'].minClaudeVersion) throw new Error(`REFUSED: the managed settings' requiredMinimumVersion (${floor}) and watch.json's minClaudeVersion (${json['watch.json'].minClaudeVersion}) must be the same`);
  const low = versionProblems(claudeVersions(), floor);
  if (low.length) throw new Error(`REFUSED: Claude Code older than ${floor} is on this machine, and it would stop starting once the vault is in: ${low.join('; ')}. Update it (or remove that copy) first.`);
  const write = (name, obj) => { const b = Buffer.from(JSON.stringify(obj, null, 2) + '\n'); fs.writeFileSync(path.join(stageDir, name), b); plan.files[name] = sha(b); };
  write('config.json', { codeRoot });
  const hook = readWebhook(codeRoot);
  write('webhook.json', { team: hook });
  // The outbound allowlist's pinned scripts, hashed from the reviewed commit (QCR New 1).
  write('outbound-pins.json', pinScripts(json['outbound-allowlist.json'].pinned, repos, commits));
  plan.webhookHint = webhookHint(hook);
  // The manifest the gate checks: every vault file but itself, plus managed-settings.json beside the folder (note 16).
  write('manifest.json', { approvedAt: plan.stagedAt, commits, files: { ...plan.files }, managed: plan.managed });
  const planBuf = Buffer.from(JSON.stringify(plan, null, 2));
  fs.writeFileSync(path.join(stageDir, 'plan.json'), planBuf);
  return { plan, planHash: sha(planBuf) };
}

// What changes against the vault as it stands: one line per file, each with its git blob id (compare on GitHub).
export function describe(plan, stageDir, root) {
  const vault = path.join(root, 'evryn-guards');
  const lines = [];
  const all = [...Object.keys(plan.files), 'managed-settings.json'];
  for (const name of all) {
    const now = name === 'managed-settings.json' ? path.join(root, name) : path.join(vault, name);
    const want = name === 'managed-settings.json' ? plan.managed : plan.files[name];
    const blob = plan.blobs[name] ? `  blob ${plan.blobs[name]}` : '  (generated)';
    if (!fs.existsSync(now)) { lines.push(`  + ${name} (new)${blob}`); continue; }
    if (shaFile(now) === want) { lines.push(`  = ${name}${blob}`); continue; }
    const a = fs.readFileSync(now, 'utf8').split('\n').length, b = fs.readFileSync(path.join(stageDir, name), 'utf8').split('\n').length;
    lines.push(`  ~ ${name} (changed: ${a} → ${b} lines)${blob}`);
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
  fs.appendFileSync(path.join(fresh, 'approvals.log'), JSON.stringify({ at: stamp(), commits: plan.commits, plan: planHash, approver: selfHash, files: Object.keys(plan.files).length, managed: plan.managed }) + '\n');
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
export const COUNSEL_MINUTES = 10;                                       // QCI finding 9: was 30
export function grant({ kind, arg, sessionId, selfHash, root }) {
  if (shaFile(SELF) !== selfHash) throw new Error('REFUSED: the approver changed between asking and granting');
  const dir = path.join(root, 'evryn-guards', 'grants');
  fs.mkdirSync(dir, { recursive: true });
  if (kind === 'brake') fs.writeFileSync(path.join(dir, 'brake-release.json'), JSON.stringify({ releasedAt: stamp() }) + '\n');
  else if (kind === 'counsel') {
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(arg || '')) throw new Error('REFUSED: that is not a Gmail thread id');
    if (sessionId && !/^[A-Za-z0-9-]{8,64}$/.test(sessionId)) throw new Error('REFUSED: that is not a Claude Code session id');
    const grantedAt = stamp();
    fs.writeFileSync(path.join(dir, `counsel-${arg}.json`), JSON.stringify({ threadId: arg, grantedAt, expiresAt: new Date(Date.now() + COUNSEL_MINUTES * 60000).toISOString(), singleUse: true, ...(sessionId ? { sessionId } : {}) }) + '\n');
  } else throw new Error(`unknown grant ${kind}`);
  fs.appendFileSync(path.join(root, 'evryn-guards', 'approvals.log'), JSON.stringify({ at: stamp(), grant: kind, arg: arg || null, session: sessionId || null }) + '\n');
}

// ---------- the elevation wrapper (QCI findings 3 and 4) ----------
// The script the elevated PowerShell runs. It uses .NET calls only, no cmdlets, because a cmdlet can autoload a module
// from the user's own (writable) module folder. It copies the approver into a fresh folder under <root>, which users
// can't write, checks the COPY against the full fingerprint, and only then runs node on the copy.
const psq = s => `'${String(s).replace(/'/g, "''")}'`;
export function elevatedScript({ src, want, root, nodeArgs, lock = true, node = NODE_EXE }) {
  return [
    "$ErrorActionPreference='Stop'",
    `$src=${psq(src)};$want=${psq(want)};$node=${psq(node)}`,
    `$dir=[IO.Path]::Combine(${psq(root)},'approver-'+[guid]::NewGuid().ToString('N'))`,
    '[void][IO.Directory]::CreateDirectory($dir)',
    lock ? `$null=& ${psq(ICACLS)} $dir /inheritance:r /grant:r '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-545:(OI)(CI)RX'` : '',
    "$dst=[IO.Path]::Combine($dir,'approve-guards.mjs')",
    '[IO.File]::Copy($src,$dst,$true)',
    "$got=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([IO.File]::ReadAllBytes($dst))).Replace('-','').ToLower()",
    "if($got -ne $want){[IO.Directory]::Delete($dir,$true);[Console]::Error.WriteLine('REFUSED: the approver copy is not the one whose fingerprint you checked; nothing installed.');exit 3}",
    `& $node $dst ${nodeArgs.map(psq).join(' ')}`,
    '$code=$LASTEXITCODE',
    '[IO.Directory]::Delete($dir,$true)',
    'exit $code',
  ].filter(Boolean).join('\n');
}
// cmd.exe /d (no AutoRun) clears the .NET profiler variables (which would load a DLL into the elevated PowerShell) and
// NODE_*, then starts PowerShell with no profile on the encoded script. No token here contains a quote or a space.
export const elevationArgs = script => `/d /c set COR_ENABLE_PROFILING=&set COR_PROFILER=&set COR_PROFILER_PATH=&${CLEAR_NODE}${POWERSHELL} -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${Buffer.from(script, 'utf16le').toString('base64')}`;
function runWrapper(script, { elevate }) {
  const args = elevationArgs(script);
  if (!elevate) return spawnSync(CMD_EXE, [args], { stdio: 'inherit', windowsVerbatimArguments: true }).status;
  // Windows shows its UAC prompt here. Only Justin, at the keyboard, can answer it.
  const r = spawnSync(POWERSHELL, ['-NoProfile', '-NonInteractive', '-Command', `$p = Start-Process -FilePath '${CMD_EXE}' -ArgumentList '${args}' -Verb RunAs -Wait -PassThru; exit $p.ExitCode`], { stdio: 'inherit' });
  return r.status;
}

// ---------- the command line ----------
const ask = q => new Promise(res => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, a => { rl.close(); res(a.trim()); }); });
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
  const viaWrapper = !!dryRoot && argv.includes('--via-wrapper');
  if (cmd === 'install') { const r = install({ stageDir: argv[1], planHash: argv[2], selfHash: argv[3], root, dry: !!dryRoot }); say(`installed ${r.files} files into ${r.vault}`); return 0; }
  if (cmd === 'grant') { grant({ kind: argv[1], arg: argv[2] === '-' ? null : argv[2], selfHash: argv[3], sessionId: argv[4] && argv[4] !== '-' ? argv[4] : null, root }); say(`granted ${argv[1]}`); return 0; }

  say(`Evryn vault approver. Fingerprint of this approver (all 64): ${selfHash}`);
  say(IN_VAULT ? '(running the vault\'s own copy)' : '⚠️  Running a copy from the repo: check the WHOLE fingerprint above against your step card before you type anything.');
  const wrap = (nodeArgs) => elevatedScript({ src: SELF, want: selfHash, root, nodeArgs: dryRoot ? [...nodeArgs, '--dry', root] : nodeArgs, lock: !dryRoot });
  if (cmd === 'release-brake' || cmd === 'open-counsel') {
    const kind = cmd === 'release-brake' ? 'brake' : 'counsel', arg = argv[1] && !argv[1].startsWith('--') ? argv[1] : null;
    const sessionId = kind === 'counsel' && argv[2] && !argv[2].startsWith('--') ? argv[2] : null;
    const word = kind === 'brake' ? 'RELEASE' : 'OPEN';
    say(kind === 'brake' ? 'This releases the runaway brake: the scheduled Admiral may wake again.'
      : `This lets ONE agent read ONE counsel thread (${arg}), once, within the next ${COUNSEL_MINUTES} minutes${sessionId ? `, and only the session ${sessionId}` : ''}.`);
    if ((await ask(`Type ${word} to go ahead: `)) !== word) { say('Nothing done.'); return 1; }
    const nodeArgs = ['grant', kind, arg || '-', selfHash, sessionId || '-'];
    if (dryRoot && !viaWrapper) { grant({ kind, arg, sessionId, selfHash, root }); say('granted (dry)'); return 0; }
    return runWrapper(wrap(nodeArgs), { elevate: !dryRoot });
  }
  if (cmd !== 'stage') { say('usage: approve-guards.mjs stage [--meta <commit>] [--team <commit>] [--dry <folder> [--yes] [--via-wrapper] [--fake-claude <v,v>]] | release-brake | open-counsel <threadId> [sessionId]'); return 2; }
  const fake = dryRoot && !IN_VAULT ? opt(argv, '--fake-claude') : undefined;
  const claudeVersions = fake ? () => fake.split(',').map((v, i) => ({ file: `fake-claude-${i}`, version: v })) : realClaudeVersions;
  const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evryn-guards-stage-'));
  // The stage folder holds every staged file, the webhook included: it goes when this run ends, however it ends (QCR New 7).
  try { return await stageAndInstall(); } finally { fs.rmSync(stageDir, { recursive: true, force: true }); }
  async function stageAndInstall() {
  const { plan, planHash } = stage({ codeRoot: opt(argv, '--code-root') || codeRootFrom(), metaCommit: opt(argv, '--meta'), teamCommit: opt(argv, '--team'), stageDir, claudeVersions });
  say(`From _evryn-meta ${plan.commits.meta} and evryn-team-workspace ${plan.commits.team}:`);
  say(describe(plan, stageDir, root).join('\n'));
  say(`The alarm's Slack webhook: ${plan.webhookHint}. Check the host and the last 6 characters against your own record.`);
  const allowFile = JSON.parse(fs.readFileSync(path.join(stageDir, 'outbound-allowlist.json'), 'utf8'));
  say(`Scripts unattended agents may run to reach the network, pinned to these exact bytes: ${(allowFile.pinned || []).join(', ') || 'none'}.`);
  for (const e of allowFile.attendedAllow || []) say(`Allowed ONLY in a session you are at, with no prompt: ${e.pattern}`);
  if (!(dryRoot && argv.includes('--yes'))) {
    if ((await ask('Type APPROVE to install these into the vault (Windows will then ask you "Yes"): ')) !== 'APPROVE') { say('Nothing installed.'); return 1; }
  }
  if (dryRoot && !viaWrapper) { const r = install({ stageDir, planHash, selfHash, root, dry: true }); say(`installed ${r.files} files into ${r.vault} (dry)`); return 0; }
  const status = runWrapper(wrap(['install', stageDir, planHash, selfHash]), { elevate: !dryRoot });
  say(status === 0 ? 'Installed. Open a NEW Claude Code session and run /status: it should list the managed settings file.' : `The install did not finish (exit ${status}). Nothing half-installed is left in place; tell Soren.`);
  return status;
  }
}

const direct = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === SELF.toLowerCase();
if (direct) cli(process.argv.slice(2)).then(c => process.exit(c ?? 0), e => { console.error(String(e.message || e)); process.exit(1); });

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
