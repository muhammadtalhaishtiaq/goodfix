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

## 2026-10-29 — Build and release through gated phases

- Begin with a local web shell, CI checks, deterministic fixtures, and consent/evidence logic. Add Meta integrations only after the existing written-authorization and account/model gates pass.
- Add test coverage by risk layer from unit and component checks through adapter contracts, browser journeys, security checks, and isolated staging verification. Record evidence in `TEST-PLAN.md`.
- Keep credentials server-only. Never place a provider key in a Vite-exposed variable, browser bundle, source map, test fixture containing a real value, or Git history. Add secret scanning before implementation work.
- Evaluate Vercel, Render, and Railway against the approved architecture and tested file/runtime limits before choosing a host. Start with a private fixture-only preview that has no provider credentials; production/live model access is a separate gate.
- Revisit if Meta does not authorize the no-login route, the live API/file lifecycle cannot be secured, or time does not permit the required verification. Do not claim a deployment is safe because it works in a demo.
