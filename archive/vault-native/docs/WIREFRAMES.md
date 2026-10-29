# WIREFRAMES — Every Screen (for Google Stitch)

> The **complete** screen map for Vault v1 — every section, tool, skill, integration, and setting, each with its purpose and a ready-to-paste **Google Stitch prompt**.
> This app mirrors the **full Hermes feature surface** (tools, skills, memory, automations, integrations, providers) but re-imagined for a **non-technical person on a phone**. Codename **Vault**. Portrait mobile.
> Design language: calm, trustworthy, private. Soft off-white, one warm teal accent, generous whitespace, large legible type. Never "techy."

**Global design system prompt (paste once in Stitch, then generate each screen):**
> Design a clean, calm, privacy-first iOS mobile app called Vault — a private personal AI assistant. Style: soft off-white/light background, one warm accent color (deep teal), rounded corners, generous spacing, large friendly sans-serif type, subtle depth, no clutter. Feels trustworthy and human, not technical. Include a small persistent "on-device / private" indicator. Portrait phone frames.

---

## How we translate Hermes (developer CLI) → Vault (friendly mobile)

Hermes is a power-user terminal agent. We keep **all its power**, but reshape the surface for a phone and a non-technical user. The mapping rule for every Hermes concept:

| Hermes (dev) | Vault (mobile) — same capability, friendly frame |
|---|---|
| `terminal`, `process`, `execute_code`, 6 shell backends | **"Device actions"** — sanctioned OS actions (reminders, calendar, notes, share, shortcuts). No raw shell for consumers. |
| `hermes tools` / toolsets on/off | **Tools catalog** with plain-language toggles + per-tool permission cards |
| ~78 skills, Skills Hub, agentskills.io | **Skills** tab — browse, install, run, record-your-own |
| `SOUL.md` / `/personality` | **Personality** editor ("How your assistant acts") |
| `MEMORY.md` / `USER.md` / session_search / Honcho | **Memory** tab — what it knows, session history, "how it sees you" |
| `cronjob`, scheduled tasks, event hooks, delegation | **Automations** tab — routines in natural language |
| Gateway (Telegram/Discord/Slack/WhatsApp/Signal/Email/HA) | **Integrations** hub — connect channels |
| MCP servers, provider routing, credential pools | **Advanced** settings — kept, but tucked away |
| provider/model switch, 300+ models, fallback, BYOK | **Models & tiers** — local hero + switch + your own key |
| command allowlist, approval patterns, isolation | **Privacy & approvals** — confirm-before-acting |

Anything genuinely dev-only (raw SSH/Modal/Daytona backends, Python RPC) is **not** surfaced to consumers; it lives behind an optional "Developer mode." The consumer never sees a terminal.

---

## App shell / navigation

**Bottom tab bar (5):** `Home` · `Skills` · `Memory` · `Automations` · `Settings`.
Persistent header badge on every screen: **"Private · on-device"** (teal dot). A floating **capture** button (mic) is reachable from Home.

---

## Generated in Stitch (tracking)

**Project:** `projects/12061351565962533710` ("Vault — Private On-Device AI Agent")
**Design system:** `assets/6571437798574184401` — "Vault — Calm Privacy" (off-white `#FAF9F6`, teal `#0F766E`, Plus Jakarta Sans / Inter, 12px roundness). **Reuse this asset id for every screen.**

