# TASK2 — Battlefield and terrain redesign proposal

> Historical pre-implementation analysis. The user subsequently approved implementation; see the [implementation result](TASK2-implementation-result.md) for current changes and verification.

## Objective and outcome

Evaluate [TASK2](../../TASK2.md) before implementation: fullscreen presentation, dynamic tanks, destructible terrain, and a coherent artillery aesthetic. **Analysis completed; implementation awaits approval.** No source, tests, dependencies, or quality configuration changed.

## Architecture assessment

Keep the existing TypeScript simulation / browser split. `src/simulation/` has no DOM dependency; seeded terrain inputs and `stepGame` make headless tests practical. `src/browser/app.ts` already advances at 120 Hz and caps elapsed time after tab pauses. Canvas 2D is sufficient; neither a framework migration nor WebGL is justified yet.

The current implementation cannot deliver the requested gameplay unchanged:

- `model.ts` stores one surface height per column. `terrain.ts` explicitly opens craters to the sky, so cavities and overhangs are impossible.
- `settleTank` assigns a new position immediately. Tanks have neither velocity nor health; damage is currently binary blast death.
- `ballistics.ts` treats everything below the surface as solid. Collision and rendering must use the same new occupancy data.
- `game.ts` completes turns when the 0.45-second explosion ends. It must instead wait for consequential terrain and tank movement, including delayed deaths.
- `index.html` and `style.css` place a bounded canvas inside a document dashboard. The renderer assumes a 960×540 canvas and has no viewport/camera transform. Merely removing margins would stretch or crop gameplay.
- Presentation currently describes damage at explosion onset. Falling damage can arrive later, so final outcome feedback must reflect resolution, not just initial impact.

## Terrain alternatives

| Representation | Gameplay / visual quality | Performance and complexity | Testability |
| --- | --- | --- | --- |
| Heightmap | Smooth hills and open craters; no caves, bridges, or true undercuts | Cheapest: O(width) storage, simple collision/rendering | Excellent, but cannot test geometry it cannot represent |
| One-world-pixel occupancy | Precise circular cuts, holes and overhangs | About 518 KB for a 960×540 byte grid; full scans at 120 Hz could be costly on mobile; material dynamics add work | Exact masks and deterministic updates are straightforward |
| Coarser 2D cells | Same topology with deliberately stepped contours; supports rubble and cavities | At 2 world pixels/cell, 480×270 bytes (~130 KB) for occupancy, plus scratch buffers; modest enough to prototype without spatial trees | Small hand-built fixtures make support, collision and collapse easy to verify |
| True 3D voxels | Depth, volumetric destruction, 3D debris | Adds depth storage, meshing, camera and collision complexity irrelevant to side-view play | More fixtures and numerical edge cases without clear gameplay benefit |

“Pixel” and “cell” are resolution choices for the same 2D occupancy model, not fundamentally competing architectures. A “voxel-inspired” look does not require a 3D voxel simulation.

**Recommendation:** a fixed 2D byte grid, initially 2 world pixels per cell. Generate initial hills using the existing height formula, then fill cells below it. Preserve world-space gameplay units and independently scale rendering. Benchmark and visually inspect this resolution before committing; 1-pixel cells remain an option, not a second implementation to maintain.

### Material policy: cohesive earth, not universal falling sand

A pure sand automaton would erase overhangs immediately and turn most maps into piles. That conflicts with the request for convincing undercuts. Instead:

1. Blast disks remove occupied cells only; retain a protected bottom bedrock layer.
2. After edits, find earth connected to bedrock using four-neighbor connectivity. Connected material remains cohesive, allowing attached ledges and cavity roofs.
3. Detached material becomes loose rubble. Update it downward on a fixed material cadence, with fractional gravity-driven displacement, swept cell movement, and deterministic alternating diagonal preference. Each cell moves at most once per material tick; settled rubble sleeps until disturbed.
4. Rubble lands and becomes solid support. It does not spontaneously become cohesive earth again. Initial scope excludes rubble damage to tanks: prevent deposition inside tank bodies, route it to available neighboring cells or retain it above them. Test this explicitly; it is a gameplay simplification, not realistic crushing.

