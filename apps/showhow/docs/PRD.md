# Spec: Showhow

**Working title:** Showhow (brand open) · **Status:** approved direction 2026-10-30 (see `DECISIONS.md`)
**Event:** Meta Global AI Developer Hackathon, Indie track, theme "Build for Your World"
**Deadline:** 2026-11-04 21:00 ET · **Code:** `apps/showhow/` · **Prototype:** [`design/showhow-prototype.html`](../design/showhow-prototype.html)

## 1. Objective

**One line:** step-by-step guides made from real people's know-how, filmed or just spoken, that can check your work. *"YouTube can't see you're stuck. This can."*

**Problem.** Know-how lives in people's hands. Tutorials are one-way: you pause and rewind, you can't tell which "small screw" they mean, and nobody tells you when you got a step wrong.

**Users.**
- **Creator:** films themselves doing a task once, talking as they go (a technician, a parent, a maker, a brand).
- **Voice creator:** has the know-how but no video. They talk the fix through (≤2 min) and get an illustrated guide (a grandparent, a technician on a call).
- **Learner:** follows the guide on a phone or laptop. Usually just watches; occasionally gets stuck.

**Core stories.**
1. As a learner I browse a gallery, open a guide, and follow one step at a time. Each step is a short looping clip of the creator's video, with the key part outlined.
2. As a learner stuck on a step, I send **one photo** of my work and get a verdict ("matches", "this part differs", or "photo unclear"), with the differing part outlined **on my photo**.
3. As a learner who lost track, I tap **Where am I?**, send a photo, and get told which step I'm on.
4. As a creator I upload a video (up to 500 MB / 3 min; desktop Chrome or Edge is the supported path for the demo). It becomes an editable step-by-step guide: steps, timestamps, instructions in my own words, key parts outlined. I review, publish, and get a share link.
5. As a voice creator I record or upload ≤2 min of audio and pick an illustration style from sample previews. The recording is checked against the safety and quality gate **before anything is saved**. If it passes, it becomes steps in my words, each with an AI illustration labelled as one. If it fails, I'm told why (unsafe topic, not a how-to, or missing steps) and nothing is kept.

**How each Meta model is used (each has a distinct role):**

| Model | Role |
|---|---|
| Muse Voice Transcribe | Creator narration → transcript turns with timestamps (these set step start/end); voice-guide recordings → text |
| Muse Spark | Video + transcript → step boundaries, titles, key part names; learner photo vs creator keyframe → structured verdict; photo → which step; voice transcript → safety/quality review, category, steps |
| SAM 3.1 | Outlines the named key part on each step keyframe and the differing part on the learner's photo |
| Muse Image | Voice guides only: one illustration per step in the creator's chosen style, always labelled "Illustration by AI" |

Add-on (Meta-owned, not a hackathon Model API model): Wit.ai text-to-speech for "Read step aloud" (stretch T16).

## 2. Scope

**In (demo build):**
- Gallery: browse, search, category filter, guide cards. Seeded with 3–4 real guides we film and build **through our own pipeline**.
- Guide viewer: step list, looping step segment of the creator video (one video file, start/end times), "Show part" outline, full-video segment bar, instruction, creator tip quote, done/next.
- **I'm stuck** check: photo → payload preview and consent → verdict + outline. Fresh consent per photo.
- **Voice guides** (T17, after the core loop): record/upload ≤2 min audio → two-layer safety and quality gate → steps → Muse Image illustrations in one of 6 styles (realistic photo, line art, flat colour, blueprint, watercolour, 3D clay) with stored sample previews → review → publish. The "I'm stuck" photo check is **off** for voice guides (no real reference frame).
- **Where am I?** check (stretch; cut first).
- Creator flow: access code → **creator consent screen** (names Supabase public hosting and the three Meta models) → upload → in-browser shrink → processing stages → review (light edits) → publish → share link.
- Honest states everywhere: processing, failure, unclear photo, no outline found, rate limited.

**Out:** accounts and logins, comments, ratings, public uploads without a code, mobile app, live/real-time video, AI images as evidence, voice questions, learner video uploads (photos only), translation, automatic moderation.

## 3. Key flows

**Learner check** (`POST /api/check`)
1. Browser resizes the photo to ≤1600 px JPEG and shows the payload preview (photo, reference frame, question, recipients). Nothing is sent before the user taps Send.
2. Server: Muse Spark gets the learner photo, the creator's keyframe, the step text and the optional question, and returns schema-constrained JSON `{status: "match"|"differs"|"unclear", differences:[{part, sam_noun, note}], message}`. `sam_noun` is a short noun with no spatial words, as SAM expects.
3. If `differs`: SAM 3.1 runs on the learner photo with `differences[0].sam_noun` and `include_confidence`, returning boxes plus masks in source pixels.
4. Gate: zero matches, or several matches with no clear winner, or invalid geometry → show the verdict text with "couldn't pinpoint it on your photo", never a guessed outline. The demo draws the **box**; the mask is used only once its mapping to the frame has been verified. `unclear` → ask for a closer, better-lit photo. The photo is not stored.

