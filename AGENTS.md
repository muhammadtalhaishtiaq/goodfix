# Active hackathon project: Goodfix Web

As of the dated 2026-10-29 decision in `apps/goodfix-web/DECISIONS.md`, the hackathon entry is a separate responsive web project in `apps/goodfix-web/`. Goodfix is a working title. The old Vault Expo/React Native app is preserved under `archive/vault-native/`; do not modify it for Goodfix.

Before substantive work, read `CODEX-START-HERE.md`, `STATUS.md`, the dated decisions, and the Goodfix PRD, architecture, and tasks in `apps/goodfix-web/`.

## Product boundaries

- The first demo supports only a staged, visibly loose cupboard handle. Do not broaden to plumbing, electrical work, cooking, appliances, vehicles, or “repair anything” without a new dated decision and domain-specific evidence.
- Muse Spark proposes observations/questions/steps. SAM 3.1 locates and tracks objects with geometry. Neither establishes why something broke nor whether a repair is safe. Deterministic scope and stop rules remain in control.
- Show a frame from the user's own evidence with actual parsed SAM geometry. Do not present generated images or mock masks as observed evidence.
- A request failure, unclear image, zero SAM matches, unknown part, or safety trigger must stop or ask for a clearer view; never invent repair instructions.
- Use absolute dates in plans, logs, and status.

## Privacy, provider access, and safety

- Do not make a network request with user media until the exact media, accompanying text, model destination, and purpose are previewed and the user approves that specific request. A prior setting or upload does not authorize follow-up requests.
- Do not put a Meta API key in browser JavaScript, source maps, Git, screenshots, logs, or client build artifacts. A server-side route is still blocked pending written Meta clarification for this no-login Integrated Product architecture; do not implement or deploy live routing before that gate passes.
- Meta's current API Terms require end users to be 18+. Use Standard models for private home footage; never use Contributor mode for personal household content.
- Meta Files API uploads do not expire automatically. Track provider file IDs and delete them when the case closes or the item is removed. Do not claim deletion before receiving confirmation.
- No hidden media upload, analytics, or background access. Any local media persistence must be visible, user-deletable, and accurately described.
- Vault's separate mobile product retains its existing privacy and wellness boundaries. Do not make Goodfix a therapy, medical, crisis, or diagnostic product.

## Project structure and implementation

- `apps/goodfix-web/` is the only place for Goodfix web application code, design artifacts, and active product docs.
- `archive/vault-native/` is historical source and docs. Leave it untouched unless Talha explicitly asks for Vault maintenance.
- The active web stack is React + TypeScript + Vite + responsive CSS, per the 2026-10-29 decision. Do not add Flutter or mobile wrappers for the hackathon MVP.
- The Expo SDK 57 documentation requirement applies only when changing the existing Vault React Native app. It is not a reason to implement Goodfix in Expo.
- No live Meta API implementation until the written authorization, account access, model request/response, and file deletion gates in `apps/goodfix-web/TASKS.md` are recorded.
- Do not add tests or run tests unless the user asks to test/verify implementation. Do not claim a browser, model, or device run from documentation alone.
- Do not push, publish, deploy, create a release, or submit the hackathon entry without direct user authorization.

## Codex review protocol

- Follow `.agents/skills/adversarial-hackathon-review/SKILL.md` at each substantive planning or implementation milestone. Request an independent subagent review when available. Ask for a concrete failure mode, unsupported claim, privacy issue, unsafe edge case, and scope cut.
- Record the reviewer’s key finding and how it changed or confirmed the decision in `apps/goodfix-web/HACKATHON-LOG.md` or the relevant work log. Never claim consultation if none occurred.
- The primary agent owns final decisions and checks claims against official Meta and hackathon sources. User-facing model behavior must be labeled accurately; a prototype fixture is never a live result.
