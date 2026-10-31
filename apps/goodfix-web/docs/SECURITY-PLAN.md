# Goodfix Security and Privacy Plan

**Updated:** 2026-10-29  
**Status:** planning; app code and live integration do not exist yet.

No software can be promised “fully secure.” The goal is to reduce likely risks, test each control, keep media exposure small, and stop release when a critical control or policy gate is unresolved.

## 1. Assets and trust boundaries

| Asset | Risk if exposed or altered | Boundary/control |
|---|---|---|
| Meta API credential | Unauthorized use, cost, account abuse | Server runtime secret only; least privilege; separate environments; rotate/revoke on suspected exposure |
| User video/image and accompanying text | Home, face, identity, and personal information exposure | Local preview before consent; per-request approval; transmit only selected payload; minimize retention; never log content |
| Consent record | Unauthorized or stale data transfer | Bind approval to exact evidence, payload, model, destination, and purpose; invalidate on change; reject replay |
| Public no-login route | Direct callers can bypass the browser's consent screen or consume provider budget | Treat UI consent as an informed-user control, not proof against a malicious caller; require written Meta authorization and a tested abuse/consent model before enabling the route |
| SAM geometry/source-frame mapping | Misleading visual claims or unsafe action | Parse documented schema; preserve dimensions/timestamps; validate alignment; render only real provider geometry |
| Model response | Unsafe/invented instruction | Treat as untrusted proposal; strict schema; deterministic scope/stop validator; show uncertainty and evidence reference |
| Provider file ID | Unintended remote retention | Track ID and deletion state; delete on removal/close when supported; retry failures; report actual outcome |
| Deployment and CI credentials | Supply-chain or deployment compromise | Minimum access; protected deployment environment; pinned CI actions; no secrets in untrusted PR jobs |
| Public Git history | Historical source or credential disclosure | Keep repository private for now; scan complete history before visibility change; revoke secrets before any history rewrite decision |

## 2. Non-negotiable secret rules

1. Never commit real credentials. `.env`, `.env.local`, `.env.*` are ignored; `.env.example` contains names and obvious placeholders only.
2. Never place a Meta key in `VITE_*` variables. Vite replaces exposed variables into browser code during bundling; treat every client variable, source map, static asset, and browser request as public.
3. If and only if Meta authorizes the exact server route in writing, store a dedicated key in the selected host's server-side runtime secret store. Separate local, staging, preview, and production credentials. Do not give preview/fork/PR jobs production keys.
4. CI workflows use minimal token permissions and verified pinned actions. Untrusted pull-request code runs without provider secrets. Do not print environment dumps or secret values in logs.
5. Scan working files and Git diffs before commit, scan in CI, and inspect production bundles/source maps for fake canaries and credential patterns. A clean scan is not proof that no secret exists.
6. If a real credential is exposed: stop affected deployments, revoke/rotate immediately, inspect usage, replace the secret in every environment, and determine whether logs/build artifacts/history require containment. Deleting the text alone does not revoke a key. Rewrite shared Git history only after explicit authorization because it is destructive.

## 3. Media and consent controls

- No media request occurs when selecting a file, previewing, canceling, opening a case, or changing a model preference.
- Before each transfer, show the exact media item(s), accompanying text, model, purpose, and every recipient/processor, including the Goodfix server/host and Meta when each receives data. State retention where known. Require a clear affirmative action. Consent is one-use and invalidates if any of those fields change.
- The server independently checks schema, allowed model, allowed task, consent reference/payload binding where supported, content type and file signature, byte/duration limits, and request limits. Client-side checks alone are not security controls.
- A public no-login server cannot know that a human really clicked the browser approval control: a direct caller may forge client-supplied consent metadata. Treat consent as a clear user-facing control, not authentication or a security boundary. Before live requests, Meta must authorize the exact route and the team must decide whether the exposure/abuse risk is acceptable; keep the route disabled or private if it is not.
- Keep raw videos and images out of application logs, analytics, crash reporting, and test artifacts. Log opaque request/evidence IDs, timing, status, model ID, consent result, and deletion status only.
- Avoid server disk persistence. If provider processing requires a file upload, keep only the minimum required transient state and provider file ID needed for cleanup. Define data lifecycle and failure recovery before implementation.
- Treat remote-provider deletion and local/browser deletion as separate operations. Never state that remote content is deleted until confirmation is received.
- Use only synthetic media for CI and initial staging. Personal media testing requires fresh explicit approval for the exact upload.

