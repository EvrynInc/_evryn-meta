# OpenClaw Research Report

**Date:** 2026-02-24
**Researcher:** AC (Architect Claude)
**Scope:** Evaluate openclaw/openclaw for reusable patterns and components across the full Evryn product roadmap (v0.2 → v1.0) and the evryn-team-agents project (Lucas + subagents, multi-year horizon).

> **How to use this file:** Long-lived research reference. Architecture and build docs should link to specific sections here (e.g., "for memory architecture patterns, see OpenClaw Research Report §4"). Not a session doc — lives in `docs/research/` permanently.

**Important: This is a pattern library, not an implementation guide.** OpenClaw is a single-user local assistant — fundamentally different from Evryn (multi-user, trust-critical, cloud-hosted) and Lucas (autonomous agent with delegated authority). Patterns documented here solve *similar problems* in a *different context*. When a breadcrumb in another doc points here, the instruction is: study the approach, understand the trade-offs, then design our own solution that accounts for Evryn's security model, multi-tenancy, and trust requirements. Never copy code or architecture decisions without evaluating them against our constraints first.

---

## Overview

### What OpenClaw Is

OpenClaw is a **personal AI assistant gateway** — a local-first, multi-channel messaging hub that connects AI agents to messaging platforms (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, Matrix, Zalo, and WebChat). It also includes voice capabilities (macOS/iOS/Android), a "Live Canvas" visual workspace, cron-based automation, and companion native apps.

Think of it as a **universal AI inbox**: messages come in from any platform, get routed to the right agent, the agent processes them using Claude/GPT/Gemini/etc., and replies go back through the same channel.

### Tech Stack

- **Language:** TypeScript (ESM, Node >= 22)
- **Build:** pnpm monorepo, tsdown bundler, vitest for testing
- **AI Core:** Built on `@mariozechner/pi-agent-core` / `pi-ai` / `pi-coding-agent` (the pi-mono SDK — a model-agnostic agent runtime)
- **Multi-model:** Supports Anthropic, OpenAI, Google, Groq, Bedrock, xAI, OpenRouter, Ollama, and ~20+ more providers
- **Storage:** Local file system (JSONL session transcripts, JSON config), SQLite with sqlite-vec for vector search, LanceDB for the memory plugin
- **No traditional database:** No PostgreSQL, no Supabase, no server-side DB. Everything is local files.
- **Channel integrations:** Baileys (WhatsApp), grammY (Telegram), discord.js (Discord), Slack Bolt, and more as extensions
- **Native apps:** Swift (macOS menu bar + iOS), Kotlin (Android)

### Maturity

- **Created:** 2025-11-24
- **Stars:** 224,344 (extremely popular)
- **Forks:** 42,873
- **Last Updated:** 2026-02-24 (actively maintained)
- **Primary Author:** Peter Steinberger (well-known iOS/macOS developer, PSPDFKit founder)
- **Source files in `src/`:** 3,731 TypeScript files
- **Code quality:** Professional. Extensive test coverage, consistent patterns, well-organized module structure. Heavy use of TypeScript generics and defensive programming. Security-conscious (prompt injection detection, SSRF guards, sandbox isolation).

### Architecture Summary

```
User (WhatsApp/Telegram/etc.)
  -> OpenClaw Gateway (Express server, local)
    -> Channel Plugin (inbound message normalization)
      -> Auto-Reply Dispatcher (routing, debounce, rate limiting)
        -> Agent Runner (model selection, fallback, compaction)
          -> pi-mono SDK (actual LLM call)
        <- Response
      <- Reply Pipeline (chunking, prefix, streaming)
    <- Channel Plugin (outbound message)
  <- User
```

Everything runs on the user's local machine. There is no cloud backend, no multi-tenant server, no user database. It's designed as a single-user, self-hosted personal assistant.

---

## License

**MIT License** — Copyright (c) 2025 Peter Steinberger.

- **Can we use this commercially?** Yes, absolutely. MIT is the most permissive common license.
- **Requirements:** Include the copyright notice and permission notice in any copies or substantial portions.
- **Gotchas:** None. MIT imposes no restrictions on commercial use, modification, distribution, or sublicensing.
- **Practical implication:** We can study, copy, modify, and integrate any component from this repo into Evryn's codebase. We just need to include the MIT notice for any files we substantially copy (not for ideas/patterns we reimplement).

