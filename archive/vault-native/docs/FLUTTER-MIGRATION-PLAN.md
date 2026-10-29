# Vault Flutter migration plan

> **SUPERSEDED 2026-10-28:** Talha chose to continue the existing Expo/React
> Native app. This file is retained as historical migration analysis only;
> do not implement this plan unless a newer decision reopens Flutter.

**Decision date:** 2026-10-28  
**Target:** one Flutter/Dart codebase for Android and iOS.  
**Product UI source:** 53-screen Stitch map in `docs/WIREFRAMES.md`.  
**Hackathon deadline:** 2026-11-04 21:00 ET.

## Objective

Port Vault's complete product to Flutter without losing its agent behavior, local memory contract, privacy boundaries, or existing visual direction. The checked-in React Native app is the reference for behavior until the Flutter migration has passed its acceptance gates.

The full 53-screen map is the product destination. A hackathon demo must be a finished, working path through that product; it must not become 53 hollow screens or a disconnected AI showcase. A full functional migration of all 53 screens by the Nov 4 deadline is not a safe claim given the current toolchain and native-inference unknowns.

## Critical architecture gate: local inference on both platforms

The Flutter port cannot reuse `llama.rn`. It needs a Dart/native inference layer that runs the intended GGUF model on **both Android and iOS**. A few current package pages show why this must be proven before the UI migration:

- `local_inference_flutter` documents iOS release/device success, but says its Android release APK has not run on an Android device yet.
- `llama_cpp_flutter` documents iOS/macOS support and explicitly lists Android as not yet supported.
- `llama_flutter_android` is explicitly Android-only.

These are candidates to smoke-test, not approved dependencies. Do not choose a package based on its pub.dev platform badge alone. First load the same intended model on a real Android device and a real iPhone, verify token streaming/tool use, and record cold load, time-to-first-token, throughput, memory, model storage, cancellation, and crash behavior. If two platform adapters are needed, hide them behind one app-owned `InferenceEngine` interface; do not let plugin classes spread through UI or agent logic.

The camera is lower-risk: Flutter's official `camera` package documents Android and iOS support. That does not validate SAM response decoding, permission handling in this app, or the full camera-to-memory loop.

## Flutter app shape

Use a modest feature-first structure that preserves the current separations. Flutter's architecture guide recommends a UI layer (views and view models) and a data layer (repositories and services), with domain/use-case logic added where cross-feature workflows become complex.

```text
lib/
  app/                 bootstrap, navigation, theme, dependency wiring
  core/                privacy tiers, validation, audit contracts, errors
  features/
    capture/           text, voice, photo entry points
    agent/             deterministic orchestration and model adapters
    memory/            Markdown source of truth, FTS/vector indexes
    actions/            reminders/calendar proposal and confirmation
    privacy/            consent previews, audit history, data controls
    vision/             SAM request, mask/box decoding and overlay
    settings/           model and local/cloud configuration
    ...                feature groupings derived from all Stitch screens
  platform/            isolated Android/iOS plugin adapters
```

Views render state; view models coordinate user events; repositories own source-of-truth data; services isolate model APIs, file operations, and OS plugins. Keep the agent's validator/orchestrator deterministic. Models suggest; validators constrain; the user confirms side effects.

## Migration order

### Gate 0 — environment and empty native build

Record Flutter/Dart versions, `flutter doctor`, Android SDK/NDK/JDK state, Xcode state, signing availability, physical devices, and available storage. Build a blank Flutter app for Android and iOS before moving any feature. Produce a local installable Android build and a local iOS build/archive path. Store publishing is separate from build artifacts.

### Gate 1 — the platform services that can kill the port

Spike independently and document package choice/limits for:

