---
name: adversarial-hackathon-review
description: Independently challenge the Goodfix hackathon scope, Meta API assumptions, safety and privacy boundaries, demo reliability, and judge-facing claims. Use at each substantive planning or implementation milestone, before locking a decision, and before any demo or submission step.
---

# Adversarial hackathon review

Run this at each substantive milestone for `apps/goodfix-web/`.

## Procedure

1. Identify the exact decision, diff, or files under review. Read them yourself first.
2. Launch the `hackathon-red-team` subagent with that exact scope (file paths, diff range, or decision text). Ask for its five findings; never ask it to rubber-stamp.
3. Check any critical factual claim it raises against official current sources (participant guide, Meta Model API docs, Meta API Terms).
4. Resolve each finding: accept and change the work, or reject with a reason.
5. Append a dated entry to `apps/goodfix-web/docs/HACKATHON-LOG.md`: what was reviewed, the key finding(s), and how they changed or confirmed the decision. Never claim a review occurred if the subagent was not actually run.

If the subagent cannot run, do a distinct self-review from the judge's and the user's perspective, and say in the log that independent review was unavailable.

## Guardrails

- Preserve the rules in `CLAUDE.md` and locked decisions in `docs/DECISIONS.md`; reverse a decision only with a new dated entry.
- The reviewer advises; the primary agent stays accountable for the final call.