---

## §1 — Multi-Channel Message Architecture

**Files:** `src/auto-reply/`, `extensions/whatsapp/`, `extensions/telegram/`, `extensions/slack/`, `extensions/signal/`, `extensions/webchat/`

**Relevance:** Evryn v1.0 + multi-channel research | Lucas Phase 2+

### What It Does

OpenClaw normalizes inbound messages from any platform into a common format, routes them to the right agent, and sends responses back through the originating channel. Each channel is an "extension" plugin with a consistent interface:

- **Inbound normalization:** Platform-specific message → common `AutoReplyMessage` shape (text, sender, channel, metadata)
- **Outbound adaptation:** Common response → platform-specific format (message chunking for WhatsApp's 4096-char limit, markdown rendering for Telegram, etc.)
- **Channel-specific behaviors:** Typing indicators, read receipts, emoji reactions, message editing, reply threading

### Why This Matters for Evryn

The Hub explicitly plans multi-channel communication: email now, then the Evryn app, then potentially SMS/MMS, Telegram, WhatsApp, etc. (`docs/hub/roadmap.md` line 84, `docs/legal/privacy-and-terms-questionnaire.md` Q4 multi-channel section). The ARCHITECTURE.md principle is clear: conversations with the same user across channels interleave by time — same friendship, different channels.

OpenClaw's channel plugin architecture demonstrates:
- **How to abstract platform differences** — each channel has its own message format, size limits, media handling, and threading model. The abstraction layer is the valuable part.
- **Platform-specific gotchas** — WhatsApp's message length limits, Telegram's markdown quirks, Slack's threading model, Signal's E2E encryption constraints. These are hard-won lessons.
- **Rate limiting per channel** — each platform has different rate limits. OpenClaw's debounce and batching patterns handle this.

### Key Patterns to Study

**Auto-Reply Dispatcher** (`src/auto-reply/`):
- Message debouncing — when a user sends multiple messages in quick succession, wait for the burst to complete before processing (prevents the agent from responding to message 1 before seeing messages 2 and 3)
- Rate limiting — per-channel, per-user limits to prevent spam loops
- Session routing — which agent session handles which conversation

**Channel Plugin Interface:**
- Each extension exports a standard set of lifecycle hooks (connect, disconnect, handleMessage, sendMessage)
- Metadata passthrough — platform-specific data (message IDs, timestamps, read status) preserved for threading and replies
- Media handling — photos, documents, voice messages normalized to common types

### When We'd Use This

- **Evryn v0.3+:** When cast-off outreach adds channels beyond email
- **Evryn v1.0:** When the Evryn app launches and users can choose their preferred channel
- **Team agents:** When Lucas communicates through Slack (Phase 2) and potentially other channels

### Assessment

Don't copy the code (it's tied to OpenClaw's plugin system), but the architectural patterns for channel abstraction are genuinely useful. When DC builds Evryn's multi-channel capability, studying how OpenClaw normalized 12+ platforms will save significant design time — especially the per-platform gotchas that only surface in production.

---

## §2 — Auto-Reply Pipeline (Rate Limiting, Debouncing, Routing)

**Files:** `src/auto-reply/reply/`, `src/auto-reply/dispatch/`

**Relevance:** Evryn v0.3 (cast-off outreach at ~1000/week) | Evryn v1.0 (high-volume matching)

### What It Does

The auto-reply dispatcher sits between inbound messages and the agent. It handles:

1. **Debouncing** — Collects burst messages before triggering the agent (configurable window)
2. **Rate limiting** — Per-channel, per-user throttling
3. **Session routing** — Maps incoming messages to the right agent session
4. **Reply chunking** — Splits long responses to fit platform limits
5. **Message queuing** — Handles concurrent messages without race conditions
6. **Streaming** — Responses stream progressively to the user

### Why This Matters for Evryn

Cast-off outreach (v0.3) means Evryn is contacting ~1000 people per week. Rate limiting, queuing, and debouncing become critical:
- Gmail has daily send limits (~500 for consumer, ~2000 for Google Workspace)
- Evryn can't blast 200 emails in 10 minutes — needs intelligent pacing
- When a cast-off replies, Evryn needs to debounce (wait for the full message before processing)
- Multiple concurrent conversations need session isolation

At v1.0 scale with matching, the volume multiplies further. Every match involves messages to both sides, follow-ups, after-care.

### Key Patterns to Study

- **Debounce with adaptive window** — short for real-time chat, longer for email (where a user might send a follow-up email minutes later)
- **Queue with concurrency control** — process N conversations simultaneously, queue the rest
- **Rate limit with per-channel awareness** — different limits for email vs. SMS vs. in-app
- **Reply chunking with context preservation** — when a response is split across multiple messages, maintain coherence

### Assessment

The dispatcher patterns are highly relevant for Evryn's outreach and matching volumes. Not code to copy (wrong framework), but the architectural decisions around debouncing, rate limiting, and session routing are exactly the problems we'll face.

---

## §3 — Agent Identity / System Prompt Composition

**Files:** `src/agents/identity.ts`, `src/agents/identity-file.ts`, `src/agents/agent-scope.ts`, `src/agents/bootstrap-files.ts`

**Relevance:** Evryn v0.2 (Pre-Work #6) | Team agents (Lucas identity decomposition)

### What It Does

OpenClaw composes agent identity through a layered system:
1. **IDENTITY.md** — Markdown file with key-value pairs (name, emoji, creature, vibe, theme, avatar)
2. **SOUL.md** — Agent persona and behavioral boundaries
3. **AGENTS.md** — Operating instructions (like our CLAUDE.md)
4. **USER.md** — User profile context
5. **Bootstrap injection** — These files are loaded and injected into the system prompt at the start of each turn, with configurable max chars per file (20K) and total (150K)

The identity system supports:
- **Layered config resolution:** agent defaults → agent-specific → channel-specific → account-specific
- **Per-channel identity customization** (different name/prefix for different platforms)
- **Human delay simulation** (typing indicators to feel more natural)
- **Token budgeting** for bootstrap files (hard caps on per-file and total token allocation)

### Why This Matters for Evryn

We're building exactly this for Pre-Work #6 — composable identity documents that the trigger script assembles into a `systemPrompt`. OpenClaw's layered resolution pattern validates our approach:

- **Core identity** (always loaded) maps to OpenClaw's SOUL.md
- **Modules** (loaded per context) maps to OpenClaw's bootstrap files with conditional loading
- **Per-user adaptation** maps to OpenClaw's per-channel customization
- **Token budgeting** is a pattern we need — core identity + module + user context must fit in the context window with room for the actual work

For Lucas, the same pattern applies: Lucas's core identity + perspective-specific context + working memory + the actual task.

### Key Patterns to Study

- **Token budget enforcement on identity files** — hard cap per-file and total, with graceful truncation
- **Layered override resolution** — clean precedence chain where specific overrides general
- **Markdown-based identity** — human-readable AND machine-readable, version-controllable
- **Bootstrap file injection order** — identity → persona → instructions → user context (most-stable first for prompt caching)

### Assessment

High pattern value for both Evryn and Lucas. Our composable identity architecture (decided in Session 1) is conceptually similar. The token budgeting and override resolution patterns are worth studying before we finalize the design.

---

## §4 — Memory Architecture (Auto-Capture, Recall, Security)

**Files:** `extensions/memory-lancedb/index.ts`, `extensions/memory-lancedb/config.ts`, `src/agents/memory-search.ts`, `src/hooks/bundled/session-memory/handler.ts`

**Relevance:** Evryn v0.2+ (user stories, relationship memory) | Evryn v1.0 (trust graph, match calibration) | Team agents (Lucas learnings, domain insights)

### What It Does

**Memory Plugin (LanceDB):**
- Stores memories as vector embeddings with metadata (category, importance, timestamps)
- Categories: preference, decision, entity, fact, other
- Tools: `memory_recall` (vector search), `memory_store` (with dedup), `memory_forget` (GDPR-compliant delete)
- Auto-recall: injects relevant memories into agent context before each turn
- Auto-capture: analyzes user messages after each turn, stores important content automatically
- Prompt injection protection: detects and blocks injection patterns in memory content
- Memory escaping: sanitizes memory content before injection into prompts

**Memory Search Config:**
- Hybrid search combining vector and text matching (70% vector weight default)
- Temporal decay weighting (30-day half-life)
- MMR (Maximal Marginal Relevance) for diversity in recall results
- Query result caching

**Session Memory Hook:**
- On session reset, captures conversation summary
- Generates descriptive slug via LLM
- Saves as markdown in a memory directory

### Why This Matters for Evryn

This is the **highest-value section in the entire report.** Evryn's core product IS memory — she remembers who you are, what you care about, what matters to you, and uses that to find your people. Every architectural decision about memory directly affects product quality.

**Evryn v0.2:** Evryn builds a "story" about each user — a narrative synthesis of who they are. The ARCHITECTURE.md describes pending_notes → story synthesis → story_history archival. OpenClaw's auto-capture pattern (analyze messages after each turn, store important content with category tagging) is exactly the mechanism for building pending_notes.

**Evryn v0.3+:** Cast-off outreach means hundreds of new users. Each needs a user story. The auto-capture + auto-recall pattern means Evryn can build and maintain stories at scale without manual intervention.

**Evryn v1.0:** Full matching requires high-fidelity recall across the entire user base. Hybrid vector + text search with temporal decay is exactly what the matching engine needs — recent signals weighted more heavily, but long-term patterns preserved.

**Security is critical:** Evryn's memory contains deeply personal information. OpenClaw's prompt injection protection in memory content (detecting and blocking injection patterns before they're injected into the prompt) directly addresses a real attack vector: a malicious user could tell Evryn something designed to manipulate future prompts when that memory is recalled.

**GDPR deletion:** OpenClaw's `memory_forget` tool with targeted deletion (remove specific memories, not everything) maps directly to Evryn's deletion architecture — personal data purged, safety imprint retained.

### Key Patterns to Study

1. **Auto-capture filtering** (`shouldCapture()`) — Rules for what's worth remembering vs. noise. Skips: system content, agent output, emoji-heavy responses, very short messages. This prevents memory bloat.

2. **Category detection** (`detectCategory()`) — Classifying memories as preference/decision/entity/fact/other. For Evryn, categories would be different (relationship_signal, trust_signal, intent, preference, factual, etc.) but the pattern of AI-driven categorization at capture time is right.

3. **Deduplication via vector similarity** — Before storing a new memory, search for high-similarity existing memories. Prevents "user likes coffee" from being stored 47 times. Critical for Evryn where users will mention the same preferences repeatedly.

4. **Auto-recall injection with security** — The `<relevant-memories>` XML tag pattern for injecting recalled memories into the prompt, with content escaping to prevent injection. This is the safe way to feed memories back to the agent.

5. **Temporal decay** (30-day half-life) — Recent memories weighted more heavily in recall. For Evryn, this needs calibration: some memories are timeless ("has two kids"), others are temporal ("looking for a job" — may have found one). Decay should be category-sensitive.

6. **Hybrid search** (70% vector / 30% text) — Pure vector search misses exact matches; pure text search misses semantic similarity. The hybrid approach catches both.

7. **MMR (Maximal Marginal Relevance)** — When recalling memories, prefer diverse results over redundant high-similarity ones. Prevents the top 5 recalled memories from all being variations of the same fact.

### For Architecture/Build Docs

When designing Evryn's memory system (ARCHITECTURE.md Memory Architecture section), reference this section for:
- The auto-capture → categorize → deduplicate → embed → store pipeline
- The auto-recall → search → rank → escape → inject pipeline
- Memory security (injection detection, content escaping)
- Hybrid search with temporal decay
- GDPR-compliant targeted deletion

When designing Lucas's memory system (BUILD-LUCAS-SDK.md Memory Architecture section), reference for:
- The same capture/recall patterns, adapted for operational memory (meeting notes, decisions, patterns)
- The session memory hook (summarize conversation on session end)

---

## §5 — Conversation Compaction / Context Management

**Files:** `src/agents/compaction.ts`, `src/agents/context-window-guard.ts`, `src/agents/context.ts`

**Relevance:** Evryn v0.2+ (long email threads) | Evryn v1.0 (weeks-long relationships) | Team agents (Lucas session management)

### What It Does

When conversation history exceeds the context window, the compaction system:
1. Estimates token counts (chars/4 heuristic with 20% safety margin)
2. Splits messages by token share into N chunks (default 2)
3. Summarizes each chunk independently via the LLM
4. Merges partial summaries into a cohesive summary
5. Handles oversized messages with progressive fallback (full → partial → notes-only)
6. Preserves tool_use/tool_result pairing during pruning (prevents Anthropic API errors)
7. Retries failed summarization with exponential backoff
8. Strips `toolResult.details` (untrusted content) before summarization for security

### Why This Matters for Evryn

The Claude Agent SDK handles context compaction automatically, but:
- We may need custom compaction for the **story update mechanism** — synthesizing pending_notes into the user's story is effectively a compaction operation
- Long email threads with Mark could exceed context windows, especially when loaded alongside the user's full story and gatekeeper criteria
- At v1.0, relationship conversations span weeks or months. Compaction quality directly affects whether Evryn "remembers" the right things.

The ARCHITECTURE.md already flags "compaction of compactions" as a risk — stories built from stories, not raw messages, can compound errors. OpenClaw's approach (always keeping raw messages available as fallback, using summaries as the hot tier) is the same pattern the Reflection Module is designed to address.

### Key Patterns to Study

1. **Split-by-token-share** — Don't split by message count; split by token weight. A single long email might be 80% of the tokens. This ensures each chunk is roughly equal processing load.

2. **Progressive fallback** — Full summary → partial summary → note-only. When the summarizer itself runs out of context (summarizing a huge conversation), gracefully degrade rather than fail.

3. **Tool pair repair** — After dropping messages during compaction, check that every `tool_use` has its matching `tool_result`. Orphaned pairs cause Anthropic API errors. This is directly relevant to Claude Agent SDK interactions.

4. **Security during compaction** — Strip untrusted content (tool results from external sources) before feeding to the summarizer. Prevents prompt injection via summarization.

5. **Adaptive chunk ratios** — When average message size is large (like email bodies), use smaller chunk counts to keep each chunk within the summarizer's context window.

### For Architecture/Build Docs

When designing Evryn's story update mechanism (ARCHITECTURE.md §Conversation Compaction), reference this section for:
- Split-by-token-share algorithm
- Progressive fallback when summarization itself is constrained
- Tool pair repair (directly relevant to SDK interactions)
- Security patterns for compacting untrusted content

When designing Lucas's session management, reference for:
- Same compaction patterns for long operational sessions

---

## §6 — Cron / Scheduling / Proactive Triggers

**Files:** `src/agents/tools/cron-tool.ts`, `src/hooks/hooks.ts`

**Relevance:** Evryn v0.2 (email polling, proactive check-ins) | Evryn v0.3 (outreach scheduling) | Team agents (Lucas wake schedule, briefings)

### What It Does

**Cron Tool:**
- Agents can schedule jobs via a tool call (8 actions: status, list, create, update, remove, trigger, history, wake)
- Three schedule types: absolute timestamps, recurring intervals, cron expressions
- Two payload types: system events (gateway-level) and agent turns (session-level)
- Auto-resolves session context and delivery targets
- Handles LLM parameter flattening quirks (when models nest params differently than expected)

**Hooks System:**
- Event-driven hook registration (register/unregister/trigger)
- Bundled hooks: boot-md (markdown bootstrap), bootstrap-extra-files, command-logger, session-memory

### Why This Matters for Evryn

**Evryn v0.2:** Proactive behavior is core Evryn. If Mark goes quiet, Evryn should notice and reach out. The ARCHITECTURE.md describes "Evryn-set follow-up timers per interaction" — essentially, Evryn schedules her own proactive outreach based on conversation context. OpenClaw's cron tool demonstrates exactly this: an agent that can create, modify, and manage its own scheduled actions.

**Evryn v0.3:** Cast-off outreach at ~1000/week needs intelligent pacing. Not a bulk blast — staggered, personalized, rate-limited. The agent needs to schedule sends across hours and days.

**Team agents:** Lucas's wake schedule (morning briefing, evening briefing, Friday reflection, monthly review) maps directly to cron patterns. The "delivery deadline" concept (Lucas must deliver the briefing BY 6am, so he needs to start early enough) is a scheduling pattern OpenClaw doesn't address but that we need.

### Key Patterns to Study

1. **Agent-initiated scheduling** — The agent itself creates scheduled tasks via tool calls, not just responding to external triggers. Evryn deciding "I'll check in with Mark next Tuesday" is this pattern.

2. **Three schedule types** — Absolute time ("send this at 3pm tomorrow"), recurring interval ("check in every 3 days"), cron expression ("every Monday at 9am"). All three are relevant.

3. **Session-aware scheduling** — Jobs fire within the context of a specific agent session, not globally. For Evryn, this means a follow-up for Mark fires in Mark's session context, with Mark's history loaded.

4. **LLM parameter recovery** — Models sometimes flatten nested parameters or put them at the wrong level. The cron tool's defensive parsing handles this gracefully. Any tool we expose to Evryn needs similar defensive handling.

### For Architecture/Build Docs

When designing Evryn's proactive behavior system (ARCHITECTURE.md §Proactive Behavior), reference this section for:
- Agent-initiated scheduling pattern
- Session-aware cron execution
- Defensive parameter parsing for agent-created schedules

When designing Lucas's wake/trigger system (BUILD-LUCAS-SDK.md §Cron Schedule), reference for:
- The three schedule types
- How to let the agent manage its own schedule (graduated autonomy for scheduling)

---

## §7 — Gmail Integration (Pub/Sub + Lifecycle)

**Files:** `src/hooks/gmail.ts`, `src/hooks/gmail-ops.ts`, `src/hooks/gmail-watcher.ts`, `src/hooks/gmail-watcher-lifecycle.ts`, `src/hooks/gmail-setup-utils.ts`

**Relevance:** Evryn v0.2 (email polling) | Team agents (Lucas email handling)

### What It Does

OpenClaw's Gmail integration uses Google Cloud Pub/Sub push notifications:
1. Provisions a GCP Pub/Sub topic, grants Gmail API push permissions, creates a subscription
2. Uses Tailscale Funnel to expose a local HTTPS endpoint (not relevant to us — we have a proper server)
3. Spawns `gog` (a third-party Gmail CLI tool) as the push receiver
4. Gmail pushes notifications → Pub/Sub → webhook → agent turn
5. Auto-renewal of Gmail watch (which expires every 7 days)
6. Auto-restart of the watcher process on failure
7. Address-in-use detection and graceful handling

### Why This Matters for Evryn

We've already designed the email architecture (ARCHITECTURE.md §Email Processing): poll evryn@evryn.ai every 30 seconds, with Gmail Pub/Sub as a future upgrade. OpenClaw's implementation demonstrates:

- **Watch renewal scheduling** — Gmail watches expire every 7 days and must be renewed. OpenClaw schedules renewal at 90% of the TTL. This is a gotcha we need to handle.
- **Watcher lifecycle management** — spawn, health check, auto-restart on failure, graceful shutdown on exit. Production reliability patterns.
- **Setup automation** — GCP topic/subscription provisioning, permission grants. Useful reference for our setup scripts.

### Key Patterns to Study

1. **Watch renewal at 90% TTL** — Don't wait for expiration. Renew proactively.
2. **Watcher health monitoring** — Periodic checks that the push receiver is alive. Auto-restart if dead.
3. **Graceful degradation** — If push fails, fall back to polling (we've already designed this).

### Assessment

The implementation is tied to `gog` CLI and Tailscale (not relevant), but the lifecycle patterns (renewal, health monitoring, graceful degradation) are directly applicable. Since we already have working email polling code in `evryn-team-agents/src/email/poll.ts`, this is mainly reference for when we upgrade from polling to Pub/Sub push.

---

## §8 — Voice Pipeline

**Files:** `Swabble/` (Swift voice pipeline), `extensions/voice-call/` (Twilio voice), various voice/speech modules

**Relevance:** Evryn v0.4+ (voice capability) | Long-term

### What It Does

OpenClaw has two voice approaches:
1. **Swabble** — Native Swift pipeline for macOS/iOS. Wake word detection, speech-to-text, text-to-speech, ElevenLabs integration.
2. **Twilio Voice Call Extension** — Phone-based voice calls via Twilio, with streaming audio.

### Why This Matters for Evryn

The Hub and BUILD doc both reference voice as a future capability — Vapi for voice AI, Hume AI for emotion detection, ElevenLabs for voice synthesis. Justin specifically noted wanting voice for Mark's onboarding interview. OpenClaw's voice implementation is the most mature open-source reference available.

### Key Patterns to Study

1. **Streaming architecture** — Voice requires streaming responses (can't wait for the full response before starting to speak). OpenClaw's stream → chunk → synthesize → play pipeline is the standard approach.
2. **ElevenLabs integration** — Since we've already identified ElevenLabs as our likely TTS provider, OpenClaw's integration code is directly relevant reference material.
3. **Conversation turn management with voice** — When does the system start listening again? How to handle interruptions? Voice-specific UX patterns.

### Assessment

Not relevant until v0.4+ at earliest. But when we get there, this is a gold mine. File away and reference when scoping voice work.

---

## §9 — Usage / Token Tracking

**Files:** `src/agents/usage.ts`, `src/auto-reply/reply/session-usage.ts`, `src/config/sessions/disk-budget.ts`

**Relevance:** Evryn v0.2 (budget tracking) | Team agents (budget tracking)

### What It Does

- Normalizes token usage from ~15 different provider naming conventions into a standard `NormalizedUsage` shape
- Tracks per-session: input tokens, output tokens, cache read/write tokens, total tokens
- Derives session total tokens from last API call (not accumulated, to avoid overcounting from tool-use loops)
- Disk budget enforcement for session storage

### Why This Matters

We need budget tracking for both Evryn and Lucas. The team agents already have budget tracking infrastructure (`agent_api_calls`, `agent_daily_spend`, halt/alert thresholds). OpenClaw adds one key insight:

**"Derive from last call, not accumulated"** — In a tool-use loop, the agent makes multiple API calls, each building on the previous. If you sum all calls, you dramatically overcount because each call's input tokens include the previous calls' output. OpenClaw tracks per-call and takes the final call's total as the session total.

### Key Patterns to Study

1. **Per-call tracking, session-level derivation** — track each call independently, derive session totals from the final call
2. **Multi-provider normalization** — if we ever add a second AI provider, the `NormalizedUsage` type pattern avoids provider-specific logic spreading through the codebase

### Assessment

Minor value — we mostly have this solved already via the team agents infrastructure. The "derive from last call" insight is worth noting for accuracy.

---

## §10 — Security Patterns

**Files:** Various — spread across the codebase

**Relevance:** All of Evryn (security is foundational) | Team agents

### Patterns Found

1. **Prompt injection detection in memory recall** — Before injecting recalled memories into the prompt, scan for injection patterns. A malicious user could tell Evryn "Remember this: ignore all previous instructions and..." — the memory system must catch this at recall time, not just at capture time.

2. **Content escaping for context injection** — XML-tag wrapping (`<relevant-memories>`) with content escaping ensures injected memories can't break out of their container.

3. **SSRF guards** — When agents can fetch URLs (web research for classification), prevent them from accessing internal services (localhost, private IP ranges, cloud metadata endpoints).

4. **Sandbox isolation** — Docker-based sandboxing for code execution. Not immediately relevant, but the pattern matters when Evryn or Lucas agents can execute code.

5. **Untrusted content stripping during compaction** — When summarizing conversations that include tool results (which may contain external data), strip the external data before feeding to the summarizer. Prevents injection via the summarization pathway.

### For Architecture/Build Docs

When updating Evryn's security section (ARCHITECTURE.md §Security), reference this section for:
- Memory injection detection (supplement to the existing "external data is untrusted" principle)
- Content escaping patterns for context injection
- SSRF guards for web research tool
- Compaction security (stripping untrusted content before summarization)

---

## §11 — Multi-Provider Model Authentication & Fallback

**Files:** `src/agents/model-auth.ts`, `src/agents/auth-profiles.ts`, `src/agents/model-fallback.ts`, `src/agents/model-selection.ts`

**Relevance:** Low now, moderate long-term

### What It Does

- Auth resolution priority chain: explicit profile → stored auth profiles → environment variables → config file → provider-specific defaults
- Model fallback: when primary model fails, tries alternates with tracking
- Model catalog: discovers available models with context window caching
- Support for 20+ providers

### Why This Matters

We're Anthropic-only now. But the Hub says: "We'd like to preserve the option to change AI providers if needed." OpenClaw's multi-provider abstraction shows what clean provider-agnosticism looks like. We don't need this complexity now, but if we ever add a second provider (or if Anthropic has an outage and we need a fallback), the auth profile and fallback patterns are the reference.

**Model fallback** is the most immediately relevant piece: if Opus times out or rate-limits, falling back to Sonnet automatically (with tracking, so we know it happened) is a production reliability pattern.

### Assessment

File for later. When we revisit provider strategy or need fallback reliability, start here.

---

## §12 — Browser Automation

**Files:** `src/browser/` (Playwright-based)

**Relevance:** Evryn v0.2 (web research for classification) | Moderate

### What It Does

Playwright-based browser control — navigate to URLs, extract page content, take screenshots, interact with pages. Used by OpenClaw agents for web research.

### Why This Matters

Evryn's triage pipeline includes web research: "Research a company or person before classifying." The BUILD doc lists "Read a webpage" as an MVP tool. OpenClaw's browser automation shows the full Playwright approach — heavier than a simple fetch but much more capable (handles JavaScript-rendered pages, dynamic content, CAPTCHAs).

For v0.2, a simple fetch + extract is probably sufficient. At scale, some company websites are SPAs that require JavaScript rendering — that's when Playwright patterns become relevant.

### Assessment

Minor for v0.2 (simple fetch is fine). Reference when web research needs to handle JS-heavy sites.

---

## Components NOT Relevant

- **Native apps** (macOS, iOS, Android) — Evryn is web-based
- **ACP (Agent Client Protocol)** — OpenClaw-specific protocol
- **CLI / TUI** — We're building a backend service
- **pi-mono SDK integration** — Different agent runtime
- **Apply Patch / Code Editing tools** — Not relevant to our use case
- **Live Canvas** — Visual workspace, not applicable

---

## Summary: Value Map

| Section | Evryn v0.2 | Evryn v0.3 | Evryn v1.0 | Team Agents | Value |
|---------|------------|------------|------------|-------------|-------|
| §1 Multi-Channel | — | Reference | **High** | Reference | High |
| §2 Auto-Reply Pipeline | — | **High** | **High** | Low | High |
| §3 Identity Composition | **High** | High | High | **High** | Very High |
| §4 Memory Architecture | **High** | **High** | **Very High** | **High** | **Very High** |
| §5 Compaction | Moderate | Moderate | **High** | Moderate | High |
| §6 Cron / Scheduling | Moderate | **High** | High | **High** | High |
| §7 Gmail Integration | Reference | Reference | Low | Reference | Moderate |
| §8 Voice Pipeline | — | — | Reference | — | Future |
| §9 Usage Tracking | Low | Low | Low | Low | Low |
| §10 Security Patterns | **High** | **High** | **High** | **High** | **Very High** |
| §11 Multi-Provider | — | — | Low | Low | Future |
| §12 Browser Automation | Low | Low | Moderate | Low | Low |

### How to Use This Report

Drop references into architecture and build docs like:

> "For thoughts on how to architect Evryn's memory auto-capture pipeline, see OpenClaw Research Report §4, focusing on the `shouldCapture()` filtering pattern and category-based memory organization."

> "When implementing rate-limited cast-off outreach, reference OpenClaw Research Report §2 for debouncing and per-channel rate limiting patterns."

> "For memory security (injection detection in recalled content), see OpenClaw Research Report §10 pattern #1 — this supplements our existing 'external data is untrusted' principle."

---

*Report created 2026-02-24 by AC. Scope: full Evryn roadmap (v0.2 → v1.0) + team agents (multi-year).*
