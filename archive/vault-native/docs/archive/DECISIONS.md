# Decisions

Locked product decisions, newest first. When one is reversed, don't delete it — mark it superseded and link the new one.

## 2026-10-29 — Separate responsive web app is the hackathon entry
- Context: Talha explicitly locked the responsive web direction after reviewing the guided troubleshooting idea and three layout alternatives. The current Vault native plan was consuming the hackathon window in app/platform work unrelated to the user's selected project direction.
- Decision: create a distinct web project at `apps/goodfix-web/` (working title Goodfix; brand is not locked). Use React + TypeScript + Vite + responsive CSS. Use Workbench on desktop and a step-focused Guided adaptation on phones. Keep the numbered evidence timeline and the entire follow-up history in one case.
- First demo scope: one staged, visibly loose cupboard-handle task with a real Muse Spark video observation, real SAM 3.1 object geometry, a clarifying question, no more than three bounded steps, and a separately approved numbered follow-up upload. This is not “repair anything.”
- Keep the existing Vault Expo/React Native product and its own product decisions in this repository. This decision supersedes the **hackathon execution target only**, including “Keep React Native for the hackathon build” from 2026-10-28. It does not retire Vault or migrate its native app to the web.
- Hard gates: get written Meta clarification for the proposed no-login server-side Integrated Product route before any live public model integration; keep keys off the client; 18+ only; use Standard models for private home media; exact request preview and explicit consent for every media transfer; delete each Meta Files API upload when no longer needed; implement stop states for unclear, unsafe, or out-of-scope footage.
- Revisit if: Meta does not authorize the architecture, account/model access is unavailable, the staged task cannot produce safe grounded steps, or the event deadline cannot support an honest end-to-end demo. If any gate fails, reassess the entry; never substitute simulated outputs for live results.

## 2026-10-28 — Keep React Native for the hackathon build
- Status: superseded for the hackathon entry by the 2026-10-29 separate Goodfix web project decision above. React Native remains the implementation for the Vault native product.
- Context: after comparing Flutter, Ionic, and the existing app against the Nov 4 build window, Talha explicitly chose to continue with React Native rather than migrate to Flutter.
- Decision: the existing Expo/React Native TypeScript app remains the primary implementation for Android and iOS builds. The existing agent, memory, privacy, and inference code is the implementation base; Stitch screens remain the visual/product map. Continue the planned build and use Expo/EAS for native artifacts.
- Supersedes: the 2026-10-28 Flutter implementation decision immediately below. Keep its migration analysis as historical evidence; do not start Flutter/Dart migration work.
- Revisit if: a measured blocker in the existing React Native app prevents the required native Android/iOS demo loop, and a replacement passes a real-device model and camera proof before migration.

## 2026-10-28 — Flutter is the primary hybrid app implementation
- Status: superseded by the newer 2026-10-28 React Native decision above.
- Context: Talha explicitly chose Flutter for end-to-end development of Vault as a single hybrid mobile app, using the existing Stitch mobile screen designs and targeting Android and iOS builds.
- Decision at the time: Flutter/Dart was the primary implementation target. Preserve this record as the reason the migration plan exists; it is no longer the active platform choice.
- Product scope: the 53 Stitch screens are the complete product design map. The deadline build must be planned from the remaining time and verified build capacity; screen count alone is not a reason to fake functionality or weaken the privacy model.
- Revisit if: n/a — superseded by the newer decision above.

## 2026-08-29 — Hybrid dual-platform at launch: iOS AND Android together (one RN codebase)
- Status: its dual-platform product intent remains in force; the newer 2026-10-28 decision selects React Native again.
- Why: Talha's explicit intent — build the app hybrid so BOTH iOS and Android users can download it from day one. React Native + EAS Build was chosen (2026-07-14) precisely for one-codebase → both stores.
- Decision: v0.1 ships on **iOS AND Android at launch**, from one React Native + TypeScript codebase. The 6-screen wedge is IDENTICAL on both (parity, not extensions) in v0.1.
- Costs locked in (see V01-SCOPE §4): Phase 0 spikes must run on BOTH platforms; native bridges verified on both (`llama.rn`, sqlite-vec, secure-store, calendar/reminders — EventKit on iOS vs CalendarProvider on Android are different APIs, both implemented); TWO honest store privacy labels (Apple App Privacy + Play Data Safety), both saying "local by default / nothing leaves on the local tier."
- Fallback (documented, needs evidence not vibes): if a native bridge is broken on Android at the Phase 0 gate, ship iOS first but keep the single RN codebase (Android = build-out not rewrite) and say so openly. Default = both-at-launch.
- Revisit if: the Phase 0 gate reveals Android can't carry the native inference stack in scope.

