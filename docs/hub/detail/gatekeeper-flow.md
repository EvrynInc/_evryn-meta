# Gatekeeper Flow

> **How to use this file:** End-to-end description of how Evryn works with a gatekeeper, from onboarding through steady state. Covers who initiates contact at each stage, what data flows where, and flags open legal questions. Can be shared with counsel as-is — legal questions will be resolved in place as counsel advises.
>
> **Companion doc:** `gatekeeper-approach.md` — operational playbook for gatekeeper partnerships (who we target, how we pitch, setup guides by email client, future tooling).
>
> **Pilot gatekeeper:** Mark Titus (August Island Pictures / Eva's Wild, Seattle). Film producer receiving ~200 emails/day from people seeking his attention — pitches, collaboration requests, referrals, cold outreach.

---

## The Gatekeeper Relationship in One Paragraph

A gatekeeper is someone who receives far more inbound contact than they can personally evaluate. Evryn takes that inbound off their plate — identifying which people are genuinely worth their time and handling the rest. Evryn is never inside the gatekeeper's inbox. The gatekeeper routes emails to Evryn, Evryn evaluates them, and connects the gatekeeper to the ones who seem like a great fit. Everyone who comes through a gatekeeper's inbound can become a full Evryn user in their own right — Evryn's obligation is to each person individually, not just to the gatekeeper who surfaced them.

---

## Phase I: Calibration (v0.2)

Mark forwards his inbound to Evryn. Evryn evaluates and notifies Mark about the people worth his time. No one who emailed Mark is contacted during this phase — it's pure calibration between Evryn and Mark.

### Step 1: Onboarding the Gatekeeper

Justin introduces Mark to Evryn. Evryn has a conversation with Mark to understand what he's looking for: what makes someone worth his time, what's noise, what matters to him professionally and personally. This is a one-time intake.

### Step 2: Forwarding Setup

Mark has a dedicated email address for inbound pitches and submissions (separate from his personal email). He sets up an auto-forward rule so that everything arriving at that address is automatically forwarded to Evryn's email address (evryn@evryn.ai).

**What this means:**
- Evryn never has access to Mark's inbox, credentials, or email account.
- Mark forwards a copy of each inbound email to Evryn. That's the full extent of the technical integration.
- Mark can stop the forwarding at any time by removing the forwarder.

### Step 3: Evryn Evaluates Inbound

For each forwarded email, Evryn receives the sender's name, email address, message body, and attachment metadata (she notes that attachments exist but does not currently process their contents). Evryn's AI reads each email and classifies the sender:

- **Gold** — genuinely worth Mark's time and a strong mutual fit.
- **Edge case** — potentially valuable, requires judgment.
- **Pass** — not the right fit for Mark right now.

Spam, scams, and bad actors are filtered out during triage and are not part of any outreach pathway.

### Step 4: Evryn Notifies Mark

For gold and edge-case classifications, Evryn drafts a notification for Mark explaining who the person is and why they're worth his attention. During this pilot phase, a member of Evryn's operations team reviews and approves every outbound message before it's sent. Mark receives the notification and decides how to proceed.

Pass classifications are not sent to Mark — the whole point is to remove that volume from his plate. All classifications are logged.

### Validation Period

During Phase I, Mark continues to sort his inbound as he normally would — nothing changes about his workflow. Evryn sorts in parallel. Mark can compare Evryn's classifications to his own judgment and give her his feedback. This builds trust and sharpens Evryn's calibration. If Mark doesn't like how Evryn is performing, he can help improve it — or he can also simply stop forwarding to her.

### Phase I: Who Contacts Whom

| Action | Direction | Legal posture |
|--------|-----------|---------------|
| Gatekeeper notification (gold/edge) | Evryn → Mark | Internal to the gatekeeper relationship; Mark authorized this |

No contact is made with anyone who emailed Mark during this phase. Evryn logs all inbound for future use.

---

## Phase II: Evryn Goes Active (v0.3+)

Once Evryn's calibration is solid — typically after a few weeks of seeing the quality of her work in Phase I — Evryn begins engaging with the people in Mark's inbound. This can happen through two pathways, which may both be active simultaneously.

### Pathway 1: Forwarding Continues

Mark keeps forwarding his inbound. Evryn now replies to everyone on his behalf, with Mark's authorization. The approach differs by classification:

**Gold** — clearly worth Mark's time. Evryn notifies Mark and reaches out to the person:

> "Hi [name] — you reached out to Mark about [topic]. I work with Mark to find the right connections for him, and I've put you in touch. He's got a lot on his plate, so it might be a moment — but I wanted you to know you're on his radar. In the meantime, finding the right connections for people is what I do — I'd love to hear more about what you're looking for."

**Edge** — potentially valuable, but Evryn needs more information to judge the fit. Evryn reaches out to learn more:

> "Hi [name] — you reached out to Mark about [topic]. I work with Mark to find the right connections for him — I'd love to hear more about what you're looking for and see if there's a great fit here."

**Redirect** — not the right fit for Mark right now. Evryn reaches out honestly:

> "Hi [name] — you reached out to Mark Titus about [topic]. I work with Mark to find the right connections for him. Unfortunately this isn't the right fit for Mark right now — but finding the right connections for people is what I do, so I'd love to hear more about what you're looking for and see if I can help."

**Legal posture for all Pathway 1 outreach:** Every message is a reply to something the person initiated (they emailed Mark), sent on Mark's behalf with his authorization.

#### Pathway 1: Who Contacts Whom

| Action | Direction | Legal posture |
|--------|-----------|---------------|
| Gold reply to sender | Evryn → person who emailed Mark | Reply, authorized by Mark, facilitating a connection Mark wants |
| Edge reply to sender | Evryn → person who emailed Mark | Reply, authorized by Mark, gathering information to evaluate fit |
| Redirect reply to sender | Evryn → person who emailed Mark | Reply, authorized by Mark, redirecting to Evryn's broader services |
| Gatekeeper notification (gold/edge) | Evryn → Mark | Internal; Mark authorized |

### Pathway 2: Direct Contact

Mark sets up an auto-responder or updates his contact page (or both) to direct people to Evryn:

*"I work with Evryn to find the right connections for me. If you think we'd be a great fit, reach out to her at evryn.ai — she'll take it from there."*

People now reach out to Evryn directly. From this point:

1. They want to reach Mark.
2. They see his auto-responder or contact page directing them to Evryn.
3. They reach out to Evryn.
4. Evryn has a conversation with them — gets to know them, what they're looking for, why they wanted to reach Mark.
5. If they're a strong mutual fit for Mark, Evryn facilitates the connection.
6. If they're not the right fit for Mark, Evryn helps them find other connections across all life domains.

Some people may still email Mark directly during Pathway 2 (they have his email, they're replying to old threads). These are forwarded to Evryn and handled via Pathway 1 — a reply to something the person initiated, authorized by Mark.

#### Pathway 2: Who Contacts Whom

| Action | Direction | Legal posture |
|--------|-----------|---------------|
| Person contacts Evryn | Person → Evryn | Person initiated at gatekeeper's direction; voluntary opt-in |
| Gatekeeper notification (gold/edge) | Evryn → Mark | Internal; Mark authorized |

### Everyone Becomes an Evryn User

Evryn's first priority is always whether someone is the right mutual fit for Mark — when they are, Evryn facilitates it. But Evryn also helps people find connections across all life domains, so someone who came through Mark's inbound might also find other opportunities, collaborators, or people that Evryn discovers for them. Everyone who reaches out to Mark gets taken care of, and Mark's reputation benefits from that.

**For the agreement:** Evryn always evaluates everyone from a gatekeeper's channel for mutual best fit with that gatekeeper. However, the same person may reach out to more than one gatekeeper at the same time, so the gatekeeper should assume no ownership or exclusive rights over people who come through their inbound.

---

## Phase I Backlog (v0.3 Launch)

During Phase I, Evryn logged ~200 emails/day but didn't contact anyone. When Phase II launches, these people are sitting in Evryn's records, never contacted. Evryn goes back and reaches them using the same Pathway 1 outreach — gold, edge, and redirect messages — applied to the backlog based on each person's original classification.

**Question for counsel:** The outreach messages are the same as Pathway 1, but with a significant time delay (weeks rather than days). Evryn is responding to the person's original email to Mark, on Mark's behalf and with his authorization. Does the time delay change the legal posture? Is a reply to an email sent weeks ago still a "reply" for CAN-SPAM purposes, or does the delay make it functionally unsolicited? Does Evryn need the gatekeeper's explicit endorsement for backlog outreach specifically?

### Backlog: Who Contacts Whom

| Action | Direction | Legal posture |
|--------|-----------|---------------|
| Backlog outreach (gold/edge/redirect) | Evryn → person who emailed Mark during Phase I | Reply to original email, authorized by Mark, but delayed; question for counsel |

---

## Data Handling Summary

**What Evryn receives:** Sender name, email address, message body, and attachment metadata from forwarded emails.

**What Evryn does with it:** AI-powered evaluation of fit, conversation with the sender, and — for people who become active users — ongoing profile building to find them the right connections.

**Where it's stored:** Evryn's database (Supabase, hosted PostgreSQL with row-level security and encryption at rest and in transit). Email content is also processed through Anthropic's Claude API for AI evaluation.

**Retention:** Raw forwarded email content has a 6-month retention period, then is purged. Information from those emails that pertains to a person who becomes an active Evryn user is incorporated into their user profile and retained for the life of the account.

**Human oversight:** During this pilot phase, every outbound message Evryn sends is reviewed and approved by a member of the operations team before it reaches anyone.

---