Connectivity costs O(cell count) after destruction; initially use a full scan rather than complicated incremental graph repair. Only active rubble needs repeated movement. Rendering can cache the terrain image and update changed regions. Dirty-region bookkeeping should follow profiling, not precede it.

Limitations: attached one-cell bridges can remain implausibly strong, loose material is granular rather than rigid rock, and unsupported chunks fragment rather than rotate. If those limitations fail visual review, reconsider connected-chunk motion; do not silently add a rigid-body system.

## Tank physics and turn lifecycle

Use custom vertical dynamics for two stationary artillery tanks. Add vertical speed, grounded state, and health; keep horizontal position fixed in the first version. Spawn placement may find initial support, but gameplay must never call instant settling after a blast.

Each fixed tick: apply gravity to unsupported tanks, sweep the existing radius-based collision shape through occupancy, stop at first contact, zero vertical speed, and apply landing damage once. Recheck support when material beneath a tank changes. Sweep instead of checking only the destination, preventing tunneling through thin ledges. Keep visuals and collision footprints consistent rather than enlarging tanks without matching hitboxes.

Proposed policy for approval: 100 starting health, existing blast lethality preserved, fall damage `min(100, max(0, impactSpeed - 100) × 0.5)` with speed in world pixels/second. Exactly 100 is safe; 200 inflicts 50 damage; 300 is lethal. These are tuning defaults, not measured balance. No rotation, sliding, bouncing, or tank stacking in this scope. Vertical-only motion satisfies the explicit gravity requirement but not a broader expectation of fully physical vehicles.

Use a shot-resolution phase independent of explosion visuals. Resolve blast damage before motion, then update terrain before tank support/collision each tick. Keep firing disabled until projectile, explosion, tanks, and material have resolved; determine survivors only then, including simultaneous deaths. Track material stability explicitly and require a short consecutive stable interval (proposed 0.2 seconds) to avoid premature handoff. Deterministic gravity and finite bedrock should settle ordinary fixtures; a maximum-duration watchdog should flag a defect, not teleport objects or silently end the turn.

### External physics engine?

**Not justified for the proposed scope.** An engine would help with rotating vehicles, sliding, rigid debris and contact stacks, but it would not solve destructible occupancy terrain automatically. Converting changing cell boundaries to engine colliders and synchronizing destruction would likely be the dominant complexity. Custom swept vertical collision is smaller and easier to test. Revisit an engine only if rigid chunk motion or vehicle rotation becomes an approved gameplay requirement; no engine was selected or benchmarked here.

## Fullscreen presentation and visual identity

**Direction: cut-paper arcade battlefield.** Dark ink outlines; muted indigo sky; layered ochre earth with a pale exposed cut edge; cyan and coral player tanks with distinct labels/shapes. Tanks have chunky tracked silhouettes and articulated barrels. Shots are bright cream points with short trails; explosions use a white core, stepped amber ring and brief non-colliding debris. Terrain, tanks and effects share the same coarse visual scale. Avoid mixed photorealistic textures, glossy panels and decorative dashboard cards.

- Canvas fills the dynamic viewport (`100dvh`) behind compact DOM overlays; no browser Fullscreen API requirement.
- Small top status/player-health strip and restart control; bottom angle/power/fire dock. Help opens on demand. Keep semantic controls, keyboard operation, live status and visible focus.
- Maintain world aspect ratio through one uniform camera transform, never stretch physics. Extend decorative sky/soil into unused viewport space. Fit the whole world into a safe rectangle between overlays, so portrait play remains possible without cropping tanks. This trades portrait battlefield scale for full situational visibility; prototype it before adding a follow camera.
- Resize backing storage for device pixel ratio with a measured cap. Resize/orientation changes alter only the camera, never terrain or physics.
- Reserve safe-area insets; compact controls reflow rather than cover tanks. Target 44 CSS-pixel touch areas, labeled player identities beyond color, and reduced-motion effects. Do not add shake by default.