**Creator build** (client-driven, so each server call stays short)
1. Browser checks the file (video, ≤500 MB, ≤3 min) and checks encoder support at runtime (`canEncode`, not a browser-name guess). It then shrinks the video with Mediabunny/WebCodecs to H.264 720p MP4 at ~1 Mbps (~23 MB for 3 min, hard cap 48 MB) and extracts a 16 kHz mono WAV.
2. `POST /api/guides` (access code required) creates a draft and returns signed upload URLs. The browser uploads the MP4 and WAV straight to Supabase Storage.
3. `POST /api/guides/:id/steps`: Voice Transcribe on the WAV in `ENDPOINTING` mode, which returns `turns[]` with start/end ms. Muse Spark gets the video (by its Supabase URL as `video_url`) plus the numbered turns and returns `steps[{title, first_turn, last_turn, instruction, tip_quote, key_part, sam_noun}]`. **Step times come from Transcribe turn timestamps, not from Spark.** Validated: turn indices in range, ordered, non-overlapping, 2–8 steps.
4. The browser grabs a JPEG keyframe per step (step midpoint) from its local copy and uploads it. `POST /api/guides/:id/outlines` runs SAM 3.1 per keyframe with `sam_noun` and stores the best box (or null when there are zero or ambiguous matches).
5. The creator edits titles and instructions, then `POST /api/guides/:id/publish`.

