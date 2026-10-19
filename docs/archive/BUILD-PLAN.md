# BUILD-PLAN — End-to-End Production Playbook

> How we take Vault from empty repo → smooth, shipped iOS + Android app.
> The engineering companion to `PRODUCT.md` (the *what*). This is the *how*: workflow, architecture, phases, testing, release.
> Codename **Vault** (name TBD). Last updated: 2026-07-30.

---

## 0. TL;DR — the shape of the whole thing

1. **One React Native (TypeScript) codebase** ships to both iOS and Android.
2. **The brain is ours, in TypeScript.** We do NOT fork Hermes (it's Python — can't run in a mobile app). We read Hermes' MIT-licensed code as a *blueprint* and re-implement its agent/tool-calling patterns in TS.
3. **The model runs on the phone** via `llama.rn` (llama.cpp bindings) — GGUF small models (Gemma 3n / Qwen).
4. **Memory = `.md` files in the user's storage + a local vector index** (sqlite-vec).
5. **The app's own deterministic code drives every action; the model only fills slots.** That's how we get reliability from a 3–4B model.
6. **Cloud is opt-in only**, previewed and logged, never silent.
7. We ship in **thin vertical slices** (one whole feature working end-to-end), not layer-by-layer. Each slice is testable on a real phone.

---

## 1. Architecture (final, post-Python-finding)

```
┌──────────────────────────────────────────────────────────────┐
│  PRESENTATION  (React Native + TypeScript, one codebase)       │
│  Screens, chat UI, capture, privacy dashboard, settings        │
│  State: Zustand (or Redux Toolkit). Nav: React Navigation.     │
├──────────────────────────────────────────────────────────────┤
│  AGENT CORE  (our TypeScript — the brain we own)               │
│   • Orchestrator: deterministic state machine drives flows     │
│   • Router: classify intent → pick a tool                      │
│   • Tool-calling: model returns structured JSON (forced)       │
│   • Validator + Confirmer: every action previewed to user      │
│   • Patterns borrowed from Hermes (MIT), rewritten in TS       │
├───────────────┬────────────────────┬─────────────────────────┤
│ INFERENCE     │  MEMORY            │  TOOLS                    │
│ llama.rn      │  • .md files (fs)  │  Native modules bridging  │
│ (llama.cpp)   │  • sqlite-vec index│  to OS APIs:              │
│ GGUF models   │  • embedding model │  Calendar, Reminders,     │
│ Gemma/Qwen    │    on-device       │  Notes, Contacts,         │
│ forced JSON   │  • encrypted at    │  Notifications,           │
│               │    rest (Keychain) │  Share, Shortcuts/Intents │
├───────────────┴────────────────────┴─────────────────────────┤
│  ESCALATION  (opt-in, always previewed + logged)              │
│   • BYOK: user's own Anthropic/OpenAI/Grok key                 │
│   • Hosted "boost": our stateless, no-retention endpoint       │
└──────────────────────────────────────────────────────────────┘
```

**The load-bearing principle:** the model is a *slot-filler and router*, not an autonomous planner. Our TypeScript state machine owns the control flow, validates every tool call, and confirms every side-effecting action with the user. A wrong model output produces a rejected/re-prompted call, never a silent bad action.

---

## 2. Tech stack (concrete — the actual packages)

| Concern | Choice | Note |
|---|---|---|
| Framework | **React Native + Expo (dev client)** | Expo DX + custom native modules via config plugins |
| Language | **TypeScript** (strict) | one codebase, typed end to end |
| On-device inference | **`llama.rn`** | llama.cpp bindings; runs GGUF Gemma/Qwen on-device. (`react-native-executorch` as fallback/alt) |
| Local vector search | **`sqlite-vec`** (via `op-sqlite` / expo-sqlite) | memory recall; ObjectBox as alt |
| Embeddings | small on-device model (EmbeddingGemma-300m / all-MiniLM) | via the same inference runtime |
| State | **Zustand** | light; Redux Toolkit if flows get complex |
| Navigation | **React Navigation** | standard |
| Local storage / files | `expo-file-system` (the `.md` memory), `expo-secure-store` / Keychain (secrets) | encrypted at rest |
| Calendar/Reminders | `expo-calendar`, native EventKit bridge | tool layer |
| Notifications | `expo-notifications` | smart reminders |
| Testing | **Jest** (unit) + **React Native Testing Library** (component) + **Maestro** (E2E on device) | see §6 |
| CI/CD | **EAS Build + EAS Submit** (Expo Application Services) | cloud builds for both stores |
| Error/telemetry | **none by default** (privacy). Opt-in crash reporting only, local-first | honors the no-telemetry rule |

**Locked already (see DECISIONS.md):** React Native, build-on-open-source (now = *borrow patterns*), free at launch, model menu, .md memory, honest privacy tiers.

**To confirm during scaffolding (Phase 0):** `llama.rn` vs `react-native-executorch` real-device tool-calling throughput; sqlite-vec build on both platforms.

---

## 3. Repo structure (`code/`)

