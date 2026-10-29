# Goodfix decisions

Locked decisions for the active hackathon web app. Preserve history; add a newer dated decision when reversing a choice.

## 2026-10-29 — Separate responsive web app is the hackathon entry

- Project path: `apps/goodfix-web/`. Working title: Goodfix; public brand remains open.
- Stack: React + TypeScript + Vite + responsive CSS. No native wrapper in the hackathon MVP.
- Layout: Workbench on desktop; step-focused Guided adaptation on phones. Keep each upload numbered, selectable, and linked to the corresponding conversation event.
- First demo task: one staged, visibly loose cupboard handle with an accessible screw. No generic repair, plumbing, electrical work, cooking, appliances, vehicles, structural work, or medical tasks.
- Model roles: Muse Spark video understanding returns text; SAM 3.1 returns tracked object geometry. Neither model is treated as a repair diagnosis or safety authority. Display real source frames and parsed SAM overlays.
- Meta API routing: do not ship a public server-side route until Meta provides written clarification that the exact no-login Integrated Product architecture is authorized. Keep keys out of browser code.
- Privacy: each media request gets its own exact-content preview and explicit approval. Use Standard services for personal home footage and restrict users to 18+. Delete Meta Files API uploads when no longer needed.
- Review conditions: preserve real outputs and stop behavior; do not replace failed live calls with simulated success. Revisit scope if the authorization gate, model access, or task safety gate fails.

This decision supersedes the Vault-specific 2026-10-28 hackathon platform decision only. It does not retire the separate Vault mobile product archived under `archive/vault-native/`.
