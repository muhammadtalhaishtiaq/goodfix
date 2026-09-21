# Build journal

## 2026-09-21 — Full build kicked off (Talha: "I want u to run everything for me")

Talha does not want to run anything himself. New plan: I build everything here,
produce an installable Android APK, and his only job is installing it and tapping
one diagnostics button. The Phase-0 gate harness is built INTO the app
(Diagnostics screen) so no technical capability is needed on his side.

### Stack (locked this session)
- Expo SDK 57.0.24, React Native 0.86.3, React 19, TypeScript
- llama.rn 0.12.9 (latest stable; NOT 0.4.8 from the old docs, NOT the 0.13 RC)
- expo-sqlite 57.0.3, expo-file-system 57.0.7 (legacy API), expo-secure-store,
  expo-notifications, expo-notifications, expo-calendar, expo-sqlite
- zustand, React Navigation 7 (stack + bottom-tabs), jest 29 + jest-expo

### Decisions
- **sqlite-vec via Expo config plugin**: Expo 57's expo-sqlite ships
  `withSQLiteVecExtension: true` — the docs' original sqlite-vec plan works
  natively. vec0 virtual table for embeddings + FTS5 for keyword fallback.
  Set in app.json plugins.
- **Embedding model**: trying Qwen3-Embedding-0.6B-GGUF (verify URL at build
  time); if unverifiable, recall degrades to FTS5 keyword search. Never fake it.
- **Chat model**: Qwen2.5-3B-Instruct Q4_K_M from HuggingFace (URL verified HTTP
  200 this session). Downloaded on-device on first run (~2 GB).
- **llama.rn native artifacts**: npm postinstall failed (proxy tunnel timeout on
  the iOS XCFramework). Installed with --ignore-scripts, manually downloaded
  the Android JNI libs from GitHub releases (SHA256 verified against the
  package manifest), placed under android/src/main/jniLibs with marker file.
  iOS artifact skipped — Android APK first.
- **Voice**: @react-native-voice/voice installed, but LAZY-required with a text
  fallback so a missing/broken native module can never crash the app or the build.
- **Deterministic fallback router**: keyword/regex routing when the model is
  absent or weak — the docs' "medium/fail" decision-tree paths are implemented
  in code, not just on paper.
- **Orchestrator owns control flow**; model is a JSON slot-filler only; every
  side-effecting tool needs validation + user confirmation; audit log records
  leftDevice=false always in v0.1.

### Build parallelization (5 subagents, 2026-09-21)
1. Agent core: toolSchemas, prompts, validator, router, orchestrator + tests
2. Inference + memory: llamaEngine, mockEngine, modelManager, mdStore,
   vectorIndex, recall + tests
3. Tools + privacy + escalation: reminder/calendar/notes/recall tools,
   executor, auditLog, networkGuard, byok + tests
4. UI foundation: theme, zustand store, navigation, Welcome, Onboarding,
   Home, VoiceModal
5. App wiring: state/agent.ts singleton, ActionConfirmModal, Memory screen,
   PrivacyDashboard, Diagnostics (Phase-0 spikes), App.tsx

### Still open (as of 2026-09-20 evening)
- Android SDK install: restarted via sdkmanager (platform-tools, android-35,
  build-tools 35.0.0) — old pre-compaction attempt left no packages installed.
- `npx expo prebuild` + Gradle APK build
- iOS needs Apple Developer account (~$99/yr, unverified) — deferred, Android first

