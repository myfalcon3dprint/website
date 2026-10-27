import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient, recordAuditLog } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

export async function GET() {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners may access email templates' }, { status: auth.status });
  }

  try {
    const templates = AdminDataService.getEmailTemplates();
    return NextResponse.json({
      templates,
      deliveryStatus: {
        provider: 'none_configured',
        mode: 'sandbox_preview_only',
        label: 'Development Sandbox Mode (Outbound Customer Messaging Disabled)',
        isLiveSendingAllowed: false,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve email templates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyStaffSession(['owner']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners may update email templates' }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, subjectTemplate, bodyTemplate, isActive } = body;
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (subjectTemplate !== undefined) updates.subjectTemplate = subjectTemplate;
    if (bodyTemplate !== undefined) updates.bodyTemplate = bodyTemplate;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = AdminDataService.updateEmailTemplate(id, updates);

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase
        .from('email_templates')
        .update({
          subject_template: subjectTemplate,
          body_template: bodyTemplate,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    try {
      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: 'UPDATE_EMAIL_TEMPLATE',
        entityType: 'system',
        entityId: id,
        newState: updates,
        notes: `Updated template ${id}`,
      });
    } catch {
      AdminDataService.recordAudit({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: 'UPDATE_EMAIL_TEMPLATE',
        entityType: 'system',
        entityId: id,
        newState: updates,
        notes: `Updated template ${id}`,
      });
    }

    return NextResponse.json({ success: true, template: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update email template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
