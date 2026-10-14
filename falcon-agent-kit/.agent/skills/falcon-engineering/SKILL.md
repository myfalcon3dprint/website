---
name: falcon-engineering
description: Code quality, TypeScript standards, error handling patterns, and core development practices for Falcon 3D Prints.
---

# Falcon Engineering Skill

> Establishes code craftsmanship, strict TypeScript standards, deterministic error handling, and maintainable software engineering practices for Falcon 3D Prints.

## Task Triggers
- Writing or refactoring TypeScript / React / Next.js code.
- Implementing server actions, route handlers, or API endpoints.
- Conducting code review or establishing linting and formatting rules.
- Resolving compiler errors or unhandled runtime exceptions.

## Required Inputs & Source Paths
- Codebase files in `src/` (or planned domain features).
- Architecture specs: [`docs/architecture/system-overview.md`](../../../docs/architecture/system-overview.md) and [`docs/architecture/folder-structure.md`](../../../docs/architecture/folder-structure.md).
- Dependency boundaries: [`docs/architecture/integration-boundaries.md`](../../../docs/architecture/integration-boundaries.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Examine existing types, utilities, and components before adding new patterns. Verify target dependency versions.
2. **Define Acceptance Criteria**: Specify exact input/output contracts, error states, and type safety constraints.
3. **Plan**: Design modular, testable units. Keep server actions thin and domain logic isolated in pure functions.
4. **Implement**:
   - Enable strict TypeScript (`noImplicitAny`, `strictNullChecks`).
   - Use explicit ReturnType annotations on all public functions and server actions.
   - Employ discriminated unions for domain state and operation outcomes:
     ```typescript
     type Result<T, E = Error> =
       | { success: true; data: T }
       | { success: false; error: E };
     ```
   - Never suppress compiler warnings with `any` or `@ts-ignore` without documented justification.
5. **Verify**: Run `tsc --noEmit` and `npm run lint`. Ensure zero type errors.
6. **Review**: Ensure no privileged secrets or database connections are imported into client components.
7. **Report**: Log changes in [`docs/agent/status.md`](../../../docs/agent/status.md).

---

## Invariants & Prohibited Shortcuts
- **No Git Commands**: Do not run Git commands or generate commits.
- **No Floating Minor Units**: All monetary values must be typed as integer paise (minor units), never floating-point rupees.
- **No Blind Dependencies**: Do not install packages without verifying necessity and license compatibility.

## Failure Handling
- On compiler errors: Resolve underlying type mismatches rather than casting to `any`.
- On runtime exceptions: Return structured error responses to callers; log sanitized context server-side.

## Required Verification Evidence
- TypeScript compiler output: `tsc --noEmit` exit code 0.
- Linter output: `npm run lint` exit code 0.
