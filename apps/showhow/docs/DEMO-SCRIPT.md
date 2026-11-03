# Demo script (3:00)

**Written:** 2026-11-02 · **Status:** draft; nothing recorded yet. Record on the **deployed** build (https://goodfix-alpha.vercel.app, T13 done 2026-11-02) with the UI v2 restyle (T19). Every claim must match what the live build did on camera (T15 Verify).

**Rules on camera:** real model calls only. Anything that isn't live is labelled on screen (`TEST FIXTURE`, or a lower-third "recorded earlier on the live build, 2026-11-0x"). Cut waiting with a visible "⏩ 40 s" jump-cut tag, never hide that time passed. No access codes, keys, `.env.local` or Vercel/Supabase dashboards in any frame. Learner photos shown are staged by Talha.

| Time | On screen | Voiceover | Source |
|---|---|---|---|
| 0:00–0:12 | Talha at a dishwasher/air purifier, pausing a YouTube-style tutorial, squinting at the part | "Tutorials talk at you. When you get a step wrong, nobody notices. YouTube can't see you're stuck. **This can.**" | Live footage |
| 0:12–0:20 | Title card: **Showhow** — "Guides from real people's know-how that check your work." Small line: *Muse Voice Transcribe · Muse Spark · SAM 3.1 · Muse Image* | "Showhow turns someone's narrated how-to into a guide that can check your work." | Card |
| 0:20–0:50 | Create → drop the narrated phone video → consent screen (who/what/keeps) → progress ticks ("Finding the steps in what you said") → review grid with steps in the creator's words + SAM boxes on key parts → Publish | "I film the job once, talking as I go. It shrinks on my laptop, Voice Transcribe times my narration, Muse Spark splits it into steps **in my own words**, and SAM 3.1 outlines the part each step is about. I review, then publish." | **Live** (T12 air purifier; jump-cut the wait) |
| 0:50–1:10 | Published guide in the **3-column workbench**: steps left, looping clip centre with "Show part", Prev/Next, help panel right (read aloud, creator tip, I'm stuck, Ask). Press → to change step | "A learner follows one step at a time: the creator's own clip, the part outlined, everything on one screen." | **Live** |
| 1:10–1:45 | Phone: "I'm stuck" → staged *wrong* photo → payload preview (photo, reference frame, question, recipients) → Send → verdict **differs** with the SAM box **on the learner's photo** | "Stuck? Send one photo. You see exactly what's sent, and nothing is stored. Muse Spark compares it with the creator's step, and SAM outlines what's different, on *your* photo." | **Live** (T0 staged photos; only if T0 passed for this step) |
| 1:45–2:10 | Create → "Talk it through" → record ≤2 min → style picker → steps fill in with illustrations, each tagged **Illustration by AI** (dashed edge) → published voice guide | "No video? Just talk it through. Muse Image illustrates every step from one base picture, so the object stays the same. Always labelled as AI, never used as evidence." | **Live** recording; illustrations may be **recorded earlier on the live build** (label it) |
| 2:10–2:25 | Voice guide help panel → **Ask**: "Do I need to rinse the plates first?" → the creator's own words appear as a quote labelled "The creator says · step N" (instruction + tip, no AI-written answer); then an off-guide question → "The creator’s guide doesn’t cover that, so we can’t answer it here." | "Ask a question and it shows you the creator's own words from the step that answers it. The AI only finds the step; it never writes the answer. If the guide doesn't cover it, it says so." | **Live** (T20; covered + uncovered ran on dev 2026-11-02, covered on production) |
| 2:25–2:40 | Voice Create with a staged harmful recording → **blocked** with the reason, nothing saved | "Nothing is saved until a two-layer check passes: hard topic rules, then a Muse Spark review. If it can't check, it refuses." | **Live** (staged harmful script) |
| 2:40–2:50 | Honest failure: blurry photo → **unclear**, "take a closer, well-lit photo"; or a step with no outline → "couldn't pinpoint it" | "When it can't tell, it says so. No guessed outlines, no made-up answers." | **Live** |
| 2:50–3:00 | Back to the hands at the appliance; end card: live URL, repo, "Built 2026-10-27 → 11-04 for the Meta Global AI Developer Hackathon" | "Real know-how, checked against your work. Showhow." | Card |

## Live vs. fixture

- **Must be live on the deployed build:** video create → publish, workbench, I'm stuck verdict + box, voice create, Ask, safety block, unclear/no-outline failure.
- **May be recorded earlier on the live build** (labelled with date): long waits (video processing, illustrations).
- **TEST FIXTURE only if unavoidable** and labelled on screen: any guide not built through the real pipeline. Synthetic Wit.ai test voices (`~/Downloads/showhow-voice-tests/`) are not for the published demo gallery.
- **Do not show** until logged: Ray-Ban Meta live help (vision only, say "next"), "Where am I?" (T7, not built), any accuracy number not measured in T0/T12.

## New-work evidence (2026-10-27 → 2026-11-04)

Show for 1–2 s each or list in the README/submission notes:
- Git log of `apps/showhow/` with dates (first Showhow commit 2026-10-30 onward).
- `docs/DECISIONS.md` / `HACKATHON-LOG.md` dated entries 2026-10-29 → 2026-11-04.
- The approved UI v2 mockup (2026-11-02) next to the restyled live app.
- End card line: "Built 2026-10-27 → 11-04."

## Before recording

- [x] T13 deployed and smoke-checked ([`DEPLOY.md`](DEPLOY.md), 2026-11-02); T20 verified (2026-11-02).
- [ ] T19 verified (1024/390 px, video guide + stuck dialog; contrast computed 2026-11-02).
- [ ] A video create, a voice create and an I'm-stuck check run once on the live URL.
- [ ] T0 passed for the step used at 1:10 (right → match, wrong → differs + box, blurry → unclear).
- [ ] Staged harmful recording script approved by Talha (mild, clearly off-limits, e.g. a blocked topic; nothing graphic).
- [ ] Browser zoom/screen size fixed (1440×900 desktop, a real phone for the check).
- [ ] Red-team review of the draft video (T14) logged in `HACKATHON-LOG.md`.
