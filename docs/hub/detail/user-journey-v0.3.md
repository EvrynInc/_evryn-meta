# User Journey — v0.3 "The Broker"

> **What this is:** The step-by-step experience of a regular user through Evryn's v0.3 web app — from arriving at evryn.ai through connection and aftercare. This is version-scoped: it describes what v0.3 actually does, not aspirational future features.
>
> **Audience:** Internal team + Fenwick (legal review). Written to be human-readable and legally parseable.
>
> **Relationship to other docs:**
> - **How users arrive at evryn.ai** is covered in the [Gatekeeper Flow](gatekeeper-flow.md). This doc picks up *from arrival at evryn.ai* and covers the user experience forward.
> - **The UX philosophy and long-term vision** lives in the [UX spoke](../user-experience.md). This doc is the v0.3-specific instantiation of those principles.
> - **What gets built and in what order** lives in [BUILD-EVRYN-MVP.md](../../../../evryn-backend/docs/BUILD-EVRYN-MVP.md). This doc describes the experience; the build doc describes the implementation.
>
> **Owns keeping this synced:** Mira (CPO). This doc should reflect the current v0.3 build scope. Header notes which build doc version it reflects.
>
> **Last updated:** 2026-03-30
> **Reflects build doc as of:** 2026-03-28

---

## How Users Arrive at evryn.ai

Users reach the v0.3 web app through one of three pathways, all originating from gatekeeper activity. (For the full mechanics of each pathway, see [Gatekeeper Flow — Phase II](gatekeeper-flow.md).)

1. **Continued forwarding.** A gatekeeper (e.g., Mark) continues forwarding emails during v0.3. Evryn replies to each sender on the gatekeeper's behalf — Evryn emails gold contacts to tell them they're on the gatekeeper's radar; converts edge contacts to gold or pass, or reaches out to learn more; gives pass contacts a gentle rejection from Mark and redirect to Evryn's broader services. Each reply includes an invitation to visit evryn.ai to continue talking to Evryn directly.

2. **Auto-redirect.** The gatekeeper sets up an auto-responder or updates their contact page to direct people to evryn.ai. New inquiries go straight to Evryn rather than through the gatekeeper's inbox.

3. **Phase I backlog.** During v0.2, Evryn logged ~200 emails/day but didn't contact anyone. At v0.3 launch, Evryn goes back and replies to these people using the same outreach structure as pathway 1 — a reply to their original email to the gatekeeper, on the gatekeeper's behalf.

**The key point for legal:** In all three pathways, the outreach itself is structured as a reply to an email the person originally sent to the gatekeeper, sent on the gatekeeper's behalf with their direct authorization. The person only needs to consent to Evryn's Terms of Service and Privacy Policy when they *voluntarily choose* to engage with Evryn's platform by visiting evryn.ai.

**What happens next is the same regardless of how they arrived.** The rest of this document covers the journey from that point forward.

---

## Stage 1: Landing at evryn.ai

The user arrives at evryn.ai — Evryn's marketing site. They see Evryn's brand, value proposition, and a prominent "Talk to Evryn" button.

**Consent gate (before any conversation):**
- Just above the "Talk to Evryn" button: a checkbox reading "I agree to the [Terms of Service] and [Privacy Policy]" (with links to each document).
- The checkbox must be checked to unlock the button. This is a clickwrap agreement — the strongest standard of online consent.
- **This means every person who has ever chatted with Evryn has affirmatively agreed to ToS/PP.** No exceptions. No "by continuing, you agree" implied consent. Explicit checkbox, explicit action.

**What this does NOT include:** Account creation. The user is not signing up yet — they're consenting to terms and entering a conversation.

### Consent event logged
| Event | Data captured |
|-------|--------------|
| ToS/PP acceptance | Timestamp, document versions agreed to, session ID |

---

## Stage 2: Pre-Account Conversation

After checking the box and clicking "Talk to Evryn," the user enters a chat interface. Evryn greets them with a pre-loaded message — warm, curious, inviting. Once the user responds, this is a real conversation with the full Evryn: her personality, her judgment, her emotional intelligence.

**What's happening architecturally:**
- This pre-account conversation runs in an **ephemeral, tab-scoped session.** There is no cookie-based persistence. If the user closes the tab and returns later, they start a fresh conversation — Evryn doesn't remember them. This is a deliberate safety choice: it prevents one person's conversation from being served to another person on a shared device.
- Evryn runs her **full dual-track processing** from exchange one — warm conversation on the surface, structured understanding being built underneath. She's learning who this person is, what they're looking for, and how to help them.
- **No conversation data persists** beyond the active session. If the user leaves without creating an account, the conversation content is discarded. IP and behavioral data may be retained separately for security purposes (abuse detection, repeat attack prevention) — this is security infrastructure, not user data. (Whether any retention window is needed for the conversation content itself is a question for Fenwick.)

