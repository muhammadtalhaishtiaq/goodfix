# Competitive & market landscape — RECENCY CHECK (checked 2026-08-29)

> Supersedes the briefing in `competitive-landscape-2026-07.md` (last checked 2026-07-16).
> Purpose: re-verify the market before the ~30-day build-readiness phase. Method: live web research on 2026-08-29 via web fetch/search. Where a fact could not be confirmed, it is explicitly marked **[unverified]**.

---

## TL;DR — Signal: STILL OPEN, but the adjacent field just grew a serious competitor

- **Core gap is still open:** as of 2026-08-29, **no one ships the full combo of (1) truly local-LLM on-device inference — zero network egress for the brain, (2) warm personalized memory, (3) simple for non-technical users, (4) both iOS AND Android** — all at once.
- **BUT a major adjacent entrant appeared since July: Open Minis** — a polished, open-source, iOS+Android **BYOK cloud-brain** mobile agent with an on-device Linux sandbox + 30 native bridges. It is the closest anyone has come and it got glowing reviews (MacStories). It does **not** close Vault's specific square (its brain is cloud API keys, so data leaves the device per-token; it has a raw Linux shell aimed at technical users; GPL v3).
- **Feasibility got STRONGER, not weaker:** the exact Phase 0 bet — on-device LLM tool-calling on a phone via `llama.rn` — is now documented and demonstrated by several public builds. `llama.rn` 0.4.8 (already pinned in this repo) advertises tool-calling, Metal/Hexagon-NPU acceleration, and real people report working on-device Qwen/Llama tool-calling on phones.

---

## 1. The competitor table (as of 2026-08-29)

