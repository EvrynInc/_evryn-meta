// vault.test.mjs — tests for the vault's own machinery: the approver, the gate and Justin's grants (DCG-V, 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// Run:      node --test scripts/guards/tests/vault.test.mjs
// Controls: node scripts/guards/tests/controls.mjs (runs this file too)
// Nothing here touches C:\Program Files, asks for elevation or reads a real secret: the approver runs in DRY mode
// against a throwaway "code root" of two fixture git repos built from this branch's own files, and installs into a
// throwaway folder. GUARD_DIR=<dir> points at another copy of the scripts (the controls use it).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const DIR = process.env.GUARD_DIR || path.resolve(HERE, '..');
const SRC = path.resolve(HERE, '..');                                    // this branch's scripts, the fixtures' content
const META_SRC = path.resolve(SRC, '..', '..');                          // the _evryn-meta checkout holding them
const GIT = fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
const APPROVE = path.join(DIR, 'vault', 'approve-guards.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'evryn-vault-test-'));
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const g = (repo, ...args) => execFileSync(GIT, ['-C', repo, ...args], { encoding: 'utf8', stdio: 'pipe' });

// The fixture code root: _evryn-meta with the guard scripts (from GUARD_DIR, so a control's mutation is what gets
// committed) and ping.mjs; evryn-team-workspace with the scheduled-Admiral files and the counsel list (stand-ins).
const CODE = path.join(tmp, 'code');
const META = path.join(CODE, '_evryn-meta'), TEAM = path.join(CODE, 'evryn-team-workspace');
const FOLDER = 'shared/projects/helm/2026/2026.11.05-admiral-on-a-schedule';
function put(repo, rel, content) { fs.mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true }); fs.writeFileSync(path.join(repo, rel), content); }
for (const r of [META, TEAM]) { fs.mkdirSync(r, { recursive: true }); g(r, 'init', '-q', '-b', 'main'); g(r, 'config', 'user.email', 't@example.com'); g(r, 'config', 'user.name', 'test'); g(r, 'config', 'core.autocrlf', 'false'); }
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.mjs'))) put(META, `scripts/guards/${f}`, fs.readFileSync(path.join(DIR, f)));
for (const f of fs.readdirSync(path.join(SRC, 'vault'))) put(META, `scripts/guards/vault/${f}`, fs.readFileSync(path.join(fs.existsSync(path.join(DIR, 'vault', f)) ? path.join(DIR, 'vault') : path.join(SRC, 'vault'), f)));
put(META, 'scripts/ping.mjs', fs.readFileSync(path.join(META_SRC, 'scripts', 'ping.mjs')));
for (const f of ['admiral-watch.mjs', 'kill-switch.mjs', 'claude-bin.mjs']) put(TEAM, `${FOLDER}/${f}`, `// fixture ${f}\nconsole.log('${f}');\n`);
put(TEAM, `${FOLDER}/standing-orders.md`, '# orders\n'); put(TEAM, `${FOLDER}/standing-orders-thea.md`, '# thea orders\n');
put(TEAM, 'shared/projects/legal/counsel-list.md', '| `fenwick.com` | Fenwick |\n');
for (const r of [META, TEAM]) { g(r, 'add', '-A'); g(r, 'commit', '-q', '-m', 'fixture'); }

const approve = (args, input = '') => spawnSync(process.execPath, [APPROVE, ...args, '--code-root', CODE, '--meta', 'main', '--team', 'main'], { input, encoding: 'utf8' });
const target = name => { const t = path.join(tmp, name); fs.mkdirSync(t, { recursive: true }); return t; };

