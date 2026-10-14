---
name: falcon-gsd-delivery
description: Task tracking, dependency-aware sprint planning, and local handoffs without Git for Falcon 3D Prints.
---

# Falcon GSD Delivery Skill

> Orchestrates systematic delivery ("Get Shit Done") through structured task decomposition, local verification checkpoints, and clean resumable handoffs.

## Task Triggers
- Starting a new implementation phase or epic.
- Decomposing roadmap milestones into concrete executable tasks.
- Tracking blockers, state handoffs, and session continuity.

## Required Inputs & Source Paths
- Implementation Roadmap: [`docs/project/roadmap.md`](../../../docs/project/roadmap.md).
- Acceptance Criteria: [`docs/project/acceptance-criteria.md`](../../../docs/project/acceptance-criteria.md).
- Active Task Tracking: [`docs/agent/task.md`](../../../docs/agent/task.md) and [`docs/agent/status.md`](../../../docs/agent/status.md).
- Task Template: [`templates/task-template.md`](../../../templates/task-template.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Read `docs/agent/status.md` and `docs/project/roadmap.md` to identify the current milestone and prerequisite tasks.
2. **Define Acceptance Criteria**: Copy `templates/task-template.md` to define explicit PASS/FAIL test conditions for the item.
3. **Plan**: Sequence subtasks by dependency order. Keep individual implementation batches small, focused, and independently verifiable.
4. **Implement**: Execute code changes in small atomic increments. Update `docs/agent/status.md` as progress occurs.
5. **Verify**: Execute deterministic checks (unit test, compilation, lint, integration test) after each step.
6. **Review**: Confirm no unrelated regressions, no broken local links, and no forgotten placeholder text (`TODO`, `FIXME`).
7. **Report**: Log complete execution evidence in `docs/agent/evidence.md` and transition task status to `VERIFIED`.

---

## Invariants & Prohibited Shortcuts
- **Strictly No Git Operations**: Do not run `git commit`, `git push`, or `git checkout`. Maintain local status records in markdown instead.
- **Never Fabricate Test Output**: Do not mark tasks complete without actual command execution results.
- **Do Not Skip Failed Gates**: A task with failing assertions cannot be marked done.

## Failure Handling
- If a dependency is missing: Document the blocker in `docs/agent/status.md`, mark dependent work `BLOCKED`, and pivot to unblocked tasks.
- If repeated attempts fail: Stop after 3 failed attempts on the same approach, log the failure in `docs/agent/status.md`, reassess assumptions, and propose an alternative strategy.

## Required Verification Evidence
- Timestamped test logs and exit codes recorded in `docs/agent/evidence.md`.
