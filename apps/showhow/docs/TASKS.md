# Showhow Plan and Tasks

**Updated:** 2026-11-02 · **Deadline:** 2026-11-04 21:00 ET (target submit ~15:00 ET; an unofficial listing says 20:00 EST, to verify on the official page)
Spec: [`PRD.md`](PRD.md) · Architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md) · Decisions: [`DECISIONS.md`](DECISIONS.md)

**Rules.** A task is `[x]` only when its **Verify** step has passed and is logged in `HACKATHON-LOG.md`. Each task is one `/build` run: test first where there's logic, then lint, typecheck, test and build, then commit. **Docs are updated in the same commit as the change** (PRD, ARCHITECTURE, TASKS, DECISIONS as relevant).

## Status at a glance

| Done ✅ | In progress 🔨 | Next ⏭ | Waiting on Talha 📥 |
|---|---|---|---|
| T1–T6, T8–T11, T16–T18 (local, live Meta + Supabase) · T13 deployed (2026-11-02) · T20 Ask · feedback F2–F10 · UI v2 mockup approved (2026-11-02) | T19 verify (1024/390 px, video guide + stuck dialog) · T14 (part done) | T14 on the live URL → T15 | Footage for T0/T0b/T12 (Talha creates on the live site) |

## Talha's inputs

- [x] Meta API key in `.env.local` (2026-10-30)
- [x] Supabase project + keys (2026-10-31); `VITE_SUPABASE_URL` still ends in `/rest/v1/` (code tolerates it; please trim)
- [x] Wit.ai token (2026-10-30)
- [ ] **Air purifier video** (1–3 min, narrated, landscape preferred): unlocks T0b and the first real guide
- [ ] **Staged photos** for 1–2 steps per video (2 right, 2 wrong, 1 blurry): unlocks T0
- [ ] Dishwasher + coffee machine videos (by Day 3)
- [ ] Optional: Discord #office-hours hosting question
- [x] Vercel account + project `goodfix` (2026-11-02)
- [ ] Videos: all three if possible; otherwise voice guides (audio only) cover the gaps

## Dependency graph

```mermaid
flowchart LR
  T4[T4 ✅] --> T8[T8 upload] --> T9[T9 steps] --> T10[T10 outlines] --> T11[T11 publish]
  T4 --> T5[T5 /api/check] --> T6[T6 dialog live]
  T0[T0 accuracy 📥] -.->|measures| T6
  T11 --> T12[T12 seed guides 📥]
  T6 --> T17[T17 voice guides] --> T18[T18 enhanced] --> T16[T16 read aloud] --> T13[T13 push + CI/CD deploy]
  T12 --> T14[T14 hardening + draft demo]
  T13 --> T14 --> T15[T15 submit]
```

## Done (2026-10-30 → 10-31)

- [x] **T1 Foundation.** Deps, lockfile, vitest, `.env.example`; lint/typecheck/test/build green.
- [x] **T2 Viewer + stuck dialog (fixture mode).** Gallery, guide viewer, stuck dialog with consent tests; 390/1366 px checked.
- [x] **T3 Database.** Schema applied via Management API; RLS 11/11 on the live DB; `kind`, `image_style`, `image_path`, `attempts` columns.
- [x] **T4 API skeleton + CI.** `route()` wrapper, caps (fail closed), dev `/api` bridge, bundle + history secret scans, CI workflow (first GitHub run on next push).
- [x] **T17(a) image-consistency spike** and the 6 style samples in `public/styles/` (logged 2026-10-31).

## Day 2: Sun 2026-11-01. Core loop, all local

