#!/usr/bin/env node
// subagent-model.mjs — the subagent half of the model-downgrade hook (task T-75; Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// THE GAP IT CLOSES: a SUBAGENT whose request is flagged re-runs on the fallback model WITHOUT changing the session's
// model, so PostModelSwitch never fires for it (Claude Code model-config docs, "Subagents switch or fail without
// asking," read raw 2026-11-13). The parent then gets lesser-model work back and doesn't know.
//
// MECHANISM: on SubagentStop, read the subagent's own transcript (agent_transcript_path). Every assistant line records
// the model that served it (message.model) and the one asked for (requestedModel); checked on a real transcript
// 2026-11-13. If any turn ran on a model other than the one requested, BLOCK the stop once (decision "block": the
// reason is delivered to the subagent as its next instruction, per the hooks docs) and tell it to put the disclosure
// at the top of its final report, so the parent reads it in the result. stop_hook_active stops a second block.
// Background subagents are covered too: SubagentStop fires when the subagent finishes, not when it's launched.
// Wired in managed-settings.json: { "SubagentStop": [ { "hooks": [ { "type": "command", "command": "node ...subagent-model.mjs" } ] } ] }
// Never throws; a missing or unreadable transcript lets the stop through and logs it.

import fs from 'node:fs';
import { readStdin, guardLog } from './lib.mjs';

const { payload } = readStdin();
let out = null;
try {
  if (payload.hook_event_name === 'SubagentStop' && !payload.stop_hook_active) {
    const lines = fs.readFileSync(payload.agent_transcript_path, 'utf8').split('\n').filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(x => x?.type === 'assistant' && x.message?.model);
    const asked = lines.find(x => x.requestedModel)?.requestedModel;
    const off = [...new Set(lines.filter(x => x.requestedModel && x.message.model !== x.requestedModel && x.message.model !== '<synthetic>').map(x => x.message.model))];
    if (asked && off.length) {
      guardLog({ guard: 'model-switch', event: 'subagent-downgraded', session: payload.session_id, agent: payload.agent_id, asked, served: off });
      out = JSON.stringify({ decision: 'block', reason:
        `MODEL DOWNGRADE in this subagent: some of your turns ran on ${off.join(', ')} instead of ${asked} (an automatic safety fallback). ` +
        `Put this line at the very top of your final report, then end exactly as you were going to: ` +
        `"⚠️ Part of this work ran on ${off.join(', ')} after a safety fallback, not ${asked}. Review it as lesser-model work, or re-run it."` });
    }
  }
} catch (e) { guardLog({ guard: 'model-switch', event: 'subagent-check-ERROR', session: payload.session_id, error: String(e?.message || e).slice(0, 200) }); }
if (out) process.stdout.write(out);
process.exit(0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
