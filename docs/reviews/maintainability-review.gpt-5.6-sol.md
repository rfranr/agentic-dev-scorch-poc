# Independent maintainability review

## Verdict and scope

An experienced developer can follow and modify the ordinary match flow without the author's help. The browser/simulation boundary and explicit match state are strong. Explaining structural collapse, safely editing terrain, and extending the single weapon require substantially more investigation than the function sizes suggest.

Reviewed the actual implementation in `src/simulation/` and `src/browser/`, plus simulation, terrain, presentation, and browser-smoke tests. Findings below distinguish observed implementation constraints from prospective failures. No source changes were made; suggested improvements are not implemented. This is not an endorsement based on metric scores.

## Execution map and cohesion

- `app.ts:startGame` owns the match, input wiring, fixed-step accumulator, presentation updates, and animation. Input calls `setAim`/`fire`; `stepGame` controls progression; rendering follows simulation. This cohesive orchestration is easier to understand together than split into several lifecycle abstractions.
- `game.ts:stepGame` dispatches flight or resolution. `advanceFlight` integrates and sweeps the projectile, then explodes or finishes. `explode` excavates and applies damage before falling. `advanceResolution` steps rubble, then tanks, waits for stability, and finishes the turn.
- Collapse follows `carveCrater` → `detachEarth` → repeated `failUnsupportedRuns`. Support analysis builds column runs, connects overlapping runs, orders them from bottom anchors, routes load back toward anchors, and converts failures to rubble. `stepMaterial` subsequently moves that rubble.
- Rendering is mostly a reader of simulation state; presentation owns trail/history separately. Camera and scenery have recognizable display responsibilities. Simulation has no browser imports.

Navigation is reasonable for normal shots. Collapse requires following a graph algorithm and several mutation contracts across four modules; this is the main comprehension bottleneck. Helpers such as `supportThickness`, `routeLoad`, and `moveLayer` describe real algorithmic operations. There is no evidence that their extraction was merely metric-driven. `terrain-connectivity.ts` is very small, but its fixed-point relaxation is meaningful policy, not a reason by itself to merge files. `presentation.ts` mixes history updates and drawing, but both concern shot feedback; splitting it now has no demonstrated benefit.

## Significant findings

### 1. Collapse policy is deterministic but expensive to explain — high priority

**Verified:** `terrain-support.ts:orderFromAnchors`, `routeLoad`, `supportThickness`, and `failUnsupportedRuns` implement a gameplay approximation, not conventional physical stress analysis. Distance is graph hops from anchored runs, `mass` starts as run length and accumulates incoming load, overlap thickness is a union, and failure compares `mass * distance` against `EARTH_STRENGTH * thickness²`. Loads are divided equally among nearer supports. Even runs marked failed route their load within that snapshot; conversion and rebuilding happen afterward in `terrain-connectivity.ts:detachEarth`.

**Maintenance cost:** A developer investigating a collapsed bridge must reconstruct graph topology, accumulated load, and successive snapshots. The comments explain normalized strength, unlimited anchors, and snapshot ordering, but not the full rationale for routing or how a fixture reaches the threshold. The final cell grid discards the failure explanation. Existing support tests demonstrate thin/thick bridges and surcharge boundaries, which helps, but do not expose the calculation.

**Smallest useful improvement:** Add one worked bridge example documenting distance, accumulated mass, overlap capacity, and why failed runs still route load in that round. If real collapse debugging remains slow, expose an opt-in diagnostic snapshot containing those quantities and failed run coordinates; do not introduce a general event framework first.

**Risk, not demonstrated bug:** Changing routing or strength may alter several relaxation rounds in ways that a single final-grid assertion does not explain.

### 2. Terrain edits have a distributed completion contract — high priority

**Verified:** `model.ts:Terrain` exposes mutable cells, revision, wake state, and gravity-clock fields. `terrain.ts:carveCrater` restores bedrock, relaxes support, increments revision, and resets three clock fields. `terrain-connectivity.ts:detachEarth` explicitly leaves revision and clock management to callers. `material.ts:advanceMaterial` invalidates the bitmap when grains move. `render.ts:drawTerrain` trusts the revision cache.

