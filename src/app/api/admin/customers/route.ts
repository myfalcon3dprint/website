import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';
import { CustomerDetail } from '@/lib/types';

export async function GET(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners and Order Managers may view customer records.' }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase().trim();
    const customerId = searchParams.get('customerId');

    const supabase = getSupabaseAdminClient();

    // 1. If fetching specific customer details with order history & CRM notes
    if (customerId) {
      let orders: unknown[] = [];
      let quotes: unknown[] = [];
      let profile: unknown = null;

      if (supabase) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', customerId).single();
        if (p) profile = p;

        const { data: ords } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .or(`user_id.eq.${customerId},customer_email.eq.${(profile as { email?: string })?.email || ''}`)
          .order('created_at', { ascending: false });
        if (ords) orders = ords;

        const { data: q } = await supabase
          .from('quotes')
          .select('*')
          .or(`user_id.eq.${customerId},email.eq.${(profile as { email?: string })?.email || ''}`)
          .order('created_at', { ascending: false });
        if (q) quotes = q;
      }

      const notes = AdminDataService.getCustomerNotes(customerId);

      return NextResponse.json({
        customer: profile,
        orders,
        quotes,
        notes,
      });
    }

    // 2. Fetch customer list aggregated from profiles & orders
    let customers: CustomerDetail[] = [];

    if (supabase) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, user_id, customer_name, customer_email, customer_phone, total_paise, created_at')
        .order('created_at', { ascending: false });

      const customerMap = new Map<string, CustomerDetail>();

      (profiles || []).forEach((p) => {
        customerMap.set(p.email || p.id, {
          id: p.id,
          fullName: p.full_name || 'Customer',
          email: p.email || 'customer@falcon3dprints.com',
          phone: p.phone,
          createdAt: p.created_at || new Date().toISOString(),
          totalOrders: 0,
          totalSpentPaise: 0,
          lastOrderDate: null,
          orders: [],
          quotes: [],
          notes: AdminDataService.getCustomerNotes(p.id),
          marketingConsent: true,
        });
      });

      (allOrders || []).forEach((o) => {
        const key = o.customer_email || o.user_id || o.customer_phone;
        if (!key) return;

        let entry = customerMap.get(key);
        if (!entry) {
          entry = {
            id: o.user_id || `cust-${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
            fullName: o.customer_name || 'Customer',
            email: o.customer_email || 'customer@falcon3dprints.com',
            phone: o.customer_phone,
            createdAt: o.created_at,
            totalOrders: 0,
            totalSpentPaise: 0,
            lastOrderDate: null,
            orders: [],
            quotes: [],
            notes: AdminDataService.getCustomerNotes(o.user_id || key),
            marketingConsent: true,
          };
          customerMap.set(key, entry);
        }

        entry.totalOrders += 1;
        entry.totalSpentPaise += o.total_paise || 0;
        if (!entry.lastOrderDate || new Date(o.created_at) > new Date(entry.lastOrderDate)) {
          entry.lastOrderDate = o.created_at;
        }
      });

      customers = Array.from(customerMap.values());
    } else {
      // Fallback demo customers
      customers = [
        {
          id: 'cust-01',
          fullName: 'Rahul Sharma',
          email: 'rahul.sharma@gmail.com',
          phone: '+91 98230 12345',
          createdAt: '2026-10-10T10:00:00Z',
          totalOrders: 3,
          totalSpentPaise: 449700,
          lastOrderDate: '2026-10-17T12:00:00Z',
          orders: [],
          quotes: [],
          notes: AdminDataService.getCustomerNotes('cust-01'),
          marketingConsent: true,
        },
        {
          id: 'cust-02',
          fullName: 'Pooja Patil',
          email: 'pooja.patil@outlook.com',
          phone: '+91 98500 67890',
          createdAt: '2026-10-12T14:30:00Z',
          totalOrders: 1,
          totalSpentPaise: 149900,
          lastOrderDate: '2026-10-16T15:00:00Z',
          orders: [],
          quotes: [],
          notes: [],
          marketingConsent: true,
        },
        {
          id: 'cust-03',
          fullName: 'Vikram Joshi',
          email: 'vikram.j@techstart.in',
          phone: '+91 97654 32109',
          createdAt: '2026-10-14T09:00:00Z',
          totalOrders: 2,
          totalSpentPaise: 299800,
          lastOrderDate: '2026-10-18T07:15:00Z',
          orders: [],
          quotes: [],
          notes: [],
          marketingConsent: false,
        },
      ];
    }

    if (search) {
      customers = customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          (c.phone && c.phone.includes(search))
      );
    }

    return NextResponse.json({ customers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve customers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners and Order Managers may add customer notes.' }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { customerId, note } = body;
    if (!customerId || !note) {
      return NextResponse.json({ error: 'customerId and note are required' }, { status: 400 });
    }

    const savedNote = AdminDataService.addCustomerNote(customerId, auth.profile.full_name, note);

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from('customer_notes').insert([
        {
          id: savedNote.id,
          customer_id: customerId,
          staff_user_id: auth.user.id,
          staff_name: auth.profile.full_name,
          note,
        },
      ]);
    }

    return NextResponse.json({ success: true, note: savedNote });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record customer note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
