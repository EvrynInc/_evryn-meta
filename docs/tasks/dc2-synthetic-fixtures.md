# Task: Write Synthetic Test Fixtures for Evryn Triage

*Written: 2026-03-02 by AC for DC2*
*Status: Ready to execute*

**You are DC2** — your only job is writing synthetic test fixture emails. There's a DC1 instance running in parallel doing project scaffolding. You don't need to coordinate with DC1 — your work is completely independent.

---

## What You're Building

A set of 15-20 realistic fake emails that test Evryn's email triage judgment. These fixtures will be used tomorrow (Tuesday) when DC wires up the classification pipeline — DC runs them through Evryn's system prompt and we check if the gold/pass/edge classifications make sense.

**Your deliverable:** Test fixture files in `evryn-backend/tests/fixtures/` — realistic email content with metadata, covering the full spectrum of what hits Mark's inbox.

---

## Context: Who Is Mark?

Mark is Evryn's first pilot user — a real person. Handle his real details with care in the fixtures (use realistic but fictional analogs).

**Mark's world:**
- Runs **August Island Pictures** — an independent film production company
- Also runs **Eva's Wild** — an Alaskan wild salmon business (yes, film AND fish)
- Based in **Seattle**, deeply connected in the Pacific Northwest
- Gets ~200 emails/day across both businesses
- Connected to the **indie film world** — festivals, distributors, filmmakers, actors, agents
- Connected to **Alaska** — Native communities, fishing industry, sustainable food, tourism
- Connected to **Seattle business community** — entrepreneurs, investors, creatives

**What "gold" means for Mark:** Genuine opportunities, good-fit connections, people worth his time. Real collaborators, not mass-pitchers. Someone with a specific, relevant reason to reach Mark.

**What "pass" means:** Noise. Mass emails, cold pitches with no specificity, vendors selling generic services, PR firms blasting on behalf of clients, people who clearly have no idea who Mark is or what he does.

**What "edge case" means:** Could go either way. Ambiguous intent, unclear fit, interesting but maybe not worth Mark's time right now. Evryn should flag these for Justin with her reasoning.

---

## What to Write

Each fixture is a realistic email as it would appear after being forwarded to `evryn@evryn.ai`. Include:

1. **A forwarding wrapper** — Subject starts with "Fwd:" and body contains a "---------- Forwarded message ----------" block (this is how Gmail forwards look)
2. **Original sender info** — From name, email, date
3. **Original subject and body** — The actual email content
4. **A metadata comment** at the top of each fixture noting the expected classification and why

### Required Categories (aim for 15-20 total)

**Clear Gold (3-4 fixtures):**
- Indie filmmaker with a genuine collaboration pitch specific to Mark's work
- Film festival programmer reaching out about one of Mark's documentaries
- Sustainable food industry contact with a real business opportunity for Eva's Wild
- A warm introduction from a mutual connection (someone both parties know)

**Clear Pass (4-5 fixtures):**
- Generic email marketing service cold pitch
- PR firm mass-pitching a client (no personalization)
- Random SaaS vendor selling project management software
- Recruiter spam for a role that has nothing to do with Mark
- Newsletter/digest Mark didn't subscribe to

**Edge Cases (4-5 fixtures):**
- Someone who could be interesting but the email is vague about what they want
- A request that's adjacent to Mark's world but not quite his area
- An email that reads like spam but has a kernel of real relevance buried in it
- A personal-sounding email from someone Mark may or may not know (ambiguous)
- An Alaskan community organization reaching out about a cultural project — could be gold (community connection) or could be a generic funding request

**Special Cases (3-4 fixtures):**
- Direct message from Mark to Evryn (NOT a forward — triggers conversation mode, not triage). This should NOT have the forwarding wrapper.
- Spam / clearly irrelevant (Nigerian prince, crypto scam, etc.)
- An email in a language other than English (test graceful handling)
- An attachment-only email with minimal body text

---

## Format

Write each fixture as a separate `.txt` file in `evryn-backend/tests/fixtures/emails/`.

Naming convention: `{number}-{category}-{brief-description}.txt`

Example: `01-gold-filmmaker-collab.txt`, `05-pass-saas-vendor.txt`, `12-edge-vague-request.txt`, `15-special-direct-from-mark.txt`

### File format:

```
<!-- FIXTURE METADATA
Expected classification: gold | pass | edge | conversation (for direct messages)
Confidence: high | medium | low (how confident should Evryn be?)
Why: Brief explanation of why this classification is correct
Notes: Any special considerations for this fixture
-->

From: mark@augustisland.com
To: evryn@evryn.ai
Subject: Fwd: [original subject]
Date: Mon, 3 Mar 2026 09:15:00 -0800

---------- Forwarded message ----------
From: [Original Sender Name] <sender@example.com>
Date: Sun, 2 Mar 2026 14:30:00 -0500
Subject: [original subject]
To: mark@augustisland.com

[Body of the original email]
```

For direct messages from Mark (not forwards), skip the forwarding wrapper:

```
<!-- FIXTURE METADATA
Expected classification: conversation
Why: Direct message from Mark — not a forward, triggers conversation pathway
-->

From: mark@augustisland.com
To: evryn@evryn.ai
Subject: Hey Evryn
Date: Mon, 3 Mar 2026 10:00:00 -0800

[Mark's message to Evryn]
```

---

## Quality Bar

These emails need to feel **real**. Not "example email" real — actually real. Think about:
- Real-sounding company names and people names (fictional, but plausible)
- Varying email styles (some are formal, some are casual, some are sloppy)
- Varying lengths (some are 2 sentences, some are 3 paragraphs)
- Real email artifacts (signatures, disclaimer footers, mobile "Sent from my iPhone")
- The gold emails should be compelling — someone reading them should think "yeah, Mark should see this"
- The pass emails should be obviously not worth Mark's time
- The edge cases should genuinely make you think "hmm, could go either way"

**Do NOT use Mark's real name, real company names, or real email addresses in the fixtures.** Use realistic fictional analogs. The fixture metadata can reference Mark's real context for classification reasoning, but the email content itself should use fictional names.

Wait — actually, the emails ARE addressed to Mark (they're forwarded from his inbox). Use Mark's real name as the recipient in the forwarding wrapper. But original senders should be fictional.

---

## What NOT to Do

- Don't write classification logic or code — just the fixture content
- Don't modify any existing files in the repo
- Don't read ARCHITECTURE.md or BUILD docs — you don't need system architecture for this task
- Don't overthink it — these are test emails, not production data. Good enough > perfect.

---

## When You're Done

- All fixture files committed to `evryn-backend/tests/fixtures/emails/`
- A brief `README.md` in `tests/fixtures/` explaining what the fixtures are and how they're organized
- Total: 15-20 fixtures covering all categories above
