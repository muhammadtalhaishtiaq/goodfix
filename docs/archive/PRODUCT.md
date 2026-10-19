> NOTE (imported 2026-10-18 from the original build HQ repo): §§7 and 9 below still say iOS-first. This is stale — superseded by the 2026-08-29 hybrid iOS+Android decision in docs/archive/DECISIONS.md.

# PRODUCT — Spec, Architecture & Tradeoffs

> What we're actually building, how it's put together, and every tradeoff we're making with eyes open.
> Codename: **Vault** (placeholder). See `MASTER.md` for the why. Last updated: 2026-07-14.

---

## 1. What it is / what it is NOT

**It is:** a private, on-device AI agent for your phone. It remembers you, talks with you, and takes bounded actions (reminders, drafts, summaries, simple automations). Local by default; cloud only by explicit choice.

**It is NOT:**
- Not a cloud chatbot (data doesn't live on our servers).
- Not a medical or therapy product. No diagnosis, no treatment, no "therapist." (Wellness/reflection framing only.)
- Not a jailbroken "does anything on your phone" tool — it works within OS-sanctioned capabilities.
- Not trying to beat frontier models at raw intelligence. It wins on privacy, memory, and trust.

## 2. Target user (universal product, focused launch)

**The product is universal** — a blank slate that personalizes to whoever you are: a lawyer, a chef, a doctor, a student. Anyone can use it; it becomes a version of *them*.

**The launch is free and aimed at reachable users.** No paywall — like OpenClaw/Hermes, free drives adoption, and on-device = ~zero cost per user. First users = the ones the founder can actually reach: **developers, IT people, privacy-conscious tech folks** — his own network, the real distribution edge for a solo founder. A launchpad, not a limit — anyone can use it. Honest tradeoff: this audience is the most competitive (OpenClaw/Hermes serve it free) and least payment-willing, so we win on **quality + true on-device privacy**, gather feedback + word-of-mouth, then expand to the non-technical majority (who pay) later. Core loop to nail first: **capture → private memory → reminders/drafts → never worry it leaked.**

Note (competitive reality, 2026): private-on-device personal AI is filling up fast (Noema, Selv, Private LLM, PocketPal, etc.). Our edge is NOT "private on-device AI" generically — it's the personalization ("becomes you") + agentic *actions* + a trustworthy, non-technical experience these hobbyist-leaning apps don't nail.

## 3. Core capabilities (v1)

1. **Private capture** — voice or text, instant, zero-friction. "Note this," "remind me," "what did I say about X."
2. **Personal memory** — everything captured is embedded and stored locally; the agent can recall and reason over it. This is the core magic.
3. **Smart reminders & calendar** — natural language → reminders/events via OS APIs.
4. **Draft-back** — summarize a note, draft a message/email, prep for a meeting from memory.
5. **Bounded automations** — short, validated multi-step routines through sanctioned APIs.
6. **Privacy dashboard** — a live, honest view of what's stored, what's local, and what (if anything) ever left the device.

## 4. Architecture (layers)

```
┌─────────────────────────────────────────────────────────────┐
│  UI layer  (mobile app — iOS first, Android next)            │
│  Watch = thin client (capture + display, relays to phone)    │
├─────────────────────────────────────────────────────────────┤
│  Agent / orchestration layer  (app-side, deterministic)      │
│   • intent routing • tool selection • validate + confirm     │
│   • state machine drives multi-step flows (not the model)    │
├───────────────┬───────────────────────┬─────────────────────┤
│ On-device LLM │  Personal memory      │  Tool layer          │
│ Gemma 3n /    │  • local vector store │  • Reminders/Calendar │
│ Qwen3-4B      │    (sqlite-vec)       │  • Notes/Contacts     │
│ (tool-tuned,  │  • small embedding    │  • Shortcuts/App      │
│  forced JSON) │    model (on-device)  │    Intents            │
│               │  • encrypted at rest  │  • Share/notify       │
├───────────────┴───────────────────────┴─────────────────────┤
│  ESCALATION (opt-in only, always visible + logged)           │
│   • BYOK: user's own OpenAI/Anthropic key (their contract)   │
│   • Hosted "boost": our metered/capped mid-size model        │
└─────────────────────────────────────────────────────────────┘
```

**Key principle:** the app's own code (deterministic) drives the flow and confirms every action; the small model is a *slot-filler and router*, not an autonomous planner. This is how we get reliability out of a 3–4B model.

## 5. Model strategy & tiers

**Our own local model is the hero.** We package and brand a small model users **download once and run fully on-device** — the private default. Users can **switch** to other local models, or **bring their own key** (Claude/Grok/OpenAI) for more power. No paid gate at launch.

| Tier | Data leaves device? | Model | Price | Build |
|---|---|---|---|---|
| **Our local model (default)** | No — fully on-device | Curated & branded small model (Gemma 3n / Qwen, tool-tuned), 1B fallback | Free | Now |
| **Switch to other local models** | No (after download) | User-chosen GGUF/LiteRT | Free | Now |
| **Bring your own key** | Yes → user's own account (no training) | Their Claude/OpenAI key (⚠️ verify Grok/xAI terms) | Free (they pay provider) | Now |
| **Our no-train servers (optional)** | Yes → us, never trained/stored | Hosted mid-size model | Free now / paid convenience later | Later |
| **Our own fine-tuned model** | No — on-device | Tool-calling QLoRA on 3B, on friend's GPUs | — | Later (v2), after usage data |

**"Our own model" at launch = a curated, optimized, branded off-the-shelf small model** (great system prompt + tool wiring + on-device runtime), NOT weights we trained. A truly custom fine-tune comes later (v2), targeted at tool-calling, trained on the friend's GPUs once we have real usage traces.

**Do NOT fine-tune for launch.** Strong open base + prompting + memory/RAG gets ~90% there for ~$0. The only fine-tune with ROI is tool-calling on the small model, and only once the tool set is final and we have real failure traces. Use off-the-shelf tool-tuned models (Qwen3-4B, xLAM-2-3b-fc-r) + forced JSON output first.

**Do NOT self-host inference** until we're reliably above ~30–100M tokens/month. Serverless (DeepInfra ~$0.02–0.03/M on 8B) is far cheaper and $0 when idle.

## 6. Privacy & data design (this is the whole brand — get it right)

- **Local-first by default, and it's the *default*, not a buried setting.**
- **Nothing leaves the device silently.** Any escalation (boost/BYOK) is per-task, opt-in, and shows a *preview of exactly what will be sent* before it sends.
- **On-device PII minimization/redaction** before any cloud call.
- **Local audit log** the user can inspect — every escalation, ever.
- **Encrypted at rest** via OS Keychain/Keystore. No telemetry, no analytics, no account required for the local tier.
- **Honest per-tier labeling in the UI** (badge/color) so the user always knows when they've stepped off-device:
  - Local: "Private. Runs entirely on your phone."
  - Boost: "Leaves your device to a server. Off by default."
  - BYOK: "Leaves your device to your own account. Your data, your contract."

## 7. Platform notes

- **iOS first:** cleaner payments, users who pay, strong on-device stack (llama.cpp/MLX/Core ML, Apple Foundation Models framework offers a free on-device model + tool-calling). Action surface: App Intents, Shortcuts, EventKit, notifications. No long-running background compute — agent runs foreground/on-trigger.
- **Android next:** more automation headroom (Accessibility API — but Play Store polices it hard; use only sanctioned paths to avoid delisting). MediaPipe LLM Inference / ExecuTorch / AICore.
- **Apple Watch:** thin client only. Can't run a useful model (RAM/thermal/battery). Captures input, shows output, relays to phone over WatchConnectivity.

## 8. Tech stack — LOCKED: React Native

**One JS/TypeScript codebase → both iOS and Android.** No double build effort for a solo founder, and it renders true native UI (not a webview).

- **On-device inference:** via a native module — `llama.rn` (llama.cpp bindings, runs GGUF models like Gemma/Qwen on-device) or `react-native-executorch` (Meta ExecuTorch, RN bindings by Software Mansion). The one part that isn't pure JS, but it's a mature, solved problem.
- **Build tooling:** Expo with custom dev builds (config plugins) so we get the native model module while keeping Expo's DX. Confirm during scaffolding.
- **Tradeoff accepted:** slightly less raw inference speed than pure Swift — a non-issue for our 1–4B model sizes, and worth it to ship both platforms from one codebase.

## 9. Key tradeoffs (made with eyes open)

| Tradeoff | We chose | Why |
|---|---|---|
| Power vs privacy | Local by default, opt-in escalation | Privacy is the brand; power is available on demand |
| Intelligence vs trust | Trust (bounded, reliable) | Small models can't win on raw IQ; they can win on being yours + safe |
| Mass market vs niche | Niche first | Beachhead we can actually take; expand later |
| Cross-platform vs native | Native iOS first (proposed) | Best private-model UX, fastest to the paying wedge |
| One-time vs subscription | Freemium + subscription | Funds perpetual OS/model maintenance |
| Autonomous agent vs bounded | Bounded + confirmed | Reliability + user trust + legal safety |
| Fine-tune now vs base+RAG | Base + RAG now | ~90% of value at ~$0; fine-tune later, only for tool-calling |

## 10. Non-goals (v1)

No mass-market launch, no companion/romantic tone, no minors, no "therapy," no Android, no Watch, no self-hosted inference, no custom model training. All deliberately deferred to stay shippable.

**And explicitly NOT v1: feature-parity with Hermes/OpenClaw/qm.** Those teams out-ship any solo founder; matching their surface is the stall trap. **v0.1 is a 6-screen wedge** (capture → on-device memory → recall → one bounded reminder → privacy dashboard), to ~10 real users. The 53-screen set in `WIREFRAMES.md` is the v2+ destination map — screens get added one per release, driven by real user feedback, never by a competitor's changelog. See `DECISIONS.md` 2026-08-01. **Phase 0 (on-device tool-calling spike) runs before any v0.1 screen is built.**

## 11. Open decisions

1. **Product name** — OPEN. Codename "Vault" (internal only). All short words taken (several by direct competitors); pursuing an invented, ownable name. See `DECISIONS.md`.
2. ~~Stack~~ — LOCKED: React Native (§8).
3. ~~Positioning~~ — LOCKED: universal product; launch beachhead = founder's dev/IT/privacy network; free (§2).
4. ~~Wellness reframe~~ — LOCKED: no therapy/medical language.
5. ~~Engine~~ — LOCKED: build ON open source (OpenClaw/Hermes) / RN on-device libs, not from scratch.
6. ~~Payment~~ — LOCKED: free at launch; optional monetization later (hosted convenience / pro / B2B).
7. **Next real decisions:** which open-source base (OpenClaw vs Hermes vs pure RN on-device libs) → needs a short technical eval; and the name.

---

*See `WIREFRAMES.md` for every screen and its Stitch prompt. See `FUTURE.md` for the advanced moat we build after v1 works.*
