Hi Andrea, Natalie, and Ana,

Thank you for the drafts — the structure is solid and the gatekeeper email forwarding pathway is well-covered. I can see the questionnaire came through clearly in how you approached the data handling and email processing sections.

I'm assuming these drafts are scoped to Phase 1 — getting us through Mark and the first few gatekeepers. I'm answering with that assumption, so I'm not flagging things that are obviously "full product" concerns. But there are some items where even for Phase 1, I think we need to get it right from the start, and a few things that have shifted since I sent the questionnaire about a month ago.

I'll go through the margin note questions first, then the Terms, then the Privacy Notice.

---

## Responses to Your Margin Notes

**Section 4 (Terms) — passive acceptance vs. "I agree" click:** Agreed — let's require affirmative acceptance ("I agree") for any changes to Terms. Trust is core to what we're offering, and passive acceptance undermines that. For the initial acceptance, we'll need a click-through since Mark (and future gatekeepers) will be agreeing before they start forwarding email.

**Section 7 (Terms) — fee structure:** This is the biggest item in the review — the tier/subscription language doesn't match our model at all. More detail below in the Terms section.

**Section 9(b) (Terms) — future phases language:** Understood on the rationale. I have some concerns about the breadth — details below.

**Privacy Notice — "customers" vs. "end users":** The customer/end user distinction doesn't quite fit our model. Everyone who interacts with Evryn is a "user." Mark is a user. The people who email Mark and get identified by Evryn are users. The difference is that Mark has a specific role (gatekeeper) — he forwards email, Evryn evaluates it, and everyone who comes through his inbound becomes a full Evryn user in their own right. So I'd suggest: everyone is a "User," and "Gatekeeper" describes the specific role of users like Mark who route their inbound to Evryn. Happy to discuss the best way to structure this.

**Privacy Notice — accounts:** Yes, accounts (user records) are created. Importantly: Evryn creates a user record for every person who emails Mark as soon as that email is forwarded — before the person has any interaction with Evryn or even knows Evryn exists. During Phase 1 (calibration), we're only notifying Mark — we don't contact any of those people. But we are storing their name, email address, message content, and Evryn's classification and reasoning about them. I think this needs to be disclosed clearly, especially since Phase 2 (outreach to those people) is only a few weeks later.

**Privacy Notice — other PI categories:** The additional categories (conferences, job applications, business development) are fine to keep for coverage. "Interactive Features" referencing social media pages feels slightly off — we don't have social media pages or public sharing features — but I understand it's there for if/when we do. Happy to leave it.

**Privacy Notice — Google Analytics:** Good catch. We'll confirm that "sharing with Google products and services" is disabled. Action item on our end.

---

## Terms of Service

### 1. Section 1 — Description of Services needs to be broader

The current language describes Evryn as "an intelligent email assistant and contact management platform." Even for Phase 1, this is too narrow — it frames Evryn as a tool rather than what she actually is. Mark isn't getting an email sorter; he's working with a relationship broker who happens to receive input via email forwarding right now.

Suggested framing: Evryn is an AI-powered relationship broker that evaluates inbound contacts on behalf of users, identifies high-quality mutual connections, and — in future phases — facilitates introductions across professional, creative, and personal domains. The initial service involves processing user-forwarded email communications to identify, evaluate, and classify contacts according to mutual fit, relevance, and connection quality.

This is accurate for Phase 1, doesn't overstate what we do today, and doesn't box us into "email assistant" when we expand in weeks.

### 2. Section 7 — Pricing model needs a full rewrite

This is the biggest mismatch between the drafts and our actual model. Evryn has no subscriptions, no tiers, no recurring billing. Our pricing model is:

- Per-connection, trust-based pricing: users choose what they believe is fair for each connection
- 100% satisfaction guarantee: users can adjust payment after a connection (up or down, including to zero)
- Pre-purchases: users can buy future connections (completed Stripe transactions, not deposits)
- Evryn Credit: non-monetary promotional value (non-withdrawable, can be used for connections, can be re-gifted)
- Peer-to-peer payments via Stripe Connect (for follow-up work between connected users — Evryn may take a small commission)

For Phase 1, there are no payments at all — Mark's gatekeeper service is free (the triage IS the value to gatekeepers, and it's our acquisition channel). But whatever payment language we put in the Terms now will be what's live when payments do start in a few weeks (v0.3). I'd rather get it right now than have wrong language up.

If it's simpler, we could remove the payment section entirely for this version and add it when v0.3 launches — but given the timeline (~2-3 weeks), it may be more efficient to write it correctly now.

The 10-day refund window followed by "YOUR PURCHASE IS FINAL" directly contradicts our 100% satisfaction guarantee, which is a core part of the model and something we'll be telling users from day one.

### 3. Section 9(b) — Data license is broader than it needs to be

Two specific concerns:

