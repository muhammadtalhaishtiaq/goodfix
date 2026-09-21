# V01-SCOPE — v0.1 Scope Lock, Post-Gate Decision Tree & Build-Readiness

> Companion to `BUILD-PLAN.md` and `DECISIONS.md` (2026-08-29 restart: "continue — Phase 0 gate is the boss").
> Purpose: (1) lock exactly what v0.1 is, so we never drift into the 53-screen "everything" trap; (2) define the decision tree so the build direction is predetermined the moment the Phase 0 numbers land; (3) be the **build-readiness checklist** — proof we have everything needed before any v0.1 feature code is written. Created 2026-08-29.

## 0. The rule in one line

**A feature may be built ONLY after: the Phase 0 gate clears AND its slice is specified here (or in its slice doc) with a tool contract + acceptance criteria + memory/privacy rule.** No screen is built "because it's in the wireframes."

---

## 1. What v0.1 is (the wedge — locked)

One complete loop to ~10 real people: **capture → on-device memory → recall → one bounded reminder → privacy dashboard that proves nothing leaked.**

The six screens (already wireframed — `WIREFRAMES.md` Batch 1 & 2 ids):

| # | Screen | v0.1 behavior (nothing more) |
|---|---|---|
| 1 | Welcome / privacy promise | The 5-second trust pitch. One button in. |
| 2 | Home / conversation | Text capture + quick-action chips. The everyday surface. |
| 3 | Voice capture | "Note this" by voice → saved to private memory. |
| 4 | Memory | What it knows about you: searchable local timeline, edit/delete. |
| 5 | Action-confirm (modal) | The trust gate — preview before every side-effecting action. |
| 6 | Privacy dashboard | Live proof: what's stored, what's local, what left (nothing, locally). |

**Explicitly NOT in v0.1** (deferred — see `DECISIONS.md` 2026-08-01): skills, automations, integrations, MCP, cloud boost tier, model-switching UI, Android *(see §4 — dual-platform is a separate locked decision below)*, Watch, fine-tuned model, monetization.

---

## 2. Post-gate decision tree (predecided — do not relitigate at the moment of truth)

The Phase 0 spike measures on a real mid-range phone: `toolRight`, `argsRight`, throughput (tok/s + first-token), and no OOM/jetsam. Gate bars (provisional, will be calibrated to real numbers): **toolRight ≥ 90%, argsRight ≥ 85%.**

**If tool-calling clears the bar** (≥90% right tool, ≥85% right args, reliable enough):
- v0.1 ships **model-driven routing** for the core loop. Small tool set (reminder, event, save-note, recall). The orchestrator's state machine still owns control flow + confirm gates; the model fills slots.
- Tool contract for each of the 4 tools is specified in §3 before coding.

**If tool-calling is medium** (60–89%):
- Stay model-driven but wrap every uncertain output in a **"did you mean this?" confirm** and shrink to the 2 most reliable tools (probably `save_note` + `recall_memory`). Reminders become more deterministic.
- The privacy dashboard becomes even more central — it sells the uncertainty as "we double-check everything."

**If tool-calling fails** (<60% or unusable on the reference device):
- v0.1 pivots to **deterministic routing + escalation-first**: the app's own code drives every action; the on-device model does capture + memory + recall only; anything agentic goes through an **explicit, previewed** BYOK/cloud step. This is a redesign of the *loop's spine*, not an abandonment — the product promise (private, remembers, bounded action) survives.
- In this case the v0.1 scope shrinks: capture → memory → recall → **privacy dashboard** ship; smart reminders become a follow-up once escalation proves out. **Do not pretend the model can do what it can't.**

**The one decision gate outcome that kills the project:** tool-calling fails *and* the opt-in escalation path can't deliver a functional minimum loop. Only then we stop. (Not expected — escalation is cheap and external models are reliable.)

---

## 3. Tool contracts (define for each slice BEFORE coding — BUILD-PLAN §4 "DESIGN" step)

Each v0.1 tool needs, written down before build: the **input JSON schema** (the model fills this), the **validator** (deterministic), the **confirm step** (what the user sees), the **memory write** (what lands in `.md`), and the **privacy assertion** (nothing leaves the device).

