/**
 * Falcon 3D Prints — Centralized Role-Based Access Control (RBAC) System
 *
 * Enforces strict authorization policies across route handlers, server actions,
 * service functions, and client interfaces for the four operational staff roles.
 */

export type StaffRole = 'owner' | 'order_manager' | 'production_operator' | 'catalog_editor';

/**
 * Legacy or unassigned role compatibility:
 * Prior iterations mentioned a 5th 'support' role in schema enums.
 * Under Falcon 3D Prints core RBAC, exactly four operational roles exist.
 * 'support' is deprecated and restricted to read-only customer inquiries.
 */
export type ExtendedRole = StaffRole | 'support' | 'customer';

export const CORE_STAFF_ROLES: StaffRole[] = [
  'owner',
  'order_manager',
  'production_operator',
  'catalog_editor',
];

export type Permission =
  // 1. Orders & Fulfillment
  | 'orders:view'
  | 'orders:status_change'
  | 'orders:edit_address'
  | 'orders:edit_items'
  | 'orders:cancel'
  | 'orders:refund'
  | 'orders:export'

  // 2. Production & Print Farm
  | 'production:view'
  | 'production:claim'
  | 'production:update_status'
  | 'production:qc_check'
  | 'production:export'

  // 3. Shipping & Logistics
  | 'shipping:view'
  | 'shipping:manage_labels'
  | 'shipping:export'

  // 4. Products & Catalog
  | 'catalog:view'
  | 'catalog:create'
  | 'catalog:edit'
  | 'catalog:adjust_stock'
  | 'catalog:archive'
  | 'catalog:manage_videos'
  | 'catalog:export'

  // 5. Storefront & Merchandising
  | 'storefront:homepage'
  | 'storefront:branding'

  // 6. Customers & Communications
  | 'customers:view'
  | 'customers:view_pii'
  | 'customers:notes'
  | 'customers:custom_requests'
  | 'customers:bulk_enquiries'
  | 'customers:messages'
  | 'customers:reviews_moderate'
  | 'customers:email_templates'
  | 'customers:export'

  // 7. Analytics & Financial Reports
  | 'reports:financial'
  | 'reports:operational'
  | 'reports:export'

  // 8. Administration & Security Controls
  | 'staff:view'
  | 'staff:invite'
  | 'staff:change_role'
  | 'staff:suspend'
  | 'settings:view'
  | 'settings:edit'
  | 'audit:view'
;

/**
 * Canonical Role-Permission Matrix
 * Super Admin ('owner') possesses unrestricted access.
 * Other roles possess strictly scoped privileges.
 */
export const ROLE_PERMISSIONS: Record<StaffRole, Set<Permission>> = {
  // 1. Studio Owner (Super Admin) — Full unrestricted business authority
  owner: new Set<Permission>([
    'orders:view',
    'orders:status_change',
    'orders:edit_address',
    'orders:edit_items',
    'orders:cancel',
    'orders:refund',
    'orders:export',
    'production:view',
    'production:claim',
    'production:update_status',
    'production:qc_check',
    'production:export',
    'shipping:view',
    'shipping:manage_labels',
    'shipping:export',
    'catalog:view',
    'catalog:create',
    'catalog:edit',
    'catalog:adjust_stock',
    'catalog:archive',
    'catalog:manage_videos',
    'catalog:export',
    'storefront:homepage',
    'storefront:branding',
    'customers:view',
    'customers:view_pii',
    'customers:notes',
    'customers:custom_requests',
    'customers:bulk_enquiries',
    'customers:messages',
    'customers:reviews_moderate',
    'customers:email_templates',
    'customers:export',
    'reports:financial',
    'reports:operational',
    'reports:export',
    'staff:view',
    'staff:invite',
    'staff:change_role',
    'staff:suspend',
    'settings:view',
    'settings:edit',
    'audit:view',
  ]),

  // 2. Order Manager — Orders, shipping, dispatch, CRM, customer communication
  order_manager: new Set<Permission>([
    'orders:view',
    'orders:status_change',
    'orders:edit_address',
    'orders:export',
    'shipping:view',
    'shipping:manage_labels',
    'shipping:export',
    'catalog:view',
    'production:view',
    'customers:view',
    'customers:view_pii',
    'customers:notes',
    'customers:custom_requests',
    'customers:bulk_enquiries',
    'customers:messages',
    'customers:reviews_moderate',
    'customers:export',
    'reports:operational',
  ]),

  // 3. Production Operator — Workshop 3D printers, queue, QC, defect logs
  production_operator: new Set<Permission>([
    'production:view',
    'production:claim',
    'production:update_status',
    'production:qc_check',
    'production:export',
    'catalog:view', // Needed to view filament/material specs for 3D slicing
  ]),

  // 4. Catalog Editor — Products, variants, inventory counts, media, showcases
  catalog_editor: new Set<Permission>([
    'catalog:view',
    'catalog:create',
    'catalog:edit',
    'catalog:adjust_stock',
    'catalog:archive',
    'catalog:manage_videos',
    'catalog:export',
    'storefront:homepage',
    'storefront:branding',
  ]),
};

