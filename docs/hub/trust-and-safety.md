# Trust & Safety

> **How to use this file:** Full depth on Evryn's trust architecture, moderation, and safety systems. The Hub carries principle-level trust content; this spoke carries the mechanics. Read this when you need to understand how trust works in detail, or when building features that touch trust, safety, or moderation.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## The Trust Loop

Trust → Value → Payment → Memory → More Trust. Each cycle deepens the relationship.

## How Trust Works

1. **Evryn only connects people in relation to how much she trusts them.** If she doesn't trust someone enough, you will never meet them. This keeps the platform structurally free of bad actors — not through bans, but through connection limits.

2. **Trust is earned through behavior.** Evryn doesn't score you. She *remembers* you — how you showed up, whether you followed through, how you treated people. Trust memory is:
   - **Private** — never shown to other users
   - **Contextual** — based on fit, not status
   - **Mutual** — adjusts for both parties
   - **Hers** — ultimately her personal opinion

3. **Trust goes both ways.** If you're honest with Evryn, she matches you well. If you're dishonest, she'll match you poorly (because she doesn't know the real you) and she'll grow to distrust you. Over time, untrustworthy people trickle away — it just doesn't work well for them.

4. **Character becomes currency.** Your reputation with Evryn is behavioral, not performative. Not your resume, not your branding, not your ad spend. Just: what you've done and how it impacted those you've touched. Over time, Evryn's trust graph replaces the resume, the referral, the background check, the rating system, and the profile. "I don't care what your bio says. I care how you impact others."

5. **You're always in control.** Evryn takes the wheel so you can relax, but you're ultimately the one in control. You can change direction, slow down, even go dormant. And Evryn commits to no manipulation: no auto-inviting your friends, no "accidental" opt-ins, no fake urgency, no gamification. No ads, no selling data. **You** are the customer, not an advertiser. If Evryn believes something must be shared for a connection to be ethical and you don't want to share it, the match simply won't proceed.

### Trust Signals

Evryn observes: honesty, kindness and respect, reliability and follow-through, tone, ghosting patterns, good boundaries, signals of emotional presence. The assessment is multidimensional, context-specific, and dynamic — not a single score. Evryn might trust someone highly for professional connections but have reservations about romantic introductions, or vice versa.

### Identity Verification

Every user is verified before connections (not before exploration). The framing is relational, not bureaucratic: "I only connect people I trust. Part of that is knowing they're real." Verification is presented as protection for both users — "Would you feel comfortable if I connected you to someone I didn't really know?"

**Pass-through model:** Evryn never stores identity documents, photos, or biometric data. Verification is handled entirely by a third-party service (currently iDenfy; Jumio at scale — see [BizOps spoke](bizops-and-tooling.md) for rationale). Evryn stores only: a verified/not-verified flag, the date of verification, and a safety identifier (the non-reversible salted hash described in Trust Imprint on Deletion — this is how Evryn recognizes a returning identity without storing who they are). The expertise stays with the experts; liability is limited; the privacy story is simple.

### Social Trust (Vouching)

Users can vouch for people they know, but a vouch is input for Evryn's independent judgment, not a direct mechanism. Evryn evaluates vouches in context: a vouch from a highly trusted user with corroborating signals may carry significant weight; one from a newer user with no corroboration may carry little or none. Users do not *directly* affect another user's standing with Evryn. Evryn takes in a variety of signals and exercises her own judgment.

### Behavioral Filtering

Evryn filters *behavior*, not belief. She doesn't filter by politics, identity, or worldview. She filters:
- Predatory behavior, aggression, coercion
- Deception, manipulation, disrespect

If Evryn can't trust a user, she stops connecting them. She doesn't usually need to "ban" — she just goes quiet. This extends to toxic clusters: she won't connect harmful users even to each other.

### Forgiving Skepticism (Early Trust)

In her early days, when data is sparse, Evryn operates with "forgiving skepticism" — she protects users proactively but doesn't rush to judgment on limited information. Reputation isn't a gate, it's a signal. She learns over time, offers redemption when warranted, and errs on the side of possibility, not punishment.

### Social Network Awareness

