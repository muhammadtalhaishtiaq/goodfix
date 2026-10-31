# Showhow Plan and Tasks

**Updated:** 2026-10-31 · **Deadline:** 2026-11-04 21:00 ET (target submit ~15:00 ET)
Spec: [`PRD.md`](PRD.md) · Architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md) · Decisions: [`DECISIONS.md`](DECISIONS.md)

**Rules.** A task is `[x]` only when its **Verify** step has passed and is logged in `HACKATHON-LOG.md`. Each task is one `/build` run: test first where there's logic, then lint, typecheck, test and build, then commit. **Docs are updated in the same commit as the change** (PRD, ARCHITECTURE, TASKS, DECISIONS as relevant).

## Status at a glance

| Done ✅ | In progress 🔨 | Next ⏭ | Waiting on Talha 📥 |
|---|---|---|---|
| T1 foundation · T2 UI (fixtures) · T3 database + RLS · T4 API + CI · T17a image-consistency spike · live checks of all Meta APIs + Wit.ai | T8 upload | T9 steps → T10 outlines → T5/T6 check | Videos (air purifier first) · staged photos · Vercel account (Day 4) |

## Talha's inputs

- [x] Meta API key in `.env.local` (2026-10-30)
- [x] Supabase project + keys (2026-10-31); `VITE_SUPABASE_URL` still ends in `/rest/v1/` (code tolerates it; please trim)
- [x] Wit.ai token (2026-10-30)
- [ ] **Air purifier video** (1–3 min, narrated, landscape preferred): unlocks T0b and the first real guide
- [ ] **Staged photos** for 1–2 steps per video (2 right, 2 wrong, 1 blurry): unlocks T0
- [ ] Dishwasher + coffee machine videos (by Day 3)
- [ ] Optional: Discord #office-hours hosting question
- [ ] Vercel account (Day 4, for T13)

## Dependency graph

```mermaid
flowchart LR
  T4[T4 ✅] --> T8[T8 upload] --> T9[T9 steps] --> T10[T10 outlines] --> T11[T11 publish]
  T0[T0 accuracy 📥] --> T5[T5 /api/check] --> T6[T6 dialog live]
  T10 --> T5
  T11 --> T12[T12 seed guides 📥]
  T6 --> T12
  T12 --> T17[T17 voice guides] --> T18[T18 enhanced images] --> T16[T16 read aloud]
  T16 --> T13[T13 deploy] --> T14[T14 hardening + draft demo] --> T15[T15 submit]
  T7[T7 Where am I?] -.->|only if time| T13
```

## Day 1: Sat 2026-10-31

- [x] **T1 Foundation.** Deps, lockfile, vitest, `.env.example`; lint/typecheck/test/build green.
- [x] **T2 Viewer + stuck dialog (fixture mode).** Gallery, guide viewer, stuck dialog with consent tests; 390/1366 px checked.
- [x] **T3 Database.** Schema applied via Management API; RLS 11/11 on the live DB; `kind`, `image_style`, `image_path` columns added. *(Reading published guides into the viewer lands with T11.)*
- [x] **T4 API skeleton + CI.** `route()` wrapper, caps (fail closed), dev `/api` bridge, bundle + history secret scans, CI workflow. First GitHub run happens on the next push.
- [ ] **T8 Creator upload.** `/api/guides` (access code, caps, consent + 18+, draft, signed URLs) → Create flow: form + consent → `canShrinkHere` → shrink with progress → direct uploads. **Verify:** route tests (401 without code, 400 without consent, signed URLs returned); a real phone file lands in Storage at ≤48 MB.
- [ ] **T9 Steps.** `/api/steps`: download WAV → Transcribe → Spark (public `video_url` + turns) → `validateSteps` → save → delete WAV → `ready`; Create flow shows the steps. **Verify:** route test with mocked Meta/DB (valid, invalid output → `failed`, <2 turns); one real video gives sensible steps; Spark fetching the Supabase URL confirmed.

## Day 2: Sun 2026-11-01