/**
 * Checks if a given staff role has a specific permission.
 */
export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  if (role === 'owner') return true;
  const permissions = ROLE_PERMISSIONS[role as StaffRole];
  if (!permissions) return false;
  return permissions.has(permission);
}

/**
 * Checks whether a staff role has permission to access a specific admin URL path.
 */
export function canAccessAdminRoute(role: string | undefined | null, pathname: string): boolean {
  if (!role) return false;
  if (role === 'owner') return true;

  // Normalization
  const path = pathname.replace(/\/$/, '');

  // 1. Dashboard is accessible to all staff, with role-tailored widgets
  if (path === '/admin') return true;

  // 2. Orders module
  if (path.startsWith('/admin/orders')) {
    return hasPermission(role, 'orders:view');
  }

  // 3. Production & Quality Check
  if (path.startsWith('/admin/production') || path.startsWith('/admin/queue')) {
    return hasPermission(role, 'production:view');
  }

  // 4. Shipping & Delivery
  if (path.startsWith('/admin/shipping')) {
    return hasPermission(role, 'shipping:view');
  }

  // 5. Products & Storefront
  if (
    path.startsWith('/admin/products') ||
    path.startsWith('/admin/categories') ||
    path.startsWith('/admin/videos') ||
    path.startsWith('/admin/homepage') ||
    path.startsWith('/admin/branding')
  ) {
    return hasPermission(role, 'catalog:view');
  }

  // 6. Customers & Communication
  if (
    path.startsWith('/admin/customers') ||
    path.startsWith('/admin/custom-requests') ||
    path.startsWith('/admin/quotes') ||
    path.startsWith('/admin/bulk-enquiries') ||
    path.startsWith('/admin/messages') ||
    path.startsWith('/admin/reviews')
  ) {
    return hasPermission(role, 'customers:view');
  }

  if (path.startsWith('/admin/email-templates')) {
    return hasPermission(role, 'customers:email_templates');
  }

  // 7. Administration (Reports, Staff, Settings, Activity)
  if (path.startsWith('/admin/reports')) {
    return hasPermission(role, 'reports:financial');
  }

  if (path.startsWith('/admin/staff')) {
    return hasPermission(role, 'staff:view');
  }

  if (path.startsWith('/admin/settings')) {
    return hasPermission(role, 'settings:view');
  }

  if (path.startsWith('/admin/activity')) {
    return hasPermission(role, 'audit:view');
  }

  return false;
}

/**
 * Masks customer Personally Identifiable Information (PII) for roles that
 * do not possess 'customers:view_pii' authorization (e.g. production_operator).
 */
