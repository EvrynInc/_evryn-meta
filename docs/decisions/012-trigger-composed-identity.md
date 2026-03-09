# ADR-012: Trigger-Composed Identity (Option A)

**Status:** Accepted (revised 2026-03-05 — simplified trigger, on-demand modules)
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

**Option A: The trigger script composes everything.** It reads core identity and person context from Supabase, concatenates them into a single `systemPrompt` string, and passes it to `query()`. No `settingSources`, no filesystem-based config loading.

**Identity file structure:** See ARCHITECTURE.md (canonical reference for the file tree). The structure follows the Situation × Activity matrix (ADR-015) with public-knowledge and internal-reference directories.

### The Simplified Trigger

The trigger's job is minimal — it loads identity and context, then Evryn determines both situation and activity from the conversation:

```
TRIGGER (code-level):
    │
    ├─ Identify sender → Supabase lookup → load person context
    ├─ Compose systemPrompt: Core.md + person context
    ├─ ONE hard-coded exception:
    │   └─ Slack from Justin's verified user ID → add operator.md to systemPrompt
    ├─ If forwarded email → store in emailmgr_items (data capture)
    └─ Call query(systemPrompt, incomingMessage)

EVRYN (prompt-level):
    │
    ├─ Reads the incoming message (passed as prompt, NOT in systemPrompt)
    ├─ Determines situation from message + person context
    │   (pulls situation module via tool if needed)
    ├─ Determines activity from message + person context
    │   (pulls activity module via tool if needed)
    └─ Responds, writes observations back to Supabase
```

The incoming message is the `prompt` parameter to `query()`, never part of the `systemPrompt`. This is a security boundary — email content is untrusted user input and must not be in system-level instructions where prompt injection could manipulate Evryn's identity or access controls.

Core.md includes an "available modules" section — lightweight pointers so Evryn knows what situations and activities she can pull on demand. Operator is deliberately excluded from this section (see ADR-017 for the three-layer operator security model).

### Evolution of this decision

This ADR has been revised as the trigger model was refined:
- **Original (2026-03-02):** Trigger deterministically loads situation + activity based on person profile and interaction type
- **Activity shift (2026-03-05):** Activity modules move to on-demand — Evryn determines activity from the conversation, not the trigger (ADR-015 revised)
- **Simplified trigger (2026-03-05):** Situations also move to on-demand — trigger only loads core + person context, with operator as the sole hard-coded exception (ADR-017). Forward ≠ triage — all forwards go to emailmgr_items, Evryn classifies intent.

The core decision (Option A: trigger composes systemPrompt via code) remains unchanged. What changed is how *much* the trigger composes — it got radically simpler.

## Reasoning

**Why not Option B (SDK-native)?** The only preset available is `claude_code`, which loads Claude Code's coding assistant personality — wasted tokens and confusing for a relationship broker. Custom presets are not supported.

**Why not Option C (hybrid)?** Custom string `systemPrompt` + `settingSources: ["project"]` for CLAUDE.md is the least documented SDK combination. The docs don't explicitly confirm CLAUDE.md layers on top of a custom string systemPrompt. Depending on ambiguous behavior is risky for a production agent.

**Why Option A works:**
1. Full control over content, ordering, and token budget
2. Prompt caching optimization: stable core first (cacheable ~90% cost reduction), then dynamic context
3. Security by construction: operator module only loads when code decided to load it — prompt injection in email can't reach operator mode (see ADR-017 for three-layer defense)
4. User isolation by construction: trigger loads only the specific user's data from Supabase
5. No dependency on SDK layering behavior — immune to SDK changes
6. "More custom code" = reading files and concatenating strings — trivial

**What we DON'T lose:** Hooks, MCP servers, subagents — all defined programmatically in `query()` options regardless of systemPrompt approach.

**What we handle differently:** "Output styles" (user vs operator tone/info boundaries) are achieved by composing different prompts per-query via the trigger — actually more powerful because Evryn switches modes email-to-email, not session-to-session.

## Cross-channel awareness note

Per-query composition doesn't mean siloed. Evryn's memory in Supabase spans all channels. When the trigger composes for a text message, it pulls recent email interactions from the messages table too. Relationship continuity lives in the memory layer (Supabase), not SDK session persistence — each `query()` call is a discrete task.

## References

