# Scorch — Agentic Development PoC

This project is a proof of concept for [agentic-dev-template](https://github.com/rfranr/agentic-dev-template).

The goal is to evaluate an agent-driven development workflow using a real, playable application.

We are testing:
- How effectively an agent translates requirements into working software.
- Whether the template's quality checks and development tools provide useful feedback.
- What the workflow fails to detect, particularly visual quality and user experience.
- Which improvements should be incorporated back into the template.

**This is an experiment, not a finished game.** Functional correctness, code quality, and visual quality are evaluated separately.

# Scorch

A playable local two-player artillery game with destructible terrain. Built with
TypeScript, Canvas 2D, and Vite; no backend, framework, or runtime dependencies.
See [TASK.md](TASK.md) for scope and [implementation notes](docs/implementation.md)
for decisions, verification results, and limitations.

## Run locally

Use Node.js 24 (validated environment: Node.js 24.22.2, npm 11.19.1).
With the project's dependencies already installed:

```sh
npm run dev
```

Open the local URL Vite prints. No backend or runtime configuration is required.
For a fresh checkout, dependency installation (`npm ci`) requires approval under
[AGENTS.md](AGENTS.md); do not install packages or browsers automatically.

To build and serve the production output:

```sh
npm run build
npm run preview
```

`build` runs TypeScript checking followed by Vite and writes `dist/`.

## Play

1. Player 1 is blue on the left; Player 2 is orange on the right. A white ground
   ring marks the active tank, and the status text identifies whose turn it is.
2. Adjust **Angle** and **Power**, then press **Fire!** Sliders support mouse and
   keyboard arrow keys. Angle is relative to the direction toward your opponent:
   45° arcs forward, 90° shoots vertically, and angles above 90° shoot backward.
3. The dotted guide shows launch direction, not a predicted trajectory. Power is
   shown as a percentage of maximum launch speed. Watch the projectile trail and
   impact marker; the range message says whether an impact fell short of or past
   the opponent horizontally. Pass control to the other player. Each tank remembers
   its aim. There is no wind, and only one shot can be active.
4. A direct hit or nearby blast destroys a tank. Craters persist; tanks settle
   instantly onto remaining ground without falling damage. Self-destruction can
   award the other player the win; mutual destruction is a draw.
5. Press **New match** at any time, including during flight or after a win, to
   generate new terrain and restart without reloading.

## Develop and verify

Browser-specific code lives in `src/main.ts` and `src/browser/`;
DOM-independent simulation code lives in `src/simulation/`. Browser globals are scoped
in ESLint rather than enabled across the project. TypeScript currently includes
DOM and Node types; Node unit tests must not import the browser entry point.

`npm test` runs core simulation tests and retained tooling regressions without a
browser. `npm run test:browser` builds the app and runs real Chromium regressions
against both development and production servers. It covers aiming, firing, a win,
battlefield changes, turns, and restart, including restart during flight.

| Command | Purpose |
| --- | --- |
| `npm test` | Simulation and tooling tests via `tsx` and Node |
| `npm run test:browser` | Build and run Chromium development/production regressions |
| `npm run format` / `npm run format:check` | Format / check source and tests |
| `npm run lint` | Correctness, readability, and enforced complexity limits |
| `npm run check` | Lint → tests → TypeScript and Vite build |
| `npm run check:report` | Check plus all four informational reports; retains command failures |
| `npm run complexity` | Cognitive complexity totals, maximum, and findings |
| `npm run metrics` / `npm run metrics:html` | TypeScript metrics / HTML output |
| `npm run dependencies` | Dependency analysis, with cycles at warning severity |
| `npm run structure` | Fan-out, transitive dependencies, and dependency depth |

After source changes, run `npm run format` and `npm run check:report`. Lint errors,
failed tests/builds, and failures to execute any report block completion.
Informational findings must be reviewed and reported, but do not introduce new
thresholds. Existing complexity limits and test-only exceptions are unchanged.

Formatting covers code and CSS in `src/` and `tests/`, plus `index.html`.
Cognitive reports scan code in `src/` and `tests/`; lint also scans maintained
`scripts/`. TypeScript and metrics
cover `src/` and `tests/` (tsmetrics skips `.mjs`). Dependency entry points and the
structural runner include `src/` and top-level TypeScript tests; `.mjs` tooling
regressions still run and are linted, but are not structural entry points. If paths
change, update the relevant commands and report filters together.

Playwright is already a development dependency. `test:browser` requires an
installed Playwright Chromium browser; request approval before provisioning a
missing browser (`npx playwright install chromium`). No check installs packages or
browsers automatically. Browser tests are explicit, rather than part of `check`,
so ordinary simulation/tooling checks do not require browser provisioning.
`tests/browser-smoke.ts` is still covered by lint, type checking, and reports.
Vite's private experiment paths and filesystem protections remain enabled.

## Development integrations and provenance

[AGENTS.md](AGENTS.md) defines the development and completion requirements.
`.pi/settings.json` retains pi-lens, pi-web-access, and pi-skills-sh.
`.pi-lens.json` retains lint feedback and always-report behavior; its formatter,
LSP, and TypeScript integrations remain disabled as inherited.

### Skills

Skills remain available through Pi; read the relevant skill before specialized
work. No new skills, dependencies, or global packages are required for this
adaptation. Installation requires approval. See the original
[skill setup and provenance](TEMPLATE.md#skills) before considering installation.

### Contributing improvements

Validate reusable improvements in this project and propose them for human review;
do not modify the upstream template without explicit authorization. Keep project
and template Git histories independent.

[TEMPLATE.md](TEMPLATE.md) preserves the original template setup instructions,
quality-tool reference, skill provenance, and contributing guidance as historical
reference, not current Scorch fixture instructions. Its `contributing improvements`
section describes proposing reusable changes without modifying the upstream
template. [Historical validation](docs/validation.md) is not evidence that the
current game meets its acceptance criteria. The
[environment adaptation report](docs/environment-adaptation.md) records the
pre-game setup; [implementation notes](docs/implementation.md) record game checks.

Derived from `agentic-dev-template`, originally extracted from WorldGL. No license
was supplied with WorldGL; no new license is asserted here. Resolve licensing
before public distribution.