| Status | Screen | Stitch id |
|---|---|---|
| ✅ | 5 Home | `2ead08057f9342969385bafc03b8680b` |
| ✅ | 6 Voice Capture | `e211776052764cc1ba42d5e5f0fcb626` |
| ✅ | 15 Memory home | `ac63ca044bec42788dc4b51f42a09a09` |
| ✅ | 30 Privacy dashboard | `b9bc1e7c0baf4bf08fa8c9e8ba8543d7` |
| ✅ | 10 Action confirmation | `a87830afc3b245dcadc0506dbf579396` |
| ✅ | 8 Command palette | `087dbed8258e4b6382dc40bdc3d6d432` |
| ✅ | 11 Skills Hub | `5737ced2d9e045cd90e89cddebf01993` |
| ✅ | 23 Automations home | `5283cd024f48494ca3cfa9e7d22f22eb` |
| ✅ | 44 Settings home | `e81cfcc09a204425b8b94da187055c14` |
| ✅ | 12 Skill detail | `fe5009b8cd6041a5b3d898684aadc082` |
| ✅ | 13 Skill running | `70874bf93f3a4a6490cb5f1d2c7dbbda` |
| ✅ | 16 Tools catalog | `a0ef2ea8c6984a0fb71910b73884d275` |
| ✅ | 24 Create automation | `b39eea035d1b4280bf05af910762ee28` |
| ✅ | 34 Models & tiers | `adc5c4e5399c4261bc53fd14da9f4082` |
| ✅ | 20 Session history | `beeb37a3db5f432c96167c570d1b2be9` |
| ✅ | 21 Your profile | `e5bb62b29acd474e87412fcb97055ed8` |
| ✅ | 27 Integrations hub | `e40ba129031a4e6aad40ca026e552fa4` |
| ✅ | 38 Permissions | `fcc426706cb34c91825b9a407a39e659` |
| ✅ | 39 Audit log | `eb832ead51bd4919854225225b331b60` |
| ✅ | 1 Welcome | `d8f071123cc541759f013b94ed969607` |
| ✅ | 2 How privacy works | `55c80a1e3e8c4efca63e5ae5d8cbe029` |
| ✅ | 3 Model download | `657a9aa0b1a74605aa60382e7955f049` |
| ✅ | 4 Permissions request | `ed3b29b4a64149aba272f004cd081048` |
| ✅ | 5 Choose personality | `faffd8d9cbc84b158f1790861d8bccdb` |
| ✅ | 41 Personality editor | `b5e58ca827a74deba996cb1d901103e4` |
| ✅ | 42 Appearance | `0b50ab14d69346a599b089b6dee5183e` |
| ✅ | 37 Your API keys | `691d4ef470f24f5fb3d3f45b13db7ee3` |
| ✅ | 51 About / licenses | `bbabce218f834ef1adc5ddf91ba41ea7` |
| ✅ | 31 MCP connections | `b23dfb5a37a34ae9a8eaf429b677dd41` |
| ✅ | 36 Providers & routing | `fb2a281e45604eec8c0e76f8d1231c91` |
| ✅ | 7b Voice mode | `46b97e3a2a8648f395fbbffd52644a49` |
| ✅ | 9 Attachments & vision | `19e36a01b75d4d4186c2b868fe319bc2` |
| ✅ | 25 Automation detail | `e71d184c5a6a4ac1a3f2b71adae851c1` |
| ✅ | 19 Memory item detail | `b6d5cf72057842038abee1c5b8dab7e6` |
| ✅ | 46 Voice & wake word | `8554b95084b44852a03eef5a7c6ad5aa` |
| ✅ | 35 Model picker | `1b3a1290156742c086f617a0ad89ca41` |
| ✅ | 40 Data & storage | `078fbc8073384375816f702c0cf8f990` |
| ✅ | 47 Notifications | `752ee87d9f224aaaa8622c235bbb7ddd` |
| ✅ | 14 Record a skill | `5c2d4e082cc84b0886f583e8e2abbfed` |
| ✅ | 17 Tool detail | `aeb8840154df4ecdbe3864f368854721` |
| ✅ | 45 Context & rules | `b86dba6d4ab64412932cb72ecbabb63b` |
| ✅ | 15 Skill marketplace | `8c6a2f061d1c4acfa4f0214b96785f6a` |
| ✅ | 22 Memory backup | `926b6d33c7be4e91bff28cb19bd0d937` |
| ✅ | 28 Channel connect | `08b0453fe92e495a9de1bae0a77555bf` |
| ✅ | 29 Home Assistant | `711891c3929f4c89a31b1d96a23ff8fb` |
| ✅ | 50 Backup & restore | `b07cbcc57e0c4b0fac89ad4a4e7b7526` |
| ✅ | 32 Music / Spotify | `264b13bcdf804b8f8ff20eb51056712a` |
| ✅ | 33 Developer / API | `70591e44eb2a4a9095e7876469399c9c` |

