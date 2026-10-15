import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint reporting the server's authoritative database isolation status.
 * Used by automated verification scripts, browser test runners, and CI harnesses
 * to verify the application's actual database target before allowing test writes.
 * 
 * Fails closed: If the server is connected to a remote database, allowMutations is false.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint unavailable in production' }, { status: 404 });
  }

  const dbUrl = process.env.DATABASE_URL || '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  const isLocalDb = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const isLocalSupabase = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');
  const isIsolated = Boolean((dbUrl || supabaseUrl) && (isLocalDb || isLocalSupabase));

  // Extract host safely without leaking credentials
  let targetHost = 'unknown';
  try {
    if (supabaseUrl) {
      targetHost = new URL(supabaseUrl).hostname;
    } else if (dbUrl) {
      targetHost = new URL(dbUrl.replace(/^postgresql:\/\//, 'http://')).hostname;
    }
  } catch {
    targetHost = 'unparseable';
  }

  const maskedHost = isIsolated
    ? targetHost
    : targetHost.replace(/^([^.]{2})[^.]+/, '$1***');

  return NextResponse.json({
    isIsolated,
    targetMode: isIsolated ? 'isolated_local' : 'remote_database',
    targetHost: maskedHost,
    allowMutations: isIsolated,
    allowLocalStorageFallback: process.env.ALLOW_LOCAL_STORAGE_FALLBACK === 'true',
    allowLocalStorageFallbackRaw: process.env.ALLOW_LOCAL_STORAGE_FALLBACK || 'unset',
    message: isIsolated
      ? 'Application is connected to an isolated local database target. Test mutations permitted.'
      : 'Application is connected to a remote database target. Test mutations strictly refused.',
  });
}
