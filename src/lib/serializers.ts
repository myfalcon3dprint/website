import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductVariant,
  CustomQuoteRequest,
  ShippingAddress,
  MaterialType,
  FinishType,
  StockType,
} from './types';

/**
 * Validates and maps a database row (snake_case) to the domain Order model (camelCase).
 * Handles missing or malformed child fields defensively.
 */
export function serializeOrderFromDb(row: Record<string, unknown>): Order {
  const shipping = (row.shipping_address as Record<string, unknown>) || {};
  const shippingAddress: ShippingAddress = {
    fullName: String(shipping.fullName || shipping.full_name || row.customer_name || 'Customer'),
    phone: String(shipping.phone || row.customer_phone || ''),
    addressLine1: String(shipping.addressLine1 || shipping.address_line1 || 'Address Line 1'),
    addressLine2: shipping.addressLine2 || shipping.address_line2 ? String(shipping.addressLine2 || shipping.address_line2) : undefined,
    city: String(shipping.city || 'Nashik'),
    state: String(shipping.state || 'Maharashtra'),
    pinCode: String(shipping.pinCode || shipping.pin_code || '422001'),
  };

  const rawItems = Array.isArray(row.order_items)
    ? row.order_items
    : Array.isArray(row.items)
    ? row.items
    : [];

  const items: OrderItem[] = rawItems.map((item: Record<string, unknown>) => serializeOrderItemFromDb(item));

  const rawHistory = Array.isArray(row.status_history) ? row.status_history : [];
  const statusHistory = rawHistory.map((h: Record<string, unknown>) => ({
    status: (h.status as OrderStatus) || 'confirmed',
    timestamp: String(h.timestamp || new Date().toISOString()),
    note: String(h.note || ''),
  }));

  return {
    id: String(row.id || ''),
    orderNumber: String(row.order_number || row.orderNumber || 'FAL-ORD-UNKNOWN'),
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.updatedAt || row.created_at || new Date().toISOString()),
    customerName: String(row.customer_name || row.customerName || 'Customer'),
    customerEmail: String(row.customer_email || row.customerEmail || ''),
    customerPhone: String(row.customer_phone || row.customerPhone || ''),
    shippingAddress,
    items,
    subtotalPaise: Number(row.subtotal_paise ?? row.subtotalPaise ?? 0),
    shippingPaise: Number(row.shipping_paise ?? row.shippingPaise ?? 0),
    taxPaise: Number(row.tax_paise ?? row.taxPaise ?? 0),
    totalPaise: Number(row.total_paise ?? row.totalPaise ?? 0),
    paymentStatus: (row.payment_status as PaymentStatus) || (row.paymentStatus as PaymentStatus) || 'pending',
    paymentMethod: (row.payment_method as Order['paymentMethod']) || (row.paymentMethod as Order['paymentMethod']) || 'Razorpay UPI/Card',
    razorpayPaymentId: row.razorpay_payment_id ? String(row.razorpay_payment_id) : row.razorpayPaymentId ? String(row.razorpayPaymentId) : undefined,
    status: (row.status as OrderStatus) || 'confirmed',
    trackingNumber: row.tracking_number ? String(row.tracking_number) : row.trackingNumber ? String(row.trackingNumber) : undefined,
    statusHistory: statusHistory.length > 0 ? statusHistory : [
      { status: (row.status as OrderStatus) || 'confirmed', timestamp: String(row.created_at || new Date().toISOString()), note: 'Order initialized' }
    ],
    refundStatus: (row.refund_status as Order['refundStatus']) || (row.refundStatus as Order['refundStatus']) || 'none',
    refundNotes: row.refund_notes ? String(row.refund_notes) : row.refundNotes ? String(row.refundNotes) : undefined,
    version: row.version !== undefined ? Number(row.version) : undefined,
  };
}

