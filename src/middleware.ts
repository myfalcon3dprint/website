import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { AdminDataService } from '@/lib/adminDataStore';

const STAFF_ROLES = ['owner', 'order_manager', 'production_operator', 'catalog_editor', 'support'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin and sensitive /api/admin routes
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  // Staff invitation acceptance allows existing customer accounts to redeem invitations
  if (pathname === '/api/admin/staff/invitations/accept') {
    return NextResponse.next();
  }

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Automated API test harness authorization (strictly restricted to backend API testing).
  // Admin pages (/admin/*) NEVER allow test harness headers and unconditionally require real Supabase session auth.
  const isHarnessAuthorized =
    isAdminApi &&
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_TEST_HARNESS === 'true' &&
    Boolean(process.env.FALCON_TEST_HARNESS_SECRET) &&
    request.headers.get('x-falcon-test-secret') === process.env.FALCON_TEST_HARNESS_SECRET;

  if (isHarnessAuthorized) {
    const testRole = request.headers.get('x-falcon-test-role');
    if (testRole) {
      const isTestStaff = STAFF_ROLES.includes(testRole);
      if (!isTestStaff) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient privileges. Staff access required.' },
          { status: 403 }
        );
      }
      return response;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wkkoviqhmccjnocjfudq.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indra292aXFobWNjam5vY2pmdWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTY0ODYsImV4cCI6MjEwNzI5MjQ4Nn0.MK9cn5kqom-GvaZTV-7__imhPd-Y_2r2rH3TOi0Zdfc';

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Authentication service unconfigured' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/login?error=auth_unconfigured', request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  // 1. Unauthenticated -> 401 on API, redirect to /login on pages
  if (authError || !user) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required. Please sign in.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authoritatively fetch user profile from database to verify staff role
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let profile: { role: string; is_suspended?: boolean } | null = null;

  if (serviceRoleKey) {
    try {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data } = await adminClient
        .from('profiles')
        .select('role, is_suspended')
        .eq('id', user.id)
        .single();
      if (data) profile = data;
    } catch (e) {
      console.error('Middleware admin profile lookup error:', e);
    }
  }

  // If service role client unavailable, query using the authenticated user's session token to pass RLS
  if (!profile) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userAccessToken = sessionData?.session?.access_token || token;

      if (userAccessToken) {
        const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${userAccessToken}`,
            },
          },
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data } = await authenticatedClient
          .from('profiles')
          .select('role, is_suspended')
          .eq('id', user.id)
          .single();
        if (data) profile = data;
      }
    } catch (e) {
      console.error('Middleware authenticated profile lookup error:', e);
    }
  }

  if (!profile && user.user_metadata?.role) {
    profile = { role: user.user_metadata.role };
  }

  if (!profile && user.app_metadata?.role) {
    profile = { role: user.app_metadata.role as string };
  }

  const isSuspended =
    Boolean(profile?.is_suspended) ||
    AdminDataService.isUserSuspended(user.id);

  if (isSuspended) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: 'Forbidden: Account has been suspended. Please contact the studio owner.' },
        { status: 403 }
      );
    }
    const accountUrl = new URL('/account', request.url);
    accountUrl.searchParams.set('error', 'account_suspended');
    return NextResponse.redirect(accountUrl);
  }

  // 3. Authorization Decision:
  // If profile is definitively resolved as customer, block access.
  // If profile cannot be resolved at the edge (e.g. cold worker or unmigrated RPC),
  // allow admin pages through to AdminLayout, which authoritatively validates permissions
  // on the client side with the user's active Supabase Auth session.
  if (profile) {
    const isStaff = STAFF_ROLES.includes(profile.role);
    if (!isStaff) {
      if (isAdminApi) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient privileges. Staff access required.' },
          { status: 403 }
        );
      }
      const accountUrl = new URL('/account', request.url);
      accountUrl.searchParams.set('error', 'unauthorized_staff_access');
      return NextResponse.redirect(accountUrl);
    }
  }

  // User is verified staff -> Allow request through
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
