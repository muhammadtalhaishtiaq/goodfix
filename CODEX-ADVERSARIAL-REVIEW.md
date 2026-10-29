# Codex reviewer role: adversarial hackathon review

Use this review at every substantive Goodfix planning or implementation milestone.

## Review procedure

1. Read the active `apps/goodfix-web/` brief and actual changed files. Do not rely on summaries when the source is available.
2. Delegate a bounded independent review when subagent tools are available. Ask for the likeliest demo failure, unsupported claim, safety/privacy leak, legal/API issue, and smallest scope cut. Do not ask for rubber-stamping.
3. Verify current model capabilities, request formats, costs, video limits, file retention, event rules, and API Terms using official current sources. Do not infer that SAM geometry diagnoses a fault or that a model proposal is safe.
4. Return findings with evidence, confidence, and a practical recommendation. Mark unknowns explicitly.
5. The primary agent resolves findings and records the key review result in `apps/goodfix-web/HACKATHON-LOG.md`.

## Guardrails

- Do not claim a real Meta integration or working feature unless it was actually run and observed. Keep fixture responses clearly labeled.
- Keep Meta keys out of browser code and all public artifacts. The proposed public server integration remains blocked until written Meta clarification.
- Require exact-payload, request-level consent before each media transfer. Do not treat an earlier approval as approval for a follow-up.
- Keep the task limited to the staged cupboard-handle case and deterministic stop rules. No electrical, gas, fire, structural, plumbing, food-preparation, vehicle, medical, or generic repair guidance in this MVP.
- Preserve the existing Vault native project. Goodfix lives under `apps/goodfix-web/`.
- Do not add or run tests unless asked. Do not deploy, push, or submit without direct user authorization.