## Observable acceptance criteria (proposed, not yet verified)

### Simulation

- A blast in a cavity removes only intersected cells, leaving its roof intact when still connected; distant occupancy and bedrock remain unchanged.
- An attached overhang remains; severing its last support produces visible falling material and persistent deposits. Material count is conserved during movement, excluding blast removal.
- After support removal, tank position is unchanged at the instant of carving, then advances over multiple fixed ticks with increasing downward velocity. It lands without penetrating a one-cell ledge even at maximum expected fall speed.
- Safe, damaging and lethal landing fixtures exercise the damage threshold, monotonicity and single-application rule; repeated grounded ticks cause no further damage.
- A tank landing on rubble and rubble falling around a tank neither overlap solids nor duplicate/delete material.
- The turn remains locked after the blast animation while anything consequential moves; it advances once after stability. Delayed death, self-hit and draw outcomes are correct.
- Identical seeded input and tick sequences reproduce terrain, health, positions and winner. Restart clears all motion, terrain work queues and feedback.
- Representative ordinary and worst-case collapse fixtures settle within 10 simulated seconds; failure is diagnosed, not hidden.

### Presentation and performance

- At 390×844, 844×390, 1280×720 and 1920×1080, the canvas covers the viewport; document scroll dimensions exceed neither viewport dimension by more than 1 CSS pixel. Both tanks, aim controls, status and restart remain visible and unobscured.
- Keyboard-only users can aim, fire, restart and open/close help. Touch targets are at least 44×44 CSS pixels; focus and turn ownership are identifiable without color alone.
- Resize and device-pixel-ratio changes preserve simulation state and avoid stretched circles. Screenshot review confirms one palette, outline language and effect style across terrain, vehicles and HUD.
- A recorded support-removal scenario visibly shows crater, delayed fall, landing and any health loss. High arcs retain an above-view indicator.
- Proposed budget: 60 FPS with p95 frame time ≤16.7 ms and no collapse-induced main-thread stall >50 ms during a 30-second stress replay. Record browser, device and resolution on one desktop and one mid-range mobile device before treating this as passed. These are targets, not current measurements.

## Implementation sequence and test preservation

After approval: first build headless cell fixtures and material rules; then tank motion and resolution lifecycle; then fullscreen camera and unified rendering; finally visual/performance validation and tuning. Keep modules cohesive: terrain owns occupancy/material lifecycle, tank physics owns support/movement/damage, game owns turn policy, browser owns camera and effects. No generic engine interfaces, ECS, worker, or plugin terrain abstraction initially.

Preserve useful tests for ballistics, swept collision, aim validation, player direction, blast outcomes, restart isolation, and turn alternation. Representation-specific assertions about height arrays and immediate settling must be explicitly migrated to the approved new behavior, not deleted or weakened merely to pass. Extend browser tests from horizontal-overflow checks to viewport coverage, vertical overflow, camera changes and delayed resolution. Preserve all existing quality tooling and thresholds.

## Verification and remaining findings

Executed `npm run check:report` against unchanged source: exit 0; lint passed; **33 tests passed, 0 failed**; TypeScript/Vite build passed. Cognitive complexity **total 71, maximum 5**. All informational report commands executed successfully.

Reviewed findings: **4 informational warnings**: two TypeScript-metrics findings (`startGame` LOC 57 vs 50; `drawTank` parameters 4 at threshold 4), and two dependency-cycle warnings inside Vite/Rollup dependencies. No blocking violations. Structure maximum dependency depth is 5. Metrics have no source-change delta. Browser smoke tests and device performance measurements were not run. Formatting was not run because no source was modified; the formatter targets source/tests/HTML, not this Markdown report.

## Deviations and decisions needed

No implementation, installation, or environment changes. Approve or revise the cell resolution, cohesive-earth/loose-rubble policy, vertical-only tank scope, fall-damage defaults, and portrait fit strategy before implementation. Visual quality and mobile performance remain unvalidated. This report is the only intended task output.
