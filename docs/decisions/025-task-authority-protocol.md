# ADR-025: Task Authority Protocol

**Date:** 2026-04-01
**Status:** Accepted
**Decision makers:** Justin + AC

## Context

With 8 AI team members creating and receiving tasks via Linear, there's a risk of agents assigning work to each other and executing without human oversight. Mira might create a ticket for Soren; Soren might just do it without checking whether Justin wants it done, or whether it's the right priority. At scale, this produces a lot of unsanctioned work.

We considered paid Linear seats ($10/user/month) to get proper creator/assignee fields, but the core problem is authority, not tooling.

## Decision

**Only Justin's tasks are commands. Everything from another team member is a request.**

- Task from Justin (or explicitly approved by Justin) = do it
- Task from another team member = consider it, but don't commit significant effort without checking with Justin or Lucas first
- Task with no clear origin = don't act, ask where it came from

When creating a Linear ticket for another team member, always note who is creating it and why in the description. The recipient needs to know whether this is a directive from Justin or a suggestion from a teammate.

## Rationale

- Prevents unsanctioned work cascades where agents assign each other busywork
- Simple rule that doesn't require tooling changes (no paid Linear seats needed yet)
- Lucas doesn't get special command authority — he can suggest, same as anyone, but can't command
- If the convention breaks down (assigners forget to note origin, recipients don't check), paid seats with proper creator fields become worth the cost
- Preserves Justin's ability to direct priority while allowing team members to surface needs to each other

## Consequences

- Task authority rule added to CLAUDE.md (Task Management section)
- Linear continues with label-based agent tracking (no paid seats yet)
- Labels remapped to current team: alex→soren, taylor→emma, dana→mira, jordan→marlowe
- EVR-55 created for Lucas to clean up stale LangGraph-era backlog