- [x] **T8 Creator upload.** *(Server + upload path verified live 2026-11-01. The in-browser shrink of a real phone file is confirmed when Talha uploads the air purifier video, tracked in T0b.)* `/api/guides` (access code, `build` cap, consent + 18+, draft, signed URLs) → Create flow: form + consent → `canShrinkHere` → shrink with progress → direct uploads. **Verify:** `api/guides.test.ts` (401 without code, 400 without consent/adult, 429 on cap, signed URLs returned); a real phone file lands in Storage at ≤48 MB.
- [x] **T9 Steps.** *(Done 2026-11-01: 7 route tests; live run 28.6 s with Spark reading the Supabase URL. Real-video step quality is checked in T0b.)* `/api/steps`: status gate (`draft`/`failed`, `attempts < 3`) → download WAV → Transcribe → Spark (public `video_url` + turns) → `validateSteps` → save → `ready` → return signed upload URLs for `{idx}.jpg`; WAV deleted in `finally`. Create flow shows the steps. **Verify:** route test with mocked Meta/DB (valid; invalid output → `failed`; <2 turns; gate refuses a 4th run; WAV deleted on failure); one real video gives sensible steps; **Spark fetching the Supabase public URL confirmed and logged** (fallback: data URL ≤ ~20 MB or Files API).
- [x] **T10 Outlines.** *(Done 2026-11-01: 4 route tests + live pipeline run. Box accuracy on real footage is measured in T12.)* Browser captures midpoint keyframes → uploads via T9's URLs → `/api/outlines` → SAM (`sam_noun`) → `bestOutline` → save. **Verify:** boxes on the right parts for the first real guide; no-match steps show none.
- [x] **T11 Publish.** *(Done 2026-11-01: 3 route tests; live end to end in ~36 s; anon can read it only after publish; gallery and viewer read from Supabase.)* Review (rename steps/instructions) → `/api/publish` → share link; gallery + viewer read published guides from Supabase (fixtures only when no DB is configured). **Verify:** end-to-end creator run on desktop Chrome, timed and logged.
- [x] **T5 `/api/check`** *(Done 2026-11-01: 9 route tests; live calls returned schema-valid verdicts in 5–8 s. Accuracy is measured on real footage in T0.)* (built test-first now; not blocked on photos). Real keyframe vs learner photo (base64 data URL) → Spark verdict (`/v1/responses`) → SAM if `differs` → gate; `check` caps. **Verify:** unit tests (match, differs + box, ambiguous, unclear, malformed, timeout, cap hit).
## Day 3: Mon 2026-11-02. Real footage + learner check + voice guides

- [x] **T6 Stuck dialog live.** *(Built 2026-11-01: real `/api/check` via on-device resize, 18+ once per session, server messages shown; 2 new component tests. Phone/desktop run with staged photos pending T0.)* Photo resize ≤1600 px, real preview, `/api/check`, box on the learner's photo, error states, 18+ on first check. **Verify:** staged right/wrong/blurry photos on phone and desktop give the expected verdicts.
- [ ] **T0 Check accuracy** *(needs staged photos)*. `scripts/spike-check.ts`. **Verify:** right → match, wrong → differs with the box on the right part, blurry → unclear; accuracy + latency logged; only passing tasks appear in the demo.
- [ ] **T0b Real-video pipeline** *(needs the air purifier video)*. Browser shrink time on the real file + step quality. **Verify:** logged; PRD §11 updated.
- [ ] **T12 Seed guides** *(needs the 3 videos)*. Air purifier, dishwasher, coffee machine through the real pipeline. **Verify:** each checked by hand; outline accuracy (≥70% of steps) measured and logged.
- [x] **T17 Voice guides** *(Done 2026-11-01: 25 gate tests + 14 route tests; live: a harmful recording was blocked with nothing saved; a good recording built 3 steps and 6 illustrations. A real-voice run by Talha is pending.)*
  - [x] (b) `src/lib/safety.ts` blocked-topics list + Spark review schema, test-first (harmful, gibberish, incomplete, valid, invalid JSON → blocked).
  - [x] (c) `/api/voice-guides` (raw `audio/wav` body ≤2 min, gates, steps, draft only after passing) and `/api/voice-images` (base → per-step edit → highlight edit), both status-gated.
  - [x] (d) Create flow: "Talk it through", record/upload, consent, style picker (samples ready), blocked-reason screen, review + regenerate, publish.
  - [x] (e) Viewer: illustration + "Illustration by AI", "Show part" switches plain/highlighted, no "I'm stuck".
  - **Verify:** one real voice guide published end to end; a staged harmful and a gibberish recording are blocked with nothing in the DB or Storage.

## Day 4: Tue 2026-11-03. Extras + hardening, everything complete locally, then push + deploy

