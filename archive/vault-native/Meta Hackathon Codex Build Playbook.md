# Vault Split-Brain: Codex Build-and-Win Playbook

> **Historical plan; do not execute as current instructions (superseded 2026-10-29).** This playbook describes the earlier Vault Expo/React Native submission and contains stale dates, judging claims, push instructions, and model assumptions. The active entry is Goodfix Web under [`apps/goodfix-web/`](apps/goodfix-web/); use its PRD, architecture, tasks, and log. Preserve this file for project history.

Meta Global AI Developer Hackathon 2026, Indie Developer Track. Submissions due **2026-11-04 21:00 ET**. This document is the complete build order: a coding agent (Codex) executes it task by task, in order, from the current repo state to a submitted entry. Talha (the human) and Muse (the coordinating assistant) handle the parts marked for them in section 12.

Repo: `github.com/muhammadtalhaishtiaq/vault`, app code in `~/workspace/vault/code/` (React Native + TypeScript, Expo SDK 57, package `ai.vault.private`).

## 0. How to use this document

Read this whole section before touching code. The rest of the document assumes these rules.

### Operating contract for Codex

1. Work the tasks in section 7 **in order** (T1, T2, T3, ...). Do not skip ahead. Tasks marked PARALLEL may run alongside the critical path, never instead of it.
2. Each task lists exact files, steps, acceptance criteria, and the test command that proves it. A task is done only when its acceptance criteria pass. If a criterion fails, fix it inside that task; do not defer it to a later task.
3. **STOP gates** are hard stops. Where a task says STOP, halt, report exactly what you found (command output, numbers, error text), and wait for Talha or Muse to decide. Never improvise past a STOP gate.
4. Never invent an API endpoint, model ID, request field, or response shape for the Meta Model API, SAM 3.1, or any Meta service. Where this document says VERIFY, check the live official documentation or the Cerebral Valley participant resources first, record what you found (URL + date + the exact field names) in `docs/HACKATHON-LOG.md`, and only then write code against it. If the docs cannot be reached, that task is blocked: say so, do not guess.
5. Never ask Talha to paste an API key, token, or password into chat, a file, a commit, or this document. Keys live only in a local `.env` file (gitignored) or Expo SecureStore on device. See Appendix C.
6. Never weaken the privacy rules in `AGENTS.md`: local by default, no network call without explicit, previewed, logged consent. The cloud tier in this plan exists *inside* that rule, not around it. Any design that sends data off-device without a user-visible preview and an audit-log entry is a defect, not a shortcut.
7. Commit after every completed task: one commit per task, message format `T<n>: <task title>`. Push to `main` on the vault repo after each commit. Update `STATUS.md` and append to `docs/HACKATHON-LOG.md` (create it in T1) in the same commit.
8. Keep the existing test suite green at all times. Baseline on 2026-10-22: TypeScript clean, Jest 77/77 passing, deterministic fallback router 30/30. A commit that drops any of those numbers does not get pushed; fix it first.
9. Read the versioned Expo docs for SDK 57 before writing code against any Expo API you have not already seen used in this repo (`AGENTS.md` rule). Expo APIs change between SDKs; do not code from memory.
10. Absolute dates everywhere. No "tomorrow" or "next week" in logs, commits, or docs.

### Who does what (summary, full split in section 12)

- **Codex** builds, tests, and commits everything in section 7.
- **Talha** does anything needing his accounts, his phone, his face, or his tap: Cerebral Valley portal, Meta developer console, Secure Vault, installing builds on his phone, filming the demo, pressing submit.
- **Muse** coordinates deployments (EAS builds, GitHub Releases), chases the missing credits (section 3), and verifies submission assets.

### The one-sentence strategy

Vault already does the hard, unglamorous part: a working on-device agent with a real privacy model. The hackathon build adds exactly three things: a Meta open-weights model on device (Llama), a visible split-brain router that escalates hard work to Muse Spark through the Meta Model API, and one camera task through SAM 3.1. Everything is in service of one 90-second demo (section 9). If a piece of work does not make that demo better, it does not get built.

## 1. The mission and the one demo loop

### What Vault is

Vault is a privacy-first personal AI agent that lives on the user's phone. It captures notes and reminders, stores memory on the device as human-readable Markdown files with a local vector index, recalls that memory on request, and proves, through an on-device audit log and privacy dashboard, exactly what left the phone (in the current build: nothing). Its product rule, locked in `docs/archive/DECISIONS.md`, is honest privacy tiers: "never leaves your device" is only ever claimed for the local tier.

### What the hackathon version adds: the split brain

One agent, two brains, and a router that decides out loud which brain does the work:

- **Local brain (on-device, offline, private):** a Meta open-weights Llama model running through the existing `llama.rn` engine for capture, recall, reminders, and everyday chat. Works in airplane mode. Nothing leaves the phone.
- **Cloud brain (heavy reasoning):** Muse Spark through the Meta Model API, used only when a task is too hard for the small local model, and only after the user sees a preview of exactly what will be sent and taps approve.
- **Eyes:** SAM 3.1 through the Meta Model API for one concrete camera task the local model cannot do at all: point the camera at a messy desk or shelf and ask "where are my keys?" (the demo task in T9; final wording set there).

The router's decision is **visible in the UI on every turn**: a chip on each response shows `On-device` or `Muse Spark (cloud)` plus a one-line reason ("private note, handled locally" / "multi-step plan, escalated with your approval"). That visible decision is the frontier claim: the phone keeps thinking when the network dies, and escalates to Meta's cloud when it matters.

### The one demo loop (nothing else is the demo)

1. On Wi-Fi, Talha saves a private note and asks for it back. Router chip: on-device.
2. He asks a hard question (a multi-step plan built from his own notes). The router shows the escalation preview, he approves, Muse Spark answers. Chip: cloud.
3. He turns on airplane mode, on camera. He asks again: capture and recall still work, fully offline. Chip: on-device.
4. Back online, he points the camera at a cluttered desk and asks where his keys are. SAM 3.1 segments the scene, Muse Spark reasons over the result, Vault answers and saves the location to on-device memory.

Full shot list and word-for-word script: section 9.

### Kill list (explicitly NOT built before 2026-11-04)

