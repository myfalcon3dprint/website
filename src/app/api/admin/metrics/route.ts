import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession } from '@/lib/supabase/server';
import { serializeOrderFromDb, serializeQuoteFromDb } from '@/lib/serializers';
import { AdminDataService } from '@/lib/adminDataStore';
import { sanitizeMetricsForRole, maskCustomerPII } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const auth = await verifyStaffSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'all'; // 'today', '7d', '30d', 'all'

  const supabase = getSupabaseAdminClient();

  try {
    let rawOrders: any[] = [];
    let rawQuotes: any[] = [];
    let rawProducts: any[] = [];
    let isLiveDb = false;

    if (supabase) {
      const { data: dbOrders } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      if (dbOrders) {
        rawOrders = dbOrders;
        isLiveDb = true;
      }

      const { data: dbQuotes } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
      if (dbQuotes) rawQuotes = dbQuotes;

      const { data: dbProducts } = await supabase.from('products').select('*, product_variants(*)');
      if (dbProducts) rawProducts = dbProducts;
    }

    if (rawOrders.length === 0) {
      const storeOrders = AdminDataService.getOrders();
      rawOrders = storeOrders.map((o) => ({
        id: o.id,
        order_number: o.orderNumber,
        customer_name: o.customerName,
        customer_email: o.customerEmail,
        customer_phone: o.customerPhone,
        total_paise: o.totalPaise,
        payment_status: o.paymentStatus,
        status: o.status,
        created_at: o.createdAt,
        order_items: (o.items || []).map((it) => ({
          product_title: it.productTitle,
          variant_sku: it.variantSku,
          quantity: it.quantity,
          total_paise: it.totalPricePaise,
        })),
      }));
    }

    if (rawQuotes.length === 0) {
      rawQuotes = [
        {
          id: 'q-1',
          reference_number: 'QUO-2026-081',
          full_name: 'Dr. Nitin Gadgil',
          phone: '+91 94222 88990',
          email: 'dr.gadgil@nashikortho.com',
          file_name: 'mandible_implant_v2.stl',
          file_size_bytes: 14200000,
          dimensions_mm: { x: 92, y: 64, z: 45 },
          material_preference: 'Bio-Resin',
          color_preference: 'Ivory White',
          infill_percentage: 100,
          quantity: 1,
          status: 'submitted',
          created_at: '2026-10-18T07:30:00Z',
        },
      ];
    }

    if (rawProducts.length === 0) {
      rawProducts = [
        { id: 'p-1', title: 'Precision Planetary Gearbox Kit', product_variants: [{ id: 'v-1', sku: 'FAL-GEAR-PLA-BLK', stock_quantity: 12 }] },
        { id: 'p-2', title: 'Aerospace Cable Mounting Bracket', product_variants: [{ id: 'v-2', sku: 'FAL-BRK-PETG-GRY', stock_quantity: 3 }] },
        { id: 'p-3', title: 'Parametric Voronoi Mood Lamp', product_variants: [{ id: 'v-3', sku: 'FAL-LAMP-PLA-SLV', stock_quantity: 4 }] },
      ];
    }

    // Filter by date range
    const now = new Date();
    const dateFilteredOrders = rawOrders.filter((o) => {
      if (range === 'all') return true;
      const orderDate = new Date(o.created_at);
      if (range === 'today') {
        return orderDate.toDateString() === now.toDateString();
      }
      if (range === '7d') {
        return now.getTime() - orderDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
      }
      if (range === '30d') {
        return now.getTime() - orderDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });

    // 1. Order Fulfilment & Payment Funnels
    const newOrdersCount = dateFilteredOrders.filter((o) => o.status === 'confirmed').length;
    const ordersAwaitingPayment = dateFilteredOrders.filter((o) => ['pending', 'additional_payment_due'].includes(o.payment_status)).length;
    const ordersToPrepare = dateFilteredOrders.filter((o) => ['confirmed', 'queued', 'printing', 'finishing'].includes(o.status)).length;
    const ordersReadyToShip = dateFilteredOrders.filter((o) => ['ready', 'packed'].includes(o.status)).length;

    // 2. Financial Figures (Separated & Accurate)
    const grossSalesPaise = dateFilteredOrders.reduce((sum, o) => sum + (o.total_paise || 0), 0);
    const paymentsReceivedPaise = dateFilteredOrders
      .filter((o) => o.payment_status === 'captured')
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);
    const refundsPaise = dateFilteredOrders
      .filter((o) => o.payment_status === 'refunded')
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);
    const outstandingBalancesPaise = dateFilteredOrders
      .filter((o) => ['pending', 'additional_payment_due'].includes(o.payment_status))
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);

    // 3. Production Jobs & Equipment
    const jobs = AdminDataService.getProductionJobs();
    const jobsAwaitingAction = jobs.filter((j) => j.status === 'waiting_to_print').length;
    const overdueJobs = jobs.filter((j) => {
      if (!j.dueDate) return false;
      return new Date(j.dueDate).getTime() < now.getTime() && j.status !== 'ready_to_pack';
    }).length;

    // 4. Low-Stock Products
    const lowStockItems: { id: string; name: string; sku: string; stock: number }[] = [];
    rawProducts.forEach((p) => {
      (p.product_variants || []).forEach((v: any) => {
        const qty = v.stock_quantity ?? 0;
        if (qty <= 5) {
          lowStockItems.push({
            id: p.id,
            name: p.name,
            sku: v.sku,
            stock: qty,
          });
        }
      });
    });

    // 5. Custom Requests & Inquiries
    const pendingQuotesCount = rawQuotes.filter((q) => ['submitted', 'under_review'].includes(q.status)).length;
    const inquiries = AdminDataService.getInquiries();
    const unansweredEnquiriesCount = inquiries.filter((i) => i.status === 'new').length;

    const callerRole = auth.profile.role;
    const isOwner = callerRole === 'owner';
    const canSeeOrders = isOwner || callerRole === 'order_manager';
    const canSeeQuotes = isOwner || callerRole === 'order_manager';

    const rawRecentOrders = canSeeOrders
      ? dateFilteredOrders.slice(0, 10).map((row) => serializeOrderFromDb(row))
      : [];

    const recentOrders = isOwner
      ? rawRecentOrders
      : rawRecentOrders.map((o) => maskCustomerPII(o, callerRole));

    const recentQuotes = canSeeQuotes
      ? rawQuotes.slice(0, 5).map((row) => serializeQuoteFromDb(row))
      : [];

    const baseMetrics = {
      newOrdersCount: canSeeOrders ? newOrdersCount : 0,
      ordersAwaitingPayment: isOwner ? ordersAwaitingPayment : 0,
      ordersToPrepare: canSeeOrders ? ordersToPrepare : 0,
      ordersReadyToShip: canSeeOrders ? ordersReadyToShip : 0,
      jobsAwaitingAction,
      overdueJobs,
      pendingQuotesCount: canSeeQuotes ? pendingQuotesCount : 0,
      unansweredEnquiriesCount: canSeeQuotes ? unansweredEnquiriesCount : 0,
      grossSalesPaise: isOwner ? grossSalesPaise : 0,
      paymentsReceivedPaise: isOwner ? paymentsReceivedPaise : 0,
      refundsPaise: isOwner ? refundsPaise : 0,
      outstandingBalancesPaise: isOwner ? outstandingBalancesPaise : 0,
      totalOrdersCount: canSeeOrders ? dateFilteredOrders.length : 0,
      totalProductsCount: rawProducts.length,
      lowStockCount: lowStockItems.length,
    };

    const canSeeJobs = isOwner || callerRole === 'production_operator';
    const canSeeProducts = isOwner || callerRole === 'catalog_editor';

    const recentJobs = canSeeJobs
      ? jobs.slice(0, 8).map((j) => ({
          id: j.id,
          jobNumber: j.jobNumber,
          itemTitle: j.itemTitle,
          variantSku: j.variantSku,
          quantity: j.quantity,
          material: j.material,
          color: j.color,
          status: j.status,
          printerName: j.printerName || j.printerId || 'Unassigned',
        }))
      : [];

    const recentProducts = canSeeProducts
      ? rawProducts.slice(0, 8).map((p) => ({
          id: p.id,
          name: p.title || p.name || 'Untitled 3D Model',
          variantsCount: (p.product_variants || []).length,
          totalStock: (p.product_variants || []).reduce((sum: number, v: any) => sum + (v.stock_quantity ?? 0), 0),
        }))
      : [];

    return NextResponse.json({
      metrics: sanitizeMetricsForRole(baseMetrics, callerRole),
      lowStockItems: (isOwner || callerRole === 'catalog_editor' || callerRole === 'order_manager') ? lowStockItems.slice(0, 10) : [],
      recentOrders,
      recentQuotes,
      recentJobs,
      recentProducts,
      isLiveDb,
      range,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to compile metrics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
