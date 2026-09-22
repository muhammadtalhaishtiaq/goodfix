# Vault build status

Last updated: 2026-09-22 18:00 EDT

## Source
- App + agent core, memory, tools, UI: complete
- TypeScript: clean, 0 errors
- Jest: 4 suites, 73/73 passing
- Deterministic fallback router: 30/30
- Icons: Lucide (no emoji)

## Android build
- Status: release build in progress (attempt 9)
- Attempts 1-5: various Gradle dependency/proxy/repo-filter issues (fixed)
- Attempts 6-8: lint-gradle:31.12.0 unresolvable — every expo module's
  extractReleaseAnnotations task needs it; Gradle kept probing JitPack (timeout)
  even though the artifact exists on Google Maven (verified HTTP 200)
- Attempt 9: running — removed JitPack repo entirely to prove whether google()
  serves the artifact; nothing had ever resolved successfully from JitPack anyway
- APK: not produced yet

## Emulator / device testing
- Not started — waiting on APK

## iOS
- Not started. iOS builds require macOS/Xcode + Apple Developer account;
  cannot be produced on this Linux build machine.