**Maintenance cost:** Correctly editing cells requires knowing which additional actions apply. A new terrain editor or weapon can produce correct collision cells but stale imagery if it forgets revision invalidation, or reuse an old rubble acceleration clock. This is a verified distributed obligation, not an observed production failure: the current crater path performs the bookkeeping.

**Smallest useful improvement:** Document a single terrain-edit completion checklist next to the exposed state and `detachEarth`. When a second production editing path appears, share its completed-edit operation with `carveCrater`; do not wrap every cell access prematurely. Keep existing shared disturbance-clock behavior explicit rather than replacing it with per-grain physics.

### 3. Weapons and terrain materials are implicit, cross-module contracts — medium priority

**Verified:** `game.ts:fire` constructs one projectile type, `explode` uses global damage policy, `terrain.ts:carveCrater` uses global excavation radius, and `render.ts:drawExplosion` independently uses the global blast radius. `model.ts` documents cell values 0/1/2, but `terrain-support.ts` recognizes only 1 as cohesive, `material.ts` moves only 2, `terrain.ts:solidAt` treats every nonzero value as solid, and `render.ts:paintTerrain` ignores material identity.

**Maintenance cost:** A second weapon needs coordinated simulation and visual changes rather than one isolated addition. A new material value can become solid but neither structurally supported nor mobile nor visually distinguishable. That outcome follows from the current predicates; no fourth material currently exists, so it is an extension risk rather than a current gameplay defect.

**Smallest useful improvement:** For a second weapon, introduce a plain weapon specification passed through shot/impact state so excavation and display use the same selected parameters. For a new material, first name cell kinds and enumerate its support, movement, and rendering policies. Avoid a plugin system or class hierarchy for hypothetical weapons.

### 4. Presentation observes frame samples, not all simulation transitions — medium priority

**Verified:** `app.ts:startGame` can execute multiple `stepGame` calls before `updatePresentation`. `presentation.ts:updatePresentation` resets shot history only when it observes a transition into `flying`; it records impact on entering `exploding`. The trail is the last 24 rendered-frame samples, not a fixed-duration or complete ballistic trace. `describeImpact` estimates range from horizontal position and current tank survival; `traceFlight` reports impact/miss without a collider identity.

**Maintenance cost:** Shot feedback is useful to a player but insufficient to explain a precise miss. A developer must reproduce the initial state and step the collision sweep to distinguish terrain interception from tank contact. At different frame rates, trail extent differs. If firing and a very short flight both happen between presentation updates, history reset can be skipped and prior feedback can survive. The scheduling vulnerability is visible in the code; its occurrence in a real browser session was not reproduced in this review.

**Smallest useful improvement:** Add a presentation test that advances several simulation ticks between observations, including a short shot after a previous impact. If it confirms unwanted stale feedback, reset on a shot sequence identifier rather than requiring every phase to be observed. Add collision reason/position diagnostics only as needed for a concrete debugging workflow.

### 5. Resolution timeout stops the browser loop without match context — medium priority

**Verified:** `game.ts:advanceResolution` throws after ten simulated seconds. `app.ts` calls it inside `frame` and schedules the next animation frame only afterward; there is no error boundary there. The error explains the settling deadline but includes no terrain, tank, or clock snapshot.

**Maintenance cost:** A settling regression would leave the UI frozen with little information beyond a stack trace. Distinguishing a moving tank from repeatedly waking rubble requires reproducing state. This is a failure-path observation, not a timeout seen during verification; the large-slab settling test passes.

**Smallest useful improvement:** Preserve the invariant failure, but attach a compact diagnostic summary of movement, tank velocities, and resolution timers. At the browser boundary, report the failure and retain a usable restart action rather than silently ending animation. Do not merely increase the deadline.

### 6. Tests largely explain behavior, with specific integration blind spots — medium priority

**Verified strengths:** `simulation.test.ts` covers turn ownership, high arcs, tunneling, blast/self damage, draws, and restart. `terrain-physics.test.ts` covers conservation, progressive falls, landing damage, delayed victory, and bounded settling. `terrain-support.test.ts` expresses structural policies with bridges and surcharge, including equality surviving. Browser smoke tests exercise development and production builds, viewport changes, input, wins, and restart. These are meaningful behavioral contracts, not just a large test count.