| ✅ | 18 Device actions | `6c24ba2694e54d2e92da2c8d41df6425` |
| ✅ | 48 Usage & insights | `0e0027c248f54de9b6ae8d81828a0ad1` |
| ✅ | 49 Health check | `22ceae785ab445aa9bc6c6b759547daa` |
| ✅ | 26 Delegation / parallel tasks | `582c09e347b746f09ecbb05b0d08aa77` |
| ✅ | 43 Plugins | `fd90902803254284b4c8b9c583a15ca6` |

**Count: ALL 53 screens generated ✅** — the complete Hermes-parity mobile surface, one consistent Vault design system. Open project `12061351565962533710` in Stitch to review/iterate any of them.

**To generate the rest yourself in Stitch:** open project `12061351565962533710`, and for each screen paste its `> Stitch:` prompt below, selecting design system `assets/6571437798574184401` and device = Mobile. Follow the build-order batches at the bottom. Tick the ✅ + paste the screen id here as you go.

---

# A. Onboarding & setup

### 1. Welcome / privacy promise
Earn trust in 5 seconds. Lead with the promise.
> Stitch: "Onboarding welcome for a private AI app 'Vault'. Big friendly headline 'Your private AI. It never leaves your phone.', a simple illustration of a phone with a lock, a primary 'Get started' button, subtle link 'How your privacy works'. Calm, warm off-white, teal accent."

### 2. How privacy works
Local-by-default in plain language; honest about opt-in cloud.
> Stitch: "Onboarding with three vertical cards: 'Runs on your phone', 'Nothing leaves without your permission', 'You can see everything it remembers', each an icon + one line. Primary 'Continue'."

### 3. Model download / setup
Download the on-device model with reassurance.
> Stitch: "Setup screen downloading an on-device AI model. Centered progress ring with %, 'Setting up your private AI — downloads once, then works offline', small size note. Reassuring, minimal, teal accent."

### 4. Permissions
Mic, notifications, reminders/calendar — each with a plain reason.
> Stitch: "Permissions screen: Microphone, Notifications, Reminders & Calendar, each an icon + one-line reason + Allow button. Footer 'These are used only on your device.'"

### 5. Choose a personality (SOUL.md, friendly)
Pick how the assistant behaves/sounds — Hermes personas, humanized.
> Stitch: "Onboarding 'Choose your assistant's personality'. A grid of selectable persona cards (Calm & concise, Warm & chatty, Professional, Playful, Custom), each with a small avatar and one-line description, one selected with a teal ring. 'Continue' button."

---

# B. Core conversation surface

### 6. Home / Conversation ✅
The everyday surface — talk, capture, ask. Quick-action chips, mic+text input bar, 'Private · on-device' badge, bottom nav.

### 7. Voice capture ✅
Zero-friction "note this" by voice. Animated waveform, live transcript, "Saved to your private memory".

### 7b. Voice mode / wake word (settings-linked live state)
Hands-free continuous conversation (Hermes Voice Mode + Wake Word).
> Stitch: "Hands-free voice conversation screen. Large pulsing teal orb in center, 'Listening…' then alternating with the assistant speaking, a live caption line, a 'Say \"Hey Vault\"' hint, and a big Stop button. Calm, focused, dark-dimmed background optional."

