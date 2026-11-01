# Goodfix decisions

Locked decisions for the active hackathon web app. Preserve history; add a newer dated decision when reversing a choice.

## 2026-10-29 — Separate responsive web app is the hackathon entry

- Project path: `apps/goodfix-web/`. Working title: Goodfix; public brand remains open.
- Stack: React + TypeScript + Vite + responsive CSS. No native wrapper in the hackathon MVP.
- Layout: Workbench on desktop; step-focused Guided adaptation on phones. Keep each upload numbered, selectable, and linked to the corresponding conversation event.
- First demo task: one staged, visibly loose cupboard handle with an accessible screw. No generic repair, plumbing, electrical work, cooking, appliances, vehicles, structural work, or medical tasks.
- Model roles: Muse Spark video understanding returns text; SAM 3.1 returns tracked object geometry. Neither model is treated as a repair diagnosis or safety authority. Display real source frames and parsed SAM overlays.
- Meta API routing: do not ship a public server-side route until Meta provides written clarification that the exact no-login Integrated Product architecture is authorized. Keep keys out of browser code.
- Privacy: each media request gets its own exact-content preview and explicit approval. Use Standard services for personal home footage and restrict users to 18+. Delete Meta Files API uploads when no longer needed.
- Review conditions: preserve real outputs and stop behavior; do not replace failed live calls with simulated success. Revisit scope if the authorization gate, model access, or task safety gate fails.

This decision supersedes the Vault-specific 2026-10-28 hackathon platform decision only. It does not retire the separate Vault mobile product archived under `archive/vault-native/`.

## 2026-10-29 — Build and release through gated phases

- Begin with a local web shell, CI checks, deterministic fixtures, and consent/evidence logic. Add Meta integrations only after the existing written-authorization and account/model gates pass.
- Add test coverage by risk layer from unit and component checks through adapter contracts, browser journeys, security checks, and isolated staging verification. Record evidence in `TEST-PLAN.md`.
- Keep credentials server-only. Never place a provider key in a Vite-exposed variable, browser bundle, source map, test fixture containing a real value, or Git history. Add secret scanning before implementation work.
- Evaluate Vercel, Render, and Railway against the approved architecture and tested file/runtime limits before choosing a host. Start with a private fixture-only preview that has no provider credentials; production/live model access is a separate gate.
- Revisit if Meta does not authorize the no-login route, the live API/file lifecycle cannot be secured, or time does not permit the required verification. Do not claim a deployment is safe because it works in a demo.

## 2026-10-30 — Pivot to Showhow: video guides that check your work

Supersedes the 2026-10-29 Goodfix product decision (single cupboard-handle repair flow). Approved by Talha 2026-10-30.

- **Product:** a gallery of step-by-step guides generated from creators' narrated videos (Voice Transcribe → Muse Spark step split → SAM 3.1 key-part outlines). Learners follow along and, only when stuck, send one photo that Muse Spark compares with the creator's step keyframe; SAM 3.1 outlines the differing part on the learner's photo. "Where am I?" locates the learner's step from a photo.
- **Why:** the red-team review (HACKATHON-LOG 2026-10-30) scored the narrow repair idea ~5–7/10 with an Impact ceiling and anti-project risk ("Simple Image Analyzer"). Showhow has everyday multi-domain use (training, family know-how, product setup), four distinct Meta model roles, and a demo-able "it caught my mistake" moment.
- **Folder/name:** app moved to `apps/showhow/`; "Showhow" is a working title.
- **Stack:** React + TS + Vite; Vercel Hobby serverless `/api` (holds secrets); Supabase free (Postgres + Storage); Mediabunny in-browser shrink to ≤50 MB 720p MP4 (accept ≤2 GB / ≤5 min input); zod; Vitest. All free tiers.
- **Access:** gallery and checks open without login; guide creation behind an access code; daily caps and per-IP throttle. Public URL exposure needs a further dated decision after asking Meta in #office-hours about Terms §10.1(i).
- **Retained rules:** keys server-only; fresh preview + consent per learner photo; learner photos never stored; no fabricated outlines or fixture-as-live; 18+.
- **Retired rules:** cupboard-only scope, repair stop rules, written-authorization blocker for all live calls (replaced by the access-code gate and the Discord question).
- **Tests:** written test-first for risk-bearing logic (approved 2026-10-30).

## 2026-10-30 — Spec corrections after red-team review

