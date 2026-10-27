import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { StaffRole } from '@/lib/types';
import { AdminDataService } from '@/lib/adminDataStore';
import { hasPermission, Permission, CORE_STAFF_ROLES } from '@/lib/rbac';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

export interface StaffProfile {
  id: string;
  full_name: string;
  role: StaffRole;
  phone?: string | null;
}

export type StaffAuthResult =
  | {
      authorized: true;
      user: User;
      profile: StaffProfile;
      status: 200;
      error: null;
    }
  | {
      authorized: false;
      user: User | null;
      profile: StaffProfile | null;
      status: 401 | 403;
      error: string;
    };

/**
 * Creates an authenticated Supabase server client wired to Next.js cookie storage.
 * Reads cookies from incoming requests to validate user session tokens.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!supabaseUrl || !anonKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignores set attempts when invoked from Server Components where headers cannot be mutated
        }
      },
    },
  });
}

/**
 * Returns privileged server Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Reserved strictly for trusted API routes, webhooks, and internal jobs.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Returns standard server client with anon key for public queries.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!supabaseUrl || !anonKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

function isTestHarnessAuthorized(reqHeaders: { get(name: string): string | null }): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.ENABLE_TEST_HARNESS !== 'true') return false;
  const secret = process.env.FALCON_TEST_HARNESS_SECRET;
  if (!secret || secret.length < 16) return false;
  return reqHeaders.get('x-falcon-test-secret') === secret;
}

/**
 * Retrieves the current session user and profile without enforcing staff-only permissions.
 * Useful for routes that serve both customers (own data) and staff (all data).
 */
export async function getAuthenticatedUserSession() {
  if (process.env.ENABLE_TEST_HARNESS === 'true') {
    try {
      const reqHeaders = await headers();
      if (isTestHarnessAuthorized(reqHeaders)) {
        const testRole = reqHeaders.get('x-falcon-test-role') as StaffRole | null;
        const testUserId = reqHeaders.get('x-falcon-test-user-id');
        const testEmail = reqHeaders.get('x-falcon-test-email');
        const testName = reqHeaders.get('x-falcon-test-name') || 'Test User';
        if (testRole) {
          const isStaff = ['owner', 'order_manager', 'production_operator', 'catalog_editor', 'support'].includes(testRole);
          return {
            user: { id: testUserId || 'test_user_id', email: testEmail || 'test@falcon3dprints.com' } as unknown as User,
            profile: { id: testUserId || 'test_user_id', full_name: testName, role: testRole } as StaffProfile,
            isStaff,
          };
        }
      }
    } catch {
      // In server components where headers() might not be available
    }
  }

  const serverClient = await createSupabaseServerClient();
  if (!serverClient) return { user: null, profile: null, isStaff: false };

  // Check Bearer token or cookies
  let user: User | null = null;
  try {
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const { data: bearerData } = await serverClient.auth.getUser(token);
      if (bearerData?.user) user = bearerData.user;
    }
  } catch {}

  if (!user) {
    const { data: { user: cookieUser }, error } = await serverClient.auth.getUser();
    if (!error && cookieUser) user = cookieUser;
  }

  if (!user) return { user: null, profile: null, isStaff: false };

  // Fetch verified profile from database
  const adminClient = getSupabaseAdminClient() || serverClient;
  let profileData: any = null;
  if (adminClient) {
    const { data } = await adminClient
      .from('profiles')
      .select('id, full_name, role, phone, is_suspended')
      .eq('id', user.id)
      .single();
    if (data) profileData = data;
  }

  if (!profileData) {
    const storeUser = AdminDataService.getStaffUsers().find(
      (u) => u.id === user.id || u.email === user.email
    );
    if (storeUser) {
      profileData = {
        id: storeUser.id,
        full_name: storeUser.name,
        role: storeUser.role,
        phone: null,
        is_suspended: Boolean(storeUser.isSuspended),
      };
    }
  }

  if (!profileData && user.user_metadata?.role) {
    profileData = {
      id: user.id,
      full_name: user.user_metadata.full_name || 'Staff User',
      role: user.user_metadata.role,
      phone: null,
      is_suspended: false,
    };
  }

  const isStaff = profileData && ['owner', 'order_manager', 'production_operator', 'catalog_editor', 'support'].includes(profileData.role);
  return {
    user,
    profile: profileData as StaffProfile | null,
    isStaff: Boolean(isStaff),
  };
}

