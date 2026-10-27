import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient, recordAuditLog } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

export async function GET(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners and Order Managers may view shipping operations.' }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const orderId = searchParams.get('orderId');

    const supabase = getSupabaseAdminClient();

    // 1. If requesting a printable packing slip for a specific order
    if (view === 'packing_slip' && orderId) {
      let order = null;
      if (supabase) {
        const { data: dbOrder } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single();
        if (dbOrder) order = dbOrder;
      }

      const settings = AdminDataService.getSettings();

      return NextResponse.json({
        order,
        storeInfo: settings.branding,
      });
    }

    // 2. Fetch shipping zones
    let zones = AdminDataService.getShippingZones();
    if (supabase) {
      const { data: dbZones } = await supabase
        .from('shipping_zones')
        .select('*')
        .order('sort_order', { ascending: true });
      if (dbZones && dbZones.length > 0) {
        zones = dbZones.map((z) => ({
          id: z.id,
          name: z.name,
          description: z.description,
          postalCodePrefixes: z.postal_code_prefixes || [],
          isAllIndia: Boolean(z.is_all_india),
          baseFeePaise: z.base_fee_paise,
          freeShippingThresholdPaise: z.free_shipping_threshold_paise,
          estimatedDaysMin: z.estimated_days_min,
          estimatedDaysMax: z.estimated_days_max,
          codAvailable: Boolean(z.cod_available),
          isActive: Boolean(z.is_active),
          sortOrder: z.sort_order,
        }));
      }
    }

    // 3. Fetch orders ready or packed for dispatch
    let readyOrders: unknown[] = [];
    if (supabase) {
      const { data: ords } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .in('status', ['ready', 'packed'])
        .order('created_at', { ascending: true });
      if (ords) readyOrders = ords;
    }

    return NextResponse.json({
      zones,
      readyOrders,
      shippingPolicy: AdminDataService.getSettings().shippingPolicy,
      supportedCouriers: [
        { id: 'delhivery', name: 'Delhivery Surface & Air Express', trackingUrl: 'https://www.delhivery.com/track/package/' },
        { id: 'bluedart', name: 'Blue Dart Aviation Express', trackingUrl: 'https://www.bluedart.com/tracking/' },
        { id: 'dtdc', name: 'DTDC Courier & Cargo', trackingUrl: 'https://www.dtdc.in/tracking.asp?id=' },
        { id: 'indiapost', name: 'India Post Speed Post', trackingUrl: 'https://www.indiapost.gov.in/_layouts/15/dpt.cpt.ui/pinsearch.aspx' },
        { id: 'porter', name: 'Porter / Local Nashik City Dispatch', trackingUrl: '' },
        { id: 'pickup', name: 'Customer Self-Pickup (Studio Workshop)', trackingUrl: '' },
      ],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve shipping operations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { action } = body;

    const supabase = getSupabaseAdminClient();

    // Action A: Assign courier and dispatch an order
    if (action === 'dispatch_order') {
      const { orderId, courierName, trackingNumber, trackingLink, dispatchDate, notes } = body;
      if (!orderId || !courierName || !trackingNumber) {
        return NextResponse.json({ error: 'orderId, courierName, and trackingNumber are required' }, { status: 400 });
      }

      if (supabase) {
        const { data: currentOrder } = await supabase.from('orders').select('*').eq('id', orderId).single();
        const existingHistory = Array.isArray(currentOrder?.status_history) ? currentOrder.status_history : [];

        const newHistory = [
          ...existingHistory,
          {
            status: 'shipped',
            timestamp: new Date().toISOString(),
            note: `Dispatched via ${courierName}. Tracking: ${trackingNumber}. ${notes || ''}`.trim(),
            staffName: auth.profile.full_name,
          },
        ];

        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'shipped',
            tracking_number: trackingNumber,
            status_history: newHistory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (updateError) {
          throw new Error(`Database error marking order shipped: ${updateError.message}`);
        }
      }

      try {
        await recordAuditLog({
          staffUserId: auth.user.id,
          staffName: auth.profile.full_name,
          staffRole: auth.profile.role,
          action: 'DISPATCH_ORDER',
          entityType: 'shipping',
          entityId: orderId,
          newState: { courierName, trackingNumber, trackingLink, dispatchDate },
          notes: `Dispatched order with courier ${courierName} tracking ${trackingNumber}`,
        });
      } catch {
        AdminDataService.recordAudit({
          staffUserId: auth.user.id,
          staffName: auth.profile.full_name,
          staffRole: auth.profile.role,
          action: 'DISPATCH_ORDER',
          entityType: 'shipping',
          entityId: orderId,
          newState: { courierName, trackingNumber, trackingLink, dispatchDate },
          notes: `Dispatched order with courier ${courierName} tracking ${trackingNumber}`,
        });
      }

      return NextResponse.json({
        success: true,
        orderId,
        status: 'shipped',
        trackingNumber,
      });
    }

    // Action B: Create a new shipping zone
    if (action === 'create_zone') {
      const { name, description, postalCodePrefixes, isAllIndia, baseFeePaise, freeShippingThresholdPaise, estimatedDaysMin, estimatedDaysMax, codAvailable } = body;
      if (!name || typeof baseFeePaise !== 'number') {
        return NextResponse.json({ error: 'Zone name and base fee in paise are required' }, { status: 400 });
      }

      const newZone = AdminDataService.addShippingZone({
        name,
        description: description || '',
        postalCodePrefixes: postalCodePrefixes || [],
        isAllIndia: Boolean(isAllIndia),
        baseFeePaise,
        freeShippingThresholdPaise: freeShippingThresholdPaise || null,
        estimatedDaysMin: estimatedDaysMin || 2,
        estimatedDaysMax: estimatedDaysMax || 5,
        codAvailable: codAvailable !== false,
        isActive: true,
        sortOrder: 10,
      });

      if (supabase) {
        await supabase.from('shipping_zones').insert([
          {
            id: newZone.id,
            name: newZone.name,
            description: newZone.description,
            postal_code_prefixes: newZone.postalCodePrefixes,
            is_all_india: newZone.isAllIndia,
            base_fee_paise: newZone.baseFeePaise,
            free_shipping_threshold_paise: newZone.freeShippingThresholdPaise,
            estimated_days_min: newZone.estimatedDaysMin,
            estimated_days_max: newZone.estimatedDaysMax,
            cod_available: newZone.codAvailable,
            is_active: newZone.isActive,
            sort_order: newZone.sortOrder,
          },
        ]);
      }

      return NextResponse.json({ success: true, zone: newZone });
    }

    return NextResponse.json({ error: 'Unknown shipping action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Shipping operation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, updates } = body;
    if (!id || !updates) {
      return NextResponse.json({ error: 'Zone ID and updates are required' }, { status: 400 });
    }

    const updated = AdminDataService.updateShippingZone(id, updates);

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase
        .from('shipping_zones')
        .update({
          name: updates.name,
          description: updates.description,
          base_fee_paise: updates.baseFeePaise,
          free_shipping_threshold_paise: updates.freeShippingThresholdPaise,
          estimated_days_min: updates.estimatedDaysMin,
          estimated_days_max: updates.estimatedDaysMax,
          cod_available: updates.codAvailable,
          is_active: updates.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return NextResponse.json({ success: true, zone: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update shipping zone';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    AdminDataService.deleteShippingZone(id);

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from('shipping_zones').delete().eq('id', id);
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete shipping zone';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
