# WIREFRAME AUDIT — Implementation vs. Wireframes (v0.1)

> **Date:** 2026-09-20 · **Type:** read-only audit (no code modified) · **Scope:** v0.1 screens only
>
> **Sources:** `~/workspace/vault/docs/WIREFRAMES.md` (wireframe sections cited as §A#1 etc.),
> `~/workspace/vault/docs/V01-SCOPE.md` (the 6-screen v0.1 lock), implementation in
> `~/workspace/vault/code/src/ui/` (`screens/`, `components/`, `theme.ts`, `navigation.tsx`).
>
> **v0.1 lock reminder (V01-SCOPE §1):** exactly six screens — (1) Welcome, (2) Home/conversation,
> (3) Voice capture, (4) Memory, (5) Action-confirm modal, (6) Privacy dashboard. Setup flow
> (§A #3 model download, §A #4 permissions) is part of onboarding.

---

## 1. Screen-by-screen findings

### 1.1 Welcome — `screens/Welcome.tsx` vs wireframe §A #1

**Matches**
- Big friendly headline, privacy-forward subtitle, primary "Get started" button.
- Persistent "Private · on-device" badge (teal dot) at the bottom.
- Calm off-white/teal styling; 12px radius; generous spacing.

**Deviates**
- **Headline copy:** wireframe says *"Your private AI. It never leaves your phone."* —
  implementation has *"Your AI. Your phone."* (`Welcome.tsx`, `styles.title`). Weaker privacy
  promise; the core v0.1 trust message is diluted.
- **Subtitle copy:** impl says *"…and never phones home."* — "phones home" is tech jargon;
  wireframe language is plain ("It never leaves your phone").
- **Missing illustration:** wireframe #1 specifies "a simple illustration of a phone with a lock".
  Implementation has none (`Welcome.tsx`, `hero` block).
- **Missing link:** wireframe #1 specifies a subtle link *"How your privacy works"* → which leads to
  wireframe §A #2. Implementation has no such link, and §A #2 has **no screen at all**
  (see §2.1).

**Design system:** ✅ colors/radius/whitespace correct. Badge present. ⚠️ "phones home" violates
"never techy" tone.

---

### 1.2 Onboarding (model download) — `screens/Onboarding.tsx` vs wireframe §A #3

**Matches**
- Progress % during download, size note ("about 2 GB"), reassuring copy
  ("Download once over Wi-Fi and it works offline").
- "Private · on-device" badge present. Calm styling.

**Deviates**
- **Progress shape:** wireframe #3 specifies *"Centered progress ring with %"*. Implementation
  uses a horizontal progress bar (`Onboarding.tsx`, `progressWrap`). Cosmetic, but not the wireframe.
- **Wireframe headline:** *"Setting up your private AI — downloads once, then works offline."*
  Impl title: *"One download, then it's yours."* Close in spirit, not the locked copy.
- **"Demo mode" leakage:** "Skip for now (demo mode)" button (`Onboarding.tsx`, `handleSkip`)
  and error text *"Model module not ready yet — use demo mode."* — "demo mode" is
  developer-facing terminology, not consumer language, and the wireframe has no demo mode.

---

### 1.3 Home / Conversation — `screens/Home.tsx` vs wireframe §B #6

**Matches**
- Quick-action chips (3: "📝 Note this", "⏰ Remind me", "🧠 What did I say about…") that
  prefill the input — matches wireframe "Quick-action chips".
- Mic + text input bar with Send; mic opens VoiceModal.
- "Private · on-device" badge in the header (teal dot) — matches the persistent badge.
- Bottom tab bar present.

**Deviates**
- **Tab set:** wireframe app-shell spec says bottom tab bar is
  `Home · Skills · Memory · Automations · Settings` (5 tabs). Implementation (`navigation.tsx`,
  `MainTabs`) has **3 tabs: Home · Memory · Privacy**. (Skills/Automations/Settings are correctly
  out of v0.1 scope — but the 3-tab set is an undocumented deviation from the shell spec; fine for
  v0.1 if deliberate, just note it.)
- **Techy fallback copy:** when the agent module isn't ready, Home pushes
  *"The agent module isn't bundled in this build yet — your message is noted…"*
  (`Home.tsx`, `send()`). Consumer-facing text that exposes build internals.
- **Error copy:** *"Something went wrong reaching the agent: …"* and
  *"That didn't go through: …"* — acceptable-ish, but "the agent" is borderline jargon for the
  wireframe's non-technical audience.

**Design system:** ✅ colors/radius correct. Badge present. Empty state ("What can I do for you?")
is warm and on-tone.

---

### 1.4 Action confirmation (trust gate) — `components/ActionConfirmModal.tsx` (+ `Home.tsx` fallback) vs wireframe §B #10

**Matches**
- Modal shows the exact prompt/preview of what the agent wants to do.
- Confirm + Cancel buttons; calm card styling; 12px radius.

**Deviates — these are trust-gate contract gaps (V01-SCOPE §3)**
- **Missing "Edit" button:** wireframe #10 requires **three** buttons: *Confirm, Edit, Cancel*.
  Implementation has only Confirm + Cancel (`ActionConfirmModal.tsx`, `row` block).
  The user cannot correct the action before approving — the wireframe's whole "did you mean
  this?" affordance is absent.
- **Missing "Always allow this kind of action" checkbox:** explicitly required by wireframe #10.
  Not present anywhere in the modal.
- **Presentation:** wireframe #10 specifies a *bottom-sheet*. Implementation is a centered modal
  (`animationType="fade"`, centered card). Cosmetic, but not the wireframe.
- **Duplicate implementation:** `Home.tsx` contains `FallbackConfirmModal` — a second copy of the
  trust gate that uses **"Approve"** instead of **"Confirm"** (`Home.tsx`, `FallbackConfirmModal`).
  Two implementations of the trust gate, with inconsistent button copy. See verdict in §4.

---

### 1.5 Voice capture — `screens/VoiceModal.tsx` vs wireframe §B #7

**Matches**
- Big hold-to-talk button, live transcript (editable `TextInput`), "Save to memory" primary
  action, "Private · on-device" badge.
- Title "Capture a note" is on-tone.

**Deviates**
- **No animated waveform:** wireframe #7 requires an *animated waveform*. Implementation has a
  static mic circle that turns **red** (`theme.danger`) while listening
  (`VoiceModal.tsx`, `talkButtonActive`). Red for "recording" is conventional, but the wireframe
  asks for a waveform, and the design system says "one teal accent" — the red state is a minor
  design-system deviation.
- **No "Saved to your private memory" confirmation state:** wireframe #7 ends with that explicit
  reassurance. Implementation navigates back and pushes a chat message:
  *"Saved to your private memory (agent not ready yet — stored locally)."* — the parenthetical
  is developer-facing leakage that undermines the wireframe's clean reassurance.
- **Missing mic-permission context:** depends on the missing §A #4 permissions screen (§2.2).

---

### 1.6 Memory — `screens/Memory.tsx` vs wireframe §E #15b

**Matches**
- Search bar, note cards with kind badges + dates, tap-to-expand, Delete with native confirm
  ("This permanently deletes the note from this phone." — excellent, on-tone).
- `.md` footer: *"Your memory lives in .md files on this phone — open, read, delete anytime."*
  — matches the wireframe's "stored only on your device" spirit.
- Newest-first list, empty state, loading/error states all present.

**Deviates**
- **No persistent "Private · on-device" badge:** the wireframe global spec requires the badge
  **on every screen**. `Memory.tsx` has only the footer text — no header badge
  (`Memory.tsx` render block). Same gap on the Privacy dashboard (§1.7).
- **No grouping:** wireframe #15b says *"Searchable timeline grouped People/Notes/Preferences/Tasks"*.
  Implementation is a flat newest-first list with kind badges — no grouping or category framing,
  no "What it knows about me" framing.
- **No edit:** wireframe #15b says *"…edit/delete"*. Implementation has **Delete only**; notes
  cannot be edited (tap only expands). Full item-detail/edit is wireframe #19 (post-v0.1), but
  #15b itself promises edit.
- **No screen title:** the screen renders no header title at all (tab label carries it).
  Wireframe #15b frames it as "What it knows about me" — a warm title would help.

**Design system:** ✅ colors/radius correct; footer copy is on-tone.

---

### 1.7 Privacy dashboard — `screens/PrivacyDashboard.tsx` vs wireframe §I #30 + §I #39

**Matches**
- "What's stored" card with live note count; "What left your device: **Nothing.**" big statement
  (matches wireframe #39's *"Nothing has left your device this week"* intent) with honest
  conditional copy when entries did leave.
- Audit log list with per-entry "stayed on device" / "left device" flags (teal vs red) —
  matches #39's "each with time, what, where it went (or 'stayed on device')".
- "Active tier" badge: "Private · on-device / Runs entirely on your phone. No account, no
  telemetry." — excellent, matches the honest-labeling requirement.

**Deviates**
- **No persistent header badge:** like Memory, no "Private · on-device" header badge
  (`PrivacyDashboard.tsx` render). The tier card partially covers it, but the global spec wants
  the persistent indicator.
- **Audit log not filterable, no tap-for-detail:** wireframe #39 requires a *"filterable
  reverse-chronological list"* with *"a tap for detail"*. Implementation is a flat list, no
  filters, no detail view.
- **Techy leakage:** *"unavailable in this build"* (`PrivacyDashboard.tsx`, audit section) is
  developer-facing; a consumer should see friendly copy.

**Design system:** ✅ colors/radius correct. Tone of the main copy is exactly right.

---

### 1.8 Diagnostics — `screens/Diagnostics.tsx` vs wireframe §K #49

**Matches (essentially none with the v0.1 wireframes)**
- Wireframe #49 is *"Health check / diagnostics (hermes doctor)"*: a friendly
  *"Run check"* button with a checklist (Model loaded ✓, Storage OK ✓, Microphone ✓,
  Integrations ✓), issues flagged with "Fix" actions. It is **Batch 7 — explicitly not v0.1**.
- The implementation is the **Phase-0 engineering spike harness**: tool-calling scores
  ("toolRight", "argsRight", "TOOLCALL_CASES"), tok/s speed test, memory spike with ms timings.
  It is developer instrumentation, not the wireframe's friendly health check.
- **Tone violation:** "Phase-0 gate — run on a real phone, not a simulator.", "toolRight",
  "argsRight", "tok/s", "Run tool-calling spike" — all violate the design system's
  "never techy" rule and would confuse a non-technical user.
- It is a **stack screen** (`navigation.tsx`), not a tab — reachable but not in the tab bar.
  Still shipped in the consumer build.

**Verdict:** see §4 — REMOVE from the consumer v0.1 build (keep the file for internal testing).

---

## 2. Entirely missing from the implementation

### 2.1 §A #2 — "How privacy works" (three cards)
No screen exists. Wireframe: three vertical cards — *"Runs on your phone"*, *"Nothing leaves
without your permission"*, *"You can see everything it remembers"* — each icon + one line,
primary "Continue". Welcome (§A #1) is supposed to link to it ("How your privacy works" link,
also missing). **This is the 5-second trust pitch's second half; its absence is the biggest
trust gap in v0.1.**

### 2.2 §A #4 — Permissions (mic, notifications, calendar — each with a plain reason)
No screen exists. Wireframe: Microphone, Notifications, Reminders & Calendar — each an icon +
one-line reason + Allow button, footer *"These are used only on your device."* The app
navigates Welcome → Onboarding → Main tabs with **no permission education step**. The OS will
prompt natively at first mic use, but the wireframe's plain-language pre-permission framing is
absent.

### 2.3 Wireframe #5 (Choose personality) — correctly omitted
#5 is Batch 5, not v0.1. Its absence is correct scope discipline. No action.

---

## 3. Implementation elements NOT in the v0.1 wireframes (scope check)

| Element | Wireframe status | Verdict |
|---|---|---|
| `screens/Diagnostics.tsx` (Phase-0 spike harness) | Wireframe #49 is a *friendly health check*, Batch 7, **not v0.1**. Impl is engineering instrumentation, not #49. | **REMOVE** from the consumer build for v0.1. Keep the file in the repo (or behind a developer-mode flag) for internal Phase-0 testing — it has legitimate use, just not in Talha's hands. |
| `screens/Privacy.tsx` (1-line re-export of PrivacyDashboard) | Not a real screen; wiring shim so the navigator can lazy-load `./screens/Privacy`. | **KEEP** — harmless, 4 lines, no user impact. (Could be deleted and the import pointed at PrivacyDashboard directly, but not worth churn.) |
| `Home.tsx` → `FallbackConfirmModal` (duplicate trust gate, "Approve" copy) | Not in wireframes; duplicates `ActionConfirmModal.tsx`. | **MERGE** — delete the fallback, use the real `ActionConfirmModal` everywhere. Two trust-gate implementations with different button copy ("Approve" vs "Confirm") is a trust-surface bug. |
| Onboarding "Skip for now (demo mode)" | No demo mode in the wireframes. | **KEEP the skip, REWORD** — a skip path is good UX for v0.1, but "demo mode" is jargon. Reword to plain language, e.g. "Explore first — download later". (P1 wording fix.) |
| 3-tab bar (Home · Memory · Privacy) vs wireframe shell's 5 tabs (Home · Skills · Memory · Automations · Settings) | Shell spec, but Skills/Automations/Settings are explicitly **not** v0.1. | **KEEP** — correct scope discipline; the 5-tab shell is the full-v1 vision, not v0.1. Just document the 3-tab set as the v0.1 shell. |

---

## 4. Design-system deviations (global)

- **Theme tokens match exactly:** `theme.ts` — bg `#FAF9F6` ✅, accent `#0F766E` ✅, radius `12` ✅,
  generous padding, system sans (wireframe names Plus Jakarta Sans/Inter — system font is an
  acceptable v0.1 stand-in; P2 if we want the exact typeface later).
- **Badge presence:** ✅ Welcome, Onboarding, Home (header), VoiceModal. ❌ **Memory** and
  **Privacy dashboard** — no persistent "Private · on-device" badge. Fix: add the same header
  badge row Home uses.
- **"Never techy" violations (consumer-facing copy):** "phones home" (Welcome subtitle);
  "demo mode" (Onboarding skip + error); "The agent module isn't bundled in this build yet"
  (Home); "(agent not ready yet — stored locally)" (VoiceModal save); "unavailable in this build"
  (PrivacyDashboard audit); all of Diagnostics.
- **Recording state color:** VoiceModal uses red (`theme.danger`) for active listening. One-accent
  system says teal; red-for-record is conventional — keep, but pair with the wireframe's animated
  waveform instead of a flat red circle.
- **Confirm-modal presentation:** centered fade modal vs wireframe's bottom-sheet. Minor; either
  is acceptable if consistent — pick one (wireframe says bottom-sheet).

---

## 5. Prioritized fix list

### P0 — Trust / scope violations (fix before Talha tests)
1. **Build §A #2 "How privacy works"** (three cards + Continue) and add the
   *"How your privacy works"* link on Welcome. The v0.1 trust pitch is incomplete without it.
2. **Build §A #4 Permissions screen** (mic / notifications / calendar, each with a plain-language
   reason + Allow, footer "These are used only on your device.") in the Welcome → Onboarding →
   Permissions → Main flow.
3. **Remove Diagnostics from the consumer build** (or gate behind developer mode). It is not a
   v0.1 screen and its copy violates "never techy". Keep the file for internal Phase-0 runs.
4. **Complete the trust gate per §B #10:** add the **Edit** button and the
   **"Always allow this kind of action"** checkbox to `ActionConfirmModal.tsx`; convert to the
   wireframe's bottom-sheet presentation.

### P1 — Wireframe fidelity
5. Add the persistent "Private · on-device" header badge to **Memory** and **Privacy dashboard**.
6. **Merge the duplicate trust gate:** delete `FallbackConfirmModal` in `Home.tsx`; use the real
   `ActionConfirmModal` (fix "Approve" vs "Confirm" inconsistency).
7. Welcome: restore wireframe headline *"Your private AI. It never leaves your phone."*,
   remove "phones home", add the phone-with-lock illustration.
8. Memory (§E #15b): add **edit** for notes; group the timeline by category
   (People / Notes / Preferences / Tasks); add a warm screen title ("What it knows about me").
9. Voice (§B #7): add the animated waveform; replace the save-confirmation parenthetical with
   the wireframe's clean *"Saved to your private memory"*; fix recording-state styling.
10. Onboarding (§A #3): switch to the centered **progress ring**; use the wireframe headline copy;
    reword "demo mode" skip to plain language.
11. Privacy dashboard (§I #39): make the audit log **filterable** with **tap-for-detail**;
    reword "unavailable in this build" to friendly copy.
12. Scrub all remaining techy consumer copy: "The agent module isn't bundled in this build yet"
    (Home), "Something went wrong reaching the agent" (Home).

### P2 — Polish
13. Fonts: adopt Plus Jakarta Sans / Inter per the Stitch design system (`assets/6571437798574184401`)
    if licensing/packaging allows; otherwise keep system sans (acceptable).
14. Document the 3-tab v0.1 shell (Home · Memory · Privacy) as the deliberate v0.1 subset of the
    wireframe's 5-tab shell, so a future reader doesn't "fix" it back.
15. Confirm-sheet vs centered modal: pick one presentation and apply consistently.

---

## 6. Bottom line

The implementation captures the v0.1 **structure** (6 screens, calm theme, badge, core loop) but
skips two onboarding trust screens (§A #2, §A #4), ships an engineering-only Diagnostics screen
to consumers, and leaves the trust gate (§B #10) incomplete (no Edit, no "always allow").
Nothing here requires re-architecture — it is ~2 new small screens, one removal/gating, and copy
+ component fixes. The wireframes Talha pointed to are the right reference; this audit maps every
gap to its section so the fixes can be built screen-by-screen.
