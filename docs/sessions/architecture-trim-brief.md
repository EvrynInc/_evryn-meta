# Task Brief: Trim evryn-backend ARCHITECTURE.md

**For:** A fresh AC instance
**Created:** 2026-03-09
**Status:** Ready to execute

---

## The Problem

`evryn-backend/docs/ARCHITECTURE.md` is 847 lines. It's the system blueprint that AC and DC both read at session start. At this size, it blasts the context window — sessions compact within minutes of loading it, which defeats its purpose. We need it shorter without losing anything that matters.

## The Goal

Trim ARCHITECTURE.md to be **skimmable and modular** — an instance should be able to load the whole doc and still have room to work, OR skim headers and pull only the sections relevant to the current task. Target: significant reduction (ideally under 500 lines), but **do not sacrifice clarity for brevity.**

## The Strategy

Justin's specific suggestions:

1. **Replace inline rationale with ADR pointers.** Many sections explain *why* a decision was made when an ADR already captures the full reasoning. Replace "We do X because [3 paragraphs of reasoning]" with "We do X (see ADR-NNN for rationale)." Keep only the *what* and *how* inline.

2. **Identify sections that are read-on-demand, not always-read.** Some sections only matter when working on specific parts of the system. Could these be clearly marked so an instance knows to skip them unless relevant?

3. **Eliminate redundancy.** The doc has grown through accretion — multiple passes added content, and some ideas are now stated more than once in different sections. Collapse duplicates.

4. **Keep it skimmable.** Headers, short paragraphs, tables over prose where appropriate. An instance scanning the doc should be able to find what it needs in seconds.

## Critical Constraint: Don't Overcompress

**This is the most important constraint.** AC's CLAUDE.md has an explicit warning about overcompression: *"Before tightening prose, consider WHY it might have been verbose — the phrasing may carry important nuance, emphasis, or context that a future reader needs."*

The doc was built over many sessions with Justin's direct input. Some things that look redundant or wordy are deliberately so — they encode emphasis, scope boundaries, or context that prevents future misunderstanding. If something *seems* redundant, consider whether both instances serve different audiences or contexts before cutting.

**When in doubt, keep it. A slightly long doc is better than one that lost something important.**

## What to Read

**In this order:**

1. **This brief** (you're reading it)
2. **`_evryn-meta/CLAUDE.md`** — AC's operating manual. Pay special attention to: "Documentation Approach" (Diataxis + progressive depth), "Write notes that survive context loss" (the overcompression warning), and "Source-of-truth documents require explicit approval from Justin before edits."
3. **`_evryn-meta/docs/hub/roadmap.md`** — The Hub. What Evryn is. You need this to understand what ARCHITECTURE.md is describing.
4. **`evryn-backend/docs/ARCHITECTURE.md`** — The full 847 lines. Read every word. This is what you're trimming.
5. **All 17 ADRs in `_evryn-meta/docs/decisions/`** — Read each one. You need to know what rationale is already captured in ADRs so you can confidently replace inline reasoning with pointers. The relevant ones for this doc are primarily ADRs 001, 012, 013, 014, 015, 016, 017 — but scan all of them.

**You do NOT need to read:** Session docs, CHANGELOG, LEARNINGS, AGENT_PATTERNS, identity files, spokes (other than the Hub), BUILD doc, SPRINT doc.

## How to Deliver

**This is a source-of-truth document. Do not edit it directly.** Instead:

1. **Produce a section-by-section proposal.** For each `##` section in ARCHITECTURE.md, state:
   - Current line count
   - What you propose to cut, collapse, or replace with ADR pointers
   - Why each cut is safe (what captures the removed content elsewhere)
   - Proposed new line count
   - Any concerns or things you'd flag for Justin

2. **Flag anything you're unsure about.** If a section seems redundant but you can't confirm the content lives elsewhere, say so. Justin will decide.

3. **After Justin approves the proposal,** make the edits. Not before.

## Sections in the Current Doc (for reference)

| Section | Lines | Notes |
|---------|-------|-------|
| Header + Required Context | 1-30 | Keep — this is the reading protocol |
| How to Author This Document | 32-48 | Evaluate — is this needed every read? |
| What Evryn Is | 50-74 | Short already, probably fine |
| User Model | 76-127 | |
| Data Model | 129-243 | Longest section — schema details |
| Memory Architecture | 245-335 | |
| Pipeline Design | 337-416 | |
| Agent Architecture | 418-642 | Second longest — identity composition, SDK, file tree |
| Onboarding Patterns | 644-672 | May be absorbable into identity-writing-brief |
| Security | 674-744 | |
| System Diagram | 746-817 | ASCII art — hard to trim |
| Current State | 819-836 | |
| Related Documents | 838-847 | Keep |

## What Success Looks Like

- A doc that's under ~500 lines (flexible — quality over target)
- Every cut is traceable: "this rationale is in ADR-012" or "this is stated identically in section X"
- The doc is still self-contained enough that DC can build from it without chasing references
- Justin reviews and approves every change before it's made
- Nothing was lost that would cause a future instance to misunderstand the architecture