### Post-build hardening (2026-09-20)
- Rewrote the deterministic fallback router: explicit ISO-date parsing,
  broader reminder triggers (ping/nudge/don't forget/Reminder:), note phrasings
  (save a note:/jot down:/save this:/note to self:), event phrasings (block,
  add <title> on <date>, put ... on my calendar), recall-first ordering so
  "Remind me what I told you about X" is recall, duration parsing ("for 30
  minutes", "one hour", "2pm to 3pm"), wall-clock ISO output (no UTC date-roll).
- Spike harness now scores against a fixed REFERENCE_NOW (2026-09-20 08:00
  local) so relative utterances are deterministic; threaded nowMs through
  Router.route -> fallbackRoute -> splitDate/reminderCall/eventCall.
- spike-sanity test converted from logging-only to a real gate test (>=90%
  tool, >=85% args). Current fallback scores: 30/30 tool, 30/30 args.
- Diagnostics screen: demo-mode scores are now shown WITH the percentages and
  an informational note (fallback scores, reference date) instead of hiding the
  scores behind the error branch; no PASS/FAIL verdict is rendered for demo runs.

### Wireframe-fidelity pass (2026-09-21) — all P0 + P1 audit fixes applied
Talha flagged that the WIREFRAMES.md wireframes were skipped, so the full
WIREFRAME-AUDIT.md fix list was applied to the implementation:

1. NEW HowPrivacyWorks screen (wireframe §A #2): three cards ("Runs on your
   phone", "Nothing leaves without your permission", "You can see everything
   it remembers") + Continue. Welcome links to it ("How your privacy works").
2. NEW Permissions screen (wireframe §A #4): Microphone / Notifications /
   Reminders & Calendar rows, each icon + one-line reason + Allow button,
   footer "These are used only on your device." Onboarding flow is now
   Welcome → HowPrivacyWorks → Onboarding (model download) → Permissions →
   Main tabs. setOnboarded(true) moved to the Permissions Continue button.
3. Trust gate rebuilt as a bottom-sheet (wireframe §B #10): exact-content
   preview, Confirm / Edit / Cancel, "Always allow this kind of action"
   checkbox. Edit lets the user tweak the proposal; "Use this instead"
   discards the original and sends the edited text as a fresh request.
   store: PendingConfirm gained actionKind + editAsNew; alwaysAllowed list
   lets users skip the sheet for chosen action kinds. FallbackConfirmModal
   in Home.tsx deleted — one trust gate everywhere, "Confirm" wording only.
4. Diagnostics moved out of the consumer surface: still a stack screen (file
   + all 3 spike tests untouched) but reachable only via the Privacy screen's
   "Run health check" row. Consumer copy softened ("Health check",
   "Understanding test", "Speed test", "Memory test" — real numbers kept in
   results, PASS/FAIL verdict kept).
5. Persistent "Private · on-device" badge added to Memory and Privacy
   dashboard headers (now on every screen).
6. Memory screen (§E #15b): warm title "What it knows about me", notes grouped
   newest-first under Reminders / Events / Notes / Captured sections, and
   edit support (Edit → inline editor → Save via mem.update); Delete kept.
7. Copy scrub: removed "phones home", "demo mode", "agent module isn't bundled
   in this build yet", "(agent not ready yet — stored locally)", "unavailable
   in this build" and all other techy strings from user-visible surfaces.
8. Welcome headline restored to the wireframe copy ("Your private AI. It never
   leaves your phone.") + simple phone-with-lock illustration.
9. Voice capture: teal recording indicator + animated waveform bars (replaced
   the red circle); save confirmation is now the clean wireframe line "Saved
   to your private memory."
10. Privacy dashboard (§I #39-lite): audit log rows are tappable with an
    expandable detail line; "What left your device: Nothing." hero kept.
- Design tokens unchanged (theme.ts). Tab bar stays Home · Memory · Privacy.
- tsc: zero errors. jest: 4 suites, 73 tests passed.

## 2026-09-21 — Icon swap: emoji → Lucide line icons

Talha said the emoji icons looked "like a robot" / AI slop. Installed
`lucide-react-native@1.47.0` (compatible with Expo SDK 57 / RN 0.86 / React 19;
all 13 icon exports verified against the package's .d.ts). Every emoji used as
an icon or in a user-facing string was replaced with a Lucide component
(strokeWidth 2, teal #0F766E strokes on the #FAF9F6 / white surface, sizes
20–28 for card rows, 15 for chips, 48 for the voice talk button):

1. HowPrivacyWorks.tsx — 📱🔒👀 → Smartphone, Lock, Eye (in soft-teal circular
   icon wraps on the three trust cards).
2. Permissions.tsx — 🎙️🔔📅 → Mic, Bell, CalendarDays; "Allowed ✓" glyph
   replaced with a teal Check icon next to the word "Allowed".
3. navigation.tsx — tab bar gains icons: House (Home), Brain (Memory),
   ShieldCheck (Privacy); tinted via the existing active/inactive colors.
4. Home.tsx — quick chips restructured to label + Lucide icon (PencilLine,
   AlarmClock, Brain); mic button now renders Mic.
5. VoiceModal.tsx — "✕ Close" glyph replaced with an X icon + "Close" label;
   the big talk button renders a white Mic icon.
6. Welcome.tsx — 🔒 inside the phone-with-lock illustration → Lock icon.
7. ActionConfirmModal.tsx — checkbox ✓ glyph → white Check icon.

No flow, copy, or screen structure changed; android/ untouched.
- tsc: zero errors. jest: 4 suites, 73/73 tests passed.
- Zero emoji remain anywhere in src/ui (verified by unicode sweep).