export function serializeOrderItemFromDb(item: Record<string, unknown>): OrderItem {
  return {
    id: String(item.id || ''),
    productId: String(item.product_id || item.productId || ''),
    productTitle: String(item.product_title || item.productTitle || 'Custom 3D Print'),
    variantSku: String(item.variant_sku || item.variantSku || 'FAL-SKU'),
    variantDetails: String(item.variant_details || item.variantDetails || 'Standard Configuration'),
    unitPricePaise: Number(item.unit_price_paise ?? item.unitPricePaise ?? 0),
    quantity: Number(item.quantity ?? 1),
    totalPricePaise: Number(item.total_paise ?? item.totalPricePaise ?? 0),
    stockType: (item.stock_type as StockType) || (item.stockType as StockType) || 'ready_stock',
    itemStatus: (item.production_status as OrderStatus) || (item.itemStatus as OrderStatus) || 'confirmed',
  };
}

export function serializeQuoteFromDb(row: Record<string, unknown>): CustomQuoteRequest {
  const dims = (row.dimensions_mm as Record<string, unknown>) || {};
  return {
    id: String(row.id || ''),
    referenceNumber: String(row.reference_number || row.referenceNumber || 'RFQ-FAL-UNKNOWN'),
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.updatedAt || row.created_at || new Date().toISOString()),
    fullName: String(row.full_name || row.fullName || 'Client'),
    phone: String(row.phone || ''),
    email: String(row.email || ''),
    fileName: String(row.file_name || row.fileName || 'model.stl'),
    fileSizeBytes: Number(row.file_size_bytes ?? row.fileSizeBytes ?? 0),
    dimensionsMm: {
      x: Number(dims.x ?? 100),
      y: Number(dims.y ?? 100),
      z: Number(dims.z ?? 80),
    },
    materialPreference: (row.material_preference as MaterialType) || (row.materialPreference as MaterialType) || 'PLA',
    colorPreference: String(row.color_preference || row.colorPreference || 'Standard Studio Grey/Black'),
    infillPercentage: Number(row.infill_percentage ?? row.infillPercentage ?? 20),
    quantity: Number(row.quantity ?? 1),
    customerNotes: row.customer_notes ? String(row.customer_notes) : row.customerNotes ? String(row.customerNotes) : undefined,
    storagePath: row.storage_path ? String(row.storage_path) : row.storagePath ? String(row.storagePath) : undefined,
    status: (row.status as CustomQuoteRequest['status']) || 'submitted',
    quotedPricePaise: row.quoted_price_paise !== null && row.quoted_price_paise !== undefined
      ? Number(row.quoted_price_paise)
      : row.quotedPricePaise !== undefined
      ? Number(row.quotedPricePaise)
      : undefined,
    estimatedLeadDays: row.estimated_lead_days !== null && row.estimated_lead_days !== undefined
      ? Number(row.estimated_lead_days)
      : row.estimatedLeadDays !== undefined
      ? Number(row.estimatedLeadDays)
      : undefined,
    adminNotes: row.admin_notes ? String(row.admin_notes) : row.adminNotes ? String(row.adminNotes) : undefined,
  };
}

