---
name: decision
description: Record a locked product decision to docs/DECISIONS.md so it isn't relitigated later.
---

# /decision — Log a decision

A decision got made. Capture it so we never relitigate it.

1. Append to `docs/DECISIONS.md` (create it if missing), **newest first**, as:
   - `## <YYYY-MM-DD> — <decision in one line>`
   - `- Why:` the reasoning at the time
   - `- Revisit if:` the condition that would reopen it
2. If the decision changes the spec, also update `docs/PRODUCT.md` (or `MASTER.md`) so the docs stay true.
3. Use **absolute dates**. When a decision is reversed later, don't delete it — mark it superseded and link the new one.

Keep it to a few lines. This is a ledger, not an essay.
