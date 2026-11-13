#!/usr/bin/env node
// handback.mjs — the downgrade disclosure, written into a subagent's report itself (task T-75; Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// WHY THIS EXISTS (Fresh Soren's review, finding 13): every team subagent delivers its report through the
// SubagentHandback tool BEFORE it stops (Claude Code hooks docs, SubagentStop input: "a subagent that runs with the
// SubagentHandback tool delivers its report through that tool before it stops"; confirmed in our own transcripts).
// So a SubagentStop hook that asks for a disclosure arrives after the parent already has the report. This hook acts on
// the handback call itself: PreToolUse on SubagentHandback reads the subagent's transcript and, if any turn ran on a
// fallback model, rewrites the tool's input (updatedInput) with the disclosure as the report's first line. The parent
// gets the warning whether or not the subagent obeys anything. subagent-model.mjs stays, for subagents with no handback.
// Wired in managed-settings.json: PreToolUse, matcher "SubagentHandback". Never throws; on any error it changes nothing.

import fs from 'node:fs';
import path from 'node:path';
import { readStdin, guardLog, subagentFallback, fallbackLine, preUpdate } from './lib.mjs';

const { payload } = readStdin();
let out = null;
try {
  if (payload.hook_event_name === 'PreToolUse' && payload.tool_name === 'SubagentHandback' && payload.agent_id && payload.transcript_path) {
    // The parent's transcript is <project>/<session>.jsonl; its subagents' are <project>/<session>/subagents/agent-<id>.jsonl.
    const main = payload.transcript_path;
    const file = path.join(path.dirname(main), path.basename(main, '.jsonl'), 'subagents', `agent-${payload.agent_id}.jsonl`);
    if (fs.existsSync(file)) {
      const { asked, off } = subagentFallback(file);
      if (asked && off.length) {
        const input = { ...(payload.tool_input || {}) };
        const field = ['message', 'report', 'content', 'text'].find(k => typeof input[k] === 'string') || 'message';
        input[field] = `${fallbackLine(asked, off)}\n\n${input[field] || ''}`;
        guardLog({ guard: 'model-switch', event: 'handback-disclosed', session: payload.session_id, agent: payload.agent_id, asked, served: off });
        out = preUpdate(input);
      }
    }
  }
} catch (e) { guardLog({ guard: 'model-switch', event: 'handback-check-ERROR', session: payload.session_id, error: String(e?.message || e).slice(0, 200) }); }
if (out) process.stdout.write(out);
process.exit(0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