- No new screens beyond what T8 and T9 require. The 53-screen wireframe set in `docs/WIREFRAMES.md` is a v2+ destination map, not a build list (locked decision, 2026-08-01).
- No voice features beyond what already exists. No mic-permission wiring (the Permissions screen's microphone row stays honestly labeled "First use").
- No payments, no PayPal anything (that is a different hackathon), no social features, no accounts, no sync.
- No model fine-tuning. Off-the-shelf models only.
- No new tools beyond the existing four (`create_reminder`, `create_event`, `save_note`, `recall_memory`) plus the internal escalation and vision paths in T7 and T9.
- No Android-first detour if the Phase 0 gate says iOS is the working path (section 5, branch B). One working platform, filmed well, beats two broken ones.

## 2. Facts, deadlines, and the judging map

### Verified event facts

Verified 2026-10-17/18 from the official Meta event page, the Cerebral Valley organizer page, and the organizer waiver (workspace brief: `~/workspace/hackathons/meta-global-ai/brief.md`), and re-checked against public coverage on 2026-10-22:

- Organizer: Meta Superintelligence Labs; run day-to-day by Cerebral Valley. Fully online.
- Track: **Indie Developer Track** (Talha approved 2026-10-20). Solo entry. Indie pool $400,000 of the $1,000,000 total: 1st $150,000, 2nd $100,000, 3rd $75,000, 4th $50,000, 5th $25,000. Up to $50,000 in bonus prizes across the event.
- Build window: **2026-10-26 to 2026-11-04**. Kickoff 2026-10-26 12:00 PM ET (Cerebral Valley lists the window as 2026-10-26T17:00Z to 2026-11-05T02:00Z).
- **Submissions due 2026-11-04 21:00 ET.** Judging 2026-11-04 to 2026-11-08. Winners announced at the live finals / closing ceremony **2026-11-09**.
- Themes: "Build for Your World" and "Push the Frontier". Vault's primary theme is **Build for Your World** (a personal agent for the dead zones and private moments of a real life), with the split-brain router as the Push the Frontier element. Say exactly that in the submission (Appendix A).
- What participants build on: Meta Model API (Muse Spark series, Muse Image, SAM 3.1), Meta open-weights models, and Muse Code. Workshops and Discord office hours run across the window.
- Participant benefit at issue: **$150 in Meta Model API credits for every selected participant.** Not yet received as of 2026-10-22. Section 3 is the investigation plan. Partner credits for select participants were also listed in the waiver coverage: Baseten $100 plus 2M TPM rate limits, Modal $100, Fireworks $25. Also not yet seen; section 3 covers them as a secondary check.
- Rules note: the official Hackathon Rules are published before 2026-10-26 and must be accepted by selected participants. The waiver already confirms: 18+, worldwide except sanctioned jurisdictions (Canada is fine), no confidentiality on submissions, marketing contact permitted. Talha accepts the rules in the portal himself (section 12).

### Judging criteria, and what each one forces us to build

From the verified waiver summary (submission judging, not application judging):

| Criterion | Weight | What it means for this build |
| --- | ---: | --- |
| Impact | 30% | The personal dead-zone story leads everything: submission copy, demo opening line, README first paragraph. A real person's real problem, not a tech showcase. |
| Use of Meta AI tooling | 25% | Three Meta technologies, each load-bearing: Llama open weights on device, Muse Spark via Meta Model API for escalation, SAM 3.1 for the camera task. Remove any one and a demo beat dies. Name them on camera and in the writeup. |
| Demo | 25% | One continuous 90-second take (section 9), filmed before the deadline crunch, plus a pre-recorded backup cut. The demo is a deliverable with its own task (T13), not an afterthought. |
| Technical depth and execution | 20% | The measured Phase 0 numbers, the visible router, the consent/audit trail, and a clean repo with tests green. Depth is shown with numbers and logs, not adjectives. |

Note: secondary coverage of the indie track summarizes judging as "creativity, technical ambition, and whether it works." Both framings point the same way: a working, ambitious, clearly Meta-powered demo of a real personal product. When the official rules publish before 2026-10-26, Muse re-checks the criteria against this table and flags any change before the build window opens (section 12).

### Winner patterns this plan is built on

From verified past Meta/Cerebral Valley and adjacent on-device hackathon winners (full research: `~/workspace/hackathons/hackathon-roadmap-2026-10-20.md`):

- Sponsor tech load-bearing and named: Geo-ML won Best Llama API usage at LlamaCon 2025 by using capabilities only the sponsor API had. Our equivalent: the escalation beat must be something the 3B local model visibly cannot do, done by Muse Spark.
- One visceral beat in the first 30 seconds: OpenGlass won the 2024 Llama 3 Hackathon on "where did I leave my phone?" Our equivalent: airplane mode on camera, agent still working.
- Offline/privacy as the feature: MatIA (offline fine-tuned Llama 3.2 3B tutor) took 2nd at Llama Impact pan-LATAM; Pharmallama (on-device pharmacy app) placed at UK Llama Impact; the Cactus Compute event ran an explicit "Hybrid Hero" track for local-plus-cloud combos. The split brain is that lane, named.
- Camera vision plus mobile is a historically winning combination: SightCom won the Llama 2 Hackathon with a Flutter camera app. Our SAM 3.1 beat follows that pattern with one task, done well.
- What kills entries: slideware (a "whether it works" criterion punishes it directly), sponsor tech as decoration, scope creep into five half-features, live demos with no recorded fallback, and buzzer submissions. Every one of those has a countermeasure in this plan.

## 3. The missing $150 credits: investigation plan

**Status on 2026-10-22: approved participant, credits NOT received.** No credit balance, code, or claim link has reached Talha yet. This section runs in parallel with the build. It never blocks the build: T3 and T7 are written so development proceeds on whatever access exists, and section 11 has the fallback if credits never arrive.

Owner: Muse coordinates, Talha performs the account-side steps (his logins, his tap). Codex does none of this except recording outcomes in `docs/HACKATHON-LOG.md` when told.

### What is known

- The organizer waiver confirms $150 in Meta Model API credits for each selected participant, for development during the event window. Public coverage matches: Meta's invite/acceptance materials state the $150; the public event page does not state the amount, so the authoritative source is the participant's own acceptance email and the Cerebral Valley portal.
- Separately, the Meta Model API's public preview gave new developer accounts a smaller signup credit (reported as $20). That is a different pot. Do not confuse a $20 signup balance with the $150 hackathon credit; if only $20 ever appears, the $150 is still missing.
- Credit delivery mechanism has not been publicly documented in a way we could verify on 2026-10-22: it may arrive as a balance on a Meta developer account, a code in the Cerebral Valley portal, or an email. That is exactly what the checks below resolve.

### The five checks (do them in order, by 2026-10-24)

1. **Acceptance email, full text.** Talha re-opens the approval email from Cerebral Valley / Meta and reads past the headline: look for a credits paragraph, a claim link, a promo code, or a "next steps" link. Screenshot or forward the full text to Muse. Half of all "missing credit" cases are a link nobody clicked.
2. **Cerebral Valley account.** Talha logs into the Cerebral Valley event page for this hackathon (the same account that shows the approval) and checks: participant dashboard, event resources page, perks/benefits section, and any announcements posted after approval. Look for a Meta Model API credit claim button or a linked Meta developer account step.
3. **Meta developer console.** Talha signs in at the Meta developer console (developer.meta.com) with the same email used for the hackathon application, opens the Model API section, and checks: does an API key exist, what is the credit/balance shown, and is there a hackathon credit line item? Record the balance exactly as shown. If no Model API access exists yet, create the account and API key there (Talha does this himself; the key goes to Secure Vault, never into chat: Appendix C).
4. **Spam, promotions, and the second inbox.** Search both the application email inbox and any secondary email for "Meta Model API", "credits", "Cerebral Valley", "Muse Spark" from 2026-10-20 onward. Credit emails frequently land in Promotions.
5. **Discord and office hours.** Join the hackathon Discord (invite is in the acceptance materials; it is not public). Check the announcements and FAQ channels for a credit-claim thread, then ask in the support/office-hours channel using the short message in Appendix B if nothing is pinned.

### Escalation ladder (if the five checks find nothing)

- **By 2026-10-25:** post the Appendix B message in the Discord support channel and, in parallel, reply to the acceptance email asking where the $150 Model API credit is claimed. Keep both messages short and factual: approved participant, Indie track, no credit visible in portal or developer console as of the date sent.
- **At kickoff, 2026-10-26:** if still unresolved, raise it in the kickoff livestream Q&A / office hours the same day. The build window is when the credits matter; organizers fix credit issues fast during kickoff week if they are surfaced early and politely.
- **By 2026-10-28:** if still nothing, Muse drafts a follow-up to Cerebral Valley support with the paper trail attached (approval screenshot, dates of the two earlier asks). Talha reviews and sends.
- **Throughout:** log every check, date, and reply in `docs/HACKATHON-LOG.md` (Muse maintains this log with Talha; Codex records entries when handed them).

### Partner credits (secondary, 15 minutes, same pass)

The waiver coverage also listed partner perks for select participants: Baseten $100 plus rate-limit uplift, Modal $100, Fireworks $25. While doing checks 2 and 5, look for a perks page or claim links. These are nice-to-have (they could host the optional planner fallback in section 11), not critical path. Claim them if they are one click; do not chase them past 2026-10-26.

### The rule that keeps this sane

Credits are a billing detail, not a build dependency. The Meta Model API work in T3/T7 proceeds as soon as Talha has any working API key with any balance. If the $150 lands mid-window, nothing changes except the budget. If it never lands, section 11's credit fallback applies and the submission copy says nothing about credits at all.

## 4. Repo orientation: what exists, what is missing

Do not re-audit the repo from scratch. This is the verified state on 2026-10-22 (source: `STATUS.md`, `package.json`, and direct source reads). Trust it, verify cheaply where a task tells you to, and build on it.

### Stack

- React Native 0.86.3, React 19.2.3, Expo SDK ~57.0.24, TypeScript ~6.0.3, Jest 29 with jest-expo.
- On-device inference: `llama.rn` ^0.12.9 (llama.cpp bindings). Installed and used through `src/inference/llamaEngine.ts`, which lazy-imports the native module so Jest never loads it.
- State: zustand. Storage: expo-sqlite (with sqlite-vec extension enabled in `app.json`), expo-file-system, expo-secure-store. Navigation: React Navigation (bottom tabs + stack). Icons: Lucide only, no emoji.
- Device APIs already installed: expo-calendar, expo-notifications. **Not installed:** expo-camera (needed by T9; adding it is part of that task), any HTTP client beyond the platform `fetch`.

### The agent core (exists, tested, do not rewrite)

- `src/agent/orchestrator.ts`: the deterministic state machine that owns every turn. Rules enforced in code: every tool call is validated before anything happens; side-effecting tools (`create_reminder`, `create_event`) never execute without an explicit `confirm()`; every event is audit-logged. **Current hard limit: the orchestrator forces `tier: 'local'` and `leftDevice: false` on every audit entry and every turn.** Making the tier real is T7's core work.
- `src/agent/router.ts`: routes a user message to one tool call. Primary path: the on-device model, forced to emit one JSON object `{tool, args}` against a JSON schema, then validated. Any failure drops to a deterministic keyword/regex fallback router (`fallbackRoute`) with a pragmatic relative-date parser. The fallback passes 30/30 spike cases with no model at all. This matters for Phase 0 branch B (section 5).
- `src/agent/toolSchemas.ts` + `src/agent/validator.ts`: JSON Schemas and the enforcing validator for the four tools. Schema and validator must stay in sync; T7/T9 extend both together.
- `src/tools/`: `registry.ts`, `executor.ts` (ToolExecutor, wired into `Orchestrator.confirm()`), and the tool implementations: `calendar.ts`, `reminder.ts`, `notes.ts`, `recallTool.ts`.
- `src/memory/`: Markdown-file memory store (`mdStore.ts`), recall engine (`recall.ts`) combining a local vector index (`vectorIndex.ts`, sqlite-vec) with FTS5 keyword search. Semantic recall activates once the embedding model is downloaded (fixed 2026-10-20).
- `src/privacy/`: `auditLog.ts` (the on-device audit trail) and `networkGuard.ts`. **The guard is an allowlist with exactly one purpose today:** `assertLocalOnly(url)` permits only Hugging Face hosts (`huggingface.co`, its LFS/Xet CDN hosts, `*.hf.co`) and throws for everything else. `downloadModel()` calls it before creating any download task. T2 extends it; nothing may bypass it.
- `src/escalation/byok.ts`: a SecureStore-backed store for the user's own provider keys (Anthropic/OpenAI), with honest tier labels. **Deliberately not wired into any turn flow.** It is the pattern to follow for key storage in T3, not a flow to extend.
- `src/state/agent.ts` + `src/state/store.ts`: the state facade the UI talks to; forwards `actionKind` to the confirmation UI (fixed 2026-10-20 so the "always allow this kind of action" checkbox can render).
- `src/ui/`: screens (Home, Onboarding, Memory, Permissions, Privacy, PrivacyDashboard, HowPrivacyWorks, Diagnostics, Welcome, VoiceModal) and `ActionConfirmModal.tsx`. The Diagnostics screen hosts the Phase 0 spike harness.
- `src/diagnostics/spikes.ts`: the Phase 0 gate harness. 30 labeled tool-calling cases (fixed reference time: Sunday 2026-09-20 08:00 local) and the deterministic scorer. Gate bars: **toolRight at or above 90%, argsRight at or above 85%.**

### Models (current pins, in `src/inference/modelManager.ts`)

- Chat: **Qwen2.5-3B-Instruct Q4_K_M GGUF** (~2 GB) from Hugging Face, downloaded on first run into `<documentDirectory>/vault-models/`, never bundled.
- Embeddings: **Qwen3-Embedding-0.6B Q8_0 GGUF** (1024 dims, ~640 MB), same pattern; recall degrades honestly to keyword search if it is missing.
- Context: `llamaEngine.ts` loads with `n_ctx: 2048`, `n_threads: 4`; completions support a forced `json_schema` response format.

### Tests and status (baseline, 2026-10-20)

- TypeScript: clean, 0 errors (`docs/archive/` excluded in tsconfig; it is reference material, not app code).
- Jest: 4 suites in `__tests__/` (`agent-core`, `memory-inference`, `spike-sanity`, `tools-privacy`), **77/77 passing**.
- Android release APK: **not yet produced.** The local Gradle history is a string of network-timeout failures (attempt 17 in progress notes as of 2026-09-22 in `STATUS.md`). The sandbox has no KVM, so no emulator. Distribution path is therefore EAS Build or GitHub Releases (section 12; Muse owns deployments).
- iOS: not built from this Linux machine; Talha builds on his MacBook with Xcode per `IOS-BUILD.md`.

### The five gaps this plan closes (and nothing else)

1. **No Meta open-weights model on device.** The chat pin is Qwen, not Llama. T4 adds a Llama 3.2 3B Instruct GGUF pin alongside it. (Qwen stays as the measured fallback; switching the default is a Phase 0 decision, section 5.)
2. **No cloud tier.** No Meta Model API client exists anywhere in the repo. T3 builds `src/cloud/`; T7 wires it into the orchestrator.
3. **The privacy tier is decorative.** `PrivacyTier` (`'local' | 'byok' | 'boost'` in `src/agent/types.ts`) exists, but the orchestrator hardcodes `'local'`. T7 makes the tier a real, per-turn, audited value and renames the cloud tier honestly (see T7 for the exact change).
4. **The routing decision is invisible.** `RouterDecision.source` (`'model' | 'deterministic-fallback'`) is logged for diagnostics but never shown, and there is no local-vs-cloud concept to show. T8 renders the decision chip.
5. **No camera, no vision.** No expo-camera, no image path, no SAM anything. T9 adds exactly one camera task.

## 5. Phase 0 gate: prove it on a real phone before the window opens

**Deadline for this section: cleared (pass or documented branch B) by 2026-10-25**, the day before kickoff. This gate is the boss (locked decision, 2026-08-29, re-confirmed in `docs/archive/DECISIONS.md`): the whole product shape depends on one measured number, on-device tool-calling reliability on a real phone. Nothing in the build window matters if the demo phone cannot run the local brain.

Division of labor for the gate: Muse produces the installable build (EAS or GitHub Releases APK for Android; Talha builds iOS on his MacBook per `IOS-BUILD.md`). Talha installs it on his phone and runs the Diagnostics spike. Codex fixes what the numbers say to fix and records the result. Codex does not need the phone; Codex needs the spike report.

### Gate procedure (exact steps)

1. **Freeze the candidate build.** From a clean checkout of `main`, confirm `npx tsc --noEmit` is clean and `npx jest` reports 77/77. Note the commit hash in `docs/HACKATHON-LOG.md`. This exact commit is the gate candidate; no feature work lands on top of it until the gate resolves.
2. **Produce the installable build.** Android: EAS Build (production or preview profile per `IOS-BUILD.md`'s EAS setup) or the GitHub Releases APK path already used by this project. iOS: Talha runs the Xcode build from `IOS-BUILD.md` on his MacBook. Muse coordinates and posts the build link in the log.
3. **Install on Talha's real phone.** Talha installs, completes onboarding, and lets both model downloads finish on Wi-Fi (chat ~2 GB, embeddings ~640 MB). Record: device model, OS version, free storage before/after.
4. **Run the Diagnostics spike with the model path.** Open the Diagnostics screen, run the tool-calling spike against the downloaded chat model (the harness in `src/diagnostics/spikes.ts`, 30 cases, fixed reference time). Record all four numbers: parseOk rate, **toolRight**, **argsRight**, average latency per case. Also record: time to first token on a cold start, generation throughput (tok/s) if the diagnostics surface shows it, peak behavior over the full 30-case run (any crash, OOM, jetsam kill, or thermal throttle event: yes/no, with notes).
5. **Repeat the core loop by hand, in airplane mode.** With the phone in airplane mode: save a note, recall it, set a reminder, confirm it. All four must succeed with the network physically off. Record pass/fail per action.
6. **Write the gate report.** One entry in `docs/HACKATHON-LOG.md` plus a short `docs/PHASE0-RESULT.md`: commit hash, device, OS, the numbers from step 4, the airplane-mode results from step 5, and the branch taken (A or B below). Commit both files.

### Pass bars (all must hold for branch A)

- toolRight at or above **90%** on the 30-case spike with the on-device model.
- argsRight at or above **85%**.
- No crash, OOM, or jetsam kill during the full spike run.
- Airplane-mode loop (step 5): 4/4 actions succeed.
- Latency sane for a demo: average spike case under 10 seconds on the gate device. (If latency is the only miss, note it; the demo script in section 9 can be paced around a slow-but-correct local model, and T5 includes a 1B-model option.)

### Branch A: gate passes

Proceed exactly as planned. The on-device model drives routing (with the deterministic fallback behind it, as today). T4's Llama pin gets the same spike run before it can become the default (see T4 acceptance criteria); if Llama scores within 3 points of Qwen on toolRight and argsRight, Llama becomes the demo default for sponsor alignment; otherwise Qwen stays default and Llama ships as the selectable Meta model in the model menu, which still satisfies the open-weights lane honestly (the submission says which model ran the demo; see section 11).

### Branch B: gate fails (any bar missed)

Do not debug for more than one working day. Switch to the documented fallback shape (this is a planned branch, not a defeat; it is the fallback the project's own decision ledger prescribes):

1. **Deterministic-first routing:** `fallbackRoute` becomes the primary router for the demo flows (it already passes 30/30 with no model). The on-device model is used only for conversational replies and recall summarization, where a wrong answer is visible and harmless, never for tool selection.
2. **Escalation-first for anything complex:** any request the deterministic router cannot handle confidently routes to the Muse Spark escalation path (T7) with the standard consent preview. The split brain survives; the local brain's job narrows to capture/recall/reminders done deterministically.
3. **Try the smaller/faster option once:** if the failure was memory or latency (not accuracy), run the spike once with a 1B-class GGUF (Llama 3.2 1B Instruct) before concluding. If the failure was accuracy, skip this; size is not the problem.
4. **Platform narrowing:** if the failure is platform-specific (for example the Android native bridge breaks but iOS works), the demo platform is the working one. Say so in the gate report. One working platform is the plan from here.
5. Record the branch-B decision and the numbers that forced it in `docs/PHASE0-RESULT.md`, and adjust T5's acceptance criteria accordingly (T5's spike re-run then targets the deterministic path plus the narrowed model duties).

**STOP:** If both branches fail on both platforms (no installable build runs the core loop on any real phone by 2026-10-25), stop. Report the exact failure (build error, crash log, spike output) to Talha and Muse the same day. The pivot decision (hosted demo surface, video of the one working path, or scope cut) is Talha's call, made on 2026-10-25, not during the build window.

## 6. Architecture: the split brain, built inside the privacy rules

This section is the design contract for T2, T3, T7, T8, and T9. Codex implements to this section; where implementation reality disagrees, stop and flag it rather than silently redesigning.

### The tier model (extends what exists)

`PrivacyTier` in `src/agent/types.ts` is currently `'local' | 'byok' | 'boost'`. For the hackathon build:

- `'local'` stays: on-device model, nothing leaves the phone. The default for every turn.
- Add `'meta-cloud'`: Muse Spark / SAM 3.1 through the Meta Model API, reached **only** through the consent flow below. Its honest label everywhere in UI and copy: "Meta cloud · leaves device to Meta Model API, only what you previewed." Never merge this into the `'boost'` label ("leaves device to our server"): Vault has no server in this flow, and the honesty rule (DECISIONS.md, 2026-07-16) forbids conflating tiers.
- `'byok'` and `'boost'` stay in the type, unused by the hackathon flows, exactly as BYOK is unused today.

Every `AgentTurn` and every audit entry carries the tier that actually applied to that turn. A turn that escalated is `tier: 'meta-cloud'`, `leftDevice: true`, with the audit detail naming the model and the byte size of what was sent. The Privacy Dashboard must be able to show cloud turns distinctly; that is what makes the privacy claim credible to a judge who taps around the app.

### The consent flow (non-negotiable shape)

An escalation happens only like this, mirroring the existing side-effect confirmation pattern:

1. The router (T7 logic) decides a turn is a cloud candidate.
2. The orchestrator parks the turn (same pending mechanism as `confirm()` today) and returns a preview: the exact payload that would be sent (the user's request plus any memory excerpts the planner needs), rendered in an `EscalationPreviewModal` modeled on `ActionConfirmModal.tsx`.
3. The user approves or rejects. Rejection falls back to the local path (local model attempts it, or an honest "that one needs the cloud brain; I stayed local, so here is the simpler version").
4. On approval, and only then, the cloud client fires. The call, the response size, the model ID, and the latency go into the audit log.
5. The cloud result is shown with the cloud chip (T8). If the result proposes side-effecting actions (a reminder, an event), those go through the **existing** per-action confirmation, unchanged. The cloud brain proposes; the local rules dispose.

No setting may bypass this per-turn preview for the hackathon build. (The existing "always allow this kind of action" gate is for local tool kinds; do not extend it to cloud egress.)

### The cloud module (`src/cloud/`, new in T3)

- `metaClient.ts`: a thin client over the platform `fetch`. One responsibility: POST a chat-completion-style request to the Meta Model API and return text/stream result plus usage metadata. Everything Meta-specific (base URL, model IDs, auth header format, request/response fields) comes from the VERIFY step in T3, not from this document.
- `keyStore.ts`: reads the Meta API key from Expo SecureStore (key name `vault_meta_api_key`), following the `byok.ts` pattern. The key is set through a Settings field Talha fills on his own device, or through an env var injected at build time for the demo device only (Appendix C). Never in source, never in a fixture, never logged.
- `planner.ts`: builds the escalation prompt (system prompt: Vault planner persona; context: the previewed payload only) and parses the response into either a direct answer or a list of proposed actions in the existing `ToolCall` shape, which the orchestrator validates with the existing validator before anything is shown as a proposal.
- `vision.ts` (T9): the SAM 3.1 call path, same client and key, separate function, same consent and audit treatment. The image is part of the preview ("this photo will be sent").

### The network guard (extended in T2, obeyed everywhere)

`assertLocalOnly` currently allows only Hugging Face hosts. The cloud tier needs exactly one more allowance, added as a separate, explicit function so the original guarantee stays provable:

- `assertLocalOnly(url)` keeps its current behavior byte-for-byte. Model downloads keep using it.
- New `assertEgressAllowed(url, { consented: true })`: permits only the verified Meta Model API host (from T3's VERIFY step) and only when called from the consent-approved path. Any other host throws, same as today.
- Unit tests must prove: HF URL passes the local guard; Meta host fails the local guard and passes the egress guard; an arbitrary host (for example `https://example.com`) fails both; the egress guard throws when the consent flag is absent.

### Routing logic (the brain split, in one paragraph)

Per turn: if the deterministic router plus local model can handle it (the four tools, recall, conversational replies), it stays local. A turn is a cloud candidate when (a) the local path returns `none` but the request is a clear multi-step ask (plan, compare, summarize-many, draft-from-notes patterns: T7 defines the exact heuristic list), or (b) the local model's conversational reply fails validation/emptiness twice, or (c) the user explicitly taps "Ask the cloud brain" on a turn (a visible affordance in T8). The heuristic list is deliberately small and written down in T7; no learned router, no embeddings tricks, nothing that cannot be explained in the demo.

## 7. Task backlog (execute in order)

Sizing: S = under half a day, M = about a day, L = two days. The critical path is **T1, T2, T3, T5, T7, T8, T10, T11, T13, T14**. Everything else is PARALLEL or CUTTABLE, and says so. If time compresses, cut from the bottom of the cuttable list first (section 11).

Shared completion rule for every task: run its test command, run the full suite (`npx tsc --noEmit` and `npx jest`), update `STATUS.md` and `docs/HACKATHON-LOG.md`, commit as `T<n>: <title>`, push.

---

### T1. Hackathon scaffolding and log (S, critical path)

Files: create `docs/HACKATHON-LOG.md`; edit `STATUS.md`.

Steps:

1. Create `docs/HACKATHON-LOG.md` with sections: Gate results, Credits investigation, VERIFY records, Build notes, Deployment links. Seed it with the 2026-10-22 baseline (TypeScript clean, Jest 77/77, fallback router 30/30, commit hash of `main`).
2. Add a "Meta hackathon build" section to `STATUS.md` pointing at this playbook's task list and the current task in progress.
3. Confirm `.env` is in `.gitignore`; if it is not, add it. Confirm no file in the repo contains the string `META_API_KEY=` followed by a real value (search the tree; report the result in the log).

Acceptance: log file exists with the baseline recorded; grep for key material returns no real secrets; suite still 77/77.

Test command: `npx tsc --noEmit && npx jest`

### T2. Network guard extension (S, critical path)

Files: edit `src/privacy/networkGuard.ts`; add tests in `__tests__/tools-privacy.test.ts` (or a new `__tests__/cloud-privacy.test.ts` if cleaner).

Steps:

1. Leave `assertLocalOnly` and its host set exactly as they are.
2. Add `META_API_HOST_PLACEHOLDER` handling per section 6: implement `assertEgressAllowed(url, opts: { consented: boolean })` with the allowed-host list initially containing only a clearly marked placeholder constant `META_MODEL_API_HOST = ''` (empty = nothing allowed yet). T3 fills the real host after VERIFY. With the empty host, every egress call must throw: that is the correct pre-T3 behavior.
3. Write the four unit tests from section 6 (HF passes local; Meta-shaped host fails local; arbitrary host fails both; egress without consent throws).

Acceptance: all new tests pass; `assertLocalOnly` behavior unchanged (existing tests untouched and green); no other file calls the egress guard yet.

Test command: `npx jest __tests__/tools-privacy.test.ts` then full suite.

### T3. Meta Model API client (M, critical path)

Files: create `src/cloud/metaClient.ts`, `src/cloud/keyStore.ts`; edit `src/privacy/networkGuard.ts` (fill the host from the VERIFY record).

**VERIFY GATE (do this first, STOP if it fails):** Using the participant resources in the Cerebral Valley portal and the official Meta developer documentation (Model API docs on developer.meta.com), record in `docs/HACKATHON-LOG.md`: the API base URL, the chat endpoint path, the auth header format, the exact model ID string for Muse Spark, the request fields for a basic chat completion, the response field that carries the reply text, and whether streaming is offered. Also record how SAM 3.1 is invoked through the same API (endpoint/model ID and the image input format), for T9. If neither source can be read (access blocked, docs not yet published for participants), **STOP**: report exactly what was reachable and what was not, and wait. Do not write the client against a guessed shape. Note: third-party writeups describe the API as OpenAI-SDK-compatible with a base URL under `api.meta.ai` and a `META_API_KEY` bearer key; treat that strictly as a hypothesis the VERIFY step confirms or corrects against Meta's own docs.

Steps (after VERIFY passes):

1. `keyStore.ts`: SecureStore get/set/clear for `vault_meta_api_key`, modeled on `src/escalation/byok.ts`, including the refuse-empty-key guard. Plus a build-time fallback read from the Expo config extra field `META_API_KEY` for the demo device build only (Appendix C); SecureStore wins when both exist.
2. `metaClient.ts`: `completeChat({ messages, maxTokens?, temperature? }): Promise<{ text, model, latencyMs, usage? }>` using platform `fetch`. Before fetching, call `assertEgressAllowed(url, { consented: true })` (the consent itself is enforced by the orchestrator in T7; the client asserts the flag so no other caller can slip through). Timeout: 30 seconds, abort via `AbortController`. Non-200 responses throw an error carrying the HTTP status only (never log the key, never log full payloads).
3. Set `META_MODEL_API_HOST` in the guard to the verified host, and add a unit test pinning that host string.
4. Tests with a mocked `fetch`: success path parses the verified response shape; 401 throws; timeout throws; egress guard is consulted (mock throws = client never fetches).

Acceptance: unit tests pass with mocked fetch; a manual smoke call instructions page exists at `docs/META-API-SMOKE.md` (Talha runs it on his device/account: one real call, record model ID + latency + that the response parsed; no key material in the doc).

Test command: `npx jest __tests__/cloud-privacy.test.ts` plus the new client tests, then full suite.

### T4. Llama 3.2 on-device pin (M, PARALLEL with T3)

Files: edit `src/inference/modelManager.ts`; edit onboarding model copy in `src/ui/screens/Onboarding.tsx` only if the manifest shape requires it.

Steps:

1. Add a `LLAMA_CHAT_MODEL` spec next to `CHAT_MODEL` and `EMBED_MODEL`: Llama 3.2 3B Instruct, Q4_K_M GGUF (~2 GB class), from a Hugging Face repo whose file actually resolves. Published GGUF builds of `meta-llama/Llama-3.2-3B-Instruct` exist on Hugging Face (community quant repos list a Q4_K_M file around 2.0 GB); pick one, then **verify the exact resolve URL returns HTTP 200 following redirects** before committing the pin, and record the repo, file name, byte size, and verification date in the log. Llama weights are license-gated upstream; if the chosen repo requires a Hugging Face account/acceptance, note it in the log and in `docs/META-API-SMOKE.md`'s sibling setup notes so Talha's download path is the account he controls.
2. Extend `ModelKind` with `'llama-chat'` and `specFor()` accordingly. The download path must go through the existing `downloadModel()` so the network guard applies unchanged (HF hosts only).
3. Add a model-selection setting (Settings/Privacy area, minimal): choices "Qwen2.5 3B (default)" and "Llama 3.2 3B (Meta)". Persist the choice; the engine load path uses it. Default stays Qwen until the T5 spike comparison says otherwise.
4. The Llama chat template differs from Qwen's ChatML. Check `src/agent/prompts.ts` and the engine's prompt construction: if prompts are hardcoded to ChatML shape, parameterize the template per model (Llama 3.2 uses its header-token format) and add unit tests for both template outputs. Do not let the router prompt silently run in the wrong template.

Acceptance: pin URL verified live (log entry); download of the Llama model completes through the guarded path on a device or, if no device is available to Codex, the unit/integration tests for spec selection pass and the device download is queued as a Talha step in the log; template unit tests pass; full suite green.

Test command: full suite, plus the URL check recorded in the log (`curl -sIL <resolve-url>` output's final status line).

### T5. Phase 0 spike re-run on the real router path (M, critical path)

Files: edit `src/diagnostics/spikes.ts` only if harness gaps appear; write results to `docs/PHASE0-RESULT.md`.

Steps:

1. Using the gate build from section 5 (or a newer `main` if T1 to T4 landed first, in which case re-run the section 5 procedure on the new commit), run the 30-case spike three ways on Talha's phone: (a) deterministic fallback only, (b) Qwen chat model, (c) Llama chat model (if T4 landed). Record toolRight, argsRight, parseOk, average latency per path.
2. Apply the section 5 bars to paths (b) and (c). Decide the demo default per section 5 branch A/B and record the decision with numbers.
3. If branch B triggers, implement the deterministic-first flag described there (a single settings constant the orchestrator reads), with tests.

Acceptance: `docs/PHASE0-RESULT.md` contains all measured paths, the branch decision, and the device/OS/commit it was measured on; full suite green.

Test command: full suite; spike numbers come from the device run, recorded in the result doc.

### T6. Escalation prompt and planner (M, PARALLEL after T3)

Files: create `src/cloud/planner.ts`; add `__tests__/cloud-planner.test.ts`.

Steps:

1. `buildPlannerPrompt(input, memoryExcerpts)`: system prompt frames Muse Spark as Vault's cloud planner: it may (a) answer directly, (b) propose a plan as an ordered list of the four existing tool calls in the existing JSON shape, or (c) say it cannot help. It receives only what the consent preview showed: the user request plus the specific memory excerpts listed there. Nothing else from the device is ever serialized into the prompt.
2. `parsePlannerResponse(text)`: extract either a direct answer or proposed `ToolCall[]`; run every proposed call through the existing `validateToolCall`. Invalid proposals are dropped individually and counted; a response with zero valid proposals and no direct answer returns a typed failure the orchestrator turns into the honest local fallback message.
3. Cap the payload: memory excerpts truncated to a documented budget (for example at most 5 excerpts, at most 4,000 characters total), enforced in the planner, unit-tested at the boundary.

Acceptance: parser tests cover direct answer, clean plan, plan with one invalid call (dropped, rest kept), garbage response (typed failure); payload-budget test passes; full suite green.

Test command: `npx jest __tests__/cloud-planner.test.ts`, then full suite.

### T7. Orchestrator: make the tier real (L, critical path)

Files: edit `src/agent/types.ts` (add `'meta-cloud'` to `PrivacyTier`), `src/agent/orchestrator.ts`, `src/agent/router.ts` (only if the candidate heuristic needs a router signal), `src/state/agent.ts` (forward escalation state); extend `__tests__/agent-core.test.ts`.

This is the heart of the build. Implement exactly the section 6 contract:

1. **Tier plumbing:** remove the hardcoded `tier: 'local'` / `leftDevice: false` in the orchestrator's private `audit()` and `finish()` helpers; both take the turn's actual tier. Local turns keep producing byte-identical audit shapes to today (existing tests pin this).
2. **Cloud-candidate detection:** a small pure function `cloudCandidate(input, localDecision): { candidate: boolean, reason: string }`. Candidates: (a) local decision is `none` AND input matches the documented multi-step pattern list (plan / itinerary / compare / summarize across notes / draft from my notes / "help me plan", "work out", "figure out" phrasings: write the list in code comments and tests); (b) the user explicitly requested cloud on this turn (a parameter the UI sets, T8); (c) the local conversational reply came back empty after one retry. Everything else stays local. When in doubt, local.
3. **Consent parking:** a candidate turn returns `confirmRequired: true` with a new `actionKind: 'cloud_escalation'` and an `escalationPreview` payload on the turn (exact text to be sent, model ID, tier label). Execution happens only in a new `confirmEscalation(turnId, approved)` method modeled on `confirm()`: on reject, run the local fallback path and return that turn with tier `'local'`; on approve, call T3's client via T6's planner, audit with `tier: 'meta-cloud'`, `leftDevice: true`, detail including model ID and sent-byte count.
4. **Proposed actions:** planner-proposed tool calls return to the user as proposals. Side-effecting ones park through the existing `confirm()` flow unchanged. The cloud brain never executes anything directly.
5. **Failure honesty:** cloud timeout/HTTP error returns a turn that says the cloud brain could not be reached and offers the local result instead. Never a silent retry loop, never a fake answer.
6. **Tests:** local turn unchanged; candidate turn parks with preview and sends nothing (assert the mocked client was not called before approval); approval calls client once and audits meta-cloud; rejection stays local; cloud failure falls back honestly; proposed side-effect still needs its own confirm.

Acceptance: all new tests pass; the pre-existing 77 tests pass unmodified except where a test pinned the old hardcoded tier shape (any such edit is called out in the commit message); a code comment at the top of `orchestrator.ts` is updated so its rules list includes the consent-gated cloud rule.

Test command: `npx jest __tests__/agent-core.test.ts`, then full suite.

### T8. Routing visibility in the UI (M, critical path)

Files: edit `src/ui/screens/Home.tsx` (and the chat/message components it uses), `src/ui/components/ActionConfirmModal.tsx` or a new `src/ui/components/EscalationPreviewModal.tsx`; edit `src/state/agent.ts` if new turn fields need forwarding.

Steps:

1. **Decision chip:** every assistant message renders a chip: `On-device` (local turns) or `Muse Spark · Meta cloud` (escalated turns), with a one-line reason under it ("Handled locally: private note." / "Escalated with your approval: multi-step plan."). Source the reason from the turn data T7 produces; do not hardcode per-screen strings.
2. **Escalation preview modal:** shows the exact payload (request + memory excerpts), the destination label ("Meta Model API · Muse Spark"), and Approve / Stay local buttons. Wired to `confirmEscalation`. While the cloud call runs, a visible "Asking Muse Spark..." state; on return, the answer renders with the cloud chip.
3. **"Ask the cloud brain" affordance:** a small button on a local answer that re-runs that turn as an explicit cloud candidate (T7 path b). This is also the demo's safety valve: if the heuristic misses on camera, Talha can force the escalation visibly, which still demos the consent flow honestly.
4. **Privacy Dashboard:** cloud turns appear in the audit view with their tier and byte counts; the dashboard's summary distinguishes "stayed on device" from "sent to Meta cloud with your approval" counts. Keep the existing design language (Lucide icons, current theme).

Acceptance: manual test script in `docs/HACKATHON-LOG.md` (the four demo beats from section 1, run on device, each chip and modal verified); component tests for chip rendering by tier pass; full suite green.

Test command: full suite, plus the on-device manual script recorded in the log.

### T9. SAM 3.1 camera task: "Find it with Vault" (L, CUTTABLE to a still-photo version)

Files: add dependency `expo-camera`; create `src/cloud/vision.ts`, `src/ui/screens/FindIt.tsx` (or a section inside Home if navigation cost is lower: decide in-task and note it); edit `src/ui/navigation.tsx`, `app.json` (camera permission strings), `src/privacy/` tests.

**VERIFY first:** use T3's VERIFY record for how SAM 3.1 is invoked (endpoint, image input format, text-prompt field, response mask/box format). If the VERIFY record has no SAM path (for example SAM is exposed through a different surface than the chat API), STOP and report; the fallback is in section 11.

The one task: the user photographs a cluttered surface and asks "where are my keys?" (also support: wallet, glasses, passport: a fixed target list shown as chips). Flow:

1. Camera screen (expo-camera) with the target chips; shutter captures one still photo (no video, no gallery access).
2. Consent preview: the photo thumbnail plus text, "This photo will be sent to SAM 3.1 via the Meta Model API to find: keys." Approve / retake.
3. On approval, `vision.ts` sends the image with the text prompt for the chosen target. The response (boxes/masks in whatever verified shape) is rendered as an overlay box on the photo with a plain-language answer ("Your keys are on the left side of the desk, next to the notebook"), produced by passing the segmentation result summary (not the image again) to Muse Spark through the T3 client for the verbal answer, or by a deterministic template if the SAM response already carries a usable label/location: implementer's choice, note it in the log.
4. A "Remember this spot" button saves the answer as a note through the existing local `save_note` path, so the follow-up demo beat ("Vault, where are my keys?" asked later, offline) recalls it from on-device memory. That closing loop is why this task exists.
5. Audit entries for the image send (tier meta-cloud, bytes = image size), and the photo is stored only in the app sandbox; add a delete-photo control on the result screen.

Camera permission: request through expo-camera's permission hook at first use of the screen (read the SDK 57 docs first), add the `app.json` plugin/permission strings in Vault's honest style, and re-check the Permissions screen: its currently-unwired microphone row stays as-is, but if expo-camera makes a real camera-permission request available to that screen, wire the camera row the same honest way the other rows were wired on 2026-10-20. No fake toggles.

Acceptance: on-device run recorded in the log: photo of a staged desk, keys found with overlay, answer saved, offline recall of the location works; mocked-fetch unit tests for `vision.ts` (success, no-match, HTTP error) pass; full suite green.

Test command: full suite, plus the staged-desk device run in the log.

**Cut rule:** if by end of 2026-11-01 the live SAM path is not returning usable results on device, ship the still-photo version with whatever verified SAM surface works (even a single round trip with a coarse box), and if no SAM surface works at all, invoke section 11's vision fallback. Do not let T9 consume T10 to T13's time.

### T10. Demo-mode hardening (M, critical path)

Files: create `src/ui/demoScript.ts` or a seeded-data module under `src/memory/`; edit Diagnostics/Home only as needed.

The demo must be deterministic on camera. Build the stage it runs on:

1. **Seed pack:** a one-tap "Load demo data" action (Diagnostics screen, clearly labeled, wipes nothing without a confirm) that seeds the exact notes the demo script uses: the travel note, the desk/keys note placeholder, the plan inputs. Exact note texts come from section 9's script; write them into the seed module verbatim from there so the filmed run and the code can never drift.
2. **Warm state:** a "Prepare demo" checklist on the Diagnostics screen: models downloaded (chat + embed), demo data loaded, cloud key present (yes/no only, never the value), airplane-mode test toggle reminder. Each row reads real state, like the Permissions screen does.
3. **Failure drills:** run the demo loop three times end-to-end on the demo device before T13: once on Wi-Fi, once toggling airplane mode mid-loop, once with the cloud API made to fail (revoke network after consent) to confirm the honest fallback message appears and the loop continues locally.
4. **No surprises:** disable or pin anything that can pop mid-demo on the demo device (OS update prompts are Talha's device settings; in-app, ensure no onboarding or permission prompt can appear after the Prepare checklist is green).

Acceptance: three drill runs logged with outcomes; seed pack loads the section 9 notes exactly; full suite green.

Test command: full suite, drills recorded in the log.

### T11. README and judge-facing repo polish (S, critical path)

Files: rewrite the top of `README.md`; create `docs/ARCHITECTURE-HACKATHON.md` (one page) or a diagram image under `docs/`.

Steps:

1. README opens with the one-paragraph pitch (Appendix A text), the demo video link placeholder (filled in T13), and a "Run it" section a judge can follow: prerequisites, install, the fact that models download on first run (~2.6 GB total), and how the cloud tier is enabled (own key in Settings; without a key the app is fully local).
2. A "What runs locally / what needs internet" table (this disclosure is a proven winner pattern): local model, memory, tools = on-device; model downloads = Hugging Face, one-time; Muse Spark escalation and SAM 3.1 = Meta Model API, only after per-turn preview and approval.
3. One architecture diagram: phone (local brain, memory, tools, guard) and cloud (Muse Spark, SAM 3.1), with the consent gate drawn on the arrow. Draw it with any tool; keep the source file in `docs/`.
4. A "Measured, not claimed" section: the Phase 0 numbers from `docs/PHASE0-RESULT.md`, quoted exactly.

Acceptance: README renders cleanly on GitHub; every number in it matches the Phase 0 result doc; no claim in it fails the honesty check (local claims only for local tier).

Test command: none (docs), but the full suite still runs before this commit.

### T12. Stretch lanes (only if T1 to T11 are done and green before 2026-11-02)

In strict order, each independently shippable, each dropped without regret if it risks the freeze:

1. **Streaming cloud answers** (if the VERIFY record says streaming exists): render Muse Spark's answer as it arrives. Pure demo feel; zero scope change.
2. **Second vision target set:** extend the Find It chips (passport, medication bottle) with the same flow. No new code paths, only targets.
3. **Cost/latency readout:** show tokens and latency on the cloud chip's detail view, from the client's usage metadata. Reinforces technical depth cheaply.
4. Nothing else. In particular: no new tools, no new screens, no voice work.

### T13. Demo video production support (M, critical path; Talha films, Codex prepares)

Files: `docs/DEMO-RUNBOOK.md` (create from section 9); assets in the repo's release page or the workspace, per section 12.

Steps:

1. Freeze build identified (T14 freeze commit); Muse deploys that exact build to the demo device path (EAS / GitHub Releases / Xcode per platform decision).
2. Codex writes the runbook: device prep checklist (seed pack loaded, models warm, brightness, notifications off, battery, the staged desk setup for the keys shot), the shot list from section 9, and the backup-plan note (pre-recorded cut details).
3. Talha films: (a) the continuous 90-second take, ideally three attempts, best one ships; (b) immediately after, a pre-recorded backup cut of the same beats edited clean, for the finals and for any live-demo failure. Captions burned in or sidecar: judges watch muted.
4. Upload to the submission's required host plus an unlisted backup link; put both links in the log and the README (T11 placeholder filled by a follow-up commit that does not touch code).

Acceptance: video link(s) live and verified by Muse; length at or under the portal's limit (verify at submission, section 10); the filmed build's commit hash matches the frozen build.

### T14. Freeze, regression pass, and submission build (M, critical path)

Steps:

1. **Freeze at 2026-11-02 23:59 ET** (calendar in section 8): after this, only crash fixes for the demo path land, each with a test and a log entry. No features, no copy changes outside submission assets.
2. Full regression: `npx tsc --noEmit`, `npx jest` (target: all suites green, count recorded), the three T10 drills re-run on the freeze build, the section 9 loop run start-to-finish on the demo device.
3. Tag the freeze commit `meta-hackathon-submission` and push the tag. Muse builds/releases from the tag.
4. Hand the submission package (section 10 checklist) to Talha with every field pre-filled from Appendix A.

Acceptance: tag exists; regression results in the log; submission package checklist fully ticked except the portal-side items Talha performs.

## 8. Day-by-day calendar: 2026-10-22 to finals

All dates 2026. Times ET where the event cares. Talha's day job runs weekday mornings; the plan assumes evenings plus the two weekends, which is why the freeze is 2026-11-02 and not later.

### Before the window (2026-10-22 to 2026-10-25)

| Date | Focus | Owner |
| --- | --- | --- |
| Thu Oct 22 | This playbook lands. T1 scaffolding. Credits checks 1 to 2 (section 3). | Codex + Muse/Talha |
| Fri Oct 23 | T2 guard extension. T4 Llama pin started. Credits checks 3 to 4. | Codex; Talha for console |
| Sat Oct 24 | Gate build produced (Muse deploys). Talha installs on his phone. Credits check 5 (Discord). | Muse + Talha |
| Sun Oct 25 | **Phase 0 gate run and report (section 5).** Branch A or B recorded. Official rules re-check when published. Escalation message sent if credits still missing. | Talha + Codex |

### Build window (2026-10-26 to 2026-11-04)

| Date | Focus |
| --- | --- |
| Mon Oct 26 | Kickoff livestream (Talha attends or catches the recording). T3 VERIFY gate first thing: Meta Model API + SAM shapes recorded from participant resources. Credits raised at office hours if still missing. |
| Tue Oct 27 | T3 client built against the verified shape. T4 spike comparison run (feeds T5). Workshop slots used only if a session covers the Model API or SAM; building beats watching. |
| Wed Oct 28 | T5 gate decision finalized on the full router path. T6 planner built. |
| Thu Oct 29 | T7 orchestrator tier work, day 1 (plumbing + candidate detection). |
| Fri Oct 30 | T7 day 2 (consent parking + confirmEscalation + tests). First end-to-end escalation on device. |
| Sat Oct 31 | T8 UI: chip, preview modal, cloud button, dashboard. Full demo loop runnable end-to-end by tonight, rough edges allowed. (Lexsi kickoff is also today: Talha attends online in the background only; it does not touch this plan.) |
| Sun Nov 1 | T9 SAM camera task. Staged-desk test by tonight; T9 cut rule applies at end of day. |
| Mon Nov 2 | T10 demo hardening + drills. T11 README. **Feature freeze 23:59 ET.** |
| Tue Nov 3 | **T13 filming day** (freeze build). T14 regression pass. Submission package assembled. **Submit by end of day** (target, one full day early). Circuit-breaker check (section 11) at 12:00 ET. |
| Wed Nov 4 | Buffer only: verify the submission is intact in the portal, fix portal-side issues, re-upload nothing unless broken. **Hard deadline 21:00 ET.** Evening off. |

### After submission

| Date | Focus |
| --- | --- |
| Nov 5 to Nov 8 | Judging window. No repo changes that could confuse a judge cloning `main` (the tag marks the submission; keep `main` presentable). Talha checks the portal/email once a day for finalist news. Attention shifts to the PayPal build (separate plan). |
| Mon Nov 9 | **Live finals / closing ceremony.** If Vault is called: Talha presents with the backup video queued, demo device charged, airplane-mode beat rehearsed that morning. If not called: watch, note what won, feed it into the next entry. |

## 9. Demo video script (90 seconds, one continuous take)

Rules for the take: one continuous shot of the phone in Talha's hands, no cuts inside a beat, captions on everything, the phone's status bar visible whenever connectivity matters (the airplane-mode toggle must be seen, not described). Target length 85 to 95 seconds. If the portal's video limit differs, the portal wins; verify at submission (section 10).

Stage setup (from T10's seed pack): demo notes loaded, models warm (one throwaway local query run just before filming so the model is loaded), staged desk ready off-camera with keys beside a notebook, brightness up, Do Not Disturb on, battery above 80%.

Seed note texts (T10 uses these verbatim):

- Note 1: "Flight to Vancouver on Nov 14, aisle seat, confirmation in email. Hotel is downtown near the water."
- Note 2: "Dad's birthday is Nov 20. He wants a leather wallet, brown, no bifold."
- Note 3: "Apartment door code for the dog sitter: 4417. Garbage day is Tuesday."

### Shot list

**Beat 1, the problem (0:00 to 0:12).** Close on the phone. Talha, voiceover or on-mic:

> "My life runs through dead zones. Flights, tunnels, my parents' place with one bar of signal. Every AI assistant I have tried just stops. And the ones that work want my private notes on their servers. Vault is different. It thinks on the phone first."

On screen during this: Home screen of Vault, the privacy line visible ("On-device" state).

**Beat 2, local capture and recall on Wi-Fi (0:12 to 0:30).** Talha types (or dictates, if voice is already solid; typing is safer):

> Types: "Note this: my passport is in the blue folder in the desk drawer."
> Chip appears: **On-device**.
> Then asks: "Where is my passport?"
> Vault answers from memory. Chip: **On-device**.

Narration: "Notes, memory, reminders: all on the device. Nothing leaves the phone."

**Beat 3, the escalation (0:30 to 0:52).** Talha asks the hard one:

> "Plan a Vancouver weekend from my notes: flights, hotel area, and a birthday gift stop for my dad."

The escalation preview modal appears, showing exactly what will be sent. Talha taps **Approve**. The "Asking Muse Spark" state shows, then the plan lands, chip: **Muse Spark · Meta cloud**.

Narration: "When a job is too big for a 3B model, Vault asks first. I see exactly what leaves the phone, I approve it, and Muse Spark, through the Meta Model API, does the heavy reasoning."

**Beat 4, airplane mode (0:52 to 1:12).** Talha swipes down the control center **on camera** and turns airplane mode ON. The status bar shows it. He asks:

> "Remind me to call Dad tomorrow at 9." Confirmation appears; he confirms. Then: "What did I note about garbage day?" Vault answers from memory.

Both chips: **On-device**. Narration: "Airplane mode. The local brain, Meta's Llama running right here, keeps working. Capture, recall, reminders. No signal needed."

**Beat 5, the eyes (1:12 to 1:25).** Airplane mode off (shown). Talha opens Find It, points the camera at the staged desk, target chip "keys", snaps the photo, approves the send. Overlay box lands on the keys: "Your keys are on the left of the desk, next to the notebook." He taps **Remember this spot**.

Narration: "And when words are not enough, SAM 3.1 gives Vault eyes, through the same API, with the same permission first."

**Beat 6, close (1:25 to 1:30).** Vault Home, then the Privacy Dashboard flash: counts of what stayed on device vs what went to the cloud with approval.

> "Vault. The phone that keeps thinking when the network dies, and asks before it ever phones home."

End card (2 seconds, part of the backup cut; in the continuous take, hold on the dashboard): project name, "Built with Llama (on-device), Muse Spark and SAM 3.1 via the Meta Model API", repo URL.

### Backup cut

Immediately after the continuous take, film the same beats as separate clean clips and edit them into a backup video with the end card and captions. The backup is what plays if a live demo is requested at finals and anything hiccups, and it is the fallback submission video if the continuous take has an unfixable flaw. The continuous take is the primary submission: judges reward seeing it really happen in one shot.

## 10. Submission package checklist

**Verify-at-submission warning:** the exact Cerebral Valley submission form fields have not been read yet (the portal sits behind participant login, and the submission form may only open inside the window). Every field below is a preparation item: have the content ready in a file, then map it onto the portal's actual fields on 2026-11-03 with Talha at the screen. If the portal asks for something not listed here, Muse drafts it from Appendix A the same day; nothing gets invented in the portal under time pressure.

Prepare by 2026-11-03 12:00 ET:

- [ ] Project name and one-liner (Appendix A, final wording locked).
- [ ] Track: Indie Developer. Theme: Build for Your World (primary). Team: solo, Talha M.
- [ ] Long description (Appendix A), with the "what runs locally / what needs internet" disclosure included.
- [ ] Demo video: primary link (continuous take) and backup link, both live, both captioned, length within the portal limit as displayed that day.
- [ ] Working demo access: the installable build link (EAS / GitHub Releases / TestFlight as the platform decision dictates) plus judge instructions ("install, complete onboarding on Wi-Fi, models download ~2.6 GB, cloud tier needs your own Meta Model API key in Settings; the app is fully functional locally without one"). If the portal offers a "try it" URL field, this link goes there.
- [ ] Repository link: `https://github.com/muhammadtalhaishtiaq/vault`. Decide visibility with Talha before submitting: the project's standing rule is nothing public without his tap, so if the portal requires a public or judge-accessible repo, that flip is Talha's explicit call on 2026-11-03, not a default.
- [ ] Screenshots: at least four that tell the story solo: Home with the On-device chip, the escalation preview modal, the cloud answer with its chip, the Find It overlay result, the Privacy Dashboard. (Five is fine if the portal allows.)
- [ ] Technologies list: Llama 3.2 (Meta open weights, on-device via llama.cpp), Muse Spark (Meta Model API), SAM 3.1 (Meta Model API), React Native / Expo, sqlite-vec. Name only what the shipped build actually uses; if T9 was cut to the fallback, this list changes to match reality (section 11).
- [ ] Phase 0 numbers quoted in the description match `docs/PHASE0-RESULT.md` exactly.
- [ ] Rules acceptance in the portal: Talha reads and accepts himself.
- [ ] Submit by 2026-11-03 end of day (target). Screenshot the confirmation; save it in the log.
- [ ] On 2026-11-04, open the submission once and verify every link still resolves. Then stop touching it.

## 11. Risk register and circuit breakers

| Risk | Early signal | Response (pre-decided) |
| --- | --- | --- |
| Phase 0 gate fails on the demo phone | Spike numbers below bars, or crashes, by 2026-10-25 | Section 5 branch B: deterministic-first routing, escalation-first for complex asks, one 1B attempt if the failure is size/latency. STOP-and-report only if both branches fail everywhere. |
| Llama 3.2 underperforms Qwen on the spike | T5 comparison gap over 3 points | Qwen stays the demo default; Llama ships as the selectable Meta model. The submission copy names the model that actually ran each beat. Never claim the demo ran on Llama if it ran on Qwen. |
| Meta Model API shape differs from every expectation | T3 VERIFY cannot confirm endpoint/model/fields | STOP at the VERIFY gate; escalate in Discord office hours on 2026-10-26 with the exact question. While blocked, build T6 against a fake client implementing the planner interface, so T7 is not blocked; swap the real client in when verified. |
| $150 credits never arrive | Section 3 ladder exhausted by 2026-10-28 | Build proceeds on any available balance (including the smaller public-preview signup credit if that is what exists) with strict call budgets: planner calls capped per demo run, no batch testing against the paid API (mock it). If no balance at all exists by 2026-10-30, Talha's call: fund a small amount himself, or the cloud beat is filmed against the planner running in a Muse-coordinated test harness and the submission discloses the setup honestly. The second option is a last resort and gets flagged in the log the day it is chosen. |
| SAM 3.1 has no usable API surface for us | T9 VERIFY finds no workable invocation | Vision fallback ladder: (1) SAM 3.1 through any verified hosted surface named in participant resources; (2) Muse Spark's own multimodal input for the find-it answer, with SAM dropped from the tech list and the demo narration adjusted ("the camera beat uses Muse Spark vision"); (3) cut Beat 5 and extend Beat 3 (a second, harder escalation) so the video stays 90 seconds. Any rung below (1) is recorded in the log and the submission copy matches reality. |
| Android build stays broken (Gradle history says this is a live risk) | No installable Android build by 2026-10-25 | Platform decision from section 5: demo on iOS from Talha's MacBook build. Android becomes a README note ("Android build in progress"), not a blocker. |
| Scope creep | Any task sprouting sub-features not in its steps | Kill list (section 1) is the answer. New ideas go in `docs/HACKATHON-LOG.md` under "Later", never into the window. |
| Talha's time (day job + two other hackathons) | Missed evening sessions twice in a row | Cut order: T12 stretch (already optional), then T9 to its cut rule, then T8's dashboard polish (chips and modal are not cuttable; they are the demo). Muse re-plans the calendar the day the signal appears. |
| Live finals demo failure (if selected) | n/a | Backup video queued, demo device on the freeze build, seed pack loaded, one warm-up local query done. Never demo on an untested build at finals. |

**The circuit breaker (overrides everything):** at **2026-11-03 12:00 ET**, Muse and Talha check one question: can the freeze build run the full section 9 loop on the demo device, start to finish, twice in a row? If no: all remaining time goes to the single broken beat, the submission goes in with the backup-cut video of the best working version, and no other hackathon work (PayPal, Lexsi) takes an hour until the Meta submission is confirmed in the portal. If yes: film, submit, and the rest of this plan is polish.

## 12. Division of labor

### Codex (this playbook's executor)

- All of section 7's tasks, in order, with their tests, commits, and pushes.
- `STATUS.md` updates per task; `docs/HACKATHON-LOG.md` entries for every build-side fact (VERIFY records, spike numbers, drill results, freeze tag).
- Reports STOP-gate findings verbatim (numbers, error text, URLs checked), never summaries of findings.
- Never touches: Talha's accounts, the Cerebral Valley portal, the Meta developer console, Secure Vault, payments, or the submission itself.

### Talha (human, account holder, on-camera)

- **Credits:** performs section 3 checks 1 to 5 (his inboxes, his portal login, his developer console), sends the escalation messages after review, accepts the official Hackathon Rules in the portal when published.
- **Secrets:** creates the Meta Model API key in the Meta developer console himself; stores it in Secure Vault and enters it on his own device (Settings field from T3, or hands Muse the `[credential:...]` reference for a build-time env injection, Appendix C). The key never travels through chat text or this document.
- **Phone:** installs gate and demo builds, runs the Diagnostics spike (section 5 steps 4 to 5), stages the desk, films the demo (T13), performs the actual portal submission on 2026-11-03, and presents at finals if selected.
- **Calls that are his alone:** repo visibility flip (section 10), any self-funding decision (section 11), branch-B STOP decisions (section 5).

### Muse (coordinator and deployer)

- **Deployments:** produces installable builds for the gate and the freeze (EAS Build or GitHub Releases APK for Android; coordinates Talha's Xcode build for iOS), posts build links into the log, verifies video and submission links resolve.
- **Credits chase:** runs the section 3 ladder with Talha, drafts escalation messages, tracks replies, flags the 2026-10-28 escalation point if reached.
- **Rules watch:** re-reads the official Hackathon Rules when published before 2026-10-26 and diffs them against section 2 (judging weights, submission requirements, video limits, repo visibility). Any conflict gets flagged to Talha before the window opens, and the affected section of this playbook gets a dated amendment note rather than a silent edit.
- **Calendar guard:** runs the 2026-11-03 12:00 ET circuit-breaker check (section 11) and protects the freeze.

### Handoff points (where work changes hands, explicitly)

1. Playbook to Codex: Talha hands Codex this document plus repo access. First Codex action: T1, then report the log file's first entry back.
2. Gate build: Muse posts the build link in the log; Talha installs and runs the spike; the numbers go back into the log; Codex records the branch.
3. API key: Talha creates it (console) and confirms "key is in Secure Vault / on device" without sending the value; Codex's T3 smoke test then proceeds on device via Talha running the `docs/META-API-SMOKE.md` steps.
4. Freeze: Codex tags `meta-hackathon-submission`; Muse builds from the tag; Talha films on that build.
5. Submission: Muse hands Talha the completed section 10 checklist with Appendix A copy; Talha submits; Muse verifies links on 2026-11-04.

## Appendix A. Submission copy (paste-ready)

Lock this wording at T11; only the bracketed factual slots change, and only to match measured reality.

**Project name:** Vault: the split-brain phone agent

**One-liner:** A private AI agent that thinks on your phone first, and asks before it ever phones home.

**Description:**

> My life runs through dead zones: flights, tunnels, a family home with one bar of signal. Every AI assistant I tried either stopped working offline, or worked by taking my private notes to a server. Vault is the agent I wanted instead: a split brain on one phone.
>
> The local brain is Meta's Llama [3.2 3B, open weights] running fully on-device. It captures notes, keeps a private memory in human-readable files on the phone, recalls it, and sets reminders and calendar events, all with the network physically off. On my phone it routes tool calls at [toolRight]% accuracy with [argsRight]% correct arguments, measured on a fixed 30-case on-device test (numbers, methodology, and the full result are in the repo).
>
> The cloud brain is Muse Spark through the Meta Model API, for the multi-step reasoning a 3B model cannot do. It is reached through a hard rule, not a setting: before anything leaves the phone, Vault shows me the exact payload and waits for my tap. Every send is written to an on-device audit log I can open. And for the things words cannot do, SAM 3.1 through the same API gives Vault eyes: point the camera at a messy desk, ask where your keys are, and Vault finds them and remembers the spot, locally.
>
> A routing chip on every answer says which brain did the work and why. That visibility is the point: privacy you can watch, not privacy you are asked to believe.
>
> What runs locally / what needs internet: notes, memory, recall, reminders, calendar, and all routing decisions run on-device. Model weights download once from Hugging Face (~2.6 GB). Muse Spark escalation and SAM 3.1 vision use the Meta Model API, only after a per-turn preview and approval, and are fully off when no API key is set.
>
> Built solo with React Native/Expo, llama.cpp on-device inference, and an orchestrator that validates every tool call and confirms every side effect before it happens.

**Judge instructions:**

> Install the build, complete onboarding on Wi-Fi (models download once, ~2.6 GB), then try it in airplane mode: save a note, ask for it back, set a reminder. For the cloud brain, add your own Meta Model API key in Settings, ask Vault to plan something from your notes, and watch the approval preview before anything is sent.

**Technologies line:** Llama 3.2 (Meta open weights, on-device), Muse Spark (Meta Model API), SAM 3.1 (Meta Model API), React Native, Expo, llama.cpp, SQLite/sqlite-vec, TypeScript.

If a slot cannot be filled truthfully at submission (Llama not the demo default, SAM on a fallback rung), the sentence changes to the true version. Appendix copy is a template, never a claim.

## Appendix B. Credits escalation messages (paste-ready)

**Discord / office-hours post (short):**

> Hi, Indie track participant here (approved Oct 20). I cannot find the $150 Meta Model API credit: nothing in my acceptance email, the Cerebral Valley event pages, or my Meta developer console balance. Where do selected participants claim the credit? Thanks.

**Reply to the acceptance email (if Discord gives no answer by 2026-10-26):**

> Subject: Missing $150 Meta Model API credit, approved Indie participant
>
> Hello, I was approved for the Indie Developer Track on October 20, 2026, and my acceptance materials mention $150 in Meta Model API credits for the build window. As of today I have checked the acceptance email, the Cerebral Valley participant pages, and my Meta developer console, and no credit or claim link appears in any of them. Could you point me to where the credit is claimed, or apply it to my account? My application email is the one sending this message. Thank you, Talha M.

## Appendix C. Environment and secrets checklist

- [ ] `.env` exists locally only, is gitignored (T1 verifies), and holds at most: `META_API_KEY` for local tooling smoke tests. It is never committed, never shared, never pasted into chat.
- [ ] On device, the key lives in Expo SecureStore under `vault_meta_api_key` (T3), entered by Talha in the app's Settings field, or set by Talha in the Meta developer console and injected at build time through EAS secrets / Expo config extra for the demo build only.
- [ ] Rotation rule: if a key ever appears in a commit, a log, a screenshot, or a video frame, it is revoked in the console the same day and replaced. Check the demo video frames before upload (T13): the Settings screen with a key field never appears on camera.
- [ ] Hugging Face downloads during onboarding use Talha's own device/account context; if the Llama GGUF repo chosen in T4 is gated, Talha accepts the license on his own Hugging Face account.
- [ ] No other secrets are needed for this build. There is no Vault server, no database credential, no third-party API key in scope.

## Appendix D. Test and verification commands

Run from `~/workspace/vault/code/`:

```bash
npx tsc --noEmit          # TypeScript, must be 0 errors
npx jest                  # full suite; baseline 77/77 on 2026-10-22, count must never drop
npx jest __tests__/agent-core.test.ts        # orchestrator / router / validator
npx jest __tests__/tools-privacy.test.ts     # tools + network guard
npx jest __tests__/cloud-privacy.test.ts     # after T2 (guard extension)
npx jest __tests__/cloud-planner.test.ts     # after T6
curl -sIL <gguf-resolve-url>                 # T4 pin check; final status must be 200
```

Device-side verifications (no command line substitute): the section 5 spike run, the T10 drills, and the section 9 full loop on the freeze build. Record each in `docs/HACKATHON-LOG.md` with date, device, OS, and commit hash.

## Appendix E. Sources, and what is still unverified

Verified locally (workspace files, read 2026-10-22): event facts, prize split, judging weights, themes, timeline (`~/workspace/hackathons/meta-global-ai/brief.md`, from the official Meta event page, Cerebral Valley page, and organizer waiver, read 2026-10-17/18); winner research and patterns (`~/workspace/hackathons/hackathon-roadmap-2026-10-20.md`, with per-claim source links); repo state (`~/workspace/vault/code/STATUS.md`, `package.json`, and the source files named in section 4); product rules and the Phase 0 gate (`docs/archive/DECISIONS.md`, `docs/V01-SCOPE.md`, `src/diagnostics/spikes.ts`).

Verified on the web on 2026-10-22: the $150 credit is stated in the organizer waiver and in participant-facing coverage, with no public claim mechanism documented (freetokens' hackathon credit page says delivery was not personally tested; this matches our status: approved, nothing received); the Meta Model API is Meta's developer API for the Muse Spark series, with developer documentation on developer.meta.com (the docs page itself was not readable from this environment on 2026-10-22 due to an access block, which is one reason T3 carries a VERIFY gate instead of hard-coded shapes); SAM 3.1 is Meta's current Segment Anything release (March 2026) with checkpoints published by Meta; GGUF builds of Llama 3.2 3B Instruct, including Q4_K_M files, are published on Hugging Face.

**Explicitly unverified, and treated as open questions inside the plan (not as facts):**

- The exact Meta Model API endpoint paths, model ID strings, auth format, and SAM 3.1 invocation shape. T3's VERIFY gate resolves these from official participant resources before any client code is written. Third-party claims (OpenAI-compatible shape, a base URL under `api.meta.ai`) are hypotheses for that check, nothing more.
- Whether the API offers streaming, and Muse Spark's exact context/pricing terms under the hackathon credit.
- The Cerebral Valley submission form's exact fields and video length limit. Section 10 is a preparation list; the portal, read live on submission day, is authoritative.
- Whether partner credits (Baseten, Modal, Fireworks) apply to Talha's participant tier or need separate claims. Section 3 covers the check.
- The hackathon Discord invite location (believed to be in the acceptance materials; Talha confirms during section 3 check 5).

Where this document and a live official source disagree, the live official source wins, and the disagreement gets a dated amendment note in the relevant section (Muse owns amendments before 2026-10-26; Codex flags, never silently overrides).
