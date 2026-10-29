# FUTURE — The Advanced Moat (post-v1)

> The really-ahead-of-the-market ideas. We are NOT building these now — they'd sink a v1.
> We revisit this list only after the core app is shipped, used, and trusted.
> Open by design: add wild ideas here freely. Nothing here is a commitment.

**Rule:** every item stays in this doc until the core loop (capture → private memory → reminders/drafts) has real, retained users. Shipping beats visionary. This is the vault of "later."

---

## Tier 1 — Natural next moats (v2, once core works)

1. **On-device personal fine-tuning.** A tiny per-user LoRA that adapts to *your* voice, habits, and vocabulary — trained locally, never uploaded. "An AI that literally becomes more yours the longer you use it, and still never phones home." This is a genuine differentiator Apple/Google won't do per-user.
2. **Proactive ambient agent.** Instead of waiting to be asked, it surfaces the right thing at the right moment ("you told me to prep for the Henderson meeting — here's the summary") using on-device triggers (time, location, calendar) — all local.
3. **Tool-calling fine-tune.** The one training investment worth making: a 3B model tuned on *our* exact tool schemas to push automation reliability up. Funded by the friend's GPUs. (See PRODUCT.md §5.)
4. **Private multi-device mesh.** Your phone, tablet, laptop, watch share one encrypted memory via end-to-end sync (never through our servers). Your "second brain" follows you across devices, still private.

## Tier 2 — Platform & capability expansion

5. **Voice-first / always-listening (on-device wake word).** Fully local speech in/out so it feels like talking to a person, with zero audio ever leaving the device.
6. **Local multimodal.** See documents, photos, whiteboards, receipts — reason over them on-device (Gemma 3n is already multimodal).
7. **Apple Watch + wearables as real capture surfaces.** Raise-to-talk capture, glanceable reminders, haptic nudges — thin client, phone does the thinking.
8. **Alexa / smart-home skill.** A separate surface into the same private brain (with a clear, honest privacy boundary since these devices are cloud-tied).
9. **Deeper Android automation.** Where policy allows, richer on-device actions than iOS permits.

## Tier 3 — Trust & privacy as a category-defining moat

10. **Verifiable privacy.** Cryptographic attestation / open-source client so security-obligated pros (and their compliance officers) can *prove* the data stays local. Turns "trust us" into "verify us."
11. **Attested confidential-compute for the boost tier.** When escalation happens, route to Apple-Private-Cloud-Compute-style verifiable, zero-retention inference — so even "cloud" means "provably not logged."
12. **Compliance packs.** HIPAA/GDPR/privilege-friendly configurations and export/audit tools sold to professional segments. The wedge becomes a wedge *product line*.
13. **Local differential privacy for any opt-in aggregate learning** — improve the product from patterns without ever seeing individuals' data.

## Tier 4 — Ecosystem & long game

14. **Private skill/agent marketplace.** Users and third parties add capabilities (like the terminal-agent world has), but sandboxed and privacy-preserving — the "app store" for your private agent.
15. **Federated learning across consenting users** — the model gets smarter for everyone without any raw data leaving any device.
16. **"Bring your own model" as a first-class feature** — power users run any open model; we're the trusted private *runtime + memory + agent*, model-agnostic.
17. **Personal API / local automations platform** — advanced users wire the agent into their own workflows, all on-device.
18. **Legacy / continuity** — encrypted, user-controlled inheritance of one's personal AI memory.

---

## Wild / futuristic (unfiltered — revisit far out)

- A personal AI that runs a *lifelong* private memory graph — decades of you, searchable, never leaked.
- On-device agents that negotiate/act on your behalf with *other people's* agents (privacy-preserving agent-to-agent).
- Emotion-aware but *non-manipulative-by-design* support (the opposite of engagement-maxxing companions) — a genuinely ethical companion, once the law and our safety systems are mature enough to do it responsibly.
- Hardware: a dedicated private-AI companion device (only if the software wins first — remember Rabbit and Humane died here).

---

*Nothing in this file gets built until `MASTER.md §10 v1.0` is real. Park ideas here; ship the core.*
