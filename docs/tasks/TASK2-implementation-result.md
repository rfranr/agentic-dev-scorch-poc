# TASK2 — Implementation result

## Objective

Implement the [TASK2](../../TASK2.md) redesign after the user's approval of the [analysis proposal](TASK2-result.md).

## Changes

- Replaced heightmaps with a 480×270 byte grid: 2 world pixels per cell, circular excavation, protected bedrock, four-connected cohesive earth, and detached loose rubble.
- Added deterministic, gravity-driven material movement at a 30 Hz cadence, swept movement, alternating diagonal preference, conserved deposits, and tank-body exclusion. Settled deposits sleep and wake after destruction or moving tank support.
- Added tank vertical velocity, grounded state, 100 starting health, swept support collision, and single-application landing damage: speeds up to 100 world pixels/second are safe; 200 costs 50 HP; 300 is lethal. Blast lethality is unchanged. Spawn placement alone uses instant settling.
- Kept shots locked until terrain and tanks settle for 0.2 seconds, independently of the explosion animation. Winner selection includes delayed deaths. A ten-second watchdog reports unresolved dynamics rather than teleporting objects.
- Added a viewport canvas, uniform safe-rectangle camera, DPR backing-size cap of 2, compact accessible overlays, health indicators, and reflowing controls. Decorative terrain/sky extend beyond the simulation bounds; resize leaves simulation state untouched.
- Unified cyan/coral tanks, ink outlines, ochre cell terrain, cream trails, and stepped amber explosions. Reduced-motion preference disables explosion expansion. Preserved keyboard controls, live match status, and on-demand help.
- Migrated representation-specific tests to occupancy assertions; retained ballistic, damage, turn, restart, and browser coverage. Added cavity, connectivity, conservation, collapse, rubble/tank exclusion, swept landing, damage, delayed-result, deterministic replay, and no-teleport fixtures.

## Verification

All final commands exited successfully:

- `npm run format` and `npm run format:check`.
- `npm run check:report`: ESLint passed; **43 tests passed, 0 failed**; TypeScript/Vite build passed. All informational reports executed.
- `npm run test:browser`: **2 tests passed**, covering development and production builds, wins, turns, restart, keyboard aiming/help, resize during flight, DPR 2 backing storage, viewport coverage, overflow, and Fire touch-target size. Viewports: 390×844, 844×390, 1280×720, 1920×1080.
- Reviewed temporary Chromium screenshots at 1280×720 and 390×844. Portrait retains the whole world at the cost of small tank silhouettes; no claim of physical-device usability validation.
- Ran a separate 30-second synthetic browser stress replay: a detached 6,000-cell slab repeatedly falls above bedrock while rendering, with the ordinary application also running. Headless Chromium 156.0.8078.4, Linux x64, 1280×720, DPR 1: **1,797 frames**, p95 frame interval **16.8 ms**, maximum **33.5 ms**, **no observed >50 ms long tasks**, six scenario starts. This is not a desktop/mobile hardware benchmark; the strict proposed 16.7 ms p95 target was not met.

### Quality findings

Cognitive complexity: **total 148** (previously 71, +77), **maximum 5** (unchanged). **0 blocking violations; 6 informational warnings** (previously 4):

- `startGame`: LOC 58 versus 50 (previously 57).
- `drawTank`: four parameters at threshold four (unchanged).
- `traceBlast`: nesting three at threshold three (new).
- `visitNeighbors`: four parameters at threshold four (new).
- Two existing dependency cycles inside Vite/Rollup dependencies; no source cycle reported.

Maximum dependency depth is **6**, previously 5. Added responsibilities account for the total-complexity increase; no thresholds, suppressions, dependencies, or quality tooling were changed.

## Deviations and limitations

- Rubble shares a disturbance-level gravity clock, capped at 180 world pixels/second, rather than storing independent per-grain velocities. Awake material uses full-grid bottom-up sweeps; sleeping deposits do not scan. Per-active-grain/dirty-region optimization remains a profiling decision. Terrain rendering caches a bitmap by revision.
- Vertical-only tanks, cohesive attached ledges, granular detached chunks, no tank crushing, no rotation/sliding/stacking, and small portrait silhouettes are intentional scope limits. Explosion effects remain lightweight; decorative debris particles were not added.
- Physical desktop/mobile performance, touch usability, orientation/device-DPR changes on actual devices, a recorded support-removal video, and comprehensive visual approval remain outstanding. Browser tests verify dimensions and selected controls, not every proposed visual/accessibility criterion.
- Interim verification exposed a repeated landing-resolution issue; fixed support contact detection and reran all gates successfully.

## Outcome

**Implementation completed; physical-device and full visual/performance acceptance remain pending.** No installation or dependency/environment changes were required.
