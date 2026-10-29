# Vault — Private, On-Device AI Agent

> **Meta hackathon entry (2026-10-29):** The selected project is a separate responsive web app in [`apps/goodfix-web/`](apps/goodfix-web/). Read its [PRD](apps/goodfix-web/PRD.md), [architecture](apps/goodfix-web/ARCHITECTURE.md), and [task plan](apps/goodfix-web/TASKS.md). The existing Vault Expo/React Native app remains a separate product and is not the active hackathon entry. The earlier root [`PRD.md`](PRD.md) is retained for the Vault mobile product and marked superseded for hackathon execution.

> **Vault native platform (2026-10-28):** The existing Vault product remains
> Expo/React Native for Android and iOS. The Flutter migration proposal is
> superseded and retained as historical analysis. Goodfix is a separate app.
> Start with [`CODEX-START-HERE.md`](CODEX-START-HERE.md).

Vault is a calm, trustworthy personal agent that captures what matters,
remembers it, and acts on it. It is local by default: notes, memory, and
ordinary actions stay on the phone. Optional Meta reasoning or vision may
send only a user-previewed, explicitly approved payload. The UI and audit
history must show which tier handled each turn; a cloud turn must never be
described as on-device.

The checked-in React Native app currently has no cloud API path. The
consent-gated Meta tier is not implemented yet. There are no accounts,
analytics, or tracking in the current implementation.

**Core loop:** capture → private memory → recall → bounded action → visible proof of where processing happened.

## Stitch wireframes

The project-local Codex MCP configuration connects the Stitch server at
`https://stitch.googleapis.com/mcp`. Keep the API key in the ignored `.env`
file using the format in [`.env.example`](.env.example); the local header
helper reads it without adding the key to Codex config or source. Trust the
project and reload Codex to discover Stitch tools. The 53 screen IDs and
prompts remain indexed in [`docs/WIREFRAMES.md`](docs/WIREFRAMES.md).

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

## Reference implementation tech stack

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

- Network access is not required for the current React Native local tier.
  Planned Meta calls require an exact payload preview, explicit approval,
  and an on-device audit entry.
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

- `CODEX-START-HERE.md` — Codex project entry point and task source order
- `AGENTS.md` — persistent repository rules
- `.agents/skills/adversarial-hackathon-review/SKILL.md` — milestone review workflow
- `docs/ARCHITECTURE.md` — full system design
- `docs/WIREFRAMES.md` — the visual source of truth
- `docs/V01-SCOPE.md` — what v0.1 includes and defers
- `docs/HACKATHON-FEASIBILITY-2026-10-28.md` — Meta hackathon product thesis and demo loop

## Codex workflow

Codex is the primary build agent for this repository. Start with
[`CODEX-START-HERE.md`](CODEX-START-HERE.md), which points to the locked
decisions, current status, hackathon strategy, and detailed build playbook.
The existing `.claude/` tools remain available for compatibility.

## License

MIT — see [LICENSE](LICENSE).
