# Session Notes — 2026-02-12

**How to use this file:** Captures decisions and nuances from today's AC session (Session 2 continuation). Absorb into the Hub and other docs, then delete.

*Written: 2026-02-12T12:08:24-08:00*

---

## Document Architecture Decisions

### Hub-and-Spoke Model (decided this session)

The document hierarchy is **hub-and-spoke**, not layered:

```
THE HUB (_evryn-meta/docs/roadmap.md)
  ~100 lines, loaded every session by every agent
  Comprehensive: product + tech + business + trust + growth
  THE single living source of company truth

  SPOKES (domain depth, created as needed):
  ├── Tech depth    → evryn-backend/ARCHITECTURE.md
  ├── Current build → evryn-backend/BUILD-EVRYN-MVP.md
  ├── Agent build   → evryn-team-agents/BUILD-LUCAS-SDK.md
  └── (future spokes when a domain needs its own depth)

  HISTORICAL VAULT (_evryn-meta/docs/historical/):
  ├── master-plan-reference.md (frozen condensation of MP v2.3)
  ├── Background-The_Evryn_Master_Plan_v2.3.md (original, frozen)
  ├── Evryn_0.1_Instructions_Prompts_Scripts/ (v0.1 Custom GPT prompt)
  └── (requirements drafts stay in evryn-backend for now)
```

**Key principles:**
- The Hub is the ONLY living company-wide document
- Every agent loads the Hub every session — it's how they "know the company"
- If an agent's own notes contradict the Hub, that's a red flag to surface
- Spokes don't need to know about each other — they're reachable from the Hub
- Don't pre-build spokes — create them when a domain actually needs depth
- Historical docs go in `historical/` with first-line kill switch headers

### Document Lifecycle

```
MP v2.3 (founding vision, 2025) → frozen in historical/
  ↓ condensed into
MPR (comprehensive reference, 2026-02-11) → frozen in historical/
  ↓ synthesized with all sources into
THE HUB (living truth, loaded every session)
  ↓ spawns
SPOKES (domain depth, created as needed)
```

Once spokes exist, MPR is redundant (historical). Once Growth has its spoke, MP v2.3 is just poetry (glass case).

### Build Docs as DC's Source of Truth

BUILD-EVRYN-MVP.md must be self-contained for DC. No "go read this other thing." By the time DC opens it, every decision is already made. No interpretation, no guessing. Prototype analysis, schema docs, etc. get absorbed INTO the build doc — not referenced FROM it.

### Cross-Repo System-Level Cleanup (DEFERRED)

SYSTEM_OVERVIEW.md, company-context.md, and other scattered system-level docs need to be:
1. Read during Hub building (may contain unique details from a newer source)
2. Absorbed into the Hub
3. Retired/redirected after Hub is stable

NOT doing this until the Hub exists. But these docs may NOT be redundant — they were created from a newer doc that may have details not found in the MP.

### Internal/External Firewalling for Lucas

Lucas operates both internally (team coordination) and externally (via Evryn). The Hub is internal company truth. Any external-facing version must be:
- A derivative that references the Hub as authoritative
- Firewalled so that internal-only information cannot leak through the reference channel
- Lucas needs explicit architecture to keep 100% clarity on what's internal vs external

---

## Architectural Insights from v0.1 System Prompt

### Trust is a Story, Not a Score

Justin's correction: "She can't have a 'trust score' — she has to have a 'trust story.'"

Example: Justin's wife has sky-high integrity trust but zero task-completion trust (ADHD). A single trust number can't capture this. Trust must be:
- Multi-dimensional (context-specific)
- Structured as a JSON-like document in the user profile
- Some dimensions bleed across contexts (rapist = untrusted in ALL contexts — "willing to take from others against their will")
- Other dimensions are context-specific (great friend, terrible at deadlines)

**Architectural implication:** Trust is a first-class entity — not a column on a table, but a structured document. The matching engine, connection gating, and pricing all read from this trust story.

### Script-as-Skill, Not Script-as-Constraint

Justin's correction: The v0.1 "verbatim scripts" were a GPT-4 limitation workaround, NOT a core design principle.

Justin's ideal: Give Claude the scripts + explain WHY they work → Claude flows naturally while hitting the same targets.

Justin's onboarding philosophy (7 years as top salesperson, never missed a month):
- **Demonstrate value simply**
- **Keep cognitive load low**
- **No pressure**

This becomes an "Onboarding Skill module" — documented technique with rationale — not hard-coded dialogue. Claude should be able to riff beautifully while hitting the targets. Test in practice; adjust if needed.

Some specific things Justin DOES want said a particular way — but the goal is a smart agent that understands the technique and applies it fluidly, not a script-follower.

### Security Firewall Must Be Production-Grade

Justin's correction: The v0.1 devmode concept proves the IDEA of internal/external separation, but "this is much too weak a wall for production."

Design requirement: "Assume Evryn becomes the Trust Layer of the World and every single bad actor on planet earth is trying to hack her. This firewall needs to be 46-inch titanium."

This means: information firewalling by construction (not instruction), intelligence-first routing with double-check agents, and the front-facing Evryn is structurally blind to sensitive data — not just told not to look at it.

### "Stories Over Structures"

The "Dream with me" moment in the v0.1 prompt IS the design philosophy. When someone doesn't know what they want, Evryn doesn't offer categories or checkboxes. She invites imagination. The system can't rely on structured input — it needs to work with unstructured emotional/relational signal.

This is what "stories over structures" means architecturally: the matching engine, the user profile, the trust system — all must work with narrative data, not just structured fields.

### Growth is Conversationally Embedded

Every landing page should ideally just be "talk to Evryn." She pitches from the user's vantage point while demonstrating her own value in the process. Referral, pre-purchase, and ownership invitations happen inside the conversation, gated by timing and user excitement (Care Brain).

The growth engine IS the conversational agent (plus other channels), but the conversation is the primary vehicle.

### Dual-Track Processing

The v0.1 Smart Curiosity layer simultaneously:
1. Has a warm, human, emotionally intelligent conversation
2. Collects structured metadata for matching

This dual-track nature is fundamental. The architecture must support both tracks — the conversational layer and the analytical layer — running in parallel, with the analytical layer invisible to the user.

---

## What's Next (Post-Compaction)

1. MP vs MPR verification pass (side-by-side read, ensure coverage)
2. Move MPR + MP v2.3 to historical/ with proper headers
3. Build the Hub — synthesize everything (MP, requirements, prototype, v0.1 prompt, system_overview, company-context, this session's insights)
4. Update CLAUDE.md → point to Hub
5. Note in BUILD-LUCAS-SDK.md about Hub + internal/external firewalling
6. Cross-repo cleanup (DEFERRED until Hub stable)
7. BUILD-EVRYN-MVP.md rewrite
