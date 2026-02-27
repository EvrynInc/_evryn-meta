# Evryn Foundation Architecture

> **How to use this file:** Deep dive on the two-entity structure (Evryn Inc. + Evryn Foundation), cryptographic architecture, trustee governance, and Trust Severance Protocol. Sub-spoke of the [long-term-vision spoke](../long-term-vision.md). Read this when evaluating anything related to data sovereignty, legal resilience, Foundation governance, or cryptographic trust infrastructure.
>
> **Do not edit without Justin's approval.** Propose changes; don't make them directly.

---

## Jurisdictional Trust Architecture

*Trust can't be promised. It has to be structured.*

Whoever controls Evryn's trust data holds the most intimate understanding of millions of people's behavior, relationships, and vulnerabilities. That's a weapon. Every architectural decision, every governance structure, every exit scenario has to be evaluated against this reality.

### Evryn Foundation (Switzerland)

A planned nonprofit entity operating the **Privacy-Sovereign Trust Core**. Switzerland chosen for its privacy protections and resistance to foreign intrusions. Governed by a multinational board under a mission-locked charter.

**What lives inside the Trust Core:**
- Trust graph and behavioral memory
- Match rationale logs (including rejection logic)
- Structured psychological profiles and archetype impressions
- Consent-aware contact, timing, and availability data
- Rejected match history and sensitive social signals
- Abuse pattern detection and protective risk models
- AI inference logs that inform trust-based decisions
- Encrypted session summaries and evolving reputation scores

### Evryn, Inc. (Delaware)

Revenue-generating interface and primary operator. Handles product, payments, billing, marketing, LLM integrations (firewalled from trust graph).

### The Inc.–Foundation Relationship

The Foundation exists to serve the Evryn mission, not Evryn Inc. specifically. Inc. is the Foundation's *current* operator — the entity that builds the product and serves users. The relationship is governed by a licensing agreement:

- Inc. accesses the Trust Core through narrow, consent-governed APIs
- Only actionable instructions returned — no raw behavioral memory
- All access logged, rate-limited, revocable
- Even the CEO cannot access private trust memory

**The tie:** The Foundation is bound to Inc. as long as Inc. operates within its Public Benefit Corporation charter. This isn't a voluntary partnership — it's structural. The Foundation doesn't shop for the best operator; it serves the mission-aligned one.

**Operational arrangement:** Inc. maintains the Foundation's infrastructure and covers costs directly — the Foundation doesn't need to raise capital independently or seek reimbursement. Inc. has visibility into the Foundation's infrastructure (necessary for maintenance and monitoring). However, the Foundation must assume that any code update from Inc. could contain exfiltration attempts — intentional or otherwise. The Foundation maintains independent code review and stripping processes for all updates touching trust-sensitive systems. Trust the relationship; verify every artifact.

**Data firewall by agreement:** The licensing agreement explicitly states that the Foundation will refuse any request for raw trust data — even from Inc., even if Inc. claims legal compulsion. This is by design: if Inc. receives a government demand (e.g., a National Security Letter), Inc. forwards the request to the Foundation, and the Foundation refuses. Inc. has complied with the demand (they forwarded it); the Foundation has complied with its charter (they refused). This can happen all day.

**The severance trigger:** If Inc. materially breaches its original PBC mission — *"to foster trusted human connection for our users by developing systems that create high-resonance connections, responsibly steward personal information and insights, and structurally protect emotional wellbeing, informed consent, and relational alignment and trust across every interaction"* — as determined by the Foundation's independent board, the Trust Severance Protocol activates. "Original" is key: a corrupt Inc. board cannot amend the mission and then claim compliance. The mission text is anchored at incorporation. Amendments to the mission require mutual agreement between Inc. and the Foundation — neither can unilaterally redefine what counts as alignment.

**Reverse severance:** If the Foundation itself goes rogue (board capture, mission drift, operational failure), Inc. must have the ability to trigger a shutdown or transition from its side. The mechanism TBD, but the principle: neither entity should be able to hold the other hostage. Both must be accountable to the mission, not to each other.

### Cryptographic Architecture

The Foundation's infrastructure is designed so that even a full breach yields nothing readable. Three layers:

**End-to-end encryption.** All conversations — including conversations with Evryn herself (since Evryn is a user in her own system) — are encrypted between parties. The Foundation's storage holds only ciphertext.

