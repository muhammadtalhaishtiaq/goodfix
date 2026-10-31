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

## 2026-10-30 — Participant guide re-checked

Source: Cerebral Valley participant guide (text supplied by Talha from the signed-in page, 2026-10-30); event overview page and dev.meta.ai event page fetched the same day.

- Rubric confirmed (Stage Two, 0–10 each): Impact 30%, Use of Meta AI Tooling 25% ("go beyond a basic integration… surface capabilities that surprised even us"), Technical Depth & Execution 20%, Demo 25% ("Does the product hold up live? Is the demo video genuinely cool to watch?"). Stage One is pass/fail on theme fit and reasonable Meta model use. Top 5 per track go to a live final on 2026-11-09.
- Judges use the 3-minute video, the code, **and the live product**. This weakens a local-only demo plan; a judge-accessible hosted build likely matters for the Demo score.
- Anti-projects list includes "Simple Image Analyzers" and AI medical advice. Goodfix must read as a closed-loop guided task, not an image analyzer.
- Rules: public repo; solo allowed (max team 4); only work built 2026-10-27–2026-11-04 may be demoed, clearly identified, or disqualification is possible.
- Models available: Muse Spark series, Muse Wonder, Muse Image, Muse Voice Transcribe, SAM 3.1 (Model API); Muse Glimmer and Muse Spark Open (open weights); Muse Code.
- Credits: $150 Meta Model API credits per participant, claimed via form by 2026-11-04 21:00 ET; requires a card on the account; set a spend limit.
- Bonus prizes relevant to us: Best Agentic Use-Case ($5K), Most Viral on X ($20K, engagement until 2026-11-08), Community Vote ($10K).
- Discord #office-hours (Meta team) runs weekdays 10–11 AM ET; next sessions are 2026-11-02 and 2026-11-03. Use it to ask about the hosted-route terms question.

## 2026-10-30 — Red-team review of idea directions

Reviewed (independent subagent following `.claude/agents/hackathon-red-team.md`; it checked dev.meta.ai docs and Terms): A = single cupboard handle status quo; B = multi-playbook fastener coach + hands-free voice + before/after verification; C = B framed as a verifiable agent.

- Estimated weighted score: A 5.0, B as written 5.9 (low confidence it can be finished solo), **B-cut + C framing 7.0** (recommended).
- Key finding 1: browser recordings (WebM) and iPhone clips (HEVC MOV) are likely rejected; docs list MP4 for Spark video and SAM rejects WebM/VP9. Server-side ffmpeg transcode to H.264 MP4 and day-1 tests with real phone files.
- Key finding 2: SAM 3.1 accepts point prompts and tracks bidirectionally, up to 16 objects per request; one video per request, so before/after comparison is app code across two requests. A text prompt for a small screw may miss; tap-to-track is safer.
- Key finding 3: "hands-free" voice conflicts with per-request media consent, and the realtime WebSocket has no documented ephemeral token. If kept, use push-to-talk via the file endpoint with a one-tap send preview; first to cut.
- Proposed signature moment: deterministic before/after "wobble" measure from SAM geometry (handle box motion relative to door box), explained by Spark, with the gate refusing to claim "fixed" on ambiguous evidence; plus a visible agent trace panel (plan → ask → SAM tool → gate → verify).
- Scope cuts proposed: chair/table legs and door hinges (load-bearing/injury risk), in-browser recording, IndexedDB, Muse Image.
- Hosting: a judge-access-code build with fixed prompts, allowlisted models, server-only key, per-code rate limit, server-side spend cap, and an 18+ check is likely an Integrated Product rather than a gateway under Terms §10.1(i) (medium confidence; carve-out text paraphrased, not quoted). Build privately now; ask Meta in Discord #office-hours; record a new dated decision before exposing it.
- Unknowns: Spark video size/duration limits, multi-video input, function calling, whether SAM accepts data URLs, console spend-limit control.
- Status: recommendation only; awaiting Talha's direction decision before any DECISIONS entry.

