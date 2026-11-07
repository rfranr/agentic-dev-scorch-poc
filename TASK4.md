# TASK4 — Direct Arcade Controls

## Objective

Replace Scorch's HTML form-based aiming controls with direct mouse and keyboard interaction.

The battlefield must remain fullscreen, with a minimal HUD integrated into the game.

Do not modify terrain physics, structural stability, ballistics, damage rules, or turn resolution.

## Desktop controls

### Mouse

- Move the mouse to aim the active tank toward the pointer.
- Show the aiming direction immediately.
- Use the mouse wheel to adjust firing power.
- Left-click to fire.
- Do not fire when interacting with HUD controls.
- Prevent unintended page scrolling or text selection during gameplay.

### Keyboard

- Left / Right arrows: adjust firing angle.
- Up / Down arrows: adjust firing power.
- Space: fire.
- R: start a new match.
- Ignore repeated firing input while a shot is active.

Keyboard and mouse must operate on the same aiming state without conflicting.

## User interface

- Remove the angle and power sliders and their surrounding form.
- Keep the battlefield filling the available viewport.
- Display angle, power, health, and active player in a compact HUD.
- Keep the restart action accessible.
- Show controls briefly in an unobtrusive help overlay.
- Provide clear visual feedback for the active tank and aiming direction.

## Mobile compatibility

Preserve the existing touch interface until a dedicated touch-control task.

Do not claim mobile gameplay support if removing the form makes touch aiming or firing unavailable. Keep a usable touch fallback or document and report the limitation explicitly.

## Acceptance criteria

1. A player can aim, adjust power, and fire using only the mouse.
2. A player can perform the same actions using only the keyboard.
3. Moving the mouse visibly changes the active tank's firing direction.
4. The mouse wheel changes power without scrolling the page.
5. A single click or Space launches one shot.
6. Controls cannot launch another shot during flight or terrain resolution.
7. Switching between mouse and keyboard preserves coherent aiming state.
8. The battlefield remains fullscreen without sliders or separate control panels.
9. Restart works through both the UI and the R key.
10. Browser tests verify mouse and keyboard interactions, not merely the existence of event handlers.

## Engineering constraints

- Preserve the existing simulation and physics behavior.
- Prefer browser event handling over new dependencies.
- Keep input handling separate from simulation and rendering where practical.
- Preserve all existing quality gates.
- Avoid unnecessary abstractions.

## Delivery

- Updated gameplay controls and HUD.
- Relevant automated interaction tests.
- Updated control instructions in README.
- `docs/tasks/TASK4-result.md` with changes, verification, limitations, and outcome.