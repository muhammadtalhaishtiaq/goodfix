# Goodfix Hackathon Log

Append dated, evidence-based notes here. Never include API keys, raw user media, or private account data.

## 2026-10-29 — Project direction locked

- Decision: separate responsive web project at `apps/goodfix-web/`; Goodfix is a working title only. Vault's existing React Native product remains in the repository and is not the hackathon entry.
- First demo task: a staged visibly loose cupboard handle. Scope excludes plumbing, electrical work, cooking, and generic repair-anything.
- Layout: Workbench on desktop; step-focused Guided adaptation on phone. Conversation-first stays an alternate concept.
- Independent red-team finding: the API proxy/authorization question is a hard gate; preserve all evidence with monotonically numbered attachments; SAM localization is not fault diagnosis; six-day demo needs real end-to-end proof; delete persistent Meta Files API uploads.
- Source docs checked 2026-10-29: Meta video understanding, SAM 3.1 segmentation, Files API, API Terms, and Cerebral Valley event page. No user media or API calls were made for this research.
- Current implementation state: HTML layout mockups only. The web application, backend, Meta calls, and persistent case storage are not implemented.

## 2026-10-29 — Repository cleanup

- Archived the former Vault Expo/React Native source, assets, tests, product documents, and historical playbook under `archive/vault-native/`; preserved their contents rather than deleting them. Goodfix prototypes remain under `apps/goodfix-web/design/`.
- Independent archive review confirmed the separation and called out root package-command changes as a consequence of moving the old Expo manifest. Root project guidance now identifies Goodfix as active and the Vault tree as historical.
- No app code was changed and no tests were run as part of this organization pass.

## 2026-10-29 — GitHub publishing review

- Independent reviewer confirmed the moved Vault tree and Goodfix docs are separated; the local `.env` stays ignored and must not be force-added. The reviewer recommended `goodfix` as the repository name.
- The configured repository is `muhammadtalhaishtiaq/vault` on `main`, with write access. Its current visibility is private. It will remain private during this upload because changing visibility requires separate authorization; the event guide requires a public repository before submission.