## 2026-10-30 — T1 foundation done

- Installed react 19.3, zod 4.6, mediabunny 1.65, @supabase/supabase-js 2.118; dev: vitest 5.0, @testing-library/react 16.3, user-event 14.6, jsdom 30.1. `package-lock.json` committed. npm left the optional `fsevents` install script unapproved (macOS file watcher only).
- Added `.env.example` (placeholders; server keys documented as never `VITE_*`), jsdom test env, and a render test written first (failed, then passed).
- Verified on Node 22.22.3 / npm 11.17.0: `npm ci` clean (0 vulnerabilities), `npm run lint`, `npm run typecheck`, `npm test` (1/1), `npm run build` (221 kB JS, 69 kB gzip) all green.

## 2026-10-30 — Red-team review of Showhow spec and plan

Reviewed: PRD, ARCHITECTURE, TASKS, DECISIONS (independent `hackathon-red-team` subagent; checked dev.meta.ai docs, Vercel limits, Supabase pricing, Mediabunny codec docs).

- Spec errors found and fixed: SAM returns box + base85 mask (no polygons); Voice Transcribe needs `ENDPOINTING` for turns (per-turn timestamps only; 32 MB / 10 min); Spark video should go by `video_url` (inline 50 MB cap, base64 inflation); "four models" was wrong (three).
- Design changes: step times from Transcribe turns, Spark returns turn indices; `sam_noun` + `include_confidence` with an ambiguity rule; creator consent screen; input cap 500 MB / 3 min; runtime `canEncode` check; no food seeds.
- Confirmed from docs (per reviewer): Spark accepts up to 50 images and schema-constrained JSON; SAM accepts base64 data URLs; 3,000 RPM; Vercel Hobby 300 s / 4.5 MB body; Supabase free 50 MB/file, 1 GB, 5 GB egress, pauses after 1 week idle.
- Plan reordered: day 1 is the check-accuracy spike on staged photos (highest-risk assumption), then the pipeline spike; Where am I? moved to stretch; draft demo on day 4; submit ~15:00 ET.
- Still unknown: Spark video duration/size limits, SAM mask mapping, a Meta spend-limit control.

## 2026-10-30 — T2 viewer + stuck dialog (fixture mode) done