/**
 * Defense-in-depth verification for sensitive API routes.
 * 1. Validates the caller's session token using Bearer header or cookie-based Supabase Auth.
 * 2. Fetches the verified user profile from PostgreSQL (authoritative source).
 * 3. Enforces that the profile role possesses the requested permission or role.
 * 4. Checks suspension status immediately on every call.
 *
 * Anonymous requests receive HTTP 401.
 * Non-staff or insufficient-role requests receive HTTP 403.
 */
export async function verifyStaffSession(
  requirement?: StaffRole[] | { roles?: StaffRole[]; permission?: Permission }
): Promise<StaffAuthResult> {
  const requiredRoles = Array.isArray(requirement) ? requirement : requirement?.roles;
  const requiredPermission = !Array.isArray(requirement) ? requirement?.permission : undefined;

  // Automated test harness (strictly limited to test runner with secret)
  if (process.env.ENABLE_TEST_HARNESS === 'true') {
    try {
      const reqHeaders = await headers();
      if (isTestHarnessAuthorized(reqHeaders)) {
        const testRole = reqHeaders.get('x-falcon-test-role') as StaffRole | null;
        const testUserId = reqHeaders.get('x-falcon-test-user-id') || 'test_staff_id';
        const testEmail = reqHeaders.get('x-falcon-test-email') || 'staff@falcon3dprints.com';
        const testName = reqHeaders.get('x-falcon-test-name') || 'Verified Staff';

        if (testRole) {
          const allStaffRoles: StaffRole[] = [
            'owner',
            'order_manager',
            'production_operator',
            'catalog_editor',
            'support',
          ];

          const isStaff = allStaffRoles.includes(testRole);
          if (!isStaff) {
            return {
              authorized: false,
              user: { id: testUserId, email: testEmail } as unknown as User,
              profile: { id: testUserId, full_name: testName, role: testRole },
              status: 403,
              error: 'Forbidden: User does not have staff permissions.',
            };
          }

          if (requiredPermission && !hasPermission(testRole, requiredPermission)) {
            return {
              authorized: false,
              user: { id: testUserId, email: testEmail } as unknown as User,
              profile: { id: testUserId, full_name: testName, role: testRole },
              status: 403,
              error: `Forbidden: Action requires '${requiredPermission}' authorization. Current role: ${testRole}.`,
            };
          }

          if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(testRole)) {
            return {
              authorized: false,
              user: { id: testUserId, email: testEmail } as unknown as User,
              profile: { id: testUserId, full_name: testName, role: testRole },
              status: 403,
              error: `Forbidden: Requires one of [${requiredRoles.join(', ')}]. Current role: ${testRole}.`,
            };
          }

          return {
            authorized: true,
            user: { id: testUserId, email: testEmail } as unknown as User,
            profile: { id: testUserId, full_name: testName, role: testRole },
            status: 200,
            error: null,
          };
        }
      }
    } catch {
      // In server components where headers() may not be available
    }
  }

  const serverClient = await createSupabaseServerClient();
  if (!serverClient) {
    return {
      authorized: false,
      user: null,
      profile: null,
      status: 401,
      error: 'Authentication service unavailable.',
    };
  }

  // 1. Resolve user from Bearer Token or Session Cookie
  let user: User | null = null;
  try {
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const { data: bearerData } = await serverClient.auth.getUser(token);
      if (bearerData?.user) user = bearerData.user;
    }
  } catch {}

  if (!user) {
    const { data: cookieData, error: authError } = await serverClient.auth.getUser();
    if (!authError && cookieData?.user) user = cookieData.user;
  }

  if (!user) {
    return {
      authorized: false,
      user: null,
      profile: null,
      status: 401,
      error: 'Authentication required. Please sign in.',
    };
  }

  // 2. Authoritatively query public.profiles using admin client (prevents RLS recursion)
  const adminClient = getSupabaseAdminClient() || serverClient;
  let profileData: any = null;

  if (adminClient) {
    const { data, error: profileError } = await adminClient
      .from('profiles')
      .select('id, full_name, role, phone, is_suspended')
      .eq('id', user.id)
      .single();

    if (!profileError && data) {
      profileData = data;
    }
  }

  if (!profileData) {
    // In-memory fallback
    const storeUser = AdminDataService.getStaffUsers().find(
      (u) => u.id === user.id || u.email === user.email
    );
    if (storeUser) {
      profileData = {
        id: storeUser.id,
        full_name: storeUser.name,
        role: storeUser.role,
        phone: null,
        is_suspended: Boolean(storeUser.isSuspended),
      };
    }
  }

  if (!profileData && user.user_metadata?.role) {
    profileData = {
      id: user.id,
      full_name: user.user_metadata.full_name || 'Staff User',
      role: user.user_metadata.role,
      phone: null,
      is_suspended: false,
    };
  }

  if (!profileData) {
    return {
      authorized: false,
      user,
      profile: null,
      status: 403,
      error: 'Forbidden: Profile not found or not registered.',
    };
  }

  // 3. Immediate suspension enforcement
  const isSuspended =
    Boolean(profileData.is_suspended) ||
    AdminDataService.isUserSuspended(user.id) ||
    AdminDataService.isUserSuspended(profileData.id);

  if (isSuspended) {
    return {
      authorized: false,
      user,
      profile: null,
      status: 403,
      error: 'Forbidden: Account has been suspended. Please contact the studio owner.',
    };
  }

  const profile: StaffProfile = {
    id: profileData.id,
    full_name: profileData.full_name || 'Staff User',
    role: profileData.role as StaffRole,
    phone: profileData.phone,
  };

  const allStaffRoles: StaffRole[] = [
    'owner',
    'order_manager',
    'production_operator',
    'catalog_editor',
    'support',
  ];

  if (!allStaffRoles.includes(profile.role)) {
    return {
      authorized: false,
      user,
      profile,
      status: 403,
      error: 'Forbidden: User does not have staff permissions.',
    };
  }

  // 4. Granular Permission Check
  if (requiredPermission && !hasPermission(profile.role, requiredPermission)) {
    return {
      authorized: false,
      user,
      profile,
      status: 403,
      error: `Forbidden: Action requires '${requiredPermission}' authorization. Current role: ${profile.role}.`,
    };
  }

  // 5. Explicit Role Whitelist Check
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(profile.role)) {
    return {
      authorized: false,
      user,
      profile,
      status: 403,
      error: `Forbidden: Requires one of [${requiredRoles.join(', ')}]. Current role: ${profile.role}.`,
    };
  }

  return {
    authorized: true,
    user,
    profile,
    status: 200,
    error: null,
  };
}

