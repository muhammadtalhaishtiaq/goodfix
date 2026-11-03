# Showhow

**YouTube can't see you're stuck. This can.**

Showhow turns a creator's narrated how-to video, or just a spoken explanation, into a step-by-step guide that can check your work. Follow along one step at a time; only when you're stuck, send one photo. Meta's models compare it with the creator's real frame for that step and outline what looks different on *your* photo.

Meta Global AI Developer Hackathon entry · **Live:** https://goodfix-alpha.vercel.app (watching and checking are open; creating a guide needs an access code, provided in the submission notes) · Demo video: *link added at submission*

## How it works

| Step | What happens | Meta model |
|---|---|---|
| 1. Creator films and talks | Video is shrunk to 720p **in the browser**; the original never leaves the device | — |
| 2. Words become text | Narration is transcribed into timed turns | Muse Voice Transcribe |
| 3. Safety gate | Hard topic rules (our code), then a model review; video frames are checked too. Fails closed | Muse Spark |
| 4. Steps in the creator's own words | Split, ordered and titled; never adds advice the creator didn't give. Creator reviews and edits before publishing | Muse Spark |
| 5. Key part outlined | One still per step; the part the creator talks about is boxed only where the model actually found it | SAM 3.1 |
| 6. Learner is stuck | One photo, previewed and approved before sending, compared with the creator's real frame → `match`, `differs` or `unclear`; what differs is outlined on the learner's photo | Muse Spark + SAM 3.1 |
| 7. Ask about this step | A typed question; the model only picks which steps answer it, and the learner sees the **creator's own words** quoted | Muse Spark |
| Voice guides | No video? Talk it through; steps get consistent illustrations, always labelled "Illustration by AI", and are read aloud | Muse Image, Wit.ai TTS |

Trust rules: learner photos and questions are never stored or logged, every Meta call uses `store: false`, AI images are labelled, model failures show an honest message and a retry (never a made-up result), and the app never calls a guide "verified" or "safe". 18+ only.

## Built during the hackathon (2026-10-27 → 2026-11-04)

All of Showhow is new work from this window. The first Showhow commit is `9aa8e5e` (2026-10-30); `git log --since=2026-10-27 -- apps/showhow` lists every change. Highlights:

- 2026-10-30: idea, spec and plan; React app; SAM/verdict parsers; live Meta API spikes
- 2026-10-31: Supabase schema with row-level security and usage caps; voice guides spec; image consistency via anchored edits
- 2026-11-01: full create pipeline (upload, transcribe, steps, outlines, publish), "I'm stuck" check, voice guides with a two-layer safety gate, AI-enhanced stills, read-aloud, duplicate hints, streamed progress
- 2026-11-02: "Workshop manual" UI, 3-column guide workbench, "Ask about this step", red-team fixes, production deploy on Vercel with a live failure drill

Evidence for every claim (what ran, when, and the result) is in [`apps/showhow/docs/HACKATHON-LOG.md`](apps/showhow/docs/HACKATHON-LOG.md). **Not part of this entry:** [`archive/vault-native/`](archive/vault-native/), an earlier, unrelated Expo app kept for history.

## Run it locally

```bash
cd apps/showhow
cp .env.example .env.local   # fill in your own keys
npm ci
npm run dev                  # UI + /api routes
npm test                     # vitest
```

Stack: React 19, TypeScript, Vite, plain CSS · Vercel functions (`apps/showhow/api/`) · Supabase Postgres + Storage · zod at every boundary.

## Docs

[Spec](apps/showhow/docs/PRD.md) · [Architecture](apps/showhow/docs/ARCHITECTURE.md) · [Decisions](apps/showhow/docs/DECISIONS.md) · [Tasks](apps/showhow/docs/TASKS.md) · [Deploy](apps/showhow/docs/DEPLOY.md) · [UI mockup](apps/showhow/design/ui-v2-mockup.html) · [Status](STATUS.md)