(a) "Publicly display and publicly perform" Customer Email Data — this is email content that is supposed to be private. Evryn's entire value proposition is that user data is isolated and never shared without explicit permission. Having "publicly display" in the license, even if we'd never exercise it, undermines the trust story if anyone actually reads the Terms. Can we scope this to internal use (operating, providing, and improving the Services)?

(b) "Fine-tune Evryn's machine learning models" — our plan (described in the questionnaire follow-up) is to only use anonymized data for model training. Can the license specify that any data used for model training will be anonymized/de-identified first? This is a commitment we want to make and keep.

I appreciate the "future phases" rationale in your margin note. I'd rather add breadth when we need it than start with more rights than we intend to exercise — especially given the trust-first positioning.

### 4. Section 10(a) — PII prohibition contradicts normal use

The prohibition on transmitting PII through the Services has a carveout for "name, email address, and phone number." But forwarded emails routinely contain much more personal information in their body text — professional history, project details, personal circumstances, sometimes financial information or health references. That's inherent to what email contains, and processing that content is the core service.

As currently written, a gatekeeper forwarding a typical inbound email would be violating the Terms. Can we rework this to prohibit intentional transmission of the specifically regulated categories (PHI, MNPI, cardholder data, etc.) while acknowledging that email content processed through the Services will naturally contain personal information?

### 5. Missing — No guarantee of matches + right to stop matching

I flagged this in the second addendum (Feb 25), and I think it's important even for Phase 1:

- No guarantee that Evryn will surface any particular contact as "gold" — this is Evryn's judgment, not a mechanical process
- Evryn may stop providing services to users who behave in harmful or exploitative ways, without explanation
- When individual user expectations and community safety conflict, safety takes priority

This language protects us if a gatekeeper complains that Evryn missed someone, or if we need to decline service to someone in the future. Better to have it from the start.

### 6. Missing — Professional services disclaimer

Evryn connects people across all life domains, including contexts that overlap with regulated professions (therapy, legal, financial). Even in Phase 1, if Mark asks Evryn for advice about a contact who happens to be a lawyer, we need the Terms to be clear that Evryn is a connection broker, not a licensed service provider. Any professional services that result from a connection are between the individuals.

### 7. Missing — Disclaimer for user-to-user agreements

I flagged this in the third addendum (Feb 28). When Evryn connects two people and they subsequently enter into a business arrangement, hire each other, or transact for services, Evryn is not a party to that agreement. Evryn facilitates the introduction and may process payments through Stripe Connect, but has no role in — and no liability for — the quality, delivery, or outcomes of any work between connected users.

### 8. Gatekeeper-specific relationship

