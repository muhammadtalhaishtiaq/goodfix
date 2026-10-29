# Codex — project entry point

## Active hackathon entry

The current Meta Global AI Developer Hackathon project is the separate responsive web app at [`apps/goodfix-web/`](apps/goodfix-web/). The product is a narrowly scoped, video-guided cupboard-handle troubleshooting flow. “Goodfix” is a working title only.

The former Vault Expo/React Native app and its product history are preserved under [`archive/vault-native/`](archive/vault-native/). Do not treat Vault's past native work as new hackathon code or modify it as part of Goodfix.

## Read in this order

1. [`AGENTS.md`](AGENTS.md) — active boundaries and collaboration protocol.
2. [`STATUS.md`](STATUS.md) — current project state and verified blockers.
3. [`apps/goodfix-web/DECISIONS.md`](apps/goodfix-web/DECISIONS.md) — dated active project decisions.
4. [`apps/goodfix-web/PRD.md`](apps/goodfix-web/PRD.md) — active product requirements.
5. [`apps/goodfix-web/ARCHITECTURE.md`](apps/goodfix-web/ARCHITECTURE.md) — stack, data flow, consent, Meta boundary, and responsive UI.
6. [`apps/goodfix-web/TASKS.md`](apps/goodfix-web/TASKS.md) — ordered tasks and hard gates.
7. [`apps/goodfix-web/HACKATHON-LOG.md`](apps/goodfix-web/HACKATHON-LOG.md) — dated evidence, reviews, and blockers.
8. [Adversarial review skill](.agents/skills/adversarial-hackathon-review/SKILL.md) — required at substantive milestones.

## Source-of-truth rules

- The hackathon-specific Goodfix decisions, PRD, architecture, tasks, design artifacts, and log are under `apps/goodfix-web/`.
- Vault native code and product history are under `archive/vault-native/`. They are preserved, not part of the active project.
- [`archive/vault-native/Meta Hackathon Codex Build Playbook.md`](archive/vault-native/Meta%20Hackathon%20Codex%20Build%20Playbook.md) is a historical Vault/React Native plan. Its dates, scoring, commit/push rules, build sequence, and implementation tasks are not active instructions.
- The dated decision ledger is the authority when product/platform documents disagree. Preserve old decisions and add a dated superseding record; do not silently rewrite history.
- Use current official Meta documentation, participant resources, and Terms before coding model requests, costs, request limits, file storage, and deployment. Record exact sources and observed behavior in the Goodfix log.

## Active objective and first gate

Build one reliable sequence: approved video → Muse Spark observation/clarification → real SAM 3.1 geometry over the source frame → one bounded step → approved numbered follow-up → response tied to the correct evidence.

The live Meta integration is blocked until written authorization for the proposed no-login server-side route is obtained. The mockups are not live integrations. UI work may use clearly labeled fixtures while the gate is unresolved; never fake a successful model result.

## Build discipline

- Keep the original video and every numbered follow-up selectable for the life of the case; messages and model results cite the evidence item they used.
- For each outbound media request, preview the exact payload and require fresh affirmative approval. Keep keys out of all browser artifacts. Delete Meta Files API uploads explicitly; the API docs say they do not expire automatically.
- Models propose; deterministic scope/safety rules gate the response. No guidance for electrical, gas, fire, structural, plumbing, food-prep, automotive, medical, or unrecognized tasks in this MVP.
- Keep the desktop Workbench and phone Guided layout legible at real viewport widths. Do not add the conversation-first layout unless the core loop is complete.
- The hackathon submission requires a public repo and a three-minute demo video; clearly identify new work. Deadline: **2026-11-04 21:00 ET**.
- Do not push, deploy, publish, or submit without direct user authorization.