| Tool | Input (forced JSON) | Confirm prompt | Memory write | Privacy |
|---|---|---|---|---|
| `create_reminder` | `{title, datetime_iso}` | "Create reminder: *title* at *time*?" | reminder record + audit entry | local only |
| `create_event` | `{title, datetime_iso, duration_min?}` | "Add calendar event: *title* at *time*?" | event record + audit | local only |
| `save_note` | `{body}` | "Save to your private memory?" | `.md` file + vector index | local only |
| `recall_memory` | `{query}` | (read-only, no confirm needed) | audit entry (query) | local only |

*(The spike in `code/spikes/toolcall.spike.ts` already models this exact 5-tool set including `none` — align the schema in code with this table.)*

---

## 4. PLATFORM DECISION (added 2026-08-29 per Talha) — iOS AND Android at launch (hybrid, one RN codebase)

**Locked intent:** v0.1 is a **hybrid, cross-platform app — both iOS and Android can download it at launch**, from one React Native + TypeScript codebase. This is a change from the earlier "iOS first, Android second" framing in `PRODUCT.md` §7/§9 and `MASTER.md` §7.

**What this unlocks / costs (honest):**
- **Unlocks:** one codebase → both stores from day one; reaches the full dev/IT/privacy beachhead on both platforms; no "when is Android coming" credibility hit. React Native + EAS Build is built for exactly this (the whole reason RN was chosen — see `DECISIONS.md` 2026-07-14).
- **Costs / risks to plan for:**
  - The Phase 0 spikes must run on **BOTH** platforms, not just iOS — tool-calling and jetsam/backpressure behavior differ. Android mid-range + iOS older device are the reference points.
  - Native modules must be verified on both: `llama.rn`, `expo-sqlite` (sqlite-vec), `expo-secure-store` (Keychain on iOS, Keystore-backed on Android), `expo-notifications`, calendar/reminders bridging (EventKit on iOS, CalendarProvider on Android — **different APIs, both must be implemented**).
  - Dual-store launch doubles store-review surface: **two privacy nutrition labels** (Apple's App Privacy, Play Data Safety) that must both honestly say "local by default, nothing leaves the device on the local tier."
  - Scope control: dual-platform is an *additional* v0.1 cost, so the 6-screen wedge stays identical on both — no platform-specific features in v0.1. Parity, not extensions.
- **Fallback (documented, not preferred):** if a single native bridge proves broken on Android in Phase 0, ship iOS first but keep the RN codebase single (Android follows as a pure build-out, not a rewrite) — and say so transparently on the landing page. Re-evaluate at the Phase 0 gate. **The default is both-at-launch; the fallback requires evidence, not vibes.**

> Record in `DECISIONS.md`: add a dated entry for "Hybrid dual-platform at launch (one RN codebase, iOS + Android)" superseding/clarifying the earlier iOS-first framing. See Task List §6.

---

## 5. BUILD-READINESS CHECKLIST — "do we have everything before we build?"

This is the answer to *"make sure we have everything before we start building."* Everything below marked 🔲 must be true before ANY v0.1 feature code is written. (Phase 0 spike work is the exception — it's the de-risking step, not a feature.)

### A. Strategy & product (have it) ✅
- [x] `MASTER.md` (why), `DECISIONS.md` (locked calls), `PRODUCT.md` (spec/architecture/tradeoffs).

### B. Engineering plan & process ✅
- [x] `BUILD-PLAN.md` — architecture, stack, thin-slice workflow, testing pyramid, privacy CI gate, risk register.

### C. Visual / screen direction ✅ (direction only — see D)
- [x] `WIREFRAMES.md` — all 53 screens visualized in Stitch (use as reference; only 6 are v0.1).

### D. Buildable spec — the gap to close BEFORE feature code 🔲 🔲
- [x] **Scope lock** — this document (§1) locks the v0.1 wedge. ✅ done 2026-08-29.
- [x] **Decision tree** — this document (§2) predecides the go/medium/fail paths. ✅ done 2026-08-29.
- [x] **Platform intent** — this document (§4) locks iOS+Android hybrid. ✅ done 2026-08-29.
- [ ] **Per-slice specs** — for each of the 6 v0.1 screens: user stories + acceptance criteria + tool contract (§3) + empty/error/loading states + privacy assertion. **NOT YET WRITTEN — create one per slice when its FIRST build begins (see §6).**
- [ ] **Task backlog** — the engineering tasks for the v0.1 slices in dependency order. **NOT YET WRITTEN — derived from the slice specs.**

### E. The gate — the real decision input 🔴
- [ ] **Phase 0 spikes run on a real mid-range phone (both iOS AND Android).** Numbers recorded in `docs/journal/`, real gate bars set in `code/spikes/toolcall.spike.ts`. **THIS IS THE ONLY THING THAT CANNOT BE DONE FROM A LAPTOP.** Requires a physical mid-range iPhone or Android + Xcode/Android Studio.

### F. Market currentness ✅
- [x] **Fresh competitive/market check — DONE 2026-08-29** → `docs/research/competitive-landscape-2026-08.md`. Core gap still open; Open Minis (BYOK cloud-brain mobile agent) is the key adjacent entrant to watch; feasibility findings strengthen the Phase 0 case (llama.rn 0.4.8 — already pinned — documented as tool-calling capable, with real on-device Qwen/Llama tool-calling proofs).
- [ ] **Store-review debt (small):** confirm Apple App Privacy + Play Data Safety current on-device-AI review expectations before the v0.1 app-store push. Open Minis trajectory to keep watching.

### G. Scaffold health 🟡
- [x] **Verified 2026-08-29:** `code/` installs clean (`npm install` → 1070 pkgs) and `npx tsc --noEmit` passes with **zero errors** — the last session's code is coherent, compilable TypeScript (it had never been compiled before). Critical native deps resolved: `llama.rn 0.4.8` (the make-or-break inference module), `expo-sqlite`, `expo-file-system`, `expo-secure-store`, `zustand`. Expo SDK 52.0.49.
- [x] **Verified:** the qwen2.5-3b GGUF URL (the Phase 0 default spike model) resolves on HuggingFace (HTTP 200 → CDN). Download works.
- [ ] **Not verified:** the two placeholder model URLs (`gemma-3n`, `llama-3.2-1b` — `<repo>` in `manifest.ts`) — not blockers for Phase 0, only needed for model-switching later. Fill in real HF repos before v0.2.
- [ ] **Not done:** native build (`expo run:ios` / `run:android`) needs Xcode/Android Studio + a physical device — the remaining Phase 0 blocker.
- [ ] **Not done:** `npm audit` shows 28 transitive-dependency vulnerabilities (15 mod / 12 high / 1 crit) in dev/build tooling — not a shipping-app runtime issue, but review before any release (privacy stance means no runtime telemetry deps regardless).
- [ ] `expo-notifications` not installed (Phase 1 reminder dep, not needed for the Phase 0 spike).

---

## 6. Task list for the build-readiness phase (in dependency order)

1. **Fresh market check lands** — ✅ DONE 2026-08-29 → `docs/research/competitive-landscape-2026-08.md`. Signal: gap still open; feasibility strengthened; Open Minis = competitor to watch. Follow-up debt: confirm store-review expectations for on-device AI.
2. **Get the scaffold green** — ✅ DONE 2026-08-29: installs + typechecks clean (see §5G). Remaining: native device build.
3. **Pin real model URLs** — ✅ qwen2.5-3b verified (the Phase 0 default). 🔲 gemma-3n + llama-1b placeholders still `TODO` (not needed for the spike; fill before v0.2).
4. **Run Phase 0 on a real device (iOS), then (Android)** — fire all three spikes; record numbers; set real gate bars. *The make-or-break moment. Needs a real phone — the ONLY remaining hard blocker.*
5. **Write the per-slice specs** (user stories + acceptance + tool contracts + states) for the 6 v0.1 screens — **but only start slice-by-slice once the gate result is known** (the decision tree §2 dictates the shape of these specs).
6. **Record the platform decision** — ✅ DONE in `DECISIONS.md` (hybrid iOS+Android at launch, one RN codebase).
7. **Record everything in the journal** (`docs/journal/`) as it happens.

---

## 7. Definition of "we have everything" (the test)

You are ready to build the first v0.1 feature slice when a future developer can open a **single slice doc** and answer all of these without asking you:
- What's the user story + acceptance criteria (literal "done" checklist)?
- What's the exact screen layout + all states (empty / error / loading / success)?
- What's the tool's input JSON schema, validator, confirm prompt, memory write, privacy assertion?
- Does this slice's Phase 0 gate number back it (already measured)?
- Does it build + pass privacy assertions on BOTH iOS and Android?

**Until a slice doc answers all five, that slice is not buildable. That is the standard.**

---

*Companion docs: `MASTER.md` · `PRODUCT.md` · `BUILD-PLAN.md` · `DECISIONS.md` · `WIREFRAMES.md` · `FUTURE.md` · `docs/research/` (market passes).*
