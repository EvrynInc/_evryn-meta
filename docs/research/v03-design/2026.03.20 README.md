# v0.3 Design Research — Index

> **Author:** AC2 (background architecture agent)
> **Date:** 2026-03-20
> **Status:** Draft proposals for AC0/Justin review
> **Scope:** Pre-stage v0.3 architecture. Research and proposals only — no source-of-truth docs were touched.
> **Prompt:** [PROMPT.md](PROMPT.md) — the exact prompt that produced these proposals. Copy and modify to re-run.

---

## Proposals

| # | Topic | File | Key Decision |
|---|-------|------|-------------|
| 01 | **Connection & Relationship Graph Schema** | [01-connection-graph-schema.md](01-connection-graph-schema.md) | Two tables: `relationships` (Evryn's intelligence graph) + `connection_events` (billable transactions). Answers all four open design questions from ARCHITECTURE.md. |
| 02 | **Proactive Behavior Architecture** | [02-proactive-behavior-architecture.md](02-proactive-behavior-architecture.md) | `care_queue` table + lightweight scheduler. Evryn creates proactive intentions; scheduler presents them; Evryn decides whether to act. Two-layer consent model. |
| 03 | **Multi-Gatekeeper Scoping** | [03-multi-gatekeeper-scoping.md](03-multi-gatekeeper-scoping.md) | Most things already per-gatekeeper. Key work: cross-gatekeeper dedup, approval routing (per-gatekeeper threads), coordinated outreach to shared contacts. |
| 04 | **Feedback Loop Formalization** | [04-feedback-loop-formalization.md](04-feedback-loop-formalization.md) | Three flows: gold→match confirmation, training feedback (reasoning_traces table), cross-user feedback routing (privacy-safe synthesis). |
| 05 | **Memory Scaling** | [05-memory-scaling.md](05-memory-scaling.md) | Structured story decomposition (hot synthesis + archive entries). `user_embeddings` table for pgvector. Reflection module as care_queue-triggered process. Token budget analysis. |
| 06 | **Trust Architecture at Scale** | [06-trust-architecture-at-scale.md](06-trust-architecture-at-scale.md) | Trust as profile layer (not separate table). Four trust standings. Identity verification flow. Tiered approval gate. Deception detection foundations. |

---

## Cross-Cutting Themes

**New tables proposed across all proposals:**
- `relationships` — Graph of known connections (proposal 01)
- `connection_events` — Brokered introductions / billable units (proposal 01)
- `care_queue` — Proactive outreach intentions (proposal 02)
- `reasoning_traces` — Decision audit trail + training data (proposal 04)
- `user_embeddings` — Vector representations for matching (proposal 05)

**Existing tables affected:**
- `users.profile_jsonb` — Structured story decomposition (proposal 05), trust layer (proposal 06), communication preferences (proposal 02)
- `emailmgr_items` — Already well-designed via ADR-018; proposals add linkage to connection_events and reasoning_traces

**Identity file additions needed:**
- `internal-reference/feedback-guidance.md` — Feedback flows, cross-user routing protocol (proposal 04)
- `internal-reference/proactive-outreach.md` — Tone guidelines for proactive messages (proposal 02)

**Key architectural decisions for Justin:**
1. Embedding model choice (proposal 05, Q2)
2. Story synthesis frequency — per-conversation or end-of-day? (proposal 05, Q1)
3. Auto-approve timeline for tiered approval (proposal 06, Q5)
4. Should relationships edges ever be deleted? (proposal 01, Q1)

---

## Dependencies Between Proposals

```
01 Connection Graph ──────────────────┐
                                      ├── 06 Trust at Scale (uses graph edges for trust traversal)
02 Proactive Behavior ────────────────┤
                                      ├── 03 Multi-Gatekeeper (uses care_queue for per-gatekeeper follow-ups)
04 Feedback Loops ────────────────────┤
                                      ├── 05 Memory Scaling (reasoning_traces feed reflection module)
05 Memory Scaling ────────────────────┘

01 and 05 are foundational — build those schemas first.
02 and 04 are the primary v0.3 behavior additions.
03 is mostly config-level, not schema-level.
06 is the trust overlay that constrains everything else.
```

---

## What AC2 Did NOT Cover (Out of Scope or Deferred)

- **Web app / PWA architecture** — v0.3 needs a web interface. This is a frontend architecture question, not a backend schema question.
- **Stripe integration** — Payment wiring for connection_events. Build concern, not design concern.
- **Publisher module** — v0.4 scope per ARCHITECTURE.md. But the approval gate evolution (proposal 06) designs toward it.
- **Cast-off outreach messaging** — Already well-specified in gatekeeper-flow.md (Phase II, Pathway 1). No new design needed.
- **Identity resolution for multi-channel** — ARCHITECTURE.md flags this as a v0.3+ need. Deserves its own proposal if Justin wants it scoped.
