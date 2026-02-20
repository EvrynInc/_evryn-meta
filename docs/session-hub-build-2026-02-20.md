# Session Working Notes — Hub Build (2026-02-20)

> **Purpose:** Compaction-safe capture of the Hub restructuring project. If you're a fresh instance picking this up, read this fully before taking any action. Delete after all work is complete and committed.

---

## What We're Doing

The Master Plan Reference (MPR, `docs/historical/master-plan-reference.md`, ~730 lines) was supposed to be frozen history but kept getting referenced because the Hub (`docs/hub/roadmap.md`) was too thin. We restructured into a **hub-and-spokes wiki:**

- **Hub** (`docs/hub/roadmap.md`, ~150-200 lines) — lean company truth, loads on every agent volley. Each section has ~15-20 lines of principles + inline link to a spoke.
- **7 spokes** (`docs/hub/*.md`) — full domain depth. trust-and-safety, user-experience, business-model, gtm-and-growth, technical-vision, long-term-vision, bizops-and-tooling.
- **MPR** — frozen after this work. No agent should ever need to read it again.

All corrections from recent work (clarifications doc, legal questionnaire) were applied during the reorganization — Trust Mirror dropped, vouching reframed, payments architecture clarified, etc.

---

## What's Done

All the heavy lifting is complete. In summary:

- **Hub + 7 spokes** written, committed, pushed (Hub expanded with ethos, connections, safety, long view sections)
- **All 4 repo CLAUDE.md files restructured:** AC identity updated (edit-approval, auto-memory hygiene, runtime ownership). DC identity updated (reading order, Diataxis, auto-memory hygiene, redundancy cleanup). evryn-backend and evryn-team-agents got hard-stop redirects with runtime agent context below. evryn-website already had its hard stop from earlier.
- **Link convention established:** repo-root-relative within-repo, sibling-repo for cross-repo. No `../` paths.
- **Hub moved** from `docs/roadmap.md` to `docs/hub/roadmap.md`. All 15 references across 4 repos updated.
- **ADR-008** written (Trust Mirror dropped — canary principle)
- **LEARNINGS.md** updated with "CLAUDE.md Serves the Runtime Agent" pattern
- **evryn-website** restructured — all build context moved to `docs/ARCHITECTURE.md`, CLAUDE.md replaced with hard stop

---

## Remaining Work

### 1. Add edit-approval disclaimers (~19 files)

**Policy** (already in AC and DC CLAUDE.md): Source-of-truth documents require explicit approval from Justin before edits. The concern is about compressing *language* that was written a specific way for a reason — not just redundancy. Propose changes; don't make them directly.

**The disclaimer to add** (adapt wording to fit each file's existing header):
Something like: "Edits require explicit approval from Justin. Propose changes; don't make them directly."

**Files that need it** (Hub already has it):

Spokes:
- docs/hub/trust-and-safety.md
- docs/hub/user-experience.md
- docs/hub/business-model.md
- docs/hub/gtm-and-growth.md
- docs/hub/technical-vision.md
- docs/hub/long-term-vision.md
- docs/hub/bizops-and-tooling.md

Architecture / build / system:
- _evryn-meta/SYSTEM_OVERVIEW.md
- evryn-backend/docs/ARCHITECTURE.md
- evryn-backend/docs/BUILD-EVRYN-MVP.md
- evryn-team-agents/docs/ARCHITECTURE.md
- evryn-team-agents/docs/BUILD-LUCAS-SDK.md

State & learnings:
- _evryn-meta/docs/current-state.md
- _evryn-meta/LEARNINGS.md
- _evryn-meta/AGENT_PATTERNS.md

Protocols & governance:
- _evryn-meta/docs/lock-protocol.md
- _evryn-meta/docs/ac-dc-protocol.md
- _evryn-meta/docs/doc-ownership.md

**Excluded** (free to edit): CHANGELOG.md, ADRs, mailbox files.

### 2. Freeze MPR header

Add "fully superseded by Hub + spokes" to `docs/historical/master-plan-reference.md`.

### 3. Commit and push all repos

### 4. Review pass with Justin

### 5. Open items (not blocking)
- Ask Justin about "trusted briefing" path for The Long View closing (flagged last session, still open)
- (Optional) Sanity check against original MP v2.3 for lost content
