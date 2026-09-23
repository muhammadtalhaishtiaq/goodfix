# Vault build status

Last updated: 2026-09-22 21:25 EDT

## Source
- App + agent core, memory, tools, UI: complete
- TypeScript: clean, 0 errors
- Jest: 4 suites, 73/73 passing
- Deterministic fallback router: 30/30
- Icons: Lucide (no emoji)

## Android build
- Status: release build in progress (attempt 12)
- Attempts 1-5: various Gradle dependency/proxy/repo-filter issues (fixed)
- Attempts 6-10: lint-gradle unresolvable — React Native Gradle Plugin was
  auto-adding JitPack (timing out); fixed via react.includeJitpackRepository=false
- Attempt 11: new error — cmake;3.22.1 not installed (needed for llama.rn
  native code). SDK manager couldn't download through proxy, so installed
  CMake 3.22.1 manually into the SDK.
- Attempt 12: running now
- APK: not produced yet

## Emulator / device testing
- Not started — waiting on APK

## iOS
- Not started. iOS builds require macOS/Xcode + Apple Developer account;
  cannot be produced on this Linux build machine.
