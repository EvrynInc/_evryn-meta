# Full Startup Context Cascade — Website (`evryn-website`)

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload or read in sections until you confirm the complete file.
>
> **How to use this file:** the **per-build full cascade** for doing *or directing* build work on the **marketing website** (`evryn-website`, evryn.ai — Next.js on Vercel). It is the `evryn-website` branch of `_evryn-meta/CLAUDE.md`'s cascade router: **load the Light Startup Context Cascade (in CLAUDE.md) first, then this.** A **reference** (a precise load list), not an explanation. **The universal full-cascade PRINCIPLES** — "when Justin calls the full cascade it is non-negotiable — do not trim it," verify-at-claim-is-additive, which-state-did-you-load — **live in CLAUDE.md and govern this load; this file is the website FILE LIST + contract map those principles apply to.**
>
> **Owner: AC.** Edits need Justin's approval (propose first). This site is built by **DC** (its own `CLAUDE.md` is a redirect: *"Stop. Do not build here — use DC from `evryn-dev-workspace`"*), so in practice this cascade is what **AC loads to direct a DC website build**, and the file set AC hands DC.

---

## Why this cascade is SHORT — and where its one subtlety lives

**The website is the ONE non-agentic system in the fleet — so, uniquely, it has NO identity half.** The sibling cascades (`full-product-cascade.md`, `full-team-runtime-cascade.md`) are built around the universal rule that *every agentic system has TWO halves — code AND an identity/judgment layer that programs an LLM's behavior* — and their whole discipline is refusing to under-load that second half. **This system has no such half at all:** the website is Next.js/React rendered to static HTML on a CDN — no LLM, no agent, no prose that programs a runtime. So the two-halves rule doesn't shrink here; it simply **doesn't apply** — and that is a *fact to state*, not an omission to hunt for. If you arrive from the product/team cascades reflexively looking for "the identity files," there aren't any; don't go looking.

