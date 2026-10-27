import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

export async function GET(request: NextRequest) {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners may access financial and sales reports' }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // 'today', '7d', '30d', 'all'
    const format = searchParams.get('format'); // 'json' or 'csv'
    const reportType = searchParams.get('report') || 'sales'; // 'sales', 'products', 'inventory', 'production'

    const supabase = getSupabaseAdminClient();

    // 1. Fetch live orders & products
    let orders: any[] = [];
    let products: any[] = [];

    if (supabase) {
      const { data: dbOrders } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      if (dbOrders && dbOrders.length > 0) orders = dbOrders;

      const { data: dbProducts } = await supabase.from('products').select('*, product_variants(*)');
      if (dbProducts && dbProducts.length > 0) products = dbProducts;
    }

    if (orders.length === 0) {
      const storeOrders = AdminDataService.getOrders();
      orders = storeOrders.map((o) => ({
        id: o.id,
        order_number: o.orderNumber,
        customer_name: o.customerName,
        customer_email: o.customerEmail,
        customer_phone: o.customerPhone,
        total_paise: o.totalPaise,
        payment_status: o.paymentStatus,
        status: o.status,
        created_at: o.createdAt,
        order_items: (o.items || []).map((i) => ({
          product_title: i.productTitle,
          variant_sku: i.variantSku,
          quantity: i.quantity,
          total_paise: i.totalPricePaise,
        })),
      }));
    }

    if (products.length === 0) {
      products = [
        { id: 'prod-1', title: 'Precision Planetary Gearbox Kit', product_variants: [{ stock_quantity: 12 }] },
        { id: 'prod-2', title: 'Aerospace Cable Mounting Bracket', product_variants: [{ stock_quantity: 3 }] },
        { id: 'prod-3', title: 'Parametric Voronoi Mood Lamp', product_variants: [{ stock_quantity: 4 }] },
        { id: 'prod-4', title: 'Heavy Duty Cable Chain Kit', product_variants: [{ stock_quantity: 15 }] },
      ];
    }

    // Filter by date range
    const now = new Date();
    const filteredOrders = orders.filter((o) => {
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

    // 2. Financial Aggregates
    const grossSalesPaise = filteredOrders.reduce((sum, o) => sum + (o.total_paise || 0), 0);
    const paymentsReceivedPaise = filteredOrders
      .filter((o) => o.payment_status === 'captured')
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);
    const refundsPaise = filteredOrders
      .filter((o) => o.payment_status === 'refunded')
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);
    const pendingBalancePaise = filteredOrders
      .filter((o) => ['pending', 'additional_payment_due'].includes(o.payment_status))
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);

    const totalOrdersCount = filteredOrders.length;
    const avgOrderValuePaise = totalOrdersCount > 0 ? Math.round(grossSalesPaise / totalOrdersCount) : 0;

    // 3. Product Performance
    const productSalesMap = new Map<string, { title: string; sku: string; unitsSold: number; revenuePaise: number }>();
    filteredOrders.forEach((o) => {
      (o.order_items || []).forEach((item: any) => {
        const key = item.variant_sku || item.product_title;
        const current = productSalesMap.get(key) || {
          title: item.product_title,
          sku: item.variant_sku,
          unitsSold: 0,
          revenuePaise: 0,
        };
        current.unitsSold += item.quantity || 1;
        current.revenuePaise += item.total_paise || 0;
        productSalesMap.set(key, current);
      });
    });

    const topSellingProducts = Array.from(productSalesMap.values()).sort((a, b) => b.revenuePaise - a.revenuePaise);

    // 4. Inventory Overview
    let totalPhysicalStock = 0;
    let lowStockCount = 0;
    products.forEach((p) => {
      (p.product_variants || []).forEach((v: any) => {
        const qty = v.stock_quantity || 0;
        totalPhysicalStock += qty;
        if (qty <= 5) lowStockCount += 1;
      });
    });

    // 5. Production & Equipment Turnaround
    const jobs = AdminDataService.getProductionJobs();
    const completedJobs = jobs.filter((j) => j.status === 'ready_to_pack');
    const failedQcJobs = jobs.filter((j) => j.status === 'qc_failed');
    const reprintRate = jobs.length > 0 ? Math.round((failedQcJobs.length / jobs.length) * 100) : 0;

    // CSV Export Handler
    if (format === 'csv') {
      let csvContent = '';
      if (reportType === 'sales') {
        csvContent = 'Order Number,Date,Customer,Phone,Total (INR),Payment Status,Fulfillment Status\n';
        filteredOrders.forEach((o) => {
          const inr = (o.total_paise / 100).toFixed(2);
          csvContent += `"${o.order_number}","${new Date(o.created_at).toLocaleDateString()}","${o.customer_name}","${o.customer_phone || ''}","${inr}","${o.payment_status}","${o.status}"\n`;
        });
      } else if (reportType === 'products') {
        csvContent = 'Product Title,SKU,Units Sold,Revenue (INR)\n';
        topSellingProducts.forEach((p) => {
          const inr = (p.revenuePaise / 100).toFixed(2);
          csvContent += `"${p.title}","${p.sku}","${p.unitsSold}","${inr}"\n`;
        });
      } else {
        csvContent = 'Job Number,Item Title,Variant SKU,Material,Status,Operator,Due Date\n';
        jobs.forEach((j) => {
          csvContent += `"${j.jobNumber}","${j.itemTitle}","${j.variantSku}","${j.material}","${j.status}","${j.operatorName || ''}","${j.dueDate || ''}"\n`;
        });
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="falcon-report-${reportType}-${range}.csv"`,
        },
      });
    }

    return NextResponse.json({
      range,
      financials: {
        grossSalesPaise,
        paymentsReceivedPaise,
        refundsPaise,
        pendingBalancePaise,
        totalOrdersCount,
        avgOrderValuePaise,
      },
      topSellingProducts,
      inventorySummary: {
        totalPhysicalStock,
        lowStockCount,
        totalCatalogProducts: products.length,
      },
      productionSummary: {
        totalJobsCount: jobs.length,
        completedJobsCount: completedJobs.length,
        reprintRatePercent: reprintRate,
        activePrintersCount: AdminDataService.getPrinters().filter((p) => p.status === 'printing').length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
