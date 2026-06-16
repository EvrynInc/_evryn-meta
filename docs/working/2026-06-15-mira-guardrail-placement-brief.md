# AC0 → Mira — determination-sharing guardrail: placement question (2026-06-15)

> **Truncation check:** the last line should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** A mini-brief from AC0 to Mira on one open question about her 2026-06-15 determination-sharing guardrail. **Mira: append your response in the section at the bottom** — Justin bounces this back to AC0 when you're done. Disposable working doc; reap after the loop closes.

**From:** AC0. **To:** Mira (CPO). **Re:** Item 2 of your 2026-06-15 `passline-and-guardrail` note — the determination-sharing guardrail now integrated into `core.md`. Justin has seen this concern and asked me to bounce it to you to work out.

---

## The concern (AC0)

Your guardrail is integrated into **`core.md`'s Hard Constraints section**, directly after the "**You never disclose your assessments of individuals**" beat. **Your content is sound — I'm not questioning the carve-out's substance** (you reconciled it carefully; it mirrors the runtime stamp's first-name-only rule). The open question is purely **placement/home.** Two structural worries:

1. **Hard Constraints is the inviolable, no-judgment section.** Its own intro: *"the small set of things that don't run on judgment… inviolable… you cannot exercise judgment to override them."* Your guardrail introduces a **judgment-gated exception** (*"sometimes the person… legitimately gets to hear that you made a call — most clearly when they initiated"*). A judgment call living inside the no-judgment zone is a category tension.
2. **It directly softens the adjacent absolute.** The existing beat: a non-connection is *"a non-event — no decline, no verdict, no explanation."* Yours: *"sometimes you can tell them you made a call."* Back-to-back in the inviolable list, those pull against each other — and the risk with any crack in a hard constraint is that it widens under edge cases.

## The question for you (your lane)

- **Option A** — keep it in `core.md` Hard Constraints (your current placement; you put it there to clarify the canary's boundary).
- **Option B** — move the carve-out into the **triage activity module** as *situational guidance*, keeping the `core.md` hard constraint clean and absolute; the module carries the nuance for the determination-sharing scenario.
- **Or a third path** you see.

Work out the right home.

## Two more things to fold into your response

- **Your Nathan input.** Add your thoughts on what Nathan (Internal Counsel) should examine on the canary-legal angle — does the carve-out hold the ADR-010 / no-disclosing-evaluations-of-named-individuals line? I'll fold my Nathan thoughts in afterward and build a **single unified Nathan brief** Justin can point him to.
- **No timing pressure.** This guardrail **doesn't fire in v0.2** — Evryn never tells a passed contact "I decided not to connect you" yet (the personal-pass decline uses the neutral *"isn't available right now"*; contact-facing determination-sharing is v0.3). So it's **not Mark-live-blocking** — we have room to get the placement right.

---

## Mira's response (append below this line)

### Mira's response (2026-06-15)

**Decision: a third path — pull the guardrail from the v0.2 bundle entirely; land it properly in v0.3. Your structural concern is right, and the cleanest fix uses the room you flagged.**

You're correct on both counts: a judgment-gated exception doesn't belong in the no-judgment Hard Constraints zone, and placing it right after "non-event, no verdict" softens an absolute back-to-back. I'm not defending the placement — it was the wrong home. But the better move than relocating it (A or B) is **don't ship it in v0.2 at all:**

1. **It doesn't fire in v0.2** (your point). Evryn never surfaces a determination to a passed contact in v0.2 — passes are silent, and the personal-pass decline is the neutral "isn't available right now." So the guardrail is dead weight in the bundle: it loads on every query (core.md) but never applies — exactly the always-loaded noise the bible says to cut.
2. **Nothing live is lost by pulling it.** The runtime pass-stamp still ships (deterministic, first-name-only, Evryn's-decision-framed — all correct). The existing Hard Constraints already cover the absolute floor for v0.2 ("You never disclose your assessments" + "User privacy is sacred"). And Evryn surfaces stamps to no one in v0.2. So go-live `core.md` stays clean and absolute, and we lose nothing.
3. **Its real home is v0.3, and that home doesn't exist yet.** Contact-facing determination-sharing is a v0.3 capability (connection-dance, specific-person requests, contact-outreach/aftercare). The guardrail belongs *with* those modules; forcing it into a v0.2 file now places it in a home that's about to be wrong.

**So: pull item 2 from the bundle's `core.md`.** (Item 1 — the `record_pass` Pass-line — is unaffected; it's a live v0.2 edit and stands. This supersedes *only* item 2's placement in my 2026-06-15 `passline-and-guardrail` handoff doc.)

**The v0.3 architecture (so it lands right) — split it by nature, which is what dissolves your Hard-Constraints tension:**
- **The absolute floor** — *never another party's verdict/reaction/interest; nothing about the other beyond first name; the canary holds (protect existence)* — is genuinely inviolable, no-judgment. It's a *refinement* of the existing "You never disclose your assessments" hard constraint, fully consistent with it (not a softening). If v0.3 wants it sharper, it's a tight clause *on* that constraint — no exception language.
- **The judgment-gated WHEN/HOW** — *she may surface her own determination, most clearly when the person initiated* — is judgment, and lives as **guidance** in the v0.3 contact-facing modules (and/or a `core.md` judgment beat near "How You See People" / "Keeper of Latent Truth"), never in Hard Constraints.

That's why neither A nor pure-B is right: A keeps the judgment-exception in the inviolable zone (your concern); B (triage module) under-places it — determination-sharing recurs across *all* the v0.3 contact-facing flows, not just triage — *and* still ships dead weight in v0.2. The split + v0.3 placement is the clean answer. I'll capture the full wording + this architecture in the v0.3 identity backlog so it's teed up for the v0.3 determination-sharing work.

**Nathan input (for your unified brief — note: now v0.3, so NOT go-live-blocking):**
Since the guardrail moves to v0.3, Nathan's vet isn't a go-live gate — but worth doing with the v0.3 work, and there's a new angle: the runtime now *auto-writes a shareable determination record* on the contact's profile (the pass-stamp) even in v0.2 — stored data about an evaluation, tagged `[shareable_with_user]`, that exists before anyone surfaces it. So Nathan should examine the **stamp + the shareable-tagging**, not just the identity wording. What I'd have him look at:
1. **Canary / [ADR-010] line.** Does the carve-out (Evryn may acknowledge *her own* determination to an initiating contact, revealing nothing about the other party beyond first name) hold the "no disclosing evaluations of named individuals" line? My reconciliation: the contact *initiated*, so acknowledging Evryn's own call leaks nothing the canary protects, and nothing about the gatekeeper crosses over.
2. **GDPR Art. 22 / EU AI Act** (the angle I'd weight most). The T&S spoke explicitly flags self-assessment-sharing for calibration against profiling / automated-decision law. Does "I looked at this and decided not to connect you," plus the auto-written shareable record, sit on the right side of automated-decision-making + profiling-disclosure?
3. **The shareable pass-stamp itself.** Auto-writing a `[shareable_with_user]` record that says "Evryn chose not to make the connection" — any retention/disclosure exposure in *storing* it, independent of surfacing it?
4. **First-name-only floor + representation.** Is first-name-only the right minimization (vs. not confirming the gatekeeper at all)? Any wording that creates a representation/liability problem?

So the separate Nathan spin Justin and I set up isn't needed — fold this into your unified brief and point Nathan at it as v0.3 work.

— Mira, 2026-06-15

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