export function serializeProductFromDb(p: Record<string, unknown>): Product {
  const basePricePaise = Number(p.base_price_paise ?? p.basePricePaise ?? 0);
  const rawVariants = Array.isArray(p.product_variants)
    ? p.product_variants
    : Array.isArray(p.variants)
    ? p.variants
    : [];

  const variants: ProductVariant[] = rawVariants.map((v: Record<string, unknown>) =>
    serializeVariantFromDb(v, basePricePaise)
  );

  const rawSpecs = (p.specs as Record<string, unknown>) || {};
  return {
    id: String(p.id || ''),
    slug: String(p.slug || ''),
    title: String(p.name || p.title || 'Studio Product'),
    subtitle: String(p.short_description || p.subtitle || ''),
    category: ((p.categories as Record<string, unknown>)?.name as string) || (p.category_name as string) || (p.category as string) || 'Planters & Decor',
    categoryId: p.category_id ? String(p.category_id) : p.categoryId ? String(p.categoryId) : ((p.categories as Record<string, unknown>)?.id ? String((p.categories as Record<string, unknown>).id) : undefined),
    isPublished: p.is_published !== undefined ? Boolean(p.is_published) : p.isPublished !== undefined ? Boolean(p.isPublished) : true,
    archivedAt: p.deleted_at ? String(p.deleted_at) : p.archivedAt ? String(p.archivedAt) : null,
    description: String(p.description || ''),
    features: Array.isArray(p.features) ? p.features.map(String) : [],
    specs: {
      printTechnology: (rawSpecs.printTechnology as 'FDM' | 'SLA Resin') || 'FDM',
      layerHeightMm: Number(rawSpecs.layerHeightMm ?? 0.16),
      infillPercentage: Number(rawSpecs.infillPercentage ?? 20),
      foodSafe: Boolean(rawSpecs.foodSafe),
      heatResistanceC: Number(rawSpecs.heatResistanceC ?? 60),
      includedItems: Array.isArray(rawSpecs.includedItems) ? rawSpecs.includedItems.map(String) : undefined,
      careInstructions: rawSpecs.careInstructions ? String(rawSpecs.careInstructions) : (p.care_info ? String(p.care_info) : undefined),
      dispatchInfo: rawSpecs.dispatchInfo ? String(rawSpecs.dispatchInfo) : undefined,
    },
    includedItems: Array.isArray(rawSpecs.includedItems)
      ? rawSpecs.includedItems.map(String)
      : Array.isArray(p.included_items)
      ? (p.included_items as unknown[]).map(String)
      : undefined,
    careInstructions: p.care_info ? String(p.care_info) : (rawSpecs.careInstructions ? String(rawSpecs.careInstructions) : undefined),
    dispatchInfo: rawSpecs.dispatchInfo ? String(rawSpecs.dispatchInfo) : (p.dispatch_info ? String(p.dispatch_info) : undefined),
    stockType: (p.availability === 'in_stock' || p.stockType === 'ready_stock') ? 'ready_stock' : 'made_to_order',
    basePricePaise,
    images: Array.isArray(p.images) ? p.images.map(String) : [],
    variants,
    featured: Boolean(p.is_published ?? p.featured ?? true),
    rating: Number(p.rating ?? 5.0),
    reviewCount: Number(p.review_count ?? p.reviewCount ?? 0),
    updatedAt: String(p.updated_at || p.updatedAt || p.created_at || new Date().toISOString()),
    version: p.version !== undefined ? Number(p.version) : undefined,
  };
}

export function serializeVariantFromDb(v: Record<string, unknown>, basePricePaise: number): ProductVariant {
  const adjustment = Number(v.price_adjustment_paise ?? 0);
  const explicitPrice = v.pricePaise !== undefined ? Number(v.pricePaise) : undefined;
  const dims = (v.dimensions as Record<string, unknown>) || {};

  return {
    id: String(v.id || ''),
    sku: String(v.sku || ''),
    title: String(v.title || ''),
    material: (v.material as MaterialType) || 'PLA',
    color: String(v.color || 'Standard'),
    finish: (v.finish as FinishType) || 'Raw (Layered)',
    pricePaise: explicitPrice !== undefined ? explicitPrice : (basePricePaise + adjustment),
    priceAdjustmentPaise: adjustment,
    dimensions: {
      lengthMm: Number(dims.lengthMm ?? dims.length_mm ?? 100),
      widthMm: Number(dims.widthMm ?? dims.width_mm ?? 100),
      heightMm: Number(dims.heightMm ?? dims.height_mm ?? 100),
    },
    weightGrams: Number(v.weight_grams ?? v.weightGrams ?? 100),
    stockQuantity: Math.max(0, Number(v.stock_quantity ?? v.stockQuantity ?? 0)),
    leadTimeDays: Number(v.lead_time_days ?? v.leadTimeDays ?? 0),
    image: v.image ? String(v.image) : undefined,
    version: v.version !== undefined ? Number(v.version) : undefined,
  };
}
