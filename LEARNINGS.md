# Cross-Project Learnings

**Temporary holding pen.** Learnings land here first, but nothing should stay. Every entry should be promoted to where it will actually be read and enacted at the right moment — the relevant CLAUDE.md, Hub/spoke, protocol doc, build doc, or ADR (with proper breadcrumbing so the ADR gets discovered at the right moment, not buried). Once promoted, condense to a one-line stub. Stubs stay for cross-pollination to new repos or contexts.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

*Last updated: 2026-03-09T13:15-07:00*

---

## Promoted Stubs

1. *Promoted → AC CLAUDE.md Autonomous Work Protocol §6 ("Context Checkpoints Save Sanity").*
2. *Promoted → AC CLAUDE.md routing table ("Separate State/Decisions/Learnings").*
3. *Promoted → ADR-006 ("Custom Over Frameworks" — superseded by intentional dependency selection).*
4. *Promoted → AC CLAUDE.md Architectural Mandate ("Measure Reality, Not Proxies").*
5. *Promoted → AC + DC CLAUDE.md ("Separate Strategic from Tactical Context" — the AC/DC separation itself).*
6. *Promoted → AC CLAUDE.md Document Ownership ("Documents Need Scope Guardrails").*
7. *Promoted → AC + DC CLAUDE.md Documentation Approach ("Diátaxis + Progressive Depth").*
8. *Promoted → AC/DC protocol doc ("Multi-Instance Claude Coordination via Docs").*
9. *Promoted → AC/DC protocol doc ("Mailbox Pattern for Cross-Instance Communication").*
10. *Promoted → DC CLAUDE.md "Understanding AC" + AC/DC protocol ("Theory of Mind Between Instances").*
11. *Promoted → AC CLAUDE.md Runtime CLAUDE.md Ownership ("CLAUDE.md Serves the Runtime Agent, Not the Developer").*
12. *Promoted → AC + DC CLAUDE.md ("Operational Requirements as Spec Gates").*
13. *Promoted → AC + DC CLAUDE.md ("Full Timestamps Prevent Stale-Data Confusion").*
14. *Promoted → BUILD-LUCAS-SDK.md "Why This Architecture" ("Infrastructure Should Follow Intelligence").*
15. *Promoted → BUILD-LUCAS-SDK.md architecture ("One Agent With Perspectives Beats Eight").*
16. *Promoted → AC CLAUDE.md Autonomous Work Protocol §5 ("Self-Review Prevents Expensive Mistakes").*
17. *Promoted → AC + DC CLAUDE.md ("Never Guess Timestamps").*
18. *Promoted → AC + DC CLAUDE.md source-of-truth editing rules ("Write Notes That Survive Context Loss").*
19. *Promoted → AC + DC CLAUDE.md source-of-truth editing rules ("Passive Voice Creates Ambiguity").*
20. *Promoted → AC CLAUDE.md Architectural Mandate ("Start with the Lowest-Risk Component").*
21. *Promoted → AC CLAUDE.md Architectural Mandate ("Trust + Guardrails > Micromanagement").*
22. *Promoted → ADR-006 + BUILD-LUCAS-SDK.md ("SDK Features Replace Custom Infrastructure").*
23. *Promoted → SYSTEM_OVERVIEW.md Anthropic section ("Subscription Tokens ≠ API Tokens"). (SYSTEM_OVERVIEW retired; content absorbed into bizops-and-tooling spoke.)*
24. *Promoted → SYSTEM_OVERVIEW.md Anthropic section ("Right-Size Your Subscription"). (SYSTEM_OVERVIEW retired; content absorbed into bizops-and-tooling spoke.)*
25. *Promoted → AC CLAUDE.md Architectural Mandate ("Latency Matters for Primary Interfaces").*
26. *Promoted → lock-protocol.md Bitwarden reminder (".env Files Need Their Own Backup Strategy").*
27. *Promoted → lock-protocol.md Bitwarden reminder ("Credentials Are Recoverable, But Annoying").*
28. *Promoted → AC CLAUDE.md Security Mindset ("Defense in Depth for Secrets").*
29. *Promoted → AC CLAUDE.md Current State section ("Static Priority Lists Get Stale").*
30. *Promoted → AC CLAUDE.md source-of-truth editing rules ("Cross-Reference Newest Thinking Before Backfilling").*
31. *Promoted → AC CLAUDE.md Security Mindset ("First Principles for Third-Party Tool Access").*
32. *Promoted → AC CLAUDE.md research breadcrumb rules ("Study Material ≠ Implementation Spec").*
33. *Promoted → AC CLAUDE.md research breadcrumb rules ("Place Breadcrumbs at Decision Points").*

---

---

## Unpromoted

34. **"Rich insights" over "structured data" in identity prompts.** Telling the model to collect "structured understanding" makes it cram into predictable fields prematurely. "Rich insights — observations, patterns, signals, emotional cues, things said and unsaid" encourages journaling. Don't structure data before you know what's signal. *(Source: identity writing session 2026-03-04. Promote to: identity-writing-brief or BUILD doc prompt engineering notes.)*

35. **Soul DNA test for always-loaded context.** If it's not part of the soul DNA in *every* moment, it doesn't belong in the always-loaded file. Every token burns every turn. Test: can it be pointed to instead of included? Procedures, operational details, and scenario-specific handling all move to contextual modules. *(Source: identity writing session 2026-03-04. Promote to: AGENT_PATTERNS Modular Context Loading.)*

36. **"Forward ≠ triage."** Forward detection (email headers, "Fwd:" in subject) should capture data, not determine routing. A forward from a gatekeeper might be a candidate to triage, info about a friend, or context the agent asked for — only the agent can tell by reading the message. *(Source: identity writing S2, Phase 7, 2026-03-05. Promote to: already captured in ADR-017 + ARCHITECTURE.md pipeline section.)*

37. **"Situation is per-context, not per-person."** A person's situation depends on what they're saying, not a static label on their profile. Mark is a "gatekeeper" when forwarding candidates but a "regular user" when asking a personal question. The trigger can't determine situation from metadata alone. *(Source: ADR-017, 2026-03-05. Promote to: AGENT_PATTERNS — already partially there in "Modular Context Loading" but needs explicit call-out.)*

38. **"Untrusted input goes in `prompt`, never `systemPrompt`."** Email content is untrusted user input. Putting it in systemPrompt lets prompt injection manipulate system-level instructions. Security boundary: systemPrompt = agent identity + trusted context; prompt = the message to respond to. *(Source: identity writing S2, Phase 7. Promote to: DC CLAUDE.md security section, ARCHITECTURE.md security section.)*

39. **"Catch-up-on-reconnect makes persistent connections reliable."** For WebSocket/Socket Mode, handle reconnection by querying missed messages since last processed timestamp (~10 lines of code). Makes connection drops a latency blip, not lost data. *(Source: Socket Mode decision, 2026-03-05. Promote to: AGENT_PATTERNS "Push + Sweep" pattern (related but distinct).)*

*New learnings land here temporarily before being promoted to their permanent homes.*
