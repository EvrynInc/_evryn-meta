# #sweep Protocol

**How to use this file:** Weekly hygiene checklist. Justin triggers this with `#sweep` (ideally once a week). AC works through the checklist and produces a short report: what's consistent, what needs attention.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Why this exists:** `#lock` catches session-level changes in real-time. `#sweep` catches accumulated drift — things that slipped through individual locks, or where a change in one place should have rippled to others but didn't.

---

## Checklist

Work through these in order. For each item, note whether it's clean or needs attention.

### 1. Hub / Spoke Consistency

Read the Hub (`docs/hub/roadmap.md`) — it will already be loaded. Then read every spoke file under `docs/hub/` in full. For each spoke, check:
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

As you work through the steps above, compile a running list of cross-repo references that seem high-risk for inconsistency — recently changed areas, references to docs that were moved or retired, or anything where a change in one place likely should have rippled to others. Once you've finished the other checks, go verify those references. Don't spot-check randomly; be intentional about where drift is most likely.

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

Then detail any flagged items with what needs fixing and a proposed fix.
