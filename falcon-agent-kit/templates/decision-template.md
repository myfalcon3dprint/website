# Architectural Decision Record (ADR) Template — Falcon 3D Prints

> Standard format for documenting significant architectural, technology, and business decisions.

## ADR-[NUMBER]: [Title of Decision]

- **Status**: `PROPOSED` | `ACCEPTED` | `DEPRECATED` | `SUPERSEDED`
- **Date**: YYYY-MM-DD
- **Deciders**: Lead Architect, Full-Stack Engineer, Business Owner
- **Related Requirements**: Link to relevant section in `docs/project/requirements.md`

---

## 1. Context and Problem Statement

Describe the context and problem that requires a decision. Mention forces at play, technological constraints, and business goals.
- Example: "How should product custom quotation STL files be safely handled, priced, and stored without exposing server storage to unauthenticated malware or massive compute exhaustion?"

---

## 2. Decision Drivers

- Driver 1: Customer upload security and anti-abuse safeguards.
- Driver 2: Performance budget (avoid client bundle bloat for 3D parsing).
- Driver 3: Accurate estimation of material volume and print time.
- Driver 4: Storage cost and lifecycle retention.

---

## 3. Considered Options

1. **Option 1**: Client-side STL mesh analysis with Three.js.
2. **Option 2**: Server-side microservice / serverless worker computing mesh volume.
3. **Option 3**: Manual quotation submission with async operator review and admin quoting.

---

## 4. Decision Outcome

**Chosen Option**: Option 3 (Manual / Hybrid Quoting) for initial phase, evolving to Option 2.

### Positive Consequences
- Zero heavy 3D compute dependencies in client critical path.
- Operator inspects printability and geometry before issuing final price commitment.
- Safe from automated resource exhaustion attacks.

### Negative Consequences / Trade-offs
- Quotation is asynchronous rather than instant.

---

## 5. Compliance & Verification

How will this decision be enforced and tested in the codebase?
- Direct unit tests for quota limits and signed upload URLs.
- Admin quotation review workflow tests in `docs/quality/test-matrix.md`.