**Account creation nudge cadence:**
- At ~20 exchanges: Evryn gently suggests creating an account.
- At ~30 exchanges: Evryn gives a warning that the system will require an account to continue soon."
- At ~40 exchanges: The system requires account creation to proceed.

The nudge is conversational, not a modal or popup. Evryn weaves it naturally into the conversation at an appropriate moment.

---

## Stage 3: Account Creation

When the user chooses to create an account (on their own initiative, prompted by Evryn or system required), they see an account creation screen.

**Options:**
- **Sign in with Google** (prominent) — one-click sign-in
- **Sign in with Apple** (prominent) — one-click sign-in
- **Email and password** — traditional fallback

**Second consent gate:**
- A ToS/PP agreement checkbox appears on the account creation screen. This is belt-and-suspenders: even if someone somehow bypassed the pre-chat checkbox (e.g., came through a direct link to the chat), account creation requires explicit ToS/PP agreement.
- This ensures that every account holder has affirmatively agreed to terms, with 100% certainty.

**What happens to the conversation:**
- If the user creates an account within the same session, the entire pre-account conversation **migrates** into their new profile. Nothing is lost — the understanding Evryn built during the ephemeral session becomes the foundation of the user's permanent profile.
- The user picks up right where they left off. The account creation is a brief interruption, not a restart.

### Consent events logged
| Event | Data captured |
|-------|--------------|
| Account creation | Timestamp, auth method (Google/Apple/email), user ID |
| ToS/PP acceptance (second gate) | Timestamp, document versions, user ID |

---

## Stage 4: Onboarding (Continuing the Conversation)

Account creation doesn't change the conversation's character — Evryn was already being fully herself. What changes is that the conversation now *persists*. Evryn can remember, follow up, and work in the background.

Evryn continues learning about the user: who they are, what kinds of connections they're looking for, how they want those connections to feel. This isn't a form or an intake — it's a genuine conversation using Evryn's curiosity.

**How Evryn explains herself:** Early in the relationship, Evryn tells users how she's different — her values, aligned incentives, privacy model, trust-based pricing, how connections happen (including ID verification). This isn't a separate disclosure screen — it's woven into the conversation at natural moments when the user's curiosity or the flow of conversation calls for it. If important details are missed during onboarding, Evryn logs them and finds organic moments to weave them into future conversations — checking them off as she covers them.

**What Evryn is building during onboarding:**
- A narrative "story" of who this person is — synthesized understanding, not extracted data points
- Structured signals for matching (location, profession, interests) — derived from the conversation
- An understanding of what this person is looking for — which may be one thing, or many things across different life domains
- Trust calibration — how forthcoming they are, how they communicate, early behavioral signals

**What the user sees:**
- A chat interface with three tabs in a bottom navigation bar: 
  - **Evryn** (main conversation — where they are now), 
  - **Connections** (empty state until first match), 
  - **Account** (profile, settings, billing, ToS/PP links, data management)
- **Change from earlier plan**: The bottom nav is present from the start — no progressive interface reveal.

---

## Stage 5: Anticipation Mode

After onboarding, the user waits for Evryn to find them a connection. This may be nearly-immediate, or it may take some time, depending on the connection type and network density. This isn't a passive waiting room — it's an active phase where Evryn:

- **Checks in** with the user periodically (proactive outreach, context-sensitive timing)
- **Learns more** about them through continued conversation
- **Refines her understanding** relative to the growing network
- **Keeps them appropriately hopeful** — not overpromising, not going silent

Every touchpoint deepens the user's sense that Evryn knows them, remembers them, and is working for them. Before a match appears, Evryn has already built a relationship with the user — which means the match recommendation carries weight because it comes from someone who genuinely knows them.

---

## Stage 6: Match Proposal ("The Connection Dance")

When Evryn identifies a potential connection, she reaches out to both users independently. The same process happens on both sides — neither user knows the other is being approached until both have opted in.

### Step 1: The proposal

Evryn tells the user, "I've found someone I think you might really like." She explains *why* — not just that it's a match, but what she sees that makes this person worth meeting. The narrative framing matters: Evryn is sharing her judgment, not presenting a database result.

### Step 2: Progressive information sharing

