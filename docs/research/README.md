# `docs/research/` — durable research and analysis

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`.
>
> **How to use this file:** a signpost for what belongs in this directory. It is deliberately short — it is not a protocol. The craft rules for writing anything here live in `docs/protocols/ac-writing-protocol.md`.

*Established 2026-08-12 (ACfsq, at Justin's direction). The first occupant is the team-runtime SDK-sessions analysis, which was written into `docs/working/` and did not belong there — an ADR cites it, so it needed a home that does not advertise itself as disposable.*

---

## What belongs here

**Research and analysis whose value is being re-readable later** — by someone re-opening a settled question, or arriving at a problem we already studied. If a decision record cites it, it belongs here.

- Investigations into a question, with their evidence (SDK/library findings, cost analyses, architecture comparisons)
- The full-resolution reasoning behind a decision, where the ADR carries only the decision-grade summary
- Evaluations and options-costed write-ups that outlive the session that produced them

## What does NOT belong here

- **Session working notes, lane briefs, handoffs, packouts → `docs/working/`.** Those are an instance's own scratch and crash-survival surface. ⚠️ **Justin does not read `docs/working/`** — it is the authoring agent's space. Anything meant to be read later by someone else does not live there.
- **Decisions → `docs/decisions/` (ADR format).** A decision record is not research. Research *backs* a decision; the ADR *is* it.
- **What changed → `CHANGELOG.md`. Current status → `docs/current-state.md`.**
- **Strategic, growth, ops and build research → `evryn-team-workspace/shared/projects/<dept>/research/`.** That routing is unchanged and is canonical in `CLAUDE.md` (Documentation Approach → Research routing). **This directory is for research that is genuinely AC-side / cross-repo** — the kind that would otherwise have no home but `docs/working/`.

## Naming

**`YYYY.MM.DD-<author>-<topic>.md`** — date first (dots in the date, dashes as separators), then the authoring instance, then a short topic. **No recipient**: research has no recipient, which is what distinguishes it from a working doc.

⚠️ **Note for anyone cross-checking against `evryn-team-workspace/.../research/`:** that directory is mixed. Its older files use a **space** after the date (`2026.01.30 memory-systems.md`); everything since 2026-04 uses **dashes**, and the most recent adds an author tag (`2026.07.13-acu-outreach-engine-research.md`). **This directory follows the dashed form**, which matches both that recent trend and `docs/protocols/ac-writing-protocol.md`'s file-naming rule — and avoids spaces in paths that shell and git operations have to quote.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
