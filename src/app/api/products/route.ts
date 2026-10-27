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
      .select('*, product_variants(*), categories(id, name, slug)', { count: 'exact' });

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

    // 1. Validate variants if provided
    const variantSkuSet = new Set<string>();
    const preparedVariants: Array<Record<string, unknown>> = [];

    if (Array.isArray(variants)) {
      for (let idx = 0; idx < variants.length; idx++) {
        const v = variants[idx];
        const rawSku = String(v.sku || `${cleanSlug.toUpperCase().slice(0, 8)}-${idx + 1}`).trim();
        if (!rawSku) {
          return NextResponse.json({ error: `Variant #${idx + 1} SKU cannot be empty` }, { status: 400 });
        }
        if (variantSkuSet.has(rawSku)) {
          return NextResponse.json({ error: `Duplicate variant SKU '${rawSku}' in submission` }, { status: 400 });
        }
        variantSkuSet.add(rawSku);

        const stock = parseInt(String(v.stockQuantity ?? 0), 10);
        if (isNaN(stock) || stock < 0) {
          return NextResponse.json({ error: `Variant '${rawSku}' stock must be a non-negative integer` }, { status: 400 });
        }

        const priceAdj = Number(v.priceAdjustmentPaise ?? 0);
        if (!Number.isInteger(priceAdj)) {
          return NextResponse.json({ error: `Variant '${rawSku}' price adjustment must be an integer paise amount` }, { status: 400 });
        }

        preparedVariants.push({
          sku: rawSku,
          title: String(v.title || `${v.material || 'PLA'} / ${v.color || 'Standard'}`).trim(),
          material: String(v.material || 'PLA').trim(),
          color: String(v.color || 'Standard').trim(),
          finish: String(v.finish || 'Raw (Layered)').trim(),
          price_adjustment_paise: priceAdj,
          stock_quantity: stock,
          lead_time_days: Math.max(0, parseInt(String(v.leadTimeDays ?? 0), 10) || 0),
          dimensions: v.dimensions || { length_mm: 100, width_mm: 100, height_mm: 100 },
          weight_grams: Math.max(0, Number(v.weightGrams ?? 100)),
          image: v.image ? String(v.image).trim() : null,
          is_active: v.isActive !== false,
        });
      }

      // Check if any SKU already exists in product_variants across the database
      if (preparedVariants.length > 0) {
        const skusToCheck = preparedVariants.map((pv) => pv.sku as string);
        const { data: existingCollisions } = await supabase
          .from('product_variants')
          .select('sku')
          .in('sku', skusToCheck);

        if (existingCollisions && existingCollisions.length > 0) {
          return NextResponse.json(
            { error: `Variant SKU '${existingCollisions[0].sku}' is already in use by another product.` },
            { status: 400 }
          );
        }
      }
    }

    // 2. Insert product record
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
      .select('*, categories(id, name, slug)')
      .single();

    if (prodErr || !newProduct) {
      return NextResponse.json({ error: prodErr?.message || 'Failed to insert product' }, { status: 400 });
    }

    // 3. Insert variants if provided
    const insertedVariants: unknown[] = [];
    if (preparedVariants.length > 0) {
      const variantPayloads = preparedVariants.map((v) => ({
        ...v,
        product_id: newProduct.id,
      }));

      const { data: vars, error: varErr } = await supabase
        .from('product_variants')
        .insert(variantPayloads)
        .select();

      if (varErr) {
        await supabase.from('products').delete().eq('id', newProduct.id);
        return NextResponse.json({ error: varErr.message || 'Failed to insert product variants' }, { status: 400 });
      }

      if (vars) {
        insertedVariants.push(...vars);
      }
    }

    // 4. Record Audit Log
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