- [ ] **T0 Check accuracy** *(needs staged photos)*. `scripts/spike-check.ts` on the staged set. **Verify:** right → match, wrong → differs with the box on the right part, blurry → unclear; accuracy and latency logged; only passing tasks are used in the demo.
- [ ] **T0b Real-video pipeline** *(needs the air purifier video)*. Browser shrink time on the real file + step quality. **Verify:** logged; PRD §11 updated.
- [ ] **T10 Outlines.** Keyframes at step midpoints uploaded → `/api/outlines` → SAM with `sam_noun` → `bestOutline` → save. **Verify:** boxes on the right parts for the first real guide; no-match steps show none.
- [ ] **T11 Publish.** Review screen (rename steps/instructions) → `/api/publish` → share link; gallery and viewer read published guides from Supabase (fixtures only when no DB is configured). **Verify:** end-to-end creator run on desktop Chrome, timed and logged.
- [ ] **T5 `/api/check`.** Real keyframe vs learner photo → Spark verdict → SAM if `differs` → gate; caps. **Verify:** unit tests (match, differs + box, ambiguous, unclear, malformed, timeout, cap hit); one live call logged.
- [ ] **T6 Stuck dialog live.** Photo resize ≤1600 px, real preview, `/api/check`, box on the learner's photo, error states, 18+ on first check. **Verify:** staged right/wrong/blurry photos on phone and desktop give the expected verdicts.

## Day 3: Mon 2026-11-02

- [ ] **T12 Seed guides** *(needs the 3 videos)*. Build air purifier, dishwasher and coffee machine guides through the real pipeline. **Verify:** each checked by hand; outline accuracy (≥70% of steps) measured and logged.
- [ ] **T17 Voice guides.**
  - [x] (a) Image-consistency spike: one base image + one edit per step keeps the object identical; a highlight edit circles the key part.
  - [ ] (b) `src/lib/safety.ts` blocked-topics list + Spark review schema, test-first (harmful, gibberish, incomplete, valid, invalid JSON → blocked).
  - [ ] (c) `/api/voice-guides` (WAV ≤2 min inline, gates, steps, draft only after passing) and `/api/voice-images` (base → per-step edit → highlight edit).
  - [ ] (d) Create flow: "Talk it through" option, record/upload, consent, style picker (6 samples in `public/styles/`), blocked-reason screen, review + regenerate, publish.
  - [ ] (e) Viewer: illustration + "Illustration by AI", "Show part" switches plain/highlighted, no "I'm stuck".
  - **Verify:** one real voice guide published end to end; a staged harmful and a gibberish recording are blocked with nothing in the DB or Storage.

## Day 4: Tue 2026-11-03

- [ ] **T18 AI-enhanced step images (video guides, optional checkbox).** `/api/enhance`: keyframe → Muse Image edit (same scene, clearer) → highlight edit → `{idx}-ai.jpg` / `{idx}-ai-focus.jpg`. Viewer: "Enhanced by AI" + "View original frame". **Verify:** on a dim/blurry seed clip the enhanced image shows the same parts (by eye, logged); unit test that `/api/check` only reads `keyframe_path`.
- [ ] **T16 Read aloud (Wit.ai).** `/api/tts` at publish → MP3 per step → "Read aloud" with pause/stop. **Verify:** plays on every step of a seed guide; no MP3 hides the button.
- [ ] **T13 Deploy** *(needs Talha's OK + Vercel account)*. Vercel project (root `apps/showhow`), env vars, `vercel.json` `maxDuration`, access codes, Supabase keep-alive through 2026-11-09. **Verify:** T6 and T11 checks pass on the live URL; bundle scan clean; CI green on GitHub.
- [ ] **T14 Hardening + draft demo.** Every failure state in ARCHITECTURE §12, privacy note, accessibility pass (keyboard, focus, labels, contrast), phone check. Record a draft demo. **Verify:** failure drill logged; red-team review of the live build and draft video.

## Day 5: Wed 2026-11-04 (submit by ~15:00 ET; hard deadline 21:00 ET)

- [ ] **T15 Demo + submission** *(each public step needs Talha's go-ahead)*. Final 3-minute video: problem → video guide built from a phone clip → "I'm stuck" catches a mistake → voice guide with illustrations → vision (Ray-Ban Meta live help). README listing work done 2026-10-27 → 11-04. Git history scan, repo public, submit, post on X. **Verify:** every demo claim matches the live build; submission confirmed.

## Stretch (only if everything above is green)

- [ ] **T7 Where am I?** Learner photo + step keyframes → `{step, reason}` → jump to step.

## Cut order if behind

1. T7 Where am I?
2. T16 Read aloud
3. T18 AI-enhanced images
4. T17 voice guides (if the core loop isn't solid by end of Day 3)
5. Gallery search/filters
6. Step editing in review (publish as generated)
7. Third seed guide

**Never cut:** real model calls, consent screens, honest failure states, the "I'm stuck" check on video guides, a deployed live build.
