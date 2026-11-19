// vault.test.mjs — tests for the vault's own machinery: the approver, the gate, Justin's grants, and every hook run the
// way the vault runs it (DCG-V, 2026-11-18; QCI fixes, DCF, 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// Run:      node --test scripts/guards/tests/vault.test.mjs
// Controls: node scripts/guards/tests/controls.mjs (runs this file too)
// Nothing here touches C:\Program Files, asks for elevation, sends anything, or reads a real secret: the approver runs in
// DRY mode against a throwaway "code root" of two fixture git repos built from this branch's own files, and installs into
// a throwaway folder. 🔴 EVERYTHING lives under a folder whose name contains a SPACE, and the installed layout is
// "<tmp>\Program Files\ClaudeCode\evryn-guards" with "<tmp>\Program Files\nodejs" a junction to the real node folder, so
// the scripts run exactly as they will from C:\Program Files (QCI finding 1 and note 15: the old suite never did).
// The fixture .env holds a FAKE webhook. GUARD_DIR=<dir> points at another copy of the scripts (the controls use it).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = process.env.GUARD_DIR || path.resolve(HERE, '..');
const SRC = path.resolve(HERE, '..');                                    // this branch's scripts, the fixtures' content
const META_SRC = path.resolve(SRC, '..', '..');                          // the _evryn-meta checkout holding them
const GIT = fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
const CMD = 'C:\\Windows\\System32\\cmd.exe';
const APPROVE = path.join(DIR, 'vault', 'approve-guards.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'evryn vault test-'));   // the space is the point
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const g = (repo, ...args) => execFileSync(GIT, ['-C', repo, ...args], { encoding: 'utf8', stdio: 'pipe' });
// Children never inherit the runner's own NODE_OPTIONS (the stage half refuses to run with it set).
const ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^NODE_(OPTIONS|PATH)$/i.test(k)));
const A = await import(pathToFileURL(APPROVE).href);

// The fixture code root: _evryn-meta with the guard scripts (from GUARD_DIR, so a control's mutation is what gets
// committed) and ping.mjs; evryn-team-workspace with the scheduled-Admiral files and the counsel list (stand-ins).
const CODE = path.join(tmp, 'code');
const META = path.join(CODE, '_evryn-meta'), TEAM = path.join(CODE, 'evryn-team-workspace');
const FOLDER = 'shared/projects/helm/2026/2026.11.05-admiral-on-a-schedule';
function put(repo, rel, content) { fs.mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true }); fs.writeFileSync(path.join(repo, rel), content); }
for (const r of [META, TEAM]) { fs.mkdirSync(r, { recursive: true }); g(r, 'init', '-q', '-b', 'main'); g(r, 'config', 'user.email', 't@example.com'); g(r, 'config', 'user.name', 'test'); g(r, 'config', 'core.autocrlf', 'false'); }
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.mjs'))) put(META, `scripts/guards/${f}`, fs.readFileSync(path.join(DIR, f)));
for (const f of fs.readdirSync(path.join(SRC, 'vault'))) put(META, `scripts/guards/vault/${f}`, fs.readFileSync(path.join(fs.existsSync(path.join(DIR, 'vault', f)) ? path.join(DIR, 'vault') : path.join(SRC, 'vault'), f)));
put(META, 'scripts/ping.mjs', fs.readFileSync(path.join(fs.existsSync(path.join(DIR, 'ping.mjs')) ? DIR : path.join(META_SRC, 'scripts'), 'ping.mjs')));
// The task CLI's stand-in, with a multi-line import and a nested one, so the approver pins a closure (QCR New 1).
put(META, 'scripts/tasks/tasks.mjs', "import { run } from './lib/cli.mjs';\nrun();\n");
put(META, 'scripts/tasks/lib/cli.mjs', "import {\n  x,\n} from './config.mjs';\nimport { readFileSync } from 'node:fs';\nexport const run = () => x;\n");
put(META, 'scripts/tasks/lib/config.mjs', 'export const x = 1;\n');
for (const f of ['admiral-watch.mjs', 'kill-switch.mjs', 'claude-bin.mjs']) put(TEAM, `${FOLDER}/${f}`, `// fixture ${f}\nconsole.log('${f}');\n`);
put(TEAM, `${FOLDER}/standing-orders.md`, '# orders\n'); put(TEAM, `${FOLDER}/standing-orders-thea.md`, '# thea orders\n');
put(TEAM, 'shared/projects/legal/counsel-list.md', '| `fenwick.com` | Fenwick |\n');
for (const r of [META, TEAM]) { g(r, 'add', '-A'); g(r, 'commit', '-q', '-m', 'fixture'); }
// A FAKE webhook, written after the commit (never in git), the way the real team .env is untracked.
const FAKE_HOOK = 'https://hooks.slack.com/services/TFAKE000/BFAKE000/fakeTOKENvalue9z8y7x';
put(TEAM, '.env', `OTHER=1\nSLACK_TEAM_WEBHOOK_URL=${FAKE_HOOK}\n`);

const approve = (args, input = '', extra = {}) => spawnSync(process.execPath, [APPROVE, ...args, '--code-root', CODE, '--meta', 'main', '--team', 'main', '--fake-claude', '2.1.326'], { input, encoding: 'utf8', env: { ...ENV, ...extra } });
// An install target laid out like C:\Program Files: <t>\Program Files\ClaudeCode, with nodejs beside it (a junction).
function target(name) {
  const pf = path.join(tmp, name, 'Program Files'); const t = path.join(pf, 'ClaudeCode');
  fs.mkdirSync(t, { recursive: true });
  if (!fs.existsSync(path.join(pf, 'nodejs'))) fs.symlinkSync(path.dirname(process.execPath), path.join(pf, 'nodejs'), 'junction');
  return t;
}
const installed = name => { const T = target(name); const r = approve(['stage', '--dry', T, '--yes']); assert.equal(r.status, 0, r.stdout + r.stderr); return T; };

