# TASK — Scorch: Destructible Terrain Artillery Game

## Objective

Build a minimal, playable 2D artillery game inspired by classic Scorched Earth.

The game runs in a web browser. Players fire projectiles across a destructible landscape, attempting to hit an opposing tank.

This is the first real project built using `agentic-dev-template`. Preserve its development workflow, quality tooling, and verification capabilities.

## Scope — First playable version

### 1. Game world

- Display a side-view, 2D landscape.
- Generate uneven terrain when the game starts.
- Place two distinguishable tanks on the terrain.
- Tanks must rest on the terrain surface.
- The game must render and respond to user input without requiring a backend.

### 2. Aiming and shooting

- Players take turns controlling their tanks.
- The active player can adjust the firing angle and power.
- A visible indicator shows the current angle and power.
- Firing launches a projectile from the active tank.
- The projectile follows a trajectory influenced by gravity.
- Only one shot may be active at a time.

### 3. Collisions and explosions

- A projectile can collide with terrain, a tank, or leave the playable area.
- A terrain or tank impact produces an explosion.
- Explosions remove terrain, leaving a visible crater.
- The modified terrain persists for subsequent turns.
- Tanks must respond coherently when the terrain underneath them is destroyed.

### 4. Turns and game result

- After a shot resolves, control passes to the other player unless the game has ended.
- A direct hit or sufficiently close explosion can destroy a tank.
- The game announces the winner when a tank is destroyed.
- Players can restart the game without reloading the page.

### 5. User interface

- Show whose turn it is.
- Display the selected angle and power.
- Provide simple, discoverable controls for aiming and firing.
- Make the game state understandable without developer tools.
- Prioritize playability and readability over visual effects.

## Out of scope

- Multiplayer networking.
- Computer-controlled opponents.
- Multiple weapon types.
- Shops, currency, upgrades, or progression systems.
- Accounts, persistence, or backend services.
- Mobile-specific controls.
- 3D rendering.
- Elaborate menus or animations.

## Engineering constraints

- Use JavaScript/TypeScript and browser technologies.
- Keep game rules and simulation logic testable independently of rendering where practical.
- Preserve the template's existing linting, formatting, testing, complexity checks, metrics, dependency analysis, and Pi integrations.
- Replace the template's demonstration fixtures with relevant application code and tests.
- Do not weaken quality thresholds to make implementation pass.
- Avoid unnecessary dependencies and abstractions.
- Do not introduce an application framework unless there is a concrete need.
- Use the existing tools and conventions when appropriate, but allow the agent to make justified technical decisions.

## Acceptance criteria

The implementation is acceptable when:

1. The game starts in a browser and displays two tanks on uneven terrain.
2. Both players can adjust angle and power and fire projectiles.
3. Projectiles visibly follow ballistic trajectories.
4. Terrain collisions produce persistent, visible craters.
5. Tanks remain or fall consistently with changes in terrain.
6. Turns alternate correctly after resolved shots.
7. Destroying a tank ends the game and identifies the winner.
8. Restarting produces a new playable match.
9. Automated tests cover core simulation behavior, including projectile movement, collision resolution, terrain destruction, and turn transitions.
10. Existing quality checks and reports execute successfully without weakening their rules.

## Delivery

- A playable browser application.
- Automated tests for core game behavior.
- Updated development commands where necessary.
- A short README explaining how to run, play, and test the game.
- A concise report describing implementation decisions, verification results, and known limitations.

## Implementation guidance

Begin with a small playable vertical slice.

Prefer simple, observable behavior over premature extensibility. Introduce abstractions only when current requirements justify them.

Do not implement out-of-scope features.

Make engineering decisions within these boundaries and document significant trade-offs.