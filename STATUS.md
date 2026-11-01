# Project Status

**Updated:** 2026-11-01

## Active project: Showhow

Video guides that check your work, plus voice guides with AI illustrations. Spec: [`apps/showhow/docs/PRD.md`](apps/showhow/docs/PRD.md) · Architecture: [`ARCHITECTURE.md`](apps/showhow/docs/ARCHITECTURE.md) · Plan: [`TASKS.md`](apps/showhow/docs/TASKS.md) · Decisions: [`DECISIONS.md`](apps/showhow/docs/DECISIONS.md) · Evidence: [`HACKATHON-LOG.md`](apps/showhow/docs/HACKATHON-LOG.md).

## Built and verified locally (live Meta + Supabase, synthetic media)

- Video guides: on-device shrink → upload → Transcribe → Spark steps → keyframes → SAM boxes → review/edit → publish (T8–T11).
- "I'm stuck" check against the real keyframe, 18+ and a preview before every photo (T5–T6).
- Voice guides: two-layer safety gate (fail closed) → steps → base-anchored Muse Image illustrations (T17).
- AI-enhanced stills with the real frame's aspect ratio (T18). Read aloud via Wit.ai at publish (T16).
- Privacy page, draft cleanup, caps, secret scans, CI, deploy + cleanup workflows prepared (T4, T13 prep, T14 local).
- 121 automated tests; nothing pushed or deployed yet.

## Waiting on Talha

- Real footage: air purifier, dishwasher and coffee machine videos + staged right/wrong/blurry photos (T0, T0b, T12).
- OK to push and deploy, plus a Vercel account and GitHub secrets (T13).
- Then: failure drill on the live URL, draft demo (T14); final demo, repo public, submit (T15).

**Hackathon submission deadline:** 2026-11-04 21:00 ET (target ~15:00 ET).
