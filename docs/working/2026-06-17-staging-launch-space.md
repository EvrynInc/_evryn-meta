# Test Launch Space (Staging) — Decision Writeup (AC0, 2026-06-17)

> **How to use this file:** AC0's answer to Justin's question — *"how do we know all the interlocking pieces really work as a whole, short of fuck-around-and-find-out in production? Do we have a test launch space? Shouldn't we, before Mark's live?"* This is a decision aid: the gap, the design, the cost, and the call surfaced in Justin's 3-part form. Not yet a build spec — gates on Justin's decision (new infra = major call).

## Justin's instinct is right, and the timing is right

**The gap, plainly:** today there is **no full-system staging runtime** — no *running* Evryn (Railway process + Slack + Gmail + DB) pointed at non-prod where the whole interlocking system gets exercised end-to-end *before* prod.

What we *do* have, and why each is insufficient on its own:
- **Dev database** ("Evryn Product — Dev", a faithful mirror) — but it's reached **only by admin tooling**; the *runtime* never points at it. It's for migration rehearsal + tooling-level QC checks, not a running system.
- **Test scripts** (`tests/*.ts`) — component-level (a function does X), not "the whole system behaves right together."
- **Railway build gate** — catches *compile/typecheck* failures, not *behavioral* ones.
- **QC review** — reads the code; doesn't *run the assembled system*.
- **Historical "integration testing"** (Phases 2–6) = run against **prod with synthetic data, then wipe**. That is *literally* the FAFO-in-production pattern — fine while the DB held only test data; **impossible once Mark's data is in prod.**

**Why it becomes a hard requirement the moment Mark's live:** pre-Mark, a bad deploy is recoverable (tweak live). Once he's forwarding, it isn't — and *every future change* (the whole v0.3 build, ongoing v0.2 maintenance) needs a safe place to prove out as a whole. So a staging launch space isn't polish; **it's the thing that makes shipping-while-live safe.** It should exist before Mark.

## The design — a parallel staging runtime

A second, isolated full stack that mirrors prod's *shape* but can't touch prod's *data* or *people*:

| Piece | Prod (today) | Staging (proposed) | Setup work |
|-------|--------------|--------------------|------------|
| **Compute** | Railway service → `main` | A second Railway service/environment, deploy target for a release candidate before prod | New service + env vars |
| **Database** | Evryn Product (West Coast) | **The existing dev DB** ("Evryn Product — Dev") — already a seeded mirror | Point the staging runtime's `SUPABASE_URL`/`_SERVICE_KEY` at dev (today only *tooling* uses dev) |
| **Inbox** | polls `evryn@evryn.ai` | a **test inbox** (`systemtest@evryn.ai` exists for gatekeeper roleplay — *verify it has its own Gmail OAuth a runtime can poll*, or stand up `evryn-staging@`) | OAuth creds for the test inbox |
| **Slack** | Evryn app → `#evryn-approvals` + dev/emergency apps | a **separate staging Slack app + channels** so staging can't ping the real operator channels | New Slack app/bot + channels |
| **Send safety** | `SEND_ENABLED=true` | a **recipient allowlist** (send real email, but only to test addresses) — so we test *real* rendering/threading without any risk of emailing a real person | Revive a real `TEST_RECIPIENT`/allowlist mechanism (the old one is dead config) |

**The validation flow it buys us:** assemble the bundle → deploy to **staging** → run a full **create-from-zero + Phase-6-style live-fire** end-to-end (onboarding → forward → triage → draft → approve → send, against the mirror DB, emailing only test addresses) → confirm the *whole interlocking system* works → **promote the *exact same build* to prod.** That's the difference between "QC says the code looks right" and "we watched the assembled system do the real thing."

## THE MAJOR DESIGN CALL — surfaced for Justin

> **1. The call:** Do we stand up a full staging runtime before Mark, and does *this* hardening bundle gate on it?
>
> **2. What I chose (recommendation):** **Yes — stand up staging as an immediate near-term must-have** (it's mandatory the moment Mark's live anyway, so build it now and make this bundle its first real exercise). **But do NOT hard-gate *this* bundle's deploy on staging existing** — pre-Mark grace means a bad deploy is recoverable. So: design + begin staging in parallel (likely an **OC** ops spin + my design); if staging is ready in time, this bundle is its first validation; if not, fall back to a create-from-zero integration pass before trusting the bundle, and staging lands right after — *before* Mark forwards regardless.
>
> **3. Top alternatives + why not:**
> - *Keep doing "prod + synthetic data + wipe":* zero new infra, and it's what got us through Phase 6 — but it's the exact pattern that dies the instant Mark's data is in prod, and it builds no muscle/infra for the post-live world we're about to enter. A stopgap, not an answer.
> - *Local-only staging* (run the process locally against dev DB + test inbox/Slack): cheaper (no second Railway service), genuinely useful for a dev loop — but it's not a faithful deploy rehearsal (local ≠ the Railway container/env that actually runs prod), so it wouldn't catch deploy/env-shaped failures. Good as a *complement*, weak as the *gate*.
> - *Defer staging to v0.3:* the cheapest today, the most expensive the first time we need to ship a fix while Mark's live and have nowhere to prove it. Rejected.
>
> **Open setup questions to resolve at build:** does `systemtest@` have a pollable OAuth inbox or do we stand up `evryn-staging@`? · staging Slack app naming/channels · the send-allowlist mechanism (revive `TEST_RECIPIENT` as an allowlist) · whether staging is a separate Railway *service* or *environment*. **Owner:** likely **OC** (ops/infra) for the standup + **AC** for the design + the validation playbook; flag to **Soren** as an architecture touch.

