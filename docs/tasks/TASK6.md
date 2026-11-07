# TASK6: maintenance after initial extraction

## Prompt

Perform a small maintenance pass on `agentic-dev-template`.

The initial extraction is complete. Address these findings without redesigning the environment:

1. Clarify `AGENTS.md`: blocking quality gates must pass; informational reports must be reviewed and reported, but their findings do not automatically block completion. Command execution failures remain blocking.

2. Extend ESLint coverage to all maintained scripts under `scripts/`, with appropriate Node.js globals. Fix any actual violations without weakening rules, thresholds, or introducing suppressions.

3. Remove the duplicate `ignoreTemplateLiterals` property in `eslint.config.mjs`.

4. Keep Vite and the existing browser fixture unchanged. Portability to CLI-only projects is a separate concern.

Run the relevant checks and verify that gate/report semantics remain unchanged. Update documentation only where necessary.

Do not add dependencies, introduce abstractions, or modify WorldGL.

Commit the changes as a single maintenance commit after successful verification. Report any blockers instead of bypassing checks. Write prompt in TASK?.md
