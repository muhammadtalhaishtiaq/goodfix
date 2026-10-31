# Goodfix Phases and Task Board

**Updated:** 2026-10-30
**Hackathon submission deadline:** 2026-11-04 21:00 ET
**Current state:** a minimal React + TypeScript + Vite shell exists; dependencies are not installed and there is no lockfile or render test yet. The upload flow, backend, CI, and Meta integration are not implemented.

Tasks move to `[x]` only when the acceptance evidence is recorded in `HACKATHON-LOG.md`. A connected hosting account is not a release gate. Phase 0 blocks live provider calls, personal-media testing, and procedural guidance, but it does not block the fixture-only scaffold, CI/security checks, or local UI work in Phases 1–2. If a blocking gate fails, stop the dependent phase and select an honest fallback.

## Phase 0 — Confirm gates and reduce risk

**Goal:** remove unresolved product, policy, and demo blockers before live model work.

- [ ] **P0.1 Meta route authorization.** Obtain written confirmation for the exact no-login Integrated Product and server-side request flow. Save a dated reference in the log. Until then, no provider proxy or user-media network request.
- [ ] **P0.2 API and account validation.** Verify current model names, access, video/image formats and limits, response schemas, SAM parser requirements, deletion behavior, and Standard/Contributor designation against official Meta docs and the participant account. Use synthetic media only; require an 18+ check before any later real-provider test with personal media.
- [ ] **P0.3 Cupboard-handle safety set.** Record staged test clips and have a knowledgeable human review the supported task, instruction wording, and deterministic stop rules. No broad repair claims.
- [ ] **P0.4 Data and abuse boundaries.** Decide what stays in browser memory, what reaches Meta, what (if anything) the server stores, request limits, retention, and the no-login abuse controls. Explicitly assess that direct callers can bypass a browser consent screen; a client-supplied consent field is not proof of human approval. Document remaining risks.
- [ ] **P0.5 Hosting decision research.** Compare Vercel, Render, and Railway against the approved architecture, request/response size and duration, runtime secrets, preview isolation, log controls, rate limits, region/data processing, and rollback. Select one primary host and one fallback only after current official documentation and a small non-sensitive deployment spike.

**Exit gate:** live-model phase remains blocked until P0.1 and P0.2 pass. Product guidance remains blocked until P0.3 passes. A private, fixture-only preview can proceed without those live-model gates.

## Phase 1 — Secure project foundation

**Goal:** make a small app buildable and make unsafe changes fail early.

- [~] **P1.1 Scaffold.** Minimal React + TypeScript + Vite shell exists under `apps/goodfix-web/`. Next build-only slice: resolve the declared dependencies, generate and review `package-lock.json`, install from that lockfile, then run `npm run build` (`tsc -b && vite build`). Lint and typecheck remain P1.1 checks outside this slice. The `test` script calls `vitest run`, but Vitest is not listed in `devDependencies`; add Vitest and the planned render test in this slice (test-first workflow, 2026-10-30). Full P1.1 completion requires its render test and remaining phase checks to run and be recorded. No root Vault app restoration or mobile wrapper.
- [~] **P1.2 Secret-safe config.** Ignore rules now cover `.env` and `.env.*` while allowing `.env.example`. Still required: add a placeholder-only app `.env.example`, document the server-only key boundary beside the code, and verify no real credential is present in Git history/current tree before any public release.
- [ ] **P1.3 CI quality gates.** Add install-from-lockfile, formatting/lint, typecheck, production build, unit tests, dependency audit, and secret scanning. Pin third-party CI actions to verified immutable refs and grant only required token permissions. Do not expose secrets to fork or untrusted pull-request jobs.
- [ ] **P1.4 Fixture adapter.** Define provider interfaces and deterministic synthetic responses. The UI must visibly label fixture content; fixtures must never masquerade as a live result.

**Exit gate:** clean install and CI pass; a built client contains no provider credential; an intentionally seeded fake canary is caught by the scanner; no deployment contains a provider key.

## Phase 2 — Core UI and local evidence flow

**Goal:** deliver the Workbench/Guided workflow without network access.

- [ ] **P2.1 Responsive shell.** Implement numbered evidence rail, source visual/active step, and questions panel; adapt to phone Guided mode. Review keyboard and touch use at representative widths.
- [ ] **P2.2 Evidence state.** Add and select numbered images/clips without replacing earlier evidence. Link every message and result to the evidence item that caused it. Session-only persistence must be clearly stated.
- [ ] **P2.3 Consent gate.** Show the exact selected media, accompanying text, purpose, model, and every recipient/processor, including the Goodfix server/hosting provider and Meta. State whether each party receives or retains data. Cancel sends nothing. Consent is single-request and invalidated by any payload/model/purpose/recipient change.
- [ ] **P2.4 Stop and uncertainty UI.** Implement unsupported task, unclear media, safety flag, empty match, and model failure states. A stop cannot be bypassed by the model response.

**Exit gate:** deterministic component and browser tests prove no network call before approval, no stale consent reuse, accurate numbering/linkage, and visible stop behavior. All calls use local fixtures.

## Phase 3 — Upload and server boundary (conditional)

**Goal:** implement a constrained server route without leaking media or credentials.

