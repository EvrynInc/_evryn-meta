# The Evryn dashboard

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** a *reference* — what the dashboard is, how it is put together, and how it deploys. **The Map's design reasoning lives separately in [`MAP-DESIGN.md`](MAP-DESIGN.md)**; keeping the two apart is deliberate, so neither has to be read to understand the other.
>
> **Created 2026-08-19 (ACv).** The dashboard had no README for its whole life, which is why nobody could answer "how does this deploy" without reading `vercel.json`.

---

## What it is

Justin's operational view of Evryn — the one surface where he can see how the system is doing without reading a log or asking an agent. It is **auth-gated and for him**, not a product surface.

## Deploy — the one thing everybody needs to know

🔴 **Pushing `_evryn-meta`'s `main` to origin IS the deploy.** Vercel builds from the repo, so **the push is the gated act, not the merge.** A merge to local `main` is inert; a push publishes.

⇒ **That makes deploying the dashboard Justin's call, every time**, and it does not ride an ordinary commit go-ahead.

## Shape

**No build step.** `vercel.json` sets `buildCommand: ""` and `outputDirectory: public`, so whatever is in `public/` is what ships. There is nothing to compile and no bundler to reason about.

| Path | What it is |
|---|---|
| `public/index.html` | The whole front end — markup, styles and script in one file. Vanilla JS, no framework. |
| `api/*.ts` | Vercel serverless functions that read the databases and return JSON. *(Not yet documented per-endpoint — see Owed.)* |
| `vercel.json` | Deploy config. No build, no cache. |
| `package.json` | One dependency: `@supabase/supabase-js`. |

## Tabs

Tabs are plain `<button data-tab>` elements switching `.tab-pane` visibility. Adding one means adding a button, a pane, and its content.

- **The Map** *(in progress — destined to be tab one)* — the visual map of the product. See `MAP-DESIGN.md`.
- **Evryn Product** — product vitals, deliberately phone-first: health, recent activity, error count, spend.
- **Team Runtime** — the founding-team runtime.
- **Agents** — per-agent activity and spend.

⚠️ **The Map is large enough that it should ship as its own `public/*.js` + `public/*.json` pair loaded by its pane, rather than as more markup inside an already-2,000-line `index.html`** — which also makes its data machine-refreshable.

## Known issues

- 🔴 **Month-to-date spend reads LOW.** The query that totals it has no page size, so at real volume the monthly figure silently understates. **Treat it as a floor, not a total** until fixed. *(Tracked as SPRINT Step 115.)*
- **Four of the twelve work-item statuses render as an unstyled gray pill**, identical to the deliberate gray used for *declined* — so an item still being worked looks the same as one that was passed on. *(Tracked as SPRINT Step 107.)*

## Owed

- Per-endpoint documentation for `api/*.ts` — **not written, because ACv has not read those files** and would rather leave a gap than guess at one.
- The Map's port from prototype to tab one.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
