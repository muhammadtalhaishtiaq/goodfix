# Goodfix Hackathon Task Plan

**Last updated:** 2026-10-29  
**Deadline:** 2026-11-04 21:00 ET  
**Status key:** `[ ]` not started · `[~]` in progress · `[x]` complete · `[!]` blocked

This is the active task list for the separate web entry. One task at a time; keep the app contribution visibly isolated under `apps/goodfix-web/`. Do not treat the two HTML concept mockups as completed hackathon software.

## P0 — gates and scope

- [ ] **T0 · Meta authorization and account gate (2026-10-29).** Ask Meta for written clarification that the proposed no-login Integrated Product may route end-user requests through the planned server-side integration. Confirm account/model access and Standard mode. Record exact written evidence in `HACKATHON-LOG.md`. **Stop live API work if unresolved.** No app-owned key in the client.
- [ ] **T1 · Prove the sample task is safe (2026-10-29).** Select several staged clips of the same visibly loose, accessible cupboard handle. Have a knowledgeable human check that each proposed instruction and stop condition is appropriate. Keep the supported task narrower if clips differ. Do not add plumbing/electrical/cooking tasks.
- [ ] **T2 · Confirm exact API media shapes (2026-10-29).** From current official docs and participant account, record Muse Spark video request, SAM 3.1 video request/parser, allowed media types/size, and file deletion behavior. Use synthetic media first. No guessing request fields.

## P1 — product slice

- [ ] **T3 · Scaffold the web app (2026-10-29).** Create the Vite/React/TypeScript app in this directory with responsive CSS and a distinct event-build README. Acceptance: clean install/build; no changes to Vault's root React Native package or screens.
- [ ] **T4 · Implement Workbench and phone Guided mode (2026-10-30).** Use the layout comparison prototype as a starting reference. Evidence items remain numbered/selectable; current step visual stays primary on phones. Acceptance: viewport review at desktop and phone widths; prototype-only fixture responses labeled as fixtures until real integration lands.
- [ ] **T5 · Implement case evidence and consent UI (2026-10-30).** Local preview, exact request preview, cancel/send, chronological attachments, and message-to-evidence links. Acceptance: cancel sends nothing; each new media request requires a new affirmative approval; earlier files/messages remain in the case.
- [ ] **T6 · Build authorized Meta boundary (2026-10-31, only if T0 passes).** Keep credentials server-side; pass only approved media; record request IDs/status without raw media or secrets; implement provider-file deletion if Files API is used. Acceptance: one synthetic Muse Spark request and one synthetic SAM request on the documented official request shapes.
- [ ] **T7 · Parse and render SAM geometry (2026-11-01).** Parse official streaming response, keep source frame/timestamp association, render the actual box/mask. Acceptance: overlay alignment checked against the staged clip; zero-match, malformed, and interruption states do not show false detection.
- [ ] **T8 · Add bounded Spark guide (2026-11-01).** Return observation, one clarification, and at most one current step at a time. Acceptance: Spark cannot bypass the deterministic scope/safety gate; no steps when the required part is unclear; model output is labeled honestly.
- [ ] **T9 · Add numbered follow-up loop (2026-11-02).** Add a new photo/clip as 02+ without replacing 01; require new consent; reference the correct evidence item in the chat and response; let the user select prior items. Acceptance: demonstrate Clip 01 → Photo 02 → updated answer with both still selectable.

## P2 — reliability and submission

- [ ] **T10 · Failure and safety states (2026-11-02).** Exercise cancel, timeout, 429/5xx, unclear footage, no SAM match, unsafe/out-of-scope content, and file-deletion failure. Acceptance: no fabricated model results or unsafe continuation.
- [ ] **T11 · Accessibility and voice (2026-11-02, cuttable).** Add browser read-aloud with stop/pause if core flows are reliable. Voice input and Muse Voice Transcribe are deferred unless all P0/P1 gates pass early.
- [ ] **T12 · End-to-end demo freeze (2026-11-03).** Run the same staged clip repeatedly on the intended demo browser/network; record actual latencies and failures; rehearse fallbacks. Acceptance: working final build matches the video. If the live API gate fails, do not fake the call; stop and reassess submission viability.
- [ ] **T13 · Public repo and three-minute video (2026-11-04, before 21:00 ET).** Make new files/contributions explicit; confirm public repository/video links and contributor list; submit before deadline. Do not push, deploy, or submit without the user's direct authorization.

## Cut order if time shrinks

Keep: one supported scenario, exact consent, real Muse Spark video call, real SAM geometry, numbered follow-up, one responsive Workbench/Guided flow, truthful failure handling, and three-minute demo.

Cut first: voice input, read-aloud, generated images, accounts, persistence across browser restarts, multiple repair categories, conversation-layout polish, animation, analytics, and nonessential visual effects.

If written authorization or real API access is not cleared, T6–T9 cannot be reported as complete. Reassess the entry against Stage One rather than substituting mock results.