- Correction: Showhow uses **three** Meta models (Voice Transcribe, Muse Spark, SAM 3.1), not four as written in the pivot entry above.
- Step start/end times come from Voice Transcribe `ENDPOINTING` turn timestamps; Muse Spark returns turn indices, not seconds.
- SAM 3.1 returns boxes plus a base85 mask; the UI draws the box until the mask-to-frame mapping is verified. Zero or ambiguous matches mean no outline.
- Creator input capped at 500 MB / 3 min; desktop Chrome/Edge is the supported creator path for the demo; encoder support checked at runtime.
- Creators get a consent screen before upload. Video reaches Spark by public Supabase URL; Files API (with deletion) only as fallback.
- No food/recipe seed guides. "Where am I?" moved to stretch. Target submission ~15:00 ET on 2026-11-04.

## 2026-10-31 — Add voice guides with a safety gate and AI illustrations (T17)

Approved by Talha 2026-10-31.

- **What:** creators can talk a fix through (≤2 min audio, no video). Voice Transcribe → two-layer gate → Muse Spark steps → Muse Image illustration per step in one of 6 styles (realistic photo, line art, flat colour, blueprint, watercolour, 3D clay), chosen from stored sample previews.
- **Gate:** layer 1 is hard-coded blocked topics (weapons/violence/harm, self-harm, drugs, gas, mains electrical, fire/explosives, medical, vehicle brakes/steering, hacking, illegal). Layer 2 is a Muse Spark review: a real how-to, complete, safe, category, missing steps. Fail closed. **Nothing is saved until both pass**; recordings are never stored.
- **Honesty rules:** every image is labelled "Illustration by AI"; voice guides have no "I'm stuck" photo check (no real reference frame); the badge says "AI-checked: clear, complete and within safety rules", never "verified fix" or "safe".
- **Why:** lowers the bar for sharing know-how (Impact); adds a fourth distinct Meta model (Muse Image), which also qualifies for the Best Creative Build bonus.
- **Priority:** after the core video loop (T1–T6, T8–T12); replaces "Where am I?" as the top stretch; second in the cut order.
- **Known risk:** separate generations drew different purifiers across steps (spike 2026-10-31). Mitigation: edit the previous step's image; tested first in T17(a).

## 2026-10-31 — Optional AI-enhanced step images for video guides (T18); flat API routes

Approved by Talha 2026-10-31.

- Creators can tick "Enhance with AI". Each step's real keyframe is edited by Muse Image into a cleaner, better-lit version of the same scene, plus a highlight edit on the key part. This helps with blurry, dark or shaky footage.
- Honesty rules: labelled "Enhanced by AI", with the original frame one tap away; the creator approves each image. **The "I'm stuck" check always uses the real keyframe**, never an enhanced or illustrated image.
- Order after the core loop: T17 voice guides → T18 enhanced images → T7 Where am I. All before T13 deploy if time allows.
- API routes are flat (`/api/guides`, `/api/steps`, `/api/outlines`, `/api/publish`, `/api/check`, `/api/voice-guides`, `/api/voice-images`) with ids in the body, mapping 1:1 to files in `api/`.

## 2026-11-01 — Consistency fixes after end-to-end review (supersedes conflicting lines above)

Independent red-team audit of the spec, architecture, plan, schema and code (logged 2026-11-01). Where this entry conflicts with earlier ones, this entry wins:

- **Models:** four Meta models (Voice Transcribe, Muse Spark, SAM 3.1, Muse Image) plus Wit.ai as a non-Model-API add-on. This supersedes "three models".
- **Voice-guide images:** every step is an edit of **one base image**, not of the previous step. This supersedes "edit the previous step's image".
- **Order after the core loop:** T17 → T18 → T16, with T7 stretch. **Cut order:** T7, T16, T18, T17. T18 and T16 are flagged as candidate cuts for Talha to decide.
- **Deploy earlier:** T13 moves to Day 2, right after T11, so Vercel limits and the `video_url` fetch fail early. It still needs Talha's OK; the public-exposure decision is written before the URL is shared.
- **Credit guard:** every model-stage route is status-gated, with `guides.attempts` < 3.
- **Data shapes:** voice audio is sent as a raw `audio/wav` body (base64 would exceed 4.5 MB); the check photo is a base64 data URL in JSON; keyframe upload URLs come from `/api/steps`; the WAV is deleted in `finally`; drafts unpublished after 24 h are cleaned up (T14).
- **API:** one Spark endpoint (`/v1/responses`) everywhere. `IP_SALT` is required in production. Routes: guides, steps, outlines, publish, check, voice-guides, voice-images, enhance, tts, health.

