# Goodfix web prototype

**Working title:** Goodfix. The public brand is not decided.

This is the active web project for Talha's Meta Global AI Developer Hackathon entry. The former Vault Expo/React Native personal-agent product is preserved under `archive/vault-native/` so the event work and demo contribution remain easy to identify.

## Current state — 2026-10-29

- The product direction and responsive layout are documented in [`docs/PRD.md`](docs/PRD.md).
- The chosen UI direction is Workbench on desktop, with a step-focused mobile adaptation. The interactive comparison mockup is [`design/goodfix-layout-comparison.html`](design/goodfix-layout-comparison.html).
- A minimal Vite/React shell now exists. Dependencies are not installed, it has not been verified, and the upload flow, backend, and live Meta integration do not exist.
- Meta API routing for an unauthenticated public product is a hard written-authorization gate. No provider key may be placed in browser code.
- The first demo task is a visibly loose cupboard handle. It is a narrow test case, not a promise that the system can diagnose or repair anything.

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/TASKS.md`](docs/TASKS.md) before implementation.