## 2026-08-29 — Restart: YES, but the Phase 0 gate is the boss (post-pause go/no-go confirmed)
- Context: project paused ~4 weeks (last commit 2026-08-02) while Phase 0 was mid-flight. Re-assessed on 2026-08-29 whether it's still worth the work.
- State check that framed the call: (a) nothing has shipped or been spent — all sunk cost is documents + a scaffold, so restart is near-zero-cost; (b) the code has NEVER been installed/typechecked/built — no `node_modules` on disk, 2 of 3 model URLs are still placeholder `<repo>` values, so the Phase 0 spike does not run yet; (c) competitive landscape was last verified 2026-07-16 (~6 weeks old in the fastest-moving market on Earth).
- Decision: **continue — but the whole product remains hostage to the Phase 0 on-device tool-calling spike.** The plan-through-thinking is de-risked and cheap to test; that's exactly why spending ~30 days to get the ONE make-or-break number is worth it. This is NOT a green light to build features — it is a green light to RUN THE GATE.
- Restated rule (unchanged from 2026-08-01, re-confirmed): Do **not** build any v0.1 screen until Phase 0 clears (tool-calling ≥90%, args ≥85%, no OOM/jetsam, throughput at bar) — else redesign toward deterministic routing / smaller tool set / escalation-first.
- Revisit if: phase-0 fails on a real mid-range phone AND escalations/BYOK can't rescue the core loop; or the landscape recency-check shows the gap closed.
- New 30-day plan: see journal `2026-08-29.md` and replace BUILD-PLAN §9 next-actions.

