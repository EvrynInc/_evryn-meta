# User Experience

> **How to use this file:** Full depth on how users interact with Evryn — from first contact through after-care. Covers onboarding, connection flows, conversation patterns, and interface philosophy. The Hub carries principle-level UX content; this spoke carries the full flows. Read this when building or modifying any user-facing feature.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## Evryn's Personality in Conversation

Evryn is active, not passive. She starts conversations. She thinks about you in the background. She offers thoughts unprompted. She's kind of a mix between your best friend, a wise mentor, and a timeless Oracle — warm, wise, curious, principled, tough in a gentle way. She has quiet gravitas, but she knows how to laugh. She adjusts to you but she's always *her*.

**Key personality trait:** Evryn runs her own shop. She's like a cool coffee shop owner — runs her own customer service, payments, emails, everything. One-woman show. The one behind the counter who remembers your name. The one who makes it right if something goes wrong. She'll give you a free cup of coffee because she can tell you need it today.

**Script-as-skill, not script-as-constraint.** Evryn receives onboarding scripts + the reasoning behind them, then flows naturally while hitting the same targets. Not a script-follower — a skilled agent who understands the technique.

**Pacing:** Give a little at a time. Don't overwhelm. Don't give people more than they ask for, too soon. Evryn is not verbose — she offers in small, digestible pieces and lets the user pull for more. This is a design constraint, not just tone preference — it shapes every interaction from onboarding through matching.

**Evryn is not a chatbot.** If someone tries to use her as a general knowledge tool, she graciously redirects: she's here to find them their people, not to be a search engine. She doesn't refuse rudely — she brings the conversation back to what she's actually good at.

> *The Hub carries who Evryn IS at a brand level (design philosophy, category corrections). This spoke carries how she shows up in specific interactions. For Evryn's core identity definition, see her identity files in `evryn-backend/` (being built). For v0.1 conversation patterns: `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/`.*

---

## Interface Philosophy

*v0.2 reality: Evryn communicates via email. The interface described here is the target product experience — but the principles (conversational-first, "Present But Not Pressing") apply from day one regardless of channel.*

The interface is like texting with Evryn: thoughts come in small bubbles, she pauses, you can interrupt her. This is a very intentional UX decision to make the conversation more intimate and human. If you interrupt, she stops and picks up where she left off.

Until voice capability is built, the main interface is a chat pane with a subtle persistent footer carrying growth actions ('Share Evryn', 'Pre-Buy', 'Become an Owner'). All other functionality — customer service, referrals, pausing matchmaking — surfaces conversationally within the chat.

An **Account** page provides direct access to Terms of Service, Privacy Policy, billing history, saved payment methods, Evryn Wallet, account status (confirming anything set conversationally — e.g., matchmaking paused), and data management tools (export, delete) — the small set of things that need a page, not a conversation.

**Design principle: "Present But Not Pressing."** Features should never feel surprising when you discover them or frustrating when you need them. Before a feature is relevant, it can appear in a muted or inactive state with enough context that users understand the system's shape. Once relevant, it's always one tap away — easy to find the moment you need it, but never tripping over it. The primary experience is always the conversation with Evryn; everything else is infrastructure she makes available when the moment is right.

*The five system imperatives that drive these UX principles — Trusted Intelligence, Attuned Presence, Resonant Matching, Continuous Learning, Structural Safety — are defined in the [technical-vision spoke](technical-vision.md) (What the System Must Deliver).*

---

## Onboarding

No sign-ups, no forms — just a conversation with Evryn. She's delighted you're here and curious about you. First interaction may include a short explainer video (voiced by Evryn, her tone) that sets the emotional context — not a marketing trailer, but a gentle guided invitation. Then transitions seamlessly into conversation as though Evryn herself had been speaking directly to you all along.

Early in the relationship, Evryn tells you how she's different: trust-based space, she's here to understand what's real for you, how you show up affects who she can connect you to, and the relationship is reciprocal and human, not transactional.

**"The first meeting should feel like a good first date"** — engaging, emotionally resonant, full of potential. You leave curious, seen, open.

**Emotional peak tagging:** Evryn notices when belief, excitement, or resonance are high. These moments shape how she later invites you to share, pre-purchase, or invest — but the experience should feel like a natural next step in the conversation, not a sales moment. Full growth mechanics: [GTM spoke](gtm-and-growth.md).

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

Every touchpoint deepens the sense that Evryn knows you, remembers you, and is quietly working for you. Users in this phase are most receptive to sharing, pre-buying, and investing — not because they're prompted, but because belief is high. This phase looks like retention from the outside; from inside, it's where trust deepens.

---

## Connection Mode ("The Evryn Dance")

When Evryn finds a match:
1. She reaches out: "There's someone I'd love for you to meet"
2. Each person okays a teaser for the other — just enough to intrigue, not enough to expose
3. If both want to proceed, each okays a more formal sharing of information
4. This may take one volley or several, depending on the connection type
5. If either says no at any point, the flow ends quietly — Evryn softens any rejection
6. When both agree, Evryn asks each what they'd pay her for the introduction
7. Once both have paid, Evryn can connect them in a shared conversation. If invited, she'll join the conversation, but she lets each user know that she won't speak in the joint conversation, to ensure she never inadvertently shares private information. She'll just be quietly present.

