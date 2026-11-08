# TASK12 — Module & API Flow Map

## Objective

Create a navigable map connecting the conceptual shot lifecycle from TASK11 to the modules and APIs that implement it.

The goal is to help a developer unfamiliar with Scorch locate, understand, and modify the relevant code without reconstructing the entire call graph.

This is a documentation and code-comprehension experiment.

## Context

Build on the existing documentation:

- `docs/architecture/flows/shot-conceptual.md` — conceptual behavior (TASK11).
- `docs/architecture/flows/shot-resolution.md` — detailed execution flow and API contracts (TASK10).

Use the existing `joern-review` skill and available CPG evidence where useful. Verify important relationships against the current source.

Do not rerun Joern merely to regenerate evidence already available.

## Requirements

### 1. Module & API map

Create a Mermaid diagram connecting the main conceptual operations to their implementation.

- Show the relevant modules and their principal API entry points.
- Prefer module boundaries and meaningful responsibilities over individual helper functions.
- Keep the diagram small, ideally 6–10 nodes.
- Avoid reproducing the detailed TASK10 call graph.
- Distinguish direct calls from phase transitions or conceptual relationships.
- Do not represent conceptual sequencing as direct function calls.
- Do not invent missing relationships.

### 2. API navigation

Provide a compact table mapping each conceptual operation to:

- The responsible module.
- The principal function or API.
- A relative Markdown link to its source file.
- A one-sentence description of its responsibility.

Where useful, distinguish exported module APIs from private implementation functions.

### 3. API contracts

For the most important APIs, extract and summarize:

- Function signature.
- Existing JSDoc, if any.
- State mutations and side effects.
- Important input assumptions.
- Return-value semantics.
- Error or failure conditions.
- Caller responsibilities.

Do not fabricate JSDoc or present inferred contracts as documented contracts.

Focus on contracts that cannot be understood from names and types alone.

### 4. Documentation gaps

Identify important API contracts that lack documentation.

Prioritize by their relevance to the main execution flow and the maintenance risk they introduce.

Do not require JSDoc for every function or recommend comments that merely repeat the implementation.

### 5. Tool independence

Keep the resulting documentation independent of Joern-specific identifiers, node types, query syntax, or CPG structures.

Joern is an evidence provider, not the architecture of the resulting documentation.

Do not introduce provider interfaces, adapters, graph frameworks, or LSP integration.

## Deliverable

Create:

`docs/architecture/flows/shot-modules.md`

The document should contain:

1. A short introduction.
2. One readable Mermaid Module & API flowchart.
3. A compact API navigation table with links to source.
4. The most important API contracts and documentation gaps.
5. Links to the TASK11 conceptual map and TASK10 technical flow.
6. A short explanation of limitations and any unresolved relationships.

Avoid duplicating the complete TASK10 contract inventory.

## Acceptance criteria

1. A developer can identify which modules implement each stage of the conceptual shot lifecycle.
2. The diagram is readable at normal Markdown preview size.
3. Main API entry points can be located directly from the documentation.
4. Cross-module relationships are accurate and verified against source.
5. Direct calls, phase transitions and conceptual relationships are clearly distinguished.
6. Existing JSDoc is accurately represented.
7. Important undocumented contracts are identified without generating unnecessary documentation.
8. The document remains useful without Joern being installed.
9. No production code, tests, tooling, skills or `AGENTS.md` are modified.

## Evaluation

Compare the three documentation levels:

- **TASK11 — Conceptual:** What happens?
- **TASK12 — Modules & APIs:** Where is it implemented?
- **TASK10 — Technical:** How does it execute?

Assess whether TASK12 genuinely helps navigate the code or merely duplicates TASK10.

Identify what information would be needed to reproduce this kind of documentation in another project.

Do not implement general-purpose automation yet.

## Workflow

Follow the existing project workflow.

Document the result in `docs/tasks/TASK12-result.md`, including verification, limitations and the usefulness of the new map.

Do not automatically execute a separate maintainability review.

Do not install dependencies, change quality rules, modify `AGENTS.md`, or commit changes before review.