## 2026-11-01 — Full scope kept; build everything locally, then push and deploy via CI/CD

Talha's decision (2026-11-01). This supersedes the "candidate cut" and "deploy early" points in the entry above.

- **T16 (read aloud), T17 (voice guides) and T18 (AI-enhanced images) are committed scope**, not cut candidates. If the schedule slips, we add working time rather than cut. Only T7, gallery filters, review editing and a third seed guide remain cuttable.
- **Deploy last:** every flow is completed and verified locally (dev bridge against the real Supabase + Meta) first. Then push to GitHub; CI runs; a deploy workflow ships to Vercel via the Vercel CLI (manual `vercel deploy --prod` from local as fallback). This is T13 on Day 4.
- Accepted risk: Vercel-specific issues (function duration, the `video_url` fetch) surface later. Mitigations: a local production rehearsal in T13, and a Day 4 buffer before the ~15:00 ET target on Day 5.
- Footage: Talha films the videos; if any are missing, voice guides (audio only) fill the gallery.

## 2026-11-01 — Transcript saved on the guide; audio deleted once transcribed

Refines the "WAV deleted in `finally`" point above, which would have made retries impossible. `/api/steps` saves the Transcribe turns on `guides.turns` and deletes `audio.wav` as soon as transcription succeeds. A retry reuses the turns and skips Transcribe. If transcription itself fails, the WAV is kept for a retry, deleted on the last failed attempt, and otherwise removed by the 24 h draft cleanup. The narration becomes public step text anyway, so storing the turns adds no new exposure.

## 2026-11-01 — Voice gate: a possibly-missing step is advice, not a block

The live test showed Muse Spark flagging "pour out the old water first" as missing from a perfectly usable purifier guide. It did so even after the prompt was narrowed to "steps without which the task fails". Blocking such guides would throw away real know-how over a judgement call. So **unsafe content, not-a-how-to and any unreadable/failed review remain hard blocks (fail closed, nothing saved)**, while `complete: false` now returns the missing steps as advice in the review screen ("The AI thinks you may have skipped …"), where the creator can add them or re-record. The badge text is now "AI-checked: a clear how-to within safety rules". Reversible in one line (`gateReview`) if Talha prefers a hard block.

## 2026-11-01 — Read-aloud audio is made inside publish (no `/api/tts` route)

A separate `/api/tts` run before publishing would speak text the creator could still edit in review. `/api/publish` now applies the edits first, then calls `addReadAloud` (Wit.ai, one MP3 per step, best effort: a Wit failure never blocks publishing), then publishes. This replaces `tts` in the route list of the 2026-11-01 consistency entry.

## 2026-11-01 — Fixes from the full-build red-team review

- **Vercel ESM:** every relative import reachable from `api/` uses a `.js` extension, which Node's ESM resolver requires; TypeScript and Vite map `.js` to the `.ts` source.
- **Dead runs:** `guides.claimed_at`; a `processing` claim older than 330 s (beyond Vercel's 300 s kill) can be taken over. Timeouts were cut so every route's worst case stays under about 270 s (Transcribe 60 s, Spark 150/120/45 s, image 60 s).
- **Reference frames** are captured near the end of each step (`end_s − 0.4 s`), and the verdict prompt describes them that way.
- **Safety:** hard topic rules now also apply to video narration, creator edits at publish, and the check's own answer (a hit becomes `unclear`). The learner's question is passed as delimited data.
- **Credits:** a new `image` cap (60/day, 20 per IP) on `voice-images` and `enhance`.
- **Honest copy:** "Sent with Meta's response storage turned off; Meta's terms apply" replaces "Not kept by Meta"; "Passed our topic check" replaces "within safety rules".

## 2026-11-01 — Feedback round 1 (Talha's testing): safety parity + AI-filled metadata

- **Safety (F2, F4):** both creation paths use the same two layers. Layer 1 adds adult content, hate/harassment and personal details (phone/email/card numbers). Video keyframes get a Muse Spark frame review, and a video can't be published without `frames_ok`. Errors fail closed everywhere.
- **Metadata (F5, F6):** title is optional and category defaults to "Let AI choose" (17 categories). The review's title and category fill the blanks (`auto_title`, `auto_category`), and the creator edits both in review.
- **Duplicates (F7):** warn, don't block (Talha: "fix all" = the recommended option).
