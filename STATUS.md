# Project Status

**Updated:** 2026-11-02

## Active project: Showhow

Video guides that check your work, plus voice guides with AI illustrations. Spec: [`apps/showhow/docs/PRD.md`](apps/showhow/docs/PRD.md) · Architecture: [`ARCHITECTURE.md`](apps/showhow/docs/ARCHITECTURE.md) · Plan: [`TASKS.md`](apps/showhow/docs/TASKS.md) · Decisions: [`DECISIONS.md`](apps/showhow/docs/DECISIONS.md) · Evidence: [`HACKATHON-LOG.md`](apps/showhow/docs/HACKATHON-LOG.md) · Feedback: [`FEEDBACK.md`](apps/showhow/docs/FEEDBACK.md) · Deploy: [`DEPLOY.md`](apps/showhow/docs/DEPLOY.md) · Demo: [`DEMO-SCRIPT.md`](apps/showhow/docs/DEMO-SCRIPT.md)

**Deadline:** 2026-11-04 21:00 ET (what we use). **To verify on the official page:** an unofficial listing says 2026-11-05 06:30 IST = 2026-11-04 **20:00 EST**, one hour earlier (DST ended 2026-11-01). Plan to submit by ~15:00 ET on 2026-11-04 either way.

**Live:** https://goodfix-alpha.vercel.app (deployed 2026-11-02, T13). Vercel project `goodfix`, Root Directory `apps/showhow`, Node 22.x; deploys from Vercel's Git integration on push to `main`. Creating guides needs an access code (long random production codes, kept outside the repo).

## Built and verified (live Meta + Supabase)

- Video guides: on-device shrink → upload → Transcribe → Spark steps → keyframes → SAM boxes → review/edit → publish (T8–T11, local, synthetic media).
- "I'm stuck" check against the real keyframe, 18+ and a preview before every photo (T5–T6, local).
- Voice guides: two-layer safety gate (fail closed) → steps → base-anchored Muse Image illustrations (T17); AI-enhanced stills (T18); read aloud via Wit.ai at publish (T16).
- Feedback round 1 (F2–F10).
- **T20 Ask** (done 2026-11-02): Spark only picks the covering steps; the learner sees the creator's own instruction + tip quoted ("The creator says · step N", at most 2), never model prose; uncovered → a fixed message. Live: covered + uncovered on dev, covered on production (8.1 s, 8.6 s).
- **T19 UI v2** built and merged; desktop checked against the mockup with real data on dev and production; contrast computed ≥4.5:1 for all text pairs.
- Red-team fixes (2026-11-02): caps per-IP first and counted after lookups (Ask, check), dialog focus trap + return, step-title focus, "AI circle" label, no "safe" wording, fixture check → `unclear`, "All steps" 44 px.
- **Production smoke + part of T14** (2026-11-02): health, security headers, gallery + a voice guide with real data, dev codes rejected, Ask, curl failure drill (all refusals honest), headless CSP clean on 5 pages, env reduced to the 7 vars the code reads. 178/178 tests.

## Not yet run live

- A create (video or voice) on production, an I'm-stuck check on production, CSP during a real upload (shrink worker).

## Remaining work

1. **T0 / T0b / T12** need Talha's footage (air purifier, dishwasher, coffee machine + staged right/wrong/blurry photos). Talha will create on the live site.
2. **T14** rest: drill items needing a real create, phone check with real data, keyboard/screen-reader pass, draft demo + red-team review.
3. **T19** verify: 1024 and 390 px screenshots with real data, a published video guide + stuck dialog. F11–F13 built, awaiting Talha's check.
4. **T15** final demo ([`DEMO-SCRIPT.md`](apps/showhow/docs/DEMO-SCRIPT.md)), README work-done list, history scan, repo public, submit: each public step needs Talha's go-ahead.
5. Optional: **T7** Where am I?

## Blockers

- Real footage and staged photos (Talha) block T0, T0b, T12 and the demo's check segment.
- Hosting-terms question (Meta Terms §10.1(i)) still unanswered in Discord; access codes stay on, and a dated public-exposure decision is needed before sharing the URL widely.