- [x] **T18 AI-enhanced step images** *(Done 2026-11-01: 4 route tests + JPEG-size tests; live on deliberately dark/blurred footage, 3/3 frames enhanced at the real 16:9 shape.)* `/api/enhance` (status-gated): keyframe → Muse Image edit → highlight edit → `{idx}-ai.jpg` / `-ai-focus.jpg`; the creator approves each at publish (rejected → `image_path` null). Viewer: "Enhanced by AI" + "View original frame". **Verify:** on a dim/blurry seed clip the enhanced image shows the same parts (by eye, logged); unit test that `/api/check` only reads `keyframe_path`.
- [x] **T16 Read aloud (Wit.ai)** *(Done 2026-11-01: generated inside `/api/publish` from the final text; 3 tests; live audio transcribed back and matched the edited instruction.)* Originally planned as `/api/tts` at publish → MP3 per step → "Read aloud" with pause/stop. **Verify:** plays on every step of a seed guide; no MP3 hides the button.
- [x] **T13 Push + deploy** *(Done 2026-11-02: live at https://goodfix-alpha.vercel.app. Vercel project `goodfix`, Root Directory `apps/showhow` (was `.`; the first two deploys built nothing), Node 22.x, Vite. Deploys come from **Vercel's Git integration** on push to `main`; the GitHub Actions deploy job has no `VERCEL_*` secrets and skips. Env: exactly `CREATE_ACCESS_CODES`, `IP_SALT`, `META_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`, `WIT_TOKEN`; production access codes are long random ones kept outside the repo. Live smoke logged 2026-11-02: health, security headers, fonts, gallery + a voice guide with real data, dev codes rejected, Ask 8.1 s / 8.6 s. **Not yet run live (carried into T14):** a create (video/voice), an I'm-stuck check, CSP during a real upload (shrink worker) and in a real browser (headless Chrome console on 5 pages was clean, 2026-11-02). Public-exposure decision still to write before sharing the URL widely.)*
  - Local production rehearsal first: `npm run build` + scans, and every flow run once against the real DB/Meta through the dev bridge.
  - `.github/workflows/deploy.yml`: after CI passes on `main`, deploy to Vercel with the Vercel CLI (pinned version; `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` as GitHub secrets, used only in this job; no secrets in PR runs). A manual `vercel deploy --prod` from local is the fallback.
  - Vercel env vars (server-only secrets incl. `IP_SALT`), `vercel.json` with `maxDuration` for long routes, access codes; Supabase keep-alive through 2026-11-09.
  - Write the dated public-exposure decision before sharing the URL.
  - **Verify:** CI green on GitHub; the deploy job succeeds; every flow (video guide, check, voice guide, enhanced, read aloud) works on the live URL; bundle scan clean.
- [ ] **T14 Hardening + draft demo** (on the live URL). *(Partly done 2026-11-02: env cleaned to the 7 vars; curl failure drill on production (all refusals honest, no model called); `/api/check` now counts its cap after the lookups; headless CSP clean on 5 pages. Still to do: drill items needing a real create (3-strike guard, too-little narration, SAM no-match), phone check with real data, keyboard/screen-reader pass, draft demo + red-team review.)* Every failure state in ARCHITECTURE §12, `scripts/cleanup-drafts.ts` (unpublished > 24 h), privacy note, accessibility pass (keyboard, focus, labels, contrast), phone check. Record a draft demo. **Verify:** failure drill logged; red-team review of the live build and draft video.

## Day 5: Wed 2026-11-04 (submit by ~15:00 ET; hard deadline 21:00 ET)

- [ ] **T15 Demo + submission** *(each public step needs Talha's go-ahead)*. Final 3-minute video per [`DEMO-SCRIPT.md`](DEMO-SCRIPT.md): problem → video guide from a phone clip → workbench → "I'm stuck" catches a mistake → voice guide with illustrations → Ask → safety gate → honest failure → vision. Deploy steps: [`DEPLOY.md`](DEPLOY.md). README listing work done 2026-10-27 → 11-04. Git history scan, repo public, submit, post on X. **Verify:** every demo claim matches the live build; submission confirmed.

## UI v2 + Ask (approved 2026-11-02; Day 3–4)

- [x] **UI v2 mockup approved** (2026-11-02, decision of that date): [`design/ui-v2-mockup.html`](../design/ui-v2-mockup.html) (commit 5cb1ba7) replaces `design/showhow-prototype.html` as the UI reference.
- [ ] **T19 UI restyle to the approved mockup** (F1, F11, F12, F13). *(Built and merged 2026-11-02; desktop checked against the mockup with real data on dev and production. Red-team fixes in: dialog focus trap + focus return, step title focused on step change, "AI circle" label on AI-painted images, "All steps" 44 px. Contrast computed from the tokens 2026-11-02: every text pair ≥4.5:1 (lowest `--signal-ink` on paper 4.66). **Still to verify:** 1024 and 390 px screenshots with real data, a published video guide + stuck dialog.)* Tokens and component rules from [`UI-AUDIT.md`](UI-AUDIT.md) option A + the mockup's T19-1…T19-10 list; accessibility defects first (`--ink-3` contrast, white-on-orange 3.44:1, touch targets <44 px, `<select>` font, link colour). Viewer becomes the 3-column workbench ≥1200 px (steps · frame + instruction + Prev/Next · help: read aloud, creator tip, I'm stuck, Ask); tablet = step strip + 2 columns; phone = 1 column + sticky Prev · n of N · Next bar + help sheet. Media keep their own aspect ratio (no letterbox, no crop; gallery thumbnails crop centred only). IBM Plex from Google Fonts (CSP already allows `fonts.googleapis.com` / `fonts.gstatic.com`). **Verify:** screenshots at 1440×900, 1024 and 390 px of gallery, a published video guide, a published voice guide, stuck dialog, Create and review; at 1440×900 the instruction, Prev/Next and help panel are visible without scrolling (F12/F13); no image cropped or letterboxed in viewer, review or verdict (F11); ←/→ change steps; contrast pairs ≥4.5:1 and touch targets ≥44 px; no CSP violations with the fonts in `vite preview` using `vercel.json` headers; red-team look at before/after. Only then mark F11–F13 fixed in `FEEDBACK.md`.
- [x] **T20 "Ask about this step"** (F13+). *(Done 2026-11-02, all Verify items logged. Changed after the red-team review: Spark returns only `{covered, stepRefs}` and the learner sees the cited steps' own instruction + tip from the DB, never model prose; the cap is counted after the lookups. Live: dev covered 7.7 s + uncovered 5.6 s; production covered 8.1 s and 8.6 s.)* `POST /api/ask {guideId, stepIdx, question ≤300}`, public, in this order: `blockedTopic(question)` → 422 (no cap counted, no model call) → published guide (video or voice) + step, else 404 → `enforceCaps('ask')` 400 total / 30 per IP, per-IP first → 429 → one Muse Spark call (45 s; fixed prompt, steps + question as delimited data, `{covered, stepRefs}`; error/timeout → 504, unusable output → 502) → `gateAnswer` (covered + valid refs → those steps' `instruction` + `tip_quote`, at most 2, labelled "The creator says · step N"; otherwise the fixed "The creator’s guide doesn’t cover that, so we can’t answer it here."). Nothing stored, no schema change. Help-panel UI: input, Ask, quotes, the fixed message, error + Retry, disclosure line; Privacy section "If you ask about a step". **Verify:** route tests (fake DB + mocked Spark) for each branch above, incl. a question with injected instructions staying data; live on the dishwasher guide one covered question (done 2026-11-02) and one uncovered question → fixed message, logged with latency.

## After Talha's testing
- [ ] Fixes from `FEEDBACK.md` items as they arrive (each updates the linked docs).

## Stretch (only if everything above is green)

- [ ] **T7 Where am I?** Learner photo + step keyframes → `{step, reason}` → jump to step. **Verify:** unit test for the parser; on one seed guide a mid-task photo returns the right step (logged).

## Cut order if behind

1. T7 Where am I?
2. T20 Ask (UI hidden, route not deployed)
3. T16 Read aloud
4. T18 AI-enhanced images
5. T17 voice guides (if the core loop isn't solid by end of Day 3)
6. Gallery search/filters
7. Step editing in review (publish as generated)
8. Third seed guide

**Never cut:** real model calls, consent screens, honest failure states, the "I'm stuck" check on video guides, a deployed live build.
