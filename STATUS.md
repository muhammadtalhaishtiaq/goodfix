# Project Status

**Updated:** 2026-10-30

## Active project: Goodfix Web

- Direction: responsive web experience; desktop Workbench, phone Guided layout.
- First demo task: a staged, visibly loose cupboard handle.
- Product and architecture decisions: [`apps/goodfix-web/docs/DECISIONS.md`](apps/goodfix-web/docs/DECISIONS.md).
- Scope and safety requirements: [`apps/goodfix-web/docs/PRD.md`](apps/goodfix-web/docs/PRD.md).
- Ordered work and blockers: [`apps/goodfix-web/docs/TASKS.md`](apps/goodfix-web/docs/TASKS.md).
- Security controls and release gates: [`apps/goodfix-web/docs/SECURITY-PLAN.md`](apps/goodfix-web/docs/SECURITY-PLAN.md).
- Test layers and release evidence: [`apps/goodfix-web/docs/TEST-PLAN.md`](apps/goodfix-web/docs/TEST-PLAN.md).
- Design prototypes: [`apps/goodfix-web/design/`](apps/goodfix-web/design/).

## Current state

The planning documents and HTML design prototypes are joined by a minimal React/Vite local shell. The upload flow, case state, backend, CI, Meta API calls, and persistent case storage are not implemented. Package dependencies have not been installed, no lockfile exists, and no app tests have run. The `test` script references Vitest, which is not yet in the app's dev dependencies. Do not describe the shell or a prototype fixture as a live model result.

On 2026-10-30 the agent workflow moved to Claude Code: `CLAUDE.md` and `.claude/` (settings, the `hackathon-red-team` subagent, and project skills) replace the earlier agent files, and the agent-skills plugin is enabled at project scope. Specs moved to `apps/goodfix-web/docs/`.

Live Meta media routing for a public no-login service remains blocked pending written authorization. Preserve per-request payload preview and consent, local audit records, and provider-file deletion requirements.

## Next milestone

1. Re-check the official participant guide, rules, and judging rubric; stress-test the idea and record any scope change as a dated decision.
2. Re-cut `docs/TASKS.md` to the remaining days before the deadline.
3. Resolve dependencies, generate and review the lockfile, add Vitest, then `npm run build` and the first render test.

**Hackathon submission deadline:** 2026-11-04 21:00 ET.