test('approve (dry): installs exactly the listed files from the commit, strips "_" keys, writes a manifest the gate can check', () => {
  const T = installed('t1');
  const V = path.join(T, 'evryn-guards');
  const m = JSON.parse(fs.readFileSync(path.join(V, 'manifest.json'), 'utf8'));
  for (const [name, h] of Object.entries(m.files)) assert.equal(sha(path.join(V, name)), h, name);
  for (const f of ['gmail-guard.mjs', 'secrets-guard.mjs', 'outbound-gate.mjs', 'gate.mjs', 'ping.mjs', 'admiral-watch.mjs', 'counsel-list.md', 'watch.json', 'config.json', 'webhook.json']) assert.ok(f in m.files, f);
  assert.equal(m.managed, sha(path.join(T, 'managed-settings.json')), 'QCI note 16: managed-settings.json is in the manifest');
  const managed = fs.readFileSync(path.join(T, 'managed-settings.json'), 'utf8');
  assert.ok(!/"_/.test(managed), 'no "_" keys reach Claude Code');
  assert.ok(JSON.parse(managed).allowManagedHooksOnly === true);
  assert.ok(!/"_[a-z]+"\s*:/.test(fs.readFileSync(path.join(V, 'outbound-allowlist.json'), 'utf8')), 'nested "_why" keys stripped too (a value such as "_evryn-meta/…" is not a key)');
  assert.equal(JSON.parse(fs.readFileSync(path.join(V, 'config.json'), 'utf8')).codeRoot, CODE);
  assert.ok(fs.readdirSync(V).every(f => f in m.files || ['manifest.json', 'grants', 'approvals.log'].includes(f)), 'nothing unlisted');
});

test('QCI finding 5: the webhook is vaulted from the team .env, shown only as host and last 6, never printed whole', () => {
  const T = target('t-hook'); const r = approve(['stage', '--dry', T, '--yes']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(T, 'evryn-guards', 'webhook.json'), 'utf8')).team, FAKE_HOOK);
  assert.match(r.stdout, new RegExp(`hooks\\.slack\\.com …${FAKE_HOOK.slice(-6)}`));
  assert.ok(!(r.stdout + r.stderr).includes(FAKE_HOOK) && !(r.stdout + r.stderr).includes('fakeTOKEN'), 'the full value never appears');
  assert.ok(!fs.readFileSync(path.join(T, 'evryn-guards', 'approvals.log'), 'utf8').includes('fakeTOKEN'), 'nor in the log');
});

