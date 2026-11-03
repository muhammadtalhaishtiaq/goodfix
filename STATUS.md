# Project Status

**Updated:** 2026-11-02

## Active project: Showhow

Video guides that check your work, plus voice guides with AI illustrations. Spec: [`apps/showhow/docs/PRD.md`](apps/showhow/docs/PRD.md) · Architecture: [`ARCHITECTURE.md`](apps/showhow/docs/ARCHITECTURE.md) · Plan: [`TASKS.md`](apps/showhow/docs/TASKS.md) · Decisions: [`DECISIONS.md`](apps/showhow/docs/DECISIONS.md) · Evidence: [`HACKATHON-LOG.md`](apps/showhow/docs/HACKATHON-LOG.md) · Feedback: [`FEEDBACK.md`](apps/showhow/docs/FEEDBACK.md) · Deploy: [`DEPLOY.md`](apps/showhow/docs/DEPLOY.md) · Demo: [`DEMO-SCRIPT.md`](apps/showhow/docs/DEMO-SCRIPT.md)

**Deadline:** 2026-11-04 21:00 ET (target submit ~15:00 ET). Time left: about two days from 2026-11-02 evening.

## Built and verified locally (live Meta + Supabase, synthetic media)

- Video guides: on-device shrink → upload → Transcribe → Spark steps → keyframes → SAM boxes → review/edit → publish (T8–T11).
- "I'm stuck" check against the real keyframe, 18+ and a preview before every photo (T5–T6).
- Voice guides: two-layer safety gate (fail closed) → steps → base-anchored Muse Image illustrations (T17).
- AI-enhanced stills (T18); read aloud via Wit.ai at publish (T16).
- Feedback round 1 (F2–F10): safety parity on both paths, AI title/category, duplicate hints, streamed progress, grid review.
- Privacy page, draft cleanup, caps, secret scans, CI, deploy + cleanup workflows prepared (T4, T13 prep, T14 local). 151 automated tests at last log (2026-11-01).
- Nothing pushed or deployed yet.

## Decided 2026-11-02

- UI v2 "Workshop manual" ([`design/ui-v2-mockup.html`](apps/showhow/design/ui-v2-mockup.html)) approved; it supersedes `design/showhow-prototype.html` as the UI reference.
- "Ask about this step" (`/api/ask`, T20) added to scope.

## Remaining work

1. **T19** restyle to the approved mockup (F11 media shape, F12 Prev/Next, F13 3-column workbench). In progress.
2. **T20** Ask about this step. In progress.
3. **T0 / T0b / T12** need Talha's footage: air purifier, dishwasher, coffee machine videos + staged right/wrong/blurry photos.
4. **T13** push + deploy: needs Talha's OK, a Vercel account and GitHub `production` secrets ([`DEPLOY.md`](apps/showhow/docs/DEPLOY.md)); public-exposure decision before sharing the URL.
5. **T14** failure drill on the live URL, accessibility/phone pass, draft demo + red-team review.
6. **T15** final demo ([`DEMO-SCRIPT.md`](apps/showhow/docs/DEMO-SCRIPT.md)), README work-done list, history scan, repo public, submit: each public step needs Talha's go-ahead.

## Blockers

- Real footage and staged photos (Talha) block T0, T0b, T12 and the demo's check segment.
- Deploy OK + Vercel/GitHub secrets (Talha) block T13 → T14 → T15.
- Hosting-terms question (Meta Terms §10.1(i)) still unanswered in Discord; access codes stay on until a dated decision.