/**
 * Records an immutable audit log entry into public.admin_audit_logs.
 * Logs to server console if database table is not yet created.
 */
export async function recordAuditLog({
  staffUserId,
  staffName,
  staffRole,
  action,
  entityType,
  entityId,
  oldState,
  newState,
  notes,
  ipAddress,
}: {
  staffUserId: string;
  staffName: string;
  staffRole: string;
  action: string;
  entityType: 'order' | 'product' | 'quote' | 'user' | 'system' | 'media' | 'category' | 'shipping' | 'settings';
  entityId: string;
  oldState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  notes?: string;
  ipAddress?: string;
}): Promise<void> {
  if (process.env.ENABLE_TEST_HARNESS === 'true') {
    try {
      const reqHeaders = await headers();
      if (isTestHarnessAuthorized(reqHeaders) && reqHeaders.get('x-falcon-test-fail-audit') === 'true') {
        throw new Error('FORCED_AUDIT_LOG_FAILURE: Simulated audit logging failure for transaction rollback test.');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('FORCED_AUDIT_LOG_FAILURE')) {
        throw err;
      }
    }
  }

  // Always record into in-memory store so audit UI displays it immediately in all environments
  try {
    AdminDataService.recordAudit({
      staffUserId,
      staffName,
      staffRole: (staffRole as StaffRole) || 'owner',
      action,
      entityType,
      entityId,
      oldState,
      newState,
      notes: notes || '',
    });
  } catch {
    // ignore
  }

  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    console.warn('[AUDIT LOG - NO DB CLIENT]', { action, entityType, entityId, staffName });
    return;
  }

  const isValidUuid = (val?: string) =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

  const { error } = await adminClient.from('admin_audit_logs').insert([
    {
      staff_user_id: isValidUuid(staffUserId) ? staffUserId : null,
      staff_name: staffName,
      staff_role: staffRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_state: oldState || null,
      new_state: newState || null,
      notes: notes || null,
      ip_address: ipAddress || null,
    },
  ]);

  if (error) {
    console.warn('[AUDIT LOG INSERT ERROR]:', error.message, { action, entityType, entityId, staffName });
    // If the table does not exist in the remote database schema cache, do not abort the operation
    if (error.message.includes('schema cache') || error.code === '42P01') {
      return;
    }
    // Throw error so caller catches and rolls back business mutation
    throw new Error(`Failed to commit immutable audit log: ${error.message}`);
  }
}
