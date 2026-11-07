# TASK8 — Introduce a second projectile type

## Objective

Extend Scorch with a second projectile type that behaves differently from the existing one.

The primary goal is to evaluate the **changeability and maintainability of the current architecture**, not to build a generic weapon system.

## Expected behavior

Introduce two selectable weapons:

- **Standard:** Preserve the existing projectile behavior, trajectory, impact, damage, and terrain deformation.
- **Heavy:** Use the same ballistic rules but produce a larger explosion crater and a larger damage radius.

The active player can select a weapon before firing.

## Acceptance criteria

1. Players can select Standard or Heavy during the aiming phase.
2. The selected weapon determines the effect of the next shot.
3. Standard behaves exactly as before.
4. Heavy produces a visibly larger crater and has a larger damage radius.
5. Weapon selection cannot change an already-fired projectile.
6. Movement, terrain physics, tank settling, turn changes, and restart remain functional.
7. Tests cover weapon selection, projectile effects, and relevant game transitions.
8. The implementation passes the existing quality gates.

## Architecture constraints

- Reuse the existing ballistics and terrain simulation.
- Avoid introducing inheritance hierarchies, plugin systems, registries, factories, or generic weapon frameworks without a demonstrated need.
- Prefer explicit domain concepts and readable code.
- Do not split cohesive functions merely to satisfy complexity metrics.
- Keep weapon-specific behavior separate from presentation and input concerns where appropriate.
- Do not refactor unrelated systems.

## Maintainability experiment

Before implementation:

1. Identify the modules that need to change.
2. Explain the expected impact and any existing architectural obstacles.
3. Record the initial change plan briefly.

After implementation:

1. Report the actual modules changed and compare them with the initial plan.
2. Identify any new coupling or implicit contracts.
3. Explain whether introducing the second weapon was straightforward or required architectural changes.
4. Identify abstractions introduced specifically for this feature and justify them.
5. Recommend no further refactoring unless there is concrete evidence of a maintenance problem.

## Workflow

Follow the existing project workflow:

- Implement the requested behavior.
- Add relevant automated tests.
- Run formatting, tests, build, and quality checks.
- Document results in `docs/tasks/TASK8-result.md`.
- Report findings and limitations before committing.

Do not run a separate maintainability review automatically. Do not modify `AGENTS.md` or the development tooling.
