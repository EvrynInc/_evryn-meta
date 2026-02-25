# Document Ownership

**How to use this file:** Reference table for who owns what document across Evryn repos. Check this before creating or modifying documents to ensure you're writing to the right place.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

**Rule:** Every document must have a "how to use this" header explaining what belongs in it and what doesn't. This prevents scope creep and sprawl.

**Note:** Once Lucas/Alex is running, many of these docs will be jointly owned by AC and Lucas. AC retains authority for architectural decisions; Lucas maintains operational state. Ownership table will be updated at that transition.

---

## _evryn-meta

| Document | Owner | Purpose |
|----------|-------|---------|
| `CLAUDE.md` | AC | Operating manual (AC's identity and methodology) |
| `SYSTEM_OVERVIEW.md` | — | **RETIRED** — content absorbed into Hub, spokes, and ARCHITECTURE.md. Moved to `docs/historical/`. |
| `LEARNINGS.md` | AC | Cross-project patterns and insights |
| `AGENT_PATTERNS.md` | AC | Agent-building learnings for Evryn product |
| `CHANGELOG.md` | AC | What was built/changed (free to edit) |
| `docs/hub/roadmap.md` | Justin | The Hub — company truth, loaded every session |
| `docs/hub/trust-and-safety.md` | AC (Justin approves) | Spoke: trust architecture, moderation, safety |
| `docs/hub/user-experience.md` | AC (Justin approves) | Spoke: onboarding through after-care, Evryn's voice |
| `docs/hub/business-model.md` | AC (Justin approves) | Spoke: pricing, revenue, wallet, financial model |
| `docs/hub/gtm-and-growth.md` | AC (Justin approves) | Spoke: GTM strategy, growth mechanics, competitive |
| `docs/hub/technical-vision.md` | AC (Justin approves) | Spoke: aspirational architecture at scale |
| `docs/hub/long-term-vision.md` | AC (Justin approves) | Spoke: federation, foundation, civilizational vision |
| `docs/hub/bizops-and-tooling.md` | AC (Justin approves) | Spoke: legal, finance, vendors reference |
| `docs/current-state.md` | AC | Cross-project status snapshot |
| `docs/lock-protocol.md` | AC | #lock checkpoint procedure |
| `docs/ac-dc-protocol.md` | AC | AC/DC communication protocol |
| `docs/doc-ownership.md` | AC | This file — who owns what |
| `docs/decisions/*.md` | AC | ADRs (written once, typically frozen) |
| `docs/legal/*` | AC | Legal clarifications and questionnaire docs |
| `docs/historical/*` | Frozen | MPR, MP v2.3, other archived docs |

## evryn-team-agents

| Document | Owner | Purpose |
|----------|-------|---------|
| `CLAUDE.md` | AC | Hard stop for developers + Lucas's runtime context (transitional) |
| `docs/BUILD-LUCAS-SDK.md` | AC | SDK build spec (DRAFT) |
| `docs/ARCHITECTURE.md` | AC | System architecture (needs rewrite for SDK) |
| `.claude/agents/*.md` | AC | Subagent definitions (future — Justin reviews each) |
| `.claude/skills/*.md` | AC | Skills for Lucas (future) |
| `modules/*` | AC | Rich context loaded on demand (future) |

## evryn-backend

| Document | Owner | Purpose |
|----------|-------|---------|
| `CLAUDE.md` | AC | Hard stop for developers + Evryn's runtime context (transitional) |
| `docs/ARCHITECTURE.md` | AC | Technical blueprint for Evryn product |
| `docs/BUILD-EVRYN-MVP.md` | AC | Build spec for v0.2 |

## evryn-dev-workspace

| Document | Owner | Purpose |
|----------|-------|---------|
| `CLAUDE.md` | DC | Operating manual (DC's identity and methodology) |

## evryn-website

| Document | Owner | Purpose |
|----------|-------|---------|
| `CLAUDE.md` | AC | Hard stop — "use DC" |
| `docs/ARCHITECTURE.md` | AC | Design system and site structure |

## Cross-repo

| Resource | Owner | Purpose |
|----------|-------|---------|
| Linear (EVR workspace) | AC | Backlog — small items to not forget |

---

**Sync responsibility:** When company-level changes happen (team structure, mission, strategy), update the Hub (`_evryn-meta/docs/hub/roadmap.md`) — it's the single source of company truth. Domain spokes carry full depth; `evryn-backend/docs/ARCHITECTURE.md` carries the build-level architecture.
