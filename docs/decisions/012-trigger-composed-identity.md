# ADR-012: Trigger-Composed Identity (Option A)

**Status:** Accepted
**Date:** 2026-03-02
**Participants:** Justin + AC

## Context

Evryn has fundamentally different operational modes (user-facing, operator-facing, triage, conversation, onboarding). Loading all modes in a single prompt every query creates security risk (operator instructions visible during user queries) and token waste (triage doesn't need onboarding scripts).

The Claude Agent SDK offers several system prompt mechanisms:
1. **CLAUDE.md** via `settingSources: ["project"]` — auto-loaded, additions-only
2. **Preset + append** — `{ preset: "claude_code", append: "..." }` — extends Claude Code's coding assistant prompt
3. **Custom string** — replaces default entirely, full control
4. **Output styles** — file-based formatting configs loaded via settingSources

Three options were evaluated over Sessions 1-4 of Pre-Work #6.

## Decision

**Option A: The trigger script composes everything.** It reads identity files (core + situation module + activity module), concatenates them with user context from Supabase, and passes the result as a single `systemPrompt` string to `query()`. No `settingSources`, no filesystem-based config loading.

### Identity file structure (Situation × Activity matrix):
```
identity/
├── core.md                    ← Always loaded. Who Evryn IS.
├── situations/
│   ├── gatekeeper.md          ← Mark-type context (v0.2)
│   ├── gold-contact.md        ← v0.3
│   └── cast-off.md            ← v0.3
├── activities/
│   ├── onboarding.md          ← Getting to know someone
│   ├── conversation.md        ← Ongoing relationship
│   ├── triage.md              ← Sorting inbound email
│   └── operator.md            ← Justin mode (Slack-only)
└── knowledge/
    └── company-context.md     ← On-demand
```

### Prompt composition per query:
```
TRIGGER SCRIPT (code-level, not prompt-level)
    │
    ├─ Forwarded email detected?
    │   → systemPrompt = CORE + situations/gatekeeper + activities/triage + user context
    │
    ├─ Email from Mark's verified address?
    │   → systemPrompt = CORE + situations/gatekeeper + activities/conversation + Mark's profile
    │
    ├─ Slack from Justin's verified user ID?
    │   → systemPrompt = CORE + activities/operator + full data access
    │
    └─ Unknown sender?
        → systemPrompt = CORE + activities/conversation (minimal)
```

## Reasoning

**Why not Option B (SDK-native)?** The only preset available is `claude_code`, which loads Claude Code's coding assistant personality — wasted tokens and confusing for a relationship broker. Custom presets are not supported.

**Why not Option C (hybrid)?** Custom string `systemPrompt` + `settingSources: ["project"]` for CLAUDE.md is the least documented SDK combination. The docs don't explicitly confirm CLAUDE.md layers on top of a custom string systemPrompt. Depending on ambiguous behavior is risky for a production agent.

**Why Option A works:**
1. Full control over content, ordering, and token budget
2. Prompt caching optimization: stable core first (cacheable ~90% cost reduction), then module, then dynamic context
3. Security by construction: operator module only loads when code decided to load it — prompt injection in email can't reach operator mode
4. User isolation by construction: trigger loads only the specific user's data from Supabase
5. No dependency on SDK layering behavior — immune to SDK changes
6. "More custom code" = reading files and concatenating strings — trivial

**What we DON'T lose:** Hooks, MCP servers, sessions, subagents — all defined programmatically in `query()` options regardless of systemPrompt approach.

**What we handle differently:** "Output styles" (user vs operator tone/info boundaries) are achieved by composing different prompts per-query via the trigger — actually more powerful because Evryn switches modes email-to-email, not session-to-session.

## Cross-channel awareness note

Per-query composition doesn't mean siloed. Evryn's memory in Supabase spans all channels. When the trigger composes for a text message, it pulls recent email interactions from the messages table too. "Sessions" in the SDK sense are per-task; relationship continuity lives in the memory layer, not the SDK session.

## References

- Session doc: `docs/sessions/2026-02-24-pre-work-6-session-1.md` (Sessions 1-4)
- SDK docs: platform.claude.com/docs/en/agent-sdk/modifying-system-prompts
- Related: ADR-001 (SDK single-agent architecture)
