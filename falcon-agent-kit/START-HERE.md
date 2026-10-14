# Falcon 3D Prints — Agent Instruction Kit

## What is this?

This is a complete, project-specific AI-agent instruction kit for building the **Falcon 3D Prints** e-commerce website and integrated admin panel. It contains prompts, skills, workflows, documentation, validation scripts and templates that enable any AI coding agent to build this project consistently and correctly.

## Quick start

1. **Read the master prompt**: Open [`MASTER-PROMPT.md`](./MASTER-PROMPT.md) — this is the single canonical launch prompt. Copy it into your AI IDE session when starting work.
2. **Review the baseline**: Read [`docs/project/baseline-audit.md`](./docs/project/baseline-audit.md) to understand the current state of the project.
3. **Check the roadmap**: Read [`docs/project/roadmap.md`](./docs/project/roadmap.md) for the phased implementation plan.
4. **Understand the architecture**: Read [`docs/architecture/system-overview.md`](./docs/architecture/system-overview.md) for the technical foundation.
5. **Run validation**: Execute `python scripts/validate-kit.py` to verify the kit's internal consistency.

## Key locations

| What | Where |
|---|---|
| **Canonical launch prompt** | [`MASTER-PROMPT.md`](./MASTER-PROMPT.md) |
| **Shared agent rules** | [`AGENTS.md`](./AGENTS.md) |
| **IDE pointer file** | [`GEMINI.md`](./GEMINI.md) |
| **Project documentation** | [`docs/`](./docs/) |
| **Agent skills** | [`.agent/skills/`](./.agent/skills/) |
| **Agent workflows** | [`.agent/workflows/`](./.agent/workflows/) |
| **Validation scripts** | [`scripts/`](./scripts/) |
| **Reusable templates** | [`templates/`](./templates/) |
| **Brand assets** | [`assets/brand/originals/`](./assets/brand/originals/) |

## How to load skills in your IDE

### Antigravity / Gemini IDE (automatic discovery)

If using the Antigravity IDE, skills in `.agent/skills/` are automatically discovered when this kit is placed in a workspace root or merged into a project. The IDE will list them as available skills.

### Manual loading

If your IDE does not auto-discover `.agent/skills/`, you can:

1. **Point your IDE configuration** to this kit's `.agent/skills/` directory as a custom skills root.
2. **Copy the `.agent/` directory** into your project root (see merge instructions below).
3. **Reference skills directly** by reading the relevant `SKILL.md` file before executing a task class.

## Merging into an existing project

> [!CAUTION]
> Never blindly overwrite an existing project's root-level `AGENTS.md`, `GEMINI.md`, or `.agent/` directory.

### Merge procedure

1. **Create a backup** of any existing root-level instruction files.
2. **Copy the `.agent/` directory** into your project root. If `.agent/skills/` already exists, merge individual skill directories — do not replace the parent.
3. **Append or merge** the contents of this kit's `AGENTS.md` into your existing `AGENTS.md`, resolving any rule conflicts.
4. **Update your `GEMINI.md`** to reference `MASTER-PROMPT.md` as the canonical launch prompt.
5. **Copy `docs/`, `templates/`, and `scripts/`** into the project, choosing a non-conflicting location if needed (e.g., `falcon-agent-kit/docs/` rather than `docs/`).
6. **Copy `assets/brand/originals/`** preserving all original files unchanged.
7. **Run `python scripts/validate-kit.py`** from the kit root to verify all paths resolve.

## Validation vs. implementation

This kit validates its own internal consistency — correct file structure, valid links, proper skill frontmatter, and complete templates. It does **not** validate the application being built.

Application validation is defined in [`docs/quality/test-matrix.md`](./docs/quality/test-matrix.md) and executed during implementation phases per the roadmap.

## Outstanding business decisions

See [`docs/project/open-questions.md`](./docs/project/open-questions.md) for decisions that require the business owner's input before implementation can proceed.

## Kit version

- **Created**: 2026-10-11
- **Project state at creation**: Greenfield (empty workspace)
- **Target stack**: Next.js 14+ (App Router), Supabase, Razorpay