- [ ] **P3.1 Route design review.** Reconfirm the route matches Meta's written authorization. Specify accepted model IDs, request schema, max media bytes/duration, MIME/content validation, timeouts, rate limits, origin policy, error mapping, and request budget controls.
- [ ] **P3.2 Upload handling.** Stream or stage media only as required by the approved Meta flow; do not persist original media on the app server unless a reviewed requirement needs it. Reject malformed, oversized, unsupported, or mismatched content before provider transfer. If temporary files or transcoding are needed, enforce disk/CPU/time caps, use non-executable isolated temp storage, clean up on every path, and test cleanup after crashes/timeouts.
- [ ] **P3.3 Credential placement.** Put a dedicated least-privilege key only in the chosen host's server runtime secret store. Separate development, preview, and production. Do not copy the production secret into preview or CI. Never use `VITE_*` for a provider key.
- [ ] **P3.4 Privacy-safe logs.** Log request ID, selected model, timing, outcome, consent reference, and deletion state only. Do not log API keys, request/response bodies, prompts, filenames, user media, or raw provider error payloads.
- [ ] **P3.5 Files lifecycle.** If Meta Files API is required, persist the provider file ID only as needed to delete it, retry deletion safely, expose truthful status, and test delete on remove/close/failure paths.

**Exit gate:** approved route, synthetic-media contract tests, request-size and rate-limit checks, no-secret checks, redacted-log checks, and verified provider-file deletion behavior. If authorization is absent, skip this phase and do not deploy a live endpoint.

## Phase 4 — Real model adapters and grounded visuals (conditional)

**Goal:** connect distinct Meta capabilities without treating output as diagnosis.

- [ ] **P4.1 Muse Spark adapter.** Implement the currently documented request and response schema behind the server boundary. Parse model text into a strict observation/clarification/step proposal schema; reject malformed output.
- [ ] **P4.2 SAM 3.1 adapter/parser.** Use the official documented parser. Preserve source frame, timestamp, dimensions, and object geometry; reject mismatched or invalid coordinates.
- [ ] **P4.3 Source overlay.** Render the actual parsed mask/box over the matching user source frame. No generated or fabricated mask/repair image can appear as observed evidence.
- [ ] **P4.4 Deterministic response gate.** Validate supported task, required evidence, and stop conditions before a proposal reaches the user. Model text cannot clear a stop flag.
- [ ] **P4.5 Synthetic then staged evaluation.** Start with synthetic provider fixtures and synthetic clips; use staged cupboard clips only after per-request consent, an 18+ check for personal media, and the approved account route. Record latency and error rates from actual runs, not guesses.

**Exit gate:** request/response contract passes; real SAM geometry aligns with source; unclear, zero-match, malformed, timeout, and unsafe paths stop honestly; no fabricated success state.

## Phase 5 — Follow-up loop and resilience

**Goal:** finish the narrow product loop and prove recovery behavior.

- [ ] **P5.1 Bounded guide.** Show one validated step at a time, with no more than three steps in the case. Each step cites the source evidence item.
- [ ] **P5.2 Follow-up attachment.** Add image/video as the next numbered item, keep the original selectable, require new consent, and tie the response to the new item.
- [ ] **P5.3 Retry and interruption.** Add explicit retry for timeout/rate limit/transient errors. Every retry rechecks approval where the payload or destination changes; avoid duplicate provider uploads and clean up abandoned file IDs.
- [ ] **P5.4 Recovery drill.** Exercise provider timeout, 429/5xx, client disconnect, malformed SSE/JSON, deletion outage, and refresh/close. No error may fall through to invented instructions.

**Exit gate:** end-to-end scenario plus all failure drills pass with preserved case history and truthful remote-deletion status.

## Phase 6 — Security, accessibility, and staging release

**Goal:** verify the deployed build with realistic abuse and recovery checks.

- [ ] **P6.1 Security review.** Complete the scoped OWASP ASVS checklist in `SECURITY-PLAN.md`; review upload, consent, rate-limit, logging, CORS/CSRF where applicable, CSP/security headers, error handling, and dependency risks.
- [ ] **P6.2 Abuse and privacy tests.** Verify automated limits, repeated upload throttling, malformed file rejection, no cross-case leakage, no prompt/body logging, consent replay rejection, and remote-file cleanup.
- [ ] **P6.3 Accessibility/responsive checks.** Run automated accessibility checks and manual keyboard/screen-reader review of consent, progress, errors, stop, and step navigation. Review phone and desktop layouts.
- [ ] **P6.4 Private staging.** Deploy to a private or access-restricted staging target with synthetic data. No production key, no public indexing, and no public user-media flow. Verify TLS, CORS, headers, limits, log redaction, health checks, and rollback.
- [ ] **P6.5 Release candidate review.** Independent adversarial review and owner sign-off on the tested commit, privacy notice, data retention, and incident/rotation playbook.

**Exit gate:** staging verification report, no critical/high unresolved findings, tested rollback, and all relevant CI gates green. This does not authorize a public launch.

## Phase 7 — Demo and live release gate

**Goal:** produce an honest demo and only then consider a public live service.

- [ ] **P7.1 Demo freeze.** Freeze a tested commit and rehearse the same scenario on the target browser/network; record actual latency and fallback behavior.
- [ ] **P7.2 Public repository preparation.** Before visibility changes, review the entire Git history, including historical Vault commits and any ignored local files accidentally tracked in older commits. Rotate any exposed credential before considering history cleanup. Do not change visibility or rewrite history without Talha's explicit authorization.
- [ ] **P7.3 Public service release review.** Require written Meta route authorization, current policy review, 18+ gating, privacy notice, abuse controls, budget limit, delete lifecycle, monitoring, incident response, and verified rollback.
- [ ] **P7.4 Submission.** Record the three-minute demo and submit only with direct user authorization before **2026-11-04 21:00 ET**.

**Exit gate:** demo claims match the tested build; repository visibility and deployment state are explicit and user-approved; no unreviewed secret or historical exposure is present.

## Demo-critical cut order

Keep one supported cupboard-handle case, consent, truthful observations, real SAM geometry if authorized, one grounded step, numbered follow-up, stop behavior, and recoverable failures. Cut read-aloud, voice input, Muse Image, multiple repair domains, durable cross-session media storage, accounts, extra layouts, analytics, and animation first.
