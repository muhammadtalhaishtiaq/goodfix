# ARCHITECTURE — Vault v0.1

> Companion to `V01-SCOPE.md` (what we build) and `WIREFRAMES.md` (what it looks like). This document explains **how it works end to end**. Written for Talha first (plain language up top), developers second (technical detail below).

---

## 1. What Vault is (plain language)

Vault is a private AI assistant that lives on your phone. It does three things well: **it remembers what you tell it, it reminds you of things, and it helps you organize your day** — all without your data ever leaving the device. You talk or speak to it like a person; behind the scenes, an on-device AI model turns your words into actions, a strict "did the user actually approve this?" gate stands in front of anything that changes something outside the app (a reminder, a calendar event), and a privacy dashboard shows you proof that nothing left the phone.

**The on-device privacy guarantees**

- **Local by default, in code, not just in words.** The orchestrator stamps every turn with tier `'local'`; the audit log hard-forces `leftDevice: false`; a network guard throws for any URL that isn't a Hugging Face model download.
- **The model never acts directly.** It only proposes — validated code decides, and you confirm anything side-effecting.
- **You can see everything it remembers.** Memory is plain readable `.md` files in the app's own storage — no black box.
- **Proof, not promises.** Every action is written to an append-only audit log you can inspect row by row in the Privacy dashboard.
- **Nothing is bundled with a cloud fallback in v0.1.** There is no cloud tier to leak through; the BYOK ("your own key") code exists only as a secure store for the future, and is not wired into any flow.

---

## 2. System overview

```
┌──────────────────────────────────────────────────────────────┐
│ UI — React Native screens (theme: off-white #FAF9F6,         │
│ teal #0F766E, "Private · on-device" badge on every screen)   │
│ Welcome → HowPrivacyWorks → Onboarding (model setup)         │
│   → Permissions → Main tabs: Home · Memory · Privacy         │
│ + VoiceModal (hold-to-talk) + ActionConfirmModal (trust gate)│
└──────────────┬───────────────────────────────────────────────┘
               │ chat text / voice transcript / taps
               ▼
┌──────────────────────────────────────────────────────────────┐
│ STATE — Zustand store (src/state/store.ts)                   │
│ chat messages · onboarding state · model download progress   │
│ pendingConfirm (trust-gate queue) · alwaysAllowed kinds       │
│ memoryBump / auditBump (screen refresh counters)              │
└──────────────┬───────────────────────────────────────────────┘
               │ input text
               ▼
┌──────────────────────────────────────────────────────────────┐
│ AGENT CORE — deterministic state machine                     │
│ (src/agent/orchestrator.ts)                                  │
│   Router (src/agent/router.ts):                              │
│     on-device model (forced-JSON {tool, args}) → validate    │
│     ANY failure → deterministic keyword/regex fallback       │
│   Validator (src/agent/validator.ts): schema, types,         │
│     future-dated datetimes, length caps; strips unknowns     │
│   Orchestrator rules:                                        │
│     • model proposes, code validates, user confirms          │
│     • save_note / recall_memory → run now, audit only        │
│     • create_reminder / create_event → ask first, never auto │
│     • tier is ALWAYS 'local' in v0.1                          │
└──────┬───────────────────────────────┬───────────────────────┘
       │ completion / embeddings       │ save · update · remove
       ▼                               ▼  recall(query)
┌─────────────────────────┐  ┌─────────────────────────────────┐
│ INFERENCE               │  │ MEMORY — src/memory/            │
│ src/inference/          │  │ MdStore: <docs>/vault-memory/   │
│ InferenceEngine contract│  │   <id>.md files (source of      │
│   LlamaEngine: llama.rn │  │   truth, human-readable)        │
│     (llama.cpp native), │  │ VectorIndex: expo-sqlite —      │
│     loaded lazily       │  │   vec0 (sqlite-vec, 1024-dim) + │
│     Qwen 2.5 3B Instruct│  │   FTS5 keyword index            │
│       (~2 GB GGUF)      │  │ RecallEngine: vector + keyword  │
│     Qwen3-Embedding-0.6B│  │   + recency merge; degrades     │
│       (1024-dim, ~640MB)│  │   gracefully to FTS5-only when  │
│   MockEngine: tests +   │  │   the embed model is absent     │
│     UI dev, no model    │  └─────────────────────────────────┘
│ ModelManager: one-time  │
│   download to           │
│   <docs>/vault-models/  │
└─────────────────────────┘
              │
              ▼  confirmed ToolCall
┌──────────────────────────────────────────────────────────────┐
│ TOOLS — src/tools/ (the ONLY way the agent touches the OS)   │
│ create_reminder → expo-notifications (local notification)     │
│ create_event    → expo-calendar (device calendar event)       │
│ save_note       → memory store (app-private, no confirm)      │
│ recall_memory   → memory store (read-only, no confirm)        │
│ Executor wraps every run in try/catch; every run is audited. │
└──────────────┬───────────────────────────────────────────────┘
               │ every step audited
               ▼
┌──────────────────────────────────────────────────────────────┐
│ PRIVACY & ESCALATION GATES                                   │
│ Trust gate: ActionConfirmModal bottom sheet — exact preview  │
│   + Confirm / Edit / Cancel + "Always allow this kind"       │
│ Audit log: src/privacy/auditLog.ts — append-only JSONL in    │
│   <docs>/vault-audit/audit.jsonl; user can inspect, export,   │
│   wipe. Shows in Privacy dashboard (tappable, expandable).   │
│ Network guard: src/privacy/networkGuard.ts — only Hugging    │
│   Face model downloads may use the network. Everything else  │
│   throws.                                                    │
│ Escalation (future): src/escalation/byok.ts — SecureStore    │
│   (Keychain/Keystore) for the user's own API keys; NOT wired │
│   into v0.1 flows. Tier labels stay honest: "leaves device". │
└──────────────────────────────────────────────────────────────┘
```

