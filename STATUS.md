# Vault build status

Last updated: 2026-10-20

## Meta hackathon
- Meta Global AI Developer Hackathon 2026: application APPROVED 2026-10-20
  (Indie Developer Track, Vault split-brain entry). Event runs
  2026-10-26 to 2026-11-04; submissions due 2026-11-04.
- Next milestone: the Phase 0 on-device gate — get the chat model running
  on a real phone and measure the router (tool-calling accuracy), per
  docs/archive/DECISIONS.md. No APK / device run has happened yet.

## Source
- App + agent core, memory, tools, UI: complete
- TypeScript: clean, 0 errors (docs/archive/ excluded in tsconfig — it is
  reference material migrated from the old build HQ, not app code)
- Jest: 4 suites, 77/77 passing (73 before 2026-10-20, +4 new)
- Deterministic fallback router: 30/30
- Icons: Lucide (no emoji)
- Repo consolidation landed: docs/archive/, .claude/ agents+skills, and
  the product prime rules in AGENTS.md (from the former bamboo repo).

## Fixes landed 2026-10-20 (the five audit gaps)
1. Permissions screen is real now: Notifications and Reminders & Calendar
   rows call the actual Expo permission APIs and show real OS status on
   load. The Microphone row is honestly labeled "First use" — no installed
   package exposes a mic-permission request, so it is not faked.
2. "Always allow this kind of action" can render: the orchestrator sets
   actionKind (the tool name) when it parks a side-effecting action, and
   the state facade forwards it to the confirmation UI.
3. ToolExecutor is live: Orchestrator.confirm() executes through it. The
   dead `void executor;` instantiation in state/agent.ts is gone.
4. Semantic recall can activate: onboarding now downloads the embedding
   model (Qwen3-Embedding-0.6B) after the chat model. If that download
   fails, recall still degrades honestly to keyword search.
5. Privacy guard enforced: downloadModel() calls
   networkGuard.assertLocalOnly(url) before creating any download task —
   only Hugging Face hosts (incl. its CDN redirects) are reachable.

## Android build
- Status: release build in progress (attempt 17, as of 2026-09-22)
- Attempt 16: compiled for 15 min then failed on a network timeout downloading
  react-android AAR (transient). Retrying — Gradle resumes incrementally.
- Attempt 17: running
- APK: not produced yet (will upload to GitHub Releases when built)
- Emulator: CANNOT boot here (no KVM/hardware virtualization in this sandbox).
  Real-device testing via GitHub Releases APK instead.

## Emulator / device testing
- Not started — waiting on APK. This is the Phase 0 gate above.

## iOS
- Not started. iOS builds require macOS/Xcode + Apple Developer account;
  cannot be produced on this Linux build machine.
