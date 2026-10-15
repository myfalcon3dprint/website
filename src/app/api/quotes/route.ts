import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, verifyStaffSession } from '@/lib/supabase/server';
import { serializeQuoteFromDb } from '@/lib/serializers';
import { CustomQuoteRequest } from '@/lib/types';

export async function GET(request: NextRequest) {
  // Defense-in-depth: Staff authorization required to view quotes
  const auth = await verifyStaffSession(['owner', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    let query = supabase.from('quotes').select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `reference_number.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,file_name.ilike.%${search}%`
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to query quotes from database:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const quotes: CustomQuoteRequest[] = (data || []).map((row) => serializeQuoteFromDb(row));
    const totalCount = count ?? quotes.length;

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      isLiveDb: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve quotes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      referenceNumber,
      fullName,
      email,
      phone,
      fileName,
      fileSizeBytes,
      storagePath,
      dimensionsMm,
      materialPreference,
      colorPreference,
      infillPercentage,
      quantity,
      customerNotes,
    } = body;

    if (!referenceNumber || !fullName || !email || !phone || !fileName) {
      return NextResponse.json(
        { error: 'Missing mandatory quote request fields (referenceNumber, fullName, email, phone, fileName)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('quotes')
        .insert([
          {
            reference_number: referenceNumber,
            full_name: fullName,
            email,
            phone,
            file_name: fileName,
            file_size_bytes: fileSizeBytes || 1000000,
            storage_path: storagePath || null,
            dimensions_mm: dimensionsMm || { x: 100, y: 100, z: 80 },
            material_preference: materialPreference || 'PLA',
            color_preference: colorPreference || 'Standard Studio Grey/Black',
            infill_percentage: infillPercentage || 20,
            quantity: quantity || 1,
            customer_notes: customerNotes || null,
            status: 'submitted',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase quote insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        referenceNumber,
        dbId: data?.id,
        savedToDatabase: true,
      });
    }

    return NextResponse.json({
      success: true,
      referenceNumber,
      savedToDatabase: false,
      message: 'Quote stored in simulation mode (Supabase credentials unconfigured)',
    });
  } catch (error: unknown) {
    console.error('API quotes error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
