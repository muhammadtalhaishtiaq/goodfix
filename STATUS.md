# Vault build status

Last updated: 2026-09-22 17:55 EDT

## Source
- App + agent core, memory, tools, UI: complete
- TypeScript: clean, 0 errors
- Jest: 4 suites, 73/73 passing
- Deterministic fallback router: 30/30
- Icons: Lucide (no emoji)

## Android build
- Status: release build in progress (attempt 8)
- Attempts 1-5: various Gradle dependency/proxy/repo-filter issues (fixed)
- Attempt 6: disabled lint in app module — then :expo module's
  extractReleaseAnnotations failed on the same lint-gradle artifact
- Attempt 7: disabled lint for ALL modules via root build.gradle — still failed
  on :expo:extractReleaseAnnotations (that task resolves lint-gradle regardless)
- Attempt 8: running — excluding :expo:extractReleaseAnnotations entirely
  (annotation extraction isn't needed for a test APK)
- APK: not produced yet

## Emulator / device testing
- Not started — waiting on APK

## iOS
- Not started. iOS builds require macOS/Xcode + Apple Developer account;
  cannot be produced on this Linux build machine.