### 8. Command palette / quick actions
All capabilities one tap away (maps Hermes slash-commands + skills).
> Stitch: "A slide-up command palette over the chat: a search field 'What do you want to do?', then grouped quick actions — 'Remind me', 'Summarize', 'Draft a reply', 'Search my memory', 'Run a skill', 'Schedule something'. Clean list with icons."

### 9. Attachments & vision (image paste, vision_analyze)
Share a photo/doc for the assistant to read — on device.
> Stitch: "Chat attachment sheet: options to add a Photo, a Document (PDF/Word/Excel), or take a picture, with a note 'Read on your device — not uploaded.' One attached image preview with an 'Analyze' action."

### 10. Action confirmation (modal/sheet) — the trust gate
Confirm before it acts / before it sends (Hermes approval/allowlist).
> Stitch: "Bottom-sheet confirmation showing an action the AI wants to take, with a preview of the exact content (a draft message, or the data about to go to the cloud), and three buttons: Confirm, Edit, Cancel. A small 'Always allow this kind of action' checkbox. Clear, reassuring."

---

# C. Skills (Hermes ~78 skills + agentskills.io)

### 11. Skills Hub / browse
Browse everything the assistant can do, by category.
> Stitch: "A 'Skills' hub screen. Search bar, then horizontal category chips (Productivity, Documents, Research, Coding, GitHub, Media, Home, Finance), then a grid of skill cards each with an icon, name, one-line description, and an 'installed/Add' state. Friendly app-store-like but calm."

### 12. Skill detail
What a skill does, its steps, what it can access, enable/run.
> Stitch: "A skill detail screen for e.g. 'Meeting Notes'. Header with icon + name, a short description, a 'What it does' numbered step list, a 'What it can access' permissions list (Calendar, Memory), and primary 'Run' + secondary 'Automate this' buttons."

### 13. Skill running / result
Live, transparent execution with per-step visibility.
> Stitch: "A skill running screen showing progress as a vertical checklist of steps completing one by one (spinner → teal check), a live status line, and the result appearing at the bottom in a card with 'Save' and 'Share' actions."

### 14. Record / create your own skill
The self-improving skill system, humanized ('teach it once').
> Stitch: "A 'Teach a new skill' screen: a text field 'Describe what you want it to do', an option 'Or record me doing it once', a preview of the generated steps as an editable numbered list, and a 'Save skill' button. Encouraging, simple."

### 15. Skill marketplace / install (agentskills.io)
Install community/open-standard skills.
> Stitch: "A skills marketplace list: featured and popular skills as cards with author, install count, and 'Add' buttons, plus a note 'Skills run on your device under your approval.' Trustworthy, curated feel."

---

# D. Tools & toolsets (the Hermes tool registry)

### 16. Tools catalog
Every tool, grouped, with plain-language on/off.
> Stitch: "A 'Tools' settings screen listing tool groups as sections: Web & Search, Browser, Files & Documents, Photos & Vision, Voice & Audio, Memory, Automation, Smart Home, Messaging. Each tool is a row with an icon, plain name, one-line description, and a toggle. Some show a small 'needs setup' tag."

### 17. Tool detail / permissions & keys
Per-tool config, keys, and what it can touch.
> Stitch: "A tool detail screen for e.g. 'Web Search': description, a toggle to enable, a 'Provider' row, an optional API key field (secure), a clear 'What this can access / send' note, and a per-tool privacy label (on-device vs leaves-device)."

### 18. Device actions (terminal → sanctioned)
Hermes terminal/code, reframed as safe OS actions.
> Stitch: "A 'Device actions' screen explaining what Vault can do on your phone: Create reminders, Add calendar events, Save notes, Draft messages, Share content, Run Shortcuts — each a row with icon + toggle + 'always ask before doing this' setting. Reassuring footer 'Vault never runs raw code on your phone.'"

---

# E. Memory (MEMORY.md, USER.md, session_search, user modeling)

