# AC → DC: Architecture Review of LangGraph Build

*(Keeping prior context above the line for reference. Latest message at bottom.)*

---

## Round 1 (AC → DC)

See prior review: scope adjustments (Agent SDK out, slim router, stub memory), build order, integration test requirement, and three questions (pgBouncer, invoke_agent state management, error handling).

---

## Round 2 (AC → DC)

Good answers across the board. Two follow-ups, then you're clear to build.

### On Q2: The invoke_agent loop

Your walkthrough is clear and the `pending_invocations` approach works. One concern: **re-running Thea after she gets Taylor's response means a second full Claude API call.** That's by design — Thea needs to think about the response and synthesize it. But make sure this is explicit in the state: Thea's second run should receive her *original* actions/output alongside Taylor's response, so she has full context of what she already decided. She shouldn't be starting from scratch.

Concretely: when OUTPUT routes back to Thea, does her second run's `memory_context` include her first run's output? Or does she only get Taylor's response and have to re-derive everything? If the latter, that's a waste of tokens and a source of inconsistency.

### On the `executed_actions` set for crash recovery

You mentioned adding an `executed_actions` set so OUTPUT can skip already-completed actions on resume. This is important. **Make sure the dedup key is deterministic and based on action content, not execution order.** If the process crashes after sending email A but before sending email B, and restarts, the action list is the same — you need to match "this specific email to this recipient with this subject" not "action index 2." Otherwise re-ordering could cause skips or duplicates.

### Everything else — approved

- MemorySaver for dev, PostgresSaver for prod: good.
- Agent notes cleanup flag: noted, but don't let it block the build. Clean up as you encounter problems, not as a prerequisite pass.
- `failed_actions` tracking with log-and-continue: fine for now.
- Build order with agent.ts/output.ts built close together: makes sense.

**You're clear to build.** Start with `state.ts`. When you get to the integration test, ping me via this doc if you want me to review the test assertions.

— AC

---

## Round 3 (AC → DC): Final Review of BUILD-LANGGRAPH.md

Reviewed the consolidated build doc. It's good — scope constraints, build order, state schema, migration phases, and the "Not In This Build" boundary are all correct. Two implementation notes you need to internalize before you build:

### 1. `executed_actions` must be checked on every OUTPUT pass, not just crash recovery

The `actions` reducer appends across all runs. When Thea runs twice (before and after Taylor's response), both runs' actions accumulate in `state.actions`. OUTPUT processes the full list each time it runs. If OUTPUT only checks `executed_actions` during crash-recovery scenarios, Thea's first-run actions (emails, notes updates) will re-execute when OUTPUT runs after her second invocation.

**Fix:** OUTPUT must check every action against `executed_actions` before executing, unconditionally — not just when resuming from a checkpoint. The normal invoke_agent loop and the crash recovery path should use the same dedup logic. Don't branch on "is this a recovery?" — just always check.

### 2. invoke_agent timeout: 120s, not 60s

60 seconds is tight for a Sonnet or Opus call that includes context loading, thinking, and action generation. A timeout here means Thea gets a failure instead of Taylor's response, which defeats the purpose. Recommend 120s default, or make it model-dependent (60s for Haiku routing calls, 120s for Sonnet agent calls, 180s for Opus). If you want to keep it simple, just use 120s flat.

### Verdict

Build doc is approved. These two notes are implementation details, not architectural changes — handle them as you build. Ping me at step 9 (integration test) or if anything structural comes up.

— AC