- Ported the prototype's design tokens and layout to React: gallery (search, categories), guide viewer (step list, single-video segment loop, SAM box overlay, full-video timeline, instruction, creator tip, done/next), stuck dialog (choose → payload preview → working → verdict / error), and a create page that says plainly it isn't connected yet.
- Fixture guides show a visible `TEST FIXTURE` tag and a "no video yet" placeholder; the fixture check returns a labelled non-result. No network calls exist yet.
- Tests (8/8): geometry validation, render test, and stuck-dialog consent tests (nothing sent before Send; a new photo needs a new approval; an unclear verdict draws no outline). Lint, typecheck and build green.
- Manual check: headless Chrome screenshots of the production build at 1366 px and 500 px (Chrome's minimum headless width) show the layout intact with no horizontal overflow.

## 2026-10-30 — T0 smoke test against the live Meta API (synthetic media only)

- Talha added the Meta key to `apps/showhow/.env.local` (git-ignored; the committed `.env.example` was restored to placeholders after a rename; nothing secret was committed).
- Added `src/lib/sam.ts` (SAM box parser + `bestOutline` ambiguity rule, 7 tests) and `src/lib/verdict.ts` (fixed prompt, zod schema exported as JSON Schema, parse + gate, 7 tests); 22 tests total green.
- `scripts/spike-check.ts` run on an ffmpeg test card: Muse Spark (`muse-spark-1.3`, chat completions, 2 base64 images, `json_schema`) gave right → match, upside-down → differs, blurred → unclear (3/3), 4.9–9.5 s each. SAM 3.1 returned zero boxes for "test card" (the card fills the frame), ~1 s.
- SAM probe on a built-in macOS photo (Parrot.heic → JPEG ≤1600 px, prompt "parrot"): HTTP 200, one box `x1=0;y1=176;x2=1362;y2=1599;w=1600;h=1600;c=0.973`, text at `output[0].content[0].text`. Matches our parser.
- Finding: Meta responses default to `"store": true`. All requests now send `store: false`, which is accepted with unchanged results; ARCHITECTURE §5 updated.
- Next: Talha's staged photo set for the real accuracy run; T0b pipeline spike.

## 2026-10-30 — T0b pipeline spike on live APIs (synthetic narrated video)

- Added `src/lib/shrink.ts` (Mediabunny on-device shrink + WAV, `planShrink`/`boxFor` tested) and `src/lib/steps.ts` (steps schema, prompt, `validateSteps`: turn indices → Transcribe timestamps; overlap/range checks; tips kept only if they are a real quote). 29 tests green.
- `scripts/spike-pipeline.ts` on a 34 s 1080p test-card video narrated by macOS `say` (no personal media). ffmpeg stood in for the browser shrink here (3.5 s, 0.9 MB → 4.2 MB MP4 + 1.0 MB WAV).
- Voice Transcribe (`muse-voice-transcribe-1.0`, multipart, `ENDPOINTING`): 7 turns with accurate start/end ms, 5.5 s.
- Muse Spark (`/v1/responses`, `input_video` as a base64 data URL, `text.format` json_schema, `store:false`): 4 valid steps in 15.6 s. It skipped the greeting and sign-off; titles were sensible; the tip quote passed the grounding check.
- Not yet done for T0b: in-browser Mediabunny timing on a real ≥100 MB phone clip, and Spark by public `video_url` (needs Supabase).
- Model list checked (dev.meta.ai/docs/models): Meta offers no text-to-speech model.

## 2026-10-30 — Wit.ai text-to-speech checked; Live Video API and video generation ruled out

- Talha created a Wit.ai app; `WIT_TOKEN` is in `.env.local`. `GET /voices` → 200: en_US 23, en_CA 2, en_GB 5 voices (e.g. Rebecca, Charlie, Cooper, Remi). `POST /synthesize?v=20240304` (`voice: Rebecca`, `Accept: audio/mpeg`) → 200, 51 KB MP3 for one step sentence in 3.1 s; played locally.
- Planned as stretch T16 "Read step aloud": synthesized once at publish and cached in Storage. Wit.ai is Meta-owned but not one of the hackathon's listed Model API models, so present it as an add-on.
- Facebook Live Video API (developers.facebook.com/documentation/live-video-api): one-way RTMPS broadcast to a profile/Page; needs Facebook Login + `publish_video`, an account ≥60 days old with ≥100 followers; no AI and no way to receive a user's camera. Not used; at most a vision-slide idea (go live → guide).
- Video generation: the Meta Model API has none (Muse Image = stills; the video-understanding page is input-only). Not used; seed guides will be real filmed videos.

## 2026-10-31 — T3 database live: schema applied, RLS verified

- Supabase project `tbruclocjvvlxvwdbqnu` (free tier). Keys are the legacy anon/service_role JWTs, both confirmed to belong to this project. `.env.local` `VITE_SUPABASE_URL` still had a mistyped ref (NXDOMAIN); Talha to correct it. The checks below passed the correct URL as an env override.
- `scripts/apply-schema.ts` applied `supabase/schema.sql` via the Management API (`POST /v1/projects/{ref}/database/query`) with a personal access token in `.env.local`. Tables `guides`, `steps`, `usage`; RLS on all three; `bump_usage()` (server only); public bucket `media` (50 MB, mp4/wav/jpeg/mpeg).
- `scripts/check-db.ts`: 11/11 PASS. Anon can't see draft guides/steps, insert, read usage, call `bump_usage`, upload, or edit; anon sees a guide and its steps once published; the server can bump usage and create signed upload URLs. Temp guide and counters removed.
- Remaining for T3: the viewer reading published guides from Supabase (lands with the first real guide from the pipeline).
