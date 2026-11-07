# Scorch

A browser-based, two-player artillery game with destructible terrain, planned in
[TASK.md](TASK.md). **Current status: environment adaptation only.** The browser
shell is not playable yet; aiming, firing, terrain, and game rules remain to be built.

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

There are no gameplay controls yet. The shell explicitly displays this status.
The planned first playable version has local alternating turns, angle and power
controls, firing, persistent craters, a winner announcement, and restart without
reloading. See [TASK.md](TASK.md) for the acceptance criteria.

## Develop and verify

Keep browser-specific code in `src/main.ts` and `src/browser/`; place future
DOM-independent simulation code in `src/simulation/`. Browser globals are scoped
in ESLint rather than enabled across the project. TypeScript currently includes
DOM and Node types; Node unit tests must not import the browser entry point.

Keep tests at `tests/*.test.ts` or `tests/*.test.mjs`, matching the existing test
command. The initial shell smoke test checks HTML wiring, not gameplay or actual
browser execution. Runtime-global regressions and structural-runner regressions
remain in place. Add simulation behavior tests as the game is implemented.

| Command | Purpose |
| --- | --- |
| `npm test` | Node tests via `tsx`, including tooling regressions |
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

Current coverage is deliberately retained: formatting and cognitive reports scan
`src/` and `tests/`; lint also scans maintained `scripts/`. TypeScript and metrics
cover `src/` and `tests/` (tsmetrics skips `.mjs`). Dependency entry points and the
structural runner include `src/` and top-level TypeScript tests; `.mjs` tooling
regressions still run and are linted, but are not structural entry points. If paths
change, update the relevant commands and report filters together.

Playwright is installed for future real-browser regressions. Browser availability
is separate from npm dependency installation; request approval before installing
a missing browser. The current test command neither installs nor launches one.
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
current game meets its acceptance criteria. See the
[environment adaptation report](docs/environment-adaptation.md) for executed
checks and known limitations.

Derived from `agentic-dev-template`, originally extracted from WorldGL. No license
was supplied with WorldGL; no new license is asserted here. Resolve licensing
before public distribution.
