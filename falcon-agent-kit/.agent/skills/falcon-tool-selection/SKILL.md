---
name: falcon-tool-selection
description: Evaluation, licensing compliance, dependency vetting, and tool selection criteria for Falcon 3D Prints.
---

# Falcon Tool & Dependency Selection Skill

> Provides rigorous, evidence-based criteria for evaluating, vetting, and selecting third-party libraries, CLI tools, and development utilities.

## Task Triggers
- Considering a new NPM package, Python utility, or developer CLI tool.
- Evaluating alternative libraries for animation, 3D rendering, state management, or testing.
- Performing dependency maintenance and license auditing.

## Evaluation Criteria & Vetting Checklist

Before proposing or installing any third-party tool, evaluate:
1. **Concrete Need**: Can this requirement be solved with standard web platform APIs or existing project libraries?
2. **Bundle Impact**: What is the minified + gzipped weight? Does it violate the 180 KB JS budget?
3. **Licensing**: Is the license permissive (MIT, Apache-2.0, BSD, ISC)? Avoid AGPL or non-commercial licenses in commercial e-commerce.
4. **Maintenance Health**: Is the repository actively maintained? Are security vulnerabilities resolved promptly?
5. **Runtime Compatibility**: Does it support Node.js 18+ and Next.js App Router (React Server Components)?
6. **Privacy & Security**: Does it make unauthorized external telemetry calls or leak sensitive data?

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Search `package.json` to verify if existing dependencies can solve the problem. Consult official package documentation.
2. **Define Acceptance Criteria**: Define budget threshold (e.g. max 15 KB gzipped), required capabilities, and test compatibility.
3. **Plan**: Formulate comparison between candidate packages and native alternatives.
4. **Implement**:
   - If candidate passes vetting, install locally via `npm install <package> --save-exact` (or dev dependency).
   - If rejected, use native platform feature (e.g. CSS transitions over GSAP, Web Share API over custom social SDKs).
5. **Verify**: Run `npm audit` and bundle analyzer to measure impact on client chunks.
6. **Review**: Ensure no global installations were executed (`npm install -g` is strictly prohibited).
7. **Report**: Document tool selection decision in `docs/project/decisions.md` using the ADR template.

---

## Invariants & Prohibited Shortcuts
- **No Global Installs**: Tools must be installed locally within the project scope or invoked via `npx`.
- **No Unvetted Dependencies**: Never install packages on blind assumption without inspecting bundle size and license.
- **Never Claim a Tool is Installed Without Verification**: A workflow document referencing a tool does not mean the tool is installed. Always verify via `npm list` or command check.
