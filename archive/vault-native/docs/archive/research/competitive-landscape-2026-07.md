# Competitive landscape — mid-2026 (checked 2026-07-16)

Prompted by: "is someone already building this?" (X posts about "hermes mobile app"). Verified via open web (X search itself is not scrapable — login/JS).

## What's shipped

| Product | What it is | On-device? | Audience | Signal |
|---|---|---|---|---|
| **Hermes mobile** (Hermex iOS 4.7★, Android clients) | Mobile clients for the self-hosted Hermes agent server | No — controls a server you host | Technical / self-hosters | Real but niche; NousResearch/hermes-agent open source |
| **OpenClaw** (iOS+Android, Jun 2026) | Open-source agent app, takes actions w/ per-action approval; TechCrunch coverage | **No — cloud** ("that's the whole point") | Broad, but shipped rough | **2.2★, "buggy/unusable," can't pair, ugly UI** — idea loved, execution hated |
| **AGI-0** (ex-MultiOn) + Qualcomm | On-device screen-reading agent across apps; MWC 2026; Snapdragon SDK | **Yes** | Device-makers / power users (platform play) | Best-funded on-device competitor; hardware-tied, not a warm consumer app |
| **Microsoft Scout / Gemini Spark** | Big-tech always-on personal agents | Partly | Mass (ecosystem-locked) | The sherlocking threat, live now |
| **Jan.ai** | Local-first chat, 5.5M downloads | Yes | Privacy-conscious | Chat, not agentic/mobile-first |

## Reaction (the useful part)
Huge interest + press, and loud frustration with what's shipped. OpenClaw = everywhere in press AND 2.2★ reviews. Qualcomm CEO: agentic AI is "inescapable." **People want it badly; they hate the current execution.** Validated demand + unhappy users = an execution/trust opening.

## Verdict
- Idea is **validated hard**. We are **late to the generic version** — a solo founder can't out-engineer Qualcomm+AGI+OpenClaw+big-tech head-on.
- **Open execution gap:** nobody has shipped *truly on-device + genuinely private + polished/simple for non-technical + personalized*, all at once. OpenClaw is cloud + 2.2★; Hermes is for hackers; AGI is a hardware SDK; big tech is generic.

## Recommended response (all three or none)
1. **Build ON open source (OpenClaw/Hermes) or RN on-device libs — don't rebuild the engine.** Spend our energy on the unsolved 20%: on-device privacy, personalized memory, dead-simple polished UX.
2. **Narrow to ONE vertical** (e.g. lawyers) with a trust/compliance + polish moat big tech won't bother with.
3. **Validate with 5–10 target pros BEFORE building.** OpenClaw's flop proves fast-but-rough backfires here.

Moat = truly-on-device + polished + personalized + trusted-for-one-vertical. Hold ≥3 of those or don't build it.

## Sources
- Hermes: https://github.com/nousresearch/hermes-agent · https://apps.apple.com/us/app/hermes-ai-personal-agent/id6759341434
- OpenClaw cloud architecture: https://thenewstack.io/openclaw-persistent-agent-architecture/ · launch: https://techcrunch.com/2026/06/30/openclaw-is-finally-available-on-android-and-ios/ · reviews: https://www.techradar.com/pro/openclaw-reveals-ios-and-android-mobile-apps-at-last-but-initial-reviews-make-for-tough-reading
- AGI-0 + Qualcomm: https://www.digitimes.com/news/a20260304VL205/agi-snapdragon-qualcomm-on-device-ai-mwc-2026.html · https://www.theregister.com/personal-tech/2026/06/02/qualcomm-ai-agents-will-be-as-transparent-as-they-will-be-inescapable/5249894