```
code/
├── app/                  # screens, navigation, UI components
│   ├── screens/          # Home, Capture, Memory, Privacy, Settings...
│   ├── components/       # shared UI
│   └── navigation/
├── agent/                # THE BRAIN (our TS, Hermes patterns)
│   ├── orchestrator.ts   # deterministic state machine
│   ├── router.ts         # intent → tool
│   ├── prompts/          # system prompts, JSON schemas
│   └── toolcall.ts       # forced-JSON structured output + validation
├── inference/            # llama.rn wrapper, model load/unload, mem mgmt
├── memory/               # .md read/write + vector index + recall
├── tools/                # one file per tool (calendar, reminders, notes...)
├── escalation/           # BYOK + hosted boost, preview + audit log
├── privacy/              # audit log, redaction, per-tier labeling
├── models/               # model manifest, download manager (NOT weights)
└── __tests__/            # mirrors the tree
```

Non-negotiables baked in from line one: local by default, confirm every action, encrypted at rest, no telemetry.

---

## 4. The development workflow (how we actually work)

We work in **thin vertical slices**. A slice = one user-visible capability working all the way through (UI → agent → tool → result → memory), shippable and testable on a real phone. Never build a whole layer in isolation.

**The loop for every slice:**

```
1. DESIGN    → confirm the screen(s) in WIREFRAMES.md + the agent flow.
               Define: inputs, the tool contract (JSON schema), the
               confirm step, what gets written to memory.
2. BUILD     → implement UI + agent flow + tool. Model returns forced JSON.
3. TEST      → unit (agent logic, parsing), component (UI), then run it
               on a REAL device (on-device model behaves differently than
               simulator). Verify the privacy promise for this slice.
4. ANALYZE   → does the small model actually do this reliably? Measure
               tool-call success rate. If weak: tighten prompt / schema /
               fall back to deterministic. Log the finding.
5. SHIP/LOG  → merge to main, note it in docs/journal/. Move to next slice.
```

**Rules of the loop:**
- **On-device reality check every slice.** Simulator lies about speed and memory. If it doesn't run smoothly on a mid-range real phone, it isn't done.
- **Reliability is a measured number, not a vibe.** Each agent flow gets a tool-call success rate. Below bar → simplify, don't ship.
- **Privacy is a test, not a hope.** Each slice: assert nothing left the device unless a logged, previewed escalation happened. Network calls are asserted against in tests.
- **One vertical slice at a time.** Resist building the "platform." Beat the stall.

---

## 5. Build phases & milestones (dates = targets)

### Phase 0 — Scaffold & de-risk (the foundation) — *~1–2 weeks*
The single most important phase. Prove the scary parts before building features.
- [ ] Init RN + Expo dev-client + TypeScript strict.
- [ ] Wire `llama.rn`, load a GGUF model, get **one token generated on a real phone**.
- [ ] **Throughput spike:** measure tok/s + memory on a real mid-range device (iOS jetsam limits!). Confirm 3–4B is viable, know the fallback.
- [ ] **Tool-calling spike:** can the on-device model return valid forced JSON for a tool call, reliably? This is the make-or-break test. Measure success rate over 50 tries.
- [ ] Stand up sqlite-vec; store + recall one `.md` note by vector search.
- [ ] Auto-generated OSS licenses screen (the MIT/Hermes obligation).
- [ ] CI: EAS build produces an installable iOS + Android artifact.
- **Gate:** if on-device tool-calling can't clear a usable bar, we redesign (more deterministic scaffolding / smaller tool set / escalation-first) BEFORE building features. **Do not skip this gate.**

### Phase 1 — v0.1: the core loop (10 real users) — *~4–6 weeks*
The magic loop from PRODUCT.md: **capture → private memory → reminder/draft → never worry it leaked.**
- [ ] Slice: **Private capture** (voice/text → stored locally).
- [ ] Slice: **Personal memory** (embed + recall over `.md`).
- [ ] Slice: **Smart reminder** (natural language → OS reminder via tool).
- [ ] Slice: **Draft-back** (summarize a note / draft a message from memory).
- [ ] Slice: **Privacy dashboard** (live view: what's stored, what's local, what left).
- [ ] BYOK toggle (opt-in escalation, previewed + logged).
- [ ] Onboarding: download-the-model flow.
- **Gate:** 10 people from the dev/IT network use it for a week. Measure retention + the "did you trust it" signal.

### Phase 2 — v0.2: bounded automations + polish — *~4 weeks*
- [ ] Short, validated multi-step routines through sanctioned APIs.
- [ ] Opt-in hosted "boost" tier (stateless, no-retention endpoint).
- [ ] Onboarding + privacy-dashboard polish; per-tier labels everywhere.
- [ ] Model-switching UI (download other local models).

### Phase 3 — v1.0: harden & launch — *~4 weeks*
- [ ] Full device-matrix testing (see §6).
- [ ] Crash-free-session rate bar met; cold-start + inference latency budgets met.
- [ ] App Store + Play Store listings, screenshots, privacy nutrition labels (honest).
- [ ] TestFlight + Play closed track → open beta → production.

