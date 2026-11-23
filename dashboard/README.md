# The Evryn dashboard

> **Truncation check:** the last line of this file should read `FULL FILE LOADED`. If you don't see it, reload.

> **How to use this file:** a *reference* — what the dashboard is, how it is put together, and how it deploys. **The Map's design reasoning lives separately in [`MAP-DESIGN.md`](MAP-DESIGN.md)**; keeping the two apart is deliberate, so neither has to be read to understand the other.
>
> **Created 2026-08-19 (ACv).** The dashboard had no README for its whole life, which is why nobody could answer "how does this deploy" without reading `vercel.json`.

---

## What it is

Justin's operational view of Evryn — the one surface where he can see how the system is doing without reading a log or asking an agent. It is **auth-gated and for him**, not a product surface.

## Deploy — the one thing everybody needs to know

🔴 **Pushing `_evryn-meta`'s `main` to origin is the deploy — BUT ONLY WHEN THAT PUSH CARRIES COMMITTED CHANGES UNDER `dashboard/`.** *(Justin's correction, 2026-09-02.)* Vercel builds from the repo, so **the push is the gated act, not the merge** — a merge to local `main` is inert; a push publishes.

⚠️ **A DOCS-ONLY PUSH TO THIS REPO DEPLOYS NOTHING. It is an ordinary push.** **`_evryn-meta` is mostly documentation, so most pushes to it are in this category** — treating every one as a deploy decision stalls routine work and quietly trains agents to escalate things Justin does not need to see.

⇒ **Check before you treat a push as a deploy, rather than assuming either way:**
```bash
git diff --stat origin/main..main -- dashboard/    # empty = no-op redeploy of identical code
```
**Non-empty → it is a real deploy and Justin's gated act. Empty → push it like any other push.**

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

- **Tasks** *(tab one, the default; task T-142)* — a live, **read-only** view of the team task list (`public.tasks` in the Evryn Team project), so Justin can watch a task move the moment it changes.
  - **Endpoint:** `api/tasks.ts` (`GET /api/tasks`). It reads the same `TEAM_SUPABASE_URL` / `TEAM_SUPABASE_SERVICE_ROLE_KEY` as the Team Runtime tab, so it needs **no new env var**; with either unset it returns `{ configured: false }`.
  - **Read-only by construction:** GET only (anything else gets 405), one table, eight columns (`short_id, title, status, owner, addressed_to, needed_by, updated_at, closed_at`), and no write call anywhere in the file. Task bodies, links, RACI, tags, notes and sign-off fields never leave the server.
  - **What it returns:** every task that is not closed, plus tasks closed in the last 30 days. Each read pages by `short_id` until a page comes back empty, because PostgREST silently caps an unbounded read at 1,000 rows. If the page bound is ever hit, the response says `truncated: true` and the tab shows a warning.
  - **Refresh:** the tab polls every 15 seconds while the browser tab is visible and stops while it is hidden. It fetches at once when the tab is shown again, and never sends two requests at once. A header pinned to the top shows when the data was last updated, in Pacific time. If a poll fails, the last good data stays on screen with a stale warning.
  - **Tests:** run `npm test` from `dashboard/`. No install is needed: Node 25 runs the `.ts` tests directly against a fake database client. To prove those tests can fail, run `node test/mutation-controls.mjs`. It breaks temp copies of the endpoint fourteen ways and checks that the suite goes red each time.
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
