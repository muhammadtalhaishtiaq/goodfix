# Goodfix Hackathon Log

Append dated, evidence-based notes here. Never include API keys, raw user media, or private account data.

## 2026-10-29 — Project direction locked

- Decision: separate responsive web project at `apps/goodfix-web/`; Goodfix is a working title only. Vault's existing React Native product remains in the repository and is not the hackathon entry.
- First demo task: a staged visibly loose cupboard handle. Scope excludes plumbing, electrical work, cooking, and generic repair-anything.
- Layout: Workbench on desktop; step-focused Guided adaptation on phone. Conversation-first stays an alternate concept.
- Independent red-team finding: the API proxy/authorization question is a hard gate; preserve all evidence with monotonically numbered attachments; SAM localization is not fault diagnosis; six-day demo needs real end-to-end proof; delete persistent Meta Files API uploads.
- Source docs checked 2026-10-29: Meta video understanding, SAM 3.1 segmentation, Files API, API Terms, and Cerebral Valley event page. No user media or API calls were made for this research.
- Current implementation state: HTML layout mockups only. The web application, backend, Meta calls, and persistent case storage are not implemented.

## 2026-10-29 — Repository cleanup

- Archived the former Vault Expo/React Native source, assets, tests, product documents, and historical playbook under `archive/vault-native/`; preserved their contents rather than deleting them. Goodfix prototypes remain under `apps/goodfix-web/design/`.
- Independent archive review confirmed the separation and called out root package-command changes as a consequence of moving the old Expo manifest. Root project guidance now identifies Goodfix as active and the Vault tree as historical.
- No app code was changed and no tests were run as part of this organization pass.

## 2026-10-29 — GitHub publishing review

- Independent reviewer confirmed the moved Vault tree and Goodfix docs are separated; the local `.env` stays ignored and must not be force-added. The reviewer recommended `goodfix` as the repository name.
- The configured repository is `muhammadtalhaishtiaq/vault` on `main`, with write access. Its current visibility is private. It will remain private during this upload because changing visibility requires separate authorization; the event guide requires a public repository before submission.

## 2026-10-29 — Phased build, testing, and security plan

- Decision: sequence work from authorization/data gates to a fixture-only foundation, local consent/evidence flow, gated server boundary, model adapters, follow-up loop, isolated staging, then an explicitly approved release. Hosting choice remains open pending route and limit verification.
- Independent red-team finding: do not let “deploy soon” bypass Meta's written authorization; move secret scanning and CI controls before upload code; keep fixtures deterministic; separate private preview from live staging; test consent/no-upload, response parsing, numbered evidence, deletion, failure behavior, responsive/accessibility, and security in distinct layers.
- The reviewer also found a public-repository risk: the older Git history contains Vault work. Before a public visibility change, inspect the entire history and decide how to handle it; no history rewrite or visibility change is authorized by this plan.
- Research checked 2026-10-29: Vite documents that `VITE_*` values are bundled into client code; OWASP ASVS provides a web security verification baseline; Meta's current terms expressly restrict proxy/gateway access absent written authorization. Host environment-variable docs were checked for Vercel, Render, and Railway; selection remains unmade until the runtime and data flow are fixed.
- Primary-agent adversarial pass found an additional no-login risk: a public caller can bypass the browser consent screen and forge client-supplied consent metadata. The plan now treats consent as user-facing UX rather than authentication, and requires an explicit abuse/consent risk decision before enabling any live route.
- Independent review of the actual plan confirmed phase ordering and identified four refinements now applied: name the app server/host in the consent preview; require an 18+ check before personal-media provider tests; specify bounded, non-executable temporary media handling if processing requires it; and state that Phase 0 blocks live calls but not fixture-only foundation/UI work. The review agrees the public repository history requires a separate inspection before visibility changes.
- No app code was implemented, no test suite was run, and no deployment was made during this planning step.

## 2026-10-29 — Phase 1.1 shell started; paused

- Created a minimal React + TypeScript + Vite shell from the official `react-ts` starter (`create-vite` 9.3.3; Vite 8.3.5). It shows an explicitly disabled upload action and states that no files are sent and no network request is made. This is not the Workbench flow and is not a working upload demo.
- Updated `.gitignore` to ignore `.env` and `.env.*`, with `.env.example` allowed. The existing ignored local Vault `.env` remains untracked; no credential was added to the project files.
- Environment observed: Node.js 22.22.3, npm 11.17.0. Dependencies are not installed; no `package-lock.json`, CI workflow, secret scanner, or test files exist yet. The `test` script is a placeholder until Vitest is installed.
- No lint, typecheck, build, or tests were run. No model requests, deploys, commits, or pushes occurred during this step.
- Resume with P1.1/P1.2 in `TASKS.md`: inspect the starter manifests, install dependencies and create/review the lockfile, add a smoke test and `.env.example`, then run and record the foundation checks before proceeding.

## 2026-10-30 — Workflow skills checked

- The agent-skills plugin (v0.6.14) was confirmed for the previous agent runtime. Keep the existing `DECISIONS.md`, `PRD.md`, and `TASKS.md` as this project's source of truth; do not create generic duplicate spec or task files for the same work.
- No app code, tests, model requests, or deployment changed during this workflow check.

## 2026-10-30 — Phase 1.1 planning review

- The existing `DECISIONS.md`, `PRD.md`, `ARCHITECTURE.md`, `TASKS.md`, `TEST-PLAN.md`, and `SECURITY-PLAN.md` remain the project specification and task sources; no duplicate `SPEC.md` or standalone plan file is needed. The spec-driven checklist's only documentation gap is an explicit code-style section; the current source provides examples, so this does not block the shell build.
- Independent adversarial review found stale “no app code” status text and confirmed that `package.json` has a `vitest run` script without Vitest in `devDependencies`. The task board and status now reflect the existing shell, make dependency/lockfile setup precede the build-only slice, and keep Vitest/render-test work gated on an explicit test/verification request.
- No build or tests were run and no application code was changed during this planning pass.

## 2026-10-30 — Agent workflow moved to Claude Code

- Replaced the previous agent files (root agent instructions, start-here guide, reviewer role, and project skills folder) with `CLAUDE.md` and `.claude/`: project settings (permissions; `archive/` blocked; push/deploy require approval), the read-only `hackathon-red-team` subagent, and the `adversarial-hackathon-review` and `eli5` skills.
- Installed `agent-skills@addy-agent-skills` v0.6.14 at project scope; the marketplace is declared in `.claude/settings.json`. `/spec` maps to `docs/PRD.md` + `docs/DECISIONS.md`, `/plan` to `docs/TASKS.md`; no duplicate `SPEC.md` or `tasks/`.
- Moved the seven spec docs from `apps/goodfix-web/` to `apps/goodfix-web/docs/` and fixed links. Removed a duplicated threat-model row in `SECURITY-PLAN.md`.
- Process change approved by Talha: tests are now written test-first for risk-bearing logic (consent, stop gate, evidence numbering, parsers, deletion state) instead of only on explicit request.
- No app code, model requests, or deployments changed.
