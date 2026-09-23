# Vault build status

Last updated: 2026-09-22 21:35 EDT

## Source
- App + agent core, memory, tools, UI: complete
- TypeScript: clean, 0 errors
- Jest: 4 suites, 73/73 passing
- Deterministic fallback router: 30/30
- Icons: Lucide (no emoji)

## Android build
- Status: release build in progress (attempt 15)
- Attempts 1-11: fixed Gradle proxy, JitPack (disabled), lint-gradle, CMake
- Attempts 12-14: proxy config wiped then restored; then TLS cert failure —
  JDK truststore was missing the real Hatch egress CA (had only public CAs).
  Imported /etc/ssl/certs/hatch-egress-ca.pem into JDK cacerts.
- Attempt 15: running
- APK: not produced yet (will upload to GitHub Releases when built)
- Emulator: subagent booting vault_test AVD in parallel

## Emulator / device testing
- Not started — waiting on APK

## iOS
- Not started. iOS builds require macOS/Xcode + Apple Developer account;
  cannot be produced on this Linux build machine.
