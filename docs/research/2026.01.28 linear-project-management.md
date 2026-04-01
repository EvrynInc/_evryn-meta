# Linear — Project Management Research

*Last updated: 2026-01-28*

---

## Decision

**Free tier**, one team, labels for agent assignment + departments. No agent user accounts — agents use API via single key, OAuth `actor=app` for attribution. Keeps cost at $0 regardless of seat count.

---

## Free vs Business

| Feature | Free | Business ($16/mo/seat) |
|---------|------|----------------------|
| Teams | 1 | Unlimited |
| Issues, projects, cycles | Unlimited | Unlimited |
| API access | Yes | Yes |
| Timeline/Gantt | Yes (project-level only) | Yes |
| Private teams | No | Yes |
| Guests | No | Yes |

Key difference is teams. One team with labels works fine for now.

---

## Workflow States

Default Linear workflow (kept as-is):

`Backlog → Todo → In Progress → In Review → Done → Canceled → Duplicate`

Triage is handled by Linear's built-in triage inbox (not a workflow state). AI triage intelligence requires Business tier — not available on Free.

## AI Features

- **Triage Intelligence, auto-labeling:** Business/Enterprise only
- **Basic AI suggestions in composer:** All plans including Free
- **API access:** All plans — our agents use API, not Linear's AI features

---

## Labels

**Active labels (after cleanup):**
- **Department:** Engineering, Product, Operations, Growth, Executive
- **Agent:** agent: alex/thea/taylor/dana/dominic/jordan/nathan/lucas
- **Status:** Blocked (red), Bug (red), Feature (purple), Improvement (blue)

**Removed during import cleanup:** Migrated, priority: *, category: *, evryn-team-agents, needs-triage, CTO. Priority mapped to Linear's native priority field. Categories were redundant noise.

**Assignment model:** Hybrid. Justin uses native assignee field (enables independent filtering by assignee + department). Agents use `agent: x` labels (queried via API). No `assignee:` labels — avoids confusion between the two systems.

**Why not create agent accounts:** Cost cliff ($128/mo at Business tier with 9 seats), 250 issue limit on Free gets consumed 9x faster, password/session management overhead. Labels + OAuth covers the need.

---

## Upgrade Path

Moving to 5-team model (Engineering, Product, Operations, Growth, Executive) is straightforward:
- Create teams
- Bulk move issues using label → team mapping
- API scripting available for automation

---

## GitHub Integration

- Connected **only** `_evryn-meta` repo for one-time import
- 46 issues imported (42 open, 4 archived), no sync enabled
- **Revoke access** after confirming import looks good
- Re-grant selectively if needed later

---

## API Access

- GraphQL API
- Personal API key ("Evryn Automation") — used by both Claude Code and agents
- OAuth `actor=app` mode doesn't consume seats
- Split into separate keys later if need to revoke agent access independently

---

## Gantt/Timeline

Project-level only, not issue-level. Plan projects (not individual tasks) on the timeline.

---

## Linear MCP Server

Available for agent integration — could let agents create/read their own issues. WATCH for now.

---

## Decision Log

| Date | Decision | Context / What Changed |
|------|----------|----------------------|
| 2026-01-28 | **Free tier, not Business** | JoinSecret coupon broker was $149, not a real deal. Free gives unlimited issues, API access, 1 team, 250 members. Business only needed for multiple teams, private teams, guests. |
| 2026-01-28 | **One team with labels, not 5 teams** | Originally planned 5 teams (Engineering, Product, Operations, Growth, Executive) on Business tier. Switched to 1 team + department labels on Free. Cross-team work is easier with labels. Upgrade path is straightforward if needed. |
| 2026-01-28 | **Originally planned agent-to-team mapping** | Engineering: Alex. Product: Dana. Operations: Taylor, Nathan. Growth: Jordan. Executive: Lucas, Thea, Dominic. Preserved here for reference if we move to 5-team model. |
| 2026-01-28 | **Generic workflow, not per-domain** | Considered domain-specific states (e.g., "Deployed" for engineering, "Shipped" for product). Chose generic workflow so all agents share the same mental model. |
| 2026-01-28 | **No agent user accounts** | Considered creating Linear accounts for each agent (they have real emails). Decided against: cost cliff at Business tier ($128/mo for 9 seats), 250-issue Free limit consumed 9x faster, password management overhead. Labels + OAuth covers the need. |
| 2026-01-28 | **Removed GitHub label noise** | Deleted Migrated, priority: *, category: *, evryn-team-agents, needs-triage, CTO labels. Mapped priorities to Linear's native priority field. Categories were redundant in Linear's richer filtering. |
| 2026-01-28 | **GitHub access: import then revoke** | Connected only `_evryn-meta`, imported 46 issues, no sync. Plan to revoke after confirming import. |
| 2026-01-28 | **Hybrid assignment model** | Justin uses native assignee field (enables filtering by assignee + department as independent axes). Agents use `agent: x` labels (queried via API). No `assignee:` labels needed — avoids confusion between the two systems. |
| 2026-01-28 | **Department labels on all issues** | Engineering (Alex issues), Operations (Nathan), Executive (Dominic, Lucas). Every issue now has both an agent label and a department label. |
| 2026-01-28 | **Dashboard GitHub Issues tab removed** | Progress tab with GitHub Issues widget removed from dashboard. Linear is now the sole project management UI. Dashboard remains for agent monitoring (status, spend, activity). |
