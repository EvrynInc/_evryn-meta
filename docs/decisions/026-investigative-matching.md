# ADR-026: Investigative Matching — Trust-Bounded Constraint Flexibility

**Status:** Accepted
**Date:** 2026-04-05
**Deciders:** Justin, AC2

## Context

Evryn's matching pipeline starts with structured pre-filters — constraints the user has stated (location, profession, etc.) that gate which candidates enter the pool. The technical-vision spoke says: "Hard stops *unless flagged otherwise*: a user who says 'only Seattle' but mentions dreaming of SF might be prompted to reconsider for an exceptional match."

But sometimes Evryn's standard search won't find the right match because a user's stated constraints don't fully capture what they need. A woman says she wants a soulmate in Seattle and won't move. But Evryn knows from other conversations that she loves San Francisco — the Seattle rigidity might be partly about an ex, or it might be genuine. If the geo-filter cuts strictly at Seattle, a perfect match in SF never enters the candidate pool.

A great human matchmaker would widen the search based on what she knows about the whole person. The question: how does Evryn do this while respecting the person's autonomy and self-direction?

The trust-and-safety spoke frames the relationship: "Evryn takes the wheel so you can relax, but you're ultimately the one in control. You can change direction, slow down, even go dormant." Evryn drives — she exercises judgment, takes initiative, surprises you — but you can always redirect.

## Decision

### Evryn may widen searches based on her understanding of the whole person

When standard matching returns nothing that feels right AND Evryn's understanding of the person suggests a stated constraint may be softer than it appears, she can run additional search passes with widened parameters. This is more expensive (multiple search passes, more Opus evaluations) and should be triggered deliberately, not routinely.

Over time, as Evryn's matching intelligence matures, she may also genuinely "stumble across" someone — a candidate who surfaces through another user's search or a new onboarding that rings a bell. When that happens, she should be able to bring it to a user even if it doesn't perfectly fit their stated constraints: "Hey, this isn't exactly what we talked about, but I came across something and I thought maybe — just maybe — you'd be interested."

### The reasoning lives in the story, not in structured fields

Evryn's observations about why a constraint might be softer than stated — the full reasoning, not just "location: flexible" — belong in the story. The structured fields (`profile_jsonb.structured`) always reflect what the user has actually said. If the user said "Seattle only," `structured.location` says Seattle. The story might say "She's said Seattle only, but she lights up when talking about San Francisco — I suspect the rigidity is more about her ex than about geography." The structured field is what the user stated; the story is what Evryn understands.

### Boundary-crossing candidates are always surfaced through conversation, never silently acted on

When investigative matching finds someone outside a stated constraint, Evryn doesn't present it as "here's a match that breaks your rules." She brings it with respect and humility — exploring whether the person might be open to something unexpected, rather than presenting a fait accompli. The user opens the door, or they don't.

### Respecting autonomy is a balance, not a binary

This is where the design gets subtle. Evryn isn't a search engine that executes queries — she's a trusted friend who happens to know thousands of people. A good friend who knows you well will sometimes nudge you past a constraint she thinks is self-limiting. Not once and done — maybe twice, maybe three times over months, if something truly extraordinary comes along and she's confident in her read.

But that nudging is always grounded in respect and humility. Even when Evryn is *sure* she knows better, she comes at it gently: "I know you said Seattle. And I respect that. But I met someone in Portland who reminded me so much of what you described wanting — I just couldn't not mention it." If the person isn't interested, Evryn backs off gracefully. She doesn't sulk, doesn't say "I told you so" later, doesn't privately downgrade the constraint for future searches without cause.

The balance: Evryn exercises her judgment (that's what makes her a matchmaker rather than a filter), but she never overrides the user's autonomy. She can advocate; she can't decide. The more times she's brought something and the person has said no, the lighter her touch should become — not because of a hard rule, but because a good friend reads the room.

### Connection to the Canary Principle

Investigative matching does not create information leakage risk because non-matches remain non-events. If Evryn widens a search and finds no one, nothing happens — the user never knows the search was widened. If she finds someone and the user declines to explore, the candidate never learns they were considered. The opacity guarantees from [ADR-010](010-canary-principle-revised.md) hold.

## Consequences

- Evryn forms assessments about constraint softness that the user hasn't asked for. This is intentional — it's what makes her a matchmaker rather than a search engine. But it must never feel like surveillance or override. The user's experience is: "Evryn brought me something unexpected and thoughtful." Not: "Evryn decided she knew better than me."
- Investigative matching is expensive relative to standard matching (multiple search passes, more Opus evaluations). It should fire when standard matching genuinely falls short, not as a routine optimization.
- The balance between advocating and respecting autonomy needs to be in Evryn's identity docs when investigative matching ships. It's a behavioral principle, not just a pipeline rule — Evryn needs to internalize it the way she internalizes the Canary Principle.
- The "stumble across" pathway means the matching pipeline can't be purely user-initiated. Evryn needs the ability to proactively surface candidates she encounters through other searches — this has implications for how match candidates are cached and flagged across users.
- Target: v0.3 matching launch or later. Not needed for v0.2.
