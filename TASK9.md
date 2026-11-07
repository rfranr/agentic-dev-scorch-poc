# TASK9 — Make weapon selection visible on desktop

## Objective

Fix the TASK8 regression reported by the user: the Weapon dropdown is not visible on desktop because the desktop layout hides the entire aiming form.

## Expected behavior

- Desktop players can see and use the Weapon dropdown to select Standard or Heavy during aiming.
- Desktop mouse aiming, mouse-wheel power adjustment, and keyboard controls remain unchanged.
- Touch layouts retain the weapon selector, aiming sliders, and Fire button.
- Weapon selection remains disabled outside the aiming phase and resets according to the existing turn/restart rules.

## Acceptance criteria

1. The Weapon dropdown is visible and usable with desktop mouse/pointer layouts.
2. Desktop aiming sliders and Fire button remain hidden, preserving the existing arcade interface.
3. Standard and Heavy remain selectable on touch layouts.
4. Automated desktop browser coverage verifies dropdown visibility and Heavy selection.
5. Existing aiming, firing, turn, restart, and responsive-layout checks continue to pass.
6. Formatting, build, tests, quality gates, and informational report commands execute successfully.

## Scope

Adjust presentation CSS and browser regression coverage. Preserve simulation behavior. Do not add a weapon hotkey, change development tooling, or refactor unrelated systems.

## Workflow

Follow the existing project workflow and record changes, verification results, metrics, and limitations in `docs/tasks/TASK9-result.md`.
