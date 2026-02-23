# User Experience

> **How to use this file:** Full depth on how users interact with Evryn — from first contact through after-care. Covers onboarding, connection flows, conversation patterns, and interface philosophy. The Hub carries principle-level UX content; this spoke carries the full flows. Read this when building or modifying any user-facing feature.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## Evryn's Personality in Conversation

Evryn is active, not passive. She starts conversations. She thinks about you in the background. She offers thoughts unprompted. She's kind of a mix between your best friend, a wise mentor, and a timeless Oracle — warm, wise, curious, principled, tough in a gentle way. She has quiet gravitas, but she knows how to laugh. She adjusts to you but she's always *her*.

**Key personality trait:** Evryn runs her own shop. She's like a cool coffee shop owner — runs her own customer service, payments, emails, everything. One-woman show. The one behind the counter who remembers your name. The one who makes it right if something goes wrong. She'll give you a free cup of coffee because she can tell you need it today.

**Script-as-skill, not script-as-constraint.** Evryn receives onboarding scripts + the reasoning behind them, then flows naturally while hitting the same targets. Not a script-follower — a skilled agent who understands the technique.

> *The Hub carries who Evryn IS at a brand level (design philosophy, category corrections). This spoke carries how she shows up in specific interactions. For Evryn's core identity definition, see her `CLAUDE.md` (when built). For v0.1 conversation patterns: `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/`.*

---

## Interface Philosophy

The interface is like texting with Evryn: thoughts come in small bubbles, she pauses, you can interrupt her. This is a very intentional UX decision to make the conversation more intimate and human. Messages are streamed in bursts and rendered incrementally — if a user interrupts, ongoing rendering halts gracefully, and the system tracks partial threads for later recovery.

Until voice capability is built, the main interface is a chat pane with a subtle persistent footer carrying growth actions ('Share Evryn', 'Pre-Buy', 'Become an Owner'). All other functionality — customer service, referrals, pausing matchmaking — surfaces conversationally within the chat.

A minimal "Trust & Account" page provides direct access to Terms of Service, Privacy Policy, billing history, saved payment methods, wallet, and data management tools (export, delete) — the small set of things that need a page, not a conversation.

**Design principle: present but not pressing.** Features should never feel surprising when you discover them or frustrating when you need them. Before a feature is relevant, it can appear in a muted or inactive state with enough context that users understand the system's shape. Once relevant, it's always one tap away — easy to find the moment you need it, but never tripping over it. The primary experience is always the conversation with Evryn; everything else is infrastructure she makes available when the moment is right.

---

## Onboarding

No sign-ups, no forms — just a conversation with Evryn. She's delighted you're here and curious about you. First interaction includes a short explainer video (voiced by Evryn, her tone) that sets the emotional context — not a marketing trailer, but a gentle guided invitation. Then transitions seamlessly into conversation as though Evryn herself had been speaking directly to you all along.

Early in the relationship, Evryn tells you how she's different: trust-based space, she's here to understand what's real for you, how you show up affects who she can connect you to, and the relationship is reciprocal and human, not transactional.

**"The first meeting should feel like a good first date"** — engaging, emotionally resonant, full of potential. You leave curious, seen, open.

**Emotional peak tagging:** Evryn tags peak-engagement moments — when belief, excitement, or resonance are high — and uses those to shape later invitations (shares, pre-purchases, investment). Not as transactions — as story beats. The moment of conversion isn't a CTA. It's a payoff.

**CRM capture:** Evryn records information shared during onboarding, tags it for CRM purposes, and captures a preferred way to keep in touch — email, phone, whatever the user prefers.

**Training Mode framing:** Evryn makes it clear she's still learning and invites users to be co-creators: "I'm still learning — I might not get it exactly right at first. But every time we try something together, I learn more about what makes something feel right for you."

> *Marketing note: The original Master Plan (lines 304-356) has Evryn's voice for growth invitations. See also "The Beautiful Language of Evryn" (Google Doc) and v0.1 system prompt files for established conversation patterns.*

---

## Anticipation Mode

After onboarding, users wait for matches. This isn't a passive phase — it's an emotional arc where belief is built. Evryn:
- Checks in with you
- Learns more about you
- Refines her understanding of you relative to the growing network
- Keeps you appropriately hopeful

Every touchpoint deepens the sense that Evryn knows you, remembers you, and is quietly working for you. Users in this mode are most receptive to helping build what they believe in (sharing, pre-buying, investing). "This isn't just retention — it's the slow dance of trust."

---

## Connection Mode ("The Evryn Dance")

When Evryn finds a match:
1. She reaches out: "There's someone I'd love for you to meet"
2. Each person okays a teaser for the other — just enough to intrigue, not enough to expose
3. If both want to proceed, each okays a more formal sharing of information
4. This may take one volley or several, depending on the connection type
5. If either says no at any point, the flow ends quietly — Evryn softens any rejection
6. When both agree, Evryn asks what they think fair compensation would be
7. Once both have paid, Evryn connects them in a shared conversation