Wiring glue: `src/state/agent.ts` builds the whole pipeline once (engine → memory → tool registry → audit → orchestrator), caches it as a singleton, and exposes `agentTurn(input)` to the UI. `App.tsx` warms memory in the background on launch and mounts the navigation stack. `src/ui/agentBridge.ts` lazily loads the agent for the UI so screens typecheck independently.

---

## 3. Layer by layer

### 3.1 UI (`src/ui/`)

**Responsibility.** Everything the user sees and touches. Conversation surface, voice capture, memory browsing, privacy proof, onboarding, and the confirmation sheet. Styling comes from `ui/theme.ts` (the wireframe design system). It never contains agent logic — it renders state and forwards user input through the agent bridge.

**Key files**

| File | Role |
|---|---|
| `App.tsx` | Entry: warms memory in background, mounts `NavigationContainer` → `RootNavigator`. |
| `ui/navigation.tsx` | Stack: Welcome → HowPrivacyWorks → Onboarding → Permissions → Main (tabs: Home · Memory · Privacy); modal VoiceModal; Diagnostics as a stack screen (reached from Privacy's "Run health check" — not a tab). |
| `ui/theme.ts` | Design tokens: off-white `#FAF9F6`, teal `#0F766E`, 12px roundness, friendly type. |
| `ui/screens/Home.tsx` | Chat: text input + quick-action chips → `agentTurn()` → assistant replies; triggers `ActionConfirmModal` when the turn needs confirmation; "always allow" bypasses the sheet for previously approved kinds. |
| `ui/screens/VoiceModal.tsx` | Hold-to-talk with calm teal waveform (`@react-native-voice/voice`); editable live transcript → saved to memory via the agent. |
| `ui/screens/Memory.tsx` | "What it knows about me": newest-first groups, search, edit/delete notes. |
| `ui/screens/PrivacyDashboard.tsx` | Privacy dashboard: note count, what left the device ("Nothing"), expandable audit rows, "Run health check" entry point. |
| `ui/components/ActionConfirmModal.tsx` | The trust gate: bottom sheet with exact action preview, Confirm / Edit / Cancel, "Always allow this kind of action". Edit discards the proposal and re-runs the edited text as a fresh request. |
| `ui/screens/Welcome|HowPrivacyWorks|Onboarding|Permissions` | Onboarding chain: privacy promise → three privacy cards → model download progress ring → permission requests (microphone, notifications, reminders & calendar) with plain-language reasons. |
| `ui/screens/Diagnostics.tsx` | Health check: runs the router tests, a speed test, and a memory test against the real device. |
| `ui/agentBridge.ts` | Lazy `require` of the agent module so UI code never statically depends on native-dependent modules. |

**Inputs.** User taps/text/voice; store state (`pendingConfirm`, `messages`).
**Outputs.** Agent requests, store updates (messages, confirm queue), navigation.

### 3.2 State (`src/state/`)

**Responsibility.** The app's shared in-memory state and the singleton wiring of the agent stack.

**Key files**

| File | Role |
|---|---|
| `state/store.ts` | Zustand store: `onboarded`, `modelState`/`modelProgress` (download), `messages`, `pendingConfirm`, `alwaysAllowed` (trust-gate checkbox memory), `memoryBump`/`auditBump` refresh counters. |
| `state/agent.ts` | Builds + caches the pipeline: engine → `VaultMemory` → tool registry → audit → `Orchestrator`. `getEngine()` uses the downloaded LlamaEngine when present, otherwise MockEngine (UI still works before the model downloads). |

**Inputs.** UI actions, agent turn results.
**Outputs.** Reactive state consumed by screens; the wired `Orchestrator` instance.

### 3.3 Agent core (`src/agent/`)

**Responsibility.** Decides what to do with each message. The **deterministic state machine** owns control flow; the model is a slot-filler only — it never acts directly.

**Key files**

| File | Role |
|---|---|
| `orchestrator.ts` | One message in → one turn out. Routes, validates, runs safe tools immediately (`save_note`, `recall_memory`), parks side-effecting tools (`create_reminder`, `create_event`) as *pending confirmations* — `turn()` only asks; `confirm()` executes after approval. Every step is audited with tier `'local'`, `leftDevice: false`. |
| `router.ts` | `Router.route()`: asks the on-device model for a single JSON `{tool, args}` (forced JSON schema), extracts and validates it; **any** failure (no engine, bad JSON, validation miss, thrown error) drops to `fallbackRoute()` — deterministic keyword/regex routing with a pragmatic relative-date parser ("tomorrow at 9am", "in 2 hours", "Friday at 7pm"). Returns the decision source (`model` vs `deterministic-fallback`) for honesty in diagnostics. |
| `validator.ts` | Hand-rolled arg validation mirroring `toolSchemas.ts`: known tool names, non-empty title/body/query, `datetime_iso` parses and is future-dated, positive integer durations, 5,000-char body cap. Unknown fields are stripped; returns sanitized args. |
| `toolSchemas.ts` | JSON schemas for the 5 tools (`create_reminder`, `create_event`, `save_note`, `recall_memory`, `none`) — used in the router prompt and forced-JSON output. |
| `prompts.ts` | Router prompt (tools + schemas + "output JSON only" rules + current time) and chat prompt (answer ONLY from provided memory; never invent). |

**Inputs.** Raw user text (from UI). `InferenceEngine | null` dependency.
**Outputs.** `AgentTurn` (reply text, toolCall, confirmRequired), plus a full per-turn audit trail.

### 3.4 Inference (`src/inference/`)

**Responsibility.** Running the on-device models. The app talks to models **only** through the `InferenceEngine` interface (complete + embed), so llama.rn, mocks, or future engines are interchangeable.

**Key files**

| File | Role |
|---|---|
| `types.ts` | `InferenceEngine` contract: `load/unload/status/complete/embed`. |
| `llamaEngine.ts` | llama.rn-backed engine (llama.cpp). Lazily imports the native module so tests and bundlers never load it. `complete()` supports forced-JSON via `response_format: json_schema`. |
| `mockEngine.ts` | Deterministic stand-in for Jest and UI dev without a downloaded model. |
| `modelManager.ts` | Model manifest + download manager. Models live in `<documentDirectory>/vault-models/`, downloaded once, never bundled: Qwen 2.5 3B Instruct Q4_K_M (~2 GB, chat) and Qwen3-Embedding-0.6B Q8_0 (1024 dims, ~640 MB, embeddings). Skips re-download if present. |

**Inputs.** Prompt text / text to embed; model file path.
**Outputs.** Raw completion text; embedding vectors; model download progress.

### 3.5 Memory (`src/memory/`)

**Responsibility.** Private, durable, searchable memory on the device. Source of truth = human-readable `.md` files the user can open and read; indexes make recall fast.

**Key files**

| File | Role |
|---|---|
| `index.ts` | `VaultMemory` — composes MdStore + VectorIndex + RecallEngine. Embeddings are **lazy**: computed only when the embedding model file is actually on disk; otherwise recall degrades gracefully to FTS5-only (never throws for a missing model). |
| `mdStore.ts` | `.md` files at `<documentDirectory>/vault-memory/<id>.md` with frontmatter (id, createdAt, updatedAt, kind). `save/update/remove/get/list` (newest-first)/`count`. |
| `vectorIndex.ts` | expo-sqlite: `mem_vec` virtual table (sqlite-vec vec0, 1024-dim, L2 nearest-neighbor) + `mem_fts` FTS5 keyword table. Runtime-checked: if the vec0 extension is missing, vector indexing degrades to FTS5-only (`isVecAvailable()`), never crashes. |
| `recall.ts` | `RecallEngine`: semantic vector search → keyword FTS search → recency fallback; merges, dedupes, ranks. |
| `pure.ts` | Native-free helpers (frontmatter parse/serialize, float32 blob packing, cosine similarity, note ids) — safe for Jest. |
| `types.ts` | `MemoryStore` contract + `MemoryNote`/`RecallHit` shapes. |

**Inputs.** Note bodies to save; search queries.
**Outputs.** Notes (with ids), ranked recall hits with method labels (`vector`/`fts`/`recent`).

### 3.6 Tools (`src/tools/`)

**Responsibility.** The **only** way the agent touches the outside world. Each tool has one sanctioned OS job, runs through native APIs, and is audit-logged.

**Key files**

| File | Role |
|---|---|
| `types.ts` | `ToolDefinition`: name, plain-language description (shown in the confirm sheet), `sideEffecting` flag, `execute(args, ctx)`. |
| `registry.ts` | Wires the 4 v0.1 tools; marks `create_reminder` + `create_event` as `SIDE_EFFECTING` (confirmation required). |
| `reminder.ts` | `create_reminder`: requests notification permission, schedules a **local** notification via expo-notifications. Future-dated, side-effecting. |
| `calendar.ts` | `create_event`: requests calendar permission, writes to the first writable device calendar via expo-calendar (v57 class API), default 60 min. Side-effecting. |
| `notes.ts` | `save_note`: writes to the app's private memory store. Not side-effecting (stays inside Vault) → no confirmation, audit only. |
| `recallTool.ts` | `recall_memory`: read-only memory search. Not side-effecting → no confirmation, audit only. |
| `executor.ts` | Runs validated calls against the registry; try/catch so a tool can never throw into the turn loop; all runs audited via tool context. |

**Inputs.** Validated `ToolCall` args.
**Outputs.** `ToolResult` (ok/summary/data/error) + audit entry.

### 3.7 Privacy & escalation (`src/privacy/`, `src/escalation/`)

**Responsibility.** Prove nothing leaked — and physically prevent anything from leaking.

**Key files**

| File | Role |
|---|---|
| `privacy/auditLog.ts` | Append-only JSONL at `<documentDirectory>/vault-audit/audit.jsonl`. Every tool run and turn event writes `{ts, tool, summary, tier, leftDevice, detail}`. `leftDevice` is **forced false** in v0.1. Corrupt lines are skipped; newest-first reads; user can clear it. Surfaced in the Privacy dashboard. |
| `privacy/networkGuard.ts` | Pure, testable allowlist: the only hosts Vault may ever contact are Hugging Face (`huggingface.co`, its CDN/LFS/Xet hosts, `*.hf.co`) — and only for model downloads. Any other URL throws. |
| `escalation/byok.ts` | `ByokStore`: user's own provider API keys in expo-secure-store (iOS Keychain / Android Keystore). **Not wired into any v0.1 flow** — local-only app. `tierLabel()` keeps future UI honest: BYOK/boost tiers are labeled as leaving the device. |

**Inputs.** Audit entries, URLs to check, keys (future).
**Outputs.** Audit file, allow/block verdicts, secure key storage.

### 3.8 Diagnostics (`src/diagnostics/`)

**Responsibility.** The Phase-0 gate harness — honest self-testing on the real device.

**Key files**

| File | Role |
|---|---|
| `diagnostics/spikes.ts` | 30 fixed tool-calling cases across the 5 router outputs + deterministic `scoreToolCall` (right tool? right args?) against a fixed reference date. Gate bars: **toolRight ≥ 90% AND argsRight ≥ 85% → PASS**. Pure module: no expo, no native imports. The Diagnostics screen runs these through the real `Router` + engine, plus a tok/s speed test and a save/recall memory test, and reports actual numbers — missing pieces report as missing, never as passing. |

---

## 4. End-to-end flows

### (a) Capture → on-device memory → recall

1. **Capture.** User types (Home) or speaks (VoiceModal → transcript). Text goes to `agentTurn(input)` → `Orchestrator.turn()` → `Router.route()` → `save_note` (model-proposed or deterministic-fallback), validated.
2. **Memory write.** Orchestrator calls `memory.save(body, 'note')` immediately (no confirmation — nothing leaves Vault) → `.md` file written → vector index upserted (embedding computed only if the embed model is downloaded; FTS entry always written). Audit: `executed / save_note / leftDevice: false`.
3. **Recall.** Later, "What did I say about my passport?" → `recall_memory` (no confirmation — read-only) → `RecallEngine` merges vector + FTS + recency hits → the model drafts a reply grounded **only** in the hits (or a deterministic listing if the engine is absent). Audit: `executed / recall_memory / leftDevice: false`.

Everything in this loop touches only: `Home`/`VoiceModal` → store → orchestrator → router → memory → (optional) engine. No network, no cloud, no side effects.

### (b) Action request → trust gate → execution → audit

1. **Request.** "Remind me to call the bank tomorrow at 9am" → router → validated `create_reminder` with `{title, datetime_iso}`. The orchestrator sees a `SIDE_EFFECTING` tool and **stops**: it parks the call as a pending turn, sets `pendingConfirm` in the store, and returns the confirmation prompt as the reply. Nothing has executed.
2. **Trust gate.** `ActionConfirmModal` slides up: the exact action preview ("Create reminder 'call the bank' at …?"), Confirm / Edit / Cancel, and "Always allow this kind of action" (recorded in `alwaysAllowed` — future actions of that kind skip the sheet, exactly as the user chose). **Edit** discards the proposal and re-runs the edited text as a fresh request.
3. **Execution.** On Confirm, `Orchestrator.confirm(turnId, true)` runs the tool via the registry/executor: permission check → expo-notifications schedules the local notification → returns `{ok, notificationId}`. On Cancel, an audit entry `rejected` is written and nothing happens.
4. **Audit.** Every step (`routed`, `validated`, `confirm_requested`, `confirmed`/`rejected`, `executed`) lands in the append-only JSONL audit log with `tier: 'local'`, `leftDevice: false` — visible in the Privacy dashboard.

Calendar events follow the identical path through `create_event` (expo-calendar, first writable calendar).

### (c) Voice capture

1. User opens VoiceModal (modal presentation from the tab stack) and holds to talk.
2. `@react-native-voice/voice` (lazily required — missing native module degrades gracefully) streams the transcript; the screen shows a calm teal animated waveform and an editable transcript field.
3. On save, the transcript text is submitted as a normal agent turn → routed to `save_note` → memory write → the wireframe's "Saved to your private memory" reassurance.
4. Microphone access was granted during the Permissions onboarding step with a plain-language reason; if denied, the UI explains and offers a retry path.

### (d) Privacy health check

1. Privacy dashboard → **Run health check** (a row, not a tab) → Diagnostics screen.
2. Three on-device checks, all reported honestly (missing pieces say "missing", never "pass"):
   - **Understanding:** the 30 spike cases from `diagnostics/spikes.ts` run through the real `Router` + engine (or the deterministic fallback if no model), scored against the ≥ 90% tool / ≥ 85% args bars.
   - **Speed:** a short on-device completion is timed → tok/sec (real number from this phone, or "model not downloaded").
   - **Memory:** 10 notes saved, 3 queries recalled → average ms + hit counts.
3. Results are actual measurements from the device the user is holding — this is the only place numbers appear, and they are never fabricated.

---

## 5. Data & privacy

### What is stored where (all on-device)

| Data | Where | How |
|---|---|---|
| Notes / memory | `<documentDirectory>/vault-memory/<id>.md` | Human-readable Markdown + frontmatter (id, createdAt, updatedAt, kind). The user can literally open these. |
| Memory index | `vault.db` (expo-sqlite, app storage) | `mem_vec` (vec0 vector index, 1024-dim) + `mem_fts` (FTS5 keyword index) + `mem_vec_ids` mapping table. |
| Audit log | `<documentDirectory>/vault-audit/audit.jsonl` | Append-only, one JSON object per line. Inspected in the Privacy dashboard; user can wipe it. |
| AI models | `<documentDirectory>/vault-models/` | Qwen 2.5 3B Instruct GGUF + Qwen3-Embedding-0.6B GGUF, downloaded once from Hugging Face. |
| API keys (future) | expo-secure-store | iOS Keychain / Android Keystore. Not used by v0.1 flows. |
| Chat UI state | In-memory Zustand store | Ephemeral; not persisted in v0.1. |
| Reminders / events | OS stores | Local notifications (expo-notifications) and the device calendar (expo-calendar) — the OS's own data, not Vault's servers. |

### What never leaves the device

In v0.1: **everything**. The only permitted network traffic is the one-time model download from Hugging Face, enforced by `networkGuard.assertLocalOnly()`. There is no analytics, no telemetry, no crash reporting, no cloud tier — the audit log records `leftDevice: false` on every single entry as the proof.

### The audit log

The audit log is the privacy dashboard's evidence. Every turn writes entries (`turn`, `routed`, `validated`, `confirm_requested`, `confirmed`, `rejected`, `executed`, `error`) and every tool execution writes its own entry with the tool name, a plain-language summary, the tier, and `leftDevice: false`. Rows are tappable/expandable in the Privacy dashboard, which also shows the note count and a "Nothing [left the device]" card.

---

## 6. Build & run

**Stack.** Expo SDK 57 · React Native 0.86 · React 19 · TypeScript 6 · Zustand · React Navigation 7 · llama.rn (llama.cpp on-device inference) · expo-sqlite (+ sqlite-vec / FTS5) · expo-file-system · expo-secure-store · expo-notifications · expo-calendar · `@react-native-voice/voice`. Dev: Jest 29 + jest-expo (73 tests, 4 suites, all green).

**Identifiers.** Android package / iOS bundle ID: **`ai.vault.private`** (see `app.json`). Android native namespace: `ai.vault.app` (`private` is a Java reserved word). App slug: `vault-private-ai`, version `0.1.0`.

**Fresh checkout → APK (high level, no secrets involved)**

1. `npm install` (installs all deps; code is self-contained).
2. `npx tsc --noEmit` — must pass with zero errors.
3. `npx jest` — 4 suites / 73 tests must pass.
4. Android build: Expo prebuild / EAS build, or `expo run:android` with an Android SDK + JDK 17 on a machine that can run it. Produces `app/build/outputs/apk/...apk`.
5. Install the APK on a phone; on first launch: onboarding → model downloads from Hugging Face (one-time, ~2.6 GB total, Wi-Fi recommended) → the app works fully offline.
6. Tap **Privacy → Run health check** to see real on-device numbers.

**Honest boundaries.** No successful physical-device runtime test or real-model mobile test has occurred yet; the deterministic fallback router scored 30/30 on the Phase-0 spike harness (harness, not device). Do not claim real Qwen validation unless the model actually runs on a phone.

---

## 7. What's deferred post-v0.1 (per `V01-SCOPE.md`)

Explicitly **not** in v0.1 — anything from the 53-screen `WIREFRAMES.md` vision beyond the six core screens:

- **Skills** (Skills Hub, marketplace, record-your-own) and the 78-skill surface
- **Automations** (cron jobs, routines, event hooks, delegation)
- **Integrations** (channels, Home Assistant, music)
- **MCP** connections and provider routing
- **Cloud tiers** — BYOK (own API key) and Boost (cloud brain); the store + labels exist, the flows do not
- **Model-switching UI** and the Models & tiers screens
- Watch support, fine-tuned models, monetization
- The remaining screens: personality editor, appearance, command palette, attachments/vision, session history beyond the basics, usage insights, backup/restore, about/licenses, developer/API surfaces

The six locked v0.1 screens: Welcome/privacy promise · Home/conversation · Voice capture · Memory ("What it knows about me") · Action-confirm trust gate · Privacy dashboard (+ onboarding: privacy explainer, model setup, permissions; + Diagnostics health check reachable from Privacy).

---

*Last updated: 2026-09-21. Read against the actual code in `~/workspace/vault/code/src`; if code and doc disagree, the code wins.*
