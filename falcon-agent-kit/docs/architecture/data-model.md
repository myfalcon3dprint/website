# Data Model — Falcon 3D Prints

> Proposed PostgreSQL schema for Supabase. All monetary values in integer paise (INR × 100).

## Entity relationship diagram

```mermaid
erDiagram
    profiles ||--o{ orders : places
    profiles ||--o{ addresses : has
    profiles ||--o{ cart_items : has
    profiles ||--o{ enquiries : submits
    profiles {
        uuid id PK
        text full_name
        text phone
        text role
        timestamptz created_at
        timestamptz updated_at
    }

    categories ||--o{ products : contains
    categories ||--o{ categories : parent_of
    categories {
        uuid id PK
        text name
        text slug UK
        text description
        uuid parent_id FK
        int sort_order
        boolean is_active
        timestamptz created_at
    }

    products ||--o{ product_images : has
    products ||--o{ product_variants : has
    products ||--o{ order_items : ordered_as
    products {
        uuid id PK
        text name
        text slug UK
        text description
        text short_description
        uuid category_id FK
        text material
        text dimensions
        int weight_grams
        int base_price_paise
        text availability
        text care_info
        int lead_time_days
        boolean is_published
        text seo_title
        text seo_description
        timestamptz created_at
        timestamptz updated_at
    }

    product_images {
        uuid id PK
        uuid product_id FK
        text storage_path
        text alt_text
        int sort_order
        boolean is_primary
    }

    product_variants {
        uuid id PK
        uuid product_id FK
        text variant_type
        text variant_value
        int price_adjustment_paise
        int stock_quantity
        text sku UK
        boolean is_active
    }

    addresses {
        uuid id PK
        uuid user_id FK
        text label
        text full_name
        text phone
        text line1
        text line2
        text city
        text state
        text pincode
        text country
        boolean is_default
        timestamptz created_at
    }

    cart_items {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        uuid variant_id FK
        int quantity
        timestamptz created_at
        timestamptz updated_at
    }

    orders ||--o{ order_items : contains
    orders ||--o{ order_events : has
    orders {
        uuid id PK
        text order_number UK
        uuid user_id FK
        uuid shipping_address_id FK
        jsonb shipping_address_snapshot
        int subtotal_paise
        int shipping_paise
        int tax_paise
        int total_paise
        text currency
        text status
        text payment_status
        text razorpay_order_id
        text razorpay_payment_id
        text razorpay_signature
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        uuid variant_id FK
        jsonb product_snapshot
        int quantity
        int unit_price_paise
        int total_paise
        text production_status
        timestamptz created_at
        timestamptz updated_at
    }

    order_events {
        uuid id PK
        uuid order_id FK
        uuid order_item_id FK
        text event_type
        text old_value
        text new_value
        text notes
        uuid performed_by FK
        timestamptz created_at
    }

    enquiries {
        uuid id PK
        uuid user_id FK
        text name
        text email
        text phone
        text message
        text attachment_path
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    audit_log {
        uuid id PK
        uuid user_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb old_values
        jsonb new_values
        text ip_address
        timestamptz created_at
    }

    stock_reservations {
        uuid id PK
        uuid product_id FK
        uuid variant_id FK
        uuid order_id FK
        int quantity
        timestamptz expires_at
        text status
        timestamptz created_at
    }
```

## Table details

### `profiles`

Extends Supabase `auth.users`. Created via trigger on `auth.users` INSERT.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK, references `auth.users(id)` | Same as auth user ID |
| `full_name` | text | NOT NULL | Display name |
| `phone` | text | | Optional phone number |
| `role` | text | NOT NULL, DEFAULT 'customer' | Enum: 'customer', 'owner', 'order_manager', 'production_operator', 'support', 'catalog_editor' |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | Updated via trigger |

**RLS**: Users can read/update their own profile. Admins can read all profiles. Only owner can change roles.

