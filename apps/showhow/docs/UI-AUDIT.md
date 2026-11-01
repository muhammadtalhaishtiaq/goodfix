# UI audit: why Showhow reads as "AI slop", and what to change

**Date:** 2026-11-01 · **Scope:** visual design only (no app code changed) · **Reviewed:** `src/index.css`, `src/App.tsx`, `src/app/*.tsx`, `src/components/*.tsx`, `index.html`, `design/showhow-prototype.html`, live dev server at `http://localhost:5173` (screenshots below).

## Summary

1. The CSS is a faithful port of the prototype, and the prototype uses the 2024–25 default "friendly AI startup" kit: beige paper, forest green, Bricolage Grotesque, pills everywhere, 1px beige borders on every box, a two-line slogan hero with a highlighted second line, and a 3-step "how it works" card stack.
2. Nothing is wrong enough to break things. The problem is that nothing is specific to *hands-on instructions*. Every surface has the same weight (bordered, rounded, cream), so the step instruction and the outline (the product) don't stand out.
3. The system has drifted: 16 font sizes (including 11.5/12.5/13.5/14.5px), 21 spacing values off any grid, 14 radius values, and 15 identical `1px solid var(--line)` boxes whose border is 1.32:1 against the page.
4. Real defects: `--ink-3` text fails 4.5:1 (3.35–4.06), white on the orange "I'm stuck" button is 3.44:1, the timeline segments are 28px tall, `<select>` doesn't inherit the font, and the empty-state link renders as browser-default blue.
5. **Recommendation: "Workshop manual"** (option A). Neutral paper, near-black ink, square-ish corners, hairline rules instead of cards, IBM Plex Sans/Condensed/Mono, big step numbers, and safety orange reserved for SAM outlines and "stuck" only. That's about half a day of CSS plus small JSX touches.

---

## 1. Current system (as implemented)

### Colour tokens (`src/index.css:3-7`, identical to prototype `design/showhow-prototype.html:12-16`)

| Token | Hex | Where used | Note |
|---|---|---|---|
| `--paper` | #F5F0E6 | body bg, `.tip`, `.drop`, `.opt`, `.recorder`, `.rv`, `.note`, `.linkbox`, `.built-steps li`; `theme-color` in `index.html:7` | beige "notebook" |
| `--surface` | #FFFCF6 | `.how li`, `.card`, `.steps`, `.player`, `.panel`, `.search`, `.chip`, `.btn-ghost`, `.dialog`, inputs | 1.04:1 vs paper, so surfaces only separate because of the border |
| `--surface-2` | #EEE6D7 | `.thumb`, `.ph` hatch, `.seg`, `.bar`, active nav | |
| `--line` | #DCD2C0 | 15 × `border: 1px solid var(--line)` + 4 dashed | **1.32:1** vs paper |
| `--ink` | #1D1B18 | text, `.stuck-cta` bg, active chip, `.fixture-tag` | |
| `--ink-2` | #5A5248 | secondary text | 6.76:1 OK |
| `--ink-3` | #857B6E | `.muted`, `.ph`, `.seg`, `small`, footer, timeline label | **3.66 on paper, 4.06 on surface, 3.35 on surface-2: fails** |
| `--primary` / `-hover` / `-soft` | #1F5A4C / #174538 / #DCE9E3 | primary buttons, current step, progress, focus ring, icon tiles | |
| `--signal` / `-soft` | #EE5A17 / #FDE4D5 | SAM outline, "I'm stuck", `.pill.on`, hero highlighter, `.part` | white on it **3.44:1 fails** |
| `--ok` / `-soft` | #2C7A4B / #DDEFE3 | match verdict, done steps, `.how` #3 | 4.39:1 on soft (just fails) |
| `--warn` / `-soft` | #A8500B / #FBE9D2 | differs/unclear verdict, error notes | 4.63 OK |
| hard-coded | #1D1B18 (stage bg ×5), #D24C10, #E8DFCF, #CFC6B6, #8A3A0C, rgba(29,27,24,.82/.84/.55) | `.stage`, `.btn-signal:hover`, `.ph`, `.stuck-cta span`, `.part`, `.badge`/`.pill`/`.backdrop` | raw values bypass the tokens |

