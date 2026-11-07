Perform an independent human-maintainability review of this codebase.

Your goal is to determine whether another experienced developer could understand, modify, and debug the code without explanations from its author.

Review the actual implementation, not just the quality reports. Do not modify any source files.

Evaluate:

1. **Comprehensibility:** Can the main execution flows be followed without excessive navigation between functions and files?
2. **Cohesion:** Does each module have a meaningful responsibility?
3. **Abstraction quality:** Are helpers justified by domain concepts, or extracted merely to satisfy lint and complexity limits?
4. **State and mutation:** Is it clear who owns state, when it changes, and how its lifecycle is managed?
5. **Coupling:** Are dependencies between simulation, input, rendering, and presentation appropriate?
6. **Changeability:** How difficult would it be to introduce a new weapon, alter gravity, or add a terrain material?
7. **Debuggability:** Could a developer explain why a projectile missed or why a terrain structure collapsed?
8. **Tests:** Do the tests explain expected behavior, or merely confirm implementation details?

For each significant finding:
- Identify the relevant files and functions.
- Explain the concrete maintenance cost.
- Distinguish verified problems from potential risks.
- Suggest the smallest useful improvement.

Do not reward code simply for having short functions, low cognitive complexity, or many tests.

Do not propose refactoring without a concrete maintainability benefit.

Finish with:
- The three strongest architectural decisions.
- The three most significant maintenance risks.
- One realistic maintenance exercise to validate your conclusions.

Save the review to `docs/reviews/maintainability-review.md`.

Do not implement any changes.