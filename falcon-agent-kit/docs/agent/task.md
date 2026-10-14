# Agent Task Tracking — Falcon 3D Prints

> Active task definition, objectives, and acceptance criteria for the current development phase.

## Current Objective

- **Task Name**: Assemble, validate, and verify the Falcon 3D Prints Agent Instruction Kit.
- **Phase**: Kit Construction & Verification (Phase 0).
- **Assigned Role**: Lead Architect, Senior Full-Stack Engineer, Security Reviewer, and QA Lead.
- **Boundary Conditions**: Local-only development inside `falcon-agent-kit/`. No Git commands, no deployment, no paid service connections.

---

## 1. Concrete Deliverables Checklist

- [x] **Project Orientation & Core Instructions**:
  - [x] `START-HERE.md`
  - [x] `MASTER-PROMPT.md`
  - [x] `AGENTS.md`
  - [x] `GEMINI.md`
- [x] **Project Context (`docs/project/`)**:
  - [x] `brief.md`, `baseline-audit.md`, `requirements.md`, `acceptance-criteria.md`, `roadmap.md`, `decisions.md`, `open-questions.md`
- [x] **Architecture Specifications (`docs/architecture/`)**:
  - [x] `system-overview.md`, `folder-structure.md`, `dependency-map.md`, `data-model.md`, `integration-boundaries.md`
- [x] **Brand Guidelines (`docs/brand/`)**:
  - [x] `brand-guidelines.md`, `design-system.md`, `content-guidelines.md`, `asset-manifest.json`
- [x] **Quality & Verification Standards (`docs/quality/`)**:
  - [x] `threat-model.md`, `security-matrix.md`, `test-matrix.md`, `accessibility-checklist.md`, `performance-budgets.md`, `release-checklist.md`
- [x] **Operations Manual (`docs/operations/`)**:
  - [x] `environments.md`, `migration-strategy.md`, `backup-and-restore.md`, `monitoring-and-incidents.md`, `deployment-and-rollback.md`
- [x] **Agent Execution Artifacts (`docs/agent/`)**:
  - [x] `task.md`
  - [x] `status.md`
  - [x] `evidence.md`
- [x] **Specialist Skills (`.agent/skills/`)**: 15 skills
- [x] **Operational Workflows (`.agent/workflows/`)**: 5 workflows
- [x] **Validation & Tooling Scripts (`scripts/`)**: 3 scripts
- [x] **Templates & Schemas (`templates/`)**: 4 templates
- [x] **Brand Asset Storage (`assets/brand/originals/`)**: Directory README

---

## 2. Invariants & Guardrails

1. **Brand Accuracy**: Falcon 3D Prints, "Where ideas take shapes", Nashik, India (+91 98506 07144).
2. **Server-Authoritative**: Integer minor units for INR (paise), server-side signature verification for Razorpay, RLS on Supabase.
3. **Evidence Required**: Any completed task must be verified with reproducible command runs and test evidence.
