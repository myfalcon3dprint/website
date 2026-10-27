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
  category: 'Miniatures & Collectibles' | 'Desk Accessories' | 'Planters & Decor' | 'Architectural Models' | 'Kitchen Miniatures' | string;
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
    includedItems?: string[];
    careInstructions?: string;
    dispatchInfo?: string;
  };
  includedItems?: string[];
  careInstructions?: string;
  dispatchInfo?: string;
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
  needsReselection?: boolean;
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
  variantImage?: string;
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
  userId?: string | null;
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
  isSuspended?: boolean;
}

export interface StaffInvitation {
  id: string;
  email: string;
  role: StaffRole;
  invitedBy: string;
  invitedByName?: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  staffUserId: string;
  staffName: string;
  staffRole: StaffRole;
  action: string;
  entityType: 'order' | 'product' | 'quote' | 'user' | 'system' | 'media' | 'category' | 'shipping' | 'settings';
  entityId: string;
  oldState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  notes?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface StoreBrandingSettings {
  storeName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  businessHours: string;
  gstin: string;
}

export interface StoreAppearanceSettings {
  primaryAccent: string;
  secondaryAccent: string;
  surfaceColor: string;
  typography: 'Inter' | 'Outfit' | 'Space Grotesk' | 'Roboto';
  buttonRadius: 'sharp' | 'rounded' | 'smooth' | 'pill';
  showAnnouncementBar: boolean;
  announcementText: string;
}

export interface StoreOperationsSettings {
  defaultLeadDaysReadyStock: number;
  defaultLeadDaysMadeToOrder: number;
  lowStockAlertThreshold: number;
  currency: string;
  timezone: string;
  autoCancelUnpaidMinutes: number;
}

export interface ShippingPolicySettings {
  freeShippingThresholdPaise: number;
  defaultShippingFeePaise: number;
  localNashikFeePaise: number;
  codEnabled: boolean;
  codMaxLimitPaise: number;
  pickupAvailable: boolean;
  pickupAddress: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  description: string;
  postalCodePrefixes: string[];
  isAllIndia: boolean;
  baseFeePaise: number;
  freeShippingThresholdPaise?: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  codAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface AnnouncementItem {
  id: string;
  text: string;
  linkUrl?: string;
  linkLabel?: string;
  isActive: boolean;
  displayOrder: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CategoryVisualMeta {
  imageUrl?: string | null;
  icon?: string | null;
}

export interface HeroSlide {
  id: string;
  title: string;
  headline: string;
  subheadline: string;
  category?: string;
  desktopMediaType?: 'image' | 'video' | 'gif';
  desktopImageUrl: string;
  desktopPosterUrl?: string;
  desktopComplementaryDetailUrl?: string;
  mobileMediaType?: 'image' | 'video' | 'gif';
  mobileImageUrl?: string;
  mobilePosterUrl?: string;
  mobileHeadline?: string;
  mobileSubheadline?: string;
  desktopFocalPoint?: string;
  mobileFocalPoint?: string;
  textAlignment?: 'left' | 'center' | 'right';
  mobileTextAlignment?: 'left' | 'center' | 'right';
  overlayOpacity?: number;
  transitionPreset?: 'crossfade' | 'slide' | 'blur';
  transitionDurationMs?: number;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  accentTag?: string;
  badge?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface HomepageSection {
  id: string;
  sectionKey: string;
  title: string;
  contentDraft: Record<string, unknown>;
  contentPublished: Record<string, unknown>;
  isPublished: boolean;
  sortOrder: number;
  version: number;
  publishedAt?: string | null;
  updatedAt: string;
}

export interface ProductVideo {
  id: string;
  title: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  linkedProductIds: string[];
  displayOrder: number;
  isActive: boolean;
  viewsCount: number;
  createdAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productTitle?: string;
  userId?: string | null;
  customerName: string;
  customerEmail?: string;
  rating: number; // 1-5
  title?: string;
  reviewText: string;
  isVerifiedPurchase: boolean;
  orderId?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  staffReply?: string | null;
  staffRepliedAt?: string | null;
  staffRepliedBy?: string | null;
  createdAt: string;
}

export interface CustomerInquiry {
  id: string;
  inquiryType: 'contact' | 'bulk_quote' | 'custom_consulting';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  subject?: string;
  message: string;
  quantityRequested?: number;
  targetDeliveryDate?: string;
  estimatedBudgetPaise?: number;
  status: 'new' | 'in_progress' | 'quoted' | 'awaiting_customer' | 'closed' | 'spam';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string | null;
  assignedStaffName?: string | null;
  internalNotes?: string;
  followUpDate?: string;
  convertedOrderId?: string | null;
  convertedQuoteId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  templateKey: string;
  name: string;
  category: 'transactional' | 'marketing' | 'operational';
  subjectTemplate: string;
  bodyTemplate: string;
  availableVariables: string[];
  sampleData: Record<string, string>;
  isActive: boolean;
  updatedAt: string;
}

export interface PrinterEquipment {
  id: string;
  name: string;
  model: string;
  technology: 'FDM' | 'SLA' | 'SLS';
  status: 'available' | 'printing' | 'maintenance' | 'unavailable';
  bedSizeMm: { x: number; y: number; z: number };
  materialsSupported: string[];
  location: string;
  isConnected: boolean;
  lastServiceDate?: string;
  notes?: string;
  updatedAt?: string;
}

export interface ProductionJob {
  id: string;
  jobNumber: string;
  orderId: string;
  orderNumber?: string;
  orderItemId: string;
  itemTitle: string;
  variantSku: string;
  quantity: number;
  completedQuantity: number;
  material: string;
  color: string;
  technology: 'FDM' | 'SLA';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'waiting_to_print' | 'printing' | 'finishing' | 'quality_check' | 'qc_failed' | 'reprint_required' | 'ready_to_pack';
  printerId?: string | null;
  printerName?: string | null;
  externalSupplierName?: string | null;
  operatorName?: string | null;
  estimatedPrintMinutes?: number;
  dueDate?: string;
  qcPass?: boolean | null;
  qcNotes?: string | null;
  qcFailedReason?: string | null;
  reworkQuantity: number;
  progressPhotos: string[];
  staffNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  totalOrders: number;
  totalSpentPaise: number;
  lastOrderDate?: string | null;
  orders: Order[];
  quotes: CustomQuoteRequest[];
  notes: { id: string; staffName: string; note: string; createdAt: string }[];
  marketingConsent: boolean;
}

