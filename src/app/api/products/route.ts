import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { serializeProductFromDb } from '@/lib/serializers';
import { Product } from '@/lib/types';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30', 10) || 30));

    let query = supabase
      .from('products')
      .select('*, product_variants(*)', { count: 'exact' });

    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: dbProducts, count, error } = await query;

    if (error) {
      console.error('Products API query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped: Product[] = (dbProducts || []).map((p) => serializeProductFromDb(p));
    const totalCount = count ?? mapped.length;

    return NextResponse.json({
      products: mapped,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      isLiveDb: true,
    });
  } catch (err: unknown) {
    console.error('Products API error:', err);
    const message = err instanceof Error ? err.message : 'Failed to retrieve products';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { verifyStaffSession, recordAuditLog } = await import('@/lib/supabase/server');
  const auth = await verifyStaffSession(['owner', 'catalog_editor']);
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
      name,
      slug,
      categoryId,
      shortDescription,
      description,
      basePricePaise,
      availability = 'in_stock',
      images = [],
      features = [],
      specs = {},
      variants = [],
      isPublished = true,
    } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')).trim();
    const numericBasePrice = Number(basePricePaise);
    if (!Number.isInteger(numericBasePrice) || numericBasePrice < 0) {
      return NextResponse.json({ error: 'basePricePaise must be a non-negative integer' }, { status: 400 });
    }

    // 1. Insert product record
    const { data: newProduct, error: prodErr } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        category_id: categoryId || null,
        short_description: shortDescription?.trim() || null,
        description: description?.trim() || null,
        base_price_paise: numericBasePrice,
        availability,
        images: Array.isArray(images) ? images : [],
        features: Array.isArray(features) ? features : [],
        specs: typeof specs === 'object' ? specs : {},
        is_published: Boolean(isPublished),
      })
      .select()
      .single();

    if (prodErr || !newProduct) {
      return NextResponse.json({ error: prodErr?.message || 'Failed to insert product' }, { status: 400 });
    }

    // 2. Insert variants if provided
    const insertedVariants: unknown[] = [];
    if (Array.isArray(variants) && variants.length > 0) {
      const variantPayloads = variants.map((v, idx) => ({
        product_id: newProduct.id,
        sku: v.sku?.trim() || `${cleanSlug.toUpperCase().slice(0, 8)}-${idx + 1}`,
        title: v.title?.trim() || `${v.material || 'PLA'} / ${v.color || 'Standard'}`,
        material: v.material || 'PLA',
        color: v.color || 'Standard',
        finish: v.finish || 'Raw (Layered)',
        price_adjustment_paise: Number.isInteger(Number(v.priceAdjustmentPaise)) ? Number(v.priceAdjustmentPaise) : 0,
        stock_quantity: Math.max(0, parseInt(String(v.stockQuantity ?? 0), 10) || 0),
        lead_time_days: Math.max(0, parseInt(String(v.leadTimeDays ?? 0), 10) || 0),
        dimensions: v.dimensions || { length_mm: 100, width_mm: 100, height_mm: 100 },
        weight_grams: Math.max(0, Number(v.weightGrams ?? 100)),
        is_active: true,
      }));

      const { data: vars, error: varErr } = await supabase
        .from('product_variants')
        .insert(variantPayloads)
        .select();

      if (!varErr && vars) {
        insertedVariants.push(...vars);
      }
    }

    // 3. Record Audit Log
    await recordAuditLog({
      staffUserId: auth.user.id,
      staffName: auth.profile.full_name,
      staffRole: auth.profile.role,
      action: 'PRODUCT_CREATE',
      entityType: 'product',
      entityId: newProduct.id,
      newState: { product: newProduct, variantCount: insertedVariants.length },
      notes: `Created product '${newProduct.name}' with ${insertedVariants.length} variants`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    const fullProduct = {
      ...newProduct,
      product_variants: insertedVariants,
    };

    return NextResponse.json(
      { success: true, product: serializeProductFromDb(fullProduct) },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('POST /api/products error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

