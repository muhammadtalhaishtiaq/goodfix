# Goodfix — Meta Global AI Developer Hackathon entry

Goodfix (working title) is a responsive web app that guides an adult through one small, visible household fix: show a clip → Muse Spark observes and asks one question → SAM 3.1 geometry is drawn on the user's own frame → one bounded step → a numbered follow-up clip verifies what happened.

- **Code and docs:** `apps/goodfix-web/` only. Specs live in `apps/goodfix-web/docs/`; HTML prototypes in `apps/goodfix-web/design/`.
- **Archive:** `archive/` holds the retired Vault Expo/React Native app. Do not read or modify it (blocked in `.claude/settings.json`) unless Talha explicitly asks.
- **Deadline:** **2026-11-04 21:00 ET.** Submission = public repo + 3-minute demo video; new work from 2026-10-27–2026-11-04 must be identifiable.

## Read before substantive work

1. `STATUS.md` — current state and blockers.
2. `apps/goodfix-web/docs/DECISIONS.md` — dated decision ledger; it wins when docs disagree.
3. `apps/goodfix-web/docs/PRD.md` — the spec (scope, flow, success criteria).
4. `apps/goodfix-web/docs/ARCHITECTURE.md` — stack, data flow, consent, Meta boundary.
5. `apps/goodfix-web/docs/TASKS.md` — the plan: phases, tasks, gates.
6. `apps/goodfix-web/docs/TEST-PLAN.md`, `SECURITY-PLAN.md`, `HACKATHON-LOG.md` as relevant.

## Commands (run in `apps/goodfix-web/`)

```bash
npm ci               # install from lockfile (npm install only when changing deps)
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run lint         # oxlint
npm run typecheck    # tsc -b
npm test             # vitest run
```

## Workflow: spec-driven development (agent-skills plugin)

`/spec` → `/plan` → `/build` → `/test` → `/review` → `/ship`. This project's existing docs are the artifacts those commands expect — do **not** create a duplicate `SPEC.md` or `tasks/`:

| Command | Artifact here |
|---|---|
| `/spec` | `docs/PRD.md` (+ a dated entry in `docs/DECISIONS.md`) |
| `/plan` | `docs/TASKS.md` |
| `/build` | `src/` — one task per run, test first, commit per task |
| `/test` | tests next to code; layers per `docs/TEST-PLAN.md` |
| `/review` | agent-skills `code-review-and-quality` + the `adversarial-hackathon-review` skill |
| `/ship` | Phase 7 in `docs/TASKS.md`; needs Talha's explicit go-ahead |

At every substantive milestone, run the `adversarial-hackathon-review` skill (it launches the `hackathon-red-team` subagent) and log the result in `docs/HACKATHON-LOG.md`. Never claim a review that did not run.

## Product boundaries

- Supported task: one staged, visibly loose cupboard handle with an accessible screw. Broadening scope needs a new dated decision.
- Muse Spark proposes observations/questions/steps; SAM 3.1 locates/tracks objects. Neither diagnoses a fault or decides safety — deterministic scope and stop rules do.
- Show frames from the user's own evidence with actual parsed SAM geometry. Never present generated images, fixtures, or mock masks as observed evidence.
- Request failure, unclear image, zero SAM matches, unknown part, or a safety trigger (electrical, gas, fire, structural, plumbing, food, vehicle, medical, damaged screw/wood, strong resistance) → stop or ask for a clearer view; never invent instructions.
- Every upload is a numbered evidence item (Clip 01, Photo 02…); nothing replaces earlier evidence; every response names the item it used.

## Privacy, keys, and Meta terms

- No network request with user media until the exact media, text, model, purpose, and every recipient are previewed and the user approves *that* request. Prior approval never covers a follow-up.
- Never put a Meta API key in browser code, `VITE_*` variables, source maps, Git, logs, or screenshots. Keys live server-side only.
- A public no-login server route stays blocked until Meta confirms the architecture in writing (see `docs/DECISIONS.md`).
- Meta API Terms: end users 18+; use Standard models for home footage, never Contributor mode.
- Meta Files API uploads don't expire — track `file_id`s and delete them on case close; never claim deletion before confirmation.
- No analytics, hidden uploads, or background access. Not a therapy/medical/diagnostic product.

## Code style

- React 19 + TypeScript + Vite + plain responsive CSS. No UI framework, no native wrapper.
- Named function components; small modules; types next to use. Follow the existing `src/App.tsx` patterns.
- Model output is untrusted: parse into strict schemas, render as text, never as HTML.
- Fixture content is visibly labeled `TEST FIXTURE` in UI and filenames.

## Testing

- Write tests for logic that can hurt users or the demo: consent binding, stop/scope gate, evidence numbering, model-output parsing, SAM geometry validation, file-deletion state.
- Tests use synthetic media and fake keys only. Report real results — never claim a run that didn't happen.

## Git and release

- Use absolute dates in docs, logs, and status.
- Commits are fine per `/build` task. Ask before `git push`, deploys, repo visibility changes, publishing, or submitting the entry.
- Before making the repo public, review the full Git history (it contains older Vault commits).
