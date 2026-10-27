import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient, recordAuditLog } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

export async function GET(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Studio Owners and Order Managers may view customer enquiries.' }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'bulk_quote' or 'contact'
    const status = searchParams.get('status');

    let inquiries = AdminDataService.getInquiries();

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      let query = supabase.from('customer_inquiries').select('*').order('created_at', { ascending: false });
      if (type && type !== 'all') query = query.eq('inquiry_type', type);
      if (status && status !== 'all') query = query.eq('status', status);

      const { data: dbInq } = await query;
      if (dbInq && dbInq.length > 0) {
        inquiries = dbInq.map((i) => ({
          id: i.id,
          inquiryType: i.inquiry_type,
          customerName: i.customer_name,
          customerEmail: i.customer_email,
          customerPhone: i.customer_phone,
          companyName: i.company_name,
          subject: i.subject,
          message: i.message,
          quantityRequested: i.quantity_requested,
          targetDeliveryDate: i.target_delivery_date,
          estimatedBudgetPaise: i.estimated_budget_paise,
          status: i.status,
          priority: i.priority,
          assignedTo: i.assigned_to,
          internalNotes: i.internal_notes,
          followUpDate: i.follow_up_date,
          convertedOrderId: i.converted_order_id,
          convertedQuoteId: i.converted_quote_id,
          createdAt: i.created_at,
          updatedAt: i.updated_at,
        }));
      }
    }

    if (type && type !== 'all') {
      inquiries = inquiries.filter((i) => i.inquiryType === type);
    }
    if (status && status !== 'all') {
      inquiries = inquiries.filter((i) => i.status === status);
    }

    return NextResponse.json({ inquiries });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve enquiries';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inquiryType, customerName, customerEmail, customerPhone, companyName, subject, message, quantityRequested, targetDeliveryDate, estimatedBudgetPaise } = body;

    if (!customerName || !customerEmail || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    const newInquiry = AdminDataService.addInquiry({
      inquiryType: inquiryType || 'contact',
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      subject,
      message,
      quantityRequested: quantityRequested ? parseInt(quantityRequested, 10) : undefined,
      targetDeliveryDate,
      estimatedBudgetPaise: estimatedBudgetPaise ? parseInt(estimatedBudgetPaise, 10) : undefined,
      status: 'new',
      priority: 'normal',
    });

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from('customer_inquiries').insert([
        {
          id: newInquiry.id,
          inquiry_type: newInquiry.inquiryType,
          customer_name: newInquiry.customerName,
          customer_email: newInquiry.customerEmail,
          customer_phone: newInquiry.customerPhone,
          company_name: newInquiry.companyName,
          subject: newInquiry.subject,
          message: newInquiry.message,
          quantity_requested: newInquiry.quantityRequested,
          target_delivery_date: newInquiry.targetDeliveryDate,
          estimated_budget_paise: newInquiry.estimatedBudgetPaise,
          status: 'new',
          priority: 'normal',
        },
      ]);
    }

    return NextResponse.json({ success: true, inquiry: newInquiry });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit inquiry';
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
    const { id, updates, action } = body;
    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    const updated = AdminDataService.updateInquiry(id, updates || {});

    const supabase = getSupabaseAdminClient();
    if (supabase && updates) {
      await supabase
        .from('customer_inquiries')
        .update({
          status: updates.status,
          priority: updates.priority,
          internal_notes: updates.internalNotes,
          follow_up_date: updates.followUpDate,
          assigned_to: updates.assignedTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    try {
      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: action ? `INQUIRY_${action.toUpperCase()}` : 'UPDATE_INQUIRY',
        entityType: 'user',
        entityId: id,
        newState: updates,
        notes: `Updated inquiry ${id}`,
      });
    } catch {
      AdminDataService.recordAudit({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: action ? `INQUIRY_${action.toUpperCase()}` : 'UPDATE_INQUIRY',
        entityType: 'user',
        entityId: id,
        newState: updates,
        notes: `Updated inquiry ${id}`,
      });
    }

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update inquiry';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
