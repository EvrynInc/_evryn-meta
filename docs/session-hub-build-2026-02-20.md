# Session Working Notes — Hub Build (2026-02-20)

> **Purpose:** Compaction-safe capture of the Hub restructuring project. If you're a fresh instance picking this up, read this fully before taking any action. Delete after all work is complete and committed.

---

## What We Did

The Master Plan Reference (MPR, `docs/historical/master-plan-reference.md`, ~730 lines) was supposed to be frozen history but kept getting referenced because the Hub (`docs/hub/roadmap.md`) was too thin. We restructured into a **hub-and-spokes wiki:**

- **Hub** (`docs/hub/roadmap.md`, ~150-200 lines) — lean company truth, loads on every agent volley. Each section has ~15-20 lines of principles + inline link to a spoke.
- **7 spokes** (`docs/hub/*.md`) — full domain depth. trust-and-safety, user-experience, business-model, gtm-and-growth, technical-vision, long-term-vision, bizops-and-tooling.
- **MPR** — frozen. Both it and the original v2.3 are fully superseded. No agent should ever need to read either.

All corrections from recent work (clarifications doc, legal questionnaire) were applied during the reorganization — Trust Mirror dropped, vouching reframed, payments architecture clarified, etc.

---

## Everything Is Done

- **Hub + 7 spokes** written, committed, pushed
- **All 4 repo CLAUDE.md files restructured:** AC identity (edit-approval, auto-memory hygiene, runtime ownership). DC identity (reading order, Diataxis, auto-memory hygiene). evryn-backend and evryn-team-agents got hard-stop redirects with runtime agent context below. evryn-website already had its hard stop.
- **Edit-approval disclaimers** added to 18 source-of-truth files across 3 repos
- **MPR header frozen** — both v2.3 and the condensation marked fully superseded
- **Link convention established:** repo-root-relative within-repo, sibling-repo for cross-repo
- **Hub moved** from `docs/roadmap.md` to `docs/hub/roadmap.md`. All 15 references across 4 repos updated.
- **ADR-008** written (Trust Mirror dropped — canary principle)
- **LEARNINGS.md** updated with "CLAUDE.md Serves the Runtime Agent" pattern
- **evryn-website** restructured — build context in `docs/ARCHITECTURE.md`, CLAUDE.md is hard stop
- **Auto-memory trimmed** (removed items now captured in persistent docs)
- **Session doc trimmed** (294 → 95 lines, now further updated)

---

## Open Items (not blocking — carry to next session)

- Ask Justin about "trusted briefing" path for The Long View closing
- (Optional) Sanity check against original MP v2.3 for lost content
- Review pass with Justin

---

*This session doc can be deleted once Justin has reviewed and is satisfied with the Hub restructuring.*