export function maskCustomerPII<T extends Record<string, any>>(record: T, role: string): T {
  if (role === 'owner' || role === 'order_manager') {
    return record;
  }

  const masked = { ...record } as Record<string, any>;

  if ('customerName' in masked && masked.customerName) {
    const parts = String(masked.customerName).trim().split(' ');
    masked.customerName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}. [Operator View]` : `${parts[0]} [Operator View]`;
  }
  if ('customer_name' in masked && masked.customer_name) {
    const parts = String(masked.customer_name).trim().split(' ');
    masked.customer_name = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}. [Operator View]` : `${parts[0]} [Operator View]`;
  }

  if ('customerEmail' in masked) masked.customerEmail = '[Restricted: Operator View]';
  if ('customer_email' in masked) masked.customer_email = '[Restricted: Operator View]';
  if ('customerPhone' in masked) masked.customerPhone = '[Restricted: Operator View]';
  if ('customer_phone' in masked) masked.customer_phone = '[Restricted: Operator View]';

  if ('shippingAddress' in masked && masked.shippingAddress) {
    masked.shippingAddress = {
      fullName: masked.customerName || '[Restricted]',
      phone: '[Restricted]',
      addressLine1: '[Fulfillment Managed by Shipping Desk]',
      city: masked.shippingAddress.city || 'Nashik',
      state: masked.shippingAddress.state || 'Maharashtra',
      pinCode: masked.shippingAddress.pinCode ? `${String(masked.shippingAddress.pinCode).slice(0, 3)}***` : '***',
    };
  }

  if ('shipping_address' in masked && masked.shipping_address) {
    masked.shipping_address = {
      fullName: masked.customer_name || '[Restricted]',
      phone: '[Restricted]',
      addressLine1: '[Fulfillment Managed by Shipping Desk]',
      city: masked.shipping_address.city || 'Nashik',
      state: masked.shipping_address.state || 'Maharashtra',
      pinCode: masked.shipping_address.pinCode ? `${String(masked.shipping_address.pinCode).slice(0, 3)}***` : '***',
    };
  }

  // Mask financial values if role lacks financial report privileges
  if ('totalPaise' in masked) masked.totalPaise = 0;
  if ('total_paise' in masked) masked.total_paise = 0;
  if ('subtotalPaise' in masked) masked.subtotalPaise = 0;
  if ('subtotal_paise' in masked) masked.subtotal_paise = 0;

  return masked as T;
}

/**
 * Strips financial revenue and ledger information from metrics payloads
 * for non-owner staff roles.
 */
export function sanitizeMetricsForRole(metrics: Record<string, any>, role: string): Record<string, any> {
  if (role === 'owner') {
    return metrics;
  }

  const sanitized = { ...metrics };

  // Strip monetary totals from non-owners
  delete sanitized.grossSalesPaise;
  delete sanitized.paymentsReceivedPaise;
  delete sanitized.refundsPaise;
  delete sanitized.outstandingBalancesPaise;
  delete sanitized.totalRevenue;
  delete sanitized.averageOrderValue;
  delete sanitized.salesSeries;
  delete sanitized.revenueSeries;
  delete sanitized.grossMarginPaise;
  delete sanitized.netProfitPaise;
  delete sanitized.financialLedger;

  sanitized.isFinancialRestricted = true;
  return sanitized;
}

/**
 * Human-readable role descriptors and badge styling
 */
export const ROLE_METADATA: Record<StaffRole, { title: string; badgeColor: string; badgeBg: string; description: string }> = {
  owner: {
    title: 'Studio Owner (Super Admin)',
    badgeColor: '#B45309',
    badgeBg: '#FEF3C7',
    description: 'Full administrative authority across all studio operations, financial reconciliations, staff permissions, and store settings.',
  },
  order_manager: {
    title: 'Order Manager',
    badgeColor: '#1D4ED8',
    badgeBg: '#DBEAFE',
    description: 'Oversees customer orders, shipping dispatch, address corrections, and courier tracking updates.',
  },
  production_operator: {
    title: 'Production Operator',
    badgeColor: '#047857',
    badgeBg: '#D1FAE5',
    description: 'Runs workshop 3D printers, manages print jobs, conducts quality control checks, and reports reprints.',
  },
  catalog_editor: {
    title: 'Catalog Editor',
    badgeColor: '#6D28D9',
    badgeBg: '#EDE9FE',
    description: 'Manages products, variants, studio photography, video reels, categories, and homepage showcases.',
  },
};
