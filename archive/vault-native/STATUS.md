# Repository and hackathon status

Last updated: 2026-10-29

## Active hackathon project — Goodfix Web

- Decision locked 2026-10-29: separate responsive web project at `apps/goodfix-web/`; Goodfix is a working title, not a finalized brand.
- Product direction: one staged visibly loose cupboard-handle task; Workbench on desktop and a step-focused Guided adaptation on phones; preserve every upload as a numbered, selectable case item.
- Product brief, architecture, task plan, and log: `apps/goodfix-web/PRD.md`, `ARCHITECTURE.md`, `TASKS.md`, and `HACKATHON-LOG.md`.
- Current artifact state: clickable HTML concept prototypes exist in `docs/prototypes/`. These are pre-build mockups; their responses are simulated.
- **Goodfix application code: not started.** No real Muse Spark or SAM call, provider key routing, upload persistence, app server, or deployment has been implemented.
- **Hard blocker for live model integration:** written Meta clarification is needed for the proposed no-login public server-side Integrated Product route. No client-side shared key. Do not deploy or claim a live model flow until this gate and account access pass.
- The new web app is kept separate from Vault's existing Expo/React Native app. The earlier Vault app remains in this repository but is not the active hackathon entry.
- An independent red-team review was consulted on 2026-10-29. It confirmed the need for a strict one-task scope, persistent numbered evidence, explicit follow-up consent, a real end-to-end loop, and a written Meta API authorization gate.
- No application code, tests, model calls, builds, deployment, or submission were performed in this documentation update.
- Hackathon submission deadline: **2026-11-04 21:00 ET**.

## Historical Vault native build snapshot (last updated 2026-10-28)

The sections below describe the separate Vault mobile product and measurements recorded on 2026-10-28 or earlier. They are not the status or task plan for Goodfix. Device/toolchain facts have not been re-checked on 2026-10-29.

## Codex-first project setup (2026-10-28)
- Codex is the primary build workflow. Start with `CODEX-START-HERE.md`.
- React Native/Expo remains the primary Android/iOS app implementation per
  Talha's latest 2026-10-28 decision. The Flutter migration plan is superseded.
- Live Stitch screens were fetched for PRD authoring from project
  `12061351565962533710`: 63 entries (60 mobile entries, 54 unique mobile
  titles, plus 3 non-mobile visual assets). `docs/WIREFRAMES.md` has 53
  numbered prompts, so reconcile the inventory before claiming screen parity.
  The live design inventory has no dedicated SAM scanner screen.
- Persistent project rules: `AGENTS.md`; reusable reviewer workflow:
  `.agents/skills/adversarial-hackathon-review/SKILL.md`.
- Adversarial review of the Stitch connector found and drove fixes for the
  ignored/owner-only credential file, portable helper command, and quiet
  credential parsing. The helper was validated without displaying its value.
- Existing `.claude/` files and `CLAUDE.md` are retained for compatibility;
  they are not the primary project instructions.
- No application code or dependency changes were made during this Codex
  workflow conversion.
- Root `PRD.md` created 2026-10-28 from current product decisions, app source,
  live Stitch screens, and official Meta documentation. Independent
  adversarial review required the cloud relay to become a hard written-
  authorization gate, added an 18+ attestation/privacy-policy release gate,
  clarified that post-dispatch stop-waiting cannot undo a transfer, and cut
  Muse Image from hackathon scope. Muse Spark/SAM remain conditional beats;
  the existing local memory loop is the minimum credible demo. The app's
  current Qwen/local path remains distinct from unverified Llama/SAM/cloud
  requirements. No app tests or builds were run for this documentation task.
- **Re-baseline required:** the latest recorded device facts below are dated
  2026-10-20 (and Android build notes 2026-09-22). They say no installable
  APK or Phase 0 device run existed then. Confirm current reality before
  relying on the old dates, test counts, or milestone status.
- Initial read-only re-baseline on 2026-10-28: `main` and `origin/main` were
  at `43125cc`; `node_modules/` and `android/` were absent; `adb` was
  unavailable and `xcrun simctl` could not run in this environment. These
  observations do not establish the state of Talha's personal phone or any
  separately built APK. No tests or app builds were run in that pass.

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
