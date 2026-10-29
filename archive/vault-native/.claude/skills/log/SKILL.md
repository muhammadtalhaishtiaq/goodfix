---
name: log
description: End-of-session build log — one tight entry in docs/journal/YYYY-MM-DD.md capturing what moved and what's next.
---

# /log — Session log

Close the session. Write one dated entry so the next session starts with context.

1. Append to `docs/journal/<YYYY-MM-DD>.md` (create folder/file if missing), newest entry last:
   - what changed this session (files, decisions, progress)
   - what's next (the single next action)
2. Keep it to 1–4 lines. State changes, not narrative.
3. If a real decision was made, also run the intent of `/decision`. If the spec changed, make sure the docs already reflect it.

Absolute dates. Honest about what did NOT get done.
