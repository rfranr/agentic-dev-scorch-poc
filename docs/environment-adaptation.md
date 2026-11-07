# Scorch environment adaptation

## Scope and decisions

Adapted the existing TypeScript/Vite environment without implementing gameplay.
The browser shell explicitly states that it is not playable. Removed the neutral
JavaScript fixture and its declaration; replaced its import assertion with a shell
wiring smoke test. Retained and extended runtime-global regressions and retained
structural-runner regression tests.

Browser globals are scoped to `src/main.ts` and `src/browser/**/*.{ts,js,mjs}`.
Future `src/simulation/` code remains outside that ESLint environment. Existing
TypeScript DOM/Node settings and command paths already support this layout and
were retained. Package and lockfile identity are now `scorch`.

No dependencies were installed. Quality thresholds, blocking/advisory semantics,
report scripts, Vite protections, Pi configuration, and skills are unchanged.
The original README is retained as historical reference in `TEMPLATE.md`; the
current README describes project commands, status, and coverage limitations.

## Executed verification

Environment: Node.js 24.22.2, npm 11.19.1.

- `npm run format`: passed.
- `npm run check:report`: passed, including lint, all 6 tests, TypeScript checking,
  Vite production build, cognitive report, TypeScript metrics, dependency report,
  and structural report.
- `npm run format:check`: passed.
- Ad hoc Playwright Chromium smoke checks: development server and production
  preview both displayed the Scorch title and explicit shell status with no page
  errors. Used the already installed browser; no provisioning was needed.

Reviewed findings:

- ESLint: 0 errors, 0 warnings.
- Cognitive complexity: total 2, maximum 1, 0 violations. Positive scores are in
  the existing structural-runner test callbacks; application entry has none.
- Dependency report: 0 violations, 520 modules and 906 dependencies analyzed.
- Structural report: maximum dependency depth 0; current project-owned entry
  points have fan-out and transitive counts of 0 after removing the fixture import.
- TypeScript metrics: 2 files, 5 functions, 62 LOC. Reported file maintainability
  index is 100.0 for the entry and 55.9 for quality tests; no additional gate was
  introduced. Metrics also classify two test predicates as components; this is
  tool output, not evidence of a framework dependency.

## Limitations

No game rules, simulation behavior tests, or playable controls exist yet. Browser
checks verify the shell only and are not part of `npm test`. Historical template
validation is not a Scorch baseline; no pre-adaptation metrics run was recorded.
The copied project has no `.git` directory, so Git diff verification is unavailable.
Pi configuration and skill declarations were preserved, not independently
revalidated for provider access or provenance. Existing `.mjs` structural-entry
and TypeScript-metrics coverage limitations remain documented in the README.
