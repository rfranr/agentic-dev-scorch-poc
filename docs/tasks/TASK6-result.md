# TASK6 — Resolution failure recovery

## Objective and acceptance criteria

Address only independent Joern review finding #1, as requested in root `TASK6.md` (not the older `docs/tasks/TASK6.md`). A resolution failure must stop stepping the damaged match, retain its diagnostic, show an actionable error, and leave the animation loop available. New match must reset failure state, restore aiming controls, and support visibly advancing projectiles without reloading.

## Verification of the finding

`stepGame` throws when resolution exceeds ten seconds. Previously that exception escaped the browser frame before its next `requestAnimationFrame` call. Restart replaced state but did not schedule another frame. The regression failed against the original implementation (20-second timeout waiting for error/recovery), both before implementation and when rerun with the final test.

## Changes and review

- Browser-local failure state and a guarded simulation advance catch step errors, discard accumulated time, log the original error, disable aiming, and display a New match instruction. Rendering continues; restart resets the failure flag alongside existing match state.
- Added a Chromium regression that accelerates the actual resolution clock through a development-server response override. It verifies the timeout diagnostic, error UI, disabled firing, restart, and changing canvas frames during the next shot. No simulation API or production test hook was introduced.
- Included the regression in `npm run test:browser`. Browser test files run serially to avoid concurrent Vite server interference observed during verification.
- Reviewed coupling: no imports, simulation rules, or public APIs changed. Recovery state remains owned by `startGame`; the extracted advance function groups fixed-step accumulation and its failure boundary. Other review findings were not addressed.

## Verification

- `npm run format`: passed.
- `npm run check:report`: exit 0; lint clean, **49/49 tests passed**, TypeScript/Vite build passed, all informational reports executed successfully.
- `npm run test:browser`: final exit 0; build and **3/3 browser tests passed**, including existing development/production smoke tests and the new recovery regression.
- Cognitive complexity: **total 184** (previously 180), **maximum 5** (unchanged).
- Remaining findings: **0 blocking/lint violations**, **9 informational TypeScript metric warnings** and **2 tooling dependency-cycle warnings**. `startGame` LOC rose from 57 to 81 and its maintainability index is now 39.51, adding one advisory warning. Maximum structural dependency depth remains 8; app fan-out remains 5. No new module dependency was introduced.
- Intermediate verification caught a test-only TypeScript cast error, corrected before the successful runs. An initial concurrent browser run timed out in the development smoke test; serial execution passed without changing existing tests or their time limits.

## Limitations and outcome

Completed, not committed. Recovery intentionally abandons the failed match rather than trying to resume partially mutated simulation state. The boundary handles simulation-step errors, not unrelated presentation/rendering exceptions. Fault injection depends on the development module's resolution-clock statement and asserts that statement exists; it does not reproduce a naturally unstable terrain seed or inject faults into the production bundle. No dependencies were installed or quality thresholds changed.
