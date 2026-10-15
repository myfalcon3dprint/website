// Domain Types — Falcon 3D Prints

export type MaterialType = 'PLA' | 'PETG' | 'Resin' | 'ABS' | 'TPU';
export type FinishType = 'Raw (Layered)' | 'Sanded Smooth' | 'Hand Painted' | 'Primed for Painting';
export type StockType = 'ready_stock' | 'made_to_order';

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  material: MaterialType;
  color: string;
  finish: FinishType;
  pricePaise: number; // Integer minor units (e.g. 149900 = ₹1,499.00)
  priceAdjustmentPaise?: number;
  dimensions: { lengthMm: number; widthMm: number; heightMm: number };
  weightGrams: number;
  stockQuantity: number;
  leadTimeDays: number; // 0 for ready stock, 2-4 for made-to-order
  image?: string; // Optional variant-specific studio photograph
  version?: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: 'Miniatures & Collectibles' | 'Desk Accessories' | 'Planters & Decor' | 'Architectural Models' | 'Kitchen Miniatures';
  categoryId?: string;
  isPublished?: boolean;
  archivedAt?: string | null;
  description: string;
  features: string[];
  specs: {
    printTechnology: 'FDM' | 'SLA Resin';
    layerHeightMm: number;
    infillPercentage: number;
    foodSafe: boolean; // Clarified safety status
    heatResistanceC: number;
  };
  stockType: StockType;
  basePricePaise: number;
  images: string[];
  variants: ProductVariant[];
  featured: boolean;
  rating: number;
  reviewCount: number;
  updatedAt?: string;
  version?: number;
}

export interface CartItem {
  id: string; // unique cart line id (productId + variantId)
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export type OrderStatus =
  | 'confirmed'
  | 'queued'
  | 'printing'
  | 'finishing'
  | 'quality_check'
  | 'reprint_required'
  | 'ready'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'additional_payment_due'
  | 'refund_due_pending_approval';

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  variantSku: string;
  variantDetails: string;
  unitPricePaise: number;
  quantity: number;
  totalPricePaise: number;
  stockType: StockType;
  itemStatus: OrderStatus;
}

export interface ShippingAddress {
  fullName: string;
  phone: string; // +91 Indian mobile
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string; // Maharashtra, etc.
  pinCode: string; // 6-digit Indian PIN
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  paymentStatus: PaymentStatus;
  paymentMethod: 'Razorpay UPI/Card' | 'Cash on Delivery (Local Nashik)';
  razorpayPaymentId?: string;
  status: OrderStatus;
  trackingNumber?: string;
  statusHistory: { status: OrderStatus; timestamp: string; note: string }[];
  refundStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'processed';
  refundNotes?: string;
  version?: number;
}

export interface CustomQuoteRequest {
  id: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt?: string;
  fullName: string;
  phone: string;
  email: string;
  fileName: string;
  fileSizeBytes: number;
  dimensionsMm: { x: number; y: number; z: number };
  materialPreference: MaterialType;
  colorPreference: string;
  infillPercentage: number;
  quantity: number;
  customerNotes?: string;
  storagePath?: string;
  status: 'submitted' | 'under_review' | 'quoted' | 'approved' | 'rejected';
  quotedPricePaise?: number;
  estimatedLeadDays?: number;
  adminNotes?: string;
}

export type StaffRole = 'owner' | 'order_manager' | 'production_operator' | 'catalog_editor' | 'support';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

export interface AuditLogEntry {
  id: string;
  staffUserId: string;
  staffName: string;
  staffRole: StaffRole;
  action: string;
  entityType: 'order' | 'product' | 'quote' | 'user' | 'system';
  entityId: string;
  oldState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  notes?: string;
  ipAddress?: string;
  createdAt: string;
}
