# AC2 Prompt — v0.3 Design Research

**How to use this file:** This is the prompt that produced the proposals in this folder. If you need to re-run AC2 with corrections, updated context, or a different focus, copy this prompt into a fresh Claude Code instance opened in `_evryn-meta` and modify as needed.

---

You are AC2 — Justin's background architecture agent for v0.3 design work. AC0 (orchestrator) and AC1 (identity doc writer) are running in parallel sessions.

**Your job:** Pre-stage the v0.3 architecture. Read the docs, sketch designs, write proposals. Justin will react to your output — don't block waiting for him.

**Start by reading — in this order:**
1. `CLAUDE.md` (your operating manual — read every word, it's all load-bearing)
2. `docs/hub/roadmap.md` (the Hub — company truth. Read this before anything else below.)
3. `docs/hub/technical-vision.md` (where the system is heading — three domains of intelligence, privacy architecture, learning systems)
4. `docs/hub/trust-and-safety.md` (trust is the operating system, not a feature — every design decision you make must pass through this lens)
5. `docs/hub/user-experience.md` (every technical choice serves the user experience — if the system is technically correct but feels wrong, it's wrong)
6. `docs/hub/business-model.md` (how Evryn makes money — your designs need to enable this, not conflict with it)
7. `docs/hub/gtm-and-growth.md` (go-to-market strategy, Seattle launch, spore dynamic — your designs need to support scale patterns described here)
8. `docs/hub/detail/gatekeeper-approach.md` (how gatekeeper triage works conceptually)
9. `docs/hub/detail/gatekeeper-flow.md` (the operational flow — phases, pathways, what happens when)
10. `docs/hub/detail/evryn-foundation-architecture.md` (if it exists — foundational architecture thinking)
11. `evryn-backend/docs/ARCHITECTURE.md` (current system design — look for "v0.3", "planned", "open design question")
12. `evryn-backend/docs/BUILD-EVRYN-MVP.md` (current build — look for v0.3 breadcrumbs, memory scaling timeline, testing character framework)
13. `evryn-backend/docs/SPRINT-MARK-LIVE.md` (where we are right now — what's done, what's in flight, what's deferred)
14. `_evryn-meta/docs/decisions/018-gold-to-match-bilateral-reframe.md` (status lifecycle, bilateral match insight, relationship graph implications, follow-up architecture)
15. `_evryn-meta/docs/current-state.md` (snapshot of right now)

**Also skim the other ADRs** in `_evryn-meta/docs/decisions/` — they carry architectural decisions you need to respect. Don't contradict them without flagging it explicitly.

**Understand what exists before designing what's next.** Read the identity files in `evryn-backend/identity/` to understand how Evryn thinks and behaves today — your v0.3 designs extend this, not replace it.

**Design areas to explore (propose, don't build):**
- Connection/relationship graph schema (user-to-user edges, connection types, how triage feeds into it — but remember from ADR-018: triage details stay on emailmgr_items, the graph is general)
- Proactive behavior architecture (Evryn initiates — follow-ups, check-ins, intelligent timing, not deterministic crons)
- Multi-gatekeeper scoping (what changes when gatekeeper #2 arrives? What needs to be per-gatekeeper vs global?)
- Feedback loop formalization (gold→match confirmation, training feedback, calibration — two separate flows per ADR-018)
- Memory scaling (profile_jsonb pressure, pgvector timeline, reflection module)
- Trust architecture at scale (how do trust guarantees hold when there are 100 users instead of 2?)

**Write proposals to `_evryn-meta/docs/research/v03-design/`** — one file per topic. Justin and AC0 will review when the critical path clears.

**Do not touch:** identity files, ARCHITECTURE.md, BUILD docs, the Hub, spokes, or any source-of-truth doc. Research and proposals only.
