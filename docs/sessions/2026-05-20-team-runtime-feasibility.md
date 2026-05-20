# Team Runtime Feasibility — 2026-05-20

> **Session doc — ephemeral.** Working notes from AC's feasibility study on porting the founding team agents (starting with Lucas) from Claude-Code-session-based to Agent-SDK-based autonomous runtime. Absorb into ADR + spec at #lock.
>
> **Author:** AC, 2026-05-20T12:34-07:00
> **Trigger:** Justin asked: is the work weeks-or-months, or end-of-day?
>
> **Verdict up top:** Days-not-weeks to a working Lucas-on-Railway, *once we settle the choice points in this doc*. The SDK is the right answer. Most of the hard infrastructure work was solved in `evryn-backend`. The remaining work is real but bounded: GitHub tooling, a wakeups table, a per-agent Slack app, a Supabase project for the team, and a deliberately-designed permission-hook layer that lets agents work freely on safe surfaces and gates writes to sensitive ones.

---

## What I verified

### From the SDK docs (code.claude.com/docs/en/agent-sdk/*)

Ground-truth confirmed. The SDK that `evryn-backend` already uses is the right tool for this:

- **`query()` is the primitive.** `@anthropic-ai/claude-agent-sdk` for TypeScript. Same pattern as `evryn-backend`'s `runEvrynQuery()`. No new mental model needed.
- **Hooks are the gold.** `PreToolUse`, `PostToolUse`, `Notification`, `Stop`, `SessionStart/End`, `PreCompact`, `SubagentStart/Stop` — these are callbacks the agent runs at lifecycle events. Critically: a `PreToolUse` hook can inspect a tool call (e.g. `Edit` with `file_path=/docs/hub/roadmap.md`) and return `permissionDecision: "deny"` (block), `"allow"` (approve), `"ask"` (defer to a callback), or `"defer"` (end the session and resume later). **This is exactly the primitive for the commit-authorization design Justin wants.**
- **Permission modes:** `default`, `dontAsk`, `acceptEdits`, `bypassPermissions`, `plan`, `auto`. For autonomous agents, **`acceptEdits` + hand-rolled hooks for the sensitive paths** is the pattern.
- **Sessions persist as JSONL on disk.** Resumable. For autonomous-Lucas waking hourly, the right pattern is **NOT a single year-long session** (context bloat) — instead, **start fresh each wake** with the system prompt cached + key state hydrated from Supabase. Sessions are useful for multi-turn tasks (e.g. a 10-turn proposal-drafting conversation), not for permanent identity.
- **Built-in tools:** Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, AskUserQuestion, Monitor. Combined with MCP servers + custom in-process tools, the SDK ships with everything we need.
- **Subagents work via the `Agent` tool** and inherit the parent's `bypassPermissions`/`acceptEdits`/`auto` mode — **confirms Justin's point that sub-agents handle most parallelism needs.**

### From the SDK-credit docs (June 15, 2026)

- Pro $20/mo → $20 SDK credit. Max 5x → $100. Max 20x → $200. Team Standard → $20. Team Premium → $100.
- **"Teams running shared production automation should use Claude Platform with an API key for predictable pay-as-you-go billing."** — i.e., always-on agents must bill via API, not subscription. Subscription credit is for *interactive* SDK use (you running `claude -p` on your laptop). So Lucas-on-Railway = API billing.
- The good news: the team agents you run yourself in Claude Code on your laptop *can* draw from the subscription credit. So the "Lucas in Claude Code" path continues to ride your subscription — and we add an "autonomous Lucas on Railway" alongside, on API billing.

### From the `evryn-backend` survey

(Done in the first pass — summary here.) Of 9 architectural areas: 5 reusable as-is (agent loop wrapper, memory/state patterns, identity-as-markdown composition, Slack Socket Mode, Railway deployment shape), 2 need light extraction into a shared `agent-runner` package (custom-tools registry, trigger entry-points), 2 are net-new (GitHub integration, wakeups/cron).