### `products`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `name` | text | NOT NULL | Product display name |
| `slug` | text | NOT NULL, UNIQUE | URL-safe identifier |
| `description` | text | | Full description (supports markdown) |
| `short_description` | text | | Card/listing description |
| `category_id` | uuid | FK → categories(id) | |
| `material` | text | | e.g., "PLA", "PETG", "ABS" |
| `dimensions` | text | | e.g., "15cm × 10cm × 8cm" |
| `weight_grams` | int | | Weight in grams |
| `base_price_paise` | int | NOT NULL, CHECK (> 0) | Price in paise |
| `availability` | text | NOT NULL, DEFAULT 'in_stock' | Enum: 'in_stock', 'made_to_order', 'out_of_stock' |
| `care_info` | text | | Handling/care instructions |
| `lead_time_days` | int | | For made_to_order items |
| `is_published` | boolean | NOT NULL, DEFAULT false | Only published products show on storefront |
| `seo_title` | text | | Custom SEO title |
| `seo_description` | text | | Custom meta description |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

**RLS**: Public read for published products. Admin write.

### `orders`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `order_number` | text | NOT NULL, UNIQUE | Human-readable (e.g., "FP-20261011-001") |
| `user_id` | uuid | FK → profiles(id) | NULL for guest checkout |
| `shipping_address_snapshot` | jsonb | NOT NULL | Immutable copy of address at order time |
| `subtotal_paise` | int | NOT NULL, CHECK (>= 0) | Sum of item totals |
| `shipping_paise` | int | NOT NULL, CHECK (>= 0) | Shipping cost |
| `tax_paise` | int | NOT NULL, CHECK (>= 0) | Tax amount |
| `total_paise` | int | NOT NULL, CHECK (> 0) | Grand total |
| `currency` | text | NOT NULL, DEFAULT 'INR' | Always INR |
| `status` | text | NOT NULL, DEFAULT 'pending' | Enum: 'pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled' |
| `payment_status` | text | NOT NULL, DEFAULT 'pending' | Enum: 'pending', 'captured', 'failed', 'refunded' |
| `razorpay_order_id` | text | UNIQUE | Razorpay order reference |
| `razorpay_payment_id` | text | | Razorpay payment reference |

**RLS**: Customers see their own orders. Admins see all orders.

### `order_items`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `product_snapshot` | jsonb | NOT NULL | Immutable copy of product details at order time |
| `production_status` | text | DEFAULT 'not_applicable' | Enum: 'not_applicable', 'queued', 'printing', 'finishing', 'quality_check', 'qc_failed', 'ready', 'packed', 'shipped' |

**Production status transitions**:
- `not_applicable`: Ready-stock items skip production
- `queued` → `printing` → `finishing` → `quality_check` → `ready` → `packed` → `shipped`
- `quality_check` → `qc_failed` → `queued` (reprint)

### `stock_reservations`

Temporary stock holds during checkout.

| Column | Type | Notes |
|---|---|---|
| `expires_at` | timestamptz | Reservation expires (e.g., 30 minutes) |
| `status` | text | 'active', 'converted', 'expired', 'released' |

A background job or database function should release expired reservations.

## Indexes

```sql
-- Product lookups
CREATE INDEX idx_products_slug ON products(slug) WHERE is_published = true;
CREATE INDEX idx_products_category ON products(category_id) WHERE is_published = true;
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- Order lookups
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_razorpay ON orders(razorpay_order_id);

-- Order items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_production ON order_items(production_status) WHERE production_status != 'not_applicable';

-- Cart
CREATE INDEX idx_cart_user ON cart_items(user_id);

-- Stock reservations
CREATE INDEX idx_reservations_active ON stock_reservations(expires_at) WHERE status = 'active';
```

## Rounding rules

1. **Product price**: Stored exactly in paise. No rounding.
2. **Variant price**: `base_price_paise + price_adjustment_paise`. No rounding.
3. **Line item total**: `unit_price_paise × quantity`. No rounding (integer multiplication).
4. **Subtotal**: Sum of line item totals. No rounding.
5. **Tax**: `ROUND(subtotal_paise × tax_rate)`. Round to nearest paise. Half-up.
6. **Shipping**: Fixed amount in paise. No rounding.
7. **Grand total**: `subtotal_paise + tax_paise + shipping_paise`. No rounding.

All rounding decisions are documented and testable.
