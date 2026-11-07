Use the independent Joern maintainability review as input.

Select only finding #1: resolution failure stops the animation loop.

Follow the existing project's task-driven development workflow.

1. Verify the reported behavior against the current implementation.
2. Define the expected recovery behavior and acceptance criteria.
3. Add a regression test that demonstrates the failure.
4. Implement the smallest maintainable fix.
5. Run relevant tests and project quality checks.
6. Review the resulting change for new coupling or unnecessary complexity.

Do not address other findings or refactor unrelated code.

Report the changes, test results, and any remaining risks before committing.