| Product | Status (latest signal) | On-device brain? | Polished for non-tech? | iOS + Android? | Notes / source |
|---|---|---|---|---|---|
| **Open Minis** ⭐ NEW | Free, open-source (GPL v3), launched ~mid-2026, glowing reviews (MacStories: "the iOS agent I wish Siri AI could be") | **No — BYOK cloud** (Claude/GPT/Gemini/DeepSeek/OpenRouter/Kimi) + on-device **Linux sandbox** for tools | Partial — powerful but technical (Linux shell, Python, browser automation) | **Yes** (iPhone, iPad, Mac, Vision Pro, Android via GitHub) | Closest competitor. Validates mobile-agent demand hard. Different square: cloud-brain + dev/power tools. [openminis.app](https://openminis.app) · [review](https://www.macstories.net/reviews/open-minis-is-the-ios-agent-i-wish-siri-ai-could-be/) · [PH](https://www.producthunt.com/products/open-minis) |
| **OpenClaw** | Still self-hosted **Gateway/cloud** architecture, messaging-first (WhatsApp/Telegram/etc.), ~247–347K GitHub stars; multiple 2026 reviews | No (central Gateway server) | No, self-host/technical | Has mobile **clients** but brain is your server | Confirms demand + cloud-by-default. [TechCrunch](https://techcrunch.com/2026/06/30/openclaw-is-finally-available-on-android-and-ios/) · [Cybernews review](https://cybernews.com/ai-tools/openclaw-review/) |
| **Hermes mobile (Hermex)** | Self-hosted server mobile clients | No (server you host) | No | Yes (clients) | Niche/self-hosters; not in Vault square |
| **AGI-0 + Qualcomm** | On-device **screen-reading** agent, hardware-SDK play | Yes (Qualcomm) | No (platform play) | Android-centric (SDK) | Best-funded on-device tech, but platform developer play, not a warm consumer app |
| **Microsoft Scout / Project Solara / Gemini Spark / Google Remy** | Big-tech always-on agents (desktop/cloud, ecosystem-locked) | Partly/No | Mass but generic + cloud | Varies | The sherlocking threat continues; none are the independent, obviously-on-device specialist |
| **Meta Manus** | Desktop app bringing agent to personal devices (Mar 2026) | No (cloud agent) | No (desktop/power) | Desktop only | Desktop, not mobile-on-device |
| **ai.com (Kris Marszalek)** | Consumer autonomous agent launch (Feb 2026) | No (cloud) | Consumer | Web/web-app | Cloud agent; privacy not the pitch |
| **Jan.ai / PocketPal / Private LLM** | Free local chat apps, 5.5M+ dl | Yes (local chat) | Yes for chat | Yes | **Chat only** — not agentic, limited memory/actions |
| **Noema / Selv / Cove / Numen** | Early private-Assistant apps (from Jul 2026 pass) | Mostly BYOK/cloud | Early | Varies | Still hobbyist/early; not dominant |

---

## 2. The core question: has anyone shipped "truly on-device + private + polished + personalized + iOS&Android"?

**No (as of 2026-08-29).** The two closest are:
- **Open Minis** — on-device *sandbox + tools*, but **cloud BYOK brain**; technical-feeling; GPL v3. Its data leaves the device (to your chosen model API).
- **Jan.ai / Private LLM** — truly local *chat*, but **not agentic** and not personalized-agent.

**Nobody combines a genuine local-LLM (zero egress) brain with an agentic tool layer, warm personalized memory, and a dead-simple non-technical UI on BOTH stores.** That is still Vault's open square. Honest nuance: Open Minis raises the polish bar for *any* mobile agent and tells us the demand is real and being served well at the technical tier.

---

## 3. Feasibility — the Phase 0 bet just got easier to believe

This is the important positive finding. The exact thing Vault's gate measures is now publicly documented and demonstrated:

- **`llama.rn`** (React Native binding of llama.cpp) — the version already pinned here (**0.4.8**) advertises: GPU/NPU acceleration (Metal on iOS, **Hexagon NPU on Android, experimental**), parallel decoding, multimodal, on-device TTS, **and "Universal function calling / Tool Calling."** [npm](https://www.npmjs.com/package/llama.rn) · [GitHub](https://github.com/mybigday/llama.rn)
- **Real on-device tool-calling proof:** "Qwen 1.7B assistant running entirely on the phone using llama.rn and a homegrown tool-calling protocol" (Jan 2026). [jared.lynskey.co.nz](https://jared.lynskey.co.nz/en/posts/2026/2026-01-30-on-device-ai/)
- **Performance:** "Llama 3.2 3B runs at ~23 tok/s on an iPhone 16 Pro"; "sub-100ms time-to-first-token on modern iPhones and high-end Android" with good quantization. [buildmvpfast](https://www.buildmvpfast.com/blog/on-device-llm-mobile-llama-ios-android-2026) · [casainnov](https://casainnov.com/blog/llama-3-react-native-on-device-ai)
- **Ready-made references:** `Zulqurnain/on-device-llm-rn` — "a minimal, runnable React Native (Expo) demo that runs a real LLM entirely on-device using llama.rn" — [GitHub](https://github.com/Zulqurnain/on-device-llm-rn); and **react-native-ai** (`react-native-ai.dev`) offers a "Llama provider" to run GGUF models on-device. [react-native-ai.dev](https://www.react-native-ai.dev/docs/llama/getting-started)

**Verbatim npm listing of llama.rn 0.4.x confirms the tool-calling mechanism exists.** This de-risks the single biggest Phase 0 unknown (does a small on-device model reliably tool-call?) from "unknown / hope" to "documented + demonstrated by others on phones / must re-verify on our own specific device+model." The gate is no longer a leap of faith; it's a calibration run.

**Honest caveat:** these are third-party reports and the npm feature-list; we still MUST run our own spike on a real mid-range phone (both platforms) to get OUR reliability number with OUR chosen model + schema. And Android NPU (\`hexagon\`) is flagged experimental — plan for CPU fallback on Android.

---

## 4. Trust / privacy backdrop (the Instinct signal)

A 5-day-old TechCrunch piece (2026-08-24) is a bellwether FOR the trust angle: **"Instinct's powerful AI assistant is raising privacy and security concerns"** — an agent that connects to your email, messaging, calendar, audio, location, screen. [TechCrunch](https://techcrunch.com/2026/08/24/instincts-powerful-ai-assistant-is-raising-privacy-and-security-concerns/)

- This is exactly the **privacy anxiety** Vault's "nothing leaves your device" promise answers. Every splashy cloud/always-on agent that over-scopes data access reinforces the market for a genuinely local option.
- Expect press + regulator heat on agent data access (mirrors the CA SB 243 / therapy-adjacency risk noted in MASTER §9). Vault's hard local-by-default + audit-log + honest-tier stance is the durable differentiation.

---

## 5. Platform / policy notes (dual iOS+Android shipping)

- **Doable and standard with one RN codebase + EAS Build** (chosen in `DECISIONS.md` 2026-07-14). Growing body of 2026 on-device-RN guides confirms the pattern. [casainnov](https://casainnov.com/blog/llama-3-react-native-on-device-ai) · [ertas.ai](https://www.ertas.ai/blog/on-device-ai-react-native-llama-cpp) · [medium/godel](https://medium.com/godel-technologies/guide-to-running-ai-models-locally-on-mobile-devices-using-react-native-and-llama-rn-fcd41adbc597)
- **Store labels:** Apple App Privacy + Google Play Data Safety must both honestly state "local by default; nothing leaves on the local tier." Having literally no network egress on the local tier is the rare case where the label is truthful and simple. **[unverified]** — not re-checked for 2026 policy specifics this pass; flag as a v0.1 build task to confirm both stores' current on-device-AI review expectations.
- **ON-device model download** (2 GB on first run) is the standard pattern the repo already scaffolds (`manifest.ts` + download manager) — keeps the binary small and avoids "model bundled" review issues. Weights are NOT in the app bundle.

---

## 6. Verdict & action for Vault

1. **The gap is still open** — proceed is justified on market grounds. Demand is validated and growing; the trust window is *reinforced* by the Instinct-type backlash.
2. **Open Minis is now the competitive reference point to beat/watch.** Differentiate explicitly in our product language: **"runs its brain entirely on your phone — no API key, no account, nothing leaves"** vs. Open Minis' BYOK cloud-brain. And our non-technical warmth vs. its developer Linux-shell power.
3. **Feasibility risk is down, not up.** The Phase 0 gate is now a calibration run in a well-trodden path. Keep the gate, but expect it to pass on the reference model (Qwen2.5-3B) — and *still* verify on both iOS and Android.
4. **Concrete next research debt (small):** confirm the two stores' current on-device-AI review expectations before the v0.1 app-store push; keep an eye on Open Minis' trajectory.

---

## 7. Sources (this pass, 2026-08-29)

- Open Minis: https://openminis.app · https://github.com/OpenMinis/OpenMinis · https://www.macstories.net/reviews/open-minis-is-the-ios-agent-i-wish-siri-ai-could-be/ · https://www.producthunt.com/products/open-minis · https://www.scriptbyai.com/openminis-mobile-ai-agent/
- OpenClaw: https://techcrunch.com/2026/06/30/openclaw-is-finally-available-on-android-and-ios/ · https://cybernews.com/ai-tools/openclaw-review/ · https://www.toolstackchoice.com/openclaw-review/
- llama.rn: https://www.npmjs.com/package/llama.rn · https://github.com/mybigday/llama.rn · https://www.react-native-ai.dev/docs/llama/getting-started
- On-device tool-calling/first-hand: https://jared.lynskey.co.nz/en/posts/2026/2026-01-30-on-device-ai/ · https://github.com/Zulqurnain/on-device-llm-rn
- On-device performance: https://www.buildmvpfast.com/blog/on-device-llm-mobile-llama-ios-android-2026 · https://casainnov.com/blog/llama-3-react-native-on-device-ai
- RN on-device guides: https://www.ertas.ai/blog/on-device-ai-react-native-llama-cpp · https://medium.com/godel-technologies/guide-to-running-ai-models-locally-on-mobile-devices-using-react-native-and-llama-rn-fcd41adbc597
- Privacy backlash / trust: https://techcrunch.com/2026/08/24/instincts-powerful-ai-assistant-is-raising-privacy-and-security-concerns/
- Big tech agents: https://www.geekwire.com/2026/inside-microsofts-project-solara-a-new-platform-for-devices-that-run-ai-agents-instead-of-apps/ · https://www.cnbc.com/2026/03/18/metas-manus-launches-desktop-app-to-bring-its-ai-agent-onto-personal-devices.html
- ai.com: https://ai.com/company-news/ai-com-launch
