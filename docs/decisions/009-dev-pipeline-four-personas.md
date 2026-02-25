# ADR-009: Four-Persona Dev Pipeline (AC/DC/QC/OC)

**Date:** 2026-02-23
**Status:** Accepted

## Context

Evryn's development uses specialized Claude Code personas with separate CLAUDE.md identities. AC (Architect) and DC (Developer) already exist in separate repos. As the product build begins, two additional roles are needed:

1. **Quality review** — DC builds code, but the builder's mindset is the wrong mindset for finding problems. Adversarial review needs a separate cognitive mode.
2. **Operations** — CI/CD, monitoring, deployment, health checks, and "keep it running" concerns are distinct from feature development and need dedicated attention.

Claude Code auto-loads `CLAUDE.md` from the project root. You can't have multiple named persona files that auto-load selectively — so each persona needs its own repo to get the right identity loaded automatically.

## Decision

Four specialized Claude Code personas, each in its own repo:

| Persona | Repo | Role | Default Model Tier |
|---------|------|------|-------------------|
| **AC** (Architect) | `_evryn-meta` | Designs architecture, writes ARCHITECTURE.md and BUILD docs. High input (reads codebases), moderate output (arch docs, decisions). | Opus |
| **DC** (Developer) | `evryn-dev-workspace` | Builds from AC's specs. Highest output — writes code. Reads Hub top layer + repo ARCHITECTURE.md + BUILD doc. | Sonnet |
| **QC** (Quality) | `evryn-qc` (to be created) | Adversarial reviewer. Reads DC's code + AC's arch docs + decisions. Whole job is to break things and find problems. | Opus |
| **OC** (Operations) | `evryn-ops` (to be created) | CI/CD, monitoring, deployment, health checks, uptime. Handles "does it run in production at 3am" concerns. | Sonnet |

**Pipeline:** AC designs → DC builds → QC tears it apart → OC deploys and keeps it running. Justin arbitrates disagreements (eventually Agent Alex will).

**AC creates QC and OC repos.** AC architects each persona's CLAUDE.md — identity, Hub loading instructions, mailbox protocol, what context to load at what depth. DC should not create these because the persona architecture requires the same cross-repo awareness AC brings to all identity work.

**Mailbox protocol extends to all personas.** Same pattern as AC↔DC (`ac-to-dc.md` / `dc-to-ac.md`). QC gets `qc-to-dc.md` (issues found), `qc-to-ac.md` (design-level problems). OC gets similar.

**Each persona's CLAUDE.md starts with the Hub.** Shared mental model, then role-specific divergence. Without shared context, output is shallow and disconnected.

### Why Role Separation Matters

Role contamination is real. Architects start thinking about implementation details, builders second-guess design, and nobody's dedicated job is to find problems. Separate CLAUDE.md files = separate cognitive modes = each persona does one job well instead of four jobs poorly.

### Alternative Considered: Single Repo with Persona Files

We considered keeping all personas in `_evryn-meta` — a minimal CLAUDE.md router ("user will tell you which persona to be") plus a `claude-personas/` folder with `ac.md`, `dc.md`, `qc.md`, `oc.md`. Architecturally cleaner (one repo, one place to maintain everything). **Rejected** because of operational reality: Justin runs multiple Claude Code instances simultaneously (AC architecting while DC builds while QC tests). Separate repos = separate VS Code windows, which is how you keep 3-5 concurrent sessions straight. Tabs within one repo would be unmanageable with multiple DCs plus AC plus QC all running.

QC specifically needs access to `docs/decisions/` — so it knows what's *intentional* vs. what's a bug. Without that, QC would flag deliberate design choices as problems.

### Timing

- **AC and DC** — exist now
- **OC** — AC creates when Phase 0 is complete and there's infrastructure to manage (Railway deployed, CI/CD running)
- **QC** — AC creates when Phase 1 starts and there's application code to review

Triggers are embedded in the BUILD doc (`evryn-backend/docs/BUILD-EVRYN-MVP.md`) at the relevant phases.

### Future: Agent Orchestration

When Lucas/Alex comes back online, these personas can become subagent perspectives that Alex orchestrates programmatically — spinning up sessions, managing mailbox protocol via real-time Agent Team communication instead of files, handling session persistence. The manual desktop pipeline is prototyping that system. The identity repos remain as the source of truth for each persona's CLAUDE.md, whether loaded manually or by an orchestrator.

## Consequences

- Two new repos to create (AC's responsibility, triggered by BUILD doc milestones)
- Mailbox protocol docs need to account for four-way communication
- Hub repos table and bizops-and-tooling spoke need updating when repos are created (SYSTEM_OVERVIEW.md retired 2026-02-24, content absorbed into spokes)
- Hub spoke on dev pipeline may be warranted once the full pipeline is running
