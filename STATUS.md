# Vault build status

Last updated: 2026-09-22 18:05 EDT

## Source
- App + agent core, memory, tools, UI: complete
- TypeScript: clean, 0 errors
- Jest: 4 suites, 73/73 passing
- Deterministic fallback router: 30/30
- Icons: Lucide (no emoji)

## Android build
- Status: release build in progress (attempt 10)
- Attempts 1-5: various Gradle dependency/proxy/repo-filter issues (fixed)
- Attempts 6-9: lint-gradle:31.12.0 unresolvable — root cause found: the React
  Native Gradle Plugin auto-adds JitPack to every module's repos
  (DependencyUtils.configureRepositories, default true). JitPack times out
  through the proxy.
- Attempt 10: running — added explicit Google Maven repo URL + disabled RN
  plugin's JitPack via react.includeJitpackRepository=false
- APK: not produced yet

## Emulator / device testing
- Not started — waiting on APK

## iOS
- Not started. iOS builds require macOS/Xcode + Apple Developer account;
  cannot be produced on this Linux build machine.
