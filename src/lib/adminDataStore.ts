import { 
  StoreBrandingSettings, 
  StoreAppearanceSettings, 
  StoreOperationsSettings, 
  ShippingPolicySettings, 
  ShippingZone, 
  HeroSlide, 
  HomepageSection, 
  ProductVideo, 
  ProductReview, 
  CustomerInquiry, 
  EmailTemplate, 
  PrinterEquipment, 
  ProductionJob, 
  CustomerDetail,
  AuditLogEntry,
  StaffUser,
  StaffInvitation,
  StaffRole,
  Order,
  AnnouncementItem,
  CategoryVisualMeta,
} from './types';
import { INITIAL_PRODUCT_VIDEOS } from './mock-data';

// Global singleton to persist state in Node server runtime during dev/preview sessions
interface AdminDataState {
  branding: StoreBrandingSettings;
  appearance: StoreAppearanceSettings;
  operations: StoreOperationsSettings;
  shippingPolicy: ShippingPolicySettings;
  shippingZones: ShippingZone[];
  heroSlides: HeroSlide[];
  homepageSections: HomepageSection[];
  productVideos: ProductVideo[];
  reviews: ProductReview[];
  inquiries: CustomerInquiry[];
  emailTemplates: EmailTemplate[];
  printers: PrinterEquipment[];
  productionJobs: ProductionJob[];
  customerNotes: Record<string, { id: string; staffName: string; note: string; createdAt: string }[]>;
  auditLogs: AuditLogEntry[];
  staffUsers: StaffUser[];
  staffInvitations: StaffInvitation[];
  orders: Order[];
  suspendedUserIds: Set<string>;
  announcements: AnnouncementItem[];
  categoryVisuals: Record<string, CategoryVisualMeta>;
}