**Verified limitations:** Support tests directly edit cells and assert exact intermediate snapshot counts in one case, so algorithm-preserving policy changes may still require fixture analysis. Presentation tests generally observe one tick at a time and therefore do not model the browser's multi-tick batching. The browser image comparisons show that *something* changed, not whether crater shape or impact location was correct. Browser terrain reproducibility depends on replacing `Math.random` and assuming the first two calls generate terrain.

**Maintenance cost:** Failures may identify a fixture mismatch without explaining the structural cause; passing browser tests do not establish visual correctness or all scheduling behavior.

**Smallest useful improvement:** Add the batched-observation case above and attach explanatory structural quantities to threshold fixtures. Keep conservation and outcome assertions. Add targeted visual assertions only for an actual visual regression; no wholesale test rewrite is justified.

## State, coupling, and changeability summary

Match ownership is clear: `startGame` holds `game` and `presentation`; restart replaces both. Input's `currentGame` callback avoids stale-match captures. Rendering's WeakMap cache does not keep obsolete matches alive. Public mutable records keep tests straightforward, although `Game` does not encode phase/projectile invariants in its type and terrain bookkeeping requires discipline. There is no demonstrated need for an immutable store or event bus.

Changing gravity is locally easy: `model.ts:GRAVITY` is consumed by ballistics, tank physics, and rubble. Validation is broader: tank integration and capped, shared-clock rubble are not the same integrator as exact ballistic motion; landing thresholds and the resolution deadline remain fixed. A gravity change should check damage and settling duration, not only trajectories. No abstraction is needed just to change the constant.

Adding a weapon is moderate work; adding a genuinely different terrain material is the broadest change because solidity, cohesion, mobility, and color are separate policies. Input and rendering should continue to depend on simulation commands/state, never the reverse. Input currently reads the canvas transform prepared by rendering, and camera layout reads DOM health/form bounds; moving or replacing that UI requires checking pointer/world-coordinate mapping. Existing responsive browser tests help, but do not numerically assert that mapping at every viewport.

## Verification and report interpretation

Executed `npm run check:report`: lint, 49 tests, TypeScript/Vite build, cognitive report, TypeScript metrics, dependency report, and structure report completed successfully. Cognitive complexity: **total 180, maximum 5**. Remaining automated findings: **0 lint violations**, **8 informational TypeScript metric warnings**, and **2 dependency-cycle warnings** in Vite/Rollup dependencies, not source modules. Structure report maximum dependency depth: **8**, including the browser entry chain. These findings do not justify fragmenting the cohesive `startGame` orchestration or replacing ordinary function parameters with indirection.

Executed `npm run test:browser`: development and production smoke tests **2/2 passed**, with a successful build. These executions do not reproduce every potential failure identified above. No source changed, so formatting was not run; no dependencies were installed or environment configuration changed.

## Three strongest architectural decisions

1. **Browser-independent deterministic simulation:** injected terrain randomness and explicit seconds make reproducible headless debugging practical.
2. **Explicit phase orchestration and resolution ordering:** one match owner, damage before falling, then stability before turn completion make the core rules traceable.
3. **Separation of visual history/camera/cache from world physics:** presentation can change without changing hitboxes; restart replaces match-owned state cleanly.

## Three most significant maintenance risks

1. **Structural collapse lacks an accessible causal explanation:** routing, capacity, and successive failure snapshots require reverse engineering during debugging.
2. **Terrain mutation completion is distributed:** support relaxation, wake/reset state, bedrock, and rendering revision must stay coordinated.
3. **Extension policies are implicit across modules:** a second weapon or fourth material can easily leave physics and display inconsistent.

## One realistic maintenance exercise

Ask a developer unfamiliar with the project to add a selectable small-charge weapon with half the excavation radius but unchanged lethal radius, preserving the existing weapon. Require tests proving distinct crater sizes, unchanged kill boundaries, correct explosion display, and a turn that waits for an undercut bridge and tank to settle. Before changing code, have them predict one fixture's collapse using the actual support/load policy; afterward, ask them to explain a short shot's first collision and final tank damage from a reproducible run.

Record time spent locating policies, missed terrain bookkeeping, and whether explanations require new diagnostics. This single exercise tests the favorable boundary assessment and the three primary risks without demanding an unrelated architectural rewrite. It was proposed, not performed in this review.