- Llama.cpp GGUF inference and background-safe model loading on Android + iOS.
- Camera capture and permissions on Android + iOS.
- Markdown files plus SQLite/FTS5 indexing; preserve the existing `.md` memory format and make indexes rebuildable.
- OS secure storage for a user-provided Meta API key. Never bundle a shared app key; never put a user's key in logs or exports.
- Local notifications and calendar/reminder bridges, including permission and confirmation behavior on both operating systems.
- Voice capture/transcription and whether it works offline on both targets. Do not promise offline voice until measured.

Do not begin the 53-screen visual port until inference, storage, secure storage, and a native build path have credible answers.

### Gate 2 — agent and memory vertical slice

Port these behaviors before broad navigation: local capture → validated local memory write → keyword/semantic recall → edit/delete → action proposal → explicit confirmation → audit record. Preserve behavior from `src/agent/`, `src/memory/`, `src/tools/`, and `src/privacy/` as source references. Keep Markdown memory portable and user-readable; treat SQLite and vector indexes as derived data.

### Gate 3 — Meta models and trust boundary

Verify current Meta API request and response schemas from official docs and the participant account before implementation. Add the consent preview and local audit first, then connect Muse Spark for one bounded multi-step task over only the selected memory excerpts. Tool proposals still pass existing validation; reminders/calendar still require a separate action confirmation.

Use SAM 3.1 on one still photo and one named object. Decode the actual response and render its mask/box. Save the user-confirmed location to local memory and prove it can be recalled in airplane mode. Add Muse Image only if a user-requested generated memory/plan artifact materially helps this loop; keep it out of the inference and platform gates otherwise.

### Gate 4 — Stitch screens and full product roadmap

`docs/WIREFRAMES.md` lists 53 screen ids, prompts, and the Stitch project/design-system ids. Build complete features, not independent static screens. Group the screens into navigation/features; preserve loading, denied-permission, empty, error, consent, and destructive-action states. Track every screen against a real behavior and acceptance criterion.

The Stitch MCP is not exposed as a callable tool in this Codex session. The local wireframe document is the available source until the MCP is connected with a rotated key. The screen PNG exports are not in the checked-in `assets/` directory; retrieve/reference them from the Stitch project after access is restored.

## Hackathon demo acceptance

The deadline path should prove one connected agent loop on a native Flutter build:

1. The local model saves/recalls personal context with no network.
2. Muse Spark receives a hard task only after the user previews the exact selected memory payload and approves; the response produces a validated plan.
3. SAM 3.1 segments a named object in a real captured image; the overlay is grounded in the returned mask/box.
4. The user saves that visual location into local memory, disconnects the network, and recalls it successfully.
5. The audit view accurately shows local work versus the approved Meta calls.

This demo should be filmed from the same Flutter build that is submitted. If a gate fails, cut the unreliable capability and report the actual result; never substitute mock model output while claiming a live integration.

## Build artifacts and release boundary

Target local Android APK/AAB and iOS build/archive artifacts once the migration can compile. Android artifacts require the configured Android toolchain; an installable iOS build requires macOS/Xcode and a valid signing setup. Public App Store/Play Store submission is a separate decision. Keep signing credentials and API credentials out of the repository.

## Sources checked 2026-10-28

- [Flutter app architecture](https://docs.flutter.dev/app-architecture/guide) — views, view models, repositories, services, optional domain layer.
- [Flutter camera plugin](https://pub.dev/packages/camera) — Android/iOS camera support and platform permission setup.
- [local_inference_flutter](https://pub.dev/packages/local_inference_flutter) — candidate platform status; Android device execution remains unverified on its package page.
- [llama_cpp_flutter](https://pub.dev/packages/llama_cpp_flutter) — iOS/macOS support; Android not yet supported on its package page.
- [llama_flutter_android](https://pub.dev/packages/llama_flutter_android) — Android-only llama.cpp plugin.
- [Flutter Android build/release](https://docs.flutter.dev/deployment/android) and [iOS setup](https://docs.flutter.dev/platform-integration/ios/setup) — local build requirements; final signing state is machine-specific.