Green (primary) and green (ok) are near-duplicates, and orange (signal) and orange (warn) are near-duplicates. That leaves effectively two hues doing four jobs.

### Typography

| Item | Value | Where |
|---|---|---|
| Families | Bricolage Grotesque 500/700/800 (display), Atkinson Hyperlegible 400/700 (body) | `index.html:12`, `index.css:10-11` |
| Body | 16px / 1.55 | `index.css:15` |
| H1 | clamp(28,3.6vw,42) 800; hero clamp(38,5.4vw,64) | `:17`, `:51` |
| H2 | step clamp(24,2.6vw,32) 800; dialog 22; share 26; prose 22 | `:118`, `:137`, `:239`, `:262` |
| H3 | card 19 700; verdict 20 | `:76`, `:170` |
| Other sizes in use | 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 17, 18, 19, 20, 21, 22, 26 | 16 distinct fixed sizes, 4 of them half-pixels |
| Weights | 400 / 700 / 800 only, with 700 on almost every label, chip, nav link, button and tag | all-bold UI flattens hierarchy |
| Eyebrow | 13px 700 uppercase +.06em, primary colour ("STEP 2 OF 4") | `:117` |
| Numerals | Atkinson's slashed zero shows in timecodes ("00:31–00:58") and "500 MB" / "720p" | screenshots `guide-desktop.png`, `create-desktop.png` |
| `<select>` | not in `button, input, textarea { font: inherit }` so it renders in the system font at ~13px | `:18`, visible in `create-desktop.png` |

### Spacing (padding / gap / margin values found in `index.css`)

`1, 2, 3, 4(×7), 6(×23), 8(×29), 9, 10(×30), 12(×22), 14(×15), 16(×19), 18(×5), 20(×12), 22(×5), 24, 28, 32, 36, 40, 70, 80` px. That's 21 values. The most common ones (6, 10, 14) sit off an 8-pt grid, and padding pairs like `9px 12px`, `14px 16px`, `16px 18px` and `20px 22px 22px` look hand-tuned per component.

### Radii, shadows, borders, motion

| Item | Values |
|---|---|
| Radii | `--radius` 14 (×10), `--radius-sm` 9 (×11), 999px/99px pill (×9), 50% (×7), 6px (×8), 4, 3, 10, 12, 14, 18px. That's 14 distinct values. |
| Pills (999px) | nav links, every `.btn`, `.search`, `.chip`, `.badge`, `.pill`, `.part`, `.linkbox`, `.frame-tag` |
| Shadows | `--shadow` used once (`.card:hover`), dialog has its own (`:135`). Otherwise flat, and depth comes only from 1.32:1 borders. |
| Borders | 15 × 1px `--line` boxes; 4 × 2px dashed (`.empty :80`, `.opt :142`, `.drop :210`, `.recorder :253`); SAM outline is also dashed "marching ants" (`:104`) |
| Icons | Lucide-style 2px stroke, 20px (`Icon.tsx`). 61 `<Icon>` uses across 6 files, which puts an icon in nearly every button, note, recipient row and tab. |
| Motion | `.card:hover` translateY(-3px) .18s; `.btn` bg .15s; `.bar` width .3s; spinner; marching ants 1.2s infinite. `prefers-reduced-motion` respected (`:182`). |
| Placeholder | `.ph` 135° beige hatch (`:27`) fills the whole video stage when there is no media |

### Accessibility check

| Check | Result |
|---|---|
| Contrast 4.5:1 | Fails: `--ink-3` everywhere (3.35–4.06), white on `--signal` 3.44 (the hero CTA of the guide page), `--signal` on `--signal-soft` 2.82 (`.how` step 2), `--ok` on `--ok-soft` 4.39 |
| 44px touch targets | Fails: `.seg` 28px (`:113`), `.chip` 40px (`:66`), `.pill` 40px (`:108`), `.back` 40px (`:83`), `.nav a` ≈41px (`:35`); checkboxes 20px (their labels are clickable, which is OK) |
| Focus | Good global `:focus-visible` 3px ring (`:21`). Inputs swap the outline for a 3px `--primary-soft` glow (1.2:1, too faint); the border colour change carries it. |
| Text < 12px | `.fixture-tag` and `.ai-tag` 11.5px (`:25`, `:228`), `.av` 11px |
| Links | No base `a` colour rule (the prototype had `a{color:inherit}`), so "Create the first one" is default `#0000EE` blue (`gallery-desktop.png`) |

