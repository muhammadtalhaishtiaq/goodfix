# Goodfix — Product Requirements

**Working title:** Goodfix (brand name open)  
**Status:** Hackathon MVP decision, dated 2026-10-29  
**Target:** Meta Global AI Developer Hackathon, Indie Developer Track  
**Submission deadline:** 2026-11-04 21:00 ET  
**Product form:** Responsive web app; no Goodfix account or sign-in  
**Code location:** `apps/goodfix-web/`  
**Related decision:** [`DECISIONS.md`](DECISIONS.md), 2026-10-29

## 1. Product in one sentence

Goodfix helps an adult work through one small, visible household fix: show a short clip, answer a useful question, follow one illustrated step at a time, then show a follow-up view so the helper can respond to what actually happened.

## 2. User and problem

The user is an adult doing a small repair who does not know the name of the part or the next sensible step. They need to keep looking at the physical object, understand one instruction, ask a question in plain words, and show what changed without losing the first clip.

The app must not imply that a video model is a qualified tradesperson. The product only gives bounded, cautious guidance for a task that has been deliberately tested. It must say when it cannot identify the part, when a view is unclear, or when the issue is outside the supported task.

## 3. Locked hackathon scope

### In the first demo

1. A responsive website that opens directly to the task; no Goodfix account or model-selection screen.
2. One staged, low-risk example: a visibly loose cupboard handle with an accessible screw.
3. One short user-selected video or image. Show a preview of the exact media and text that will be sent, the Meta destination, and a clear Cancel / Send choice before any network transfer.
4. Muse Spark video understanding to describe the visible sequence and produce a concise text response or clarification question.
5. SAM 3.1 video segmentation/tracking to locate the named visible part and return actual mask/box geometry. The app renders that geometry over the matching source frame; a mask is never described as a diagnosis.
6. A step guide with at most three steps. Each step uses a frame from the user's evidence with a visibly labeled pointer, mask, or box. Instructions and uncertainty are plain text beside the image.
7. A question field attached to the current step. Questions are shown in the same repair session and refer to the evidence item they use.
8. A follow-up image/video can be added to the same case after a new exact-payload preview and approval. It becomes item 02, then 03, and so on. The first upload remains selectable; no upload replaces an earlier one. The response links to the item it analyzed.
9. Clear stopping behavior for unclear, hazardous, unrecognized, or model-failure cases. Do not continue presenting repair steps after a stop condition.

### First layout decision

- **Desktop:** Workbench. Keep numbered evidence on the left, the selected source image/video and current illustrated step in the center, and the in-session questions on the right.
- **Phone:** use the same Workbench information structure, but adapt it to the Guided layout: large current visual and one step, numbered evidence strip, questions below or in a compact drawer. Do not squeeze three columns onto a narrow screen.
- **Conversation-first layout:** keep as a comparison concept; it is not the default build.

The interactive comparison is in [`design/goodfix-layout-comparison.html`](../design/goodfix-layout-comparison.html). It is a pre-build prototype, not evidence of implemented hackathon functionality.

## 4. User flow storyboard

### A. Start and capture

1. The user opens the page and sees the supported example and a single “Show the problem” action.
2. The user selects or records a short clip/photo. The page shows a local preview and lets them replace or cancel it.
3. A review panel names the exact file, accompanying text, purpose, model, and every recipient/processor, including the Goodfix server/host and Meta. It states whether each party receives or retains data. No call starts until the user approves that request.

### B. Understand and clarify

4. After approval, the app sends the selected media to the authorized Meta integration path. Muse Spark returns text; SAM returns tracked geometry. The user sees an honest progress state.
5. The app displays an observation tied to Clip 01 and asks one concrete question if needed, for example whether the screw head is visible.
6. If the object is not clear or the user's answer leaves a safety-critical unknown, the app asks for a closer view or stops. It does not infer missing details.

### C. Guide and check

7. The Workbench shows the selected numbered evidence, the current frame with SAM's actual overlay, and one short instruction. The user can read it, ask a text question, or optionally use read-aloud.
8. Each next-step action advances the guide only after the user chooses to continue. The assistant does not perform physical actions or claim that a repair succeeded.
9. The user can add a new photo or clip. It appears as the next numbered evidence item and stays linked to the message that introduced it.
10. A new model request has its own exact-payload review. The response refers to the new item while keeping the earlier evidence and messages visible/selectable.
11. The user marks the task done or stops. The UI explains what evidence is kept in the browser and, if Meta Files API was used, confirms cleanup of provider file IDs.

## 5. Visuals, questions, and voice

- **Primary repair visuals:** selected still frames from the user's own video, with SAM's actual geometry overlay and a short step label. The page must distinguish an observed frame from a conceptual illustration.
- **Generated diagrams:** Muse Image is outside the MVP critical path. A generated picture can invent a part or a tool; if explored later, label it as an illustration and never use it as evidence that the user's object looks that way.
- **Conversation placement:** keep questions next to the active step on phones and in the right panel on desktop. Every question/answer that uses media names its evidence item (for example, “Based on Clip 01”).
- **Read-aloud:** optional progressive enhancement after the live video and follow-up loop works. Browser speech output is not a Meta model and must have pause/stop controls.
- **Voice input:** defer. Muse Spark 1.3 audio is not fully supported according to current Meta docs; dedicated Voice Transcribe is an optional later task, not a dependency for the first demo.

## 6. Safety and scope boundaries

The MVP supports only the staged cupboard-handle task and its validated stop conditions. It does not generalize to every cupboard or every home repair without evaluation.

