#!/usr/bin/env node
/**
 * compaction-alarm.mjs — fire when the harness compacts an agent's context.
 *
 * WHY THIS FILE EXISTS (ACm, 2026-09-08)
 * --------------------------------------
 * Compaction is the estate's worst failure mode and its least visible one. When a
 * session runs out of context the harness replaces the conversation with a summary
 * and instructs the agent NOT to acknowledge it — so the one rule that matters
 * ("if you compacted, stop") is handed to the one agent whose remembering is
 * impaired, and nothing external contradicts it. Observed live 2026-08-12: a
 * conductor compacted, complied with the suppression instruction, and worked
 * seemingly-competently for several turns without mentioning it.
 *
 * Every previous fix has been prose asking the agent to self-report. This is the
 * first one that does not depend on the compacted agent at all.
 *
 * WIRING — .claude/settings.json:
 *   "hooks": { "PostCompact": [ { "hooks": [
 *     { "type": "command", "command": "node scripts/compaction-alarm.mjs" } ] } ] }
 *
 * SAFETY: this script cannot break a session. PreCompact/PostCompact do not gate
 * anything on its output, every operation is wrapped, and it always exits 0.
 *
 * ── ROUTING RULE (Justin, 2026-09-08) ────────────────────────────────────────
 * A Slack ping goes to Justin and ONLY Justin, so a ping per compaction across a
 * many-agent estate is noise — and a LANE's compaction is its SPINNER's problem,
 * not his. ⇒ Ping Justin only for a TOP-LEVEL session. A subagent or lane gets
 * told, through the PreToolUse blocker described below, to report to its spinner.
 *
 * ⇒ THIS SCRIPT PINGS NOBODY, EVER. It records; the AGENT reports. A lane reports to
 * its spinner; a top-level AC's spinner is Justin, and ac.md already tells it that
 * reaching him means a #team-alerts ping. The hook does not need to know which it is
 * — the agent does, and that is where the knowledge already lives.
 *
 * ── MEASURED 2026-09-08, and it decides what the blocker can and cannot do ────
 * A PreToolUse payload carries `agent_id` and `agent_type` when the caller is a
 * SUBAGENT, and omits both when it is top-level. That is a clean discriminator.
 * ⚠️ BUT PostCompact does NOT carry them, and when a subagent compacts it reports
 * the PARENT's session_id. So the record says "something in this session tree
 * compacted" and cannot say WHICH agent. A sentinel keyed on session_id alone would
 * therefore also stop the parent, which did not compact. That is the open design
 * question; do not build the blocker until it is settled.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * THE SECOND HALF, NOT YET BUILT: a PreToolUse hook that reads the per-session
 * sentinel this writes and DENIES every tool call with the reason "you compacted —
 * stop and report to your spinner." PreToolUse can deny; PostCompact cannot inject
 * or block, so the denial reason is the only channel that reaches the agent.
 * Build it only once this alarm is PROVEN to fire — an unproven alarm's silence is
 * indistinguishable from calm.
 */

import { appendFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const LOG = join(REPO, '.claude', 'compaction-log.txt');
const SENTINEL_DIR = join(REPO, '.claude', 'compacted');

// The harness sends the hook payload on stdin. Never block or throw on it.
let raw = '';
try {
  raw = readFileSync(0, 'utf8');
} catch {
  /* no stdin available — fine */
}

let payload = {};
try {
  payload = raw ? JSON.parse(raw) : {};
} catch {
  /* not JSON — the raw text is preserved in the log entry below */
}

const stamp = new Date().toISOString();
const event = payload.hook_event_name ?? payload.hookEventName ?? 'compact';
const trigger = payload.trigger ?? payload.matcher ?? 'unknown';
const session = payload.session_id ?? payload.sessionId ?? 'unknown';
const cwd = payload.cwd ?? process.cwd();

// Log the COMPLETE payload. We are still learning this event's shape, and the
// field that separates a top-level session from a subagent is what we need most.
const entry =
  `${stamp}  event=${event}  trigger=${trigger}  session=${session}  cwd=${cwd}\n` +
  `    keys: ${Object.keys(payload).join(', ') || '(none)'}\n` +
  `    raw: ${raw ? raw.slice(0, 2000).replace(/\s+/g, ' ') : '(empty stdin)'}\n`;

try {
  mkdirSync(dirname(LOG), { recursive: true });
  appendFileSync(LOG, entry, 'utf8');
} catch {
  /* logging must never throw */
}

// Per-SESSION sentinel. A single shared file would let one agent's compaction
// block every other agent in the repo — in a hot multi-agent estate that is not an
// edge case, it is Tuesday.
try {
  mkdirSync(SENTINEL_DIR, { recursive: true });
  const safe = String(session).replace(/[^A-Za-z0-9._-]/g, '_');
  writeFileSync(join(SENTINEL_DIR, safe), entry, 'utf8');
} catch {
  /* ignore */
}

// No ping. See the ROUTING RULE above: we cannot yet tell a top-level session from
// a lane, and pinging on both is worse than pinging on neither.

process.exit(0);