### 15b. Memory home ✅ (screen id above) — "What it knows about me"
Searchable timeline grouped People/Notes/Preferences/Tasks; edit/delete; "stored only on your device".

### 19. Memory item detail / edit
Open, edit, or delete a single memory (the .md is the source of truth).
> Stitch: "A single memory detail screen: the memory text large and editable, metadata (when captured, source: 'you said this'), tags, and Delete/Save. A small 'View raw .md file' link for the curious. Calm."

### 20. Session history & search (FTS5 / session_search)
Search past conversations by meaning.
> Stitch: "A 'History' screen: a search bar 'Search your conversations', then a reverse-chronological list of past sessions each with a title, date, and one-line summary. Tapping opens that conversation. Clean, calm."

### 21. Your profile — how it sees you (USER.md / Honcho)
The cross-session user model, shown transparently and editably.
> Stitch: "A 'How Vault sees you' screen: a friendly summary paragraph of what it's learned about the user, then editable chips/sections (Communication style, Interests, Routines, Important people), each editable, with 'This is built only from what you share' footer. Trust-forward."

### 22. Memory backup / import / export (.md portability)
Own your memory — export or move it.
> Stitch: "A memory data screen: 'Your memory is plain files you own.' Buttons: Export all (.md + zip), Import, and an encrypted backup toggle. A reassuring note about portability. Clean."

---

# F. Automations (cron, scheduled tasks, hooks, delegation)

### 23. Automations home
All routines/schedules in one place.
> Stitch: "An 'Automations' tab: a list of routine cards each showing name, a natural-language schedule ('Every morning at 8'), its 2–3 steps as a tiny numbered list, a delivery target (Notification/Email), and an on/off toggle. A '+ New automation' button. Note 'You review every action before it happens.'"

### 24. Create automation (natural language)
Describe a routine in plain words (Hermes NL scheduling).
> Stitch: "A 'New automation' screen: a big text field 'Describe what should happen and when' with example ghost text ('Every Friday at 5pm, summarize my week'), a parsed preview showing Trigger / Steps / Deliver-to, and a 'Create' button. Simple, forgiving."

### 25. Automation detail
Edit schedule, steps, delivery; pause/resume/run-now.
> Stitch: "An automation detail screen: editable schedule (with a friendly cron/natural-language editor), an editable step list, a 'Deliver to' picker (Notification, Email, a connected app), Run now / Pause / Delete, and a last-run log. Clear."

### 26. Delegation / parallel tasks (subagents, humanized)
Show the assistant working on several things at once.
> Stitch: "A 'Working on it' screen showing 2–3 parallel background tasks as cards, each with a title, a progress bar, and a status ('Researching…', 'Drafting…'). A note 'Vault can work on a few things at once.' Calm, not busy."

---

# G. Integrations & platforms (gateway + MCP + music + API)

### 27. Integrations hub
Connect the channels Hermes supports.
> Stitch: "An 'Integrations' screen: a grid of channel cards — Telegram, WhatsApp, Signal, Slack, Discord, Email, Home Assistant, Spotify — each with logo, connected/Connect state. Section header 'Talk to Vault from anywhere.' A privacy note that connecting a channel may route messages through it."

### 28. Channel connect detail (pairing)
Connect one channel with DM pairing.
> Stitch: "A channel connect screen for e.g. Telegram: step-by-step pairing (a QR code or a code to send), a toggle 'Allow Vault to message me here', and a clear note about what data goes through this channel. Trustworthy."

### 29. Home Assistant setup
Smart-home control (Hermes ha_* tools).
> Stitch: "A Home Assistant setup screen: connect via URL + token (secure field), then a discovered list of devices/rooms with toggles for what Vault may control. Note 'Runs locally on your network.'"

### 30. Privacy dashboard ✅ — see tracking table.