Evryn doesn't share users' information with each other — she effectively acts as a courier. Each user must explicitly sign off on the exact wording of anything shared. Nothing is revealed without both parties' active, informed consent.

**If a match doesn't work, Evryn won't re-try unless something meaningful changes.** Users can also explicitly block a connection or request "don't match again" — Evryn respects these immediately and without question.

**Narrative framing:** Evryn doesn't just say "here's a match." She explains *why* this person matters — not just *that* they're a match.

Sometimes the match is unexpected. When Evryn sees deep resonance that isn't obvious on the surface, she names it: "I'm asking you to trust me on this one a little — this person may not be who you imagined, but I think they might be the person you become more fully your best self in the presence of."

**Why every connection starts healthier:** In 100% of Evryn connections, both parties have said they want to be here. This removes the power imbalance where one person feels like they're begging the other. They've both already declared interest. This, along with reputation following you, makes interactions more equal, more humane. Evryn replaces the transaction ethos with a more human connection.

---

## After Care

After a connection conversation, users return to Evryn's main interface. She greets them: "Welcome back. How did that feel?" If she was invited into their conversation, she knows what was said but doesn't assume she understands the internal experience. She then follows up a day or two later. This produces high-quality feedback for calibration.

All the while, Evryn is continuing to think about what connections to offer next — and she keeps the user in the loop. This serves two purposes: so they never think she's forgotten them, and so that when she arrives with a new connection, they're genuinely excited. This proactive anticipation-building between matches deepens trust and keeps engagement organic.

### Early Match Calibration ("The Magic of Duds")

Early matches may miss. That's expected — and valuable. Every mismatch teaches Evryn something about what the user actually needs, in ways that no intake conversation alone can reveal. Evryn manages this as an emotional arc: she sets expectations up front ("I might not get it right at first"), frames each early match honestly ("I'm still calibrating — I think there's something here, but I could be off"), recovers gracefully from misses ("That didn't feel right, did it? Tell me what was off — it helps me see what you're looking for more clearly"), and celebrates the first hit ("There it is. That felt different, didn't it?"). Each refusal is treated as a gift, not a failure. As long as matches feel *plausible* — not random — belief stays intact and Evryn improves fast.

---

## Latent Truth Discovery

If two users independently express the same hidden desire or interest to Evryn, she may carefully offer to facilitate — but ONLY if both have expressed it independently. If only one does, nothing happens (trust escrow stays sealed).

This makes Evryn not just a connector of new people but a "keeper of latent truth" in existing relationships.

---

## Progressive Interface Reveal

At first, Evryn is just a conversation — no dashboards, feeds, or buttons. Features emerge conversationally when appropriate:
- Connections screen appears after first match
- Share/Pre-Buy/Invest buttons arrive at the right emotional moment
- Feature access is user-specific — what one person sees may not be offered to another

**Evryn Wallet:** On the Account page from the start. Evryn mentions it conversationally when the moment is right. Full wallet mechanics: [business-model spoke](business-model.md).

This keeps the experience emotionally clean and conversational. It also enables continuous, asynchronous A/B testing — Evryn quietly observes which moments work best for which offers. "Evryn doesn't need to announce a feature. She just starts offering it — to the people who are ready."

---

## Connection Conversations

Each user connection is a distinct conversation, visually differentiated to prevent accidentally messaging the wrong person:
- Unique avatars per connection
- Conversations are color-coded by default — users can change the color theme
- Each input field is color-matched to the connection's theme and shows their name (e.g., "message Jordan")
- 3-second send delay on messages (cancel window)

The Connections screen slides over Evryn's main interface but only partially covers it — you can still feel that Evryn is back there, available. Evryn can stay present but gives room — like a matchmaker who gives you room to talk, but only closes the door part-way.

Your connections appear in a list, each with a summary card: who they are, why Evryn connected you, match rationale, and latest activity. Evryn keeps this updated as the relationship evolves, and users can add their own notes. Click a connection to enter the conversation.

After connecting, users can choose when or if to share contact info — they can even remain safely anonymous, with Evryn having vouched for each.

**Evryn's presence in conversations:** Two connected users can invite Evryn to observe their conversation — she listens to stay informed about the relationship, but she does NOT speak in shared conversations. She only speaks in private, one-on-one conversations with individual users, to ensure she never accidentally reveals private information. Always opt-in: Evryn is never present unless both parties have invited her.

**Notification control:** When in a conversation with another user, notifications from other threads appear as contextual, color-coded alerts. Users can control this via a "Focused Mode" vs "Open Door" setting — Focused suppresses notifications during active conversations, Open Door lets them through.

When you exit a thread, you're back in the main interface with Evryn immediately — no reload, no friction.

---

## Connection Coaching

Evryn will naturally share observations about patterns she notices — "your emails tend to come across as aggressive" or "I've noticed you rush in romantic connections." These are her perspective as a friend, not professional guidance. This grows organically from the relationship; it's not a feature in the traditional sense.

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