### From the agent definitions

I read Lucas, Soren, Mira, Emma, Marlowe, Nathan, Dominic, Thea + Lucas's MEMORY.md + the proposal protocol. Three findings shape this design:

1. **The identity files are heavy and stable.** Each agent is 100-200 lines (~3K tokens), packed with load-bearing detail about education, background, mental frameworks, communication style. These need to flow into the system prompt verbatim — paraphrase or compression breaks the agent.
2. **Context loading is per-agent.** Lucas loads almost everything (he's CoS, cross-domain). Nathan auto-loads only Hub + Trust & Safety spoke + Linear queue, then pulls heavy spokes on demand. Mira loads Hub + 3 spokes + Linear. **This means each agent's "system prompt + boot context" is genuinely different — there's no one-size-fits-all wake.**
3. **Memory is already richly structured.** Lucas's MEMORY.md is ~10K tokens — Story (consolidated) + Recent Notes (append between consolidations). Exactly the shape Justin described as the target. **We don't need to invent a memory format; we need to teach the SDK runtime to load it on wake and write to it under discipline.**

---

## The big architecture

```
+---------------------------------------------------------------+
|                       Railway services                        |
|                                                               |
|  lucas-runtime          mira-runtime         soren-runtime    |
|  (Node, always on)      (Node, always on)    (Node, always on)|
|       |                       |                     |         |
|       +-----------+-----------+---------------------+         |
|                   |                                           |
|                   v                                           |
|        @evryn/agent-runner package                            |
|        - boot(identityFolder, tools, slackApp, supabase)      |
|        - query loop (calls SDK query())                       |
|        - PreToolUse hook (path-based commit policy)           |
|        - PostToolUse hook (cost/loop tracking)                |
|        - Stop hook (write session summary to MEMORY)          |
|        - tools: github, slack, linear, supabase, wakeups      |
+---------------------------------------------------------------+
                            |
        +-------------------+--------------------+
        |                   |                    |
        v                   v                    v
   Supabase             GitHub API           Slack apps
   (evryn-team          (via App with        (one per agent
   project)             scoped repo perms)   + #team channels)
   - messages
   - wakeups
   - users.profile_jsonb (story+pending_notes)
   - cost_events
```

**Key idea:** `@evryn/agent-runner` is a small TypeScript package (lives in `evryn-team-runtime` repo) that owns the boring parts (boot, query loop, hooks, tools, error handling). Each agent is a thin service that imports it and supplies (a) identity folder path, (b) tool selection, (c) Slack app config. New agent = new identity folder + a few config lines.

**Where the identity folder lives:** GitHub. The runtime clones `evryn-team-workspace` (or fetches via API) at boot and on a heartbeat-cache-refresh schedule (e.g. every 15 min). Lucas's CLAUDE.md edits land in GitHub and propagate to running Lucas without redeploy. **This solves Justin's "no drift from local" requirement.**

---

## Q3 deep dive: Commit / file-change authorization (in layman's terms)

You said you don't fully understand this question, so here's the layman's framing.

### The problem in plain English

Right now, in Claude Code, the way agents avoid mangling your docs is: **you sit in the loop.** They edit, you watch the diffs in Source Control, you authorize each commit. That works because you're there.

For autonomous Lucas on Railway, **you're not there.** So either:
- (a) every change goes through a PR for you to merge (very safe, very slow, you become the bottleneck again),
- (b) Lucas commits whatever he wants directly to `main` (fast, but a stray instruction or model error could trash the Hub), or
- (c) **a layered model:** Lucas commits freely to *some* surfaces, opens PRs for *some* surfaces, and never touches *some* surfaces at all — with the boundaries enforced by code, not by Lucas's good intentions.

I'm proposing (c). The SDK's `PreToolUse` hook is the enforcement mechanism — it runs before every file write or git command and can block based on the file path.

### The four-tier path policy I'd recommend

| Tier | Path examples | What Lucas can do | Why |
|------|---------------|-------------------|-----|
| **Free** | `shared/sessions/`, `shared/current-state/` (append-only), `shared/projects/helm/working-docs/`, `.claude/agent-memory/lucas/`, mailbox files | Commit directly to main. No PR. No approval. | These are working surfaces — the cost of a bad edit is low, the cost of a PR-per-change is huge. Same pattern as your existing AC↔DC mailbox traffic. |
| **PR with auto-merge** | `shared/projects/<dept>/`, `shared/protocols/` (except identity-file ones) | Opens a PR. If the diff passes safety checks (size, no secrets, no protected paths touched), Slack-pings you and auto-merges after 4h if no response (configurable). | Things you want to see but don't want to block on. The 4h timer makes the system flow when you're traveling or in deep work; you can always merge faster or block. |
| **PR with required review** | `_evryn-meta/docs/hub/**`, `_evryn-meta/docs/decisions/**`, `**/CLAUDE.md`, `**/agents/*.md`, `evryn-backend/identity/**`, `_evryn-meta/docs/current-state.md` | Opens a PR. Slack-pings you. **Never auto-merges.** You merge by reacting `:white_check_mark:` to the Slack ping or merging in GitHub. | The "sources of truth" — Hub, ADRs, agent identities, product identity files. If one of these goes sideways, the whole system corrupts. Worth the friction. |
| **Forbidden** | `.env`, `.git/config`, package-lock files, `evryn-backend/src/**` (Lucas is CoS, not a developer) | Hook denies outright. Lucas can't even attempt. | The blast radius is too big or out-of-domain. Forbidden ≠ "ask Justin"; it's "this isn't your domain — file a Linear ticket to the right person." |

### What this looks like in code (so it's real, not hand-wavy)

```typescript
const commitPolicy: HookCallback = async (input) => {
  if (input.tool_name !== "Edit" && input.tool_name !== "Write" && input.tool_name !== "Bash") return {};

  const path = input.tool_input?.file_path
    ?? extractFilePathFromBashCommand(input.tool_input?.command);
  if (!path) return {};

  const tier = classifyPath(path); // returns "free" | "pr-auto" | "pr-review" | "forbidden"

  if (tier === "forbidden") {
    return { hookSpecificOutput: { permissionDecision: "deny",
      permissionDecisionReason: `${path} is outside your edit scope. File a Linear ticket to the domain owner.` }};
  }

  if (tier === "free") {
    return { hookSpecificOutput: { permissionDecision: "allow" }};
  }

  // For PR tiers: redirect Edit/Write to a branch + opened PR, not main.
  // This is done by routing through a custom mcp tool (pr_edit, pr_write) instead of
  // letting the agent commit directly. The hook can either deny + tell the agent
  // to use pr_edit, or transparently rewrite the input.
  return { hookSpecificOutput: { permissionDecision: "deny",
    permissionDecisionReason: `${path} is a ${tier} path. Use pr_edit / pr_write tools, not direct Edit/Write.` }};
};
```

### Why this is the right shape

- **You're not in the loop on every change** — but you *are* in the loop on the things that matter.
- **The policy lives in code, not in Lucas's prompt.** You can't "convince" the hook with clever reasoning. It's deterministic.
- **The tiers can evolve.** Once you trust autonomous Lucas, you can promote more paths to Free. Right now, start conservative.
- **It maps to how you already work with AC.** AC's mailbox is "Free." AC editing the Hub is "PR with required review" (just enforced socially today).

**Recommendation:** Go with this four-tier model. We can spec the exact path patterns together when DC builds it.

---

## Wake / heartbeat design (Q7)

You asked the right question: **what's a heartbeat actually doing?** Answer: not much. Push-driven is the real pattern.

### The wake taxonomy

| Wake type | Trigger | What happens | Loop-prevention |
|-----------|---------|--------------|-----------------|
| **Slack ping** | Justin or another agent pings Lucas's bot (DM or @mention) | Lucas wakes, loads message + recent thread context, decides action, responds (in thread, or with action) | Per-thread "in flight" lock; if same thread fires while previous is mid-response, queue the new message, don't spawn parallel |
| **Linear event** | New ticket assigned R:lucas, comment on his ticket, status change | Wakes, reads ticket, decides (do work / ask Justin / route elsewhere). Same shape as Slack ping. | Per-ticket dedup (don't process the same change twice) |
| **Self-set wakeup** | Lucas wrote `(2026-05-22T07:00, "check Andy email status")` to the `wakeups` table | At fire time, wakes with the original prompt + context that he set this himself. Decides if still relevant; if so, does the work. | Wakeups are one-shot — fire, mark complete, gone. |
| **Heartbeat (light)** | Cron, e.g. every 30 min during your PT waking hours, every 4h otherwise | **Haiku model**, not Opus. Checks: any new Slack? Any new Linear? Any due wakeups? Any unanswered DMs >2h old? If all clear → exit. If anything found → escalate to an Opus wake. | Heartbeat is read-only (no Edit/Bash). Costs almost nothing. |
| **Heartbeat (deep)** | Once a day at, e.g., 7am PT | Opus. The "morning check-in." Reads queue, current-state, posts "here's what I'm working on today" message to Slack, then idles. | Once per day, capped tokens. |

**Note on the heartbeat-on-Haiku idea:** Yes — this is exactly the right move. A Haiku call with a tiny prompt ("here's your queue: [...]. anything urgent?") returning a 50-token "no, all clear" costs roughly $0.0005. Even at every-15-min it's $1.50/month. You can run it as often as you want.

### Loop-prevention safeguards (the most important part)

This is what stops a runaway agent from burning your month's budget overnight.

1. **Per-wake hard budget.** Each `query()` call has `max_turns` (built into SDK) and a custom `max_cost_usd` enforced via the `PostToolUse` hook tracking cost. When hit, the session ends and Slack-pings you: `"Lucas hit $0.50 on one wake — paused. Reason: [last tool call]."`
2. **Daily soft budget.** A `cost_events` table tracks Opus-token cost per day per agent. If Lucas hits, say, $5 in 24h, heartbeats downgrade to Haiku-only and reactive wakes Slack-ping you first: `"Lucas exceeded daily budget — should I keep working on [task] or wait?"`
3. **Loop detector.** A hook tracks tool-call patterns. If the same tool call (same args) fires 3x in a row, or the same 3-call cycle repeats 5x, the session is killed and you're pinged. Cheap to implement; catches the classic "the agent thinks it fixed the bug, runs the test, sees it still failing, tries the same fix" loop.
4. **Heartbeat kill-switch.** A flag in Supabase (`agents.lucas.active = false`) checked on every wake. You can flip it from a Slack command (`/lucas-pause`) and Lucas immediately stops processing anything except a `/lucas-resume`.
5. **Global circuit breaker.** If total spend across all agents in any rolling 1h window exceeds, e.g., $10, ALL agents pause and Slack-loud-alarms.

This is the answer to your "burn my whole month overnight" fear. **The system has both fine-grained (per-wake) and coarse-grained (global) guards.**

### What I'd skip

- **No constant heartbeat.** A 30-min heartbeat that runs forever is just paying to ask "anything yet?" The push-driven (Slack, Linear, wakeups) primary + light cron-checked secondary is plenty.
- **No always-on session.** Each wake starts fresh. State lives in Supabase + MEMORY.md.

---

## Per-agent tools menu

Each agent gets the "base" tools + their domain tools. Base is everything in `@evryn/agent-runner`. Domain is what they specifically need.

### Base (every agent)
- `github_read_file` / `github_write_file` (subject to commit-policy hook above)
- `github_open_pr` / `github_comment_pr`
- `slack_post` / `slack_post_thread` / `slack_dm`
- `linear_read_queue` / `linear_read_ticket` / `linear_create_ticket` / `linear_comment` / `linear_update_status`
- `supabase_read_messages` (their own threads) / `supabase_read_user_story`
- `memory_append_note` / `memory_read_story`
- `wakeup_set` (self-scheduled time-based reminder)
- `propose_work` (writes a Linear proposal in the proposal-protocol format, sets Needs Authorization, pings Justin)
- Built-in: WebSearch, WebFetch, Read/Glob/Grep on the cloned workspace

### Per-agent additions

| Agent | Additional tools | Why |
|-------|------------------|-----|
| **Lucas** | `linear_read_justins_queue`, `current_state_append`, `run_standup_protocol`, `run_sweep_protocol`, `run_align_protocol`, all spokes read access | Cross-domain CoS work + protocol execution. |
| **Soren** | `evryn_backend_read` (ARCHITECTURE.md, BUILD docs, source), `supabase_read_schema`, `railway_status` / `railway_logs` (read-only — deploy stays with AC/DC), DC mailbox write | He's the team's interface to the build. |
| **Mira** | `identity_files_read` (evryn-backend/identity/), `identity_files_propose_change` (opens a PR per identity-file-review protocol, never commits direct), Mira-Soren mailbox | Identity is her domain; PR-only because of the protocol you already have. |
| **Emma** | `google_drive_read` (budget sheets — already in her context), `stripe_read_revenue` (when applicable), `runway_calculate` | Finance/runway. |
| **Marlowe** | `google_calendar_read` (eventually), `linkedin_search` or whatever GTM research surface ends up being, `email_compose_to_justin_for_outreach` (drafts cast-off outreach, never sends — pushes to Justin's review queue) | Growth, outreach. The email tool is a "drafter, not sender" — outreach can't autosend. |
| **Nathan** | `gmail_read` (Fenwick threads — would need an OAuth scope just for Fenwick label), `legal_docs_read` (v0.2 ToS/PP finals, drafting protocol files) | Legal needs to *read* Fenwick correspondence; doesn't write Gmail. |
| **Dominic** | All-spokes-read (he's all-context by nature), no special write — he's strategic-advisor, his output is conversation + tickets to others | He doesn't *build*; he names patterns. |
| **Thea** | `gmail_read` (Justin's inbox, careful scoping), `linear_read_all_queues` (signal-filter across team), `slack_read_threads` (open-loop tracking) | She's the signal filter — she needs the *most* read access of any agent. The trade is she has the *least* write access (mostly Linear comments to flag things). |

**Cross-cutting integrations to set up once:**
- One **GitHub App** with scoped repo access to `_evryn-meta`, `evryn-team-workspace`, `evryn-backend`, etc. Per-agent installations control which repos each can read/write.
- One **Slack workspace** with N apps (one per agent). All apps post to common channels (`#team-pulse`, `#dev-alerts`) but each has its own bot identity for DMs and @mentions.
- One **Linear API key per agent** (you flagged you'd pay for separate seats — yes, that's the right call; it makes the "who did this" question answerable).
- One new **Supabase project** (`evryn-team`) with `messages`, `wakeups`, `cost_events`, `agent_state` tables. Use Evryn-product's schema patterns directly.

---

## Budget unit economics

Best estimates as of 2026-05-20. Real numbers will land when we instrument cost-tracking in Phase 1.

### Per-wake cost (Opus, with prompt caching)

A typical Lucas wake:

- **System prompt** (CLAUDE.md + lucas.md + auto-load spokes + current-state + Hub): ~30K tokens.
  - **First wake of the day:** cache write = 1.25× input = ~$0.56 on Opus pricing ($15/M input).
  - **Subsequent wakes (within 5 min cache TTL):** cache read = 0.1× = ~$0.045. **The cache is what makes this affordable.**
- **Dynamic context** (recent messages, MEMORY notes, current task): ~5K tokens, not cached. ~$0.075.
- **Output** (response + tool calls): ~2K tokens at $75/M = ~$0.15.
- **Tool use rounds:** typical 5-10 tool calls per wake. If each round is another 2K cached + 1K output, add ~$0.10 per round.

**Per-wake total estimate:**
- First wake of the day: **~$0.80-$1.20**
- Subsequent wakes (cache warm): **~$0.20-$0.40**

The cache TTL is the wildcard. Default is 5 min; longer TTLs exist on certain request shapes but more expensive. If wakes are spread over hours, every wake is effectively "first wake" (cache miss). **Levers to fight this** below.

### Daily cost per agent (rough)

| Agent | Active wakes/day (estimate) | Cost/day |
|-------|----------------------------|----------|
| Lucas | 20-40 (CoS, busy) | $5-15 |
| Mira | 5-15 | $2-6 |
| Soren | 5-15 | $2-6 |
| Emma | 3-10 | $1-4 |
| Marlowe | 5-15 | $2-6 |
| Nathan | 2-8 | $1-3 |
| Dominic | 2-8 | $1-3 |
| Thea | 10-25 (high signal-filter volume) | $3-8 |

**Daily team total:** ~$17-50/day = **~$500-1500/month**.

That's a wide range. To narrow it: the **lowest-impact lever is fewer wakes**, the **highest-impact lever is reducing system-prompt size** (because every cache miss pays full price).

### Levers to cut budget

Ranked by impact:

1. **Skills system instead of always-loaded protocols** (potentially huge). The SDK supports Claude Code skills (`.claude/skills/*/SKILL.md`) — these are *progressive disclosure* protocols. Instead of loading the entire writing-protocol every time, the agent loads only the "frontmatter" (the skill name + description), and only loads the body when the skill is actually invoked. **This could cut Lucas's loaded context by 30-50%.**
2. **Move agent definitions to use `Read`-on-demand for the deep parts.** Today, the agent definition is 100% always-loaded. We could split into "core identity" (always-loaded, ~500 tokens) + "background and craft details" (Read-on-demand). The character voice still needs the load-bearing background — but maybe Lucas only needs to read his full HBS-Yale background when actually doing certain kinds of work. Risk: subtle voice flattening. Worth testing.
3. **Haiku heartbeats.** Already in the design above. Cuts heartbeat cost by 80%+.
4. **Self-rate-limit on idle days.** If Lucas has had no work for 6h, heartbeat to every 4h instead of every 30 min. Auto-resume normal cadence on next Slack ping.
5. **Don't auto-load Linear queue every wake** — only on the first wake of a session, or when the agent explicitly requests it.
6. **Cache the Hub at the prompt-prefix level**, not in each agent's system prompt rebuild. (Implementation detail — the runner can be smart about this.)

### Realistic ranges

- **Conservative (8 agents, basic optimization):** $1500-2500/month
- **Mid (8 agents, skills system + Haiku heartbeats + idle backoff):** $700-1200/month
- **Aggressive (Lucas only, then add agents as needed; deep optimization):** $200-500/month

**Recommendation:** Build Lucas-only first. Instrument cost tracking from day one (`cost_events` table). Watch his real numbers for a week. Then decide which agents to spin up next and in what order, based on real economics + actual ROI on the work each does.

### What the SDK June 15 thing means for you

It probably **doesn't** help with autonomous Lucas (production automation = API billing). But it changes how you think about your *interactive* use:
- Today: your $100/mo Max 5x is all-in for your Claude Code interactive sessions (including all your AC, DC, multi-Lucas Claude Code work).
- June 15: your Claude Code interactive sessions stay on subscription; your SDK use *outside* Claude Code (e.g. running custom scripts that call `query()`) draws from a separate $100/mo SDK credit on the same Max 5x plan. **Net effect: more headroom under subscription for the interactive-AC/DC/Lucas-in-Claude-Code work.**

---

## Memory architecture

Carry forward Evryn's pattern, adapted.

### Storage

- **Story** (consolidated long-term identity): lives in `evryn-team-workspace/.claude/agent-memory/lucas/MEMORY.md` — **same place as today.** Committed to GitHub. The runtime reads this on wake.
- **Recent Notes** (since last consolidation): same MEMORY.md, separate section — same as today.
- **Per-conversation context** (last N messages in a Slack thread, Linear ticket comment chain): pulled from the new `evryn-team.messages` table on wake. Same shape as Evryn's `messages` table.
- **Active tasks**: pulled from Linear API on wake.
- **Self-set wakeups**: `evryn-team.wakeups` table.

### Write pattern

- **During a wake, Lucas writes to MEMORY.md via the standard `Edit` tool** — gated through the commit-policy hook (path tier = Free for own memory).
- **End of wake, the runner runs a "compress" hook**: if MEMORY.md is over a threshold (say, 15K tokens), it Slack-pings Justin: `"Lucas memory is heavy — recommend #consolidate."` Justin triggers consolidation through a Slack command or a Linear ticket.
- **Consolidation runs as a special wake mode** with a stronger prompt + the consolidation protocol auto-loaded.

### The "self-consolidation" question

You asked for as-much-self-consolidation-as-possible. My honest read: **let Lucas decide when consolidation is needed, but you authorize when it runs.** Reason: consolidation is a high-judgment act — Lucas reshapes his own self-understanding. If he can do it whenever, the failure mode is "he consolidates after a bad day and the story drifts." But he can absolutely propose it (Slack ping you with "I think it's time"), and the friction is just you replying `:white_check_mark:`.

For the morning report you mentioned: easy. Daily 7am Lucas wake, posts a 5-line "here's what the team is on today" message to `#team-pulse`. No consolidation overhead. Cheap.

For the standup: Lucas can run the protocol himself once a week (configurable cadence). He can ping you before kicking off — "Running weekly standup at 8am — anything to highlight?" If you don't respond in 15 min, he runs default. If you say "skip this week" or "go deeper," he adapts.

---

## What Justin needs to do (with realistic time estimates)

Ordered by what blocks Phase 1.

| # | Task | Estimate | Notes |
|---|------|----------|-------|
| 1 | Create a new GitHub App: "Evryn Team Runtime". Generate private key. Install on the relevant repos (`_evryn-meta`, `evryn-team-workspace`, `evryn-backend`, etc.). | **30 min** | One-time. I can write the spec for which repo scopes are needed. |
| 2 | Create new Supabase project: "Evryn Team". Get URL + service key into a new `.env` in the team-runtime repo. | **15 min** | One-time. DC can run the migrations. |
| 3 | Create a new Slack app for Lucas: "Lucas Everhart". Bot scopes (chat:write, im:history, channels:history, app_mentions:read, etc.). Install to your workspace. Generate bot token + app token (for Socket Mode). | **30 min** | One per agent. The first one is slowest while you learn the Slack admin UI; subsequent ones are 10-15 min each. |
| 4 | Create a new Linear seat/API key for Lucas (if you want separate seats — which you said yes to). | **15 min** | One per agent. |
| 5 | Create new Railway service for `lucas-runtime`. Connect to the team-runtime repo. Configure env vars (from #1-4 above + `ANTHROPIC_API_KEY`). | **30 min** | One per agent. |
| 6 | Set initial budget caps with me — what's "yellow alert" and "red alert" $/day for Lucas? What's the global hourly circuit breaker? | **20 min conversation** | Defaults: yellow $5/day per agent, red $15/day, global circuit $10/h. Adjust to your comfort. |
| 7 | Decide on the four-tier path policy specifics with me (which exact paths fall in each tier). | **30 min conversation** | I'll come with a draft; you redline. |
| 8 | Sign off on a Phase 1 success criteria: what does "Lucas works" look like before we declare Phase 1 done? | **15 min conversation** | I'd propose: (a) Justin DMs Lucas, Lucas replies coherently with full context loaded; (b) Lucas writes to his MEMORY.md and the change appears in GitHub; (c) Lucas reads his Linear queue and posts a morning report to a test channel; (d) Lucas sets a self-wakeup and it fires. |
| 9 | After Phase 1: spec the GitHub-write tier 2/3 policies (PR auto-merge timer, required-review path list). | **45 min conversation** | Phase-1 Lucas can be read-only on the PR tiers; we add write tooling in Phase 2. |

**Your blocking-bandwidth total before DC can ship Phase 1: ~3-4 hours, spread over a few days.**

Once those are done, **DC builds Phase 1 in a single sitting** (your usual multiplier: I estimate 12 hours of human-engineer work; DC ships it in 1-2 hours). So end-to-end:

- **Day 1 (today):** You approve this doc + I write the spec for DC.
- **Day 2-3:** You knock out tasks #1-5 above (~2 hours of clock time spread across the days).
- **Day 3 or 4:** DC builds Phase 1. Lucas wakes for the first time.
- **Day 4-7:** Real-world shakeout. Cost numbers come in. Tune.

**Phase 2 (GitHub write tools, full Linear, self-wakeups, inter-agent Slack):** another 2-3 days end-to-end.

**Phase 3 (extract `agent-runner` as reusable, spin up Mira as second agent):** 1 day. Each subsequent agent: a few hours.

**Total to all-8-agents-running: ~2-3 weeks of clock time, of which your hands-on time is ~10-15 hours total.**

---

## Open questions back to Justin

Numbered for easy reply.

1. **Permission tier policy** — do you want me to draft the exact path lists for the 4 tiers, or do you want to whiteboard it with me live in a 30-min session?
2. **Skills system** — willing to try the SDK's skills-based progressive disclosure for protocols (writing-protocol, lock-protocol, etc.), even though our team doesn't use it today? This is the single biggest cost lever, but it's a structural shift. *My recommendation: yes, but as a Phase 2 optimization — Phase 1 Lucas can run with the heavier always-loaded protocols and we'll see the real cost first.*
3. **Memory backup** — do we want a daily snapshot of every agent's MEMORY.md committed to a separate `agent-memory-snapshots/` branch or repo, in case a bad consolidation eats history? Cheap insurance.
4. **Inter-agent Slack** — should agents talk in a shared `#team-pulse` channel where everyone can see (you included), or in pairwise DMs? I'd recommend **shared channel + DMs only for sensitive stuff** (Nathan→you legal, Emma→you financial). The shared channel is high-signal AND it teaches you how your team coordinates over time.
5. **Wakeups storage** — am I right that the SDK doesn't have a native scheduling primitive, so we roll cron + a `wakeups` table? Or is there a Claude Code Routines / managed cron primitive I should look at? *(I'll dig into this more if you say "go" — my reading so far is that the team-runtime owns scheduling, not the SDK.)*
6. **The "Claude in Cowork" path** — confirmed dead-end for our case? I think yes; just want a final check before I close that door in the ADR.
7. **Start small with Lucas-only and add agents based on real ROI**, or **lay all 8 down at once for parity**? My strong recommendation: **Lucas only first.** A week of real cost numbers will save us thousands.

---

## Recommended next action

If you greenlight the shape:

1. I write an ADR (`docs/decisions/033-team-runtime-sdk.md`) capturing the architecture decisions in this doc.
2. I update ADR-021 (the team-agents freeze) to point at ADR-033 as the resolution path.
3. I write the DC spec at `evryn-backend/docs/SPEC-AGENT-RUNNER.md` (or do we want a new dir in the new `evryn-team-runtime` repo? — see Q below).
4. I create the `evryn-team-runtime` repo skeleton (after your approval).
5. We schedule the 30-min path-policy conversation (Q1 above) so DC has the full spec when he starts.

**One repo-shape question:** the new `evryn-team-runtime` repo will hold the `@evryn/agent-runner` package + each agent's runtime service. But the *identity files* (CLAUDE.md, agent defs, protocols) stay in `evryn-team-workspace` (which is the cleaner separation: workspace = source-of-truth identity content, runtime = code that runs the identity). Confirm that split is right.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
