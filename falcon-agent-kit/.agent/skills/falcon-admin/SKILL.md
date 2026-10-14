---
name: falcon-admin
description: Integrated admin dashboard, order lifecycle management, 3D print queue operations, and staff role controls for Falcon 3D Prints.
---

# Falcon Admin Panel Operations Skill

> Implements the operational control center for Falcon 3D Prints: order management, print farm queue tracking, inventory adjustments, and quotation reviews.

## Task Triggers
- Developing administrative views, data tables, order detail views, or print queue cards.
- Implementing order status transitions, address corrections, or reprint flags.
- Configuring role-based access control (RBAC) for staff members.

## Production State Machine
For Made-to-Order items:
```text
Queued ──> Printing ──> Finishing ──> Quality Check ──> Ready ──> Packed ──> Shipped ──> Delivered
                                           │
                                    (Failed QC ──> Reprint)
```
For Ready-Stock items:
```text
Confirmed ──> Packed ──> Shipped ──> Delivered
```

## Required Inputs & Source Paths
- Requirements: [`docs/project/requirements.md`](../../../docs/project/requirements.md).
- Data Model: [`docs/architecture/data-model.md`](../../../docs/architecture/data-model.md).
- Security Matrix: [`docs/quality/security-matrix.md`](../../../docs/quality/security-matrix.md).

---

## Execution Sequence

```text
Inspect ──> Define criteria ──> Plan ──> Implement ──> Verify ──> Review ──> Report
```

1. **Inspect**: Review staff role capabilities in `docs/architecture/data-model.md` (`owner`, `order_manager`, `production_operator`, `catalog_editor`).
2. **Define Acceptance Criteria**:
   - Status transitions enforce valid next-state rules.
   - Address edits restricted once order is marked `Packed` or `Shipped`.
   - All admin actions write an entry to `admin_audit_logs`.
3. **Plan**:
   - Implement data table with sorting, date range filters, and SKU/Status search.
   - Implement order detail view handling mixed orders (both ready-stock and custom printed items).
   - Implement quotation review screen: Operator views uploaded STL metadata, sets price in INR, and sends approval link to customer.
4. **Implement**:
   - Enforce server-side role authorization in all admin route handlers and server actions.
   - Build conflict detection for concurrent edits: Use `updated_at` timestamps to detect stale writes.
   - Build batch actions with bounded limits (max 50 orders per bulk operation) returning per-item success/failure statuses.
5. **Verify**:
   - Test permission denial: Ensure `production_operator` cannot issue refunds.
   - Test address modification on `Shipped` order: Confirm server blocks edit with HTTP 400.
6. **Review**: Ensure sensitive customer PII is masked where appropriate and no customer credit card details are stored or displayed.
7. **Report**: Log admin features in `docs/agent/status.md`.

---

## Invariants & Prohibited Shortcuts
- **Separate Statuses**: Never conflate payment state (`paid`, `refunded`) with physical fulfillment state (`printing`, `shipped`).
- **Mandatory Audit Logs**: Every administrative modification (price change, status override, address update) must generate an immutable audit log record.
