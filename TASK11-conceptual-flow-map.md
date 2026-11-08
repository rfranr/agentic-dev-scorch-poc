# TASK11 — Conceptual Flow Map

## Objective

Create a high-level conceptual map of Scorch's shot lifecycle that a developer unfamiliar with the codebase can understand in under a minute.

The map should explain **what happens**, not how individual functions call each other.

This is a documentation and code-comprehension experiment, not an implementation task.

## Scope

Use the existing shot-resolution investigation from TASK10 and `docs/architecture/flows/shot-resolution.md` as the source of truth, verifying important behavior against the current source where necessary.

Do not run Joern again unless existing evidence is insufficient.

## Requirements

1. Create a Mermaid flowchart containing approximately 5–7 meaningful conceptual steps.
2. Use domain language rather than function names, module names, or implementation details.
3. Show the normal lifecycle from firing a projectile to completing a turn.
4. Represent important alternative outcomes, such as a missed shot or a finished game, without overwhelming the diagram.
5. Avoid simulation ticks, callback scheduling, internal function calls, timers, and implementation-specific conditions.
6. Keep labels short and the layout readable at normal Markdown preview size.
7. Provide a short explanation of the conceptual steps outside the diagram.
8. Link to the existing TASK10 technical flow for readers who need implementation details.

## Deliverable

Create:

`docs/architecture/flows/shot-conceptual.md`

The document should contain:

- A short introduction explaining the purpose.
- One Mermaid conceptual flowchart.
- A brief explanation of the important behaviors and outcomes.
- A link to `shot-resolution.md` for technical details.

Do not duplicate the API inventory or technical diagram.

## Acceptance criteria

1. A reader can identify the main shot lifecycle without knowing the source code.
2. The diagram contains no function names or implementation details.
3. The main path is visually obvious.
4. Alternative outcomes are understandable without following long crossing arrows.
5. The Mermaid diagram renders correctly.
6. The documentation accurately reflects current behavior.
7. No production code, tests, tooling, skills, or `AGENTS.md` are modified.

## Evaluation

After creating the document, assess:

- Is the conceptual map easier to understand than the TASK10 technical diagram?
- Which important details were deliberately omitted?
- Does the abstraction preserve the essential behavior?
- Would this map help a new developer decide what to investigate next?

Do not claim usability has been validated by a human reader.

## Workflow

Follow the existing project task workflow.

Create `docs/tasks/TASK11-result.md` with a concise summary of the documentation change, verification performed, limitations, and outcome.

Do not implement TASK12, introduce a diagram generator, or create additional architecture documents.

Report results before committing.