**Voice guide build** (`POST /api/voice-guides`, access code required; nothing stored until the gate passes)
1. Browser records (MediaRecorder) or takes an audio file, converts it to a 16 kHz mono WAV (≤2 min, ≈3.8 MB, so it fits one request under Vercel's 4.5 MB body limit) and shows the consent screen (Showhow server, Voice Transcribe, Muse Spark, Muse Image; published guides are public).
2. Server, in memory: Voice Transcribe → transcript.
3. **Gate layer 1, hard rules (code):** a blocked-topics list (weapons, violence or harming people/animals, self-harm, drugs, gas work, mains electrical work, fire/explosives, medical procedures, vehicle brakes/steering, hacking, illegal activity) checked on the transcript. Any hit → blocked.
4. **Gate layer 2, Muse Spark review** (schema): `{is_howto, complete, safety: "ok"|"blocked", category, missing[], reason}`. Not a how-to, incomplete, blocked, invalid output, error or timeout → **blocked (fail closed)**, with a plain reason and any missing steps listed. The creator can re-record.
5. Passed → Muse Spark steps from the transcript turns (same `validateSteps` grounding as video) → the guide and steps are saved as a draft.
6. Muse Image: one **base image** of the object in the chosen style, then every step is an **edit of that base image** (`/v1/images/edits`, base image as reference), which keeps the object identical across steps (verified 2026-10-31). A second edit per step adds an orange dashed highlight circle around the key part. Both versions are stored (`{guide}/{idx}.jpg`, `{idx}-focus.jpg`) and "Show part" switches between them.
7. The creator reviews (regenerate one image, edit text) → publish. The badge reads "AI-checked: clear, complete and within safety rules", never "verified fix".

**Grounding rule:** instructions and tips come from the creator's transcript. Spark may summarise and order them; it must not add steps or advice the creator didn't give. The creator reviews everything before publishing.

## 4. Tech stack

- **Web:** React 19 + TypeScript + Vite 8, plain CSS ported from the prototype tokens. Hash routing is enough for a three-view app (no router dependency).
- **Video in the browser:** Mediabunny (WebCodecs) for shrinking and WAV extraction; `<video>` + canvas for keyframes.
- **API:** Vercel serverless functions in `apps/showhow/api/` (Node, TypeScript). The Meta key lives only here.
- **Data:** Supabase free tier. Postgres for `guides`, `steps`, `usage`; one public-read Storage bucket `media`. Writes happen only from the server with the service role key.
- **Validation:** zod schemas for every model response and API body.
- **Hosting:** Vercel Hobby (web + API) + Supabase free. Cost: $0 apart from Meta usage, which the $150 credits cover.

## 5. Commands (in `apps/showhow/`)

```bash
npm ci                 # install from lockfile
npm run dev            # vite dev server (UI, fixture mode)
npx vercel dev         # UI + /api locally (needs .env.local)
npm run build          # tsc -b && vite build
npm run lint           # oxlint
npm run typecheck      # tsc -b --pretty false
npm test               # vitest run
```

## 6. Project structure

```
apps/showhow/
  api/                 serverless routes (check, guides, steps, outlines, publish)
  src/
    app/               routing + top-level views (Gallery, Guide, Create)
    components/        UI pieces (StepCard, StuckDialog, OutlineOverlay…)
    lib/               pure logic: schemas, verdict gate, geometry, step validation, video shrink
    fixtures/          TEST FIXTURE data for offline UI work and tests
  supabase/schema.sql  tables, RLS, buckets
  docs/                PRD (this), ARCHITECTURE, TASKS, DECISIONS, HACKATHON-LOG
  design/              HTML prototypes
```

## 7. Code style

```ts
// src/lib/verdict.ts: pure, typed, validated at the boundary (excerpt of the real file)
export function parseVerdict(text: string): ModelVerdict | null {
  try {
    const r = VerdictSchema.safeParse(JSON.parse(text))
    return r.success ? r.data : null
  } catch {
    return null
  }
}

// What the learner may be shown: an outline only for differs, and only one SAM actually returned.
export function gateVerdict(verdict: ModelVerdict, outline: Outline | null) {
  return { verdict, outline: verdict.status === 'differs' ? outline : null }
}
```

- Named function components and named exports. Small modules; pure logic in `src/lib/` with no React.
- Model output is untrusted: parse with zod, render as text, never as HTML.
- Fixture content is labelled `TEST FIXTURE` in the UI and filenames.
- Match existing formatting: 2 spaces, no semicolons, single quotes in TS, as in `src/App.tsx`.

## 8. Testing strategy

- **Vitest unit tests** (`src/lib/*.test.ts`, `api/**/*.test.ts`) for anything that can mislead a user: verdict gate, voice-guide safety gate (blocked topics, fail-closed on invalid output/errors), zod parsers on recorded/synthetic model output, step validation (order, overlap, bounds), geometry scaling to the displayed frame, shrink bitrate maths, rate-limit/spend-cap counter, access-code check.
- **Component tests** (Vitest + Testing Library) for the stuck dialog: no request before Send; a new photo invalidates prior consent; an unclear verdict shows no outline.
- **Manual end-to-end checks** recorded in `HACKATHON-LOG.md`: real iPhone and Android video through the creator flow; real stuck check on desktop and phone; failure drills (bad photo, no SAM match, Meta timeout, over the cap).
- Synthetic media and fake keys in automated tests. Never claim a run that didn't happen.

## 9. Boundaries

- **Always:** keep the Meta, Supabase service and Wit.ai keys server-side only (never `VITE_*`); label every AI illustration "Illustration by AI"; run the voice-guide safety gate before saving anything, failing closed; preview and get approval for every learner photo; label fixtures; validate model output; show honest failure states; use absolute dates in docs; run lint, typecheck, test and build before committing.
- **Ask first:** new dependencies beyond those listed in §4; schema changes after seed data exists; deploying; making the repo public; changing access-code or spend-cap settings; submitting.
- **Never:** store learner photos, voice recordings, or the transcripts of blocked voice guides; run the "I'm stuck" check against an AI illustration; call a guide "verified" or "safe"; draw an outline that SAM didn't return; present a fixture as a live result; let Spark invent instructions the creator didn't give; give medical, electrical or safety advice; commit secrets; push or deploy without approval.

## 10. Success criteria (all on the same deployed build)

1. A real phone video (≤500 MB, ≤3 min) uploads on desktop Chrome, shrinks to ≤48 MB in the browser, and becomes a published guide with sensible steps. End-to-end time is measured in T0b/T11 and stated as measured, never promised in advance.
2. Each step plays its own segment; at least 70% of steps in the seed guides have a SAM outline that lands on the right part. The rest show none rather than a wrong one.
3. On the seed tasks' staged photo set (5 right, 5 wrong, 2 blurry), wrong photos return `differs` with a box on the differing part, right photos return `match`, and blurry photos return `unclear`. Accuracy is measured and logged; only tasks that pass are filmed for the demo.
4. Learner photos are never stored; every check shows a payload preview first. Creators see a consent screen before their video leaves the device.
5. The site works on a phone and on desktop; a judge can create a guide with the access code.
6. A 3-minute demo video and public repo clearly identify work done 2026-10-27 to 2026-11-04.
7. (T17) A spoken how-to becomes an illustrated guide whose step images show the same object; a staged harmful or gibberish recording is blocked with a reason and nothing appears in the database or Storage.

## 11. Open questions (resolved on day 1 unless noted)

1. Still unknown after the docs review (2026-10-30): Muse Spark video duration/size limits and frame sampling; how SAM's mask maps onto the frame; whether Meta offers a spend-limit control (until confirmed, the app's own caps are the only guaranteed limit).
2. Real Spark/SAM/Transcribe latency against Vercel Hobby's 300 s function limit (stream Spark responses).
3. Whether to host on a code-gated public URL: ask Meta in Discord #office-hours (draft question in `HACKATHON-LOG.md`, 2026-10-30).
4. **Seed guides (decided 2026-10-31):** change an air purifier's water, run a dishwasher, clean a coffee machine (appliance cleaning only; no food or drink-safety claims). Talha films these, plus staged right/wrong/blurry photos for 1–2 steps each.
5. Final product name.
6. ~~Muse Image consistency~~ Resolved 2026-10-31: anchored edits from one base image keep the object identical. Step *content* can still be wrong (e.g. tank still attached while filling), so the creator reviews and can regenerate any image.