**Hardware-protected key management.** Evryn's processing key lives inside a Hardware Security Module (HSM) — a tamper-resistant physical device. The key was generated inside the HSM, is used inside the HSM, and has never existed outside it. No person ever sees or holds the key. If the device is physically tampered with, it self-destructs. Day-to-day, Evryn's software sends encrypted data to the HSM, the HSM decrypts it for processing inside a secure environment, and results are re-encrypted before leaving. No human touches the key — the system runs autonomously.

**Threshold key recovery.** If the HSM hardware fails, the key must be reconstructable. At setup, the HSM generates recovery shares — pieces of the key split across multiple independent trustees (e.g., 5 shares, any 3 required to reconstruct). No individual share is useful on its own. Reconstruction happens only inside a new HSM — the key is never exposed in plaintext even during recovery. Trustees are an emergency recovery mechanism, not an operational role — they may go years without being called.

### Trustee Governance

Trustees hold recovery shares for the Foundation's cryptographic infrastructure. This is a fiduciary role with strict constraints:

- Minimum 5 trustees, threshold of 3 required for any key recovery
- No more than one Evryn Inc. officer may hold a share at any time (the founder can be a trustee, but Inc. can never accumulate enough shares to act unilaterally)
- Trustees distributed across multiple jurisdictions (compelling a threshold requires simultaneous legal action in multiple countries with different privacy laws)
- Mix of: Foundation board members, independent privacy/security experts, and potentially a user representative

**Open legal question for Fenwick:** Does the founder holding a trustee share while serving as CEO of Inc. create a veil-piercing risk for the Foundation's independence? If so, the founder's share should transfer to an independent party upon any event that could be construed as Inc. controlling the Foundation.

### Trust Severance Protocol

If Evryn Inc. breaks its mission, the trust data doesn't become a prize. A pre-defined protocol activates:

1. **Warning.** Foundation board formally notifies Inc. of mission breach. Inc. has a defined cure window (e.g., 90 days).
2. **Restriction.** If uncured, Foundation restricts Inc.'s API access to read-only — no new connections brokered through Inc. Users are notified transparently.
3. **Severance.** Foundation formally severs from Inc. Users are notified and given a data export window (their vault, their connections). Foundation enters **custodial mode** — infrastructure maintained, no licensing to any operator.
4. **Resolution.** The Foundation board has a defined window (e.g., 2 years) to evaluate paths forward:
   - A qualified successor emerges, passes independent mission-alignment audit → Foundation re-licenses under identical constraints.
   - User governance mechanisms (if mature) vote on next steps.
   - No suitable path found → structured wind-down. Users export their data. Trust graph is destroyed.
5. **No fire sale.** The charter explicitly prohibits selling or auctioning the trust data. Any successor must meet predefined mission-alignment criteria verified by independent audit.

**Why destruction is a valid ending:** Evryn's purpose is to connect the right people. Once she's done that — once the connections exist in the real world — the work is done. Maybe Evryn is a seed: she exists for a season, connects the good people, and the world is better for a thousand years because of it. Not everything needs to last forever. What matters is that the trust data is never weaponized.

### Warrant Canary

If the Foundation receives a legal demand it cannot disclose (the Swiss equivalent of a National Security Letter), a **warrant canary** — a regularly published statement confirming no undisclosed legal demands have been received — goes silent. Users monitoring the canary know, through omission: *something has changed.* This doesn't violate the gag order (it's the absence of speech, not speech itself). Implementation details TBD; the principle is that users should always have a detectable signal if the Foundation's independence has been compromised.

### The Honest Trust Surface

No system has zero trust surface. Evryn's architecture minimizes what must be trusted and maximizes accountability for what remains:

- **Hardware trust:** The HSM manufacturer. Mitigated by using industry-standard, independently audited devices.
- **Code trust:** The software running inside secure environments. Mitigated by reproducible builds and independent code audits.
- **Governance trust:** The Foundation board and trustees. Mitigated by multi-party thresholds, jurisdictional distribution, and charter constraints.
- **Inference trust (current):** The external AI provider sees data during LLM processing. Mitigated by PII anonymization and Zero Data Retention agreements. Eliminated long-term by self-hosted models inside the Foundation's secure infrastructure (see [technical-vision spoke](../technical-vision.md), LLM Constraint).

Evryn commits to being transparent about exactly what is trusted and what isn't. Users deserve to know the real trust surface, not a marketing version of it.

---