## BEFORE you spin OC — make him competent first (Justin's directive, 2026-06-17)

Justin's instruction: *"double-check OC's CLAUDE.md, make sure you fully trust him with this; if not, add what you need. Steal from DC and QC's CLAUDE.mds — they have processes that might inspire OC-specific protocols, so OC is (1) as competent as possible day one and (2) has a process for getting better every day."*

**AC0 already vetted OC's CLAUDE.md (`evryn-ops/CLAUDE.md`, read 2026-06-17) — assessment:** It's a genuinely solid SRE manual — clear identity, hard-block-on-deploy authority, a 10-principle ops mandate, an orient-order, an ops-review checklist, what-to-monitor, autonomous-work protocol, mailbox comms. **Competent to reason about ops.** But it has three gaps you (AC4) must close **before** spinning OC for the staging build (this is an AC-owned runtime-CLAUDE.md edit — authorized by Justin's directive above):

1. **Stale infra facts (fix):** (a) it tells OC to post to `#dev-alerts` via **bash `curl`** (lines ~159–163) — but on Windows that mangles/prompts; switch the instruction to **Node `fetch`** (match the AC pattern). (b) it describes `#emergency-alerts` as *"not yet wired… Future: Twilio SMS (v0.3)"* (line ~157) — **stale**: it shipped 2026-06-16, Slack-based, `notifyEmergency()`. Correct it (and note M1 Stage 2 is in flight, AC5).
2. **No explicit "get better every day" loop (add — Justin req #2):** OC has the *seed* (principle 8: write runbooks/incident notes), but no structured improvement loop like QC's pattern-promotion or DC's discipline accumulation. **Add an OC-specific loop** — steal the shape from QC's "Patterns This Role Watches For" + AC0-promotes-QC's-patterns mechanism (a fresh OC subagent has no carryover, so its standing operational patterns must persist somewhere it auto-loads): e.g. an "Operational Patterns This Role Watches For" section OC accumulates into (via AC), plus a tight per-session "what did I learn that the next OC should know" → runbook/incident discipline. Mirror DC's "tests are part of done" rigor into "a fix isn't done until its runbook entry + verification exist."
3. **Day-one staging competence (brief, don't necessarily bake into CLAUDE.md):** OC's manual is about *monitoring/operating the existing prod system*, not *standing up a new environment*. Give OC the staging-specific task context in the spin brief (the table above): create the Railway service, wire env to the dev DB, test inbox, staging Slack, send-allowlist. His SRE framing is adequate to reason about it once briefed.

**Process for the augmentation (Justin's directive, 2026-06-17):** don't just edit it yourself — **spin an OC subagent to weigh in on its own CLAUDE.md** (OC has the best view of what it needs to be competent at its own job; ask it where its manual leaves it under-equipped for standing up + operating staging, and what its "get-better-every-day" loop should look like). **But YOU (AC4) apply editorial judgment before codifying anything** — the agent weighing in on its own identity is input, not authority (it can bloat or misdirect its own manual; the AC is the gate, same as AC promoting QC's patterns rather than QC self-writing). Synthesize OC's input + AC0's vetting above + your own read → then make the CLAUDE.md edits.

**Forward direction (Justin, for awareness — not today):** next week Justin makes the ops team autonomous (Railway SDK agents); **OC is a top candidate to take the middle-of-the-night calls and fix-before-morning autonomously** (the "fixed this overnight, boss" model). OC's CLAUDE.md already anticipates this (its "Trajectory" note). When you augment OC, write the get-better loop + competence so they're a clean foundation for that autonomous subagent — don't add anything that assumes a human is always in the loop.

## Why I'm not building it yet
New infra + a new external surface + cost = a major call that's yours to make (per the design-call protocol). I've designed it to decision-readiness and I'm holding the standup for your decision. It does **not** block today's lanes (they build to QC-GO on branch regardless) and it does **not** block M1 — it only shapes *how* we validate the convergence bundle.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
