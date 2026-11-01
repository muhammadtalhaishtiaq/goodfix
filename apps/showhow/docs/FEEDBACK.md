# Showhow Test Feedback Log

Talha's findings from hands-on testing, recorded as they arrive. Each item gets an ID, is triaged, and links to the task/decision/doc change that resolves it. When an item is fixed, the fix commit and the docs updated are noted here.

**Status key:** 🆕 new · 🔍 investigating · 🔨 fixing · ✅ fixed (commit) · ⏸ deferred (reason)

| ID | Date | Area | Finding (Talha's words, lightly edited) | Status | Resolution / docs updated |
|---|---|---|---|---|---|
| F1 | 2026-11-01 | UI | The UI looks like AI slop. Audit the design system (colours, padding, styles) and save it; restyle after testing. | ⏸ | Audit done 2026-11-01 → [`UI-AUDIT.md`](UI-AUDIT.md): recommends a "Workshop manual" direction; found real contrast/touch-target defects. Restyle is **T19**, scheduled after testing |
| F2 | 2026-11-01 | Voice · safety | Is speech turned into text first and then checked for illegal, harmful, 18+ or not-for-public content? That step isn't explained on the page or in the privacy policy. | 🆕 | Order confirmed: Transcribe → layer 1 hard rules → layer 2 Muse Spark review → save. **Gaps:** (a) neither layer covers adult/sexual content, hate/harassment or spoken personal details; (b) the Create page doesn't explain the check before recording, and the privacy page doesn't say *what* is checked. Fix: extend `safety.ts` (+tests), add a "How we check" explainer on both Create pages and the privacy page; update PRD §3, ARCHITECTURE §9, DECISIONS |
| F3 | 2026-11-01 | Create · access code | What is the access code, where do I get one, and when did we decide on it? | 🆕 | Decided 2026-10-30 (pivot decision): creation only, to protect credits, moderate public content and stay a fixed-purpose app under Meta Terms §10.1(i). Codes live in `.env.local` `CREATE_ACCESS_CODES` (comma-separated). **Gap:** the form never explains it. Fix: helper text + "Need a code?" note (hackathon judges get one in the submission notes); a clear message on a wrong code; README section for the owner |
| F4 | 2026-11-01 | Video · safety parity | Apply the voice path's safety fixes to video guides too. | 🆕 | Today video narration gets layer 1 only (added 2026-11-01). Fix: run the same layer-2 Muse Spark review on the video transcript in `/api/steps`; consider a frame check (Spark on 2–3 keyframes) for visible adult/unsafe content before publish; same explainer copy as F2 |

