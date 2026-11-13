#!/usr/bin/env node
// subagent-model.mjs — the downgrade disclosure for a subagent that ends WITHOUT a handback (task T-75; Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// THE GAP: a SUBAGENT whose request is flagged re-runs on the fallback model WITHOUT changing the session's model, so
// PostModelSwitch never fires for it (Claude Code model-config docs, "Subagents switch or fail without asking").
// Team subagents hand their report in through SubagentHandback before they stop, so handback.mjs (PreToolUse on that
// tool) is the hook that reaches the parent for them. THIS hook covers the rest: on SubagentStop, if any turn of the
// subagent's own transcript ran on another model, block the stop once (the reason reaches the subagent as its next
// instruction, per the hooks docs) and have it lead its final text with the disclosure. stop_hook_active stops a loop.
// Never throws; a missing or unreadable transcript lets the stop through and logs it.

import { readStdin, guardLog, subagentFallback, fallbackLine } from './lib.mjs';

const { payload } = readStdin();
let out = null;
try {
  if (payload.hook_event_name === 'SubagentStop' && !payload.stop_hook_active) {
    const { asked, off } = subagentFallback(payload.agent_transcript_path);
    if (asked && off.length) {
      guardLog({ guard: 'model-switch', event: 'subagent-downgraded', session: payload.session_id, agent: payload.agent_id, asked, served: off });
      out = JSON.stringify({ decision: 'block', reason:
        `MODEL DOWNGRADE in this subagent: some of your turns ran on ${off.join(', ')} instead of ${asked} (an automatic safety fallback). ` +
        `Put this line at the very top of your final report, then end exactly as you were going to: "${fallbackLine(asked, off)}"` });
    }
  }
} catch (e) { guardLog({ guard: 'model-switch', event: 'subagent-check-ERROR', session: payload.session_id, error: String(e?.message || e).slice(0, 200) }); }
if (out) process.stdout.write(out);
process.exit(0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