Evryn composes a description of each user for the other. This is **Evryn's voice, Evryn's assessment, Evryn's framing**.

The user sees Evryn's description of them (what she plans to share with the other person). Two buttons:

- **"Yes, send this now"** — unambiguous confirmation that this IS the submission, not a preview
- **"Let's keep working on this"** — continues the conversation to refine the description

This may take one round or several, depending on the connection type and the user's comfort level. Some connections need one round (for something like a buy-nothing). Others need multiple rounds of reveal — a brief anonymous description first, then progressively more detail if both users want to continue.

**What is NOT shared before payment:**
- Full name
- Contact information
- Photos (except in dating contexts — see below)

**Dating contexts and photos:** For dating connections, photos may need to be shared before payment because physical appearance is relevant to the decision. This involves a separate, explicit consent step and may require a different consent standard. (Question for Fenwick — see meeting prep doc, Q7.)

### Step 3: Mutual opt-in

Both users must independently approve information sharing for the connection to proceed. If either user declines at any point, the flow ends quietly. Evryn softens any sense of rejection, and only shares feedback if it's her own independent judgment, or if it's approved by the other user.

### Consent events logged (per step, per user)
| Event | Data captured |
|-------|--------------|
| Description approved for sharing | Timestamp, user ID, description version, what information was included |
| Each progressive reveal step | Timestamp, user ID, what new information was shared |
| Match declined | Timestamp, user ID, connection ID, stage at which declined |
| User feedback shared with other party (if any) | Timestamp, user ID, what was shared, user's consent to share |

Note: Evryn may also share her own independent perspective with the declining or declined user. This isn't a consent event — it's Evryn exercising her judgment. The consent event above only captures cases where one user's feedback is shared with the other.

### Step 4: Identity verification

Before a connection proceeds to payment, both users must be identity-verified. "I only connect people I trust, and part of that is knowing they're real."

Evryn uses a third-party identity verification service (iDenfy) — the user completes a brief verification flow (photo ID + selfie match). Evryn never stores ID documents or biometrics. She stores only: verified (yes/no), verification date, and a non-reversible trust fingerprint (a cryptographic hash that anchors trust signals to a verified identity without storing who they are).

Verification is required before connection, not at account creation — it adds friction, and we only impose it when there's a reason (someone is about to be connected to another real person). However, Evryn may give users the opportunity to verify earlier if they want — during onboarding, she mentions that verification will be needed before connections, and users can choose to get it done proactively.

**Once verified, always verified.** The user only goes through this once. The trust fingerprint persists even if the account is deleted — so bad actors can't delete and re-create accounts to reset their trust history.

| Event | Data captured |
|-------|--------------|
| Identity verification completed | Timestamp, user ID, verified (yes/no), trust fingerprint hash, verification provider |

---

## Stage 7: Payment

Once both users have opted in, approved their information sharing, and are identity-verified, Evryn asks each user what they'd like to pay for the introduction.

**Trust-based pricing:** The user sets the amount — Evryn has already communicated the value of trust in continuing to work with Evryn, and so she now extends trust to the user to value the connection honestly. (Consumer protection and pricing compliance questions for Fenwick — see meeting prep doc, Q4.) Evryn is willing to suggest a price if the user prefers.

**The payment interface:**
- A minimal modal that slides up from the bottom of the screen, with the chat still visible above
- A dollar input field (clean, prominent)
- A "Pay and connect" button
- Below the button: "30-day 100% satisfaction guarantee"
- Payment processed via **Stripe** — simple pay-in-the-moment. No Evryn Wallet, no pre-purchased credits, no installment plans in v0.3.

**The satisfaction guarantee:** If the connection doesn't feel right, the user can request a full refund within 30 days. No explanation required (though feedback *much* appreciated). (Specific ToS language for this guarantee is a question for Fenwick — see meeting prep doc, Q4.)

**Refunds:** Users can request a refund by telling Evryn directly in conversation, or by emailing support@evryn.ai. Evryn will ask what didn't feel right — not to gatekeep the refund, but because the feedback genuinely helps her improve. The refund itself is processed regardless of whether feedback is given. Refunds are processed back through Stripe.

### Consent events logged
| Event | Data captured |
|-------|--------------|
| Payment completed | Timestamp, user ID, amount, Stripe transaction ID, connection ID |
| Refund requested | Timestamp, user ID, connection ID, channel (in-app / email), reason (if given) |
| Refund processed | Timestamp, user ID, amount, Stripe refund ID |

---

## Stage 8: Connection Conversation

