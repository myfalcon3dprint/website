import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient, recordAuditLog } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

export async function GET() {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners may view administrative settings and integrations.' }, { status: auth.status });
  }

  try {
    const supabase = getSupabaseAdminClient();
    let settings = AdminDataService.getSettings();

    if (supabase) {
      const { data: dbSettings } = await supabase.from('store_settings').select('*');
      if (dbSettings && dbSettings.length > 0) {
        dbSettings.forEach((row) => {
          if (row.key === 'branding') settings.branding = row.value;
          if (row.key === 'appearance') settings.appearance = row.value;
          if (row.key === 'operations') settings.operations = row.value;
          if (row.key === 'shipping_policy') settings.shippingPolicy = row.value;
        });
      }
    }

    // Health indicators (read-only, never expose raw secrets)
    const integrations = {
      database: {
        status: supabase ? 'connected' : 'local_store',
        label: supabase ? 'PostgreSQL Database Connected' : 'Local Workshop Engine Active',
        isHealthy: true,
      },
      storage: {
        status: process.env.R2_CAD_BUCKET_NAME ? 'connected' : 'local_storage',
        label: process.env.R2_CAD_BUCKET_NAME ? 'Cloudflare R2 Object Storage' : 'Unified Supabase / Local Storage',
        isHealthy: true,
      },
      payments: {
        status: process.env.RAZORPAY_KEY_ID ? 'test_mode' : 'simulated',
        label: process.env.RAZORPAY_KEY_ID ? 'Razorpay Test Sandbox' : 'Sandbox Simulated Payments',
        isHealthy: true,
      },
      notifications: {
        status: 'preview_only',
        label: 'Email & WhatsApp Notifications (Development Preview Only)',
        isHealthy: true,
      },
    };

    return NextResponse.json({
      settings,
      integrations,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only studio owners may modify store settings' }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { section, data, reason } = body;

    if (!section || !data) {
      return NextResponse.json({ error: 'Section and data parameters are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const oldSettings = AdminDataService.getSettings();
    let oldVal: unknown = null;
    let newVal: unknown = null;

    if (section === 'branding') {
      oldVal = oldSettings.branding;
      newVal = AdminDataService.updateBranding(data);
      if (supabase) {
        await supabase.from('store_settings').upsert({
          key: 'branding',
          category: 'branding',
          value: newVal,
          updated_by: auth.user.id,
          updated_at: new Date().toISOString(),
        });
      }
    } else if (section === 'appearance') {
      oldVal = oldSettings.appearance;
      newVal = AdminDataService.updateAppearance(data);
      if (supabase) {
        await supabase.from('store_settings').upsert({
          key: 'appearance',
          category: 'appearance',
          value: newVal,
          updated_by: auth.user.id,
          updated_at: new Date().toISOString(),
        });
      }
    } else if (section === 'operations') {
      oldVal = oldSettings.operations;
      newVal = AdminDataService.updateOperations(data);
      if (supabase) {
        await supabase.from('store_settings').upsert({
          key: 'operations',
          category: 'operations',
          value: newVal,
          updated_by: auth.user.id,
          updated_at: new Date().toISOString(),
        });
      }
    } else if (section === 'shipping_policy') {
      oldVal = oldSettings.shippingPolicy;
      newVal = AdminDataService.updateShippingPolicy(data);
      if (supabase) {
        await supabase.from('store_settings').upsert({
          key: 'shipping_policy',
          category: 'shipping',
          value: newVal,
          updated_by: auth.user.id,
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      return NextResponse.json({ error: `Unknown settings section: ${section}` }, { status: 400 });
    }

    try {
      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: `UPDATE_STORE_SETTINGS_${section.toUpperCase()}`,
        entityType: 'settings',
        entityId: section,
        oldState: oldVal as Record<string, unknown>,
        newState: newVal as Record<string, unknown>,
        notes: reason || `Updated store ${section} configuration`,
      });
    } catch {
      AdminDataService.recordAudit({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: `UPDATE_STORE_SETTINGS_${section.toUpperCase()}`,
        entityType: 'settings',
        entityId: section,
        oldState: oldVal as Record<string, unknown>,
        newState: newVal as Record<string, unknown>,
        notes: reason || `Updated store ${section} configuration`,
      });
    }

    return NextResponse.json({
      success: true,
      section,
      settings: AdminDataService.getSettings(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update store settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
