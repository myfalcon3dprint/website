import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { StaffRole } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

  const { data: { user }, error } = await serverClient.auth.getUser();
  if (error || !user) return { user: null, profile: null, isStaff: false };

  const adminClient = getSupabaseAdminClient() || serverClient;
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, full_name, role, phone')
    .eq('id', user.id)
    .single();

  const isStaff = profile && ['owner', 'order_manager', 'production_operator', 'catalog_editor', 'support'].includes(profile.role);
  return {
    user,
    profile: profile as StaffProfile | null,
    isStaff: Boolean(isStaff),
  };
}

/**
 * Defense-in-depth verification for sensitive API routes.
 * 1. Validates the caller's session token using cookie-based Supabase Auth.
 * 2. Fetches the verified user profile from PostgreSQL.
 * 3. Enforces that the profile role possesses staff permissions.
 *
 * Anonymous requests receive HTTP 401.
 * Non-staff or insufficient-role requests receive HTTP 403.
 */
export async function verifyStaffSession(
  requiredRoles?: StaffRole[]
): Promise<StaffAuthResult> {
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

  const {
    data: { user },
    error: authError,
  } = await serverClient.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      user: null,
      profile: null,
      status: 401,
      error: 'Authentication required. Please sign in.',
    };
  }

  // Authoritatively query public.profiles using admin client to prevent RLS recursion
  const adminClient = getSupabaseAdminClient() || serverClient;
  const { data: profileData, error: profileError } = await adminClient
    .from('profiles')
    .select('id, full_name, role, phone')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    return {
      authorized: false,
      user,
      profile: null,
      status: 403,
      error: 'Forbidden: Profile not found or not registered.',
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
  entityType: 'order' | 'product' | 'quote' | 'user' | 'system' | 'media' | 'category';
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
    // Throw error so caller catches and rolls back business mutation
    throw new Error(`Failed to commit immutable audit log: ${error.message}`);
  }
}
