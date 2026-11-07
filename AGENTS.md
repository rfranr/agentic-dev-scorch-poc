# Agent Instructions

## Development

- Keep implementations simple, readable, and maintainable.
- Preserve existing behavior and public APIs unless explicitly requested otherwise.
- Prefer meaningful refactoring over changes made solely to satisfy metrics.
- Avoid unnecessary abstractions.

## Code Quality

After modifying source code:

1. Run `npm run format`.
2. Run `npm run check:report`.
3. Review ESLint violations, cognitive complexity, dependency and structure reports.
4. Resolve blocking violations through meaningful improvements, without weakening thresholds, disabling rules or adding suppressions.
5. Do not modify existing tests solely to make them pass.
6. Repeat formatting and verification until blocking quality gates pass and all report commands execute successfully.
7. Prefer cohesive modules, clear dependencies, limited shared mutable state and minimal indirection.
8. Report remaining violations and relevant metric changes.

**Blocking quality gates must pass before completion. Informational reports must be reviewed and their findings reported, but findings do not automatically block completion. Command execution failures remain blocking, including failures to execute informational reports.**

`check` enforces lint, tests, and build. Cognitive limits are enforced by lint; the cognitive report, TypeScript metrics, and structural metrics are informational. Dependency cycles retain warning severity. `check:report` retains nonzero command results; a report's printed findings are not themselves a new exit-code gate.
**Do not install dependencies or modify the environment without explicit approval.**

If a check cannot pass within these constraints, report the blocker instead of bypassing it.

## Environment

- Do not install dependencies or modify the environment without approval.
- Never install global packages.
- Do not modify files outside the project.

## Completion

Report:
- Summary of changes.
- Total and maximum cognitive complexity.
- Number of remaining violations.
- Test and build results.

### Human Readability

Code must be optimized for human comprehension, not minimum token count.

- Prefer descriptive names over abbreviations.
- Each function should express one clear responsibility.
- Separate business rules, state management and mathematical calculations when it improves clarity.
- Use named constants for domain-specific thresholds.
- Prefer explicit intermediate variables over dense expressions.
- Avoid multiple variable declarations on the same line.
- Extract functions when their names explain an intention, not merely to satisfy lint limits.
- Avoid unnecessary abstractions and excessive fragmentation.
- Preserve observable behavior when refactoring.
- Make units explicit where ambiguity matters, especially time, distance, speed, and angles. Keep conventional mathematical names where their meaning is locally clear.
- Make mutation and state lifecycle apparent: identify shared objects and explain what persistent state measures and when it resets.
- Document non-obvious policy ordering and boundary behavior; explain why, not what the syntax does.
- Do not compress statements or extract trivial helpers to satisfy size metrics. Keep cohesive logic together.

Before completing a task, review the modified code as if another developer had to maintain it without additional explanations.

## Development tooling

Pi is the primary AI coding agent.

Project-specific Pi packages are declared in `.pi/settings.json`.

For specialized tasks, inspect the skills available through Pi and read the relevant skill before using it. Technical Documentation is the existing example for documentation work. Installation requires approval; see [skill setup and provenance](README.md#skills).

## Improvements from consuming projects

Agents may suggest reusable environment improvements discovered in a consuming project, but must not modify this template from that project without explicit authorization. Validate fixes in the project first, separate project-specific changes from reusable improvements, and propose the latter for human review. Keep project and template Git histories independent; see [contributing improvements](README.md#contributing-improvements).

Never claim verification succeeded unless the checks were actually executed.