**And it is NOT wired to the product runtime.** No live DB/API contract with `evryn-backend`, no import of `src/**`, no product-Supabase call. The waitlist form posts to **HubSpot** (via `app/api/waitlist/route.ts`), gated by **Cloudflare Turnstile** — that's the whole backend surface. *(Verified against the runtime: `technical-vision.md`'s system-landscape diagram draws EVRYN WEBSITE and EVRYN BACKEND as separate boxes with no arrow between them, and `BUILD-EVRYN-MVP.md` states it outright — "Vercel serves websites; Railway runs background workers. Complementary, not redundant.")* So — unlike the product or team-runtime cascades — **this cascade deliberately does NOT pull the Evryn runtime.** Loading `evryn-backend/src` for a copy tweak or a layout fix would be noise. *(If you catch yourself reaching for the runtime here, stop: the site doesn't call it.)*

**The one real tie is BRAND TRUTH, and it DRIFTS.** The site is a direct, first-person expression of *who Evryn is* — the hero poem, the three pillars, and especially the *"I promise…"* section, which maps almost line-for-line onto Evryn's trust-arc (pricing, privacy, aligned incentives). That voice and those claims are **owned by the Hub + the product's identity files**, and they evolve. So the website's dependency isn't a *data* contract that would throw an error when it breaks — it's a **coherence** contract that goes **silently stale**: the identity/positioning shifts, and the marketing copy keeps saying the old thing with nobody noticing.

**⇒ How to hold this cascade (the "stable spine + drifting brand-surface" shape):**

- **The STABLE SPINE — must-load, in full, never trim** — is the website's OWN codebase + docs (§1 below). It changes only when *you* change it. Treat it exactly like any must-load set.
- **The BRAND-COHERENCE SURFACE (§2) DRIFTS and is owned elsewhere.** This doc names *where the current brand truth lives*, but never claims to *be* it — so you **re-read those sources live** whenever the site's copy, claims, or positioning are in scope, rather than trusting a snapshot here. The humility is scoped to this surface **only** — it is **never** license to skip a load. "Re-verify against the live source" is a step you *add*, not a load you *drop*. If you're only moving a `<div>`, you may not need §2 at all; if you're touching a *word Evryn says*, §2 is required reading and you check it against the live identity files.
- **`Last brand-surface reconcile:` marker (below).** If it's gone stale, that's your signal the brand truth may have moved under the copy — re-reconcile before trusting §2's framing, and update the date + any drifted pointer in the same pass.

**`Last brand-surface reconcile: 2026-07-21`** *(AC — independent second-pass verification: authored fresh from a full product-runtime + website load, then reconciled against the prior draft. §2 sources re-confirmed against the live Hub + identity files; §1's `next.config.ts` redirects, the `demo.html` provenance, and the Turnstile env vars confirmed against the live files.)*

---

## §1 — The STABLE SPINE (load in full for any real website build; this does not drift)

The site's own repo. All paths are in `evryn-website/`. **Enumerate live** (`git -C evryn-website ls-files`) rather than trusting this list frozen — the tree grows.

- **`README.md` + `docs/ARCHITECTURE.md` + `docs/DECISIONS.md` + `docs/SETUP.md`** — the site's design system (palette, Karla type, "calm/spacious/trustworthy" voice), page structure, tech stack, deploy model, backlog, and the running decision log. `docs/ARCHITECTURE.md` is the site's own source-of-truth reference; **`app/page.tsx` is the source of truth for the actual copy** (ARCHITECTURE says so — don't trust a paraphrase of the copy).
- **`CLAUDE.md`** — the DC-redirect stub. Read it so you know the build-here-via-DC rule (and don't try to build in-repo without DC's context).
- **The app + components** — `app/page.tsx` (landing copy + layout, the load-bearing file), `app/layout.tsx` (fonts, metadata, the Organization JSON-LD, Vercel Analytics), `app/api/waitlist/route.ts` (Turnstile-verify → HubSpot submit — the one server route), `components/waitlist-form.tsx`, `components/ContactLink.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/globals.css`, the image/SEO routes (`app/opengraph-image.tsx`, `app/twitter-image.tsx`, `app/banner/route.tsx`, `app/profile-image/route.tsx`, `app/sitemap.ts`, `app/robots.ts`). Load the ones your task touches in full; skim the rest for shape.
- **Build/deploy config** — `package.json` (Next.js 15 / React 19 / Tailwind / `sharp`), `next.config.ts` (note the `/demo` → `/demo.html` rewrite and the `/privacy-policy` → `/privacy` permanent redirect), `tailwind.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `.env.example`. **Deploy = Vercel auto-deploys from `main`** (there is no separate deploy step; a push to `main` ships to evryn.ai). ⚠️ **This is the OPPOSITE of the product runtime** — `evryn-backend` is Railway with **auto-deploy OFF** (a merge to `main` does nothing until a deliberate `railway up`), whereas here the **push IS the deploy**. Don't carry the product's "merge ≠ deploy" mental model into this repo. Env vars: `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (also set in the Vercel dashboard for prod).
- **`public/`** — `seed-of-life.svg` (the hero mark), `favicon.svg`, `logo-square.*`. Note **`public/demo.html`** is a *static, self-contained v0.3 wireframe prototype built for Fenwick* (its own `<title>` reads "Evryn v0.3 — Wireframe Prototype v2 for Fenwick") — reached at `/demo` via the `next.config.ts` rewrite. It is NOT a live "talk to Evryn" embed and NOT wired to the backend (inline HTML/CSS/JS screen-switcher, no API calls); treat it as a mockup, not a runtime tie.

## §2 — The BRAND-COHERENCE SURFACE (drifts; owned elsewhere; RE-READ LIVE when copy/claims/positioning are in scope)

The site renders brand truth it doesn't own. When your task touches *what the site says about Evryn* — any copy change, a new section, a claim, the voice — **read the current source before you write, because it moves:**

- **Brand + positioning + business model** → `_evryn-meta/docs/hub/roadmap.md` (the Hub) and `_evryn-meta/docs/hub/technical-vision.md`. The pillars and the value prop descend from here.
- **Evryn's VOICE + the exact trust/pricing claims** → the product's identity files, which are the authoritative wording the site's first-person copy echoes: `evryn-backend/identity/public-knowledge/company-context.md` (what Evryn says she is / where she came from — public-safe by construction), `evryn-backend/identity/internal-reference/trust-arc-scripts.md` (the privacy / pricing / aligned-incentives beats the *"I promise…"* section mirrors — e.g. "you don't pay a penny unless a connection genuinely works," "you decide the price," "I only connect people I trust"), and `evryn-backend/identity/core.md` (the register — warmth, "stories over structures," "no dark patterns"). ⚠️ **These are the live wording of load-bearing *claims* (pricing model, privacy posture, "only connect people I trust"). If a claim on the site diverges from these — or from what's actually true today — that's a real defect, not a style nit.** *(Note: `company-context.md` carries an explicit INTERNAL-ONLY block about future equity/ownership — never let that surface into site copy.)*
- **Legal pages must track the finalized legal docs** → `_evryn-meta/docs/legal/` (Terms-and-Privacy). The `docs/ARCHITECTURE.md` backlog flags new ToS/Privacy pending from the legal team — a Terms/Privacy edit is a *route-through-legal* change, not a freehand copy edit. Confirm against the current finalized docs.

**External-service touchpoints (stable-ish, but verify creds live):** **HubSpot** (waitlist CRM — the portal + form GUID are hardcoded in `app/api/waitlist/route.ts`; a form change is a HubSpot-side coordination), **Cloudflare Turnstile** (captcha), **Vercel** (host + Analytics). No product-DB, no `evryn-backend` API.

---

## The discipline (why the split is drawn where it is)

**§1 is a normal must-load — you don't trim it.** The site is small, but "small" is not "skip the codebase"; a copy change still wants `app/page.tsx` and the design-system docs so you write in the site's actual voice and don't break its structure.

**§2 is where the humility lives — and it is *additive verification*, never subtraction.** The brand surface is genuinely owned by the Hub and the identity files, so a snapshot in this doc would rot; the honest move is to point at the live source and read it at the moment it matters. That is a *requirement to re-read*, not permission to under-load. The failure this guards against is the opposite of under-loading: it's *stale confidence* — shipping copy that quietly contradicts what Evryn now is. When in doubt about whether a change touches the brand surface, it does — read §2.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
