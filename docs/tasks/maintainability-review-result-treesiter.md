# Maintainability review

## Objective
Review the current game using the requested maintainability-review skill; identify evidence-backed maintenance costs without refactoring.

## Main flows and responsibilities
- `browser/app.ts:startGame` owns the match, fixed-step accumulator, controls, and animation loop. Input delegates to simulation commands; restart replaces match and presentation state.
- `simulation/game.ts` coordinates aiming → flight → explosion/settling → next turn or victory. Ballistics handles swept projectile collision; terrain handles excavation and spawn support.
- `terrain-support.ts` builds a column-run graph, routes load toward bedrock, and converts failed earth into rubble. `material.ts` settles rubble; `tank-physics.ts` handles falling and landing damage. World stepping moves material before tanks and wakes deposits when tanks move.
- `presentation.ts` derives shot feedback/history; rendering reads simulation state and caches terrain by identity and revision.

## Findings, ordered by priority

### 1. Medium: settlement failure stops the browser loop without recovery
**Evidence:** `simulation/game.ts:advanceResolution` throws after ten seconds. `browser/app.ts:frame` calls `stepGame` before scheduling the next animation frame and has no error boundary. Thus this specific failure prevents further rendering; restart replaces state but does not restart the animation chain.
**Cost:** Changes to terrain strength, rubble routing, or world dimensions must preserve a hidden UI-liveness requirement. A useful diagnostic assertion becomes a frozen interface if triggered.
**Smallest improvement:** Keep the diagnostic, but catch simulation failure at the browser boundary, show an explicit failure state, and allow restart to resume the loop. Add an integration test for this path. Ordinary-shot and large-slab tests cover successful settlement, not recovery. This review does not establish that ordinary play reaches the timeout.

### 2. Medium: presentation assumes it observes every phase transition
**Evidence:** `browser/app.ts:frame` performs all accumulated simulation ticks before calling `updatePresentation` once. `presentation.ts:updatePresentation` clears old history only when it observes `flying`; `updateOutcome` captures impact only while an explosion exists. A sufficiently short flight can begin and end between presentation updates, leaving old trail/feedback uncleared. Tests in `presentation.test.ts` generally update presentation after every tick or explicitly construct the phase being observed.
**Cost:** Feedback correctness depends on frame cadence rather than only simulation behavior. This complicates low-frame-rate support, fast-forward, and short-range shots.
**Smallest improvement:** Observe presentation transitions after each simulation tick, including command-start transitions as necessary, and test a batch that crosses flight and impact before drawing. Keep rendering once per frame; define trail sampling cadence separately. The mismatch is visible in control flow; a real-browser short-flight reproduction was not executed.

### 3. Low: material integration has an implicit timestep contract
**Evidence:** `material.ts:stepMaterial` accumulates until 1/30 second, then passes the entire elapsed duration to `advanceMaterial` and clears the accumulator. Acceleration is applied over that entire duration before distance is calculated. `stepGame(game, seconds)` exposes an unrestricted duration, while the browser always supplies 1/120 second. The rubble determinism test compares identical tick sequences, not different partitions of elapsed time.
**Cost:** A future replay, headless runner, or performance optimization that batches ticks can change rubble motion and tank interactions despite preserving total elapsed time.
**Smallest improvement:** Document that game stepping requires fixed `STEP_SECONDS` ticks, and test that callers honor it. If arbitrary durations are intended, consume fixed material substeps with a retained remainder and add partition tests. No broad physics abstraction is needed.

These are the three most important maintenance risks found; the last is a contract risk, not evidence that the existing fixed-step browser caller is incorrect.

## Three strongest architectural decisions
1. Simulation has no browser dependency, with injectable terrain randomness and direct behavioral tests. Physics and turn policy can be exercised without DOM setup.
2. One match owns mutable simulation state, while presentation history is separate and restart replaces both. Input reads the current match through a getter rather than retaining a stale instance.
3. Explicit physical policies have substantive tests: blast damage precedes falling, support uses snapshot evaluation, bedrock remains anchored, material is conserved, and delayed lethal landing postpones victory. These are stronger safeguards than function-size scores.

## Maintenance exercise
Add a low-frame-rate regression scenario: preload history from an earlier shot, fire a very short-range shot, advance twelve fixed ticks before drawing, and verify that history resets and the new impact is captured. Repeat with one tick per draw. This directly tests the presentation/simulation boundary without changing physics rules.

## Verification and metrics
- Executed `npm run check:report`: lint, all 49 tests, TypeScript/Vite build, cognitive report, TypeScript metrics, dependency report, and structure report completed successfully.
- Cognitive complexity: total **180**, maximum **5**. No source changes, so no metric delta.
- Remaining findings from tools: **0 blocking/lint violations**, **8 informational TypeScript-metric warnings**, **2 dependency-cycle warnings** in Vite/Rollup dependencies (10 informational warnings total). These are separate from the three review findings above.
- Structure: maximum dependency depth **8**; application bootstrap/render and simulation coordinator have fan-out **5**. No source-cycle finding was reported. The wrapper and bootstrap depth alone do not justify extra refactoring.
- Reviewed metric warnings: function length in bootstrap, four-parameter functions, and nesting thresholds do not independently demonstrate maintenance defects; cohesive orchestration and graph traversal should not be split merely to remove warnings.
- Ran the skill AST analyzer on app, presentation, game, and material: all four parsed without errors. Used as boundary/mutation evidence, not a complexity or ownership proof.
- Browser smoke tests were not executed. Formatting was not run because source files were unchanged.

## Changes, deviations, and outcome
Only this execution report was added. Existing untracked task/review documents were left untouched. No source edits, dependency installation, or environment changes. Review focused on runtime modules and behavioral tests, not an exhaustive audit of tooling. No standalone file under `docs/reviews/` was requested. **Outcome: completed review; proposed improvements intentionally not implemented.**