Our architecture doc flags this as a pre-launch checkpoint: gatekeepers like Mark are users (covered by the general Terms), but they also enter a specific operational relationship — forwarding email, data handling for forwarded content, expectations about what Evryn does with that data, understanding that people from their inbound become Evryn users (not the gatekeeper's "leads").

Question: Do these Terms adequately cover the gatekeeper relationship, or should Mark sign something additional — a short gatekeeper agreement or addendum that covers the forwarding arrangement, data handling, and the principle that Evryn's obligation is to each user individually? If so, can we make that gatekeeper agreement template-ready so it works for future gatekeepers too?

### 9. Missing — Crisis protocols (can wait, but flagging)

The questionnaire described how Evryn may break normal privacy boundaries during mental health crises or illegal activity disclosures. For Phase 1 this is low-risk (Evryn is only communicating with Mark, and Justin reviews everything). But it's worth noting for the next revision — we'll want this before Evryn is having direct conversations with the broader user base.

---

## Privacy Notice

### 10. Safety identifier / trust imprint on deletion

This was a major item in the questionnaire that I was hoping to see addressed. When a user deletes their account, we purge personal data but retain a non-reversible salted hash that lets Evryn recognize if the same verified person creates a new account — and remember the nature of our willingness to do business with them, without retaining any identifying information. We asked for guidance on how to disclose this and ensure compatibility with GDPR right to erasure and CCPA deletion rights.

I don't see this in the Privacy Notice. Even for Phase 1, I'd like to get the disclosure right from the start — it's a core architectural decision and changing the framing later is harder than getting it right now. Can we add language covering this?

### 11. Data retention needs specifics

Section 7 of the Privacy Notice is generic. We provided specific retention periods in the questionnaire:

- Raw forwarded emails: 6-month retention, then purged
- User profiles and conversation history: life of account
- Connection decisions and reasoning: retained as long-term audit trail
- Safety identifier (post-deletion): retained indefinitely
- Identity verification artifacts: never stored by Evryn
- Payment records: per standard financial record-keeping requirements

Can we incorporate these specifics? They're a trust differentiator — most privacy notices are vague about retention. Being specific signals that we've actually thought about it.

### 12. Automated decision-making — "no significant effects" language

Section 3.6 says automated assessments "do not produce legal or similarly significant effects on individuals." I'm not sure this is accurate for our model. Evryn's classifications determine whether someone gets surfaced to a gatekeeper — which for a filmmaker trying to reach Mark, could meaningfully affect their professional opportunities. And once we're in Phase 2, Evryn's trust assessment determines what connections a user is offered, which is the entire value of the service.

I'd rather be transparent about this than minimize it. Can we revise to acknowledge that automated assessments meaningfully influence service delivery (which connections are offered), while noting that all classifications are currently subject to human review before action is taken? This is also more defensible if regulators look at it.

### 13. User record creation for people who haven't signed up

This connects to the accounts question in your margin notes. During Phase 1, Evryn creates user records for ~200 people per day who emailed Mark — before those people know about Evryn. We store their name, email, message content, and our AI's classification and reasoning about them. During calibration (Phase 1), we don't contact them. But when Phase 2 launches (a few weeks later), we reach out on Mark's behalf.

I think the Privacy Notice needs to address this — both what we collect and the legal basis for collecting it (the emails were forwarded to us with the gatekeeper's authorization, and the contact is a reply to something they initiated). What's the right way to handle this?

### 14. User isolation / data firewalling

This is a major trust differentiator that's worth featuring in the Privacy Notice, not just leaving as an assumption. Each user's data is architecturally isolated — enforced at the database level (row-level security), not just by AI instructions. The only pathways where information crosses between users are: (1) Evryn-mediated introductions where both parties explicitly approve what's shared, and (2) direct communication after bilateral consent. We described this in detail in the questionnaire. Even if brief, I think a sentence or two about structural data isolation strengthens the Notice.

---

## Things That Have Shifted Since the Questionnaire

A few things have evolved in the month since I sent the questionnaire that you wouldn't have known about:

**1. User records are created immediately for all email senders.** The architecture now creates a user record in our database for every person whose email is forwarded by a gatekeeper, as soon as the email arrives. This means we're building user records for people who haven't interacted with Evryn. I mentioned this above, but wanted to flag it as a change from the questionnaire, which described logging emails rather than creating user records.

**2. Evryn researches people online before classifying.** As part of evaluating whether someone is a good fit for a gatekeeper, Evryn may search the web for publicly available information about them — looking up their company, public profile, professional background. This was mentioned in the questionnaire's service providers table (web search API), but I want to make sure it's clearly disclosed in the Privacy Notice as a data collection practice.

**3. Reasoning traces are stored for every classification.** Every time Evryn classifies an email, she records a detailed reasoning trace — what she considered, why she classified it as she did, her confidence level, and the specific signals she relied on. This is essentially automated profiling data. It's used for Evryn's own learning and for audit trail purposes, and every approval/rejection by the human reviewer is also captured as training data.

**4. v0.3 (cast-off outreach + payments) is only ~2-3 weeks after v0.2 launch.** The timeline between "Evryn silently classifies Mark's email" and "Evryn starts contacting people and accepting payments" is very short. This is why I'm pushing on some items that might otherwise seem like "later" concerns — they're really only weeks away.

---

## Summary of What I Think We Need

**Revise now (Phase 1):**
1. Section 1 — broaden service description from "email assistant" to "relationship broker"
2. Section 7 — rewrite payment section for trust-based per-connection pricing (or remove and add with v0.3)
3. Section 9(b) — tighten data license (remove "publicly display/perform," scope training to anonymized data)
4. Section 10(a) — fix PII prohibition so normal email forwarding isn't a violation
5. Add: no guarantee of matches, right to stop matching, community safety priority
6. Add: professional services disclaimer
7. Add: user-to-user agreement disclaimer
8. Privacy Notice: customer/end user terminology → everyone is a "User," gatekeeper is a role
9. Privacy Notice: add safety identifier / trust imprint on deletion
10. Privacy Notice: specific data retention periods
11. Privacy Notice: revise automated decision-making language for accuracy
12. Privacy Notice: disclose user record creation for gatekeeper email senders
13. Privacy Notice: disclose web research as a data collection practice
14. Implement affirmative "I agree" acceptance

**Resolve:**
15. Does Mark need a separate gatekeeper agreement, or are the general Terms sufficient?
16. What's the consent framework for contacting the ~200 people/day from Mark's backlog when Phase 2 launches? (Time-delayed "reply" question from the gatekeeper flow doc)

**Fine for next revision (Phase 2 / v0.3+):**
- Cast-off outreach consent framework (detailed — beyond the backlog question above)
- Trust assessment / behavioral profiling disclosure (gets substantive in v0.3+)
- AI-initiated communication consent (proactive outreach)
- Sensitive personal data categories (when users have direct conversations)
- User isolation language (nice to have now, essential at scale)
- Crisis protocol disclosure
- Data portability specifics

Happy to jump on a call if it's easier to work through any of this in real time. And as always, I appreciate how thorough you've been — the foundation is strong and most of this is additive rather than corrective.

Best,
Justin
