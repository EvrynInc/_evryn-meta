# #sweep Protocol

**How to use this file:** Periodic hygiene checklist. Justin triggers this with `#sweep` (ideally at least once a week). AC works through the checklist in one pass and produces a report.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Why this exists:** `#lock` catches session-level changes in real-time. `#sweep` catches accumulated drift — things that slipped through individual locks, or where a change in one place should have rippled to others but didn't.

---

## How to Resolve Inconsistencies

When docs (or sections) disagree with each other, attempt to determine which one(s) are right and offer the fix. If you can't determine with reasonable confidence, just flag it for Justin.

**Resolution hierarchy (company truth flows down):**
- **Hub** anchors spokes. If a spoke contradicts the Hub on a company-level claim, the Hub is probably right.
- **Spokes** anchor architecture and build docs on their domain. A spoke carries the full-depth thinking; downstream docs should be consistent with it.
- **ARCHITECTURE.md** anchors build docs on system design.
- **Build docs** scope what to build next, informed by architecture.
- **current-state.md** reflects reality — if it contradicts an architecture or build doc, reality wins and the design doc is likely stale.

**Recency is a strong signal.** Check `git log` — whichever doc was updated more recently is usually the authority. The other one drifted.

---

## Checklist

Read the Hub (it will already be loaded), then work through these in one pass. Read each document in full — this is a dedicated session, not a quick glance.

### 1. Hub / Spoke Consistency

Read every file under `docs/hub/` in full. For each spoke, check:
- Does the Hub's hint for this spoke accurately describe what the spoke contains?
- Does the spoke contradict or extend beyond what the Hub implies?
- Has anything changed (in sessions, builds, or decisions) that should be reflected in the spoke but isn't?

### 2. Architecture Consistency

For each repo that has a `docs/ARCHITECTURE.md`, read it and compare against `docs/current-state.md` and recent git history. Does the architecture doc reflect what's actually built and the current design?

### 3. Build Doc Freshness

For repos with active build docs (`docs/BUILD-*.md`), check: does the build doc still reflect current scope and priorities? Are completed phases marked done? Are any new scope items missing?

### 4. LEARNINGS.md Promotion

Check `LEARNINGS.md` and `AGENT_PATTERNS.md` for items ready to be promoted to their permanent homes (CLAUDE.md, ARCHITECTURE.md, build docs, Hub/spokes). Promote what's ready, remove what's been promoted.

### 5. Current State Accuracy

Read `docs/current-state.md`. Does it match reality? Check against recent commits and any work done since last update.

### 6. Cross-Repo Reference Integrity

As you work through the steps above, compile a running list of cross-repo references that are high-risk for inconsistency — recently changed areas, references to docs that were moved or retired, or anything where a change in one place likely should have rippled to others. Once you've finished the other checks, go verify those references. Be intentional about where drift is most likely.

---

## Output

After working through the checklist, give Justin a brief summary:

```
#sweep results:
- Hub/spoke consistency: [clean / N items flagged]
- Architecture docs: [clean / N items flagged]
- Build docs: [clean / N items flagged]
- LEARNINGS promotion: [N items promoted / clean]
- Current state: [accurate / updated]
- Cross-repo refs: [clean / N issues]
```

For each item, state the inconsistency and your proposed fix. Group by confidence:
- **Confident fixes** — you know which doc is the authority and what the fix should be. Present these as ready to apply.
- **Flagged for Justin** — genuinely ambiguous, or a company-level judgment call. State which doc you think is the authority (and why), but let Justin decide.
