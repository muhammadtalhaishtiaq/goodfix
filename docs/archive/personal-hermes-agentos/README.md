# Personal Hermes AgentOS

Private R&D workspace for using Hermes as the first personal AgentOS harness while the Vault mobile app is developed in parallel.

## Folder map

```text
personal-hermes-agentos/
├── HERMES.md                 workspace rules
├── README.md
├── agents/                   agent identity and scope definitions
│   ├── core/
│   ├── finance/
│   ├── research/
│   └── coding/
├── memory/                   curated durable Markdown memory
├── raw/                      original files; never overwrite
│   ├── finance/
│   ├── identity/
│   ├── projects/
│   └── inbox/
├── derived/                  summaries, extracted text, normalized data
├── policies/                 permissions, approvals, redaction rules
├── workflows/                repeatable tasks and runbooks
├── audit/                    local access and action logs
├── exports/                  deliberate exports only
├── backups/                  encrypted backups only
└── .gitignore
```

## Current boundary

This is a local workspace, not yet a complete sandbox. Do not place real bank statements or identity documents here until encryption, backups, and access policies are reviewed.

The mobile product remains at:

```text
../code/
```

The personal Hermes workspace is intentionally separate from the mobile app source.
