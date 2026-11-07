# Scorch — first playable version

## Implementation decisions

- **Browser only:** TypeScript and Canvas 2D with Vite. No new dependencies,
  backend, framework, or environment provisioning.
- **Simulation boundary:** `src/simulation/` owns terrain, tanks, projectile,
  explosion, turn, and result state. It has no DOM or rendering dependency.
  `src/browser/` owns controls, animation timing, and drawing.
- **Terrain:** a 960-column heightfield generated from two smooth waves with
  randomized phases. Blasts remove a circular lower envelope, opening craters to
  the sky. Ground never regenerates; a thin bedrock layer keeps tanks in bounds.
- **Ballistics:** world pixels and seconds, positive y downward, constant gravity,
  fixed 1/120-second simulation steps. Swept collision sampling at no more than
  one pixel prevents tunneling through terrain or tanks. Shots can travel above
  the visible sky; an indicator tracks them until they return or leave a side.
- **Damage and settling:** tanks use a 12-pixel collision radius. Blasts damage
  tanks whose centers are within the 32-pixel damage radius plus tank radius,
  including the boundary. Damage is applied before tanks settle, so falling does
  not dodge a blast. Tanks instantly rest on their highest remaining footprint
  support; there is no falling damage or sliding.
- **Lifecycle:** aiming → flying → explosion → next turn or result. Misses resolve
  without an explosion. Inputs are locked during resolution and after the result;
  the simulation also rejects duplicate shots. A winner is selected only after
  resolution; mutual destruction is a draw. Each tank remembers its aim.
- **Restart:** replaces the complete match state without reloading, including
  terrain and aim, even during flight. The single animation loop reads the new
  match, so no old projectile callback survives. Accumulated simulation time resets.
  After long frame pauses, excess elapsed time is discarded rather than fast-forwarded.

## Verification executed

Using Node.js 24.22.2 and npm 11.19.1:

| Command | Result |
| --- | --- |
| `npm run format` / `npm run format:check` | Passed; coverage now also includes CSS and HTML |
| `npm run check:report` | Passed, including every report command |
| `npm test` (inside `check`) | 29 simulation/tooling tests passed |
| `npm run build` | TypeScript and Vite production build passed |
| `npm run test:browser` | 2 Chromium workflows passed, development and production |
| `npm run metrics:html` | Passed |
| `git diff --check` | Passed |

Simulation tests cover gravity and integration, aim bounds, both firing directions,
duplicate-shot rejection, terrain/tank collisions, swept collision, world exits,
crater persistence and boundaries, settling, explosion timing, turn changes,
direct and nearby destruction, self-destruction, draws, and fresh match state.
Existing runtime-global and structural-runner regressions remain intact.

Browser workflows use reproducible terrain and actual UI input handlers to verify
angle/power controls, keyboard slider input, projectile rendering, input locking,
a win, battlefield image changes, player changes, and restart after a result and
during flight. An additional screenshot was visually reviewed for readable
controls, player labels, terrain, and tank placement.

## Reviewed reports and remaining findings

- **ESLint:** 0 errors, 0 warnings. No rules, limits, or severities were weakened.
- **Cognitive complexity:** total **46**, maximum **5**, **0 violations**. The
  environment-only baseline was total 2, maximum 1; the increase accompanies the
  game and additional tests.
- **TypeScript metrics:** 10 files, 95 functions, 1,029 LOC. One advisory finding:
  `startGame` is 54 LOC against the report's 50-LOC warning. It retains cohesive
  startup, event binding, and the animation closure rather than fragmenting their
  shared match/clock lifecycle just to lower a metric. Lint's enforced function
  limits pass.
- **Dependencies:** 0 errors, **2 advisory cycle warnings** in installed Vite and
  Rollup internals, newly reached through the browser test's Vite import. No
  project-owned cycles were reported. Kept the original rule and coverage instead
  of hiding third-party findings. 706 modules and 1,464 dependencies analyzed.
- **Structure:** maximum project-owned dependency depth **5** (baseline 0),
  maximum direct fan-out **4**, maximum transitive count **7**. Simulation imports
  remain independent of browser code.

Total remaining findings: **0 blocking violations, 3 advisory findings**.
Pi integrations, skills, report scripts, and Vite private-path protections remain
unchanged. Browser tests are a separate explicit command using the already
installed Chromium; normal checks require no browser installation.

## Known limitations

- Heightfields cannot represent caves or overhangs. Tank motion is instantaneous
  vertical settling, not rigid-body physics. Projectiles collide as points against
  circular tanks and the sampled terrain.
- Desktop local play only; no AI, networking, sound, or persistence. Browser
  verification covered Chromium, not Firefox or WebKit. Canvas gameplay is visual;
  native controls and live text are keyboard/screen-reader discoverable, but the
  battlefield does not provide an equivalent nonvisual playing experience.
- Browser smoke tests check observable flow and image changes; numerical crater
  and collision behavior is verified separately in simulation tests.
- TypeScript metrics skip `.mjs`; structural entry points remain source and
  top-level TypeScript tests. Historical template results are not game evidence.
