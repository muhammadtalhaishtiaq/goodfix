# Vault build status

Last updated: 2026-09-22 18:10 EDT

## Source
- App + agent core, memory, tools, UI: complete
- TypeScript: clean, 0 errors
- Jest: 4 suites, 73/73 passing
- Deterministic fallback router: 30/30
- Icons: Lucide (no emoji)

## Android build
- Status: release build in progress (attempt 11)
- Attempts 1-5: various Gradle dependency/proxy/repo-filter issues (fixed)
- Attempts 6-10: lint-gradle:31.12.0 unresolvable — root cause: React Native
  Gradle Plugin auto-adds JitPack to every module (default true); JitPack
  times out through the proxy. Fixed via react.includeJitpackRepository=false.
  (Attempt 10 used a stale daemon that hadn't seen the property.)
- Attempt 11: running — fresh daemon, JitPack confirmed GONE from :expo repos,
  lint-gradle should now resolve from Google Maven
- APK: not produced yet

## Emulator / device testing
- Not started — waiting on APK

## iOS
- Not started. iOS builds require macOS/Xcode + Apple Developer account;
  cannot be produced on this Linux build machine.
