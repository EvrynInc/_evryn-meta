# Session Handoff — 2026-02-13

**How to use this file:** AC wrote this mid-session to preserve nuance before context compaction. A fresh AC instance should read this before starting Pre-Work #10 (build doc rewrite). Delete this file once its contents have been absorbed into the build doc and ARCHITECTURE.md.

---

## What Happened This Session

AC read all six source documents for Pre-Work #10, plus one additional historical doc Justin surfaced (`evryn-backend/docs/historical/2025.12.02_Mark_Build_first_stab.md`). Also reviewed LEARNINGS.md and AGENT_PATTERNS.md for transferable insights. Then updated the Hub and SYSTEM_OVERVIEW with corrections and forward-looking architectural stubs.

**No source documents were absorbed into the build doc yet.** The reading and discussion phase is complete. The writing phase (#10 itself) is next.

---

## Critical Framing Corrections

These came from Justin during this session. They correct AC's initial (wrong) framing. Get these right or the build doc will mislead DC.

### 1. Connections, Not Classification

**Wrong framing:** "Evryn classifies emails for Mark (gold/pass/edge case) and notifies him."

**Right framing:** Evryn surfaces **connections** from Mark's inbox. Classification is the mechanism; connection-brokering is the purpose. The `connections` table is v0.2 scope, not v0.3. When Evryn identifies a gold email and Mark acts on it, that's a connection being brokered — tracked as such from day one.

**Why this matters:** If we track gold matches in `emailmgr_items` status fields instead of a proper `connections` table, we'll have to migrate them later. "Build for one, structure for many" means the data model should be right from the start. The person who emailed Mark enters through a different door but is the same kind of user as anyone else.

**Every sender is a new Evryn user.** Finding Mark is just their first connection. Evryn will find them a soulmate, a math tutor, a therapist. The gatekeeper pathway is an acquisition channel, not a different user type.

### 2. User Isolation Is Absolute

**Wrong framing (from Lucas world):** "Multi-channel memory merges conversations by time — if Evryn gets an email from Mark and a Slack from Justin about the same thing, that's one conversation."

**Right framing:** Multi-channel conversations interleave *within* one user by time (like a real friendship — phone call, then text, same conversation). But they **never bleed between users**. The Lucas agents worked for Justin, so cross-channel blending made sense. Evryn manages independent user tracks — one user's information must never appear in another user's conversation.

**The Justin track is structurally special.** Justin is the operator, not a peer user. Evryn *must* discuss users with Justin (or the system can't function during testing), but this is an operator privilege, not a user-to-user interaction. At scale, even admin/operator access to user data must be heavily gated — users deserve privacy even from Evryn's own team.

**This must be bulletproof** — built into the data model and access patterns, not just prompt instructions.

### 3. Proactive Behavior Is Core Evryn, Not a Future Feature

If Mark goes quiet, Evryn should notice and reach out — gently, on her own initiative. "She's not really Evryn yet if she doesn't do this." This needs to be very early in the build — v0.2 or the first thing after it. Not deferred to a vague future version.

### 4. Edge Cases Go to Mark Too

**Initial assumption:** Edge cases get escalated to Justin only.

**Correction:** Edge cases go to Mark — only he can really decide what's pass/fail. But ALL outbound goes through Justin first (approval gate), so Justin sees everything regardless. The difference is what Evryn says: for gold she's confident; for edge cases she includes her reasoning and uncertainty.

### 5. Future Agent Council

At scale, Evryn is not a single agent. She's a "council" of specialized subagents:
- **Core Evryn** (Dialogue Brain) — conversation, tone, personality
- **Connection Brain** — matching, who fits whom
- **Care Brain** — proactive reflection, when to act or hold space
- **Publisher** — safety gate. ONLY job: checklist before anything goes out (inappropriate content? user info leaks? tone check?). Deliberately narrow context — doesn't carry Evryn's full conversational state. This is a subagent, not a skill — it needs independent judgment.
- **Deception detection** — trust verification

For v0.2, these all collapse into one agent + Justin-as-publisher. The architecture should be designed so they can separate cleanly when volume demands it.

### 6. Evryn's Three Modes

- **Public default** — how Evryn talks to any new user
- **Internal default** — how Evryn talks to Justin (operational, can discuss users by name)
- **User-adapted** — Evryn adjusts to each user's personality within bounds. She's always herself, but she meets people where they are.

---

## Source Document Assessment (for #10)

All sources have been read. Here's the status:

### Ready to absorb:

1. **Session 1 handoff** (`evryn-backend/docs/historical/session-handoff-2026-02-11.md`) — Most authoritative. Business model correction, schema staleness flags, specific sections to rewrite. Treat as decisions already made.

2. **Prototype schema analysis** (`evryn-backend/docs/historical/prototype-schema-analysis.md`) — Adopt `users`, `messages`, `emailmgr_items`, `evryn_knowledge` as foundation. Drop `emailmgr_queue` (SDK handles execution). Add `connections` table (v0.2 scope). Schema is not final — evaluate against v0.2 requirements, don't rubber-stamp.

3. **v0.1 system prompt** (two files in `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/`) — Three patterns to extract as skills: "Dream with me" (open invitation), Smart Curiosity (structured metadata collection invisible to user), "More About Me" (trust-building sequence). Script-as-skill principle: Claude gets the scripts + the reasoning, not verbatim instructions.

4. **Dec 2 historical doc** (`evryn-backend/docs/historical/2025.12.02_Mark_Build_first_stab.md`) — Mostly superseded, but five nuggets: (1) `profile_jsonb` structure (story/notes/pending_notes/gatekeeper_criteria), (2) bidirectional match shape for connections, (3) prompt injection mitigation pattern for email-as-data, (4) attachment handling phasing (note existence for MVP), (5) "escalate don't fake" principle.

5. **Hub** (`_evryn-meta/docs/roadmap.md`) — Already read and updated this session. Trust model and security principles to pull into build doc sections.

### Validation check only (no content to absorb):

6. **Requirements drafts** — Justin's reverse roadmap confirms build phases align. Salil's doc is a different architecture for a different team. No nuggets found that aren't already covered.

### Skip:

7. **n8n prototype JSON** — Key findings already captured in session 1 handoff and schema analysis. Raw JSON is 67K tokens with no additional insight.

---

## What the #10 Rewrite Produces

Two documents:

1. **`evryn-backend/docs/ARCHITECTURE.md`** (new) — How Evryn works as a system. Schema (with `connections` table), memory architecture, user isolation model, information firewalling, multi-channel within one user, Justin-as-operator track, proactive behavior, publisher pattern, pipeline design. Same structure as `evryn-team-agents/docs/ARCHITECTURE.md`.

2. **`evryn-backend/docs/BUILD-EVRYN-MVP.md`** (revised) — What to build, phase by phase. Stale sections rewritten, terminology corrected (no more "clients"), references to ARCHITECTURE.md for system design detail. Self-contained spec for DC.

---

## Transferable Patterns from LEARNINGS.md / AGENT_PATTERNS.md

Reviewed both. Key transfers to the Evryn build:
- **Modular context loading** — core identity always loaded, triage instructions / user preferences loaded per-trigger
- **Self-monitoring** — periodic "did I miss anything?" sweep, not just a health endpoint
- **Structural guards for self-modification** — Evryn updates `profile_jsonb`; two-layer defense (tell her it's destructive + validate before writing)
- **Stateful error compounding** — build resumption capabilities; if polling crashes mid-batch, pick up where left off
- **Same intelligence, different interfaces** — Evryn handles email, Slack, eventually direct conversation. Same agent, different trigger contexts

**Not transferable:** Push+sweep (polling is fine for v0.2), multi-agent coordination patterns (single agent for MVP), department-head coordination (no team yet), output styles/thinking modes (one voice for now).

---

## What's NOT Done Yet

- Pre-Work #10 writing (the actual rewrite)
- Pre-Work #6 (triage system prompt)
- Pre-Work #9 (DC CLAUDE.md update)
- The "every sender becomes a full Evryn user" lifecycle needs more detail in ARCHITECTURE.md
