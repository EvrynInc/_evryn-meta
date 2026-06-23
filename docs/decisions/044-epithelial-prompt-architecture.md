# ADR-044 — Epithelial prompt architecture: curated story in the system prompt, churning inputs in the user message

> **PROVISIONAL ADR NUMBER (044).** Minted by AC3a (Lane C / cost) on 2026-06-23 off a then-highest of ADR-042. Several round-2 lanes are authoring ADRs in parallel; if another lane also took 044, **AC0 renumbers one at convergence** (the filenames differ after the number, so git keeps both — only the number needs fixing).

> **How to use this file:** An Architecture Decision Record. It captures *why* we will move Evryn's per-user `pending_notes` out of the `systemPrompt` and into the first user message while keeping her curated `story` in the `systemPrompt`, and *why* that is both a cache lever and a security improvement. It is a **design decision whose build is deferred to a fast-follow** (see Status). Read it before touching prompt composition (`composeSystemPrompt` / `buildPersonContext` in `evryn-backend/src/triage/classify.ts`) or scoping the Step-57 runtime-bookkeeping refactor.

---

## Status

**Accepted (design) — build deferred to a measurement-gated fast-follow.** Justin signed off on the *direction* and on sequencing it as a fast-follow (2026-06-23), not folding it into the lean-Reflection build (ADR-043 / SPRINT Step 10) that is in flight on `r2/lane-c-cost`. The build is gated on (a) lean Reflection landing first (this restructure depends on consolidation keeping notes small) and (b) the week-one cache measurement sizing the cache payoff (see Consequences). Tracked as a new SPRINT step (proposed for Justin's auth alongside this ADR).

Supersedes nothing. Extends the Identity Composition / four-layer-dossier design in `evryn-backend/docs/ARCHITECTURE.md` and pairs with **ADR-043** (lean Reflection) and **SPRINT Step 57** (runtime-does-bookkeeping).

---

## Context

**The cost problem.** Evryn's per-query bill is dominated by how much of her `systemPrompt` is re-read on every one of Mark's ~200 daily emails. Today the `systemPrompt` is composed (`composeSystemPrompt`, `classify.ts`) as a four-layer dossier: a byte-identical identity prefix (`loadCommonPrefix`), an optional Operator suffix, and a **per-user suffix** (`buildPersonContext`) that contains *both* the user's `story` **and** their `pending_notes`. Anthropic prompt caching keeps cost down by reusing the longest matching prefix — but only at cache *breakpoints*, and:

- **We cannot see or control where the Agent SDK places those breakpoints.** Research (AC3a, 2026-06-23, against the official Agent SDK TS reference + GitHub issues #89/#188/#311) confirmed the SDK exposes **no** `cache_control` / breakpoint control: `systemPrompt` takes only a string, and breakpoint placement is SDK-internal and opaque. Issue #89 ("Cache Control in SDK") is open with no ETA.
- **So we don't know our caching granularity.** If the SDK treats the whole `systemPrompt` as one cache segment, then a *single* changed token anywhere in it (e.g. one appended `pending_note`) invalidates the *entire* `systemPrompt` cache — a cold re-write of ~28.7k tokens (the cost analysis's per-user profile estimate). That worst case is exactly the cache-temperature spread the cost model can't pin down ($2k warm ↔ $6.5k cold).

The churning part of the per-user suffix is the `pending_notes` (they grow as Evryn jots observations). The `story` is stable between Reflection consolidations. **The churn is what risks blowing the cache.**

**The security boundary (already established).** Per ARCHITECTURE.md ("External Communication as Untrusted Data" + "Identity Composition"), untrusted *incoming message content* always goes in the `prompt` (user message), never the `systemPrompt`. The `systemPrompt` is the trusted instruction layer. **Today both `story` and `pending_notes` already sit in the `systemPrompt`** — `pending_notes` is the *dirtier* of the two (raw-ish observations, cross-user notes, operator intros, content sometimes derived from untrusted email).

---

## Decision

Restructure per-user prompt composition so that:

1. **The curated `story` stays in the `systemPrompt`** (where it already is), immediately after the byte-identical identity prefix. The story is a twice-curated artifact (see point 4) and is stable between consolidations.
2. **The churning `pending_notes` move OUT of the `systemPrompt` and into the first user message**, clearly delimited and labelled as Evryn's own trusted observations (distinct from the untrusted incoming email, which is also in the user message). The raw incoming email stays in the user message exactly as today.
3. **Result — an "epithelial" architecture:** the `systemPrompt` is the protected interior (Evryn's self + her curated understanding of the person); the user message is the membrane facing the dirty world (churning notes + untrusted email + history). The trusted/stable content and the untrusted/churning content are *physically* separated.
4. **Two cleaning passes harden the story for the trusted layer.** Add injection-vigilance to BOTH (a) the note-writing instructions (`core.md` / `triage.md` — record the *fact*, never a directive lifted from an email) AND (b) the reflection instructions (`reflection.md` — the story is narrative, never instructions; never carry instruction-like content forward). By the time content reaches the `story`, it has passed two judgment-based curation passes — defense in depth, not a structural guarantee.

---

## Consequences

**Cache (the lever, conditional on churn — MEASURE before committing):**
- Moving the churn out means the `systemPrompt` stops changing between consolidations → it stays a full cache *read* regardless of how the SDK draws its invisible breakpoints. We stop betting on something we can't see. This is the v0.2-feasible form of the "cache chunking" instinct — achieved by *placement* (systemPrompt vs. user message), not by SDK breakpoint control (which we lack).
- **The payoff is churn-dependent and not guaranteed.** If Mark's notes are stable between consecutive queries, today's caching already reads them cheaply (~0.1×) and moving them to the user message (~1.0× regular input) is *worse*; if they churn, the restructure avoids a ~1.25× cold-write and wins. The week-one cache measurement (`cache_creation` vs `cache_read` tokens, per the cache-measurement plan, Q1/Q2/Q4) is what sizes this. **Hence: design accepted, build measurement-gated.**
- It **pairs with Reflection (ADR-043):** the restructure only pays off cleanly once notes are kept small (a large notes pile in the user message is ~1.0× *every* call). Reflection keeps them small; the restructure keeps the systemPrompt stable. Complementary, not alternatives.

**Security (net positive, independent of the cache outcome):**
- This *removes* the dirtier content (`pending_notes`) from the trusted `systemPrompt` and leaves only the twice-curated `story`. The untrusted email boundary is unchanged. So the trusted layer gets *cleaner*, not more exposed. Even if the cache payoff turns out marginal, the security restructure has standalone merit.
- Caveat — judgment, not a firewall: the two cleaning passes are Evryn's own judgment, so a determined injection *could* survive both. But because the `story` is **already** in the `systemPrompt` today, this decision does not *increase* that exposure — it reduces it (by evicting notes) and hardens it (the two-pass vigilance).

**Build (why it's a fast-follow, not folded into lean Reflection):**
- **Blast radius:** it edits per-user composition in *every* pathway (`processForward`, `processDirect`, operator, crons) — wider than the cost path, and it collides with Lane B's in-flight `classify.ts` edits this wave.
- **Overlaps SPRINT Step 57** (runtime-does-bookkeeping, which *also* restructures the prompt) — they should be designed together, not twice.
- **Instruction-weight + labelling care:** `pending_notes` carry Evryn's observations she should weight; in the user message they must be clearly delimited as her trusted notes, distinct from untrusted content, so she doesn't under-weight them or blur them with the email.

**Sequencing:** lean Reflection (ADR-043) lands first → week-one measurement sizes the cache payoff → build this restructure as a fast-follow, ideally co-designed with Step 57.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
