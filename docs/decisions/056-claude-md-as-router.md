# ADR-056 — `_evryn-meta/CLAUDE.md` becomes a ROUTER, not an operating manual

**Status:** Accepted (2026-08-18, Justin) · **implemented and merged** (`faf3eda`)
**Context repo:** `_evryn-meta`
**Companion:** ADR-057 (agent definitions as the single home) — the two shipped together in "Lane A" but are **separable decisions**, and are recorded separately for that reason.
**Written:** 2026-08-18 by AC0-37e, retroactively — the decision shipped before its record existed, which is the gap this ADR closes.

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.
>
> **How to use this file:** the decision record for *why the file every agent auto-loads is nearly empty*. **Read this before proposing that anything be added to `_evryn-meta/CLAUDE.md`** — the whole value of the change is that the file stays small, and the pressure to grow it will be constant.

---

## Context

**The harness auto-injects `<repo>/CLAUDE.md` into every agent spun in that workspace** — AC, DC, QC, OC, founding-team agents, and generic subagents alike, regardless of which one they are. That is not configurable per agent.

**And `_evryn-meta/CLAUDE.md` *was* AC's full operating manual** — roughly **45,000 tokens**. So:

- **Every subagent was force-fed the wrong agent's manual before reading one line of its own work.** A DC spun to build a feature, a QC spun to review it, and a generic agent spun to check whether a file exists all paid the same ~45K.
- **The cost was not only tokens.** A manual describing *AC's* commit authority, *AC's* escalation ladder and *AC's* relationship with Justin is actively misleading to a DC — it is not merely irrelevant, it is instructions addressed to someone else.
- **It scaled the wrong way.** A planned wave of seven build lanes, each spinning a DC *and* a QC, is ~14 subagents ≈ **~1.2M tokens of pure waste before a line of work.**
- ⚠️ **And a full-runtime load no longer reliably fit one agent** — three attempted it on 2026-08-10 and **two compacted during the load.** Every token spent on the wrong manual was a token unavailable for the right context.

---

## Decision

**`_evryn-meta/CLAUDE.md` is a ROUTER.** It is ~78 lines and it does exactly two things:

1. **States the ONE HARD RULE** — *"if your agent identity doesn't load, STOP — you're not authorized to do ANYTHING — just report the failure"* — plus the compaction rule (ADR-058), because both are the universal safety floor and must reach every agent regardless of type.
2. **Routes the reader to their own manual**, by a table keyed on which agent they are.

**AC's manual moved to `_evryn-meta/.claude/agents/ac.md` and now sits behind the router exactly like everyone else's. AC is one of many; there is no special case.**

---

## Reasoning

**The injection is a fixed cost paid by everyone, so the only lever is what is in the file.** We cannot make the harness inject different content per agent. We *can* make the injected content small enough that paying it for the wrong agent costs almost nothing.

🔑 **The design constraint that follows, and it is the whole ADR: the router must be true for EVERY reader.** Anything agent-specific belongs behind it. That is why the router carries only the hard rule and the routing table — those are the two things that are equally true for an AC, a DC, and a one-line lookup agent.

⭐ **A second property, deliberate and easy to miss: the router is kept near-static so that a STALE COPY OF IT IS STILL A CORRECT COPY.** The injection has been observed serving a snapshot hours out of date. **A small, slow-changing router survives that; a 45,000-token manual would not.** Everything that changes frequently lives behind the router, where it is read from disk at load time.

---

## Alternatives considered and rejected

- **Keep the manual in `CLAUDE.md` and tell subagents to ignore it.** ❌ **Rejected: it does not save the tokens, which were the primary cost.** An instruction to disregard 45,000 tokens is paid in full before it is read.
- **Trim the manual rather than move it.** ❌ **Rejected: it treats a structural problem as a size problem.** Even a 10,000-token AC manual is wrong for a DC. **The defect was never the length — it was that the file was addressed to one agent and delivered to all of them.**
- **Put the router's content in each repo's own `CLAUDE.md` instead.** ❌ **Rejected: it does not reach an agent spun from a session rooted in `_evryn-meta`,** which is how conductor-spun subagents are spun.

---

## Consequences

- ✅ **Every non-AC subagent stops paying ~45,000 tokens of the wrong manual on every spin.**
- 🔴 **A NEW FAILURE MODE THAT MUST BE DESIGNED AGAINST, and it is the price of this decision: the auto-injection used to hand an agent *some* complete manual by accident. Now it hands it NONE.** ⇒ **A subagent called "DC" or "QC" whose brief does not name its manual in `<mandatory_load>` is not that agent** — it is a generic model holding a routing table. **Never ship code where "DC reviewed" or "QC reviewed" means a subagent that was never handed its manual.**
- ⚠️ **AC's own cost is unchanged.** The router moved the burden off DC/QC/OC; **AC still pays the full manual, now read from disk instead of injected.** **Reducing AC's own resident load is separate, open work** — an audit of what is auto-loaded every turn that should be a protocol or a skill instead.
- 📌 **Standing pressure to resist:** every future agent-wide rule will feel like it belongs in the router, because that is the one file everyone reads. **The test is whether it is true for a generic one-line lookup agent.** If not, it belongs in a manual.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