## 2026-08-01 — v0.1 = a 6-screen wedge; feature-parity is a v2+ north star, NOT v1
- Why: competitors (Hermes ~77 PRs/day, OpenClaw, YC's `qm`, Qualcomm) are all racing the CLOUD / developer / team / desktop surface — none are in our square (truly on-device + mobile + non-technical + private). We CANNOT out-ship a funded team + contributor army, and trying to match their feature surface (the 53-screen "everything" set) IS the documented founder-stall trap.
- Decision: **v0.1 ships ONE loop in ~6 screens to ~10 real users**: capture (voice/text) → on-device memory → recall → one bounded reminder → privacy dashboard proving nothing left the device. Screens: Welcome/privacy promise, Home, Voice capture, Memory, Action-confirm, Privacy dashboard.
- The 53-screen wireframe set = the **destination map (v2+)**, not the v1 build. Add screens incrementally, one per release, driven by real user feedback + bug fixes — not by matching a competitor's changelog.
- **Do Phase 0 FIRST** (tool-calling spike on a real phone). That one number decides feasibility before any screen is built — the highest-leverage anti-waste move.
- Revisit if: the 6-screen loop gets real pull and users pull us toward specific next screens (let them, not the competitor feed, set the order).

## 2026-07-30 — Hermes is Python: BORROW patterns, don't fork the code
- Fact: hermes-agent (github.com/nousresearch/hermes-agent) is **Python**. React Native runs JS/TS on the phone; Python can't run inside a mobile app. So we CANNOT ship Hermes' code.
- Decision: MIT lets us read Hermes freely and **re-implement its agent/tool-calling patterns in our own TypeScript**. Hermes = reference blueprint, not a dependency. This resolves the fork-vs-borrow eval question → **borrow.** Confirms Option C (our own bounded TS agent loop on top of `llama.rn` + RN on-device libs).
- Revisit if: n/a — language mismatch is permanent.

## 2026-07-30 — Hermes is MIT-licensed: legally cleared to fork
- Fact: Hermes (Nous Research, hermes-agent) ships under the **MIT License** (copyright text confirmed 2026-07-30). MIT lets us use, modify/fork, distribute, sell, AND keep our own app closed-source — no copyleft/AGPL infection. Only obligation: include their copyright + MIT text in an in-app "Licenses/Acknowledgements" screen.
- Impact: kills the #1 engine risk ("could forking force us to open-source our whole app?" → No). Hermes is safe as the reference/fork base.
- Still open (rest of the eval): (a) does Hermes' *code* fit on-device/mobile or is it too server-oriented (fork-whole vs borrow-patterns), (b) OpenClaw's own license, (c) do RN on-device libs (`llama.rn`/`react-native-executorch`) genuinely run tool-calling on real phones.
- Revisit if: n/a — license fact is permanent.

## 2026-07-16 — Engine: build ON open source, not from scratch
- Why: OpenClaw, Hermes, AGI+Qualcomm and big tech are commoditizing the agent engine; a solo founder can't win that race from scratch. Build on OpenClaw/Hermes (open-source) or RN on-device libs and spend our energy on the unsolved 20%: true on-device privacy, .md memory, polished mobile UX.
- Revisit if: no open-source base fits our on-device/mobile needs, or licensing blocks us.

## 2026-07-16 — Free at launch (no payment)
- Why: OpenClaw/Hermes are free; charging kills adoption. On-device = ~zero marginal cost, so free is sustainable. Monetization is optional and LATER — hosted convenience tier, pro/power features, or B2B — never gating the core.
- Revisit if: we add a genuinely costly hosted feature, or clear willingness-to-pay emerges.

## 2026-07-16 — Model menu: our own local model + switch + BYOK
- Why: hero = our own branded small model users download and run fully on-device (private default). Users can switch to other local models, or bring their own key (Claude/Grok/OpenAI). "Our own model" at launch = a curated/optimized/branded off-the-shelf small model (Gemma 3n / Qwen); a truly custom FINE-TUNED model comes later (v2, tool-calling, on friend's GPUs) once we have usage data (base+RAG gets ~90% at ~$0).
- Revisit if: an off-the-shelf model can't hit acceptable quality/tool-reliability on-device.

## 2026-07-16 — Memory as .md files in the user's own storage
- Why: human-readable, portable, inspectable — the user can literally open and read their own memory. A trust feature no competitor has. Paired with a local vector index for fast recall.
- Revisit if: .md proves too slow/unwieldy at scale (then keep .md as source of truth, optimize the index).

## 2026-07-16 — Honest privacy tiers (never conflate the two promises)
- Why: "never leaves your device" is TRUE only for the local model. Cloud tiers (BYOK / our servers) DO leave the device but under a "never trained on / never stored" guarantee (Anthropic/OpenAI don't train on API data; our servers = stateless no-retention). We must never market "never leaves" for a cloud tier. Verify Grok/xAI terms before promising no-training there.
- Revisit if: n/a — permanent integrity rule.

## 2026-07-16 — Beachhead: founder's own dev/IT/privacy network (product stays universal)
- Why: a solo founder's #1 asset is distribution he can actually reach. Talha's network is developers/IT/privacy-minded tech people, not lawyers. Product is for everyone; first users come from his network. Honest tradeoff: that audience is the most competitive (OpenClaw/Hermes serve it free) and least payment-willing — so we win on quality + true on-device privacy, then expand to the non-technical majority (who pay) later.
- Supersedes the 2026-07-14 "focused launch on privacy-obligated pros" targeting (product-universal part stands; first-audience is now the dev network).
- Revisit if: the dev audience shows no pull, or a reachable paying segment appears.

## 2026-07-14 — Tech stack: React Native (JS, cross-platform)
- Why: one JS/TypeScript codebase ships to both iOS and Android — no double effort for a solo founder. On-device inference via a native module (`llama.rn` / `react-native-executorch`) is a solved problem. Small perf tradeoff vs pure Swift is fine for 1–4B models.
- Revisit if: on-device model performance in RN proves unacceptable in real testing, or a deep iOS-only capability becomes essential.

## 2026-07-14 — Positioning: universal product, focused launch
- Why: the app is a blank slate that personalizes to whoever you are — anyone can use it. But launch marketing and first paying users target privacy-obligated pros (lawyers/therapists/medical), because they NEED privacy and convert where mass consumers hit the privacy paradox. Product is universal; the first message is focused.
- Revisit if: a different first audience shows stronger pull, or consumer conversion proves strong without the pro focus.

## 2026-07-14 — No therapy/medical framing (locked)
- Why: "AI therapist/companion" is legally radioactive (Character.AI suits survived dismissal; CA SB 243 live as of 2026-01-01). Wellness/reflection framing only, 18+, hard-coded crisis routing, never "diagnose/treat/therapy."
- Revisit if: we have real legal counsel and a compliance budget to enter regulated territory deliberately.

## 2026-07-14 — Name: OPEN (Numen rejected)
- Why: "Numen" is taken in our exact space — Numen Technologies ships a Private LLM app; a NUMEN self-knowledge app exists; domains gone. Noema, Selv, Ipsa, Numa also taken, several by direct competitors. Real/short words are saturated in this category.
- Decision: coin an invented, ownable word; vet .com/.ai domain + App Store + trademark before committing.
- Status: web vetting rate-limited until ~8:40pm Toronto 2026-07-14; resume with invented candidates (Nuven, Vessa, Mirae, others). Working codename until then: "Vault" (internal only — not the product name).