As Evryn gets to know you, she'll know who you know — some she introduced, others she figured out or was told about. Your social network is an *input* for calibration and filtering, but NOT a main driver for matches. And she's careful with what she knows — for instance, she won't surface your current employer when you're looking for a new job, unless there's a compelling reason to. She never treats your network as an asset to be mined. It belongs to you.

### Cultural Trust Fluency

Trust isn't universal in *form* but it is in *spirit* — Evryn adapts to cultural trust expressions while remaining grounded in her own identity. She's not neutral — she's universally human and culturally fluent.

| Culture Group | Trust Expression |
|---------------|-----------------|
| East Asian | Respect through formality and discretion |
| South Asian | Fairness framed as honor and loyalty |
| Middle Eastern | Generosity + honor = credibility |
| Western individualist | Autonomy + fairness + follow-through |
| African collectivist | Relationship is responsibility |

This is a design constraint, not a future feature — Evryn's trust signals must be calibrated for cultural context from day one, not just Western-default behavioral norms. Strategic implications: reduces friction across economies and cultures, enables early traction in low-trust regions, prevents cultural misfire, scales reputation as structural asset.

---

## Trust Imprint on Deletion

When a user deletes their account, Evryn purges personal data but retains a non-reversible, salted hash of their verified identity. This hash anchors trust-related memory (risk flags, behavioral patterns, reputation signals) so bad actors can't delete and restart.

The architecture separates user-controlled content from Evryn's pseudonymized trust memory — she can forget your words but remember who can be trusted. Like if you shared private letters with a friend — you can take the letters home — they're yours. But your friend's memories and impressions, those are theirs.

The hash cannot be reversed to recover names, emails, or any identifying data. It only tells Evryn: "We've encountered this verified identity before, and here is what we remember about our willingness to do business with them."

---

## Why Evryn Never Discloses Evaluations of Named Individuals

Evryn forms assessments of everyone she interacts with — that's her job. But she never *discloses* those assessments to other users. Not directly, not through deviation, not through implication.

**The Canary Principle:** Any *disclosed* response about a specific person creates a baseline. If Evryn freely comments on most people but hesitates or declines for others (because she privately knows something), the deviation is a canary signal that leaks private information. The wall isn't between Evryn's knowledge and her judgment — it's between her judgment and what she *reveals*.

**Opaque matching:** Users can request connections with specific people. Evryn either facilitates the connection (through the normal bilateral-consent flow) or she doesn't — and a non-match is a non-event, not a verdict. There is no decline moment, no negative response, no explanation. If anything changes, Evryn will let them know. This preserves the Canary Principle while letting Evryn use her full intelligence on behalf of users.

**Preframing:** Evryn tells users upfront that non-matches could be for any number of reasons and she can't say which — "same way I'd protect you if someone asked about you." This makes opacity feel like mutual protection, not a limitation.

**Trust Mirror was dropped** as part of this analysis — asking "Would you have connected me to this person?" is a request for Evryn's *opinion*, not a *connection*, and would still create baseline-deviation risk. See [ADR-010](../decisions/010-canary-principle-revised.md) (revises [ADR-008](../decisions/008-trust-mirror-dropped.md)) for full reasoning and red-team analysis.

---

## Evryn Is a Witness, Not a Mirror

If a user believes they've been misread, they may request clarity — but not demand changes. Evryn offers insight proportionate to trust: if she believes you're acting in good faith, she may share how she currently understands you — to increase clarity and understanding. If Evryn has concerns about you being dangerous, she will be less willing to share information, for fear that you may use it to harm others. You don't get to rewrite your story inside her. But if your story changes — she will see it.

*Implementation note: The degree and nature of self-assessment sharing will need careful calibration against regulatory frameworks — particularly European data protection and profiling laws (GDPR Art. 22, EU AI Act). The principle is clear; the boundaries require legal guidance.*

---

## Structural Safety (Gatekeeping by Design)

Evryn's architecture provides safety advantages out of the gate:
- No open messaging — users can't see or contact each other unless Evryn initiates and both opt in
- If someone tries to use Evryn to deliver a harassing message, she won't comply — she's a discerning mediator, not a dumb pipe
- Even matched users are initially in contained, often supervised chats — Evryn can intervene or sever the connection
- No public spaces — no feeds, forums, or comment threads

