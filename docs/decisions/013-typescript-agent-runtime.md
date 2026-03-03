# ADR-013: TypeScript for Agent Runtime

**Status:** Accepted
**Date:** 2026-03-02
**Participants:** Justin + AC

## Context

Evryn's product needs two kinds of compute:
1. **Agent runtime** — talks to Claude, reads emails, manages conversations, exercises judgment
2. **ML services** (v0.3+) — trains models, generates embeddings, runs similarity search

The question: should both be the same language?

## Decision

**TypeScript for the agent runtime. Python for ML services when needed (v0.3+).** These are separate services with API boundaries — different lifecycles, scaling patterns, and reliability profiles.

## Reasoning

**Why separate services regardless of language:**
- Agent runtime updates weekly; ML models update quarterly with A/B testing
- Agent = horizontal/I/O-bound; ML = vertical/GPU-bound
- ML training crash shouldn't kill email processing
- Industry standard (Netflix, Spotify, Uber all use multi-language service architectures)

**Why TypeScript for agent runtime:**
- SDK at v0.2.63 — production-ready for months, 1.85M weekly npm downloads
- V2 preview interface available (send/stream patterns) — shows where Anthropic is investing
- All reusable code from evryn-team-agents is TypeScript (email polling, Gmail client, Supabase client)
- DC1 built scaffolding in TypeScript on sprint day 1

**Why Python for ML services (when needed):**
- PyTorch, scikit-learn, sentence-transformers, FAISS, NumPy — no TypeScript equivalents
- Embedding generation, model training, complementarity vectors — all Python ecosystem
- Starts v0.3+, not now

**Python SDK status (March 2026):** GA (was v0.1.41 alpha in Feb 2026). Fully documented alongside TypeScript for every feature. Both SDKs support all MVP features: query, MCP, hooks, sessions, permissions. The alpha risk that originally motivated the TypeScript preference is resolved — this decision now stands on ecosystem maturity and existing codebase, not SDK risk.

**The dissent (captured for honesty):** "Evryn is an AI company. The entire AI ecosystem is Python. The two-language tax compounds. Build in the language of AI." Counter: the two-language split is separation of concerns, not a tax. The ML work doesn't start until v0.3+. And for the agent runtime specifically (query/hooks/MCP/sessions), the SDKs are equivalent — the Python ecosystem advantage only applies to ML.

**Justin's challenge (captured):** DC rewrite cost is ~40 minutes, not days — the switching cost argument alone doesn't hold. The decision stands on technical merit: TypeScript SDK maturity + existing working code + two-language architecture being the right pattern.

## References

- Session doc: `docs/historical/2026-02-24-mvp-build-work-s1-4.md` (Session 3 Decision 5, Session 4 Decision 8)
- SDK overview: platform.claude.com/docs/en/agent-sdk/overview
