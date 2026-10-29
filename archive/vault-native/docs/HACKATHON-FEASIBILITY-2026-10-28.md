# Vault at the Meta Global AI Developer Hackathon

> **Status (2026-10-29): superseded for hackathon execution.** The chosen event entry is the separate Goodfix responsive web project documented in [`apps/goodfix-web/PRD.md`](../apps/goodfix-web/PRD.md). This memo records the earlier Vault mobile proposal and remains historical evidence only; do not follow its Flutter/platform or demo-loop recommendations for the current entry.

**Research date:** 2026-10-28  
**Submission deadline:** 2026-11-04 21:00 ET  
**Remaining:** seven days until the deadline.  
**Decision status:** research recommendation, not a superseding product decision.

## Correction and thesis

The previous version of this memo made a serious strategic error: it treated a single SAM image upload as the hackathon product. That is only one operation and not a defensible product demo. The project is Vault, a personal agent whose hard problem is keeping context useful across private on-device memory, complex reasoning, real-world perception, safe actions, and offline recall.

The entry's strongest claim is **one agent that remembers privately, asks before sharing selected context, sees the physical world, then keeps working when the network disappears.** SAM is one perception step in that loop. The judgeable engineering is the coordinated system: local model and memory, explicit routing, exact-payload cloud consent, validated plans, grounded object location, local persistence, and a later offline recall.

## Recommended demo: one memory, three capabilities, a closed loop

Use one staged personal scenario that demonstrates why the parts belong together:

1. **Private capture and recall:** With the phone offline, use the on-device model to save a personal note and recall it from Vault's local memory. The memory remains human-readable and editable.
2. **Hard reasoning with a real boundary:** Ask for a useful multi-step plan based on a small, relevant subset of those memories. Vault shows the exact request and excerpts that would leave the phone. The user approves or stays local. Muse Spark returns a proposed plan; Vault validates it. Any reminder/calendar side effect still requires its own confirmation.
3. **Visual memory:** Point the camera at a staged, cluttered surface and ask where a named object is. SAM 3.1 segments the object; Vault overlays the actual returned mask/box. Derive a plain position such as left/center/right only from verified coordinates. The user confirms “Remember this spot,” and Vault saves the location into its existing local memory.
4. **Continuity proof:** Turn on airplane mode and ask where the object is. Vault recalls the saved location from local memory. The moment that proves the product is not SAM returning a mask; it is the same agent carrying useful context from sight into memory and back into an offline answer.

The loop should fit in the event's demo format only after each beat works on a physical device. If time forces cuts, keep the local-memory → consent-gated Spark plan → SAM-to-memory → offline-recall spine. Cut polish or breadth before cutting the loop's evidence.

### What each model earns its place doing

| Capability | Job in the loop | Why it is load-bearing |
|---|---|---|
| Llama 3.2 open weights on device | Private capture, ordinary recall, and offline continuity | Proves the local agent is not a thin cloud client. The current app runs Qwen, so do not claim the demo uses Llama until the exact model runs on-device. |
| Muse Spark 1.3 through Meta Model API | Multi-step synthesis over only user-selected memories | Demonstrates a real reasoning escalation whose payload is previewed, approved, and audited. It proposes actions; deterministic validation and user confirmation remain in charge. |
| SAM 3.1 through Meta Model API | Segment a named object in a camera image | Adds visual perception that the text agent cannot perform. Its actual mask/box output must be rendered and verified; never invent a location. |
| Muse Image | Optional user-requested visual artifact from a confirmed plan or saved memory | Keep out of the critical path unless a generated visual card improves the user's task and the extra cloud call can be shown reliably. Do not add it solely to list another model. |

