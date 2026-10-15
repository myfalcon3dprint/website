# Cloud Infrastructure Division: Cloudflare and Supabase

This architecture document guides developers and systems engineers maintaining the Falcon 3D Prints digital manufacturing platform. It specifies the technical boundaries between Cloudflare and Supabase across storage, compute functions, and transactional records.

## 1. Architectural Division Overview

The platform uses a hybrid infrastructure model. Cloudflare handles high-bandwidth binary storage and edge authorization. Supabase handles relational data integrity, ACID transactions, and Row Level Security.

| Domain | Cloudflare | Supabase |
|---|---|---|
| **CAD File Storage** | Cloudflare R2 (`falcon-cad-models`) | Metadata reference (`custom_quotes.storage_path = 'r2://...'`) |
| **Product Media** | Cloudflare R2 (`falcon-product-images`) | Metadata URLs (`products.images = ['https://...']`) |
| **Upload Pipeline** | S3-compatible pre-signed upload URLs | Fallback storage bucket (`cad-models`) |
| **Download Pipeline** | S3-compatible pre-signed download URLs | Fallback signed URL generator |
| **Egress Bandwidth** | $0/GB (Free unlimited egress) | Metered standard bandwidth |
| **Database & Schema** | None (Stateless edge compute) | PostgreSQL 15+ (`products`, `orders`, `quotes`, `print_queue`) |
| **Security & Auth** | API route token validation | Row Level Security (RLS) policies for customers and staff |
| **State Machine** | None | Order lifecycle, printer farm queue, stock reservations |

## 2. Cloudflare Responsibilities

### 2.1 Object Storage (Cloudflare R2)

Additive manufacturing workflows produce heavy files. Customer CAD models (STL, OBJ, 3MF, STEP) often reach 50 MB to 100 MB. Serving and receiving these large files through traditional application servers consumes memory and triggers serverless execution timeouts. Cloudflare R2 resolves these constraints through two dedicated buckets:

1. `falcon-cad-models`: Private bucket containing proprietary customer 3D models uploaded through `/quote`. Files are inaccessible to the public internet and require time-limited signed URLs (15-minute TTL).
2. `falcon-product-images`: Public or CDN-cached bucket containing studio renders and print showcase galleries.

Cloudflare R2 imposes zero egress bandwidth fees. This economic advantage keeps operational costs predictable as print queue volume expands.

### 2.2 Direct Client-to-Edge Uploads

The browser uploads files directly to Cloudflare R2 rather than streaming binary payloads through Next.js server actions. 

The sequence proceeds as follows:
1. The browser requests an authorized upload ticket from `POST /api/storage/presigned-url`.
2. The server route validates the file extension and confirms the file size remains within limits (100 MB for CAD files, 10 MB for images).
3. The server invokes `@aws-sdk/s3-request-presigner` via `getR2UploadPresignedUrl()` in `src/lib/cloudflare/r2.ts`.
4. The server returns a signed HTTP `PUT` URL valid for 900 seconds.
5. The browser issues an HTTP `PUT` directly to Cloudflare R2.
6. The browser saves the canonical reference key (`r2://quotes/{timestamp}_{filename}`) into the Supabase database quote record.

## 3. Supabase Responsibilities

### 3.1 PostgreSQL System of Record

Supabase hosts the authoritative relational database. The database enforces consistency across manufacturing and commerce entities:

- `products` and `product_variants`: Master catalog data, pricing, technology specifications (FDM vs SLA), and inventory counters.
- `custom_quotes`: Slicing parameters (filament volume, infill percentage, layer height, estimated print duration) and the external storage path reference.
- `orders` and `order_items`: Customer shipping information, Razorpay payment reference IDs, and fulfillment milestones.
- `print_queue`: Live status of physical 3D printers (Bambu Lab X1C, Creality K1 Max, Elegoo Saturn 4 Ultra).
- `stock_reservations`: Atomic inventory holds during the 15-minute checkout window.

### 3.2 Authorization and Row Level Security

Supabase enforces data isolation via PostgreSQL Row Level Security:
- Customers can only read their own quotations and orders (`auth.uid() = customer_id`).
- Staff members can access operational tables through the `is_staff()` policy check.
- The Next.js server interacts with administrative tables through `SUPABASE_SERVICE_ROLE_KEY` inside protected API endpoints.

## 4. Fallback and Local Development Behavior

The platform includes graceful degradation for local development when third-party cloud credentials are unset:
- When `R2_ACCOUNT_ID` is absent, `POST /api/storage/presigned-url` returns a simulated authorization ticket.
- When Supabase credentials are empty, `src/lib/store.ts` falls back to the in-memory deterministic catalog and order store.
- Developers can test the full quoting and checkout workflow locally without active cloud subscriptions.
