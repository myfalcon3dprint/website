import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession, recordAuditLog } from '@/lib/supabase/server';
import { serializeQuoteFromDb } from '@/lib/serializers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .or(`id.eq.${id},reference_number.eq.${id}`)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
  }

  return NextResponse.json({ quote: serializeQuoteFromDb(data) });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // 1. RBAC Check: Only owner or order_manager may issue price quotations
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      quotedPricePaise,
      estimatedLeadDays,
      adminNotes,
      status,
      lastKnownUpdatedAt,
    } = body;

    // 2. Mandatory Optimistic Concurrency Control (Version check)
    if (!lastKnownUpdatedAt || typeof lastKnownUpdatedAt !== 'string') {
      return NextResponse.json(
        { error: 'Optimistic concurrency control: lastKnownUpdatedAt is mandatory for quote updates.' },
        { status: 400 }
      );
    }

    // 3. Fetch current quote
    const { data: currentQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .or(`id.eq.${id},reference_number.eq.${id}`)
      .single();

    if (fetchError || !currentQuote) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    // 4. Validate financial and manufacturing parameters
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (quotedPricePaise !== undefined) {
      const price = Number(quotedPricePaise);
      if (!Number.isInteger(price) || price <= 0) {
        return NextResponse.json(
          { error: 'Quoted price must be a positive integer in paise (greater than 0).' },
          { status: 400 }
        );
      }
      updates.quoted_price_paise = price;
      updates.status = status || 'quoted';
    }

    if (estimatedLeadDays !== undefined) {
      const leadDays = Number(estimatedLeadDays);
      if (!Number.isInteger(leadDays) || leadDays < 1 || leadDays > 60) {
        return NextResponse.json(
          { error: 'Estimated lead days must be an integer between 1 and 60 days.' },
          { status: 400 }
        );
      }
      updates.estimated_lead_days = leadDays;
    }

    if (adminNotes !== undefined) {
      updates.admin_notes = String(adminNotes).trim();
    }

    if (status && !updates.status) {
      updates.status = status;
    }

    // 5. Attempt atomic single-transaction PostgreSQL stored procedure
    try {
      const { data: rpcQuote, error: rpcErr } = await supabase.rpc(
        'apply_quote_mutation_with_audit',
        {
          p_quote_id: currentQuote.id,
          p_expected_updated_at: lastKnownUpdatedAt,
          p_quoted_price_paise: updates.quoted_price_paise || null,
          p_estimated_lead_days: updates.estimated_lead_days || null,
          p_admin_notes: updates.admin_notes || null,
          p_status: updates.status || null,
          p_staff_user_id: auth.user.id,
          p_staff_name: auth.profile.full_name,
          p_staff_role: auth.profile.role,
        }
      );

      if (!rpcErr && rpcQuote) {
        return NextResponse.json({
          success: true,
          quote: serializeQuoteFromDb(rpcQuote),
        });
      }

      if (rpcErr && rpcErr.message?.includes('Concurrency conflict')) {
        return NextResponse.json({ error: rpcErr.message }, { status: 409 });
      }
    } catch {
      // Fallback to client transactional flow
    }

    // 6. Client fallback with atomic optimistic locking
    const { data: updatedQuotes, error: updateError } = await supabase
      .from('quotes')
      .update(updates)
      .eq('id', currentQuote.id)
      .eq('updated_at', lastKnownUpdatedAt)
      .select('*');

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to update quote' }, { status: 500 });
    }

    if (!updatedQuotes || updatedQuotes.length === 0) {
      const { data: latestQuote } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', currentQuote.id)
        .single();

      return NextResponse.json(
        {
          error: 'Concurrency conflict: Quote was updated by another operator. Please reload before submitting.',
          currentQuote: latestQuote ? serializeQuoteFromDb(latestQuote) : null,
        },
        { status: 409 }
      );
    }

    const updatedQuote = updatedQuotes[0];

    // 7. Record immutable audit log with rollback guarantee on failure
    try {
      await recordAuditLog({
        staffUserId: auth.user.id,
        staffName: auth.profile.full_name,
        staffRole: auth.profile.role,
        action: 'QUOTE_PRICE_ISSUED',
        entityType: 'quote',
        entityId: currentQuote.reference_number || currentQuote.id,
        oldState: {
          status: currentQuote.status,
          quotedPricePaise: currentQuote.quoted_price_paise,
          estimatedLeadDays: currentQuote.estimated_lead_days,
        },
        newState: {
          status: updatedQuote.status,
          quotedPricePaise: updatedQuote.quoted_price_paise,
          estimatedLeadDays: updatedQuote.estimated_lead_days,
        },
        notes: adminNotes || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      });
    } catch (auditErr) {
      // Rollback: revert the quote if audit write fails
      await supabase
        .from('quotes')
        .update({
          quoted_price_paise: currentQuote.quoted_price_paise,
          estimated_lead_days: currentQuote.estimated_lead_days,
          admin_notes: currentQuote.admin_notes,
          status: currentQuote.status,
          updated_at: currentQuote.updated_at,
        })
        .eq('id', currentQuote.id);

      return NextResponse.json(
        { error: 'Audit log write failed: Quote update was rolled back to maintain transactional integrity.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: serializeQuoteFromDb(updatedQuote),
    });
  } catch (err: unknown) {
    console.error('PATCH /api/quotes/[id] error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