### 31. MCP servers (advanced)
Connect any MCP server; per-server tool filtering.
> Stitch: "An advanced 'Connections (MCP)' screen: a list of connected MCP servers each with name, status, and a count of tools it adds, plus 'Add a connection' (URL/command). Each server expandable to toggle individual tools on/off. Slightly more technical but still clean; labeled 'Advanced'."

### 32. Music / Spotify
The spotify toolset.
> Stitch: "A compact 'Music' integration screen: Spotify connect state, and once connected, examples of what you can say ('play focus music', 'what's this song'). Minimal."

### 33. API access / OpenAI-compatible endpoint (developer mode)
Power users expose Vault as an endpoint.
> Stitch: "A 'Developer' screen (behind Developer mode): shows an OpenAI-compatible local endpoint URL + token, connect examples, and a warning that enabling this exposes an API. Monospace accents ok here, but still calm. Clearly gated."

---

# H. Models & providers (local hero + switch + BYOK + routing)

### 34. Models & tiers (settings landing)
Choose the brain and escalation, honestly labeled.
> Stitch: "A 'Models' settings screen: current on-device model card ('Vault Local — Private') with a 'Change model' row; a 'Cloud Boost' row labeled 'Leaves your device · off by default'; a 'Use your own API key' row; and account status. Clear on-device vs cloud labels with color."

### 35. Model picker / download manager
Local models + cloud models, with downloads.
> Stitch: "A model picker: a list of available on-device models (name, size, speed rating, 'Downloaded/Download' with progress), a divider, then cloud models (via your key). Each with a privacy label. The current one checked in teal."

### 36. Providers & routing (advanced)
Whitelist/blacklist/priority, fallback providers (Hermes routing).
> Stitch: "An advanced 'Providers & routing' screen: a reorderable priority list of providers (Nous Portal, OpenRouter, OpenAI, Custom), each toggleable, plus a 'Fallback provider' picker and a 'Prompt caching' toggle. Labeled 'Advanced', still clean."

### 37. Your API keys (BYOK, credential pools)
Bring your own keys; rotation.
> Stitch: "A 'Your API keys' screen: provider dropdown (OpenAI, Anthropic, OpenRouter, Custom), a secure key field, a list of saved keys (masked) with add/remove, and a clear note 'Your requests go to your own account under your own terms — not our servers.' Save."

---

# I. Privacy & security (approvals, allowlist, audit, data)

### 38. Permissions & approvals
Command allowlist + approval patterns, humanized.
> Stitch: "A 'Permissions' screen: sections for 'Always ask before…', 'Allowed automatically', and 'Never allowed', each a list of action types (Send a message, Create event, Delete a memory, Send data to cloud) you can move between. Clear, safe-by-default."

### 39. Full audit log
Every action + every byte that ever left the device.
> Stitch: "An audit log screen: a filterable reverse-chronological list of events — actions taken and any data that left the device — each with time, what, where it went (or 'stayed on device'), and a tap for detail. Header stat 'Nothing has left your device this week.' Data-clear."

### 40. Data & storage
Encrypted at rest, storage usage, export, wipe.
> Stitch: "A 'Data & storage' screen: a storage usage summary (models, memory, media), 'Everything is encrypted on your device', Export my data, and a red 'Erase everything' with confirm. Calm but clear."

---

# J. Personalization (SOUL.md, themes, plugins)

### 41. Personality editor (SOUL.md, friendly)
Shape how the assistant behaves and speaks.
> Stitch: "A 'Personality' screen: preset persona chips at top (Calm, Warm, Professional, Playful, Custom), then friendly sliders/toggles (Formality, Chattiness, Proactiveness, Humor), and a free-text 'Anything else about how it should act?' box. A live sample reply preview. Warm."

### 42. Appearance / themes (skins)
Light/dark + accent, calm by default.
> Stitch: "An 'Appearance' screen: Light/Dark/System selector as cards, an accent color picker (teal default), text-size slider, and a live phone preview. Minimal."