test('approve (dry): installs exactly the listed files from the commit, strips "_" keys, writes a manifest the gate can check', () => {
  const T = target('t1');
  const r = approve(['stage', '--dry', T, '--yes']); assert.equal(r.status, 0, r.stdout + r.stderr);
  const V = path.join(T, 'evryn-guards');
  const m = JSON.parse(fs.readFileSync(path.join(V, 'manifest.json'), 'utf8'));
  for (const [name, h] of Object.entries(m.files)) assert.equal(sha(path.join(V, name)), h, name);
  for (const f of ['gmail-guard.mjs', 'secrets-guard.mjs', 'outbound-gate.mjs', 'gate.mjs', 'ping.mjs', 'admiral-watch.mjs', 'counsel-list.md', 'watch.json', 'config.json']) assert.ok(f in m.files, f);
  const managed = fs.readFileSync(path.join(T, 'managed-settings.json'), 'utf8');
  assert.ok(!/"_/.test(managed), 'no "_" keys reach Claude Code');
  assert.ok(JSON.parse(managed).allowManagedHooksOnly === true);
  assert.ok(!/"_/.test(fs.readFileSync(path.join(V, 'outbound-allowlist.json'), 'utf8')), 'nested "_why" keys stripped too');
  assert.equal(JSON.parse(fs.readFileSync(path.join(V, 'config.json'), 'utf8')).codeRoot, CODE);
  assert.ok(fs.readdirSync(V).every(f => f in m.files || ['manifest.json', 'grants', 'approvals.log'].includes(f)), 'nothing unlisted');
});

test('approve (dry): an uncommitted working-tree edit never rides in', () => {
  const T = target('t2');
  const file = path.join(META, 'scripts', 'guards', 'gmail-guard.mjs'); const committed = fs.readFileSync(file);
  fs.appendFileSync(file, '\n// UNCOMMITTED-EDIT\n');
  try {
    assert.equal(approve(['stage', '--dry', T, '--yes']).status, 0);
    assert.ok(!fs.readFileSync(path.join(T, 'evryn-guards', 'gmail-guard.mjs'), 'utf8').includes('UNCOMMITTED-EDIT'));
    assert.equal(sha(path.join(T, 'evryn-guards', 'gmail-guard.mjs')), createHash('sha256').update(committed).digest('hex'));
  } finally { fs.writeFileSync(file, committed); }
});

test('approve (dry): a source missing at the commit is refused, and nothing is installed', () => {
  const T = target('t3');
  g(TEAM, 'rm', '-q', `${FOLDER}/claude-bin.mjs`); g(TEAM, 'commit', '-q', '-m', 'drop one');
  try {
    const r = approve(['stage', '--dry', T, '--yes']);
    assert.notEqual(r.status, 0); assert.match(r.stderr, /REFUSED: .*claude-bin\.mjs is missing/);
    assert.ok(!fs.existsSync(path.join(T, 'evryn-guards')));
  } finally { g(TEAM, 'revert', '--no-edit', 'HEAD'); }
});

test('approve: a hook in the template that points outside the vault is refused', async () => {
  const { checkManaged } = await import(new URL('file:///' + APPROVE.replace(/\\/g, '/')).href);
  const ok = { hooks: { PreToolUse: [{ hooks: [{ command: 'C:\\Program Files\\nodejs\\node.exe', args: ['C:\\Program Files\\ClaudeCode\\evryn-guards\\gmail-guard.mjs'] }] }] } };
  assert.deepEqual(checkManaged(ok, ['gmail-guard.mjs']), []);
  const bad = { hooks: { PreToolUse: [{ hooks: [{ command: 'node', args: ['C:\\Users\\x\\evil.mjs'] }] }] } };
  assert.equal(checkManaged(bad, ['gmail-guard.mjs']).length, 2);
});

test('approve: a staged file swapped after staging is refused at install, and the old vault stays', async () => {
  const T = target('t4');
  assert.equal(approve(['stage', '--dry', T, '--yes']).status, 0);
  const before = sha(path.join(T, 'evryn-guards', 'manifest.json'));
  const mod = await import(new URL('file:///' + APPROVE.replace(/\\/g, '/')).href);
  const stageDir = fs.mkdtempSync(path.join(tmp, 'stage-'));
  const { planHash } = mod.stage({ codeRoot: CODE, metaCommit: 'main', teamCommit: 'main', stageDir });
  fs.appendFileSync(path.join(stageDir, 'gmail-guard.mjs'), '\n// SWAPPED\n');
  assert.throws(() => mod.install({ stageDir, planHash, selfHash: sha(APPROVE), root: T, dry: true }), /changed after staging/);
  assert.equal(sha(path.join(T, 'evryn-guards', 'manifest.json')), before, 'the old vault is untouched');
  assert.throws(() => mod.install({ stageDir, planHash: '0'.repeat(64), selfHash: sha(APPROVE), root: T, dry: true }), /plan changed/);
});

test('approve (dry): grants are carried forward when the vault is re-approved', () => {
  const T = target('t5');
  assert.equal(approve(['stage', '--dry', T, '--yes']).status, 0);
  assert.equal(approve(['release-brake', '--dry', T], 'RELEASE\n').status, 0);
  assert.ok(fs.existsSync(path.join(T, 'evryn-guards', 'grants', 'brake-release.json')));
  assert.equal(approve(['open-counsel', 'thr12345abc', '--dry', T], 'OPEN\n').status, 0);
  assert.equal(approve(['open-counsel', 'bad id!', '--dry', T], 'OPEN\n').status, 1, 'not a thread id');
  assert.equal(approve(['stage', '--dry', T, '--yes']).status, 0);
  assert.ok(fs.existsSync(path.join(T, 'evryn-guards', 'grants', 'counsel-thr12345abc.json')), 'kept across re-approval');
  assert.notEqual(approve(['open-counsel', 'thr12345abc', '--dry', T], 'no\n').status, 0, 'nothing without the typed word');
});

// ---------- the gate ----------
const gate = (V, state, env = {}) => spawnSync(process.execPath, [path.join(DIR, 'gate.mjs'), 'watch', state], { env: { ...process.env, EVRYN_GATE_VAULT: V, EVRYN_GATE_DRY: '1', ...env }, encoding: 'utf8' });
const gateLog = state => fs.readFileSync(path.join(state, 'gate-log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));

test('gate: a matching vault runs the vault\'s watch; one changed byte stops everything with vault code only, and pings once', () => {
  const T = target('t6'); assert.equal(approve(['stage', '--dry', T, '--yes']).status, 0);
  const V = path.join(T, 'evryn-guards'); const S = path.join(tmp, 's6');
  assert.equal(gate(V, S).status, 0);
  assert.equal(gateLog(S).at(-1).action, 'would-run-watch'); assert.equal(gateLog(S).at(-1).watch, path.join(V, 'admiral-watch.mjs'));
  fs.appendFileSync(path.join(V, 'gmail-guard.mjs'), ' ');
  assert.equal(gate(V, S).status, 1);
  const L = gateLog(S);
  assert.ok(L.some(l => l.action === 'MISMATCH' && l.bad.includes('gmail-guard.mjs (changed)')));
  const ran = L.filter(l => l.action === 'would-run').map(l => l.args[0]);
  assert.deepEqual(ran, [path.join(V, 'kill-switch.mjs'), path.join(V, 'ping.mjs')], 'only the vault\'s own kill switch and ping');
  assert.ok(fs.existsSync(path.join(S, 'STOP')));
  assert.equal(gate(V, S).status, 0); assert.equal(gateLog(S).at(-1).action, 'stopped', 'STOP holds');
  fs.rmSync(path.join(S, 'STOP'));
  gate(V, S);
  assert.equal(gateLog(S).filter(l => l.action === 'would-run' && /ping\.mjs$/.test(l.args[0])).length, 1, 'the same mismatch pings once');
});

test('gate: a missing manifest, or one that drops a required file, stops everything; a tampered kill switch is not run', () => {
  const T = target('t7'); assert.equal(approve(['stage', '--dry', T, '--yes']).status, 0);
  const V = path.join(T, 'evryn-guards'); const S = path.join(tmp, 's7');
  const m = JSON.parse(fs.readFileSync(path.join(V, 'manifest.json'), 'utf8'));
  delete m.files['admiral-watch.mjs']; fs.writeFileSync(path.join(V, 'manifest.json'), JSON.stringify(m));
  assert.equal(gate(V, S).status, 1); assert.ok(gateLog(S).some(l => l.action === 'MISMATCH' && l.bad.some(b => /admiral-watch\.mjs \(not in the manifest\)/.test(b))));
  const S2 = path.join(tmp, 's7b'); fs.rmSync(path.join(V, 'manifest.json'));
  assert.equal(gate(V, S2).status, 1); assert.ok(fs.existsSync(path.join(S2, 'STOP')));
  const T3 = target('t7c'); assert.equal(approve(['stage', '--dry', T3, '--yes']).status, 0);
  const V3 = path.join(T3, 'evryn-guards'); const S3 = path.join(tmp, 's7c');
  fs.appendFileSync(path.join(V3, 'kill-switch.mjs'), ' ');
  assert.equal(gate(V3, S3).status, 1);
  assert.ok(gateLog(S3).some(l => l.action === 'skipped-tampered' && l.script === 'kill-switch.mjs'));
  assert.ok(!gateLog(S3).some(l => l.action === 'would-run' && /kill-switch/.test(l.args[0])));
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