## 4. API boundary and abuse controls

The proposed no-login server-side Meta route is blocked until written authorization for this exact Integrated Product architecture. A private preview is not a workaround to the policy gate. No route, key, or public media request should be enabled before authorization.

If authorization passes, require all of these before public service:

- allowlisted model IDs and strict request/response schemas; no arbitrary model proxying;
- strict request size, media duration, timeout, concurrency, and per-origin/request limits;
- abuse throttling and cost/budget alerting suitable for a public no-login endpoint;
- explicit allowed origins and appropriate CSRF controls for the chosen request/cookie design; CORS is not user authentication;
- safe error mapping that does not expose provider tokens, stack traces, raw payloads, or internal URLs;
- no server-side URL fetch from user-supplied media URLs unless a separate SSRF design and allowlist is reviewed;
- rate-limit and deletion-failure monitoring, plus a tested kill switch and rollback;
- provider file upload IDs and cleanup retry queue if Files API is used.

If no-login abuse cannot be bounded under the approved terms and chosen hosting plan, do not expose a live endpoint. Reassess product/account architecture instead of relying on CORS or obscurity.

## 5. Model-output and repair safety

- Muse Spark observations and instructions are untrusted content. Parse a narrow schema; render text as text; never render raw HTML or execute model output.
- SAM geometry locates a visible object; it does not diagnose the cause or verify safety. Never infer a repair procedure from a mask alone.
- A deterministic validator owns scope, prerequisites, stop flags, and maximum step count. Model output cannot clear a stop.
- Stop for unknown components, unclear views, likely electrical/gas/fire/structural hazards, major leaks, damaged fasteners/material, unexpected resistance, or conflicting evidence.
- Keep the first demonstration restricted to a staged, accessible cupboard handle. Do not generalize the guidance beyond evidence reviewed by a knowledgeable human.

## 6. Environments and deployment

- **Local:** fixture adapter by default; `.env*` remains untracked. Any future local provider key stays server-only and must not be shared in logs or screen recordings.
- **CI:** fake data and fake keys only; no provider credentials in pull-request or fork workflows.
- **Preview:** private/access-restricted and fixture-only until the route policy gate passes. No production secret copied into preview.
- **Staging:** isolated service, synthetic media, staging-only credentials if approved, test retention/deletion, request limits, security headers, monitoring, and rollback.
- **Production/public:** requires written Meta authorization, verified host/runtime boundaries, age gating, public privacy notice, abuse/cost controls, deletion workflow, incident response, and user approval for deployment/visibility changes.

Compare Vercel, Render, and Railway only after route design is settled. Verify current official vendor documentation for runtime-vs-build secret exposure, preview environment separation, upload/request limits, timeouts, logging, region/data processing, and rollback. Select based on tested fit, not account availability.

## 7. Security incident and release stop rules

Stop deployment or disable the route if: a credential reaches client output; an unapproved media request occurs; a deletion failure is hidden; the safety validator can be bypassed; the service accepts arbitrary upstream models/URLs; rate limits or budget limits fail; or critical/high security findings remain unresolved.

For each incident, preserve non-sensitive evidence, revoke/rotate affected credentials, identify impacted environments and provider file IDs, assess user notification obligations, record the remediation, and require a fresh review before re-enabling the route. Do not put credentials or raw media in the incident log.

## 8. Verification standard and references

Use a scoped, versioned subset of [OWASP ASVS](https://asvs.owasp.org/) for web security verification. The plan is not a certification or guarantee of security.

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Vite environment variables and modes](https://vite.dev/guide/env-and-mode) — client-exposed prefixes are bundled; do not put credentials there.
- [GitHub Actions secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub secret scanning and push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection) — enable when the repository plan/settings support it, but keep independent scanning in CI.
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Render environment variables and secrets](https://render.com/docs/configure-environment-variables)
- [Railway variables](https://docs.railway.com/variables)
- [Meta Model API Terms](https://dev.meta.ai/legal/terms-of-service) — re-check before any provider integration or public launch.

