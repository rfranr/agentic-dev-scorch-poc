Perform an experimental **Main Execution Flow & API Contracts Review** using the existing `joern-review` skill.

Start with one main Scorch behavior: firing a projectile through impact and terrain resolution.

Goals:

1. Use Joern CPG evidence to reconstruct the relevant cross-module call relationships.
2. Verify actual control flow, callbacks and phase transitions against source.
3. Produce a Mermaid diagram with meaningful domain operations, omitting incidental helper calls.
4. Identify the relevant module API boundaries.
5. Extract existing JSDoc where present. Do not generate or insert new comments.
6. For each important API, report its signature, documented contract, observed side effects, error conditions, and any missing or ambiguous documentation.
7. Clearly distinguish direct calls, inferred transitions, and unresolved relationships.
8. Evaluate whether the resulting diagram and contract inventory help a developer understand the behavior without reading the full implementation.

Keep the graph bounded and readable. Do not build a generic graph framework, modify production code, install dependencies or change quality rules.

Use temporary Joern artifacts outside the repository under `/tmp/joern-review.XXXXXX`, as previously authorized. Return the diagram and findings in chat. Create no permanent review document unless project instructions require one.

Conclude whether the approach is useful enough to extend to other main execution flows.