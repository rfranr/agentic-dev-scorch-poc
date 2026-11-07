# TASK9 — Desktop weapon selector visibility

- **Objective:** Fix the user's report that no Weapon dropdown was visible after TASK8, now tracked in `TASK9.md`.
- **Changes:** Desktop CSS previously hid the whole aiming form. It now displays the weapon selector while hiding only touch-oriented sliders and Fire. Extended desktop browser coverage verifies visibility and Heavy selection, preserving mouse/keyboard aiming behavior. No simulation changes.
- **Verification:** `npm run format`, `npm run check:report`, and `npm run test:browser` all succeeded. All 57 tests, 3 browser tests, and TypeScript/Vite build passed. Cognitive complexity remains 213 total / 5 maximum. Remaining lint findings: 0 errors, 2 statement-count warnings in browser tests. Reviewed informational reports: 11 TypeScript metric warnings, 2 external dependency-cycle warnings, maximum structural depth 8; no new project cycle.
- **Deviations:** No dedicated weapon hotkey added. No manual visual playtest; desktop visibility is now explicitly browser-tested. Changes not committed.
- **Outcome:** Completed.