Out of scope: electrical work, gas, fire, plumbing, structural damage, vehicles, appliances, food preparation/chef workflows, medical advice, emergency response, and “repair anything.” These are distinct domains with different failure consequences and need separate expertise, tested instructions, and launch decisions.

If the user or model indicates electrical wiring, gas, fire, a major leak, structural damage, injury risk, an unrecognized component, damaged screw/wood, strong resistance, or an unclear image: stop the guide, say why in plain language, and direct the user to a qualified person or emergency service when appropriate. The model may not override this deterministic stop behavior.

## 7. Privacy, API, and account rules

- No media leaves the browser before an affirmative approval of that specific request. The preview names the Goodfix server/host and Meta as recipients/processors, the purpose, model, and any retention. A saved model preference is not consent for later uploads.
- Never put the Meta API key in JavaScript shipped to the browser, source maps, Git, screenshots, logs, or client build output.
- A server-side Meta integration for a no-login public product is **not approved for implementation or public use yet**. Meta's terms allow Integrated Products but restrict providing API access through a proxy/gateway without express written authorization. Get written guidance for this exact product and architecture before routing users' requests through an app-operated endpoint.
- Meta's API Terms require end users to be at least 18. This product is adult-only if those services are used.
- Use Standard services for personal/home media. Do not use Contributor mode for private home videos.
- Current Meta Files API docs say uploaded files do not expire automatically. If using Files API, track each provider `file_id` and explicitly delete it when the case closes or the user deletes the evidence. Inline files are limited to 50 MB and avoid Files API file cleanup; confirm the chosen model request shape and practical size before coding.
- The browser keeps original evidence visible as a numbered case timeline. Prototype object URLs are session-only; production persistence must be explicit, user-controllable, and deletable. Do not claim a file is durably saved until persistence is implemented and verified.
- Publish a plain-language privacy notice before public release. No analytics or background upload in the MVP.

## 8. Success criteria

The entry is demo-ready only when all of these are shown on the same build:

1. A real supported clip is sent through the authorized Meta path after exact-content consent.
2. Muse Spark returns a useful observation or clarification grounded in that clip.
3. SAM's real mask/box is parsed and rendered on the matching frame; zero-match and malformed-output paths are honest.
4. At least one safe, validated instruction appears with a source frame and a working stop/uncertainty path.
5. Follow-up media becomes a numbered item; the original remains selectable; the reply and message history point to the correct item.
6. A retry/timeout or an unsafe/out-of-scope input never falls through to invented instructions.
7. The responsive flow remains legible on desktop and phone widths.
8. The three-minute submission video and public repository clearly identify the work created during 2026-10-27–2026-11-04.

If any Meta authorization or model-access gate fails, do not fake the live loop. Report the blocker and reassess whether an honest, narrower entry can still pass hackathon Stage One.

## 9. Hackathon judging fit

The participant guide's current Stage Two rubric is Impact 30%, Use of Meta AI Tooling 25%, Technical Depth & Execution 20%, and Demo 25%. The intended proof is not video upload alone: it is a closed loop of visual observation → clarification → grounded instruction → follow-up verification, using Muse Spark and SAM for distinct roles. Stage One still requires viable theme fit and reasonable Meta-model use. The idea remains at risk of being judged a “Simple Image Analyzer” if the follow-up loop, useful task completion, and grounded visuals are not real.

The participant guide requires a public repository and a three-minute demo video, and requires the team to make new hackathon work identifiable. Keep this app isolated under `apps/goodfix-web/`; label the existing visual mockup as pre-build concept work.

## 10. Open gates before live implementation

1. Obtain written confirmation from Meta about the server-side integration path for this no-login public Integrated Product.
2. Confirm account access and real `muse-spark-1.3` and `sam-3.1` calls with synthetic, non-personal media. Require an 18+ check before any provider test that uses personal media.
3. Confirm the exact video payload size/format and SAM streaming parser against official docs and account access. Current docs support MP4 for Muse Spark video and SAM video; do not assume every mobile video codec works.
4. Capture and evaluate several staged cupboard-handle clips. Confirm safe wording and failure/stop handling with a knowledgeable human before presenting procedural steps.
5. Select a hosting/deployment path only after the API authorization gate and privacy requirements are clear.

## 11. Build, test, and release gates

- Build in the phases in [`TASKS.md`](TASKS.md), with test evidence captured per phase in [`TEST-PLAN.md`](TEST-PLAN.md). A phase is not complete because the screen appears to work; its exit checks must pass.
- Follow [`SECURITY-PLAN.md`](SECURITY-PLAN.md) for secrets, media consent, abuse controls, deployment isolation, and incident response. Do not promise perfect or complete security.
- Start with deterministic local fixtures and automated quality/security checks. No real Meta credentials or user media in tests, previews, logs, or test artifacts.
- Deploy a private fixture-only preview before considering an isolated staging integration. Public live service requires the written Meta authorization and all P7 exit gates; deployment is not implied by having Vercel, Render, or Railway access.
- Keep the GitHub repository private until Talha explicitly authorizes a visibility change. Before any public change, inspect the complete Git history because previous Vault commits remain in history.

## 12. Sources checked 2026-10-29

- [Meta Global AI Developer Hackathon participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details)
- [Muse Spark video and audio understanding](https://dev.meta.ai/docs/video-understanding)
- [SAM 3.1 overview](https://dev.meta.ai/docs/sam/overview)
- [SAM media segmentation](https://dev.meta.ai/docs/media-segmentation)
- [Meta Model API file handling and deletion](https://dev.meta.ai/docs/file-handling)
- [Meta Model API Terms of Service](https://dev.meta.ai/legal/terms-of-service)