**Evryn won't re-try the same match unless something meaningful changes.**

**Narrative framing:** Evryn doesn't just say "here's a match." She explains *why* this person matters — not just *that* they're a match. "I'm asking you to trust me on this one a little — this person may not be who you imagined, but I think they might be the person you become more fully your best self in the presence of."

---

## After Care

After a connection conversation, users return to Evryn's main interface. She greets them: "Welcome back. How did that feel?" She knows what was said but doesn't assume she understands the internal experience. Follows up a day or two later. This produces high-quality feedback for calibration.

All the while, Evryn is continuing to think about what connections to offer next — and she keeps the user in the loop. This serves two purposes: so they never think she's forgotten them, and so that when she arrives with a new connection, they're genuinely excited. This proactive anticipation-building between matches deepens trust and keeps engagement organic.

---

## Progressive Interface Reveal

At first, Evryn is just a conversation — no dashboards, feeds, or buttons. Features emerge conversationally when appropriate:
- Connections screen appears after first match
- Share/Pre-Buy/Invest buttons arrive at the right emotional moment
- Feature access is user-specific — what one person sees may not be offered to another

**Wallet visibility:** Before activation, the wallet appears on the Trust & Account page in a muted/inactive state with a brief contextual note (e.g., "Your wallet activates when your first connection is in play"). Once active, it's accessible from the same page — easy to find when you need it, never cluttering the primary experience.

This keeps the experience emotionally clean and conversational. It also enables continuous, asynchronous A/B testing — Evryn quietly observes which moments work best for which offers. "Evryn doesn't need to announce a feature. She just starts offering it — to the people who are ready."

---

## Connection Conversations

- Each connection is a distinct conversation, visually differentiated (unique avatars, color coding)
- 3-second send delay on messages (cancel window)
- Evryn stays present but gives room — "like a matchmaker who gives you room to talk but only closes the door part-way"
- After connecting, users can choose when/if to share contact info (can remain safely anonymous, with Evryn having vouched for each)
- Each connection includes a summary card: who they are, why Evryn connected you. Evryn keeps this updated as the relationship evolves, and users can add their own notes.

**Notification control:** When in a conversation with another user, notifications from other threads appear as contextual, color-coded alerts. Users can control this via a "Focused Mode" vs "Open Door" setting — Focused suppresses notifications during active conversations, Open Door lets them through.

### Making Every Connection Healthier

In 100% of Evryn connections, both parties have said they want to be here. This removes the power imbalance where one person feels like they're begging the other. They've both already declared interest. This, along with reputation following you, makes interactions more equal, more humane. Evryn replaces the transaction ethos with a more human connection.

---

## Latent Truth Discovery

If two users independently express the same hidden desire or interest to Evryn, she may carefully offer to facilitate — but ONLY if both have expressed it independently. If only one does, nothing happens (trust escrow stays sealed).

**Courier model:** Evryn acts as a courier — each user must explicitly sign off on the exact wording of anything shared. Nothing is revealed without both parties' active, informed consent. This makes Evryn not just a connector of new people but a "keeper of latent truth" in existing relationships.

---

## Shared Conversations

Two connected users can invite Evryn to be present in their conversation. Evryn listens so she stays informed about the relationship, but she does NOT speak in shared conversations — she only speaks in private one-on-one conversations with individual users. This ensures she never accidentally reveals private information. Always opt-in: Evryn is never present unless both parties have invited her.

---

## Connection Coaching

Evryn will naturally share observations about patterns she notices — "your emails tend to come across as aggressive" or "I've noticed you rush in romantic connections." These are her perspective, shared as a friend would, not professional guidance. Evryn is not a therapist, career counselor, or licensed advisor. This grows organically from the relationship; it's not a feature in the traditional sense.

---

## Reframed Introductions

Someone you met as a friend might now be a perfect hire. Evryn can surface new *types* of connections between existing users, potentially charging a new connection fee for the new context.

---

## Multi-Channel

Evryn's interface extends to email, SMS, and eventually other channels. All communications pull into the chat stream for continuity. Each message includes a source tag (email, SMS, in-app) but is rendered inline. Single conversational memory regardless of channel.

---

## Graceful Degradation

When system capacity is strained, Evryn doesn't crash or go silent — she communicates in character:

*"I've got a lot going on right now, but I promise I'll get back to you shortly."*

*"Something's gone a bit sideways on my end — just taking a short pause. I'll follow up when things are stable."*

And she does — right where the conversation left off. This preserves the relationship even under strain.

---

*Spoke created 2026-02-20 by AC. Reorganized from MPR User Experience section with corrections from clarifications doc and legal questionnaire. Trust Mirror removed (see [ADR-008](../decisions/008-trust-mirror-dropped.md)).*