Meta describes Muse Image as a separate image-generation/editing model, while Muse Spark produces text and can accept image input. A generated packing or memory card could become a useful optional result, but it adds another model call, another consent moment if personal context is included, and visual-output QA. It is a stretch, not a reason to weaken the core demo. [Meta Model API models](https://dev.meta.ai/docs/models), [Muse Image guide](https://dev.meta.ai/docs/image-generation)

## Four-dimension feasibility matrix

| Dimension | Finding for Vault | Decision |
|---|---|---|
| Platform friction | The repository contains an existing React Native agent core but no Flutter app yet. Flutter requires a deliberate port of the agent, memory, model inference, OS actions, and 53 Stitch screens. It removes the separate JS/native UI split but creates a major local-model and plugin compatibility gate. Public store approval is not required to produce demo builds. | **Flutter is now the user's explicit choice.** Build one Flutter/Dart codebase for Android and iOS. Preserve the React Native app as the behavioral/data reference until the Flutter vertical slice passes. Do not create a parallel web app. |
| Meta API feasibility and latency | Official docs confirm Muse Spark image input and SAM 3.1 via Meta Model API. The SAM flow and a Spark plan call are separate operations; a serial vision-plus-reasoning path can add noticeable wait and failure points. Public docs give ceilings and payload limits, not an end-to-end mobile latency promise. | Keep local capture/recall immediate. Use Spark only for the hard plan, and SAM only for the visual beat. Measure each request and the complete sequence on the demo phone/network. Use a progress state and an honest timeout/fallback. |
| Non-technical usability | Model selectors, API keys, prompt entry, multi-gigabyte setup, and privacy jargon will overwhelm a first-time consumer. Hiding data transfer would betray Vault's product promise. | The user chooses an outcome (“Remember this spot,” “Plan my morning”), sees plain-language preview of the exact data leaving, and taps approve. Model routing and tool schemas stay behind the scenes; the transfer does not. |
| Hackathon fit | The official event page describes Indie projects as judged on creativity, technical ambition, and whether they work. It does not publish the playbook's 30/25/25/20 weights. A full-system demo maps to the public criteria better than a model-name checklist, if it works end to end. | Make the full loop tangible and technically honest. Do not optimize against invented score percentages or add every Meta model merely to name it. [Official event page](https://dev.meta.ai/events/global-hackathon) |

## Platform verdict: Flutter, with a deliberate port

**Flutter is the implementation target because Talha explicitly chose it.** The app remains mobile-first and hybrid: one Flutter/Dart codebase, Android and iOS builds at the end. The Stitch design map is the full product's UI source. Do not rewrite the complete product as 53 independent screens before the agent, memory, inference, and privacy core has been proven in Flutter.

The working tree is still the React Native app; there is no Flutter project yet. A Flutter port is not a skin change: the TypeScript agent, SQLite/memory layer, `llama.rn` inference bridge, permissions, calendar/notification actions, and navigation all need Dart/native equivalents. Verify the current Flutter inference plugin/FFI path on an actual Android or iOS device before migrating the 53-screen UI. The existing React Native code is a behavioral contract, not disposable scaffolding.

The user asked for Android/iOS builds at the end. Establish a working Flutter debug build early, then prioritize a real Flutter release/demo artifact for the hackathon. “Flutter is faster” is not the reason for this decision; platform choice is now explicit, and delivery speed must be proven with an early build.

## API payload, latency, and failure points

Meta's current public documentation gives these useful constraints:

- Muse Spark 1.3 accepts image input and documents a 1,048,576-token context window. Context size is not a latency guarantee.
- SAM 3.1 segments still images or video through the Responses API. It returns masks/boxes for text-prompted objects; the app must use the real response representation.
- Inline image files are limited to 50 MB; Files API uploads are limited to 1 GiB. Those are API ceilings, not sensible phone-photo targets. Image token cost scales with resolution; Meta documents `/v1/responses/input_tokens` for estimating token usage.
- Public rate limits are request ceilings, not a service-level latency target or evidence that a specific user's team has credits/access.

The real path includes camera permission, capture, compression/encoding, network upload, SAM inference, response decoding, mask rendering, memory write, and later local recall. A second Spark call after SAM adds another round trip. Small/occluded objects, glare, motion blur, network variability, malformed masks, and native build issues can break the on-camera moment.

The cloud path must preserve Vault's existing rules. Before a request, show the exact image, target phrase, selected memory excerpts, destination model, and whether any intermediate service retains data. A clear approval must authorize that specific payload. Record time, model, byte count, consent decision, and outcome in the device's audit log; do not log the image or secret. Keep API credentials out of the mobile bundle and use a safe backend/credential strategy appropriate to Meta's official integration path. Never claim “nothing leaves the phone” for a cloud turn.

**Required measurements before the demo script is locked:** cold/warm local inference, image byte size, upload time, SAM request duration, any Spark duration, total approved-cloud turnaround, mask usability, offline recall success, and failure fallback. No copied or guessed latency numbers.

## The “Nerd Trap” audit

Vault fails the first-day test if a user has to know what an SLM is, write prompts, select a model, obtain an API key, understand a router, or decide which memory excerpts matter. The current README's multi-gigabyte model download and diagnostic setup are developer steps, not consumer onboarding.

Use the existing agent surface and translate engineering decisions into clear outcomes:

- “Tell Vault what you want it to remember.”
- “Where did I put my keys?”
- “Use these two notes to plan my morning?”
- Before sending, “Vault will send this photo and these two notes to Meta’s Muse Spark to make the plan. You can keep it on this phone instead.” Show the actual selected content and destination, then approve/cancel.
- Show a user-readable answer, suggested next actions, and a separate confirmation for any reminder/calendar change.
- Keep a visible privacy activity history with plain distinctions: “Stayed on this phone” and “Sent to Meta after you approved.”

This hides model mechanics while making consequences visible. Do not hide the cloud boundary to make the demo feel magical.

## Feature cuts without shrinking the project into a toy

Cut implementation scope that does not strengthen the single loop:

- No general-purpose assistant surface beyond the capture, recall, planning, and object-location jobs in the demo.
- No extra tools beyond existing local note/recall/reminder/calendar contracts and the consent-gated Spark/SAM paths.
- No model fine-tuning, account system, sync, payments, or social layer.
- No added Muse Image path unless the core user task benefits from its generated artifact and the user approves the source context.
- No video tracking, gallery browser, or multiple vision modes. One still image and one named-object task.
- No parallel web app. Preserve one Flutter codebase for Android/iOS; keep the old React Native tree until migration behavior and data compatibility are demonstrated.
- No polished dashboard expansion. Extend the existing audit view only enough to accurately show the cloud turn and the local follow-up.

Keep the three Meta capabilities that make the agent coherent: an on-device Meta open-weight model (if it passes the gate), Muse Spark for a specific complex reasoning job, and SAM for one real perception job. Cut decorative integrations, not the memory → reasoning → perception → action → recall continuity.

## Hard gates for the remaining build window

The original playbook's calendar has elapsed dates. Re-baseline from actual repo/device/API evidence before coding. Do not assume its historic test count, API access, credit status, or build progress is current.

1. **Flutter build gate:** create the smallest Flutter Android/iOS app and produce at least one installable debug build. Verify local model/runtime compatibility before porting screens. The Expo/React Native app is not an end build.
2. **Core port gate:** port one complete vertical slice—capture, local memory write/read, user confirmation, and audit—before expanding to the Stitch screens. Verify the Markdown memory portability contract.
3. **Meta API gate:** verify Muse Spark and SAM 3.1 exact request/response shapes against official docs and the participant account. Perform a real call with a non-sensitive staged image. Stop guessing if access or response fields differ.
4. **Local model gate:** current weights are Qwen, not Llama. Evaluate the Flutter llama.cpp plugin/FFI route and Meta Llama 3.2 compatibility on a real device. Never claim Llama ran unless the measured build used it.
4. **System loop gate:** demo the complete memory → consent → Spark plan/action proposal → SAM object location → local save → airplane-mode recall loop. If a beat is unreliable, cut the beat while preserving the product story and update all claims.
5. **Stitch parity gate:** map each of the 53 designs to navigation, behavior, and acceptance criteria. Build in slices; do not create 53 dead-end mock screens. The Nov 4 submission needs a finished representative path, not fabricated full functionality.
6. **Freeze:** preserve time for repeated device runs, failure drills, and filming. The user-visible build must be the one in the video; no mock output presented as live inference.

## Codex-first project conversion

Codex is now the primary project workflow. The repo-local supported structure is:

- `AGENTS.md` — persistent project instructions and product boundaries.
- `.agents/skills/adversarial-hackathon-review/SKILL.md` — repeatable independent review workflow.
- `CODEX-START-HERE.md` — source-of-truth order, startup gate, and milestone sequence.
- `CODEX-ADVERSARIAL-REVIEW.md` — readable reviewer role.
- This file — current hackathon strategy; the long build playbook remains the detailed task/acceptance source, after stale dates and claims are reconciled.

The existing `.claude/` directory and `CLAUDE.md` remain for compatibility and are not the primary instructions. The root `AGENTS.md` remains authoritative for all agents. A project-local Codex skill can instruct the active runtime to delegate to a reviewer at each substantive milestone; it cannot create a persistent process in `~/.codex` or guarantee that every runtime exposes subagents. We consulted an independent Codex reviewer on both the product loop and Flutter migration. It confirmed that the product's moat is context continuity and offline recall, and flagged local inference/plugin support plus the stale device gate as migration-critical.

## Sources checked 2026-10-28

- [Official Meta Global AI Developer Hackathon](https://dev.meta.ai/events/global-hackathon) — tracks, public judging description, dates.
- [Muse Spark and model modalities](https://dev.meta.ai/docs/models) — model inputs, context, Muse Image distinction.
- [SAM overview](https://dev.meta.ai/docs/sam/overview) — SAM 3.1 task and API surface.
- [Image understanding and payload limits](https://dev.meta.ai/docs/image-understanding) — supported inputs, image/file limits, token measurement.
- [Muse Image generation](https://dev.meta.ai/docs/image-generation) — generation/editing API, separate image output path.
- [Flutter documentation](https://docs.flutter.dev/) — official framework documentation entry point; selected SDK and plugin versions remain to be established before coding.
- Repo sources read: `README.md`, `STATUS.md`, `docs/ARCHITECTURE.md`, `docs/V01-SCOPE.md`, `docs/archive/DECISIONS.md`, and `Meta Hackathon Codex Build Playbook.md`.
