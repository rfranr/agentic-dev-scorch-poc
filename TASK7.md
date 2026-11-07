# TASK7 — Tank movement

## Objective

Allow players to move their tanks across the terrain, with movement that respects the existing terrain and physics simulation.

Movement should feel similar to Lemmings walking across uneven terrain.

## Expected behavior

- Players can move the active tank left and right using **A / D**.
- Tanks follow the terrain surface, including slopes and small steps.
- Tanks cannot move through solid terrain or beyond world boundaries.
- Tanks fall naturally when moving over unsupported terrain.
- Movement is allowed only during the aiming phase.
- Moving a tank does not consume the turn or fire a shot.
- The existing aiming controls, projectile physics, terrain deformation, and settling behavior remain functional.

## Constraints

- Reuse the existing terrain and tank physics where appropriate.
- Avoid introducing pathfinding, navigation systems, or unnecessary abstractions.
- Keep movement deterministic and compatible with the fixed simulation timestep.
- Preserve the existing project architecture and quality requirements.

## Acceptance criteria

1. Holding A or D moves the active tank continuously.
2. The tank visibly follows uneven terrain.
3. The tank stops at impassable obstacles and world boundaries.
4. Unsupported tanks fall and settle according to existing physics.
5. Movement is disabled during projectile flight, explosions, and finished games.
6. Existing aiming and firing controls continue working.
7. Automated tests cover movement, collisions, boundaries, and falling.

Follow the existing task workflow: implement, verify, report results and limitations. Do not refactor unrelated systems or commit until reviewed.
