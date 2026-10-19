# MASTER — The Whole Story

> The one document that holds everything: what we're making, why, for whom, how, and when.
> Working codename: **Vault** (placeholder — final name TBD). Owner: Talha. Started: 2026-07-14.
> This is the north star. Every other doc (PRODUCT, FUTURE, WIREFRAMES) hangs off this one.

---

## 1. The one-line

A private AI **agent** that lives on your phone, remembers everything about you, and helps you get things done — and your data physically never leaves your device unless you explicitly say so.

## 2. Why this exists (the origin)

A friend described what he actually wanted: a personal AI that knows everything about him, goes with his flow, supports him, and does things for him — but with 100% peace of mind that his data isn't going to someone else's servers. He'd back it with money and GPUs.

The insight underneath it: **powerful agent tools already exist (terminal agents, cloud assistants) — but they're built for technical people, or they run in the cloud where your life becomes someone's training data.** Hundreds of millions of non-technical people want the capability without the terminal and without the surveillance. Nobody has cleanly served that intersection.

## 3. The gap we're attacking

| What exists | The catch |
|---|---|
| Cloud AI assistants (ChatGPT, Gemini, Replika) | Powerful, but your data lives on their servers |
| On-device chat apps (PocketPal, Private LLM) | Private, but just chat — not agents, and built for hobbyists |
| Terminal agents (Open Interpreter, Claude Code, Hermes-style) | Genuinely agentic, but only technical people can use them |
| OS assistants (Apple Intelligence, Gemini Nano) | Private + on-device, but generic and locked to the platform |

**The empty square:** private **+** genuinely agentic **+** persistent personal memory **+** dead-simple for non-technical people, all at once. That's us.

## 4. The bet (thesis)

1. Small language models are good enough *today* to be a useful private assistant, and improving fast.
2. The winning promise is **privacy + memory + a warm, simple experience** — not out-reasoning the frontier models. We don't try to be smarter than Claude; we try to be *yours*, and *safe*.
3. The mass market is unreachable on day one. We win a **narrow, high-trust wedge first**, prove it, then expand outward on the same engine.

## 5. Who it's for (universal product, focused launch)

**The product is for anyone.** It's a blank slate that becomes a personalized version of *you* — whatever your world is: lawyer, chef, doctor, student, founder. It excludes no one; it adapts to whoever opens it. That universality IS the vision.

**The launch is free and aimed at who we can reach.** No paywall (like OpenClaw/Hermes) — on-device means ~zero cost per user, so free is sustainable and drives adoption. The first users come from the founder's **own network — developers, IT people, privacy-minded tech folks** — because a solo founder's real edge is distribution he can actually reach. It's a launchpad, not a limit: anyone can use it. Honest tradeoff: that audience is the most competitive (OpenClaw/Hermes serve it free) and least likely to pay, so we win them on quality + true on-device privacy, then expand to the non-technical majority — who'll pay for convenience — later. Money comes later and optionally (hosted tier / pro / B2B), never by gating the core.

## 6. The honest constraints (what we design around)

Three walls are real and apply to everyone, not just us. We don't pretend they aren't there:

1. **A phone app can't do "everything a terminal agent does."** iOS/Android sandbox apps hard — we can't freely operate other apps. We work through sanctioned APIs (Shortcuts/App Intents, Calendar, Reminders, notifications) and go deeper on Android where allowed.
2. **Small on-device models are unreliable at long multi-step tool chains.** So the local model handles chat, memory, and *bounded* automations; heavy reasoning escalates to the cloud **only with explicit, visible, per-task consent** (or the user's own API key).
3. **Privacy alone doesn't sell to the mass market** (the privacy paradox). Privacy is the reason we're *allowed* to exist and the reason pros *must* use us — but we lead with a concrete functional win, not the privacy pitch.

## 7. How it's built (one paragraph — full detail in PRODUCT.md)

On-device small model (Gemma 3n / Qwen3-4B, tool-tuned) + on-device personal memory (local vector search) + a bounded agent/tool layer + an **opt-in** cloud/BYOK escalation path for heavy tasks. iOS first, Android second, Apple Watch as a thin client to the phone. Every byte that leaves the device is shown to the user first and logged.

## 8. Money (full detail in PRODUCT.md §Model tiers)

Zero server cost by default (local inference) = a real structural advantage. Freemium core, ~$5–8/mo subscription to fund perpetual upkeep, optional capped lifetime tier as a launch cash injection, BYOK for power users (costs us nothing). The friend's GPUs are for *optional* fine-tuning experiments later, not for serving.

## 9. Why we're not dead on arrival (top risks + answers)

| Risk | Our answer |
|---|---|
| Apple/Google ship this free at the OS level | We win a niche + workflow + cross-platform consistency they won't build; we're the *trusted specialist*, not the generic assistant |
| "AI therapist" legal liability (Character.AI suits, CA SB 243) | We are NOT a therapist. Wellness/journaling framing, 18+, hard-coded crisis routing, never "diagnose/treat" |
| Small models feel dumb | Lead with memory + privacy + bounded reliability; escalate hard tasks; use tool-tuned models + forced-structured output |
| Founder stall pattern | Ship ONE tiny thing to 10 real users fast. Not a platform — one sharp tool |

## 10. When (phases — dates are targets, not promises)

- **Now (Jul 2026):** documents, architecture, wireframes (Google Stitch). Decide name + stack.
- **v0.1 (weeks):** a **6-screen wedge**, not the whole app. One loop: capture → on-device memory → recall → one bounded reminder → privacy dashboard. Local model + BYOK toggle. ~10 real users from the founder's network. Add screens one per release from real feedback — never to match a competitor's changelog. (Phase 0 on-device spike runs first.)
- **v0.2:** bounded automations, opt-in cloud boost tier, polish onboarding + privacy dashboard.
- **v1.0:** paid tiers live, second pro niche, Android build begins.
- **v2+:** mass-market expansion, companion tone (safely), Watch, advanced moat features (see FUTURE.md).

## 11. How this connects to Talha's goals

This IS Goal 1 (launch AI/ML services → independence), now with a concrete product instead of "make content." It uses the Python/ML skills (Goal 3) as the engine. The safety-first, ship-small design is deliberately built to beat the documented stall pattern. Job stays intact; this is built around it (evenings + weekends).

---

*Companion docs: `PRODUCT.md` (spec + architecture + tradeoffs) · `FUTURE.md` (advanced moat, post-v1) · `WIREFRAMES.md` (screens for Stitch).*
