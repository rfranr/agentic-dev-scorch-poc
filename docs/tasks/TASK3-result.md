# TASK3 — Structural stability proposal

## Objective

Propose, without implementation, a minimal deterministic extension to connectivity-based terrain collapse, as requested in `TASK3.md`.

## Existing behavior inspected

- `src/simulation/terrain-connectivity.ts`: four-neighbor flood fill from the bottom row; unreachable earth (`1`) becomes rubble (`2`). Connected earth has no strength limit. Rubble never re-coheres.
- `src/simulation/material.ts`: rubble falls using a shared gravity clock, bottom-up sweeps, alternating diagonal preference, and tank collision checks. It conserves material and increments the terrain revision when grains move.
- Also reviewed `terrain.ts`, terrain physics tests, and package scripts. Crater carving protects bedrock, invokes connectivity, increments revision, and resets the material clock.

## Proposed model

Use a **column-run support graph** derived temporarily from the existing cell array. No new terrain representation, persistent damage state, physics solver, or material type is required.

1. Retain the existing disconnected-earth pass.
2. Group vertically contiguous earth cells in each column into runs. A run's height is its local thickness in cells and its mass in unit-cell mass. Neighboring-column runs share an edge only where their vertical ranges overlap; diagonal contact never supports terrain. Runs touching bedrock are permanent anchors.
3. Compute shortest graph distance from anchors with breadth-first search. Distance measures horizontal support transfers, not vertical depth: a directly grounded column has distance zero. This avoids making deep, solid terrain fail simply because it is tall.
4. In descending distance order, accumulate supported mass. Each run carries its own mass plus incoming mass; split outgoing mass equally among all neighbors at distance one less. Ignore same-distance edges for load routing, preventing cycles. Use fixed column/row ordering for accumulation so results are reproducible.
5. For each non-anchor run, compare demand with capacity:
   - `demand = supportedMass * max(1, supportDistance)`
   - `capacity = EARTH_STRENGTH * effectiveThickness²`
   - `effectiveThickness` is the smaller of the run height and the total vertical overlap with its lower-distance support neighbors, capped at the run height. Count distinct overlapping rows only once.
   - Fail only when demand exceeds capacity; equality is stable. Initially propose `EARTH_STRENGTH = 8` in normalized cell units, subject to fixture/gameplay calibration, not a measured physical constant.
6. Convert every failed run to rubble simultaneously from that round's snapshot. Repeat connectivity and structural evaluation until no further earth fails. Never remove cells during conversion. Each changing round removes at least one earth cell, so relaxation terminates.

Support distance penalizes long spans and cantilevers. Thickness increases capacity quadratically, while also adding mass linearly. Supported mass makes a loaded neck fail even if its geometry is unchanged. Two abutments shorten routes and share load, allowing suitably thick arches and bridges to survive.

This is a gameplay heuristic, not elasticity or true arch compression. Whole-run failure is intentionally coarse; mass routing ignores same-distance alternatives and may conservatively overload a preferred route. Bottom-connected columns are infinitely strong in compression by policy. Buckling, tank loads, rubble surcharge, impact forces, persistent fatigue, and physical material units are outside this first model. Adding rubble loads would require reevaluation as rubble moves and is explicitly deferred.

## Integration and lifecycle

Keep `detachEarth(terrain)` as the public entry point and add the structural relaxation after connectivity. Reuse the current `1 → 2` transition and rubble movement without changing `Terrain` or `stepMaterial` APIs. Evaluate after cohesive-earth edits, not every render or rubble movement tick. With no cohesive-earth changes or rubble loading, settled material cannot alter structural support.

Complete relaxation immediately after each edit; progressive failure means successive structural rounds followed by visible falling rubble, not timed fatigue. Reuse crater clock resets and revision updates. If other callers invoke structural evaluation directly, document that they must invalidate rendering on conversion and reset the gravity clock for a new disturbance; `detachEarth` currently does not do either itself. Preserve the existing moving flag behavior and never reattach rubble.

Each graph round is linear in cells plus run adjacency; repeated relaxation can be quadratic in the worst case. Start with full recomputation for clarity, then profile large fixtures before considering incremental work. Do not silently cap rounds and leave an unstable result.

## Proposed tests (not implemented or executed)

Use cell-coordinate fixtures, bedrock-connected abutments, empty space beneath spans, and explicit expected earth/rubble cells. These examples use strength 8.

| Case | Fixture and expected result |
| --- | --- |
| Stable arch | Two grounded abutments with a 10-column, two-cell-thick crown and overlapping stepped haunches. A flat two-cell crown is the baseline: each side carries five runs; maximum demand is 18, below capacity 32. Verify the stepped arch fixture also satisfies every computed demand/capacity, remains earth, and does not wake rubble. |
| Thin bridge | Same 10-column span, one cell thick. Each half routes five unit masses; peak demand is 9, above capacity 8. Assert overloaded runs become rubble and relaxation propagates. Contrast with the stable two-cell crown and a shorter one-cell span. |
| Heavy overhang | One grounded wall and a three-column, one-cell-thick cantilever: demands 3, 4, 3, all at most 8. Add six vertically attached earth cells at its tip without thickening the neck. Neck supported mass becomes 9, exceeding capacity 8; assert neck failure and subsequent tip detachment. |
| Progressive destruction | Start with the stable two-abutment crown. Remove one abutment below the crown: it becomes a 10-column cantilever, whose root demand is 20, below 32, but the next run has demand 36 and fails. Assert later rounds detach newly unsupported earth. A second edit must recompute support from surviving earth, never rubble. |
| Boundaries and invariants | Demand equal to capacity survives; one extra supported cell crosses the threshold where applicable. Bedrock remains earth, diagonal-only attachment fails, rubble never supports or re-coheres, and earth-to-rubble conversion preserves occupied-cell count. |
| Determinism and lifecycle | Identical fixtures and edit sequences produce identical arrays and settling results. A second evaluation at equilibrium is idempotent. Check revision invalidation, clock reset on a new disturbance, eventual sleeping, and conserved material after falling. |

Existing attached-ledge and connected-roof tests need review against the intended new strength policy, not blanket replacement of their assertions. Preserve tests for bedrock protection, conservation, tank collision, and deterministic settling.

## Verification

Source inspection only. No source or test changes; no dependencies installed. Formatting, quality reports, tests, and build were not run for this proposal-only task. Total/maximum cognitive complexity and remaining violation count were not measured; no metric change is claimed.

## Deviations and outcome

Completed proposal only, as requested. Numeric strength and arch geometry still require implementation-time validation and gameplay calibration. No runtime behavior has changed.