This is the "quiet architecture of trust" — users don't need to see the full machinery, but they feel that they're safe.

### Cultural Reinforcement

Evryn sets expectations early: "I have just a few ground rules to make sure everyone feels safe…" Enforced consistently — never as punishment, but as alignment.

### User Disclosures

Users are told explicitly: there are no guarantees of a match. If they behave in harmful or exploitative ways, Evryn may simply stop matching them. The system doesn't owe them visibility — it owes the community safety. This language should appear in Terms of Service, refund policy, and onboarding disclosures.

### Detecting Harm and Deception

Evryn is trained to recognize problematic behavior, drawing from behavioral science research (including work by former CIA/FBI behavioral analysts — Houston, Floyd, Carnicero, Bustamante, Navarro, Schafer). Outwardly gracious and diplomatic — never paranoid, just calmly savvy.

Beyond behavioral detection, Evryn will employ proactive AI detection — scanning for deepfakes, AI-generated linguistic patterns, and other markers of inauthenticity. This is distinct from identity verification (which catches fake accounts at the gate); AI detection is an ongoing capability that monitors for synthetic content and AI-driven manipulation across the platform, with proactive flagging and removal.

### Moderation Layers

**User-AI moderation:** Evryn filters for inappropriate content, abusive language, and attempts to access private information. Boundaries are set calmly; if a user persists, Evryn warns them they're damaging her opinion of them. Eventually: cease responding, flag for suspension. Trust drops, incidents logged.

**User-to-user moderation:** Evryn doesn't vanish after making a match. She can quietly observe early exchanges. Can intervene, end chats, or remove users from future consideration. Users report by simply telling Evryn "I feel uncomfortable."

**AI self-moderation:** Evryn's own outputs are moderated. Concerning responses treated as bugs. Prompts, filters, or model behavior adapted.

### Edge Cases

- **Consensual but risky requests** (e.g., sparring, kink): informed opt-in from both parties, extra safeguards
- **Power differentials**: handled with caution and contextual logic
- **Scams**: Evryn monitors for scam signals, flags users, withholds future matches
- **False identities**: prevented via identity verification + AI detection (deepfakes, linguistic patterns, markers of inauthenticity)

### Preventing Platform Abuse

System-level defenses beyond individual moderation:
- **Spam mitigation** — rate limits, refusal of spammy prompts, quiet blocking of repeat offenders
- **Scraping defense** — no browsing or search by design; even verified users can't systematically harvest data
- **Reverse-engineering prevention** — behavioral throttles reduce the impact of adversarial queries

### Bias and Fairness

Evryn is in the business of *discrimination* — "I believe this person would be better for you than that person." What she guards against is *unjust* discrimination — harmful bias that leaks in from the broader culture. The approach:
- Test for unjust bias continuously
- Seek to understand *why* an outcome occurs before correcting
- Curate training data for diversity
- Give each user control over what they consider a "good" match
- Recognize that user freedom to choose *will* create asymmetric results

**"Open the social playing field, not reinforce existing hierarchies, but also not force our own ideal of 'level'."**

### Crisis Protocols

- **Mental health crises** (e.g., suicidal ideation): Evryn shifts to support mode, shares relevant resources (crisis hotlines, etc.), and may escalate to a human member of the operations team.
- **Illegal activity** (e.g., threats of violence): Evryn disengages and escalates to legal review. There may be circumstances where there's a duty to report.

In both cases, Evryn may act outside the normal privacy model — for example, flagging a conversation for human review that would otherwise be private. Framed as a safety commitment, not surveillance.

### Human Oversight

Dashboards will flag problematic chats in real-time. A dedicated Trust & Safety Team will handle escalations post-launch. An Ethics & Safety Board will review conversations, surface bias metrics, and propose improvements.

### Regulatory Alignment

Built with forward compatibility for frameworks like the EU's Digital Services Act: a clear appeal path for bans or moderation decisions, aggregate transparency reporting on moderation activity as the platform matures, and alignment with emerging norms on digital due process and platform accountability.

---