### Later (v2+) — see FUTURE.md
Custom fine-tuned tool-calling model (friend's GPUs, once we have real failure traces), private multi-device mesh, agent marketplace. **Not now.**

---

## 6. Testing strategy (why it'll "work smoothly")

Smooth-at-launch is bought with a test pyramid + real-device discipline, not luck.

| Layer | Tool | What it covers |
|---|---|---|
| **Unit** | Jest | agent logic: intent routing, JSON parsing, tool validation, confirm-gating, redaction. The brain must be deterministic and fully unit-tested. |
| **Component** | RN Testing Library | screens render, capture flow, dashboard states |
| **Integration** | Jest + mocked native | agent → tool → memory round-trips; escalation preview/log path |
| **E2E on device** | **Maestro** | real user flows on a real phone/simulator: capture → remind → recall |
| **On-device model eval** | custom harness | tool-call success rate per flow (the reliability number); throughput/memory regression |
| **Privacy assertions** | Jest + network guard | **assert no network egress** on local flows; assert every escalation is logged + previewed. This is a CI gate, not a manual check. |
| **Device matrix** | manual + EAS | mid-range Android (RAM-constrained), older iPhone (jetsam), current flagships. On-device AI *must* be tested where it's weakest. |

**Quality bars to define & enforce (Definition of Done for v1):**
- Tool-call success rate ≥ [set in Phase 0] per flow, or the flow is deterministic.
- Cold start < X s; first token < Y s on the reference mid-range device (set real numbers in Phase 0).
- Crash-free sessions ≥ 99.x%.
- **Zero unexpected network egress** in the local tier (CI-enforced).
- Memory `.md` files human-readable + exportable (the trust feature actually works).

---

## 7. Release & CI/CD pipeline

```
git push  →  EAS Build (iOS + Android in the cloud)  →  automated tests
          →  internal install (dev devices)
          →  TestFlight (iOS) + Play internal/closed track (Android)
          →  external beta (the 10, then more)
          →  EAS Submit → App Store review + Play review
          →  Production. Staged rollout on Android.
```

- **One command, both platforms** (`eas build`, `eas submit`) — the whole reason we chose RN.
- **Store gotchas to plan for:** Apple's on-device-AI + data-privacy review; honest App Privacy "nutrition labels" (we say *nothing leaves the device* on local tier — and it's true); Android Play Store polices Accessibility API hard, so we use only sanctioned automation paths.
- **Model weights are NOT in the app bundle** — downloaded on first run (manifest + download manager). Keeps the binary small and lets us update models without a store release.

---

## 8. Risk register (engineering-specific)

| Risk | Likelihood | Mitigation |
|---|---|---|
| On-device model too weak/slow at tool-calling | **High** | Phase 0 gate; deterministic scaffolding; forced JSON; escalation fallback; smaller tool set |
| iOS jetsam kills the app under model memory pressure | Med-High | 3B ceiling on older devices; unload model when idle; quantization; device-matrix testing |
| `llama.rn`/sqlite-vec native build pain in Expo | Med | dev-client + config plugins; validated in Phase 0 before feature work |
| Small model returns malformed JSON → bad action | Med | forced/structured output + validator + confirm step; never act on unparsed output |
| Store rejection (privacy/AI policy) | Med | honest labels, no hidden network, no disallowed automation APIs |
| Scope creep / stall (the founder pattern) | **High** | thin slices, 10-user gate, one tool not a platform |

---

## 9. Immediate next actions (unblocked, in order)

> Post-pause restart plan (2026-08-29 — see DECISIONS.md). The Phase 0 scaffold exists but has never been installed/built/run. The ONLY goal of the next ~30 days is to fire the Phase 0 gate on a real phone. No v0.1 screens until it clears.

1. **Reinstall + rebuild the scaffold** — `npm install` in `code/`, `npx expo install --fix` to reconcile native deps, then `npm run typecheck`. The scaffold has never compiled; get it green on a dev machine first. *(0.5–1 day, no device needed.)*
2. **Pin the model URLs for real** — replace the placeholder `<repo>` values in `code/src/models/manifest.ts` (gemma-3n + llama-3.2-1b) and verify the qwen2.5-3b URL still resolves on HF. Only the qwen path is required to run the spike. *(1–2 hrs.)*
3. **Run it on a real device** — `npx expo run:ios` / `run:android` with a dev client (llama.rn is native; Expo Go won't do). Requires Xcode/Android Studio + a physical mid-range phone. This is the make-or-break moment.
4. **Fire all three spikes** (`toolcall`, `throughput`, `memory`) per the README; record the numbers in `docs/journal/` and set the REAL gate bars in `spikes/toolcall.spike.ts`.
5. **Recency-check the landscape** — last verified 2026-07-16; re-confirm OpenClaw / AGI+Qualcomm / big-tech haven't closed the on-device+private+polished gap. *(Half a day, can run in parallel with 1–4.*)
6. **Only if the gate clears:** build the first v0.1 slice (capture) one thin vertical at a time per §4. Name is not a blocker — ship Phase 0 under codename Vault.

---

*Companion docs: `MASTER.md` (why) · `PRODUCT.md` (what) · `WIREFRAMES.md` (screens) · `FUTURE.md` (post-v1) · `DECISIONS.md` (locked calls).*
