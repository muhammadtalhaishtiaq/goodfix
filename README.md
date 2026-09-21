# Vault — Private, On-Device AI Agent

Vault is a calm, trustworthy mobile companion that captures what matters,
remembers it, and acts on it — with every byte staying on your device.
No accounts. No cloud. No tracking. A persistent `Private · on-device`
badge in the app is the proof, not the promise.

**Core loop:** capture → on-device memory → recall → one bounded reminder → proof nothing leaked.

## Screens (v0.1)

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Welcome / privacy promise | First-run promise: what stays on device |
| 2 | Home / conversation | Chat with the on-device agent |
| 3 | Voice capture | Hands-free capture with transcript review |
| 4 | Memory | Search, edit, and delete what Vault remembers |
| 5 | Action confirmation | Explicit approve/deny gate before any side effect |
| 6 | Privacy dashboard | Audit log: what ran, what stayed local |

Onboarding also covers a plain-language privacy explanation, model setup
(download progress for the on-device models), and OS permissions.

## How it works

- **Agent core** (`src/agent/`): a Phase-0 deterministic router scores intent,
  a validator checks the plan, and an orchestrator executes tools — all
  behind the action-confirmation gate.
- **Memory** (`src/memory/`): SQLite with FTS5 keyword search plus an
  optional sqlite-vec vector index for semantic recall. If the embedding
  model can't run, Vault truthfully degrades to FTS5 — never silently.
- **Inference** (`src/inference/`): `llama.rn` (llama.cpp) runs the chat and
  embedding models fully on-device. The native module is lazily imported so
  tests and non-device bundles never touch it.
- **State** (`src/state/`): Zustand stores for conversation, memory, settings.
- **UI** (`src/ui/`): React Navigation screens in the wireframe-locked visual
  language — soft off-white `#FAF9F6`, deep teal `#0F766E`, 12px radii,
  generous whitespace, Lucide line icons only.

## Models (downloaded on-device, never uploaded)

| Model | Size | Purpose |
|-------|------|---------|
| Qwen 2.5 3B Instruct (Q4_K_M) | ~2 GB | Chat / planning |
| Qwen3-Embedding-0.6B (Q8_0, 1024-dim) | ~640 MB | Semantic memory search |

## Tech stack

Expo 57 · React Native 0.86 · TypeScript · React Navigation 7 · Zustand 5 ·
expo-sqlite (FTS5 + sqlite-vec) · llama.rn 0.12 · lucide-react-native ·
Jest 29 + jest-expo.

## Project structure

```
App.tsx                  Entry: navigation + background memory warm-up
src/agent/               Router, validator, orchestrator, tools
src/memory/              SQLite store, FTS5 + vector index, recall engine
src/inference/           LlamaEngine (device) / MockEngine (tests), model manager
src/state/               Zustand stores
src/ui/screens/          The six v0.1 screens + onboarding + diagnostics
src/ui/components/       Shared UI (incl. the Private·on-device badge)
__tests__/               Jest suites (73 tests)
android/                 Native Android project (applicationId ai.vault.private)
docs/                    ARCHITECTURE.md, WIREFRAMES.md, V01-SCOPE.md, …
```

## Getting started

```bash
npm install
npx expo start          # dev menu: Android / iOS / web
npx expo run:android    # native Android build
```

### Checks

```bash
npx tsc --noEmit        # zero errors
npx jest                # 4 suites, 73/73 green
```

## Privacy & security

- Network access is never required for core features; the audit log in the
  Privacy dashboard records every tool run and confirmation decision.
- Side effects (calendar, notifications, reminders) only execute after
  explicit user approval in the Action confirmation screen.
- No analytics, no crash reporters, no third-party SDKs phoning home.

## Status & limitations

v0.1 is code-complete: `tsc` and all 73 Jest tests pass, and the
deterministic Phase-0 router scores 30/30 on its harness. Real-model
validation on a physical device (Qwen inference latency, memory footprint,
voice pipeline) has not run yet — anything claiming otherwise would be
aspirational, not measured.

## Docs

- `docs/ARCHITECTURE.md` — full system design
- `docs/WIREFRAMES.md` — the visual source of truth
- `docs/V01-SCOPE.md` — what v0.1 includes and defers

## License

MIT — see [LICENSE](LICENSE).
