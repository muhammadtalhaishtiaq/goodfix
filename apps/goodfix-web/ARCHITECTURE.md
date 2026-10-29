# Goodfix Web Architecture

**Status:** proposed architecture for the hackathon project, 2026-10-29. No application code or provider integration is implemented yet.

## 1. Stack

- **UI:** React + TypeScript + Vite.
- **Styles:** plain responsive CSS, shared layout/components; no native wrapper for the hackathon MVP.
- **Browser case state:** in-memory state first; use IndexedDB for explicitly retained local evidence only after the deletion/export behavior is specified. Do not use `localStorage` for video blobs.
- **Evidence renderer:** HTML video/image frames and canvas/SVG overlays from actual SAM geometry. Preserve source dimensions and timestamps; never fabricate coordinates.
- **Model boundary:** a small server-side integration only if Meta confirms in writing that the proposed Integrated Product routing is allowed. Provider credentials live only in the authorized server environment.
- **Hosting:** undecided until written API authorization, secret storage, file handling, and privacy requirements are clear. No deployment is part of this decision.

## 2. System map

```text
User's browser
  ├─ Workbench / phone Guided mode
  ├─ numbered case evidence (Clip 01, Photo 02, ...)
  ├─ local media preview and consent review per model request
  └─ source-frame renderer + questions + step guide
          │ only after explicit approval of the shown payload
          ▼
Authorized Meta integration boundary (not approved yet)
  ├─ Muse Spark 1.3: video understanding → text observation / question / step proposal
  ├─ SAM 3.1: named object tracking → per-frame boxes and masks
  ├─ deterministic validators: supported task, required observations, stop conditions
  └─ Meta Files API IDs: tracked and explicitly deleted if that upload path is used
          │ validated text + actual geometry + source references
          ▼
Browser renderer
  ├─ evidence timeline and message references remain numbered
  ├─ active step shown with an annotated frame from that evidence
  ├─ user can ask, stop, or add a new separately approved item
  └─ failure state remains honest; no fallback to invented instructions
```

## 3. Media and model flow

1. The browser reads a selected file locally and creates a preview. Selecting a file does not make a network request.
2. The user sees the exact image/video, text prompt, model destination, and purpose for the specific request. Cancel means no network call.
3. After approval, send the approved media through the authorized integration. Muse Spark's video path uses the Files API (`purpose: user_data`) and a `file_id` in a Responses API request; public URLs are only appropriate for already-hosted media, not a default upload strategy.
4. Ask Muse Spark for a limited, structured observation and, when warranted, one clarification or one safe step proposal. It returns text, not a ready-made annotated frame.
5. Ask SAM 3.1 to track a concrete named object (for example, “cupboard handle”) in the approved clip. Parse real streaming output with Meta's documented SAM parser; align each returned mask/box to its source frame/timestamp.
6. A deterministic controller checks that the task is the single supported cabinet-handle flow, the needed part is visibly identifiable, the user has answered required questions, and no stop condition is present. Model text alone cannot clear a safety stop.
7. Render an actual source frame with the actual geometry, plus one short instruction. Muse Image is excluded from the critical path.
8. A user question or follow-up upload is a new request. Show and approve its exact payload. Keep previous evidence and messages in the case; append the new item with a monotonic number and timestamp.
9. If a Files API `file_id` is used, delete it after the case closes or evidence is removed. Meta's current docs say uploaded files do not expire automatically.

## 4. API access, privacy, and deployment gate

Meta's current terms grant rights to build Integrated Products for end users and separately restrict providing API access via a proxy/gateway without express written authorization. It is not safe to assume an unauthenticated website using an app-owned server key is permitted. Obtain written guidance on the exact architecture before implementing or deploying the live boundary. Until then, UI work may use clearly labeled local fixtures only; no fake success state can be presented as a real integration.

Never expose an API key in browser code. Request-level consent is required for every media transfer. Use Standard service mode for personal home media; the user's home footage and faces may be sensitive. Any persisted browser data must be user-deletable. Provider file deletion and app-side evidence deletion are separate actions and need honest status.

## 5. Responsive layout

- At wide desktop widths, Workbench uses three regions: numbered evidence rail, main source frame/active step, and case conversation.
- At phone widths, keep the active frame and one instruction primary. Show evidence as a numbered horizontal filmstrip; show questions directly below or in an explicit drawer. Preserve back/next, stop, and read-aloud controls without requiring precision pointer use.
- Conversation mode is an alternative prototype; it must not become the default if it buries the active repair step.

## 6. Resilience states

| Condition | User-visible behavior |
|---|---|
| User cancels consent | Close review; keep media local; no request. |
| Unsupported/large format | Explain the supported format and let the user choose another file; do not upload. |
| Blurry or missing part | Say the view is unclear; ask for one closer view or stop. No repair steps. |
| SAM has no match or parser fails | Do not draw a made-up mask. Keep the source frame and ask for a clearer view. |
| Spark timeout/rate limit/API error | Keep the case; explain the service did not answer; offer a retry after a fresh review. Never invent a result. |
| Unsafe or out-of-scope repair | Deterministic stop screen; no model-proposed workaround. |
| Meta Files API delete fails | Show unresolved deletion status and offer a retry. Do not claim remote deletion succeeded. |
| Browser refresh/close | Until IndexedDB persistence is implemented and verified, warn that the local case is session-only. |