- Session doc: `2026-02-24-mvp-build-work-s1-4.md` (Sessions 1-4)
- Identity Writing S2: `docs/sessions/historical/2026-03-04-identity-writing-s2.md` (archived — decisions captured in this ADR and ADR-017)
- SDK docs: platform.claude.com/docs/en/agent-sdk/modifying-system-prompts
- Related: ADR-001 (SDK single-agent architecture), ADR-015 (module matrix), ADR-017 (per-context situations, operator security)

---

## Addendum: SDK Skills Framework Analysis (2026-03-05)

**Question:** The SDK's Skills framework (`.claude/skills/SKILL.md`) provides on-demand capability discovery — metadata loads at startup, full content loads when triggered. Does this change the ADR-012 decision? Specifically: (a) should `internal-reference/` files become Skills? (b) Does the Skills format inform our module shape? (c) Is there a hybrid approach?

**Analysis performed against:** SDK Skills docs (overview + best practices, fetched fresh from platform.claude.com), all completed identity files (core.md, operator.md, gatekeeper.md, triage.md), identity-writing-brief, ARCHITECTURE.md, Hub + spokes, SDK research doc.

### What Skills Are

Skills are a **capability discovery mechanism**. Three loading levels:
1. **Metadata** (~100 tokens/Skill) — name + description, loaded at startup. Tells Claude "this capability exists."
2. **Instructions** (SKILL.md body) — loaded when Claude decides it's relevant to the current task.
3. **Resources** (additional files, scripts) — loaded as-needed from the Skill directory.

Designed for Claude-as-developer: "I see you need to process a PDF — let me load the PDF skill." Claude autonomously decides what to load.

### (a) Should `internal-reference/` files become Skills?

**No.** Core.md's "available modules" section already serves the role Skills metadata plays — telling Evryn what resources exist and when to use them — but more precisely. The available modules section only exposes what Evryn should know about; Skills metadata would load for *every* query regardless of context.

The mechanism already works: Evryn reads internal-reference files via tool when she recognizes she needs them (guided by references in her situation/activity modules). This is functionally identical to Skills Level 2-3 loading, but scoped by context rather than globally visible.

Additional consideration: Skills metadata is visible to Claude at startup. Internal-reference files should only be accessible when the right module is loaded. Making them Skills would expose their existence even in contexts where Evryn shouldn't know about them.

### (b) Does the Skills format inform our module shape?

**Yes — and it validates decisions already made.** Key principles that transfer:

- **"Claude is already smart — only add what it doesn't know"** → Reinforces lean modules (~500-800 tokens)
- **"Progressive disclosure: overview → details on demand"** → This IS our architecture (core.md → situation/activity module → internal-reference)
- **"Set appropriate degrees of freedom"** → Maps to our guidance vs. rules distinction
- **"Keep references one level deep"** → Internal-reference files should link directly from modules, never from other internal-reference files
- **"Under 500 lines for main file"** → Validates our token budgets

What doesn't transfer: Skills use third-person descriptions ("Processes Excel files"). Our modules correctly use second-person ("You're talking to...") because they're identity, not capability declarations.

### (c) Is there a hybrid?

**We're already doing it.** The current architecture IS a hybrid:
- **Trigger loads identity:** Core + person context from Supabase (+ operator.md for Justin on Slack)
- **Evryn discovers her context:** Pulls situation and activity modules on demand when she determines what the conversation needs
- **Evryn discovers procedures:** Reads internal-reference files via tool, guided by references in her modules
- **Evryn discovers public knowledge:** Reads public-knowledge files via tool when users ask about her

The SDK Skills mechanism doesn't add value for the discovery part because core.md's available modules section already serves as the metadata layer — and it's more precise.

### Conclusion

**ADR-012 decision confirmed with additional evidence.** The SDK Skills framework is designed for capability discovery in a developer tool. Our identity modules serve a different purpose: identity composition for a conversational agent. We adopt Skills *format principles* for module authoring; we don't adopt the Skills *loading mechanism*.

Full SDK feature usage:
- **Use:** `query()`, hooks, MCP servers, subagents
- **Don't use:** `settingSources`, Skills framework, presets, SDK sessions for user-facing interaction continuity (relationship continuity lives in Supabase, not SDK session persistence — each `query()` call is a discrete task)
- **Adopt as design principles:** Skills best practices for conciseness, progressive disclosure, degrees of freedom, one-level-deep references