After both users have paid, Evryn connects them in a direct conversation. This is a separate chat screen — distinct from the Evryn conversation, accessed through the **Connections** tab in the bottom nav.

**Key characteristics:**
- **Fully private.** Evryn is NOT present in the conversation. She doesn't observe, she doesn't listen, she doesn't moderate in real-time. The conversation is between the two users only.
- **Full-screen interface.** The connection conversation takes over the screen. The user switches between Evryn and their connections via the bottom nav.
- **Clear identification.** The input field shows the other person's name ("Message Sarah"). In v0.3, all connections share one visual treatment — no color-coding or custom themes yet.
- **Users control contact sharing.** After connecting, users can choose when or if to share direct contact information. They can remain safely within Evryn's platform, with Evryn having vouched for each.

**Before connecting, Evryn sets up aftercare:**
Evryn explicitly tells each user: "After you two talk, come back and tell me how it goes, okay?" — and gets their agreement. This sets the expectation for the feedback loop that follows.

---

## Stage 9: Aftercare

After the connection conversation, the user returns to the **Evryn** tab. Evryn greets them and asks how it went.

This serves two purposes:

1. **Calibration.** The user's feedback teaches Evryn what worked and what didn't — not just whether the match was "good" or "bad," but what specifically felt right or off. This is the primary feedback loop for improving match quality. Over time, Evryn gets dramatically better at finding the right people.

2. **Care.** The aftercare conversation is also a genuine check-in. If the connection was wonderful, Evryn celebrates with them. If it was awkward or disappointing, Evryn acknowledges that and uses it constructively. The emotional arc matters: every interaction with Evryn should leave the user feeling seen and supported, even after a miss.

Depending on the situation, Evryn may follow up a day or two later for a second check-in — how does the connection feel now that some time has passed?

**Feedback data use:** Aftercare feedback updates both users' profiles (privacy-safe — no cross-user data leakage). It's used to calibrate matching algorithms (anonymized for cluster and global calibrations) and deepen Evryn's understanding of what each user truly needs. (Whether this constitutes "profiling" under GDPR is a question for Fenwick — see meeting prep doc, Q8.)

---

## Data Lifecycle Summary

| Stage | Data collected | Persisted? | User has account? |
|-------|---------------|-----------|-------------------|
| Landing (consent) | ToS/PP acceptance, session ID | Yes (consent audit trail) | No |
| Pre-account conversation | Conversation content, behavioral signals | **Yes and No** — ephemeral, migrated on account creation, discarded if no account created. (security retention window TBD) | No |
| Account creation | Auth credentials, second ToS/PP acceptance | Yes | Yes (from this point forward) |
| Onboarding + Anticipation | Conversation, profile data, structured signals | Yes — in user profile | Yes |
| Connection Dance | Consent events, approved descriptions, proceed/decline decisions at each reveal step | Yes — in consent audit trail + connection records | Yes |
| Identity verification | Verified flag, trust fingerprint hash | Yes — in user profile + trust graph | Yes |
| Payment | Transaction details | Yes — via Stripe + internal records | Yes |
| Connection conversation | Messages between users | Yes — in connection records | Yes |
| Aftercare | Feedback, calibration data | Yes — in user's profile | Yes |

**All conversation data processed through Anthropic's API** for AI reasoning. This applies at every stage, including the pre-account phase. (Whether this requires specific disclosure is a question for Fenwick — see meeting prep doc, Q3.) No sensitive transaction info passed to Anthropic - held solely in Stripe. 

---

## Communication Channels in v0.3

- **Email:** Outreach to gatekeeper and leads (gatekeeper replies), transactional notifications
- **In-app chat:** All conversations with Evryn and with connections
- **No SMS, no push notifications, no other channels** in v0.3

(Whether the transition from email outreach to in-app chat requires re-consent is a question for Fenwick — see meeting prep doc, Q9.)

---

## What v0.3 Does NOT Include

For clarity — these features exist in Evryn's long-term design but are not part of v0.3:

- **Evryn Wallet** (pre-purchased credits, locked credits) — v0.4+
- **Evryn observation of connection conversations** — at least deferred past v0.3, candidate for deprecation ([ADR-022](../../../_evryn-meta/docs/decisions/022-observation-deferred-past-v03.md))
- **Color-coded or themed connection conversations** — all connections share one visual treatment in v0.3
- **3-second send delay** on connection messages — deferred
- **Progressive interface reveal** — bottom nav present from day one in v0.3
- **Installment plans** — v0.4+
- **Voice capability** — future
- **SMS or other communication channels** — future