---

## 2. Why it looks generic (with evidence)

1. **Template hero formula.** Two-beat slogan, second line in brand colour with a highlighter swipe (`GalleryView.tsx:22`, `index.css:52`), grey paragraph, and a right-hand stack of three numbered cards with three tinted number squares (green/orange/green, `index.css:55-58`). This is the most recognisable AI-landing layout there is, and it takes about 70% of the first screen (`gallery-desktop.png`, `gallery-phone.png`). The product (a video with an outline on it) appears nowhere.
2. **Everything is a pill.** Nine component types use `border-radius: 999px`. Primary actions, filters, tags, labels, the search box and the share link all have the same capsule silhouette, so shape carries no meaning (`create-desktop.png`: tabs, buttons and nav all look alike).
3. **Uniform cream cards with ghost borders.** Fifteen components are `surface + 1px #DCD2C0 + 14px radius`. At 1.32:1 the border reads as a fuzzy halo, and because every container has one, nothing ranks above anything else. On the guide page the step list, player and instructions are all the same box (`guide-desktop.png`).
4. **Beige + forest green + orange is the default 2024 "warm SaaS" palette**, and the hues overlap: two greens (primary, ok) and two oranges (signal, warn). Orange is meant to mean "SAM found this", but it also paints the hero highlighter, step-2 icon tile, key-part chip, Show-part toggle and recording button, so the outline isn't special.
5. **Trend font.** Bricolage Grotesque at 800 with tight tracking is one of the most-used "indie AI startup" display faces of 2024–25. Paired with all-700 UI text, every label shouts equally.
6. **An icon in every button and row** (61 `<Icon>` uses). Back, Next, Publish, Copy, Send, each consent row and each tab all get a 20px stroke glyph. That's decoration, not information.
7. **Dashed boxes as the "friendly upload" trope** (`.drop`, `.opt`, `.recorder`, `.empty`). Dashes also mark the SAM outline, so a dashed line means both "drop here" and "AI found this part".
8. **Uppercase tracked eyebrow** ("STEP 2 OF 4", `index.css:117`). It's a generic marketing device. In a manual the step number should be the biggest thing on screen, not a 13px caption.
9. **Weak hierarchy on the core screen.** At 1366×1000 the instruction (the creator's words) starts at y≈970, below the fold, under a 16:10 stage that can be all beige hatch (`guide-desktop.png`). On phone the instruction is 17px under a 32px title, with the key part as a small peach pill (`guide-phone.png`).
10. **No real imagery or texture.** Empty gallery: dashed box plus a blue link. Missing media: diagonal beige stripes (`.ph`). Only the voice-style picker shows real pictures (`voice-desktop.png`), and it's the most convincing part of the UI.
11. **Inconsistency gives away the hand-tuning.** Half-pixel font sizes, 21 spacing values, and the nav "Gallery" pill gains a background only on `#/` (`index.css:36`) so the header changes between pages. The `<select>` uses a different font from the inputs next to it.
12. **Copy tone.** Model names in progress copy and the footer ("Meta Voice Transcribe: your words → text", "built with Muse Spark, SAM 3.1, …") plus slogan headlines read like a tech demo talking about itself, not a manual talking to someone with a screwdriver in hand. (Model credit belongs in a single "How it works" disclosure and the submission, not on every screen.)

The design tool (`ui-ux-pro-max`) was run for "how-to tutorial repair step-by-step guidance practical trustworthy mobile-first DIY". It returned a "Vibrant & Block-based" style with **#2563EB blue + #F97316 orange on #F8FAFC**, with Atkinson Hyperlegible for headings and body. That palette is the most generic one possible and would make the slop problem worse, so I rejected it. I kept its useful parts: Atkinson/hyperlegibility as the accessibility baseline, the funnel idea (progressive disclosure, visible progress, one CTA per step), and its checklist (4.5:1, 44px, 8px gaps, visible focus, 150–300ms, reduced motion). Its colour database had no match for "tools/hardware/workshop". The "LMS" palette (teal + amber) was the closest and is also generic.

---

## 3. Direction

### Option A (recommended): "Workshop manual"

The reference is a good printed instruction sheet (IKEA, Haynes, a Leatherman insert) crossed with a field notebook. Neutral off-white paper, near-black ink, **hairline rules and numbered sections instead of floating cards**, small radii, big step numbers, mono for anything measured (timecodes, step counts, labels). One loud colour, **safety orange, used only for what SAM found and for "I'm stuck"**, so when it appears it means "look here". Provenance labels (real frame vs AI) get their own visual language.

Why it fits: the audience has busy hands and glances at a phone, and manuals are built for exactly that (big number, short instruction, one picture with an arrow). It's also distinctive in a hackathon gallery full of gradient/beige AI UIs, and it makes the outline (the demo moment) the most saturated thing on screen.

### Option B (alternative): "Darkroom stage"

A dark media-first UI like a video editor or camera app. Near-black page, the video stage fills the width, steps as a filmstrip under it, and instructions in a bottom sheet over the stage on phones. Orange outlines glow on black. **Pros:** very cinematic for the 3-minute demo video, and media pops. **Cons:** worse for long reading and forms (create flow, consent, privacy), dark UIs in bright kitchens/garages wash out, and it needs more JSX restructuring (bottom sheet). Better as a later "follow mode" than as the whole app.

---

## 4. Token spec (Option A)

### Colour

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--paper` | #F4F3EF | page background (neutral, not beige) | |
| `--surface` | #FFFFFF | inputs, dialog, media frames | |
| `--surface-2` | #EAE8E2 | wells: progress track, timeline, empty media | |
| `--rule` | #D4D1C8 | hairlines between sections (decorative only) | |
| `--rule-strong` | #8C887F | input borders, card edges that must be seen | 3.18 vs paper (≥3:1 UI) |
| `--ink` | #161614 | text, primary button bg, step numbers | 16.3 on paper |
| `--ink-2` | #45433E | secondary text | 8.9 |
| `--ink-3` | #65625B | captions, meta, placeholders | 5.48 on paper, 6.08 on white |
| `--on-ink` | #FFFFFF | text on ink buttons | 18.1 |
| `--signal` | #FF5A1F | **SAM outline stroke and fill only** (non-text, on media) | 6.06 on black stage |
| `--signal-ink` | #C2410C | "I'm stuck" button bg, key-part marker text | white on it 5.18 |
| `--signal-soft` | #FCE9DE | differs-verdict bg | |
| `--differs` | #9A3412 | differs-verdict text | 6.21 on soft |
| `--ok` | #17663A | match verdict text, done-step tick | |
| `--ok-soft` | #E3F1E8 | match verdict bg | 6.01 |
| `--unclear` | #3F4A5A | unclear verdict text | |
| `--unclear-soft` | #E7EAEE | unclear verdict bg | 7.44 |
| `--focus` | #1D4ED8 | focus ring (only blue in the app, so it's always recognisable) | ≥3:1 vs paper and white |
| `--stage` | #111110 | video / photo letterbox | |

Remove forest green as a brand colour. Ink is the brand colour; orange is the product's voice. `theme-color` in `index.html` becomes #F4F3EF.

### Type (Google Fonts: IBM Plex Sans 400/500/600/700, IBM Plex Sans Condensed 600/700, IBM Plex Mono 500)

One superfamily, engineered and manual-like, with an unslashed, readable zero in Sans and tabular figures in Mono. Atkinson Hyperlegible is an acceptable body fallback if the owner wants to keep it, but then use Plex Mono for every number.

| Role | Font | Size / line-height | Weight | Notes |
|---|---|---|---|---|
| Display (gallery H1 only) | Plex Sans Condensed | 48/52 desktop, 34/38 phone | 700 | -0.01em; no colour swap, no highlighter |
| H1 page title | Plex Sans Condensed | 36/40 · 28/32 | 700 | |
| Step number | Plex Mono | 56/56 · 40/40 | 500 | the "1." of the manual |
| H2 step title | Plex Sans | 28/34 · 22/28 | 600 | |
| H3 card / dialog | Plex Sans | 20/26 | 600 | |
| Instruction (lead) | Plex Sans | 20/30 · 18/28 | 400 | the most important text on the page; max 38em |
| Body | Plex Sans | 16/24 | 400 | |
| UI label / button | Plex Sans | 16/20 | 600 | not 700 everywhere |
| Small / meta | Plex Sans | 14/20 | 400 | min size for anything readable |
| Mono label | Plex Mono | 13/16 | 500 | timecodes, "STEP 2/4", `TEST FIXTURE`, provenance tags; uppercase +0.04em allowed **only** here |

Delete the half-pixel sizes. The scale is 13 · 14 · 16 · 18 · 20 · 22 · 28 · 36 · 48 · 56.

### Spacing (8-pt, 4 for fine adjustment)

`--s1 4 · --s2 8 · --s3 12 · --s4 16 · --s5 24 · --s6 32 · --s7 48 · --s8 64`. Map 6→8, 9/10→8 or 12, 14→12 or 16, 18/20/22→16 or 24, 28/36/40→32 or 48. Component padding uses only 12/16/24, and section gaps use 32/48.

### Radii

`--r-0 0` (rules, media inside panels) · `--r-1 4px` (buttons, inputs, chips, tags, timeline) · `--r-2 8px` (media frames, dialog, verdict) · `50%` only for the step-number dot on done steps and the avatar. **No 999px anywhere.**

### Elevation and borders

- Default: no shadow, no border. Separate sections with a 1px `--rule` top hairline and whitespace (manual style).
- Interactive edges (inputs, ghost buttons, selectable style tiles) get 1.5px `--rule-strong`.
- Only floating things get a shadow: dialog `0 24px 64px -16px rgba(0,0,0,.35)`, sticky header `0 1px 0 var(--rule)`.
- Dashed lines are reserved for **AI/not-real**: the "Illustration by AI" / "Enhanced by AI" frame edge. The SAM outline is solid orange (no marching ants): it's evidence, not a placeholder. Drop zones use a solid `--rule-strong` border plus a large icon, with no dashes.

### Motion

150ms colour and background transitions; 200ms outline fade-in (opacity, plus a stroke-dashoffset draw-on once, not looping). No hover lift on cards. Keep the reduced-motion block.

---

## 5. Component rules

- **Buttons.** Rectangular, 4px radius, min-height 48px (phone) / 44px (desktop), 16px/600, padding 12×20. Primary: ink bg, white text. Secondary: transparent with 1.5px `--rule-strong`. Signal (only "I'm stuck" and recording): `--signal-ink`. **Icons only where they add meaning:** camera on "I'm stuck", mic on record, play/pause, close. Remove them from Back/Next/Publish/Copy/Try again/Gallery and the consent rows.
- **Chips / filters.** Text-tab style: 44px tall, no border, 600 weight, active state is ink text with a 2px ink underline (not a filled black capsule). Create tabs ("Film it / Talk it through") use the same tab style.
- **Step list (desktop).** A ruled numbered list, not a card: each row is a 56px mono number column + title + mono timecode, separated by `--rule` hairlines. The current step gets a 4px ink bar on the left and ink text; done steps show a green tick replacing the number. Progress is "2/4" in mono plus a 4px track at the top.
- **Step list (phone).** A sticky compact header showing "STEP 2/4" (mono), a 4-segment progress track and prev/next arrows (44px). Drop the sideways-scrolling chip strip; the full list opens from a "All steps" button as a sheet.
- **Guide content order.** On desktop use a two-column split inside the content area: media 7 cols, **step number + title + instruction + key part 5 cols beside it**, so the instruction is above the fold. On phone the order is media → number/title → instruction → key part → actions.
- **Video / stage.** 8px radius, `--stage` letterbox, no border. Overlay labels are square 4px mono tags (black 85% bg) in the top-left: `00:31–00:58 · AHMED R.'S VIDEO`. Controls (play, show part) are 44px square buttons in the bottom-left. Timeline segments: 44px tall hit area (12px visible bar plus padding), numbered in mono.
- **Key part.** Not a pill. Use an inline marker: a 12px solid orange square + "Key part:" label + the part name in 600, matching the outline legend on the stage.
- **Creator tip.** A ruled pull-quote: 3px `--ink` left rule, the quote at 18px, and a mono caption "AHMED R., IN THE VIDEO · TRANSCRIBED". No mic-in-circle.
- **"I'm stuck" block.** Keep it as the one inverted (ink) block on the page, with square corners and the orange `--signal-ink` button. Title 22/600, one sentence.
- **Verdict cards.** 8px radius, soft bg + 4px left bar in the verdict colour, H3 states the verdict in words ("Looks like the creator's step" / "Something's different" / "Photo unclear"), and differences as a plain list. Colour is never the only signal: the heading words carry the meaning.
- **Consent / recipients list.** A ruled table, not bordered cards: columns are **Who** (600) · **What happens** · **Keeps it?** (mono tag: `LOCAL`, `STORES`, `PROCESSES`, `PUBLIC`). No icons. The approve checkbox rows are 48px tall with a 24px box.
- **Forms.** Label 14/600 above the field, inputs 48px tall, 1.5px `--rule-strong`, 4px radius, white bg, focus = 2px `--focus` ring. `<select>` inherits the font. Put the media drop zone (the main input) **first**, with the metadata fields after it.
- **Gallery cards.** No card box: image (8px radius, 4:3), then the title (20/600) and a meta line in 14px (`creator · category · 4 steps`). Hover underlines the title. Labels sit on the image as square mono tags.
- **Provenance labels.** A fixed vocabulary in Plex Mono 13/500 uppercase, 4px radius:
  - `TEST FIXTURE`: ink bg, white text.
  - `ILLUSTRATION BY AI` / `ENHANCED BY AI · NOT THE ORIGINAL FRAME`: white bg, ink text, **1.5px dashed ink border**, and the image frame itself also gets a dashed 1.5px edge.
  - Real frames are untagged except for the timecode tag. This makes "real vs AI" readable at a glance without reading.
- **Empty / missing media.** Replace the beige hatch with `--surface-2` plus a centred line icon and one sentence in `--ink-2`. In the empty gallery, show a real example frame with a SAM outline and a "Create a guide" button, not a dashed box with a blue link.
- **Notes / errors.** 4px left bar (warn = `--differs`, info = `--ink-3`) on `--surface-2`, no icon tile.

## 6. Layout rules

- **Container:** max 1200px, 12-column grid, 24px gutters; side margins 24px desktop, 16px phone. Reading pages (create, privacy) are capped at 720px.
- **Breakpoints:** 0–599 phone, 600–1023 tablet (single column, wider media), ≥1024 desktop (two columns). Replace the current 900/600 split.
- **Gallery (desktop):** a compact intro (H1 + one sentence + primary button, 4 columns' worth) next to **a real outlined example frame** (8 columns) instead of the 3-card how-to. The "how it works" becomes one ruled numbered line under it. Grid of 3 cards at ≥1024, 2 at 600–1023, 1 on phone.
- **Guide (desktop):** step list 3 cols (sticky), media 6 cols, instruction 3 cols; or, if the side list feels cramped, list in a top bar and media 7 / instruction 5. The instruction must be visible at 1366×768 without scrolling.
- **Guide (phone):** sticky step header (56px) → media full-bleed (no side margin, 0 radius) → instruction → actions as a sticky bottom bar (Back · Done, next) within thumb reach, with "I'm stuck" directly above it.
- **Header:** logo left, "Guides" and "Create" right as text tabs; active state is an underline, the same on every page.
- **Footer:** one line, "Showhow · hackathon prototype · Privacy · How it works". Move the model list into "How it works".

---

## 7. Prioritised change list (about half a day, biggest visual gain first)

| # | Change | Files | Est. |
|---|---|---|---|
| 1 | Swap fonts to IBM Plex Sans / Sans Condensed / Mono. Add `select` to the font-inherit rule. Add `a { color: inherit }`. Remove half-pixel sizes using the type scale. | `index.html:12`, `src/index.css:10-18` and size declarations | 45m |
| 2 | Replace the colour tokens with the Option A table (neutral paper, ink primary, orange reserved). Retarget `.btn-primary`, current-step and progress to ink, and `.btn-signal` to `--signal-ink`. Fix `--ink-3`. Delete raw hex values. `theme-color`. | `src/index.css:3-7` + uses; `index.html:7`; logo fill in `src/App.tsx:32` | 45m |
| 3 | Kill pills and halos: radius tokens 0/4/8; remove `999px` (9 places); remove `border: 1px solid var(--line)` from `.how li, .card, .steps, .player, .panel` and use rules + whitespace; inputs/ghost buttons get 1.5px `--rule-strong`. | `src/index.css` (`.btn :41`, `.chip :66`, `.search :62`, `.badge :73`, `.pill :108`, `.part :120`, `.linkbox :241`, `.frame-tag :235`, `.nav a :35`, containers) | 45m |
| 4 | Guide page hierarchy: big mono step number, 20px instruction beside the media on desktop, key part as an inline marker, tip as a ruled quote, solid (non-animated) SAM outline. | `src/app/GuideView.tsx:46-75`, `src/index.css:85-131, 104-105` | 60m |
| 5 | Gallery hero: drop the 3-card `.how` and the highlighter. Use a compact intro + a real outlined example frame (a fixture keyframe + overlay, labelled `TEST FIXTURE` if it's a fixture). Replace the empty-state dashed box. | `src/app/GalleryView.tsx:20-30, 60`, `src/index.css:50-60, 80` | 45m |
| 6 | Provenance tags: one mono tag style; dashed edge reserved for AI images; replace `.ph` hatch. | `src/index.css:25-27, 228-235`, `GuideView.tsx:96,160`, `GalleryView.tsx:50-51`, `CreateView.tsx:206`, `VoiceCreate.tsx:154` | 30m |
| 7 | Touch targets: `.seg`, `.chip`, `.pill`, `.back`, `.nav a` ≥ 44px; checkbox rows 48px. | `src/index.css:35, 66, 83, 108, 113, 216-217` | 15m |
| 8 | Strip decorative icons (Back/Next/Publish/Copy/Try again, consent rows, tabs) and turn consent lists into a ruled Who/What/Keeps table with mono tags. | `CreateView.tsx:159-163, 169, 223, 262-264`, `VoiceCreate.tsx:111-115, 187-188`, `StuckDialog.tsx:106-110`, `src/index.css:157-159` | 30m |
| 9 | Create page order: drop zone/recorder first, then fields. Text-tab style for Film/Talk. | `CreateView.tsx:141-155`, `VoiceCreate.tsx:86-94, 184-190`, `src/index.css:243-244` | 20m |
| 10 | Copy pass: take model names out of progress lines and the footer and put them in one "How it works" disclosure. Plain verbs ("Finding the steps in what you said…"). | `CreateView.tsx:186-195`, `VoiceCreate.tsx:126, 140`, `StuckDialog.tsx:123`, `App.tsx:48` | 20m |

Later (not half-day): phone sticky step header + bottom action bar (`GuideView.tsx`, `index.css` ≤599px block); the Option B "follow mode" for the demo video.

After 1–3, re-shoot the same screenshots and compare. Those three alone remove most of the "template" signal.

---

## 8. Screenshot paths (taken 2026-11-01 against `http://localhost:5173`, headless Chrome)

Folder: `/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/ui-audit/`

| Route | 1366px | 500px |
|---|---|---|
| `#/` (gallery, empty live data) | `gallery-desktop.png` | `gallery-phone.png` |
| `#/create` | `create-desktop.png` | `create-phone.png` |
| `#/create/voice` | `voice-desktop.png` | `voice-phone.png` |
| `#/privacy` | `privacy-desktop.png` | `privacy-phone.png` |
| `#/guide/fixture-bookcase/2` (TEST FIXTURE, no video) | `guide-desktop.png` | `guide-phone.png` |

Not captured: the StuckDialog states and a guide with real video/outlines (needs a live published guide and a photo upload).