### 43. Plugins manager
Extend Vault (Hermes plugins).
> Stitch: "A 'Plugins' screen (advanced): installed plugins list with enable toggles and 'Manage', plus 'Browse plugins'. A safety note that plugins can add capabilities and are reviewed under your approval."

---

# K. Settings root & system

### 44. Settings home (the tree)
The organized entry to everything above.
> Stitch: "A 'Settings' screen with grouped rows: Assistant (Personality, Voice & wake word), Brain (Models, Providers, Your keys), Capabilities (Skills, Tools, Device actions), Memory (Your data, History), Automations, Integrations, Privacy & security (Permissions, Audit log, Data), Appearance, Advanced (MCP, Developer, Plugins), About. Clean iOS-style grouped list with icons."

### 45. Context & rules (.hermes.md / AGENTS.md, friendly)
Standing instructions that shape every chat.
> Stitch: "A 'Your rules & context' screen: a text area 'Things Vault should always keep in mind' (e.g. 'I'm a nurse, keep replies short'), plus togg'able example rules, and a note that these apply to every conversation. Simple."

### 46. Voice & wake word settings
Configure hands-free.
> Stitch: "A 'Voice & wake word' settings screen: toggle 'Hands-free mode', wake phrase selector ('Hey Vault'), voice picker for replies (TTS voices) with play buttons, and speed slider. Calm."

### 47. Notifications
What Vault may notify about.
> Stitch: "A notifications settings screen: toggles for Reminders, Automation results, Suggestions, and Quiet hours with a time range. Simple grouped list."

### 48. Usage & insights (/usage, /insights)
Transparent resource + activity view.
> Stitch: "A 'Usage & insights' screen: a friendly weekly summary (conversations, reminders set, skills run, tokens used if any cloud), a small chart, and 'On-device processing is unlimited and free.' Reassuring, not billing-scary."

### 49. Health check / diagnostics (hermes doctor)
Self-diagnose problems.
> Stitch: "A 'Health check' screen: a big 'Run check' button, then a results checklist (Model loaded ✓, Storage OK ✓, Microphone ✓, Integrations ✓) with any issues flagged and a 'Fix' action. Reassuring."

### 50. Checkpoints / backup & restore
Snapshot & restore (Hermes checkpoints).
> Stitch: "A 'Backup & restore' screen: list of local restore points (dates), 'Create backup now', 'Restore', and an encrypted-backup note. Everything stays on device unless the user exports. Calm."

### 51. About / open-source licenses
Credits + the MIT/Hermes acknowledgement (our license obligation).
> Stitch: "An 'About' screen: app name Vault, version, a short mission line, and an 'Open source licenses' row opening a scrollable list of licenses (Hermes Agent — MIT, llama.rn, etc.). Plain, honest."

---

## Screen build order (for Stitch generation)

**Batch 1 (done):** 6 Home, 7 Voice capture, 15 Memory, 30 Privacy dashboard.
**Batch 2 (trust + core loop):** 10 Action confirm, 8 Command palette, 11 Skills Hub, 23 Automations home, 44 Settings home.
**Batch 3 (capabilities):** 12 Skill detail, 13 Skill running, 16 Tools catalog, 24 Create automation, 34 Models & tiers.
**Batch 4 (memory + integrations):** 20 Session history, 21 Your profile, 27 Integrations hub, 38 Permissions, 39 Audit log.
**Batch 5 (onboarding):** 1–5.
**Batch 6 (personalization + advanced):** 41 Personality, 42 Appearance, 31 MCP, 36 Providers, 37 Your keys, 48 Usage, 51 About.
**Batch 7 (the long tail):** everything remaining (9, 14, 17, 18, 19, 22, 25, 26, 28, 29, 32, 33, 35, 40, 43, 45, 46, 47, 49, 50).

Same project + design system id for all. Save each generated screen's Stitch id into the tracking table.

---

*After Stitch outputs, save screen ids back to the tracking table and link per screen.*