const defaultState: AdminDataState = {
  branding: {
    storeName: 'Falcon 3D Prints',
    tagline: 'Precision Additive Manufacturing & Rapid Prototyping',
    logoUrl: '/images/branding/falcon-logo.png',
    faviconUrl: '/favicon.ico',
    contactPhone: '+91 98506 07144',
    contactEmail: 'contact@falcon3dprints.com',
    contactAddress: 'Uttam Nagar, CIDCO, Nashik, Maharashtra 422009, India',
    businessHours: 'Mon-Sat: 09:00 AM - 07:00 PM IST',
    gstin: '27AABCF1234F1Z8',
  },
  appearance: {
    primaryAccent: '#FF5722',
    secondaryAccent: '#00E5FF',
    surfaceColor: '#0B0F19',
    typography: 'Inter',
    buttonRadius: 'rounded',
    showAnnouncementBar: true,
    announcementText: 'Free Express Dispatch across India on orders above ₹1,999! Studio Nashik Hub',
  },
  operations: {
    defaultLeadDaysReadyStock: 1,
    defaultLeadDaysMadeToOrder: 3,
    lowStockAlertThreshold: 5,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    autoCancelUnpaidMinutes: 1440,
  },
  shippingPolicy: {
    freeShippingThresholdPaise: 199900,
    defaultShippingFeePaise: 9900,
    localNashikFeePaise: 4900,
    codEnabled: true,
    codMaxLimitPaise: 500000,
    pickupAvailable: true,
    pickupAddress: 'Falcon 3D Studio, Sector 4, CIDCO Nashik',
  },
  shippingZones: [
    {
      id: 'zone-nashik-local',
      name: 'Local Nashik Studio Dispatch',
      description: 'Direct studio courier or store pickup in Nashik metro area (PIN 422xxx)',
      postalCodePrefixes: ['422'],
      isAllIndia: false,
      baseFeePaise: 4900,
      freeShippingThresholdPaise: 49900,
      estimatedDaysMin: 1,
      estimatedDaysMax: 2,
      codAvailable: true,
      isActive: true,
      sortOrder: 10,
    },
    {
      id: 'zone-maharashtra-regional',
      name: 'Maharashtra Regional Express',
      description: 'Surface and air express across Mumbai, Pune, Nagpur, Aurangabad, Kolhapur',
      postalCodePrefixes: ['400', '401', '411', '412', '413', '414', '415', '416', '421', '422', '423', '424', '425', '431', '440'],
      isAllIndia: false,
      baseFeePaise: 7900,
      freeShippingThresholdPaise: 149900,
      estimatedDaysMin: 2,
      estimatedDaysMax: 3,
      codAvailable: true,
      isActive: true,
      sortOrder: 20,
    },
    {
      id: 'zone-all-india',
      name: 'All-India Standard Express',
      description: 'Reliable nationwide express delivery to all serviceable Indian postal codes',
      postalCodePrefixes: [],
      isAllIndia: true,
      baseFeePaise: 9900,
      freeShippingThresholdPaise: 199900,
      estimatedDaysMin: 3,
      estimatedDaysMax: 6,
      codAvailable: true,
      isActive: true,
      sortOrder: 30,
    },
  ],
  heroSlides: [
    {
      id: 'slide-01',
      title: 'Geometric Origami Planters',
      headline: 'Architectural Geometric\nPlanter Series',
      subheadline: 'Low-poly self-draining desk planters with integrated saucers. Engineered and 3D printed in our Nashik studio.',
      category: 'Planters & Decor',
      desktopImageUrl: '/products/planter-obsidian-black.jpg',
      mobileImageUrl: '/products/planter-orange-variant.jpg',
      desktopFocalPoint: 'center center',
      mobileFocalPoint: 'center center',
      textAlignment: 'left',
      overlayOpacity: 0.42,
      transitionPreset: 'crossfade',
      transitionDurationMs: 500,
      primaryButtonText: 'Shop Planters Collection',
      primaryButtonLink: '/catalog?category=Planters%20%26%20Decor',
      secondaryButtonText: 'Explore Full Catalog',
      secondaryButtonLink: '/catalog',
      accentTag: 'In Stock • Nashik Studio',
      badge: 'From ₹499',
      displayOrder: 1,
      isActive: true,
    },
    {
      id: 'slide-02',
      title: 'Articulated Collectibles',
      headline: 'Cyber Gryphon\nArticulated Figure',
      subheadline: '18 interlocking ball-socket articulation points with zero assembly required. Precision print-in-place additive engineering.',
      category: 'Miniatures & Collectibles',
      desktopImageUrl: '/products/cyber-gryphon-figure.jpg',
      mobileImageUrl: '/products/figurine-mecha-gryphon.jpg',
      desktopFocalPoint: 'center center',
      mobileFocalPoint: 'center center',
      textAlignment: 'left',
      overlayOpacity: 0.45,
      transitionPreset: 'slide',
      transitionDurationMs: 550,
      primaryButtonText: 'Order Articulated Model',
      primaryButtonLink: '/catalog/mecha-gryphon-articulated-figurine',
      secondaryButtonText: 'Explore Collectibles',
      secondaryButtonLink: '/catalog?category=Miniatures%20%26%20Collectibles',
      accentTag: 'Print-in-Place Articulation',
      badge: 'From ₹899',
      displayOrder: 2,
      isActive: true,
    },
    {
      id: 'slide-03',
      title: 'Heritage Scale Architecture',
      headline: 'Trimbakeshwar Temple\nArchitectural Replica',
      subheadline: 'Honoring Nashik Jyotirlinga heritage. 50-micron SLA photopolymer resin captures intricate shikhara pillars and temple geometry.',
      category: 'Architectural Models',
      desktopImageUrl: '/products/trimbakeshwar-temple-model.jpg',
      mobileImageUrl: '/products/trimbakeshwar-temple-model.jpg',
      desktopFocalPoint: 'center center',
      mobileFocalPoint: 'center center',
      textAlignment: 'left',
      overlayOpacity: 0.45,
      transitionPreset: 'blur',
      transitionDurationMs: 600,
      primaryButtonText: 'Shop Temple Replica',
      primaryButtonLink: '/catalog/trimbakeshwar-temple-architectural-replica',
      secondaryButtonText: 'Explore Scale Models',
      secondaryButtonLink: '/catalog?category=Architectural%20Models',
      accentTag: 'Heritage Edition',
      badge: 'From ₹1,499',
      displayOrder: 3,
      isActive: true,
    },
    {
      id: 'slide-04',
      title: 'Ergonomic Desk Systems',
      headline: 'HexaGrid Modular\nDesk Caddy System',
      subheadline: 'Interlocking magnetic hexagonal modules crafted with matte charcoal PLA. Tailored for stylus, tool, and mechanical keyboard organization.',
      category: 'Desk Accessories',
      desktopImageUrl: '/products/hexagrid-desk-organizer.jpg',
      mobileImageUrl: '/products/aerostand-black.jpg',
      desktopFocalPoint: 'center center',
      mobileFocalPoint: 'center center',
      textAlignment: 'left',
      overlayOpacity: 0.42,
      transitionPreset: 'crossfade',
      transitionDurationMs: 500,
      primaryButtonText: 'Shop Desk Series',
      primaryButtonLink: '/catalog/modular-hex-desk-organizer',
      secondaryButtonText: 'View All Desk Items',
      secondaryButtonLink: '/catalog?category=Desk%20Accessories',
      accentTag: 'Studio Ready Stock',
      badge: 'From ₹649',
      displayOrder: 4,
      isActive: true,
    },
  ],
  announcements: [
    {
      id: 'ann-01',
      text: 'Complimentary express surface courier shipping across India on orders above ₹999.',
      linkUrl: '/catalog',
      linkLabel: 'Shop Catalog',
      isActive: true,
      displayOrder: 1,
      startDate: null,
      endDate: null,
    },
    {
      id: 'ann-02',
      text: 'Ready stock items dispatch within 24 hours directly from our Nashik studio hub.',
      linkUrl: '/policies/shipping',
      linkLabel: 'Shipping Policy',
      isActive: true,
      displayOrder: 2,
      startDate: null,
      endDate: null,
    },
    {
      id: 'ann-03',
      text: 'Handcrafted 3D printed collectibles, planters, and desk essentials. Direct from our Nashik studio.',
      linkUrl: '/catalog',
      linkLabel: 'Shop All Prints',
      isActive: true,
      displayOrder: 3,
      startDate: null,
      endDate: null,
    },
  ],
  categoryVisuals: {
    'c1111111-1111-1111-1111-111111111111': { imageUrl: '/products/planter-obsidian-black.jpg', icon: 'Sparkles' },
    'planters-and-decor': { imageUrl: '/products/planter-obsidian-black.jpg', icon: 'Sparkles' },
    'Planters & Decor': { imageUrl: '/products/planter-obsidian-black.jpg', icon: 'Sparkles' },
    'c2222222-2222-2222-2222-222222222222': { imageUrl: '/products/cyber-gryphon-figure.jpg', icon: 'Bot' },
    'miniatures-and-collectibles': { imageUrl: '/products/cyber-gryphon-figure.jpg', icon: 'Bot' },
    'Miniatures & Collectibles': { imageUrl: '/products/cyber-gryphon-figure.jpg', icon: 'Bot' },
    'c3333333-3333-3333-3333-333333333333': { imageUrl: '/products/hexagrid-desk-organizer.jpg', icon: 'Layers' },
    'desk-accessories': { imageUrl: '/products/hexagrid-desk-organizer.jpg', icon: 'Layers' },
    'Desk Accessories': { imageUrl: '/products/hexagrid-desk-organizer.jpg', icon: 'Layers' },
    'c4444444-4444-4444-4444-444444444444': { imageUrl: '/products/trimbakeshwar-temple-model.jpg', icon: 'Landmark' },
    'architectural-models': { imageUrl: '/products/trimbakeshwar-temple-model.jpg', icon: 'Landmark' },
    'Architectural Models': { imageUrl: '/products/trimbakeshwar-temple-model.jpg', icon: 'Landmark' },
    'c5555555-5555-5555-5555-555555555555': { imageUrl: '/products/mini-brass-cookware.jpg', icon: 'Utensils' },
    'kitchen-miniatures': { imageUrl: '/products/mini-brass-cookware.jpg', icon: 'Utensils' },
    'Kitchen Miniatures': { imageUrl: '/products/mini-brass-cookware.jpg', icon: 'Utensils' },
  },
  homepageSections: [
    {
      id: 'sec-hero',
      sectionKey: 'hero_slider',
      title: 'Hero Showcase Carousel',
      contentDraft: { slidesCount: 2, autoplayIntervalMs: 6000 },
      contentPublished: { slidesCount: 2, autoplayIntervalMs: 6000 },
      isPublished: true,
      sortOrder: 10,
      version: 1,
      publishedAt: '2026-10-15T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      id: 'sec-configurator',
      sectionKey: 'interactive_configurator',
      title: 'Real-Time 3D Quote Calculator',
      contentDraft: { enabled: true, title: 'Instant STL/STEP Pricing Engine' },
      contentPublished: { enabled: true, title: 'Instant STL/STEP Pricing Engine' },
      isPublished: true,
      sortOrder: 20,
      version: 1,
      publishedAt: '2026-10-15T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      id: 'sec-featured',
      sectionKey: 'featured_products',
      title: 'Curated Workshop Prints',
      contentDraft: { maxItems: 6, tag: 'featured' },
      contentPublished: { maxItems: 6, tag: 'featured' },
      isPublished: true,
      sortOrder: 30,
      version: 1,
      publishedAt: '2026-10-15T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      id: 'sec-materials',
      sectionKey: 'materials_guide',
      title: 'Materials & Finishes Guide',
      contentDraft: { showTechSpecs: true },
      contentPublished: { showTechSpecs: true },
      isPublished: true,
      sortOrder: 40,
      version: 1,
      publishedAt: '2026-10-15T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      id: 'sec-reviews',
      sectionKey: 'customer_reviews',
      title: 'Verified Customer Reviews',
      contentDraft: { minRating: 4 },
      contentPublished: { minRating: 4 },
      isPublished: true,
      sortOrder: 50,
      version: 1,
      publishedAt: '2026-10-15T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
  ],
  productVideos: [
    {
      id: 'vid-01',
      title: 'Printing Cyber Gryphon on Bambu X1-Carbon',
      caption: 'Watch the high-speed 0.08mm layer deposition in Titanium Gray PETG! #3dprinting #falcon3d #makersindia',
      videoUrl: 'https://assets.falcon3dprints.com/videos/bambu-x1c-gryphon.mp4',
      thumbnailUrl: '/products/figurine-mecha-gryphon.jpg',
      durationSeconds: 28,
      aspectRatio: '9:16',
      linkedProductIds: ['a2222222-2222-2222-2222-222222222222'],
      displayOrder: 1,
      isActive: true,
      viewsCount: 1420,
      createdAt: '2026-10-16T10:00:00Z',
    },
    {
      id: 'vid-02',
      title: 'Parametric Hexagonal Planter Post-Processing',
      caption: 'Seamless satin finish straight from the textured PEI bed. Zero post-processing needed. #homeoffice',
      videoUrl: 'https://assets.falcon3dprints.com/videos/planter-demo.mp4',
      thumbnailUrl: '/products/planter-obsidian-black.jpg',
      durationSeconds: 19,
      aspectRatio: '9:16',
      linkedProductIds: ['a1111111-1111-1111-1111-111111111111'],
      displayOrder: 2,
      isActive: true,
      viewsCount: 980,
      createdAt: '2026-10-16T12:00:00Z',
    },
    {
      id: 'vid-03',
      title: 'AeroStand Under-Desk Rest Strength Test',
      caption: 'Testing 850g studio monitor headphone load with zero sag. Cable routing channel in action! #audiophile #desksetup',
      videoUrl: 'https://assets.falcon3dprints.com/videos/aerostand-demo.mp4',
      thumbnailUrl: '/products/stand-matte-white.jpg',
      durationSeconds: 24,
      aspectRatio: '9:16',
      linkedProductIds: ['a3333333-3333-3333-3333-333333333333'],
      displayOrder: 3,
      isActive: true,
      viewsCount: 1850,
      createdAt: '2026-10-17T14:30:00Z',
    },
    {
      id: 'vid-04',
      title: 'HexaGrid Modular Desk Caddy Magnetic Snap',
      caption: 'Neodymium magnets snap-aligning on the workbench. Six modular bays configured your way. #edc #workspace',
      videoUrl: 'https://assets.falcon3dprints.com/videos/hexagrid-snap.mp4',
      thumbnailUrl: '/products/hexagrid-desk-organizer.jpg',
      durationSeconds: 16,
      aspectRatio: '9:16',
      linkedProductIds: ['982053be-ce2c-47f4-88d9-29de0a4ea8f4'],
      displayOrder: 4,
      isActive: true,
      viewsCount: 2210,
      createdAt: '2026-10-18T09:15:00Z',
    },
  ],
  reviews: [
    {
      id: 'rev-01',
      productId: 'a1111111-1111-1111-1111-111111111111',
      productTitle: 'Parametric Hexagonal Desk Planter',
      customerName: 'Aditya Deshmukh',
      customerEmail: 'aditya.deshmukh@gmail.com',
      rating: 5,
      title: 'Incredible finish and weight',
      reviewText: 'The obsidian black matte texture is flawless. No visible layer lines on the exterior walls, and the drainage system works perfectly for my succulent.',
      isVerifiedPurchase: true,
      status: 'approved',
      staffReply: 'Thank you Aditya! We calibrate our Bambu X1-Carbon printers with a 0.12mm fine profile specifically for this planter.',
      staffRepliedAt: '2026-10-16T14:20:00Z',
      createdAt: '2026-10-16T11:00:00Z',
    },
    {
      id: 'rev-02',
      productId: 'a2222222-2222-2222-2222-222222222222',
      productTitle: 'Cyber-Industrial Mecha Gryphon',
      customerName: 'Rohit Kulkarni',
      customerEmail: 'rohit.k@yahoo.in',
      rating: 5,
      title: 'Top tier mechanical model for my desk',
      reviewText: 'Ordered the Titanium Gray PETG variant. The overhangs and wing joints printed without any stringing. Super sturdy assembly.',
      isVerifiedPurchase: true,
      status: 'approved',
      createdAt: '2026-10-17T09:15:00Z',
    },
    {
      id: 'rev-03',
      productId: 'a1111111-1111-1111-1111-111111111111',
      productTitle: 'Parametric Hexagonal Desk Planter',
      customerName: 'Pooja Patil',
      customerEmail: 'pooja.patil@outlook.com',
      rating: 4,
      title: 'Lovely planter, slightly smaller than expected',
      reviewText: 'The build quality is stunning, but check the dimensions if you have a larger succulent. Overall very happy with the Falcon Orange accent.',
      isVerifiedPurchase: true,
      status: 'pending',
      createdAt: '2026-10-18T08:30:00Z',
    },
  ],
  inquiries: [
    {
      id: 'inq-01',
      inquiryType: 'bulk_quote',
      customerName: 'Sanjay Verma',
      customerEmail: 'sanjay.verma@kpit-systems.com',
      customerPhone: '+91 98220 54123',
      companyName: 'KPIT Engineering & Robotics',
      subject: 'Batch production of 150 Sensor Enclosures in PETG',
      message: 'We require 150 custom electronic enclosures printed in flame-retardant PETG with heat-set brass threaded inserts. Target delivery in 12 days to Pune facility.',
      quantityRequested: 150,
      targetDeliveryDate: '2026-10-30',
      estimatedBudgetPaise: 4500000,
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'test_staff_id',
      assignedStaffName: 'Falcon Studio Operator',
      internalNotes: 'Calculated slice estimate: approx 85g per unit. Total printing time approx 48 machine hours across 3 Bambu printers.',
      followUpDate: '2026-10-20',
      createdAt: '2026-10-17T14:00:00Z',
      updatedAt: '2026-10-17T16:30:00Z',
    },
    {
      id: 'inq-02',
      inquiryType: 'contact',
      customerName: 'Vikram Joshi',
      customerEmail: 'vikram.j@techstart.in',
      customerPhone: '+91 97654 32109',
      subject: 'Custom architectural scale model question',
      message: 'Do you offer multi-color FDM printing with water-soluble PVA supports for overhangs?',
      status: 'new',
      priority: 'normal',
      createdAt: '2026-10-18T07:15:00Z',
      updatedAt: '2026-10-18T07:15:00Z',
    },
  ],
  emailTemplates: [
    {
      id: 'tmpl-order-confirmation',
      templateKey: 'order_confirmation',
      name: 'Order Confirmation',
      category: 'transactional',
      subjectTemplate: 'Your Falcon 3D Prints Order #{{order_number}} is Confirmed!',
      bodyTemplate: `Hello {{customer_name}},

Thank you for your order with Falcon 3D Prints! Our Nashik workshop has received your request and our engineers are preparing your print files.

Order Summary:
- Order Number: {{order_number}}
- Items: {{items_summary}}
- Order Total: {{total_amount}}
- Delivery Address: {{delivery_address}}

You can monitor real-time production and dispatch updates at:
{{order_tracking_url}}

If you have any questions or special instructions, reply directly to this email or chat with our Nashik hub on WhatsApp at +91 98506 07144.

Warm regards,
The Falcon 3D Prints Studio Team
Uttam Nagar, CIDCO, Nashik, India`,
      availableVariables: ['customer_name', 'order_number', 'items_summary', 'total_amount', 'delivery_address', 'order_tracking_url'],
      sampleData: {
        customer_name: 'Rahul Sharma',
        order_number: 'FAL-2026-9814',
        items_summary: '1x Parametric Hexagonal Desk Planter (Matte Obsidian Black)',
        total_amount: '₹1,499.00',
        delivery_address: 'Flat 402, Shivam Apts, Gangapur Road, Nashik 422013',
        order_tracking_url: 'https://falcon3dprints.com/account/orders/FAL-2026-9814',
      },
      isActive: true,
      updatedAt: '2026-10-17T10:00:00Z',
    },
    {
      id: 'tmpl-quote-issued',
      templateKey: 'custom_quote_issued',
      name: 'Custom Print Quote Issued',
      category: 'transactional',
      subjectTemplate: 'Your Falcon 3D Print Quote #{{reference_number}} is Ready',
      bodyTemplate: `Hello {{customer_name}},

Our engineering operators have analyzed your uploaded 3D model ({{file_name}}) and prepared your quotation.

Quote Details:
- Reference: {{reference_number}}
- Technology & Material: {{technology}} ({{material}} - {{color}})
- Estimated Print & Finishing Time: {{lead_days}} days
- Total Quoted Price: {{quoted_price}} (All taxes included)

Review your itemized quote breakdown and approve with 1-click:
{{quote_approval_url}}

This quote remains valid for 14 calendar days.

Best regards,
Falcon 3D Prints Engineering Desk`,
      availableVariables: ['customer_name', 'reference_number', 'file_name', 'technology', 'material', 'color', 'lead_days', 'quoted_price', 'quote_approval_url'],
      sampleData: {
        customer_name: 'Pooja Patil',
        reference_number: 'FAL-Q-8921',
        file_name: 'custom_bracket_v3.step',
        technology: 'FDM',
        material: 'PETG',
        color: 'Titanium Gray',
        lead_days: '3',
        quoted_price: '₹2,450.00',
        quote_approval_url: 'https://falcon3dprints.com/quote?ref=FAL-Q-8921',
      },
      isActive: true,
      updatedAt: '2026-10-17T10:00:00Z',
    },
    {
      id: 'tmpl-dispatched',
      templateKey: 'order_dispatched',
      name: 'Order Dispatched with Tracking',
      category: 'transactional',
      subjectTemplate: 'Your Falcon 3D Prints Order #{{order_number}} has Shipped!',
      bodyTemplate: `Hello {{customer_name}},

Great news! Your 3D printed items have passed our quality control inspection and have been dispatched from our Nashik facility.

Shipment Details:
- Order Number: {{order_number}}
- Courier Partner: {{courier_name}}
- Tracking Number / AWB: {{tracking_number}}
- Live Tracking Link: {{tracking_url}}
- Estimated Delivery: {{estimated_days}} business days

Thank you for supporting precision Indian manufacturing!

Warm regards,
Falcon 3D Prints Dispatch Team`,
      availableVariables: ['customer_name', 'order_number', 'courier_name', 'tracking_number', 'tracking_url', 'estimated_days'],
      sampleData: {
        customer_name: 'Rahul Sharma',
        order_number: 'FAL-2026-9814',
        courier_name: 'Delhivery Surface Express',
        tracking_number: 'DEL98712345678',
        tracking_url: 'https://delhivery.com/track/package/DEL98712345678',
        estimated_days: '2',
      },
      isActive: true,
      updatedAt: '2026-10-17T10:00:00Z',
    },
  ],
  printers: [
    {
      id: 'PRN-BAMBU-X1C-01',
      name: 'Bambu Lab X1-Carbon #01',
      model: 'Bambu Lab X1-Carbon',
      technology: 'FDM',
      status: 'available',
      bedSizeMm: { x: 256, y: 256, z: 256 },
      materialsSupported: ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon PA-CF'],
      location: 'Nashik Hub - Bay A',
      isConnected: false,
      lastServiceDate: '2026-10-10',
      notes: 'Equipped with 0.4mm hardened steel nozzle and AMS 4-color module.',
    },
    {
      id: 'PRN-BAMBU-P1S-02',
      name: 'Bambu Lab P1S #02',
      model: 'Bambu Lab P1S',
      technology: 'FDM',
      status: 'printing',
      bedSizeMm: { x: 256, y: 256, z: 256 },
      materialsSupported: ['PLA', 'PETG', 'ABS'],
      location: 'Nashik Hub - Bay A',
      isConnected: false,
      lastServiceDate: '2026-10-12',
      notes: 'Currently running batch print for Parametric Hexagonal Planters.',
    },
    {
      id: 'PRN-ELEGOO-SAT-03',
      name: 'Elegoo Saturn 4 Ultra #03',
      model: 'Elegoo Saturn 4 Ultra 12K',
      technology: 'SLA',
      status: 'available',
      bedSizeMm: { x: 218, y: 122, z: 220 },
      materialsSupported: ['Standard Resin', 'ABS-Like Resin', 'Tough Engineering Resin'],
      location: 'Nashik Hub - Bay B (Resin Lab)',
      isConnected: false,
      lastServiceDate: '2026-10-14',
      notes: 'Dedicated 12K high-detail miniatures and cosplay printing.',
    },
    {
      id: 'PRN-CREALITY-K1-04',
      name: 'Creality K1 Max #04',
      model: 'Creality K1 Max',
      technology: 'FDM',
      status: 'maintenance',
      bedSizeMm: { x: 300, y: 300, z: 300 },
      materialsSupported: ['PLA', 'PETG', 'TPU'],
      location: 'Nashik Hub - Bay C',
      isConnected: false,
      lastServiceDate: '2026-10-18',
      notes: 'Under routine bed leveling calibration and extruder cleaning. Unavailable for new jobs.',
    },
  ],
  productionJobs: [
    {
      id: 'job-01',
      jobNumber: 'JOB-2026-101',
      orderId: 'mock-order-01',
      orderNumber: 'FAL-2026-9814',
      orderItemId: 'item-01',
      itemTitle: 'Parametric Hexagonal Desk Planter',
      variantSku: 'FAL-PLT-GEO-BLK-M',
      quantity: 2,
      completedQuantity: 1,
      material: 'PLA',
      color: 'Obsidian Black',
      technology: 'FDM',
      priority: 'high',
      status: 'printing',
      printerId: 'PRN-BAMBU-P1S-02',
      printerName: 'Bambu Lab P1S #02',
      operatorName: 'Suresh Patil',
      estimatedPrintMinutes: 240,
      dueDate: '2026-10-20',
      qcPass: null,
      reworkQuantity: 0,
      progressPhotos: [],
      staffNotes: 'Layer adhesion inspected at 20mm height. Running smoothly.',
      createdAt: '2026-10-17T09:00:00Z',
      updatedAt: '2026-10-17T11:30:00Z',
    },
    {
      id: 'job-02',
      jobNumber: 'JOB-2026-102',
      orderId: 'mock-order-02',
      orderNumber: 'FAL-2026-9815',
      orderItemId: 'item-02',
      itemTitle: 'Cyber-Industrial Mecha Gryphon',
      variantSku: 'FAL-FIG-GRY-TIT-STD',
      quantity: 1,
      completedQuantity: 0,
      material: 'PETG',
      color: 'Titanium Gray',
      technology: 'FDM',
      priority: 'normal',
      status: 'waiting_to_print',
      printerId: 'PRN-BAMBU-X1C-01',
      printerName: 'Bambu Lab X1-Carbon #01',
      operatorName: 'Unassigned',
      estimatedPrintMinutes: 380,
      dueDate: '2026-10-22',
      qcPass: null,
      reworkQuantity: 0,
      progressPhotos: [],
      staffNotes: 'Requires tree supports with 0.15mm z-distance.',
      createdAt: '2026-10-18T06:00:00Z',
      updatedAt: '2026-10-18T06:00:00Z',
    },
    {
      id: 'job-03',
      jobNumber: 'JOB-2026-103',
      orderId: 'mock-order-03',
      orderNumber: 'FAL-2026-9816',
      orderItemId: 'item-03',
      itemTitle: 'Artisan Mechanical Keycap Set',
      variantSku: 'FAL-KEY-ART-CYN',
      quantity: 4,
      completedQuantity: 4,
      material: 'Resin',
      color: 'Cyber Cyan Translucent',
      technology: 'SLA',
      priority: 'urgent',
      status: 'quality_check',
      printerId: 'PRN-ELEGOO-SAT-03',
      printerName: 'Elegoo Saturn 4 Ultra #03',
      operatorName: 'Kavita Rao',
      estimatedPrintMinutes: 180,
      dueDate: '2026-10-19',
      qcPass: null,
      reworkQuantity: 0,
      progressPhotos: [],
      staffNotes: 'Wash in 99% IPA completed. UV cure completed for 8 minutes.',
      createdAt: '2026-10-17T15:00:00Z',
      updatedAt: '2026-10-18T08:00:00Z',
    },
  ],
  customerNotes: {
    'cust-01': [
      {
        id: 'note-01',
        staffName: 'Studio Director',
        note: 'Customer is a commercial interior designer in Pune. Prefers matte finish over gloss. Good candidate for bulk discounts.',
        createdAt: '2026-10-15T11:00:00Z',
      },
    ],
  },
  auditLogs: [
    {
      id: 'log-01',
      staffUserId: 'test_staff_id',
      staffName: 'Falcon Studio Operator',
      staffRole: 'owner',
      action: 'UPDATE_PRINT_JOB_STATUS',
      entityType: 'order',
      entityId: 'JOB-2026-101',
      oldState: { status: 'waiting_to_print' },
      newState: { status: 'printing', printerId: 'PRN-BAMBU-P1S-02' },
      notes: 'Assigned job to Bambu Lab P1S #02 after bed cleaning.',
      createdAt: '2026-10-17T09:30:00Z',
    },
    {
      id: 'log-02',
      staffUserId: 'test_staff_id',
      staffName: 'Falcon Studio Operator',
      staffRole: 'owner',
      action: 'UPDATE_SHIPPING_ZONES',
      entityType: 'shipping',
      entityId: 'zone-maharashtra-regional',
      oldState: { baseFeePaise: 8900 },
      newState: { baseFeePaise: 7900 },
      notes: 'Reduced regional shipping fee after negotiating new Delhivery studio rates.',
      createdAt: '2026-10-17T14:15:00Z',
    },
  ],
  suspendedUserIds: new Set<string>(),
  staffUsers: [
    {
      id: 'usr-owner-1',
      name: 'Rajesh Sharma',
      email: 'rajesh@falcon3dprints.com',
      role: 'owner',
    },
    {
      id: 'usr-mgr-2',
      name: 'Priya Patel',
      email: 'priya.patel@falcon3dprints.com',
      role: 'order_manager',
    },
    {
      id: 'usr-prod-3',
      name: 'Amit Verma',
      email: 'amit.verma@falcon3dprints.com',
      role: 'production_operator',
    },
    {
      id: 'usr-cat-4',
      name: 'Sneha Kulkarni',
      email: 'sneha.k@falcon3dprints.com',
      role: 'catalog_editor',
    },
    {
      id: 'usr-supp-5',
      name: 'Vikram Deshmukh',
      email: 'vikram.d@falcon3dprints.com',
      role: 'support',
    },
  ],
  staffInvitations: [
    {
      id: 'inv-1',
      email: 'gaurav.shinde@falcon3dprints.com',
      role: 'production_operator',
      invitedBy: 'usr-owner-1',
      invitedByName: 'Rajesh Sharma',
      status: 'pending',
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: '2026-10-17T10:30:00Z',
    },
    {
      id: 'inv-2',
      email: 'pooja.nair@falcon3dprints.com',
      role: 'catalog_editor',
      invitedBy: 'usr-owner-1',
      invitedByName: 'Rajesh Sharma',
      status: 'pending',
      expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: '2026-10-16T15:20:00Z',
    },
  ],
  orders: [
    {
      id: 'ord-101',
      orderNumber: 'FAL-2026-9814',
      createdAt: '2026-10-18T08:30:00Z',
      updatedAt: '2026-10-18T09:15:00Z',
      customerName: 'Ananya Sharma',
      customerEmail: 'ananya.sharma@example.com',
      customerPhone: '+91 98201 12345',
      shippingAddress: {
        fullName: 'Ananya Sharma',
        phone: '+91 98201 12345',
        addressLine1: 'B-402, Sea Breeze Apts, Worli Hill Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400018',
      },
      items: [
        {
          id: 'item-101-1',
          productId: 'prod-gearbox-1',
          productTitle: 'Precision Planetary Gearbox Kit',
          variantSku: 'FAL-GEAR-PLA-BLK',
          variantDetails: 'PLA Matte / Jet Black',
          unitPricePaise: 149900,
          quantity: 2,
          totalPricePaise: 299800,
          stockType: 'made_to_order',
          itemStatus: 'printing',
        },
      ],
      subtotalPaise: 299800,
      shippingPaise: 0,
      taxPaise: 50000,
      totalPaise: 349800,
      paymentStatus: 'captured',
      paymentMethod: 'Razorpay UPI/Card',
      razorpayPaymentId: 'pay_NzK8912345678',
      status: 'printing',
      statusHistory: [
        { status: 'confirmed', timestamp: '2026-10-18T08:30:00Z', note: 'Payment verified via Razorpay webhook' },
        { status: 'printing', timestamp: '2026-10-18T09:15:00Z', note: 'Assigned to Bambu Lab X1C Unit 01' },
      ],
      version: 1,
    },
    {
      id: 'ord-102',
      orderNumber: 'FAL-2026-9815',
      createdAt: '2026-10-18T09:45:00Z',
      updatedAt: '2026-10-18T11:00:00Z',
      customerName: 'Rohan Verma',
      customerEmail: 'rohan.v@techcorp.in',
      customerPhone: '+91 98220 54321',
      shippingAddress: {
        fullName: 'Rohan Verma',
        phone: '+91 98220 54321',
        addressLine1: 'Plot 45, Hinjewadi Phase 1',
        city: 'Pune',
        state: 'Maharashtra',
        pinCode: '411057',
      },
      items: [
        {
          id: 'item-102-1',
          productId: 'prod-bracket-2',
          productTitle: 'Aerospace Cable Mounting Bracket',
          variantSku: 'FAL-BRK-PETG-GRY',
          variantDetails: 'PETG / Space Grey',
          unitPricePaise: 74900,
          quantity: 2,
          totalPricePaise: 149800,
          stockType: 'ready_stock',
          itemStatus: 'ready',
        },
      ],
      subtotalPaise: 149800,
      shippingPaise: 0,
      taxPaise: 26964,
      totalPaise: 176764,
      paymentStatus: 'captured',
      paymentMethod: 'Razorpay UPI/Card',
      status: 'ready',
      statusHistory: [
        { status: 'confirmed', timestamp: '2026-10-18T09:45:00Z', note: 'Order placed with ready-stock availability' },
        { status: 'ready', timestamp: '2026-10-18T11:00:00Z', note: 'Items inspected and staged for packing' },
      ],
      version: 1,
    },
    {
      id: 'ord-103',
      orderNumber: 'FAL-2026-9816',
      createdAt: '2026-10-18T10:15:00Z',
      updatedAt: '2026-10-18T10:15:00Z',
      customerName: 'Dr. Nitin Gadgil',
      customerEmail: 'dr.gadgil@nashikortho.com',
      customerPhone: '+91 94222 88990',
      shippingAddress: {
        fullName: 'Dr. Nitin Gadgil',
        phone: '+91 94222 88990',
        addressLine1: 'Clinic 3, Canada Corner',
        city: 'Nashik',
        state: 'Maharashtra',
        pinCode: '422005',
      },
      items: [
        {
          id: 'item-103-1',
          productId: 'prod-mandible-3',
          productTitle: 'Patient Anatomical Bone Model',
          variantSku: 'FAL-MED-RESIN-WHT',
          variantDetails: 'Bio-Resin / Ivory White',
          unitPricePaise: 580000,
          quantity: 1,
          totalPricePaise: 580000,
          stockType: 'made_to_order',
          itemStatus: 'queued',
        },
      ],
      subtotalPaise: 580000,
      shippingPaise: 0,
      taxPaise: 0,
      totalPaise: 580000,
      paymentStatus: 'pending',
      paymentMethod: 'Cash on Delivery (Local Nashik)',
      status: 'queued',
      statusHistory: [
        { status: 'confirmed', timestamp: '2026-10-18T10:15:00Z', note: 'Studio pickup / Local cash settlement requested' },
      ],
      version: 1,
    },
    {
      id: 'ord-104',
      orderNumber: 'FAL-2026-9817',
      createdAt: '2026-10-17T11:20:00Z',
      updatedAt: '2026-10-17T16:45:00Z',
      customerName: 'Meera Krishnan',
      customerEmail: 'meera.k@designlabs.io',
      customerPhone: '+91 98450 77123',
      shippingAddress: {
        fullName: 'Meera Krishnan',
        phone: '+91 98450 77123',
        addressLine1: 'Villa 12, Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560038',
      },
      items: [
        {
          id: 'item-104-1',
          productId: 'prod-lamp-4',
          productTitle: 'Parametric Voronoi Mood Lamp',
          variantSku: 'FAL-LAMP-PLA-SLV',
          variantDetails: 'Silk PLA / Moonlight Silver',
          unitPricePaise: 225000,
          quantity: 1,
          totalPricePaise: 225000,
          stockType: 'made_to_order',
          itemStatus: 'shipped',
        },
      ],
      subtotalPaise: 225000,
      shippingPaise: 0,
      taxPaise: 0,
      totalPaise: 225000,
      paymentStatus: 'captured',
      paymentMethod: 'Razorpay UPI/Card',
      trackingNumber: 'DEL-AWB-9812440',
      status: 'shipped',
      statusHistory: [
        { status: 'confirmed', timestamp: '2026-10-17T11:20:00Z', note: 'Paid in full' },
        { status: 'shipped', timestamp: '2026-10-17T16:45:00Z', note: 'Dispatched with Delhivery Express' },
      ],
      version: 1,
    },
    {
      id: 'ord-105',
      orderNumber: 'FAL-2026-9818',
      createdAt: '2026-10-16T14:10:00Z',
      updatedAt: '2026-10-17T18:00:00Z',
      customerName: 'Saurabh Joshi',
      customerEmail: 'saurabh.j@makerhub.in',
      customerPhone: '+91 98190 33445',
      shippingAddress: {
        fullName: 'Saurabh Joshi',
        phone: '+91 98190 33445',
        addressLine1: 'Ghodbunder Road, Near Hypercity',
        city: 'Thane',
        state: 'Maharashtra',
        pinCode: '400615',
      },
      items: [
        {
          id: 'item-105-1',
          productId: 'prod-cablechain-5',
          productTitle: 'Heavy Duty 3D Printer Cable Chain Kit',
          variantSku: 'FAL-CH-ABS-BLK',
          variantDetails: 'ABS High Impact / Jet Black',
          unitPricePaise: 89900,
          quantity: 1,
          totalPricePaise: 89900,
          stockType: 'ready_stock',
          itemStatus: 'delivered',
        },
      ],
      subtotalPaise: 89900,
      shippingPaise: 0,
      taxPaise: 0,
      totalPaise: 89900,
      paymentStatus: 'captured',
      paymentMethod: 'Razorpay UPI/Card',
      trackingNumber: 'DEL-AWB-9762112',
      status: 'delivered',
      statusHistory: [
        { status: 'confirmed', timestamp: '2026-10-16T14:10:00Z', note: 'Paid in full' },
        { status: 'shipped', timestamp: '2026-10-16T17:00:00Z', note: 'Dispatched via BlueDart' },
        { status: 'delivered', timestamp: '2026-10-17T18:00:00Z', note: 'Delivered to customer front desk' },
      ],
      version: 1,
    },
    {
      id: 'ord-106',
      orderNumber: 'FAL-2026-9819',
      createdAt: '2026-10-15T09:00:00Z',
      updatedAt: '2026-10-15T15:30:00Z',
      customerName: 'Kavita Deshmukh',
      customerEmail: 'kavita.deshmukh@archdesign.com',
      customerPhone: '+91 98230 45678',
      shippingAddress: {
        fullName: 'Kavita Deshmukh',
        phone: '+91 98230 45678',
        addressLine1: 'Mahatma Nagar, Near Water Tank',
        city: 'Nashik',
        state: 'Maharashtra',
        pinCode: '422007',
      },
      items: [
        {
          id: 'item-106-1',
          productId: 'prod-archscale-6',
          productTitle: 'Architectural Scale Model Façade 1:50',
          variantSku: 'FAL-ARCH-PLA-WHT',
          variantDetails: 'PLA Matte / Architectural White',
          unitPricePaise: 420000,
          quantity: 1,
          totalPricePaise: 420000,
          stockType: 'made_to_order',
          itemStatus: 'cancelled',
        },
      ],
      subtotalPaise: 420000,
      shippingPaise: 0,
      taxPaise: 0,
      totalPaise: 420000,
      paymentStatus: 'refunded',
      refundStatus: 'processed',
      refundNotes: 'Customer project requirements altered before manufacturing commenced.',
      paymentMethod: 'Razorpay UPI/Card',
      status: 'cancelled',
      statusHistory: [
        { status: 'confirmed', timestamp: '2026-10-15T09:00:00Z', note: 'Initial booking' },
        { status: 'cancelled', timestamp: '2026-10-15T15:30:00Z', note: 'Order cancelled upon customer request. Refund issued.' },
      ],
      version: 1,
    },
  ],
};

// Node global storage persistence
declare global {
  var __falconAdminStore: AdminDataState | undefined;
}

if (!global.__falconAdminStore) {
  global.__falconAdminStore = defaultState;
}

const store = global.__falconAdminStore;
store.heroSlides = defaultState.heroSlides;
store.announcements = defaultState.announcements;
if (!store.suspendedUserIds) {
  store.suspendedUserIds = new Set<string>();
}
if (!store.categoryVisuals) {
  store.categoryVisuals = defaultState.categoryVisuals;
}

export const AdminDataService = {
  // Announcements
  getAnnouncements() {
    const now = new Date();
    return [...store.announcements]
      .filter((a) => {
        if (!a.isActive) return false;
        if (a.startDate && new Date(a.startDate) > now) return false;
        if (a.endDate && new Date(a.endDate) < now) return false;
        return true;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },
  getAllAnnouncements() {
    return [...store.announcements].sort((a, b) => a.displayOrder - b.displayOrder);
  },
  addAnnouncement(item: Omit<AnnouncementItem, 'id'>) {
    const newItem: AnnouncementItem = {
      ...item,
      id: `ann-${Date.now()}`,
    };
    store.announcements.push(newItem);
    return newItem;
  },
  updateAnnouncement(id: string, updates: Partial<AnnouncementItem>) {
    const idx = store.announcements.findIndex((a) => a.id === id);
    if (idx !== -1) {
      store.announcements[idx] = { ...store.announcements[idx], ...updates };
      return store.announcements[idx];
    }
    return null;
  },
  deleteAnnouncement(id: string) {
    store.announcements = store.announcements.filter((a) => a.id !== id);
    return true;
  },

  // Category Visuals (Images & Icons)
  getCategoryVisuals() {
    return { ...store.categoryVisuals };
  },
  setCategoryVisual(idOrSlug: string, meta: CategoryVisualMeta) {
    store.categoryVisuals[idOrSlug] = {
      ...(store.categoryVisuals[idOrSlug] || {}),
      ...meta,
    };
    return store.categoryVisuals[idOrSlug];
  },

  // 1. Settings & Branding
  getSettings() {
    return {
      branding: store.branding,
      appearance: store.appearance,
      operations: store.operations,
      shippingPolicy: store.shippingPolicy,
    };
  },
  updateBranding(updates: Partial<StoreBrandingSettings>) {
    store.branding = { ...store.branding, ...updates };
    return store.branding;
  },
  updateAppearance(updates: Partial<StoreAppearanceSettings>) {
    store.appearance = { ...store.appearance, ...updates };
    return store.appearance;
  },
  updateOperations(updates: Partial<StoreOperationsSettings>) {
    store.operations = { ...store.operations, ...updates };
    return store.operations;
  },
  updateShippingPolicy(updates: Partial<ShippingPolicySettings>) {
    store.shippingPolicy = { ...store.shippingPolicy, ...updates };
    return store.shippingPolicy;
  },

  // 2. Shipping Zones
  getShippingZones() {
    return [...store.shippingZones];
  },
  updateShippingZone(id: string, updates: Partial<ShippingZone>) {
    const idx = store.shippingZones.findIndex((z) => z.id === id);
    if (idx !== -1) {
      store.shippingZones[idx] = { ...store.shippingZones[idx], ...updates };
      return store.shippingZones[idx];
    }
    return null;
  },
  addShippingZone(zone: Omit<ShippingZone, 'id'>) {
    const newZone: ShippingZone = {
      ...zone,
      id: `zone-${Date.now()}`,
    };
    store.shippingZones.push(newZone);
    return newZone;
  },
  deleteShippingZone(id: string) {
    store.shippingZones = store.shippingZones.filter((z) => z.id !== id);
    return true;
  },

  // 3. Homepage & Hero Slides
  getHeroSlides() {
    return [...store.heroSlides].sort((a, b) => a.displayOrder - b.displayOrder);
  },
  updateHeroSlide(id: string, updates: Partial<HeroSlide>) {
    const idx = store.heroSlides.findIndex((s) => s.id === id);
    if (idx !== -1) {
      store.heroSlides[idx] = { ...store.heroSlides[idx], ...updates };
      return store.heroSlides[idx];
    }
    return null;
  },
  addHeroSlide(slide: Omit<HeroSlide, 'id'>) {
    const newSlide: HeroSlide = { ...slide, id: `slide-${Date.now()}` };
    store.heroSlides.push(newSlide);
    return newSlide;
  },
  deleteHeroSlide(id: string) {
    store.heroSlides = store.heroSlides.filter((s) => s.id !== id);
    return true;
  },
  getHomepageSections() {
    return [...store.homepageSections].sort((a, b) => a.sortOrder - b.sortOrder);
  },
  updateHomepageSection(id: string, updates: Partial<HomepageSection>) {
    const idx = store.homepageSections.findIndex((s) => s.id === id);
    if (idx !== -1) {
      store.homepageSections[idx] = { ...store.homepageSections[idx], ...updates, updatedAt: new Date().toISOString() };
      return store.homepageSections[idx];
    }
    return null;
  },

  // 4. Product Videos
  getProductVideos() {
    if (Array.isArray(INITIAL_PRODUCT_VIDEOS)) {
      for (const initial of INITIAL_PRODUCT_VIDEOS) {
        if (!store.productVideos.some((v) => v.id === initial.id)) {
          store.productVideos.push(initial);
        }
      }
    }
    return [...store.productVideos].sort((a, b) => a.displayOrder - b.displayOrder);
  },
  updateProductVideo(id: string, updates: Partial<ProductVideo>) {
    const idx = store.productVideos.findIndex((v) => v.id === id);
    if (idx !== -1) {
      store.productVideos[idx] = { ...store.productVideos[idx], ...updates };
      return store.productVideos[idx];
    }
    return null;
  },
  addProductVideo(video: Omit<ProductVideo, 'id' | 'createdAt' | 'viewsCount'>) {
    const newVid: ProductVideo = {
      ...video,
      id: `vid-${Date.now()}`,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
    };
    store.productVideos.push(newVid);
    return newVid;
  },
  deleteProductVideo(id: string) {
    store.productVideos = store.productVideos.filter((v) => v.id !== id);
    return true;
  },

  // 5. Reviews
  getReviews() {
    return [...store.reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  updateReview(id: string, updates: Partial<ProductReview>) {
    const idx = store.reviews.findIndex((r) => r.id === id);
    if (idx !== -1) {
      store.reviews[idx] = { ...store.reviews[idx], ...updates };
      return store.reviews[idx];
    }
    return null;
  },

  // 6. Inquiries (Contact messages & bulk quotes)
  getInquiries() {
    return [...store.inquiries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  updateInquiry(id: string, updates: Partial<CustomerInquiry>) {
    const idx = store.inquiries.findIndex((i) => i.id === id);
    if (idx !== -1) {
      store.inquiries[idx] = { ...store.inquiries[idx], ...updates, updatedAt: new Date().toISOString() };
      return store.inquiries[idx];
    }
    return null;
  },
  addInquiry(inq: Omit<CustomerInquiry, 'id' | 'createdAt' | 'updatedAt'>) {
    const newInq: CustomerInquiry = {
      ...inq,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.inquiries.unshift(newInq);
    return newInq;
  },

  // 7. Email Templates
  getEmailTemplates() {
    return [...store.emailTemplates];
  },
  updateEmailTemplate(id: string, updates: Partial<EmailTemplate>) {
    const idx = store.emailTemplates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      store.emailTemplates[idx] = { ...store.emailTemplates[idx], ...updates, updatedAt: new Date().toISOString() };
      return store.emailTemplates[idx];
    }
    return null;
  },

  // 8. Printers & Fleet
  getPrinters() {
    return [...store.printers];
  },
  updatePrinter(id: string, updates: Partial<PrinterEquipment>) {
    const idx = store.printers.findIndex((p) => p.id === id);
    if (idx !== -1) {
      store.printers[idx] = { ...store.printers[idx], ...updates, updatedAt: new Date().toISOString() };
      return store.printers[idx];
    }
    return null;
  },
  addPrinter(printer: PrinterEquipment) {
    const existing = store.printers.find((p) => p.id === printer.id);
    if (existing) {
      Object.assign(existing, printer);
      return existing;
    }
    store.printers.push(printer);
    return printer;
  },

  // 9. Production Jobs
  getProductionJobs() {
    return [...store.productionJobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  updateProductionJob(id: string, updates: Partial<ProductionJob>) {
    const idx = store.productionJobs.findIndex((j) => j.id === id);
    if (idx !== -1) {
      store.productionJobs[idx] = { ...store.productionJobs[idx], ...updates, updatedAt: new Date().toISOString() };
      return store.productionJobs[idx];
    }
    return null;
  },
  addProductionJob(job: Omit<ProductionJob, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt'>) {
    const newJob: ProductionJob = {
      ...job,
      id: `job-${Date.now()}`,
      jobNumber: `JOB-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.productionJobs.unshift(newJob);
    return newJob;
  },

  // 10. Customer Notes & CRM
  getCustomerNotes(customerId: string) {
    return store.customerNotes[customerId] || [];
  },
  addCustomerNote(customerId: string, staffName: string, note: string) {
    if (!store.customerNotes[customerId]) {
      store.customerNotes[customerId] = [];
    }
    const entry = {
      id: `note-${Date.now()}`,
      staffName,
      note,
      createdAt: new Date().toISOString(),
    };
    store.customerNotes[customerId].unshift(entry);
    return entry;
  },

  // 11. Audit Logs
  getAuditLogs() {
    return [...store.auditLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  recordAudit(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) {
    const log: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    store.auditLogs.unshift(log);
    return log;
  },

  // 12. Staff & Permissions
  getStaffUsers() {
    return [...store.staffUsers];
  },
  updateStaffRole(id: string, newRole: StaffRole) {
    const user = store.staffUsers.find((u) => u.id === id);
    if (!user) return { success: false, error: 'Staff user not found' };

    // Last-owner protection
    if (user.role === 'owner' && newRole !== 'owner') {
      const remainingOwners = store.staffUsers.filter((u) => u.role === 'owner' && u.id !== id);
      if (remainingOwners.length === 0) {
        return { success: false, error: 'Cannot demote the only remaining Studio Owner. Promote another staff member to Owner first.' };
      }
    }

    user.role = newRole;
    return { success: true, user };
  },
  removeStaffUser(id: string) {
    const user = store.staffUsers.find((u) => u.id === id);
    if (!user) return { success: false, error: 'Staff user not found' };

    // Last-owner protection
    if (user.role === 'owner') {
      const remainingOwners = store.staffUsers.filter((u) => u.role === 'owner' && u.id !== id);
      if (remainingOwners.length === 0) {
        return { success: false, error: 'Cannot remove the only remaining Studio Owner.' };
      }
    }

    store.staffUsers = store.staffUsers.filter((u) => u.id !== id);
    return { success: true };
  },
  suspendStaffUser(id: string) {
    const suspended = store.suspendedUserIds || (store.suspendedUserIds = new Set<string>());
    const user = store.staffUsers.find((u) => u.id === id);
    if (user && user.role === 'owner') {
      const activeOwners = store.staffUsers.filter((u) => u.role === 'owner' && !suspended.has(u.id) && u.id !== id);
      if (activeOwners.length === 0) {
        return { success: false, error: 'Cannot suspend the only remaining active Studio Owner.' };
      }
    }
    suspended.add(id);
    if (user) user.isSuspended = true;
    return { success: true };
  },
  unsuspendStaffUser(id: string) {
    const suspended = store.suspendedUserIds || (store.suspendedUserIds = new Set<string>());
    suspended.delete(id);
    const user = store.staffUsers.find((u) => u.id === id);
    if (user) user.isSuspended = false;
    return { success: true };
  },
  isUserSuspended(id: string | undefined | null) {
    if (!id) return false;
    const suspended = store.suspendedUserIds || (store.suspendedUserIds = new Set<string>());
    if (suspended.has(id)) return true;
    const user = store.staffUsers.find((u) => u.id === id);
    return Boolean(user?.isSuspended);
  },
  getActiveOwnerCount() {
    const suspended = store.suspendedUserIds || (store.suspendedUserIds = new Set<string>());
    return store.staffUsers.filter((u) => u.role === 'owner' && !suspended.has(u.id)).length;
  },
  getStaffInvitations() {
    return [...store.staffInvitations];
  },
  addStaffInvitation(invitation: Omit<StaffInvitation, 'id' | 'createdAt'>) {
    const existing = store.staffInvitations.find((i) => i.email.toLowerCase() === invitation.email.toLowerCase() && i.status === 'pending');
    if (existing) {
      existing.role = invitation.role;
      existing.expiresAt = invitation.expiresAt;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const newInv: StaffInvitation = {
      ...invitation,
      id: `inv-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    store.staffInvitations.unshift(newInv);
    return newInv;
  },
  revokeStaffInvitation(email: string) {
    const inv = store.staffInvitations.find((i) => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending');
    if (inv) {
      inv.status = 'revoked';
      inv.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  },

  // 13. Orders & Funnels
  getOrders() {
    return [...store.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  getOrderById(id: string) {
    return store.orders.find((o) => o.id === id || o.orderNumber === id) || null;
  },
  addOrder(order: Order) {
    store.orders.unshift(order);
    return order;
  },
  updateOrder(id: string, updates: Partial<Order>) {
    const idx = store.orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (idx !== -1) {
      store.orders[idx] = {
        ...store.orders[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
        version: (store.orders[idx].version || 1) + 1,
      };
      return store.orders[idx];
    }
    return null;
  },
};
