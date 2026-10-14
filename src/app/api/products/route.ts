import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { INITIAL_PRODUCTS } from '@/lib/mock-data';
import { Product } from '@/lib/types';

export async function GET() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ products: INITIAL_PRODUCTS, isLiveDb: false });
  }

  try {
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error || !dbProducts || dbProducts.length === 0) {
      return NextResponse.json({ products: INITIAL_PRODUCTS, isLiveDb: false });
    }

    // Map database shape to domain Product type
    const mapped: Product[] = dbProducts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.name,
      subtitle: p.short_description || '',
      category: p.category_id || 'Planters & Decor',
      description: p.description || '',
      features: p.features || [],
      specs: p.specs || {
        printTechnology: 'FDM',
        layerHeightMm: 0.16,
        infillPercentage: 20,
        foodSafe: false,
        heatResistanceC: 60,
      },
      stockType: p.availability === 'in_stock' ? 'ready_stock' : 'made_to_order',
      basePricePaise: p.base_price_paise,
      images: p.images || [],
      variants: (p.product_variants || []).map((v: {
        id: string;
        sku: string;
        title: string;
        material: string;
        color: string;
        finish: string;
        price_adjustment_paise: number;
        dimensions?: { lengthMm: number; widthMm: number; heightMm: number };
        weight_grams?: number;
        stock_quantity: number;
        lead_time_days: number;
        image?: string;
      }) => ({
        id: v.id,
        sku: v.sku,
        title: v.title,
        material: v.material,
        color: v.color,
        finish: v.finish,
        pricePaise: p.base_price_paise + (v.price_adjustment_paise || 0),
        dimensions: v.dimensions || { lengthMm: 100, widthMm: 100, heightMm: 100 },
        weightGrams: v.weight_grams || 100,
        stockQuantity: v.stock_quantity,
        leadTimeDays: v.lead_time_days,
        image: v.image,
      })),
      featured: true,
      rating: Number(p.rating) || 5.0,
      reviewCount: p.review_count || 0,
    }));

    return NextResponse.json({ products: mapped, isLiveDb: true });
  } catch (err: unknown) {
    console.error('Products API error:', err);
    return NextResponse.json({ products: INITIAL_PRODUCTS, isLiveDb: false });
  }
}
