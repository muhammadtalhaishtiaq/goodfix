# Goodfix Test Plan

**Updated:** 2026-10-29  
**Test rule:** run the checks required by the current phase; do not claim coverage that has not actually run. Use synthetic files and fake credentials only in automated tests.

## Test pyramid and evidence

| Layer | What it proves | Minimum examples | Evidence |
|---|---|---|---|
| Static and build | Project compiles and style/type rules hold | format/lint, TypeScript, production build from lockfile | CI run URL/commit |
| Unit | Pure policy and parsing rules are deterministic | fresh consent, cancel, scope/safety gates, monotonic evidence IDs, schema validation, SAM geometry validation, deletion state machine | test report |
| Component | UI states communicate and prevent unsafe actions | exact-payload review, changed-payload invalidates approval, stop-state cannot continue, selected source frame/attachment references, accessible errors | component test report |
| Adapter contract | Provider adapters match recorded schemas | synthetic Muse response, SAM event stream, empty match, malformed/truncated response, upstream 429/5xx/timeout | sanitized fixtures and report |
| Integration | Browser/server boundary enforces rules | no request before consent, server rejects unsupported model/file/size, rate limit, timeout mapping, deletion retries, redacted logs | local integration report |
| End-to-end | A user can finish the real narrow workflow | initial evidence → review → approve → observation → step → question → numbered follow-up → evidence-linked response; cancel path sends zero bytes | Playwright report and screenshots |
| Security | Controls resist likely abuse and accidental leaks | secret scan, dependency/SAST scan, bundle/source-map scan, upload abuse, CORS/origin behavior, CSP/security headers, log redaction, consent replay, no cross-case leakage | CI artifacts and staging report |
| Accessibility | Core flow works without a mouse and is understandable | keyboard-only review, focus/announcements, contrast, labels, stop and error states, phone touch target review | automated report plus manual checklist |
| Reliability/performance | Slow and failing dependencies degrade honestly | timeouts, retries, 429/5xx, disconnect, large/malformed media, SAM streaming interruption, browser refresh, deletion outage | measured results with test environment noted |
| Release verification | Deployed artifact is the reviewed artifact | environment separation, zero provider keys in client, private staging, health/rollback drill, smoke test of the exact commit | deployment record and sign-off |

## Mandatory behavior assertions

1. Selecting a file, generating a local preview, canceling, or changing tabs makes no model request. The review names the Goodfix server/host and Meta as recipients/processors when each receives data.
2. In the supported browser flow, approval is bound to one payload, destination, purpose, model, and evidence item. Any change invalidates it; follow-up and retry require their own fresh approval as defined in the product flow. Do not claim this prevents a direct caller from bypassing the UI on a public no-login route.
3. The original evidence item remains selectable after follow-up. IDs are monotonic and every response references the item it used.
4. Unsupported, unsafe, unclear, or unrecognized cases stop. A model response cannot override a stop.
5. SAM masks/boxes are rendered only from parsed provider geometry and aligned to the matching source frame/timestamp. Empty or invalid geometry never draws a fixture overlay in a live state.
6. API keys and sensitive media/prompt content never appear in browser bundles, source maps, Git, telemetry, server logs, crash reports, or test artifacts.
7. Provider file deletion is tracked separately from browser/local evidence deletion. A failed delete remains visibly unresolved and retryable.
8. Timeout, malformed response, request limit, and upstream failure never fall back to fabricated output.

## CI gates

Run on every pull request and the protected main branch:

- deterministic install using the committed lockfile;
- formatting/lint, typecheck, production build, and test suites appropriate to completed phases;
- secret scanner against the working tree and Git diff; maintain a documented allowlist only for verified non-secret examples;
- dependency vulnerability/license review appropriate to the selected packages;
- static analysis and client output/source-map scan for provider key patterns and known canaries;
- security-sensitive workflow review: least-privilege token permissions, pinned actions, no provider secrets in untrusted PR jobs, and no `pull_request_target` execution of untrusted code;
- block merges when any required check fails. Do not print secret values to diagnose failing jobs.

Secret-scanner success is evidence of scanner execution, not proof that no secret exists. Before any public visibility change, review current files and the complete commit history.

## Manual test sessions

- **Consent/privacy:** cancel; approve; alter prompt after approval; retry; add a second clip; refresh with session-only data; inspect browser network requests and logs.
- **Media:** supported synthetic MP4/image; wrong extension/content type; oversized file; corrupt file; unsupported codec; missing SAM match; malformed coordinates; mid-stream interruption.
- **Safety:** exposed wiring, gas/fire/major leak text, structural damage, unknown part, unclear screw, damaged wood, strong resistance, mixed signals. Confirm stop screen and no procedural continuation.
- **Resilience:** slow network, offline, timeout, 429, 5xx, stale request, duplicate submit, user closes tab during upload, provider delete failure and recovery.
- **Responsive/accessibility:** desktop Workbench and phone Guided layout; keyboard-only pass; screen-reader announcements for consent, progress, errors, and stop; zoom/reflow.
- **Staging:** verify the exact deployed commit, environment variables by environment, no model key in client output, privacy notice, allowed origins, request limits, deletion behavior, alerting, and rollback.

## Test data rules

- Prefer synthetic fixtures that contain no real faces, homes, or personal content.
- Never put a live API key into a test, screenshot, browser storage, fixture, `.env.example`, CI log, or artifact. Use clearly fake values to test secret scanners.
- Keep fixture outputs labeled `TEST FIXTURE` in the UI and in filenames/metadata. Never use a recorded provider response to imply a live call occurred.
- Do not upload personal media to staging without separate explicit approval for that specific test request.

## Completion and reporting

Each test report records: commit SHA, test layer, environment, commands/tool versions, pass/fail counts, skipped checks, and any limitations. A green unit suite does not substitute for integration, security, or deployment verification.

This plan uses OWASP ASVS as the web-security checklist baseline; tailor the versioned controls to this app and record excluded controls with a reason. It is not a certification or guarantee of security.
