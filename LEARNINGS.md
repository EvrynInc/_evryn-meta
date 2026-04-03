# Cross-Project Learnings

**Temporary holding pen.** Learnings land here first, but nothing should stay. Every entry should be promoted to where it will actually be read and enacted at the right moment — the relevant CLAUDE.md, Hub/spoke, protocol doc, build doc, or ADR (with proper breadcrumbing so the ADR gets discovered at the right moment, not buried). Once promoted, condense to a one-line stub. Stubs stay for cross-pollination to new repos or contexts.

**Do not edit without Justin's approval.** Propose changes; don't make them directly.

*Last updated: 2026-03-09*

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
34. *Promoted → AGENT_PATTERNS "Rich Insights Over Structured Extraction" + evryn-backend identity-writing-brief §Structural Principles.*
35. *Promoted → AGENT_PATTERNS Modular Context Loading (Soul DNA Test).*
36. *Promoted → ADR-017 + evryn-backend ARCHITECTURE.md pipeline section ("Forward ≠ Triage").*
37. *Promoted → AGENT_PATTERNS Per-Context Situation Determination.*
38. *Promoted → evryn-backend ARCHITECTURE.md security section + DC CLAUDE.md Build Mandate "Security first" bullet ("Untrusted Input Boundary").*
39. *Promoted → AGENT_PATTERNS Catch-Up-on-Reconnect for Persistent Connections.*
40. *Promoted → evryn-backend ARCHITECTURE.md Data Model §Design Principles ("Constrain Every Field an LLM Writes").*

---

## Unpromoted

41. **Strip Instructions from Data Files.** If a file is read every session but only written to occasionally, don't put writing instructions in the file — put them in the protocol that gates writing. The file stays clean (lower token cost on every load), and the instructions are in context exactly when they're needed. The file itself should have a guardrail warning not to write or edit without reading the protocol first — otherwise it will almost certainly get overwritten by an eager agent. Applied to agent MEMORY.md files: writing guidance moved to #lock protocol, consolidation guidance to #consolidate protocol. *Promote to:* Already applied in team workspace. Consider for other repos where instruction-heavy files are loaded on every session.

*New learnings land here temporarily before being promoted to their permanent homes.*
