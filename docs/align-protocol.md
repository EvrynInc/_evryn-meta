# #align Protocol

**How to use this file:** Principles-to-practice integration checklist. Justin triggers this with `#align` (ideally weekly, alongside `#sweep`). AC reads the full belief layer (Hub + spokes) and the full build layer (ARCHITECTURE.md + BUILD docs), then checks whether what we're building actually embodies what we believe.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Why this exists:** `#lock` catches session-level changes. `#sweep` catches doc-to-doc inconsistency. `#align` catches a different kind of drift — principles that aren't reflected in the build, or build decisions that overlook deep design constraints. These gaps aren't "wrong" by any consistency check — they're just not *connected*. Left unchecked, they compound silently until a principle that should have shaped the architecture gets discovered too late to incorporate cheaply.

---

## Checklist

Read the Hub and every spoke in full. Then read every active ARCHITECTURE.md and BUILD doc in full. This is a deep read, not a skim.

### 1. Principles → Build

For each substantive principle, design constraint, or commitment in the Hub and spokes, ask:

- Is this reflected in the current architecture or build spec?
- If not, should it be — now, or at a defined future phase?
- If it's genuinely future-state, is there at least a breadcrumb in the build layer acknowledging it exists?

Flag principles that have no build-layer representation at all — not even a "planned" or "future" note.

### 2. Build → Principles

For each significant build decision or architectural pattern, ask:

- Does this contradict or overlook any principle in the Hub or spokes?
- Does this embody the *spirit* of the principles, or just avoid violating the letter?
- Are there implicit assumptions in the build that the principles would challenge if surfaced?

### 3. Breadcrumb Check

For principles that are correctly deferred (genuinely future-state), verify that the deferral is explicit somewhere in the build layer. A principle without a breadcrumb is a principle that will be forgotten.

---

## Output

After working through the checklist, give Justin a brief summary:

```
#align results:
- Principles with no build representation: [N items / clean]
- Build decisions that may conflict with principles: [N items / clean]
- Missing breadcrumbs for deferred principles: [N items / clean]
```

For each item, state the principle, where it lives, what's missing or conflicting, and your recommendation. Group by urgency:
- **Address now** — the gap affects current or next-phase work. Propose specific changes to ARCHITECTURE.md, BUILD docs, or spokes.
- **Track for later** — the gap is real but the principle is genuinely future-state. Propose a breadcrumb placement.
- **Flagged for Justin** — genuinely ambiguous, or a judgment call about whether a principle applies to the current build.
