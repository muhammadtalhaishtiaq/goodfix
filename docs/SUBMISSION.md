# Showhow · submission pack

Meta Global AI Developer Hackathon · **Indie Developer** track · problem statement **Build for Your World** · solo (Talha) · due **Wed 2026-11-04, 9:00 PM ET** on the Cerebral Valley platform.

## Links

- **Live product:** https://goodfix-alpha.vercel.app
- **Judge link (access code pre-filled):** https://goodfix-alpha.vercel.app/?code=Meta2026#/create
- **Public repo:** https://github.com/muhammadtalhaishtiaq/goodfix
- **Demo video (1:53):** https://youtu.be/b4OJqQHIMVg
- **X post (Most Viral bonus):** `<paste X post link>`

## Project name

Showhow

## Tagline (one line)

YouTube can't see you're stuck. Showhow can: guides from real people's know-how that check your work.

## Short description (≤ 300 characters)

Showhow turns a narrated how-to video, or just a spoken explanation, into a step-by-step guide that checks your work. Stuck? Send one photo: Muse Spark compares it with the creator's real frame and SAM 3.1 outlines what's different, on your photo.

## Full description

**The problem.** Every tutorial talks at you. When you get a step wrong, nobody notices, and you rewind and guess.

**What Showhow does.**

1. **Create from real know-how.** A creator films the job once, talking as they go, or just talks it through. The video is shrunk to 720p in the browser (the original never leaves the device). Muse Voice Transcribe times the narration; a two-layer safety gate (hard topic rules in our code, then a Muse Spark review) runs before anything is saved; Muse Spark splits it into steps **in the creator's own words**; SAM 3.1 outlines the key part on each step's real frame, and says so plainly when it isn't sure. The creator reviews and publishes.
2. **Follow one step at a time.** A workbench with the creator's own clip per step, read-aloud, and the creator's tips in their words.
3. **"I'm stuck."** One photo, previewed and approved before it's sent, never stored. Muse Spark compares it with the creator's real frame for that step and answers `match`, `differs` or `unclear`; for `differs`, SAM 3.1 outlines the difference **on the learner's photo**.
4. **Ask, or talk.** A step-aware agent answers from the creator's steps and narration, names the step it used, and labels anything extra as "AI suggestion · not from the creator". Talk mode reads answers aloud.
5. **No video? Talk it through.** Muse Spark writes a shot list for every step and Muse Image draws it (one object stays consistent, a routine gets its own scenes); SAM outlines the key part on the illustration; every image is labelled "Illustration by AI".

**Trust by design.** Learner photos and questions are never stored or logged; every Meta call uses `store: false`; outlines only where SAM returned one; model failures show an honest message and a retry; blocked topics stop with the exact words that tripped the rule ("We heard: …"); 18+ only; daily caps protect credits.

## How we use Meta's models

| Model | Where |
|---|---|
| **Muse Voice Transcribe** | Timed transcription of creator narration and spoken guides; spoken chat questions |
| **Muse Spark** (muse-spark-1.3) | Safety review, step splitting in the creator's words, frame content review, photo-vs-reference verdict, step-aware chat agent, per-step picture briefs (shot lists) |
| **SAM 3.1** | Key-part outline on each step's real frame; difference outline on the learner's photo; outline on AI illustrations |
| **Muse Image** (muse-image-1.0) | Voice-guide illustrations (object mode = edits of one base image; scene mode = fresh per step), optional "Enhanced by AI" stills |

Plus Wit.ai text-to-speech (Meta) for read-aloud and Talk mode.

## What was built during the hackathon

All of Showhow is new work from 2026-10-27 → 2026-11-04. First Showhow commit `9aa8e5e` (2026-10-30); `git log --since=2026-10-27 -- apps/showhow` lists every change. Day-by-day evidence (what ran, when, results) is in `apps/showhow/docs/HACKATHON-LOG.md`; decisions are dated in `apps/showhow/docs/DECISIONS.md`. `archive/vault-native/` is an earlier, unrelated app kept for history and is **not** part of the entry.

## Notes for judges

- Watching guides, "I'm stuck" and chat are open (18+). Creating a guide uses the demo access code **`Meta2026`**, pre-filled on the Create page (or use the judge link above).
- Try it: open "Change the water in your air purifier" → step 2 → **I'm stuck** with any photo of a humidifier or tank; or open a voice guide and ask the chat a question, then switch on **Talk mode**.
- A video create takes about 1–2 minutes (on-device shrink, upload, transcription, safety gate, steps, stills, SAM). Use desktop Chrome or Edge for video creation (in-browser H.264 encoding).
- CI: lint, typecheck, 190 tests, build, bundle secret scan, `npm audit`, full-history gitleaks, all green.

## Bonus prizes we're entering

- **Best Creative Build (Muse Image):** shot-list → Muse Image illustrations with object/scene consistency modes and real SAM outlines on AI art; the demo film's art and icons are Muse Image too, with real SAM boxes.
- **Best Agentic Use-Case:** a multi-step, self-checking pipeline (transcribe → two-layer gate → steps → frame review → SAM → publish) plus a step-aware voice agent.
- **Most Viral on X:** post below, engagement through Nov 8.
- **Community Vote:** gallery opens Nov 9.

## YouTube description

Showhow: YouTube can't see you're stuck. This can.

Turn a narrated how-to video, or just a spoken explanation, into a step-by-step guide that checks your work. Stuck? Send one photo: Meta Muse Spark compares it with the creator's real frame and SAM 3.1 outlines what's different, on your photo.

Built solo in 9 days for the Meta Global AI Developer Hackathon with Muse Spark, Muse Voice Transcribe, SAM 3.1 and Muse Image.

Try it: https://goodfix-alpha.vercel.app
Code: https://github.com/muhammadtalhaishtiaq/goodfix

Every product shot is the live app with real model calls; waits are shortened and marked with ⏩. Illustrations are made with Meta Muse Image and labelled as AI.

Music: "Inspired" by Kevin MacLeod (incompetech.com), licensed under CC BY 4.0. Sound effects: Kenney Interface Sounds (CC0). Voiceover: Kokoro (AI voice).

## X thread

1/ YouTube can't see you're stuck. Showhow can. 🛠️
Film a how-to once, talking as you go. Showhow turns it into a step-by-step guide that checks your work. Stuck? Snap one photo. [video]
Built solo in 9 days with @AIatMeta's Muse Spark, Voice Transcribe, SAM 3.1 and Muse Image. #MetaHackathon @cerebral_valley

2/ The "I'm stuck" moment: Muse Spark compares your photo with the creator's real frame. SAM 3.1 outlines what's different, on YOUR photo. Match, differs or unclear: it never guesses. [GIF]

3/ No video? Just talk it through. Muse Spark writes a shot list for every step and Muse Image draws it, always labelled as AI. [image grid]

4/ Still unsure? Ask out loud. The agent knows which step you're on, answers in the creator's own words, and labels anything extra as an AI suggestion.

5/ Try it free → https://goodfix-alpha.vercel.app
Code → https://github.com/muhammadtalhaishtiaq/goodfix
Would you trust a tutorial that can see your work? 👇
