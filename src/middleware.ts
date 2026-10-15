import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  // 2. Fetch user profile from database to verify staff role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isStaff = !profileError && profile && STAFF_ROLES.includes(profile.role);

  // 3. Authenticated customer without staff role -> 403 on API, redirect on pages
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

  // User is verified staff -> Allow request through
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
