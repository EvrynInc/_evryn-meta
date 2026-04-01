# Voice AI Stack — Research Report

*Last updated: 2026-01-26*

Landscape assessment of real-time voice AI platforms for potential Evryn integration.

---

## The Landscape Has Changed Fast

Real-time voice AI is now viable. Sub-second latency is achievable. The key players:
- **Vapi** - Developer-focused, sub-500ms latency, Claude integration, partners with Hume AI
- **Retell AI** - Easier interface, 800ms latency, 4.8/5 reviews for natural conversation
- **Hume AI** - Emotion detection specialist, Empathic Voice Interface (EVI), 150ms TTS
- **ElevenLabs** - Voice synthesis, 10K+ community voices, instant cloning from 10-sec sample

---

## Emotion Detection is Real

Hume AI's EVI measures "tune, rhythm, and timbre of speech" to detect emotional state in real-time:
- Frustration, urgency, satisfaction, confusion
- Knows when to speak and when to wait
- 91-98% accuracy on benchmark datasets
- Back-channeling support ("mm-hmm", etc.)

This is genuinely useful for relationship-focused AI (Evryn) or any application where understanding how someone feels matters as much as what they say.

---

## Deception Detection Exists, With Caveats

Voice-based lie detection (~88% accuracy) analyzes pitch shifts, tone changes, pauses, hesitation. Useful as one signal among many, not as verdict. Best for "something feels off, dig deeper" rather than "this person is lying."

---

## Platform vs. Build

Don't build voice infrastructure from scratch. Platforms like Vapi/Retell handle:
- Telephony infrastructure
- Speech-to-text
- Turn-taking / interruption handling
- Voice synthesis
- LLM integration

Cost: ~$0.05-0.10/min total. Worth it vs. months of custom engineering.

---

## Voice is Separate from Email Infrastructure

Voice platforms provide their own phone numbers. No Google Workspace seats needed. Can even dial into Google Meet as a phone participant. This is additive, not replacement.

---

## Sources

- [Vapi](https://vapi.ai/)
- [Retell AI](https://retellai.com/)
- [Hume AI](https://hume.ai/)
- [ElevenLabs](https://elevenlabs.io/)
