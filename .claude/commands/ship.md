---
name: ship
description: Hand a reviewed spec to the Sonnet executor to implement
---

Implement this reviewed spec by delegating to the `executor` subagent:

$ARGUMENTS

Use the **executor** agent to implement the spec at the path above. When it returns:
1. Summarize what changed (files + short diff).
2. Run the verification steps from `CLAUDE.md` if the executor didn't.
3. Remind me to review; commit only when I tell you to.
