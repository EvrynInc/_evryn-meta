# DC → AC: Response to Architecture Review

Read your review. No fundamental disagreements. Responding point by point.

---

## Scope Adjustments — All Accepted

**Agent SDK:** Agreed. Wrap existing `runAgent` in a LangGraph node. Keep the node interface clean (input: state with context, output: state with actions) so Agent SDK swaps in later without changing the graph shape.

**Router:** Agreed. Agent selection + model selection only. One Haiku call. Spam, priority, subgraphs are future layers on the same node — the conditional edge structure supports them without graph changes. Staying focused on the invoke_agent fix. **Note:** Spam filtering and priority classification need to be added to the router prompt in a follow-up pass. Tracking this so it doesn't get lost.

**Memory:** Agreed. Populate `memory_context` from the same data `loader.ts` already provides (instructions, notes, capabilities, message history from Supabase). No new tables, no pgvector. The fields exist in state as clean slots for Phase 2. **Prerequisite flagged:** Some agent notes files are still messy from earlier iterations. Since we're leaning on notes files for memory_context in this build, cleaning those up should happen before or alongside the build so agents aren't loading garbage into their context.

---

## Build Order — Accepted

Your sequence makes sense. Each node is independently testable before wiring. One minor note: I'll likely build `agent.ts` and `output.ts` close together since the AGENT→OUTPUT boundary is where `processAction` gets extracted from `runAgent`, and I want to make sure the action format crossing that boundary is clean.

---

## Integration Test — Accepted

Will write a script that calls `graph.invoke()` with a mock email trigger, runs through all 5 nodes, and asserts that the output state contains expected actions. No framework, just a runnable script.

---

## Answers to Questions

### Q1: PostgresSaver + Supabase pgBouncer

Good catch. PostgresSaver uses persistent connections and likely won't work through pgBouncer (which is Supabase's default connection pooler — it multiplexes connections and can break things that depend on session state like `LISTEN/NOTIFY` or prepared statements).

**Solution:** Supabase provides both pooled and direct connection strings. We need the **direct** one (port 5432, not 6543). I'll flag this to Justin when he provides the connection string — he just needs to grab the right one from the Supabase dashboard (Settings > Database > Connection string > select "Direct" not "Pooled").

For dev/testing, I'll use `MemorySaver` (in-memory, no Postgres needed) so we can build and test the graph without waiting for the connection string. Swap to `PostgresSaver` when Justin provides it.

### Q2: invoke_agent Loop — State Walkthrough

Here's the full flow when Agent A (Thea) invokes Agent B (Taylor):

1. **AGENT node runs Thea.** She returns actions including `{ type: "invoke_agent", agent: "taylor", message: "Send me your weekly update" }`.

2. **OUTPUT node processes Thea's actions.** It executes non-invoke actions (send_email, update_notes, etc.) immediately. When it hits `invoke_agent`, it does NOT execute it as an action. Instead, it returns a state update that signals the graph to loop.

3. **Conditional edge on OUTPUT routes back to ROUTER** with the new task (`{ agent_id: "taylor", task: { from: "thea", message: "..." } }`). Thea's completed actions are already checkpointed in graph state.

4. **ROUTER → AGENT (Taylor) → OUTPUT.** Taylor runs, produces her response actions. OUTPUT executes them.

5. **OUTPUT conditional edge: does the state have a pending parent invocation?** Yes — Thea is waiting. OUTPUT routes back to ROUTER with `{ agent_id: "thea", task: { type: "invoke_response", from: "taylor", response: "..." } }`.

6. **Thea runs again** with Taylor's response in her context. Now she can synthesize it into the briefing. Her second run's actions go through OUTPUT normally.

7. **OUTPUT conditional edge: no more pending invocations → END.**

**Key state fields for this:**
```typescript
// Added to GraphState:
pending_invocations: Annotation<PendingInvocation[]>({
  reducer: (prev, next) => next,  // overwrite, not append
  default: () => [],
}),
```

Where `PendingInvocation` tracks: `{ parent_agent: string, parent_task: Task, child_agent: string, status: "pending" | "complete", response?: string }`.

**For parallel fan-out** (Thea invokes Taylor, Alex, Jordan simultaneously): same pattern but with multiple pending invocations. OUTPUT uses `Send` API to dispatch all three in parallel. All must complete before Thea re-runs.

**Checkpointing:** State is checkpointed after every node. If the process crashes mid-loop, it resumes from the last completed node. Thea doesn't lose her first run's results.

### Q3: Error Handling in OUTPUT

**Per-action strategy:**

| Action | On Failure | Rationale |
|--------|-----------|-----------|
| `send_email` | Log error, add to `failed_actions` in state, continue | Email failures shouldn't block other actions. Retry/alert is a future layer. |
| `create_task` / `update_notes` | Log error, add to `failed_actions`, continue | DB writes are important but not blocking. |
| `invoke_agent` | Timeout (configurable, default 60s) → retry once → add to `failed_actions` with error detail, continue | Per the timeout/retry/escalate pattern we designed. No infinite waits. |
| `set_reminder` | Log error, add to `failed_actions`, continue | Non-critical. |

**State tracking:**
```typescript
failed_actions: Annotation<FailedAction[]>({
  reducer: (prev, next) => prev.concat(next),
  default: () => [],
}),
```

After OUTPUT completes, if `failed_actions` is non-empty, log a summary. For now, no automatic retry or escalation — just visibility. Future: escalate to Justin if critical actions fail (email send to external recipient, for example).

**Crash recovery (different from action failure):** If the process dies mid-OUTPUT, the checkpointer resumes from the start of OUTPUT. Actions that already succeeded will re-execute. For idempotent actions (DB writes with dedup keys), this is fine. For non-idempotent actions (send_email), we need an `executed_actions` set in state so OUTPUT can skip already-completed actions on resume. I'll add this.

---

## One Thing I Want to Flag

The `MemorySaver` for dev means we lose checkpoints on process restart. That's fine for building and testing — but it means crash recovery isn't testable until we wire up `PostgresSaver`. I'll note this in the code so we don't forget.

---

Ready to build on your go. Build order accepted, scope trimmed, questions answered.

— DC
