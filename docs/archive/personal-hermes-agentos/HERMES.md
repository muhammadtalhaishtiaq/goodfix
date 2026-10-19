# Personal Hermes AgentOS

This is Talha's private personal-agent workspace for Hermes.

## Purpose

Use this workspace for personal planning, research, memory, documents, and controlled specialist-agent work. It is separate from Hermes runtime configuration and separate from the Vault mobile app source.

## Rules

- Treat all content under `raw/`, `memory/`, and `private/` as sensitive personal data.
- Do not expose raw personal or financial data to delegated agents unless the task explicitly requires it.
- Prefer summaries and redacted extracts for specialist agents.
- Do not send, publish, purchase, transfer money, delete, or modify external systems without explicit approval.
- Keep original files in `raw/` unchanged; write derived outputs to `derived/`.
- Use `memory/` for durable, human-readable Markdown only.
- Record important access and actions in `audit/`.
- This folder is an R&D workspace, not a production security boundary. Filesystem permissions and tool permissions still matter.

## Agent routing

- `agents/core/` is the main personal orchestrator definition.
- `agents/finance/` is sensitive and must receive only finance-scoped context.
- `agents/research/` may use web access but must not receive finance or identity data.
- `agents/coding/` may work on explicitly approved repositories only.

## Hermes usage

Run Hermes from this directory when working on this workspace:

```bash
cd /Users/talhaishtiaq/documents/me/projects/rnd/agentos/personal-hermes-agentos
personal-agentos
```

Telegram is the interface, but this workspace does not by itself change Telegram routing or grant agents permissions. Those must be configured and verified separately.
