---
name: adversarial-hackathon-review
description: Independently challenge the active Goodfix web hackathon scope, Meta API assumptions, safety and privacy boundaries, demo reliability, and judge-facing claims before substantive decisions.
---

# Adversarial hackathon review

Use this workflow at each substantive planning or implementation milestone for `apps/goodfix-web/`. Vault's existing React Native product is separate and is not the active hackathon entry.

## Review procedure

1. Read the relevant task, current source-of-truth docs, and actual changed files. Do not rely on summaries when the source is available.
2. When the active runtime exposes subagent tools, delegate a bounded review to an independent agent. Give it the exact decision or diff and ask it to identify the likeliest demo failure, unsupported claim, privacy/data-flow issue, and smallest scope cut. Do not ask it to rubber-stamp the work.
3. Check critical factual claims against official, current sources. For hackathon criteria and Meta models prefer the official participant guide and Meta Model API docs. Use Expo SDK 57 docs only when changing the separate legacy Vault mobile app.
4. Return concise findings with evidence, confidence, and a concrete recommendation. Label unknowns explicitly; do not invent latency, model capability, cost, deadline, or judging weights.
5. The primary agent resolves the finding and records the decision and any unresolved blocker in the relevant project log. A reviewer advises; the primary agent remains accountable.

## If subagents are unavailable

Do not pretend a separate agent was consulted. Run a distinct self-review pass from the judge/user perspective and say that independent review was unavailable. This skill describes a repeatable workflow; it does not create a persistent agent or guarantee runtime delegation.

## Guardrails

- No implementation or setup work unless the user asks for it.
- Preserve `AGENTS.md` product rules and locked decisions in `apps/goodfix-web/DECISIONS.md`.
- No media network call without a user-visible exact-payload preview and affirmative approval for that specific request. Record consent and request outcome without storing raw media in logs.
- Never embed an app-owned/shared Meta API secret in browser code, source maps, or commit it. The planned public server route is blocked until written Meta clarification confirms the exact no-login Integrated Product architecture.
- Keep scope tied to the staged cupboard-handle flow. A SAM mask locates an object; it is not a diagnosis or safety check. Prefer cutting a feature over weakening consent, faking an integration, or claiming an unmeasured result.