test('QCI finding 5: the vault copy of ping.mjs reads only the vault webhook.json, never the team .env', () => {
  // A copy whose vault test is pointed at its own (spaced) folder, as approve-guards would place it under Program Files.
  const fv = path.join(tmp, 'fake vault', 'ClaudeCode', 'evryn-guards'); fs.mkdirSync(fv, { recursive: true });
  const src = fs.readFileSync(path.join(fs.existsSync(path.join(DIR, 'ping.mjs')) ? DIR : path.join(META_SRC, 'scripts'), 'ping.mjs'), 'utf8');
  const prefix = pathToFileURL(fv + path.sep).href.toLowerCase().replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const patched = src.replace('/^file:\\/\\/\\/c:\\/program%20files\\/claudecode\\//i', `/^${prefix}/i`);
  assert.notEqual(patched, src, 'the vault test was found and patched');
  fs.writeFileSync(path.join(fv, 'ping.mjs'), patched);
  fs.writeFileSync(path.join(fv, 'config.json'), JSON.stringify({ codeRoot: path.join(tmp, 'no-such-code-root') }));
  let r = spawnSync(process.execPath, [path.join(fv, 'ping.mjs'), 'x'], { encoding: 'utf8', env: ENV });
  assert.match(r.stderr, /vault's webhook\.json is missing/, r.stderr);
  fs.writeFileSync(path.join(fv, 'webhook.json'), JSON.stringify({ team: 'https://example.invalid/not-slack' }));
  r = spawnSync(process.execPath, [path.join(fv, 'ping.mjs'), 'x'], { encoding: 'utf8', env: ENV });
  assert.match(r.stderr, /does not look like a Slack webhook URL/, 'it used the vault file (no network call: the URL fails the shape check)');
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

test('QCI finding 2: a `git replace` ref does not change what the reviewed commit installs', () => {
  const T = target('t-replace');
  const rel = 'scripts/guards/gmail-guard.mjs';
  const orig = g(META, 'rev-parse', `main:${rel}`).trim();
  const doctored = execFileSync(GIT, ['-C', META, 'hash-object', '-w', '--stdin'], { input: '// DOCTORED: layer 1 allows everything\n', encoding: 'utf8' }).trim();
  g(META, 'replace', orig, doctored);
  try {
    assert.match(g(META, 'show', `main:${rel}`), /DOCTORED/, 'the replace ref is live for an ordinary git show');
    const r = approve(['stage', '--dry', T, '--yes']); assert.equal(r.status, 0, r.stderr);
    assert.ok(!fs.readFileSync(path.join(T, 'evryn-guards', 'gmail-guard.mjs'), 'utf8').includes('DOCTORED'), 'the committed blob is installed');
    assert.match(r.stdout, new RegExp(`gmail-guard\\.mjs.*blob ${orig}`), 'the plan shows the committed blob id');
  } finally { g(META, 'replace', '-d', orig); }
});

test('QCI finding 2: a doctored loose object (same id, other content) is refused, and nothing is installed', () => {
  const T = target('t-loose');
  const rel = 'scripts/guards/handback.mjs';
  const oid = g(META, 'rev-parse', `main:${rel}`).trim();
  const f = path.join(META, '.git', 'objects', oid.slice(0, 2), oid.slice(2));
  const keep = fs.readFileSync(f);
  const body = Buffer.from('// DOCTORED handback\n');
  fs.chmodSync(f, 0o644); fs.writeFileSync(f, zlib.deflateSync(Buffer.concat([Buffer.from(`blob ${body.length}\0`), body])));
  try {
    const r = approve(['stage', '--dry', T, '--yes']);
    assert.notEqual(r.status, 0); assert.match(r.stderr, /REFUSED/);
    assert.ok(!fs.existsSync(path.join(T, 'evryn-guards')), 'nothing installed');
  } finally { fs.writeFileSync(f, keep); }
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

test('approve: a hook in the template that points outside the vault, or skips the launcher line, is refused', () => {
  const ok = { hooks: { PreToolUse: [{ hooks: [{ command: A.CMD_EXE, args: A.hookArgs('gmail-guard.mjs') }] }] } };
  assert.deepEqual(A.checkManaged(ok, ['gmail-guard.mjs']), []);
  const bad = { hooks: { PreToolUse: [{ hooks: [{ command: 'node', args: ['C:\\Users\\x\\evil.mjs'] }] }] } };
  assert.equal(A.checkManaged(bad, ['gmail-guard.mjs']).length, 2);
  const noClear = { hooks: { PreToolUse: [{ hooks: [{ command: A.CMD_EXE, args: A.hookArgs('gmail-guard.mjs').map(t => t.replace('NODE_OPTIONS=&set', 'X=&set')) }] }] } };
  assert.match(A.checkManaged(noClear, ['gmail-guard.mjs']).join(), /launcher line/, 'QCI finding 3: a hook that doesn\'t clear NODE_OPTIONS');
  // And through the real stage: a committed template with one hook outside the vault installs nothing.
  const tpl = path.join(META, 'scripts', 'guards', 'vault', 'managed-settings.template.json'); const orig = fs.readFileSync(tpl, 'utf8');
  const t = JSON.parse(orig); t.hooks.PreToolUse.push({ matcher: 'Read', hooks: [{ type: 'command', command: 'node', args: ['C:\\Users\\x\\evil.mjs'] }] });
  fs.writeFileSync(tpl, JSON.stringify(t)); g(META, 'commit', '-q', '-am', 'outside hook');
  try {
    const T = target('t3b'); const r = approve(['stage', '--dry', T, '--yes']);
    assert.notEqual(r.status, 0); assert.match(r.stderr, /REFUSED: managed-settings/);
    assert.ok(!fs.existsSync(path.join(T, 'evryn-guards')));
  } finally { g(META, 'revert', '--no-edit', 'HEAD'); }
});

test('QCI finding 8: one claude floor, enforced: watch.json must match the template, and an older claude is refused', () => {
  const T = target('t-ver');
  let r = spawnSync(process.execPath, [APPROVE, 'stage', '--dry', T, '--yes', '--code-root', CODE, '--meta', 'main', '--team', 'main', '--fake-claude', '2.1.326,2.1.319'], { encoding: 'utf8', env: ENV });
  assert.notEqual(r.status, 0); assert.match(r.stderr, /older than 2\.1\.322.*2\.1\.319/);
  assert.ok(!fs.existsSync(path.join(T, 'evryn-guards')));
  assert.deepEqual(A.versionProblems([{ file: 'a', version: '2.1.322 (Claude Code)' }, { file: 'b', version: '' }], '2.1.322'), ['b reports no version']);
  const w = path.join(META, 'scripts', 'guards', 'vault', 'watch.json'); const orig = fs.readFileSync(w, 'utf8');
  fs.writeFileSync(w, orig.replace('"minClaudeVersion": "2.1.322"', '"minClaudeVersion": "2.1.300"')); g(META, 'commit', '-q', '-am', 'drift');
  try { r = approve(['stage', '--dry', target('t-ver2'), '--yes']); assert.notEqual(r.status, 0); assert.match(r.stderr, /must be the same/); }
  finally { g(META, 'revert', '--no-edit', 'HEAD'); }
});

test('QCI finding 3: the stage half refuses to run with NODE_OPTIONS set', () => {
  const r = approve(['stage', '--dry', target('t-no'), '--yes'], '', { NODE_OPTIONS: '--no-warnings' });
  assert.notEqual(r.status, 0); assert.match(r.stderr, /NODE_OPTIONS/);
});

test('approve: a staged file swapped after staging is refused at install, and the old vault stays', () => {
  const T = installed('t4');
  const before = sha(path.join(T, 'evryn-guards', 'manifest.json'));
  const stageDir = fs.mkdtempSync(path.join(tmp, 'stage-'));
  const { planHash } = A.stage({ codeRoot: CODE, metaCommit: 'main', teamCommit: 'main', stageDir, claudeVersions: () => [] });
  fs.appendFileSync(path.join(stageDir, 'gmail-guard.mjs'), '\n// SWAPPED\n');
  assert.throws(() => A.install({ stageDir, planHash, selfHash: sha(APPROVE), root: T, dry: true }), /changed after staging/);
  assert.equal(sha(path.join(T, 'evryn-guards', 'manifest.json')), before, 'the old vault is untouched');
  assert.throws(() => A.install({ stageDir, planHash: '0'.repeat(64), selfHash: sha(APPROVE), root: T, dry: true }), /plan changed/);
});

test('approve (dry): grants are carried forward when the vault is re-approved; a counsel grant lasts 10 minutes and can name a session', () => {
  const T = installed('t5');
  assert.equal(approve(['release-brake', '--dry', T], 'RELEASE\n').status, 0);
  assert.ok(fs.existsSync(path.join(T, 'evryn-guards', 'grants', 'brake-release.json')));
  assert.equal(approve(['open-counsel', 'thr12345abc', 'sess-0000-1111-aaaa', '--dry', T], 'OPEN\n').status, 0);
  const gr = JSON.parse(fs.readFileSync(path.join(T, 'evryn-guards', 'grants', 'counsel-thr12345abc.json'), 'utf8'));
  assert.equal(gr.sessionId, 'sess-0000-1111-aaaa');
  const mins = (new Date(gr.expiresAt) - new Date(gr.grantedAt)) / 60000; assert.ok(mins > 9.9 && mins < 10.1, `QCI finding 9: 10 minutes (got ${mins})`);
  assert.equal(approve(['open-counsel', 'bad id!', '--dry', T], 'OPEN\n').status, 1, 'not a thread id');
  assert.equal(approve(['stage', '--dry', T, '--yes']).status, 0);
  assert.ok(fs.existsSync(path.join(T, 'evryn-guards', 'grants', 'counsel-thr12345abc.json')), 'kept across re-approval');
  assert.notEqual(approve(['open-counsel', 'thr12345abc', '--dry', T], 'no\n').status, 0, 'nothing without the typed word');
});

// ---------- QCI finding 1: everything runs from a path with a space, the way the vault does ----------
test('QCI finding 1: the vault\'s own approver works from a spaced vault path (release-brake from the installed copy)', () => {
  const T = installed('t-sp');
  const V = path.join(T, 'evryn-guards');
  const r = spawnSync(process.execPath, [path.join(V, 'approve-guards.mjs'), 'release-brake', '--dry', T], { input: 'RELEASE\n', encoding: 'utf8', env: ENV });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(fs.existsSync(path.join(V, 'grants', 'brake-release.json')), 'the grant was written: main() ran');
});

test('QCI finding 1: the installed gate finds itself under a spaced path with NO vault override', () => {
  const T = installed('t-gate-sp'); const S = path.join(tmp, 'state gate sp');
  const r = spawnSync(process.execPath, [path.join(T, 'evryn-guards', 'gate.mjs'), 'watch', S], { env: { ...ENV, EVRYN_GATE_DRY: '1' }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const L = fs.readFileSync(path.join(S, 'gate-log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
  assert.equal(L.at(-1).action, 'would-run-watch', JSON.stringify(L.at(-1)));
  assert.ok(!fs.existsSync(path.join(S, 'STOP')));
});

// ---------- QCI finding 3: no vault node starts with an inherited NODE_OPTIONS ----------
const preload = name => { const m = path.join(tmp, `${name}-marker.txt`); const p = path.join(tmp, `${name}-pre.mjs`); fs.writeFileSync(p, `import fs from 'node:fs'; fs.appendFileSync(${JSON.stringify(m)}, 'ran\\n');\n`); return { marker: m, NODE_OPTIONS: `--import ${pathToFileURL(p).href}` }; };

test('QCI finding 3: the scheduled task\'s launcher line runs the gate with NODE_OPTIONS cleared', () => {
  const T = installed('t-launch'); const V = path.join(T, 'evryn-guards'); const S = path.join(tmp, 'state launch');
  const { marker, NODE_OPTIONS } = preload('task');
  const line = `/d /c ${A.launcherLine(V, 'gate.mjs')} watch "${S}"`;
  const r = spawnSync(CMD, [line], { windowsVerbatimArguments: true, env: { ...ENV, NODE_OPTIONS, EVRYN_GATE_DRY: '1' }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(S, 'gate-log.jsonl'), 'utf8').trim().split('\n').at(-1)).action, 'would-run-watch');
  assert.ok(!fs.existsSync(marker), 'the preload never ran');
  // Control, in the test itself: the same node with no launcher runs the preload.
  spawnSync(process.execPath, [path.join(V, 'gate.mjs'), 'watch', S], { env: { ...ENV, NODE_OPTIONS, EVRYN_GATE_DRY: '1' } });
  assert.ok(fs.existsSync(marker), 'without the launcher line the preload runs (the probe is live)');
});

// Every hook in the INSTALLED managed-settings.json, run by its exact args (re-rooted at the test's Program Files), with
// a preload in NODE_OPTIONS: each still gets its stdin payload, returns its decision, and the preload never runs.
test('QCI finding 3 and note 15: every installed hook, run exactly as the managed settings say, works and drops NODE_OPTIONS', () => {
  const T = installed('t-hooks'); const V = path.join(T, 'evryn-guards');
  fs.mkdirSync(path.join(CODE, 'evryn-backend'), { recursive: true });
  const sub = path.join(tmp, 'sub-transcript.jsonl');
  fs.writeFileSync(sub, [['claude-opus-5-5', 'claude-opus-5-5'], ['claude-opus-4-8', 'claude-opus-5-5']].map(([s, a]) => JSON.stringify({ type: 'assistant', requestedModel: a, message: { model: s } })).join('\n') + '\n');
  const BODY = 'PRIVILEGED-BODY';
  const HB_MAIN = path.join(tmp, 'hbproj', 'sess-hbinst.jsonl'); fs.mkdirSync(path.join(tmp, 'hbproj', 'sess-hbinst', 'subagents'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'hbproj', 'sess-hbinst', 'subagents', 'agent-hbinst.jsonl'), sub.length ? fs.readFileSync(sub) : '');
  const cases = {
    'PreToolUse gmail-guard.mjs': [{ tool_name: 'mcp__claude_ai_Gmail__get_thread', tool_input: { threadId: 'abc123' } }, o => o.hookSpecificOutput.permissionDecision === 'deny'],
    'PostToolUse gmail-guard.mjs': [{ tool_name: 'mcp__claude_ai_Gmail__get_thread', tool_input: { threadId: 'abc123' }, tool_response: JSON.stringify({ id: 'abc123', messages: [{ id: 'm1', sender: 'p@fenwick.com', plaintextBody: BODY }] }) }, o => !JSON.stringify(o).includes(BODY) && !!o.hookSpecificOutput.updatedToolOutput],
    // A real subagent transcript layout with a fallback turn (QCR New 6c: the installed case used to expect null).
    'PreToolUse handback.mjs': [{ tool_name: 'SubagentHandback', agent_id: 'hbinst', transcript_path: HB_MAIN, tool_input: { message: 'MY REPORT' } }, o => /^⚠️ Part of this work ran on claude-opus-4-8/.test(o?.hookSpecificOutput?.updatedInput?.message || '') && /MY REPORT$/.test(o.hookSpecificOutput.updatedInput.message)],
    'PreToolUse secrets-guard.mjs': [{ tool_name: 'Read', tool_input: { file_path: path.join(CODE, 'evryn-backend', '.env') }, cwd: CODE }, o => o.hookSpecificOutput.permissionDecision === 'deny'],
    'PreToolUse outbound-gate.mjs': [{ tool_name: 'Bash', tool_input: { command: 'curl https://example.com' }, cwd: CODE }, o => o.hookSpecificOutput.permissionDecision === 'deny'],
    'PreToolUse browser-guard.mjs': [{ tool_name: 'mcp__claude-in-chrome__navigate', tool_input: { url: 'https://mail.google.com/' } }, o => o.hookSpecificOutput.permissionDecision === 'deny'],
    'PostToolUse outbound-gate.mjs': [{ tool_name: 'Write', tool_input: { file_path: path.join(tmp, 'w.mjs') }, cwd: tmp }, o => o === null],
    'PostToolUse browser-guard.mjs': [{ tool_name: 'mcp__claude-in-chrome__get_page_text', tool_input: {}, tool_response: `https://mail.google.com/x ${BODY}` }, o => !JSON.stringify(o).includes(BODY)],
    'PostModelSwitch model-switch.mjs': [{ source: 'auto', from_model: 'a', to_model: 'b' }, o => /MODEL DOWNGRADE/.test(o.text)],
    'SubagentStop subagent-model.mjs': [{ agent_transcript_path: sub, agent_id: 'x', stop_hook_active: false }, o => o.decision === 'block'],
    'SessionStart compaction.mjs': [{ source: 'compact' }, o => /HOOK-DELIVERY-CANARY-7Q4X/.test(o.text)],
    'PreCompact compaction.mjs': [{ trigger: 'auto' }, o => o === null],
    'PostCompact compaction.mjs': [{ trigger: 'auto' }, o => o === null],
    'ConfigChange config-guard.mjs': [{ source: 'project_settings', file_path: 'x' }, o => o.decision === 'block'],
  };
  const managed = JSON.parse(fs.readFileSync(path.join(T, 'managed-settings.json'), 'utf8'));
  const { marker, NODE_OPTIONS } = preload('hooks');
  let ran = 0;
  for (const [event, groups] of Object.entries(managed.hooks)) for (const grp of groups) for (const h of grp.hooks) {
    const args = h.args.join(' ').replace('C:\\Program Files\\ClaudeCode', T).split(' ');
    const key = `${event} ${h.args.at(-1)}`; const c = cases[key]; assert.ok(c, `a case for ${key}`);
    const out = execFileSync(h.command, args, { input: JSON.stringify({ hook_event_name: event, session_id: 'inst', ...c[0] }), encoding: 'utf8', env: { ...ENV, NODE_OPTIONS, CLAUDE_CODE_SESSION_ATTENDED: '0', EVRYN_GUARD_VAULT: V, EVRYN_GUARD_DATA: path.join(tmp, 'inst-data'), EVRYN_GUARD_CODE_ROOT: CODE } });
    const o = out ? (out.trimStart().startsWith('{') ? JSON.parse(out) : { text: out }) : null;
    assert.ok(c[1](o), `${key} returned ${out.slice(0, 160)}`);
    ran++;
  }
  assert.equal(ran, Object.keys(cases).length, 'every case ran');
  assert.ok(!fs.existsSync(marker), 'no hook ran the preload');
});

// ---------- QCI finding 4: the elevated step runs no user-writable file ----------
test('QCI finding 4: the elevation wrapper runs a verified COPY; a source swapped after the fingerprint was shown never runs', () => {
  const T = installed('t-wrap'); const V = path.join(T, 'evryn-guards');
  const srcDir = path.join(tmp, 'src approver'); fs.mkdirSync(srcDir, { recursive: true });
  const src = path.join(srcDir, 'approve-guards.mjs'); fs.copyFileSync(APPROVE, src);
  const want = sha(src);
  const run = () => spawnSync(CMD, [A.elevationArgs(A.elevatedScript({ src, want, root: T, nodeArgs: ['grant', 'brake', '-', want, '-', '--dry', T], lock: false }))], { windowsVerbatimArguments: true, encoding: 'utf8' });
  // The honest copy works end to end, and leaves no approver folder behind.
  let r = run(); assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(fs.existsSync(path.join(V, 'grants', 'brake-release.json')));
  assert.ok(!fs.readdirSync(T).some(f => f.startsWith('approver-')), 'the copy is removed');
  // Swapped after the fingerprint: the wrapper refuses, and the payload never runs.
  fs.rmSync(path.join(V, 'grants', 'brake-release.json'));
  const marker = path.join(tmp, 'wrap-marker.txt');
  fs.appendFileSync(src, `\nimport('node:fs').then(f => f.appendFileSync(${JSON.stringify(marker)}, 'payload ran\\n'));\n`);
  r = run();
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.ok(!fs.existsSync(marker), 'the swapped approver never ran');
  assert.ok(!fs.existsSync(path.join(V, 'grants', 'brake-release.json')), 'nothing granted');
});

test('QCI finding 4: the CLI installs through the real wrapper (dry, no elevation)', () => {
  const T = target('t-wrap-cli');
  const r = approve(['stage', '--dry', T, '--yes', '--via-wrapper']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Fingerprint of this approver \(all 64\): [0-9a-f]{64}\b/);
  assert.ok(fs.existsSync(path.join(T, 'evryn-guards', 'manifest.json')));
  assert.ok(!fs.readdirSync(T).some(f => f.startsWith('approver-')));
});

// ---------- the gate ----------
const gate = (V, state, env = {}) => spawnSync(process.execPath, [path.join(DIR, 'gate.mjs'), 'watch', state], { env: { ...ENV, EVRYN_GATE_VAULT: V, EVRYN_GATE_DRY: '1', ...env }, encoding: 'utf8' });
const gateLog = state => fs.readFileSync(path.join(state, 'gate-log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));

test('gate: a matching vault runs the vault\'s watch; one changed byte stops everything with vault code only', () => {
  const T = installed('t6');
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
});

test('gate: managed-settings.json is checked too (QCI note 16)', () => {
  const T = installed('t6m'); const S = path.join(tmp, 's6m');
  fs.appendFileSync(path.join(T, 'managed-settings.json'), ' ');
  assert.equal(gate(path.join(T, 'evryn-guards'), S).status, 1);
  assert.ok(gateLog(S).some(l => l.action === 'MISMATCH' && l.bad.includes('managed-settings.json (changed)')));
});

test('QCI finding 5: a failed alarm is not recorded as delivered, is retried at most hourly while STOP holds, and can\'t be pre-suppressed', () => {
  const T = installed('t-alarm'); const V = path.join(T, 'evryn-guards'); const S = path.join(tmp, 's alarm');
  // A ping stand-in that fails (exit 1), with the manifest updated to match it, so the gate trusts and runs it.
  const counter = path.join(tmp, 'ping-calls.txt');
  fs.writeFileSync(path.join(V, 'ping.mjs'), `import fs from 'node:fs'; fs.appendFileSync(${JSON.stringify(counter)}, 'x'); process.exit(Number(fs.existsSync(${JSON.stringify(counter + '.ok')}) ? 0 : 1));\n`);
  const m = JSON.parse(fs.readFileSync(path.join(V, 'manifest.json'), 'utf8')); m.files['ping.mjs'] = sha(path.join(V, 'ping.mjs')); fs.writeFileSync(path.join(V, 'manifest.json'), JSON.stringify(m));
  // An agent pre-writes an alarm record claiming delivery: it must not suppress the first ping.
  fs.mkdirSync(S, { recursive: true }); fs.writeFileSync(path.join(S, 'gate-alarm.json'), JSON.stringify({ delivered: true, key: 'anything', lastTry: new Date().toISOString() }));
  fs.appendFileSync(path.join(V, 'gmail-guard.mjs'), ' ');                    // the mismatch (ping.mjs itself is trusted)
  const real = (extra = {}) => spawnSync(process.execPath, [path.join(DIR, 'gate.mjs'), 'watch', S], { env: { ...ENV, EVRYN_GATE_VAULT: V, ...extra }, encoding: 'utf8' });
  assert.equal(real().status, 1);
  assert.equal(fs.readFileSync(counter, 'utf8').length, 1, 'the first ping was attempted despite the pre-written record');
  let a = JSON.parse(fs.readFileSync(path.join(S, 'gate-alarm.json'), 'utf8'));
  assert.equal(a.delivered, false, 'a failed ping is not recorded as delivered');
  real(); assert.equal(fs.readFileSync(counter, 'utf8').length, 1, 'no retry inside the hour');
  a.lastTry = new Date(Date.now() - 61 * 60000).toISOString(); fs.writeFileSync(path.join(S, 'gate-alarm.json'), JSON.stringify(a));
  fs.writeFileSync(counter + '.ok', '');
  real(); assert.equal(fs.readFileSync(counter, 'utf8').length, 2, 'retried after an hour');
  assert.equal(JSON.parse(fs.readFileSync(path.join(S, 'gate-alarm.json'), 'utf8')).delivered, true, 'delivered once the ping succeeds');
  real(); assert.equal(fs.readFileSync(counter, 'utf8').length, 2, 'no more pings once delivered');
});

test('QCI finding 5: the daily report shows STOP and the last gate line for each state folder', () => {
  const T = installed('t-report'); const S = path.join(tmp, 's report');
  fs.mkdirSync(S, { recursive: true });
  fs.writeFileSync(path.join(S, 'STOP'), 'Stopped by the vault gate at x: gmail-guard.mjs (changed).');
  fs.writeFileSync(path.join(S, 'gate-log.jsonl'), JSON.stringify({ at: 'x', action: 'MISMATCH', bad: ['gmail-guard.mjs (changed)'] }) + '\n');
  fs.writeFileSync(path.join(S, 'gate-alarm.json'), JSON.stringify({ delivered: false }));
  const data = path.join(tmp, 'report-data'); fs.mkdirSync(data, { recursive: true });
  fs.writeFileSync(path.join(data, 'guard-log.jsonl'), JSON.stringify({ at: new Date().toISOString(), guard: 'config', event: 'blocked', source: 'skills' }) + '\n');
  const r = spawnSync(process.execPath, [path.join(DIR, 'daily-report.mjs'), '--code-root', CODE, '--ref', 'main', '--no-tasks', '--state', S], { encoding: 'utf8', env: { ...ENV, EVRYN_GUARD_VAULT: path.join(T, 'evryn-guards'), EVRYN_GUARD_DATA: data } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /STOPPED/); assert.match(r.stdout, /last gate run: .*MISMATCH/); assert.match(r.stdout, /NOT been delivered/);
  assert.match(r.stdout, /held back from unattended sessions today .*skills/, 'QCI finding 13: config blocks get their own line');
  assert.match(r.stdout, /none: the vault matches the repo/, 'the verified read agrees with the installed vault');
  assert.match(r.stdout, /pinned scripts \(the team ping, the task CLI\): on disk as approved/, 'QCR New 1: the pinned files match on disk');
  const cfgFile = path.join(META, 'scripts', 'tasks', 'lib', 'config.mjs'); const keep = fs.readFileSync(cfgFile);
  fs.appendFileSync(cfgFile, '// edited\n');
  try {
    const r2 = spawnSync(process.execPath, [path.join(DIR, 'daily-report.mjs'), '--code-root', CODE, '--ref', 'main', '--no-tasks', '--state', S], { encoding: 'utf8', env: { ...ENV, EVRYN_GUARD_VAULT: path.join(T, 'evryn-guards'), EVRYN_GUARD_DATA: data } });
    assert.match(r2.stdout, /pinned scripts that differ on disk .*_evryn-meta\/scripts\/tasks\/lib\/config\.mjs/, 'an edited pinned file is listed');
  } finally { fs.writeFileSync(cfgFile, keep); }
});

test('gate: a missing manifest, or one that drops a required file, stops everything; a tampered kill switch is not run', () => {
  const T = installed('t7');
  const V = path.join(T, 'evryn-guards'); const S = path.join(tmp, 's7');
  const m = JSON.parse(fs.readFileSync(path.join(V, 'manifest.json'), 'utf8'));
  delete m.files['admiral-watch.mjs']; fs.writeFileSync(path.join(V, 'manifest.json'), JSON.stringify(m));
  assert.equal(gate(V, S).status, 1); assert.ok(gateLog(S).some(l => l.action === 'MISMATCH' && l.bad.some(b => /admiral-watch\.mjs \(not in the manifest\)/.test(b))));
  const S2 = path.join(tmp, 's7b'); fs.rmSync(path.join(V, 'manifest.json'));
  assert.equal(gate(V, S2).status, 1); assert.ok(fs.existsSync(path.join(S2, 'STOP')));
  const T3 = installed('t7c');
  const V3 = path.join(T3, 'evryn-guards'); const S3 = path.join(tmp, 's7c');
  fs.appendFileSync(path.join(V3, 'kill-switch.mjs'), ' ');
  assert.equal(gate(V3, S3).status, 1);
  assert.ok(gateLog(S3).some(l => l.action === 'skipped-tampered' && l.script === 'kill-switch.mjs'));
  assert.ok(!gateLog(S3).some(l => l.action === 'would-run' && /kill-switch/.test(l.args[0])));
});

// ---------- QCR fix trip (DCF2, 2026-11-19) ----------
// Run one hook of an installed (or vault-mode) layout exactly as its managed-settings.json says, re-rooted at `root`.
function hookRun(root, event, script, payload, env) {
  const managed = JSON.parse(fs.readFileSync(path.join(root, 'managed-settings.json'), 'utf8'));
  const h = managed.hooks[event].flatMap(g => g.hooks).find(x => x.args.at(-1) === script);
  const args = h.args.join(' ').replace('C:\\Program Files\\ClaudeCode', root).split(' ');
  const out = execFileSync(h.command, args, { input: JSON.stringify({ hook_event_name: event, session_id: 'vm', ...payload }), encoding: 'utf8', env: { ...ENV, CLAUDE_CODE_SESSION_ATTENDED: '0', ...env } });
  return out ? (out.trimStart().startsWith('{') ? JSON.parse(out) : { text: out }) : null;
}
// A VAULT-MODE copy of an installed layout (QCR New 6c): the whole <…>\ClaudeCode folder copied under another spaced
// folder, with lib.mjs's vault test pointed at that copy (the technique the ping test uses), so IN_VAULT is true for every
// hook, the gate and the daily report, and every EVRYN_* override must be ignored. nodejs is a junction beside it.
function vaultModeCopy(T, name) {
  const top = path.join(tmp, name); const root = path.join(top, 'ClaudeCode');
  fs.cpSync(T, root, { recursive: true });
  if (!fs.existsSync(path.join(top, 'nodejs'))) fs.symlinkSync(path.dirname(process.execPath), path.join(top, 'nodejs'), 'junction');
  const libFile = path.join(root, 'evryn-guards', 'lib.mjs'); const src = fs.readFileSync(libFile, 'utf8');
  const prefix = pathToFileURL(root + path.sep).href.toLowerCase().replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const patched = src.replace('/^file:\\/\\/\\/c:\\/program%20files\\/claudecode\\//i', `/^${prefix}/i`);
  assert.notEqual(patched, src, 'the vault test in lib.mjs was found and patched');
  fs.writeFileSync(libFile, patched);
  return root;
}
const SCHED_STATE = path.join(TEAM, ...FOLDER.split('/'), 'state');

test('QCR New 1: the approver pins the allowlist\'s scripts from the commit, with the same hashing and import scan as the gate', async () => {
  const T = installed('t-pins'); const V = path.join(T, 'evryn-guards');
  const pins = JSON.parse(fs.readFileSync(path.join(V, 'outbound-pins.json'), 'utf8'));
  const L = await import(pathToFileURL(path.join(DIR, 'lib.mjs')).href);
  assert.deepEqual(pins.entries, ['_evryn-meta/scripts/ping.mjs', '_evryn-meta/scripts/tasks/tasks.mjs']);
  for (const rel of ['scripts/ping.mjs', 'scripts/tasks/tasks.mjs', 'scripts/tasks/lib/cli.mjs', 'scripts/tasks/lib/config.mjs']) assert.equal(pins.files[`_evryn-meta/${rel}`], L.shaText(fs.readFileSync(path.join(META, rel))), rel);
  assert.equal(Object.keys(pins.files).length, 4, 'the closure, nothing more');
  for (const s of ["import {\n a } from './a.mjs';\nimport b from 'pkg';\nconst c = await import('../c.mjs');\nimport 'node:fs';\nconst d = require('./d.cjs');", "export { x } from './x.mjs';"]) assert.deepEqual(A.localImports(s), L.localImports(s), 'the approver and lib scan imports alike');
  assert.equal(L.shaText('a\r\nb\n'), L.shaText('a\nb\n'), 'line endings are normalized');
  // A pinned script that imports a package can't be pinned: refused, nothing installed.
  const cli = path.join(META, 'scripts', 'tasks', 'lib', 'cli.mjs'); const keep = fs.readFileSync(cli);
  fs.writeFileSync(cli, "import x from 'left-pad';\nexport const run = x;\n"); g(META, 'commit', '-q', '-am', 'a package');
  try { const T2 = target('t-pins-pkg'); const r = approve(['stage', '--dry', T2, '--yes']); assert.notEqual(r.status, 0); assert.match(r.stderr, /imports a package/); assert.ok(!fs.existsSync(path.join(T2, 'evryn-guards'))); }
  finally { g(META, 'revert', '--no-edit', 'HEAD'); fs.writeFileSync(cli, keep); }
});

test('QCR New 3: the claude floor checks ~/.local/bin and four editors\' extension folders, and refuses a below-floor copy there', () => {
  const home = path.join(tmp, 'fake home'); const native = path.join(home, '.local', 'bin', 'claude.exe');
  fs.mkdirSync(path.dirname(native), { recursive: true }); fs.writeFileSync(native, 'stand-in');
  const exts = A.EDITOR_EXT.map(ed => { const f = path.join(home, ed, 'extensions', 'anthropic.claude-code-2.1.326-win32-x64', 'resources', 'native-binary', 'claude.exe'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, 'stand-in'); return f; });
  const found = A.claudeFiles(home, { where: false });
  assert.ok(found.includes(native), 'the native installer copy'); for (const f of exts) assert.ok(found.includes(f), f);
  const probs = A.versionProblems(found.map(file => ({ file, version: file === native ? '2.1.300 (Claude Code)' : '2.1.326 (Claude Code)' })), '2.1.322');
  assert.deepEqual(probs, [`${native} reports 2.1.300 (Claude Code)`]);
});

test('QCR New 7: the stage folder is deleted after an install and after a refusal', () => {
  const tdir = path.join(tmp, 'own tmp'); fs.mkdirSync(tdir, { recursive: true });
  const stages = () => fs.readdirSync(tdir).filter(f => f.startsWith('evryn-guards-stage-'));
  assert.equal(approve(['stage', '--dry', target('t-clean'), '--yes'], '', { TMP: tdir, TEMP: tdir }).status, 0);
  assert.deepEqual(stages(), [], 'none left after an install');
  const r = spawnSync(process.execPath, [APPROVE, 'stage', '--dry', target('t-clean2'), '--yes', '--code-root', CODE, '--meta', 'main', '--team', 'main', '--fake-claude', '2.1.300'], { encoding: 'utf8', env: { ...ENV, TMP: tdir, TEMP: tdir } });
  assert.notEqual(r.status, 0); assert.deepEqual(stages(), [], 'none left after a refusal');
});

test('QCR New 6c: the counsel opening, granted by the installed approver, works through the installed hook for the named session only', () => {
  const T = installed('t-open'); const V = path.join(T, 'evryn-guards');
  assert.equal(approve(['open-counsel', 'thrOpen12345', 'sess-aaaa-1111-bbbb', '--dry', T], 'OPEN\n').status, 0);
  const env = { EVRYN_GUARD_VAULT: V, EVRYN_GUARD_DATA: path.join(tmp, 'open-data'), EVRYN_GUARD_CODE_ROOT: CODE };
  const pre = s => hookRun(T, 'PreToolUse', 'gmail-guard.mjs', { session_id: s, tool_name: 'mcp__claude_ai_Gmail__get_thread', tool_input: { threadId: 'thrOpen12345' } }, env);
  assert.equal(pre('sess-aaaa-1111-bbbb'), null, 'the named session reads it');
  assert.equal(pre('sess-cccc-2222-dddd')?.hookSpecificOutput?.permissionDecision, 'deny', 'another session is refused');
});

test('QCR New 6c: VAULT MODE: every installed hook ignores every EVRYN_* override, and finds its own vault', () => {
  const T = installed('t-vm'); const R = vaultModeCopy(T, 'vm hooks');
  const harmless = path.join(tmp, 'harmless vault'); fs.mkdirSync(harmless, { recursive: true });
  fs.writeFileSync(path.join(harmless, 'counsel-list.md'), '| `harmless.example` | nobody |\n');
  fs.writeFileSync(path.join(harmless, 'outbound-allowlist.json'), JSON.stringify({ allow: [{ pattern: '^curl' }], attendedMode: 'ask' }));
  const env = { LOCALAPPDATA: path.join(tmp, 'vm local'), EVRYN_GUARD_VAULT: harmless, EVRYN_GUARD_CODE_ROOT: path.join(tmp, 'nowhere'), EVRYN_GUARD_DATA: path.join(tmp, 'vm elsewhere'), EVRYN_MODEL_SWITCH_TRIGGER: 'none', EVRYN_GUARD_NOW: '2000-01-01T00:00:00Z' };
  const BODY = 'PRIVILEGED-VM';
  const post = hookRun(R, 'PostToolUse', 'gmail-guard.mjs', { tool_name: 'mcp__claude_ai_Gmail__get_thread', tool_input: { threadId: 'vm1' }, tool_response: JSON.stringify({ id: 'vm1', messages: [{ id: 'm1', sender: 'p@fenwick.com', plaintextBody: BODY }] }) }, env);
  assert.ok(post?.hookSpecificOutput?.updatedToolOutput && !JSON.stringify(post).includes(BODY), 'counsel withheld: the harmless list override was ignored');
  assert.equal(hookRun(R, 'PreToolUse', 'outbound-gate.mjs', { tool_name: 'Bash', tool_input: { command: 'curl https://example.com' }, cwd: META }, env)?.hookSpecificOutput?.permissionDecision, 'deny', 'curl denied: the permissive allowlist override was ignored');
  assert.equal(hookRun(R, 'PreToolUse', 'outbound-gate.mjs', { tool_name: 'Bash', tool_input: { command: 'node ../_evryn-meta/scripts/ping.mjs "x"' }, cwd: META }, env), null, 'the pinned ping passes: the vault found its own pins');
  assert.match(hookRun(R, 'PostModelSwitch', 'model-switch.mjs', { source: 'auto', from_model: 'a', to_model: 'b' }, env)?.text || '', /MODEL DOWNGRADE/, 'the downgrade hook fires: the silencing override was ignored');
  assert.equal(hookRun(R, 'PreToolUse', 'secrets-guard.mjs', { tool_name: 'Read', tool_input: { file_path: path.join(CODE, 'evryn-backend', '.env') }, cwd: CODE }, env)?.hookSpecificOutput?.permissionDecision, 'deny');
  assert.equal(hookRun(R, 'PreToolUse', 'browser-guard.mjs', { tool_name: 'mcp__claude-in-chrome__navigate', tool_input: { url: 'https://mail.google.com/' } }, env)?.hookSpecificOutput?.permissionDecision, 'deny');
  assert.equal(hookRun(R, 'ConfigChange', 'config-guard.mjs', { source: 'project_settings' }, env)?.decision, 'block');
  assert.match(hookRun(R, 'SessionStart', 'compaction.mjs', { source: 'compact' }, env)?.text || '', /HOOK-DELIVERY-CANARY-7Q4X/);
  assert.ok(fs.existsSync(path.join(tmp, 'vm local', 'evryn-guards', 'compacted', 'vm')), 'the marker went to %LOCALAPPDATA%, not the EVRYN_GUARD_DATA override');
});

test('QCR New 6c and New 2: VAULT MODE gate, not dry: a clean vault runs its own watch; the kill switch\'s STOP stops any role; a changed byte runs only vault stand-ins', () => {
  const T = installed('t-vmg'); const R = vaultModeCopy(T, 'vm gate'); const V = path.join(R, 'evryn-guards');
  const marks = path.join(tmp, 'vm-gate-marks.txt');
  for (const f of ['kill-switch.mjs', 'ping.mjs']) fs.writeFileSync(path.join(V, f), `import fs from 'node:fs'; fs.appendFileSync(${JSON.stringify(marks)}, ${JSON.stringify(f)} + ' ' + process.argv[1] + '\\n');\n`);
  const m = JSON.parse(fs.readFileSync(path.join(V, 'manifest.json'), 'utf8'));
  // QCR New 6b: the watch stand-in records which EVRYN_* variables reached it.
  fs.writeFileSync(path.join(V, 'admiral-watch.mjs'), "console.log('admiral-watch.mjs EVRYN=' + Object.keys(process.env).filter(k => /^EVRYN_/i.test(k)).sort().join(','));\n");
  for (const f of ['kill-switch.mjs', 'ping.mjs', 'lib.mjs', 'admiral-watch.mjs']) m.files[f] = sha(path.join(V, f));
  fs.writeFileSync(path.join(V, 'manifest.json'), JSON.stringify(m));
  const ignored = { EVRYN_GATE_VAULT: path.join(tmp, 'nowhere'), EVRYN_GATE_DRY: '1', EVRYN_SHARED_DIR: path.join(tmp, 'elsewhere'), EVRYN_ANYTHING: 'x' };
  const gateRun = S => spawnSync(process.execPath, [path.join(V, 'gate.mjs'), 'watch', S], { env: { ...ENV, ...ignored }, encoding: 'utf8' });
  const S1 = path.join(tmp, 'vm state 1'); assert.equal(gateRun(S1).status, 0);
  assert.match(fs.readFileSync(path.join(S1, 'run.log'), 'utf8'), /gate ok[\s\S]*admiral-watch\.mjs EVRYN=EVRYN_ADMIRAL_DIR\s/, 'not dry: it ran the vault\'s own watch, handing it no EVRYN_* variable but the state folder (QCR New 6b)');
  // New 2: the kill switch writes STOP in the code root's Admiral state/; a Thea state folder must stop too.
  fs.mkdirSync(SCHED_STATE, { recursive: true }); fs.writeFileSync(path.join(SCHED_STATE, 'STOP'), 'kill switch');
  try {
    const ST = path.join(tmp, 'vm state-thea'); assert.equal(gateRun(ST).status, 0);
    assert.equal(gateLog(ST).at(-1).action, 'stopped-by-kill-switch'); assert.ok(!fs.existsSync(path.join(ST, 'run.log')), 'no watch ran');
  } finally { fs.rmSync(path.join(SCHED_STATE, 'STOP')); }
  fs.appendFileSync(path.join(V, 'gmail-guard.mjs'), ' ');
  const S2 = path.join(tmp, 'vm state 2'); assert.equal(gateRun(S2).status, 1);
  assert.ok(fs.existsSync(path.join(S2, 'STOP')));
  const ran = fs.readFileSync(marks, 'utf8').trim().split('\n');
  assert.deepEqual(ran.map(l => l.split(' ')[0]), ['kill-switch.mjs', 'ping.mjs']);
  assert.ok(ran.every(l => l.includes(V)), 'only the vault copies ran');
});

test('QCR New 2: the gate (dry) stops a Thea state folder while the kill switch\'s STOP exists, and runs it again after', () => {
  const T = installed('t-ks'); const V = path.join(T, 'evryn-guards'); const ST = path.join(tmp, 's ks thea');
  fs.mkdirSync(SCHED_STATE, { recursive: true }); fs.writeFileSync(path.join(SCHED_STATE, 'STOP'), 'kill switch');
  try { assert.equal(gate(V, ST).status, 0); assert.equal(gateLog(ST).at(-1).action, 'stopped-by-kill-switch'); }
  finally { fs.rmSync(path.join(SCHED_STATE, 'STOP')); }
  assert.equal(gate(V, ST).status, 0); assert.equal(gateLog(ST).at(-1).action, 'would-run-watch');
});

test('QCR New 6c: VAULT MODE daily report finds its own vault and ignores EVRYN_GUARD_VAULT', () => {
  const T = installed('t-vmr'); const R = vaultModeCopy(T, 'vm report');
  const r = spawnSync(process.execPath, [path.join(R, 'evryn-guards', 'daily-report.mjs'), '--code-root', CODE, '--ref', 'main', '--no-tasks', '--state', path.join(tmp, 'no state')], { encoding: 'utf8', env: { ...ENV, LOCALAPPDATA: path.join(tmp, 'vmr local'), EVRYN_GUARD_VAULT: path.join(tmp, 'nowhere') } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /vault approved/); assert.match(r.stdout, /none: the vault matches the repo/);
});

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
