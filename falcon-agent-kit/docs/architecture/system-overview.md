# System Overview — Falcon 3D Prints

## Architecture diagram

```mermaid
graph TB
    subgraph "Client (Browser)"
        SF["Storefront Pages (RSC + Client Components)"]
        AP["Admin Panel (Client Components)"]
        RC["Razorpay Checkout JS"]
    end

    subgraph "Next.js Server (Edge/Node)"
        RSC["React Server Components"]
        API["API Route Handlers (/api)"]
        SA["Server Actions"]
        MW["Middleware (Auth, Role Check)"]
    end

    subgraph "Supabase"
        AUTH["Supabase Auth"]
        DB["PostgreSQL + RLS"]
        STORE["Supabase Storage (Images, Files)"]
        RT["Realtime (optional)"]
    end

    subgraph "External Services"
        RP["Razorpay API"]
        EMAIL["Email Service (TBD)"]
    end

    SF --> RSC
    SF --> SA
    AP --> SA
    AP --> API
    RC --> RP

    RSC --> DB
    RSC --> STORE
    SA --> DB
    SA --> AUTH
    SA --> RP
    API --> DB
    API --> RP
    API --> EMAIL
    MW --> AUTH

    RP -->|"Webhooks"| API

    style SF fill:#1e293b,stroke:#f97316,color:#f8fafc
    style AP fill:#1e293b,stroke:#f97316,color:#f8fafc
    style DB fill:#0f172a,stroke:#22d3ee,color:#f8fafc
    style RP fill:#0f172a,stroke:#10b981,color:#f8fafc
```

## Component responsibilities

### Client layer

| Component | Responsibility |
|---|---|
| **Storefront pages** | Product browsing, cart, checkout, account management. React Server Components where possible, Client Components for interactivity (cart drawer, search, forms). |
| **Admin panel** | Product management, order management, production tracking, reporting. Primarily Client Components due to heavy interactivity. |
| **Razorpay Checkout JS** | Client-side payment modal. Loaded only on checkout page. Communicates directly with Razorpay, then reports back to our server. |

### Server layer

| Component | Responsibility |
|---|---|
| **React Server Components** | Data fetching, page rendering. No client-side JS shipped. Used for product pages, category pages, static content. |
| **API Route Handlers** | Webhook receivers (Razorpay), any REST-style endpoints needed by external services. Thin — delegate to feature services. |
| **Server Actions** | Mutations (add to cart, place order, update product, change order status). Server-authoritative business logic. |
| **Middleware** | Authentication check, role verification, redirect unauthenticated users, CSRF validation. |

### Data layer

| Component | Responsibility |
|---|---|
| **Supabase Auth** | User registration, login, session management, password reset, email verification. Manages JWT tokens. |
| **PostgreSQL + RLS** | All application data. Row-Level Security enforces data isolation. No direct client access to data without RLS. |
| **Supabase Storage** | Product images, enquiry file attachments. Access controlled by storage policies. |
| **Realtime** | Optional — could be used for admin notifications or live order status updates. Not required for MVP. |

### External services

| Service | Responsibility |
|---|---|
| **Razorpay** | Payment processing. Server creates orders, client displays checkout, server verifies payment, webhooks confirm asynchronous events. |
| **Email** | Transactional emails (order confirmation, password reset, enquiry notification). Provider TBD (see Q-014). Supabase handles auth emails. |

## Data flow: Purchase

```mermaid
sequenceDiagram
    participant C as Customer Browser
    participant S as Next.js Server
    participant DB as Supabase DB
    participant RP as Razorpay

    C->>S: Initiate checkout (cart items, address)
    S->>DB: Validate stock, calculate totals (server-side)
    S->>DB: Reserve stock
    S->>RP: Create Razorpay Order (amount in paise)
    RP-->>S: Order ID + details
    S-->>C: Return Razorpay Order ID

    C->>RP: Open checkout modal, complete payment
    RP-->>C: Payment ID + signature

    C->>S: Submit payment verification (order_id, payment_id, signature)
    S->>S: Verify signature (HMAC)
    S->>DB: Create order, link payment, update stock
    S-->>C: Order confirmation

    RP->>S: Webhook: payment.captured
    S->>S: Verify webhook signature
    S->>DB: Idempotent: confirm payment status
```

## Security boundaries

| Boundary | Protection |
|---|---|
| Client ↔ Server | HTTPS, CSRF tokens, input validation |
| Server ↔ Database | Supabase RLS, parameterised queries, no raw SQL from user input |
| Server ↔ Razorpay | API key auth (server-side only), HMAC signature verification |
| Admin ↔ Server | Role-based middleware, server-enforced permissions |
| Customer ↔ Customer | RLS policies enforce data isolation |
| Service role key | Never in client bundle. Only used in server-side code behind auth check. |
