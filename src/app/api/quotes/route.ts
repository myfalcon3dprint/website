import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

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
        { error: 'Missing mandatory quote request fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    if (supabase) {
      const { data, error } = await supabase.from('quotes').insert([
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
      ]).select().single();

      if (error) {
        console.error('Supabase quote insert error:', error);
      }

      return NextResponse.json({
        success: true,
        referenceNumber,
        dbId: data?.id,
        savedToDatabase: !error,
      });
    }

    return NextResponse.json({
      success: true,
      referenceNumber,
      savedToDatabase: false,
      message: 'Quote stored in local state (Supabase credentials not configured in .env.local)',
    });
  } catch (error: unknown) {
    console.error('API quotes error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
