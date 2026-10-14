---
name: falcon-architecture-mapping
description: Architecture discovery, component dependency mapping, and data flow modeling for Falcon 3D Prints.
---

# Falcon Architecture Mapping Skill

> Generates and maintains precise dependency maps, route hierarchies, service boundaries, and data flow representations.

## Task Triggers
- Discovering an existing codebase or onboarding new modules.
- Introducing a new domain feature (e.g. custom quotation workflow or inventory reservation).
- Refactoring complex dependencies or isolating server/client boundaries.

## Required Inputs & Source Paths
- Architecture System Overview: [`docs/architecture/system-overview.md`](../../../docs/architecture/system-overview.md).
- Folder Structure Guide: [`docs/architecture/folder-structure.md`](../../../docs/architecture/folder-structure.md).
- Dependency Map: [`docs/architecture/dependency-map.md`](../../../docs/architecture/dependency-map.md).
- Data Model: [`docs/architecture/data-model.md`](../../../docs/architecture/data-model.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Examine source tree (`src/app/`, `src/features/`, `src/server/`). Identify imported modules and data dependencies.
2. **Define Acceptance Criteria**: Outline required diagrams (Mermaid format), interface boundaries, and data flow steps.
3. **Plan**: Formulate the structural relationship. Distinguish verified code structures from planned or inferred relationships.
4. **Implement**:
   - Model the architecture using labeled Mermaid diagrams.
   - Trace data flow from client trigger → Route handler/Server Action → Database query / Third-party API → State update.
   - Check Graphify tool availability: If installed and authorized, run Graphify commands to extract dependency graphs. If not installed, produce clean, readable Mermaid diagrams directly from source analysis and label them clearly as manual Mermaid diagrams. Never claim Graphify generated them if produced manually.
5. **Verify**: Verify that all file paths cited in the architecture documentation exist in the workspace.
6. **Review**: Ensure strict layer separation (server secrets never imported into client components; UI primitives independent of domain logic).
7. **Report**: Update `docs/architecture/dependency-map.md` with verified diagrams.

---

## Invariants & Prohibited Shortcuts
- **Ground Truth**: Base architecture diagrams strictly on inspected code. Explicitly label inferred or proposed elements.
- **No Circular Dependencies**: Flag and eliminate circular imports across features.

## Required Verification Evidence
- Mermaid diagrams rendering without syntax errors.
- Verification that all referenced files resolve.
