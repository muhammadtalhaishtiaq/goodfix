# Showhow — Meta Global AI Developer Hackathon entry

Showhow (working title) turns a creator's narrated how-to video into a step-by-step guide that can check your work: Voice Transcribe → Muse Spark splits steps → SAM 3.1 outlines the key part. Learners follow along and, only when stuck, send one photo; Muse Spark compares it with the creator's step and SAM 3.1 outlines what differs on their photo. *"YouTube can't see you're stuck. This can."*

- **Code and docs:** `apps/showhow/` only. Specs in `apps/showhow/docs/`; HTML prototypes in `apps/showhow/design/` (`showhow-prototype.html` is the UI reference).
- **Archive:** `archive/` holds the retired Vault Expo/React Native app. Do not read or modify it (blocked in `.claude/settings.json`) unless Talha explicitly asks.
- **Deadline:** **2026-11-04 21:00 ET.** Submission = public repo + 3-minute demo video + live product; new work from 2026-10-27–2026-11-04 must be identifiable.

## Read before substantive work

1. `STATUS.md` — current state and blockers.
2. `apps/showhow/docs/DECISIONS.md` — dated decision ledger; it wins when docs disagree.
3. `apps/showhow/docs/PRD.md` — the spec (objective, flows, stack, structure, style, testing, boundaries, success criteria).
4. `apps/showhow/docs/ARCHITECTURE.md` — system map, data model, API routes, large-video handling, security.
5. `apps/showhow/docs/TASKS.md` — the plan: day-by-day tasks with Verify steps.
6. `apps/showhow/docs/HACKATHON-LOG.md` — dated evidence and reviews.

## Commands (run in `apps/showhow/`)

```bash
npm ci               # install from lockfile (npm install only when changing deps)
npm run dev          # Vite dev server (fixture mode)
npx vercel dev       # UI + /api locally (needs .env.local)
npm run build        # tsc -b && vite build
npm run lint         # oxlint
npm run typecheck    # tsc -b
npm test             # vitest run
```

## Workflow: spec-driven development (agent-skills plugin)

`/spec` → `/plan` → `/build` → `/test` → `/review` → `/ship`. This project's docs are the artifacts those commands expect — do **not** create `SPEC.md` or `tasks/`:

| Command | Artifact here |
|---|---|
| `/spec` | `docs/PRD.md` (+ a dated entry in `docs/DECISIONS.md`) |
| `/plan` | `docs/TASKS.md` |
| `/build` | one task from `docs/TASKS.md` per run — test first, verify, commit |
| `/test` | tests next to code (`*.test.ts`); strategy in PRD §8 |
| `/review` | agent-skills `code-review-and-quality` + the `adversarial-hackathon-review` skill |
| `/ship` | T13/T15 in `docs/TASKS.md`; needs Talha's explicit go-ahead |

At every substantive milestone, run the `adversarial-hackathon-review` skill (it launches the `hackathon-red-team` subagent) and log the result in `docs/HACKATHON-LOG.md`. Never claim a review that did not run.

## Product rules

- Guide instructions come from the creator's own narration. Muse Spark may split, order, and summarise — never add steps or advice the creator didn't give. Creators review before publishing.
- Draw only outlines SAM 3.1 actually returned, scaled from source-frame coordinates. No match → no outline, said plainly.
- A check verdict is `match`, `differs`, or `unclear`; it describes what is visible, never safety, medical, or electrical advice.
- Model, network, and cap failures show an honest message and a retry — never a fabricated result. Fixtures are labeled `TEST FIXTURE`.

## Privacy, keys, and Meta terms

- Every learner photo gets a payload preview (photo, reference frame, question, recipients) and a fresh approval before sending. Learner photos are never stored or logged.
- `META_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and access codes live only in Vercel env / `.env.local`. Never in `VITE_*`, client code, Git, logs, or screenshots.
- Fixed prompts, allowlisted models, no prompt passthrough. Guide creation requires an access code; daily caps and per-IP throttle protect credits. Public exposure needs a dated decision (Terms §10.1(i) question pending in Discord).
- 18+ only (Meta Terms). Standard models, never Contributor mode.

## Code style

- React 19 + TypeScript + Vite + plain CSS using the prototype's tokens. Hash routing; no UI framework.
- Named function components and exports; pure logic in `src/lib/` (no React); zod at every boundary.
- 2-space indent, no semicolons, single quotes — match `src/main.tsx`.

## Testing

- Test-first for logic that can mislead a user or burn credits: verdict gate, model-output parsers, step validation, geometry scaling, shrink sizing, caps, access code, consent reset.
- Synthetic media and fake keys in tests. Record manual end-to-end checks in `HACKATHON-LOG.md`. Never claim a run that didn't happen.

## Git and release

- Use absolute dates in docs, logs, and status.
- Commit per `/build` task. Ask before `git push`, deploys, repo visibility changes, publishing, or submitting.
- Before making the repo public, review the full Git history (it contains older Vault commits).
