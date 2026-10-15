import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession } from '@/lib/supabase/server';
import { serializeOrderFromDb, serializeQuoteFromDb } from '@/lib/serializers';

export async function GET() {
  const auth = await verifyStaffSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    // 1. Attempt database-authoritative SUM aggregate and exact metrics via PostgreSQL procedure
    let totalRevenuePaise = 0;
    let totalOrdersCount = 0;
    let activeProductionJobs = 0;
    let pendingQuotesCount = 0;
    let readyToShip = 0;
    let unhandledOrdersCount = 0;
    let totalProductsCount = 0;

    const { data: dbMetrics, error: rpcError } = await supabase.rpc('get_dashboard_metrics');

    if (!rpcError && dbMetrics) {
      totalRevenuePaise = Number(dbMetrics.totalRevenuePaise || 0);
      totalOrdersCount = Number(dbMetrics.totalOrdersCount || 0);
      activeProductionJobs = Number(dbMetrics.activeProductionJobs || 0);
      readyToShip = Number(dbMetrics.readyToShip || 0);
      unhandledOrdersCount = Number(dbMetrics.unhandledOrdersCount || 0);
      pendingQuotesCount = Number(dbMetrics.pendingQuotesCount || 0);
      totalProductsCount = Number(dbMetrics.totalProductsCount || 0);
    } else {
      // Fallback if RPC unmigrated: Query counts using { count: 'exact', head: true }
      const { count: ordCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      totalOrdersCount = ordCount ?? 0;

      const { count: prodJobs } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['queued', 'printing', 'finishing', 'quality_check']);
      activeProductionJobs = prodJobs ?? 0;

      const { count: readyJobs } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['ready', 'packed']);
      readyToShip = readyJobs ?? 0;

      const { count: unhandled } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');
      unhandledOrdersCount = unhandled ?? 0;

      const { count: pendingQ } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'under_review']);
      pendingQuotesCount = pendingQ ?? 0;

      const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      totalProductsCount = prodCount ?? 0;

      // Bound revenue query: only fetch captured orders up to a reasonable limit in fallback
      const { data: capturedOrders } = await supabase
        .from('orders')
        .select('total_paise')
        .eq('payment_status', 'captured')
        .limit(500);

      totalRevenuePaise = (capturedOrders || []).reduce((sum, o) => sum + (o.total_paise || 0), 0);
    }

    // 2. Fetch bounded recent orders for dashboard feed
    const { data: recentOrdersData } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(10);

    // 3. Fetch bounded recent quotes for dashboard feed
    const { data: recentQuotesData } = await supabase
      .from('quotes')
      .select('*')
      .in('status', ['submitted', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(5);

    const recentOrders = (recentOrdersData || []).map((row) => serializeOrderFromDb(row));
    const recentQuotes = (recentQuotesData || []).map((row) => serializeQuoteFromDb(row));

    return NextResponse.json({
      metrics: {
        totalRevenuePaise,
        totalOrdersCount: totalOrdersCount ?? 0,
        activeProductionJobs: activeProductionJobs ?? 0,
        pendingQuotesCount: pendingQuotesCount ?? 0,
        readyToShip: readyToShip ?? 0,
        unhandledOrdersCount: unhandledOrdersCount ?? 0,
        totalProductsCount: totalProductsCount ?? 0,
      },
      recentOrders,
      recentQuotes,
      isLiveDb: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to compile metrics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
