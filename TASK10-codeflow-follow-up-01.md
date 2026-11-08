TASK10 follow-up — Persist the validated execution flow.

The experimental flow diagram was returned in chat but not preserved in the repository.

Create `docs/architecture/flows/shot-resolution.md` containing:

1. A readable Mermaid flowchart representing the source-verified shot lifecycle.
2. A legend distinguishing direct function calls from phase transitions, browser scheduling and inferred relationships.
3. A concise inventory of relevant module APIs, with links to source paths.
4. Existing JSDoc coverage and the most important missing or implicit contracts.
5. Known limitations of the flow reconstruction.

Use the existing TASK10 investigation and verify important relationships against the current source.

Keep the diagram bounded. Do not reproduce the full ASCII graph or the complete TASK10 report.

Update `docs/tasks/TASK10-result.md` with a link to the new architecture document.

Do not modify production code, add JSDoc, install dependencies, or implement a graph-generation framework.

This is documentation of the existing experiment, not a new implementation task.